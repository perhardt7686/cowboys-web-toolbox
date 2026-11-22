import test from 'node:test';
import assert from 'node:assert/strict';
import {
 SKY_LIVE_VERSION,SKY_LIVE_MAX_PLAYERS,SKY_LIVE_MIN_PLAYERS,
 SKY_LIVE_SEND_INTERVAL_MS,validateLiveRoom,makeVisualFrame,
 acceptVisualFrame,interpolateVisualFrames,peerFrameFresh
} from '../docs/skyboard-live-race-protocol.mjs';

const id='123e4567-e89b-42d3-a456-426614174000';
const now=1700000000000;
const room=(count=2)=>({id,stage:1,seed:196930,capacity:4,hostSlot:0,startAtMs:now+3000,
 players:Array.from({length:count},(_,slot)=>({slot,ready:true}))});
const state={tick:120,progress:13.7,x:-.23,y:2,lean:.16,done:false};
test('Skyboard live lobby requires a real future start and 2–4 ready distinct slots',()=>{
 assert.equal(SKY_LIVE_MIN_PLAYERS,2);
 assert.equal(SKY_LIVE_MAX_PLAYERS,4);
 assert.equal(SKY_LIVE_SEND_INTERVAL_MS,100);
 for(let n of [2,3,4]){
  const x=validateLiveRoom(room(n),now);
  assert.equal(x.playerSlots.length,n);
  assert.deepEqual(x.playerSlots,Array.from({length:n},(_,i)=>i));
 }
 assert.throws(()=>validateLiveRoom(room(1),now),/need 2–4/);
 const five=room(5);five.capacity=5;
 assert.throws(()=>validateLiveRoom(five,now),/capacity/);
 const dup=room(2);dup.players[1].slot=0;
 assert.throws(()=>validateLiveRoom(dup,now),/duplicate/);
 const unready=room(2);unready.players[1].ready=false;
 assert.throws(()=>validateLiveRoom(unready,now),/ready/);
 const forged=room(2);forged.id='public-room';
 assert.throws(()=>validateLiveRoom(forged,now),/identifier/);
 const tooSoon=room(2);tooSoon.startAtMs=now+200;
 assert.throws(()=>validateLiveRoom(tooSoon,now),/synchronized/);
 const tooLate=room(2);tooLate.startAtMs=now+30000;
 assert.throws(()=>validateLiveRoom(tooLate,now),/synchronized/);
});

test('Only bounded, fresh sequenced frames from the expected room/slot can render',()=>{
 const frame=makeVisualFrame(id,1,5,state);
 assert.equal(frame.v,SKY_LIVE_VERSION);
 const validated=acceptVisualFrame(frame,{roomId:id,slot:1,courseLength:400});
 assert.equal(validated.z,13.7);
 assert.equal(validated.seq,5);
 assert.equal(acceptVisualFrame(frame,{roomId:id,slot:1,lastSequence:5}),null);
 assert.equal(acceptVisualFrame(frame,{roomId:id,slot:0}),null);
 assert.equal(acceptVisualFrame({...frame,room:'other'}, {roomId:id,slot:1}),null);
 assert.equal(acceptVisualFrame({...frame,x:Infinity}, {roomId:id,slot:1}),null);
 assert.equal(acceptVisualFrame({...frame,z:1200}, {roomId:id,slot:1}),null);
 assert.equal(acceptVisualFrame({...frame,tick:10}, {roomId:id,slot:1,lastTick:11}),null);
 assert.throws(()=>makeVisualFrame(id,1,2,{...state,x:10}),/invalid simulation/);
});

test('Interpolation cannot extrapolate remote rider or establish an official result',()=>{
 const a=acceptVisualFrame(makeVisualFrame(id,0,1,state),{roomId:id,slot:0});
 const b=acceptVisualFrame(makeVisualFrame(id,0,2,{...state,tick:126,progress:16.2,x:1.2}),{roomId:id,slot:0,lastSequence:1});
 const midpoint=interpolateVisualFrames(a,b,.5);
 assert.equal(midpoint.slot,0);
 assert.equal(midpoint.z,(a.z+b.z)/2);
 assert.equal(Object.keys(midpoint).includes('won'),false);
 assert.equal(Object.keys(midpoint).includes('points'),false);
 assert.throws(()=>interpolateVisualFrames(a,b,1.2),/interpolation/);
 assert.throws(()=>interpolateVisualFrames(a,{...b,slot:3},.2),/interpolation/);
 assert.equal(peerFrameFresh(1000,2000),true);
 assert.equal(peerFrameFresh(1000,2300),false);
 assert.equal(peerFrameFresh(1000,999),false);
});
