import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CREW_ANCHORS} from '../docs/mystery-crew-art.mjs';
import {SCOUT_V9_FRAMES,isScoutV9LocalPreview,isScoutV9Supported} from '../docs/mystery-crew-v9-scout-lab.mjs';

const base={...CREW_ANCHORS[0],hair:'#904b28',skin:'#f0b989',
 outfit:'detective',shirt:'#ef792f',hat:'none',gear:'none'};
test('V9 art lab requires localhost with explicit preview and exact flag',()=>{
 for(const host of ['localhost','127.0.0.1'])
  assert.equal(isScoutV9LocalPreview({hostname:host,search:'?preview=1&artLab=scoutV9'}),true);
 for(const candidate of [
  {hostname:'perhardt7686.github.io',search:'?preview=1&artLab=scoutV9'},
  {hostname:'chatgpt.com',search:'?preview=1&artLab=scoutV9'},
  {hostname:'localhost',search:'?preview=1'},
  {hostname:'localhost',search:'?artLab=scoutV9'},
  {hostname:'localhost',search:'?preview=1&artLab=other'}
 ])assert.equal(isScoutV9LocalPreview(candidate),false);
});
test('no family unlock or achievement rule can trigger V9 playback',()=>{
 assert.deepEqual(SCOUT_V9_FRAMES,Array.from({length:8},(_,i)=>'scout-v9-frame-'+String(i+1).padStart(2,'0')+'.png'));
 assert.equal(isScoutV9Supported(base,{motion:'wave',angle:0}),true);
 for(const invalid of [
  [{...base,outfit:'explorer',shirt:'#6c9354'},'wave'],
  [{...base,hat:'cap'},'wave'],[{...base,hair:'#b8432a'},'wave'],
  [base,'idle'],[base,'cheer']
 ])assert.equal(isScoutV9Supported(invalid[0],{motion:invalid[1],angle:0}),false);
 const source=readFileSync(new URL('../docs/mystery-crew-v9-scout-lab.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/localStorage|sessionStorage|commitRPC|fetch\(|community_mystery_crew_|coins|unlocked|analytics/i);
 assert.match(source,/prefers-reduced-motion: reduce/);
 assert.match(source,/picture\.decode\(\)/);
});
test('base scene wires V9 without altering the normal published path',()=>{
 const creator=readFileSync(new URL('../docs/mystery-crew-creator.mjs',import.meta.url),'utf8');
 assert.match(creator,/syncScoutV9SceneLab\(m,\{zoom,angle,motion\}\)/);
 assert.match(creator,/if\(isPreview&&new URLSearchParams\(location\.search\)\.get\('artLab'\)==='scoutV9'\)/);
});
