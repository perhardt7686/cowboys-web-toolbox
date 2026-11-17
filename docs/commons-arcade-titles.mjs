import {SKY_COLORS,SKY_COURSE_EDITION} from './skyboard-courses.mjs';
/* Original, game-specific welcome screens for the family-only arcade.
 * Procedural canvas illustrations only, no external media or copied sprites.
 * The existing games and RPCs remain the source of truth after pressing Start. */
export const titleProfiles={
 skyboard:{
  eyebrow:'EMMA’S SKY RACING ADVENTURE · FAMILY ARCADE',
  name:'SKYBOARD SPRINT',tag:'Thirty floating tracks. Six colorful worlds. One champion.',
  subtitle:'Choose a skateboard, snowboard or magical cruiser. Jump gaps, drift past hazards, grab boosts and collect stars all the way to the flag.',
  help:'Choose your board, press Start Stage, and steer with the big left and right buttons or arrow keys. Jump over gaps and barriers using JUMP, Space or Up; hold DRIFT for faster sliding. Aim for the glowing 10× pads. The giant red balls move across the track and knock you backward if you hit them. Verified clears unlock boards and trophies. The optional family ghost comes from a saved race.',
  first:'START RIDING',secondary:[['boards','CHOOSE BOARD'],['awards','TROPHY ROAD'],['leaders','FAMILY RANKS']],
  accent:'#a8f7ff',scene:'skyboard'
 },
 galaga:{
  eyebrow:'MSX CASSETTE · LOCAL MEDIA · FAMILY ARCADE',
  name:'GALAGA',tag:'Classic space attack · load a private cassette.',
  subtitle:'Your MSX cassette is recognized, but this edition cannot boot here until a compatible cassette core is tested.',
  help:'This is the original MSX cassette edition, not the old Star Squadron game with a new name. Its local game loader is pending verified cassette support. Historic Star Squadron scores remain archived. Family scores submitted manually are always labeled unverified.',
  first:'OPEN GALAGA CABINET',secondary:[['achievements','LOCAL GOALS'],['scores','FAMILY SCORES']],accent:'#8cf1da',scene:'galaga'
 },
 pacman:{
  eyebrow:'IBM PC / DOS · LOCAL MEDIA · FAMILY ARCADE',
  name:'PAC-MAN',tag:'The maze classic · private DOS edition.',
  subtitle:'Bring an authorized local DOS game package. Navigate the maze with the directional pad.',
  help:'Choose an authorized DOS ZIP file that contains a bootable game executable. The emulator compatibility is experimental. The original edition keeps its own gameplay. Enter a visible game score to share it as a member-reported, unverified record; no automatic trophies are claimed.',
  first:'OPEN PAC-MAN CABINET',secondary:[['achievements','LOCAL GOALS'],['scores','FAMILY SCORES']],accent:'#f7d77d',scene:'pacman'
 },
 centipede:{
  eyebrow:'ATARI 2600 · LOCAL MEDIA · FAMILY ARCADE',
  name:'CENTIPEDE',tag:'Defend the garden · arcade joystick and fire.',
  subtitle:'Bring an authorized Atari 2600 cartridge file and use the joystick plus FIRE button.',
  help:'Select a private Atari 2600 BIN or A26 game file. The emulator uses a Stella-compatible core. Move using directions, hold FIRE, and use SELECT / RESET for the original console switches. This game never sends the cartridge file to the Family Board.',
  first:'OPEN CENTIPEDE CABINET',secondary:[['achievements','LOCAL GOALS'],['scores','FAMILY SCORES']],accent:'#b7ee9b',scene:'centipede'
 },
 topgear:{
  eyebrow:'SUPER NINTENDO · LOCAL MEDIA · FAMILY ARCADE',
  name:'TOP GEAR',tag:'Race to the finish · steering, pedals and gears.',
  subtitle:'Bring an authorized SNES cartridge file. Use the bottom arcade buttons or a controller.',
  help:'Choose an authorized SFC/SMC file and run it in the SNES emulator. Match its controller layout in Settings, then steer, accelerate, brake and use the game options. Member-reported scores are separate from the original game saves and never labeled replay verified.',
  first:'OPEN TOP GEAR CABINET',secondary:[['achievements','LOCAL GOALS'],['scores','FAMILY SCORES']],accent:'#ffa8ad',scene:'topgear'
 },
 streetrod:{
  eyebrow:'1963 · BUILD THE MACHINE · RACE THE ROAD',
  name:'STREET R0D',tag:'A summer of rust, racing and midnight repairs.',
  subtitle:'Find your car in the classifieds. Bolt it together. Race for the crown.',
  help:'Check the paper, inspect a used car, and purchase it. Pop the hood to tune and operate the real saved bolt workbench. Travel to Bob’s Drive-In to challenge an opponent. Win cash and advance the summer championship.',
  first:'START YOUR SUMMER',secondary:[['garage','GARAGE'],['paper','CLASSIFIEDS'],['diner','BOB’S DRIVE-IN']],
  accent:'#ffc78a',scene:'motor'},
 dashforge:{
  eyebrow:'THE NEXT LEVEL · FAMILY CAMPAIGN',
  name:'DASH FORGE',tag:'Jump into one billion shared stages.',
  subtitle:'Twelve evolving worlds. A different boss every 25 levels. Your next jump matters.',
  help:'Tap or hold with Space or the on-screen action button. The portal changes how you steer, jump, fly, or flip. The Level Studio lets you test from a chosen tile or verify a complete run. The stages and bosses are identical for the entire family. Beat your current stage to progress; every 25th stage is a three-phase boss battle. In Level Creator choose a world and hazards; in Boss Creator build a playable boss arena. Save, beat your draft, and publish it. Your design award depends only on another member’s verified time to solve it.',
  first:'START CAMPAIGN',secondary:[['community','FAMILY LEVELS'],['awards','TROPHIES']],
  accent:'#8beaff',scene:'dash'},
 mahjong:{
  eyebrow:'THE MYSTERY ROAD · MATCH THE PAIRS',
  name:'MAHJONG',tag:'Clear the board. Unlock the next mystery.',
  subtitle:'An illustrated world of tiles, paths, puzzles and prizes.',
  help:'Find two matching tiles. Tiles must be uncovered and free on at least one side. Use pinch or Zoom to inspect the board, and move through the shared campaign to unlock new rewards and trophies.',
  first:'PLAY MAHJONG',secondary:[['levels','LEVEL MAP'],['badges','PRIZES']],
  accent:'#e0d0ff',scene:'tiles'},
 wordle:{
  eyebrow:'ONE DAILY CIPHER · ALL FAMILY MEMBERS',
  name:'W0RDLE',tag:'Crack the code together.',
  subtitle:'Every green letter brings the family closer to today’s solution.',
  help:'Submit valid five-letter guesses. Green letters are in the correct place; gold letters belong elsewhere. Members collaborate on the same daily word and earn individual points for useful letters and solves.',
  first:'UNLOCK TODAY’S WORD',secondary:[['scores','SCOREBOARD'],['awards','ACHIEVEMENTS']],
  accent:'#ccffbb',scene:'letters'},
 wordquest:{
  eyebrow:'ONE DAILY CLUE · TEAM PUZZLE',
  name:'WORD QUEST',tag:'The family’s next word adventure.',
  subtitle:'Think together. Follow the clue. Find the missing word.',
  help:'Read the clue and submit valid five-letter words. Your guesses and solves contribute to shared family progress and personal points. The puzzle changes daily at midnight Eastern.',
  first:'START THE QUEST',secondary:[['scores','LEADERBOARD'],['progress','LEVEL & XP']],
  accent:'#ffe29b',scene:'quest'},
 plates:{
  eyebrow:'PHOTO CHALLENGE · A ROAD TRIP GAME',
  name:'LICENSE PLATES',tag:'Every plate tells a story.',
  subtitle:'Spot unusual plates and challenge the family to interpret them.',
  help:'Post a photo of an interesting plate and describe your interpretation. Another family member reviews the challenge. Agree or send an alternate interpretation; scores and accepted responses are saved in the game.',
  first:'START PLATE HUNT',secondary:[['vote','REVIEW PLATES'],['history','PHOTO GALLERY']],
  accent:'#98e6ff',scene:'road'},
 drawing:{
  eyebrow:'THE FAMILY ART DESK · MAKE SOMETHING',
  name:'DRAWING STUDIO',tag:'Imagination is the whole point.',
  subtitle:'Brushes, layers, colors and a place for every masterpiece.',
  help:'Draw with a touch, stylus or mouse. Open Tools and Layers to change brushes, add layers, undo/redo, pan, zoom, save editable projects or export finished artwork.',
  first:'OPEN YOUR CANVAS',secondary:[],accent:'#ffb9db',scene:'drawing'},
 study:{
  eyebrow:'VIRGINIA CATEGORY 7A · PEST KNOWLEDGE',
  name:'7A STUDY CARDS',tag:'Become the sharpest technician in the room.',
  subtitle:'Practice the identification, safety and control decisions that count.',
  help:'Choose a topic or study mode, reveal each flashcard, then mark whether you need more practice or understood the material. Achievements and study progress are stored on the device; reference official sources from Resources.',
  first:'START STUDYING',secondary:[['awards','MILESTONES'],['sources','STUDY SOURCES']],
  accent:'#b9f3ab',scene:'study'}
};
export function titleMarkup(id){
 const p=titleProfiles[id];if(!p)return '';
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#39;'}[c]));
 return '<div class="arcade-game-title-wrap" data-title-theme="'+id+'">'+
  '<div class="arcade-game-title-image"><canvas id="arcade-game-title-art" width="320" height="200" role="img" aria-label="Original '+safe(p.name)+' game artwork"></canvas>'+
  '<small>ORIGINAL FAMILY ARCADE ARTWORK</small></div>'+
  '<div class="arcade-game-title-copy"><small class="arcade-game-title-eyebrow">'+safe(p.eyebrow)+'</small>'+
  '<h2>'+safe(p.name)+'</h2><strong>'+safe(p.tag)+'</strong>'+
  '<p>'+safe(p.subtitle)+'</p><div class="arcade-game-title-buttons">'+
  '<button class="arcade-title-start" type="button" data-arcade-action="title-start">▶ '+safe(p.first)+'</button>'+
  (id==='dashforge'?'<button type="button" data-arcade-action="title-builder">✎ LEVEL CREATOR</button>'+
    '<button type="button" data-arcade-action="title-boss-builder">♛ BOSS CREATOR</button>':'')+
  p.secondary.map(([scene,label])=>'<button type="button" data-arcade-title-scene="'+safe(scene)+'">'+safe(label)+'</button>').join('')+
  (id==='dashforge'?'<button type="button" data-arcade-action="title-sound" aria-pressed="false">♪ SOUND SETTINGS</button>':'')+
  '<button type="button" data-arcade-action="title-help">? HOW TO PLAY</button>'+
  '<button type="button" data-arcade-action="title-settings">⚙ SETTINGS</button>'+
  '<button type="button" data-arcade-action="title-back">← ALL GAMES</button>'+
  '</div><p class="arcade-title-how" id="arcade-title-how" hidden>'+safe(p.help)+'</p>'+
  '<small class="arcade-title-save-note">Saves, achievements and leaderboards remain with your existing account.</small>'+
  '</div></div>';
}
const animatedTitles=new WeakMap();
function animateTitle(canvas,reducedMotion,draw,cleanup=()=>{}){
 const stop=animatedTitles.get(canvas);stop?.();
 let frame=0,started=null,last=-Infinity;
 const dispose=()=>{cancelAnimationFrame(frame);cleanup();};
 animatedTitles.set(canvas,dispose);
 if(reducedMotion){draw(.12);dispose();animatedTitles.delete(canvas);return;}
 function tick(timestamp){
  if(!canvas.isConnected){dispose();return;}
  started??=timestamp;
  if(timestamp-last>=33){last=timestamp;draw((timestamp-started)/1000);}
  frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
}
async function paintSkyboardTitle(canvas,reducedMotion){
 const token={};canvas.skyboardTitleToken=token;
 try{
  const [{createSkyScene},{buildSkyCourse,createSkyRide,skyTrack}]=await Promise.all([
   import('./skyboard-scene.mjs?v=courses2'),import('./skyboard-physics.mjs?v=courses2')
  ]);
  if(!canvas.isConnected||canvas.skyboardTitleToken!==token)return;
  const board={id:'sunny',color:'#ffbf53',trail:'#fffb9c'},course=buildSkyCourse(1,196930,SKY_COURSE_EDITION);
  const theme=SKY_COLORS[0];
  const renderer=createSkyScene(640,400),state=createSkyRide(course);
  const context=canvas.getContext('2d');
  animateTitle(canvas,reducedMotion,t=>{
   state.progress=66.2+2.25*Math.sin(t*.65);state.x=-1.08;state.lean=-.23;
   state.y=skyTrack(course,state.progress).y+.15;state.boost=1;state.elapsed=t;
   renderer.draw(context,state,theme,board,null);
   context.fillStyle='#291b64';context.fillRect(9,10,96,24);
   context.fillStyle='#ffefa4';context.font='900 15px system-ui';context.fillText('10× SPEED',18,27);
  },()=>renderer.dispose());
 }catch{/* The illustrated title remains available when WebGL is unavailable. */}
}
export function drawGameTitle(canvas,id,reducedMotion=false){
 const stop=canvas&&animatedTitles.get(canvas);if(stop){stop();animatedTitles.delete(canvas);}

 const c=canvas?.getContext('2d');if(!c)return;
 const p=titleProfiles[id]||titleProfiles.streetrod;
 c.imageSmoothingEnabled=false;
 const R=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const L=(x,y,xx,yy,color,w=2)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 const T=(text,x,y,size,color)=>{c.fillStyle=color;c.font='bold '+size+'px monospace';c.fillText(text,x,y)};
 const C=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()};
 const A=p.accent;
 const gradient=c.createLinearGradient(0,0,320,200);
 gradient.addColorStop(0,'#08101f');gradient.addColorStop(1,id==='dashforge'?'#48205c':'#28274c');
 c.fillStyle=gradient;c.fillRect(0,0,320,200);
 for(let i=0;i<36;i++){R((i*71+17)%320,(i*31+11)%190,i%6?1:2,2,i%4?'#4e5486':A);}
 if(id==='skyboard'){
   const bg=c.createLinearGradient(0,0,0,200);bg.addColorStop(0,'#62cbff');bg.addColorStop(1,'#effdff');c.fillStyle=bg;c.fillRect(0,0,320,200);
   C(264,46,22,'#fff2a0');
   for(let i=0;i<9;i++){C((i*53+17)%320,32+(i*39)%90,16,'#fff');C((i*53+32)%320,34+(i*39)%90,12,'#fff');}
   c.fillStyle='#ffe572';c.beginPath();c.moveTo(105,85);c.lineTo(222,85);c.lineTo(310,200);c.lineTo(5,200);c.fill();
   L(105,85,5,200,'#f247ad',7);L(222,85,310,200,'#f247ad',7);
   R(143,114,36,9,'#181b44');R(151,96,18,22,'#5946ae');C(160,87,11,'#edb38f');
   R(147,72,27,9,'#fa6ba4');C(239,109,22,'#a12956');C(236,106,19,'#ed3454');C(231,100,5,'#ffae9b');
   T('10× SPEED',12,33,17,'#343179');T('STAGE 01 / 30',170,185,13,'#463271');
   void paintSkyboardTitle(canvas,reducedMotion);
  }else if(id==='streetrod'){
  R(0,142,320,58,'#26273a');
  for(let i=0;i<9;i++)L(i*46,143,i*62-60,200,'#d29d60',1);
  R(17,39,284,96,'#555769');R(22,43,274,86,'#1a2733');
  R(53,100,217,34,'#b62944');R(71,91,184,12,'#ff8e85');R(111,72,82,25,'#ac3356');
  R(123,75,25,19,'#8bdfff');R(151,75,28,19,'#8bdfff');
  for(const x of [102,230]){C(x,133,21,'#080911');C(x,133,13,'#ccccd6');C(x,133,6,'#333');}
  R(43,114,21,10,'#ffffcb');R(260,113,14,10,'#ffa34c');
  T('SUMMER 1963',93,30,15,'#ffe6a0');
 }else if(id==='dashforge'){
  const draw=t=>{
   c.fillStyle=gradient;c.fillRect(0,0,320,200);
   for(let i=0;i<25;i++)R(((i*61+300-t*7)%320+320)%320,(i*22+17)%139,2,2,i%4?'#655297':'#eec4fb');
   for(let i=0;i<12;i++){const x=i*32-t*8%32;L(x,155,x-24,200,'#8a62cf',1);}
   R(0,155,320,4,'#92f2f8');
   for(const x of [133,185,231]){c.fillStyle='#fe699f';c.beginPath();c.moveTo(x,155);c.lineTo(x+13,123);c.lineTo(x+26,155);c.fill();}
   C(264,68,40,'#a94abc');C(264,68,27,'#190f39');
   for(let i=0;i<8;i++){const an=i*Math.PI/4+t*.52;C(264+Math.cos(an)*31,68+Math.sin(an)*31,6,'#ff83ca');}
   C(256,65,5,'#fff2c4');C(273,65,5,'#fff2c4');
   c.save();c.translate(77,113-Math.abs(Math.sin(t*2.4)) *25);c.rotate(-.19-t*2.3);
   R(-19,-19,38,38,'#8eefff');R(-12,-12,24,24,'#17204c');R(-8,-4,5,6,'#80ecff');R(4,-4,5,6,'#80ecff');c.restore();
   for(const [i,letter] of ['▲','◯','⇅','✦'].entries()){
    R(16+i*32,170,26,22,'#392e69');T(letter,22+i*32,186,13,'#ffe3a0');
   }
   T('LEVEL STUDIO',171,185,13,'#e6e3fa');T('WORLD TRIAL / 25',13,28,12,'#fff29d');
  };
  draw(0);animateTitle(canvas,reducedMotion,draw);
 }else if(id==='galaga'){
  R(0,156,320,44,'#172a46');
  for(let i=0;i<15;i++){const x=16+(i%5)*65,y=27+Math.floor(i/5)*28;
   R(x,y,19,7,i%3?'#87eadb':'#ffb6c5');R(x+6,y+7,8,9,'#667bc0');}
  c.beginPath();c.moveTo(160,111);c.lineTo(187,161);c.lineTo(160,149);
  c.lineTo(134,161);c.closePath();c.fillStyle='#fff1ab';c.fill();
  L(160,110,160,74,'#f6b68f',4);T('SPACE FORMATIONS',72,190,17,'#fff2b8');
 }else if(id==='pacman'){
  for(let y=0;y<6;y++)for(let x=0;x<10;x++){
   if(x===0||y===0||x===9||y===5||(x%3===0&&y%2===0))R(25+x*28,23+y*27,25,8,'#777bea');
   else C(35+x*28,30+y*27,2,'#ffde8a');}
  C(95,110,19,'#fbe189');R(92,105,20,5,'#11162f');
  for(let j=0;j<3;j++){R(205+j*28,94,16,21,['#e6a2be','#92ebee','#f6c98b'][j]);C(209+j*28,101,2,'#13254b');}
  T('MAZE CHALLENGE',70,190,17,'#fff1b1');
 }else if(id==='centipede'){
  R(0,163,320,30,'#182b25');
  for(let i=0;i<11;i++){const x=18+i*27,y=26+(i%3)*29;
   C(x,y,10,i%3?'#c3eaa7':'#9fe8da');C(x-3,y-3,2,'#12334b');}
  for(let i=0;i<15;i++){const x=(i*41+7)%306,y=111+(i*17)%62;
   R(x,y,9,8,'#c7a5df');R(x+3,y-7,3,9,'#71ddb3');}
  R(154,168,18,14,'#ffcc82');L(163,168,163,138,'#fff3bb',4);
  T('GARDEN DEFENSE',60,190,17,'#fff1b1');
 }else if(id==='topgear'){
  R(0,110,320,90,'#29344e');for(let i=0;i<8;i++)L(147+i*12,111,36+i*34,198,'#e2c68a',2);
  R(47,90,104,31,'#a63d5e');R(78,72,56,24,'#f6b7a9');R(87,74,39,18,'#8feafa');
  for(const x of [68,134]){C(x,121,16,'#111328');C(x,121,8,'#eff0e7');}
  R(209,56,73,55,'#2c88bb');R(218,63,54,23,'#b0f5ec');
  T('FULL THROTTLE',64,185,19,'#ffe2aa');
 }else if(id==='mahjong'){
  for(let i=0;i<12;i++){const x=20+(i%4)*72,y=25+Math.floor(i/4)*52;
   R(x+5,y+7,57,40,'#7e72c9');R(x,y,57,40,'#f5eadd');
   R(x+3,y+3,51,34,'#fffaf4');T(['◇','☯','✿','♧'][i%4],x+18,y+29,23,['#075f69','#aa2e58','#2e8a60','#735c9b'][i%4]);}
 }else if(id==='wordle'){
  for(let i=0;i<25;i++){const x=42+(i%5)*47,y=19+Math.floor(i/5)*33,co=['#6dab64','#6dab64','#c7a847','#505b72','#364555'][((i*7+i/5|0)%5)];
   R(x,y,39,29,co);if(i<10)T(['W','O','R','D','S','S','M','A','R','T'][i],x+13,y+22,18,'#fff');}
 }else if(id==='wordquest'){
  R(52,40,100,122,'#f0e3bc');R(160,40,108,122,'#ead5a8');L(156,41,156,163,'#b6a37c',4);
  for(let i=0;i<7;i++){L(65,60+i*13,142,60+i*13,'#a49476',1);L(174,60+i*13,252,60+i*13,'#a49476',1);}
  T('?',205,111,62,'#f6a860');R(82,15,163,22,'#364f7c');T('DAILY QUEST',103,31,13,'#fff');
 }else if(id==='plates'){
  R(0,117,320,83,'#333748');L(158,117,158,200,'#ffe8af',5);
  for(let i=0;i<6;i++)R(157,123+i*16,4,8,'#303848');
  R(61,34,198,78,'#e7f0fb');R(70,40,180,66,'#cbdaf2');R(72,40,178,18,'#2455a0');
  T('COMMONS',115,54,10,'#fff');T('SK0L-63',96,90,29,'#252d47');
  for(const x of [80,239]){C(x,91,5,'#5e6d88');C(x,91,2,'#e8f4ff');}
 }else if(id==='drawing'){
  R(37,25,245,147,'#f8e6d5');R(48,36,223,126,'#fff3e6');
  c.fillStyle='#f4a2c2';c.beginPath();c.arc(110,98,38,0,Math.PI*2);c.fill();
  C(161,80,31,'#ffe39f');C(193,113,24,'#8ddbd7');
  L(36,176,155,68,'#202742',12);L(30,183,149,74,'#e7ca89',5);
  T('DRAW SOMETHING',77,19,14,'#fcd2e3');
 }else if(id==='study'){
  for(let i=0;i<4;i++){R(32+i*13,35+i*9,215,130,'#8b92bc');R(28+i*13,30+i*9,215,130,'#fff0cc');}
  T('CATEGORY 7A',98,78,19,'#36475b');L(93,85,227,85,'#507b88',2);
  C(163,119,18,'#282a43');for(let i=0;i<3;i++){L(145,114+i*12,124,103+i*20,'#282a43',3);L(180,114+i*12,204,103+i*20,'#282a43',3);}
  T('TEST YOUR KNOWLEDGE',62,190,12,'#c2ffbd');
 }
 R(0,193,320,7,A);
 if(!reducedMotion){for(let i=0;i<12;i++){R((i*43+17)%320,187,4,2,A);}}
}
