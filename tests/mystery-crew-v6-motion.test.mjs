import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAINTED_MOTIONS,PAINTED_PARTS,setPaintedRigMotion} from '../docs/mystery-crew-motion-v6.mjs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('painted rig has seven unique clipped movable paint layers',()=>{
 assert.deepEqual(PAINTED_MOTIONS,['idle','wave','cheer','think','run','action']);
 assert.deepEqual(PAINTED_PARTS.map(p=>p.id),['leg-left','leg-right','torso','arm-left','arm-right','head','hair']);
 assert.equal(new Set(PAINTED_PARTS.map(p=>p.id)).size,7);
 assert(PAINTED_PARTS.every(p=>p.shape.startsWith('M')&&p.shape.endsWith('Z')));
 const runtime=read('docs/mystery-crew-motion-v6.mjs');
 assert.match(runtime,/setPaintedRigSprite/);
 assert.match(runtime,/image.setAttribute\('href',url\)/);
 assert.doesNotMatch(runtime,/fetch\(|supabase|localStorage|indexedDB|XMLHttpRequest|eval\(/i);
});
test('motion controls are allowlisted with safe fallback',()=>{
 const node={dataset:{}};
 for(const value of PAINTED_MOTIONS){
  assert.equal(setPaintedRigMotion(node,value),value);
  assert.equal(node.dataset.motion,value);
 }
 assert.equal(setPaintedRigMotion(node,'injected'),'idle');
 const runtime=read('docs/mystery-crew-character-v5.mjs');
 assert.match(runtime,/setPaintedRigSprite\(visual,url\)/);
 assert.match(runtime,/setPaintedRigMotion\(visual,options.motion\)/);
 const creator=read('docs/mystery-crew-creator.mjs');
 assert.match(creator,/app\.dataset\.motion=motion;[\s\S]*?updateScene\(\);/);
});
test('all six actions animate painted layers, respect reduced motion, and bust cache',()=>{
 const css=read('docs/mystery-crew-creator.css');
 for(const action of PAINTED_MOTIONS)assert(css.includes('[data-motion="'+action+'"]'),action);
 for(const part of PAINTED_PARTS)assert(css.includes('[data-v6-part="'+part.id+'"]'),part.id);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*#mc-v6-painted-rig/);
 const html=read('docs/mystery-crew-creator.html');
 assert.match(html,/mystery-crew-creator\.css\?v=crew6/);
 assert.match(html,/mystery-crew-creator\.mjs\?v=crew6/);
});
