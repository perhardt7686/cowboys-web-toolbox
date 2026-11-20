/* Family Arcade: two original games, original artwork, authenticated scoring.
 * Star Squadron is a space swarm shooter; Mystery Maze a clue-and-wisp chase.
 * No copyrighted game assets, character likenesses, music or identical levels.
 */
import {initialRetro,retroStep,retroReplay,alienAt,ghostsAt,RETRO_MAZE,RETRO_GAME_RULES} from './retro-arcade-engine.mjs?v=arcade2';
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {createRetroInput} from './retro-arcade-input.mjs?v=taps2';
import {createRetroCabinet} from './retro-arcade-cabinet-ui.mjs?v=cabinet1';
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
let current=null,actions='',ticker=null,working=false,activeScene='play',gameMode='',manualPause=false;
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
function updateCabinetPause(){
 document.querySelectorAll('[data-retro-pause]').forEach(button=>{
  const active=Boolean(current&&current.game===button.dataset.retroPause&&!current.done);
  button.disabled=!active||working;
  button.textContent=manualPause&&active?'B · RESUME':'B · PAUSE';
  button.setAttribute('aria-pressed',String(active&&manualPause));
 });
}
function stopTimer(){
 if(ticker!==null){clearInterval(ticker);ticker=null;}
 input.reset();manualPause=false;
 document.querySelectorAll('.retro-cabinet-stick.is-pressed,.retro-cabinet-action.is-pressed')
   .forEach(node=>node.classList.remove('is-pressed'));
 updateCabinetPause();
}
function toggleCabinetPause(game){
 if(!current||current.game!==game||current.done||working)return;
 manualPause=!manualPause;input.clearHeld();
 if(manualPause){
  if(ticker!==null){clearInterval(ticker);ticker=null;}
  status('PAUSED · Press B to resume. Your score and lives are safe.');
 }else if(!document.hidden){
  ticker=setInterval(tick,RETRO_GAME_RULES[game].interval);
  status('Round resumed. Joystick to move; A for '+(game==='fleet'?'fire.':'brake.'));
 }
 updateCabinetPause();
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
 canvas.setAttribute('aria-label',game.title+' playfield; use joystick and A/B buttons below or arrow keys');
 const info=el('div','retro-live-readout','SCORE 0 · LIVES 3');
 const controls=createRetroCabinet({game:game.id,input,
  isLive:kind=>Boolean(current?.game===game.id&&!current.done&&!working&&
    (kind==='pause'||!manualPause)),
  onPause:()=>toggleCabinetPause(game.id)});
 const begin=richButton('Start verified round',()=>void start(game.id),'retro-begin');
 const end=richButton('Leave round',()=>abandon(),'retro-end');
 const notification=el('p','retro-status','Choose Start to play. Family trophies are awarded from server-verified results.');
 notification.setAttribute('role','status');
 const buttons=add(el('div','retro-actions'),begin,end);
 live.append(canvas,info,controls,buttons,notification);
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
 if(!current||working||manualPause)return;
 const action=actionForTick(current.game);
 actions+=action;
 try{current=retroStep(current,action);}catch(error){stopTimer();status(error.message,'error');return;}
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
 const ticket=lifecycle.begin(id),owner=user;
 working=true;gameMode=id;
 root.querySelector('.retro-begin').disabled=true;
 // Leaving is allowed while a server start is pending.
 root.querySelector('.retro-end').disabled=false;
 status('Starting a verified family round…');
 try{
  const received=await rpc('community_retro_start',{p_game:id});
  // A delayed server response cannot resurrect a left/hidden/signed-out game.
  if(!lifecycle.matches(ticket))return;
  const visible=mounted&&user===owner&&!board.hidden&&root.isConnected&&
   !root.querySelector('.retro-inside')?.hidden&&!root.querySelector('.retro-live')?.hidden&&
   (!document.body.classList.contains('arcade-on')||document.body.dataset.arcadeGame===id);
  if(!visible){abandon();return;}
  if(received.game!==id||!received.run_id)throw new Error('Unexpected game session');
  runId=received.run_id;current=initialRetro(id,received.seed);
  actions='';input.reset();confirmed='';manualPause=false;
  renderGame(current);updateCabinetPause();
  root.querySelector('.retro-canvas')?.focus({preventScroll:true});
  status('Round underway. Score stays unverified until the server checks your full run.');
  ticker=document.hidden?null:setInterval(tick,RETRO_GAME_RULES[id].interval);
 }catch(error){
  if(lifecycle.matches(ticket))status(error.message,'error');
 }finally{
  if(lifecycle.matches(ticket)){
   lifecycle.clearPending(ticket);working=false;
   updateCabinetPause();
   if(!current){
    root.querySelector('.retro-begin').disabled=false;
    root.querySelector('.retro-end').disabled=true;
   }
  }
 }
}
function abandon(){
 const couldStillVerify=Boolean(working&&current?.done&&runId);
 lifecycle.invalidate();
 stopTimer();current=null;actions='';runId=null;working=false;updateCabinetPause();
 for(const g of GAMES){
  const root=$(g.root);if(!root)continue;
  root.querySelector('.retro-begin').disabled=false;
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
  const result=await rpc('community_retro_finish',{p_run_id:id,p_actions:trace});
  if(!lifecycle.matches(ticket))return;
  if(Number(result.score)!==Number(snapshot.score)||
     Number(result.lives)!==Number(snapshot.lives))
    throw new Error('The local preview differs from verified gameplay. No score has been claimed in this view.');
  confirmed='SERVER VERIFIED · '+Number(result.score).toLocaleString()+' pts';
  status(confirmed+' · '+(result.trophies||[]).join(', '),'success');
  await refresh();
  if(lifecycle.matches(ticket))
   window.dispatchEvent(new Event('family-arcade-achievements-updated'));
 }catch(error){
  if(lifecycle.matches(ticket))
   status('RUN NOT VERIFIED · '+(error.message||'Please try another round.'),'error');
 }finally{
  // Never clear a newer round started while an earlier finish was in flight.
  if(lifecycle.matches(ticket)){
   working=false;runId=null;current=null;actions='';updateCabinetPause();
   for(const g of GAMES){
    const root=$(g.root);if(!root)continue;
    root.querySelector('.retro-begin').disabled=false;
    root.querySelector('.retro-end').disabled=true;
   }
  }
 }
}
function paintReady(canvas,id){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=canvas.width,h=canvas.height;
 ctx.fillStyle='#050b20';ctx.fillRect(0,0,w,h);
 ctx.lineWidth=3;ctx.strokeStyle=id==='fleet'?'#5bc0de':'#5278f5';
 ctx.strokeRect(11,11,w-22,h-22);
 ctx.lineWidth=1;ctx.strokeStyle='#1a3158';ctx.strokeRect(17,17,w-34,h-34);
 ctx.textAlign='center';ctx.fillStyle='#a8e9e3';
 ctx.font='bold '+Math.floor(w/33)+'px monospace';
 ctx.fillText('COWBOY FAMILY ARCADE   ·   PLAYER ONE',w/2,h*.22);
 ctx.fillStyle='#ffdd8c';ctx.font='900 '+Math.floor(w/13)+'px monospace';
 ctx.fillText(id==='fleet'?'STAR SQUADRON':'MYSTERY MAZE',w/2,h*.43);
 ctx.fillStyle='#b8f2e8';ctx.font='bold '+Math.floor(w/25)+'px monospace';
 ctx.fillText(id==='fleet'?'SWARMS · DIVES · LASERS':'CLUES · CORNERS · WISPS',w/2,h*.53);
 ctx.fillStyle='#ffafc6';ctx.font='bold '+Math.floor(w/27)+'px monospace';
 ctx.fillText('JOYSTICK    A ACTION    B PAUSE',w/2,h*.66);
 ctx.fillStyle='#fce5a8';ctx.font='bold '+Math.floor(w/23)+'px monospace';
 ctx.fillText('PRESS START',w/2,h*.78);
}
function paintFleet(canvas,s,look='patrol'){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 ctx.fillStyle='#070c29';ctx.fillRect(0,0,w,h);
 for(let i=0;i<98;i++){
  const x=(i*79+17)%w,y=(i*127+13+s.tick*2)%(h-30);
  ctx.fillStyle=i%5?'#91bcf9':'#f7d49e';
  ctx.fillRect(x,y,i%3===0?2:1,i%3===0?2:1);
 }
 // Cabinet-like one-up / wave strip stays purely decorative.
 ctx.fillStyle='#071429';ctx.fillRect(0,0,w,47);
 ctx.strokeStyle='#284778';ctx.lineWidth=2;ctx.beginPath();
 ctx.moveTo(0,47);ctx.lineTo(w,47);ctx.stroke();
 ctx.textAlign='left';ctx.fillStyle='#fbd99a';ctx.font='bold 17px monospace';
 ctx.fillText('1UP',18,19);
 ctx.fillStyle='#fff0cb';ctx.font='bold 18px monospace';
 ctx.fillText(String(s.score).padStart(6,'0'),18,39);
 ctx.textAlign='right';ctx.fillStyle='#8fe8d9';ctx.font='bold 16px monospace';
 ctx.fillText('WAVE '+String(Math.ceil(s.tick/9)+1).padStart(2,'0'),w-18,29);
 ctx.textAlign='left';
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
 ctx.fillStyle='#030916';ctx.fillRect(0,0,canvas.width,canvas.height);
 // Maze corridors echo illuminated cabinets without copying any commercial
 // board, copyrighted sprite, score logic or proprietary animation.
 for(let y=0;y<15;y++)for(let x=0;x<15;x++){
  const cell=RETRO_MAZE[y][x],px=x*tile,py=y*tile;
  if(cell==='#'){
   ctx.fillStyle='#07184b';ctx.fillRect(px,py,tile,tile);
   ctx.strokeStyle='#286be6';ctx.lineWidth=3;ctx.beginPath();
   if(RETRO_MAZE[y-1]?.[x]!== '#'){ctx.moveTo(px+1,py+1);ctx.lineTo(px+tile-1,py+1);}
   if(RETRO_MAZE[y+1]?.[x]!== '#'){ctx.moveTo(px+1,py+tile-1);ctx.lineTo(px+tile-1,py+tile-1);}
   if(RETRO_MAZE[y]?.[x-1]!== '#'){ctx.moveTo(px+1,py+1);ctx.lineTo(px+1,py+tile-1);}
   if(RETRO_MAZE[y]?.[x+1]!== '#'){ctx.moveTo(px+tile-1,py+1);ctx.lineTo(px+tile-1,py+tile-1);}
   ctx.stroke();
  }else if(!s.seen.includes(x+','+y)){
   const isPower=cell==='o';
   ctx.fillStyle=isPower?'#ffe6a0':'#bceadc';
   ctx.beginPath();
   ctx.arc(px+tile/2,py+tile/2,isPower?5+Math.sin(s.tick*.43)*1.2:2.6,0,Math.PI*2);
   ctx.fill();
   if(isPower){ctx.strokeStyle='#f9ab6c';ctx.lineWidth=1.6;ctx.stroke();}
  }
 }
 drawMazeFootprints(ctx,look,s,tile);
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
 if(event.code==='KeyP'){event.preventDefault();toggleCabinetPause(current.game);return;}
 const code=current.game==='maze'&&['Space','KeyJ'].includes(event.code)?
  'B':letters[event.code];
 if(!code)return;
 if(current.game==='fleet'&&['U','D'].includes(code))return;
 event.preventDefault();if(!manualPause)input.press(current.game,code);
}
function onKeyUp(event){
 const code=current?.game==='maze'&&['Space','KeyJ'].includes(event.code)?
  'B':letters[event.code];
 if(code)input.release(code);
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
    if(current&&!current.done&&!working&&!manualPause&&ticker===null){
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
