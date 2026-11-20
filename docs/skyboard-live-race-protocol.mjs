/*
 * Skyboard Sprint — private 2–4-racer protocol foundation (NOT LIVE YET).
 *
 * The only purpose of broadcast frames is to draw remote racers.
 * They must NEVER award points, unlock boards, or establish a race winner.
 * Connection authorization belongs to an approved-member, server-owned room
 * and a private Supabase Realtime channel with membership-scoped RLS.
 * This module alone cannot authorize a room or a participant.
 */
export const SKY_LIVE_VERSION=1;
export const SKY_LIVE_MIN_PLAYERS=2;
export const SKY_LIVE_MAX_PLAYERS=4;
export const SKY_LIVE_SEND_INTERVAL_MS=100;
export const SKY_LIVE_STALE_AFTER_MS=1200;

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
const fail=message=>{throw new TypeError('Skyboard live race: '+message);};

/**
 * Validates a server-issued ready-to-start room snapshot. A valid shape
 * never substitutes for server authorization or an RLS subscription.
 */
export function validateLiveRoom(room,clockMs){
 if(!room||typeof room!=='object'||!uuid.test(String(room.id||'')))fail('invalid room identifier');
 if(!int(room.stage,1,30)||!int(room.seed,0,2000000000))fail('invalid course');
 if(!int(room.capacity,2,4)||!Array.isArray(room.players))fail('invalid room capacity');
 if(room.players.length<SKY_LIVE_MIN_PLAYERS||room.players.length>room.capacity)fail('need 2–4 participants');
 const slots=new Set();
 for(const player of room.players){
  if(!player||!int(player.slot,0,room.capacity-1)||slots.has(player.slot))fail('duplicate or invalid slot');
  if(player.ready!==true)fail('all players must be ready');
  slots.add(player.slot);
 }
 if(!int(room.hostSlot,0,room.capacity-1)||!slots.has(room.hostSlot))fail('invalid host');
 if(!Number.isFinite(clockMs)||!finite(room.startAtMs,clockMs+1500,clockMs+20000))
  fail('race requires a synchronized future start');
 return Object.freeze({id:room.id,stage:room.stage,seed:room.seed,capacity:room.capacity,
  hostSlot:room.hostSlot,startAtMs:room.startAtMs,
  playerSlots:Object.freeze([...slots].sort((a,b)=>a-b))});
}

/** A bounded, non-authoritative visual snapshot for the race channel. */
export function makeVisualFrame(roomId,slot,sequence,state){
 if(!uuid.test(String(roomId||''))||!int(slot,0,3)||!int(sequence,0,2147483647))
  fail('invalid frame identity');
 if(!state||!int(state.tick,0,18000)||!finite(state.progress,0,600)||
  !finite(state.x,-8.25,8.25)||!finite(state.y,-20,30)||
  !finite(state.lean,-1,1))fail('invalid simulation snapshot');
 return {v:SKY_LIVE_VERSION,room:roomId,slot,seq:sequence,tick:state.tick,
  z:Math.round(state.progress*100)/100,x:Math.round(state.x*100)/100,
  y:Math.round(state.y*100)/100,lean:Math.round(state.lean*100)/100,
  finished:Boolean(state.done)};
}

/**
 * Accept only for rendering, not for placement/score. Callers must first
 * authenticate the *sender* via a server-authorized room/participant binding.
 * A payload's slot is NOT proof of who sent it.
 */
export function acceptVisualFrame(frame,{roomId,slot,lastSequence=-1,lastTick=-1,courseLength=600}={}){
 if(!frame||frame.v!==SKY_LIVE_VERSION||frame.room!==roomId||frame.slot!==slot)return null;
 if(!int(frame.slot,0,3)||!int(frame.seq,0,2147483647)||
  frame.seq<=lastSequence||!int(frame.tick,0,18000)||frame.tick<lastTick)return null;
 if(!finite(frame.z,0,courseLength)||!finite(frame.x,-8.25,8.25)||
  !finite(frame.y,-20,30)||!finite(frame.lean,-1,1)||
  typeof frame.finished!=='boolean')return null;
 return Object.freeze({
  slot:frame.slot,seq:frame.seq,tick:frame.tick,z:frame.z,
  x:frame.x,y:frame.y,lean:frame.lean,finished:frame.finished
 });
}

/** No prediction or extrapolation past the latest received frame. */
export function interpolateVisualFrames(a,b,ratio){
 if(!a||!b||a.slot!==b.slot||!finite(ratio,0,1))fail('invalid interpolation');
 const value=(key)=>a[key]+(b[key]-a[key])*ratio;
 return Object.freeze({slot:b.slot,z:value('z'),x:value('x'),y:value('y'),
  lean:value('lean'),finished:b.finished});
}

/** Peer timeout should hide its rider rather than freeze a fake competitor. */
export function peerFrameFresh(lastReceivedAtMs,nowMs){
 return Number.isFinite(lastReceivedAtMs)&&Number.isFinite(nowMs)&&
   nowMs>=lastReceivedAtMs&&nowMs-lastReceivedAtMs<=SKY_LIVE_STALE_AFTER_MS;
}
