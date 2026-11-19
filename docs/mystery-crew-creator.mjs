/* Mystery Crew Creator: family-account sync is server-authoritative. 
 * The local-only preview fixture works only on localhost test builds. */
import {connectMysteryCrew} from './mystery-crew-sync.mjs?v=account1';
import {enhanceMysteryScene} from './mystery-crew-stage-art.mjs?v=paint2';
import {loadPainterlyPack,painterlyOutfitHTML,syncPainterlyStage} from './mystery-painterly-stage.mjs?v=layered3';
import {loadCrewV5,syncCrewV5,paintedCrewPortraitHTML} from './mystery-crew-character-v5.mjs?v=crew5';
import {mountSceneV4,syncSceneV4} from './mystery-crew-scene-v4.mjs?v=scene4';
import {CREW_OPTIONS,CREW_ANCHORS,crewHeadMarkup,crewHeadPreviewSVG} from './mystery-crew-art.mjs?v=paint2';
import {mysteryCrewPortraitSVG} from './mystery-crew-portrait.mjs?v=paint2';
const KEY='cowboy-mystery-crew-creator-v1';
const isPreview=new URLSearchParams(location.search).get('preview')==='1'&&['localhost','127.0.0.1'].includes(location.hostname);
let account=null,accountReady=isPreview,revision=0,busy=false;
const app=document.getElementById('mc-app'),$=id=>document.getElementById(id);
const themes=['#ef792f','#69a55e','#315fa2','#cc5654','#6a5588','#a87640','#2c8e97','#e3c36c'];
const skins=['#f0b989','#c98760','#ab6948','#6e432e','#f6d2ae','#d9a27b'];
const hairs=['#904b28','#b8432a','#e0b447','#302b46','#6b4531','#36243b'];
const pants=['#315b93','#355b6b','#644f78','#567158'];
const petColors={dog:'#b77a43',cat:'#8b879a',ghost:'#b4e5c9',owl:'#b4a084',fox:'#d88c55'};
const starter=(n=1)=>({id:'crew-'+n,name:['Scout','Juniper','Finn','Riley','Atlas','Wren'][(n-1)%6],skin:skins[(n-1)%skins.length],
 hair:hairs[(n-1)%hairs.length],shirt:themes[(n-1)%themes.length],pants:pants[(n-1)%pants.length],
 outfit:'detective',hat:'none',gear:'none',pet:'dog',vehicle:'van',scene:'sunlit',...CREW_ANCHORS[(n-1)%CREW_ANCHORS.length]});
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
let state=read(),savedSnapshot=JSON.stringify(state),view='character',filter='faces',page=0,motion='idle',zoom=1,angle=0;
let draft=structuredClone(state);
function current(){return draft.crew.find(v=>v.id===draft.active)||draft.crew[0];}
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colorFor=(id)=>itemById.get(id)?.color||themes[0];
/* Artwork is a collection of distinct source-inspired original silhouettes,
   not the same recolored jacket or animal for every wardrobe card. */
