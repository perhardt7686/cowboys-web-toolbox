/* Family Arcade: one tactile stick and two original cabinet buttons.
 * Pure helpers; score and verified server replay rules remain unchanged.
 */
import {retroStickDirection} from './retro-arcade-joystick.mjs?v=cabinet2';

export function retroCabinetDirection(game,dx,dy,deadzone=12){
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return 'N';
  if(game==='fleet')return Math.abs(dx)<deadzone?'N':dx<0?'L':'R';
  if(game==='maze')return retroStickDirection(dx,dy,deadzone);
  return 'N';
}

/* A is FIRE for Star Squadron and BRAKE for Mystery Maze.
 * B is PAUSE, which freezes the local timer and produces NO server move.
 * The maze's BRAKE is a legal 'N' step in the authoritative replay.
 */
export function retroCabinetButton(game,button){
  if(button!=='A')return null;
  return game==='fleet'?'F':game==='maze'?'B':null;
}
