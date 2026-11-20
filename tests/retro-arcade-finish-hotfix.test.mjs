import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {installUpgradeSchema} from './helpers/community-db.mjs';

const actor='71717171-7171-4717-8717-717171717171';
test('approved member finishes genuine replay traces and retains earned trophies without ambiguous PL/pgSQL variables',async()=>{
 const pg=new PGlite();
 async function member(sql,params=[]){
  await pg.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[actor]);
  await pg.exec('SET ROLE authenticated');
  try{return (await pg.query(sql,params)).rows[0]?.value}
  finally{await pg.exec('RESET ROLE');}
 }
 try{
  await pg.exec(`create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $auth$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $auth$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`);
  const dir=new URL('../supabase/migrations/',import.meta.url);
  const files=await readdir(dir);
  await pg.exec(await readFile(new URL(files.find(f=>f.endsWith('_community.sql')),dir),'utf8'));
  await installUpgradeSchema(pg);
  await pg.query('INSERT INTO auth.users(id) values ($1)',[actor]);
  await pg.query(`INSERT INTO public.community_members
    (user_id,display_name,role,status,rules_version)
    VALUES ($1,'Edward QA fixture','member','approved','2026-10-23')`,[actor]);
  // Never simulate a live player win: these are isolated in-memory Postgres
  // fixtures that exercise exactly the same authoritative SQL pathways.
  for(const game of ['maze','fleet']){
   const start=await member('SELECT public.community_retro_start($1) AS value',[game]);
   assert.ok(start.run_id,game+' creates a server run');
   await pg.query("UPDATE public.community_retro_runs SET started_at=now()-interval '10 seconds' WHERE id=$1",[start.run_id]);
   const finished=await member('SELECT public.community_retro_finish($1,$2) AS value',
     [start.run_id,'N'.repeat(8)]);
   assert.equal(typeof finished.score,'number');
   assert.equal(finished.steps,8);
   assert.ok(Array.isArray(finished.trophies));
   assert.ok(finished.trophies.includes('first-run'));
   const row=(await pg.query('SELECT status,steps,score FROM public.community_retro_runs WHERE id=$1',[start.run_id])).rows[0];
   assert.equal(row.status,'finished');
   assert.equal(row.steps,8);
   assert.equal(Number(row.score),Number(finished.score));
   await assert.rejects(
     member('SELECT public.community_retro_finish($1,$2) AS value',[start.run_id,'N'.repeat(8)]),
     /Active game run not found/);
  }
  const totals=(await pg.query('SELECT game,runs FROM public.community_retro_scores WHERE user_id=$1',[actor])).rows;
  assert.equal(totals.length,2);
  assert.ok(totals.every(row=>row.runs===1));
  const denied=await pg.query("SELECT has_function_privilege('anon','public.community_retro_finish(uuid,text)','execute') AS can_execute");
  assert.equal(denied.rows[0].can_execute,false,'public SECURITY DEFINER finish must deny anonymous execution');
 }finally{await pg.close();}
});
