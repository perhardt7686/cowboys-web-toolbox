import {THREE,attach,box,color,disposeFigure,group,hash,oval,picture,shade,shell,surface} from './avatar-studio-geometry.mjs?v=studio2';
import {buildAvatar} from './avatar-studio-character.mjs?v=studio2';
import {SHOWROOM_LOOKS} from './avatar-showroom-presets.mjs?v=studio2';
import {buildCompanion,heldItem,poseCompanion,rewardPigment} from './avatar-studio-companions.mjs?v=studio2';
import {normalizeLoadout} from './avatar-reward-render.mjs?v=studio2';
import {renderSoftwareRoom} from './avatar-studio-software.mjs?v=studio2';

const PALETTES={
  lavender:['#9baec6','#63778d','#50596d'],night:['#6d7995','#454963','#30354a'],
  sunset:['#c3a6aa','#997d98','#625368'],ocean:['#8cb7bf','#52778a','#3f6176'],
  mint:['#99b3a9','#628a85','#486965'],cloud:['#a6b6cb','#7489a1','#525b7b'],
  sand:['#c4b1a1','#9e8785','#655b6b'],rose:['#c6a3b6','#9a789c','#6c566f'],
  heather:['#a7a1bd','#796f91','#57516b'],sky:['#91b6cb','#6587a0','#4e667f'],
  peach:['#c5a9a1','#a38782','#67535d'],sunflower:['#c5b494','#ad9477','#726375'],
  ochre:['#baa68b','#968674','#665b60'],moss:['#9cae9d','#66867f','#40585b']
};

let runtime,activeView=null;
const views=new WeakMap();
const savedBackdrops=new Map();

function clothBackground(palette,theme=''){
  const key=palette.join(':')+theme;
  if(savedBackdrops.has(key))return savedBackdrops.get(key);
  const canvas=document.createElement('canvas');
  canvas.width=768;canvas.height=768;
  const g=canvas.getContext('2d');
  const [shine,mid,low]=palette;
  const wash=g.createRadialGradient(395,236,30,406,335,610);
  wash.addColorStop(0,shine);wash.addColorStop(.66,mid);wash.addColorStop(1,low);
  g.fillStyle=wash;g.fillRect(0,0,768,768);
  g.strokeStyle='#e9f4f527';g.lineWidth=1.6;
  for(let i=0;i<3;i++){
    const x=187+i*66;
    g.beginPath();g.moveTo(x,627);g.lineTo(x,239+i*4);
    g.bezierCurveTo(x,38-i*10,768-x,38-i*10,768-x,239+i*4);
    g.lineTo(768-x,627);g.stroke();
  }
  const seed=hash(theme||'studio');
  for(let i=0;i<105;i++){
    const x=(i*97+seed)%768,y=(i*71+seed)%768;
    g.fillStyle=i%3?'#f2f8fa17':'#2f2a4010';
    g.beginPath();g.arc(x,y,.4+(i%4)*.21,0,Math.PI*2);g.fill();
  }
  if(theme){
    g.save();g.translate(250+(seed%3)*115,290);g.rotate((seed%5-2)*.10);
    const spokes=5+seed%7;
    g.strokeStyle='#e6edf54a';g.lineWidth=2;
    for(let i=0;i<spokes;i++){
      g.rotate(Math.PI*2/spokes);
      g.beginPath();g.moveTo(0,68);g.quadraticCurveTo(48,105,0,153);g.quadraticCurveTo(-40,108,0,68);g.stroke();
    }
    g.restore();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  if(savedBackdrops.size>=30){
    const first=savedBackdrops.keys().next().value;
    savedBackdrops.get(first).dispose();savedBackdrops.delete(first);
  }
  savedBackdrops.set(key,texture);
  return texture;
}

function shadowLayer(){
  const dim=document.createElement('canvas');dim.width=dim.height=128;
  const c=dim.getContext('2d');
  const gradient=c.createRadialGradient(64,64,8,64,64,63);
  gradient.addColorStop(0,'#222132b0');gradient.addColorStop(.46,'#26223554');gradient.addColorStop(1,'#221f2a00');
  c.fillStyle=gradient;c.fillRect(0,0,128,128);
  return new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(dim),transparent:true,depthWrite:false});
}

