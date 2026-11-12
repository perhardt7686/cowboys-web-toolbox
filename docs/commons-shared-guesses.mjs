/* Commons · All-members visible word guesses and shared historical ledger · November 2026.
 * Respects Commons member approval and existing RPC authorization.
 * Existing Word Quest / w0rdle gameplay, scores and save behavior are unchanged.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';

const host = document.getElementById('conversations');
const config = window.COWBOY_COMMUNITY_CONFIG;
const MODES = {
  quest: {root:'word-game-root',toggle:'word-game-toggle',label:'Daily Word Quest'},
  w0rdle: {root:'letter-lock-root',toggle:'letter-lock-toggle',label:'w0rdle'}
};
const STATUS = {correct:'Correct place',present:'In the word, different place',absent:'Not in the word'};
const safe = s => String(s == null ? '' : s);
const node = (tag, cls, value) => {
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(value!==undefined)e.textContent=safe(value);
  return e;
};
const easternTime = date => {
  try {return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(date));}
  catch {return '';}
};
const todayLocal = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let client=null, memberId=null, checking=false, refreshing=false, lastRefresh=0;
let startupWatcher=null;

function tileGroup(item) {
  const box=node('span','shared-word-letters');
  const guess=safe(item.guess).toUpperCase();
  for(let i=0;i<5;i++){
    const letter=guess[i]||'·';
    const state=STATUS[item.feedback?.[i]] ? item.feedback[i] : 'absent';
    const tile=node('span','shared-word-tile '+state,letter);
    tile.setAttribute('aria-label',letter+': '+STATUS[state]);
    box.append(tile);
  }
  return box;
}
function guessRow(item,index) {
  const row=node('div','shared-word-guess');
  const who=node('span','shared-word-author',safe(item.name||'Member'));
  const num=node('span','shared-word-number','#'+(index+1));
  row.append(num,who,tileGroup(item));
  if(item.points!==undefined && item.points!==null){
    row.append(node('strong','shared-word-points','+'+Number(item.points||0)+' pts'));
  }
  const at=item.at||item.created_at;
  if(at)row.append(node('time','shared-word-clock',easternTime(at)));
  return row;
}
function ensureLedger(mode) {
  const spec=MODES[mode],root=document.getElementById(spec.root);
  const toggle=document.getElementById(spec.toggle);
  if(!root||!toggle || host?.hidden)return null;
  let panel=root.querySelector(':scope > .shared-word-ledger');
  if(panel)return panel;
  panel=node('section','shared-word-ledger');
  panel.id='shared-word-ledger-'+mode;
  panel.setAttribute('aria-label','All team guesses for '+spec.label);
  panel.dataset.mode=mode;

  const head=node('div','shared-word-ledger-head');
  const title=node('strong','shared-word-ledger-title','TEAM GUESS LOG · '+spec.label);
  const counter=node('span','shared-word-counter','Loading shared guesses…');
  counter.dataset.role='counter';
  head.append(title,counter);
  const status=node('p','shared-word-help','Every member sees every guess, even when the game is closed. Refreshed automatically.');
  const guesses=node('div','shared-word-current');guesses.dataset.role='current';
  const foot=node('p','shared-word-help','Only dictionary-approved five-letter words count as guesses. Invalid words cost no turns. ');
  const license=node('a','shared-word-source','Guess-list source and MIT license');
  license.href='https://github.com/tabatkins/wordle-list/blob/main/LICENSE';
  license.target='_blank';license.rel='noopener noreferrer';
  foot.append(license);

  const archive=node('details','shared-word-archive');
  const summary=node('summary','','Browse previous rounds and every saved guess');
  const history=node('div','shared-word-archive-content');history.dataset.role='history';
  const load=node('button','shared-word-older','Load older rounds');
  load.type='button';load.hidden=true;load.dataset.role='older';
  archive.append(summary,history,load);
  archive.addEventListener('toggle',()=>{
    if(archive.open && !archive.dataset.loaded)void loadHistory(panel,true);
  });
  load.addEventListener('click',()=>void loadHistory(panel,false));
  panel.append(head,status,guesses,foot,archive);
  toggle.after(panel);
  return panel;
}

function renderCurrent(mode,data) {
  const panel=ensureLedger(mode);if(!panel || !data)return;
  const guesses=Array.isArray(data.guesses)?data.guesses:[];
  const signature=safe(data.day)+'/'+guesses.map((x,i)=>[i,x.guess,x.user_id,x.points].join(':')).join('|');
  const counter=panel.querySelector('[data-role="counter"]');
  counter.textContent=guesses.length+' of '+Number(data.max_attempts||0)+' guesses · '+safe(data.day||todayLocal());
  if(panel.dataset.signature===signature)return;
  panel.dataset.signature=signature;
  const area=panel.querySelector('[data-role="current"]');
  area.replaceChildren();
  if(!guesses.length){
    area.append(node('p','shared-word-empty','No guesses yet. Everyone will see the first one here.'));
  } else {
    for(const [i,g] of guesses.entries())area.append(guessRow(g,i));
  }
}

function makeRound(round) {
  const details=node('details','shared-word-archive-round');
  const count=(round.guesses||[]).length;
  const answer=round.answer? ' · Answer '+safe(round.answer):' · Mystery remains hidden';
  const heading=node('summary','',safe(round.day)+' · '+count+' guesses'+answer);
  const content=node('div','shared-word-archive-rows');
  const guesses=Array.isArray(round.guesses)?round.guesses:[];
  if(!guesses.length)content.append(node('p','shared-word-empty','No guesses recorded this day.'));
  else for(const [i,g] of guesses.entries())content.append(guessRow(g,i));
  for(const archived of (round.archived||[])){
    const special=node('section','shared-word-earlier-round');
    special.append(node('strong','','Earlier completed round · '+safe(archived.answer||'Unknown')));
    const rows=archived.guesses||[];
    for(const [i,g] of rows.entries())special.append(guessRow(g,i));
    content.append(special);
  }
  details.append(heading,content);
  return details;
}
async function loadHistory(panel,reset) {
  if(!client||!memberId||panel.dataset.loading==='yes')return;
  const mode=panel.dataset.mode;
  const box=panel.querySelector('[data-role="history"]');
  const older=panel.querySelector('[data-role="older"]');
  panel.dataset.loading='yes';
  older.disabled=true;
  if(reset){box.replaceChildren(node('p','shared-word-empty','Loading saved rounds…'));delete panel.dataset.before;}
  try{
    const args={p_game:mode,p_limit:14};
    if(!reset && panel.dataset.before)args.p_before=panel.dataset.before;
    const {data,error}=await client.rpc('community_word_shared_history',args);
    if(error)throw error;
    const rounds=Array.isArray(data?.rounds)?data.rounds:[];
    if(reset)box.replaceChildren();
    for(const round of rounds)box.append(makeRound(round));
    if(!box.children.length)box.append(node('p','shared-word-empty','No earlier rounds have been recorded.'));
    panel.dataset.before=safe(data?.older_before||'');
    older.hidden=!(data?.can_load_older&&rounds.length);
    panel.dataset.loaded='true';
  }catch(err){
    box.append(node('p','shared-word-error','Could not open shared history. '+safe(err.message||'Try again.')));
  }finally{
    panel.dataset.loading='no';older.disabled=false;
  }
}
function removeLedgers(){
  for(const id of Object.keys(MODES))document.getElementById('shared-word-ledger-'+id)?.remove();
}
async function checkMembership(){
  if(!client||checking)return false;
  checking=true;
  try{
    const {data:{session},error}=await client.auth.getSession();
    if(error || !session?.user?.id){memberId=null;removeLedgers();return false;}
    const uid=session.user.id;
    if(uid!==memberId){
      const res=await client.from('community_members').select('status').eq('user_id',uid).maybeSingle();
      if(res.error||res.data?.status!=='approved'){memberId=null;removeLedgers();return false;}
      memberId=uid;
    }
    ensureLedger('quest');ensureLedger('w0rdle');
    return true;
  }catch {memberId=null;removeLedgers();return false;}
  finally{checking=false;}
}
async function refresh(){
  if(!client||refreshing||document.hidden||host?.hidden)return;
  const hasRoot=Object.values(MODES).some(spec=>document.getElementById(spec.root));
  if(!hasRoot)return;
  refreshing=true;
  try{
    if(!(await checkMembership()))return;
    const [quest,wordle]=await Promise.all([
      client.rpc('community_word_state'),
      client.rpc('community_wordle_state')
    ]);
    if(!quest.error)renderCurrent('quest',quest.data);
    if(!wordle.error)renderCurrent('w0rdle',wordle.data);
    lastRefresh=Date.now();
  }catch {/* Keep the original games functional if optional live history is unavailable. */}
  finally{refreshing=false;}
}
function schedule(delay=250){
  if(!client)return;
  setTimeout(()=>void refresh(),delay);
}
async function start(){
  if(!host||!config?.supabaseUrl||!config?.publishableKey)return;
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(config.supabaseUrl,config.publishableKey,{
    auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,
      detectSessionInUrl:false,storage}
  });
  startupWatcher=new MutationObserver(()=>{
    if(memberId){ensureLedger('quest');ensureLedger('w0rdle');}
    if(Date.now()-lastRefresh>9500)schedule(350);
  });
  startupWatcher.observe(host,{subtree:true,childList:true});
  document.addEventListener('submit',event=>{
    if(event.target?.id==='commons-word-form'||event.target?.id==='letter-lock-form')schedule(1100);
  },true);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(200);});
  window.addEventListener('focus',()=>schedule(250));
  client.auth.onAuthStateChange(event=>{
    if(event==='SIGNED_OUT'){memberId=null;removeLedgers();}
    else schedule(350);
  });
  setInterval(()=>{if(!document.hidden)void refresh();},10000);
  schedule(500);
}
void start().catch(()=>{});
