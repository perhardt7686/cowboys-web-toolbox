import {THREE} from './avatar-studio-geometry.mjs?v=studio3';
import {inkWidth} from './avatar-studio-ink.mjs?v=studio3';

const linearToSrgb=value=>{
  const clipped=Math.max(0,Math.min(1,value));
  return Math.round(255*(clipped<.0031308?clipped*12.92:1.055*clipped**(1/2.4)-.055));
};
const LIGHT=new THREE.Vector3(-.44,.76,.48).normalize();
const STEPS=64;
const projection=new THREE.Matrix4();
const modelView=new THREE.Matrix4();
const normalMatrix=new THREE.Matrix3();
const normal=new THREE.Vector3();
const point=new THREE.Vector3(),toLight=new THREE.Vector3(),lampAt=new THREE.Vector3();
const palettes=new WeakMap();

function tones(material){
  const intensity=material.emissiveIntensity||0;
  const key=material.color.getHexString()+':'+intensity;
  const old=palettes.get(material);
  if(old?.key===key)return old.values;
  const values=new Uint8Array((STEPS+1)*3);
  for(let l=0;l<=STEPS;l++){
    const level=l/STEPS*1.44;
    const light=material.isMeshToonMaterial?
      (level<.72?.64:level<.91?.87:level<1.13?1.07:1.31):level;
    for(const [i,c] of ['r','g','b'].entries())
      values[l*3+i]=linearToSrgb(material.color[c]*light+(material.emissive?.[c]||0)*intensity*.30);
  }
  palettes.set(material,{key,values});
  return values;
}

function triangle(buffer,depth,w,h,vertices,a,b,c,color,opacity,coverage,ink=0){
  const ax=vertices[a],ay=vertices[a+1],az=vertices[a+2],al=vertices[a+3];
  const bx=vertices[b],by=vertices[b+1],bz=vertices[b+2],bl=vertices[b+3];
  const cx=vertices[c],cy=vertices[c+1],cz=vertices[c+2],cl=vertices[c+3];
  const left=Math.max(0,Math.floor(Math.min(ax,bx,cx))),right=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx)));
  const top=Math.max(0,Math.floor(Math.min(ay,by,cy))),bottom=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
  if(left>right||top>bottom)return;
  const area=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
  if(Math.abs(area)<.035)return;
  const ua=(by-cy)/area,ub=(cy-ay)/area;
  const va=(cx-bx)/area,vb=(ax-cx)/area;
  for(let y=top;y<=bottom;y++){
    const height=y+.5-cy;
    let s=ua*(left+.5-cx)+va*height,t=ub*(left+.5-cx)+vb*height;
    for(let x=left,i=y*w+left;x<=right;x++,i++,s+=ua,t+=ub){
      const u=1-s-t;
      if(s<0||t<0||u<0)continue;
      const z=s*az+t*bz+u*cz;
      if(z>depth[i])continue;
      const level=Math.min(STEPS,Math.max(0,Math.round(s*al+t*bl+u*cl)))*3;
      const k=i*4;
      if(opacity<1){
        for(let channel=0;channel<3;channel++)
          buffer[k+channel]=buffer[k+channel]*(1-opacity)+color[level+channel]*opacity;
      }else{
        depth[i]=z;
        coverage[i]=ink;
        buffer[k]=color[level];buffer[k+1]=color[level+1];buffer[k+2]=color[level+2];
      }
    }
  }
}

