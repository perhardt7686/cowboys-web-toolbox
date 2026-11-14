/* Cowboy's Commons Arcade: one-screen DOS-inspired scene host.
   Presentation only. Existing member-only games retain their events, state,
   RPCs, authentication, scores, and original DOM nodes. */
const board=document.getElementById('conversations');
const config=window.COWBOY_COMMUNITY_CONFIG;
const $=id=>document.getElementById(id);
const games=[
 {id:'streetrod',root:'streetrod-root',toggle:'sr-toggle',name:'Street r0d',tag:'1963 MOTOR SHOP',symbol:'▣',scenes:[['garage','GARAGE'],['tune','TUNE'],['paper','CLASSIFIEDS'],['parts','PARTS'],['diner','DRIVE-IN'],['drive','ROAD'],['calendar','CALENDAR'],['junior','JUNIOR']]},
 {id:'mahjong',root:'mahjong-root',toggle:'mahjong-toggle',name:'Mahjong',tag:'MYSTERY ROAD',symbol:'◇',scenes:[['play','PLAY'],['levels','LEVELS'],['scores','SCORES'],['badges','AWARDS'],['history','HISTORY']]},
 {id:'wordle',root:'letter-lock-root',toggle:'letter-lock-toggle',name:'w0rdle',tag:'CO-OP WORD CIPHER',symbol:'▤',scenes:[['play','PLAY'],['scores','SCORES'],['awards','AWARDS']]},
 {id:'wordquest',root:'word-game-root',toggle:'word-game-toggle',name:'Word Quest',tag:'DAILY TEAM PUZZLE',symbol:'▥',scenes:[['play','PLAY'],['scores','LEADERBOARD']]},
 {id:'plates',root:'plate-game-root',toggle:'plate-game-open',name:'License Plates',tag:'ANA VS. COWBOY',symbol:'▧',scenes:[['post','POST'],['vote','REVIEW'],['history','PHOTOS'],['scores','SCORES']]},
 {id:'drawing',root:'drawing-studio-game-root',toggle:'drawing-studio-toggle',name:'Drawing Studio',tag:'ORIGINAL ART DESK',symbol:'▦',scenes:[['draw','CANVAS']]},
 {id:'study',root:'vdacs-study-root',toggle:'vdacs-study-toggle',name:'7A Study Cards',tag:'PEST CONTROL PREP',symbol:'▨',scenes:[['cards','CARDS'],['awards','MILESTONES']]}
];
let active=null,scene='',mode='menu',settings=null,menu=null,hud=null,station=null,plateIndex=0;
let lastFocus=null,waiting=false,frameTimer=null,lastRoot=null,returnMode='menu',savedScroll=0;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&amp;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='cowboy-arcade-display-v1';
function loadSettings(){
 try{const s=JSON.parse(localStorage.getItem(key)||'{}');return {contrast:s.contrast==='bright'?'bright':'ega',size:s.size==='large'?'large':'normal',motion:s.motion==='reduce'?'reduce':'normal'};}
 catch{return {contrast:'ega',size:'normal',motion:'normal'};}
}
function saveSettings(){
 try{localStorage.setItem(key,JSON.stringify(settings));}catch{}
 document.body.dataset.arcadeContrast=settings.contrast;
 document.body.dataset.arcadeSize=settings.size;
 document.body.dataset.arcadeMotion=settings.motion;
 drawArt();
}
function game(id){return games.find(x=>x.id===id)}
function available(g){return Boolean($(g.root)&&!board.hidden)}
function pageLabels(){return game(active)?.scenes||[]}
function drawArt(){
 const canvas=$('arcade-title-art');if(!canvas)return;
 const c=canvas.getContext('2d');if(!c)return;
 c.imageSmoothingEnabled=false;
 const ega=['#000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#fff'];
 const bg=settings?.contrast==='bright'?0:1,lit=settings?.contrast==='bright'?14:11;
 const rect=(x,y,w,h,p)=>{c.fillStyle=ega[p];c.fillRect(x,y,w,h)};
 const line=(x,y,xx,yy,p)=>{c.strokeStyle=ega[p];c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke()};
 const type=(t,x,y,s,p)=>{c.font='bold '+s+'px monospace';c.fillStyle=ega[p];c.fillText(t,x,y)};
 rect(0,0,320,200,bg);
 for(let i=0;i<36;i++)rect((i*47+19)%319,(i*31+9)%115,1+(i%3===0?1:0),1,15);
 rect(0,109,320,91,8);
 for(let i=0;i<12;i++)line(i*32,109,(i-5)*80,199,0);
 rect(0,115,320,2,14);
 rect(0,142,320,2,6);
 rect(9,43,302,6,8);rect(12,49,296,57,7);rect(17,56,286,44,0);
 for(let i=0;i<19;i++)rect(18+i*15,58,5,36,i%2?8:6);
 rect(76,83,180,4,8);
 // Original pixel-art coupe, composed rather than copied from an earlier game.
 rect(60,124,206,21,4);rect(69,117,188,8,12);
 rect(96,101,100,18,4);rect(113,93,70,14,12);
 rect(119,95,26,13,3);rect(151,95,25,13,3);
 rect(148,95,3,15,0);rect(111,117,128,3,15);
 rect(63,137,203,3,15);rect(64,125,13,8,14);
 for(const x of [102,225]){rect(x-16,133,33,20,0);rect(x-12,136,25,14,7);rect(x-7,139,15,9,8);rect(x-2,141,5,5,15);}
 type('COWBOY COMPUTER SYSTEMS',31,24,11,14);
 type('COMMONS  ARCADE  /  1989',39,39,10,lit);
 type('SELECT A PROGRAM',85,184,10,15);
}
function build(){
 if(!board||!config?.enabled||!location.pathname.endsWith('community.html'))return;
 const main=board.querySelector('.community-main');
 if(!main)return;
 if(!menu){
  menu=document.createElement('section');menu.id='arcade-shell';menu.hidden=true;
  menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');
  menu.setAttribute('aria-label','Cowboy Commons Arcade');
  menu.innerHTML='<div class="arcade-computer"><section id="arcade-menu-view"><canvas id="arcade-title-art" width="320" height="200" role="img" aria-label="Original pixel art: a vintage red car in the arcade garage"></canvas><div class="arcade-menu-intro"><span>MS-DOS INSPIRED · MEMBERS ONLY</span><h2>SELECT YOUR GAME</h2><p>Every location is one scene. Progress remains saved by its original game.</p></div><div id="arcade-program-grid"></div><div class="arcade-menu-bottom"><button type="button" data-arcade-action="options">F2 · SETTINGS</button><button type="button" data-arcade-action="exit">EXIT TO COMMONS</button></div></section><section id="arcade-options-view" hidden><h2>DISPLAY SETUP</h2><p>These settings adjust only the Arcade screen, not your game saves.</p><div id="arcade-options-form"></div><button type="button" data-arcade-action="options-back">RETURN TO GAME / MENU</button></section><p class="arcade-menu-status" id="arcade-menu-status" role="status" aria-live="polite"></p></div>';
  document.body.append(menu);
  menu.addEventListener('click',onMenuClick);
  hud=document.createElement('header');hud.id='arcade-hud';hud.hidden=true;
  hud.innerHTML='<div class="arcade-hud-main"><button type="button" data-arcade-action="home" aria-label="Back to game buttons" title="Back to games">‹</button><strong id="arcade-hud-title" class="arcade-screen-reader">GAME</strong><div id="arcade-score-pills" role="status" aria-live="off"></div><div class="arcade-hud-right"><button type="button" data-arcade-action="options" aria-label="Display settings" title="Display settings">⚙</button><button type="button" data-arcade-action="exit" aria-label="Exit game" title="Exit">✕</button></div></div><div class="arcade-scene-switcher"><button type="button" data-arcade-action="scene-previous" aria-label="Previous location">‹</button><nav id="arcade-hud-scenes" aria-label="Current location"></nav><button type="button" data-arcade-action="scene-next" aria-label="Next location">›</button></div><div id="arcade-hud-paging" hidden><button type="button" data-arcade-action="previous" aria-label="Previous item">‹</button><span id="arcade-hud-pagecount"></span><button type="button" data-arcade-action="next" aria-label="Next item">›</button></div>';
  document.body.append(hud);
  hud.addEventListener('click',onMenuClick);
  settings=loadSettings();saveSettings();
  document.addEventListener('keydown',onKeyDown,true);
  const observer=new MutationObserver(()=>{
   if(board.hidden&&document.body.classList.contains('arcade-on'))closeArcade();
   if(waiting){clearTimeout(frameTimer);frameTimer=setTimeout(sync,70);}
  });
  observer.observe(board,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true});
 }
 document.body.classList.add('arcade-ready');
}
function renderMenu(){
 const grid=$('arcade-program-grid');if(!grid)return;
 grid.innerHTML=games.map((g,i)=>{
  const ready=available(g);
  return '<button type="button" data-arcade-game="'+g.id+'" '+(ready?'':'disabled')+'><span class="arcade-program-number">0'+(i+1)+'</span><span class="arcade-program-mark">'+g.symbol+'</span><span class="arcade-program-name"><strong>'+escapeHTML(g.name)+'</strong><small>'+escapeHTML(g.tag)+'</small></span><span class="arcade-program-state">'+(ready?'ENTER ▶':'SIGN IN')+'</span></button>';
 }).join('');
}
function openMenu(){closeArcade();}

