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
