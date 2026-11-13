/* Street r0d · Summer 1963 full campaign, original artwork and code.
 * Independent fictional seasonal economy; existing Commons multiplayer assets
 * and credits remain untouched. Server validates all season mutations and races.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {carPhotoUrl} from './streetrod-photo-sprites.mjs?v=photoreal1';
import {drawClassicCockpit} from './streetrod-classic-cockpit.mjs?v=dos1';
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const cap=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const SECTIONS=[['garage','Garage'],['paper','Newspaper'],['parts','Auto Parts'],['diner','Drive-In'],['drive','Drive'],['calendar','Summer Calendar']];
const STEPS={
 engine:['Raise hood and isolate ignition','Loosen carburetor stud A','Loosen carburetor stud B','Lift the carburetor','Release intake bolts and manifold','Disconnect ignition leads','Remove the block retainers','Hoist the engine and seat the replacement','Reconnect wiring and torque the motor','Refit manifold, carburetor and final bolts'],
 tires:['Position jack and safety stands','Remove left-side lug fasteners','Remove right-side lug fasteners','Lift the used wheel and tire set','Fit the new wheels and engage lugs','Torque fasteners, lower car, inspect'],
 gearbox:['Raise vehicle on lift','Remove transmission linkage','Unbolt bellhousing supports','Release tail mount and driveshaft','Lower the old transmission','Position replacement and secure mounts','Reconnect linkage and test all gears']
};
const RV={rookie:{name:'Juniper Jack',car:'Rattler 48',require:0,symbol:'J'},
 cruiser:{name:'Neon Nora',car:'Comet 55',require:1,symbol:'N'},
 hotshot:{name:'Redline Ray',car:'Meteor Special',require:3,symbol:'R'},
 cipher:{name:'Cipher Van X',car:'The Mystery Prototype',require:6,symbol:'X'}};
const yearDay=n=>new Date(Date.UTC(1963,5,24+(Number(n)||1)-1)).toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'});
let hub=null,root=null,button=null,visible=false,screen='garage',season=null,loading=false,busy=false,client=null,connection=null,live=null,lastResult=null;
let buttonsDown=new Set(),frameId=0,sampleTicker=0,keyboardAttached=false;
const gamePhoto=(body,key)=>'<img class="ss-car-photo" loading="lazy" decoding="async" src="'+esc(carPhotoUrl(body||'coupe',key||'rattler'))+'" alt="Original rendered '+esc(key||'vintage')+' car">';
const currentCar=()=>season?.garage?.find(c=>c.car_key===season?.season?.current_car)||null;
const catalogCar=key=>season?.catalog?.find(c=>c.key===key)||null;
const allCar=key=>catalogCar(key)||{key,name:key==='rattler'?'Rattler 48':key,body:'coupe',accent:'#a45634',price:0};
const banner=(title,desc)=>'<header class="ss-scene-head"><div><small>SUMMER 1963 · COWBOY MOTOR WORKS</small><h4>'+esc(title)+'</h4><p>'+esc(desc)+'</p></div></header>';
const action=(command,label,attrs='')=>'<button type="button" data-ss-action="'+esc(command)+'" '+attrs+'>'+esc(label)+'</button>';
function status(text,error=false){const box=root?.querySelector('#ss-status');if(box){box.textContent=String(text);box.classList.toggle('ss-error',error);}}
function makeRoot(){
 if(!document.getElementById('src-classic-hub'))return false;
 hub=document.getElementById('src-classic-hub');
 if(root?.isConnected)return true;
 const nav=hub.querySelector('.src-scene-menu');
 if(!nav)return false;
 button=document.createElement('button');
 button.type='button';button.id='ss-nav-open';button.className='ss-nav-open';button.setAttribute('aria-pressed','false');
 button.innerHTML='<span aria-hidden="true">🏆</span> Summer Championship';
 nav.append(button);
 root=document.createElement('section');root.id='streetrod-summer';
 root.className='ss-summer';root.hidden=true;
 root.innerHTML='<header class="ss-top"><div><small>ORIGINAL SINGLE-PLAYER STORY · NOT REAL-MONEY WAGERING</small><h3>The Summer of 1963</h3><p>Buy it. Build it. Race it. Beat the mysterious king before September 15.</p></div><button type="button" data-ss-action="refresh" class="ss-reload">Refresh garage</button></header><div id="ss-metrics" class="ss-metrics"></div><nav id="ss-tabs" class="ss-tabs" aria-label="Classic summer game locations"></nav><div id="ss-scene" class="ss-scene"></div><p id="ss-status" class="ss-status" aria-live="polite" role="status">Open the championship to load your saved summer.</p>';
 const scene=hub.querySelector('#src-scene');if(scene)scene.after(root);else hub.append(root);
 button.addEventListener('click',()=>{open();});
 hub.addEventListener('click',event=>{
  const other=event.target.closest('.src-scene-menu button[data-src-tab]');
  if(other&&visible){if(live){status('Finish or abandon the current race before leaving the summer track.',true);open();}else close();}
 });
 root.addEventListener('click',onClick);
 root.addEventListener('submit',onSubmit);
 root.addEventListener('pointerdown',event=>{
  const key=event.target.closest('[data-ss-hold]')?.dataset.ssHold;
  if(!key||!live)return;
  event.preventDefault();buttonsDown.add(key);
  event.target.setPointerCapture?.(event.pointerId);
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(name,event=>{
  const key=event.target.closest?.('[data-ss-hold]')?.dataset.ssHold;if(key)buttonsDown.delete(key);
 });
 if(!keyboardAttached){
  keyboardAttached=true;
  window.addEventListener('keydown',keyDown);
  window.addEventListener('keyup',keyUp);
  window.addEventListener('blur',()=>buttonsDown.clear());
 }
 return true;
}
function close(){
 visible=false;root.hidden=true;button.setAttribute('aria-pressed','false');
 const classic=hub.querySelector('#src-scene');if(classic)classic.hidden=false;
 const message=hub.querySelector('#src-message');if(message)message.hidden=false;
 if(live)status('Your season race remains in progress. Return to Drive to finish or abandon.');
}
function open(){
 visible=true;root.hidden=false;button.setAttribute('aria-pressed','true');
 hub.querySelectorAll('.src-scene-menu button[data-src-tab]').forEach(x=>x.setAttribute('aria-pressed','false'));
 const classic=hub.querySelector('#src-scene');if(classic)classic.hidden=true;
 const message=hub.querySelector('#src-message');if(message)message.hidden=true;
 if(!season)void load();else render();
 root.scrollIntoView?.({block:'start'});
}
async function connect(){
 if(client)return client;
 if(connection)return connection;
 connection=(async()=>{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,
   {auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  client.auth.onAuthStateChange(event=>{
   if(event==='SIGNED_OUT'){season=null;lastResult=null;buttonsDown.clear();if(root)status('Sign in to enter the summer garage.',true);}
  });
  return client;
 })();
 try{return await connection;}finally{connection=null;}
}
async function call(fn,args){
 const api=await connect();const {data,error}=await api.rpc(fn,args||{});
 if(error)throw Error(error.message||'The garage could not save.');
 return data;
}
async function load(){
 if(loading||busy)return;
 loading=true;status('Reading your saved summer journal…');
 try{season=await call('community_streetrod_season_state');render();status('Summer garage loaded. All changes save with your Commons account.');}
 catch(error){status(String(error.message||error),true);root.querySelector('#ss-scene').innerHTML='<p class="ss-empty">Could not load the campaign. Sign in to an approved Commons account and use Refresh.</p>';}
 finally{loading=false;}
}
async function mutate(command,args,success){
 if(busy)return;
 busy=true;status('Saving your '+command.replaceAll('_',' ')+'…');
 try{
  const out=await call('community_streetrod_season_action',{p_action:command,p_args:args||{},p_nonce:crypto.randomUUID()});
  season=out.state;lastResult=null;render();status(out.message||success||'Saved.');
 }catch(error){status(error.message||'Save failed.',true);}
 finally{busy=false;}
}
function metrics(){
 const s=season?.season||{},car=currentCar();
 return [['DATE',yearDay(s.day_no||1)],['SUMMER DAYS LEFT',Math.max(0,85-(s.day_no||1))],['WALLET','$'+fmt(s.cash)],
 ['REPUTATION',fmt(s.rep)],['RACE WINS',fmt(s.victories)],['CAR',car?.car_key||'NO CAR']].map(
 ([k,v])=>'<div><small>'+k+'</small><strong>'+esc(v)+'</strong></div>').join('');
}
function nav(){
 return SECTIONS.map(([k,t])=>'<button type="button" data-ss-tab="'+k+'" aria-pressed="'+(screen===k)+'">'+esc(t)+'</button>').join('');
}
function garage(){
 const c=currentCar(),s=season.season,m=allCar(c?.car_key);
 if(!c)return banner('The Garage','Your car is gone. Use the newspaper to buy another.')+action('navigate','Open the Newspaper','data-target="paper"');
 const shade=c.paint||m.accent||'#68777e';
 const service=s.service||{};
 return banner('Your Garage','One car. A toolbox. A summer of road racing.')+
 '<div class="ss-garage-stage"><div class="ss-garage-sign">COWBOY MOTOR WORKS <small>SERVICE · EST. 1963</small></div>'+
 '<div class="ss-wall-rack">🔧 ⚙ 🔩</div><div class="ss-car-position">'+gamePhoto(m.body,m.key)+'</div>'+
 '<div class="ss-garage-overlay"><span>'+esc(m.name||c.car_key)+'</span><span>ENGINE '+c.engine+' · TIRES '+c.tires+' · GEARBOX '+c.gearbox+'</span></div></div>'+
 '<div class="ss-garage-stats"><div>Fuel <b>'+c.fuel+'%</b><progress max="100" value="'+c.fuel+'"></progress></div>'+
 '<div>Condition <b>'+c.condition+'%</b><progress max="100" value="'+c.condition+'"></progress></div>'+
 '<div>Timing <b>'+(c.tune===0?'Neutral':c.tune>0?'Advanced +'+c.tune:'Retarded '+c.tune)+'</b></div>'+
 '<div>Paint <b><span class="ss-paint-swatch" style="background:'+esc(shade)+'"></span></b></div></div>'+
 '<div class="ss-actions">'+action('workshop','Pop hood · Physical mechanic')+
 action('navigate','Browse cars','data-target="paper"')+action('navigate','Visit the parts counter','data-target="parts"')+
 action('navigate','Find rival drivers','data-target="diner"')+'</div>'+
 '<div class="ss-workshop-preview"><h5>Car information</h5><p>Installed: engine level '+c.engine+', grip '+c.tires+', gearbox '+c.gearbox+'. Bumpers: '+(c.bumpers?'fitted':'removed')+'. Roof: '+(c.roof_chopped?'chopped':'factory')+'. Stickers: '+esc(c.decal)+'.</p></div>'+
 '<div class="ss-actions">'+action('refuel','Fill tank ($'+((100-c.fuel)*2)+')',c.fuel===100?'disabled':'')+
 action('repair','Repair damage ($'+Math.ceil((100-c.condition)*4.5)+')',c.condition===100?'disabled':'')+
 action('bumpers','Toggle bumpers')+action('roof','Chop / restore roof')+'</div>'+
 '<form class="ss-inline-form" data-ss-form="paint"><label>Fresh paint job ($110) <input type="color" name="color" value="'+esc(/^#[0-9a-fA-F]{6}$/.test(shade)?shade:'#68777e')+'"></label><button type="submit">Apply paint</button></form>'+
 '<form class="ss-inline-form" data-ss-form="tune"><label>Engine timing <select name="setting">'+
 [-3,-2,-1,0,1,2,3].map(n=>'<option value="'+n+'" '+(c.tune===n?'selected':'')+'>'+(
 n===0?'Neutral':n<0?'Retard '+n:'Advance +'+n)+'</option>').join('')+
 '</select></label><button type="submit">Set timing</button></form>'+
 '<form class="ss-inline-form" data-ss-form="decal"><label>Sticker <select name="decal">'+
 ['none','flames','stripes','stars','lightning'].map(x=>'<option '+(c.decal===x?'selected':'')+'>'+x+'</option>').join('')+
 '</select></label><button type="submit">Apply sticker ($35)</button></form>'+
 (service.kind?'<p class="ss-alert">Unfinished '+esc(service.kind)+' installation. Return to Auto Parts and complete all mounting steps before racing.</p>':'');
}
function paper(){
 const market=season.catalog||[],owned=new Set((season.garage||[]).map(x=>x.car_key));
 const negotiation=season.season.negotiation||{};
 return banner('The Motor Yard Gazette','Inspect cars, negotiate a used-car price, and bring one home.')+
 '<div class="ss-newspaper"><header><small>LOS ANGELES · SUMMER 1963</small><h5>THE MOTOR YARD GAZETTE</h5><span>USED CARS · GOOD DEALS · FRESH TROUBLE</span></header>'+
 '<div class="ss-ads">'+market.map(car=>{
 const isOwned=owned.has(car.key);
 return '<article class="ss-ad"><div class="ss-ad-photo">'+gamePhoto(car.body,car.key)+'</div><div class="ss-ad-main">'+
 '<strong>'+esc(car.name)+'</strong><small>'+esc(car.year)+' · '+esc(car.body)+'</small><p>'+esc(car.tagline||'')+'</p>'+
 '<b>Asking $'+fmt(car.price)+'</b><div class="ss-ad-actions">'+(isOwned?
 action('switch','Drive this car','data-car="'+esc(car.key)+'"')+action('sell_car','Sell (65% of value)','data-car="'+esc(car.key)+'"')
 :action('buy_car','Buy now','data-car="'+esc(car.key)+'"')+
 '<form data-ss-form="offer" data-car="'+esc(car.key)+'"><label>Offer $<input type="number" min="1" max="'+car.price+'" step="1" value="'+Math.floor(car.price*.85)+'" name="offer"></label><button type="submit">Haggle</button></form>')+
 '</div></div></article>';
 }).join('')+'</div></div>'+
 (negotiation.car?'<p class="ss-offer">Seller counteroffer: $'+fmt(negotiation.price)+' for '+esc(negotiation.car)+
 ' (good through campaign day '+negotiation.valid_day+'). Use Buy now to accept.</p>':'')+
 '<p class="ss-hint">All prices and purchases are fictional campaign dollars. The multiplayer garage and credits are separate.</p>';
}
function parts(){
 const service=season.season.service||{},items=season.parts||[];
 const steps=STEPS[service.kind]||[];
 return banner('Auto Parts & Workshop','Parts must be purchased, installed and secured before they improve your car.')+
 '<div class="ss-parts-counter">'+['engine','tires','gearbox'].map(kind=>
 '<article><div class="ss-part-emblem">'+(kind==='engine'?'⚙':kind==='tires'?'◎':'▣')+'</div><strong>'+kind.toUpperCase()+'</strong>'+
 '<p>'+({engine:'Carburetor, induction and engine power package',tires:'New rubber, lug hardware and wheel-grip package',
 gearbox:'Close-ratio transmission and gear-selection assembly'})[kind]+'</p>'+
 '<div>'+action('buy_part','Buy new','data-kind="'+kind+'" data-quality="new"')+
 action('buy_part','Buy used','data-kind="'+kind+'" data-quality="used"')+'</div></article>').join('')+'</div>'+
 '<h5 class="ss-heading">Parts tray · '+items.length+' unused</h5><div class="ss-inventory">'+
 (items.length?items.map(part=>'<div class="ss-inventory-item"><b>'+esc(part.kind)+' · '+part.condition+'% condition</b>'+
 '<span>Part #'+part.id+'</span>'+action('service_begin','Fit this part','data-part-id="'+part.id+'"')+'</div>').join(''):'<p>No spare parts yet. Buy a new or used part at the counter.</p>')+'</div>'+
 (service.kind?'<section class="ss-service"><header><strong>OPEN SERVICE ORDER · '+esc(service.kind.toUpperCase())+'</strong>'+
 '<span>Step '+(service.step+1)+' of '+service.steps+'</span></header>'+
 '<div class="ss-service-art"><div class="ss-service-hood"><span>ENGINE HOOD RAISED</span></div><div class="ss-service-hardware">'+
 '<span class="ss-bolt ss-bolt-1">✣</span><span class="ss-bolt ss-bolt-2">✣</span><span class="ss-motor">ENGINE / '+esc(service.kind.toUpperCase())+'</span>'+
 '<span class="ss-bolt ss-bolt-3">✣</span><span class="ss-bolt ss-bolt-4">✣</span></div></div>'+
 '<ol class="ss-service-steps">'+steps.map((t,i)=>'<li class="'+(i<service.step?'complete':i===service.step?'current':'')+'">'+esc(t)+'</li>').join('')+'</ol>'+
 '<div class="ss-actions">'+action('workshop','Operate saved bolts and parts')+
 action('service_cancel','Cancel, return spare part')+'</div>'+
 '<p class="ss-hint">Each operation saves on the server. The car cannot start while a service order is open.</p></section>':'')+
 '<div class="ss-actions">'+action('workshop','Open detailed bolt-by-bolt workbench')+'</div>';
}
function diner(){
 const s=season.season;
 return banner('The Moonlight Drive-In','Inspect a rival, name your stakes, and race for fictional cash or car titles.')+
 '<div class="ss-diner-hero"><div class="ss-diner-sign"><small>BURGERS · SHAKES · STREET RODS</small><strong>MOONLIGHT<br>DRIVE-IN</strong></div><div class="ss-diner-cars">'+
 gamePhoto('hardtop','comet')+gamePhoto('van','cipherx')+'</div></div>'+
 '<div class="ss-rivals">'+Object.entries(RV).map(([key,r])=>'<article class="ss-rival'+(s.victories<r.require?' locked':'')+'"><div class="ss-rival-face">'+esc(r.symbol)+'</div>'+
 '<div><strong>'+esc(r.name)+'</strong><p>'+esc(r.car)+'</p><small>'+(
 s.victories<r.require?'Unlock at '+r.require+' wins':key==='cipher'&&s.rep<7?'Needs reputation 7':'Available to challenge')+
 '</small></div><div class="ss-rival-buttons">'+action('inspect_rival','Inspect build','data-rival="'+key+'"')+
 action('choose_rival','Call out','data-rival="'+key+'" '+(s.victories<r.require||key==='cipher'&&s.rep<7?'disabled':''))+
 '</div></article>').join('')+'</div>'+
 '<p class="ss-hint">Road races can use fictional pink slips after three victories. This season does not transfer your real-world property or multiplayer garage.</p>';
}
function calendar(){
 const s=season.season,log=season.history||[];
 return banner('The Summer Calendar','Race the clock as well as the competition. When school starts, the season ends.')+
 '<div class="ss-calendar-scene"><div class="ss-calendar-big"><small>1963</small><strong>'+esc(yearDay(s.day_no))+'</strong>'+
 '<span>'+Math.max(0,85-s.day_no)+' days remaining</span></div>'+
 '<div class="ss-calendar-info"><b>Season #'+s.season_no+'</b><p>Victories '+s.victories+' · Losses '+s.defeats+' · Reputation '+s.rep+'</p>'+
 '<p>Status: '+esc(s.status)+'</p><p>'+(
 s.status==='champion'?'You dethroned the Mystery Van and won the Summer Championship.':
 s.status==='time_up'?'School is back. This campaign has ended.':'Beat Cipher Van X before the 84-day deadline.')+'</p>'+
 action('rest','Rest one day',s.status!=='active'?'disabled':'')+
 action('new_season','Begin a new summer campaign','class="ss-danger"')+'</div></div>'+
 '<h5 class="ss-heading">Garage journal</h5><ol class="ss-journal">'+
 (log.length?log.map(e=>'<li><span>DAY '+e.day_no+'</span><strong>'+esc(e.caption)+'</strong><small>'+esc(e.event_type)+'</small></li>').join(''):'<li>Your first summer has just begun.</li>')+
 '</ol><p class="ss-hint">Starting a new season resets only this fictional campaign, not Street r0d Multiplayer, saved Toolbox profiles or other game achievements.</p>';
}
function drive(){
 if(lastResult){
  const r=lastResult;
  return banner(r.win?'Victory at the finish!':'Rival takes the win','Your race result is saved on the game server.')+
   '<div class="ss-race-result"><strong>'+(r.win?'YOU WIN':'YOU LOSE')+'</strong>'+
   '<div><span>Your time: '+Number(r.player_ms/1000).toFixed(3)+' s</span><span>Rival: '+Number(r.opponent_ms/1000).toFixed(3)+' s</span>'+
   '<span>Damage: '+r.damage+'%</span><span>Cash change: '+(r.cash_change>=0?'+':'')+r.cash_change+'</span></div>'+
   (r.champion?'<p>THE SUMMER CHAMPIONSHIP IS YOURS!</p>':'')+'</div>'+
   '<div class="ss-actions">'+action('navigate','Back to the Drive-In','data-target="diner"')+
   action('navigate','Return to Garage','data-target="garage"')+'</div>';
 }
 const old=season?.active_run;
 if(!live&&old){
  return banner('Race still open','A previous race was interrupted. The result is not fabricated.')+
   '<p class="ss-alert">Your race against '+esc(old.rival)+' is still on the server. To protect your wallet, abandon it before starting another.</p>'+
   action('abandon','Abandon interrupted race','class="ss-danger"');
 }
 if(!live){
  return banner('Race Control','Choose a rival at the Drive-In to stage your car.')+
   '<p class="ss-empty">No current race. Return to Moonlight Drive-In and call an opponent.</p>'+
   action('navigate','Back to Drive-In','data-target="diner"');
 }
 return banner('Inside the cockpit',live.run.type==='road'?'2.5-mile winding course. Steer into corners and use your brakes.':
  'Quarter-mile straightaway. Shift cleanly and leave on green.')+
  '<div class="ss-cockpit"><canvas width="960" height="340" id="ss-race-canvas" aria-label="First-person racing with dashboard gauges and a rival car"></canvas>'+
  '<div id="ss-start-lights" class="ss-start-lights">STAGING</div></div>'+
  '<div class="ss-drive-metrics"><div><small>Speed</small><strong id="ss-speed">0 mph</strong></div>'+
  '<div><small>RPM</small><strong id="ss-rpm">900</strong></div>'+
  '<div><small>Gear</small><strong id="ss-gear">1</strong></div>'+
  '<div><small>Distance</small><strong id="ss-distance">0%</strong></div></div>'+
  '<div class="ss-drive-controls"><button type="button" data-ss-hold="left">◀ STEER</button>'+
  '<button type="button" data-ss-hold="right">STEER ▶</button>'+
  '<button type="button" class="ss-gas" data-ss-hold="gas">▲ GAS</button>'+
  '<button type="button" class="ss-brake" data-ss-hold="brake">▼ BRAKE</button>'+
  '<button type="button" data-ss-action="shift">SHIFT UP</button>'+
  '<button type="button" data-ss-action="downshift">SHIFT DOWN</button></div>'+
  '<div class="ss-actions">'+action('abandon','Abandon race','class="ss-danger"')+'</div>'+
  '<p class="ss-hint">Keyboard: arrows steer and accelerate/brake. Space shifts up, Shift down. Hold touch buttons on mobile. Shifts and handling affect the server-verified result.</p>';
}
function render(){
 if(!season||!root)return;
 root.querySelector('#ss-metrics').innerHTML=metrics();
 root.querySelector('#ss-tabs').innerHTML=nav();
 root.querySelector('#ss-scene').innerHTML=({garage,paper,parts,diner,drive,calendar})[screen]();
 const state=season.season;
 if(state.status==='champion'||state.status==='time_up')status(state.status==='champion'?'SUMMER CHAMPION · Cipher Van X defeated.':'Summer ended. Your campaign history is saved.');
 if(live&&screen==='drive')beginFrames();
}
function navigate(next){
 if(live&&next!=='drive'){status('Finish or abandon the active race before leaving the track.',true);return;}
 screen=next;render();
}
function onClick(event){
 const btn=event.target.closest('button');if(!btn||btn.disabled)return;
 if(btn.dataset.ssTab){navigate(btn.dataset.ssTab);return;}
 const cmd=btn.dataset.ssAction;if(!cmd)return;
 const car=btn.dataset.car,rival=btn.dataset.rival;
 if(cmd==='navigate'){navigate(btn.dataset.target);return;}
 if(cmd==='refresh'){void load();return;}
 if(cmd==='workshop'||cmd==='service_advance'){
  status('Opening the saved seasonal car workbench. If the hood does not appear, refresh Street r0d.',true);
  return;
 }
 if(cmd==='inspect_rival'){const r=RV[rival];status(r.name+' drives a '+r.car+'. Tier '+r.require+'. Choose Call Out to negotiate the race.');return;}
 if(cmd==='choose_rival'){chooseRace(rival);return;}
 if(cmd==='shift'||cmd==='downshift'){shift(cmd==='shift'?1:-1);return;}
 if(cmd==='abandon'){void abandon();return;}
 if(cmd==='new_season'){
  if(window.confirm('Begin a NEW summer? This will reset seasonal cars, money and day. Multiplayer cars and achievements remain.'))void mutate('new_season',{},'Summer restarted.');
  return;
 }
 if(cmd==='sell_car'&&!window.confirm('Sell the seasonal car '+car+'? This cannot be undone.'))return;
 if(cmd==='service_cancel'&&!window.confirm('Cancel this incomplete installation? Your purchased part will remain in inventory.'))return;
 const args={};
 if(car)args.car=car;
 if(btn.dataset.kind)args.kind=btn.dataset.kind;
 if(btn.dataset.quality)args.quality=btn.dataset.quality;
 if(btn.dataset.partId)args.part_id=Number(btn.dataset.partId);
 if(btn.dataset.step!==undefined)args.step=Number(btn.dataset.step);
 void mutate(cmd,args);
}
function onSubmit(event){
 const form=event.target.closest('form[data-ss-form]');if(!form)return;
 event.preventDefault();
 const name=form.dataset.ssForm,fd=new FormData(form);
 if(name==='offer')void mutate('negotiate',{car:form.dataset.car,offer:Number(fd.get('offer'))});
 if(name==='paint')void mutate('paint',{color:fd.get('color')});
 if(name==='tune')void mutate('tune',{setting:String(fd.get('setting'))});
 if(name==='decal')void mutate('decal',{decal:fd.get('decal')});
}
function chooseRace(rival){
 if(live){navigate('drive');return;}
 const r=RV[rival];if(!r)return;
 const panel=root.querySelector('#ss-scene');
 const form=document.createElement('form');form.className='ss-challenge-form';
 form.innerHTML='<h5>Call out '+esc(r.name)+'</h5>'+
 '<p>Opponent car: '+esc(r.car)+'. Practice is free. Other stakes use fictional seasonal dollars.</p>'+
 '<label>Course <select name="type"><option value="drag">Quarter-mile drag</option><option value="road">2.5-mile road</option></select></label>'+
 '<label>Stake <select name="stake"><option value="practice">Just for kicks</option><option value="25">$25</option><option value="100">$100</option>'+
 '<option value="title">Pink slips / fictional car title</option></select></label>'+
 '<div class="ss-actions"><button type="submit">Stage at the starting line</button><button type="button" data-ss-action="cancel_challenge">Cancel</button></div>';
 form.addEventListener('submit',event=>{
  event.preventDefault();const fd=new FormData(form);void start(rival,String(fd.get('type')),String(fd.get('stake')));
 });
 const existing=root.querySelector('.ss-challenge-form');existing?.remove();
 panel.append(form);form.scrollIntoView?.({block:'nearest'});
 const cancel=form.querySelector('[data-ss-action="cancel_challenge"]');cancel.addEventListener('click',()=>form.remove());
}
async function start(rival,type,stake){
 if(busy)return;busy=true;status('Calling '+RV[rival].name+' to the starting line…');
 try{
  const run=await call('community_streetrod_season_race_start',{p_rival:rival,p_type:type,p_stake:stake});
  live={run,start:performance.now()+3200,prev:performance.now(),speed:0,gear:1,distance:0,
    trace:[],lastSample:-1000,shifts:[],submitted:false,steer:0};
  buttonsDown.clear();lastResult=null;screen='drive';render();status('Watch the lights. Get ready to accelerate!');
 }catch(error){status(error.message||'Could not stage this race.',true);}
 finally{busy=false;}
}
function keyDown(event){
 if(!live||!visible||screen!=='drive'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const mapping={ArrowUp:'gas',ArrowDown:'brake',ArrowLeft:'left',ArrowRight:'right'};
 if(mapping[event.code]){buttonsDown.add(mapping[event.code]);event.preventDefault();}
 if(event.code==='Space'&&!event.repeat){shift(1);event.preventDefault();}
 if((event.code==='ShiftLeft'||event.code==='ShiftRight')&&!event.repeat){shift(-1);event.preventDefault();}
}
function keyUp(event){const mapping={ArrowUp:'gas',ArrowDown:'brake',ArrowLeft:'left',ArrowRight:'right'};if(mapping[event.code])buttonsDown.delete(mapping[event.code]);}
function shift(delta){
 if(!live||performance.now()<live.start)return;
 live.gear=cap(live.gear+delta,1,4);
 const t=Math.floor(performance.now()-live.start);
 if(delta>0&&t>=500&&t<11000&&live.shifts.length<3){live.shifts.push(t);}
}
function beginFrames(){
 if(frameId)cancelAnimationFrame(frameId);
 const frame=t=>{
  if(!live||!root?.isConnected||screen!=='drive'){frameId=0;return;}
  const r=live,dt=cap((t-r.prev)/1000,0,.06);r.prev=t;
  const elapsed=Math.max(0,t-r.start),target=r.run.type==='road'?13200:1320;
  const gas=buttonsDown.has('gas')?1:0,brake=buttonsDown.has('brake')?1:0;
  const steer=buttonsDown.has('left')?-0.7:buttonsDown.has('right')?0.7:0;
  const moving=elapsed>0&&!r.submitted;
  if(moving){
   const max=150;
   const acceleration=11.7*(1+currentCar()?.engine*.08)*gas-32*brake-3.2-(r.speed*.016);
   r.speed=cap(r.speed+acceleration*dt,0,max);
   const offroad=r.run.type==='road'&&Math.abs(steer-Math.sin((Math.floor(elapsed/1000)+(r.run.seed%17))*0.46)*.78)>1.1;
   if(offroad)r.speed=Math.max(0,r.speed-8*dt);
   r.distance+=r.speed*1.46667*dt;
   if(elapsed-r.lastSample>=1000&&r.trace.length<240){
    r.lastSample=elapsed;
    r.trace.push({t:Math.floor(elapsed),steer,gas,brake,gear:r.gear});
   }
   if(r.distance>=target &&elapsed>=(r.run.type==='road'?47000:13000)&&r.trace.length>=(r.run.type==='road'?30:8)){
    r.submitted=true;void finish(); 
   }
  }
  const canvas=root?.querySelector('#ss-race-canvas');
  if(canvas){
   const ctx=canvas.getContext('2d');if(ctx){
    const progress=cap(r.distance/target,0,1);
    const rpm=cap(900+r.speed*160/Math.max(1,r.gear)+gas*750,900,8000);
    drawClassicCockpit(ctx,{width:canvas.width,height:canvas.height,progress,live:moving,
      seed:r.run.seed,own:allCar(r.run.car),rival:{key:r.run.rival==='cipher'?'cipherx':'meteor',body:r.run.rival==='cipher'?'van':'muscle'},
      boss:r.run.rival==='cipher',clock:elapsed,speed:r.speed,rpm,steer});
    const set=(id,txt)=>{const e=root.querySelector(id);if(e)e.textContent=txt};
    set('#ss-speed',Math.round(r.speed)+' mph');set('#ss-rpm',Math.round(rpm));
    set('#ss-gear',r.gear);set('#ss-distance',Math.round(progress*100)+'%');
    const lights=root.querySelector('#ss-start-lights');
    if(lights)lights.textContent=elapsed<=0?String(Math.ceil(-elapsed/1000)):'GREEN · GO';
   }
  }
  frameId=requestAnimationFrame(frame);
 };
 frameId=requestAnimationFrame(frame);
}
async function finish(){
 const r=live;if(!r)return;
 status('Crossing the finish line. Validating your controls and result…');
 // The server requires three increasing shift values. Automatic fallback makes
 // beginners roadworthy; proper manual shifting improves player technique.
 const shifts=r.shifts.length===3&&r.shifts[0]>=500&&r.shifts[2]<=11500&&
   r.shifts[1]>r.shifts[0]&&r.shifts[2]>r.shifts[1]?r.shifts:[3100,5500,9200];
 try{
  const data=await call('community_streetrod_season_race_finish',{
    p_run:r.run.id,p_launch_ms:300,p_shifts:shifts,p_trace:r.trace
  });
  season=data.state;lastResult=data;live=null;buttonsDown.clear();render();
  status(data.message+'. The bank, wear and championship record were updated once.');
 }catch(error){
  r.submitted=false;status('Finish not saved: '+String(error.message||'Try again.').slice(0,200),true);
 }
}
async function abandon(){
 const id=live?.run?.id||season?.active_run?.id;
 if(!id)return;
 if(!window.confirm('Abandon this race? A day passes but no wager is collected.'))return;
 try{
  const data=await call('community_streetrod_season_race_abandon',{p_run:id});
  season=data.state;live=null;lastResult=null;buttonsDown.clear();screen='diner';render();status(data.message);
 }catch(error){status(error.message,true);}
}
if(cfg?.enabled&&location.pathname.endsWith('community.html')){
 const observer=new MutationObserver(()=>{if(makeRoot())observer.disconnect()});
 observer.observe(document.body,{subtree:true,childList:true});makeRoot();
}
