/*
 * COWBOY'S STREET R0D: REBORN (1989 gameplay architecture)
 * New presentation/controller built around the documented 1989 state machine,
 * using the MIT-licensed reverse-engineered Street Rod SDL3 port as research:
 * https://github.com/kylofon/street-rod-sdl3
 * Its original DOS game data, artwork and executable are NOT included here.
 * We retain existing Commons Supabase RPCs, saved game state and mechanical
 * revision checks. No parallel game economy or unverified race results.
 */
const $=id=>document.getElementById(id);
const BODY=document.body;
const FULL=new Set(['garage','paper','parts','diner','drive','calendar','tune']);
const VIEW_LABELS={garage:'THE GARAGE',paper:'CLASSIFIED ADS',parts:'AUTO PARTS',diner:'BOB’S DRIVE-IN',drive:'ON THE ROAD',calendar:'SUMMER 1963',tune:'IGNITION TIMING',gas:'FUEL STOP',crew:'COMMONS DRIVERS',underbody:'UNDER THE CAR',licence:'DRIVER LICENCE'};
const NAV={
 garage:[['NEWSPAPER','paper'],['POP HOOD','hood'],['GO TO DINER','diner'],['GAS STATION','gas'],['CALENDAR','calendar'],['YOUR CARS','paper']],
 paper:[['GARAGE','garage'],['PREVIOUS','prev'],['NEXT','next'],['PARTS SHOP','parts']],
 parts:[['GARAGE','garage'],['PREVIOUS','prev'],['NEXT','next'],['LIFT CAR','underbody'],['POP HOOD','hood']],
 diner:[['GARAGE','garage'],['PREVIOUS','prev'],['NEXT','next'],['OUR DRIVERS','crew']],
 drive:[['GARAGE','garage'],['DRIVE-IN','diner']],
 calendar:[['GARAGE','garage'],['CLASSIFIEDS','paper']],
 tune:[['HOOD','hood'],['GARAGE','garage']],
 gas:[['FILL TANK','fill'],['GARAGE','garage'],['DINER','diner']],
 crew:[['DINER','diner'],['GARAGE','garage']],
 underbody:[['WRENCH','hood'],['GARAGE','garage']]
};
const HOTSPOTS={
 garage:[
  ['Check newspaper','paper',3,75,17,18],['Pop the hood','hood',28,56,47,29],
  ['Tune engine','tune',43,22,16,21],['Check calendar','calendar',89,20,10,27],
  ['Hit the street','diner',77,78,21,14],['Radio and engine parts','parts',64,21,22,27]
 ],
 paper:[['Previous classified','prev',1,34,12,35],['Next classified','next',87,34,12,35]],
 diner:[['Challenge this driver','challenge',33,58,51,26],['Return to garage','garage',70,86,29,12]],
 parts:[['Work under hood','hood',56,24,38,30]],
 calendar:[['Return to garage','garage',77,80,20,17]]
};
const TEAM=['Coco','Ana','Wizardhardt','Eliot','Emma','Erica','Eloy','Evi'];
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=room=>VIEW_LABELS[room]||'MOTOR WORKS';
const roomNow=()=>BODY.dataset.arcadeScene||'garage';
const isArcade=()=>BODY.classList.contains('arcade-on')&&BODY.dataset.arcadeGame==='streetrod'&&roomNow()!=='junior';
const root=()=>$('streetrod-summer');
const source=()=>$('ss-scene');
const portrait=()=>{
 const el=$('srm-players')?.querySelector('.srm-player');
 return el?el:null;
};
let panel=null,sourceObserver=null,rootObserver=null,bodyObserver=null;
let splash=true,sideRoom='',page={paper:0,parts:0,diner:0,crew:0},lastNative='',lastRoom='',travelToken=0,travelTimer=null;
let tick=0,renderQueued=false,stageKey='',liveBridge=false;
const stage=()=>$('sr-reborn');
const currentRoom=()=>sideRoom||roomNow();
function metrics(){
 const values={};
 for(const box of $('ss-metrics')?.children||[]){
  const name=box.querySelector('small')?.textContent?.trim()?.toLowerCase();
  if(name)values[name]=box.querySelector('strong')?.textContent?.trim()||'';
 }
 return values;
}
function gameCar(){
 const m=metrics(),name=m.car||'RATTLER';
 const lower=name.toLowerCase();
 const body=/van|bus/.test(lower)?'van':/wagon|nomad/.test(lower)?'wagon':
  /truck|pickup/.test(lower)?'truck':/muscle|fastback/.test(lower)?'muscle':
  /sedan|hardtop/.test(lower)?'hardtop':'coupe';
 return {name,body};
}
function nativeRecords(kind){
 const host=source();if(!host)return [];
 const sel=kind==='paper'?'.ss-ads > .ss-ad':
  kind==='diner'?'.ss-rivals > .ss-rival':
  kind==='parts'?'.ss-parts-counter > article':null;
 return sel?[...host.querySelectorAll(sel)]:[];
}
function visibleRecord(){
 const list=nativeRecords(currentRoom());
 if(!list.length)return null;
 const n=currentRoom();
 page[n]=Math.min(Math.max(0,page[n]||0),list.length-1);
 return list[page[n]];
}
function originalControl(action){
 return source()?.querySelector('[data-ss-action="'+action+'"]')||root()?.querySelector('[data-ss-action="'+action+'"]');
}
function showStatus(text){
 const out=stage()?.querySelector('.sr-v3-context');
 if(out)out.textContent=String(text).slice(0,130);
}
function choose(target){
 if(target==='prev'||target==='next'){
  const r=currentRoom(),records=nativeRecords(r);
  if(r==='crew'){page.crew=Math.max(0,page.crew+(target==='next'?1:-1));redraw(true);return;}
  if(!records.length)return;
  page[r]=(page[r]+(target==='next'?1:-1)+records.length)%records.length;
  redraw(true);return;
 }
 if(target==='hood'){splash=false;showWorkbench();return;}
 if(target==='challenge'){
  const card=visibleRecord();
  card?.querySelector('[data-ss-action="choose_rival"]:not(:disabled)')?.click();
  return;
 }
 if(target==='fill'){
  originalControl('refuel')?.click();showStatus('Tank refill is saved through the original game.');
  return;
 }
 if(target==='licence'||target==='crew'||target==='gas'||target==='underbody'){
  sideRoom=target;splash=false;redraw(true);return;
 }
 if(target==='tune'){
  sideRoom='tune';splash=false;redraw(true);return;
 }
 if(!FULL.has(target))return;
 sideRoom='';splash=false;
 const changed=roomNow()!==target;
 const travel=(roomNow()==='garage'&&target==='diner')||(roomNow()==='diner'&&target==='garage');
 const go=()=>{
  if(!isArcade())return;
  if(changed){
   const b=$('arcade-hud-scenes')?.querySelector('[data-arcade-scene="'+target+'"]');
   if(b){b.click();return;}
   const native=$('ss-tabs')?.querySelector('[data-ss-tab="'+target+'"]');
   native?.click();
  }
  redraw(true);
 };
 if(travel){
  const current=++travelToken;
  const art=stage()?.querySelector('.sr-v3-canvas');
  if(art)window.COWBOY_STREETROD_PAINT?.(art,'drive',{speed:32,rpm:2300,subtitle:'CRUISING THROUGH TOWN'});
  showStatus('CRUISING THROUGH TOWN · TAP TO SKIP');
  stage()?.classList.add('sr-v3-travel');
  clearTimeout(travelTimer);
  travelTimer=setTimeout(()=>{if(current===travelToken){stage()?.classList.remove('sr-v3-travel');go();}},matchMedia?.('(prefers-reduced-motion:reduce)')?.matches?50:420);
 }else go();
}
function showWorkbench(){
 const trigger=source()?.querySelector('[data-ss-action="workshop"]')||
  root()?.querySelector('#ss-scene [data-ss-action="workshop"]');
 if(!trigger){choose('parts');return;}
 trigger.click();
 showStatus('Real fasteners: loosen, lift, refit, torque. Progress saves automatically.');
}
function cardHTML(el){
 if(!el)return '<p class="sr-v3-empty">No listings loaded. Try Refresh or check your Commons sign-in.</p>';
 const cp=el.cloneNode(true);
 cp.removeAttribute('id');
 cp.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
 if(currentRoom()==='diner'){
  const boss=cp.querySelector('[data-rival="cipher"]');
  if(boss){
   const name=cp.querySelector('strong');
   if(name)name.textContent='THE MYSTERY MACHINE · FINAL BOSS';
   const car=cp.querySelector('p');if(car)car.textContent='Turquoise flower-power mystery van';
   cp.classList.add('sr-v3-boss-card');
   cp.setAttribute('aria-label','Mystery Machine, final boss, original story rival identifier preserved');
  }
 }
 cp.classList.add('sr-v3-record');
 return cp.outerHTML;
}
function sourcePanel(room){
 const src=source();
 if(!src)return '<p class="sr-v3-empty">Loading your original seasonal garage…</p>';
 if(room==='paper'||room==='parts'||room==='diner'){
  const records=nativeRecords(room),index=page[room]||0;
  if(!records.length)return '<div class="sr-v3-empty">No '+safe(room)+' entries available yet.</div>';
  return '<div class="sr-v3-record-count"><span>'+safe(room.toUpperCase())+' '+(index+1)+' / '+records.length+'</span>'+
   '<span>‹ SWIPE OR USE ARROWS ›</span></div>'+
   cardHTML(visibleRecord())+
   (room==='parts'?'<p class="sr-v3-tip">Buy a part, then return to your real workbench to install it.</p>':'');
 }
 if(room==='garage'){
  const m=metrics(),car=gameCar();
  const status=src.querySelector('.ss-garage-stats')?.textContent?.trim()||'';
  const actions=['refuel','repair','bumpers','roof'].map(type=>{
   const btn=src.querySelector('[data-ss-action="'+type+'"]');
   return btn?btn.outerHTML:'';
  }).join('');
  return '<div class="sr-v3-garage-meta"><strong>'+safe(car.name)+'</strong><small>'+safe(status.slice(0,110))+'</small></div>'+
   '<div class="sr-v3-quick">'+actions+'</div>'+
   '<div class="sr-v3-readout"><span>SUMMER '+safe(m.date||'1963')+'</span><span>WIN '+safe(m['race wins']||'0')+'</span></div>';
 }
 if(room==='tune'){
  return '<p class="sr-v3-tip">Turn the distributor a notch at a time, then SAVE your adjustment.</p>'+
   (src.querySelector('.ss-timing-bench')?.outerHTML||'')+
   (src.querySelector('form[data-ss-form="tune"]')?.outerHTML||'');
 }
 if(room==='gas'){
  const b=source()?.querySelector('[data-ss-action="refuel"]');
  return '<div class="sr-v3-gas"><strong>GASOLINE · FULL SERVICE</strong>'+
   '<p>The original game requires fuel to leave the garage.</p>'+
   (b?b.outerHTML:'<p>Select a car before refueling.</p>')+'</div>';
 }
 if(room==='calendar'){
  const m=metrics();
  const calendar=src.querySelector('.ss-calendar-scene');
  return '<div class="sr-v3-cal"><strong>'+safe(m.date||'SUMMER 1963')+'</strong>'+
   '<span>'+safe(m['summer days left']||'')+' DAYS LEFT</span>'+
   '<span>'+safe(m['race wins']||'0')+' WINS</span>'+
   (calendar?.querySelector('[data-ss-action="rest"]')?.outerHTML||'')+
   '</div>';
 }
 if(room==='underbody'){
  return '<div class="sr-v3-under"><strong>UNDERCAR SERVICE</strong><p>Transmission and wheel bolts are physical, saved parts. Open the workbench to unfasten them. Jack the car before working on wheels.</p>'+
   '<button type="button" data-v3-action="hood">WRENCH ON REAL PARTS</button></div>';
 }
 if(room==='crew')return crewHTML();
 if(room==='drive'){
  if(src.querySelector('.ss-drive-controls')){
   const c=src.querySelector('.ss-drive-controls').cloneNode(true);
   c.classList.add('sr-v3-drive-controls');
   return '<div class="sr-v3-telemetry" aria-live="off">GEAR / SPEED / RPM</div>'+c.outerHTML+
    (src.querySelector('[data-ss-action="abandon"]')?.outerHTML||'');
  }
  const results=src.querySelector('.ss-race-result');
  if(results)return results.outerHTML+
   (src.querySelector('.ss-actions')?.outerHTML||'');
  return '<div class="sr-v3-empty">'+safe(src.textContent?.slice(0,170)||'Choose a rival at the diner to race.')+
   '<button type="button" data-v3-action="diner">GO TO THE DINER</button></div>';
 }
 return '';
}
function crewHTML(){
 const list=[...($('srm-players')?.querySelectorAll('.srm-player')||[])];
 if(list.length){
  const i=Math.min(page.crew||0,list.length-1);
  const el=list[i],avatar=el.querySelector('.srm-avatar')?.outerHTML||'';
  return '<div class="sr-v3-crew">'+avatar+
   '<strong>'+safe(el.querySelector('.srm-person h4')?.textContent||'COMMONS DRIVER')+'</strong>'+
   '<p>'+safe(el.querySelector('.srm-player-metrics')?.textContent?.replace(/\s+/g,' ').slice(0,115)||'')+'</p>'+
   '<small>'+ (i+1)+' / '+list.length+' · APPROVED MEMBER ROSTER</small></div>';
 }
 return '<div class="sr-v3-crew"><p>Member driver cards load from the existing Commons roster. No avatar photos are stored separately.</p>'+
  '<div class="sr-v3-crew-fallback">'+TEAM.map(name=>'<span title="'+safe(name)+'">'+safe(name.slice(0,1))+'<small>'+safe(name)+'</small></span>').join('')+'</div></div>';
}
function installChallenge(){
 const outer=source(),pocket=stage()?.querySelector('.sr-v3-pocket');
 if(!pocket||!outer)return;
 const form=outer.querySelector(':scope > .ss-challenge-form');
 if(form){
  pocket.replaceChildren(form);form.classList.add('sr-v3-challenge');
  stageKey+=':challenge';
 }
}
function intro(){
 return '<div class="sr-v3-intro"><small>1989 COMPUTER PRESENTATION · COWBOY EDITION</small>'+
  '<h2>STREET R0D</h2><p>THE SUMMER OF 1963</p>'+
  '<p>Buy it. Build it. Race it. Beat the Mystery Machine before school starts.</p>'+
  '<button type="button" data-v3-action="continue">CONTINUE SAVED SUMMER ▶</button>'+
  '<button type="button" data-v3-action="licence">DRIVER LICENCE / CREW</button></div>';
}
function footer(room){
 const entries=NAV[room]||NAV.garage;
 const bar=document.createElement('nav');bar.className='sr-v3-toolbar';bar.setAttribute('aria-label','Street r0d locations');
 for(const [name,target] of entries){
  const b=document.createElement('button');b.type='button';b.dataset.v3Action=target;b.textContent=name;
  bar.append(b);
 }
 return bar;
}
function svgBoss(){
 // Original sprite built from rectangles; no copyrighted cartoon asset.
 return '<span class="sr-v3-boss-mark" aria-hidden="true">✿ MYSTERY ✿</span>';
}
function paint(){
 const c=stage()?.querySelector('canvas.sr-v3-canvas');if(!c)return;
 const car=gameCar(),m=metrics(),room=currentRoom();
 const target=room==='licence'||room==='crew'?'garage':
  room==='underbody'?'gearbox':room==='gas'?'gas':room==='tune'?'tune':
  room==='paper'?'paper':room;
 const options={carKey:car.name,body:car.body,
  bankroll:Number(String(m.wallet||'').replace(/[^\d]/g,''))||0,
  label:car.name,subtitle:label(room).slice(0,31)};
 const rival=visibleRecord();
 if(room==='diner'&&rival?.querySelector('[data-rival="cipher"]'))options.boss=true;
 if(room==='drive'){
  const native=source();
  options.speed=parseFloat(native?.querySelector('#ss-speed')?.textContent||'0')||0;
  options.rpm=parseFloat(native?.querySelector('#ss-rpm')?.textContent||'0')||0;
  options.gear=native?.querySelector('#ss-gear')?.textContent?.trim()||'1';
  options.progress=(parseFloat(native?.querySelector('#ss-distance')?.textContent||'0')||0)/100;
 }
 window.COWBOY_STREETROD_PAINT?.(c,target,options);
 if(room==='drive'){
  const el=stage()?.querySelector('.sr-v3-telemetry');
  if(el)el.textContent=Math.round(options.speed)+' MPH · '+Math.round(options.rpm)+' RPM · GEAR '+options.gear;
 }
}
function build(){
 const host=source();if(!host)return;
 const el=document.createElement('section');el.id='sr-reborn';el.className='sr-v3';
 el.setAttribute('aria-label','Classic Street r0d single-screen game');
 el.innerHTML='<header class="sr-v3-head"><strong>STREET R0D · '+safe(label(currentRoom()))+'</strong>'+
  '<span class="sr-v3-bank">'+safe(metrics().wallet||'SUMMER 1963')+'</span></header>'+
  '<div class="sr-v3-art"><canvas class="sr-v3-canvas" width="320" height="200" aria-label="'+safe(label(currentRoom()))+' retro game view"></canvas>'+
  '<div class="sr-v3-hotspots"></div></div>'+
  '<p class="sr-v3-context" role="status">Move the wrench to a workshop object or choose a location.</p>'+
  '<div class="sr-v3-pocket"></div>';
 el.append(footer(currentRoom()));host.append(el);panel=el;
 el.addEventListener('click',event=>{
  const target=event.target.closest('[data-v3-action]');
  if(target){event.preventDefault();event.stopPropagation();
   const next=target.dataset.v3Action;
   if(next==='continue'){splash=false;choose(gameCar().name==='NO CAR'?'paper':'garage');return;}
   choose(next);
  }
 },true);
 el.addEventListener('click',event=>{
  const btn=event.target.closest('[data-ss-timing-step]');
  if(!btn)return;
  event.preventDefault();event.stopPropagation();
  const form=el.querySelector('form[data-ss-form="tune"]'),select=form?.querySelector('[name=setting]');
  if(!select)return;
  const value=Math.max(-3,Math.min(3,Number(select.value)+Number(btn.dataset.ssTimingStep)));
  select.value=String(value);
  const out=el.querySelector('#ss-timing-number');if(out)out.textContent=value===0?'0 · BASELINE':value>0?'+'+value+' ADVANCED':value+' RETARDED';
  el.querySelector('.ss-distributor-rotor')?.style.setProperty('--distributor-angle',(value*17)+'deg');
 },true);
 const hotspots=el.querySelector('.sr-v3-hotspots');
 for(const [name,target,left,top,width,height] of HOTSPOTS[currentRoom()]||[]){
  const b=document.createElement('button');b.type='button';
  b.className='sr-v3-hotspot';b.dataset.v3Action=target;
  b.title=name;b.setAttribute('aria-label',name);
  Object.assign(b.style,{left:left+'%',top:top+'%',width:width+'%',height:height+'%'});
  hotspots.append(b);
 }
 const pocket=el.querySelector('.sr-v3-pocket');
 if(splash&&!source()?.querySelector('.ss-drive-controls')){
  pocket.innerHTML=intro();el.classList.add('sr-v3-boot');
 }else{
  pocket.innerHTML=sourcePanel(currentRoom());
  if(currentRoom()==='diner'&&visibleRecord()?.querySelector('[data-rival="cipher"]')){
   pocket.insertAdjacentHTML('afterbegin',svgBoss());
  }
  installChallenge();
 }
 paint();
}
function redraw(force=false){
 if(!isArcade()||!root()||root().hidden||!source()){
  stage()?.remove();panel=null;stageKey='';return;
 }
 if(!stage()){
  stageKey='';force=true;
 }
 // Do not rebuild the keyboard/throttle controls on each live telemetry tick.
 const room=currentRoom(),record=page[room]||0;
 const key=[room,record,splash].join(':');
 if(!force&&stageKey===key){
  if(room==='drive')paint();
  if(source()?.querySelector(':scope > .ss-challenge-form'))installChallenge();
  return;
 }
 stage()?.remove();panel=null;stageKey=key;
 build();
}
function update(){
 if(renderQueued)return;renderQueued=true;
 requestAnimationFrame(()=>{renderQueued=false;
  if(lastNative!==roomNow()){
   if(lastNative){sideRoom='';splash=false;}
   lastNative=roomNow();
  }
  if(!isArcade())sideRoom='';
  redraw();
 });
}
function install(){
 if(!source()||!root())return false;
 if(sourceObserver)return true;
 sourceObserver=new MutationObserver(records=>{
  if(records.some(x=>x.target===source())){stageKey='';update();}
 });
 sourceObserver.observe(source(),{childList:true});
 rootObserver=new MutationObserver(update);
 rootObserver.observe(root(),{attributes:true,attributeFilter:['hidden']});
 bodyObserver=new MutationObserver(update);
 bodyObserver.observe(BODY,{attributes:true,attributeFilter:['class','data-arcade-game','data-arcade-scene']});
 // An existing race is more important than a boot screen.
 if(source()?.querySelector('.ss-drive-controls'))splash=false;
 update();return true;
}
let bootLoop=setInterval(()=>{
 if(install()){clearInterval(bootLoop);bootLoop=null;}
},300);
install();
// The source game calculates and saves its own race. We only draw the updated
// telemetry; this interval makes no RPC calls and never changes race state.
tick=setInterval(()=>{
 if(isArcade()&&currentRoom()==='drive'&&stage())paint();
},130);
