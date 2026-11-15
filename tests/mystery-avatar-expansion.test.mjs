import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MYSTERY_EXTRAS} from '../docs/avatar-mystery-extras.mjs';
import {CATALOG, BY_ID} from '../docs/avatar-reward-catalog.mjs';
import {AVATAR_OPTIONS,DEFAULT_AVATAR_RECIPE,normalizeAvatarRecipe} from '../docs/family-avatar-builder.mjs';
import {petBehavior} from '../docs/avatar-prize-actions.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('36 original collectibles include 12 real adoptable pets plus gadgets, scenery and effects',()=>{
 assert.equal(MYSTERY_EXTRAS.length,36);
 const counts={};for(const item of MYSTERY_EXTRAS)counts[item.slot]=(counts[item.slot]||0)+1;
 assert.deepEqual(counts,{companion:12,prop:12,background:6,effect:6});
 assert.equal(new Set(MYSTERY_EXTRAS.map(v=>v.id)).size,36);
 assert.equal(CATALOG.length,310);
 for(const item of MYSTERY_EXTRAS){
  assert.equal(typeof item.draw,'function');
  assert.equal(BY_ID.get(item.id)?.achievement_id,item.achievement_id);
  assert.equal(BY_ID.get(item.id)?.slot,item.slot);
 }
});
test('all new pets can be named, petted and taught unique tricks',()=>{
 const pets=MYSTERY_EXTRAS.filter(i=>i.slot==='companion');
 assert.equal(pets.length,12);
 for(const item of pets)for(const action of ['pet','play','trick']){
  const spec=petBehavior(item,action);
  assert.ok(spec.caption?.length>15,item.id+' '+action);
  assert.ok(spec.label);
  assert.match(spec.accent,/^#[a-f0-9]{6}$/i);
 }
 assert.equal(new Set(pets.map(item=>petBehavior(item,'trick').label)).size,12);
});
test('new face, nose, cheek and garment options remain completely free',()=>{
 const extra={face:6,nose:5,cheeks:4,garment:11};
 for(const [key,num] of Object.entries(extra))assert.equal(AVATAR_OPTIONS[key]?.length,num);
 const old=normalizeAvatarRecipe({skin:'sand',shirt:'violet',style:'wavy'});
 assert.equal(old.face,'oval');assert.equal(old.garment,'collared');
 for(const key of Object.keys(DEFAULT_AVATAR_RECIPE))assert.ok(old[key]);
 assert.match(read('docs/community.html'),/community\.js\?v=arcade6/);
});
test('profile photos remain available, while unlocks stay server-gated',()=>{
 const p=read('docs/community-profiles.mjs'),s=read('docs/avatar-reward-studio.mjs');
 assert.match(p,/getAvatarPhoto/);
 assert.match(s,/community_avatar_reward_state/);
 assert.doesNotMatch(read('docs/avatar-mystery-extras.mjs'),/fetch\(|<iframe|document\.write/);
});
