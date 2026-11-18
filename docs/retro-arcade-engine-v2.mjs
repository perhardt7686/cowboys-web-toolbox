/* ORIGINAL ARCADE GAMEPLAY V2: versioned deterministic rules.
 * Does NOT mutate V1 scores, family trophies, level records or replay RPCs.
 * Match any V2 changes against community_retro_replay_v2 in the SQL migration.
 */
import {RETRO_MAZE,initialRetro,RETRO_GAME_RULES} from './retro-arcade-engine.mjs?v=arcade2';

export const RETRO_V2_RULES=Object.freeze({
 fleet:Object.freeze({...RETRO_GAME_RULES.fleet,version:2,waveTicks:12,targetsPerWave:3}),
 maze:Object.freeze({...RETRO_GAME_RULES.maze,version:2,ghostCount:3,phaseTicks:32})
});
const DIRS=Object.freeze([[1,0],[0,1],[-1,0],[0,-1]]);
const STEPS={R:[1,0],D:[0,1],L:[-1,0],U:[0,-1]};
const HOME=Object.freeze([{x:13,y:1},{x:13,y:13},{x:7,y:7}]);
const SCATTER=Object.freeze([{x:13,y:1},{x:13,y:13},{x:1,y:13}]);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const open=(x,y)=>RETRO_MAZE[y]?.[x]!==undefined&&RETRO_MAZE[y][x]!=='#';

export function fleetTargetsV2(tick,seed){
 const t=Math.max(0,Math.floor(tick)),wave=Math.floor(t/12),age=t%12;
 return Array.from({length:3},(_,index)=>{
   const begin=1+index*3,end=begin+3;
   return {
     id:wave*3+index,wave,index,age,
     lane:(seed+wave*5+index*3)%9,
     active:age>=begin&&age<=end,
     impact:age===end,
     boss:wave%5===4&&index===1,
     progress:clamp((age-begin)/3,0,1)
   };
 });
}

export function mazePhaseV2(tick,power){
 return power>0?'frightened':Math.floor(tick/32)%4===0?'scatter':'chase';
}

export function mazeGhostGoalV2(index,player,move,phase){
 const x=player.x,y=player.y;
 if(phase==='scatter')return SCATTER[index]||SCATTER[0];
 if(index===0)return {x,y}; // direct hunter
 if(index===1){ // ambusher aims two cells ahead of the player
   const [dx,dy]=STEPS[move]||[1,0];
   return {x:clamp(x+2*dx,1,13),y:clamp(y+2*dy,1,13)};
 }
 // flanker approaches from the opposite quadrant, without teleporting
 return {x:clamp(x+(x>=7?-4:4),1,13),y:clamp(y+(y>=7?-3:3),1,13)};
}

export function mazeGhostStepV2(ghost,index,tick,seed,player,move,phase){
 if(phase==='frightened' ? tick%3!==0 : tick%2!==0)return {...ghost};
 const target=phase==='frightened'?player:mazeGhostGoalV2(index,player,move,phase);
 let best=null,bestMetric=phase==='frightened'?-1:10000;
 for(let n=0;n<4;n++){
   const [dx,dy]=DIRS[(n+index+tick+seed)%4];
   const x=ghost.x+dx,y=ghost.y+dy;
   if(!open(x,y))continue;
   const metric=Math.abs(x-target.x)+Math.abs(y-target.y);
   const improved=phase==='frightened'?metric>bestMetric:metric<bestMetric;
   if(improved){best={x,y};bestMetric=metric;}
 }
 return best||{...ghost};
}

export function initialRetroV2(game,seed=0){
 if(!Number.isInteger(seed)||seed<0||seed>96)throw new Error('Invalid V2 seed');
 const s=initialRetro(game,seed);
 if(game==='fleet')return {...s,version:2,captured:false,rescues:0};
 return {...s,version:2,ghosts:HOME.map(g=>({...g})),ghostsEaten:0,phase:'scatter'};
}

