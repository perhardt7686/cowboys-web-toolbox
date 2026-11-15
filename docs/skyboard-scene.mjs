import * as THREE from './vendor/three-0.178.0/three.module.min.js';
import {skyObjectX,skyTrack} from './skyboard-physics.mjs';

const cut=['#160e42','#432467','#423766','#2b3d69','#101529','#243357'];
const ground=(shape,color,roughness=.78)=>new THREE.Mesh(shape,new THREE.MeshStandardMaterial({color,roughness}));
const flat=(shape,color)=>new THREE.Mesh(shape,new THREE.MeshBasicMaterial({color}));
const cube=(x,y,z,color)=>ground(new THREE.BoxGeometry(x,y,z),color);
function put(parent,mesh,x,y,z){
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function seeded(index){
  const number=Math.sin(index*78.233+31.63)*43758.5453;
  return number-Math.floor(number);
}
function freeScene(scene){
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
function railGeometry(course,left,right,vertical=0){
  const positions=[],colors=[],side=vertical===0,gap=course.things.find(o=>o.kind==='gap');
  for(let z=0;z<course.length;){
    let next=Math.min(course.length,z+1.5);
    if(gap){
      const begin=gap.z-gap.span/2,end=gap.z+gap.span/2;
      if(z<begin&&next>begin)next=begin;
      else if(z>=begin-1e-6&&z<end-1e-6){z=end;continue;}
    }
    const a=skyTrack(course,z),b=skyTrack(course,next);
    const point=(section,at,edge,drop=0)=>[section.center+section.half*edge,section.y+drop,-at];
    const a1=point(a,z,left),a2=point(a,z,right,vertical),b1=point(b,next,left),b2=point(b,next,right,vertical);
    positions.push(...a1,...a2,...b1,...a2,...b2,...b1);
    const tint=side&&Math.floor(z/12)%2===0?1:.86;
    for(let i=0;i<6;i++)colors.push(tint,tint,tint);
    z=next;
  }
  const shape=new THREE.BufferGeometry();
  shape.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  shape.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));shape.computeVertexNormals();
  return shape;
}
function makeTrack(scene,course,p){
  for(const [a,b,y,color] of [[-1,1,0,p.road[0]],[-1,-.93,.042,p.border],[.93,1,.042,p.border],[-1,-1,-.62,p.accent],[1,1,-.62,p.accent]]){
    scene.add(new THREE.Mesh(railGeometry(course,a,b,y),new THREE.MeshStandardMaterial({color,vertexColors:true,side:THREE.DoubleSide})));
  }
  const gap=course.things.find(o=>o.kind==='gap');
  for(let z=7;z<course.length;z+=9){
    if(gap&&Math.abs(gap.z-z)<3.5)continue;
    const t=skyTrack(course,z);
    put(scene,flat(new THREE.BoxGeometry(.1,.012,2.7),'#fff9d9'),t.center,t.y+.042,-z);
  }
  for(const z of [...course.checkpoints.slice(1),course.length]){
    const t=skyTrack(course,z),end=z===course.length;
    for(const x of [-t.half,t.half])put(scene,cube(.25,end?4.15:3.3,.32,p.border),t.center+x,t.y+(end?2:1.65),-z);
    put(scene,sign(end?'FINISH':'CHECKPOINT',end?6.4:4.2,end?1.4:1),t.center,t.y+(end?3.8:2.9),-z);
  }
}
function makeScenery(scene,course,p){
  const theme=p.env,idx=['cloud','canyon','palm','ice','city','forest'].indexOf(theme);
  for(let i=0;i<54;i++){
    const z=i*8-19,side=i%2?1:-1,x=side*(11+seeded(i)*32),air=seeded(i+49),t=skyTrack(course,z);
    const object=new THREE.Group();scene.add(object);
    object.position.set(x+t.center,-4.2-air*10,-z+seeded(i+11)*6);
    const scale=2.5+air*6;
    if(theme==='city'){
      put(object,cube(scale*.77,scale*3.8,scale*.8,cut[idx]),0,-2,0);
      for(let j=0;j<4;j++)put(object,flat(new THREE.BoxGeometry(scale*.42,.1,.03),p.accent),0,scale*(1.15-j*.52),scale*.401);
    }else if(theme==='canyon'||theme==='ice'){
      const rock=ground(new THREE.CylinderGeometry(scale*.39,scale*.86,scale*2.1,5),i%3===0?p.border:p.accent);
      put(object,rock,0,scale*.32,0);rock.rotation.y=air*2.2;
      put(object,ground(new THREE.ConeGeometry(scale*.60,scale*1.35,5),p.road[i%2]),.2,scale*1.88,0).rotation.y=rock.rotation.y;
    }else{
      put(object,ground(new THREE.DodecahedronGeometry(scale,0),theme==='cloud'?'#fbf3ff':p.road[i%2]),0,0,0).scale.y=.49;
      for(let j=0;j<3;j++){
        if(theme==='cloud'){
          put(object,ground(new THREE.SphereGeometry(scale*(.31+seeded(j+i*3)*.40),8,5),'#fdf8f5'),(j-1)*scale*.57,scale*(.25+seeded(j+i)*.17),0);
        }else{
          const height=scale*(.56+seeded(j+4*i)*.58),xx=(j-1)*scale*.48;
          put(object,ground(new THREE.CylinderGeometry(.11,.22,height,5),'#764368'),xx,height*.49,0);
          if(theme==='palm'){
            for(let k=0;k<3;k++){
              const leaf=put(object,ground(new THREE.ConeGeometry(height*.43,height*.95,4),k%2?p.road[1]:p.accent),xx,height,0);
              leaf.rotation.z=(k-1)*1.2;
            }
          }else put(object,ground(new THREE.ConeGeometry(height*.55,height*1.3,6),j%2?p.border:'#259b83'),xx,height*1.09,0);
        }
      }
    }
  }
  const sun=put(scene,flat(new THREE.SphereGeometry(9,20,12),theme==='city'?'#f6d4ff':'#fff4b5'),-46,32,-166);
  return sun;
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
  put(deck,cube(wide,.11,long,board.color),0,.14,0);
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
  put(person,cube(.39,.33,.16,'#ffb745'),0,.73,.18);
  put(person,ground(metal?new THREE.BoxGeometry(.45,.43,.45):new THREE.SphereGeometry(.286,12,9),helmetColor),0,1.32,-.055);
  if(metal)put(person,flat(new THREE.BoxGeometry(.32,.08,.025),'#96f5f3'),0,1.35,.183);
  if(look?.garment==='safari'||look?.garment==='jacket')put(person,cube(.31,.34,.12,'#bc895e'),0,.82,.25);
  put(person,cube(.43,.085,.13,'#ffecc1'),0,1.21,.135);
  for(const x of [-.19,.19]){
    const leg=put(person,ground(new THREE.CapsuleGeometry(.10,.33,4,8),'#242958'),x,.326,.04);
    leg.rotation.x=x<0?.34:-.27;
    put(person,cube(.23,.11,.32,'#fbf4ef'),x,.075,-.03);
    const arm=put(person,ground(new THREE.CapsuleGeometry(.078,.35,4,7),skin),x*1.82,.74,.06);
    arm.rotation.z=x<0?-.68:.82;arm.rotation.x=-.45;
    put(person,ground(new THREE.SphereGeometry(.089,8,6),'#fff4d5'),x*2.51,.58,-.045);
  }
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
  if(o.kind==='platform')put(group,cube(o.half*2,.25,o.span,'#00cfaa'),0,-.245,0);
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
  renderer.setSize(width,height,false);renderer.setPixelRatio(1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const camera=new THREE.PerspectiveCamera(51,width/height,.12,270),aim=new THREE.Vector3();
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let scene=null,key='',rider,ghost,things,sun,snap=true;
  function populate(state,theme,board){
    if(scene)freeScene(scene);
    scene=new THREE.Scene();scene.background=new THREE.Color(theme.sky[0]);
    scene.fog=new THREE.Fog(theme.sky[1],47,161);
    scene.add(new THREE.HemisphereLight('#fff9ed',theme.sky[0],2));
    put(scene,new THREE.DirectionalLight('#fff7d8',2.35),-12,27,9);
    put(scene,new THREE.DirectionalLight('#add1fb',.95),7,17,-19);
    makeTrack(scene,state.course,theme);sun=makeScenery(scene,state.course,theme);
    things=state.course.things.map(o=>makeObject(scene,o,state.course,theme));
    rider=makeRider(board);scene.add(rider.figure);
    ghost=makeRider(board,true);scene.add(ghost.figure);
    snap=true;
  }
  return {
    draw(ctx,state,theme,board,shadow){
      const next=state.course.seed+':'+state.course.stage+':'+board.id+':'+JSON.stringify(board.look||{});
      if(next!==key){key=next;populate(state,theme,board);}
      const {course,elapsed:t,progress:z}=state,track=skyTrack(course,z);
      const lowMotion=motion.matches;
      const boosted=state.boost>0;
      for(const {o,group} of things){
        group.visible=!state.used.has(o.id);
        if(o.kind==='ball'||o.kind==='platform')group.position.x=skyTrack(course,o.z).center+skyObjectX(o,t);
        if(o.kind==='ball')group.children[0].rotation.z=-skyObjectX(o,t)/o.radius;
        if(o.kind==='coin'&&!lowMotion){group.rotation.y=t*3.2;group.position.y=skyTrack(course,o.z).y+Math.sin(t*5+o.id)*.14;}
      }
      rider.figure.position.set(track.center+state.x,state.y,-z);
      rider.figure.rotation.set(0,-state.lean*.36,-state.lean*.36);
      rider.person.rotation.x=boosted?.46:.09;
      rider.sparks.visible=boosted&&!lowMotion;
      for(let i=0;i<rider.sparks.children.length;i++)rider.sparks.children[i].scale.setScalar(.75+.32*Math.sin(i+t*34));
      ghost.figure.visible=Boolean(shadow);
      if(shadow)ghost.figure.position.set(skyTrack(course,shadow.z).center+shadow.x,shadow.y,-shadow.z);
      const x=track.center+state.x,rumble=!lowMotion&&state.hurt>0?Math.sin(t*88)*.14:0;
      const pace=boosted&&!lowMotion?1:0;
      if(snap||Math.abs(camera.position.z-(-z+6))>20){
        camera.position.set(x*.92,track.y+4.35,-z+6.2+pace);snap=false;
      }else{
        camera.position.x+=(x*.92+rumble-camera.position.x)*.25;
        camera.position.y+=(track.y+4.35-camera.position.y)*.22;
        camera.position.z=-z+6.2+pace;
      }
      sun.position.z=-z-166;
      aim.set(skyTrack(course,z+11).center+state.x*.28,state.y*.30+track.y*.70+1.5,-z-11);
      camera.lookAt(aim);
      if(camera.fov!==51+pace*9){camera.fov=51+pace*9;camera.updateProjectionMatrix();}
      renderer.render(scene,camera);
      ctx.drawImage(renderer.domElement,0,0,ctx.canvas.width,ctx.canvas.height);
    },
    dispose(){if(scene)freeScene(scene);renderer.dispose();renderer.forceContextLoss();}
  };
}
