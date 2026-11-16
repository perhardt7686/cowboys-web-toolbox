import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRetroLifecycle} from '../docs/retro-arcade-lifecycle.mjs';

test('late server start cannot reopen an abandoned Star Squadron round',async()=>{
 const guard=createRetroLifecycle();
 const first=guard.begin('fleet');
 assert.equal(guard.pendingGame(),'fleet');
 let deliver;
 const delayed=new Promise(resolve=>{deliver=resolve;})
  .then(()=>guard.matches(first));
 guard.invalidate(); // Player taps Leave before RPC completes.
 deliver({game:'fleet',run_id:'old-fixture'});
 assert.equal(await delayed,false);
 assert.equal(guard.pendingGame(),null);
});

test('new Mystery Maze start cannot be overwritten by an old fleet reply',()=>{
 const guard=createRetroLifecycle();
 const first=guard.begin('fleet');
 const second=guard.begin('maze');
 assert.equal(guard.matches(first),false);
 assert.equal(guard.matches(second),true);
 assert.equal(guard.pendingGame(),'maze');
 guard.clearPending(first);
 assert.equal(guard.pendingGame(),'maze');
 guard.clearPending(second);
 assert.equal(guard.pendingGame(),null);
 assert.equal(guard.matches(second),true); // Current run may now finish.
});

test('late score verification cannot clear a newer running game',async()=>{
 const guard=createRetroLifecycle();
 const first=guard.begin('fleet');
 guard.clearPending(first);
 let deliver;
 const delayed=new Promise(resolve=>{deliver=resolve;})
  .then(()=>guard.matches(first));
 guard.invalidate(); // Player exits while finish request is in flight.
 const second=guard.begin('maze');
 deliver({score:999});
 assert.equal(await delayed,false);
 assert.equal(guard.matches(second),true);
});

test('sign-out and repeated navigation always invalidate prior callbacks',()=>{
 const guard=createRetroLifecycle();
 const first=guard.begin('maze');
 guard.invalidate();
 guard.invalidate();
 assert.equal(guard.matches(first),false);
 const newTicket=guard.begin('maze');
 assert.notEqual(newTicket,first);
 assert.equal(guard.matches(newTicket),true);
});

test('retro UI invalidates hidden, abandoned and superseded async rounds',()=>{
 const src=readFileSync(new URL('../docs/commons-retro-arcade.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../docs/community.html',import.meta.url),'utf8');
 assert.match(src,/createRetroLifecycle\(\)/);
 assert.match(src,/const ticket=lifecycle\.begin\(id\)/);
 assert.match(src,/lifecycle\.pendingGame\(\)===id/);
 assert.match(src,/lifecycle\.invalidate\(\)/);
 assert.match(src,/if\(!lifecycle\.matches\(ticket\)\)return;/);
 assert.match(src,/owner=user/);
 assert.match(src,/root\.isConnected/);
 assert.match(src,/lifecycle\.current\(\)/);
 assert.match(src,/A completed run may still finish server verification/);
 assert.match(html,/commons-retro-arcade\.mjs\?v=retro7/);
});
