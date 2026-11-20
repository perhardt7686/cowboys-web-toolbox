/* Local-only, per-approved-member control preferences for Family Arcade.
 * Deliberately never changes engine physics, replay scores or ranked rules.
 */
const VALID_MEMBER=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const SKY_STEERING_PRESETS=Object.freeze({
 quick:Object.freeze({engage:.12,release:.07,canvasPixels:12,label:'Quick'}),
 balanced:Object.freeze({engage:.20,release:.13,canvasPixels:17,label:'Balanced'}),
 steady:Object.freeze({engage:.30,release:.21,canvasPixels:25,label:'Steady'})
});
export const DASH_TOUCH_TARGETS=Object.freeze({
 standard:Object.freeze({label:'Standard'}),
 large:Object.freeze({label:'Large'}),
 extra:Object.freeze({label:'Extra large'})
});
export const DEFAULT_SKY_STEERING='balanced';
export const DEFAULT_DASH_TOUCH='standard';
const KEYS=Object.freeze({skyboard:'skyboard-steering-preset-v1',dashforge:'dash-touch-target-v1'});
const choices=(game)=>game==='skyboard'?SKY_STEERING_PRESETS:game==='dashforge'?DASH_TOUCH_TARGETS:null;
export function validControlChoice(game,value){
 return Boolean(choices(game)&&typeof value==='string'&&Object.hasOwn(choices(game),value));
}
export function controlStorageKey(game,memberId){
 if(!Object.hasOwn(KEYS,game)||typeof memberId!=='string'||!VALID_MEMBER.test(memberId))
  throw new TypeError('A valid family member and game are required');
 return KEYS[game]+'-'+memberId.toLowerCase();
}
export function readControlChoice(storage,game,memberId,defaultValue){
 if(!validControlChoice(game,defaultValue))throw new TypeError('Invalid default control setting');
 try{
  const value=storage?.getItem?.(controlStorageKey(game,memberId));
  return validControlChoice(game,value)?value:defaultValue;
 }catch{return defaultValue;}
}
export function saveControlChoice(storage,game,memberId,value){
 if(!validControlChoice(game,value))return false;
 try{storage?.setItem?.(controlStorageKey(game,memberId),value);return Boolean(storage?.setItem);}
 catch{return false;}
}
export function resetControlChoice(storage,game,memberId){
 try{storage?.removeItem?.(controlStorageKey(game,memberId));return Boolean(storage?.removeItem);}
 catch{return false;}
}
/** Threshold hysteresis avoids left-right chatter without changing turn speed. */
export function steeringWithHysteresis(axis,previous=0,preset=DEFAULT_SKY_STEERING){
 const p=SKY_STEERING_PRESETS[preset]||SKY_STEERING_PRESETS[DEFAULT_SKY_STEERING];
 if(!Number.isFinite(axis))return 0;
 const a=Math.max(-1,Math.min(1,axis));
 if(a>=p.engage)return 1;
 if(a<=-p.engage)return -1;
 if(previous===1&&a>=p.release)return 1;
 if(previous===-1&&a<=-p.release)return -1;
 return 0;
}
/** Canvas drag remains an accessible alternate steering input, not analog physics. */
export function canvasSteeringDirection(delta,previous=0,preset=DEFAULT_SKY_STEERING){
 if(!Number.isFinite(delta))return 0;
 const distance=SKY_STEERING_PRESETS[preset]?.canvasPixels||SKY_STEERING_PRESETS.balanced.canvasPixels;
 if(delta>=distance)return 1;
 if(delta<=-distance)return -1;
 if(previous===1&&delta>=distance*.65)return 1;
 if(previous===-1&&delta<=-distance*.65)return -1;
 return 0;
}