function icon(item){
 const k=item.art,base=item.color,ink='#30303c',cream='#f5dfb6';
 const art={
 coat:'<path d="M48 30L66 35 80 48 97 35 110 30 137 59 121 76 113 67 118 145 42 145 47 67 32 78 16 60Z" fill="#d4aa76" stroke="'+ink+'" stroke-width="6"/><path d="M66 36L81 64 98 36 91 143 71 143Z" fill="#e9c495" stroke="#745b4d" stroke-width="4"/><path d="M47 93L116 93M63 73L68 78M99 72L104 78M62 110L68 115M99 109L104 114" stroke="#6b5349" stroke-width="5" stroke-linecap="round"/><path d="M53 128L107 128" stroke="#9a785c" stroke-width="8"/>',
 vest:'<path d="M56 27L78 41 103 26 116 40 113 142 47 142 44 43Z" fill="#54743b" stroke="'+ink+'" stroke-width="6"/><path d="M64 40L80 73 94 39 83 144 76 144Z" fill="#bdad80" stroke="#343b2d" stroke-width="4"/><path d="M51 84H71V107H51Z M91 85H110V109H91Z" fill="#9da06c" stroke="#3a4435" stroke-width="4"/><path d="M49 114H69V134H49Z M93 113H113V134H93Z" fill="#6c8e50" stroke="#353e32" stroke-width="4"/><circle cx="81" cy="95" r="4" fill="#e5c47a"/>',
 armor:'<path d="M54 39Q38 22 32 8Q7 18 27 53L43 61 38 87 57 99 70 75 92 75 110 100 132 87 124 57Q153 28 128 9Q125 33 108 39Z" fill="#d7bb8e" stroke="'+ink+'" stroke-width="6"/><path d="M48 56Q61 27 81 47Q101 29 120 56L133 120 115 145H45L29 120Z" fill="#795236" stroke="'+ink+'" stroke-width="7"/><path d="M40 63L60 48 68 79 47 109M99 79L108 49 127 64 112 112" fill="#5d3c30" stroke="#d7bd91" stroke-width="8"/><path d="M62 114H102V140H62Z" fill="#9c8265" stroke="#34313c" stroke-width="4"/><path d="M53 48Q34 54 37 77M107 45Q133 51 128 79" stroke="#e3ccb3" stroke-width="10"/>',
 jacket:'<path d="M45 39L63 27 79 41 95 27 114 35 139 61 123 79 113 68 114 145 45 145 45 70 30 80 17 63Z" fill="#80502e" stroke="'+ink+'" stroke-width="6"/><path d="M58 35Q79 56 102 33L109 51Q82 70 52 51Z" fill="#f1dbb9" stroke="#795434" stroke-width="4"/><path d="M67 56L78 92 96 58 89 145 72 145Z" fill="#a57546"/><path d="M46 111H65V124H46Z M97 111H116V124H97Z" fill="#b58a52" stroke="#4f423a" stroke-width="4"/><path d="M69 98L97 97" stroke="#d8a456" stroke-width="5"/>',
 space:'<path d="M53 26L106 26 119 45 139 55 140 95 121 102 116 145H44L41 102 20 92 24 53 45 44Z" fill="#f5f2df" stroke="'+ink+'" stroke-width="6"/><path d="M59 28Q81 49 101 28M47 60H115V119H47Z" fill="#e0e1da" stroke="#8593a2" stroke-width="4"/><path d="M42 90L25 89M120 90L138 90M50 130H113" stroke="#d85f39" stroke-width="8"/><circle cx="82" cy="84" r="19" fill="#4a9cb0" stroke="#d5a65b" stroke-width="6"/><path d="M71 76L83 70 95 78" fill="none" stroke="#cfebed" stroke-width="4"/><path d="M49 39H61V55H49Z M102 39H113V55H102Z" fill="#d46950"/>',
 knight:'<path d="M49 31Q74 12 108 31L123 48 136 82 124 104 113 92 114 144H45L46 93 33 105 21 84 34 47Z" fill="#b9c4c6" stroke="'+ink+'" stroke-width="7"/><path d="M57 27Q81 -5 105 27L104 68H58Z" fill="#d2dce0" stroke="#3a4149" stroke-width="6"/><path d="M59 45H105M81 28V66" stroke="#4a515b" stroke-width="7"/><path d="M44 78L64 88 61 124 46 116M98 88L117 77 114 119 97 123" fill="#e2e6df" stroke="#505764" stroke-width="5"/><path d="M64 83L97 83 103 140H58Z" fill="#9baab2" stroke="#414754" stroke-width="5"/><circle cx="81" cy="112" r="7" fill="#d4b365"/>',
 plaid:'<path d="M46 31L66 28 82 43 98 29 118 32 139 60 124 77 114 66 114 144H45L45 67 30 78 17 61Z" fill="#bd392f" stroke="'+ink+'" stroke-width="6"/><path d="M48 57H115M47 87H115M47 117H115M63 35V144M81 37V144M99 36V144" stroke="#243b42" stroke-width="9"/><path d="M46 73H115M47 106H115M53 37V143M90 40V143" stroke="#e7b89d" stroke-width="3"/><path d="M82 43V142" stroke="#ede1bc" stroke-width="4"/>',
 stealth:'<path d="M46 30L67 24 95 24 117 32 137 61 122 79 115 70 115 145H43L44 69 29 81 18 62Z" fill="#273a43" stroke="'+ink+'" stroke-width="7"/><path d="M58 42H102V127H58Z" fill="#394852" stroke="#151f2a" stroke-width="5"/><path d="M44 66L65 64 64 92 43 97M98 64L117 65 118 98 98 92" fill="#28353a" stroke="#1b232d" stroke-width="4"/><path d="M58 78H102M58 104H102M80 43V127" stroke="#171e29" stroke-width="6"/><path d="M64 54H96" stroke="#657c85" stroke-width="5"/>',
 dog:'<path d="M35 68Q19 25 53 34Q73 41 84 59Q105 29 127 42Q144 74 131 118Q87 143 39 117Z" fill="#c18446" stroke="'+ink+'" stroke-width="6"/><path d="M39 52L15 29Q7 63 42 78M118 51L149 30Q151 65 125 80" fill="#995b31" stroke="'+ink+'" stroke-width="6"/><path d="M54 93Q82 68 112 95L104 120 61 122Z" fill="#f6ead7"/><ellipse cx="69" cy="79" rx="9" ry="12" fill="white"/><ellipse cx="106" cy="79" rx="9" ry="12" fill="white"/><circle cx="72" cy="83" r="5" fill="'+ink+'"/><circle cx="103" cy="82" r="5" fill="'+ink+'"/><ellipse cx="87" cy="100" rx="10" ry="7" fill="#3a3032"/><path d="M77 113Q88 123 99 113" stroke="#7a3d35" stroke-width="4" fill="none"/>',
 cat:'<path d="M36 129L34 52 15 12 58 45Q83 32 110 44L147 14 131 61 132 129Z" fill="#89839a" stroke="'+ink+'" stroke-width="6"/><path d="M29 34L43 59 57 45M115 46L132 31 127 59" fill="#ddbdc5"/><path d="M39 107Q83 126 127 106" fill="none" stroke="#efe1d6" stroke-width="9"/><ellipse cx="65" cy="82" rx="12" ry="15" fill="#f8f0de"/><ellipse cx="105" cy="82" rx="12" ry="15" fill="#f8f0de"/><circle cx="68" cy="85" r="5" fill="'+ink+'"/><circle cx="103" cy="85" r="5" fill="'+ink+'"/><path d="M78 106L92 105 86 112Z" fill="#c2848f"/><path d="M56 110L23 104M115 110L147 105" stroke="#fbf2e2" stroke-width="3"/>',
 ghost:'<path d="M22 134Q14 82 34 52Q53 22 84 25Q118 21 139 58L140 140 118 120 99 141 80 121 59 142 40 124Z" fill="#bcf2d7" stroke="#537d78" stroke-width="6"/><ellipse cx="65" cy="86" rx="12" ry="17" fill="#4a6d67"/><ellipse cx="106" cy="86" rx="12" ry="17" fill="#4a6d67"/><path d="M80 107Q89 117 98 106" fill="none" stroke="#5a827c" stroke-width="5"/><path d="M45 56Q71 36 105 50" fill="none" stroke="#eefef6" stroke-width="8"/>',
 owl:'<path d="M30 130L33 56 12 23 56 41Q82 29 108 41L147 19 131 59 136 129Z" fill="#b4a084" stroke="'+ink+'" stroke-width="6"/><circle cx="60" cy="79" r="25" fill="#f1e6c7" stroke="#725741" stroke-width="4"/><circle cx="107" cy="79" r="25" fill="#f1e6c7" stroke="#725741" stroke-width="4"/><circle cx="64" cy="83" r="8" fill="#3b4544"/><circle cx="103" cy="83" r="8" fill="#3b4544"/><path d="M77 102L91 102 84 117Z" fill="#e8a850"/><path d="M46 122Q83 138 125 122" fill="none" stroke="#ead7ad" stroke-width="9"/>',
 fox:'<path d="M31 127L26 68 12 12 59 46Q86 28 112 43L149 12 136 75 137 130Z" fill="#d88c55" stroke="'+ink+'" stroke-width="6"/><path d="M27 89L84 127 139 89 119 140 53 140Z" fill="#f9ebd8" stroke="#3e343a" stroke-width="4"/><ellipse cx="64" cy="84" rx="9" ry="12" fill="#fff"/><ellipse cx="107" cy="84" rx="9" ry="12" fill="#fff"/><circle cx="68" cy="87" r="5" fill="'+ink+'"/><circle cx="104" cy="87" r="5" fill="'+ink+'"/><path d="M79 108L95 108 87 117Z" fill="#2d3036"/>',
 van:'<path d="M19 73L36 46H121Q144 58 145 83V121H15V83Z" fill="#2d84a8" stroke="'+ink+'" stroke-width="6"/><path d="M41 52H117Q131 57 136 77H29Z" fill="#a4d3d9" stroke="'+ink+'" stroke-width="4"/><path d="M18 87H144" stroke="#ea8f3e" stroke-width="10"/><circle cx="45" cy="121" r="15" fill="#27363f" stroke="#d8cba7" stroke-width="6"/><circle cx="118" cy="121" r="15" fill="#27363f" stroke="#d8cba7" stroke-width="6"/><circle cx="88" cy="91" r="11" fill="#f1d5a7" stroke="#a57344" stroke-width="4"/>',
 jeep:'<path d="M24 77L38 62 65 61 77 48H124L138 79V123H17V86Z" fill="#849c61" stroke="'+ink+'" stroke-width="6"/><path d="M79 56H117L126 80H73Z" fill="#bfe1d7" stroke="'+ink+'" stroke-width="4"/><path d="M20 92H139M28 109H128" stroke="#536748" stroke-width="7"/><circle cx="44" cy="124" r="17" fill="#2d3540" stroke="#c4c0a5" stroke-width="5"/><circle cx="118" cy="124" r="17" fill="#2d3540" stroke="#c4c0a5" stroke-width="5"/><path d="M21 92L14 98 14 117M137 94L149 100 149 116" stroke="'+ink+'" stroke-width="6"/>',
 camper:'<path d="M18 53H132Q144 53 146 67V124H16V60Z" fill="#e2aa74" stroke="'+ink+'" stroke-width="6"/><path d="M25 62H80V100H25Z M92 61H137V100H92Z" fill="#a9d4d4" stroke="'+ink+'" stroke-width="4"/><path d="M21 107H144" stroke="#bc7351" stroke-width="9"/><path d="M81 54V123" stroke="#6b534d" stroke-width="4"/><circle cx="48" cy="123" r="15" fill="#32353e" stroke="#d5c9a9" stroke-width="6"/><circle cx="117" cy="123" r="15" fill="#32353e" stroke="#d5c9a9" stroke-width="6"/>'
 };
 let svg=art[k];
 if(!svg && ['hat','helmet','goggles','cap'].includes(k)){
  svg='<path d="M30 85Q31 32 82 31Q131 32 132 84Z" fill="'+base+'" stroke="'+ink+'" stroke-width="7"/><path d="M15 88Q81 109 147 88" fill="none" stroke="'+ink+'" stroke-width="11"/>';
  if(k==='helmet')svg+='<path d="M39 64Q9 20 16 12Q44 21 60 53M106 53Q136 21 148 12Q159 36 121 68" fill="#e7cfa1" stroke="'+ink+'" stroke-width="5"/>';
  if(k==='goggles')svg+='<circle cx="59" cy="67" r="22" fill="#afd4e1" stroke="'+ink+'" stroke-width="7"/><circle cx="106" cy="67" r="22" fill="#afd4e1" stroke="'+ink+'" stroke-width="7"/>';
  if(k==='cap')svg+='<path d="M74 78Q123 72 151 87Q129 103 83 100Z" fill="#267a8b" stroke="'+ink+'" stroke-width="4"/>';
 }
 if(!svg && k==='flashlight')svg='<path d="M34 128L99 55 129 78 64 143Z" fill="#ad9267" stroke="'+ink+'" stroke-width="7"/><path d="M96 58L128 25 154 48 128 80Z" fill="#f0d49a" stroke="'+ink+'" stroke-width="6"/>';
 if(!svg && k==='compass')svg='<circle cx="81" cy="83" r="51" fill="#cc9e67" stroke="'+ink+'" stroke-width="7"/><circle cx="81" cy="83" r="39" fill="#f7e4c4"/><path d="M82 40L103 89 80 126 62 83Z" fill="#4d89a2" stroke="'+ink+'" stroke-width="4"/>';
 if(!svg && k==='pack')svg='<path d="M37 55Q37 25 81 28Q124 28 124 60V141H38Z" fill="#9e815d" stroke="'+ink+'" stroke-width="7"/><path d="M50 78H112V124H50Z" fill="#d4b88b" stroke="#574d44" stroke-width="5"/><path d="M57 79V53H103V78" fill="none" stroke="#d6b88d" stroke-width="9"/>';
 if(!svg && k==='binoculars')svg='<path d="M29 59L54 46 74 55H88L108 46 133 60 139 116 109 126 92 104H70L54 127 19 114Z" fill="#395264" stroke="'+ink+'" stroke-width="7"/><circle cx="47" cy="104" r="18" fill="#8db1ba" stroke="'+ink+'" stroke-width="4"/><circle cx="113" cy="104" r="18" fill="#8db1ba" stroke="'+ink+'" stroke-width="4"/>';
 if(!svg)svg='<circle cx="80" cy="80" r="49" fill="'+base+'" stroke="'+ink+'" stroke-width="7"/><path d="M40 80H120M80 40V120" stroke="'+cream+'" stroke-width="5"/>';
 return '<svg viewBox="0 0 160 160" aria-hidden="true" focusable="false">'+svg+'</svg>';
}

