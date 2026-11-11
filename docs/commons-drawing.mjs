/* The Commons drawing studio: local-only art with downloadable PNG/JPEG/editable project. */
export function startDrawingStudio(host,userId){
 const W=1000,H=640,storeKey='commons-art-v1:'+userId;
 const palette=['#382147','#186e77','#f4b451','#e6753b','#e45c7f','#ffffff','#000000','#5d8e58','#9356a8','#2c69ba'];
 const tools=[['pencil','Pencil'],['brush','Brush'],['marker','Marker'],['eraser','Eraser'],['line','Line'],['rectangle','Rectangle'],['ellipse','Ellipse'],['text','Text'],['picker','Color picker'],['bucket','Fill background'],['pan','Pan']];
 const safeTool=new Set(tools.map(t=>t[0]));
 const model={width:W,height:H,background:'#ffffff',layers:[{id:'base',name:'Layer 1',visible:true,objects:[]}],active:'base'};
 let tool='brush',color='#382147',size=7,opacity=1,filled=false,symmetry=false,grid=false,zoom=1;
 let inProgress=null,pointerId=null,undo=[],redo=[],photoCache=new Map(),panStart=null;
 const $=q=>host.querySelector(q);
 host.innerHTML=`<div class="art-tools" id="art-toolbox" role="toolbar" aria-label="Drawing tools"></div>
 <div class="art-style"><label>Color <input id="art-color" type="color" value="#382147" aria-label="Pen color"></label>
 <label>Brush size <input id="art-size" type="range" min="1" max="70" value="7"><output id="art-size-label">7px</output></label>
 <label>Opacity <input id="art-opacity" type="range" min="10" max="100" value="100"><output id="art-opacity-label">100%</output></label>
 <label><input id="art-filled" type="checkbox"> Fill shapes</label><label><input id="art-symmetry" type="checkbox"> Mirror drawing</label><label><input id="art-grid" type="checkbox"> Show grid</label></div>
 <div class="art-swatches" id="art-swatches" aria-label="Color palette"></div>
 <div class="art-layer-row"><strong>Layers</strong><label class="sr-only" for="art-layers">Active layer</label><select id="art-layers"></select><button type="button" class="family-btn secondary" id="art-new-layer">+ Layer</button><button type="button" class="family-btn secondary" id="art-toggle-layer">Show/hide</button><button type="button" class="family-btn secondary" id="art-move-layer">Move up</button><button type="button" class="family-btn warn" id="art-delete-layer">Delete layer</button></div>
 <div class="art-actions"><button class="family-btn secondary" type="button" id="art-undo">↶ Undo</button><button class="family-btn secondary" type="button" id="art-redo">↷ Redo</button><label>Zoom <select id="art-zoom"><option value="0.65">65%</option><option value="1" selected>Fit</option><option value="1.5">150%</option><option value="2">200%</option><option value="3">300%</option></select></label>
 <label>Paper <select id="art-paper"><option value="#ffffff">White</option><option value="#fff2dd">Cream</option><option value="#252033">Dark</option><option value="transparent">Transparent</option></select></label>
 <button type="button" class="family-btn secondary" id="art-import-image">Add photo</button><button type="button" class="family-btn secondary" id="art-import-project">Open project</button><button type="button" class="family-btn warn" id="art-clear">Clear drawing</button></div>
 <div class="art-canvas-wrap" id="art-viewport"><canvas id="commons-art-canvas" width="1000" height="640" role="img" aria-label="Drawing canvas; use the selected tool to draw with mouse, finger or stylus"></canvas></div>
 <div class="art-actions"><button type="button" class="family-btn" id="art-save-png">↓ Download PNG</button><button type="button" class="family-btn" id="art-save-jpeg">↓ Download JPEG</button><button type="button" class="family-btn secondary" id="art-save-project">↓ Save editable project</button></div>
 <p class="art-status" id="art-status" role="status" aria-live="polite">Ready to create.</p><p class="art-hint">Use a finger, stylus or mouse. Each artwork is private to this browser until you choose to export it. PNG supports transparent backgrounds; editable project files preserve your layers.</p>
 <input id="art-file-image" type="file" accept="image/png,image/jpeg,image/webp" hidden><input id="art-file-project" type="file" accept="application/json,.json" hidden>`;
 const canvas=$('#commons-art-canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 const offscreen=document.createElement('canvas');offscreen.width=W;offscreen.height=H;
 const octx=offscreen.getContext('2d');
 const setStatus=s=>{$('#art-status').textContent=s;};
 const snapshot=()=>JSON.stringify({background:model.background,layers:model.layers,active:model.active});
 const checkpoint=()=>{undo.push(snapshot());if(undo.length>35)undo.shift();redo=[];};
 const activeLayer=()=>model.layers.find(l=>l.id===model.active)||model.layers[0];
 const persist=()=>{try{const body=snapshot();if(body.length<3500000)localStorage.setItem(storeKey,body);}catch{setStatus('Your art remains on this screen. Download a project to save it.');}};
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function restore(body){
  const d=typeof body==='string'?JSON.parse(body):body;
  if(!d||!Array.isArray(d.layers)||d.layers.length<1||d.layers.length>18||!d.layers.every(l=>typeof l.name==='string'&&Array.isArray(l.objects)&&l.objects.length<2000))throw Error('Project file is invalid or too large.');
  for(const l of d.layers)for(const o of l.objects){if(!safeTool.has(o.tool)&&o.tool!=='image')throw Error('Project contains an unsupported tool.');if(o.points&&(!Array.isArray(o.points)||o.points.length>4000))throw Error('Project path is too large.');}
  model.background=d.background==='transparent'?'transparent':/^#[0-9a-f]{6}$/i.test(d.background||'')?d.background:'#ffffff';
  model.layers=d.layers;model.active=model.layers.some(l=>l.id===d.active)?d.active:model.layers[0].id;
  $('#art-paper').value=model.background;layersUI();draw();persist();
 }
 function setTool(next){tool=next;for(const b of $('#art-toolbox').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.tool===tool));canvas.style.cursor=tool==='pan'?'grab':tool==='text'?'text':tool==='picker'?'copy':'crosshair';}
 for(const [key,name] of tools){const b=document.createElement('button');b.type='button';b.className='family-btn secondary';b.textContent=name;b.dataset.tool=key;b.setAttribute('aria-pressed',String(key===tool));b.addEventListener('click',()=>setTool(key));$('#art-toolbox').append(b);}
 for(const swatch of palette){const b=document.createElement('button');b.type='button';b.className='art-swatch';b.style.background=swatch;b.title='Choose '+swatch;b.setAttribute('aria-label','Choose '+swatch);b.addEventListener('click',()=>{color=swatch;$('#art-color').value=color;});$('#art-swatches').append(b);}
 function layersUI(){const select=$('#art-layers');select.replaceChildren();for(const l of model.layers){const opt=document.createElement('option');opt.value=l.id;opt.textContent=(l.visible?'● ':'○ ')+l.name;select.append(opt);}select.value=model.active;}
 function applyOp(c,o){
  if(!o)return;
  if(o.tool==='image'){
   if(!photoCache.has(o.src)){const img=new Image();img.onload=()=>draw();img.onerror=()=>photoCache.set(o.src,null);photoCache.set(o.src,img);img.src=o.src;}
   const img=photoCache.get(o.src);if(img?.complete&&img.naturalWidth>0)c.drawImage(img,0,0,W,H);return;
  }
  c.save();c.globalAlpha=clamp(Number(o.opacity)||1,.01,1);c.strokeStyle=o.color||'#382147';c.fillStyle=o.color||'#382147';
  c.lineWidth=clamp(Number(o.size)||6,1,70)*(o.tool==='marker'?2.2:1);
  c.lineJoin='round';c.lineCap='round';
  if(o.tool==='marker')c.globalAlpha*=.35;
  if(o.tool==='eraser')c.globalCompositeOperation='destination-out';
  const p=o.points||[];if(!p.length){c.restore();return;}
  const a=p[0],b=p[p.length-1];
  if(['pencil','brush','marker','eraser'].includes(o.tool)){
   c.beginPath();c.moveTo(a.x,a.y);if(p.length===1)c.lineTo(a.x+.1,a.y+.1);else for(let i=1;i<p.length;i++)c.lineTo(p[i].x,p[i].y);c.stroke();
  }else if(o.tool==='line'){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
  else if(o.tool==='rectangle'){
   if(o.filled)c.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);else c.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
  }else if(o.tool==='ellipse'){
   c.beginPath();c.ellipse((a.x+b.x)/2,(a.y+b.y)/2,Math.max(.5,Math.abs(b.x-a.x)/2),Math.max(.5,Math.abs(b.y-a.y)/2),0,0,Math.PI*2);
   if(o.filled)c.fill();else c.stroke();
  }else if(o.tool==='text'){
   c.font=`${Math.max(15,Number(o.size)*4)}px system-ui,sans-serif`;c.textBaseline='top';c.fillText(String(o.text||'').slice(0,140),a.x,a.y,Math.max(1,W-a.x));
  }
  c.restore();
 }
 function draw(includeGrid=true){
  ctx.clearRect(0,0,W,H);
  if(model.background!=='transparent'){ctx.fillStyle=model.background;ctx.fillRect(0,0,W,H);}
  for(const layer of model.layers){if(!layer.visible)continue;
   octx.clearRect(0,0,W,H);for(const op of layer.objects){applyOp(octx,op);if(op.mirror&&['pencil','brush','marker','eraser','line','rectangle','ellipse'].includes(op.tool)){octx.save();octx.translate(W,0);octx.scale(-1,1);applyOp(octx,op);octx.restore();}}
   if(layer.id===model.active&&inProgress){applyOp(octx,inProgress);if(inProgress.mirror){octx.save();octx.translate(W,0);octx.scale(-1,1);applyOp(octx,inProgress);octx.restore();}}
   ctx.drawImage(offscreen,0,0);
  }
  if(grid&&includeGrid){ctx.save();ctx.strokeStyle='#6d5c7250';ctx.lineWidth=1;for(let x=50;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=50;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.restore();}
 }
 function add(op){checkpoint();activeLayer().objects.push(op);draw();persist();}
 const point=e=>{const rect=canvas.getBoundingClientRect();return{x:clamp((e.clientX-rect.left)*W/rect.width,0,W),y:clamp((e.clientY-rect.top)*H/rect.height,0,H)};};
 function start(e){
  if(e.button!==undefined&&e.button!==0)return;
  if(pointerId!==null)return;pointerId=e.pointerId;
  if(tool==='pan'){panStart={x:e.clientX,y:e.clientY,left:$('#art-viewport').scrollLeft,top:$('#art-viewport').scrollTop};canvas.setPointerCapture(e.pointerId);return;}
  const p=point(e);
  if(tool==='picker'){const rgba=ctx.getImageData(Math.floor(p.x),Math.floor(p.y),1,1).data;color='#'+[rgba[0],rgba[1],rgba[2]].map(v=>v.toString(16).padStart(2,'0')).join('');$('#art-color').value=color;setTool('brush');pointerId=null;setStatus('Color picked.');return;}
  if(tool==='bucket'){checkpoint();model.background=color;$('#art-paper').value=palette.includes(color)?'':color;draw();persist();pointerId=null;setStatus('Background filled.');return;}
  if(tool==='text'){
   const phrase=window.prompt('What would you like to write?');pointerId=null;if(phrase?.trim())add({tool:'text',points:[p],text:phrase.trim().slice(0,140),color,size,opacity});return;
  }
  if(!activeLayer().visible){pointerId=null;setStatus('Show this layer before drawing on it.');return;}
  inProgress={tool,points:[p],color,size,opacity,filled,mirror:symmetry};canvas.setPointerCapture(e.pointerId);draw();
 }
 function move(e){if(pointerId!==e.pointerId)return;
  if(panStart){const box=$('#art-viewport');box.scrollLeft=panStart.left-(e.clientX-panStart.x);box.scrollTop=panStart.top-(e.clientY-panStart.y);return;}
  if(!inProgress)return;const p=point(e);
  if(['pencil','brush','marker','eraser'].includes(tool)){
   const last=inProgress.points[inProgress.points.length-1];if(Math.hypot(p.x-last.x,p.y-last.y)>=1.2&&inProgress.points.length<3500)inProgress.points.push(p);
  }else inProgress.points[1]=p;
  draw();
 }
 function finish(e){if(e.pointerId!==pointerId)return;
  if(panStart){panStart=null;pointerId=null;return;}
  if(inProgress){const op=inProgress;inProgress=null;add(op);}pointerId=null;
 }
 canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
 $('#art-color').addEventListener('input',e=>{color=e.target.value;});
 $('#art-size').addEventListener('input',e=>{size=Number(e.target.value);$('#art-size-label').textContent=size+'px';});
 $('#art-opacity').addEventListener('input',e=>{opacity=Number(e.target.value)/100;$('#art-opacity-label').textContent=e.target.value+'%';});
 $('#art-filled').addEventListener('change',e=>filled=e.target.checked);
 $('#art-symmetry').addEventListener('change',e=>symmetry=e.target.checked);
 $('#art-grid').addEventListener('change',e=>{grid=e.target.checked;draw();});
 $('#art-layers').addEventListener('change',e=>{model.active=e.target.value;draw();});
 $('#art-new-layer').addEventListener('click',()=>{if(model.layers.length>=12){setStatus('Maximum 12 layers.');return;}checkpoint();const id='layer-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);model.layers.push({id,name:'Layer '+(model.layers.length+1),visible:true,objects:[]});model.active=id;layersUI();draw();persist();});
 $('#art-toggle-layer').addEventListener('click',()=>{checkpoint();activeLayer().visible=!activeLayer().visible;layersUI();draw();persist();});
 $('#art-move-layer').addEventListener('click',()=>{const i=model.layers.findIndex(l=>l.id===model.active);if(i<model.layers.length-1){checkpoint();[model.layers[i],model.layers[i+1]]=[model.layers[i+1],model.layers[i]];layersUI();draw();persist();}});
 $('#art-delete-layer').addEventListener('click',()=>{if(model.layers.length<=1){setStatus('Keep at least one layer.');return;}if(!confirm('Delete this layer and its strokes?'))return;checkpoint();model.layers=model.layers.filter(l=>l.id!==model.active);model.active=model.layers[model.layers.length-1].id;layersUI();draw();persist();});
 $('#art-undo').addEventListener('click',()=>{if(undo.length){redo.push(snapshot());restore(undo.pop());setStatus('Undone.');}});
 $('#art-redo').addEventListener('click',()=>{if(redo.length){undo.push(snapshot());restore(redo.pop());setStatus('Restored.');}});
 $('#art-zoom').addEventListener('change',e=>{zoom=Number(e.target.value);canvas.style.width=`${100*zoom}%`;canvas.style.height='auto';setStatus('Zoom: '+Math.round(zoom*100)+'%');});
 $('#art-paper').addEventListener('change',e=>{checkpoint();model.background=e.target.value;draw();persist();});
 $('#art-clear').addEventListener('click',()=>{if(!confirm('Clear the entire drawing? You can Undo afterward.'))return;checkpoint();for(const l of model.layers)l.objects=[];draw();persist();});
 $('#art-import-image').addEventListener('click',()=>$('#art-file-image').click());
 $('#art-import-project').addEventListener('click',()=>$('#art-file-project').click());
 $('#art-file-image').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>4000000){setStatus('Choose a PNG, JPEG or WebP under 4 MB.');return;}const reader=new FileReader();reader.onload=()=>{add({tool:'image',src:reader.result});setStatus('Photo added to the current layer.');};reader.readAsDataURL(f);e.target.value='';});
 $('#art-file-project').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>8000000)throw Error('Project exceeds 8 MB.');const s=await f.text();checkpoint();restore(s);setStatus('Project opened with its layers.');}catch(err){setStatus(err.message||'Could not open project.');}e.target.value='';});
 function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);setStatus(name+' downloaded.');}
 function exportImage(mime){draw(false);if(mime==='image/jpeg'&&model.background==='transparent'){
  const temp=document.createElement('canvas');temp.width=W;temp.height=H;const c=temp.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);c.drawImage(canvas,0,0);
  temp.toBlob(b=>{if(b)download(b,'commons-art-'+Date.now()+'.jpg');draw();},mime,.93);return;
 }
 canvas.toBlob(b=>{if(b)download(b,'commons-art-'+Date.now()+(mime==='image/png'?'.png':'.jpg'));draw();},mime,.93);
 }
 $('#art-save-png').addEventListener('click',()=>exportImage('image/png'));
 $('#art-save-jpeg').addEventListener('click',()=>exportImage('image/jpeg'));
 $('#art-save-project').addEventListener('click',()=>{const s=JSON.stringify({...JSON.parse(snapshot()),format:'commons-art-v1',width:W,height:H});download(new Blob([s],{type:'application/json'}),'commons-art-'+Date.now()+'.json');});
 try{const saved=localStorage.getItem(storeKey);if(saved)restore(saved);}catch{/* Fresh blank page is safe. */}
 layersUI();draw();setTool('brush');canvas.style.width='100%';
}
