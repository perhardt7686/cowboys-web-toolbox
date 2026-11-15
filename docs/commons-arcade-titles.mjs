/* Original, game-specific welcome screens for the family-only arcade.
 * Procedural canvas illustrations only, no external media or copied sprites.
 * The existing games and RPCs remain the source of truth after pressing Start. */
export const titleProfiles={
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
  help:'Tap the screen or press Jump/Space when safe tiles reach your cube. The stages and bosses are identical for the entire family. Beat your current stage to progress; every 25th stage is a three-phase boss battle. In Level Creator choose a world and hazards; in Boss Creator build a playable boss arena. Save, beat your draft, and publish it. Your design award depends only on another member’s verified time to solve it.',
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
  '<button type="button" data-arcade-action="title-help">? HOW TO PLAY</button>'+
  '<button type="button" data-arcade-action="title-settings">⚙ SETTINGS</button>'+
  '<button type="button" data-arcade-action="title-back">← ALL GAMES</button>'+
  '</div><p class="arcade-title-how" id="arcade-title-how" hidden>'+safe(p.help)+'</p>'+
  '<small class="arcade-title-save-note">Saves, achievements and leaderboards remain with your existing account.</small>'+
  '</div></div>';
}
export function drawGameTitle(canvas,id,reducedMotion=false){
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
 if(id==='streetrod'){
  R(0,142,320,58,'#26273a');
  for(let i=0;i<9;i++)L(i*46,143,i*62-60,200,'#d29d60',1);
  R(17,39,284,96,'#555769');R(22,43,274,86,'#1a2733');
  R(53,100,217,34,'#b62944');R(71,91,184,12,'#ff8e85');R(111,72,82,25,'#ac3356');
  R(123,75,25,19,'#8bdfff');R(151,75,28,19,'#8bdfff');
  for(const x of [102,230]){C(x,133,21,'#080911');C(x,133,13,'#ccccd6');C(x,133,6,'#333');}
  R(43,114,21,10,'#ffffcb');R(260,113,14,10,'#ffa34c');
  T('SUMMER 1963',93,30,15,'#ffe6a0');
 }else if(id==='dashforge'){
  R(0,158,320,42,'#171630');L(0,158,320,158,'#82ebff',3);
  for(let i=0;i<12;i++){const x=i*28;L(x,158,x-19,200,'#825bce',1);}
  for(const x of [117,170,231]){c.fillStyle='#ff6198';c.beginPath();c.moveTo(x,158);c.lineTo(x+15,118);c.lineTo(x+30,158);c.fill();}
  C(267,70,40,'#a746b8');C(267,70,28,'#190f39');
  for(let i=0;i<8;i++){const an=i*Math.PI/4;C(267+Math.cos(an)*31,70+Math.sin(an)*31,7,'#ff83ca');}
  C(257,66,6,'#fff');C(281,66,6,'#fff');
  c.save();c.translate(74,126);c.rotate(-.24);R(-23,-23,46,46,'#80ecff');R(-13,-13,26,26,'#17204c');R(-9,-6,6,7,'#80ecff');R(4,-6,6,7,'#80ecff');c.restore();
  T('STAGE 25 · BOSS FIGHT',24,30,12,'#fff29d');
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
