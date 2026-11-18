/* 1980s-style cabinet input geometry; original control art.
 * Pure, deterministic, mobile-first and independent of scoring/replay rules.
 */
export function retroStickDirection(dx,dy,deadzone=13){
  const x=Number(dx),y=Number(dy);
  if(!Number.isFinite(x)||!Number.isFinite(y))return 'N';
  const distance=Math.hypot(x,y);
  if(distance<deadzone)return 'N';
  return Math.abs(x)>Math.abs(y)?x<0?'L':'R':y<0?'U':'D';
}
export function retroStickOffset(dx,dy,maxRadius=25){
  const x=Number(dx)||0,y=Number(dy)||0;
  const norm=Math.hypot(x,y);
  const scale=norm>maxRadius?maxRadius/norm:1;
  return [Math.round(x*scale),Math.round(y*scale)];
}
