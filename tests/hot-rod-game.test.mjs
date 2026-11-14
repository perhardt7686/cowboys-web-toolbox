import test from 'node:test';
import assert from 'node:assert/strict';
import {activeCar, applyWorkshop, carOffer, carSpec, challengeProblem, makeCar, newCampaign,
  roadProblem, settleRace, startRace} from '../docs/hot-rod-campaign.mjs';
import {BOLTS, CARS, DEADLINE, RIVAL_BY_ID, WHEELS, fullBolts} from '../docs/hot-rod-catalog.mjs';
import {courseCurve, createRace, INPUT, recordInput, replayRace, stepRace} from '../docs/hot-rod-racing.mjs';

const complete = (state, action) => applyWorkshop(state,action).state;
const buy = (state, id) => complete(state,{type:'buy-car',id,offer:carOffer(CARS[id])});
const raceContext = seed => ({id:crypto.randomUUID(),seed,now:0});
const workshop = (state, slot, desired) => {
  const count = BOLTS[slot];
  if (WHEELS.includes(slot)) state = complete(state,{type:'jack', slot});
  if (slot === 'engine') state = complete(state,{type:'ignition'});
  for (let index=0; index<count; index++) state = complete(state,{type:'bolt',slot,index});
  state = complete(state,{type:'remove',slot});
  if (desired) {
    const index = state.inventory.findIndex(item => item.id === desired);
    assert.notEqual(index, -1, 'Compatible part was bought from the paper');
    state = complete(state,{type:'install',slot,index});
    for (let index=0; index<count; index++) state = complete(state,{type:'bolt',slot,index});
    if (WHEELS.includes(slot)) state = complete(state,{type:'jack',slot});
    if (slot === 'engine') state = complete(state,{type:'ignition'});
  }
  return state;
};
function fit(state,slot,desired) {
  const index = state.inventory.findIndex(item => item.id === desired);
  assert.notEqual(index,-1);
  state = complete(state,{type:'install',slot,index});
  for (let i=0;i<BOLTS[slot];i++) state=complete(state,{type:'bolt',slot,index:i});
  return state;
}

// The controller uses the same public input bits as a player. It reads the
// running cockpit simulation to time shifts, turn, and brake. Race outcomes
// are exclusively decided by the deterministic drive and its input replay.
function drive(contract, plan = 'win') {
  const race = createRace(contract), inputs = [];
  while (!race.result && race.tick < 5600) {
    const {player, greenAt, tick} = race;
    const spec = contract.player;
    let mask = 0;
    if (plan === 'jump' && tick < greenAt - 1) mask = INPUT.gas | (tick === 0 ? INPUT.up : 0);
    else if (tick + 1 >= greenAt) {
      if (plan === 'redline') mask = INPUT.gas;
      else if (plan === 'crash') mask = INPUT.gas | INPUT.right | (player.gear ? 0 : INPUT.up);
      else {
        const curve = contract.kind === 'road' ? courseCurve(player.distance + player.speed * 0.26,contract.seed) : 0;
        const correction = curve * (player.speed / 27) - player.offset * 2.45 - player.heading * 0.4;
        const threshold = 0.23 * (0.55 + 0.54 * spec.grip);
        if (correction < -threshold) mask |= INPUT.left;
        if (correction > threshold) mask |= INPUT.right;
        const future = contract.kind === 'road' ? Math.abs(courseCurve(player.distance + 26,contract.seed)) : 0;
        const planned = contract.kind === 'drag' ? 65 : Math.min(47,34/(0.70+future*0.4));
        if (player.speed < planned && !player.shiftTime) mask |= INPUT.gas;
        if (player.speed > planned+2) mask |= INPUT.brake;
        if (!spec.automatic) {
          if (!player.gear || (player.engine > spec.redline*.86 && player.gear < spec.ratios.length)) {
            mask=(mask&~INPUT.gas)|INPUT.up|INPUT.clutch;
          } else if (player.gear > 1 && player.engine < spec.redline*.32 && !player.shiftTime) {
            mask=(mask&~INPUT.gas)|INPUT.down|INPUT.clutch;
          }
        }
        if (plan === 'pull-over' && race.patrolAt !== null) mask = (mask & (INPUT.left|INPUT.right)) | INPUT.brake;
      }
    }
    stepRace(race,mask);
    recordInput(inputs,mask);
  }
  assert.ok(race.result, 'Race reached a terminal event');
  assert.deepEqual(replayRace(contract,inputs).result,race.result);
  return {result:race.result, inputs};
}

