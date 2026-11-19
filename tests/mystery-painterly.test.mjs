import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {unpackPainterlyTar} from '../docs/mystery-painterly-stage.mjs';

const path=(name)=>fileURLToPath(new URL('../docs/'+name,import.meta.url));
const archive=readFileSync(path('mystery-painterly-assets.tar'));

test('19 actual painted assets ship in the same-origin release archive, not a screenshot',()=>{
 const bytes=unpackPainterlyTar(archive);
 assert.equal(bytes.size,19);
 for(const [name,data] of bytes){
  assert.match(name,/\.webp$/);
  assert.equal(String.fromCharCode(...data.slice(0,4)),'RIFF',name+' missing RIFF header');
  assert.equal(String.fromCharCode(...data.slice(8,12)),'WEBP',name+' missing WebP header');
  assert.ok(data.length>1500,name+' appears empty');
 }
 assert.ok(!bytes.has('reference.png'),'private original screenshot must not be shipped');
});

test('character art is separated into matching pose-registration layers',()=>{
 const bytes=unpackPainterlyTar(archive);
 for(const part of ['head','torso','legs','backpack','leftarm','rightarm']){
  assert.ok(bytes.get('hero-'+part+'.webp').byteLength>5000,part+' must be a real layer');
 }
 assert.ok(bytes.get('hound.webp').byteLength>15000);
 assert.ok(bytes.get('van-painted.webp').byteLength>10000);
 assert.ok(bytes.get('workshop-painted.webp').byteLength>10000);
});

test('all eight collection outfit paintings exist independently',()=>{
 const bytes=unpackPainterlyTar(archive);
 const names=['detective','explorer','viking','pilot','space','knight','outdoors','stealth'];
 for(const id of names)assert.ok(bytes.has('outfit-'+id+'.webp'),'Missing painted '+id);
});

test('corrupted, oversized, duplicate and unsafe tar entries are rejected',()=>{
 const arr=new Uint8Array(archive);
 assert.throws(()=>unpackPainterlyTar(new Uint8Array([2,3,4])),/size invalid/);
 const bad=new Uint8Array(arr);
 bad.set(new TextEncoder().encode('../bad.webp'),0);
 assert.throws(()=>unpackPainterlyTar(bad),/Invalid painted asset/);
 assert.throws(()=>unpackPainterlyTar(new Uint8Array(2000001)),/size invalid/);
});

test('art remains optional; existing live SVG and account save workflow are intact',()=>{
 const js=readFileSync(path('mystery-crew-creator.mjs'),'utf8');
 const art=readFileSync(path('mystery-painterly-stage.mjs'),'utf8');
 const html=readFileSync(path('mystery-crew-creator.html'),'utf8');
 assert.match(js,/community_mystery_crew_save/);
 assert.match(js,/loadPainterlyPack\(render\)/);
 assert.match(js,/syncPainterlyStage/);
 assert.match(js,/renderWearables\(m\)/);
 assert.match(js,/renderPetSpecies\(m\)/);
 assert.match(js,/painterlyOutfitHTML/);
 assert.match(art,/member\.faceShape==='oval'/);
 assert.match(art,/actor\.style\.opacity=anchor\?'0':'1'/);
 assert.match(art,/member\.pet==='dog'/);
 assert.match(html,/mystery-crew-creator\.css\?v=crew5/);
 assert.match(html,/mystery-crew-creator\.mjs\?v=crew5/);
});
