// Original browser game data, based on the 1989 DOS vehicle classes and manual.
// Classified prices/conditions and some specifications are calibrated for play.
const models = [
  ['ford32', '1932 Ford Coupe', 'ford', 'deuce', 325, 75, 2420, 4, 69, 'six'],
  ['sedan32', '1932 Ford Sedan', 'ford', 'deuce', 385, 81, 2500, 2, 76, 'six'],
  ['master38', '1938 Chevrolet Master Deluxe', 'gm', 'round', 460, 85, 2915, 9, 73, 'six'],
  ['chevy40', '1940 Chevrolet Coupe', 'gm', 'round', 400, 85, 2915, 2, 82, 'six'],
  ['roadster40', '1940 Chevrolet Roadster', 'gm', 'open', 535, 92, 2945, 4, 80, 'six'],
  ['ford40', '1940 Ford Deluxe', 'ford', 'round', 485, 85, 2780, 5, 74, 'six'],
  ['style49', '1949 Chevrolet Styleline', 'gm', 'round', 475, 92, 3150, 3, 84, 'six'],
  ['olds49', '1949 Oldsmobile 88', 'gm', 'round', 725, 135, 3620, 1, 76, 'v8', true],
  ['silver50', '1950 Pontiac Silver Streak', 'gm', 'round', 610, 102, 3380, 6, 84, 'six'],
  ['olds52', '1952 Oldsmobile 88', 'gm', 'hard', 975, 145, 3550, 4, 84, 'v8', true],
  ['mercury54', '1954 Mercury Monterey', 'ford', 'hard', 850, 161, 3320, 2, 77, 'v8'],
  ['belair55', '1955 Chevrolet Bel Air', 'gm', 'fin', 1275, 162, 3270, 1, 86, 'v8'],
  ['fairlane55', '1955 Ford Fairlane Victoria', 'ford', 'hard', 1050, 162, 3260, 5, 84, 'v8'],
  ['lancer55', '1955 Dodge Custom Royal Lancer', 'mopar', 'fin', 1210, 183, 3550, 4, 83, 'v8', true],
  ['vette56', '1956 Corvette', 'gm', 'open', 1850, 210, 2880, 3, 89, 'v8'],
  ['mercury56', '1956 Mercury Custom', 'ford', 'hard', 1340, 210, 3500, 12, 84, 'v8'],
  ['fairlane57', '1957 Ford Fairlane 500', 'ford', 'fin', 1435, 245, 3450, 6, 81, 'v8'],
  ['tbird57', '1957 Ford Thunderbird', 'ford', 'open', 2110, 245, 3160, 5, 90, 'v8'],
  ['impala58', '1958 Chevrolet Impala', 'gm', 'fin', 1540, 250, 3590, 9, 89, 'v8'],
  ['valiant61', '1961 Plymouth Valiant V-200', 'mopar', 'hard', 650, 101, 2690, 3, 91, 'six'],
  ['vette61', '1961 Corvette', 'gm', 'open', 2760, 283, 2920, 4, 92, 'v8'],
  ['polara62', '1962 Dodge Polara', 'mopar', 'fin', 2530, 305, 3450, 3, 89, 'v8'],
  ['valiant63', '1963 Plymouth Valiant V-100', 'mopar', 'hard', 1135, 145, 2720, 2, 92, 'six'],
  ['vette63', '1963 Corvette Sting Ray', 'gm', 'sting', 3595, 300, 3015, 4, 96, 'v8'],
  // Legacy save ID retained. In the summer of 1963, the available Savoy is the '63.
  ['savoy64', '1963 Plymouth Savoy', 'mopar', 'hard', 1860, 230, 3310, 1, 87, 'v8']
];

