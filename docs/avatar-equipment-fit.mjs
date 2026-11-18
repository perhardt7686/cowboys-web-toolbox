// Original saved face signatures drive fitted *presentation* geometry.
// All fittings are deterministic, bounded and independent of reward unlock data.
const HEAD_WIDTHS=Object.freeze({
  oval:1,
  angular:1.052,
  round:1.145,
  square:1.105,
  long:.947,
  heart:1.123
});
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function equippedHeadwearWidth(face='oval',slot='hat'){
  const ratio=HEAD_WIDTHS[face]||HEAD_WIDTHS.oval;
  const influence={hat:.86,hair:.72,eyewear:.48,eyes:.28}[slot]||.75;
  return Math.round(clamp(1+(ratio-1)*influence,.93,1.13)*10000)/10000;
}

// Fit a pet on the outside of the rendered shoulder/torso outline.
// The original slim-actor socket is a hard lower bound, not an assumed
// universal socket for broad costumes or wider original pet species.
export function celCompanionHomeX({chest=50,petHalfWidth=45,turnOffset=0}={}){
  const width=clamp(finite(chest,50),20,105);
  const half=clamp(finite(petHalfWidth,45),25,62);
  const turn=clamp(finite(turnOffset,0),-15,15);
  const target=Math.max(317+turn,216+width+half+12);
  return Math.round(clamp(target,317-15,432-half-8)*1000)/1000;
}
