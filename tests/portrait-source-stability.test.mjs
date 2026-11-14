import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('old decoration engine never overwrites current profile/scoreboard avatar images',()=>{
 const s=read('docs/community-coco.mjs');
 assert.doesNotMatch(s,/replaceAvatar\s*\(/);
 assert.doesNotMatch(s,/\.replaceChildren\s*\(\s*\)/);
 assert.doesNotMatch(s,/querySelectorAll\('\[data-member-profile\]/);
 assert.match(s,/pictures\.get\('van'\)/);
});
test('authoritative profile photo is selected, cached, and can update independently',()=>{
 const p=read('docs/community-profiles.mjs'),f=read('docs/family-board.mjs'),
    q=read('docs/commons-family.mjs');
 assert.match(p,/avatar_mode==='photo'/);
 assert.match(p,/getAvatarPhoto\(/);
 assert.match(f,/family-avatar-updated/);
 assert.match(q,/next\.set\(id,url\)/);
});
