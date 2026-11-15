import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommunityDb,installUpgradeSchema} from './helpers/community-db.mjs';
import {RETRO_GAME_RULES,initialRetro,retroStep} from '../docs/retro-arcade-engine.mjs';
function trace(game,seed,max){
 let state=initialRetro(game,seed),actions='';
 for(let i=0;i<max&&!state.done;i++){
  const code=game==='fleet'?['N','F','L','D','A','R','F'][(i*3+seed)%7]:
                           ['L','R','U','D','N'][(i*5+seed)%5];
  actions+=code;state=retroStep(state,code);
 }
 return {state,actions};
}
test('authoritative SQL replays the same verified control trace as both client engines',async()=>{
 const db=await createCommunityDb();
 try{
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
  await assert.rejects(db.query("select public.community_retro_replay('fleet',2,$1)",['X']),/Invalid arcade replay/);
 }finally{await db.close();}
});
