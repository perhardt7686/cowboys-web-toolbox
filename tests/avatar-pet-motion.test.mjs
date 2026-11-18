import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE} from '../docs/avatar-studio-geometry.mjs?v=workshop1';
import {petMotionFrame} from '../docs/avatar-pet-motion.mjs?v=species1';
import {buildAvatar} from '../docs/avatar-studio-character.mjs?v=workshop1';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs?v=workshop1';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs?v=workshop1';
import {poseStudioAction} from '../docs/avatar-studio-actions.mjs?v=workshop1';
import {poseCompanion} from '../docs/avatar-studio-companions.mjs?v=workshop1';

const frame=(species,move='hop',progress=.5,action='play')=>
  petMotionFrame({species,move,action,progress,active:true,time:0});

test('species have visibly different, deterministic motion grammars',()=>{
  const fixtures=[
    ['hunter','glide','trot'],['woodland','hop','hop'],
    ['reptile','wobble','crawl'],['bird','wobble','waddle'],
    ['moth','glide','flutter'],['winged','glide','flight'],
    ['winged','hop','spring'],['phantom','float','drift'],
    ['automaton','wobble','clockwork'],['oddity','float','drift']
  ];
  const different=new Set();
  for(const [species,move,kind] of fixtures){
    const a=frame(species,move);
    const b=frame(species,move);
    assert.equal(a.kind,kind);
    assert.deepEqual(a,b,'animation must be deterministic');
    assert.ok(Object.isFrozen(a),'a pet cannot change a different pet frame');
    const signature=[a.bob,a.stride,a.roll,a.wing,a.yaw,a.pitch]
      .map(x=>x.toFixed(5)).join('/');
    different.add(signature);
    for(const p of [0,1]){
      const rest=frame(species,move,p);
      for(const [name,value] of Object.entries(rest))
        if(name!=='kind')assert.ok(Math.abs(value)<1e-10,
          `${species} does not settle at ${p}: ${name}=${value}`);
    }
  }
  assert.ok(different.size>=7,'biological and mechanical motion must read differently');
  assert.ok(frame('hunter','glide').stride!==0,'hound must run rather than hover');
  assert.ok(frame('moth','glide').wing>.5,'moth visibly flaps');
  assert.equal(frame('phantom','float').stride,0,'ghost cannot trot');
  assert.equal(frame('automaton','wobble').stride,0,'robot cannot move imaginary paws');
  assert.ok(frame('reptile','wobble').stride<frame('hunter','glide').stride,
    'reptile crawl should be more restrained than a hound');
});

test('petting is calmer, scans retain gaze and idle breathes without travel',()=>{
  const play=frame('hunter','glide',.5,'play');
  const pet=frame('hunter','glide',.5,'pet');
  assert.ok(Math.abs(pet.stride)<Math.abs(play.stride));
  assert.ok(pet.bob<play.bob);
  const ghost=petMotionFrame({species:'phantom',move:'float',time:1.5,active:false});
  assert.notEqual(ghost.bob,0);
  assert.equal(ghost.forward,0);
  for(const kind of ['hunter','moth','phantom','automaton']){
    const bad=petMotionFrame({species:kind,move:'hop',time:NaN,progress:Infinity,active:true});
    for(const [name,value] of Object.entries(bad))
      if(name!=='kind')assert.ok(Number.isFinite(value),kind+' '+name);
  }
});

test('3D pets animate real leg/wing joints and return safely to their fitted sockets',()=>{
  const scenarios=[
    ['detective','fog-hound','trot',4],
    ['sleuth','bunny-baker','hop',4],
    ['mechanic','studio-observatory-moth','flutter',0],
    ['armor','bell-tower-gargoyle','spring',4],
    ['automaton','wind-up-gremlin','clockwork',0],
    ['sleuth','lamp-house-ghost','drift',0]
  ];
  const light=new THREE.PointLight();
  for(const [model,id,kind,expectedLegCount] of scenarios){
    const recipe=normalizeLoadout({...SHOWROOM_LOOKS[model],
      cosmetics:{companion:id}});
    const snapshot=JSON.stringify(recipe);
    const actor=buildAvatar(recipe);
    const pet=actor.pet;
    assert.ok(pet,`missing companion ${id}`);
    const motion=petMotionFrame({species:pet.species,
      move:kind==='trot'?'glide':kind==='clockwork'?'wobble':'hop',
      progress:.45,active:true});
    assert.equal(pet.legs.length,expectedLegCount,id+' joint count');
    const home=pet.home.clone();
    const mainHead=actor.head.rotation.z;
    poseCompanion(pet,0,{progress:.45,action:'play'});
    assert.ok(pet.animal.position.y!==pet.perch||pet.animal.rotation.y!==0,
      id+' should animate between rest and completion');
    if(pet.legs.length)assert.ok(pet.legs.some(x=>Math.abs(x.hinge.rotation.x)>1e-5),
      id+' leg gait should move fitted mesh, not just a label');
    if(pet.wings.length)assert.ok(pet.wings.some(x=>Math.abs(x.rotation.y)>.2),
      id+' wings must visibly articulate');
    poseCompanion(pet,0,{progress:1,action:'play'});
    assert.ok(pet.legs.every(x=>Math.abs(x.hinge.rotation.x)<1e-10),
      id+' legs must reset after action');
    assert.ok(pet.root.position.equals(home),id+' socket moved');
    poseStudioAction(actor,0,{id,progress:.42,action:'trick'},light);
    poseStudioAction(actor,0,{id,progress:1,action:'trick'},light);
    assert.ok(pet.root.position.equals(home),id+' trick changed home socket');
    assert.equal(actor.head.rotation.z,mainHead,'owner body pose was not modified');
    assert.equal(JSON.stringify(recipe),snapshot,'saved loadout changed');
  }
});

test('targeted companion reaction turns its body and head without moving the home socket',()=>{
  const recipe=normalizeLoadout({...SHOWROOM_LOOKS.detective,
    cosmetics:{companion:'fog-hound'}});
  const actor=buildAvatar(recipe),pet=actor.pet;
  const rootBefore=pet.root.position.clone();
  poseCompanion(pet,0,{progress:.5,action:'sniff',target:{x:.65,z:.82}});
  assert.ok(Math.abs(pet.animal.rotation.y)>.025,'hound body must follow target');
  assert.ok(Math.abs(pet.head.rotation.y)>.08,'hound attention must face target');
  assert.ok(pet.root.position.equals(rootBefore));
  poseCompanion(pet,0,{progress:1,action:'sniff',target:{x:.65,z:.82}});
  assert.ok(Math.abs(pet.animal.rotation.y)<1e-10);
  assert.ok(Math.abs(pet.head.rotation.y)<1e-10);
});
