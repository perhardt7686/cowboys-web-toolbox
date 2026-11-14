// Independently drawn EGA scenes. All strokes and textures resolve to whole pixels.
import {CARS, PARTS, SLOT_NAMES, isWheel} from './hot-rod-catalog.mjs';
import {courseCurve, displaySpeed, raceClock} from './hot-rod-racing.mjs';

export const EGA = Object.freeze([
  '#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa',
  '#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'
]);
const CHROME = [0,8,7,15,7,8];
const PAINT = {
  1:[0,1,9,7], 2:[0,2,10,15], 3:[1,3,11,15], 4:[0,4,12,7], 5:[1,5,13,15],
  6:[4,6,14,15], 7:[0,8,7,15], 9:[1,9,11,15], 10:[2,10,14,15],
  12:[4,12,14,15], 13:[5,13,15,11], 14:[6,14,15,7], 15:[8,7,15,11]
};
const FONT = {
  A:'0e11111f111111',B:'1e11111e11111e',C:'0e11101010110e',D:'1e11111111111e',
  E:'1f10101e10101f',F:'1f10101e101010',G:'0e11101711110e',H:'1111111f111111',
  I:'0e04040404040e',J:'0702020212120c',K:'11121418141211',L:'1010101010101f',
  M:'111b1515111111',N:'11191915131311',O:'0e11111111110e',P:'1e11111e101010',
  Q:'0e11111115120d',R:'1e11111e141211',S:'0f10100e01011e',T:'1f040404040404',
  U:'1111111111110e',V:'11111111110a04',W:'11111115151b11',X:'11110a040a1111',
  Y:'11110a04040404',Z:'1f01020408101f',
  0:'0e11131519110e',1:'040c040404040e',2:'0e11010204081f',3:'1e01010601111e',
  4:'02060a121f0202',5:'1f10101e01011e',6:'0608101e11110e',7:'1f010204080808',
  8:'0e11110e11110e',9:'0e11110f01020c','-':'0000001f000000','.':'00000000000004',
  ',':'00000000000408',':':'00040000040000','/':'01020204080810','!':'04040404040004',
  '?':'0e110206040004',"'":'04040800000000','&':'0c12140a15120d',
  '+':'0004041f040400','(':'02040808080402',')':'08040202020408',
  '$':'040f140e051e04','>':'10080402040810','=':'00001f001f0000'
};
const GLYPHS = Object.fromEntries(Object.entries(FONT).map(([c, bits]) =>
  [c, Array.from({length:7}, (_,i) => parseInt(bits.slice(i * 2, i * 2 + 2), 16))]));
const trunc = (value, low, high) => Math.max(low, Math.min(high, value));
const tone = color => PAINT[color] || PAINT[1];

class Screen {
  constructor(context) { this.ctx = context; }
  box(x,y,w,h,color) {
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = EGA[color];
    this.ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  }
  line(x,y,toX,toY,color) {
    x = Math.round(x); y = Math.round(y); toX = Math.round(toX); toY = Math.round(toY);
    if (x === toX) { this.box(x,Math.min(y,toY),1,Math.abs(y-toY)+1,color); return; }
    if (y === toY) { this.box(Math.min(x,toX),y,Math.abs(x-toX)+1,1,color); return; }
    const dx = Math.abs(toX-x), dy = -Math.abs(toY-y);
    const sx = x < toX ? 1 : -1, sy = y < toY ? 1 : -1;
    let error = dx + dy;
    for (;;) {
      this.box(x,y,1,1,color);
      if (x === toX && y === toY) return;
      const double = 2 * error;
      if (double >= dy) { error += dy; x += sx; }
      if (double <= dx) { error += dx; y += sy; }
    }
  }
  poly(points,color) {
    const ys = points.map(point => point[1]);
    const low = Math.max(0,Math.floor(Math.min(...ys))), high = Math.min(199,Math.ceil(Math.max(...ys)));
    const cuts = [];
    for (let y=low;y<=high;y++) {
      cuts.length = 0;
      const scan = y + 0.5;
      for (let j=0;j<points.length;j++) {
        const [xa,ya] = points[j], [xb,yb] = points[(j+1)%points.length];
        if ((ya <= scan && yb > scan) || (yb <= scan && ya > scan)) cuts.push(xa + (scan-ya)*(xb-xa)/(yb-ya));
      }
      cuts.sort((a,b)=>a-b);
      for (let j=0;j<cuts.length;j+=2) {
        const x = Math.round(cuts[j]);
        this.box(x,y,Math.round(cuts[j+1])-x,1,color);
      }
    }
  }
  ellipse(x,y,rx,ry,color) {
    for (let dy=-ry;dy<=ry;dy++) {
      const width = Math.floor(rx*Math.sqrt(Math.max(0,1-(dy/ry)**2)));
      this.box(x-width,y+dy,width*2+1,1,color);
    }
  }
  text(value,x,y,color=15,scale=1) {
    for (const c of String(value).toUpperCase()) {
      GLYPHS[c]?.forEach((bits,row) => {
        for (let col=0;col<5;col++) if (bits & (1<<(4-col)))
          this.box(x+col*scale,y+row*scale,scale,scale,color);
      });
      x+=6*scale;
    }
  }
  center(value,x,y,color=15,scale=1) { this.text(value,x-Math.floor((String(value).length*6-1)*scale/2),y,color,scale); }
  frame(x,y,w,h,fill=7,lit=15,shade=8) {
    this.box(x,y,w,h,shade);
    this.box(x+1,y+1,w-2,h-2,fill);
    this.box(x,y,w-1,1,lit);
    this.box(x,y+1,1,h-2,lit);
  }
  noise(x,y,w,h,count,colors,seed=42) {
    let random = seed >>> 0;
    for (let i=0;i<count;i++) {
      random = (Math.imul(random,1664525)+1013904223)>>>0;
      const px=(random>>>12)%w, py=(random>>>22)%h;
      this.box(x+px,y+py,1,1,colors[(random>>>7)%colors.length]);
    }
  }
}

