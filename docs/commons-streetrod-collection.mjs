/* Street r0d: Motor Vault v1. Original fictional composite vehicle concepts.
 * Existing five racing cars remain server-authoritative. Preview entries do not buy,
 * race, grant credits, or create assets. Driver portraits mirror published profiles.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';

const raw=[
'Classic|rattler|Rattler 48|1948|coupe|175|#a45634|A stripped, low-nose postwar coupe',
'Classic|comet|Comet 55|1955|hardtop|225|#1e8792|Two-tone boulevard hardtop',
'Classic|nomad|Nomad 63|1963|wagon|305|#536b60|Long-roof sleeper with touring roots',
'Classic|dustline32|Dustline 32|1932|roadster|140|#b58b56|Open cockpit and exposed fenders',
'Classic|duchess41|Duchess 41|1941|sedan|156|#626780|Art-deco touring sedan',
'Classic|wren49|Wren 49|1949|coupe|186|#aa794e|Fastback with a long steel hood',
'Classic|saturn58|Saturn 58|1958|hardtop|252|#8d5477|Finned cruiser with a broad stance',
'Classic|brookline60|Brookline 60|1960|sedan|220|#5e8091|Understated four-door sleeper',
'Classic|copperhead64|Copperhead 64|1964|roadster|270|#b26a32|Small open-top grand tourer',
'Classic|mariner66|Mariner 66|1966|wagon|265|#698a7a|Family wagon with a hidden V8',
'Muscle|meteor|Meteor 67|1967|muscle|425|#9d2c37|Square-shouldered heavyweight',
'Muscle|phantom|Phantom X|1971|fastback|575|#272c37|Pro-street flagship, currently raceable',
'Muscle|blackridge69|Blackridge 69|1969|fastback|455|#383b4f|Long-hood night-run special',
'Muscle|ridgeback70|Ridgeback 70|1970|muscle|470|#bd653a|Short-deck street bruiser',
'Muscle|furnace71|Furnace 71|1971|muscle|490|#822f27|High-torque boulevard machine',
'Muscle|runaway72|Runaway 72|1972|coupe|385|#61784b|Lightweight narrow-roof coupe',
'Muscle|oxide73|Oxide 73|1973|hardtop|405|#ad7a44|Wide-track steel street machine',
'Muscle|throttle76|Throttleback 76|1976|fastback|355|#a5a25a|Long-tail endurance conversion',
'Muscle|quartermark79|Quartermark 79|1979|coupe|340|#487c89|Compact late-era drag build',
'Muscle|striker87|Striker 87|1987|fastback|390|#6b7e9b|Boxy aero muscle hatch',
'Modern|vector96|Vector V8 96|1996|coupe|410|#6c6d72|Balanced rear-drive street coupe',
'Modern|axiom02|Axiom S 02|2002|sedan|350|#799e9c|Executive sleeper on track tires',
'Modern|nighthawk08|Nighthawk GT 08|2008|fastback|505|#393e56|Wide-shouldered grand tourer',
'Modern|echo12|Echo Turbo 12|2012|coupe|315|#b75657|Compact boost-tuned chassis',
'Modern|voltline16|Voltline R 16|2016|ev|465|#518aa4|Electric four-door performance concept',
'Modern|apex19|Apex GT 19|2019|fastback|550|#db8856|Modern front-mid-engine silhouette',
'Modern|brimstone22|Brimstone 22|2022|muscle|640|#793641|Supercharged street bruiser',
'Modern|bladeev24|Blade EV 24|2024|ev|710|#6a879c|Electric aero fastback',
'Modern|helixm25|Helix M 25|2025|sedan|525|#507a6d|High-output road sedan',
'Modern|cindersix26|Cinder Six 26|2026|coupe|605|#a05638|Twin-boost track coupe',
'Utility|oldirons49|Old Irons 49|1949|truck|165|#8b7051|Flatbed shop truck',
'Utility|gravelking57|Gravel King 57|1957|truck|240|#778966|Long-bed hauling classic',
'Utility|trailhammer72|Trailhammer 72|1972|truck|325|#7f5f48|Square-body workhorse',
'Utility|brawny85|Brawny 85|1985|van|270|#7d8c89|Box-body touring van',
'Utility|steepline92|Steepline 92|1992|truck|295|#5d7181|Heavy-duty pickup sleeper',
'Utility|nightparcel03|Night Parcel 03|2003|van|315|#625d86|Delivery van tuned for the strip',
'Utility|mammoth14|Mammoth 14|2014|truck|490|#636f54|Big-power utility drag build',
'Utility|boltutility23|Bolt Utility 23|2023|truck|610|#68809c|Electric high-torque pickup',
'Utility|galevan25|Gale Van 25|2025|van|520|#a37e59|Modern aero expedition van',
'Utility|cipherx|Cipher Van X|2026|van|1120|#473061|The mysterious final rival: a one-off super-van',
'Exotic|raven65|Raven Formula 65|1965|formula|340|#687d81|Minimal vintage track special',
'Exotic|glacier78|Glacier LM 78|1978|supercar|440|#b4a69a|Low-nose endurance wedge',
'Exotic|eclipse88|Eclipse 88|1988|supercar|475|#67455f|Cab-forward turbo exotic',
'Exotic|miragelm99|Mirage LM 99|1999|supercar|585|#a9816f|Wide-body road-legal prototype',
'Exotic|daggerx05|Dagger X 05|2005|supercar|615|#696e7c|Central-engine track machine',
'Exotic|nebulak11|Nebula K 11|2011|supercar|675|#677f9a|Carbon-tub V10 concept',
'Exotic|aurorav1218|Aurora V12 18|2018|supercar|735|#90745b|Grand-tourer hypercar hybrid',
'Exotic|scorpionx21|Scorpion X 21|2021|supercar|800|#9c514e|Active-aero competition concept',
'Exotic|carboncrow24|Carbon Crow 24|2024|supercar|890|#4a4c50|Lightweight track-only special',
'Exotic|ghostrunner26|Ghost Runner 26|2026|supercar|950|#b1b3af|Electric-assisted land rocket',
'Junior|dragonwagon|Dragon Wagon|Play|mini|0|#aa6546|Whimsical fire-breathing toy wagon',
'Junior|rocketpea|Rocket Pea|Play|rocket|0|#7c9b6c|Bright little rocket racer',
'Junior|dinodash|Dino Dash|Play|buggy|0|#78a36b|Dinosaur-themed trail buggy',
'Junior|starhopper|Star Hopper|Play|mini|0|#7c7fc2|Space-age hop-about',
'Junior|bubblebus|Bubble Bus|Play|van|0|#d18cae|Friendly round-window minibus',
'Junior|moonmower|Moon Mower|Play|buggy|0|#859bbc|Tiny lunar-style rover',
'Junior|puddlepatrol|Puddle Patrol|Play|truck|0|#76a0a2|Rain-rescue mini truck',
'Junior|jellybuggy|Jellybean Buggy|Play|buggy|0|#d6a26e|Candy-colored dune cruiser',
'Junior|turtleturbo|Turtle Turbo|Play|mini|0|#5a9b7c|Slow-looking quick little shell car',
'Junior|cloudcruiser|Cloud Cruiser|Play|rocket|0|#87a7d0|Friendly cloud-shaped racer'
];
const LIVE=new Set(['rattler','comet','nomad','meteor','phantom']);
const catalog=raw.map((row,index)=>{const [group,key,name,year,body,hp,paint,tagline]=row.split('|');return {group,key,name,year,body,hp:Number(hp),paint,tagline,index,live:LIVE.has(key),boss:key==='cipherx',junior:group==='Junior'};});
const groups=['All','Classic','Muscle','Modern','Utility','Exotic','Junior'];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const initial=v=>String(v||'Driver').trim().split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase();
const ICONS={compass:'◈',spark:'✳',leaf:'❧',hammer:'⚒',bolt:'ϟ',mountain:'△',coffee:'☕',fox:'🦊',planet:'◉',rocket:'🚀',paw:'🐾'};
let root,modal,filter='All',query='',order='family',profiles=[],self=null,photoLinks=new Map(),client=null,authId=null,ready=false;
const shade=hex=>hex;
const bodies={
 coupe:['M42 113 L59 94 L130 87 L166 50 L255 50 L301 87 L389 96 L419 111 L420 128 L40 128Z','M161 87 L187 57 L249 57 L280 87Z'],
 hardtop:['M35 111 L57 88 L124 83 L155 53 L287 53 L324 84 L399 93 L421 112 L421 129 L33 129Z','M151 84 L173 59 L276 59 L303 84Z'],
 sedan:['M32 109 L54 89 L119 82 L151 48 L276 48 L316 81 L405 93 L424 111 L424 130 L32 130Z','M146 83 L168 54 L273 54 L301 83Z'],
 wagon:['M35 111 L56 89 L105 83 L132 44 L337 44 L357 84 L404 97 L425 116 L425 131 L35 131Z','M129 83 L149 50 L329 50 L348 83Z'],
 roadster:['M37 112 L70 95 L178 86 L203 67 L250 67 L276 89 L400 97 L423 112 L423 128 L34 128Z','M201 87 L213 70 L243 70 L260 87Z'],
 muscle:['M31 111 L56 89 L130 84 L174 54 L265 54 L310 87 L400 96 L424 110 L424 131 L30 131Z','M166 85 L188 61 L262 61 L294 85Z'],
 fastback:['M35 112 L51 93 L127 85 L176 49 L255 49 L341 93 L402 96 L426 112 L426 130 L33 130Z','M165 87 L189 55 L251 55 L322 87Z'],
 ev:['M31 111 L61 95 L130 89 L170 61 L283 61 L325 89 L397 96 L426 110 L426 130 L30 130Z','M168 90 L185 67 L277 67 L310 90Z'],
 truck:['M28 112 L49 85 L133 83 L148 51 L244 51 L267 86 L420 86 L430 115 L430 130 L29 130Z','M148 83 L163 57 L233 57 L251 83Z'],
 van:['M35 119 L42 68 Q42 40 75 37 L347 37 Q384 37 396 69 L420 109 L422 131 L33 131Z','M81 47 L346 47 Q365 47 376 69 L385 83 L73 83 L73 59Z'],
 supercar:['M30 118 L72 102 L154 96 L207 71 L284 72 L337 99 L414 108 L428 122 L428 132 L29 132Z','M204 95 L220 78 L278 78 L313 96Z'],
 formula:['M28 126 L37 103 L118 106 L155 91 L244 89 L300 111 L421 108 L428 128 L26 129Z','M161 99 L178 84 L233 84 L252 101Z'],
 buggy:['M48 113 L79 91 L138 94 L171 73 L253 73 L295 99 L384 98 L405 116 L407 130 L44 130Z','M172 96 L190 80 L251 80 L275 96Z'],
 mini:['M57 108 L72 88 L157 83 L170 60 L274 60 L293 84 L374 97 L396 112 L399 132 L55 132Z','M167 83 L180 66 L265 66 L280 84Z'],
 rocket:['M38 120 L73 112 L154 89 L184 73 L290 73 L344 103 L415 116 L420 133 L37 133Z','M185 91 L200 78 L280 78 L315 98Z']
};
function carArt(car,large=false){
 const bp=bodies[car.body]||bodies.coupe,grad='scc-g-'+car.key;
 const rear=car.body==='van'?112:car.body==='truck'?117:car.body==='supercar'?115:car.body==='mini'?118:108;
 const front=car.body==='van'?350:car.body==='truck'?351:car.body==='supercar'?356:car.body==='mini'?346:351;
 const r=car.junior?19:22, tire=(x)=>'<circle cx="'+x+'" cy="128" r="'+(r+5)+'" fill="#12171b"/><circle cx="'+x+'" cy="128" r="'+r+'" fill="#080b12" stroke="#626d76" stroke-width="2"/><circle cx="'+x+'" cy="128" r="11" fill="#b1b6b7"/><circle cx="'+x+'" cy="128" r="6" fill="#3c454c"/><circle cx="'+x+'" cy="128" r="2" fill="#f5e8d0"/>';
 const decal=car.boss?'<path d="M155 112 L184 90 L207 112 L231 90 L254 112 L278 90" fill="none" stroke="#f3bd6d" stroke-width="5"/><circle cx="310" cy="102" r="12" fill="none" stroke="#d3aa7b" stroke-width="3"/>':car.junior?'<circle cx="208" cy="112" r="8" fill="#ffe9a4"/><path d="M200 112h16m-8-8v16" stroke="#d88d9f" stroke-width="3"/>':'<path d="M68 112 L404 109" fill="none" stroke="#fff3d0" stroke-opacity=".44" stroke-width="3"/>';
 return '<svg viewBox="0 0 460 174" aria-hidden="true" focusable="false" class="scc-car-svg"><defs><linearGradient id="'+grad+'" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="#e7e2d6"/><stop offset=".17" stop-color="'+car.paint+'"/><stop offset=".77" stop-color="'+car.paint+'"/><stop offset="1" stop-color="#1c2228"/></linearGradient><linearGradient id="'+grad+'w" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8eb2c0"/><stop offset="1" stop-color="#172833"/></linearGradient></defs><ellipse cx="226" cy="146" rx="192" ry="13" fill="#050a1299"/><path d="'+bp[0]+'" fill="url(#'+grad+')" stroke="#151a23" stroke-width="4" stroke-linejoin="round"/><path d="'+bp[1]+'" fill="url(#'+grad+'w)" stroke="#ced5d0" stroke-width="3"/><path d="M48 117 L408 117" stroke="#121b20" stroke-width="2" opacity=".75"/>'+decal+tire(rear)+tire(front)+'<path d="M400 102h18" stroke="#fff2c4" stroke-width="7" stroke-linecap="round"/><path d="M36 104h11" stroke="#e27368" stroke-width="6"/><path d="M48 132h-20m396-1h17" stroke="#c1bab0" stroke-width="6" stroke-linecap="round"/><path d="M195 90h24" stroke="#e8e4ce" stroke-width="4" stroke-linecap="round"/><path d="M60 94 L374 94" stroke="#fff" opacity=".22" stroke-width="3"/></svg>';
}
function avatar(p){
 const image=photoLinks.get(p?.avatar_path||'');
 const face=p?.avatar_mode==='photo'&&image?'<img src="'+esc(image)+'" alt="" referrerpolicy="no-referrer">':p?.avatar_mode==='icon'?esc(ICONS[p.avatar_icon]||'◈'):esc(initial(p?.display_name));
 return '<span class="scc-character" aria-hidden="true"><span class="scc-head">'+face+'</span><span class="scc-suit"></span></span>';
}
function driverCard(p,isSelf){
 return '<article class="scc-driver">'+avatar(p)+'<div><b>'+esc(p?.display_name||'Driver')+'</b><small>'+(isSelf?'YOUR DRIVER':(p?.published?'COMMONS DRIVER':'ONLY VISIBLE TO YOU'))+'</small></div></article>';
}
function visibleCars(){
 let arr=catalog.filter(car=>(filter==='All'||car.group===filter)&&(!query||(car.name+' '+car.year+' '+car.body+' '+car.tagline).toLowerCase().includes(query)));
 if(order==='power')arr.sort((a,b)=>b.hp-a.hp);
 if(order==='name')arr.sort((a,b)=>a.name.localeCompare(b.name));
 if(order==='old')arr.sort((a,b)=>((Number(a.year)||9999)-(Number(b.year)||9999)));
 return arr;
}
function renderCatalog(){
 if(!root)return;
 const shown=visibleCars();
 document.getElementById('scc-count').textContent=shown.length+' of '+catalog.length+' original vehicles';
 document.getElementById('scc-grid').innerHTML=shown.map(car=>{
 const status=car.boss?'FINAL RIVAL':car.live?'LIVE RACING CAR':car.junior?'KID-FRIENDLY CONCEPT':'FUTURE VEHICLE';
 return '<button type="button" class="scc-car '+(car.boss?'scc-boss':'')+'" data-scc-car="'+esc(car.key)+'" aria-label="Inspect '+esc(car.name)+'"><span class="scc-picture">'+carArt(car)+'</span><span class="scc-car-info"><strong>'+esc(car.name)+'</strong><small>'+esc(car.year)+' · '+esc(car.body)+'</small><span class="scc-status">'+status+'</span></span></button>';
 }).join('')||'<p class="scc-empty">No vehicles match. Try another search.</p>';
}
function renderRoster(){
 const panel=document.getElementById('scc-driver-grid');if(!panel)return;
 const others=profiles.filter(p=>p.user_id!==authId);
 const lineup=self?[self,...others]:others;
 panel.innerHTML=lineup.length?lineup.map(p=>driverCard(p,p.user_id===authId)).join(''):'<p class="scc-empty">Sign in with an approved Commons profile to see your driver character.</p>';
 const portrait=document.getElementById('scc-you');if(portrait){
 portrait.innerHTML=self?driverCard(self,true):'<p>Driver portrait will appear after sign-in.</p>';
 }
 for(const selector of ['#srw-garage .srw-header','#streetrod-root .sr-race-heading']){
  const host=document.querySelector(selector);if(!host||!self)continue;
  let chip=host.querySelector('.scc-live-driver');
  if(!chip){chip=document.createElement('div');chip.className='scc-live-driver';host.append(chip);}
  chip.innerHTML=avatar(self)+'<span><b>'+esc(self.display_name||'Driver')+'</b><small>YOUR DRIVER</small></span>';
 }
}
function inspectCar(key){
 const car=catalog.find(c=>c.key===key);if(!car)return;
 const line=car.boss?'THE FINAL CHALLENGE: A one-off mystery-themed super-van, with a wholly original silhouette, copper maze graphics and a fictional powertrain. The showdown itself is in development.':car.junior?'Junior imagination vehicle: intended for a future non-competitive, kid-friendly creative mode. No real-world driving, wagers or purchases.':car.live?'Available in the existing server-backed garage. Select or purchase it using the original garage panel to race.':'Catalog prototype only: the silhouette and specification are design targets. Purchasing and racing are not yet enabled.';
 modal.querySelector('.scc-dialog-content').innerHTML='<div class="scc-detail-art">'+carArt(car,true)+'</div><p class="scc-label">'+(car.boss?'FINAL RIVAL · CIPHER VAN X':'MOTOR VAULT / '+esc(car.group))+'</p><h3>'+esc(car.name)+'</h3><p>'+esc(car.tagline)+'</p><dl><div><dt>Era</dt><dd>'+esc(car.year)+'</dd></div><div><dt>Body</dt><dd>'+esc(car.body)+'</dd></div><div><dt>Concept power</dt><dd>'+(car.junior?'Play mode':car.hp+' hp (provisional)')+'</dd></div><div><dt>Status</dt><dd>'+(car.live?'Playable in current garage':'Preview / not purchasable')+'</dd></div></dl><p class="scc-explain">'+esc(line)+'</p>';
 if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
}
function mount(){
 if(root)return;
 const inside=document.getElementById('sr-inside');if(!inside)return;
 root=document.createElement('section');root.id='scc-motor-vault';root.className='scc-vault';
 root.innerHTML='<details><summary><span class="scc-heading"><b>MOTOR VAULT · 60 VEHICLES</b><small>Classics · Modern machines · Kid-friendly builds · Final mystery rival</small></span><span class="scc-chevron">▾</span></summary><div class="scc-inner"><div class="scc-intro"><h3>Choose your era. Build your legend.</h3><p>Original, composite-designed vehicle concepts. Five existing cars can be raced today; the rest are a post-launch catalog roadmap. The mystery-themed Cipher Van X is the planned final challenger.</p><div id="scc-you" class="scc-your-driver"></div></div><div class="scc-tools"><label class="scc-search">Find a vehicle <input id="scc-search" type="search" placeholder="Model, era, body style"></label><label class="scc-sort">Sort <select id="scc-sort"><option value="family">Original order</option><option value="old">Oldest first</option><option value="power">Power high to low</option><option value="name">A to Z</option></select></label></div><nav id="scc-filters" aria-label="Vehicle categories"></nav><p id="scc-count" class="scc-count"></p><div id="scc-grid" class="scc-grid"></div><details class="scc-roster"><summary>Driver characters · Toolbox profile avatars</summary><p>Your existing Toolbox profile is your driver character. Other members appear only when their profiles are published and active.</p><div id="scc-driver-grid" class="scc-driver-grid"></div></details><p class="scc-legal">Cars, bodywork and logos are original composites. Resemblance to real-world vehicle eras does not imply manufacturer affiliation. The Cipher Van X is an independent fictional mystery-themed rival, not a recreation of a TV vehicle.</p></div></details><dialog id="scc-detail" class="scc-dialog"><button type="button" data-scc-close aria-label="Close vehicle details" class="scc-close">Close ×</button><div class="scc-dialog-content"></div></dialog>';
 const race=inside.querySelector('.sr-race-card');if(race)race.before(root);else inside.append(root);
 modal=root.querySelector('#scc-detail');
 const nav=root.querySelector('#scc-filters');nav.innerHTML=groups.map(g=>'<button type="button" data-scc-group="'+esc(g)+'"'+(g===filter?' aria-pressed="true"':' aria-pressed="false"')+'>'+esc(g)+'</button>').join('');
 root.addEventListener('click',event=>{
  const btn=event.target.closest('button');if(!btn)return;
  if(btn.hasAttribute('data-scc-group')){filter=btn.dataset.sccGroup;root.querySelectorAll('[data-scc-group]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.sccGroup===filter)));renderCatalog();}
  else if(btn.hasAttribute('data-scc-car'))inspectCar(btn.dataset.sccCar);
  else if(btn.hasAttribute('data-scc-close')){if(modal.close)modal.close();else modal.removeAttribute('open');}
 });
 root.querySelector('#scc-search').addEventListener('input',ev=>{query=ev.target.value.trim().toLowerCase();renderCatalog();});
 root.querySelector('#scc-sort').addEventListener('change',ev=>{order=ev.target.value;renderCatalog();});
 renderCatalog();renderRoster();
}
async function connect(){
 if(ready||!window.COWBOY_COMMUNITY_CONFIG?.enabled||!root)return;
 ready=true;
 try{
  const cfg=window.COWBOY_COMMUNITY_CONFIG;
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  const result=await client.auth.getSession();authId=result.data.session?.user?.id;
  if(!authId)return;
  const member=await client.from('community_members').select('status').eq('user_id',authId).maybeSingle();
  if(member.error||member.data?.status!=='approved')return;
  const fields='user_id,display_name,avatar_mode,avatar_icon,avatar_path,theme,published,account_active';
  const [own,all]=await Promise.all([
   client.from('community_profiles').select(fields).eq('user_id',authId).maybeSingle(),
   client.from('community_profiles').select(fields).eq('published',true).eq('account_active',true).limit(80)
  ]);
  self=own.data||{user_id:authId,display_name:'Your Driver',avatar_mode:'initials',published:false,account_active:true};
  profiles=(all.data||[]).filter(p=>p.published&&p.account_active);
  const paths=[...new Set([self,...profiles].filter(p=>p.avatar_mode==='photo'&&p.avatar_path).map(p=>p.avatar_path))];
  if(paths.length){
   const signed=await client.storage.from('community-avatars').createSignedUrls(paths,300);
   if(!signed.error)for(const item of signed.data||[])if(item.signedUrl&&item.path)photoLinks.set(item.path,item.signedUrl);
  }
  renderRoster();
 }catch(error){const el=document.getElementById('scc-you');if(el)el.textContent='Driver profile will appear when your Commons session is ready.';}
}
function attach(){
 if(!document.getElementById('sr-inside')){if(root){root.remove();root=null;ready=false;profiles=[];self=null;}return;}
 if(!root){mount();void connect();}
 else if(self && ((document.querySelector('#srw-garage .srw-header')&&!document.querySelector('#srw-garage .srw-header .scc-live-driver'))||(document.querySelector('#streetrod-root .sr-race-heading')&&!document.querySelector('#streetrod-root .sr-race-heading .scc-live-driver'))))renderRoster();
}
if(window.COWBOY_COMMUNITY_CONFIG?.enabled&&location.pathname.endsWith('community.html')){
 const obs=new MutationObserver(()=>{if(!document.getElementById('scc-motor-vault')&&root)root=null;attach();});
 obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 attach();
}
