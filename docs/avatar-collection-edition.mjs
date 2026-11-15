import {workshopRewardArt} from './avatar-turnaround-rewards.mjs?v=workshop1';

// The five illustrated workshop collections and the complimentary first pet.
const collections=[
  {id:'observatory',label:'After Hours Observatory',look:'detective',scene:'observatory',
    color:'#4379a4',achievement:'fleet-scout',tier:'bronze',caption:'Brass instruments and midnight sky',
    pieces:[
      ['telescope','prop','Brass Field Telescope','#ba8242','telescope'],
      ['coat','outerwear','Astronomer’s Coat','#354e80','trench'],
      ['pack','back','Star Chart Satchel','#976450','satchel'],
      ['moth','companion','Lamplight Moth','#e2b16e','moth'],
      ['scene','background','Observatory Terrace','#6783b5']
    ]},
  {id:'rain',label:'Raincoat Revenants',look:'specter',scene:'rain',
    color:'#497d76',achievement:'maze-sleuth',tier:'starter',caption:'Patchwork rainwear and alley mist',
    pieces:[
      ['lantern','prop','Puddle Lantern','#b9924c','lantern'],
      ['cape','outerwear','Patchwork Storm Cape','#487570','cape'],
      ['boots','footwear','Puddle Waders','#87703d','highboots'],
      ['hound','companion','Gutter Fog Hound','#6f8a82','hound'],
      ['scene','background','Lamplit Alley','#4f7389']
    ]},
  {id:'workshop',label:'Midnight Carnival Workshop',look:'automaton',scene:'workshop',
    color:'#a45f50',achievement:'fleet-gunner',tier:'bronze',caption:'Hinges, brass fittings and a restless gremlin',
    pieces:[
      ['visor','bodypart','Carnival Scanner Plate','#d69050','visor',['robot']],
      ['gloves','hands','Workshop Claw Gloves','#ae805b','gauntlets',['robot']],
      ['belt','waist','Sprocket Utility Belt','#745861','utility'],
      ['gremlin','companion','Midway Wind-up Gremlin','#7a9d85','gremlin'],
      ['scene','background','Midway Workshop','#a67775']
    ]},
  {id:'tower',label:'Bell Tower Patrol',look:'armor',scene:'tower',
    color:'#7b669e',achievement:'maze-shadow',tier:'silver',caption:'Stone wings and a watch in the fog',
    pieces:[
      ['lantern','prop','Watch Bell Lantern','#b098c5','lantern'],
      ['cape','outerwear','Tower Sentry Mantle','#776090','cape'],
      ['gloves','hands','Bell Ringer’s Gloves','#706077','gloves'],
      ['gargoyle','companion','Slatewing Gargoyle','#888399','gargoyle'],
      ['scene','background','Belfry Lookout','#87769b']
    ]},
  {id:'backlot',label:'Backlot Detectives',look:'sleuth',scene:'backlot',
    color:'#ad6656',achievement:'studio-refit',tier:'starter',caption:'Film-set sleuthing and late-sunset light',
    pieces:[
      ['flashlight','prop','Backlot Flashlight','#987641','flashlight'],
      ['compass','offhand','Clue-Seeker Compass','#cc9d58','compass'],
      ['jacket','outerwear','Marquee Jacket','#a55655','denim'],
      ['glasses','eyewear','Dusk Cat-Eye Glasses','#ad6b74','cat-eye'],
      ['scene','background','Dusk Backlot','#ba7871']
    ]}
];

const actions={
  telescope:['spark','Extend the telescope','The brass barrel extends. A nearby moth follows the warm lens and settles on it.','gold'],
  lantern:['lamp','Light the lantern','A warm patch follows the lantern across the floor as the pet reacts.','gold'],
  visor:['scan','Sweep the visor','The shutters open and a beam sweeps from the lens.','mint'],
  flashlight:['lamp','Switch on the flashlight','Light travels from the lens across the hand, coat and floor.','gold'],
  compass:['spin','Find the clue','The compass needle swings, slows and settles on a clue.','gold'],
  cape:['breeze','Sweep the cape','The hem arcs away while the shoulder clasp stays in place.','orchid'],
  scene:['breeze','Set the scene','Step into this painted setting.','mint'],
  gloves:['polish','Inspect the gloves','The character lifts its hand to show the fit and seams.','gold'],
  boots:['polish','Inspect the boots','A soft glint traces the boot cuffs.','gold'],
  trench:['breeze','Inspect the coat','Turn to see the seam and satchel clearance.','mint'],
  denim:['breeze','Inspect the jacket','The character shifts to show the fitted shoulders.','coral'],
  satchel:['polish','Inspect the satchel','Check the clasp, strap and flap during a turn.','gold'],
  utility:['polish','Inspect the belt','A brass buckle catches the light.','gold'],
  'cat-eye':['polish','Tilt the glasses','A light flickers across the lenses.','ice']
};

export const FIRST_PET_ID='studio-attic-ghost';
export const REPLACEMENT_ACHIEVEMENT='studio-refit';
export const STUDIO_EDITION=2;

const rows=collections.flatMap(set=>set.pieces.map(([key,slot,name,color,cut,families])=>({
  id:'studio-'+set.id+'-'+key,slot,name,color,cut,families,scene:slot==='background'?set.scene:undefined,
  art:cut||key,collection:set.id,achievement_id:set.achievement,group:set.id==='backlot'?'wordquest':set.achievement.split('-')[0],
  tier:set.tier,tags:['studio-collection',set.id,...families||[]],action:actions[cut||key]
})));
rows.push({id:FIRST_PET_ID,name:'Wick the Attic Ghost',slot:'companion',color:'#c0e0bc',art:'ghost',
  achievement_id:'studio-welcome',group:'family',tier:'starter',tags:['studio-collection','starter','ghost']});
export const NEW_STUDIO_REWARDS=Object.freeze(rows.map(item=>Object.freeze({...item,...workshopRewardArt(item)})));
export const NEW_STUDIO_COLLECTIONS=Object.freeze(collections.map(set=>Object.freeze({
  id:set.id,label:set.label,look:set.look,scene:set.scene,color:set.color,caption:set.caption,
  pieces:set.pieces.map(([key])=>'studio-'+set.id+'-'+key),action:'studio-'+set.id+'-'+set.pieces[0][0]
})));
export const SCENE_BY_COLOR=Object.freeze({lavender:'attic',night:'attic',ocean:'rain',mint:'rain',moss:'rain',
  sky:'observatory',cloud:'observatory',heather:'tower',sand:'tower',sunset:'backlot',peach:'backlot',
  rose:'workshop',ochre:'workshop',sunflower:'workshop'});
export const SCENE_LABELS=Object.freeze({attic:'Mystery Attic',observatory:'Observatory Terrace',rain:'Lamplit Alley',
  workshop:'Midway Workshop',tower:'Belfry Lookout',backlot:'Dusk Backlot'});
