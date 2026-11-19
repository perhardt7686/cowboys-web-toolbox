/* Mystery Crew V4: two independently authored, complete illustration assets.
 * V3 character/dog/body animation and existing account state are unchanged.
 * V4 is mounted only after BOTH images decode successfully. If not, the
 * published V3 artwork remains visible and interactive. */
const SVG='http://www.w3.org/2000/svg';
const ASSET={
 landscape:new URL('./mystery-workshop-v4.webp',import.meta.url).href,
 van:new URL('./mystery-van-v4.svg',import.meta.url).href
};
let mounted=false;
function svgImage(id,url,{x=0,y=0,width,height,fit='xMidYMid meet'}){
 const element=document.createElementNS(SVG,'image');
 element.setAttribute('id',id);
 element.setAttribute('x',String(x));
 element.setAttribute('y',String(y));
 element.setAttribute('width',String(width));
 element.setAttribute('height',String(height));
 element.setAttribute('preserveAspectRatio',fit);
 element.setAttribute('href',url);
 element.setAttribute('aria-hidden','true');
 element.setAttribute('pointer-events','none');
 return element;
}
async function decodedAsset(url){
 const image=new Image();
 image.src=url;
 await image.decode();
 if(!image.naturalWidth||!image.naturalHeight)throw Error('V4 illustration did not decode');
 return true;
}
export async function mountSceneV4(){
 if(mounted)return true;
 const scene=document.getElementById('mc-scene');
 const vehicle=document.getElementById('mc-vehicle');
 if(!scene||!vehicle)return false;
 try{
  await Promise.all(Object.values(ASSET).map(decodedAsset));
  // Snapshot only the STATIC V3 scenery before the van, never any actor,
  // dog, paint-layer, UI control or accessibility label.
  const background=[];
  for(let child=scene.firstElementChild; child&&child!==vehicle;child=child.nextElementSibling){
   if(child.tagName.toLowerCase()==='defs')continue;
   background.push(child);
  }
  const landscape=svgImage('mc-v4-seamless-workshop',ASSET.landscape,
   {width:960,height:620,fit:'none'});
  scene.insertBefore(landscape,vehicle);
  const van=svgImage('mc-v4-complete-van',ASSET.van,
   {x:36,y:42,width:605,height:382});
  vehicle.append(van);
  for(const child of background)child.style.display='none';
  scene.dataset.sceneVersion='4';
  mounted=true;
  return true;
 }catch(error){
  console.warn('V4 painted scene unavailable, retaining V3 scene:',error.message);
  scene.dataset.sceneVersion='3-fallback';
  return false;
 }
}
export function syncSceneV4(member){
 if(!mounted)return false;
 const scene=document.getElementById('mc-scene');
 const van=document.getElementById('mc-v4-complete-van');
 if(!scene||!van)return false;
 const isVan=member?.vehicle==='van';
 scene.dataset.v4Vehicle=isVan?'van':'other';
 van.style.display=isVan?'':'none';
 return true;
}
export function v4AssetUrls(){return {...ASSET};}
