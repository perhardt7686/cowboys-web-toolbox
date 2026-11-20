/* Family Fun activity display. Only server-returned saved game interactions
   determine "Most recently played". Opening a menu or game doesn't count. */
export const EASTERN_TIME_ZONE='America/New_York';
export function timestampMs(value){
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d/.test(value))return 0;
 const epoch=Date.parse(value);
 return Number.isFinite(epoch)&&epoch>0?epoch:0;
}
export function sortGamesByRecent(games,activity={}){
 return [...games].map((game,index)=>({game,index,timestamp:timestampMs(activity?.[game.id]?.lastPlayedAt)}))
  .sort((a,b)=>b.timestamp-a.timestamp||a.index-b.index).map(item=>item.game);
}
export function mostRecentGame(games,activity={}){
 const first=sortGamesByRecent(games,activity)[0];
 return first&&timestampMs(activity?.[first.id]?.lastPlayedAt)>0?first:null;
}
export function formatEasternStamp(value){
 const epoch=timestampMs(value);if(!epoch)return 'No saved play recorded';
 try{
  return new Intl.DateTimeFormat('en-US',{timeZone:EASTERN_TIME_ZONE,
   month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',
   hourCycle:'h23',timeZoneName:'short'}).format(new Date(epoch));
 }catch{return 'Time unavailable';}
}
export function readGameActivity(payload){
 const result=Object.create(null);
 if(!payload||typeof payload!=='object'||typeof payload.games!=='object'||!payload.games)return result;
 const allow=['streetrod','dashforge','skyboard','fleet','maze','mahjong','wordle','wordquest','plates'];
 for(const name of allow){
  const row=payload.games[name];
  if(!row||typeof row!=='object')continue;
  const safeTime=value=>timestampMs(value)?value:null;
  result[name]={
   lastPlayedAt:safeTime(row.lastPlayedAt),
   lastPlayer:String(row.lastPlayer||'Family member').slice(0,48),
   actionsToday:Math.max(0,Math.trunc(Number(row.actionsToday)||0)),
   yourActionsToday:Math.max(0,Math.trunc(Number(row.yourActionsToday)||0)),
   yourLastPlayedAt:safeTime(row.yourLastPlayedAt)
  };
 }
 return result;
}
