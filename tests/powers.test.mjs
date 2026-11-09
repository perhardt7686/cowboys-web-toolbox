import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {adapter,installUpgradeSchema} from './helpers/community-db.mjs';
import {createCommunityHandler} from '../supabase/functions/community-api/handler.mjs';
import {POWERS,POWER_IDS,validateRank,validatePowerChange,publicHonor} from '../docs/powers-core.mjs';

test('rank and enhancement inputs whitelist capabilities and styles without staff impersonation',()=>{
  assert.equal(POWERS.length,16);assert.equal(new Set(POWER_IDS).size,16);
  const rank=validateRank({name:'Archivist',level:210,capabilities:['posts.note','posts.note'],role:'owner',color:'gold'});assert.deepEqual(rank.capabilities,['posts.note']);assert.equal(rank.role,undefined);
  for(const input of [{name:'Owner',level:900,capabilities:[]},{name:'Nice rank',level:1000,capabilities:[]},{name:'Nice rank',level:1,capabilities:['database.admin']},{name:'Nice rank',level:1,capabilities:[],color:'url(javascript:x)'}])assert.throws(()=>validateRank(input));
  assert.throws(()=>validatePowerChange({kind:'honor',data:{badge:'Moderator'},reason:'Recognize a contribution'}));
  assert.throws(()=>validatePowerChange({kind:'note',data:{note:'sb_secret_abcdefghijklmnop'},reason:'Add a useful note'}));
  assert.equal(publicHonor({rank_label:'Curator',member_opt_out:true}),null);assert.equal(publicHonor({rank_label:'Curator',rank_expires_at:'2000-01-01'}).rank_label,'');
});

