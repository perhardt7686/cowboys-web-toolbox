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
 // The forest source is a small cutout. Soften its edge rather than
 // showing a sharp rectangular picture pasted over the vector woodland.
 forest.style.opacity='.28';
 forest.append(image('forest.webp',115,0,280,157));
 scene.insertBefore(forest,barn);
 const shop=group('mc-painted-workshop','mc-painterly-atmosphere');
 shop.append(image('workshop-painted.webp',763,4,195,431));
 barn.append(shop);
 // Keep the original SVG van in a named layer for alternative vehicles.
 // The painterly cutout is larger than that original SVG van and contains
 // intentional transparent holes where characters used to overlap it.
 // Showing both unscaled vans caused an obvious second cartoon van.
 const vectorVan=group('mc-vector-van','mc-vector-van');
 for(const child of [...vehicle.childNodes])vectorVan.append(child);
 vehicle.append(vectorVan);
 const vanBacking=group('mc-painted-van-backing','mc-painterly-van-backing');
 vanBacking.innerHTML='<path d="M67 289Q65 217 144 174L594 160Q677 161 704 242L718 407Q705 442 658 445H108Q60 437 61 408Z" fill="#347f9f" stroke="#284759" stroke-width="7"/>'+
 '<path d="M90 280L152 184Q181 159 250 159L590 159Q654 166 680 237L684 282Z" fill="#e4dec5" stroke="#38576b" stroke-width="6"/>'+
 '<path d="M95 310H706" stroke="#ec8e43" stroke-width="21"/>'+
 '<path d="M116 359H713" stroke="#e5a16b" stroke-width="7"/>';
 vehicle.append(vanBacking);
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
 nodes={hero,dog,van,vanBacking,vectorVan,actor,pet,scene};
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
  // A syntactically valid WebP is not proof that the browser rendered it.
  // Decode all layers BEFORE hiding a live SVG character or displaying the
  // painterly stage. This also catches image CSP restrictions and Safari gaps.
  await Promise.all([...urls].map(async ([name,url])=>{
   const element=new Image();
   element.src=url;
   await element.decode();
   if(!element.naturalWidth||!element.naturalHeight)throw Error('Image could not render: '+name);
  }));
  if(!mountPaintedLayers())throw Error('Creator art stage unavailable');
  if(typeof onReady==='function')onReady();
  return true;
 })().catch(error=>{
  document.getElementById('mc-scene')?.setAttribute('data-painterly','fallback');
  // Restore the known working vector art if a browser cannot decode WebP.
  // Never leave blank or broken image placeholders covering the character.
  for(const url of urls.values())URL.revokeObjectURL(url);
  urls.clear();
  document.getElementById('mc-actor')?.style.setProperty('opacity','1');
  document.getElementById('mc-pet')?.style.setProperty('opacity','1');
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
 const {hero,dog,van,vanBacking,vectorVan,actor,pet,scene}=nodes;
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
 const paintedVan=member.vehicle==='van';
 van.style.display=paintedVan?'':'none';
 // Reuse the complete window/roof/wheel detailing as an underpainting.
 // Its geometry is registered to the illustrated cutout so that the
 // painted foreground and its transparent gaps form ONE continuous van.
 // The flat backing panel is never displayed.
 vanBacking.style.display='none';
 vectorVan.style.display='';
 vectorVan.setAttribute('transform',paintedVan?'translate(-60 -155) scale(1.55 1.34)':'');
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
