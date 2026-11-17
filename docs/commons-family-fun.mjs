/* FAMILY FUN: two original cabinet marquees, one authenticated family score stream.
 * The arcade menu and Family Board show the same data without leaking game files.
 * Scores are MEMBER-REPORTED, never presented as emulator verified.
 */
import {CLASSIC_TITLES,classicProgress} from './classic-arcade-catalog.mjs?v=classic1';
const empty=()=>Object.fromEntries(CLASSIC_TITLES.map(g=>[g.id,[]]));
let state={rows:empty(),mine:{},status:'Approved family members can share self-reported high scores.'};
let selected='galaga';
const scoreboards=new Set();
const el=(name,cls,content)=>{const node=document.createElement(name);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=String(content);
 return node;
};
const fmt=n=>Number(n||0).toLocaleString('en-US');
function createMarquee(){
 const root=el('section','family-fun-scoreboard');
 root.setAttribute('aria-label','FAMILY FUN Arcade High Scores');
 const heading=el('div','family-fun-heading');
 heading.append(el('div','family-fun-stars','✦  ★  ✧  ★  ✦'),
   el('h2','family-fun-marquee','FAMILY FUN'),
   el('p','family-fun-subtitle','ARCADE HIGH SCORES  ·  ACHIEVEMENTS  ·  UNLOCKABLES'));
 const banner=el('div','family-fun-score-light');
 banner.append(el('strong','','★ HIGH SCORES ★'),
   el('span','','PERSONAL BESTS · FRIENDLY FAMILY COMPETITION'));
 const tabs=el('nav','family-fun-tabs');
 tabs.setAttribute('aria-label','Choose a family high-score game');
 for(const g of CLASSIC_TITLES){
  const button=el('button','family-fun-tab',g.name);
  button.type='button';button.dataset.familyFunGame=g.id;
  button.addEventListener('click',()=>{selected=g.id;render();});
  tabs.append(button);
 }
 const leaders=el('div','family-fun-leaders');
 const rewards=el('div','family-fun-achievements');
 const provenance=el('p','family-fun-provenance',
   'FAMILY-REPORTED, NOT VERIFIED · LEGACY ORIGINAL SCORES ARCHIVED · NO OFFICIAL TROPHIES');
 const status=el('p','family-fun-status');
 status.setAttribute('role','status');
 root.append(heading,banner,tabs,leaders,rewards,provenance,status);
 return root;
}
export function mountFamilyFun(menu){
 const main=document.getElementById('conversations')?.querySelector('.community-main');
 const cabinet=menu?.querySelector('#arcade-menu-view');
 if(main&&!main.querySelector('.family-fun-scoreboard')){
  const board=createMarquee();
  board.id='arcade-family-fun';
  const first=main.querySelector('#streetrod-root,#dash-forge-root,#skyboard-root,#mahjong-root');
  if(first)first.before(board);else main.prepend(board);
  scoreboards.add(board);
 }
 if(cabinet&&!cabinet.querySelector('.family-fun-scoreboard')){
  const mini=createMarquee();
  mini.classList.add('family-fun-in-menu');
  cabinet.prepend(mini);
  scoreboards.add(mini);
 }
 render();
 window.dispatchEvent(new Event('family-classic-request-scores'));
}
function render(){
 const g=CLASSIC_TITLES.find(x=>x.id===selected)||CLASSIC_TITLES[0];
 for(const root of scoreboards){
  if(!root.isConnected){scoreboards.delete(root);continue;}
  for(const button of root.querySelectorAll('[data-family-fun-game]'))
   button.setAttribute('aria-pressed',String(button.dataset.familyFunGame===selected));
  const host=root.querySelector('.family-fun-leaders');
  host.replaceChildren();
  const heading=el('div','family-fun-board-heading');
  heading.append(el('strong','',g.name.toUpperCase()+' · TOP PLAYERS'),
    el('small','','RANK / PLAYER / SCORE'));
  host.append(heading);
  const list=state.rows[g.id]||[];
  const podium=el('div','family-fun-podium');
  if(!list.length)podium.append(el('p','family-fun-empty','NO SCORES YET · CLAIM THE FIRST SPACE'));
  for(const [i,item] of list.slice(0,5).entries()){
   const rank=el('b','family-fun-rank',i===0?'★ 1':'# '+(i+1));
   const who=el('span','family-fun-player',String(item.name||'Family player').slice(0,48));
   const points=el('strong','family-fun-points',fmt(item.points));
   const date=el('small','family-fun-date',
     item.when&&Number.isFinite(Date.parse(item.when))?
      new Date(item.when).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'');
   const tag=el('small','family-fun-tag','REPORTED');
   const row=el('div','family-fun-row'+(i===0?' is-first':''));
   row.append(rank,who,points,date,tag);podium.append(row);
  }
  host.append(podium);
  const rewards=root.querySelector('.family-fun-achievements');
  rewards.replaceChildren(el('strong','family-fun-milestone-title',
   'MILESTONE ROAD · '+g.name.toUpperCase()));
  const top=Number(state.mine[g.id]||0);
  const strip=el('div','family-fun-milestones');
  for(const goal of classicProgress(g,top,top>0?1:0)){
   const item=el('span','family-fun-medal'+(goal.achieved?' earned':''),
     (goal.achieved?'★ ':'◇ ')+goal.title.toUpperCase());
   item.title=goal.achieved?'Based on self-reported results':'Locked: '+goal.description;
   strip.append(item);
  }
  strip.append(el('span','family-fun-medal','CABINET THEMES · LOCAL ONLY'));
  rewards.append(strip);
  root.querySelector('.family-fun-status').textContent=state.status;
 }
}
window.addEventListener('family-classic-scores',event=>{
 const data=event.detail;
 if(!data||!data.rows||!data.mine)return;
 state={rows:data.rows,mine:data.mine,status:'Refreshed · classic scores are reported, not replay-verified'};
 render();
});
window.addEventListener('family-classic-scores-clear',()=>{
 state={rows:empty(),mine:{},status:'Approved members only. Sign in to view family scores.'};
 render();
});
window.addEventListener('family-classic-menu-open',()=>{
 render();window.dispatchEvent(new Event('family-classic-request-scores'));
});
