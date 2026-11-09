import {escapeHTML as esc,canPost} from './community-core.mjs';
import {easternTime,timeHTML,replyLocation,forumBody,draftKey} from './forum-core.mjs?v=powers1';
import {attachDraft} from './forum-drafts.mjs';

export function createForum(ctx){
  let unreadOnly=false,replyDraft=null,quoted=null,directoryRows=[],directoryOffset=0,directoryMore=false,directoryGeneration=0;
  const readKey=()=>`commons-read-v1:${ctx.state.member?.user_id||'visitor'}`;
  const reads=()=>{try{return JSON.parse(localStorage.getItem(readKey())||'{}');}catch{return {};}};
  const isUnread=t=>Date.parse(t.activity_at||t.created_at)>(reads()[t.id]||0);
  function markRead(thread){try{const map=reads();map[thread.id]=Date.parse(thread.activity_at||thread.created_at)||Date.now();const keys=Object.keys(map).sort((a,b)=>map[b]-map[a]).slice(0,300);localStorage.setItem(readKey(),JSON.stringify(Object.fromEntries(keys.map(k=>[k,map[k]]))));}catch{}}
  function mount(){
    if(document.getElementById('forum-toolbar'))return;
    const nav=document.createElement('nav');nav.id='forum-toolbar';nav.className='forum-toolbar';nav.setAttribute('aria-label','Community shortcuts');
    nav.innerHTML='<button class="button-quiet" data-forum-members>Member directory</button><button class="button-quiet" data-forum-unread aria-pressed="false">Unread topics</button><button class="text-button" data-forum-read>Mark loaded topics read</button><a class="text-button" href="community-research.html">Behind the upgrade ↗</a>';
    document.querySelector('.community-tools').after(nav);
    const search=document.getElementById('community-search');search.maxLength=180;search.placeholder='Search topics, replies, tools or authors…';
  }
  function decorateFeed(rows){
    mount();document.querySelector('[data-forum-unread]')?.setAttribute('aria-pressed',String(unreadOnly));
    for(const [i,card] of [...document.querySelectorAll('.thread-card')].entries()){
      const t=rows[i];if(!t)continue;
      if(isUnread(t)){const flag=document.createElement('span');flag.className='forum-unread';flag.textContent='● Unread';card.querySelector('.thread-kicker').append(flag);}
      const age=card.querySelector('.thread-age');if(age)age.innerHTML='Started '+timeHTML(t.created_at);
      if(t.last_reply_at){const last=document.createElement('p');last.className='forum-last-reply';last.innerHTML='Last reply '+timeHTML(t.last_reply_at)+` <button class="text-button" data-forum-latest="${esc(t.id)}">Read latest ↗</button>`;card.append(last);}
    }
  }
  const signature=id=>{const p=ctx.profiles.cache.get(id);return p?.published&&p?.account_active&&p?.details?.share_signature&&p.details.signature?`<footer class="forum-signature">${forumBody(p.details.signature)}</footer>`:'';};
  function metadata(reply){return `<span class="forum-post-time">${timeHTML(reply.created_at)}</span><span class="forum-location">⌖ ${esc(replyLocation(reply,ctx.profiles.cache.get(reply.author_id)))}</span>${reply.edited_at?`<span class="forum-edited">Edited ${esc(easternTime(reply.edited_at))}</span>`:''}`;}
  function replyHTML(reply,index){
    const ref=ctx.state.quoteReferences?.get(reply.reply_to_id)||ctx.state.replies.find(r=>r.id===reply.reply_to_id);
    return `<article id="reply-${esc(reply.id)}" data-hub-reply="${esc(reply.id)}" class="reply forum-post ${reply.author_kind==='edward'?'reply-edward':''}" tabindex="-1"><header class="forum-post-header"><div class="thread-meta">${ctx.profiles.author(reply.author_id,reply.author_name,reply.author_kind==='edward')}${reply.author_kind==='edward'?'<span class="moderator-badge">Automated moderator</span>':''}</div><span class="forum-post-number">#${ctx.state.replyPage*50+index+1}</span></header><div class="forum-post-context">${metadata(reply)}</div>${reply.reply_to_id?`<aside class="forum-quote">${ref?`<button class="text-button" data-forum-jump="${esc(ref.id)}">↳ In reply to ${esc(ref.author_name)}</button><p>${esc(ref.body.slice(0,240))}${ref.body.length>240?'…':''}</p>`:'Referenced reply is no longer publicly available.'}</aside>`:''}<div class="reply-body">${forumBody(reply.body)}</div>${signature(reply.author_id)}<div class="forum-post-actions"><button class="text-button" data-forum-share="${esc(reply.id)}">Link to reply</button>${canPost(ctx.state.member)&&!ctx.state.thread.locked?`<button class="text-button" data-forum-quote="${esc(reply.id)}">Quote & reply</button>`:''}${reply.author_kind!=='edward'?`<button class="text-button" data-report-reply="${esc(reply.id)}">Report</button>`:''}${reply.author_kind==='member'&&canPost(ctx.state.member)&&!ctx.state.thread.locked&&(reply.author_id===ctx.state.member?.user_id||ctx.state.member?.role==='owner')?`<button class="text-button" data-forum-edit="${esc(reply.id)}">Edit reply</button>`:''}</div></article>`;
  }
  function pager(){
    const total=ctx.state.replyTotal||0,page=ctx.state.replyPage||0,pages=Math.max(1,Math.ceil(total/50));
    return `<nav class="forum-pager" aria-label="Reply pages"><button class="button-quiet" data-forum-page="${page-1}" ${page===0?'disabled':''}>← Earlier</button><span>${total?'Replies '+(page*50+1)+'–'+Math.min(total,(page+1)*50)+' of '+total:'No replies yet'} · page ${page+1}/${pages}</span><button class="button-quiet" data-forum-page="${page+1}" ${page>=pages-1?'disabled':''}>Later →</button></nav>`;
  }
  function attachReply(){
    const form=document.getElementById('reply-form');quoted=null;
    if(!form)return;
    form.insertAdjacentHTML('afterbegin','<div id="forum-quote-target" class="forum-quote-target" hidden></div><input type="hidden" name="replyToId" value="">');
    const toolbar=document.createElement('div');toolbar.className='forum-editor-tools';toolbar.setAttribute('aria-label','Reply formatting');toolbar.innerHTML='<button type="button" class="button-quiet" data-forum-format="bold">Bold</button><button type="button" class="button-quiet" data-forum-format="code">Code</button><button type="button" class="button-quiet" data-forum-format="quote">Quote text</button><button type="button" class="button-quiet" data-forum-preview>Preview</button>';
    form.querySelector('textarea').closest('label').before(toolbar);
    form.insertAdjacentHTML('beforeend','<div id="forum-reply-preview" class="forum-reply-preview" hidden></div>');
    replyDraft=attachDraft(form,draftKey(ctx.state.member?.user_id,'reply',ctx.state.thread.id),{preview:ctx.isPreview,onRestore:()=>showQuote(form.elements.replyToId.value)});
  }
  function clearDraft(){replyDraft?.clear();replyDraft=null;}
  function showQuote(id){
    const form=document.getElementById('reply-form'),box=document.getElementById('forum-quote-target');if(!form||!box)return;
    const r=ctx.state.replies.find(r=>r.id===id)||ctx.state.quoteReferences?.get(id);quoted=id||null;form.elements.replyToId.value=id||'';box.hidden=!id;
    if(id)box.innerHTML=`Replying to ${esc(r?.author_name||'a referenced reply')} <button type="button" class="text-button" data-forum-unquote>Remove quote</button>`;
  }
  function afterThread(){markRead(ctx.state.thread);attachReply();ctx.renderFeed();}
  function directoryMarkup(){return `<p class="eyebrow">THE PEOPLE BEHIND THE POSTS</p><h2 id="content-title">Find your people.</h2><p class="dialog-lead">Only approved members who chose to share their profiles appear here.</p><label class="field"><span>Search shared profiles</span><input type="search" id="forum-member-search" maxlength="80" placeholder="A name, handle, interest or craft…"></label><div id="forum-directory" class="forum-directory" aria-live="polite"></div><button class="button-quiet" id="forum-members-more" data-forum-members-more hidden>More members ↓</button>`;}
  function renderDirectory(){
    const q=(document.getElementById('forum-member-search')?.value||'').toLowerCase(),terms=q.split(/\s+/u).filter(Boolean);
    const rows=directoryRows.filter(p=>terms.every(w=>[p.display_name,p.handle,p.headline,p.location,...p.interests||[],...p.details?.skills||[]].join(' ').toLowerCase().includes(w)));
    const target=document.getElementById('forum-directory');if(!target)return;
    target.innerHTML=rows.length?rows.map(p=>`<button class="forum-member" data-member-profile="${esc(p.user_id)}">${ctx.profiles.avatar(p)}<span><b>${esc(p.display_name)}</b>${p.handle?`<small>@${esc(p.handle)}</small>`:''}<small>${esc(p.headline||'Here for good discoveries.')}</small><span class="profile-interests">${(p.interests||[]).slice(0,3).map(t=>`<span>${esc(t)}</span>`).join('')}</span></span>${p.badge?'<span class="profile-badge">Owner</span>':''}</button>`).join(''):`<p class="forum-empty">${q?'No matches among the loaded profiles. Load more or try another word.':'No shared member profiles here yet. Your published posts can still be read by members.'}</p>`;
    document.getElementById('forum-members-more').hidden=!directoryMore;
  }
  async function loadMembers(append=false){
    const generation=++directoryGeneration,button=document.getElementById('forum-members-more');if(button)button.disabled=true;
    try{if(!append){directoryRows=[];directoryOffset=0;}
      let rows;
      if(ctx.isPreview)rows=[...ctx.profiles.cache.values()].filter(p=>p.published&&p.account_active);
      else {const result=await ctx.client().from('community_profiles').select('*').eq('published',true).eq('account_active',true).order('display_name').order('user_id').range(directoryOffset,directoryOffset+29);if(result.error)throw new Error('The member directory could not load. Try again.');rows=result.data;}
      if(generation!==directoryGeneration)return;
      await ctx.profiles.load(rows.map(p=>p.user_id));directoryRows=append?[...directoryRows,...rows]:rows;directoryOffset+=rows.length;directoryMore=!ctx.isPreview&&rows.length===30;renderDirectory();
    }catch(error){const target=document.getElementById('forum-directory');if(target)target.innerHTML=`<p>${esc(error.message)}</p><button class="button-quiet" data-forum-members-retry>Try again</button>`;}finally{if(button?.isConnected)button.disabled=false;}
  }
  async function showMembers(){ctx.showDialog(directoryMarkup());await loadMembers();}
  async function activity(id){
    ctx.showDialog('<p class="eyebrow">MEMBER CONTRIBUTIONS</p><h2 id="content-title">Member field notes.</h2><div id="forum-activity">Loading published activity…</div>');
    try{
      let topics,replies,topicCount,replyCount;
      if(ctx.isPreview){topics=ctx.state.threads.filter(t=>t.author_id===id).slice(0,12);replies=ctx.state.replies.filter(r=>r.author_id===id).slice(0,12);topicCount=topics.length;replyCount=replies.length;}
      else {const results=await Promise.all([ctx.client().from('community_threads').select('id,title,created_at',{count:'exact'}).eq('author_id',id).eq('status','published').order('created_at',{ascending:false}).limit(12),ctx.client().from('community_replies').select('id,thread_id,body,created_at',{count:'exact'}).eq('author_id',id).eq('status','published').order('created_at',{ascending:false}).limit(12)]);if(results.some(r=>r.error))throw new Error('Member activity could not load.');topics=results[0].data;replies=results[1].data;topicCount=results[0].count;replyCount=results[1].count;}
      const target=document.getElementById('forum-activity');if(!target)return;
      target.innerHTML=`<p class="forum-activity-counts"><b>${topicCount}</b> member topics · <b>${replyCount}</b> member replies</p><h3>Recent topics</h3>${topics.length?topics.map(t=>`<button class="forum-activity-item" data-thread="${esc(t.id)}"><b>${esc(t.title)}</b><small>${esc(easternTime(t.created_at))}</small></button>`).join(''):'<p>No published topics yet.</p>'}<h3>Recent replies</h3>${replies.length?replies.map(r=>`<button class="forum-activity-item" data-forum-activity-thread="${esc(r.thread_id)}" data-reply-id="${esc(r.id)}"><span>${esc(r.body.slice(0,160))}</span><small>${esc(easternTime(r.created_at))}</small></button>`).join(''):'<p>No published replies yet.</p>'}<p class="privacy-notice">Only published contributions are shown. Up to 12 recent entries of each kind.</p>`;
    }catch(error){const target=document.getElementById('forum-activity');if(target)target.textContent=error.message;}
  }
  document.addEventListener('input',e=>{if(e.target.id==='forum-member-search')renderDirectory();});
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    try{
      if(b.hasAttribute('data-forum-members')||b.hasAttribute('data-forum-members-retry'))return await showMembers();
      if(b.hasAttribute('data-forum-members-more'))return await loadMembers(true);
      if(b.hasAttribute('data-member-posts'))return await activity(b.dataset.memberPosts);
      if(b.hasAttribute('data-forum-unread')){unreadOnly=!unreadOnly;return ctx.renderFeed();}
      if(b.hasAttribute('data-forum-read')){ctx.state.threads.forEach(markRead);ctx.toast('Loaded conversations marked read on this browser.');return ctx.renderFeed();}
      if(b.hasAttribute('data-forum-latest'))return await ctx.openThread(b.dataset.forumLatest,{latest:true});
      if(b.hasAttribute('data-forum-page'))return await ctx.openThread(ctx.state.thread.id,{page:Number(b.dataset.forumPage)});
      if(b.hasAttribute('data-forum-activity-thread'))return await ctx.openThread(b.dataset.forumActivityThread,{replyId:b.dataset.replyId});
      if(b.hasAttribute('data-forum-jump'))return await ctx.openThread(ctx.state.thread.id,{replyId:b.dataset.forumJump});
      if(b.hasAttribute('data-forum-share')){const url=new URL('community.html',location.href);url.searchParams.set('thread',ctx.state.thread.id);url.searchParams.set('reply',b.dataset.forumShare);if(ctx.isPreview)url.searchParams.set('preview','1');try{await navigator.clipboard.writeText(url.href);ctx.toast('Direct reply link copied.');}catch{ctx.showDialog(`<h2 id="content-title">Direct reply link</h2><p class="privacy-notice">${esc(url.href)}</p>`);}return;}
      if(b.hasAttribute('data-forum-quote')){showQuote(b.dataset.forumQuote);replyDraft?.save();document.querySelector('#reply-form textarea')?.focus();return;}
      if(b.hasAttribute('data-forum-unquote')){showQuote(null);replyDraft?.save();return;}
      if(b.hasAttribute('data-forum-format')){
        const input=document.querySelector('#reply-form textarea');if(!input)return;const selected=input.value.slice(input.selectionStart,input.selectionEnd)||'text',wrap={bold:['**','**'],code:['`','`'],quote:['> ','']}[b.dataset.forumFormat];input.setRangeText(wrap[0]+selected+wrap[1],input.selectionStart,input.selectionEnd,'select');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();return;
      }
      if(b.hasAttribute('data-forum-preview')){const target=document.getElementById('forum-reply-preview');target.hidden=!target.hidden;target.innerHTML='<p class="eyebrow">UNSENT PREVIEW</p>'+forumBody(document.querySelector('#reply-form textarea').value);return;}
      if(b.hasAttribute('data-forum-edit')){
        const reply=ctx.state.replies.find(r=>r.id===b.dataset.forumEdit);if(!reply)return;
        ctx.showDialog(`<p class="eyebrow">CORRECT OR CLARIFY</p><h2 id="content-title">Edit your reply.</h2><p class="privacy-notice">The original post time stays visible. Saved changes show an edited timestamp and are checked against the same posting rules.</p><form id="forum-edit-form" data-reply-id="${esc(reply.id)}" data-thread-id="${esc(ctx.state.thread.id)}"><label class="field"><span>Reply text</span><textarea name="body" minlength="2" maxlength="6000" required>${esc(reply.body)}</textarea></label><button type="submit" class="button-primary">Save edit</button><p class="form-message" role="status" hidden></p></form>`);
      }
    }catch(error){ctx.toast(error.message);}
  });
  document.addEventListener('submit',async e=>{
    const form=e.target;if(form.id!=='forum-edit-form')return;e.preventDefault();const button=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');button.disabled=true;
    try{const result=await ctx.api('edit_reply',{replyId:form.dataset.replyId,body:form.elements.body.value});await ctx.loadFeed();await ctx.openThread(form.dataset.threadId,{replyId:result.reply.status==='published'?result.reply.id:null});ctx.toast(result.reply.status==='held'?'Edit saved for Cowboy’s review.':'Reply updated.');}catch(error){status.hidden=false;status.textContent=error.message;}finally{button.disabled=false;}
  });
  return {mount,decorateFeed,filterRow:t=>!unreadOnly||isUnread(t),metadata,replyHTML,pager,afterThread,clearDraft,signature,showMembers};
}
