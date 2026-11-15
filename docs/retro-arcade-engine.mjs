/* Original family arcade rules, shared by the renderers and JS tests.
 * Final trophies/scores are independently replayed by the PostgreSQL backend.
 * No proprietary characters, soundtracks, sprites or maze layouts.
 */
export const RETRO_MAZE=Object.freeze([
 '###############',
 '#.............#',
 '#.###.###.###.#',
 '#o...#...#...o#',
 '###.#.#.#.#.###',
 '#...#...#.#...#',
 '#.#.###.#.#.#.#',
 '#.#.....#...#.#',
 '#.###.###.###.#',
 '#...#...#.....#',
 '###.#.#.#.###.#',
 '#...#...#...#.#',
 '#.#####.###.#.#',
 '#.............#',
 '###############'
]);
export const RETRO_GAME_RULES=Object.freeze({
 fleet:{name:'Star Squadron',steps:240,interval:105,controls:'LRFADN'},
 maze:{name:'Mystery Maze',steps:300,interval:165,controls:'LRUDN'}
});
export function alienAt(t,seed){
 const wave=Math.floor(t/9);
 return {wave,lane:(wave*5+seed)%9,age:t%9,boss:wave%5===4};
}
export function ghostsAt(t,seed){
 return [{x:1+(Math.floor(t/4)+seed)%13,y:1},
  {x:1+(Math.floor(t/6)+seed)%13,y:13},
  {x:3+(Math.floor(t/3)+seed)%5,y:7}];
}
export function initialRetro(game,seed=0){
 if(!RETRO_GAME_RULES[game])throw new Error('Unknown game');
 const base={game,seed:Math.floor(Number(seed)||0)%97,tick:0,score:0,lives:3,done:false,
  events:[],prevAction:'N'};
 return game==='fleet'?{...base,lane:4,destroyed:[]}:
  {...base,x:1,y:1,seen:[],power:0,dots:0,ghosts:ghostsAt(0,seed)};
}
function stepFleet(state,move){
 const {tick:t,seed}=state;
 const enemy=alienAt(t,seed),wasDestroyed=state.destroyed.includes(enemy.wave);
 let lane=state.lane,score=state.score,lives=state.lives;
 if(move==='L'||move==='A')lane=Math.max(0,lane-1);
 if(move==='R'||move==='D')lane=Math.min(8,lane+1);
 const fire=['F','A','D'].includes(move);
 const hit=fire&&enemy.age>=1&&enemy.age<=6&&lane===enemy.lane&&!wasDestroyed;
 const destroyed=hit?[...state.destroyed,enemy.wave]:state.destroyed;
 if(hit)score+=enemy.boss?80:20;
 const collision=enemy.age===7&&lane===enemy.lane&&!destroyed.includes(enemy.wave);
 if(collision)lives=Math.max(0,lives-1);
 return {...state,lane,destroyed,score,lives,events:hit?['hit']:collision?['crash']:[],
  prevAction:move,tick:t+1,done:lives===0||t+1>=RETRO_GAME_RULES.fleet.steps};
}
function stepMaze(state,move){
 const {tick:t,seed}=state;let {x,y,score,lives,power,dots}=state;
 const direction={L:[-1,0],R:[1,0],U:[0,-1],D:[0,1]}[move]||[0,0];
 const nx=x+direction[0],ny=y+direction[1],cell=RETRO_MAZE[ny]?.[nx];
 if(cell&&cell!=='#'){x=nx;y=ny;}
 const key=x+','+y,seen=state.seen.includes(key)?state.seen:[...state.seen,key];
 const events=[];
 if(!state.seen.includes(key)){
  const point=RETRO_MAZE[y][x];score+=point==='o'?50:10;
  dots++;events.push(point==='o'?'power':'dot');
  if(point==='o')power=24;
 }
 if(power>0)power--;
 const ghosts=ghostsAt(t,seed);
 const collide=ghosts.some(g=>g.x===x&&g.y===y);
 if(collide){
  if(power===0){lives=Math.max(0,lives-1);x=1;y=1;events.push('crash');}
  else events.push('scare');
 }
 return {...state,x,y,score,lives,power,dots,seen,ghosts,events,prevAction:move,tick:t+1,
  done:lives===0||t+1>=RETRO_GAME_RULES.maze.steps||dots>=106};
}
export function retroStep(state,action='N'){
 if(state.done)return state;
 const move=RETRO_GAME_RULES[state.game].controls.includes(action)?action:'N';
 return state.game==='fleet'?stepFleet(state,move):stepMaze(state,move);
}
export function retroReplay(game,seed,actions){
 if(typeof actions!=='string'||actions.length>RETRO_GAME_RULES[game]?.steps)
  throw new Error('Invalid arcade controls');
 let result=initialRetro(game,seed);
 for(const action of actions){
  if(!RETRO_GAME_RULES[game].controls.includes(action))throw new Error('Invalid action');
  if(result.done)throw new Error('Run continued beyond game over');
  result=retroStep(result,action);
 }
 return result;
}
