/* Mystery Crew Creator: family-account sync is server-authoritative. 
 * The local-only preview fixture works only on localhost test builds. */
import {connectMysteryCrew} from './mystery-crew-sync.mjs?v=account1';
const KEY='cowboy-mystery-crew-creator-v1';
const isPreview=new URLSearchParams(location.search).get('preview')==='1'&&['localhost','127.0.0.1'].includes(location.hostname);
let account=null,accountReady=isPreview,revision=0,busy=false;
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
 if(!isPreview)return fresh();
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
 if(!isPreview)return false;
 try{localStorage.setItem(KEY,JSON.stringify(draft));state=structuredClone(draft);savedSnapshot=JSON.stringify(state);return true;}
 catch{$('mc-status').textContent='Browser storage unavailable. Keep this page open or enable local storage.';return false;}
}
function notice(s){$('mc-status').textContent=s;}
function lockEditor(lock){
 for(const element of document.querySelectorAll('.mc-app button,.mc-app select'))element.disabled=lock;
 $('mc-help').disabled=false;
}
function syncServer(data,{preserveDraft=false}={}){
 if(!data||!Array.isArray(data.crew)||!data.crew.length)throw new Error('Family character data was missing.');
 revision=Number(data.revision)||0;
 const normalized={version:1,crew:data.crew,active:data.active,coins:data.coins,xp:data.xp,
   unlocked:data.unlocked,rewardedDesigns:data.rewardedDesigns};
 state=structuredClone(normalized);savedSnapshot=JSON.stringify(state);
 if(preserveDraft){
   draft.coins=normalized.coins;draft.xp=normalized.xp;draft.unlocked=[...normalized.unlocked];
   draft.rewardedDesigns=[...normalized.rewardedDesigns];
 }else draft=structuredClone(state);
 render();
}
async function commitRPC(name,args,{preserveDraft=false}={}){
 if(!accountReady||!account)throw new Error('Log in to save your family crew.');
 if(busy)throw new Error('A save is already running.');
 busy=true;
 try{
   const result=await account.call(name,args);
   syncServer(result,{preserveDraft});
   window.dispatchEvent(new CustomEvent('mystery-crew-saved',{detail:{account:true}}));
   return result;
 }catch(error){
   if(error?.code==='40001')notice('Your character was updated on another device. Reload this page before saving again.');
   throw error;
 }finally{busy=false;}
}
async function initializeAccount(){
 if(isPreview){notice('Local browser test preview. No real family records are changed.');return;}
 lockEditor(true);
 notice('Connecting your family account and loading your crew…');
 try{
   account=await connectMysteryCrew();
   accountReady=true;
   syncServer(account.initial);
   const dot=document.querySelector('.mc-save-indicator');
   if(dot){dot.title='Saved to your approved family account';dot.innerHTML='FAMILY ACCOUNT <b>● SYNCED</b>';}
   notice('Your crew is connected to your family account. Changes sync across your devices when saved.');
   lockEditor(false);
   account.client.auth.onAuthStateChange(event=>{
     if(event==='SIGNED_OUT'){accountReady=false;lockEditor(true);notice('Signed out. Open the Family Message Board to sign in again.');}
   });
 }catch(error){
   accountReady=false;lockEditor(true);
   const reason=error?.code==='LOGIN_REQUIRED'?'Please sign in on the Family Message Board first.':(error?.message||'Connection unavailable');
   notice(reason+' No changes can be saved while disconnected.');
   const link=document.createElement('a');
   link.href='./community.html';link.textContent='Sign in to Family Message Board';link.className='mc-signin-link';
   $('mc-status').append(document.createTextNode(' '),link);
 }
}

/* Authored, item-specific character overlays. Each accessory has its own
   silhouette instead of tinting a generic coat or pretending it is equipped. */
