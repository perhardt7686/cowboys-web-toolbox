/* Dash Forge · Original member-only rhythm-platformer. No Geometry Dash assets,
 * music or proprietary levels. Server owns timing validation, achievements and awards. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const board=document.getElementById('conversations');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TILE=40,W=960,H=360;
const TABS=[['campaign','Campaign'],['community','Member Levels'],['builder','Level Studio'],['awards','Awards'],['leaders','Leaders']];
const PAINTS=[['.','Clear'],['s','Spike'],['b','Block'],['g','Gap'],['l','Laser'],['w','Saw'],['c','Crystal'],['p','Pillar'],['f','Flames'],['r','Ring'],['m','Mushroom'],['o','Mine'],['d','Drone'],['h','Hammer']];
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
let draft={id:null,title:'My First Dash',difficulty:2,pattern:'.'.repeat(48),world:'Maker Studio',bossStyle:'none'},theme='amber',refreshTimer=null,booted=false;
const EDITOR_SPAN=24;
let editorPage=0,undoHistory=[],redoHistory=[],draftDirty=true,runFromBuilder=false,creatorTestOutcome='';
const PAINT_GLYPHS={'.':'·',s:'▲',b:'■',g:'▽',l:'ϟ',w:'✺',c:'◆',p:'▮',f:'♨',r:'◎',m:'♣',o:'◉',d:'▣',h:'⚒'};
const PAINT_COLORS={'.':'#a3f0c5',s:'#ff7296',b:'#ffb36b',g:'#6acbff',l:'#d39dff',w:'#ffe086',c:'#a3eaff',p:'#b7a6ff',f:'#ffa460',r:'#92ffdf',m:'#ecbaff',o:'#ff8cbc',d:'#86eeff',h:'#ecbc8c'};
function draftSnapshot(){return {pattern:draft.pattern};}
function saveUndo(){undoHistory.push(draftSnapshot());if(undoHistory.length>50)undoHistory.shift();redoHistory.length=0;draftDirty=true;creatorTestOutcome='';}
function travelHistory(direction){const from=direction==='undo'?undoHistory:redoHistory,to=direction==='undo'?redoHistory:undoHistory;
 if(!from.length)return;to.push(draftSnapshot());const past=from.pop();draft.pattern=past.pattern;draftDirty=true;creatorTestOutcome='';renderBuilder();}
function editTile(index,newBrush){const i=Number(index),a=[...draft.pattern];if(!Number.isInteger(i)||i<4||i>=a.length-4||a[i]===newBrush)return;
 saveUndo();a[i]=newBrush;draft.pattern=a.join('');renderBuilder();}

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
 const lock=!unlocked(l),badge=l.designer_award?'<span class="dash-reward">♛ '+esc(l.designer_award)+'</span>':'';
 return '<article class="dash-level" data-level-id="'+Number(l.id)+'">'+
  '<div class="dash-level-number">'+(l.kind==='campaign'?(l.boss?'♛':l.stage>999?'∞':num(l.stage)):(isDraft?'D':'★'))+'</div>'+
  '<div class="dash-level-copy"><strong>'+esc(l.title)+'</strong>'+
  '<small>'+esc(l.kind==='campaign'?(l.world||'Origin Circuit')+' · Chapter '+num(l.stage)+' · '+l.pattern.length+' tiles · '+Math.round(1000/Number(l.pace_ms||210)*10)/10+' tiles/s':
   (owner?'Your level':('By '+l.creator_name))+' · '+l.pattern.length+' tiles')+
  ' · Difficulty '+l.difficulty+'</small>'+(l.boss?'<span class="dash-draft-tag">♛ '+esc(l.boss_name||'BOSS ARENA')+' · 3 PHASES</span>':'')+(l.stage===chapter()?'<span class="dash-current-tag">YOUR CURRENT STAGE</span>':'')+
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
 const title=$('dash-title'),diff=$('dash-difficulty'),length=$('dash-length');
 const world=$('dash-world'),boss=$('dash-boss-style');
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
  const label=PAINTS.find(([key])=>key===cell)?.[1]||'Hazard';
  const type=label.toLowerCase().replace(/[^a-z]+/g,'-');
  return '<button type="button" class="dash-cell type-'+type+
   '" data-dash-cell="'+i+'" '+(fixed?'disabled':'')+
   ' aria-label="Tile '+(i+1)+', '+(cell==='.'?'safe empty':label.toLowerCase())+(fixed?', locked start or finish':'')+
   '" title="Tile '+(i+1)+' · '+esc(label)+'"><small>'+String(i+1).padStart(2,'0')+'</small><strong>'+
   PAINT_GLYPHS[cell]+'</strong></button>';
 }).join('');
 const count=[...draft.pattern].filter(x=>x!=='.').length;
 const range=$('dash-editor-range');if(range)range.textContent='TILES '+(first+1)+'–'+end+' OF '+draft.pattern.length+' · '+count+' obstacles';
 const badge=$('dash-editor-save-state');if(badge)badge.textContent=draftDirty?'● UNSAVED CHANGES':'✓ DRAFT SAVED';
 const brushInfo=$('dash-brush-info');if(brushInfo)brushInfo.textContent='Selected: '+(PAINTS.find(([key])=>key===brush)?.[1]||'Clear')+
  ' · Tap a numbered square to '+(brush==='.'?'erase it.':'place it.');
 const pageButtons=$('dash-page-buttons');
 if(pageButtons)pageButtons.innerHTML=Array.from({length:pages},(_,i)=>{
  const start=i*EDITOR_SPAN+1,stop=Math.min(draft.pattern.length,(i+1)*EDITOR_SPAN);
  return '<button type="button" data-dash-page="'+i+'" aria-current="'+(i===editorPage?'page':'false')+
   '">'+start+'–'+stop+'</button>';
 }).join('');
 const overview=$('dash-editor-overview');
 if(overview)overview.innerHTML=[...draft.pattern].map((cell,i)=>{
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
function renderCreatorPreview(){
 const canvas=$('dash-creator-preview');if(!canvas)return;
 const g=canvas.getContext('2d');if(!g)return;
 const first=editorPage*EDITOR_SPAN,cam=first*TILE,ground=284;
 const preview={pattern:draft.pattern,world:draft.world,elapsed:0,stage:null,
  boss:draft.bossStyle!=='none',bossStyle:draft.bossStyle,
  bossName:BOSS_FORMS.find(([id])=>id===draft.bossStyle)?.[1]||'CUSTOM GUARDIAN'};
 const accent=backdrop(g,cam,ground,preview);
 for(let i=first;i<Math.min(draft.pattern.length,first+EDITOR_SPAN);i++){
  renderHazard(g,draft.pattern[i],(i-first)*TILE,ground,0,accent);
  g.save();g.fillStyle='#ffffffb8';g.font='bold 13px system-ui';
  g.fillText(String(i+1),((i-first)*TILE)+5,ground+22);g.restore();
 }
 if(preview.boss)drawBoss(g,first+Math.min(5,EDITOR_SPAN-1),0,preview);
 const x=67,y=ground-39;
 g.fillStyle='#ffe58b';g.shadowColor='#ffee9e';g.shadowBlur=15;
 g.fillRect(x,y,34,34);g.shadowBlur=0;g.strokeStyle='#1a2449';g.lineWidth=4;g.strokeRect(x+3,y+3,28,28);
 g.fillStyle='#122145';g.fillRect(x+8,y+11,5,5);g.fillRect(x+21,y+11,5,5);
 g.fillStyle='#11162fcb';g.fillRect(0,0,W,42);
 g.fillStyle='#fff';g.font='bold 21px system-ui';
 g.fillText(draft.world.toUpperCase()+' · TILE '+(first+1)+'–'+Math.min(first+EDITOR_SPAN,draft.pattern.length),13,29);
 const legend=$('dash-preview-explanation');
 if(legend)legend.textContent='This uses the game’s real scenery and obstacle drawings. Colored objects are hazards to jump over; blank tiles are safe. View the next section to see the rest of your track.';
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
 '<span class="mahjong-entry-icon" aria-hidden="true">◆</span><span class="mahjong-entry-copy"><strong>Dash Forge</strong>'+
 '<small id="dash-forge-summary">Tablet racer · Family levels, achievements & builder awards</small></span>'+
 '<span class="mahjong-chevron" aria-hidden="true">▾</span></button>'+
 '<div id="dash-forge-inside" hidden>'+
  '<header class="dash-top"><div><small>ORIGINAL FAMILY ARCADE · ONE-TAP RHYTHM PLATFORMER</small><h2>◆ DASH FORGE</h2>'+
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
    '<p>Draw the track tile by tile. Save a draft, complete a playtest, then publish it for the family.</p></div>'+
   '<div class="dash-builder-form"><label>Title<input id="dash-title" maxlength="58" pattern="[A-Za-z0-9 ]+" value="My First Dash"></label>'+
   '<label>Difficulty<select id="dash-difficulty">'+[1,2,3,4,5,6].map(n=>'<option value="'+n+'">'+n+'</option>').join('')+'</select></label>'+
   '<label>Tiles<select id="dash-length">'+[24,32,40,48,56,64,72,80,88].map(n=>'<option value="'+n+'"'+(n===48?' selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
   '<label>World / Scenery<select id="dash-world">'+CREATOR_WORLDS.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('')+'</select></label>'+
   '<label>Boss Arena<select id="dash-boss-style">'+BOSS_FORMS.map(([key,name])=>'<option value="'+key+'">'+esc(name)+'</option>').join('')+'</select></label></div>'+
   '<div class="dash-builder-preview"><canvas id="dash-creator-preview" width="600" height="145" role="img" aria-label="Live preview of your chosen world, obstacles and boss"></canvas>'+
   '<small>PREVIEW · YOUR ORIGINAL WORLD · BOSS & HAZARD DESIGN</small></div>'+
   '<div class="dash-palette" role="group" aria-label="Level tile brushes">'+PAINTS.map(([k,name])=>'<button type="button" data-dash-brush="'+k+'">'+name+'</button>').join('')+'</div>'+
   '<div id="dash-phase-guide" class="dash-phase-guide" hidden aria-label="Three boss attack phases"><span>PHASE I · OPENING</span><span>PHASE II · ESCALATION</span><span>PHASE III · FINAL ATTACK</span></div>'+
   '<div id="dash-editor-grid" class="dash-editor-grid" role="group" aria-label="Tap a tile to place hazards in the world or boss arena"></div>'+
   '<p id="dash-builder-help" class="dash-note"></p><div class="dash-builder-actions"><button type="button" data-dash-action="new">New draft</button>'+
   '<button type="button" data-dash-action="save">Save draft</button><button type="button" data-dash-action="test">Playtest</button>'+
   '<button type="button" data-dash-action="publish">Publish solved level</button></div>'+
   '<p class="dash-note">A creator never earns a designer award for self-testing. The first other member’s server-validated time to victory determines its one-time design award.</p></section>'+
  '<section class="dash-pane" id="dash-pane-awards" hidden><div class="dash-pane-title"><h3>Trophies & unlockables</h3>'+
    '<p>Runner awards for verified victories; designer awards only for real member solve times.</p></div><div id="dash-awards-list"></div></section>'+
  '<section class="dash-pane" id="dash-pane-leaders" hidden><div class="dash-pane-title"><h3>Family champions</h3>'+
    '<p>Separate running and level-design leaderboards, all earned from verified server results.</p></div><div id="dash-leaders-list"></div></section>'+
  '<div id="dash-status" class="dash-status" role="status" aria-live="polite">Loading your family arcade…</div>'+
  '<div id="dash-play-overlay" class="dash-play-overlay" hidden>'+
    '<header class="dash-playing-head"><div><small>NOW PLAYING</small><strong id="dash-run-title">Loading…</strong></div>'+
      '<strong id="dash-live-progress">0%</strong><button type="button" id="dash-sound" data-dash-action="sound" aria-pressed="false">♪ SOUND OFF</button><button type="button" data-dash-action="leave">Leave track</button></header>'+
    '<div class="dash-canvas-wrap"><canvas id="dash-canvas" width="960" height="360" role="img" aria-label="Running level. Tap Jump to vault over obstacles."></canvas>'+
     '<div class="dash-run-overlay" id="dash-run-message" hidden></div></div>'+
    '<footer class="dash-game-controls"><div><small>ONE TAP TO JUMP</small><p id="dash-live-status">Tap or press Space. Avoid spikes, blocks and gaps.</p></div>'+
    '<button type="button" id="dash-jump" aria-label="Jump">↗ JUMP</button></footer>'+
  '</div></div>';
 const sibling=$('streetrod-root');
 if(sibling?.parentElement===main)sibling.after(root);else main.prepend(root);
 inside=$('dash-forge-inside');
 $('dash-forge-toggle').addEventListener('click',()=>{open=!open;inside.hidden=!open;
  $('dash-forge-toggle').setAttribute('aria-expanded',String(open));
  if(open){void refresh();choosePane(scene);}});
 root.addEventListener('click',onClick);
 root.addEventListener('pointerdown',event=>{
  if(event.target.closest('#dash-canvas')){event.preventDefault();jump();}
 },{passive:false});
 $('dash-jump').addEventListener('pointerdown',event=>{event.preventDefault();jump();},{passive:false});
 $('dash-jump').addEventListener('click',event=>{if(event.detail===0)jump();});
 for(const id of ['dash-title','dash-difficulty']){
  $(id).addEventListener('change',()=>{draft.title=$('dash-title').value.trim();draft.difficulty=Number($('dash-difficulty').value);});
 }
 for(const [id,field] of [['dash-world','world'],['dash-boss-style','bossStyle']]){
  $(id).addEventListener('change',event=>{draft[field]=event.target.value;renderBuilder();});
 }
 $('dash-length').addEventListener('change',e=>{
  const n=Number(e.target.value),a=[...draft.pattern];draft.pattern=a.slice(0,n).join('').padEnd(n,'.');
  draft.pattern='....'+draft.pattern.slice(4,-4)+'....';renderBuilder();
 });
 try{const t=localStorage.getItem('dash-forge-theme');if(THEMES.some(row=>row[0]===t))theme=t;}catch{}
 choosePane('campaign');
}
async function call(name,args={}){
 if(!client||!user)throw Error('Sign in to the Family Message Board first.');
 const {data,error}=await client.rpc(name,args);
 if(error)throw Error(error.message||'Family game server unavailable.');
 return data;
}
async function refresh(quiet=false){
 if(!root||board.hidden||!user)return;
 try{const data=await call('community_dash_state');state=data;renderAll();
   if(!quiet)setStatus('Family campaign and rewards loaded from the game server.');}
 catch(e){setStatus('Saved game unavailable: '+e.message,true);}
}
function onClick(event){
 const target=event.target.closest('[data-dash-tab],[data-dash-play],[data-dash-edit],[data-dash-publish],[data-dash-action],[data-dash-brush],[data-dash-cell],[data-dash-theme]');
 if(!target||target.disabled||busy)return;
 const d=target.dataset;
 if(d.dashTab){choosePane(d.dashTab);return;}
 if(d.dashPlay){void startLevel(Number(d.dashPlay));return;}
 if(d.dashEdit){const l=levels().find(x=>Number(x.id)===Number(d.dashEdit));if(l){
   draft={id:l.id,title:l.title,difficulty:l.difficulty,pattern:l.pattern,
    world:l.world||'Maker Studio',bossStyle:l.boss_style||'none'};choosePane('builder');}return;}
 if(d.dashPublish){void publishLevel(Number(d.dashPublish));return;}
 if(d.dashBrush!==undefined){brush=d.dashBrush;root.querySelectorAll('[data-dash-brush]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.dashBrush===brush));return;}
 if(d.dashCell!==undefined){const i=Number(d.dashCell),a=[...draft.pattern];if(i>=4&&i<a.length-4){a[i]=brush;draft.pattern=a.join('');renderBuilder();}return;}
 if(d.dashTheme){const t=THEMES.find(row=>row[0]===d.dashTheme);if(t&&profile().clears>=t[2]){
  theme=t[0];try{localStorage.setItem('dash-forge-theme',theme);}catch{}renderAwards();}return;}
 switch(d.dashAction){
  case 'new':draft={id:null,title:'My New Dash',difficulty:2,pattern:'.'.repeat(48),
     world:'Maker Studio',bossStyle:'none'};renderBuilder();break;
  case 'save':void saveDraft();break;
  case 'test':if(!draft.id)setStatus('Save a draft first, then playtest it.',true);
    else void startLevel(Number(draft.id));break;
  case 'publish':if(!draft.id)setStatus('Save and beat your draft before publishing.',true);
    else void publishLevel(Number(draft.id));break;
  case 'sound':toggleSound();break;
  case 'leave':void leaveRun();break;
 }
}
async function saveDraft(){
 if(busy||run)return;busy=true;setStatus('Saving your editable level draft…');
 try{
  draft.title=$('dash-title').value.trim();draft.difficulty=Number($('dash-difficulty').value);
  const saved=await call('community_dash_save_world',{p_title:draft.title,p_difficulty:draft.difficulty,
   p_pattern:draft.pattern,p_level_id:draft.id,p_world:draft.world,p_boss_style:draft.bossStyle});
  draft.id=saved.id;
  await refresh(true);setStatus('Draft saved. Beat this version in Playtest before publishing.');renderBuilder();
 }catch(e){setStatus(e.message,true);}finally{busy=false;}
}
async function publishLevel(id){
 if(busy||run)return;busy=true;setStatus('Checking your verified playtest…');
 try{const data=await call('community_dash_publish',{p_level_id:id});
  await refresh(true);setStatus(data.status==='published'?'Published to the family level list. No maker award until another member beats it.':'Publication pending.');
  choosePane('community');
 }catch(e){setStatus(e.message,true);}finally{busy=false;}
}

// Original pentatonic melody, composed procedurally. No copyrighted songs,
// samples, or Geometry Dash music are played or redistributed.
function toggleSound(){
 soundOn=!soundOn;
 try{localStorage.setItem('dash-forge-audio',soundOn?'on':'off');}catch{}
 const button=$('dash-sound');if(button){button.textContent=soundOn?'♫ SOUND ON':'♪ SOUND OFF';button.setAttribute('aria-pressed',String(soundOn));}
 if(soundOn){
  try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();
   if(audioContext.state==='suspended')void audioContext.resume();}catch{soundOn=false;if(button)button.textContent='♪ SOUND OFF';}
 }else if(audioContext?.state==='running')void audioContext.suspend();
}
function originalBeat(){
 if(!soundOn||!run||!audioContext||audioContext.state!=='running')return;
 const beat=Math.floor(run.elapsed/((run.pace||210)*2));
 if(beat===lastBeat)return;lastBeat=beat;
 const world=Object.keys(WORLDS).indexOf(run.world);
 const scale=[0,3,5,7,10,12,15,17],tone=scale[(beat+Math.max(0,world)*2)%scale.length];
 const hz=110*Math.pow(2,(tone+(run.boss?5:0))/12);
 try{
  const at=audioContext.currentTime;
  const osc=audioContext.createOscillator(),volume=audioContext.createGain();
  osc.type=world%3===0?'triangle':world%3===1?'sine':'square';
  osc.frequency.setValueAtTime(hz,at);
  volume.gain.setValueAtTime(0.0001,at);
  volume.gain.exponentialRampToValueAtTime(0.027,at+0.012);
  volume.gain.exponentialRampToValueAtTime(0.0001,at+0.13);
  osc.connect(volume);volume.connect(audioContext.destination);
  osc.start(at);osc.stop(at+0.14);
 }catch{/* Muted or unavailable audio must never stop gameplay. */}
}
function eventJump(){
 if(!run||run.finishing)return;
 const pos=Math.min(run.pattern.length-1,Math.floor(run.elapsed/(run.pace||210)));
 if(pos<0||pos<=run.lastJump+3||run.pattern[pos]!=='.')return;
 run.lastJump=pos;run.jumps.push(pos);
}
function jump(){if(soundOn&&audioContext?.state==='suspended')void audioContext.resume();eventJump();}
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
function renderHazard(g,ch,x,y,t,accent){
 if(ch==='.')return;
 const cx=x+TILE/2;
 g.save();g.shadowColor=accent;g.shadowBlur=13;
 if(ch==='s'){
  g.fillStyle='#ff608d';g.beginPath();g.moveTo(x+3,y);g.lineTo(cx,y-42);g.lineTo(x+TILE-3,y);g.closePath();g.fill();
 }else if(ch==='b'){
  g.fillStyle='#ffb24c';g.fillRect(x+3,y-43,TILE-6,43);
  g.strokeStyle='#ffedb2';g.lineWidth=3;g.strokeRect(x+6,y-39,TILE-12,35);
 }else if(ch==='g'){
  g.fillStyle='#030813';g.fillRect(x,y-2,TILE,75);
  g.strokeStyle='#ff87cd';g.lineWidth=2;g.strokeRect(x+2,y+1,TILE-4,21);
 }else if(ch==='l'){
  g.fillStyle='#ef73ff';g.fillRect(x+7,y-49,8,49);g.fillRect(x+27,y-49,8,49);
  g.fillStyle='#e5ffff';g.fillRect(x+9,y-31,TILE-18,8);
 }else if(ch==='w'){
  g.translate(cx,y-23);g.rotate(t*4);g.fillStyle='#ffbd75';g.beginPath();
  for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?14:24;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
  g.closePath();g.fill();g.fillStyle='#302343';g.beginPath();g.arc(0,0,7,0,Math.PI*2);g.fill();
 }else if(ch==='c'){
  g.fillStyle='#8fddff';g.beginPath();g.moveTo(cx,y-53);g.lineTo(x+37,y-25);
  g.lineTo(x+28,y);g.lineTo(x+4,y-7);g.lineTo(x+4,y-28);g.closePath();g.fill();
  g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
 }else if(ch==='p'){
  g.fillStyle='#be9cff';g.fillRect(x+8,y-52,24,52);
  g.fillStyle='#fbe8ff';for(let z=0;z<3;z++)g.fillRect(x+7,y-14-z*18,26,4);
 }else if(ch==='f'){
  g.fillStyle='#ffad3c';g.beginPath();g.moveTo(x+4,y);g.lineTo(x+17+Math.sin(t*8)*7,y-52);
  g.quadraticCurveTo(x+41,y-30,x+35,y);g.fill();
  g.fillStyle='#ffffa1';g.beginPath();g.ellipse(cx,y-16,9,15,0,0,Math.PI*2);g.fill();
 }else if(ch==='r'){
  g.translate(cx,y-24);g.rotate(t*2.4);g.strokeStyle='#85fff0';g.lineWidth=8;g.beginPath();
  g.arc(0,0,19,0,Math.PI*2);g.stroke();g.strokeStyle='#ffe4ff';g.lineWidth=3;g.strokeRect(-12,-12,24,24);
 }else if(ch==='m'){
  g.fillStyle='#e6d2ff';g.fillRect(x+15,y-28,11,28);
  g.fillStyle='#ff93d1';g.beginPath();g.arc(cx,y-29,23,Math.PI,2*Math.PI);g.fill();
  g.fillStyle='#fff';g.fillRect(x+13,y-45,7,7);g.fillRect(x+26,y-38,5,5);
 }else if(ch==='o'){
  g.fillStyle='#ff68cf';g.beginPath();g.arc(cx,y-23+Math.sin(t*4)*3,19,0,Math.PI*2);g.fill();
  g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.moveTo(cx-12,y-23);g.lineTo(cx+12,y-23);g.stroke();
 }else if(ch==='d'){
  g.fillStyle='#83f7ff';g.fillRect(x+8,y-47,24,22);
  g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.moveTo(x+2,y-50);g.lineTo(x+38,y-50);g.stroke();
  g.fillStyle='#ff709a';g.fillRect(x+15,y-40,10,6);
 }else if(ch==='h'){
  g.strokeStyle='#ffd48a';g.lineWidth=7;g.beginPath();g.moveTo(cx+4,y);g.lineTo(cx-2,y-36);g.stroke();
  g.fillStyle='#829dff';g.fillRect(x+2,y-51,34,20);g.fillStyle='#effbff';g.fillRect(x+2,y-51,34,5);
 }
 g.restore();
}

