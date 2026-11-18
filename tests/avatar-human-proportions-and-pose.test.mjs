import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE,disposeFigure} from '../docs/avatar-studio-geometry.mjs';
import {buildAvatar} from '../docs/avatar-studio-character.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {figureAt} from '../docs/avatar-turnaround-figure.mjs';
import {paintHead} from '../docs/avatar-turnaround-head.mjs';
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

test('tilt adds subtle, different left and right arm motion in 3D without altering the center pose',()=>{
  const center=make({...SHOWROOM_LOOKS.detective,pose:'center'});
  const tilted=make({...SHOWROOM_LOOKS.detective,pose:'tilt'});
  for(const actor of [center,tilted])actor.root.updateMatrixWorld(true);
  const hand=(actor,side)=>actor.arms.find(x=>x.side===side).palm
    .getWorldPosition(new THREE.Vector3());
  const rightCenter=hand(center,1),rightTilt=hand(tilted,1);
  const leftCenter=hand(center,-1),leftTilt=hand(tilted,-1);
  assert.ok(rightTilt.y>rightCenter.y+.04,
    'tilted acting should raise one relaxed hand');
  assert.ok(leftTilt.y<leftCenter.y,
    'contrapposto drops the opposite relaxed hand');
  for(const pos of [rightTilt,leftTilt]){
    assert.ok([pos.x,pos.y,pos.z].every(Number.isFinite));
    assert.ok(pos.y>1.02&&pos.y<1.6,'keep hand inside readable full-body bounds');
  }
  for(const actor of [center,tilted])disposeFigure(actor.root);
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
