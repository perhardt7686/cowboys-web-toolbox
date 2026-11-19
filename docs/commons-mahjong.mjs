/* Mystery Machine Mahjong for approved Commons members. Server validates every move. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {isTileFree,countLegalPairs,adjacentMahjongTile} from './mahjong-moves.mjs?v=keyboard1';
import {visualForTile} from './mahjong-kids-palette.mjs?v=kid7';
import {addClassicTileArtwork,classicFaceForTile,playMahjongSound} from './mahjong-classic-tiles.mjs?v=classic1';
import {mountClassicTurtle} from './mahjong-turtle-ui.mjs?v=turtle2';
import {mountNatureRoad,MYSTERY_ROAD_TOTAL,roadRegion,roadEncounter} from './mahjong-nature-road.mjs?v=nature1';
import {celebrateMahjong} from './mahjong-classic-awards.mjs';
const board=document.getElementById('conversations');
const config=window.COWBOY_COMMUNITY_CONFIG;
const SKINS=[
 ['龍','Crimson dragon','ruby'],['❀','Blue blossom','violet'],['竹','Bamboo','jade'],
 ['東','East wind','ink'],['發','Fortune','jade'],['中','Red center','ruby'],
 ['🐉','Guardian dragon','ruby'],['✿','Wildflower','violet'],['🌊','Blue wave','azure'],
 ['南','South wind','ink'],['☯','Balance','ink'],['🌸','Cherry flower','rose'],
 ['🐟','Koi fish','azure'],['北','North wind','ink'],['❈','Frost bloom','azure'],
 ['西','West wind','ink'],['☘','Clover','jade'],['★','Starlight','gold']
];
const ACHIEVEMENTS=[
 ['first_pair','First Match','Remove your first matching pair','✦'],
 ['ten_pairs','Quick Fingers','Clear 10 pairs across games','⚡'],
 ['fifty_pairs','Tile Tracker','Clear 50 pairs','✿'],
 ['century','Century Club','Clear 100 pairs','♛'],
 ['first_win','First Victory','Complete a whole board','🏆'],
 ['triple_crown','Triple Crown','Win three games','♕'],
 ['ten_wins','Grand Master','Win ten games','✧'],
 ['unassisted','Sharp Eyes','Win without using help','👁'],
 ['speedster','Lightning Round','Win in less than 3 minutes','⚡'],
 ['five_thousand','High Roller','Earn 5,000 points in one game','★'],
 ['campaign_5','Roadside Explorer','Clear level 5','🚐'],
 ['campaign_10','Mystery Mile Master','Clear level 10','🏁'],
 ['campaign_25','Fog Hunter','Clear level 25','🌫'],
 ['campaign_50','Orchard Exorcist','Clear level 50','✦'],
 ['campaign_100','Phantom Conqueror','Clear level 100','👑'],
 ['campaign_250','Lagoon Sovereign','Clear level 250','🌊'],
 ['campaign_500','Midnight Myth','Clear level 500','🌙'],
 ['campaign_1000','The Vanishing Crown','Clear original 1,000-level journey','♛'],
 ['campaign_1500','Moss Monarch','Reach garden level 1,501','🌿'],
 ['campaign_2000','Rose Crown','Reach garden level 2,001','🌹'],
 ['campaign_2500','Lantern Keeper','Reach garden level 2,501','✨'],
 ['campaign_3000','Copperwood Royalty','Reach garden level 3,001','🍁'],
 ['campaign_3500','Winter Bloom','Reach garden level 3,501','❄️'],
 ['campaign_4000','Canopy Sovereign','Reach garden level 4,001','🦜'],
 ['campaign_4500','Aurora Gardener','Reach garden level 4,501','🌸'],
 ['campaign_5000','Evergreen Crown','Conquer all 5,000 levels','👑']
];
if(board&&config?.enabled===true&&location.pathname.endsWith('community.html')){
 let client=null,userId=null,state=null,mounted=false,busy=false,expanded=false,selected=null,highlight=[],timer=null,resize=null,refreshing=false;
 let dialogTimer=null,turtleCleanup=null,natureRoad=null;
 const prefsKey='cowboy-mahjong-display-v1';
 function loadPrefs(){
  try{const s=JSON.parse(window.localStorage.getItem(prefsKey)||'{}');return {tileset:s.tileset==='family'?'family':'classic',sound:s.sound===true,showFree:s.showFree===true};}
  catch{return {tileset:'classic',sound:false,showFree:false};}
 }
 let prefs=loadPrefs(),sessionSeconds=0,sessionRunKey=null,clockTimer=null;
 function savePrefs(){try{window.localStorage.setItem(prefsKey,JSON.stringify(prefs));}catch{}}
 function sound(kind){playMahjongSound(kind,prefs.sound);}
 function showPrefs(){
  const root=$('mahjong-root');if(!root)return;
  root.dataset.tileset=prefs.tileset;root.dataset.highlightFree=String(prefs.showFree);
  const theme=$('mahjong-tileset'),audio=$('mahjong-sound'),free=$('mahjong-show-free');
  if(theme){theme.textContent=prefs.tileset==='classic'?'🀄 Classic tiles':'🎨 Family tiles';theme.setAttribute('aria-pressed',String(prefs.tileset==='classic'));}
  if(audio){audio.textContent=prefs.sound?'🔊 Sound on':'🔇 Sound off';audio.setAttribute('aria-pressed',String(prefs.sound));}
  if(free){free.textContent=prefs.showFree?'✓ Free tiles on':'◯ Show free';free.setAttribute('aria-pressed',String(prefs.showFree));}
 }
 function syncSessionClock(){
  const r=state?.run,key=r?String(r.id||r.started_at||r.level||'active'):null;
  if(key!==sessionRunKey){sessionSeconds=0;sessionRunKey=key;}
  const el=$('mahjong-session-time');
  if(el)el.textContent='Session '+String(Math.floor(sessionSeconds/60)).padStart(2,'0')+':'+String(sessionSeconds%60).padStart(2,'0');
 }
 // Default = entire board in view. Opt-in zoom keeps touch targets legible.
 let boardZoomIndex=0;
 const boardZoomLevels=[1,1.25,1.55,1.9];
 const $=id=>document.getElementById(id);
 const node=(tag,cls='',txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
 const setStatus=(txt)=>{const n=$('mahjong-status');if(n)n.textContent=txt;};
 const stat=n=>Number(n||0).toLocaleString('en-US');
 const skin=s=>SKINS[(Math.max(1,Number(s||1))-1)%SKINS.length];
 const mark=s=>Number(s)>18?'☀':'✿';
 const canPlay=t=>t&&!t.gone&&isFree(state?.run?.tiles||[],t);
 function isFree(tiles,t){return isTileFree(tiles,t);}
 function locate(){const main=board.querySelector('.community-main'),root=$('mahjong-root'),plate=$('plate-game-root');if(!root||!main)return;if(plate&&root.previousElementSibling!==plate)plate.after(root);else if(!plate&&root.parentElement!==main)main.prepend(root);}
 function frame(){
  if($('mahjong-root'))return;
  const main=board.querySelector('.community-main');if(!main)return;
  const root=node('section','mahjong-game');root.id='mahjong-root';
  root.innerHTML=`<button id="mahjong-toggle" type="button" class="mahjong-entry-button" aria-expanded="false" aria-controls="mahjong-inside"><span class="mahjong-entry-icon" aria-hidden="true">🀄</span><span class="mahjong-entry-copy"><strong>Mahjong Solitaire</strong><small id="mahjong-button-score">Mystery Machine · High scores & badges</small></span><span class="mahjong-chevron" aria-hidden="true">▾</span></button>
  <button type="button" class="mahjong-classic-launch" id="mahjong-classic-launch" aria-controls="mahjong-inside" aria-expanded="false">
   <span class="mahjong-classic-launch-symbol" aria-hidden="true">✦ 🀄 ✦</span>
   <span><strong>PLAY CLASSIC TURTLE</strong><small>144 TILES · 5 LAYERS · NEW TROPHIES</small></span>
   <span class="mahjong-classic-launch-arrow" aria-hidden="true">▶</span>
  </button>
  <div id="mahjong-inside" hidden>
   <section class="commons-score-ribbon" aria-label="Live Mahjong scores" aria-live="polite">
    <div class="commons-score-tile is-record"><span class="commons-score-label">RECORD RUN</span><strong id="mahjong-ribbon-record">…</strong><small id="mahjong-ribbon-holder">Best completed game</small></div>
    <div class="commons-score-tile is-personal"><span class="commons-score-label">YOUR BEST RUN</span><strong id="mahjong-ribbon-mine">…</strong><small>Personal completed game record</small></div>
    <div class="commons-score-tile is-live"><span class="commons-score-label">CURRENT RUN</span><strong id="mahjong-ribbon-current">…</strong><small id="mahjong-ribbon-current-note">No game in progress</small></div>
   </section>
   <div class="mahjong-head"><div><div class="mahjong-kicker">THE COMMONS · MYSTERY MACHINE EDITION</div><h2>Mahjong Solitaire</h2><p>Match two identical free tiles with the same sun or flower corner. A tile is free if nothing covers it and either horizontal side is open. Switch between traditional-style ivory tiles and the colorful family set. Hint highlights a matching pair.</p></div><div class="mahjong-award">🏆 <span>High scores & badges</span></div></div>
   <section class="mahjong-campaign" aria-label="Mahjong campaign"><div class="mahjong-campaign-heading"><div><span class="mahjong-kicker">THE 1,000-LEVEL MYSTERY ROAD</span><h3 id="mahjong-level-name">Your next adventure</h3></div><strong id="mahjong-level-number">Level 1 / 5000</strong></div>
   <div id="mahjong-nature-map-host"></div>
   <progress id="mahjong-progress" max="5000" value="0" aria-label="Mystery Road levels completed"></progress><div class="mahjong-campaign-line" id="mahjong-level-rules"></div><div class="mahjong-campaign-line" id="mahjong-level-streak"></div><p id="mahjong-campaign-goal">Twenty living gardens await, with the Evergreen Crown at level 5,000.</p><details id="mahjong-level-browser"><summary id="mahjong-browse-level">Browse campaign levels</summary><form id="mahjong-level-form"><label>Level <input name="level" type="number" required min="1" max="5000" value="1"></label><button type="submit">See level rules</button></form><p id="mahjong-lookup-result" role="status">Campaign stages unlock in order.</p></details></section>
   <div id="mahjong-stats" class="mahjong-stats" aria-live="polite"></div>
   <div class="mahjong-game-zone"><div id="mahjong-journey-mini" class="mahjong-journey-mini" aria-label="Mystery Road progress"><span id="mahjong-journey-mini-name">Daisy Lane · Level 1 of 5,000</span><progress id="mahjong-journey-mini-progress" value="0" max="5000" aria-label="Garden journey progress"></progress><button type="button" id="mahjong-journey-mini-map">🌿 VIEW GARDEN MAP</button></div><div class="mahjong-hud"><span id="mahjong-run-title">Ready to play?</span><span id="mahjong-pairs"></span><strong id="mahjong-remaining" class="mahjong-remaining" aria-live="polite"></strong><span id="mahjong-free-count" class="mahjong-free-count">0 free matches</span><span id="mahjong-session-time" class="mahjong-free-count" title="Time spent viewing this board in this tab; not the campaign timer">Session 00:00</span></div><p id="mahjong-no-moves" class="mahjong-no-moves" aria-live="polite" role="status" hidden></p><div class="mahjong-view-tools" role="group" aria-label="Mahjong board view controls"><button type="button" id="mahjong-fit-button" aria-label="Fit entire board on screen">Fit board</button><button type="button" id="mahjong-zoom-out" aria-label="Zoom out">−</button><strong id="mahjong-zoom-label" aria-live="polite">100%</strong><button type="button" id="mahjong-zoom-in" aria-label="Zoom in">+</button></div><p class="mahjong-pan-help" id="mahjong-view-hint">Every tile visible. Zoom in for a closer look.</p><div id="mahjong-board-wrap" class="mahjong-board-wrap"><div id="mahjong-board" class="mahjong-board" role="group" aria-label="Mahjong game board"></div><div id="mahjong-pause-screen" class="mahjong-pause-screen" hidden><div class="mahjong-pause-card"><span class="mahjong-pause-symbol" aria-hidden="true">⏸</span><strong>Game paused</strong><p>Your tiles, matches, and score are saved to your Commons account.</p><button type="button" id="mahjong-overlay-resume">▶ Resume game</button></div></div></div>
   <div class="mahjong-preferences" role="group" aria-label="Mahjong appearance and feedback"><button type="button" id="mahjong-tileset" aria-pressed="true" title="Switch between classic ivory and colorful family tiles">🀄 Classic tiles</button><button type="button" id="mahjong-sound" aria-pressed="false">🔇 Sound off</button><button type="button" id="mahjong-show-free" aria-pressed="false" title="Outline all currently available tiles">◯ Show free</button></div><p class="mahjong-shortcut-hint">Keyboard: arrows to move · Enter to select · H hint · U undo · S shuffle · P pause</p><div class="mahjong-actions"><button type="button" id="mahjong-new">New game</button><button type="button" id="mahjong-pause">⏸ Pause</button><button type="button" id="mahjong-hint">💡 Hint</button><button type="button" id="mahjong-shuffle">⤨ Shuffle</button><button type="button" id="mahjong-undo">↶ Undo</button></div><p class="mahjong-status" id="mahjong-status" role="status" aria-live="polite">Tap New game to begin.</p></div>
   <div class="mahjong-bottom"><section class="mahjong-leaders"><h3>Current player levels</h3><p class="mahjong-level-help">Mystery Road levels for everyone in The Commons, updated from saved games.</p><div id="mahjong-level-list" class="mahjong-level-list" aria-live="polite"></div><div class="mahjong-score-divider" aria-hidden="true"></div><h3>High scores</h3><div id="mahjong-leader-list"></div></section><section class="mahjong-badges"><div class="mahjong-badge-head"><h3>Achievements</h3><button type="button" class="mahjong-profile-link" id="mahjong-profile-open">View on my profile ↗</button></div><div id="mahjong-achievement-list"></div></section></div>
   <section class="mahjong-history" aria-label="Mahjong run history"><div class="mahjong-history-heading"><h3>My previous games</h3><p>Finished boards and retired runs, saved automatically. Your latest game appears first.</p></div><div id="mahjong-history-list" aria-live="polite"></div></section>
   <p class="mahjong-footnote">The tile faces are original art inspired by classic browser Mahjong. This version keeps its existing 72-tile Mystery Road layouts and flower/sun matching rules, not the 144-tile traditional Turtle deal. Hints and shuffles may reduce score or be restricted by stage; your achievements and progress remain saved in your Commons account. The session clock is local to this open tab.</p>
  </div>`;
  main.prepend(root);locate();showPrefs();
  function arcadeMahjongNavigate(scene){
   if(!document.body.classList.contains('arcade-on')||document.body.dataset.arcadeGame!=='mahjong')return false;
   // Use the actual family-nav action (which synchronizes the shell's
   // private scene state) rather than mutating body.dataset.arcadeScene.
   const trigger=document.querySelector('.family-game-menu-button');
   const popup=document.getElementById('family-game-menu');
   if(!trigger||!popup)return false;
   if(popup.hidden)trigger.click();
   const label=scene==='play'?'Resume game':'Current level';
   const item=[...popup.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(label));
   if(!item)return false;
   item.click();return true;
  }
  natureRoad=mountNatureRoad($('mahjong-nature-map-host'),{onPlay:()=>{
   const arcade=document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='mahjong';
   if(arcade&&!arcadeMahjongNavigate('play'))return;
   if(state?.run){
    if(!arcade)$('mahjong-board-wrap')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
   }else $('mahjong-new')?.click();
  }});
  $('mahjong-journey-mini-map').addEventListener('click',()=>{
   if(arcadeMahjongNavigate('levels'))return;
   $('mahjong-nature-road')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  });

  $('mahjong-tileset').addEventListener('click',()=>{prefs.tileset=prefs.tileset==='classic'?'family':'classic';savePrefs();showPrefs();renderBoard();setStatus(prefs.tileset==='classic'?'Classic ivory tiles selected.':'Colorful family tiles selected.');});
  $('mahjong-sound').addEventListener('click',()=>{prefs.sound=!prefs.sound;savePrefs();showPrefs();sound('select');});
  $('mahjong-show-free').addEventListener('click',()=>{prefs.showFree=!prefs.showFree;savePrefs();showPrefs();setStatus(prefs.showFree?'All selectable tiles are outlined.':'Free-tile outlines hidden.');});
  root.addEventListener('keydown',event=>{
   if(root.dataset.mahjongMode==='turtle'||event.altKey||event.ctrlKey||event.metaKey||event.isComposing||!state?.run||busy)return;
   if(event.target.closest('input,textarea,select,[contenteditable]'))return;
   const target={h:'mahjong-hint',u:'mahjong-undo',s:'mahjong-shuffle',p:'mahjong-pause'}[event.key.toLowerCase()];
   if(event.key==='Escape'&&selected!=null){selected=null;highlight=[];renderBoard();setStatus('Selection cleared.');return;}
   if(!target)return;
   const button=$(target);if(!button||button.disabled)return;
   event.preventDefault();button.click();
  });
  const setExpanded=value=>{
   expanded=Boolean(value);$('mahjong-inside').hidden=!expanded;
   $('mahjong-toggle').setAttribute('aria-expanded',String(expanded));
   $('mahjong-classic-launch').setAttribute('aria-expanded',String(expanded&&$('mahjong-root').dataset.mahjongMode==='turtle'));
   if(expanded)display();
  };
  $('mahjong-toggle').addEventListener('click',()=>{setExpanded(!expanded);if(expanded)$('mahjong-inside').scrollIntoView({behavior:'smooth',block:'nearest'});});
  $('mahjong-classic-launch').addEventListener('click',()=>{
   setExpanded(true);
   const turtle=$('mahjong-root').querySelector('.turtle-mode-tabs button[data-mode="turtle"]');
   if(turtle)turtle.click();
   $('mahjong-classic-launch').setAttribute('aria-expanded','true');
   const target=$('mahjong-classic-root');
   if(target){target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});turtle?.focus({preventScroll:true});}
  });
  const browse=$('mahjong-level-form');
  browse.addEventListener('submit',async event=>{
   event.preventDefault();
   const level=Number(new FormData(browse).get('level'));
   const output=$('mahjong-lookup-result');
   const submit=browse.querySelector('button');
   submit.disabled=true;
   try{
    const {data,error}=await client.rpc('community_mahjong_level_rules',{p_level:level});
    if(error)throw error;
    if(!output.isConnected)return;
    const current=Number(state?.campaign?.level||state?.profile?.campaign?.level||1);
    const lock=data.level===current?'Current stage':data.level>current?'Locked until earlier stages are cleared':'Previously unlocked stage';
    const time=data.max_seconds?' · '+Math.floor(data.max_seconds/60)+':'+String(data.max_seconds%60).padStart(2,'0')+' time limit':'';
    const help=data.level>=51&&data.level<=100?'No hints or shuffles; one undo allowed':data.max_assists>=99?'Assistance allowed':data.max_assists+' assists';
    output.textContent='Level '+data.level+' · '+data.name+' · '+lock+' · '+help+time+' · ×'+data.multiplier+' points';
   }catch{output.textContent='Could not load these rules. Try again.';}
   finally{submit.disabled=false;}
  });
  $('mahjong-new').addEventListener('click',async()=>{
   if(state?.run?.pairs>0&&!confirm('Start a fresh game? Your current board will be retired, but earned achievements and high scores stay saved.'))return;
   await run('community_mahjong_start',{p_restart:Boolean(state?.run)},'A new mystery garden is ready.');
  });
  $('mahjong-hint').addEventListener('click',async()=>{const result=await run('community_mahjong_hint',{},'Hint highlighted. Tap the two glowing tiles.');if(result?.event==='no_match')setStatus('No free matching pair. Shuffle to free the board.');});
  $('mahjong-shuffle').addEventListener('click',async()=>{const data=await run('community_mahjong_shuffle',{},'Playable shuffle saved. At least one free matching pair is available.');if(data?.event==='shuffle_unavailable')setStatus('Could not build a playable shuffle. Nothing changed and no points were deducted. Try again.');});
  $('mahjong-undo').addEventListener('click',()=>run('community_mahjong_undo',{},'Last match restored (75-point penalty).'));
  $('mahjong-pause').addEventListener('click',()=>{if(!state?.run)return;const pausing=!Boolean(state.run.paused);run('community_mahjong_pause',{p_pause:pausing},pausing?'Game paused. Your progress is safely saved.':'Welcome back. Your board is ready.');});
  $('mahjong-overlay-resume').addEventListener('click',()=>run('community_mahjong_pause',{p_pause:false},'Welcome back. Your board is ready.'));
  const changeBoardZoom=delta=>{
    const next=Math.max(0,Math.min(boardZoomLevels.length-1,delta));
    if(next===boardZoomIndex)return;
    boardZoomIndex=next;
    renderBoard();
    const wrap=$('mahjong-board-wrap');
    if(wrap){
      if(boardZoomIndex===0)wrap.scrollLeft=0;
      else wrap.scrollLeft=Math.max(0,Math.round((wrap.scrollWidth-wrap.clientWidth)/2));
    }
  };
  $('mahjong-fit-button').addEventListener('click',()=>changeBoardZoom(0));
  $('mahjong-zoom-out').addEventListener('click',()=>changeBoardZoom(boardZoomIndex-1));
  $('mahjong-zoom-in').addEventListener('click',()=>changeBoardZoom(boardZoomIndex+1));
  $('mahjong-profile-open').addEventListener('click',()=>{if(userId){const el=document.createElement('button');el.dataset.memberProfile=userId;el.hidden=true;document.body.append(el);el.click();el.remove();}});
  if('ResizeObserver' in window){resize=new ResizeObserver(()=>renderBoard());resize.observe($('mahjong-board-wrap'));}
  const boardView=$('mahjong-board');
  boardView.addEventListener('keydown',event=>{
    if(busy||!state?.run||state.run.paused||!/^Arrow(Left|Right|Up|Down)$/.test(event.key))return;
    const current=event.target.closest('button[data-mahjong-id]');
    if(!current||!boardView.contains(current))return;
    event.preventDefault();
    const next=adjacentMahjongTile(state.run.tiles||[],current.dataset.mahjongId,event.key);
    if(!next)return;
    const target=boardView.querySelector('[data-mahjong-id="'+next.id+'"]');
    if(!target)return;
    current.tabIndex=-1;target.tabIndex=0;target.focus();
  });
  const watcher=new MutationObserver(()=>{if($('mahjong-root'))locate();else watcher.disconnect()});watcher.observe(main,{childList:true});
 }
 function boardTile(t,w){
  const [glyph,label,tone]=skin(t.s),visual=visualForTile(t.s);
  const b=node('button','mahjong-tile mahjong-kids-tile mahjong-tone-'+tone+' mahjong-variant-'+visual.variant);
  b.type='button';
  b.dataset.mahjongId=String(t.id);
  const classic=classicFaceForTile(t.s);
   b.setAttribute('aria-label',(prefs.tileset==='classic'?classic.name+', code '+classic.code:label+', code '+visual.code)+', '+visual.variant+' corner, '+
    (t.z?'layer '+(t.z+1):'bottom layer')+', '+(canPlay(t)?'free and available':'blocked, not playable yet'));
  b.title=(prefs.tileset==='classic'?classic.name+' · '+classic.code:label+' · '+visual.code)+' · '+visual.variant;
  b.style.setProperty('--tile-face',visual.face);
  b.style.setProperty('--tile-ink',visual.ink);
  b.style.setProperty('--tile-edge',visual.edge);
  b.style.width=w+'px';
  b.style.height=Math.round(w*1.14)+'px';
  b.style.left=Math.round(9+(t.x+.12*t.z)*w)+'px';
  b.style.top=Math.round(20+(t.y-.12*t.z)*w*1.14)+'px';
  b.style.zIndex=String(10+t.z*100+t.y);
  if(!canPlay(t))b.classList.add('mahjong-blocked');else b.classList.add('mahjong-free');
  if(selected===t.id)b.classList.add('mahjong-selected');
  if(highlight.includes(t.id))b.classList.add('mahjong-hinted');
  b.append(node('span','mahjong-glyph',glyph),node('span','mahjong-mini',mark(t.s)),
    node('span','mahjong-match-code',visual.code));
   addClassicTileArtwork(b,t.s);
  b.addEventListener('click',()=>tap(t));
  return b;
 }
 function celebratePair(point){
  sound('match');
  if(!point||!$('mahjong-root'))return;
  const zone=$('mahjong-root').querySelector('.mahjong-game-zone');
  if(!zone)return;
  const badge=node('span','mahjong-pair-celebration','✦ MATCH! ✦');
  badge.setAttribute('aria-hidden','true');
  badge.style.left=point.x+'px';
  badge.style.top=point.y+'px';
  zone.append(badge);
  badge.addEventListener('animationend',()=>badge.remove(),{once:true});
  window.setTimeout(()=>badge.remove(),1000);
 }
 function renderBoard(){const el=$('mahjong-board');if(!el||!el.isConnected||!state)return;const runState=state.run;if(!runState){el.replaceChildren(node('div','mahjong-board-empty','A mystery is waiting. Tap New game to begin.'));el.style.width='100%';el.style.minWidth='0';el.style.height='260px';return;}
  // Eight tile columns: fit the entire layout before any optional magnification.
  const wrap=$('mahjong-board-wrap');
  const arcade=document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='mahjong';
  const available=Math.max(160,(wrap?.clientWidth||el.clientWidth||360)-6);
  const availableHeight=arcade?Math.max(135,(wrap?.clientHeight||window.innerHeight-160)-6):Infinity;
  // Arcade mode is a genuine FIT view: fit all layers along both axes, not
  // just 8 columns. Zoom/panning remain available outside full-screen mode.
  const fitted=Math.max(15,Math.floor(Math.min((available-26)/8.55,(availableHeight-34)/(1.14*6.4))));
  const zoom=arcade?1:boardZoomLevels[boardZoomIndex];
  const size=Math.min(102,Math.max(15,Math.round(fitted*zoom)));
  const naturalWidth=Math.ceil(22+8.4*size);
  el.style.width=arcade?naturalWidth+'px':boardZoomIndex===0?'100%':Math.max(available,naturalWidth)+'px';
  el.style.minWidth='0';
  el.style.setProperty('--mahjong-size',size+'px');
  el.style.height=Math.ceil(34+size*1.14*6.4)+'px';
  el.style.maxHeight=arcade?availableHeight+'px':'';
  const zLabel=$('mahjong-zoom-label');if(zLabel)zLabel.textContent=arcade?'FIT':`${Math.round(boardZoomLevels[boardZoomIndex]*100)}%`;
  const zIn=$('mahjong-zoom-in');if(zIn)zIn.disabled=boardZoomIndex===boardZoomLevels.length-1;
  const zOut=$('mahjong-zoom-out');if(zOut)zOut.disabled=boardZoomIndex===0;
  const hint=$('mahjong-view-hint');if(hint)hint.textContent=boardZoomIndex===0?'Entire board visible. Use + for a closer look.':'Zoomed in. Swipe the board to explore, or tap Fit board.';
  const previous=el.contains(document.activeElement)?
    document.activeElement.closest('button[data-mahjong-id]'):null;
  const previousId=previous?.dataset.mahjongId||null;
  const free=(runState.tiles||[]).filter(canPlay);
  const preferred=free.find(t=>String(t.id)===String(previousId))||
    free.find(t=>String(t.id)===String(selected))||free[0];
  const activeId=preferred?String(preferred.id):null;
  const frag=document.createDocumentFragment();
  for(const t of runState.tiles||[]){
    if(t.gone)continue;
    const tile=boardTile(t,size);
    tile.tabIndex=canPlay(t)&&String(t.id)===activeId?0:-1;
    frag.append(tile);
  }
  el.replaceChildren(frag);
  // Redrawing after a match must not abandon keyboard and screen-reader users.
  if(previous&&activeId)
    el.querySelector('[data-mahjong-id="'+activeId+'"]')?.focus({preventScroll:true});
 }
 function tap(t){if(busy||!state?.run||state.run.paused)return;if(!canPlay(t)){sound('blocked');setStatus('That tile is blocked. Choose one with an open side and nothing on top.');return;}
  if(selected===t.id){selected=null;highlight=[];renderBoard();return;}
  if(selected==null){selected=t.id;highlight=[];renderBoard();sound('select');setStatus(`Selected ${prefs.tileset==='classic'?classicFaceForTile(t.s).name:skin(t.s)[1]}. Find its free twin with the same corner mark.`);return;}
  const first=state.run.tiles.find(o=>o.id===selected);if(!first||!canPlay(first)){selected=t.id;renderBoard();return;}
  if(first.s!==t.s){selected=t.id;highlight=[];renderBoard();setStatus('Not a match. Choose two matching free tiles.');return;}
  const a=first.id,b=t.id;
  const zone=$('mahjong-root')?.querySelector('.mahjong-game-zone');
  const button=$('mahjong-board')?.querySelector('[data-mahjong-id="'+t.id+'"]');
  const zoneBox=zone?.getBoundingClientRect(),tileBox=button?.getBoundingClientRect();
  const point=zoneBox&&tileBox?{x:tileBox.left-zoneBox.left+tileBox.width/2,y:tileBox.top-zoneBox.top+tileBox.height/2}:null;
  selected=null;highlight=[];
  void run('community_mahjong_pair',{p_a:a,p_b:b},'Nice match! The tiles have disappeared.')
    .then(result=>{
     if(!result)return;
     celebratePair(point);
     const combo=Number(result.run?.combo||0);
     if([3,5,8,12,20,30,36].includes(combo)){
      celebrateMahjong(zone,{title:combo>=12?'UNSTOPPABLE!':combo>=8?'ON FIRE!':'GREAT JOB!',
       subtitle:combo+' consecutive server-confirmed matches',grade:combo>=20?'Legendary':'Gold',
       effect:combo>=12?'confetti':'sparkles'});
      sound(combo>=12?'legendary':'streak');
     }
    });
 }
 function display(){if(!state||!$('mahjong-root'))return;const p=state.profile||{},runState=state.run,leaders=state.leaders||[],me=leaders.find(e=>e.user_id===userId),record=Math.max(0,...leaders.map(e=>Number(e.best||0)));const cp=p.campaign||state.campaign||{},rules=cp.rules||{},stage=Number(cp.level||1);
  $('mahjong-button-score').textContent=`Level ${stage}/${MYSTERY_ROAD_TOTAL} · Record ${stat(record)} · Yours ${stat(p.best_score)}`;
  const tied=leaders.filter(e=>Number(e.best||0)===record);
  $('mahjong-ribbon-record').textContent=stat(record);
  $('mahjong-ribbon-holder').textContent=record<=0?'No completed game yet':tied.length>1?'Shared record · best game':`${tied[0]?.name||'Member'} · best game`;
  $('mahjong-ribbon-mine').textContent=stat(p.best_score);
  $('mahjong-ribbon-current').textContent=runState?stat(runState.score):'—';
  $('mahjong-ribbon-current-note').textContent=runState?(runState.paused?'Paused · progress saved':`${runState.pairs||0}/36 pairs · Level ${runState.level||stage}`):'No game in progress';
  $('mahjong-level-number').textContent=`Level ${stage} / ${MYSTERY_ROAD_TOTAL}`;
  $('mahjong-level-name').textContent=rules.name||'Mystery Mile';
  $('mahjong-progress').max=MYSTERY_ROAD_TOTAL;
  $('mahjong-progress').value=Math.max(0,Math.min(MYSTERY_ROAD_TOTAL,Number(cp.cleared)||0));
  natureRoad?.update({level:stage,cleared:cp.cleared,streak:cp.streak,run:runState});
  $('mahjong-journey-mini-name').textContent=roadRegion(stage).flower+' '+roadRegion(stage).name+' · Level '+stat(stage)+' / '+stat(MYSTERY_ROAD_TOTAL);
  $('mahjong-journey-mini-progress').value=Math.min(MYSTERY_ROAD_TOTAL,Math.max(0,Number(cp.cleared)||0));
  const assists=Number(rules.max_assists??99);const clock=rules.max_seconds;
  const cap=stage>=51&&stage<=100?'No hints or shuffles; maximum one undo':assists>=99?'Practice stage: assistance allowed':assists===0?'No hints, shuffles, or undo':`At most ${assists} total hints, shuffles, or undos`;
  $('mahjong-level-rules').textContent=`${cap}${clock?` · Clear within ${Math.floor(Number(clock)/60)}:${String(Number(clock)%60).padStart(2,'0')}`:''} · ×${rules.multiplier||1} points`;
  $('mahjong-level-streak').textContent=`Levels cleared: ${stat(cp.cleared)} · Qualifying streak: ${stat(cp.streak)}${rules.required_streak?` · Crown requires ${rules.required_streak}+ consecutive qualifying clears`:''}`;
  $('mahjong-campaign-goal').textContent=Number(cp.cleared)>=MYSTERY_ROAD_TOTAL?
    '🌿 You have conquered all 5,000 gardens! The Evergreen Crown is yours.':
    cp.crown_earned?'♛ Vanishing Crown earned at level 1,000. Keep exploring toward the Evergreen Sanctuary at 5,000.':
    'Travel through 20 contrasting botanical worlds. Every 25th stage is a landmark; the first crown awaits at level 1,000.';
  const score=$('mahjong-stats');score.replaceChildren();for(const [label,val] of [['CURRENT RUN',stat(runState?.score)],['PERSONAL BEST',stat(p.best_score)],['ALL-TIME POINTS',stat(p.all_time_points)],['COMMONS RECORD',stat(record)]]){const c=node('div','mahjong-stat');c.append(node('small','',label),node('strong','',val));score.append(c);}
  $('mahjong-run-title').textContent=runState?`Level ${runState.level||stage} · Score ${stat(runState.score)} · Combo ${stat(runState.combo)}`:`Level ${stage}: Your next adventure`;
  $('mahjong-pairs').textContent=runState?`${runState.pairs} / 36 matched`:'';
  $('mahjong-remaining').textContent=runState?`${Math.max(0,Number(runState.remaining_pairs ?? (36-Number(runState.pairs||0))))} matches remaining`:'';
  const possible=runState?countLegalPairs(runState.tiles||[]):0;
  $('mahjong-free-count').textContent=runState?possible+' available '+(possible===1?'pair':'pairs'):'No board';
  syncSessionClock();
  const stuck=Boolean(runState&&!runState.paused&&Number(runState.remaining_pairs??36-runState.pairs)>0&&possible===0);
  const notice=$('mahjong-no-moves');
  notice.hidden=!stuck;
  if(stuck)notice.textContent='No available matching pairs. Try Shuffle to reveal a playable pair, or Undo a move. Some campaign levels may restrict assists.';
  const paused=Boolean(runState?.paused);
  $('mahjong-board-wrap').classList.toggle('is-paused',paused);
  $('mahjong-board').inert=paused;
  $('mahjong-board').setAttribute('aria-hidden',String(paused));
  $('mahjong-pause-screen').hidden=!paused;
  $('mahjong-pause').textContent=paused?'▶ Resume':'⏸ Pause';
  $('mahjong-pause').disabled=!runState||busy;
  $('mahjong-overlay-resume').disabled=busy;
  for(const id of ['mahjong-hint','mahjong-shuffle','mahjong-undo'])$(id).disabled=!runState||busy||paused;
  $('mahjong-new').textContent=runState?'Restart':'New game';$('mahjong-new').disabled=busy;
  $('mahjong-undo').disabled=!runState||runState.moves<1||busy||paused;
  renderBoard();
  const levelList=$('mahjong-level-list');levelList.replaceChildren();
  const players=Array.isArray(state.progress_leaders)?state.progress_leaders:[];
  if(!players.length)levelList.append(node('p','mahjong-empty','No player levels available yet.'));
  for(const player of players){
   const current=player.user_id===userId;
   const entry=node('div','mahjong-level-entry'+(current?' is-me':''));
   const info=node('div','mahjong-level-copy');
   const name=node('strong','mahjong-level-player',player.name||'Member');
   if(current)name.append(node('small','', ' (you)'));
   const detail=node('small','mahjong-level-caption',player.started?`${stat(player.cleared)} stages cleared · Best ${stat(player.best)} points`:'Not started');
   info.append(name,detail);
   const level=node('span','mahjong-level-pill',`Level ${Math.max(1,Number(player.level)||1)}`);
   entry.append(info,level);levelList.append(entry);
  }
  const lst=$('mahjong-leader-list');lst.replaceChildren();
  if(!leaders.length)lst.append(node('p','mahjong-empty','First completed game claims the first record.'));
  for(const [i,e] of leaders.entries()){
   const row=node('div','mahjong-leader');row.append(node('span','mahjong-rank',i===0?'♛':String(i+1)));
   const nm=node('span','mahjong-leader-name',e.name||'Member');if(e.user_id===userId)nm.append(node('small','', ' (you)'));row.append(nm);
   row.append(node('strong','',`${stat(e.best)} pts`));lst.append(row);
  }
  renderHistory(p.history||[]);
  const badges=$('mahjong-achievement-list');badges.replaceChildren();const earned=new Set((p.badges||[]).map(b=>b.code));
  for(const [code,title,description,icon] of ACHIEVEMENTS){const b=node('div','mahjong-badge '+(earned.has(code)?'earned':'locked'));
   b.append(node('span','mahjong-badge-symbol',earned.has(code)?icon:'♙'));
   const words=node('span','mahjong-badge-copy');words.append(node('strong','',title),node('small','',earned.has(code)?description:'Locked · '+description));b.append(words);badges.append(b);
  }
 }
 function renderHistory(items){
  const root=$('mahjong-history-list');if(!root)return;root.replaceChildren();
  if(!Array.isArray(items)||!items.length){root.append(node('p','mahjong-empty','No finished runs yet. Your first win will appear here.'));return;}
  const list=node('ol','mahjong-history-rows');
  for(const game of items.slice(0,15)){
   const row=node('li','mahjong-history-row');
   const title=node('div','mahjong-history-score');
   title.append(node('strong','',`${stat(game.score)} pts`),node('span','',`Level ${game.level||1} · ${game.status==='won'?'Victory':'Retired'} · ${Number(game.pairs)||0}/36 pairs`));
   let stamp='';try{const date=new Date(game.finished_at||game.started_at);if(!Number.isNaN(date.getTime()))stamp=date.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});}catch{}
   const active=Math.max(0,Number(game.active_seconds)||0);
   const duration=`${Math.floor(active/60)}:${String(active%60).padStart(2,'0')} active`;
   const extra=game.status==='won'?(game.qualified===true?'Stage cleared':game.qualified===false?'Stage retry':'Completed'):'Retired';
   const detail=node('small','',`${stamp} · ${duration} · ${extra}`);
   row.append(title,detail);list.append(row);
  }
  root.append(list);
 }
 async function refresh(silent=false){if(!client||!mounted||refreshing||busy)return;refreshing=true;try{const {data,error}=await client.rpc('community_mahjong_state');if(error)throw error;state=data;if(expanded)display();else if($('mahjong-button-score')){const p=data.profile||{},cp=p.campaign||{},leaders=data.leaders||[],record=Math.max(0,...leaders.map(e=>Number(e.best||0)));$('mahjong-button-score').textContent=`Level ${cp.level||1}/${MYSTERY_ROAD_TOTAL} · Record ${stat(record)} · Yours ${stat(p.best_score)}`;}}catch(e){if(!silent)setStatus(e.message||'Unable to refresh scores.');}finally{refreshing=false;}}
 async function run(method,params,message){if(!client||busy)return null;busy=true;for(const id of ['mahjong-new','mahjong-pause','mahjong-overlay-resume','mahjong-hint','mahjong-shuffle','mahjong-undo'])if($(id))$(id).disabled=true;setStatus('Saving your move…');
  try{const {data,error}=await client.rpc(method,params);if(error)throw error;state=data;selected=null;highlight=Array.isArray(data.hint)?data.hint:[];display();if(data.event==='won'){sound('win');setStatus(data.campaign_event==='retry'?`Board cleared, but level ${data.completed_level} requirements were missed. Replay the stage to advance.`:data.campaign_event==='advanced'?`🏆 Level ${data.completed_level} conquered! +${stat(data.campaign_bonus_earned)} campaign points. Next: level ${data.next_level}.`:'🏆 Mystery solved! Your high score and achievements are saved.');}else if(data.run&&!data.run.paused&&Number(data.run.remaining_pairs)>0&&countLegalPairs(data.run.tiles||[])===0)setStatus('No matching pairs remain on this board. Try Shuffle or Undo.');else setStatus(message);return data;}
  catch(e){setStatus('Could not save: '+(e.message||'Please retry.'));return null;}finally{busy=false;display();}
 }
 async function mount(){if(mounted||board.hidden||!client)return;const {data:{session}}=await client.auth.getSession();if(!session?.user?.id)return;
  const {data,error}=await client.rpc('community_mahjong_state');if(error)return;userId=session.user.id;state=data;mounted=true;frame();turtleCleanup=mountClassicTurtle($('mahjong-root'),{userId});display();timer=setInterval(()=>{if(!document.hidden&&mounted)refresh(true);},30000);
   clockTimer=setInterval(()=>{if(!document.hidden&&mounted&&expanded&&$('mahjong-root')?.dataset.mahjongMode!=='turtle'&&state?.run&&!state.run.paused&&!busy){sessionSeconds++;syncSessionClock();}},1000);
 }
 function unmount(){natureRoad?.destroy();natureRoad=null;turtleCleanup?.();turtleCleanup=null;mounted=false;state=null;userId=null;selected=null;highlight=[];expanded=false;if(timer){clearInterval(timer);timer=null;}if(clockTimer){clearInterval(clockTimer);clockTimer=null;}sessionRunKey=null;sessionSeconds=0;resize?.disconnect();resize=null;$('mahjong-root')?.remove();}
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const store=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const storageKey='sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(config.supabaseUrl,config.publishableKey,{auth:{storageKey,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:store}});
  let wait=null;const schedule=()=>{clearTimeout(wait);wait=setTimeout(()=>{if(board.hidden){if(mounted)unmount();}else mount().catch(()=>{});},190);};
  new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')unmount();schedule();});
  schedule();
 }catch(error){console.error('Mahjong initialization unavailable',error);}
}
