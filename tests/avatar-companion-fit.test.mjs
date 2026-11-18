import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE} from '../docs/avatar-studio-geometry.mjs?v=workshop1';
import {buildAvatar} from '../docs/avatar-studio-character.mjs?v=workshop1';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs?v=workshop1';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs?v=workshop1';
import {companionHomePosition} from '../docs/avatar-companion-fit.mjs?v=workshop1';
import {equippedHeadwearWidth,celCompanionHomeX} from '../docs/avatar-equipment-fit.mjs';
import {figureAt} from '../docs/avatar-turnaround-figure.mjs';
import {BY_ID} from '../docs/avatar-reward-catalog.mjs';
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


test('original earned hats follow six head widths without changing any achievement',()=>{
  const ids=['oval','angular','round','square','long','heart'];
  const widths=ids.map(face=>equippedHeadwearWidth(face,'hat'));
  assert.equal(new Set(widths).size,ids.length,'face profiles need distinct headwear fittings');
  assert.ok(equippedHeadwearWidth('round')>equippedHeadwearWidth('long')+.13);
  assert.equal(equippedHeadwearWidth('oval','hat'),1);
  assert.equal(equippedHeadwearWidth('unknown','hat'),1);
  assert.ok(equippedHeadwearWidth('round','eyewear')<equippedHeadwearWidth('round','hat'),
    'glasses stay fitted to eye sockets rather than expanding as far as the brim');
  const reward=BY_ID.get('dragon-crown'),saved=JSON.stringify(reward);
  for(const face of ids){
    const recipe={...SHOWROOM_LOOKS.detective,face,pose:'center',
      cosmetics:{hat:'dragon-crown'}};
    const savedRecipe=JSON.stringify(recipe),avatar=buildAvatar(normalizeLoadout(recipe));
    assert.ok(avatar.hat,'original trophy crown must render for '+face);
    assert.equal(avatar.hat.parent,avatar.head,'earned hat follows the actual 3D head joint');
    assert.equal(avatar.hat.userData.studioHeadwearFit,
      equippedHeadwearWidth(face,'hat'));
    assert.ok(avatar.hat.scale.x>.92&&avatar.hat.scale.x<1.14);
    assert.ok(avatar.hat.scale.z>.94&&avatar.hat.scale.z<1.1);
    assert.equal(JSON.stringify(recipe),savedRecipe);
    // A 360-degree turn changes viewpoint, never loosens the head socket.
    for(const angle of [0,45,90,135,180,225,270,315]){
      avatar.head.rotation.y=angle*Math.PI/180;
      avatar.root.updateMatrixWorld(true);
      const position=avatar.hat.getWorldPosition(new THREE.Vector3());
      assert.ok(position.toArray().every(Number.isFinite));
      assert.equal(avatar.hat.parent,avatar.head);
    }
  }
  assert.equal(JSON.stringify(reward),saved,'no trophy artwork or identity changes');
});

test('all eight cel turns put broad pet gear beside, not through, the torso',()=>{
  const pets=[['fog-hound',45],['bell-tower-gargoyle',57],['studio-observatory-moth',50]];
  for(const model of ['detective','mechanic','armor']){
    for(const angle of [0,45,90,135,180,225,270,315]){
      const f=figureAt(SHOWROOM_LOOKS[model],angle);
      for(const [id,half] of pets){
        const offset=f.view.at(7,9);
        const x=celCompanionHomeX({chest:f.chest,petHalfWidth:half,turnOffset:offset});
        assert.ok(x-half>=216+f.chest+11,
          model+'/'+id+'/'+angle+': pet encroaches on body contour');
        assert.ok(x+half<=432-7,model+'/'+id+'/'+angle+': wing/gear clips off stage');
        assert.equal(x,celCompanionHomeX({chest:f.chest,petHalfWidth:half,turnOffset:offset}));
      }
    }
  }
  assert.equal(celCompanionHomeX({chest:40,petHalfWidth:40}),317,
    'slim-body original socket stays unchanged');
  assert.equal(celCompanionHomeX({chest:NaN,petHalfWidth:Infinity}),
    celCompanionHomeX({chest:50,petHalfWidth:45}));
});
