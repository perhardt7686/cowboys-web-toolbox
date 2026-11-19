/* The only live family member portrait renderer: Mystery Crew Creator.
   Only allow the new creator's known palette values into SVG attributes.
   Even members who have never visited the creator get the same basic Scout. */
const skins=new Set(['#f0b989','#c98760','#ab6948','#6e432e','#f6d2ae','#d9a27b']);
const hairs=new Set(['#904b28','#342e32','#cd8c32','#ab4232','#6f4f37','#302b46']);
const shirts=new Set(['#ef792f','#69a55e','#315fa2','#cc5654','#6a5588','#a87640','#2c8e97','#e3c36c','#6c9354','#9d7859','#855b39','#ece9df','#8da9b7','#b54037','#303d49']);
const take=(choices,value,fallback)=>choices.has(value)?value:fallback;
export const STARTER_CREW=Object.freeze({
 skin:'#f0b989',hair:'#904b28',shirt:'#ef792f',pet:'dog',outfit:'detective'
});
export function crewCharacter(state){
 const crew=Array.isArray(state?.crew)?state.crew:[];
 const selected=crew.find(x=>x?.id===state?.active)||crew[0];
 return selected&&typeof selected==='object'?selected:STARTER_CREW;
}
export function mysteryCrewPortrait(state,compact=false){
 const actor=crewCharacter(state);
 const skin=take(skins,actor.skin,STARTER_CREW.skin);
 const hair=take(hairs,actor.hair,STARTER_CREW.hair);
 const shirt=take(shirts,actor.shirt,STARTER_CREW.shirt);
 // Decorative SVG is shared in profile cards, forum author chips and
 // the family arcade mini profile. It contains no arbitrary user HTML.
 return '<span class="avatar mystery-crew-portrait'+(compact?' mystery-crew-small':'')+'" aria-hidden="true">'+
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" width="96" height="96" role="presentation" focusable="false">'+
 '<rect x="1" y="1" width="108" height="108" rx="22" fill="#3e9bc5"/>'+
 '<circle cx="88" cy="25" r="16" fill="#fff0b3" opacity=".8"/>'+
 '<path d="M7 109Q13 80 45 75Q84 70 103 109Z" fill="'+shirt+'" stroke="#242b45" stroke-width="5"/>'+
 '<path d="M27 39Q25 9 57 9Q88 8 88 43L85 67Q57 94 32 67Z" fill="'+skin+'" stroke="#2d2936" stroke-width="5"/>'+
 '<path d="M25 48Q12 15 36 10Q55 -5 76 7Q101 11 89 46Q80 30 65 30Q44 27 32 46Z" fill="'+hair+'" stroke="#302a32" stroke-width="5"/>'+
 '<ellipse cx="45" cy="48" rx="9" ry="12" fill="#fff9e9"/><ellipse cx="71" cy="48" rx="9" ry="12" fill="#fff9e9"/>'+
 '<circle cx="48" cy="50" r="5" fill="#245b80"/><circle cx="69" cy="50" r="5" fill="#245b80"/>'+
 '<circle cx="49" cy="48" r="2" fill="white"/><circle cx="70" cy="48" r="2" fill="white"/>'+
 '<path d="M47 67Q58 82 73 66" stroke="#7f433e" stroke-width="4" fill="none" stroke-linecap="round"/>'+
 '</svg></span>';
}
