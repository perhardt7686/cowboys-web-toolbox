/* Family classic-media arcade: configuration only, NO game files or commercial assets.
 * Emulation support is platform-dependent; game scores are NOT emulator-verified.
 */
const directions=[
 ['up','▲','UP','↑',4],['left','◀','LEFT','←',6],
 ['down','▼','DOWN','↓',5],['right','▶','RIGHT','→',7]
];
const action=(id,symbol,label,key,index)=>Object.freeze({id,symbol,label,key,index});
export const CLASSIC_TITLES=Object.freeze([
 Object.freeze({
  id:'galaga',name:'Galaga',platform:'MSX CASSETTE · 1984',core:null,
  status:'compatibility',hint:'MSX cassette playback is awaiting an accepted, tested browser core. Do not substitute another game.',
  accept:['.cas','.zip'],controlType:'horizontal',
  controls:[directions[1],directions[3]].map(([id,symbol,label,key,index])=>action(id,symbol,label,key,index))
   .concat([action('fire','A','FIRE','SPACE',0),action('start','▶','START','ENTER',3)]),
  goals:[['first','First flight',1],['bronze','Pilot badge',1000],['gold','Space ace',10000]]
 }),
 Object.freeze({
  id:'pacman',name:'Pac-Man',platform:'IBM PC / DOS · 1983',core:'dos',
  status:'experimental',hint:'Load a DOS ZIP or .jsdos bundle with a working executable and DOSBox configuration. This edition still needs authenticated boot testing.',
  accept:['.zip','.jsdos'],controlType:'dpad',
  controls:directions.map(([id,symbol,label,key,index])=>action(id,symbol,label,key,index))
   .concat([action('start','▶','START','ENTER',3)]),
  goals:[['first','First maze',1],['bronze','Maze explorer',1000],['gold','Ghost dodger',10000]]
 }),
 Object.freeze({
  id:'centipede',name:'Centipede',platform:'ATARI 2600 · 1982',core:'atari2600',
  status:'candidate',hint:'Load a cartridge BIN or ZIP. Use the joystick to move and hold FIRE; SELECT and RESET are original console switches.',
  accept:['.bin','.a26','.zip'],controlType:'dpad',
  controls:directions.map(([id,symbol,label,key,index])=>action(id,symbol,label,key,index))
   .concat([action('fire','A','FIRE','SPACE',0),action('select','S','SELECT','TAB',2),action('start','R','RESET','ENTER',3)]),
  goals:[['first','Garden defender',1],['bronze','Mushroom hunter',1000],['gold','Centipede champion',10000]]
 }),
 Object.freeze({
  id:'topgear',name:'Top Gear',platform:'SUPER NINTENDO · 1992',core:'snes',
  status:'candidate',hint:'Controller Setup A: X accelerate, Y brake, A nitro, L/R manual shift, D-pad steer. Choose the matching control layout inside the game.',
  accept:['.sfc','.smc','.zip'],controlType:'horizontal',
  controls:[action('left','◀','STEER LEFT','←',6),action('right','▶','STEER RIGHT','→',7),
   action('accelerate','X','ACCELERATE','X',9),action('brake','Y','BRAKE','Z',1),
   action('nitro','A','NITRO','A',8),action('gearDown','L','GEAR −','Q',10),
   action('gearUp','R','GEAR +','W',11),action('start','▶','START','ENTER',3),
   action('pause','S','PAUSE / SELECT','TAB',2)],
  goals:[['first','First lap',1],['bronze','Road contender',2000],['gold','Tour champion',20000]]
 })
]);
export const CLASSIC_IDS=Object.freeze(CLASSIC_TITLES.map(x=>x.id));
export function classicById(id){return CLASSIC_TITLES.find(g=>g.id===id)||null;}
export function acceptClassicFile(game,file){
 if(!game||!file||!Number.isFinite(file.size)||file.size<100||file.size>25*1024*1024)return false;
 const name=String(file.name||'').toLowerCase();
 return game.accept.some(x=>name.endsWith(x));
}
export function classicProgress(game,score,attempts){
 // Only self-reported personal goals, never grant server badges or avatar items.
 const numeric=Math.max(0,Math.min(99999999,Math.floor(Number(score)||0)));
 const rounds=Math.max(0,Math.floor(Number(attempts)||0));
 return game.goals.map(([id,title,threshold])=>({
  id,title,achieved:id==='first'?rounds>0:numeric>=threshold,
  description:id==='first'?'Launch a local session':'Self-reported score '+threshold.toLocaleString()+'+'
 }));
}
export const EMULATOR_BRIDGE_VERSION=1;
