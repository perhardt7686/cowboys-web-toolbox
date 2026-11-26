/* The six current illustrated identities. Old saved traits choose the closest
 * current identity; no retired rendering engine is loaded or re-enabled. */
export const CREW_ANCHORS=Object.freeze([
 {faceShape:'oval',hairStyle:'tousled',eyeShape:'bright',expression:'smile',detail:'none'},
 {faceShape:'heart',hairStyle:'bob',eyeShape:'soft',expression:'smile',detail:'headband'},
 {faceShape:'round',hairStyle:'side-sweep',eyeShape:'bright',expression:'grin',detail:'none'},
 {faceShape:'narrow',hairStyle:'long',eyeShape:'almond',expression:'curious',detail:'glasses'},
 {faceShape:'broad',hairStyle:'crop',eyeShape:'keen',expression:'smile',detail:'none'},
 {faceShape:'square',hairStyle:'curls',eyeShape:'soft',expression:'determined',detail:'freckles'}
]);
export const CREW_PALETTES=Object.freeze([
 {skin:'#f0b989',hair:'#904b28'},{skin:'#f4c8a9',hair:'#b8432a'},
 {skin:'#f7cfa8',hair:'#e0b447'},{skin:'#ebbe99',hair:'#302b46'},
 {skin:'#d69a77',hair:'#5c3424'},{skin:'#bb8767',hair:'#342e32'}
]);
export const OUTFIT_COLORS=Object.freeze({detective:'#ef792f',explorer:'#6c9354',viking:'#9d7859',pilot:'#855b39',space:'#ece9df',knight:'#8da9b7',outdoors:'#b54037',stealth:'#303d49'});
export const BASIC_MYSTERY_CREW=Object.freeze({id:'crew-1',name:'Scout',...CREW_PALETTES[0],shirt:'#ef792f',pants:'#315b93',outfit:'detective',hat:'none',gear:'none',pet:'dog',vehicle:'van',scene:'sunlit',...CREW_ANCHORS[0]});
export function illustratedAnchor(raw={}){
 const member=raw&&typeof raw==='object'?raw:{};
 const weights={faceShape:12,hairStyle:8,detail:3,eyeShape:2,expression:1};
 let selected=0,score=-1;
 CREW_ANCHORS.forEach((anchor,index)=>{
  const next=Object.entries(weights).reduce((sum,[key,w])=>sum+(member[key]===anchor[key]?w:0),0);
  if(next>score){score=next;selected=index;}
 });
 return selected;
}
