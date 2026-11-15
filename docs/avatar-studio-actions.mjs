import {THREE,attach,disposeFigure,group,shade} from './avatar-studio-geometry.mjs?v=workshop1';
import {poseCompanion,rewardPigment} from './avatar-studio-companions.mjs?v=workshop1';
import {prizeAction} from './avatar-prize-actions.mjs?v=workshop1';

const radius=new THREE.Vector3(),rayEnd=new THREE.Vector3(),lensAt=new THREE.Vector3();
const tip=new THREE.Vector3();
const ease=THREE.MathUtils.smoothstep;
const hold=p=>ease(p,.06,.35)*(1-ease(p,.70,1));

function poseArm(arm,p,gesture=false){
  const {shoulder,hinge,palm,side,prop}=arm;
  const lift=hold(p);
  const sword=/sword|saber|dagger/.test(prop?.item.id||'');
  const lantern=prop?.item.id.includes('lantern');
  const draw=ease(p,.20,.67);
  shoulder.rotation.set(0,0,0);
  hinge.rotation.set(0,0,0);
  palm.rotation.set(arm.wristRest,0,arm.rollRest);
  if(sword){
    shoulder.rotation.set(-lift*.42,side*(.30-.83*draw)*lift,side*(.39-.89*draw)*lift);
    hinge.rotation.x=-(.86-.54*draw)*lift;
    palm.rotation.z+=side*(.23-.59*draw)*lift;
  }else if(lantern){
    shoulder.rotation.set(-.40*lift,side*.15*lift,-side*.28*lift);
    hinge.rotation.x=-.76*lift;
    palm.rotation.x+=.54*lift;
    prop.root.rotation.x=.11+.42*lift;
  }else{
    shoulder.rotation.x=-(gesture?.42:.24)*lift;
    shoulder.rotation.z=-side*.13*lift;
    hinge.rotation.x=-(gesture?.44:.53)*lift;
    palm.rotation.z+=side*.21*lift;
  }
  for(const finger of arm.fingers)finger.rotation.x=arm.fingerRest+(prop?-.23:.21)*lift;
}

