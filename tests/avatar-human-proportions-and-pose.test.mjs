import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE,disposeFigure} from '../docs/avatar-studio-geometry.mjs';
import {buildAvatar} from '../docs/avatar-studio-character.mjs';
import {poseStudioAction} from '../docs/avatar-studio-actions.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {figureAt} from '../docs/avatar-turnaround-figure.mjs';
import {faceSilhouetteRings} from '../docs/avatar-studio-faces.mjs';
import {paintHead,celFaceProfile} from '../docs/avatar-turnaround-head.mjs';
import {tint} from '../docs/avatar-cel-art.mjs';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs';

const copy=recipe=>structuredClone(recipe);
const make=(recipe)=>buildAvatar(normalizeLoadout(recipe));

test('original detective no longer uses a compressed needle-head scale in 3D',()=>{
  const recipe=copy(SHOWROOM_LOOKS.detective),baseline=copy(recipe);
  const actor=make(recipe);
  assert.ok(actor.head.scale.x>=.98,'head width must remain compatible with round glasses');
  assert.ok(actor.head.scale.y<=1.03,'head must not stretch into a tall column');
  assert.ok(actor.head.scale.x<=1.07,'preserve adjacent hair and hat fit');
  assert.deepEqual(recipe,baseline,'rendering cannot modify the saved recipe');
  disposeFigure(actor.root);
});

test('six original head types have readable 3D jaw, chin, and forehead signatures',()=>{
  const ids=['oval','angular','round','square','long','heart'];
  const signatures=new Set();
  for(const face of ids){
    const rings=faceSilhouetteRings(face);
    assert.equal(rings.length,12);
    const signature=[rings[2][1],rings[4][1],rings[6][1],rings[0][1]];
    signatures.add(signature.map(x=>x.toFixed(5)).join('/'));
    assert.ok(rings.every((r,i)=>r[1]>0&&r[2]>0&&
      (i===0||r[0]>rings[i-1][0])),
      'skin shell should have positive continuous rings for '+face);
  }
  assert.equal(signatures.size,6,'no generic shared head contour for distinct face types');
  assert.ok(faceSilhouetteRings('square')[2][1]>faceSilhouetteRings('long')[2][1]*1.45,
    'square jaw is boldly wider than the long face');
  assert.ok(faceSilhouetteRings('heart')[6][1]>faceSilhouetteRings('heart')[2][1]*1.6,
    'heart brow should be noticeably broader than its tapered jaw');
  assert.deepEqual(faceSilhouetteRings('unknown'),faceSilhouetteRings('oval'));
  assert.notDeepEqual(faceSilhouetteRings('square',2),faceSilhouetteRings('square',0),
    'existing jaw-tune recipe still controls fitted geometry');
});

test('flat cel head silhouettes stay distinct without moving saved face IDs',()=>{
  const ids=['oval','angular','round','square','long','heart'];
  assert.equal(new Set(ids.map(x=>celFaceProfile(x).join('/'))).size,ids.length);
  assert.ok(celFaceProfile('long')[2]-celFaceProfile('round')[2]>=12,
    'long forehead-to-chin is taller');
  assert.ok(celFaceProfile('square')[1]-celFaceProfile('heart')[1]>=20,
    'square chin is broader than heart chin');
  const mutable=celFaceProfile('square');mutable[1]=999;
  assert.notEqual(celFaceProfile('square')[1],999,'do not mutate original contour profiles');
});

test('organic tilt gives a visible whole-body lean while hats, hands and props keep their parent rig',()=>{
  const originals=[SHOWROOM_LOOKS.detective,SHOWROOM_LOOKS.mechanic];
  for(const recipe of originals){
    const base=copy({...recipe,pose:'center'});
    const moving=copy({...recipe,pose:'tilt'});
    const a=make(base),b=make(moving);
    assert.equal(a.figure.rotation.z,0);
    assert.ok(b.figure.rotation.z>.07&&b.figure.rotation.z<.09);
    assert.equal(b.figure.userData.studioActingLean,b.figure.rotation.z);
    assert.equal(b.head.parent,b.figure,'headgear must follow the same rotating rig');
    for(const arm of b.arms){
      assert.equal(arm.shoulder.parent,b.figure,'hands preserve the original shoulder socket');
      assert.equal(arm.palm.parent,arm.hinge,'held gear follows the same palm socket');
    }
    assert.deepEqual(base,{...recipe,pose:'center'},'center recipe unchanged');
    assert.deepEqual(moving,{...recipe,pose:'tilt'},'tilt recipe unchanged');
    disposeFigure(a.root);disposeFigure(b.root);
  }
  for(const model of ['automaton','radio','scout','armor']){
    const actor=make({...SHOWROOM_LOOKS[model],pose:'tilt'});
    assert.equal(actor.figure.rotation.z,0,model+' rig remains rigid');
    disposeFigure(actor.root);
  }
});

