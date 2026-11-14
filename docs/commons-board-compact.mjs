/* Compact Commons: limited-feed navigation with zero changes to post ownership,
   protected records, moderation, search, member permissions or message data. */
const board=document.getElementById('conversations');
const feed=document.getElementById('community-feed');
const more=document.getElementById('load-more');
if(board&&feed&&window.COWBOY_COMMUNITY_CONFIG?.enabled){
 let shown=6;
 const compact=document.createElement('button');
 compact.type='button';
 compact.id='compact-feed-more';
 compact.className='button-quiet';
 compact.setAttribute('aria-label','Show more conversations without endless scrolling');
 feed.after(compact);
 const count=document.createElement('p');
 count.id='compact-feed-count';
 count.setAttribute('role','status');
 count.setAttribute('aria-live','polite');
 compact.before(count);
 const list=()=>Array.from(feed.children).filter(el=>el.classList.contains('thread-card'));
 function refresh(){
  if(board.hidden){
   compact.hidden=true;count.hidden=true;return;
  }
  const cards=list();
  if(!cards.length){compact.hidden=true;count.hidden=true;return;}
  const visible=Math.min(shown,cards.length);
  cards.forEach((c,i)=>{c.hidden=i>=visible;});
  const canFetch=!!more&&!more.hidden;
  count.hidden=false;
  count.textContent='Showing '+visible+' of '+cards.length+' loaded conversations';
  compact.hidden=visible>=cards.length&&!canFetch;
  compact.textContent=visible<cards.length?
   'Show next '+Math.min(6,cards.length-visible)+' conversations ↓':
   'Load older conversations ↓';
 }
 compact.addEventListener('click',()=>{
  const cards=list();
  if(shown<cards.length){shown+=6;refresh();return;}
  if(more&&!more.hidden){more.click();return;}
  refresh();
 });
 new MutationObserver(()=>{shown=6;refresh();}).observe(feed,{childList:true});
 new MutationObserver(refresh).observe(board,{attributes:true,attributeFilter:['hidden']});
 // Existing backend can change the Load More control without rebuilding cards.
 if(more)new MutationObserver(refresh).observe(more,{attributes:true,attributeFilter:['hidden','disabled']});
 refresh();
}
