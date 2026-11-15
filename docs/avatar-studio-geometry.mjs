import * as THREE from './vendor/three-0.178.0/three.module.min.js';

export {THREE};
export const color=(value)=>new THREE.Color(value);
export const shade=(value,change)=>color(value).multiplyScalar(change);
export const vector=(point)=>new THREE.Vector3(...point);

const sphere=new THREE.SphereGeometry(1,24,16);
const plane=new THREE.PlaneGeometry(1,1);
const bevel=new THREE.BoxGeometry(1,1,1,5,5,5);
const bevelPosition=bevel.attributes.position;
for(let index=0;index<bevelPosition.count;index++){
  const point=new THREE.Vector3().fromBufferAttribute(bevelPosition,index);
  const square=point.clone().clampScalar(-.36,.36);
  const round=point.sub(square).normalize().multiplyScalar(.14).add(square);
  bevelPosition.setXYZ(index,round.x,round.y,round.z);
}
bevel.computeVertexNormals();
const shared=new Set([sphere,plane,bevel]);

const celRamp=new THREE.DataTexture(new Uint8Array([19,73,150,238]),4,1,THREE.RedFormat);
celRamp.magFilter=celRamp.minFilter=THREE.NearestFilter;
celRamp.needsUpdate=true;

export function surface(pigment,properties={}){
  const {roughness,metalness,...finish}=properties;
  return new THREE.MeshToonMaterial({color:pigment,gradientMap:celRamp,...finish});
}

export function group(parent,x=0,y=0,z=0){
  const node=new THREE.Group();
  node.position.set(x,y,z);
  parent?.add(node);
  return node;
}

export function attach(parent,geometry,material,x=0,y=0,z=0){
  const node=new THREE.Mesh(geometry,material);
  node.position.set(x,y,z);
  parent.add(node);
  return node;
}

export function oval(parent,material,x,y,z,a,b,c){
  const node=attach(parent,sphere,material,x,y,z);
  node.scale.set(a,b,c);
  return node;
}

export function box(parent,material,x,y,z,w,h,d){
  const node=attach(parent,bevel,material,x,y,z);
  node.scale.set(w,h,d);
  return node;
}

export function medallion(parent,material,x,y,z,radius,depth,segments=32){
  const node=attach(parent,new THREE.CylinderGeometry(radius,radius,depth,segments),material,x,y,z);
  node.rotation.x=Math.PI/2;
  return node;
}

export function join(parent,material,start,end,radiusStart,radiusEnd=radiusStart,segments=24){
  const a=vector(start),b=vector(end),direction=b.clone().sub(a);
  const node=attach(parent,new THREE.CylinderGeometry(radiusEnd,radiusStart,direction.length(),segments),material);
  node.position.copy(a).lerp(b,.5);
  node.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  return node;
}

// Elliptical cross-sections for fitted clothing and sculpted faces.
export function shell(parent,material,sections,{segments=32,start=-Math.PI,end=Math.PI,warp}={}){
  const vertices=[],uvs=[],faces=[];
  for(let i=0;i<sections.length;i++){
    const [height,width,depth,cx=0,cz=0]=sections[i];
    for(let j=0;j<=segments;j++){
      const ratio=j/segments,theta=start+(end-start)*ratio;
      const point=[cx+Math.sin(theta)*width,height,cz+Math.cos(theta)*depth];
      vertices.push(...(warp?warp(point,theta,i):point));
      uvs.push(ratio,i/(sections.length-1));
      if(i&&j){
        const index=i*(segments+1)+j,previous=index-segments-1;
        faces.push(previous-1,previous,index,index, index-1,previous-1);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  if(end-start>=2*Math.PI-.001){
    const n=geometry.attributes.normal;
    for(let i=0;i<sections.length;i++){
      const first=i*(segments+1),last=first+segments;
      const seam=new THREE.Vector3().fromBufferAttribute(n,first)
        .add(new THREE.Vector3().fromBufferAttribute(n,last)).normalize();
      n.setXYZ(first,seam.x,seam.y,seam.z);
      n.setXYZ(last,seam.x,seam.y,seam.z);
    }
  }
  return attach(parent,geometry,material);
}

export function stroke(parent,material,points,radius=.008,segments=12){
  const route=new THREE.CatmullRomCurve3(points.map(vector));
  return attach(parent,new THREE.TubeGeometry(route,segments,radius,6,false),material);
}

export function band(parent,material,x,y,z,radius,tube=.009,scaleX=1,scaleY=1){
  const node=attach(parent,new THREE.TorusGeometry(radius,tube,8,32),material,x,y,z);
  node.scale.set(scaleX,scaleY,1);
  return node;
}

export function picture(parent,material,x,y,z,width,height){
  const node=attach(parent,plane,material,x,y,z);
  node.scale.set(width,height,1);
  return node;
}

export function disposeFigure(root){
  const materials=new Set(),textures=new Set();
  root?.traverse(node=>{
    if(!node.isMesh)return;
    if(!shared.has(node.geometry))node.geometry.dispose();
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
      if(!material)continue;
      materials.add(material);
      if(material.map)textures.add(material.map);
    }
  });
  for(const material of materials)material.dispose();
  for(const texture of textures)texture.dispose();
  root?.removeFromParent();
}

export function hash(value){
  let result=0;
  for(const character of value)result=(Math.imul(result,31)+character.charCodeAt(0))>>>0;
  return result;
}