test('tilt creates distinctly asymmetric, socket-safe 3D acting without changing center pose',()=>{
  const center=make({...SHOWROOM_LOOKS.detective,pose:'center'});
  const tilted=make({...SHOWROOM_LOOKS.detective,pose:'tilt'});
  for(const actor of [center,tilted])actor.root.updateMatrixWorld(true);
  const hand=(actor,side)=>actor.arms.find(x=>x.side===side).palm
    .getWorldPosition(new THREE.Vector3());
  const rightCenter=hand(center,1),rightTilt=hand(tilted,1);
  const leftCenter=hand(center,-1),leftTilt=hand(tilted,-1);
  assert.ok(rightTilt.y>rightCenter.y+.105,
    'tilted acting should raise one relaxed hand');
  assert.ok(leftTilt.y<leftCenter.y-.032,
    'contrapposto drops the opposite relaxed hand');
  for(const pos of [rightTilt,leftTilt]){
    assert.ok([pos.x,pos.y,pos.z].every(Number.isFinite));
    assert.ok(pos.y>1.02&&pos.y<1.6,'keep hand inside readable full-body bounds');
  }
  for(const actor of [center,tilted])disposeFigure(actor.root);
});

test('action animation preserves the authored organic lean and sword grip on reset',()=>{
  const actor=make({...SHOWROOM_LOOKS.detective,pose:'tilt',
    cosmetics:{prop:'spectral-case-sword'}});
  const prop=actor.arms.find(arm=>arm.prop)?.prop;
  assert.ok(prop,'the synthetic detective has a fitted case sword');
  const initial=actor.figure.rotation.z;
  assert.ok(initial>.07);
  actor.root.updateMatrixWorld(true);
  const grip=prop.root.getWorldPosition(new THREE.Vector3()).clone();
  const light=new THREE.PointLight();
  poseStudioAction(actor,0,{id:prop.item.id,progress:.48},light);
  poseStudioAction(actor,0,{id:prop.item.id,progress:1},light);
  assert.equal(actor.figure.rotation.z,initial,
    'return to the authored contrapposto, never neutralize body lean');
  const after=prop.root.getWorldPosition(new THREE.Vector3());
  assert.ok(after.distanceTo(grip)<1e-9,
    'equipped sword remains at its original world grip after action reset');
  disposeFigure(actor.root);
});

test('layered cel has compatible tilt acting through all four major angles',()=>{
  const base={...SHOWROOM_LOOKS.detective,pose:'center'};
  const bent={...SHOWROOM_LOOKS.detective,pose:'tilt'};
  for(const angle of [0,45,90,180]){
    const original=figureAt(base,angle),tilted=figureAt(bent,angle);
    assert.equal(original.limbs.length,2);
    assert.equal(tilted.limbs.length,2);
    for(const side of [-1,1]){
      const a=original.limbs.find(x=>x.side===side);
      const b=tilted.limbs.find(x=>x.side===side);
      assert.notDeepEqual(a.hand,b.hand,
        'tilted cel arm should not reuse the same stiff hanging position');
      assert.ok(side===1?b.hand.y<=a.hand.y-27:b.hand.y>=a.hand.y+9,
        'painted gesture must read at small full-body scale on both sides');
      assert.ok(Number.isFinite(b.hand.x)&&Number.isFinite(b.hand.y));
      assert.ok(b.hand.y>150&&b.hand.y<515,'keep 2D hands within stage');
    }
  }
});

test('robot and armor poses never inherit the human relaxed-arm adjustment',()=>{
  for(const model of ['automaton','radio','scout','armor']){
    const recipe={...SHOWROOM_LOOKS[model],pose:'center'};
    const tilted={...recipe,pose:'tilt'};
    for(const angle of [0,45,90]){
      const orig=figureAt(recipe,angle),other=figureAt(tilted,angle);
      for(const side of [-1,1]){
        const a=orig.limbs.find(x=>x.side===side);
        const b=other.limbs.find(x=>x.side===side);
        assert.deepEqual(b.hand,a.hand,model+' mechanical hand socket remains unchanged');
        assert.deepEqual(b.elbow,a.elbow,model+' mechanical joint remains unchanged');
      }
    }
  }
});


test('Marsh Watchkeeper cel preserves green skin and fin-ear silhouette at front, side and back',()=>{
  const colors={skin:'#d5a16a',hair:'#543a2c',eyes:'#ad8e47',shirt:'#526a45'};
  const green=tint(colors.skin,'#598e61',.74);
  const canvas=()=>{
    const fills=[],strokes=[];
    const c={fills,strokes,
      save(){},restore(){},translate(){},rotate(){},scale(){},
      beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},
      bezierCurveTo(){},ellipse(){},closePath(){},clip(){},
      fill(){fills.push(this.fillStyle);},stroke(){strokes.push(this.strokeStyle);}
    };
    return c;
  };
  for(const angle of [0,90,180]){
    const recipe=structuredClone(SHOWROOM_LOOKS.marsh);
    const c=canvas();
    paintHead(c,figureAt(recipe,angle),recipe,colors,()=>true);
    assert.ok(c.fills.includes(green),'Marsh face keeps the creature-green palette at '+angle);
    assert.ok(c.fills.includes('#668a52'),'leaf-like fin ears remain visible at '+angle);
    assert.ok(c.strokes.includes('#375b50'),'Marsh fin grooves survive '+angle);
  }
  const detective=canvas(),normal=structuredClone(SHOWROOM_LOOKS.detective);
  paintHead(detective,figureAt(normal,0),normal,colors,()=>true);
  assert.ok(!detective.fills.includes('#668a52'),'human faces must not inherit monster fins');
});
