import {escapeHTML as esc,initials,renderBody,displayName,safeHttps,canPost} from './community-core.mjs';
import {DETAIL_DEFAULTS,validateDetails,forumBody,draftKey} from './forum-core.mjs?v=powers1';
import {attachDraft} from './forum-drafts.mjs';
import {PROFILE_THEMES,PROFILE_COVERS,PROFILE_ICONS,PROFILE_FIELDS,PROFILE_DEFAULTS,AVATAR_BUCKET,validateProfile,profileCompletion} from './profile-core.mjs?v=powers1';
import {getAvatarPhoto,cacheAvatarPhoto,clearAvatarPhotos} from './family-avatar-cache.mjs?v=stable1';
import {AVATAR_OPTIONS,DEFAULT_AVATAR_RECIPE,normalizeAvatarRecipe,drawFamilyAvatar,makeAvatarStudioHTML,randomAvatarRecipe} from './family-avatar-builder.mjs?v=studio1';

export function createProfileStudio(ctx){
  const cache=new Map(),images=new Map();let bitmap=null,draft=null,photoChanged=false,selectedTab='profile',profileDraft=null,avatarRecipe=null,avatarMethod='photo',avatarChanged=false;
  const icon=p=>PROFILE_ICONS.find(i=>i.id===p?.avatar_icon)?.symbol||'◈';
  const getOwn=()=>({...PROFILE_DEFAULTS,...ctx.state.profile,details:{...DETAIL_DEFAULTS,...ctx.state.profile?.details},user_id:ctx.state.member?.user_id,display_name:ctx.state.member?.display_name||'Your name',badge:ctx.state.member?.role==='owner'?'Owner':null});
  function avatar(p,size=''){const src=images.get(p?.avatar_path);return `<span class="avatar profile-avatar frame-${esc(p?.details?.frame||'plain')} ${size} theme-${esc(p?.theme||'forest')}" aria-hidden="true">${p?.avatar_mode==='photo'&&src?`<img src="${esc(src)}" alt="" width="96" height="96">`:p?.avatar_mode==='icon'?esc(icon(p)):esc(initials(p?.display_name))}</span>`;}
  function author(id,name,edward=false){const p=cache.get(id);return edward?`<span class="avatar edward-small" aria-hidden="true">E</span><b>Edward</b>`:`<button type="button" class="member-author" data-member-profile="${esc(id||'')}" ${id?'':'disabled'} aria-label="View ${esc(name)}’s profile">${avatar(p||{display_name:name})}<span>${esc(name)}${p?.details?.share_about&&p.details.title?`<small class="author-title">${esc(p.details.title)}</small>`:''}</span>${p?.badge?'<span class="profile-badge">Owner</span>':''}</button>`;}
  async function imageURLs(profiles){
    const paths=[...new Set(profiles.filter(p=>p?.avatar_mode==='photo'&&p.avatar_path).map(p=>p.avatar_path))];
    // Download to a session-local blob URL. No expiring signed link means no
    // alternating photos/initials during scoreboard and post refreshes.
    const urls=await Promise.all(paths.map(async path=>[path,await getAvatarPhoto(ctx.client(),path)]));
    for(const [path,url] of urls)if(url)images.set(path,url);
  }
  async function load(ids){const unique=[...new Set(ids.filter(Boolean))].slice(0,100);if(ctx.isPreview){for(const id of unique)if(!cache.has(id))cache.set(id,{...PROFILE_DEFAULTS,user_id:id,display_name:'Example maker',headline:'Curious by nature. Maker by habit.',bio:'Here for practical ideas, good tools, and the occasional rabbit hole.',interests:['Making','Good finds','Learning'],theme:'copper',cover:'sunburst',avatar_mode:'icon',avatar_icon:'hammer',published:true,account_active:true});return;}
    if(!ctx.client()||!unique.length)return;const {data,error}=await ctx.client().from('community_profiles').select(PROFILE_FIELDS).in('user_id',unique);if(error)return;for(const id of unique)cache.delete(id);for(const p of data||[])cache.set(p.user_id,p);await imageURLs(data||[]);
  }
  function card(p,editor=false){const links=[...(p.website?[{label:'My website',url:p.website}]:[]),...(p.links||[])].filter(l=>safeHttps(l.url)).map(l=>({...l,url:safeHttps(l.url)}));return `<article class="member-card theme-${esc(p.theme)} layout-${esc(p.details?.layout||'classic')}"><div class="profile-cover cover-${esc(p.cover)}"><span class="cover-mark" aria-hidden="true">✳</span><span class="cover-caption">THE COMMONS / ${p.badge?'COWBOY’S CORNER':'MEMBER FIELD NOTES'}</span></div><div class="member-card-body">${avatar(p,'avatar-large')}<div class="profile-heading"><h3>${esc(p.display_name)}</h3>${p.badge?'<span class="profile-badge">Owner</span>':''}</div>${p.handle?`<p class="profile-handle">@${esc(p.handle)}</p>`:''}<p class="profile-headline">${esc(p.headline||'A little curious. In good company.')}</p>${p.location?`<p class="profile-location">⌖ ${esc(p.location)}</p>`:''}${p.bio?`<div class="profile-bio">${renderBody(p.bio)}</div>`:'<p class="profile-placeholder">A little about you goes here.</p>'}${extrasCard(p)}<div class="profile-interests">${(p.interests||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div>${links.length?`<div class="profile-links">${links.map(link=>`<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)} ↗</a>`).join('')}</div>`:''}<p class="profile-card-foot">${editor?'YOUR LIVE PREVIEW':p.joined_at?'IN GOOD COMPANY SINCE '+new Date(p.joined_at).getFullYear():'COME CURIOUS. LEAVE INSPIRED.'}</p></div></article>`;}
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
      details:{...draft.details,avatar_recipe:avatarMethod==='character'?avatarRecipe:null,
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
    const canvas=document.getElementById('family-avatar-canvas');
    if(canvas){
      drawFamilyAvatar(canvas,avatarRecipe);
      if(avatarMethod==='character'&&avatarChanged){
        images.set('local-preview',canvas.toDataURL('image/png'));
        draft.avatar_mode='photo';
        draft.avatar_path='local-preview';
      }
    }
    if(avatarMethod==='initials'){
      draft.avatar_mode='initials';draft.avatar_path=null;
    }
    const preview=document.getElementById('profile-live-preview');
    if(preview)preview.innerHTML=card(draft,true);
    const completion=document.getElementById('profile-completion');
    if(completion)completion.textContent=profileCompletion(draft)+'% of your story';
    const progress=document.getElementById('profile-meter');
    if(progress)progress.value=profileCompletion(draft);
    const vis=document.getElementById('profile-visibility');
    if(vis)vis.textContent=draft.published?'Visible to approved family members when saved':'Private profile';
    const save=document.querySelector('#profile-studio-form button[type="submit"]');
    if(save)save.textContent=selectedTab==='avatar'?'Save my avatar':'Save my changes';
  }
  function tabs(){document.querySelectorAll('[data-profile-pane]').forEach(p=>p.hidden=p.dataset.profilePane!==selectedTab);document.querySelectorAll('[data-profile-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.profileTab===selectedTab)));}
  function field(label,name,value,max,extra=''){return `<label class="field"><span>${label}</span><input name="${name}" value="${esc(value||'')}" maxlength="${max}" ${extra}></label>`;}
  async function show(requested='profile'){
    if(!ctx.state.member)return;
    selectedTab=requested==='avatar'?'avatar':requested==='account'?'account':'profile';
    draft=getOwn();
    avatarRecipe=normalizeAvatarRecipe(draft.details.avatar_recipe);
    avatarMethod=draft.avatar_mode==='photo'?(draft.details.avatar_recipe?'character':'photo'):(requested==='avatar'?'character':'initials');
    avatarChanged=avatarMethod==='character'&&!draft.details.avatar_recipe;
    photoChanged=false;
    bitmap?.close?.();bitmap=null;
    await imageURLs([draft]);
    const readonly=ctx.state.member.role==='owner'?'readonly':'';
    const html=[
      '<p class="eyebrow">FAMILY MESSAGE BOARD · YOUR SPACE</p>',
      '<h2 id="content-title">Your family profile</h2>',
      '<p class="dialog-lead">Make an avatar, share a little about yourself, and save your favorite look.</p>',
      ctx.isPreview?'<div class="preview-message">Design preview. Nothing is saved to the live board.</div>':'',
      '<div class="profile-studio">',
       '<div class="profile-form-column"><form id="profile-studio-form">',
        '<div class="studio-tabs" role="tablist" aria-label="Profile customization">',
         '<button type="button" role="tab" data-profile-tab="profile" aria-selected="',selectedTab==='profile','">My Profile</button>',
         '<button type="button" role="tab" data-profile-tab="avatar" aria-selected="',selectedTab==='avatar','">Make an Avatar</button>',
         '<button type="button" role="tab" data-profile-tab="account" aria-selected="',selectedTab==='account','">Privacy & Account</button>',
        '</div>',
        '<div data-profile-pane="profile">',
         field('Your name','displayName',draft.display_name,36,'minlength="2" required '+readonly),
         field('A little about you','headline',draft.headline,80,'placeholder="I love games, art and family time"'),
         '<label class="field"><span>Your story (optional)</span><textarea name="bio" maxlength="600" rows="3" placeholder="What do you enjoy doing?">',esc(draft.bio||''),'</textarea></label>',
         field('Favorite things (optional, comma-separated)','interests',(draft.interests||[]).join(', '),220,'placeholder="Art, Animals, Games"'),
         '<p class="family-account-privacy">Your profile is only available to approved family members when you choose to share it. You never need to provide your address or birthday.</p>',
        '</div>',
        '<div data-profile-pane="avatar" hidden>',
         '<p class="family-avatar-summary">Choose how you want to appear in family games and messages.</p>',
         '<div class="family-avatar-methods" role="group" aria-label="Avatar type">',
          '<button type="button" data-avatar-method="character" aria-pressed="false">🎨 Build a character</button>',
          '<button type="button" data-avatar-method="photo" aria-pressed="false">📷 Use a photo</button>',
          '<button type="button" data-avatar-method="initials" aria-pressed="false">🔤 My initials</button>',
         '</div>',
         '<div class="avatar-method-pane" data-avatar-method-panel="character">',makeAvatarStudioHTML(avatarRecipe),'</div>',
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
          '<label class="profile-publish"><input type="checkbox" name="published" ',draft.published?'checked':'','><span><b>Share my profile with approved family</b><small>Signed-out visitors cannot view it.</small></span></label>',
          '<label class="field"><span>Reading size</span><select name="textSize"><option value="standard"',draft.details.text_size==='standard'?' selected':'','>Standard</option>',
          '<option value="large"',draft.details.text_size==='large'?' selected':'','>Large</option></select></label>',
          '<label class="check-label"><input name="reduceMotion" type="checkbox" ',draft.details.reduce_motion?'checked':'','><span>Reduce animations</span></label>',
          '<p>Membership: <strong>',esc(ctx.state.member.status),'</strong>. Email stays private.</p>',
         '</div>',
         '<button type="button" class="text-button" data-auth="forgot">Reset my password ↗</button>',
         '<button type="button" class="text-button" data-signout-all>Log out on all devices</button>',
        '</div>',
        '<div class="profile-save-area"><button class="button-primary" type="submit">Save my changes</button>',
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
  }
  function drawCrop(){if(!bitmap)return;const canvas=document.getElementById('profile-crop'),zoom=Number(document.getElementById('profile-zoom').value)||1,size=Math.min(bitmap.width,bitmap.height)/zoom,x=(bitmap.width-size)/2,y=(bitmap.height-size)/2;canvas.getContext('2d').drawImage(bitmap,x,y,size,size,0,0,256,256);avatarMethod='photo';avatarChanged=false;draft.avatar_mode='photo';const old=images.get('local-preview');if(old?.startsWith('blob:'))URL.revokeObjectURL(old);images.set('local-preview',canvas.toDataURL('image/webp',.85));draft.avatar_path='local-preview';photoChanged=true;refresh();}
  async function choosePhoto(file){if(!file)return;if(file.size>8*1024*1024)throw new Error('Choose a photo smaller than 8 MB.');const b=new Uint8Array(await file.slice(0,12).arrayBuffer());const valid=(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)||(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)||(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP');if(!valid)throw new Error('Choose a JPG, PNG or WebP photo.');bitmap?.close?.();bitmap=await createImageBitmap(file);if(bitmap.width>12000||bitmap.height>12000){bitmap.close();bitmap=null;throw new Error('Choose a photo under 12,000 pixels on either side.');}document.getElementById('profile-zoom').value='1';document.getElementById('photo-crop-tools').hidden=false;document.getElementById('profile-photo-status').textContent='Choose your crop with the zoom slider. Your original photo is not uploaded.';drawCrop();}
  async function save(form){
    const button=form.querySelector('[type=submit]'),status=document.getElementById('profile-save-status');
    button.disabled=true;status.hidden=false;status.classList.remove('success');
    status.textContent='Saving your family profile…';
    try{
      draft=read(form);
      const owner=ctx.state.member.role==='owner',id=ctx.state.member.user_id;
      const name=owner?'Cowboy':displayName(draft.display_name);
      let path=draft.avatar_path;
      let blob=null;
      if(avatarMethod==='character'&&avatarChanged){
        const canvas=document.getElementById('family-avatar-canvas');
        blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        const prior=ctx.state.profile;
        // Keep an existing uploaded portrait rather than replacing it when
        // a family member starts drawing a new character.
        path=prior?.details?.avatar_recipe && prior.avatar_path
          ? prior.avatar_path
          : id+(prior?.avatar_path?.endsWith('/avatar.png')?'/avatar.webp':'/avatar.png');
      }else if(avatarMethod==='photo'&&photoChanged){
        const canvas=document.getElementById('profile-crop');
        blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.85));
        path=id+'/avatar.webp';
      }else if(avatarMethod==='initials'){
        draft.avatar_mode='initials';path=null;
      }else if(avatarMethod==='photo'&&ctx.state.profile?.details?.avatar_recipe){
        const stored=id+'/avatar.webp';
        const original=await getAvatarPhoto(ctx.client(),stored);
        if(!original)throw new Error('Choose a photo to switch from your custom character.');
        path=stored;draft.avatar_mode='photo';
      }
      if(blob){
        if(blob.size>131072)throw new Error('This image is too large. Please simplify it.');
        if(!ctx.isPreview){
          const {error}=await ctx.client().storage.from(AVATAR_BUCKET)
            .upload(path,blob,{contentType:blob.type,upsert:true,cacheControl:'60'});
          if(error)throw new Error('Your avatar could not upload. Please try again.');
        }
        const url=cacheAvatarPhoto(path,blob);
        if(url)images.set(path,url);
        draft.avatar_mode='photo';
      }
      draft.avatar_path=path;
      if(avatarMethod==='character')draft.avatar_mode='photo';
      const clean=validateProfile(draft,{userId:id,isOwner:owner});
      const result=await ctx.api('profile',{displayName:name,profile:clean});
      profileDraft?.clear();
      ctx.state.member.display_name=result.display_name||name;
      ctx.state.profile=result.profile||{...clean,user_id:id,display_name:name};
      cache.set(id,ctx.state.profile);
      draft=getOwn();photoChanged=false;avatarChanged=false;
      await imageURLs([draft]);
      refresh();
      ctx.renderAccount();
      applyReader(ctx.state.profile?.details);
      status.classList.add('success');
      status.textContent=ctx.isPreview?'Preview saved locally for this session.':
        'Saved! Your family avatar and profile are updated.';
      window.dispatchEvent(new CustomEvent('family-avatar-updated',{detail:{path:clean.avatar_path,user_id:id}}));
      ctx.onSaved?.();
    }catch(error){
      status.classList.remove('success');
      status.textContent=error.message||'Your profile could not save.';
    }finally{button.disabled=false;}
  }
  async function showMember(id){if(!id)return;if(!canPost(ctx.state.member)){ctx.toast('Approved membership is required to view shared profiles.');return;}await load([id]);if(!canPost(ctx.state.member))return;const p=cache.get(id);if(!p||(!ctx.isPreview&&id!==ctx.state.member?.user_id&&(!p.published||!p.account_active))){ctx.showDialog('<p class="eyebrow">Member profile</p><h2 id="content-title">A little privacy.</h2><p class="dialog-lead">This member has not shared a member profile. You can still read their published conversations.</p>');return;}ctx.showDialog(`<h2 id="content-title" class="sr-only">${esc(p.display_name)}’s profile</h2>${card(p)}<button class="button-quiet" data-member-posts="${esc(id)}">Published activity ↗</button>${id===ctx.state.member?.user_id?'<button class="button-primary" data-profile>Edit my profile ↗</button>':''}`);document.getElementById('content-dialog').classList.add('member-dialog');if(!ctx.isPreview&&ctx.client()){const {data}=await ctx.client().from('community_badges').select('badge,reason').eq('user_id',id).limit(12);if(data?.length){const section=document.createElement('section');section.className='lab-recognition';section.innerHTML='<h3>A little recognition.</h3>'+data.map(b=>'<details><summary>'+esc(b.badge)+'</summary><p>'+esc(b.reason)+'</p></details>').join('');document.getElementById('dialog-content').append(section);}}await ctx.onMemberShown?.(id);void import('./commons-mahjong-profile.mjs?v=pause3').then(m=>m.showAchievements(ctx,id)).catch(()=>{});}
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button');
    if(!b)return;
    try{
      if(b.hasAttribute('data-member-profile'))await showMember(b.dataset.memberProfile);
      else if(b.hasAttribute('data-profile-tab')){
        selectedTab=b.dataset.profileTab;tabs();refresh();
      }else if(b.hasAttribute('data-avatar-method')){
        avatarMethod=b.dataset.avatarMethod;
        avatarChanged=avatarMethod==='character';
        photoChanged=false;
        if(avatarMethod==='initials'){draft.avatar_mode='initials';draft.avatar_path=null;}
        else if(avatarMethod==='photo'){
          draft.avatar_mode='photo';
          draft.avatar_path=ctx.state.profile?.avatar_path||null;
        }
        refresh();
      }else if(b.hasAttribute('data-avatar-feature')){
        avatarRecipe={...avatarRecipe,[b.dataset.avatarFeature]:b.dataset.avatarValue};
        avatarMethod='character';avatarChanged=true;
        refresh();
      }else if(b.hasAttribute('data-avatar-random')){
        avatarRecipe=randomAvatarRecipe();
        avatarMethod='character';avatarChanged=true;refresh();
      }else if(b.hasAttribute('data-copy-profile')){
        const url=new URL('community.html',location.href);
        url.searchParams.set('member',ctx.state.member.user_id);
        if(ctx.isPreview)url.searchParams.set('preview','1');
        await navigator.clipboard.writeText(url.href);
        ctx.toast('Profile link copied. Only approved family members can view it.');
      }
    }catch(error){ctx.toast(error.message);}
  });
  document.addEventListener('keydown',e=>{const b=e.target.closest('[data-profile-tab]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const all=[...document.querySelectorAll('[data-profile-tab]')],index=all.indexOf(b),next=e.key==='Home'?0:e.key==='End'?all.length-1:(index+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;all[next].click();all[next].focus();});
  document.addEventListener('input',e=>{if(e.target.id==='profile-zoom')drawCrop();else if(e.target.closest('#profile-studio-form'))refresh();});
  document.addEventListener('change',async e=>{if(e.target.id==='profile-photo')try{await choosePhoto(e.target.files[0]);}catch(error){document.getElementById('profile-photo-status').textContent=error.message;}});
  document.addEventListener('submit',e=>{if(e.target.id==='profile-studio-form'){e.preventDefault();save(e.target);}});
  return {show,showMember,load,author,avatar,cache,clear:()=>{cache.clear();images.clear();clearAvatarPhotos();},setOwn:async p=>{if(p)cache.set(p.user_id,p);await imageURLs(p?[p]:[]);applyReader(p?.details);},applyReader};
}
