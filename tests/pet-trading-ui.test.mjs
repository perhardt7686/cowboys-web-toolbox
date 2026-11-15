import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('private trade controls allow offers, swaps, gifts, consent and cancellation',()=>{
 const ui=read('docs/avatar-pet-trading.mjs');
 for(const term of ['community_avatar_pet_trade_state','community_avatar_pet_trade_offer',
   'community_avatar_pet_trade_action','Review offer','Confirm pet transfer',
   'Accept and transfer','Decline','Cancel offer','gift',
   'p_revision:pet.revision','Refresh offers','approved family member']){
   assert.ok(ui.includes(term),term);
 }
 assert.doesNotMatch(ui,/localStorage|window\.location|fetch\(/);
});
test('pet ownership follows private server inventory, not the old trophy alone',()=>{
 const pets=read('docs/avatar-studio-pets.mjs');
 assert.match(pets,/pets\.has\(item\.id\)/);
 assert.match(pets,/trading\.mount\(tradeHost,pets,selected\)/);
 assert.match(pets,/trading\.clear\(\)/);
 const state=read('supabase/migrations/20261115054701_family_pet_trade_inventory_authority.sql');
 assert.match(state,/avatar_pet_claim/);
 assert.match(state,/avatar_reward_outfit/);
 assert.match(state,/avatar_reward_current/);
});
test('trade UI is scoped to family profile, not the public toolbox',()=>{
 const html=read('docs/community.html');
 assert.match(html,/avatar-pet-trading\.css\?v=trade2/);
 assert.match(html,/community\.js\?v=toon3/);
 assert.match(read('docs/avatar-reward-studio.mjs'),/avatar-studio-pets\.mjs\?v=toon3/);
});
