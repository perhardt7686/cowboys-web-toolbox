import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {paintScene,EGA} from '../docs/hot-rod-art.mjs';
import {paintVehicle} from '../docs/hot-rod-vehicle-art.mjs';
import {workbenchFasteners} from '../docs/hot-rod-engine-bay.mjs';
import {BOLTS,CARS,RIVALS} from '../docs/hot-rod-catalog.mjs';
import {makeCar,newCampaign,startRace} from '../docs/hot-rod-campaign.mjs';
import {createRace} from '../docs/hot-rod-racing.mjs';

function frame(){
  const pixels=new Uint8Array(320*200).fill(255);
  let ink=0;
  const screen={
    box(x,y,w,h,color){
      assert.ok(Number.isInteger(color)&&color>=0&&color<EGA.length,'Every pixel uses the EGA palette');
      const left=Math.max(0,Math.round(x)),right=Math.min(320,Math.round(x)+Math.round(w));
      for(let row=Math.max(0,Math.round(y));row<Math.min(200,Math.round(y)+Math.round(h));row++){
        if(left<right)pixels.fill(color,row*320+left,row*320+right);
      }
    }
  };
  const canvas={getContext:()=>({
    set fillStyle(color){ink=EGA.indexOf(color);},
    fillRect(x,y,w,h){screen.box(x,y,w,h,ink);}
  })};
  return {screen,canvas,pixels};
}
const digest=pixels=>createHash('sha256').update(pixels).digest('hex');
const render=view=>{const out=frame();paintScene(out.canvas,view);return digest(out.pixels);};

test('all Hot Rod models have distinct side profiles within the EGA palette',()=>{
  const styles=new Set();
  for(const model of Object.values(CARS)){
    const {screen,pixels}=frame();
    const car=makeCar(model,1);
    paintVehicle(screen,model,{...car,color:3},40,86,1);
    const visible=pixels.filter(p=>p!==255).length;
    assert.ok(visible>2400&&visible<16000,model.id+' coverage '+visible);
    styles.add(digest(pixels));
  }
  assert.equal(styles.size,Object.keys(CARS).length);
  const car=makeCar(CARS.chevy40,1),base=render({scene:'garage',car});
  assert.notEqual(render({scene:'garage',car:{...car,color:5}}),base);
  assert.notEqual(render({scene:'garage',car:{...car,roof:true,front:false,decal:1}}),base);
  const raised={...car,jack:'front-left',installed:{...car.installed,'front-left':null}};
  assert.notEqual(render({scene:'garage',car:raised}),base);
});

test('period scenes redraw from persistent and in-progress workshop or driving values',()=>{
  for(const [slot,count] of Object.entries(BOLTS))assert.equal(workbenchFasteners(slot).length,count);
  const car=makeCar(CARS.chevy40,1),view={car,cash:350,hours:130};
  const bay={...view,scene:'workbench',slot:'carb',tuneAvailable:true};
  const compressed=[
    render(bay),
    render({...bay,turns:{0:1},focusBolt:0}),
    render({...bay,car:{...car,bolts:{...car.bolts,carb:car.bolts.carb^1}}}),
    render({...bay,car:{...car,installed:{...car.installed,carb:null}},slot:'manifold'}),
    render({...bay,bayMode:'tune',timing:5,timingReference:4}),
    render({...bay,bayMode:'shelf',shelfParts:[{label:'2-barrel Carter'}]}),
    render({...view,scene:'paper',mode:'cover'}),
    render({...view,scene:'paper',mode:'cars',page:1,car:null}),
    render({...view,scene:'calendar'}),
    render({...view,scene:'calendar',hours:500}),
    render({...view,scene:'diner',rival:RIVALS[0]}),
    render({...view,scene:'diner',rival:RIVALS[0],menuItems:[{label:'For kicks'}]})
  ];
  const state={...newCampaign(),cars:[car],selected:1};
  const {state:staged}=startRace(state,{rival:'earl',kind:'drag',stake:'kicks'},{id:'test-frame',seed:208});
  const race=createRace(staged.race);
  compressed.push(render({...view,scene:'race',race}));
  compressed.push(render({...view,scene:'race',race:{...race,result:{outcome:'police20'}}}));
  compressed.push(render({...view,scene:'race',race:{...race,result:{outcome:'police75'}}}));
  assert.equal(new Set(compressed).size,compressed.length);
});