function portrait(member){return paintedCrewPortraitHTML(member)||mysteryCrewPortraitSVG(member);}

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
 const normalized={version:1,crew:data.crew.map((member,index)=>({...starter(index+1),...member})),active:data.active,coins:data.coins,xp:data.xp,
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
 detective:'<path d="M43 184L64 197 78 229 92 198 128 185 142 210 112 226 117 314 60 319 67 226Z" fill="#ed7c31" opacity=".9" stroke="#38303b" stroke-width="6"/><path d="M66 195L80 229 95 198 M83 226L90 316" fill="none" stroke="#f2d3a3" stroke-width="5"/>',
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
 if(p==='dog'){
  group.setAttribute('transform','translate(623 380)');
  group.innerHTML=[
    '<ellipse cx="95" cy="195" rx="93" ry="14" fill="#4f412e" opacity=".22"/>',
    '<path d="M139 152Q189 147 166 109" fill="none" stroke="#986237" stroke-width="18" stroke-linecap="round"/>',
    '<path d="M55 108Q49 72 92 74Q143 69 150 121L148 173Q129 197 79 195Q35 193 38 162Z" fill="#faf4e7" stroke="#3c3437" stroke-width="7"/>',
    '<path d="M47 126Q54 92 72 85L87 116 69 178 47 174Z" fill="#b9783c" stroke="#493331" stroke-width="4"/>',
    '<path d="M113 84Q134 94 136 125L144 173 113 171Z" fill="#a16c3c" opacity=".75"/>',
    '<path d="M67 150Q56 167 51 187Q65 198 80 189L84 146M121 147L121 184Q129 197 146 188L142 145" fill="#faf8ee" stroke="#3c3437" stroke-width="6"/>',
    '<path d="M53 186Q63 197 82 188M117 186Q135 196 147 187" fill="none" stroke="#3d3436" stroke-width="5"/>',
    '<path d="M42 43Q21 11 43 0Q73 2 78 32L102 35Q122 2 150 10Q160 40 138 69L144 112Q114 141 72 122L42 94Z" fill="#b87b3f" stroke="#352d30" stroke-width="7"/>',
    '<path d="M47 38Q23 18 31 50Q34 91 54 94L69 49Z" fill="#945b32" stroke="#332e32" stroke-width="5"/>',
    '<path d="M126 37Q153 17 152 44Q150 81 133 91L111 54Z" fill="#915930" stroke="#332e32" stroke-width="5"/>',
    '<path d="M64 64Q79 53 89 65Q106 55 118 66L128 108Q99 128 70 109Z" fill="#f9f4e7" stroke="#443738" stroke-width="5"/>',
    '<ellipse cx="80" cy="67" rx="12" ry="17" fill="white" stroke="#38333a" stroke-width="3"/>',
    '<ellipse cx="113" cy="68" rx="12" ry="17" fill="white" stroke="#38333a" stroke-width="3"/>',
    '<circle cx="85" cy="69" r="6" fill="#263e48"/><circle cx="108" cy="71" r="6" fill="#263e48"/>',
    '<circle cx="87" cy="66" r="2" fill="#fff"/><circle cx="110" cy="68" r="2" fill="#fff"/>',
    '<path d="M88 86Q99 80 110 89Q109 104 97 104Q86 100 88 86Z" fill="#272a32"/>',
    '<path d="M96 105Q102 119 117 108" fill="none" stroke="#6a3940" stroke-width="5" stroke-linecap="round"/>',
    '<path d="M101 111Q107 133 113 125L114 113Z" fill="#f1949c" stroke="#7b4249" stroke-width="3"/>',
    '<path d="M54 126Q99 138 146 125" fill="none" stroke="#b93c31" stroke-width="12"/>',
    '<circle cx="100" cy="133" r="12" fill="#e6bf57" stroke="#644e32" stroke-width="5"/>',
    '<circle cx="100" cy="130" r="3" fill="#fff4b8"/>'
   ].join('');
  return;
 }
 group.setAttribute('transform','translate(641 433)');
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
 $('mc-fidelity-head').innerHTML=crewHeadMarkup(m);
 renderWearables(m);
 renderPetSpecies(m);
 const stageMood={sunlit:'none',twilight:'hue-rotate(35deg) brightness(.84)',autumn:'sepia(.24) saturate(1.18)'}[m.scene]||'none';
 scene.style.filter=stageMood;
 $('mc-character-name').textContent=m.name;
 const scale=angle===90||angle===270?.74:1;
 const mirror=angle===180?-1:1;
 const bodyProfiles={oval:[1,1],heart:[.96,1.02],round:[1.04,.98],square:[1.02,.99],narrow:[.91,1.06],broad:[1.1,.96]};
 const proportions=bodyProfiles[m.faceShape]||bodyProfiles.oval;
 actor.setAttribute('transform','translate(405 85) translate(90 254) scale('+(zoom*scale*mirror*proportions[0])+' '+(zoom*proportions[1])+') translate(-90 -254)');
 const rear=angle===180;
 $('mc-head').style.filter=rear?'brightness(.76)':'none';
 $('mc-vehicle').style.filter=m.vehicle==='jeep'?'hue-rotate(94deg)':m.vehicle==='camper'?'hue-rotate(-26deg) saturate(.8)':'none';


 for(const b of document.querySelectorAll('.mc-views button'))b.setAttribute('aria-pressed',String((b.id==='mc-view-front'&&angle===0)||(b.id==='mc-view-side'&&angle===90)||(b.id==='mc-view-back'&&angle===180)));
 syncPainterlyStage(m,{zoom,angle,motion});
 syncCrewV5(m,{zoom,angle,motion});
 syncSceneV4(m);
}
function renderRoster(){
 const wrap=$('mc-roster');wrap.replaceChildren();
 for(const p of draft.crew){
  const btn=document.createElement('button');btn.type='button';btn.className='mc-portrait';btn.dataset.crewId=p.id;
  btn.setAttribute('aria-label','Choose saved crew member '+p.name);btn.setAttribute('aria-pressed',String(p.id===draft.active));
  btn.title=p.name+' · saved crew';
  btn.innerHTML=portrait(p);wrap.append(btn);
 }
 // Match the original five-portrait rail without inventing additional saved
 // characters. Distinct dashed previews apply to the active DRAFT only.
 const previews=referenceLooks.slice(1,1+Math.max(0,5-draft.crew.length));
 for(const look of previews){
  const btn=document.createElement('button');btn.type='button';btn.className='mc-portrait mc-reference-portrait';
  btn.dataset.referenceLook=look.id;
  btn.setAttribute('aria-label','Try '+look.name+' on the current character');
  btn.title='Try look: '+look.name+' · not yet saved';
  btn.innerHTML=portrait({...current(),...look});wrap.append(btn);
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
const referenceLooks=[
 {id:'scout',name:'Trail Scout',skin:'#f0b989',hair:'#904b28',...CREW_ANCHORS[0]},
 {id:'juniper',name:'Copper Sleuth',skin:'#f4c8a9',hair:'#b8432a',...CREW_ANCHORS[1]},
 {id:'finn',name:'Sunshine Scout',skin:'#f7cfa8',hair:'#e0b447',...CREW_ANCHORS[2]},
 {id:'riley',name:'Bookish Detective',skin:'#ebbe99',hair:'#302b46',...CREW_ANCHORS[3]},
 {id:'atlas',name:'Gentle Giant',skin:'#d69a77',hair:'#5c3424',...CREW_ANCHORS[4]},
 {id:'wren',name:'Curly Adventurer',skin:'#bb8767',hair:'#342e32',...CREW_ANCHORS[5]}
];
const traitCategories={
 faces:{key:'faceShape',label:'Face Shape',options:CREW_OPTIONS.faceShape},
 haircuts:{key:'hairStyle',label:'Hairstyle',options:CREW_OPTIONS.hairStyle},
 eyes:{key:'eyeShape',label:'Eye Shape',options:CREW_OPTIONS.eyeShape},
 expressions:{key:'expression',label:'Expression',options:CREW_OPTIONS.expression},
 details:{key:'detail',label:'Face Details',options:CREW_OPTIONS.detail}
};
const prettyLabel=value=>value.split('-').map(part=>part.slice(0,1).toUpperCase()+part.slice(1)).join(' ');
function pageSize(){
 return window.matchMedia('(max-width:650px) and (max-height:740px)').matches?2:
   window.matchMedia('(max-width:1380px)').matches?4:8;
}
function setFilter(next){
 const known=['presets','faces','haircuts','eyes','expressions','details','outfits','hats','gear','pets','vehicles','collections','studio'];
 filter=next==='character'?'presets':known.includes(next)?next:'presets';
 page=0;
 $('mc-market-filter').value=filter;
 const labels={presets:'Crew Looks',faces:'Face Shapes',haircuts:'Hairstyles',eyes:'Eye Styles',expressions:'Expressions',details:'Face Details',
  outfits:'Outfits',hats:'Hats',gear:'Adventure Gear',pets:'Pets',vehicles:'Vehicles',studio:'Backdrops',collections:'Unlockables'};
 $('mc-market-title').textContent=labels[filter];
 for(const b of document.querySelectorAll('[data-view]')){
  b.setAttribute('aria-pressed',String(b.dataset.view===filter||((b.dataset.view==='character')&&(filter==='presets'||Boolean(traitCategories[filter])))));
 }
 for(const b of document.querySelectorAll('[data-jump]'))b.setAttribute('aria-pressed',String(b.dataset.jump===filter));
 renderCards();
}
function renderCards(){
 const panel=$('mc-cards');panel.replaceChildren();
 const trait=traitCategories[filter];
 const category=filter==='presets'?referenceLooks:trait?trait.options.map(id=>({id})):
  filter==='collections'?items.filter(i=>i.cost>0):items.filter(i=>i.type===filter);
 const size=pageSize();
 const count=Math.max(1,Math.ceil(category.length/size));
 page=Math.max(0,Math.min(page,count-1));
 for(const item of category.slice(page*size,(page+1)*size)){
  const card=document.createElement('button');card.type='button';card.className='mc-card';
  if(filter==='presets'){
   const active=['skin','hair','faceShape','hairStyle','eyeShape','expression','detail'].every(k=>current()[k]===item[k]);
   card.dataset.referenceLook=item.id;
   card.setAttribute('aria-pressed',String(active));
   card.setAttribute('aria-label',item.name+(active?' selected':''));
   card.innerHTML='<span class="mc-card-art">'+crewHeadPreviewSVG(item,114)+'</span>'+
     '<span class="mc-card-name">'+safe(item.name)+'</span>'+
     '<span class="mc-card-state '+(active?'equipped':'available')+'">'+(active?'✓ Selected':'Try Look')+'</span>';
  }else if(trait){
   const active=current()[trait.key]===item.id;
   card.dataset.styleKind=trait.key;
   card.dataset.styleValue=item.id;
   card.setAttribute('aria-pressed',String(active));
   card.setAttribute('aria-label',prettyLabel(item.id)+' '+trait.label+(active?' selected':''));
   card.innerHTML='<span class="mc-card-art">'+crewHeadPreviewSVG({...current(),[trait.key]:item.id},110)+'</span>'+
    '<span class="mc-card-name">'+safe(prettyLabel(item.id))+'</span>'+
    '<span class="mc-card-state '+(active?'equipped':'available')+'">'+(active?'✓ Selected':'Choose')+'</span>';
  }else{
   const owned=draft.unlocked.includes(item.id);
   const equipped=Object.values(choices).some(key=>current()[key]===item.id);
   card.dataset.item=item.id;card.dataset.locked=String(!owned);
   const label=equipped?'✓ Equipped':owned?'Equip':'★ '+item.cost+' coins';
   const badge=equipped?'equipped':owned?'available':'locked';
   card.setAttribute('aria-label',item.name+'. '+(equipped?'Equipped':owned?'Equip':'Unlock for '+item.cost+' crew coins'));
   const illustrated=filter==='outfits'?painterlyOutfitHTML(item.id):null;
   card.innerHTML='<span class="mc-card-art">'+(illustrated||icon(item))+'</span><span class="mc-card-name">'+safe(item.name)+'</span><span class="mc-card-state '+badge+'">'+safe(label)+'</span>';
  }
  panel.append(card);
 }
 $('mc-page-label').textContent=(page+1)+' / '+count;
 $('mc-page-prev').disabled=page<=0;
 $('mc-page-next').disabled=page>=count-1;
}
function renderStats(){
 $('mc-coins').textContent=draft.coins.toLocaleString();
 $('mc-rank').textContent='Level '+(1+Math.floor(draft.xp/300));
}
function render(){
 renderRoster();renderColors();renderCards();renderStats();updateScene();
 const dirty=JSON.stringify(draft)!==savedSnapshot;
 const compactSave=window.matchMedia('(max-width:650px) and (max-height:740px)').matches;
 $('mc-save').textContent=compactSave?(dirty?'✓ Save *':'✓ Save'):(dirty?'✓ Save Crew *':'✓ Save Crew');
 $('mc-save').setAttribute('aria-label',dirty?'Save Crew changes':'Save Crew');
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
 if(el.id==='mc-page-prev'){page=Math.max(0,page-1);renderCards();return;}
 if(el.id==='mc-page-next'){page+=1;renderCards();return;}
 if(el.dataset.referenceLook){
  const look=referenceLooks.find(x=>x.id===el.dataset.referenceLook);
  if(look){
   for(const key of ['skin','hair','faceShape','hairStyle','eyeShape','expression','detail'])current()[key]=look[key];
   render();notice(look.name+' selected for this character. Press Save Crew to keep the look.');
  }
  return;
 }
 if(el.dataset.styleKind){
  const kind=el.dataset.styleKind,value=el.dataset.styleValue;
  if(Object.values(traitCategories).some(x=>x.key===kind&&x.options.includes(value))){current()[kind]=value;render();notice(prettyLabel(value)+' selected. Press Save Crew to sync it.');}
  return;
 }
 if(el.dataset.color){current()[el.dataset.layer||'shirt']=el.dataset.color;render();notice((el.dataset.layer||'Jacket')+' color changed. Save to keep it.');return;}
 if(el.dataset.item){const i=itemById.get(el.dataset.item);if(i)try{await actionItem(i);}catch(error){notice(error?.message||'Item unlock failed.');}return;}
 if(el.dataset.view){view=el.dataset.view;setFilter(view);return;}
 if(el.dataset.jump){view=el.dataset.jump;setFilter(view);return;}
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
  case 'mc-scene-turn-left':
  case 'mc-turn-left':angle=(angle+270)%360;updateScene();break;
  case 'mc-scene-turn-right':
  case 'mc-turn-right':angle=(angle+90)%360;updateScene();break;
  case 'mc-view-front':angle=0;updateScene();break;
  case 'mc-view-side':angle=90;updateScene();break;
  case 'mc-view-back':angle=180;updateScene();break;
  case 'mc-scene-zoom-in':
  case 'mc-zoom-in':zoom=Math.min(1.5,Math.round((zoom+.1)*100)/100);updateScene();break;
  case 'mc-scene-zoom-out':
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
window.addEventListener('resize',render);
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
enhanceMysteryScene();
app.dataset.motion='idle';
setFilter('outfits');
document.querySelector('[data-view="character"]')?.setAttribute('aria-pressed','true');
document.querySelector('[data-view="outfits"]')?.setAttribute('aria-pressed','false');
render();
// Asset pack failure leaves the live, proven SVG creator and family saves usable.
void loadPainterlyPack(render).then(async loaded=>{
 if(loaded){await mountSceneV4();}
 await loadCrewV5();
 render();
});
void initializeAccount();