const shapes = {
  deuce:{roof:[[13,42],[28,14],[43,7],[91,7],[111,20],[124,42]], glass:[[31,36],[42,13],[89,13],[105,23],[116,39]], deck:110, nose:206, wheel:[50,183], fenders:true},
  round:{roof:[[14,44],[33,20],[57,8],[103,8],[128,22],[146,42]], glass:[[35,36],[58,14],[102,14],[123,24],[136,39]], deck:143, nose:218, wheel:[50,185], fenders:true},
  open:{roof:[[32,44],[55,24],[97,23],[123,34],[141,41]], glass:[[60,35],[97,27],[118,36],[126,39]], deck:136,nose:224,wheel:[47,189],fenders:false},
  hard:{roof:[[16,43],[43,19],[65,10],[125,10],[146,25],[155,40]], glass:[[47,34],[66,15],[122,15],[137,26],[146,37]],deck:154,nose:225,wheel:[51,192],fenders:false},
  fin:{roof:[[24,43],[49,21],[68,11],[119,11],[144,24],[159,42]],glass:[[48,37],[70,16],[118,16],[136,26],[150,40]],deck:155,nose:226,wheel:[50,189],fenders:false},
  sting:{roof:[[20,45],[41,37],[72,19],[118,14],[139,27],[151,42]],glass:[[59,36],[74,23],[117,19],[136,31],[144,40]],deck:152,nose:228,wheel:[50,190],fenders:false},
  van:{roof:[[10,49],[12,5],[156,5],[178,22],[188,48]],glass:[[145,17],[157,17],[174,28],[177,39],[145,39]],deck:184,nose:220,wheel:[47,187],fenders:false}
};

function wheel(s,x,y,r,raised=false) {
  if (!r) return;
  s.ellipse(x,y,r+1,r+1,0);
  s.ellipse(x,y,r-2,r-2,8);
  s.ellipse(x,y,r-3,r-3,7);
  s.ellipse(x,y,Math.max(1,r-5),Math.max(1,r-5),15);
  s.ellipse(x,y,Math.max(1,r-7),Math.max(1,r-7),8);
  for (const [dx,dy] of [[-4,0],[4,0],[0,-4],[0,4],[-3,-3],[3,3],[-3,3],[3,-3]]) {
    if (r>=8) s.box(x+dx,y+dy,1,1,raised?15:0);
  }
  s.box(x-1,y-1,3,3,7);
  s.box(x-1,y-1,1,1,15);
}

function profile(s,model,car,x=56,y=93,scale=1) {
  if (!model) return;
  const shape = shapes[model.body] || shapes.round, [shadow,base,light,shine] = tone(car?.color ?? model.color);
  const sc = (vx,vy) => [x+vx*scale,y+vy*scale];
  const rect=(vx,vy,w,h,c)=>s.box(...sc(vx,vy),w*scale,Math.max(1,h*scale),c);
  const trace=(points,c)=>s.poly(points.map(([vx,vy])=>sc(vx,vy)),c);
  const line=(a,b,c,d,color)=>s.line(...sc(a,b),...sc(c,d),color);
  const kind=model.body;
  const roof=shape.roof.map(([px,py])=>[px,car?.roof?Math.round(py+(42-py)*0.28):py]);
  const glass=shape.glass.map(([px,py])=>[px,car?.roof?Math.round(py+(42-py)*0.28):py]);
  const ends=kind==='fin'?[[0,27],[14,36]]:kind==='van'?[[1,41],[4,42]]:[[4,43],[17,38]];
  trace([[0,61],[23,62],[208,62],[237,68],[226,73],[55,73],[2,69]],8);
  trace([...ends,...roof,[shape.deck,40],[shape.nose,42],[234,47],[239,59],[230,65],[8,65],[1,58]],0);
  trace([...roof,[shape.deck,42],[14,43]],base);
  trace(glass,1);
  trace(glass.map(([px,py])=>[px+(px>100?-2:2),py+1]),0);
  for (let j=1;j<glass.length;j++) line(...glass[j-1],...glass[j],7);
  if (kind!=='open' && kind!=='van') line(92,glass[2][1],91,41,7);
  const belt=kind==='van'?49:43;
  trace([[4,44],[shape.nose-8,belt],[230,48],[235,53],[232,60],[8,61],[4,55]],base);
  if (kind==='van') {
    trace([[8,13],[143,13],[143,48],[7,48]],base);
    trace([[9,33],[146,28],[169,39],[161,55],[103,51],[75,42],[8,49]],11);
    trace([[8,26],[41,21],[75,25],[86,38],[63,42],[48,34],[8,42]],10);
    if (scale >= 0.75) s.text('MYSTERY',x+29*scale,y+24*scale,14);
    for (const dx of [115,132]) {
      rect(dx,44,3,11,12); rect(dx-4,48,11,3,12); rect(dx,48,3,3,14);
    }
  }
  if (shape.fenders) {
    for (const nx of shape.wheel) {
      trace([[nx-28,56],[nx-17,45],[nx-7,42],[nx+9,43],[nx+18,47],[nx+29,57],[nx+25,62],[nx-27,62]],light);
      trace([[nx-17,50],[nx-9,45],[nx+7,45],[nx+18,51],[nx+19,60],[nx-18,62]],base);
    }
  }
  line(13,51,224,51,light);
  if (kind==='sting') {
    trace([[134,45],[156,47],[180,43],[223,44],[204,50],[171,51],[154,57]],light);
    trace([[135,48],[151,48],[171,53],[154,56],[139,55]],shadow);
    for (let i=0;i<3;i++) line(158+i*3,48,161+i*3,53,7);
  }
  line(10,56,228,56,shadow);
  line(20,57,222,57,base);
  line(72,59,166,59,7);
  line(72,60,166,60,shine);
  if (kind!=='van') {
    line(83,42,81,57,shadow);
    line(131,41,132,57,shadow);
    rect(111,47,9,2,shine);
    rect(181,39,32,1,light);
  }
  for (const nx of shape.wheel) {
    if (car?.installed && !car.installed[nx<100?'rear-left':'front-left']) continue;
    wheel(s,...sc(nx,61-(car?.jack?.startsWith(nx<100?'rear':'front')?3:0)),Math.max(1,Math.round(13*scale)),Boolean(car?.jack));
  }
  rect(222,46,9,3,14); rect(224,49,12,4,shine);
  rect(5,45,6,4,12); rect(5,52,4,4,4);
  for (let i=0;i<5;i++) rect(222,53+i,11,1,i%2?8:7);
  if (car?.front!==false) { rect(225,60,14,3,15); rect(220,63,18,2,8); }
  if (car?.rear!==false) { rect(0,59,19,3,15); rect(2,62,13,2,8); }
  if (car?.decal && kind !== 'van') {
    trace([[96,49],[106,46],[119,48],[107,53],[117,54],[98,57],[102,53],[91,53]],car.decal === 3 ? 11 : 14);
    if (car.decal === 2) rect(105,50,5,3,12);
  }
}

function footer(s,left,right='') {
  s.box(0,186,320,14,0);
  s.box(0,185,320,1,7);
  if (left) s.text(left,5,190,12);
  if (right) s.text(right,315-right.length*6,190,7);
}

