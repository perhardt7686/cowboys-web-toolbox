import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../docs/'+name,import.meta.url),'utf8');
const marquee=read('commons-family-fun.mjs');
const board=read('family-board.mjs');
const css=read('commons-family-fun.css');
const html=read('community.html');
const shell=read('commons-arcade-shell.mjs');

test('one marquee covers all eleven active family arcade games and renders at the top',()=>{
 const all=['streetrod','dashforge','skyboard','fleet','maze','mahjong','wordle','wordquest','plates','drawing','study'];
 for(const id of all)assert.match(marquee,new RegExp("id:'"+id+"'"));
 assert.match(marquee,/const target=showMenu\?view:board/);
 assert.match(marquee,/target\.prepend\(root\)/);
 assert.match(marquee,/id='arcade-family-fun'|root\.id='arcade-family-fun'/);
 assert.doesNotMatch(board,/family-score-heading|family-standings-dialog|host\.append\(nav,\s*scoreboard/);
 assert.match(board,/new CustomEvent\('family-unified-scoreboard'/);
 assert.match(html,/commons-family-fun\.css\?v=marquee6/);
 assert.match(shell,/mountFamilyFun\(menu\)/);
});
test('game leaderboards remain server-authoritative with no fake cross-game score aggregation',()=>{
 assert.match(board,/community_family_scoreboard/);
 assert.match(board,/community_hot_rod_standings/);
 assert.match(marquee,/family-retro-scoreboard/);
 assert.match(marquee,/family-arcade-game-rankings/);
 assert.match(marquee,/source:'personal'/);
 assert.match(marquee,/if\(!member\)return \{state:'login'/);
 assert.match(marquee,/if\(game\.id==='plates'&&!family\.plateAccess\)/);
 assert.doesNotMatch(marquee,/localStorage|setItem\(/);
 assert.match(marquee,/details=el\('details','family-fun-rewards'\)/);
});
test('half-height launchers remain legible, original DOS canvas is deleted',()=>{
 assert.match(css,/#arcade-program-grid button\{\s*min-width:0!important;min-height:44px!important;height:44px!important/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
 assert.match(css,/#skyboard-toggle/);
 assert.match(css,/min-height:48px!important/);
 assert.doesNotMatch(shell,/arcade-title-art|function drawArt\(/);
 assert.doesNotMatch(css,/#arcade-title-art/);
});
