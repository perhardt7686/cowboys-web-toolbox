/* Mystery Cartoon 1970: expressive hand-inked faces, six wildly different
   hair silhouettes, groovy clothes, and oversized original eyewear.
   All original Canvas art. No licensed characters or tracing. */
import {INK,PAPER,tint,path,oval,glint} from './avatar-cel-art.mjs?v=workshop1';
import {expressionActing} from './avatar-expression-acting.mjs';
const shade=c=>tint(c,'#372735',.52);
const light=c=>tint(c,'#ffe7bf',.38);
function line(c,p,width=3,color=INK){
 path(c,p[0],p.slice(1),null,color,width);
}
function strokeHair(c,p,hair,shine){
 path(c,p[0],p.slice(1),hair,INK,4.1);
 if(shine)path(c,shine[0],shine.slice(1),null,light(hair),2.5);
}
export const SPECIAL_HAIR_STYLES=Object.freeze(['shag','flip','pompadour','afro','fringe','feathered']);
export function paintMysteryHair(c,style,hair){
 const gl=light(hair),dark=shade(hair);
 switch(style){
 case 'shag':
   strokeHair(c,[[54,115],[41,97],[52,90],[42,77],[62,76],[59,56],[79,59],
     [86,38],[108,44],[122,29],[139,41],[163,34],[170,55],
     [191,51],[187,71],[202,72],[191,96],[198,113],[185,128],
     [176,112],[164,93],[139,85],[111,91],[86,100],[71,128],[54,115]],
     hair,[[73,74],[99,59],[131,55],[164,64]]);
   for(const [x,y,dx] of [[61,106,-13],[186,106,15],[75,82,-8],[167,76,12]]){
     path(c,[x,y],[[x+dx,y+9],[x+dx*.7,y+20]],null,gl,2.3);
   }
   break;
 case 'flip':
   strokeHair(c,[[58,111],[53,72,71,44,102,34],[142,19,182,39,194,74],
     [201,107,205,132,220,145],[202,158],[185,143],
     [174,110],[164,95],[128,87],[92,102],[79,138],[55,150],[42,143],[58,111]],
     hair,[[67,77],[87,48,124,44,164,57]]);
   path(c,[59,117],[[45,133,35,151,29,165],[49,160,66,154,78,134]],hair,INK,3);
   path(c,[183,116],[[198,139,207,150,224,156],[202,165,184,152,176,135]],hair,INK,3);
   path(c,[58,149],[[51,150,47,156]],null,gl,3);
   path(c,[192,152],[[201,159,211,159]],null,gl,3);
   break;
 case 'pompadour':
   strokeHair(c,[[58,112],[52,89,47,68,67,56],[62,27,88,23,108,33],
     [111,13,148,5,160,28],[181,14,203,40,191,68],
     [206,86,199,110,182,120],[181,99],[168,81],[146,76],
     [112,94],[83,95],[58,112]],hair,
     [[81,62],[92,36,130,32,158,43]]);
   path(c,[116,56],[[136,41,169,42,176,60]],null,gl,3);
   path(c,[78,92],[[113,81,137,80,161,79]],null,dark,3);
   break;
 case 'afro':
   for(let i=0;i<19;i++){
     const theta=Math.PI*.97+i*(Math.PI*1.14/18);
     const xx=125+84*Math.cos(theta),yy=104-65*Math.sin(theta);
     oval(c,xx,yy,23+(i%3)*2,22+(i%2)*3,hair,INK,2.4);
   }
   path(c,[41,111],[[39,55,74,18,129,16],[188,14,211,50,211,109],
     [197,132],[187,121],[174,104],[152,99],[128,90],
     [94,104],[76,122],[53,134],[41,111]],hair,INK,4);
   for(const [x,y] of [[73,50],[100,36],[138,28],[177,45],[64,86],[192,83]]) {
     oval(c,x,y,12,5,null,gl,2.3,-.3);
   }
   break;
 case 'fringe':
   strokeHair(c,[[59,108],[55,77,65,49,87,39],[117,25,161,33,178,51],
     [195,67,197,95,186,113],[183,111],[178,88],
     [167,119],[151,105],[140,119],[123,106],
     [110,119],[95,104],[81,116],[74,90],[59,108]],hair,
     [[76,65],[102,41,138,43,160,61]]);
   path(c,[84,89],[[106,106,128,110,147,103]],null,gl,2.5);
   break;
 case 'feathered':
   strokeHair(c,[[63,113],[44,90,53,63,80,43],[115,18,156,29,174,48],
     [195,60,200,89,187,109],[204,117],[224,139],[208,157],
     [190,149],[182,125],[171,91],[137,82],
     [110,91],[83,119],[64,157],[43,159],[31,145],[49,133],[63,113]],hair,
     [[78,72],[105,41,138,41,166,64]]);
   for(let y=110;y<=142;y+=11){
     path(c,[61,y],[[49,y+4,42,y+14]],null,gl,2.4);
     path(c,[184,y-4],[[199,y+3,208,y+12]],null,gl,2.4);
   }
   break;
 default:break;
 }
}
export function paintMysteryExpression(c,v,iris,skin){
 const ink=INK,cream='#fff5dc',shadow=tint(skin,'#6e3944',.4);
 const eyeTypes={
   classic:[14,9,0],round:[14,14,0],almond:[17,7,0],
   wide:[18,12,0],sleepy:[15,7,3],dramatic:[17,12,0]
 };
 const [rx,ry,drop]=eyeTypes[v.eye_shape]||eyeTypes.classic;
 const acting=expressionActing(v.expression);
 const brow=v.brows||'soft';
 const slant=brow==='arching'?7:brow==='bold'?3:brow==='straight'?0:4;
 const width=brow==='bold'?4.8:3.2;
 const leftY=97+acting.brows[0],rightY=95+acting.brows[1];
 path(c,[84,leftY+7],[[93,leftY-3,106,leftY-2,115,leftY+5-slant+acting.browEnd[0]]],null,ink,width);
 path(c,[143,rightY+7],[[155,rightY-4,169,rightY-2,172,rightY+4+slant+acting.browEnd[1]]],null,ink,width);
 const eye=(cx,cy,rw,rh,wink=false,side=0)=>{
   if(wink){
     path(c,[cx-rw,cy+2],[[cx-rw*.2,cy-rh*.75,cx+rw*.45,cy-rh*.5,cx+rw,cy+1]],null,ink,3.4);
     path(c,[cx-rw+4,cy+6],[[cx-rw*.1,cy+8,cx+rw*.45,cy+6,cx+rw-3,cy+3]],null,shadow,1.4);
     return;
   }
   if(v.expression==='laugh'){
     // Joyful ink crescents read cleanly at 48px in feed portraits.
     path(c,[cx-rw,cy+1],[[cx-rw*.3,cy-rh*.85,cx+rw*.45,cy-rh*.8,cx+rw,cy]],null,ink,3);
     path(c,[cx-rw+3,cy+5],[[cx,cy+rh*.27,cx+rw-3,cy+4]],null,shadow,1.5);
     return;
   }
   // Human-shaped, offset eyes and broad top lids mimic ink-and-paint animation.
   const opened=Math.max(2.5,rh*acting.eyes[side]);
   const top=cy-opened,bot=cy+opened*.73;
   path(c,[cx-rw,cy],[[cx-rw*.65,top-2,cx+rw*.35,top-3,cx+rw,cy-1],
     [cx+rw*.7,bot+2,cx-rw*.48,bot+2,cx-rw,cy]],cream,ink,2.9);
   const irisX=cx+(v.eye_shape==='sleepy'?4:2.5)+acting.gaze[side]*.85,irisY=cy+drop*.2;
   oval(c,irisX,irisY,rw*.38,Math.max(2.8,opened*.64),iris,ink,1.5,.11);
   oval(c,irisX+1,irisY,Math.max(2.2,rw*.19),Math.max(2.5,opened*.4),'#261c30');
   oval(c,irisX-1.6,irisY-3.3,Math.max(1.4,rw*.11),Math.max(1.4,rh*.11),cream);
   if(v.eye_shape==='sleepy'||v.expression==='calm'){
     path(c,[cx-rw,cy-5],[[cx-rw*.3,cy-rh*.3,cx+rw*.4,cy-rh*.5,cx+rw,cy-5]],skin,ink,3);
   }
   if(v.eye_shape==='dramatic'){
     for(let k=0;k<3;k++){
       const sign=k===0?-1:k===2?1:0;
       path(c,[cx-rw+2+k*rw,top+3],[[cx-rw+sign*3+k*rw,top-6]],null,ink,2);
     }
   }
   if(v.eye_shape==='wide')path(c,[cx-rw+3,cy+rh+2],
       [[cx,cy+rh+6,cx+rw-2,cy+rh+1]],null,shadow,1.5);
 };
 eye(99,120,rx,ry,false,0);
 eye(156,118,rx-1,ry-.4,v.expression==='wink',1);
 const nose=v.nose||'button';
 if(nose==='pointed'){
   path(c,[136,118],[[134,128,148,134],[143,139],[129,137]],null,shadow,2.6);
 }else if(nose==='swoop'){
   path(c,[135,116],[[143,126,147,133,138,137],[133,141,128,137]],null,shadow,2.5);
 }else if(nose==='straight'){
   path(c,[136,115],[[133,126,135,132],[130,136,137,137]],null,shadow,2.4);
 }else{
   path(c,[136,117],[[135,125,143,130,141,135],[140,139,133,140,128,137]],null,shadow,2.3);
   if(nose==='freckled')oval(c,140,135,5,3,'#cd766b',null);
 }
 path(c,[132,128],[[135,129,138,128]],null,light(skin),2);
 if(v.expression==='smirk'){
   path(c,[109,165],[[124,169,140,165,163,144]],null,ink,3.25);
   path(c,[156,149],[[163,144,169,145]],null,shadow,1.9);
   path(c,[149,169],[[159,163,163,157]],null,shadow,1.3);
 }else if(v.expression==='laugh'){
   path(c,[110,151],[[129,159,149,154,163,149],[164,181,140,193,127,188],
     [115,182,111,166,110,151]],'#712f43',ink,2.9);
   path(c,[115,153],[[136,162,152,151,159,153],[149,168,128,167,115,153]],cream,null);
   oval(c,140,179,14,6,'#d97e7a',null,1,-.1);
 }else if(v.expression==='grin'){
   // Wide toothy shape and lifted cheek creases remain legible as a 48px icon.
   path(c,[101,152],[[119,161,144,157,167,150],
     [172,165,150,184,131,186],[112,183,102,169,101,152]],
     '#72343c',ink,2.9);
   path(c,[108,154],[[130,165,149,156,163,154],
     [159,165,134,171,110,163]],cream,null);
   path(c,[94,146],[[97,158,102,160]],null,shadow,2);
   path(c,[165,144],[[170,153,171,158]],null,shadow,2);
 }else if(v.expression==='smile'||v.expression==='wink'){
   // Closed upturned lip without the teeth of grin.
   path(c,[112,150],[[117,164,145,171,158,148]],null,ink,3.25);
   path(c,[107,148],[[109,157,112,159]],null,shadow,1.5);
   path(c,[158,148],[[162,154,163,158]],null,shadow,1.5);
 }else if(v.expression==='determined'){
   path(c,[111,157],[[129,156,143,155,155,152]],null,ink,3.3);
   path(c,[127,167],[[141,166,150,163]],null,shadow,1.5);
 }else if(v.expression==='curious'){
   oval(c,135,160,8,10,'#794251',ink,2.6,-.15);
   oval(c,133,157,3,3,'#a85e66',null);
 }else if(v.expression==='calm'){
   path(c,[113,160],[[129,164,146,159,155,155]],null,shadow,2.8);
 }else{
   path(c,[112,158],[[129,163,145,158,155,154]],null,ink,2.2);
 }
 // Distinctive asymmetrical cel ink and cheek marks, unobtrusive at 64px.
 if(v.expression==='curious'||v.expression==='smirk'){
   path(c,[91,154],[[96,158,103,155]],null,shadow,1.6);
 }
}
export function paintMysteryGlasses(c,kind){
 const glass='#c4f6f72b',frame=kind==='aviator'?'#c98c4d':'#472f62';
 path(c,[61,114],[[75,113]],null,frame,4);
 path(c,[120,119],[[128,112,140,118]],null,frame,4);
 for(const [x,y] of [[101,124],[156,121]]){
   if(kind==='cat-eye'){
     path(c,[x-21,y-4],[[x-23,y-17],[x-11,y-10],[x+20,y-14],
       [x+17,y+7,x+4,y+15,x-14,y+11],[x-21,y-4]],glass,frame,4);
     path(c,[x+18,y-9],[[x+28,y-17]],null,frame,3.5);
   }else if(kind==='aviator'){
     path(c,[x-20,y-11],[[x-17,y-21,x+18,y-22,x+21,y-10],
       [x+23,y+5,x+13,y+19,x-1,y+22],
       [x-17,y+18,x-24,y+5,x-20,y-11]],glass,frame,4);
   }else {
     path(c,[x-22,y-14],[[x+17,y-14],[x+22,y-8],[x+20,y+14],
       [x-20,y+15],[x-24,y+9],[x-22,y-14]],glass,frame,5.2);
   }
   path(c,[x-13,y-6],[[x-4,y-12]],null,'#fff1d599',2);
 }
}
export function paintMysteryGarment(c,v,shirt){
 const rim=shade(shirt),bright=light(shirt);
 if(v.garment==='jacket'){
   path(c,[95,191],[[76,198,60,224,52,256],[117,256],[126,215],[108,208],[95,191]],
      '#7c574d',INK,2.8);
   path(c,[155,192],[[175,206,195,227,207,256],[143,256],[128,215],
      [147,210],[155,192]],'#7c574d',INK,2.8);
   path(c,[94,193],[[109,209,123,214],[108,228],[89,213]],bright,INK,2);
   path(c,[158,193],[[145,207,133,215],[149,227],[171,209]],bright,INK,2);
   for(const y of [226,243])oval(c,129,y,2.7,3,PAPER,INK,1);
 }else if(v.garment==='jumpsuit'){
   path(c,[81,203],[[109,213,144,214,172,202],[186,226],[188,256],[67,256],[67,225]],shirt,INK,2.5);
   path(c,[93,206],[[108,232,119,236]],null,rim,4);
   path(c,[157,206],[[143,226,140,235]],null,rim,4);
   path(c,[84,235],[[107,241,121,238]],null,bright,2.2);
   oval(c,129,240,4,4,'#e8b36d',INK,1);
 }else if(v.garment==='hoodie'){
   path(c,[91,184],[[69,203,66,225,68,245],[103,257],[122,238]],shirt,INK,3);
   path(c,[156,184],[[175,202,194,227,189,251],[151,257],[131,235]],shirt,INK,3);
   path(c,[92,191],[[115,215,140,215,159,191],[149,234],[101,233],[92,191]],bright,INK,2);
   for(const x of [115,140])line(c,[[x,214],[x,237]],2.5,PAPER);
 }else if(v.garment==='safari'){
   path(c,[86,195],[[65,220,64,252],[112,256],[123,217]],'#ac9065',INK,3);
   path(c,[158,195],[[185,215,197,251],[142,256],[131,218]],'#ac9065',INK,3);
   for(const x of [80,165]){
     path(c,[x-14,228],[[x+11,226],[x+11,243],[x-11,247],[x-14,228]],'#e5bf85',INK,1.7);
     oval(c,x,235,2.7,2.7,INK,null);
   }
   path(c,[91,200],[[115,226,128,219],[144,225,162,202]],null,bright,3);
 }
}