function clock(s,x,y) {
  s.ellipse(x,y,11,11,0);
  s.ellipse(x,y,9,9,8);
  s.ellipse(x,y,8,8,15);
  s.box(x-1,y-7,2,1,8);s.box(x-1,y+6,2,1,8);
  s.box(x-7,y-1,1,2,8);s.box(x+7,y-1,1,2,8);
  s.line(x,y,x-4,y-3,0); s.line(x,y,x+3,y-5,4);
}

function newspaper(s,x,y) {
  s.poly([[x+3,y+9],[x+15,y+1],[x+33,y+6],[x+26,y+18],[x,y+15]],0);
  s.poly([[x+2,y+8],[x+12,y],[x+32,y+6],[x+24,y+15],[x,y+11]],15);
  s.line(x+14,y+2,x+8,y+12,8);
  for (const i of [0,2,4,6]) {
    s.line(x+16,y+3+i,x+27,y+5+i,8);
    s.line(x+4,y+7+i,x+9,y+8+i,7);
  }
  s.box(x+2,y+2,4,5,7);
}
function fuelCan(s,x,y) {
  s.frame(x+7,y,10,6,2,10,0);s.box(x+9,y+2,6,2,0);
  s.poly([[x+3,y+3],[x+17,y+3],[x+22,y+8],[x+21,y+21],[x+1,y+21],[x,y+8]],2);
  s.line(x+2,y+5,x+18,y+5,10);s.line(x+2,y+7,x+2,y+19,10);
  s.line(x+3,y+8,x+18,y+19,0);s.line(x+18,y+7,x+3,y+19,10);
  s.box(x+20,y+3,4,3,7);
}
function sky(s,y,trees=false) {
  s.box(0,0,320,y,0);
  s.noise(0,2,320,y-3,54,[8,7,15],146);
  s.ellipse(267,23,9,9,7);s.ellipse(270,21,8,8,0);
  for (let x=0;x<320;x+=3) {
    const top=y-5-Math.round((Math.sin(x*0.142)+1)*3)-(x%8);
    s.box(x,top,3,y-top,trees?2:8);
    if (trees && x%5===0) s.box(x+1,top,1,3,10);
  }
}
function tools(s,x,y) {
  for (let i=0;i<9;i++) {
    const xx=x+i*8;
    s.box(xx,y+4,2,5+i%3*3,i%2===0?7:8);
    s.box(xx-1,y+1,4,3,i%3===0?14:15);
    s.box(xx,y+1,2,1,0);
  }
}
function garage(s,{car,model,title='',radio=false}) {
  s.box(0,0,320,200,0);
  s.box(61,18,259,128,8);
  s.box(63,28,248,110,7);
  s.box(63,30,248,101,8);
  for (let y=33;y<125;y+=9) {
    s.box(65,y,245,1,7);
    for (let x=65+(y%2)*13;x<305;x+=23) s.box(x,y,1,8,0);
  }
  s.box(65,29,249,7,8);
  s.poly([[60,0],[320,0],[320,15],[302,27],[63,27]],8);
  s.poly([[0,0],[177,0],[74,33],[0,36]],6);
  for (let i=0;i<15;i++) s.line(i*11,0,5+i*4,31,0);
  s.line(0,35,73,32,7);
  s.line(73,32,175,0,7);
  s.poly([[0,39],[53,39],[53,133],[0,147]],0);
  for (let x=0;x<52;x+=5) {
    s.box(x,86+(x%3),3,34,6);s.box(x,89,1,28,4);
    s.box(x,114-(x*5%7),5,22,2);s.box(x,119-(x%5),2,15,10);
  }
  s.box(0,96,52,2,8);s.box(0,104,52,2,8);
  s.line(0,133,53,121,15);s.line(0,137,53,125,8);
  s.noise(0,46,51,44,19,[8,15,7],418);
  s.box(52,34,10,109,0);s.box(54,35,2,104,7);s.box(58,35,2,103,8);
  s.line(69,37,68,78,7);s.line(68,78,75,86,7);s.ellipse(76,86,4,3,8);
  s.poly([[63,132],[314,126],[319,186],[0,186],[0,146]],7);
  s.poly([[66,134],[310,132],[307,147],[15,151]],8);
  s.noise(1,149,318,34,400,[7,8,15],53);
  s.line(29,184,120,148,8);s.line(258,184,269,155,8);
  s.poly([[307,23],[320,11],[320,179],[311,151],[307,129]],8);
  s.line(310,25,310,125,7);

  s.frame(86,16,199,14,15,7,0);
  const plate=title && title!=='Hot Rod' ? title : model?.name || 'GARAGE BAY NO. 1';
  s.center(plate.slice(0,31),185,20,0);
  clock(s,151,46);
  s.frame(287,44,17,29,15,7,0);
  s.box(288,46,15,5,3);
  for (let j=0;j<4;j++) for (let i=0;i<4;i++) s.box(289+i*3,53+j*4,2,2,j===2&&i===1?4:8);
  s.frame(91,60,25,28,6,0,0);
  s.box(94,64,19,21,15);s.box(100,61,7,4,7);
  for (let j=0;j<4;j++) s.box(97,69+j*4,12-j%2,1,8);

  s.box(124,74,72,5,0);s.box(122,72,76,3,6);s.box(123,72,72,1,12);
  for (let i=0;i<11;i++) {
    const x=125+i*6,y=61+i%3*2;
    s.box(x,y,4,72-y,[14,3,7,2,4][i%5]);s.box(x,y,4,1,15);
  }
  tools(s,128,82);
  s.box(129,98,38,3,7); s.box(158,92,9,6,2);
  s.box(216,75,67,5,0);s.box(215,73,69,3,6);s.box(218,73,64,1,12);
  s.frame(236,62,31,11,8,7,0);s.box(237,64,12,6,0);
  for(let x=238;x<249;x+=2)s.box(x,65,1,4,7);
  s.box(252,65,12,2,radio?14:6);s.box(256,69,3,1,radio?10:7);
  s.line(266,63,273,53,15);
  s.box(220,66,5,6,11);s.box(227,64,4,8,4);s.box(274,65,5,8,2);
  s.box(215,112,86,18,0);s.box(213,105,86,6,6);s.box(214,105,85,2,12);
  s.box(215,111,87,3,8);s.box(216,114,4,22,6);s.box(294,113,5,21,6);
  s.frame(223,115,24,12,8,7,0);s.box(227,120,16,2,7);
  s.box(272,101,9,4,1);s.box(282,97,4,7,7);s.box(276,103,15,3,7);
  s.frame(179,85,22,17,8,7,0);s.box(181,87,18,7,0);s.box(188,90,4,2,15);
  s.box(77,104,6,18,14);s.box(78,102,4,3,7);s.box(78,113,4,2,0);
  s.box(85,84,2,31,0);
  profile(s,model,car,52,94,1);
  newspaper(s,24,157);
  s.box(110,175,28,4,0);s.box(115,159,4,16,2);s.box(113,156,7,4,10);s.box(119,163,17,2,2);
  s.box(120,160,5,2,15);s.box(112,174,18,2,8);
  s.frame(215,166,12,10,5,13,0);s.box(218,162,6,4,7);s.box(220,160,5,2,15);
  s.line(224,161,234,159,8);s.line(234,159,244,169,8);
  s.frame(230,166,9,10,8,7,0);s.box(232,164,4,2,14);
  fuelCan(s,284,157);
  footer(s,'GARAGE','SUMMER 1963');
}

