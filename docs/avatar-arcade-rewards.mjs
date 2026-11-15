/* Original cel-drawn collectibles for Star Squadron, Mystery Maze, Dash Forge.
 * No sprites, logos, or characters are copied from commercial arcade games.
 * Every reward visibly changes the avatar or surrounding mystery-cartoon scene.
 */
import {INK,PAPER,oval,path,glint} from './avatar-cel-art.mjs?v=cel1';
const G='#ffd47a',Q='#8be8db',V='#ab8cdb',C='#f6a5a4',D='#302640';
function ellipse(c,x,y,w,h,fill,stroke=INK,line=2,angle=0){oval(c,x,y,w,h,fill,stroke,line,angle)}
function polygon(c,pts,fill,stroke=INK,width=2){
 c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);
 c.closePath();if(fill){c.fillStyle=fill;c.fill();}
 if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}
}
function stroke(c,pts,color=INK,width=2){
 c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);
 c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
}
function rect(c,x,y,w,h,color,border=INK,width=2){
 c.fillStyle=color;c.fillRect(x,y,w,h);
 if(border){c.strokeStyle=border;c.lineWidth=width;c.strokeRect(x,y,w,h);}
}
function dotEyes(c,x1,x2,y,eye=PAPER){
 for(const x of [x1,x2]){
  ellipse(c,x,y,6,7,eye,INK,1.3);
  ellipse(c,x+1,y,2.3,4,D,null);
  ellipse(c,x-1,y-3,1.4,1.5,PAPER,null);
 }
}
function companion(c,id,t){
 const bob=Math.sin(t*3)*3;
 c.save();c.translate(208,190+bob);
 ellipse(c,0,44,25,5,'#17152e47',null);
 switch(id){
 case 'starling-owl':
   polygon(c,[[-25,-18],[-16,-41],[0,-29],[17,-42],[26,-17],[23,20],[3,30],[-21,19]],'#7b8eaa');
   polygon(c,[[-22,-2],[-45,-16],[-30,20],[-14,13]],Q);
   polygon(c,[[22,-2],[45,-16],[30,20],[14,13]],Q);
   dotEyes(c,-11,11,-9);rect(c,-6,10,12,9,G);
   ellipse(c,0,-30,6,6,G);stroke(c,[[0,-33],[0,-47]],G,3);
   break;
 case 'queen-drone':
   polygon(c,[[-28,-5],[-11,-32],[12,-30],[28,-2],[20,21],[-20,21]],'#9d5d94');
   for(const side of [-1,1]){
     polygon(c,[[side*16,-9],[side*44,-25],[side*31,9]],Q);
     polygon(c,[[side*11,15],[side*31,36],[side*3,28]],C);
     stroke(c,[[side*11,-24],[side*20,-43]],G,3);
     ellipse(c,side*22,-45,4,4,G);
   }
   dotEyes(c,-9,10,-4);polygon(c,[[-7,12],[0,18],[7,12]],G);
   glint(c,0,-40,6,PAPER);
   break;
 case 'clue-mouse':
   ellipse(c,-23,-20,16,17,'#b69b77');ellipse(c,23,-20,16,17,'#b69b77');
   ellipse(c,-23,-20,10,11,C,null);ellipse(c,23,-20,10,11,C,null);
   ellipse(c,0,1,24,24,'#cbb68b');dotEyes(c,-10,11,-3);
   ellipse(c,0,10,6,5,C,INK,1.5);stroke(c,[[1,12],[3,20]],INK,2);
   polygon(c,[[-18,-16],[18,-16],[14,-25],[-13,-25]],'#5d5478');
   ellipse(c,0,-30,15,6,'#5d5478');glint(c,12,-30,3,G);
   break;
 case 'wisp-pup':
   path(c,[-25,-15],[[-25,-33,-4,-35,1,-23],[18,-34,30,-27,30,-9],
     [31,18,21,24,14,29],[7,24,0,28,-7,24],[-17,30,-24,19,-25,-15]],'#a5e5f5ad',INK,2.7);
   ellipse(c,-19,-14,12,19,'#c0b1e6ad');ellipse(c,20,-15,12,19,'#c0b1e6ad');
   dotEyes(c,-9,10,-4);ellipse(c,1,11,7,5,D,null);
   polygon(c,[[-5,29],[1,36],[7,29]],Q);
   break;
 case 'pixel-hamster':
   rect(c,-23,-24,47,45,'#ddb988',INK,3);
   rect(c,-21,-38,13,15,'#dcaab4',INK,2);rect(c,10,-38,13,15,'#dcaab4',INK,2);
   rect(c,-18,0,12,14,PAPER,null);rect(c,9,0,12,14,PAPER,null);
   dotEyes(c,-10,11,-8);rect(c,-4,12,9,5,C,INK,1.5);
   for(const x of [-23,16])rect(c,x,21,8,7,G,INK,1.5);
   break;
 case 'boss-dragonlet':
   polygon(c,[[-26,-22],[-10,-32],[0,-18],[14,-36],[27,-19],[24,18],
     [3,29],[-20,20]],'#6fa1ad');
   polygon(c,[[-19,-14],[-40,-33],[-31,11],[-15,5]],V);
   polygon(c,[[19,-14],[40,-33],[31,11],[15,5]],V);
   polygon(c,[[-9,-30],[-1,-48],[5,-30]],G);
   polygon(c,[[11,-26],[24,-44],[21,-14]],G);
   dotEyes(c,-9,11,-8);ellipse(c,2,13,6,4,'#d4777e',INK,1.4);
   polygon(c,[[19,25],[33,31],[27,17]],Q);
   glint(c,28,-44,7,G);
   break;
 }
 c.restore();
}
function eyewear(c,id,t){
 c.save();const glow=Math.sin(t*3)*2;
 if(id==='nebula-visor'){
  polygon(c,[[67,106],[88,101],[166,102],[188,110],[177,141],
    [145,144],[128,135],[113,144],[82,143]],'#63b7c999','#6f4d8e',4);
  stroke(c,[[76,113],[176,113]],G,3);
  glint(c,163+glow,119,6,PAPER);
 }else if(id==='wall-vision-glasses'){
  for(const x of [98,156]){
   polygon(c,[[x-23,107],[x+21,107],[x+15,140],[x-18,140]],'#72dd9899',INK,4);
   stroke(c,[[x-15,123],[x+15,123]],G,2);
  }
  stroke(c,[[119,115],[137,114]],INK,4);
  glint(c,87+glow,118,4,PAPER);
 }else{
  polygon(c,[[70,110],[91,105],[124,112],[135,110],[171,103],
    [190,110],[176,137],[142,141],[129,131],[113,144],[78,140]],'#f68aba99',INK,5);
  for(const x of [83,156])stroke(c,[[x,116],[x+27,116]],Q,3);
  glint(c,167+glow,111,5,PAPER);
 }
 c.restore();
}
function object(c,id,t){
 c.save();c.translate(44,188+Math.sin(t*2)*2);
 if(id==='meteor-jetpack'){
  rect(c,-25,-30,18,53,'#8398a9');rect(c,7,-30,18,53,'#8398a9');
  for(const x of [-25,7]){rect(c,x+3,-21,12,13,G);polygon(c,[[x+4,23],[x+9,43],[x+14,23]],C);}
  rect(c,-9,-21,19,12,'#c7ad8a');ellipse(c,0,-14,4,4,D,null);
 }else if(id==='comet-signal'){
  stroke(c,[[0,32],[2,-14]],'#9f7ac1',9);
  polygon(c,[[2,-38],[12,-23],[32,-18],[17,-4],[20,16],[2,7],[-17,16],[-15,-4],[-32,-18],[-12,-23]],G);
  ellipse(c,1,-16,10,10,C,INK,1.5);glint(c,28,-42,6,Q);
 }else if(id==='spectral-keyring'){
  ellipse(c,0,-17,23,22,'#0000','#d2b56c',6);
  for(const x of [-14,0,15]){
   stroke(c,[[x,-1],[x+2,29]],x===0?C:Q,5);
   rect(c,x-5,21,13,9,G);rect(c,x+3,27,5,8,G);
  }
  glint(c,29,-30,6,PAPER);
 }else if(id==='spectral-lantern'){
  rect(c,-21,-20,42,43,'#748fa8');
  rect(c,-14,-13,28,27,'#f2eaa2');ellipse(c,0,0,10,10,'#a5f4e3',null);
  stroke(c,[[-14,-20],[-9,-39],[10,-39],[14,-20]],INK,3);
  for(const x of [-14,14])ellipse(c,x,3,3,5,G);
  glint(c,0,-4,7,PAPER);
 }else if(id==='boss-baton'){
  stroke(c,[[0,34],[0,-24]],'#8f709c',10);
  polygon(c,[[-23,-25],[-19,-42],[0,-32],[18,-42],[22,-25],[0,-14]],C);
  for(let i=0;i<5;i++)polygon(c,[[0,-28],[-11+i*5,-23],[0,-17]],i%2?Q:G,null);
  glint(c,23,-39,8,PAPER);
 }
 c.restore();
}
function effect(c,id,t){
 const wave=Math.sin(t*3)*5;
 if(id==='meteor-shower'){
  for(let i=0;i<12;i++){
   const x=14+(i*59)%255,y=22+(i*37)%190+wave;
   stroke(c,[[x-20,y-16],[x,y]],i%3===0?C:G,2.6);
   glint(c,x+2,y,4,i%3===0?Q:PAPER);
  }
 }else if(id==='ghost-echo'){
  for(const [x,y] of [[23,45],[227,65],[18,168],[241,180]]){
   for(let j=0;j<3;j++)ellipse(c,x,y,8+j*8+wave/2,12+j*8+wave/2,
     null,['#a7e9f5','#d9b2e9','#f8d7a9'][j],2);
  }
 }else{
  for(let i=0;i<9;i++){
   const x=9+(i*37)%246,y=206-(i%3)*35+wave;
   polygon(c,[[x,y],[x+12,y-19],[x+24,y]],i%2===0?'#5ee8db88':'#db9dff99',PAPER,1.8);
   glint(c,x+12,y-14,3,G);
  }
 }
}
function scene(c,id,t){
 const sets={
  'starfield-cockpit':['#142447','#416b87','#e0b36d'],
  'ancient-keyway':['#3f3859','#788b8b','#e9ba7b'],
  'crystal-portal':['#48336a','#6ca4b6','#c1dd91']
 };
 const [top,middle,accent]=sets[id];
 const bg=c.createLinearGradient(0,0,0,256);
 bg.addColorStop(0,top);bg.addColorStop(1,middle);c.fillStyle=bg;c.fillRect(0,0,256,256);
 for(let i=0;i<32;i++){
  const x=(i*67+17)%256,y=(i*47+13)%175;
  ellipse(c,x,y,i%4?1:2,i%4?1:2,i%3===0?PAPER:G,null);
 }
 if(id==='starfield-cockpit'){
  polygon(c,[[5,28],[125,12],[252,27],[250,189],[6,189]],'#13233e88',accent,5);
  stroke(c,[[126,15],[126,188]],accent,3);
  rect(c,0,193,256,63,'#4b4967');for(let i=0;i<8;i++){
   rect(c,i*32+9,205,21,15,i%2===0?Q:C);rect(c,i*32+12,232,17,5,G,null);
  }
  ellipse(c,192,85,29,29,'#e9bc8b',null);glint(c,191,86,6,PAPER);
 }else if(id==='ancient-keyway'){
  rect(c,34,32,188,224,'#687389',INK,4);
  for(let y=42;y<250;y+=29)for(let x=42;x<210;x+=40){
   stroke(c,[[x,y],[x+24,y]],'#3d4760',2);
  }
  path(c,[83,242],[[76,194,85,112,120,95],[172,80,185,144,172,242]],'#17273e',G,4);
  ellipse(c,127,151,19,19,accent,INK,3);
  rect(c,124,165,6,36,accent,INK,1);
  glint(c,126,142,9,PAPER);
 }else{
  for(let j=0;j<4;j++){
   ellipse(c,130,120,78-j*17,96-j*22,'#0000',
    [accent,'#d2b9ea',Q,PAPER][j],5);
  }
  polygon(c,[[15,229],[34,180],[53,232]],'#b2d9db');
  polygon(c,[[207,230],[223,159],[248,229]],'#c9bce0');
  polygon(c,[[39,160],[60,113],[80,160]],'#9dbce4');
  glint(c,127+Math.sin(t)*4,120,21,PAPER);
 }
}
const specs=[
 ['starling-owl','Starling Owl','companion','fleet-first-flight'],
 ['nebula-visor','Nebula Visor','eyewear','fleet-scout'],
 ['meteor-jetpack','Meteor Jetpack','prop','fleet-ace'],
 ['comet-signal','Comet Signal','prop','fleet-regular'],
 ['meteor-shower','Meteor Shower','effect','fleet-gunner'],
 ['starfield-cockpit','Starfield Cockpit','background','fleet-veteran'],
 ['queen-drone','Queen Drone','companion','fleet-command'],
 ['clue-mouse','Clue Mouse','companion','maze-first-clue'],
 ['wall-vision-glasses','Wall-Vision Glasses','eyewear','maze-sleuth'],
 ['spectral-keyring','Spectral Keyring','prop','maze-tracker'],
 ['spectral-lantern','Spectral Lantern','prop','maze-explorer'],
 ['ghost-echo','Ghost Echo','effect','maze-shadow'],
 ['ancient-keyway','Ancient Keyway','background','maze-labyrinth'],
 ['wisp-pup','Wisp Pup','companion','maze-master'],
 ['pixel-hamster','Pixel Hamster','companion','dash-first-clear'],
 ['neon-runner-shades','Neon Runner Shades','eyewear','dash-five-levels'],
 ['geometry-helmet','Geometry Helmet','hat','dash-twentyfive'],
 ['prism-trail','Prism Trail','effect','dash-first-boss'],
 ['boss-baton','Boss Baton','prop','dash-first-designer'],
 ['crystal-portal','Crystal Portal','background','dash-century'],
 ['boss-dragonlet','Boss Dragonlet','companion','dash-legend']
];
export const ARCADE_REWARDS=Object.freeze(specs.map(([id,name,slot,achievement_id])=>
 Object.freeze({id,name,slot,achievement_id,tags:Object.freeze(['arcade','retro','mystery']),animated:true,
  draw(c,t=0){
   c.save();
   if(slot==='companion')companion(c,id,t);
   else if(slot==='eyewear')eyewear(c,id,t);
   else if(slot==='prop')object(c,id,t);
   else if(slot==='effect')effect(c,id,t);
   else if(slot==='background')scene(c,id,t);
   else if(slot==='hat'){
    polygon(c,[[91,77],[84,46],[107,25],[154,25],[177,46],[168,77]],'#73bbc6',INK,4);
    rect(c,83,73,94,13,'#895caf');rect(c,118,31,25,28,G);glint(c,154,37,6,PAPER);
   }
   c.restore();
  }
 })));
