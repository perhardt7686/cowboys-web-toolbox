/* Member-board reading controls and a permanent retirement guard for the
   obsolete Coco's Family Corner. This script NEVER posts or changes records. */
const board=document.body.classList.contains('community-page')?
  document.getElementById('conversations'):null;

function removeLegacyCorner(root=document){
  if(root.nodeType!==1 && root.nodeType!==9)return;
  if(root.matches?.('.family-room'))root.remove();
  root.querySelectorAll?.('.family-room').forEach(el=>el.remove());
}

removeLegacyCorner();

if(board){
  const main=board.querySelector('.community-main');
  if(main){
    const key='coco-community-easy-read-v1';
    let easy=false;
    try{easy=localStorage.getItem(key)==='1';}catch{}
    // Keep reading controls in the search/sort toolbar rather than taking
    // a full-width block at the top of conversations on small iPhones.
    const tools=main.querySelector('.community-tools')||main;
    tools.classList.add('has-reading-dropdown');
    const previous=main.querySelector('.family-reading-bar');
    const reading=document.createElement('details');
    reading.className='family-reading-bar';
    reading.id='family-reading-menu';
    reading.innerHTML='<summary id="family-reading-summary">Aa Reading <span class="family-reading-current">Standard</span></summary><div class="family-reading-panel"><p><strong>Reading comfort</strong> · Bigger text and clearer menus for everyone.</p><button type="button" id="family-read-toggle" aria-pressed="false">Larger, clearer text</button></div>';
    previous?.remove();
    tools.append(reading);
    const toggle=reading.querySelector('#family-read-toggle');
    const current=reading.querySelector('.family-reading-current');
    const setRead=on=>{
      easy=!!on;
      document.body.classList.toggle('family-easy-read',easy);
      if(toggle){
        toggle.setAttribute('aria-pressed',String(easy));
        toggle.textContent=easy?'Use standard text':'Use larger, clearer text';
      }
      if(current)current.textContent=easy?'Large':'Standard';
      try{localStorage.setItem(key,easy?'1':'0');}catch{}
    };
    toggle?.addEventListener('click',()=>setRead(!easy));
    reading.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&reading.open){
        event.preventDefault();reading.open=false;
        reading.querySelector('summary')?.focus();
      }
    });
    document.addEventListener('click',event=>{
      if(reading.open&&!reading.contains(event.target))reading.open=false;
    });
    setRead(easy);
    const sort=document.querySelector('label.community-sort');
    if(sort&&!sort.querySelector('.community-sort-label')){
      const label=document.createElement('span');
      label.className='community-sort-label';
      label.textContent='Sort conversations';
      sort.prepend(label);
    }
  }
}

// If an older cached module inserts the retired panel after this one, remove
// that element as soon as it is attached, without modifying any game stage.
const observer=new MutationObserver(records=>{
  for(const change of records){
    for(const node of change.addedNodes){
      if(node.nodeType===1)removeLegacyCorner(node);
    }
  }
});
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>removeLegacyCorner());
