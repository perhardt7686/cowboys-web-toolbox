import {GameError, activeCar, applyWorkshop, carSpec, garageShowcase, newCampaign, roadProblem,
  settleRace, startRace} from '../../../docs/hot-rod-campaign.mjs';
import {STEP, replayRace} from '../../../docs/hot-rod-racing.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const validId = value => typeof value === 'string' && uuid.test(value);
const maxBytes = 64000;
const allowedActions = new Set([
  'buy-car','sell-car','scrap','select-car','buy-part','sell-part','rest','trip',
  'bolt','remove','install','ignition','jack','tune','paint','decal','body','repair','fuel'
]);

class ServiceError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}

export function makeHotRodHandler({auth, rpc, origins, now = () => Date.now(), id = () => crypto.randomUUID(),
  seed = () => crypto.getRandomValues(new Uint32Array(1))[0]}) {
  async function call(name, args) {
    const {data,error} = await rpc('community_hot_rod_' + name, args);
    if (error?.code === '42501') throw new ServiceError('Approved family membership required.', 403);
    if (error?.code === '40001' || error?.code === '23505') throw new ServiceError('This campaign changed. Reload it before continuing.', 409);
    if (error?.code === '22023') throw new GameError(error.message);
    if (error) throw new ServiceError('The save service is temporarily unavailable.');
    return data;
  }
  const abandoned = {outcome:'abandoned', ms:0, fuel:2, wear:0, reaction:0};
  function replay(race, inputs) {
    const {result,ticks} = replayRace(race, inputs);
    if (now() - race.issuedAt + 250 < ticks * STEP * 1000) {
      throw new GameError('The driving log ended before the race could finish.');
    }
    return result;
  }
  async function family(p_member, body) {
    if (body.type === 'crew') {
      const crew = await call('crew', {p_member});
      return {...crew, members:crew.members.map(({campaign, ...member}) => ({
        ...member, garage:campaign ? garageShowcase(campaign) : {selected:null,cars:[]}
      }))};
    }
    if (body.type === 'invite') {
      if (!validId(body.memberId) || !validId(body.operation) || !['drag','road'].includes(body.kind)) {
        throw new GameError('Choose a family driver and a course.');
      }
      return {challenge:await call('duel_invite', {
        p_member,p_target:body.memberId,p_kind:body.kind,p_seed:seed(),p_id:body.operation
      })};
    }
    if (!validId(body.challengeId)) throw new GameError('Choose a challenge.');
    const p_id = body.challengeId;
    if (body.type === 'respond') {
      if (typeof body.accept !== 'boolean') throw new GameError('Accept or decline the challenge.');
      return {challenge:await call('duel_respond', {p_member,p_id,p_accept:body.accept})};
    }
    const active = await call('duel_read', {p_member,p_id});
    if (body.type === 'duel-start') {
      if (active.challenge.status !== 'accepted' || active.result) throw new GameError('An accepted open challenge is required.');
      if (active.race) return {race:active.race};
      const saved = await call('read', {p_member}), car = activeCar(saved.state);
      if (saved.state?.race) throw new GameError('Finish the active campaign race first.');
      const {kind} = active.challenge;
      const problem = roadProblem(car, kind === 'road' ? 9 : 3);
      if (problem) throw new GameError(problem);
      const spec = carSpec(car, kind);
      const contract = {id:id(),seed:active.seed,kind,stake:'kicks',rival:'family',
        issuedAt:now(),car:car.number,player:spec,opponent:spec,timeTrial:true,
        patrol:false,reaction:0,skill:1};
      if([2,3].includes(body.physicsVersion))contract.physicsVersion=body.physicsVersion;
      return {race:await call('duel_start', {p_member,p_id,p_expected:saved.revision,p_race:contract})};
    }
    if (!active.race || body.raceId !== active.race.id) throw new GameError('That run is unavailable.');
    if (active.result) return {challenge:active.challenge};
    if (active.challenge.status !== 'accepted') throw new GameError('That challenge is no longer open.');
    const result = body.type === 'duel-forfeit' ? abandoned : replay(active.race, body.inputs);
    return {challenge:await call('duel_finish', {p_member,p_id,p_race_id:active.race.id,p_result:result})};
  }
  return async function handle(request) {
    const origin = request.headers.get('origin');
    const permitted = origin && origins.includes(origin);
    const headers = {
      'Content-Type':'application/json', 'Cache-Control':'no-store', 'Vary':'Origin',
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'
    };
    if (permitted) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (body, status = 200) => new Response(JSON.stringify(body), {status, headers});
    if (origin && !permitted) return reply({error:'This origin is unavailable.'}, 403);
    if (request.method === 'OPTIONS') return new Response(null, {status:204,headers});
    if (request.method !== 'POST') return reply({error:'Method not allowed.'}, 405);
    try {
      const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/iu)?.[1];
      if (!token || token.length > 8192) throw new ServiceError('Sign in to play Hot Rod.', 401);
      const {data, error} = await auth(token);
      if (error || !data?.user || data.user.is_anonymous) throw new ServiceError('Sign in to play Hot Rod.', 401);
      const p_member = data.user.id;
      if (Number(request.headers.get('content-length')) > maxBytes) throw new ServiceError('Driving log is too large.', 413);
      const reader = request.body?.getReader();
      let bytes = 0, raw = '';
      const decoder = new TextDecoder();
      if (reader) {
        for (;;) {
          const {done,value} = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > maxBytes) { await reader.cancel(); throw new ServiceError('Driving log is too large.', 413); }
          raw += decoder.decode(value, {stream:true});
        }
      }
      let body;
      try { body = JSON.parse(raw + decoder.decode()); }
      catch { throw new ServiceError('Invalid game request.', 400); }
      if (!body || typeof body.type !== 'string') throw new ServiceError('Invalid game request.', 400);
      if (body.type === 'load') return reply(await call('read', {p_member}));
      if (['crew','invite','respond','duel-start','duel-finish','duel-forfeit'].includes(body.type)) {
        return reply(await family(p_member, body));
      }
      if (!validId(body.operation) ||
          !Number.isSafeInteger(body.revision) || body.revision < 0 || body.revision >= 2147483647) {
        throw new ServiceError('Invalid save revision.', 400);
      }
      const previous = await call('receipt', {p_member,p_operation:body.operation});
      if (previous) return reply(previous);
      const saved = await call('read', {p_member});
      if (body.revision !== saved.revision) throw new ServiceError('This campaign changed. Reload it before continuing.', 409);
      const state = saved.state;
      let next;
      if (body.type === 'new') {
        // The client requires a second explicit confirmation before requesting
        // a fresh campaign. The authenticated, revision-checked 'new' mutation
        // intentionally replaces an active summer, including a pending race.
        next = {state:newCampaign(), message:'You have $750 and a whole summer.'};
      } else if (!state) throw new GameError('Start Classic 1963 first.');
      else if (body.type === 'challenge') {
        next = startRace(state, body, {id:id(), seed:seed(), now:now()});
      } else if (body.type === 'finish' || body.type === 'forfeit') {
        const race = state.race;
        if (!race || body.raceId !== race.id) throw new GameError('That race is no longer active.');
        next = settleRace(state, body.type === 'forfeit' ? abandoned : replay(race, body.inputs));
      } else if (allowedActions.has(body.type)) next = applyWorkshop(state, body);
      else throw new ServiceError('Unknown game action.', 400);

      return reply(await call('commit', {
        p_member,p_expected:saved.revision,p_operation:body.operation,
        p_state:next.state,p_message:next.message,p_result:next.record ?? null
      }));
    } catch (error) {
      if (error instanceof GameError) return reply({error:error.message}, 422);
      if (error instanceof ServiceError) return reply({error:error.message}, error.status);
      return reply({error:'Hot Rod could not save this action. Try again.'}, 503);
    }
  };
}
