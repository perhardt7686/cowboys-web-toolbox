/* Family Arcade: two original games, original artwork, authenticated scoring.
 * Star Squadron is a space swarm shooter; Mystery Maze a clue-and-wisp chase.
 * No copyrighted game assets, character likenesses, music or identical levels.
 */
import {initialRetro,retroStep,retroReplay,alienAt,ghostsAt,RETRO_MAZE,RETRO_GAME_RULES} from './retro-arcade-engine.mjs?v=arcade2';
import {initialRetroV2,retroStepV2,RETRO_V2_RULES,fleetTargetsV2} from './retro-arcade-engine-v2.mjs?v=gameplay2';
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {createRetroInput} from './retro-arcade-input.mjs?v=taps2';
import {retroStickDirection,retroStickOffset} from './retro-arcade-joystick.mjs?v=cabinet1';
import {createRetroLifecycle} from './retro-arcade-lifecycle.mjs?v=guard1';
import {retroUnlocks,canEquipRetro,resolveRetroUnlock,retroCosmeticPalette} from './retro-game-unlockables.mjs?v=gear1';
import {drawFleetWake,drawFleetGear,drawMazeFootprints,drawMazeGear} from './retro-unlock-art.mjs?v=gear1';
import {squadronFormation,squadronDiver,wispActing,drawSquadronShip,drawMazeWisp,drawMazeDetective} from './retro-arcade-visuals.mjs?v=classic1';
const board=document.getElementById('conversations');
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const GAMES=[
 {id:'fleet',root:'star-squadron-root',toggle:'star-squadron-toggle',icon:'🚀',
  title:'Star Squadron',subtitle:'Swarm defense · Original arcade shooter'},
 {id:'maze',root:'mystery-maze-root',toggle:'mystery-maze-toggle',icon:'🔎',
  title:'Mystery Maze',subtitle:'Find the clues · Dodge the wandering wisps'}
];
let client,user=null,mounted=false,overview={mine:[],trophies:[],leaders:[]};
let current=null,actions='',ticker=null,working=false,activeScene='play',gameMode='';
let selectedVersion={fleet:1,maze:1},v2Overview={mine:[],leaders:[]};
const input=createRetroInput();
const lifecycle=createRetroLifecycle();
let confirmed='',runId=null,renderTimer=null;
let requestedLooks={fleet:'patrol',maze:'scout'},scoreReadEpoch=0,verifyEpoch=0;
const $=id=>document.getElementById(id);
const letters={
 ArrowLeft:'L',KeyA:'L',ArrowRight:'R',KeyD:'R',ArrowUp:'U',KeyW:'U',ArrowDown:'D',KeyS:'D',
 Space:'F',KeyJ:'F'
};
const token=id=>document.createElement(id);
function el(name,cls,content){
 const node=token(name);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=String(content);
 return node;
}
function stopTimer(){
 if(ticker!==null){clearInterval(ticker);ticker=null;}
 input.reset();
 document.querySelectorAll('.retro-control.is-pressed,.retro-stick-knob.is-pressed')
   .forEach(node=>node.classList.remove('is-pressed'));
}
function add(parent,...children){parent.append(...children);return parent;}
function richButton(label,callback,cls=''){
 const b=el('button','retro-button '+cls,label);b.type='button';
 b.addEventListener('click',callback);return b;
}
function status(text,kind=''){
 const root=$(GAMES.find(g=>g.id===gameMode)?.root);
 const region=root?.querySelector('.retro-status');
 if(region){region.textContent=text;region.dataset.kind=kind;}
}
async function rpc(fn,args={}){
 if(!client)throw new Error('Family login unavailable');
 const {data,error}=await client.rpc(fn,args);
 if(error)throw new Error(error.message||'Your arcade request could not be verified');
 return data;
}
function clearSharedScores(){
 scoreReadEpoch++;
 overview={mine:[],trophies:[],leaders:[]};
 v2Overview={mine:[],leaders:[]};
 selectedVersion={fleet:1,maze:1};
 requestedLooks={fleet:'patrol',maze:'scout'};
 window.dispatchEvent(new Event('family-retro-scoreboard-clear'));
}
function earnedFor(game){
 return (overview.trophies||[]).filter(t=>t.game===game).map(t=>t.trophy);
}
function activeLook(game){
 return resolveRetroUnlock(game,requestedLooks[game],earnedFor(game));
}
function restoreLooks(owner){
 requestedLooks={fleet:'patrol',maze:'scout'};
 for(const g of GAMES){
  try{
   const id=localStorage.getItem('cowboy-game-gear-v1:'+owner+':'+g.id);
   if(retroUnlocks(g.id).some(item=>item.id===id))requestedLooks[g.id]=id;
  }catch{}
 }
}
function equipLook(game,id){
 if(!user||!mounted||board.hidden||!canEquipRetro(game,id,earnedFor(game)))return false;
 requestedLooks[game]=id;
 try{localStorage.setItem('cowboy-game-gear-v1:'+user+':'+game,id);}catch{}
 paintScores(game);
 if(current?.game===game)renderGame(current);
 window.dispatchEvent(new CustomEvent('family-retro-gear-changed',{detail:{game,id}}));
 return true;
}
function paintGear(game){
 const parent=$(GAMES.find(g=>g.id===game)?.root)?.querySelector('.retro-trophies');
 if(!parent)return;
 let host=parent.querySelector('.retro-gear-panel');
 if(!host){host=el('div','retro-gear-panel');parent.append(host);}
 const earned=new Set(earnedFor(game)),active=activeLook(game);
 host.replaceChildren(el('h3','',game==='fleet'?'STARSHIP HANGAR · COSMETICS':'DETECTIVE GEAR LOCKER · COSMETICS'),
  el('p','retro-gear-note','Verified trophies unlock these game-only looks. Equip does not change physics, scoring, or lives.'));
 const grid=el('div','retro-gear-grid');
 for(const item of retroUnlocks(game)){
  const unlocked=item.need===null||earned.has(item.need);
  const card=el('button','retro-gear-item'+(active===item.id?' is-equipped':''));
  card.type='button';card.disabled=!unlocked;
  card.dataset.retroGear=item.id;
  card.dataset.retroGame=game;
  card.setAttribute('aria-pressed',String(active===item.id));
  card.append(el('strong','',item.name),el('span','',item.description),
   el('small','',!unlocked?'LOCKED · '+item.need.toUpperCase()+' TROPHY':active===item.id?'EQUIPPED ✓':'EQUIP · '+item.type));
  card.addEventListener('click',()=>equipLook(game,item.id));
  grid.append(card);
 }
 host.append(grid);
}
function shareVerifiedScores(){
 // Derived only from approved-member server-verified retro RPC responses.
 const leaders={},trophies={};
 for(const g of GAMES){
  leaders[g.id]=(overview.leaders||[]).filter(p=>p.game===g.id)
   .sort((a,b)=>Number(b.best||0)-Number(a.best||0)).slice(0,5)
   .map(p=>({name:String(p.name||'Family player').slice(0,48),best:Number(p.best||0)}));
  trophies[g.id]=(overview.trophies||[]).filter(t=>t.game===g.id)
   .map(t=>String(t.trophy||'')).filter(Boolean);
 }
 window.dispatchEvent(new CustomEvent('family-retro-scoreboard',{detail:{member:user,leaders,trophies,equipped:{fleet:activeLook('fleet'),maze:activeLook('maze')}}}));
}
async function refresh(){
 if(!user||!mounted||board.hidden)return;
 const owner=user,epoch=++scoreReadEpoch;
 try{
  const result=await rpc('community_retro_state');
  if(!mounted||user!==owner||board.hidden||epoch!==scoreReadEpoch)return;
  overview=result;
  for(const g of GAMES)paintScores(g.id);
  shareVerifiedScores();
 }catch(error){if(mounted&&user===owner&&!board.hidden&&epoch===scoreReadEpoch)status(error.message,'error');}
}
async function refreshV2(id){
 if(!user||!mounted||board.hidden)return;
 const owner=user;
 try{
  const result=await rpc('community_retro_state_v2');
  if(!mounted||user!==owner||board.hidden)return;
  v2Overview=result;
  const mine=(result.mine||[]).find(p=>p.game===id);
  const root=$(GAMES.find(g=>g.id===id)?.root);
  const note=root?.querySelector('.retro-mode-note');
  if(note)note.textContent='GAMEPLAY V2 · SEPARATE SCORES · BEST '+
    Number(mine?.best||0).toLocaleString()+' · ROUNDS '+Number(mine?.runs||0);
 }catch(error){
  if(mounted&&user===owner&&!board.hidden&&selectedVersion[id]===2)
    status('Gameplay V2 server not available yet. Classic V1 is still playable.','error');
 }
}
function switchRetroVersion(id){
 if(working||current||lifecycle.pendingGame())return;
 selectedVersion[id]=selectedVersion[id]===1?2:1;
 const ver=selectedVersion[id];
 const root=$(GAMES.find(g=>g.id===id)?.root);
 if(!root)return;
 const mode=root.querySelector('.retro-mode');
 mode.textContent=ver===2?'GAMEPLAY V2 · ACTIVE':'CLASSIC V1 · ACTIVE';
 mode.setAttribute('aria-pressed',String(ver===2));
 root.querySelector('.retro-begin').textContent=ver===2?'START VERIFIED V2':'Start verified round';
 root.querySelector('.retro-mode-note').textContent=ver===2?
   'V2 scores and rankings are separate. Classic trophies and high scores stay intact.':
   'Classic V1 · Original family trophy road and verified scores.';
 gameMode=id;
 if(ver===2)void refreshV2(id);
 else status('Classic V1 selected. Existing trophies and best scores remain available.');
}
function statsByGame(id){
 return overview.mine?.find(p=>p.game===id)||{game:id,runs:0,best:0,points:0,clears:0};
}
function paintScores(id){
 const root=$(GAMES.find(g=>g.id===id).root);if(!root)return;
 const mine=statsByGame(id);
 const badges=root.querySelector('.retro-statbar');
 if(badges){
  badges.replaceChildren(
   el('span','retro-stat','BEST '+Number(mine.best||0).toLocaleString()),
   el('span','retro-stat','ROUNDS '+Number(mine.runs||0).toLocaleString()),
   el('span','retro-stat','CLEARS '+Number(mine.clears||0).toLocaleString()));
 }
 const trophy=root.querySelector('.retro-trophies');
 if(trophy){
  const names=['first-run','bronze','silver','gold','legendary'];
  trophy.replaceChildren(...names.map(name=>{
   const earned=overview.trophies?.find(t=>t.game===id&&t.trophy===name);
   const badge=el('div','retro-trophy '+(earned?'is-earned':'is-locked'));
   badge.append(el('span','retro-trophy-gem',({ 'first-run':'✦',bronze:'◆',silver:'✧',gold:'★',legendary:'✷'})[name]),
    el('strong','',name==='first-run'?'First Flight':name[0].toUpperCase()+name.slice(1)));
   badge.append(el('small','',earned?'Earned · '+Number(earned.score||0)+' pts':
    'Earn at '+(id==='fleet'?({ 'first-run':0,bronze:60,silver:200,gold:400,legendary:650})[name]:
       ({'first-run':0,bronze:100,silver:250,gold:450,legendary:700})[name])+' pts'));
   return badge;
  }));
 }
 paintGear(id);
 const leaders=root.querySelector('.retro-leaders');
 if(leaders){
  const rows=(overview.leaders||[]).filter(p=>p.game===id).sort((a,b)=>b.best-a.best).slice(0,12);
  leaders.replaceChildren(...rows.map((p,i)=>{
   const item=el('div','retro-leader');
   item.append(el('strong','',String(i+1)+'. '+String(p.name||'Family member')),
    el('span','',Number(p.best||0).toLocaleString()+' pts'));
   return item;
  }));
  if(!rows.length)leaders.append(el('p','', 'No scores yet. Be the first family arcade champion!'));
 }
}
function makeGame(game){
 const root=el('section','retro-game-root');root.id=game.root;root.dataset.retroGame=game.id;
 const toggle=richButton('',()=>toggleGame(game.id),'retro-entry');
 toggle.id=game.toggle;toggle.setAttribute('aria-expanded','false');
 toggle.setAttribute('aria-controls',game.root+'-inside');
 add(toggle,el('span','retro-entry-icon',game.icon));
 add(toggle,add(el('span','retro-entry-copy'),el('strong','',game.title),el('small','',game.subtitle)));
 add(toggle,el('span','retro-entry-arrow','▶'));
 const inside=el('div','retro-inside');inside.id=game.root+'-inside';inside.hidden=true;
 const head=el('header','retro-head');
 add(head,el('h2','',game.title),el('p','',game.id==='fleet'?
  'Defend the starlanes. Slide left or right and fire at the advancing alien swarms.':
  'Collect clues, find power orbs and avoid mischievous wisps through a hand-drawn maze.'));
 const stats=el('div','retro-statbar');
 const display=el('div','retro-display');
 const live=el('div','retro-live');
 const canvas=el('canvas','retro-canvas');
 canvas.width=game.id==='fleet'?540:450;canvas.height=game.id==='fleet'?540:450;
 canvas.setAttribute('role','img');
 canvas.tabIndex=0;
 canvas.setAttribute('aria-label',game.title+' live game canvas; use the buttons below or arrow keys');
 const info=el('div','retro-live-readout','SCORE 0 · LIVES 3');
 const controls=el('div','retro-controls');controls.dataset.retroGame=game.id;
 for(const [code,label] of game.id==='fleet'?
 [['L','◀ LEFT'],['F','FIRE ✦'],['R','RIGHT ▶']]:
 [['U','▲ UP'],['L','◀ LEFT'],['D','▼ DOWN'],['R','RIGHT ▶']]){
  const control=richButton(label,event=>{
   // Keyboard/assistive-technology button activation emits detail=0.
   // Pointer taps are queued on pointerdown to avoid double actions.
   if(event.detail===0&&current?.game===game.id)input.tap(game.id,code);
  },'retro-control');
  control.dataset.control=code;
  control.setAttribute('aria-label',label);
  control.style.touchAction='none';
  let pointerId=null;
  control.addEventListener('pointerdown',e=>{
   if(!current||current.game!==game.id||pointerId!==null)return;
   e.preventDefault();
   pointerId=e.pointerId;
   control.setPointerCapture?.(e.pointerId);
   control.classList.add('is-pressed');
   input.press(game.id,code);
  });
  function finishPointer(e,cancelled=false){
   if(pointerId!==e.pointerId)return;
   pointerId=null;control.classList.remove('is-pressed');
   if(cancelled)input.cancel(code);
   else input.release(code);
  }
  control.addEventListener('pointerup',e=>finishPointer(e));
  control.addEventListener('pointercancel',e=>finishPointer(e,true));
  control.addEventListener('lostpointercapture',e=>finishPointer(e));
  // On browsers without capture, do not leave an indefinitely held button.
  control.addEventListener('pointerleave',e=>{
    if(!control.hasPointerCapture?.(e.pointerId))finishPointer(e);
  });
  control.addEventListener('blur',()=>control.classList.remove('is-pressed'));
  controls.append(control);
 }
 if(game.id==='maze'){
  // A physical-style joystick can be dragged in one gesture. Four explicit
  // buttons remain for keyboard/screen-reader use and precise one-tile taps.
  const stick=richButton('●',()=>{},'retro-stick-knob');
  stick.setAttribute('aria-label','Drag joystick in any direction to steer the detective');
  stick.setAttribute('title','Drag to steer; arrow buttons also work');
  stick.style.touchAction='none';
  let activePointer=null,lastDirection='N';
  function moveStick(e){
    if(activePointer!==e.pointerId||current?.game!=='maze')return;
    const box=controls.getBoundingClientRect();
    const dx=e.clientX-(box.left+box.width/2);
    const dy=e.clientY-(box.top+box.height/2);
    const dir=retroStickDirection(dx,dy);
    const [x,y]=retroStickOffset(dx,dy);
    stick.style.setProperty('--stick-x',x+'px');
    stick.style.setProperty('--stick-y',y+'px');
    if(dir!=='N'&&dir!==lastDirection){
      if(lastDirection!=='N')input.release(lastDirection);
      input.press('maze',dir);lastDirection=dir;
    }
  }
  function releaseStick(e){
    if(activePointer!==e.pointerId)return;
    activePointer=null;
    if(lastDirection!=='N')input.release(lastDirection);
    lastDirection='N';
    stick.classList.remove('is-pressed');
    stick.style.setProperty('--stick-x','0px');
    stick.style.setProperty('--stick-y','0px');
  }
  stick.addEventListener('pointerdown',e=>{
    if(current?.game!=='maze'||activePointer!==null)return;
    e.preventDefault();activePointer=e.pointerId;
    stick.setPointerCapture?.(e.pointerId);
    stick.classList.add('is-pressed');
    moveStick(e);
  });
  stick.addEventListener('pointermove',moveStick);
  for(const name of ['pointerup','pointercancel','lostpointercapture'])
    stick.addEventListener(name,releaseStick);
  controls.append(stick);
 }
 const mode=richButton('CLASSIC V1 · ACTIVE',()=>switchRetroVersion(game.id),'retro-mode');
 mode.setAttribute('aria-pressed','false');
 const modeNote=el('p','retro-mode-note',
   'Classic V1 · Original family trophy road and verified scores.');
 const begin=richButton('Start verified round',()=>void start(game.id),'retro-begin');
 const end=richButton('Leave round',()=>abandon(),'retro-end');
 const notification=el('p','retro-status','Choose Start to play. Family trophies are awarded from server-verified results.');
 notification.setAttribute('role','status');
 const buttons=add(el('div','retro-actions'),mode,begin,end);
 live.append(canvas,info,modeNote,controls,buttons,notification);
 const trophies=el('div','retro-trophies retro-panel-view');trophies.hidden=true;
 const leaders=el('div','retro-leaders retro-panel-view');leaders.hidden=true;
 display.append(live,trophies,leaders);
 inside.append(head,stats,display);
 root.append(toggle,inside);
 paintReady(canvas,game.id);
 return root;
}
function toggleGame(id){
 const game=GAMES.find(g=>g.id===id),root=$(game?.root);
 if(!root)return;
 const inside=root.querySelector('.retro-inside'),shown=inside.hidden;
 if(!shown&&(current?.game===id||lifecycle.pendingGame()===id))abandon();
 inside.hidden=!shown;
 root.querySelector('.retro-entry').setAttribute('aria-expanded',String(shown));
 if(shown){gameMode=id;activeScene='play';renderScene(id,'play');void refresh();}
}
function syncArcade(){
 if(!mounted)return;
 const name=document.body.dataset.arcadeGame,arcade=document.body.classList.contains('arcade-on');
 for(const g of GAMES){
  const root=$(g.root);if(!root)continue;
  const open=arcade&&name===g.id;
  if(open){
   root.querySelector('.retro-inside').hidden=false;
   root.querySelector('.retro-entry').setAttribute('aria-expanded','true');
   gameMode=g.id;
   renderScene(g.id,document.body.dataset.arcadeScene||'play');
  }else if(arcade&&(current?.game===g.id||lifecycle.pendingGame()===g.id)){
   abandon();
  }
 }
}
function renderScene(id,scene){
 const root=$(GAMES.find(g=>g.id===id)?.root);if(!root)return;
 const page=['play','trophies','leaders'].includes(scene)?scene:'play';
 activeScene=page;
 root.querySelector('.retro-live').hidden=page!=='play';
 root.querySelector('.retro-trophies').hidden=page!=='trophies';
 root.querySelector('.retro-leaders').hidden=page!=='leaders';
 if(page!=='play'&&(current?.game===id||lifecycle.pendingGame()===id))abandon();
 if(page!=='play')void refresh();
}
function actionForTick(game){return input.action(game,current);}
function tick(){
 if(!current||working)return;
 const action=actionForTick(current.game);
 actions+=action;
 try{current=current.version===2?retroStepV2(current,action):retroStep(current,action);}catch(error){stopTimer();status(error.message,'error');return;}
 renderGame(current);
 if(current.done){
  stopTimer();
  void finish();
 }
}
async function start(id){
 if(working||!user)return;
 if(current)abandon();
 const root=$(GAMES.find(g=>g.id===id)?.root);
 if(!root||root.querySelector('.retro-inside')?.hidden)return;
 const ticket=lifecycle.begin(id),owner=user,version=selectedVersion[id];
 working=true;gameMode=id;
 root.querySelector('.retro-begin').disabled=true;
 root.querySelector('.retro-mode').disabled=true;
 // Leaving is allowed while a server start is pending.
 root.querySelector('.retro-end').disabled=false;
 status('Starting a verified family round…');
 try{
  const received=await rpc(version===2?'community_retro_start_v2':'community_retro_start',{p_game:id});
  // A delayed server response cannot resurrect a left/hidden/signed-out game.
  if(!lifecycle.matches(ticket))return;
  const visible=mounted&&user===owner&&!board.hidden&&root.isConnected&&
   !root.querySelector('.retro-inside')?.hidden&&!root.querySelector('.retro-live')?.hidden&&
   (!document.body.classList.contains('arcade-on')||document.body.dataset.arcadeGame===id);
  if(!visible){abandon();return;}
  if(received.game!==id||!received.run_id||
     (version===2&&received.version!==2))throw new Error('Unexpected game session version');
  runId=received.run_id;
  current=version===2?initialRetroV2(id,received.seed):initialRetro(id,received.seed);
  actions='';input.reset();confirmed='';
  renderGame(current);
  root.querySelector('.retro-canvas')?.focus({preventScroll:true});
  status(version===2?
    'V2 underway. Three enemy roles and separate V2 rankings. Score needs verified V2 replay.':
    'Round underway. Score stays unverified until the server checks your full run.');
  ticker=document.hidden?null:setInterval(tick,RETRO_GAME_RULES[id].interval);
 }catch(error){
  if(lifecycle.matches(ticket))status(error.message,'error');
 }finally{
  if(lifecycle.matches(ticket)){
   lifecycle.clearPending(ticket);working=false;
   if(!current){
    root.querySelector('.retro-begin').disabled=false;
    root.querySelector('.retro-mode').disabled=false;
    root.querySelector('.retro-end').disabled=true;
   }
  }
 }
}
function abandon(){
 const couldStillVerify=Boolean(working&&current?.done&&runId);
 lifecycle.invalidate();
 stopTimer();current=null;actions='';runId=null;working=false;
 for(const g of GAMES){
  const root=$(g.root);if(!root)continue;
  root.querySelector('.retro-begin').disabled=false;
  root.querySelector('.retro-mode').disabled=false;
  root.querySelector('.retro-end').disabled=true;
 }
 if(gameMode)status(couldStillVerify?
  'Round closed. A completed run may still finish server verification; check your scores later.':
  'Round left. No new score or trophy was claimed in this view.');
}
async function finish(){
 if(!runId||working||!current)return;
 const ticket=lifecycle.current();
 working=true;
 const snapshot=current,id=runId,trace=actions;
 status('Replaying your moves on the server. Do not close the game yet.');
 try{
  const result=await rpc(snapshot.version===2?'community_retro_finish_v2':'community_retro_finish',{p_run_id:id,p_actions:trace});
  if(!lifecycle.matches(ticket))return;
  if(Number(result.score)!==Number(snapshot.score)||
     Number(result.lives)!==Number(snapshot.lives))
    throw new Error('The local preview differs from verified gameplay. No score has been claimed in this view.');
  confirmed=(snapshot.version===2?'V2 SERVER VERIFIED · ':'SERVER VERIFIED · ')+
    Number(result.score).toLocaleString()+' pts';
  status(confirmed+(snapshot.version===2?' · separate V2 rankings':
    ' · '+(result.trophies||[]).join(', ')),'success');
  if(snapshot.version===2)await refreshV2(snapshot.game);
  else await refresh();
  if(lifecycle.matches(ticket)&&snapshot.version!==2)
   window.dispatchEvent(new Event('family-arcade-achievements-updated'));
 }catch(error){
  if(lifecycle.matches(ticket))
   status('RUN NOT VERIFIED · '+(error.message||'Please try another round.'),'error');
 }finally{
  // Never clear a newer round started while an earlier finish was in flight.
  if(lifecycle.matches(ticket)){
   working=false;runId=null;current=null;actions='';
   for(const g of GAMES){
    const root=$(g.root);if(!root)continue;
    root.querySelector('.retro-begin').disabled=false;
    root.querySelector('.retro-mode').disabled=false;
    root.querySelector('.retro-end').disabled=true;
   }
  }
 }
}
function paintReady(canvas,id){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.fillStyle='#090c2b';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.textAlign='center';
 ctx.fillStyle='#ffd783';ctx.font='900 '+Math.floor(canvas.width/13)+'px monospace';
 ctx.fillText(id==='fleet'?'STAR SQUADRON':'MYSTERY MAZE',canvas.width/2,canvas.height*.45);
 ctx.fillStyle='#a0f7e7';ctx.font='bold 20px monospace';
 ctx.fillText('PRESS START TO BEGIN',canvas.width/2,canvas.height*.58);
}
function paintFleet(canvas,s,look='patrol'){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 ctx.fillStyle='#070c29';ctx.fillRect(0,0,w,h);
 for(let i=0;i<98;i++){
  const x=(i*79+17)%w,y=(i*127+13+s.tick*2)%(h-30);
  ctx.fillStyle=i%5?'#91bcf9':'#f7d49e';
  ctx.fillRect(x,y,i%3===0?2:1,i%3===0?2:1);
 }
 const bw=(w-36)/9,x=18+s.lane*bw+bw/2,y=h-72;
 const [hull,trim,cockpit]=retroCosmeticPalette('fleet',look);
 drawFleetWake(ctx,look,s,x,y);
 ctx.save();ctx.translate(x,y);
 ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(27,17);ctx.lineTo(12,11);
 ctx.lineTo(0,25);ctx.lineTo(-12,11);ctx.lineTo(-27,17);ctx.closePath();
 ctx.fillStyle=hull;ctx.strokeStyle=trim;ctx.lineWidth=4;ctx.fill();ctx.stroke();
 ctx.fillStyle=cockpit;ctx.fillRect(-8,-3,16,10);
 ctx.restore();
 drawFleetGear(ctx,look,s,x,y);
 // Reserve formation is visual only; only the bright diving attacker is
 // active in the server-verified wave. No new invisible hitboxes or points.
 ctx.save();ctx.globalAlpha=.34;
 for(const ship of squadronFormation(s.tick,s.seed,w))
   drawSquadronShip(ctx,ship.x,ship.y,ship.scale,'#6c8eb6');
 ctx.restore();
 ctx.fillStyle='#9ab5d1';ctx.font='bold 11px monospace';
 ctx.fillText('STANDBY FORMATION',18,28);
 const alien=squadronDiver(s.tick,s.seed,w);
 if(alien&&!s.destroyed.includes(alien.wave)){
   ctx.save();
   ctx.globalAlpha=.18;ctx.strokeStyle=alien.boss?'#ffc9f3':'#97f4d8';
   ctx.lineWidth=8;ctx.beginPath();
   ctx.moveTo(alien.x,alien.y-36);ctx.lineTo(alien.x,alien.y-72);ctx.stroke();
   ctx.restore();
   drawSquadronShip(ctx,alien.x,alien.y,1.12,
     alien.boss?'#f08acc':'#72dfb0',
     {active:true,boss:alien.boss,tilt:alien.tilt});
   ctx.fillStyle=alien.boss?'#ffd79f':'#9ffff2';
   ctx.font='bold 12px monospace';ctx.textAlign='center';
   ctx.fillText(alien.boss?'COMMANDER DIVE':'ACTIVE DIVER',alien.x,Math.min(h-111,alien.y+44));
 }
 if(['F','A','D'].includes(s.prevAction)){
  ctx.strokeStyle='#fff0a6';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(x,120);ctx.stroke();
  ctx.strokeStyle='#7af1ea';ctx.lineWidth=2;ctx.stroke();
 }
 if(s.events.includes('hit')){ctx.fillStyle='#fff1af';ctx.font='900 27px monospace';ctx.fillText('+ HIT!',w/2,h/2);}
 if(s.events.includes('crash')){ctx.fillStyle='#ff7189';ctx.font='900 24px monospace';ctx.fillText('HULL DAMAGE!',w/2,h/2);}
}
function paintMaze(canvas,s,look='scout'){
 const ctx=canvas.getContext('2d');const tile=canvas.width/15;
 ctx.fillStyle='#120e2e';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(let y=0;y<15;y++)for(let x=0;x<15;x++){
  const cell=RETRO_MAZE[y][x],px=x*tile,py=y*tile;
  if(cell==='#'){
   ctx.fillStyle='#56458d';ctx.fillRect(px+1,py+1,tile-2,tile-2);
   ctx.fillStyle='#8d78ca';ctx.fillRect(px+5,py+4,tile-10,3);
   ctx.strokeStyle='#33295b';ctx.lineWidth=2;ctx.strokeRect(px+1,py+1,tile-2,tile-2);
  }else if(!s.seen.includes(x+','+y)){
   ctx.fillStyle=cell==='o'?'#ffe7a1':'#a5f0db';
   ctx.beginPath();ctx.arc(px+tile/2,py+tile/2,cell==='o'?6:2.8,0,Math.PI*2);ctx.fill();
  }
 }
 drawMazeFootprints(ctx,look,s,tile);
 // Distinct wisp colors, eye tracking and frightened poses follow the
 // authoritative positions and power timer without changing danger cells.
 for(const [i,g] of s.ghosts.entries()){
   const xx=(g.x+.5)*tile,yy=(g.y+.5)*tile;
   drawMazeWisp(ctx,xx,yy,wispActing(g,s,s.tick,i,s.power),i,s.tick);
 }
 const xx=(s.x+.5)*tile,yy=(s.y+.5)*tile;
 const [coat,outline]=retroCosmeticPalette('maze',look);
 drawMazeDetective(ctx,xx,yy,s.prevAction,s.tick,coat,outline);
 drawMazeGear(ctx,look,s,xx,yy);
}
function renderGame(state){
 const root=$(GAMES.find(g=>g.id===state.game).root);
 const canvas=root?.querySelector('.retro-canvas');if(!canvas)return;
 if(state.game==='fleet')paintFleet(canvas,state,activeLook(state.game));else paintMaze(canvas,state,activeLook(state.game));
 const n=root.querySelector('.retro-live-readout');
 n.textContent='SCORE '+state.score+' · LIVES '+state.lives+' · '+state.tick+'/'+RETRO_GAME_RULES[state.game].steps+
   (state.game==='maze'?' · CLUES '+state.dots:'/ · SWARMS '+Math.ceil(state.tick/9));
}
function onKeyDown(event){
 // Leave Space/Enter to the focused button, form, menu or link. Arcade
 // keyboard steering applies only when the game canvas/page has focus.
 // Gameplay buttons already map accessible keyboard clicks through tap().
 if(!current||event.repeat||
   document.activeElement?.closest?.('input,textarea,select,button,a,summary,[role="button"],[contenteditable="true"]'))return;
 const code=letters[event.code];if(!code)return;
 if(current.game==='maze'&&code==='F')return;
 if(current.game==='fleet'&&['U','D'].includes(code))return;
 event.preventDefault();input.press(current.game,code);
}
function onKeyUp(event){
 const code=letters[event.code];if(code)input.release(code);
}
async function verify(){
 const verification=++verifyEpoch;
 if(!cfg?.enabled||!board)return;
 if(board.hidden){
  if(mounted){abandon();for(const g of GAMES)$(g.root)?.remove();mounted=false;user=null;clearSharedScores();}
  return;
 }
 const {data:{session}}=await client.auth.getSession();
 if(verification!==verifyEpoch||board.hidden)return;
 const id=session?.user?.id;if(!id){if(mounted){abandon();for(const g of GAMES)$(g.root)?.remove();mounted=false;}user=null;clearSharedScores();return;}
 const {data:member,error}=await client.from('community_members').select('status').eq('user_id',id).maybeSingle();
 if(verification!==verifyEpoch||board.hidden)return;
 if(error||member?.status!=='approved'){if(mounted){abandon();for(const g of GAMES)$(g.root)?.remove();mounted=false;}user=null;clearSharedScores();return;}
 if(mounted&&user===id)return;
 if(mounted){abandon();for(const g of GAMES)$(g.root)?.remove();clearSharedScores();}
 user=id;mounted=true;restoreLooks(id);
 const main=board.querySelector('.community-main');if(!main){mounted=false;return;}
 const base=$('dash-forge-root'),insertion=base&&main.contains(base)?base:null;
 for(const g of GAMES){
  const element=makeGame(g);if(insertion)insertion.after(element);else main.append(element);
 }
 for(const g of GAMES){$(g.root).querySelector('.retro-end').disabled=true;paintScores(g.id);}
 void refresh();syncArcade();
}
async function boot(){
 if(!cfg?.enabled||!board)return;
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const store=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{
   storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:store}});
  let queued=false;
  const schedule=()=>{
   if(queued)return;queued=true;
   setTimeout(()=>{queued=false;void verify().catch(console.warn);},180);
  };
  new MutationObserver(()=>{
   verifyEpoch++;
   // Hide immediately: an in-flight approval request must not remount a board.
   if(board.hidden){
    if(mounted){abandon();for(const g of GAMES)$(g.root)?.remove();mounted=false;}
    user=null;clearSharedScores();
   }
   schedule();
  }).observe(board,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(syncArcade).observe(document.body,
   {attributes:true,attributeFilter:['class','data-arcade-game','data-arcade-scene']});
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden){
    input.clearHeld();
    if(current&&ticker!==null){clearInterval(ticker);ticker=null;
     status('Round paused while the page is hidden.');}
   }else{
    if(current&&!current.done&&!working&&ticker===null){
     ticker=setInterval(tick,RETRO_GAME_RULES[current.game].interval);
     status('Round resumed. Keep playing!');
    }
    schedule();
   }
  });
  window.addEventListener('blur',()=>input.clearHeld());
  client.auth.onAuthStateChange((event,session)=>{
   verifyEpoch++;
   // Sign-out/account-switch tears down family data before the delayed recheck.
   if(event==='SIGNED_OUT'||(user&&session?.user?.id!==user)){
    if(mounted){abandon();for(const g of GAMES)$(g.root)?.remove();mounted=false;}
    user=null;clearSharedScores();
   }
   schedule();
  });
  window.addEventListener('family-retro-equip-request',event=>{
   const detail=event.detail;
   if(detail?.game&&detail?.id)equipLook(detail.game,detail.id);
  });
  window.addEventListener('keydown',onKeyDown);
  window.addEventListener('keyup',onKeyUp);
  schedule();
 }catch(error){console.warn('Family arcade unavailable',error);}
}
void boot();
