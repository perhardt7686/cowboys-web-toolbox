#!/usr/bin/env python3
"""Offline browser-only art workbench. Builds from original V5, never changes family data."""
from pathlib import Path
from PIL import Image
import base64,io,tarfile,json,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/mystery-crew-v5-illustrated.tar'
OUT=ROOT/'reports/Mystery_Crew_V7_Pose_Studio.html'
OUT.parent.mkdir(parents=True,exist_ok=True)
W,H=430,574
names=('detective','explorer','viking','pilot','space','knight','outdoors','stealth')
parts=('torso','head','arm-left','hand-left','arm-right','hand-right','leg-left','leg-right')
Y,X=np.indices((H,W))
semantic=np.zeros((H,W),dtype='uint8')
semantic[Y<185]=1
semantic[(Y>=322)&(X<217)]=6
semantic[(Y>=322)&(X>=217)]=7
left=(Y>=196)&(Y<316)&(((X<169)&(Y<269))|((X<201)&(Y>=269)))
right=(Y>=196)&(Y<323)&(((X>270)&(Y<273))|((X>274)&(Y>=273)))
semantic[left]=2;semantic[right]=4
semantic[((X-184)**2/23**2+(Y-295)**2/27**2<1)&(Y>=266)]=3
semantic[((X-294)**2/23**2+(Y-300)**2/27**2<1)&(Y>=267)]=5
semantic[Y<165]=1
sprites={}
before=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
with tarfile.open(SOURCE) as pack:
 for i in range(6):
  for outfit in names:
   name=f'crew-{i}-{outfit}.webp'
   f=pack.extractfile(name)
   assert f is not None,name
   data=f.read()
   image=Image.open(io.BytesIO(data));image.load()
   assert image.size==(W,H),name
   sprites[f'{i}/{outfit}']='data:image/webp;base64,'+base64.b64encode(data).decode()
assert len(sprites)==48
masks={}
for index,name in enumerate(parts):
 pic=Image.fromarray((semantic==index).astype('uint8')*255,'L')
 b=io.BytesIO();pic.save(b,'PNG',optimize=True)
 masks[name]='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==before