function stepFleetV2(state,move){
 const t=state.tick;
 const targets=fleetTargetsV2(t,state.seed);
 let lane=state.lane,score=state.score,lives=state.lives;
 let captured=state.captured,rescues=state.rescues;
 if(move==='L'||move==='A')lane=Math.max(0,lane-1);
 if(move==='R'||move==='D')lane=Math.min(8,lane+1);
 const fire=['F','A','D'].includes(move);
 let destroyed=state.destroyed;
 const events=[];
 const target=fire?targets.find(e=>e.active&&lane===e.lane&&!destroyed.includes(e.id)):null;
 if(target){
   destroyed=[...destroyed,target.id];
   score+=target.boss?90:20+10*target.index;
   events.push(target.boss?'commander':'hit');
   if(target.boss&&captured){
     captured=false;rescues++;lives=Math.min(3,lives+1);
     score+=100;events.push('rescue');
   }
 }
 for(const enemy of targets){
   if(enemy.impact&&enemy.lane===lane&&!destroyed.includes(enemy.id)){
     lives=Math.max(0,lives-1);
     if(enemy.boss&&lives>0){captured=true;events.push('capture');}
     else events.push('crash');
   }
 }
 return {...state,lane,destroyed,score,lives,captured,rescues,events,
   prevAction:move,tick:t+1,done:lives===0||t+1>=RETRO_V2_RULES.fleet.steps};
}

function stepMazeV2(state,move){
 const t=state.tick;
 let {x,y,score,lives,power,dots,ghostsEaten}=state;
 const [dx,dy]=STEPS[move]||[0,0];
 if(open(x+dx,y+dy)){x+=dx;y+=dy;}
 const key=x+','+y;
 const unseen=!state.seen.includes(key);
 const seen=unseen?[...state.seen,key]:state.seen;
 const events=[];
 if(unseen){
   const cell=RETRO_MAZE[y][x];
   score+=cell==='o'?50:10;
   dots++;
   events.push(cell==='o'?'power':'dot');
   if(cell==='o')power=32;
 }
 if(power>0)power--;
 const phase=mazePhaseV2(t,power);
 let ghosts=state.ghosts.map((g,i)=>mazeGhostStepV2(g,i,t,state.seed,{x,y},move,phase));
 const collisions=[];
 for(let i=0;i<ghosts.length;i++)
   if(ghosts[i].x===x&&ghosts[i].y===y)collisions.push(i);
 if(collisions.length){
   if(power>0){
     for(const i of collisions){
       score+=75;ghostsEaten++;
       ghosts[i]={...HOME[i]};
     }
     events.push('scare');
   }else{
     lives=Math.max(0,lives-1);x=1;y=1;
     ghosts=HOME.map(g=>({...g}));events.push('crash');
   }
 }
 return {...state,x,y,score,lives,power,dots,seen,ghosts,ghostsEaten,phase,
   events,prevAction:move,tick:t+1,
   done:lives===0||t+1>=RETRO_V2_RULES.maze.steps||dots>=106};
}

export function retroStepV2(state,action='N'){
 if(state.done)return state;
 if(state.version!==2||!RETRO_V2_RULES[state.game])
   throw new Error('Not a version 2 arcade session');
 const move=RETRO_V2_RULES[state.game].controls.includes(action)?action:'N';
 return state.game==='fleet'?stepFleetV2(state,move):stepMazeV2(state,move);
}

export function retroReplayV2(game,seed,actions){
 if(!RETRO_V2_RULES[game]||typeof actions!=='string'||
    actions.length>RETRO_V2_RULES[game].steps)
   throw new Error('Invalid V2 arcade controls');
 let state=initialRetroV2(game,seed);
 for(const action of actions){
   if(!RETRO_V2_RULES[game].controls.includes(action))throw new Error('Invalid V2 action');
   if(state.done)throw new Error('V2 run continued after game over');
   state=retroStepV2(state,action);
 }
 return state;
}