function bladeTrail(actor,arm,p){
  const prop=arm.prop;
  if(!prop.inkArc){
    const strips=11;
    const geometry=new THREE.BufferGeometry();
    const vertices=new THREE.BufferAttribute(new Float32Array((strips+1)*6),3).setUsage(THREE.DynamicDrawUsage);
    const faces=[];
    for(let j=0;j<strips;j++){
      const i=j*2;
      faces.push(i,i+1,i+2,i+1,i+3,i+2);
    }
    geometry.setAttribute('position',vertices);
    geometry.setIndex(faces);
    const paint=new THREE.MeshBasicMaterial({color:shade(rewardPigment(prop.item),1.45),
      side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
    geometry.setAttribute('normal',new THREE.BufferAttribute(new Float32Array((strips+1)*6),3));
    const mesh=attach(actor.figure,geometry,paint);
    mesh.frustumCulled=false;
    prop.inkArc={mesh,vertices,paint,strips};
  }
  const {mesh,vertices,paint,strips}=prop.inkArc;
  const ink=ease(p,.16,.38)*(1-ease(p,.72,.96));
  mesh.visible=ink>.01;
  if(!mesh.visible)return;
  paint.opacity=.82*ink;
  for(let i=0;i<=strips;i++){
    const f=i/strips;
    poseArm(arm,Math.max(0,p-(1-f)*.26));
    for(let k=0;k<2;k++){
      tip.set(.006,.649-(k?f*.105:0),.017);
      actor.figure.worldToLocal(prop.shape.localToWorld(tip));
      vertices.setXYZ(i*2+k,tip.x,tip.y,tip.z);
    }
  }
  vertices.needsUpdate=true;
  poseArm(arm,p);
}

function foldCape(parts,value){
  if(!parts)return;
  for(const {mesh,position,idle} of parts){
    if(mesh.userData.fold===value)continue;
    mesh.userData.fold=value;
    for(let i=0;i<idle.length;i+=3){
      const x=idle[i],y=idle[i+1],z=idle[i+2];
      const hem=ease(2.013-y,0,.954)**1.6;
      const wave=Math.cos(x*11+z*4);
      position.setXYZ(i/3,x*(1+.45*hem*value),y+hem*(.084+.050*wave)*value,
        z-hem*(.20+.11*wave)*value);
    }
    position.needsUpdate=true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingSphere();
  }
}

function groundLight(actor,where,amount){
  if(!actor.lanternPool){
    const root=group(actor.root);
    actor.lanternPool=[.48,.35,.21].map((extent,i)=>{
      const material=new THREE.MeshBasicMaterial({color:['#f1a65e','#ffce82','#ffe6b5'][i],
        transparent:true,depthWrite:false,opacity:0,side:THREE.DoubleSide});
      const pool=attach(root,new THREE.CircleGeometry(extent,36),material,0,.02+i*.001,0);
      pool.rotation.x=-Math.PI/2;
      return pool;
    });
  }
  actor.root.worldToLocal(radius.copy(where));
  for(const [i,pool] of actor.lanternPool.entries()){
    pool.visible=amount>.01;
    pool.position.x=radius.x;pool.position.z=radius.z;
    pool.scale.set(1+amount*.34,1+amount*.11,1);
    pool.material.opacity=(.16+i*.043)*amount;
  }
}

function sweepVisor(actor,p){
  const {beam,emitter,shutters,signal}=actor.visor;
  const open=hold(p);
  for(const [i,shutter] of shutters.entries())shutter.rotation.x=-(1.72-i*.12)*open;
  beam.visible=open>.02;
  signal.emissiveIntensity=.34+open*1.43;
  if(!beam.visible)return;
  const home=actor.pet?.item.id.includes('gremlin')?actor.pet.head:actor.root;
  rayEnd.set(.64-ease(p,.22,.78)*1.37,.24,.61);
  if(home!==actor.root)rayEnd.set(.74-ease(p,.22,.78)*.86,.02,.14);
  home.localToWorld(rayEnd);
  emitter.getWorldPosition(lensAt);
  emitter.lookAt(rayEnd);
  beam.scale.z=lensAt.distanceTo(rayEnd);
  beam.material.opacity=.18*open;
}

function accentMotion(actor,prize,p,amount,byFace){
  const sources=['embers','bubbles','petals','steam','crystal','scan','spark','breeze','polish','lamp'];
  const trigger=prize&&amount>0&&
    !['phantom-cloak','carnival-visor-plate','museum-lantern','spectral-case-sword'].includes(prize.id)&&
    !['effect','companion'].includes(prize.slot);
  const accent=trigger?prizeAction(prize):null;
  if(!accent||!sources.includes(accent.kind)){
    if(actor.accent)actor.accent.root.visible=false;
    return;
  }
  if(actor.accent?.id!==prize.id){
    disposeFigure(actor.accent?.root);
    const root=group(actor.figure);
    const material=new THREE.MeshBasicMaterial({color:accent.accent,opacity:0,
      depthWrite:false,transparent:true,side:THREE.DoubleSide});
    const motes=Array.from({length:7},()=>attach(root,
      accent.kind==='bubbles'?new THREE.SphereGeometry(.025,10,7):
        accent.kind==='scan'?new THREE.PlaneGeometry(.075,.012):new THREE.OctahedronGeometry(.025),
      material));
    actor.accent={id:prize.id,root,material,motes};
  }
  const {root,material,motes}=actor.accent;
  const held=actor.props.find(prop=>prop.item.id===prize.id);
  if(held)actor.figure.worldToLocal(held.root.getWorldPosition(root.position));
  else root.position.set(0,byFace?2.63:1.55,.19);
  root.visible=true;material.opacity=.61*amount;
  const drifting=['steam','embers','bubbles','petals'].includes(accent.kind);
  const sweep=accent.kind==='scan'||accent.kind==='polish';
  for(const [i,mote] of motes.entries()){
    const a=i*2.399+p*(drifting?1.1:4.8);
    const spread=(held?.18:byFace?.31:.51)*(.83+amount*.25);
    mote.position.set(Math.cos(a)*spread,
      drifting?p*.31+(i%4)*.035:Math.sin(a)*spread*.79,
      sweep?.18:Math.sin(i)*.089);
    mote.rotation.set(.34+p*1.9,i*.57,p*4.3);
    mote.scale.set(sweep?1.48:1,drifting?.81:1,accent.kind==='petals'?.5:1);
  }
}

export function poseStudioAction(actor,time,motion,light){
  const id=motion?.id;
  const p=motion?.progress??0;
  const prize=Object.values(actor.cosmetics).find(item=>item.id===id);
  const active=Boolean(prize&&p>0&&p<1);
  const amount=active?hold(p):0;
  const petAction=active&&prize.slot==='companion';
  const wearable=active&&!['companion','prop','offhand'].includes(prize.slot);
  const face=wearable&&['hat','eyewear','hair','eyes','bodypart'].includes(prize.slot);
  const scanner=active&&(id==='carnival-visor-plate'||prize.art==='visor');
  // Very restrained character acting. Never alter a saved recipe to animate it.
  const idle=!active&&time>0&&Number.isFinite(time);
  const breath=idle?Math.sin(time*1.18):0;
  actor.figure.rotation.y=wearable&&!face&&id!=='phantom-cloak'?Math.sin(p*Math.PI*1.6)*amount*.23:0;
  actor.figure.rotation.z=idle?breath*.008:0;
  actor.head.userData.studioRestTilt ??= actor.head.rotation.z;
  actor.head.rotation.z=actor.head.userData.studioRestTilt+(idle?Math.sin(time*.77+.5)*.018:0);
  actor.head.userData.studioRestYaw ??= actor.head.rotation.y;
  actor.head.rotation.y=actor.head.userData.studioRestYaw+(time?Math.sin(time*.51)*.042:0)+(face?amount*.18:0);
  actor.head.rotation.x=petAction?amount*.20:scanner?amount*.27:idle?Math.sin(time*.62)*.012:0;
  if(actor.hat)actor.hat.rotation.z=prize?.slot==='hat'?Math.sin(p*5)*amount*.12:0;
  foldCape(actor.capeParts,id==='phantom-cloak'||prize?.art==='cape'?amount:0);
  light.intensity=0;
  if(actor.lanternPool)for(const pool of actor.lanternPool)pool.visible=false;
  if(actor.pet)actor.pet.root.position.copy(actor.pet.home);
  let response=petAction?{...motion,action:motion.action||'play'}:null;
  for(const arm of actor.arms){
    const prop=arm.prop;
    const triggered=active&&prop?.item.id===id;
    poseArm(arm,triggered||petAction&&arm.side===1&&!prop?p:0,petAction);
    if(idle&&!prop)arm.shoulder.rotation.z+=arm.side*(.009+.006*Math.sin(time*.91+arm.side));
    if(!prop)continue;
    if(prop.inkArc)prop.inkArc.mesh.visible=false;
    if(prop.trail){
      const sword=/sword|saber|dagger/.test(prop.item.id);
      prop.trail.visible=Boolean(triggered&&!sword);
      prop.trail.material.opacity=amount*.59;
      if(triggered&&sword)bladeTrail(actor,arm,p);
    }
    if(prop.glow)prop.glow.emissiveIntensity=.38+(triggered?amount*2.1:0);
    if(prop.item.art==='telescope'){
      prop.movable.position.x=.20+(triggered?amount*.189:0);
      if(triggered&&actor.pet?.species==='moth'){
        const landing=prop.movable.localToWorld(new THREE.Vector3(.087,.091,.012));
        actor.root.worldToLocal(landing);landing.y-=.09;
        const follow=hold(p)**.65;
        actor.pet.root.position.lerp(landing,follow);
        response={action:'perch',progress:p};
        actor.head.rotation.y=actor.head.userData.studioRestYaw+amount*.22;
      }
    }
    if(prop.item.art==='compass')prop.movable.rotation.z=triggered?Math.sin(p*14)*(1-p)*2.4+amount*.62:0;
    if(!prop.item.id.includes('lantern')&&prop.item.art!=='flashlight')continue;
    const position=prop.shape.localToWorld(lensAt.set(0,prop.item.art==='flashlight'?.166:-.23,.045));
    light.position.copy(position);
    light.color.set('#ffb958');
    light.intensity=.52+(triggered?amount*5.1:0);
    if(triggered)groundLight(actor,position,amount);
    if(triggered&&actor.pet?.item.id.includes('hound')){
      response={action:'sniff',progress:p,target:actor.pet.root.worldToLocal(position.clone())};
      actor.head.rotation.y=amount*.33;
    }
  }
  if(scanner&&actor.pet?.item.id.includes('gremlin'))
    response={action:'scan',progress:p,target:actor.pet.root.worldToLocal(actor.head.getWorldPosition(new THREE.Vector3()))};
  poseCompanion(actor.pet,time,response);
  if(actor.visor)sweepVisor(actor,scanner?p:0);
  accentMotion(actor,prize,p,amount,face);
  if(actor.aura){
    actor.aura.root.rotation.y=time*.73+p*3.9;
    actor.aura.root.scale.setScalar(1+(prize?.slot==='effect'?amount*.27:0));
    for(const element of actor.aura.points)element.rotation.set(time*.94+p*4,.5,p*2.6);
  }
  return {id:active?id:'',response:response?.action||''};
}
