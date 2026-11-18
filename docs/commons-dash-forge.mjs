/* Dash Forge · Original member-only rhythm-platformer. No Geometry Dash assets,
 * music or proprietary levels. Server owns timing validation, achievements and awards. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
import {createSourceHolds} from './family-arcade-touch-input.mjs';
import {DASH_DT,DASH_CEILING,DASH_MODES,DASH_TOOLS,dashCanTransform,dashCanRotate,dashBeatAt,dashGateActive,dashObjects,createDashCourse,createDashRun,stepDash} from './dash-physics.mjs?v=courses2';
import {DASH_PALETTES,drawDashObject,drawDashPlayer} from './dash-art.mjs?v=courses2';
import {submitArcadeReplay} from './family-arcade-replay.mjs';
import {DASH_COURSE_EDITION,DASH_CUES,DASH_OVERHEAD,DASH_SECTIONS,dashSection,dashCampaignPlan} from './dash-campaign.mjs';
import {DASH_SONGS,campaignSong,playDashNote} from './dash-soundtracks.mjs';
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const board=document.getElementById('conversations');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TILE=40,W=960,H=360;
const TABS=[['campaign','Campaign'],['community','Member Levels'],['builder','Level Studio'],['awards','Awards'],['leaders','Leaders']];
const PAINTS=[['.','Clear'],['s','Spike'],['b','Block'],['g','Gap'],['l','Laser'],['w','Saw'],['c','Crystal'],['p','Pillar'],['f','Flames'],['r','Ring'],['m','Mushroom'],['o','Mine'],['d','Drone'],['h','Hammer'],...Object.entries(DASH_MODES),...Object.entries(DASH_TOOLS)];
const CREATOR_WORLDS=['Maker Studio','Origin Circuit','Neon Canopy','Clockwork Harbor',
 'Crystal Hollow','Skyglass City','Solar Dunes','Thunder Rails','Abyssal Reef',
 'Volcanic Foundry','Pixel Metropolis','Moonlit Gardens','Starfall Observatory','Endless Aurora'];
const BOSS_FORMS=[['none','No boss · Standard level'],['canopy','Thorn Monarch'],
 ['clockwork','Chrono Colossus'],['crystal','Prism Serpent'],
 ['skyglass','Skybreaker Sentinel'],['solar','Solar Sandwyrm'],
 ['thunder','Volt Leviathan'],['reef','Abyssal Lantern'],
 ['volcanic','Magma Titan'],['pixel','Glitch Sovereign'],
 ['garden','Moonbloom Guardian'],['starfall','Astral Devourer'],
 ['aurora','Aurora Warden']];
const THEMES=[['amber','#ffd363',0],['cyan','#6ee9fb',2],['coral','#ff749c',4],['aurora','#96ffb3',6],
 ['sapphire','#7d94ff',10],['ember','#ff995c',20],['lotus','#df92ff',30],['sunbeam','#fff58a',50],
 ['arcade','#67ffc8',75],['starlight','#ebdefc',100],['obsidian','#a8aac1',200],['legend','#fff',500]];
let client=null,user=null,root=null,inside=null,state=null,scene='campaign',busy=false,open=false,run=null,frame=0,brush='s';
let soundOn=false,audioContext=null,lastBeat=-1;
let draft={id:null,title:'My First Dash',difficulty:2,pattern:'.'.repeat(48),world:'Maker Studio',bossStyle:'none',layout:[],song:'pulse'},theme='amber',refreshTimer=null,booted=false;
const EDITOR_SPAN=24,EDIT_LENGTHS=[24,32,40,48,56,64,72,80,88];
let editorPage=0,undoHistory=[],redoHistory=[],draftDirty=true,runFromBuilder=false,creatorTestOutcome='';
const PAINT_GLYPHS={'.':'·',s:'▲',b:'■',g:'▽',l:'ϟ',w:'✺',c:'◆',p:'▮',f:'♨',r:'◎',m:'♣',o:'◉',d:'▣',h:'⚒',
 C:'▣',S:'◀',B:'●',U:'◉',W:'⌁',R:'▦',P:'✳',V:'⬢',I:'⇅',F:'»',L:'‹',E:'=',J:'⤒',O:'◯',M:'↕',K:'⚑',D:'◇',T:'✦',H:'▥',A:'⤊',N:'‹‹',Q:'✦'};
const PAINT_COLORS={'.':'#a3f0c5',s:'#ff7296',b:'#ffb36b',g:'#6acbff',l:'#d39dff',w:'#ffe086',c:'#a3eaff',p:'#b7a6ff',
 f:'#ffa460',r:'#92ffdf',m:'#ecbaff',o:'#ff8cbc',d:'#86eeff',h:'#ecbc8c',...DASH_PALETTES};
const PAINT_GROUPS=[
 ['Hazards',PAINTS.slice(0,14)],
 ['Movement',Object.entries(DASH_MODES)],
 ['Portals & events',Object.entries(DASH_TOOLS)]
];
const dataKey=()=>user?'dash-forge-draft-v2-'+user:null;
const defaultDraft=(title='My First Dash')=>({id:null,title,difficulty:2,pattern:'.'.repeat(48),world:'Maker Studio',bossStyle:'none',layout:[],song:'pulse'});
let tileSelected=4,zoom=1,zoomStart=null,clipboard=null,pickTool='paint',paintGroup='Hazards',editLayer='track',drag=null,autoTimer=0;
let inputTapped=false,lastRun=null,draftLoadedFor=null,attemptKey='',attemptCount=0;
const dashControls=createSourceHolds(['jump']);
let dashTouchTargets=[];
function resetDashTouch(){
 dashControls.clear();inputTapped=false;
 for(const item of dashTouchTargets){item.pointers.clear();item.node.classList.remove('pressed');}
}
function bindDashTouch(node){
 const pointers=new Set();dashTouchTargets.push({node,pointers});
 node.addEventListener('pointerdown',event=>{
  if(!run||run.finishing||node.disabled||(event.pointerType==='mouse'&&event.button!==0))return;
  event.preventDefault();
  pointers.add(event.pointerId);
  dashControls.hold('jump','pointer:'+event.pointerId);
  node.classList.add('pressed');
  try{node.setPointerCapture(event.pointerId);}catch{}
  jump();
 },{passive:false});
 const release=event=>{
  if(!pointers.delete(event.pointerId))return;
  dashControls.release('jump','pointer:'+event.pointerId);
  if(!pointers.size)node.classList.remove('pressed');
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(type,release);
}
function editableTile(index){return Number.isInteger(index)&&index>=4&&index<draft.pattern.length-4;}
function draftSnapshot(){return structuredClone(draft);}
function storeDraft(){
 const key=dataKey();if(!key)return;
 try{localStorage.setItem(key,JSON.stringify({draft,dirty:draftDirty,undo:undoHistory.slice(-24),redo:redoHistory.slice(-24),tile:tileSelected}));}catch{}
 if($('dash-editor-save-state')&&draftDirty)$('dash-editor-save-state').textContent='✓ Autosaved on this device';
}
function restoreDraft(){
 const key=dataKey();if(!key||draftLoadedFor===user)return;
 draftLoadedFor=user;
 draft=defaultDraft();draftDirty=true;creatorTestOutcome='';tileSelected=4;editorPage=0;
 clipboard=null;undoHistory=[];redoHistory=[];
 try{
  const saved=JSON.parse(localStorage.getItem(key)||'null');
  if(!saved?.draft)return;
  createDashCourse(saved.draft.pattern,210,{layout:saved.draft.layout});
  draft=saved.draft;draftDirty=Boolean(saved.dirty);undoHistory=saved.undo||[];redoHistory=saved.redo||[];
  tileSelected=editableTile(saved.tile)?saved.tile:4;editorPage=Math.floor(tileSelected/EDITOR_SPAN);
 }catch{}
}
function scheduleDraft(){
 clearTimeout(autoTimer);autoTimer=setTimeout(storeDraft,210);
}
function markDirty(){draftDirty=true;creatorTestOutcome='';scheduleDraft();}
function saveUndo(){
 undoHistory.push(draftSnapshot());if(undoHistory.length>50)undoHistory.shift();
 redoHistory.length=0;markDirty();
}
function travelHistory(direction){
 const from=direction==='undo'?undoHistory:redoHistory,to=direction==='undo'?redoHistory:undoHistory;
 if(!from.length)return;
 to.push(draftSnapshot());const old=draft.id;draft=from.pop();draft.id=old;
 markDirty();renderBuilder();
}
function detailAt(index){
 const saved=draft.layout.find(item=>item[0]===index);
 return saved?[...saved.slice(1,5),saved[5]??'.',saved[6]??'.']:[0,2,0,0,'.','.'];
}
function tokenAt(index,layer=editLayer){
 const detail=detailAt(index);
 return layer==='above'?detail[4]:layer==='cue'?detail[5]:draft.pattern[index];
}
function setDetail(index,value){
 draft.layout=draft.layout.filter(item=>item[0]!==index);
 const hasLayers=value[4]!=='.'||value[5]!=='.';
 if(hasLayers||value.slice(0,4).some((n,i)=>n!==[0,2,0,0][i]))
  draft.layout.push([index,...(hasLayers?value:value.slice(0,4))]);
 draft.layout.sort((a,b)=>a[0]-b[0]);
}
function writeTile(index,newToken,detail=detailAt(index)){
 const pattern=draft.pattern,object=dashCanTransform(newToken)?[...detail]:[0,2,0,...detail.slice(3)];
 if(!dashCanRotate(newToken))object[2]=0;
 draft.pattern=pattern.slice(0,index)+newToken+pattern.slice(index+1);setDetail(index,object);
}
function editTile(index,newBrush){
 const i=Number(index);if(!editableTile(i))return;
 tileSelected=i;editorPage=Math.floor(i/EDITOR_SPAN);
 const previous=tokenAt(i);
 if(newBrush!==null&&previous!==newBrush){
  saveUndo();
  if(editLayer==='track')writeTile(i,newBrush);
  else{
   const detail=detailAt(i);detail[editLayer==='above'?4:5]=newBrush;setDetail(i,detail);
  }
 }
 else scheduleDraft();
 renderBuilder();
}
function useSelection(action){
 if(!editableTile(tileSelected))return;
 if(action==='copy'){
  clipboard={token:draft.pattern[tileSelected],detail:detailAt(tileSelected)};
  setStatus('Tile '+(tileSelected+1)+' copied. Select a destination and Paste.');return;
 }
 if(action==='paste'&&!clipboard)return;
 saveUndo();
 if(action==='paste')writeTile(tileSelected,clipboard.token,clipboard.detail);
 if(action==='erase')writeTile(tileSelected,'.',[0,2,0,0,'.','.']);
 renderBuilder();
}
function moveTile(source,target){
 if(!editableTile(source)||!editableTile(target)||source===target||tokenAt(source)==='.')return;
 saveUndo();
 const from=detailAt(source),to=detailAt(target);
 if(editLayer==='track'){
  const token=draft.pattern[source],destination=draft.pattern[target];
  // Keep object lane, size, facing and scenery together during drag.
  // Above/Cue layers intentionally remain associated with track positions.
  writeTile(target,token,[...from.slice(0,4),...to.slice(4)]);
  writeTile(source,destination,[...to.slice(0,4),...from.slice(4)]);
 }else{
  const layer=editLayer==='above'?4:5;
  [from[layer],to[layer]]=[to[layer],from[layer]];
  setDetail(source,from);setDetail(target,to);
 }
 tileSelected=target;editorPage=Math.floor(target/EDITOR_SPAN);renderBuilder();
}
function paintPalette(){
 const section=$('dash-palette');if(!section)return;
 for(const button of root.querySelectorAll('[data-dash-group]'))
  button.setAttribute('aria-pressed',String(button.dataset.dashGroup===paintGroup));
 const base=PAINT_GROUPS.find(([name])=>name===paintGroup)?.[1]||[];
 const tools=editLayer==='track'?base:PAINTS.filter(([key])=>
  (editLayer==='above'?DASH_OVERHEAD+'.':DASH_CUES+'.').includes(key));
 const group=editLayer+':'+paintGroup;
 if(section.dataset.group===group)return;
 section.dataset.group=group;
 section.innerHTML=tools.map(([key,label])=>'<button draggable="true" type="button" data-dash-brush="'+key+
  '" style="--brush:'+PAINT_COLORS[key]+'"><span aria-hidden="true">'+PAINT_GLYPHS[key]+'</span>'+label+'</button>').join('');
}
const num=n=>Number(n||0).toLocaleString('en-US');
const niceMs=ms=>(Math.max(0,Number(ms||0))/1000).toFixed(1)+'s';
const profile=()=>state?.mine||{clears:0,player_points:0,designer_points:0,published:0};
const levels=()=>state?.levels||[];
const personal=id=>(state?.progress||[]).find(p=>Number(p.level_id)===Number(id));
const me=()=>state?.user_id||user;
const campaign=()=>levels().filter(l=>l.kind==='campaign').sort((a,b)=>a.stage-b.stage);
const chapter=()=>Math.max(1,Math.min(1000000000,Number(state?.campaign_current||1)));
function unlocked(l){return l.kind!=='campaign'||l.stage<=chapter()||l.stage===1;}
function setStatus(text,error=false){const el=$('dash-status');if(el){el.textContent=String(text);el.dataset.error=String(error);}}
function bestText(l){const mine=personal(l.id);return mine?'Best '+niceMs(mine.best_ms):'Not cleared';}
function selected(){return levels().find(l=>Number(l.id)===Number(run?.level_id));}
function renderMenu(){
 const p=profile();const el=$('dash-head-stats');
 if(el)el.innerHTML='<span>Campaign & community <b>'+num(p.player_points)+'</b></span>'+
  '<span>Creator time awards <b>'+num(p.designer_points)+'</b></span>'+
  '<span>Verified clears <b>'+num(p.clears)+'</b></span>';
 const headline=$('dash-forge-summary');if(headline)headline.textContent=
  'Stage '+num(chapter())+' / 1,000,000,000 · '+
  num(p.player_points)+' runner pts · '+num(p.designer_points)+' maker pts';
}
function listLevel(l){
 const owner=l.creator&&l.creator===me(),isDraft=l.kind==='member'&&!l.published;
 const plan=l.kind==='campaign'?dashCampaignPlan(l.stage,l.pattern.length,l.boss,l.boss_style):null;
 const modules=plan?.sections.map(section=>section.label).filter((value,i,list)=>list.indexOf(value)===i).slice(0,3)||[];
 const lock=!unlocked(l),badge=l.designer_award?'<span class="dash-reward">♛ '+esc(l.designer_award)+'</span>':'';
 return '<article class="dash-level" data-level-id="'+Number(l.id)+'">'+
  '<div class="dash-level-number">'+(l.kind==='campaign'?(l.boss?'♛':l.stage>999?'∞':num(l.stage)):(isDraft?'D':'★'))+'</div>'+
  '<div class="dash-level-copy"><strong>'+esc(l.title)+'</strong>'+
  '<small>'+esc(l.kind==='campaign'?(l.world||'Origin Circuit')+' · Chapter '+num(l.stage)+' · '+l.pattern.length+' tiles · '+Math.round(1000/Number(l.pace_ms||210)*10)/10+' tiles/s':
   (owner?'Your level':('By '+l.creator_name))+' · '+l.pattern.length+' tiles')+
  ' · Difficulty '+l.difficulty+'</small>'+(l.boss?'<span class="dash-draft-tag">♛ '+esc(l.boss_name||'BOSS ARENA')+' · 3 PHASES</span>':'')+(l.stage===chapter()?'<span class="dash-current-tag">YOUR CURRENT STAGE</span>':'')+
  (modules.length?'<small class="dash-stage-modules">'+esc(modules.join(' · '))+'</small>':'')+
  '<small>'+esc(bestText(l))+' · '+num(l.verified_solves)+' member solves</small>'+badge+
  (isDraft?'<span class="dash-draft-tag">DRAFT · BEAT IT TO PUBLISH</span>':'')+
  '</div><div class="dash-level-actions">'+
  '<button type="button" data-dash-play="'+l.id+'" '+(lock?'disabled':'')+'>'+
   (lock?'LOCKED':isDraft?'PLAYTEST':'PLAY')+'</button>'+
   (owner&&isDraft?'<button type="button" data-dash-edit="'+l.id+'">EDIT</button>'+
    '<button type="button" data-dash-publish="'+l.id+'">PUBLISH</button>':'')+
  '</div></article>';
}
function renderLists(){
 const cp=$('dash-campaign-list'),co=$('dash-community-list');
 if(cp)cp.innerHTML=campaign().map(listLevel).join('')||'<p>Loading the family campaign…</p>';
 if(co){const ls=levels().filter(l=>l.kind==='member').sort((a,b)=>Number(b.id)-Number(a.id));
  co.innerHTML=ls.map(listLevel).join('')||'<p>First level is waiting to be designed. Open the Level Studio!</p>';}
}
function renderAwards(){
 const p=profile();const unlockCount=Number(p.clears||0);
 const box=$('dash-awards-list');if(!box)return;
 const tiers=THEMES.map(([key,paint,required])=>'<button type="button" class="dash-theme" data-dash-theme="'+key+'" '+
   (unlockCount<required?'disabled':'')+' aria-pressed="'+(theme===key)+'">'+
  '<span style="background:'+paint+'"></span><strong>'+key.toUpperCase()+'</strong>'+
  '<small>'+(required?'Unlock at '+required+' clears':'Starter')+'</small></button>').join('');
 box.innerHTML='<h3>Unlockable cube colors</h3><div class="dash-themes">'+tiers+'</div>'+
  '<h3>Earned family achievements</h3>'+
  ((state?.awards||[]).map(a=>'<div class="dash-earned"><strong>'+esc(a.badge)+'</strong><span>'+
   (a.type==='designer'?'DESIGNER · FIRST VERIFIED SOLVE':'RUNNER · VERIFIED CLEAR')+
   ' · '+num(a.points)+' pts'+(a.solve_ms?' · '+niceMs(a.solve_ms):'')+'</span></div>').join('')||
   '<p>Beat a campaign stage to win your first achievement. Builder medals only unlock after someone else solves your published level.</p>')+
  '<p class="dash-note">Designer awards use the first other member’s verified active solve time, including up to 12 validated attempts. Uploads, likes and plays never earn designer points.</p>';
}
function renderLeaders(){
 const el=$('dash-leaders-list');if(!el)return;
 const rows=state?.leaders||[];
 el.innerHTML=rows.length?rows.map((r,i)=>'<div class="dash-leader"><span>#'+(i+1)+'</span><strong>'+
  esc(r.name||'Member')+(r.user_id===me()?' (you)':'')+'</strong>'+
  '<span>'+num(r.player_points)+' runner</span><span>'+num(r.designer_points)+' maker</span>'+
  '<small>'+num(r.clears)+' clears · '+num(r.published)+' levels</small></div>').join(''):
  '<p>Complete the first campaign level to start the family leaderboard.</p>';
}
function renderBuilder(){
 const grid=$('dash-editor-grid');if(!grid)return;
 for(const item of root.querySelectorAll('[data-dash-layer]'))
  item.setAttribute('aria-pressed',String(item.dataset.dashLayer===editLayer));
 $('dash-tool-groups').hidden=editLayer!=='track';
 const title=$('dash-title'),diff=$('dash-difficulty'),length=$('dash-length');
 const world=$('dash-world'),boss=$('dash-boss-style'),song=$('dash-song');
 if(song)song.value=draft.song||'pulse';
 if(world)world.value=draft.world||'Maker Studio';
 if(boss)boss.value=draft.bossStyle||'none';
 if($('dash-phase-guide'))$('dash-phase-guide').hidden=draft.bossStyle==='none';
 if(document.activeElement!==title)title.value=draft.title;
 if(document.activeElement!==diff)diff.value=String(draft.difficulty);
 length.value=String(draft.pattern.length);
 const pages=Math.ceil(draft.pattern.length/EDITOR_SPAN);
 editorPage=Math.max(0,Math.min(pages-1,editorPage));
 const first=editorPage*EDITOR_SPAN,end=Math.min(first+EDITOR_SPAN,draft.pattern.length);
 grid.style.setProperty('--dash-cols','12');
 grid.innerHTML=[...draft.pattern.slice(first,end)].map((cell,j)=>{
  const i=first+j,fixed=i<4||i>=draft.pattern.length-4;
  cell=tokenAt(i);
  const label=PAINTS.find(([key])=>key===cell)?.[1]||'Hazard';
  const type=label.toLowerCase().replace(/[^a-z]+/g,'-');
  return '<button type="button" draggable="'+(!fixed&&cell!=='.')+'" class="dash-cell type-'+type+
   (tileSelected===i?' tile-selected':'')+
   '" data-dash-cell="'+i+'" '+(fixed?'disabled':'')+
   ' aria-pressed="'+(tileSelected===i)+'" aria-label="Tile '+(i+1)+', '+(cell==='.'?'safe empty':label.toLowerCase())+(fixed?', locked start or finish':'')+
   '" title="Tile '+(i+1)+' · '+esc(label)+'"><small>'+String(i+1).padStart(2,'0')+'</small><strong>'+
   PAINT_GLYPHS[cell]+'</strong></button>';
 }).join('');
 const count=[...draft.pattern].reduce((n,_,i)=>n+Number(tokenAt(i)!=='.'),0);
 const range=$('dash-editor-range');if(range)range.textContent='TILES '+(first+1)+'–'+end+' OF '+draft.pattern.length+' · '+count+' objects';
 const badge=$('dash-editor-save-state');if(badge)badge.textContent=draftDirty?'Autosaving on this device…':'✓ Saved to family account';
 const detail=detailAt(tileSelected);
 for(const [id,i] of [['dash-tile-lane',0],['dash-tile-scale',1],['dash-tile-flip',2],['dash-tile-decor',3]]){
  const control=$(id);if(!control)continue;
  control.value=String(detail[i]);control.disabled=i!==3&&(editLayer!=='track'||(i===2?!dashCanRotate(tokenAt(tileSelected)):!dashCanTransform(tokenAt(tileSelected))));
 }
 const selectedTile=$('dash-selected-tile');
 if(selectedTile)selectedTile.textContent='Tile '+(tileSelected+1)+' · '+(PAINTS.find(([key])=>key===tokenAt(tileSelected))?.[1]||'Clear');
 const selectToggle=$('dash-selection-mode');
 if(selectToggle){selectToggle.setAttribute('aria-pressed',String(pickTool==='select'));selectToggle.textContent=pickTool==='select'?'Selecting tiles':'Select a tile';}
 const zoomLabel=$('dash-zoom-label');if(zoomLabel)zoomLabel.textContent=zoom===1?'Fit section':'200%';
 paintPalette();
 const brushInfo=$('dash-brush-info');if(brushInfo)brushInfo.textContent='Selected: '+(PAINTS.find(([key])=>key===brush)?.[1]||'Clear')+
  (pickTool==='select'?' · Tap a tile to select and inspect it.':' · Tap a tile or drag the tool onto the grid.');
 const pageButtons=$('dash-page-buttons');
 if(pageButtons)pageButtons.innerHTML=Array.from({length:pages},(_,i)=>{
  const start=i*EDITOR_SPAN+1,stop=Math.min(draft.pattern.length,(i+1)*EDITOR_SPAN);
  return '<button type="button" data-dash-page="'+i+'" aria-current="'+(i===editorPage?'page':'false')+
   '">'+start+'–'+stop+'</button>';
 }).join('');
 const overview=$('dash-editor-overview');
 if(overview)overview.innerHTML=[...draft.pattern].map((_,i)=>{
  const cell=tokenAt(i);
  const color=PAINT_COLORS[cell]||'#eee';
  return '<span class="dash-overview-tile'+(i>=first&&i<end?' in-view':'')+
   '" style="--dash-overview-color:'+color+'" title="Tile '+(i+1)+': '+
   esc(PAINTS.find(([key])=>key===cell)?.[1]||'Unknown')+'"></span>';
 }).join('');
 if($('dash-editor-prev'))$('dash-editor-prev').disabled=editorPage===0;
 if($('dash-editor-next'))$('dash-editor-next').disabled=editorPage>=pages-1;
 if($('dash-undo'))$('dash-undo').disabled=!undoHistory.length;
 if($('dash-redo'))$('dash-redo').disabled=!redoHistory.length;
 const helper=$('dash-builder-help');if(helper)helper.textContent=
  (draft.id?'Your editable draft #'+draft.id:'New unsaved level')+' · '+draft.world+
  ' · '+(draft.bossStyle==='none'?'standard course':'three-phase boss arena')+
  '. '+(creatorTestOutcome||'Choose a tile, see the real game view above, then press Save & Playtest. Beat this version before publishing.');
 const brushes=root?.querySelectorAll('[data-dash-brush]')||[];
 brushes.forEach(b=>{
  b.setAttribute('aria-pressed',String(b.dataset.dashBrush===brush));
  const key=b.dataset.dashBrush,bName=PAINTS.find(([ch])=>ch===key)?.[1]||key;
  b.setAttribute('aria-label','Paint '+bName);
  b.title='Paint '+bName;
 });
 renderCreatorPreview();
}
function previewWindow(){
 const span=EDITOR_SPAN/zoom,base=editorPage*EDITOR_SPAN;
 const start=zoom===1?base:Math.max(base,Math.min(base+EDITOR_SPAN-span,zoomStart??tileSelected-5));
 return {start,span,size:TILE*zoom};
}
function renderCreatorPreview(){
 const canvas=$('dash-creator-preview');if(!canvas)return;
 const g=canvas.getContext('2d');if(!g)return;
 const {start,span,size}=previewWindow(),cam=start*size,ground=284;
 canvas.dataset.startTile=String(start);canvas.dataset.visibleTiles=String(span);
 const preview={pattern:draft.pattern,world:draft.world,elapsed:0,stage:null,
  boss:draft.bossStyle!=='none',bossStyle:draft.bossStyle,
  bossName:BOSS_FORMS.find(([id])=>id===draft.bossStyle)?.[1]||'CUSTOM GUARDIAN'};
 const course=createDashCourse(draft.pattern,210,{boss:preview.boss,bossStyle:preview.bossStyle,layout:draft.layout});
 backdrop(g,cam,ground,preview);
 if(preview.boss)drawBoss(g,start+Math.min(5,span-1),0,preview);
 for(let i=start;i<Math.min(draft.pattern.length,start+span);i++){
  const x=(i-start)*size;
  g.fillStyle=i%2?'#17123635':'#0e123260';g.fillRect(x,45,size,ground-45);
  for(const object of dashObjects(course.cells[i]))
   drawDashObject(g,course,object,cam,ground,size,0,{selected:i===tileSelected,verticalScale:TILE});
  g.fillStyle='#ffffffdf';g.font='bold '+(zoom===1?14:19)+'px system-ui';
  g.fillText(String(i+1),x+5,ground+23);
 }
 g.fillStyle='#11162fe8';g.fillRect(0,0,W,42);
 g.fillStyle='#fff';g.font='bold 20px system-ui';
 g.fillText(draft.world.toUpperCase()+' · TILE '+(start+1)+'–'+Math.min(start+span,draft.pattern.length),13,29);
}
function renderAll(){renderMenu();renderLists();renderAwards();renderLeaders();renderBuilder();}
function choosePane(next){
 if(run&&next==='builder'){setStatus('Finish this run before editing.');return;}
 scene=next;
 for(const [id] of TABS){
  const pane=$('dash-pane-'+id);if(pane)pane.hidden=id!==scene;
  const btn=root?.querySelector('[data-dash-tab="'+id+'"]');
  if(btn)btn.setAttribute('aria-current',id===scene?'page':'false');
 }
 if(next==='campaign'||next==='community')renderLists();
 if(next==='awards')renderAwards();if(next==='leaders')renderLeaders();
 if(next==='builder')renderBuilder();
}
function build(){
 if(!board||board.hidden||!user||!cfg?.enabled)return;
 if(root?.isConnected)return;
 const main=board.querySelector('.community-main');if(!main)return;
 root=document.createElement('section');root.id='dash-forge-root';root.className='mahjong-game dash-forge';
 root.innerHTML='<button type="button" id="dash-forge-toggle" class="mahjong-entry-button" aria-expanded="false" aria-controls="dash-forge-inside">'+
 '<span class="mahjong-entry-icon" aria-hidden="true">◆</span><span class="mahjong-entry-copy"><strong>Elliot’s Dash Forge</strong>'+
 '<small id="dash-forge-summary">Tablet racer · Family levels, achievements & builder awards</small></span>'+
 '<span class="mahjong-chevron" aria-hidden="true">▾</span></button>'+
 '<div id="dash-forge-inside" hidden>'+
  '<header class="dash-top"><div><small>ELLIOT’S EDITION · ONE-TAP RHYTHM PLATFORMER</small><h2>◆ ELLIOT’S DASH FORGE</h2>'+
    '<p>Leap the spikes. Build your own levels. Earn verified family awards.</p></div>'+
    '<div id="dash-head-stats" class="dash-head-stats"></div></header>'+
  '<nav class="dash-tabs" aria-label="Dash Forge locations">'+TABS.map(([id,name])=>'<button data-dash-tab="'+id+
    '" type="button">'+name+'</button>').join('')+'</nav>'+
  '<section class="dash-pane" id="dash-pane-campaign"><div class="dash-pane-title"><h3>One-billion-stage family campaign</h3>'+
    '<p>Every member has the same sequential, procedurally generated challenge. Beat your current stage to reveal new chapters and worlds.</p></div>'+
    '<div class="dash-forever-counter">◆ ONE BILLION NUMBERED STAGES · 12 ROTATING WORLDS · A WORLD TRIAL EVERY 25 STAGES · NEW TRACKS APPEAR AS YOU ADVANCE ◆</div><div id="dash-campaign-list" class="dash-level-list"></div></section>'+
  '<section class="dash-pane" id="dash-pane-community" hidden><div class="dash-pane-title"><h3>Levels made by the family</h3>'+
    '<p>Creator awards pay only when another member genuinely beats the published level, scaled by active solve time.</p></div>'+
    '<div id="dash-community-list" class="dash-level-list"></div></section>'+
  '<section class="dash-pane" id="dash-pane-builder" hidden><div class="dash-pane-title"><h3>Level Studio</h3>'+
    '<p>Place objects on the numbered track. Save &amp; Playtest runs the same layout you see here.</p></div>'+
   '<div class="dash-builder-form"><label>Title<input id="dash-title" maxlength="58" pattern="[A-Za-z0-9 ]+" value="My First Dash"></label>'+
   '<label>Difficulty<select id="dash-difficulty">'+[1,2,3,4,5,6].map(n=>'<option value="'+n+'">'+n+'</option>').join('')+'</select></label>'+
   '<label>Tiles<select id="dash-length">'+EDIT_LENGTHS.map(n=>'<option value="'+n+'"'+(n===48?' selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
   '<label>World / Scenery<select id="dash-world">'+CREATOR_WORLDS.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('')+'</select></label>'+
   '<label>Song<select id="dash-song">'+Object.entries(DASH_SONGS).map(([key,item])=>'<option value="'+key+'">'+esc(item.title)+'</option>').join('')+'</select></label>'+
   '<label>Boss Arena<select id="dash-boss-style">'+BOSS_FORMS.map(([key,name])=>'<option value="'+key+'">'+esc(name)+'</option>').join('')+'</select></label></div>'+
   '<div class="dash-builder-preview"><div class="dash-preview-label"><strong>PLAYFIELD PREVIEW</strong><span id="dash-editor-save-state" aria-live="polite">● UNSAVED CHANGES</span></div><canvas id="dash-creator-preview" width="960" height="360" role="img" aria-label="Full-sized actual game view of currently selected track section with scenery, hazards and boss"></canvas>'+
   '<small id="dash-preview-explanation">Tap a tile in the preview or place objects on the grid.</small></div>'+
   '<div class="dash-builder-view"><button type="button" id="dash-selection-mode" data-dash-action="select" aria-pressed="false">Select a tile</button><button type="button" data-dash-action="zoom"><span id="dash-zoom-label">Fit section</span></button><button type="button" data-dash-action="practice">Practice from selected tile</button></div>'+
   '<div class="dash-section-tools"><label>Course section<select id="dash-blueprint"><option value="">Choose a section</option>'+
   DASH_SECTIONS.map(item=>'<option value="'+item.id+'">'+esc(item.label)+'</option>').join('')+'</select></label>'+
   '<button type="button" data-dash-action="blueprint">Insert at selected tile</button><button type="button" data-dash-action="song-preview">Preview song</button></div>'+
   '<div class="dash-layer-bar" role="group" aria-label="Edit layer"><button type="button" data-dash-layer="track" aria-pressed="true">Track</button>'+
   '<button type="button" data-dash-layer="above">Ceiling</button><button type="button" data-dash-layer="cue">Triggers</button></div>'+
   '<div class="dash-tool-groups" id="dash-tool-groups" role="group" aria-label="Tool palettes">'+PAINT_GROUPS.map(([name])=>'<button type="button" data-dash-group="'+name+'">'+name+'</button>').join('')+'</div>'+
   '<div class="dash-palette" id="dash-palette" role="group" aria-label="Level tile brushes"></div>'+
   '<p id="dash-brush-info" class="dash-brush-info" aria-live="polite"></p>'+ 
    '<div id="dash-phase-guide" class="dash-phase-guide" hidden aria-label="Three boss attack phases"><span>PHASE I · OPENING</span><span>PHASE II · ESCALATION</span><span>PHASE III · FINAL ATTACK</span></div>'+
   '<div class="dash-editor-tools"><h4>PLACE OBJECTS</h4><strong id="dash-editor-range">TILES 1–24 OF 48</strong></div><div class="dash-editor-utilities"><button type="button" id="dash-editor-prev" data-dash-action="page-prev">◀ Previous tiles</button><button type="button" id="dash-undo" data-dash-action="undo" disabled>↶ Undo</button><button type="button" id="dash-redo" data-dash-action="redo" disabled>↷ Redo</button><button type="button" id="dash-editor-next" data-dash-action="page-next">Next tiles ▶</button></div><div id="dash-page-buttons" class="dash-page-buttons" role="group" aria-label="Jump to another track section"></div><div id="dash-editor-grid" class="dash-editor-grid" role="group" aria-label="Tap a numbered tile to paint that obstacle; first and last four tiles are always safe"></div><div class="dash-editor-overview-wrap"><strong>WHOLE LEVEL AT A GLANCE</strong><div id="dash-editor-overview" class="dash-editor-overview" aria-label="Miniature map of all tiles; highlighted tiles are the selected section"></div></div>'+
   '<fieldset id="dash-inspector" class="dash-inspector"><legend id="dash-selected-tile">Selected tile</legend>'+
   '<label>Height<select id="dash-tile-lane"><option value="0">Floor</option><option value="1">Low air</option><option value="2">High air</option><option value="3">Ceiling</option></select></label>'+
   '<label>Size<select id="dash-tile-scale"><option value="1">Small</option><option value="2">Standard</option><option value="3">Large</option></select></label>'+
   '<label>Orientation<select id="dash-tile-flip"><option value="0">Default</option><option value="1">180°</option></select></label>'+
   '<label>Scenery layer<select id="dash-tile-decor"><option value="0">None</option><option value="1">Lantern</option><option value="2">Sky frame</option></select></label>'+
   '<div><button type="button" data-dash-action="copy">Copy</button><button type="button" data-dash-action="paste">Paste</button><button type="button" data-dash-action="erase">Delete</button></div></fieldset>'+
   '<p id="dash-builder-help" class="dash-note"></p><h4 class="dash-tools-label">SAVE AND SHARE</h4><div class="dash-builder-actions"><button type="button" data-dash-action="new">New draft</button>'+
   '<button type="button" data-dash-action="save">Save draft</button><button type="button" data-dash-action="test" class="dash-playtest-now">▶ SAVE &amp; PLAYTEST</button>'+
   '<button type="button" data-dash-action="publish">Publish solved level</button></div>'+
   '<p class="dash-note">A creator never earns a designer award for self-testing. The first other member’s server-validated time to victory determines its one-time design award.</p></section>'+
  '<section class="dash-pane" id="dash-pane-awards" hidden><div class="dash-pane-title"><h3>Trophies & unlockables</h3>'+
    '<p>Runner awards for verified victories; designer awards only for real member solve times.</p></div><div id="dash-awards-list"></div></section>'+
  '<section class="dash-pane" id="dash-pane-leaders" hidden><div class="dash-pane-title"><h3>Family champions</h3>'+
    '<p>Separate running and level-design leaderboards, all earned from verified server results.</p></div><div id="dash-leaders-list"></div></section>'+
  '<div id="dash-status" class="dash-status" role="status" aria-live="polite">Loading your family arcade…</div>'+
  '<div id="dash-play-overlay" class="dash-play-overlay" hidden>'+
    '<header class="dash-playing-head"><div><small>NOW PLAYING</small><strong id="dash-run-title">Loading…</strong></div>'+
      '<strong id="dash-live-progress">0%</strong><strong id="dash-attempt-count" aria-live="off">ATTEMPT 1</strong><button type="button" id="dash-sound" data-dash-action="sound" aria-pressed="false">♪ SOUND OFF</button><button type="button" id="dash-retry-live" data-dash-action="retry" hidden>Retry · R</button><button type="button" id="dash-practice-retry" data-dash-action="practice-retry" hidden>Checkpoint</button><button type="button" data-dash-action="leave">Leave track</button></header>'+
    '<div class="dash-canvas-wrap"><canvas id="dash-canvas" width="960" height="360" tabindex="0" role="img" aria-label="Running level. Tap or hold anywhere on the playfield; press Space or Up on a keyboard."></canvas>'+
     '<div class="dash-run-overlay" id="dash-run-message" hidden></div></div>'+
    '<footer class="dash-game-controls arcade-control-deck" aria-label="Dash Forge arcade controls">'+
    '<div class="arcade-control-info"><strong>ELLIOT’S EDITION · TAP THE GAME TO PLAY</strong><small id="dash-control-mode">Cube · auto-run</small><p id="dash-live-status">Tap anywhere in the level. Hold for flight. Space / ↑ on keyboard.</p></div>'+
    '<div class="arcade-action-cluster"><div class="arcade-key-station">'+
    '<button type="button" id="dash-jump" class="arcade-button-a" aria-label="Arcade A, jump" aria-describedby="dash-action-label"><span class="arcade-button-face">A</span><span class="arcade-button-symbol" aria-hidden="true">↗</span></button>'+
    '<span id="dash-action-label" class="arcade-button-caption">JUMP</span><small class="arcade-keyboard-hint">SPACE / ↑ · HOLD</small></div></div></footer>'+
  '</div></div>';
 const sibling=$('streetrod-root');
 if(sibling?.parentElement===main)sibling.after(root);else main.prepend(root);
 inside=$('dash-forge-inside');
 $('dash-forge-toggle').addEventListener('click',()=>{open=!open;inside.hidden=!open;
  $('dash-forge-toggle').setAttribute('aria-expanded',String(open));
  if(open){void refresh();choosePane(scene);}});
 root.addEventListener('click',onClick);
 dashTouchTargets=[];
 bindDashTouch($('dash-canvas'));
 bindDashTouch($('dash-jump'));
 $('dash-creator-preview').addEventListener('click',event=>{
  if(busy||run)return;
  editTile(previewTile(event.currentTarget,event.clientX),pickTool==='select'?null:brush);
 });
 root.addEventListener('dragstart',event=>{
  const tool=event.target.closest('[data-dash-brush]'),cell=event.target.closest('[data-dash-cell]');
  if(tool){drag={token:tool.dataset.dashBrush};event.dataTransfer.setData('text/plain',drag.token);}
  else if(cell&&editableTile(Number(cell.dataset.dashCell))){drag={tile:Number(cell.dataset.dashCell)};event.dataTransfer.setData('text/plain',String(drag.tile));}
 });
 root.addEventListener('dragover',event=>{if(drag&&event.target.closest('[data-dash-cell],#dash-creator-preview'))event.preventDefault();});
 root.addEventListener('drop',event=>{
  if(!drag)return;
  const cell=event.target.closest('[data-dash-cell]'),canvas=event.target.closest('#dash-creator-preview');
  if(!cell&&!canvas)return;
  event.preventDefault();
  let target=Number(cell?.dataset.dashCell);
  if(canvas)target=previewTile(canvas,event.clientX);
  if(drag.tile!==undefined)moveTile(drag.tile,target);else editTile(target,drag.token);
  drag=null;
 });
 root.addEventListener('dragend',()=>{drag=null;});
 for(const [id,i] of [['dash-tile-lane',0],['dash-tile-scale',1],['dash-tile-flip',2],['dash-tile-decor',3]]){
  $(id).addEventListener('change',event=>{
   if(!editableTile(tileSelected))return;
   const detail=detailAt(tileSelected);saveUndo();detail[i]=Number(event.target.value);
   setDetail(tileSelected,detail);renderBuilder();
  });
 }
 $('dash-jump').addEventListener('click',event=>{if(event.detail===0)jump();});
 for(const id of ['dash-title','dash-difficulty']){
  $(id).addEventListener('change',()=>{draft.title=$('dash-title').value.trim();draft.difficulty=Number($('dash-difficulty').value);markDirty();renderBuilder();});
 }
 for(const [id,field] of [['dash-world','world'],['dash-boss-style','bossStyle'],['dash-song','song']]){
  $(id).addEventListener('change',event=>{draft[field]=event.target.value;markDirty();renderBuilder();});
 }
 $('dash-length').addEventListener('change',e=>{
  const n=Number(e.target.value),a=[...draft.pattern];if(n!==a.length)saveUndo();draft.pattern=a.slice(0,n).join('').padEnd(n,'.');
  draft.pattern='....'+draft.pattern.slice(4,-4)+'....';
  draft.layout=draft.layout.filter(item=>editableTile(item[0]));
  if(!editableTile(tileSelected))tileSelected=4;
  renderBuilder();
 });
 try{const t=localStorage.getItem('dash-forge-theme');if(THEMES.some(row=>row[0]===t))theme=t;}catch{}
 restoreDraft();choosePane('campaign');
}
async function call(name,args={}){
 if(!client||!user)throw Error('Sign in to the Family Message Board first.');
 const {data,error}=await client.rpc(name,args);
 if(error)throw Error(error.message||'Family game server unavailable.');
 return data;
}
async function refresh(quiet=false){
 if(!root||board.hidden||!user)return;
 try{const owner=user;const data=await call('community_dash_state');
   if(owner!==user||board.hidden||!root?.isConnected)return;
   state=data;renderAll();
   window.dispatchEvent(new CustomEvent('family-arcade-game-rankings',{detail:{member:owner,game:'dashforge',
    entries:(data.leaders||[]).map((entry,index)=>({rank:index+1,name:entry.name,
      score:entry.player_points,mine:entry.user_id===owner}))}}));
   if(!quiet)setStatus('Family campaign and rewards loaded from the game server.');}
 catch(e){setStatus('Saved game unavailable: '+e.message,true);}
}
function previewTile(canvas,clientX){
 const rect=canvas.getBoundingClientRect(),{start,span}=previewWindow();
 const innerWidth=rect.width-2*canvas.clientLeft,innerHeight=rect.height-2*canvas.clientTop;
 const width=Math.min(innerWidth,innerHeight*canvas.width/canvas.height);
 if(width<=0)return -1;
 const left=rect.left+canvas.clientLeft+(innerWidth-width)/2;
 const x=(clientX-left)/width;
 return x>=0&&x<1?start+Math.floor(x*span):-1;
}
function insertSection(){
 const section=dashSection($('dash-blueprint').value);
 if(!section||!editableTile(tileSelected))return;
 const from=tileSelected,all=[...draft.pattern],lastLayer=draft.layout.at(-1)?.[0]??0;
 const last=Math.max(lastLayer,all.findLastIndex(token=>token!=='.'));
 const required=Math.max(draft.pattern.length,from+section.length+4,last>=from?last+section.length+5:0);
 const length=EDIT_LENGTHS.find(size=>size>=required);
 if(!length){setStatus('Choose an earlier tile or clear space to insert '+section.label+'.',true);return;}
 saveUndo();
 draft.pattern=(draft.pattern.slice(0,from)+'.'.repeat(section.length)+draft.pattern.slice(from)).slice(0,length).padEnd(length,'.');
 draft.layout=draft.layout.map(([tile,...settings])=>[tile>=from?tile+section.length:tile,...settings]).filter(item=>editableTile(item[0]));
 for(const [offset,token,above='.',cue='.',scale=2] of section.items)
  writeTile(from+offset,token,[0,scale,0,0,above,cue]);
 renderBuilder();
 setStatus(section.label+' inserted at tiles '+(from+1)+'–'+(from+section.length)+'.');
}
function onClick(event){
 const target=event.target.closest('[data-dash-layer],[data-dash-group],[data-dash-tab],[data-dash-play],[data-dash-edit],[data-dash-publish],[data-dash-action],[data-dash-brush],[data-dash-cell],[data-dash-page],[data-dash-theme]');
 if(!target||target.disabled||busy)return;
 const d=target.dataset;
 if(d.dashLayer){
  editLayer=d.dashLayer;pickTool='paint';brush=editLayer==='cue'?'C':'s';renderBuilder();return;
 }
 if(d.dashGroup){paintGroup=d.dashGroup;renderBuilder();return;}
 if(d.dashTab){choosePane(d.dashTab);return;}
 if(d.dashPlay){runFromBuilder=false;void startLevel(Number(d.dashPlay));return;}
 if(d.dashEdit){const l=levels().find(x=>Number(x.id)===Number(d.dashEdit));if(l){
   draft={id:l.id,title:l.title,difficulty:l.difficulty,pattern:l.pattern,
    world:l.world||'Maker Studio',bossStyle:l.boss_style||'none',layout:l.layout||[],song:l.soundtrack||'pulse'};
   tileSelected=4;editorPage=0;undoHistory=[];redoHistory=[];draftDirty=false;creatorTestOutcome='';storeDraft();choosePane('builder');}return;}
 if(d.dashPublish){void publishLevel(Number(d.dashPublish));return;}
 if(d.dashBrush!==undefined){brush=d.dashBrush;pickTool='paint';renderBuilder();return;}
 if(d.dashCell!==undefined){editTile(d.dashCell,pickTool==='select'?null:brush);return;}
 if(d.dashPage!==undefined){editorPage=Math.max(0,Math.min(Math.ceil(draft.pattern.length/EDITOR_SPAN)-1,Number(d.dashPage)||0));renderBuilder();return;}
 if(d.dashTheme){const t=THEMES.find(row=>row[0]===d.dashTheme);if(t&&profile().clears>=t[2]){
  theme=t[0];try{localStorage.setItem('dash-forge-theme',theme);}catch{}renderAwards();}return;}
 switch(d.dashAction){
  case 'new':draft=defaultDraft('My New Dash');tileSelected=4;editorPage=0;undoHistory=[];redoHistory=[];markDirty();renderBuilder();break;
  case 'select':pickTool=pickTool==='select'?'paint':'select';renderBuilder();break;
  case 'zoom':zoom=zoom===1?2:1;zoomStart=zoom===2?tileSelected-5:null;renderBuilder();break;
  case 'blueprint':insertSection();break;
  case 'song-preview':void previewSong();break;
  case 'copy':case 'paste':case 'erase':useSelection(d.dashAction);break;
  case 'practice':startPractice();break;
  case 'retry':void retryTrack();break;
  case 'practice-retry':startPractice(lastRun);break;
  case 'save':void saveDraft();break;
  case 'test':void playtestDraft();break;
   case 'page-prev':editorPage=Math.max(0,editorPage-1);renderBuilder();break;
   case 'page-next':editorPage=Math.min(Math.ceil(draft.pattern.length/EDITOR_SPAN)-1,editorPage+1);renderBuilder();break;
   case 'undo':travelHistory('undo');break;
   case 'redo':travelHistory('redo');break;
  case 'publish':if(!draft.id||draftDirty)setStatus('Save and successfully playtest this exact draft before publishing.',true);
    else void publishLevel(Number(draft.id));break;
  case 'sound':toggleSound();break;
  case 'leave':void leaveRun();break;
 }
}
async function saveDraft(){
 if(busy||run)return null;
 busy=true;setStatus('Saving your exact editable level so the playtest matches your changes…');
 try{
  draft.title=$('dash-title').value.trim();draft.difficulty=Number($('dash-difficulty').value);
  const saved=await call('community_dash_save_v3',{p_title:draft.title,p_difficulty:draft.difficulty,
   p_pattern:draft.pattern,p_level_id:draft.id,p_world:draft.world,p_boss_style:draft.bossStyle,p_layout:draft.layout,p_song:draft.song||'pulse'});
  draft.id=saved.id;draftDirty=false;storeDraft();
  await refresh(true);
  setStatus('Saved this exact version. Playtest it before publishing.');renderBuilder();
  return saved.id;
 }catch(e){setStatus('Save failed: '+e.message,true);return null;}finally{busy=false;}
}
async function playtestDraft(){
 if(busy||run)return;
 const id=draftDirty||!draft.id?await saveDraft():draft.id;if(!id)return;
 runFromBuilder=true;
 await startLevel(Number(id));
 if(!run)runFromBuilder=false;
}
async function publishLevel(id){
 if(busy||run)return;busy=true;setStatus('Checking your verified playtest…');
 try{const data=await call('community_dash_publish',{p_level_id:id});
  await refresh(true);setStatus(data.status==='published'?'Published to the family level list. No maker award until another member beats it.':'Publication pending.');
  choosePane('community');
 }catch(e){setStatus(e.message,true);}finally{busy=false;}
}

function toggleSound(){
 soundOn=!soundOn;
 try{localStorage.setItem('dash-forge-audio',soundOn?'on':'off');}catch{}
 const button=$('dash-sound');if(button){button.textContent=soundOn?'♫ SOUND ON':'♪ SOUND OFF';button.setAttribute('aria-pressed',String(soundOn));}
 if(soundOn){
  try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();
   if(audioContext.state==='suspended')void audioContext.resume();}catch{soundOn=false;if(button)button.textContent='♪ SOUND OFF';}
 }else if(audioContext?.state==='running')void audioContext.suspend();
}
async function previewSong(){
 try{
  audioContext??=new (window.AudioContext||window.webkitAudioContext)();
  await audioContext.resume();
  const at=audioContext.currentTime+.04,key=draft.song||'pulse';
  for(let i=0;i<8;i++)playDashNote(audioContext,key,i,at+i*.28,.28);
  setStatus('Playing '+DASH_SONGS[key].title+'.');
 }catch{setStatus('Audio preview is unavailable on this device.',true);}
}
function originalBeat(){
 if(!soundOn||!run||!audioContext||audioContext.state!=='running')return;
 const beat=Math.floor(dashBeatAt(run.physics));
 if(beat===lastBeat)return;
 lastBeat=beat;
 playDashNote(audioContext,run.song||'pulse',beat,audioContext.currentTime,run.pace*2/1000);
}
function jump(){
 if(soundOn&&audioContext?.state==='suspended')void audioContext.resume();
 if(run&&!run.finishing)inputTapped=true;
}
function palette(){
 const t=THEMES.find(row=>row[0]===theme);
 return t&&Number(profile().clears)>=t[2]?t[1]:'#ffd363';
}

const WORLDS={
 'Origin Circuit':['#0b1130','#302553','#6ee9fb','city'],
 'Neon Canopy':['#071f29','#174c45','#71ffd0','jungle'],
 'Clockwork Harbor':['#291c35','#775050','#ffce84','clock'],
 'Crystal Hollow':['#180d37','#493b80','#a5c7ff','crystal'],
 'Skyglass City':['#0e1e4a','#2874a8','#86eeff','city'],
 'Solar Dunes':['#3e1631','#ba5f52','#fff0ac','mountain'],
 'Thunder Rails':['#07112b','#314b85','#8eeaff','storm'],
 'Abyssal Reef':['#041e31','#157f9c','#80ffed','sea'],
 'Volcanic Foundry':['#260d1b','#8c292e','#ffbe5c','mountain'],
 'Pixel Metropolis':['#17143f','#663e97','#ffc0f2','city'],
 'Moonlit Gardens':['#110d31','#52416d','#e3c8ff','jungle'],
 'Starfall Observatory':['#050c25','#17376b','#e7f9ff','stars'],
 'Endless Aurora':['#07252d','#165450','#d1ffab','aurora'],
 'Maker Studio':['#1f183a','#44377d','#ffdcaa','city']
};
function backdrop(g,cam,ground,data=run){
 const [top,bot,accent,kind]=WORLDS[data.world]||WORLDS['Maker Studio'];
 const t=data.elapsed/1000,seed=Number(data.stage||1),par=cam*.14;
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,top);sky.addColorStop(1,bot);
 g.fillStyle=sky;g.fillRect(0,0,W,H);
 for(let i=0;i<46;i++){
  const x=(i*187+seed*29)%W,y=(i*71+seed*13)%235;
  g.globalAlpha=.1+.4*Math.max(0,Math.sin(t*2+i*7));
  g.fillStyle=accent;g.fillRect(x,y,i%7?2:4,i%7?2:4);
 }
 g.globalAlpha=.23;g.fillStyle=accent;g.strokeStyle=accent;
 for(let i=-1;i<13;i++){
  const x=i*103-(par%103),h=50+((i*39+seed*13)%110);
  if(['city','clock'].includes(kind)){
   g.fillRect(x,ground-h,74,h);
   if(kind==='clock'){g.beginPath();g.arc(x+37,ground-h-10,29,0,Math.PI*2);g.lineWidth=7;g.stroke();}
   else {g.fillStyle=bot;for(let z=15;z<h-10;z+=20)g.fillRect(x+17,ground-h+z,9,8);g.fillStyle=accent;}
  }else if(['jungle','sea'].includes(kind)){
   g.beginPath();g.ellipse(x+42,ground-105,h*.43,65,0,0,Math.PI*2);g.fill();
   g.fillRect(x+35,ground-105,14,105);
  }else if(kind==='crystal'){
   g.beginPath();g.moveTo(x,ground);g.lineTo(x+46,ground-h-34);g.lineTo(x+95,ground);g.fill();
  }else if(kind==='mountain'){
   g.beginPath();g.moveTo(x,ground);g.lineTo(x+50,ground-h-70);g.lineTo(x+110,ground);g.fill();
  }else if(kind==='aurora'){
   g.lineWidth=13;g.beginPath();g.moveTo(x,0);g.quadraticCurveTo(x+120,125,x,ground);g.stroke();
  }else if(kind==='storm'){
   g.lineWidth=4;g.beginPath();g.moveTo(x+50,0);g.lineTo(x+34,60);g.lineTo(x+68,81);g.lineTo(x+18,180);g.stroke();
  }else{
   g.beginPath();g.arc(x+40,ground-80,2+i%4,0,Math.PI*2);g.fill();
  }
 }
 g.globalAlpha=1;g.fillStyle=top;g.fillRect(0,ground,W,H-ground);
 g.strokeStyle=accent;g.lineWidth=4;g.globalAlpha=.55;
 g.beginPath();g.moveTo(0,ground);g.lineTo(W,ground);g.stroke();
 g.lineWidth=1;for(let x=-(cam%TILE);x<W;x+=TILE){
  g.beginPath();g.moveTo(x,ground+2);g.lineTo(x+12,H);g.stroke();
 }
 g.globalAlpha=1;
 return accent;
}
const BOSS_COLORS={
 canopy:'#81ffaf',clockwork:'#ffcd78',crystal:'#a7d8ff',
 skyglass:'#80f0ff',solar:'#ffd17e',thunder:'#76caff',
 reef:'#69ffeb',volcanic:'#ff9866',pixel:'#ef8fff',
 garden:'#ffa5de',starfall:'#ffffff',aurora:'#baff9c'
};
function drawBoss(g,pos,t,data=run){
 if(!data?.boss)return;
 const style=data.bossStyle||'canopy',color=BOSS_COLORS[style]||'#ffdc8a';
 const phase=Math.min(3,Math.floor(pos/data.pattern.length*3)+1);
 const x=835+Math.sin(t*1.5)*9,y=112+Math.sin(t*2+phase)*6;
 const strength=Math.max(0,1-pos/data.pattern.length);
 // The target's stability bar is synchronized to actual level progress.
 g.save();g.globalAlpha=.95;
 g.fillStyle='#0a0d24';g.fillRect(608,46,330,33);
 g.strokeStyle=color;g.lineWidth=2;g.strokeRect(608,46,330,33);
 g.fillStyle=color;g.fillRect(615,67,316*strength,6);
 g.fillStyle='#fff';g.font='bold 15px monospace';
 g.fillText((data.bossName||'WORLD GUARDIAN').toUpperCase().slice(0,28),617,62);
 g.font='bold 12px monospace';g.fillText('PHASE '+phase+' / 3',810,62);
 // Attack telegraph is cosmetic. Its target is a real hazard tile from the
 // canonical saved track, never a client-only invisible trap.
 let next=-1;
 for(let i=Math.floor(pos)+1;i<Math.min(data.pattern.length,Math.floor(pos)+16);i++){
  const token=data.physics?.course.cells[i]?.token||data.pattern[i];
  if('sbglwcpfrmodh'.includes(token)){next=i;break;}
 }
 if(next>=0){
  const camera=Math.max(0,pos*TILE-5*TILE);
  const hazardX=next*TILE-camera+20;
  if(hazardX>=80&&hazardX<=760){
   g.strokeStyle=color;g.globalAlpha=.23+.11*Math.sin(t*7);
   g.lineWidth=3;g.beginPath();g.moveTo(x-25,y+20);
   g.quadraticCurveTo((x+hazardX)/2,y-65,hazardX,235);g.stroke();
   g.globalAlpha=.95;
  }
 }
 // Every archetype has a separate silhouette. Stages in a later rotation
 // retain their style but receive different deterministic attack sequences.
 g.translate(x,y);g.rotate(Math.sin(t*1.8)*.055);
 g.shadowColor=color;g.shadowBlur=27;g.fillStyle=color;
 if(['canopy','garden'].includes(style)){
  for(let i=0;i<10;i++){const a=i*Math.PI/5+t*.09;
   g.beginPath();g.ellipse(Math.cos(a)*53,Math.sin(a)*53,24,11,a,0,Math.PI*2);g.fill();}
 }else if(['clockwork','pixel'].includes(style)){
  for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.14;g.save();g.rotate(a);
   g.fillRect(39,-9,29,18);g.restore();}
 }else if(['solar','reef'].includes(style)){
  for(let i=0;i<7;i++){let a=i*Math.PI*2/7+t*.13;
   g.lineWidth=11;g.strokeStyle=color;g.beginPath();g.moveTo(Math.cos(a)*23,Math.sin(a)*23);
   g.quadraticCurveTo(Math.cos(a+.7)*88,Math.sin(a+.7)*77,Math.cos(a)*81,Math.sin(a)*72);g.stroke();}
 }else if(['thunder','skyglass'].includes(style)){
  for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.1;g.save();g.rotate(a);
   g.beginPath();g.moveTo(19,0);g.lineTo(78,-19);g.lineTo(61,17);g.closePath();g.fill();g.restore();}
 }else if(['crystal','volcanic'].includes(style)){
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9+t*.12;g.save();g.rotate(a);
   g.beginPath();g.moveTo(19,0);g.lineTo(58,-16);g.lineTo(88,0);g.lineTo(58,16);g.closePath();g.fill();g.restore();}
 }else{
  for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.1;g.save();g.rotate(a);
   g.beginPath();g.arc(61,0,11,0,Math.PI*2);g.fill();g.restore();}
 }
 g.shadowBlur=15;g.fillStyle='#121b38';g.beginPath();g.arc(0,0,43,0,Math.PI*2);g.fill();
 g.lineWidth=5;g.strokeStyle=color;g.beginPath();g.arc(0,0,43,0,Math.PI*2);g.stroke();
 if(['crystal','aurora','starfall'].includes(style)){
  g.fillStyle=color;g.beginPath();g.moveTo(0,-33);g.lineTo(27,0);g.lineTo(0,33);g.lineTo(-27,0);g.closePath();g.fill();
  g.fillStyle='#0c1838';g.fillRect(-12,-2,24,6);
 }else if(['pixel','clockwork'].includes(style)){
  g.fillStyle=color;g.fillRect(-29,-24,58,48);g.fillStyle='#142040';
  g.fillRect(-18,-13,13,10);g.fillRect(6,-13,13,10);g.fillRect(-12,9,24,5);
 }else{
  g.fillStyle=color;g.beginPath();g.arc(-13,-5,8,0,Math.PI*2);g.arc(13,-5,8,0,Math.PI*2);g.fill();
  g.strokeStyle=color;g.lineWidth=5;g.beginPath();g.arc(0,7,17,.16*Math.PI,.82*Math.PI);g.stroke();
 }
 g.restore();
}
const MODE_HELP={C:'Tap or hold to jump.',S:'Hold to climb. Release to descend.',B:'Tap on the floor or ceiling to reverse gravity.',
 U:'Tap for each flap.',W:'Hold to climb diagonally. Release to dive. Stay clear of the floor and ceiling.',
 R:'Tap for a short jump. Hold for a higher leap.',P:'Tap on a surface to jump instantly to the opposite side.',
 V:'Tap to reverse gravity in midair.'};
function draw(){
 if(!run)return;
 const canvas=$('dash-canvas'),g=canvas?.getContext('2d');if(!g)return;
 const r=run.physics,pos=Math.min(run.pattern.length,r.x),cam=Math.max(0,pos*TILE-5*TILE);
 const ground=284,baseAccent=backdrop(g,cam,ground),t=r.elapsed;
 const accent=['', '#ffbd89','#6ff9db','#cdacff'][r.lightCue]||baseAccent;
 if(r.lightCue){
  const tint=g.createLinearGradient(0,0,0,ground);
  tint.addColorStop(0,accent+'50');tint.addColorStop(1,accent+'00');
  g.fillStyle=tint;g.fillRect(0,0,W,ground);
 }
 const ceiling=ground-DASH_CEILING*TILE;
 g.strokeStyle=accent+'66';g.lineWidth=2;g.strokeRect(0,ceiling,W,2);
 drawBoss(g,pos,t);
 for(let i=Math.max(0,Math.floor(cam/TILE)-1);i<Math.min(run.pattern.length,Math.ceil((cam+W)/TILE)+1);i++){
  const cell=r.course.cells[i];
  for(const object of dashObjects(cell))
   drawDashObject(g,r.course,object,cam,ground,TILE,t,{disabled:!dashGateActive(r,object)||r.used.has(i)});
 }
 const x=pos*TILE-cam,y=ground-r.y*TILE;
 const rotates=['S','W','U','V'].includes(r.mode)?Math.max(-.43,Math.min(.43,-r.vy*.054)):
  (r.supported?0:r.x*1.65);
 if(!r.done||r.won)drawDashPlayer(g,r.mode,x,y,palette(),rotates,r.gravity);
 else{
  for(let i=0;i<10;i++){
   const angle=i*Math.PI/5,dist=12+i%3*9;g.save();g.translate(x+Math.cos(angle)*dist,y+Math.sin(angle)*dist);
   g.rotate(angle);g.fillStyle=i%2?palette():'#ff8da8';g.fillRect(-4,-4,8,8);g.restore();
  }
 }
 g.fillStyle='#fff';g.font='bold 21px system-ui';
 g.fillText(Math.round(Math.min(100,100*pos/run.pattern.length))+'%',W-80,31);
 g.fillStyle=accent;g.fillRect(0,0,W*Math.min(1,pos/run.pattern.length),5);
 g.font='bold 13px system-ui';g.fillStyle='#fff';
 g.fillText((run.world||'MAKER STUDIO').toUpperCase()+' · '+DASH_MODES[r.mode].toUpperCase(),13,31);
 const beatPhase=((dashBeatAt(r)%1)+1)%1;
 g.fillStyle='#0a153b';g.fillRect(13,H-29,130,18);
 g.strokeStyle=accent;g.lineWidth=2;g.strokeRect(13,H-29,130,18);
 g.fillStyle=accent;g.fillRect(16,H-26,124*beatPhase,12);
 g.fillStyle='#ffffff';g.font='bold 11px system-ui';g.fillText('BEAT',16,H-35);
 if(r.tick%15<4){g.fillStyle=accent+'26';g.fillRect(0,H-6,W,6);}
 if(run.practice){g.fillStyle='#ffe692';g.font='bold 17px system-ui';g.fillText('PRACTICE',W/2-34,33);}
 canvas.dataset.light=String(r.lightCue);canvas.dataset.mode=DASH_MODES[r.mode];canvas.dataset.tile=String(Math.floor(r.x));canvas.dataset.y=r.y.toFixed(3);
 canvas.dataset.gravity=String(r.gravity);canvas.dataset.speed=String(r.speed);
 canvas.dataset.beat=String(Math.floor(dashBeatAt(r)));
}
function frameStep(timestamp){
 if(!run||run.finishing)return;
 if(run.lastFrame===null)run.lastFrame=timestamp;
 run.accumulator+=Math.min(.12,Math.max(0,(timestamp-run.lastFrame)/1000));run.lastFrame=timestamp;
 const physics=run.physics,mode=physics.mode;
 while(run.accumulator>=DASH_DT&&!physics.done){
  run.accumulator-=DASH_DT;
  const pads=navigator.getGamepads?.();
  const pad=pads&&Array.from(pads).find(p=>p?.connected);
  const input=(dashControls.has('jump')||pad?.buttons[0]?.pressed?1:0)|(inputTapped?2:0);
  inputTapped=false;
  if(input!==run.input){run.trace.push([physics.tick,input]);run.input=input;}
  stepDash(physics,input);
  if(physics.event==='checkpoint')$('dash-live-status').textContent='Practice checkpoint set at tile '+(physics.checkpoint+1)+'.';
 }
 if(physics.mode!==mode)updateControls();
 run.elapsed=physics.elapsed*1000;originalBeat();draw();
 $('dash-live-progress').textContent=Math.min(100,Math.floor(physics.x/run.pattern.length*100))+'%';
 if(physics.done){void finishRun();return;}
 frame=requestAnimationFrame(frameStep);
}
function updateControls(){
 const mode=run.physics.mode;
 $('dash-control-mode').textContent=DASH_MODES[mode];
 $('dash-live-status').textContent=MODE_HELP[mode]+(run.practice?' Practice only.':'');
 const action=mode==='S'||mode==='W'?'THRUST':mode==='B'||mode==='V'?'FLIP':mode==='P'?'TELEPORT':'JUMP';
  $('dash-action-label').textContent=action;
  $('dash-jump').setAttribute('aria-label','Arcade A, '+action.toLowerCase());
  $('dash-jump').querySelector('.arcade-button-symbol').textContent=action==='JUMP'?'↗':action==='THRUST'?'▲':'⇅';
}
function beginDraw(l){
 const nextKey=(run.practice?'practice:':'verified:')+String(user)+':'+String(run.level_id||run.item?.title||run.title);
 if(attemptKey!==nextKey){attemptKey=nextKey;attemptCount=0;}
 attemptCount++;
 try{if(!soundOn&&localStorage.getItem('dash-forge-audio')==='on')toggleSound();}catch{}
 const overlay=$('dash-play-overlay');overlay.hidden=false;overlay.dataset.finished='false';
 run.inArcade=document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='dashforge';
 document.body.classList.add('dash-playing');
 $('dash-run-title').textContent=l.title;
 const returnButton=root?.querySelector('[data-dash-action="leave"]');
 if(returnButton)returnButton.textContent=runFromBuilder?'← BACK TO LEVEL CREATOR':'Leave track';
 $('dash-live-progress').textContent='0%';$('dash-attempt-count').textContent='ATTEMPT '+attemptCount;$('dash-run-message').hidden=true;
 $('dash-retry-live').hidden=true;$('dash-practice-retry').hidden=true;
 run.lastFrame=null;run.elapsed=0;run.trace=[];run.input=0;run.accumulator=0;run.finishing=false;lastBeat=-1;
 resetDashTouch();
 $('dash-canvas').focus({preventScroll:true});
 updateControls();draw();frame=requestAnimationFrame(frameStep);
}
function startPractice(again=null){
 if(run||busy)return;
 runFromBuilder=true;
 const item=again?.item||{title:draft.title||'New draft',pattern:draft.pattern,layout:draft.layout,
  song:draft.song||'pulse',world:draft.world,boss:draft.bossStyle!=='none',bossStyle:draft.bossStyle,
  bossName:BOSS_FORMS.find(([id])=>id===draft.bossStyle)?.[1],pace:210};
 const course=createDashCourse(item.pattern,item.pace,{boss:item.boss,bossStyle:item.bossStyle,layout:item.layout,edition:DASH_COURSE_EDITION});
 const tile=again?.checkpoint??tileSelected;
 run={...item,practice:true,item,physics:createDashRun(course,{tile,practice:true})};beginDraw(item);
}
async function startLevel(id){
 if(busy||run)return;
 busy=true;setStatus('Requesting a verified member run…');
 try{
  const item=levels().find(l=>Number(l.id)===id);if(!item)throw Error('Level is not available.');
  const result=await call('community_dash_start_v3',{p_level_id:id});
  const pace=Number(result.pace_ms||210),boss=Boolean(result.boss||item.boss);
  const bossStyle=result.boss_style||item.boss_style||'none';
  const course=createDashCourse(result.pattern,pace,{boss,bossStyle,layout:result.layout||item.layout||[],stage:item.stage||0,edition:Number(result.edition||1)});
  run={id:result.run_id,level_id:id,pattern:result.pattern,title:result.title,
   pace,song:item.stage?campaignSong(item.stage):(result.soundtrack||item.soundtrack||'pulse'),
   world:result.world||item.world||'Maker Studio',stage:item.stage||null,boss,bossStyle,
   bossName:result.boss_name||item.boss_name||'FAMILY BOSS ARENA',physics:createDashRun(course)};
  beginDraw(item);
  setStatus('Run started. The server independently checks your control replay.');
 }catch(e){setStatus(e.message,true);}finally{busy=false;}
}
async function retryTrack(){
 if(!lastRun||run||busy)return;
 if(lastRun.practice){startPractice(lastRun);return;}
 await startLevel(Number(lastRun.level_id));
}
async function finishRun(){
 if(!run||run.finishing)return;
 run.finishing=true;cancelAnimationFrame(frame);
 const snapshot=run,visualWin=snapshot.physics.won;
 lastRun={level_id:snapshot.level_id,item:snapshot.item,practice:snapshot.practice,checkpoint:snapshot.physics.checkpoint};
 const message=$('dash-run-message'),liveStatus=$('dash-live-status');
 $('dash-jump').disabled=true;
 if(snapshot.practice){
  message.hidden=false;message.textContent=visualWin?'PRACTICE SECTION CLEARED':'PRACTICE · TILE '+(snapshot.physics.deathTile+1);
  liveStatus.textContent='Checkpoint ready. Use Checkpoint to try again or return to the editor.';
 }else{
  liveStatus.textContent='Validating the run and achievements…';
  try{
   const result=await submitArcadeReplay(client,cfg,'dash',snapshot.id,snapshot.trace);
   const winner=Boolean(result.won);
   message.hidden=false;message.textContent=(winner?'LEVEL CLEARED · SERVER VERIFIED':'CRASHED · TRY AGAIN')+' · '+niceMs(result.elapsed_ms);
   liveStatus.textContent=winner?'Verified run saved.':
      'Collision at tile '+(Number(result.death_tile)+1)+'.';
   if(runFromBuilder)creatorTestOutcome=winner?
    '✓ You beat this exact saved version. Ready to publish!':
    'This playtest ended at tile '+(Number(result.death_tile)+1)+'. Try again or revise the track.';
   await refresh(true);
   if(winner)document.dispatchEvent(new Event('family-game-score-changed'));
  }catch(e){
   message.hidden=false;message.textContent='RUN NOT VERIFIED';
   liveStatus.textContent=e.message;
   if(runFromBuilder)creatorTestOutcome='Your draft is saved. Try a verified playtest again.';
  }
 }
 run=null;resetDashTouch();$('dash-jump').disabled=false;$('dash-live-progress').textContent=visualWin?'FINISHED':'RETRY';
 $('dash-play-overlay').dataset.finished='true';
 $('dash-retry-live').hidden=Boolean(snapshot.practice);
 $('dash-practice-retry').hidden=!snapshot.practice;
 setStatus(runFromBuilder?'Return to Level Studio to keep editing or publish after a verified win.':'Use Retry or Leave track.');
}
async function leaveRun(){
 const returnToCreator=runFromBuilder;runFromBuilder=false;
 cancelAnimationFrame(frame);resetDashTouch();
 run=null;$('dash-play-overlay').hidden=true;
 $('dash-play-overlay').dataset.finished='false';
 document.body.classList.remove('dash-playing');
 await refresh(true);
 if(returnToCreator){choosePane('builder');setStatus(creatorTestOutcome||'Back in the creator. Change obstacles and Save & Playtest again.');}
}
function onKeys(e){
 if(!root||!open||!root.isConnected||board.hidden)return;
 if(e.target?.closest?.('input,select,textarea,[contenteditable]'))return;
 if(run&&!run.finishing&&(e.code==='Space'||e.code==='ArrowUp')&&!e.target?.closest?.('button')){
  e.preventDefault();dashControls.hold('jump','key:'+e.code);if(!e.repeat)jump();return;
 }
 if(!run&&$('dash-play-overlay')&&!$('dash-play-overlay').hidden&&e.code==='KeyR'&&!e.repeat){
  e.preventDefault();void retryTrack();return;
 }
 if(run||scene!=='builder'||e.repeat)return;
 if((e.ctrlKey||e.metaKey)&&['KeyC','KeyV','KeyZ','KeyY'].includes(e.code)){
  e.preventDefault();
  if(e.code==='KeyC')useSelection('copy');
  if(e.code==='KeyV')useSelection('paste');
  if(e.code==='KeyZ')travelHistory(e.shiftKey?'redo':'undo');
  if(e.code==='KeyY')travelHistory('redo');
 }else if(e.code==='Delete'||e.code==='Backspace'){e.preventDefault();useSelection('erase');}
 else if(['ArrowLeft','ArrowRight'].includes(e.code)&&e.target?.closest?.('[data-dash-cell]')){
  e.preventDefault();editTile(tileSelected+(e.code==='ArrowLeft'?-1:1),null);
  root.querySelector('[data-dash-cell="'+tileSelected+'"]')?.focus();
 }
}
function syncArcade(){
 if(!root?.isConnected)return;
 const active=root.classList.contains('arcade-game-active')&&document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='dashforge';
 if(active){
  if(!open){open=true;inside.hidden=false;$('dash-forge-toggle').setAttribute('aria-expanded','true');void refresh(true);}
  const s=document.body.dataset.arcadeScene;
  if(TABS.some(([id])=>id===s)&&!run)choosePane(s);
 }else if(run?.inArcade){
  // Safe teardown: no synthetic success is sent when family exits the game.
  cancelAnimationFrame(frame);resetDashTouch();run=null;runFromBuilder=false;$('dash-play-overlay').hidden=true;document.body.classList.remove('dash-playing');
 }
}
async function boot(){
 if(booted||!board||!cfg?.enabled)return;booted=true;
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const store=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',
    persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:store}});
  let pending=null;
  const verify=async()=>{
   if(board.hidden){resetDashTouch();user=null;root?.remove();root=null;open=false;cancelAnimationFrame(frame);run=null;return;}
   const {data:{session:s}}=await client.auth.getSession();
   const id=s?.user?.id;if(!id){user=null;return;}
   const {data:member,error}=await client.from('community_members').select('status').eq('user_id',id).maybeSingle();
   if(error||member?.status!=='approved'){resetDashTouch();user=null;root?.remove();root=null;return;}
   if(user!==id){user=id;root?.remove();root=null;open=false;state=null;}
   if(!root?.isConnected){build();await refresh(true);}
   syncArcade();
  };
  const schedule=()=>{clearTimeout(pending);pending=setTimeout(()=>{void verify();},120);};
  new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(syncArcade).observe(document.body,{attributes:true,attributeFilter:['class','data-arcade-game','data-arcade-scene']});
  window.addEventListener('keydown',onKeys);
  window.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='ArrowUp')dashControls.release('jump','key:'+e.code);});
  window.addEventListener('blur',resetDashTouch);
  client.auth.onAuthStateChange((_event)=>schedule());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetDashTouch();else schedule();});
  refreshTimer=setInterval(()=>{if(root&&open&&!run&&!document.hidden)void refresh(true);},25000);
  schedule();
 }catch(e){console.warn('Dash Forge unavailable:',e);}
}
window.addEventListener('dashforge:audio-setting',event=>{
 const next=Boolean(event.detail?.enabled);
 if(next!==soundOn)toggleSound();
});
window.addEventListener('dashforge:creator-mode',event=>{
 if(!root?.isConnected||run)return;
 const boss=Boolean(event.detail?.boss);
 draft={id:null,title:boss?'My First Boss Arena':'My New Level',difficulty:boss?6:2,
  pattern:'.'.repeat(boss?88:48),world:boss?'Neon Canopy':'Maker Studio',
  bossStyle:boss?'canopy':'none'};
 scene='builder';choosePane('builder');
 setStatus(boss?'Boss Creator: choose a world, boss form, and attack tiles. Playtest to publish.':
  'Level Creator: choose your scenery and place obstacles. Playtest to publish.');
});
void boot();
