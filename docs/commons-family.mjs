/* The Commons · family word quest and drawing studio, members only. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {startDrawingStudio} from './commons-drawing.mjs?v=1';

const board=document.getElementById('conversations');
const config=window.COWBOY_COMMUNITY_CONFIG;
const isDataImage=s=>typeof s==='string'&&/^data:image\/webp;base64,[a-zA-Z0-9+/=]+$/.test(s)&&s.length<60000;
const safeStr=s=>String(s??'');
const esc=s=>safeStr(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

if(board&&config?.enabled===true&&location.pathname.endsWith('community.html')){
  let client=null,activeUser=null,live=null,wordTimer=null,loading=false,mounting=false;
  let avatarMap=new Map();
  const byId=id=>document.getElementById(id);
  function status(message){const n=byId('commons-word-message');if(n)n.textContent=message;}
  function avatarOf(userId,name,size='word-player'){
    const img=avatarMap.get(safeStr(userId));
    if(img&&isDataImage(img)){
      const pic=document.createElement('img');pic.src=img;pic.alt='';pic.loading='lazy';pic.width=size==='ranking'?31:27;return pic;
    }
    const a=document.createElement('span');a.className='word-initials';a.textContent=safeStr(name).trim().slice(0,2).toUpperCase()||'?';return a;
  }
  function renderWord(data){
    live=data;
    const area=byId('commons-word-moves'),ranking=byId('commons-word-ranking');
    if(!area||!ranking)return;
    byId('commons-word-day').textContent='New York · '+safeStr(data.day);
    byId('commons-word-clue').textContent='Clue: '+safeStr(data.clue);
    byId('commons-word-progress').textContent=`${data.attempts} / ${data.max_attempts} team guesses`;
    byId('commons-word-total').textContent=`Today’s team points: ${data.team_score??0}`;
    byId('commons-word-my-points').textContent=`My points: ${data.my?.points??0}`;
    const form=byId('commons-word-form');
    form.querySelector('input').disabled=Boolean(data.finished);
    form.querySelector('button').disabled=Boolean(data.finished);
    const win=data.solved?'Your team solved it! Everyone who helped gets a team win.':data.finished?'Today’s attempts are finished. A new word arrives tomorrow.':'Work together: 5 letters and 12 guesses as a team.';
    byId('commons-word-finish').textContent=win+(data.answer?` Answer: ${data.answer}`:'');
    const today=Array.isArray(data.guesses)?data.guesses:[];
    area.replaceChildren();
    if(!today.length){const p=document.createElement('p');p.className='word-rules';p.textContent='No guesses yet. Be the first explorer!';area.append(p);}
    for(const item of today){
      const row=document.createElement('div');row.className='word-tile-row';
      const who=document.createElement('span');who.className='word-player';who.append(avatarOf(item.user_id,item.name),document.createTextNode(safeStr(item.name)));
      row.append(who);
      const word=safeStr(item.guess);
      for(let i=0;i<5;i++){
        const tile=document.createElement('span'),f=Array.isArray(item.feedback)?item.feedback[i]:'absent';
        const label=f==='correct'?'right position':f==='present'?'somewhere else':'not in word';
        tile.className='word-tile '+(f==='correct'||f==='present'?f:'absent');tile.textContent=word[i]||'?';
        tile.setAttribute('aria-label',`${word[i]||'?'}: ${label}`);row.append(tile);
      }
      const points=document.createElement('strong');points.textContent=`+${Number(item.points)||0}`;points.style.marginInlineStart='auto';points.style.color='#2a564e';row.append(points);area.append(row);
    }
    ranking.replaceChildren();
    const boardRows=Array.isArray(data.ranking)?data.ranking:[];
    if(!boardRows.length){const li=document.createElement('li');li.textContent='Scoreboard opens after the first guess.';ranking.append(li);}
    for(const [index,member] of boardRows.entries()){
      const li=document.createElement('li');li.append(avatarOf(member.user_id,member.name,'ranking'));
      const info=document.createElement('span'),name=document.createElement('b'),sub=document.createElement('small');
      name.textContent=`${index+1}. ${safeStr(member.name)}`;
      sub.textContent=`${member.wins||0} team wins · ${member.solves||0} solves · ${member.streak||0} streak · best ${member.best||0}`;
      info.append(name,sub);
      const points=document.createElement('b');points.textContent=Number(member.points||0).toLocaleString()+' pts';
      li.append(info,points);ranking.append(li);
    }
  }
  async function refreshTotals(){
    const {data,error}=await client.rpc('community_word_family_totals');
    if(!error&&data){byId('commons-word-history').textContent=`All-time: ${data.team_wins||0} team wins · best team day ${data.team_best||0}`;}
  }
  async function refreshWord(quiet=false){
    if(!client||!activeUser||board.hidden||loading||document.hidden)return;
    loading=true;
    try{
      const {data,error}=await client.rpc('community_word_state');if(error)throw error;
      renderWord(data);await refreshTotals();if(!quiet)status('Ready to play together.');
    }catch(e){if(!quiet)status('Scoreboard cannot load. '+safeStr(e.message||'Please try refresh.'));}
    finally{loading=false;}
  }
  async function guess(e){
    e.preventDefault();if(!client||loading||live?.finished)return;
    const input=byId('commons-word-guess'),word=input.value.trim().toUpperCase();
    if(!/^[A-Z]{5}$/.test(word)){status('Use exactly five English letters.');input.focus();return;}
    loading=true;byId('commons-word-submit').disabled=true;status('Checking your guess…');
    try{
      const {data,error}=await client.rpc('community_word_submit',{p_guess:word});if(error)throw error;
      renderWord(data);await refreshTotals();input.value='';status(data.solved?'You solved it together! Great teamwork.':'Guess saved for the whole team.');
    }catch(e){status(safeStr(e.message||'Guess was not saved. Please retry.'));}
    finally{loading=false;if(!live?.finished)byId('commons-word-submit').disabled=false;}
  }
  function build(){
    if(byId('commons-family-zone'))return;
    const zone=document.createElement('div');zone.id='commons-family-zone';zone.className='community-play-zone';
    zone.innerHTML=`
     <section class="family-stage" id="commons-word" aria-label="Daily cooperative word game">
      <div class="family-heading"><div><span class="family-kicker">The Commons · Cooperative game</span><h2>Daily Word Quest</h2><p>One mystery word. One team. Individual scores and a family scoreboard.</p></div><span class="family-pill" id="commons-word-day">Today’s puzzle</span></div>
      <div class="word-layout"><div class="word-panel"><p class="word-clue" id="commons-word-clue">Loading today’s clue…</p>
       <div class="word-stats"><span class="family-pill" id="commons-word-progress">0 / 12</span><span class="family-pill" id="commons-word-total">Team: 0</span><span class="family-pill" id="commons-word-my-points">Mine: 0</span><span class="family-pill" id="commons-word-history">All-time team wins: 0</span></div>
       <div id="commons-word-moves" aria-label="Today’s team guesses"></div>
       <p class="word-message" id="commons-word-finish" aria-live="polite"></p>
       <form id="commons-word-form" class="word-guess-form"><label for="commons-word-guess" class="sr-only">Your five-letter word</label><input id="commons-word-guess" aria-label="Five-letter guess" type="text" inputmode="text" minlength="5" maxlength="5" autocomplete="off" spellcheck="false" pattern="[A-Za-z]{5}" placeholder="WORD?" required><button class="family-btn" id="commons-word-submit" type="submit">Try word →</button><button type="button" class="family-btn secondary" id="commons-word-refresh">Refresh team</button></form>
       <p class="word-message" id="commons-word-message" role="status" aria-live="polite"></p>
       <p class="word-rules">Green = right letter and spot. Gold = right letter, different spot. Purple = not in the word. Every valid guess earns 5 points. Solving earns a bonus; everyone who participated gets a team win. A new puzzle starts each day at midnight Eastern.</p>
       </div><aside class="word-leaderboard"><h3>Family leaderboard</h3><ol class="word-ranking" id="commons-word-ranking"><li>Loading standings…</li></ol><p class="word-rules">Running total, team wins, solves, best daily score and winning streaks are saved on the server.</p></aside></div>
     </section>
     <section class="family-stage" id="commons-art" aria-label="Family artist drawing board"><div class="family-heading"><div><span class="family-kicker">The Commons · Creative space</span><h2>The Drawing Studio</h2><p>Paint, sketch, create layers, undo mistakes, and download your artwork.</p></div><span class="family-pill">Your art stays on your device until you choose to download it</span></div><div id="commons-drawing-root"></div></section>`;
    const before=board.querySelector('.community-main .community-heading');before?.insertAdjacentElement('beforebegin',zone);
    byId('commons-word-form').addEventListener('submit',guess);
    byId('commons-word-refresh').addEventListener('click',()=>refreshWord());
  }
  async function loadAvatars(){
    avatarMap.clear();if(!client)return;
    try{const {data,error}=await client.from('community_board_avatar_assets').select('user_id,data_uri');
      if(!error)for(const row of data||[])if(row.user_id&&isDataImage(row.data_uri))avatarMap.set(row.user_id,row.data_uri);
    }catch{/* Avatars are decorative. Do not block the game. */}
  }
  async function mount(){
    if(mounting||board.hidden||!client)return;
    mounting=true;
    try{
      const {data:{session}}=await client.auth.getSession();
      const id=session?.user?.id;if(!id)return;
      const {data:member,error}=await client.from('community_members').select('status').eq('user_id',id).maybeSingle();
      if(error||member?.status!=='approved')return;
      if(activeUser===id&&byId('commons-family-zone'))return;
      activeUser=id;build();await loadAvatars();
      if(!byId('commons-drawing-root').dataset.ready){startDrawingStudio(byId('commons-drawing-root'),id);byId('commons-drawing-root').dataset.ready='true';}
      await refreshWord();
      if(wordTimer)clearInterval(wordTimer);
      wordTimer=setInterval(()=>refreshWord(true),20000);
    }finally{mounting=false;}
  }
  function unmount(){
    activeUser=null;live=null;avatarMap.clear();if(wordTimer){clearInterval(wordTimer);wordTimer=null;}
    byId('commons-family-zone')?.remove();
  }
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
    const local=window.localStorage,session=window.sessionStorage;
    const store=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
    const storageKey='sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token';
    client=createClient(config.supabaseUrl,config.publishableKey,{auth:{storageKey,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:store}});
    let wait=null;
    const schedule=()=>{clearTimeout(wait);wait=setTimeout(()=>{if(board.hidden)unmount();else mount().catch(()=>{});},150);};
    new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden']});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
    client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')unmount();schedule();});
    schedule();
  }catch{/* A failure here must never stop the normal private message board. */}
}
