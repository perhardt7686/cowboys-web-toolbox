import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../docs/'+name,import.meta.url),'utf8');

test('Emma Skyboard uses joystick and real A/B/C actions with labels below',()=>{
 const src=read('commons-board-rush.mjs');
 for(const s of ['arcade-stick-station','arcade-stick-pair','arcade-action-cluster','arcade-key-station',
   'skyboard-steer-label','skyboard-jump-label','skyboard-drift-label','skyboard-brake-label'])
  assert.ok(src.includes(s),'Missing skyboard '+s);
 for(const [act,tag] of [['left','data-sky-hold'],['right','data-sky-hold'],
   ['drift','data-sky-hold'],['brake','data-sky-hold'],['jump','data-sky-action']])
  assert.ok(src.includes(tag+'="'+act+'"'),'Missing live '+act+' action');
 assert.match(src,/arcade-button-caption">JOYSTICK · STEER/);
 assert.match(src,/arcade-button-caption">JUMP/);
 assert.match(src,/arcade-button-caption">DRIFT/);
 assert.match(src,/arcade-button-caption">BRAKE/);
 assert.ok(!src.includes('◀ LEFT</button>'),'Old steering strip must be replaced');
});

test('Elliot Dash Forge action follows true level physics rather than inventing steering',()=>{
 const src=read('commons-dash-forge.mjs');
 assert.match(src,/id="dash-jump" class="arcade-button-a"/);
 assert.match(src,/id="dash-action-label" class="arcade-button-caption"/);
 assert.match(src,/\$\('dash-action-label'\)\.textContent=action/);
 assert.match(src,/mode==='S'\|\|mode==='W'\?'THRUST'/);
 assert.match(src,/aria-describedby="dash-action-label"/);
 assert.ok(!src.includes('↗ JUMP</button></footer>'),'Old loose Jump button remains');
});

test('final control stylesheet is linked and keeps labels beneath active buttons',()=>{
 const html=read('community.html'),css=read('family-arcade-controls.css');
 assert.match(html,/family-arcade-controls\.css\?v=deck1/);
 assert.ok(html.indexOf('family-arcade-controls.css')>html.indexOf('commons-board-rush.css'));
 for(const cls of ['arcade-key-station','arcade-button-caption','arcade-stick-pair',
  'arcade-keyboard-hint','arcade-button-a','arcade-button-b','arcade-button-c'])
  assert.ok(css.includes('.'+cls),cls);
 assert.match(css,/min-height:48px/);
 assert.match(css,/@media\(orientation:landscape\)/);
 assert.match(css, /focus-visible/);
 assert.match(html,/commons-board-rush\.mjs\?v=skyboard4/);
 assert.match(html,/commons-dash-forge\.mjs\?v=dash5/);
});
