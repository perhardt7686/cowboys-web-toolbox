import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSkyCourse,createSkyRide,stepSky,replaySky,skyObjectX,sweepSphere} from '../docs/skyboard-physics.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('docs/commons-board-rush.mjs'),css=read('docs/commons-board-rush.css');
const shell=read('docs/commons-arcade-shell.mjs'),titles=read('docs/commons-arcade-titles.mjs');
const nav=read('docs/family-arcade-nav.mjs'),html=read('docs/community.html');
const sql=read('supabase/migrations/20261115162000_emma_skyboard_sprint.sql');
test('Skyboard ships with independently executable and accessible board source',()=>{
 for(const path of ['docs/commons-board-rush.mjs','docs/commons-arcade-shell.mjs',
   'docs/commons-arcade-titles.mjs','docs/family-arcade-nav.mjs']){
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',
   fileURLToPath(new URL('../'+path,import.meta.url))]));
 }
 assert.match(html,/commons-board-rush\.mjs\?v=skyboard6/);
 assert.match(html,/commons-board-rush\.css\?v=skyboard3/);
 assert.match(shell,/id:'skyboard',root:'skyboard-root',toggle:'skyboard-toggle'/);
 assert.match(nav,/skyboard:\[sceneAction\('Ride current stage'/);
 assert.match(nav,/skyboard:'Steer with left and right/);
 assert.match(titles,/skyboard:\{/);
 assert.match(titles,/id==='skyboard'/);
 assert.match(game,/aria-label="Third-person board race/);
 assert.match(game,/data-sky-hold="left"/);
 assert.match(game,/data-sky-hold="right"/);
 assert.match(game,/data-sky-action="jump"/);
 assert.match(game,/data-sky-hold="drift"/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/@media\(max-height:620px\)/);
});
test('All thirty stages have reproducible seeded original obstacle courses',()=>{
 const types=new Set();
 for(let stage=1;stage<=30;stage++){
  const seed=(stage*212561)^196930,course=buildSkyCourse(stage,seed);
  assert.deepEqual(course,buildSkyCourse(stage,seed));
  assert.notEqual(course.phase,buildSkyCourse(stage,seed+1).phase);
  assert.ok(course.length>=300&&course.length<=405);
  assert.ok(course.things.length>5&&course.things.length<65);
  assert.ok(course.things.every(o=>Number.isFinite(o.z)&&o.z>0&&o.z<course.length));
  for(const o of course.things)types.add(o.kind);
  const r=createSkyRide(course);
  while(!r.done){
   const gap=course.things.find(o=>o.kind==='gap');
   stepSky(r,gap&&gap.z-r.progress<4.4&&gap.z-r.progress>3.3&&r.grounded?4:0);
  }
  assert.ok(r.won,'Passable race '+stage);
 }
 for(const name of ['Sunshine Skyway','Candy Canyon','Crystal Coast','Glacier Glow','Moonlight Metro','Rainbow Rapids'])
  assert.ok(read('docs/skyboard-courses.mjs').includes(name));
 for(const kind of ['bar','spikes','gap','gate','coin','boost','ball','platform'])assert.ok(types.has(kind),kind);
});
test('A boost moves ten times as far per step and a moving ball interrupts it with real retreat',()=>{
 const course=buildSkyCourse(1,555),r=createSkyRide(course),ball=course.things.find(o=>o.kind==='ball');
 assert.notEqual(skyObjectX(ball,0),skyObjectX(ball,1));
 let hit=false,boosted=false,retreat=0;
 while(!r.done){
  const start=r.progress,boost=r.boost>0,hits=r.ballHits;
  stepSky(r,0);
  if(boost&&r.boost>0&&r.ballHits===hits){
   boosted=true;
   assert.equal(r.speed,10*r.normal);
   assert.ok(Math.abs((r.progress-start)-(10*r.normal/120))<1e-10);
  }
  if(r.event==='ball-hit'){
   hit=true;
   assert.ok(r.speed<0);
   assert.equal(r.boost,0);
  }
  if(r.hurt>0&&start>r.progress)retreat+=start-r.progress;
 }
 assert.ok(boosted&&hit&&r.won);
 assert.ok(retreat>5,'Meaningful traveled distance backward');
 const replay=replaySky(1,555,'sunny',[],{sample:true});
 assert.equal(replay.ball_hits,r.ballHits);
 assert.equal(replay.elapsed_ms,Math.round(r.elapsed*1000));
 assert.ok(replay.frames.some((sample,i)=>i>0&&sample[1]<replay.frames[i-1][1]));
 assert.notEqual(sweepSphere([0,0,-5],[0,0,5],[-2,0,0],[2,0,0],1),null);
 assert.equal(sweepSphere([0,0,-5],[0,0,5],[5,0,0],[5,0,0],1),null);
});
test('Skyboard starts only with an approved family member, and saves under owner identity',()=>{
 assert.match(game,/member\?\.status!=='approved'/);
 assert.match(game,/community_boardride_start/);
 assert.match(game,/submitArcadeReplay\(client,config,'skyboard'/);
 assert.match(game,/snapshot\.practice/);
 assert.match(game,/Your result was not added to the family leaderboard/);
 assert.match(sql,/user_id uuid primary key references auth\.users/);
 assert.match(sql,/alter table public\.community_boardride_profiles enable row level security/);
 assert.match(sql,/alter table public\.community_boardride_runs enable row level security/);
 assert.match(sql,/alter table public\.community_boardride_badges enable row level security/);
 assert.match(sql,/v_user:=public\.community_boardride_allowed\(\)/);
 assert.match(sql,/where id=p_run_id and user_id=v_user and status='active'/);
 assert.match(sql,/grant execute on function public\.community_boardride_state\(\) to authenticated/);
 assert.match(sql,/revoke all on public\.community_boardride_profiles/);
 assert.doesNotMatch(sql,/grant (?:select|insert|update|delete) on public\.community_boardride_(?:profiles|runs|badges) to anon/i);
});

test('Expanded routes are distinct, and all thirty seeded courses replay to the finish',()=>{
 const names=new Set(),worlds=new Set(),shape=new Set();
 for(let stage=1;stage<=30;stage++){
  const seed=(stage*212561)^196930,course=buildSkyCourse(stage,seed,2);
  assert.notEqual(course.length,buildSkyCourse(stage,seed).length);
  assert.deepEqual(course,buildSkyCourse(stage,seed,2));
  assert.notEqual(course.phase,buildSkyCourse(stage,seed+1,2).phase);
  names.add(course.info.name);worlds.add(course.info.scene);
  for(const object of course.things)shape.add(object.kind);
  const ride=createSkyRide(course),trace=[];
  while(!ride.done){
   const gap=course.things.find(object=>object.kind==='gap'&&object.z+object.span*.5>ride.progress);
   const edge=gap?gap.z-gap.span*.5-ride.progress:Infinity;
   const target=ride.speed>30?Math.min(9,ride.speed*.12):3.8;
   const mask=ride.grounded&&edge>0&&edge<target&&!(ride.mask&4)?4:0;
   if(ride.mask!==mask)trace.push([ride.tick,mask]);
   stepSky(ride,mask);
  }
  assert.ok(ride.won,course.info.name);
  assert.ok(replaySky(stage,seed,'sunny',trace,{edition:2}).won,course.info.name);
 }
 assert.equal(names.size,30);
 assert.equal(worlds.size,6);
 for(const kind of ['sweeper','ramp','platform','gap','ball','boost'])assert.ok(shape.has(kind),kind);
});
