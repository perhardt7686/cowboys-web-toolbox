import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE,disposeFigure} from '../docs/avatar-studio-geometry.mjs';
import {beardJawPoint,beardJawSections} from '../docs/avatar-studio-faces.mjs';
import {buildAvatar} from '../docs/avatar-studio-character.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs';

test('the six beard cross sections retain a smooth jaw-to-cheek contour at all eight viewing angles',()=>{
  for(const [width,jaw] of [[1,1],[.91,.79],[1.09,1.18],[1.07,1.08]]){
    const rings=beardJawSections(width,jaw);
    assert.equal(rings.length,6);
    for(const angle of [0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI,-Math.PI/4,-Math.PI/2,-Math.PI]){
      // Geometry is invariant under mirrored head turns. The front lip must
      // not fold beneath the next ring, which produced a triangular profile.
      const heights=rings.map((_,i)=>beardJawPoint(rings,i,angle)[1]);
      for(let i=1;i<heights.length;i++){
        assert.ok(heights[i]>heights[i-1]+.0005,
          'Crossed beard rings near the mouth at '+angle+' and '+i);
      }
      const tip=beardJawPoint(rings,5,angle,.004);
      assert.ok(tip.every(Number.isFinite));
      assert.ok(Math.abs(beardJawPoint(rings,5,angle)[2]+.004-tip[2])<1e-9);
    }
    for(const angle of [.25,.7,1.22,1.57]){
      for(let i=0;i<rings.length;i++){
        const left=beardJawPoint(rings,i,-angle);
        const right=beardJawPoint(rings,i,angle);
        assert.ok(Math.abs(left[0]+right[0])<1e-10);
        assert.ok(Math.abs(left[1]-right[1])<1e-10);
        assert.ok(Math.abs(left[2]-right[2])<1e-10);
      }
    }
  }
});

test('full beards have a fitted continuous jaw mesh and two cheek-ink contours per side',()=>{
  for(const face of ['oval','square','heart','long','round','angular']){
    const actor=buildAvatar(normalizeLoadout({
      ...SHOWROOM_LOOKS.mechanic,face,beard:'beard'
    }));
    const meshes=[],ink=[];
    actor.figure.traverse(node=>{
      if(node.userData.studioPart==='fitted-beard')meshes.push(node);
      if(node.userData.studioPart==='fitted-beard-ink')ink.push(node);
    });
    assert.equal(meshes.length,1,face);
    assert.equal(ink.length,4,face);
    assert.equal(meshes[0].geometry.attributes.position.count,6*41);
    const mesh=meshes[0],coords=mesh.geometry.attributes.position;
    assert.ok(mesh.material.side===THREE.DoubleSide);
    for(let i=0;i<6;i++){
      for(const j of [0,10,20,30,40]){
        const theta=-1.68+j/40*3.36;
        const pos=beardJawPoint(beardJawSections(
          ({oval:1,angular:.98,round:1.09,square:1.07,long:.91,heart:1.03}[face]),
          ({oval:1,angular:1.08,round:.92,square:1.18,long:.93,heart:.79}[face])
        ),i,theta);
        const k=i*41+j;
        for(let c=0;c<3;c++)assert.ok(Math.abs(coords.getX(k+(c===0?0:0))||0)<100);
        assert.ok(Math.abs(coords.getX(k)-pos[0])<.10);
      }
    }
    disposeFigure(actor.root);
  }
});

test('clean-shaven and goatee characters do not gain a full beard overlay',()=>{
  for(const beard of ['none','goatee','stubble','moustache']){
    const actor=buildAvatar(normalizeLoadout({...SHOWROOM_LOOKS.mechanic,beard}));
    const parts=[];
    actor.figure.traverse(node=>{if(node.userData.studioPart==='fitted-beard')parts.push(node);});
    assert.equal(parts.length,0,beard);
    disposeFigure(actor.root);
  }
});
