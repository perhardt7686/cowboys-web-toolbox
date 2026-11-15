import * as THREE from './vendor/three-0.178.0/three.module.min.js';
import {skyTrack} from './skyboard-physics.mjs?v=courses2';

function seedValue(index){
  const n=Math.sin(index*67.091+17.34)*29151.8203;
  return n-Math.floor(n);
}
export function skyBackdrop(p){
  const art=document.createElement('canvas');art.width=768;art.height=384;
  const c=art.getContext('2d'),sky=c.createLinearGradient(0,0,0,art.height);
  sky.addColorStop(0,p.sky[0]);sky.addColorStop(.40,p.sky[0]);sky.addColorStop(.53,p.horizon);
  sky.addColorStop(.64,p.sky[1]);sky.addColorStop(1,p.sky[0]);
  c.fillStyle=sky;c.fillRect(0,0,art.width,art.height);
  c.globalAlpha=p.env==='city'?.67:.32;
  for(let i=0;i<54;i++){
    const x=seedValue(i+300)*768,y=25+seedValue(i+950)*147,w=1+seedValue(i+813)*2;
    c.fillStyle=i%7?'#fef9ff':'#ffd991';
    if(p.env==='city'){c.fillRect(x,y,w,w);continue;}
    if(i%4===0){
      const band=c.createLinearGradient(x-33,0,x+40,0);
      band.addColorStop(0,'#fff5de00');band.addColorStop(.53,'#ffffffae');band.addColorStop(1,'#fff5de00');
      c.fillStyle=band;c.fillRect(x-33,y+52,73,1+(i%3));
    }
  }
  const texture=new THREE.CanvasTexture(art);
  texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

// Batched scenery keeps each theme detailed without making the rider's
// controls wait on hundreds of small draw calls.
export function populateSkyWorld(scene,course,p){
  const shapes={
    rock:new THREE.DodecahedronGeometry(1,0),ball:new THREE.SphereGeometry(1,9,7),box:new THREE.BoxGeometry(1,1,1),
    pillar:new THREE.CylinderGeometry(.62,.72,1,7),spire:new THREE.ConeGeometry(1,1,5)
  };
  const buckets=new Map(),model=new THREE.Object3D();
  function place(shape,color,x,y,z,w,h,d,turn=0,glow=false){
    const id=shape+color+glow;
    if(!buckets.has(id))buckets.set(id,{shape,color,glow,list:[]});
    model.position.set(x,y,z);model.scale.set(w,h,d);model.rotation.set(0,turn,0);
    model.updateMatrix();buckets.get(id).list.push(model.matrix.clone());
  }
  const [dark,mid,light,sign]=p.walls;
  for(let index=0;index<45;index++){
    const z=index*10.9-14,side=index%2?1:-1;
    const noise=seedValue(index+course.stage*700),t=skyTrack(course,z);
    const x=t.center+side*(13.9+noise*18),y=t.y-4-noise*4.5;
    const scale=3.2+noise*4.3,zz=-z;
    if(p.env==='city'){
      const tall=scale*(1.7+noise*1.6),wide=scale*(.56+noise*.26);
      place('box',dark,x,y+tall*.22,zz,wide,tall,wide,0);
      place('box',mid,x,y+tall*.72,zz,wide*.81,.21,wide*.81);
      place('box',index%3?sign:light,x,y+tall*.75,zz+wide*.44,wide*.51,.16,.14,0,true);
      for(let row=0;row<5;row++)place('box',row%3?mid:sign,x,y+tall*(.54-row*.15),zz+wide*.51,wide*.64,.17,.11,0,row%3===0);
      if(index%6===3){place('pillar',mid,x,y+tall*.77,zz,.30,tall*.27,.30);place('ball',light,x,y+tall*.92,zz,.23,.23,.23,0,true);}
      continue;
    }
    if(p.env==='ice'||p.env==='canyon'){
      place('rock',dark,x,y-scale*.32,zz,scale,scale*.92,scale*.91,noise);
      for(let s=0;s<3;s++){
        const w=scale*(.33+s*.07),yy=y+scale*(.33+s*.24);
        place('pillar',s===1?light:mid,x+(s-1)*scale*.71,yy,zz+s*.43,w,scale*(1.53+s*.18),w,noise+s*1.3);
        if(p.env==='ice')place('spire',s===1?light:sign,x+(s-1)*scale*.71,yy+scale*(.87+s*.08),zz+s*.43,w*.66,scale*.67,w*.66,noise+s*1.3);
      }
      continue;
    }
    place('rock',dark,x,y-scale*.60,zz,scale,scale*.74,scale*.94,noise*6.2);
    place('rock',mid,x,y-scale*.03,zz,scale*.98,scale*.37,scale*.97,noise*6.2);
    if(p.env==='cloud'){
      for(let puff=0;puff<5;puff++){
        const width=scale*(.33+seedValue(puff*32+index)*.34);
        place('ball',puff%2?light:mid,x+(puff-2)*scale*.45,y+width*.40,zz-puff*.50,width,width*.58,width*.76);
      }
      if(index%6===2){
        place('pillar',dark,x,y+1.1,zz,.36,3.2,.36,.3);
        place('ball',sign,x,y+3.01,zz,.77,.48,.77);
        place('ball',light,x,y+3.05,zz,.41,.43,.41,0,true);
      }
    }else{
      for(let tree=0;tree<4;tree++){
        const a=seedValue(index*41+tree),hh=scale*(.55+a*.61),xx=x+(tree-1.8)*scale*.44;
        place('pillar','#69585b',xx,y+hh*.42,zz-tree*.61,.29,hh,.28);
        for(let crown=0;crown<3;crown++){
          const width=hh*(.45-crown*.084),high=y+hh*(.73+crown*.22);
          const model=p.env==='palm'?'ball':'spire';
          place(model,crown%2?sign:light,xx,high,zz-tree*.61,width,hh*(p.env==='palm'?.19:.68),width,tree*.63);
        }
      }
    }
  }
  // A few recognizable landmarks provide a strong silhouette on each course.
  for(let i=0;i<4;i++){
    const z=23+i*92,t=skyTrack(course,z),x=t.center+(i%2?1:-1)*(i===0?13.2:15.7),zz=-z;
    if(p.env==='palm'){
      place('pillar',dark,x,t.y-3,zz,2.4,7,2.4);
      place('pillar',light,x,t.y+.74,zz,1.45,6.5,1.45);
      place('pillar',sign,x,t.y+3.9,zz,1.9,.45,1.9);
      place('box','#ffdb80',x,t.y+4.30,zz,1.57,.75,1.57,0,true);
      place('spire','#dd9565',x,t.y+5.08,zz,1.37,1.1,1.37);
      continue;
    }
    if(p.env==='forest'){
      place('rock',dark,x,t.y+1.09,zz,3,4.8,2.9,.8);
      for(let ribbon=0;ribbon<5;ribbon++)
        place('box',ribbon%2?'#74d1cf':'#9edfd7',x-1.3+ribbon*.48,t.y-2,zz+2.46,1.0-ribbon*.05,7.6,.12,0,ribbon%2===0);
      place('ball',light,x,t.y-5.1,zz+2.48,3.2,.30,1.27);
    }else{
      place('pillar',dark,x,t.y-1.3,zz,2.3,8.2,2.3,i*.3);
      place('pillar',mid,x,t.y+2.8,zz,3,.52,3,i*.3);
      place('pillar',sign,x,t.y+3.4,zz,1.9,.7,1.9,0,p.env==='city');
      place(p.env==='ice'?'spire':'ball',light,x,t.y+4.44,zz,1.1,1.4,1.1,0,p.env==='city');
    }
  }
  for(const {shape,color,glow,list} of buckets.values()){
    // The instance mesh owns its copy so scene disposal can release it safely.
    const mesh=new THREE.InstancedMesh(shapes[shape].clone(),glow?
      new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:.89,flatShading:true}),list.length);
    list.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));
    scene.add(mesh);
  }
  for(const geometry of Object.values(shapes))geometry.dispose();
}
