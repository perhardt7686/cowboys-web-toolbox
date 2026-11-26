import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSections,filterSections} from '../integrations/cowboys-core/navigation.mjs';
test('all unique existing routes are preserved with distinct readable tones',()=>{
  const sections=normalizeSections([{id:'home',label:'Home'},{id:'work',label:'Work'},{id:'people',label:'People'},
    {id:'people',label:'Duplicate'},{id:'library',label:'Library'},{id:'savage',label:'Savage',group:'Workspaces'},{id:'pvf',label:'PVF'}]);
  assert.deepEqual(sections.map(s=>s.id),['home','work','people','library','savage','pvf']);
  assert.equal(new Set(sections.map(s=>s.color)).size,6);
});
test('section search matches both labels and groups without changing source records',()=>{
  const source=normalizeSections([{id:'savage',label:'Savage Pest Warfare',group:'Workspaces'},{id:'pvf',label:'PVF',group:'Workspaces'}]);
  assert.equal(filterSections(source,'workspaces pest')[0].id,'savage');
  assert.equal(filterSections(source,'absent').length,0);
  assert.equal(source.length,2);
});
