/* Mirrors the server's free-tile rule. Presentation only; moves still
   require the authorized community_mahjong_pair RPC. */
export function isTileFree(tiles,t) {
  if(!t||t.gone)return false;
  return !tiles.some(o=>!o.gone&&Number(o.z)>Number(t.z)&&Number(o.x)===Number(t.x)&&Number(o.y)===Number(t.y))
    && (!tiles.some(o=>!o.gone&&Number(o.z)===Number(t.z)&&Number(o.y)===Number(t.y)&&Number(o.x)===Number(t.x)-1)
      || !tiles.some(o=>!o.gone&&Number(o.z)===Number(t.z)&&Number(o.y)===Number(t.y)&&Number(o.x)===Number(t.x)+1));
}
export function countLegalPairs(tiles=[]) {
  const byFace=new Map();
  for(const tile of tiles)if(isTileFree(tiles,tile)){
    const kind=Number(tile.s);
    byFace.set(kind,(byFace.get(kind)||0)+1);
  }
  let pairs=0;
  for(const n of byFace.values())pairs+=n*(n-1)/2;
  return pairs;
}

/* Arrow navigation is presentation-only. The server still validates matches. */
export function adjacentMahjongTile(tiles=[],currentId,key) {
  const vectors={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  const direction=vectors[key];
  if(!direction)return null;
  const origin=tiles.find(t=>String(t.id)===String(currentId)&&!t.gone);
  if(!origin)return null;
  const px=Number(origin.x)+Number(origin.z||0)*.12;
  const py=(Number(origin.y)-Number(origin.z||0)*.12)*1.14;
  const candidates=[];
  for(const tile of tiles){
    if(String(tile.id)===String(currentId)||!isTileFree(tiles,tile))continue;
    const dx=Number(tile.x)+Number(tile.z||0)*.12-px;
    const dy=(Number(tile.y)-Number(tile.z||0)*.12)*1.14-py;
    const forward=dx*direction[0]+dy*direction[1];
    const sideways=Math.abs(dx*direction[1]-dy*direction[0]);
    if(!Number.isFinite(forward)||forward<=.01)continue;
    const score=forward**2+sideways**2*3+
      Math.abs(Number(tile.z||0)-Number(origin.z||0))*.25;
    candidates.push({tile,score});
  }
  candidates.sort((a,b)=>a.score-b.score||Number(a.tile.id)-Number(b.tile.id));
  return candidates[0]?.tile||null;
}
