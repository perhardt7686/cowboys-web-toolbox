import {escapeHTML as esc,canPost,safeHttps} from './community-core.mjs';
import {POST_KINDS,KIND_LABELS,OUTCOMES,SITE_CATEGORIES,validateLabPost,formatPostBody,additionToSite} from './lab-core.mjs';

const $=id=>document.getElementById(id);
const input=(label,name,{value='',max=500,required=false,type='text',placeholder=''}={})=>`<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" maxlength="${max}" ${required?'required':''} placeholder="${esc(placeholder)}"></label>`;
const area=(label,name,{max=800,required=false,placeholder=''}={})=>`<label class="field"><span>${label}</span><textarea name="${name}" maxlength="${max}" ${required?'required':''} placeholder="${esc(placeholder)}"></textarea></label>`;
const time=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'America/New_York'}).format(d):'—';};
export function createCommunityLab(ctx){
  let view='all',personal={choices:[],notifications:[],digestEnabled:false},personalAt=0,personalUser=null;
  let draftKind='discussion',ownerData=null,demoReports=[],demoEditorial=[];
  const choices=()=>new Map(personal.choices.map(c=>[c.thread_id,c]));
  const signedIn=()=>{if(!ctx.state.member){ctx.openAuth('login');return false;}if(!canPost(ctx.state.member)){ctx.toast('Your email and posting access must be approved first.');return false;}return true;};
  const banner=()=>ctx.isPreview?'<p class="preview-message">DESIGN PREVIEW · Sample actions stay in this page. No posts, emails or account changes are made.</p>':'';
  const mutate=async(kind,data)=>{const r=await ctx.api('hub_mutate',{kind,data});personalAt=0;return r;};
  async function refreshPersonal(force=false){
    if(!ctx.state.member){personal={choices:[],notifications:[],digestEnabled:false};personalUser=null;return;}
    if(!force&&personalUser===ctx.state.member.user_id&&Date.now()-personalAt<15000)return;
    personal=await ctx.api('hub_state');personalUser=ctx.state.member.user_id;personalAt=Date.now();
  }
  function mount(){
    if(!$('lab-intro')){
      const section=document.createElement('section');section.id='lab-intro';section.className='lab-intro container';
      section.innerHTML=`<div class="lab-intro-copy"><p class="eyebrow">GOOD QUESTIONS. USEFUL ANSWERS.</p><h2>Bring a task.<br><em>Leave with a way forward.</em></h2><p>Ask for a tool, pass along a discovery, or show us what you made.</p></div><div class="lab-quick-actions">${[['request','?','Find me a tool','A goal. A device. A little help.'],['discovery','↗','Share a discovery','Good finds deserve good company.'],['review','✓','I tried this','Tell the next person what worked.'],['project','✳','Show your work','Made it? Fixed it? Pass it on.']].map(([kind,icon,title,desc])=>`<button data-lab-compose="${kind}"><span class="lab-action-icon" aria-hidden="true">${icon}</span><span><b>${title}</b><small>${desc}</small></span><span aria-hidden="true">↗</span></button>`).join('')}</div>`;
      document.querySelector('.community-layout').before(section);
    }
    if(!$('lab-filters')){const nav=document.createElement('nav');nav.id='lab-filters';nav.className='lab-filters';nav.setAttribute('aria-label','Conversation views');document.querySelector('.community-tools').after(nav);}
    renderFilters();
  }
  function renderFilters(){const nav=$('lab-filters');if(!nav)return;nav.innerHTML=[['all','All'],['unanswered','Needs a hand'],['solved','Solved'],['discovery','Discoveries'],['review','Community tested'],['project','Made with tools'],['challenge','Challenges'],['poll','Polls'],['saved','Saved'],['following','Following']].map(([id,label])=>`<button data-lab-view="${id}" aria-pressed="${view===id}">${label}</button>`).join('');}
  function applyQuery(request){
    if(view==='unanswered')return request.eq('post_kind','request').eq('human_reply_count',0).is('accepted_reply_id',null);
    if(view==='solved')return request.not('accepted_reply_id','is',null);
    if(['discovery','review','project','challenge','poll'].includes(view))return request.eq('post_kind',view);
    if(['saved','following'].includes(view)){const ids=personal.choices.filter(c=>c[view]).map(c=>c.thread_id);return request.in('id',ids.length?ids:['00000000-0000-4000-8000-000000000000']);}
    return request;
  }
  function filterRow(t){
    if(view==='all')return true;if(view==='unanswered')return t.post_kind==='request'&&!t.accepted_reply_id&&!t.human_reply_count;
    if(view==='solved')return !!t.accepted_reply_id;
    if(['saved','following'].includes(view))return !!choices().get(t.id)?.[view];return t.post_kind===view;
  }
  function decorateAccount(){const dropdown=document.querySelector('.account-dropdown');if(!dropdown)return;const n=personal.notifications.filter(n=>n.unread).length;const button=document.createElement('button');button.dataset.labPersonal='';button.textContent='My board'+(n?' · '+n+' updates':'');dropdown.prepend(button);}
  function decorateFeed(rows){
    mount();renderFilters();
    document.querySelectorAll('.thread-card').forEach((card,i)=>{const t=rows[i];if(!t)return;const tag=document.createElement('div');tag.className='lab-thread-tags';
      tag.innerHTML=`<span class="lab-kind">${esc(KIND_LABELS[t.post_kind]||'Conversation')}</span>${t.accepted_reply_id?'<span class="lab-solved">✓ Solved</span>':''}${t.featured?'<span class="lab-featured">✳ Featured by Cowboy</span>':''}${t.post_kind==='review'?`<span>${esc(OUTCOMES[t.post_data?.outcome]||'Member experience')}</span>`:''}${t.post_kind==='discovery'?`<span>${esc({'submitted':'Submitted','reviewing':'Under review','added':'Added to toolbox','needs-check':'Needs more checking'}[t.discovery_status]||'Submitted')}</span>`:''}`;
      card.prepend(tag);const footer=card.querySelector('.thread-bottom');if(footer){const count=document.createElement('span');count.className='lab-helpful-count';count.textContent=(t.helpful_count||0)+' helpful';footer.append(count);}
    });
    const challenge=ctx.state.threads.find(t=>t.post_kind==='challenge'&&(!t.challenge_ends_at||Date.parse(t.challenge_ends_at)>Date.now()));
    let spotlight=$('lab-challenge');if(!spotlight){spotlight=document.createElement('div');spotlight.id='lab-challenge';document.querySelector('.community-heading').before(spotlight);}
    spotlight.hidden=!challenge;if(challenge)spotlight.innerHTML=`<div><p class="eyebrow">COWBOY’S WEEKLY CHALLENGE</p><h3>${esc(challenge.title)}</h3><p>${challenge.challenge_ends_at?'Open until '+time(challenge.challenge_ends_at)+' · New York time':'Try a small project and share what you learn.'}</p></div><button class="button-lime" data-thread="${esc(challenge.id)}">Give it a go ↗</button>`;
  }
  function composerFields(kind){
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(kind==='request')return area('What are you trying to do?','goal',{required:true,placeholder:'Describe a concrete task…'})+input('Device and browser','device',{required:true,max:120,placeholder:'Android / Chrome, Windows / Firefox…'})+area('What have you tried?','tried')+input('Budget or signup preference','budget',{max:120,placeholder:'Free, no account, offline…'})+area('What would a successful result look like?','success',{max:500});
    if(kind==='discovery')return input('Official website','url',{required:true,type:'url',max:500,placeholder:'https://'})+input('Website name','name',{required:true,max:80})+area('The task it solves','useCase',{required:true,max:240})+area('What did you actually try?','tried',{required:true})+area('Account, payment or export requirements','access',{max:300})+'<label class="check-label"><input type="checkbox" name="credit"><span>Credit my display name if Cowboy adds this discovery to the collection.</span></label><p class="privacy-notice">Cowboy reviews every discovery. Existing websites belong in a tip or experience post.</p>';
    if(kind==='review')return area('What task did you try?','task',{required:true})+input('Device and browser','device',{required:true,max:120})+`<label class="field"><span>Your experience</span><select name="outcome">${Object.entries(OUTCOMES).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label>`+input('Date you checked','checked',{value:date,type:'date',max:10,required:true})+area('Limits, payment or signup hurdles you encountered','limits',{max:500});
    if(kind==='project')return area('What was your goal?','goal',{required:true})+`<label class="field"><span>Tools you used · choose one to three</span><select name="tools" multiple size="5" required>${ctx.catalog().map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select><small>On a computer, hold Ctrl or Command to select more than one.</small></label>`+area('Steps that mattered','steps',{required:true,max:1800})+area('What was the result?','result',{required:true,max:1000})+area('One tip for the next person','tip',{max:500})+input('Link to your work · optional','link',{type:'url',max:500,placeholder:'https://'})+'<p class="privacy-notice">Share your own work or credit the source. This format supports text and HTTPS links.</p>';
    if(kind==='poll')return area('A little context','body',{required:true,max:1500})+area('Options · one per line, two to six','options',{required:true,max:600});
    return area('The conversation','body',{required:true,max:6000,placeholder:'Share a useful question or something worth passing along…'});
  }
  function openComposer(kind='discussion'){
    if(!signedIn())return;draftKind=KIND_LABELS[kind]?kind:'discussion';if(draftKind==='challenge'&&ctx.state.member.role!=='owner')draftKind='project';
    const chosen=ctx.state.site||'';ctx.showDialog(`<p class="eyebrow">A LITTLE KNOW-HOW GOES A LONG WAY</p><h2 id="content-title">${esc(KIND_LABELS[draftKind])}.</h2>${banner()}<form id="lab-composer"><label class="field"><span>Post format</span><select name="postKind" id="lab-post-kind">${POST_KINDS.filter(([id])=>id!=='challenge'||ctx.state.member.role==='owner').map(([id,label])=>`<option value="${id}" ${draftKind===id?'selected':''}>${label}</option>`).join('')}</select></label>${input('A clear title','title',{max:140,required:true,placeholder:'One task, one good question…'})}<div class="lab-two-fields"><label class="field"><span>Your corner</span><select name="category">${ctx.categories.map(c=>`<option value="${c.id}" ${(draftKind==='request'?c.id==='help':draftKind==='discovery'?c.id==='discoveries':draftKind==='project'?c.id==='creative':ctx.state.category===c.id)?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label class="field"><span id="lab-site-label">A toolbox website ${draftKind==='review'?'':'· optional'}</span><select name="siteId" ${draftKind==='review'?'required':''}><option value="">A general conversation</option>${ctx.catalog().map(s=>`<option value="${esc(s.id)}" ${chosen===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label></div><div id="lab-compose-fields">${composerFields(draftKind)}</div><p class="privacy-notice">Public posts show your display name. Keep passwords and private information out. New conversations are followed automatically while you have room in your 200 saved/followed limit. Change this in the conversation.</p><button class="button-primary" type="submit">${ctx.isPreview?'Try a sample post':'Post to the board'} ↗</button><p class="form-message" id="lab-composer-message" role="status" hidden></p></form>`);
  }
  async function submitComposer(form){
    const button=form.querySelector('[type=submit]');button.disabled=true;const message=$('lab-composer-message');message.hidden=true;
    try{
      const values=Object.fromEntries(new FormData(form)),kind=values.postKind,data={...values};data.credit=form.elements.credit?.checked===true;data.tools=[...new FormData(form).getAll('tools')];data.options=String(values.options||'').split('\n').map(s=>s.trim()).filter(Boolean);
      const extra=validateLabPost({postKind:kind,postData:data,siteId:values.siteId},ctx.catalog(),{isOwner:ctx.state.member.role==='owner'});
      const body=formatPostBody(kind,extra.post_data,values.body||'');
      const result=await ctx.api('create_thread',{title:values.title,category:values.category,siteId:values.siteId,body,postKind:kind,postData:extra.post_data});
      personalAt=0;await ctx.loadFeed();if(result.thread.status==='held'){ctx.closeDialogs();ctx.toast('Saved privately for Cowboy’s review.');}else{await ctx.openThread(result.thread.id);ctx.toast(ctx.isPreview?'Sample post added to this preview.':'Your post is published.');}
    }catch(error){message.hidden=false;message.textContent=error.message;}finally{if(button.isConnected)button.disabled=false;}
  }
  async function decorateThread(thread,replies){
    await refreshPersonal();const root=$('dialog-content');if(!root||ctx.state.thread?.id!==thread.id)return;
    root.querySelector('.lab-thread-controls')?.remove();root.querySelector('.lab-poll')?.remove();
    const choice=choices().get(thread.id)||{};const controls=document.createElement('section');controls.className='lab-thread-controls';
    controls.innerHTML=`<div class="lab-thread-tags"><span class="lab-kind">${esc(KIND_LABELS[thread.post_kind]||'Conversation')}</span>${thread.accepted_reply_id?'<span class="lab-solved">✓ Solved</span>':''}${thread.featured?'<span class="lab-featured">✳ Featured by Cowboy</span>':''}${thread.post_kind==='discovery'?`<span>${esc(thread.discovery_status||'submitted')}</span>`:''}</div><div class="lab-choice-buttons">${[['helpful','↑ Helpful · '+(thread.helpful_count||0)],['following',choice.following?'Following ✓':'Follow replies'],['saved',choice.saved?'Saved ★':'Save for later']].map(([kind,label])=>`<button class="button-quiet" data-lab-choice="${kind}" data-thread-id="${esc(thread.id)}" aria-pressed="${!!choice[kind]}" ${kind==='helpful'&&thread.author_id===ctx.state.member?.user_id?'disabled':''}>${label}</button>`).join('')}</div>${thread.challenge_ends_at?`<p class="privacy-notice">Challenge closes ${time(thread.challenge_ends_at)} · New York time${Date.parse(thread.challenge_ends_at)<Date.now()?' · Finished':''}</p>`:''}${thread.post_kind==='project'?`<p class="lab-tools-used">Tools used: ${(thread.post_data?.tools||[]).map(id=>{const s=ctx.catalog().find(s=>s.id===id);return s?`<a href="./?find=${encodeURIComponent(s.name)}#explore">${esc(s.name)}</a>`:''}).join(' · ')}</p>`:''}`;
    const body=root.querySelector('.thread-detail-body');if(body)body.after(controls);else root.prepend(controls);
    root.querySelectorAll('[data-hub-reply]').forEach(node=>{const reply=replies.find(r=>r.id===node.dataset.hubReply);if(!reply)return;node.classList.toggle('lab-accepted',thread.accepted_reply_id===reply.id);node.querySelector('.lab-answer-action')?.remove();
      if(thread.post_kind==='request'&&reply.author_kind!=='edward'&&(ctx.state.member?.role==='owner'||thread.author_id===ctx.state.member?.user_id)){
        const b=document.createElement('button');b.className='text-button lab-answer-action';b.dataset.labAccept=reply.id;b.textContent=thread.accepted_reply_id===reply.id?'✓ Accepted answer · undo':'Mark as the answer';node.append(b);
      }else if(thread.accepted_reply_id===reply.id){const label=document.createElement('p');label.className='lab-answer-action';label.textContent='✓ Accepted answer';node.prepend(label);}
    });
    if(thread.post_kind==='poll'){
      const poll=document.createElement('section');poll.className='lab-poll';const options=thread.post_data?.options||[],total=(thread.poll_counts||[]).reduce((n,x)=>n+Number(x),0);
      poll.innerHTML=`<h3>The community’s vote.</h3>${options.map((option,i)=>{const count=Number(thread.poll_counts?.[i]||0),pct=total?Math.round(count/total*100):0;return `<button data-lab-vote="${i}" aria-pressed="${choice.poll_choice===i}" ${thread.locked?'disabled':''}><span>${esc(option)}${choice.poll_choice===i?' ✓':''}</span><b>${count} · ${pct}%</b><i style="width:${pct}%"></i></button>`;}).join('')}<p>${total} vote${total===1?'':'s'} · one choice per approved member</p>`;controls.after(poll);
    }
  }
  async function personalPanel(){
    if(!signedIn())return;await refreshPersonal(true);
    ctx.showDialog(`<p class="eyebrow">YOUR CONVERSATIONS, YOUR PACE</p><h2 id="content-title">Your board.</h2>${banner()}<div class="lab-personal-links"><button class="button-quiet" data-lab-view="saved">Saved conversations ★</button><button class="button-quiet" data-lab-view="following">Following ✓</button></div><h3>Reply updates</h3><div class="lab-inbox">${personal.notifications.length?personal.notifications.map(n=>`<button data-lab-notification="${esc(n.thread_id)}"><span>${n.unread?'● ':''}${esc(n.title)}</span><small>${time(n.updated_at)} ↗</small></button>`).join(''):'<p>Follow a conversation to see reply updates here.</p>'}</div><button class="text-button" data-lab-read-all>Mark updates read</button><form id="lab-digest-form" class="lab-digest"><h3>A weekly note, if you’d like one.</h3><label class="check-label"><input type="checkbox" name="digest" ${personal.digestEnabled?'checked':''}><span>Email me a weekly roundup of public conversations and the new challenge.</span></label><p class="privacy-notice">Off unless you choose it. Sent to your verified account email. Unsubscribe here or through the link in each digest. Weekly sending is limited to 20 approved subscribers, with older recipients prioritized.</p><button class="button-primary button-small" type="submit">Save email preference</button></form>`);
  }
  function siteReport(){if(!signedIn())return;const chosen=ctx.state.site||'';ctx.showDialog(`<p class="eyebrow">HELP KEEP THE FINDS USEFUL</p><h2 id="content-title">Report a listing change.</h2>${banner()}<p class="dialog-lead">This report goes privately to Cowboy for review.</p><form id="lab-site-report"><label class="field"><span>Website</span><select name="siteId" required>${ctx.catalog().map(s=>`<option value="${esc(s.id)}" ${chosen===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label><label class="field"><span>What changed?</span><select name="reason"><option value="broken">Link or service unavailable</option><option value="price">Price or export limit</option><option value="signup">Signup requirement</option><option value="misleading">Listing needs correcting</option><option value="other">Something else</option></select></label>${area('What did you encounter? Include the date checked.','details',{required:true,max:2000})}<button class="button-primary" type="submit">Send a private report ↗</button><p id="lab-report-message" class="form-message" role="status" hidden></p></form>`);}
  async function ownerPanel(){
    const root=$('hub-owner-panel');if(!root||ctx.state.member?.role!=='owner')return;root.textContent='Loading the community desk…';
    try{ownerData=await ctx.api('hub_owner',{kind:'overview'});const d=ownerData;
      root.innerHTML=`<div class="lab-owner-intro"><p class="eyebrow">THE COMMUNITY DESK</p><h3>Turn good contributions into good finds.</h3><p>${d.digestSubscribers||0} members opted into the weekly digest. Reports and discovery decisions stay private until you publish a result.</p></div><section class="owner-surface"><h3>Discovery review</h3>${d.discoveries.length?d.discoveries.map(t=>`<article class="lab-owner-item"><div><b>${esc(t.title)}</b><p>${esc(t.post_data?.useCase||'')}</p><small>${esc(t.author_name)} · ${esc(t.discovery_status)}</small></div><div><button class="button-quiet" data-thread="${esc(t.id)}">Read ↗</button><button class="button-primary button-small" data-lab-review="${esc(t.id)}">Review discovery</button></div></article>`).join(''):'<p class="owner-empty">New discoveries will arrive here.</p>'}</section><section class="owner-surface"><h3>Private listing reports</h3>${d.reports.length?d.reports.map(r=>`<article class="lab-owner-item"><div><b>${esc(ctx.catalog().find(s=>s.id===r.site_id)?.name||r.site_id)} · ${esc(r.reason)}</b><p>${esc(r.details)}</p><small>${time(r.created_at)}</small></div><button class="button-quiet" data-lab-resolve="${esc(r.id)}">Mark reviewed</button></article>`).join(''):'<p class="owner-empty">All clear here.</p>'}</section><section class="owner-surface"><h3>Made with the toolbox</h3>${d.projects.length?d.projects.map(p=>`<article class="lab-owner-item"><div><b>${esc(p.title)}</b><small>${esc(p.author_name)}</small></div><button class="button-quiet" data-lab-feature="${esc(p.id)}" data-enabled="${!p.featured}">${p.featured?'Remove feature':'Feature project ✳'}</button></article>`).join(''):'<p class="owner-empty">Member projects will appear here.</p>'}</section><section class="owner-surface"><h3>Your editorial shelf</h3><p>Publish a thoughtful owner prompt when it is useful. Weekly challenges run separately.</p>${d.editorial.map(p=>`<article class="lab-owner-item"><b>${esc(p.title)}</b>${p.published_thread_id?`<button class="text-button" data-thread="${esc(p.published_thread_id)}">Published ↗</button>`:`<button class="button-quiet" data-lab-prompt="${esc(p.slug)}">Publish owner prompt</button>`}</article>`).join('')}</section><section class="owner-surface"><h3>Weekly digest status</h3><p>Counts record mail-sender acceptance, not inbox delivery. Only explicitly opted-in, approved accounts are eligible.</p>${d.digests.length?d.digests.map(j=>`<p>${esc(j.week_start)} · ${esc(j.status)} · ${j.count}</p>`).join(''):'<p>No digest jobs have run yet.</p>'}</section>`;
    }catch(error){root.textContent=error.message;}
  }
  function discoveryReview(id){const t=ownerData?.discoveries.find(t=>t.id===id);if(!t)return;ctx.showDialog(`<p class="eyebrow">OWNER REVIEW</p><h2 id="content-title">A place in the toolbox?</h2><p><a href="${esc(safeHttps(t.post_data?.url)||'#')}" target="_blank" rel="noopener noreferrer">${esc(t.post_data?.url||'')} ↗</a></p><form id="lab-discovery-review" data-id="${esc(id)}"><label class="field"><span>Decision</span><select name="status"><option value="reviewing">Under review</option><option value="needs-check">Needs more checking</option><option value="added">Add to the public toolbox</option></select></label>${input('Website name','name',{value:t.post_data?.name,max:80,required:true})}${input('Toolbox description','description',{value:t.post_data?.useCase,max:240,required:true})}<label class="field"><span>Toolbox category</span><select name="category">${SITE_CATEGORIES.map(c=>`<option>${esc(c)}</option>`).join('')}</select></label><label class="check-label"><input type="checkbox" required><span>I reviewed the official website and confirm this decision.</span></label><p class="privacy-notice">Adding publishes a community entry with its source thread and a working click counter. Matching existing domains link to the current entry. Other decisions remove this discovery’s dynamic listing from the public collection.</p><button class="button-primary" type="submit">Save owner decision</button><p class="form-message" id="lab-review-message" role="status" hidden></p></form>`);}
  async function confirmOwner(kind,data,title){ctx.showDialog(`<p class="eyebrow">OWNER DECISION</p><h2 id="content-title">${esc(title)}</h2><p>This change will be saved and recorded in your owner audit log.</p><button class="button-primary" id="lab-owner-confirm">Confirm change</button> <button class="button-quiet" data-close>Cancel</button>`);$('lab-owner-confirm').addEventListener('click',async e=>{e.target.disabled=true;try{await ctx.api('hub_owner',{kind,data,slug:data.slug,confirm:true});ctx.closeDialogs();await ctx.loadFeed();await ownerPanel();ctx.toast('Owner decision saved.');}catch(error){ctx.toast(error.message);e.target.disabled=false;}},{once:true});}
  async function loadAdditions(){if(ctx.isPreview||!ctx.client())return;const {data,error}=await ctx.client().from('community_catalog_additions').select('*').eq('published',true).limit(500);if(error)return;for(const row of data)if(!ctx.catalog().some(s=>s.id===row.id))ctx.catalog().push(additionToSite(row));}
  async function initialize(){mount();await loadAdditions();
    const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('unsubscribe')){const token=hash.get('unsubscribe');history.replaceState(null,'',location.pathname+location.search);ctx.showDialog('<p class="eyebrow">EMAIL PREFERENCES</p><h2 id="content-title">Stop weekly digests?</h2><p>Confirm to stop future roundups. Your account and posting access stay active.</p><button class="button-primary" id="lab-unsubscribe">Stop weekly digests</button> <button class="button-quiet" data-close>Keep my preference</button>');$('lab-unsubscribe').addEventListener('click',async e=>{e.target.disabled=true;try{if(!ctx.isPreview){const c=window.COWBOY_COMMUNITY_CONFIG;const r=await fetch(c.supabaseUrl+'/functions/v1/community-programs',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.publishableKey},body:JSON.stringify({action:'unsubscribe',token})});if(!r.ok||(await r.json()).unsubscribed!==true)throw new Error('This unsubscribe link has expired. Use the newest email or your board preferences.');}ctx.closeDialogs();ctx.toast(ctx.isPreview?'Preview only. No preference changed.':'Weekly digests stopped.');}catch(error){ctx.toast(error.message);e.target.disabled=false;}});return;}
    const kind=new URLSearchParams(location.search).get('compose');if(kind==='site-report')siteReport();else if(KIND_LABELS[kind])openComposer(kind);
  }
  async function previewAPI(action,payload){
    if(action==='hub_state')return structuredClone(personal);
    if(action==='hub_mutate'){
      const d=payload.data||{},t=ctx.demoThreads().find(t=>t.id===d.threadId);let c=personal.choices.find(c=>c.thread_id===d.threadId);
      if(['helpful','following','saved','poll_vote'].includes(payload.kind)){if(!c){c={thread_id:d.threadId,helpful:false,following:false,saved:false,poll_choice:null};personal.choices.push(c);}if(payload.kind==='poll_vote'){if(c.poll_choice!==null)t.poll_counts[c.poll_choice]--;t.poll_counts??=Array(t.post_data.options.length).fill(0);t.poll_counts[d.choice]++;c.poll_choice=d.choice;}else{c[payload.kind]=d.enabled;if(payload.kind==='helpful')t.helpful_count=Math.max(0,(t.helpful_count||0)+(d.enabled?1:-1));}}
      if(payload.kind==='accept_answer')t.accepted_reply_id=d.replyId||null;
      if(payload.kind==='digest')personal.digestEnabled=d.enabled;
      if(payload.kind==='notification_read')personal.notifications.forEach(n=>{if(!d.threadId||d.threadId===n.thread_id)n.unread=false;});
      if(payload.kind==='site_report')demoReports.push({id:ctx.sampleID(),...d,site_id:d.siteId,created_at:new Date().toISOString()});
      return {updated:true,recorded:true,emailSent:false};
    }
    if(action==='hub_owner'){
      if(payload.kind==='overview')return {discoveries:ctx.demoThreads().filter(t=>t.post_kind==='discovery'),projects:ctx.demoThreads().filter(t=>t.post_kind==='project'),reports:demoReports,editorial:[{slug:'welcome',title:'A useful welcome prompt',published_thread_id:demoEditorial[0]}],digests:[],digestSubscribers:personal.digestEnabled?1:0};
      if(payload.kind==='review_discovery'){const t=ctx.demoThreads().find(t=>t.id===payload.data.threadId);if(t)t.discovery_status=payload.data.status;}
      if(payload.kind==='feature_project'){const t=ctx.demoThreads().find(t=>t.id===payload.data.threadId);if(t)t.featured=payload.data.enabled;}
      if(payload.kind==='resolve_site_report')demoReports=demoReports.filter(r=>r.id!==payload.data.id);
      if(payload.kind==='publish_prompt')demoEditorial.push(ctx.sampleID());return {updated:true};
    }
    return {};
  }
  document.addEventListener('change',e=>{if(e.target.id==='lab-post-kind'){draftKind=e.target.value;$('content-title').textContent=KIND_LABELS[draftKind]+'.';$('lab-site-label').textContent='A toolbox website'+(draftKind==='review'?'':' · optional');$('lab-compose-fields').innerHTML=composerFields(draftKind);const select=$('lab-composer').elements.siteId;select.required=draftKind==='review';}});
  document.addEventListener('submit',async e=>{
    const form=e.target;if(!['lab-composer','lab-digest-form','lab-site-report','lab-discovery-review'].includes(form.id))return;e.preventDefault();e.stopPropagation();
    if(form.id==='lab-composer'){await submitComposer(form);return;}const button=form.querySelector('[type=submit]');button.disabled=true;
    try{
      if(form.id==='lab-digest-form'){await mutate('digest',{enabled:form.elements.digest.checked});ctx.toast(ctx.isPreview?'Preview preference saved for this page.':'Your email preference is saved.');}
      if(form.id==='lab-site-report'){await mutate('site_report',Object.fromEntries(new FormData(form)));ctx.closeDialogs();ctx.toast(ctx.isPreview?'Preview report recorded in this page.':'Your private report is in Cowboy’s review queue.');}
      if(form.id==='lab-discovery-review'){await ctx.api('hub_owner',{kind:'review_discovery',confirm:true,data:{threadId:form.dataset.id,...Object.fromEntries(new FormData(form))}});ctx.closeDialogs();await loadAdditions();await ctx.loadFeed();await ownerPanel();ctx.toast('Discovery decision saved.');}
    }catch(error){const m=form.querySelector('.form-message');if(m){m.hidden=false;m.textContent=error.message;}else ctx.toast(error.message);}finally{if(button.isConnected)button.disabled=false;}
  });
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-lab-compose],[data-lab-view],[data-lab-personal],[data-lab-choice],[data-lab-accept],[data-lab-vote],[data-lab-notification],[data-lab-read-all],[data-lab-review],[data-lab-resolve],[data-lab-feature],[data-lab-prompt]');if(!b)return;
    try{
      if(b.hasAttribute('data-lab-compose'))return openComposer(b.dataset.labCompose);
      if(b.hasAttribute('data-lab-view')){if(['saved','following'].includes(b.dataset.labView)&&!signedIn())return;view=b.dataset.labView;ctx.closeDialogs();await ctx.loadFeed();return;}
      if(b.hasAttribute('data-lab-personal'))return await personalPanel();
      if(b.hasAttribute('data-lab-review'))return discoveryReview(b.dataset.labReview);
      if(b.hasAttribute('data-lab-resolve'))return await confirmOwner('resolve_site_report',{id:b.dataset.labResolve},'Mark this listing report reviewed?');
      if(b.hasAttribute('data-lab-feature'))return await confirmOwner('feature_project',{threadId:b.dataset.labFeature,enabled:b.dataset.enabled==='true'},'Save this project feature?');
      if(b.hasAttribute('data-lab-prompt'))return await confirmOwner('publish_prompt',{slug:b.dataset.labPrompt},'Publish this owner prompt?');
      if(!signedIn())return;b.disabled=true;
      if(b.hasAttribute('data-lab-choice'))await mutate(b.dataset.labChoice,{threadId:b.dataset.threadId,enabled:b.getAttribute('aria-pressed')!=='true'});
      if(b.hasAttribute('data-lab-accept'))await mutate('accept_answer',{threadId:ctx.state.thread.id,replyId:ctx.state.thread.accepted_reply_id===b.dataset.labAccept?null:b.dataset.labAccept});
      if(b.hasAttribute('data-lab-vote'))await mutate('poll_vote',{threadId:ctx.state.thread.id,choice:Number(b.dataset.labVote)});
      if(b.hasAttribute('data-lab-read-all')){await mutate('notification_read',{});return await personalPanel();}
      if(b.hasAttribute('data-lab-notification')){await mutate('notification_read',{threadId:b.dataset.labNotification});return await ctx.openThread(b.dataset.labNotification);}
      await ctx.loadFeed();if(ctx.state.thread)await ctx.openThread(ctx.state.thread.id);
    }catch(error){ctx.toast(error.message);}finally{if(b.isConnected)b.disabled=false;}
  });
  return {initialize,refreshPersonal,applyQuery,filterRow,decorateAccount,decorateFeed,decorateThread,openComposer,ownerPanel,previewAPI,siteReport};
}
