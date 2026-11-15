import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('every approved family member sees a direct avatar studio shortcut by menu',()=>{
 const nav=read('docs/unified-nav.js'),community=read('docs/community.js');
 assert.match(nav,/avatarQuick\.hidden=true/);
 assert.match(nav,/root\.append\(avatarQuick\)/);
 assert.match(nav,/family-open-avatar-studio/);
 assert.match(community,/family-avatar-state/);
 assert.match(community,/showProfile\('avatar'\)/);
 assert.match(community,/visible:canReadBoard\(member\)/);
});
test('simple profile settings preserve advanced saved fields and send editable avatar recipe',()=>{
 const s=read('docs/community-profiles.mjs'),client=read('docs/forum-core.mjs'),
   server=read('supabase/functions/community-api/forum-core.mjs');
 for(const label of ['My Profile','Avatar Studio','Privacy & Account','family-avatar-canvas',
   "community_avatar_equip","getOwn()","Save my avatar","getAvatarPhoto"]){
     assert.ok(s.includes(label),label);
 }
 assert.match(s,/character=replaceAvatar&&avatarMethod==='character'/);
 assert.match(s,/\.upload\(path,blob/);
 assert.match(client,/avatar_recipe/);assert.match(server,/avatar_recipe/);
 assert.match(read('docs/community.html'),/family-avatar-studio\.css\?v=toon3/);
});
test('photo and icon preferences stay private and Hot Rod is untouched',()=>{
 const nav=read('docs/unified-nav.js'),studio=read('docs/community-profiles.mjs');
 assert.match(nav,/page==='commons'/);
 assert.match(studio,/draft=getOwn\(\)/);
 assert.doesNotMatch(studio,/streetrod|sr-toggle/);
});
