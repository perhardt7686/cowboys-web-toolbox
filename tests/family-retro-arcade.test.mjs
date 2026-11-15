import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RETRO_MAZE,RETRO_GAME_RULES,initialRetro,retroStep,retroReplay,alienAt} from '../docs/retro-arcade-engine.mjs';
import {ARCADE_REWARDS} from '../docs/avatar-arcade-rewards.mjs';
import {CATALOG,BY_ID,GROUPS,GAME_LABELS} from '../docs/avatar-reward-catalog.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('independent swarming shooter and mystery maze rules are deterministic',()=>{
 assert.equal(RETRO_GAME_RULES.fleet.steps,240);
 assert.equal(RETRO_GAME_RULES.maze.steps,300);
 assert.equal(RETRO_MAZE.length,15);
 assert.ok(RETRO_MAZE.every(row=>row.length===15));
 assert.deepEqual(alienAt(0,4),{wave:0,lane:4,age:0,boss:false});
 assert.equal(retroReplay('fleet',4,'NFFF').score,20);
 assert.equal(retroReplay('fleet',4,'NFFF').destroyed.length,1);
 const maze=retroReplay('maze',2,'RRDDLLUU');
 assert.ok(maze.score>0);
 assert.ok(maze.dots>=3);
 assert.throws(()=>retroReplay('maze',1,'F'),/Invalid action/);
 assert.throws(()=>retroReplay('fleet',1,'F'.repeat(241)),/Invalid arcade controls/);
});
test('all maze clue cells are reachable without invented teleports',()=>{
 const seen=new Set(['1,1']),queue=[[1,1]];
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,ny=y+dy,k=nx+','+ny;
   if(RETRO_MAZE[ny]?.[nx] && RETRO_MAZE[ny][nx]!=='#'&&!seen.has(k)){
    seen.add(k);queue.push([nx,ny]);
   }
  }
 }
 assert.equal(seen.size,106);
});
test('21 unique unlockables include real pet, gadget, eyewear, scene and effect art',()=>{
 assert.equal(ARCADE_REWARDS.length,21);
 assert.equal(CATALOG.length,336);
 assert.equal(new Set(CATALOG.map(r=>r.id)).size,336);
 assert.equal(ARCADE_REWARDS.filter(r=>r.slot==='companion').length,6);
 for(const item of ARCADE_REWARDS){
  assert.equal(typeof item.draw,'function',item.id);
  assert.equal(BY_ID.get(item.id)?.achievement_id,item.achievement_id);
  assert.ok(['fleet','maze','dashforge'].some(g=>GROUPS[g].includes(item.achievement_id)),item.id);
 }
 for(const g of ['fleet','maze','dashforge'])assert.ok(GAME_LABELS[g]?.length>4);
});
test('games use private score RPCs, originals and readable independent title screens',()=>{
 const js=read('docs/commons-retro-arcade.mjs');
 const html=read('docs/community.html');
 const shell=read('docs/commons-arcade-shell.mjs');
 const title=read('docs/commons-arcade-titles.mjs');
 const nav=read('docs/family-arcade-nav.mjs');
 for(const id of ['fleet','maze']){assert.ok(shell.includes("id:'"+id+"'"));assert.ok(title.includes(" "+id+":{"));assert.ok(nav.includes("  "+id+":"));}
 assert.match(js,/community_retro_start/);
 assert.match(js,/community_retro_finish/);
 assert.match(js,/community_retro_state/);
 assert.match(js,/session\?\.user\?\.id/);
 assert.match(html,/commons-retro-arcade\.mjs\?v=retro4/);
 assert.match(html,/commons-retro-arcade\.css\?v=retro4/);
 assert.doesNotMatch(js,/arcade\.archive|pac-man\.png|galaga\.png/);
});
