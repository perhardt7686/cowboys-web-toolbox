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
const THEMES=[['amber','#ffd363',0],['cyan','#6ee9fb',2],['coral','#ff749c',4],['aurora','#96ffb3',6],
 ['sapphire','#7d94ff',10],['ember','#ff995c',20],['lotus','#df92ff',30],['sunbeam','#fff58a',50],
 ['arcade','#67ffc8',75],['starlight','#ebdefc',100],['obsidian','#a8aac1',200],['legend','#fff',500]];
let client=null,user=null,root=null,inside=null,state=null,scene='campaign',busy=false,open=false,run=null,frame=0,brush='s';
let draft={id:null,title:'My First Dash',difficulty:2,pattern:'.'.repeat(48)},theme='amber',refreshTimer=null,booted=false;
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
  '<div class="dash-level-number">'+(l.kind==='campaign'?(l.boss?'♛':num(l.stage)):(isDraft?'D':'★'))+'</div>'+
  '<div class="dash-level-copy"><strong>'+esc(l.title)+'</strong>'+
  '<small>'+esc(l.kind==='campaign'?(l.world||'Origin Circuit')+' · Chapter '+num(l.stage)+' · '+l.pattern.length+' tiles · '+Math.round(1000/Number(l.pace_ms||210)*10)/10+' tiles/s':
   (owner?'Your level':('By '+l.creator_name))+' · '+l.pattern.length+' tiles')+
  ' · Difficulty '+l.difficulty+'</small>'+(l.boss?'<span class="dash-draft-tag">WORLD TRIAL · BOSS STAGE</span>':'')+(l.stage===chapter()?'<span class="dash-current-tag">YOUR CURRENT STAGE</span>':'')+
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
 const text=$('dash-title'),diff=$('dash-difficulty'),length=$('dash-length');
 if(document.activeElement!==text)text.value=draft.title;
 if(document.activeElement!==diff)diff.value=String(draft.difficulty);
 length.value=String(draft.pattern.length);
 grid.style.setProperty('--dash-cols','12');
 grid.innerHTML=[...draft.pattern].map((cell,i)=>{
  const fixed=i<4||i>=draft.pattern.length-4;
  return '<button type="button" class="dash-cell type-'+(cell==='.'?'clear':cell==='s'?'spike':cell==='b'?'block':'gap')+
   '" data-dash-cell="'+i+'" '+(fixed?'disabled':'')+
   ' aria-label="Tile '+(i+1)+' '+(cell==='.'?'empty':cell==='s'?'spike':cell==='b'?'block':'gap')+'">'+
   (cell==='s'?'▲':cell==='b'?'■':cell==='g'?'∇':'·')+'</button>';
 }).join('');
 $('dash-builder-help').textContent=draft.id?'Draft #'+draft.id+' · edits require another successful playtest':'New level · safe first and last four tiles';
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
  '<section class="dash-pane" id="dash-pane-campaign"><div class="dash-pane-title"><h3>Six-stage family campaign</h3>'+
    '<p>Everyone races the same six stages. Clear each chapter to unlock the next.</p></div>'+
    '<div class="dash-forever-counter">◆ ONE BILLION UNIQUE STAGES · 12 ROTATING WORLDS · A WORLD TRIAL EVERY 25 STAGES · NEW TRACKS APPEAR AS YOU ADVANCE ◆</div><div id="dash-campaign-list" class="dash-level-list"></div></section>'+
  '<section class="dash-pane" id="dash-pane-community" hidden><div class="dash-pane-title"><h3>Levels made by the family</h3>'+
    '<p>Creator awards pay only when another member genuinely beats the published level, scaled by active solve time.</p></div>'+
    '<div id="dash-community-list" class="dash-level-list"></div></section>'+
  '<section class="dash-pane" id="dash-pane-builder" hidden><div class="dash-pane-title"><h3>Level Studio</h3>'+
    '<p>Draw the track tile by tile. Save a draft, complete a playtest, then publish it for the family.</p></div>'+
   '<div class="dash-builder-form"><label>Title<input id="dash-title" maxlength="58" pattern="[A-Za-z0-9 ]+" value="My First Dash"></label>'+
   '<label>Difficulty<select id="dash-difficulty">'+[1,2,3,4,5,6].map(n=>'<option value="'+n+'">'+n+'</option>').join('')+'</select></label>'+
   '<label>Tiles<select id="dash-length">'+[24,32,40,48,56,64,72,80,88].map(n=>'<option value="'+n+'"'+(n===48?' selected':'')+'>'+n+'</option>').join('')+'</select></label></div>'+
   '<div class="dash-palette" role="group" aria-label="Level tile brushes">'+PAINTS.map(([k,name])=>'<button type="button" data-dash-brush="'+k+'">'+name+'</button>').join('')+'</div>'+
   '<div id="dash-editor-grid" class="dash-editor-grid" role="group" aria-label="Tap a tile to place a spike, block, gap or safe floor"></div>'+
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
      '<strong id="dash-live-progress">0%</strong><button type="button" data-dash-action="leave">Leave track</button></header>'+
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
   draft={id:l.id,title:l.title,difficulty:l.difficulty,pattern:l.pattern};choosePane('builder');}return;}
 if(d.dashPublish){void publishLevel(Number(d.dashPublish));return;}
 if(d.dashBrush!==undefined){brush=d.dashBrush;root.querySelectorAll('[data-dash-brush]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.dashBrush===brush));return;}
 if(d.dashCell!==undefined){const i=Number(d.dashCell),a=[...draft.pattern];if(i>=4&&i<a.length-4){a[i]=brush;draft.pattern=a.join('');renderBuilder();}return;}
 if(d.dashTheme){const t=THEMES.find(row=>row[0]===d.dashTheme);if(t&&profile().clears>=t[2]){
  theme=t[0];try{localStorage.setItem('dash-forge-theme',theme);}catch{}renderAwards();}return;}
 switch(d.dashAction){
  case 'new':draft={id:null,title:'My New Dash',difficulty:2,pattern:'.'.repeat(48)};renderBuilder();break;
  case 'save':void saveDraft();break;
  case 'test':if(!draft.id)setStatus('Save a draft first, then playtest it.',true);
    else void startLevel(Number(draft.id));break;
  case 'publish':if(!draft.id)setStatus('Save and beat your draft before publishing.',true);
    else void publishLevel(Number(draft.id));break;
  case 'leave':void leaveRun();break;
 }
}
async function saveDraft(){
 if(busy||run)return;busy=true;setStatus('Saving your editable level draft…');
 try{
  draft.title=$('dash-title').value.trim();draft.difficulty=Number($('dash-difficulty').value);
  const saved=await call('community_dash_save',{p_title:draft.title,p_difficulty:draft.difficulty,
   p_pattern:draft.pattern,p_level_id:draft.id});
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
function eventJump(){
 if(!run||run.finishing)return;
 const pos=Math.min(run.pattern.length-1,Math.floor(run.elapsed/(run.pace||210)));
 if(pos<0||pos<=run.lastJump+3||run.pattern[pos]!=='.')return;
 run.lastJump=pos;run.jumps.push(pos);
}
function jump(){eventJump();}
function palette(){
 const t=THEMES.find(row=>row[0]===theme);
 return t&&Number(profile().clears)>=t[2]?t[1]:'#ffd363';
}
function draw(){
 if(!run)return;
 const canvas=$('dash-canvas'),g=canvas?.getContext('2d');if(!g)return;
 const p=run.elapsed/(run.pace||210),pos=Math.min(run.pattern.length,p),tile=Math.floor(pos);
 const cam=Math.max(0,pos*TILE-5*TILE);
 const ground=284;
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#0b1130');sky.addColorStop(1,'#302553');
 g.fillStyle=sky;g.fillRect(0,0,W,H);
 g.strokeStyle='#4f3b81';g.lineWidth=1;
 for(let y=28;y<ground;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
 for(let x=-(cam*.25%100);x<W;x+=100){g.fillStyle='#2f285b';g.fillRect(x,94,25,190);}
 g.fillStyle='#11172e';g.fillRect(0,ground,W,H-ground);
 for(let i=Math.max(0,Math.floor(cam/TILE));i<Math.min(run.pattern.length,Math.ceil((cam+W)/TILE)+1);i++){
  const x=Math.round(i*TILE-cam),ch=run.pattern[i];
  g.strokeStyle='#845cab';g.beginPath();g.moveTo(x,ground);g.lineTo(x+TILE,ground);g.stroke();
  if(ch==='s'){g.fillStyle='#ff6183';g.beginPath();g.moveTo(x+4,ground);g.lineTo(x+TILE/2,ground-40);g.lineTo(x+TILE-4,ground);g.closePath();g.fill();}
  if(ch==='b'){g.fillStyle='#fba34a';g.fillRect(x+3,ground-43,TILE-6,43);g.strokeStyle='#ffe3a5';g.strokeRect(x+3,ground-43,TILE-6,43);}
  if(ch==='g'){g.fillStyle='#0b1130';g.fillRect(x,ground-2,TILE,75);g.strokeStyle='#ff77d3';g.strokeRect(x+2,ground+2,TILE-4,24);}
 }
 const delta=pos-run.lastJump;
 const lift=delta>0&&delta<4?Math.sin(Math.PI*delta/4)*94:0;
 const x=pos*TILE-cam+3,y=ground-39-lift;
 g.save();g.translate(x+18,y+18);g.rotate(lift>0?delta*0.42:0);g.fillStyle=palette();
 g.shadowColor=palette();g.shadowBlur=20;g.fillRect(-17,-17,34,34);g.shadowBlur=0;
 g.strokeStyle='#101130';g.lineWidth=5;g.strokeRect(-13,-13,26,26);
 g.fillStyle='#201538';g.fillRect(-8,-5,5,5);g.fillRect(3,-5,5,5);g.restore();
 g.fillStyle='#ffffff';g.font='bold 21px system-ui';g.fillText(Math.round(Math.min(100,100*pos/run.pattern.length))+'%',W-80,33);
 g.fillStyle='#6ee9fb';g.fillRect(0,0,W*Math.min(1,pos/run.pattern.length),5);
}
function frameStep(timestamp){
 if(!run||run.finishing)return;
 if(run.lastFrame===null)run.lastFrame=timestamp;
 run.elapsed+=Math.min(80,Math.max(0,timestamp-run.lastFrame));run.lastFrame=timestamp;
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
 const overlay=$('dash-play-overlay');overlay.hidden=false;
 document.body.classList.add('dash-playing');
 $('dash-run-title').textContent=l.title;
 $('dash-live-status').textContent='Tap the canvas or JUMP. Space and ↑ work on keyboards.';
 $('dash-live-progress').textContent='0%';
 $('dash-run-message').hidden=true;
 run.lastFrame=null;run.elapsed=0;run.checked=0;run.lastJump=-5;run.jumps=[];run.finishing=false;
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
   stage:item.stage||null,boss:Boolean(result.boss||item.boss)};
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
 if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump();}
}
function syncArcade(){
 const active=document.body.classList.contains('arcade-on')&&document.body.dataset.arcadeGame==='dashforge';
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
void boot();
