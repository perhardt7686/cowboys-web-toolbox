import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {installUpgradeSchema} from './helpers/community-db.mjs';
import {RETRO_GAME_RULES,initialRetro,retroStep} from '../docs/retro-arcade-engine.mjs';
import {RETRO_V2_RULES,initialRetroV2,retroStepV2} from '../docs/retro-arcade-engine-v2.mjs';
function trace(game,seed,max){
 let state=initialRetro(game,seed),actions='';
 for(let i=0;i<max&&!state.done;i++){
  const code=game==='fleet'?['N','F','L','D','A','R','F'][(i*3+seed)%7]:
                           ['L','R','U','D','N'][(i*3+seed)%5];
  actions+=code;state=retroStep(state,code);
 }
 return {state,actions};
}
test('authoritative SQL replays the same verified control trace as both client engines',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon nologin;
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
  await db.exec(await readFile(new URL(files.find(f=>f.endsWith('_community.sql')),dir),'utf8'));
  await installUpgradeSchema(db);
  for(const game of ['fleet','maze']){
   for(const seed of [0,4,11,61]){
    const {state,actions}=trace(game,seed,RETRO_GAME_RULES[game].steps);
    const r=await db.query('select public.community_retro_replay($1,$2,$3) as outcome',[game,seed,actions]);
    const raw=r.rows[0].outcome,got=typeof raw==='string'?JSON.parse(raw):raw;
    assert.equal(got.score,state.score,game+' seed '+seed+' score');
    assert.equal(got.lives,state.lives,game+' seed '+seed+' lives');
    assert.equal(got.steps,state.tick,game+' seed '+seed+' steps');
    assert.equal(got.done,state.done,game+' seed '+seed+' done');
    const cleared=game==='fleet'?state.tick===240&&state.lives>0:state.dots>=106&&state.lives>0;
    assert.equal(got.cleared,cleared,game+' seed '+seed+' cleared');
   }
  }

  // V2 is a separate score namespace and must mirror its authoritative SQL.
  for(const game of ['fleet','maze']){
   for(const seed of [0,4,11,61]){
    let state=initialRetroV2(game,seed),actions='';
    const limit=game==='fleet'?135:120;
    for(let i=0;i<limit&&!state.done;i++){
     const code=game==='fleet'?['N','F','L','D','A','R','F'][(i*3+seed)%7]:
                              ['L','R','U','D','N'][(i*3+seed)%5];
     actions+=code;state=retroStepV2(state,code);
    }
    const rows=await db.query(
      'select public.community_retro_replay_v2($1,$2,$3) as outcome',
      [game,seed,actions]);
    const raw=rows.rows[0].outcome,got=typeof raw==='string'?JSON.parse(raw):raw;
    const check={version:2,score:state.score,lives:state.lives,steps:state.tick,
      done:state.done,dots:game==='maze'?state.dots:0,
      captured:game==='fleet'?state.captured:false,
      rescues:game==='fleet'?state.rescues:0,
      ghosts_eaten:game==='maze'?state.ghostsEaten:0,
      cleared:game==='fleet'?state.tick===240&&state.lives>0:
        state.dots>=106&&state.lives>0};
    for(const [key,value] of Object.entries(check))
      assert.equal(got[key],value,game+' seed '+seed+' V2 '+key);
   }
  }
  await assert.rejects(db.query(
    "select public.community_retro_replay_v2('maze',2,$1)",['F']),
    /Invalid V2 arcade replay/);
  await assert.rejects(db.query(
    "select public.community_retro_replay_v2('fleet',-1,$1)",['F']),
    /Invalid V2 arcade game or seed/);

  await assert.rejects(db.query("select public.community_retro_replay('fleet',2,$1)",['X']),/Invalid arcade replay/);
 }finally{await db.close();}
});