function meet(state, rival, kind, stake, seed = 17, plan) {
  if (state.status === 'summer' && activeCar(state).fuel < 85) {
    state = complete(state,{type:'fuel',value:'full'});
  }
  if (state.status === 'summer') state = complete(state,{type:'trip'});
  const {state:staged} = startRace(state,{rival,kind,stake},raceContext(seed));
  const {result,inputs} = drive(staged.race,plan);
  return {...settleRace(staged,result),inputs,contract:staged.race,result};
}

test('start with the original bankroll and replace the physical engine in dependency order', () => {
  let state=newCampaign();
  assert.equal(state.cash,750);
  assert.equal(activeCar(state),undefined);
  assert.throws(()=>buy(state,'vette63'),/short on cash/i);
  state=buy(state,'ford32');
  assert.equal(state.cash,458);
  assert.throws(()=>complete(state,{type:'bolt',slot:'engine',index:0}),/manifold/i);
  assert.throws(()=>complete(state,{type:'remove',slot:'carb'}),/every fastener/i);
  assert.throws(()=>complete(state,{type:'bolt',slot:WHEELS[0],index:0}),/jack/i);
  const original=carSpec(activeCar(state));
  state=workshop(state,'carb');
  assert.match(roadProblem(activeCar(state)),/carburetor is missing/i);
  state=workshop(state,'manifold');
  state=workshop(state,'engine');
  assert.match(roadProblem(activeCar(state)),/engine is missing/i);
  state=complete(state,{type:'buy-part',id:'ford-street'});
  assert.equal(state.cash,93);
  assert.throws(()=>fit(state,'manifold','ford-six-intake'),/does not fit/i);
  state=fit(state,'engine','ford-street');
  assert.throws(()=>fit(state,'manifold','ford-six-intake'),/does not fit/i);
  state=complete(state,{type:'ignition'});
  state=complete(state,{type:'buy-part',id:'ford-v8-intake'});
  state=fit(state,'manifold','ford-v8-intake');
  state=fit(state,'carb','carb2');
  state=complete(state,{type:'tune',value:7});
  assert.equal(roadProblem(activeCar(state)),'');
  assert.ok(carSpec(activeCar(state)).hp>original.hp*1.8);
  assert.equal(activeCar(state).bolts.manifold,fullBolts('manifold'));
  assert.throws(()=>complete(state,{type:'buy-part',id:'gm-race'}),/short on cash/i);
  const resumed=JSON.parse(JSON.stringify(state));
  assert.deepEqual(resumed,state);
});

