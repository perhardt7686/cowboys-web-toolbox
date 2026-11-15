import {AVATAR_OPTIONS,normalizeAvatarRecipe} from './family-avatar-builder.mjs?v=studio3';
import {normalizeBody,projectTurn} from './avatar-full-body.mjs?v=studio3';
import {drawTurnaround} from './avatar-turnaround.mjs?v=turn1';
import {paintTurnaroundScene} from './avatar-turnaround-scenery.mjs?v=turn1';
import {BY_ID,SLOT_LABELS} from './avatar-reward-catalog.mjs?v=finish5';
import {glint,oval,paintScene,path} from './avatar-cel-art.mjs?v=cel1';
import {bounds,paintAura,paintReaction,petBehavior,prizeAction,prizeMotion} from './avatar-prize-actions.mjs?v=turn1';

export const COSMETIC_SLOTS=Object.freeze(Object.keys(SLOT_LABELS));
const thumbnails=new WeakSet();
const cels=new Map();
let motionCel,detailCel,detailStamp;

export function normalizeLoadout(value) {
  const cosmetics={};
  for(const slot of COSMETIC_SLOTS) {
    const id=value?.cosmetics?.[slot];
    if(typeof id==='string'&&BY_ID.get(id)?.slot===slot)cosmetics[slot]=id;
  }
  const body=value?.full_body?{full_body:normalizeBody(value)}:{};
  return {...normalizeAvatarRecipe(value),...body,cosmetics};
}

function newCel(size=256) {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  return canvas;
}

function finishedCel(item,t,detailed) {
  if(detailed&&detailStamp===item.id&&!t)return detailCel;
  if(!detailed&&!t&&cels.has(item.id))return cels.get(item.id);
  const cel=detailed?(detailCel||=newCel(640)):t?(motionCel||=newCel()):newCel();
  const c=cel.getContext('2d');
  const scale=cel.width/256;
  c.setTransform(scale,0,0,scale,0,0);
  c.clearRect(0,0,256,256);
  item.draw(c,t);
  const [x,y,w,h]=bounds[item.slot];
  const lighting=c.createLinearGradient(x-w*.45,y-h,x+w*.4,y+h);
  lighting.addColorStop(0,'#fff1c355');
  lighting.addColorStop(.37,'#ffeead18');
  lighting.addColorStop(.54,'#d3774200');
  lighting.addColorStop(.57,'#3e1b2c17');
  lighting.addColorStop(1,'#31182f64');
  c.save();
  c.globalCompositeOperation='source-atop';
  c.fillStyle=lighting;
  c.fillRect(0,0,256,256);
  c.restore();
  if(detailed)detailStamp=t?null:item.id;
  else if(!t){
    if(cels.size>=64)cels.delete(cels.keys().next().value);
    cels.set(item.id,cel);
  }
  return cel;
}

function paintPrize(c,item,t=0,activity,detailed=false) {
  const [x,y,w,h]=bounds[item.slot];
  const spec=activity&&(item.slot==='companion'?petBehavior(item,activity.action):prizeAction(item));
  const progress=activity?.progress;
  c.save();
  if(spec&&item.slot!=='background'&&item.slot!=='effect'){
    const width=item.slot==='hair'?74:Math.min(76,w*1.46);
    paintAura(c,x,y,width,spec.accent,.45+.38*Math.sin(Math.PI*progress));
  }
  if(spec)prizeMotion(c,item,spec,progress);
  const activeTime=spec?progress*3:0;
  const cel=finishedCel(item,item.animated?t+activeTime:0,detailed);
  if(item.slot!=='background'&&item.slot!=='effect'&&item.slot!=='eyes'){
    c.shadowColor='#2e192840';
    c.shadowOffsetY=2;
    c.shadowBlur=2.5;
  }
  c.drawImage(cel,0,0,256,256);
  c.restore();
  if(spec)paintReaction(c,item,spec,progress);
}

export function renderLoadout(canvas,value,t=0,activity=null,camera={}) {
  const loadout=normalizeLoadout(value);
  const colors=Object.fromEntries(['skin','hair','shirt','eyes'].map(key=>
    [key,AVATAR_OPTIONS[key].find(([id])=>id===loadout[key])[2]]));
  drawTurnaround(canvas,loadout,colors,id=>BY_ID.get(id),camera,t,activity);
}

const cropAt={
  top:{y:247,size:204},outerwear:{y:282,size:278},bottoms:{y:399,size:240},footwear:{y:479,size:176},
  hands:{y:308,size:214},waist:{y:317,size:165},neckwear:{y:187,size:164},back:{y:257,size:220},
  bodypart:{y:218,size:218},prop:{y:241,size:277},offhand:{y:286,size:281}
};

function displayFitted(c,item,activity){
  const model=item.families?.includes('robot')?'automaton':item.families?.includes('monster')?'armor':'detective';
  const angle=item.slot==='back'&&item.cut==='pack'?180:31;
  renderLoadout(c,{full_body:{model},cosmetics:{[item.slot]:item.id}},0,
    activity&&{id:item.id,progress:activity.progress}, {angle,crop:{x:216,...cropAt[item.slot]}});
}

