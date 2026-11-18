// Cowboy's V8 prototype: deterministic, read-only demo state.
// Reuses established reward IDs without importing member state or changing entitlements.
export const DEMO_ONLY = true;
export const TABS = Object.freeze([
  ['character', 'Character'], ['outfits', 'Outfits'],
  ['pets', 'Pets'], ['rewards', 'Rewards']
]);
export const BODIES = Object.freeze([
  {id:'human',name:'Mystery sleuth'}, {id:'robot',name:'Midnight automaton'}
]);
export const EXPRESSIONS = Object.freeze(['curious','smile','brave','surprised']);
export const HAIR_STYLES = Object.freeze(['swoop','shag','bob','short']);
export const SKIN_TONES = Object.freeze(['#efc6a6','#d99d78','#a86e4f','#70452f']);
export const COAT_TONES = Object.freeze(['#497f80','#ad6757','#77669b','#bf9b61']);
export const REWARDS = Object.freeze([
  {id:'viking-battle-helmet',name:'Runestone Helm',slot:'hat',art:'helm',family:'all',tier:'gold'},
  {id:'studio-observatory-coat',name:'Astronomer’s Coat',slot:'outerwear',art:'coat',family:'human',tier:'bronze'},
  {id:'studio-observatory-telescope',name:'Brass Field Telescope',slot:'prop',art:'telescope',family:'all',tier:'bronze'},
  {id:'studio-rain-cape',name:'Storm Cape',slot:'outerwear',art:'cape',family:'all',tier:'starter'},
  {id:'studio-rain-boots',name:'Puddle Waders',slot:'footwear',art:'boots',family:'all',tier:'starter'},
  {id:'studio-workshop-visor',name:'Carnival Scanner Plate',slot:'bodypart',art:'visor',family:'robot',tier:'bronze'},
  {id:'studio-workshop-gloves',name:'Claw Gloves',slot:'hands',art:'claws',family:'robot',tier:'bronze'},
  {id:'studio-tower-cape',name:'Tower Sentry Mantle',slot:'outerwear',art:'mantle',family:'all',tier:'silver'},
  {id:'studio-backlot-glasses',name:'Dusk Cat-Eye Glasses',slot:'eyewear',art:'glasses',family:'human',tier:'starter'},
  {id:'studio-backlot-flashlight',name:'Backlot Flashlight',slot:'prop',art:'flashlight',family:'all',tier:'starter'},
  {id:'studio-rain-hound',name:'Gutter Fog Hound',slot:'companion',art:'hound',family:'all',tier:'starter'},
  {id:'studio-tower-gargoyle',name:'Slatewing Gargoyle',slot:'companion',art:'gargoyle',family:'all',tier:'silver'}
]);
export const REWARD_BY_ID = new Map(REWARDS.map(r=>[r.id,r]));
export const BASE = Object.freeze({
  body:'human',angle:'front',expression:'curious',hair:'swoop',
  skin:SKIN_TONES[1],coat:COAT_TONES[0],tab:'character',
  pet:'studio-rain-hound',gesture:'idle',equipped:{},filter:'all'
});
export function newDemoState(){return {...BASE,equipped:{}};}
export function compatible(body,item){return Boolean(item&&(item.family==='all'||item.family===body));}
export function previewReward(state,id){
  const item=REWARD_BY_ID.get(id);
  if(!item||!compatible(state.body,item))return state;
  if(item.slot==='companion')return {...state,pet:item.id,gesture:'hello'};
  return {...state,equipped:{...state.equipped,[item.slot]:id},gesture:'show'};
}
export function updateDemoState(state,action){
  if(!state||!action||typeof action.type!=='string')return state;
  const {type,value}=action;
  if(type==='tab'&&TABS.some(pair=>pair[0]===value))return {...state,tab:value};
  if(type==='body'&&BODIES.some(body=>body.id===value)){
    const equipped=Object.fromEntries(Object.entries(state.equipped)
      .filter(([,id])=>compatible(value,REWARD_BY_ID.get(id))));
    return {...state,body:value,equipped,gesture:'idle'};
  }
  if(type==='angle'&&['front','profile','back'].includes(value))return {...state,angle:value};
  if(type==='expression'&&EXPRESSIONS.includes(value))return {...state,expression:value};
  if(type==='hair'&&HAIR_STYLES.includes(value))return {...state,hair:value};
  if(type==='skin'&&SKIN_TONES.includes(value))return {...state,skin:value};
  if(type==='coat'&&COAT_TONES.includes(value))return {...state,coat:value};
  if(type==='filter'&&['all','wearable','companion'].includes(value))return {...state,filter:value};
  if(type==='preview')return previewReward(state,value);
  if(type==='clear')return {...state,equipped:{},gesture:'idle'};
  if(type==='pet-play')return {...state,gesture:'play'};
  if(type==='pet-hello')return {...state,gesture:'hello'};
  if(type==='settle')return {...state,gesture:'idle'};
  return state;
}
export function visibleRewards(state){
  return REWARDS.filter(item=>(state.filter==='all'||
    (state.filter==='companion'?item.slot==='companion':item.slot!=='companion')));
}
export function assertDemoContract(){
  const seen=new Set();
  for(const item of REWARDS){
    if(seen.has(item.id)||!item.name||!item.slot||!item.art||
       !['all','human','robot'].includes(item.family))return false;
    seen.add(item.id);
  }
  return REWARDS.length===12 && REWARDS.filter(r=>r.slot==='companion').length===2;
}