html=r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>Mystery Crew V7 Painted Pose Studio</title>
<style>
*{box-sizing:border-box}body{margin:0;font:16px system-ui;background:#10263b;color:#f8e8c5}
header{padding:16px 24px;background:#213d51;border-bottom:4px solid #c98440}
h1{font-size:clamp(22px,3vw,31px);margin:0}p{margin:6px 0;font-size:14px;line-height:1.5}
main{max-width:1300px;margin:auto;display:grid;grid-template-columns:225px 1fr;gap:14px;padding:12px}
aside,section{background:#213b51;border:2px solid #708094;border-radius:13px;padding:12px}
aside{align-self:start}label{display:block;font-weight:650;font-size:14px;margin-bottom:9px}
select,button{display:block;width:100%;padding:9px;margin:4px 0 12px;background:#f3ddad;color:#24364a;border-radius:8px;border:2px solid #bb985b;min-height:43px;font:inherit;font-weight:650}
button[aria-pressed=true]{background:#ffd46a}button{cursor:pointer}input[type=range]{width:100%}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.duo h2{font-size:15px;margin:0 0 8px}.duo>div{text-align:center}
canvas{display:block;width:100%;max-width:430px;aspect-ratio:430/574;margin:auto;background:repeating-conic-gradient(#ede1cf 0 25%,#cfc1aa 0 50%) 0 0/32px 32px;border:3px solid #b89563;border-radius:9px}
.motions{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;padding-top:12px}.motions button{font-size:13px;padding:8px 0}
.tuners{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
small,.note{color:#cbdbe7}#status{font-size:13px;line-height:1.5}
@media(max-width:780px){main{display:block}aside{margin-bottom:9px}.motions{grid-template-columns:repeat(3,1fr)}.tuners{grid-template-columns:repeat(2,1fr)}}
@media(max-width:450px){main{padding:6px}.duo{gap:4px}.duo h2{font-size:12px}canvas{border-width:2px}.tuners{grid-template-columns:1fr}}
</style></head><body><header><h1>🎨 Mystery Crew V7 · Painted Pose Studio</h1>
<p>Standalone art laboratory. The original V5 image is unchanged. Draft motion is NOT production-ready.</p></header>
<main><aside><label>Character<select id="crew"><option value="0">Scout</option><option value="1">Juniper</option>
<option value="2">Finn</option><option value="3">Riley</option><option value="4">Atlas</option><option value="5">Wren</option></select></label>
<label>Painted outfit<select id="outfit"><option>detective</option><option>explorer</option>
<option>viking</option><option>pilot</option><option>space</option><option>knight</option>
<option>outdoors</option><option>stealth</option></select></label>
<label><input type="checkbox" id="markers" checked> Show joint markers</label>
<label><input type="checkbox" id="play"> Animate action</label>
<button id="snapshot">Export pose as PNG</button><button id="reset">Reset pose</button>
<div id="status" role="status">Loading the painted originals...</div>
<p class="note">Experimental source-pixel rig. Shoulder repairs, open hands and garment folds still need individual artwork.</p></aside>
<section><div class="duo"><div><h2>Original V5 illustration</h2><canvas id="original" width="430" height="574"></canvas></div>
<div><h2>Proposed moving pose</h2><canvas id="posed" width="430" height="574"></canvas></div></div>
<nav class="motions"><button data-pose="idle" aria-pressed="true">Idle</button><button data-pose="wave">Wave</button>
<button data-pose="cheer">Cheer</button><button data-pose="think">Think</button>
<button data-pose="run">Run</button><button data-pose="action">Action</button></nav>
<div class="tuners"><label>Left arm <span id="leftVal">0°</span><input type="range" id="left" min="-160" max="160" value="0"></label>
<label>Right arm <span id="rightVal">0°</span><input type="range" id="right" min="-160" max="160" value="0"></label>
<label>Left leg <span id="legLeftVal">0°</span><input type="range" id="legLeft" min="-28" max="28" value="0"></label>
<label>Right leg <span id="legRightVal">0°</span><input type="range" id="legRight" min="-28" max="28" value="0"></label>
<label>Head <span id="headVal">0°</span><input type="range" id="head" min="-15" max="15" value="0"></label>
<label>Phase <span id="phaseVal">0%</span><input type="range" id="phase" min="0" max="100" value="0"></label></div>
<p class="note">All 48 V5 source artworks are embedded for offline review. No API calls, account changes, saved-member writes, unlocks or purchases.</p>
</section></main><script>
'use strict';
const SPRITES=__SPRITES__,MASKS=__MASKS__;
const PARTS=['torso','head','arm-left','hand-left','arm-right','hand-right','leg-left','leg-right'];
const pivot={head:[214,165],'arm-left':[151,207],'hand-left':[151,207],
'arm-right':[280,205],'hand-right':[280,205],'leg-left':[182,329],'leg-right':[254,329]};
const $=id=>document.getElementById(id);
const sourceCtx=$('original').getContext('2d'),poseCtx=$('posed').getContext('2d');
let pieces=[],loading=0,pose='idle',animated=false,last=0;
const config={idle:[0,0,0,0,0],wave:[0,-114,0,0,2],cheer:[112,-112,0,0,-2],
 think:[0,40,0,0,-5],run:[22,-22,16,-16,2],action:[45,-60,11,-11,3]};
const fields=['left','right','legLeft','legRight','head','phase'];
const image=url=>new Promise((resolve,reject)=>{let i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url});
async function choose(){
 const n=++loading,key=$('crew').value+'/'+$('outfit').value;
 $('status').textContent='Loading painted '+key;
 const base=await image(SPRITES[key]),masks=await Promise.all(PARTS.map(k=>image(MASKS[k])));
 if(n!==loading)return;
 pieces=PARTS.map((part,index)=>{
  const c=document.createElement('canvas');c.width=430;c.height=574;
  const x=c.getContext('2d');x.drawImage(base,0,0);x.globalCompositeOperation='destination-in';x.drawImage(masks[index],0,0);return c;
 });
 sourceCtx.clearRect(0,0,430,574);sourceCtx.drawImage(base,0,0);draw();
 $('status').textContent='Original loaded: '+key+'. Preview is experimental and not published.';
}
function angle(part){
 const id=part==='head'?'head':part==='arm-left'||part==='hand-left'?'left':
 part==='arm-right'||part==='hand-right'?'right':part==='leg-left'?'legLeft':part==='leg-right'?'legRight':null;
 if(!id)return 0;
 const value=Number($(id).value);
 if(!animated)return value;
 const phase=Number($('phase').value)/100;
 return value*(pose==='run'?Math.cos(phase*2*Math.PI):(.88+.12*Math.cos(phase*2*Math.PI)));
}
function draw(){
 if(!pieces.length)return;
 poseCtx.clearRect(0,0,430,574);
 for(const i of [6,7,2,3,4,5,0,1]){
  const part=PARTS[i],p=pivot[part]||[215,315];
  poseCtx.save();poseCtx.translate(...p);poseCtx.rotate(angle(part)*Math.PI/180);poseCtx.translate(-p[0],-p[1]);poseCtx.drawImage(pieces[i],0,0);poseCtx.restore();
 }
 if($('markers').checked){
  for(const [name,p] of Object.entries(pivot)){
   if(name.startsWith('hand'))continue;
   poseCtx.strokeStyle=name.startsWith('leg')?'#25dedd':'#ff4faf';
   poseCtx.lineWidth=2;poseCtx.beginPath();poseCtx.arc(p[0],p[1],5,0,Math.PI*2);poseCtx.stroke();
  }
 }
}
function labels(){for(const id of fields)$(id+'Val').textContent=$(id).value+(id==='phase'?'%':'°')}
function setPose(name){
 pose=name;const settings=config[name];
 for(const [i,id] of ['left','right','legLeft','legRight','head'].entries())$(id).value=String(settings[i]);
 document.querySelectorAll('[data-pose]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pose===pose)));
 labels();draw();
}
for(const id of fields)$(id).addEventListener('input',()=>{labels();draw()});
for(const id of ['crew','outfit'])$(id).addEventListener('change',()=>choose().catch(e=>$('status').textContent=e.message));
for(const b of document.querySelectorAll('[data-pose]'))b.addEventListener('click',()=>setPose(b.dataset.pose));
$('markers').addEventListener('change',draw);
$('play').addEventListener('change',()=>{animated=$('play').checked});
$('reset').addEventListener('click',()=>{animated=false;$('play').checked=false;setPose('idle');$('phase').value=0;labels()});
$('snapshot').addEventListener('click',()=>{const a=document.createElement('a');a.href=$('posed').toDataURL('image/png');a.download='mystery-v7-'+$('crew').value+'-'+$('outfit').value+'-'+pose+'-EXPERIMENT.png';a.click()});
function tick(now){if(animated){const dt=Math.min(100,now-last||16);$('phase').value=(Number($('phase').value)+.065*dt)%100;labels();draw()}last=now;requestAnimationFrame(tick)}
if(matchMedia('(prefers-reduced-motion: reduce)').matches){$('play').disabled=true;$('status').textContent='Reduced motion preference is active.'}
choose().then(()=>{setPose('idle');requestAnimationFrame(tick)}).catch(e=>$('status').textContent=e.message);
</script></body></html>'''
OUT.write_text(html.replace('__SPRITES__',json.dumps(sprites,separators=(',',':'))).replace('__MASKS__',json.dumps(masks,separators=(',',':'))),encoding='utf-8')
assert OUT.stat().st_size<3500000
print('Pose Studio: 48 original sources, 8 masks, offline HTML:',OUT.stat().st_size,'bytes')