function classifieds(s,{scene,mode,model}) {
  const parts=scene==='parts'||mode==='parts';
  s.box(0,0,320,200,8);
  s.poly([[13,9],[157,4],[309,9],[314,182],[158,179],[9,185]],0);
  s.poly([[10,7],[157,3],[306,7],[312,177],[159,174],[7,179]],15);
  s.line(156,7,158,175,8);
  s.center('THE EVENING REGISTER',160,15,0,2);
  s.box(24,34,272,2,0);s.box(16,36,285,1,8);
  s.center(parts?'AUTO PARTS':'USED CARS',160,43,0);
  for (const col of [21,82,180,240]) {
    for(let row=0;row<17;row++) {
      const y=57+row*6;
      const val=Math.sin(col*10+row*7)*8;
      s.box(col,y,44+val,1,row%4===0?0:8);
      s.box(col,y+2,34-val,1,7);
    }
  }
  s.box(18,84,284,69,0);
  s.box(20,86,280,64,7);
  if(parts) {
    s.box(76,135,169,1,8);
    s.center('PARTS AND ACCESSORIES',160,115,0);
    s.center('ENGINES / TIRES / GEARBOXES',160,128,8);
  } else if(model) profile(s,model,null,53,86,0.91);
  else s.center('SUNDAY CLASSIFIEDS',160,112,8);
  footer(s,'CLASSIFIEDS','EVENING EDITION');
}

const fasteners = {
  engine:[[67,101],[100,90],[135,93],[169,99],[201,105],[235,114]],
  manifold:[[62,96],[115,85],[170,96],[89,135],[145,145],[212,135]],
  carb:[[99,78],[210,78],[100,136],[211,136]],
  gearbox:[[73,102],[101,83],[136,86],[85,138],[119,144],[158,125]],
  wheel:[[160,78],[185,96],[176,124],[145,124],[135,96]]
};
export function workbenchFasteners(slot) {
  return (fasteners[isWheel(slot)?'wheel':slot] || []).map(([x,y])=>({x,y}));
}

function metal(s,face,highlight,shade) {
  s.poly(face,8);
  s.poly(highlight,7);
  s.poly(shade,0);
  for (let i=1;i<highlight.length;i++) s.line(...highlight[i-1],...highlight[i],15);
}

function engineArt(s, car) {
  metal(s,[[44,90],[97,72],[196,82],[259,108],[253,137],[216,156],[73,139],[47,121]],
    [[45,92],[102,77],[193,87],[250,110],[226,125],[72,116]],
    [[75,120],[225,131],[251,115],[244,138],[218,149],[76,135]]);
  metal(s,[[61,87],[99,78],[193,89],[222,105],[219,118],[86,109],[60,99]],
    [[62,88],[101,81],[191,92],[213,105],[93,100]],
    [[91,101],[215,107],[214,115],[89,107],[65,96]]);
  metal(s,[[74,105],[102,98],[204,114],[231,123],[229,136],[201,145],[86,133]],
    [[75,108],[103,103],[203,117],[225,125],[205,131],[91,122]],
    [[88,124],[204,134],[227,127],[224,135],[201,142],[87,131]]);
  for (let x=96;x<201;x+=12) {
    const y=115+(x-90)*0.12;
    s.line(x,y,x+25,y+2,8);s.line(x,y+2,x+24,y+4,15);
  }
  for (let i=0;i<4;i++) {
    const x=95+i*26,y=122+i*4;
    s.ellipse(x,y,5,4,0);s.ellipse(x,y,3,2,7);s.box(x-1,y,3,1,15);
    s.line(x,y+2,x+5,y+9,4);
  }
  s.ellipse(63,120,16,17,0); s.ellipse(63,120,13,14,7);s.ellipse(63,120,10,11,8);
  s.ellipse(63,120,4,5,15);s.box(63,115,2,4,0);
  s.line(53,104,53,125,0); s.line(68,106,77,119,7);
  s.poly([[101,140],[119,142],[119,151],[86,148],[82,139]],8);
  s.box(89,143,11,3,7);
  s.ellipse(240,125,6,7,0);s.ellipse(240,125,3,4,14);
  if(car?.ignition) {
    s.line(186,138,204,151,12);s.line(204,151,231,141,12);s.line(231,141,240,125,4);
    s.box(238,124,6,3,14);
  } else { s.line(193,145,210,157,12);s.line(210,157,231,151,12);s.box(228,150,6,2,14); }
}

