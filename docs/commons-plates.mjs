/* Ana + Cowboy's private license-plate interpretation game, Commons only. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const board=document.getElementById('conversations');
const config=window.COWBOY_COMMUNITY_CONFIG;
if(board&&config?.enabled===true&&location.pathname.endsWith('community.html')){
 let client=null,userId=null,seat=null,game=null,working=false,expanded=false,timer=null,mounted=false;
 const urls=new Map();
 const $=id=>document.getElementById(id);
 const newEl=(tag,cls='',txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el;};
 const pill=(txt)=>newEl('span','plate-pill',txt);
 const setStatus=(txt)=>{if($('plate-status'))$('plate-status').textContent=txt;};
 const clean=()=>{for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();};
 const nameFor=who=>who==='ana'?'Ana':'Cowboy';
 const dateFor=stamp=>{try{return new Date(stamp).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});}catch{return '';}};
 const googleLink=(plate,region)=>'https://www.google.com/search?q='+encodeURIComponent('"'+plate+'" personalized vanity license plate meaning '+region);
 const designLink=region=>'https://www.google.com/search?q='+encodeURIComponent(region+' official DMV license plate designs personalized plate');
 function frame(){
  if($('plate-game-root'))return;
  const main=board.querySelector('.community-main');if(!main)return;
  const root=newEl('section','plate-game');root.id='plate-game-root';
  root.innerHTML=`<button type="button" class="plate-entry-button" id="plate-game-open" aria-expanded="false" aria-controls="plate-game-content"><span class="plate-entry-icon" aria-hidden="true">📸</span><span><strong>Our License Plate Game</strong><small id="plate-top-score">Ana 33 · Cowboy 19</small></span><span class="plate-expand" aria-hidden="true">▾</span></button>
    <div id="plate-game-content" hidden><section class="commons-score-ribbon" aria-label="Live license plate scores" aria-live="polite">
      <div class="commons-score-tile is-record"><span class="commons-score-label">LEADING TOTAL</span><strong id="plate-ribbon-lead">…</strong><small id="plate-ribbon-holder">Top player · cumulative points</small></div>
      <div class="commons-score-tile is-personal"><span class="commons-score-label">YOUR TOTAL</span><strong id="plate-ribbon-mine">…</strong><small>Approved plates and starting points</small></div>
      <div class="commons-score-tile is-live"><span class="commons-score-label">POINTS BEHIND</span><strong id="plate-ribbon-gap">…</strong><small id="plate-ribbon-gap-caption">Distance from first place</small></div>
     </section><div class="plate-heading"><div><span class="plate-eyebrow">Private match · Ana vs. Cowboy</span><h2>What Does That Plate Mean?</h2><p>Find a custom plate. Snap a picture. Make your case. The other player decides.</p></div><div class="plate-score" id="plate-score" aria-live="polite"></div></div>
    <div class="plate-rules">👍 Agree = one point for the person who guessed. 👎 Disagree = explain why; the guesser can revise and you vote again. One point maximum per photo.</div>
    <form id="plate-new" class="plate-new"><h3>📷 Post a plate</h3><div class="plate-fields"><label>Photo <input id="plate-photo" type="file" accept="image/*" required></label><label>Characters on the plate <input id="plate-characters" type="text" maxlength="18" placeholder="e.g. ODIN1" autocomplete="off" required></label><label>State / region <input id="plate-region" type="text" maxlength="60" placeholder="e.g. Virginia"></label></div><label>What do you think it means? <textarea id="plate-guess" rows="2" maxlength="600" placeholder="My best argument is…" required></textarea></label><p class="plate-hint">Crop out people, house numbers and other unnecessary details. Photos are resized and their original metadata is removed before upload.</p><button class="plate-button" type="submit" id="plate-submit">Post challenge</button></form>
    <div class="plate-list-header"><h3>Our plate debates</h3><button type="button" class="plate-button secondary" id="plate-refresh">Refresh</button></div><div id="plate-status" role="status" aria-live="polite"></div><div id="plate-list"></div>
    <p class="plate-hint">Research links search public plate designs and possible meanings, not the registered owner's identity. Only Ana and Cowboy can view these photos in the game.</p></div>`;
  main.prepend(root);
  $('plate-game-open').addEventListener('click',()=>{expanded=!expanded;$('plate-game-content').hidden=!expanded;$('plate-game-open').setAttribute('aria-expanded',String(expanded));if(expanded){refresh();$('plate-game-content').scrollIntoView({block:'nearest',behavior:'smooth'});}});
  $('plate-new').addEventListener('submit',post);$('plate-submit').before($('plate-status'));$('plate-photo').addEventListener('change',()=>{const f=$('plate-photo').files?.[0];if(f)setStatus(`Photo selected (${(f.size/1048576).toFixed(1)} MB). Add the guess and tap Post challenge.`);});
  $('plate-refresh').addEventListener('click',()=>refresh());
 }
 function scores(){
  const players=game?.players||[];const ana=players.find(p=>p.seat==='ana');const cowboy=players.find(p=>p.seat==='cowboy');
  $('plate-top-score').textContent=`Ana ${ana?.total??33} · Cowboy ${cowboy?.total??19}`;
  const valid=players.filter(p=>Number.isFinite(Number(p.total)));
  const highest=valid.length?Math.max(...valid.map(p=>Number(p.total))):0;
  const leaders=valid.filter(p=>Number(p.total)===highest);
  const mine=players.find(p=>p.seat===seat);
  const personal=Number(mine?.total||0);
  if(mine&&leaders.length){$('plate-top-score').textContent=`Leader ${leaders.length>1?'Tied':nameFor(leaders[0].seat)} ${highest.toLocaleString('en-US')} · Yours ${personal.toLocaleString('en-US')}`;}
  $('plate-ribbon-lead').textContent=highest.toLocaleString('en-US');
  $('plate-ribbon-holder').textContent=leaders.length>1?'Tied lead · cumulative points':leaders.length?`${nameFor(leaders[0].seat)} leads · cumulative points`:'No scores available';
  $('plate-ribbon-mine').textContent=mine?personal.toLocaleString('en-US'):'—';
  const gap=Math.max(0,highest-personal);
  $('plate-ribbon-gap').textContent=mine?gap.toLocaleString('en-US'):'—';
  $('plate-ribbon-gap-caption').textContent=mine?(gap===0?'You are tied for first or leading':'Points to catch the leader'):'Your account is not a plate player';
  const div=$('plate-score');div.replaceChildren();
  for(const [who,score] of [['ana',ana?.total??33],['cowboy',cowboy?.total??19]]){
   const n=newEl('div','plate-scorecard');n.append(newEl('span','',nameFor(who)),newEl('strong','',score));div.append(n);
  }
 }
 function button(label,fn,style=''){
  const b=newEl('button','plate-button '+style,label);b.type='button';b.addEventListener('click',fn);return b;
 }
 function ptext(value,cls=''){return newEl('p',cls,value);}
 function labelText(text){return newEl('strong','',text);}
 async function picture(img,path){
  if(!client)return;
  let src=urls.get(path);
  if(!src){const {data,error}=await client.storage.from('community-plate-game').download(path);if(error)throw error;src=URL.createObjectURL(data);urls.set(path,src);}
  if(img.isConnected)img.src=src;
 }
 function reviewPhoto(img,caption){
  if(!img.src||!img.complete||!img.naturalWidth){setStatus('Photo is still loading. Please retry shortly.');return;}
  const dialog=newEl('dialog','plate-photo-dialog');dialog.id='plate-photo-viewer';
  dialog.setAttribute('aria-label','Full-size license plate photograph');
  const close=button('Close photo ✕',()=>dialog.close(),'secondary');close.classList.add('plate-photo-close');
  const full=newEl('img','plate-photo-full');full.alt=img.alt;full.src=img.src;
  dialog.append(close,full,ptext(caption,'plate-photo-caption'));
  document.body.append(dialog);
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.showModal();
 }
 function display(){
  scores();const list=$('plate-list');list.replaceChildren();
  const entries=game?.entries||[];
  if(!entries.length){list.append(ptext('No photos yet. First plate gets the first debate!','plate-empty'));return;}
  for(const entry of entries){
   const own=entry.seat===seat;
   const card=newEl('article','plate-card');
   const head=newEl('div','plate-card-head');
   const by=newEl('div','plate-by');by.append(labelText(nameFor(entry.seat)),pill(dateFor(entry.created_at)));
   const status=entry.status==='approved'?'👍 Approved · +1':entry.status==='needs_revision'?'👎 Explanation needed':'Awaiting vote';
   head.append(by,pill(status));card.append(head);
   const img=newEl('img','plate-photo');img.alt='License plate challenge posted by '+nameFor(entry.seat);img.loading='lazy';
   const preview=newEl('div','plate-preview');
   const open=newEl('button','plate-photo-open');open.type='button';
   open.setAttribute('aria-label','Review full-size photo of '+entry.plate);
   open.append(img);preview.append(open);
   const inspectHint=ptext('Tap photo to enlarge','plate-photo-tap-hint');inspectHint.hidden=true;preview.append(inspectHint);
   const loading=ptext('Loading saved photo…','plate-photo-loading');preview.append(loading);
   const retry=button('Retry photo',()=>{void loadPhoto();},'secondary');
   retry.classList.add('plate-photo-retry');retry.hidden=true;preview.append(retry);
   const loadPhoto=async()=>{
    loading.hidden=false;loading.textContent='Loading saved photo…';retry.hidden=true;inspectHint.hidden=true;
    try{
     // Photo must be attached before storage returns; the old code skipped detached images.
     await picture(img,entry.photo_path);
     if(img.complete&&img.naturalWidth){loading.hidden=true;inspectHint.hidden=false;return;}
     img.addEventListener('load',()=>{loading.hidden=true;retry.hidden=true;inspectHint.hidden=false;},{once:true});
     img.addEventListener('error',()=>{loading.textContent='Photo could not be displayed.';retry.hidden=false;},{once:true});
    }catch(error){loading.textContent='Could not download the saved photo. Retry below.';retry.hidden=false;}
   };
   open.addEventListener('click',()=>reviewPhoto(img,entry.plate+' · '+nameFor(entry.seat)));
   card.append(preview);
   const info=newEl('div','plate-card-info');info.append(ptext(`${entry.plate}${entry.region?' · '+entry.region:''}`,'plate-plate'));
   const guess=ptext(entry.guess,'plate-guess');info.append(labelText('The interpretation'),guess);
   const refs=newEl('div','plate-links');
   for(const [title,url] of [['🔎 Research this plate',googleLink(entry.plate,entry.region)],['State plate designs',designLink(entry.region||'US')]]){
    const a=newEl('a','plate-research',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';refs.append(a);
   }
   info.append(refs);card.append(info);
   if(entry.status==='approved')card.append(ptext('Point awarded to '+nameFor(entry.seat)+'. This plate is settled.','plate-done'));
   else if(entry.status==='pending'&&own)card.append(ptext('Waiting for '+nameFor(seat==='ana'?'cowboy':'ana')+' to vote.','plate-waiting'));
   else if(entry.status==='pending'&&!own){
    const actions=newEl('div','plate-actions');actions.append(button('👍 Agree · +1',()=>vote(entry.id,true,''),'yes'),button('👎 Disagree',()=>{
     if(card.querySelector('.plate-disagree'))return;
     const f=newEl('form','plate-disagree');f.innerHTML='<label>Explain your disagreement <textarea rows="3" minlength="6" maxlength="650" required placeholder="Here is why I disagree…"></textarea></label><button class="plate-button" type="submit">Send explanation 👎</button>';
     f.addEventListener('submit',async ev=>{ev.preventDefault();await vote(entry.id,false,f.querySelector('textarea').value);});card.append(f);f.querySelector('textarea').focus();
    },'no'));card.append(actions);
   }else if(entry.status==='needs_revision'){
    card.append(ptext('👎 '+entry.last_reason,'plate-reason'));
    if(own){
     const f=newEl('form','plate-revise');f.innerHTML='<label>Revised interpretation <textarea rows="2" minlength="2" maxlength="600" required></textarea></label><label>Reply to their reasoning (optional) <textarea rows="2" maxlength="650"></textarea></label><button class="plate-button" type="submit">Submit revision for another vote</button>';
     f.querySelector('textarea').value=entry.guess;
     f.addEventListener('submit',async ev=>{ev.preventDefault();await revise(entry.id,f.querySelectorAll('textarea')[0].value,f.querySelectorAll('textarea')[1].value);});card.append(f);
    }else card.append(ptext('Waiting for '+nameFor(entry.seat)+' to revise the guess.','plate-waiting'));
   }
   if((entry.history?.length||0)+(entry.discussion?.length||0)>0){
    const details=newEl('details','plate-history'),summary=newEl('summary','','The debate so far');details.append(summary);
    for(const h of entry.history||[])details.append(ptext((h.decision==='up'?'👍 Approved':'👎 Disagreed')+(h.reason?' · '+h.reason:''),'plate-history-row'));
    for(const h of entry.discussion||[])details.append(ptext('Revised: '+h.guess+(h.response?' · Reply: '+h.response:''),'plate-history-row'));
    card.append(details);
   }
   list.append(card);
   void loadPhoto();
  }
 }
 async function refresh(quiet=false){
  if(!client||!mounted)return;
  try{const {data,error}=await client.rpc('community_plate_state',{p_limit:20});if(error)throw error;game=data;display();if(!quiet)setStatus('Scores and photos updated.');}
  catch(err){if(!quiet)setStatus('Could not refresh: '+(err.message||'Please retry.'));}
 }
 async function action(fn){
  if(working)return;working=true;setStatus('Saving…');
  try{const {data,error}=await fn();if(error)throw error;game=data;display();setStatus('Saved! Both players can now see the update.');}
  catch(err){setStatus('Not saved: '+(err.message||'Please retry.'));}
  finally{working=false;}
 }
 async function vote(id,up,reason){await action(()=>client.rpc('community_plate_vote',{p_id:id,p_up:up,p_reason:reason}));}
 async function revise(id,guess,response){await action(()=>client.rpc('community_plate_revise',{p_id:id,p_guess:guess,p_response:response}));}
 async function compress(file){
  if(!file || !(file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))) throw Error('Choose a camera photo or an image from Photos.');
  if(file.size > 35*1024*1024) throw Error('This file is over 35 MB. Choose the regular photo instead of ProRAW, or send a screenshot.');
  const src=URL.createObjectURL(file);
  try{
   const image=new Image();
   await new Promise((resolve,reject)=>{
    image.onload=()=>image.naturalWidth?resolve():reject(Error('Photo could not be decoded.'));
    image.onerror=()=>reject(Error('This image format could not be opened. In Photos, take a screenshot and upload that instead.'));
    image.src=src;
    if(image.complete&&image.naturalWidth)resolve();
   });
   for(const [maxDim,quality] of [[1700,.84],[1450,.81],[1200,.76],[1000,.72],[800,.68]]){
    const ratio=Math.min(1,maxDim/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
    canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
    const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('Photo processing is not available in this browser.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
    if(blob?.type==='image/jpeg'&&blob.size>0&&blob.size<=2000000)return blob;
   }
   throw Error('The photo could not be reduced below 2 MB. Please crop around the plate or take a screenshot.');
  } finally{URL.revokeObjectURL(src);}
 }
 async function post(ev){
  ev.preventDefault();if(!client||working)return;
  const file=$('plate-photo').files?.[0];if(!file){setStatus('Choose a photo first.');return;}
  working=true;let path=null;$('plate-submit').disabled=true;setStatus('Resizing and uploading the photo…');
  try{
   const blob=await compress(file);path=`${userId}/${crypto.randomUUID()}.jpg`;setStatus(`Uploading resized JPEG (${Math.round(blob.size/1024)} KB)…`);
   const up=await client.storage.from('community-plate-game').upload(path,blob,{contentType:'image/jpeg',upsert:false});
   if(up.error)throw up.error;
   const {data,error}=await client.rpc('community_plate_post',{p_plate:$('plate-characters').value,p_region:$('plate-region').value,p_guess:$('plate-guess').value,p_photo_path:path});
   if(error)throw error;
   $('plate-new').reset();game=data;display();setStatus('Challenge posted! '+nameFor(seat==='ana'?'cowboy':'ana')+' can vote.');path=null;
  }catch(err){setStatus('Could not post: '+(err.message||'Please retry.'));if(path)try{await client.storage.from('community-plate-game').remove([path]);}catch{}}
  finally{working=false;$('plate-submit').disabled=false;}
 }
 async function mount(){
  if(mounted||board.hidden||!client)return;
  const {data:{session}}=await client.auth.getSession();const id=session?.user?.id;if(!id)return;
  const {data,error}=await client.rpc('community_plate_state',{p_limit:20});if(error){return;}
  userId=id;seat=data.seat;game=data;mounted=true;frame();if(!$('plate-game-root'))return;display();
  if(timer)clearInterval(timer);timer=setInterval(()=>{if(!document.hidden&&mounted)refresh(true);},25000);
 }
 function unmount(){$('plate-photo-viewer')?.close();mounted=false;seat=null;userId=null;game=null;expanded=false;if(timer){clearInterval(timer);timer=null;}clean();$('plate-game-root')?.remove();}
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const store=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const storageKey='sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(config.supabaseUrl,config.publishableKey,{auth:{storageKey,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:store}});
  let wait=null;const schedule=()=>{clearTimeout(wait);wait=setTimeout(()=>{if(board.hidden){if(mounted)unmount();}else mount().catch(()=>{});},180);};
  new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')unmount();schedule();});
  schedule();
 }catch{/* Never block the community page if the optional game fails. */}
}