function renderWearables(member){
 const outfitArt={
 detective:'<path d="M43 184L64 197 78 229 92 198 128 185 142 210 112 226 117 314 60 319 67 226Z" fill="#8a6a46" opacity=".88" stroke="#38303b" stroke-width="6"/><path d="M66 195L80 229 95 198 M83 226L90 316" fill="none" stroke="#f2d3a3" stroke-width="5"/>',
 explorer:'<path d="M40 186L66 194 85 218 110 192 133 185 133 306 44 308Z" fill="#537444" stroke="#313a30" stroke-width="6"/><path d="M53 241H75V263H53Z M104 243H125V267H104Z" fill="#b4a06b" stroke="#354333" stroke-width="4"/><path d="M87 226V306" stroke="#e8c47e" stroke-width="4"/>',
 viking:'<path d="M42 177L62 191 118 190 142 178 156 215 140 248 127 309 50 309 32 238 25 213Z" fill="#93775c" stroke="#30313e" stroke-width="8"/><path d="M48 192L24 225 32 246 64 228 M128 190L157 220 147 249 118 230" fill="#c9a575" stroke="#3c3941" stroke-width="8"/><path d="M67 212L113 213 118 270 65 271Z" fill="#748b94" stroke="#333641" stroke-width="5"/>',
 pilot:'<path d="M37 192L57 180 77 199 113 199 135 181 152 196 134 320 39 321Z" fill="#785435" stroke="#35303a" stroke-width="8"/><path d="M60 185L78 228 92 203 113 229 130 184" fill="none" stroke="#d9b07a" stroke-width="8"/><path d="M44 238H70 M108 238H132" stroke="#ce985f" stroke-width="5"/>',
 space:'<path d="M26 200Q93 170 153 200L163 289 136 331 42 331 15 291Z" fill="#eee9d9" stroke="#384256" stroke-width="8"/><path d="M44 218H130V291H44Z" fill="#d8dfe3" stroke="#5d7a91" stroke-width="5"/><circle cx="89" cy="250" r="17" fill="#4e98b0" stroke="#d3ab48" stroke-width="6"/><path d="M43 309H134" stroke="#d89c53" stroke-width="7"/>',
 knight:'<path d="M37 188L89 175 146 188 150 307 124 332 55 333 31 308Z" fill="#aeb7b9" stroke="#434956" stroke-width="8"/><path d="M45 205L25 216 35 263 60 254 M131 205L161 217 148 265 121 251" fill="#d3d7d7" stroke="#434956" stroke-width="6"/><path d="M87 207V316 M59 236H120 M57 289H127" stroke="#697787" stroke-width="6"/>',
 outdoors:'<path d="M39 184L68 186 87 209 109 183 138 186 151 305 40 317Z" fill="#c64534" stroke="#35303c" stroke-width="7"/><path d="M49 206H141 M47 248H142 M44 289H147 M66 186V310 M101 186V317 M129 187V310" stroke="#293c41" stroke-width="8" opacity=".9"/><path d="M49 219H140 M53 265H144" stroke="#ecb88c" stroke-width="3"/>',
 stealth:'<path d="M35 183L81 186 127 183 154 209 143 308 39 312 24 217Z" fill="#303d49" stroke="#202a37" stroke-width="8"/><path d="M54 208H124V278H54Z" fill="#3c5160" stroke="#1b2836" stroke-width="4"/><path d="M42 237H65 M112 237H143 M64 305H119" stroke="#9cacb5" stroke-width="5"/>'
 };
 $('mc-outfit-details').innerHTML=outfitArt[member.outfit]||outfitArt.detective;
 const gearArt={
 none:'',binoculars:'<g transform="translate(47 253)"><path d="M0 13L17 0 34 12 47 12 63 0 79 13 78 49 56 53 38 35 22 53 0 46Z" fill="#354f5b" stroke="#27313a" stroke-width="5"/><circle cx="17" cy="42" r="10" fill="#8ab1bb"/><circle cx="63" cy="42" r="10" fill="#8ab1bb"/></g>',
 flashlight:'<path d="M25 269L53 286 26 348 5 340Z" fill="#d09a53" stroke="#38323a" stroke-width="6"/><path d="M28 271L59 271 63 285 32 290Z" fill="#f5d7a0" stroke="#4d4444" stroke-width="5"/>',
 compass:'<g transform="translate(107 258)"><circle cx="12" cy="12" r="17" fill="#d5ad74" stroke="#453e3d" stroke-width="5"/><path d="M12 -1L18 12 12 27 5 12Z" fill="#386d87"/></g>',
 pack:'<path d="M123 203L159 213 174 288 149 305 135 267Z" fill="#95734f" stroke="#41383a" stroke-width="7"/><path d="M153 238V284" stroke="#e3c69a" stroke-width="6"/>'
 };
 $('mc-gear-detail').innerHTML=gearArt[member.gear]||'';
 const hatArt={
 none:'',fedora:'<path d="M27 34Q85 -14 161 27L156 52Q92 66 28 50Z" fill="#9a6235" stroke="#342d35" stroke-width="9"/><path d="M17 48Q91 72 169 48" fill="none" stroke="#4c352d" stroke-width="14"/>',
 helmet:'<path d="M30 52Q35 -16 94 -20Q156 -12 164 58L150 74 35 71Z" fill="#b7b6a6" stroke="#333746" stroke-width="8"/><path d="M45 28Q13 -20 6 -35Q-7 5 48 46M137 29Q174 -17 180 -35Q191 0 151 47" fill="#e7d2a8" stroke="#3b3438" stroke-width="8"/>',
 goggles:'<path d="M20 20Q89 -12 163 21L159 41Q92 56 20 40Z" fill="#735c40" stroke="#343542" stroke-width="7"/><circle cx="64" cy="25" r="24" fill="#83bcd1" stroke="#423d42" stroke-width="8"/><circle cx="126" cy="25" r="23" fill="#83bcd1" stroke="#423d42" stroke-width="8"/>',
 cap:'<path d="M27 46Q38 -8 91 -13Q150 -5 158 51L39 67Z" fill="#338e95" stroke="#323748" stroke-width="8"/><path d="M71 52Q135 41 178 57Q164 80 92 75Z" fill="#197587" stroke="#353444" stroke-width="6"/>'
 };
 const hat=$('mc-hat');hat.innerHTML=hatArt[member.hat]||'';hat.style.display=member.hat==='none'?'none':'inline';
}
function renderPetSpecies(member){
 const group=$('mc-pet'),p=member.pet;
 const source={
 dog:'<path d="M26 123Q2 87 15 50Q12 18 47 15L68 39Q92 3 114 24L120 48Q141 71 128 122Z" fill="var(--pet)" stroke="#332d32" stroke-width="8"/><path d="M21 43Q1 14 20 6L57 36Z M98 35Q134 3 142 19L125 63Z" fill="var(--pet)" stroke="#332d32" stroke-width="7"/><path d="M36 91Q72 65 111 92L109 128Q71 145 37 124Z" fill="#f9edd5" stroke="#43343a" stroke-width="6"/>',
 cat:'<path d="M30 128L33 37 14 6 58 38Q86 27 106 39L143 10 132 63 134 128Z" fill="var(--pet)" stroke="#352f3e" stroke-width="8"/><path d="M46 118Q74 100 123 119" fill="none" stroke="#e6d9cc" stroke-width="7"/><path d="M19 27L36 50 50 38 M119 40L137 27 130 57" fill="#d7b6ae"/>',
 ghost:'<path d="M16 130Q13 76 28 48Q45 21 81 22Q124 20 138 68L140 139 117 120 96 140 76 122 57 142 39 124Z" fill="#c8f2d5" stroke="#526b65" stroke-width="7"/><path d="M23 110Q64 124 126 105" fill="none" stroke="#dffbed" stroke-width="6"/>',
 owl:'<path d="M28 132L30 43 12 19 53 41Q83 23 107 41L145 18 133 57 138 134Z" fill="var(--pet)" stroke="#3d3442" stroke-width="8"/><path d="M42 101Q80 78 123 102L123 137 43 137Z" fill="#e9dbc0"/><path d="M78 105L88 118 97 104Z" fill="#e9a35b"/>',
 fox:'<path d="M28 128L26 67 10 11 59 45Q82 30 106 42L145 11 135 74 137 130Z" fill="var(--pet)" stroke="#3a2e33" stroke-width="8"/><path d="M28 91L86 129 133 91 118 139 45 143Z" fill="#f7e6d4" stroke="#35303e" stroke-width="4"/><path d="M47 66Q86 51 121 65" fill="none" stroke="#f5d4ac" stroke-width="5"/>'
 };
 const eyes=p==='owl'?'<circle cx="51" cy="78" r="24" fill="#f3ecd5"/><circle cx="103" cy="78" r="24" fill="#f3ecd5"/>':'<ellipse cx="50" cy="72" rx="10" ry="12" fill="#fff"/><ellipse cx="98" cy="72" rx="10" ry="12" fill="#fff"/>';
 group.innerHTML='<ellipse cx="72" cy="135" rx="83" ry="15" fill="#503f38" opacity=".18"/>'+(source[p]||source.dog)+eyes+
  '<circle cx="55" cy="75" r="5" fill="#2b333a"/><circle cx="96" cy="75" r="5" fill="#2b333a"/>'+
  (p==='ghost'?'<ellipse cx="77" cy="104" rx="8" ry="13" fill="#657c71"/>':p==='owl'?'<path d="M73 95L87 110 98 93Z" fill="#eaa95e"/>':'<ellipse cx="77" cy="98" rx="11" ry="8" fill="#3e3135"/><path d="M62 114Q79 129 97 113" fill="none" stroke="#513636" stroke-width="5"/>')+
  '<path d="M27 128L14 143 M112 130L124 143" stroke="#e6ddc4" stroke-width="12" stroke-linecap="round"/>';
}

