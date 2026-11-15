import {INK,PAPER,glint,oval,path,tint} from './avatar-cel-art.mjs?v=cel1';
import {paintAura} from './avatar-prize-actions.mjs?v=turn1';

function spectralSword(c,{angle,progress}){
  c.save();c.rotate(-angle.depth*.43 + (progress==null?0:Math.sin(Math.PI*2*progress)*.57));
  if(progress!=null){
    path(c,[-8,-92],[[34,-97,59,-60,56,-23],[38,-52,16,-61,-8,-70],[-28,-63,-37,-42,-35,-21],
      [-45,-61,-28,-83,-8,-92]],'#9ae1bd80',null);
    glint(c,29,-61,7,'#c0edbe');
  }
  path(c,[-7,-9],[[-5,-67],[7,-93],[16,-65],[9,-9]],'#82b5a3',INK,2.25);
  path(c,[7,-88],[[7,-15],[1,-15],[2,-66],[7,-88]],'#c5ddb3',null);
  path(c,[-19,-13],[[3,-8,19,-17],[20,-8],[0,1,-19,-6]],'#c09956',INK,2.15);
  path(c,[-3,-5],[[6,-5],[6,15],[-3,15]],'#7d5149',INK,1.9);
  oval(c,2,16,6,4,'#d4a660',INK,1.7);
  c.restore();
}

function museumLantern(c,{angle,progress}){
  const w=17-Math.abs(angle.depth)*2.4;
  const swing=progress==null?0:Math.sin(progress*6.28)*.16;
  c.save();c.rotate(swing+angle.depth*.07);
  if(progress!=null)paintAura(c,3,32,70,'#f4bd58',.75);
  path(c,[-9,18],[[-13,-9,-4,-18,2,-14],[11,-19,15,-2,12,18]],null,INK,4.7);
  path(c,[-9,18],[[-13,-9,-4,-18,2,-14],[11,-19,15,-2,12,18]],null,'#c49b57',2.2);
  path(c,[-w,17],[[w,17],[w+2,49],[-w-2,48]],'#e7ad5a',INK,2.7);
  path(c,[-w+4,22],[[w-6,23],[w-4,45],[-w+3,44]],'#f2cf81',INK,1.65);
  path(c,[-4,41],[[2,33,3,26],[12,35,9,40],[2,47,-4,41]],progress==null?'#cb7941':'#fff0aa',INK,1.45);
  path(c,[-w-4,46],[[w+3,48],[w+4,55],[-w-5,53]],'#7d5a45',INK,2.1);
  path(c,[-w-1,13],[[w+1,13],[w+2,20],[-w-1,20]],'#866448',INK,2.2);
  c.restore();
}

function scanner(c,{angle,progress}){
  const x=angle.depth*6;
  if(progress!=null){
    const y=-60+103*progress;
    path(c,[x+17,-9],[[92,y-21],[101,y+18]],'#88d9ba88',null);
    path(c,[x+14,-9],[[102,y]],null,'#c6eed0',2.2);
  }
  path(c,[-15,2],[[-15,-22],[14+x,-33],[24+x,-23],[23+x,5],[-2,12]],'#887652',INK,2.2);
  path(c,[-9,-20],[[11+x,-27],[19+x,-22],[1,-15]],'#c5a972',INK,1.6);
  path(c,[3,-14],[[18+x,-19],[18+x,-3],[3,1]],'#1e4749',INK,1.7);
  path(c,[5,-8],[[10+x,-13],[14+x,-10],[17+x,-15]],null,'#a7d8a1',1.35);
  path(c,[-10,-23],[[-19,-43]],null,INK,3.2);
  oval(c,-19,-43,2.7,2.6,'#d69d67',INK,1);
}

function petFace(c,x,y,across,depth,color){
  const dx=Math.sign(depth)*2.3;
  const set=across>.64?[-7,7]:[5*dx*.48];
  if(across>-.34)for(const at of set){
    oval(c,x+at,y,4.3,5,color,INK,1.4,-.16);
    oval(c,x+at+dx,y+.2,1.6,2.7,INK);
  }
}

