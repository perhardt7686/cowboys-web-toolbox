import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const file=path=>new URL('../'+path,import.meta.url);
const source=async path=>readFile(file(path),'utf8');
const [html,arcade,plates,mahjong,coco,forum,css,family]=await Promise.all([
 'docs/community.html','docs/commons-arcade-shell.mjs','docs/commons-plates.mjs',
 'docs/commons-mahjong.mjs','docs/community-coco.mjs',
 'docs/commons-board-compact.mjs','docs/commons-compact-ui.css',
 'docs/community-board-accessibility.mjs'].map(source)
);

test('All revised modules parse and are versioned for Safari',()=>{
 for(const path of ['docs/commons-arcade-shell.mjs','docs/commons-plates.mjs',
   'docs/commons-mahjong.mjs','docs/community-coco.mjs','docs/commons-board-compact.mjs',
   'docs/community-board-accessibility.mjs']){
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',fileURLToPath(file(path))],{stdio:'pipe'}),'Syntax error in '+path);
 }
 for(const asset of ['commons-compact-ui.css?v=compact4','commons-board-compact.mjs?v=compact1',
  'commons-arcade-shell.mjs?v=family3-1','commons-plates.mjs?v=family3-1',
  'commons-mahjong.mjs?v=family3','community-coco.mjs?v=family3','community-board-accessibility.mjs?v=board-access4'])
  assert.ok(html.includes(asset),'Live page missing '+asset);
});

test('Coco portraits are removed but protected member avatars remain',()=>{
 assert.ok(!coco.includes('function castStrip('));
 assert.match(coco,/replaceAvatar/);
 assert.match(css,/#coco-cast-strip/);
 assert.match(css,/#arcade-drawing-entry/);
 assert.equal((arcade.match(/arcade-drawing-entry/g)||[]).length,0);
 assert.match(arcade,/drawing-studio-toggle/);
});

test('Mahjong fits both height and width, leaving actions in a single row',()=>{
 assert.ok(mahjong.includes('wrap?.clientHeight'),'Board must fit available height');
 assert.ok(mahjong.includes('Math.min((available-26)/8.55'),'Tile layout must use two-axis fit');
 assert.match(css,/#mahjong-board-wrap/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/overflow:hidden!important;touch-action:manipulation!important/);
});

test('License photo history preserves authorizations and existing records',()=>{
 assert.match(plates,/renderGallery\(\)/);
 assert.match(plates,/plate-gallery-grid/);
 assert.match(plates,/plate-gallery-prev/);
 assert.match(plates,/arcade:plate-select/);
 assert.match(plates,/community_plate_browse/);
 assert.match(arcade,/\['history','PHOTOS'\]/);
 assert.match(css,/data-arcade-scene=history/);
 assert.ok(!plates.includes(".delete().eq("));
});

test('Feed uses a deliberate six-item load-more control and not infinite scrolling',()=>{
 assert.match(forum,/let shown=6/);
 assert.match(forum,/shown\+=6/);
 assert.match(forum,/more\.click\(\)/);
 assert.match(css,/#compact-feed-more/);
 assert.match(css,/\.thread-card\[hidden\]/);
 assert.match(arcade,/arcade-score-pills/);
 assert.doesNotMatch(arcade,/arcade-hud-footer/);
});

test('Retired Coco family corner is not loaded and is aggressively removed if cached',()=>{
 assert.doesNotMatch(html,/<script[^>]+src="community-family\.mjs/);
 assert.doesNotMatch(family,/family-room-grid|data-family-action|Question of the week|Vote on a family plan/);
 assert.match(family,/removeLegacyCorner/);
 assert.match(family,/MutationObserver/);
 assert.match(family,/family-reading-bar/);
 assert.match(family,/community-sort-label/);
 assert.match(html,/community-board-accessibility\.mjs\?v=board-access4/);
 assert.match(html,/retired-family-corner-guard/);
 assert.match(css,/#conversations \.family-room\{display:none!important\}/);
});
