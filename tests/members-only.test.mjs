import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {canReadBoard,accessCopy} from '../docs/board-access.mjs';
import {PGlite} from '@electric-sql/pglite';
import {adapter,installUpgradeSchema} from './helpers/community-db.mjs';
import {createCommunityHandler} from '../supabase/functions/community-api/handler.mjs';

test('the board gate opens only for approved membership',()=>{for(const member of [null,{}, {role:'owner'}, {status:'pending'}, {status:'suspended'}, {status:'declined'}])assert.equal(canReadBoard(member),false);assert.equal(canReadBoard({status:'approved'}),true);assert.equal(accessCopy({status:'pending'}).pending,true);});

test('the entire migration chain requires current approved membership to read board data',async t=>{
 const pg=new PGlite(),ids={owner:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',member:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',pending:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',suspended:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',outsider:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'};
 try{
  await pg.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
  for(const id of Object.values(ids))await pg.query('insert into auth.users values($1)',[id]);
  const files=await readdir(new URL('../supabase/migrations/',import.meta.url)),base=files.find(f=>f.endsWith('_community.sql'));await pg.exec(await readFile(new URL('../supabase/migrations/'+base,import.meta.url),'utf8'));await installUpgradeSchema(pg);await pg.exec('set role service_role');
  for(const [name,id] of Object.entries(ids).filter(([name])=>name!=='outsider'))await pg.query("insert into public.community_members(user_id,display_name,role,status,rules_version) values($1,$2,$3,$4,'2026-10-23')",[id,name==='owner'?'Cowboy':name+' member',name==='owner'?'owner':'member',['pending','suspended'].includes(name)?name:'approved']);
  const thread=(await pg.query("insert into public.community_threads(author_id,author_name,title,body,category,site_id,post_kind) values($1,'A member','Members only lighthouse','A private discussion about lighthouse repairs.','repair','excalidraw','discovery') returning id",[ids.member])).rows[0].id;
  await pg.query("insert into public.community_replies(thread_id,author_id,author_name,body) values($1,$2,'Cowboy','A private reply about the same lighthouse.')",[thread,ids.owner]);
  await pg.query("update public.community_profiles set published=true,avatar_mode='photo',avatar_path=user_id::text||'/avatar.webp' where user_id=$1",[ids.member]);await pg.query("insert into storage.objects(bucket_id,name) values('community-avatars',$1)",[ids.member+'/avatar.webp']);
  await pg.query("insert into public.community_member_honors(user_id,title,badge) values($1,'Helpful member','Good guide')",[ids.member]);await pg.query("update public.community_settings set announcement_enabled=true,announcement_text='A members-only announcement' where id='community'");
  await pg.query("insert into public.community_site_totals(site_id) values('find-aaaaaaaa')");
  await pg.query("insert into public.community_catalog_additions(id,name,url,canonical_host,category,description,source_thread_id,credit_name) values('find-aaaaaaaa','Public tool','https://official.example','official.example','Utilities','An explicitly owner-approved public tool listing.',$1,'Private member name')",[thread]);
  const as=async(name)=>{await pg.exec('reset role');await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[name]||'']);await pg.exec('set role '+(name==='anon'?'anon':'authenticated'));};
  const tables=['community_threads','community_replies','community_profiles','community_member_honors','community_badges','community_settings','community_site_activity','community_catalog_additions','community_choices','community_notifications'];
  await t.test('anonymous requests cannot read topics, replies, search, people, announcements or activity',async()=>{
   await as('anon');for(const table of tables)await assert.rejects(()=>pg.query('select * from public.'+table),e=>e.code==='42501',table);
   await assert.rejects(()=>pg.query("select * from public.community_search_threads('lighthouse')"),e=>e.code==='42501');assert.equal((await pg.query("select * from storage.objects where bucket_id='community-avatars'")).rows.length,0);
  });
  await t.test('pending, suspended and authenticated accounts without membership see no board rows',async()=>{
   for(const name of ['pending','suspended','outsider']){await as(name);for(const table of tables)assert.equal((await pg.query('select * from public.'+table)).rows.length,0,name+' / '+table);assert.equal((await pg.query("select * from public.community_search_threads('lighthouse')")).rows.length,0);assert.equal((await pg.query("select * from storage.objects where bucket_id='community-avatars'")).rows.length,0);}
  });
  await t.test('approved members can read published content and revocation takes effect on the next query',async()=>{
   await as('member');assert.equal((await pg.query('select * from public.community_threads')).rows.length,1);assert.equal((await pg.query('select * from public.community_replies')).rows.length,1);assert.equal((await pg.query("select * from public.community_search_threads('lighthouse')")).rows.length,1);assert.equal((await pg.query('select * from public.community_settings')).rows.length,1);assert.equal((await pg.query("select * from storage.objects where bucket_id='community-avatars'")).rows.length,1);
   await pg.exec('set role service_role');await pg.query("update public.community_members set status='suspended' where user_id=$1",[ids.member]);await as('member');assert.equal((await pg.query('select * from public.community_threads')).rows.length,0);await pg.exec('set role service_role');await pg.query("update public.community_members set status='approved' where user_id=$1",[ids.member]);
   await as('owner');assert.equal((await pg.query('select * from public.community_threads')).rows.length,1);
  });
  await t.test('the public catalog contains only separately approved tool metadata and withdraws hidden source listings',async()=>{
   await as('anon');const listing=(await pg.query('select * from public.community_catalog_public')).rows[0];assert.equal(listing.name,'Public tool');assert.equal(listing.source_thread_id,undefined);assert.equal(listing.credit_name,undefined);assert.equal(JSON.stringify(listing).includes('lighthouse'),false);
   await assert.rejects(()=>pg.query("insert into public.community_catalog_public(id,name,url,category,description,access_label,checked_at) values('fake','Fake','https://fake.example','Utilities','Fake listing','Fake',current_date)"),e=>e.code==='42501');
   await pg.exec('set role service_role');await pg.query("update public.community_threads set status='hidden' where id=$1",[thread]);await as('anon');assert.equal((await pg.query('select * from public.community_catalog_public')).rows.length,0);await pg.exec('set role service_role');await pg.query("update public.community_threads set status='published' where id=$1",[thread]);
  });
  await t.test('service-backed API reads also refuse pending and suspended members',async()=>{
   await pg.exec('set role service_role');const users=Object.fromEntries(Object.entries(ids).map(([name,id])=>[name,{id,email:name==='owner'?'owner@example.com':name+'@example.com',email_confirmed_at:'2026-10-24'}]));
   const handler=createCommunityHandler({db:adapter(pg),catalog:[],ownerEmail:'owner@example.com',siteURL:'https://toolbox.example/community.html',allowedOrigins:['https://toolbox.example'],sendMail:async()=>{},auth:{getUser:async token=>({data:{user:users[token]},error:!users[token]})}});
   for(const name of ['pending','suspended'])for(const payload of [{action:'hub_state'},{action:'report',threadId:thread,reason:'other',details:'A private thread lookup.'}]){const response=await handler(new Request('https://backend.example/community-api',{method:'POST',headers:{Origin:'https://toolbox.example','Content-Type':'application/json',Authorization:'Bearer '+name},body:JSON.stringify(payload)}));assert.equal(response.status,403);}
  });
 }finally{await pg.close();}
});
