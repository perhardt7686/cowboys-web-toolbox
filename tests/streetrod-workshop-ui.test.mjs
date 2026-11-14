import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const url=path=>new URL('../'+path,import.meta.url);
const [bay,summer,html,arcade]=await Promise.all([
 readFile(url('docs/commons-streetrod-season-bay.mjs'),'utf8'),
 readFile(url('docs/commons-streetrod-summer.mjs'),'utf8'),
 readFile(url('docs/community.html'),'utf8'),
 readFile(url('docs/commons-arcade-shell.mjs'),'utf8')
]);

test('Saved wrench gestures still use server-authoritative revisioned mechanics',()=>{
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',fileURLToPath(url('docs/commons-streetrod-season-bay.mjs'))]));
 for(const token of ['pointerdown','pointermove','pointerup','pointercancel',
  'ssb-wrench-dragging','nextTorqueGuide','blockedBoltClick',
  'community_streetrod_season_workbench_action','p_revision:bench.revision']){
  assert.ok(bay.includes(token),'Missing persistent wrench step or input: '+token);
 }
 assert.ok(bay.includes('Math.hypot(dx,dy)<28'),'tap fallback should remain');
 assert.match(bay,/\[0,2,1,3\]/,'torque ordering must be 1-3-2-4');
});

test('Distributor adjustment saves through the existing seven-setting campaign API',()=>{
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',fileURLToPath(url('docs/commons-streetrod-summer.mjs'))]));
 for(const token of ['ss-timing-bench','ss-distributor-rotor','ss-timing-number',
  'ssTimingStep','data-ss-form="tune"','mutate(\'tune\'']){
  assert.ok(summer.includes(token),'Missing timing operation: '+token);
 }
 assert.ok(summer.includes('cap(Number(input.value)+Number(btn.dataset.ssTimingStep),-3,3)'));
});

test('Single monitor restores existing games rather than replacing game state',()=>{
 for(const name of ['commons-arcade-shell.mjs?v=compact6',
   'commons-streetrod-season-bay.mjs?v=mechanic6','commons-streetrod-summer.mjs?v=ega6']){
   assert.ok(html.includes(name),'Missing versioned game module: '+name);
 }
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',fileURLToPath(url('docs/commons-arcade-shell.mjs'))]));
 for(const token of ['#arcade-hud','arcade-shell','arcade-game-active','makeVisible(g)',
  'arcade-program-grid','scene-next','scene-previous']){
  assert.ok(arcade.includes(token),'Missing scene controller feature: '+token);
 }
 assert.ok(!arcade.includes('community_streetrod_season_race_finish'),
  'arcade must not replace authoritative race RPC');
});
