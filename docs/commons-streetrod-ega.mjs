/* Street r0d EGA Edition. Original procedural 320x200 / 16-colour artwork.
   No copyrighted screenshots, game files, music, or original software used.
   Compatible visual/boot layer: credits, bolts, races and RPCs remain authoritative.
*/
const EGA=['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'];
let ROOT=null;
let booted=false,booting=false,scheduled=false,decorated=new WeakSet();
const W=320,H=200;
const col=n=>EGA[Math.max(0,Math.min(15,n))];
function box(c,x,y,w,h,p){c.fillStyle=col(p);c.fillRect(x|0,y|0,Math.max(0,w|0),Math.max(0,h|0));}
function stroke(c,x,y,u,v,p,w=1){c.beginPath();c.strokeStyle=col(p);c.lineWidth=w;c.moveTo((x|0)+.5,(y|0)+.5);c.lineTo((u|0)+.5,(v|0)+.5);c.stroke();}
function poly(c,pts,p,outline=0){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col(p);c.fill();if(outline!==null){c.strokeStyle=col(outline);c.lineWidth=1;c.stroke();}}
function txt(c,t,x,y,p=15,size=7){c.fillStyle=col(p);c.font='bold '+size+'px monospace';c.textBaseline='top';c.fillText(String(t),x|0,y|0);}
function disk(c,x,y,r,p){c.fillStyle=col(p);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function keyhash(s){let h=19;for(const a of String(s||''))h=((h*33)^a.charCodeAt(0))>>>0;return h;}
function bodyFor(name){
 const s=String(name||'').toLowerCase();
 if(/van|parcel|cipher|bus/.test(s))return 'van';
 if(/pickup|truck|mammoth|irons|gravel|rover/.test(s))return 'truck';
 if(/wagon|nomad|mariner|estate/.test(s))return 'wagon';
 if(/fastback|muscle|meteor|phantom|raven|scorpion/.test(s))return 'muscle';
 if(/hardtop|comet|saturn|sedan/.test(s))return 'hardtop';
 return 'coupe';
}
function chromeWheel(c,x,y,r=16){
 disk(c,x,y,r+2,0);disk(c,x,y,r,7);disk(c,x,y,r-3,15);
 disk(c,x,y,r-6,8);disk(c,x,y,4,15);
 for(let i=0;i<8;i++){const t=i*Math.PI/4;stroke(c,x+Math.cos(t)*5,y+Math.sin(t)*5,x+Math.cos(t)*(r-7),y+Math.sin(t)*(r-7),15);}
}
function car(c,key='rattler',body='coupe',x=45,y=111,width=236){
 // Each fictional car has a deterministic body recipe, not just a new paint colour.
 // The hand-drawn shapes stay inside the same sixteen EGA palette entries.
 const h=keyhash(key),shape=(h>>>5)%4,trim=(h>>>12)%3;
 const family=String(body||'coupe').toLowerCase();
 const van=/van|bus/.test(family),wagon=/wagon|estate/.test(family);
 const pickup=/truck|pickup|rover/.test(family);
 const muscle=/muscle|fastback/.test(family),hardtop=/hardtop|sedan/.test(family);
 const paint=[2,3,4,5,6,9,12][h%7],light=paint===9?11:15;
 const roofPaint=trim===2?7:paint;
 const rearWheel=45+(h%9),frontWheel=189+((h>>>8)%9),wheelRadius=13+((h>>>15)%3);
 const deck=pickup?77:van?31:wagon?36:muscle?59:hardtop?53:67;
 const crown=van?2:wagon?4:pickup?6:muscle?5:hardtop?6:7;
 const roof=van?[[29,24],[43,crown],[174,crown],[191,24]]:
  wagon?[[36,24],[55,crown],[167,crown],[188,24]]:
  pickup?[[deck,24],[91,crown],[139,crown],[153,24]]:
  muscle?[[59,24],[88,crown],[127,crown+2],[174,24]]:
  hardtop?[[50,24],[68,crown],[149,crown],[172,24]]:
  [[deck,24],[83,crown],[126,crown],[151,24]];
 c.save();c.translate(x,y);c.scale(width/240,width/240);
 box(c,1,45,238,5,0);
 // Body panels: a real wagon tail, pickup bed, van nose and sloped fastback.
 poly(c,[[2,30],[16,26],[29,23],[deck,22],
   [pickup?156:188,23],[217,26],[235,32],[238,43],[4,43]],paint);
 if(pickup){box(c,8,23,67,4,7);box(c,8,26,4,9,15);box(c,70,24,4,12,0);}
 if(van){box(c,8,21,28,4,light);box(c,226,26,9,13,0);}
 if(wagon){box(c,11,23,24,3,light);}
 poly(c,roof,roofPaint);
 const r0=roof[0],r1=roof[1],r2=roof[2],r3=roof[3];
 poly(c,[[r1[0]+5,r1[1]+4],[r2[0]-5,r2[1]+4],[r3[0]-9,22],[r0[0]+8,22]],3,0);
 // Split windows and door seams by body type. Small per-model geometry varies.
 const mid=r1[0]+(r2[0]-r1[0])*((van||wagon)?0.61:0.50);
 stroke(c,mid,8,mid+((shape&1)?2:-2),22,0,2);
 if(van||wagon){const third=r1[0]+(r2[0]-r1[0])*.33;stroke(c,third,8,third,22,0,2);}
 const doorX=pickup?155:hardtop?141:muscle?145:136+shape*3;
 stroke(c,doorX,23,doorX,41,0);box(c,doorX-13,29,11,2,light);
 // Distinct belt-line, grille and tail-lamp treatments.
 box(c,10,31,218,2,trim===0?15:7);
 box(c,12,37,215,3,trim===1?0:8);
 for(let i=0;i<2+shape;i++)box(c,217+i*3,32,1,7,0);
 box(c,6,33,5,7,trim===0?12:14);
 box(c,229,31,5,8,trim===2?14:15);
 box(c,20,33,17+shape*3,3,trim===2?14:7);
 box(c,173,28,13,2,light);
 chromeWheel(c,rearWheel,43,wheelRadius);
 chromeWheel(c,frontWheel,43,wheelRadius);
 box(c,0,47,240,2,8);
 c.restore();
}
function border(c,title='',bottom='CLICK TO CONTINUE'){
 box(c,0,0,W,H,0);box(c,0,0,W,6,8);box(c,0,187,W,13,8);
 stroke(c,0,186,319,186,15);txt(c,title,8,8,15,7);
 txt(c,'BANKROLL',4,190,12,8);txt(c,bottom,156,190,12,7);
}
function garage(c,key,body){
 border(c,'COWBOY MOTOR WORKS / 1963','HIT THE STREET');
 // Brick garage with rafters, storage shelves, clock and real shop objects.
 box(c,0,17,320,169,8);
 box(c,0,17,320,24,6);
 poly(c,[[0,17],[120,17],[151,40],[133,40]],6,0);
 for(let x=0;x<320;x+=17)stroke(c,x,18,x+25,41,0,2);
 box(c,0,42,320,87,7);
 for(let y=43;y<128;y+=12){
  stroke(c,0,y,319,y,8,1);
  for(let x=((y/12)|0)%2?0:12;x<320;x+=25)stroke(c,x,y,x,y+11,8);
 }
 // Garage window and nighttime garden with small illuminated sign.
 box(c,5,55,86,48,0);box(c,9,58,78,42,3);
 for(let j=0;j<14;j++){
  const x=12+(j*23)%71,y=61+(j*17)%29;
  box(c,x,y,1+(j%3===0?1:0),1,15);
 }
 box(c,9,88,78,12,2);for(let x=10;x<86;x+=8)box(c,x,85+(x%4),4,6,10);
 box(c,8,58,2,42,0);box(c,85,58,2,42,0);
 box(c,47,58,2,42,7);box(c,10,77,77,2,0);
 // Top left painted banner.
 box(c,100,48,77,22,0);
 box(c,102,50,73,18,1);
 txt(c,'MOTOR',110,53,14,9);txt(c,'WORKS',109,61,15,7);
 // A rotary clock, pegboard and wall calendar.
 disk(c,186,56,14,0);disk(c,186,56,12,15);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;box(c,185+Math.cos(a)*10,55+Math.sin(a)*10,2,2,0);}
 stroke(c,186,56,186,48,0,2);stroke(c,186,56,193,59,0,2);
 box(c,224,47,53,40,0);box(c,227,49,47,36,7);
 for(let y=53;y<83;y+=7)for(let x=233;x<271;x+=8)box(c,x,y,2,2,8);
 // Wrenches and hammers are visible as physical, selectable shop equipment.
 for(let i=0;i<3;i++){
  const x=233+i*12;
  box(c,x,56,2,19,0);box(c,x-3,53,8,4,i===1?12:15);
  box(c,x-2,74,6,2,8);
 }
 box(c,285,47,31,45,15);box(c,287,50,27,39,11);
 box(c,289,53,23,9,0);txt(c,'JUL',290,54,15,7);
 txt(c,'19',292,68,0,10);txt(c,'63',292,80,0,6);
 // Two wooden storage shelves, cans, a radio, and cardboard cartons.
 box(c,196,92,118,5,6);box(c,196,115,118,5,6);
 for(let x=202;x<310;x+=14){
  const p=(x/14|0)%4;
  box(c,x,97,10,17,[3,4,2,5][p]);
  box(c,x,96,10,3,15);
  box(c,x+3,104,4,4,14);
 }
 box(c,198,122,31,20,6);box(c,201,125,25,15,8);box(c,235,122,34,20,6);
 box(c,239,126,25,11,7);box(c,271,123,34,19,0);
 box(c,275,126,26,12,8);txt(c,'RADIO',275,127,15,5);
 // Open work area and service pit below the car.
 box(c,0,132,320,55,7);
 poly(c,[[0,135],[320,126],[320,146],[0,156]],8,null);
 for(let i=0;i<31;i++){const x=(i*53)%320,y=140+(i*17)%42;box(c,x,y,1+(i%3),1,0);}
 box(c,23,173,265,4,0);
 box(c,32,177,230,2,8);
 // The selected vehicle dominates the foreground, but is not a flat CSS car.
 box(c,25,152,265,5,8);
 car(c,key,body,27,103,262);
 // Floor tools: newspaper, axle jack, oil bottle, lug wrench, shop rag.
 poly(c,[[9,166],[37,163],[46,177],[18,181]],15);
 for(let i=0;i<4;i++)stroke(c,14,168+i*3,35,166+i*3,8);
 box(c,151,165,29,5,6);box(c,162,152,5,19,8);box(c,164,147,10,7,12);
 disk(c,157,173,4,0);disk(c,177,173,4,0);
 box(c,206,168,40,3,0);stroke(c,207,168,220,156,0,2);
 disk(c,231,157,6,8);disk(c,231,157,3,15);
 box(c,254,165,9,16,5);box(c,255,162,7,4,15);
 box(c,282,151,30,28,2);box(c,285,148,24,5,10);
 stroke(c,288,161,303,174,0,2);stroke(c,303,161,288,174,0,2);
}
function diner(c,rivalKey='meteor',rivalBody='muscle'){
 border(c,'MOONLIGHT DRIVE-IN','CLICK A DRIVER TO CHALLENGE');
 box(c,0,17,320,170,0);
 // Deep purple night with twinkling white stars behind a bustling neon cafe.
 for(let i=0;i<38;i++){
  const x=(i*73+11)%319,y=18+(i*19)%73;
  box(c,x,y,1+(i%5===0?1:0),1,i%4===0?13:15);
 }
 box(c,0,76,320,95,7);
 for(let x=0;x<320;x+=13){box(c,x,69+(x%4),11,7,8);}
 // Angular roof, neon trim, tall glass windows and booths.
 poly(c,[[0,63],[31,42],[280,42],[320,64],[320,84],[0,84]],8,0);
 box(c,0,59,320,6,5);box(c,0,65,320,3,13);
 box(c,0,72,320,4,2);
 for(let i=0;i<4;i++){
  const x=10+i*78;
  box(c,x,83,72,51,0);
  box(c,x+3,86,66,44,3);
  box(c,x+4,86,63,5,11);
  for(let b=0;b<3;b++){
   disk(c,x+13+b*18,103+(b%2)*3,5,b===1?12:6);
   box(c,x+7+b*18,108,13,13,b===1?13:5);
  }
  box(c,x+8,125,50,5,6);
 }
 for(let x=5;x<=319;x+=78)box(c,x,79,4,57,0);
 // Neon original sign is drawn from glyphs, not borrowed game art.
 box(c,74,20,176,39,5);box(c,78,23,168,33,0);
 box(c,83,25,159,27,4);
 txt(c,'MOONLIGHT',95,28,13,15);
 txt(c,'DRIVE-IN',113,45,14,9);
 disk(c,43,44,21,6);disk(c,43,44,17,14);
 box(c,27,41,32,5,12);box(c,30,47,26,3,15);
 box(c,33,53,20,4,6);
 box(c,258,38,38,19,0);txt(c,'OPEN',262,42,10,10);
 // Road, parking lines, two differently-bodied customers, street lamp.
 box(c,0,136,320,51,8);box(c,0,162,320,5,0);
 stroke(c,0,168,319,168,7,3);
 for(let x=11;x<319;x+=58)box(c,x,179,35,2,15);
 box(c,296,20,3,131,7);disk(c,297,23,8,15);
 box(c,286,30,20,7,14);
 car(c,'comet','hardtop',4,128,163);
 car(c,rivalKey,rivalBody,158,128,154);
 // Drivers and a take-out bag near the sidewalk.
 disk(c,275,120,5,6);box(c,271,125,10,11,3);
 box(c,277,138,11,11,6);box(c,281,135,4,3,0);
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
/* Interactive classified inspection: original geometry, independently drawn
 * paintwork. This scene is generated locally; no DOS LIB assets or photos. */
function carInspection(c,key,body){
 border(c,'USED MOTOR CARS / INSPECTION','BUY / HAGGLE / RETURN');
 box(c,0,18,320,169,8);
 box(c,10,26,300,122,0);box(c,13,29,294,116,7);
 // Studio worklights, platform and mechanic's measuring marks.
 box(c,18,34,284,8,8);txt(c,'USED CAR INSPECTION',80,35,14,10);
 for(let x=25;x<300;x+=23)box(c,x,45,1,67,8);
 box(c,20,128,280,9,0);box(c,23,136,274,3,15);
 car(c,key,body,21,69,279);
 box(c,13,153,294,24,15);
 txt(c,String(key||'MOTOR CAR').toUpperCase().slice(0,30),20,157,0,10);
 txt(c,'INSPECT BODY / COMPARE PRICE BEFORE BUYING',19,170,0,7);
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
// The public, purely decorative EGA painter is shared with the new
// in-scene adventure controller. It never accesses private game state.
function partsSheet(c){
 border(c,'THE MOTOR YARD PARTS COUNTER','BUY / FIT / RETURN');
 box(c,5,18,310,160,7);
 box(c,10,22,300,13,8);txt(c,'NEW AND USED MOTOR PARTS',52,25,14,10);
 for(let row=0;row<3;row++){
  const y=42+row*43;
  box(c,16,y,288,37,15);box(c,19,y+3,282,31,row===1?7:8);
  txt(c,['ENGINE / INTAKE','WHEELS AND RUBBER','GEARBOX / GEARS'][row],27,y+6,0,9);
  // Individually shaped shop-floor components, kept in 16 colours.
  if(row===0){for(let j=0;j<5;j++){box(c,197+j*13,y+11,9,13,0);box(c,199+j*13,y+9,5,4,7);}}
  if(row===1){for(let j=0;j<3;j++){disk(c,214+j*25,y+18,12,0);disk(c,214+j*25,y+18,8,7);}}
  if(row===2){poly(c,[[197,y+12],[215,y+7],[242,y+7],[263,y+14],[261,y+24],[197,y+24]],8);for(let j=0;j<5;j++)box(c,201+j*12,y+15,5,6,0);}
 }
}
function vintageCalendar(c){
 border(c,'SUMMER 1963','EVERY JOB TAKES TIME');
 box(c,39,18,242,166,15);box(c,43,22,234,24,4);
 txt(c,'SUMMER 1963',109,29,15,13);
 const days=['S','M','T','W','T','F','S'];
 for(let i=0;i<7;i++)txt(c,days[i],62+i*30,52,0,9);
 for(let r=0;r<5;r++)for(let col=0;col<7;col++){
  const x=50+col*30,y=68+r*21;
  box(c,x,y,26,18,(r+col)%2?7:15);
  const n=r*7+col+1;if(n<=31)txt(c,String(n),x+7,y+5,0,9);
 }
 box(c,48,171,224,8,6);
}
function gearbox(c){
 border(c,'UNDER THE CAR','BOLTS FIRST / LINKAGE SECOND');
 box(c,8,20,304,162,8);box(c,16,27,287,134,7);
 box(c,26,45,267,28,0);box(c,30,51,258,17,8);
 poly(c,[[64,101],[95,85],[208,85],[246,103],[240,126],[72,127]],8,0);
 for(let i=0;i<8;i++)box(c,94+i*15,93,8,27,i%2?0:7);
 for(let i=0;i<4;i++){const x=82+i*49;disk(c,x,131,7,0);disk(c,x,131,4,15);}
 box(c,180,70,31,15,7);txt(c,'SHIFT LINKAGE',101,148,0,8);
}
function smoothRoad(c,opts={}){dash(c,opts);}
/* Original sixteen-colour roadside incident screens.
 * None of these pixels, dialogues, designs or audio are sourced from DOS assets. */
function jail(c){
 border(c,'COUNTY HIGHWAY PATROL','SLOW DOWN AND DRIVE SMART');
 box(c,0,18,320,161,7);
 for(let y=20;y<161;y+=14){
  stroke(c,0,y,319,y,8);
  for(let x=(y/14)%2?0:20;x<320;x+=40)stroke(c,x,y,x,y+14,8);
 }
 box(c,37,32,247,109,15);box(c,43,38,235,97,8);
 box(c,47,43,227,87,7);
 for(let x=56;x<266;x+=24){box(c,x,42,7,96,0);box(c,x+1,42,2,96,15);}
 box(c,43,39,235,7,0);box(c,43,127,235,8,0);
 box(c,65,113,99,11,6);box(c,70,124,5,28,0);box(c,153,124,5,28,0);
 box(c,178,111,66,10,6);box(c,184,119,5,26,0);box(c,233,119,5,26,0);
 // A pixelated fictional officer with a ticket book.
 disk(c,259,77,13,6);box(c,247,87,25,30,1);
 box(c,243,92,33,7,1);box(c,246,114,11,34,0);box(c,264,114,11,34,0);
 box(c,245,62,28,7,1);box(c,252,55,14,9,1);box(c,250,69,17,4,0);
 box(c,246,99,20,12,15);txt(c,'FINE',246,101,0,7);
 box(c,15,166,290,14,1);txt(c,'ONE SUMMER DAY LOST · RESPECT THE PATROL',25,169,14,9);
}
function breakdown(c){
 border(c,'ROADSIDE TROUBLE','RETURN TO YOUR GARAGE');
 box(c,0,18,320,166,3);box(c,0,96,320,83,2);
 poly(c,[[0,130],[320,123],[320,178],[0,178]],8,0);
 for(let x=4;x<320;x+=52)box(c,x,170,31,2,15);
 // Stranded coupe, open hood and smoke.
 car(c,'wren49','coupe',27,100,220);
 poly(c,[[170,112],[208,78],[221,80],[195,111]],8,0);
 for(let i=0;i<6;i++){
  const x=194+i*10,y=65-(i%3)*10;
  disk(c,x,y,9+(i%2)*4,i%2?7:15);
  disk(c,x+4,y-9,7,8);
 }
 box(c,5,19,116,19,4);txt(c,'ENGINE OVERHEAT',13,25,15,9);
 box(c,7,149,119,13,0);txt(c,'TOOLS NEEDED',14,151,14,9);
}
function championship(c){
 border(c,'SUMMER CHAMPION 1963','KING OF THE STRIP');
 box(c,0,18,320,166,1);
 for(let i=0;i<36;i++){
  const x=(i*59)%315,y=22+(i*43)%128;
  box(c,x,y,2,2,[14,15,11,10][i%4]);
 }
 box(c,82,28,155,27,6);box(c,85,31,149,21,14);
 txt(c,'CHAMPION',108,36,0,17);
 disk(c,160,93,35,14);disk(c,160,93,28,6);disk(c,160,93,23,14);
 txt(c,'1963',139,85,0,18);
 box(c,124,119,73,12,6);box(c,112,131,97,10,14);box(c,100,141,121,15,6);
 txt(c,'YOU BEAT THE',103,161,15,8);
 txt(c,'MYSTERY MACHINE',86,174,14,11);
}
window.COWBOY_STREETROD_PAINT=function(canvas,scene='garage',options={}){
 if(!(canvas instanceof HTMLCanvasElement))return;
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
 ctx.imageSmoothingEnabled=false;
 const kind=scene==='paper'?'newspaper':scene==='parts'?'parts':
  scene==='tune'||scene==='hood'?'engine':scene==='drive'?'dash':
  scene==='calendar'?'calendar':scene==='gearbox'?'gearbox':scene;
 const render={garage,diner,engine,newspaper,gas,dash,parts:partsSheet,carinspect:carInspection,calendar:vintageCalendar,gearbox,jail,breakdown,championship};
 if(kind==='dash')dash(ctx,options);
 else if(kind==='diner')diner(ctx,options.rivalCarKey||'meteor',options.rivalBody||'muscle');
 else (render[kind]||garage)(ctx,options.carKey||'rattler',options.body||'coupe');
 if(kind==='diner'&&options.boss)mysteryMachine(ctx,133,125,179);
 if(kind==='garage'&&/mystery machine/i.test(String(options.carKey||'')))mysteryMachine(ctx,50,116,234);
 // Original palette and proportions, but never copied asset pixels.
 if(options.label&&['garage','diner'].includes(kind)){
  box(ctx,12,172,Math.min(270,String(options.label).length*6+10),11,0);
  txt(ctx,String(options.label).slice(0,38).toUpperCase(),16,174,15,7);
 }
 if(options.bankroll!==undefined){
  box(ctx,66,189,80,10,8);
  txt(ctx,'USD '+Math.max(0,Number(options.bankroll)||0).toLocaleString('en-US'),68,190,14,8);
 }
 if(options.subtitle){
  box(ctx,133,189,180,10,8);
  txt(ctx,String(options.subtitle).slice(0,32).toUpperCase(),137,190,14,7);
 }
};
/* Custom final boss: original turquoise floral van, never an imported
   copyrighted TV/game sprite. It uses exactly the EGA 16-colour palette. */
function mysteryMachine(c,x=138,y=127,width=175){
 c.save();c.translate(x,y);c.scale(width/240,width/240);
 box(c,0,0,240,86,0);
 // Long forward-control van with squared roof and deep turquoise metal.
 poly(c,[[4,29],[10,21],[25,13],[32,6],[195,6],[216,15],[234,25],[238,31],[239,61],[2,61]],3,0);
 box(c,17,12,185,9,11);box(c,3,33,232,4,11);
 poly(c,[[29,17],[37,8],[112,8],[112,28],[27,28]],0,15);
 poly(c,[[119,8],[194,8],[213,25],[119,28]],0,15);
 box(c,27,31,2,26,15);box(c,116,28,2,32,15);
 box(c,208,27,2,31,0);box(c,12,49,218,5,14);
 // An original sweeping botanical strip, not a copied decal.
 poly(c,[[15,46],[40,37],[74,43],[110,37],[154,46],[197,39],[227,45],
  [224,54],[188,48],[145,54],[109,45],[70,52],[35,46],[17,52]],10,null);
 for(let j=0;j<5;j++){
  const xx=48+j*34, yy=j%2?43:37;
  for(let a=0;a<6;a++){
   const rad=a*Math.PI/3;disk(c,xx+Math.cos(rad)*7,yy+Math.sin(rad)*7,4,j%2?14:15);
  }
  disk(c,xx,yy,4,6);
 }
 box(c,162,26,40,5,15);txt(c,'MYSTERY',163,28,0,7);
 box(c,216,37,12,12,15);box(c,218,40,7,6,14);
 disk(c,54,59,17,0);disk(c,54,59,12,7);disk(c,54,59,6,15);
 disk(c,190,59,17,0);disk(c,190,59,12,7);disk(c,190,59,6,15);
 box(c,0,63,240,2,8);
 c.restore();
}
function componentCard(c,key,body){
 box(c,0,0,160,70,0);
 car(c,key,body,4,14,154);
}
const scenes={
 '.ss-garage-stage':['garage',n=>{let name=n.closest('#streetrod-summer')?.querySelector('.ss-garage-overlay span')?.textContent||'rattler';return [name,bodyFor(name)];}],
 '.src-garage-stage':['garage',n=>{const name=n.querySelector('#src-current-ride')?.textContent||'rattler';return [name,bodyFor(name)];}],
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
  const label=img.closest('.src-garage-stage')?.querySelector('#src-current-ride')?.textContent||
   img.closest('.ss-garage-stage')?.querySelector('.ss-garage-overlay span')?.textContent||
   img.closest('.sr-car-card,.scc-car-card,.srj-car-card,.ss-ad,.src-scene-stage')?.querySelector('strong')?.textContent||
   img.closest('.ss-ad')?.querySelector('strong')?.textContent||img.alt||'rattler';
  const body=bodyFor(label);
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
function schedule(){if(scheduled)return;scheduled=true;window.setTimeout(()=>{scheduled=false;decorate()},120);}
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
function monitorMode(enabled){
 if(!ROOT)return;
 ROOT.classList.toggle('sr-dos-fullscreen',Boolean(enabled));
 const btn=ROOT.querySelector('#sr-dos-maximize');
 if(btn){
  btn.textContent=enabled?'EXIT DOS DISPLAY [ESC]':'EXPAND DOS DISPLAY';
  btn.setAttribute('aria-pressed',String(Boolean(enabled)));
 }
}
function addMonitorControls(){
 if(!ROOT)return;
 const inside=ROOT.querySelector('#sr-inside');
 if(!inside||inside.querySelector('#sr-dos-maximize'))return;
 const btn=document.createElement('button');
 btn.id='sr-dos-maximize';btn.type='button';
 btn.textContent='EXPAND DOS DISPLAY';btn.className='sr-dos-monitor-toggle';
 btn.setAttribute('aria-pressed','false');
 btn.addEventListener('click',()=>monitorMode(!ROOT.classList.contains('sr-dos-fullscreen')));
 inside.prepend(btn);
 window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&ROOT.classList.contains('sr-dos-fullscreen')&&!booting){
   e.preventDefault();monitorMode(false);
  }
 });
}
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
  addMonitorControls();monitorMode(true);
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
function install(){
 if(ROOT?.isConnected)return true;
 ROOT=document.getElementById('streetrod-root');
 if(!ROOT)return false;
 window.COWBOY_STREETROD_RETRO=true;
 ROOT.classList.add('sr-ega-mode');
 addMonitorControls();
 document.addEventListener('click',capture,true);
 const observer=new MutationObserver(schedule);
 observer.observe(ROOT,{subtree:true,childList:true});
 schedule();return true;
}
if(!window.COWBOY_STREETROD_REBORN){
 if(!install()){
  const wait=new MutationObserver(()=>{if(install())wait.disconnect();});
  wait.observe(document.body,{subtree:true,childList:true});
 }
}