function closeArcade(){
 if(!menu)return;
 const openToggle=$(game(active)?.toggle);
 if(openToggle?.getAttribute('aria-expanded')==='true'&&!document.querySelector('.sr-dos-overlay'))openToggle.click();
 const racing=$('streetrod-root');
 if(racing?.classList.contains('sr-dos-fullscreen')){
  racing.classList.remove('sr-dos-fullscreen');
  const monitor=$('sr-dos-maximize');if(monitor){monitor.setAttribute('aria-pressed','false');monitor.textContent='EXPAND DOS DISPLAY';}
 }
 waiting=false;active=null;scene='';mode='menu';
 for(const g of games)$(g.root)?.classList.remove('arcade-game-active');
 document.body.dataset.arcadeGame='';
 document.body.dataset.arcadeScene='';
 menu.hidden=true;hud.hidden=true;
 document.body.classList.remove('arcade-on');
 document.documentElement.classList.remove('arcade-on');
 window.scrollTo(0,savedScroll);
 if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
}
function makeVisible(g){
 const root=$(g.root);if(!root)return false;
 for(const other of games)$(other.root)?.classList.toggle('arcade-game-active',other.id===g.id);
 if(g.toggle){
  const button=$(g.toggle);
  if(button&&button.getAttribute('aria-expanded')!=='true'&&!document.querySelector('.sr-dos-overlay')){
   button.click(); // Use the game's own open pathway, including DOS boot.
  }
 }
 if(g.id==='streetrod'){
  const junior=$('srj-junior')?.querySelector('details');
  if(junior&&scene==='junior')junior.open=true;
 }
 return true;
}
function launch(id){
 const g=game(id);if(!g||!menu||!available(g))return;
 if(document.body.classList.contains('arcade-on')&&active!==g.id)closeArcade();
 lastFocus=document.activeElement;savedScroll=window.scrollY;
 document.body.classList.add('arcade-on');
 document.documentElement.classList.add('arcade-on');
 active=g.id;scene=g.scenes[0][0];mode='game';plateIndex=0;
 document.body.dataset.arcadeGame=active;
 document.body.dataset.arcadeScene=scene;
 menu.hidden=true;
 $('arcade-menu-view').hidden=true;$('arcade-options-view').hidden=true;
 hud.hidden=false;
 hud.querySelector('#arcade-hud-title').textContent=g.name.toUpperCase()+' / '+g.tag;
 waiting=true;makeVisible(g);renderTabs();sync();
 requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
}
function renderTabs(){
 const nav=$('arcade-hud-scenes');if(!nav)return;
 nav.innerHTML=pageLabels().map(([id,label])=>
  '<button type="button" data-arcade-scene="'+id+'" aria-current="'+(scene===id?'page':'false')+'">'+escapeHTML(label)+'</button>'
 ).join('');
 nav.hidden=!active;
 const paging=$('arcade-hud-paging');
 paging.hidden=!pagerSelector();
 updatePlatePaging();
 updateScorePills();
}
function updateScorePills(){
 const host=$('arcade-score-pills');if(!host||!active)return;
 const safe=id=>{const v=$(id)?.textContent?.trim();return v&&!/^[…—-]$/.test(v)?v.slice(0,18):'';};
 const labels=active==='mahjong'?[['BEST',safe('mahjong-ribbon-mine')],['TOP',safe('mahjong-ribbon-record')]]:
   active==='plates'?[['LEAD',safe('plate-ribbon-lead')],['MINE',safe('plate-ribbon-mine')]]:
   active==='streetrod'?[['CREDITS',safe('ss-credits')||safe('sr-credits')],['WINS',safe('sr-wins')]]:
   active==='wordle'?[['POINTS',safe('letter-lock-score')||safe('letter-lock-team-score')]]:[];
 const pills=labels.filter(x=>x[1]).slice(0,2);
 const result=pills.length?pills.map(([label,v])=>'<span class="arcade-score-pill"><small>'+escapeHTML(label)+'</small><b>'+escapeHTML(v)+'</b></span>').join(''):
  '<span class="arcade-score-pill arcade-game-name">'+escapeHTML(game(active)?.name||'GAME')+'</span>';
 if(host.innerHTML!==result)host.innerHTML=result;
}
function stepScene(delta){
 if(mode!=='game'||!active)return;
 const scenes=pageLabels().map(([id])=>id),current=scenes.indexOf(scene);
 if(current<0)return;
 const next=scenes[(current+delta+scenes.length)%scenes.length];
 view(next);
}
function view(next){
 if(!active||!pageLabels().some(([id])=>id===next))return;
 scene=next;
 document.body.dataset.arcadeScene=scene;
 plateIndex=0;
 renderTabs();sync();
}
function sync(){
 if(!active||mode!=='game'||!document.body.classList.contains('arcade-on'))return;
 const g=game(active);if(!makeVisible(g))return;
 if(active==='streetrod'){
  if(scene==='junior'){
   const details=$('srj-junior')?.querySelector('details');if(details)details.open=true;
  }else{
   const summer=$('streetrod-summer');
   const open=$('ss-nav-open');
   if(summer?.hidden&&open&&open.getAttribute('aria-pressed')!=='true'&&!document.querySelector('.sr-dos-overlay'))open.click();
   const tab=scene==='tune'?'garage':scene;
   const btn=$('ss-tabs')?.querySelector('button[data-ss-tab="'+tab+'"]');
   if(btn&&btn.getAttribute('aria-pressed')!=='true'&&!document.querySelector('.sr-dos-overlay')){
    btn.click();
    if(btn.isConnected&&btn.getAttribute('aria-pressed')!=='true'){
     const selected=$('ss-tabs')?.querySelector('[aria-pressed="true"]')?.dataset.ssTab;
     if(selected&&selected!==tab){scene=selected;document.body.dataset.arcadeScene=selected;renderTabs();}
    }
   }
  }
 }
 updatePlatePaging();updateScorePills();
}
function pagerSelector(){
 if(active==='plates'&&scene==='vote')return '#plate-list > .plate-card';
 if(active==='streetrod'&&scene==='paper')return '#ss-scene .ss-ad';
 if(active==='streetrod'&&scene==='diner')return '#ss-scene .ss-rival';
 return null;
}
function updatePlatePaging(){
 const paging=$('arcade-hud-paging'),selector=pagerSelector();
 if(!paging||!selector)return;
 const cards=Array.from(document.querySelectorAll(selector));
 plateIndex=Math.max(0,Math.min(plateIndex,Math.max(cards.length-1,0)));
 cards.forEach((c,i)=>c.classList.toggle('arcade-current-card',i===plateIndex));
 $('arcade-hud-pagecount').textContent=cards.length?(plateIndex+1)+' / '+cards.length:'NO ENTRIES';
 paging.querySelector('[data-arcade-action="previous"]').disabled=plateIndex===0;
 paging.querySelector('[data-arcade-action="next"]').disabled=plateIndex>=cards.length-1;
}
function paging(delta){
 const selector=pagerSelector();if(!selector)return;
 const max=document.querySelectorAll(selector).length;
 plateIndex=Math.max(0,Math.min(plateIndex+delta,Math.max(max-1,0)));updatePlatePaging();
}
function showOptions(){
 if(!menu||!document.body.classList.contains('arcade-on'))return;
 returnMode=mode;mode='options';menu.hidden=false;
 $('arcade-menu-view').hidden=true;$('arcade-options-view').hidden=false;hud.hidden=true;
 for(const g of games)$(g.root)?.classList.remove('arcade-game-active');
 const options=$('arcade-options-form');
 const choices=[
  ['contrast','DISPLAY PALETTE',[['ega','CLASSIC EGA'],['bright','BRIGHT HIGH CONTRAST']]],
  ['size','TEXT SIZE',[['normal','STANDARD'],['large','LARGER TEXT']]],
  ['motion','SCREEN MOTION',[['normal','NORMAL'],['reduce','REDUCED MOTION']]]
 ];
 options.innerHTML=choices.map(([field,label,values])=>
  '<fieldset><legend>'+label+'</legend>'+values.map(([value,name])=>
   '<label><input type="radio" name="'+field+'" value="'+value+'" '+(settings[field]===value?'checked':'')+'><span>'+name+'</span></label>'
  ).join('')+'</fieldset>'
 ).join('');
 options.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{
  settings[input.name]=input.value;saveSettings();
 }));
 options.querySelector('input:checked')?.focus({preventScroll:true});
}
function backOptions(){
 $('arcade-options-view').hidden=true;
 if(returnMode==='game'&&active){
  mode='game';menu.hidden=true;hud.hidden=false;makeVisible(game(active));renderTabs();sync();
 }else{closeArcade();}
}
function onMenuClick(e){
 const target=e.target.closest('[data-arcade-game], [data-arcade-scene], [data-arcade-action]');
 if(!target||target.disabled)return;
 if(target.dataset.arcadeGame){
  if(mode!=='menu'||$('arcade-menu-view')?.hidden)return;
  launch(target.dataset.arcadeGame);return;
 }
 if(target.dataset.arcadeScene){
  if(mode!=='game')return;
  view(target.dataset.arcadeScene);return;
 }
 if(mode==='options'&&target.dataset.arcadeAction!=='options-back')return;
 switch(target.dataset.arcadeAction){
  case 'home':closeArcade();break;
  case 'exit':closeArcade();break;
  case 'options':showOptions();break;
  case 'options-back':backOptions();break;
  case 'scene-previous':stepScene(-1);break;
  case 'scene-next':stepScene(1);break;
  case 'previous':paging(-1);break;
  case 'next':paging(1);break;
 }
}
function onKeyDown(e){
 if(!document.body.classList.contains('arcade-on')||document.querySelector('.sr-dos-overlay'))return;
 if(e.key==='F2'){e.preventDefault();mode==='options'?backOptions():showOptions();return;}
 if(e.key==='Escape'){
  if(document.querySelector('dialog[open]'))return;
  // Let the active racing display handle ESC first; MENU remains available.
  if(e.target?.closest('input,textarea,select')){e.target.blur();return;}
  e.preventDefault();
  if(mode==='options')backOptions();else closeArcade();
 }
}
// Existing game menus update the arcade scene indicator without replacing their events.
document.addEventListener('click',e=>{
 if(active!=='streetrod'||mode!=='game')return;
 const tab=e.target.closest?.('#ss-tabs button[data-ss-tab]');
 const target=e.target.closest?.('#streetrod-summer [data-ss-action="navigate"]');
 const next=tab?.dataset.ssTab||target?.dataset.target;
 if(next&&pageLabels().some(([name])=>name===next)){scene=next;document.body.dataset.arcadeScene=scene;plateIndex=0;renderTabs();}
},true);
// License cards are re-rendered on server refresh, so reselect the visible card.
const watchCards=new MutationObserver(()=>{if(pagerSelector())updatePlatePaging();});
const entryButtons=games.filter(g=>g.toggle).map(g=>'#'+g.toggle).join(',');
function boardGameClick(e){
 if(document.body.classList.contains('arcade-on')||board?.hidden)return;
 const button=e.target?.closest?.(entryButtons);
 if(!button||!board.contains(button)||button.disabled)return;
 const g=games.find(g=>g.toggle===button.id);
 if(!g||!available(g))return;
 // Capture on window before original modules' document handlers and DOS boot.
 e.preventDefault();e.stopImmediatePropagation();
 launch(g.id);
}

function start(){
 if(!board||!config?.enabled)return;
 build();
 window.addEventListener('click',boardGameClick,true);
 const timer=setInterval(()=>{
  if(!board.isConnected){clearInterval(timer);return;}
  if(!menu)build();
  const list=$('plate-list');
  if(list&&!list.dataset.arcadeObserved){list.dataset.arcadeObserved='1';watchCards.observe(list,{childList:true});}
  if(active&&mode==='game')sync();
 },900);
}
start();
