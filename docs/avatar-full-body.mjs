export const STAGE_WIDTH=432;
export const STAGE_HEIGHT=572;
export const CENTER=216;

export const BODY_MODELS=Object.freeze({
  detective:{name:'Lean detective',family:'human',head:89,scale:1,shoulder:50,waist:32,hip:40,leg:140,depth:27,face:'long',shirt:'olive'},
  mechanic:{name:'Stocky mechanic',family:'human',head:109,scale:1.1,shoulder:72,waist:52,hip:55,leg:119,depth:40,face:'square',shirt:'burntorange'},
  sleuth:{name:'Compact sleuth',family:'human',head:126,scale:.92,shoulder:49,waist:32,hip:50,leg:119,depth:26,face:'heart',shirt:'gold'},
  specter:{name:'Moorland specter',family:'monster',head:85,scale:1.05,shoulder:56,waist:37,hip:49,leg:139,depth:29,face:'angular',shirt:'forest'},
  marsh:{name:'Marsh watchkeeper',family:'monster',head:95,scale:1.08,shoulder:68,waist:44,hip:53,leg:127,depth:32,face:'long',shirt:'forest'},
  armor:{name:'Crooked armor',family:'monster',head:113,scale:1.01,shoulder:74,waist:43,hip:55,leg:124,depth:38,face:'square',shirt:'navy'},
  automaton:{name:'Boardwalk automaton',family:'robot',head:107,scale:1,shoulder:65,waist:43,hip:53,leg:121,depth:34,face:'square',shirt:'turquoise'},
  radio:{name:'Radio courier',family:'robot',head:145,scale:.89,shoulder:56,waist:42,hip:49,leg:105,depth:37,face:'round',shirt:'maroon'},
  scout:{name:'Wind-up surveyor',family:'robot',head:145,scale:.96,shoulder:53,waist:39,hip:48,leg:113,depth:30,face:'round',shirt:'rust'}
});

export const FULL_BODY_OPTIONS=Object.freeze({
  model:Object.entries(BODY_MODELS).map(([id,v])=>[id,v.name]),
  bottoms:[['flares','Flares'],['slacks','Slacks'],['pleats','Pleated skirt'],['dress','A-line dress'],['overalls','Overalls'],['cuffs','Cuffed trousers']],
  footwear:[['loafers','Loafers'],['boots','Trail boots'],['highboots','Tall boots'],['sneakers','Canvas sneakers'],['maryjanes','Strap shoes']],
  outerwear:[['none','None'],['denim','Denim jacket'],['trench','Trench coat'],['raincoat','Raincoat'],['cape','Shoulder cape']],
  neckwear:[['none','None'],['ascot','Ascot'],['scarf','Knotted scarf'],['pendant','Pendant']],
  waist:[['none','None'],['leather','Leather belt'],['utility','Utility belt']],
  hands:[['none','None'],['gloves','Driving gloves'],['gauntlets','Gauntlets']],
  back:[['none','None'],['satchel','Satchel'],['pack','Explorer pack']]
});

export const BODY_DEFAULTS=Object.freeze({
  model:'detective',bottoms:'flares',footwear:'loafers',outerwear:'none',neckwear:'none',waist:'none',hands:'none',back:'none'
});
export const WARDROBE_LABELS=Object.freeze({
  model:'Body',bottoms:'Bottoms & dresses',footwear:'Shoes',outerwear:'Outerwear',neckwear:'Neckwear',
  waist:'Belts',hands:'Gloves',back:'Bags'
});
export const SCULPT_LABELS=Object.freeze({
  height:'Height',build:'Shoulder width',jaw:'Jaw contour',eye_spacing:'Eye spacing'
});
const SCULPT_STEPS=new Set(['-2','-1','0','1','2']);

const starter={
  detective:{bottoms:'flares',footwear:'loafers',neckwear:'ascot'},
  mechanic:{bottoms:'overalls',footwear:'boots',waist:'utility'},
  sleuth:{bottoms:'pleats',footwear:'maryjanes',neckwear:'scarf'},
  specter:{bottoms:'slacks',footwear:'highboots',outerwear:'raincoat'},
  marsh:{bottoms:'cuffs',footwear:'boots',outerwear:'cape',neckwear:'pendant'},
  radio:{bottoms:'cuffs',footwear:'sneakers',back:'pack'},
  armor:{bottoms:'slacks',footwear:'boots',hands:'gauntlets',outerwear:'cape'},
  automaton:{bottoms:'slacks',footwear:'boots',waist:'utility'},
  scout:{bottoms:'cuffs',footwear:'sneakers',back:'pack'}
};

export function normalizeBody(value) {
  const input=value?.full_body;
  if(!input||typeof input!=='object'||Array.isArray(input))return BODY_DEFAULTS;
  const fitted=Object.fromEntries(Object.entries(FULL_BODY_OPTIONS).map(([field,choices])=>
    [field,choices.some(([id])=>id===input[field])?input[field]:BODY_DEFAULTS[field]]));
  for(const field of Object.keys(SCULPT_LABELS))
    if(SCULPT_STEPS.has(input[field]))fitted[field]=input[field];
  return fitted;
}

export function starterBody(value,model) {
  const base=BODY_MODELS[model];
  if(!base)return value;
  return {...value,face:base.face,shirt:base.shirt,full_body:{...BODY_DEFAULTS,...starter[model],model}};
}

export function fitsBody(value,item) {
  return !item.families||item.families.includes(BODY_MODELS[normalizeBody(value).model].family);
}

export const TURN_VIEWS=Object.freeze([
  {name:'Front', shoulder:1, hip:1, head:0, nearFoot:9, farFoot:11, arm:0},
  {name:'Front right', shoulder:.94, hip:.91, head:4, nearFoot:15, farFoot:9, arm:4},
  {name:'Right', shoulder:.79, hip:.77, head:8, nearFoot:21, farFoot:16, arm:7},
  {name:'Back right', shoulder:.93, hip:.9, head:4, nearFoot:14, farFoot:15, arm:4},
  {name:'Back', shoulder:1.03, hip:1, head:0, nearFoot:10, farFoot:9, arm:0},
  {name:'Back left', shoulder:.98, hip:.92, head:-3, nearFoot:14, farFoot:11, arm:-4},
  {name:'Left', shoulder:.8, hip:.79, head:-7, nearFoot:20, farFoot:15, arm:-6},
  {name:'Front left', shoulder:.92, hip:.9, head:-4, nearFoot:13, farFoot:9, arm:-4}
]);

export function wrapAngle(angle) {
  return ((angle%360)+360)%360;
}

export function projectTurn(angle) {
  const turn=wrapAngle(angle)/45;
  const index=Math.floor(turn);
  const first=TURN_VIEWS[index],second=TURN_VIEWS[(index+1)%8],blend=turn-index;
  const radians=turn*Math.PI/4;
  const across=Math.cos(radians),depth=Math.sin(radians);
  const at=(x,z=0)=>x*across+z*depth;
  const toward=(x,z=0)=>z*across-x*depth;
  const profile=Object.fromEntries(['shoulder','hip','head','nearFoot','farFoot','arm'].map(key=>
    [key,first[key]+(second[key]-first[key])*blend]));
  return {...profile,across,depth,at,toward,name:TURN_VIEWS[Math.round(turn)%8].name};
}
