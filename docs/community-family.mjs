/* Lightweight reading-comfort and sort enhancements for the existing member board.
   The redundant family-corner panel has been permanently retired. */
const board=document.body.classList.contains('community-page')?document.getElementById('conversations'):null;
if(board){
  const main=board.querySelector('.community-main');
  if(main){
    const storageKey='coco-community-easy-read-v1';
    let easy=false;
    try{easy=localStorage.getItem(storageKey)==='1';}catch{}
    const setRead=on=>{
      easy=!!on;
      document.body.classList.toggle('family-easy-read',easy);
      const control=document.getElementById('family-read-toggle');
      if(control){control.setAttribute('aria-pressed',String(easy));control.textContent=easy?'Standard text size':'Larger, clearer text';}
      try{localStorage.setItem(storageKey,easy?'1':'0');}catch{}
    };
    const reading=document.createElement('div');
    reading.className='family-reading-bar';
    reading.innerHTML='<p><strong>Reading comfort</strong> · Bigger text and clearer menus for everyone.</p><button type="button" id="family-read-toggle" aria-pressed="false">Larger, clearer text</button>';
    reading.querySelector('button').addEventListener('click',()=>setRead(!easy));
    main.prepend(reading);
    setRead(easy);

    const sort=document.querySelector('label.community-sort');
    if(sort&&!sort.querySelector('.community-sort-label')){
      const label=document.createElement('span');
      label.className='community-sort-label';label.textContent='Sort conversations';
      sort.prepend(label);
    }
    // The redundant Coco's Family Corner panel and all six draft actions
    // were retired at Cowboy's request. Reading-comfort and conversation
    // sorting remain available, and no posts or profile data are touched.
    main.querySelectorAll('.family-room').forEach(room=>room.remove());
  }
}
