/* Cowboy's Commons | Street r0d Garage Phase 1 V3 (original 2.5D workshop)
 * Additive UI. All credits, owned vehicles, levels and tuning remain authoritative in Supabase.
 * No direct writes to protected tables. No scraped assets or original game art.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';

const cfg=window.COWBOY_COMMUNITY_CONFIG;
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const smooth=t=>t*t*(3-2*t);
const fmt=n=>Number(n||0).toLocaleString('en-US');
const throttle=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const catalog={
 rattler:{name:'Rattler 48',type:'coupe',body:'#a45634',highlight:'#dd9871',roof:'#74432f',redline:5000,caption:'Post-war coupe'},
 comet:{name:'Comet 55',type:'hardtop',body:'#1e8792',highlight:'#8bdae0',roof:'#d5dbd5',redline:6100,caption:'Mid-century hardtop'},
 nomad:{name:'Nomad 63',type:'wagon',body:'#536b60',highlight:'#a9c5aa',roof:'#c3b49b',redline:5950,caption:'Long-roof sleeper'},
 meteor:{name:'Meteor 67',type:'muscle',body:'#9d2c37',highlight:'#f26e72',roof:'#652333',redline:6300,caption:'Big-block muscle'},
 phantom:{name:'Phantom X',type:'prostreet',body:'#272c37',highlight:'#aeb4bd',roof:'#151922',redline:7300,caption:'Pro-street flagship'}
};
const serviceText={
 engine:{name:'Intake and engine package',place:'hood',steps:['Ignition off. Open the hood and inspect the engine bay.','Release the old intake mounting points.','Lift the previous assembly from the engine.','Seat the new compatible package.','Secure the assembly and verify connections.','Confirm installation and charge game credits.']},
 tires:{name:'Performance tire set',place:'wheel',steps:['Park safely; position the simulated lift and stands.','Loosen the four wheel mounting positions.','Remove the existing wheel and tire set.','Fit the new tires and check clearance.','Secure wheels and lower the car.','Confirm installation and charge game credits.']},
 gearbox:{name:'Close-ratio gearbox',place:'underbody',steps:['Ignition off. Support the car on the simulated lift.','Disconnect the driveshaft and selector linkages.','Lower the existing gearbox using the service jack.','Align the replacement with the bellhousing.','Secure mounts and verify gear selection.','Confirm installation and charge game credits.']}
};
const UI=`
<div class="srw-header">
 <div><p class="srw-overline">THE WORKSHOP / ENGINEERING BAY 01</p><h3>Bring it into the garage.</h3><p>Drive in, inspect, fit performance components, and save a real race tune.</p></div>
 <span class="srw-mode">ORIGINAL GARAGE SIM • 2.5D</span>
</div>
<div class="srw-scene-frame">
 <canvas id="srw-canvas" width="1152" height="648" role="img" aria-label="Illustrated mechanics workshop where your selected car drives in and can be serviced"></canvas>
 <div class="srw-scene-caption"><span id="srw-phase">OUTSIDE THE GARAGE</span><strong id="srw-car-label">Rattler 48</strong></div>
 <div class="srw-scene-hotspots" id="srw-hotspots" hidden>
  <button type="button" data-srw="hood" class="srw-hotspot srw-hot-hood">Hood & engine</button>
  <button type="button" data-srw="wheel" class="srw-hotspot srw-hot-wheel">Wheels</button>
  <button type="button" data-srw="underbody" class="srw-hotspot srw-hot-trans">Gearbox / lift</button>
 </div>
</div>
<div class="srw-control-bar">
 <button type="button" class="srw-button srw-primary" id="srw-enter" data-srw="enter">Drive into garage</button>
 <button type="button" class="srw-button" id="srw-drive-out" data-srw="leave" hidden>Start & drive out</button>
 <button type="button" class="srw-button" id="srw-hood" data-srw="hood" hidden>Open hood</button>
 <button type="button" class="srw-button" id="srw-tune" data-srw="tune" hidden>Tuning clipboard</button>
 <button type="button" class="srw-button" id="srw-reload" data-srw="refresh">Refresh garage</button>
</div>
<div class="srw-bay-layout">
 <section class="srw-panel"><p class="srw-overline">CAR INSPECTION</p><div id="srw-inspect"></div></section>
 <section class="srw-panel"><p class="srw-overline">SERVICE COUNTER</p><div id="srw-service"></div></section>
</div>
<div id="srw-tuning" class="srw-tuning" hidden></div>
<div id="srw-diagnostics" class="srw-diagnostics" hidden></div>
<p class="srw-status" id="srw-status" role="status" aria-live="polite">Garage ready. Race credits and saved setups come from your Commons profile.</p>
<p class="srw-fineprint">Early playable garage: drive-in animation and illustrated component service are simulated. Engine, tires and gearbox use existing permanent upgrade levels; removed parts are not yet a reusable inventory. Scores and race physics are calculated on the server. No actual purchases or wagering.</p>`;

let client,garage,ui,stage='OUTSIDE',door=0,position=0,hood=0,lift=0,animating=false,working=false,job=null,selected='rattler',view='exterior',draft=null;
let canvas,ctx,loop,loggedIn=false,lastPaint=0;
const activeCar=()=>garage?.cars?.find(c=>c.selected)||garage?.cars?.[0];
const model=()=>{if(catalog[selected])return catalog[selected];const info=garage?.catalog?.find(c=>c.key===selected);const spec=garage?.engineering?.specs?.[selected]||{};const paint=info?.accent||'#596c7a';return {name:info?.name||selected,type:info?.body||'coupe',body:paint,highlight:paint,roof:'#27313a',redline:Number(spec.redline||6250),caption:(info?.year||'Custom')+' · '+(info?.class||'original vehicle')};};
const perCarTune=()=>garage?.engineering?.tunes?.[selected]||{};
const tuningRange=()=>({min:Math.round(model().redline*.65/100)*100,max:model().redline});
const cost=(key,level)=>250+level*250+(key==='engine'?100:key==='gearbox'?50:0);
const say=(message,bad=false)=>{const el=$('srw-status');if(el){el.textContent=message;el.classList.toggle('is-error',bad);}};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,throttle?Math.min(80,ms):ms));
const isParked=()=>stage==='PARKED' && !animating;

function mount(){
 if(ui||!$('streetrod-root')||!$('sr-inside'))return;
 ui=document.createElement('section');ui.id='srw-garage';ui.className='srw-workshop';ui.setAttribute('aria-label','Street r0d workshop');
 ui.innerHTML=UI;
 const inside=$('sr-inside');const raceCard=inside.querySelector('.sr-race-card');
 if(raceCard)raceCard.before(ui);else inside.prepend(ui);
 canvas=$('srw-canvas');ctx=canvas.getContext('2d');
 ui.addEventListener('click',onClick);
 ui.addEventListener('input',e=>{if(e.target.closest('[data-tuning]'))updateTuneReadouts();});
 ui.addEventListener('submit',onSubmit);
 render();drawGarage();
 if(!loop)loop=requestAnimationFrame(paintLoop);
}
function unmount(){if(loop)cancelAnimationFrame(loop);loop=null;ui?.remove();ui=null;stage='OUTSIDE';position=0;door=0;hood=0;lift=0;job=null;loggedIn=false;}
function ensureDraft(){
 const v=perCarTune();const red=model().redline;const range=tuningRange();
 draft={launch_rpm:clamp(Number(v.launch_rpm||Math.round(red*.54/100)*100),1600,red-500),
 final_drive:clamp(Number(v.final_drive||1),.84,1.18),
 tire_pressure:clamp(Number(v.tire_pressure||29),20,42),
 shift_rpm:clamp(Number(v.shift_rpm||Math.round(red*.88/100)*100),range.min,range.max)};
}
function render(){
 if(!ui||!garage)return;
 const car=activeCar();if(car&&!animating&&!job&&selected!==car.key){selected=car.key;ensureDraft();}
 $('srw-car-label').textContent=model().name;
 $('srw-phase').textContent=stage==='OUTSIDE'?'OUTSIDE THE GARAGE':stage==='PARKED'?'ENGINE OFF • BAY SECURED':stage.replaceAll('_',' ');
 $('srw-enter').hidden=stage!=='OUTSIDE';$('srw-drive-out').hidden=stage!=='PARKED';
 $('srw-hood').hidden=stage!=='PARKED';$('srw-hood').textContent=hood?'Close hood':'Open hood';
 $('srw-tune').hidden=stage!=='PARKED';$('srw-hotspots').hidden=stage!=='PARKED';
 ['srw-enter','srw-drive-out','srw-hood','srw-tune'].forEach(id=>$(id).disabled=animating||working||!!job||!!garage.active);
 const levels=['engine','tires','gearbox'].map(k=>`${k[0].toUpperCase()+k.slice(1)} ${car?.[k]||0}/5`).join(' · ');
 $('srw-inspect').innerHTML=`<h4>${esc(model().name)}</h4><p>${esc(model().caption)} · ${levels}</p><div class="srw-stat-grid"><span><small>Garage credits</small><b>${fmt(garage.garage?.credits)} cr</b></span><span><small>Race model</small><b>${esc(garage.engineering?.physics_version||'legacy')}</b></span><span><small>Last trap speed</small><b>${esc(garage.engineering?.latest?.car===selected?garage.engineering?.latest?.telemetry?.trap_mph??'—':'—')} mph</b></span></div><p class="srw-helper">${stage==='PARKED'?'Select a labeled component on the car or the service counter.':'Drive into the bay to unlock tools and tuning.'}</p>`;
 $('srw-service').innerHTML=job?jobPanel():serviceButtons(car);
 if(!$('srw-tuning').hidden)drawTuning();
 const last=garage.engineering?.latest;
 const diag=$('srw-diagnostics');
 if(last&&last.car===selected){diag.hidden=false;diag.innerHTML=`<p class="srw-overline">LATEST ENGINEERED RUN</p><div class="srw-slip"><span><small>ET</small><b>${(Number(last.telemetry?.et_ms||0)/1000).toFixed(2)} s</b></span><span><small>60 FT</small><b>${(Number(last.telemetry?.sixty_ft_ms||0)/1000).toFixed(2)} s</b></span><span><small>TRAP</small><b>${esc(last.telemetry?.trap_mph)} mph</b></span><span><small>TRACTION-LIMITED</small><b>${esc(last.telemetry?.traction_limited_pct)}%</b></span></div>`;}else{diag.hidden=true;diag.innerHTML='';}
}
function serviceButtons(car){return `<h4>Workshop upgrades</h4><div class="srw-part-list">${['engine','tires','gearbox'].map(k=>{
 const lvl=Number(car?.[k]||0),isMax=lvl>=5,c=cost(k,lvl);return `<div class="srw-part"><div><b>${esc(serviceText[k].name)}</b><small>Level ${lvl}/5${!isMax?' · '+fmt(c)+' race credits':''}</small></div><button type="button" data-srw="service" data-kind="${k}" ${!isParked()||isMax||!!garage.active?'disabled':''}>${isMax?'MAXED':'Service'}</button></div>`;
 }).join('')}</div>`;}
function jobPanel(){const s=serviceText[job.kind];const car=activeCar();const lvl=Number(car?.[job.kind]||0);return `<h4>${esc(s.name)} · ${job.step+1} / ${s.steps.length}</h4><div class="srw-progress"><span style="width:${Math.round((job.step+1)/s.steps.length*100)}%"></span></div><p>${esc(s.steps[job.step])}</p><div class="srw-job-actions"><button type="button" data-srw="cancel-service" ${working?'disabled':''}>Cancel without charge</button><button type="button" class="srw-confirm" data-srw="advance-service" ${working?'disabled':''}>${job.step===s.steps.length-1?'Install · '+fmt(cost(job.kind,lvl))+' cr':'Complete step'}</button></div>`;}
async function animate(next,ms=850){if(animating)return;animating=true;const from={door,position,hood,lift};const time=performance.now(),reduced=!!throttle;while(true){const t=reduced?1:clamp((performance.now()-time)/ms,0,1);const eased=smooth(t);for(const [k,v] of Object.entries(next)){
 if(k==='door'||k==='position'||k==='hood'||k==='lift'){
  const newVal=from[k]+(v-from[k])*eased;if(k==='door')door=newVal;if(k==='position')position=newVal;if(k==='hood')hood=newVal;if(k==='lift')lift=newVal;
 }
 }drawGarage();if(t>=1)break;await new Promise(requestAnimationFrame);}animating=false;}
async function enter(){if(stage!=='OUTSIDE'||animating||job||garage.active)return;stage='DOOR_OPENING';render();say('Opening the shop door…');await animate({door:1},750);stage='DRIVE_IN';render();say('Rolling into the service bay…');await animate({position:1},1400);stage='PARK_ALIGN';render();await delay(260);stage='PARKED';view='exterior';render();say('Handbrake on. Engine off. Choose a part or open the tuning clipboard.');}
async function leave(){if(!isParked()||job||working)return;stage='START_ENGINE';hood=0;lift=0;render();say('Hood latched. Starting the engine…');await delay(350);stage='DRIVE_OUT';render();await animate({position:0},1300);await animate({door:0},700);stage='OUTSIDE';view='exterior';render();say('Back on the street. Use the existing Solo Race button to test your build.');}
async function toggleHood(){if(!isParked())return;await animate({hood:hood?0:1},600);view=hood?'hood':'exterior';render();say(hood?'Hood raised. Engine and intake access available.':'Hood securely latched.');}
async function focusPart(where){if(!isParked())return;if(where==='hood'){if(!hood)await animate({hood:1},450);lift=0;view='hood';say('Engine bay inspection: select an intake and engine service job below.');}
 if(where==='wheel'){if(lift)await animate({lift:0},380);view='wheel';say('Inspecting wheel position and tire clearance.');}
 if(where==='underbody'){await animate({lift:1},480);view='underbody';say('Vehicle supported in the virtual workshop. Gearbox service accessible.');}render();}
function startService(kind){if(!isParked()||job||working||garage.active||!serviceText[kind])return;const car=activeCar();const lvl=Number(car?.[kind]||0);if(lvl>=5)return say('That component is fully upgraded.',true);
 if(Number(garage.garage?.credits||0)<cost(kind,lvl))return say('Not enough fictional race credits for this upgrade.',true);
 job={kind,step:0};if(kind==='engine'){hood=1;lift=0;view='hood'}else if(kind==='gearbox'){lift=1;hood=0;view='underbody'}else{lift=.4;hood=0;view='wheel'}render();say('Service initiated. Credits are not charged unless you finish the job.');}
async function advanceService(){if(!job||working)return;const kind=job.kind;const steps=serviceText[kind].steps;if(job.step<steps.length-1){job.step++;render();say('Step verified. Continue when ready.');return;}
 working=true;render();say('Checking car ownership and submitting the upgrade…');try{const {data:before,error:preflight}=await client.rpc('community_streetrod_state');if(preflight)throw preflight;if(before.active||before.cars?.find(c=>c.selected)?.key!==selected)throw new Error('The active car or race changed. Service canceled to protect your garage.');const {data,error}=await client.rpc('community_streetrod_buy',{p_item:kind});if(error)throw error;garage=data;job=null;working=false;view='exterior';hood=0;lift=0;render();say('Component upgrade saved to your garage. Your next race uses the updated car.');}catch(e){working=false;job=null;render();say(e.message||'Service could not be committed. Check your garage before retrying.',true);}}
function cancelService(){if(working||!job)return;job=null;hood=0;lift=0;view='exterior';render();say('Service canceled before purchase. Existing vehicle unchanged.');}
function openTune(){if(!isParked()||job)return;ensureDraft();$('srw-tuning').hidden=false;drawTuning();$('srw-tuning').scrollIntoView({block:'nearest',behavior:throttle?'instant':'smooth'});say('Setup clipboard opened. Changes are saved only when you press Save Setup.');}
function drawTuning(){if(!draft)ensureDraft();const v=draft,limit=tuningRange();$('srw-tuning').innerHTML=`<form id="srw-tune-form"><div class="srw-tune-head"><div><p class="srw-overline">CHASSIS DYNO / SETUP CLIPBOARD</p><h4>Setup: ${esc(model().name)}</h4><p>Adjust your modeled tune. The server calculates actual race performance.</p></div><button type="button" data-srw="close-tune">Close</button></div><div class="srw-sliders">
  <label>Launch RPM <output id="srw-show-launch">${v.launch_rpm} rpm</output><input type="range" min="1600" max="${model().redline-500}" step="100" name="launch_rpm" value="${v.launch_rpm}" data-tuning></label>
  <label>Final-drive multiplier <output id="srw-show-drive">${v.final_drive.toFixed(2)}×</output><input type="range" min="0.84" max="1.18" step="0.01" name="final_drive" value="${v.final_drive}" data-tuning></label>
  <label>Cold tire pressure <output id="srw-show-psi">${v.tire_pressure} psi</output><input type="range" min="20" max="42" step="1" name="tire_pressure" value="${v.tire_pressure}" data-tuning></label>
  <label>Shift target RPM <output id="srw-show-shift">${v.shift_rpm} rpm</output><input type="range" min="${limit.min}" max="${limit.max}" step="100" name="shift_rpm" value="${v.shift_rpm}" data-tuning></label>
 </div><div class="srw-tune-foot"><p>Short final drive = stronger wheel torque, lower speed per gear. Traction is not guaranteed. Shift target is stored as a setup preference; shift timing remains manual in this game build.</p><button class="srw-button srw-primary" type="submit" ${working?'disabled':''}>Save this tune</button></div></form>`;}
function updateTuneReadouts(){const f=$('srw-tune-form');if(!f)return;$('srw-show-launch').textContent=f.elements.launch_rpm.value+' rpm';$('srw-show-drive').textContent=Number(f.elements.final_drive.value).toFixed(2)+'×';$('srw-show-psi').textContent=f.elements.tire_pressure.value+' psi';$('srw-show-shift').textContent=f.elements.shift_rpm.value+' rpm';}
async function onSubmit(event){if(event.target?.id!=='srw-tune-form')return;event.preventDefault();if(working||!isParked()||job)return;const f=event.target;working=true;const values={launch_rpm:parseInt(f.elements.launch_rpm.value,10),final_drive:Number(f.elements.final_drive.value),tire_pressure:Number(f.elements.tire_pressure.value),shift_rpm:parseInt(f.elements.shift_rpm.value,10)};
 say('Saving your race setup…');try{const {data,error}=await client.rpc('community_streetrod_tune',{p_car:selected,p_launch_rpm:values.launch_rpm,p_final_drive:values.final_drive,p_tire_pressure:values.tire_pressure,p_shift_rpm:values.shift_rpm});if(error)throw error;garage=data;draft=values;say('Setup saved to your Commons garage.');}catch(e){say(e.message||'Unable to save setup.',true);}finally{working=false;render();}}
async function refresh(){if(!client||working||job)return;try{const {data,error}=await client.rpc('community_streetrod_state');if(error)throw error;garage=data;selected=activeCar()?.key||'rattler';ensureDraft();render();say('Garage records refreshed.');}catch(e){say(e.message||'Garage refresh unavailable.',true)}}
function onClick(e){const b=e.target.closest('[data-srw]');if(!b||b.disabled)return;const k=b.dataset.srw;switch(k){case 'enter':void enter();break;case 'leave':void leave();break;case 'hood':void toggleHood();break;case 'wheel':void focusPart('wheel');break;case 'underbody':void focusPart('underbody');break;case 'tune':openTune();break;case 'close-tune':$('srw-tuning').hidden=true;break;case 'service':startService(b.dataset.kind);break;case 'advance-service':void advanceService();break;case 'cancel-service':cancelService();break;case 'refresh':void refresh();break;}}
function paintLoop(t){if(ui&&canvas&&!document.hidden&&!$('sr-inside')?.hidden && t-lastPaint>(animating?33:650)){drawGarage();lastPaint=t;}loop=requestAnimationFrame(paintLoop)}

function ellipse(cx,cy,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function linear(x0,y0,x1,y1,stops){const g=ctx.createLinearGradient(x0,y0,x1,y1);for(const [s,c] of stops)g.addColorStop(s,c);return g;}
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function polygon(points,fill,stroke,width=2){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}}
function drawGarage(){if(!ctx)return;const w=1152,h=648;ctx.clearRect(0,0,w,h);
 const ceiling=linear(0,0,0,420,[[0,'#13191c'],[.4,'#2b3031'],[1,'#4b4843']]);ctx.fillStyle=ceiling;ctx.fillRect(0,0,w,435);
 ctx.fillStyle='#343b3b';ctx.fillRect(30,78,1090,342);ctx.fillStyle='#252c2b';ctx.fillRect(54,92,1044,312);
 for(let yy=112;yy<411;yy+=21){line(55,yy,1096,yy,'#424541',1);for(let xx=60+((yy/21|0)%2)*30;xx<1096;xx+=60)line(xx,yy,xx,yy+19,'#3e413e',1);}
 // Structural steel and garage signage
 for(const x of [46,1107]){ctx.fillStyle='#141c22';ctx.fillRect(x-14,55,26,428);line(x-8,60,x-8,471,'#8a8680',3);}
 ctx.fillStyle='#151c20';ctx.fillRect(33,30,1084,30);line(45,37,1107,37,'#8d8b82',2);
 // Roof fixtures and dramatic light pools
 for(const x of [280,835]){ctx.fillStyle='#141a1b';ctx.fillRect(x-82,57,164,22);ctx.fillStyle='#ecdfbf';ctx.shadowColor='#ffe2a3';ctx.shadowBlur=32;ctx.fillRect(x-64,77,128,8);ctx.shadowBlur=0;const glow=ctx.createRadialGradient(x,260,40,x,280,350);glow.addColorStop(0,'#fff5c71d');glow.addColorStop(1,'#f8cf8800');ctx.fillStyle=glow;ctx.fillRect(x-360,80,720,560);}
 // Wall equipment and cabinets
 roundRect(70,236,153,174,7,'#422f31','#806a62');roundRect(82,252,130,32,3,'#34272a','#b9a08c');roundRect(82,292,130,32,3,'#34272a','#b9a08c');roundRect(82,332,130,63,3,'#34272a','#b9a08c');
 for(const yy of [265,305,351,378])line(132,yy,160,yy,'#c1af91',3);
 roundRect(901,194,173,154,5,'#373c3e','#898e8a');for(let i=0;i<4;i++)line(909,225+i*30,1064,225+i*30,'#787e80',4);
 for(let i=0;i<7;i++){const x=916+i*21;line(x,238,x+4,261,'#c1bb9b',4);ellipse(x+5,263,4,4,'#ad9b7b')}
 ctx.fillStyle='#171b1d';ctx.fillRect(286,177,155,123);ctx.fillStyle='#bb6c54';ctx.font='900 28px system-ui';ctx.fillText('IRON BAY',306,223);ctx.fillStyle='#e4c99a';ctx.font='700 12px system-ui';ctx.fillText('MOTOR WORKS • NO. 01',309,248);
 // Deep workshop floor perspective
 polygon([[0,420],[1152,420],[1152,648],[0,648]],linear(0,410,0,648,[[0,'#484745'],[.42,'#34393b'],[1,'#20282b']]));
 for(let k=0;k<=12;k++){let x=k*96;line(576,423,x-120,648,'#73746e2b',1);}
 for(let y of [466,526,605])line(5,y,1147,y,'#9e98852a',2);
 polygon([[342,456],[819,456],[968,613],[181,613]],'#23282975','#b4a78250');
 line(421,472,376,615,'#c4ae5b',5);line(745,472,779,615,'#c4ae5b',5);
 // Tool cart, trolley jack and mechanic props
 roundRect(958,399,133,112,8,'#892f39','#ce7d6c');for(let yy of [417,447,477]){line(978,yy,1074,yy,'#442a2b',7);line(1003,yy+6,1044,yy+6,'#c9baa4',3)}ellipse(984,518,13,13,'#111a1c');ellipse(1064,518,13,13,'#111a1c');
 roundRect(55,483,126,20,5,'#c9923e','#796b4b');ellipse(79,509,14,13,'#101516');ellipse(155,509,14,13,'#101516');
 // Door is open when player is in bay; foreground framing emphasizes movement
 const lowered=(1-door)*330;ctx.fillStyle='#272f34';ctx.fillRect(214,82+(-330+lowered),727,330);
 for(let i=0;i<7;i++){let yy=82+(-330+lowered)+i*46;line(219,yy,937,yy,'#778080',3);line(219,yy+4,937,yy+4,'#171f21',2);}
 if(door<.999){ctx.fillStyle='#d2b789';ctx.font='800 20px system-ui';ctx.fillText('GARAGE ENTRANCE',476,155+(-330+lowered));}
 // Car movement: at first positioned outside left of the opening, then centered in bay.
 const cx=-320+890*position;const cy=477-18*lift;drawCar(cx,cy);
 // Transparent atmosphere
 ctx.fillStyle=linear(0,440,0,648,[[0,'#f2d7aa0a'],[1,'#00000000']]);ctx.fillRect(0,440,w,208);
 // Bottom subtle vignette
 const vignette=ctx.createRadialGradient(576,330,270,576,330,760);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#05091199');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
 if(view==='hood'&&position>.95){drawDetail('ENGINE & INTAKE', 'PRESS SERVICE TO INSTALL UPGRADE',300,90)}
 if(view==='wheel'&&position>.95){drawDetail('WHEEL & TIRE BAY','CHECK SIDEWALL / CLEARANCE',300,90)}
 if(view==='underbody'&&position>.95){drawDetail('UNDERBODY SUPPORT','VIRTUAL LIFT ENGAGED',300,90)}
}
function drawDetail(title,subtitle,x,y){roundRect(x,y,550,68,10,'#111a1ddd','#daa96f');ctx.fillStyle='#ffe4aa';ctx.font='900 22px system-ui';ctx.fillText(title,x+23,y+29);ctx.fillStyle='#cdd1cb';ctx.font='600 13px system-ui';ctx.fillText(subtitle,x+23,y+52);}
function drawCar(x,y){ctx.save();ctx.translate(x,y);const c=model();const typ=c.type;const owned=activeCar();const tireLvl=Number(owned?.tires||0);const engLvl=Number(owned?.engine||0);
 const rear=-192,front=209,R=43+Math.min(10,tireLvl*2);ellipse(25,40,329,30,'#080b10ab');
 // Tire undercarriage and cast shadow
 polygon([[-285,4],[265,-4],[281,24],[-292,24]],'#121719');
 // Body shell original model geometry
 let top=typ==='van'?-153:typ==='truck'?-124:typ==='wagon'?-118:typ==='prostreet'?-83:-107;
 let hoodStart=typ==='coupe'?35:typ==='muscle'?70:typ==='wagon'?74:32;
 let roofFront=typ==='van'?173:typ==='truck'?45:typ==='coupe'?56:typ==='wagon'?134:typ==='muscle'?108:typ==='prostreet'?122:108;
 let roofBack=typ==='van'?-248:typ==='truck'?-112:typ==='wagon'?-242:typ==='muscle'?-114:typ==='hardtop'?-154:-165;
 if(typ==='prostreet')top=-82;
 const bodyGrad=linear(-200,-100,180,55,[[0,c.highlight],[.18,c.body],[.63,c.body],[1,'#131b22']]);
 polygon([[-302,-21],[-280,-63],[roofBack-31,-73],[roofBack,top-12],[roofFront-54,top-12],[roofFront,typ==='prostreet'?-60:-71],[250,-53],[286,-39],[304,-10],[292,26],[-298,26]],bodyGrad,'#171b1e',5);
 // Roof and cabin
 const roofGrad=linear(0,top-17,0,-54,[[0,c.roof],[1,c.highlight]]);
 polygon([[roofBack-31,-73],[roofBack,top-13],[roofFront-54,top-13],[roofFront,-71]],roofGrad,'#18242a',4);
 const glass=linear(-80,top,85,-64,[[0,'#7494a3'],[.4,'#233842'],[1,'#0c202b']]);
 polygon([[roofBack+9,top-2],[roofFront-68,top-1],[roofFront-29,-75],[roofBack-30,-75]],glass,'#c2d0c7',3);
 // Cabin B-pillars and rear window details
 if(typ==='wagon'||typ==='van'){line(-98,top,-89,-73,'#d0c9ae',8);line(35,top,43,-73,'#d0c9ae',9)}
 else{line(-38,top,-26,-74,'#c2bdaf',8)}
 // Reflection streaks, body character line and chrome
 ctx.strokeStyle='#ffffff70';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-245,-46);ctx.lineTo(251,-40);ctx.stroke();
 ctx.strokeStyle='#151518aa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-278,-7);ctx.lineTo(283,-1);ctx.stroke();
 line(-262,-26,270,-24,'#cbbba476',2);line(-286,22,292,22,'#e8d5bb',4);
 // Hood geometry and open bay
 if(hood>.05){
  roundRect(100,-60,157,48,4,'#0e1519','#bd8f68');for(let i=0;i<4;i++)roundRect(114+i*33,-49,21,23,2,'#6c7677','#aaaa99');
  ctx.save();ctx.translate(112,-72);ctx.rotate(-hood*.78);polygon([[0,0],[167,8],[171,19],[0,16]],linear(0,0,0,35,[[0,c.highlight],[1,c.body]]),'#171b1e',4);ctx.restore();
  ctx.fillStyle='#d6aa79';ctx.font='900 11px system-ui';ctx.fillText('ENGINE',158,-19);
 }else{
  polygon([[104,-73],[258,-56],[282,-36],[110,-44]],linear(0,-75,10,-35,[[0,c.highlight],[1,c.body]]),'#161e20',3);
 }
 // Body details per silhouette
 if(typ==='prostreet'){polygon([[-280,6],[-250,-16],[-232,-12],[-239,12]],'#1e2328');ctx.fillStyle='#ded7bf';ctx.fillRect(260,-30,30,11)}
 else if(typ==='wagon'){line(-270,-38,-246,-38,'#d2c8a8',4);line(-248,-56,110,-56,'#dbc99a',3)}
 else if(typ==='muscle'){polygon([[97,-61],[239,-50],[239,-41],[97,-49]],'#27262a');line(-264,-9,264,-9,'#e8ae7999',3)}
 else if(typ==='hardtop'){line(-264,-13,263,-13,'#f4e2d3',7);line(-273,-20,-196,-20,'#f6e5ce',3)}
 else{polygon([[-264,-56],[-233,-61],[-221,-48],[-256,-40]],'#bfbfb2');}
 // Door handle and wheel arch visual; rear and front wheels
 roundRect(-24,-47,39,5,2,'#cbd2c9');
 for(const xx of [rear,front]){
  ellipse(xx,17,R+9,R+7,'#171d21');ellipse(xx,17,R+1,R+1,'#080d11');
  ellipse(xx,17,R-13,R-13,'#b6bdba');ellipse(xx,17,R-18,R-18,'#5d6870');
  for(let j=0;j<6;j++){const a=j*Math.PI/3;line(xx+Math.sin(a)*8,17+Math.cos(a)*8,xx+Math.sin(a)*(R-16),17+Math.cos(a)*(R-16),'#c3ccd0',6);}
  ellipse(xx,17,11,11,'#34393a');ellipse(xx,17,5,5,'#dfd4bd');
 }
 // Headlamp reflections; bumper and tail lamp
 ellipse(282,-37,13,7,'#f1e2b6');ellipse(282,-37,5,4,'#fff9ce');ctx.fillStyle='#e9e3b2';ctx.fillRect(294,-26,9,16);ctx.fillStyle='#c35049';ctx.fillRect(-296,-25,10,13);
 line(295,9,317,9,'#b8b9b2',8);line(-302,12,-317,12,'#b9b2a8',7);
 if(engLvl>=2){line(117,-62,226,-50,'#e9c48a',5);line(118,-57,227,-45,'#12151d',3)}
 if(lift>.01){ctx.fillStyle='#8d744b';ctx.fillRect(-240,62,25,80);ctx.fillRect(213,62,25,80);line(-240,146,245,146,'#aa8a4c',11);}
 ctx.restore();}

async function initialize(){if(!cfg?.enabled||!cfg?.supabaseUrl||!cfg?.publishableKey)return;
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  let refreshPending=false;
  const connect=async()=>{
   if(refreshPending)return;refreshPending=true;
   try{
    if(!$('streetrod-root')||$('conversations')?.hidden){if(ui)unmount();return;}
    const {data:{session:auth}}=await client.auth.getSession();if(!auth?.user){if(ui)unmount();return;}
    if(!loggedIn){
     const {data:member,error:e}=await client.from('community_members').select('status').eq('user_id',auth.user.id).maybeSingle();
     if(e||member?.status!=='approved')return;
     const {data,error}=await client.rpc('community_streetrod_state');if(error)throw error;
     garage=data;selected=activeCar()?.key||'rattler';ensureDraft();loggedIn=true;mount();render();
    }else if(!ui)mount();
   }catch(err){if(ui)say(err?.message||'Garage unavailable.',true);}finally{refreshPending=false;}
  };
  const obs=new MutationObserver(()=>{if(!$('streetrod-root')||$('conversations')?.hidden){if(ui)unmount();return;}if(!ui)void connect();});
  obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  client.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT')unmount();void connect();});
  window.addEventListener('focus',()=>{if(ui&&!job&&!working)void refresh();});
  setInterval(()=>{if(ui&&!document.hidden&&!job&&!working&&!animating)void refresh();},45000);
  void connect();
 }catch{/* Existing race game is unaffected if the optional garage cannot start. */}
}
void initialize();