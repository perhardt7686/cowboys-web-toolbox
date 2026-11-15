/* Private Family Message Board channel directory.
   Each Watch button opens the official Spelunkr broadcast page.
   No iframe, duplicated video or pretend live program schedule. */
import {RETRO_CHANNELS,RETRO_GROUPS} from './commons-spelunkr-channels.mjs?v=guide3';
(() => {
  'use strict';
  const targetURL='https://spelunkr.tv/?tv';
  const board=document.getElementById('conversations');
  if(!board||!document.body.classList.contains('community-page'))return;
  const validNumbers=new Set(RETRO_CHANNELS.map(c=>c.number));
  const favoriteKey='cowboy-family-retro-favorites-device-v1';
  let favoriteNumbers=new Set(),query='',group='all',modal=null,returnFocus=null;
  let queued=false,watchedGrid=null,gridObserver=null;
  try{
    const stored=JSON.parse(localStorage.getItem(favoriteKey)||'[]');
    if(Array.isArray(stored))favoriteNumbers=new Set(stored.filter(n=>Number.isInteger(n)&&validNumbers.has(n)));
  }catch{/* Device storage is optional. */}
  const make=(tag,cls,content)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(content!==undefined)node.textContent=content;
    return node;
  };
  function saveFavorites(){
    try{localStorage.setItem(favoriteKey,JSON.stringify([...favoriteNumbers]));}catch{}
  }
  function createLink(id,arcade=false){
    const a=document.createElement('a');
    a.id=id;a.href=targetURL;a.target='_blank';a.rel='noopener noreferrer';
    a.setAttribute('aria-label','Spelunkr Retro TV. Open accessible family channel guide');
    a.setAttribute('aria-haspopup','dialog');a.setAttribute('aria-controls','family-retro-guide');
    if(arcade){
      a.className='spelunkr-arcade-link';
      a.innerHTML='<span class="arcade-program-number" aria-hidden="true">TV</span><span class="arcade-program-mark" aria-hidden="true">▣</span><span class="arcade-program-name"><strong>Spelunkr Retro TV</strong><small>'+RETRO_CHANNELS.length+' CHANNELS · EASY MOBILE GUIDE</small></span><span class="arcade-program-state">CHANNELS ↗</span>';
    }else{
      a.className='mahjong-entry-button spelunkr-game-link';
      a.innerHTML='<span class="mahjong-entry-icon" aria-hidden="true">📺</span><span class="mahjong-entry-copy"><strong>Spelunkr Retro TV</strong><small>Browse '+RETRO_CHANNELS.length+' channels · Choose what to watch</small></span><span class="mahjong-chevron" aria-hidden="true">↗</span>';
    }
    a.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||board.hidden)return;
      event.preventDefault();
      openGuide(a);
    });
    return a;
  }
  function createModal(){
    if(modal)return modal;
    modal=make('div','family-retro-modal');
    modal.id='family-retro-guide';modal.hidden=true;
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','family-retro-title');
    modal.innerHTML='<section class="family-retro-panel">'+
      '<header class="family-retro-head">'+
        '<div class="family-retro-brand">'+
          '<span class="family-retro-stamp" aria-hidden="true">📺</span>'+
          '<div><small>THE FAMILY MESSAGE BOARD PRESENTS</small>'+
          '<h2 id="family-retro-title">Retro TV Channel Guide</h2>'+
          '<p>Pick a channel here. Watch it on Spelunkr.</p></div></div>'+
        '<button type="button" id="family-retro-close" class="family-retro-close" aria-label="Close Retro TV guide">✕</button>'+
      '</header>'+
      '<div class="family-retro-toolbar">'+
        '<label class="family-retro-search-label" for="family-retro-search">Find a channel'+
        '<input id="family-retro-search" type="search" autocomplete="off" placeholder="Channel name or number…"></label>'+
        '<div class="family-retro-filter-row" id="family-retro-filters" role="group" aria-label="Channel categories"></div>'+
      '</div>'+
      '<div class="family-retro-main">'+
        '<div class="family-retro-count" id="family-retro-count" role="status" aria-live="polite"></div>'+
        '<div class="family-retro-list" id="family-retro-list"></div>'+
        '<p class="family-retro-empty" id="family-retro-empty" hidden>No matching channels. Try another search or category.</p>'+
      '</div>'+
      '<footer class="family-retro-foot">'+
        '<p>Channels verified Nov 14, 2026. Spelunkr controls programming. Some shows are unrated or for mature audiences.</p>'+
        '<div class="family-retro-foot-links">'+
          '<a href="https://spelunkr.tv/directory" target="_blank" rel="noopener noreferrer">Official directory ↗</a>'+
          '<a href="https://spelunkr.tv/?tv" target="_blank" rel="noopener noreferrer">Full broadcast schedule ↗</a>'+
        '</div>'+
        '<small>Independent family channel selector. All broadcasts play on Spelunkr’s site.</small>'+
      '</footer></section>';
    document.body.append(modal);
    modal.querySelector('#family-retro-close').addEventListener('click',closeGuide);
    modal.addEventListener('pointerdown',event=>{if(event.target===modal)closeGuide();});
    modal.querySelector('#family-retro-search').addEventListener('input',event=>{
      query=String(event.target.value||'').trim().toLowerCase().slice(0,80);paintCards();
    });
    const filters=modal.querySelector('#family-retro-filters');
    for(const [value,label] of RETRO_GROUPS){
      const button=make('button','family-retro-filter',label);
      button.type='button';button.dataset.retroGroup=value;
      button.setAttribute('aria-pressed',String(value===group));
      button.addEventListener('click',()=>{
        group=value;
        filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.retroGroup===group)));
        paintCards();
      });
      filters.append(button);
    }
    modal.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        event.preventDefault();event.stopImmediatePropagation();closeGuide();return;
      }
      if(event.key!=='Tab')return;
      const focusable=[...modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')]
        .filter(el=>el.getClientRects().length>0);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    return modal;
  }
  function paintCards(){
    if(!modal)return;
    const list=modal.querySelector('#family-retro-list');
    const shown=RETRO_CHANNELS.filter(c=>
      (group==='all'||(group==='favorites'?favoriteNumbers.has(c.number):group===c.group))&&
      (!query||c.name.toLowerCase().includes(query)||String(c.number).includes(query)));
    const fragment=document.createDocumentFragment();
    for(const channel of shown){
      const item=make('article','family-retro-channel');
      item.dataset.channel=String(channel.number);
      const number=make('span','family-retro-channel-num',String(channel.number).padStart(2,'0'));
      const copy=make('div','family-retro-channel-copy');
      copy.append(make('strong','family-retro-channel-title',channel.name),
        make('small','family-retro-channel-desc','CH '+String(channel.number).padStart(2,'0')+' · 24/7 broadcast'));
      const actions=make('div','family-retro-channel-actions');
      const owned=favoriteNumbers.has(channel.number);
      const favorite=make('button','family-retro-fav',owned?'★':'☆');
      favorite.type='button';favorite.dataset.retroFavorite=String(channel.number);
      favorite.setAttribute('aria-pressed',String(owned));
      favorite.setAttribute('aria-label',(owned?'Remove ':'Add ')+channel.name+(owned?' from favorites':' to favorites'));
      favorite.addEventListener('click',()=>{
        if(favoriteNumbers.has(channel.number))favoriteNumbers.delete(channel.number);
        else favoriteNumbers.add(channel.number);
        saveFavorites();paintCards();
        modal.querySelector('[data-retro-favorite="'+channel.number+'"]')?.focus();
      });
      const watch=make('a','family-retro-watch','Watch ↗');
      watch.href=channel.url;watch.target='_blank';watch.rel='noopener noreferrer';
      watch.setAttribute('aria-label','Watch channel '+channel.number+' '+channel.name+' on Spelunkr (new tab)');
      actions.append(favorite,watch);item.append(number,copy,actions);fragment.append(item);
    }
    list.replaceChildren(fragment);
    modal.querySelector('#family-retro-count').textContent=shown.length+' of '+RETRO_CHANNELS.length+
      ' channels · '+(group==='favorites'?'Favorites on this device':'Official watch links');
    modal.querySelector('#family-retro-empty').hidden=shown.length!==0;
  }
  function openGuide(link){
    if(board.hidden)return;
    createModal();returnFocus=link;query='';group='all';
    modal.querySelector('#family-retro-search').value='';
    modal.querySelectorAll('[data-retro-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.retroGroup===group)));
    paintCards();modal.hidden=false;document.body.classList.add('family-retro-open');
    modal.querySelector('#family-retro-search').focus();
  }
  function closeGuide(){
    if(!modal||modal.hidden)return;
    modal.hidden=true;document.body.classList.remove('family-retro-open');
    if(returnFocus?.isConnected&&!board.hidden)returnFocus.focus();
    returnFocus=null;
  }
  function sync(){
    if(board.hidden){
      closeGuide();
      document.getElementById('spelunkr-game-link')?.remove();
      document.getElementById('spelunkr-arcade-link')?.remove();
      return;
    }
    const drawing=document.getElementById('drawing-studio-game-root');
    if(drawing&&board.contains(drawing)){
      let link=document.getElementById('spelunkr-game-link');
      if(!link)link=createLink('spelunkr-game-link');
      if(drawing.nextElementSibling!==link)drawing.after(link);
    }else document.getElementById('spelunkr-game-link')?.remove();
    const grid=document.getElementById('arcade-program-grid');
    if(grid!==watchedGrid){
      gridObserver?.disconnect();watchedGrid=grid;
      if(grid){gridObserver=new MutationObserver(schedule);gridObserver.observe(grid,{childList:true});}
    }
    const button=grid?.querySelector('[data-arcade-game="drawing"]');
    if(grid&&button){
      let link=document.getElementById('spelunkr-arcade-link');
      if(!link)link=createLink('spelunkr-arcade-link',true);
      if(button.nextElementSibling!==link)button.after(link);
    }else document.getElementById('spelunkr-arcade-link')?.remove();
  }
  function schedule(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;sync();});
  }
  new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true});
  new MutationObserver(schedule).observe(document.body,{childList:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
})();
