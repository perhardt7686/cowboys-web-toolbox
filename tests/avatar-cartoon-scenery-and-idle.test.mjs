import assert from 'node:assert/strict';
import test from 'node:test';
import {mysterySceneKind,paintMysteryBackdrop} from '../docs/avatar-mystery-backdrops.mjs';
import {THREE} from '../docs/avatar-studio-geometry.mjs?v=studio3';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs?v=studio3';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs?v=studio3';
import {buildAvatar} from '../docs/avatar-studio-character.mjs?v=studio3';
import {buildCompanion,poseCompanion} from '../docs/avatar-studio-companions.mjs?v=ink4';
import {poseStudioAction} from '../docs/avatar-studio-actions.mjs?v=ink4';
import {BY_ID} from '../docs/avatar-reward-catalog.mjs?v=studio3';

test('original settings cover seven distinct mystery-cartoon worlds',()=>{
  const pairs={
    'moonlit-phantom-cloak':'manor',
    'moss-woodland':'forest',
    'carnival-control':'carnival',
    'robot-clockwork-workshop':'workshop',
    'galaxy-portal':'observatory',
    'arcade-champion':'arcade',
    'lavender':'library'
  };
  for(const [name,kind] of Object.entries(pairs))
    assert.equal(mysterySceneKind(name),kind,name);
  assert.equal(mysterySceneKind(null),'library');
});

function mockCanvasContext(){
  const operations=[];
  const gradient=()=>({addColorStop:()=>{}});
  const ctx=new Proxy({globalAlpha:1}, {
    get(target,key){
      if(key in target)return target[key];
      if(key==='createLinearGradient'||key==='createRadialGradient')return gradient;
      return (...args)=>{operations.push([key,...args]);};
    },
    set(target,key,value){target[key]=value;return true;}
  });
  return {ctx,operations};
}

test('every scenery variant draws deterministically without external assets',()=>{
  for(const theme of ['night','forest','carnival','robot','galaxy','arcade','lavender']){
    const first=mockCanvasContext(),second=mockCanvasContext();
    const result=paintMysteryBackdrop(first.ctx,theme);
    assert.equal(typeof result,'string');
    assert.ok(first.operations.length>12,theme+' should draw an illustrated set');
    paintMysteryBackdrop(second.ctx,theme);
    assert.deepEqual(first.operations,second.operations);
  }
  assert.equal(paintMysteryBackdrop(null,'night'),'library');
});

test('subtle character motion changes only posed meshes, not the saved character recipe',()=>{
  const saved=structuredClone(SHOWROOM_LOOKS.detective);
  const actor=buildAvatar(normalizeLoadout(saved));
  const light=new THREE.PointLight();
  poseStudioAction(actor,0,null,light);
  const zero=actor.head.rotation.z;
  poseStudioAction(actor,1.5,null,light);
  assert.notEqual(actor.head.rotation.z,zero);
  assert.notEqual(actor.figure.rotation.z,0);
  poseStudioAction(actor,0,null,light);
  assert.equal(actor.head.rotation.z,zero);
  assert.deepEqual(SHOWROOM_LOOKS.detective,saved);
});

test('species-specific pets breathe or sway only in preview, then settle at rest',()=>{
  for(const id of ['fog-hound','wind-up-gremlin','bell-tower-gargoyle']){
    const item=BY_ID.get(id);
    assert.ok(item,id+' missing');
    const pet=buildCompanion(item);
    poseCompanion(pet,0,null);
    const rest=pet.animal.position.y;
    poseCompanion(pet,1.5,null);
    assert.notEqual(pet.animal.position.y,rest,id+' never moves');
    poseCompanion(pet,0,null);
    assert.equal(pet.animal.position.y,rest,id+' does not settle');
  }
});
