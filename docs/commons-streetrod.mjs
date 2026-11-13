/* Street r0d Racing · The Commons 2026. Original fictional garage racing game.
 * Real server-backed garage, ranked solo time trials, asynchronous member duels.
 * No original Street Rod game art, trademark imagery, copied source, or music.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const board=document.getElementById('conversations');
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const ROOT_ID='streetrod-root';
const $=id=>document.getElementById(id);
const BADGES=[
 ['first_key','First Ignition','Complete your first race','🔑'],
 ['cipher_breaker','Cipher Breaker','Defeat the final mystery van','👑'],
 ['first_win','Victory Lane','Win your first race','🏆'],
 ['night_shift','Night Shift','Finish five races','🌙'],
 ['ten_races','Road Warrior','Complete ten races','🛣️'],
 ['fifty_races','Long Haul','Complete fifty races','⚙️'],
 ['hundred_races','Road Legend','Complete 100 races','👑'],
 ['eleven_second','Eleven Second Club','Record a total under 11.00 s','⚡'],
 ['street_champion','Street Champion','Win twenty races','🥇'],
 ['rival_slayer','Rival Slayer','Win a member challenge','🔥'],
 ['rival_king','Rival King','Win ten member challenges','♜'],
 ['collector','Car Collector','Own three cars','🚗'],
 ['full_build','Master Mechanic','Fully upgrade one car','🔧'],
 ['credit_millionaire','Garage Tycoon','Hold 100,000 game credits','💎'],
 ['six_figures','Six-Figure Racer','Earn 100,000 racing points','✨']
];
const ESC=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Number(x||0).toLocaleString('en-US');
const ms=x=>x==null?'—':(Number(x)/1000).toFixed(2)+' s';
const credits=x=>num(x)+' cr';
const niceDay=x=>{try{return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(x))}catch{return ''}};
const h=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!=null)n.textContent=String(content);return n};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const safeUUID=x=>/^[a-f0-9-]{36}$/i.test(x||'')?x:'';
let state=null;
const CAR=key=>state?.catalog?.find(x=>x.key===key) || {key:'rattler',name:'Rattler 48',base:14400,accent:'#ebbb58'};
if(board&&cfg?.enabled===true&&location.pathname.endsWith('community.html')){
 let client=null,uid=null,mounted=false,expanded=false,busy=false,timer=null,observer=null;
 let race=null,raceRaf=0,authChecked=false,dragSeed=0;
 function setStatus(msg,type='info'){
  const n=$('sr-status');if(n){n.textContent=msg;n.dataset.type=type;}
 }
 function mountFrame(){
  if($(ROOT_ID))return;
  const main=board.querySelector('.community-main');if(!main)return;
  const root=h('section','mahjong-game sr-game');root.id=ROOT_ID;
  root.innerHTML=`
   <button type="button" class="mahjong-entry-button" id="sr-toggle" aria-expanded="false" aria-controls="sr-inside">
      <span class="mahjong-entry-icon" aria-hidden="true">🏁</span>
      <span class="mahjong-entry-copy"><strong>Street r0d Racing</strong><small id="sr-button-sub">Garage builds · Solo races · Real member challenges</small></span>
      <span class="mahjong-chevron" aria-hidden="true">▾</span>
   </button>
   <div id="sr-inside" hidden>
    <div class="sr-header"><div><span class="sr-eyebrow">COWBOY'S COMMONS · ARCADE GARAGE</span><h2>Own the asphalt.</h2><p>Build your ride. Nail the launch. Hit three shifts. Race friends for the bragging rights.</p></div><div class="sr-wreath">★ <span>STREET</span> ★<br><b>r0d</b><br>RACING</div></div>
    <div class="sr-metrics"><div><span>GARAGE CREDITS</span><strong id="sr-credits">—</strong></div><div><span>YOUR BEST</span><strong id="sr-best">—</strong></div><div><span>YOUR POINTS</span><strong id="sr-points">—</strong></div><div><span>WINS / RIVALS</span><strong id="sr-wins">—</strong></div></div>
    <section class="sr-race-card" aria-label="Street r0d quarter mile race">
      <div class="sr-race-heading"><div><span class="sr-eyebrow">QUARTER-MILE STRIP · NIGHT MEET</span><h3 id="sr-car-name">Preparing the garage…</h3><p id="sr-car-tune">Engine, tires, transmission</p></div><span id="sr-mode-chip" class="sr-mode-chip">PRACTICE / SOLO</span></div>
      <canvas id="sr-track" width="960" height="340" role="img" aria-label="Animated nighttime drag-racing strip with your car and opponent"></canvas>
      <div class="sr-race-hud"><div><small>START LIGHT</small><strong id="sr-light">READY</strong></div><div><small>GEAR</small><strong id="sr-gear">N</strong></div><div><small>REV METER</small><div class="sr-rev-wrap"><div id="sr-rev" class="sr-rev"></div><i class="sr-rev-target"></i></div></div><div><small>RUN CLOCK</small><strong id="sr-clock">0.00</strong></div></div>
      <p class="sr-control-tip">Tap <b>LAUNCH</b> on green, then <b>SHIFT</b> when the rev meter hits the gold zone. One nitro burst per race. Keyboard: <b>Space</b> to launch/shift; <b>N</b> for nitro.</p>
      <div class="sr-controls">
       <button class="sr-action sr-primary" type="button" id="sr-start-solo" data-sr-action="solo">🏁 Solo Race</button>
       <button class="sr-action sr-outline" type="button" id="sr-start-duel" data-sr-action="challenge">⚔️ Post Member Challenge</button>
       <button class="sr-action sr-outline sr-boss-button" type="button" id="sr-start-boss" data-sr-action="boss">👑 Challenge Cipher Van X</button>
       <button class="sr-action sr-primary" type="button" id="sr-launch" data-sr-action="launch" hidden>LAUNCH!</button>
       <button class="sr-action sr-primary" type="button" id="sr-shift" data-sr-action="shift" hidden>SHIFT!</button>
       <button class="sr-action sr-nitro" type="button" id="sr-nitro" data-sr-action="nitro" hidden>NITRO</button>
       <button class="sr-action sr-outline" type="button" id="sr-abandon" data-sr-action="abandon" hidden>Abandon Run</button>
      </div>
      <p id="sr-status" class="sr-status" role="status" aria-live="polite">Pull into the lane when you're ready.</p>
      <div id="sr-result" class="sr-result" hidden></div>
    </section>
    <div class="sr-columns">
     <details class="sr-section" open><summary>🔧 Your Garage & Parts Counter</summary><div class="sr-body"><p class="sr-helper">Win races for fictional garage credits. Buy another car or upgrade the one selected. No real money.</p><div id="sr-garage-cars" class="sr-car-grid"></div><h4>Performance upgrades · Level 0–5</h4><div id="sr-parts" class="sr-parts"></div></div></details>
     <details class="sr-section" open><summary>⚔️ Multiplayer Challenge Board</summary><div class="sr-body"><p class="sr-helper">Real members, asynchronous head-to-head. Post a run and another approved member can race the same seeded course before the 24-hour challenge expires.</p><div id="sr-duels" class="sr-duel-list"></div><button type="button" class="sr-action sr-outline" data-sr-action="refresh">Refresh challenges</button></div></details>
     <details class="sr-section" open><summary>🏆 High Scores & Racing Records</summary><div class="sr-body"><div class="sr-score-table"><div class="sr-score-head"><span>DRIVER</span><span>BEST TOTAL</span><span>WINS</span></div><div id="sr-leaders"></div></div><h4>Your recent races</h4><div id="sr-recent"></div></div></details>
     <details class="sr-section"><summary>🎖️ Achievements & Awards</summary><div class="sr-body"><p class="sr-helper" id="sr-badge-count">Race to unlock awards.</p><div class="sr-badge-grid" id="sr-badges"></div></div></details>
    </div>
    <p class="sr-legal">Street r0d Racing is an original, independently created mini-game. Inspired by classic garage and street-racing game mechanics; not affiliated with the 1989 Street Rod game. Credits, races and prizes are fictional. PvP is asynchronous rather than simultaneous real-time.</p>
   </div>`;
  main.prepend(root);
  position();
  root.querySelector('#sr-toggle').addEventListener('click',()=>{
    expanded=!expanded;
    $('sr-toggle').setAttribute('aria-expanded',String(expanded));$('sr-inside').hidden=!expanded;
    if(expanded){render();void refresh(true);}else if(race)setStatus('Race continues until complete. Reopen to see the track.');
  });
  root.addEventListener('click',evt=>{
   const btn=evt.target.closest('[data-sr-action]');if(!btn||btn.disabled)return;
   const action=btn.dataset.srAction;
   if(action==='solo')void startRace('solo');
   else if(action==='challenge')void startRace('duel');
   else if(action==='boss')void startRace('boss');
   else if(action==='challenge-target')void startRace('duel',null,safeUUID(btn.dataset.memberId));
   else if(action==='join')void startRace('duel',safeUUID(btn.dataset.duelId));
   else if(action==='launch')handleLaunch();
   else if(action==='shift')handleShift();
   else if(action==='nitro')handleNitro();
   else if(action==='buy')void purchase(btn.dataset.item);
   else if(action==='select')void selectCar(btn.dataset.car);
   else if(action==='refresh')void refresh();
   else if(action==='abandon')void abandon();
  });
  drawTrack(0,false);
 }
 function syncPassport(){
  const modes=$('arcade-passport-modes');if(!modes||!state)return;
  let pill=$('sr-arcade-mode-pill');
  if(!pill){pill=h('div','arcade-mode-pill');pill.id='sr-arcade-mode-pill';pill.append(h('strong','', 'Street r0d Racing'),h('small','', ''));modes.append(pill);}
  const g=state.garage||{};
  const xp=Math.max(0,Math.floor(Number(g.points||0)/12)+30*Number(g.wins||0)+10*Number(g.races||0));
  const summary=`${num(xp)} XP · ${num(g.wins)} race wins`;
  const field=pill.querySelector('small');if(field&&field.textContent!==summary)field.textContent=summary;
  const subtitle=$('arcade-passport-subtitle');
  if(subtitle && /\/4 adventures started/.test(subtitle.textContent))subtitle.textContent=subtitle.textContent.replace('/4 adventures started','/5 adventures started');
 }
 function position(){
  const main=board?.querySelector('.community-main'),root=$(ROOT_ID);if(!main||!root)return;
  const anchors=['drawing-studio-game-root','letter-lock-root','word-game-root','mahjong-root','plate-game-root'];
  let anchor=null;for(const id of anchors){const el=$(id);if(el?.parentElement===main){anchor=el;break;}}
  if(anchor){if(root.previousElementSibling!==anchor)anchor.after(root)}
  else if(root.parentElement!==main)main.prepend(root);
  syncPassport();
 }
 function carCard(model,owned){
  const active=owned?.selected;
  const price=Number(model.price||0);
  const b=owned?active?'<span class="sr-owned">SELECTED</span>':`<button class="sr-action sr-mini" data-sr-action="select" data-car="${ESC(model.key)}">Drive this</button>`:
   `<button class="sr-action sr-mini" data-sr-action="buy" data-item="car:${ESC(model.key)}" ${state.garage.credits<price?'disabled':''}>Buy ${credits(price)}</button>`;
  return `<article class="sr-car-card ${active?'is-selected':''}"><div class="sr-car-icon" style="--sr-accent:${ESC(model.accent)}"><span class="sr-car-pic">${carSVG(model.accent)}</span></div><strong>${ESC(model.name)}</strong><small>${ESC(model.class)}</small><span class="sr-car-spec">Base ${ms(model.base)} · PWR ${model.power} · GRIP ${model.grip}</span>${b}</article>`;
 }
 function carSVG(c){return `<svg viewBox="0 0 158 63" aria-hidden="true" focusable="false"><ellipse cx="80" cy="54" rx="70" ry="6" fill="#0004"/><path d="M9 37 24 30 40 29 52 14 Q59 8 78 9 L106 9 124 30 142 33 150 42 144 50 12 50Z" fill="${c}" stroke="#16142c" stroke-width="4"/><path d="M52 29 60 15 102 15 115 30Z" fill="#232946"/><path d="M83 15V31" stroke="#fff7" stroke-width="3"/><path d="M20 40H145" stroke="#f9efb4" stroke-width="3"/><circle cx="42" cy="48" r="13" fill="#14131b" stroke="#d5cfe4" stroke-width="5"/><circle cx="119" cy="48" r="13" fill="#14131b" stroke="#d5cfe4" stroke-width="5"/><circle cx="42" cy="48" r="4" fill="#fff"/><circle cx="119" cy="48" r="4" fill="#fff"/></svg>`}
 function render(){
  if(!state||!$(ROOT_ID))return;
  const garage=state.garage||{}, owned=state.cars||[], chosen=owned.find(x=>x.selected)||owned[0], car=CAR(chosen?.key);
  $('sr-credits').textContent=credits(garage.credits);
  $('sr-best').textContent=ms(garage.best_ms);
  $('sr-points').textContent=num(garage.points);
  $('sr-wins').textContent=`${num(garage.wins)} / ${num(garage.duel_wins)}`;
  $('sr-button-sub').textContent=`Best ${ms(garage.best_ms)} · ${credits(garage.credits)} · ${num(garage.wins)} wins`;
  $('sr-car-name').textContent=car.name;
  $('sr-car-tune').textContent=`ENGINE ${chosen?.engine||0}/5 · TIRES ${chosen?.tires||0}/5 · GEARBOX ${chosen?.gearbox||0}/5`;
  $('sr-garage-cars').innerHTML=(state.catalog||[]).map(model=>carCard(model,owned.find(x=>x.key===model.key))).join('');
  $('sr-parts').innerHTML=['engine','tires','gearbox'].map(key=>{
   const level=Number(chosen?.[key]||0),price=250+level*250+(key==='engine'?100:key==='gearbox'?50:0);
   return `<div class="sr-part"><div><strong>${{engine:'Engine tuning',tires:'Street tires',gearbox:'Close-ratio gearbox'}[key]}</strong><small>Level ${level} / 5 · ${level===5?'MAX':credits(price)}</small></div><button class="sr-action sr-mini" data-sr-action="buy" data-item="${key}" ${level===5||garage.credits<price?'disabled':''}>${level===5?'MAXED':'+ Upgrade'}</button></div>`;
  }).join('');
  const me=uid;
  $('sr-duels').innerHTML=(state.duels?.length?state.duels.map(d=>{
    const mine=d.creator_id===me || d.challenger_id===me;
    const opponent=d.creator_id===me?'You':ESC(d.creator||'Member');
    const closed=d.status==='completed';const waiting=d.status==='matched';
    const name=mine?'Your match vs Commons':`Challenge by ${opponent}`;
    const win=closed?(d.winner_id===me?'YOU WIN':d.winner_id?'RIVAL WINS':'DRAW'):waiting?'MATCHED':'OPEN';
    const action=!mine&&d.status==='open'?`<button class="sr-action sr-mini" data-sr-action="join" data-duel-id="${ESC(d.id)}" ${race?'disabled':''}>Join & race</button>`:'';
    return `<div class="sr-duel"><div><strong>${name}</strong><small>${win} · ${d.status==='open'?'Accept within 24 hours':'Same track seed '+Number(d.seed)}</small>${d.creator_ms!=null||d.challenger_ms!=null?`<small>Times: ${ms(d.creator_ms)} vs ${ms(d.challenger_ms)}</small>`:''}</div>${action}</div>`;
   }).join(''):'<p class="sr-empty">No member challenges yet. Post the first one.</p>');
  $('sr-leaders').innerHTML=state.leaders?.length?state.leaders.map((l,i)=>`<div class="sr-score-row"><span><b>#${i+1}</b> ${ESC(l.name)}</span><strong>${ms(l.best_ms)}</strong><span>${num(l.wins)}</span></div>`).join(''):'<p class="sr-empty">The track record is waiting for its first driver.</p>';
  $('sr-recent').innerHTML=state.recent?.length?state.recent.map(r=>`<div class="sr-recent"><span>${r.mode==='duel'?'⚔️ Member duel':'🏁 Solo'} · ${ESC(CAR(r.car).name)}<small>${niceDay(r.created_at)}</small></span><strong>${ms(r.total_ms)}<small>+${num(r.points)} pts</small></strong></div>`).join(''):'<p class="sr-empty">Finish a race to start your history.</p>';
  const got=new Set(state.badges||[]);$('sr-badge-count').textContent=`${got.size} of ${BADGES.length} achievements unlocked`;
  $('sr-badges').innerHTML=BADGES.map(([id,name,desc,icon])=>`<div class="sr-badge ${got.has(id)?'unlocked':'locked'}"><span>${icon}</span><div><strong>${ESC(name)}</strong><small>${ESC(desc)}</small></div>${got.has(id)?'<b>✓</b>':''}</div>`).join('');
  if(!race){$('sr-start-solo').disabled=busy;$('sr-start-duel').disabled=busy;}
  renderControls();
  syncPassport();
 }
 async function refresh(silent=false){
  if(!client||!mounted||busy||race)return;
  try{const {data,error}=await client.rpc('community_streetrod_state');if(error)throw error;state=data;if(state.active)setStatus('An unfinished run was found. The race may have expired. You can clear it using Abandon Run.','warn');render();}
  catch(e){if(!silent)setStatus(e.message||'Could not load racing records.','warn')}
 }
 async function purchase(item){
  if(busy||race||!item)return;
  busy=true;setStatus('Working on the car…');try{const {data,error}=await client.rpc('community_streetrod_buy',{p_item:item});if(error)throw error;state=data;setStatus('Garage updated. Take it out for a spin!','good');render();}catch(e){setStatus(e.message||'Purchase failed','warn')}finally{busy=false;render()}
 }
 async function selectCar(key){
  if(busy||race)return;busy=true;try{const {data,error}=await client.rpc('community_streetrod_select',{p_car:key});if(error)throw error;state=data;setStatus('New ride selected.','good');render();drawTrack(0,false)}catch(e){setStatus(e.message||'Unable to switch cars','warn')}finally{busy=false}
 }
 async function startRace(mode,duelID=null,targetID=null){
  if(busy||race||!client||!state)return;
  if(mode==='duel'&&duelID!==null&&!safeUUID(duelID))return;
  if(targetID!==null&&!safeUUID(targetID))return;
  busy=true;setStatus(mode==='duel'?'Preparing a real member challenge…':'Staging on the starting line…');
  $('sr-start-solo').disabled=$('sr-start-duel').disabled=$('sr-start-boss').disabled=true;
  try{
   const endpoint=mode==='boss'?'community_streetrod_start_boss':targetID?'community_streetrod_start_targeted':'community_streetrod_start';
   const args=mode==='boss'?{}:targetID?{p_target:targetID}:{p_mode:mode,p_duel_id:duelID};
   const {data,error}=await client.rpc(endpoint,args);if(error)throw error;
   race={...data,stage:'countdown',localStarted:performance.now(),goAt:performance.now()+3100,
    launch:null,shifts:[],nitro:null,finished:false,showProgress:0};
   $('sr-mode-chip').textContent=mode==='boss'?'CIPHER VAN X · CHAMPIONSHIP':mode==='duel'?'REAL MEMBER CHALLENGE':'SINGLE PLAYER';
   $('sr-start-solo').hidden=$('sr-start-duel').hidden=$('sr-start-boss').hidden=true;
   $('sr-launch').hidden=false;$('sr-launch').disabled=true;
   $('sr-shift').hidden=true;$('sr-nitro').hidden=true;$('sr-abandon').hidden=false;
   $('sr-result').hidden=true;
   setStatus('Watch the tree… 3 · 2 · 1 · GREEN');
   cancelAnimationFrame(raceRaf);raceRaf=requestAnimationFrame(tick);
  }catch(e){setStatus(e.message||'Could not stage race','warn')}
  finally{busy=false;if(!race){$('sr-start-solo').disabled=$('sr-start-duel').disabled=$('sr-start-boss').disabled=false;}}
 }
 function raceTime(){return race?performance.now()-race.goAt:0}
 function handleLaunch(){
  if(!race||race.stage!=='live'||race.launch!==null)return;
  const t=Math.round(raceTime());if(t<0)return;
  race.launch=clamp(t,0,1800);
  $('sr-launch').hidden=true;$('sr-shift').hidden=false;$('sr-nitro').hidden=false;
  $('sr-gear').textContent='1';setStatus('Clean launch! Shift through three gears when the meter is gold.');
 }
 function handleShift(auto=false){
  if(!race||race.stage!=='live'||race.launch===null||race.shifts.length>=3)return;
  const t=Math.round(raceTime());const prev=race.shifts.at(-1)||0;
  const adjusted=clamp(Math.max(prev+1,t),500,11500);
  race.shifts.push(adjusted);
  $('sr-gear').textContent=String(race.shifts.length+1);
  setStatus(`${auto?'Automatic late shift':'Shift registered'} · gear ${race.shifts.length+1}`,
    auto?'warn':'good');
  if(race.shifts.length>=3)$('sr-shift').hidden=true;
 }
 function handleNitro(){
  if(!race||race.stage!=='live'||race.launch===null||race.nitro!==null)return;
  race.nitro=clamp(Math.round(raceTime()),1500,11000);
  $('sr-nitro').disabled=true;$('sr-nitro').textContent='BOOST USED';setStatus('Nitro fired. One burst per race!','good');
 }
 function renderControls(){
  $('sr-abandon').hidden=!(race||state?.active);
  $('sr-abandon').textContent=race?'Abandon Run':'Clear Unfinished Run';
  $('sr-start-solo').hidden=!!race;$('sr-start-duel').hidden=!!race;$('sr-start-boss').hidden=!!race;
  $('sr-launch').hidden=!(race?.stage==='countdown'||race?.stage==='live'&&race.launch===null);
  $('sr-shift').hidden=!(race?.stage==='live'&&race.launch!==null&&race.shifts.length<3);
  $('sr-nitro').hidden=!(race?.stage==='live'&&race.launch!==null&&race.nitro===null);
 }
 function tick(now){
  if(!race)return;
  const t=now-race.goAt;
  if(t<0){
   const c=Math.ceil(-t/1000);$('sr-light').textContent=c>3?'READY':String(c);$('sr-light').dataset.status='red';
   $('sr-clock').textContent='0.00';drawTrack(0,false);
  } else if(race.stage==='countdown'){race.stage='live';$('sr-light').textContent='GREEN';$('sr-light').dataset.status='green';$('sr-launch').disabled=false;setStatus('GREEN! TAP LAUNCH!');}
  if(race.stage==='live'){
   if(race.launch===null&&t>=1600)handleLaunch();
   const ideals=[2100,4500,6900];if(race.launch!==null){
     if(race.shifts.length<3&&t>ideals[race.shifts.length]+1500)handleShift(true);
     const target=ideals[race.shifts.length]||11000;
     const rev=clamp(50+(t-target)/24,0,100);$('sr-rev').style.width=rev+'%';
   }
   $('sr-clock').textContent=(Math.max(0,t)/1000).toFixed(2);
   drawTrack(clamp(t/11500,0,1),true);
   if(t>=11500){race.stage='finishing';renderControls();void finishRace();return;}
  }
  raceRaf=requestAnimationFrame(tick);
 }
 async function finishRace(){
  if(!race||race.finished)return;
  race.finished=true;const r=race;
  while(r.shifts.length<3){const desired=[3600,6000,8900][r.shifts.length];r.shifts.push(Math.max((r.shifts.at(-1)||0)+1,desired));}
  setStatus('At the finish line! Checking your official time…');
  for(let i=0;i<4;i++){
   try{
    const {data,error}=await client.rpc('community_streetrod_finish',{p_run_id:r.id,p_launch_ms:r.launch??1600,p_shifts:r.shifts,p_nitro_ms:r.nitro});
    if(error){if(/still running/i.test(error.message)&&i<3){await new Promise(resolve=>setTimeout(resolve,700));continue;}throw error;}
    state=data.state;
    const verdict=data.mode==='boss'?(data.win?'CIPHER CHAMPION':'CIPHER VAN SURVIVES'):data.mode==='duel'?(data.win===null?'RIVAL CHALLENGE POSTED':data.win?'DUEL VICTORY':'DUEL RESULT'):(data.win?'VICTORY LANE':'FINISH LINE');
    $('sr-result').innerHTML=`<strong>${ESC(verdict)}</strong><div><span><b>${ms(data.total_ms)}</b><small>TOTAL TIME</small></span><span><b>${ms(data.reaction_ms)}</b><small>REACTION</small></span><span><b>+${num(data.points)}</b><small>POINTS</small></span><span><b>+${credits(data.credits_earned)}</b><small>GARAGE</small></span></div><p>${data.mode==='boss'?`Cipher Van X: ${ms(data.opponent_ms)}. ${data.win?'Victory! Cipher Breaker trophy unlocked.':'Upgrade and tune your build, then challenge the van again.'}`:data.mode==='duel'&&data.win===null?'Your real-player challenge is posted. Another member can accept it from the board.':data.opponent_ms==null?'Check the challenge board for the other racer.':`Opponent total: ${ms(data.opponent_ms)}.`}</p>`;
    $('sr-result').hidden=false;
    setStatus('Results saved to your Commons racing profile.','good');
    race=null;renderControls();$('sr-nitro').disabled=false;$('sr-nitro').textContent='NITRO';$('sr-gear').textContent='N';$('sr-mode-chip').textContent='GARAGE OPEN';render();return;
   }catch(err){setStatus(err.message||'Could not submit race result','warn');break;}
  }
  race=null;renderControls();void refresh();
 }
 async function abandon(){
  if(!race){const existing=state?.active;if(!existing)return;race={id:existing.id,stage:'finishing'};}
  const id=race.id;cancelAnimationFrame(raceRaf);race=null;renderControls();
  setStatus('Run abandoned. No score or prize was earned.','warn');
  try{const {data,error}=await client.rpc('community_streetrod_abandon',{p_run_id:id});if(error)throw error;state=data;render();}catch(e){setStatus(e.message,'warn')}
 }
 function drawTrack(progress,live){
  const cv=$('sr-track');if(!cv)return;
  const ctx=cv.getContext('2d');if(!ctx)return;
  const w=cv.width,ht=cv.height,seed=Number(race?.seed||1);
  const sky=ctx.createLinearGradient(0,0,0,200);sky.addColorStop(0,'#0d102d');sky.addColorStop(.62,'#402446');sky.addColorStop(1,'#d37465');ctx.fillStyle=sky;ctx.fillRect(0,0,w,ht);
  ctx.fillStyle='#f8c8aa';ctx.beginPath();ctx.arc(805,72,33,0,Math.PI*2);ctx.fill();
  for(let i=0;i<18;i++){const bx=(i*73+seed*7)%1030-40,bh=60+((i*41)%95);ctx.fillStyle=i%3===0?'#16132f':'#1d183a';ctx.fillRect(bx,169-bh,62,bh+40);
   ctx.fillStyle='#eccb7d88';for(let x=bx+12;x<bx+55;x+=18)for(let y=170-bh+16;y<160;y+=22){if((x+y+i)%4<2)ctx.fillRect(x,y,6,8)} }
  ctx.fillStyle='#302838';ctx.fillRect(0,175,w,165);
  ctx.fillStyle='#df958d';ctx.fillRect(0,180,w,9);ctx.fillStyle='#f4c7a5';ctx.fillRect(0,314,w,8);
  ctx.fillStyle='#fff9dfb0';const offset=(progress*490)%160;for(let x=-140-offset;x<w+200;x+=170){ctx.fillRect(x,248,95,5)}
  ctx.fillStyle='#5c4148';ctx.fillRect(0,170,w,13);ctx.fillStyle='#0d1620';ctx.fillRect(0,318,w,23);
  const finishX=735;ctx.fillStyle='#f6ead5';ctx.fillRect(finishX,181,8,132);
  for(let y=181;y<314;y+=14)for(let j=0;j<2;j++)if(((y/14|0)+j)%2===0){ctx.fillStyle='#161222';ctx.fillRect(finishX+j*5,y,5,14)}
  ctx.fillStyle='#e8e6e6';ctx.font='bold 15px system-ui';ctx.fillText('1/4 MILE',753,194);
  const me=CAR(race?.car||state?.cars?.find(c=>c.selected)?.key);const driveX=live?clamp(90+progress*690,70,785):120;
  drawCar(ctx,driveX,230,me.accent||'#ebbb58',1);
  const other=(live?clamp(90+progress*670+(seed%13-6)*5,70,780):135);
  if(race?.mode==='boss')drawCipherVan(ctx,other,278,.88);else drawCar(ctx,other,278,'#9a80df',.88);
  ctx.font='800 18px system-ui';ctx.fillStyle='#fff';ctx.fillText('YOU',clamp(driveX-25,5,w-80),193);
  if(race?.mode==='boss'){ctx.font='bold 13px system-ui';ctx.fillStyle='#f4c487';ctx.fillText('CIPHER VAN X',Math.max(8,other-42),294);}
  if(progress>=1){ctx.fillStyle='#ffd67e';ctx.font='900 26px system-ui';ctx.fillText('FINISH!',w-145,245)}
 }
 function drawCar(ctx,x,y,color,scale){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,9,85,13,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#14131b';for(const xx of [-55,52]){ctx.beginPath();ctx.arc(xx,8,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ddd';ctx.beginPath();ctx.arc(xx,8,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#14131b';}
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-80,6);ctx.lineTo(-80,-15);ctx.lineTo(-43,-22);ctx.lineTo(-24,-49);ctx.lineTo(33,-49);ctx.lineTo(53,-22);ctx.lineTo(73,-17);ctx.lineTo(87,1);ctx.lineTo(79,7);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#0a1024';ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#151d33';ctx.beginPath();ctx.moveTo(-20,-43);ctx.lineTo(29,-43);ctx.lineTo(44,-22);ctx.lineTo(-31,-22);ctx.closePath();ctx.fill();ctx.strokeStyle='#c1dff8';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-73,-13);ctx.lineTo(72,-13);ctx.stroke();
  ctx.fillStyle='#ffe5b5';ctx.fillRect(76,-13,10,8);ctx.fillStyle='#fc6f75';ctx.fillRect(-80,-11,7,8);
  ctx.restore();
 }
 function drawCipherVan(ctx,x,y,scale){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ctx.fillStyle='#090c16ad';ctx.beginPath();ctx.ellipse(0,11,97,13,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#191521';
  for(const a of [-63,62]){ctx.beginPath();ctx.arc(a,10,17,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#d5b887';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#c3bcc5';ctx.beginPath();ctx.arc(a,10,7,0,2*Math.PI);ctx.fill();ctx.fillStyle='#191521';}
  ctx.fillStyle='#4b315e';ctx.strokeStyle='#151421';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-91,6);ctx.lineTo(-91,-51);ctx.quadraticCurveTo(-90,-64,-68,-66);ctx.lineTo(57,-65);ctx.quadraticCurveTo(78,-60,84,-37);ctx.lineTo(96,-12);ctx.lineTo(95,8);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#1a323c';ctx.fillRect(-69,-55,63,22);ctx.fillRect(10,-55,43,22);
  ctx.strokeStyle='#d1ad79';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-77,-24);ctx.lineTo(-47,-39);ctx.lineTo(-20,-22);ctx.lineTo(9,-42);ctx.lineTo(34,-22);ctx.lineTo(68,-43);ctx.stroke();
  ctx.fillStyle='#f5d5a3';ctx.fillRect(86,-30,11,9);ctx.fillStyle='#d67a71';ctx.fillRect(-95,-26,8,10);
  ctx.restore();
 }
 function onKey(ev){
  if(!race||!expanded||ev.metaKey||ev.ctrlKey||ev.altKey||ev.target?.closest('input,textarea,select'))return;
  if(ev.code==='Space'){ev.preventDefault();if(race.launch===null)handleLaunch();else handleShift();}
  else if(ev.key.toLowerCase()==='n'){ev.preventDefault();handleNitro();}
 }
 async function mount(){
  if(mounted||board.hidden||!client)return;
  try{
   const {data:{session}}=await client.auth.getSession();const id=session?.user?.id;if(!id)return;
   const {data:member,error}=await client.from('community_members').select('status').eq('user_id',id).maybeSingle();if(error||member?.status!=='approved')return;
   const {data:profile,error:err}=await client.rpc('community_streetrod_state');if(err)throw err;
   uid=id;state=profile;mounted=true;mountFrame();render();timer=setInterval(()=>{if(!document.hidden&&mounted&&!race)void refresh(true);},22000);
  }catch(e){/* The existing Commons continues even if the optional racing game fails. */}
 }
 function unmount(){
  cancelAnimationFrame(raceRaf);race=null;mounted=false;uid=null;state=null;expanded=false;
  if(timer){clearInterval(timer);timer=null;}$(ROOT_ID)?.remove();
 }
 async function start(){
  if(!board||!cfg?.supabaseUrl||!cfg?.publishableKey)return;
  try{
   const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
   const local=window.localStorage,session=window.sessionStorage;
   const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
   const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
   client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
   let delay=0;const schedule=()=>{clearTimeout(delay);delay=setTimeout(()=>{if(board.hidden)unmount();else if(mounted)position();else void mount();},180)};
   observer=new MutationObserver(schedule);observer.observe(board,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true});
   document.addEventListener('keydown',onKey);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
   client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')unmount();schedule();});
   schedule();
  }catch{/* Racing arcade is optional. */}
 }
 void start();
}
