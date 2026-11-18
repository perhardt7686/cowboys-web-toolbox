/* V8 MEMBER STUDIO: new interface only, preserving authenticated member, reward and pet records.
   No legacy-layout toggle or local-storage mode selector. */

export function enhanceMemberStudio(editor){
  if(!editor||editor.dataset.v8Live==='true')return null;
  editor.dataset.v8Live='true';
  const banner=document.createElement('header');
  banner.className='avatar-v8-member-heading';
  const words=document.createElement('div');
  const eyebrow=document.createElement('span');
  eyebrow.className='avatar-v8-member-eyebrow';
  eyebrow.textContent='THE FAMILY UNIVERSE · CHARACTER WORKSHOP';
  const title=document.createElement('h3');
  title.textContent='Make your mystery character';
  const note=document.createElement('p');
  note.textContent='Shape the character, dress up, visit companions and collect game prizes. Your existing progress stays connected.';
  words.append(eyebrow,title,note);
  const utilities=document.createElement('div');
  utilities.className='avatar-v8-member-utilities';
  const connected=document.createElement('span');
  connected.className='avatar-v8-member-connection';
  connected.textContent='Family account · real saved progress';
  utilities.append(connected);
  banner.append(words,utilities);
  editor.prepend(banner);
  const hint=document.createElement('p');
  hint.className='avatar-v8-member-footer-note';
  hint.textContent='Earned rewards and pet bonds are checked with your family account. Previews do not unlock items. Use Save look to keep changes.';
  editor.append(hint);
  return {banner};
}

export function makePetGallery(eligible,selected,earnedIds,onChoose){
  const gallery=document.createElement('div');
  gallery.className='avatar-v8-pet-gallery';
  gallery.setAttribute('role','group');
  gallery.setAttribute('aria-label','Visual pet companion gallery');
  const title=document.createElement('h4');
  title.textContent='Choose your companion';
  const note=document.createElement('p');
  note.textContent='Choose a portrait to see its tricks and bond.';
  gallery.append(title,note);
  const strip=document.createElement('div');
  strip.className='avatar-v8-pet-strip';
  for(const item of eligible){
    const button=document.createElement('button');
    button.type='button';
    button.className='avatar-v8-pet-pick';
    button.dataset.v8PetId=item.id;
    button.setAttribute('aria-pressed',String(item.id===selected));
    button.setAttribute('aria-label',(earnedIds.has(item.id)?'Select owned pet ':'Preview locked pet ')+item.name);
    const art=document.createElement('canvas');
    art.width=art.height=100;
    art.className='avatar-v8-pet-tile-art';
    art.setAttribute('aria-hidden','true');
    art.dataset.v8PetArt=item.id;
    const name=document.createElement('span');
    name.className='avatar-v8-pet-name';
    name.textContent=item.name;
    const status=document.createElement('small');
    status.textContent=earnedIds.has(item.id)?'Earned':'Locked';
    button.append(art,name,status);
    button.addEventListener('click',()=>onChoose(item.id));
    strip.append(button);
  }
  gallery.append(strip);
  return gallery;
}
