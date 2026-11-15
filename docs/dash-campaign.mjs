export const DASH_COURSE_EDITION=2;
export const DASH_OVERHEAD='sblwcpfrmodhH';
export const DASH_CUES='CSBUWRPVIFLEKTQ';

export const DASH_SECTIONS=[
  {id:'spring',label:'Springworks',description:'Spring pads, roof crystals and a landing grid',length:12,
    items:[[1,'A'],[4,'s','c'],[8,'b'],[10,'.','.','K']]},
  {id:'hangar',label:'Hangar Flight',description:'Take a ship through a low roof',length:14,
    items:[[1,'.','.','S'],[4,'b'],[7,'.','p'],[9,'s'],[12,'.','.','C']]},
  {id:'switches',label:'Signal Switch',description:'Switch off a laser and time the beat gate',length:13,
    items:[[1,'.','.','T'],[4,'l'],[8,'H'],[10,'.','.','Q']]},
  {id:'gravity',label:'Ceiling Route',description:'Flip onto the ceiling and return to the floor',length:14,
    items:[[0,'.','.','I'],[5,'.','s'],[9,'.','.','I'],[12,'b']]},
  {id:'wave',label:'Wave Tunnel',description:'Thread a wave between floor and roof hazards',length:13,
    items:[[1,'.','.','W'],[4,'s','c'],[8,'p','p'],[11,'.','.','C']]},
  {id:'foundry',label:'Robot Foundry',description:'Charge a high jump past the foundry',length:14,
    items:[[1,'.','.','R'],[5,'p'],[9,'b'],[12,'.','.','C']]},
  {id:'lift',label:'Moving Lift',description:'Platforms, jump orbs and a drifting saw',length:14,
    items:[[1,'M'],[4,'O'],[8,'d'],[10,'N'],[12,'.','c']]},
  {id:'swing',label:'Swing Gallery',description:'Alternate upward and downward motion',length:14,
    items:[[1,'.','.','V'],[4,'s'],[7,'.','c'],[10,'b'],[12,'.','.','C']]},
  {id:'hopper',label:'UFO Garden',description:'Tap to hop through blocks and hanging crystals',length:14,
    items:[[1,'.','.','U'],[4,'c'],[7,'.','c'],[10,'b'],[12,'.','.','C']]},
  {id:'bounce',label:'Magnet Lab',description:'Jump between the floor and roof with a spider or ball',length:14,
    items:[[1,'.','.','P'],[4,'p'],[8,'.','c'],[10,'.','.','B'],[12,'.','.','C']]},
  {id:'saw',label:'Saw Alley',description:'Short hops and moving saws under a high roof',length:12,
    items:[[1,'s'],[5,'d'],[10,'w','.','.',1]]},
  {id:'bends',label:'Speed Rhythm',description:'Speed up, take two jumps and enter a slow zone',length:14,
    items:[[1,'.','.','F'],[5,'s'],[9,'s'],[11,'N'],[12,'.','.','E']]}
];
const index=new Map(DASH_SECTIONS.map(section=>[section.id,section]));
const early=[
  [],[],['spring','switches'],['hangar','lift'],['gravity','spring','saw'],
  ['wave','switches','saw'],['foundry','hopper','lift','bends']
];
const bossAttacks={
  canopy:'cwm',clockwork:'bdh',crystal:'cws',skyglass:'drl',solar:'fps',thunder:'ldo',
  reef:'mod',volcanic:'fph',pixel:'bdr',garden:'mcp',starfall:'odo',aurora:'csr'
};
const worldCourses=[
  ['spring','hangar','saw','bends'],['switches','wave','hopper','spring'],
  ['saw','gravity','lift','foundry'],['wave','switches','foundry','hangar'],
  ['hangar','swing','wave','lift'],['spring','foundry','bends','gravity'],
  ['switches','saw','swing','bends'],['hopper','gravity','hangar','lift'],
  ['foundry','switches','bends','spring'],['wave','hangar','swing','switches'],
  ['bounce','hopper','gravity','spring'],['swing','wave','lift','bounce']
];
export function dashSection(id){return index.get(id);}
export function dashCampaignPlan(stage,length,boss=false,bossStyle='none'){
  if(!Number.isInteger(stage)||stage<2)return null;
  const world=Math.floor(Math.max(0,stage-7)/25)%worldCourses.length;
  const source=early[stage]||worldCourses[world];
  const cells=Array.from({length},()=>'.'),transforms=new Map(),sections=[];
  let variant=Math.imul(stage+1,1103515245)>>>0;
  function place(tile,token,above='.',cue='.',decor=0,scale=2){
    cells[tile]=token;
    if(above!=='.'||cue!=='.'||decor||scale!==2)transforms.set(tile,[tile,0,scale,0,decor,above,cue]);
  }
  function placeSection(at,section){
    for(const [i,token,above,cue,scale] of section.items)place(at+i,token,above,cue,cue==='Q'?2:0,scale);
    sections.push({start:at,end:at+section.length,label:section.label});
  }
  if(boss){
    const attacks=bossAttacks[bossStyle]||bossAttacks.aurora;
    for(let phase=0;phase<3;phase++){
      const start=Math.floor((length-8)*phase/3)+4;
      const end=Math.floor((length-8)*(phase+1)/3)+4;
      const section=index.get(source[(phase+stage)%source.length]);
      place(start,'.','.','Q',2);
      if(end-start>=section.length+8)placeSection(start+2,section);
      const attack=attacks[phase];
      place(end-4,attack,'.','.',0,attack==='d'||attack==='w'?1:2);
    }
  }else{
    let at=4,cursor=0,last;
    while(at+11<length-4&&cursor<10){
      variant=(Math.imul(variant,1664525)+1013904223)>>>0;
      let choice=stage<7?cursor%source.length:(variant>>>16)%source.length;
      if(source[choice]===last)choice=(choice+1)%source.length;
      const section=index.get(source[choice]);
      cursor++;
      if(at+section.length>length-4)continue;
      placeSection(at,section);last=section.id;
      at+=section.length+1+(variant%3===0?1:0);
    }
  }
  return {pattern:cells.join(''),layout:[...transforms.values()].sort((a,b)=>a[0]-b[0]),sections};
}
