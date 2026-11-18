import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RETRO_MAZE,RETRO_GAME_RULES,initialRetro,retroStep,retroReplay,alienAt} from '../docs/retro-arcade-engine.mjs';
import {ARCADE_REWARDS} from '../docs/avatar-arcade-rewards.mjs';
import {squadronFormation,squadronDiver,wispActing,drawSquadronShip,drawMazeWisp,drawMazeDetective} from '../docs/retro-arcade-visuals.mjs';
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
 assert.equal(CATALOG.filter(item=>!item.id.startsWith('studio-')).length,336);
 assert.equal(new Set(CATALOG.map(r=>r.id)).size,CATALOG.length);
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
 assert.match(html,/commons-retro-arcade\.mjs\?v=retro13/);
 assert.match(html,/commons-retro-arcade\.css\?v=retro8/);
 assert.doesNotMatch(js,/arcade\.archive|pac-man\.png|galaga\.png/);
});


test('Galaga-inspired formation and swooping dives align with the one verified target',()=>{
  const first=squadronFormation(0,4,540);
  assert.equal(first.length,27,'three rows by nine original waiting ships');
  assert.equal(new Set(first.map(p=>p.row+':'+p.lane)).size,27);
  for(const tick of [1,2,4,6,8,9,10,45,101,240]){
    const ships=squadronFormation(tick,4,540);
    assert.equal(ships.length,alienAt(tick-1,4).age===8?27:26);
    assert.ok(ships.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
    const dive=squadronDiver(tick,4,540);
    const authoritative=alienAt(tick-1,4);
    if(authoritative.age<=7){
      assert.equal(dive.lane,authoritative.lane);
      assert.equal(dive.wave,authoritative.wave);
      assert.equal(dive.boss,authoritative.boss);
      assert.ok(Math.abs(dive.x-(18+(authoritative.lane+.5)*56))<=18.001,
        'visual dive must remain inside its authoritative lane');
      assert.ok(dive.y>=65&&dive.y<=402);
    }else assert.equal(dive,null);
  }
  assert.equal(squadronDiver(0,4,540),null);
});

test('distinct original wisps change only visible color and pupil mood during power',()=>{
  const ghost={x:3,y:7},player={x:5,y:9};
  const normal=wispActing(ghost,player,8,1,0);
  const scared=wispActing(ghost,player,8,1,10);
  assert.equal(normal.frightened,false);
  assert.equal(scared.frightened,true);
  assert.equal(normal.pupilX,2.2);
  assert.equal(normal.pupilY,1.5);
  assert.equal(scared.pupilX,0);
  assert.notEqual(normal.color,scared.color);
  assert.deepEqual(wispActing(ghost,player,8,1,0),normal,'cosmetic actors must be deterministic');
  const ghostCopy=structuredClone(ghost);
  wispActing(ghost,player,22,2,0);
  assert.deepEqual(ghost,ghostCopy,'actor painting must not move collision positions');
});

test('original squadron ships, three wisps, and animated detective draw without external assets',()=>{
  let paths=0;
  const canvas=new Proxy({fillStyle:'',strokeStyle:'',lineWidth:1,save(){},restore(){},
    translate(){},scale(){},rotate(){},beginPath(){paths++;},closePath(){},
    moveTo(){},lineTo(){},quadraticCurveTo(){},bezierCurveTo(){},ellipse(){},arc(){},
    fillRect(){},fill(){},stroke(){}},{get(t,k){return k in t?t[k]:undefined;}});
  drawSquadronShip(canvas,70,130,.7,'#78bacf');
  drawSquadronShip(canvas,190,345,1.1,'#f7abcd',{active:true,boss:true,tilt:.2});
  for(let i=0;i<3;i++)drawMazeWisp(canvas,30+i*60,60,wispActing({x:i,y:2},{x:3,y:1},7,i,0),i,7);
  drawMazeDetective(canvas,96,90,'R',12,'#efc886','#66537f');
  assert.ok(paths>14,'real procedural artwork must not collapse into empty objects');
});
