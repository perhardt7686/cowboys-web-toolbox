/* Cowboy's Commons / Street r0d Multiplayer Racers v1.
 * Show approved member game builds and achievements. Private avatar photos are not shared.
 * All race actions continue through the authoritative original game and RPCs.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const time=n=>n==null?'—':(Number(n)/1000).toFixed(2)+'s';
const initials=n=>String(n||'Racer').trim().split(/\s+/).slice(0,2).map(x=>x.charAt(0)).join('').toUpperCase();
const icons={compass:'◈',spark:'✳',leaf:'❧',hammer:'⚒',bolt:'ϟ',mountain:'△',coffee:'☕',fox:'🦊',planet:'◉',rocket:'🚀',paw:'🐾'};
const badgeNames={first_key:'First Ignition',first_win:'Victory Lane',night_shift:'Night Shift',ten_races:'Road Warrior',fifty_races:'Long Haul',hundred_races:'Road Legend',eleven_second:'Eleven Second Club',street_champion:'Street Champion',rival_slayer:'Rival Slayer',rival_king:'Rival King',collector:'Car Collector',full_build:'Master Mechanic',credit_millionaire:'Garage Tycoon',six_figures:'Six-Figure Racer'};
let client,ui,me,players=[],imageURLs=new Map(),roster=null,latest=0,connecting=false;
const carNames={rattler:'Rattler 48',comet:'Comet 55',nomad:'Nomad 63',meteor:'Meteor 67',phantom:'Phantom X'};
function avatar(p){
 const url=p?.avatar_mode==='photo'?imageURLs.get(p.avatar_path):null;
 const head=url?'<img src="'+safe(url)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':p?.avatar_mode==='icon'?safe(icons[p.avatar_icon]||'◈'):safe(initials(p?.name));
 return '<span class="srm-avatar" aria-hidden="true"><span class="srm-head">'+head+'</span><span class="srm-jacket"></span></span>';
}
function carRow(c){
 const name=carNames[c.key]||String(c.key||'Unidentified').replace(/([a-z])([A-Z])/g,'$1 $2');
 return '<div class="srm-build '+(c.selected?'selected':'')+'"><span class="srm-build-indicator">'+(c.selected?'●':'○')+'</span><div><strong>'+safe(name)+'</strong><small>Engine '+fmt(c.engine)+'/5 · Tires '+fmt(c.tires)+'/5 · Gearbox '+fmt(c.gearbox)+'/5</small></div>'+(c.selected?'<span class="srm-current">DRIVING</span>':'')+'</div>';
}
function racer(p,i){
 const isMe=p.id===me;
 const label=p.selected_car?(carNames[p.selected_car]||String(p.selected_car).replace(/([a-z])([A-Z])/g,'$1 $2')):'No car selected';
 const n=(p.cars||[]).length;
 const badges=(p.badges||[]).map(b=>'<span title="'+safe(badgeNames[b]||b)+'">'+safe(badgeNames[b]||b)+'</span>').join('');
 const card='<article class="srm-player" data-racer="'+safe(p.id)+'"><div class="srm-player-top">'+avatar(p)+'<div class="srm-person"><span class="srm-rank">#'+(i+1)+' · '+(isMe?'YOUR DRIVER':'COMMONS RACER')+'</span><h4>'+safe(p.name)+'</h4><p>'+safe(label)+' · '+n+' owned</p></div>'+(p.playing?'<span class="srm-ontrack">ON TRACK</span>':'')+'</div><div class="srm-player-metrics"><span><small>POINTS</small><b>'+fmt(p.points)+'</b></span><span><small>WINS</small><b>'+fmt(p.wins)+'</b></span><span><small>BEST V2</small><b>'+time(p.best_v2_ms)+'</b></span></div><div class="srm-player-actions">'+(isMe?'<span class="srm-you">This is your garage</span>':'<button class="srm-challenge" type="button" data-sr-action="challenge-target" data-member-id="'+safe(p.id)+'">Challenge '+safe(String(p.name).split(/\s+/)[0])+'</button>')+'</div><details class="srm-details"><summary>View full garage · '+n+' cars · '+(p.badges||[]).length+' awards</summary><h5>Garage builds</h5><div class="srm-builds">'+((p.cars||[]).length?p.cars.map(carRow).join(''):'<p>No cars built yet.</p>')+'</div><h5>Achievements</h5><div class="srm-achievements">'+(badges||'<p>First award still to come.</p>')+'</div><small>Races '+fmt(p.races)+' · Duel wins '+fmt(p.duel_wins)+' · Career best '+time(p.best_ms)+'</small></details></article>';
 return card;
}
function render(){
 if(!ui)return;
 const list=ui.querySelector('#srm-players');if(!list)return;
 const order=[...players].sort((a,b)=>Number(b.points||0)-Number(a.points||0)||(a.name||'').localeCompare(b.name||''));
 list.innerHTML=order.length?order.map(racer).join(''):'<p class="srm-empty">Racer profiles will appear when approved members join the game.</p>';
 ui.querySelector('#srm-count').textContent=order.length+' verified racers · '+order.filter(p=>p.playing).length+' on the track';
 ui.querySelector('#srm-meta').textContent='BUILD RECORDS & ACHIEVEMENTS · ASYNCHRONOUS HEAD-TO-HEAD';
 const inbound=ui.querySelector('#srm-incoming');
 if(inbound){const state=roster||{};const invites=(state.duels||[]).filter(d=>d.target_user===me&&d.status==='open');inbound.textContent=invites.length?invites.length+' direct challenge'+(invites.length===1?'':'s')+' awaiting your race. Use the challenge board below to join.':'Direct invitations appear on the challenge board when a racer calls you out.';}
}
function mount(){
 const inside=document.getElementById('sr-inside');
 if(!inside||ui)return;
 ui=document.createElement('section');ui.id='srm-club';ui.className='srm-club';
 ui.innerHTML='<details open><summary><span><b>RACER CLUB · LIVE GARAGES</b><small id="srm-meta">GARAGE BUILDS & MEMBER ACHIEVEMENTS</small></span><span class="srm-chevron">▾</span></summary><div class="srm-inner"><div class="srm-lead"><div><h3>Meet the drivers. Race their builds.</h3><p>Inspect real member garages, see active cars and every earned achievement, then post a direct challenge. Each driver keeps their Toolbox avatar. Race results and credits are scored by the server.</p></div><button id="srm-refresh" type="button" class="srm-refresh">Refresh drivers</button></div><p class="srm-count" id="srm-count">Looking for approved racers…</p><p id="srm-incoming" class="srm-incoming">Direct challenges appear here.</p><div id="srm-players" class="srm-players"><p class="srm-empty">Loading driver garages…</p></div><p class="srm-disclaimer">Visible to approved Commons players: display name, selected car, upgrades, game statistics, achievements and published profile avatars. Unpublished photos and personal profile information are not disclosed. Head-to-head races are asynchronous and use the existing authoritative racing engine.</p></div></details>';
 const race=inside.querySelector('.sr-race-card');if(race)race.before(ui);else inside.append(ui);
 ui.querySelector('#srm-refresh').addEventListener('click',()=>void refresh(true));
 render();
}
function unmount(){
 if(ui){ui.remove();ui=null;}
 me=null;players=[];roster=null;imageURLs.clear();latest=0;
}
async function refresh(force=false){
 if(!client||!ui||connecting||(!force&&Date.now()-latest<20000))return;
 connecting=true;try{
  const {data:sess}=await client.auth.getSession();
  const uid=sess.session?.user?.id;
  if(!uid){unmount();return;}
  if(me&&me!==uid){players=[];imageURLs.clear();}
  const member=await client.from('community_members').select('status').eq('user_id',uid).maybeSingle();
  if(member.error||member.data?.status!=='approved'){unmount();return;}
  const [show,state]=await Promise.all([client.rpc('community_streetrod_showroom'),client.rpc('community_streetrod_state')]);
  if(show.error)throw show.error;
  me=uid;players=show.data?.drivers||[];roster=state.data||{};
  const paths=[...new Set(players.filter(p=>p.avatar_mode==='photo'&&p.avatar_path).map(p=>p.avatar_path))];
  imageURLs.clear();
  if(paths.length){const signed=await client.storage.from('community-avatars').createSignedUrls(paths,300);
   if(!signed.error)for(const d of signed.data||[])if(d.path&&d.signedUrl)imageURLs.set(d.path,d.signedUrl);}
  latest=Date.now();render();
 }catch(e){
  if(ui)ui.querySelector('#srm-count').textContent='Driver roster unavailable: '+String(e.message||'Retry refresh').slice(0,160);
 }finally{connecting=false;}
}
async function boot(){
 if(!cfg?.enabled||!cfg.supabaseUrl||!cfg.publishableKey||!location.pathname.endsWith('community.html'))return;
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  let scheduled=false;function attach(){
   if(!document.getElementById('sr-inside')||document.getElementById('conversations')?.hidden){if(ui)unmount();return;}
   if(!ui){mount();void refresh(true);}
  }
  const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;attach();});});
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  client.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT')unmount();else if(ui)void refresh(true);});
  setInterval(()=>{if(ui&&!document.hidden)void refresh();},30000);
  window.addEventListener('focus',()=>{if(ui)void refresh(true);});
  attach();
 }catch{}
}
void boot();