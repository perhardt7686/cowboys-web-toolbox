import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const file=name=>new URL('../docs/'+name,import.meta.url);
const read=name=>readFileSync(file(name),'utf8');

test('Retired Family Corner is deleted instead of just hidden',()=>{
 assert.equal(existsSync(file('community-family.mjs')),false);
 const css=read('community-readable.css'),gameCss=read('commons-games-polish.css');
 assert.doesNotMatch(css,/\.family-room(?:\b|[-.])/);
 assert.doesNotMatch(gameCss,/\.family-room(?:\b|[-.])/);
 assert.doesNotMatch(gameCss,/min-height:66px;/);
});

test('Actual family reading controls and stale-cache guard remain',()=>{
 const html=read('community.html'),active=read('community-board-accessibility.mjs');
 assert.match(html,/community-board-accessibility\.mjs\?v=board-access5/);
 assert.match(html,/community-readable\.css\?v=readability7/);
 assert.match(html,/commons-games-polish\.css\?v=arcade2/);
 assert.doesNotMatch(html,/community-family\.mjs/);
 assert.match(active,/removeLegacyCorner/);
 assert.match(active,/family-reading-bar/);
 assert.match(active,/family-read-toggle/);
 assert.match(read('community-readable.css'),/family-easy-read/);
 assert.match(read('commons-scoreboard.css'),/commons-score-ribbon/);
});

test('New family marquee and game-specific controls remain intact',()=>{
 const html=read('community.html');
 assert.match(html,/commons-family-fun\.css\?v=marquee6/);
 assert.match(read('commons-family-fun.mjs'),/arcade-family-fun/);
 assert.match(read('commons-games-polish.css'),/#mahjong-toggle/);
});
