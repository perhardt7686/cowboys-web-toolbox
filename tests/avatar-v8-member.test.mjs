import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {BY_ID} from '../docs/avatar-reward-catalog.mjs';
import {BODY_MODELS} from '../docs/avatar-full-body.mjs';
import {paintV8Character} from '../docs/avatar-v8-original-cels.mjs';
import {V8_ART_IDS,paintV8RewardIcon} from '../docs/avatar-v8-prize-cels.mjs';

const read=file=>readFileSync(fileURLToPath(new URL('../docs/'+file,import.meta.url)),'utf8');
class MockPath{constructor(value){this.path=value;}}
function makeCanvas(){
  const trace=[];
  const color=()=>({addColorStop(offset,rgba){trace.push(['color',offset,rgba]);}});
  const c={
    createLinearGradient:color,createRadialGradient:color,
    fillRect(...p){trace.push(['fillRect',...p]);},
    setTransform(...p){trace.push(['setTransform',...p]);},
    transform(...p){trace.push(['transform',...p]);},
    translate(...p){trace.push(['translate',...p]);},scale(...p){trace.push(['scale',...p]);},
    beginPath(){},ellipse(...p){trace.push(['ellipse',...p]);},
    moveTo(...p){trace.push(['moveTo',...p]);},lineTo(...p){trace.push(['lineTo',...p]);},
    fill(a){trace.push(['fill',a?.path||'']);},
    stroke(a){trace.push(['stroke',a?.path||'']);},
    save(){trace.push(['save']);},restore(){trace.push(['restore']);},
    fillText(...p){trace.push(['text',...p]);}
  };
  return {width:640,height:650,dataset:{},getContext(type){return type==='2d'?c:null;},trace};
}
const oldPath=globalThis.Path2D;
test('new actor cels draw human, robot, and monster families using saved model keys',()=>{
  globalThis.Path2D=MockPath;
  try{
    for(const [model,body] of Object.entries(BODY_MODELS)){
      const canvas=makeCanvas();
      assert.equal(paintV8Character(canvas,{skin:'sand',hair:'brown',style:'shag',shirt:'forest',full_body:{model}}, {angle:45,zoom:1.2}),true,model);
      assert.equal(canvas.dataset.backend,'v8-original-cel');
      assert.ok(canvas.trace.length>70,model);
      assert.ok(canvas.trace.some(a=>a[0]==='transform'),model);
    }
  }finally{globalThis.Path2D=oldPath;}
});
test('the new painter deliberately yields gear to the complete legacy fitting engine',()=>{
  const canvas=makeCanvas();
  assert.equal(paintV8Character(canvas,{full_body:{model:'detective'},cosmetics:{hat:'viking-battle-helmet'}},{angle:0}),false);
  assert.deepEqual(canvas.dataset,{});
  assert.equal(canvas.trace.length,0);
});
test('twelve individual V8 art IDs exist in the authoritative catalog',()=>{
  assert.equal(V8_ART_IDS.length,12);
  assert.equal(new Set(V8_ART_IDS).size,12);
  for(const id of V8_ART_IDS)assert.ok(BY_ID.has(id),id);
});
test('all twelve reward designs render original cels without changing item state',()=>{
  globalThis.Path2D=MockPath;
  try{
    for(const id of V8_ART_IDS){
      const item=BY_ID.get(id),canvas=makeCanvas(),before=JSON.stringify(item);
      assert.equal(paintV8RewardIcon(canvas,item),true,id);
      assert.equal(canvas.dataset.artPack,'v8-ink');
      assert.ok(canvas.trace.length>10,id);
      assert.equal(JSON.stringify(item),before,id);
    }
    assert.equal(paintV8RewardIcon(makeCanvas(),{id:'not-real'}),false);
  }finally{globalThis.Path2D=oldPath;}
});
test('live cutover retains authenticated RPC gate, earned-state and save validation',()=>{
  const files=['community-profiles.mjs','avatar-reward-studio.mjs','avatar-studio-pets.mjs'];
  const sources=files.map(read);
  assert.match(sources[0],/if\(!approved\(\)\)throw new Error/);
  assert.match(sources[0],/community_avatar_equip/);
  assert.match(sources[0],/rewards\.have\(item\)/);
  assert.match(sources[1],/community_avatar_reward_state/);
  assert.match(sources[1],/new Map\(\(data\.earned/);
  assert.match(sources[2],/community_avatar_pet_state/);
  assert.match(sources[2],/community_avatar_pet_action/);
  assert.match(sources[2],/makePetGallery/);
  assert.match(read('avatar-studio-preview.mjs'),/paintV8Character/);
  assert.match(read('avatar-v8-live.mjs'),/Classic layout/);
  assert.match(read('community.html'),/avatar-v8-live\.css/);
});
test('redesigned studio is reversible and never writes account state from its shell',()=>{
  const js=read('avatar-v8-live.mjs'),css=read('avatar-v8-live.css');
  assert.doesNotMatch(js,/\bfetch\s*\(|localStorage|sessionStorage|supabase|\.rpc\(|\.insert\(|\.upsert\(/);
  assert.match(js,/avatar-v8-mode-changed/);
  assert.match(css,/\[data-v8-mode="classic"\]/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/max-width:420px/);
});
