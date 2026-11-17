/* ONE top-mounted FAMILY FUN cabinet. Board/arcade never render duplicate boards.
 * Data is provided only by the approved-member, server-verified retro module.
 * Cosmetics are selected locally; trophies remain member-account verified.
 */
import {retroUnlocks} from './retro-game-unlockables.mjs?v=gear1';
const GAMES=Object.freeze([
 {id:'fleet',name:'Star Squadron',toggle:'star-squadron-toggle'},
 {id:'maze',name:'Mystery Maze',toggle:'mystery-maze-toggle'}
]);
let selected='fleet',root=null,hostMenu=null,snapshot=null;
const el=(tag,cls,txt)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(txt!==undefined)n.textContent=String(txt);return n;
};
function build(){
 root=el('section','family-fun-scoreboard family-fun-single');
 root.id='arcade-family-fun';
 root.setAttribute('aria-label','FAMILY FUN High Scores and Game Unlockables');
 const head=el('header','family-fun-heading');
 head.append(el('div','family-fun-stars','★ ✦ ★ ✧ ★'),
  el('h2','family-fun-marquee','FAMILY FUN'),
  el('p','family-fun-subtitle','ARCADE SCOREBOARD · TROPHIES · GAME UNLOCKABLES'));
 const banner=el('div','family-fun-score-light');
 banner.append(el('strong','','★ FAMILY HIGH SCORES ★'),
  el('span','','ONE CABINET · TWO ORIGINAL GAMES'));
 const tabs=el('nav','family-fun-tabs');tabs.setAttribute('aria-label','Choose scoreboard game');
 for(const g of GAMES){
  const b=el('button','family-fun-tab',g.name);b.type='button';
  b.dataset.familyFunGame=g.id;
  b.addEventListener('click',()=>{selected=g.id;render();});
  tabs.append(b);
 }
 const leaders=el('section','family-fun-leaders');leaders.setAttribute('aria-label','Family rankings');
 const trophies=el('section','family-fun-achievements');trophies.setAttribute('aria-label','Trophies and cosmetics');
 const actions=el('div','family-fun-actions');
 const button=el('button','family-fun-play');button.type='button';
 button.addEventListener('click',()=>document.getElementById(GAMES.find(g=>g.id===selected)?.toggle)?.click());
 actions.append(button);
 const status=el('p','family-fun-status');status.setAttribute('role','status');
 root.append(head,banner,tabs,leaders,trophies,actions,
  el('p','family-fun-provenance','VERIFIED RESULTS ONLY · REWARDS ARE GAME-SPECIFIC · FAMILY MEMBERS ONLY'),status);
}
function dock(){
 if(!root)return;
 const main=document.getElementById('conversations')?.querySelector('.community-main');
 const menuView=hostMenu?.querySelector('#arcade-menu-view');
 const showMenu=Boolean(hostMenu&&!hostMenu.hidden&&menuView&&!menuView.hidden);
 const target=showMenu?menuView:main;
 if(!target)return;
 if(root.parentElement!==target||target.firstElementChild!==root)target.prepend(root);
 root.classList.toggle('family-fun-in-menu',showMenu);
}
export function mountFamilyFun(menu){
 hostMenu=menu;
 if(!root)build();
 // Only move the SINGLE scoreboard when the game-selection menu is visible.
 // Its authenticated snapshot, selection, and focusable controls are not cloned.
 if(!menu?.dataset.familyFunDockObserver){
  menu.dataset.familyFunDockObserver='1';
  const observer=new MutationObserver(dock);
  observer.observe(menu,{attributes:true,attributeFilter:['hidden']});
  const view=menu.querySelector('#arcade-menu-view');
  if(view)observer.observe(view,{attributes:true,attributeFilter:['hidden']});
 }
 dock();render();
}
function render(){
 if(!root)return;
 const game=GAMES.find(g=>g.id===selected)||GAMES[0];
 for(const b of root.querySelectorAll('[data-family-fun-game]'))
  b.setAttribute('aria-pressed',String(b.dataset.familyFunGame===selected));
 const leaders=root.querySelector('.family-fun-leaders');leaders.replaceChildren();
 const title=el('div','family-fun-board-heading');
 title.append(el('strong','',game.name.toUpperCase()+' · VERIFIED FAMILY RANKINGS'),
  el('small','','RANK / MEMBER / POINTS'));
 leaders.append(title);
 const list=snapshot?.leaders?.[game.id]||[],podium=el('div','family-fun-podium');
 if(!snapshot)podium.append(el('p','family-fun-empty','SIGN IN AS AN APPROVED MEMBER TO VIEW SCORES'));
 else if(!list.length)podium.append(el('p','family-fun-empty','NO VERIFIED SCORES YET · BE FIRST TO PLAY'));
 else for(const [i,p] of list.slice(0,5).entries()){
  const row=el('div','family-fun-row'+(i===0?' is-first':''));
  row.append(el('b','family-fun-rank',i===0?'★ 1':'# '+(i+1)),
   el('span','family-fun-player',String(p.name||'Family player').slice(0,48)),
   el('strong','family-fun-points',Number(p.best||0).toLocaleString('en-US')),
   el('small','family-fun-tag','VERIFIED'));podium.append(row);
 }
 leaders.append(podium);
 const achievements=root.querySelector('.family-fun-achievements');achievements.replaceChildren();
 achievements.append(el('strong','family-fun-milestone-title',game.name.toUpperCase()+' · TROPHIES & UNLOCKABLES'));
 const earned=new Set(snapshot?.trophies?.[game.id]||[]);
 const strip=el('div','family-fun-milestones');
 for(const trophy of ['first-run','bronze','silver','gold','legendary']){
  const got=earned.has(trophy);
  strip.append(el('span','family-fun-medal'+(got?' earned':''),
   (got?'★ ':'◇ ')+(trophy==='first-run'?'FIRST RUN':trophy.toUpperCase())));
 }
 achievements.append(strip);
 const gear=el('div','family-fun-gear');
 const equipped=snapshot?.equipped?.[game.id]||retroUnlocks(game.id)[0].id;
 for(const item of retroUnlocks(game.id)){
  const unlocked=item.need===null||earned.has(item.need);
  const card=el('button','family-fun-gear-card'+(equipped===item.id?' is-equipped':''));
  card.type='button';
  card.disabled=!snapshot||!unlocked;
  card.dataset.familyFunUnlock=item.id;
  card.setAttribute('aria-pressed',String(equipped===item.id));
  card.append(el('strong','',item.name),
   el('span','',item.description),
   el('small','',!snapshot?'SIGN IN TO EQUIP':!unlocked?'LOCKED · '+item.need.toUpperCase()+' TROPHY':
     equipped===item.id?'EQUIPPED ✓':'EQUIP · '+item.type));
  card.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('family-retro-equip-request',
   {detail:{game:game.id,id:item.id}})));
  gear.append(card);
 }
 achievements.append(gear);
 root.querySelector('.family-fun-play').textContent='PLAY '+game.name.toUpperCase();
 root.querySelector('.family-fun-status').textContent=snapshot?
  'Verified trophies unlock these cosmetics in this game; equipped style is stored on this device.':
  'Your family scores and unlocks appear after approved member sign-in.';
}
window.addEventListener('family-retro-scoreboard',event=>{
 const data=event.detail;if(!data?.leaders||!data?.trophies)return;
 snapshot=data;render();
});
window.addEventListener('family-retro-scoreboard-clear',()=>{snapshot=null;render();});
window.addEventListener('family-retro-gear-changed',event=>{
 if(!snapshot||!event.detail?.game)return;
 snapshot={...snapshot,equipped:{...snapshot.equipped,[event.detail.game]:event.detail.id}};render();
});
