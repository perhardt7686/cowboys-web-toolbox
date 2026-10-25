import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('scheduled moderator permissions, deduplication, context and limits in Postgres',async t=>{
  const pg=new PGlite();
  const member='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const thread='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await pg.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;
    insert into auth.users values('${member}');`);
  for(const file of ['20261023190110_community.sql','20261024225154_community_scheduled_moderation.sql'])await pg.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  await pg.query("insert into public.community_members(user_id,display_name,status,rules_version) values($1,'Example member','approved','2026-10-23')",[member]);
  async function add(id,status='published',locked=false){await pg.query("insert into public.community_threads(id,author_id,author_name,title,body,category,status,locked,created_at) values($1,$2,'Example member','A practical tool question','How do I find a useful repair tool?','help',$3,$4,now()-interval '1 hour')",[id,member,status,locked]);}
  async function reply(id,source=id,body='A useful starting point is the repair collection.'){return (await pg.query('select public.community_moderator_reply($1,$2,$3) as result',[id,source,body])).rows[0].result;}
  await add(thread);
  await t.test('anonymous and member roles cannot post moderator replies or read receipts',async()=>{
    for(const role of ['anon','authenticated']){await pg.exec('set role '+role);await assert.rejects(()=>reply(thread),/permission denied/);await assert.rejects(()=>pg.query('select * from public.community_moderator_receipts'),/permission denied/);await pg.exec('reset role');}
  });
  await pg.exec('set role service_role');
  await t.test('one public automated reply and audit are created; replay cannot duplicate them',async()=>{
    const first=await reply(thread);assert.equal(first.status,'created');assert.equal((await reply(thread)).reason,'already_answered');
    const rows=(await pg.query('select author_name,author_kind,author_id,status from public.community_replies where id=$1',[first.reply_id])).rows;
    assert.deepEqual(rows,[{author_name:'Edward',author_kind:'edward',author_id:null,status:'published'}]);
    assert.equal((await pg.query("select count(*)::int as n from public.community_audit where action='edward.scheduled_reply'")).rows[0].n,1);
  });
  await t.test('closed, hidden, already answered and non-human sources are skipped',async()=>{
    const hidden='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',closed='ffffffff-ffff-4fff-8fff-ffffffffffff';
    await add(hidden,'hidden');await add(closed,'published',true);
    assert.equal((await reply(hidden)).reason,'thread_unavailable');assert.equal((await reply(closed)).reason,'thread_unavailable');
    const bot=(await pg.query("select id from public.community_replies where author_kind='edward' limit 1")).rows[0].id;
    assert.equal((await reply(thread,bot)).reason,'human_source_unavailable');
    await assert.rejects(()=>reply(thread,thread,'sb_secret_abcdefghijklmnop123456789'),'Private credentials');
  });
  await t.test('the six-hour cap prevents a burst beyond three new replies',async()=>{
    for(let i=1;i<=3;i++){const id=`11111111-1111-4111-8111-${String(i).padStart(12,'0')}`;await add(id);const result=await reply(id);assert.equal(result.status,i<=2?'created':'skipped');if(i===3)assert.equal(result.reason,'rate_limited');}
    assert.equal((await pg.query("select count(*)::int as n from public.community_replies where author_kind='edward'")).rows[0].n,3);
  });
  await pg.close();
});
