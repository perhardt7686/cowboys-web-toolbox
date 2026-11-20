/* Mystery Road: nature-inspired, accessible map for the server-authoritative campaign.
 * Landmarks are visual previews; only the server decides which level can start.
 * No external images, music, libraries, privileged data, or player writes.
 */
import {illustratedRegionMap,REGION_MAP_MOTIFS} from './mahjong-region-picture.mjs';
export const MYSTERY_ROAD_TOTAL=5000;
export const ROAD_REGION_SIZE=250;
export const ROAD_REGIONS=Object.freeze([
 {name:'Daisy Lane',flora:'Daisies & clover',fauna:'Butterflies',icon:'🦋',flower:'🌼',sky:'#e8f5b5',land:'#57966c',ink:'#173f2e',accent:'#f9d44d'},
 {name:'Buttercup Fields',flora:'Buttercups & wild thyme',fauna:'Bumblebees',icon:'🐝',flower:'🌻',sky:'#fff0ab',land:'#a66e2d',ink:'#4b2d13',accent:'#df7d29'},
 {name:'Fern Hollow',flora:'Ferns & moss',fauna:'Foxes',icon:'🦊',flower:'🌿',sky:'#b4e8cc',land:'#276b54',ink:'#133c30',accent:'#f0a460'},
 {name:'Bluebird Grove',flora:'Bluebells & silver birch',fauna:'Bluebirds',icon:'🐦',flower:'🪻',sky:'#c9e8fb',land:'#396e97',ink:'#1d4265',accent:'#e7af4f'},
 {name:'Lavender Vale',flora:'Lavender & rosemary',fauna:'Honeybees',icon:'🐝',flower:'🪻',sky:'#ead8fa',land:'#6f62a4',ink:'#403263',accent:'#ffd48e'},
 {name:'Foxglove Trail',flora:'Foxgloves & briars',fauna:'Rabbits',icon:'🐇',flower:'🌷',sky:'#f5d3e9',land:'#9f4d75',ink:'#592d4b',accent:'#f2be66'},
 {name:'Butterfly Meadow',flora:'Milkweed & coneflowers',fauna:'Monarch butterflies',icon:'🦋',flower:'🌺',sky:'#ffe2b5',land:'#a25c35',ink:'#592d20',accent:'#ffe37e'},
 {name:'Heron Marsh',flora:'Lotus & cattails',fauna:'Herons and frogs',icon:'🐸',flower:'🪷',sky:'#b7e1e3',land:'#28677e',ink:'#153b50',accent:'#f3c57a'},
 {name:'Rose Arbor',flora:'Climbing roses & ivy',fauna:'Songbirds',icon:'🐦',flower:'🌹',sky:'#f9cfda',land:'#a44758',ink:'#572531',accent:'#f7d09e'},
 {name:'Moon Orchid Garden',flora:'Orchids & silver ferns',fauna:'Moths',icon:'🦋',flower:'🌸',sky:'#c8c4fa',land:'#514887',ink:'#27264d',accent:'#e7cf9c'},
 {name:'Firefly Thicket',flora:'Night jasmine & ivy',fauna:'Fireflies',icon:'✨',flower:'🌼',sky:'#c3dfbb',land:'#325d37',ink:'#1b3e28',accent:'#f3ec79'},
 {name:'Copperwood Canopy',flora:'Maple & amber leaves',fauna:'Red squirrels',icon:'🐿️',flower:'🍁',sky:'#f1d6a1',land:'#9d513a',ink:'#603323',accent:'#ffd28c'},
 {name:'Crystal Creek',flora:'Watercress & willow',fauna:'Otters',icon:'🦦',flower:'🌿',sky:'#b9e5f5',land:'#246c8c',ink:'#16445b',accent:'#e6f3ba'},
 {name:'Snowdrop Copse',flora:'Snowdrops & winter pine',fauna:'White hares',icon:'🐇',flower:'❄️',sky:'#e2eff7',land:'#678eab',ink:'#244b69',accent:'#f9d38e'},
 {name:'Golden Sunflower Pass',flora:'Sunflowers & goldenrod',fauna:'Finches',icon:'🐦',flower:'🌻',sky:'#ffe5a5',land:'#ab7b2e',ink:'#513711',accent:'#fae875'},
 {name:'Emerald Rainforest',flora:'Monstera & heliconia',fauna:'Toucans',icon:'🦜',flower:'🌺',sky:'#b8e3c5',land:'#236e59',ink:'#174a39',accent:'#ffab85'},
 {name:'Waterlily Lagoon',flora:'Waterlilies & reeds',fauna:'Dragonflies',icon:'🪰',flower:'🪷',sky:'#b0e6df',land:'#2b7b7d',ink:'#17505b',accent:'#f8d098'},
 {name:'Starlit Briar',flora:'Night-blooming flowers',fauna:'Owls',icon:'🦉',flower:'🌙',sky:'#c3c7e8',land:'#484b84',ink:'#262d57',accent:'#ffe1ab'},
 {name:'Aurora Conservatory',flora:'Iridescent orchids',fauna:'Hummingbirds',icon:'🐦',flower:'🌸',sky:'#d2ecdf',land:'#458fa4',ink:'#234c58',accent:'#d9b1f8'},
 {name:'Evergreen Sanctuary',flora:'Ancient cedar & rare blossoms',fauna:'Deer',icon:'🦌',flower:'🌲',sky:'#d0e8bb',land:'#347252',ink:'#163d30',accent:'#fff1a4'}
].map(x=>Object.freeze(x)));
export const ROAD_ENCOUNTERS=Object.freeze([
 {kind:'bloom',name:'Bloom Walk',icon:'🌼',description:'A sunny, relaxed stretch with room to breathe'},
 {kind:'wildlife',name:'Wildlife Watch',icon:'🐇',description:'Meet a garden visitor on your route'},
 {kind:'creek',name:'Creek Crossing',icon:'💧',description:'Find your rhythm beside the water'},
 {kind:'orchid',name:'Rare Flower',icon:'🌸',description:'An uncommon flower marks a special stop'},
 {kind:'twilight',name:'Twilight Trail',icon:'🌙',description:'A darker, more focused challenge'},
 {kind:'firefly',name:'Firefly Rush',icon:'✨',description:'A brisk little stretch with extra sparkle'},
 {kind:'wild',name:'Wild Growth',icon:'🍃',description:'A rugged stretch of the trail'},
 {kind:'sanctuary',name:'Quiet Sanctuary',icon:'🕊️',description:'A gentler rest between challenges'}
].map(x=>Object.freeze(x)));
// Earned trail souvenirs are visual achievements derived from verified server
// clears. Existing server campaign-bonus points remain authoritative.
export function roadTrailKeepsake(level){
 const v=clampRoadLevel(level);
 if(v%250===0)return {icon:'🏛️',name:'Garden Gate',description:'Complete this whole region'};
 if(v%50===0)return {icon:'🏆',name:'Golden Bloom',description:'Complete 50 garden steps'};
 if(v%25===0)return {icon:'🌷',name:'Bloom Arch',description:'Complete 25 garden steps'};
 if(v%5===0)return {icon:'✦',name:'Trail Star',description:'Complete five garden steps'};
 return null;
}
export function roadKeepsakes(cleared){
 const done=Math.max(0,Math.min(MYSTERY_ROAD_TOTAL,Math.trunc(Number(cleared)||0)));
 const last=Math.floor(done/5)*5;
 const next=Math.min(MYSTERY_ROAD_TOTAL,last+5);
 return {earned:Math.floor(done/5),
   last:last>0?{level:last,...roadTrailKeepsake(last)}:null,
   next:done>=MYSTERY_ROAD_TOTAL?null:{level:next,...roadTrailKeepsake(next)}};
}
export function clampRoadLevel(v){return Math.max(1,Math.min(MYSTERY_ROAD_TOTAL,Math.trunc(Number(v)||1)));}
export function roadRegion(level){return ROAD_REGIONS[Math.floor((clampRoadLevel(level)-1)/ROAD_REGION_SIZE)];}
export function roadRegionIndex(level){return Math.floor((clampRoadLevel(level)-1)/ROAD_REGION_SIZE);}
export function roadEncounter(level){
 const v=clampRoadLevel(level);
 if(v===MYSTERY_ROAD_TOTAL)return {kind:'crown',name:'Evergreen Crown',icon:'👑',description:'The final garden challenge'};
 if(v%ROAD_REGION_SIZE===0)return {kind:'gate',name:'Garden Gate',icon:'🏛️',description:'Conquer this region and open the next'};
 if(v%50===0)return {kind:'milestone',name:'Grand Bloom',icon:'🏆',description:'A major scenic milestone, with another garden to explore'};
 if(v%25===0)return {kind:'milestone',name:'Bloom Arch',icon:'🌷',description:'A floral landmark'};
 return ROAD_ENCOUNTERS[(v*7+Math.floor(v/11))%ROAD_ENCOUNTERS.length];
}
export function roadProgress(cleared){
 const value=Math.max(0,Math.min(MYSTERY_ROAD_TOTAL,Math.trunc(Number(cleared)||0)));
 return {cleared:value,total:MYSTERY_ROAD_TOTAL,percent:Math.round(value*10000/MYSTERY_ROAD_TOTAL)/100,
  chapter:Math.min(ROAD_REGIONS.length-1,Math.floor(value/ROAD_REGION_SIZE)),
  nextGate:Math.min(MYSTERY_ROAD_TOTAL,(Math.floor(value/ROAD_REGION_SIZE)+1)*ROAD_REGION_SIZE)};
}
export function roadWindow(level,start=null){
 const current=clampRoadLevel(level);
 const low=start==null?Math.floor((current-1)/25)*25+1:Math.floor((clampRoadLevel(start)-1)/25)*25+1;
 return Array.from({length:25},(_,i)=>low+i).filter(n=>n<=MYSTERY_ROAD_TOTAL);
}
const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
const button=(cls,txt)=>{const el=create('button',cls,txt);el.type='button';return el;};
const count=v=>Math.max(0,Number(v)||0).toLocaleString('en-US');
function pointsForWindow(numbers){
 return numbers.map((n,i)=>{const row=Math.floor(i/5),col=row%2===0?i%5:4-i%5;
  return {n,x:10+col*20,y:11+row*19};});
}
export function mountNatureRoad(container,{onPlay}={}){
 if(!container)return {update:()=>{},destroy:()=>{}};
 const root=create('section','mahjong-nature-road');
 root.id='mahjong-nature-road';root.setAttribute('aria-label','Mystery Road visual campaign map');
 root.innerHTML=`
 <header class="nature-road-header"><div class="nature-road-identity"><span class="nature-road-kicker">THE LIVING MYSTERY ROAD · 20 GARDENS</span>
 <h3 id="nature-road-region" tabindex="-1">Daisy Lane</h3><p id="nature-road-flora"></p></div>
 <span id="nature-road-creature" class="nature-road-creature" aria-hidden="true">🦋</span></header>
 <div class="nature-road-dashboard"><div><span>YOUR JOURNEY</span><strong id="nature-road-progress">0 / 5,000</strong></div>
 <div><span>WORLD COMPLETE</span><strong id="nature-road-percent">0%</strong></div>
 <div><span>QUALIFYING STREAK</span><strong id="nature-road-streak">0</strong></div>
 <div><span>NEXT GARDEN GATE</span><strong id="nature-road-next">250</strong></div></div>
 <progress id="nature-road-world-progress" max="5000" value="0" aria-label="Mystery Road world completion"></progress>
 <div class="nature-road-garden-title"><strong>YOUR ILLUSTRATED WORLD MAP</strong><small>One picture per region · 20 unique areas</small></div>
 <div class="nature-road-area-picker"><button type="button" id="nature-road-area-prev" aria-label="Previous garden">‹</button>
 <label for="nature-road-area-select">AREA <select id="nature-road-area-select" aria-label="Choose illustrated region"></select></label>
 <button type="button" id="nature-road-area-next" aria-label="Next garden">›</button></div>
 <div class="nature-road-regions" id="nature-road-regions" role="group" aria-label="Browse botanical regions"></div>
 <div class="nature-road-stage-title"><div><span class="nature-road-kicker">WINDING GARDEN TRAIL</span>
 <strong id="nature-road-stage-heading">Levels 1–25</strong><small id="nature-road-stage-message">The next stepping stone is glowing.</small></div>
 <div class="nature-road-stage-nav"><button id="nature-road-prev" type="button" aria-label="View previous 25 levels">←</button>
 <button id="nature-road-home" type="button">My level</button>
 <button id="nature-road-next-page" type="button" aria-label="View next 25 levels">→</button></div></div>
 <div class="nature-road-landscape" data-picture="0"><div id="nature-road-picture-host" class="nature-road-picture" aria-hidden="true"></div>
 <svg id="nature-road-trail" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
 <path id="nature-road-trail-shadow" d="" fill="none" stroke-width="2.8" stroke-linecap="round"/>
 <path id="nature-road-trail-line" d="" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="2.6 1.5"/>
 <path id="nature-road-trail-lit" d="" fill="none" stroke-width="2.6" stroke-linecap="round"/></svg>
 <div id="nature-road-nodes" class="nature-road-nodes" role="group" aria-label="Levels along the illustrated trail"></div>
 <span class="nature-road-map-stamp" aria-hidden="true">✦ FOLLOW THE GLOWING TRAIL ✦</span></div>
 <div class="nature-road-rewards" role="status" aria-live="polite"><span class="nature-road-reward-icon" aria-hidden="true">🎁</span>
 <span id="nature-road-reward-label">Your first Trail Star is waiting</span><strong id="nature-road-reward-count">0 earned</strong></div>
 <div class="nature-road-spotlight" role="status" aria-live="polite"><span id="nature-road-spotlight-icon" aria-hidden="true">🌼</span>
 <div><strong id="nature-road-spotlight-name">Level 1 · Bloom Walk</strong><small id="nature-road-spotlight-description">Choose a stage on the map.</small></div></div>
 <button type="button" id="nature-road-play" class="nature-road-play">▶ PLAY CURRENT LEVEL</button>
 <p class="nature-road-footnote">Completed paths bloom. Future spaces can be previewed, but cannot be skipped. Garden art does not change tile matching rules or account progress.</p>`;
 container.append(root);
 const $=sel=>root.querySelector(sel);
 let snapshot={level:1,cleared:0,streak:0,run:null},windowStart=1,focusLevel=1,initialized=false;
 const regionButtons=[];
 const areaSelect=$('#nature-road-area-select');
 let drawnRegion=-1;
 ROAD_REGIONS.forEach((r,i)=>{
  const b=button('nature-road-region-button',r.icon+' '+r.name);
  b.setAttribute('aria-label',r.name+', levels '+(i*250+1)+' through '+((i+1)*250));
  b.dataset.index=String(i);
  b.addEventListener('click',()=>{windowStart=i*250+1;focusLevel=windowStart;render();});
  $('#nature-road-regions').append(b);regionButtons.push(b);
  const opt=create('option','',String(i+1).padStart(2,'0')+' · '+r.name);
  opt.value=String(i);areaSelect.append(opt);
 });
 function navigateToRegion(index){
  const value=Math.max(0,Math.min(ROAD_REGIONS.length-1,Number(index)||0));
  windowStart=value*ROAD_REGION_SIZE+1;focusLevel=windowStart;
  render();
 }
 areaSelect.addEventListener('change',()=>navigateToRegion(areaSelect.value));
 $('#nature-road-area-prev').addEventListener('click',()=>navigateToRegion(Number(areaSelect.value)-1));
 $('#nature-road-area-next').addEventListener('click',()=>navigateToRegion(Number(areaSelect.value)+1));
 function selectStage(level){
  focusLevel=clampRoadLevel(level);
  const region=roadRegion(focusLevel),kind=roadEncounter(focusLevel),isCurrent=focusLevel===snapshot.level;
  $('#nature-road-spotlight-icon').textContent=kind.icon;
  $('#nature-road-spotlight-name').textContent='Level '+count(focusLevel)+' · '+kind.name;
  $('#nature-road-spotlight-description').textContent=kind.description+' · '+region.name+' · '+
   (focusLevel<=snapshot.cleared?'Already cleared':isCurrent?'Your current playable level':'Preview only: finish earlier levels first');
  const play=$('#nature-road-play');
  play.disabled=!isCurrent||snapshot.cleared>=MYSTERY_ROAD_TOTAL;
  play.textContent=snapshot.cleared>=MYSTERY_ROAD_TOTAL?'🏆 ALL 5,000 LEVELS COMPLETE':
   isCurrent?(snapshot.run?'▶ CONTINUE LEVEL ':'▶ PLAY LEVEL ')+count(focusLevel):
   focusLevel<snapshot.level?'✓ ALREADY CLEARED':'🔒 UNLOCK BY PLAYING';
 }
 function render(){
  const focus=clampRoadLevel(focusLevel),region=roadRegion(focus),regionIndex=roadRegionIndex(focus);
  for(const [name,val] of [['--nature-sky',region.sky],['--nature-land',region.land],['--nature-ink',region.ink],['--nature-accent',region.accent]])
   root.style.setProperty(name,val);
  root.dataset.region=String(regionIndex);
  areaSelect.value=String(regionIndex);
  $('#nature-road-area-prev').disabled=regionIndex===0;
  $('#nature-road-area-next').disabled=regionIndex===ROAD_REGIONS.length-1;
  if(drawnRegion!==regionIndex){
   drawnRegion=regionIndex;
   const art=illustratedRegionMap(regionIndex,region);
   $('#nature-road-picture-host').replaceChildren(art);
   $('.nature-road-landscape').dataset.picture=String(regionIndex);
  }
  $('#nature-road-region').textContent=region.flower+' '+region.name;
  $('#nature-road-flora').textContent=region.flora+' · '+region.fauna;
  $('#nature-road-creature').textContent=region.icon;
  $('.nature-road-canopy-a').textContent=region.flower;
  $('.nature-road-canopy-b').textContent=region.icon;
  const progress=roadProgress(snapshot.cleared);
  $('#nature-road-progress').textContent=count(progress.cleared)+' / '+count(progress.total);
  $('#nature-road-percent').textContent=progress.percent.toFixed(2)+'%';
  $('#nature-road-streak').textContent=count(snapshot.streak);
  $('#nature-road-next').textContent=count(progress.nextGate);
  $('#nature-road-world-progress').value=progress.cleared;
  const keepsakes=roadKeepsakes(progress.cleared);
  $('#nature-road-reward-count').textContent=count(keepsakes.earned)+' earned';
  $('.nature-road-reward-icon').textContent=keepsakes.last?.icon||'🎁';
  $('#nature-road-reward-label').textContent=keepsakes.next?
   (keepsakes.last?'Last: '+keepsakes.last.name+' · ':'')+'Next reward: '+keepsakes.next.name+' at level '+count(keepsakes.next.level):
   'All Trail Stars and garden keepsakes earned!';
  root.dataset.rewardsEarned=String(keepsakes.earned);
  const currentRegion=roadRegionIndex(snapshot.level);
  regionButtons.forEach((b,i)=>{b.classList.toggle('is-current',i===currentRegion);b.classList.toggle('is-preview',i===regionIndex);
   b.classList.toggle('is-cleared',(i+1)*250<=snapshot.cleared);
   b.setAttribute('aria-pressed',String(i===regionIndex));});
  windowStart=Math.max(1,Math.min(MYSTERY_ROAD_TOTAL-24,windowStart));
  const stages=roadWindow(snapshot.level,windowStart),points=pointsForWindow(stages);
  $('#nature-road-stage-heading').textContent='Levels '+count(stages[0])+'–'+count(stages[stages.length-1]);
  $('#nature-road-stage-message').textContent=region.name+' · '+region.flora+' · '+region.fauna;
  $('#nature-road-prev').disabled=windowStart===1;
  $('#nature-road-next-page').disabled=windowStart>=MYSTERY_ROAD_TOTAL-24;
  const path=points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');
  $('#nature-road-trail-shadow').setAttribute('d',path);$('#nature-road-trail-line').setAttribute('d',path);
  const glowing=points.filter(p=>p.n<=snapshot.cleared||p.n===snapshot.level);
  const lit=glowing.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');
  $('#nature-road-trail-lit').setAttribute('d',lit);
  root.dataset.trailLit=String(glowing.length);
  const host=$('#nature-road-nodes');host.replaceChildren();
  for(const p of points){
   const encounter=roadEncounter(p.n),done=p.n<=snapshot.cleared,current=p.n===snapshot.level;
   const b=button('nature-road-node',encounter.icon);
   b.style.setProperty('--nx',p.x+'%');b.style.setProperty('--ny',p.y+'%');
   b.dataset.state=done?'cleared':current?'current':'locked';
   b.dataset.kind=encounter.kind;b.dataset.level=String(p.n);
   const souvenir=roadTrailKeepsake(p.n);
   if(souvenir){b.dataset.reward=done?'earned':'upcoming';
    b.setAttribute('title',souvenir.name+' · '+(done?'Earned':'Unlock by clearing level '+p.n));}
   b.setAttribute('aria-label','Level '+p.n+', '+encounter.name+', '+(done?'cleared':current?'play now':'locked'));
   b.setAttribute('aria-pressed',String(p.n===focusLevel));b.title='';
   const number=create('small','',count(p.n));b.append(number);
   if(souvenir){const badge=create('span','nature-road-node-reward',done?'✓':'✦');
    badge.setAttribute('aria-hidden','true');b.append(badge);}
   b.addEventListener('click',()=>{focusLevel=p.n;render();});
   host.append(b);
  }
  selectStage(focusLevel);
 }
 $('#nature-road-prev').addEventListener('click',()=>{windowStart=Math.max(1,windowStart-25);focusLevel=windowStart;render();});
 $('#nature-road-next-page').addEventListener('click',()=>{windowStart=Math.min(MYSTERY_ROAD_TOTAL-24,windowStart+25);focusLevel=windowStart;render();});
 $('#nature-road-home').addEventListener('click',()=>{focusLevel=snapshot.level;windowStart=roadWindow(snapshot.level)[0];render();});
 $('#nature-road-play').addEventListener('click',()=>{if(focusLevel!==snapshot.level||snapshot.cleared>=MYSTERY_ROAD_TOTAL)return;onPlay?.(snapshot);});
 function update(next={}){
  const nextLevel=clampRoadLevel(next.level||1);
  const initial=!initialized;initialized=true;
  const changed=nextLevel!==snapshot.level;
  snapshot={level:nextLevel,cleared:Math.max(0,Math.min(5000,Number(next.cleared)||0)),
   streak:Math.max(0,Number(next.streak)||0),run:next.run||null};
  // Preserve exploration while new score updates arrive; advance the trail only
  // when the player actually moves to a different campaign level.
  if(initial||changed){focusLevel=nextLevel;windowStart=roadWindow(nextLevel)[0];}
  render();
 }
 update({});
 return {root,update,destroy:()=>root.remove()};
}
