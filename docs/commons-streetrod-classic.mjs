/* Street r0d: Summer '63 Classic Scene Navigator.
 * Original artwork and interface inspired by historic garage/newspaper/diner scenes.
 * Backend racing, credit balances, profiles and upgrades remain unchanged.
 */
import {carPhotoUrl} from './streetrod-photo-sprites.mjs?v=photoreal1';
import {drawClassicCockpit} from './streetrod-classic-cockpit.mjs?v=classic1';
const S=id=>document.getElementById(id);
const H=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PHOTO={garage:'coupe',cars:'hardtop',parts:'muscle',diner:'muscle',road:'coupe'};
let hub=null,active='garage',named='',carKey='rattler',observer=null,paperPage=0;
const items=[['garage','The Garage','🔧'],['cars','Classifieds','📰'],['parts','Auto Parts','⚙'],['diner','The Drive-In','☕'],['road','Hit the Street','🏁']];
const typeFor=(name)=>/van|parcel|cipher|bus/i.test(name)?'van':/truck|mammoth|irons|gravel/i.test(name)?'truck':/wagon|nomad|mariner/i.test(name)?'wagon':/comet|hardtop|saturn/i.test(name)?'hardtop':/meteor|phantom|muscle|raven|scorpion/i.test(name)?'muscle':'coupe';
function menu(){return '<nav class="src-scene-menu" aria-label="Classic racing scenes">'+items.map(([k,name,ico])=>'<button type="button" data-src-tab="'+k+'" aria-pressed="'+(k===active)+'"><span aria-hidden="true">'+ico+'</span>'+name+'</button>').join('')+'</nav>';}
function intro(){return '<header class="src-top"><div><span class="src-super">COWBOY MOTOR WORKS · SUMMER 1963</span><h3>Street r0d <em>Classic</em></h3><p>One old garage. A newspaper full of possibilities. A diner full of rivals.</p></div><div class="src-top-metrics"><span>YOUR BANKROLL</span><strong id="src-bankroll">—</strong><small>Fictional garage credits</small></div></header>';}
function carImage(body,key,cls=''){return '<img class="src-car-photo '+cls+'" src="'+H(carPhotoUrl(body,key))+'" alt="" decoding="async" loading="lazy">';}
function garageScene(){return '<section class="src-garage-stage" aria-label="Illustrated vintage workshop scene"><div class="src-garage-wall"><span class="src-sign">COWBOY MOTOR WORKS</span><div class="src-wall-objects" aria-hidden="true"><span>🔧</span><span>⚙</span><span>🔩</span></div><span class="src-garage-clock" aria-hidden="true">◷</span><span class="src-garage-bench" aria-hidden="true"></span><span class="src-wall-calendar" aria-hidden="true">JUL<br>1963</span></div><div class="src-stage-car">'+carImage(typeFor(named),carKey,'src-hero-car')+'</div><div class="src-concrete-floor"></div><span class="src-ground-shadow"></span><span class="src-vehicle-label" id="src-current-ride">'+H(named||'Your ride')+'</span></section><div class="src-scene-actions"><button type="button" data-src-action="garage">Bring car into the workshop</button><button type="button" data-src-action="parts">Open the hood / parts</button><button type="button" data-src-action="cars">Read the classifieds</button></div><p class="src-scene-note">Click the newspaper, wrench or diner above to move through the classic garage-to-race loop. Workshop service and saves use your existing account.</p>';}
function readListings(){const cards=[...document.querySelectorAll('#sr-garage-cars .sr-car-card')];const showroom=new Map([...document.querySelectorAll('#scc-grid [data-scc-car]')].map(node=>[node.querySelector('strong')?.textContent?.trim(),node.dataset.sccCar]));return cards.map((card,i)=>({name:card.querySelector('strong')?.textContent?.trim()||'Untitled',type:card.querySelector('small')?.textContent?.trim()||'Vintage',spec:card.querySelector('.sr-car-spec')?.textContent?.trim()||'',key:card.querySelector('[data-item^="car:"]')?.dataset.item?.replace(/^car:/,'')||card.querySelector('[data-car]')?.dataset.car||showroom.get(card.querySelector('strong')?.textContent?.trim())||'',price:card.querySelector('[data-sr-action="buy"]')?.textContent?.trim()||'Already owned',owned:!card.querySelector('[data-sr-action="buy"]'),index:i}));}
function classifiedScene(){const listings=readListings();return '<section class="src-paper"><header class="src-paper-masthead"><span>THE MOTOR YARD GAZETTE</span><strong>Cars & Classifieds</strong><small>LOS ANGELES · SUMMER 1963 · WEEKEND EDITION</small></header><div class="src-paper-columns"><div class="src-paper-main"><h4>USED MOTOR CARS</h4><p>Find your next project. Inspect it before buying, then bring it into your garage.</p><div class="src-listings">'+(listings.length?listings.map(v=>'<article class="src-listing"><span class="src-ad-number">#'+String(v.index+1).padStart(2,'0')+'</span><div><strong>'+H(v.name)+'</strong><small>'+H(v.type)+' · '+H(v.spec)+'</small></div><span class="src-ad-price">'+H(v.price)+'</span><button type="button" data-src-inspect="'+H(v.key)+'" data-src-name="'+H(v.name)+'" '+(!v.key?'disabled':'')+'>Inspect</button></article>').join(''):'<div class="src-paper-pending">Opening the verified vehicle market…</div>')+'</div></div><aside class="src-paper-side"><h4>SHOP NOTICES</h4><p><b>WRENCH BEFORE RACE.</b> Check your engine, tires and gearbox before heading to the drive-in.</p><p><b>FIRST GARAGE RULE.</b> Only cars you own can be selected for racing.</p><button type="button" data-src-action="shop">Browse all 60 body designs</button></aside></div><footer>Published by Cowboy Motor Works · Fictional classified ads · Prices and availability from the real garage</footer></section>';}
function partsScene(){const parts=[...document.querySelectorAll('#sr-parts .sr-part')].map((el,i)=>({name:el.querySelector('strong')?.textContent||'Upgrade',detail:el.querySelector('small')?.textContent||'',level:i}));return '<section class="src-parts-scene"><header><span>THE PARTS COUNTER</span><h4>Performance Parts & Service</h4><p>Pick a part, move into the workshop, inspect the job, then confirm installation. No credits are spent by merely opening a service panel.</p></header><div class="src-parts-illustration"><span aria-hidden="true">⚙</span><span class="src-parts-label">ENGINE · TIRES · TRANSMISSION</span></div><div class="src-parts-rows">'+(parts.length?parts.map((p,i)=>'<button type="button" data-src-service="'+['hood','wheel','underbody'][i]+'"><b>'+H(p.name)+'</b><small>'+H(p.detail)+'</small><span>Inspect in garage →</span></button>').join(''):'<p>Start your garage to load current upgrades.</p>')+'</div><p class="src-parts-disclaimer">Current working systems: engine package, tire set, gearbox and racing tune. Compatible upgrades are saved by the server.</p></section>';}
function dinerScene(){return '<section class="src-diner-scene"><div class="src-diner-neon"><small>OPEN EVERY NIGHT</small><strong>THE MOONLIGHT<br>DRIVE-IN</strong><span>BURGERS · SHAKES · FAST CARS</span></div><div class="src-diner-window"><span>☕</span><span>★</span><span>☕</span></div><div class="src-drive-cars">'+carImage('muscle','meteor','src-drive-photo')+carImage('van','cipherx','src-drive-photo src-drive-rival')+'</div><div class="src-diner-parking"></div></section><div class="src-scene-actions src-drive-actions"><button type="button" data-src-action="solo">Race for a personal best</button><button type="button" data-src-action="club">Challenge another member</button><button type="button" data-src-action="boss">Take on Cipher Van X</button></div><p class="src-scene-note">Other approved Commons members appear in the Racer Club with their actual driver avatars, cars and achievements. Challenges are asynchronous, not real-time steering.</p>';}
function roadScene(){return '<div class="src-road-screen"><canvas id="src-road-preview" width="960" height="340" role="img" aria-label="Night-road driver view with an analog dashboard"></canvas><div class="src-road-caption">LOOK THROUGH THE WINDSHIELD. WATCH THE LIGHTS. NAIL YOUR SHIFT.</div></div><div class="src-scene-actions"><button type="button" data-src-action="solo">Stage a solo race</button><button type="button" data-src-action="racing">Show the real race controls</button><button type="button" data-src-action="diner">Back to the drive-in</button></div>';
}
function render(){if(!hub)return;
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
  const cv=hub.querySelector('#src-road-preview');if(cv){const ctx=cv.getContext('2d');if(ctx)drawClassicCockpit(ctx,{width:cv.width,height:cv.height,own:{accent:'#5a6d7e'},rival:{body:'muscle',key:'meteor'},seed:7});}
 }
}
function reveal(target,click=false){
 if(!target)return false;
 for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
 if(click&&target instanceof HTMLElement){target.click();}
 target.scrollIntoView?.({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 return true;
}
function doAction(action){
 const known={garage:'#srw-garage',parts:'#srw-garage',shop:'#scc-motor-vault',club:'#srm-club',racing:'#sr-track'};
 if(action==='cars'||action==='diner'||action==='road'){active=action;render();return;}
 if(action==='shop'){const node=S('scc-motor-vault');reveal(node);return;}
 if(action==='garage'||action==='parts'){
  const node=S('srw-garage');if(!reveal(node))return;
  if(action==='garage')S('srw-enter')?.click();else S('srw-hood')?.click();return;
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
  if(b.dataset.srcTab){active=b.dataset.srcTab;render();}
  else if(b.dataset.srcAction){doAction(b.dataset.srcAction);}
  else if(b.dataset.srcInspect)inspectCar(b.dataset.srcInspect,b.dataset.srcName||'');
  else if(b.dataset.srcPage){paperPage=Math.max(0,paperPage+Number(b.dataset.srcPage));render();}
  else if(b.dataset.srcService){reveal(S('srw-garage'));S('srw-enter')?.click(); const button=S('srw-garage')?.querySelector('[data-srw="'+b.dataset.srcService+'"]');if(button&&!button.hidden)button.click();}
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