function initialize(){
  if(runtime!==undefined)return runtime;
  runtime=null;
  const canvas=document.createElement('canvas');
  let renderer=null;
  try{
    const context=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});
    if(context){
      renderer=new THREE.WebGLRenderer({canvas,context,alpha:false,antialias:true});
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.10;
    }
  }catch{renderer=null;}
  try{
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-1.3,1.3,1.8,-1.8,.05,50);
    scene.add(new THREE.HemisphereLight('#f1eaff','#a4a1ba',2.05));
    const key=new THREE.DirectionalLight('#ffe8d7',3.20);
    key.position.set(-3.2,5.2,4.2);scene.add(key);
    const fill=new THREE.DirectionalLight('#bdddea',1.32);
    fill.position.set(4,1.9,3.8);scene.add(fill);
    const rim=new THREE.DirectionalLight('#dce5ff',2.65);
    rim.position.set(.6,3.2,-3.3);scene.add(rim);
    const base=group(scene);
    const ballast=surface('#5b6480',{roughness:.71,metalness:.21});
    const deck=surface('#d0d5db',{roughness:.57,metalness:.19});
    const alloy=surface('#9eaebf',{roughness:.41,metalness:.53});
    const skirting=surface('#6e7c91',{roughness:.77,metalness:.10});
    attach(base,new THREE.CylinderGeometry(1.246,1.289,.119,96),ballast,0,-.105,0);
    attach(base,new THREE.CylinderGeometry(1.245,1.247,.027,96),alloy,0,-.053,0);
    attach(base,new THREE.CylinderGeometry(1.216,1.243,.043,96),deck,0,-.022,0);
    attach(base,new THREE.CylinderGeometry(1.224,1.237,.018,96),skirting,0,-.156,0);
    const shadow=shadowLayer();
    const spot=picture(base,shadow,0,.005,.075,1.84,1.07);spot.rotation.x=-Math.PI/2;
    const petSpot=picture(base,shadow,.897,.009,.235,.62,.52);petSpot.rotation.x=-Math.PI/2;
    const floor=picture(base,shadow,0,-.169,.09,3.85,2.77);floor.rotation.x=-Math.PI/2;
    const aura=new THREE.PointLight('#ffd383',0,2.4,1.55);scene.add(aura);
    runtime={renderer,scene,camera,base,deck,alloy,petSpot,aura};
  }catch{runtime=null;}
  return runtime;
}

function setView(active,view){
  if(activeView===view)return;
  activeView?.actor.root.removeFromParent();
  activeView=view;
  active.scene.add(view.actor.root);
}

function viewFor(canvas,kind,key,create){
  const existing=views.get(canvas);
  if(existing?.signature===key&&existing.kind===kind)return existing;
  if(existing)releaseStudioView(canvas);
  const next={signature:key,kind,actor:create(),camera:null};
  views.set(canvas,next);
  return next;
}

export function releaseStudioView(canvas){
  const state=views.get(canvas);
  if(!state)return;
  if(activeView===state)activeView=null;
  disposeFigure(state.actor.root);
  views.delete(canvas);
}