function gargoyle(c,{angle,progress,action}){
  const lift=progress==null?0:Math.sin(progress*Math.PI)*(action==='play'?17:5);
  const body='#687887',stone='#9b9a9b',cut='#475064';
  oval(c,3,31,33,5,'#1e223a55');
  c.save();c.translate(angle.depth*4,-lift);
  const spread=progress==null?0:Math.sin(progress*Math.PI)*15;
  for(const side of [-1,1]){
    const reach=side*(40+spread),tip=side*9;
    path(c,[side*15,6],[[side*27,-19,reach,-24],[reach-side*2,-3],[reach-side*13,-6,side*18,15],[tip,17]],
      side*angle.depth<0?body:cut,INK,2.16);
    path(c,[tip,10],[[side*21,-12,reach-side*5,-20]],null,stone,1.5);
  }
  path(c,[-23,23],[[-20,9,-13,4,-9,4],[-3,2,15,4,23,17],[27,22,21,27,13,27],[-7,30,-27,29,-23,23]],
    body,INK,2.6);
  const x=angle.depth*9;
  path(c,[x-18,-9],[[x-21,-20],[x-22,-32],[x-9,-24],[x+7,-23],[x+18,-32],[x+18,-20],
    [x+24,-15,x+20,1,x+10,6],[x-6,9,x-20,3,x-18,-9]],stone,INK,2.4);
  path(c,[x-14,-10],[[x-1,-18,x+10,-16],[x-7,-6,x-12,2,x-14,-10]],body,null);
  petFace(c,x,-7,angle.across,angle.depth,'#f0cf82');
  if(angle.across>-.28)path(c,[x-5,1],[[x+5,3],[x+13,-1]],null,INK,1.6);
  for(const foot of [-13,13]){
    oval(c,foot,24,8,4,stone,INK,1.5);
    path(c,[foot-2,23],[[foot-1,27]],null,cut,1.2);
  }
  if(action==='trick')glint(c,-35,-29,6,'#dcc799');
  c.restore();
}

function fogHound(c,{angle,progress,action}){
  const front=angle.across,p=progress??0;
  const sniff=progress==null?0:Math.sin(p*Math.PI)*(action==='pet'?4:10);
  const x=angle.depth*10;
  oval(c,1,29,39,6,'#171f335a');
  path(c,[-20,9],[[-31,1,-36,-10,-29,-18],[-29,-30,-21,-26,-23,-18],
    [-24,-11,-14,-4,-13,4]],'#4e735f',INK,2.15);
  path(c,[-26,16],[[-25,0,-15,-7,1,-5],[12,-6,23,-8,29,2],[38,18,24,23,8,19],
    [4,25,-1,23,-4,19],[-17,26,-27,23,-26,16]],'#73937b',INK,2.25);
  for(const [lx,ly] of [[-20,14],[-4,15],[15,12],[25,13]]){
    path(c,[lx-3,ly],[[lx+5,ly],[lx+4,27],[lx+11,28],[lx+10,31],[lx-3,31]],'#9bb98c',INK,1.5);
  }
  c.save();c.translate(x,sniff);
  path(c,[3,-11],[[1,-21,8,-28,17,-25],[25,-27,32,-20,30,-13],[35,-13,43,-9,42,-3],
    [39,4,29,2,22,4],[10,6,-2,0,3,-11]],'#8dab85',INK,2.15);
  path(c,[5,-21],[[0,-27,-2,-31,-8,-31],[-13,-23,-8,-7,-2,-2],[5,-1,9,-13,5,-21]],'#415c53',INK,2.1);
  path(c,[11,-2],[[16,2,21,2,28,1]],null,'#cfbc6d',4.5);
  petFace(c,19,-14,front,angle.depth,'#e6ce8e');
  if(front>-.35)oval(c,39,-7,4,3,INK);
  c.restore();
  if(action==='play'||action==='trick'){
    for(let i=0;i<5;i++){
      const w=10+i*5+p*12;
      oval(c,x+24+i*3+p*7,-1-i*4-i*p*2,w,4+i,'#b9ccac26',null,1,-.22);
    }
  }
}

