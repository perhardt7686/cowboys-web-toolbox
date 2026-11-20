/* Navigation decisions for Mahjong Mystery Road.
 * ONLY server-confirmed qualified wins can take players to the road.
 * Never on reload, tile matches, failed clears, Turtle games, or mid-board.
 */
export function roadVisitDue(result){
 if(!result||result.event!=='won'||result.campaign_event!=='advanced')return false;
 const finished=Number(result.completed_level);
 if(!Number.isInteger(finished)||finished<1||finished>5000)return false;
 return finished===1||finished%5===0||finished%25===0;
}
export function roadVictoryMessage(result){
 if(!roadVisitDue(result))return '';
 const bonus=Number(result.campaign_bonus_earned);
 const earned=Number.isFinite(bonus)&&bonus>0?' · +'+Math.trunc(bonus).toLocaleString('en-US')+' campaign points':'';
 return '🌟 New garden trail light unlocked'+earned+'. Opening your Mystery Road map.';
}
