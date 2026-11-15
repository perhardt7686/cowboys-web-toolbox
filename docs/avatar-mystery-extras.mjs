/* Extra original Mystery Arcade cosmetics: companions, props, locations and FX.
   All items are distinct hand-inked Canvas illustrations, never licensed characters.
   Their achievement IDs are trusted server definitions, not client-computed awards. */
import {INK,PAPER,oval,path,glint} from './avatar-cel-art.mjs?v=workshop1';
const gold='#e8b45f',aqua='#7bd7c8',coral='#e97977',violet='#9472c7';
function o(c,x,y,rx,ry,fill=gold,outline=INK,w=2,angle=0){oval(c,x,y,rx,ry,fill,outline,w,angle);}
function ln(c,points,color=INK,width=2){
 c.beginPath();c.moveTo(...points[0]);for(const xy of points.slice(1))c.lineTo(...xy);
 c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
}
function polygon(c,points,fill,outline=INK,w=2){
 c.beginPath();c.moveTo(...points[0]);for(const xy of points.slice(1))c.lineTo(...xy);
 c.closePath();c.fillStyle=fill;c.fill();
 if(outline){c.strokeStyle=outline;c.lineWidth=w;c.lineJoin='round';c.stroke();}
}
function square(c,x,y,w,h,fill,stroke=INK,r=1){
 c.fillStyle=fill;c.fillRect(x,y,w,h);
 if(stroke){c.lineWidth=r;c.strokeStyle=stroke;c.strokeRect(x,y,w,h);}
}
function pet(c,type,main,accent,t=0){
 const bob=Math.sin(t*3)*2.5;
 c.save();c.translate(0,bob);
 o(c,0,28,27,5,'#22162b45',null);
 if(type==='owl'){
   polygon(c,[[-26,3],[-25,-26],[-13,-35],[-4,-27],[10,-29],[21,-36],[28,-18],[26,10],[17,25],[-13,26]],main);
   o(c,-12,-12,12,14,PAPER);o(c,11,-13,12,14,PAPER);
   o(c,-9,-11,5,7,accent);o(c,12,-12,5,7,accent);
   polygon(c,[[-4,0],[5,0],[0,10]],gold);
   ln(c,[[-25,6],[-32,19],[-14,16]],accent,4);
 }else if(type==='puppy'){
   o(c,0,2,24,22,main);o(c,-26,-15,12,25,accent,INK,2,-.25);o(c,24,-15,12,25,accent,INK,2,.25);
   o(c,-9,-8,6,7,PAPER);o(c,11,-8,6,7,PAPER);o(c,-8,-8,3,4,INK,null);o(c,12,-8,3,4,INK,null);
   o(c,3,10,15,10,PAPER);o(c,3,4,7,5,INK,null);ln(c,[[3,9],[3,15],[-6,18]],INK,2);
   ln(c,[[17,18],[29,11],[33,13]],main,7);
 }else if(type==='cat'){
   polygon(c,[[-23,5],[-24,-27],[-8,-18],[12,-20],[25,-32],[25,13],[13,24],[-15,23]],main);
   o(c,-10,-7,7,8,PAPER);o(c,12,-8,7,8,PAPER);o(c,-9,-7,2.5,5,accent,null);o(c,11,-8,2.5,5,accent,null);
   polygon(c,[[-3,7],[5,7],[1,11]],coral,null);ln(c,[[-2,13],[1,15],[6,12]],INK,1.5);
   for(const side of [-1,1])for(const y of [9,14])ln(c,[[side*5,y],[side*29,y-3]],INK,1);
   square(c,-18,-1,7,6,gold,INK,1);square(c,13,-1,7,6,gold,INK,1);
 }else if(type==='fox'){
   polygon(c,[[-28,4],[-24,-27],[-9,-18],[10,-19],[25,-31],[29,4],[4,27],[-8,27]],main);
   polygon(c,[[-19,-4],[-12,2],[5,13],[21,-4],[16,15],[4,21],[-8,20]],PAPER,null);
   o(c,-10,-8,4,5,INK,null);o(c,12,-8,4,5,INK,null);o(c,0,11,4,3,INK,null);
   polygon(c,[[18,17],[32,8],[43,12],[32,26],[21,26]],main);
 }else if(type==='hedgehog'){
   for(let i=0;i<12;i++){const a=Math.PI+i*Math.PI/12;polygon(c,[[26*Math.cos(a),8+23*Math.sin(a)],[37*Math.cos(a),5+37*Math.sin(a)],[26*Math.cos(a+.17),8+23*Math.sin(a+.17)]],accent,INK,1);}
   o(c,0,4,26,23,main);o(c,0,13,19,12,PAPER,null);
   o(c,-9,0,3,3,INK,null);o(c,11,-1,3,3,INK,null);o(c,1,12,5,4,INK,null);
 }else if(type==='axolotl'){
   o(c,0,5,26,19,main);for(const side of [-1,1])for(let i=0;i<3;i++){
    ln(c,[[side*19,-13+i*7],[side*(31+i*2),-24+i*8]],accent,5);
   }
   o(c,-10,3,4,4,INK,null);o(c,11,3,4,4,INK,null);ln(c,[[-5,13],[0,16],[6,13]],INK,1.8);
   o(c,-17,23,7,5,main);o(c,15,23,7,5,main);
 }else if(type==='ferret'){
   o(c,0,8,17,32,main);o(c,-17,-23,8,9,accent);o(c,17,-23,8,9,accent);
   o(c,0,-14,20,20,main);o(c,-9,-13,5,5,INK,null);o(c,10,-13,5,5,INK,null);
   o(c,0,0,11,8,PAPER,null);o(c,1,-2,4,3,INK,null);
   ln(c,[[13,20],[28,29],[37,17]],accent,6);
 }else if(type==='firefly'){
   o(c,-17,0,15,19,PAPER,INK,1.6,-.48);o(c,18,-2,15,19,PAPER,INK,1.6,.48);
   o(c,0,2,12,19,main);o(c,0,16,9,10,gold,null);
   o(c,-4,-3,3,4,INK,null);o(c,6,-4,3,4,INK,null);
   ln(c,[[-4,-18],[-10,-28]],INK,2);ln(c,[[5,-19],[12,-28]],INK,2);glint(c,25,-25,6,gold);
 }else if(type==='turtle'){
   o(c,0,6,27,24,main);o(c,0,4,21,20,accent);
   for(const x of [-13,0,13])ln(c,[[x,-10],[x+6,17]],main,1.8);
   o(c,-31,-5,12,11,main);o(c,-34,-7,3,3,INK,null);
   for(const x of [-15,16])o(c,x,25,8,5,main);
   polygon(c,[[22,9],[34,17],[24,20]],main);
 }else if(type==='dragon'){
   polygon(c,[[-25,18],[-22,-6],[-13,-25],[0,-17],[14,-26],[24,-9],[28,21],[7,26],[-9,26]],main);
   polygon(c,[[-19,-19],[-28,-35],[-9,-27]],gold);
   polygon(c,[[10,-27],[27,-38],[24,-9]],gold);
   polygon(c,[[-20,3],[-44,-21],[-32,14]],accent);
   polygon(c,[[20,1],[43,-21],[32,16]],accent);
   o(c,-9,-8,4,6,PAPER);o(c,11,-8,4,6,PAPER);o(c,-9,-8,2.4,4,INK,null);o(c,11,-8,2.4,4,INK,null);
   ln(c,[[-3,13],[5,16],[11,10]],INK,2);
 }else if(type==='bat'){
   polygon(c,[[-7,3],[-43,-13],[-35,13],[-24,4],[-21,19],[-5,13]],accent);
   polygon(c,[[7,2],[43,-14],[35,13],[24,4],[22,19],[6,13]],accent);
   o(c,0,2,16,21,main);
   polygon(c,[[-12,-13],[-10,-32],[-1,-14]],main);polygon(c,[[9,-14],[16,-33],[17,-11]],main);
   o(c,-7,-4,4.5,5,PAPER);o(c,8,-5,4.5,5,PAPER);
   o(c,-7,-4,2.4,3,INK,null);o(c,8,-5,2.4,3,INK,null);
   polygon(c,[[-3,11],[1,17],[5,10]],PAPER);
 }else if(type==='gecko'){
   o(c,0,3,14,26,main,null);o(c,0,-15,23,14,main);
   o(c,-12,-15,8,9,accent,INK,1.5);o(c,12,-15,8,9,accent,INK,1.5);
   o(c,-12,-16,3,4,INK,null);o(c,12,-16,3,4,INK,null);
   ln(c,[[-12,7],[-27,14],[-29,23]],main,7);ln(c,[[11,7],[27,11],[32,19]],main,7);
   ln(c,[[0,19],[17,32],[34,24],[36,15]],main,7);
 }
 // Every companion wears a different hand-inked reward detail.
 if(type==='puppy'||type==='ferret'||type==='fox')o(c,0,22,4,4,gold,INK,1);
 if(type==='firefly'||type==='dragon')glint(c,22,-33,5,PAPER);
 c.restore();
}
const companionSpecs=[
 ['midnight-owl','Midnight Clue Owl','owl','#705d8d','#d6b878','quest-first-solve'],
 ['phantom-puppy','Phantom Puppy','puppy','#c3b5d7','#9076b9','family-first-word'],
 ['clockwork-cat','Clockwork Cat','cat','#b8876b','#5c8591','hotrod-first-run'],
 ['moon-fox','Moonlit Fox','fox','#db8668','#865077','wordle-first-solve'],
 ['cactus-hedgehog','Cactus Hedgehog','hedgehog','#a1cc90','#4b897c','mahjong-first-board'],
 ['bubble-axolotl','Bubble Axolotl','axolotl','#e4a4c0','#88d7dc','quest-xp-50'],
 ['detective-ferret','Detective Ferret','ferret','#c6aa83','#72556d','plates-first-approval'],
 ['neon-firefly','Neon Firefly','firefly','#6cbfc4','#da9f6e','wordle-score-25'],
 ['satellite-turtle','Satellite Turtle','turtle','#77a696','#435c95','hotrod-first-drag'],
 ['bonsai-dragon','Bonsai Dragon','dragon','#67ad94','#eac071','mahjong-five-wins'],
 ['carnival-bat','Carnival Bat','bat','#8d659e','#ed9b79','family-puzzle-party'],
 ['gear-gecko','Gear Gecko','gecko','#75b4b4','#c4a266','cross-three-games']
];
function prop(c,type,base,trim,t=0){
 c.save();c.rotate(.05*Math.sin(t*2));
 if(type==='decoder'){
   o(c,0,0,29,29,base);o(c,0,0,21,21,PAPER);o(c,0,0,12,12,trim);
   for(let i=0;i<8;i++){const a=i*Math.PI/4;ln(c,[[16*Math.cos(a),16*Math.sin(a)],[23*Math.cos(a),23*Math.sin(a)]],INK,1.8);}
 }else if(type==='camera'){
   square(c,-27,-15,54,34,base);square(c,-20,-23,21,9,trim);o(c,4,0,17,17,INK);o(c,4,0,11,11,trim,null);o(c,4,0,4,4,PAPER,null);glint(c,18,-18,6,PAPER);
 }else if(type==='lantern'){
   square(c,-20,-16,40,39,base);square(c,-15,-11,30,29,trim,INK,2);o(c,0,2,10,12,'#fff6b7',null);
   ln(c,[[-15,-18],[-12,-34],[12,-34],[15,-18]],INK,3);
 }else if(type==='compass'){
   o(c,0,0,27,27,base);o(c,0,0,20,20,PAPER);polygon(c,[[0,-18],[7,0],[0,18],[-7,0]],trim);
   o(c,0,0,4,4,INK,null);
 }else if(type==='umbrella'){
   polygon(c,[[-34,-8],[-22,-28],[0,-35],[25,-27],[34,-8],[18,-13],[0,-8],[-17,-13]],base);
   ln(c,[[0,-9],[0,20],[3,29],[12,31],[16,25]],INK,4);
 }else if(type==='hoverboard'){
   o(c,0,10,38,10,base);square(c,-19,3,38,14,trim,null);o(c,-24,22,7,7,INK);o(c,23,22,7,7,INK);
   glint(c,0,-11,7,PAPER);
 }else if(type==='jetpack'){
   square(c,-18,-25,16,41,base);square(c,5,-25,16,41,base);
   square(c,-17,-19,13,7,trim,null);square(c,7,-19,13,7,trim,null);
   polygon(c,[[-15,17],[-6,17],[-10,37]],gold);polygon(c,[[8,17],[18,17],[13,37]],coral);
 }else if(type==='radio'){
   square(c,-29,-23,58,47,base);o(c,-9,0,14,14,trim);for(const y of [-13,-8,-3,2,7])ln(c,[[10,y],[23,y]],INK,2);
   ln(c,[[-20,-22],[-31,-41]],INK,3);o(c,16,14,4,4,gold);
 }else if(type==='map'){
   polygon(c,[[-35,-18],[-15,-27],[6,-18],[32,-25],[33,23],[7,29],[-14,21],[-34,30]],PAPER);
   ln(c,[[-14,-22],[-14,22]],base,2);ln(c,[[6,-18],[7,27]],base,2);
   ln(c,[[-21,14],[-5,4],[5,12],[18,-4]],trim,3);
   o(c,18,-4,5,5,coral);
 }else if(type==='scanner'){
   square(c,-27,-26,54,49,base);square(c,-20,-19,40,21,'#25495a');
   for(let x=-12;x<=12;x+=8)ln(c,[[x,-12],[x+7,-12]],trim,2);
   o(c,-12,12,5,5,gold);o(c,12,12,5,5,trim);
 }else if(type==='magnifier'){
   o(c,-9,-11,20,20,'#d0f2e999',INK,4);ln(c,[[5,5],[31,33]],base,9);
   glint(c,-15,-17,5,PAPER);
 }else if(type==='notebook'){
   square(c,-26,-28,50,59,base);square(c,-18,-20,35,44,PAPER,null);
   for(let y=-13;y<24;y+=9)ln(c,[[-11,y],[12,y]],trim,1.8);
   for(let y=-21;y<32;y+=11)o(c,-26,y,3,3,gold);
 }
 c.restore();
}
const propSpecs=[
 ['cipher-wheel','Cipher Wheel','decoder','#547a89','#c87566','cross-double-play'],
 ['flashbulb-camera','Flashbulb Camera','camera','#8a5b78','#70b3af','plates-first-approval'],
 ['ghost-lantern','Ghost Lantern','lantern','#8d5d83','#f4c46c','family-first-word'],
 ['brass-compass','Brass Compass','compass','#d9ad61','#9f4466','mahjong-first-board'],
 ['storm-umbrella','Storm Umbrella','umbrella','#7955a9','#dda171','quest-first-clue'],
 ['rocket-hoverboard','Rocket Hoverboard','hoverboard','#639dd0','#deb976','hotrod-first-drag'],
 ['twin-jetpack','Twin Jetpack','jetpack','#76868d','#ed9378','cross-three-games'],
 ['field-radio','Field Radio','radio','#5b7886','#c1b581','hotrod-first-run'],
 ['secret-map','Secret Treasure Map','map','#9d805d','#d47752','wordle-first-clue'],
 ['spectral-scanner','Spectral Scanner','scanner','#687897','#68d1aa','quest-xp-50'],
 ['starlight-magnifier','Starlight Magnifier','magnifier','#9a7da9','#6dd1d5','mahjong-five-wins'],
 ['detective-notebook','Detective Notebook','notebook','#986c78','#5c93ac','plates-two-approvals']
];
function scene(c,type,t=0){
 const colors={
  marsh:['#35566c','#8bb3a4','#426760'],theater:['#7c436e','#d5a677','#633047'],
  motel:['#396c81','#f6b576','#a86855'],boardwalk:['#263a6d','#c29d97','#647e8e'],
  hangar:['#294566','#bbcaab','#5d7b97'],library:['#3b6754','#edc987','#786a54']
 }[type];
 const sky=c.createLinearGradient(0,0,0,256);sky.addColorStop(0,colors[0]);sky.addColorStop(1,colors[1]);
 c.fillStyle=sky;c.fillRect(0,0,256,256);
 o(c,192,52,25,25,'#f8d9ab',null);
 polygon(c,[[0,172],[80,146],[164,163],[256,149],[256,256],[0,256]],colors[2],null);
 if(type==='marsh'){
  for(const x of [12,35,57,218,246]){ln(c,[[x,210],[x,125]],'#273f43',5);o(c,x,119,18,34,'#385b4f',null);}
  for(let y=176;y<238;y+=24)ln(c,[[4,y],[251,y-4]],'#bae0cd5c',4);
 }else if(type==='theater'){
  polygon(c,[[9,29],[247,29],[240,205],[18,205]],'#5a2e4e');
  for(const x of [22,62,196,229])polygon(c,[[x,25],[x+20,25],[x+15,190],[x,198]],'#af5472',null);
  square(c,70,58,119,113,'#293251',gold,4);
  for(const x of [91,125,159])o(c,x,205,18,15,'#e1bd8a',INK,1);
 }else if(type==='motel'){
  square(c,24,82,216,141,'#b88661',INK,3);
  for(const x of [52,105,159,212]){square(c,x-15,105,30,35,'#324f69',gold,2);square(c,x-14,159,29,48,'#654356',INK,2);}
  square(c,74,52,118,28,coral,INK,2);
  c.fillStyle=PAPER;c.font='bold 17px monospace';c.fillText('MOTEL',98,71);
 }else if(type==='boardwalk'){
  ln(c,[[0,174],[256,176]],gold,4);
  for(const x of [8,40,75,110,145,180,216,250])ln(c,[[x,178],[x+5,256]],'#493960',4);
  for(let r=18;r<76;r+=22)o(c,194,144,r,r,'#0000',gold,2);
  for(const a of [0,Math.PI/3,Math.PI*2/3])ln(c,[[194,144],[194+72*Math.cos(a),144+72*Math.sin(a)]],gold,2);
 }else if(type==='hangar'){
  polygon(c,[[10,99],[125,34],[246,99],[246,236],[10,236]],'#5d7b85');
  for(const x of [31,62,93,124,155,186,217])ln(c,[[x,103],[x,224]],'#a1b1a7',2);
  o(c,125,194,70,20,'#567890');o(c,125,152,39,18,'#afcbd2');
  for(const x of [64,187])o(c,x,190,12,12,gold);
 }else if(type==='library'){
  for(const x of [13,83,153,223]){
   square(c,x,54,54,152,'#563e43',gold,3);
   for(let y=66;y<=182;y+=26){
     for(let z=0;z<5;z++){square(c,x+6+z*9,y,7,19,['#bd9163','#a55563','#467f83','#b7a16c'][z%4],null);}
   }
  }
  square(c,84,207,85,20,'#b28d5c',INK,2);
  o(c,125,197,17,12,PAPER,INK,1);
 }
}
const scenes=[
 ['foggy-marsh','Foggy Detective Marsh','marsh','family-first-word'],
 ['velvet-theater','Velvet Ghost Theater','theater','quest-xp-50'],
 ['roadside-motel','Roadside Mystery Motel','motel','hotrod-first-road'],
 ['moon-boardwalk','Moonlit Boardwalk','boardwalk','cross-three-games'],
 ['rocket-hangar','Retro Rocket Hangar','hangar','hotrod-first-drag'],
 ['ivy-library','Ivy Mystery Library','library','wordle-first-solve']
];
function effect(c,type,t=0){
 const move=Math.sin(t*3)*4;
 if(type==='footprints'){
  for(let i=0;i<11;i++){const x=14+i*22,y=228-(i%2)*9;
   o(c,x,y+move,6,11,'#7fdac378',null,1,i%2?-.3:.3);o(c,x-3,y-12+move,2,3,PAPER,null);
  }
 }else if(type==='echo'){
  for(const [i,x,y] of [[0,40,70],[1,210,95],[2,42,184],[3,219,200]]){
   for(let j=0;j<3;j++)o(c,x,y,9+j*7+Math.sin(t*2+i)*2,9+j*7+Math.sin(t*2+i)*2,'#0000',
   ['#ffda9a','#a1d8e4','#d9a6ee'][j],2);
  }
 }else if(type==='comet'){
  for(let i=0;i<7;i++){
   const x=15+i*37,y=35+(i%3)*70+move;
   ln(c,[[x-16,y-13],[x+1,y]],'#ffcf86',3);glint(c,x+2,y,6,PAPER);
  }
 }else if(type==='bubbles'){
  for(let i=0;i<12;i++){
   const x=15+(i*43)%244,y=(i*71+36+move+256)%256;
   o(c,x,y,3+i%5,3+i%5,'#b9f2f32e','#9ee3ef',1.5);o(c,x-1,y-2,1,1,PAPER,null);
  }
 }else if(type==='lightning'){
  for(const x of [15,207])for(const y of [16,120]){
   polygon(c,[[x,y],[x+20,y-6],[x+13,y+12],[x+27,y+15],[x-4,y+47],[x+3,y+22],[x-8,y+18]],gold);
  }
 }else if(type==='ghosts'){
  for(const [x,y] of [[23,57],[229,79],[32,184],[230,192]]){
   c.save();c.globalAlpha=.77;
   path(c,[x-15,y+18+move],[[x-13,y-14+move,x+14,y-20+move,x+16,y+14+move],
    [x+10,y+9+move],[x+3,y+16+move],[x-4,y+8+move],[x-12,y+18+move]],PAPER,'#a9cbd6',2);
   o(c,x-5,y+move,2,3,INK,null);o(c,x+5,y+move,2,3,INK,null);c.restore();
  }
 }
}
const effectSpecs=[
 ['glowing-footprints','Glowing Footprints','footprints','mahjong-first-board'],
 ['mystery-echo-rings','Mystery Echo Rings','echo','wordle-first-clue'],
 ['comet-trails','Comet Trails','comet','cross-three-games'],
 ['dream-bubbles','Dream Bubbles','bubbles','quest-first-clue'],
 ['stormlight-bolts','Stormlight Bolts','lightning','hotrod-five-wins'],
 ['tiny-ghost-parade','Tiny Ghost Parade','ghosts','family-puzzle-party']
];
const wrapShoulder=(slot,[id,name,type,paint,accent,achievement_id])=>Object.freeze({
 id,name,slot,achievement_id,animated:true,tags:['mystery','retro','collectible'],
 draw(ctx,t=0){ctx.save();ctx.translate(slot==='companion'?209:44,196);
  if(slot==='companion')pet(ctx,type,paint,accent,t);else prop(ctx,type,paint,accent,t);
  ctx.restore();}
});
const wrapScene=(slot,[id,name,type,achievement_id])=>Object.freeze({
 id,name,slot,achievement_id,animated:true,behind:slot==='effect'&&type==='bubbles',
 tags:['mystery','retro','cinematic'],draw(ctx,t=0){ctx.save();if(slot==='effect')effect(ctx,type,t);else scene(ctx,type,t);ctx.restore();}
});
export const MYSTERY_EXTRAS=Object.freeze([
 ...companionSpecs.map(spec=>wrapShoulder('companion',spec)),
 ...propSpecs.map(spec=>wrapShoulder('prop',spec)),
 ...scenes.map(spec=>wrapScene('background',spec)),
 ...effectSpecs.map(spec=>wrapScene('effect',spec))
]);
