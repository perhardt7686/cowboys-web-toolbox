import {GameError} from './hot-rod-campaign.mjs';

export const STEP = 1 / 20;
export const INPUT = Object.freeze({gas:1, brake:2, left:4, right:8, clutch:16, up:32, down:64});
export const MAX_STEPS = 5600;
const MPH = 2.236936;
const TIRE_RADIUS = 0.337;
const IDLE = 770;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function courseCurve(distance, seed) {
  const phase = (seed % 19) * 0.19;
  const entrance = clamp((distance - 85) / 60, 0, 1);
  return entrance * (0.64 * Math.sin(distance / 145) + 0.34 * Math.sin(distance / 63 + phase));
}

const makeDriver = spec => ({
  gear:spec.automatic ? 1 : 0, engine:IDLE, speed:0, distance:0, offset:0, heading:0,
  heat:0, gearbox:0, slip:0, overrev:0, fuel:0, wear:0, reaction:null,
  shiftTime:0, impact:0, offroad:0,
});

export function createRace(contract) {
  return {
    contract, tick:0, player:makeDriver(contract.player), opponent:makeDriver(contract.opponent),
    greenAt:42 + contract.seed % 24,
    length:contract.kind === 'road' ? 4023.36 : 402.336,
    patrolAt:null, pullOver:0, escapeTime:0, escaped:false, result:null, aiFinish:null, playerFinish:null,
  };
}

export function raceClock(race) {
  return Math.max(0, race.tick - race.greenAt) * STEP;
}

function result(race, outcome) {
  const player = race.player;
  race.result = {
    outcome,
    ms:race.playerFinish ?? Math.round(raceClock(race) * 1000),
    reaction:player.reaction ?? 0, wear:player.wear,
    impact:player.impact, fuel:player.fuel
  };
}

function drive(d, spec, control, curve, ai = false) {
  const gas = control.gas;
  const brake = control.brake;
  d.shiftTime = Math.max(0, d.shiftTime - STEP);
  const before = d.gear;
  if (spec.automatic) {
    if (d.engine > spec.redline * 0.84 && d.gear < spec.ratios.length) d.gear += 1;
    if (d.engine < spec.redline * 0.38 && d.gear > 1) d.gear -= 1;
  } else if (control.shift) {
    d.gear = clamp(d.gear + control.shift, 0, spec.ratios.length);
    if (!ai && before !== d.gear && before > 0 && gas > 0.5 && !control.clutch) {
      d.gearbox += (d.engine / spec.redline) * 1.03 / spec.transmission;
    }
  }
  if (before !== d.gear) d.shiftTime = spec.automatic ? 0.14 : 0.27;
  const ratio = d.gear ? spec.ratios[d.gear - 1] * spec.final : 0;
  const mass = spec.weight * 0.453592;
  const coupled = !control.clutch && ratio > 0 && d.shiftTime <= 0;
  const speedRpm = d.speed * ratio * 60 / (2 * Math.PI * TIRE_RADIUS);
  const loadRpm = Math.max(IDLE, speedRpm + gas * Math.max(0, 900 - d.speed * 40));
  const airRpm = IDLE + gas * spec.redline * 1.08;
  const target = coupled ? loadRpm : airRpm;
  d.engine += (target - d.engine) * (coupled ? 0.36 : 0.095);
  const rpmRatio = d.engine / spec.redline;
  const torqueShape = clamp(1.05 - (rpmRatio - 0.57) ** 2 * 1.2, 0.27, 1.05);
  const wheelForce = coupled ? gas * spec.torque * 1.35582 * torqueShape * ratio * 0.78 / TIRE_RADIUS : 0;
  const powerForce = spec.hp * 745.7 * 0.82 / Math.max(5, d.speed);
  const traction = spec.grip * 9.81 * mass * 0.57;
  const onPavement = ai || Math.abs(d.offset) <= 1.13;
  const driven = Math.min(wheelForce, powerForce, traction * (onPavement ? 1 : 0.54));
  d.slip = clamp((wheelForce - traction) / Math.max(1, traction), 0, 1);
  const resistance = d.speed > 0 ? 0.507 * d.speed ** 2 + (onPavement ? 108 : 1220) + (coupled && !gas ? 226 : 0) : 0;
  d.speed = clamp(d.speed + (driven - resistance - brake * mass * 7.6 * spec.grip) * STEP / mass, 0, 61);
  d.distance += d.speed * STEP;
  if (!ai) {
    const steering = control.steer * (0.62 + 0.57 * spec.grip) * Math.min(1.36, 0.68 + d.speed * 0.024);
    const understeer = 1 - Math.max(0, d.speed - 23) * Math.abs(curve) * (1 - spec.grip * 0.58) / 34;
    d.heading += (steering * understeer - d.heading) * 0.21;
    d.offset += (d.heading - curve * d.speed / 27 - d.offset * 0.055) * d.speed * STEP / 8.5;
    d.heat = Math.max(0, d.heat + STEP * ((gas > 0.8 ? 0.035 : -0.085) +
      Math.max(0, rpmRatio - 0.83) * 1.15 - 0.0034 * d.speed));
    d.overrev = Math.max(0, d.overrev + STEP * (rpmRatio > 1.02 ? 0.45 + 2.8 * (rpmRatio - 1) : -0.32));
    d.fuel += STEP * (0.022 + gas * (0.12 + spec.hp * 0.00038 + d.engine * 0.000017));
    d.wear += STEP * (0.10 + d.slip * 0.16 + Math.max(0, rpmRatio - 0.84) * 1.15 + (onPavement ? 0 : 0.45));
    d.gearbox = Math.max(0, d.gearbox - STEP * 0.024);
    d.offroad = onPavement ? 0 : d.offroad + STEP;
  }
}

