import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE,disposeFigure} from '../docs/avatar-studio-geometry.mjs';
import {buildAvatar} from '../docs/avatar-studio-character.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs';
import {renderSoftwareRoom} from '../docs/avatar-studio-software.mjs';

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
        // The old mouth-adjacent section was only 0.008 units clear at
        // the frontal angle. That collapsed to a hairline at icon size.
        if(previous>=0)assert.ok(y>previous+.012,
          'jaw-mask painted sections crowd or cross at face '+face+
          ', expression '+expression+', angle index '+j+', row '+i);
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

test('the canvas fallback interpolates mesh pigments and honors the material tint',()=>{
  const width=64,height=64;
  const data=new Uint8ClampedArray(width*height*4);
  const context={fillRect(){},getImageData:()=>({data}),putImageData(){}};
  const canvas={width,height,getContext:()=>context};
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);
  camera.position.z=3;
  camera.updateMatrixWorld();
  const light=new THREE.PointLight('#fff',0);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.85,-.7,0,.85,-.7,0,0,.85,0],3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute([1,0,0,0,1,0,0,0,1],3));
  geometry.computeVertexNormals();
  const material=new THREE.MeshBasicMaterial({color:0x80ffff,vertexColors:true});
  const mesh=new THREE.Mesh(geometry,material);
  scene.add(mesh);
  const pixel=(x,y)=>Array.from(data.slice((y*width+x)*4,(y*width+x)*4+3));

  renderSoftwareRoom(canvas,scene,camera,mesh,light);
  const left=pixel(14,47),right=pixel(48,47),top=pixel(32,12),center=pixel(32,32);
  assert.ok(left[0]>left[1]&&left[0]>left[2],`left corner should be red: ${left}`);
  assert.ok(right[1]>right[0]&&right[1]>right[2],`right corner should be green: ${right}`);
  assert.ok(top[2]>top[0]&&top[2]>top[1],`top corner should be blue: ${top}`);
  assert.ok(center.every(channel=>channel>20),`center should mix all three colors: ${center}`);
  assert.ok(left[0]<right[1],`red pigment should be dimmed by the material tint: ${left} / ${right}`);

  material.vertexColors=false;
  renderSoftwareRoom(canvas,scene,camera,mesh,light);
  assert.deepEqual(pixel(14,47),pixel(48,47),'plain materials keep the uniform lighting path');
  disposeFigure(mesh);
});
