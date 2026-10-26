import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {adapter,installUpgradeSchema} from './helpers/community-db.mjs';
import {validateLabPost,formatPostBody,canonicalHost} from '../docs/lab-core.mjs';
import {createCommunityHandler} from '../supabase/functions/community-api/handler.mjs';
import {createProgramsHandler} from '../supabase/functions/community-programs/handler.mjs';
import {createActivityHandler} from '../supabase/functions/website-activity/handler.mjs';
import {runInNewContext} from 'node:vm';

const ids={owner:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',maker:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',reader:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',pending:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'};
const catalog=JSON.parse(await readFile(new URL('../docs/catalog.json',import.meta.url),'utf8')).sites;
test('public catalog CSV exports neutralize spreadsheet formulas in community-supplied text',async()=>{
  const source=await readFile(new URL('../docs/app.js',import.meta.url),'utf8');
  const fn=source.match(/function csvCell\(value\)\{[\s\S]*?\n\}/u)?.[0];assert.ok(fn);
  const cell=runInNewContext(fn+';csvCell');
  for(const value of ['=HYPERLINK("https://example.com")',' +SUM(1,2)','@SUM(A1)','\tformula'])assert.ok(cell(value).startsWith('"\''));
  assert.equal(cell('A "useful" site'),'"A ""useful"" site"');
});
test('94 catalog entries retain honest origins, unique domains and explicit check scopes',()=>{
  assert.equal(catalog.length,94);assert.equal(catalog.filter(s=>s.origin==='web').length,25);
  const newHosts=new Set(catalog.filter(s=>s.origin==='web').map(s=>canonicalHost(s.url)));const oldHosts=new Set(catalog.filter(s=>s.origin!=='web').map(s=>canonicalHost(s.url)));assert.equal(newHosts.size,25);assert.equal([...newHosts].filter(h=>oldHosts.has(h)).length,0);
  for(const s of catalog.filter(s=>s.origin==='web')){assert.deepEqual(s.sources,[]);assert.ok(s.evidenceUrls[0].startsWith('https://'));assert.ok(s.destinationCheck.notes);assert.ok(s.accessLabel);}
});
test('guided post data is bounded, whitelisted and honest about existing destinations',()=>{
  const request=validateLabPost({postKind:'request',postData:{goal:'Shrink my project picture',device:'Android / Chrome',role:'owner',secret:'discard'}},catalog);
  assert.equal(request.post_data.role,undefined);assert.equal(request.post_data.secret,undefined);assert.match(formatPostBody('request',request.post_data),/My goal/);
  assert.throws(()=>validateLabPost({postKind:'discovery',postData:{url:'https://www.photopea.com/'}},catalog),/already in the toolbox/);
  assert.throws(()=>validateLabPost({postKind:'discovery',postData:{url:'https://person:secret@example.com/'}},catalog),/credentials/);
  assert.throws(()=>validateLabPost({postKind:'poll',postData:{options:['Yes','YES']}},catalog),/different/);
  assert.throws(()=>validateLabPost({postKind:'challenge',postData:{}},catalog),/Cowboy/);
  assert.throws(()=>validateLabPost({postKind:'review',siteId:'invented',postData:{}},catalog),/choose the tool/);
});
test('community lab transactions, privacy, permissions and subscriber-only programs',async t=>{
  const pg=new PGlite();let mails=[];
  await pg.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
  for(const id of Object.values(ids))await pg.query('insert into auth.users(id) values($1)',[id]);
  const base=(await readdir(new URL('../supabase/migrations/',import.meta.url))).find(f=>f.endsWith('_community.sql'));
  await pg.exec(await readFile(new URL('../supabase/migrations/'+base,import.meta.url),'utf8'));await installUpgradeSchema(pg);
  for(const [key,id]of Object.entries(ids))await pg.query("insert into public.community_members(user_id,display_name,role,status,rules_version) values($1,$2,$3,$4,'2026-10-23')",[id,key==='owner'?'Cowboy':key,key==='owner'?'owner':'member',key==='pending'?'pending':'approved']);
  await pg.exec('set role service_role');const db=adapter(pg);
  const users=Object.fromEntries(Object.entries(ids).map(([key,id])=>[key,{id,email:key+'@example.com',email_confirmed_at:'2026-10-25',user_metadata:{role:'owner'}}]));
  const handler=createCommunityHandler({db,auth:{getUser:async key=>({data:{user:users[key]},error:!users[key]})},sendMail:async m=>mails.push(m),catalog,ownerEmail:'owner@example.com',siteURL:'https://toolbox.example/community.html',allowedOrigins:['https://toolbox.example']});
  const post=async(key,payload)=>{const r=await handler(new Request('https://api.example/community-api',{method:'POST',headers:{Origin:'https://toolbox.example',Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(payload)}));return {status:r.status,data:await r.json()};};
  const rpc=async(name,args)=>{const r=await db.rpc(name,args);assert.equal(r.error,null,JSON.stringify(r.error));return r.data;};
  const mutate=(key,kind,data)=>post(key,{action:'hub_mutate',kind,data});
  const create=async(key,kind,data={},siteId='excalidraw')=>{await pg.exec('delete from public.community_rate_limits');const r=await post(key,{action:'create_thread',title:'A useful '+kind+' conversation',body:'A concrete task and useful context for this conversation.',category:kind==='request'?'help':kind==='discovery'?'discoveries':'creative',siteId,postKind:kind,postData:data});assert.equal(r.status,200,JSON.stringify(r));return r.data.thread;};
  const as=async(role,id='')=>{await pg.exec('reset role');await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await pg.exec('set role '+role);};
  let request,poll,discovery,project,replyID,addedID;
  try{
    await t.test('approved members create structured requests and follow atomically; pending and forged owners are rejected',async()=>{
      request=await create('maker','request',{goal:'Make a clear room plan',device:'Windows / Firefox',role:'owner'});
      assert.equal(request.post_data.role,undefined);assert.equal(request.post_kind,'request');
      assert.equal((await pg.query('select following from public.community_choices where thread_id=$1',[request.id])).rows[0].following,true);
      assert.equal((await mutate('pending','following',{threadId:request.id,enabled:true})).status,400);
      assert.equal((await post('maker',{action:'hub_owner',kind:'overview'})).status,403);
    });
    await t.test('helpful votes are idempotent, self-votes fail, choices and saved threads are private',async()=>{
      for(let i=0;i<2;i++)assert.equal((await mutate('reader','helpful',{threadId:request.id,enabled:true})).status,200);
      assert.equal((await pg.query('select helpful_count from public.community_threads where id=$1',[request.id])).rows[0].helpful_count,1);
      assert.equal((await mutate('maker','helpful',{threadId:request.id,enabled:true})).status,400);
      await mutate('reader','saved',{threadId:request.id,enabled:true});await mutate('reader','following',{threadId:request.id,enabled:true});
      await as('authenticated',ids.reader);assert.equal((await pg.query('select * from public.community_choices')).rows.length,1);
      await assert.rejects(()=>pg.query("update public.community_choices set helpful=true"));await assert.rejects(()=>pg.query("select public.community_hub_mutate($1,'saved','{}')",[ids.maker]));
      await as('anon');await assert.rejects(()=>pg.query('select * from public.community_choices'));await as('service_role');
    });
    await t.test('public replies notify followers; only author or owner accepts an appropriate member answer',async()=>{
      const r=await post('reader',{action:'reply',threadId:request.id,body:'Excalidraw can make a useful sketch of that project.'});assert.equal(r.status,200,JSON.stringify(r));replyID=r.data.reply.id;
      assert.equal((await pg.query('select human_reply_count from public.community_threads where id=$1',[request.id])).rows[0].human_reply_count,1);
      assert.equal((await pg.query('select count(*) n from public.community_notifications where user_id=$1',[ids.maker])).rows[0].n,1);
      assert.equal((await mutate('reader','accept_answer',{threadId:request.id,replyId:replyID})).status,400);
      assert.equal((await mutate('maker','accept_answer',{threadId:request.id,replyId:replyID})).status,200);
      assert.equal((await pg.query("select count(*) n from public.community_badges where badge='Helpful Hand' and active")).rows[0].n,1);
      const ed=await pg.query("insert into public.community_replies(thread_id,author_name,author_kind,body) values($1,'Edward','edward','An automated suggestion') returning id",[request.id]);
      assert.equal((await mutate('maker','accept_answer',{threadId:request.id,replyId:ed.rows[0].id})).status,400);
      await pg.query("update public.community_replies set status='hidden' where id=$1",[replyID]);
      assert.equal((await pg.query('select accepted_reply_id from public.community_threads where id=$1',[request.id])).rows[0].accepted_reply_id,null);
      assert.equal((await pg.query("select count(*) n from public.community_badges where badge='Helpful Hand' and active")).rows[0].n,0);
    });
    await t.test('polls count one choice per member and update rather than multiplying votes',async()=>{
      poll=await create('maker','poll',{options:['A drawing challenge','A repair challenge']});
      for(const choice of [0,0,1])assert.equal((await mutate('reader','poll_vote',{threadId:poll.id,choice})).status,200);
      assert.deepEqual((await pg.query('select poll_counts from public.community_threads where id=$1',[poll.id])).rows[0].poll_counts,[0,1]);
      assert.equal((await mutate('reader','poll_vote',{threadId:poll.id,choice:9})).status,400);
      await pg.query('update public.community_threads set locked=true where id=$1',[poll.id]);assert.equal((await mutate('reader','poll_vote',{threadId:poll.id,choice:0})).status,400);
    });
    await t.test('member experiences feed aggregate site notes without exposing held conversations',async()=>{
      const review=await create('reader','review',{task:'Sketch a plan of the workshop',device:'Chrome / Linux',outcome:'worked',checked:'2026-10-25'});
      assert.equal((await pg.query("select worked_count from public.community_site_activity where site_id='excalidraw'")).rows[0].worked_count,1);
      await pg.query("update public.community_threads set status='held' where id=$1",[review.id]);
      assert.equal((await pg.query("select worked_count from public.community_site_activity where site_id='excalidraw'")).rows[0].worked_count,0);
      const reports=await mutate('reader','site_report',{siteId:'photopea',reason:'signup',details:'A changed requirement observed today.'});assert.equal(reports.status,200,JSON.stringify(reports));
      assert.equal(mails.at(-1).to,'owner@example.com');assert.equal((await post('owner',{action:'hub_owner',kind:'resolve_site_report',confirm:true,data:{id:reports.data.id}})).status,200);await as('authenticated',ids.reader);await assert.rejects(()=>pg.query('select * from public.community_site_reports'));await as('service_role');
    });
    await t.test('owner discovery approval publishes a credited catalog entry and counter, and can withdraw it',async()=>{
      discovery=await create('maker','discovery',{url:'https://useful-example.org/',name:'Useful Example',useCase:'Organize a practical project in your browser.',tried:'I made a simple plan and exported the result.',credit:true});
      const payload={action:'hub_owner',kind:'review_discovery',data:{threadId:discovery.id,status:'added',category:'Utilities'}};
      assert.equal((await post('owner',payload)).status,400);
      const r=await post('owner',{...payload,confirm:true});assert.equal(r.status,200,JSON.stringify(r));addedID=r.data.siteId;
      assert.match(addedID,/^find-/);assert.equal((await pg.query('select credit_name from public.community_catalog_additions where id=$1',[addedID])).rows[0].credit_name,'maker');
      await as('anon');assert.equal((await pg.query('select count(*) n from public.community_catalog_additions')).rows[0].n,1);await assert.rejects(()=>pg.query('insert into public.community_catalog_additions(id) values(\'fake\')'));await as('service_role');
      const activity=createActivityHandler({db,catalog,allowedOrigins:['https://toolbox.example']});const click=await activity(new Request('https://api.example/activity',{method:'POST',headers:{Origin:'https://toolbox.example','Content-Type':'application/json'},body:JSON.stringify({siteId:addedID,eventId:crypto.randomUUID()})}));assert.equal(click.status,200);assert.equal((await click.json()).clicks,1);
      assert.equal((await pg.query('select thread_count from public.community_site_activity where site_id=$1',[addedID])).rows[0].thread_count,1);
      await pg.query("update public.community_threads set status='hidden' where id=$1",[discovery.id]);
      assert.equal((await pg.query('select published from public.community_catalog_additions where id=$1',[addedID])).rows[0].published,false);
      await as('anon');assert.equal((await pg.query('select count(*) n from public.community_catalog_additions')).rows[0].n,0);await as('service_role');
      await pg.query("update public.community_threads set status='published' where id=$1",[discovery.id]);
      const republish=await post('owner',{...payload,confirm:true,data:{...payload.data,name:'Useful Example Updated',description:'An updated practical description after owner review.'}});assert.equal(republish.status,200,JSON.stringify(republish));
      assert.equal((await pg.query('select name from public.community_catalog_additions where id=$1',[addedID])).rows[0].name,'Useful Example Updated');
      assert.equal((await post('owner',{...payload,confirm:true,data:{threadId:discovery.id,status:'needs-check'}})).status,200);
      await as('anon');assert.equal((await pg.query('select count(*) n from public.community_catalog_additions')).rows[0].n,0);await as('service_role');
    });
    await t.test('featured project badges are cosmetic and cannot be granted by members',async()=>{
      project=await create('maker','project',{goal:'Make a practical project plan',tools:['excalidraw'],steps:'Sketch the idea and arrange the important parts.',result:'A useful plan to share with the team.',tip:'Keep the first version simple.'});
      const p={action:'hub_owner',kind:'feature_project',confirm:true,data:{threadId:project.id,enabled:true}};
      assert.equal((await post('maker',p)).status,403);assert.equal((await post('owner',p)).status,200);
      assert.equal((await pg.query("select count(*) n from public.community_badges where badge='Maker' and active")).rows[0].n,1);
      assert.equal((await pg.query('select role from public.community_members where user_id=$1',[ids.maker])).rows[0].role,'member');
    });
    await t.test('owner editorial publishing is confirmed and idempotent; private program tables stay private',async()=>{
      const p={action:'hub_owner',kind:'publish_prompt',slug:'permanent-bookmarks',confirm:true};const a=await post('owner',p),b=await post('owner',p);assert.equal(a.status,200,JSON.stringify(a));assert.equal(b.data.threadId,a.data.threadId);assert.equal(b.data.created,false);
      await rpc('community_hub_owner',{p_actor:ids.owner,p_action:'overview',p_data:{}});await rpc('community_programs_overview',{p_actor:ids.owner});
      const overview=await post('owner',{action:'hub_owner',kind:'overview'});assert.equal(overview.status,200,JSON.stringify(overview));assert.equal(overview.data.editorial.length,14);
      await as('anon');for(const table of ['community_worker_capability','community_digest_jobs','community_editorial'])await assert.rejects(()=>pg.query('select * from public.'+table));await as('service_role');
    });
    await t.test('weekly worker requires a one-use capability, creates one challenge, and sends only after explicit consent',async()=>{
      assert.equal((await post('reader',{action:'hub_state'})).data.digestEnabled,false);
      await mutate('reader','digest',{enabled:true});await mutate('maker','digest',{enabled:true});
      await pg.query("update public.community_members set status='suspended' where user_id=$1",[ids.maker]);
      const token='a'.repeat(64);await pg.query("insert into public.community_worker_capability(id,token_hash,expires_at) values('weekly',encode(sha256(convert_to($1,'UTF8')),'hex'),now()+interval '10 minutes')",[token]);
      const worker=createProgramsHandler({db,auth:{getUserById:async id=>({data:{user:Object.values(users).find(u=>u.id===id)}})},sendDigest:async m=>mails.push(m),siteURL:'https://toolbox.example/community.html',allowedOrigins:['https://toolbox.example']});
      const send=token=>worker(new Request('https://api.example/programs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'run',token})}));
      assert.equal((await send('f'.repeat(64))).status,401);const before=mails.length;const r=await send(token);assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).accepted,1);
      assert.equal(mails.length,before+1);assert.equal(mails.at(-1).to,'reader@example.com');assert.match(mails.at(-1).text,/unsubscribe=/);assert.doesNotMatch(mails.at(-1).text,/SMTP|service_role|private report/i);
      assert.equal((await send(token)).status,401);assert.equal((await pg.query("select count(*) n from public.community_threads where challenge_week is not null")).rows[0].n,1);
      const pref=(await pg.query('select unsubscribe_token from public.community_preferences where user_id=$1',[ids.reader])).rows[0];
      const stop=await worker(new Request('https://api.example/programs',{method:'POST',headers:{Origin:'https://toolbox.example','Content-Type':'application/json'},body:JSON.stringify({action:'unsubscribe',token:pref.unsubscribe_token})}));assert.equal((await stop.json()).unsubscribed,true);
      assert.equal((await pg.query('select digest_enabled from public.community_preferences where user_id=$1',[ids.reader])).rows[0].digest_enabled,false);
      assert.equal((await rpc('community_digest_unsubscribe',{p_token:'f'.repeat(64)})).unsubscribed,false);
      await as('authenticated',ids.reader);await assert.rejects(()=>pg.query('select unsubscribe_token from public.community_preferences'));assert.equal((await pg.query('select digest_enabled from public.community_preferences')).rows.length,1);await as('service_role');
    });
  }finally{await pg.close();}
});
