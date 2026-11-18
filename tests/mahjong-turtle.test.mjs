import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {layoutPositions,TURTLE_FACES,buildTurtleDeal,isFreeTile,availablePairs,
 pairIsLegal,replayTurtleMoves,utcDailyKey,dailyDealSeed,faceById} from '../docs/mahjong-turtle-engine.mjs';

const counts=tiles=>tiles.reduce((m,t)=>(m.set(t.face,(m.get(t.face)||0)+1),m),new Map());
test('traditional classic turtle has 87+36+16+4+1 tiles across five layers',()=>{
 const positions=layoutPositions('turtle');
 assert.equal(positions.length,144);
 assert.deepEqual([0,1,2,3,4].map(z=>positions.filter(p=>p.z===z).length),[87,36,16,4,1]);
 assert.deepEqual(positions.at(-1),{id:143,x:6.5,y:3,z:4});
 assert.deepEqual(positions.filter(p=>p.z===0&&[0,13].includes(p.x)).map(p=>[p.x,p.y]),[[0,3],[13,2.5],[13,3.5]]);
});
test('traditional deck has 34 kinds x4 and each flower/season once',()=>{
 assert.equal(TURTLE_FACES.length,42);
 assert.equal(new Set(TURTLE_FACES.map(f=>f.id)).size,42);
 const deal=buildTurtleDeal('turtle',100);
 const deck=counts(deal.tiles);
 assert.equal(deck.size,42);
 for(const face of TURTLE_FACES){
  assert.equal(deck.get(face.id),['flower','season'].includes(face.kind)?1:4,face.id);
 }
 assert.equal([...deck.values()].reduce((a,b)=>a+b,0),144);
});
test('no higher-layer overlap and one horizontal edge open defines legal tiles',()=>{
 const tiles=layoutPositions('turtle');
 const removed=new Set();
 assert.ok(isFreeTile(tiles,tiles.at(-1),removed),'single crown is exposed');
 for(const t of tiles.filter(p=>p.z===3))assert.equal(isFreeTile(tiles,t,removed),false,'capstone covers four below');
 const interior=tiles.find(p=>p.z===0&&p.x===6&&p.y===3);
 assert.equal(isFreeTile(tiles,interior,removed),false);
 removed.add(143);
 assert.equal(tiles.filter(p=>p.z===3&&isFreeTile(tiles,p,removed)).length,4);
 assert.equal(isFreeTile(tiles,tiles.find(p=>p.x===0&&p.y===3&&p.z===0),removed),true);
});
test('daily seed is UTC-stable, validated, and changes by date',()=>{
 assert.equal(utcDailyKey(new Date('2026-11-18T23:59:00Z')),'2026-11-18');
 assert.equal(utcDailyKey(new Date('2026-11-19T00:01:00Z')),'2026-11-19');
 assert.equal(dailyDealSeed('2026-11-18'),dailyDealSeed('2026-11-18'));
 assert.notEqual(dailyDealSeed('2026-11-18'),dailyDealSeed('2026-11-19'));
 assert.throws(()=>dailyDealSeed('2026-02-30'));
});
test('free/daily layout deals deterministically contain verified full legal clearing paths',()=>{
 for(const layout of ['turtle','temple','garden']){
  assert.equal(layoutPositions(layout).length,144);
  for(const seed of [0,1,2,3,9,2026,0xffffffff,dailyDealSeed('2026-11-18')]){
   const a=buildTurtleDeal(layout,seed),b=buildTurtleDeal(layout,seed);
   assert.deepEqual(a,b);
   assert.equal(a.witness.length,72);
   assert.ok(availablePairs(a.tiles).length>0,`no first pair in ${layout}`);
   assert.equal(replayTurtleMoves(a,a.witness).size,144,`${layout} ${seed}`);
  }
 }
});
test('flowers match any flower, seasons any season, never across families',()=>{
 const flowers=TURTLE_FACES.filter(f=>f.kind==='flower');
 const seasons=TURTLE_FACES.filter(f=>f.kind==='season');
 assert.equal(flowers.length,4);assert.equal(seasons.length,4);
 for(const first of flowers)for(const second of flowers)assert.equal(faceById(first.id).group,faceById(second.id).group);
 for(const first of seasons)for(const second of seasons)assert.equal(faceById(first.id).group,faceById(second.id).group);
 assert.notEqual(flowers[0].group,seasons[0].group);
});
test('replay rejects illegal or repeated pair and accepts valid undo history',()=>{
 const deal=buildTurtleDeal('turtle',177);
 const [a,b]=deal.witness[0];
 assert.equal(pairIsLegal(deal,new Set(),a,b),true);
 assert.equal(replayTurtleMoves(deal,[[a,b]]).size,2);
 assert.equal(replayTurtleMoves(deal,[]).size,0);
 assert.throws(()=>replayTurtleMoves(deal,[[a,b],[a,b]]));
 assert.throws(()=>replayTurtleMoves(deal,[[a,a]]));
 assert.throws(()=>replayTurtleMoves(deal,[[a,99999]]));
 assert.throws(()=>replayTurtleMoves(deal,[['1','2']]));
});
test('UI is separate from Mystery Road, has no shuffle, and labels browser-local saves',()=>{
 const m=readFileSync(new URL('../docs/mahjong-turtle-ui.mjs',import.meta.url),'utf8');
 const c=readFileSync(new URL('../docs/mahjong-turtle.css',import.meta.url),'utf8');
 assert.match(m,/mountClassicTurtle/);
 assert.match(m,/localStorage/);
 assert.match(m,/userId/);
 assert.match(m,/No shuffle/);
 assert.doesNotMatch(m,/community_mahjong_(?:pair|start|undo|shuffle)|\.rpc\(/);
 assert.doesNotMatch(m,/id="turtle-shuffle"/);
 assert.match(m,/Mystery Road account saves and achievements are separate and untouched/);
 assert.match(m,/Daily Challenge/);
 assert.match(m,/turtle-undo/);
 assert.match(m,/turtle-pause/);
 assert.match(m,/turtle-hint/);
 assert.match(m,/turtle-zoom-in/);
 assert.match(c,/min-height:44px/);
 assert.match(c,/prefers-reduced-motion/);
});