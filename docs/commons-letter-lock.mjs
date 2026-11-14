/* w0rdle shared co-op v2 */
/* Shared clues and daily answer; personal credits and progress. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';

const host=document.getElementById('conversations');
const config=window.COWBOY_COMMUNITY_CONFIG;
const ACCENT=['absent','present','correct'];
const BADGES={
 quest:[
  ['trailblazer','First Footprint','Make your first team guess','🧭'],
  ['clue_cracker','Clue Cracker','Solve a Daily Word Quest','🔎'],
  ['campfire_captain','Campfire Captain','Share 3 team victories','🔥'],
  ['word_architect','Word Architect','Personally solve 5 team words','🏛️'],
  ['unbroken_trail','Unbroken Trail','Earn a 5-day team streak','🌲'],
  ['lexicon_legend','Lexicon Legend','Accumulate 1,500 Quest points','📜'],
  ['oracle_of_words','Oracle of Words','Accumulate 5,000 Quest points','👁️']
 ],
 letters:[
  ['first_lockpick','First Signal','Make your first w0rdle team guess','🗝️'],
  ['verdant_key','Team Lantern','Help your team solve its first w0rdle','💚'],
  ['lightning_unlock','Lightning Unlock','Personally solve the answer within 3 team guesses','⚡'],
  ['nightmare_tamer','Nightmare Tamer','Personally solve a Nightmare daily word','🐉'],
  ['last_key','The Last Key','Solve the word on your team’s final guess','⏳'],
  ['seven_seals','Seven Seals','Contribute to 7 w0rdle team victories','🔐'],
  ['flamekeeper','Flamekeeper','Contribute to a 5-day team win streak','🕯️'],
  ['master_locksmith','Master Locksmith','Contribute to 30 daily team victories','👑'],
   ['green_flash','Green Thumb','Find 25 letters in their exact positions','🍀'],
   ['golden_finder','Golden Compass','Find 25 letters that belong elsewhere','🧭'],
   ['word_weaver','Word Weaver','Earn 1,000 personal w0rdle points','🪡'],
   ['team_anchor','The Team Anchor','Join 10 different w0rdle days','⚓']
 ],
 arcade:[
  ['double_agent','Double Agent','Earn progress in 2 different games','🎭'],
  ['three_worlds','Three Worlds Wanderer','Play 3 kinds of Commons games','🌌'],
  ['four_corners','Four Corners','Earn progress in all 4 game modes','💠'],
  ['twin_crowns','Twin Crowns','Win in both word games','👑'],
  ['ten_thousand_steps','Ten Thousand Steps','Earn 10,000 Arcade XP','🥾'],
  ['mythkeeper','Mythkeeper','Reach Arcade Level 25','🐲']
 ]
};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const by=id=>document.getElementById(id);
const fmt=x=>Number(x||0).toLocaleString('en-US');
const isDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
const escaped=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

if(host && config?.enabled===true && location.pathname.endsWith('community.html')){
 let client=null,member=null,game=null,passport=null,refreshTimer=null,mountWatch=null,mounting=false,submitting=false,lastAwards=null,loadedFor=null;
 function status(text){const n=by('letter-lock-status');if(n)n.textContent=text;}
 function tier(tier){return String(tier||'medium').toUpperCase();}
 function pill(label,text){const n=el('div','arcade-metric');n.append(el('small','',label),el('strong','',text));return n;}
 function ratio(xp,level,next){const base=100*Math.max(0,level-1)**2;return Math.max(0,Math.min(100,100*(Number(xp||0)-base)/Math.max(1,Number(next||0)-base)));}
 function gallery(name,earnedSet){const collection=BADGES[name]||[];const wrap=el('div','arcade-medal-shelf');for(const [code,title,description,icon] of collection){const unlocked=earnedSet.has(code);const card=el('div','arcade-medal '+(unlocked?'earned':'locked'));
  const symbol=el('span','arcade-medal-symbol',unlocked?icon:'🔒');symbol.setAttribute('aria-hidden','true');
  const info=el('span','arcade-medal-copy');info.append(el('strong','',title),el('small','',unlocked?`Earned · ${description}`:description));
  card.append(symbol,info);card.title=unlocked?'Achievement unlocked':`Locked: ${description}`;wrap.append(card);
 }return wrap;}
 function progressNode(name,level,xp,next){const box=el('section','arcade-level-meter');const heading=el('div','arcade-meter-heading');heading.append(el('strong','',`${name} · Level ${Math.max(1,Number(level||1))}`),el('span','',`${fmt(xp)} / ${fmt(next)} XP`));
  const track=el('div','arcade-meter-track');track.setAttribute('role','progressbar');track.setAttribute('aria-label',`${name} XP toward next level`);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(Math.round(ratio(xp,level,next))));
  const fill=el('div','arcade-meter-fill');fill.style.width=ratio(xp,level,next)+'%';track.append(fill);box.append(heading,track);return box;}
 function build(){if(by('letter-lock-root'))return;
  const main=host.querySelector('.community-main');if(!main)return;
  const pass=el('section','arcade-passport');pass.id='arcade-passport';pass.setAttribute('aria-label','Your Commons Arcade Passport');
  pass.innerHTML=`<div class="arcade-passport-header"><span class="arcade-passport-symbol" aria-hidden="true">✦</span><div><p class="arcade-eyebrow">THE COMMONS · PLAYER PASSPORT</p><h2 id="arcade-passport-title">Your ongoing adventure</h2><p id="arcade-passport-subtitle">Your words, tiles and discoveries all count.</p></div></div><div id="arcade-passport-level"></div><div id="arcade-passport-modes" class="arcade-mode-list"></div><details class="arcade-badge-details"><summary>See my Arcade honors <span id="arcade-badge-count"></span></summary><div id="arcade-badge-list"></div></details>`;
  main.prepend(pass);
  const root=el('section','mahjong-game letter-lock-game');root.id='letter-lock-root';root.setAttribute('aria-label','w0rdle co-op word challenge');
  root.innerHTML=`<button id="letter-lock-toggle" type="button" class="mahjong-entry-button" aria-expanded="false" aria-controls="letter-lock-content"><span class="mahjong-entry-icon" aria-hidden="true">🔐</span><span class="mahjong-entry-copy"><strong>w0rdle</strong><small id="letter-lock-summary">A shared daily word · individual scores & achievements</small></span><span class="mahjong-chevron" aria-hidden="true">▾</span></button><div id="letter-lock-content" hidden><div class="letter-lock-inner"><div class="letter-lock-heading"><div><span class="arcade-eyebrow">THE COMMONS · DAILY TEAM CIPHER</span><h2>w0rdle · one word, one team</h2><p>Everyone sees the same five-letter answer in Daily Word Quest and w0rdle. All teammates share the clues. You earn individual points for correct letters and solving. 10 team guesses, or 12 on Nightmare days.</p></div><span id="letter-lock-difficulty" class="arcade-difficulty">Today’s mystery</span></div><div id="letter-lock-personal-progress"></div><div class="letter-lock-layout"><section class="letter-lock-panel" aria-label="Shared w0rdle puzzle"><div id="letter-lock-statline" class="arcade-game-metrics"></div><div id="letter-lock-grid" class="letter-lock-grid" role="group" aria-label="Today’s team guesses"></div><form id="letter-lock-form" class="letter-lock-form"><label for="letter-lock-guess" class="sr-only">Your five-letter guess</label><input id="letter-lock-guess" type="text" aria-label="Five-letter guess" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" minlength="5" maxlength="5" pattern="[A-Za-z]{5}" placeholder="TYPE A WORD" required><button id="letter-lock-submit" type="submit">Send team guess ↗</button><button id="letter-lock-refresh" type="button">Refresh team</button></form><div id="letter-lock-keyboard" class="letter-lock-keyboard" aria-label="Letter keyboard"></div><p id="letter-lock-status" class="letter-lock-message" aria-live="polite" role="status">Loading today's puzzle…</p><p class="letter-lock-rules">Green = +12 personal points for a letter in the right spot. Gold = +5 for a letter elsewhere in the answer. The person who solves earns a larger bonus, and everybody who contributed gets +35 team-victory points. This is the SAME answer as Daily Word Quest, shared with all Commons members until midnight Eastern.</p></section><aside class="letter-lock-aside"><h3 id="letter-lock-daily-title">Today’s leaderboard</h3><ol id="letter-lock-daily-leaders" class="arcade-leader-list"></ol><h3 id="letter-lock-all-title">All-time scores</h3><ol id="letter-lock-leaders" class="arcade-leader-list"><li>No scores yet.</li></ol><h3 id="letter-lock-awards-title">Achievements</h3><p id="letter-lock-medal-count" class="arcade-subtle">Earned badges stay yours forever.</p><div id="letter-lock-awards"></div></aside></div></div></div>`;
  const after=by('word-game-root')||by('mahjong-root')||by('plate-game-root');if(after?.parentElement===main)after.after(root);else main.prepend(root);
  root.querySelector('#letter-lock-toggle').addEventListener('click',()=>{const content=by('letter-lock-content'),toggle=by('letter-lock-toggle');const expanded=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(expanded));content.hidden=!expanded;if(expanded){void refresh(true);content.scrollIntoView({behavior:'smooth',block:'nearest'});}});
  by('letter-lock-form').addEventListener('submit',submit);
  by('letter-lock-refresh').addEventListener('click',()=>{void refresh(false);});
  by('letter-lock-keyboard').addEventListener('click',e=>{const key=e.target.closest('button[data-key]')?.dataset.key;if(!key)return;const input=by('letter-lock-guess');if(!input||input.disabled)return;if(key==='ENTER'){by('letter-lock-form').requestSubmit();return;}if(key==='BACK'){input.value=input.value.slice(0,-1);}else if(input.value.length<5)input.value+=key;input.focus();});
  document.addEventListener('submit',questSubmitted,true);
  position();mountWatch?.disconnect();mountWatch=new MutationObserver(()=>{position();addQuestExtras();});mountWatch.observe(main,{childList:true});
  addQuestExtras();makeKeyboard();
 }
 function position(){const main=host.querySelector('.community-main'),root=by('letter-lock-root');if(!main||!root)return;const word=by('word-game-root');const after=word?.parentElement===main?word:(by('mahjong-root')?.parentElement===main?by('mahjong-root'):by('plate-game-root'));if(after?.parentElement===main&&root.previousElementSibling!==after){after.after(root);} }
 function addQuestExtras(){const panel=by('commons-word')?.querySelector('.word-panel');if(!panel||by('arcade-team-progress'))return;const extra=el('section','arcade-team-progress');extra.id='arcade-team-progress';panel.querySelector('.word-clue')?.after(extra);if(passport)renderQuestProgress(passport);}
 function paintMedals(rootId,category,codes){const target=by(rootId);if(!target)return;const badges=new Set(codes||[]);target.replaceChildren(gallery(category,badges));}
 function renderQuestProgress(profile){const target=by('arcade-team-progress');const q=profile?.games?.quest;if(!target||!q)return;target.replaceChildren();const heading=el('div','arcade-team-heading');heading.append(el('strong','',`Your Quest Level ${q.level}`),el('span','',`${q.wins} shared wins · ${q.solves} solves`));target.append(heading,progressNode('Team Word Quest',q.level,q.xp,q.next_xp));
  const difficulty=by('arcade-quest-difficulty')||el('span','arcade-difficulty');difficulty.id='arcade-quest-difficulty';difficulty.textContent='Difficulty varies daily';target.append(difficulty);
  const details=el('details','arcade-badge-details');const summary=el('summary','','Word Quest badges · '+(q.badges||[]).length+' / '+BADGES.quest.length);details.append(summary,gallery('quest',new Set(q.badges||[])));target.append(details);
  const toggle=by('word-game-toggle');if(toggle&&!by('arcade-quest-rank-chip')){const chip=el('span','arcade-game-chip');chip.id='arcade-quest-rank-chip';toggle.querySelector('.mahjong-entry-copy')?.append(chip);}if(by('arcade-quest-rank-chip'))by('arcade-quest-rank-chip').textContent=`Your Level ${q.level} · ${fmt(q.xp)} XP · ${(q.badges||[]).length} awards`;
 }
 function renderPassport(data){passport=data;const gameInfo=data.games||{};
  by('arcade-passport-title').textContent=`Level ${data.level} · ${data.title}`;
  by('arcade-passport-subtitle').textContent=`${fmt(data.xp)} XP earned · ${fmt(data.days_played)} word days · ${data.modes_played}/4 adventures started`;
  const level=by('arcade-passport-level');level.replaceChildren(progressNode('Arcade Passport',data.level,data.xp,data.next_xp));
  const modes=by('arcade-passport-modes');modes.replaceChildren();for(const [name,mode,text] of [['Word Quest','quest','team wins'],['w0rdle','letters','team wins'],['Mahjong','mahjong','boards cleared'],['License Plates','plates','accepted photos']]){const part=gameInfo[mode]||{};const v=mode==='quest'?part.wins:mode==='letters'?part.wins:mode==='mahjong'?part.cleared:part.approved;const line=el('div','arcade-mode-pill');line.append(el('strong','',name),el('small','',`${fmt(part.xp)} XP · ${fmt(v)} ${text}`));modes.append(line);}
  const earned=new Set(data.badges||[]);by('arcade-badge-count').textContent=`${earned.size}/${BADGES.arcade.length}`;paintMedals('arcade-badge-list','arcade',earned);
  renderQuestProgress(data);
  if(by('letter-lock-personal-progress')){const lock=gameInfo.letters||{};const container=by('letter-lock-personal-progress');container.replaceChildren(progressNode('w0rdle',lock.level,lock.xp,lock.next_xp));}
  if(by('letter-lock-medal-count'))by('letter-lock-medal-count').textContent=`${(gameInfo.letters?.badges||[]).length} of ${BADGES.letters.length} badges unlocked`;
  paintMedals('letter-lock-awards','letters',gameInfo.letters?.badges||[]);
  for(const [id,mode] of [['mahjong-toggle','mahjong'],['plate-game-open','plates']]){const button=by(id);if(!button)continue;let chip=button.querySelector('.arcade-contribution-chip');if(!chip){chip=el('span','arcade-contribution-chip');button.querySelector('.mahjong-entry-copy')?.append(chip);if(!chip.parentElement)button.append(chip);}chip.textContent=`Arcade Passport +${fmt(gameInfo[mode]?.xp)} XP`;}
  const awards=[...(data.badges||[]).map(x=>'a/'+x),...(gameInfo.quest?.badges||[]).map(x=>'q/'+x),...(gameInfo.letters?.badges||[]).map(x=>'l/'+x)];const nowSet=new Set(awards);
  if(lastAwards){const newly=awards.filter(x=>!lastAwards.has(x));if(newly.length){const code=newly[0].slice(2),group=newly[0][0]==='a'?'arcade':newly[0][0]==='q'?'quest':'letters';const badge=BADGES[group].find(x=>x[0]===code);if(badge)toast(`🏆 Achievement earned: ${badge[1]}`);}}
  lastAwards=nowSet;
 }
 let toastTimeout=null;
 function toast(message){const area=by('arcade-toast-area')||(()=>{const n=el('div','arcade-toast');n.id='arcade-toast-area';n.setAttribute('role','status');n.setAttribute('aria-live','polite');document.body.append(n);return n;})();area.textContent=message;area.classList.add('visible');if(toastTimeout)clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>area.classList.remove('visible'),4500);}
 function makeKeyboard(){const root=by('letter-lock-keyboard');if(!root)return;root.replaceChildren();for(const letters of ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']){const line=el('div','letter-lock-keyboard-row');if(letters==='ZXCVBNM'){const key=el('button','letter-lock-key wide','ENTER');key.type='button';key.dataset.key='ENTER';line.append(key);}for(const char of letters){const key=el('button','letter-lock-key',char);key.type='button';key.dataset.key=char;key.setAttribute('aria-label',`Type ${char}`);line.append(key);}if(letters==='ZXCVBNM'){const del=el('button','letter-lock-key wide','⌫');del.type='button';del.dataset.key='BACK';del.setAttribute('aria-label','Backspace');line.append(del);}root.append(line);}}
 function keyColors(){const used={};for(const row of (game?.guesses||[])){for(let i=0;i<5;i++){const ch=row.guess?.[i],status=row.feedback?.[i];if(ch&&status&&ACCENT.indexOf(status)>ACCENT.indexOf(used[ch]||'absent'))used[ch]=status;else if(ch&&!used[ch])used[ch]=status;}}by('letter-lock-keyboard')?.querySelectorAll('button[data-key]')?.forEach(b=>{const key=b.dataset.key;const state=used[key];b.classList.toggle('correct',state==='correct');b.classList.toggle('present',state==='present');b.classList.toggle('absent',state==='absent');});}
 function drawBoard(data){
  const target=by('letter-lock-grid');if(!target)return;target.replaceChildren();
  const max=Number(data.max_attempts||10),guesses=data.guesses||[];
  for(let row=0;row<max;row++){
   const entry=guesses[row];const item=el('div','letter-lock-guess-entry');
   const line=el('div','letter-lock-grid-row');line.setAttribute('aria-label',`Team guess ${row+1}`);
   for(let i=0;i<5;i++){
    const value=entry?.guess?.[i]||'';
    const color=ACCENT.includes(entry?.feedback?.[i])?entry.feedback[i]:'absent';
    const cell=el('span','letter-lock-tile'+(entry?' '+color:''),value);
    cell.setAttribute('aria-label',entry?`${value} ${color}`:`Empty tile ${i+1}`);line.append(cell);
   }
   item.append(line);
   if(entry){const caption=el('div','letter-lock-guess-caption');
    caption.append(el('strong','',`${entry.name||'Member'} · Guess ${row+1}`),el('span','',`+${fmt(entry.points)} personal pts`));
    item.append(caption);
   }
   target.append(item);
  }
 }
 function renderGame(data){game=data;const done=Boolean(data.finished);const input=by('letter-lock-guess');if(!input)return;
  input.disabled=done;by('letter-lock-submit').disabled=done;
  by('letter-lock-summary').textContent=`${tier(data.difficulty)} · ${data.attempts}/${data.max_attempts} team guesses · ${data.solved?'Team victory!':done?'Try tomorrow':'Play together'}`;
  by('letter-lock-difficulty').textContent=`${tier(data.difficulty)} · TEAM PUZZLE`;
  const line=by('letter-lock-statline');line.replaceChildren(
   pill('DAY',isDay(data.day)?data.day:'Today'),
   pill('TEAM GUESSES LEFT',data.remaining),
   pill('TEAM SCORE',fmt(data.team_points)),
   pill('YOUR POINTS TODAY',fmt(data.my?.today_points)),
   pill('DIFFICULTY',tier(data.difficulty)));
  drawBoard(data);keyColors();
  if(done)status(data.solved?`🏆 Your team solved w0rdle! Everyone who contributed earned a shared win. Answer: ${data.answer||'unavailable'}.`:
     `Today’s team attempts are finished. Answer: ${data.answer||'unavailable'}. Your correct letters still earned personal points.`);
  else status(data.attempts?'Team clues are updated. Find the next promising five-letter word!':'Be the first to guess. Your teammates will see your clues.');
  const leaders=by('letter-lock-leaders');leaders.replaceChildren();
  if(!data.ranking?.length)leaders.append(el('li','','Start the first team puzzle to reach the scoreboard.'));
  const daily=(data.ranking||[]).filter(entry=>Number(entry.today_points)>0)
    .sort((a,b)=>b.today_points-a.today_points||String(a.name).localeCompare(String(b.name)));
  const current=by('letter-lock-daily-leaders');
  if(current){
   current.replaceChildren();
   if(!daily.length)current.append(el('li','','No points recorded today.'));
   for(const [i,entry] of daily.entries()){
    const item=el('li','arcade-leader'+(entry.user_id===member?' is-me':''));
    item.append(el('strong','',`${i+1}. ${entry.name||'Member'}`),el('small','',`${fmt(entry.today_points)} points today`));
    current.append(item);
   }
  }
  for(const [i,entry] of (data.ranking||[]).entries()){
   const item=el('li','arcade-leader'+(entry.user_id===member?' is-me':''));
   item.append(el('strong','',`${i+1}. ${entry.name||'Member'}`),
     el('small','',`${fmt(entry.points)} total · +${fmt(entry.today_points)} today · ${fmt(entry.wins)} team wins · ${fmt(entry.solves)} solves`));
   leaders.append(item);
  }
 }
 async function refresh(quiet=false){if(!client||!member||!by('letter-lock-root'))return;try{const [a,b,c]=await Promise.all([client.rpc('community_wordle_state'),client.rpc('community_arcade_profile'),client.rpc('community_word_state')]);
  if(a.error)throw a.error;if(b.error)throw b.error;renderGame(a.data);renderPassport(b.data);
  if(!c.error){const chip=by('arcade-quest-difficulty');if(chip)chip.textContent=`Today's team difficulty · ${tier(c.data?.difficulty)}`;}
  if(!quiet)status('Progress updated. Your adventure is saved.');
 }catch(e){if(!quiet)status('The puzzle could not load. '+String(e.message||'Try refreshing.'));}}
 async function submit(e){e.preventDefault();if(submitting||game?.finished)return;const input=by('letter-lock-guess'),word=(input?.value||'').trim().toUpperCase();if(!/^[A-Z]{5}$/.test(word)){status('Enter exactly five letters.');input.focus();return;}
  submitting=true;by('letter-lock-submit').disabled=true;status('Scoring your team guess…');try{const {data,error}=await client.rpc('community_wordle_submit',{p_guess:word});if(error)throw error;input.value='';renderGame(data);const {data:rank,error:rankError}=await client.rpc('community_arcade_profile');if(!rankError&&rank)renderPassport(rank);if(data.solved)toast('🏆 Your team solved w0rdle! Shared win recorded.');else{const last=(data.guesses||[]).at(-1);status(`Team guess shared! +${fmt(last?.points)} personal points. Your teammates can now use the clues.`);}}catch(ex){status('Not saved: '+String(ex.message||'Try again.'));}finally{submitting=false;if(!game?.finished)by('letter-lock-submit').disabled=false;}}
 function questSubmitted(e){if(e.target?.id==='commons-word-form')setTimeout(()=>{void refresh(true);},1400);}
 function unmount(){member=null;game=null;passport=null;lastAwards=null;loadedFor=null;if(refreshTimer)clearInterval(refreshTimer);refreshTimer=null;mountWatch?.disconnect();mountWatch=null;by('letter-lock-root')?.remove();by('arcade-passport')?.remove();by('arcade-team-progress')?.remove();by('arcade-quest-rank-chip')?.remove();by('arcade-toast-area')?.remove();document.removeEventListener('submit',questSubmitted,true);}
 async function mount(){if(mounting||host.hidden||!client)return;mounting=true;try{const {data:{session}}=await client.auth.getSession();const id=session?.user?.id;if(!id){if(member)unmount();return;}const {data,error}=await client.from('community_members').select('status').eq('user_id',id).maybeSingle();if(error||data?.status!=='approved'){if(member)unmount();return;}if(member===id&&by('letter-lock-root')){addQuestExtras();return;}if(member)unmount();member=id;build();await refresh(true);refreshTimer=setInterval(()=>{if(!document.hidden&&member)void refresh(true);},30000);
 }finally{mounting=false;}}
 try{const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');const local=window.localStorage,session=window.sessionStorage;const store=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});const key='sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token';client=createClient(config.supabaseUrl,config.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:store}});
 let wait=null;const schedule=()=>{clearTimeout(wait);wait=setTimeout(()=>{if(host.hidden)unmount();else mount().catch(()=>{});},170);};new MutationObserver(schedule).observe(host,{attributes:true,attributeFilter:['hidden']});document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')unmount();schedule();});schedule();}catch{/* The Commons message board continues if the optional arcade does not load. */}
}
