import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('shared menu assets are loaded on Toolbox, Commons, and build template',()=>{
 const pages=['docs/index.html','docs/community.html','index.template.html'];
 for(const p of pages){
  const src=read(p);
  assert.match(src,/unified-nav\.css\?v=family3/,p+' CSS');
  assert.match(src,/unified-nav\.js\?v=family3/,p+' JS');
 }
});
test('menu controls are keyboard accessible and share real routes',()=>{
 const script=read('docs/unified-nav.js');
 for(const text of ['aria-expanded','aria-controls','Escape','ArrowDown',
   'cowboy-nav-panel','Family Message Board','#family-games','memberActions',
   'mahjong-toggle','letter-lock-toggle','plate-game-open','drawing-studio-toggle',
   'new-thread','account-actions','board.hidden']) assert.ok(script.includes(text),text);
 assert.ok(!script.includes('community.html#open-'), 'public navigation must not link to private games');
 assert.ok(!script.includes('streetrod'), 'do not link to or control Street Rod');
});
test('style exposes a generous mobile toggle with contrast and reduced motion',()=>{
 const css=read('docs/unified-nav.css');
 for(const token of ['width:60px','min-height:50px','@media(max-width:760px)','prefers-reduced-motion','focus-visible']) assert.ok(css.includes(token),token);
});
