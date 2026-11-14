import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 makePowertrain,stepPowertrain,changeGear,automaticShift,roadWarning,
 rpmFor,roadCurve,specFor,supportedModels
} from '../docs/streetrod-race-physics.mjs';
const model={car_key:'rattler',engine:2,tires:2,gearbox:1,condition:100,tune:0};
function simulate(inputs,steps,gear=1,mode='drag'){
 const s=makePowertrain(model,{seed:1674,type:mode});
 s.gear=gear;
 for(let i=0;i<steps;i++)stepPowertrain(s,inputs,.04,i*40);
 return s;
}
test('Every available 1963 campaign car has a mass, redline, four speeds and physical tyres',()=>{
 for(const key of supportedModels){
  const s=specFor(key);
  assert.ok(s.mass>900&&s.redline>3000&&s.radius>.28);
  assert.equal(s.ratios.length,4);
  assert.ok(s.ratios[0]>s.ratios[1]&&s.ratios[1]>s.ratios[2]&&s.ratios[2]>s.ratios[3]);
 }
});
test('A first-gear acceleration pull is visibly different from fourth-gear launch',()=>{
 const first=simulate({gas:1,brake:0,steer:0},150,1);
 const fourth=simulate({gas:1,brake:0,steer:0},150,4);
 assert.ok(first.speed>fourth.speed+9,JSON.stringify({first:first.speed,fourth:fourth.speed}));
 assert.ok(first.distance>fourth.distance+15);
});
test('Changing gear changes RPM and briefly interrupts torque for clutch engagement',()=>{
 const a=makePowertrain(model,{type:'drag'});
 a.speed=43;a.rpm=rpmFor(a);
 const before=a.rpm;
 assert.equal(changeGear(a,1,6000),true);
 assert.equal(a.gear,2);
 assert.ok(a.rpm<before);
 assert.ok(a.shiftUntil>6000);
 assert.deepEqual(a.shiftedAt,[6000]);
 assert.equal(changeGear(a,3,6100),true);
 assert.equal(a.gear,4);
 assert.equal(changeGear(a,1,6200),false);
});
test('Redline and overheating lower wheel torque instead of increasing speed forever',()=>{
 const normal=makePowertrain(model,{type:'drag'});
 const high=makePowertrain(model,{type:'drag'});
 normal.speed=49;high.speed=49;
 high.gear=1;normal.gear=2;
 stepPowertrain(normal,{gas:1},.1,10000);
 stepPowertrain(high,{gas:1},.1,10000);
 assert.ok(high.redlineHits>0,'First should hit old hot-rod redline');
 assert.ok(normal.lastDelta>high.lastDelta,JSON.stringify({normal:normal.lastDelta,high:high.lastDelta}));
});
test('Steering into road bends changes traction and distance; straight drag steering is penalized',()=>{
 const seed=458;
 const follow=makePowertrain(model,{type:'road',seed});
 const miss=makePowertrain(model,{type:'road',seed});
 follow.speed=60;miss.speed=60;follow.gear=3;miss.gear=3;
 for(let i=0;i<120;i++){
  const t=16000+i*40;
  stepPowertrain(follow,{gas:1,steer:roadCurve(seed,t)},.04,t);
  stepPowertrain(miss,{gas:1,steer:-roadCurve(seed,t)},.04,t);
 }
 assert.ok(follow.distance>miss.distance,JSON.stringify([follow.distance,miss.distance]));
 assert.ok(['CURVE RIGHT','CURVE LEFT','SHIFT UP / REV LIMIT','TRACTION LOST','ENGINE HOT','AUTO SHIFT','MANUAL SHIFT'].includes(roadWarning(follow,20000)));
});
test('Automatic changes gears only when driven into the power band',()=>{
 const m=makePowertrain(model,{type:'drag'});
 m.speed=45;
 const expected=m.gear;
 automaticShift(m,9900);
 assert.ok(m.gear===expected||m.gear===expected+1);
 if(m.gear===2)assert.equal(m.shiftedAt.length,1);
 m.automatic=false;const before=m.gear;
 automaticShift(m,10000);
 assert.equal(m.gear,before);
});
test('Higher engine and tyre upgrades improve acceleration within server data ranges',()=>{
 const base=makePowertrain({car_key:'rattler',engine:0,tires:0,gearbox:0,condition:100},{type:'drag'});
 const tuned=makePowertrain({car_key:'rattler',engine:5,tires:5,gearbox:5,condition:100},{type:'drag'});
 for(let i=0;i<160;i++){
  stepPowertrain(base,{gas:1},.04,i*40);
  stepPowertrain(tuned,{gas:1},.04,i*40);
 }
 assert.ok(tuned.speed>base.speed);
});
test('Physics engine is isolated from authenticated RPCs and game records',async()=>{
 const src=await readFile(new URL('../docs/streetrod-race-physics.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/fetch\(|\.rpc\(|community_streetrod_season_races/);
 const season=await readFile(new URL('../docs/commons-streetrod-summer.mjs',import.meta.url),'utf8');
 assert.match(season,/stepPowertrain\(m,/);
 assert.match(season,/automaticShift\(m,/);
 assert.match(season,/community_streetrod_season_race_finish/);
 assert.match(season,/p_trace:r\.trace/);
 const bay=await readFile(new URL('../docs/commons-streetrod-season-bay.mjs',import.meta.url),'utf8');
 assert.match(bay,/renderAssemblyPager/);
 assert.match(bay,/data-assembly/);
 assert.match(bay,/data-ssb-page="next"/);
});

test('Full stock-car 1/4-mile run reaches the finish with real gearbox physics',()=>{
 const m=makePowertrain({car_key:'rattler',engine:0,tires:0,gearbox:0,condition:100},{type:'drag',seed:1903});
 let elapsed=0;
 for(let i=0;i<6000&&m.distance<1320;i++){
  elapsed=i*40;
  automaticShift(m,elapsed);
  stepPowertrain(m,{gas:1},.04,elapsed);
 }
 assert.ok(m.distance>=1320,'Stock car must reach 1/4 mile without impossible throttle requirement');
 assert.ok(elapsed>=9500&&elapsed<240000,'Elapsed '+elapsed+'ms outside server range');
 assert.ok(m.gear>=2,'Automatic transmission never upshifted');
 assert.ok(m.speed>20&&m.speed<190,'Finish speed impossible: '+m.speed);
});
test('Full road course reaches the 2.5-mile finish within race-trace storage limit',()=>{
 const m=makePowertrain({car_key:'comet',engine:1,tires:1,gearbox:1,condition:100},{type:'road',seed:12092});
 let elapsed=0;
 for(let i=0;i<6000&&m.distance<13200;i++){
  elapsed=i*40;
  automaticShift(m,elapsed);
  stepPowertrain(m,{gas:1,steer:roadCurve(m.seed,elapsed)},.04,elapsed);
 }
 assert.ok(m.distance>=13200,'Road race did not finish: '+Math.round(m.distance)+'ft');
 assert.ok(elapsed>=42000&&elapsed<240000,'Road trace would be rejected: '+elapsed+'ms');
});

test('Newly applied race RPC accepts recorded long shifts and reaction rather than fabricating quick shifts',async()=>{
 const season=await readFile(new URL('../docs/commons-streetrod-summer.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(season,/p_launch_ms:300/);
 assert.doesNotMatch(season,/\[3100,5500,9200\]/);
 assert.match(season,/p_launch_ms:launch,p_shifts:shifts,p_trace:r\.trace/);
 assert.match(season,/m\.shiftedAt\.length>r\.shifts\.length/);
 assert.match(season,/while\(shifts\.length<3\)shifts\.push\(250000/);
 const migration=await readFile(new URL('../supabase/migrations/20261114131126_streetrod_race_authentic_shift_and_launch_timing.sql',import.meta.url),'utf8');
 for(const token of ['p_launch_ms>120000','p_shifts[1] NOT BETWEEN 500 AND 300000',
  'p_shifts[3]>300000','community_streetrod_member()','SECURITY DEFINER',
  "SET search_path TO 'pg_catalog', 'public'"]){
  assert.ok(migration.includes(token),'Missing real-race safety or timing rule: '+token);
 }
 assert.doesNotMatch(migration,/DROP TABLE|TRUNCATE|DELETE FROM auth\.users|REVOKE EXECUTE/);
});
