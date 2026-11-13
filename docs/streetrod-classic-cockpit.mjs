/* Original first-person racing dashboard: visual homage to 1989 garage racers.
 * No original screenshot, pixel art, car brand or gameplay source reused.
 * Client-only visual; server scoring and physics never depend on this module.
 */
import {drawPhotoCar} from './streetrod-photo-sprites.mjs?v=photoreal1';
const PI=Math.PI;
function path(ctx,coords,fill,stroke='',lw=1){ctx.beginPath();coords.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}}
function rr(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function dial(ctx,x,y,r,value,max,title){
 ctx.save();ctx.translate(x,y);ctx.fillStyle='#0a0e12';ctx.beginPath();ctx.arc(0,0,r+8,0,2*PI);ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#bcb3a4';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#6d7476';ctx.beginPath();ctx.arc(0,0,r+3,0,2*PI);ctx.stroke();
 ctx.fillStyle='#e5ddc8';for(let i=0;i<=8;i++){const angle=PI*.78+(i/8)*PI*1.45;const ax=Math.cos(angle),ay=Math.sin(angle);ctx.lineWidth=i%2===0?2.5:1;ctx.strokeStyle='#d4cfc1';ctx.beginPath();ctx.moveTo(ax*r*.72,ay*r*.72);ctx.lineTo(ax*r*.85,ay*r*.85);ctx.stroke();}
 ctx.fillStyle='#f7eacb';ctx.font='700 11px system-ui';ctx.textAlign='center';ctx.fillText(title,0,14);ctx.font='800 8px system-ui';ctx.fillText(max===160?'MPH':'RPM',0,25);
 const angle=PI*.78+Math.min(1,Math.max(0,value/max))*PI*1.45;ctx.rotate(angle);ctx.fillStyle='#db735c';path(ctx,[[-2,5],[-2,-r*.72],[1,-r*.72],[2,5]],'#ed7052');ctx.restore();
}
export function drawClassicCockpit(ctx,{width=960,height=340,progress=0,live=false,seed=1,own={},rival={},boss=false,clock=0,speed=null,rpm=null,steer=0,damage=0}={}){
 const w=width,h=height, p=Math.max(0,Math.min(1,Number(progress)||0)),t=Number(clock)||0;
 ctx.save();ctx.clearRect(0,0,w,h);
 let sky=ctx.createLinearGradient(0,0,0,235);sky.addColorStop(0,'#121628');sky.addColorStop(.60,'#3e324c');sky.addColorStop(1,'#c17966');ctx.fillStyle=sky;ctx.fillRect(0,0,w,218);
 // Original late-evening desert strip, low buildings and highway reflectors.
 ctx.fillStyle='#f1b683';ctx.beginPath();ctx.arc(775,70,22,0,2*PI);ctx.fill();
 for(let i=0;i<28;i++){
  const x=(i*43+(seed*13)%27)%985-18,y=17+(i*47)%115;
  ctx.fillStyle='#f2e5cf88';ctx.fillRect(x,y,i%4===0?2:1,1);
 }
 path(ctx,[[0,189],[42,176],[126,182],[184,170],[252,189],[318,175],[392,187],[477,171],[559,185],[622,167],[711,184],[790,175],[861,183],[960,166],[960,249],[0,249]],'#252a30');
 ctx.fillStyle='#141d23';ctx.fillRect(0,216,w,120);
 const van=216, horizon=460+Math.max(-1,Math.min(1,Number(steer)||0))*58;
 path(ctx,[[0,h],[960,h],[565,van],[420,van]],'#49474a');
 path(ctx,[[75,h],[885,h],[542,van],[439,van]],'#343b40');
 // Perspective road lane marks and moving stripes.
 const slide=(p*2900+t*.05)%90;
 ctx.fillStyle='#eadab4';
 for(let z=0;z<8;z++){const k=((z*90+slide)%720)/720, y=van+Math.pow(k,1.8)*121,depth=1+15*Math.pow(k,2);path(ctx,[[488-depth/3,y],[493+depth/3,y],[493+depth/3+depth*.7,y+depth],[488-depth/3-depth*.7,y+depth]],'#f3ead4a1');}
 for(const side of [-1,1]){
  ctx.strokeStyle='#ca8d78';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(horizon+side*43,van);ctx.lineTo(horizon+side*470,340);ctx.stroke();
  for(let i=0;i<7;i++){const k=(i/7+.14+((p*2)%1)/7)%1,y=van+k*k*118,x=horizon+side*(71+k*k*377);ctx.fillStyle='#f1d597';ctx.fillRect(x,y,3+k*3,3+k*4);}
 }
 // Opponent on the road. Image is original generated vehicle art, never a screenshot crop.
 const rivalX=500+Math.sin(t/510+seed)*22-(p*40), rivalSize=93+Math.max(0,p)*44;
 const body=boss?'van':(rival.body||'muscle');
 if(!drawPhotoCar(ctx,rivalX-rivalSize*.55,179-rivalSize*.15,rivalSize*1.2,rivalSize*.93,body,rival.key||'')){
  rr(ctx,rivalX-50,187,104,23,8,'#5e4572','#d5a98f');ctx.fillStyle='#fff0cb';ctx.fillRect(rivalX+42,188,8,7);
 }
 // Windshield seals / rearview mirror / chrome side pillar geometry.
 path(ctx,[[0,0],[27,0],[40,179],[0,279]],'#1a2126','#858b86',4);
 path(ctx,[[w,0],[w-29,0],[w-41,180],[w,278]],'#171c24','#868884',4);
 rr(ctx,419,5,130,21,5,'#121c25','#acb7b1');rr(ctx,430,9,109,12,4,'#2d3840');
 // Painted hood with bright metallic highlight.
 const hood=ctx.createLinearGradient(0,208,0,342);hood.addColorStop(0,'#313c42');hood.addColorStop(.35,own.accent||'#5d6669');hood.addColorStop(.87,'#121821');hood.addColorStop(1,'#080d16');path(ctx,[[315,270],[386,236],[520,229],[599,269],[683,342],[258,342]],hood,'#121722',4);
 ctx.strokeStyle='#e8dec78c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(406,239);ctx.quadraticCurveTo(452,224,512,231);ctx.stroke();
 // Dark embossed dashboard surface, twin period analog instruments.
 const dash=ctx.createLinearGradient(0,259,0,340);dash.addColorStop(0,'#51575a');dash.addColorStop(.15,'#b2ada3');dash.addColorStop(.22,'#3a4245');dash.addColorStop(1,'#15191c');path(ctx,[[0,270],[93,256],[227,259],[341,286],[608,279],[747,260],[863,259],[960,273],[960,340],[0,340]],dash,'#15181d',5);
 dial(ctx,374,305,28,speed==null?live?45+p*110:0:Number(speed),160,'SPEED');dial(ctx,582,305,28,rpm==null?live?2000+p*4500:900:Number(rpm),8000,'REV');
 // Steering wheel ring and center do not obscure the road entirely.
 ctx.strokeStyle='#0b1116';ctx.lineWidth=19;ctx.beginPath();ctx.arc(476,343,79,PI*1.04,PI*1.96);ctx.stroke();ctx.strokeStyle='#c7bcb3';ctx.lineWidth=6;ctx.beginPath();ctx.arc(476,343,79,PI*1.04,PI*1.96);ctx.stroke();
 path(ctx,[[445,334],[459,319],[494,319],[511,334],[499,343],[453,343]],'#b8b6ae','#43484a',2);
 rr(ctx,446,329,63,18,5,'#171c1f','#9b9385');
 if(Number(damage)>.35){ctx.save();ctx.strokeStyle='#e8ebed99';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(760,17);ctx.lineTo(695,78);ctx.lineTo(748,114);ctx.lineTo(710,151);ctx.moveTo(695,78);ctx.lineTo(629,49);ctx.moveTo(748,114);ctx.lineTo(824,146);ctx.stroke();ctx.restore();}
 // Gauges for the original-style gameplay, never score authoritative.
 rr(ctx,19,10,197,28,5,'#151c25dd','#c3a36b');ctx.fillStyle='#ffdf96';ctx.font='800 13px monospace';ctx.textAlign='left';ctx.fillText('RIVERSIDE NIGHT RUN',30,29);
 rr(ctx,758,10,173,28,5,'#151c25e0','#aa9b8e');ctx.fillStyle='#f3dfba';ctx.fillText('SUMMER OF 1963',769,29);
 ctx.restore();return true;
}