// Period-correct used-vehicle expansion, already available by summer 1963.
// These models share the same verified mechanic, tire, part and fuel systems.
// The original 25 IDs are deliberately unchanged for all existing garage saves.
const periodExtras = [
  ['woodie34','1934 Ford Woodie Wagon','ford','wagon',675,85,3260,6,70,'v8'],
  ['town48','1948 Chrysler Town & Country Convertible','mopar','open',1125,135,3970,4,76,'six',true],
  ['chevy3100','1954 Chevrolet 3100 Stepside Pickup','gm','pickup',620,112,3330,2,75,'six'],
  ['nomad55','1955 Chevrolet Nomad Wagon','gm','wagon',1580,162,3500,3,82,'v8'],
  ['f10057','1957 Ford F-100 Flareside Pickup','ford','pickup',825,139,3550,10,78,'six'],
  ['camino59','1959 Chevrolet El Camino','gm','utility',1250,185,3700,12,84,'v8',true],
  ['eldorado59','1959 Cadillac Eldorado Convertible','gm','open',3450,345,5000,13,88,'v8',true],
  ['squire60','1960 Ford Country Squire Wagon','ford','wagon',1525,210,4080,2,87,'v8',true],
  ['econoline61','1961 Ford Econoline Cargo Van','ford','van',675,85,2980,3,78,'six'],
  ['clubwagon62','1962 Ford Falcon Club Wagon','ford','van',825,101,3120,10,86,'six'],
  ['econoPickup61','1961 Ford Econoline Pickup','ford','pickup',780,85,2750,9,80,'six'],
  ['c10stepside63','1963 Chevrolet C10 Stepside','gm','pickup',1025,140,3520,1,90,'six'],
  ['d10063','1963 Dodge D100 Sweptline Pickup','mopar','pickup',1100,205,3950,14,88,'v8'],
  ['riviera63','1963 Buick Riviera','gm','hard',2850,325,4015,4,92,'v8',true],
  ['galaxie63','1963 Ford Galaxie 500 Fastback','ford','hard',2350,300,3670,9,91,'v8']
];

export const ORIGINAL_CAR_LIST = Object.freeze(models.map(([id, name, make, body, price, hp, weight, color, wear, engine, auto = false]) =>
  Object.freeze({id, name, make, body, price, hp, weight, color, wear, engine, auto})));
export const CAR_LIST = Object.freeze([...models,...periodExtras].map(([id, name, make, body, price, hp, weight, color, wear, engine, auto = false]) =>
  Object.freeze({id, name, make, body, price, hp, weight, color, wear, engine, auto})));
const MYSTERY_VAN = Object.freeze({id:'mystery66', name:'Mystery Machine', make:'mopar', body:'van',
  price:0, hp:375, weight:2895, color:3, wear:100, engine:'v8', auto:false});
export const CARS = Object.freeze({...Object.fromEntries(CAR_LIST.map(model => [model.id, model])), [MYSTERY_VAN.id]:MYSTERY_VAN});
export const MAKES = Object.freeze({gm: 'GM', ford: 'Ford', mopar: 'Chrysler'});
export const COLORS = Object.freeze({1: 'Midnight blue', 2: 'Forest green', 3: 'Turquoise', 4: 'Burgundy',
  5: 'Plum', 6: 'Bronze', 7: 'Silver', 9: 'Cobalt', 10: 'Lime', 12: 'Torch red', 13: 'Orchid', 14: 'Yellow', 15: 'Ivory'});

export const WHEELS = Object.freeze(['front-left', 'front-right', 'rear-left', 'rear-right']);
export const SLOTS = Object.freeze(['engine', 'manifold', 'carb', 'gearbox', ...WHEELS]);
export const BOLTS = Object.freeze({engine: 6, manifold: 6, carb: 4, gearbox: 6,
  'front-left': 5, 'front-right': 5, 'rear-left': 5, 'rear-right': 5});
export const fullBolts = slot => (1 << BOLTS[slot]) - 1;
export const isWheel = slot => WHEELS.includes(slot);
export const SLOT_NAMES = Object.freeze({engine:'Engine', manifold:'Manifold', carb:'Carburetor', gearbox:'Transmission',
  'front-left':'Left front tire', 'front-right':'Right front tire', 'rear-left':'Left rear tire', 'rear-right':'Right rear tire'});

