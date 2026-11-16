import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE,disposeFigure} from '../docs/avatar-studio-geometry.mjs';
import {buildAvatar} from '../docs/avatar-studio-character.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs';

test('three original robot starters have different real geometry silhouettes without recipe changes',()=>{
  const widths={};
  for(const name of ['automaton','radio','scout']){
    const recipe=structuredClone(SHOWROOM_LOOKS[name]);
    const original=structuredClone(recipe);
    const actor=buildAvatar(normalizeLoadout(recipe));
    const signatures=[];
    actor.figure.traverse(node=>{
      if(node.userData.studioMachineSignature)signatures.push(node);
    });
    assert.equal(signatures.length,1,name+' needs exactly one original signature rig');
    const signature=signatures[0];
    assert.equal(signature.userData.studioMachineSignature,name);
    assert.equal(signature.userData.studioPart,undefined,'signature must not intercept gear selection');
    assert.ok(signature.children.length>=3,'signature is modeled, not a painted nameplate');
    actor.root.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(signature);
    assert.ok(!box.isEmpty());
    const w=box.max.x-box.min.x;
    assert.ok(Number.isFinite(w)&&w>.18&&w<1.1);
    widths[name]=w;
    assert.deepEqual(recipe,original,'rendering must not alter stored robot recipe');
    disposeFigure(actor.root);
  }
  // Different outlines still read when the visor colors are the same.
  assert.ok(widths.radio>widths.scout+.025,'radio tuning wings should be widest');
  assert.ok(widths.scout>widths.automaton+.12,'scout survey fins should break the oval outline');
});

test('human and armored head profiles remain unchanged by robot-only signature work',()=>{
  for(const name of ['detective','mechanic','sleuth','specter','marsh','armor']){
    const actor=buildAvatar(normalizeLoadout(SHOWROOM_LOOKS[name]));
    let signatures=0;
    actor.figure.traverse(node=>{if(node.userData.studioMachineSignature)signatures++;});
    assert.equal(signatures,0,name+' should not inherit robot head accents');
    disposeFigure(actor.root);
  }
});
