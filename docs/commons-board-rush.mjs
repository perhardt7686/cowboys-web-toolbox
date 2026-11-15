/* Skyboard Sprint: original family board-racing game, dedicated to Emma.
 * Independent original art and obstacle layouts. Existing member identity and
 * Supabase score authority remain in place. Never awards offline wins.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
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
 ['finish','Skyboard Champion','Finish all thirty stages','🏆',31]
];
let client=null,user=null,root=null,profile=null,leaders=[],awards=[],open=false,booted=false;
let selectedBoard='sunny',currentScene='play',run=null,request=0,last=0,held=new Set(),busy=false;
const status=(message,isError=false)=>{const node=$('skyboard-status');if(node){node.textContent=message;node.dataset.error=String(isError)}};
const boardType=()=>BOARDS.find(b=>b.id===selectedBoard)||BOARDS[0];
const stage=()=>Math.max(1,Math.min(31,Number(profile?.stage||1)));
const available=b=>stage()>=b.need;
const active=()=>!host.hidden&&document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='skyboard';
function rand(seed){let s=(Number(seed)||1)>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function palette(n){return WORLDS[Math.floor((n-1)/5)%WORLDS.length];}
function buildCourse(number,seed) {
 const rng=rand(seed ^ Math.imul(number,3313)), length=300+Math.min(105,number*3), things=[];
 for(let z=45;z<length-28;z+=22+rng()*15){
   const roll=rng(),lane=Math.round(rng()*2)-1;
   let kind=roll<.24?'coin':roll<.39?'boost':roll<.56?'bar':roll<.75?'spikes':roll<.88?'gap':'gate';
   if(number<3 && kind==='gap')kind='coin';
   if(number<5 && kind==='gate')kind='boost';
   things.push({z,kind,lane,x:lane*.79,used:false,spin:rng()*6.28});
   if(kind==='bar'||kind==='spikes'||kind==='gate')things.push({z:z+8,kind:'coin',lane:-lane||1,x:(-lane||1)*.79,used:false,spin:rng()*6.28});
 }
 return {length,things};
}
function button(label,handler,cl=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cl;b.addEventListener('click',handler);return b;}
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
 '<div id="skyboard-message" class="skyboard-message"><strong>READY TO RIDE?</strong><p>Pick a board and press Start Stage.</p></div></div>'+
 '<div class="skyboard-touch" aria-label="Game touch controls"><button data-sky-hold="left" type="button" aria-label="Steer left">◀ LEFT</button>'+
 '<button data-sky-hold="drift" type="button" aria-label="Drift around turns">↝ DRIFT</button>'+
 '<button data-sky-action="jump" type="button" class="skyboard-jump" aria-label="Jump">▲ JUMP</button>'+
 '<button data-sky-hold="right" type="button" aria-label="Steer right">RIGHT ▶</button></div>'+
 '<div class="skyboard-help">Hold LEFT / RIGHT to steer · Tap JUMP to clear gaps and barriers · Hold DRIFT for a faster slide · Collect stars and hit boost pads.</div>'+
 '<div class="skyboard-round-actions"><button type="button" id="skyboard-pause">PAUSE</button>'+
 '<button type="button" id="skyboard-retry">RETRY STAGE</button><button type="button" id="skyboard-next" hidden>NEXT STAGE ▶</button></div></section>'+
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
 held.clear();last=0;run=null;
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
 const n=stage()>30?30:stage(),b=boardType();
 let seed=(Date.now() ^ Math.floor(Math.random()*1000000))>>>0,id=null,practice=false;
 try{
  if(stage()>30)practice=true;
  else{
   const data=await rpc('community_boardride_start',{p_board:b.id});
   id=data.run_id;seed=Number(data.seed);if(Number(data.stage)!==n)throw Error('Your stage changed. Refresh and try again.');
  }
 }catch(e){
  practice=true;status('Practice mode: '+e.message+' Results will not be saved.',true);
 }
 const course=buildCourse(n,seed);
 run={stage:n,id,seed,practice,board:b,course,progress:0,x:0,vx:0,speed:15,
   height:0,vy:0,boost:0,coins:0,lives:3,points:0,invuln:0,elapsed:0,
   checkpoint:0,done:false,paused:false,lastInput:0,theme:palette(n)};
 busy=false;$('skyboard-start').disabled=false;$('skyboard-next').hidden=true;
 $('skyboard-message').hidden=true;$('skyboard-pause').textContent='PAUSE';
 status(practice?'Practice run · not counted toward the family leaderboard.':'Stage '+n+' · race to the finish!');
 last=0;draw();request=requestAnimationFrame(frame);
}
function jump(){
 if(!run||run.done||run.paused||!active()||run.height>.01)return;
 run.vy=6.7;run.height=.02;
}
function pause(silent=false){
 held.clear();if(!run||run.done)return;
 run.paused=silent?true:!run.paused;
 $('skyboard-pause').textContent=run.paused?'RESUME':'PAUSE';
 if(!silent)status(run.paused?'Race paused.':'Back on the board!');
}
function crash(){
 if(run.invuln>0)return;
 run.lives-=1;run.invuln=2.2;
 if(run.lives<=0){void finish(false);return;}
 const restart=Math.max(0,run.checkpoint-12);
 run.progress=restart;run.x=0;run.vx=0;run.speed=12;run.vy=0;run.height=0;
 for(const o of run.course.things)if(o.z>=restart)o.used=false;
 status('Oops, a tumble! '+run.lives+' hearts left. Back to your checkpoint.');
}
function collide(prev,next){
 for(const o of run.course.things){
  if(o.used||o.z>next||o.z<=prev)continue;
  o.used=true;
  const close=Math.abs(run.x-o.x)<(o.kind==='gate'?.53:.40),air=run.height>.42;
  if(o.kind==='coin'){if(close){run.coins++;run.points+=25;}continue;}
  if(o.kind==='boost'){if(close){run.boost=2.6;run.points+=20;}continue;}
  if(o.kind==='gap'){if(!air)crash();continue;}
  if(['bar','spikes','gate'].includes(o.kind)&&close&&!air)crash();
 }
}
function tick(dt){
 if(!run||run.done||run.paused)return;
 run.elapsed+=dt;run.invuln=Math.max(0,run.invuln-dt);run.boost=Math.max(0,run.boost-dt);
 const dir=(held.has('right')?1:0)-(held.has('left')?1:0),drift=held.has('drift');
 const target=dir*(drift?2.25:3.15)*run.board.turn;
 run.vx+=(target-run.vx)*Math.min(1,dt*(drift?3:7));
 run.x=Math.max(-1.23,Math.min(1.23,run.x+run.vx*dt));
 run.vy-=15.8*dt;run.height=Math.max(0,run.height+run.vy*dt);
 if(run.height===0)run.vy=0;
 const want=(15.2+Math.min(5,run.stage*.2))*run.board.speed+(run.boost>0?12:0)+(drift&&dir?2.4:0);
 run.speed+=(want-run.speed)*Math.min(1,dt*1.5);
 const was=run.progress;run.progress=Math.min(run.course.length,run.progress+run.speed*dt);
 if(Math.floor(run.progress/68)>Math.floor(was/68))run.checkpoint=Math.floor(run.progress/68)*68;
 collide(was,run.progress);
 if(run&&run.progress>=run.course.length&&!run.done)void finish(true);
}
async function finish(win){
 if(!run||run.done)return;
 const snapshot=run;run.done=true;if(request){cancelAnimationFrame(request);request=0;}
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
  const result=await rpc('community_boardride_finish',{p_run_id:snapshot.id,p_elapsed_ms:Math.round(snapshot.elapsed*1000),p_coins:snapshot.coins});
  message.innerHTML='<strong>STAGE '+snapshot.stage+' CLEAR!</strong><p>+'+
   Number(result.points||0).toLocaleString()+' points · '+snapshot.coins+' stars · '+(snapshot.elapsed).toFixed(1)+' seconds</p>';
  await refreshAfterWin();
  $('skyboard-next').hidden=stage()>30;
  status('Saved to your family account! '+(result.new_badges?.length?'New trophies: '+result.new_badges.join(', '):'Next stage unlocked.'));
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
function project(x,z){
 const q=1/(1+Math.max(0,z)*.043);
 const curve=Math.sin(((run?.progress||0)+z)*.010+((run?.stage||1)*.46))*.22;
 return [WIDTH/2+(x+curve-(run?.x||0)*.30)*340*q,HORIZON+405*q,q];
}
function road(c){
 const p=run.theme,skip=run.course.things.filter(o=>o.kind==='gap'&&!o.used).map(o=>o.z-run.progress);
 for(let z=177;z>=0;z-=6){
  const z2=z+6,[lx,y]=project(-1.45,z),[rx]=project(1.45,z),
   [flx,fy]=project(-1.45,z2),[frx]=project(1.45,z2),[center]=project(0,z);
  const empty=skip.some(s=>s>=z-1&&s<z2+7);
  if(empty)continue;
  poly(c,[[flx,fy],[frx,fy],[rx,y],[lx,y]],p.road[Math.floor((run.progress+z)/22)%2]);
  poly(c,[[flx,fy],[flx+5,fy],[lx+9,y],[lx,y]],p.border);
  poly(c,[[frx-5,fy],[frx,fy],[rx,y],[rx-9,y]],p.border);
  if(Math.floor((run.progress+z)/15)%3===0){const [a,b]=project(-.04,z2),[d,e]=project(.04,z);poly(c,[[a,b],[a+2,b],[d+3,e],[d,e]],'#ffffff70');}
  if(z%18===0){
   const [x1,y1]=project(-1.52,z),[x2,y2]=project(1.52,z);
   circle(c,x1,y1,Math.max(2,(y1-HORIZON)*.017),p.accent);
   circle(c,x2,y2,Math.max(2,(y2-HORIZON)*.017),p.accent);
  }
 }
}
function obstacle(c,o,t){
 const z=o.z-run.progress;if(z< -6||z>164||o.used)return;
 const [x,y,q]=project(o.x,z),size=Math.max(3,65*q);
 if(o.kind==='coin'){
  const wave=Math.sin(t*5+o.spin)*6*q;
  circle(c,x,y-45*q+wave,size*.27,'#fff3aa');
  circle(c,x,y-45*q+wave,size*.19,'#ffbf3c');
  text(c,'★',x,y-38*q+wave,Math.max(8,24*q),'#fff');
 } else if(o.kind==='boost'){
  const a=project(o.x-.35,z-3),b=project(o.x+.35,z-3),d=project(o.x+.35,z+7),e=project(o.x-.35,z+7);
  poly(c,[a.slice(0,2),b.slice(0,2),d.slice(0,2),e.slice(0,2)],'#29f4ef','#fff',Math.max(1,2*q));
  text(c,'⚡',x,y-5*q,Math.max(9,35*q),'#095375');
 } else if(o.kind==='gap'){
  const a=project(-1.4,z-3),b=project(1.4,z-3),d=project(1.4,z+10),e=project(-1.4,z+10);
  poly(c,[a.slice(0,2),b.slice(0,2),d.slice(0,2),e.slice(0,2)],'#12142d');
  text(c,'JUMP!',WIDTH/2,(a[1]+e[1])/2,Math.max(12,34*q),'#fff0a2');
 } else if(o.kind==='spikes'){
  for(let k=-1;k<=1;k++){const cx=x+k*size*.36;poly(c,[[cx-size*.19,y],[cx,y-size*.65],[cx+size*.19,y]],'#ff4d83','#fff6cc',Math.max(1,q*2));}
 } else if(o.kind==='bar'){
  poly(c,[[x-size*.58,y],[x-size*.58,y-size*.70],[x+size*.58,y-size*.7],[x+size*.58,y]],'#fa615b','#652e61',Math.max(1,2*q));
  text(c,'HOP',x,y-size*.3,Math.max(10,19*q),'#fff');
 } else if(o.kind==='gate'){
  const s=size*.85;
  c.strokeStyle='#9744b5';c.lineWidth=Math.max(2,6*q);c.beginPath();c.moveTo(x-s,y);c.lineTo(x-s,y-s*1.3);c.lineTo(x+s,y-s*1.3);c.lineTo(x+s,y);c.stroke();
  poly(c,[[x-s,y-s*.95],[x+s,y-s*.95],[x+s,y-s*.7],[x-s,y-s*.7]],'#ffea62');
 }
}
function rider(c,t){
 const b=run.board,x=WIDTH/2+run.x*95,y=HEIGHT-86-run.height*83,slant=run.vx*.026;
 c.save();c.translate(x,y);c.rotate(slant);
 c.globalAlpha=Math.max(.38,run.invuln>0?.55:1);
 c.fillStyle='#302b58aa';c.beginPath();c.ellipse(0,82+run.height*69,43,10,0,0,6.28);c.fill();
 c.strokeStyle=b.trail;c.lineWidth=7;c.beginPath();c.moveTo(-27,43);c.lineTo(26,43);c.stroke();
 poly(c,[[-37,27],[35,27],[45,37],[23,43],[-34,40]],b.color,'#22254b',4);
 for(const ax of [-24,24])circle(c,ax,45,6,'#29314b');
 c.lineCap='round';c.lineWidth=12;c.strokeStyle='#463b6a';
 c.beginPath();c.moveTo(-12,8);c.lineTo(-17,30);c.moveTo(13,8);c.lineTo(18,30);c.stroke();
 poly(c,[[-17,-51],[16,-51],[22,10],[-20,11]],'#506ad7','#24285a',4);
 c.strokeStyle='#f7be93';c.lineWidth=10;c.beginPath();c.moveTo(-16,-43);c.lineTo(-28,-14);c.moveTo(17,-42);c.lineTo(28,-16);c.stroke();
 circle(c,0,-73,24,'#efb68d');circle(c,-7,-73,2.9,'#182244');circle(c,8,-73,2.9,'#182244');
 poly(c,[[-28,-85],[-18,-112],[5,-122],[25,-107],[25,-86]],'#fc699a','#b83f7b',3);
 circle(c,0,-103,6,'#ffe06c');c.restore();
}
function draw(){
 const canvas=$('skyboard-canvas');if(!canvas)return;
 const c=canvas.getContext('2d');if(!c)return;
 const r=run,p=r?.theme||palette(Math.min(30,stage())),t=r?.elapsed||0;
 sky(c,p,t);
 if(r){
  road(c);
  for(const o of r.course.things.filter(o=>o.z-r.progress>-6&&o.z-r.progress<164).sort((a,b)=>b.z-a.z))obstacle(c,o,t);
  const [a,b]=project(-1.44,r.course.length-r.progress),[finishRightX]=project(1.44,r.course.length-r.progress);
  if(r.course.length-r.progress<160){
   c.strokeStyle='#252540';c.lineWidth=9;c.beginPath();c.moveTo(a,b-65*(1/(1+Math.max(0,r.course.length-r.progress)*.043)));c.lineTo(finishRightX,b-65*(1/(1+Math.max(0,r.course.length-r.progress)*.043)));c.stroke();
   text(c,'FINISH',WIDTH/2,b-23,Math.max(14,37/(1+Math.max(0,r.course.length-r.progress)*.043)),'#262046');
  }
  rider(c,t);
  const d=Math.round(100*r.progress/r.course.length);
  $('skyboard-live-stage').textContent=String(r.stage).padStart(2,'0')+' / 30';
  $('skyboard-live-distance').textContent=d+'%';
  $('skyboard-live-lives').textContent='♥'.repeat(r.lives)+'♡'.repeat(3-r.lives);
  $('skyboard-live-coins').textContent='★ '+r.coins;
 }else{
  c.fillStyle='#28214e77';c.fillRect(205,160,550,185);
  text(c,'EMMA’S SKYBOARD SPRINT',WIDTH/2,222,43,'#fff5ba');
  text(c,'30 COLORFUL STAGES · SIX DREAM WORLDS',WIDTH/2,270,22,'#fff');
  text(c,'JUMP · DRIFT · BOOST · WIN',WIDTH/2,309,23,'#a6fff0');
 }
}
function frame(ts){
 request=0;if(!run||run.done)return;
 const dt=last?Math.min(.04,(ts-last)/1000):0;last=ts;
 if(active()&&!document.hidden)tick(dt);
 draw();if(run&&!run.done)request=requestAnimationFrame(frame);
}
function onKeyDown(e){
 if(!active()||!run||run.done||e.target?.closest?.('input,textarea,select,[contenteditable]'))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
 if(['ArrowLeft','KeyA'].includes(e.code))held.add('left');
 if(['ArrowRight','KeyD'].includes(e.code))held.add('right');
 if(['ShiftLeft','ShiftRight'].includes(e.code))held.add('drift');
 if(['ArrowUp','Space','KeyW'].includes(e.code)&&!e.repeat)jump();
}
function onKeyUp(e){
 if(['ArrowLeft','KeyA'].includes(e.code))held.delete('left');
 if(['ArrowRight','KeyD'].includes(e.code))held.delete('right');
 if(['ShiftLeft','ShiftRight'].includes(e.code))held.delete('drift');
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
  try{selectedBoard=localStorage.getItem('skyboard-board-'+id)||'sunny';}catch{selectedBoard='sunny';}}
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
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  schedule();
 }catch(e){console.warn('Skyboard Sprint unavailable:',e);}
}
void boot();
