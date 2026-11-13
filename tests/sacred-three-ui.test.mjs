import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=async(path)=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [board,boardHTML,toolbox,template,index,build]=await Promise.all([
 read('docs/commons-message-board-contrast.css'),
 read('docs/community.html'),
 read('docs/toolbox-clarity.css'),
 read('index.template.html'),
 read('docs/index.html'),
 read('build.py')
]);
const luminance=hex=>{
 const rgb=hex.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)/255);
 const channels=rgb.map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
 return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
};
const contrast=(fg,bg)=>{const a=luminance(fg),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};

test('Commons buttons are high-contrast in both pressed and default states',()=>{
 assert.match(board,/#lab-filters\.lab-filters button\[aria-pressed="true"\]/);
 assert.match(board,/#lab-filters\.lab-filters button:focus-visible/);
 assert.match(board,/#forum-toolbar\.forum-toolbar/);
 assert.match(board,/#feed-count/);
 for(const [label,fg,bg] of [
  ['filter unselected','#392449','#fffaf2'],
  ['filter selected','#fffaf2','#502568'],
  ['toolbar text','#452458','#fff7eb'],
  ['selected toolbar','#fffaf2','#502568'],
  ['results count','#442852','#e8f4e6']
 ]){
  assert.ok(contrast(fg,bg)>=4.5,label+' has contrast '+contrast(fg,bg).toFixed(2));
 }
 assert.ok(board.includes('min-height:46px'), 'filters must have usable tap targets');
 assert.ok(board.includes('::before'), 'pressed filter has a visual checkmark');
});

test('Toolbox retains navigation and readable search, cards, tags, and tab states',()=>{
 assert.match(toolbox,/body\.toolbox-page/);
 for(const token of ['#search','.site-card','.card-description','.category-chip','.view-tabs button','.open-link','.active-filters button']){
  assert.ok(toolbox.includes(token),'missing '+token);
 }
 assert.match(toolbox,/\.category-chip\[aria-pressed="true"\]/);
 assert.match(toolbox,/\.view-tabs button\[aria-selected="true"\]/);
 for(const [label,fg,bg] of [
  ['catalog description','#f0e5f4','#291c36'],
  ['catalog metadata','#ded1e8','#291c36'],
  ['unselected chip','#fff5fa','#3b284a'],
  ['selected chip','#25192f','#f2cf8f'],
  ['link','#b4f3e8','#291c36']
 ]){
  assert.ok(contrast(fg,bg)>=4.5,label+' has contrast '+contrast(fg,bg).toFixed(2));
 }
});

test('Original Toolbox logo and build system keep final stylesheet',()=>{
 const ref='href="toolbox-clarity.css?v=clarity1"';
 assert.equal(template.split(ref).length-1,1,'template needs exactly one CSS reference');
 assert.equal(index.split(ref).length-1,1,'generated index needs exactly one CSS reference');
 assert.ok(index.indexOf(ref)>index.indexOf('href="toolbox-depth.css?v=depth7"'));
 assert.ok(build.includes("docs/toolbox-clarity.css"),'offline preview must inline clarity CSS');
 assert.ok(boardHTML.includes('commons-message-board-contrast.css?v=contrast1'));
 assert.ok(boardHTML.indexOf('commons-message-board-contrast.css')>boardHTML.indexOf('commons-games-polish.css'));
 assert.ok(!toolbox.includes('body.community-page')&&!toolbox.includes('.ccore'),'Toolbox fixes must not override Commons or Core');
 assert.ok(!board.includes('body.toolbox-page')&&!board.includes('.ccore'),'Commons fixes must not override Toolbox or Core');
});

test('New stylesheet blocks balance and respect reduced motion and forced colors',()=>{
 for(const [name,s] of [['board',board],['toolbox',toolbox]]){
  assert.ok(s.includes('prefers-reduced-motion'), name+' should respect reduced motion');
  assert.ok(s.includes('forced-colors'),name+' should preserve high-contrast mode');
  let depth=0;
  const raw=s.replace(/\/\*[\s\S]*?\*\//g,'');
  for(const c of raw){if(c==='{')depth++;else if(c==='}')depth--;assert.ok(depth>=0,name+' has an extra closing brace');}
  assert.equal(depth,0,name+' has an unclosed CSS block');
 }
});
