/* 1980s-style cabinet input geometry; original control art.
 * Pure, deterministic, mobile-first and independent of scoring/replay rules.
 */
export function retroStickDirection(dx,dy,deadzone=8){
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

/* One-thumb slide across captured buttons: re-route held steering to the
 * control under the finger, even though browser pointer capture keeps the
 * event on the button where the finger started. This changes only the input
 * choice, never the server replay rule or frame rate.
 */
export function retroControlSlide(game,rect,clientX,clientY,previous='N'){
 const x=Number(clientX),y=Number(clientY);
 if(!Number.isFinite(x)||!Number.isFinite(y)||
    !rect||!(rect.width>0)||!(rect.height>0))return previous;
 if(game==='fleet'){
   const half=rect.left+rect.width/2,threshold=Math.min(22,rect.width*.08);
   return x<half-threshold?'L':x>half+threshold?'R':previous;
 }
 if(game==='maze'){
   const dx=x-(rect.left+rect.width/2),dy=y-(rect.top+rect.height/2);
   const direction=retroStickDirection(dx,dy,Math.min(8,rect.width*.035));
   return direction==='N'?previous:direction;
 }
 return previous;
}
