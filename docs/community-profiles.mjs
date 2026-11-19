import {escapeHTML as esc,initials,renderBody,displayName,safeHttps,canPost} from './community-core.mjs';
import {DETAIL_DEFAULTS,forumBody} from './forum-core.mjs?v=powers1';
import {PROFILE_ICONS,PROFILE_FIELDS,PROFILE_DEFAULTS,AVATAR_BUCKET,validateProfile,profileCompletion} from './profile-core.mjs?v=powers1';
import {getAvatarPhoto,cacheAvatarPhoto,clearAvatarPhotos} from './family-avatar-cache.mjs?v=workshop1';
import {DEFAULT_AVATAR_RECIPE,normalizeAvatarRecipe,makeAvatarStudioHTML,randomAvatarRecipe} from './family-avatar-builder.mjs?v=history1';
import {avatarProjections,cacheAvatarCharacter,clearAvatarCharacters,forgetAvatarCharacter} from './avatar-character-images.mjs?v=workshop1';
import {watchRewardGame} from './avatar-reward-session.mjs?v=workshop1';
import {mysteryCrewPortraitSVG,BASIC_MYSTERY_CREW} from './mystery-crew-portrait.mjs?v=fidelity1';

import {fitsBody,normalizeBody,starterBody} from './avatar-full-body.mjs?v=workshop1';
import {mountTurntable,turntableHTML} from './avatar-turntable-controls.mjs?v=workshop1';
import {SHOWROOM_LOOKS} from './avatar-showroom-presets.mjs?v=workshop1';