test('a $750 summer can earn both titles through driving, sales, upgrades, and real replays', () => {
  let state = buy(newCampaign(),'valiant61');
  let run = meet(state,'earl','drag','10');
  assert.equal(run.record.won,true);
  assert.ok(run.record.points > 0);
  state = run.state;
  for (let i=0;i<4;i++) {
    run=meet(state,'earl','drag',i===0?'10':'50');
    assert.equal(run.record.won,true);
    state=run.state;
  }
  assert.equal(state.dragWins,5);
  for (const rival of ['earl','lenny','bobby','rusty','earl']) {
    run=meet(state,rival,'road',rival==='lenny'?'pink':state.roadWins?'100':'25');
    assert.equal(run.record.won,true,rival);
    state=run.state;
  }
  assert.equal(state.roadWins,5);
  assert.equal(state.cars.length,2);
  const prize = state.cars.find(car=>car.number!==state.selected);
  state=complete(state,{type:'select-car',number:prize.number});
  state=complete(state,{type:'sell-car'});
  state=complete(state,{type:'buy-part',id:'mopar-race'});
  state=complete(state,{type:'buy-part',id:'mopar-4-intake'});
  state=complete(state,{type:'buy-part',id:'carb4'});
  state=workshop(state,'carb');
  state=workshop(state,'manifold');
  state=workshop(state,'engine');
  state=fit(state,'engine','mopar-race');
  state=complete(state,{type:'ignition'});
  state=fit(state,'manifold','mopar-4-intake');
  state=fit(state,'carb','carb4');
  state=complete(state,{type:'tune',value:9});
  while(state.cash<452) {
    run=meet(state,'earl','road','100');
    assert.equal(run.record.won,true);
    state=run.state;
  }
  state=complete(state,{type:'buy-part',id:'mopar-trans-4'});
  state=workshop(state,'gearbox','mopar-trans-4');
  for (const wheel of WHEELS) {
    if(state.cash<42){
      run=meet(state,'earl','road','100');
      assert.equal(run.record.won,true);
      state=run.state;
    }
    state=complete(state,{type:'buy-part',id:'tire-road'});
    state=workshop(state,wheel,'tire-road');
  }
  assert.equal(challengeProblem(state,RIVAL_BY_ID.king,'road','pink'),'');
  assert.match(challengeProblem(state,RIVAL_BY_ID.mystery,'road','kicks'),/beat the king/i);
  run=meet(state,'king','road','pink');
  assert.equal(run.record.champion,true);
  assert.equal(run.state.status,'champion');
  assert.equal(run.state.bonus.unlocked,true);
  assert.equal(run.state.cars.find(car => car.number === run.state.bonus.car)?.model,'vette63');
  assert.throws(()=>replayRace(run.contract,run.inputs.slice(0,1)),/unfinished/i);
  assert.throws(()=>replayRace(run.contract,[...run.inputs,[0,1]]),/after the finish/i);
  const classicCash = run.state.cash;
  run=meet(run.state,'mystery','road','kicks');
  assert.equal(run.record.won,true);
  assert.equal(run.record.points,150);
  assert.equal(run.state.cash,classicCash);
  assert.equal(run.state.bonus.won,true);
  assert.equal(run.state.bonus.attempts,1);
  assert.match(challengeProblem(run.state,RIVAL_BY_ID.mystery,'road','kicks'),/already won/i);
});

test('rules cover early launch, equipment failures, police, title loss, and the deadline', () => {
  let state=buy(newCampaign(),'ford32');
  let run=meet(state,'earl','drag','10',17,'jump');
  assert.equal(run.result.outcome,'false_start');
  assert.equal(run.state.cash,448);
  assert.equal(run.state.points,0);
  run=meet(state,'earl','drag','10',17,'redline');
  assert.equal(run.result.outcome,'engine');
  assert.match(roadProblem(activeCar(run.state)),/worn out/i);
  run=meet(state,'earl','road','25',17,'crash');
  assert.equal(run.result.outcome,'crash');
  assert.match(roadProblem(activeCar(run.state)),/body needs repair/i);
  state=buy(newCampaign(),'valiant61');
  run=meet(state,'earl','road','25',16,'pull-over');
  assert.equal(run.result.outcome,'police20');
  assert.equal(run.state.cash,state.cash-45);
  state.cash=26;
  run=meet(state,'earl','road','25',16,'pull-over');
  assert.equal(run.state.status,'jail');
  state=buy(newCampaign(),'ford32');
  state.dragWins=1;
  const staged=startRace(state,{rival:'lenny', kind:'road',stake:'pink'},raceContext(7)).state;
  const forfeited=settleRace(staged,{outcome:'abandoned',ms:0,wear:0,fuel:2,reaction:0});
  assert.equal(forfeited.state.cars.length,0);
  assert.equal(forfeited.state.losses,1);
  assert.equal(forfeited.state.cash,state.cash);
  state.hours=DEADLINE-2;
  state=complete(state,{type:'rest'});
  assert.equal(state.status,'deadline');
  assert.throws(()=>complete(state,{type:'rest'}),/finish the current event/i);
});

test('a family challenge measures a clean timed run from identical input',()=>{
  const campaign=buy(newCampaign(),'chevy40');
  const spec = carSpec(activeCar(campaign),'drag');
  const contract = {kind:'drag',seed:53,player:spec,opponent:spec,timeTrial:true};
  const {result,inputs} = drive(contract);
  assert.equal(result.outcome,'finish');
  assert.equal(replayRace(contract,inputs).result.ms,result.ms);
});
