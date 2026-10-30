import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {adapter,installUpgradeSchema} from './helpers/community-db.mjs';
import {createCommunityHandler} from '../supabase/functions/community-api/handler.mjs';
import {createActivityHandler} from '../supabase/functions/website-activity/handler.mjs';
import {validateProfile,csvText} from '../docs/profile-core.mjs';

const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',member='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',other='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const profile={handle:'maker_1',headline:'A useful introduction',bio:'A little about making things.',location:'Somewhere outdoors',interests:['Making','Making','Learning'],website:'https://example.com',links:[{label:'Projects',url:'https://example.com/projects'}],theme:'ocean',cover:'dots',avatar_mode:'photo',avatar_path:member+'/avatar.webp',published:true};
test('profiles whitelist safe fields, enforce own avatar paths and prevent staff impersonation',()=>{
  const result=validateProfile({...profile,role:'owner',badge:'Owner',account_active:true,user_id:owner},{userId:member});
  assert.deepEqual(result.interests,['Making','Learning']);for(const k of ['role','badge','account_active','user_id'])assert.equal(result[k],undefined);
  for(const change of [{website:'javascript:alert(1)'},{website:'https://username:password@example.com'},{handle:'edward'},{theme:'anything'},{cover:'javascript'},{published:'true'},{avatar_path:other+'/avatar.webp'},{interests:Array(9).fill('tag')},{links:Array(4).fill({url:'https://example.com'})}])assert.throws(()=>validateProfile({...profile,...change},{userId:member}));
  assert.equal(validateProfile({handle:'cowboy'},{userId:owner,isOwner:true}).handle,'cowboy');
  assert.equal(csvText([['=IMPORTXML("url")','@command','ordinary','a"b']]),'"\'=IMPORTXML(""url"")","\'@command","ordinary","a""b"');
});

