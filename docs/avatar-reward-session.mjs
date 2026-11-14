const activeGame=()=>{
  const hotRod=document.querySelector('.hot-rod-monitor[open]');
  if(hotRod)return hotRod.querySelector('.hot-rod-top-actions button:last-child');
  if(document.body.classList.contains('arcade-on'))return document.querySelector('#family-game-header:not([hidden]) .family-game-back');
  return null;
};

// The existing game controls still handle leaving each game and any save or
// pause behavior. Only their label changes for a trip from the studio.
export function watchRewardGame(leave,unavailable) {
  let exit=null,label='',timer=0;
  function stop(){
    observer.disconnect();
    clearTimeout(timer);
    if(exit?.isConnected&&exit.textContent==='Back to Avatar Studio')exit.textContent=label;
  }
  function inspect(){
    const next=activeGame();
    if(next){
      if(next===exit)return;
      exit=next;
      label=exit.textContent;
      exit.textContent='Back to Avatar Studio';
      clearTimeout(timer);
    }else if(exit&&!document.body.classList.contains('arcade-on')&&!document.querySelector('.hot-rod-monitor[open]')){
      stop();
      leave();
    }
  }
  const observer=new MutationObserver(inspect);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','open','hidden']});
  timer=setTimeout(()=>{stop();unavailable();},6000);
  inspect();
  return stop;
}
