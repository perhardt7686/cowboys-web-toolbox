import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {v4AssetUrls} from '../docs/mystery-crew-scene-v4.mjs';

const read=name=>readFileSync(fileURLToPath(new URL('../docs/'+name,import.meta.url)),'utf8');

test('workshop is an original full-viewport asset, not a cropped overlay',()=>{
 const art=read('mystery-workshop-v4.svg');
 assert.match(art,/viewBox="0 0 960 620"/);
 assert.match(art,/<linearGradient id="sky"/);
 assert.match(art,/<linearGradient id="shop"/);
 assert.match(art,/id="grit"/);
 assert.match(art,/id="vignette"/);
 assert.match(art,/id="pineA"/);
 assert.ok((art.match(/<path /g)||[]).length>35,'Scene needs actual environment details');
 assert.doesNotMatch(art,/<image |data:image|\.png|\.webp/i);
});

test('mystery van is independent, complete and specifically illustrated',()=>{
 const art=read('mystery-van-v4.svg');
 assert.match(art,/viewBox="0 0 760 465"/);
 for(const id of ['upper','blue','glass','stripe','tire','lamp','badge'])
  assert.ok(art.includes('id="'+id+'"'),id+' missing');
 assert.ok((art.match(/<circle /g)||[]).length>=12,'Roof lights, wheels and magnifying glass required');
 assert.match(art,/filter="url\(#depth\)"/);
 assert.doesNotMatch(art,/<image |data:image|\.png|\.webp/i);
});

test('runtime uses two independently decoded, same-origin illustrations with rollback',()=>{
 const script=read('mystery-crew-scene-v4.mjs');
 const creator=read('mystery-crew-creator.mjs');
 const css=read('mystery-crew-creator.css');
 const html=read('mystery-crew-creator.html');
 assert.match(script,/await Promise\.all\(Object\.values\(ASSET\)\.map\(decodedAsset\)\)/);
 assert.match(script,/document\.getElementById\('mc-vehicle'\)/);
 assert.match(script,/scene\.dataset\.sceneVersion='4'/);
 assert.match(script,/scene\.dataset\.sceneVersion='3-fallback'/);
 assert.match(script,/member\?\.vehicle==='van'/);
 assert.match(script,/for\(const child of background\)child\.style\.display='none'/);
 assert.match(creator,/void loadPainterlyPack\(render\)\.then\(async loaded=>/);
 assert.match(creator,/syncSceneV4\(m\)/);
 assert.match(css,/#mc-scene\[data-v4-vehicle="van"\] #mc-vector-van/);
 assert.match(html,/mystery-crew-creator\.mjs\?v=scene4/);
 assert.match(html,/mystery-crew-creator\.css\?v=scene4/);
 const assets=v4AssetUrls();
 assert.ok(assets.landscape.endsWith('mystery-workshop-v4.webp'));
 assert.ok(assets.van.endsWith('mystery-van-v4.svg'));
});

test('saves and item IDs are unaffected by scene-only upgrade',()=>{
 const script=read('mystery-crew-creator.mjs');
 const scene=read('mystery-crew-scene-v4.mjs');
 assert.match(script,/community_mystery_crew_save/);
 assert.match(script,/community_mystery_crew_unlock/);
 assert.doesNotMatch(scene,/supabase|localStorage|update.*account|fetch\(.+\/rpc/i);
 assert.doesNotMatch(scene,/innerHTML\s*=\s*.*member/i);
});
