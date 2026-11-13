/* Cowboy's Street r0d | Original interactive road-driving practice course.
 * Real steering, throttle, brake, gears and mechanical consequences. No race credits,
 * server-score changes, or unearned achievements: this is training only.
 * Original code and graphics, not a copy of historic game assets.
 */
import {drawClassicCockpit} from './streetrod-classic-cockpit.mjs?v=practice1';
const $=id=>document.getElementById(id);
const MAX_DISTANCE=2.5*5280;
let cleanup=null;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mphToFeetPerSecond=1.466666667;
export function mountRoadPractice(canvas){
 if(cleanup){cleanup();cleanup=null;}
 if(!canvas?.isConnected)return;
 const holder=canvas.parentElement;
 if(!holder)return;
 const root=document.createElement('section');root.className='src-road-practice';root.id='src-road-practice';
 root.setAttribute('aria-label','Playable first person road driving practice, no credits');
 root.innerHTML='<div class="src-road-practice-head"><div><span>RIVERSIDE LOOP / 2.5 MILES</span><strong>First-person road race practice</strong><p>Steer through bends, shift before redline, stay on the road. This is a non-scored practice course.</p></div><span class="src-road-practice-chip">PRACTICE / NO STAKES</span></div><div class="src-road-metrics"><div><small>SPEED</small><b id="src-road-speed">0 MPH</b></div><div><small>ENGINE</small><b id="src-road-rpm">900 RPM</b></div><div><small>GEAR</small><b id="src-road-gear">1</b></div><div><small>DISTANCE</small><b id="src-road-distance">0.00 / 2.50 MI</b></div><div><small>DAMAGE</small><b id="src-road-damage">0%</b></div></div><div class="src-road-drive-controls"><div class="src-road-wheel-controls"><button type="button" data-road-hold="left" aria-label="Steer left">◀ LEFT</button><button type="button" data-road-hold="right" aria-label="Steer right">RIGHT ▶</button></div><div class="src-road-wheel-controls"><button type="button" class="src-road-throttle" data-road-hold="throttle">▲ ACCELERATE</button><button type="button" class="src-road-brake" data-road-hold="brake">▼ BRAKE</button></div><div class="src-road-wheel-controls"><button type="button" data-road-shift="down">− GEAR</button><button type="button" data-road-shift="up">+ GEAR</button></div></div><div class="src-road-practice-actions"><button type="button" data-road-action="start" class="src-road-go">Start road practice</button><button type="button" data-road-action="reset">Reset course</button><p id="src-road-status" role="status" aria-live="polite">Start when ready. Keyboard: ↑ gas, ↓ brake, ←/→ steer, Space upshift, Shift downshift.</p></div>';
 holder.append(root);
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const inputs=new Set();
 const state={running:false,finished:false,mph:0,gear:1,distance:0,elapsed:0,damage:0,lane:0,overrev:0,stress:0,fuel:100,siren:0,highest:0,last:performance.now(),notice:'Start when ready. Every control is active, not just decorative.',statusTime:0};
 const ui={speed:root.querySelector('#src-road-speed'),rpm:root.querySelector('#src-road-rpm'),gear:root.querySelector('#src-road-gear'),distance:root.querySelector('#src-road-distance'),damage:root.querySelector('#src-road-damage'),message:root.querySelector('#src-road-status')};
 const rpm=()=>clamp(850+state.mph*145/Math.max(1,state.gear)+(inputs.has('throttle')?800:0),750,8200);
 const status=t=>{state.notice=t;ui.message.textContent=t;};
 const reset=()=>{
  inputs.clear();Object.assign(state,{running:false,finished:false,mph:0,gear:1,distance:0,elapsed:0,damage:0,lane:0,overrev:0,stress:0,fuel:100,siren:0,highest:0});
  status('Reset. Use Start road practice, then throttle, steer, and shift.');update();draw();
 };
 const finish=message=>{state.running=false;state.finished=true;inputs.clear();status(message);};
 const shift=delta=>{
  if(!state.running)return;
  const next=clamp(state.gear+delta,1,4);
  if(next===state.gear)return;
  if(inputs.has('throttle')&&rpm()>6000){state.stress+=.25;status('Power shift! Ease off the gas before changing gears.');}
  state.gear=next;
  if(state.stress>1.3)finish('Transmission failure. Practice ended. Bring the car back to the garage.');
 };
 const keyDown=e=>{
  if(!canvas.isConnected||!state.running)return;
  const tags=['INPUT','TEXTAREA','SELECT'];if(tags.includes(document.activeElement?.tagName))return;
  const name=({ArrowUp:'throttle',ArrowDown:'brake',ArrowLeft:'left',ArrowRight:'right'})[e.code];
  if(name){inputs.add(name);e.preventDefault();return;}
  if((e.code==='Space'||e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.repeat){shift(e.code==='Space'?1:-1);e.preventDefault();}
 };
 const keyUp=e=>{const name=({ArrowUp:'throttle',ArrowDown:'brake',ArrowLeft:'left',ArrowRight:'right'})[e.code];if(name){inputs.delete(name);e.preventDefault();}};
 const blur=()=>inputs.clear();
 window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);
 root.addEventListener('pointerdown',e=>{
  const btn=e.target.closest('[data-road-hold]');if(!btn||!state.running)return;
  e.preventDefault();inputs.add(btn.dataset.roadHold);btn.setPointerCapture?.(e.pointerId);btn.setAttribute('aria-pressed','true');
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(name,e=>{
  const btn=e.target.closest?.('[data-road-hold]');if(!btn)return;
  inputs.delete(btn.dataset.roadHold);btn.setAttribute('aria-pressed','false');
 });
 root.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.roadShift)shift(b.dataset.roadShift==='up'?1:-1);
  else if(b.dataset.roadAction==='start'){
   if(state.running)return;
   if(state.finished)reset();state.running=true;state.last=performance.now();status('GREEN! Road course started. Stay inside the lane markers.');
  }else if(b.dataset.roadAction==='reset')reset();
 });
 function update(){
  ui.speed.textContent=Math.round(state.mph)+' MPH';ui.rpm.textContent=Math.round(rpm())+' RPM';ui.gear.textContent=String(state.gear);
  ui.distance.textContent=(state.distance/5280).toFixed(2)+' / 2.50 MI';ui.damage.textContent=Math.round(state.damage*100)+'%';
  ui.damage.dataset.warning=String(state.damage>.3);
 }
 function draw(){
  if(!ctx)return;
  drawClassicCockpit(ctx,{width:canvas.width,height:canvas.height,live:state.running,progress:state.distance/MAX_DISTANCE,
   seed:33,clock:state.elapsed*1000,speed:state.mph,rpm:rpm(),steer:state.lane,damage:state.damage,
   own:{accent:'#4d667a'},rival:{body:'muscle',key:'meteor'}});
  if(state.running&&state.mph>75){ctx.fillStyle='#d1352999';ctx.fillRect(0,0,canvas.width,5);}
 }
 function updatePhysics(dt){
  if(!state.running)return;
  state.elapsed+=dt;
  const go=inputs.has('throttle'),braking=inputs.has('brake'),turn=(inputs.has('right')?1:0)-(inputs.has('left')?1:0);
  const accel=go?(42/(.8+state.gear*.42))*Math.max(.26,1-state.mph/200):0;
  const drag=6+state.mph*.065;
  state.mph=clamp(state.mph+(accel-drag-(braking?92:0))*dt,0,154);
  const speedFactor=state.mph/90;
  const bend=Math.sin(state.distance/380)*.24+Math.cos(state.distance/760)*.22;
  state.lane=clamp(state.lane+(turn*(1.05+speedFactor*.7)-bend*speedFactor)*dt,-1.65,1.65);
  if(Math.abs(state.lane)>1){state.damage=clamp(state.damage+dt*.11*(1+speedFactor),0,1);state.mph=Math.max(0,state.mph-dt*25);}
  if(go){state.fuel=Math.max(0,state.fuel-dt*.018);}
  const rev=rpm();if(rev>6900){state.overrev+=dt;}else state.overrev=Math.max(0,state.overrev-dt*1.9);
  if(state.overrev>.7)finish('ENGINE FAILURE: prolonged redline. Practice ended without changing your saved garage.');
  if(state.damage>=1)finish('CRASH: road departure caused terminal simulated damage. No credits or cars were lost.');
  if(state.fuel<=0)finish('Out of practice fuel. Return to the garage to reset the course.');
  if(state.mph>95)state.siren+=dt;else state.siren=Math.max(0,state.siren-dt*.5);
  if(state.siren>11.5&&state.siren<12){status('You hear a patrol siren. Slow down or risk an imaginary citation.');state.siren=12.01;}
  state.distance+=state.mph*mphToFeetPerSecond*dt;
  state.highest=Math.max(state.highest,state.mph);
  if(state.distance>=MAX_DISTANCE){
   finish('FINISHED! '+state.elapsed.toFixed(1)+' s · top speed '+Math.round(state.highest)+' mph · simulated damage '+Math.round(state.damage*100)+'%. No credit or score changes.');
  }
 }
 let raf=0,lastUI=0;
 function frame(t){
  if(!canvas.isConnected){dispose();return;}
  const dt=clamp((t-state.last)/1000,0,.08);state.last=t;
  updatePhysics(dt);
  if(t-lastUI>120){update();lastUI=t;}
  draw();raf=requestAnimationFrame(frame);
 }
 function dispose(){cancelAnimationFrame(raf);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);inputs.clear();if(root.isConnected)root.remove();if(cleanup===dispose)cleanup=null;}
 cleanup=dispose;
 raf=requestAnimationFrame(frame);
 update();draw();
}