function lampGhost(c,{angle,progress,action}){
  const p=progress??0;
  const hover=action==='play'?Math.sin(p*6.28)*10:0;
  const x=angle.depth*9;
  oval(c,0,31,28,4,'#1a23355c');
  c.save();
  c.translate(x,-9+hover);
  const cloth='#acb9b8',shade='#718994';
  path(c,[-38,27],[[-27,18,-24,9,-25,-3],[-26,-15,-18,-34,-3,-37],
    [17,-40,32,-23,30,-9],[28,9,35,18,40,23],[22,23,24,31,14,24],[2,33,-3,24,-9,25],
    [-17,33,-21,24,-38,27]],cloth,INK,2.5);
  path(c,[-6,-34],[[-22,-27,-23,-9,-15,7],[-13,15,-15,21,-21,25],[-13,27,-7,22,-3,25],
    [-5,11,1,-9,-6,-34]],shade,null);
  petFace(c,angle.depth*8,-15,angle.across,angle.depth,'#e2d498');
  if(action==='trick')paintAura(c,11,11,65,'#f3c67e',.9);
  oval(c,8,15,11,13,'#ac8154',INK,2);
  oval(c,8,14,6,7,action==='trick'?'#f9dd93':'#dfb36d',INK,1.3);
  path(c,[3,8],[[15,9]],null,INK,1.6);
  c.restore();
}

function gremlin(c,{angle,progress,action}){
  const p=progress??0;
  const bob=action==='play'?Math.sin(p*Math.PI)*13:0;
  oval(c,0,33,30,4,'#161c2c60');
  c.save();c.translate(angle.depth*6,-bob);
  const panel='#bb8f58',shaded='#774f48';
  path(c,[-17,18],[[-18,31],[-7,30],[-4,20],[6,20],[9,31],[20,31],[19,15]],shaded,INK,2.2);
  path(c,[-26,-3],[[-22,-12,16,-14,25,-4],[25,13,21,22,3,24],[-19,23,-26,17,-26,-3]],panel,INK,2.45);
  const shift=angle.depth*8;
  path(c,[-20+shift,-8],[[-22+shift,-24],[-28+shift,-30],[-15+shift,-28],[-6+shift,-34],
    [12+shift,-33],[21+shift,-27],[30+shift,-28],[22+shift,-19],[20+shift,-5],
    [4+shift,2],[-20+shift,-8]],'#718773',INK,2.6);
  if(angle.across>-.32){
    petFace(c,shift,-16,angle.across,angle.depth,'#f3cd78');
    path(c,[shift-9,-8],[[shift+1,-3,shift+10,-8]],null,INK,1.7);
  }else{
    for(let i=0;i<3;i++)path(c,[shift-8+i*8,-24],[[shift-8+i*8,-10]],null,shaded,1.8);
  }
  c.save();c.translate(angle.across<0?28:31,6);c.rotate(action==='trick'?p*12.56:angle.depth);
  path(c,[0,0],[[13,0]],null,INK,3.25);
  oval(c,17,-5,5,6,panel,INK,1.7);
  oval(c,17,5,5,6,panel,INK,1.7);
  c.restore();
  if(action==='trick')glint(c,30,-16,5,'#f4db96');
  c.restore();
}

function attic(c,t=0){
  c.fillStyle='#2f303f';c.fillRect(0,0,256,256);
  path(c,[0,0],[[66,40],[66,256],[0,256]],'#453849',null);
  path(c,[256,0],[[200,41],[200,256],[256,256]],'#483b48',null);
  path(c,[0,227],[[128,154],[256,228],[256,256],[0,256]],'#685658',null);
  for(let i=0;i<9;i++)
    path(c,[121,172],[[-32+i*39,256]],null,'#342d3c',1.5);
  path(c,[98,47],[[103,22,140,18,158,46],[158,109],[98,109]],'#7c7778',INK,3.8);
  oval(c,129,53,15,16,'#e2c37d');
  path(c,[128,29],[[128,107]],null,'#4d4a55',2.55);
  path(c,[100,68],[[156,68]],null,'#4d4a55',2.55);
  for(let i=0;i<11;i++)oval(c,(27+i*51)%256,24+(i*13)%131,1.2,.9,'#ead49d70');
  if(t)glint(c,127,48,2+Math.sin(t*2)*1.2,'#ffdf98');
}

