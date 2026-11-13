/* Street r0d EGA Edition. Original procedural 320x200 / 16-colour artwork.
   No copyrighted screenshots, game files, music, or original software used.
   Compatible visual/boot layer: credits, bolts, races and RPCs remain authoritative.
*/
const EGA=['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'];
const ROOT=document.getElementById('streetrod-root');
let booted=false,booting=false,scheduled=false,decorated=new WeakSet();
const W=320,H=200;
const col=n=>EGA[Math.max(0,Math.min(15,n))];
function box(c,x,y,w,h,p){c.fillStyle=col(p);c.fillRect(x|0,y|0,Math.max(0,w|0),Math.max(0,h|0));}
function stroke(c,x,y,u,v,p,w=1){c.beginPath();c.strokeStyle=col(p);c.lineWidth=w;c.moveTo((x|0)+.5,(y|0)+.5);c.lineTo((u|0)+.5,(v|0)+.5);c.stroke();}
function poly(c,pts,p,outline=0){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col(p);c.fill();if(outline!==null){c.strokeStyle=col(outline);c.lineWidth=1;c.stroke();}}
function txt(c,t,x,y,p=15,size=7){c.fillStyle=col(p);c.font='bold '+size+'px monospace';c.textBaseline='top';c.fillText(String(t),x|0,y|0);}
function disk(c,x,y,r,p){c.fillStyle=col(p);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function keyhash(s){let h=19;for(const a of String(s||''))h=((h*33)^a.charCodeAt(0))>>>0;return h;}
function chromeWheel(c,x,y,r=16){
 disk(c,x,y,r+2,0);disk(c,x,y,r,7);disk(c,x,y,r-3,15);
 disk(c,x,y,r-6,8);disk(c,x,y,4,15);
 for(let i=0;i<8;i++){const t=i*Math.PI/4;stroke(c,x+Math.cos(t)*5,y+Math.sin(t)*5,x+Math.cos(t)*(r-7),y+Math.sin(t)*(r-7),15);}
}
function car(c,key='rattler',body='coupe',x=45,y=111,width=236){
 const h=keyhash(key),paint=[2,3,4,5,6,9,12][h%7],van=/van|wagon|bus/i.test(body),pickup=/truck|pickup|rover/i.test(body);
 c.save();c.translate(x,y);c.scale(width/240,width/240);
 box(c,3,43,236,7,0);
 poly(c,[[3,24],[22,19],[47,17],[64,5],[103,3],[130,16],[187,17],[213,21],[235,29],[237,43],[3,43]],paint);
 const roof=van?[[50,21],[64,4],[161,4],[186,22]]:pickup?[[81,22],[90,4],[140,4],[154,22]]:[[53,22],[69,5],[113,6],[140,22]];
 poly(c,roof,paint);
 poly(c,van?[[67,8],[158,8],[171,20],[56,20]]:pickup?[[91,9],[136,9],[147,20],[86,20]]:[[71,9],[111,9],[130,20],[58,20]],3,0);
 box(c,13,24,215,3,15);box(c,8,32,223,4,7);box(c,13,40,220,3,0);
 box(c,26,32,21,5,14);box(c,219,29,14,7,12);box(c,0,32,8,7,15);
 box(c,81,19,2,18,0);box(c,145,20,2,16,0);
 box(c,94,24,14,2,15);box(c,168,24,14,2,15);
 chromeWheel(c,51,42,16);chromeWheel(c,194,42,16);
 box(c,0,46,240,3,8);
 c.restore();
}
function border(c,title='',bottom='CLICK TO CONTINUE'){
 box(c,0,0,W,H,0);box(c,0,0,W,6,8);box(c,0,187,W,13,8);
 stroke(c,0,186,319,186,15);txt(c,title,8,8,15,7);
 txt(c,'BANKROLL',4,190,12,8);txt(c,bottom,156,190,12,7);
}
function garage(c,key,body){
 border(c,'COWBOY MOTOR WORKS','HIT THE STREET');
 box(c,0,17,320,119,8);
 for(let x=0;x<320;x+=10)stroke(c,x,23,x+23,4,6);
 box(c,0,18,320,12,6);for(let x=0;x<320;x+=12)stroke(c,x,18,x+10,30,0);
 box(c,0,31,320,101,7);
 box(c,13,48,115,4,6);box(c,145,45,138,4,6);
 for(let i=0;i<7;i++)box(c,150+i*18,34,10,11,i%2?12:3);
 for(let i=0;i<7;i++){box(c,15+i*14,57,4,24,i%2?8:0);box(c,15+i*14,58,4,4,15);}
 disk(c,128,54,15,0);disk(c,128,54,12,15);
 stroke(c,128,54,128,45,0,2);stroke(c,128,54,135,60,0,2);
 box(c,290,41,24,38,15);box(c,293,48,18,25,11);txt(c,'JUL',295,53,0,7);txt(c,'63',297,63,0,7);
 box(c,0,131,320,56,7);poly(c,[[0,136],[320,122],[320,146],[0,156]],8,null);
 box(c,270,112,23,29,2);box(c,274,107,15,7,0);
 box(c,29,164,250,4,8);
 car(c,key,body,36,104,241);
 box(c,4,148,10,25,2);box(c,13,150,13,4,10);
}
function diner(c){
 border(c,'MOONLIGHT DRIVE-IN','CLICK TO CHALLENGE');
 box(c,0,17,320,102,0);
 for(let i=0;i<31;i++)box(c,(i*67+9)%320,19+(i*13)%80,1,1,15);
 poly(c,[[0,43],[28,28],[267,28],[319,45],[319,113],[0,113]],7);
 box(c,0,31,320,8,4);box(c,0,37,320,4,14);
 for(let i=0;i<3;i++){let x=10+i*104;
  box(c,x,46,98,52,0);box(c,x+4,49,90,44,7);box(c,x+6,52,86,39,3);
  disk(c,x+31,68,8,6);box(c,x+23,76,16,17,4);
  disk(c,x+64,67,7,12);box(c,x+57,74,16,19,5);
 }
 box(c,119,24,100,27,5);box(c,123,27,93,21,4);
 txt(c,'MOONLIGHT',130,29,15,11);txt(c,'DRIVE-IN',139,41,14,7);
 box(c,0,111,320,76,8);stroke(c,0,164,319,164,0,3);
 car(c,'comet','hardtop',6,131,174);car(c,'cipherx','van',170,133,142);
}
function engine(c){
 border(c,'UNDER THE HOOD','TURN BOLTS TWICE');
 box(c,0,17,320,168,8);box(c,9,28,302,137,7);
 box(c,18,36,285,121,0);box(c,21,39,279,114,8);
 box(c,78,65,166,66,7);box(c,85,59,152,75,15);
 box(c,91,62,142,66,8);
 for(let i=0;i<6;i++){box(c,99+i*21,70,14,41,7);box(c,103+i*21,71,6,38,0);}
 box(c,132,53,56,18,15);box(c,137,44,46,11,7);
 for(let i=0;i<4;i++){const x=94+i*43;box(c,x,116,9,9,0);box(c,x+2,118,4,4,15);}
 box(c,240,82,20,47,7);box(c,242,84,16,43,0);
 box(c,55,76,19,44,6);box(c,60,81,10,34,4);
 txt(c,'INTAKE',139,135,0,7);txt(c,'ENGINE ASSEMBLY',110,145,0,7);
}
function gas(c){
 border(c,'GAS AND OIL', 'CHOOSE HOW MUCH TO PUMP');
 box(c,0,18,320,102,0);for(let i=0;i<24;i++)box(c,(i*53)%320,20+(i*17)%85,1,1,15);
 box(c,0,88,320,99,7);box(c,4,51,202,64,4);box(c,8,55,194,58,12);
 for(let i=0;i<3;i++){box(c,19+i*53,69,38,38,3);box(c,21+i*53,73,34,29,11);}
 box(c,58,37,101,21,0);box(c,63,40,91,15,5);txt(c,'HILLSIDE GAS',70,43,14,10);
 box(c,240,63,49,102,4);box(c,246,68,37,91,12);box(c,253,79,24,26,15);
 txt(c,'FUEL',255,83,0,7);txt(c,'63',258,94,0,7);
 box(c,280,109,23,10,0);stroke(c,301,113,309,142,0,4);
 car(c,'rattler','coupe',9,139,210);
}
function newspaper(c){
 border(c,'USED CARS & PARTS','PAGE 1 OF THE CLASSIFIEDS');
 box(c,10,21,300,159,15);box(c,15,25,290,149,7);
 for(let x=20;x<299;x+=2)box(c,x,30,1,2,0);
 box(c,24,38,271,5,0);txt(c,'MOTOR YARD GAZETTE',72,47,0,13);
 stroke(c,22,65,296,65,0,2);
 for(let col=0;col<3;col++){
  let x=24+col*92;for(let row=0;row<14;row++){
   let len=(row%4===0?72:row%3===0?55:67);
   box(c,x,72+row*6,len,1,row%7===0?8:0);
  }
 }
 box(c,29,112,65,31,8);car(c,'rattler','coupe',34,119,58);
}
function dash(c,opts={}){
 border(c,'NIGHT DRIVE / SUMMER 1963','CRUISING IN TOWN...');
 box(c,0,21,320,76,0);
 for(let i=0;i<14;i++)box(c,(i*31+7)%320,23+(i*11)%50,1,1,15);
 poly(c,[[0,92],[29,67],[50,78],[96,62],[138,86],[197,69],[242,86],[284,62],[320,81],[320,138],[0,138]],6);
 box(c,0,109,320,55,2);poly(c,[[0,165],[320,165],[185,96],[141,96]],8);
 const scroll=Number(opts.progress||0)*1400;
 for(let i=0;i<7;i++){const t=(i/7+scroll/500)%1,z=t*t,y=96+z*68;
  box(c,160-z*3,y,1+z*6,2+z*10,15);}
 // windshield pillars, hood and gauge cluster, without smoothed gradients
 poly(c,[[0,16],[17,16],[24,114],[0,158]],8);
 poly(c,[[320,16],[304,16],[295,114],[320,158]],8);
 poly(c,[[83,154],[133,129],[184,129],[245,161],[269,186],[66,186]],9);
 poly(c,[[0,145],[30,140],[81,160],[240,158],[292,141],[320,146],[320,186],[0,186]],7);
 for(let n=0;n<2;n++){
  let x=124+n*75,y=165;disk(c,x,y,24,0);disk(c,x,y,21,15);disk(c,x,y,18,8);
  const value=n?((opts.rpm||2500)/8000):((opts.speed||0)/160);
  for(let i=0;i<8;i++){const t=Math.PI*.8+i*Math.PI*1.4/8;stroke(c,x+Math.cos(t)*13,y+Math.sin(t)*13,x+Math.cos(t)*17,y+Math.sin(t)*17,15);}
  const angle=Math.PI*.8+Math.max(0,Math.min(1,value))*Math.PI*1.4;
  stroke(c,x,y,x+Math.cos(angle)*16,y+Math.sin(angle)*16,12,2);
  txt(c,n?'RPM':'MPH',x-9,y+8,15,6);
 }
 disk(c,161,191,35,0);disk(c,161,191,29,7);disk(c,161,191,21,0);disk(c,161,191,7,12);
}
function componentCard(c,key,body){
 box(c,0,0,160,70,0);
 car(c,key,body,4,14,154);
}
const scenes={
 '.ss-garage-stage':['garage',n=>{let name=n.closest('#streetrod-summer')?.querySelector('.ss-garage-overlay span')?.textContent||'rattler';return [name,'coupe'];}],
 '.src-garage-stage':['garage',n=>[n.querySelector('#src-current-ride')?.textContent||'rattler','coupe']],
 '.ss-diner-hero':['diner'],'.src-diner-scene':['diner'],
 '.ss-newspaper':['newspaper'],'.src-paper':['newspaper'],
 '.ss-parts-counter':['engine'],'.src-parts-illustration':['engine'],
 '.ssb-mechanical-art':['engine'],'.ss-service-art':['engine'],
 '.ssg-forecourt':['gas']
};
function sceneCanvas(node,type,key='rattler',body='coupe'){
 if(node.querySelector(':scope > canvas.sr-ega-scene'))return;
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 canvas.className='sr-ega-scene';canvas.setAttribute('aria-hidden','true');
 canvas.setAttribute('role','presentation');
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)return;
 ctx.imageSmoothingEnabled=false;
 ({garage,diner,engine,gas,newspaper,dash})[type]?.(ctx,key,body);
 node.prepend(canvas);node.classList.add('sr-ega-active');
}
function spriteImages(){
 ROOT?.querySelectorAll('.ss-car-photo,.src-car-photo,.sr-real-car,.scc-photocar,.srj-real-car').forEach(img=>{
  if(decorated.has(img))return;decorated.add(img);
  const stage=img.parentElement;if(!stage)return;
  const label=img.closest('.sr-car-card,.scc-car-card,.srj-car-card,.ss-ad,.src-scene-stage')?.querySelector('strong')?.textContent||
   img.closest('.ss-ad')?.querySelector('strong')?.textContent||img.alt||'rattler';
  const body=/wagon|van|truck|rover|bus|pickup/i.test(label)?'van':/hardtop|comet/i.test(label)?'hardtop':'coupe';
  const cv=document.createElement('canvas');cv.width=160;cv.height=70;cv.className='sr-ega-car';
  const ct=cv.getContext('2d',{alpha:false});if(!ct)return;ct.imageSmoothingEnabled=false;
  componentCard(ct,label,body);
  img.style.display='none';img.after(cv);
 });
}
function decorate(){
 if(!ROOT||!ROOT.isConnected)return;
 for(const [selector,[name,reader]] of Object.entries(scenes)){
  ROOT.querySelectorAll(selector).forEach(node=>{
   if(node.closest('.ss-summer[hidden]'))return;
   const [key,body]=reader?reader(node):['rattler','coupe'];
   sceneCanvas(node,name,key,body);
  });
 }
 spriteImages();
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate()});}
const preamble=[
 'COWBOY COMPUTER SYSTEMS 286 BIOS             (C) 1989',
 'CPU: 80286 @ 12 MHZ  /  MEMORY TEST: 640K OK',
 'VIDEO ADAPTER: EGA 320 x 200 / 16 COLORS ... OK',
 'FIXED DISK C: ... READY',
 '',
 'C:\\>CD GAMES\\STREETR0D',
 'C:\\GAMES\\STREETR0D>DIR',
 'STREET.EXE    1989   LOADING SUMMER OF 1963 ...',
 'MOTOR SHOP ASSEMBLY  ............ OK',
 'REGISTERED RACERS    ............ OK',
 'OPENING GARAGE ...'
];
async function bootAndOpen(target){
 if(booting||booted)return;
 booting=true;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const overlay=document.createElement('div');overlay.className='sr-dos-overlay';overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-label','Original DOS-style Street r0d computer startup');
 const boxnode=document.createElement('div');boxnode.className='sr-dos-screen';
 boxnode.innerHTML='<div class="sr-dos-bios">COWBOY / PC · EGA VIDEO SYSTEM</div><pre aria-live="off" class="sr-dos-boot-log"></pre><div class="sr-dos-boot-actions"><span>PRESS ENTER TO START</span><button type="button" class="sr-dos-skip">SKIP BOOT [ESC]</button></div>';
 overlay.append(boxnode);ROOT.append(overlay);
 const log=boxnode.querySelector('.sr-dos-boot-log'),btn=boxnode.querySelector('.sr-dos-skip');
 let ended=false;let handler=null;
 const finish=()=>{
  if(ended)return;ended=true;booted=true;booting=false;
  overlay.remove();window.removeEventListener('keydown',handler,true);
  ROOT.classList.add('sr-dos-ready');window.COWBOY_STREETROD_RETRO=true;
  target.click();
  if(target.id==='sr-toggle'){
   const summer=ROOT.querySelector('#ss-nav-open');
   if(summer&&!summer.disabled&&!summer.hidden)summer.click();
  }
  schedule();
 };
 handler=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopPropagation();finish();}};
 window.addEventListener('keydown',handler,true);
 btn.addEventListener('click',finish);btn.focus();
 if(reduced){log.textContent=preamble.join('\n');return;}
 for(const item of preamble){
  if(ended)break;
  log.textContent+=item+'\n';
  await new Promise(res=>setTimeout(res,110));
 }
 if(!ended){log.textContent+='\nREADY. PRESS ENTER OR SKIP.\n';}
}
function capture(event){
 const btn=event.target.closest?.('#sr-toggle,#ss-nav-open');
 if(!btn||booted||booting||!ROOT?.contains(btn))return;
 event.preventDefault();event.stopImmediatePropagation();void bootAndOpen(btn);
}
if(ROOT){
 window.COWBOY_STREETROD_RETRO=true;
 ROOT.classList.add('sr-ega-mode');
 document.addEventListener('click',capture,true);
 const observer=new MutationObserver(schedule);
 observer.observe(ROOT,{subtree:true,childList:true});
 schedule();
}
