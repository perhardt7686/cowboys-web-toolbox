import {CATEGORIES,RULES_VERSION,escapeHTML as esc,renderBody,initials,displayName,validatePost,edwardReply,canPost,safeHttps,reviewContent} from './community-core.mjs';
import {createProfileStudio} from './community-profiles.mjs?v=pause3';
import {createOwnerCenter} from './community-owner.mjs?v=lab1-core1';
import {PROFILE_DEFAULTS} from './profile-core.mjs?v=powers1';
import {createPowerHouse} from './community-powers.mjs?v=private1';
import {createForum} from './forum-ui.mjs?v=private1';
import {timeHTML,forumBody} from './forum-core.mjs?v=powers1';
import {createCommunityLab} from './community-lab.mjs?v=hero4';
import {validateLabPost} from './lab-core.mjs';
import {canReadBoard,accessCopy} from './board-access.mjs?v=private1';
import {createAuthStorage,createRecoveryStep,requestPasswordReset,authErrorMessage,resetRetrySeconds} from './auth-flow.mjs?v=recovery1';

const $=id=>document.getElementById(id);
const config=window.COWBOY_COMMUNITY_CONFIG||{enabled:false};
const query=new URLSearchParams(location.search),isPreview=query.get('preview')==='1'&&['localhost','127.0.0.1'].includes(location.hostname);
const configured=config.enabled===true&&/^https:\/\/[a-z0-9-]+\.supabase\.(?:co|in)$/u.test(config.supabaseUrl||'')&&typeof config.publishableKey==='string'&&config.publishableKey.length>20;
const registrationOpen=configured&&config.registrationOpen!==false;
const categories=new Map(CATEGORIES.map(c=>[c.id,c]));
const state={category:'all',search:'',sort:'active',site:query.get('site')||null,threads:[],member:null,user:null,replies:[],thread:null,offset:0,hasMore:false,loading:false,recovery:false,profile:null};
let client=null,catalog=[],authView='login',reviewToken=null,queue=null,previewSequence=10;
let recoveryStep=null,authStorage=null,authStorageKey='',authProblem='',resetCooldownUntil=0,authCooldownTimer=null;
// In-memory sample IDs only; authorization tokens are generated on the server.
const sampleID=()=>`00000000-0000-4000-8000-${String(++previewSequence).padStart(12,'0')}`;
const fragment=new URLSearchParams(location.hash.slice(1));
// Supabase must authenticate the invitation before this form can save a password.
state.passwordSetup=fragment.get('type')==='invite';
if(fragment.has('review')){reviewToken=fragment.get('review');history.replaceState(null,'',location.pathname+location.search);}
const previewRows=[
  {id:'11111111-1111-4111-8111-111111111111',author_id:'77777777-7777-4777-8777-777777777777',author_name:'Example member',title:'The little tool that finally made diagrams click',body:'I tried Excalidraw from the collection to map out a project. Simple, a little imperfect, and exactly what I needed. What have you made with it?',category:'creative',site_id:'excalidraw',created_at:'2026-10-23T13:25:00Z',reply_count:0,pinned:true,status:'published'},
  {id:'22222222-2222-4222-8222-222222222222',author_id:'88888888-8888-4888-8888-888888888888',author_name:'Sample explorer',title:'@Edward, where should I look for used auto parts?',body:'I’m looking for a useful starting point for recycled vehicle parts. Is there something in the toolbox that searches those inventories?',category:'repair',site_id:'car-part-com',created_at:'2026-10-23T12:30:00Z',reply_count:0,status:'published'},
  {id:'33333333-3333-4333-8333-333333333333',author_id:'77777777-7777-4777-8777-777777777777',author_name:'Example maker',title:'What’s the website you keep coming back to?',body:'The internet has a lot of noise. I’d love to hear about the small, genuinely useful tools you’ve kept in your bookmarks—and what you use them for.',category:'discoveries',site_id:null,created_at:'2026-10-23T11:35:00Z',reply_count:0,status:'published'},
  {id:'44444444-4444-4444-8444-444444444444',author_name:'Sample member',title:'A good way to turn a daunting project into smaller steps',body:'Has anyone tried Magic ToDo? I’m curious how you use task breakdown tools for practical projects around the house.',category:'help',site_id:'goblin-tools-magic-todo',created_at:'2026-10-22T20:15:00Z',reply_count:0,status:'published'},
  {id:'55555555-5555-4555-8555-555555555555',author_name:'Example visitor',title:'A small idea for making the collection even easier to browse',body:'I like the category filters. A conversation attached to each website would be a nice way to trade tips and flag a changed link.',category:'feedback',site_id:null,created_at:'2026-10-22T18:25:00Z',reply_count:0,status:'published'}
];
let demoThreads=previewRows.map(r=>({...r})),demoReplies=new Map(),demoMembers=[{user_id:'66666666-6666-4666-8666-666666666666',display_name:'Example new member',status:'pending',created_at:'2026-10-23T12:15:00Z'}];
const timeLabel=value=>{const date=new Date(value);if(!Number.isFinite(date.getTime()))return 'Recently';return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(date)};
function toast(message){$('community-toast').textContent=message;$('community-toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('community-toast').hidden=true,4000)}
function showDialog(html,{allowUnapproved=false}={}){if(!allowUnapproved&&!canReadBoard(state.member))return;$('content-dialog').classList.remove('profile-dialog','member-dialog','power-dialog');$('dialog-content').innerHTML=html;const dialog=$('content-dialog');if(!dialog.open)dialog.showModal();}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close())}
function formMessage(form,message,success=false){let target=form.querySelector('.form-message');if(!target){target=document.createElement('div');target.className='form-message';target.setAttribute('role','alert');form.prepend(target)}target.classList.toggle('success',success);target.textContent=message;}
function errorMessage(error){return error instanceof Error?error.message:'Please try again in a moment.';}
function paintResetCooldown(){
  clearInterval(authCooldownTimer);const button=document.querySelector('#auth-form[data-view="forgot"] [type="submit"]');if(!button||!configured||isPreview)return;
  const update=()=>{const remaining=Math.max(0,Math.ceil((resetCooldownUntil-Date.now())/1000));button.disabled=remaining>0;button.textContent=remaining?`Try again in ${remaining} seconds`:'Send a reset link ↗';if(!remaining)clearInterval(authCooldownTimer);};update();if(resetCooldownUntil>Date.now())authCooldownTimer=setInterval(update,1000);
}
function clearAuthCallback(){const url=new URL(location.href);for(const key of ['code','sb_flow_id','error','error_code','error_description'])url.searchParams.delete(key);url.hash='';history.replaceState(null,'',url.pathname+url.search);}
function mustSignIn(){if(!state.member){openAuth('login');return true}return false}
function publicURL(id){return `community.html?${isPreview?'preview=1&':''}thread=${encodeURIComponent(id)}`;}
function siteLink(siteId){const site=catalog.find(s=>s.id===siteId);return site?`<a class="thread-site" href="./#explore" data-catalog="${esc(site.id)}">↗ In the collection: ${esc(site.name)}</a>`:'';}
function roleBadge(reply){return reply.author_kind==='edward'?'<span class="moderator-badge">Automated moderator</span>':'';}
function clearBoardState(){
  state.boardEpoch=(state.boardEpoch||0)+1;state.openGeneration=(state.openGeneration||0)+1;state.threads=[];state.replies=[];state.thread=null;state.quoteReferences=new Map();state.hasMore=false;
  profiles.clear();hub.clear();$('community-feed').replaceChildren();$('dialog-content').replaceChildren();$('content-dialog').close();$('community-announcement').hidden=true;$('community-announcement').textContent='';ownerCenter.hide();
}
function renderBoardAccess(){
  const allowed=canReadBoard(state.member);$('board-access').hidden=allowed;document.querySelector('.community-layout').hidden=!allowed;const intro=$('lab-intro');if(intro)intro.hidden=!allowed;
  if(allowed)return true;const copy=accessCopy(state.member);
  $('board-access-content').innerHTML=`<span class="board-access-mark" aria-hidden="true">⌑</span><p class="eyebrow">THE COMMONS / MEMBERSHIP</p><h2>${esc(copy.title)}</h2><p>${esc(copy.text)}</p><div class="board-access-actions">${!state.member?'<button class="button-primary" data-auth="login">Log in</button><button class="button-quiet" data-auth="signup">Request membership</button>':copy.pending?'<button class="button-primary" data-check-membership>Check approval status</button>':''}<a class="button-quiet" href="./">Explore the website collection</a></div><p class="board-access-foot">The website collection is open to everyone. Reading or posting on the boards requires approved membership.</p>`;return false;
}
function renderCategories(){$('community-categories').innerHTML=[{id:'all',name:'All conversations',icon:'◌'},...CATEGORIES].map(c=>`<button data-category="${c.id}" aria-pressed="${state.category===c.id}"><span class="category-icon" aria-hidden="true">${c.icon}</span>${esc(c.name)}</button>`).join('');}
function renderAccount(){
  if(!state.member){$('account-actions').innerHTML='<button class="button-quiet" data-auth="login">Log in</button><button class="button-primary button-small" data-auth="signup">Join the conversation <span aria-hidden="true">↗</span></button>';return}
  const member=state.member;
  $('account-actions').innerHTML=`<details class="account-menu"><summary>${profiles.avatar({...state.profile,display_name:member.display_name})}<span>${esc(member.display_name)}</span><span aria-hidden="true">⌄</span></summary><div class="account-dropdown"><button data-profile>Customize my profile</button>${member.role==='owner'?'<button data-owner>Owner dashboard</button>':''}<button data-signout>Log out</button></div></details>`;
  if(canReadBoard(member)){hub.decorateAccount();powers.decorateAccount();}
}
function renderNotice(){
  let html='';
  if(!configured&&!isPreview)html='<div class="membership-banner"><p><b>Membership opens soon.</b><small>The community is being prepared. You can keep exploring the website collection.</small></p><a class="button-quiet" href="./">Browse the collection ↗</a></div>';
  else if(!state.member&&!registrationOpen&&!isPreview)html='<div class="membership-banner"><p><b>Membership opens soon.</b><small>Owner setup is in progress. You can browse the website collection.</small></p><a class="button-quiet" href="./">Browse the collection ↗</a></div>';
  else if(state.member?.status==='pending')html='<div class="membership-banner"><p><b>Your email is verified. Your seat is nearly ready.</b><small>Cowboy will review your membership request. The boards open after your membership is approved.</small></p><button class="button-quiet" data-check-membership>Check status ↻</button></div>';
  else if(state.member&&state.member.status!=='approved')html='<div class="membership-banner"><p><b>Board access is unavailable.</b><small>You can still browse the public collection. Account status is controlled by Cowboy.</small></p></div>';
  $('membership-notice').innerHTML=html;
}
function renderSiteFilter(){const site=catalog.find(s=>s.id===state.site);$('site-filter').hidden=!site;if(site)$('site-filter').innerHTML=`<div><span>Conversations about <b>${esc(site.name)}</b></span><button data-clear-site aria-label="Show conversations about all websites">×</button></div>`;}
function renderFeed(){
  if(!canReadBoard(state.member)){clearBoardState();renderAccount();renderNotice();renderBoardAccess();return;}
  renderBoardAccess();renderCategories();renderAccount();renderNotice();renderSiteFilter();
  const title=state.category==='all'?'What’s on your mind?':categories.get(state.category)?.name;
  $('feed-title').textContent=title;
  const terms=state.search.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  const rows=state.threads.filter(t=>hub.filterRow(t)&&forum.filterRow(t)).filter(t=>configured&&!isPreview||((state.category==='all'||t.category===state.category)&&(!state.site||t.site_id===state.site)&&terms.every(w=>`${t.title} ${t.body} ${t.author_name}`.toLowerCase().includes(w)))).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(state.sort==='replies'?Number(b.visible_reply_count||b.reply_count||0)-Number(a.visible_reply_count||a.reply_count||0):state.sort==='helpful'?Number(b.helpful_count||0)-Number(a.helpful_count||0):(state.sort==='oldest'?1:-1)*(Date.parse(state.sort==='active'?(a.activity_at||a.created_at):a.created_at)-Date.parse(state.sort==='active'?(b.activity_at||b.created_at):b.created_at)))||a.id.localeCompare(b.id));
  $('feed-count').textContent=`${rows.length} conversation${rows.length===1?'':'s'}${isPreview?' · sample content':''}`;
  $('community-feed').innerHTML=rows.length?rows.map(t=>`<article class="thread-card" data-thread-card="${esc(t.id)}"><div class="thread-kicker"><span class="category-dot"></span>${esc(categories.get(t.category)?.name||'Conversation')}${t.pinned?'<span>· Pinned</span>':''}${isPreview?'<span class="sample-label">SAMPLE</span>':''}</div><h3><button class="thread-title" data-thread="${esc(t.id)}" aria-label="Open post: ${esc(t.title)}">${esc(t.title)}</button></h3><p class="thread-excerpt">${esc(t.body.slice(0,190))}${t.body.length>190?'…':''}</p>${siteLink(t.site_id)}<span class="thread-open-cue" aria-hidden="true"><span>👆 Tap anywhere to open</span><span class="thread-open-arrow">→</span></span><div class="thread-bottom">${profiles.author(t.author_id,t.author_name)}<span class="thread-age">· ${timeLabel(t.created_at)}</span><span class="thread-count">↳ ${Number(t.reply_count||0)} replies</span>${t.locked?'<span class="read-state">Closed</span>':''}</div></article>`).join(''):`<div class="community-empty"><span aria-hidden="true">✳</span><h3>${state.search?'No conversations this time.':'The first good conversation starts somewhere.'}</h3><p>${state.search?'Try a different word or another category.':'Share a useful discovery, ask a thoughtful question, or be the first to talk about a tool from the collection.'}</p><button class="button-primary" data-start>Start a conversation ↗</button></div>`;
  $('load-more').hidden=!state.hasMore;
  hub.decorateFeed(rows);forum.decorateFeed(rows);powers.decorateFeed(rows);
}
async function loadFeed(append=false){
  if(!canReadBoard(state.member)){renderFeed();return;}const reader=state.member.user_id,epoch=state.boardEpoch||0;
  if(state.loading){state.reloadRequested=true;return;}state.loading=true;$('refresh-community').disabled=true;
  try{
    await hub.refreshPersonal();
    if(isPreview){state.threads=demoThreads.filter(t=>t.status==='published').map(t=>({...t}));state.hasMore=false;}
    else if(configured&&client){
      if(!append)state.offset=0;
      let request=(state.search.trim()?client.rpc('community_search_threads',{p_query:state.search.trim()}):client.from('community_threads')).select('*').eq('status','published');
      if(state.category!=='all')request=request.eq('category',state.category);
      if(state.site)request=request.eq('site_id',state.site);
      request=hub.applyQuery(request);
      const {data,error}=await request.order('pinned',{ascending:false}).order({active:'activity_at',replies:'visible_reply_count',helpful:'helpful_count'}[state.sort]||'created_at',{ascending:state.sort==='oldest'}).order('id').range(state.offset,state.offset+29);
      if(error)throw new Error('The conversations could not load. Please try Refresh.');
      if(!canReadBoard(state.member)||state.member.user_id!==reader||(state.boardEpoch||0)!==epoch)return;
      const rows=data.map(t=>({...t,reply_count:t.visible_reply_count||0}));state.threads=append?[...state.threads,...rows]:rows;state.offset+=rows.length;state.hasMore=rows.length===30;
    }else{state.threads=[];state.hasMore=false;}
    await profiles.load(state.threads.map(t=>t.author_id));
    await powers.refreshOwn();await powers.loadHonors(state.threads.map(t=>t.author_id));
    renderFeed();
  }catch(error){$('community-feed').innerHTML=`<div class="community-empty"><span aria-hidden="true">↻</span><h3>A little pause in the conversation.</h3><p>${esc(errorMessage(error))}</p><button class="button-quiet" data-refresh>Try again</button></div>`;}
  finally{state.loading=false;$('refresh-community').disabled=false;if(state.reloadRequested){state.reloadRequested=false;await loadFeed();}}
}
function authFields(view){
  const disabled=!configured||isPreview||(view==='signup'&&!registrationOpen)?'disabled':'';
  const newPassword=['signup','reset','setup'].includes(view);
  const password=`<label class="field"><span>${['reset','setup'].includes(view)?'New password':'Password'}</span><span class="password-field"><input name="password" type="password" autocomplete="${newPassword?'new-password':'current-password'}" ${view==='login'?'':'minlength="15" maxlength="128"'} required ${disabled}><button type="button" data-show-password aria-label="Show password">Show</button></span>${newPassword?'<small>Use a memorable passphrase of at least 15 characters.</small>':''}</label>`;
  if(['reset','setup'].includes(view))return password+`<label class="field"><span>Confirm new password</span><input name="confirmPassword" type="password" autocomplete="new-password" minlength="15" maxlength="128" required ${disabled}></label><button class="button-primary form-full" type="submit" ${disabled}>Save new password ↗</button>`;
  return (view==='signup'?`<label class="field"><span>Display name</span><input name="displayName" autocomplete="nickname" minlength="2" maxlength="36" placeholder="What should we call you?" required ${disabled}><small>Visible to the community. Your email stays private.</small></label>`:'')+`<label class="field"><span>Email address</span><input name="email" type="email" autocomplete="email" placeholder="you@example.com" required ${disabled}></label>`+(['forgot','resend'].includes(view)?'':password)+(view==='login'?'<div class="form-options"><label class="check-label"><input type="checkbox" name="remember">Remember this device</label><button type="button" class="text-button" data-auth="forgot">Forgot your password?</button></div>':'')+(view==='signup'?`<label class="check-label"><input name="rules" type="checkbox" required ${disabled}><span>I agree to the <button type="button" class="text-button" data-rules>community guidelines</button> and have read the <button type="button" class="text-button" data-privacy>account privacy notice</button>.</span></label>`:'')+`<button class="button-primary form-full" type="submit" ${disabled}>${view==='signup'?'Create my account':view==='forgot'?'Send a reset link':view==='resend'?'Resend verification':'Welcome back'} <span aria-hidden="true">↗</span></button>`;
}
function openAuth(view='login',message=''){
  authView=view;
  const states={
    check:{icon:'✉',title:'Check your inbox.',description:'If a new account can be created for that email, you’ll receive a verification link. Open it in the same browser you used to sign up. Cowboy reviews membership access after verification.'},
    resetSent:{icon:'✉',title:'Check your newest email.',description:'If an account exists for that address, a reset email will arrive. Keep this page open. Open only the newest link in this same browser, then enter and confirm your new passphrase. Each link works once.'},
    pending:{icon:'◷',title:'Your seat is nearly ready.',description:'Your email is verified. Your posting request is awaiting Cowboy’s review. You can browse while you wait.'},
    resetDone:{icon:'✓',title:'A fresh start, secured.',description:'Your password was updated. Log in with your new passphrase.'}
  };
  let html='';
  if(states[view]){const s=states[view];html=`<div class="state-symbol" aria-hidden="true">${s.icon}</div><h2 id="auth-title">${s.title}</h2><p class="auth-description">${s.description}</p>${view==='check'?'<button class="text-button" data-auth="resend">Resend verification email</button>':''}${view==='pending'?'<ol class="state-steps"><li>Verify your own email address.</li><li>Cowboy reviews your membership request.</li><li>Return here to check your membership status.</li></ol><button class="text-button" data-check-membership>Check status ↻</button> <button class="text-button" data-resend-approval>Remind Cowboy</button>':''}<button class="button-primary form-full" data-auth="login">Back to log in ↗</button><button class="text-button" data-close>Keep exploring</button>`;}
  else {
    const title=view==='signup'?'A place for you.':view==='forgot'?'Forgot your password?':view==='resend'?'One more email.':view==='reset'?'Make a fresh start.':view==='setup'?'Secure your account.':'Good to see you.';
    const description=view==='signup'?'A few details, one email check, and a little good company.':view==='forgot'?'We’ll email you a secure link to choose a new passphrase.':view==='resend'?'If your signup is still awaiting confirmation, we’ll send a new verification link.':view==='reset'?'Choose a new passphrase. You’ll sign in again after saving it.':view==='setup'?'Choose your own passphrase to finish your invitation. You’ll sign in again after saving it.':'Log in to pick up the conversation.';
    html=`<h2 id="auth-title">${title}</h2><p class="auth-description">${description}</p>${['login','signup'].includes(view)?`<div class="auth-tabs" role="tablist" aria-label="Account access"><button data-auth="login" role="tab" aria-selected="${view==='login'}">Log in</button><button data-auth="signup" role="tab" aria-selected="${view==='signup'}">Create an account</button></div>`:''}${isPreview?'<div class="preview-message">Design preview. Account fields are disabled; no credentials are collected. Use “Preview as” on the page to explore member and owner states.</div>':!configured?'<div class="preview-message">Membership opens soon. Registration and sign-in will be available when setup is complete.</div>':view==='signup'&&!registrationOpen?'<div class="preview-message">New accounts open after owner setup is complete.</div>':''}<form id="auth-form" data-view="${view}">${message?`<div class="form-message" role="alert">${esc(message)}</div>`:''}${authFields(view)}</form><p class="auth-footnote">${view==='signup'?'Verify your own email first. Cowboy approves posting access through his verified owner account.':['forgot','resend'].includes(view)?'<button class="text-button" data-auth="login">Back to log in</button>':'Your email is private. Your display name appears on your posts.'}</p>`;
  }
  $('auth-content').innerHTML=html;const dialog=$('auth-dialog');if(!dialog.open)dialog.showModal();paintResetCooldown();
}
async function api(action,payload={}){
  if(isPreview)return demoAction(action,payload);
  if(!configured||!client)throw new Error('Membership opens soon.');
  const {data:{session},error}=await client.auth.getSession();if(error||!session)throw new Error('Log in to continue.');
  const response=await fetch(`${config.supabaseUrl}/functions/v1/${encodeURIComponent(config.functionName)}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':config.publishableKey,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action,...payload}),credentials:'omit',referrerPolicy:'no-referrer'});
  let data;try{data=await response.json()}catch{throw new Error('The community could not complete that request. Please try again.');}
  if(!response.ok)throw new Error(data.error||'Please try again in a moment.');return data;
}
async function bootstrap(){
  if(!configured||isPreview||!client)return;
  const generation=state.bootstrapGeneration=(state.bootstrapGeneration||0)+1;const {data:{session}}=await client.auth.getSession();if(generation!==state.bootstrapGeneration)return;state.user=session?.user||null;
  if(state.user&&(state.recovery||recoveryStep?.active(state.user.id))){state.recovery=true;ownerCenter.hide();state.member=null;state.profile=null;await powers.refreshOwn(true);renderFeed();if(authView!=='reset'||!$('auth-dialog').open)openAuth('reset');return;}
  if(!state.user){ownerCenter.hide();state.member=null;state.profile=null;await powers.refreshOwn(true);renderFeed();return;}
  if(!state.user.email_confirmed_at){ownerCenter.hide();state.member=null;openAuth('check');return;}
  const result=await api('bootstrap',{displayName:state.user.user_metadata?.display_name,rulesVersion:state.user.user_metadata?.rules_version});
  if(generation!==state.bootstrapGeneration)return;state.member=result.member;state.profile=result.profile;if(!canOpenCore())ownerCenter.hide();await profiles.setOwn(state.profile);await powers.refreshOwn(true);renderFeed();await refreshAnnouncement();
  if(state.passwordSetup)openAuth('setup');
  if(reviewToken){if(state.member.role==='owner')await openReviewLink();else toast('This review link is for the verified owner account.');}
}
async function submitAuth(form){
  if(!configured||isPreview)return;
  const values=new FormData(form),view=form.dataset.view,button=form.querySelector('[type=submit]');button.disabled=true;
  try{
    const email=String(values.get('email')||'').trim(),password=String(values.get('password')||'');
    const redirectTo=new URL('community.html',location.href).href;
    if(view==='signup'){
      if(!registrationOpen)throw new Error('New accounts open after owner setup is complete.');
      const name=displayName(values.get('displayName'));if(password.length<15||password.length>128)throw new Error('Use a passphrase of 15–128 characters.');
      if(!values.get('rules'))throw new Error('Please accept the community guidelines.');
      const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{display_name:name,rules_version:RULES_VERSION}}});
      form.reset();if(error)throw new Error('We couldn’t start that signup. Please check your details and try again shortly.');openAuth('check');
    }else if(view==='resend'){
      const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectTo}});form.reset();if(error)throw new Error('We couldn’t request that email right now. Please try again shortly.');openAuth('check');
    }else if(view==='forgot'){
      if(resetCooldownUntil>Date.now())throw new Error('Please wait for the countdown, then request one fresh link.');
      const {error}=await requestPasswordReset(client.auth,email,redirectTo,authStorage,authStorageKey);if(error){const retry=resetRetrySeconds(error);if(retry)resetCooldownUntil=Date.now()+retry*1000;throw new Error(authErrorMessage(error,'forgot'));}resetCooldownUntil=Date.now()+60000;form.reset();openAuth('resetSent');
    }else if(view==='reset'||view==='setup'){
      if(view==='reset'&&!state.recovery)throw new Error('Open the newest password-reset email first.');
      if(view==='setup'&&!state.user)throw new Error('Open your newest invitation email first.');
      if(password.length<15||password.length>128)throw new Error('Use a passphrase of 15–128 characters.');
      if(password!==String(values.get('confirmPassword')||''))throw new Error('The two new passwords do not match. Enter the same passphrase in both fields.');
      const {error}=await client.auth.updateUser({password});if(error)throw new Error(authErrorMessage(error,'reset'));form.reset();recoveryStep?.clear();
      const {error:signoutError}=await client.auth.signOut({scope:'global'});state.recovery=false;state.passwordSetup=false;state.member=null;state.user=null;await powers.refreshOwn(true);renderFeed();openAuth('resetDone');if(signoutError)formMessage($('auth-content'),'Your password was saved, but signing out did not finish. Close this tab and log in with your new passphrase.');
    }else {
      try{localStorage.setItem('cowboy-community-remember',values.get('remember')?'yes':'no')}catch{}
      const {error}=await client.auth.signInWithPassword({email,password});form.reset();if(error)throw new Error('We couldn’t sign you in. Check your details or request a password reset.');
      await bootstrap();await loadFeed();if(state.member?.status==='pending')openAuth('pending');else $('auth-dialog').close();
    }
  }catch(error){formMessage(form,errorMessage(error));}finally{if(button.isConnected)button.disabled=false;paintResetCooldown();}
}
function openComposer(){return hub.openComposer('discussion');}
async function submitThread(form){const button=form.querySelector('[type=submit]');button.disabled=true;try{const values=Object.fromEntries(new FormData(form));validatePost(values,catalog);const {thread}=await api('create_thread',values);$('content-dialog').close();await loadFeed();if(thread.status==='held')toast('Saved for Cowboy’s review. It is not visible to other members.');else{await openThread(thread.id);toast(isPreview?'Sample conversation added for this preview only.':'Your conversation is posted.');}}catch(error){formMessage(form,errorMessage(error));}finally{button.disabled=false;}}
async function openThread(id,{page=0,replyId=null,latest=false}={}){
  if(!canReadBoard(state.member)){renderFeed();if(!state.member)openAuth('login','Approved membership is required to read this conversation.');else toast('The boards open after membership approval.');return;}
  const generation=state.openGeneration=(state.openGeneration||0)+1;
  try{
    let thread,replies,total,quoteReferences=new Map();page=Math.max(0,Math.floor(page)||0);
    if(isPreview){
      if(replyId){const found=[...demoReplies].find(([,rows])=>rows.some(r=>r.id===replyId));if(found)id=found[0];}
      thread=demoThreads.find(t=>t.id===id);const all=(demoReplies.get(id)||[]).filter(r=>!['held','hidden'].includes(r.status));total=all.length;
      if(latest)page=Math.max(0,Math.ceil(total/50)-1);if(replyId){const at=all.findIndex(r=>r.id===replyId);if(at>=0)page=Math.floor(at/50);}
      replies=all.slice(page*50,page*50+50);for(const r of all)quoteReferences.set(r.id,r);
    }else{
      if(replyId){const location=await client.from('community_replies').select('thread_id').eq('id',replyId).eq('status','published').maybeSingle();if(location.error)throw new Error('That reply could not load.');if(location.data)id=location.data.thread_id;}
      const a=await client.from('community_threads').select('*').eq('id',id).eq('status','published').single();if(a.error)throw new Error('That conversation is unavailable.');thread=a.data;
      total=thread.visible_reply_count||0;if(latest)page=Math.max(0,Math.ceil(total/50)-1);
      if(replyId){
        const target=await client.from('community_replies').select('id,created_at').eq('id',replyId).eq('thread_id',id).eq('status','published').maybeSingle();
        if(target.error)throw new Error('That reply could not load.');
        if(target.data){const r=target.data,position=await client.from('community_replies').select('id',{count:'exact',head:true}).eq('thread_id',id).eq('status','published').or(`created_at.lt.${r.created_at},and(created_at.eq.${r.created_at},id.lt.${r.id})`);if(position.error)throw new Error('That reply could not be located.');page=Math.floor(position.count/50);}
        else toast('That reply is no longer available to members.');
      }
      page=Math.min(page,Math.max(0,Math.ceil(total/50)-1));
      const b=await client.from('community_replies').select('*',{count:'exact'}).eq('thread_id',id).eq('status','published').order('created_at').order('id').range(page*50,page*50+49);if(b.error)throw new Error('The replies could not load.');replies=b.data;total=b.count||0;
      const refs=[...new Set(replies.map(r=>r.reply_to_id).filter(Boolean))];if(refs.length){const q=await client.from('community_replies').select('id,body,author_name').eq('status','published').in('id',refs);for(const r of q.data||[])quoteReferences.set(r.id,r);}
    }
    if(!thread)throw new Error('That conversation is unavailable.');if(generation!==state.openGeneration)return;
    state.thread=thread;state.replies=replies;state.replyPage=page;state.replyTotal=total;state.quoteReferences=quoteReferences;await profiles.load([thread.author_id,...replies.map(r=>r.author_id)]);await powers.refreshOwn();await powers.loadHonors([thread.author_id,...replies.map(r=>r.author_id)]);if(generation!==state.openGeneration)return;
    showDialog(`<div class="thread-kicker">${esc(categories.get(thread.category)?.name||'Conversation')}${isPreview?'<span class="sample-label">SAMPLE</span>':''}</div><h2 id="content-title">${esc(thread.title)}</h2><div class="thread-meta">${profiles.author(thread.author_id,thread.author_name)}${thread.locked?'<span class="read-state">Closed to replies</span>':''}</div><div class="forum-post-context">${forum.metadata({...thread,author_kind:'member'})}</div>${siteLink(thread.site_id)}<div class="thread-detail-body">${forumBody(thread.body)}</div>${forum.signature(thread.author_id)}<div class="thread-detail-actions"><button class="text-button" data-share-thread="${esc(id)}">Copy topic link ↗</button>${thread.accepted_reply_id?`<button class="button-quiet" data-forum-jump="${esc(thread.accepted_reply_id)}">Jump to accepted answer ✓</button>`:''}<button class="text-button" data-report-thread="${esc(id)}">Report to Cowboy</button>${state.member?.role==='owner'?`<button class="text-button" data-pin-thread="${esc(id)}">${thread.pinned?'Unpin conversation':'Pin conversation'}</button><button class="text-button" data-lock-thread="${esc(id)}">${thread.locked?'Reopen conversation':'Close replies'}</button><button class="text-button danger-link" data-hide-thread="${esc(id)}">Hide conversation</button>`:''}</div><h3 class="replies-heading">The replies</h3>${forum.pager()}<div id="thread-replies">${replies.length?replies.map((reply,i)=>forum.replyHTML(reply,i)).join(''):'<p class="form-hint">There’s room for the first thoughtful reply.</p>'}</div>${total>50?forum.pager():''}${thread.locked?'<p class="form-hint">Cowboy has closed this conversation to new replies.</p>':canPost(state.member)?`<form class="reply-form" id="reply-form"><label class="field"><span>Add your voice</span><textarea name="body" minlength="2" maxlength="6000" placeholder="A useful reply goes a long way…" required></textarea></label><button class="button-primary button-small" type="submit">${isPreview?'Try a sample reply':'Post reply'} ↗</button></form>`:state.member?'<p class="form-hint">Your posting access must be approved before you can reply.</p>':'<p class="form-hint"><button class="text-button" data-auth="login">Log in</button> or <button class="text-button" data-auth="signup">join the community</button> to add your voice.</p>'}`);
    await hub.decorateThread(thread,replies);forum.afterThread();powers.decorateThread(thread,replies);
    if(replyId){const node=document.getElementById('reply-'+replyId);node?.scrollIntoView({block:'center'});node?.focus();}
  }catch(error){if(generation===state.openGeneration)toast(errorMessage(error));}
}
async function submitReply(form){
  const button=form.querySelector('[type=submit]');button.disabled=true;
  try{
    const threadId=state.thread.id,result=await api('reply',{threadId,body:new FormData(form).get('body'),replyToId:form.elements.replyToId?.value||null});forum.clearDraft();
    if(result.reply.status==='held'){form.reset();formMessage(form,'Your reply was saved for Cowboy’s review. It is not visible to other members.',true);}
    else {await loadFeed();await openThread(threadId,{replyId:result.reply.id,latest:true});toast(isPreview?'Sample reply added for this preview only.':'Your reply is posted.');}
  }catch(error){formMessage(form,errorMessage(error));}finally{button.disabled=false;}
}

function openReport(threadId,replyId=null){if(mustSignIn())return;showDialog(`<p class="eyebrow">Keep this corner welcoming</p><h2 id="content-title">Let Cowboy know.</h2><p class="dialog-lead">Reports are private. Cowboy reviews the context before making a moderation decision.</p>${isPreview?'<div class="preview-message">Preview only. No report or email will be sent.</div>':''}<form id="report-form" data-thread="${esc(threadId)}" data-reply="${esc(replyId||'')}"><label class="field"><span>What needs a look?</span><select name="reason"><option value="spam">Spam or a scam</option><option value="privacy">Private information</option><option value="abuse">Abuse or harassment</option><option value="broken-link">A broken or misleading link</option><option value="other">Something else</option></select></label><label class="field"><span>A little context <small>Optional</small></span><textarea name="details" maxlength="2000" placeholder="Explain what needs review. Please don’t repeat passwords or private credentials."></textarea></label><button type="submit" class="button-primary">Send a private report ↗</button></form>`);}
function showGuidelines(){showDialog('<p class="eyebrow">A few good ground rules</p><h2 id="content-title">Good finds. Good company.</h2><ol class="guideline-list"><li><b>Be useful and kind.</b> Questions are welcome. Harassment, scams, impersonation and spam are not.</li><li><b>Give credit.</b> Link the original website or source. Be clear when something is your opinion or hasn’t been tested.</li><li><b>Keep private things private.</b> Never post passwords, access tokens, private contact details or someone else’s personal information.</li><li><b>Help the collection improve.</b> Report a broken link or a concern privately. A report asks for review; it does not automatically ban a member.</li><li><b>Know who is replying.</b> Edward is the automated moderator. He suggests tools from the recorded collection. Cowboy controls approvals and final moderation decisions.</li></ol><p class="privacy-notice">Guidelines version: '+RULES_VERSION+'. Reading and posting require verification of your own email and Cowboy’s approval.</p>',{allowUnapproved:true});}
function showPrivacy(){showDialog('<p class="eyebrow">Privacy & your account</p><h2 id="content-title">A members-only conversation.<br>A private email.</h2><div class="privacy-notice"><p>Only approved members can read conversations, published replies, shared profiles and board announcements. Your email and password are handled by the authentication provider; passwords are never stored in forum posts or sent to Cowboy.</p><p>Supabase provides account authentication and community storage. Verification and reset emails go to your own address. Membership review and report notices go to the owner’s private mailbox through the configured mail sender.</p><p>Session credentials are managed by the authentication service. “Remember this device” keeps the session in this browser. Catalog favorites remain separate and stay in this browser. Board bookmarks, follows and reply notifications are private to your account. Unshared forum identity extras and reading preferences are stored separately from shared member profile data. Browser-local text drafts are scoped to your account and recoverable for 30 days; clear them on shared devices. Unread topic markers are saved on this browser. Reply locations use only a currently shared profile location with explicit author consent; no device or IP location is requested. A weekly email digest is off by default and requires an explicit preference; its unsubscribe link opens a confirmation. Helpful votes and poll choices are stored per approved member, while only aggregate counts are shared with approved members. Community-tested notes are member experiences, not guarantees. Website counters record aggregate destination clicks, not unique visitors. They store no clicker email, account ID or IP address. Random event IDs are retained briefly to avoid duplicate counts; the counter has a short browser cooldown.</p><p>Membership records, private reports, rate-limit counters and an owner moderation log support the board. The on-site Edward assistant uses the public catalog and conversation text for fixed suggestions. The separate scheduled monitor can also check member questions and post disclosed automated replies. Automated replies never include private mailbox or account information.</p><p>Request account deletion from My account. The request is sent for owner review; the site will not claim deletion is complete until it has been carried out. Members can copy content they can read. Previously public copies cannot be recalled.</p><p>Registration is open. Verify your own email; Cowboy reviews access to read and post. Member profiles are private by default. If shared, your profile and chosen picture can be viewed by approved members while your membership is approved. You can make your profile private again, but existing copies or already-issued short-lived image links may persist briefly.</p></div>',{allowUnapproved:true});}
function showEdward(){showDialog('<p class="eyebrow">Your guide to the collection</p><h2 id="content-title">Edward, at your service.</h2><span class="moderator-badge">Automated moderator</span><p class="dialog-lead">Mention @Edward and a concrete task, or name a website from the toolbox. Edward matches your question against the recorded catalog and links relevant entries.</p><ul class="guideline-list"><li>His replies use the site’s public catalog and member conversation context. Private records stay private.</li><li>He identifies himself as automated and doesn’t pretend to have tested a service.</li><li>Reports, approvals, suspensions and final moderation decisions belong to Cowboy.</li></ul><p class="privacy-notice">On-site catalog suggestions run when mentioned. The separate scheduled monitor also checks member conversations every 6 hours and may add helpful, disclosed replies. It does not run continuously.</p>',{allowUnapproved:true});}
const profiles=createProfileStudio({state,isPreview,client:()=>client,api,showDialog,toast,renderAccount,onSaved:()=>loadFeed(),onMemberShown:id=>powers.decorateMemberCard(id)});
let coreMount=null,coreGeneration=0;
const canOpenCore=()=>!isPreview&&configured&&!!client&&!state.recovery&&!state.passwordSetup&&
  state.member?.role==='owner'&&state.member?.status==='approved'&&
  !!state.user?.email_confirmed_at&&state.user.id===state.member.user_id;
function clearCore(){coreGeneration++;coreMount?.destroy();coreMount=null;}
async function openCore(host){
  clearCore();
  if(!host?.isConnected||!canOpenCore())return;
  const generation=coreGeneration;
  host.textContent='Opening Cowboys Core…';
  try{
    const {mountCowboysCore}=await import('./cowboys-core.mjs?v=2');
    if(generation!==coreGeneration||!host.isConnected||!canOpenCore())return;
    coreMount=mountCowboysCore(host,{client:()=>client,authorized:canOpenCore});
  }catch{if(host.isConnected&&canOpenCore())host.textContent='Cowboys Core could not load. Try reopening this dashboard tab.';}
}
const ownerCenter=createOwnerCenter({state,isPreview,api,catalog:()=>catalog,confirm:confirmAction,toast,refreshAnnouncement,
  lab:()=>hub.ownerPanel(),canCore:canOpenCore,openCore,closeCore:clearCore});
const hub=createCommunityLab({state,isPreview,client:()=>client,catalog:()=>catalog,categories:CATEGORIES,api,openAuth,showDialog,closeDialogs,toast,loadFeed,openThread,sampleID,demoThreads:()=>demoThreads});
const powers=createPowerHouse({state,isPreview,client:()=>client,api,showDialog,toast,loadFeed,openThread,sampleID,demoThreads:()=>demoThreads,demoReplies:()=>demoReplies});
const forum=createForum({state,isPreview,client:()=>client,profiles,api,showDialog,toast,renderFeed,loadFeed,openThread});
function showProfile(){if(mustSignIn())return;return profiles.show();}
async function showOwner(){if(state.member?.role!=='owner')return;try{await ownerCenter.show();}catch(error){toast(errorMessage(error));}}
async function refreshAnnouncement(){
  const target=$('community-announcement');if(!target)return;
  if(isPreview){target.hidden=!state.demoAnnouncement?.announcement_enabled;target.textContent=state.demoAnnouncement?.announcement_text||'';return;}
  if(!client||!canReadBoard(state.member)){target.hidden=true;target.textContent='';return;}const reader=state.member.user_id,epoch=state.boardEpoch||0;const {data,error}=await client.from('community_settings').select('announcement_text').eq('id','community').maybeSingle();if(!canReadBoard(state.member)||state.member.user_id!==reader||(state.boardEpoch||0)!==epoch)return;target.hidden=!!error||!data?.announcement_text;target.textContent=data?.announcement_text||'';
}
async function openReviewLink(){const {member}=await api('review_link',{token:reviewToken});showDialog(`<p class="eyebrow">A request from your inbox</p><h2 id="content-title">A new voice at the table.</h2><p class="dialog-lead"><b>${esc(member.display_name)}</b> has verified their email and requested membership access. Opening this email link has not changed their account.</p><button class="button-primary" data-review-user="${esc(member.user_id)}" data-decision="approved" data-email-review>Approve membership ↗</button> <button class="button-quiet" data-review-user="${esc(member.user_id)}" data-decision="declined" data-email-review>Decline</button><p class="privacy-notice">Your confirmed decision consumes this single-use review link.</p>`);}
async function confirmAction(title,description,action,allowUnapproved=false){showDialog(`<p class="eyebrow">A deliberate decision</p><h2 id="content-title">${esc(title)}</h2><p class="dialog-lead">${esc(description)}</p><button class="button-primary" id="confirm-action">Confirm ↗</button> <button class="button-quiet" data-close>Cancel</button>`,{allowUnapproved});$('confirm-action').addEventListener('click',async e=>{const button=e.currentTarget;button.disabled=true;try{await action();$('content-dialog').close();toast(isPreview?'Preview action completed. No real records changed.':'Your decision was saved.');await loadFeed();if(state.member?.role==='owner')await showOwner();}catch(error){formMessage($('dialog-content'),errorMessage(error));button.disabled=false;}});}
function demoRole(role){state.member=role==='visitor'?null:{user_id:'99999999-9999-4999-8999-999999999999',display_name:role==='owner'?'Cowboy':'Example member',role:role==='owner'?'owner':'member',status:role==='pending'?'pending':'approved'};state.user=null;state.profile=role==='visitor'?null:{...PROFILE_DEFAULTS,user_id:state.member.user_id,display_name:state.member.display_name,headline:role==='owner'?'Collector of good finds. Keeper of good company.':'Making things. Finding things. Sharing the good ones.',bio:'A little curious about everything. Here to trade practical ideas and discover the small tools that make a big difference.',interests:['Making','Exploring','Good tools'],theme:role==='owner'?'forest':'copper',cover:'contours',avatar_mode:'icon',avatar_icon:role==='owner'?'compass':'hammer',published:true,account_active:role!=='pending',badge:role==='owner'?'Owner':null};$('owner-dashboard').hidden=true;powers.refreshOwn(true).then(()=>renderFeed());}
async function demoAction(action,payload){
  if(action.startsWith('power_'))return powers.previewAPI(action,payload);
  if(action.startsWith('hub_'))return hub.previewAPI(action,payload);
  if(action==='bootstrap')return {member:state.member,profile:state.profile};
  if(action==='admin_overview')return {counts:{members:demoMembers.length+1,approved:demoMembers.filter(m=>m.status==='approved').length+1,pending:demoMembers.filter(m=>m.status==='pending').length,suspended:demoMembers.filter(m=>m.status==='suspended').length,threads:demoThreads.filter(t=>t.status==='published').length,replies:[...demoReplies.values()].flat().length,held:demoThreads.filter(t=>t.status==='held').length,reports:0,clicks:312,scheduled_replies:0,failed_notices:0},sites:catalog.map((s,i)=>({site_id:s.id,clicks:i<8?[86,63,49,37,28,23,17,9][i]:0,last_clicked_at:null})),daily:Array.from({length:14},(_,i)=>({day:new Date(Date.UTC(2026,9,11+i)).toISOString().slice(0,10),clicks:[8,15,11,23,18,31,24,19,34,27,22,21,29,30][i]})),audit:[],announcement:state.demoAnnouncement||{announcement_text:'',announcement_enabled:false},senderConfigured:true};
  if(action==='admin_members'){let rows=[{...state.member,created_at:'2026-10-23T10:00:00Z'},...demoMembers.map(m=>({...m,role:'member'}))].filter(m=>(payload.status==='all'||m.status===payload.status)&&m.display_name.toLowerCase().includes(payload.search.toLowerCase()));return {members:rows.slice(payload.offset,payload.offset+25),total:rows.length,offset:payload.offset};}
  if(action==='admin_bulk'){let updated=0;for(const m of demoMembers)if(payload.userIds.includes(m.user_id)&&m.status!==payload.status&&(payload.status!=='declined'||m.status==='pending')){m.status=payload.status;updated++;}return {updated};}
  if(action==='announcement'){state.demoAnnouncement={announcement_text:payload.text,announcement_enabled:payload.enabled};return {announcement:state.demoAnnouncement};}
  if(action==='owner_test_mail')return {emailSent:true};
  if(action==='admin_queue')return {members:demoMembers,reports:[],threads:demoThreads.filter(t=>t.status==='held'),replies:[...demoReplies.values()].flat().filter(r=>r.status==='held'),deletions:[],accounts:[]};
  if(action==='review_member'){const m=demoMembers.find(m=>m.user_id===payload.userId);if(m)m.status=payload.decision;return {reviewed:true};}
  if(action==='create_thread'){const validated=validatePost(payload,catalog);const thread={...validated,...validateLabPost(payload,catalog,{isOwner:state.member.role==='owner'}),id:sampleID(),author_id:state.member.user_id,author_name:state.member.display_name,created_at:new Date().toISOString(),status:reviewContent(validated.title+'\n'+validated.body).status,reply_count:0};demoThreads.unshift(thread);await hub.previewAPI('hub_mutate',{kind:'following',data:{threadId:thread.id,enabled:true}});const answer=thread.status==='published'?edwardReply(thread,catalog):null;if(answer){demoReplies.set(thread.id,[{id:sampleID(),author_name:'Edward',author_kind:'edward',body:answer,created_at:thread.created_at}]);thread.reply_count=1;}return {thread};}
  if(action==='reply'){const reply={id:sampleID(),thread_id:payload.threadId,reply_to_id:payload.replyToId||null,body:String(payload.body),author_id:state.member.user_id,author_name:state.member.display_name,author_kind:'member',created_at:new Date().toISOString(),status:'published'};const rows=demoReplies.get(payload.threadId)||[];rows.push(reply);const answer=edwardReply({body:reply.body,site_id:state.thread?.site_id},catalog);if(answer)rows.push({id:sampleID(),author_name:'Edward',author_kind:'edward',body:answer,created_at:reply.created_at});demoReplies.set(payload.threadId,rows);const thread=demoThreads.find(t=>t.id===payload.threadId);if(thread){thread.reply_count=rows.length;thread.visible_reply_count=rows.length;thread.last_reply_at=reply.created_at;thread.activity_at=reply.created_at;thread.human_reply_count=rows.filter(r=>r.author_kind==='member').length;}return {reply};}
  if(action==='edit_reply'){const reply=[...demoReplies.values()].flat().find(r=>r.id===payload.replyId);if(!reply)throw new Error('Reply unavailable.');reply.body=String(payload.body);reply.edited_at=new Date().toISOString();return {reply};}
  if(action==='report'||action==='deletion_request')return {recorded:true,requested:true,emailSent:false};
  if(action==='profile'){state.member.display_name=state.member.role==='owner'?'Cowboy':displayName(payload.displayName);state.profile={...state.profile,...payload.profile,display_name:state.member.display_name};return {profile:state.profile,display_name:state.member.display_name};}
  if(action==='moderate'){const thread=demoThreads.find(t=>t.id===payload.id);if(payload.kind==='thread'&&thread)thread.status=payload.status;if(payload.kind==='reply'){const reply=[...demoReplies.values()].flat().find(r=>r.id===payload.id);if(reply)reply.status=payload.status;}if(payload.kind==='lock'&&thread)thread.locked=payload.locked;if(payload.kind==='pin'&&thread)thread.pinned=payload.pinned;if(payload.kind==='member'){const m=demoMembers.find(m=>m.user_id===payload.id);if(m)m.status=payload.status;}return {updated:true};}
  return {};
}
document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
document.addEventListener('click',async event=>{
  // Tapping any non-control part of a card opens its post.
  const card=event.target instanceof Element?event.target.closest('#community-feed .thread-card[data-thread-card]'):null;
  const control=event.target instanceof Element?event.target.closest('button,a,input,select,textarea,summary,[role="button"],[role="link"],[contenteditable]'):null;
  if(card&&!control){
    try{if(!window.getSelection()?.toString().trim())await openThread(card.dataset.threadCard);}
    catch(error){toast(errorMessage(error));}
    return;
  }
  const target=event.target.closest('button,a');if(!target)return;
  try{
    if(target.matches('[data-auth]')){event.preventDefault();openAuth(target.dataset.auth);}
    else if(target.matches('[data-close]'))target.closest('dialog')?.close();
    else if(target.matches('[data-show-password]')){const input=target.parentElement.querySelector('input');input.type=input.type==='password'?'text':'password';target.textContent=input.type==='password'?'Show':'Hide';target.setAttribute('aria-label',input.type==='password'?'Show password':'Hide password');}
    else if(target.matches('[data-category]')){state.category=target.dataset.category;renderCategories();await loadFeed();}
    else if(target.matches('[data-thread]')&&!target.matches('form'))await openThread(target.dataset.thread);
    else if(target.matches('[data-start]')||['new-thread','hero-new'].includes(target.id))openComposer();
    else if(target.matches('[data-clear-site]')){state.site=null;await loadFeed();}
    else if(target.matches('[data-refresh]')||target.id==='refresh-community')await loadFeed();
    else if(target.id==='load-more')await loadFeed(true);
    else if(target.matches('[data-rules]')||target.id==='open-guidelines'){showGuidelines();}
    else if(target.id==='open-privacy'||target.matches('[data-privacy]'))showPrivacy();
    else if(target.id==='meet-edward')showEdward();
    else if(target.matches('[data-catalog]')){event.preventDefault();const site=catalog.find(s=>s.id===target.dataset.catalog);if(site)location.href='./?find='+encodeURIComponent(site.name)+'#explore';}
    else if(target.matches('[data-signout],[data-signout-all]')){ownerCenter.hide();if(!isPreview&&client)await client.auth.signOut({scope:target.matches('[data-signout-all]')?'global':'local'});state.member=null;state.user=null;state.profile=null;profiles.applyReader({});closeDialogs();$('owner-dashboard').hidden=true;if(isPreview)$('preview-role').value='visitor';renderFeed();toast('You’re logged out.');}
    else if(target.matches('[data-profile]'))showProfile();
    else if(target.matches('[data-owner]'))await showOwner();
    else if(target.matches('[data-check-membership]')){if(isPreview)toast('Preview state: approval is still pending.');else{await bootstrap();await loadFeed();toast(state.member?.status==='approved'?'You’re approved. Welcome in.':'Your request is still awaiting review.');}}
    else if(target.matches('[data-resend-approval]')){const result=await api('resend_approval');toast(isPreview?'Preview only. No email was sent.':result.approvalEmailStatus==='sent'?'A reminder was sent to Cowboy.':'Your request is in the owner queue. The email notice could not be sent yet.');}
    else if(target.matches('[data-member-status]'))await confirmAction(target.dataset.memberStatus==='suspended'?'Suspend board access?':'Restore board access?','This changes reading and posting access. Published conversations remain visible to other approved members.',()=>api('moderate',{kind:'member',id:target.dataset.userId,status:target.dataset.memberStatus,confirm:true}));
    else if(target.matches('[data-report-thread]'))openReport(target.dataset.reportThread);
    else if(target.matches('[data-report-reply]'))openReport(state.thread.id,target.dataset.reportReply);
    else if(target.matches('[data-share-thread]')){const url=new URL(publicURL(target.dataset.shareThread),location.href).href;try{await navigator.clipboard.writeText(url);toast('Conversation link copied. Approved members can open it.');}catch{showDialog(`<h2 id="content-title">A link worth sharing.</h2><p class="privacy-notice">${esc(url)}</p>`);}}
    else if(target.matches('[data-review-user]')){const userId=target.dataset.reviewUser,decision=target.dataset.decision,token=target.hasAttribute('data-email-review')?reviewToken:null;await confirmAction(decision==='approved'?'Welcome this member?':'Decline posting access?',decision==='approved'?'This verified member will be able to read and post conversations and replies.':'This member will be unable to read or post. The decision will be recorded.',async()=>{await api('review_member',{userId,decision,token,confirm:true});if(token)reviewToken=null;});}
    else if(target.matches('[data-resolve-report]'))await confirmAction('Mark this report reviewed?','The report stays in the private moderation record.',()=>api('moderate',{kind:'report',id:target.dataset.resolveReport,confirm:true}));
    else if(target.matches('[data-moderate-id]'))await confirmAction('Save this moderation decision?','The content will be published or hidden according to your decision.',()=>api('moderate',{kind:target.dataset.kind,id:target.dataset.moderateId,status:target.dataset.status,confirm:true}));
    else if(target.matches('[data-pin-thread]'))await confirmAction(state.thread.pinned?'Unpin this conversation?':'Pin this conversation?', 'Pinned conversations appear first in the member feed.',()=>api('moderate',{kind:'pin',id:target.dataset.pinThread,pinned:!state.thread.pinned,confirm:true}));
    else if(target.matches('[data-lock-thread]'))await confirmAction(state.thread.locked?'Reopen this conversation?':'Close new replies?','Existing published messages remain visible.',()=>api('moderate',{kind:'lock',id:target.dataset.lockThread,locked:!state.thread.locked,confirm:true}));
    else if(target.matches('[data-hide-thread]'))await confirmAction('Hide this conversation?','It will be removed from the member feed and remain in the database for owner review.',()=>api('moderate',{kind:'thread',id:target.dataset.hideThread,status:'hidden',confirm:true}));
    else if(target.matches('[data-deletion-request]'))await confirmAction('Request account deletion?','Cowboy will receive a private request. Your account will remain until the request has been completed and verified.',()=>api('deletion_request'),true);
  }catch(error){toast(errorMessage(error));}
});
document.addEventListener('keydown',event=>{const tab=event.target.closest('.auth-tabs [role=tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const view=event.key==='Home'?'login':event.key==='End'?'signup':authView==='login'?'signup':'login';openAuth(view);document.querySelector('.auth-tabs [aria-selected="true"]')?.focus();});
document.addEventListener('submit',async event=>{const form=event.target;if(!['auth-form','thread-form','reply-form','report-form','profile-form'].includes(form.id))return;event.preventDefault();if(form.id==='auth-form')return submitAuth(form);if(form.id==='thread-form')return submitThread(form);if(form.id==='reply-form')return submitReply(form);const button=form.querySelector('[type=submit]');button.disabled=true;try{if(form.id==='report-form'){const result=await api('report',{threadId:form.dataset.thread,replyId:form.dataset.reply||null,...Object.fromEntries(new FormData(form))});form.reset();form.innerHTML='<p class="form-message success" role="status">'+(isPreview?'Preview complete. No report or email was sent.':result.emailSent?'Your report is saved. An owner email notice was sent.':'Your report is saved in Cowboy’s review queue. The email notice could not be sent yet.')+'</p>';}else{await api('profile',{displayName:new FormData(form).get('displayName')});if(!isPreview)await bootstrap();renderAccount();formMessage(form,'Display name saved.',true);}}catch(error){formMessage(form,errorMessage(error));}finally{if(button.isConnected)button.disabled=false;}});
let searchTimer;
$('community-search').addEventListener('input',event=>{state.search=event.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadFeed(),250)});$('community-sort').addEventListener('change',event=>{state.sort=event.target.value;loadFeed()});$('preview-role').addEventListener('change',async event=>{demoRole(event.target.value);await loadFeed();});
async function initialize(){
  try{const response=await fetch('catalog.json',{credentials:'omit'});if(!response.ok)throw new Error();const data=await response.json();catalog=Array.isArray(data.sites)?data.sites.map(s=>({...s,source_urls:s.sources.map(n=>data.videos.find(v=>v.number===n)?.url).filter(Boolean)})):[];}catch{catalog=[];}
  if(isPreview){for(const thread of demoThreads){const answer=thread.status==='published'?edwardReply(thread,catalog):null;if(answer){demoReplies.set(thread.id,[{id:sampleID(),author_name:'Edward',author_kind:'edward',body:answer,created_at:thread.created_at}]);thread.reply_count=1;}}$('preview-banner').hidden=false;const role=['visitor','pending','member','owner'].includes(query.get('role'))?query.get('role'):'visitor';$('preview-role').value=role;demoRole(role);await loadFeed();}
  else if(configured){
    try{
      const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
      let local=null,session=null;try{local=window.localStorage}catch{}try{session=window.sessionStorage}catch{}
      const sessionStore=createAuthStorage({local,session,remember:()=>{try{return local.getItem('cowboy-community-remember')==='yes'}catch{return false}}});
      authStorage=sessionStore;authStorageKey=`sb-${new URL(config.supabaseUrl).hostname.split('.')[0]}-auth-token`;
      recoveryStep=createRecoveryStep(session,`cowboy-recovery-step:${new URL(config.supabaseUrl).hostname}`);
      client=createClient(config.supabaseUrl,config.publishableKey,{auth:{storageKey:authStorageKey,flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:sessionStore}});
      client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||event==='PASSWORD_RECOVERY'||(session?.user?.id&&state.user?.id&&session.user.id!==state.user.id))ownerCenter.hide();if(event==='SIGNED_OUT'){state.bootstrapGeneration=(state.bootstrapGeneration||0)+1;state.recovery=false;recoveryStep.clear();state.member=null;state.user=null;state.profile=null;renderFeed();}if(event==='PASSWORD_RECOVERY'&&session?.user?.id){state.recovery=true;recoveryStep.mark(session.user.id);setTimeout(()=>{if(authView!=='reset'||!$('auth-dialog').open)openAuth('reset')},0);}else setTimeout(()=>bootstrap().then(()=>loadFeed()).catch(error=>toast(errorMessage(error))),0);});
      const {error:initError}=await client.auth.initialize();
      if(initError||new URLSearchParams(location.search).has('code')){authProblem=authErrorMessage(initError,'callback');clearAuthCallback();}
      await bootstrap();await loadFeed();
    }catch{toast('The community could not connect. Please try again shortly.');renderFeed();}
  }else await loadFeed();
  await refreshAnnouncement();
  await hub.initialize();
  if(authProblem){openAuth('forgot',authProblem);return;}
  if(state.recovery){if(authView!=='reset'||!$('auth-dialog').open)openAuth('reset');return;}
  if(state.passwordSetup&&state.user){openAuth('setup');return;}
  if(fragment.has('error')||query.has('error')){clearAuthCallback();openAuth('forgot',authErrorMessage(null,'callback'));return;}
  if(!canReadBoard(state.member)){renderFeed();if(query.get('privacy')==='1')showPrivacy();if(['login','signup'].includes(query.get('auth')))openAuth(query.get('auth'));if(reviewToken&&!state.member)openAuth('login','Sign in with the owner account to review this request.');return;}
  if(query.get('member'))await profiles.showMember(query.get('member'));
  if(isPreview&&query.get('panel')==='profile'&&state.member)await showProfile();
  if(isPreview&&query.get('panel')==='owner'&&state.member?.role==='owner')await showOwner();
  if(query.get('panel')==='powers'&&state.member)await powers.show();
  if(query.get('privacy')==='1')showPrivacy();
  if(query.get('auth')==='login'||query.get('auth')==='signup')openAuth(query.get('auth'));

  if(query.get('thread')&&(isPreview||configured))await openThread(query.get('thread'),{replyId:query.get('reply')});
  if(reviewToken&&!state.member)openAuth('login','Sign in with the verified owner email to review this request.');
}
document.addEventListener('visibilitychange',()=>{if(!isPreview&&client&&document.visibilityState==='visible')bootstrap().then(()=>loadFeed()).catch(()=>{state.member=null;state.profile=null;renderFeed();});});
await initialize();