const wearables=[
  ['cinder-trench','Cinder Trench Coat','outerwear','maze-sleuth','trench','#9c7657'],
  ['carburetor-jacket','Carburetor Club Jacket','outerwear','hotrod-first-drag','denim','#527286'],
  ['vault-keeper-cape','Vault Keeper Cape','outerwear','maze-labyrinth','cape','#786084'],
  ['phantom-cloak','Phantom Cloak','outerwear','dash-first-boss','cape','#6e8593'],
  ['night-patrol-sweater','Night Patrol Turtleneck','top','wordle-first-solve','turtleneck','#bb713d'],
  ['carnival-stripes','Carnival Stripe Shirt','top','dash-five-levels','striped','#936072'],
  ['copperline-flares','Copperline Flares','bottoms','hotrod-first-run','flares','#ad6846'],
  ['lantern-pleats','Lantern Pleats','bottoms','mahjong-level-three','pleats','#a44d58'],
  ['midnight-a-line','Midnight A-Line Dress','bottoms','wordle-team-three','dress','#605d87'],
  ['switchyard-boots','Switchyard Boots','footwear','dash-twentyfive','highboots','#755141'],
  ['moonlit-straps','Moonlit Strap Shoes','footwear','quest-first-solve','maryjanes','#b07771'],
  ['watchtower-gloves','Watchtower Driving Gloves','hands','plates-first-approval','gloves','#815556'],
  ['casefile-utility-belt','Case File Utility Belt','waist','maze-tracker','utility','#a8834f'],
  ['dockmaster-ascot','Dockmaster Ascot','neckwear','family-friendly-run','ascot','#469080'],
  ['night-dispatch-satchel','Night Dispatch Satchel','back','quest-three-team-days','satchel','#784c41'],
  ['telescope-backpack','Observatory Field Pack','back','fleet-regular','pack','#526b66'],
  ['carnival-visor-plate','Carnival Control Plate','bodypart','fleet-gunner','control','#5e7b73',['robot']],
  ['moorland-heartplate','Moorland Heartplate','bodypart','maze-explorer','plate','#765066',['monster']]
].map(([id,name,slot,achievement_id,cut,color,families])=>({
  id,name,slot,achievement_id,cut,color,families,tags:['wardrobe',cut,...(families||[])],
  action:id==='phantom-cloak'?['breeze','Unfurl cloak','The hem swirls into a phantom shape.','ice']:
    id==='carnival-visor-plate'?['scan','Sweep the visor','The lenses open and sweep a beam across the floor.','mint']:
    ['polish','Show the detail','Light sweeps across the fitted detail.','gold']
}));

const faces=[
  ['bell-tower-gargoyle','Bell-Tower Gargoyle','maze-shadow',gargoyle],
  ['fog-hound','Fog Hound','quest-xp-50',fogHound],
  ['lamp-house-ghost','Lamphouse Ghost','maze-first-clue',lampGhost],
  ['wind-up-gremlin','Wind-Up Gremlin','fleet-scout',gremlin]
].map(([id,name,achievement_id,creature])=>({
  id,name,slot:'companion',achievement_id,creature,tags:['mystery','creature'],animated:true,
  draw(c,time=0){
    c.save();c.translate(210,193);
    creature(c,{angle:{across:.85,depth:.52},time});c.restore();
  }
}));

const held=[
  ['spectral-case-sword','Spectral Case Sword','prop','dash-first-boss',spectralSword,
    ['spark','Draw the light','The blade traces an inked arc of light.','mint']],
  ['museum-lantern','Museum Lantern','offhand','quest-first-clue',museumLantern,
    ['lamp','Light the lantern','The lantern lights the coat and floor. The Fog Hound follows the light.','gold']],
  ['antenna-scanner','Antenna Scanner','offhand','fleet-first-flight',scanner,
    ['scan','Run the scanner','The scanner sweeps a beam across the scene.','ice']]
].map(([id,name,slot,achievement_id,stageDraw,action])=>({
  id,name,slot,achievement_id,stageDraw,action,tags:['gear'],
  draw(c,time){
    c.save();c.translate(44,194);
    stageDraw(c,{angle:{across:.85,depth:.52},time});c.restore();
  }
}));

export const TURNAROUND_REWARDS=Object.freeze([...wearables,...faces,...held,
  {id:'sealed-attic',name:'The Sealed Attic',slot:'background',achievement_id:'mahjong-tilesmith',
    draw:attic,animated:true,tags:['mystery','scene'],
    action:['spark','Light the window','Moonlight drifts through the attic window.','gold']}
]);
