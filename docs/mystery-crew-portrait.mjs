/* Shared original Mystery Crew portrait art. No untrusted user SVG injection.
 * One geometry pipeline for roster thumbnails, selection cards and forum photos. */
import {crewHeadMarkup} from './mystery-crew-art.mjs';
export const BASIC_MYSTERY_CREW=Object.freeze({
 id:'crew-1',name:'Scout',skin:'#f0b989',hair:'#904b28',shirt:'#ef792f',pants:'#315b93',
 outfit:'detective',hat:'none',gear:'none',pet:'dog',vehicle:'van',scene:'sunlit',
 faceShape:'oval',hairStyle:'tousled',eyeShape:'bright',detail:'none',expression:'smile'
});
const color=(value,fallback)=>typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value)?value:fallback;
export function mysteryCrewPortraitSVG(input={}){
 const v={...BASIC_MYSTERY_CREW,...(input&&typeof input==='object'?input:{})};
 const shirt=color(v.shirt,BASIC_MYSTERY_CREW.shirt);
 const coat=v.outfit==='explorer'?'#64854a':v.outfit==='viking'?'#978068':v.outfit==='outdoors'?'#bd4936':v.outfit==='space'?'#eae7db':shirt;
 const hat=v.hat==='none'?'':v.hat==='helmet'
  ?'<path d="M29 42Q38 -8 97 -7Q158 -3 163 45L150 58 33 56Z" fill="#bdb7a2" stroke="#37353f" stroke-width="7"/><path d="M40 24L10 -20 8 4 42 52M147 24L182 -20 182 7 148 51" fill="#edd9ae" stroke="#37353f" stroke-width="6"/>'
  :v.hat==='cap'
  ?'<path d="M31 45Q39 -8 97 -7Q157 -4 161 47L48 57Z" fill="#258c96" stroke="#343440" stroke-width="7"/><path d="M74 49Q139 36 177 49Q153 70 92 66Z" fill="#147889" stroke="#343440" stroke-width="5"/>'
  :v.hat==='goggles'
  ?'<path d="M33 42Q42 -7 97 -7Q151 -4 160 45Z" fill="#846446" stroke="#34333f" stroke-width="7"/><circle cx="71" cy="29" r="22" fill="#94c9da" stroke="#373843" stroke-width="7"/><circle cx="122" cy="29" r="22" fill="#94c9da" stroke="#373843" stroke-width="7"/>'
  :'<path d="M32 38Q50 -11 98 -8Q147 -4 163 38L154 52Q94 66 36 52Z" fill="#9d7045" stroke="#342e35" stroke-width="7"/><path d="M15 49Q92 72 177 49" fill="none" stroke="#483837" stroke-width="11"/>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" width="96" height="96" aria-hidden="true" focusable="false">'+
 '<rect width="110" height="110" rx="17" fill="#86c6e0"/>'+
 '<path d="M0 99Q49 82 110 99V110H0Z" fill="#f0d6a6"/>'+
 '<path d="M8 111Q13 81 40 82L55 91 71 82Q98 81 102 111Z" fill="'+coat+'" stroke="#343341" stroke-width="5"/>'+
 '<path d="M44 82L55 97 70 82M55 97V109" fill="none" stroke="#efd6ad" stroke-width="3"/>'+
 '<g transform="translate(3 3) scale(.55)">'+crewHeadMarkup(v)+hat+'</g></svg>';
}