test('profile privacy, owner operations and anonymous aggregate clicks in Postgres',async t=>{
  const pg=new PGlite();
  try{
    await pg.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;insert into auth.users values('${owner}'),('${member}'),('${other}');`);
    const base=(await readdir(new URL('../supabase/migrations/',import.meta.url))).find(f=>f.endsWith('_community.sql'));await pg.exec(await readFile(new URL('../supabase/migrations/'+base,import.meta.url),'utf8'));await installUpgradeSchema(pg);
    await pg.exec('set role service_role');await pg.query("insert into public.community_members(user_id,display_name,role,status,rules_version) values ($1,'Cowboy','owner','approved','2026-10-23'),($2,'Example maker','member','approved','2026-10-23'),($3,'Other member','member','pending','2026-10-23')",[owner,member,other]);
    const db=adapter(pg),sent=[];const users={owner:{id:owner,email:'owner@example.com',email_confirmed_at:'2026-10-24'},member:{id:member,email:'member@example.com',email_confirmed_at:'2026-10-24',user_metadata:{role:'owner',email:'owner@example.com'}},other:{id:other,email:'other@example.com',email_confirmed_at:'2026-10-24'}};
    const handler=createCommunityHandler({db,catalog:[],ownerEmail:'owner@example.com',siteURL:'https://toolbox.example/community.html',allowedOrigins:['https://toolbox.example'],senderConfigured:true,sendMail:async mail=>sent.push(mail),auth:{getUser:async token=>({data:{user:users[token]},error:!users[token]})}});
    const post=async(token,payload)=>{const r=await handler(new Request('https://backend.example/community-api',{method:'POST',headers:{Origin:'https://toolbox.example','Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)}));return {status:r.status,data:await r.json()};};
    const setRole=async(role,id='')=>{await pg.exec('reset role');await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await pg.exec('set role '+role);};
    await t.test('profiles start private; members cannot inspect another private profile or write protected fields',async()=>{
      await setRole('anon');assert.equal((await pg.query('select * from public.community_profiles')).rows.length,0);
      await setRole('authenticated',member);assert.deepEqual((await pg.query('select user_id from public.community_profiles')).rows.map(r=>r.user_id),[member]);
      await assert.rejects(()=>pg.query("update public.community_profiles set badge='Owner',published=true where user_id=$1",[member]));
      for(const fn of ["community_admin_overview('"+member+"')","community_record_click('excalidraw',gen_random_uuid())"])await assert.rejects(()=>pg.query('select public.'+fn));
      await setRole('service_role');
    });
    await t.test('profile saves ignore forged roles, preserve authoritative badges and handle conflicts atomically',async()=>{
      const r=await post('member',{action:'profile',displayName:'My public name',profile:{...profile,role:'owner',badge:'Owner',user_id:owner,account_active:true}});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.profile.display_name,'My public name');assert.equal(r.data.profile.badge,null);assert.equal(r.data.profile.account_active,true);
      assert.equal((await pg.query('select role from public.community_members where user_id=$1',[member])).rows[0].role,'member');
      const collision=await post('other',{action:'profile',displayName:'Changed name',profile:{handle:'maker_1'}});assert.equal(collision.status,409,JSON.stringify(collision));assert.equal((await pg.query('select display_name from public.community_members where user_id=$1',[other])).rows[0].display_name,'Other member');
      const foreign=await post('member',{action:'profile',displayName:'Maker',profile:{...profile,avatar_path:other+'/avatar.webp'}});assert.equal(foreign.status,400);
      assert.equal((await post('member',{action:'admin_overview'})).status,403);
    });
    await t.test('private avatar policies enforce own paths; public pictures follow approved profile visibility',async()=>{
      await setRole('authenticated',member);await pg.query("insert into storage.objects(bucket_id,name) values('community-avatars',$1)",[member+'/avatar.webp']);
      await assert.rejects(()=>pg.query("insert into storage.objects(bucket_id,name) values('community-avatars',$1)",[other+'/avatar.webp']));
      await setRole('anon');assert.equal((await pg.query('select name from storage.objects')).rows.length,1);assert.equal((await pg.query('select user_id from public.community_profiles')).rows[0].user_id,member);
      await setRole('service_role');const suspended=await post('owner',{action:'admin_bulk',userIds:[owner,member],status:'suspended',confirm:true});assert.equal(suspended.status,200);assert.equal(suspended.data.updated,1);assert.equal((await pg.query('select status from public.community_members where user_id=$1',[owner])).rows[0].status,'approved');
      await setRole('anon');assert.equal((await pg.query('select * from public.community_profiles')).rows.length,0);assert.equal((await pg.query('select * from storage.objects')).rows.length,0);
      await setRole('authenticated',member);assert.equal((await pg.query('select name from storage.objects')).rows.length,1,'member can manage their own private picture');
      await setRole('service_role');
    });
    await t.test('owner actions require confirmation; search, announcement visibility, test-mail destination and audit work',async()=>{
      assert.equal((await post('owner',{action:'admin_bulk',userIds:[member],status:'approved'})).status,400);
      assert.equal((await post('member',{action:'announcement',text:'Hacked',enabled:true,confirm:true})).status,403);
      assert.equal((await post('owner',{action:'moderate',kind:'pin',id:other,pinned:true,confirm:true})).status,404);
      const result=await post('owner',{action:'announcement',text:'Welcome to the Commons.',enabled:true,confirm:true});assert.equal(result.status,200);
      const filtered=await post('owner',{action:'admin_members',search:'public',status:'suspended',offset:0});assert.equal(filtered.status,200);assert.equal(filtered.data.total,1);assert.equal(filtered.data.members[0].user_id,member);assert.equal(filtered.data.members[0].email,undefined);
      await setRole('anon');assert.equal((await pg.query('select announcement_text from public.community_settings')).rows[0].announcement_text,'Welcome to the Commons.');await setRole('service_role');
      const mail=await post('owner',{action:'owner_test_mail',confirm:true,to:'attacker@example.com'});assert.equal(mail.data.emailSent,true);assert.equal(sent[0].to,'owner@example.com');assert.equal((await post('owner',{action:'owner_test_mail',confirm:true})).status,429);
      const overview=await post('owner',{action:'admin_overview'});assert.equal(overview.status,200,JSON.stringify(overview));assert.equal(overview.data.daily.length,14);assert.equal(overview.data.sites.length,94);assert.ok(overview.data.audit.some(a=>a.action==='announcement.updated'));assert.equal(overview.data.senderConfigured,true);
    });
    await t.test('click endpoint validates origin, catalog ID, method, bounded JSON and random event ID',async()=>{
      const activity=createActivityHandler({db,catalog:[{id:'excalidraw'}],allowedOrigins:['https://toolbox.example']});
      const event={siteId:'excalidraw',eventId:crypto.randomUUID()};
      const call=async(payload=event,{origin='https://toolbox.example',method='POST',contentType='application/json',raw}={})=>{const r=await activity(new Request('https://backend.example/activity',{method,headers:{Origin:origin,'Content-Type':contentType},...(method==='POST'?{body:raw??JSON.stringify(payload)}:{})}));return {status:r.status,data:r.status===204?null:await r.json()};};
      assert.equal((await call(event,{origin:'https://evil.example'})).status,403);assert.equal((await call(event,{method:'GET'})).status,405);assert.equal((await call(event,{contentType:'text/plain'})).status,415);assert.equal((await call(event,{raw:'x'.repeat(4097)})).status,413);assert.equal((await call(event,{raw:'{bad'})).status,400);assert.equal((await call({...event,siteId:'not-a-site'})).status,400);assert.equal((await call({...event,eventId:'an-email@example.com'})).status,400);
      const first=await call(),repeat=await call();assert.equal(first.data.recorded,true);assert.equal(first.data.clicks,1);assert.equal(repeat.data.recorded,false);assert.equal(repeat.data.clicks,1);
      const parallel=await Promise.all(Array.from({length:8},()=>call({...event,eventId:crypto.randomUUID()})));assert.ok(parallel.every(r=>r.status===200));assert.equal((await pg.query("select clicks from public.community_site_totals where site_id='excalidraw'")).rows[0].clicks,9);assert.equal((await pg.query("select clicks from public.community_daily_clicks where site_id='excalidraw'")).rows[0].clicks,9);
      await pg.exec("update public.community_click_buckets set attempts=240");const capped=await call({...event,eventId:crypto.randomUUID()});assert.equal(capped.data.recorded,false);assert.equal(capped.data.clicks,9);
      await pg.exec("update public.community_click_buckets set window_start=now()-interval '20 minutes'");const recycled=await call({...event,eventId:crypto.randomUUID()});assert.equal(recycled.data.recorded,true);const window=(await pg.query('select attempts,array_length(event_ids,1) as ids from public.community_click_buckets')).rows;assert.equal(window.length,1);assert.equal(window[0].attempts,1);assert.equal(window[0].ids,1);assert.equal((await pg.query('select count(*)::int as n from public.community_click_events')).rows[0].n,0);
      await setRole('anon');assert.equal((await pg.query('select count(*)::int as n from public.community_site_totals')).rows[0].n,94);await assert.rejects(()=>pg.query('select * from public.community_click_events'));await assert.rejects(()=>pg.query('select * from public.community_click_buckets'));await assert.rejects(()=>pg.exec("update public.community_site_totals set clicks=999"));
    });
    await t.test('optional discovery accepts only fixed buckets, deduplicates and stays private to the owner',async()=>{
      await setRole('service_role');const activity=createActivityHandler({db,catalog:[],allowedOrigins:['https://toolbox.example']});
      const event=async payload=>{const r=await activity(new Request('https://backend.example/website-activity',{method:'POST',headers:{Origin:'https://toolbox.example','Content-Type':'application/json'},body:JSON.stringify(payload)}));return {status:r.status,data:await r.json()};};
      const eventId=crypto.randomUUID();assert.equal((await event({metric:'search',bucket:'zero',eventId,query:'private client name'})).status,400);assert.equal((await event({metric:'search',bucket:'private query',eventId})).status,400);assert.equal((await event({metric:'search',bucket:'zero',eventId})).data.recorded,true);assert.equal((await event({metric:'search',bucket:'zero',eventId})).data.recorded,false);assert.equal((await pg.query('select sum(events) as n from public.community_discovery_totals')).rows[0].n,1);assert.equal((await post('member',{action:'admin_discovery'})).status,403);const response=await post('owner',{action:'admin_discovery'});assert.equal(response.status,200);assert.equal(response.data.rows[0].bucket,'zero');await setRole('anon');await assert.rejects(()=>pg.exec('select * from public.community_discovery_totals'));await assert.rejects(()=>pg.exec("select public.community_record_discovery('search','zero',gen_random_uuid())"));await setRole('authenticated',member);await assert.rejects(()=>pg.exec('select public.community_discovery_overview()'));
    });
    await t.test('discovery retention and a daily cap bound storage without changing click totals',async()=>{
      await setRole('service_role');const clicks=(await pg.query('select sum(clicks) as n from public.community_site_totals')).rows[0].n;await pg.exec("insert into public.community_discovery_events values(gen_random_uuid(),now()-interval '2 days');insert into public.community_discovery_totals values(current_date-100,'task','no',1)");await db.rpc('community_record_discovery',{p_metric:'task',p_bucket:'yes',p_event_id:crypto.randomUUID()});assert.equal((await pg.query("select count(*)::int as n from public.community_discovery_events where created_at<now()-interval '24 hours'")).rows[0].n,0);assert.equal((await pg.query('select count(*)::int as n from public.community_discovery_totals where day<current_date-90')).rows[0].n,0);await pg.exec("update public.community_discovery_totals set events=20000 where metric='search'");const cap=await db.rpc('community_record_discovery',{p_metric:'task',p_bucket:'no',p_event_id:crypto.randomUUID()});assert.equal(cap.data.recorded,false);assert.equal(cap.data.reason,'daily_cap');assert.equal((await pg.query('select sum(clicks) as n from public.community_site_totals')).rows[0].n,clicks);
    });
  }finally{await pg.close();}
});
