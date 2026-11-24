/* Scout V9 scene integration lab. Local-preview-only, never alters family state.
 * Uses authored 430x574 PNG frames. Never rotates or repaints V5 body layers.
 * This feature is intentionally not enabled on a public GitHub Pages hostname.
 */
import {paintedRecipe} from './mystery-crew-character-v5.mjs?v=crew6';

const SVG='http://www.w3.org/2000/svg';
const FRAMES=Object.freeze(Array.from({length:8},(_,i)=>
 'scout-v9-frame-'+String(i+1).padStart(2,'0')+'.png'));
const EXPLORER_FRAMES=Object.freeze(Array.from({length:8},(_,i)=>
 'scout-explorer-wave-'+String(i+1).padStart(2,'0')+'.png'));
const FRAME_MS=155;
let lab=null;

export function isScoutV9LocalPreview(locationInfo){
 if(!locationInfo||!['localhost','127.0.0.1'].includes(locationInfo.hostname))return false;
 const params=new URLSearchParams(locationInfo.search||'');
 return params.get('preview')==='1'&&params.get('artLab')==='scoutV9';
}
export function isScoutV9Supported(member,options={}){
 return options.motion==='wave'&&paintedRecipe(member,options)==='crew-0-detective.webp';
}
export function isScoutExplorerLabSupported(member,options={}){
 return options.motion==='wave'&&paintedRecipe(member,options)==='crew-0-explorer.webp';
}
function changeFrame(index){
 if(!lab)return;
 const i=((index%8)+8)%8;
 if(lab.index===i)return;
 lab.index=i;
 lab.image.setAttribute('href',lab.urls[i]);
 lab.image.dataset.v9Frame=String(i);
}
function stop(){
 if(!lab)return;
 if(lab.raf!=null)cancelAnimationFrame(lab.raf);
 lab.raf=null;lab.last=null;
}
function tick(now){
 if(!lab||!lab.active||document.hidden)return;
 if(lab.last==null)lab.last=now;
 if(now-lab.last>=FRAME_MS){
  const steps=Math.max(1,Math.floor((now-lab.last)/FRAME_MS));
  lab.last+=steps*FRAME_MS;
  changeFrame((lab.index+steps)%8);
 }
 lab.raf=requestAnimationFrame(tick);
}
function start(){
 if(!lab||lab.raf!=null||document.hidden)return;
 lab.last=null;lab.raf=requestAnimationFrame(tick);
}
function activate(active){
 if(!lab)return;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!active){
  stop();lab.active=false;lab.image.style.display='none';
  lab.rig.style.display='';
  lab.scene.dataset.v9Wave='inactive';
  return;
 }
 lab.active=true;
 lab.rig.style.display='none';lab.image.style.display='';
 lab.scene.dataset.v9Wave=reduce?'reduced':'active';
 if(reduce){stop();changeFrame(4);}
 else if(lab.raf==null){changeFrame(0);start();}
}
export async function mountScoutV9SceneLab(){
 if(typeof window==='undefined'||!isScoutV9LocalPreview(window.location))return false;
 if(lab)return true;
 const scene=document.getElementById('mc-scene');
 const actor=document.getElementById('mc-v5-illustrated-actor');
 const rig=actor?.querySelector('#mc-v6-painted-rig');
 if(!scene||!actor||!rig)return false;
 const urls=FRAMES.map(file=>new URL('./mystery-crew-v9-scout/'+file,import.meta.url).href);
 try{
  await Promise.all(urls.map(async source=>{
   const picture=new Image();picture.src=source;await picture.decode();
   if(picture.naturalWidth!==430||picture.naturalHeight!==574)
    throw Error('V9 painted frame has an unexpected size');
  }));
 }catch(error){
  scene.dataset.v9Lab='fallback';
  console.warn('Scout V9 art lab disabled; V5/V6 painting still works:',error?.message||String(error));
  return false;
 }
 // The second costume remains an optional lab asset. If absent or broken, the
 // Explorer outfit falls back to the existing painted V6 renderer.
 const possibleExplorer=EXPLORER_FRAMES.map(file=>new URL('./mystery-crew-v9-scout-explorer/'+file,import.meta.url).href);
 let explorerUrls=null;
 try{
  await Promise.all(possibleExplorer.map(async source=>{
   const picture=new Image();picture.src=source;await picture.decode();
   if(picture.naturalWidth!==430||picture.naturalHeight!==574)throw Error('Explorer art dimension mismatch');
  }));
  explorerUrls=possibleExplorer;
 }catch{scene.dataset.v9Explorer='fallback';}
 const image=document.createElementNS(SVG,'image');
 image.id='mc-v9-scout-wave-image';image.setAttribute('x','208');image.setAttribute('y','10');
 image.setAttribute('width','390');image.setAttribute('height','520');
 image.setAttribute('preserveAspectRatio','xMidYMid meet');
 image.setAttribute('aria-hidden','true');image.style.pointerEvents='none';
 image.style.display='none';image.setAttribute('href',urls[0]);image.dataset.v9Frame='0';
 actor.append(image);
 lab={scene,actor,rig,image,urls,originalUrls:urls,explorerUrls,profile:null,index:0,last:null,raf:null,active:false};
 scene.dataset.v9Explorer=explorerUrls?'ready':'fallback';
 scene.dataset.v9Lab='ready';scene.dataset.v9Wave='inactive';
 document.addEventListener('visibilitychange',()=>{
  if(!lab)return;
  if(document.hidden)stop();
  else if(lab.active&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)start();
 });
 return true;
}
export function syncScoutV9SceneLab(member,options={}){
 if(!lab)return false;
 const eligible=lab.actor.style.display!=='none';
 const profile=eligible&&isScoutV9Supported(member,options)?'detective':
  eligible&&lab.explorerUrls&&isScoutExplorerLabSupported(member,options)?'explorer':null;
 if(profile!==lab.profile){
  stop();lab.profile=profile;
  lab.urls=profile==='explorer'?lab.explorerUrls:lab.originalUrls;
  lab.index=-1;
  if(profile)changeFrame(0);
 }
 activate(Boolean(profile));
 lab.scene.dataset.v9Costume=profile||'none';
 return Boolean(profile);
}
export const SCOUT_V9_FRAMES=FRAMES;
export const SCOUT_EXPLORER_LAB_FRAMES=EXPLORER_FRAMES;
