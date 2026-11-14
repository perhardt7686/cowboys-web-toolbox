import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RETRO_CHANNELS,RETRO_GROUPS} from '../docs/commons-spelunkr-channels.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('35 direct watch links match observed official directory entries',()=>{
 assert.equal(RETRO_CHANNELS.length,35);
 assert.equal(new Set(RETRO_CHANNELS.map(x=>x.number)).size,35);
 assert.equal(new Set(RETRO_CHANNELS.map(x=>x.url)).size,35);
 assert.ok(RETRO_CHANNELS.every(x=>/^https:\/\/spelunkr\.tv\/[a-z0-9-]+$/.test(x.url)));
 assert.deepEqual(RETRO_CHANNELS.map(x=>x.number),[...RETRO_CHANNELS.map(x=>x.number)].sort((a,b)=>a-b));
 assert.equal(RETRO_CHANNELS.find(x=>x.number===300).url,'https://spelunkr.tv/waku-waku');
 assert.equal(RETRO_CHANNELS.find(x=>x.number===401).url,'https://spelunkr.tv/meddling-kids');
 assert.equal(RETRO_GROUPS[0][0],'all');
});
test('private board presents accessible local channel guide, not a copied player',()=>{
 const js=read('docs/commons-spelunkr.mjs');
 for(const k of ['aria-modal','family-retro-guide','aria-labelledby','family-retro-search','family-retro-filters',
   'openGuide','closeGuide','paintCards','favorites','Watch channel','if(board.hidden)','drawing.after(link)','button.after(link)','noopener noreferrer'])
 assert.ok(js.includes(k),k);
 assert.doesNotMatch(js,/<iframe|srcdoc|document\.write|archive\.org/i);
 assert.match(js,/https:\/\/spelunkr\.tv\/\?tv/);
});
test('family page loads new responsive styling and module',()=>{
 const s=read('docs/community.html');
 assert.match(s,/commons-spelunkr\.mjs\?v=guide2/);
 assert.match(s,/commons-spelunkr\.css\?v=guide2/);
 const css=read('docs/commons-spelunkr.css');
 assert.match(css,/#family-retro-guide/);
 assert.match(css,/@media\(max-width:630px\)/);
 assert.match(css,/safe-area-inset-top/);
});