function playerControl(mask) {
  return {
    gas:Number(!!(mask & INPUT.gas)), brake:Number(!!(mask & INPUT.brake)),
    steer:Number(!!(mask & INPUT.right)) - Number(!!(mask & INPUT.left)),
    clutch:!!(mask & INPUT.clutch),
    shift:Number(!!(mask & INPUT.up)) - Number(!!(mask & INPUT.down))
  };
}

function rivalControl(race, curve, time) {
  const d = race.opponent, spec = race.contract.opponent;
  const skill = race.contract.skill;
  if (time < race.contract.reaction) return {gas:0,brake:1,steer:0,clutch:true,shift:0};
  const road = race.contract.kind === 'road';
  const experience = Math.max(0, (skill - 0.80) / 0.35);
  const planned = road ? Math.min(50, (28 + 8 * skill) / (1 + Math.abs(curve) * (1.38 - 0.42 * skill)) + 7.25 * experience) : 64;
  let shift = 0;
  if (d.shiftTime === 0) {
    if (!d.gear || (d.engine > spec.redline * 0.84 && d.gear < spec.ratios.length)) shift = 1;
    else if (d.gear > 1 && d.engine < spec.redline * 0.34) shift = -1;
  }
  return {gas:d.speed < planned ? clamp(0.39 + skill * 0.49, 0, 1) : 0.12,
    brake:d.speed > planned + 1.1 ? 0.56 : 0,steer:0,clutch:false,shift};
}

