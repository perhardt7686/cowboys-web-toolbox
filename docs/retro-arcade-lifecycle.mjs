/* Local guard for asynchronous retro arcade sessions.
 * Never allow a late start/finish response to change a newer or abandoned view.
 * This module does not write server state or alter replay/scoring rules.
 */
export function createRetroLifecycle(){
  let generation=0, pending=null;
  return {
    begin(game){
      generation+=1;
      pending={game,ticket:generation};
      return generation;
    },
    matches(ticket){return ticket===generation;},
    clearPending(ticket){if(ticket===generation)pending=null;},
    pendingGame(){return pending?.game||null;},
    invalidate(){generation+=1;pending=null;},
    current(){return generation;}
  };
}