// Boss visuals follow the server-stored boss style and attack tiles. Rendering
// does not decide collisions: the same server-validated pattern controls all
// members' outcomes at the same chapter.
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
  if(data.pattern[i]!=='.'){next=i;break;}
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
function draw(){
 if(!run)return;
 const canvas=$('dash-canvas'),g=canvas?.getContext('2d');if(!g)return;
 const pos=Math.min(run.pattern.length,run.elapsed/(run.pace||210)),cam=Math.max(0,pos*TILE-5*TILE);
 const ground=284,accent=backdrop(g,cam,ground),t=run.elapsed/1000;
 drawBoss(g,pos,t);
 for(let i=Math.max(0,Math.floor(cam/TILE));i<Math.min(run.pattern.length,Math.ceil((cam+W)/TILE)+1);i++){
  renderHazard(g,run.pattern[i],Math.round(i*TILE-cam),ground,t,accent);
 }
 const delta=pos-run.lastJump,lift=delta>0&&delta<4?Math.sin(Math.PI*delta/4)*94:0;
 const x=pos*TILE-cam+3,y=ground-39-lift;
 g.save();g.translate(x+18,y+18);g.rotate(lift>0?delta*.42:0);g.fillStyle=palette();
 g.shadowColor=palette();g.shadowBlur=23;g.fillRect(-17,-17,34,34);g.shadowBlur=0;
 g.strokeStyle='#101130';g.lineWidth=5;g.strokeRect(-13,-13,26,26);
 g.fillStyle='#201538';g.fillRect(-8,-5,5,5);g.fillRect(3,-5,5,5);g.restore();
 g.fillStyle='#fff';g.font='bold 21px system-ui';
 g.fillText(Math.round(Math.min(100,100*pos/run.pattern.length))+'%',W-80,31);
 g.fillStyle=accent;g.fillRect(0,0,W*Math.min(1,pos/run.pattern.length),5);
 g.font='bold 13px system-ui';g.fillStyle='#fff';
 g.fillText((run.world||'MAKER STUDIO').toUpperCase()+' · STAGE '+(run.stage||'CUSTOM'),13,31);
 if(run.boss){g.fillStyle='#ffe692';g.font='bold 17px system-ui';g.fillText('BOSS '+(run.stage?Math.floor(run.stage/25):'CREATOR')+' · '+(run.bossName||'FAMILY BOSS ARENA'),W/2-175,33);}
}