export function stepRace(race, mask) {
  if (race.result) return race;
  race.tick += 1;
  const {player, opponent, contract} = race;
  const command = playerControl(mask);
  const time = raceClock(race);
  const green = race.tick >= race.greenAt;
  const road = contract.kind === 'road';
  const curve = road ? courseCurve(player.distance, contract.seed) : 0;
  if (green && player.reaction === null && command.gas && !command.clutch && (player.gear || command.shift > 0)) {
    player.reaction = Math.round(time * 1000);
  }
  drive(player, contract.player, command, curve);
  if (!green) {
    if (player.distance > 0.44) result(race, 'false_start');
    else if (player.overrev > contract.player.endurance * 1.3) result(race, 'engine');
    else if (player.gearbox > 1.65 * contract.player.transmission) result(race, 'gearbox');
    return race;
  }

  if (!contract.timeTrial && race.aiFinish === null) {
    const aiCurve = road ? courseCurve(opponent.distance + 28, contract.seed) : 0;
    drive(opponent, contract.opponent, rivalControl(race, aiCurve, time), aiCurve, true);
    if (opponent.distance >= race.length) race.aiFinish = Math.round(time * 1000);
  }

  if (!race.escaped && race.patrolAt === null && contract.patrol && player.distance > race.length * 0.57 && player.speed * MPH > 56) {
    race.patrolAt = time;
  }
  if (race.patrolAt !== null) {
    race.pullOver = player.speed < 4.5 && Math.abs(player.offset) < 1.35 ? race.pullOver + STEP : 0;
    race.escapeTime = player.speed * MPH > 98 && Math.abs(player.offset) < 0.9 ? race.escapeTime + STEP : 0;
    if (race.pullOver > 0.75) result(race, 'police20');
    else if (race.escapeTime > 4) { race.escaped = true; race.patrolAt = null; }
    else if (time - race.patrolAt > 16) result(race, 'police75');
  }
  if (race.result) return race;
  const adjacent = Math.abs(opponent.distance - player.distance);
  if (!contract.timeTrial && player.offset < -0.71 && player.offset > -1.35 && adjacent < 3.1 && player.speed > 6) {
    const hit = Math.max(10, player.speed * (contract.player.bumpers === 2 ? 1.9 : 2.3) + Math.abs(player.speed - opponent.speed));
    player.impact = Math.max(player.impact, hit);
    player.speed *= 0.72;
    player.offset = -0.40;
    player.wear += 4;
    if (hit > 66) result(race, 'crash');
  }
  if (!race.result && (Math.abs(player.offset) > 1.78 || (player.offroad > 0.85 && player.speed > 29))) {
    player.impact = Math.max(27, player.speed * 2.21 + 17);
    result(race, 'crash');
  }
  if (!race.result && (player.overrev > contract.player.endurance * 1.3 || player.heat > 2.4 * contract.player.endurance)) {
    result(race, 'engine');
  }
  if (!race.result && player.gearbox > 1.65 * contract.player.transmission) result(race, 'gearbox');
  if (!race.result && player.fuel >= contract.player.fuel) result(race, 'fuel');
  if (!race.result && player.distance >= race.length) {
    race.playerFinish = Math.round(time * 1000);
    result(race, contract.timeTrial ? 'finish' : race.aiFinish === null || race.playerFinish < race.aiFinish ? 'win' : 'loss');
  }
  if (!race.result && ((race.aiFinish !== null && time * 1000 > race.aiFinish + 16000) || race.tick >= MAX_STEPS)) {
    result(race, 'loss');
  }
  return race;
}

export function recordInput(log, mask) {
  const last = log.at(-1);
  if (last?.[0] === mask) last[1] += 1;
  else log.push([mask, 1]);
}

export function replayRace(contract, log) {
  if (!Array.isArray(log) || log.length < 1 || log.length > MAX_STEPS) throw new GameError('Missing driving inputs.');
  const race = createRace(contract);
  for (const pair of log) {
    if (!Array.isArray(pair) || pair.length !== 2 || !Number.isInteger(pair[0]) || pair[0] < 0 || pair[0] > 127 ||
        !Number.isInteger(pair[1]) || pair[1] < 1 || race.tick + pair[1] > MAX_STEPS) {
      throw new GameError('Invalid driving inputs.');
    }
    for (let tick = 0; tick < pair[1]; tick += 1) {
      if (race.result) throw new GameError('Driving continued after the finish.');
      stepRace(race, pair[0]);
    }
  }
  if (!race.result) throw new GameError('The race is unfinished.');
  return {result:race.result, ticks:race.tick};
}

export const displaySpeed = driver => Math.round(driver.speed * MPH);
