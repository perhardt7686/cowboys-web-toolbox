import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
 createSourceHolds,thumbstickAxis,thumbstickDirection
} from '../docs/family-arcade-touch-input.mjs';
const read=file=>readFileSync(new URL('../docs/'+file,import.meta.url),'utf8');

test('unrelated fingers, keyboard and action buttons never cancel one another',()=>{
 const inputs=createSourceHolds(['jump','left','right','drift','brake']);
 inputs.hold('jump','pointer:10');inputs.hold('jump','pointer:11');
 inputs.hold('jump','key:Space');inputs.release('jump','pointer:10');
 assert.equal(inputs.has('jump'),true);
 inputs.release('jump','pointer:11');assert.equal(inputs.has('jump'),true);
 inputs.release('jump','key:Space');assert.equal(inputs.has('jump'),false);
 inputs.hold('left','key:ArrowLeft');inputs.hold('left','button:left:12');
 inputs.hold('drift','button:drift:13');
 inputs.releaseSource('button:left:12');
 assert.equal(inputs.has('left'),true);
 assert.equal(inputs.has('drift'),true);
 inputs.releaseSource('key:ArrowLeft');assert.equal(inputs.has('left'),false);
 assert.deepEqual([...inputs],['drift']);
 inputs.clear();assert.equal(inputs.has('drift'),false);
 assert.throws(()=>inputs.hold('cheat','client'),/Invalid arcade/);
});

test('thumbstick has a neutral deadzone and bounded left/right action',()=>{
 assert.equal(thumbstickAxis(100,100,30),0);
 assert.equal(thumbstickDirection(thumbstickAxis(103,100,30)),0);
 assert.equal(thumbstickDirection(thumbstickAxis(83,100,30)),-1);
 assert.equal(thumbstickDirection(thumbstickAxis(119,100,30)),1);
 assert.equal(thumbstickAxis(10,100,30),-1);
 assert.equal(thumbstickAxis(200,100,30),1);
 assert.equal(thumbstickAxis(NaN,100,30),0);
 assert.equal(thumbstickDirection(Infinity),0);
});

test('both games parse and use source-scoped pointer capture, with immediate touch jump',()=>{
 const dash=read('commons-dash-forge.mjs');
 const sky=read('commons-board-rush.mjs');
 for(const name of ['commons-dash-forge.mjs','commons-board-rush.mjs','family-arcade-touch-input.mjs']){
  const url=fileURLToPath(new URL('../docs/'+name,import.meta.url));
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',url]));
 }
 assert.match(dash,/bindDashTouch\(\$\('dash-canvas'\)\)/);
 assert.match(dash,/bindDashTouch\(\$\('dash-jump'\)\)/);
 assert.match(dash,/dashControls\.hold\('jump','pointer:'\+event\.pointerId\)/);
 assert.match(dash,/dashControls\.release\('jump','pointer:'\+event\.pointerId\)/);
 assert.match(dash,/dashControls\.has\('jump'\)/);
 assert.match(dash,/resetDashTouch\(\)/);
 assert.doesNotMatch(dash,/inputHeld=/);
 assert.match(sky,/id="skyboard-thumbstick"/);
 assert.match(sky,/b\.addEventListener\('pointerdown',e=>/);
 assert.match(sky,/if\(action==='jump'\)jump\(\)/);
 assert.match(sky,/held\.releaseSource\('thumbstick'\)/);
 assert.match(sky,/held\.releaseSource\('canvas'\)/);
 assert.match(sky,/thumbstickDirection\(axis\)/);
 assert.match(sky,/pointercancel','lostpointercapture/);
 assert.doesNotMatch(sky,/pointerleave'\]\)b\.addEventListener/);
});

test('touch-control layout keeps original action mappings with mobile thumb targets',()=>{
 const html=read('community.html');
 const css=read('family-arcade-touch-controls.css');
 const dash=read('commons-dash-forge.mjs'),sky=read('commons-board-rush.mjs');
 assert.match(html,/family-arcade-touch-controls\.css\?v=touch1/);
 assert.match(html,/commons-board-rush\.mjs\?v=skyboard8/);
 assert.match(html,/commons-dash-forge\.mjs\?v=dash10-creator/);
 for(const token of ['skyboard-thumbstick','data-sky-action="jump"',
 'data-sky-hold="drift"','data-sky-hold="brake"','data-sky-hold="left"','data-sky-hold="right"'])
  assert.ok(sky.includes(token),token);
 assert.match(css,/touch-action:none/);
 assert.match(css,/@media\(max-width:430px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(dash,/submitArcadeReplay\(client,cfg,'dash'/);
 assert.match(sky,/submitArcadeReplay\(client,config,'skyboard'/);
});
