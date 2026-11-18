/* Input state for the family retro arcade.
 * One short tap must register for one simulation step. Holding a button keeps
 * it active every step. This does not alter scores or the server replay rules.
 */
export function createRetroInput(){
  const held=new Set(), pending=new Set();
  let direction='N',lastSteer='N';
  function activate(game,code){
    if(game==='maze'){
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
    action(game){
      if(game==='maze')return direction;
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
    clearHeld(){held.clear();pending.clear();lastSteer='N';},
    reset(){held.clear();pending.clear();direction='N';lastSteer='N';}
  };
}
