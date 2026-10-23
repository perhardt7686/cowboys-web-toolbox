'use strict';
const DATA=JSON.parse(document.getElementById('catalog-data').textContent);
const el=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'#'}catch{return '#'}};
const link=(u,t,c='')=>`<a href="${esc(href(u))}" class="${c}" target="_blank" rel="noopener noreferrer">${t}</a>`;
const normalize=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const videos=new Map(DATA.videos.map(v=>[v.number,v]));
const sitesById=new Map(DATA.sites.map(s=>[s.id,s]));
const tipsById=new Map(DATA.tips.map(t=>[t.id,t]));
const categories=['All','Repair & vehicles','Utilities','Creative','Learning','Games','Movies & media','Travel','Shopping','Maps & world'];
const tiles={'Creative':'#ece1eb','Learning':'#ece9d5','Games':'#e1e8ed','Movies & media':'#e1ebe5','Repair & vehicles':'#f1e0cc','Maps & world':'#dfe9d6','Utilities':'#e7ecda','Shopping':'#eee0d4','Travel':'#e0ebe9'};
// Small, original illustrations of each tool's purpose. These are not screenshots.
// Inline vectors avoid third-party image requests and animate only while visible.
const previewSpecs = {
  fmhy:['directory','A few good rabbit holes','Tools','Media','Learning'],
  '123apps':['video','One browser. Many tools.','Edit','Convert','Export'],
  netflixcodes:['stream','Find your kind of movie','Drama','Comedy','Explore'],
  hotpot:['image','Give an image a new life','Restore','Color','Create'],
  playphrase:['chat','Find the words on screen','Type a phrase','Find a clip'],
  innerbody:['body','A closer look inside','Explore','Human anatomy'],
  retrogames:['game','A little arcade nostalgia','Choose a game','Play'],
  windows93:['desktop','A delightfully odd desktop','Explore','Discover'],
  chattjb:['chat','A human on the other side','Hello there','A human-powered chat'],
  nosignups:['directory','Useful. Open. Ready.','Tools','No signup','Explore'],
  excalidraw:['diagram','Turn a thought into a sketch','Idea','Sketch','Share'],
  opencut:['video','Your next cut starts here','Import','Trim','Arrange'],
  keepa:['chart','See the price over time','Price history','Watch the trend'],
  messenger:['planet','Small planet. Cozy deliveries.','Explore','Make a delivery'],
  animated:['character','Your drawing, in motion','Draw','Add a little life'],
  drivefun:['route','Take the interesting way','Start','Roadside stop','Destination'],
  zperiod:['atom','A little chemistry curiosity','Elements','Atoms','Explore'],
  ninite:['directory','Pick your Windows apps','Select','Install','Update'],
  archive:['document','Find a page in the past','A webpage','A saved snapshot'],
  wifiqr:['qr','A simpler way to share Wi-Fi','Create a code','Scan to connect'],
  osiris:['map','Explore the bigger picture','Public data','Map layers'],
  ifixit:['repair','A fix, one step at a time','Find a device','Follow the guide'],
  carcare:['repair','Know the job before you start','Your vehicle','A how-to video'],
  rockauto:['parts','Find the part that fits','Vehicle','Part','Browse'],
  startmycar:['repair','Get to know your vehicle','Manuals','Fuses','Problems'],
  recoded:['game','Rediscover an old favorite','Pick a console','Play'],
  electude:['car','Think like a diagnostician','Inspect','Test','Diagnose'],
  bingebrowse:['stream','Wander a virtual video store','Browse','Discover','Watch'],
  'paper-animators':['character','Paper with a little personality','Paper','Motion','Templates'],
  thaumaturgy:['audio','Set the scene with sound','Music','Ambience','Effects'],
  'artcraft-apps':['directory','A playground for making','Creative apps','Open source','Explore'],
  'apex-drawn':['route','Draw it. Then race it.','Sketch a track','Take a lap'],
  'mcstumble-fake-update':['update','A playful pretend update','A browser prank','Not a real update'],
  quenq:['desktop','Step into computing history','Retro desktops','Browser games'],
  vocalcut:['audio','Hear the parts of a song','Vocals','Instruments','Separate'],
  'd-r-cos':['sewing','From pattern to costume','Choose a pattern','Start making'],
  'r-pumpkinstencils':['image','Carve out a little creativity','Stencils','Patterns','Make'],
  '3dsvg':['model','Give a flat logo dimension','SVG','3D','Animate'],
  entertrained:['typing','A good book. Better typing.','Read','Type','Keep going'],
  homebyme:['room','Picture your next room','Plan','Furnish','Visualize'],
  'sprite-fusion-destroy-any-website':['game','A little browser chaos','A playful demo','Break the page'],
  'kadoa-congress':['chart','Follow public trading disclosures','Disclosures','Explore the data'],
  terraprinter:['terrain','Turn a place into a model','Find a place','Build the terrain'],
  'leolabs-orbit-visualization':['planet','See what is orbiting Earth','Satellites','Orbital view'],
  ztype:['game','Type your way through space','Type','Aim','Keep going'],
  spaceplanner:['room','Make a little room for ideas','Floor plans','Home & garden'],
  chronas:['map','Put history on the map','Explore places','Move through time'],
  'nuke-simulation':['map','Visualize an educational model','Select a location','Explore the model'],
  'harvard-mcs-r-sum-resources':['document','Make your experience readable','Résumé','Cover letter','Resources'],
  'cooked-wiki':['document','Keep the recipe. Skip the hunt.','A recipe link','Organized ingredients'],
  timemap:['map','Follow the world through time','People','Places','History'],
  'goblin-tools-magic-todo':['tasks','One big task. Smaller steps.','Plan a project','Break it down'],
  simplepdf:['document','Give your PDF the final touch','Open','Fill','Edit'],
  'repair-clinic':['repair','Find a way to fix it','Appliance','Guidance','Parts'],
  mecabricks:['model','A workshop made of bricks','Choose a brick','Build an idea'],
  '3dtuning':['car','Make that car your own','Wheels','Color','Customize'],
  freesewing:['sewing','A pattern made to measure','Measurements','Your pattern'],
  musclewiki:['body','Find an exercise by muscle','Choose a muscle','Explore exercises'],
  'car-part-com':['parts','Give a used part a new job','Your vehicle','The part you need'],
  chatgpt:['chat','A place to work through ideas','Ask a question','Explore an idea'],
  'god-s-eye-view-source-project':['map','Public data, in three dimensions','Source project','Setup required'],
  pinokio:['directory','A launchpad for local apps','Browse apps','Set up','Run locally'],
  famelack:['map','A world of television to explore','Choose a place','Browse channels'],
  retrocrush:['stream','Rediscover classic anime','Classic anime','Browse the lineup'],
  fawesome:['stream','Find your next movie night','Movies','Television','Browse'],
  'google-my-activity':['tasks','See the activity you save','Review','Manage','Your account'],
  'mcstumble-mp4-to-gif-converter':['video','A short clip. A looping moment.','MP4','Convert','GIF'],
  'google-earth':['planet','A whole world to wander','Search a place','Explore Earth'],
  sponsorblock:['video','Find the community-marked skips','Video','Marked segments','Skip']
};
const previewCSS = `
.site-preview{--pv-ink:#29483c;--pv-accent:#c87752;background:var(--pv-bg,#e7ecda);border:1px solid #243e3512;border-radius:9px;overflow:hidden;margin:0 0 21px;position:relative;isolation:isolate}
.preview-browser{display:flex;align-items:center;gap:4px;height:26px;padding:0 10px;background:#fffefa77;border-bottom:1px solid #243e3510}
.preview-browser i{display:block;width:4px;height:4px;border-radius:50%;background:#73806c66}.preview-browser small{font:8px var(--sans);color:#3e5b4c;margin-left:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.preview-drawing{display:block;width:100%;aspect-ratio:320/156;overflow:hidden}.preview-drawing svg{display:block;width:100%;height:100%;overflow:hidden;color:var(--pv-ink)}
.preview-caption{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 11px 10px;font-size:8px;letter-spacing:.45px;color:#4c6654}.preview-caption>span:first-child{display:flex;align-items:center;gap:5px}.preview-caption i{display:inline-block;width:4px;height:4px;background:#748a54;border-radius:50%}.preview-caption>span:last-child{opacity:.65;font-size:7px;letter-spacing:1px}
.preview-motion{border:1px solid #cbd2bd;border-radius:30px;background:transparent;color:var(--ink);white-space:nowrap;min-height:35px;padding:7px 11px;font-size:10px;display:inline-flex;align-items:center;gap:6px}.preview-motion span{font-size:11px}.preview-motion:hover{background:#e8edda}.result-options{flex-wrap:wrap}.preview-motion[aria-pressed="false"]{color:var(--muted)}
.preview-drawing svg .pv-float{animation:pv-float 4s ease-in-out infinite}.preview-drawing svg .pv-scan{animation:pv-scan 5s ease-in-out infinite}.preview-drawing svg .pv-grow{transform-box:fill-box;transform-origin:left center;animation:pv-grow 5s ease-in-out infinite}.preview-drawing svg .pv-draw{stroke-dasharray:450;animation:pv-draw 5s ease-in-out infinite}.preview-drawing svg .pv-cursor{animation:pv-cursor 5s ease-in-out infinite}.preview-drawing svg .pv-pulse{animation:pv-pulse 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.preview-drawing svg .pv-spin{animation:pv-spin 20s linear infinite;transform-box:fill-box;transform-origin:center}.preview-drawing svg .pv-sound{animation:pv-sound 1.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}.preview-drawing svg .pv-sound:nth-child(3n){animation-delay:-.7s}.preview-drawing svg .pv-sound:nth-child(2n){animation-delay:-1s}.preview-drawing svg .pv-reveal{animation:pv-reveal 5s ease-in-out infinite}.preview-drawing svg .pv-dash{stroke-dasharray:6 7;animation:pv-dash 4s linear infinite}
.site-preview svg *{animation-play-state:paused!important}.previews-enabled .site-preview.is-visible svg *{animation-play-state:running!important}
@keyframes pv-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pv-scan{0%,15%{transform:translateX(0)}65%,80%{transform:translateX(155px)}100%{transform:translateX(0)}}
@keyframes pv-grow{0%,10%{transform:scaleX(.35)}65%,85%{transform:scaleX(1)}100%{transform:scaleX(.35)}}
@keyframes pv-draw{0%,8%{stroke-dashoffset:450}65%,100%{stroke-dashoffset:0}}
@keyframes pv-cursor{0%,12%,100%{transform:translate(0,0)}42%,60%{transform:translate(-42px,-28px)}77%{transform:translate(-18px,-9px)}}
@keyframes pv-pulse{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}
@keyframes pv-spin{to{transform:rotate(360deg)}}
@keyframes pv-sound{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
@keyframes pv-reveal{0%,10%,100%{opacity:.35}35%,85%{opacity:1}}
@keyframes pv-dash{to{stroke-dashoffset:-52}}
@media(prefers-reduced-motion:reduce){body:not(.previews-user-enabled) .site-preview svg *{animation:none!important}}
@media(max-width:650px){.site-preview{margin-bottom:19px}.preview-caption{font-size:9px;padding-bottom:11px}.preview-browser{height:29px}.preview-browser small{font-size:9px}.preview-motion{min-height:40px;padding:8px 10px;font-size:10px}.results-heading{align-items:flex-start}.result-options{justify-content:flex-end;row-gap:6px}.preview-motion{order:3}.preview-drawing{max-height:180px}}
`;
const previewStyle=document.createElement('style');previewStyle.id='illustrated-preview-style';previewStyle.textContent=previewCSS;document.head.appendChild(previewStyle);
const pvText=(x,y,text,size=11,fill='currentColor',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(text)}</text>`;
const pvRect=(x,y,w,h,fill='#fffefa',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" ${extra}/>`;
const pvLine=(x,y,w,extra='')=>`<path d="M${x} ${y}h${w}" stroke="currentColor" stroke-width="3" opacity=".16" stroke-linecap="round" ${extra}/>`;
const pvCursor='<path class="pv-cursor" d="M255 106v19l5-5 5 10 5-2-5-10 8-1z" fill="#243e35" stroke="#fffefa" stroke-width="1.5"/>';
function previewArt(spec){
  const [kind,title,a='Explore',b='Discover',c='Create']=spec;
  let art='';
  if(kind==='directory'||kind==='desktop'){
    art=pvRect(25,23,270,111,'#fffefa','opacity=".75"')+pvText(41,44,title,11);
    [a,b,c].forEach((t,i)=>{art+=`<g class="${i===1?'pv-float':''}">${pvRect(41+i*81,58,73,57,i===1?'#d6e3ae':'#eaece2')}${pvRect(50+i*81,68,18,17,i===1?'#738b54':'#b5c2a3')}${pvText(49+i*81,103,t,8)}</g>`});art+=pvCursor;
  }else if(kind==='parts'||kind==='repair'){
    art=pvRect(28,24,264,109,'#fffefa','opacity=".85"')+pvText(42,44,a,10)+pvRect(42,54,165,20,'#eceee3')+pvText(51,68,kind==='parts'?'Vehicle  /  Year  /  Part':'Search a device or a repair',8)+pvRect(212,54,63,20,'#496348')+pvText(222,68,'Search ↗',8,'#fffefa');
    art+=`<g class="pv-reveal">${pvRect(42,85,44,33,'#dfd7bb')}<path d="m52 111 17-17m-1-2 5-2 3 3-2 5-4-1-2-3-1-2m-9 13 4 4" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>${pvText(99,97,b,9)}${pvLine(99,108,117)}</g>${pvCursor}`;
  }else if(kind==='diagram'){
    art=`<path d="M83 78h76m25 0h50" fill="none" stroke="currentColor" stroke-width="2.5" class="pv-draw"/>${pvRect(25,52,77,52,'#fffefa','stroke="currentColor" stroke-width="1.4" transform="rotate(-3 63 78)"')}${pvRect(123,52,77,52,'#dbe4b5','stroke="currentColor" stroke-width="1.4" transform="rotate(2 161 78)"')}${pvRect(221,52,73,52,'#fffefa','stroke="currentColor" stroke-width="1.4"')}${pvText(48,83,a,12)}${pvText(142,83,b,12)}${pvText(241,83,c,12)}${pvCursor}`;
  }else if(kind==='chart'){
    art=pvRect(26,20,268,116,'#fffefa','opacity=".8"')+pvText(42,40,a,10)+`<path d="M43 55v63h233M43 88h233" fill="none" stroke="currentColor" opacity=".12"/><path class="pv-draw" d="m46 74 30 10 26-17 26 28 25-9 30 17 30-21 32 17 28-10" fill="none" stroke="#70844e" stroke-width="3" stroke-linejoin="round"/><circle class="pv-pulse" cx="273" cy="89" r="5" fill="#c87752"/>`+pvText(43,132,'PAST',6)+pvText(257,132,'NOW',6);
  }else if(kind==='video'){
    art=pvRect(26,20,268,116,'#fffefa','opacity=".85"')+pvRect(40,29,124,60,'#b8c2b3')+`<path d="m40 89 35-35 24 20 25-25 40 40" fill="#738966"/><circle cx="137" cy="43" r="7" fill="#f3d69a"/><path d="m94 46 19 12-19 12z" fill="#fffefa"/>`+pvText(178,48,a,12)+pvText(178,66,b,10)+pvText(178,82,c,10);
    [0,1,2,3,4].forEach(i=>{art+=pvRect(41+i*46,103,40,15,i%2?'#bdc9a9':'#d4c2a9')});art+='<path class="pv-scan" d="M48 96v31" stroke="#c87752" stroke-width="2.5"/>';
  }else if(kind==='audio'){
    art=pvRect(26,21,268,114,'#fffefa','opacity=".8"')+pvText(43,43,a,10)+pvText(43,122,b,8);
    const hs=[18,28,43,32,52,39,21,45,57,33,50,37,24,45,29,48,35,17,31,23];hs.forEach((h,i)=>art+=`<rect class="pv-sound" x="${45+i*11.6}" y="${80-h/2}" width="5" height="${h}" rx="2.5" fill="${i<10?'#6b8455':'#c87752'}"/>`);
  }else if(kind==='map'||kind==='route'){
    art=`<path d="m20 20 54 23 43-14 72 17 43-24 68 23M9 104l65-19 54 23 53-27 68 15 61-24M78 8 54 142M177 5l13 144M270 12l-28 133" fill="none" stroke="#fffefa" stroke-width="8" opacity=".72"/><path d="M23 135c41-70 35 8 88-26s65-92 111-60 59 22 77-6" fill="none" stroke="#8aa572" stroke-width="20" opacity=".23"/><path class="pv-draw" d="M61 110C87 58 118 115 158 77s62-42 100-29" fill="none" stroke="#687d4c" stroke-width="3" stroke-linecap="round"/><circle class="pv-pulse" cx="61" cy="110" r="6" fill="#c87752"/><circle cx="258" cy="48" r="6" fill="#c87752"/>${pvRect(103,108,157,25,'#fffefa','opacity=".93"')}${pvText(114,124,a,10)}${pvCursor}`;
  }else if(kind==='planet'){
    art=`<ellipse cx="162" cy="78" rx="124" ry="44" fill="none" stroke="currentColor" opacity=".18" transform="rotate(-20 162 78)"/><circle cx="162" cy="78" r="55" fill="#779584"/><path d="m129 32-3 22 21 8 9 25-16 6 12 25 26 3 6-23 17-12-5-17-17-5-7-28z" fill="#ced9a7"/><ellipse cx="162" cy="78" rx="28" ry="55" fill="none" stroke="#fffefa" opacity=".24"/><path d="M108 75h108m-99-24h90m-89 51h89" stroke="#fffefa" opacity=".24"/><g class="pv-spin"><ellipse cx="162" cy="78" rx="83" ry="63" fill="none" stroke="currentColor" stroke-dasharray="3 7" opacity=".25"/><circle cx="241" cy="62" r="5" fill="#c87752"/></g><circle class="pv-pulse" cx="155" cy="66" r="5" fill="#fffefa"/>${pvRect(25,116,109,24,'#fffefa','opacity=".9"')}${pvText(36,132,a,9)}`;
  }else if(kind==='game'){
    art=pvRect(34,20,252,116,'#2c4239')+`<path d="M60 114h197" stroke="#9aab75" stroke-width="2" stroke-dasharray="8 6"/><g class="pv-float" fill="#e0d49a"><path d="M151 79h17v15h10v9h-37v-9h10z"/><path d="M83 51h10v10H83zm26-10h7v7h-7zm105 15h10v10h-10zm28-13h6v6h-6z"/></g><path class="pv-scan" d="M68 79v-8m8 18v-9" stroke="#c87752" stroke-width="3"/>`+pvText(51,38,a,9,'#e1eeac')+pvText(205,124,'PLAY  ↗',7,'#e1eeac');
  }else if(kind==='typing'){
    art=pvRect(28,25,264,106,'#fffefa','opacity=".85"')+pvText(46,49,'READ A LITTLE. TYPE A LITTLE.',8)+pvRect(45,63,148,17,'#dce7bc','class="pv-grow"')+pvText(47,75,'Every good story begins',12)+pvText(47,94,'with a little curiosity.',12,'#748369')+pvLine(47,114,210)+'<path class="pv-pulse" d="M196 63v18" stroke="#c87752" stroke-width="2"/>';
  }else if(kind==='tasks'){
    art=pvRect(35,21,250,115,'#fffefa','opacity=".85"')+pvText(52,44,a,12);
    [0,1,2].forEach(i=>art+=`<g class="${i===2?'pv-reveal':''}">${pvRect(53,56+i*24,12,12,i===0?'#718653':'#e6e9db')}${i===0?'<path d="m56 62 3 3 4-6" fill="none" stroke="white" stroke-width="1.5"/>':''}${pvLine(77,62+i*24,165-i*24)}</g>`);art+=pvCursor;
  }else if(kind==='body'||kind==='character'){
    art=pvRect(24,24,125,108,'#fffefa','opacity=".6"')+`<g class="pv-float" stroke="${kind==='body'?'#8b9f7d':'#54724c'}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="86" cy="48" r="10" fill="#d5ddb7" stroke-width="2"/><path d="M86 64v31m0-26-20 15m20-15 20 13M86 95l-13 25m13-25 15 25"/>${kind==='body'?'<path class="pv-pulse" d="M79 68v24m14-24v24" stroke="#c87752" stroke-width="6"/>':''}</g>`+pvText(168,66,a,10)+pvText(168,86,b,9)+pvLine(168,104,109)+pvLine(168,116,79);
  }else if(kind==='atom'){
    art=`<g class="pv-spin" fill="none" stroke="#7d946a" stroke-width="1.8"><ellipse cx="126" cy="78" rx="72" ry="25"/><ellipse cx="126" cy="78" rx="72" ry="25" transform="rotate(60 126 78)"/><ellipse cx="126" cy="78" rx="72" ry="25" transform="rotate(120 126 78)"/><circle cx="195" cy="85" r="5" fill="#c87752"/></g><circle class="pv-pulse" cx="126" cy="78" r="14" fill="#c87752"/>${pvRect(216,47,62,65,'#fffefa','opacity=".9"')}${pvText(227,69,'H',23)}${pvText(227,88,'Hydrogen',8)}${pvText(227,102,'1.008',7)}`;
  }else if(kind==='room'){
    art=`<path d="M66 50 162 14l100 39v75l-97 20-99-27z" fill="#fffefa" opacity=".7"/><path d="M66 50v71l99 27V76zm99 26v72l97-20V53z" fill="#d3ddbd"/><path d="m66 50 99 26 97-23M165 76v72" stroke="#859773" fill="none"/><g class="pv-float"><path d="m97 86 45 13 38-10 45 13v20l-42 11-86-23z" fill="#78917b"/><path d="m97 86 45 13v21l-45-13z" fill="#617f68"/><path d="m180 89 45 13-42 11-41-14z" fill="#9fb29a"/></g><path d="m206 63 13-5v30l-13 3z" fill="#e2ba73"/>${pvRect(27,118,91,23,'#fffefa','opacity=".9"')}${pvText(37,133,a,9)}`;
  }else if(kind==='model'||kind==='terrain'){
    art=`<path d="m46 113 116-57 115 56-116 37z" fill="#fffefa" opacity=".6"/><g class="pv-float"><path d="m107 53 53-25 55 26-55 27z" fill="#b8cba2"/><path d="m107 53 53 28v53l-53-27z" fill="#799478"/><path d="m160 81 55-27v53l-55 27z" fill="#506c55"/><path d="m117 52 43-19 44 21-44 20z" fill="none" stroke="#fffefa" opacity=".4"/></g>${pvText(24,31,a,9)}${pvText(233,137,kind==='terrain'?'TERRAIN':'3D VIEW',7)}`;
  }else if(kind==='car'){
    art=`<path d="M30 121h260" stroke="currentColor" stroke-width="2" opacity=".14"/><g class="pv-float"><path d="m60 93 19-31 83-6 45 30 35 8 5 18H47l4-16z" fill="#758e6d"/><path d="m89 66-13 24h47V64zm42-3v27h61l-33-27z" fill="#dce5d3"/><circle cx="88" cy="111" r="16" fill="#2c4239"/><circle cx="211" cy="111" r="16" fill="#2c4239"/><circle cx="88" cy="111" r="7" fill="#b4beab"/><circle cx="211" cy="111" r="7" fill="#b4beab"/><path d="M56 96h15m160 0h11" stroke="#e8cb8b" stroke-width="5"/></g>${pvText(32,36,a,9)}${pvRect(226,24,63,21,'#fffefa','opacity=".8"')}${pvText(236,38,'EXPLORE',7)}`;
  }else if(kind==='sewing'){
    art=pvRect(37,20,145,117,'#fffefa','opacity=".8"')+`<path d="m86 37-28 15 9 27 17-7v45h50V72l17 7 9-27-28-15q-23 23-46 0z" fill="#d8d1be" stroke="#74866a" stroke-width="1.5"/><path class="pv-dash" d="m90 43-24 13 6 14 16-6v47h42V64l16 6 6-14-24-13" fill="none" stroke="#fffefa" stroke-width="1.5"/>`+pvText(200,65,a,9)+pvText(200,84,b,9)+pvLine(200,104,83)+pvCursor;
  }else if(kind==='image'){
    art=pvRect(37,20,246,114,'#fffefa','opacity=".8"')+pvRect(46,29,228,96,'#b5c5af')+`<path d="m46 125 56-68 42 42 44-58 86 84" fill="#758a6b"/><path d="m102 57-15 18 15-4 12 8z" fill="#edf0de"/><circle class="pv-pulse" cx="232" cy="53" r="12" fill="#ebca83"/><path class="pv-scan" d="M73 29v96" stroke="#fffefa" stroke-width="3"/>${pvText(48,145,a,8)}`;
  }else if(kind==='stream'){
    art=pvRect(25,20,270,116,'#2d453a')+pvText(40,39,a,9,'#e0e9c7');
    [0,1,2,3].forEach(i=>art+=`<g class="${i===1?'pv-float':''}">${pvRect(40+i*60,50,51,68,['#9aab87','#c29471','#a8b5b3','#d3bd8a'][i])}<circle cx="${65+i*60}" cy="72" r="9" fill="#fffefa" opacity=".45"/><path d="m${57+i*60} 91 16 0" stroke="#fffefa" opacity=".5" stroke-width="2"/></g>`);art+='<path d="m123 76 12 7-12 7z" fill="#fffefa"/>';
  }else if(kind==='qr'){
    art=pvRect(36,20,115,115,'#fffefa','opacity=".9"');
    for(let y=0;y<15;y++)for(let x=0;x<15;x++){const finder=(x<5&&y<5)||(x>9&&y<5)||(x<5&&y>9);if(finder){const lx=x>9?x-10:x,ly=y>9?y-10:y;if(lx===0||lx===4||ly===0||ly===4||(lx===2&&ly===2))art+=`<rect x="${49+x*6}" y="${33+y*6}" width="6" height="6" fill="#2d453a"/>`}else if((x*13+y*7+x*y)%5<2)art+=`<rect x="${49+x*6}" y="${33+y*6}" width="6" height="6" fill="#2d453a"/>`}
    art+=pvText(171,65,a,10)+pvText(171,84,b,9)+'<path class="pv-pulse" d="m183 101 4 4 8-9" stroke="#7c8e56" fill="none" stroke-width="3"/>';
  }else if(kind==='chat'){
    art=pvRect(28,21,264,115,'#fffefa','opacity=".75"')+pvRect(110,36,161,28,'#d8e3bc')+pvText(122,54,a,10)+`<g class="pv-reveal">${pvRect(45,77,194,35,'#e9ebdf')}${pvText(57,99,b,10)}</g><g class="pv-pulse" fill="#80956f"><circle cx="53" cy="125" r="2"/><circle cx="62" cy="125" r="2"/><circle cx="71" cy="125" r="2"/></g>`;
  }else if(kind==='update'){
    art=pvRect(31,21,258,115,'#3b5b7c')+pvText(69,52,'A pretend update screen',12,'#fffefa')+pvRect(63,76,193,8,'#fffefa','opacity=".25"')+pvRect(63,76,193,8,'#fffefa','class="pv-grow"')+pvText(94,109,'JUST A BROWSER PRANK',7,'#fffefa');
  }else{
    art=pvRect(52,14,167,129,'#fffefa','opacity=".85"')+pvRect(68,31,63,9,'#91a276')+pvLine(68,55,130)+pvLine(68,70,118)+pvLine(68,85,130)+pvRect(67,99,110,13,'#dbe6b9','class="pv-grow"')+pvText(235,116,'PDF',10)+pvCursor;
  }
  return `<svg viewBox="0 0 320 156" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="font-family:var(--sans)">${art}</svg>`;
}
function sitePreview(s){
  const spec=previewSpecs[s.id];if(!spec)return '';
  const domain=new URL(s.url).hostname.replace(/^www\./,'');
  return `<div class="site-preview" data-preview="${esc(s.id)}" style="--pv-bg:${tiles[s.category]||'#e7ecda'}" role="img" aria-label="Illustrated preview of ${esc(s.name)}: ${esc(s.description)}"><div class="preview-browser" aria-hidden="true"><i></i><i></i><i></i><small>${esc(domain)}</small></div><div class="preview-drawing" aria-hidden="true">${previewArt(spec)}</div><div class="preview-caption" aria-hidden="true"><span><i></i>${esc(spec[1])}</span><span>ILLUSTRATED</span></div></div>`;
}
const previewMedia=matchMedia('(prefers-reduced-motion: reduce)');
let previewMotion=!previewMedia.matches;
try{if(localStorage.getItem('cowboy-web-toolbox-motion')==='off')previewMotion=false}catch{}
const previewButton=document.createElement('button');previewButton.id='preview-motion';previewButton.className='preview-motion';previewButton.type='button';previewButton.setAttribute('aria-label','Animated website previews');previewButton.title='Play or pause the illustrated website previews';
document.querySelector('.result-options').prepend(previewButton);
function syncPreviewMotion(){document.body.classList.toggle('previews-enabled',previewMotion&&!document.hidden);previewButton.setAttribute('aria-pressed',String(previewMotion));previewButton.innerHTML=previewMotion?'<span aria-hidden="true">Ⅱ</span> Previews on':'<span aria-hidden="true">▷</span> Previews paused'}
previewButton.addEventListener('click',()=>{previewMotion=!previewMotion;document.body.classList.toggle('previews-user-enabled',previewMotion);try{localStorage.setItem('cowboy-web-toolbox-motion',previewMotion?'on':'off')}catch{}syncPreviewMotion()});
previewMedia.addEventListener('change',e=>{previewMotion=!e.matches;document.body.classList.remove('previews-user-enabled');syncPreviewMotion()});
document.addEventListener('visibilitychange',syncPreviewMotion);
const previewObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-visible',e.isIntersecting)),{threshold:.05}):null;
function observePreviews(){previewObserver?.disconnect();document.querySelectorAll('.site-preview').forEach(p=>{if(previewObserver)previewObserver.observe(p);else p.classList.add('is-visible')});previewButton.hidden=state.view!=='websites';syncPreviewMotion()}