function displayWardrobeIcon(canvas,item,activity){
  const c=canvas.getContext('2d');
  if(!c)return;
  const scale=canvas.width/256;
  c.save();
  c.setTransform(scale,0,0,canvas.height/256,0,0);
  c.clearRect(0,0,256,256);
  const backdrop=c.createLinearGradient(0,0,235,256);
  backdrop.addColorStop(0,'#f5eddd');
  backdrop.addColorStop(.6,'#e4d8d2');
  backdrop.addColorStop(1,'#b5a9b9');
  c.fillStyle=backdrop;c.fillRect(0,0,256,256);
  oval(c,128,111,112,97,'#fff8e3a8','#624f7135',1.8);
  path(c,[0,228],[[60,209,121,213,161,220],[205,223,234,211,256,215],
    [256,256],[0,256]],'#564b6599',null);
  c.save();
  item.draw(c);
  c.restore();
  // In the small collection view the action highlights the item's actual shape.
  const glow=activity?.progress==null?0:Math.sin(Math.PI*activity.progress);
  if(glow>0){
    c.globalAlpha=.64*glow;
    glint(c,193,44,10+glow*4,'#fff7ce');
    glint(c,65,83,6+glow*3,'#f0cd8e');
    c.globalAlpha=1;
  }
  c.restore();
}

function displayFrame(canvas,item,activity=null) {
  if(item.creature){
    drawPetPortrait(canvas,item,activity?'trick':null,activity?.progress);
    return;
  }
  if(!bounds[item.slot]&&typeof item.draw==='function'&&canvas.width<180){
    displayWardrobeIcon(canvas,item,activity);
    return;
  }
  if(item.stageDraw||!bounds[item.slot]){
    displayFitted(canvas,item,activity);
    return;
  }
  const c=canvas.getContext('2d');
  if(!c)return;
  const [x,y]=bounds[item.slot];
  let scale=1;
  if(item.slot==='hat')scale=1.26;
  else if(item.slot==='eyewear'||item.slot==='eyes')scale=1.35;
  else if(item.slot==='hair')scale=1.12;
  else if(item.slot==='prop'||item.slot==='companion')scale=2.47;
  c.save();
  c.scale(canvas.width/256,canvas.height/256);
  c.clearRect(0,0,256,256);
  const [light,shadow]={
    starter:['#465366','#282635'],bronze:['#765644','#432d3b'],silver:['#46646a','#263743'],
    gold:['#7a5944','#3e2d39'],legendary:['#573f64','#25233d'],family:['#4d675b','#2b393e']
  }[item.tier];
  const scene=c.createLinearGradient(0,0,220,256);
  scene.addColorStop(0,light);
  scene.addColorStop(1,shadow);
  c.fillStyle=scene;
  c.fillRect(0,0,256,256);
  oval(c,127,115,107,90,'#f5d8a724','#efc79860',1.45,-.23);
  oval(c,130,115,96,79,'#f3cf9114','#ffd29842',1,-.23);
  oval(c,126,210,73,10,'#21182342');
  path(c,[12,224],[[95,193,184,202,244,218],[256,256],[0,256]],'#211c34',null);
  for (const [dx,dy,r] of [[23,34,5],[228,51,5],[48,208,3],[219,183,3]])glint(c,dx,dy,r,'#e9c18a');
  c.translate(128,128);
  c.scale(scale,scale);
  c.translate(-x,-y);
  paintPrize(c,item,0,activity,canvas.width>=150&&scale>1.2);
  c.restore();
}

export function paintThumbnail(canvas,item) {
  if(!canvas||!item||thumbnails.has(canvas))return;
  displayFrame(canvas,item);
  thumbnails.add(canvas);
}

export function paintPrizeDemo(canvas,item,progress) {
  displayFrame(canvas,item,{progress});
}

export function drawPetPortrait(canvas,item,action,progress=0,camera={}) {
  const c=canvas.getContext('2d');
  if(item.creature){
    c.save();
    const size=Math.min(canvas.width,canvas.height);
    c.clearRect(0,0,canvas.width,canvas.height);
    c.fillStyle='#263447';c.fillRect(0,0,canvas.width,canvas.height);
    c.translate(canvas.width/2,canvas.height/2);
    const factor=size/173*(camera.zoom||1);
    c.scale(factor,factor);c.translate((camera.x||0)*.28,(camera.y||0)*.25);
    c.save();c.scale(.4,.32);c.translate(-216,-354);
    paintTurnaroundScene(c,{background:'moss'});c.restore();
    item.creature(c,{angle:projectTurn(camera.angle??31),action,progress:action?progress:undefined});
    c.restore();return;
  }
  c.save();
  c.scale(canvas.width/256,canvas.height/256);
  c.clearRect(0,0,256,256);
  paintScene(c,item.tier==='legendary'?'night':item.tier==='family'?'mint':'sunset');
  c.translate(122,137);c.scale(2.32,2.32);c.translate(-209,-192);
  paintPrize(c,item,0,action?{action,progress}:null,true);
  c.restore();
}

export function avatarSnapshot(value, size=128) {
  if(!value||typeof value!=='object')return null;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  renderLoadout(canvas,value,0,null,{angle:22.5,crop:{size:174}});
  return canvas.toDataURL('image/png');
}

export function playCel(canvas,paint,reduceMotion) {
  if(reduceMotion()||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    paint(.43);
    return ()=>{};
  }
  let started=null, frame=0;
  const tick=now=>{
    if(!canvas.isConnected||!canvas.getClientRects().length||document.hidden)return;
    started??=now;
    const progress=Math.min(1,(now-started)/1150);
    paint(progress);
    if(progress<1)frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return ()=>cancelAnimationFrame(frame);
}
