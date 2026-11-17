/* Member-only FAMILY FUN arcade marquee. Data arrives only from the approved
 * Family Board classic-score reader; never from external ROM files.
 */
import {CLASSIC_TITLES,classicProgress} from './classic-arcade-catalog.mjs?v=classic1';
const games=CLASSIC_TITLES;
const empty=Object.fromEntries(games.map(g=>[g.id,[]]));
let state={rows:empty,mine:{},status:'Open a classic cabinet or choose FAMILY SCORES to see player-reported records.'};
let selected='galaga',root=null;
const el=(name,cls,content)=>{
 const node=document.createElement(name);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=String(content);
 return node;
};
const fmt=n=>Number(n||0).toLocaleString();
function addGameTabs(bar){
 for(const g of games){
  const button=el('button','family-fun-tab',g.name);
  button.type='button';button.dataset.familyFunGame=g.id;
  button.addEventListener('click',()=>{selected=g.id;render();});
  bar.append(button);
 }
}
export function mountFamilyFun(menu){
 // The original DOS program menu is intentionally hidden by the native
 // family-game launcher. Place this scoreboard on the visible Family Board.
 const main=document.getElementById('conversations')?.querySelector('.community-main');
 const host=main||menu?.querySelector('#arcade-menu-view');
 if(!host)return;
 if(root?.isConnected)return;
 root=el('section','family-fun-scoreboard');root.id='arcade-family-fun';
 root.setAttribute('aria-labelledby','family-fun-marquee-name');
 const heading=el('div','family-fun-heading');
 heading.append(el('div','family-fun-stars','✦  ★  ✧  ★  ✦'));
 const title=el('h1','family-fun-marquee','FAMILY FUN');title.id='family-fun-marquee-name';
 heading.append(title,el('p','family-fun-subtitle','ARCADE HIGH SCORES  ·  ACHIEVEMENTS  ·  UNLOCKABLES'));
 const banner=el('div','family-fun-score-light');
 banner.append(el('strong','','★ HIGH SCORES ★'),el('span','','PERSONAL BESTS · FRIENDLY FAMILY COMPETITION'));
 const tabs=el('nav','family-fun-tabs');tabs.setAttribute('aria-label','Choose family high score game');addGameTabs(tabs);
 const board=el('div','family-fun-leaders');board.id='family-fun-leaders';
 const rewards=el('div','family-fun-achievements');rewards.id='family-fun-achievements';
 const foot=el('p','family-fun-provenance','MEMBER-REPORTED SCORES · NOT EMULATOR VERIFIED · ORIGINAL FAMILY RECORDS PRESERVED');
 const stateLine=el('p','family-fun-status');stateLine.id='family-fun-status';stateLine.setAttribute('role','status');
 root.append(heading,banner,tabs,board,rewards,foot,stateLine);
 const firstGame=host.querySelector('#streetrod-root,#dash-forge-root,#skyboard-root,#mahjong-root');
 if(firstGame)firstGame.before(root);else host.prepend(root);
 render();
 window.dispatchEvent(new Event('family-classic-request-scores'));
}
function render(){
 if(!root?.isConnected)return;
 const game=games.find(g=>g.id===selected)||games[0];
 for(const button of root.querySelectorAll('[data-family-fun-game]')){
  button.setAttribute('aria-pressed',String(button.dataset.familyFunGame===selected));
 }
 const host=root.querySelector('#family-fun-leaders');
 host.replaceChildren();
 const list=state.rows[game.id]||[];
 const caption=el('div','family-fun-board-heading');
 caption.append(el('strong','',game.name.toUpperCase()+' · TOP PLAYERS'),
  el('small','','RANK  /  PLAYER  /  SCORE'));
 host.append(caption);
 const podium=el('div','family-fun-podium');
 if(!list.length){
  podium.append(el('p','family-fun-empty','NO SCORES YET · BE THE FIRST ON THE BOARD'));
 }else{
  for(const [i,item] of list.slice(0,5).entries()){
   const r=el('div','family-fun-row'+(i===0?' is-first':''));
   const rank=el('b','family-fun-rank',i===0?'★ 1':'# '+(i+1));
   const who=el('span','family-fun-player',String(item.name||'Family player').slice(0,48));
   const score=el('strong','family-fun-points',fmt(item.points));
   const date=el('small','family-fun-date',item.when?new Date(item.when).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'');
   const tag=el('small','family-fun-tag','REPORTED');
   r.append(rank,who,score,date,tag);podium.append(r);
  }
 }
 host.append(podium);
 const rewards=root.querySelector('#family-fun-achievements');
 rewards.replaceChildren(el('strong','family-fun-milestone-title','MILESTONE ROAD · '+game.name.toUpperCase()));
 const top=Number((state.mine||{})[game.id]||0);
 const goals=classicProgress(game,top,top>0?1:0);
 const strip=el('div','family-fun-milestones');
 for(const goal of goals){
  const medal=el('span','family-fun-medal'+(goal.achieved?' earned':''),
   (goal.achieved?'★ ':'◇ ')+goal.title.toUpperCase());
  medal.title=goal.achieved?'Based on your own member-reported result':'Locked: '+goal.description;
  strip.append(medal);
 }
 strip.append(el('span','family-fun-medal','CABINET THEMES · LOCAL ONLY'));
 rewards.append(strip);
 root.querySelector('#family-fun-status').textContent=state.status;
}
window.addEventListener('family-classic-scores',event=>{
 const d=event.detail;
 if(!d||!d.rows||!d.mine)return;
 state={rows:d.rows,mine:d.mine,status:'Family scores refreshed · all classic figures are member-reported and unverified.'};
 render();
});
window.addEventListener('family-classic-scores-clear',()=>{
 state={rows:empty,mine:{},status:'Family high scores are visible only to approved signed-in family members.'};
 render();
});
window.addEventListener('family-classic-menu-open',()=>{render();window.dispatchEvent(new Event('family-classic-request-scores'));});
