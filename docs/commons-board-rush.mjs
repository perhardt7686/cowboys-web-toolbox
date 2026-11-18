/* Skyboard Sprint: original family board-racing game, dedicated to Emma.
 * Independent original art and obstacle layouts. Existing member identity and
 * Supabase score authority remain in place. Never awards offline wins.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {createSourceHolds,thumbstickAxis} from './family-arcade-touch-input.mjs';
import {DEFAULT_SKY_STEERING,SKY_STEERING_PRESETS,readControlChoice,saveControlChoice,resetControlChoice,steeringWithHysteresis,canvasSteeringDirection} from './family-arcade-player-feel.mjs';
import {SKY_DT,SKY_INPUT,buildSkyCourse,createSkyRide,skyTrack,skyObjectX,stepSky} from './skyboard-physics.mjs?v=courses2';
import {submitArcadeReplay} from './family-arcade-replay.mjs';
import {SKY_COURSE_EDITION,SKY_WORLDS,SKY_COLORS,skyCourseInfo} from './skyboard-courses.mjs';
const host=document.getElementById('conversations'), config=window.COWBOY_COMMUNITY_CONFIG;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STAGES=30, WIDTH=960, HEIGHT=540, HORIZON=110;
const BOARDS=[
 {id:'sunny',title:'Sunny Skater',sub:'Friendly starter · quick turning',speed:1,turn:1.12,need:1,color:'#ffb95b',trail:'#ffed8a',icon:'🛹'},
 {id:'snow',title:'Frost Glider',sub:'Unlocked after Stage 3 · smooth ride',speed:1.04,turn:.91,need:4,color:'#c7f5ff',trail:'#aaf8fa',icon:'🏂'},
 {id:'rocket',title:'Rocket Ripple',sub:'Unlocked after Stage 6 · extra speed',speed:1.12,turn:.94,need:7,color:'#ff708b',trail:'#fb94b8',icon:'🚀'},
 {id:'flower',title:'Flower Power',sub:'Unlocked after Stage 10 · nimble control',speed:1.01,turn:1.3,need:11,color:'#ffafe0',trail:'#fbe79a',icon:'🌸'},
 {id:'dragon',title:'Dragon Cruiser',sub:'Unlocked after Stage 18 · championship deck',speed:1.13,turn:1.12,need:19,color:'#8dffb7',trail:'#77eeab',icon:'🐉'},
 {id:'star',title:'Starlight Legend',sub:'Unlocked after Stage 30 · victory reward',speed:1.17,turn:1.18,need:31,color:'#e3b8ff',trail:'#c2acff',icon:'🌟'}
];
const BADGES=[
 ['first','First Flight','Finish your first stage','🥇',1],
 ['five','Rolling Star','Clear five stages','⭐',6],
 ['ten','Sky Surfer','Clear ten stages','🌈',11],
 ['fifteen','Ramp Ranger','Clear fifteen stages','🦊',16],
 ['twenty','Speed Artist','Clear twenty stages','⚡',21],
 ['finish','Skyboard Champion','Finish all thirty stages','🏆',31],
 ['boost-master','Tenfold Trailblazer','Finish after completing a full 10× boost','⚡',0],
 ['ball-survivor','Red Ball Comeback','Recover from a red ball and finish the stage','🔴',0]
];
let client=null,user=null,root=null,profile=null,leaders=[],awards=[],open=false,booted=false;
let selectedBoard='sunny',currentScene='play',run=null,request=0,last=0,busy=false;
const held=createSourceHolds(['left','right','drift','brake']);
let steeringPreset=DEFAULT_SKY_STEERING,stickDirection=0,canvasDirection=0;
let stickPointer=null,canvasSteerPointer=null,canvasSteerOrigin=0;
function resetSkyControls(){
 held.clear();jumpQueued=false;stickPointer=null;canvasSteerPointer=null;canvasSteerOrigin=0;
 stickDirection=0;canvasDirection=0;
 const stick=$('skyboard-thumbstick');if(stick){stick.classList.remove('pressed');stick.setAttribute('aria-valuenow','0');}
 const knob=stick?.querySelector('.arcade-stick-knob');if(knob)knob.style.transform='translate3d(0,0,0)';
 root?.querySelectorAll('[data-sky-hold],[data-sky-action="jump"]').forEach(el=>el.classList.remove('pressed'));
}
let practiceChoice=0,practiceSeed=null;
let scene=null,createSkyScene=null,sceneLoading=false,compatibility=false,jumpQueued=false,accumulator=0,preview=null,showGhost=true,shareReplay=false,riderLook=null;
const status=(message,isError=false)=>{const node=$('skyboard-status');if(node){node.textContent=message;node.dataset.error=String(isError)}};
const boardType=()=>BOARDS.find(b=>b.id===selectedBoard)||BOARDS[0];
const stage=()=>Math.max(1,Math.min(31,Number(profile?.stage||1)));
const available=b=>stage()>=b.need;
const active=()=>!host.hidden&&document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='skyboard';
function palette(n){return SKY_COLORS[Math.floor((n-1)/5)%SKY_COLORS.length];}
const currentCourse=()=>practiceChoice||Math.min(30,stage());
function build(){
 if(root?.isConnected)return;
 const main=host.querySelector('.community-main');if(!main)return;
 root=document.createElement('section');root.id='skyboard-root';root.className='skyboard-root';
 root.innerHTML='<button type="button" id="skyboard-toggle" class="skyboard-entry" aria-expanded="false" aria-controls="skyboard-inside">'+
 '<span class="skyboard-entry-symbol" aria-hidden="true">🛹</span><span><strong>Skyboard Sprint</strong><small>Emma’s colorful 30-stage board adventure · Family Arcade</small></span><b>PLAY ▶</b></button>'+
 '<div id="skyboard-inside" class="skyboard-inside" hidden>'+
 '<div class="skyboard-top"><div><span class="skyboard-kicker">FAMILY ARCADE · EMMA’S EDITION</span>'+
 '<h2>SKYBOARD <em>SPRINT</em></h2><p>Pick your board. Ride the sky. Reach all thirty finish lines!</p></div>'+
 '<div class="skyboard-stats"><span id="skyboard-stage">STAGE 01 / 30</span><span id="skyboard-points">0 PTS</span><span id="skyboard-coins">0 ★</span></div></div>'+
 '<nav id="skyboard-mini-nav" class="skyboard-tabs" aria-label="Skyboard sections">'+
 '<button type="button" data-sky-scene="play">RIDE</button><button type="button" data-sky-scene="boards">BOARD SHOP</button>'+
 '<button type="button" data-sky-scene="awards">TROPHIES</button><button type="button" data-sky-scene="leaders">FAMILY RANKS</button></nav>'+
 '<section id="skyboard-play" class="skyboard-pane"><div class="skyboard-game-head">'+
 '<div><strong id="skyboard-world">Sunshine Skyway</strong><small id="skyboard-level-desc">Stage 1 · Training slopes</small></div>'+
 '<button type="button" id="skyboard-start" class="skyboard-primary">▶ START STAGE</button></div>'+
 '<div id="skyboard-viewport" class="skyboard-viewport"><canvas id="skyboard-canvas" width="960" height="540" role="img" aria-label="Third-person board race with ramps, gaps, moving platforms and red balls"></canvas>'+
 '<div class="skyboard-hud"><span id="skyboard-live-stage">01 / 30</span><span id="skyboard-live-distance">0%</span><span id="skyboard-live-lives">♥♥♥</span><span id="skyboard-live-coins">★ 0</span></div>'+
 '<div id="skyboard-speed" class="skyboard-speed" hidden></div>'+
 '<div class="skyboard-progress" aria-hidden="true"><span id="skyboard-progress-fill"></span></div>'+
 '<div class="skyboard-driving-hud" aria-live="off"><span id="skyboard-live-speed">100% PACE</span><span id="skyboard-live-drive">GRIP</span><span id="skyboard-live-ghost" hidden></span></div>'+
 '<div id="skyboard-message" class="skyboard-message"><strong>READY TO RIDE?</strong><p>Pick a board and press Start Stage.</p></div></div>'+
 '<div class="skyboard-touch arcade-control-deck" role="group" aria-label="Skyboard arcade controls">'+
 '<div class="arcade-stick-station"><div class="arcade-stick-pair">'+
 '<button data-sky-hold="left" type="button" aria-label="Joystick left" aria-describedby="skyboard-steer-label">◀</button>'+
 '<div id="skyboard-thumbstick" class="skyboard-thumbstick" role="slider" tabindex="0" aria-label="Steering thumbstick: drag left or right" aria-valuemin="-1" aria-valuemax="1" aria-valuenow="0">'+
 '<span class="skyboard-stick-ring" aria-hidden="true"><span class="arcade-stick-knob">●</span></span></div>'+
 '<button data-sky-hold="right" type="button" aria-label="Joystick right" aria-describedby="skyboard-steer-label">▶</button></div>'+
 '<span id="skyboard-steer-label" class="arcade-button-caption">JOYSTICK · STEER</span><small class="arcade-keyboard-hint">← / → or A / D</small></div>'+
 '<div class="arcade-action-cluster">'+
 '<div class="arcade-key-station"><button data-sky-action="jump" type="button" class="skyboard-jump arcade-button-a" aria-label="Arcade A, jump" aria-describedby="skyboard-jump-label"><span>A</span></button>'+
 '<span id="skyboard-jump-label" class="arcade-button-caption">JUMP</span><small class="arcade-keyboard-hint">SPACE</small></div>'+
 '<div class="arcade-key-station"><button data-sky-hold="drift" type="button" class="arcade-button-b" aria-label="Arcade B, hold to drift" aria-describedby="skyboard-drift-label"><span>B</span></button>'+
 '<span id="skyboard-drift-label" class="arcade-button-caption">DRIFT</span><small class="arcade-keyboard-hint">SHIFT</small></div>'+
 '<div class="arcade-key-station"><button data-sky-hold="brake" type="button" class="arcade-button-c" aria-label="Arcade C, hold to brake" aria-describedby="skyboard-brake-label"><span>C</span></button>'+
 '<span id="skyboard-brake-label" class="arcade-button-caption">BRAKE</span><small class="arcade-keyboard-hint">↓</small></div></div>'+ 
 '<details class="skyboard-player-settings"><summary>STEERING FEEL</summary><label for="skyboard-steering-choice">Touch sensitivity</label>'+ 
 '<select id="skyboard-steering-choice" aria-label="Skyboard steering sensitivity"><option value="quick">Quick</option><option value="balanced">Balanced</option><option value="steady">Steady</option></select>'+ 
 '<button type="button" id="skyboard-steering-reset">Reset</button><small>Saved only for this family member on this device. Race physics stays the same.</small></details></div>'+
 '<div class="skyboard-help">Steer with ← →, jump with Space, drift with Shift and brake with ↓. A gamepad uses the stick, A to jump, X to drift and B to brake.</div>'+
 '<div class="skyboard-round-actions"><button type="button" id="skyboard-pause">PAUSE</button>'+
 '<button type="button" id="skyboard-retry">RETRY STAGE</button><button type="button" id="skyboard-ghost" aria-pressed="true">Family ghost on</button><button type="button" id="skyboard-share" aria-pressed="false">Share my ghost</button><button type="button" id="skyboard-next" hidden>NEXT STAGE ▶</button></div>'+
 '<details id="skyboard-courses" class="skyboard-courses"><summary>Course map &amp; practice</summary>'+
 '<div class="skyboard-map-actions"><button type="button" data-sky-practice="clear">Return to current stage</button>'+
 '<button type="button" data-sky-practice="shuffle">Shuffle a practice layout</button></div><div id="skyboard-course-map"></div></details></section>'+
 '<section id="skyboard-boards" class="skyboard-pane" hidden><h3>CHOOSE YOUR RIDE</h3><p>Earn new boards by completing stages. No purchases, no ads, just family prizes.</p><div id="skyboard-board-list" class="skyboard-board-grid"></div></section>'+
 '<section id="skyboard-awards" class="skyboard-pane" hidden><h3>EMMA’S TROPHY ROAD</h3><p>Milestone awards are recorded on your family member account.</p><div id="skyboard-badge-list" class="skyboard-badge-grid"></div></section>'+
 '<section id="skyboard-leaders" class="skyboard-pane" hidden><h3>FAMILY LEADERBOARD</h3><p>Saved family progress, ordered by cleared stages and points.</p><div id="skyboard-leader-list" class="skyboard-leader-list"></div></section>'+
 '<p id="skyboard-status" class="skyboard-status" role="status" aria-live="polite">Choose a board and take your first ride.</p></div>';
 const base=$('dash-forge-root');if(base&&main.contains(base))base.after(root);else main.append(root);
 $('skyboard-toggle').addEventListener('click',()=>{
   open=!open;$('skyboard-inside').hidden=!open;$('skyboard-toggle').setAttribute('aria-expanded',String(open));
   if(open){render();draw();void refresh();}else pause(true);
 });
 root.addEventListener('click',e=>{
  const tab=e.target.closest('[data-sky-scene]');
  if(tab){choose(tab.dataset.skyScene);return;}
  const route=e.target.closest('[data-sky-practice]');
  if(route){choosePractice(route.dataset.skyPractice);return;}
  const pick=e.target.closest('[data-sky-board]');
  if(pick){pickBoard(pick.dataset.skyBoard);return;}
  if(e.target.closest('[data-sky-action="jump"]')&&e.detail===0)jump();
 });
 $('skyboard-start').addEventListener('click',()=>void start());
 $('skyboard-retry').addEventListener('click',()=>void start(true));
 $('skyboard-next').addEventListener('click',()=>void start());
 $('skyboard-pause').addEventListener('click',()=>pause());
 const steeringSelect=$('skyboard-steering-choice');steeringSelect.value=steeringPreset;
 steeringSelect.addEventListener('change',()=>{
  if(!user)return;
  steeringPreset=Object.hasOwn(SKY_STEERING_PRESETS,steeringSelect.value)?steeringSelect.value:DEFAULT_SKY_STEERING;
  resetSkyControls();
  const saved=saveControlChoice(localStorage,'skyboard',user,steeringPreset);
  status('Steering '+SKY_STEERING_PRESETS[steeringPreset].label+(saved?' saved for this member.':' active for this session (storage unavailable).'));
 });
 $('skyboard-steering-reset').addEventListener('click',()=>{
  if(!user)return;
  steeringPreset=DEFAULT_SKY_STEERING;steeringSelect.value=steeringPreset;
  resetSkyControls();resetControlChoice(localStorage,'skyboard',user);
  status('Steering sensitivity reset to Balanced.');
 });
 $('skyboard-ghost').addEventListener('click',e=>{
  showGhost=!showGhost;e.target.setAttribute('aria-pressed',String(showGhost));
  e.target.textContent=showGhost?'Family ghost on':'Family ghost off';draw();
  if(showGhost&&run?.ghost)status('Asynchronous ghost · '+run.ghost.name+'’s saved race.');
 });
  $('skyboard-share').setAttribute('aria-pressed',String(shareReplay));
 $('skyboard-share').addEventListener('click',async e=>{
  shareReplay=!shareReplay;e.target.setAttribute('aria-pressed',String(shareReplay));
  try{localStorage.setItem('skyboard-share-'+user,shareReplay?'yes':'no');}catch{}
  if(shareReplay){status('New verified races can appear as ghosts for approved family members.');return;}
  e.target.disabled=true;
  try{await rpc('community_boardride_unshare_replays');status('Your replays are private.');}
  catch(error){status('New replays will stay private. Existing shared replays could not be removed. '+error.message,true);}
  finally{e.target.disabled=false;}
 });
 // Every input owns its own pointer; sliding off a button does not cancel a hold.
 root.querySelectorAll('[data-sky-hold],[data-sky-action="jump"]').forEach(b=>{
  const action=b.dataset.skyHold||'jump',pointers=new Set();
  b.style.touchAction='none';
  b.addEventListener('pointerdown',e=>{
   if(!run||run.done||run.paused||(e.pointerType==='mouse'&&e.button!==0))return;
   e.preventDefault();
   const source='button:'+action+':'+e.pointerId;
   pointers.add(e.pointerId);b.classList.add('pressed');
   if(action==='jump')jump();else held.hold(action,source);
   try{b.setPointerCapture(e.pointerId)}catch{}
  },{passive:false});
  const release=e=>{
   if(!pointers.delete(e.pointerId))return;
   if(action!=='jump')held.release(action,'button:'+action+':'+e.pointerId);
   if(!pointers.size)b.classList.remove('pressed');
  };
  for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,release);
 });
 const stick=$('skyboard-thumbstick'),knob=stick.querySelector('.arcade-stick-knob');
 const steer=e=>{
  if(e.pointerId!==stickPointer)return;
  const rect=stick.getBoundingClientRect();
  const axis=thumbstickAxis(e.clientX,rect.left+rect.width/2,Math.max(22,rect.width*.35),0);
  const direction=steeringWithHysteresis(axis,stickDirection,steeringPreset);stickDirection=direction;
  held.release('left','thumbstick');held.release('right','thumbstick');
  if(direction<0)held.hold('left','thumbstick');
  if(direction>0)held.hold('right','thumbstick');
  const travel=Math.max(0,(rect.width-knob.getBoundingClientRect().width)/2-3);
  knob.style.transform='translate3d('+Math.round(axis*travel)+'px,0,0)';
  stick.setAttribute('aria-valuenow',String(direction));
 };
 stick.addEventListener('pointerdown',e=>{
  if(!run||run.done||run.paused||stickPointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;
  e.preventDefault();stickPointer=e.pointerId;stick.classList.add('pressed');
  try{stick.setPointerCapture(e.pointerId)}catch{}
  steer(e);
 },{passive:false});
 stick.addEventListener('pointermove',steer);
 const stopStick=e=>{
  if(stickPointer!==e.pointerId)return;
  stickPointer=null;stickDirection=0;held.releaseSource('thumbstick');stick.classList.remove('pressed');
  knob.style.transform='translate3d(0,0,0)';stick.setAttribute('aria-valuenow','0');
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,stopStick);
 stick.addEventListener('keydown',e=>{
  if(!run||run.done||run.paused)return;
  if(e.code==='ArrowLeft'||e.code==='ArrowRight'){
   e.preventDefault();held.hold(e.code==='ArrowLeft'?'left':'right','stick-key:'+e.code);
   stick.setAttribute('aria-valuenow',e.code==='ArrowLeft'?'-1':'1');
  }
 });
 stick.addEventListener('keyup',e=>{
  if(e.code==='ArrowLeft'||e.code==='ArrowRight'){
   held.release(e.code==='ArrowLeft'?'left':'right','stick-key:'+e.code);
   stick.setAttribute('aria-valuenow','0');
  }
 });
 const canvas=$('skyboard-canvas');
 const steerCanvas=e=>{
  if(e.pointerId!==canvasSteerPointer)return;
  const dx=e.clientX-canvasSteerOrigin;
  canvasDirection=canvasSteeringDirection(dx,canvasDirection,steeringPreset);
  held.releaseSource('canvas');
  if(canvasDirection>0)held.hold('right','canvas');
  else if(canvasDirection<0)held.hold('left','canvas');
 };
 canvas.addEventListener('pointerdown',e=>{
  if(!run||run.done||run.paused||canvasSteerPointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;
  e.preventDefault();canvasSteerPointer=e.pointerId;canvasSteerOrigin=e.clientX;
  try{canvas.setPointerCapture(e.pointerId)}catch{}
 },{passive:false});
 canvas.addEventListener('pointermove',steerCanvas);
 const stopCanvas=e=>{
  if(e.pointerId!==canvasSteerPointer)return;
  canvasSteerPointer=null;canvasSteerOrigin=0;canvasDirection=0;held.releaseSource('canvas');
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,stopCanvas);
 render();draw();
}
function choose(next){
 if(!['play','boards','awards','leaders'].includes(next))return;
 if(next!=='play'&&run&&!run.done)pause(true);
 currentScene=next;
 if(active()&&document.body.dataset.arcadeScene!==next)document.body.dataset.arcadeScene=next;
 render();
}
function pickBoard(id){
 const b=BOARDS.find(x=>x.id===id);if(!b)return;
 if(!available(b)){status('Unlock '+b.title+' by reaching stage '+b.need+'.');return;}
 if(run&&!run.done){status('Finish or leave the current run before changing boards.');return;}
 selectedBoard=id;try{localStorage.setItem('skyboard-board-'+user,id)}catch{}
 render();draw();status(b.title+' equipped. Ready to roll!');
}
function choosePractice(choice){
 if(busy)return;
 const n=choice==='shuffle'?currentCourse():Number(choice);
 if(choice!=='clear'&&(!Number.isInteger(n)||n<1||n>Math.min(30,stage())))return;
 reset();
 practiceChoice=choice==='clear'?0:n;
 practiceSeed=choice==='shuffle'?crypto.getRandomValues(new Uint32Array(1))[0]%2000000000:null;
 $('skyboard-courses').open=false;
 render();draw();
 status(practiceChoice?'Practice · '+skyCourseInfo(practiceChoice).name:'Ready to race your current stage.');
}
function render(){
 if(!root?.isConnected)return;
 $('skyboard-stage').textContent='STAGE '+String(Math.min(30,stage())).padStart(2,'0')+' / 30';
 $('skyboard-points').textContent=Number(profile?.points||0).toLocaleString()+' PTS';
 $('skyboard-coins').textContent=Number(profile?.coins||0)+' ★';
 const n=currentCourse(),course=skyCourseInfo(n);
 $('skyboard-world').textContent=course.name;
 $('skyboard-level-desc').textContent=course.world+' · '+course.description;
 $('skyboard-start').textContent=practiceChoice||stage()>30?'▶ PRACTICE':'▶ START STAGE';
 const map=$('skyboard-course-map');
 map.innerHTML=SKY_WORLDS.map((world,group)=>'<section><h4>'+esc(world.name)+'</h4><ol>'+
  world.routes.map((name,route)=>{
   const index=group*5+route+1,locked=index>stage();
   return '<li><button type="button" data-sky-practice="'+index+'" '+(locked?'disabled':'')+
    '><span>'+String(index).padStart(2,'0')+'</span>'+esc(name)+(locked?' <small>Locked</small>':'')+'</button></li>';
  }).join('')+'</ol></section>').join('');
 $('skyboard-next').hidden=true;
 for(const s of ['play','boards','awards','leaders'])$('skyboard-'+s).hidden=s!==currentScene;
 root.querySelectorAll('[data-sky-scene]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.skyScene===currentScene)));
 $('skyboard-board-list').innerHTML=BOARDS.map(b=>'<button type="button" class="skyboard-board-card" data-sky-board="'+b.id+'" aria-pressed="'+(selectedBoard===b.id)+'" '+(available(b)?'':'disabled')+'>'+
   '<span class="skyboard-board-icon">'+b.icon+'</span><strong>'+esc(b.title)+'</strong><small>'+esc(b.sub)+'</small>'+
   '<span class="skyboard-board-state">'+(available(b)?(selectedBoard===b.id?'✓ EQUIPPED':'EQUIP'):'🔒 STAGE '+b.need)+'</span></button>').join('');
 const earned=new Set(awards.map(a=>a.badge));
 $('skyboard-badge-list').innerHTML=BADGES.map(([id,title,desc,icon,need])=>'<article class="skyboard-badge'+(earned.has(id)?' earned':'')+'">'+
  '<span>'+icon+'</span><div><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></div><b>'+(earned.has(id)?'EARNED':'LOCKED')+'</b></article>').join('');
 $('skyboard-leader-list').innerHTML=leaders.length?leaders.map((entry,i)=>
  '<div class="skyboard-leader"><b>#'+(i+1)+'</b><strong>'+esc(entry.name)+(entry.user_id===user?' (you)':'')+'</strong>'+
  '<span>Stage '+Math.min(30,Number(entry.stage||1))+'/30</span><small>'+Number(entry.points||0).toLocaleString()+' pts · '+Number(entry.clears||0)+' clears</small></div>').join(''):
  '<p>Complete a stage to put your name on the family leaderboard.</p>';
}
async function rpc(name,args={}){
 if(!client||!user)throw Error('Your family login is unavailable.');
 const {data,error}=await client.rpc(name,args);
 if(error)throw Error(error.message||'The family game server is unavailable.');
 return data;
}
function shareFamilyRanks(owner){
 window.dispatchEvent(new CustomEvent('family-arcade-game-rankings',{detail:{member:owner,game:'skyboard',
  entries:leaders.map((entry,index)=>({rank:index+1,name:entry.name,score:entry.points,
   mine:entry.user_id===owner}))}}));
}
async function refresh(){
 if(!user||!root?.isConnected||busy)return;
 try{
  const owner=user,data=await rpc('community_boardride_state');
  if(owner!==user||host.hidden||!root?.isConnected)return;
  profile=data.mine||null;leaders=data.leaders||[];awards=data.badges||[];
  shareFamilyRanks(owner);
  if(stage()<boardType().need)selectedBoard='sunny';
  render();
 }catch(e){status('Your saved progress could not load: '+e.message,true);}
}
function reset(){
 if(request){cancelAnimationFrame(request);request=0;}
 resetSkyControls();last=accumulator=0;run=null;preview=null;
 const next=$('skyboard-next'),startButton=$('skyboard-start'),pauseButton=$('skyboard-pause'),message=$('skyboard-message');
 if(next)next.hidden=true;if(startButton)startButton.disabled=false;
 if(pauseButton)pauseButton.textContent='PAUSE';
 if(message){message.innerHTML='<strong>READY TO RIDE?</strong><p>Pick a board and press Start Stage.</p>';message.hidden=false;}
}
async function start(retry=false){
 if(busy||!user||host.hidden)return;
 if(run&&!run.done&&!retry)return;
 if(run)reset();
 busy=true;$('skyboard-start').disabled=true;
 status('Preparing your course and saved family checkpoint…');
 const n=currentCourse(),pick=boardType();
 const b={...pick,look:riderLook,trail:riderLook?.trail||pick.trail};
 let seed=practiceSeed??(Math.imul(n,212561)^196930),id=null,practice=false,ghost=null,edition=SKY_COURSE_EDITION,unavailable='';
 try{
  if(practiceChoice||stage()>30)practice=true;
  else{
   const data=await rpc('community_boardride_start_v3',{p_board:b.id,p_share:shareReplay});
   if(Number(data.stage)!==n)throw Error('Your stage changed. Refresh and try again.');
   id=data.run_id;seed=Number(data.seed);ghost=data.ghost||null;edition=Number(data.edition||1);
  }
 }catch(e){
  practice=true;unavailable=e.message;
 }
 const course=buildSkyCourse(n,seed,edition);
 run=Object.assign(createSkyRide(course,b.id),{
  stage:n,id,seed,practice,board:b,paused:false,theme:palette(n),trace:[],lastInput:0,ghost,announced:false,countdown:1.75
 });
 busy=false;$('skyboard-start').disabled=false;$('skyboard-next').hidden=true;
 $('skyboard-message').hidden=true;$('skyboard-pause').textContent='PAUSE';
 if(unavailable)status('Official race unavailable. Practice ride · '+unavailable,true);
 else status(practice?'Practice ride · results stay on this device.':
   ghost&&showGhost?'Asynchronous ghost · '+ghost.name+'’s saved race.':'Stage '+n+' · race to the finish!');
 last=accumulator=0;draw();request=requestAnimationFrame(frame);
}
function jump(){
 if(run&&!run.done&&!run.paused&&active())jumpQueued=true;
}
function pause(silent=false){
 resetSkyControls();
 if(!run||run.done)return;
 run.paused=silent?true:!run.paused;
 $('skyboard-pause').textContent=run.paused?'RESUME':'PAUSE';
 if(run.paused&&request){cancelAnimationFrame(request);request=0;}
 if(!run.paused&&!request){last=0;request=requestAnimationFrame(frame);}
 if(!silent)status(run.paused?'Race paused.':'Back on the board!');
}
function inputMask(){
 let mask=0;
 for(const action of held)mask|=SKY_INPUT[action]||0;
 const pads=navigator.getGamepads?.();
 const pad=pads&&Array.from(pads).find(p=>p?.connected);
 if(pad){
  if(pad.axes[0]<-.28||pad.buttons[14]?.pressed)mask|=SKY_INPUT.left;
  if(pad.axes[0]>.28||pad.buttons[15]?.pressed)mask|=SKY_INPUT.right;
  if(pad.buttons[0]?.pressed)mask|=SKY_INPUT.jump;
  if(pad.buttons[2]?.pressed)mask|=SKY_INPUT.drift;
  if(pad.buttons[1]?.pressed)mask|=SKY_INPUT.brake;
 }
 if(jumpQueued){mask|=SKY_INPUT.jump;jumpQueued=false;}
 return mask;
}
function tick(){
 const mask=inputMask();
 if(mask!==run.lastInput){run.trace.push([run.tick,mask]);run.lastInput=mask;}
 stepSky(run,mask);
 if(run.event==='ball-hit')status('Red ball hit! Recover and keep riding.');
 if(run.event==='fall')status(run.lives?'Back at your checkpoint · '+run.lives+' hearts left.':'No hearts left. Retry the stage.');
 if(run.done)void finish(run.won);
}
function ghostPosition(r){
 const frames=showGhost&&r.ghost?.frames;
 if(!Array.isArray(frames)||frames.length<2)return null;
 const index=Math.min(frames.length-2,Math.max(0,Math.floor(r.tick/12)-1));
 const a=frames[index],b=frames[index+1];
 const mix=Math.min(1,Math.max(0,(r.tick-a[0])/Math.max(1,b[0]-a[0])));
 if(r.tick>b[0]+18&&index===frames.length-2)return null;
 return {z:(a[1]+(b[1]-a[1])*mix)/100,x:(a[2]+(b[2]-a[2])*mix)/100,y:(a[3]+(b[3]-a[3])*mix)/100};
}
async function finish(win){
 if(!run||run.announced)return;
 const snapshot=run;run.announced=run.done=true;if(request){cancelAnimationFrame(request);request=0;}
 resetSkyControls();
 const message=$('skyboard-message');message.hidden=false;
 message.innerHTML='<strong>'+(win?'FINISH LINE!':'TRY AGAIN!')+'</strong><p>'+
  (win?'You reached the flag with '+snapshot.coins+' stars!':'The track won this round. You can do it!')+'</p>';
 if(!win){status('Retry the stage. Your checkpoint is safe.');return;}
 if(snapshot.practice||!snapshot.id){
  status('Practice finish! Nice ride. Connect to save an official family result.');
  return;
 }
 busy=true;status('Saving your finish and checking milestone prizes…');
 try{
  const result=await submitArcadeReplay(client,config,'skyboard',snapshot.id,snapshot.trace);
  message.innerHTML='<strong>STAGE '+snapshot.stage+' CLEAR!</strong><p>+'+
   Number(result.points||0).toLocaleString()+' points · '+snapshot.coins+' stars · '+(snapshot.elapsed).toFixed(1)+' seconds</p>';
  await refreshAfterWin();
  $('skyboard-next').hidden=stage()>30;
  status('Saved to your family account! '+(result.new_badges?.length?'New trophies: '+result.new_badges.map(id=>BADGES.find(entry=>entry[0]===id)?.[1]||id).join(', '):'Next stage unlocked.'));
  document.dispatchEvent(new Event('family-game-score-changed'));
 }catch(e){status('Finish could not be verified or saved: '+e.message,true);message.innerHTML+='<p>Your result was not added to the family leaderboard.</p>';}
 finally{busy=false;}
}
async function refreshAfterWin(){
 try{
  const owner=user,data=await rpc('community_boardride_state');
  if(owner!==user||host.hidden||!root?.isConnected)return;
  profile=data.mine||profile;leaders=data.leaders||[];awards=data.badges||[];render();shareFamilyRanks(owner);
 }catch(e){status('Stage saved, but refreshing the family scoreboard failed.');}
}
function text(c,t,x,y,size,color='#fff',align='center',weight=800){
 c.textAlign=align;c.fillStyle=color;c.font=weight+' '+size+'px system-ui,sans-serif';c.fillText(t,x,y);
}
function circle(c,x,y,r,fill){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function poly(c,points,color,stroke='',line=2){c.beginPath();c.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))c.lineTo(p[0],p[1]);c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function sky(c,p,t){
 const g=c.createLinearGradient(0,0,0,HEIGHT);g.addColorStop(0,p.sky[0]);g.addColorStop(.7,p.sky[1]);g.addColorStop(1,p.sky[1]);c.fillStyle=g;c.fillRect(0,0,WIDTH,HEIGHT);
 circle(c,820,90,48,'#fff8c5aa');circle(c,820,90,35,'#fffbdf');
 const env=p.env;
 for(let i=0;i<24;i++){
  const x=((i*183+58+Math.sin(t*.02)*7)%1200)-120,y=38+(i*71)%125,s=.5+(i%4)*.26;
  if(env==='cloud'||env==='palm'||env==='forest'){circle(c,x,y,27*s,'#ffffffa3');circle(c,x+20*s,y-5*s,19*s,'#ffffffa3');circle(c,x-19*s,y+4*s,17*s,'#ffffffa3');}
  if(env==='city'){c.fillStyle=i%2?'#3e3b81':'#5a55a7';c.fillRect(x,155-(i%6)*18,54,200);for(let j=0;j<4;j++)c.fillRect(x+7+j*11,160-(i%6)*18,4,6);}
  if(env==='canyon'){poly(c,[[x,220],[x+12,150-(i%3)*22],[x+55,155],[x+74,220]],i%2?'#ce7bc3':'#ec9a94');}
  if(env==='ice'){poly(c,[[x,215],[x+19,150-(i%3)*19],[x+45,214]],i%2?'#d7f7ff':'#a8e1fa');}
 }
}
function project(r,x,z,y=0){
 const t=skyTrack(r.course,z),origin=skyTrack(r.course,r.progress);
 const q=1/(1+Math.max(0,z-r.progress)*.050);
 return [WIDTH/2+(t.center-origin.center+x-r.x*.47)*63*q,HORIZON+(398-(y+t.y-origin.y)*72)*q,q];
}
function drawCompatibility(c,r){
 const t=r.elapsed,p=r.theme;
 sky(c,p,t);
 const gaps=r.course.things.filter(o=>o.kind==='gap');
 for(let z=Math.min(r.course.length,r.progress+152);z>r.progress;z-=3){
  const prev=Math.max(r.progress,z-3);
  if(gaps.some(gap=>prev<gap.z+gap.span/2&&z>gap.z-gap.span/2))continue;
  const ends=[prev,z].map(k=>{const half=skyTrack(r.course,k).half;return [-half,half].map(x=>project(r,x,k).slice(0,2));});
  poly(c,[...ends[0],...ends[1].reverse()],p.road[Math.floor(z/12)%2],p.border,1.3);
 }
 for(const o of [...r.course.things].reverse()){
  if(o.z<r.progress-1||o.z>r.progress+139||r.used.has(o.id))continue;
  const [x,y,q]=project(r,skyObjectX(o,t),o.z);
  if(o.kind==='ball'){
   const R=o.radius*48*q;
   circle(c,x,y-R,R,'#b2204c');circle(c,x-R*.11,y-R*1.13,R*.83,'#f04357');
   circle(c,x-R*.36,y-R*1.46,R*.17,'#ffb2ac');
  }
  if(o.kind==='coin'){circle(c,x,y-48*q,21*q,'#ffe365');text(c,'★',x,y-40*q,25*q,'#895a15');}
  if(o.kind==='boost')text(c,'10× SPEED',x,y,Math.max(18,45*q),'#14395e');
  if(['bar','gate','spikes','sweeper'].includes(o.kind)){
   c.fillStyle='#e4417b';c.fillRect(x-o.half*50*q,y-o.height*58*q,o.half*100*q,o.height*58*q);
  }
  if(o.kind==='gap')text(c,'JUMP',x,y-14,Math.max(14,31*q),'#2b195a');
 }
 const x=WIDTH/2+r.x*32,y=HEIGHT-74-(r.y-skyTrack(r.course,r.progress).y)*61;
 poly(c,[[x-49,y+9],[x+49,y+9],[x+42,y+20],[x-37,y+20]],r.board.color,'#293052',4);
 poly(c,[[x-15,y-48],[x+15,y-48],[x+20,y+10],[x-20,y+10]],'#40389b','#202851',4);
 circle(c,x,y-66,23,'#ef5191');
 text(c,'Compatibility graphics',WIDTH-16,HEIGHT-12,16,'#182345','right');
}
function draw(){
 const canvas=$('skyboard-canvas');if(!canvas)return;
 const c=canvas.getContext('2d');if(!c)return;
 const n=currentCourse(),seed=practiceSeed??(Math.imul(n,212561)^196930);
 if(!run&&!active()&&!open)return;
 if(!run&&(preview?.stage!==n||preview?.course.seed!==seed||preview?.board.id!==selectedBoard)){
  preview=Object.assign(createSkyRide(buildSkyCourse(n,seed,SKY_COURSE_EDITION),boardType().id),{
    stage:n,board:boardType(),theme:palette(n),progress:48
  });
  preview.y=skyTrack(preview.course,preview.progress).y;
 }
 const r=run||preview;
 const shadow=run?ghostPosition(r):null;
 if(!compatibility&&!createSkyScene&&!sceneLoading){
  sceneLoading=true;
  import('./skyboard-scene.mjs?v=drift1').then(module=>{createSkyScene=module.createSkyScene;draw();})
   .catch(()=>{compatibility=true;draw();});
 }
 if(!compatibility&&createSkyScene){
  try{
   if(!scene)scene=createSkyScene(WIDTH,HEIGHT);
   scene.draw(c,r,r.theme,r.board,shadow);
   canvas.dataset.renderer='webgl';
  }catch(e){
   compatibility=true;scene?.dispose();scene=null;
   console.info('Skyboard compatibility graphics enabled.',e.message);
  }
 }
 if(compatibility||!createSkyScene){drawCompatibility(c,r);canvas.dataset.renderer=compatibility?'compatibility':'loading';}
 if(!run)return;
 canvas.dataset.raceState=r.hurt>0?'hit':r.boost>0?'boost':r.recovery>0?'checkpoint':r.done?'finish':'ride';
 canvas.dataset.distance=r.progress.toFixed(3);
 canvas.dataset.multiplier=(r.speed/r.normal).toFixed(3);
 canvas.dataset.ballHits=String(r.ballHits);
 const drift=Boolean(r.mask&SKY_INPUT.drift)&&Math.abs(r.vx)>.8;
 const drive=r.hurt>0?'KNOCKBACK':r.boost>0?'10× BOOST':r.coast>0?'BOOST COAST':!r.grounded?'AIRBORNE':drift?'DRIFTING':r.mask&SKY_INPUT.brake?'BRAKING':'GRIP';
 const pace=Math.round(Math.abs(r.speed/r.normal)*100);
 $('skyboard-live-speed').textContent=(r.speed<0?'REVERSE ':'')+pace+'% PACE';
 $('skyboard-live-drive').textContent=drive;
 const ghostHud=$('skyboard-live-ghost');
 ghostHud.hidden=!shadow;
 if(shadow){const gap=Math.round(r.progress-shadow.z);ghostHud.textContent='REPLAY GHOST '+(gap>=0?'+':'')+gap+' TRACK UNITS';}
 canvas.dataset.drive=drive;
 const alert=$('skyboard-speed');
 const callout=r.countdown>0?(r.countdown>.94?'READY':'SET'):
  r.hurt>0?'RED BALL · RECOVER':r.boost>0?(r.boost<.135?'10× SPEED! · ENDING':'10× SPEED!'):
  r.recovery>0?'CHECKPOINT':r.tick<33?'GO!':'';
 if(alert.textContent!==callout)alert.textContent=callout;
 alert.hidden=!callout;
 alert.dataset.mode=r.hurt>0?'hit':'boost';
 $('skyboard-live-stage').textContent=String(r.stage).padStart(2,'0')+' / 30';
 const progress=Math.round(100*r.progress/r.course.length)+'%';
 $('skyboard-live-distance').textContent=progress;
 $('skyboard-progress-fill').style.width=progress;
 $('skyboard-live-lives').textContent='♥'.repeat(r.lives)+'♡'.repeat(3-r.lives);
 $('skyboard-live-coins').textContent='★ '+r.coins;
}
function frame(ts){
 request=0;if(!run||run.done)return;
 const delta=last?Math.min(.12,(ts-last)/1000):0;last=ts;
 if(active()&&!document.hidden&&!run.paused){
  if(run.countdown>0)run.countdown=Math.max(0,run.countdown-delta);
  else accumulator+=delta;
  while(accumulator>=SKY_DT&&!run.done){accumulator-=SKY_DT;tick();}
 }
 draw();
 if(run&&!run.done&&!run.paused)request=requestAnimationFrame(frame);
}
function onKeyDown(e){
 if(!active()||!run||run.done||e.target?.closest?.('input,textarea,select,[contenteditable]'))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
 if(['ArrowLeft','KeyA'].includes(e.code))held.hold('left','key:'+e.code);
 if(['ArrowRight','KeyD'].includes(e.code))held.hold('right','key:'+e.code);
 if(['ShiftLeft','ShiftRight'].includes(e.code))held.hold('drift','key:'+e.code);
 if(e.code==='ArrowDown')held.hold('brake','key:'+e.code);
 if(e.code==='Escape'&&!e.repeat)pause();
 if(['ArrowUp','Space','KeyW'].includes(e.code)&&!e.repeat)jump();
}
function onKeyUp(e){
 if(['ArrowLeft','KeyA'].includes(e.code))held.release('left','key:'+e.code);
 if(['ArrowRight','KeyD'].includes(e.code))held.release('right','key:'+e.code);
 if(['ShiftLeft','ShiftRight'].includes(e.code))held.release('drift','key:'+e.code);
 if(e.code==='ArrowDown')held.release('brake','key:'+e.code);
}
function syncArcade(){
 if(!root?.isConnected)return;
 if(active()){
  if(!open){open=true;$('skyboard-inside').hidden=false;$('skyboard-toggle').setAttribute('aria-expanded','true');}
  if(['play','boards','awards','leaders'].includes(document.body.dataset.arcadeScene)&&document.body.dataset.arcadeScene!==currentScene)choose(document.body.dataset.arcadeScene);
  draw();
 }else if(run&&!run.done)pause(true);
}
async function verify(){
 if(!client||!host||!config?.enabled)return;
 if(host.hidden){reset();root?.remove();root=null;user=null;open=false;return;}
 const {data:{session}}=await client.auth.getSession(),id=session?.user?.id;
 if(!id){reset();root?.remove();root=null;user=null;open=false;return;}
 const {data:member,error}=await client.from('community_members').select('status').eq('user_id',id).maybeSingle();
 if(error||member?.status!=='approved'){reset();root?.remove();root=null;user=null;open=false;return;}
 if(user!==id){reset();root?.remove();root=null;user=id;profile=null;awards=[];leaders=[];open=false;
  steeringPreset=readControlChoice(localStorage,'skyboard',id,DEFAULT_SKY_STEERING);
  riderLook=null;practiceChoice=0;practiceSeed=null;
  try{
   selectedBoard=localStorage.getItem('skyboard-board-'+id)||'sunny';
   shareReplay=localStorage.getItem('skyboard-share-'+id)==='yes';
  }catch{selectedBoard='sunny';shareReplay=false;}
  const {data:avatars}=await client.rpc('community_avatar_projections',{p_members:[id]});
  const recipe=avatars?.find?.(row=>row.user_id===id)?.avatar_display;
  if(recipe){
   const {AVATAR_OPTIONS}=await import('./family-avatar-builder.mjs');
   const tone=(part)=>AVATAR_OPTIONS[part].find(([key])=>key===recipe[part])?.[2];
   riderLook={shirt:tone('shirt'),skin:tone('skin'),hair:tone('hair'),body:recipe.full_body?.model,garment:recipe.garment,
    trail:({turquoise:'#a7fcfa',burntorange:'#ffe281',maroon:'#ffa4a7',teal:'#9afafa',navy:'#bac2ff'})[recipe.shirt]};
  }
 }
 if(!root?.isConnected){build();await refresh();}
 syncArcade();
}
async function boot(){
 if(booted||!host||!config?.enabled)return;booted=true;
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(config.supabaseUrl,config.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  let pending=0,schedule=()=>{clearTimeout(pending);pending=setTimeout(()=>void verify().catch(console.warn),150);};
  new MutationObserver(schedule).observe(host,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(syncArcade).observe(document.body,{attributes:true,attributeFilter:['class','data-arcade-game','data-arcade-scene']});
  client.auth.onAuthStateChange(schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);else schedule();});
  window.addEventListener('blur',()=>pause(true));
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  schedule();
 }catch(e){console.warn('Skyboard Sprint unavailable:',e);}
}
void boot();
