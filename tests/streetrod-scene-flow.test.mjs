import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const names=['docs/commons-streetrod-scene-flow.mjs','docs/commons-streetrod-ega.mjs',
 'docs/commons-arcade-shell.mjs'];
const [flow,ega,arcade,html,style]=await Promise.all([
 ...names.map(read),read('docs/community.html'),read('docs/commons-streetrod-scene-flow.css')
]);
test('Vintage room-flow modules load without parse errors',()=>{
 for(const p of names)assert.doesNotThrow(()=>
  execFileSync(process.execPath,['--check',fileURLToPath(new URL('../'+p,import.meta.url))]));
});
test('Every garage location is a full-screen scene, not another scrolling page',()=>{
 for(const type of ['garage','tune','paper','parts','diner','drive','calendar']){
  assert.ok(flow.includes(type),'Room absent '+type);
 }
 assert.match(flow,/canvas\.width=320;canvas\.height=200/);
 assert.match(flow,/ss-dos-hotspot/);
 assert.match(style,/image-rendering:pixelated/);
 assert.match(style,/#ss-scene > :not\(#ss-dos-stage\)/);
 assert.match(style,/overflow:hidden!important/);
});
test('Physical hood retains saved fasteners, not a fake mechanic slider',()=>{
 assert.match(flow,/data-ss-action="workshop"/);
 assert.match(flow,/ssb-components/);
 assert.match(flow,/\.ssb-component/);
 assert.match(ega,/window\.COWBOY_STREETROD_PAINT/);
 assert.match(arcade,/if\(active==='streetrod'\)return null/);
});
test('Changes are published alongside existing authorized summer gameplay',()=>{
 for(const asset of ['commons-streetrod-scene-flow.mjs?v=flow1',
  'commons-streetrod-scene-flow.css?v=flow1',
  'commons-streetrod-ega.mjs?v=dos7',
  'commons-streetrod-season-bay.mjs?v=mechanic5',
  'commons-streetrod-summer.mjs?v=ega2']){
  assert.ok(html.includes(asset),'Unpublished asset '+asset);
 }
 assert.doesNotMatch(flow,/(?:\.rpc\(|\.from\('community_)/,
  'Scene layer must never bypass the existing authenticated summer engine');
});
