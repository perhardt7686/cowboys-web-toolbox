import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {CAR_LIST,CARS} from '../docs/hot-rod-catalog.mjs';
import {makeCar,carSpec,newCampaign,applyWorkshop,matches,spareSaleValue} from '../docs/hot-rod-campaign.mjs';
import {createRace,stepRace,recordInput,replayRace,INPUT} from '../docs/hot-rod-racing.mjs';
import {paintRaceVehicle} from '../docs/hot-rod-vehicle-art.mjs';

const cfg=(id='chevy40',kind='road',version=3)=>{
  const spec=carSpec(makeCar(CARS[id],1),kind);
  return {player:spec,opponent:spec,kind,seed:17,timeTrial:true,physicsVersion:version};
};
function moving(speed=35){
  const race=createRace(cfg());race.greenAt=0;
  Object.assign(race.player,{speed,gear:3,engine:3000,clutchGrip:1});return race;
}
test('brief steering corrections at highway speed remain controllable and spring back',()=>{
  const race=moving(40);
  for(let i=0;i<4;i++)stepRace(race,INPUT.right|INPUT.gas);
  for(let i=0;i<18;i++)stepRace(race,INPUT.gas);
  assert.equal(race.result,null);assert.ok(Math.abs(race.player.offset)<0.6);
  assert.ok(Math.abs(race.player.heading)<0.025);
});
test('a shoulder excursion gives time to steer back instead of an immediate wreck',()=>{
  const race=moving();race.player.offset=1.27;
  for(let i=0;i<12;i++)stepRace(race,INPUT.gas);
  assert.equal(race.result,null);
  for(let i=0;i<16;i++)stepRace(race,INPUT.left);
  assert.equal(race.result,null);assert.ok(race.player.offset<1.13);
});
test('a glancing contact uses closing speed rather than automatically wrecking both fast cars',()=>{
  const race=moving(32);race.contract.timeTrial=false;
  Object.assign(race.opponent,{speed:32,gear:3,engine:3000,clutchGrip:1});race.player.offset=-0.95;
  stepRace(race,INPUT.gas);
  assert.equal(race.result,null);assert.ok(race.player.impact>0&&race.player.impact<30);
});
test('stock period cars can finish an ordinary road run with small digital steering corrections',()=>{
  for(const id of ['ford32','chevy40','valiant61','vette63','econoline61']){
    const contract=cfg(id),race=createRace(contract),log=[];
    for(let i=0;i<5600&&!race.result;i++){
      const p=race.player,spec=contract.player;
      let mask=i<race.greenAt?INPUT.brake:p.speed<29?INPUT.gas:p.speed>30.5?INPUT.brake:0;
      if(i>=race.greenAt&&(p.gear===0||p.shiftTime===0&&p.engine>spec.redline*0.80&&p.gear<spec.ratios.length))mask=INPUT.clutch|INPUT.up;
      if(p.offset>0.12)mask|=INPUT.left;else if(p.offset< -0.12)mask|=INPUT.right;
      stepRace(race,mask);recordInput(log,mask);
    }
    assert.equal(race.result?.outcome,'finish',id+' should survive normal driving');
    assert.ok(race.result.wear<8,id+' normal engine wear should be modest');
    assert.deepEqual(replayRace(contract,log).result,race.result);
  }
});
test('sustained abuse still breaks an engine; leaving the road still causes a wreck',()=>{
  const rev=createRace(cfg('chevy40','drag'));rev.greenAt=0;
  for(let i=0;i<800&&!rev.result;i++)stepRace(rev,INPUT.gas|INPUT.clutch);
  assert.equal(rev.result?.outcome,'engine');
  const off=moving();off.player.offset=2.3;stepRace(off,INPUT.gas);
  assert.equal(off.result?.outcome,'crash');
});
test('already-issued v2 contracts keep their exact production replay fingerprint',()=>{
  const race=createRace(cfg('chevy40','drag',2));race.greenAt=0;
  for(let i=0;i<110;i++)stepRace(race,INPUT.gas|(i===0?INPUT.up:0));
  for(const [field,value] of Object.entries({speed:15.295998481196643,distance:41.183652343439114,engine:4824.990203888345,wear:0.6849614267650992})){
    assert.ok(Math.abs(race.player[field]-value)<1e-9,'Issued v2 changed '+field);
  }
});
test('incompatible purchases remain stored, move between selected cars, and can be resold',()=>{
  let state=newCampaign();state.cash=10000;
  state=applyWorkshop(state,{type:'buy-car',id:'ford32',offer:325}).state;
  state=applyWorkshop(state,{type:'buy-part',id:'gm-street'}).state;
  assert.equal(matches(state.cars[0],'engine',state.inventory[0].id),false);
  state=applyWorkshop(state,{type:'buy-car',id:'chevy40',offer:400}).state;
  assert.equal(matches(state.cars[1],'engine',state.inventory[0].id),true);
  state=JSON.parse(JSON.stringify(state));const cash=state.cash,value=spareSaleValue(state.inventory[0]);
  const sold=applyWorkshop(state,{type:'sell-part',index:0}).state;
  assert.equal(sold.cash,cash+value);assert.equal(sold.inventory.length,0);assert.equal(state.inventory.length,1);
});
test('an unused spare tire can be returned without accepting worn tires or minting money',()=>{
  let state=newCampaign();state=applyWorkshop(state,{type:'buy-part',id:'tire-road'}).state;
  const before=state.cash;state=applyWorkshop(state,{type:'sell-part',index:0}).state;
  assert.equal(state.cash,before+29);assert.ok(state.cash<750);
  state.inventory=[{id:'tire-bias',wear:69}];
  assert.throws(()=>applyWorkshop(state,{type:'sell-part',index:0}),/used tires/);
});
function racingPixels(model,appearance={}){
  const pixels=new Uint8Array(240*76).fill(255);
  const screen={box(x,y,w,h,color){
    assert.ok(Number.isInteger(color)&&color>=0&&color<=15);
    for(let yy=Math.max(0,Math.round(y));yy<Math.min(76,Math.round(y)+Math.round(h));yy++)
      for(let xx=Math.max(0,Math.round(x));xx<Math.min(240,Math.round(x)+Math.round(w));xx++)pixels[yy*240+xx]=color;
  }};
  paintRaceVehicle(screen,model,{color:model.color,...appearance},120,72,1.4);return pixels;
}
const hash=pixels=>createHash('sha256').update(pixels).digest('hex');
test('all forty racing opponents have distinct period identities, paint and saved cosmetics',()=>{
  assert.equal(new Set(CAR_LIST.map(model=>hash(racingPixels(model)))).size,40);
  const model=CARS.vette63,base=hash(racingPixels(model));
  for(const look of [{color:12},{rear:false},{roof:true},{decal:2}])assert.notEqual(base,hash(racingPixels(model,look)));
});
