/* Summer '63 gas station: manual nozzle, amount selector, server-backed fuel receipt. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const cfg=window.COWBOY_COMMUNITY_CONFIG;
let root=null,panel=null,client=null,connecting=null,car=null,enabled=false,busy=false,nozzle=false;
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
function message(text,error=false){const out=panel?.querySelector('.ssg-status');if(out){out.textContent=text;out.classList.toggle('error',error)}}
async function api(){
 if(client)return client;if(connecting)return connecting;
 connecting=(async()=>{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  client.auth.onAuthStateChange(x=>{if(x==='SIGNED_OUT'){car=null;if(panel)panel.hidden=true;}});
  return client;
 })();
 try{return await connecting;}finally{connecting=null}
}
async function rpc(name,args){const c=await api();const {data,error}=await c.rpc(name,args||{});if(error)throw Error(error.message);return data}
function readout(){
 const slider=panel?.querySelector('#ssg-target'),amount=panel?.querySelector('#ssg-amount');
 const gauge=panel?.querySelector('#ssg-gauge');if(!slider||!car)return;
 const target=Number(slider.value),price=(target-car.fuel)*2;
 if(amount)amount.textContent=target+'% fuel · $'+price.toLocaleString('en-US');
 if(gauge)gauge.style.height=target+'%';
}
function mount(){
 root=document.getElementById('streetrod-summer');if(!root)return false;
 if(panel?.isConnected)return true;
 panel=make('section','ssg-station');panel.id='ssg-gas-station';panel.hidden=true;
 panel.setAttribute('aria-label','Vintage gas station and manual fuel pump');
 panel.innerHTML='<header><small>COWBOY MOTOR WORKS · GARAGE TRAVEL</small><h4>Hillside Service Station</h4><p>Pull the nozzle from the pump, choose your fill level, then pay for exactly what you pumped.</p></header>'+
 '<div class="ssg-forecourt"><div class="ssg-pump"><div class="ssg-top">GASOLINE</div><div class="ssg-dial"><small>FUEL TOTAL</small><strong id="ssg-amount">0% fuel</strong></div>'+
 '<div class="ssg-meter"><span id="ssg-gauge"></span></div><div class="ssg-handle" id="ssg-handle">⛽</div><div class="ssg-hose"></div><div class="ssg-base"></div></div>'+
 '<div class="ssg-car-side"><span>THE TANK</span><div class="ssg-fuel-door">OPEN FUEL DOOR</div><div class="ssg-tank-bar"><span id="ssg-current"></span></div></div></div>'+
 '<form id="ssg-form"><label>Fuel pump setting <input id="ssg-target" name="target" type="range" min="1" max="100" step="1" value="100"></label>'+
 '<p class="ssg-current-label" id="ssg-current-label">Current tank: 0%</p>'+
 '<div class="ssg-buttons"><button id="ssg-lift" type="button" data-ssg="lift">Lift nozzle</button>'+
 '<button type="submit" id="ssg-submit" disabled>Pump gas and pay</button>'+
 '<button type="button" data-ssg="close">Return to garage</button></div></form>'+
 '<p class="ssg-status" role="status" aria-live="polite"></p>';
 root.querySelector('#ss-scene')?.after(panel);
 root.addEventListener('click',event=>{
  const b=event.target.closest('button');
  if(!b)return;
  if(b.dataset.ssAction==='refuel'){
   event.preventDefault();event.stopImmediatePropagation();void open();
  }else if(b.dataset.ssTab){panel.hidden=true;}
 },true);
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button[data-ssg]');if(!button)return;
  if(button.dataset.ssg==='close'){panel.hidden=true;nozzle=false;return;}
  if(button.dataset.ssg==='lift'){nozzle=true;panel.classList.add('ssg-connected');
   panel.querySelector('#ssg-submit').disabled=false;message('Nozzle connected. Set the amount and press Pump Gas.');}
 });
 panel.querySelector('#ssg-target').addEventListener('input',readout);
 panel.querySelector('#ssg-form').addEventListener('submit',event=>{event.preventDefault();void submit();});
 new MutationObserver(()=>{if(root.hidden)panel.hidden=true;}).observe(root,{attributes:true,attributeFilter:['hidden']});
 return true;
}
async function open(){
 if(!panel||busy)return;
 busy=true;nozzle=false;panel.classList.remove('ssg-connected');panel.hidden=false;
 panel.querySelector('#ssg-submit').disabled=true;
 message('Driving to the fuel station…');
 try{
  const state=await rpc('community_streetrod_season_state');
  car=state.garage?.find(x=>x.car_key===state.season?.current_car);
  if(!car)throw Error('Choose a car first.');
  if(car.fuel>=100)throw Error('Your fuel tank is already full.');
  panel.querySelector('#ssg-target').min=car.fuel+1;
  panel.querySelector('#ssg-target').value=100;
  panel.querySelector('#ssg-current-label').textContent='Current tank: '+car.fuel+'%';
  panel.querySelector('#ssg-current').style.width=car.fuel+'%';
  readout();message('Parked. Lift the nozzle to start the gas pump.');
  panel.scrollIntoView?.({block:'nearest'});
 }catch(error){message(String(error.message||'Gas station unavailable'),true);}
 finally{busy=false;}
}
async function submit(){
 if(busy||!nozzle||!car)return;
 busy=true;panel.querySelector('#ssg-submit').disabled=true;message('Fuel is pumping…');
 try{
  const target=Number(panel.querySelector('#ssg-target').value);
  const data=await rpc('community_streetrod_season_pump',{p_target:target,p_nonce:crypto.randomUUID()});
  message(data.message||'Tank refilled. Receipt saved.');
  root.querySelector('[data-ss-action="refresh"]')?.click();
  panel.querySelector('#ssg-current').style.width=target+'%';
  car.fuel=target;nozzle=false;panel.classList.remove('ssg-connected');
  setTimeout(()=>{if(panel)panel.hidden=true;},1200);
 }catch(error){message('Fuel not saved: '+String(error.message||'Try again'),true);panel.querySelector('#ssg-submit').disabled=false;}
 finally{busy=false;}
}
if(cfg?.enabled&&location.pathname.endsWith('community.html')){
 const obs=new MutationObserver(()=>{if(mount())obs.disconnect()});
 obs.observe(document.body,{subtree:true,childList:true});mount();
}
