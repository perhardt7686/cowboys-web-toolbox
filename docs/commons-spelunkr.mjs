/* Family-only shortcut to Spelunkr's verified direct TV guide.
   One link appears immediately after Drawing Studio on both game selectors.
   The external provider owns all broadcasts; do not iframe or relay video.
*/
(() => {
  'use strict';
  const targetURL='https://spelunkr.tv/?tv';
  const board=document.getElementById('conversations');
  if(!board||!document.body.classList.contains('community-page'))return;
  let queued=false,watchedGrid=null,gridObserver=null;
  function createLink(id,arcade=false){
    const a=document.createElement('a');
    a.id=id;a.href=targetURL;a.target='_blank';a.rel='noopener noreferrer';
    a.setAttribute('aria-label','Spelunkr Retro TV. Open live broadcast channel guide in a new tab');
    if(arcade){
      a.className='spelunkr-arcade-link';
      a.innerHTML='<span class="arcade-program-number" aria-hidden="true">TV</span><span class="arcade-program-mark" aria-hidden="true">▣</span><span class="arcade-program-name"><strong>Spelunkr Retro TV</strong><small>LIVE BROADCAST CHANNEL GUIDE</small></span><span class="arcade-program-state">TUNE IN ↗</span>';
    }else{
      a.className='mahjong-entry-button spelunkr-game-link';
      a.innerHTML='<span class="mahjong-entry-icon" aria-hidden="true">📺</span><span class="mahjong-entry-copy"><strong>Spelunkr Retro TV</strong><small>35+ channels · Live classic TV broadcast guide · Opens in new tab</small></span><span class="mahjong-chevron" aria-hidden="true">↗</span>';
    }
    return a;
  }
  function sync(){
    if(board.hidden){
      document.getElementById('spelunkr-game-link')?.remove();
      document.getElementById('spelunkr-arcade-link')?.remove();
      return;
    }
    const drawing=document.getElementById('drawing-studio-game-root');
    if(drawing && board.contains(drawing)){
      let link=document.getElementById('spelunkr-game-link');
      if(!link)link=createLink('spelunkr-game-link');
      if(drawing.nextElementSibling!==link)drawing.after(link);
    } else {
      // Avoid a floating shortcut after an authorized game session unmounts.
      document.getElementById('spelunkr-game-link')?.remove();
    }
    const grid=document.getElementById('arcade-program-grid');
    if(grid!==watchedGrid){
      gridObserver?.disconnect();watchedGrid=grid;
      if(grid){
        gridObserver=new MutationObserver(schedule);
        gridObserver.observe(grid,{childList:true});
      }
    }
    const button=grid?.querySelector('[data-arcade-game="drawing"]');
    if(grid&&button){
      let link=document.getElementById('spelunkr-arcade-link');
      if(!link)link=createLink('spelunkr-arcade-link',true);
      if(button.nextElementSibling!==link)button.after(link);
    }
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;sync();});
  }
  new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true});
  const arcadeWatch=new MutationObserver(schedule);
  arcadeWatch.observe(document.body,{childList:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
})();
