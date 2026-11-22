import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = file => readFileSync(new URL('../docs/'+file,import.meta.url),'utf8');
const dash = read('commons-dash-forge.mjs');
const sky = read('commons-board-rush.mjs');
const skyScene = read('skyboard-scene.mjs');
const dashCss = read('commons-dash-forge.css');
const skyCss = read('commons-board-rush.css');

test('Eliot owns the Dash Forge presentation, without renaming persistent game identifiers',()=>{
  assert.match(dash, /Eliot’s Dash Forge/);
  assert.match(dash, /ELIOT’S DASH FORGE/);
  assert.match(dash, /id='dash-forge-root'|root.id='dash-forge-root'/);
  assert.match(dash, /submitArcadeReplay\(client,cfg,'dash'/);
});

test('Dash Forge attempts and beat feedback are local visual-only features',()=>{
  assert.match(dash, /id="dash-attempt-count"/);
  assert.match(dash, /attemptCount\+\+/);
  assert.match(dash, /e.code==='KeyR'/);
  assert.match(dash, /dashBeatAt\(r\)/);
  assert.match(dash, /canvas.dataset.beat/);
  assert.match(dashCss, /#dash-attempt-count/);
  assert.match(dash, /'dash-practice-retry'/);
});

test('Skyboard shows real simulation pace, drift, and explicitly asynchronous ghost replay',()=>{
  for(const key of ['skyboard-live-speed','skyboard-live-drive','skyboard-live-ghost'])
    assert.match(sky,new RegExp(key));
  assert.match(sky, /r.speed\/r.normal/);
  assert.match(sky, /r.mask&SKY_INPUT.drift/);
  assert.match(sky, /REPLAY GHOST/);
  assert.match(sky, /submitArcadeReplay\(client,config,'skyboard'/);
  assert.match(skyCss, /\.skyboard-driving-hud/);
  assert.match(sky, /JOYSTICK · STEER/);
});

test('3D drift camera preserves reduced motion and does not mutate replay physics',()=>{
  assert.match(skyScene, /prefers-reduced-motion: reduce/);
  assert.match(skyScene, /if\(!lowMotion&&Math.abs\(state.lean\)>\.02\)/);
  assert.match(skyScene, /camera.rotateZ\(-state.lean\*roll\)/);
  assert.doesNotMatch(skyScene,/stepSky\(/);
});
