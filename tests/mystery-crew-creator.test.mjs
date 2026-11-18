import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=name=>readFileSync(fileURLToPath(new URL('../docs/'+name,import.meta.url)),'utf8');
test('approved reference and exact name are immutable source requirements',()=>{
 const html=read('mystery-crew-creator.html'),doc=read('mystery-crew-creator-reference.md');
 assert.match(html,/<title>Mystery Crew Creator/);
 assert.match(html,/id="mc-roster"/);
 assert.match(html,/id="mc-scene"/);
 assert.match(html,/id="mc-cards"/);
 assert.match(html,/id="mc-swatch/);
 assert.match(html,/data-view="collections"/);
 assert.match(doc,/1672 × 941/);
 assert.match(doc,/4ad4fd88ddb53e5e7d9fd94aaa8739951b7fc393b5bbd62494b8385873bf8f7d/);
 assert.doesNotMatch(html,/Dressing room|Classic layout|Avatar Studio/);
});
test('real member launcher is redirected without rewriting the family-account API',()=>{
 const src=read('community-profiles.mjs');
 assert.match(src,/if\(requested==='avatar'&&!ctx\.isPreview&&approved\(\)\)/);
 assert.match(src,/if\(b\.dataset\.profileTab==='avatar'&&!ctx\.isPreview&&approved\(\)\)/);
 assert.match(src,/mystery-crew-creator\.html/);
 assert.match(src,/if\(!approved\(\)\)throw new Error/);
});
test('new creator has working independent device-only state, not pretend server coins',()=>{
 const src=read('mystery-crew-creator.mjs');
 assert.match(src,/localStorage\.getItem\(KEY\)/);
 assert.match(src,/localStorage\.setItem\(KEY,/);
 assert.match(src,/coins:\s*60/);
 assert.match(src,/draft\.coins-=item\.cost/);
 assert.match(src,/document\.addEventListener\('click'/);
 assert.match(src,/case 'mc-save'/);
 assert.match(src,/data\.motion/);
 assert.doesNotMatch(src,/\bfetch\s*\(|supabase|\.rpc\(|\bindexedDB\b/);
});
test('responsive and reduced-motion rules keep original creator standalone',()=>{
 const css=read('mystery-crew-creator.css');
 assert.match(css,/max-width:650px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.mc-layout/);
 assert.match(css,/\.mc-card-art/);
 assert.doesNotMatch(css,/avatar-dressing-studio|studio-workspace-dialog/);
});
