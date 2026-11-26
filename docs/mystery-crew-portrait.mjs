/* Shared painted portraits. No retired face, photo or alternate creator. */
import {BASIC_MYSTERY_CREW,illustratedAnchor} from './mystery-crew-model.mjs?v=unified2';
import {peekCrewPortrait,paintedPortraitURL} from './mystery-crew-character-v5.mjs?v=unified2';
export {BASIC_MYSTERY_CREW};
export const prepareCrewPortrait=paintedPortraitURL;
const atlas=new URL('./mystery-crew-v5-atlas.png',import.meta.url).href;
export function mysteryCrewPortraitSVG(input={}){
 const cached=peekCrewPortrait(input),index=illustratedAnchor(input);
 if(cached)return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="96" height="96" data-crew-anchor="'+index+'" aria-hidden="true"><image href="'+cached+'" width="128" height="128"/></svg>';
 const x=index%3*512+100,y=Math.floor(index/3)*512;
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+x+' '+y+' 312 225" width="96" height="96" class="mc-illustrated-portrait" data-crew-anchor="'+index+'" aria-hidden="true" focusable="false"><rect x="'+x+'" y="'+y+'" width="312" height="225" rx="24" fill="#8ac7dd"/><image href="'+atlas+'" width="1536" height="1024"/></svg>';
}
