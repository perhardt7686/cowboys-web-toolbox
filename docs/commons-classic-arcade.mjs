/* Private local-media Family Arcade. Commercial files never enter Git or Supabase.
 * All shared scores are explicitly member-reported, NOT replay verified.
 */
import {CLASSIC_TITLES,classicById,acceptClassicFile,classicProgress} from './classic-arcade-catalog.mjs?v=classic1';
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const board=document.getElementById('conversations');
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const $=id=>document.getElementById(id);
const roots=new Map(),reports=new Map(),members=new Map();
let client=null,user=null,mounted=false,generation=0;
let player=null,holding=new Map(),localBest={},sessions={},skins={};
let pendingRequest=null;
const e=(name,cls,text)=>{const n=document.createElement(name);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
function status(g,text){const n=roots.get(g)?.querySelector('.classic-status');if(n)n.textContent=text;}
function localKey(type){return 'cowboy-classic-'+type+'-v1:'+user;}
function loadLocal(){
 const load=type=>{try{const o=JSON.parse(localStorage.getItem(localKey(type))||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch{return {};}};
 localBest=load('bests');sessions=load('sessions');skins=load('skins');
}
function saveLocal(type,obj){try{localStorage.setItem(localKey(type),JSON.stringify(obj));}catch{}}
function labelButton(g){const b=e('button','classic-launch');b.type='button';b.id='classic-'+g.id+'-toggle';
 b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','classic-'+g.id+'-inside');
 b.append(e('span','classic-symbol',({galaga:'✦',pacman:'◉',centipede:'◆',topgear:'▰'})[g.id]),
  e('span','classic-launch-copy'),e('span','classic-enter','ENTER ▶'));
 b.querySelector('.classic-launch-copy').append(e('strong','',g.name),e('small','',g.platform+' · PRIVATE FILE'));
 b.addEventListener('click',()=>toggle(g.id));return b;
}
function buildGame(g){
 const root=e('section','classic-root');root.id='classic-'+g.id+'-root';root.dataset.classicGame=g.id;
 root.append(labelButton(g));
 const inside=e('div','classic-inside');inside.id='classic-'+g.id+'-inside';inside.hidden=true;
 const head=e('div','classic-head');head.append(e('h2','',g.name),e('p','',g.platform));
 const nav=e('nav','classic-tabs');nav.setAttribute('aria-label',g.name+' sections');
 for(const [scene,label] of [['play','PLAY'],['achievements','ACHIEVEMENTS'],['scores','FAMILY SCORES']]){
  const b=e('button','',label);b.type='button';b.dataset.classicScene=scene;b.addEventListener('click',()=>renderScene(g.id,scene));nav.append(b);
 }
 const play=e('section','classic-pane');play.dataset.classicPane='play';
 play.append(e('p','classic-info','Choose your own authorized game file. The archive stays on this device and is not uploaded to the Family Board.'));
 const runner=e('div','classic-runner');
 const fileLabel=e('label','classic-file-label','CHOOSE LOCAL GAME FILE');
 const file=e('input');file.type='file';file.accept=g.accept.join(',');file.dataset.classicFile=g.id;
 file.setAttribute('aria-label','Choose your '+g.name+' game file');
 fileLabel.append(file);runner.append(fileLabel);
 const fileHelp=e('p','classic-file-help',g.hint);runner.append(fileHelp);
 const screen=e('div','classic-screen');screen.dataset.classicScreen=g.id;
 screen.append(e('div','classic-screen-idle',g.core?'Load a game file to prepare the emulator.':'MSX CASSETTE EMULATOR: COMPATIBILITY PENDING'));
 play.append(runner,screen);
 const controls=e('div','classic-control-deck');controls.setAttribute('role','group');controls.setAttribute('aria-label',g.name+' arcade controller');
 const stick=e('div','classic-stick');
 for(const c of g.controls.filter(c=>['left','right','up','down'].includes(c.id)))stick.append(control(g,c));
 const keys=e('div','classic-keys');
 for(const c of g.controls.filter(c=>!['left','right','up','down'].includes(c.id)))keys.append(control(g,c));
 controls.append(stick,keys);play.append(controls);
 const commands=e('div','classic-commands');
 const stop=e('button','classic-stop','LEAVE GAME');stop.type='button';stop.addEventListener('click',()=>stopPlayer());commands.append(stop);
 play.append(commands);
 const achievements=e('section','classic-pane');achievements.dataset.classicPane='achievements';achievements.hidden=true;
 achievements.append(e('h3','',g.name+' · local goals'),e('p','classic-warning','Personal progress is self-reported and stored on this device. These are not official Family Board avatar rewards.'));
 const badges=e('div','classic-badges');badges.dataset.classicBadges=g.id;achievements.append(badges);
 const skinsArea=e('div','classic-skins');skinsArea.dataset.classicSkins=g.id;achievements.append(skinsArea);
 const scores=e('section','classic-pane');scores.dataset.classicPane='scores';scores.hidden=true;
 scores.append(e('h3','',g.name+' · family scoreboard'),e('p','classic-warning','UNVERIFIED / MEMBER-REPORTED. There is no emulator replay validation. These results do not grant official trophies or shared avatar items.'));
 const form=e('form','classic-score-form');const inp=e('input');inp.type='number';inp.min='1';inp.max='99999999';inp.step='1';inp.required=true;
 inp.setAttribute('aria-label','Game score displayed in '+g.name);inp.placeholder='Enter score from your game';
 const submit=e('button','classic-report','REPORT SCORE');submit.type='submit';
 form.append(inp,submit);form.addEventListener('submit',ev=>{ev.preventDefault();void reportScore(g.id,inp);});scores.append(form);
 const list=e('div','classic-score-list');list.dataset.classicScores=g.id;scores.append(list);
 const archive=e('details','classic-legacy');archive.hidden=g.id!=='galaga';
 if(g.id==='galaga'){archive.append(e('summary','','Historical original games (archived)'),e('p','classic-legacy-values','Old Star Squadron and Mystery Maze records are preserved in their original tables.'));scores.append(archive);}
 const feedback=e('p','classic-status',g.core?'Select a private game file to begin.':'MSX cassette core not yet confirmed; launch disabled.');feedback.setAttribute('role','status');
 inside.append(head,nav,play,achievements,scores,feedback);root.append(inside);roots.set(g.id,root);
 return root;
}
function control(g,c){
 const wrap=e('div','classic-key-station');
 const button=e('button','classic-key '+(['left','right','up','down'].includes(c.id)?'classic-direction':'classic-action'),c.symbol);
 button.type='button';button.dataset.classicControl=c.id;button.dataset.classicGame=g.id;
 button.setAttribute('aria-label',c.label);button.setAttribute('aria-describedby','classic-'+g.id+'-'+c.id+'-label');
 if(!g.core)button.disabled=true;
 button.style.touchAction='none';
 button.addEventListener('pointerdown',ev=>{
  if(!player||player.game!==g.id)return;
  ev.preventDefault();button.setPointerCapture?.(ev.pointerId);press(c.index);button.classList.add('pressed');
 });
 button.addEventListener('click',ev=>{if(ev.detail===0){press(c.index);setTimeout(()=>release(c.index),110);}});
 for(const name of ['pointerup','lostpointercapture'])button.addEventListener(name,()=>{
  button.classList.remove('pressed');release(c.index,true);
 });
 for(const name of ['pointercancel','pointerleave'])button.addEventListener(name,()=>{
  button.classList.remove('pressed');release(c.index,false);
 });
 const caption=e('span','classic-key-caption',c.label);caption.id='classic-'+g.id+'-'+c.id+'-label';
 wrap.append(button,caption,e('small','classic-key-hint',c.key));
 return wrap;
}
function press(index){
 if(!player)return;
 const old=holding.get(index);
 if(old?.timer)clearTimeout(old.timer);
 holding.set(index,{time:performance.now()});
 messagePlayer('classic-input',{index,down:true});
}
function release(index,grace){
 if(!player)return;
 const v=holding.get(index);if(!v)return;
 const delay=grace?Math.max(0,100-(performance.now()-v.time)):0;
 if(delay>0){v.timer=setTimeout(()=>release(index,false),delay);return;}
 if(v.timer)clearTimeout(v.timer);
 holding.delete(index);messagePlayer('classic-input',{index,down:false});
}
function releaseAll(){
 for(const [index,v] of holding){if(v.timer)clearTimeout(v.timer);messagePlayer('classic-input',{index,down:false});}
 holding.clear();document.querySelectorAll('.classic-key.pressed').forEach(b=>b.classList.remove('pressed'));
 if(player)messagePlayer('classic-release');
}
function messagePlayer(type,more={}){
 if(!player?.iframe?.contentWindow)return;
 player.iframe.contentWindow.postMessage({type,token:player.token,...more},'*');
}
function stopPlayer(){
 releaseAll();
 if(player){player.iframe.remove();player=null;}
 document.querySelectorAll('.classic-screen').forEach(x=>{
  x.replaceChildren(e('div','classic-screen-idle','Load a local file to start or restart this game.'));
 });
}
function createToken(){
 const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
async function launchFile(g,file){
 if(!g?.core){status(g.id,'Not available: compatible MSX cassette boot has not been verified.');return;}
 if(!acceptClassicFile(g,file)){status(g.id,'Please select a supported '+g.platform+' file under 25 MB.');return;}
 stopPlayer();
 const bytes=await file.arrayBuffer();
 const frame=e('iframe','classic-frame');frame.title=g.name+' isolated emulator';
 frame.sandbox='allow-scripts allow-pointer-lock allow-downloads';frame.setAttribute('referrerpolicy','no-referrer');
 frame.src='classic-arcade-player.html';
 const screen=roots.get(g.id).querySelector('.classic-screen');
 screen.replaceChildren(frame);
 player={game:g.id,iframe:frame,bytes,token:createToken(),user};
 status(g.id,'Preparing private emulator. Loading scripts does not upload game files.');
}
function onPlayerMessage(event){
 if(!player||event.source!==player.iframe.contentWindow)return;
 const data=event.data;if(!data||typeof data!=='object')return;
 if(data.type==='classic-player-hello'){
  if(!player.bytes)return;
  const buffer=player.bytes;player.bytes=null;
  player.iframe.contentWindow.postMessage({type:'classic-init',game:player.game,
   core:classicById(player.game).core,token:player.token,bytes:buffer},'*',[buffer]);
  return;
 }
 if(data.token!==player.token)return;
 if(data.type==='classic-player-status')status(player.game,String(data.message||'').slice(0,240));
 if(data.type==='classic-player-started'&&!player.counted){
  player.counted=true;
  const g=player.game;sessions[g]=(Number(sessions[g])||0)+1;
  saveLocal('sessions',sessions);renderGoals(g);
 }
 if(data.type==='classic-player-error')status(player.game,'Emulator error: '+String(data.message||'unknown').slice(0,200));
}
function toggle(id){
 const root=roots.get(id);if(!root)return;const pane=root.querySelector('.classic-inside');
 const opening=pane.hidden;
 if(!opening&&player?.game===id)stopPlayer();
 pane.hidden=!opening;root.querySelector('.classic-launch').setAttribute('aria-expanded',String(opening));
 if(opening){renderScene(id,'play');void refreshScores();}
}
function renderScene(id,next){
 const root=roots.get(id);if(!root)return;
 for(const p of root.querySelectorAll('.classic-pane'))p.hidden=p.dataset.classicPane!==next;
 for(const b of root.querySelectorAll('[data-classic-scene]'))b.setAttribute('aria-current',String(b.dataset.classicScene===next));
 if(next!=='play'&&player?.game===id)stopPlayer();
 if(next==='achievements')renderGoals(id);
 if(next==='scores')void refreshScores();
}
function renderGoals(id){
 const g=classicById(id),host=roots.get(id)?.querySelector('[data-classic-badges]');
 if(!host)return;
 host.replaceChildren();
 const best=Number(localBest[id]||0),attempts=Number(sessions[id]||0);
 for(const item of classicProgress(g,best,attempts)){
  const badge=e('div','classic-badge '+(item.achieved?'is-earned':'is-locked'));
  badge.append(e('strong','',item.achieved?'✦ '+item.title:'◇ '+item.title),e('small','',item.description));
  host.append(badge);
 }
 const skinsHost=roots.get(id)?.querySelector('[data-classic-skins]');
 if(!skinsHost)return;skinsHost.replaceChildren(e('h4','','Unlockable cabinet themes · this device'));
 for(const [theme,title,need] of [['default','Classic cabinet',0],['aurora','Aurora cabinet',1000],['gold','Gold cabinet',10000]]){
  const unlocked=best>=need;
  const b=e('button','classic-skin-button',title+(unlocked?'':' · Locked at reported '+need));
  b.type='button';b.disabled=!unlocked;b.setAttribute('aria-pressed',String((skins[id]||'default')===theme));
  b.addEventListener('click',()=>{skins[id]=theme;saveLocal('skins',skins);roots.get(id).dataset.skin=theme;renderGoals(id);});
  skinsHost.append(b);
 }
 roots.get(id).dataset.skin=skins[id]||'default';
}
async function refreshScores(){
 if(!client||!mounted||!user)return;const epoch=++generation,owner=user;
 try{
  const [r,p,legacy]=await Promise.all([
   client.from('community_classic_reports').select('user_id,game,points,created_at').order('points',{ascending:false}).limit(400),
   client.from('community_profiles').select('user_id,display_name').eq('published',true).eq('account_active',true),
   client.rpc('community_retro_state')
  ]);
  if(epoch!==generation||user!==owner)return;
  if(r.error)throw Error('Family reporting not ready: '+r.error.message);
  members.clear();for(const m of p.data||[])members.set(m.user_id,m.display_name);
  reports.clear();
  for(const x of r.data||[]){
   if(!reports.has(x.game))reports.set(x.game,[]);
   const arr=reports.get(x.game);
   if(!arr.some(y=>y.user_id===x.user_id))arr.push(x);
  }
  for(const g of CLASSIC_TITLES)paintReports(g.id);
  if(!legacy.error){
   const old=legacy.data;const line=roots.get('galaga')?.querySelector('.classic-legacy-values');
   if(line){
    const rows=(old.mine||[]).filter(x=>x.game==='fleet'||x.game==='maze');
    line.textContent=rows.map(x=>(x.game==='fleet'?'Star Squadron':'Mystery Maze')+
     ': '+Number(x.best||0).toLocaleString()+' verified points').join(' · ')||'Historic original-game records remain stored under their original IDs.';
   }
  }
 }catch(error){for(const g of CLASSIC_TITLES)paintReports(g.id,error.message);}
}
function paintReports(id,error){
 const root=roots.get(id);if(!root)return;const host=root.querySelector('[data-classic-scores]');
 if(!host)return;host.replaceChildren();
 if(error){host.append(e('p','classic-score-note',error));return;}
 const rows=reports.get(id)||[];
 if(!rows.length){host.append(e('p','classic-score-note','No member-reported scores yet.'));return;}
 rows.slice(0,12).forEach((score,i)=>{
  const display=score.user_id===user?'You':members.get(score.user_id)||'Family player';
  const row=e('div','classic-score-row');
  row.append(e('strong','',String(i+1)+'. '+display),e('span','',Number(score.points).toLocaleString()+' pts · UNVERIFIED'));
  host.append(row);
 });
}
async function reportScore(id,input){
 const raw=Number(input.value);
 if(!Number.isSafeInteger(raw)||raw<1||raw>99999999){status(id,'Enter an integer score between 1 and 99,999,999.');return;}
 const g=classicById(id),root=roots.get(id),button=root?.querySelector('.classic-report');
 if(!g||!client||!user)return;
 button.disabled=true;status(id,'Saving your self-reported score (NOT verified)…');
 const owner=user;
 try{
  const {error}=await client.from('community_classic_reports').insert({user_id:owner,game:id,points:raw});
  if(error)throw Error(error.message);
  if(owner!==user)return;
  localBest[id]=Math.max(Number(localBest[id]||0),raw);saveLocal('bests',localBest);
  input.value='';status(id,'Self-reported score saved. It is not emulator verified.');
  renderGoals(id);await refreshScores();
 }catch(error){status(id,'Score not saved: '+error.message);}
 finally{button.disabled=false;}
}
function syncArcade(){
 if(!mounted)return;
 const selected=document.body.classList.contains('arcade-on')?document.body.dataset.arcadeGame:null;
 for(const g of CLASSIC_TITLES){
  const root=roots.get(g.id);if(!root)return;
  if(selected===g.id){
   const inside=root.querySelector('.classic-inside');inside.hidden=false;
   root.querySelector('.classic-launch').setAttribute('aria-expanded','true');
   const scene=document.body.dataset.arcadeScene||'play';
   const shown=root.querySelector('.classic-pane:not([hidden])')?.dataset.classicPane;
   if(scene!==shown)renderScene(g.id,['play','scores','achievements'].includes(scene)?scene:'play');
  }
 }
 if(player&&selected!==player.game)stopPlayer();
}
async function verify(){
 if(!client||!board||board.hidden){if(mounted)unmount();return;}
 const {data:{session}}=await client.auth.getSession();const uid=session?.user?.id;
 if(!uid){unmount();return;}
 const {data:membership,error}=await client.from('community_members').select('status').eq('user_id',uid).maybeSingle();
 if(error||membership?.status!=='approved'){unmount();return;}
 if(mounted&&user===uid)return;
 unmount();user=uid;mounted=true;loadLocal();
 const main=board.querySelector('.community-main');if(!main)return;
 const anchor=$('skyboard-root')||$('mystery-maze-root')||$('dash-forge-root');
 let last=anchor&&main.contains(anchor)?anchor:null;
 for(const g of CLASSIC_TITLES){
  const root=buildGame(g);
  if(last)last.after(root);else main.append(root);
  last=root;renderGoals(g.id);
  const input=root.querySelector('[data-classic-file]');
  input.disabled=!g.core;
  input.addEventListener('change',()=>{
   const file=input.files?.[0];if(file)void launchFile(g,file).catch(err=>status(g.id,err.message));
   input.value='';
  });
 }
 void refreshScores();syncArcade();
}
function unmount(){
 generation++;stopPlayer();user=null;mounted=false;members.clear();reports.clear();
 for(const root of roots.values())root.remove();roots.clear();
}
async function boot(){
 if(!board||!cfg?.enabled)return;
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const store=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{
   storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:store}});
  let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;void verify().catch(console.warn);},180);};
  new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(syncArcade).observe(document.body,{attributes:true,attributeFilter:['class','data-arcade-game','data-arcade-scene']});
  client.auth.onAuthStateChange(schedule);
  window.addEventListener('message',onPlayerMessage);
  window.addEventListener('blur',releaseAll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
  window.addEventListener('keydown',event=>{
   if(!player||board.hidden||event.repeat||event.target?.closest?.('input,textarea,select'))return;
   if(!roots.get(player.game)?.querySelector('.classic-pane[data-classic-pane="play"]:not([hidden])'))return;
   const g=classicById(player.game);
   const c=g?.controls.find(c=>({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',
     Space:g.id==='topgear'?'accelerate':'fire',Enter:'start',Tab:'pause'}[event.code]||'')===c.id);
   if(c){event.preventDefault();press(c.index);}
  });
  window.addEventListener('keyup',event=>{
   if(!player)return;const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',
    Space:player.game==='topgear'?'accelerate':'fire',Enter:'start',Tab:'pause'};
   const c=classicById(player.game)?.controls.find(x=>x.id===map[event.code]);
   if(c)release(c.index,true);
  });
  schedule();
 }catch(error){console.warn('Classic arcade unavailable',error);}
}
void boot();
