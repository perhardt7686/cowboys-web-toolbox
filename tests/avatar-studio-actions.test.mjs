import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE} from '../docs/avatar-studio-geometry.mjs?v=studio3';
import {buildAvatar} from '../docs/avatar-studio-character.mjs?v=studio3';
import {poseStudioAction} from '../docs/avatar-studio-actions.mjs?v=studio3';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs?v=studio3';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs?v=studio3';

const figure=(look,cosmetics)=>buildAvatar(normalizeLoadout({...SHOWROOM_LOOKS[look],cosmetics}));
const position=node=>node.getWorldPosition(new THREE.Vector3()).toArray();
const action=(actor,id,progress,light,extra={})=>poseStudioAction(actor,0,{id,progress,...extra},light);

test('equipped sword stays in the moving grip and traces the blade in front and back views',()=>{
  for(const look of ['detective','armor','automaton']){
    const actor=figure(look,{prop:'spectral-case-sword'});
    const light=new THREE.PointLight();
    const arm=actor.arms[0];
    const prop=arm.prop;
    assert.equal(prop.root.parent,arm.palm);
    actor.root.rotation.y=Math.PI;
    const grip=position(prop.root);
    action(actor,prop.item.id,.48,light);
    assert.notDeepEqual(position(prop.root),grip);
    assert.ok(prop.inkArc.mesh.visible);
    assert.notEqual(arm.fingers[0].rotation.x,arm.fingerRest);
    const end=new THREE.Vector3().fromBufferAttribute(prop.inkArc.vertices,prop.inkArc.strips*2);
    const expected=actor.figure.worldToLocal(prop.shape.localToWorld(new THREE.Vector3(.006,.649,.017)));
    assert.ok(end.distanceTo(expected)<.001);
    action(actor,prop.item.id,1,light);
    assert.deepEqual(position(prop.root),grip);
    assert.equal(prop.inkArc.mesh.visible,false);
  }
});

test('lantern, cape and scanner act on the fitted item and on nearby pets',()=>{
  const light=new THREE.PointLight();
  const detective=figure('detective',{offhand:'museum-lantern',companion:'fog-hound'});
  const lifted=action(detective,'museum-lantern',.43,light);
  assert.equal(lifted.response,'sniff');
  assert.ok(light.intensity>4);
  assert.ok(detective.lanternPool.every(pool=>pool.visible));
  assert.ok(detective.pet.steam.layer.visible);
  assert.notEqual(detective.pet.head.rotation.y,0);
  action(detective,'museum-lantern',1,light);
  assert.equal(detective.pet.steam.layer.visible,false);
  assert.ok(detective.lanternPool.every(pool=>!pool.visible));

  const armor=figure('armor',{outerwear:'phantom-cloak',companion:'bell-tower-gargoyle'});
  const {position:vertices,idle}=armor.capeParts[0];
  action(armor,'phantom-cloak',.43,light);
  assert.notDeepEqual(vertices.array,idle);
  // The vertices above the shoulder line stay tethered to the clasp.
  for(let i=0;i<idle.length;i+=3)
    if(idle[i+1]>=2.013)assert.deepEqual(vertices.array.slice(i,i+3),idle.slice(i,i+3));
  action(armor,'phantom-cloak',1,light);
  assert.deepEqual(vertices.array,idle);
  const perch=armor.pet.animal.position.y;
  action(armor,'bell-tower-gargoyle',.43,light,{action:'trick'});
  assert.ok(armor.pet.animal.position.y>perch);
  action(armor,'bell-tower-gargoyle',1,light,{action:'trick'});
  assert.ok(Math.abs(armor.pet.animal.position.y-perch)<1e-6);

  const robot=figure('automaton',{bodypart:'carnival-visor-plate',companion:'wind-up-gremlin'});
  const scanned=action(robot,'carnival-visor-plate',.43,light);
  assert.equal(scanned.response,'scan');
  assert.ok(robot.visor.beam.visible);
  assert.ok(robot.visor.shutters.every(shutter=>shutter.rotation.x<-.9));
  assert.ok(robot.pet.spark.visible);
  action(robot,'carnival-visor-plate',1,light);
  assert.equal(robot.pet.spark.visible,false);
  assert.equal(robot.visor.beam.visible,false);
  assert.equal(figure('detective',{bodypart:'carnival-visor-plate'}).visor,null);
});
