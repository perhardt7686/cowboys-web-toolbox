import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {
  BODIES,DEMO_ONLY,REWARDS,REWARD_BY_ID,assertDemoContract,compatible,
  newDemoState,previewReward,updateDemoState,visibleRewards
} from '../docs/avatar-v8-core.mjs';

const here=(name)=>readFileSync(fileURLToPath(new URL('../docs/'+name,import.meta.url)),'utf8');

test('V8 prototype is explicitly read-only and retains twelve unique established reward IDs',()=>{
  assert.equal(DEMO_ONLY,true);
  assert.equal(assertDemoContract(),true);
  assert.equal(BODIES.length,2);
  assert.equal(REWARDS.length,12);
  assert.equal(new Set(REWARDS.map(r=>r.id)).size,12);
  assert.equal(REWARDS.filter(r=>r.slot==='companion').length,2);
});

test('preview does not create entitlements, scores or network state',()=>{
  const state=newDemoState();
  assert.ok(!('owned' in state));
  assert.ok(!('achievements' in state));
  const next=previewReward(state,'viking-battle-helmet');
  assert.equal(next.equipped.hat,'viking-battle-helmet');
  assert.deepEqual(state.equipped,{});
  assert.ok(!('owned' in next));
});

test('preview slots replace only their own slot and preserve earlier choices',()=>{
  let state=newDemoState();
  state=previewReward(state,'viking-battle-helmet');
  state=previewReward(state,'studio-observatory-telescope');
  state=previewReward(state,'studio-backlot-flashlight');
  assert.equal(state.equipped.hat,'viking-battle-helmet');
  assert.equal(state.equipped.prop,'studio-backlot-flashlight');
  assert.equal(Object.keys(state.equipped).length,2);
});

test('incompatible gear cannot be equipped and body swap removes only invalid gear',()=>{
  let state=newDemoState();
  assert.equal(compatible('human',REWARD_BY_ID.get('studio-workshop-visor')),false);
  assert.equal(previewReward(state,'studio-workshop-visor'),state);
  state=previewReward(state,'studio-observatory-coat');
  state=previewReward(state,'viking-battle-helmet');
  state=updateDemoState(state,{type:'body',value:'robot'});
  assert.equal(state.equipped.outerwear,undefined);
  assert.equal(state.equipped.hat,'viking-battle-helmet');
  state=previewReward(state,'studio-workshop-visor');
  assert.equal(state.equipped.bodypart,'studio-workshop-visor');
});

test('pet selection and animation are transient demo state, never simulated bond progress',()=>{
  const original=newDemoState();
  const selected=previewReward(original,'studio-tower-gargoyle');
  assert.equal(selected.pet,'studio-tower-gargoyle');
  assert.equal(selected.gesture,'hello');
  const played=updateDemoState(selected,{type:'pet-play'});
  assert.equal(played.gesture,'play');
  assert.equal(played.pet,'studio-tower-gargoyle');
  assert.equal(played.bond,undefined);
});

test('invalid IDs and input values cannot mutate the prototype recipe',()=>{
  const initial=newDemoState();
  assert.equal(previewReward(initial,'__invalid__'),initial);
  assert.equal(updateDemoState(initial,{type:'body',value:'unknown'}),initial);
  assert.equal(updateDemoState(initial,{type:'tab',value:'admin'}),initial);
  assert.equal(updateDemoState(initial,{type:'skin',value:'url(javascript:alert(1))'}),initial);
});

test('reward categories are deterministic and include every asset once',()=>{
  const state=newDemoState();
  assert.equal(visibleRewards(state).length,12);
  const wearables=visibleRewards(updateDemoState(state,{type:'filter',value:'wearable'}));
  const pets=visibleRewards(updateDemoState(state,{type:'filter',value:'companion'}));
  assert.equal(wearables.length,10);
  assert.equal(pets.length,2);
  assert.equal(wearables.length+pets.length,REWARDS.length);
});

test('static pilot has no account integration, third-party scripts or entitlement writes',()=>{
  const html=here('avatar-v8-pilot.html');
  const app=here('avatar-v8-pilot.mjs');
  const styles=here('avatar-v8-pilot.css');
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/aria-label="V8 studio demonstration"/);
  assert.match(html,/type="module"/);
  assert.ok(!/<script[^>]+src="https?:/i.test(html));
  assert.ok(!/@import|fonts\.googleapis/i.test(styles));
  assert.ok(!/community_avatar_(?:save|pet_action)|\bsupabase\b|localStorage|sessionStorage|fetch\s*\(/i.test(app));
  assert.match(app,/Download demo recipe/);
  assert.match(app,/aria-live="polite"/);
  assert.match(styles,/prefers-reduced-motion/);
  assert.match(styles,/@media\(max-width:600px\)/);
});
