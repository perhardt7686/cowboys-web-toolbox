/* Input state for the family retro arcade.
 * One short tap must register for one simulation step. Holding a button keeps
 * it active every step. This does not alter scores or the server replay rules.
 */
import {RETRO_MAZE} from './retro-arcade-engine.mjs?v=arcade2';

const MOVES={L:[-1,0],R:[1,0],U:[0,-1],D:[0,1]};
function openMazeExit(state,code){
  const delta=MOVES[code];
  if(!delta)return false;
  const x=state.x+delta[0],y=state.y+delta[1];
  const cell=RETRO_MAZE[y]?.[x];
  return Boolean(cell&&cell!=='#');
}

export function createRetroInput(){
  const held=new Set(), pending=new Set();
  let direction='N',lastSteer='N',mazeMotion='N';
  function activate(game,code){
    if(game==='maze'){
      if(code==='B'){pending.add('B');return;}
      if('LRUD'.includes(code)&&code.length===1)direction=code;
      return;
    }
    if(game!=='fleet'||!['L','R','F'].includes(code))return;
    // A more recent quick directional tap wins over the previous tap.
    if(code==='L'){pending.delete('R');lastSteer='L';}
    if(code==='R'){pending.delete('L');lastSteer='R';}
    pending.add(code);
  }
  return {
    press(game,code){activate(game,code);if(game==='maze'||game==='fleet')held.add(code);},
    tap(game,code){activate(game,code);},
    release(code){held.delete(code);},
    cancel(code){held.delete(code);pending.delete(code);},
    action(game,state){
      if(game==='maze'){
        // The cabinet BRAKE generates a legal neutral step and stops previous
        // momentum without rewriting the verified score or action vocabulary.
        const braking=held.has('B')||pending.has('B');
        pending.delete('B');
        if(braking){mazeMotion='N';return 'N';}
        // Keep a requested turn queued until the next available junction.
        // Continue the last legal direction rather than stopping at a wall.
        // Only executed actions are recorded, so server replay stays exact.
        if(!state)return direction;
        if(openMazeExit(state,direction)){mazeMotion=direction;return direction;}
        if(openMazeExit(state,mazeMotion))return mazeMotion;
        mazeMotion='N';return 'N';
      }
      if(game!=='fleet')return 'N';
      const left=held.has('L')||pending.has('L');
      const right=held.has('R')||pending.has('R');
      const fire=held.has('F')||pending.has('F');
      // Consume momentary taps once; persistent held buttons remain active.
      pending.clear();
      // Two thumbs can overlap: the most recently pressed direction wins,
      // rather than cancelling movement when both controls remain held.
      const steer=left&&right?lastSteer:left?'L':right?'R':'N';
      if(steer==='L')return fire?'A':'L';
      if(steer==='R')return fire?'D':'R';
      return fire?'F':'N';
    },
    clearHeld(){held.clear();pending.clear();direction='N';mazeMotion='N';lastSteer='N';},
    reset(){held.clear();pending.clear();direction='N';mazeMotion='N';lastSteer='N';}
  };
}
