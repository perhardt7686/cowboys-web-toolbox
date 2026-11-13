/* Street r0d: season-specific physical workbench, no persistent multiplayer car crossover.
 * Authenticated RPCs save each individual bolt / wiring change and verify the
 * installed spare part before awarding the seasonal upgrade.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const config=window.COWBOY_COMMUNITY_CONFIG;
let root=null,holder=null,client=null,promise=null,vehicle=null,session=null,bench=null;
let busy=false,tool='loosen';
const defs=[
 ['carb','Carburetor','Twin carb mounting studs'],
 ['manifold','Intake manifold','Four inlet fasteners'],
 ['engine','Engine block','Ignition wiring, battery ground, coolant hoses and fuel feed'], 
 ['gearbox','Transmission','Bellhousing mounts and shift linkage'],
 ['wheels','Wheels & tires','Use jack and stands, then tighten lugs in cross-pattern']
];
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function message(text,bad=false){const x=holder?.querySelector('.ssb-status');if(x){x.textContent=String(text);x.classList.toggle('error',bad)}}
async function api(){
 if(client)return client;
 if(promise)return promise;
 promise=(async()=>{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,sessionStorage=window.sessionStorage;
  const storage=createAuthStorage({local,session:sessionStorage,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(config.supabaseUrl,config.publishableKey,
   {auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  client.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'){bench=null;session=null;holder.hidden=true;}});
  return client;
 })();
 try{return await promise;}finally{promise=null;}
}
async function rpc(fn,args){
 const service=await api();const {data,error}=await service.rpc(fn,args||{});
 if(error)throw Error(error.message||'Workbench record unavailable');
 return data;
}
function contents(){
 if(!holder)return;
 if(!bench){holder.querySelector('.ssb-body').innerHTML='<p>Opening your saved engine bay…</p>';return;}
 const parts=bench.parts||{},service=session?.season?.service||{};
 const planned=service.kind&&service.car===vehicle;
 const ready=Boolean(bench.ready);
 const partView=defs.map(([key,label,desc])=>{
  const part=parts[key]||{},mounted=Boolean(part.mounted),bolts=part.bolts||[];
  return '<article class="ssb-component '+(mounted?'mounted':'removed')+'"><header><strong>'+safe(label)+'</strong>'+
   '<span>'+(mounted?'BOLTED TO CAR':'IN PARTS TRAY')+'</span></header><p>'+safe(desc)+'</p>'+
   '<div class="ssb-bolts">'+(mounted?bolts.map((value,i)=>
    '<button type="button" data-ssb="bolt" data-part="'+key+'" data-index="'+i+'" data-delta="'+(tool==='loosen'?-1:1)+
    '" aria-label="'+tool+' '+label+' bolt '+(i+1)+'"><span>'+(value===2?'✣':value===1?'◉':'○')+'</span>'+
    '<small>#'+(i+1)+' '+value+'/2</small></button>').join(''):'<span class="ssb-removed-warning">Part removed. Reinstall before racing.</span>')+'</div>'+
   '<div class="ssb-component-controls">'+
   '<button type="button" data-ssb="'+(mounted?'remove':'install')+'" data-part="'+key+'">'+(mounted?'Lift part':'Refit part')+'</button>'+
   (key==='engine'&&mounted?'<button type="button" data-ssb="wire" data-part="engine">'+(part.wires?'Disconnect ignition':'Reconnect ignition')+'</button>'+
    '<button type="button" data-ssb="battery" data-part="engine">'+(part.battery===false?'Reconnect battery':'Disconnect battery ground')+'</button>'+
    '<button type="button" data-ssb="coolant" data-part="engine">'+(part.coolant===false?'Reconnect coolant hose':'Disconnect coolant hose')+'</button>'+
    '<button type="button" data-ssb="fuel" data-part="engine">'+(part.fuel_line===false?'Reconnect fuel feed':'Disconnect fuel feed')+'</button>':'')+
   (key==='wheels'?'<button type="button" class="ssb-jack" data-ssb="jack" data-part="wheels">'+(part.jacked?'Lower jack (after torque)':'Raise jack and stands')+'</button>':'')+
   (key==='gearbox'&&mounted?'<button type="button" data-ssb="link" data-part="gearbox">'+(part.linked?'Disconnect linkage':'Reconnect linkage')+'</button>':'')+
   '</div></article>';
 }).join('');
 holder.querySelector('.ssb-body').innerHTML=
 '<div class="ssb-title-row"><div><p>THE SEASONAL WORKSHOP · '+safe(vehicle)+'</p><h4>Under the hood</h4>'+
 '<span>Remove carburetor before manifold. Disconnect battery, ignition, coolant and fuel before lifting engine. Jack wheels before loosening.</span></div>'+ 
 '<div class="ssb-readiness '+(ready?'ready':'unsafe')+'">'+(ready?'SAFE TO RACE':'DISASSEMBLED · DO NOT RACE')+'</div></div>'+
 '<div class="ssb-mechanical-art"><div class="ssb-bonnet"><span>OPEN HOOD · ENGINE COMPARTMENT</span></div>'+
 '<div class="ssb-chassis"><div class="ssb-air-cleaner">AIR CLEANER</div><div class="ssb-block"><span>VINTAGE V8</span>'+
 '<i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ssb-radiator">RADIATOR</div></div></div>'+
 '<nav class="ssb-wrench-switch"><strong>WRENCH POSITION</strong><button type="button" data-ssb-tool="loosen" aria-pressed="'+(tool==='loosen')+'">↶ Loosen</button>'+
 '<button type="button" data-ssb-tool="tighten" aria-pressed="'+(tool==='tighten')+'">↷ Tighten</button></nav>'+
 '<div class="ssb-torque-guide"><strong>TORQUE ORDER: 1 - 3 - 2 - 4.</strong> For engine, gearbox and wheel bolts, snug all fasteners to stage 1 before the final cross-pattern torque pass. Loosen to 0 before removal. Reconnect all fluids and electricity, and lower the jack before racing.</div>'+
 '<div class="ssb-components">'+partView+'</div>'+
 '<div class="ssb-bottom"><div><strong>'+ (planned?'SERVICE PLAN · '+safe(service.kind).toUpperCase():'ORIGINAL ASSEMBLY')+'</strong>'+
 '<p>'+(planned?(service.prepared?'Replacement part has been removed once. Restore all parts and fasteners, then certify the job.':
 'To upgrade, physically remove the old '+safe(service.kind)+' assembly and re-install it in reverse order.') :
 'Your engine, bolts, wires and transmission are saved per seasonal vehicle.')+'</p></div>'+
 '<div class="ssb-buttons">'+
 (planned?'<button type="button" data-ssb="complete" '+(!service.prepared||!ready?'disabled':'')+'>Certify new part installation</button>':'')+
 '<button type="button" data-ssb="reset">Restore original assembly</button>'+
 '<button type="button" data-ssb="close">Lower hood</button></div></div>';
}
function mount(){
 root=document.getElementById('streetrod-summer');
 if(!root)return false;
 if(holder?.isConnected)return true;
 holder=document.createElement('section');holder.id='ss-season-bay';holder.className='ssb-workbench';
 holder.hidden=true;holder.setAttribute('aria-label','Seasonal car mechanical disassembly, real fasteners and inventory');
 holder.innerHTML='<div class="ssb-body"><p>Loading workbench…</p></div><p class="ssb-status" role="status" aria-live="polite"></p>';
 const scene=root.querySelector('#ss-scene');if(scene)scene.after(holder);else root.append(holder);
 holder.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled||busy)return;
  if(b.dataset.ssbTool){tool=b.dataset.ssbTool;contents();return;}
  const a=b.dataset.ssb;if(!a)return;
  if(a==='close'){holder.hidden=true;message('Hood lowered. Your saved assembly remains intact.');return;}
  if(a==='reset'&&!window.confirm('Restore all factory components? The purchased spare part remains in your inventory.'))return;
  void act(a,b.dataset.part||null,b.dataset.index===undefined?null:Number(b.dataset.index),
    b.dataset.delta===undefined?null:Number(b.dataset.delta));
 });
 root.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.ssAction==='workshop'||b.dataset.ssAction==='service_advance'){
   event.preventDefault();event.stopImmediatePropagation();
   void open();
  }
 },true);
 root.addEventListener('click',event=>{
  const target=event.target.closest('[data-ss-tab]');
  if(target&&target.dataset.ssTab!=='garage'&&target.dataset.ssTab!=='parts')holder.hidden=true;
 });
 new MutationObserver(()=>{
  if(!root||!holder)return;
  if(root.hidden)holder.hidden=true;
  if(!holder.hidden&&holder.parentElement!==root){root.querySelector('#ss-scene')?.after(holder);}
 }).observe(root,{attributes:true,attributeFilter:['hidden']});
 return true;
}
async function open(){
 if(!holder||busy)return;
 busy=true;holder.hidden=false;message('Raising the hood and loading real fasteners…');
 try{
  const data=await rpc('community_streetrod_season_state');
  session=data;vehicle=data?.season?.current_car;
  if(!vehicle)throw Error('Buy or select a seasonal car in the newspaper first.');
  bench=await rpc('community_streetrod_season_workbench_state',{p_car:vehicle});
  contents();message('Hood up. Each bolt turn is saved to this seasonal vehicle.');
  holder.scrollIntoView?.({block:'nearest'});
 }catch(error){bench=null;message('Could not open hood: '+String(error.message||'Try again'),true);}
 finally{busy=false;}
}
async function act(action,part,index,delta){
 if(!bench||!vehicle||busy)return;
 busy=true;message('Saving the real mechanical work…');
 try{
  const data=await rpc('community_streetrod_season_workbench_action',
   {p_car:vehicle,p_action:action,p_part:part,p_slot:index,p_delta:delta,p_revision:bench.revision});
  session=data.state;bench=data.workbench;
  contents();message(data.completed?'Replacement installed and saved. Your season car is upgraded.':
   data.ready?'Bolts secured. The car is roadworthy.':'Assembly saved. Finish all bolts and connections before racing.');
  root.querySelector('[data-ss-action="refresh"]')?.click();
 }catch(error){message(String(error.message||'No change saved').slice(0,175),true);
   if(/different garage tab|revision/i.test(String(error.message||'')))void open();
 }finally{busy=false;}
}
if(config?.enabled&&location.pathname.endsWith('community.html')){
 const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});
 observer.observe(document.body,{subtree:true,childList:true});mount();
}
