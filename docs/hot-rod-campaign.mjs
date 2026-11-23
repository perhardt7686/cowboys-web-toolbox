import {BOLTS, CAR_LIST, CARS, COLORS, DEADLINE, DOLLARS, FUEL_TANK, GAS_PRICE, MYSTERY, PARTS,
  RIVAL_BY_ID, SLOTS, SLOT_NAMES, START, WAGERS, WHEELS, fullBolts, isWheel} from './hot-rod-catalog.mjs';

export class GameError extends Error {
  constructor(message) { super(message); this.name = 'GameError'; }
}

const need = (ok, message) => { if (!ok) throw new GameError(message); };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rig = (id, wear) => ({id, wear});

export function dateLabel(hours) {
  const date = new Date(START + hours * 3600000);
  return new Intl.DateTimeFormat('en-US', {month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(date);
}

export function makeCar(model, number, condition = model.wear) {
  const {make, engine, auto} = model;
  const installed = {
    engine:rig('motor-' + model.id, condition),
    manifold:rig(make + '-' + engine + '-intake', condition),
    carb:rig('carb2', condition),
    gearbox:rig(make + '-trans-' + (auto ? 'auto' : '3'), condition)
  };
  for (const wheel of WHEELS) installed[wheel] = rig('tire-bias', condition);
  return {
    number, model:model.id, color:model.color, front:true, rear:true, roof:false, decal:0,
    condition, fuel:120, timing:PARTS[installed.engine.id].timing, jack:null,
    ignition:true, repairs:0, damage:0, installed,
    bolts:Object.fromEntries(SLOTS.map(slot => [slot, fullBolts(slot)]))
  };
}

export function newCampaign() {
  return {version:1, cash:750, hours:0, cars:[], selected:null, inventory:[], nextCar:1,
    status:'summer', wins:0, losses:0, dragWins:0, roadWins:0, points:0, beaten:[],
    records:{drag:null, road:null}, races:0, race:null, last:null,
    bonus:{unlocked:false,attempts:0,won:false,bestMs:null,car:null}};
}

export const activeCar = state => state?.cars.find(car => car.number === state.selected);
export const isStarter = item => item.price <= 750;
export const carOffer = model => Math.floor(model.price * 0.9);
export const gasCost = units => Math.ceil(units * GAS_PRICE / 10);
const resale = (item, percent) => Math.max(1, Math.floor(PARTS[item.id].price * item.wear * percent / 10000));
// Unused tires can be returned; the period shop still refuses used tires.
export const spareSaleValue=item=>item&&PARTS[item.id]&&(PARTS[item.id].slot!=='tire'||item.wear===100)?resale(item,70):0;
const requiredCar = state => {
  const car = activeCar(state);
  need(car, 'Buy a car from the newspaper first.');
  return car;
};
const spend = (state, amount) => {
  need(state.cash >= amount, 'You’re short on cash.');
  state.cash -= amount;
};
const stored = (state, item) => {
  need(state.inventory.length < 120, 'The parts shelf is full. Sell a spare part first.');
  state.inventory.push(item);
};

function checkEnd(state) {
  if (state.status !== 'summer') return;
  if (state.hours >= DEADLINE) state.status = 'deadline';
  else if (!state.cars.length && !state.inventory.some(item => PARTS[item.id].slot !== 'tire')
    && state.cash < Math.min(...CAR_LIST.map(carOffer))) state.status = 'broke';
}

export function matches(car, slot, id) {
  const part = PARTS[id], model = CARS[car?.model];
  if (!part || !SLOTS.includes(slot) || !model) return false;
  if (isWheel(slot)) return part.slot === 'tire';
  if (part.slot !== slot || (part.make && model.make !== part.make)) return false;
  if (slot === 'manifold') return PARTS[car.installed.engine?.id]?.format === part.format;
  if (slot === 'carb') return PARTS[car.installed.manifold?.id]?.flange === part.flange;
  return true;
}

export function roadProblem(car, minimumFuel = 1) {
  if (!car) return 'Buy a car from the newspaper first.';
  if (car.damage) return 'The body needs repair at the garage.';
  if (car.jack) return 'Fit and tighten the wheel, then lower the jack.';
  for (const slot of SLOTS) {
    const item = car.installed[slot], label = SLOT_NAMES[slot];
    if (!item) return label + ' is missing.';
    if (!matches(car, slot, item.id)) return label + ' does not fit.';
    if (car.bolts[slot] !== fullBolts(slot)) return label + ' has loose fasteners.';
    if (item.wear < 7) return label + ' is worn out.';
  }
  if (!car.ignition) return 'Reconnect the ignition lead.';
  if (car.fuel < minimumFuel) return 'You’re out of fuel. Use the garage gas can.';
  return '';
}

export function carSpec(car, kind = 'road') {
  const model = CARS[car.model];
  const motor = PARTS[car.installed.engine?.id], intake = PARTS[car.installed.manifold?.id];
  const carb = PARTS[car.installed.carb?.id], trans = PARTS[car.installed.gearbox?.id];
  const condition = car.installed.engine?.wear ?? 0;
  const advance = Math.abs((motor?.timing ?? 6) - car.timing);
  const tune = clamp(1 - advance * 0.037, 0.57, 1);
  const tireGrip = WHEELS.reduce((sum, wheel) => {
    const item = car.installed[wheel], part = PARTS[item?.id];
    const compound = kind === 'road' && part?.id === 'tire-slick' ? 0.82 : part?.grip || 0;
    return sum + compound * (0.64 + 0.0036 * (item?.wear || 0));
  }, 0) / 4;
  const modified = car.front && car.rear ? 0 : 49 * (Number(!car.front) + Number(!car.rear));
  return {
    hp:Math.round(((motor?.hp ?? 0) + (intake?.gain ?? 0) + (carb?.gain ?? 0)) * (0.62 + 0.0038 * condition) * tune),
    torque:Math.round(((motor?.torque ?? 0) + (intake?.gain ?? 0) + (carb?.gain ?? 0)) * (0.61 + 0.0039 * condition) * tune),
    weight:model.weight - modified + (car.roof ? -31 : 0),
    redline:motor?.redline || 4500, ratios:trans?.ratios || [2.92, 1.68, 1], final:trans?.final || 3.65,
    automatic:!!trans?.auto, endurance:0.55 + condition * 0.0045,
    transmission:(trans?.strength ?? 1) * (0.55 + (car.installed.gearbox?.wear || 0) * 0.0045),
    grip:tireGrip, fuel:car.fuel, color:car.color, model:car.model, front:car.front,rear:car.rear,roof:car.roof,decal:car.decal, bumpers:Number(car.front) + Number(car.rear)
  };
}

export function garageShowcase(state) {
  return {
    selected:state.selected,
    cars:state.cars.map(car => ({
      number:car.number, model:car.model, color:car.color, front:car.front, rear:car.rear,
      roof:car.roof, decal:car.decal, condition:car.condition, hp:carSpec(car).hp,
      gearbox:PARTS[car.installed.gearbox?.id]?.name ?? 'On the bench'
    }))
  };
}

export function saleValue(car, scrap = false) {
  const model = CARS[car.model];
  if (scrap) return Math.max(35, Math.floor(model.price * 0.2));
  const manual = SLOTS.reduce((value, slot) => {
    const item = car.installed[slot];
    return value + (item ? resale(item, 65) : 0);
  }, 0);
  return Math.floor(model.price * (0.32 + car.condition * 0.0025) + manual + car.decal * 11 - car.damage * 1.75);
}

function removeCar(state, number) {
  state.cars = state.cars.filter(car => car.number !== number);
  if (state.selected === number) state.selected = state.cars.at(-1)?.number || null;
}

function mechanical(state, car, action) {
  const {slot, type, index} = action;
  const item = car.installed[slot];
  need(SLOTS.includes(slot), 'Choose a part to work on.');
  if (isWheel(slot)) need(car.jack === slot, 'Put the jack under that corner first.');
  if (type === 'bolt') {
    need(item, 'Fit the part before tightening.');
    need(Number.isInteger(index) && index >= 0 && index < BOLTS[slot], 'That fastener does not exist.');
    if (slot === 'engine') need(!car.installed.manifold && !car.installed.carb, 'Remove the carburetor and manifold to reach the engine mounts.');
    if (slot === 'manifold') need(!car.installed.carb, 'Remove the carburetor first.');
    car.bolts[slot] ^= 1 << index;
    return car.bolts[slot] & (1 << index) ? 'Fastener tightened.' : 'Fastener loosened.';
  }
  if (type === 'remove') {
    need(item, 'That part is already on the shelf.');
    need(car.bolts[slot] === 0, 'Loosen every fastener first.');
    if (slot === 'engine') {
      need(!car.ignition, 'Unclip the ignition lead first.');
      need(!car.installed.manifold && !car.installed.carb, 'Remove the carburetor and manifold first.');
    }
    if (slot === 'manifold') need(!car.installed.carb, 'Remove the carburetor first.');
    stored(state, item);
    car.installed[slot] = null;
    state.hours += 1;
    return SLOT_NAMES[slot] + ' moved to the parts shelf.';
  }
  const spare = state.inventory[index];
  need(Number.isInteger(index) && spare, 'Choose a part from your shelf.');
  need(!item, 'Remove the installed part first.');
  need(matches(car, slot, spare.id), 'That part does not fit.');
  car.installed[slot] = state.inventory.splice(index, 1)[0];
  car.bolts[slot] = 0;
  if (slot === 'engine') car.ignition = false;
  state.hours += 1;
  return 'Part fitted. Tighten each fastener.';
}

function garageWork(state, action) {
  const car = requiredCar(state);
  switch (action.type) {
    case 'bolt': case 'remove': case 'install': return mechanical(state, car, action);
    case 'ignition':
      if (!car.ignition) {
        need(car.installed.engine, 'Fit the engine before reconnecting the lead.');
        need(car.bolts.engine === fullBolts('engine'), 'Tighten the engine mounts before reconnecting.');
      }
      car.ignition = !car.ignition;
      return car.ignition ? 'Ignition connected.' : 'Ignition disconnected.';
    case 'jack':
      need(WHEELS.includes(action.slot), 'Choose a corner for the jack.');
      if (car.jack) {
        need(action.slot === car.jack, 'Lower the jack before moving it.');
        need(car.installed[car.jack] && car.bolts[car.jack] === fullBolts(car.jack), 'Fit the wheel and tighten every lug before lowering the jack.');
        car.jack = null;
      } else car.jack = action.slot;
      return car.jack ? 'Car raised.' : 'Jack lowered.';
    case 'tune':
      need(!roadProblem({...car, damage:0, fuel:20}), 'Finish the assembly before tuning.');
      need(Number.isInteger(action.value) && action.value >= 0 && action.value <= 16, 'Set timing between 0° and 16°.');
      if (car.timing !== action.value) state.hours += 1;
      car.timing = action.value;
      return 'Ignition timing set to ' + car.timing + '°.';
    case 'paint':
      need(Object.hasOwn(COLORS, action.value), 'Choose a paint color.');
      if (car.color === Number(action.value)) return 'That paint is already on the car.';
      spend(state, 35);
      car.color = Number(action.value);
      car.decal = 0;
      state.hours += 3;
      return 'Paint: ' + COLORS[car.color] + '.';
    case 'decal':
      need(Number.isInteger(action.value) && action.value >= 0 && action.value <= 3, 'Choose a decal.');
      if (car.decal === action.value) return 'That decal is already selected.';
      if (action.value) spend(state, 8);
      car.decal = action.value;
      state.hours += 1;
      return 'Decal changed.';
    case 'body':
      need(['roof','front','rear'].includes(action.slot), 'Choose a body panel.');
      need(action.slot !== 'roof' || CARS[car.model].body !== 'open', 'There’s no fixed roof to chop.');
      spend(state, action.slot === 'roof' ? 48 : 12);
      car[action.slot] = !car[action.slot];
      state.hours += 2;
      return 'Bodywork finished.';
    case 'repair':
      need(car.damage > 0, 'The body doesn’t need repair.');
      need(car.damage < 70 && car.repairs < 3, 'The frame is too far gone. The yard will buy it for scrap.');
      spend(state, repairCost(car));
      car.damage = 0;
      car.condition = Math.min(86, car.condition + 12);
      car.repairs += 1;
      state.hours += 10;
      return 'Body repaired. Check the engine and tires before leaving.';
    case 'fuel': {
      const target = action.value === 'full' ? FUEL_TANK : Math.min(FUEL_TANK, car.fuel + 50);
      need(target > car.fuel, 'The tank is full.');
      spend(state, gasCost(target - car.fuel));
      car.fuel = target;
      state.hours += 1;
      return 'Fuel added.';
    }
    default: throw new GameError('Unknown garage operation.');
  }
}

export const repairCost = car => Math.max(25, Math.ceil(car.damage * 2.1));

export function applyWorkshop(previous, action) {
  const state = structuredClone(previous);
  need(state.status === 'summer' && !state.race, 'Finish the current event or start another summer.');
  let message;
  switch (action.type) {
    case 'buy-car': {
      const model = CARS[action.id];
      need(Object.hasOwn(CARS, action.id) && model.price > 0, 'Choose a car from the paper.');
      need(state.cars.length < 12, 'All garage bays are occupied.');
      const offer = action.offer;
      need(Number.isInteger(offer) && offer >= carOffer(model) && offer <= model.price,
        'The seller wants at least ' + (model ? '$' + carOffer(model) : 'the asking price') + '.');
      spend(state, offer);
      const car = makeCar(model, state.nextCar++);
      state.cars.push(car);
      state.selected = car.number;
      state.hours += 2;
      message = 'The keys are yours.';
      break;
    }
    case 'sell-car': case 'scrap': {
      const car = requiredCar(state);
      need(action.type === 'scrap' || !car.damage, 'A damaged frame can only go for scrap.');
      const price = saleValue(car, action.type === 'scrap');
      state.cash += price;
      removeCar(state, car.number);
      state.hours += 2;
      message = '$' + price + ' for the car.';
      break;
    }
    case 'select-car':
      need(Number.isInteger(action.number) && state.cars.some(car => car.number === action.number), 'That bay is empty.');
      state.selected = action.number;
      message = 'Car moved into the garage.';
      break;
    case 'buy-part': {
      const part = PARTS[action.id];
      need(Object.hasOwn(PARTS, action.id) && part.price > 0, 'Choose a part from the paper.');
      spend(state, part.price);
      stored(state, rig(part.id, 100));
      state.hours += 1;
      message = part.name + ' is on the shelf.';
      break;
    }
    case 'sell-part': {
      const item = state.inventory[action.index];
      need(Number.isInteger(action.index) && item, 'Choose a part from your shelf.');
      const price = spareSaleValue(item);
      need(price>0, 'The shop won’t buy used tires.');
      state.cash += price;
      state.inventory.splice(action.index, 1);
      state.hours += 1;
      message = '$' + price + ' for the part.';
      break;
    }
    case 'rest':
      state.hours += 24;
      message = 'Another summer day.';
      break;
    case 'trip': {
      const car = requiredCar(state);
      need(!roadProblem(car, 7), roadProblem(car, 7));
      car.fuel -= 6;
      state.hours += 1;
      message = 'You made it to Bob’s.';
      break;
    }
    default: message = garageWork(state, action);
  }
  checkEnd(state);
  return {state, message};
}

export function challengeProblem(state, rival, kind, stake) {
  if (rival?.id === MYSTERY.id) {
    if (state.status !== 'champion' || !state.bonus?.unlocked) return 'Beat The King to unlock the final race.';
    if (state.bonus.won) return 'You already won the final race this summer.';
    if (state.race) return 'Finish the active race first.';
    if (kind !== 'road' || stake !== 'kicks') return 'The final race is a road race for glory.';
    return '';
  }
  if (!rival || !Object.hasOwn(RIVAL_BY_ID, rival.id) || !Object.hasOwn(WAGERS, kind) || !WAGERS[kind].includes(stake)) return 'Choose a race and wager.';
  if (state.status !== 'summer' || state.race) return 'A new race isn’t available.';
  if (state.dragWins < rival.drag || state.roadWins < rival.road) return 'Win ' + rival.drag + ' drags and ' + rival.road + ' road races first.';
  const car = activeCar(state);
  const problem = roadProblem(car, kind === 'road' ? 9 : 3);
  if (problem) return problem;
  if (rival.id === 'king') {
    if (kind !== 'road' || stake !== 'pink') return 'The King races for titles on the road.';
    if (state.cars.length >= 12) return 'Free a garage bay before challenging The King.';
    if (car.condition < 50 || carSpec(car).hp < 200) return 'The King wants a healthy car with at least 200 horsepower.';
  } else {
    if (kind === 'road' && rival.tier > 0 && !state.dragWins) return 'Earn a drag win first.';
    if (stake === 'pink' && !rival.pink) return 'This driver wants to keep his title.';
    if (stake === 'pink' && state.cars.length >= 12) return 'Free a garage bay before racing for titles.';
    if ((stake === '50' || stake === '100') && rival.tier === 0 && state.wins < 2 && !car.decal) return 'Try the smaller wager or dress up your car.';
  }
  return state.cash < DOLLARS[stake] ? 'You can’t cover the wager.' : '';
}

export function startRace(previous, action, context) {
  const {kind, stake} = action, rival = RIVAL_BY_ID[action.rival];
  const problem = challengeProblem(previous, rival, kind, stake);
  need(!problem, problem);
  const state = structuredClone(previous), car = activeCar(state);
  const rivalCar = makeCar(CARS[rival.model], 0, 69 + rival.tier * 3);
  if (rival.tier >= 4) {
    rivalCar.installed.gearbox = rig(CARS[rival.model].make + '-trans-4', 96);
    for (const wheel of WHEELS) rivalCar.installed[wheel] = rig('tire-road', 95);
  }
  const bonus = rival.id === MYSTERY.id;
  const bonusCar = bonus ? makeCar(CARS.vette63, state.bonus.car, 100) : null;
  if (bonusCar) {
    bonusCar.color = state.cars.find(item => item.number === state.bonus.car)?.color ?? bonusCar.color;
    bonusCar.installed.gearbox = rig('gm-trans-race', 100);
    for (const wheel of WHEELS) bonusCar.installed[wheel] = rig('tire-road', 100);
  }
  const playerCar = bonusCar ?? car;
  state.race = {
    id:context.id, seed:context.seed, issuedAt:context.now, kind, stake, rival:rival.id,
    car:playerCar.number, player:carSpec(playerCar, kind), opponent:carSpec(rivalCar, kind),
    patrol:kind === 'road' && context.seed % 8 === 0 && rival.tier < 8,
    reaction:rival.reaction, skill:rival.skill,
  };
  // Upgraded clients explicitly request their physics version. Existing tabs and in-progress
  // campaigns remain on the original deterministic simulation.
  if([2,3].includes(action.physicsVersion))state.race.physicsVersion=action.physicsVersion;
  return {state, message:rival.line};
}

const outcomes = {
  win:'You took the finish.', loss:'The other rod crossed first.', false_start:'You jumped the light. Race forfeited.',
  crash:'You wrecked. Your rod needs bodywork.', engine:'The engine let go. Replace it at the garage.',
  gearbox:'You dropped the transmission. Fit a replacement.', fuel:'You ran the tank dry.',
  police20:'You pulled over. $20 fine and a forfeited race.', police75:'The patrol caught you. $75 fine and a forfeited race.',
  abandoned:'You forfeited the race.'
};

function settleMystery(state, result) {
  const race = state.race;
  const won = result.outcome === 'win';
  const points = won ? 150 : 0;
  state.bonus.attempts += 1;
  state.bonus.won = won;
  state.bonus.bestMs = won ? result.ms : null;
  state.points += points;
  state.race = null;
  const record = {id:race.id,kind:'road',rival:MYSTERY.id,wager:'kicks',outcome:result.outcome,
    won,points,champion:false,hours:state.hours,ms:result.ms,reaction:result.reaction};
  state.last = record;
  return {state,record,message:won ? 'You beat the Mystery Machine. The night race trophy is yours!' : outcomes[result.outcome]};
}

export function settleRace(previous, result) {
  const state = structuredClone(previous);
  const race = state.race, car = activeCar(state), rival = RIVAL_BY_ID[race?.rival];
  need(race && rival && Object.hasOwn(outcomes, result.outcome), 'That race is no longer active.');
  if (rival.id === MYSTERY.id) return settleMystery(state, result);
  need(car?.number === race.car, 'That race is no longer active.');
  const won = result.outcome === 'win', stake = DOLLARS[race.stake];
  const first = won && !state.beaten.includes(rival.id);
  const champion = won && rival.id === 'king';
  const points = won ? ((race.kind === 'drag' ? 8 : 12) + (first ? 2 * rival.tier + 5 : 0) + (champion ? 100 : 0)) : 0;
  if (won) {
    state.wins += 1;
    state[race.kind === 'drag' ? 'dragWins' : 'roadWins'] += 1;
    if (first) state.beaten.push(rival.id);
    state.points += points;
    const best = state.records[race.kind];
    if (best === null || result.ms < best) state.records[race.kind] = result.ms;
  } else state.losses += 1;

  state.races += 1;
  state.cash += won ? stake : -stake;
  state.hours += race.kind === 'road' ? 7 : 4;
  car.fuel = Math.max(0, car.fuel - Math.max(1, Math.ceil(result.fuel || 0)));
  const wear = Math.max(1, Math.floor((result.wear || 0) / 4));
  for (const part of Object.values(car.installed)) if (part) part.wear = Math.max(0, part.wear - wear);
  if (state.races % 6 === 0 && car.timing) car.timing -= 1;
  if (result.outcome === 'crash') {
    car.damage = clamp(Math.round(result.impact * 0.78), 22, 100);
    car.condition = Math.max(0, car.condition - Math.ceil(car.damage * 0.25));
  }
  if (result.outcome === 'engine' || result.outcome === 'gearbox') car.installed[result.outcome].wear = 0;
  const fine = result.outcome === 'police20' ? 20 : result.outcome === 'police75' ? 75 : 0;
  if (fine > state.cash) state.status = 'jail';
  state.cash = Math.max(0, state.cash - fine);
  if (race.stake === 'pink') {
    if (won) state.cars.push(makeCar(CARS[rival.model], state.nextCar++, 75 + rival.tier * 2));
    else removeCar(state, car.number);
  }
  if (champion) {
    state.status = 'champion';
    state.bonus = {unlocked:true,attempts:0,won:false,bestMs:null,car:state.cars.at(-1).number};
  }
  state.race = null;
  const record = {
    id:race.id, kind:race.kind, rival:rival.id, wager:race.stake, outcome:result.outcome,
    won, points, champion, hours:state.hours, ms:result.ms, reaction:result.reaction
  };
  state.last = record;
  checkEnd(state);
  const consequence = race.stake === 'pink' ? won ? ' Their car is yours.' : ' You lost your car.' : '';
  return {state, record, message:outcomes[result.outcome] + consequence};
}