function cameraFor(camera,w,h,{x=0,y=1.48,height=3.51,zoom=1,anglePitch=.13}={}){
  const aspect=w/h;
  const half=height/2;
  camera.left=-half*aspect;
  camera.right=half*aspect;
  camera.top=half;
  camera.bottom=-half;
  camera.zoom=zoom;
  camera.position.set(x,y+anglePitch*6,6);
  camera.lookAt(x,y,0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

function draw(canvas,state,viewOptions,background,surfaceColor,platform=true){
  const active=initialize();
  if(!active)return false;
  const screen=canvas.getContext('2d');
  if(!screen)return false;
  const renderer=active.renderer;
  const hardware=Boolean(renderer&&!renderer.getContext().isContextLost());
  setView(active,state);
  active.scene.background=background;
  active.base.visible=platform;
  active.petSpot.visible=Boolean(state.actor.pet);
  active.deck.color.set(surfaceColor);
  active.alloy.color.copy(shade(surfaceColor,.77));
  const {width,height}=canvas;
  cameraFor(active.camera,width,height,viewOptions);
  if(hardware){
    if(renderer.domElement.width!==width||renderer.domElement.height!==height)renderer.setSize(width,height,false);
    renderer.render(active.scene,active.camera);
    screen.clearRect(0,0,width,height);
    screen.drawImage(renderer.domElement,0,0,width,height);
  }else renderSoftwareRoom(canvas,active.scene,active.camera);
  canvas.dataset.renderer='3d';
  canvas.dataset.backend=hardware?'webgl':'canvas';
  state.camera=viewOptions;
  return true;
}

function paletteFor(recipe,backdrop){
  const neutral=PALETTES[recipe.background]||PALETTES.lavender;
  if(!backdrop)return neutral;
  const motif=rewardPigment(backdrop);
  return [color(neutral[0]).lerp(color(motif),.63).getStyle(),
    color(neutral[1]).lerp(shade(motif,.74),.53).getStyle(),
    color(neutral[2]).lerp(shade(motif,.45),.48).getStyle()];
}

function handleMotion(actor,t,motion,light){
  const progress=motion?.progress??0;
  const swing=motion?Math.sin(progress*Math.PI):0;
  const prize=motion&&Object.values(actor.cosmetics).find(item=>item.id===motion.id);
  const towardFace=prize&&['hat','eyewear','hair','eyes'].includes(prize.slot);
  actor.head.rotation.y=(t?Math.sin(t*.51)*.055:0)+(towardFace?swing*.16:0);
  if(actor.hat)actor.hat.rotation.z=prize?.slot==='hat'?Math.sin(progress*5)*.12:0;
  actor.figure.rotation.z=actor.cosmetics.outerwear?.id===motion?.id&&motion?.id==='phantom-cloak'?
    .025*Math.sin(progress*7):0;
  poseCompanion(actor.pet,t,motion?.id===actor.pet?.item.id?motion:null);
  if(actor.aura){
    actor.aura.root.rotation.y=t*.73+progress*3.9;
    actor.aura.root.scale.setScalar(1+swing*.27);
    for(const p of actor.aura.points)p.rotation.set(t*.94+progress*4,.5,progress*2.6);
  }
  light.intensity=0;
  if(prize&&prize.slot!=='companion'){
    if(!actor.spark){
      const root=group(actor.root);
      const paint=new THREE.MeshBasicMaterial({color:'#e8ce9e',transparent:true,opacity:0,depthWrite:false});
      const sparks=Array.from({length:9},()=>attach(root,new THREE.OctahedronGeometry(.027),paint));
      actor.spark={root,paint,sparks};
    }
    const {root,paint,sparks}=actor.spark;
    root.visible=progress>0;
    root.position.set(0,(towardFace?2.55:1.39)*actor.figure.scale.y,.21);
    const flare=rewardPigment(prize);
    paint.color.copy(shade(flare,1.63));
    paint.opacity=.65*swing;
    for(const [i,part] of sparks.entries()){
      const ring=i/sparks.length*2*Math.PI+progress*2.1;
      const spread=(towardFace?.35:.63)+progress*.16;
      part.position.set(Math.sin(ring)*spread,Math.cos(ring)*spread*.81,.06+Math.sin(i)*.11);
      part.rotation.set(progress*1.4,i*.39,progress*2.45);
    }
    if(!['prop','offhand'].includes(prize.slot)){
      light.position.set(0,(towardFace?2.62:1.58)*actor.figure.scale.y,.70);
      light.color.set(flare);light.intensity=swing*3.4;
    }
  }else if(actor.spark)actor.spark.root.visible=false;
  for(const prop of actor.props){
    const triggered=motion?.id===prop.item.id&&Boolean(motion);
    prop.shape.rotation.y=triggered?Math.sin(progress*Math.PI*2)*.82:0;
    prop.shape.rotation.z=triggered?Math.sin(progress*8)*.23:0;
    if(prop.trail){
      prop.trail.visible=triggered&&swing>0;
      prop.trail.material.opacity=swing*.54;
      prop.trail.rotation.z=progress*.90;
    }
    if(prop.glow){
      prop.glow.emissiveIntensity=triggered?.55+swing*2.7:.41;
      if(prop.item.id.includes('lantern')){
        const point=prop.root.getWorldPosition(new THREE.Vector3());
        light.position.copy(point).add(new THREE.Vector3(0,-.23,.12));
        light.intensity=triggered?4.3+swing*9.2:1.26;
        light.color.set('#ffbf65');
      }
    }
  }
}

export function paintRoomAvatar(canvas,value,view={},time=0,motion=null,frame='body'){
  const active=initialize();
  if(!active)return false;
  const recipe=normalizeLoadout(value);
  const signature=JSON.stringify(recipe);
  const state=viewFor(canvas,'avatar',signature,()=>buildAvatar(recipe));
  const actor=state.actor;
  actor.root.rotation.y=-(view.angle||0)*Math.PI/180;
  actor.root.updateMatrixWorld(true);
  const cameraZoom=view.zoom||1;
  const aspect=canvas.width/canvas.height;
  const bodyHeight=Math.max(3.54,actor.figure.scale.y*3.49,2.02/aspect);
  const scale=actor.figure.scale.y;
  const full={x:(actor.pet?.root.position.x||0)*.14-(view.x||0)/145,
    y:1.47*scale+(view.y||0)/160,height:bodyHeight,zoom:cameraZoom};
  const crop={x:.015,y:(actor.hat?2.47:2.34)*scale,height:(actor.hat?1.12:.92)*scale,anglePitch:.018};
  if(view.zoom>=2.3&&view.y>=158)full.y=2.41*scale;
  handleMotion(actor,time,motion,active.aura);
  const backgroundItem=actor.cosmetics.background;
  const palette=paletteFor(recipe,backgroundItem);
  return draw(canvas,state,frame==='portrait'?crop:full,clothBackground(palette,backgroundItem?.id),palette[1],frame!=='portrait');
}

export function paintRoomPet(canvas,item,view={},activity){
  const active=initialize();
  if(!active)return false;
  const state=viewFor(canvas,'companion',item.id,()=>buildCompanion(item));
  state.actor.root.rotation.y=-(view.angle??18)*Math.PI/180;
  poseCompanion(state.actor,activity?.progress||0,activity);
  active.aura.intensity=0;
  const main=rewardPigment(item);
  const palette=['#c8bbca','#8c8ca4','#565672'].map((hex,i)=>color(hex).lerp(color(main),.15+i*.08).getStyle());
  return draw(canvas,state,{x:-(view.x||0)/700,y:.320+(view.y||0)/600,
    height:Math.max(.922,.752/(canvas.width/canvas.height)),zoom:view.zoom||1,anglePitch:.049},
  clothBackground(palette,item.id),palette[1],false);
}

export function paintRoomPrize(canvas,item,activity=null){
  const active=initialize();
  if(!active)return false;
  if(item.slot==='companion')return paintRoomPet(canvas,item,{angle:18},activity&&{...activity,action:'trick'});
  if(item.slot==='prop'||item.slot==='offhand'){
    const state=viewFor(canvas,'gear',item.id,()=>{
      const root=group(null);
      const prop=heldItem(root,item);
      prop.root.position.set(0,0,0);
      return {root,prop};
    });
    state.actor.root.rotation.y=.30+Math.sin((activity?.progress||0)*8)*.52;
    state.actor.prop.shape.rotation.z=Math.sin((activity?.progress||0)*7)*.45;
    if(state.actor.prop.glow)state.actor.prop.glow.emissiveIntensity=activity?.progress>0?1.64:.6;
    const hue=rewardPigment(item);
    const palette=['#c0aebd','#7b7898','#56516d'].map(hex=>color(hex).lerp(color(hue),.29).getStyle());
    active.aura.intensity=0;
    return draw(canvas,state,{height:1.025,y:item.id.includes('lantern')?-.20:.19,anglePitch:.048},clothBackground(palette,item.id),palette[1],false);
  }
  const base=item.families?.includes('robot')?SHOWROOM_LOOKS.automaton:
    item.families?.includes('monster')?SHOWROOM_LOOKS.armor:SHOWROOM_LOOKS.detective;
  const full={...base.full_body};
  const portrait=['hair','hat','eyewear','eyes','bodypart'].includes(item.slot);
  const recipe={...base,hat:'none',glasses:'none',beard:'none',back:'none',
    full_body:{...full,back:item.slot==='back'?'pack':'none',outerwear:'none'},
    cosmetics:{[item.slot]:item.id}};
  const angle=item.slot==='back'?148:16;
  return paintRoomAvatar(canvas,recipe,{angle},0,activity?{id:item.id,...activity}:null,portrait?'portrait':'body');
}

export function paintRoomLook(canvas,id){
  return paintRoomAvatar(canvas,SHOWROOM_LOOKS[id],{angle:22},0,null,'portrait');
}

export function hitStudioAvatar(canvas,x,y){
  const state=views.get(canvas);
  if(state?.kind!=='avatar'||!state.camera)return null;
  const {actor}=state;
  const camera=new THREE.OrthographicCamera();
  cameraFor(camera,canvas.width,canvas.height,state.camera);
  actor.root.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(x*2-1,1-y*2),camera);
  const hit=ray.intersectObject(actor.root,true)[0];
  if(!hit)return null;
  for(let current=hit.object;current;current=current.parent){
    if(current.userData.studioPart)return current.userData.studioPart;
    if(current===actor.head)return 'face';
    if(current===actor.pet?.root)return 'pets';
    if(current===actor.figure)return 'clothes';
  }
  return null;
}