function updateScene(){
 const m=current(),actor=$('mc-actor'),scene=$('mc-scene');
 actor.style.setProperty('--shirt',m.shirt);actor.style.setProperty('--pants',m.pants);
 actor.style.setProperty('--skin',m.skin);actor.style.setProperty('--hair',m.hair);
 $('mc-pet').style.setProperty('--pet',petColors[m.pet]||petColors.dog);
 renderWearables(m);
 renderPetSpecies(m);
 const stageMood={sunlit:'none',twilight:'hue-rotate(35deg) brightness(.84)',autumn:'sepia(.24) saturate(1.18)'}[m.scene]||'none';
 scene.style.filter=stageMood;
 $('mc-character-name').textContent=m.name;
 const scale=angle===90||angle===270?.74:1;
 const mirror=angle===180?-1:1;
 actor.setAttribute('transform','translate(405 85) translate(90 254) scale('+(zoom*scale*mirror)+' '+zoom+') translate(-90 -254)');
 const rear=angle===180;
 $('mc-head').style.filter=rear?'brightness(.76)':'none';
 $('mc-vehicle').style.filter=m.vehicle==='jeep'?'hue-rotate(94deg)':m.vehicle==='camper'?'hue-rotate(-26deg) saturate(.8)':'none';

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
 const row=$('mc-swatches'),layer=$('mc-color-layer').value;
 const palette=layer==='skin'?skins:layer==='hair'?hairs:themes;
 row.setAttribute('aria-label',layer+' color choices');
 row.replaceChildren();
 for(const color of palette){
  const b=document.createElement('button');b.type='button';b.className='mc-swatch';b.style.background=color;
  b.dataset.color=color;b.dataset.layer=layer;
  b.setAttribute('aria-label','Set '+layer+' color '+color);
  b.setAttribute('aria-pressed',String(current()[layer]===color));row.append(b);
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
async function actionItem(item){
 if(!accountReady){notice('Sign in to your family account first.');return;}
 const owned=draft.unlocked.includes(item.id);
 if(!owned){
   if(draft.coins<item.cost){notice('Save new looks to earn coins. '+item.name+' needs '+item.cost+' coins; you have '+draft.coins+'.');return;}
   if(isPreview){
     draft.coins-=item.cost;draft.unlocked.push(item.id);writeState();
   }else{
     await commitRPC('community_mystery_crew_unlock',{p_item:item.id,p_expected:revision},{preserveDraft:true});
   }
   notice('Unlocked '+item.name+' in your family account.');
 }
 const member=current(),key=choices[item.type];
 if(key){member[key]=item.id;if(item.type==='outfits')member.shirt=item.color;}
 notice('Previewing '+item.name+'. Press Save Crew to keep it across devices.');
 render();
}
document.addEventListener('click',async event=>{
 const el=event.target.closest('button');if(!el)return;
 if(el.dataset.crewId){draft.active=el.dataset.crewId;render();return;}
 if(el.dataset.color){current()[el.dataset.layer||'shirt']=el.dataset.color;render();notice((el.dataset.layer||'Jacket')+' color changed. Save to keep it.');return;}
 if(el.dataset.item){const i=itemById.get(el.dataset.item);if(i)try{await actionItem(i);}catch(error){notice(error?.message||'Item unlock failed.');}return;}
 if(el.dataset.view){view=el.dataset.view;setFilter(view);return;}
 if(el.dataset.jump){view=el.dataset.jump;setFilter(view);document.querySelector('.mc-market').scrollIntoView({behavior:'smooth',block:'nearest'});return;}
 if(el.dataset.motion){
  motion=el.dataset.motion;app.dataset.motion=motion;
  for(const b of document.querySelectorAll('[data-motion]'))b.setAttribute('aria-pressed',String(b.dataset.motion===motion));
  if(!draft.rewardedDesigns.includes('motion:'+motion)&&motion!=='idle'){
    try{
      if(isPreview){draft.rewardedDesigns.push('motion:'+motion);draft.xp+=10;draft.coins+=5;writeState();renderStats();}
      else await commitRPC('community_mystery_crew_motion',{p_motion:motion,p_expected:revision},{preserveDraft:true});
      notice('Explored '+motion+'! Your family account earned its one-time action reward.');
    }catch(error){notice(error?.message||'Could not record the action reward.');}
  }
  return;
 }
 switch(el.id){
  case 'mc-add':{
   if(draft.crew.length>=6){notice('Your crew is full at six.');return;}
   const id='crew-'+Date.now().toString(36).slice(-7);
   const m=starter(draft.crew.length+1);m.id=id;draft.crew.push(m);draft.active=id;notice(m.name+' joined your crew. Save Crew to keep this character.');render();break;
  }
  case 'mc-rename':$('mc-name-input').value=current().name;$('mc-rename-dialog').showModal();$('mc-name-input').focus();break;
  case 'mc-remove':
   if(draft.crew.length<=1){notice('Keep at least one character in your crew.');break;}
   if(!confirm('Remove '+current().name+' from your crew? This change saves when you press Save Crew.'))break;
   draft.crew=draft.crew.filter(m=>m.id!==draft.active);draft.active=draft.crew[0].id;
   notice('Character removed from the draft crew. Press Save Crew to keep the change.');render();break;
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
   try{
     if(isPreview){
       const design=draft.crew.map(m=>[m.id,m.shirt,m.outfit,m.hat,m.gear,m.pet,m.vehicle,m.scene].join(':')).join('|');
       if(!draft.rewardedDesigns.includes('look:'+design)){
         draft.rewardedDesigns.push('look:'+design);draft.xp+=25;draft.coins+=15;
       }
       if(writeState())notice('Saved in the local test preview.');
     }else{
       await commitRPC('community_mystery_crew_save',{p_crew:draft.crew,p_active:draft.active,p_expected:revision});
       notice('Mystery Crew saved to your family account. Your other devices will load this look.');
     }
     render();
   }catch(error){notice(error?.message||'Could not save crew.');}
   break;
  }
  case 'mc-help':$('mc-info').showModal();break;
  case 'mc-info-close':$('mc-info').close();break;
 }
});
$('mc-market-filter').addEventListener('change',e=>{view=e.target.value;setFilter(view);});
$('mc-color-layer').addEventListener('change',renderColors);
$('mc-rename-cancel').addEventListener('click',()=>$('mc-rename-dialog').close());
$('mc-rename-form').addEventListener('submit',e=>{
 e.preventDefault();
 const name=$('mc-name-input').value.trim().slice(0,28);
 if(!name){notice('Give your character a name first.');return;}
 current().name=name;
 $('mc-rename-dialog').close();render();
 notice('Character renamed to '+name+'. Press Save Crew to keep it.');
});

window.addEventListener('beforeunload',e=>{
 if(JSON.stringify(draft)!==savedSnapshot){e.preventDefault();e.returnValue='';}
});
app.dataset.motion='idle';setFilter('character');render();
void initializeAccount();
