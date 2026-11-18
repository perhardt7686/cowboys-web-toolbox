/* Multi-touch input primitives shared by Elliot's Dash Forge and Emma's Skyboard Sprint.
 * A key, pointer, or joystick must never release a different active input source.
 * Presentation only: scoring, physics and server replay validation are unchanged.
 */
export function createSourceHolds(actions){
 const allowed=new Set(actions),owners=new Map();
 function validate(action,source){
  if(!allowed.has(action)||typeof source!=='string'||!source)
   throw new TypeError('Invalid arcade input action/source');
 }
 return {
  hold(action,source){
   validate(action,source);
   let s=owners.get(action);
   if(!s){s=new Set();owners.set(action,s);}
   s.add(source);return true;
  },
  release(action,source){
   validate(action,source);
   const s=owners.get(action);if(!s)return false;
   const had=s.delete(source);if(!s.size)owners.delete(action);return had;
  },
  releaseSource(source){
   if(typeof source!=='string'||!source)return;
   for(const [action,s] of owners){s.delete(source);if(!s.size)owners.delete(action);}
  },
  has(action){return Boolean(owners.get(action)?.size);},
  clear(){owners.clear();},
  [Symbol.iterator](){return owners.keys();}
 };
}
/** A thumbstick uses a deadzone before sending left/right, without altering physics. */
export function thumbstickAxis(clientX,centerX,radius,deadzone=.18){
 if(!Number.isFinite(clientX)||!Number.isFinite(centerX)||
    !Number.isFinite(radius)||radius<=0||!Number.isFinite(deadzone)||
    deadzone<0||deadzone>=1)return 0;
 const value=Math.max(-1,Math.min(1,(clientX-centerX)/radius));
 return Math.abs(value)<deadzone?0:value;
}
export function thumbstickDirection(axis,deadzone=.18){
 if(!Number.isFinite(axis))return 0;
 return axis<=-deadzone?-1:axis>=deadzone?1:0;
}
