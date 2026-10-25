import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {adapter,installUpgradeSchema} from './helpers/community-db.mjs';
import {createCommunityHandler,tokenHash} from '../supabase/functions/community-api/handler.mjs';

// A small Supabase-shaped adapter over real Postgres. Authentication is injected;
// database constraints, transactions, role privileges and RLS run in PGlite.

const ownerID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',memberID='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',otherID='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const publishedID='dddddddd-dddd-4ddd-8ddd-dddddddddddd',hiddenID='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const owner={id:ownerID,email:'owner@example.com',email_confirmed_at:'2026-10-23T10:00:00Z',user_metadata:{}};
const member={id:memberID,email:'member@example.com',email_confirmed_at:owner.email_confirmed_at,user_metadata:{display_name:'Example member',rules_version:'2026-10-23',role:'owner',approved:true}};

test('community authorization and privacy boundaries in Postgres',async t=>{
  const pg=new PGlite();
  await pg.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;
    insert into auth.users(id) values ('${ownerID}'),('${memberID}'),('${otherID}');`);
  const migration=(await readdir(new URL('../supabase/migrations/',import.meta.url))).find(f=>f.endsWith('_community.sql'));
  await pg.exec(await readFile(new URL('../supabase/migrations/'+migration,import.meta.url),'utf8'));
  await installUpgradeSchema(pg);
  const db=adapter(pg);let sent=[];
  const users={owner,member,unverified:{...member,email_confirmed_at:null},forged:{...member,email:'other@example.com',user_metadata:{email:owner.email,role:'owner',approved:true}}};
  const handler=createCommunityHandler({db,catalog:[],ownerEmail:owner.email,siteURL:'https://toolbox.example/community.html',allowedOrigins:['https://toolbox.example'],sendMail:async mail=>{sent.push(mail)},auth:{getUser:async token=>users[token]?{data:{user:users[token]},error:null}:{data:{user:null},error:{message:'invalid'}}}});
  async function post(token,payload,options={}){const headers={'Content-Type':'application/json',Origin:'https://toolbox.example',...(token?{Authorization:'Bearer '+token}:{}),...options.headers};const response=await handler(new Request('https://backend.example/functions/v1/community-api',{method:options.method||'POST',headers,...((options.method||'POST')==='POST'?{body:options.raw??JSON.stringify(payload)}:{})}));return {status:response.status,headers:response.headers,data:response.status===204?null:await response.json()};}
  try{
    await t.test('rejects missing/invalid sessions, unverified email, wrong origins and bad requests',async()=>{
      assert.equal((await post(null,{action:'bootstrap'})).status,401);
      assert.equal((await post('fake',{action:'bootstrap'})).status,401);
      assert.equal((await post('unverified',{action:'bootstrap'})).status,403);
      assert.equal((await post('member',{action:'bootstrap'},{headers:{Origin:'https://evil.example'}})).status,403);
      assert.equal((await post('member',{}, {method:'GET'})).status,405);
      assert.equal((await post('member',{}, {headers:{'Content-Type':'text/plain'}})).status,415);
      assert.equal((await post('member',{}, {raw:'{bad'})).status,400);
      assert.equal((await post('member',{}, {raw:'x'.repeat(20001)})).status,413);
      const preflight=await post(null,{}, {method:'OPTIONS'});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://toolbox.example');
    });
    await pg.exec('set role service_role');
    await t.test('verified members start pending despite self-assigned metadata; owner mail contains a single-use review link',async()=>{
      const response=await post('member',{action:'bootstrap',displayName:'Example member',rulesVersion:'2026-10-23'});
      assert.equal(response.status,200,JSON.stringify(response.data));assert.equal(response.data.member.role,'member');assert.equal(response.data.member.status,'pending');
      assert.equal(sent.length,1);assert.equal(sent[0].to,owner.email);
      const rawToken=sent[0].text.match(/#review=([a-f0-9]{64})/u)[1];
      const saved=(await pg.query('select token_hash from public.community_approvals')).rows[0].token_hash;
      assert.equal(saved,await tokenHash(rawToken));assert.notEqual(saved,rawToken);
      await post('member',{action:'bootstrap'});assert.equal(sent.length,1,'bootstrap must not email repeatedly');
    });
    await t.test('pending members cannot post or inspect the owner queue, even with a forged owner email in metadata',async()=>{
      assert.equal((await post('member',{action:'create_thread'})).status,403);
      assert.equal((await post('member',{action:'admin_queue'})).status,403);
      assert.equal((await post('forged',{action:'admin_queue'})).status,403);
      assert.equal((await post('forged',{action:'review_member',userId:otherID,decision:'approved',confirm:true})).status,403);
    });
    await t.test('owner email review is read-only until explicitly confirmed; consumed and expired links cannot be reused',async()=>{
      assert.equal((await post('owner',{action:'bootstrap'})).data.member.role,'owner');
      const token=sent[0].text.match(/#review=([a-f0-9]{64})/u)[1];
      assert.equal((await post('owner',{action:'review_link',token})).status,200);
      assert.equal((await pg.query('select status from public.community_members where user_id=$1',[memberID])).rows[0].status,'pending');
      assert.equal((await post('owner',{action:'review_member',userId:memberID,decision:'approved',token})).status,400);
      const approved=await post('owner',{action:'review_member',userId:memberID,decision:'approved',token,confirm:true});assert.equal(approved.status,200,JSON.stringify(approved.data));
      assert.equal((await post('owner',{action:'review_link',token})).status,410);
      assert.equal((await post('owner',{action:'review_member',userId:memberID,decision:'declined',token,confirm:true})).status,409);
      await pg.query("insert into public.community_members(user_id,display_name,rules_version) values ($1,'Other member','2026-10-23')",[otherID]);
      const expired='f'.repeat(64);await pg.query("insert into public.community_approvals(user_id,token_hash,expires_at) values ($1,$2,now()-interval '1 hour')",[otherID,await tokenHash(expired)]);
      assert.equal((await post('owner',{action:'review_link',token:expired})).status,410);
      assert.equal((await post('owner',{action:'review_member',userId:otherID,decision:'approved',token:expired,confirm:true})).status,409);
      assert.equal((await pg.query('select status from public.community_members where user_id=$1',[otherID])).rows[0].status,'pending');
    });
    await t.test('approved posting honors rate limits and holds a private key before publication',async()=>{
      const response=await post('member',{action:'create_thread',title:'Please review this message',body:'-----BEGIN PRIVATE KEY----- private content',category:'help'});
      assert.equal(response.status,200,JSON.stringify(response.data));assert.equal(response.data.thread.status,'held');
      assert.equal((await post('member',{action:'create_thread',title:'Another conversation',body:'A second useful message right away.',category:'help'})).status,429);
      assert.equal((await post('owner',{action:'moderate',kind:'thread',id:response.data.thread.id,status:'published'})).status,400);
    });
    await pg.exec('reset role');
    await pg.query("insert into public.community_threads(id,author_id,author_name,title,body,category,status) values ($1,$2,'Example member','Public conversation','A useful public conversation.','help','published'),($3,$2,'Example member','Private conversation','A useful hidden conversation.','help','hidden')",[publishedID,memberID,hiddenID]);
    await pg.query("insert into public.community_replies(thread_id,author_name,body) values ($1,'Example member','Public reply'),($2,'Example member','Hidden parent reply')",[publishedID,hiddenID]);
    await t.test('anonymous readers see only published threads and replies under published parents; direct browser writes are denied',async()=>{
      await pg.exec('set role anon');
      assert.deepEqual((await pg.query('select id from public.community_threads')).rows.map(r=>r.id),[publishedID]);
      assert.equal((await pg.query('select body from public.community_replies')).rows[0].body,'Public reply');
      assert.equal((await pg.query('select count(*)::int as n from public.community_replies')).rows[0].n,1);
      for(const table of ['community_members','community_reports','community_approvals','community_audit','community_rate_limits','community_deletion_requests'])await assert.rejects(()=>pg.query('select * from public.'+table));
      await assert.rejects(()=>pg.query("insert into public.community_members(user_id,display_name,rules_version,status,role) values ($1,'Fake owner','2026-10-23','approved','owner')",[otherID]));
      await assert.rejects(()=>pg.query("select public.community_review_member($1,$2,'approved',null)",[ownerID,otherID]));
      await assert.rejects(()=>pg.query("select public.community_claim_action('bypass',1,100)"));
      await pg.exec('reset role');
    });
    await t.test('authenticated users see only their own membership and cannot promote themselves',async()=>{
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[memberID]);await pg.exec('set role authenticated');
      const rows=(await pg.query('select user_id from public.community_members')).rows;assert.deepEqual(rows,[{user_id:memberID}]);
      await assert.rejects(()=>pg.query("update public.community_members set role='owner' where user_id=$1",[memberID]));
      await assert.rejects(()=>pg.query("update public.community_threads set status='published' where id=$1",[hiddenID]));
      await pg.exec('reset role');
    });
    await pg.exec('set role service_role');
    await t.test('report and account removal requests are private, owner-directed, and do not delete an account immediately',async()=>{
      assert.equal((await post('member',{action:'report',threadId:publishedID,reason:'privacy',details:'Please review the conversation.'})).status,200);
      assert.equal((await post('member',{action:'deletion_request'})).status,200);
      assert.ok(sent.every(mail=>mail.to===owner.email));
      assert.equal((await pg.query('select status from public.community_deletion_requests where user_id=$1',[memberID])).rows[0].status,'pending');
      assert.equal((await pg.query('select count(*)::int as n from public.community_members where user_id=$1',[memberID])).rows[0].n,1);
      const queue=await post('owner',{action:'admin_queue'});assert.equal(queue.status,200,JSON.stringify(queue.data));assert.equal(queue.data.reports.length,1);
    });
    await t.test('an unavailable mail sender preserves a pending request and reports delivery failure',async()=>{
      const unavailableMail=createCommunityHandler({db,catalog:[],ownerEmail:owner.email,siteURL:'https://toolbox.example/community.html',allowedOrigins:['https://toolbox.example'],sendMail:async()=>{throw new Error('mail service unavailable')},auth:{getUser:async()=>({data:{user:{...member,id:otherID,email:'other@example.com'}},error:null})}});
      const response=await unavailableMail(new Request('https://backend.example/functions/v1/community-api',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://toolbox.example',Authorization:'Bearer member'},body:JSON.stringify({action:'resend_approval'})}));
      assert.equal(response.status,200);assert.equal((await response.json()).approvalEmailStatus,'failed');
      assert.equal((await pg.query('select status from public.community_members where user_id=$1',[otherID])).rows[0].status,'pending');
      assert.equal((await pg.query('select email_status from public.community_approvals where user_id=$1',[otherID])).rows[0].email_status,'failed');
    });
    await t.test('database rate limits are atomic; moderation cannot suspend the owner account',async()=>{
      const calls=await Promise.all(Array.from({length:8},()=>db.rpc('community_claim_action',{p_bucket:'test:atomic',p_window_seconds:60,p_limit:3})));
      assert.equal(calls.filter(r=>r.data===true).length,3);
      assert.equal((await post('owner',{action:'moderate',kind:'member',id:ownerID,status:'suspended',confirm:true})).status,400);
      assert.equal((await post('owner',{action:'moderate',kind:'member',id:memberID,status:'suspended',confirm:true})).status,200);
      assert.equal((await post('member',{action:'reply',threadId:publishedID,body:'A reply after suspension.'})).status,403);
    });
  }finally{await pg.close();}
});
