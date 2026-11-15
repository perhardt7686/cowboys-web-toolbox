import assert from 'node:assert/strict';
import test from 'node:test';
import {CATALOG,SLOT_LABELS,GROUPS,BY_ID} from '../docs/avatar-reward-catalog.mjs';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs';
import {BODY_MODELS,fitsBody} from '../docs/avatar-full-body.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {cartoonFaceExpression,sculptFace} from '../docs/avatar-studio-faces.mjs';
import {THREE,disposeFigure,group} from '../docs/avatar-studio-geometry.mjs';
import {buildAvatar} from '../docs/avatar-studio-character.mjs';
import {buildCompanion,heldItem,studioHat} from '../docs/avatar-studio-companions.mjs';

const rawCanvas=()=>{
  let strokes=0,paths=0,fill=0;
  const gradient={addColorStop(){}};
  const node={globalAlpha:1,save(){},restore(){},beginPath(){paths++;},
    stroke(){strokes++;},fill(){fill++;},createLinearGradient(){return gradient;},
    createRadialGradient(){return gradient;},measureText(text){return {width:String(text).length*7};}};
  const ctx=new Proxy(node,{get(target,key){
    if(key in target)return target[key];
    return (..._args)=>undefined;
  },set(target,key,value){target[key]=value;return true;}});
  return {ctx,count:()=>strokes+fill+paths};
};

test('all rewards retain unique stable IDs, source artwork, and verified-achievement mappings',()=>{
  assert.equal(CATALOG.length,336,'a missing or newly duplicated reward must never silently reshuffle earned items');
  assert.equal(BY_ID.size,CATALOG.length);
  const ids=new Set();
  const approved=new Set(Object.keys(SLOT_LABELS));
  const achievementIds=new Set(Object.values(GROUPS).flat());
  const slots=new Map();
  for(const reward of CATALOG){
    assert.ok(typeof reward.id==='string'&&reward.id.length>2);
    assert.ok(!ids.has(reward.id),'duplicate: '+reward.id);
    ids.add(reward.id);
    assert.ok(approved.has(reward.slot),reward.id+' unknown slot');
    assert.ok(typeof reward.name==='string'&&reward.name.trim().length>2,reward.id+' unnamed');
    assert.ok(typeof reward.draw==='function',reward.id+' has no actual original artwork');
    assert.ok(achievementIds.has(reward.achievement_id),reward.id+' reward has no earned path');
    assert.ok(Array.isArray(reward.tags),reward.id+' missing art tags');
    if(reward.families)for(const family of reward.families)
      assert.ok(['human','monster','robot'].includes(family),reward.id+' has invalid family');
    slots.set(reward.slot,(slots.get(reward.slot)||0)+1);
  }
  assert.equal(slots.size,Object.keys(SLOT_LABELS).length,'all wearable, companion, effects and scene slots need items');
});

test('render every individual catalog illustration, not just a lucky sample',()=>{
  const broken=[];
  for(const reward of CATALOG){
    const {ctx,count}=rawCanvas();
    try{
      reward.draw(ctx,0);
      if(count()<2)broken.push(reward.id+': empty or nearly empty cel');
    }catch(error){broken.push(reward.id+': '+error.message);}
  }
  assert.deepEqual(broken,[],'missing or broken reward illustration(s)');
});

test('all creature rewards construct real pet models with eyes, body and animation joints',()=>{
  const broken=[];
  for(const item of CATALOG.filter(entry=>entry.slot==='companion')){
    let pet;
    try{
      pet=buildCompanion(item);
      assert.ok(pet.root&&pet.animal&&pet.head,item.id+' missing pet anatomy');
      assert.ok(pet.root.children.length>0,item.id+' missing model');
      assert.ok(pet.species,item.id+' missing species classification');
      assert.ok(pet.item===item,item.id+' lost reward identity');
      assert.ok(pet.head.parent,item.id+' detached pet face');
    }catch(error){broken.push(item.id+': '+error.message);}
    finally{if(pet?.root)disposeFigure(pet.root);}
  }
  assert.deepEqual(broken,[],'broken pet character(s)');
});

test('wearable rewards fit human, monster or robot safely without changing locked item IDs',()=>{
  const broken=[];
  const families={human:'detective',monster:'armor',robot:'automaton'};
  const catalog=CATALOG.filter(item=>!['companion','background','effect'].includes(item.slot));
  for(const item of catalog){
    const family=item.families?.[0]||'human';
    const model=families[family]||'detective';
    const base=SHOWROOM_LOOKS[model];
    assert.ok(base,model+' model unavailable');
    const recipe=normalizeLoadout({...base,cosmetics:{[item.slot]:item.id}});
    let actor;
    try{
      assert.ok(fitsBody(recipe,item),item.id+' does not fit declared '+family);
      actor=buildAvatar(recipe);
      assert.equal(actor.cosmetics[item.slot]?.id,item.id,item.id+' not equipped');
      assert.ok(actor.head&&actor.arms?.length===2,item.id+' detached body parts');
      if(item.slot==='hat')assert.ok(actor.hat,item.id+' no visible headwear');
      if(item.slot==='prop'||item.slot==='offhand')
        assert.ok(actor.props.find(prop=>prop.item.id===item.id),item.id+' no hand-attached asset');
    }catch(error){broken.push(item.id+': '+error.message);}
    finally{if(actor?.root)disposeFigure(actor.root);}
  }
  assert.deepEqual(broken,[],'reward to full-body fitting failures');
});

test('expression and sculpt presets are meaningfully distinct and side-effect free',()=>{
  const expected=['smile','grin','smirk','calm','determined','curious','wink','laugh'];
  const signatures=new Set();
  for(const expression of expected){
    const recipe={expression,eye_shape:expression==='laugh'?'dramatic':'round'};
    const current=structuredClone(recipe);
    const spec=cartoonFaceExpression(recipe);
    assert.ok(spec.width>.05&&spec.height>.02);
    signatures.add([spec.mouth,spec.lift,spec.brow,spec.wink].join(':'));
    assert.deepEqual(recipe,current);
  }
  assert.equal(signatures.size,expected.length);
  const head=group();
  const palette={skin:'#c59c83',cloth:'#665c7c',hair:'#513c40',eye:'#66929e'};
  try{
    for(const face of ['oval','round','long','heart','square','angular']){
      const child=group(head);
      sculptFace(child,{face,eye_shape:'round',expression:'curious',nose:'swoop',
        brows:'arching',beard:'none',style:'wavy',cheeks:'none',accessory:'none'},
        palette,{jawTune:2,eyeSpacing:-2});
      assert.ok(child.children.length>8,face+' missing distinctive geometry');
    }
  }finally{disposeFigure(head);}
});

test('signature reward headwear has recognizable dedicated 3D pieces',()=>{
  for(const id of ['giant-taco-hat','rubber-chicken-helmet','viking-battle-helmet','dragon-crown']){
    const hat=BY_ID.get(id);
    assert.ok(hat,id+' missing');
    const head=group();
    try{
      const worn=studioHat(head,hat,'none');
      assert.ok(worn?.children.length>3,id+' collapsed to a generic single asset');
      assert.equal(worn.userData.studioPart,'gear');
    }finally{disposeFigure(head);}
  }
});