test('Pass 1 silhouettes retain unique period vehicle identities across every garage car',()=>{
  const unique=new Set();
  for(const model of Object.values(CARS)){
    const frameImage=frame();
    const car=makeCar(model,1);
    paintVehicle(frameImage.screen,model,car,40,80,1);
    const pixelCount=frameImage.pixels.filter(pixel=>pixel!==255).length;
    assert.ok(pixelCount>2200,model.id+' silhouette visibility');
    unique.add(digest(frameImage.pixels));
    assert.notEqual(render({scene:'garage',car}),render({scene:'garage',car:{...car,color:car.color===3?12:3}}),model.id+' repaint visibility');
  }
  assert.equal(unique.size,Object.keys(CARS).length,'Each car has a distinct period profile');
});

test('Pass 1 cockpit responds to road, steering, speed and shifting without race mutations',()=>{
  const car=makeCar(CARS.valiant61,1);
  const start={...newCampaign(),cars:[car],selected:1};
  const {state:staged}=startRace(start,{rival:'earl',kind:'drag',stake:'kicks'},{id:'art-only-ride',seed:208});
  const race=createRace(staged.race);
  const image=trial=>render({scene:'race',car,race:trial});
  const untouched=JSON.stringify(race);
  const base=image(race);
  const steer=structuredClone(race);steer.player.heading=.85;
  const speed=structuredClone(race);speed.player.speed=24;speed.player.engine=3850;speed.player.gear=2;speed.player.distance=145;
  const road=structuredClone(race);road.contract.kind='road';road.length=4023.36;road.player.distance=180;
  assert.notEqual(image(steer),base,'Wheel should visibly steer');
  assert.notEqual(image(speed),base,'Gauges and road should react to driving');
  assert.notEqual(image(road),base,'Road and drag scenes should differ');
  assert.equal(JSON.stringify(race),untouched,'Painting must not mutate server-replayed race state');
});

test('1989 workshop wrench and parts progress have distinct inspectable states',()=>{
  const car=makeCar(CARS.chevy40,1);
  const base={scene:'workbench',slot:'carb',car,bayMode:'work',cash:450};
  const untouched=JSON.stringify(car);
  const before=render(base);
  assert.notEqual(render({...base,focusBolt:0,turns:{0:0}}),before,'First selected bolt is highlighted');
  assert.notEqual(render({...base,focusBolt:0,turns:{0:1}}),before,'First wrench turn appears');
  assert.notEqual(render({...base,locked:true}),before,'Blocked part clearly says why');
  assert.notEqual(render({...base,car:{...car,installed:{...car.installed,carb:null}}}),before,'Empty mounting hole appears');
  assert.equal(JSON.stringify(car),untouched,'Workshop painting cannot change saved hardware');
});

test('Bob’s Drive-In faithfully responds to driver, challenge and cash while remaining visual-only',()=>{
  const base={scene:'diner',rival:RIVALS[0],cash:350,hours:130};
  const before=JSON.stringify(base);
  const picture=render(base);
  assert.notEqual(render({...base,rival:RIVALS[1]}),picture,'Changing rivals updates diner art and dialogue');
  assert.notEqual(render({...base,menuItems:[{label:'For kicks',selected:true},{label:'Pink slips',disabled:true}]}),picture,'Original-style offer menu appears');
  assert.notEqual(render({...base,cash:500}),picture,'Bankroll caption reflects the save');
  assert.equal(JSON.stringify(base),before,'Diner art cannot alter any server state');
});

test('Classic-car rebuild keeps all period car shapes original, model-specific and responsive',()=>{
  const carIDs=['ford32','chevy40','fairlane55','vette56','fairlane57'];
  const signatures=new Set();
  for(const id of carIDs) {
    const model=CARS[id],car=makeCar(model,1),img=frame();
    paintVehicle(img.screen,model,car,40,86,1);
    signatures.add(digest(img.pixels));
    assert.ok(img.pixels.filter(p=>p!==255).length>2600,id+' must visibly fill the garage');
    const chopped=structuredClone(car);chopped.roof=true;
    assert.notEqual(render({scene:'garage',car:chopped}),render({scene:'garage',car}),id+' chop option still changes visual design');
  }
  assert.equal(signatures.size,carIDs.length);
});
