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
 ['five_thousand','High Roller','Earn 5,000 points in one game','★']
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
   <div class="mahjong-head"><div><div class="mahjong-kicker">THE COMMONS · MYSTERY MACHINE EDITION</div><h2>Mahjong Solitaire</h2><p>Match two open tiles with identical corner marks. Clear the layered mystery garden to earn points and collect achievements.</p></div><div class="mahjong-award">🏆 <span>High scores & badges</span></div></div>
   <div id="mahjong-stats" class="mahjong-stats" aria-live="polite"></div>
   <div class="mahjong-game-zone"><div class="mahjong-hud"><span id="mahjong-run-title">Ready to play?</span><span id="mahjong-pairs"></span></div><div id="mahjong-board" class="mahjong-board" role="group" aria-label="Mahjong game board"></div>
   <div class="mahjong-actions"><button type="button" id="mahjong-new">New game</button><button type="button" id="mahjong-hint">💡 Hint</button><button type="button" id="mahjong-shuffle">⤨ Shuffle</button><button type="button" id="mahjong-undo">↶ Undo</button></div><p class="mahjong-status" id="mahjong-status" role="status" aria-live="polite">Tap New game to begin.</p></div>
   <div class="mahjong-bottom"><section class="mahjong-leaders"><h3>Commons hall of fame</h3><div id="mahjong-leader-list"></div></section><section class="mahjong-badges"><div class="mahjong-badge-head"><h3>Achievements</h3><button type="button" class="mahjong-profile-link" id="mahjong-profile-open">View on my profile ↗</button></div><div id="mahjong-achievement-list"></div></section></div>
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
 function tap(t){if(busy||!state?.run)return;if(!canPlay(t)){setStatus('That tile is blocked. Choose one with an open side and nothing on top.');return;}
  if(selected===t.id){selected=null;highlight=[];renderBoard();return;}
  if(selected==null){selected=t.id;highlight=[];renderBoard();setStatus(`Selected ${skin(t.s)[1]}. Find its free twin with the same corner mark.`);return;}
  const first=state.run.tiles.find(o=>o.id===selected);if(!first||!canPlay(first)){selected=t.id;renderBoard();return;}
  if(first.s!==t.s){selected=t.id;highlight=[];renderBoard();setStatus('Not a match. Choose two matching free tiles.');return;}
  const a=first.id,b=t.id;selected=null;highlight=[];run('community_mahjong_pair',{p_a:a,p_b:b},'Matched! Keep exploring the garden.');
 }
 function display(){if(!state||!$('mahjong-root'))return;const p=state.profile||{},runState=state.run,leaders=state.leaders||[],me=leaders.find(e=>e.user_id===userId),record=Math.max(0,...leaders.map(e=>Number(e.best||0)));
  $('mahjong-button-score').textContent=`My best ${stat(p.best_score)} · Commons record ${stat(record)}`;
  const score=$('mahjong-stats');score.replaceChildren();for(const [label,val] of [['CURRENT RUN',stat(runState?.score)],['PERSONAL BEST',stat(p.best_score)],['ALL-TIME POINTS',stat(p.all_time_points)],['COMMONS RECORD',stat(record)]]){const c=node('div','mahjong-stat');c.append(node('small','',label),node('strong','',val));score.append(c);}
  $('mahjong-run-title').textContent=runState?`Score ${stat(runState.score)} · Combo ${stat(runState.combo)}`:'Your next adventure';
  $('mahjong-pairs').textContent=runState?`${runState.pairs} / 36 pairs cleared`:'';
  for(const id of ['mahjong-hint','mahjong-shuffle','mahjong-undo'])$(id).disabled=!runState||busy;
  $('mahjong-new').textContent=runState?'Restart':'New game';$('mahjong-new').disabled=busy;
  $('mahjong-undo').disabled=!runState||runState.moves<1||busy;
  renderBoard();const lst=$('mahjong-leader-list');lst.replaceChildren();
  if(!leaders.length)lst.append(node('p','mahjong-empty','First completed game claims the first record.'));
  for(const [i,e] of leaders.entries()){
   const row=node('div','mahjong-leader');row.append(node('span','mahjong-rank',i===0?'♛':String(i+1)));
   const nm=node('span','mahjong-leader-name',e.name||'Member');if(e.user_id===userId)nm.append(node('small','', ' (you)'));row.append(nm);
   row.append(node('strong','',stat(e.best)));lst.append(row);
  }
  const badges=$('mahjong-achievement-list');badges.replaceChildren();const earned=new Set((p.badges||[]).map(b=>b.code));
  for(const [code,title,description,icon] of ACHIEVEMENTS){const b=node('div','mahjong-badge '+(earned.has(code)?'earned':'locked'));
   b.append(node('span','mahjong-badge-symbol',earned.has(code)?icon:'♙'));
   const words=node('span','mahjong-badge-copy');words.append(node('strong','',title),node('small','',earned.has(code)?description:'Locked · '+description));b.append(words);badges.append(b);
  }
 }
 async function refresh(silent=false){if(!client||!mounted||refreshing||busy)return;refreshing=true;try{const {data,error}=await client.rpc('community_mahjong_state');if(error)throw error;state=data;if(expanded)display();else if($('mahjong-button-score')){const p=data.profile||{};$('mahjong-button-score').textContent=`My best ${stat(p.best_score)} · All-time ${stat(p.all_time_points)}`;}}catch(e){if(!silent)setStatus(e.message||'Unable to refresh scores.');}finally{refreshing=false;}}
 async function run(method,params,message){if(!client||busy)return null;busy=true;for(const id of ['mahjong-new','mahjong-hint','mahjong-shuffle','mahjong-undo'])if($(id))$(id).disabled=true;setStatus('Saving your move…');
  try{const {data,error}=await client.rpc(method,params);if(error)throw error;state=data;selected=null;highlight=Array.isArray(data.hint)?data.hint:[];display();if(data.event==='won'){setStatus('🏆 Mystery solved! Your high score and new achievements are saved.');}else setStatus(message);return data;}
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
