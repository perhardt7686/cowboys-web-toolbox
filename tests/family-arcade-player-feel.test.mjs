import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
 SKY_STEERING_PRESETS,DASH_TOUCH_TARGETS,DEFAULT_SKY_STEERING,DEFAULT_DASH_TOUCH,
 controlStorageKey,validControlChoice,readControlChoice,saveControlChoice,
 resetControlChoice,steeringWithHysteresis,canvasSteeringDirection
} from '../docs/family-arcade-player-feel.mjs';
import {createDashCourse,createDashRun,stepDash} from '../docs/dash-physics.mjs';
import {buildSkyCourse,createSkyRide,stepSky} from '../docs/skyboard-physics.mjs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const alice='123e4567-e89b-42d3-a456-426614174000';
const bob='123e4567-e89b-42d3-a456-426614174001';
const storage=()=>{const records=new Map();return {
 records,getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,String(v)),removeItem:k=>records.delete(k)
}};

test('approved member presets have bounded thresholds and independent device keys',()=>{
 assert.deepEqual(Object.keys(SKY_STEERING_PRESETS),['quick','balanced','steady']);
 assert.deepEqual(Object.keys(DASH_TOUCH_TARGETS),['standard','large','extra']);
 assert.equal(DEFAULT_SKY_STEERING,'balanced');
 assert.equal(DEFAULT_DASH_TOUCH,'standard');
 assert.notEqual(controlStorageKey('skyboard',alice),controlStorageKey('skyboard',bob));
 assert.notEqual(controlStorageKey('skyboard',alice),controlStorageKey('dashforge',alice));
 assert.throws(()=>controlStorageKey('skyboard','visitor'),/valid family member/);
 assert.throws(()=>controlStorageKey('other',alice),/valid family member/);
 assert.equal(validControlChoice('skyboard','quick'),true);
 assert.equal(validControlChoice('skyboard','extra'),false);
});

test('each member owns local preference, invalid values recover to default and reset is isolated',()=>{
 const local=storage();
 assert.equal(readControlChoice(local,'skyboard',alice,'balanced'),'balanced');
 assert.equal(saveControlChoice(local,'skyboard',alice,'quick'),true);
 assert.equal(saveControlChoice(local,'skyboard',bob,'steady'),true);
 assert.equal(saveControlChoice(local,'dashforge',alice,'extra'),true);
 assert.equal(readControlChoice(local,'skyboard',alice,'balanced'),'quick');
 assert.equal(readControlChoice(local,'skyboard',bob,'balanced'),'steady');
 assert.equal(readControlChoice(local,'dashforge',alice,'standard'),'extra');
 assert.equal(resetControlChoice(local,'skyboard',alice),true);
 assert.equal(readControlChoice(local,'skyboard',alice,'balanced'),'balanced');
 assert.equal(readControlChoice(local,'skyboard',bob,'balanced'),'steady');
 assert.equal(readControlChoice(local,'dashforge',alice,'standard'),'extra');
 local.records.set(controlStorageKey('skyboard',alice),'spoofed');
 assert.equal(readControlChoice(local,'skyboard',alice,'balanced'),'balanced');
 assert.equal(saveControlChoice(local,'skyboard',alice,'spoofed'),false);
 const blocked={getItem:()=>{throw Error('private mode')},setItem:()=>{throw Error('private mode')},removeItem:()=>{throw Error('private mode')}};
 assert.equal(readControlChoice(blocked,'skyboard',alice,'balanced'),'balanced');
 assert.equal(saveControlChoice(blocked,'skyboard',alice,'quick'),false);
 assert.equal(resetControlChoice(blocked,'skyboard',alice),false);
});

test('quick, balanced and steady steering use hysteresis to avoid mid-stick jitter',()=>{
 assert.equal(steeringWithHysteresis(.15,0,'quick'),1);
 assert.equal(steeringWithHysteresis(.15,0,'balanced'),0);
 assert.equal(steeringWithHysteresis(.15,0,'steady'),0);
 assert.equal(steeringWithHysteresis(.23,0,'balanced'),1);
 assert.equal(steeringWithHysteresis(.16,1,'balanced'),1);
 assert.equal(steeringWithHysteresis(.10,1,'balanced'),0);
 assert.equal(steeringWithHysteresis(-.3,1,'balanced'),-1);
 assert.equal(steeringWithHysteresis(-.16,-1,'balanced'),-1);
 assert.equal(steeringWithHysteresis(NaN,1,'balanced'),0);
 assert.equal(canvasSteeringDirection(13,0,'quick'),1);
 assert.equal(canvasSteeringDirection(13,0,'steady'),0);
 assert.equal(canvasSteeringDirection(15,1,'balanced'),1);
 assert.equal(canvasSteeringDirection(5,1,'balanced'),0);
});

test('settings are member-authenticated and never replace verified control traces',()=>{
 const dash=read('docs/commons-dash-forge.mjs'),sky=read('docs/commons-board-rush.mjs');
 const html=read('docs/community.html'),css=read('docs/family-arcade-player-feel.css');
 for(const name of ['family-arcade-player-feel.mjs','commons-dash-forge.mjs','commons-board-rush.mjs']){
  const file=fileURLToPath(new URL('../docs/'+name,import.meta.url));
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',file]));
 }
 assert.match(dash,/readControlChoice\(window\.localStorage,'dashforge',id/);
 assert.match(sky,/readControlChoice\(window\.localStorage,'skyboard',id/);
 assert.match(dash,/id="dash-touch-target"/);
 assert.match(sky,/id="skyboard-steering-choice"/);
 assert.match(dash,/id="dash-touch-reset"/);
 assert.match(sky,/id="skyboard-steering-reset"/);
 assert.match(dash,/updateDashPressFeedback\(\)/);
 assert.match(sky,/steeringWithHysteresis\(axis,stickDirection,steeringPreset\)/);
 assert.match(sky,/canvasSteeringDirection\(dx,canvasDirection,steeringPreset\)/);
 assert.match(dash,/submitArcadeReplay\(client,cfg,'dash'/);
 assert.match(sky,/submitArcadeReplay\(client,config,'skyboard'/);
 assert.match(html,/family-arcade-player-feel\.css\?v=feel1/);
 assert.match(html,/commons-dash-forge\.mjs\?v=dash9/);
 assert.match(html,/commons-board-rush\.mjs\?v=skyboard9/);
 assert.match(css,/data-dash-touch-target=extra/);
 assert.match(css,/max-width:430px/);
});

test('altering local settings does not change fixed-step gameplay physics',()=>{
 const local=storage();
 const course=createDashCourse('.'.repeat(48),210);
 const a=createDashRun(course),b=createDashRun(course);
 for(let i=0;i<180;i++){
  saveControlChoice(local,'dashforge',alice,i%2?'standard':'extra');
  stepDash(a,i%7===0?3:0);
  stepDash(b,i%7===0?3:0);
 }
 assert.equal(a.tick,b.tick);assert.equal(a.x,b.x);assert.equal(a.y,b.y);assert.equal(a.won,b.won);
 const race=buildSkyCourse(1,123456),r1=createSkyRide(race),r2=createSkyRide(race);
 for(let i=0;i<240;i++){
  saveControlChoice(local,'skyboard',bob,i%2?'steady':'quick');
  const input=i%15<8?2:1;
  stepSky(r1,input);
  stepSky(r2,input);
 }
 assert.equal(r1.tick,r2.tick);assert.equal(r1.progress,r2.progress);
 assert.equal(r1.x,r2.x);assert.equal(r1.y,r2.y);assert.equal(r1.won,r2.won);
});
