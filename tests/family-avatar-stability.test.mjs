import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('community profile images use stable private blob URLs rather than expiring signed links',()=>{
 const cache=read('docs/family-avatar-cache.mjs');
 const profiles=read('docs/community-profiles.mjs');
 assert.match(cache,/createObjectURL\(blob\)/);
 assert.match(cache,/\.download\(path\)/);
 assert.match(cache,/cache\.has\(path\)/);
 assert.doesNotMatch(profiles,/createSignedUrls/);
 assert.match(profiles,/getAvatarPhoto/);
 assert.match(profiles,/family-avatar-updated/);
});
test('family scoreboard hydrates photos before repaint and keeps images for the session',()=>{
 const s=read('docs/family-board.mjs');
 assert.match(s,/await updatePhotos\(result\)/);
 assert.match(s,/await getAvatarPhoto\(client,path\)/);
 assert.doesNotMatch(s,/createSignedUrls/);
 assert.match(s,/onAvatarUpdated/);
});
test('Word Quest prioritizes the member-chosen profile photo over stored board portraits',()=>{
 const s=read('docs/commons-family.mjs');
 const i=s.indexOf('if(!art.error)'),j=s.indexOf('if(!profiles.error)');
 assert.ok(i>0&&j>i);
 assert.match(s,/next\.set\(id,url\)/);
 assert.match(s,/img\.startsWith\('blob:'\)/);
 assert.match(s,/const next=new Map\(avatarMap\)/);
});
