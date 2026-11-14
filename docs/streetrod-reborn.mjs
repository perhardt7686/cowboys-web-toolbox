import {cue,soundEnabled,toggleSound} from './streetrod-pc-speaker.mjs?v=audio1';
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
const VIEW_LABELS={garage:'THE GARAGE',paper:'CLASSIFIED ADS',parts:'AUTO PARTS',diner:'BOB’S DRIVE-IN',drive:'ON THE ROAD',calendar:'SUMMER 1963',tune:'IGNITION TIMING',gas:'FUEL STOP',paperfront:'THE DAILY PAPER',carshow:'LOOK AT CAR',hoodmenu:'UNDER THE HOOD',carinfo:'CAR INFORMATION',rivalview:'CHECK THE RIVAL',crew:'COMMONS DRIVERS',underbody:'UNDER THE CAR',licence:'DRIVER LICENCE',inventory:'PARTS TRAY',service:'SERVICE ORDER',paint:'PAINT & DECALS',hall:'HALL OF FAME'};
const NAV={
 garage:[['NEWSPAPER','paperfront'],['POP HOOD','hood'],['CAR INFO','carinfo'],['DRIVE-IN','diner'],['GAS','gas'],['CALENDAR','calendar']],
 paper:[['COVER','paperfront'],['PREVIOUS','prev'],['NEXT','next'],['LOOK AT CAR','viewcar'],['AUTO PARTS','parts'],['GARAGE','garage']],
 parts:[['GARAGE','garage'],['PREVIOUS','prev'],['NEXT','next'],['PARTS TRAY','inventory'],['SERVICE ORDER','service'],['LIFT CAR','underbody']],
 diner:[['GARAGE','garage'],['PREVIOUS','prev'],['NEXT','next'],['INSPECT','inspectrival'],['OUR DRIVERS','crew']],
 drive:[['GARAGE','garage'],['DRIVE-IN','diner']],
 calendar:[['GARAGE','garage'],['CLASSIFIEDS','paper'],['HALL OF FAME','hall']],
 tune:[['HOOD','hood'],['GARAGE','garage'],['PAINT & DECALS','paint']],
 paint:[['GARAGE','garage'],['IGNITION TUNE','tune'],['POP HOOD','hood']],
 gas:[['FILL TANK','fill'],['GARAGE','garage'],['DINER','diner']],
 crew:[['DINER','diner'],['PREVIOUS','prev'],['NEXT','next'],['GARAGE','garage']],
 inventory:[['PARTS SHOP','parts'],['PREVIOUS','prev'],['NEXT','next'],['POP HOOD','hood'],['GARAGE','garage']],
 service:[['PARTS SHOP','parts'],['POP HOOD','hood'],['GARAGE','garage']],
 hall:[['CALENDAR','calendar'],['PREVIOUS','prev'],['NEXT','next'],['GARAGE','garage']],
 licence:[['ENTER GARAGE','garage'],['CREW','crew']],
 underbody:[['WRENCH','wrench'],['GARAGE','garage']],
 paperfront:[['USED CARS','paper'],['AUTO PARTS','parts'],['GARAGE','garage']],
 carshow:[['CLASSIFIEDS','paper'],['GARAGE','garage'],['AUTO PARTS','parts']],
 hoodmenu:[['REAL BOLTS','wrench'],['TUNE','tune'],['PARTS TRAY','inventory'],['DONE','garage']],
 carinfo:[['GARAGE','garage'],['POP HOOD','hood'],['SPARE PARTS','inventory']],
 rivalview:[['DRIVE-IN','diner'],['GARAGE','garage']]
};
const HOTSPOTS={
 garage:[
  ['Check newspaper','paper',3,75,17,18],['Pop the hood','hood',28,56,47,29],
  ['Tune engine','tune',43,22,16,21],['Check calendar','calendar',89,20,10,27],
  ['Hit the street','diner',77,78,21,14],['Radio and engine parts','parts',64,21,22,27],['Read car clipboard','carinfo',61,45,13,14]
 ],
 paper:[['Previous classified','prev',1,34,12,35],['Next classified','next',87,34,12,35]],
 diner:[['Challenge this driver','challenge',33,58,51,26],['Return to garage','garage',70,86,29,12]],
 parts:[['Work under hood','hood',56,24,38,30]],
 calendar:[['Return to garage','garage',77,80,20,17]],
 paperfront:[['Browse used cars','paper',4,22,43,65],['Browse auto parts','parts',53,22,43,65]],
 hoodmenu:[['Open real bolt workbench','wrench',23,32,50,47]]
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
let splash=true,sideRoom='',page={paper:0,parts:0,diner:0,crew:0,inventory:0,hall:0},lastNative='',lastRoom='',travelToken=0,travelTimer=null,travelSkip=null;
let tick=0,renderQueued=false,stageKey='',liveBridge=false;
let lastRoadWarning='';
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
  kind==='parts'?'.ss-parts-counter > article':
  kind==='inventory'?'.ss-inventory > .ss-inventory-item':
  kind==='hall'?'.ss-journal > li':null;
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
  if(r==='crew'){
   const count=$('srm-players')?.querySelectorAll('.srm-player').length||1;
   page.crew=(page.crew+(target==='next'?1:-1)+count)%count;
   redraw(true);return;
  }
  if(!records.length)return;
  page[r]=(page[r]+(target==='next'?1:-1)+records.length)%records.length;
  redraw(true);return;
 }
 if(target==='hood'){
  sideRoom='hoodmenu';splash=false;redraw(true);return;
 }
 if(target==='wrench'){splash=false;showWorkbench();return;}
 if(target==='viewcar'){
  if(!visibleRecord()){showStatus('Open a used-car listing first.');return;}
  sideRoom='carshow';splash=false;redraw(true);return;
 }
 if(target==='inspectrival'){
  if(!visibleRecord()){showStatus('Choose a rival at the drive-in first.');return;}
  sideRoom='rivalview';splash=false;redraw(true);return;
 }
 if(target==='challenge'){
  const card=visibleRecord();
  card?.querySelector('[data-ss-action="choose_rival"]:not(:disabled)')?.click();
  return;
 }
 if(target==='fill'){
  const pump=originalControl('refuel');
  if(!pump||pump.disabled){showStatus('Select an eligible car before requesting fuel.');return;}
  // An explicit FILL TANK tap is the only way to request a fuel purchase.
  // The authenticated game handler owns confirmation of the saved result.
  pump.click();showStatus('Fuel requested. Check your saved tank and bank balance for confirmation.');
  return;
 }
 if(target==='gas'){
  // Looking at the filling station must never spend campaign cash.
  sideRoom='gas';splash=false;redraw(true);
  return;
 }
 if(['licence','crew','underbody','inventory','service','paint','hall','paperfront','carinfo'].includes(target)){
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
  const finishTravel=()=>{if(current!==travelToken)return;
   clearTimeout(travelTimer);travelTimer=null;travelSkip=null;
   stage()?.classList.remove('sr-v3-travel');go();
  };
  travelSkip=finishTravel;
  travelTimer=setTimeout(finishTravel,matchMedia?.('(prefers-reduced-motion:reduce)')?.matches?50:420);
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
 // The DOS room uses original 16-colour pixels, not modern photos.
 if(['paper','carshow'].includes(currentRoom())){
  const photo=cp.querySelector('img.ss-car-photo');
  if(photo){
   const model=cp.querySelector('[data-car]')?.dataset.car||'rattler';
   const type=cp.querySelector('.ss-ad-main small')?.textContent||'coupe';
   const canvas=document.createElement('canvas');
   canvas.width=320;canvas.height=200;canvas.className='sr-v3-inline-preview';
   canvas.dataset.carKey=model;
   canvas.dataset.body=/wagon|estate/i.test(type)?'wagon':/truck|pickup/i.test(type)?'truck':
    /van|bus/i.test(type)?'van':/muscle|fastback/i.test(type)?'muscle':
    /hardtop|sedan/i.test(type)?'hardtop':'coupe';
   canvas.setAttribute('aria-label','Independent pixel-art inspection of '+model);
   photo.replaceWith(canvas);
  }
 }
 cp.classList.add('sr-v3-record','arcade-current-card');
 return cp.outerHTML;
}
function sourcePanel(room){
 const src=source();
 if(!src)return '<p class="sr-v3-empty">Loading your original seasonal garage…</p>';
 if(room==='paperfront'){
  return '<div class="sr-v3-classifieds-cover"><small>LOS ANGELES · SUMMER 1963</small>'+
   '<strong>THE MOTOR YARD GAZETTE</strong><p>CLASSIFIEDS · ALL THE HOT DEALS</p>'+
   '<div><button type="button" data-v3-action="paper">USED MOTOR CARS</button>'+
   '<button type="button" data-v3-action="parts">AUTO PARTS</button></div>'+
   '<small>LOOK IT OVER · MAKE AN OFFER · DRIVE IT HOME</small></div>';
 }
 if(room==='carshow'){
  const advert=nativeRecords('paper')[page.paper||0];
  if(!advert)return '<p class="sr-v3-empty">Return to the paper and select a car.</p>';
  return '<div class="sr-v3-view-car"><strong>LOOK AT THE CAR BEFORE BUYING</strong>'+
   cardHTML(advert)+'</div>';
 }
 if(room==='hoodmenu'){
  return '<div class="sr-v3-shop-menu"><strong>UNDER THE HOOD · ENGINE / CARB / MANIFOLD</strong>'+
   '<p>Select PARTS to operate real saved bolts. The original-compatible workbench requires the right disassembly order and tightened parts.</p>'+
   '<div><button type="button" data-v3-action="wrench">PARTS / TURN BOLTS</button>'+
   '<button type="button" data-v3-action="tune">TUNE ENGINE</button>'+
   '<button type="button" data-v3-action="inventory">SPARE PARTS</button>'+
   '<button type="button" data-v3-action="garage">DONE / LOWER HOOD</button></div></div>';
 }
 if(room==='carinfo'){
  const stats=src.querySelector('.ss-garage-stats');
  const details=src.querySelector('.ss-workshop-preview');
  return '<div class="sr-v3-carinfo"><strong>SHOP CLIPBOARD · CAR INFORMATION</strong>'+
   '<p>Installed equipment, engine tune, paint, fuel and wear.</p>'+
   (stats?stats.outerHTML:'<p>No car in the garage. Open the newspaper.</p>')+
   (details?details.outerHTML:'')+
   '<button type="button" data-v3-action="hood">POP THE HOOD</button></div>';
 }
 if(room==='rivalview'){
  const rival=nativeRecords('diner')[page.diner||0];
  if(!rival)return '<p class="sr-v3-empty">No driver has arrived.</p>';
  return '<div class="sr-v3-rival-inspection"><strong>CHECK THE COMPETITION</strong>'+
   '<p>'+safe(rival.querySelector('strong')?.textContent||'Rival driver')+'</p>'+
   '<p>'+safe(rival.querySelector('p')?.textContent||'')+'</p>'+
   '<p>Opponent details are from the saved roster. Detailed engine specs for rivals are not yet server-backed.</p>'+
   cardHTML(rival)+'</div>';
 }
 if(room==='paper'||room==='parts'||room==='diner'){
  const records=nativeRecords(room),index=page[room]||0;
  if(!records.length)return '<div class="sr-v3-empty">No '+safe(room)+' entries available yet.</div>';
  return '<div class="sr-v3-record-count"><span>'+safe(room.toUpperCase())+' '+(index+1)+' / '+records.length+'</span>'+
   '<span>‹ SWIPE OR USE ARROWS ›</span></div>'+
   cardHTML(visibleRecord())+
   (room==='parts'?'<p class="sr-v3-tip">Buy a part, then return to your real workbench to install it.</p>':'');
 }
 if(room==='inventory'||room==='hall'){
  const list=nativeRecords(room),i=page[room]||0;
  if(!list.length)return '<div class="sr-v3-empty">'+(room==='inventory'?
    'Parts tray empty. Buy an engine, tyre, or gearbox part at the shop.':
    'No saved race journal entries yet.')+'</div>';
  return '<div class="sr-v3-record-count">'+safe(room.toUpperCase())+' '+(i+1)+' / '+list.length+'</div>'+
   cardHTML(visibleRecord());
 }
 if(room==='service'){
  const el=src.querySelector('.ss-service');
  if(!el)return '<div class="sr-v3-empty">No open service job. Buy and select a spare part first.</div>';
  const copy=el.cloneNode(true);copy.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  copy.classList.add('sr-v3-record','arcade-current-card');
  return copy.outerHTML;
 }
 if(room==='paint'){
  const paint=src.querySelector('form[data-ss-form="paint"]');
  const decal=src.querySelector('form[data-ss-form="decal"]');
  const box=document.createElement('div');box.className='sr-v3-paint';
  const heading=document.createElement('strong');heading.textContent='BODY SHOP · SAVED TO YOUR CAR';box.append(heading);
  if(paint)box.append(paint.cloneNode(true));
  if(decal)box.append(decal.cloneNode(true));
  if(!paint&&!decal)box.append('Return to the garage before customizing this car.');
  return box.outerHTML;
 }
 if(room==='licence'){
  // Prefer the current signed-in member. Never show another player's
  // profile as if it belonged to the current driver.
  const racer=$('srm-players')?.querySelector('.srm-player:has(.srm-you)');
  const name=racer?.querySelector('.srm-person h4')?.textContent?.trim()||'CURRENT DRIVER';
  const avatar=racer?.querySelector('.srm-avatar')?.outerHTML||'<span class="sr-v3-default-avatar">★</span>';
  const m=metrics();
  return '<div class="sr-v3-licence"><small>CALIFORNIA · SUMMER 1963</small>'+
   '<strong>STREET R0D DRIVER LICENCE</strong>'+
   '<div class="sr-v3-driver">'+avatar+'<span>'+safe(name)+'</span></div>'+
   '<p>CAR: '+safe(m.car||'NO CAR YET')+'</p><p>WINS: '+safe(m['race wins']||0)+
   ' · REPUTATION: '+safe(m.reputation||0)+'</p>'+
   '<button type="button" data-v3-action="continue">ENTER THE GARAGE ▶</button></div>';
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
   (calendar?.querySelector('[data-ss-action="new_season"]')?.outerHTML||'')+
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
   const mode=src.querySelector('[data-ss-action="transmission"]')?.outerHTML||'';
   return '<div class="sr-v3-telemetry" aria-live="off">GEAR / SPEED / RPM</div>'+c.outerHTML+
    '<div class="sr-v3-drive-mode">'+mode+'</div>'+
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
 }
}
function intro(){
 return '<div class="sr-v3-intro"><small>1989 COMPUTER PRESENTATION · COWBOY EDITION</small>'+
  '<h2>STREET R0D</h2><p>THE SUMMER OF 1963</p>'+
  '<p>Find an old car in the newspaper, rebuild it, and beat the Mystery Machine before school starts.</p>'+
  '<button type="button" data-v3-action="continue">CONTINUE SAVED SUMMER ▶</button>'+
  '<button type="button" data-v3-action="paperfront">READ THE NEWSPAPER</button>'+
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
 let target=room==='licence'||room==='crew'||room==='paint'||room==='carinfo'?'garage':
  room==='underbody'?'gearbox':room==='gas'?'gas':
  room==='tune'||room==='hoodmenu'||room==='rivalview'?'engine':
  room==='inventory'||room==='service'?'parts':room==='hall'?'calendar':
  room==='paperfront'?'paper':room==='carshow'?'carinspect':room;
 if(room==='drive'){
  const result=source()?.querySelector('.ss-race-result');
  if(result?.dataset.champion==='true')target='championship';
  else if(result?.dataset.incident==='police')target='jail';
  else if(result?.dataset.incident==='breakdown')target='breakdown';
 }
 const listing=room==='carshow'?nativeRecords('paper')[page.paper||0]:null;
 const shownCar=listing?.querySelector('[data-car]')?.dataset.car||car.name;
 const type=listing?.querySelector('.ss-ad-main small')?.textContent||'';
 const shownBody=room==='carshow'?
  /wagon|estate/i.test(type)?'wagon':/truck|pickup/i.test(type)?'truck':
  /van|bus/i.test(type)?'van':/muscle|fastback/i.test(type)?'muscle':
  /hardtop|sedan/i.test(type)?'hardtop':'coupe':car.body;
 const options={carKey:shownCar,body:shownBody,
  bankroll:Number(String(m.wallet||'').replace(/[^\d]/g,''))||0,
  label:shownCar,subtitle:label(room).slice(0,31)};
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
 for(const preview of stage()?.querySelectorAll('canvas.sr-v3-inline-preview')||[]){
  window.COWBOY_STREETROD_PAINT?.(preview,'carinspect',{carKey:preview.dataset.carKey||'rattler',
   body:preview.dataset.body||'coupe'});
 }
 if(room==='drive'){
  const el=stage()?.querySelector('.sr-v3-telemetry');
  if(el)el.textContent=Math.round(options.speed)+' MPH · '+Math.round(options.rpm)+' RPM · GEAR '+options.gear;
  const warn=source()?.querySelector('#ss-warning')?.textContent;
  if(warn){
   showStatus(warn);
   if(warn!==lastRoadWarning){
    if(warn.includes('PATROL'))cue('warning');
    else if(warn.includes('MISFIRE'))cue('engine');
    lastRoadWarning=warn;
   }
  }
 }
}
function build(){
 const host=source();if(!host)return;
 const el=document.createElement('section');el.id='sr-reborn';el.className='sr-v3';
 el.setAttribute('aria-label','Classic Street r0d single-screen game');
 el.innerHTML='<header class="sr-v3-head"><strong>STREET R0D · '+safe(label(currentRoom()))+'</strong>'+
  '<button type="button" class="sr-v3-sound" data-v3-action="sound" aria-label="Toggle original PC-speaker style effects">'+(soundEnabled()?'SOUND ON':'SOUND OFF')+'</button>'+
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
   if(next==='sound'){
    const on=toggleSound();target.textContent=on?'SOUND ON':'SOUND OFF';
    target.setAttribute('aria-pressed',String(on));
    return;
   }
   cue(next==='hood'?'wrench':next==='diner'?'race':next==='continue'?'start':'menu');
   if(next==='continue'){splash=false;choose(gameCar().name==='NO CAR'?'paperfront':'garage');return;}
   choose(next);
  }
 },true);
 el.addEventListener('click',event=>{
  const b=event.target.closest('[data-ss-action]');
  if(!b)return;
  const name=b.dataset.ssAction||'';
  cue(['shift','downshift'].includes(name)?'gear':
   name==='choose_rival'?'race':
   ['buy_car','buy_part'].includes(name)?'buy':
   ['service_begin','service_advance','workshop'].includes(name)?'wrench':
   name==='transmission'?'click':'menu');
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
 // A tap on the scene skips town travel without double navigation.
 el.querySelector('.sr-v3-art')?.addEventListener('click',event=>{
  if(!el.classList.contains('sr-v3-travel')||!travelSkip)return;
  event.preventDefault();event.stopImmediatePropagation();travelSkip();
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
 // Swipe only on noninteractive portions of paginated game records.
 // Forms, buttons and vertical scrolling must keep their normal behavior.
 let swipeStart=null;
 pocket.addEventListener('touchstart',event=>{
  if(!['paper','parts','diner','crew','inventory','hall'].includes(currentRoom())||
     event.touches.length!==1||event.target.closest?.('button,a,input,select,textarea,form'))return;
  swipeStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
 },{passive:true});
 pocket.addEventListener('touchend',event=>{
  if(!swipeStart)return;
  const from=swipeStart;swipeStart=null;
  const touch=event.changedTouches?.[0];if(!touch)return;
  const dx=touch.clientX-from.x,dy=touch.clientY-from.y;
  if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;
  if(event.cancelable)event.preventDefault();
  choose(dx<0?'next':'prev');
 },{passive:false});
 pocket.addEventListener('touchcancel',()=>{swipeStart=null;});
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
  const external=records.some(m=>m.target===source()&&
   [...m.addedNodes,...m.removedNodes].some(n=>{
    if(n.nodeType!==1)return true;
    return n.id!=='sr-reborn'&&!n.classList?.contains('ss-challenge-form');
   }));
  if(external){stageKey='';update();}
  else if(records.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.classList?.contains('ss-challenge-form')))){
   requestAnimationFrame(installChallenge);
  }
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