let saved=new Set();try{const a=JSON.parse(localStorage.getItem('cowboy-web-toolbox-public-favorites')||'[]');if(Array.isArray(a))saved=new Set(a.filter(id=>sitesById.has(id)))}catch{}
let state={view:'websites',query:new URLSearchParams(location.search).get('find')||'',category:'All',saved:false,sort:'collection'};
function notify(text){el('toast').textContent=text;el('toast').hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>el('toast').hidden=true,2300)}
function matches(text){return state.query.trim().split(/\s+/).every(w=>normalize(text).includes(normalize(w)))}
function renderCategories(){el('categories').innerHTML=categories.map(c=>`<button class="category-chip" data-category="${esc(c)}" aria-pressed="${state.category===c}">${esc(c)} <span>${c==='All'?DATA.sites.length:DATA.sites.filter(s=>s.category===c).length}</span></button>`).join('')}
function siteCard(s){const first=videos.get(s.sources[0]);const unverified=s.destinationCheck.status==='availability_unverified';const domain=new URL(s.url).hostname.replace(/^www\./,'');const check=unverified?'Availability unverified':'Destination page checked';const original=s.originalUrl?`<p>Shown as ${link(s.originalUrl,esc(s.previousName||s.originalUrl))}; the current destination is linked above.</p>`:'';return `<article class="site-card" data-site="${esc(s.id)}"><div class="card-top"><span class="site-icon" style="--tile:${tiles[s.category]||'#e7ecda'}" aria-hidden="true">${esc(s.monogram)}</span><span class="card-topic">${esc(s.category)}</span><button class="star" data-save="${esc(s.id)}" aria-pressed="${saved.has(s.id)}" aria-label="${saved.has(s.id)?'Remove':'Save'} ${esc(s.name)}${saved.has(s.id)?' from favorites':' to favorites'}">${saved.has(s.id)?'★':'☆'}</button></div>${sitePreview(s)}<h4>${link(s.url,esc(s.name))}</h4><span class="domain">${esc(domain)}</span><p class="card-description">${esc(s.description)}</p>${unverified?'<span class="status-tag">Availability unverified</span>':s.previousName?`<span class="status-tag">Previously ${esc(s.previousName)}</span>`:s.role==='example'?'<span class="status-tag">Directory example</span>':''}<div class="card-links">${link(s.url,'Visit website <span aria-hidden="true">↗</span>','open-link')}${link(first.url,'Source video ↗','video-link')}</div><a class="discussion-link" href="community.html?site=${encodeURIComponent(s.id)}">Discuss this find <span aria-hidden="true">↗</span></a><details class="notes"><summary>Source & checks</summary><p>${esc(s.evidence)}</p>${original}<p><strong>${check}</strong><br>${esc(s.destinationCheck.notes||'Features have not been tested.')}</p><p>${s.sources.map(n=>link(videos.get(n).url,`Video ${n}`)).join(' · ')}</p></details></article>`}
function empty(title,desc){return `<div class="empty"><h4>${esc(title)}</h4><p>${esc(desc)}</p><button data-reset>Explore all websites</button></div>`}
function renderWebsites(){let rows=DATA.sites.filter(s=>(state.category==='All'||s.category===state.category)&&(!state.saved||saved.has(s.id))&&matches([s.name,s.description,s.category,s.url,s.previousName||'',s.category==='Repair & vehicles'?'car repair auto truck mechanic maintenance parts':'',...s.sources.map(n=>videos.get(n).title)].join(' ')));if(state.sort==='az')rows.sort((a,b)=>a.name.localeCompare(b.name));el('results-title').textContent=state.saved?'Your favorites':state.category==='All'?'All discoveries':state.category;el('result-count').textContent=`${rows.length} of ${DATA.sites.length} websites`;el('content').innerHTML=rows.length?`<div class="grid">${rows.map(siteCard).join('')}</div>`:empty(state.saved?'Make yourself at home.':'No finds this time.',state.saved?'Tap a star on a website to keep it in your favorites.':'Try a broader search or choose another topic.')}
function renderTips(){const rows=DATA.tips.filter(t=>matches([t.title,t.description,t.label].join(' ')));el('results-title').textContent='Tips & demonstrations';el('result-count').textContent=`${rows.length} of ${DATA.tips.length} clips`;el('content').innerHTML=rows.length?`<div class="grid">${rows.map(t=>`<article class="site-card tip-card"><span class="tip-label">${esc(t.label)}</span><h4>${esc(t.title)}</h4><p class="card-description">${esc(t.description)}</p>${link(videos.get(t.number).url,'Watch the video <span aria-hidden="true">↗</span>','open-link')}<details class="notes"><summary>What was observed</summary><p>${esc(t.evidence)}</p><p>Classified from the recorded evidence; this is not a full transcript or an independent test of the tip.</p></details></article>`).join('')}</div>`:empty('No matching tips.','Try a shorter phrase, such as Excel or Windows.')}
function renderVideos(){const rows=DATA.videos.filter(v=>matches([v.number,v.title,...v.siteIds.map(id=>sitesById.get(id).name),tipsById.get(v.tipId)?.title||''].join(' ')));el('results-title').textContent='Go to the source';el('result-count').textContent=`${rows.length} of ${DATA.videos.length} videos`;el('content').innerHTML=rows.length?`<div class="source-list">${rows.map(v=>`<article class="source-row"><span class="source-num">${String(v.number).padStart(2,'0')}</span><div><h4>${esc(v.title)}</h4><p>Matty McTech · ${esc(v.duration)}</p></div><div class="source-tags">${v.siteIds.map(id=>{const s=sitesById.get(id);return link(s.url,`${esc(s.name)} ↗`)}).join('')}${v.tipId?`<span>${esc(tipsById.get(v.tipId).title)}</span>`:''}</div>${link(v.url,'Watch ↗','watch-source')}</article>`).join('')}</div>`:empty('No matching videos.','Search a website name, a topic or a video number.')}
function render(){el('categories').hidden=state.view!=='websites';el('sort-label').hidden=state.view!=='websites';el('saved').hidden=state.view!=='websites';el('saved').setAttribute('aria-pressed',String(state.saved));el('saved-count').textContent=saved.size;el('clear-search').hidden=!state.query;el('results').setAttribute('aria-labelledby','tab-'+state.view);document.querySelectorAll('[data-view]').forEach(b=>{const selected=b.dataset.view===state.view;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1});if(state.view==='websites')renderWebsites();else if(state.view==='tips')renderTips();else renderVideos();observePreviews()}
function setView(view){state.view=view;state.query='';el('search').value='';el('search').placeholder=view==='websites'?'A task, a topic, a website…':view==='tips'?'Search tips and demonstrations…':'Search videos, websites or a video number…';render()}
function reset(){state={view:'websites',query:'',category:'All',saved:false,sort:'collection'};el('search').value='';el('sort').value='collection';el('search').placeholder='A task, a topic, a website…';renderCategories();render()}
el('search').addEventListener('input',e=>{state.query=e.target.value;render()});el('clear-search').addEventListener('click',()=>{state.query='';el('search').value='';render();el('search').focus()});
el('saved').addEventListener('click',()=>{state.saved=!state.saved;render()});el('sort').addEventListener('change',e=>{state.sort=e.target.value;render()});
el('categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){state.category=b.dataset.category;renderCategories();render()}});
document.querySelector('.view-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)setView(b.dataset.view)});
document.querySelector('.view-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const a=[...document.querySelectorAll('[data-view]')];let n=a.findIndex(b=>b.dataset.view===state.view);n=e.key==='Home'?0:e.key==='End'?a.length-1:(n+(e.key==='ArrowRight'?1:-1)+a.length)%a.length;setView(a[n].dataset.view);a[n].focus()});
el('content').addEventListener('click',e=>{const b=e.target.closest('[data-save]');if(b){const id=b.dataset.save;if(saved.has(id))saved.delete(id);else saved.add(id);try{localStorage.setItem('cowboy-web-toolbox-public-favorites',JSON.stringify([...saved]))}catch{notify('Favorites will last for this visit; browser storage is unavailable.')}render();const next=el('content').querySelector(`[data-save="${id}"]`);if(next)next.focus()}if(e.target.closest('[data-reset]'))reset()});
document.querySelector('.brand').addEventListener('click',reset);document.querySelector('.footer-brand').addEventListener('click',reset);
function downloadText(name,text,type){const u=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
document.querySelector('a[href="catalog.json"]').addEventListener('click',e=>{if(location.protocol!=='file:')return;e.preventDefault();downloadText('catalog.json',JSON.stringify(DATA,null,2),'application/json')});
document.querySelector('a[href="websites.csv"]').addEventListener('click',e=>{if(location.protocol!=='file:')return;e.preventDefault();const cell=s=>'"'+String(s).replace(/"/g,'""')+'"';const rows=[['Name','Category','Website','Description','Source videos','Destination check'],...DATA.sites.map(s=>[s.name,s.category,s.url,s.description,s.sources.map(n=>videos.get(n).url).join(' | '),s.destinationCheck.status])];downloadText('websites.csv','\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8')});
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);if(e.key==='/'&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();el('search').focus();el('search').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}if(e.key==='Escape'&&document.activeElement===el('search')){state.query='';el('search').value='';render()}});
el('search').value=state.query;renderCategories();render();