function frameStep(timestamp){
 if(!run||run.finishing)return;
 if(run.lastFrame===null)run.lastFrame=timestamp;
 run.elapsed+=Math.min(80,Math.max(0,timestamp-run.lastFrame));run.lastFrame=timestamp;
 originalBeat();
 let end=null;
 const cursor=Math.min(run.pattern.length,Math.floor(run.elapsed/(run.pace||210)));
 while(run.checked<cursor){
  const i=run.checked++,ch=run.pattern[i],delta=i-run.lastJump;
  if(ch!=='.'&&(delta<1||delta>3)){end='dead';run.death=i;break;}
 }
 draw();
 $('dash-live-progress').textContent=Math.min(100,Math.floor(run.elapsed/(run.pattern.length*(run.pace||210))*100))+'%';
 if(end==='dead'||run.checked>=run.pattern.length){void finishRun(end!=='dead');return;}
 frame=requestAnimationFrame(frameStep);
}
function beginDraw(l){
 try{if(!soundOn&&localStorage.getItem('dash-forge-audio')==='on')toggleSound();}catch{}
 const overlay=$('dash-play-overlay');overlay.hidden=false;
 document.body.classList.add('dash-playing');
 $('dash-run-title').textContent=l.title;
 $('dash-live-status').textContent='Tap the canvas or JUMP. Space and ↑ work on keyboards.';
 $('dash-live-progress').textContent='0%';
 $('dash-run-message').hidden=true;
 run.lastFrame=null;run.elapsed=0;run.checked=0;run.lastJump=-5;run.jumps=[];run.finishing=false;lastBeat=-1;
 frame=requestAnimationFrame(frameStep);
}
async function startLevel(id){
 if(busy||run)return;
 busy=true;setStatus('Requesting a verified member run…');
 try{
  const item=levels().find(l=>Number(l.id)===id);if(!item)throw Error('Level is not available.');
  const result=await call('community_dash_start',{p_level_id:id});
  run={id:result.run_id,level_id:id,pattern:result.pattern,title:result.title,
   pace:Number(result.pace_ms||210),world:result.world||item.world||'Maker Studio',
   stage:item.stage||null,boss:Boolean(result.boss||item.boss),
    bossStyle:result.boss_style||item.boss_style||'none',
    bossName:result.boss_name||item.boss_name||'FAMILY BOSS ARENA'};
  beginDraw(item);
  setStatus('Run started. Your jump trace will be independently checked by the server.');
 }catch(e){setStatus(e.message,true);}finally{busy=false;}
}
async function finishRun(visualWin){
 if(!run||run.finishing)return;
 run.finishing=true;cancelAnimationFrame(frame);
 const snapshot=run;
 $('dash-live-status').textContent='Validating the run and achievements…';
 $('dash-jump').disabled=true;
 try{
  const result=await call('community_dash_finish',{p_run_id:snapshot.id,p_jumps:snapshot.jumps});
  const winner=Boolean(result.won);
  const message=winner?'LEVEL CLEARED · SERVER VERIFIED':'CRASHED · TRY AGAIN';
  $('dash-run-message').hidden=false;
  $('dash-run-message').textContent=message+' · '+niceMs(result.elapsed_ms);
  $('dash-live-status').textContent=winner?'Great run. Verified achievement and leaderboard updated.':
     'Collision at tile '+(Number(result.death_tile)+1)+'. Keep practicing.';
  await refresh(true);
 }catch(e){
  $('dash-run-message').hidden=false;$('dash-run-message').textContent='RUN NOT VERIFIED';
  $('dash-live-status').textContent='Server could not validate this attempt: '+e.message;
 }finally{
  run=null;$('dash-jump').disabled=false;
  $('dash-live-progress').textContent=visualWin?'FINISHED':'RETRY';
  $('dash-play-overlay').dataset.finished='true';
  setStatus('Use Leave track to return to the family arcade.');
 }
}
async function leaveRun(){
 cancelAnimationFrame(frame);
 run=null;$('dash-play-overlay').hidden=true;
 $('dash-play-overlay').dataset.finished='false';
 document.body.classList.remove('dash-playing');
 await refresh(true);
}
function onKeys(e){
 if(!root||!open||!root.isConnected||board.hidden||!run||run.finishing||e.repeat)return;
 if(e.target?.closest?.('button,input,select,textarea,[contenteditable]'))return;
 if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump();}
}
function syncArcade(){
 if(!root?.isConnected)return;
 const active=root.classList.contains('arcade-game-active')&&document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='dashforge';
 if(active){
  if(!open){open=true;inside.hidden=false;$('dash-forge-toggle').setAttribute('aria-expanded','true');void refresh(true);}
  const s=document.body.dataset.arcadeScene;
  if(TABS.some(([id])=>id===s)&&!run)choosePane(s);
 }else if(run){
  // Safe teardown: no synthetic success is sent when family exits the game.
  cancelAnimationFrame(frame);run=null;$('dash-play-overlay').hidden=true;document.body.classList.remove('dash-playing');
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
   if(board.hidden){user=null;root?.remove();root=null;open=false;cancelAnimationFrame(frame);run=null;return;}
   const {data:{session:s}}=await client.auth.getSession();
   const id=s?.user?.id;if(!id){user=null;return;}
   const {data:member,error}=await client.from('community_members').select('status').eq('user_id',id).maybeSingle();
   if(error||member?.status!=='approved'){user=null;root?.remove();root=null;return;}
   if(user!==id){user=id;root?.remove();root=null;open=false;state=null;}
   if(!root?.isConnected){build();await refresh(true);}
   syncArcade();
  };
  const schedule=()=>{clearTimeout(pending);pending=setTimeout(()=>{void verify();},120);};
  new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(syncArcade).observe(document.body,{attributes:true,attributeFilter:['class','data-arcade-game','data-arcade-scene']});
  window.addEventListener('keydown',onKeys);
  client.auth.onAuthStateChange((_event)=>schedule());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
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
