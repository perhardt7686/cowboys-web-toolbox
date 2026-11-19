/* V6: clipped articulated layers of the actual V5 painted sprites.
 * Display only; never touches accounts, coins, unlocks or user-owned data.
 * This is a first-pass puppet rig, not separately painted limb artwork. */
const NS='http://www.w3.org/2000/svg';
export const PAINTED_MOTIONS=Object.freeze(['idle','wave','cheer','think','run','action']);
export const PAINTED_PARTS=Object.freeze([
 {id:'leg-left',shape:'M75 325H218V574H0V408H75Z'},
 {id:'leg-right',shape:'M213 325H354V408H430V574H213Z'},
 {id:'torso',shape:'M135 164H294L319 362H111Z'},
 {id:'arm-left',shape:'M0 163H163L157 335L183 409H0Z'},
 {id:'arm-right',shape:'M270 163H430V409H245L275 335Z'},
 {id:'head',shape:'M0 0H430V185H0Z'},
 {id:'hair',shape:'M0 0H430V83H0Z'}
]);
const element=name=>document.createElementNS(NS,name);
export function mountPaintedRig(container){
 if(container.querySelector('#mc-v6-painted-rig'))throw Error('Painted rig already mounted');
 const stage=element('svg');stage.id='mc-v6-painted-rig';
 for(const [key,val] of Object.entries({x:'208',y:'10',width:'390',height:'520',viewBox:'0 0 430 574',preserveAspectRatio:'xMidYMid meet',overflow:'visible'}))stage.setAttribute(key,val);
 stage.setAttribute('aria-hidden','true');
 const defs=element('defs');
 for(const part of PAINTED_PARTS){
  const cut=element('clipPath');cut.id='mc-v6-cut-'+part.id;cut.setAttribute('clipPathUnits','userSpaceOnUse');
  const shape=element('path');shape.setAttribute('d',part.shape);cut.append(shape);defs.append(cut);
 }
 stage.append(defs);
 for(const part of PAINTED_PARTS){
  const layer=element('g');layer.dataset.v6Part=part.id;
  layer.setAttribute('clip-path','url(#mc-v6-cut-'+part.id+')');
  const img=element('image');if(part.id==='torso')img.id='mc-v5-illustrated-image';
  for(const [key,val] of Object.entries({x:'0',y:'0',width:'430',height:'574',preserveAspectRatio:'xMidYMid meet'}))img.setAttribute(key,val);
  img.setAttribute('aria-hidden','true');layer.append(img);stage.append(layer);
 }
 container.append(stage);return stage.querySelector('#mc-v5-illustrated-image');
}
export function setPaintedRigMotion(container,motion){
 const active=PAINTED_MOTIONS.includes(motion)?motion:'idle';
 container.dataset.motion=active;return active;
}
export function setPaintedRigSprite(container,url){
 if(typeof url!=='string'||!url.startsWith('blob:'))return false;
 const layers=container.querySelectorAll('#mc-v6-painted-rig [data-v6-part] image');
 if(layers.length!==PAINTED_PARTS.length)return false;
 for(const image of layers)if(image.getAttribute('href')!==url)image.setAttribute('href',url);
 return true;
}