function manifoldArt(s) {
  metal(s,[[41,87],[105,70],[191,82],[260,119],[226,147],[110,150],[55,128]],
    [[46,88],[108,76],[191,88],[252,118],[218,139],[113,141],[62,123]],
    [[58,125],[111,143],[218,142],[245,126],[224,145],[110,148],[55,128]]);
  for(let t=0;t<4;t++) {
    const x=72+t*39,y=99+t*3;
    s.poly([[x,y-13],[x+16,y-12],[x+38,y+16],[x+24,y+26],[x+12,y+8]],8);
    s.line(x+1,y-13,x+21,y+14,15);
    s.ellipse(x+22,y+20,6,5,0);s.box(x+18,y+20,8,1,8);
  }
  metal(s,[[105,91],[151,83],[195,99],[187,116],[142,121],[107,109]],
    [[107,91],[150,86],[191,100],[179,111],[142,113],[108,105]],
    [[109,107],[141,115],[182,113],[189,106],[188,116],[142,120]]);
  for(const [x,y] of [[131,101],[162,103],[146,111],[176,108]]) s.ellipse(x,y,6,4,0);
}
function carbArt(s) {
  metal(s,[[73,98],[88,75],[207,70],[244,98],[229,141],[92,146],[70,128]],
    [[77,98],[92,77],[206,74],[237,97],[220,119],[97,124]],
    [[76,117],[98,126],[221,121],[235,106],[225,139],[96,143],[76,129]]);
  s.frame(102,89,111,26,7,15,8);
  for(const x of [124,154,184]) {
    s.ellipse(x,99,13,8,0);s.ellipse(x,99,11,6,8);
    s.line(x-6,96,x+7,101,15);
  }
  s.frame(91,119,26,20,8,7,0);s.frame(189,120,35,17,8,7,0);
  s.line(96,131,119,124,14);s.line(119,124,160,128,6);
  s.box(149,136,18,5,15);
  s.ellipse(218,121,8,8,0);s.ellipse(218,121,6,6,6);
}
function gearboxArt(s) {
  metal(s,[[51,94],[91,70],[139,72],[168,100],[212,106],[228,118],[260,125],[258,135],[221,139],[192,132],[103,150],[65,137]],
    [[54,96],[95,74],[138,78],[163,104],[207,108],[226,120],[253,127],[222,130],[189,122],[103,142],[71,132]],
    [[66,125],[102,145],[189,125],[226,134],[258,129],[254,137],[221,138],[195,132],[102,149],[65,137]]);
  for(let i=0;i<5;i++) {
    s.line(84+i*11,81+i*2,111+i*13,139-i*3,7);
    s.line(85+i*11,83+i*2,112+i*13,139-i*3,15);
  }
  s.ellipse(66,111,16,29,0);s.ellipse(66,111,12,24,8);s.ellipse(66,111,8,17,7);
  s.ellipse(68,111,6,13,0);
  s.box(194,109,15,3,15);s.box(236,128,16,4,8);
}
function tireArt(s) {
  s.ellipse(160,103,54,53,8);s.ellipse(160,104,51,51,0);s.ellipse(160,103,47,47,8);
  s.ellipse(160,103,42,43,0);s.ellipse(160,103,37,38,15);
  s.ellipse(160,103,33,34,8);s.ellipse(160,103,30,30,7);
  s.ellipse(160,103,22,21,8);s.ellipse(160,103,10,10,0);
  s.ellipse(160,103,6,6,15);s.ellipse(160,103,3,3,8);
  for(let i=0;i<24;i++) {
    const radians=i*Math.PI/12;
    const x=Math.round(160+48*Math.cos(radians)),y=Math.round(103+48*Math.sin(radians));
    s.line(x,y,x+Math.round(4*Math.sin(radians)),y-Math.round(4*Math.cos(radians)),7);
  }
}

function workbench(s,{car,slot='engine',title=''}) {
  s.box(0,0,320,200,0);
  s.frame(9,10,302,169,8,15,0);
  s.frame(15,16,290,156,0,7,0);
  s.box(16,17,288,16,1);s.line(16,33,303,33,9);
  const label=String((title && title!=='Hot Rod' ? title : SLOT_NAMES[slot])||'WORKBENCH').slice(0,37);
  s.center(label,160,22,15);
  const component=car?.installed?.[slot];
  if (!car?.installed || component) {
    if(slot==='carb') carbArt(s);
    else if(slot==='manifold') manifoldArt(s);
    else if(slot==='gearbox') gearboxArt(s);
    else if(isWheel(slot)) tireArt(s);
    else engineArt(s,car);
    const fill=car?.bolts?.[slot]??0;
    workbenchFasteners(slot).forEach(({x,y},i)=>{
      const tight=Boolean(fill&(1<<i));
      s.ellipse(x,y,6,6,0);
      s.ellipse(x,y,5,5,tight?15:14);
      s.ellipse(x,y,3,3,tight?8:6);
      s.line(x-2,y+1,x+2,y-1,tight?0:4);
    });
  } else {
    s.line(39,156,276,156,8);
    s.center('PART REMOVED',160,96,7);
  }
  if(component && PARTS[component.id]) s.center(PARTS[component.id].name.slice(0,45),160,160,7);
  footer(s,'SERVICE BAY','TIGHTEN / LOOSEN');
}

function rivalModel(view) {
  return view.model || CARS[view.rival?.model] || CARS.chevy40;
}
function diner(s,view) {
  sky(s,143);
  s.poly([[0,133],[320,128],[320,185],[0,185]],8);
  s.box(25,73,273,57,0);
  s.frame(34,77,249,54,6,7,0);
  s.box(36,102,245,28,8);
  for(let y=103;y<129;y+=4) {
    s.box(37,y,242,1,7);
    for(let x=41+(y%3)*3;x<282;x+=13)s.box(x,y,1,3,0);
  }
  s.poly([[18,72],[52,57],[262,57],[304,76],[290,81],[21,80]],4);
  for(let x=24;x<275;x+=13)s.line(x+28,58,x,74,x%3?12:6);
  s.box(22,76,279,3,7);s.box(20,79,281,3,15);s.box(26,82,265,2,8);
  s.frame(91,22,135,30,0,11,1);
  s.center("BOB'S",159,26,11,2); s.center('DRIVE-IN',159,42,14);
  s.line(106,53,106,62,7);s.line(216,53,216,62,7);
  s.box(230,35,23,14,6);s.box(232,37,18,2,14);s.box(232,39,19,5,2);s.box(231,44,21,3,12);
  for(let j=0;j<8;j++){
    const x=40+j*29;
    s.frame(x,89,24,25,1,11,0);
    s.box(x+2,92,20,4,14);
    s.box(x+4,98,6,9,7);s.box(x+15,99,5,8,6);
    s.box(x+11,90,2,22,8);s.box(x+2,103,21,1,7);
  }
  s.frame(272,91,15,39,8,15,0);s.box(274,94,11,22,1);s.box(281,116,3,1,14);
  s.box(31,130,257,5,7);s.box(24,135,277,4,0);
  s.box(8,107,4,36,7);s.box(19,111,2,26,8);
  s.frame(2,105,19,7,4,12,0);
  s.ellipse(279,118,5,5,6);s.box(277,115,6,2,14);s.box(275,122,8,12,3);
  s.line(275,126,270,132,6);s.line(282,132,282,143,1);s.line(277,131,274,143,1);
  s.box(270,143,8,2,0);s.box(280,143,7,2,0);
  s.box(296,105,3,42,8);s.ellipse(297,106,5,4,14);
  s.box(0,151,320,2,7);
  s.noise(0,156,320,27,240,[0,8,7],319);
  for(let x=6;x<286;x+=45)s.box(x,178,21,2,14);
  const model=rivalModel(view);
  const foreground=view.rival?.id==='mystery'||model.body==='van';
  profile(s,CARS[foreground?'fairlane55':'mercury56'],null,31,100,0.51);
  const rivalCar=view.car?.model===model.id && !view.rival ? view.car : null;
  profile(s,model,rivalCar,foreground?54:77,foreground?115:114,foreground?0.91:0.81);
  footer(s,'DRIVE-IN',view.rival?.name?.toUpperCase().slice(0,26)||'PICK A RIVAL');
}

