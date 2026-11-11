/* Mystery Machine Mahjong for approved Commons members. Server validates every move. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
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
 ['campaign_1000','The Vanishing Crown','Conquer all 1,000 levels','♛']
];
if(board&&config?.enabled===true&&location.pathname.endsWith('community.html')){
 let client=null,userId=null,state=null,mounted=false,busy=false,expanded=false,selected=null,highlight=[],timer=null,resize=null,refreshing=false;
 let dialogTimer=null;
 const $=id=>document.getElementById(id);
 const node=(tag,cls='',txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
 const setStatus=(txt)=>{const n=$('mahjong-status');if(n)n.textContent=txt;};
 const stat=n=>Number(n||0).toLocaleString('en-US');
 const skin=s=>SKINS[(Math.max(1,Number(s||1))-1)%SKINS.length];
 const mark=s=>Number(s)>18?'✦':'❀';
 const canPlay=t=>t&&!t.gone&&isFree(state?.run?.tiles||[],t);
 function isFree(tiles,t){return !tiles.some(o=>!o.gone&&o.z>t.z&&o.x===t.x&&o.y===t.y)&&(!tiles.some(o=>!o.gone&&o.z===t.z&&o.y===t.y&&o.x===t.x-1)||!tiles.some(o=>!o.gone&&o.z===t.z&&o.y===t.y&&o.x===t.x+1));}
 function locate(){const main=board.querySelector('.community-main'),root=$('mahjong-root'),plate=$('plate-game-root');if(!root||!main)return;if(plate&&root.previousElementSibling!==plate)plate.after(root);else if(!plate&&root.parentElement!==main)main.prepend(root);}
 function frame(){
  if($('mahjong-root'))return;
  const main=board.querySelector('.community-main');if(!main)return;
  const root=node('section','mahjong-game');root.id='mahjong-root';
  root.innerHTML=`<button id="mahjong-toggle" type="button" class="mahjong-entry-button" aria-expanded="false" aria-controls="mahjong-inside"><span class="mahjong-entry-icon" aria-hidden="true">🀄</span><span class="mahjong-entry-copy"><strong>Mahjong Solitaire</strong><small id="mahjong-button-score">Mystery Machine · High scores & badges</small></span><span class="mahjong-chevron" aria-hidden="true">▾</span></button>
  <div id="mahjong-inside" hidden>
   <section class="commons-score-ribbon" aria-label="Live Mahjong scores" aria-live="polite">
    <div class="commons-score-tile is-record"><span class="commons-score-label">RECORD RUN</span><strong id="mahjong-ribbon-record">…</strong><small id="mahjong-ribbon-holder">Best completed game</small></div>
    <div class="commons-score-tile is-personal"><span class="commons-score-label">YOUR BEST RUN</span><strong id="mahjong-ribbon-mine">…</strong><small>Personal completed game record</small></div>
    <div class="commons-score-tile is-live"><span class="commons-score-label">CURRENT RUN</span><strong id="mahjong-ribbon-current">…</strong><small id="mahjong-ribbon-current-note">No game in progress</small></div>
   </section>
   <div class="mahjong-head"><div><div class="mahjong-kicker">THE COMMONS · MYSTERY MACHINE EDITION</div><h2>Mahjong Solitaire</h2><p>Match two open tiles with identical corner marks. Clear the layered mystery garden to earn points and collect achievements.</p></div><div class="mahjong-award">🏆 <span>High scores & badges</span></div></div>
   <section class="mahjong-campaign" aria-label="Mahjong campaign"><div class="mahjong-campaign-heading"><div><span class="mahjong-kicker">THE 1,000-LEVEL MYSTERY ROAD</span><h3 id="mahjong-level-name">Your next adventure</h3></div><strong id="mahjong-level-number">Level 1 / 1000</strong></div><progress id="mahjong-progress" max="1000" value="0" aria-label="Levels completed"></progress><div class="mahjong-campaign-line" id="mahjong-level-rules"></div><div class="mahjong-campaign-line" id="mahjong-level-streak"></div><p id="mahjong-campaign-goal">The Vanishing Crown awaits at level 1000.</p></section>
   <div id="mahjong-stats" class="mahjong-stats" aria-live="polite"></div>
   <div class="mahjong-game-zone"><div class="mahjong-hud"><span id="mahjong-run-title">Ready to play?</span><span id="mahjong-pairs"></span><strong id="mahjong-remaining" class="mahjong-remaining" aria-live="polite"></strong></div><div id="mahjong-board-wrap" class="mahjong-board-wrap"><div id="mahjong-board" class="mahjong-board" role="group" aria-label="Mahjong game board"></div><div id="mahjong-pause-screen" class="mahjong-pause-screen" hidden><div class="mahjong-pause-card"><span class="mahjong-pause-symbol" aria-hidden="true">⏸</span><strong>Game paused</strong><p>Your tiles, matches, and score are saved to your Commons account.</p><button type="button" id="mahjong-overlay-resume">▶ Resume game</button></div></div></div>
   <div class="mahjong-actions"><button type="button" id="mahjong-new">New game</button><button type="button" id="mahjong-pause">⏸ Pause</button><button type="button" id="mahjong-hint">💡 Hint</button><button type="button" id="mahjong-shuffle">⤨ Shuffle</button><button type="button" id="mahjong-undo">↶ Undo</button></div><p class="mahjong-status" id="mahjong-status" role="status" aria-live="polite">Tap New game to begin.</p></div>
   <div class="mahjong-bottom"><section class="mahjong-leaders"><h3>Current player levels</h3><p class="mahjong-level-help">Mystery Road levels for everyone in The Commons, updated from saved games.</p><div id="mahjong-level-list" class="mahjong-level-list" aria-live="polite"></div><div class="mahjong-score-divider" aria-hidden="true"></div><h3>High scores</h3><div id="mahjong-leader-list"></div></section><section class="mahjong-badges"><div class="mahjong-badge-head"><h3>Achievements</h3><button type="button" class="mahjong-profile-link" id="mahjong-profile-open">View on my profile ↗</button></div><div id="mahjong-achievement-list"></div></section></div>
   <section class="mahjong-history" aria-label="Mahjong run history"><div class="mahjong-history-heading"><h3>My previous games</h3><p>Finished boards and retired runs, saved automatically. Your latest game appears first.</p></div><div id="mahjong-history-list" aria-live="polite"></div></section>
   <p class="mahjong-footnote">A tile is free when no tile covers it and at least one horizontal side is open. Match both the tile picture and its flower or sun corner mark. Hints and shuffles reduce your score, but you never lose an earned achievement. Progress is saved to your Commons account.</p>
  </div>`;
  main.prepend(root);locate();
  $('mahjong-toggle').addEventListener('click',()=>{expanded=!expanded;$('mahjong-inside').hidden=!expanded;$('mahjong-toggle').setAttribute('aria-expanded',String(expanded));if(expanded){display();$('mahjong-inside').scrollIntoView({behavior:'smooth',block:'nearest'});}});
  $('mahjong-new').addEventListener('click',async()=>{
   if(state?.run?.pairs>0&&!confirm('Start a fresh game? Your current board will be retired, but earned achievements and high scores stay saved.'))return;
   await run('community_mahjong_start',{p_restart:Boolean(state?.run)},'A new mystery garden is ready.');
  });
  $('mahjong-hint').addEventListener('click',async()=>{const result=await run('community_mahjong_hint',{},'Hint highlighted. Tap the two glowing tiles.');if(result?.event==='no_match')setStatus('No free matching pair. Shuffle to free the board.');});
  $('mahjong-shuffle').addEventListener('click',()=>run('community_mahjong_shuffle',{},'Tiles shuffled into a solvable pattern.'));
  $('mahjong-undo').addEventListener('click',()=>run('community_mahjong_undo',{},'Last match restored (75-point penalty).'));
  $('mahjong-pause').addEventListener('click',()=>{if(!state?.run)return;const pausing=!Boolean(state.run.paused);run('community_mahjong_pause',{p_pause:pausing},pausing?'Game paused. Your progress is safely saved.':'Welcome back. Your board is ready.');});
  $('mahjong-overlay-resume').addEventListener('click',()=>run('community_mahjong_pause',{p_pause:false},'Welcome back. Your board is ready.'));
  $('mahjong-profile-open').addEventListener('click',()=>{if(userId){const el=document.createElement('button');el.dataset.memberProfile=userId;el.hidden=true;document.body.append(el);el.click();el.remove();}});
  if('ResizeObserver' in window){resize=new ResizeObserver(()=>renderBoard());resize.observe($('mahjong-board'));}
  const watcher=new MutationObserver(()=>{if($('mahjong-root'))locate();else watcher.disconnect()});watcher.observe(main,{childList:true});
 }
 function boardTile(t,w){const [glyph,label,tone]=skin(t.s);const b=node('button','mahjong-tile mahjong-tone-'+tone+' '+(Number(t.s)>18?'mahjong-variant-sun':'mahjong-variant-flower'));b.type='button';b.setAttribute('aria-label',`${label}, ${Number(t.s)>18?'sun':'flower'} mark, ${t.z?'layer '+(t.z+1):'bottom layer'}, ${canPlay(t)?'free':'blocked'}`);b.title=label;b.style.width=`${w}px`;b.style.height=`${Math.round(w*1.14)}px`;b.style.left=`${Math.round(9+(t.x+.12*t.z)*w)}px`;b.style.top=`${Math.round(20+(t.y-.12*t.z)*w*1.14)}px`;b.style.zIndex=String(10+t.z*100+t.y);
  if(!canPlay(t))b.classList.add('mahjong-blocked');else b.classList.add('mahjong-free');
  if(selected===t.id)b.classList.add('mahjong-selected');if(highlight.includes(t.id))b.classList.add('mahjong-hinted');
  b.append(node('span','mahjong-glyph',glyph),node('span','mahjong-mini',mark(t.s)));
  b.addEventListener('click',()=>tap(t));return b;
 }
 function renderBoard(){const el=$('mahjong-board');if(!el||!el.isConnected||!state)return;const runState=state.run;if(!runState){el.replaceChildren(node('div','mahjong-board-empty','A mystery is waiting. Tap New game to begin.'));el.style.height='260px';return;}
  const width=Math.max(260,el.clientWidth||360);const size=Math.min(66,Math.max(27,Math.floor((width-22)/8.55)));
  el.style.setProperty('--mahjong-size',size+'px');el.style.height=Math.ceil(38+size*1.14*6.4)+'px';const frag=document.createDocumentFragment();
  for(const t of runState.tiles||[]){if(t.gone)continue;frag.append(boardTile(t,size));}el.replaceChildren(frag);
 }
 function tap(t){if(busy||!state?.run||state.run.paused)return;if(!canPlay(t)){setStatus('That tile is blocked. Choose one with an open side and nothing on top.');return;}
  if(selected===t.id){selected=null;highlight=[];renderBoard();return;}
  if(selected==null){selected=t.id;highlight=[];renderBoard();setStatus(`Selected ${skin(t.s)[1]}. Find its free twin with the same corner mark.`);return;}
  const first=state.run.tiles.find(o=>o.id===selected);if(!first||!canPlay(first)){selected=t.id;renderBoard();return;}
  if(first.s!==t.s){selected=t.id;highlight=[];renderBoard();setStatus('Not a match. Choose two matching free tiles.');return;}
  const a=first.id,b=t.id;selected=null;highlight=[];run('community_mahjong_pair',{p_a:a,p_b:b},'Matched! Keep exploring the garden.');
 }
 function display(){if(!state||!$('mahjong-root'))return;const p=state.profile||{},runState=state.run,leaders=state.leaders||[],me=leaders.find(e=>e.user_id===userId),record=Math.max(0,...leaders.map(e=>Number(e.best||0)));const cp=p.campaign||state.campaign||{},rules=cp.rules||{},stage=Number(cp.level||1);
  $('mahjong-button-score').textContent=`Level ${stage}/1000 · Record ${stat(record)} · Yours ${stat(p.best_score)}`;
  const tied=leaders.filter(e=>Number(e.best||0)===record);
  $('mahjong-ribbon-record').textContent=stat(record);
  $('mahjong-ribbon-holder').textContent=record<=0?'No completed game yet':tied.length>1?'Shared record · best game':`${tied[0]?.name||'Member'} · best game`;
  $('mahjong-ribbon-mine').textContent=stat(p.best_score);
  $('mahjong-ribbon-current').textContent=runState?stat(runState.score):'—';
  $('mahjong-ribbon-current-note').textContent=runState?(runState.paused?'Paused · progress saved':`${runState.pairs||0}/36 pairs · Level ${runState.level||stage}`):'No game in progress';
  $('mahjong-level-number').textContent=`Level ${stage} / 1000`;
  $('mahjong-level-name').textContent=rules.name||'Mystery Mile';
  $('mahjong-progress').value=Math.max(0,Math.min(1000,Number(cp.cleared)||0));
  const assists=Number(rules.max_assists??99);const clock=rules.max_seconds;
  const cap=stage>=51&&stage<=100?'No hints or shuffles; maximum one undo':assists>=99?'Practice stage: assistance allowed':assists===0?'No hints, shuffles, or undo':`At most ${assists} total hints, shuffles, or undos`;
  $('mahjong-level-rules').textContent=`${cap}${clock?` · Clear within ${Math.floor(Number(clock)/60)}:${String(Number(clock)%60).padStart(2,'0')}`:''} · ×${rules.multiplier||1} points`;
  $('mahjong-level-streak').textContent=`Levels cleared: ${stat(cp.cleared)} · Qualifying streak: ${stat(cp.streak)}${rules.required_streak?` · Crown requires ${rules.required_streak}+ consecutive qualifying clears`:''}`;
  $('mahjong-campaign-goal').textContent=cp.crown_earned?'♛ The Vanishing Crown is yours. Legend secured.':'Final challenge: 1,000 levels, a 10-win streak, no assistance, and a five-minute finish.';
  const score=$('mahjong-stats');score.replaceChildren();for(const [label,val] of [['CURRENT RUN',stat(runState?.score)],['PERSONAL BEST',stat(p.best_score)],['ALL-TIME POINTS',stat(p.all_time_points)],['COMMONS RECORD',stat(record)]]){const c=node('div','mahjong-stat');c.append(node('small','',label),node('strong','',val));score.append(c);}
  $('mahjong-run-title').textContent=runState?`Level ${runState.level||stage} · Score ${stat(runState.score)} · Combo ${stat(runState.combo)}`:`Level ${stage}: Your next adventure`;
  $('mahjong-pairs').textContent=runState?`${runState.pairs} / 36 matched`:'';
  $('mahjong-remaining').textContent=runState?`${Math.max(0,Number(runState.remaining_pairs ?? (36-Number(runState.pairs||0))))} matches remaining`:'';
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
 async function refresh(silent=false){if(!client||!mounted||refreshing||busy)return;refreshing=true;try{const {data,error}=await client.rpc('community_mahjong_state');if(error)throw error;state=data;if(expanded)display();else if($('mahjong-button-score')){const p=data.profile||{},cp=p.campaign||{},leaders=data.leaders||[],record=Math.max(0,...leaders.map(e=>Number(e.best||0)));$('mahjong-button-score').textContent=`Level ${cp.level||1}/1000 · Record ${stat(record)} · Yours ${stat(p.best_score)}`;}}catch(e){if(!silent)setStatus(e.message||'Unable to refresh scores.');}finally{refreshing=false;}}
 async function run(method,params,message){if(!client||busy)return null;busy=true;for(const id of ['mahjong-new','mahjong-pause','mahjong-overlay-resume','mahjong-hint','mahjong-shuffle','mahjong-undo'])if($(id))$(id).disabled=true;setStatus('Saving your move…');
  try{const {data,error}=await client.rpc(method,params);if(error)throw error;state=data;selected=null;highlight=Array.isArray(data.hint)?data.hint:[];display();if(data.event==='won'){setStatus(data.campaign_event==='retry'?`Board cleared, but level ${data.completed_level} requirements were missed. Replay the stage to advance.`:data.campaign_event==='advanced'?`🏆 Level ${data.completed_level} conquered! +${stat(data.campaign_bonus_earned)} campaign points. Next: level ${data.next_level}.`:'🏆 Mystery solved! Your high score and achievements are saved.');}else setStatus(message);return data;}
  catch(e){setStatus('Could not save: '+(e.message||'Please retry.'));return null;}finally{busy=false;display();}
 }
 async function mount(){if(mounted||board.hidden||!client)return;const {data:{session}}=await client.auth.getSession();if(!session?.user?.id)return;
  const {data,error}=await client.rpc('community_mahjong_state');if(error)return;userId=session.user.id;state=data;mounted=true;frame();display();timer=setInterval(()=>{if(!document.hidden&&mounted)refresh(true);},30000);
 }
 function unmount(){mounted=false;state=null;userId=null;selected=null;highlight=[];expanded=false;if(timer){clearInterval(timer);timer=null;}resize?.disconnect();resize=null;$('mahjong-root')?.remove();}
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
