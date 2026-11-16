import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {initialRetro,retroStep,retroReplay,RETRO_MAZE,RETRO_GAME_RULES} from '../docs/retro-arcade-engine.mjs';

const css=readFileSync(new URL('../docs/commons-arcade-shell.css',import.meta.url),'utf8');
const shell=readFileSync(new URL('../docs/commons-arcade-shell.mjs',import.meta.url),'utf8');
const game=readFileSync(new URL('../docs/commons-retro-arcade.mjs',import.meta.url),'utf8');
const page=readFileSync(new URL('../docs/community.html',import.meta.url),'utf8');

test('both retro games are included in the shipped member board and arcade menu',()=>{
  assert.match(page,/commons-retro-arcade\.mjs\?v=/);
  assert.match(page,/commons-retro-arcade\.css\?v=/);
  assert.match(shell,/id:'fleet',root:'star-squadron-root'/);
  assert.match(shell,/id:'maze',root:'mystery-maze-root'/);
  assert.match(game,/id:'fleet',root:'star-squadron-root'/);
  assert.match(game,/id:'maze',root:'mystery-maze-root'/);
  assert.match(game,/community_retro_start/);
  assert.match(game,/community_retro_finish/);
});

test('fullscreen arcade CSS actually mounts both native canvases into the visible viewport',()=>{
  const scope=css.slice(css.indexOf('RETRO FULLSCREEN PLAY SURFACE'));
  assert.ok(scope.length>1500,'fullscreen retro integration must have explicit layout rules');
  for(const id of ['star-squadron-root','mystery-maze-root'])
    assert.ok(scope.includes('#'+id),'missing retro root in fullscreen CSS: '+id);
  assert.match(scope,/\.arcade-game-active\s*\{[\s\S]*?position:fixed!important/);
  assert.match(scope,/\.arcade-game-active > \.retro-inside:not\(\[hidden\]\)/);
  assert.match(scope,/\.arcade-game-active \.retro-display\s*\{[\s\S]*?overflow-y:auto!important/);
  assert.match(scope,/\.arcade-game-active > \.retro-entry\s*\{display:none!important\}/);
  assert.match(scope,/\.retro-live:not\(\[hidden\]\)/);
  assert.match(scope,/\.arcade-game-active \.retro-canvas\s*\{/);
  assert.match(scope,/@media \(orientation:landscape\) and \(max-height:580px\)/);
});

test('Star Squadron launches, responds to controls and deterministically replays',()=>{
  const state=initialRetro('fleet',4);
  assert.equal(state.lane,4);
  const moved=retroStep(state,'L');
  assert.equal(moved.lane,3);
  assert.equal(moved.tick,1);
  const fired=retroStep(moved,'A');
  assert.equal(fired.lane,2);
  assert.equal(fired.tick,2);
  assert.deepEqual(retroReplay('fleet',4,'LA'),fired);
  assert.equal(RETRO_GAME_RULES.fleet.steps,240);
});

test('Mystery Maze moves to reachable cells and deterministically replays',()=>{
  const start=initialRetro('maze',1);
  assert.equal(start.x,1);
  assert.equal(start.y,1);
  const next=retroStep(start,'R');
  assert.equal(next.x,2);
  assert.equal(next.y,1);
  assert.equal(next.dots,1);
  assert.deepEqual(retroReplay('maze',1,'R'),next);
  const width=RETRO_MAZE[0].length;
  assert.ok(RETRO_MAZE.every(row=>row.length===width));
  const walkable=RETRO_MAZE.join('').replace(/#/g,'').length;
  const visited=new Set(['1,1']),queue=[[1,1]];
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const xx=x+dx,yy=y+dy,key=xx+','+yy;
      if(RETRO_MAZE[yy]?.[xx]&&RETRO_MAZE[yy][xx]!=='#'&&!visited.has(key)){
        visited.add(key);queue.push([xx,yy]);
      }
    }
  }
  assert.equal(visited.size,walkable,'all clue cells must be reachable');
  assert.equal(walkable,106,'maze completion target must match reachable cells');
});
