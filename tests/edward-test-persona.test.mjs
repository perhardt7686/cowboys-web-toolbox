import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  EDWARD_PREVIEW_ID,EDWARD_PREVIEW_NAME,EDWARD_PREVIEW_SCOPES,
  EDWARD_FAIR_PLAY,isEdwardTestPreview,edwardTestMember,edwardTestRank
} from '../docs/edward-test-persona.mjs';
import {isTileFree,countLegalPairs} from '../docs/mahjong-moves.mjs';

test('Edward is a localhost preview, not a production login or owner',()=>{
 for(const host of ['localhost','127.0.0.1']){
  assert.equal(isEdwardTestPreview({hostname:host,search:'?preview=1&role=edward'}),true);
 }
 for(const url of [
  {hostname:'perhardt7686.github.io',search:'?preview=1&role=edward'},
  {hostname:'chatgpt.com',search:'?preview=1&role=edward'},
  {hostname:'localhost',search:'?role=edward'},
  {hostname:'localhost',search:'?preview=1&role=owner'},
  {hostname:'localhost',search:'?preview=0&role=edward'}
 ])assert.equal(isEdwardTestPreview(url),false,url);
 const m=edwardTestMember(),grant=edwardTestRank();
 assert.equal(m.user_id,EDWARD_PREVIEW_ID);
 assert.match(m.display_name,/Edward.*AI Test/);
 assert.equal(m.role,'member');
 assert.equal(m.status,'approved');
 assert.equal(m.automated,true);
 assert.equal(grant.role_id,'moderator');
 assert.deepEqual(grant.scopes,['feedback']);
 assert.deepEqual([...EDWARD_PREVIEW_SCOPES],['feedback']);
 assert.equal(grant.test_preview_only,true);
 assert.equal(EDWARD_FAIR_PLAY.leaderboardInProduction,false);
 assert.equal(EDWARD_FAIR_PLAY.noFalsifiedWins,true);
 assert.equal(EDWARD_FAIR_PLAY.noFreeCurrencyOrUnlocks,true);
 const src=readFileSync(new URL('../docs/community.js',import.meta.url),'utf8');
 assert.match(src,/const edward=role==='edward'&&isPreview/);
 assert.match(src,/state\.user=null/);
 assert.match(src,/isEdwardTestPreview/);
 const powers=readFileSync(new URL('../docs/community-powers.mjs',import.meta.url),'utf8');
 assert.match(powers,/demoGrants=new Map\(\[\[EDWARD_PREVIEW_ID,edwardTestRank\(\)\]\]\)/);
 assert.equal(EDWARD_PREVIEW_NAME,'Edward (AI Test)');
});

test('Edward fair-play simulated Mahjong uses ONLY legitimate free pairs',()=>{
 // A real Mahjong-style 72-tile test layout, six independent columns of
 // paired end-faces across six rows. No server, score, rewards or unlocks.
 const tiles=[];
 let id=0;
 for(let y=0;y<6;y++){
  const faces=[1,2,3,4,5,6,6,5,4,3,2,1].map(v=>v+y*6);
  for(let x=0;x<12;x++)tiles.push({id:++id,x,y,z:0,s:faces[x],gone:false,visible:true});
 }
 assert.equal(tiles.length,72);
 let clearedPairs=0;
 while(tiles.some(t=>!t.gone)){
  const available=tiles.filter(t=>!t.gone&&t.visible&&isTileFree(tiles,t));
  assert(countLegalPairs(tiles)>0,'No legal matches left on the mock board');
  const first=available[0];
  const second=available.find(t=>t.id!==first.id&&t.s===first.s);
  assert(second,'Only choose free, visible, truly matching pairs');
  assert(isTileFree(tiles,first)&&isTileFree(tiles,second));
  assert.equal(first.s,second.s);
  first.gone=true;
  second.gone=true;
  clearedPairs++;
  assert(clearedPairs<=36);
 }
 assert.equal(clearedPairs,36);
 assert.equal(countLegalPairs(tiles),0);
 assert(tiles.every(t=>t.gone));
 // This is local rules testing, NOT a verified live-game win.
});
