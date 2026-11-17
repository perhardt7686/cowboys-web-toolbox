import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRetroInput} from '../docs/retro-arcade-input.mjs';

test('a short Star Squadron touch registers exactly once after release',()=>{
  const pad=createRetroInput();
  pad.press('fleet','L');
  pad.release('L'); // finger lifted faster than the 105 ms simulation step
  assert.equal(pad.action('fleet'),'L');
  assert.equal(pad.action('fleet'),'N');
  pad.press('fleet','F');
  pad.release('F');
  assert.equal(pad.action('fleet'),'F');
  assert.equal(pad.action('fleet'),'N');
});

test('held Star Squadron movement and fire continue each tick without duplicate taps',()=>{
  const pad=createRetroInput();
  pad.press('fleet','L');pad.press('fleet','F');
  assert.equal(pad.action('fleet'),'A'); // left and fire
  assert.equal(pad.action('fleet'),'A');
  pad.release('L');
  assert.equal(pad.action('fleet'),'F');
  pad.release('F');
  assert.equal(pad.action('fleet'),'N');
  pad.press('fleet','R');pad.press('fleet','F');
  assert.equal(pad.action('fleet'),'D'); // right and fire
});

test('latest short directional tap wins, and cancelled touches do nothing',()=>{
  const pad=createRetroInput();
  pad.tap('fleet','L');pad.tap('fleet','R');
  assert.equal(pad.action('fleet'),'R');
  pad.press('fleet','L');pad.cancel('L');
  assert.equal(pad.action('fleet'),'N');
  pad.tap('fleet','F');
  pad.clearHeld();
  assert.equal(pad.action('fleet'),'N');
});

test('Mystery Maze direction buffering survives short taps and reset',()=>{
  const pad=createRetroInput();
  pad.press('maze','R');pad.release('R');
  assert.equal(pad.action('maze'),'R');
  assert.equal(pad.action('maze'),'R'); // maze retains last turn request
  pad.tap('maze','D');
  assert.equal(pad.action('maze'),'D');
  pad.tap('maze','F'); // no fire action in the maze
  assert.equal(pad.action('maze'),'D');
  pad.reset();
  assert.equal(pad.action('maze'),'N');
});

test('retro mobile controls actually use the tap buffer and keyboard activation',()=>{
 const src=readFileSync(new URL('../docs/commons-retro-arcade.mjs',import.meta.url),'utf8');
 const board=readFileSync(new URL('../docs/community.html',import.meta.url),'utf8');
 assert.match(src,/createRetroInput\(\)/);
 assert.match(src,/input\.press\(game\.id,code\)/);
 assert.match(src,/event\.detail===0&&current\?\.game===game\.id\)input\.tap/);
 assert.match(src,/function actionForTick\(game\)\{return input\.action\(game\);\}/);
 assert.match(src,/Round paused while the page is hidden/);
 assert.match(src,/Round resumed\. Keep playing/);
 assert.match(board,/commons-retro-arcade\.mjs\?v=retro10/);
});
