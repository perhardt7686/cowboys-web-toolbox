import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE,disposeFigure} from '../docs/avatar-studio-geometry.mjs';
import {buildAvatar} from '../docs/avatar-studio-character.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs';

const faces=['oval','round','square','heart','long','angular'];
function fittedMask(recipe){
  const actor=buildAvatar(normalizeLoadout(recipe)),masks=[];
  actor.figure.traverse(node=>{
    if(node.userData.studioBeardMask)masks.push(node);
  });
  return {actor,masks};
}

test('all six full-beard faces have one uninterrupted cel-painted mask with no floating cheek ink',()=>{
  for(const face of faces)for(const expression of ['smile','grin','smirk']){
    const {actor,masks}=fittedMask({
      ...SHOWROOM_LOOKS.mechanic,face,expression,
      hat:'none',glasses:'none',beard:'beard'
    });
    assert.equal(masks.length,1,face+' '+expression+' must have one beard surface');
    const mask=masks[0],p=mask.geometry.attributes.position,c=mask.geometry.attributes.color;
    assert.equal(mask.userData.studioBeardPaint,'fitted-cel-mask');
    assert.equal(mask.userData.studioPart,undefined,'face selection must not become a gear');
    assert.ok(mask.material.vertexColors,'paint must be on the beard surface itself');
    assert.equal(mask.material.side,THREE.DoubleSide);
    assert.ok(c&&c.count===p.count,'each vertex needs an ink-and-fill pigment');
    assert.equal(p.count,6*41);
    const unique=new Set();
    for(let i=0;i<p.count;i++){
      const pixel=[c.getX(i),c.getY(i),c.getZ(i)];
      assert.ok(pixel.every(x=>Number.isFinite(x)&&x>=0&&x<=1.01),
        'beard pigments must be finite and within SDR range');
      unique.add(pixel.map(x=>x.toFixed(3)).join(','));
    }
    assert.ok(unique.size>9,'paint must contain actual contour and light variation');
    for(let j=0;j<41;j++){
      let previous=-1;
      for(let i=0;i<6;i++){
        const row=i*41+j,y=p.getY(row);
        assert.ok(Number.isFinite(y));
        if(previous>=0)assert.ok(y>previous+.001,
          'jaw-mask rings crossed at face '+face+' angle index '+j);
        previous=y;
      }
    }
    disposeFigure(actor.root);
  }
});

test('other facial hair styles preserve the original, non-full-beard construction',()=>{
  for(const beard of ['none','stubble','goatee','moustache']){
    const {actor,masks}=fittedMask({...SHOWROOM_LOOKS.detective,beard});
    assert.equal(masks.length,0,beard+' must not get a full beard overlay');
    disposeFigure(actor.root);
  }
});
