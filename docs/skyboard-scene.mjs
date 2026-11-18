import * as THREE from './vendor/three-0.178.0/three.module.min.js';
import {SKY_INPUT,skyObjectX,skyTrack} from './skyboard-physics.mjs?v=courses2';
import {populateSkyWorld,skyBackdrop} from './skyboard-world-art.mjs';

const ground=(shape,color,roughness=.78)=>new THREE.Mesh(shape,new THREE.MeshStandardMaterial({color,roughness}));
const flat=(shape,color)=>new THREE.Mesh(shape,new THREE.MeshBasicMaterial({color}));
const cube=(x,y,z,color)=>ground(new THREE.BoxGeometry(x,y,z),color);
function put(parent,mesh,x,y,z){
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function freeScene(scene){
  scene.background?.dispose?.();
  scene.traverse(object=>{
    object.geometry?.dispose();
    if(object.material){for(const material of [].concat(object.material)){material.map?.dispose();material.dispose();}}
  });
}
function sign(label,width,height,color='#172044'){
  const art=document.createElement('canvas');art.width=512;art.height=128;
  const ink=art.getContext('2d');
  ink.fillStyle=color;ink.fillRect(0,0,512,128);
  ink.strokeStyle='#fff0a4';ink.lineWidth=13;ink.strokeRect(8,8,496,112);
  ink.fillStyle='#fff7dd';ink.font='900 74px system-ui';ink.textAlign='center';
  ink.fillText(label,256,87,448);
  const texture=new THREE.CanvasTexture(art);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
}
function railGeometry(course,left,right,vertical=0,base=0){
  const positions=[],colors=[],gaps=course.things.filter(o=>o.kind==='gap');
  for(let z=0;z<course.length;){
    let next=Math.min(course.length,z+.95);
    const gap=gaps.find(o=>o.z+o.span/2>z+1e-8&&o.z-o.span/2<next);
    if(gap){
      const start=gap.z-gap.span*.5,end=gap.z+gap.span*.5;
      if(z<start-1e-8)next=start;else{z=end;continue;}
    }
    const a=skyTrack(course,z),b=skyTrack(course,next);
    const point=(segment,at,edge,drop=0)=>[segment.center+segment.half*edge,segment.y+base+drop,-at];
    const a1=point(a,z,left),a2=point(a,z,right,vertical),b1=point(b,next,left),b2=point(b,next,right,vertical);
    positions.push(...a1,...a2,...b1,...a2,...b2,...b1);
    const tint=Math.floor(z/16)%2===0?1:.87;
    for(let i=0;i<6;i++)colors.push(tint,tint,tint);
    z=next;
  }
  const shape=new THREE.BufferGeometry();
  shape.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  shape.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));shape.computeVertexNormals();
  return shape;
}
function makeTrack(scene,course,p){
  const strips=[
    [-1,1,0,0,p.road[0]],[-1,-1,-.73,0,p.accent],[1,1,-.73,0,p.accent],
    [-1,-.93,0,.036,p.border],[.93,1,0,.036,p.border],
    [-.94,-.91,0,.04,'#fff2cd'],[.91,.94,0,.04,'#fff2cd'],
    [-1,-.965,0,-.35,p.road[1]],[.965,1,0,-.35,p.road[1]]
  ];
  for(const [a,b,drop,base,color] of strips){
    const material=new THREE.MeshStandardMaterial({color,vertexColors:true,roughness:.93,side:THREE.DoubleSide});
    scene.add(new THREE.Mesh(railGeometry(course,a,b,drop,base),material));
  }
  const gaps=course.things.filter(o=>o.kind==='gap');
  for(let z=7;z<course.length;z+=11){
    if(gaps.some(o=>Math.abs(o.z-z)<o.span*.5+1.6))continue;
    const t=skyTrack(course,z);
    for(const side of [-1,1]){
      put(scene,flat(new THREE.BoxGeometry(.056,.009,2.0),'#fff3d3'),t.center+t.half*side*.27,t.y+.038,-z);
      put(scene,cube(.16,.21,.16,p.accent),t.center+t.half*side*.992,t.y+.107,-z);
    }
  }
  for(const z of [...course.checkpoints.slice(1),course.length]){
    const t=skyTrack(course,z),end=z===course.length,height=end?3.9:3.14;
    for(const x of [-t.half,t.half]){
      put(scene,cube(.36,height,.37,p.accent),t.center+x,t.y+height*.5,-z);
      put(scene,flat(new THREE.BoxGeometry(.33,.55,.40),p.border),t.center+x,t.y+height*.83,-z);
    }
    put(scene,cube(t.half*2.1,.26,.28,p.accent),t.center,t.y+height-.12,-z);
    put(scene,sign(end?'FINISH':'CHECKPOINT',end?4.7:3.55,end?.95:.64,p.accent),t.center,t.y+height-.14,-z+.17);
    if(end)for(let i=-6;i<7;i++)for(let j=0;j<2;j++)
      put(scene,flat(new THREE.BoxGeometry(t.half/6.5,.015,.36),(i+j)%2?'#1d354c':'#ffedb9'),
       t.center+(i/6.5)*t.half,t.y+.031,-z+j*.36);
  }
}
function makeRider(board,ghost=false){
  const figure=new THREE.Group(),deck=new THREE.Group();
  figure.add(deck);
  const look=ghost?null:board.look;
  const helmetColor=ghost?'#6cefff':look?.hair||'#ff548c',shirtColor=ghost?'#a5fff5':look?.shirt||'#504aca';
  const skin=look?.skin||'#f2ae83';
  const metal=look?.body==='robot'||look?.body?.startsWith?.('robot-');
  const sizes={sunny:[.77,1.68],snow:[.70,1.95],rocket:[.61,1.87],
    flower:[.91,1.59],dragon:[.83,1.87],star:[.69,1.99]};
  const [wide,long]=sizes[board.id]||sizes.sunny;
  put(deck,cube(wide,.11,long,board.color),0,.135,0);
  put(deck,cube(wide*.79,.023,long*.88,'#203b58'),0,.202,0);
  for(const z of [-.42,0,.42]){
    const stamp=put(deck,flat(new THREE.CylinderGeometry(.135,.135,.025,board.id==='flower'?7:4),board.trail),0,.211,z);
    stamp.rotation.y=Math.PI/4;
  }
  for(const z of [-long/2,long/2]){
    const lip=put(deck,cube(wide*.94,.09,.23,board.color),0,.17,z);
    lip.rotation.x=Math.sign(z)*-.27;
    put(deck,flat(new THREE.BoxGeometry(wide*.80,.025,.17),board.trail),0,.21,z*.65);
    for(const x of [-wide*.37,wide*.37])put(deck,ground(new THREE.CylinderGeometry(.115,.115,.12,10),'#1a2044'),x,.115,z*.65).rotation.z=Math.PI/2;
  }
  const person=new THREE.Group();person.position.y=.2;figure.add(person);
  put(person,ground(new THREE.CapsuleGeometry(.27,.33,5,10),shirtColor),0,.77,0).scale.set(1.12,1,.71);
  put(person,cube(.40,.35,.16,'#e1a24e'),0,.73,.185);
  put(person,cube(.32,.075,.174,'#322f58'),0,.775,.192);
  for(const x of [-.15,.15])put(person,cube(.045,.34,.188,'#182e45'),x,.72,.16);
  put(person,ground(metal?new THREE.BoxGeometry(.45,.43,.45):new THREE.SphereGeometry(.286,12,9),helmetColor),0,1.32,-.055);
  if(metal)put(person,flat(new THREE.BoxGeometry(.32,.08,.025),'#96f5f3'),0,1.35,.183);
  if(look?.garment==='safari'||look?.garment==='jacket')put(person,cube(.31,.34,.12,'#bc895e'),0,.82,.25);
  put(person,cube(.43,.085,.13,'#ffecc1'),0,1.21,.135);
  put(person,cube(.20,.024,.067,'#3c526d'),0,1.385,.210);
  for(const x of [-.19,.19]){
    const leg=put(person,ground(new THREE.CapsuleGeometry(.10,.33,4,8),'#242958'),x,.326,.04);
    leg.rotation.x=x<0?.34:-.27;
    put(person,cube(.235,.07,.34,'#2f4165'),x,.041,-.04);
    put(person,cube(.22,.094,.31,'#fbf1d4'),x,.12,-.04);
    const arm=put(person,ground(new THREE.CapsuleGeometry(.078,.35,4,7),skin),x*1.82,.74,.06);
    arm.rotation.z=x<0?-.68:.82;arm.rotation.x=-.45;
    put(person,ground(new THREE.SphereGeometry(.089,8,6),'#fff4d5'),x*2.51,.58,-.045);
  }
  const shade=put(figure,flat(new THREE.CircleGeometry(.43,17),'#28455b'),0,.02,0);
  shade.rotation.x=-Math.PI/2;shade.scale.y=1.83;
  shade.material.transparent=true;shade.material.opacity=.32;shade.material.depthWrite=false;
  const sparks=new THREE.Group();figure.add(sparks);
  if(!ghost)for(let i=0;i<8;i++)put(sparks,flat(new THREE.IcosahedronGeometry(.075+(i%3)*.025),i%2?'#fff587':board.trail),(i%2?1:-1)*(.22+i*.045),.225+(i%3)*.09,.9+i*.24);
  if(ghost)figure.traverse(child=>{if(child.material){child.material.transparent=true;child.material.depthWrite=false;child.material.opacity=.38;}});
  return {figure,person,deck,sparks};
}
function makeObject(scene,o,course,p){
  const group=new THREE.Group(),t=skyTrack(course,o.z);scene.add(group);group.position.set(t.center+o.x,t.y,-o.z);
  if(o.kind==='ball'){
    const roller=put(group,ground(new THREE.SphereGeometry(o.radius,24,16),'#f02b4e',.39),0,o.radius-.15,0);
    for(const z of [-.48,.54])put(roller,ground(new THREE.TorusGeometry(Math.sqrt(1-z*z)*o.radius,o.radius*.043,6,30),'#a30d43'),0,0,z*o.radius);
    put(roller,flat(new THREE.SphereGeometry(o.radius*.12,11,7),'#ffb3ac'),-.50*o.radius,.69*o.radius,.55*o.radius);
    put(group,flat(new THREE.CircleGeometry(o.radius*.9,20),'#913264'),0,.023,0).rotation.x=-Math.PI/2;
  }
  if(o.kind==='coin'){
    const coin=put(group,ground(new THREE.CylinderGeometry(.38,.38,.10,10),'#ffd44a',.45),0,.94,0);
    coin.rotation.x=Math.PI/2;
    put(coin,flat(new THREE.CircleGeometry(.26,5),'#fff3a0'),0,.06,0).rotation.x=-Math.PI/2;
  }
  if(o.kind==='boost'){
    put(group,cube(t.half*1.95,.06,5.8,'#14aced'),0,.05,1.4);
    for(let x=-4.2;x<=4.2;x+=1.4){
      for(const side of [-1,1])put(group,flat(new THREE.BoxGeometry(.14,.032,1.23),'#f7ffb9'),x+side*.31,.102,.64).rotation.y=side*.56;
    }
    const label=put(group,sign('10× SPEED',4.1,1.05,'#083f65'),0,4.05,5);
    label.rotation.x=-.11;
  }
  if(o.kind==='platform'){
    put(group,cube(o.half*2,.24,o.span,'#2d9d99'),0,-.232,0);
    put(group,flat(new THREE.BoxGeometry(o.half*1.86,.027,o.span*.83),'#8cebc5'),0,-.108,0);
    for(const x of [-o.half*.81,o.half*.81])
      put(group,flat(new THREE.BoxGeometry(.09,.032,o.span*.95),'#fff3af'),x,-.104,0);
  }
  if(o.kind==='ramp')put(group,sign('RAMP',1.75,.53,p.accent),t.half*.7,1.7,2);
  if(o.kind==='sweeper'){
    put(group,cube(o.half*2,o.height,.66,'#684480'),0,o.height*.5,0);
    for(let i=-2;i<=2;i++)put(group,cube(.14,o.height*.63,.038,'#f6c05d'),i*.30,o.height*.56,.347).rotation.z=-.41;
    put(group,flat(new THREE.BoxGeometry(o.half*1.86,.055,.68),'#f8ddb0'),0,o.height+.009,0);
  }
  if(o.kind==='gap')put(group,sign('JUMP',2.9,.8),t.half-.85,2,5);
  if(o.kind==='bar'||o.kind==='gate'){
    put(group,cube(o.half*2,o.height,.49,o.kind==='bar'?'#f45e67':'#a147ce'),0,o.height/2,0);
    for(const side of [-1,1])put(group,cube(.13,o.height,.51,'#fff0a9'),o.half*side*.72,o.height/2,0).rotation.z=-.45;
  }
  if(o.kind==='spikes'){
    for(const i of [-1,0,1])put(group,ground(new THREE.ConeGeometry(.42,o.height,5),'#f85384'),i*o.half*.63,o.height*.5,0);
  }
  return {o,group};
}
export function createSkyScene(width,height){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.setSize(width,height,false);renderer.setPixelRatio(1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const camera=new THREE.PerspectiveCamera(51,width/height,.12,270),aim=new THREE.Vector3();
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let scene=null,key='',rider,ghost,things,sun,snap=true;
  function populate(state,theme,board){
    if(scene)freeScene(scene);
    scene=new THREE.Scene();
    const p=theme.walls?theme:{...theme,horizon:'#f7d3a7',walls:['#688999','#92afba','#fff0d5','#5d989b']};
    scene.background=skyBackdrop(p);
    scene.fog=new THREE.Fog(p.sky[1],57,158);
    scene.add(new THREE.HemisphereLight('#fff2d4',p.sky[0],1.25));
    put(scene,new THREE.DirectionalLight('#fff4d2',1.72),-21,30,13);
    put(scene,new THREE.DirectionalLight('#a9d8fb',1.03),18,15,-27);
    makeTrack(scene,state.course,p);
    populateSkyWorld(scene,state.course,p);
    sun=put(scene,flat(new THREE.SphereGeometry(8,17,10),p.env==='city'?'#e4d1fb':'#fff4c5'),-40,26,-163);
    things=state.course.things.map(o=>makeObject(scene,o,state.course,theme));
    rider=makeRider(board);scene.add(rider.figure);
    ghost=makeRider(board,true);scene.add(ghost.figure);
    snap=true;
  }
  return {
    draw(ctx,state,theme,board,shadow){
      const next=state.course.seed+':'+state.course.stage+':'+state.course.edition+':'+board.id+':'+JSON.stringify(board.look||{});
      if(next!==key){key=next;populate(state,theme,board);}
      const {course,elapsed:t,progress:z}=state,track=skyTrack(course,z);
      const lowMotion=motion.matches;
      const boosted=state.boost>0;
      for(const {o,group} of things){
        group.visible=!state.used.has(o.id);
        if(['ball','platform','sweeper'].includes(o.kind))group.position.x=skyTrack(course,o.z).center+skyObjectX(o,t);
        if(o.kind==='ball')group.children[0].rotation.z=-skyObjectX(o,t)/o.radius;
        if(o.kind==='coin'&&!lowMotion){group.rotation.y=t*3.2;group.position.y=skyTrack(course,o.z).y+Math.sin(t*5+o.id)*.14;}
      }
      rider.figure.position.set(track.center+state.x,state.y,-z);
      rider.figure.rotation.set(0,-state.lean*.36,-state.lean*.36);
      rider.person.rotation.x=boosted?.44:state.hurt>0?-.25:state.grounded?.13:.21;
      rider.sparks.visible=boosted&&!lowMotion;
      for(let i=0;i<rider.sparks.children.length;i++)rider.sparks.children[i].scale.setScalar(.75+.32*Math.sin(i+t*34));
      ghost.figure.visible=Boolean(shadow);
      if(shadow)ghost.figure.position.set(skyTrack(course,shadow.z).center+shadow.x,shadow.y,-shadow.z);
      const x=track.center+state.x,rumble=!lowMotion&&state.hurt>0?Math.sin(t*88)*.14:0;
      const pace=boosted&&!lowMotion?1:0;
      if(snap||Math.abs(camera.position.z-(-z+5.9))>20){
        camera.position.set(x*.92,track.y+3.62,-z+5.90+pace);snap=false;
      }else{
        camera.position.x+=(x*.92+rumble-camera.position.x)*.25;
        camera.position.y+=(track.y+3.62-camera.position.y)*.22;
        camera.position.z=-z+5.90+pace;
      }
      sun.position.z=-z-166;
      aim.set(skyTrack(course,z+11).center+state.x*.28,state.y*.30+track.y*.70+.45,-z-11);
      camera.lookAt(aim);
      // A restrained camera bank makes drift legible while leaving replay physics untouched.
      if(!lowMotion&&Math.abs(state.lean)>.02)
        camera.rotateZ(-state.lean*(state.mask&SKY_INPUT.drift?.05:.018));
      if(camera.fov!==51+pace*9){camera.fov=51+pace*9;camera.updateProjectionMatrix();}
      renderer.render(scene,camera);
      ctx.drawImage(renderer.domElement,0,0,ctx.canvas.width,ctx.canvas.height);
    },
    dispose(){if(scene)freeScene(scene);renderer.dispose();renderer.forceContextLoss();}
  };
}