function fuel(s,{model,car}) {
  sky(s,136,true);
  s.poly([[14,139],[320,126],[320,185],[0,185]],7);
  s.noise(0,150,320,32,250,[8,7,15],77);
  s.box(32,79,170,60,4);
  for(let y=87;y<137;y+=5)for(let x=34+(y%2)*6;x<201;x+=12) {
    s.box(x,y,11,4,6);s.box(x,y,11,1,12);
  }
  s.poly([[7,76],[50,58],[178,58],[218,78],[198,84],[25,85]],7);
  s.poly([[11,75],[57,60],[174,60],[210,77]],8);
  s.box(10,78,204,3,15);
  s.frame(49,94,44,32,1,15,0);s.line(51,116,91,100,3);
  s.frame(119,94,65,41,1,15,0);s.line(126,124,145,101,3);s.line(155,125,177,99,3);
  s.box(141,97,2,37,7);s.box(161,97,2,37,7);
  s.frame(223,31,75,29,0,12,4);
  s.center("GUS'S",260,35,14);s.center('GAS',260,46,11);
  s.box(259,60,4,76,8);s.box(260,61,1,74,15);
  for(const x of [25,62]){
    s.ellipse(x+9,105,8,7,15);
    s.frame(x,108,18,48,4,12,0);s.frame(x+2,113,14,14,7,15,8);
    s.box(x+4,116,10,3,0);s.box(x+1,137,15,2,15);
    s.line(x+16,122,x+23,141,0);s.line(x+23,141,x+15,147,0);
  }
  profile(s,model,car,103,120,0.76);
  footer(s,'GAS STATION','REGULAR / FULL SERVICE');
}

function lightTree(s,x,y,phase) {
  const bulb=(bx,by,lit)=>{s.ellipse(bx,by,3,3,0);s.ellipse(bx,by,2,2,lit);};
  s.box(x-2,y,4,39,7);s.box(x-1,y,1,39,8);
  s.frame(x-8,y,17,30,8,7,0);
  bulb(x-4,y+5,phase==='red'?12:4);bulb(x+4,y+5,phase==='red'?12:4);
  bulb(x-4,y+12,phase==='amber'?14:6);bulb(x+4,y+12,phase==='amber'?14:6);
  bulb(x-4,y+19,phase==='green'?10:2);bulb(x+4,y+19,phase==='green'?10:2);
  s.box(x-8,y+29,16,3,0);s.box(x-12,y+37,24,2,8);
}
function rearCar(s,model,color,x,y,size) {
  const shape=model?.body, [shadow,base,light,shine]=tone(color ?? model?.color);
  const maxWidth=shape==='van'?1.09:1;
  const xx=(a)=>x+a*size*maxWidth, yy=(a)=>y+a*size;
  const box=(a,b,w,h,c)=>s.box(xx(a),yy(b),w*size*maxWidth,Math.max(1,h*size),c);
  const poly=(points,c)=>s.poly(points.map(([a,b])=>[xx(a),yy(b)]),c);
  poly([[-25,-1],[-23,-20],[-19,-33],[19,-33],[24,-19],[25,-1]],0);
  if(shape==='van') {
    poly([[-24,-1],[-24,-43],[-20,-49],[20,-49],[24,-43],[24,-1]],base);
    box(-19,-40,38,12,0);
    box(-18,-40,17,1,shine);box(1,-40,17,1,shine);
    box(-1,-40,2,24,shadow);
    poly([[-24,-22],[-11,-17],[5,-23],[23,-29],[23,-17],[4,-13],[-23,-12]],10);
    if(size>0.22) {
      box(-14,-16,3,7,12);box(-16,-14,7,3,12);box(-14,-14,3,3,14);
      box(10,-22,3,9,12);box(7,-19,9,3,12);box(10,-19,3,3,14);
    }
  } else {
    poly([[-25,-3],[-23,-18],[-17,-31],[16,-31],[22,-18],[25,-3]],base);
    poly([[-18,-19],[-14,-29],[14,-29],[18,-19]],0);
    box(-14,-28,26,1,9);
    poly([[-24,-16],[-15,-19],[19,-19],[23,-15]],light);
    box(-23,-10,46,2,shadow);
    if(shape==='fin') {
      poly([[-26,-17],[-22,-25],[-18,-11],[-26,-10]],light);
      poly([[26,-17],[22,-25],[18,-11],[26,-10]],light);
    }
  }
  box(-25,-3,50,3,shine);box(-23,0,6,4,0);box(17,0,6,4,0);
  box(-22,-8,9,4,12);box(13,-8,9,4,12);
  box(-4,-7,8,4,15);
}

