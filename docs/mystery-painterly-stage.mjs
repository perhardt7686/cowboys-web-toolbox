/* Mystery Crew Painterly Art Pipeline V3
 * 19 separately cut and compressed, illustrated WebP layers packed as one
 * same-origin USTAR archive. The published app never embeds the source image.
 * Existing SVG actors, pets, van, colors and progression are retained as
 * fully functional fallback for non-matching poses and character choices.
 */
const SVG='http://www.w3.org/2000/svg';
const PACK='./mystery-painterly-assets.tar';
let urls=new Map(),loadPromise=null,nodes=null;
const allowed=/^(?:hero-(?:full|head|torso|legs|backpack|leftarm|rightarm)|hound|van-painted|workshop-painted|forest|outfit-(?:detective|explorer|viking|pilot|space|knight|outdoors|stealth))\.webp$/;
function headerText(bytes,at,size){
 return new TextDecoder().decode(bytes.subarray(at,at+size)).split('\0',1)[0];
}
export function unpackPainterlyTar(arrayBuffer){
 const bytes=new Uint8Array(arrayBuffer),found=new Map();
 if(bytes.length>2000000||bytes.length<1024)throw Error('Painterly asset archive size invalid');
 let off=0;
 while(off+512<=bytes.length){
  const name=headerText(bytes,off,100);
  if(!name)break;
  const sizeStr=headerText(bytes,off+124,12).trim();
  const size=Number.parseInt(sizeStr,8);
  if(!allowed.test(name)||!Number.isFinite(size)||size<100||size>120000||found.has(name))throw Error('Invalid painted asset in archive');
  const start=off+512,end=start+size;
  if(end>bytes.length)throw Error('Incomplete painted asset');
  found.set(name,new Uint8Array(bytes.slice(start,end)));
  off=start+Math.ceil(size/512)*512;
  if(found.size>24)throw Error('Too many painted assets');
 }
 for(const name of ['hero-head.webp','hero-torso.webp','hero-legs.webp','hero-leftarm.webp','hero-rightarm.webp','hero-backpack.webp','hound.webp','van-painted.webp','workshop-painted.webp','outfit-detective.webp'])
  if(!found.has(name))throw Error('Required painterly layer unavailable: '+name);
 return found;
}
function image(name,x,y,width,height,cls=''){
 const e=document.createElementNS(SVG,'image');
 e.setAttribute('x',String(x));e.setAttribute('y',String(y));
 e.setAttribute('width',String(width));e.setAttribute('height',String(height));
 e.setAttribute('preserveAspectRatio','xMidYMid meet');
 e.setAttribute('href',urls.get(name));
 if(cls)e.setAttribute('class',cls);
 e.setAttribute('aria-hidden','true');
 e.setAttribute('pointer-events','none');
 return e;
}
function group(id,klass){
 const g=document.createElementNS(SVG,'g');
 g.id=id;if(klass)g.setAttribute('class',klass);
 g.setAttribute('aria-hidden','true');
 g.style.pointerEvents='none';
 return g;
}
function mountPaintedLayers(){
 const scene=document.getElementById('mc-scene');
 const barn=document.getElementById('mc-barn');
 const vehicle=document.getElementById('mc-vehicle');
 const actor=document.getElementById('mc-actor');
 const pet=document.getElementById('mc-pet');
 if(!scene||!barn||!vehicle||!actor||!pet)return false;
 const forest=group('mc-painted-forest','mc-painterly-atmosphere');
 forest.append(image('forest.webp',115,0,280,157));
 scene.insertBefore(forest,barn);
 const shop=group('mc-painted-workshop','mc-painterly-atmosphere');
 shop.append(image('workshop-painted.webp',763,4,195,431));
 barn.append(shop);
 const van=group('mc-painted-van','mc-painterly-van');
 van.append(image('van-painted.webp',54,54,686,385));
 vehicle.append(van);
 const hero=group('mc-painted-hero','mc-painterly-hero');
 const order=['legs','backpack','torso','leftarm','rightarm','head'];
 for(const part of order){
  const layer=group('mc-painted-'+part,'mc-painterly-part');
  layer.dataset.part=part;
  layer.append(image('hero-'+part+'.webp',208,10,390,520));
  hero.append(layer);
 }
 // Paint AFTER the animated fallback character so selective visibility
 // changes do not disturb its transform, equip overlays or saved state.
 actor.parentNode.insertBefore(hero,actor.nextSibling);
 const dog=group('mc-painted-hound','mc-painterly-hound');
 dog.append(image('hound.webp',527,245,205,276));
 pet.parentNode.insertBefore(dog,pet.nextSibling);
 nodes={hero,dog,van,actor,pet,scene};
 scene.dataset.painterly='ready';
 return true;
}
export async function loadPainterlyPack(onReady){
 if(loadPromise)return loadPromise;
 loadPromise=(async()=>{
  const response=await fetch(new URL(PACK,import.meta.url),{cache:'force-cache'});
  if(!response.ok)throw Error('Painterly art HTTP '+response.status);
  const payload=unpackPainterlyTar(await response.arrayBuffer());
  for(const [name,bytes] of payload)urls.set(name,URL.createObjectURL(new Blob([bytes],{type:'image/webp'})));
  if(!mountPaintedLayers())throw Error('Creator art stage unavailable');
  if(typeof onReady==='function')onReady();
  return true;
 })().catch(error=>{
  document.getElementById('mc-scene')?.setAttribute('data-painterly','fallback');
  // Don't stop character creation if a legacy browser cannot unpack WebP.
  console.warn('Painterly art fallback:',error.message);
  return false;
 });
 return loadPromise;
}
export function painterlyOutfitHTML(item){
 const src=urls.get('outfit-'+item+'.webp');
 if(!src)return null;
 return '<img class="mc-painted-outfit" src="'+src+'" alt="" loading="eager" decoding="async">';
}
export function syncPainterlyStage(member,options={}){
 if(!nodes)return false;
 const {hero,dog,van,actor,pet,scene}=nodes;
 // Only replace the actual approved illustrated anchor. Every other outfit,
 // skin tone, face, hair and body view continues to use live SVG customization
 // rather than showing the wrong person's painted face.
 const anchor=member.faceShape==='oval'&&member.hairStyle==='tousled'&&
  member.eyeShape==='bright'&&member.expression==='smile'&&member.detail==='none'&&
  member.skin==='#f0b989'&&member.hair==='#904b28'&&
  member.outfit==='detective'&&member.shirt==='#ef792f'&&member.pants==='#315b93'&&
  member.hat==='none'&&member.gear==='none'&&options.angle===0;
 hero.style.display=anchor?'':'none';
 actor.style.opacity=anchor?'0':'1';
 const petPainted=member.pet==='dog';
 dog.style.display=petPainted?'':'none';
 pet.style.opacity=petPainted?'0':'1';
 van.style.display=member.vehicle==='van'?'':'none';
 const zoom=Math.min(1.5,Math.max(.8,Number(options.zoom)||1));
 hero.setAttribute('transform','translate(399 270) scale('+zoom+') translate(-399 -270)');
 dog.setAttribute('transform','translate(626 375) scale('+zoom+') translate(-626 -375)');
 hero.dataset.motion=String(options.motion||'idle');
 dog.dataset.motion=String(options.motion||'idle');
 scene.dataset.painterlyMode=anchor?'illustrated':'customized';
 return anchor;
}
export function disposePainterlyPack(){
 for(const url of urls.values())URL.revokeObjectURL(url);
 urls.clear();nodes=null;loadPromise=null;
}