const part = (id, slot, name, price, spec = {}) => ({id, slot, name, price, ...spec});
const makers = Object.entries(MAKES);
const transmissions = [
  ['3', '3-speed manual', 108, [2.92, 1.68, 1], 3.65],
  ['auto', '3-speed automatic', 174, [2.48, 1.48, 1], 3.70],
  ['4', '4-speed close ratio', 286, [2.72, 1.93, 1.36, 1], 3.91],
  ['race', 'Racing 4-speed', 425, [2.55, 1.86, 1.38, 1], 4.10]
];
export const PART_LIST = Object.freeze([
  ...Object.values(CARS).map(c => part('motor-' + c.id, 'engine', c.name + ' motor', Math.round(c.price * 0.23), {
    make:c.make, format:c.engine, hp:c.hp, torque:Math.round(c.hp * 1.26 + 28), redline:c.engine === 'six' ? 4750 : 5500, timing:c.engine === 'six' ? 4 : 7, stock:true
  })),
  ...makers.flatMap(([make, name]) => [
    part(make+'-street', 'engine', {gm:'GM 283 V8',ford:'Ford 292 V8',mopar:'Chrysler 318 V8'}[make], 365, {make,format:'v8',hp:182,torque:273,redline:5450,timing:7}),
    part(make+'-race', 'engine', {gm:'GM 327 V8',ford:'Ford 390 V8',mopar:'Chrysler 340 V8'}[make], 670, {make,format:'v8',hp:315,torque:404,redline:6300,timing:9}),
    part(make+'-six-intake','manifold',name+' six-cylinder intake',55,{make,format:'six',flange:'2b',gain:0}),
    part(make+'-v8-intake','manifold',name+' 2-barrel V8 intake',74,{make,format:'v8',flange:'2b',gain:4}),
    part(make+'-4-intake','manifold',name+' hi-rise 4-barrel intake',126,{make,format:'v8',flange:'4b',gain:17}),
    ...transmissions.map(([id, label, price, ratios, final]) => part(make+'-trans-'+id,'gearbox',name+' '+label,price,{make,ratios,final,auto:id==='auto',strength:id==='race'?1.50:id==='4'?1.2:1}))
  ]),
  part('carb2','carb','2-barrel Carter',38,{flange:'2b',gain:0}),
  part('carb4','carb','4-barrel race carburetor',118,{flange:'4b',gain:14}),
  part('tire-bias','tire','Bias-ply tire',22,{grip:0.69}),
  part('tire-road','tire','Road GT tire',42,{grip:0.91}),
  part('tire-slick','tire','Racing slick',65,{grip:1.02})
].map(Object.freeze));
export const PARTS = Object.freeze(Object.fromEntries(PART_LIST.map(p => [p.id, p])));

export const RIVALS = Object.freeze([
  ['earl','Earl','ford32',0,0,0,0.53,0.8,'If it starts, it races.',false],
  ['rusty','Rusty','chevy40',0,0,0,0.5,0.81,'I just put her back together.',false],
  ['bobby','Bobby','style49',0,1,0,0.48,0.84,'Let’s see what you brought.',false],
  ['lenny','Lenny','valiant61',1,1,0,0.46,0.87,'The straightaway is mine.',true],
  ['frankie','Frankie','lancer55',2,1,1,0.43,0.89,'My Dodge likes the long way.',true],
  ['duke','Duke','ford40',2,2,1,0.39,0.94,'She looks stock. Listen closer.',true],
  ['jimmy','Jimmy','fairlane57',3,2,1,0.36,0.91,'Have fifty bucks to spare?',true],
  ['dean','Dean','belair55',3,2,2,0.34,0.96,'See you on the other side.',true],
  ['walt','Walt','mercury56',4,3,2,0.31,0.96,'Keep the shiny side up.',true],
  ['chuck','Chuck','impala58',4,3,3,0.29,1,'I’m putting my title on the line.',true],
  ['cal','Cal','polara62',5,4,3,0.27,0.99,'Hope you have good brakes.',true],
  ['eddie','Eddie','vette61',6,4,4,0.22,1.03,'The King is watching tonight.',true],
  ['king','The King','vette63',8,5,5,0.18,1.09,'Road race. Titles on the line.',true]
].map(([id,name,model,tier,drag,road,reaction,skill,line,pink]) =>
  Object.freeze({id,name,model,tier,drag,road,reaction,skill,line,pink})));
export const MYSTERY = Object.freeze({id:'mystery', name:'Mystery Machine', model:MYSTERY_VAN.id,
  tier:9, drag:0, road:0, reaction:0.12, skill:1.16, line:'One last race into the night.', pink:false});
export const RIVAL_BY_ID = Object.freeze(Object.fromEntries([...RIVALS, MYSTERY].map(r => [r.id, r])));
export const START = Date.UTC(1963, 5, 1, 8);
export const DEADLINE = (Date.UTC(1963, 8, 15) - START) / 3600000;
export const FUEL_TANK = 160;
export const WAGERS = Object.freeze({drag:Object.freeze(['kicks','10','50']), road:Object.freeze(['25','100','pink'])});
export const DOLLARS = Object.freeze({kicks:0,'10':10,'50':50,'25':25,'100':100,pink:0});
export const GAS_PRICE = 0.32;
