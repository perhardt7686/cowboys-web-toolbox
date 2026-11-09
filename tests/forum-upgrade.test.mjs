import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {adapter,installUpgradeSchema} from './helpers/community-db.mjs';
import {validateDetails,publicDetails,easternTime,replyLocation,forumBody,saveDraft,readDraft} from '../docs/forum-core.mjs';
import {validateProfile} from '../docs/profile-core.mjs';
import {createCommunityHandler} from '../supabase/functions/community-api/handler.mjs';

test('forum identity has explicit sharing, bounded safe values and no authority fields',()=>{
  const d=validateDetails({title:'Weekend maker',occupation:'PRIVATE OCCUPATION',signature:'PRIVATE SIGNATURE',density:'compact',role:'owner'});
  const shared=publicDetails(d);assert.equal(shared.occupation,undefined);assert.equal(shared.signature,undefined);assert.equal(shared.density,undefined);assert.equal(d.role,undefined);
  assert.equal(publicDetails({...d,share_about:true}).occupation,'PRIVATE OCCUPATION');
  for(const change of [{title:'Site owner'},{share_about:'true'},{skills:Array(9).fill('skill')},{frame:'url(javascript:1)'},{signature:'x'.repeat(221)}])assert.throws(()=>validateDetails(change));
  assert.equal(validateProfile({details:{signature:'Kept private'}}).details.share_signature,false);
});
test('reply times are dated Eastern 24-hour time across daylight-saving boundaries',()=>{
  assert.match(easternTime('2026-07-08T23:09:00Z'),/19:09 EDT/u);
  assert.match(easternTime('2026-11-08T05:09:00Z'),/00:09 EST/u);
  assert.match(easternTime('2026-11-08T17:09:00Z'),/12:09 EST/u);
  assert.match(easternTime('2026-11-08T17:09:00Z'),/2026/u);assert.equal(easternTime('bad'),'Time unavailable');
  const r={author_kind:'member',location_label:'OLD PRIVATE ADDRESS'},p={published:true,account_active:true,location:'Leesburg, VA',details:{reply_location:true}};
  assert.equal(replyLocation(r,p),'Leesburg, VA');assert.equal(replyLocation(r,{...p,published:false}),'Location not supplied');assert.equal(replyLocation(r,{...p,details:{}}),'Location not supplied');
});
test('forum formatting escapes executable HTML, preserves safe links and bounds draft recovery',()=>{
  const html=forumBody('<img src=x onerror=alert(1)> **good** [i]fine[/i] `code`\n> quoted\nhttps://example.com');
  assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('<strong>good</strong>'));assert.ok(html.includes('<em>fine</em>'));assert.ok(html.includes('<blockquote>quoted</blockquote>'));assert.ok(html.includes('rel="nofollow ugc noopener noreferrer"'));
  const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};assert.equal(saveDraft(storage,'a',{body:'Unsent'}),true);assert.equal(readDraft(storage,'a').values.body,'Unsent');map.set('old',JSON.stringify({version:1,saved_at:0,values:{}}));assert.equal(readDraft(storage,'old'),null);
});

