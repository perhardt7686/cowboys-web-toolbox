import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Spelunkr uses verified direct guide URL and stays family-only',()=>{
 const s=read('docs/commons-spelunkr.mjs');
 assert.match(s,/https:\/\/spelunkr\.tv\/\?tv/);
 assert.match(s,/drawing-studio-game-root/);
 assert.match(s,/data-arcade-game="drawing"/);
 assert.match(s,/if\(board\.hidden\)/);
 assert.match(s,/noopener noreferrer/);
 assert.doesNotMatch(s,/<iframe|srcdoc|document\.write/i);
});
test('Spelunkr loads only on family board and sits after Drawing Studio',()=>{
 const s=read('docs/community.html');
 assert.match(s,/commons-spelunkr\.mjs\?v=tv1/);
 assert.match(s,/commons-spelunkr\.css\?v=tv1/);
 assert.match(read('docs/commons-spelunkr.mjs'),/drawing\.after\(link\)/);
 assert.match(read('docs/commons-spelunkr.mjs'),/button\.after\(link\)/);
});
