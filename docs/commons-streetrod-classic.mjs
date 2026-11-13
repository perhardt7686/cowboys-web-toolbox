/* Street r0d: Summer '63 Classic Scene Navigator.
 * Original artwork and interface inspired by historic garage/newspaper/diner scenes.
 * Backend racing, credit balances, profiles and upgrades remain unchanged.
 */
import {carPhotoUrl} from './streetrod-photo-sprites.mjs?v=photoreal1';
import {drawClassicCockpit} from './streetrod-classic-cockpit.mjs?v=dos1';
import {openWorkshop} from './commons-streetrod-mechanics.mjs?v=mech2';
import {mountRoadPractice} from './commons-streetrod-road-practice.mjs?v=ega2';
const S=id=>document.getElementById(id);
const H=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PHOTO={garage:'coupe',cars:'hardtop',parts:'muscle',diner:'muscle',road:'coupe'};
let hub=null,active='garage',named='',carKey='rattler',observer=null,paperPage=0,dinerPage=0;
const items=[['garage','The Garage','🔧'],['cars','Classifieds','📰'],['parts','Auto Parts','⚙'],['diner','The Drive-In','☕'],['road','Hit the Street','🏁']];
const typeFor=(name)=>/van|parcel|cipher|bus/i.test(name)?'van':/truck|mammoth|irons|gravel/i.test(name)?'truck':/wagon|nomad|mariner/i.test(name)?'wagon':/comet|hardtop|saturn/i.test(name)?'hardtop':/meteor|phantom|muscle|raven|scorpion/i.test(name)?'muscle':'coupe';
function menu(){return '<nav class="src-scene-menu" aria-label="Classic racing scenes">'+items.map(([k,name,ico])=>'<button type="button" data-src-tab="'+k+'" aria-pressed="'+(k===active)+'"><span aria-hidden="true">'+ico+'</span>'+name+'</button>').join('')+'</nav>';}
function intro(){return '<header class="src-top"><div><span class="src-super">COWBOY MOTOR WORKS · SUMMER 1963</span><h3>Street r0d <em>Classic</em></h3><p>One old garage. A newspaper full of possibilities. A diner full of rivals.</p></div><div class="src-top-metrics"><span>YOUR BANKROLL</span><strong id="src-bankroll">—</strong><small>Fictional garage credits</small></div></header>';}
function carImage(body,key,cls=''){return '<img class="src-car-photo '+cls+'" src="'+H(carPhotoUrl(body,key))+'" alt="" decoding="async" loading="lazy">';}
function garageScene(){return '<section class="src-garage-stage" aria-label="Interactive vintage mechanic garage"><div class="src-garage-wall"><span class="src-sign">COWBOY MOTOR WORKS</span><div class="src-wall-objects" aria-hidden="true"><span>🔧</span><span>⚙</span><span>🔩</span></div><span class="src-garage-clock" aria-hidden="true">◷</span><span class="src-garage-bench" aria-hidden="true"></span><span class="src-wall-calendar" aria-hidden="true">JUL 1963</span></div><div class="src-stage-car">'+carImage(typeFor(named),carKey,'src-hero-car')+'</div><div class="src-concrete-floor"></div><span class="src-ground-shadow"></span><span class="src-vehicle-label" id="src-current-ride">'+H(named||'Your ride')+'</span><div class="src-garage-hotspots"><button type="button" class="src-hot-hood" data-src-action="hood">POP HOOD · ENGINE</button><button type="button" class="src-hot-inspect" data-src-action="inspect">CAR INFO / CLIPBOARD</button><button type="button" class="src-hot-wheel" data-src-action="tires">JACK & WHEELS</button><button type="button" class="src-hot-trans" data-src-action="gearbox">UNDERBODY / GEARBOX</button><button type="button" class="src-hot-paper" data-src-action="cars">NEWSPAPER CLASSIFIEDS</button><button type="button" class="src-hot-diner" data-src-action="diner">DRIVE TO THE DINER</button></div></section><div class="src-scene-actions"><button type="button" data-src-action="hood">🔧 Pop hood and work on engine</button><button type="button" data-src-action="tires">Change wheels</button><button type="button" data-src-action="gearbox">Change transmission</button><button type="button" data-src-action="inspect">Check car info</button></div><p class="src-scene-note">Click the car hood or any labeled garage object. Each bolt, wire and installed part has its own saved state. Unfinished cars cannot race.</p>';}
function readListings(){const cards=[...document.querySelectorAll('#sr-garage-cars .sr-car-card')];const showroom=new Map([...document.querySelectorAll('#scc-grid [data-scc-car]')].map(node=>[node.querySelector('strong')?.textContent?.trim(),node.dataset.sccCar]));return cards.map((card,i)=>({name:card.querySelector('strong')?.textContent?.trim()||'Untitled',type:card.querySelector('small')?.textContent?.trim()||'Vintage',spec:card.querySelector('.sr-car-spec')?.textContent?.trim()||'',key:card.querySelector('[data-item^="car:"]')?.dataset.item?.replace(/^car:/,'')||card.querySelector('[data-car]')?.dataset.car||showroom.get(card.querySelector('strong')?.textContent?.trim())||'',price:card.querySelector('[data-sr-action="buy"]')?.textContent?.trim()||'Already owned',owned:!card.querySelector('[data-sr-action="buy"]'),index:i}));}
function classifiedScene(){const listings=readListings();return '<section class="src-paper"><header class="src-paper-masthead"><span>THE MOTOR YARD GAZETTE</span><strong>Cars & Classifieds</strong><small>LOS ANGELES · SUMMER 1963 · WEEKEND EDITION</small></header><div class="src-paper-columns"><div class="src-paper-main"><h4>USED MOTOR CARS</h4><p>Find your next project. Inspect it before buying, then bring it into your garage.</p><div class="src-listings">'+(listings.length?listings.map(v=>'<article class="src-listing"><span class="src-ad-number">#'+String(v.index+1).padStart(2,'0')+'</span><div><strong>'+H(v.name)+'</strong><small>'+H(v.type)+' · '+H(v.spec)+'</small></div><span class="src-ad-price">'+H(v.price)+'</span><button type="button" data-src-inspect="'+H(v.key)+'" data-src-name="'+H(v.name)+'" '+(!v.key?'disabled':'')+'>Inspect</button></article>').join(''):'<div class="src-paper-pending">Opening the verified vehicle market…</div>')+'</div></div><aside class="src-paper-side"><h4>SHOP NOTICES</h4><p><b>WRENCH BEFORE RACE.</b> Check your engine, tires and gearbox before heading to the drive-in.</p><p><b>FIRST GARAGE RULE.</b> Only cars you own can be selected for racing.</p><button type="button" data-src-action="shop">Browse all 60 body designs</button></aside></div><footer>Published by Cowboy Motor Works · Fictional classified ads · Prices and availability from the real garage</footer></section>';}
function partsScene(){const entries=[{key:'engine',name:'Engine & induction',description:'Remove carburetor and intake before lifting the engine block.'},{key:'tires',name:'Wheels & tires',description:'Jack up the car, loosen lugs and replace the wheels.'},{key:'gearbox',name:'Transmission',description:'Disconnect shift linkage, unbolt the housing and remove the gearbox.'}];return '<section class="src-parts-scene"><header><span>THE PARTS COUNTER</span><h4>Real Wrench Work · New & Used Parts</h4><p>Select the package, then use the actual workbench. Real upgrades are charged only after you remove and refit the part correctly.</p></header><div class="src-parts-illustration"><span aria-hidden="true">⚙</span><span class="src-parts-label">ENGINE · CARBURETOR · MANIFOLD · TRANSMISSION · TIRES</span></div><div class="src-parts-rows">'+entries.map(p=>'<button type="button" data-src-upgrade="'+p.key+'"><b>'+H(p.name)+'</b><small>'+H(p.description)+'</small><span>Open work order →</span></button>').join('')+'</div><p class="src-parts-disclaimer">Authorized race credits and all selected car upgrades are saved by the server. No upgrades are granted without completion.</p></section>';}
function dinerScene(){
 const racers=[...document.querySelectorAll('#srm-players .srm-player')].map(card=>{
  const id=card.dataset.racer||'';
  return {id,name:card.querySelector('.srm-person h4')?.textContent?.trim()||'Unnamed racer',
   build:card.querySelector('.srm-person p')?.textContent?.trim()||'Garage not inspected',
   status:card.querySelector('.srm-ontrack')?'CURRENTLY RACING':'IN THE RACER CLUB',
   badge:card.querySelector('.srm-details summary')?.textContent?.trim()||'Inspect build',
   photo:card.querySelector('.srm-avatar img')?.getAttribute('src')||''};
 }).filter(x=>/^[a-f0-9-]{36}$/i.test(x.id));
 const pages=Math.max(1,Math.ceil(racers.length/3));dinerPage=Math.min(dinerPage,pages-1);
 const rows=racers.slice(dinerPage*3,(dinerPage+1)*3).map(r=>
   '<article class="src-diner-racer"><div class="src-diner-driver-photo">'+(r.photo?'<img src="'+H(r.photo)+'" alt="" loading="lazy">':'<span>🏁</span>')+'</div><div><strong>'+H(r.name)+'</strong><small>'+H(r.build)+'</small><span>'+H(r.status)+'</span></div><div class="src-diner-racer-actions"><button type="button" data-src-rival-inspect="'+H(r.id)+'">Inspect build</button><button type="button" class="src-diner-challenge" data-src-rival="'+H(r.id)+'">Challenge</button></div></article>').join('');
 return '<section class="src-diner-scene"><div class="src-diner-neon"><small>OPEN EVERY NIGHT</small><strong>THE MOONLIGHT<br>DRIVE-IN</strong><span>BURGERS · SHAKES · FAST CARS</span></div><div class="src-diner-window"><span>☕</span><span>★</span><span>☕</span></div><div class="src-drive-cars">'+carImage('muscle','meteor','src-drive-photo')+carImage('van','cipherx','src-drive-photo src-drive-rival')+'</div><div class="src-diner-parking"></div></section><section class="src-diner-patrons"><header><div><span>MOONLIGHT DRIVE-IN · PARKING ROW</span><h4>Who is here tonight?</h4><p>Real approved drivers, their active cars and saved builds. Call somebody out, inspect their garage, or head to the start line.</p></div><button type="button" data-src-action="club">Refresh / Racer Club</button></header><div class="src-diner-racers">'+(rows||'<p class="src-diner-none">No verified opponents are currently listed. The Racer Club can load approved members.</p>')+'</div><div class="src-diner-pagination"><button type="button" data-src-driver-page="-1" '+(dinerPage===0?'disabled':'')+'>Previous drivers</button><span>'+(racers.length?((dinerPage*3+1)+'–'+Math.min(racers.length,(dinerPage+1)*3)+' of '+racers.length):'No drivers')+'</span><button type="button" data-src-driver-page="1" '+(dinerPage>=pages-1?'disabled':'')+'>Next drivers</button></div><div id="src-rival-review" class="src-rival-review" hidden></div></section><div class="src-scene-actions src-drive-actions"><button type="button" data-src-action="solo">Quarter-mile drag race</button><button type="button" data-src-action="club">Challenge a real member</button><button type="button" data-src-action="boss">Race the final rival</button></div><p class="src-scene-note">Head-to-head member races use server-scored, asynchronous challenges. The original game also had road races and pink-slip transfers; those separate systems are not implemented yet.</p>';
}
function roadScene(){return '<div class="src-road-screen"><canvas id="src-road-preview" width="960" height="340" role="img" aria-label="Night-road driver view with an analog dashboard"></canvas><div class="src-road-caption">LOOK THROUGH THE WINDSHIELD. WATCH THE LIGHTS. NAIL YOUR SHIFT.</div></div><div class="src-scene-actions"><button type="button" data-src-action="solo">Stage a solo race</button><button type="button" data-src-action="racing">Show the real race controls</button><button type="button" data-src-action="diner">Back to the drive-in</button></div>';
}
function render(){if(!hub)return;
 const mechanicPanel=hub.querySelector('.src-integrated-workbench');
 if(mechanicPanel&&active!=='garage')mechanicPanel.hidden=true;
 hub.querySelector('#src-bankroll').textContent=document.getElementById('sr-credits')?.textContent||'—';
 const nav=hub.querySelector('.src-scene-menu');nav.querySelectorAll('button[data-src-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.srcTab===active)));
 const stage=hub.querySelector('#src-scene');
 stage.innerHTML=({garage:garageScene,cars:classifiedScene,parts:partsScene,diner:dinerScene,road:roadScene})[active]();
 if(active==='cars'){
  const ads=[...stage.querySelectorAll('.src-listing')];
  const pages=Math.max(1,Math.ceil(ads.length/7));paperPage=Math.min(paperPage,pages-1);
  ads.forEach((ad,i)=>{ad.hidden=i<paperPage*7||i>=(paperPage+1)*7});
  const pagesNav=document.createElement('nav');pagesNav.className='src-paper-pages';pagesNav.setAttribute('aria-label','Classified newspaper pages');
  for(const [step,label] of [[-1,'← Previous'],[0,'Page '+(paperPage+1)+' of '+pages],[1,'Next →']]){
   const button=document.createElement(step===0?'span':'button');button.textContent=label;
   if(step!==0){button.type='button';button.dataset.srcPage=String(step);button.disabled=step<0?paperPage===0:paperPage>=pages-1;}
   pagesNav.append(button);
  }
  stage.querySelector('.src-paper-main')?.append(pagesNav);
 }
 if(active==='road'){
  const cv=hub.querySelector('#src-road-preview');
  if(cv)mountRoadPractice(cv);
 }
}
function reveal(target,click=false){
 if(!target)return false;
 for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
 if(click&&target instanceof HTMLElement){target.click();}
 target.scrollIntoView?.({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 return true;
}
function showIntegratedWorkshop(tab='hood',upgrade=null){
 active='garage';
 render();
 const message=hub?.querySelector('#src-message');
 if(message)message.textContent='Opening the hood and your saved mechanical work order…';
 void openWorkshop(tab,upgrade).then(opened=>{
  const pane=S('streetrod-mechanical-bay');
  if(!opened||!pane||pane.hidden){
   if(message)message.textContent='Could not open the workbench. Check your Commons sign-in and select a car.';
   return;
  }
  const scene=hub?.querySelector('#src-scene');
  if(!scene)return;
  scene.after(pane);
  pane.classList.add('src-integrated-workbench');
  hub.querySelector('.src-garage-stage')?.classList.add('src-hood-open');
  if(message)message.textContent='Hood raised. Work on real saved engine, carburetor, manifold, wheels and gearbox. Loosen the fasteners before removing parts.';
  pane.scrollIntoView?.({behavior:'smooth',block:'start'});
 }).catch(error=>{
  if(message)message.textContent='Mechanical bay error: '+String(error?.message||'Please try again').slice(0,140);
 });
}
function doAction(action){
 const known={garage:'#srw-garage',parts:'#srw-garage',shop:'#scc-motor-vault',club:'#srm-club',racing:'#sr-track'};
 if(action==='cars'||action==='diner'||action==='road'){active=action;render();return;}
 if(action==='shop'){const node=S('scc-motor-vault');reveal(node);return;}
 if(['garage','parts','hood','tires','gearbox','inspect'].includes(action)){
  const tab=action==='tires'?'tires':action==='gearbox'?'gearbox':action==='inspect'?'inspect':'hood';
  showIntegratedWorkshop(tab);
  return;
 }
 if(action==='club'){const c=document.querySelector('#srm-club');if(c)reveal(c);else reveal(S('sr-start-duel'));return;}
 if(action==='solo'||action==='boss'){const button=S(action==='solo'?'sr-start-solo':'sr-start-boss');if(button&&!button.hidden&&!button.disabled){reveal(button);button.click();}else{reveal(S('sr-track'));hub.querySelector('#src-message').textContent='Finish the current race before staging another.';}return;}
 if(action==='racing')reveal(S('sr-track'));
}
function inspectCar(key,name){const market=S('scc-motor-vault');if(!market){hub.querySelector('#src-message').textContent='Vehicle market not ready. Reopen racing and try again.';return;}
 reveal(market);
 const search=S('scc-search');if(search){search.value=name;search.dispatchEvent(new Event('input',{bubbles:true}));}
 const found=[...market.querySelectorAll('button[data-scc-car]')].find(n=>n.dataset.sccCar===key);
 if(found)found.click();else{if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}hub.querySelector('#src-message').textContent='This model is in the Motor Vault; browse by its name to inspect.';}
}
function challengeRival(id){
 const card=[...document.querySelectorAll('#srm-players .srm-player')].find(n=>n.dataset.racer===id);
 const call=card?.querySelector('button[data-sr-action="challenge-target"]');
 if(!call||call.disabled){hub.querySelector('#src-message').textContent='That member is not available for a new challenge. Refresh the Racer Club.';return;}
 call.click();
 hub.querySelector('#src-message').textContent='Direct challenge staged. Watch the lights and drive your best run.';
}
function inspectRival(id){
 const card=[...document.querySelectorAll('#srm-players .srm-player')].find(n=>n.dataset.racer===id);
 const out=hub.querySelector('#src-rival-review');if(!out||!card)return;
 const name=card.querySelector('.srm-person h4')?.textContent||'Rival driver';
 const builds=[...card.querySelectorAll('.srm-build')].map(e=>({
   name:e.querySelector('strong')?.textContent?.trim()||'Car',
   tune:e.querySelector('small')?.textContent?.trim()||'No tune reported',
   selected:e.classList.contains('selected')
 }));
 const activeBuild=builds.find(x=>x.selected)||builds[0];
 out.hidden=false;
 out.innerHTML='<h4>Under the hood: '+H(name)+'</h4><p>'+H(activeBuild?.name||'No published vehicle')+'</p><div class="src-rival-spec"><span>Published build</span><b>'+H(activeBuild?.tune||'No garage data yet')+'</b></div><small>These are verified public racing levels, not private mechanical records.</small>';
 out.scrollIntoView?.({block:'nearest'});
}

function attach(){
 const inside=S('sr-inside');if(!inside){hub=null;return;}
 if(S('src-classic-hub'))return;
 hub=document.createElement('section');hub.id='src-classic-hub';hub.className='src-classic-hub';hub.setAttribute('aria-label','Original Street r0d classic garage gameplay navigator');
 named=S('sr-car-name')?.textContent||'Rattler 48';
 hub.innerHTML=intro()+menu()+'<div id="src-scene" class="src-scene"></div><p id="src-message" class="src-message" role="status" aria-live="polite"></p>';
 const garage=S('srw-garage'),market=S('scc-motor-vault'),race=inside.querySelector('.sr-race-card');
 if(garage)garage.before(hub);else if(market)market.before(hub);else if(race)race.before(hub);else inside.prepend(hub);
 hub.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.mwAction==='close'){hub.querySelector('.src-garage-stage')?.classList.remove('src-hood-open');return;}
  if(b.dataset.srcTab){active=b.dataset.srcTab;render();}
  else if(b.dataset.srcAction){doAction(b.dataset.srcAction);}
  else if(b.dataset.srcInspect)inspectCar(b.dataset.srcInspect,b.dataset.srcName||'');
  else if(b.dataset.srcPage){paperPage=Math.max(0,paperPage+Number(b.dataset.srcPage));render();}
  else if(b.dataset.srcDriverPage){dinerPage=Math.max(0,dinerPage+Number(b.dataset.srcDriverPage));render();}
  else if(b.dataset.srcRival){challengeRival(b.dataset.srcRival);}
  else if(b.dataset.srcRivalInspect){inspectRival(b.dataset.srcRivalInspect);}
  else if(b.dataset.srcUpgrade){const kind=b.dataset.srcUpgrade;showIntegratedWorkshop(kind==='tires'?'tires':kind==='gearbox'?'gearbox':'hood',kind);}
 });
 const credits=S('sr-credits'),name=S('sr-car-name'),owned=S('sr-garage-cars'),parts=S('sr-parts');
 if(credits)new MutationObserver(()=>{const cash=hub?.querySelector('#src-bankroll');if(cash)cash.textContent=credits.textContent;}).observe(credits,{childList:true});
 if(name)new MutationObserver(()=>{if(!hub)return;named=name.textContent||named;if(active==='garage')render();}).observe(name,{childList:true});
 for(const node of [owned,parts])if(node)new MutationObserver(()=>{if(hub&&((node===owned&&active==='cars')||(node===parts&&active==='parts')))render();}).observe(node,{childList:true});
 render();
}
if(location.pathname.endsWith('community.html')&&window.COWBOY_COMMUNITY_CONFIG?.enabled){
 const obs=new MutationObserver(()=>attach());obs.observe(document.body,{subtree:true,childList:true});attach();
}