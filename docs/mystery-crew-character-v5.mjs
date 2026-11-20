/* Mystery Crew V5: six illustrated people, eight on-character outfits each.
 * Display-only recipes; family state, unlocks, and IDs remain server-owned.
 */
import {CREW_ANCHORS} from './mystery-crew-art.mjs?v=paint2';
import {mountPaintedRig,setPaintedRigMotion,setPaintedRigSprite,PAINTED_MOTIONS} from './mystery-crew-motion-v6.mjs';
const SVG='http://www.w3.org/2000/svg',PACK='./mystery-crew-v5-illustrated.tar';
const OUTFITS=Object.freeze(['detective','explorer','viking','pilot','space','knight','outdoors','stealth']);
const COLORS=Object.freeze({
 detective:'#ef792f',explorer:'#6c9354',viking:'#9d7859',pilot:'#855b39',
 space:'#ece9df',knight:'#8da9b7',outdoors:'#b54037',stealth:'#303d49'
});
const ANCHOR_COLORS=Object.freeze([
 {hair:['#904b28'],skin:['#f0b989']},
 {hair:['#b8432a'],skin:['#c98760','#f4c8a9']},
 {hair:['#e0b447'],skin:['#ab6948','#f7cfa8']},
 {hair:['#302b46'],skin:['#6e432e','#ebbe99']},
 {hair:['#6b4531','#5c3424'],skin:['#f6d2ae','#d69a77']},
 {hair:['#36243b','#342e32'],skin:['#d9a27b','#bb8767']}
]);
const NAMES=Object.freeze(Array.from({length:6},(_,i)=>OUTFITS.map(o=>'crew-'+i+'-'+o+'.webp')).flat());
const decoder=new TextDecoder();
let urls=new Map(),ready=false,loading=null,visual=null;
const field=(bytes,p,len)=>decoder.decode(bytes.subarray(p,p+len)).split('\0')[0];
export function unpackCrewV5(buffer){
 const bytes=new Uint8Array(buffer),found=new Map();
 if(bytes.length<1024||bytes.length>4500000)throw Error('Illustrated crew pack size invalid');
 let p=0;
 while(p+512<=bytes.length){
  const name=field(bytes,p,100);
  if(!name)break;
  const oct=field(bytes,p+124,12).trim();
  if(!/^[0-7]+$/.test(oct))throw Error('Invalid character archive header');
  const n=parseInt(oct,8),start=p+512,end=start+n;
  if(!NAMES.includes(name)||found.has(name)||n<250||n>140000||end>bytes.length)
   throw Error('Invalid illustrated character');
  found.set(name,bytes.slice(start,end));
  p=start+512*Math.ceil(n/512);
  if(found.size>48)throw Error('Unexpected illustrated character count');
 }
 if(found.size!==48||NAMES.some(x=>!found.has(x)))throw Error('Missing character/outfit image');
 return found;
}
export function paintedAnchor(m){
 if(!m||typeof m!=='object')return -1;
 return CREW_ANCHORS.findIndex((a,i)=>
  Object.entries(a).every(([key,val])=>m[key]===val) &&
  ANCHOR_COLORS[i].hair.includes(m.hair)&&ANCHOR_COLORS[i].skin.includes(m.skin));
}
export function paintedRecipe(m,opt={}){
 const index=paintedAnchor(m);
 if(index<0||!OUTFITS.includes(m.outfit)||m.shirt!==COLORS[m.outfit]||
  (opt.motion&&!PAINTED_MOTIONS.includes(opt.motion))||
  m.hat!=='none'||m.gear!=='none'||(opt.angle||0)!==0)return null;
 return 'crew-'+index+'-'+m.outfit+'.webp';
}
async function validImage(url){
 const image=new Image();image.src=url;await image.decode();
 if(!image.naturalWidth||!image.naturalHeight)throw Error('Character image failed to decode');
}
export async function loadCrewV5(){
 if(loading)return loading;
 loading=(async()=>{
  const r=await fetch(new URL(PACK,import.meta.url),{cache:'force-cache'});
  if(!r.ok)throw Error('Illustrated crew HTTP '+r.status);
  const data=unpackCrewV5(await r.arrayBuffer());
  for(const [name,bytes] of data)
   urls.set(name,URL.createObjectURL(new Blob([bytes],{type:'image/webp'})));
  await validImage(urls.get('crew-0-detective.webp'));
  const actor=document.getElementById('mc-actor'),scene=document.getElementById('mc-scene');
  if(!actor||!actor.parentNode||!scene)throw Error('Creator stage missing');
  const group=document.createElementNS(SVG,'g');group.id='mc-v5-illustrated-actor';
  group.setAttribute('aria-hidden','true');group.style.pointerEvents='none';
  mountPaintedRig(group);
  actor.parentNode.insertBefore(group,actor.nextSibling);
  group.style.display='none';visual=group;ready=true;
  scene.dataset.crewArtPack='ready';return true;
 })().catch(error=>{
  for(const url of urls.values())URL.revokeObjectURL(url);
  urls.clear();ready=false;
  document.getElementById('mc-scene')?.setAttribute('data-crew-art-pack','fallback');
  console.warn('V5 art fallback:',error?.message||String(error));return false;
 });
 return loading;
}
export function syncCrewV5(member,options={}){
 if(!ready||!visual)return false;
 const recipe=paintedRecipe(member,options),scene=document.getElementById('mc-scene');
 visual.style.display=recipe?'':'none';
 if(!recipe){if(scene)scene.dataset.crewArt='legacy';return false;}
 const url=urls.get(recipe);
 if(!url||!setPaintedRigSprite(visual,url)){visual.style.display='none';return false;}
 setPaintedRigMotion(visual,options.motion);
 const original=document.getElementById('mc-painted-hero'),actor=document.getElementById('mc-actor');
 if(original)original.style.display='none';if(actor)actor.style.opacity='0';
 const zoom=Math.max(.8,Math.min(1.5,Number(options.zoom)||1));
 visual.setAttribute('transform','translate(399 270) scale('+zoom+') translate(-399 -270)');
 visual.dataset.anchor=String(paintedAnchor(member));
 visual.dataset.outfit=member.outfit;
 visual.dataset.motion=String(options.motion||'idle');
 if(scene)scene.dataset.crewArt='painted';
 return true;
}
export function paintedCrewPortraitHTML(member){
 if(!ready)return null;
 const anchor=paintedAnchor(member);
 if(anchor<0)return null;
 const url=urls.get('crew-'+anchor+'-detective.webp');
 if(!url)return null;
 // URL comes from the validated same-origin archive, never account input.
 // This is a clipped bust drawn from the EXACT same painted character sheet.
 return '<span class="mc-v5-portrait-art" style="background-image:url(&quot;'+url+'&quot;)" aria-hidden="true"></span>';
}
export function disposeCrewV5(){for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();ready=false;loading=null;visual?.remove();visual=null;}
export const V5_MANIFEST=Object.freeze({outfits:OUTFITS,variations:48,anchors:6});