test('real Postgres enforces private extras, reply references, edits, search and visible activity',async t=>{
  const pg=new PGlite(),owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',member='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',other='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  try{
    await pg.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;insert into auth.users values('${owner}'),('${member}'),('${other}');`);
    const files=await readdir(new URL('../supabase/migrations/',import.meta.url)),base=files.find(f=>f.endsWith('_community.sql'));await pg.exec(await readFile(new URL('../supabase/migrations/'+base,import.meta.url),'utf8'));await installUpgradeSchema(pg);await pg.exec('set role service_role');
    await pg.query("insert into public.community_members(user_id,display_name,role,status,rules_version) values($1,'Cowboy','owner','approved','2026-10-23'),($2,'Maker','member','approved','2026-10-23'),($3,'Other','member','approved','2026-10-23')",[owner,member,other]);
    const users={owner:{id:owner,email:'owner@example.com',email_confirmed_at:'2026-10-24'},member:{id:member,email:'member@example.com',email_confirmed_at:'2026-10-24'},other:{id:other,email:'other@example.com',email_confirmed_at:'2026-10-24'}};
    const handler=createCommunityHandler({db:adapter(pg),catalog:[],ownerEmail:'owner@example.com',siteURL:'https://toolbox.example/community.html',allowedOrigins:['https://toolbox.example'],sendMail:async()=>{},auth:{getUser:async token=>({data:{user:users[token]},error:!users[token]})}});
    const post=async(token,payload)=>{const r=await handler(new Request('https://backend.example/community-api',{method:'POST',headers:{Origin:'https://toolbox.example','Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)}));return {status:r.status,data:await r.json()};};
    let thread,second,reply;
    await t.test('private preferences are absent from other approved members’ profile queries; anonymous reads are denied',async()=>{
      const result=await post('member',{action:'profile',displayName:'Maker',profile:{published:true,location:'Northern Virginia',details:{occupation:'PRIVATE JOB',signature:'PRIVATE SIGNATURE',density:'compact',reply_location:true}}});assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.data.profile.details.occupation,'PRIVATE JOB');
      await pg.exec('set role anon');await assert.rejects(()=>pg.query('select * from public.community_profiles'),e=>e.code==='42501');await pg.exec('reset role');await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);await pg.exec('set role authenticated');const pub=(await pg.query('select * from public.community_profiles where user_id=$1',[member])).rows[0];assert.equal(pub.details.occupation,undefined);assert.equal(pub.details.signature,undefined);assert.equal(pub.details.density,undefined);assert.equal(pub.details.reply_location,true);assert.equal((await pg.query('select * from public.community_profile_preferences')).rows.length,0);
      await pg.exec('set role authenticated');await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);assert.equal((await pg.query('select * from public.community_profile_preferences')).rows.length,0);await pg.exec('set role service_role');
      const own=await post('member',{action:'bootstrap'});assert.equal(own.data.profile.details.signature,'PRIVATE SIGNATURE');
      const legacy=await post('member',{action:'profile',displayName:'Maker',profile:{published:true,location:'Northern Virginia'}});assert.equal(legacy.status,200,JSON.stringify(legacy));assert.equal(legacy.data.profile.details.signature,'PRIVATE SIGNATURE','older cached clients preserve optional extras');
    });
    await t.test('reply references must point to a published reply in the same thread',async()=>{
      thread=(await pg.query("insert into public.community_threads(author_id,author_name,title,body,category,created_at) values($1,'Maker','Useful question here','A longer useful question body.','help','2026-10-23') returning *",[member])).rows[0];
      second=(await pg.query("insert into public.community_threads(author_id,author_name,title,body,category) values($1,'Other','A second question','A second long question body.','help') returning *",[other])).rows[0];
      reply=(await pg.query("insert into public.community_replies(thread_id,author_id,author_name,body,created_at) values($1,$2,'Maker','Needlequartz public reply','2026-11-08T12:00:00Z') returning *",[thread.id,member])).rows[0];
      const wrong=await post('other',{action:'reply',threadId:second.id,replyToId:reply.id,body:'A reply to the wrong thread'});assert.equal(wrong.status,400);
      const ref=(await pg.query("insert into public.community_replies(thread_id,author_id,author_name,body,reply_to_id) values($1,$2,'Other','A proper response',$3) returning *",[thread.id,other,reply.id])).rows[0];assert.equal(ref.reply_to_id,reply.id);assert.equal(ref.location_label,'');
    });
    await t.test('edit authorization and edited timestamps are enforced on the server',async()=>{
      assert.equal((await post('other',{action:'edit_reply',replyId:reply.id,body:'Unauthorized correction'})).status,403);
      const edit=await post('member',{action:'edit_reply',replyId:reply.id,body:'Needlequartz corrected reply'});assert.equal(edit.status,200,JSON.stringify(edit));assert.ok(edit.data.reply.edited_at);assert.equal(Date.parse(edit.data.reply.created_at),reply.created_at.getTime());
      await pg.query('update public.community_threads set locked=true where id=$1',[thread.id]);assert.equal((await post('member',{action:'edit_reply',replyId:reply.id,body:'Correction in a closed thread'})).status,409);await pg.query('update public.community_threads set locked=false where id=$1',[thread.id]);
    });
    await t.test('search sees published replies and counters retract hidden reply activity',async()=>{
      await pg.query("insert into public.community_replies(thread_id,author_id,author_name,body,status,created_at) values($1,$2,'Maker','Secretruby held text','held','2027-01-01')",[thread.id,member]);
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);await pg.exec('set role authenticated');assert.equal((await pg.query("select id from public.community_search_threads('Needlequartz')")).rows[0].id,thread.id);assert.equal((await pg.query("select id from public.community_search_threads('Secretruby')")).rows.length,0);assert.equal((await pg.query('select visible_reply_count from public.community_threads where id=$1',[thread.id])).rows[0].visible_reply_count,2);
      await pg.exec('set role service_role');await pg.query("update public.community_replies set status='hidden' where thread_id=$1 and id<>$2",[thread.id,reply.id]);const row=(await pg.query('select * from public.community_threads where id=$1',[thread.id])).rows[0];assert.equal(row.visible_reply_count,1);assert.equal(row.last_reply_at.toISOString(),'2026-11-08T12:00:00.000Z');
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);await pg.exec('set role authenticated');assert.equal((await pg.query("select id from public.community_search_threads('Secretruby')")).rows.length,0);
    });
  }finally{await pg.close();}
});
