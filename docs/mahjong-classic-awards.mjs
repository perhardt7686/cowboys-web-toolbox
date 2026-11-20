/* Original, zero-license Mahjong celebration and challenge engine.
 * These are browser-local Classic Turtle awards, NOT Commons server badges.
 * Pure catalogue/evaluation routines are separately testable without a browser.
 */
const GRADES=['Starter','Bronze','Silver','Gold','Platinum','Diamond','Master','Legendary','Mythic','Celestial','Impossible'];
const catalogue=[];
const record=(id,title,description,category,metric,target,level=0,unit='count')=>{
 catalogue.push(Object.freeze({id,title,description,category,metric,target,grade:GRADES[Math.min(level,GRADES.length-1)],unit}));
};
function ladder(category,title,metric,targets,unit='count'){
 targets.forEach((target,i)=>record(category+'-'+target,title+' '+target.toLocaleString('en-US'),
  unit==='seconds'?'Clear an entire 144-tile board in '+target+' seconds or less.':
  'Reach '+target.toLocaleString('en-US')+' '+title.toLowerCase()+' '+(target===1?'milestone':'milestones')+'.',
  category,metric,target,i,unit));
}
ladder('pairs','Tile Collector','pairs',[1,5,10,25,50,100,250,500,1000,2500,5000,10000,50000,100000]);
ladder('wins','Turtle Conqueror','wins',[1,2,3,5,10,20,40,75,100,250,500,1000]);
ladder('streak','Perfect Rhythm','bestStreak',[3,5,8,12,16,20,24,36,48,60,72]);
ladder('rush','Lightning Chain','bestRush',[3,5,8,12,16,20,24,36,48,60,72]);
ladder('daily','Daily Adventurer','dailyWins',[1,3,7,14,30,60,100,180,365,1000]);
ladder('daily-chain','Daily Devotion','dailyChain',[2,3,5,7,14,21,30,60,100,365]);
ladder('flawless','Flawless Finish','flawlessWins',[1,2,3,5,10,25,50,100,250]);
ladder('unassisted','Eagle Eyes','unassistedWins',[1,2,3,5,10,25,50,100,250]);
ladder('no-undo','No Looking Back','noUndoWins',[1,2,3,5,10,25,50,100,250]);
ladder('no-pause','Marathon Focus','noPauseWins',[1,3,5,10,25,50,100,250]);
for(const [layout,name] of [['turtle','Shell Master'],['temple','Temple Keeper'],['garden','Garden Guardian']])
 ladder('layout-'+layout,name,'layout'+layout+'Wins',[1,3,5,10,25,50,100,250]);
for(const [kind,name] of [['dragon','Dragon Whisperer'],['wind','Wind Reader'],['flower','Blossom Seeker'],
 ['season','Season Walker'],['bamboo','Bamboo Sage'],['circles','Circle Keeper'],['characters','Script Scholar']])
 ladder('face-'+kind,name,kind+'Pairs',[1,5,10,25,50,100,250,1000]);
for(const [i,seconds] of [1800,1200,900,720,600,480,360,300,240,180,150,120].entries())
 record('speed-'+seconds,'Time Bender '+seconds+'s','Clear 144 tiles in '+seconds+' seconds or less.','speed','bestWinSeconds',seconds,i,'seconds');
/* Turtle-only mastery rituals are verified from full, completed 72-pair deals.
 * No Mystery Road stages, server medals or campaign milestones are involved. */
for(const [kind,name] of [['dragon','Dragon'],['wind','Wind'],['flower','Flower'],['season','Season'],['bamboo','Bamboo'],['circles','Circle'],['characters','Character']]){
 record('ritual-open-'+kind,name+' Overture','Finish a full 144-tile board after opening with a '+name.toLowerCase()+' pair.','turtle-ritual','ritualOpen_'+kind,1,4);
 record('ritual-close-'+kind,name+' Finale','Finish a full 144-tile board with a '+name.toLowerCase()+' pair as the final match.','turtle-ritual','ritualClose_'+kind,1,6);
}
record('ritual-fourfold','Fourfold Overture','Complete a board after matching four different tile families in the first four pairs.','turtle-ritual','ritualFourfold',1,8);
record('ritual-sevenfold','Seven-Family Symphony','Complete a board after matching all seven tile families during the opening twelve pairs.','turtle-ritual','ritualSevenfold',1,10);
export const CLASSIC_AWARDS=Object.freeze(catalogue);
export const CLASSIC_AWARD_COUNT=CLASSIC_AWARDS.length;
export const AWARD_GRADES=Object.freeze(GRADES);
export function awardMetric(stats,award){
 const value=Number(stats?.[award.metric]||0);
 return award.unit==='seconds'?value>0&&value<=award.target?1:0:Math.max(0,value);
}
export function awardEarned(stats,award){
 return award.unit==='seconds'?awardMetric(stats,award)===1:awardMetric(stats,award)>=award.target;
}
export function freshlyEarned(stats,existing=[]){
 const previous=new Set(existing);
 return CLASSIC_AWARDS.filter(award=>!previous.has(award.id)&&awardEarned(stats,award));
}
export function awardLevel(grade){return Math.max(0,AWARD_GRADES.indexOf(grade));}
export function celebrateMahjong(host,{title='GREAT JOB!',subtitle='',grade='Gold',effect='sparkles'}={}){
 if(!host||typeof document==='undefined')return null;
 // An existing animation is dismissed; one achievement never blocks the board.
 for(const item of host.querySelectorAll(':scope > .mahjong-spectacle'))item.remove();
 const scene=document.createElement('div');
 scene.className='mahjong-spectacle';
 scene.dataset.grade=grade.toLowerCase();
 scene.setAttribute('aria-hidden','true');
 const words=document.createElement('div');words.className='mahjong-spectacle-words';
 const heading=document.createElement('strong');heading.textContent=title;
 const supporting=document.createElement('span');supporting.textContent=subtitle;
 words.append(heading,supporting);scene.append(words);
 const count=effect==='confetti'?32:16;
 for(let i=0;i<count;i++){
  const bit=document.createElement('i');bit.className='mahjong-spectacle-bit';
  const angle=(i*2.39996),radius=55+(i%7)*18;
  bit.style.setProperty('--mx',Math.round(Math.cos(angle)*radius)+'px');
  bit.style.setProperty('--my',Math.round(Math.sin(angle)*radius)+'px');
  bit.style.setProperty('--rotate',((i*43)%270)+'deg');
  bit.style.setProperty('--delay',(i%7)*28+'ms');
  bit.dataset.effect=effect;scene.append(bit);
 }
 host.append(scene);
 const reduced=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const cleanup=()=>scene.remove();
 const timer=window.setTimeout(cleanup,reduced?1250:2050);
 scene.addEventListener('animationend',event=>{if(event.target===words){window.clearTimeout(timer);cleanup();}},{once:true});
 return scene;
}
