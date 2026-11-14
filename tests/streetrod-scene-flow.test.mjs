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
 assert.match(html,/streetrod-reborn\.mjs\?v=reborn4/);
 assert.match(html,/streetrod-reborn\.css\?v=reborn4/);
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
