import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSIC_AWARDS,CLASSIC_AWARD_COUNT,AWARD_GRADES,
 awardEarned,awardMetric,awardLevel,freshlyEarned} from '../docs/mahjong-classic-awards.mjs';

test('Classic Turtle has an expansive unique catalogue with genuinely extreme tiers',()=>{
 assert.equal(CLASSIC_AWARD_COUNT,211);
 assert.equal(new Set(CLASSIC_AWARDS.map(a=>a.id)).size,CLASSIC_AWARDS.length);
 assert.ok(CLASSIC_AWARDS.some(a=>a.category==='speed'&&a.target<=120));
 assert.ok(CLASSIC_AWARDS.some(a=>a.category==='pairs'&&a.target>=100000));
 assert.ok(CLASSIC_AWARDS.some(a=>a.category==='daily-chain'&&a.target>=365));
 assert.ok(CLASSIC_AWARDS.filter(a=>awardLevel(a.grade)>=7).length>=30);
 assert.ok(AWARD_GRADES.includes('Impossible'));
 assert.equal(CLASSIC_AWARDS.filter(a=>a.category==='turtle-ritual').length,16);
 for(const kind of ['flower','season','dragon','wind','bamboo','circles','characters']){
  assert.ok(CLASSIC_AWARDS.some(a=>a.id==='ritual-open-'+kind));
  assert.ok(CLASSIC_AWARDS.some(a=>a.id==='ritual-close-'+kind));
 }
 assert.ok(CLASSIC_AWARDS.some(a=>a.id==='ritual-sevenfold'&&a.grade==='Impossible'));
 for(const family of ['turtle','temple','garden'])
  assert.ok(CLASSIC_AWARDS.some(a=>a.category==='layout-'+family));
 for(const kind of ['flower','season','dragon','wind','bamboo','circles','characters'])
  assert.ok(CLASSIC_AWARDS.some(a=>a.category==='face-'+kind));
});

test('Trophies unlock only when verified local progress crosses milestone, never on button selection',()=>{
 const first=CLASSIC_AWARDS.find(a=>a.id==='pairs-1');
 const extreme=CLASSIC_AWARDS.find(a=>a.id==='pairs-100000');
 const speed=CLASSIC_AWARDS.find(a=>a.id==='speed-120');
 assert.equal(awardEarned({pairs:0},first),false);
 assert.equal(awardEarned({pairs:1},first),true);
 assert.equal(awardMetric({pairs:9999},extreme),9999);
 assert.equal(awardEarned({pairs:9999},extreme),false);
 assert.equal(awardEarned({bestWinSeconds:0},speed),false);
 assert.equal(awardEarned({bestWinSeconds:121},speed),false);
 assert.equal(awardEarned({bestWinSeconds:120},speed),true);
 const earned=freshlyEarned({pairs:1});
 assert.deepEqual(earned.map(a=>a.id),['pairs-1']);
 assert.deepEqual(freshlyEarned({pairs:1},['pairs-1']),[]);
});

test('Classic award model avoids server RPСs, licensing or downloading music',async()=>{
 const {readFileSync}=await import('node:fs');
 const module=readFileSync(new URL('../docs/mahjong-classic-awards.mjs',import.meta.url),'utf8');
 for(const forbidden of ['community_mahjong_','https://','Audio(','.rpc(','localStorage','sessionStorage','fetch('])
  assert.equal(module.includes(forbidden),false,'pure award engine must not use '+forbidden);
 assert.match(module,/prefers-reduced-motion/);
 assert.match(module,/aria-hidden/);
 assert.match(module,/querySelectorAll/);
});
