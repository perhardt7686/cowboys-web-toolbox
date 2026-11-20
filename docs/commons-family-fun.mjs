/* Cowboy's Family Universe | ONE compact marquee for all active family arcade games.
 * Authenticated game modules supply their own server-verified ranking slices.
 * Never compare incompatible score units or grant cosmetics from a client score.
 */
import {retroUnlocks} from './retro-game-unlockables.mjs?v=gear1';
import {sortGamesByRecent,mostRecentGame,formatEasternStamp,readGameActivity} from './family-arcade-activity.mjs';
export const FAMILY_FUN_GAMES=Object.freeze([
 {id:'streetrod',name:'Street Rod',toggle:'sr-toggle',source:'family',key:'hotrod',unit:'career points',mark:'▣'},
 {id:'dashforge',name:'Dash Forge',toggle:'dash-forge-toggle',source:'game',unit:'runner points',mark:'◆'},
 {id:'skyboard',name:'Skyboard Sprint',toggle:'skyboard-toggle',source:'game',unit:'points',mark:'✦'},
 {id:'fleet',name:'Star Squadron',toggle:'star-squadron-toggle',source:'retro',unit:'points',mark:'✶'},
 {id:'maze',name:'Mystery Maze',toggle:'mystery-maze-toggle',source:'retro',unit:'points',mark:'◉'},
 {id:'mahjong',name:'Mahjong',toggle:'mahjong-toggle',source:'family',unit:'best score',mark:'◇'},
 {id:'wordle',name:'w0rdle',toggle:'letter-lock-toggle',source:'family',unit:'points',mark:'▤'},
 {id:'wordquest',name:'Word Quest',toggle:'word-game-toggle',source:'family',unit:'points',mark:'▥'},
 {id:'plates',name:'License Plates',toggle:'plate-game-open',source:'family',unit:'points',mark:'▧'},
 {id:'drawing',name:'Drawing Studio',toggle:'drawing-studio-toggle',source:'personal',unit:'creative saves',mark:'▦'},
 {id:'study',name:'7A Study Cards',toggle:'vdacs-study-toggle',source:'personal',unit:'learning progress',mark:'▨'}
]);
let selected='all',root=null,hostMenu=null,member=null;
let family=null,retro=null,extra=Object.create(null),activity=Object.create(null),activityAt=null;
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(txt!==undefined)node.textContent=String(txt);return node;
};
function sanitizeEntries(entries){
 if(!Array.isArray(entries))return [];
 return entries.slice(0,12).filter(item=>item&&typeof item==='object').map((item,index)=>({
  rank:Number.isFinite(Number(item.rank))?Math.max(1,Number(item.rank)):index+1,
  name:String(item.name||'Family member').slice(0,48),
  score:Number.isFinite(Number(item.score))?Number(item.score):0,
  mine:Boolean(item.mine)
 }));
}
function freshOwner(id){
 if(!id||typeof id!=='string')return false;
 if(member&&member!==id){family=null;retro=null;extra=Object.create(null);activity=Object.create(null);activityAt=null;}
 member=id;return true;
}
function clearAll(){
 member=null;family=null;retro=null;extra=Object.create(null);activity=Object.create(null);activityAt=null;render();
}
function getData(game){
 if(!member)return {state:'login',entries:[]};
 if(game.source==='personal')return {state:'personal',entries:[]};
 if(game.source==='family'){
  if(!family)return {state:'pending',entries:[]};
  if(game.id==='plates'&&!family.plateAccess)return {state:'restricted',entries:[]};
  const data=family.games?.[game.key||game.id];
  return data?{state:'verified',entries:data.entries,unit:game.unit}:{state:'pending',entries:[]};
 }
 if(game.source==='retro'){
  if(!retro)return {state:'pending',entries:[]};
  return {state:'verified',entries:sanitizeEntries(
   (retro.leaders?.[game.id]||[]).map(entry=>({...entry,score:entry.best})))};
 }
 return extra[game.id]||{state:'pending',entries:[]};
}
function sourceText(state){
 return ({login:'Sign in to view',pending:'Checking saved results',verified:'Server verified',
  restricted:'Private game scores',personal:'Progress inside game'})[state]||'Not available';
}
function build(){
 root=el('section','family-fun-scoreboard family-fun-single');
 root.id='arcade-family-fun';
 root.setAttribute('aria-label','FAMILY FUN unified arcade marquee and game scores');
 const heading=el('header','family-fun-heading');
 const badge=el('div','family-fun-brand');
 badge.append(el('span','family-fun-cabinet-sign','★ FAMILY FUN ★'),
  el('small','family-fun-subtitle','ONE FAMILY ARCADE · ALL GAMES'));
 const controls=el('div','family-fun-controls');
 const picker=el('select','family-fun-picker');picker.id='family-fun-game-picker';
 picker.setAttribute('aria-label','Choose game to view family scores');
 for(const game of [{id:'all',name:'All games'},...FAMILY_FUN_GAMES]){
  const option=el('option','',game.name);option.value=game.id;picker.append(option);
 }
 picker.addEventListener('change',()=>{selected=picker.value;render();});
 const home=el('button','family-fun-home','All games');home.type='button';
 home.addEventListener('click',()=>{selected='all';render();});
 controls.append(picker,home);heading.append(badge,controls);
 const content=el('div','family-fun-content');
 const footer=el('div','family-fun-footer');
 const play=el('button','family-fun-play','PLAY');play.type='button';
 play.addEventListener('click',()=>{
  const game=FAMILY_FUN_GAMES.find(g=>g.id===selected);
  if(!game)return;
  const cabinet=hostMenu?.querySelector('#arcade-program-grid button[data-arcade-game="'+game.id+'"]');
  const view=hostMenu?.querySelector('#arcade-menu-view');
  if(hostMenu&&!hostMenu.hidden&&view&&!view.hidden&&cabinet&&!cabinet.disabled){
   cabinet.click();return;
  }
  const launch=$(game.toggle);
  if(launch&&!launch.disabled&&!document.getElementById('conversations')?.hidden)launch.click();
 });
 const status=el('span','family-fun-status');status.setAttribute('role','status');
 footer.append(status,play);
 root.append(heading,content,footer);
}
function dock(){
 if(!root)return;
 const board=$('conversations'),view=hostMenu?.querySelector('#arcade-menu-view');
 const showMenu=Boolean(hostMenu&&!hostMenu.hidden&&view&&!view.hidden);
 const target=showMenu?view:board;
 if(!target)return;
 if(root.parentElement!==target||target.firstElementChild!==root)target.prepend(root);
 root.classList.toggle('family-fun-in-menu',showMenu);
}
export function mountFamilyFun(menu){
 hostMenu=menu;
 if(!root)build();
 if(menu&&!menu.dataset.familyFunDockObserver){
  menu.dataset.familyFunDockObserver='1';
  const observer=new MutationObserver(dock);
  observer.observe(menu,{attributes:true,attributeFilter:['hidden']});
  const view=menu.querySelector('#arcade-menu-view');
  if(view)observer.observe(view,{attributes:true,attributeFilter:['hidden']});
 }
 dock();render();
}
function renderAll(content){
 const intro=el('p','family-fun-intro','Most recently played game first. Standings remain separate for each title.');
 content.append(intro);
 const rows=el('div','family-fun-all-games');
 const newest=mostRecentGame(FAMILY_FUN_GAMES,activity);
 for(const game of sortGamesByRecent(FAMILY_FUN_GAMES,activity)){
  const info=getData(game),leader=info.entries[0],recent=activity[game.id];
  const featured=newest?.id===game.id;
  const card=el('button','family-fun-game-chip'+(featured?' is-most-recent':''));
  card.type='button';card.dataset.familyFunGame=game.id;
  card.dataset.lastPlayed=recent?.lastPlayedAt||'';
  if(featured)card.dataset.mostRecent='true';
  card.setAttribute('aria-label',game.name+
   (recent?.lastPlayedAt?', last played '+formatEasternStamp(recent.lastPlayedAt)+' by '+recent.lastPlayer:
    ', no verified recent play'));
  const heading=el('div','family-fun-chip-header');
  heading.append(el('strong','',game.mark+' '+game.name));
  if(featured)heading.append(el('b','family-fun-latest-tag','LATEST PLAY'));
  card.append(heading);
  card.append(el('span','family-fun-chip-leader',
   leader?'LEADER '+leader.name+' · '+Number(leader.score).toLocaleString()+' '+game.unit:sourceText(info.state)));
  if(recent?.lastPlayedAt){
   const when=el('time','family-fun-chip-time','PLAYED '+formatEasternStamp(recent.lastPlayedAt));
   when.dateTime=recent.lastPlayedAt;card.append(when);
   card.append(el('small','family-fun-chip-activity',
    'By '+recent.lastPlayer+' · '+Number(recent.actionsToday).toLocaleString()+' family actions today'));
  }else card.append(el('small','family-fun-chip-activity',
   game.source==='personal'?'No linked play-history feed':'No recorded play yet'));
  card.addEventListener('click',()=>{selected=game.id;render();});
  rows.append(card);
 }
 content.append(rows);
}
function renderGame(content,game){
 const info=getData(game);
 const head=el('div','family-fun-game-head');
 head.append(el('strong','',game.mark+' '+game.name),
  el('span','family-fun-verified',sourceText(info.state)));
 content.append(head);
 const recent=activity[game.id];
 const snapshot=el('div','family-fun-game-activity');
 snapshot.append(el('strong','','LATEST FAMILY ACTIVITY'));
 if(recent?.lastPlayedAt){
  const when=el('time','',formatEasternStamp(recent.lastPlayedAt));
  when.dateTime=recent.lastPlayedAt;
  snapshot.append(when,el('span','','Last played by '+recent.lastPlayer));
  snapshot.append(el('span','',
   Number(recent.actionsToday).toLocaleString()+' family actions today · '+
   Number(recent.yourActionsToday).toLocaleString()+' yours'));
  if(recent.yourLastPlayedAt){
   const yours=el('time','','Your most recent: '+formatEasternStamp(recent.yourLastPlayedAt));
   yours.dateTime=recent.yourLastPlayedAt;snapshot.append(yours);
  }
 }else snapshot.append(el('span','',game.source==='personal'?
   'Play history for this activity is not connected.':'No saved play timestamp available for this game.'));
 content.append(snapshot);
 if(info.state==='verified'&&info.entries.length){
  const mine=info.entries.find(e=>e.mine);
  content.append(el('p','family-fun-rank-summary',
   info.entries.length+' ranked family players'+(mine?
    ' · You: #'+mine.rank+' · '+Number(mine.score).toLocaleString()+' '+game.unit:'')));
  const rows=el('ol','family-fun-podium');
  for(const [index,entry] of info.entries.slice(0,5).entries()){
   const item=el('li','family-fun-row'+(index===0?' is-first':''));
   item.append(el('b','family-fun-rank','#'+entry.rank),
    el('span','family-fun-player',entry.name+(entry.mine?' (you)':'')),
    el('strong','family-fun-points',Number(entry.score).toLocaleString()+' '+game.unit));
   rows.append(item);
  }
  content.append(rows);
 }else{
  const message=info.state==='verified'?'No verified family results yet. Be the first to play.':
   info.state==='personal'?'This activity has no comparable family ranking. Open the game for saved progress.':
   info.state==='restricted'?'This game has separate member permissions. No scores are exposed here.':
   info.state==='login'?'Approved family sign-in is required.':'Rankings will appear when the game server responds.';
  content.append(el('p','family-fun-empty',message));
 }
 if(game.source==='retro'&&member){
  const details=el('details','family-fun-rewards');
  details.append(el('summary','','Trophies & game-specific gear'));
  const earned=new Set(retro?.trophies?.[game.id]||[]);
  const trophies=el('div','family-fun-milestones');
  for(const level of ['first-run','bronze','silver','gold','legendary'])
   trophies.append(el('span','family-fun-medal'+(earned.has(level)?' earned':''),
    (earned.has(level)?'★ ':'◇ ')+level.replace('-',' ').toUpperCase()));
  details.append(trophies);
  const gear=el('div','family-fun-gear');
  for(const item of retroUnlocks(game.id)){
   const unlocked=item.need===null||earned.has(item.need);
   const equipped=(retro?.equipped?.[game.id]||retroUnlocks(game.id)[0]?.id)===item.id;
   const button=el('button','family-fun-gear-card'+(equipped?' is-equipped':''));
   button.type='button';button.disabled=!retro||!unlocked;
   button.dataset.familyFunUnlock=item.id;button.setAttribute('aria-pressed',String(equipped));
   button.append(el('strong','',item.name),el('span','',item.description),
    el('small','',!retro?'CHECKING OWNERSHIP':!unlocked?'LOCKED · '+item.need.toUpperCase():
      equipped?'EQUIPPED ✓':'EQUIP'));
   button.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('family-retro-equip-request',{
    detail:{game:game.id,id:item.id}
   })));
   gear.append(button);
  }
  details.append(gear);content.append(details);
 }else if(member){
  content.append(el('p','family-fun-reward-hint','Achievements and equipment remain in their own game until their verified reward feed is linked.'));
 }
}
function render(){
 if(!root)return;
 const picker=root.querySelector('.family-fun-picker');
 // Present the same recency ordering in the game selection dropdown.
 for(const game of sortGamesByRecent(FAMILY_FUN_GAMES,activity)){
  const option=[...picker.options].find(o=>o.value===game.id);
  if(option)picker.append(option);
 }
 picker.value=selected;
 root.querySelector('.family-fun-home').hidden=selected==='all';
 const content=root.querySelector('.family-fun-content');content.replaceChildren();
 const game=FAMILY_FUN_GAMES.find(g=>g.id===selected);
 if(game)renderGame(content,game);else renderAll(content);
 const linked=FAMILY_FUN_GAMES.filter(g=>getData(g).state==='verified').length;
 root.querySelector('.family-fun-status').textContent=member?
  linked+' of '+FAMILY_FUN_GAMES.length+' game rankings linked · '+
  (activityAt?'Activity checked '+formatEasternStamp(activityAt):'Checking play history'):
  'Member-only standings · no public scores';
 const play=root.querySelector('.family-fun-play');
 play.hidden=!game;
 if(game){play.textContent='PLAY '+game.name;play.disabled=!$(game.toggle);}
}
window.addEventListener('family-unified-scoreboard',event=>{
 const d=event.detail;if(!freshOwner(d?.member)||!d?.games)return;
 const games={};
 for(const [key,info] of Object.entries(d.games)){
  if(info&&typeof info==='object')games[key]={entries:sanitizeEntries(info.entries)};
 }
 family={games,plateAccess:Boolean(d.plateAccess),at:d.asOf||null};render();
});
window.addEventListener('family-unified-scoreboard-clear',clearAll);
window.addEventListener('family-retro-scoreboard',event=>{
 const d=event.detail;if(!freshOwner(d?.member)||!d?.leaders||!d?.trophies)return;
 retro=d;render();
});
window.addEventListener('family-retro-scoreboard-clear',clearAll);
window.addEventListener('family-arcade-game-rankings',event=>{
 const d=event.detail;
 if(!freshOwner(d?.member)||!['dashforge','skyboard'].includes(d?.game))return;
 extra[d.game]={state:'verified',entries:sanitizeEntries(d.entries)};
 render();
});
window.addEventListener('family-retro-gear-changed',event=>{
 if(!retro||!event.detail?.game)return;
 retro={...retro,equipped:{...retro.equipped,[event.detail.game]:event.detail.id}};
 render();
});

window.addEventListener('family-arcade-recent-activity',event=>{
 const data=event.detail;
 if(!freshOwner(data?.member)||!data?.games)return;
 activity=readGameActivity(data);
 activityAt=typeof data.asOf==='string'?data.asOf:null;
 render();
});