function sample(node,w,h,light){
  const geometry=node.geometry,positions=geometry.attributes.position,normals=geometry.attributes.normal;
  const coordinates=new Float32Array(positions.count*4);
  modelView.multiplyMatrices(projection,node.matrixWorld);
  normalMatrix.getNormalMatrix(node.matrixWorld);
  const m=modelView.elements;
  const unlit=node.material.isMeshBasicMaterial;
  const world=node.matrixWorld;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const q=1/(m[3]*x+m[7]*y+m[11]*z+m[15]),v=i*4;
    coordinates[v]=(m[0]*x+m[4]*y+m[8]*z+m[12])*q*w*.5+w*.5;
    coordinates[v+1]=h*.5-(m[1]*x+m[5]*y+m[9]*z+m[13])*q*h*.5;
    coordinates[v+2]=(m[2]*x+m[6]*y+m[10]*z+m[14])*q;
    normal.fromBufferAttribute(normals,i).applyMatrix3(normalMatrix).normalize();
    const direct=Math.max(0,normal.dot(LIGHT));
    let bounce=0;
    if(light.intensity>.6&&!unlit){
      point.set(x,y,z).applyMatrix4(world);
      const delta=toLight.subVectors(lampAt,point);
      const distance=delta.length();
      if(distance<1.4)
        bounce=Math.max(0,normal.dot(delta.divideScalar(Math.max(.04,distance))))*
          (1-distance/1.4)*Math.min(.39,light.intensity*.07);
    }
    coordinates[v+3]=(unlit?1.17:.58+direct*.57+Math.max(0,normal.y)*.08+bounce)*STEPS/1.44;
  }
  return coordinates;
}

function inkSilhouette(buffer,coverage,w,h){
  const radius=Math.round(inkWidth(w,h));
  const edgePixels=[];
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)
    if(dx*dx+dy*dy<=(radius+.33)**2)edgePixels.push(dy*w+dx);
  for(let y=radius;y<h-radius;y++)for(let x=radius,i=y*w+x;x<w-radius;x++,i++){
    if(!coverage[i]||coverage[i-1]&&coverage[i+1]&&coverage[i-w]&&coverage[i+w])continue;
    for(const offset of edgePixels){
      const pixel=i+offset;
      if(coverage[pixel])continue;
      buffer[pixel*4]=23;buffer[pixel*4+1]=20;buffer[pixel*4+2]=29;
    }
  }
}

export function renderSoftwareRoom(canvas,scene,camera,root,light){
  const ctx=canvas.getContext('2d');
  const {width:w,height:h}=canvas;
  const background=scene.background?.image;
  if(background)ctx.drawImage(background,0,0,w,h);
  else{ctx.fillStyle='#7c8497';ctx.fillRect(0,0,w,h);}
  const image=ctx.getImageData(0,0,w,h),buffer=image.data;
  const z=new Float32Array(w*h);
  z.fill(Infinity);
  const coverage=new Uint8Array(w*h);
  const inkMeshes=new Set();
  root.traverse(node=>{if(node.isMesh)inkMeshes.add(node);});
  const transparent=[];
  scene.updateMatrixWorld(true);
  light.getWorldPosition(lampAt);
  projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  scene.traverseVisible(node=>{
    if(!node.isMesh||node.material.isMaterial!==true||node.material.map||node.material.opacity<=.01)return;
    const geometry=node.geometry;
    if(!geometry.attributes.position||!geometry.attributes.normal)return;
    const vertices=sample(node,w,h,light);
    const input=geometry.index?.array;
    const material=node.material,colors=tones(material);
    const ink=inkMeshes.has(node)?1:0;
    for(let t=0;t<(input?.length||vertices.length/4);t+=3){
      const a=(input?input[t]:t)*4,b=(input?input[t+1]:t+1)*4,c=(input?input[t+2]:t+2)*4;
      const front=(vertices[b]-vertices[a])*(vertices[c+1]-vertices[a+1])-
        (vertices[b+1]-vertices[a+1])*(vertices[c]-vertices[a])<0;
      if(!front&&material.side!==THREE.DoubleSide)continue;
      if(material.opacity<1)transparent.push([vertices[a+2]+vertices[b+2]+vertices[c+2],vertices,a,b,c,colors,material.opacity]);
      else triangle(buffer,z,w,h,vertices,a,b,c,colors,1,coverage,ink);
    }
  });
  inkSilhouette(buffer,coverage,w,h);
  transparent.sort((a,b)=>b[0]-a[0]);
  for(const [,vertices,a,b,c,colors,alpha] of transparent)
    triangle(buffer,z,w,h,vertices,a,b,c,colors,alpha,coverage);
  ctx.putImageData(image,0,0);
}
