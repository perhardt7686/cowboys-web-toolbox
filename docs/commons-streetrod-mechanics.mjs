/* Cowboy Motor Works | Interactive Garage Mechanics V1
 * Original artwork and interaction code. No original game assets.
 * Server-authoritative workbench state and credits; no direct table access.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const parts={
 carb:{name:'Carburetor',label:'Fuel & air metering',hint:'Remove both mounting studs to lift the carburetor.',color:'#c5ab7f'},
 manifold:{name:'Intake manifold',label:'Intake runners',hint:'The carburetor must come off first. Four manifold bolts hold it down.',color:'#d7b77f'},
 engine:{name:'Engine block',label:'V8 power unit',hint:'Remove the manifold, disconnect ignition wiring, and free four block bolts.',color:'#aab8bd'},
 gearbox:{name:'Transmission',label:'Bellhousing & gearbox',hint:'Uncouple the shift linkage, then free all four mounting bolts.',color:'#9ca6aa'},
 wheels:{name:'Wheels and tires',label:'Four lug positions',hint:'Undo the four wheel fasteners, remove the wheel set, and refit the replacement.',color:'#7d888c'}
};
const tabs=[['hood','Hood & engine','WRENCH'],['tires','Tires & jack','WHEEL'],['gearbox','Transmission','GEAR'],['inspect','Car information','INFO']];
const tabParts=tab=>tab==='hood'?['carb','manifold','engine']:tab==='tires'?['wheels']:tab==='gearbox'?['gearbox']:[];
const getReady=p=>Object.values(p||{}).every(piece=>piece?.mounted===true&&(piece.bolts||[]).every(x=>x===2)&&(piece.wires!==false)&&(piece.linked!==false));
const isMounted=(p,k)=>p?.[k]?.mounted===true;
const allBolts=(p,k,val)=>p?.[k]?.bolts?.every(n=>n===val)===true;
let panel=null,client=null,connecting=null,wb=null,garage=null,active='hood',carKey=null,busy=false,tool='loosen',note='',warn=false,shouldScroll=false;
function money(n){return new Intl.NumberFormat('en-US').format(Number(n||0))+' cr';}
function activeCar(){return garage?.cars?.find(c=>c.selected)||garage?.cars?.[0]||null;}
function model(){return garage?.catalog?.find(c=>c.key===carKey)||{};}
function cost(k){const c=activeCar();let level=Number(c?.[k]||0);return level>=5?null:250+250*level+(k==='engine'?100:k==='gearbox'?50:0);}
function status(str,error=false){note=str;warn=error;const p=panel?.querySelector('.mw-status');if(p){p.textContent=str;p.classList.toggle('mw-error',error);}}
function icon(component){return component==='engine'?'⚙':component==='manifold'?'▤':component==='carb'?'▣':component==='gearbox'?'⚙':'◎';}
function quickGuidance(){
 const p=wb?.parts||{},plan=wb?.plan;
 if(!wb)return 'Sign in to your approved Commons account to inspect your car.';
 if(!wb.drive_ready){
  if(!isMounted(p,'engine'))return 'Refit the engine block, torque four bolts, and reconnect ignition wiring.';
  if(!isMounted(p,'manifold'))return 'Finish engine bolts and wiring, then install the intake manifold.';
  if(!isMounted(p,'carb'))return 'Finish intake bolts, fit the carburetor, and torque its two fasteners.';
  if(!isMounted(p,'gearbox'))return 'Reinstall the transmission and torque the housing bolts.';
  if(!isMounted(p,'wheels'))return 'Reinstall the wheels and torque all four lugs.';
  return 'Finish all loose bolts and reconnect the wiring/linkage before racing.';
 }
 if(plan&&!wb.prepared)return 'Your '+plan+' upgrade needs actual disassembly. Remove the relevant original component first.';
 if(plan&&wb.prepared)return 'Your replacement is fitted and secure. Confirm installation to charge '+money(cost(plan))+' and save the level.';
 return 'Car is roadworthy. Select a package, then physically loosen, remove, refit, and torque its parts.';
}
function boltGraphic(k,idx,n){
 const title=(n===2?'Fully tightened':n===1?'Loosened one turn':'Removed')+' · '+parts[k].name+' bolt '+(idx+1);
 return `<button type="button" class="mw-bolt mw-bolt-${n}" data-mw-action="bolt" data-part="${k}" data-slot="${idx}" data-delta="${tool==='loosen'?-1:1}" title="${escape(title)}; click to ${tool}" aria-label="${escape(title)}; ${tool==='loosen'?'loosen':'tighten'}"><span>${n===0?'○':n===1?'◉':'✣'}</span></button>`;
}
function diagramBolts(){
 if(!wb)return '';
 const positions={carb:[[43,46],[57,46]],manifold:[[34,58],[66,58],[34,70],[66,70]],engine:[[25,76],[75,76],[25,88],[75,88]],gearbox:[[38,41],[62,41],[38,76],[62,76]],wheels:[[50,20],[79,47],[50,76],[21,47]]};
 const names=tabParts(active);
 let html='';
 for(const k of names){
  const piece=wb.parts?.[k];if(!piece?.mounted)continue;
  for(let i=0;i<(piece.bolts?.length||0);i++){
   const n=piece.bolts[i],at=(positions[k]||[])[i];if(!at)continue;
   html+=`<button type="button" class="mw-diagram-bolt mw-diagram-bolt-${n}" style="left:${at[0]}%;top:${at[1]}%" data-mw-action="bolt" data-part="${k}" data-slot="${i}" data-delta="${tool==='loosen'?-1:1}" aria-label="${tool} ${parts[k].name} bolt ${i+1}" title="${tool} ${parts[k].name} bolt ${i+1}">${n===0?'○':n===1?'◉':'✣'}</button>`;
  }
 }
 if(active==='hood')html+='<button type="button" class="mw-diagram-label mw-label-engine" data-mw-pick="engine">Engine block</button><button type="button" class="mw-diagram-label mw-label-carb" data-mw-pick="carb">Carburetor</button><button type="button" class="mw-diagram-label mw-label-intake" data-mw-pick="manifold">Intake</button>';
 return html;
}
function schematic(){
 const p=wb?.parts||{},car=escape(model().name||'Your street rod');
 const body=`<div class="mw-chrome-rail" aria-hidden="true"></div><div class="mw-battery" aria-hidden="true"><b>12V</b><i></i></div><div class="mw-radiator" aria-hidden="true"><span>COOLING</span></div>
 <div class="mw-engine-block ${isMounted(p,'engine')?'':'is-removed'}" aria-hidden="true"><span class="mw-belt"></span><div class="mw-valvebank">${Array.from({length:4},()=>'<i></i>').join('')}</div><b>V8 ENGINE</b><div class="mw-valvebank">${Array.from({length:4},()=>'<i></i>').join('')}</div></div>
 <div class="mw-intake ${isMounted(p,'manifold')?'':'is-removed'}" aria-hidden="true"><span>INTAKE MANIFOLD</span><i></i><i></i><i></i></div>
 <div class="mw-carburetor ${isMounted(p,'carb')?'':'is-removed'}" aria-hidden="true"><span>CARBURETOR</span><div><i></i><i></i></div></div>
 <div class="mw-wires ${p.engine?.wires?'':'is-disconnected'}" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
 <div class="mw-engine-shadow" aria-hidden="true"></div>`;
 const gearbox=`<div class="mw-gearbox-graphic ${isMounted(p,'gearbox')?'':'is-removed'}" aria-hidden="true"><div class="mw-gearbox-housing"><span>4-SPEED GEARBOX</span><i></i><i></i><i></i></div><div class="mw-driveshaft ${p.gearbox?.linked?'':'is-disconnected'}"></div><div class="mw-shifter">SHIFT LINKAGE</div></div>`;
 const wheel=`<div class="mw-wheel-graphic ${isMounted(p,'wheels')?'':'is-removed'}" aria-hidden="true"><div class="mw-tire-sidewall"><div class="mw-rim"><div class="mw-lugs">${Array.from({length:4},(_,i)=>'<i class="lug-'+i+'"></i>').join('')}</div><span>ROADSTAR</span></div></div></div>`;
 const visual=active==='hood'?body:active==='gearbox'?gearbox:active==='tires'?wheel:`<div class="mw-inspection-graphic">${escape(car)}<small>WORKSHOP INSPECTION / SUMMER 1963</small></div>`;
 return `<div class="mw-scene mw-scene-${active}">
  <div class="mw-hood-lid" aria-hidden="true"><div class="mw-hood-ribs"><i></i><i></i><i></i><i></i><i></i></div><span>${active==='hood'?'HOOD RAISED · ENGINE ACCESS':active==='gearbox'?'VEHICLE ON THE LIFT':active==='tires'?'JACK SECURED / WHEEL ACCESS':'INSPECTION BENCH'}</span></div>
  <div class="mw-visual">${visual}${diagramBolts()}</div>
  <div class="mw-graphic-caption">${escape(car)} · ${active==='hood'?'ENGINE BAY':active==='gearbox'?'TRANSMISSION TUNNEL':active==='tires'?'WHEEL SERVICE':'CLIPBOARD'}</div>
 </div>`;
}
function partCard(k){
 const p=wb?.parts||{},v=p[k];if(!v)return '';
 const mounted=v.mounted===true,ready=mounted&&v.bolts.every(x=>x===2),nloose=v.bolts.filter(n=>n!==2).length;
 return `<section data-mw-panel="${k}" class="mw-part-card ${mounted?'':'mw-part-removed'}" aria-label="${escape(parts[k].name)}">
 <div class="mw-part-heading"><span class="mw-part-icon">${icon(k)}</span><div><h4>${escape(parts[k].name)}</h4><small>${escape(parts[k].label)}</small></div><b class="mw-condition ${ready?'mw-ready':''}">${mounted?ready?'SECURED':nloose+' FASTENERS OPEN':'ON PARTS TRAY'}</b></div>
 <p>${escape(parts[k].hint)}</p>
 <div class="mw-bolt-row" aria-label="${escape(parts[k].name)} fasteners">${mounted?v.bolts.map((n,i)=>boltGraphic(k,i,n)).join(''):'<span class="mw-removed-message">The old component has been removed.</span>'}</div>
 <div class="mw-part-actions">${mounted?`<button type="button" data-mw-action="remove" data-part="${k}">Lift ${escape(parts[k].name)}</button>`:`<button type="button" class="mw-install" data-mw-action="install" data-part="${k}">Install ${escape(parts[k].name)}</button>`}
 ${k==='engine'&&mounted?`<button type="button" data-mw-action="wire" data-part="engine">${v.wires?'Disconnect':'Reconnect'} ignition leads</button>`:''}
 ${k==='gearbox'&&mounted?`<button type="button" data-mw-action="link" data-part="gearbox">${v.linked?'Disconnect':'Attach'} shift linkage</button>`:''}
 </div></section>`;
}
function packages(){
 if(!garage)return '';
 const entries=[['engine','ENGINE + INTAKE'],['tires','TIRES / GRIP'],['gearbox','TRANSMISSION']];
 return `<div class="mw-packages"><div class="mw-section-heading"><b>Parts counter</b><span>Credits are charged only after the parts are refitted</span></div><div class="mw-package-grid">${entries.map(([key,name])=>{
 const price=cost(key),level=activeCar()?.[key]||0,selected=wb?.plan===key;
 return `<button type="button" data-mw-action="plan" data-part="${key}" aria-pressed="${selected}" ${price===null||wb?.plan&&wb.plan!==key?'disabled':''}><strong>${name}</strong><small>Level ${level} / 5</small><b>${price===null?'MAXED':money(price)}</b>${selected?'<em>WORK ORDER ACTIVE</em>':''}</button>`;
 }).join('')}</div></div>`;
}
function inspectPanel(){
 const c=activeCar(),m=model(),p=wb?.parts||{};
 const metrics=[['ENGINE',c?.engine||0],['TIRES',c?.tires||0],['GEARBOX',c?.gearbox||0]];
 return `<div class="mw-inspector"><h4>Car information · ${escape(m.name||carKey)}</h4><p>${escape(m.class||'Independent racing build')} · ${escape(m.body||'Original composite vehicle')}</p><div class="mw-stats">${metrics.map(([a,b])=>`<div><small>${a} UPGRADE</small><strong>LV ${b} / 5</strong></div>`).join('')}<div><small>BANKROLL</small><strong>${money(garage?.garage?.credits)}</strong></div></div><h5>Inspection report</h5><ul>${Object.keys(parts).map(k=>`<li><span>${escape(parts[k].name)}</span><b>${isMounted(p,k)&&allBolts(p,k,2)?'BOLTED UP':'SERVICE REQUIRED'}</b></li>`).join('')}</ul><p>Engine wear, fuel and paint are not yet part of the server race model. The physical assembly and performance upgrade levels shown here are saved.</p></div>`;
}
function render(){
 if(!panel)return;
 if(!wb){panel.querySelector('.mw-content').innerHTML='<p class="mw-loading">Sign in to inspect the engine and your car parts.</p>';status(note||'');return;}
 const p=wb.parts||{},ready=Boolean(wb.drive_ready),plan=wb.plan,canFinish=ready&&(!plan||wb.prepared),tabBtns=tabs.map(([tab,label])=>`<button type="button" data-mw-tab="${tab}" aria-pressed="${active===tab}">${label}</button>`).join('');
 panel.querySelector('.mw-content').innerHTML=`<div class="mw-topbar"><div><span class="mw-eyebrow">COWBOY MOTOR WORKS · WORK ORDER NO. ${escape(carKey)}</span><h3>Hands on the hardware.</h3><p>Turn each bolt, lift components, and rebuild the motor before it can race.</p></div><div class="mw-traffic ${ready?'mw-green':'mw-red'}">${ready?'ROADWORTHY':'NOT SAFE TO DRIVE'}</div></div>
 <nav class="mw-tabs" aria-label="Mechanical service sections">${tabBtns}</nav>
 <div class="mw-main-grid"><div>${schematic()}${active==='inspect'?inspectPanel():''}</div><div class="mw-hardware">
 ${active==='inspect'?'<p class="mw-instruction">Examine parts and levels in the clipboard at left. Choose a service section to begin.</p>':`<div class="mw-tool-selector"><strong>Wrench direction</strong><button type="button" data-mw-tool="loosen" aria-pressed="${tool==='loosen'}">↶ Loosen</button><button type="button" data-mw-tool="tighten" aria-pressed="${tool==='tighten'}">↷ Tighten</button></div>${tabParts(active).map(partCard).join('')}`}
 </div></div>
 ${packages()}
 <div class="mw-workorder"><div><b>${plan?'UPGRADE IN PROGRESS: '+plan.toUpperCase():'NO ACTIVE PARTS PURCHASE'}</b><p>${escape(quickGuidance())}</p></div><div class="mw-workorder-actions"><button type="button" data-mw-action="reset" class="mw-reset">Reset assembly without purchase</button><button type="button" data-mw-action="finish" ${canFinish?'':'disabled'} class="mw-complete">${plan?wb.prepared?'Complete install · '+money(cost(plan)):'Disassemble first':'Verify roadworthy'}</button></div></div>`;
 panel.querySelector('.mw-status').textContent=note;
 panel.querySelector('.mw-status').classList.toggle('mw-error',warn);
}
async function getClient(){
 if(client)return client;
 if(connecting)return connecting;
 connecting=(async()=>{
  if(!cfg?.enabled||!cfg.supabaseUrl||!cfg.publishableKey)throw Error('Commons connection is not enabled.');
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){wb=null;garage=null;render();status('Please sign in again.',true);}});
  return client;
 })();
 try{return await connecting;}finally{connecting=null;}
}
async function load(){
 const api=await getClient();const {data:g,error:err}=await api.rpc('community_streetrod_state');
 if(err)throw err;
 const c=g?.cars?.find(x=>x.selected)||g?.cars?.[0];if(!c)throw Error('Buy or select a car before entering the workbench.');
 garage=g;carKey=c.key;
 const {data:w,error}=await api.rpc('community_streetrod_workbench_state',{p_car:carKey});if(error)throw error;wb=w;
 return wb;
}
async function change(action,part,slot=null,delta=null){
 if(busy||!wb||!carKey)return;
 busy=true;panel?.classList.add('mw-busy');
 const previous=wb;status('Turning the wrench and saving your garage…');
 try{
  const api=await getClient();const {data,error}=await api.rpc('community_streetrod_workbench_action',{
   p_car:carKey,p_action:action,p_part:part||null,p_slot:slot,p_delta:delta,p_revision:wb.revision
  });
  if(error)throw error;wb=data;
  if(data.racing){garage=data.racing;document.querySelector('#streetrod-root [data-sr-action="refresh"]')?.click();$('#srw-reload')?.click();}
  const feedback={plan:'Work order prepared. Start by removing the original component.',bolt:'Fastener moved and saved.',remove:'Component lifted to the parts tray.',install:'Component seated. Tighten every fastener.',wire:'Ignition lead connection updated.',link:'Shift linkage updated.',reset:'Original assembly restored. No credits charged.',finish:data.racing?'Installed and purchased. Your saved racing build is upgraded.':'All hardware checked. Car is ready.'};
  status(feedback[action]||'Workshop saved.');
 }catch(error){wb=previous;status(String(error.message||'Service failed, refresh and retry.').slice(0,200),true);
  if(error.code==='40001'){try{await load()}catch{}}
 }finally{busy=false;panel?.classList.remove('mw-busy');render();}
}
function mount(){
 if(panel?.isConnected)return panel;
 const garageRoot=$('srw-garage');if(!garageRoot)return null;
 panel=document.createElement('section');panel.id='streetrod-mechanical-bay';panel.className='mw-bay';panel.hidden=true;
 panel.setAttribute('aria-label','Interactive engine disassembly and garage workshop');
 panel.innerHTML='<div class="mw-heading"><span>THE PHYSICAL WORKBENCH · WORKSHOP 02</span><button type="button" data-mw-action="close">Close mechanic bench ×</button></div><div class="mw-content"><p class="mw-loading">Fetching your car record…</p></div><p class="mw-status" role="status" aria-live="polite"></p>';
 const scene=garageRoot.querySelector('.srw-scene-frame');if(scene)scene.after(panel);else garageRoot.prepend(panel);
 panel.addEventListener('click',async event=>{
  const btn=event.target.closest('button');if(!btn||btn.disabled||busy)return;
  if(btn.dataset.mwPick){panel.querySelector('[data-mw-panel=\"'+btn.dataset.mwPick+'\"]')?.scrollIntoView?.({block:'nearest'});return}
  if(btn.dataset.mwTab){active=btn.dataset.mwTab;render();return}
  if(btn.dataset.mwTool){tool=btn.dataset.mwTool;render();return}
  const action=btn.dataset.mwAction;if(!action)return;
  if(action==='close'){panel.hidden=true;return}
  if(action==='reset'){if(window.confirm('Restore the entire car assembly and cancel the unfinished job? No purchase will be made.'))await change('reset');return}
  if(action==='finish'){await change('finish');return}
  await change(action,btn.dataset.part,btn.dataset.slot!==undefined?Number(btn.dataset.slot):null,btn.dataset.delta!==undefined?Number(btn.dataset.delta):null);
 });
 return panel;
}
export async function openWorkshop(tab='hood',upgrade=null,fromExistingHotspot=false){
 if(!location.pathname.endsWith('community.html'))return false;
 let root=mount();if(!root){await new Promise(resolve=>setTimeout(resolve,120));root=mount()}
 if(!root)return false;
 const parent=$('sr-inside');if(parent?.hidden){const toggle=$('sr-toggle');if(toggle)toggle.click();}
 active=tabs.some(x=>x[0]===tab)?tab:'hood';root.hidden=false;
 const enter=$('srw-enter');if(enter&&!enter.hidden&&!enter.disabled)enter.click();
 const hood=$('srw-hood');if(active==='hood'&&!fromExistingHotspot&&hood&&!hood.hidden&&!hood.disabled&&hood.textContent?.toLowerCase().includes('open'))hood.click();
 status('Opening the mechanical service record…');
 try{await load();render();if(upgrade&&['engine','tires','gearbox'].includes(upgrade)){
  active=upgrade==='engine'?'hood':upgrade==='tires'?'tires':'gearbox';render();
  if(!wb.plan)await change('plan',upgrade);
  else if(wb.plan!==upgrade)status('Another repair is already active. Finish or reset it before switching packages.',true);
 }}catch(error){wb=null;status(String(error.message||'Unable to open workshop.').slice(0,160),true);render();root.scrollIntoView?.({block:'start'});return false;}
 root.scrollIntoView?.({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 return true;
}
// When the original garage's hood, jack and transmission hotspots are used,
// open the detailed mechanical bench as well. Do not hijack race physics.
if(cfg?.enabled&&location.pathname.endsWith('community.html')){
 const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});
 observer.observe(document.body,{subtree:true,childList:true});mount();
 document.addEventListener('click',event=>{
  const b=event.target.closest('#srw-garage button[data-srw]');if(!b||!event.isTrusted)return;
  const kind=b.dataset.srw;
  if(kind==='service'){
   event.preventDefault();event.stopImmediatePropagation();
   void openWorkshop(b.dataset.kind==='engine'?'hood':b.dataset.kind==='tires'?'tires':'gearbox',b.dataset.kind,true);
  }else if(kind==='hood'||kind==='wheel'||kind==='underbody'){
   void openWorkshop(kind==='hood'?'hood':kind==='wheel'?'tires':'gearbox',null,true);
  }
 },true);
 document.addEventListener('streetrod:parked',()=>{
   if(!panel?.hidden&&active==='hood'){const hood=$('srw-hood');if(hood&&!hood.hidden&&!hood.disabled&&hood.textContent?.toLowerCase().includes('open'))hood.click();}
 });
}