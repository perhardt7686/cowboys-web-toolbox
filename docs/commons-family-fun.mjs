/* FAMILY FUN arcade display for the original server-verified family games.
 * The four experimental commercial classic cabinets were retired by owner request.
 * No family member data is fetched here. Approved-member retro game publishes
 * a limited verified-score snapshot, and sign-out erases the shared display.
 */
const GAMES=Object.freeze([
 {id:'fleet',name:'Star Squadron',toggle:'star-squadron-toggle',tag:'SWARM DEFENSE'},
 {id:'maze',name:'Mystery Maze',toggle:'mystery-maze-toggle',tag:'CLUE CHASE'}
]);
let selected='fleet',roots=[],snapshot=null;
const el=(tag,cls,value)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(value!==undefined)n.textContent=String(value);
 return n;
};
function makeMarquee(){
 const root=el('section','family-fun-scoreboard');
 root.setAttribute('aria-label','FAMILY FUN Arcade High Scores');
 const heading=el('div','family-fun-heading');
 heading.append(el('div','family-fun-stars','✦  ★  ✧  ★  ✦'),
   el('h2','family-fun-marquee','FAMILY FUN'),
   el('p','family-fun-subtitle','ARCADE HIGH SCORES  ·  TROPHIES  ·  FAMILY CHAMPIONS'));
 const banner=el('div','family-fun-score-light');
 banner.append(el('strong','','★ VERIFIED HIGH SCORES ★'),
   el('span','','ORIGINAL FAMILY GAMES · NO ROM LOADING'));
 const tabs=el('nav','family-fun-tabs');tabs.setAttribute('aria-label','Select a family arcade game');
 for(const g of GAMES){
  const button=el('button','family-fun-tab',g.name);
  button.type='button';button.dataset.familyFunGame=g.id;
  button.addEventListener('click',()=>{selected=g.id;render();});
  tabs.append(button);
 }
 const leaders=el('div','family-fun-leaders');
 const trophies=el('div','family-fun-achievements');
 const foot=el('p','family-fun-provenance',
  'SCORES FROM SERVER-VERIFIED ORIGINAL GAME ROUNDS · ONLY APPROVED MEMBERS CAN VIEW');
 const status=el('p','family-fun-status');status.setAttribute('role','status');
 root.append(heading,banner,tabs,leaders,trophies,foot,status);
 return root;
}
export function mountFamilyFun(menu){
 const main=document.getElementById('conversations')?.querySelector('.community-main');
 const cabinet=menu?.querySelector('#arcade-menu-view');
 if(main&&!main.querySelector('#arcade-family-fun')){
  const root=makeMarquee();root.id='arcade-family-fun';
  const first=main.querySelector('#streetrod-root,#dash-forge-root,#skyboard-root,#mahjong-root');
  if(first)first.before(root);else main.prepend(root);
  roots.push(root);
 }
 if(cabinet&&!cabinet.querySelector('.family-fun-in-menu')){
  const root=makeMarquee();root.classList.add('family-fun-in-menu');
  cabinet.prepend(root);roots.push(root);
 }
 render();
}
function render(){
 const game=GAMES.find(g=>g.id===selected)||GAMES[0];
 for(const root of roots){
  if(!root.isConnected)continue;
  for(const button of root.querySelectorAll('[data-family-fun-game]'))
   button.setAttribute('aria-pressed',String(button.dataset.familyFunGame===selected));
  const leaders=root.querySelector('.family-fun-leaders');
  leaders.replaceChildren();
  const title=el('div','family-fun-board-heading');
  title.append(el('strong','',game.name.toUpperCase()+' · FAMILY RANKINGS'),
    el('small','','RANK / PLAYER / VERIFIED SCORE'));
  leaders.append(title);
  const list=snapshot?.leaders?.[game.id]||[];
  const podium=el('div','family-fun-podium');
  if(!snapshot)podium.append(el('p','family-fun-empty','SIGN IN TO SEE VERIFIED FAMILY SCORES'));
  else if(!list.length)podium.append(el('p','family-fun-empty','NO SCORES YET · BE THE FIRST FAMILY CHAMPION'));
  else for(const [i,p] of list.slice(0,5).entries()){
   const row=el('div','family-fun-row'+(i===0?' is-first':''));
   row.append(el('b','family-fun-rank',i===0?'★ 1':'# '+(i+1)),
    el('span','family-fun-player',String(p.name||'Family player').slice(0,48)),
    el('strong','family-fun-points',Number(p.best||0).toLocaleString('en-US')),
    el('small','family-fun-tag','VERIFIED'));
   podium.append(row);
  }
  leaders.append(podium);
  const achievements=root.querySelector('.family-fun-achievements');
  achievements.replaceChildren(el('strong','family-fun-milestone-title',
    'TROPHY CABINET · '+game.name.toUpperCase()));
  const strip=el('div','family-fun-milestones');
  const earned=new Set(snapshot?.trophies?.[game.id]||[]);
  for(const trophy of ['first-run','bronze','silver','gold','legendary']){
   const item=el('span','family-fun-medal'+(earned.has(trophy)?' earned':''),
    (earned.has(trophy)?'★ ':'◇ ')+(trophy==='first-run'?'FIRST RUN':trophy.toUpperCase()));
   strip.append(item);
  }
  achievements.append(strip);
  const actions=el('div','family-fun-actions');
  const play=el('button','family-fun-play','PLAY '+game.name.toUpperCase());
  play.type='button';
  play.addEventListener('click',()=>document.getElementById(game.toggle)?.click());
  actions.append(play);
  achievements.append(actions);
  root.querySelector('.family-fun-status').textContent=snapshot?
   'Scores and trophies verified by the Family Arcade server.':
   'Approved family account required for private high scores.';
 }
}
window.addEventListener('family-retro-scoreboard',event=>{
 const d=event.detail;
 if(!d||!d.leaders||!d.trophies)return;
 snapshot=d;render();
});
window.addEventListener('family-retro-scoreboard-clear',()=>{snapshot=null;render();});
