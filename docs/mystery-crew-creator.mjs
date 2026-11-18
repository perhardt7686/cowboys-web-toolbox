/* Mystery Crew Creator
 * New product and visuals, independent of the previous character creator.
 * Explicitly local-only user state; zero remote writes, no fake server awards.
 */
const KEY='cowboy-mystery-crew-creator-v1';
const app=document.getElementById('mc-app'),$=id=>document.getElementById(id);
const themes=['#ef792f','#69a55e','#315fa2','#cc5654','#6a5588','#a87640','#2c8e97','#e3c36c'];
const skins=['#f0b989','#c98760','#ab6948','#6e432e','#f6d2ae','#d9a27b'];
const hairs=['#904b28','#342e32','#cd8c32','#ab4232','#6f4f37','#302b46'];
const pants=['#315b93','#355b6b','#644f78','#567158'];
const petColors={dog:'#b77a43',cat:'#8b879a',ghost:'#b4e5c9',owl:'#b4a084',fox:'#d88c55'};
const starter=(n=1)=>({id:'crew-'+n,name:['Scout','Juniper','Finn','Riley','Atlas','Wren'][(n-1)%6],skin:skins[(n-1)%skins.length],
 hair:hairs[(n-1)%hairs.length],shirt:themes[(n-1)%themes.length],pants:pants[(n-1)%pants.length],
 outfit:'detective',hat:'none',gear:'none',pet:'dog',vehicle:'van',scene:'sunlit',expression:'smile'});
