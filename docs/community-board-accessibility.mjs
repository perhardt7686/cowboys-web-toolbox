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
    const reading=main.querySelector('.family-reading-bar')||document.createElement('div');
    if(!reading.isConnected){
      reading.className='family-reading-bar';
      reading.innerHTML='<p><strong>Reading comfort</strong> · Bigger text and clearer menus for everyone.</p><button type="button" id="family-read-toggle" aria-pressed="false">Larger, clearer text</button>';
      main.prepend(reading);
    }
    const toggle=reading.querySelector('#family-read-toggle');
    const setRead=on=>{
      easy=!!on;
      document.body.classList.toggle('family-easy-read',easy);
      if(toggle){
        toggle.setAttribute('aria-pressed',String(easy));
        toggle.textContent=easy?'Standard text size':'Larger, clearer text';
      }
      try{localStorage.setItem(key,easy?'1':'0');}catch{}
    };
    toggle?.addEventListener('click',()=>setRead(!easy));
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
