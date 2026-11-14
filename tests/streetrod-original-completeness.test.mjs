import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [roster,incidents,reborn,summer,paint,physics,sound,html,tracker]=await Promise.all([
 'docs/streetrod-22-rivals-production.sql',
 'docs/streetrod-road-incidents-production.sql',
 'docs/streetrod-reborn.mjs','docs/commons-streetrod-summer.mjs',
 'docs/commons-streetrod-ega.mjs','docs/streetrod-race-physics.mjs',
 'docs/streetrod-pc-speaker.mjs','docs/community.html',
 'docs/STREETROD_REBORN_ORIGINAL_SOURCE_AUDIT.md'].map(read)
);
test('All newly published sound, room, garage and car modules parse',()=>{
 for(const p of ['docs/streetrod-reborn.mjs','docs/commons-streetrod-ega.mjs',
  'docs/commons-streetrod-summer.mjs','docs/streetrod-race-physics.mjs','docs/streetrod-pc-speaker.mjs']){
  assert.doesNotThrow(()=>execFileSync(process.execPath,
    ['--check',fileURLToPath(new URL('../'+p,import.meta.url))]));
 }
});
test('A unique 22-rival summer includes all original four IDs and one final Mystery Machine',()=>{
 const entries=[...roster.matchAll(/jsonb_build_object\('key','([^']+)'/g)].map(m=>m[1]);
 assert.equal(entries.length,22,'Original fictional roster must contain twenty-two racers');
 assert.equal(new Set(entries).size,22);
 for(const legacy of ['rookie','cruiser','hotshot','cipher'])
  assert.ok(entries.includes(legacy),'Previous save ID lost '+legacy);
 assert.match(roster,/'key','cipher','name','The Mystery Machine'/);
 assert.match(roster,/REVOKE EXECUTE ON FUNCTION public\.community_streetrod_season_rivals\(\) FROM anon/);
 assert.match(roster,/REVOKE ALL ON FUNCTION public\.community_streetrod_season_rivals\(\) FROM PUBLIC/);
 assert.match(summer,/season\?\.rivals\?\.length/);
 assert.match(summer,/availableRivals\(\)/);
 assert.match(summer,/rivalInfo\(rival\)/);
});
test('County police and engine breakdown results come only from validated server trace',()=>{
 assert.match(incidents,/r\.seed%5=0/);
 assert.match(incidents,/r\.seed%11=0/);
 assert.match(incidents,/jsonb_array_elements\(p_trace\)/);
 assert.match(incidents,/car\.condition<43/);
 assert.match(incidents,/r\.rival<>'cipher'/);
 assert.match(incidents,/r\.stake<>'title'/);
 assert.match(incidents,/police_stop boolean:=false/);
 assert.match(incidents,/earned:=earned-ticket/);
 assert.match(incidents,/won=won/);
 assert.match(incidents,/community_streetrod_member\(\)/);
 assert.match(summer,/data-incident/);
 assert.match(summer,/data-champion/);
 assert.match(physics,/HIGHWAY PATROL/);
 assert.match(physics,/ENGINE MISFIRE/);
});
test('Original independent EGA artwork covers police, breakdown and championship',()=>{
 for(const f of ['jail','breakdown','championship','mysteryMachine'])
  assert.ok(paint.includes('function '+f+'('),'Missing illustration '+f);
 assert.match(reborn,/dataset\.incident==='police'/);
 assert.match(reborn,/dataset\.incident==='breakdown'/);
 assert.match(reborn,/dataset\.champion==='true'/);
 assert.doesNotMatch(reborn,/LIB1|LIB2|HOT_DATA/);
});
test('Opt-in PC-speaker audio is synthesized, muteable, and does not reproduce music',()=>{
 assert.match(sound,/localStorage\.getItem\(KEY\)/);
 assert.match(sound,/AudioContext/);
 assert.match(sound,/toggleSound/);
 assert.match(sound,/oscillator\.type='square'/);
 assert.match(sound,/if\(!enabled/);
 assert.doesNotMatch(sound,/new Audio\(|fetch\(|\.mp3|\.midi|playMelody/);
 assert.match(reborn,/data-v3-action="sound"/);
});
test('Public page serves new cache revisions and documented fidelity limits',()=>{
 for(const script of ['commons-streetrod-summer.mjs?v=ega6',
  'commons-streetrod-ega.mjs?v=dos10','streetrod-reborn.mjs?v=reborn4',
  'streetrod-reborn.css?v=reborn4'])
 assert.ok(html.includes(script),script+' is not versioned into published Commons');
 assert.match(tracker,/Historical fidelity still outstanding/);
});
