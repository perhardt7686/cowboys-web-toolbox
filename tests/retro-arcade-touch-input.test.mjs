import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRetroInput} from '../docs/retro-arcade-input.mjs';
import {initialRetro,retroStep,retroReplay,RETRO_GAME_RULES} from '../docs/retro-arcade-engine.mjs';

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
 assert.match(src,/function actionForTick\(game\)\{return input\.action\(game,current\);\}/);
 assert.match(src,/Round paused while the page is hidden/);
 assert.match(src,/Round resumed\. Keep playing/);
 assert.match(board,/commons-retro-arcade\.mjs\?v=retro10/);
});


test('last physical direction wins overlapping thumbs and held fire continues',()=>{
  const pad=createRetroInput();
  pad.press('fleet','L');pad.press('fleet','F');
  assert.equal(pad.action('fleet'),'A');
  pad.press('fleet','R');
  assert.equal(pad.action('fleet'),'D',
    'when right finger overlaps left, choose the latest direction plus fire');
  assert.equal(pad.action('fleet'),'D','holding overlapping thumbs persists each tick');
  pad.release('R');
  assert.equal(pad.action('fleet'),'A','remaining left thumb resumes steering');
  pad.release('L');
  assert.equal(pad.action('fleet'),'F','fire is a separate held button');
  pad.release('F');
  assert.equal(pad.action('fleet'),'N');
  pad.press('fleet','L');pad.press('fleet','R');pad.clearHeld();
  assert.equal(pad.action('fleet'),'N','tab hide or sign-out clears transient arcade input');
});

test('focused mobile menu buttons keep Space and Enter, game keys remain for play area',()=>{
  const script=readFileSync(new URL('../docs/commons-retro-arcade.mjs',import.meta.url),'utf8');
  assert.match(script,/document\.activeElement\?\.closest\?\./);
  assert.match(script,/button,a,summary,\[role="button"\]/,
    'focused navigation buttons must not fire a shot when pressing Space');
  assert.match(script,/event\.detail===0&&current\?\.game===game\.id\)input\.tap/,
    'keyboard or assistive activation of actual arcade buttons still works');
  const css=readFileSync(new URL('../docs/family-arcade-controls.css',import.meta.url),'utf8');
  assert.doesNotMatch(css,/min-width:39px;width:39px/);
  assert.match(css,/min-width:44px;width:44px;min-height:48px/);
  assert.match(css,/grid-template-columns:minmax\(112px,/);
});

test('both family originals retain deterministic, bounded classic arcade rules',()=>{
  assert.equal(RETRO_GAME_RULES.fleet.steps,240);
  assert.equal(RETRO_GAME_RULES.maze.steps,300);
  // Star Squadron: holding arrows cannot wrap beyond the edge of nine lanes.
  assert.equal(retroReplay('fleet',1,'L'.repeat(8)).lane,0);
  assert.equal(retroReplay('fleet',1,'R'.repeat(8)).lane,8);
  assert.equal(retroReplay('fleet',4,'NFFF').score,20,
    'server-replay-compatible swarm hits remain unchanged by input work');
  // Mystery Maze: walls block movement; new clues count once and power orbs
  // grant timed protection without manufacturing extra replays.
  const first=initialRetro('maze',0);
  assert.equal(retroStep(first,'L').x,1);
  assert.equal(retroStep(first,'U').y,1);
  const down=retroStep(first,'D');
  const power=retroStep(down,'D');
  assert.equal(power.x,1);assert.equal(power.y,3);
  assert.equal(power.dots,2);
  assert.ok(power.score>=60,'ordinary clue and power orb score as before');
  assert.equal(power.power,23,'power duration begins with 24 ticks and consumes one');
  assert.deepEqual(retroReplay('maze',0,'DD'),power,
    'local gameplay and score replay remain bitwise-identical');
});


test('Mystery Maze queues a blocked corner turn and moves until the turn opens',()=>{
  const pad=createRetroInput();
  const start={x:1,y:1};
  pad.tap('maze','R');
  assert.equal(pad.action('maze',start),'R');
  pad.tap('maze','D'); // blocked by wall at x=2,3,4; open at x=5
  for(const x of [2,3,4])
    assert.equal(pad.action('maze',{x,y:1}),'R','keep moving while turn is queued at '+x);
  assert.equal(pad.action('maze',{x:5,y:1}),'D','turn automatically at the next open tile');
  assert.equal(pad.action('maze',{x:5,y:2}),'D','continue moving down while clear');
  pad.tap('maze','U');
  assert.equal(pad.action('maze',{x:5,y:3}),'U','new request takes precedence');
  pad.clearHeld();
  assert.equal(pad.action('maze',{x:5,y:2}),'N','suspending the game stops steering');
  pad.tap('maze','U');
  assert.equal(pad.action('maze',{x:5,y:2}),'U');
  pad.reset();
  assert.equal(pad.action('maze',{x:5,y:2}),'N');
});

test('queued turns produce only replayable server-authoritative maze actions',()=>{
  const pad=createRetroInput(),actions=[];
  let state=initialRetro('maze',4);
  pad.tap('maze','R');
  for(let i=0;i<5;i++){
    if(i===1)pad.tap('maze','D');
    const code=pad.action('maze',state);
    assert.ok(RETRO_GAME_RULES.maze.controls.includes(code));
    actions.push(code);
    state=retroStep(state,code);
  }
  assert.deepEqual(state,retroReplay('maze',4,actions.join('')),
    'no cosmetic or predictive movement bypasses the submitted replay trace');
  assert.equal(actions.length,state.tick);
});
