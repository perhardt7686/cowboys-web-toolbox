/* Unlockable cosmetic gear for the TWO original family arcade games.
 * Equipment is game-scoped, unlocked only by server-verifiable trophy IDs.
 * No score, hitbox, life, speed, RNG, action, or verified replay is modified.
 */
export const RETRO_UNLOCKS=Object.freeze({
 fleet:Object.freeze([
  Object.freeze({id:'patrol',name:'Patrol Interceptor',need:null,description:'Original turquoise squadron fighter.',type:'SHIP'}),
  Object.freeze({id:'signal',name:'Signal Hull',need:'bronze',description:'Ice-blue fighter with twin signal lamps.',type:'SHIP'}),
  Object.freeze({id:'comet',name:'Comet Engines',need:'silver',description:'A trailing orange comet plume behind your ship.',type:'ENGINE'}),
  Object.freeze({id:'nova',name:'Nova Wings',need:'gold',description:'Extra violet energy-wing details on your fighter.',type:'WINGS'}),
  Object.freeze({id:'admiral',name:'Admiral Crest',need:'legendary',description:'Gold captain crest and radiant hull markings.',type:'CREST'})
 ]),
 maze:Object.freeze([
  Object.freeze({id:'scout',name:'Scout Detective',need:null,description:'Original clue-hunting explorer and hat.',type:'DETECTIVE'}),
  Object.freeze({id:'lantern',name:'Clue Lantern',need:'bronze',description:'Glowing lantern carried through the maze.',type:'TOOL'}),
  Object.freeze({id:'footsteps',name:'Breadcrumb Trail',need:'silver',description:'Golden footprints marking recently explored tiles.',type:'TRAIL'}),
  Object.freeze({id:'compass',name:'Ghost Compass',need:'gold',description:'Animated spectral compass above the detective.',type:'TOOL'}),
  Object.freeze({id:'keeper',name:'Keeper of Clues',need:'legendary',description:'A crown of golden clue stars for the maze master.',type:'CROWN'})
 ])
});
const ids=Object.keys(RETRO_UNLOCKS);
export function retroUnlocks(game){return RETRO_UNLOCKS[game]||Object.freeze([]);}
export function canEquipRetro(game,id,earned=[]){
 const item=retroUnlocks(game).find(x=>x.id===id);
 return Boolean(item&&(item.need===null||new Set(earned).has(item.need)));
}
export function resolveRetroUnlock(game,requested,earned=[]){
 const first=retroUnlocks(game)[0];
 return canEquipRetro(game,requested,earned)?requested:(first?.id||null);
}
export function retroCosmeticPalette(game,look){
 if(game==='fleet')return ({
  patrol:['#89dbdf','#f6ca77','#3e679a'],
  signal:['#91edff','#8cc5ff','#294eaa'],
  comet:['#fba98b','#ffe8a0','#9a465b'],
  nova:['#ac9cf8','#d7bdff','#644d9c'],
  admiral:['#ffd76f','#fff0b5','#845d28']
 })[look]||['#89dbdf','#f6ca77','#3e679a'];
 return ({
  scout:['#f4ce77','#5b3c5c'],
  lantern:['#ffe08a','#755273'],
  footsteps:['#c2f6d8','#5b3c5c'],
  compass:['#99daff','#415c96'],
  keeper:['#f7e08c','#8362b6']
 })[look]||['#f4ce77','#5b3c5c'];
}
export function retroCosmeticGameOnly(game,look){
 return ids.includes(game)&&retroUnlocks(game).some(x=>x.id===look);
}
