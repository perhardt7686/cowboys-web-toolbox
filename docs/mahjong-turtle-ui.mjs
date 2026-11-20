/* 144-tile Classic Turtle member view.
 * Kept separate from Mystery Road RPCs, scores and achievements.
 * Progress is deliberately labeled browser-local until server sync is added.
 */
import {
 TURTLE_LAYOUTS,TURTLE_FACES,faceById,buildTurtleDeal,isFreeTile,
 availablePairs,pairIsLegal,replayTurtleMoves,utcDailyKey,dailyDealSeed
} from './mahjong-turtle-engine.mjs';
import {playMahjongSound} from './mahjong-classic-tiles.mjs?v=classic1';
import {CLASSIC_AWARDS,awardEarned,awardMetric,awardLevel,freshlyEarned,celebrateMahjong} from './mahjong-classic-awards.mjs';
const HEIGHT=1.16,ZOOMS=[1,1.3,1.6,1.9,2.3];
const $=(root,selector)=>root.querySelector(selector);
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const pad=n=>String(n).padStart(2,'0');
const duration=s=>`${pad(Math.floor(s/60))}:${pad(s%60)}`;
const dateLabel=day=>new Date(day+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
function emptyStorage(){return {version:1,free:null,dailies:{},history:[]};}
function readStorage(key){try{
 const s=JSON.parse(window.localStorage.getItem(key)||'null');
 return s?.version===1&&s.dailies&&typeof s.dailies==='object'&&Array.isArray(s.history)?s:emptyStorage();
}catch{return emptyStorage();}}
function newGame(kind,layout,seed,date=null){return {kind,layout,seed,...(date?{date}:{}),moves:[],elapsed:0,paused:false,hints:0,
 misses:0,undos:0,pauses:0,streak:0,fastStreak:0,lastMatchAt:0,highestPairs:0,
 startedAt:new Date().toISOString(),completedAt:null};}
function validateGame(s){
 try{
 if(!s||typeof s!=='object'||!Object.hasOwn(TURTLE_LAYOUTS,s.layout)||
   !Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295||
   !Array.isArray(s.moves)||s.moves.length>72||!Number.isSafeInteger(s.elapsed)||s.elapsed<0||
   (s.kind!=='free'&&s.kind!=='daily')||
   (s.kind==='daily'&&(s.layout!=='turtle'||s.seed!==dailyDealSeed(s.date))))return null;
  const deal=buildTurtleDeal(s.layout,s.seed);
  const removed=replayTurtleMoves(deal,s.moves);
  if(Boolean(s.completedAt)!==(removed.size===144))return null;
  return {game:s,deal,removed};
 }catch{return null;}
}
function nextSeed(){
 if(globalThis.crypto?.getRandomValues){const arr=new Uint32Array(1);globalThis.crypto.getRandomValues(arr);return arr[0];}
 return (Math.floor(Math.random()*4294967296)>>>0);
}
function tileArtwork(face){
 const art=make('span','turtle-art turtle-art-'+face.kind);
 art.setAttribute('aria-hidden','true');
 if(face.kind==='circles'||face.kind==='bamboo'){
  const pips=make('span','turtle-symbols');pips.dataset.count=String(face.number);
  for(let i=0;i<face.number;i++)pips.append(make('span',face.kind==='circles'?'turtle-dot':'turtle-stem'));
  art.append(pips);
 }else if(face.kind==='characters'){
  art.append(make('span','turtle-number',['一','二','三','四','五','六','七','八','九'][face.number-1]),make('span','turtle-unit','萬'));
 }else if(face.kind==='dragon'&&face.mark==='白'){
  art.append(make('span','turtle-white-dragon','▢'));
 }else{
  art.append(make('span','turtle-hanzi',face.mark));
  if(face.kind==='flower'||face.kind==='season')art.append(make('span','turtle-small',face.kind==='flower'?'FLOWER':'SEASON'));
 }
 return art;
}
export function mountClassicTurtle(root,{userId}){
 if(!root||!userId)return ()=>{};
 const inside=$(root,'#mahjong-inside');
 if(!inside)return ()=>{};
 const key='cowboy-mahjong-turtle-v1:'+userId;
 const prefKey='cowboy-mahjong-turtle-preferences-v1:'+userId;
 let saved=readStorage(key),activeKind='free',selected=null,highlight=[],zoom=0,awardFilter='all',awardLimit=30,
  destroyed=false,clock=null,resize=null,prefs={sound:false,showFree:false},mode='turtle',lastStatus='';
 try{const val=JSON.parse(window.localStorage.getItem(prefKey)||'{}');
  if(val&&typeof val==='object')prefs={sound:val.sound===true,showFree:val.showFree===true};
  mode=val?.mode==='road'?'road':'turtle';
 }catch{}
 // Additive browser-local stats upgrade; keep all v1 game history and Mystery Road RPCs untouched.
 const stats=saved.stats&&typeof saved.stats==='object'?saved.stats:{};
 saved.stats=stats;
 if(!Array.isArray(saved.achievements))saved.achievements=[];
 const counts=['pairs','wins','dailyWins','dailyChain','bestStreak','bestRush','flawlessWins','unassistedWins','noUndoWins','noPauseWins',
  'layoutturtleWins','layouttempleWins','layoutgardenWins','dragonPairs','windPairs','flowerPairs','seasonPairs',
  'bambooPairs','circlesPairs','charactersPairs','mistakes'];
 for(const kind of ['dragon','wind','flower','season','bamboo','circles','characters'])counts.push('ritualOpen_'+kind,'ritualClose_'+kind);
 counts.push('ritualFourfold','ritualSevenfold');
 for(const metric of counts){if(!Number.isSafeInteger(stats[metric])||stats[metric]<0)stats[metric]=0;}
 stats.wins=Math.max(stats.wins,saved.history.length);
 stats.dailyWins=Math.max(stats.dailyWins,new Set(saved.history.filter(g=>g.kind==='daily').map(g=>g.date)).size);
 const completed=saved.history.map(g=>g.elapsed).filter(n=>Number.isSafeInteger(n)&&n>0);
 stats.bestWinSeconds=Math.min(...[stats.bestWinSeconds,...completed].filter(n=>Number.isSafeInteger(n)&&n>0),Infinity);
 if(!Number.isFinite(stats.bestWinSeconds))stats.bestWinSeconds=0;
 function savePrefs(){try{window.localStorage.setItem(prefKey,JSON.stringify({...prefs,mode}));}catch{}}
 function persist(){
  const cutoff=utcDailyKey(new Date(Date.now()-15*86400000));
  saved.dailies=Object.fromEntries(Object.entries(saved.dailies).filter(([day])=>day>=cutoff));
  saved.history=saved.history.slice(0,40);
  try{window.localStorage.setItem(key,JSON.stringify(saved));return true;}
  catch{status('Saving unavailable on this device. Keep this tab open or free browser storage.');return false;}
 }
 const tabs=make('nav','turtle-mode-tabs');tabs.setAttribute('aria-label','Mahjong game modes');
 tabs.innerHTML='<button type="button" data-mode="road" aria-pressed="true">Mystery Road <small>72 tiles · family campaign</small></button><button type="button" class="turtle-glow-tab" data-mode="turtle" aria-pressed="false"><span aria-hidden="true">✦</span> CLASSIC TURTLE <span aria-hidden="true">✦</span> <small>PLAY 144 TILES · 5 LAYERS</small></button>';
 const section=make('section','mahjong-turtle');section.id='mahjong-classic-root';
 section.innerHTML=`<div class="turtle-heading"><div><span class="mahjong-kicker">CLASSIC SOLITAIRE · FIVE-LAYER TURTLE</span><h3>Classic Turtle</h3><p>Clear 144 tiles in 72 pairs. The top must be clear and at least one side open. Any Flower matches another Flower; Seasons match Seasons. No shuffle.</p></div><span class="turtle-authentic">144 TILES</span></div>
 <div class="turtle-modes" role="group" aria-label="Turtle play type"><button type="button" data-kind="free" aria-pressed="true">Free Play</button><button type="button" data-kind="daily" aria-pressed="false">Daily Challenge</button></div>
 <div class="turtle-options"><label>Layout <select id="turtle-layout"><option value="turtle">Classic Turtle · 5 layers</option><option value="temple">Layered Temple · 3 layers</option><option value="garden">Open Garden · 1 layer</option></select></label><button type="button" id="turtle-new">New solvable deal</button><button type="button" id="turtle-restart">Restart layout</button></div>
 <div class="turtle-hud"><strong id="turtle-remaining">144 tiles remain</strong><span id="turtle-pairs">0 / 72 pairs</span><span id="turtle-available">Matching pairs: 0</span><span id="turtle-time">00:00</span></div>
 <p class="turtle-daily-banner" id="turtle-daily-banner" hidden></p>
 <div class="turtle-table"><div class="turtle-board-tools" role="group" aria-label="Turtle board controls"><button type="button" id="turtle-fit">Fit board</button><button type="button" id="turtle-zoom-out" aria-label="Zoom out">−</button><strong id="turtle-zoom-label" aria-live="off">160%</strong><button type="button" id="turtle-zoom-in" aria-label="Zoom in">+</button><span id="turtle-zoom-hint">Swipe to pan</span></div>
 <div id="turtle-board-scroll" class="turtle-board-scroll" tabindex="-1"><div id="turtle-board" class="turtle-board" role="group" aria-label="Classic Turtle Mahjong tiles"></div><div id="turtle-pause-screen" class="turtle-pause-screen" hidden><strong>Game paused</strong><span>Progress is saved in this browser.</span><button type="button" id="turtle-resume">Resume</button></div></div>
 <div class="turtle-actions"><button type="button" id="turtle-undo">↶ Undo</button><button type="button" id="turtle-hint">♧ Hint</button><button type="button" id="turtle-pause">⏸ Pause</button><button type="button" id="turtle-show-free" aria-pressed="false">Show free tiles</button><button type="button" id="turtle-sound" aria-pressed="false">Sound off</button></div>
 <p class="turtle-status" id="turtle-status" role="status" aria-live="polite">Choose two matching exposed tiles.</p></div>
 <div class="turtle-bottom"><section><h4>Your Classic record</h4><div id="turtle-record" class="turtle-record"></div><p class="turtle-local-note">This mode saves progress on this browser and device only. Mystery Road account saves and achievements are separate and untouched.</p></section><details><summary>Tile guide and keyboard controls</summary><p>Match identical numbered suits, winds, or dragons. Any two Flower tiles match; any two Season tiles match. Keyboard: arrows navigate free tiles, Enter selects, H hint, U undo, P pause, Escape clears selection.</p><div id="turtle-face-guide" class="turtle-face-guide"></div></details></div>
 <section class="turtle-awards" aria-label="Classic Turtle challenges and achievements"><div class="turtle-awards-heading">
 <div><span class="mahjong-kicker">CHALLENGES FROM EASY TO NEAR-IMPOSSIBLE</span><h4>🏆 Trophy Gallery</h4><p id="turtle-awards-count" role="status"></p></div>
 <label>Show <select id="turtle-award-filter" aria-label="Filter Classic Turtle achievements"><option value="all">All challenges</option><option value="earned">Unlocked</option><option value="extreme">Legendary and above</option></select></label></div>
 <div id="turtle-awards-list" class="turtle-awards-list"></div><button type="button" id="turtle-awards-more">Show more challenges</button>
 <p class="turtle-local-note">These Classic Turtle trophies are saved on this browser only. Mystery Road's existing account badges remain separate.</p></section>`;
 // Keep play in one viewport. Only this mode's locally-earned trophies
 // live in the expandable gallery; account campaign awards remain untouched.
 const rewardsDrawer=make('details','turtle-rewards-drawer');
 rewardsDrawer.id='turtle-rewards-drawer';
 const rewardsSummary=make('summary','turtle-rewards-summary','🏆 TURTLE TROPHIES · VIEW MASTERY TRIALS');
 rewardsDrawer.append(rewardsSummary,section.querySelector('.turtle-bottom'),section.querySelector('.turtle-awards'));
 section.append(rewardsDrawer);
 inside.prepend(section);inside.prepend(tabs);
 const view=sel=>$(section,sel);
 function status(msg){lastStatus=msg;const el=view('#turtle-status');if(el)el.textContent=msg;}
 function sound(kind){playMahjongSound(kind,prefs.sound);}
 function current(){return activeKind==='daily'?saved.dailies[utcDailyKey()]:saved.free;}
 function ensureGame(){
  if(activeKind==='daily'){
   const day=utcDailyKey();
   if(!validateGame(saved.dailies[day])){saved.dailies[day]=newGame('daily','turtle',dailyDealSeed(day),day);persist();}
   return saved.dailies[day];
  }
  if(!validateGame(saved.free)){saved.free=newGame('free','turtle',nextSeed());persist();}
  return saved.free;
 }
 function details(){const game=ensureGame();const valid=validateGame(game);
  if(!valid)throw new Error('Turtle game recovery failed');return valid;}
 function recordWin(game){
  const record={kind:game.kind,layout:game.layout,date:game.date||null,elapsed:game.elapsed,hints:game.hints,moves:game.moves.length,completedAt:game.completedAt};
  if(saved.history.some(r=>r.kind===record.kind&&r.layout===record.layout&&r.completedAt===record.completedAt))return;
  saved.history.unshift(record);
  // Count a signature once, at full-board victory, never on a partial match.
  // Older histories stay intact; rituals are not fabricated retroactively.
  const deal=buildTurtleDeal(game.layout,game.seed);
  const pairKind=pair=>faceById(deal.tiles[pair[0]].face).kind;
  const opener=pairKind(game.moves[0]),closer=pairKind(game.moves.at(-1));
  stats['ritualOpen_'+opener]=(stats['ritualOpen_'+opener]||0)+1;
  stats['ritualClose_'+closer]=(stats['ritualClose_'+closer]||0)+1;
  if(new Set(game.moves.slice(0,4).map(pairKind)).size===4)stats.ritualFourfold++;
  if(new Set(game.moves.slice(0,12).map(pairKind)).size===7)stats.ritualSevenfold++;
  stats.wins++;
  stats['layout'+game.layout+'Wins']++;
  if(game.misses===0&&game.hints===0&&game.undos===0)stats.flawlessWins++;
  if(game.hints===0&&game.undos===0)stats.unassistedWins++;
  if(game.undos===0)stats.noUndoWins++;
  if(game.pauses===0)stats.noPauseWins++;
  if(game.elapsed>0&&(stats.bestWinSeconds===0||game.elapsed<stats.bestWinSeconds))stats.bestWinSeconds=game.elapsed;
  if(game.kind==='daily'&&game.date!==stats.lastDailyDate){
    const previous=stats.lastDailyDate?Date.parse(stats.lastDailyDate+'T00:00:00Z'):NaN;
    const date=Date.parse(game.date+'T00:00:00Z');
    stats.dailyChain=Number.isFinite(previous)&&date-previous===86400000?stats.dailyChain+1:1;
    stats.lastDailyDate=game.date;stats.dailyWins++;
  }
 }
 function startFree(){
  const previous=saved.free;
  if(previous&&!previous.completedAt&&previous.moves?.length&&!window.confirm('Replace your current Free Play board? Its in-progress moves cannot be recovered.'))return;
  const layout=view('#turtle-layout').value;
  saved.free=newGame('free',layout,nextSeed());activeKind='free';selected=null;highlight=[];persist();render();status('New solvable deal ready. No shuffles in Classic mode.');
 }
 function restart(){
  const game=ensureGame();
  if(game.moves.length&&!window.confirm('Restart this same solvable layout and erase your current moves?'))return;
  const newer=newGame(game.kind,game.layout,game.seed,game.date||null);
  if(game.kind==='daily')saved.dailies[game.date]=newer;else saved.free=newer;
  selected=null;highlight=[];persist();render();status('Same deal restarted from the beginning.');
 }
 function setKind(kind){
  if(kind!=='daily'&&kind!=='free')return;
  activeKind=kind;selected=null;highlight=[];ensureGame();render();status(kind==='daily'?'Today’s shared deal is ready. No shuffle.':'Free Play board resumed.');
 }
 function toggleMode(next){
  if(next!=='road'&&next!=='turtle')return;
  mode=next;root.dataset.mahjongMode=next;
  for(const button of tabs.querySelectorAll('button[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===next));
  savePrefs();
  if(next==='turtle')render();
 }
 function hint(){
  const {game,deal,removed}=details();
  if(game.paused||game.completedAt)return;
  const possible=availablePairs(deal.tiles,removed);
  if(!possible.length){status('No available pairs. Undo a move or restart this deal. Classic mode never shuffles.');return;}
  // Prefer the original guaranteed solution path when its next pair is still available.
  const match=deal.witness.find(([a,b])=>!removed.has(a)&&!removed.has(b)&&pairIsLegal(deal,removed,a,b));
  highlight=match||possible[0];game.hints=(game.hints||0)+1;game.streak=0;game.fastStreak=0;persist();render();sound('select');
  status('Highlighted one available pair. A hint cannot guarantee that every future choice stays solvable.');
 }
 function undo(){
  const game=ensureGame();
  if(game.paused||game.completedAt||!game.moves.length)return;
  game.moves.pop();game.undos=(game.undos||0)+1;game.streak=0;game.fastStreak=0;selected=null;highlight=[];persist();render();status('Last pair restored.');
 }
 function togglePause(force){
  const game=ensureGame();if(game.completedAt)return;
  const next=typeof force==='boolean'?force:!game.paused;
  if(next&&!game.paused)game.pauses=(game.pauses||0)+1;
  game.paused=next;selected=null;highlight=[];persist();render();status(game.paused?'Paused and saved on this device.':'Resumed. Good luck!');
 }
 function choose(id){
  const {game,deal,removed}=details();
  if(game.paused||game.completedAt)return;
  const tile=deal.tiles[id];
  if(!isFreeTile(deal.tiles,tile,removed)){game.misses=(game.misses||0)+1;stats.mistakes++;game.streak=0;game.fastStreak=0;persist();sound('blocked');status('Tile is blocked. Free one of its sides and clear any tiles above it.');return;}
  if(selected===id){selected=null;highlight=[];render();status('Selection cleared.');return;}
  if(selected===null){selected=id;highlight=[];render();sound('select');status(`${faceById(tile.face).label} selected. Find a matching free tile.`);return;}
  if(!pairIsLegal(deal,removed,selected,id)){
   game.misses=(game.misses||0)+1;stats.mistakes++;game.streak=0;game.fastStreak=0;
   selected=id;highlight=[];persist();render();sound('blocked');status('Tiles do not match. Selection moved to the new tile.');return;
  }
  const matchedKind=faceById(deal.tiles[selected].face)?.kind;
  game.moves.push([selected,id]);selected=null;highlight=[];
  const now=Date.now();
  game.fastStreak=game.lastMatchAt&&now-game.lastMatchAt<=6000?(game.fastStreak||1)+1:1;
  game.lastMatchAt=now;game.streak=(game.streak||0)+1;
  stats.bestStreak=Math.max(stats.bestStreak,game.streak);
  stats.bestRush=Math.max(stats.bestRush,game.fastStreak);
  // Never award cumulative pairs twice simply by undoing and replaying the same point.
  if(game.moves.length>(game.highestPairs||0)){
   game.highestPairs=game.moves.length;stats.pairs++;
   if(matchedKind&&Object.hasOwn(stats,matchedKind+'Pairs'))stats[matchedKind+'Pairs']++;
  }
  if(game.moves.length===72){game.completedAt=new Date().toISOString();recordWin(game);}
  const newAwards=freshlyEarned(stats,saved.achievements);
  if(newAwards.length)saved.achievements.push(...newAwards.map(a=>a.id));
  persist();render();
  const rush=[3,5,8,12,20,36,50,72].includes(game.fastStreak);
  const streak=[3,5,8,12,20,36,50,72].includes(game.streak);
  const best=newAwards.slice().sort((a,b)=>awardLevel(b.grade)-awardLevel(a.grade))[0];
  const effect=game.completedAt||best&&awardLevel(best.grade)>=7?'confetti':'sparkles';
  if(game.completedAt)celebrateMahjong(section,{title:'TURTLE MASTER!',subtitle:'144 tiles cleared · '+duration(game.elapsed),grade:'Celestial',effect});
  else if(best)celebrateMahjong(section,{title:newAwards.length>1?'GREAT JOB!':'ACHIEVEMENT UNLOCKED!',subtitle:best.title+(newAwards.length>1?' · +'+(newAwards.length-1)+' more':''),grade:best.grade,effect});
  else if(rush)celebrateMahjong(section,{title:game.fastStreak>=12?'LIGHTNING HANDS!':'SPEED BURST!',subtitle:game.fastStreak+' fast matches in a row',grade:'Gold',effect:'sparkles'});
  else if(streak)celebrateMahjong(section,{title:game.streak>=12?'UNSTOPPABLE!':'GREAT JOB!',subtitle:game.streak+' clean matches in a row',grade:'Silver',effect:'sparkles'});
  if(game.completedAt)sound('win');
  else if(best)sound(awardLevel(best.grade)>=7?'legendary':'award');
  else if(rush)sound('rush');
  else if(streak)sound('streak');
  else sound('match');
  status(game.completedAt?`Victory! All 144 tiles cleared in ${duration(game.elapsed)}. Your result is saved on this device.`:
    best?'Unlocked '+newAwards.length+' new Classic trophy'+(newAwards.length===1?'':'ies')+'!':
    rush?'Lightning hands! '+game.fastStreak+' fast matches without a mistake.':
    streak?'Great job! '+game.streak+' correct matches in a row.':'Pair matched!');
 }
 function faceNode(tile,removed,free,sz){
  const face=faceById(tile.face),button=make('button','turtle-tile');
  button.type='button';button.dataset.tileId=String(tile.id);
  button.classList.toggle('is-free',free);button.classList.toggle('is-blocked',!free);
  button.classList.toggle('is-selected',selected===tile.id);
  button.classList.toggle('is-hinted',highlight.includes(tile.id));
  button.style.width=sz+'px';button.style.height=Math.round(sz*HEIGHT)+'px';
  button.style.left=Math.round(8+(tile.x+tile.z*.07)*sz)+'px';
  button.style.top=Math.round(14+(tile.y-tile.z*.12)*sz*HEIGHT)+'px';
  button.style.zIndex=String(10+tile.z*1000+Math.round(tile.y*10));
  button.setAttribute('aria-label',face.label+', layer '+(tile.z+1)+', '+(free?'free':'blocked'));
  // No native long-press tooltip over the board; the accessible name already describes the tile.
  if(prefs.showFree&&free)button.classList.add('show-free');
  button.append(tileArtwork(face));
  button.addEventListener('click',()=>choose(tile.id));
  return button;
 }
 function renderBoard(deal,removed,paused){
  const host=view('#turtle-board'),scroller=view('#turtle-board-scroll');
  if(!host)return;
  const maxX=Math.max(...deal.tiles.map(t=>t.x)),maxY=Math.max(...deal.tiles.map(t=>t.y));
  const usableWidth=Math.max(150,scroller.clientWidth||window.innerWidth-38);
  const usableHeight=Math.max(140,scroller.clientHeight||window.innerHeight*.4);
  // Fit both axes, including the iPhone's smaller visible height.
  const fitSize=Math.max(12,Math.floor(Math.min(
   (usableWidth-24)/(maxX+1.15),
   (usableHeight-37)/((maxY+1.12)*HEIGHT)
  )));
  const sz=Math.min(85,Math.round(fitSize*ZOOMS[zoom]));
  scroller.classList.toggle('is-magnified',zoom>0);
  host.style.setProperty('--turtle-tile-size',sz+'px');
  host.style.width=Math.ceil(24+(maxX+1.08)*sz)+'px';
  host.style.height=Math.ceil(37+(maxY+1.12)*HEIGHT*sz)+'px';
  const last=host.contains(document.activeElement)?document.activeElement.dataset.tileId:null;
  const remaining=deal.tiles.filter(t=>!removed.has(t.id));
  const free=remaining.filter(t=>isFreeTile(deal.tiles,t,removed));
  const focusId=free.find(t=>String(t.id)===last)?.id??free.find(t=>t.id===selected)?.id??free[0]?.id;
  const fragment=document.createDocumentFragment();
  for(const tile of remaining){const isFree=free.some(f=>f.id===tile.id);const button=faceNode(tile,removed,isFree,sz);button.tabIndex=tile.id===focusId?0:-1;fragment.append(button);}
  host.replaceChildren(fragment);
  view('#turtle-zoom-label').textContent=zoom===0?'FIT':Math.round(ZOOMS[zoom]*100)+'%';
  view('#turtle-zoom-out').disabled=zoom===0;view('#turtle-zoom-in').disabled=zoom===ZOOMS.length-1;
  const pauseOverlay=view('#turtle-pause-screen');pauseOverlay.hidden=!paused;
  host.inert=paused;host.setAttribute('aria-hidden',String(paused));
  if(last&&!paused&&focusId!==undefined)host.querySelector(`[data-tile-id="${focusId}"]`)?.focus({preventScroll:true});
 }
 function render(){
  if(destroyed||mode!=='turtle')return;
  const {game,deal,removed}=details();
  for(const b of section.querySelectorAll('button[data-kind]'))b.setAttribute('aria-pressed',String(b.dataset.kind===activeKind));
  view('#turtle-layout').disabled=activeKind==='daily';
  view('#turtle-layout').value=game.layout;
  view('#turtle-new').disabled=activeKind==='daily';
  view('#turtle-new').textContent=activeKind==='daily'?'Daily deal fixed':'New solvable deal';
  view('#turtle-remaining').textContent=(144-removed.size)+' tiles remain';
  view('#turtle-pairs').textContent=game.moves.length+' / 72 pairs';
  const pairs=availablePairs(deal.tiles,removed);
  view('#turtle-available').textContent='Matching pairs: '+pairs.length;
  view('#turtle-time').textContent=duration(game.elapsed);
  const daily=view('#turtle-daily-banner');daily.hidden=activeKind!=='daily';
  if(activeKind==='daily')daily.textContent='Daily challenge · '+dateLabel(game.date)+' (UTC) · one shared, guaranteed-solvable starting deal';
  view('#turtle-pause').textContent=game.paused?'▶ Resume':'⏸ Pause';
  view('#turtle-pause').disabled=Boolean(game.completedAt);
  view('#turtle-undo').disabled=game.paused||Boolean(game.completedAt)||!game.moves.length;
  view('#turtle-hint').disabled=game.paused||Boolean(game.completedAt)||!pairs.length;
  view('#turtle-show-free').setAttribute('aria-pressed',String(prefs.showFree));
  view('#turtle-show-free').textContent=prefs.showFree?'Free tiles shown':'Show free tiles';
  view('#turtle-sound').setAttribute('aria-pressed',String(prefs.sound));
  view('#turtle-sound').textContent=prefs.sound?'Sound on':'Sound off';
  renderBoard(deal,removed,game.paused);
  const wins=saved.history.filter(x=>x.kind===activeKind),best=wins.length?Math.min(...wins.map(x=>x.elapsed)):null;
  const dailyWins=new Set(saved.history.filter(x=>x.kind==='daily').map(x=>x.date));
  view('#turtle-record').replaceChildren(make('span','',`Wins: ${wins.length}`),make('span','',`Best: ${best===null?'—':duration(best)}`),make('span','',`Daily clears: ${dailyWins.size}`));
  renderAchievements();
  if(game.completedAt)status('Board cleared! Start a fresh Free Play deal or return for tomorrow’s Daily Challenge.');
  else if(!pairs.length)status('No legal pairs remain. Classic Turtle has no shuffle. Undo or restart this same deal.');
  else if(!lastStatus)status('Choose two matching free tiles.');
 }
 function renderAchievements(){
  const earned=new Set(saved.achievements),filter=awardFilter;
  const available=CLASSIC_AWARDS.filter(a=>filter==='earned'?earned.has(a.id):filter==='extreme'?awardLevel(a.grade)>=7:true);
  available.sort((a,b)=>Number(earned.has(b.id))-Number(earned.has(a.id))||awardLevel(a.grade)-awardLevel(b.grade));
  view('#turtle-awards-count').textContent=earned.size+' / '+CLASSIC_AWARDS.length+' Turtle-only trophies unlocked · '+available.length+' shown';
  rewardsSummary.textContent='🏆 TURTLE TROPHIES · '+earned.size+' / '+CLASSIC_AWARDS.length+' UNLOCKED · OPEN GALLERY';
  const list=view('#turtle-awards-list');list.replaceChildren();
  for(const award of available.slice(0,awardLimit)){
   const unlocked=earned.has(award.id);
   const box=make('article','turtle-award '+(unlocked?'is-earned':'is-locked'));box.dataset.grade=award.grade.toLowerCase();
   const emblem=make('span','turtle-award-icon',unlocked?'★':'◇');
   const caption=make('div','turtle-award-copy');
   caption.append(make('strong','',award.title),make('small','',award.grade+' · '+award.description));
   const progress=make('progress','');progress.max=award.unit==='seconds'?1:award.target;
   progress.value=unlocked?progress.max:Math.min(progress.max,awardMetric(stats,award));
   progress.setAttribute('aria-label',award.title+' progress');
   caption.append(progress);box.append(emblem,caption);list.append(box);
  }
  view('#turtle-awards-more').hidden=available.length<=awardLimit;
  view('#turtle-awards-more').textContent='Show more challenges ('+Math.max(0,available.length-awardLimit)+' left)';
 }
 const faceGuide=view('#turtle-face-guide');
 for(const face of TURTLE_FACES){const swatch=make('div','turtle-guide-tile');swatch.append(tileArtwork(face),make('small','',face.label));faceGuide.append(swatch);}
 tabs.addEventListener('click',event=>{const btn=event.target.closest('button[data-mode]');if(btn)toggleMode(btn.dataset.mode);});
 section.querySelector('.turtle-modes').addEventListener('click',event=>{const btn=event.target.closest('button[data-kind]');if(btn)setKind(btn.dataset.kind);});
 view('#turtle-new').addEventListener('click',startFree);
 view('#turtle-restart').addEventListener('click',restart);
 view('#turtle-layout').addEventListener('change',event=>{
  const layout=event.target.value;
  if(activeKind!=='free')return;
  const game=ensureGame();
  if(layout===game.layout)return;
  if(game.moves.length&&!window.confirm('Change layout and replace the current Free Play board?')){event.target.value=game.layout;return;}
  saved.free=newGame('free',layout,nextSeed());selected=null;highlight=[];persist();render();status('Layout changed. A new solvable deal is ready.');
 });
 view('#turtle-pause').addEventListener('click',()=>togglePause());
 view('#turtle-resume').addEventListener('click',()=>togglePause(false));
 view('#turtle-undo').addEventListener('click',undo);
 view('#turtle-hint').addEventListener('click',hint);
 view('#turtle-show-free').addEventListener('click',()=>{prefs.showFree=!prefs.showFree;savePrefs();render();});
 view('#turtle-sound').addEventListener('click',()=>{prefs.sound=!prefs.sound;savePrefs();render();sound('select');});
 view('#turtle-award-filter').addEventListener('change',event=>{awardFilter=event.target.value;awardLimit=30;renderAchievements();});
 view('#turtle-awards-more').addEventListener('click',()=>{awardLimit+=30;renderAchievements();});
 const changeZoom=z=>{zoom=Math.max(0,Math.min(ZOOMS.length-1,z));render();};
 view('#turtle-fit').addEventListener('click',()=>changeZoom(0));
 view('#turtle-zoom-out').addEventListener('click',()=>changeZoom(zoom-1));
 view('#turtle-zoom-in').addEventListener('click',()=>changeZoom(zoom+1));
 const keyHandler=event=>{
  if(mode!=='turtle'||event.altKey||event.metaKey||event.ctrlKey||event.isComposing||event.target.closest('input,textarea,select,[contenteditable]'))return;
  const action={h:'#turtle-hint',u:'#turtle-undo',p:'#turtle-pause'}[event.key.toLowerCase()];
  if(action){const button=view(action);if(!button.disabled){event.preventDefault();event.stopPropagation();button.click();}return;}
  if(event.key==='Escape'&&selected!==null){selected=null;highlight=[];render();event.preventDefault();event.stopPropagation();return;}
  if(!/^Arrow(Left|Right|Up|Down)$/.test(event.key))return;
  const origin=event.target.closest('button[data-tile-id]');if(!origin||!section.contains(origin))return;
  const {deal,removed}=details(),o=deal.tiles[Number(origin.dataset.tileId)];
  if(!o)return;
  const [dx,dy]={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  let best=null,score=Infinity;
  for(const tile of deal.tiles){if(tile.id===o.id||!isFreeTile(deal.tiles,tile,removed))continue;
   const x=tile.x-o.x,y=tile.y-o.y,forward=x*dx+y*dy,cross=Math.abs(x*dy-y*dx);
   if(forward<=.05)continue;
   const metric=forward**2+cross**2*3+Math.abs(tile.z-o.z)*.25;
   if(metric<score){score=metric;best=tile;}
  }
  if(best){event.preventDefault();event.stopPropagation();origin.tabIndex=-1;const dest=view('#turtle-board').querySelector(`[data-tile-id="${best.id}"]`);if(dest){dest.tabIndex=0;dest.focus();}}
 };
 section.addEventListener('keydown',keyHandler);
 // The Arcade scene switcher belongs to Mystery Road; show those records only
 // after leaving Classic Play, never expose unrelated campaign pages as Turtle stats.
 const arcadeSceneWatcher=new MutationObserver(()=>{
  if(mode==='turtle'&&document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='mahjong'&&document.body.dataset.arcadeScene!=='play')toggleMode('road');
 });
 arcadeSceneWatcher.observe(document.body,{attributes:true,attributeFilter:['data-arcade-scene','data-arcade-game']});
 clock=window.setInterval(()=>{
  if(destroyed||mode!=='turtle'||inside.hidden||document.hidden)return;
  const game=current();if(!game||game.paused||game.completedAt)return;
  game.elapsed+=1;view('#turtle-time').textContent=duration(game.elapsed);
  if(game.elapsed%5===0)persist();
 },1000);
 if('ResizeObserver' in window){resize=new ResizeObserver(()=>{if(mode==='turtle'&&!inside.hidden)render();});resize.observe(view('#turtle-board-scroll'));}
 toggleMode(mode);
 return ()=>{destroyed=true;if(clock)window.clearInterval(clock);resize?.disconnect();arcadeSceneWatcher.disconnect();persist();section.remove();tabs.remove();delete root.dataset.mahjongMode;};
}