test('real Postgres enforces hierarchy, grants, expiry, scoped curation, revision history and opt-out',async t=>{
  const pg=new PGlite(),ids={owner:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',steward:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',curator:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',basic:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',peer:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',scoped:'ffffffff-ffff-4fff-8fff-ffffffffffff'};
  try{
    await pg.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
    for(const id of Object.values(ids))await pg.query('insert into auth.users values($1)',[id]);
    const files=await readdir(new URL('../supabase/migrations/',import.meta.url)),base=files.find(f=>f.endsWith('_community.sql'));await pg.exec(await readFile(new URL('../supabase/migrations/'+base,import.meta.url),'utf8'));await installUpgradeSchema(pg);await pg.exec('set role service_role');
    for(const [name,id] of Object.entries(ids))await pg.query("insert into public.community_members(user_id,display_name,role,status,rules_version) values($1,$2,$3,'approved','2026-10-23')",[id,name==='owner'?'Cowboy':name+' person',name==='owner'?'owner':'member']);
    const users=Object.fromEntries(Object.entries(ids).map(([name,id])=>[name,{id,email:name==='owner'?'owner@example.com':name+'@example.com',email_confirmed_at:'2026-10-24',user_metadata:{role:'owner',level:1000}}]));
    const handler=createCommunityHandler({db:adapter(pg),catalog:[],ownerEmail:'owner@example.com',siteURL:'https://toolbox.example/community.html',allowedOrigins:['https://toolbox.example'],sendMail:async()=>{},auth:{getUser:async token=>({data:{user:users[token]},error:!users[token]})}});
    const post=async(token,payload)=>{const r=await handler(new Request('https://backend.example/community-api',{method:'POST',headers:{Origin:'https://toolbox.example','Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)}));return {status:r.status,data:await r.json()};};
    const ok=async(token,payload)=>{const r=await post(token,payload);assert.equal(r.status,200,JSON.stringify(r));return r.data;};
    const grant=async(token,user,roleId,scopes=[],hours=0)=>{const revision=(await pg.query('select revision from public.community_power_grants where user_id=$1',[ids[user]])).rows[0]?.revision||0;return post(token,{action:'power_assign',userId:ids[user],roleId,scopes,hours,revision,confirm:true});};
    const topic=async(author,category='repair')=>(await pg.query("insert into public.community_threads(author_id,author_name,title,body,category) values($1,$2,'A useful original topic','This is the original longer topic text.',$3) returning *",[ids[author],author+' person',category])).rows[0];
    const reply=async(thread,author,body='An original useful reply.')=>(await pg.query("insert into public.community_replies(thread_id,author_id,author_name,body) values($1,$2,$3,$4) returning *",[thread.id,ids[author],author+' person',body])).rows[0];
    const apply=async(token,kind,targetKind,targetId,data={},reason='Make this contribution more useful')=>{const table=targetKind==='member'?'community_member_honors':targetKind==='reply'?'community_replies':'community_threads',key=targetKind==='member'?'user_id':'id',revision=(await pg.query(`select power_revision from public.${table} where ${key}=$1`,[targetId])).rows[0]?.power_revision||0;return post(token,{action:'power_apply',confirm:true,change:{kind,targetKind,targetId,revision,data,reason}});};
    let source,dest,creative,originalReply,moved;
    await t.test('migration grants nobody a rank; only verified owner gets all powers and raw browser grants are denied',async()=>{
      assert.equal((await pg.query('select count(*)::int n from public.community_power_grants')).rows[0].n,0);assert.equal((await ok('owner',{action:'power_state'})).rank.capabilities.length,16);assert.equal((await ok('basic',{action:'power_state'})).rank.level,0);
      assert.equal((await post('basic',{action:'power_rank',confirm:true,rank:{name:'Bogus',level:900,capabilities:POWER_IDS}})).status,403);
      await pg.exec('set role anon');for(const sql of ['select * from public.community_power_roles','select * from public.community_power_grants','select * from public.community_power_history',`select public.community_power_state('${ids.owner}')`])await assert.rejects(()=>pg.query(sql));await pg.exec('set role authenticated');await assert.rejects(()=>pg.query("insert into public.community_power_roles(id,name,level) values('fake','Fake',900)"));await pg.exec('set role service_role');
    });
    await t.test('owner defines ranks; delegation cannot promote self, owner, peers or greater capabilities',async()=>{
      for(const [user,role,scopes,hours] of [['steward','steward',[],0],['curator','curator',[],0],['peer','curator',[],0],['scoped','moderator',['repair'],24]])assert.equal((await grant('owner',user,role,scopes,hours)).status,200);
      assert.equal((await grant('steward','basic','guide')).status,200);assert.equal((await grant('basic','peer','guide')).status,403);assert.equal((await grant('steward','steward','curator')).status,403);assert.equal((await grant('steward','owner','guide')).status,403);assert.equal((await grant('steward','peer','steward')).status,403);
      const rank=await ok('owner',{action:'power_rank',confirm:true,rank:{name:'Archivist',level:850,color:'gold',description:'Owner defined.',capabilities:POWER_IDS}});assert.ok(rank.rank.id);assert.equal((await grant('steward','peer',rank.rank.id)).status,403);
      const console=await ok('owner',{action:'power_console'});assert.ok(console.members.every(m=>m.email===undefined));assert.equal((await post('basic',{action:'power_apply',change:{kind:'label'}})).status,400);
    });
    await t.test('scope and hierarchy are checked from current database state on every action',async()=>{
      source=await topic('basic');dest=await topic('basic');creative=await topic('basic','creative');const ownTopic=await topic('owner');
      assert.equal((await apply('scoped','style','thread',source.id,{accent:'gold',frame:'glow'})).status,200);
      assert.equal((await apply('scoped','style','thread',creative.id,{accent:'gold',frame:'glow'})).status,403);assert.equal((await apply('steward','note','thread',ownTopic.id,{note:'Try this note.'})).status,403);
      assert.equal((await apply('curator','honor','member',ids.peer,{title:'Useful person',badge:'Good find'})).status,403);assert.equal((await apply('scoped','honor','member',ids.basic,{title:'Useful person',badge:'Good find'})).status,403);
      await pg.query("update public.community_power_grants set expires_at=now()-interval '1 second' where user_id=$1",[ids.scoped]);assert.equal((await ok('scoped',{action:'power_state'})).rank.level,0);assert.equal((await apply('scoped','style','thread',source.id,{accent:'gold',frame:'glow'})).status,403);assert.equal((await grant('owner','scoped','moderator',['repair'],24)).status,200);
    });
    await t.test('delegates cannot broaden board scopes or outlast their own grant',async()=>{
      const rank=await ok('owner',{action:'power_rank',confirm:true,rank:{name:'Workshop steward',level:620,color:'teal',description:'Scoped delegation.',capabilities:['posts.note','posts.label','members.honor','ranks.delegate']}});
      assert.equal((await grant('owner','scoped',rank.rank.id,['repair'],24)).status,200);
      assert.equal((await grant('scoped','basic','guide',[],1)).status,403);
      assert.equal((await grant('scoped','basic','guide',['creative'],1)).status,403);
      assert.equal((await grant('scoped','basic','guide',['repair'],0)).status,403);
      assert.equal((await grant('scoped','basic','guide',['repair'],48)).status,403);
      assert.equal((await grant('scoped','basic','guide',['repair'],1)).status,200);
      assert.deepEqual((await ok('basic',{action:'power_state'})).scopes,['repair']);
      assert.equal((await grant('owner','basic','guide')).status,200);
      assert.equal((await grant('owner','scoped','moderator',['repair'],24)).status,200);
    });
    await t.test('editing retains attribution and creation time, saves a reason and supports guarded undo',async()=>{
      const before=(await pg.query('select * from public.community_threads where id=$1',[source.id])).rows[0];const edit=await apply('steward','edit','thread',source.id,{title:'A clearer topic title',body:'This is a clearer version of the useful original topic.'});assert.equal(edit.status,200,JSON.stringify(edit));
      const after=(await pg.query('select * from public.community_threads where id=$1',[source.id])).rows[0];assert.equal(after.author_id,before.author_id);assert.equal(after.author_name,before.author_name);assert.equal(after.created_at.getTime(),before.created_at.getTime());assert.equal(after.enhancements.edited_by,'steward person');
      assert.equal((await post('curator',{action:'power_undo',receipt:edit.data.receipt,confirm:true})).status,403);const compare=await ok('owner',{action:'power_compare',receipt:edit.data.receipt});assert.equal(compare.before.body,before.body);assert.equal(compare.after.body,after.body);
      assert.equal((await post('steward',{action:'power_undo',receipt:edit.data.receipt,confirm:true})).status,200);assert.equal((await post('steward',{action:'power_undo',receipt:edit.data.receipt,confirm:true})).status,409);
      const note=await apply('steward','note','thread',source.id,{note:'One additional tip.'});assert.equal(note.status,200);await pg.query("update public.community_threads set body='The author added a useful new explanation.' where id=$1",[source.id]);assert.equal((await post('steward',{action:'power_undo',receipt:note.data.receipt,confirm:true})).status,409);
    });
    await t.test('reply moves and splits preserve authors, retract source counts, and undo safely',async()=>{
      originalReply=await reply(source,'basic');await reply(source,'peer');const originalName=originalReply.author_name;const move=await apply('scoped','move','thread',source.id,{replyIds:[originalReply.id],toThreadId:creative.id});assert.equal(move.status,403);
      moved=await apply('steward','move','thread',source.id,{replyIds:[originalReply.id],toThreadId:dest.id});assert.equal(moved.status,200,JSON.stringify(moved));let r=(await pg.query('select * from public.community_replies where id=$1',[originalReply.id])).rows[0];assert.equal(r.thread_id,dest.id);assert.equal(r.author_name,originalName);assert.equal(r.created_at.getTime(),originalReply.created_at.getTime());assert.equal((await pg.query('select visible_reply_count from public.community_threads where id=$1',[source.id])).rows[0].visible_reply_count,1);
      assert.equal((await post('steward',{action:'power_undo',receipt:moved.data.receipt,confirm:true})).status,200);
      const split=await apply('steward','split','thread',source.id,{replyIds:[originalReply.id],title:'A new room for this useful idea',category:'repair'});assert.equal(split.status,200,JSON.stringify(split));assert.ok(split.data.toThreadId);r=(await pg.query('select * from public.community_replies where id=$1',[originalReply.id])).rows[0];assert.equal(r.thread_id,split.data.toThreadId);assert.equal(r.author_name,originalName);assert.equal((await post('steward',{action:'power_undo',receipt:split.data.receipt,confirm:true})).status,200);
      assert.equal((await pg.query('select status from public.community_threads where id=$1',[split.data.toThreadId])).rows[0].status,'hidden');
    });
    await t.test('normal author edits clear stale staff attribution and invalidate older undo receipts',async()=>{
      const polish=await apply('steward','edit','reply',originalReply.id,{body:'A helpful staff clarification.'});assert.equal(polish.status,200);
      const edited=await ok('basic',{action:'edit_reply',replyId:originalReply.id,body:'The author corrected their own reply again.'});assert.equal(edited.reply.enhancements.edited_by,undefined);assert.equal((await post('steward',{action:'power_undo',receipt:polish.data.receipt,confirm:true})).status,409);
    });
    await t.test('a delegated review hold requires owner release, including through undo',async()=>{
      const r=await reply(source,'basic');const hold=await apply('steward','review','reply',r.id);assert.equal(hold.status,200);
      assert.equal((await post('steward',{action:'power_undo',receipt:hold.data.receipt,confirm:true})).status,403);
      assert.equal((await post('owner',{action:'power_undo',receipt:hold.data.receipt,confirm:true})).status,200);
      assert.equal((await pg.query('select status from public.community_replies where id=$1',[r.id])).rows[0].status,'published');
    });
    await t.test('member honors remain cosmetic and the member can withdraw display without losing their rank',async()=>{
      assert.equal((await apply('curator','honor','member',ids.basic,{title:'Helpful tinkerer',badge:'Good company'})).status,200);assert.equal((await apply('curator','member_style','member',ids.basic,{accent:'gold',aura:'halo'})).status,200);assert.equal((await ok('basic',{action:'power_state'})).rank.id,'guide');
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[ids.owner]);await pg.exec('set role authenticated');assert.ok((await pg.query('select * from public.community_member_honors where user_id=$1',[ids.basic])).rows.length);await pg.exec('set role service_role');
      await ok('basic',{action:'profile',displayName:'basic person',profile:{published:false,details:{accept_flair:false}}});await pg.exec('set role authenticated');assert.equal((await pg.query('select * from public.community_member_honors where user_id=$1',[ids.basic])).rows.length,0);await pg.exec('set role service_role');assert.equal((await ok('basic',{action:'power_state'})).rank.id,'guide');
      await ok('basic',{action:'profile',displayName:'basic person',profile:{published:false,details:{title:'An older client save'}}});assert.equal((await pg.query('select details from public.community_profile_preferences where user_id=$1',[ids.basic])).rows[0].details.accept_flair,false);
    });
    await t.test('disabling a rank revokes its powers immediately and newer revisions cannot be overwritten',async()=>{
      const c=await ok('owner',{action:'power_console'}),rank=c.roles.find(r=>r.id==='curator');const r=await ok('owner',{action:'power_rank',confirm:true,rank:{...rank,active:false}});assert.equal((await ok('curator',{action:'power_state'})).rank.level,0);assert.equal((await apply('curator','label','thread',source.id,{label:'A useful one'})).status,403);
      assert.equal((await post('owner',{action:'power_rank',confirm:true,rank:{...rank,active:true}})).status,409);await ok('owner',{action:'power_rank',confirm:true,rank:{...r.rank,active:true}});
      assert.equal((await grant('owner','basic',null)).status,200);assert.equal((await ok('basic',{action:'power_state'})).rank.capabilities.length,0);
    });
  }finally{await pg.close();}
});
