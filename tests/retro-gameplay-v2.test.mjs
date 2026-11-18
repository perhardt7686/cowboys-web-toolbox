import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RETRO_MAZE,initialRetro,retroReplay} from '../docs/retro-arcade-engine.mjs';
import {initialRetroV2,retroStepV2,retroReplayV2,RETRO_V2_RULES,
  fleetTargetsV2,mazePhaseV2,mazeGhostGoalV2,mazeGhostStepV2}
  from '../docs/retro-arcade-engine-v2.mjs';

test('original V1 games and all scores stay separate from the new V2 engine',()=>{
  const v1=retroReplay('fleet',4,'NFFF');
  const v2=retroReplayV2('fleet',4,'NFFF');
  assert.equal(v1.score,20);
  assert.equal(v1.version,undefined);
  assert.equal(v2.version,2);
  assert.equal(RETRO_V2_RULES.fleet.steps,240);
  assert.equal(RETRO_V2_RULES.maze.steps,300);
  assert.deepEqual(v1,retroReplay('fleet',4,'NFFF'),
    'V2 must never rewrite the existing authoritative replay state');
  assert.throws(()=>initialRetroV2('fleet',97),/Invalid V2 seed/);
});

test('three Squadron targets have independent lanes, dive windows and commanders',()=>{
  for(const seed of [0,4,46]){
    for(const t of [0,1,4,7,10,48,52,55,108,112]){
      const targets=fleetTargetsV2(t,seed);
      assert.equal(targets.length,3);
      assert.equal(new Set(targets.map(x=>x.id)).size,3);
      assert.ok(targets.every(x=>x.lane>=0&&x.lane<=8));
      for(const target of targets){
        assert.equal(target.impact,target.age===4+3*target.index);
        assert.equal(target.boss,target.wave%5===4&&target.index===1);
      }
    }
  }
  const fifth=fleetTargetsV2(52,4);
  assert.equal(fifth[1].lane,0);
  assert.equal(fifth[1].boss,true);
});

test('capture and rescue are earned from actual commander encounters',()=>{
  const seed=4;
  let s=initialRetroV2('fleet',seed);
  for(let tick=0;tick<=112;tick++){
    let move='N';
    if(tick<4)move='L'; // lane zero for wave five commander
    else if(tick>=56&&tick<63)move='R'; // move into later commander lane seven
    else if(tick===112)move='F';
    else if(tick>55){
      const target=fleetTargetsV2(tick,seed)
        .find(e=>e.impact&&e.lane===s.lane&&!s.destroyed.includes(e.id));
      if(target)move='F';
    }
    s=retroStepV2(s,move);
    if(tick===55){
      assert.equal(s.captured,true,'unshot commander captures one escort ship');
      assert.equal(s.rescues,0);
    }
    if(s.done)break;
  }
  assert.ok(s.tick>=113,'ship must survive until later commander rescue');
  assert.equal(s.rescues,1,'shooting a later commander rescues the ship');
  assert.equal(s.captured,false);
  assert.ok(s.score>=190,'rescue grants a visible scoring bonus');
});

test('Maze ghosts have distinct direct, ambush and flanking goals and real corner phases',()=>{
  const player={x:6,y:5};
  assert.deepEqual(mazeGhostGoalV2(0,player,'R','chase'),player);
  assert.deepEqual(mazeGhostGoalV2(1,player,'R','chase'),{x:8,y:5});
  assert.deepEqual(mazeGhostGoalV2(2,player,'R','chase'),{x:10,y:8});
  assert.deepEqual(mazeGhostGoalV2(0,player,'R','scatter'),{x:13,y:1});
  assert.deepEqual(mazeGhostGoalV2(1,player,'R','scatter'),{x:13,y:13});
  assert.deepEqual(mazeGhostGoalV2(2,player,'R','scatter'),{x:1,y:13});
  assert.equal(mazePhaseV2(0,0),'scatter');
  assert.equal(mazePhaseV2(32,0),'chase');
  assert.equal(mazePhaseV2(64,12),'frightened');
  const initial=initialRetroV2('maze',4);
  assert.equal(initial.ghosts.length,3);
  for(let t=0;t<25;t++){
    for(let i=0;i<3;i++){
      const g=mazeGhostStepV2(initial.ghosts[i],i,t,4,player,'R',mazePhaseV2(t,0));
      assert.ok(g.x>=1&&g.x<=13&&g.y>=1&&g.y<=13);
      assert.notEqual(RETRO_MAZE[g.y][g.x],'#','ghost cannot tunnel through solid walls');
      assert.ok(Math.abs(g.x-initial.ghosts[i].x)+Math.abs(g.y-initial.ghosts[i].y)<=1,
        'one tick never teleports a ghost');
    }
  }
});

test('V2 replay refuses unsupported game actions and illegal continuation',()=>{
  assert.throws(()=>retroReplayV2('maze',4,'F'),/Invalid V2 action/);
  assert.throws(()=>retroReplayV2('fleet',4,'X'),/Invalid V2 action/);
  assert.throws(()=>retroReplayV2('maze',4,'N'.repeat(301)),/Invalid V2 arcade controls/);
  const s=retroReplayV2('maze',8,'RRDDLLUU');
  assert.equal(s.version,2);
  assert.ok(s.score>=0);
  assert.deepEqual(s,retroReplayV2('maze',8,'RRDDLLUU'));
});

test('V2 SQL and RPC tables are independent from all legacy trophy and leaderboard writes',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/20261118210000_family_retro_gameplay_v2.sql',
    import.meta.url),'utf8');
  for(const name of [
    'community_retro_replay_v2','community_retro_start_v2',
    'community_retro_finish_v2','community_retro_state_v2',
    'community_retro_v2_runs','community_retro_v2_scores'])
    assert.ok(sql.includes(name),name+' must be included in the migration');
  assert.match(sql,/community_dash_allowed\(\)/);
  assert.match(sql,/where id=p_run_id and user_id=uid for update/);
  assert.match(sql,/create unique index if not exists community_retro_v2_one_active/);
  assert.doesNotMatch(sql,/insert into public\.community_retro_scores\(/i,
    'V2 may not mix points into the original V1 score table');
  assert.doesNotMatch(sql,/insert into public\.community_retro_trophies\(/i,
    'V2 may not claim V1 family unlockables');
  assert.doesNotMatch(sql,/perform community_private\.avatar_reward_award/i);
});