function roadScene(s,race) {
  const {contract,player,opponent}=race;
  const distance=player.distance;
  const curveAt=d=>contract.kind==='road'?courseCurve(d,contract.seed):0;
  const ahead=curveAt(distance+77);
  const center0=trunc(Math.round(155+ahead*34-player.heading*16),107,207);
  const horizon=53;
  s.box(0,0,320,63,0);
  s.noise(0,3,320,45,47,[8,7,15],43);
  s.ellipse(246,27,7,7,7);s.ellipse(248,26,6,6,0);
  for(let x=0;x<320;x+=3){
    const u=x+Math.round(distance*0.18);
    const top=horizon-3-Math.round((Math.sin(u*0.031)+1)*4+Math.sin(u*0.22)*5);
    s.box(x,top,3,horizon+4-top,4);
    if(u%5<2)s.box(x,top+4,2,4,6);
  }
  const projection=y=>{
    const ratio=(y-horizon+1)/80;
    const depth=11+48/Math.max(0.02,ratio);
    const edge=5+(ratio**1.24)*146;
    const center=center0+ratio*ratio*(-player.offset*80-player.heading*28-ahead*39);
    return {depth,edge,center,ratio};
  };
  for(let y=horizon;y<140;y++){
    const {depth,edge,center,ratio}=projection(y);
    const mark=Math.floor((distance+depth)/8)%4;
    s.box(0,y,320,1,2);
    if (ratio>0.26 && mark===1) {
      for (let x=9+(y*7%10);x<319;x+=31) s.box(x,y,ratio>0.71?3:1,1,10);
    }
    s.box(center-edge-3,y,edge*2+6,1,6);
    s.box(center-edge,y,edge*2,1,0);
    if(mark<2)s.box(center-ratio*2,y,Math.max(1,ratio*3),1,15);
    if(mark<3){
      s.box(center-edge+1,y,Math.max(1,ratio*2.2),1,7);
      s.box(center+edge-2,y,Math.max(1,ratio*2.2),1,7);
    }
  }
  for(let i=8;i>=0;i--){
    const z=i*17+17-(distance%17);
    if(z<9) continue;
    const y=trunc(52+Math.round(760/(z+12)),54,136);
    const {center,edge,ratio}=projection(y);
    const h=Math.max(2,Math.round(18*ratio));
    const x=center+edge+Math.round(11*ratio)+1;
    s.box(x,y-h,Math.max(1,Math.round(ratio*2)),h,15);
    s.box(x,y-h,Math.max(1,Math.round(ratio*2)),Math.max(1,h/3),4);
  }
  if (distance<32) {
    const y=trunc(Math.round(110+(distance*2.1)),110,135);
    const {center,edge}=projection(y);
    s.box(center-edge,y,2*edge,3,14);
    const phase=race.tick>=race.greenAt?'green':race.greenAt-race.tick<15?'amber':'red';
    lightTree(s,Math.max(24,Math.round(center-edge-12)),47,phase);
  }
  if (race.length-distance<86) {
    const y=trunc(Math.round(59+57*(1-(race.length-distance)/86)),59,115);
    const {center,edge}=projection(y);
    const w=Math.max(2,Math.round(edge/6));
    for(let i=-6;i<6;i++)s.box(center+i*w,y,w,2,i%2?15:8);
  }
  const nearby=opponent.distance-distance;
  if(!contract.timeTrial&&nearby>=-3&&nearby<126){
    const y=trunc(56+Math.round(2300/(Math.max(0,nearby)+29)),57,122);
    const {center,edge}=projection(y);
    const size=trunc(edge/87,0.15,0.83);
    rearCar(s,CARS[contract.opponent?.model],contract.opponent?.color,center-edge*0.47,y,size);
  }
  if(race.patrolAt!==null) {
    s.text('PATROL',14,14,race.tick%8<4?12:15);
    s.box(16,23,18,2,race.tick%8<4?9:12);
  }
}

function band(s,points,colors) {
  const bottom=points.length-1;
  colors.forEach((color,index)=>{
    for(let p=0;p<bottom;p++) {
      const [ax,ay]=points[p], [bx,by]=points[p+1];
      s.line(ax+index,ay,bx+index,by,color);
    }
  });
}
function mirror(s,x,y,w,h,race) {
  s.frame(x,y,w,h,0,7,8);
  s.box(x+2,y+h-5,w-4,2,2);
  s.poly([[x+w/2,y+h-7],[x+w-5,y+h-2],[x+4,y+h-2]],0);
  const other=race.opponent.distance-race.player.distance;
  if(!race.contract.timeTrial && other< -3 && other> -120) {
    const xx=x+Math.floor(w*0.47);
    s.box(xx-4,y+h-7,9,3,tone(race.contract.opponent.color)[2]);
    s.box(xx-2,y+h-9,5,2,7);s.box(xx+3,y+h-6,2,1,12);
  }
  if(race.patrolAt!==null){
    s.box(x+w/2-5,y+4,5,2,race.tick%8<4?9:4);
    s.box(x+w/2,y+4,5,2,race.tick%8<4?4:12);
  }
}
function dial(s,x,y,label,value,max,redline=Infinity,step=10) {
  s.ellipse(x,y,27,27,0);s.ellipse(x,y,26,26,8);s.ellipse(x,y,24,24,15);
  s.ellipse(x,y,23,23,7);s.ellipse(x,y,22,22,0);
  const start=0.75*Math.PI, sweep=1.50*Math.PI;
  const tickAt=t=>start+sweep*t/max;
  for(let t=0;t<=max;t+=step){
    const a=tickAt(t);
    const dx=Math.cos(a),dy=Math.sin(a);
    s.line(x+Math.round(dx*19),y+Math.round(dy*19),x+Math.round(dx*21),y+Math.round(dy*21),t>=redline?12:7);
    if(t%(step*2)===0)s.box(x+Math.round(dx*17),y+Math.round(dy*17),1,1,t>=redline?12:15);
  }
  const a=tickAt(trunc(value,0,max));
  s.line(x,y,x+18*Math.cos(a),y+18*Math.sin(a),12);
  s.ellipse(x,y,3,3,7);s.box(x-1,y-1,2,2,15);
  s.center(label,x,y-12,7);
  const readout=label==='RPM'?(value/1000).toFixed(1)+'K':String(Math.round(value));
  s.center(readout,x,y+8,15);
}
function dash(s,race,car) {
  const {player,contract}=race;
  const [shadow,base,light]=tone(car?.color??contract.player.color);
  s.poly([[69,119],[87,110],[120,105],[206,107],[256,104],[319,108],[320,140],[74,140]],shadow);
  s.poly([[71,122],[88,114],[124,112],[205,113],[258,109],[319,114],[320,128],[77,131]],base);
  s.line(77,122,124,111,light);s.line(124,111,207,111,light);
  s.line(208,111,258,109,light);s.line(258,109,319,113,light);
  for(const x of [110,137,220,247,271,290]){
    s.line(x,118,x+9,115,light);s.line(x+2,120,x+13,116,light);
  }
  s.box(0,0,320,4,8);s.box(0,4,320,2,7);s.box(0,6,320,2,0);
  band(s,[[24,2],[32,21],[43,56],[52,91],[68,128],[79,132]],CHROME);
  band(s,[[13,17],[19,41],[28,76],[38,103],[47,124],[64,139]],CHROME);
  s.poly([[0,77],[13,83],[34,119],[58,137],[49,166],[0,163]],8);
  s.line(0,84,38,132,7);s.line(0,87,38,136,0);
  s.poly([[0,139],[33,140],[45,149],[37,181],[0,181]],0);
  s.line(0,143,33,145,15);s.line(33,145,41,151,7);
  mirror(s,3,100,30,17,race);
  mirror(s,234,14,62,23,race);
  s.box(261,8,7,6,8);s.box(262,8,2,6,7);
  s.poly([[46,181],[54,149],[80,132],[119,126],[193,125],[225,123],[320,127],[320,185]],0);
  s.poly([[54,164],[67,146],[84,136],[121,130],[192,129],[226,128],[319,130],[320,185],[47,185]],7);
  s.poly([[62,156],[80,140],[126,134],[190,133],[227,131],[320,134],[320,140],[82,148]],15);
  s.poly([[62,161],[90,153],[223,143],[320,143],[320,171],[235,176],[60,180]],8);
  s.box(59,173,261,4,0);s.box(52,177,268,2,15);
  for(let x=251;x<318;x+=4)s.box(x,133,2,4,8);
  for(let y=157;y<172;y+=3)s.box(63,y,32,1,0);

  const wheelX=155+Math.round(player.heading*4);
  const rpmMax=Math.ceil(Math.max(6000,contract.player.redline+800)/1000)*1000;
  s.ellipse(wheelX,168,68,44,0);s.ellipse(wheelX,167,65,42,15);
  s.ellipse(wheelX,167,63,40,7);s.ellipse(wheelX,167,60,37,8);
  // The opening is black behind both gauges.
  s.ellipse(wheelX,165,57,33,0);
  dial(s,129,154,'RPM',player.engine,rpmMax,contract.player.redline,1000);
  dial(s,180,154,'MPH',displaySpeed(player),140,Infinity,10);
  s.poly([[99,176],[114,172],[153,178],[192,172],[211,176],[165,185],[148,185]],7);
  s.line(104,176,152,181,15);s.line(161,181,205,176,15);
  s.ellipse(wheelX,185,12,6,0);s.ellipse(wheelX,184,10,6,7);
  s.ellipse(wheelX,184,6,4,8);s.ellipse(wheelX,184,3,3,12);
  s.box(wheelX-4,125,8,3,12);

  s.frame(238,139,71,42,8,15,0);
  s.frame(242,142,63,34,0,7,8);
  if(contract.player.automatic){
    s.text('P R N D',253,147,7);s.frame(286,156,10,8,6,14,0);s.text('D',289,157,15);
  } else {
    s.text('1 3',249,144,7);s.text('2 4',249,167,7);
    s.box(250,152,4,14,7);s.box(262,152,4,14,7);s.box(252,157,14,3,7);
    const positions=[[260,158],[252,153],[252,163],[264,153],[264,163]];
    const [hx,hy]=positions[player.gear]||positions[0];
    s.line(hx,hy,285,162,8);s.ellipse(287,162,8,7,7);s.ellipse(287,161,6,5,0);
    s.text(player.gear||'N',285,158,15);
  }
  const fuel=trunc((contract.player.fuel-player.fuel)/160,0,1);
  s.box(4,151,34,18,0);s.text('FUEL',10,154,7);
  s.box(7,164,27,2,8);s.box(7,164,27*fuel,2,fuel<0.18?12:10);
  const gear=contract.player.automatic?'D':player.gear||'N';
  footer(s,'GEAR '+gear+'   '+displaySpeed(player)+' MPH',raceClock(race).toFixed(1)+' SEC');
}

