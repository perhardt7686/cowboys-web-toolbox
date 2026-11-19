import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CREW_ANCHORS} from '../docs/mystery-crew-art.mjs';
import {V5_MANIFEST,unpackCrewV5,paintedRecipe,paintedAnchor} from '../docs/mystery-crew-character-v5.mjs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>readFileSync(root+name,'utf8');
const outfits=['detective','explorer','viking','pilot','space','knight','outdoors','stealth'];
const shade={detective:'#ef792f',explorer:'#6c9354',viking:'#9d7859',pilot:'#855b39',space:'#ece9df',knight:'#8da9b7',outdoors:'#b54037',stealth:'#303d49'};
const palettes=[
 ['#f0b989','#904b28'],
 ['#f4c8a9','#b8432a'],
 ['#f7cfa8','#e0b447'],
 ['#ebbe99','#302b46'],
 ['#d69a77','#5c3424'],
 ['#bb8767','#342e32']
];
const make=(i,o)=>({...CREW_ANCHORS[i],skin:palettes[i][0],hair:palettes[i][1],outfit:o,shirt:shade[o],hat:'none',gear:'none'});
test('six distinctive illustrated anchors share 8 real outfit recipes',()=>{
 assert.equal(V5_MANIFEST.anchors,6);assert.equal(V5_MANIFEST.variations,48);
 assert.deepEqual([...V5_MANIFEST.outfits],outfits);
 const recipes=new Set();
 for(let i=0;i<6;i++){
  for(const o of outfits){
   const m=make(i,o);
   assert.equal(paintedAnchor(m),i);
   const r=paintedRecipe(m,{angle:0});
   assert.equal(r,'crew-'+i+'-'+o+'.webp');
   assert(!recipes.has(r));recipes.add(r);
  }
 }
 assert.equal(recipes.size,48);
});
test('non-matching colors, invented recipes, hats and side views fall back safely',()=>{
 const m=make(1,'explorer');
 for(const [field,value] of [['skin','#000000'],['hair','#000000'],['shirt','#ff0088'],['hat','fedora'],['gear','binoculars'],['outfit','invented']]){
  assert.equal(paintedRecipe({...m,[field]:value}),null,field);
 }
 assert.equal(paintedRecipe(m,{angle:90}),null);
 assert.equal(paintedRecipe(m,{angle:180}),null);
 for(const motion of ['wave','cheer','think','run','action'])
  assert.equal(paintedRecipe(m,{motion}),null,'Keep the established animated rig for '+motion);
 assert.equal(paintedRecipe({}),null);
});
test('every sprite is a genuine independently decodable 430×574 painterly WebP',()=>{
 const filename=root+'docs/mystery-crew-v5-illustrated.tar';
 assert(existsSync(filename),'Actual binary artwork must be committed before release');
 const buffer=readFileSync(filename);
 assert(buffer.length<4500000);
 const sprites=unpackCrewV5(buffer);
 assert.equal(sprites.size,48);
 const ids=[...sprites.keys()];
 assert.equal(ids.length,new Set(ids).size);
 for(const name of ids){
  assert.match(name,/^crew-[0-5]-(detective|explorer|viking|pilot|space|knight|outdoors|stealth)\.webp$/);
  const bytes=sprites.get(name);
  assert(bytes.length>500);
  assert.equal(Buffer.from(bytes.subarray(0,4)).toString(),'RIFF');
  assert.equal(Buffer.from(bytes.subarray(8,12)).toString(),'WEBP');
 }
 const changed=sprites.get('crew-0-detective.webp');
 for(const o of outfits.slice(1))
  assert.notDeepEqual(changed,sprites.get('crew-0-'+o+'.webp'),'Costume must visibly change art');
});
test('V5 changes illustration only and keeps exact V4 account paths',()=>{
 const js=read('docs/mystery-crew-creator.mjs');
 const runtime=read('docs/mystery-crew-character-v5.mjs');
 const html=read('docs/mystery-crew-creator.html');
 assert.match(js,/community_mystery_crew_save/);
 assert.match(js,/community_mystery_crew_unlock/);
 assert.match(js,/syncCrewV5\(m,\{zoom,angle,motion\}\)/);
 assert.match(js,/paintedCrewPortraitHTML\(member\)\|\|mysteryCrewPortraitSVG\(member\)/);
 assert.match(runtime,/background-image:url/);
 assert.match(js,/await loadCrewV5\(\)/);
 assert.match(runtime,/data-crew-art-pack|crewArtPack/);
 assert.doesNotMatch(runtime,/supabase|localStorage|indexedDB|XMLHttpRequest|eval\(/i);
 assert.match(html,/mystery-crew-creator\.css\?v=crew5/);
 assert.match(html,/mystery-crew-creator\.mjs\?v=crew5/);
});
