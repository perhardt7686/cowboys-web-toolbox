import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RETRO_UNLOCKS,retroUnlocks,canEquipRetro,resolveRetroUnlock,retroRewardForTrophy,retroCosmeticPalette} from '../docs/retro-game-unlockables.mjs';
const read=name=>readFileSync(new URL('../docs/'+name,import.meta.url),'utf8');

test('every original server trophy unlocks exactly one reward in its own game',()=>{
 const trophies=['first-run','bronze','silver','gold','legendary'];
 assert.deepEqual(Object.keys(RETRO_UNLOCKS).sort(),['fleet','maze']);
 for(const game of ['fleet','maze']){
  const items=retroUnlocks(game);
  assert.equal(items.length,6);
  assert.equal(items[0].need,null);
  assert.equal(new Set(items.map(x=>x.id)).size,6);
  assert.deepEqual(items.slice(1).map(x=>x.need),trophies);
  for(const t of trophies){
   const item=retroRewardForTrophy(game,t);
   assert.ok(item,'Missing game-specific unlock from '+t);
   assert.equal(canEquipRetro(game,item.id,[]),false);
   assert.equal(canEquipRetro(game,item.id,[t]),true);
   assert.equal(resolveRetroUnlock(game,item.id,[]),items[0].id);
   assert.equal(resolveRetroUnlock(game,item.id,[t]),item.id);
  }
 }
 for(const game of ['fleet','maze']){
  for(const item of retroUnlocks(game)){
   const other=game==='fleet'?'maze':'fleet';
   assert.equal(canEquipRetro(other,item.id,['first-run','bronze','silver','gold','legendary']),false);
  }
 }
 assert.deepEqual(retroUnlocks('galaga'),[]);
 assert.equal(resolveRetroUnlock('galaga','admiral',[]),null);
});

test('cosmetic equipment is visible but leaves the replay/scoring engine untouched',()=>{
 const art=read('retro-unlock-art.mjs');
 const renderer=read('commons-retro-arcade.mjs');
 assert.match(renderer,/drawFleetGear\(ctx,look,s,x,y\)/);
 assert.match(renderer,/drawFleetWake\(ctx,look,s,x,y\)/);
 assert.match(renderer,/drawMazeGear\(ctx,look,s,xx,yy\)/);
 assert.match(renderer,/drawMazeFootprints\(ctx,look,s,tile\)/);
 assert.match(renderer,/retroCosmeticPalette\('fleet',look\)/);
 assert.match(renderer,/retroCosmeticPalette\('maze',look\)/);
 assert.doesNotMatch(art,/community_retro_finish|retroStep|community_retro_replay/);
 assert.doesNotMatch(read('retro-game-unlockables.mjs'),/community_retro_finish|retroStep/);
 assert.notDeepEqual(retroCosmeticPalette('fleet','patrol'),retroCosmeticPalette('fleet','nova'));
 assert.notDeepEqual(retroCosmeticPalette('maze','scout'),retroCosmeticPalette('maze','keeper'));
 assert.deepEqual(retroCosmeticPalette('fleet','nosuchthing'),retroCosmeticPalette('fleet','patrol'));
});

test('verified trophy gating, per-user equipment and sign-out clearing are wired',()=>{
 const renderer=read('commons-retro-arcade.mjs'),scoreboard=read('commons-family-fun.mjs');
 const html=read('community.html'),css=read('commons-family-fun.css');
 assert.match(renderer,/community_retro_state/);
 assert.match(renderer,/canEquipRetro\(game,id,earnedFor\(game\)\)/);
 assert.match(renderer,/cowboy-game-gear-v1:/);
 assert.match(renderer,/restoreLooks\(id\)/);
 assert.match(renderer,/scoreReadEpoch\+\+/);
 assert.match(renderer,/family-retro-scoreboard-clear/);
 assert.match(renderer,/family-retro-equip-request/);
 assert.match(renderer,/retro-gear-panel/);
 assert.match(renderer,/drawMazeGear/);
 assert.match(scoreboard,/retroUnlocks\(game.id\)/);
 assert.match(scoreboard,/family-retro-gear-changed/);
 assert.match(scoreboard,/family-retro-scoreboard-clear/);
 assert.match(scoreboard,/MutationObserver\(dock\)/);
 assert.match(scoreboard,/target\.prepend\(root\)/);
 assert.doesNotMatch(scoreboard,/root\.cloneNode\(/);
 assert.match(css,/family-fun-single/);
 assert.match(html,/commons-retro-arcade\.mjs\?v=retro11/);
 assert.match(html,/commons-family-fun\.css\?v=marquee6/);
 assert.match(html,/commons-arcade-shell\.mjs\?v=arcade10/);
 assert.match(html,/commons-retro-arcade\.css\?v=retro5/);
});
