import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {letterKnowledge} from '../docs/family-word-clues.mjs';
import {countLegalPairs,isTileFree} from '../docs/mahjong-moves.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('correct letters survive refresh and take precedence over earlier absence',()=>{
 const r=letterKnowledge([{guess:'ROBOT',feedback:['absent','absent','absent','absent','absent']},
  {guess:'TENDS',feedback:['absent','correct','absent','present','absent']},
  {guess:'PENED',feedback:['absent','correct','absent','correct','correct']}]);
 assert.equal(r.fixed[1],'E');assert.equal(r.fixed[3],'E');assert.equal(r.fixed[4],'D');
 assert.equal(r.used.E,'correct');assert.equal(r.used.D,'correct');
 assert.ok(!r.absent.includes('E'));assert.ok(!r.absent.includes('D'));
 assert.ok(r.absent.includes('R'));assert.ok(r.absent.includes('O'));
});
test('an absent duplicate never overrides a previously confirmed letter',()=>{
 const r=letterKnowledge([{guess:'AAAAA',feedback:['correct','absent','absent','absent','absent']}]);
 assert.equal(r.fixed[0],'A');assert.equal(r.used.A,'correct');assert.deepEqual(r.absent,[]);
});
test('tiles counted only if both free and their marks match',()=>{
 const free=[{id:1,x:0,y:0,z:0,s:1,gone:false},{id:2,x:3,y:0,z:0,s:1,gone:false},
 {id:3,x:6,y:0,z:0,s:2,gone:false},{id:4,x:7,y:0,z:0,s:3,gone:false}];
 assert.equal(countLegalPairs(free),1);
 free[1].s=4;assert.equal(countLegalPairs(free),0);
 const blocked=[{id:1,x:0,y:0,z:0,s:5,gone:false},{id:2,x:0,y:0,z:1,s:5,gone:false}];
 assert.equal(isTileFree(blocked,blocked[0]),false);assert.equal(countLegalPairs(blocked),0);
});
test('both word games are wired to shared letter reducer and saved feedback',()=>{
 const q=read('docs/commons-family.mjs'),w=read('docs/commons-letter-lock.mjs');
 assert.match(q,/ensureQuestKeyboard/);assert.match(q,/paintQuestKeyboard\(data\)/);
 assert.match(w,/letter-lock-confirmed/);assert.match(w,/letter-lock-excluded/);
 assert.match(w,/data\.my_attempts/);assert.match(w,/Team \${data\.attempts\}/);
 assert.match(w,/guesses\.length\+\(data\.finished\?0:1\)/);
 assert.match(read('docs/community.html'),/family-word-feedback\.css\?v=personal9/);
});
test('Mahjong shows no-moves warning and shuffle event is handled',()=>{
 const m=read('docs/commons-mahjong.mjs');
 assert.match(m,/mahjong-no-moves/);assert.match(m,/countLegalPairs/);
 assert.match(m,/shuffle_unavailable/);
});
