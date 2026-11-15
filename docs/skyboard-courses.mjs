export const SKY_COURSE_EDITION=2;
export const SKY_WORLDS=[
  {name:'Sunshine Skyway',scene:'cloud',
   routes:['Cloudline Cruise','Lookout Launch','Sunbeam Slalom','Skyrail Bridge','Golden Hour Rush']},
  {name:'Candy Canyon',scene:'canyon',
   routes:['Peach Rock Pass','Taffy Drop','Ribbon Ridge','Sugar Arch Run','Candyball Canyon']},
  {name:'Crystal Coast',scene:'palm',
   routes:['Tideglass Boulevard','Low Tide Leap','Breaker Switchbacks','Beacon Crossing','Seafoam Sprint']},
  {name:'Glacier Glow',scene:'ice',
   routes:['Polar Route','Icefall Ramp','Aurora Slalom','Frostlift Bridge','Glacier Grand Prix']},
  {name:'Moonlight Metro',scene:'city',
   routes:['Overnight Express','Neon Rooftops','Metro Merge','Signal Station','Midnight Dash']},
  {name:'Rainbow Rapids',scene:'forest',
   routes:['Canopy Cruise','Waterfall Drop','Sunken Switchbacks','Grove Lift Crossing','Prism Championship']}
];
const features=[
  'Wide turns and sweeping hazards','Crests and jump gaps','Tight turns with moving blockers',
  'Narrow bridges and moving lifts','Long boosts and double red balls'
];
export function skyCourseInfo(stage){
  const index=Math.max(0,Math.min(29,stage-1)),world=SKY_WORLDS[Math.floor(index/5)],route=index%5;
  return {name:world.routes[route],world:world.name,scene:world.scene,route,description:features[route]};
}
function random(seed){
  let state=seed>>>0;
  return ()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };
}
export function buildSkyCourseEdition(stage,seed){
  const rng=random(seed^Math.imul(stage,87523)),info=skyCourseInfo(stage);
  const world=Math.floor((stage-1)/5),route=info.route;
  const length=322+17*route+13*world;
  const things=[];
  function add(kind,z,x=0,shape={}){
    things.push({id:things.length,kind,z,x,...shape});
  }
  const first=47+route*2,second=Math.floor(length*.67);
  for(const [i,z] of [first,second].entries()){
    add('boost',z,0,{half:i===0?5.45:4.75,duration:.50+route*.023});
    add('ball',z+36+i*7,0,{radius:2.30+world*.095,travel:3.20+route*.16,rate:1.28+world*.12,phase:rng()*6.28});
    if(route===4||world>=4){
      add('ball',z+59+i*14,.12,{radius:2.11+world*.085,travel:3.40,rate:1.67+route*.06,phase:rng()*6.28});
    }
  }
  const firstShift=world%2?1:-1;
  add('sweeper',105,0,{half:.91+world*.08,height:.85,travel:2.85+route*.10,rate:1.64+world*.17,phase:rng()*6.28});
  const barriers=[26,129,second-24,length-35];
  barriers.forEach((z,i)=>{
    const x=(i%2?-firstShift:firstShift)*(2.15+rng()*1.38);
    add(i%2?'gate':'bar',z,x,{half:.92+world*.08,height:.84+route*.09});
    add('coin',z-8,-x*.75);
    add('coin',z+7,x*.77);
  });
  if(stage>1){
    const z=Math.floor(length*.43),span=route===3?4.15:2.9+world*.12;
    add('gap',z,0,{span});
    add('ramp',z-7,0,{span:7.2,height:route===1?1.38:.83});
    if(route===3||stage>=11)add('platform',z,.4,{span,half:1.22,travel:2.6,rate:1.70,phase:rng()*6.28});
    for(const delta of [-11,-8,-5])add('coin',z+delta,firstShift*1.62);
  }
  if(route===3||route===4){
    const z=length-56,span=route===3?3.8:3.2;
    add('gap',z,0,{span});add('ramp',z-7,0,{span:6.3,height:.85});
    if(route===3)add('platform',z,-.4,{span,half:1.35,travel:2.8,rate:1.6,phase:rng()*6.28});
  }
  if(world>=1){
    add('sweeper',second-10,firstShift*.3,{half:1.05,height:1.04,travel:2.15,rate:1.71+world*.11,phase:rng()*6.28});
    add('spikes',length-21,firstShift*2.65,{half:1.16,height:.86});
  }
  const checkpoints=[0,114,Math.floor(length*.55),length-74];
  things.sort((a,b)=>a.z-b.z);
  return {stage,seed,edition:SKY_COURSE_EDITION,length,things,checkpoints,info,world,route,
    sway:[5.1,5.85,9.25,6.3,8.45][route]+world*.31,phase:rng()*6.28};
}
export function editionTrack(course,z){
  const s=Math.min(course.length,Math.max(0,z));
  const {phase,route,sway,world}=course;
  const curve=.019+route*.003;
  const center=Math.sin(s*curve+phase)*sway+Math.sin(s*.0117+phase*.4)*4.3;
  let y=Math.sin(s*.029+phase)*(.93+world*.20)+Math.sin(s*.048+route)*.48;
  y+=Math.sin(Math.PI*Math.max(0,Math.min(1,(s-78)/64)))*[.7,2.6,1.3,2.1,1.6][route];
  let lift=0;
  for(const ramp of course.things){
    if(ramp.kind!=='ramp'||Math.abs(s-ramp.z)>ramp.span/2)continue;
    const t=(s-ramp.z)/ramp.span+.5;
    y+=Math.sin(t*Math.PI)*ramp.height;
    lift=Math.max(lift,ramp.height);
  }
  const narrow=(Math.sin(Math.PI*Math.max(0,Math.min(1,(s-100)/66)))**2)
   *([.59,.76,1.18,1.49,.84][route]+world*.16);
  return {center,y,half:6.06-narrow,lift};
}

export const SKY_COLORS=[
  {sky:['#2785ba','#cceeee'],road:['#e7b96d','#c19a69'],border:'#25a7a2',accent:'#365e71',env:'cloud',
    horizon:'#ffdbad',walls:['#6e838d','#c9bdd3','#edeee9','#658886']},
  {sky:['#984680','#ffd6b1'],road:['#c88d8a','#a97488'],border:'#ffe0a6',accent:'#705279',env:'canyon',
    horizon:'#ffbe97',walls:['#664969','#de94a2','#f3bca4','#824a79']},
  {sky:['#186e9b','#a9f1ec'],road:['#389e9d','#59b7a5'],border:'#fecc7b',accent:'#1c647b',env:'palm',
    horizon:'#e9f3c2',walls:['#1e677c','#74ba9a','#c8dfb3','#447d66']},
  {sky:['#316494','#cedff5'],road:['#95b4ce','#aacbd9'],border:'#805ae4',accent:'#4d759b',env:'ice',
    horizon:'#accdf1',walls:['#527da8','#6baec8','#dcf3f5','#8d9ae2']},
  {sky:['#130e36','#535897'],road:['#5965a8','#444988'],border:'#45e0ce',accent:'#334165',env:'city',
    horizon:'#b26da4',walls:['#25254a','#53467d','#5debcf','#f8b174']},
  {sky:['#286a76','#bfe9cf'],road:['#c5985d','#a48660'],border:'#82cfa1',accent:'#355e57',env:'forest',
    horizon:'#efce95',walls:['#2f5c62','#78a971','#b5ce89','#4a8371']}
];

