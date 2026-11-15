/* Skyboard Sprint: original family board-racing game, dedicated to Emma.
 * Independent original art and obstacle layouts. Existing member identity and
 * Supabase score authority remain in place. Never awards offline wins.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {SKY_DT,SKY_INPUT,buildSkyCourse,createSkyRide,skyTrack,skyObjectX,stepSky} from './skyboard-physics.mjs';
import {submitArcadeReplay} from './family-arcade-replay.mjs';
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
const WORLDS=[
 {name:'Sunshine Skyway',sky:['#52c5ff','#d6fbff'],road:['#ffe762','#ffbf3e'],border:'#e652c3',env:'cloud',accent:'#ff5c9b'},
 {name:'Candy Canyon',sky:['#fd96c8','#fff2b7'],road:['#ffaf66','#ffdd85'],border:'#b14be7',env:'canyon',accent:'#9a4dff'},
 {name:'Crystal Coast',sky:['#4dd7d8','#e5fff8'],road:['#6be7d3','#b7f6d1'],border:'#fff3a6',env:'palm',accent:'#097d9a'},
 {name:'Glacier Glow',sky:['#498ccf','#e9f9ff'],road:['#d8f7ff','#a4d8fa'],border:'#7166e9',env:'ice',accent:'#4387ed'},
 {name:'Moonlight Metro',sky:['#241953','#785cbd'],road:['#8af7fc','#8f96ff'],border:'#ff91d8',env:'city',accent:'#e7bcff'},
 {name:'Rainbow Rapids',sky:['#77bfff','#fbdfff'],road:['#a2ffbd','#e3ff89'],border:'#ff72bb',env:'forest',accent:'#ffe36e'}
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
let selectedBoard='sunny',currentScene='play',run=null,request=0,last=0,held=new Set(),busy=false;
let scene=null,createSkyScene=null,sceneLoading=false,compatibility=false,jumpQueued=false,accumulator=0,preview=null,showGhost=true,shareReplay=false,riderLook=null;
const status=(message,isError=false)=>{const node=$('skyboard-status');if(node){node.textContent=message;node.dataset.error=String(isError)}};
const boardType=()=>BOARDS.find(b=>b.id===selectedBoard)||BOARDS[0];
const stage=()=>Math.max(1,Math.min(31,Number(profile?.stage||1)));
const available=b=>stage()>=b.need;
const active=()=>!host.hidden&&document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='skyboard';
function palette(n){return WORLDS[Math.floor((n-1)/5)%WORLDS.length];}
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
 '<div id="skyboard-viewport" class="skyboard-viewport"><canvas id="skyboard-canvas" width="960" height="540" role="img" aria-label="Third-person board race with colorful tracks, gaps, bars, coins and boosts"></canvas>'+
 '<div class="skyboard-hud"><span id="skyboard-live-stage">01 / 30</span><span id="skyboard-live-distance">0%</span><span id="skyboard-live-lives">♥♥♥</span><span id="skyboard-live-coins">★ 0</span></div>'+
 '<div id="skyboard-speed" class="skyboard-speed" hidden></div>'+
 '<div id="skyboard-message" class="skyboard-message"><strong>READY TO RIDE?</strong><p>Pick a board and press Start Stage.</p></div></div>'+
 '<div class="skyboard-touch" aria-label="Game touch controls"><button data-sky-hold="left" type="button" aria-label="Steer left">◀ LEFT</button>'+
 '<button data-sky-hold="brake" type="button" aria-label="Brake">BRAKE</button>'+
 '<button data-sky-hold="drift" type="button" aria-label="Drift around turns">↝ DRIFT</button>'+
 '<button data-sky-action="jump" type="button" class="skyboard-jump" aria-label="Jump">▲ JUMP</button>'+
 '<button data-sky-hold="right" type="button" aria-label="Steer right">RIGHT ▶</button></div>'+
 '<div class="skyboard-help">Steer with ← →, jump with Space, drift with Shift and brake with ↓. A gamepad uses the stick, A to jump, X to drift and B to brake.</div>'+
 '<div class="skyboard-round-actions"><button type="button" id="skyboard-pause">PAUSE</button>'+
 '<button type="button" id="skyboard-retry">RETRY STAGE</button><button type="button" id="skyboard-ghost" aria-pressed="true">Family ghost on</button><button type="button" id="skyboard-share" aria-pressed="false">Share my ghost</button><button type="button" id="skyboard-next" hidden>NEXT STAGE ▶</button></div></section>'+
 '<section id="skyboard-boards" class="skyboard-pane" hidden><h3>CHOOSE YOUR RIDE</h3><p>Earn new boards by completing stages. No purchases, no ads, just family prizes.</p><div id="skyboard-board-list" class="skyboard-board-grid"></div></section>'+
 '<section id="skyboard-awards" class="skyboard-pane" hidden><h3>EMMA’S TROPHY ROAD</h3><p>Milestone awards are recorded on your family member account.</p><div id="skyboard-badge-list" class="skyboard-badge-grid"></div></section>'+
 '<section id="skyboard-leaders" class="skyboard-pane" hidden><h3>FAMILY LEADERBOARD</h3><p>Saved family progress, ordered by cleared stages and points.</p><div id="skyboard-leader-list" class="skyboard-leader-list"></div></section>'+
 '<p id="skyboard-status" class="skyboard-status" role="status" aria-live="polite">Choose a board and take your first ride.</p></div>';
 const base=$('dash-forge-root');if(base&&main.contains(base))base.after(root);else main.append(root);
 $('skyboard-toggle').addEventListener('click',()=>{
   open=!open;$('skyboard-inside').hidden=!open;$('skyboard-toggle').setAttribute('aria-expanded',String(open));
   if(open){render();void refresh();}else pause(true);
 });
 root.addEventListener('click',e=>{
  const tab=e.target.closest('[data-sky-scene]');
  if(tab){choose(tab.dataset.skyScene);return;}
  const pick=e.target.closest('[data-sky-board]');
  if(pick){pickBoard(pick.dataset.skyBoard);return;}
  if(e.target.closest('[data-sky-action="jump"]'))jump();
 });
 $('skyboard-start').addEventListener('click',()=>void start());
 $('skyboard-retry').addEventListener('click',()=>void start(true));
 $('skyboard-next').addEventListener('click',()=>void start());
 $('skyboard-pause').addEventListener('click',()=>pause());
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
 root.querySelectorAll('[data-sky-hold]').forEach(b=>{
  const action=b.dataset.skyHold;b.style.touchAction='none';
  b.addEventListener('pointerdown',e=>{e.preventDefault();held.add(action);b.classList.add('pressed');try{b.setPointerCapture(e.pointerId)}catch{}});
  for(const type of ['pointerup','pointercancel','lostpointercapture','pointerleave'])b.addEventListener(type,()=>{held.delete(action);b.classList.remove('pressed')});
 });
 const canvas=$('skyboard-canvas');
 canvas.addEventListener('pointerdown',e=>{if(!run||run.done)return;canvas.dataset.touchX=String(e.clientX);});
 canvas.addEventListener('pointermove',e=>{
  if(!run||!e.buttons||!canvas.dataset.touchX)return;
  const dx=e.clientX-Number(canvas.dataset.touchX);
  held.delete('left');held.delete('right');if(dx>15)held.add('right');else if(dx< -15)held.add('left');
 });
 for(const type of ['pointerup','pointercancel','pointerleave'])canvas.addEventListener(type,()=>{delete canvas.dataset.touchX;held.delete('left');held.delete('right')});
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
 render();status(b.title+' equipped. Ready to roll!');
}
function render(){
 if(!root?.isConnected)return;
 $('skyboard-stage').textContent='STAGE '+String(Math.min(30,stage())).padStart(2,'0')+' / 30';
 $('skyboard-points').textContent=Number(profile?.points||0).toLocaleString()+' PTS';
 $('skyboard-coins').textContent=Number(profile?.coins||0)+' ★';
 $('skyboard-world').textContent=palette(Math.min(30,stage())).name;
 $('skyboard-level-desc').textContent=stage()>30?'All thirty stages cleared · Champion!':
  'Stage '+stage()+' · '+(stage()%5===0?'Grand finale':'Ride, jump, drift and collect');
 $('skyboard-start').textContent=stage()>30?'🏆 PLAY BONUS RUN':'▶ START STAGE';
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
async function refresh(){
 if(!user||!root?.isConnected||busy)return;
 try{
  const data=await rpc('community_boardride_state');
  profile=data.mine||null;leaders=data.leaders||[];awards=data.badges||[];
  if(stage()<boardType().need)selectedBoard='sunny';
  render();
 }catch(e){status('Your saved progress could not load: '+e.message,true);}
}
function reset(){
 if(request){cancelAnimationFrame(request);request=0;}
 held.clear();last=accumulator=0;jumpQueued=false;run=null;preview=null;
 const next=$('skyboard-next'),startButton=$('skyboard-start'),pauseButton=$('skyboard-pause'),message=$('skyboard-message');
 if(next)next.hidden=true;if(startButton)startButton.disabled=false;
 if(pauseButton)pauseButton.textContent='PAUSE';if(message)message.hidden=false;
}
async function start(retry=false){
 if(busy||!user||host.hidden)return;
 if(run&&!run.done&&!retry)return;
 if(run)reset();
 busy=true;$('skyboard-start').disabled=true;
 status('Preparing your course and saved family checkpoint…');
 const n=stage()>30?30:stage(),pick=boardType();
 const b={...pick,look:riderLook,trail:riderLook?.trail||pick.trail};
 let seed=(Math.imul(n,212561)^196930),id=null,practice=false,ghost=null;
 try{
  if(stage()>30)practice=true;
  else{
   const data=await rpc('community_boardride_start_v2',{p_board:b.id,p_share:shareReplay});
   if(Number(data.stage)!==n)throw Error('Your stage changed. Refresh and try again.');
   id=data.run_id;seed=Number(data.seed);ghost=data.ghost||null;
  }
 }catch(e){
  practice=true;status('Practice mode · '+e.message,true);
 }
 const course=buildSkyCourse(n,seed);
 run=Object.assign(createSkyRide(course,b.id),{
  stage:n,id,seed,practice,board:b,paused:false,theme:palette(n),trace:[],lastInput:0,ghost,announced:false,countdown:1.75
 });
 busy=false;$('skyboard-start').disabled=false;$('skyboard-next').hidden=true;
 $('skyboard-message').hidden=true;$('skyboard-pause').textContent='PAUSE';
 status(practice?'Practice ride · results stay on this device.':
   ghost&&showGhost?'Asynchronous ghost · '+ghost.name+'’s saved race.':'Stage '+n+' · race to the finish!');
 last=accumulator=0;draw();request=requestAnimationFrame(frame);
}
function jump(){
 if(run&&!run.done&&!run.paused&&active())jumpQueued=true;
}
function pause(silent=false){
 held.clear();jumpQueued=false;
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
 held.clear();
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
  const data=await rpc('community_boardride_state');
  profile=data.mine||profile;leaders=data.leaders||[];awards=data.badges||[];render();
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
 const gap=r.course.things.find(o=>o.kind==='gap');
 for(let z=Math.min(r.course.length,r.progress+152);z>r.progress;z-=3){
  const prev=Math.max(r.progress,z-3);
  if(gap&&prev<gap.z+gap.span/2&&z>gap.z-gap.span/2)continue;
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
  if(o.kind==='bar'||o.kind==='gate'||o.kind==='spikes'){
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
 const n=Math.min(30,stage());
 if(!run&&!active()&&!open)return;
 if(!run&&(preview?.stage!==n||preview?.board.id!==selectedBoard)){
  preview=Object.assign(createSkyRide(buildSkyCourse(n,196930),boardType().id),{
    stage:n,board:boardType(),theme:palette(n),progress:70
  });
  preview.y=skyTrack(preview.course,preview.progress).y;
 }
 const r=run||preview;
 if(!compatibility&&!createSkyScene&&!sceneLoading){
  sceneLoading=true;
  import('./skyboard-scene.mjs').then(module=>{createSkyScene=module.createSkyScene;draw();})
   .catch(()=>{compatibility=true;draw();});
 }
 if(!compatibility&&createSkyScene){
  try{
   if(!scene)scene=createSkyScene(WIDTH,HEIGHT);
   scene.draw(c,r,r.theme,r.board,run&&ghostPosition(r));
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
 const alert=$('skyboard-speed');
 const callout=r.countdown>0?(r.countdown>.94?'READY':'SET'):
  r.hurt>0?'RED BALL · RECOVER':r.boost>0?(r.boost<.135?'10× SPEED! · ENDING':'10× SPEED!'):
  r.recovery>0?'CHECKPOINT':r.tick<33?'GO!':'';
 if(alert.textContent!==callout)alert.textContent=callout;
 alert.hidden=!callout;
 alert.dataset.mode=r.hurt>0?'hit':'boost';
 $('skyboard-live-stage').textContent=String(r.stage).padStart(2,'0')+' / 30';
 $('skyboard-live-distance').textContent=Math.round(100*r.progress/r.course.length)+'%';
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
 if(['ArrowLeft','KeyA'].includes(e.code))held.add('left');
 if(['ArrowRight','KeyD'].includes(e.code))held.add('right');
 if(['ShiftLeft','ShiftRight'].includes(e.code))held.add('drift');
 if(e.code==='ArrowDown')held.add('brake');
 if(e.code==='Escape'&&!e.repeat)pause();
 if(['ArrowUp','Space','KeyW'].includes(e.code)&&!e.repeat)jump();
}
function onKeyUp(e){
 if(['ArrowLeft','KeyA'].includes(e.code))held.delete('left');
 if(['ArrowRight','KeyD'].includes(e.code))held.delete('right');
 if(['ShiftLeft','ShiftRight'].includes(e.code))held.delete('drift');
 if(e.code==='ArrowDown')held.delete('brake');
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
  riderLook=null;
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
