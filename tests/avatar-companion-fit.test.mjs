import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE} from '../docs/avatar-studio-geometry.mjs?v=workshop1';
import {buildAvatar} from '../docs/avatar-studio-character.mjs?v=workshop1';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs?v=workshop1';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs?v=workshop1';
import {companionHomePosition} from '../docs/avatar-companion-fit.mjs?v=workshop1';
import {poseStudioAction} from '../docs/avatar-studio-actions.mjs?v=workshop1';

test('pet stage socket is deterministic, finite and scales with creature/body envelope',()=>{
  assert.deepEqual(companionHomePosition({bodyWidth:.72,petLeftExtent:.15}),
    {x:.897,y:0,z:.242});
  const wide=companionHomePosition({bodyWidth:1.40,petLeftExtent:.45});
  const slim=companionHomePosition({bodyWidth:.80,petLeftExtent:.45});
  assert.ok(wide.x>slim.x+.20,'wide avatars need visibly more room');
  assert.ok(wide.x-.45>=1.40*.46+.115,'pet must start outside wide torso ink');
  assert.deepEqual(companionHomePosition({bodyWidth:NaN,petLeftExtent:Infinity}),
    companionHomePosition({bodyWidth:1,petLeftExtent:.31}));
  assert.ok(Object.isFrozen(wide),'one render cannot mutate another avatar socket');
});

test('real companions fit slim, broad and mechanical actors without touching their recipes',()=>{
  const cases=['fog-hound','studio-observatory-moth','bell-tower-gargoyle'];
  for(const id of cases){
    const positions=[];
    for(const model of ['detective','mechanic','armor']){
      const original={...SHOWROOM_LOOKS[model],pose:'center',
        cosmetics:{companion:id}};
      const saved=JSON.stringify(original);
      const actor=buildAvatar(normalizeLoadout(original));
      assert.ok(actor.pet,`Expected pet ${id} for ${model}`);
      assert.equal(actor.pet.root.parent,actor.root,'companion follows the stage not the rotating head');
      assert.ok(actor.pet.root.position.equals(actor.pet.home),'idle animation starts at the authored home');
      const bounds=new THREE.Box3().setFromObject(actor.pet.root);
      assert.ok(!bounds.isEmpty()&&Number.isFinite(bounds.min.x));
      const width={detective:.85,mechanic:1.18,armor:1.20}[model];
      assert.ok(bounds.min.x>=width*.46+.115,
        `Pet overlaps torso envelope: ${model}/${id}, min ${bounds.min.x}`);
      assert.deepEqual(JSON.stringify(original),saved,'saved recipe remains unchanged');
      positions.push(actor.pet.root.position.x);
      const before=actor.pet.home.clone();
      const light=new THREE.PointLight();
      poseStudioAction(actor,0,{id,progress:.5,action:'play'},light);
      poseStudioAction(actor,0,{id,progress:1,action:'play'},light);
      assert.ok(actor.pet.root.position.equals(before),'pet returns exactly to dynamically fitted home');
    }
    assert.ok(positions[1]>=positions[0]&&positions[2]>=positions[0],
      `Wider actors cannot move pet closer to body: ${id}: ${positions}`);
  }
});
