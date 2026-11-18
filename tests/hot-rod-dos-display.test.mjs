import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../docs/hot-rod.css',import.meta.url),'utf8');
const game=readFileSync(new URL('../docs/hot-rod-game.mjs',import.meta.url),'utf8');
const input=readFileSync(new URL('../docs/hot-rod-input.mjs',import.meta.url),'utf8');

test('320x200 Hot Rod art maps to a DOS CRT 4:3 viewport in garage and race',()=>{
  assert.match(game,/art\.width\s*=\s*320;/);
  assert.match(game,/art\.height\s*=\s*200;/);
  assert.match(game,/left:x\s*\/\s*320\s*\*\s*100/);
  assert.match(game,/top:y\s*\/\s*200\s*\*\s*100/);
  assert.match(css,/\.hot-rod-screen\s*\{[^}]*aspect-ratio:4\s*\/\s*3/s);
  assert.match(css,/\.hot-rod-monitor:has\(\.hot-rod-driving\) \.hot-rod-canvas\s*\{[^}]*aspect-ratio:4\s*\/\s*3/s);
  assert.match(css,/width:min\(100cqw,\s*133\.333cqh,\s*640px\)/);
  assert.match(css,/\.hot-rod-monitor:not\(\[data-scene="race"\]\) \.hot-rod-housing/);
  assert.doesNotMatch(css,/\.hot-rod-monitor:not\(:has\(\.hot-rod-driving\)\) \.hot-rod-housing/);

});

test('1989-style garage car nameplate and original selector gears remain usable',()=>{
  assert.match(game,/hotspot\('Choose a garage car',86,16,199,14/);
  assert.match(game,/selector\.focus\(\{preventScroll:false\}\)/);
  assert.match(input,/event\.code === 'Space'/);
  assert.match(input,/includes\(INPUT\.brake\)\s*\?\s*INPUT\.down\s*:\s*INPUT\.up/);
  assert.match(game,/Original-style Space shifts up with gas or down with brake/);
});
