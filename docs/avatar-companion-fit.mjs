// Stage-space companion socket. Unlike saved recipes, this is a presentation
// coordinate calculated anew for each equipped avatar and creature geometry.
// Keep the original narrow-body home as the minimum, avoiding sudden changes
// for existing small pet previews.
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));

export function companionHomePosition({bodyWidth=1,petLeftExtent=.31}={}){
  const width=clamp(finite(bodyWidth,1),.72,1.60);
  const left=clamp(finite(petLeftExtent,.31),.15,.85);
  // Chest/hip edge plus pet's left edge plus a small ink-outline clearance.
  // Torso profiles are narrower than the total shoulder/gear silhouette.
  const x=clamp(Math.max(.897,width*.46+left+.12),.897,1.45);
  return Object.freeze({x:Math.round(x*1000)/1000,y:0,z:.242});
}
