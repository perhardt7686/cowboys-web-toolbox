/* Mystery Crew V5: six illustrated people, eight on-character outfits each.
 * Display-only recipes; family state, unlocks, and IDs remain server-owned.
 */
import {illustratedAnchor,CREW_PALETTES,OUTFIT_COLORS} from './mystery-crew-model.mjs?v=unified2';
import {recolorCrewPixels} from './mystery-crew-paint.mjs?v=unified2';
import {mountPaintedRig,setPaintedRigMotion,setPaintedRigSprite,PAINTED_MOTIONS} from './mystery-crew-motion-v6.mjs';
const SVG='http://www.w3.org/2000/svg',PACK='./mystery-crew-v5-illustrated.tar';
const OUTFITS=Object.freeze(['detective','explorer','viking','pilot','space','knight','outdoors','stealth']);
const COLORS=Object.freeze({
 detective:'#ef792f',explorer:'#6c9354',viking:'#9d7859',pilot:'#855b39',
 space:'#ece9df',knight:'#8da9b7',outdoors:'#b54037',stealth:'#303d49'
});
const NAMES=Object.freeze(Array.from({length:6},(_,i)=>OUTFITS.map(o=>'crew-'+i+'-'+o+'.webp')).flat());
const decoder=new TextDecoder();
let urls=new Map(),ready=false,loading=null,visual=null,assetPromise=null,request=0;
const pictures=new Map(),tinted=new Map(),portraits=new Map();
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
export const paintedAnchor=illustratedAnchor;
export function paintedRecipe(m,opt={}){
 return 'crew-'+paintedAnchor(m)+'-'+(OUTFITS.includes(m?.outfit)?m.outfit:'detective')+'.webp';
}
async function validImage(url){
 const image=new Image();image.src=url;await image.decode();
 if(!image.naturalWidth||!image.naturalHeight)throw Error('Character image failed to decode');
 return image;
}
export async function loadCrewIllustrations(){
 if(assetPromise)return assetPromise;
 assetPromise=(async()=>{
  const response=await fetch(new URL(PACK,import.meta.url),{cache:'force-cache'});
  if(!response.ok)throw Error('Illustrated crew HTTP '+response.status);
  const data=unpackCrewV5(await response.arrayBuffer());
  for(const [name,bytes] of data)urls.set(name,URL.createObjectURL(new Blob([bytes],{type:'image/webp'})));
  await validImage(urls.get('crew-0-detective.webp'));return true;
 })().catch(error=>{assetPromise=null;throw error;});
 return assetPromise;
}
function signature(member={}){
 return JSON.stringify([paintedRecipe(member),...['skin','hair','shirt','pants'].map(k=>/^#[\da-f]{6}$/i.test(member[k]||'')?member[k]:'')]);
}
async function renderedSprite(member={}){
 await loadCrewIllustrations();
 const recipe=paintedRecipe(member),key=signature(member);
 if(tinted.has(key))return tinted.get(key);
 const work=(async()=>{
  let image=pictures.get(recipe);
  if(!image){image=await validImage(urls.get(recipe));pictures.set(recipe,image);}
  const index=paintedAnchor(member),base={...CREW_PALETTES[index],shirt:OUTFIT_COLORS[member.outfit]||COLORS.detective,pants:'#315b93'};
  if(['skin','hair','shirt','pants'].every(k=>!/^#[\da-f]{6}$/i.test(member[k]||'')||member[k].toLowerCase()===base[k].toLowerCase()))return urls.get(recipe);
  const canvas=document.createElement('canvas');canvas.width=430;canvas.height=574;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,430,574);recolorCrewPixels(pixels.data,430,574,member,base);context.putImageData(pixels,0,0);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw Error('Painted colors could not render');
  return URL.createObjectURL(blob);
 })();
 tinted.set(key,work);return work;
}
export function peekCrewPortrait(member={}){return portraits.get(signature(member))||null;}
export async function paintedPortraitURL(member={}){
 const key=signature(member);if(portraits.has(key))return portraits.get(key);
 const source=await renderedSprite(member),image=await validImage(source);
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
 const context=canvas.getContext('2d');context.fillStyle='#8ac7dd';context.fillRect(0,0,128,128);
 context.drawImage(image,90,0,250,225,0,0,128,128);
 const url=canvas.toDataURL('image/png');portraits.set(key,url);return url;
}
export async function loadCrewV5(){
 if(loading)return loading;
 loading=(async()=>{
  await loadCrewIllustrations();
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
  document.getElementById('mc-scene')?.setAttribute('data-crew-art-pack','unavailable');
  console.warn('Crew illustrations unavailable:',error?.message||String(error));return false;
 });
 return loading;
}
export function syncCrewV5(member,options={}){
 if(!ready||!visual)return false;
 const scene=document.getElementById('mc-scene'),token=++request;
 visual.style.display='';visual.dataset.loading='true';
 const anchor=paintedAnchor(member),outfit=OUTFITS.includes(member.outfit)?member.outfit:'detective';
 visual.dataset.anchor=String(anchor);visual.dataset.outfit=outfit;
 visual.dataset.angle=String(options.angle||0);
 setPaintedRigMotion(visual,options.motion);
 const actor=document.getElementById('mc-actor');if(actor)actor.style.display='none';
 const zoom=Math.max(.8,Math.min(1.5,Number(options.zoom)||1)),angle=Math.max(-30,Math.min(30,Number(options.angle)||0));
 visual.setAttribute('transform','translate(399 270) scale('+(zoom*Math.cos(angle*Math.PI/180))+' '+zoom+') translate(-399 -270)');
 const rig=visual.querySelector('#mc-v6-painted-rig');
 let equipment=rig.querySelector('#mc-illustrated-equipment');
 if(!equipment){equipment=document.createElementNS(SVG,'g');equipment.id='mc-illustrated-equipment';rig.append(equipment);}
 equipment.innerHTML=paintedEquipmentMarkup(member);
 void renderedSprite(member).then(url=>{
  if(token!==request||!visual)return;
  if(!setPaintedRigSprite(visual,url))throw Error('Painted character could not display');
  visual.dataset.loading='false';if(scene)scene.dataset.crewArt='painted';
 }).catch(error=>{if(token===request&&scene){scene.dataset.crewArtPack='unavailable';console.warn(error.message);}});
 return true;
}
export function paintedEquipmentMarkup(member={}){
 const hat={
  fedora:'<path d="M135 70L150 25Q211 1 270 27L285 70Z" fill="#a77a48"/><path d="M144 52Q209 70 277 51L283 72Q210 92 139 71Z" fill="#533e32"/><path d="M116 74Q209 108 303 74Q285 112 128 97Z" fill="#c39b60"/>',
  helmet:'<path d="M137 74Q140 9 213 12Q279 12 287 77Z" fill="#a1aba8"/><path d="M143 43Q111 40 109 3Q127 23 155 22M271 23Q302 25 320 3Q323 40 283 49" fill="#e8d8aa"/><path d="M213 14V80" stroke="#e4d2a8" stroke-width="9"/>',
  goggles:'<path d="M142 61Q157 15 213 17Q268 18 287 64Z" fill="#805733"/><path d="M139 49H287" stroke="#413b39" stroke-width="16"/><ellipse cx="183" cy="50" rx="26" ry="20" fill="#86c7d7"/><ellipse cx="244" cy="50" rx="26" ry="20" fill="#86c7d7"/>',
  cap:'<path d="M140 72Q145 7 214 11Q278 12 286 73Z" fill="#2c8b9c"/><path d="M211 69Q281 53 314 78Q295 99 225 89Z" fill="#216b80"/>'
 }[member.hat]||'';
 const gear={
  binoculars:'<path d="M187 187L207 238 237 186" fill="none" stroke="#e6c48b" stroke-width="5"/><path d="M183 237L201 233 207 265 187 270Z M219 233L238 238 235 269 214 262Z" fill="#385365"/><path d="M201 245H218" stroke-width="9"/>',
  flashlight:'<g transform="translate(285 270) rotate(-28)"><path d="M-10 -2H11V60H-10Z" fill="#d6a34d"/><path d="M-17 -14H18V6H-17Z" fill="#426177"/><path d="M-13 -15H14" stroke="#fff1b4" stroke-width="7"/></g>',
  compass:'<path d="M189 187Q209 240 239 187" fill="none" stroke="#e3c493" stroke-width="4"/><circle cx="215" cy="241" r="18" fill="#edcc76"/><circle cx="215" cy="241" r="11" fill="#f9f1d7"/><path d="M215 231L222 246 211 241Z" fill="#b1493d"/>',
  pack:'<path d="M115 193Q98 174 88 199L91 298Q108 314 124 298Z" fill="#9c764b"/><path d="M99 216H117V245H99Z" fill="#c3a271"/>'
 }[member.gear]||'';
 return '<g class="mc-current-hat" stroke="#302c35" stroke-width="4" stroke-linejoin="round">'+hat+'</g><g class="mc-current-gear" stroke="#302c35" stroke-width="3" stroke-linejoin="round">'+gear+'</g>';
}
export function paintedOutfitRecipe(member,outfit){
 const anchor=paintedAnchor(member);
 return OUTFITS.includes(outfit)?'crew-'+anchor+'-'+outfit+'.webp':null;
}
export function paintedCrewOutfitHTML(member,outfit){
 if(!ready)return null;
 const src=urls.get(paintedOutfitRecipe(member,outfit));
 return src?'<img class="mc-painted-outfit" data-crew-costume="'+outfit+'" src="'+src+'" alt="" loading="eager" decoding="async">':null;
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
