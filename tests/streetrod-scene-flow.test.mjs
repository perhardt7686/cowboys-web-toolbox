import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const files=['docs/streetrod-reborn.mjs','docs/commons-streetrod-ega.mjs','docs/commons-arcade-shell.mjs'];
const [reborn,ega,arcade,html,style,summer,mechanic]=await Promise.all([
 ...files.map(read),read('docs/community.html'),read('docs/streetrod-reborn.css'),
 read('docs/commons-streetrod-summer.mjs'),read('docs/commons-streetrod-season-bay.mjs')
]);
test('New 1989 scene engine and canvas modules parse',()=>{
 for(const path of files)assert.doesNotThrow(()=>
  execFileSync(process.execPath,['--check',fileURLToPath(new URL('../'+path,import.meta.url))]));
});
test('State-room flow is a fresh single 320x200 EGA surface without page scrolling',()=>{
 for(const room of ['garage','paper','parts','diner','drive','calendar','tune','gas','crew','underbody']){
  assert.ok(reborn.includes(room),'Missing room '+room);
 }
 assert.match(reborn,/width="320" height="200"/);
 assert.match(reborn,/HOTSPOTS/);
 assert.match(style,/image-rendering:pixelated/);
 assert.match(style,/#ss-scene>:not\(#sr-reborn\)/);
 assert.match(style,/overflow:hidden!important/);
 assert.match(html,/streetrod-reborn\.mjs\?v=reborn8/);
 assert.match(html,/streetrod-reborn\.css\?v=reborn8/);
 assert.doesNotMatch(html,/src="commons-streetrod-scene-flow\.mjs/);
 assert.doesNotMatch(html,/href="commons-streetrod-scene-flow\.css/);
});
test('Real player cars, server-ledger, bolts and race validation are preserved',()=>{
 assert.match(reborn,/community_streetrod_season_state|saved seasonal|original seasonal/);
 assert.match(reborn,/showWorkbench/);
 assert.match(reborn,/data-ss-action="workshop"/);
 assert.match(reborn,/ss-drive-controls/);
 assert.match(summer,/community_streetrod_season_race_finish/);
 assert.match(summer,/community_streetrod_season_action/);
 assert.match(mechanic,/community_streetrod_season_workbench_action/);
 assert.match(mechanic,/p_revision:bench\.revision/);
 assert.doesNotMatch(reborn,/\.rpc\(|\.from\('community_/,
  'Presentation must not introduce its own unvalidated backend writes');
});
test('Mystery Machine uses the existing last-rival ID and is not a new account',()=>{
 assert.match(reborn,/data-rival="cipher"/);
 assert.match(reborn,/THE MYSTERY MACHINE/);
 assert.match(ega,/function mysteryMachine/);
 assert.match(ega,/options\.boss/);
 assert.match(reborn,/srm-players/);
 assert.match(reborn,/srm-avatar/);
 assert.match(arcade,/if\(active==='streetrod'\)return null/);
});
test('Original-code legal boundary: attribution and no copied game data',()=>{
 assert.match(reborn,/MIT-licensed/);
 assert.match(reborn,/original DOS game data, artwork and executable are NOT included/);
 assert.match(ega,/window\.COWBOY_STREETROD_PAINT/);
 assert.match(html,/streetrod-reborn-config\.js/);
 assert.match(ega,/if\(!window\.COWBOY_STREETROD_REBORN\)/);
});

test('Mobile scene gestures work and station entry never buys fuel',()=>{
 assert.match(reborn,/pocket\.addEventListener\('touchstart'/);
 assert.match(reborn,/pocket\.addEventListener\('touchend'/);
 assert.match(reborn,/choose\(dx<0\?'next':'prev'\)/);
 assert.match(reborn,/travelSkip=finishTravel/);
 assert.match(reborn,/travelSkip\(\)/);
 const gas=reborn.split("if(target==='gas'){")[1]?.split("\n }")[0];
 assert.ok(gas,'Missing gas station navigation');
 assert.doesNotMatch(gas,/\.click\(\)/,'Entering the station must not charge a player');
 const fill=reborn.split("if(target==='fill'){")[1]?.split("\n }")[0];
 assert.match(fill,/pump\.click\(\)/,'Fuel only on an explicit player request');
 assert.doesNotMatch(fill,/is saved through/,'No premature save success message');
});

test('Original newspaper-first flow and real car inspection are independently rendered',()=>{
 assert.match(reborn,/paperfront:\[\['USED CARS'/);
 assert.match(reborn,/data-v3-action="paperfront"/);
 assert.match(reborn,/\['LOOK AT CAR','viewcar'\]/);
 assert.match(reborn,/sr-v3-inline-preview/);
 assert.match(ega,/function carInspection\(/);
 assert.match(ega,/carinspect:carInspection/);
 assert.match(style,/canvas\.sr-v3-inline-preview/);
 assert.doesNotMatch(reborn,/fetch\([^\n]+street_rod_manual|LIB1|LIB2|HOT_DATA/);
});

test('Saved car purchase leads to garage only after authenticated backend success',()=>{
 assert.match(summer,/cowboy:streetrod-season-saved/);
 assert.match(reborn,/window\.addEventListener\('cowboy:streetrod-season-saved'/);
 assert.match(reborn,/command==='buy_car'\|\|command==='switch'/);
 assert.match(reborn,/command==='new_season'/);
 assert.match(reborn,/if\(target==='hood'\)/);
 assert.match(reborn,/if\(target==='wrench'\)/);
});

test('Original DOS input and drive-in rival artwork change with the selected driver',()=>{
 assert.match(ega,/function diner\(c,rivalKey=/);
 assert.match(ega,/car\(c,rivalKey,rivalBody,158,128,154\)/);
 assert.match(reborn,/options\.rivalCarKey=rival\.dataset\.rivalKey/);
 assert.match(reborn,/event\.code==='ArrowRight'/);
 assert.match(reborn,/event\.code==='ArrowLeft'/);
 assert.match(reborn,/pointerenter/);
});
