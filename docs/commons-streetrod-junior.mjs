/* Street r0d Junior Star Drives, original kid-friendly vehicles and game.
 * No purchases, wagers, peer chat, or child-profile data. Game achievements
 * are credited to the signed-in approved Commons account only.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {drawPhotoCar,carPhotoUrl} from './streetrod-photo-sprites.mjs?v=photoreal1';
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const CARS=[
 ['dragonwagon','Dragon Wagon','#aa6546','dragon'],['rocketpea','Rocket Pea','#7c9b6c','rocket'],
 ['dinodash','Dino Dash','#78a36b','dino'],['starhopper','Star Hopper','#7c7fc2','space'],
 ['bubblebus','Bubble Bus','#d18cae','bus'],['moonmower','Moon Mower','#859bbc','rover'],
 ['puddlepatrol','Puddle Patrol','#76a0a2','truck'],['jellybuggy','Jellybean Buggy','#d6a26e','buggy'],
 ['turtleturbo','Turtle Turbo','#5a9b7c','turtle'],['cloudcruiser','Cloud Cruiser','#87a7d0','cloud']
].map(([key,name,color,shape])=>({key,name,color,shape}));
const E=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lanesY=[127,215,301];
let client=null,root=null,canvas=null,ctx=null,chosen='dragonwagon',lane=1,run=null,raf=0,startedAt=0,choice=[],lastTick=-1,progress=null,working=false,approved=false;
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
const car=()=>CARS.find(c=>c.key===chosen)||CARS[0];
function say(t,isError=false){const node=document.getElementById('srj-status');if(node){node.textContent=t;node.dataset.error=String(isError);}}
function renderCars(){
 const el=document.getElementById('srj-cars');if(!el)return;
 el.innerHTML=CARS.map(c=>'<button class="srj-choice'+(chosen===c.key?' selected':'')+'" data-srj-car="'+E(c.key)+'" type="button" aria-pressed="'+(chosen===c.key)+'"><span style="--car-color:'+E(c.color)+'" aria-hidden="true"><img class="srj-real-car" alt="" loading="lazy" decoding="async" src="'+E(carPhotoUrl(({bus:'van',truck:'truck',rover:'truck',buggy:'truck',rocket:'muscle',dino:'truck',dragon:'van'})[c.shape]||'coupe',c.key))+'"></span><b>'+E(c.name)+'</b></button>').join('');
 const title=document.getElementById('srj-car-name');if(title)title.textContent=car().name;
}
function renderProgress(){
 const el=document.getElementById('srj-progress');if(!el)return;
 const list=progress?.progress||[];
 const top=list.sort((a,b)=>b.stars-a.stars).slice(0,3);
 el.innerHTML=top.length?'<strong>Your saved star drives</strong><div>'+top.map(v=>{const model=CARS.find(c=>c.key===v.car);return '<span>'+E(model?.name||v.car)+' · '+Number(v.stars)+'/3 stars</span>';}).join('')+'</div>':'<span>Finish a drive to earn your first Junior Pilot badge.</span>';
}
function enter(){
 if(root||!document.getElementById('sr-inside'))return;
 root=document.createElement('section');root.id='srj-junior';root.className='srj-junior';
 root.innerHTML='<details><summary><span><b>JUNIOR STAR DRIVES</b><small>Ten original family cars · Friendly play · No purchases</small></span><span class="srj-arrow">▾</span></summary><div class="srj-inside"><div class="srj-welcome"><h3>Three stars. One little road trip.</h3><p>Pick a playful car, steer into the glowing star lane, and collect three stars along the way. No crashes, no money and no racing against strangers. An approved family member account saves the game achievements.</p></div><div class="srj-cars" id="srj-cars"></div><div class="srj-screen"><canvas id="srj-canvas" width="900" height="360" role="img" aria-label="Three-lane colorful junior road game"></canvas><div class="srj-caption"><strong id="srj-car-name">Dragon Wagon</strong><span id="srj-stars">0 / 3 stars</span></div></div><div class="srj-controls"><button type="button" id="srj-start" data-srj="start">Start star drive</button><div class="srj-lane-buttons"><button type="button" data-srj="lane" data-lane="0">↑ Top lane</button><button type="button" data-srj="lane" data-lane="1">● Middle</button><button type="button" data-srj="lane" data-lane="2">↓ Bottom lane</button></div></div><p class="srj-status" id="srj-status" role="status">Pick a car, then start a star drive.</p><div id="srj-progress" class="srj-progress"></div><p class="srj-legal">Original fictional family vehicles. This mode stores only the approved member account’s selected car, stars and game achievements. No child accounts, real spending or peer-to-peer contact.</p></div></details>';
 const area=document.querySelector('#sr-inside');const existing=area.querySelector('#scc-motor-vault');
 if(existing)existing.after(root);else area.prepend(root);
 canvas=root.querySelector('canvas');ctx=canvas.getContext('2d');
 root.addEventListener('click',e=>{
  const el=e.target.closest('button');if(!el)return;
  if(el.dataset.srjCar){if(run)return say('Finish the drive to switch cars.');chosen=el.dataset.srjCar;renderCars();draw(0);}
  if(el.dataset.srj==='start')void start();
  if(el.dataset.srj==='lane')setLane(Number(el.dataset.lane));
 });
 renderCars();renderProgress();draw(0);
}
function laneColor(i){return ['#835ba8','#5c8ba8','#648a78'][i];}
function round(x,y,w,h,r,fill){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
}
function drawCar(x,y,c){
 const body={bus:'van',truck:'truck',rover:'truck',buggy:'truck',rocket:'muscle',space:'coupe',dino:'truck',dragon:'van',turtle:'coupe',cloud:'coupe'}[c.shape]||'coupe';
 if(drawPhotoCar(ctx,x-105,y-94,215,138,body,c.key))return;
 ctx.save();ctx.translate(x,y);const color=c.color;
 ctx.fillStyle='#11182766';ctx.beginPath();ctx.ellipse(0,18,80,12,0,0,2*Math.PI);ctx.fill();
 ctx.fillStyle=color;ctx.strokeStyle='#233240';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(-72,-2);ctx.lineTo(-62,-27);ctx.lineTo(-28,-34);ctx.lineTo(-14,-51);
 ctx.lineTo(36,-51);ctx.lineTo(54,-31);ctx.lineTo(66,-27);ctx.lineTo(79,-3);ctx.lineTo(76,16);ctx.lineTo(-71,16);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#bfe2ef';ctx.beginPath();ctx.moveTo(-20,-46);ctx.lineTo(30,-46);ctx.lineTo(48,-30);ctx.lineTo(-35,-30);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#f8e7b4';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-62,-11);ctx.lineTo(70,-11);ctx.stroke();
 for(const xx of [-46,49]){ctx.fillStyle='#203042';ctx.beginPath();ctx.arc(xx,14,18,0,2*Math.PI);ctx.fill();ctx.fillStyle='#e6dcbf';ctx.beginPath();ctx.arc(xx,14,9,0,2*Math.PI);ctx.fill();}
 ctx.fillStyle='#fff9bf';ctx.fillRect(72,-11,12,8);
 const shape=c.shape;
 ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff7da';
 ctx.fillText(({dragon:'✦',rocket:'✧',dino:'☘',space:'✶',bus:'♡',rover:'☾',truck:'✚',buggy:'◈',turtle:'❧',cloud:'☁'})[shape]||'★',10,1);
 ctx.restore();
}
function drawStar(x,y,glow){
 ctx.save();ctx.translate(x,y);const radius=glow?20:16;ctx.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,r=j%2?radius*.45:radius;const xx=Math.cos(a)*r,yy=Math.sin(a)*r;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fillStyle='#ffe68c';ctx.shadowBlur=glow?24:0;ctx.shadowColor='#ffdf67';ctx.fill();ctx.restore();
}
function draw(ms){
 if(!ctx)return;
 const w=900,h=360;ctx.clearRect(0,0,w,h);
 let grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#64acc4');grad.addColorStop(.46,'#c7e6c6');grad.addColorStop(1,'#a4bb88');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#fff8cb';ctx.beginPath();ctx.arc(777,58,29,0,2*Math.PI);ctx.fill();
 ctx.fillStyle='#568d77';for(let i=0;i<14;i++){ctx.beginPath();ctx.arc(i*85-55,98,85,0,Math.PI);ctx.fill();}
 ctx.fillStyle='#596776';ctx.fillRect(0,80,w,h-80);
 for(let i=0;i<3;i++){ctx.fillStyle=laneColor(i)+'45';ctx.fillRect(0,86+i*87,w,84);}
 ctx.lineWidth=3;ctx.strokeStyle='#f4edca99';
 for(const y of [86,173,260,349]){ctx.setLineDash([28,20]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(900,y);ctx.stroke();}ctx.setLineDash([]);
 if(run){
  const at=[4000,8000,12000];const goal=run.star_lanes||[1,1,1];
  for(let k=0;k<3;k++){const x=212+(at[k]-ms)*.16;if(x>60&&x<950&&ms<at[k]+200)drawStar(x,lanesY[goal[k]]-19,true);}
 }
 drawCar(168,lanesY[lane],car());
 ctx.fillStyle='#fdf5e7';ctx.font='900 17px system-ui';ctx.fillText(run?'STAR ROAD · '+Math.max(0,(15-ms/1000)).toFixed(1)+' s':'CHOOSE A CAR TO BEGIN',24,32);
 ctx.fillStyle='#153046aa';round(12,43,876,8,4,'#1d3c4688');if(run)round(12,43,clamp(ms/15000,0,1)*876,8,4,'#ffdf75');
}
function setLane(next){
 if(!run||working)return;
 lane=clamp(next,0,2);
 root.querySelectorAll('[data-srj="lane"]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.lane)===lane)));
}
async function load(){
 if(!client)return;
 const result=await client.rpc('community_streetrod_junior_state');
 if(!result.error){progress=result.data;renderProgress();}
}
async function start(){
 if(run||working||!client||!approved)return;
 working=true;say('Opening the scenic star road…');
 try{
  const {data,error}=await client.rpc('community_streetrod_junior_start',{p_car:chosen});
  if(error)throw error;
  run=data;lane=1;choice=[];lastTick=-1;startedAt=performance.now();
  document.getElementById('srj-start').disabled=true;
  root.querySelectorAll('[data-srj-car]').forEach(b=>b.disabled=true);
  say('Choose your lane as each glowing star reaches your car!');
  cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
 }catch(e){say(e.message||'Could not start this drive.',true);}
 finally{working=false;}
}
function tick(now){
 if(!run)return;
 const t=clamp(now-startedAt,0,15100);
 const markers=[4000,8000,12000];
 for(let i=0;i<3;i++)if(lastTick<i&&t>=markers[i]){choice[i]=lane;lastTick=i;document.getElementById('srj-stars').textContent=choice.filter((n,j)=>n===(run.star_lanes||[])[j]).length+' / 3 stars';}
 draw(t);
 if(t>=15000){void finish();return;}
 raf=requestAnimationFrame(tick);
}
async function finish(){
 if(!run||working)return;working=true;cancelAnimationFrame(raf);raf=0;
 const active=run;const picks=[choice[0]??lane,choice[1]??lane,choice[2]??lane];
 say('Saving your stars and family achievement…');
 try{
  let result;for(let i=0;i<3;i++){
   result=await client.rpc('community_streetrod_junior_finish',{p_run_id:active.run_id,p_lanes:picks});
   if(!result.error||!/Finish the scenic drive first/i.test(result.error.message||''))break;
   await new Promise(r=>setTimeout(r,600));
  }
  if(result.error)throw result.error;
  progress=result.data?.state||progress;
  document.getElementById('srj-stars').textContent=Number(result.data.stars||0)+' / 3 stars';
  say(result.data.perfect?'Perfect star run! Your trophy is saved.':'You collected '+result.data.stars+' stars. Great drive! Your result is saved.');
  renderProgress();
 }catch(e){say(e.message||'Could not save the star run. Your other racing scores are unaffected.',true);}
 finally{run=null;working=false;const startBtn=document.getElementById('srj-start');if(startBtn)startBtn.disabled=false;root?.querySelectorAll('[data-srj-car]').forEach(b=>b.disabled=false);draw(0);}
}
async function boot(){
 if(!cfg?.enabled||!cfg?.supabaseUrl||!cfg?.publishableKey||!location.pathname.endsWith('community.html'))return;
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  const auth=await client.auth.getSession(),uid=auth.data.session?.user?.id;
  if(uid){const member=await client.from('community_members').select('status').eq('user_id',uid).maybeSingle();approved=!member.error&&member.data?.status==='approved';}
  const attach=()=>{if(!document.getElementById('sr-inside')||document.getElementById('conversations')?.hidden){if(root&&!run){root.remove();root=null;}return;}if(approved&&!root){enter();void load();}};
  const obs=new MutationObserver(attach);obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',ev=>{if(!run||ev.target?.closest('input,textarea,select'))return;if(ev.key==='ArrowUp'){ev.preventDefault();setLane(lane-1);}else if(ev.key==='ArrowDown'){ev.preventDefault();setLane(lane+1);}});
  client.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'){approved=false;if(!run&&root){root.remove();root=null;}}else if(ev==='SIGNED_IN'||ev==='TOKEN_REFRESHED'){setTimeout(async()=>{try{const auth=await client.auth.getSession();const uid=auth.data.session?.user?.id;if(!uid)return;const m=await client.from('community_members').select('status').eq('user_id',uid).maybeSingle();approved=!m.error&&m.data?.status==='approved';attach();}catch{}},0);}});
  attach();
 }catch{}
}
void boot();