function cockpit(s,view) {
  const race=view.race;
  if (!race || !race.player) {
    s.box(0,0,320,200,0);s.center('STAGING THE RACE',160,94,14);return;
  }
  roadScene(s,race);
  dash(s,race,view.car);
  if (race.tick < race.greenAt) {
    s.frame(113,18,100,18,0,8,0);
    s.center(race.greenAt-race.tick<15?'GET READY':'STAGE',163,24,race.greenAt-race.tick<15?14:12);
  } else if (race.tick-race.greenAt<15) {
    s.frame(133,18,60,18,0,8,0);s.center('GO',163,24,10);
  }
  if(race.result?.outcome==='crash'){
    for(const [dx,dy] of [[36,46],[75,31],[108,24],[158,10],[209,34],[244,43],[281,68],[267,101],[209,98]]) {
      s.line(154,74,dx,dy,15);s.line(dx,dy,dx-13,dy+12,7);
    }
  }
}

function opening(s,view) {
  if (view.scene==='boot') {
    s.box(0,0,320,200,0);
    s.text('COWBOY COMPUTER SYSTEMS',12,14,7);
    s.text('EGA COLOR DISPLAY  320 X 200',12,35,7);
    s.text('640K BASE MEMORY OK',12,50,7);
    s.text('A:> HOTROD',12,82,15);
    s.box(77,89,5,2,15);
    s.text('LOADING CLASSIC 1963',12,101,14);
    return;
  }
  sky(s,133,true);
  s.poly([[96,194],[135,123],[167,123],[247,194]],8);
  s.line(44,185,134,123,2);s.line(285,185,167,123,2);
  s.box(0,155,320,45,8);
  s.noise(0,158,320,32,190,[0,7,8],951);
  s.poly([[49,52],[58,29],[265,29],[276,52],[267,87],[60,87]],1);
  s.poly([[53,52],[62,33],[262,33],[271,52],[263,83],[62,83]],0);
  s.center('HOT ROD',163,41,4,4);s.center('HOT ROD',160,37,14,4);
  s.center('CLASSIC 1963',160,70,11);
  s.ellipse(165,160,97,12,0);
  profile(s,CARS.vette63,{color:12,decal:3},59,96,0.88);
  footer(s,'HOT ROD','1989 DOS HOMAGE');
}
function ending(s,view) {
  const won=view.status==='champion'||view.status==='bossChampion';
  const showCar=won ? 'vette63' : 'ford32';
  diner(s,{...view,model:CARS[showCar],rival:{model:showCar,name:won?'Champion':'Summer’s over'}});
  s.frame(35,40,250,54,0,won?14:7,8);
  s.center(won?'SUMMER CHAMPION':'SUMMER OVER',160,49,won?14:7,2);
  s.center(won?'HALL OF FAME':'CLASSIC 1963',160,78,11);
  footer(s,'1963',won?'CHAMPION':'THE END');
}

export function paintScene(canvas, view) {
  const context=canvas?.getContext?.('2d');
  if (!context || !view) return;
  context.imageSmoothingEnabled=false;
  const screen=new Screen(context);
  const model=view.model || CARS[view.car?.model];
  const scene={...view,model};
  switch(view.scene) {
    case 'garage': case 'garage-view': garage(screen,scene); break;
    case 'paper': case 'parts': classifieds(screen,scene); break;
    case 'workbench': workbench(screen,scene); break;
    case 'diner': case 'family': diner(screen,scene); break;
    case 'fuel': fuel(screen,scene); break;
    case 'race': cockpit(screen,scene); break;
    case 'ending': ending(screen,scene); break;
    case 'boot': case 'title': default: opening(screen,scene);
  }
}