export function createProfileStudio(ctx){
  const cache=new Map(),images=new Map(),characterURLs=new Map(),mysteryPortraits=new Map();
  const approved=()=>canPost(ctx.state.member);
  const copy=value=>JSON.parse(JSON.stringify(value));
  let bitmap=null,draft=null,photoChanged=false,selectedTab='profile',avatarRecipe=null,avatarMethod='photo';
  let rewards=null,rewardModule=null,ownerId=null,previewRPC=null,avatarChanged=false,savedRecipe=null;
  let undo=[],redo=[],revision=0,editorSession=0,stopTrip=null,stopWait=null,chosenPhoto=null,previewImage='',activeCelebration=null;
  let warmTimer=0,memberView=null,sculpting=null;
  const portrait=p=>p?.avatar_display&&characterURLs.get(p?.user_id);
  const icon=p=>PROFILE_ICONS.find(i=>i.id===p?.avatar_icon)?.symbol||'◈';
  const getOwn=()=>({...PROFILE_DEFAULTS,...ctx.state.profile,details:{...DETAIL_DEFAULTS,...ctx.state.profile?.details},user_id:ctx.state.member?.user_id,display_name:ctx.state.member?.display_name||'Your name',badge:ctx.state.member?.role==='owner'?'Owner':null});
  function avatar(p,size='',draftImage=''){
    const figure=mysteryPortraits.get(p?.user_id)||BASIC_MYSTERY_CREW;
    return '<span class="avatar profile-avatar mystery-crew-portrait '+esc(size)+'" aria-hidden="true">'+mysteryCrewPortraitSVG(figure)+'</span>';
  }
  function author(id,name,edward=false){const p=cache.get(id);return edward?`<span class="avatar edward-small" aria-hidden="true">E</span><b>Edward</b>`:`<button type="button" class="member-author" data-member-profile="${esc(id||'')}" ${id?'':'disabled'} aria-label="View ${esc(name)}’s profile">${avatar(p||{display_name:name})}<span>${esc(name)}${p?.details?.share_about&&p.details.title?`<small class="author-title">${esc(p.details.title)}</small>`:''}</span>${p?.badge?'<span class="profile-badge">Owner</span>':''}</button>`;}
  async function imageURLs(profiles){
    const paths=[...new Set(profiles.filter(p=>p?.avatar_mode==='photo'&&p.avatar_path).map(p=>p.avatar_path))];
    const characters=await Promise.all(profiles.filter(p=>p?.avatar_display).map(async p=>
      [p.user_id,await cacheAvatarCharacter(p.user_id,p.avatar_display)]));
    for(const [id,url] of characters)if(url)characterURLs.set(id,url);
    // Download to a session-local blob URL. No expiring signed link means no
    // alternating photos/initials during scoreboard and post refreshes.
    const urls=await Promise.all(paths.map(async path=>[path,await getAvatarPhoto(ctx.client(),path)]));
    for(const [path,url] of urls)if(url)images.set(path,url);
  }
  async function load(ids){const unique=[...new Set(ids.filter(Boolean))].slice(0,100);if(ctx.isPreview){for(const id of unique)if(!cache.has(id))cache.set(id,{...PROFILE_DEFAULTS,user_id:id,display_name:'Example maker',headline:'Curious by nature. Maker by habit.',bio:'Here for practical ideas, and family time.',interests:['Making','Good finds','Learning'],theme:'copper',cover:'sunburst',published:true,account_active:true});return;}
    if(!ctx.client()||!unique.length)return;
    const [profiles,portraits]=await Promise.all([
      ctx.client().from('community_profiles').select(PROFILE_FIELDS).in('user_id',unique),
      ctx.client().rpc('community_mystery_crew_portraits',{p_members:unique})
    ]);
    if(profiles.error)return;
    for(const id of unique){cache.delete(id);mysteryPortraits.delete(id);}
    for(const p of profiles.data||[])cache.set(p.user_id,{...p,avatar_display:null});
    if(!portraits.error)for(const row of portraits.data||[])mysteryPortraits.set(row.user_id,row.crew_character||BASIC_MYSTERY_CREW);
  }
  function card(p,editor=false,draftImage=''){const links=[...(p.website?[{label:'My website',url:p.website}]:[]),...(p.links||[])].filter(l=>safeHttps(l.url)).map(l=>({...l,url:safeHttps(l.url)}));return `<article class="member-card theme-${esc(p.theme)} layout-${esc(p.details?.layout||'classic')}"><div class="profile-cover cover-${esc(p.cover)}"><span class="cover-mark" aria-hidden="true">✳</span><span class="cover-caption">THE COMMONS / ${p.badge?'COWBOY’S CORNER':'MEMBER FIELD NOTES'}</span></div><div class="member-card-body">${avatar(p,'avatar-large',draftImage)}<div class="profile-heading"><h3>${esc(p.display_name)}</h3>${p.badge?'<span class="profile-badge">Owner</span>':''}</div>${p.handle?`<p class="profile-handle">@${esc(p.handle)}</p>`:''}<p class="profile-headline">${esc(p.headline||'A little curious. In good company.')}</p>${p.location?`<p class="profile-location">⌖ ${esc(p.location)}</p>`:''}${p.bio?`<div class="profile-bio">${renderBody(p.bio)}</div>`:'<p class="profile-placeholder">A little about you goes here.</p>'}${extrasCard(p)}<div class="profile-interests">${(p.interests||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div>${links.length?`<div class="profile-links">${links.map(link=>`<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)} ↗</a>`).join('')}</div>`:''}<p class="profile-card-foot">${editor?'YOUR LIVE PREVIEW':p.joined_at?'IN GOOD COMPANY SINCE '+new Date(p.joined_at).getFullYear():'COME CURIOUS. LEAVE INSPIRED.'}</p></div></article>`;}
  function extrasCard(p){const d=p.details||{};return `${d.share_about?`<div class="profile-extras">${d.title?`<strong>${esc(d.title)}</strong>`:''}${d.status?`<p class="member-status">${esc(d.status)}</p>`:''}${[d.pronouns,d.occupation].filter(Boolean).length?`<p>${[d.pronouns,d.occupation].filter(Boolean).map(esc).join(' · ')}</p>`:''}${d.skills?.length?`<h4>Know-how</h4><div class="profile-interests">${d.skills.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${d.favorite_tools?.length?`<h4>Favorite tools</h4><p>${d.favorite_tools.map(esc).join(' · ')}</p>`:''}</div>`:''}${d.share_signature&&d.signature?`<div class="forum-signature">${forumBody(d.signature)}</div>`:''}`;}
  function applyReader(details={}){const d={...DETAIL_DEFAULTS,...details};document.body.classList.toggle('forum-compact',d.density==='compact');document.body.classList.toggle('forum-large-text',d.text_size==='large');document.body.classList.toggle('forum-hide-signatures',d.hide_signatures);document.body.classList.toggle('forum-reduce-motion',d.reduce_motion);}
  function forumFields(p){const d={...DETAIL_DEFAULTS,...p.details},check=(name,label,value)=>`<label class="check-label"><input type="checkbox" name="${name}" ${value?'checked':''}><span>${label}</span></label>`,select=(label,name,value,options)=>`<label class="field"><span>${label}</span><select name="${name}">${options.map(([id,title])=>`<option value="${id}" ${value===id?'selected':''}>${title}</option>`).join('')}</select></label>`;return `<div data-profile-pane="forum" hidden><h3>A little old-school personality.</h3>${field('Your personal title','forumTitle',d.title,48,'placeholder="Curious tinkerer"')}${field('Status line','status',d.status,100,'placeholder="Currently learning something new…"')}${field('Pronouns · optional','pronouns',d.pronouns,32)}${field('Occupation or craft · optional','occupation',d.occupation,60)}${field('Know-how · up to 8, comma separated','skills',d.skills.join(', '),220,'placeholder="Woodworking, Gardening, Photography"')}${field('Favorite tools · up to 4, comma separated','favoriteTools',d.favorite_tools.join(', '),330)}${check('shareAbout','Share these optional identity details with my public profile',d.share_about)}<label class="field"><span>Your post signature · 220 characters</span><textarea name="signature" maxlength="220" rows="3" placeholder="A line that sounds like you.">${esc(d.signature)}</textarea></label>${check('shareSignature','Show my signature below posts when my profile is shared',d.share_signature)}${check('replyLocation','Show my chosen profile location beside replies',d.reply_location)}<p class="privacy-notice">Use a city or region you want public. Location comes from your profile, never your device or IP address. Unshared extras and reading preferences are stored privately.</p>${select('Avatar frame','frame',d.frame,[['plain','Simple'],['ring','Double ring'],['stamp','Postage stamp']])}${select('Profile layout','layout',d.layout,[['classic','Classic forum card'],['showcase','Showcase'],['minimal','Minimal']])}</div><div data-profile-pane="reader" hidden><h3>Make the board comfortable.</h3>${select('Conversation spacing','density',d.density,[['comfortable','Comfortable'],['compact','Compact']])}${select('Reading size','textSize',d.text_size,[['standard','Standard'],['large','Larger']])}${check('hideSignatures','Hide post signatures while I read',d.hide_signatures)}${check('reduceMotion','Reduce decorative movement',d.reduce_motion)}${check('acceptFlair','Allow community honors and visual flourishes on my posts',d.accept_flair)}<p class="privacy-notice">You can hide awarded flair here. Your actual rank permissions stay separate.</p><p class="privacy-notice">These reading preferences follow your account. Reply times always use Eastern 24-hour time, including the date and EST or EDT.</p></div>`;}
  function read(form){
    const formData=new FormData(form);
    const text=(key,current)=>String(formData.get(key)??current??'');
    return {...draft,
      display_name:text('displayName',draft.display_name),
      headline:text('headline',draft.headline),
      bio:text('bio',draft.bio),
      interests:text('interests',(draft.interests||[]).join(',')).split(',').map(v=>v.trim()).filter(Boolean).slice(0,8),
      published:formData.has('published'),
      details:{...draft.details,
        text_size:text('textSize',draft.details?.text_size||'standard'),
        reduce_motion:formData.has('reduceMotion')}
    };
  }
  function refresh(){
    const form=document.getElementById('profile-studio-form');
    if(!form)return;
    draft=read(form);
    for(const tab of form.querySelectorAll('[data-avatar-method]')){
      tab.setAttribute('aria-pressed',String(tab.dataset.avatarMethod===avatarMethod));
    }
    form.querySelectorAll('[data-avatar-method-panel]').forEach(p=>{
      p.hidden=p.dataset.avatarMethodPanel!==avatarMethod;
    });
    for(const b of form.querySelectorAll('[data-avatar-feature]')){
      b.setAttribute('aria-pressed',String(avatarRecipe[b.dataset.avatarFeature]===b.dataset.avatarValue));
    }
    const kit=normalizeBody(avatarRecipe);
    for(const b of form.querySelectorAll('[data-avatar-body]')){
      b.setAttribute('aria-pressed',String(kit[b.dataset.avatarBody]===b.dataset.avatarValue));
    }
    for(const input of form.querySelectorAll('[data-studio-sculpt]')){
      const step=kit[input.dataset.studioSculpt]??'0';
      if(input.value!==step)input.value=step;
    }
    const canvas=form.querySelector('#family-avatar-canvas');
    if (canvas&&selectedTab==='avatar'&&avatarMethod==='character') rewards?.paintPreview();
    else if(avatarChanged&&avatarMethod==='character') previewImage=rewardModule?.avatarSnapshot(avatarRecipe,128)||previewImage;
    const preview=document.getElementById('profile-live-preview');
    if(preview){
      const showDraft=selectedTab==='avatar'||avatarChanged||photoChanged;
      const base=showDraft&&avatarMethod!=='character'
        ? {...draft,avatar_display:null,avatar_mode:avatarMethod,avatar_path:photoChanged?draft.avatar_path:chosenPhoto}
        : draft;
      preview.innerHTML=card(base,true,showDraft&&avatarMethod==='character'?previewImage:'');
    }
    const undoButton=form.querySelector('[data-avatar-undo]');
    if(undoButton)undoButton.disabled=undo.length===0;
    const redoButton=form.querySelector('[data-avatar-redo]');
    if(redoButton)redoButton.disabled=redo.length===0;
    const completion=document.getElementById('profile-completion');
    if(completion)completion.textContent=profileCompletion(draft)+'% of your story';
    const progress=document.getElementById('profile-meter');
    if(progress)progress.value=profileCompletion(draft);
    const vis=document.getElementById('profile-visibility');
    if(vis)vis.textContent=draft.published?'Visible to approved family members when saved':'Private profile';
    const save=form.querySelector('button[type="submit"]');
    if(save)save.textContent=selectedTab==='avatar'?'Save look':'Save my changes';
    const characterView=selectedTab==='avatar'&&avatarMethod==='character';
    form.classList.toggle('studio-character-method',characterView);
    const settingsShare=form.querySelector('[data-studio-share]');
    if(settingsShare)settingsShare.checked=draft.published;
    const share=form.querySelector('.profile-publish b');
    if(share)share.textContent=selectedTab==='avatar'?'Share with family':'Show my avatar and profile to approved family';
  }
  function tabs(){
    document.querySelectorAll('[data-profile-pane]').forEach(p=>p.hidden=p.dataset.profilePane!==selectedTab);
    document.querySelectorAll('[data-profile-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.profileTab===selectedTab)));
    const workspace=document.getElementById('content-dialog');
    workspace.classList.toggle('studio-workspace-dialog',selectedTab==='avatar');
    if(selectedTab!=='avatar')rewards?.pause?.();
    document.getElementById('content-title').textContent=selectedTab==='avatar'?'Avatar Studio':'Your family profile';
  }
  function field(label,name,value,max,extra=''){return `<label class="field"><span>${label}</span><input name="${name}" value="${esc(value||'')}" maxlength="${max}" ${extra}></label>`;}
  async function rpc(name,args){
    if(!approved())throw new Error('Only approved family members can use Avatar Studio.');
    if(ctx.isPreview){
      if(!previewRPC){
        const {makePreviewRewardRPC}=await import('./avatar-reward-preview.mjs?v=workshop1');
        previewRPC ||= makePreviewRewardRPC();
      }
      return previewRPC(name,args);
    }
    const {data,error}=await ctx.client().rpc(name,args);
    if(error)throw Object.assign(new Error(error.message),{code:error.code});
    return data;
  }
  function toLoadout(value){
    return rewardModule?.normalizeLoadout(value)||{
      ...normalizeAvatarRecipe(value),...(value?.full_body?{full_body:normalizeBody(value)}:{})
    };
  }
  function remember(stack,recipe){
    stack.push(copy(toLoadout(recipe)));
    if(stack.length>40)stack.shift();
  }
  function moveAvatarHistory(direction){
    const from=direction==='redo'?redo:undo;
    if(!from.length)return false;
    remember(direction==='redo'?undo:redo,avatarRecipe);
    avatarRecipe=from.pop();avatarMethod='character';avatarChanged=true;sculpting=null;
    refresh();rewards?.drawEquipped();
    setStatus(direction==='redo'?'Avatar change redone. Preview only until you save.':
      'Avatar change undone. Preview only until you save.');
    return true;
  }
  function setPreview(value,record=true){
    const next=toLoadout(value);
    if(JSON.stringify(next)===JSON.stringify(toLoadout(avatarRecipe)))return;
    if(record)remember(undo,avatarRecipe);
    // A fresh edit after Undo starts a new history branch, even while dragging a slider.
    redo=[];
    avatarRecipe=next;avatarMethod='character';avatarChanged=true;
    refresh();rewards?.drawEquipped();
  }
  function setStatus(message){
    const node=document.getElementById('avatar-preview-status');
    if(node)node.textContent=message;
  }
  async function ensureRewards(){
    rewardModule ||= await import('./avatar-reward-studio.mjs?v=workshop2');
    if(!approved())return null;
    rewards ||= rewardModule.createRewardStudio({
      getLoadout:()=>avatarRecipe,setLoadout:setPreview,setStatus,playGame,rpc,checkAccess:approved,
      reduceMotion:()=>Boolean(draft?.details.reduce_motion),
      onData(data){
        const incoming=Number(data.revision)||0;
        if(incoming<revision)return;
        revision=incoming;
        if(data.loadout){
          savedRecipe=toLoadout(data.loadout);
          if(!avatarChanged)avatarRecipe=savedRecipe;
        }
        if(!ctx.isPreview&&!(document.getElementById('content-dialog')?.open))renderCelebration();
      }
    });
    return rewards;
  }
  async function mountRewards(options={}){
    const member=ctx.state.member?.user_id,session=editorSession;
    const valid=()=>member===ctx.state.member?.user_id&&approved()&&editorSession===session;
    try{
      await ensureRewards();
      const form=document.getElementById('profile-studio-form');
      if(!form||!valid()||!rewards)return;
      const mounted=Boolean(form.querySelector('.avatar-reward-tabs'));
      if(!mounted)rewards.mount(form,{nextSection:options.section||'avatar',item:options.item||null});
      if(options.rewardState)rewards.restore(options.rewardState);
      else if(mounted&&(options.section||options.item))rewards.restore({section:options.section,detail:options.item});
      refresh();
      if(options.equip&&options.item){
        await rewards.refresh();
        const item=rewardModule.rewardById(options.item);
        if(valid()&&item&&rewards.have(item.id)){
          if(rewards.tryOn(item))form.requestSubmit();
        }
      }else renderCelebration();
    }catch{
      if(valid())setStatus('The collection is temporarily unavailable. Reopen the studio to retry.');
    }
  }
  function playGame(game){
    const account=ctx.state.member?.user_id,returnTo=rewards.stateForReturn();
    const dialog=document.getElementById('content-dialog');
    const restore=()=>{
      stopTrip=null;
      if(account!==ctx.state.member?.user_id||!approved())return;
      void show('avatar',{resume:true,section:returnTo.section,item:returnTo.detail,rewardState:returnTo});
    };
    stopWait?.();
    stopWait=rewardModule.openRewardGame(game,target=>{
      stopWait=null;
      dialog.close();
      stopTrip?.();
      stopTrip=watchRewardGame(restore,()=>{
        restore();
        ctx.toast('The game could not open. Try its button in Family Games.');
      });
      target.click();
    },()=>setStatus('The game is still loading. Try again from this reward.'));
  }
  function renderCelebration(){
    if(activeCelebration&&!activeCelebration.isConnected)activeCelebration=null;
    if(!approved()||!rewards||document.body.classList.contains('arcade-on')||document.querySelector('.hot-rod-monitor[open]'))return;
    const holder=document.getElementById('content-dialog')?.open?document.getElementById('avatar-celebration'):
      document.getElementById('avatar-lobby-celebration');
    if(!holder||holder.hidden||activeCelebration)return;
    const fresh=rewards.recentUnseen();
    if(!fresh.length)return;
    const dismiss=()=>{
      activeCelebration?.remove();
      activeCelebration=null;
      void rewards.acknowledge(fresh);
    };
    activeCelebration=rewardModule.makeAvatarCelebration(fresh,rewards.getData(),{
      dismiss,
      studio(item){dismiss();return show('avatar',{section:'collection',item:item.id});},
      equip(item){
        dismiss();
        if(!document.getElementById('content-dialog')?.open)return show('avatar',{section:'collection',item:item.id,equip:true});
        if(rewards.tryOn(item))document.getElementById('profile-studio-form')?.requestSubmit();
      }
    });
    if(activeCelebration)holder.append(activeCelebration);
  }

  async function show(requested='profile',options={}){
    if(!ctx.state.member)return;
    // New product: approved real family members launch Mystery Crew Creator.
    // The preview sandbox alone retains legacy fixture DOM for unrelated
    // regression tests, not as an option exposed to the family.
    if(requested==='avatar'&&!ctx.isPreview&&approved()){
      location.assign(new URL('./mystery-crew-creator.html',location.href).href);
      return;
    }
    memberView?.destroy();memberView=null;
    const who=ctx.state.member.user_id;
    if(ownerId&&ownerId!==who)clear();
    const session=++editorSession;
    ownerId=who;
    selectedTab=requested==='avatar'&&approved()?'avatar':requested==='account'?'account':'profile';
    if(!options.resume){
      sculpting=null;
      draft=getOwn();
      const starting=draft.avatar_display||draft.details.avatar_recipe||SHOWROOM_LOOKS.detective;
      savedRecipe=toLoadout(starting);
      avatarRecipe=savedRecipe;
      const state=rewards?.getData();
      if(state?.loadout&&Number(state.revision)>=revision)savedRecipe=avatarRecipe=toLoadout(state.loadout);
      else if(draft.avatar_display)savedRecipe=avatarRecipe=toLoadout(draft.avatar_display);
      avatarMethod=draft.avatar_display||(!state?.revision&&draft.avatar_mode==='photo'&&draft.details.avatar_recipe)
        ?'character':draft.avatar_mode==='photo'?'photo':'initials';
      if(selectedTab==='avatar'&&!options.keepMethod)avatarMethod='character';
      avatarChanged=false;photoChanged=false;undo=[];redo=[];
      chosenPhoto=draft.avatar_mode==='photo'&&!draft.details.avatar_recipe?draft.avatar_path:null;
      bitmap?.close?.();bitmap=null;
    }
    await imageURLs([draft]);
    if(who!==ctx.state.member?.user_id||session!==editorSession)return;
    activeCelebration?.remove();activeCelebration=null;
    const readonly=ctx.state.member.role==='owner'?'readonly':'';
    const html=[
      '<p class="eyebrow studio-profile-eyebrow">FAMILY MESSAGE BOARD</p>',
      '<h2 id="content-title">',selectedTab==='avatar'?'Avatar Studio':'Your family profile','</h2>',
      '<p class="dialog-lead studio-profile-lead">Make an avatar, share a little about yourself, and save your favorite look.</p>',
      ctx.isPreview?'<div class="preview-message">Design preview. Nothing is saved to the live board.</div>':'',
      '<div class="profile-studio">',
       '<div class="profile-form-column"><form id="profile-studio-form">',
        '<div class="studio-tabs" role="tablist" aria-label="Profile customization">',
         '<button type="button" role="tab" data-profile-tab="profile" aria-selected="',selectedTab==='profile','">My Profile</button>',
         approved()?'<button type="button" role="tab" data-profile-tab="avatar" aria-selected="'+(selectedTab==='avatar')+'">'+(ctx.isPreview?'Avatar Studio':'Mystery Crew Creator')+'</button>':'',
         '<button type="button" role="tab" data-profile-tab="account" aria-selected="',selectedTab==='account','">Privacy & Account</button>',
        '</div>',
        '<div data-profile-pane="profile">',
         field('Your name','displayName',draft.display_name,36,'minlength="2" required '+readonly),
         field('A little about you','headline',draft.headline,80,'placeholder="I love games, art and family time"'),
         '<label class="field"><span>Your story (optional)</span><textarea name="bio" maxlength="600" rows="3" placeholder="What do you enjoy doing?">',esc(draft.bio||''),'</textarea></label>',
         field('Favorite things (optional, comma-separated)','interests',(draft.interests||[]).join(', '),220,'placeholder="Art, Animals, Games"'),
         '<p class="family-account-privacy">Your profile is only available to approved family members when you choose to share it. You never need to provide your address or birthday.</p>',
        '</div>',
        '<div data-profile-pane="avatar" hidden><div id="avatar-celebration"></div>',
         '<div class="studio-settings-row"><details class="studio-profile-settings">',
          '<summary>Avatar &amp; sharing</summary><div class="studio-profile-sheet">',
          '<div class="family-avatar-methods" role="group" aria-label="Avatar type">',
           '<button type="button" data-avatar-method="character" aria-pressed="false">Character</button>',
           '<button type="button" data-avatar-method="photo" aria-pressed="false">Use a photo</button>',
           '<button type="button" data-avatar-method="initials" aria-pressed="false">Initials</button>',
          '</div><label class="studio-settings-share"><input type="checkbox" data-studio-share ',
          draft.published?'checked':'','><span>Share with approved family</span></label></div></details>',
          '<button type="button" class="studio-profile-link" data-back-to-profile>Profile</button></div>',
         '<div class="avatar-method-pane" data-avatar-method-panel="character">',makeAvatarStudioHTML(avatarRecipe),
         '</div>',
         '<div class="avatar-method-pane" data-avatar-method-panel="photo" hidden>',
          '<div class="photo-editor"><label class="field"><span>Choose a picture</span><input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp">',
          '<small>JPG, PNG or WebP, up to 8MB. Your image stays inside the family board.</small></label>',
          '<div id="photo-crop-tools" hidden><canvas id="profile-crop" width="256" height="256" aria-label="Preview of your cropped profile photo"></canvas>',
          '<label class="field"><span>Photo zoom</span><input type="range" id="profile-zoom" min="1" max="3" step=".05" value="1"></label></div>',
          '<p class="family-photo-tip">Select a new picture to change your photo. The square preview is saved after you press Save.</p>',
          '<p class="form-hint" id="profile-photo-status" role="status"></p></div>',
         '</div>',
         '<div class="avatar-method-pane" data-avatar-method-panel="initials" hidden>',
          '<p class="family-account-privacy">A simple, colorful badge using the first letters of your family name. You can always switch to a character later.</p>',
         '</div>',
        '</div>',
        '<div data-profile-pane="account" hidden>',
         '<div class="family-account-privacy">',

          '<label class="field"><span>Reading size</span><select name="textSize"><option value="standard"',draft.details.text_size==='standard'?' selected':'','>Standard</option>',
          '<option value="large"',draft.details.text_size==='large'?' selected':'','>Large</option></select></label>',
          '<label class="check-label"><input name="reduceMotion" type="checkbox" ',draft.details.reduce_motion?'checked':'','><span>Reduce animations</span></label>',
          '<p>Membership: <strong>',esc(ctx.state.member.status),'</strong>. Email stays private.</p>',
         '</div>',
         '<button type="button" class="text-button" data-auth="forgot">Reset my password ↗</button>',
         '<button type="button" class="text-button" data-signout-all>Log out on all devices</button>',
        '</div>',
        '<div class="profile-save-area">',
         '<label class="profile-publish"><input type="checkbox" name="published" aria-label="Share my avatar and profile with approved family" ',draft.published?'checked':'',
          '><span><b>Show my avatar and profile to approved family</b><small>Everyone in the family can see your character. Visitors cannot.</small></span></label>',
         '<button class="button-primary" type="submit">Save my changes</button>',
         '<p id="profile-save-status" class="form-message" role="status" hidden></p></div>',
       '</form></div>',
       '<aside class="studio-preview"><div class="preview-caption"><span>YOUR FAMILY PROFILE</span><span id="profile-completion"></span></div>',
        '<progress id="profile-meter" max="100" value="0"></progress>',
        '<div id="profile-live-preview">',card(draft,true),'</div>',
        '<p id="profile-visibility" class="privacy-notice"></p>',
        '<button type="button" class="text-button" data-copy-profile>Copy profile link</button>',
       '</aside>',
      '</div>'
    ].join('');
    ctx.showDialog(html,{allowUnapproved:true});
    document.getElementById('content-dialog').classList.add('profile-dialog');
    tabs();refresh();
    if(selectedTab==='avatar')void mountRewards(options);
  }
  function drawCrop(){if(!bitmap)return;const canvas=document.getElementById('profile-crop'),zoom=Number(document.getElementById('profile-zoom').value)||1,size=Math.min(bitmap.width,bitmap.height)/zoom,x=(bitmap.width-size)/2,y=(bitmap.height-size)/2;canvas.getContext('2d').drawImage(bitmap,x,y,size,size,0,0,256,256);avatarMethod='photo';avatarChanged=false;draft.avatar_mode='photo';const old=images.get('local-preview');if(old?.startsWith('blob:'))URL.revokeObjectURL(old);images.set('local-preview',canvas.toDataURL('image/webp',.85));draft.avatar_path='local-preview';photoChanged=true;refresh();}
  async function choosePhoto(file){if(!file)return;if(file.size>8*1024*1024)throw new Error('Choose a photo smaller than 8 MB.');const b=new Uint8Array(await file.slice(0,12).arrayBuffer());const valid=(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)||(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)||(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP');if(!valid)throw new Error('Choose a JPG, PNG or WebP photo.');bitmap?.close?.();bitmap=await createImageBitmap(file);if(bitmap.width>12000||bitmap.height>12000){bitmap.close();bitmap=null;throw new Error('Choose a photo under 12,000 pixels on either side.');}document.getElementById('profile-zoom').value='1';document.getElementById('photo-crop-tools').hidden=false;document.getElementById('profile-photo-status').textContent='Choose your crop with the zoom slider. Your original photo is not uploaded.';drawCrop();}
  async function save(form){
    const button=form.querySelector('[type=submit]'),status=document.getElementById('profile-save-status');
    if(button.disabled)return;
    button.disabled=true;status.hidden=false;status.classList.remove('success');
    status.textContent='Saving your family profile…';
    const account=ctx.state.member?.user_id,session=editorSession;
    const current=()=>account&&account===ctx.state.member?.user_id&&session===editorSession;
    let profileCommitted=false;
    try{
      draft=read(form);
      const owner=ctx.state.member.role==='owner',id=ctx.state.member.user_id;
      const name=owner?'Cowboy':displayName(draft.display_name);
      const prior=getOwn(),legacy=prior.details.avatar_recipe||null;
      const replaceAvatar=approved()&&(avatarChanged||photoChanged||selectedTab==='avatar');
      const character=replaceAvatar&&avatarMethod==='character';
      const nextRecipe=character?toLoadout(avatarRecipe):null;
      if(character){
        if(!rewards?.getData())throw new Error('Wait for your avatar options to load, or reopen the studio to retry.');
        if(Object.values(nextRecipe.cosmetics).some(item=>!rewards.have(item))){
          throw new Error('Remove the preview-only items before saving your avatar.');
        }
        if(Object.values(nextRecipe.cosmetics).some(id=>!fitsBody(nextRecipe,rewardModule.rewardById(id)))){
          throw new Error('Remove the items that do not fit this body before saving.');
        }
      }
      let path=prior.avatar_path,mode=prior.avatar_mode,blob=null;
      if(replaceAvatar&&avatarMethod==='photo'){
        mode='photo';
        if(photoChanged){
          const crop=form.querySelector('#profile-crop');
          path=legacy&&prior.avatar_path?id+(prior.avatar_path.endsWith('/avatar.png')?'/avatar.webp':'/avatar.png'):
            chosenPhoto||id+'/avatar.webp';
          blob=await new Promise(resolve=>crop.toBlob(resolve,path.endsWith('.png')?'image/png':'image/webp',.85));
          if(!blob||blob.size>131072)throw new Error('Choose a smaller or less detailed photo.');
        }else{
          path=chosenPhoto;
          if(!path)throw new Error('Choose a photo to use as your avatar.');
        }
      }else if(replaceAvatar&&avatarMethod==='initials'){
        mode='initials';path=null;
      }
      if(!current())return;
      const desired={...draft,avatar_path:path,avatar_mode:mode};
      const clean=validateProfile(desired,{userId:id,isOwner:owner});
      const original=validateProfile(prior,{userId:id,isOwner:owner});
      const removeLegacy=replaceAvatar&&!character&&Boolean(legacy);
      if(removeLegacy){
        clean.details.avatar_recipe=null;
        if(!prior.avatar_display&&revision===0){
          const backup=await rpc('community_avatar_equip',{p_recipe:null,p_expected:revision,p_fallback:legacy});
          if(!current())return;
          revision=Number(backup.revision)||0;
        }
      }
      if(blob){
        if(!ctx.isPreview){
          const {error}=await ctx.client().storage.from(AVATAR_BUCKET)
            .upload(path,blob,{contentType:blob.type,upsert:true,cacheControl:'60'});
          if(error)throw new Error('Your avatar could not upload. Please try again.');
        }
        const url=cacheAvatarPhoto(path,blob);
        if(url)images.set(path,url);
        chosenPhoto=path;
      }
      if(!current())return;
      if(blob||name!==prior.display_name||JSON.stringify(clean)!==JSON.stringify(original)){
        const result=await ctx.api('profile',{displayName:name,profile:clean});
        if(!current())return;
        ctx.state.member.display_name=result.display_name||name;
        ctx.state.profile={...prior,...clean,...result.profile,user_id:id,display_name:name};
        profileCommitted=true;
      }
      if(replaceAvatar){
        const result=await rpc('community_avatar_equip',{p_recipe:nextRecipe,
          p_publish:desired.published,p_expected:revision,p_fallback:removeLegacy?legacy:null});
        if(!current())return;
        revision=Number(result.revision)||0;
        savedRecipe=toLoadout(result.loadout||nextRecipe||savedRecipe);
        ctx.state.profile={...getOwn(),...result.profile};
      }
      const profile=ctx.state.profile||getOwn();
      forgetAvatarCharacter(id);
      characterURLs.delete(id);
      cache.set(id,profile);
      draft=getOwn();photoChanged=false;avatarChanged=false;
      undo=[];redo=[];
      status.classList.add('success');
      status.textContent=ctx.isPreview?'Preview saved locally for this session.':'Your changes are saved.';
      await imageURLs([draft]);
      if(!current())return;
      refresh();ctx.renderAccount();applyReader(profile.details);
      window.dispatchEvent(new CustomEvent('family-avatar-updated',{detail:{path:clean.avatar_path,user_id:id}}));
      rewards?.warm();ctx.onSaved?.();
    }catch(error){
      if(!current())return;
      if(error.code==='40001')void rewards?.refresh();
      status.textContent=(profileCommitted?'Profile details saved. Avatar update needs a retry. ':'')+
        (error.message||'Your profile could not save.');
    }finally{button.disabled=false;}
  }
  async function showMember(id){
    if(!id)return;
    if(!canPost(ctx.state.member)){
      ctx.toast('Approved membership is required to view shared profiles.');
      return;
    }
    await load([id]);
    if(!canPost(ctx.state.member))return;
    const p=cache.get(id);
    if(!p||(!ctx.isPreview&&id!==ctx.state.member?.user_id&&(!p.published||!p.account_active))){
      ctx.showDialog('<p class="eyebrow">Member profile</p><h2 id="content-title">A little privacy.</h2><p class="dialog-lead">This member has not shared a member profile. You can still read their published conversations.</p>');
      return;
    }
    const inspect=''; // Mystery Crew is the only character editor, opened through its own page.
    ctx.showDialog(`<h2 id="content-title" class="sr-only">${esc(p.display_name)}’s profile</h2>${card(p)}${inspect}
      <button class="button-quiet" data-member-posts="${esc(id)}">Published activity ↗</button>${id===ctx.state.member?.user_id?'<button class="button-primary" data-profile>Edit my profile ↗</button>':''}`);
    const dialog=document.getElementById('content-dialog');
    dialog.classList.add('member-dialog');
    memberView?.destroy();memberView=null;
    const panel=dialog.querySelector('.member-avatar-inspection');
    panel?.addEventListener('toggle',async ()=>{
      if(!panel.open){memberView?.stop();return;}
      if(memberView){memberView.draw();return;}
      const {studioCharacter,prepareStudioRenderer,releaseStudioArt}=await import('./avatar-studio-preview.mjs?v=workshop1');
      if(!panel.isConnected||!panel.open||!dialog.open||!canPost(ctx.state.member)||memberView)return;
      const stage=panel.querySelector('[data-avatar-turntable]');
      const canvas=stage.querySelector('canvas');
      const mounted=mountTurntable(stage,(camera,t)=>studioCharacter(canvas,p.avatar_display,camera,t),
        ()=>Boolean(ctx.state.profile?.details?.reduce_motion));
      memberView={...mounted,destroy(){mounted.destroy();releaseStudioArt(canvas);}};
      void prepareStudioRenderer().then(()=>{if(panel.isConnected&&panel.open&&dialog.open)memberView?.draw();});
    });
    if(!ctx.isPreview&&ctx.client()){
      const {data}=await ctx.client().from('community_badges').select('badge,reason').eq('user_id',id).limit(12);
      if(data?.length&&(!panel||panel.isConnected)){
        const section=document.createElement('section');section.className='lab-recognition';
        section.innerHTML='<h3>A little recognition.</h3>'+data.map(b=>'<details><summary>'+esc(b.badge)+'</summary><p>'+esc(b.reason)+'</p></details>').join('');
        document.getElementById('dialog-content').append(section);
      }
    }
    await ctx.onMemberShown?.(id);
    void import('./commons-mahjong-profile.mjs?v=pause3').then(m=>m.showAchievements(ctx,id)).catch(()=>{});
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button');
    if(!b)return;
    try{
      if(b.hasAttribute('data-member-profile'))await showMember(b.dataset.memberProfile);
      else if(b.hasAttribute('data-profile-tab')){
        if(b.dataset.profileTab==='avatar'&&!ctx.isPreview&&approved()){
          location.assign(new URL('./mystery-crew-creator.html',location.href).href);
          return;
        }
        selectedTab=b.dataset.profileTab;
        if(selectedTab==='avatar'){
          if(!avatarChanged&&!photoChanged)avatarMethod='character';
          void mountRewards();
        }
        tabs();refresh();
      }else if(b.hasAttribute('data-back-to-profile')){
        selectedTab='profile';tabs();refresh();
        document.querySelector('[data-profile-tab="profile"]')?.focus();
      }else if(b.hasAttribute('data-avatar-method')){
        avatarMethod=b.dataset.avatarMethod;avatarChanged=true;photoChanged=false;
        if(avatarMethod==='photo'&&!chosenPhoto){
          const profile=ctx.state.profile;
          const id=ctx.state.member.user_id;
          const candidates=profile?.details?.avatar_recipe&&profile.avatar_path?
            [id+(profile.avatar_path.endsWith('/avatar.png')?'/avatar.webp':'/avatar.png')]:
            [profile?.avatar_path,id+'/avatar.webp',id+'/avatar.png'].filter(Boolean);
          for(const source of new Set(candidates)){
            if(ctx.isPreview||avatarMethod!=='photo'||id!==ctx.state.member?.user_id)break;
            const image=await getAvatarPhoto(ctx.client(),source);
            if(image&&avatarMethod==='photo'&&id===ctx.state.member?.user_id){
              images.set(source,image);chosenPhoto=source;break;
            }
          }
        }
        refresh();
      }else if(b.hasAttribute('data-avatar-body')){
        const key=b.dataset.avatarBody,value=b.dataset.avatarValue;
        const preset=key==='model'&&SHOWROOM_LOOKS[value];
        const next=preset?{...DEFAULT_AVATAR_RECIPE,...starterBody(DEFAULT_AVATAR_RECIPE,value),...preset,cosmetics:avatarRecipe.cosmetics}:
          {...avatarRecipe,full_body:{...normalizeBody(avatarRecipe),[key]:value}};
        setPreview(next);
      }else if(b.hasAttribute('data-avatar-feature')){
        setPreview({...avatarRecipe,[b.dataset.avatarFeature]:b.dataset.avatarValue});
      }else if(b.hasAttribute('data-avatar-random')){
        setPreview({...randomAvatarRecipe(),full_body:avatarRecipe.full_body,cosmetics:avatarRecipe.cosmetics});
      }else if(b.hasAttribute('data-avatar-undo')){
        moveAvatarHistory('undo');
      }else if(b.hasAttribute('data-avatar-redo')){
        moveAvatarHistory('redo');
      }else if(b.hasAttribute('data-avatar-reset')){
        setPreview(savedRecipe||DEFAULT_AVATAR_RECIPE);
        setStatus('Restored your saved character.');
      }else if(b.hasAttribute('data-copy-profile')){
        const url=new URL('community.html',location.href);
        url.searchParams.set('member',ctx.state.member.user_id);
        if(ctx.isPreview)url.searchParams.set('preview','1');
        await navigator.clipboard.writeText(url.href);
        ctx.toast('Profile link copied. Only approved family members can view it.');
      }
    }catch(error){ctx.toast(error.message);}
  });
  document.addEventListener('keydown',e=>{
    // Leave native text undo alone. Shortcuts apply only while editing a character.
    if((e.ctrlKey||e.metaKey)&&!e.altKey&&selectedTab==='avatar'&&avatarMethod==='character'&&
      document.getElementById('content-dialog')?.open&&e.target.closest('#content-dialog')&&
      !e.target.closest('input,textarea,select,[contenteditable]')){
      const key=e.key.toLowerCase();
      const direction=key==='z'&&!e.shiftKey?'undo':
        (key==='y'||key==='z'&&e.shiftKey)?'redo':null;
      if(direction){
        e.preventDefault();
        moveAvatarHistory(direction);
        return;
      }
    }
    const settings=e.target.closest('.studio-profile-settings[open]');
    if(e.key==='Escape'&&settings){
      e.preventDefault();
      settings.open=false;
      settings.querySelector('summary').focus();
    }
    const b=e.target.closest('[data-profile-tab]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const all=[...document.querySelectorAll('[data-profile-tab]')],index=all.indexOf(b),next=e.key==='Home'?0:e.key==='End'?all.length-1:(index+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;all[next].click();all[next].focus();});
  document.addEventListener('input',e=>{
    const input=e.target,sculpt=input.dataset.studioSculpt;
    if(input.hasAttribute('data-studio-share')){
      input.form.elements.published.checked=input.checked;
      refresh();
    }else if(input.id==='profile-zoom')drawCrop();
    else if(sculpt&&approved()&&input.closest('#profile-studio-form')){
      setPreview({...avatarRecipe,full_body:{...normalizeBody(avatarRecipe),[sculpt]:input.value}},sculpting!==input);
      sculpting=input;
    }else if(input.closest('#profile-studio-form'))refresh();
  });
  document.addEventListener('change',async e=>{
    if(e.target.dataset.studioSculpt)sculpting=null;
    if(e.target.id==='profile-photo')try{await choosePhoto(e.target.files[0]);}catch(error){document.getElementById('profile-photo-status').textContent=error.message;}
  });
  document.addEventListener('submit',e=>{if(e.target.id==='profile-studio-form'){e.preventDefault();save(e.target);}});
  document.getElementById('content-dialog').addEventListener('close',()=>{
    if(!document.getElementById('content-dialog').open){
      activeCelebration?.remove();activeCelebration=null;
      rewards?.detach();
      memberView?.destroy();memberView=null;
    }
  });
  document.addEventListener('family-game-progress',()=>{
    if(!approved()||ctx.isPreview)return;
    const member=ctx.state.member.user_id;
    clearTimeout(warmTimer);
    warmTimer=setTimeout(()=>{
      void ensureRewards().then(studio=>studio?.refresh()).then(()=>{
        if(member===ctx.state.member?.user_id)renderCelebration();
      }).catch(()=>{});
    },700);
  });
  function clear(){
    memberView?.destroy();memberView=null;
    ++editorSession;clearTimeout(warmTimer);stopTrip?.();stopWait?.();stopTrip=stopWait=null;
    ownerId=null;revision=0;previewRPC=null;chosenPhoto=null;draft=null;avatarRecipe=savedRecipe=null;
    previewImage='';undo=[];redo=[];rewards?.clear();
    activeCelebration?.remove();activeCelebration=null;
    bitmap?.close?.();bitmap=null;
    cache.clear();mysteryPortraits.clear();images.clear();characterURLs.clear();clearAvatarPhotos();clearAvatarCharacters();
  }
  async function setOwn(p){
    if(!p)return;
    if(ownerId&&ownerId!==p.user_id)clear();
    ownerId=p.user_id;
    if(approved()&&!ctx.isPreview&&ctx.client()){
      const {data,error}=await ctx.client().rpc('community_mystery_crew_portraits',{p_members:[p.user_id]});
      if(p.user_id!==ctx.state.member?.user_id)return;
      if(!error&&data?.[0])mysteryPortraits.set(p.user_id,data[0].crew_character);
    }
    cache.set(p.user_id,{...p,avatar_display:null});
    applyReader(p.details);
  }
  return {show,showMember,load,author,avatar,cache,clear,setOwn,applyReader};
}