const items=[
{id:'detective',name:'Detective Coat',type:'outfits',color:'#ef792f',cost:0,art:'coat'},
{id:'explorer',name:'Explorer Vest',type:'outfits',color:'#6c9354',cost:0,art:'vest'},
{id:'viking',name:'Viking Armor',type:'outfits',color:'#9d7859',cost:110,art:'armor'},
{id:'pilot',name:'Pilot Jacket',type:'outfits',color:'#855b39',cost:90,art:'jacket'},
{id:'space',name:'Space Suit',type:'outfits',color:'#ece9df',cost:130,art:'space'},
{id:'knight',name:'Knight Armor',type:'outfits',color:'#8da9b7',cost:140,art:'knight'},
{id:'outdoors',name:'Outdoor Plaid',type:'outfits',color:'#b54037',cost:0,art:'plaid'},
{id:'stealth',name:'Stealth Gear',type:'outfits',color:'#303d49',cost:100,art:'stealth'},
{id:'fedora',name:'Field Fedora',type:'hats',color:'#8d6741',cost:0,art:'hat'},
{id:'helmet',name:'Viking Helmet',type:'hats',color:'#b6a384',cost:75,art:'helmet'},
{id:'goggles',name:'Flying Goggles',type:'hats',color:'#7f7873',cost:65,art:'goggles'},
{id:'cap',name:'Camp Cap',type:'hats',color:'#2f8c9a',cost:0,art:'cap'},
{id:'binoculars',name:'Binoculars',type:'gear',color:'#344a59',cost:0,art:'binoculars'},
{id:'flashlight',name:'Adventure Torch',type:'gear',color:'#d39a4c',cost:40,art:'flashlight'},
{id:'compass',name:'Trail Compass',type:'gear',color:'#d2ae6e',cost:50,art:'compass'},
{id:'pack',name:'Explorer Pack',type:'gear',color:'#9b7856',cost:65,art:'pack'},
{id:'dog',name:'Clover the Hound',type:'pets',color:'#b77a43',cost:0,art:'dog'},
{id:'cat',name:'Moonbeam Cat',type:'pets',color:'#8b879a',cost:0,art:'cat'},
{id:'ghost',name:'Little Wisp',type:'pets',color:'#b4e5c9',cost:60,art:'ghost'},
{id:'owl',name:'Lookout Owl',type:'pets',color:'#b4a084',cost:75,art:'owl'},
{id:'fox',name:'Autumn Fox',type:'pets',color:'#d88c55',cost:95,art:'fox'},
{id:'van',name:'Mystery Van',type:'vehicles',color:'#2778a7',cost:0,art:'van'},
{id:'jeep',name:'Trail Jeep',type:'vehicles',color:'#8d9d62',cost:90,art:'jeep'},
{id:'camper',name:'Camp Wagon',type:'vehicles',color:'#d58f55',cost:115,art:'camper'},
{id:'sunlit',name:'Adventure Base',type:'studio',color:'#88c3df',cost:0,art:'sunlit'},
{id:'twilight',name:'Twilight Camp',type:'studio',color:'#53649a',cost:60,art:'twilight'},
{id:'autumn',name:'Autumn Hollow',type:'studio',color:'#c98f58',cost:70,art:'autumn'}
];
const itemById=new Map(items.map(x=>[x.id,x]));
const choices={outfits:'outfit',hats:'hat',gear:'gear',pets:'pet',vehicles:'vehicle',studio:'scene'};
const unlockedInitial=['detective','explorer','outdoors','fedora','cap','binoculars','dog','cat','van','sunlit'];
const fresh=()=>({version:1,crew:[starter()],active:'crew-1',coins:60,xp:0,unlocked:[...unlockedInitial],rewardedDesigns:[]});
function read(){
 try{const raw=localStorage.getItem(KEY);if(!raw)return fresh();
  const saved=JSON.parse(raw);if(saved?.version!==1||!Array.isArray(saved.crew)||!saved.crew.length)return fresh();
  const crew=saved.crew.slice(0,6).map((v,i)=>({...starter(i+1),...v,id:String(v.id||('crew-'+(i+1))).slice(0,30),name:String(v.name||'Crew member').slice(0,28)}));
  const allValid=(saved.unlocked||[]).filter(id=>itemById.has(id));
  return {version:1,crew,active:crew.some(x=>x.id===saved.active)?saved.active:crew[0].id,coins:Math.min(99999,Math.max(0,Number(saved.coins)||0)),xp:Math.min(999999,Math.max(0,Number(saved.xp)||0)),unlocked:[...new Set([...unlockedInitial,...allValid])],rewardedDesigns:Array.isArray(saved.rewardedDesigns)?saved.rewardedDesigns.slice(-250):[]};
 }catch{return fresh();}
}
let state=read(),savedSnapshot=JSON.stringify(state),view='character',filter='outfits',motion='idle',zoom=1,angle=0;
let draft=structuredClone(state);
function current(){return draft.crew.find(v=>v.id===draft.active)||draft.crew[0];}
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colorFor=(id)=>itemById.get(id)?.color||themes[0];
function icon(item){
 const k=item.art,base=item.color;
 let svg='';
 if(['coat','vest','jacket','plaid','stealth','space','armor','knight'].includes(k)){
  const trim=k==='plaid'?'#e8bf88':k==='space'?'#d3a24c':'#d5b184';
  svg='<path d="M47 32L62 25 77 38 92 25 110 32 136 61 119 78 109 67 110 143 48 143 47 67 35 78 17 61Z" fill="'+base+'" stroke="#292b35" stroke-width="6" stroke-linejoin="round"/>'+
  '<path d="M62 28L78 52 93 28 84 143 72 143Z" fill="'+trim+'" stroke="#44424a" stroke-width="3"/>'+
  '<path d="M52 87H66M90 87H104M80 62V130" fill="none" stroke="#382e38" stroke-width="4"/>';
  if(k==='armor'||k==='knight')svg+='<path d="M44 55L29 70 39 92 53 84M109 55L127 70 118 90 104 83" fill="#bcb5a0" stroke="#302e37" stroke-width="5"/>';
  if(k==='plaid')for(let x of [54,73,91,103])svg+='<path d="M'+x+' 45V134" stroke="#e1b7a0" stroke-width="2"/>';
  if(k==='space')svg+='<circle cx="80" cy="104" r="13" fill="#398fbe" stroke="#292b35" stroke-width="4"/>';
 }else if(['hat','helmet','goggles','cap'].includes(k)){
  svg='<path d="M23 92Q28 41 80 39Q130 41 135 92Z" fill="'+base+'" stroke="#312c35" stroke-width="7"/><path d="M12 92Q80 117 149 92" fill="none" stroke="#312c35" stroke-width="12"/>';
  if(k==='helmet')svg+='<path d="M39 70Q8 31 19 15L58 57M108 56L139 17Q149 40 121 75" fill="#ecd4a9" stroke="#332d35" stroke-width="6"/>';
  if(k==='goggles')svg+='<circle cx="57" cy="77" r="19" fill="#93bfd0" stroke="#34394a" stroke-width="7"/><circle cx="102" cy="77" r="19" fill="#93bfd0" stroke="#34394a" stroke-width="7"/>';
  if(k==='cap')svg+='<path d="M55 36L93 35 113 62 80 68Z" fill="#9ad4ca"/>';
 }else if(['dog','cat','ghost','owl','fox'].includes(k)){
  svg='<path d="M40 104Q23 61 50 44L76 64Q101 41 119 61L127 111Q84 143 40 104Z" fill="'+base+'" stroke="#302e38" stroke-width="6"/>'+
  '<path d="M47 59L28 24 65 47M100 46L128 23 121 66" fill="'+base+'" stroke="#302e38" stroke-width="6"/>'+
  '<circle cx="65" cy="83" r="11" fill="#fff5de"/><circle cx="101" cy="83" r="11" fill="#fff5de"/><circle cx="68" cy="85" r="5" fill="#343440"/><circle cx="98" cy="84" r="5" fill="#343440"/><ellipse cx="85" cy="107" rx="10" ry="7" fill="#493843"/>';
 }else if(['van','jeep','camper'].includes(k)){
  svg='<path d="M18 70L36 44H125L139 69 143 117H15Z" fill="'+base+'" stroke="#293545" stroke-width="6"/>'+
  '<path d="M38 50H120L129 77H25Z" fill="#9ed0d7" stroke="#293545" stroke-width="4"/>'+
  '<path d="M18 88H141" stroke="#e6b36e" stroke-width="11"/><circle cx="45" cy="118" r="14" fill="#334153" stroke="#e2dcbf" stroke-width="6"/><circle cx="119" cy="118" r="14" fill="#334153" stroke="#e2dcbf" stroke-width="6"/>';
 }else if(k==='flashlight')svg='<path d="M42 124L104 54 127 76 67 139Z" fill="#a28a65" stroke="#3c3436" stroke-width="6"/><path d="M103 51L128 24 155 51 127 79Z" fill="#f3d79c" stroke="#4c3e42" stroke-width="6"/>';
 else if(k==='compass')svg='<circle cx="80" cy="83" r="50" fill="#c69c62" stroke="#34333b" stroke-width="7"/><circle cx="80" cy="83" r="37" fill="#e7d8bb"/><path d="M80 36L100 85 80 130 59 84Z" fill="#486f91"/>';
 else if(k==='pack')svg='<path d="M35 60Q35 26 79 27Q126 26 127 60L121 140H39Z" fill="#b9966d" stroke="#38333d" stroke-width="7"/><path d="M47 88H116V121H47Z" fill="#d9b58c" stroke="#5a4b41" stroke-width="5"/>';
 else if(k==='binoculars')svg='<path d="M28 62L54 45 72 54 91 54 107 45 131 61 140 114 107 127 88 99 73 99 54 127 19 115Z" fill="#354d60" stroke="#2c3540" stroke-width="7"/><circle cx="49" cy="100" r="16" fill="#8caeb9"/><circle cx="113" cy="100" r="16" fill="#8caeb9"/>';
 else svg='<circle cx="80" cy="80" r="47" fill="'+base+'" stroke="#3d3946" stroke-width="6"/><path d="M38 80H123M80 38V122" stroke="#fff3d3" stroke-width="5"/>';
 return '<svg viewBox="0 0 160 160" aria-hidden="true" focusable="false">'+svg+'</svg>';
}
function portrait(member){
 const skin=member.skin,hair=member.hair,shirt=member.shirt;
 return '<svg viewBox="0 0 110 105" aria-hidden="true"><path fill="'+shirt+'" stroke="#323346" stroke-width="4" d="M17 110Q18 77 51 74Q87 73 97 110Z"/>'+
 '<path fill="'+skin+'" stroke="#323346" stroke-width="4" d="M26 33Q26 8 56 10Q88 9 89 35L86 68Q58 100 31 67Z"/>'+
 '<path fill="'+hair+'" stroke="#323346" stroke-width="4" d="M23 46Q9 14 38 10Q65 -12 81 9Q102 13 91 47Q81 28 67 30Q50 22 35 41Z"/>'+
 '<ellipse cx="45" cy="48" rx="8" ry="11" fill="white"/><ellipse cx="70" cy="48" rx="8" ry="11" fill="white"/>'+
 '<circle cx="48" cy="50" r="4" fill="#395474"/><circle cx="68" cy="50" r="4" fill="#395474"/>'+
 '<path d="M46 70Q58 82 72 69" fill="none" stroke="#6c4744" stroke-width="4"/></svg>';
}
function writeState(){
 try{localStorage.setItem(KEY,JSON.stringify(draft));state=structuredClone(draft);savedSnapshot=JSON.stringify(state);return true;}
 catch{$('mc-status').textContent='Browser storage unavailable. Keep this page open or enable local storage.';return false;}
}
function notice(s){$('mc-status').textContent=s;}
function updateScene(){
 const m=current(),actor=$('mc-actor'),scene=$('mc-scene');
 actor.style.setProperty('--shirt',m.shirt);actor.style.setProperty('--pants',m.pants);
 actor.style.setProperty('--skin',m.skin);actor.style.setProperty('--hair',m.hair);
 $('mc-pet').style.setProperty('--pet',petColors[m.pet]||petColors.dog);
 const stageMood={sunlit:'none',twilight:'hue-rotate(35deg) brightness(.84)',autumn:'sepia(.24) saturate(1.18)'}[m.scene]||'none';
 scene.style.filter=stageMood;
 $('mc-character-name').textContent=m.name;
 const scale=angle===90||angle===270?.74:1;
 const mirror=angle===180?-1:1;
 actor.setAttribute('transform','translate(405 85) translate(90 254) scale('+(zoom*scale*mirror)+' '+zoom+') translate(-90 -254)');
 const rear=angle===180;
 $('mc-head').style.filter=rear?'brightness(.76)':'none';
 $('mc-vehicle').style.filter=m.vehicle==='jeep'?'hue-rotate(94deg)':m.vehicle==='camper'?'hue-rotate(-26deg) saturate(.8)':'none';
 $('mc-hat').hidden=m.hat==='none';
 $('mc-mouth').setAttribute('d',m.expression==='curious'?'M78 133Q99 137 118 132':m.expression==='grin'?'M74 130Q96 167 128 130':'M75 133Q96 157 123 130');
 for(const b of document.querySelectorAll('.mc-views button'))b.setAttribute('aria-pressed',String((b.id==='mc-view-front'&&angle===0)||(b.id==='mc-view-side'&&angle===90)||(b.id==='mc-view-back'&&angle===180)));
}
function renderRoster(){
 const wrap=$('mc-roster');wrap.replaceChildren();
 for(const p of draft.crew){
  const btn=document.createElement('button');btn.type='button';btn.className='mc-portrait';btn.dataset.crewId=p.id;
  btn.setAttribute('aria-label','Choose '+p.name);btn.setAttribute('aria-pressed',String(p.id===draft.active));
  btn.innerHTML=portrait(p);wrap.append(btn);
 }
 $('mc-add').disabled=draft.crew.length>=6;
}
function renderColors(){
 const row=$('mc-swatches');row.replaceChildren();
 for(const color of themes){
  const b=document.createElement('button');b.type='button';b.className='mc-swatch';b.style.background=color;b.dataset.color=color;
  b.setAttribute('aria-label','Set jacket color '+color);b.setAttribute('aria-pressed',String(current().shirt===color));row.append(b);
 }
}
function setFilter(next){
 filter=next==='collections'?'collections':next==='character'?'outfits':next;
 if(!['outfits','hats','gear','pets','vehicles','collections','studio'].includes(filter))filter='outfits';
 $('mc-market-filter').value=filter==='collections'?'collections':filter;
 const labels={outfits:'Outfits',hats:'Hats',gear:'Adventure Gear',pets:'Pets',vehicles:'Vehicles',studio:'Backdrops',collections:'Unlockables'};
 $('mc-market-title').textContent=labels[filter];
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===next || (next==='collections'&&b.dataset.view==='collections')));
 for(const b of document.querySelectorAll('[data-jump]'))b.setAttribute('aria-pressed',String(b.dataset.jump===filter));
 renderCards();
}
function renderCards(){
 const panel=$('mc-cards');panel.replaceChildren();
 const category=filter==='collections'?items.filter(i=>i.cost>0):items.filter(i=>i.type===filter);
 for(const item of category){
  const owned=draft.unlocked.includes(item.id);
  const equipped=Object.entries(choices).some(([category,key])=>current()[key]===item.id);
  const card=document.createElement('button');card.type='button';card.className='mc-card';
  card.dataset.item=item.id;card.dataset.locked=String(!owned);
  const label=equipped?'✓ Equipped':owned?'Equip':'★ '+item.cost+' coins';
  const badge=equipped?'equipped':owned?'available':'locked';
  card.setAttribute('aria-label',item.name+'. '+(equipped?'Equipped':owned?'Equip':'Unlock for '+item.cost+' device coins'));
  card.innerHTML='<span class="mc-card-art">'+icon(item)+'</span><span class="mc-card-name">'+safe(item.name)+'</span><span class="mc-card-state '+badge+'">'+safe(label)+'</span>';
  panel.append(card);
 }
}
function renderStats(){
 $('mc-coins').textContent=draft.coins.toLocaleString();
 $('mc-rank').textContent='Level '+(1+Math.floor(draft.xp/300));
}
function render(){
 renderRoster();renderColors();renderCards();renderStats();updateScene();
 const dirty=JSON.stringify(draft)!==savedSnapshot;
 $('mc-save').textContent=dirty?'✓ Save Crew *':'✓ Save Crew';
}
function actionItem(item){
 const member=current(),isOwned=draft.unlocked.includes(item.id);
 if(!isOwned){
  if(draft.coins<item.cost){notice('Earn coins by saving new looks. '+item.name+' costs '+item.cost+' device coins; you have '+draft.coins+'.');return;}
  draft.coins-=item.cost;draft.unlocked.push(item.id);
  if(!writeState())return;
  notice('Unlocked '+item.name+' using device-only workshop coins.');
 }
 const key=choices[item.type];
 if(key){member[key]=item.id;
   if(item.type==='outfits')member.shirt=item.color;
 }
 notice('Previewing '+item.name+'. Press Save Crew to keep this look.');
 render();
}
document.addEventListener('click',event=>{
 const el=event.target.closest('button');if(!el)return;
 if(el.dataset.crewId){draft.active=el.dataset.crewId;render();return;}
 if(el.dataset.color){current().shirt=el.dataset.color;render();notice('Jacket color changed. Save to keep it.');return;}
 if(el.dataset.item){const i=itemById.get(el.dataset.item);if(i)actionItem(i);return;}
 if(el.dataset.view){view=el.dataset.view;setFilter(view);return;}
 if(el.dataset.jump){view=el.dataset.jump;setFilter(view);document.querySelector('.mc-market').scrollIntoView({behavior:'smooth',block:'nearest'});return;}
 if(el.dataset.motion){
  motion=el.dataset.motion;app.dataset.motion=motion;
  for(const b of document.querySelectorAll('[data-motion]'))b.setAttribute('aria-pressed',String(b.dataset.motion===motion));
  if(!draft.rewardedDesigns.includes('motion:'+motion)&&motion!=='idle'){
   draft.rewardedDesigns.push('motion:'+motion);draft.xp+=10;draft.coins+=5;writeState();renderStats();notice('Explored '+motion+'! +10 local XP, +5 local coins.');}
  return;
 }
 switch(el.id){
  case 'mc-add':{
   if(draft.crew.length>=6){notice('Your crew is full at six.');return;}
   const id='crew-'+Date.now().toString(36).slice(-7);
   const m=starter(draft.crew.length+1);m.id=id;draft.crew.push(m);draft.active=id;notice(m.name+' joined your crew. Save Crew to keep this character.');render();break;
  }
  case 'mc-fit':zoom=1;angle=0;updateScene();break;
  case 'mc-face':zoom=1.35;angle=0;updateScene();break;
  case 'mc-turn-left':angle=(angle+270)%360;updateScene();break;
  case 'mc-turn-right':angle=(angle+90)%360;updateScene();break;
  case 'mc-view-front':angle=0;updateScene();break;
  case 'mc-view-side':angle=90;updateScene();break;
  case 'mc-view-back':angle=180;updateScene();break;
  case 'mc-zoom-in':zoom=Math.min(1.5,Math.round((zoom+.1)*100)/100);updateScene();break;
  case 'mc-zoom-out':zoom=Math.max(.8,Math.round((zoom-.1)*100)/100);updateScene();break;
  case 'mc-save':{
   const design=draft.crew.map(m=>[m.id,m.shirt,m.outfit,m.hat,m.gear,m.pet,m.vehicle,m.scene].join(':')).join('|');
   if(!draft.rewardedDesigns.includes('look:'+design)){
    draft.rewardedDesigns.push('look:'+design);draft.xp+=25;draft.coins+=15;
   }
   if(writeState()){notice('Saved on this device. +25 XP and 15 coins for each new look; no shared account sync yet.');render();}
   break;
  }
  case 'mc-help':$('mc-info').showModal();break;
  case 'mc-info-close':$('mc-info').close();break;
 }
});
$('mc-market-filter').addEventListener('change',e=>{view=e.target.value;setFilter(view);});
window.addEventListener('beforeunload',e=>{
 if(JSON.stringify(draft)!==savedSnapshot){e.preventDefault();e.returnValue='';}
});
const params=new URLSearchParams(location.search);
if(params.get('preview')==='1')notice('Design preview: device-local characters only. No family account data is loaded or changed.');
app.dataset.motion='idle';setFilter('character');render();
