/* Recolor the painted pixels once per saved appearance. Alpha, ink and
 * highlights are preserved. This module never reads or changes account data. */
const hex=/^#[\da-f]{6}$/i;
export function colorRGB(value,fallback='#ef792f'){
 const color=typeof value==='string'&&hex.test(value)?value:fallback;
 return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
}
function hsv([r,g,b]){
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;
 const h=!d?0:((hi===r?(g-b)/d+(g<b?6:0):hi===g?(b-r)/d+2:(r-g)/d+4)/6);
 return [h,hi?d/hi:0,hi];
}
function rgb([h,s,v]){
 const index=Math.floor(h*6),f=h*6-index,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
 return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][((index%6)+6)%6];
}
export function recolorCrewPixels(data,width,height,member={},base={}){
 const colors={},changed={};
 for(const key of ['skin','hair','shirt','pants']){
  const fallback=base[key]||'#ef792f',value=typeof member[key]==='string'&&hex.test(member[key])?member[key]:fallback;
  colors[key]=hsv(colorRGB(value));changed[key]=value.toLowerCase()!==fallback.toLowerCase();
 }
 const clothHue=hsv(colorRGB(base.shirt||'#ef792f'))[0];
 for(let i=0;i<data.length;i+=4){
  if(data[i+3]<16)continue;
  const x=((i/4)%width)/width,y=Math.floor(i/4/width)/height;
  const original=[data[i]/255,data[i+1]/255,data[i+2]/255],a=hsv(original),[r,g,b]=original;
  const skin=r>.38&&r>g*1.10&&g>b*1.14&&b>r*.37&&a[2]>.46&&
   (y<.30||(y>.31&&y<.60&&(x<.43||x>.58)));
  const hair=y<.245&&!skin&&a[1]>.18&&a[2]>.14&&a[2]<.92;
  const delta=Math.min(Math.abs(a[0]-clothHue),1-Math.abs(a[0]-clothHue));
  const cloth=y>.285&&y<.665&&!skin&&delta<.14&&a[1]>.14&&a[2]>.17;
  const pants=y>.56&&y<.91&&a[0]>.52&&a[0]<.76&&a[1]>.20;
  const key=skin?'skin':hair?'hair':cloth?'shirt':pants?'pants':null;
  if(!key||!changed[key])continue;
  const target=colors[key];
  const result=rgb([target[0],Math.min(1,a[1]*.30+target[1]*.70),Math.min(1,a[2]*(.36+target[2]*.75))]);
  for(let c=0;c<3;c++)data[i+c]=Math.round(result[c]*255);
 }
 return data;
}
