/* Classic Mahjong Solitaire: deterministic 144-tile puzzle engine.
 * Original gameplay implementation, independent of Mystery Road and server RPCs.
 * A deal is generated with a complete legal solution witness, but player choices
 * can still lead to a dead end. Never silently shuffle a live Turtle board.
 */
export const TURTLE_LAYOUTS = Object.freeze({
 turtle: 'Classic Turtle', temple: 'Layered Temple', garden: 'Open Garden'
});
const SUITS = [['characters', 'Characters'], ['circles', 'Circles'], ['bamboo', 'Bamboo']];
const WINDS = [['east', 'East Wind', '東'], ['south', 'South Wind', '南'], ['west', 'West Wind', '西'], ['north', 'North Wind', '北']];
const DRAGONS = [['red', 'Red Dragon', '中'], ['green', 'Green Dragon', '發'], ['white', 'White Dragon', '白']];
const FLOWERS = [['plum', 'Plum', '梅'], ['orchid', 'Orchid', '蘭'], ['bamboo-flower', 'Bamboo Flower', '竹'], ['chrysanthemum', 'Chrysanthemum', '菊']];
const SEASONS = [['spring', 'Spring', '春'], ['summer', 'Summer', '夏'], ['autumn', 'Autumn', '秋'], ['winter', 'Winter', '冬']];
export const TURTLE_FACES = Object.freeze([
 ...SUITS.flatMap(([suit,title]) => Array.from({length:9},(_,i)=>Object.freeze({
   id:`${suit}-${i+1}`,group:`${suit}-${i+1}`,kind:suit,label:`${i+1} ${title}`,number:i+1,mark:String(i+1)
 }))),
 ...WINDS.map(([key,label,mark])=>Object.freeze({id:`wind-${key}`,group:`wind-${key}`,kind:'wind',label,mark})),
 ...DRAGONS.map(([key,label,mark])=>Object.freeze({id:`dragon-${key}`,group:`dragon-${key}`,kind:'dragon',label,mark})),
 ...FLOWERS.map(([key,label,mark])=>Object.freeze({id:`flower-${key}`,group:'flowers',kind:'flower',label,mark})),
 ...SEASONS.map(([key,label,mark])=>Object.freeze({id:`season-${key}`,group:'seasons',kind:'season',label,mark}))
]);
const FACES = new Map(TURTLE_FACES.map(face=>[face.id,face]));
export const faceById = id => FACES.get(id) || null;
export function seedFromText(text){
 let h=2166136261;
 for(const code of String(text)){
  h=Math.imul(h ^ code.charCodeAt(0),16777619);
 }
 return h>>>0;
}
function randomFrom(seed){
 let x=(Number(seed)>>>0)||0x9e3779b9;
 return ()=>{x=(x+0x6d2b79f5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
function shuffle(list,rand){
 const output=[...list];
 for(let i=output.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[output[i],output[j]]=[output[j],output[i]];}
 return output;
}
export function layoutPositions(name='turtle'){
 const positions=[];
 const add=(x,y,z)=>positions.push({id:positions.length,x,y,z});
 if(name==='turtle'){
  for(let y=0;y<7;y++)for(let x=1;x<=12;x++)add(x,y,0);
  add(0,3,0);add(13,2.5,0);add(13,3.5,0);
  for(let y=0;y<6;y++)for(let x=4;x<=9;x++)add(x,y+.5,1);
  for(let y=0;y<4;y++)for(let x=5;x<=8;x++)add(x,y+1.5,2);
  for(let y=0;y<2;y++)for(let x=6;x<=7;x++)add(x,y+2.5,3);
  add(6.5,3,4);
 } else if(name==='temple'){
  for(let y=0;y<8;y++)for(let x=1;x<=12;x++)add(x,y,0);
  for(let y=0;y<4;y++)for(let x=3;x<=10;x++)add(x,y+2,1);
  for(let y=0;y<4;y++)for(let x=5;x<=8;x++)add(x,y+2,2);
 } else if(name==='garden'){
  for(let y=0;y<12;y++)for(let x=1;x<=12;x++)add(x,y,0);
 } else throw new RangeError('Unknown Mahjong layout');
 if(positions.length!==144)throw new Error(`Invalid ${name} layout: ${positions.length} tiles`);
 return positions;
}
function intersects(a,b){return Math.abs(a.x-b.x)<.999&&Math.abs(a.y-b.y)<.999;}
function horizontallyAdjacent(a,b){return Math.abs(a.x-b.x-1)<.001&&Math.abs(a.y-b.y)<.999;}
export function isFreeTile(tiles,tile,removed=new Set()){
 if(!tile||removed.has(tile.id))return false;
 let left=false,right=false;
 for(const other of tiles){
  if(other.id===tile.id||removed.has(other.id))continue;
  if(other.z>tile.z&&intersects(tile,other))return false;
  if(other.z!==tile.z)continue;
  if(horizontallyAdjacent(tile,other))right=true;
  if(horizontallyAdjacent(other,tile))left=true;
  if(left&&right)return false;
 }
 return true;
}
export function availablePairs(tiles,removed=new Set()){
 const groups=new Map();
 for(const tile of tiles){
  if(!isFreeTile(tiles,tile,removed))continue;
  const key=faceById(tile.face)?.group;
  if(!key)continue;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(tile.id);
 }
 const pairs=[];
 for(const ids of groups.values())for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)pairs.push([ids[a],ids[b]]);
 return pairs;
}
function geometricPairs(positions,rand){
 const removed=new Set(),out=[];
 while(removed.size<positions.length){
  const free=positions.filter(tile=>isFreeTile(positions,tile,removed));
  if(free.length<2)throw new Error('Geometric layout could not be cleared');
  const a=free.splice(Math.floor(rand()*free.length),1)[0];
  const b=free.splice(Math.floor(rand()*free.length),1)[0];
  removed.add(a.id);removed.add(b.id);out.push([a.id,b.id]);
 }
 return out;
}
function pairDeck(){
 const ordinary=TURTLE_FACES.filter(f=>f.kind!=='flower'&&f.kind!=='season');
 if(ordinary.length!==34)throw new Error('Expected 34 ordinary tile kinds');
 const list=[];
 for(const face of ordinary){list.push([face.id,face.id]);list.push([face.id,face.id]);}
 // Each of these eight bonus faces appears once. Any two of the same family match.
 list.push(...[[FLOWERS[0][0],FLOWERS[1][0]],[FLOWERS[2][0],FLOWERS[3][0]]].map(p=>p.map(k=>'flower-'+k)));
 list.push(...[[SEASONS[0][0],SEASONS[1][0]],[SEASONS[2][0],SEASONS[3][0]]].map(p=>p.map(k=>'season-'+k)));
 if(list.length!==72)throw new Error('Expected 72 pairs');
 return list;
}
export function buildTurtleDeal(layout='turtle',seed=1){
 const geometry=layoutPositions(layout),rand=randomFrom(seed);
 let pairs=null;
 for(let attempt=0;attempt<128&&!pairs;attempt++){
  try{pairs=geometricPairs(geometry,rand);}catch{/* Try a new deterministic geometric order. */}
 }
 if(!pairs)throw new Error('Unable to generate solvable Turtle deal');
 const faces=shuffle(pairDeck(),rand);
 const assignment=new Map();
 pairs.forEach(([a,b],i)=>{assignment.set(a,faces[i][0]);assignment.set(b,faces[i][1]);});
 return {layout,seed:Number(seed)>>>0,tiles:geometry.map(p=>({...p,face:assignment.get(p.id)})),witness:pairs};
}
export function pairIsLegal(deal,removed,aId,bId){
 if(!Number.isInteger(aId)||!Number.isInteger(bId)||aId===bId)return false;
 const a=deal.tiles[aId],b=deal.tiles[bId];
 if(!a||!b||a.id!==aId||b.id!==bId)return false;
 const first=faceById(a.face),second=faceById(b.face);
 return Boolean(first&&second&&first.group===second.group&&isFreeTile(deal.tiles,a,removed)&&isFreeTile(deal.tiles,b,removed));
}
export function replayTurtleMoves(deal,moves=[]){
 if(!Array.isArray(moves)||moves.length>72)throw new Error('Invalid Turtle history');
 const removed=new Set();
 for(const entry of moves){
  if(!Array.isArray(entry)||entry.length!==2||!pairIsLegal(deal,removed,entry[0],entry[1]))throw new Error('Corrupt Turtle history');
  removed.add(entry[0]);removed.add(entry[1]);
 }
 return removed;
}
export function utcDailyKey(now=new Date()){
 const date=new Date(now);
 if(Number.isNaN(date.getTime()))throw new RangeError('Invalid date');
 return date.toISOString().slice(0,10);
}
export function dailyDealSeed(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||utcDailyKey(day+'T00:00:00.000Z')!==day)throw new RangeError('Invalid daily key');
 return seedFromText('cowboy-turtle-daily-v1:'+day);
}