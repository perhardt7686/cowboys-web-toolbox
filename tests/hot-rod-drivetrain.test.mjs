import test from 'node:test';
import assert from 'node:assert/strict';
import {CARS} from '../docs/hot-rod-catalog.mjs';
import {makeCar,carSpec} from '../docs/hot-rod-campaign.mjs';
import {createRace,stepRace,recordInput,replayRace,INPUT,STEP} from '../docs/hot-rod-racing.mjs';

const driver = () => carSpec(makeCar(CARS.chevy40,1),'drag');
const contract = (model=driver()) => ({
  player:model,opponent:model,kind:'drag',seed:17,reaction:0,
  skill:0.9,timeTrial:true,patrol:false,physicsVersion:2
});
const stand = () => {const race=createRace(contract());race.greenAt=0;return race;};
const accelerate=(race,ticks=60) => {
  for(let i=0;i<ticks;i++)stepRace(race,INPUT.gas|(i===0?INPUT.up:0));
  return race;
};

test('accelerator and brake pedals travel progressively, not as teleporting full-force values',()=>{
  const race=stand();
  stepRace(race,INPUT.up|INPUT.gas);
  assert.ok(race.player.throttle>0&&race.player.throttle<1);
  assert.equal(race.player.braking,0);
  for(let i=0;i<20;i++)stepRace(race,INPUT.gas);
  assert.ok(race.player.throttle>0.99);
  stepRace(race,INPUT.brake);
  assert.ok(race.player.throttle<0.5);
  assert.ok(race.player.braking>0&&race.player.braking<1);
});

test('manual clutch disengages power and low gears produce genuine engine braking',()=>{
  const base=accelerate(stand(),95);
  assert.ok(base.player.speed>8,'Car must be moving before neutral coast test');
  const geared=structuredClone(base), free=structuredClone(base);
  for(let i=0;i<14;i++){
    stepRace(geared,0);
    stepRace(free,INPUT.clutch);
  }
  assert.ok(geared.player.speed<free.player.speed-0.04,
    'Gear engagement should slow the car more than a held-down clutch');
  assert.ok(free.player.clutchGrip<0.01);
});

test('clutch-assisted lifted-throttle upshift is quicker and causes less wear than a power shift',()=>{
  const base=accelerate(stand(),110);
  assert.equal(base.player.gear,1);
  assert.equal(base.player.shiftTime,0);
  const smooth=structuredClone(base),rough=structuredClone(base);
  stepRace(smooth,INPUT.clutch|INPUT.up);
  stepRace(rough,INPUT.gas|INPUT.up);
  assert.equal(smooth.player.gear,2);
  assert.equal(rough.player.gear,2);
  assert.ok(smooth.player.shiftTime<rough.player.shiftTime);
  assert.ok(rough.player.gearbox>smooth.player.gearbox,
    'Missing clutch at elevated RPM should stress 1960s synchronizers');
});

test('server replay remains deterministic with the same seven-bit classic touch and keyboard masks',()=>{
  const tuned=carSpec(makeCar(CARS.vette63,1),'drag');
  const cfg=contract(tuned);
  const race=createRace(cfg),log=[];
  for(let i=0;i<3500&&!race.result;i++){
    const p=race.player;
    let mask=INPUT.gas;
    if(i<race.greenAt)mask=INPUT.brake;
    else if(p.gear===0 || (p.shiftTime===0&&p.engine>tuned.redline*0.81&&p.gear<tuned.ratios.length)){
      mask=INPUT.clutch|INPUT.up;
    }
    stepRace(race,mask);
    recordInput(log,mask);
  }
  assert.ok(race.result,'Synthetic race must finish with a complete trace');
  assert.ok(log.every(pair=>pair[0]>=0&&pair[0]<=127),'Replay protocol remains seven bits');
  const replay=replayRace(cfg,log);
  assert.deepEqual(replay.result,race.result);
  assert.equal(replay.ticks,race.tick);
});

test('legacy races remain on original physics, even after v2 clients and backend deploy',()=>{
  const old=contract(),modern=contract();
  delete old.physicsVersion;
  const prior=createRace(old),upgraded=createRace(modern);
  prior.greenAt=0;upgraded.greenAt=0;
  stepRace(prior,INPUT.gas|INPUT.up);
  stepRace(upgraded,INPUT.gas|INPUT.up);
  assert.equal(prior.player.throttle,0,'Original simulator must not mutate v2 throttle');
  assert.ok(upgraded.player.throttle>0,'Opt-in v2 uses progressive pedal travel');
  assert.equal(prior.player.gear,upgraded.player.gear);
});


test('pre-upgrade 1963 stock-car trace retains its exact legacy physics fingerprint',()=>{
  const cfg=contract();delete cfg.physicsVersion;
  const race=createRace(cfg);race.greenAt=0;
  for(let i=0;i<110;i++)stepRace(race,INPUT.gas|(i===0?INPUT.up:0));
  // Measured against the original production simulator before this change.
  const expected={speed:15.386926361780858,distance:41.81541893963826,
    engine:4849.402511099823,wear:0.6935167657943797,gear:1};
  for(const [key,value] of Object.entries(expected)){
    assert.ok(Math.abs(race.player[key]-value)<1e-9,
      'Old browser race replay changed '+key+': '+race.player[key]);
  }
});
