import {PET_ART} from './avatar-pet-art.mjs?v=cel1';

// Original vector illustrations for the family character canvas.
// Props and companions occupy opposite shoulder corners of a 256×256 square.
const INK = '#2c2045';
const CREAM = '#fff6d7';
const GOLD = '#ffcc57';
const AMBER = '#eb884c';
const CORAL = '#fa7481';
const RED = '#c74767';
const PINK = '#ef9ed9';
const PLUM = '#875cc9';
const LILAC = '#c9b2f7';
const SKY = '#91def1';
const BLUE = '#4986bb';
const TEAL = '#42c5b6';
const GREEN = '#8ad36d';
const LEAF = '#47875f';
const MIDNIGHT = '#292545';

function finish(ctx, fill, stroke, width = 2.6) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function path(ctx, start, segments, fill, stroke = INK, width = 2.6) {
  ctx.beginPath();
  ctx.moveTo(...start);
  for (const step of segments) {
    if (step.length === 2) ctx.lineTo(...step);
    if (step.length === 4) ctx.quadraticCurveTo(...step);
    if (step.length === 6) ctx.bezierCurveTo(...step);
  }
  if (fill) ctx.closePath();
  finish(ctx, fill, stroke, width);
}

function line(ctx, points, color = INK, width = 2.6) {
  path(ctx, points[0], points.slice(1), null, color, width);
}

function poly(ctx, points, fill, stroke = INK, width = 2.6) {
  path(ctx, points[0], points.slice(1), fill, stroke, width);
}

function ell(ctx, x, y, rx, ry, fill, stroke = null, width = 2.6, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
  finish(ctx, fill, stroke, width);
}

function round(ctx, x, y, w, h, radius, fill, stroke = INK, width = 2.6) {
  const r = Math.min(radius, w / 2, h / 2);
  path(ctx, [x+r,y], [[x+w-r,y],[x+w,y,x+w,y+r],[x+w,y+h-r],[x+w,y+h,x+w-r,y+h],
    [x+r,y+h],[x,y+h,x,y+h-r],[x,y+r],[x,y,x+r,y]], fill, stroke, width);
}

function star(ctx, x, y, outer, inner, fill, stroke = null, points = 5, angle = -Math.PI / 2) {
  const vertices = [];
  for (let index = 0; index < points * 2; index++) {
    const rad = index % 2 ? inner : outer;
    const direction = angle + index * Math.PI / points;
    vertices.push([x + rad * Math.cos(direction), y + rad * Math.sin(direction)]);
  }
  poly(ctx, vertices, fill, stroke, 2);
}

function at(ctx, x, y, angle, paint) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(angle);
  paint(ctx);
  ctx.restore();
}

function smile(ctx, x, y, width = 8, color = INK) {
  path(ctx,[x-width/2,y],[[x,y+width*.55,x+width/2,y]],null,color,1.8);
}

function eye(ctx, x, y, radius = 2.6) {
  ell(ctx,x,y,radius,radius*1.15,INK);
  ell(ctx,x-.65,y-.85,.7,.7,CREAM);
}

function highlight(ctx,x,y,w = 6) {
  ell(ctx,x,y,w,1.5,'#ffffffe0',null,0,-.5);
}

function floorShadow(ctx, x = 0, y = 29, size = 25) {
  ell(ctx,x,y,size,5,'#25194348');
}

function sparkle(ctx,x,y,r,color = CREAM) {
  star(ctx,x,y,r,r*.23,color,null,4);
}

function scatter(ctx, seed, count, x, y, width, height, draw) {
  let n = seed >>> 0;
  const next = () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
  for (let i = 0; i < count; i++) draw(ctx,x+next()*width,y+next()*height,.4+next()*.6,i);
}

function sky(ctx, top, bottom) {
  const gradient = ctx.createLinearGradient(0,0,0,256);
  gradient.addColorStop(0,top);
  gradient.addColorStop(1,bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,256,256);
}

function band(ctx,y,fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(0,y,256,256-y);
}

function glint(ctx,x,y,r,color = CREAM) {
  sparkle(ctx,x,y,r,color);
  ell(ctx,x+r*.8,y-r*.7,1.5,1.5,color);
}

function shell(ctx, fill, accent, center) {
  path(ctx,[-23,-24],[[0,-30,23,-24],[25,-3,20,12,0,26],[-20,12,-25,-3,-23,-24]],fill);
  path(ctx,[-18,-19],[[0,-24,18,-19],[20,-2,15,11,0,20],[-15,11,-20,-2,-18,-19]],accent,INK,1.6);
  center(ctx);
}

const props = [
  ['rubber-chicken','Rubber Chicken',ctx => {
    floorShadow(ctx,0,29,26);
    path(ctx,[-10,12],[[-12,20],[-15,25,-10,27],[-2,27,-2,29],[-13,30,-17,26],[-15,15]],AMBER,INK,1.55);
    path(ctx,[3,11],[[3,19],[6,24,13,26],[11,29,2,27],[-1,23],[-2,15]],AMBER,INK,1.55);
    path(ctx,[-24,-4],[[-19,0,-15,-2,-8,-1],[-2,-6,-1,-19,4,-24],[4,-33,14,-37,21,-32],
      [26,-29,24,-19,20,-17],[15,-13,14,-9,16,-5],[23,8,9,17,-4,17],
      [-17,17,-24,10,-22,4],[-32,-1,-31,-7,-24,-4]],'#e3a043');
    path(ctx,[-23,5],[[-13,10,-6,5,5,4],[15,-1,12,-7,15,-14],[16,-17,20,-20,23,-22],
      [23,-14,15,-11,16,-5],[22,8,10,18,-9,16],[-16,14,-20,12,-23,5]],'#b76c3d',null);
    path(ctx,[-16,5],[[-9,-3,6,-3,10,0],[5,9,-5,12,-13,10],[-18,8,-18,7,-16,5]],'#eeb35c',INK,1.6);
    path(ctx,[-12,4],[[-5,2,4,2,5,3]],null,CREAM,1.65);
    path(ctx,[9,-32],[[7,-40,12,-40,14,-36],[13,-42,19,-40,19,-36],[22,-41,26,-37,24,-32],
      [22,-29,15,-32,9,-32]],RED,INK,1.7);
    path(ctx,[22,-26],[[29,-28,32,-25,34,-22],[29,-19,25,-19,21,-21]],'#e9a75c',INK,1.6);
    ell(ctx,17,-26,4,5,CREAM,INK,1.3);ell(ctx,18,-26,2,2.8,INK);
    path(ctx,[22,-20],[[26,-17,25,-12,22,-12],[19,-12,18,-17,22,-20]],RED,INK,1.35);
    path(ctx,[7,-26],[[9,-19,3,-12,3,-8]],null,'#ffe2a0',2);
  }],
  ['viking-shield','Runic Viking Shield',ctx => {
    floorShadow(ctx,0,30,23);
    ell(ctx,1,-2,27,29,'#593a36',INK,2.6,-.15);
    ell(ctx,-2,-4,25,27,'#c09660',INK,2.2,-.15);
    ell(ctx,-2,-4,21,22,'#815341',INK,1.8,-.15);
    path(ctx,[-17,-18],[[-14,-9,-17,6,-13,12]],null,'#c58b64',1.8);
    path(ctx,[-10,-24],[[-8,-5,-13,9,-7,16]],null,'#533543',1.55);
    path(ctx,[7,-23],[[9,-8,7,5,11,15]],null,'#5e3a3f',1.7);
    path(ctx,[13,-20],[[15,-7,15,1,16,5]],null,'#c58b64',1.3);
    for(const [x,y] of [[-17,-22],[0,-28],[17,-18],[21,-2],[14,14],[-2,21],[-20,11],[-24,-6]])
      ell(ctx,x,y,1.7,1.7,'#f0cb8c',INK,.8);
    ell(ctx,-2,-5,11,10,'#78737b',INK,2.2);
    ell(ctx,-3,-6,8,7.5,'#a6aaa8',INK,1.1);
    path(ctx,[-8,-6],[[-7,-11,-1,-12,2,-10]],null,'#fff2d3',1.55);
    line(ctx,[[-9,12],[-7,6],[-4,11],[-9,9]],CREAM,1.25);
    line(ctx,[[9,4],[10,13],[6,10],[12,8]],CREAM,1.25);
  }],
  ['magic-wand','Star-Tipped Magic Wand',ctx => {
    line(ctx,[[-20,27],[15,-20]],INK,7.5);
    line(ctx,[[-20,27],[15,-20]],AMBER,3.6);
    line(ctx,[[-15,20],[-11,14]],GOLD,1.5);
    star(ctx,17,-24,15,6.9,GOLD,INK);
    star(ctx,17,-24,8,3,CREAM);
    sparkle(ctx,-16,-12,6,LILAC);
    sparkle(ctx,2,7,6,CREAM);
    sparkle(ctx,28,0,5,PINK);
  }],
  ['floating-pizza','Floating Pizza', (ctx,t) => {
    at(ctx,0,Math.sin(t*3)*2,.18,paint=>{
      floorShadow(paint,0,29,20);
      path(paint,[-25,-17],[[-7,-30,25,-18],[25,-13,0,24],[-14,14,-25,-17]],GOLD);
      path(paint,[-25,-17],[[-7,-30,25,-18],[21,-13,21,-10],[-3,-21,-21,-10],[-25,-17]],AMBER,INK,2);
      [[-11,-6,4],[5,-10,3],[10,-1,4],[-4,3,4],[0,12,3]].forEach(([x,y,r])=>ell(paint,x,y,r,r,RED,INK,1.05));
      line(paint,[[-15,-12],[-10,-10],[-5,-13]],CREAM,1.9);
      sparkle(paint,-26,7,5,CREAM);
      sparkle(paint,25,-4,4,PINK);
    });
  },true],
  ['giant-sandwich','Stacked Deli Sandwich',ctx => {
    floorShadow(ctx,0,25,26);
    path(ctx,[-29,9],[[-18,18,26,8],[31,18,29,23],[-4,31,-30,20],[-29,9]],AMBER);
    path(ctx,[-31,6],[[-22,2,-14,7],[-5,1,4,6],[15,0,31,4],[29,14,19,14],[11,20,0,13],[-11,20,-19,13],[-27,16,-31,6]],GREEN);
    path(ctx,[-30,4],[[6,-3,31,0],[29,9,14,10],[-8,18,-28,13],[-30,4]],RED);
    poly(ctx,[[-29,2],[27,-5],[31,4],[14,9],[7,18],[-2,11],[-27,10]],GOLD);
    path(ctx,[-30,1],[[-30,-24,-1,-23],[17,-25,31,-8],[34,-1,28,2],[-6,12,-26,9],[-32,8,-30,1]],'#dd9259');
    path(ctx,[-26,-1],[[-12,-18,9,-16],[23,-16,28,-6],[26,-2,20,-1],[-8,5,-24,4],[-28,3,-26,-1]],CREAM,null);
    for(const [x,y] of [[-18,-8],[-8,-11],[3,-4],[13,-11],[20,-6]]) ell(ctx,x,y,2.2,1,'#e8bb76',null,0,-.45);
  }],
  ['flying-toaster','Flying Toaster',(ctx,t) => {
    at(ctx,0,Math.sin(t*3.4)*2,0,paint=>{
      floorShadow(paint,0,29,25);
      path(paint,[-21,5],[[-36,-1,-34,-16],[-25,-18,-18,-3],[-22,-17,-13,-19],[-12,-9,-11,3]],CREAM);
      path(paint,[21,5],[[36,-1,34,-16],[25,-18,18,-3],[22,-17,13,-19],[12,-9,11,3]],CREAM);
      path(paint,[-14,-4],[[-15,-16,-21,-20],[-24,-32,-8,-31],[-3,-27,6,-31],[18,-31,16,-22],[9,-16,10,-4]],AMBER);
      path(paint,[-11,-7],[[-11,-17,-17,-23],[-18,-27,-10,-26],[-3,-21,6,-26],[12,-27,11,-23],[6,-17,6,-7]],CREAM,null);
      round(paint,-21,-9,42,31,8,SKY);
      round(paint,-16,-8,32,6,3,INK,null);
      round(paint,-21,14,42,7,3,BLUE,null);
      round(paint,15,3,11,4,2,RED,INK,1.3);
      highlight(paint,-11,0,5);
      ell(paint,-12,10,2,2,CREAM);
    });
  },true],
  ['golden-trophy','Golden Trophy',ctx => {
    floorShadow(ctx,0,29,21);
    for (const side of [-1,1]) {
      path(ctx,[side*14,-26],[[side*33,-28,side*28,-13],[side*25,-4,side*11,-6]],null,INK,6);
      path(ctx,[side*14,-26],[[side*33,-28,side*28,-13],[side*25,-4,side*11,-6]],null,GOLD,3);
    }
    path(ctx,[-18,-29],[[18,-29],[21,-12,12,0],[6,5,4,8],[4,17],[14,20],[14,25],[-14,25],[-14,20],[-4,17],[-4,8],[-12,0,-21,-12,-18,-29]],GOLD);
    path(ctx,[-13,-25],[[7,-26],[7,-5,-5,-5],[-13,-11,-13,-25]],CREAM,null);
    round(ctx,-22,23,44,9,3,PLUM);
    star(ctx,3,-15,8,3.4,AMBER,INK);
    glint(ctx,23,-30,6,CREAM);
  }],
  ['lightning-staff','Lightning Staff',ctx => {
    line(ctx,[[-19,30],[11,-22]],INK,9);
    line(ctx,[[-19,30],[11,-22]],PLUM,5);
    line(ctx,[[-17,27],[-13,20],[-17,16],[-8,18],[-5,10],[-8,7],[-1,6]],GOLD,1.8);
    poly(ctx,[[12,-35],[24,-33],[19,-20],[28,-21],[13,-2],[14,-15],[5,-14]],SKY,INK,3);
    line(ctx,[[13,-32],[18,-31],[12,-18],[17,-18]],CREAM,2);
    line(ctx,[[-18,-14],[-13,-18],[-16,-24],[-10,-29]],SKY,2);
    sparkle(ctx,28,-7,5,CREAM);
  }],
  ['waffle-shield','Waffle Shield',ctx => {
    floorShadow(ctx,0,28,24);
    shell(ctx,AMBER,GOLD,inside=>{
      for (const row of [-16,-7,2,11]) {
        const xs=row===11?[-7,2]:[-12,-3,6];
        for (const x of xs) round(inside,x,row,6.5,6.5,1.3,'#c67145',CREAM,1);
      }
      round(inside,-3,-7,12,10,2,CREAM,INK,1.5);
      path(inside,[-13,-15],[[-12,-5,-8,-6],[-6,-16,-2,-21],[-9,-23,-13,-15]],'#a4504a',null);
    });
  }],
  ['floating-spellbook','Floating Spellbook',(ctx,t) => {
    const drift = Math.sin(t*2.8)*2;
    at(ctx,0,drift,0,paint=>{
      floorShadow(paint,0,32,23);
      path(paint,[-27,-15],[[-9,-20,0,-13],[15,-20,27,-15],[27,18],[11,17,0,25],[-16,18,-27,18],[-27,-15]],PLUM);
      for (const dir of [-1,1]) {
        path(paint,[0,-12],[[dir*14,-23,dir*24,-17],[dir*24,15],[dir*11,14,0,20],[0,-12]],CREAM,INK,1.5);
        for (const y of [-7,0,7]) path(paint,[dir*5,y],[[dir*12,y-4,dir*19,y-3]],null,PLUM,1.5);
      }
      line(paint,[[0,-11],[0,20]],'#b57b78',1.5);
      poly(paint,[[5,16],[12,13],[13,27],[9,25],[6,29]],RED,INK,1.6);
      star(paint,0,-27,10,4,GOLD,INK);
      sparkle(paint,-22,-25,4,SKY);
      sparkle(paint,22,-29,5,PINK);
    });
  },true],
  ['foam-finger','Giant Foam Finger',ctx => {
    floorShadow(ctx,0,25,20);
    path(ctx,[-16,25],[[-23,9,-24,-1],[-24,-10,-17,-10],[-14,-9,-13,-3],[-14,-28,-14,-32],
      [-13,-43,-3,-40],[2,-37,2,-17],[11,-20,18,-15],[26,-13,26,-5],[27,12,16,18],[14,25],[-16,25]],CORAL);
    path(ctx,[-12,19],[[-20,5,-18,-2],[-14,-3,-12,6],[-9,7,-9,0],[-9,-27,-9,-33],[-6,-36,-4,-32],
      [-4,-10,-1,-5],[4,-10,12,-10],[20,-9,20,-1],[19,11,12,14],[9,19]],null,CREAM,2);
    line(ctx,[[-1,8],[5,2],[5,13]],CREAM,2.4);
  }],
  ['pocket-arcade','Pocket Arcade',ctx => {
    floorShadow(ctx,0,30,21);
    at(ctx,0,-2,-.12,paint=>{
      round(paint,-22,-29,44,57,8,PLUM);
      round(paint,-18,-23,36,28,4,MIDNIGHT);
      round(paint,-15,-20,30,22,2,GREEN,null);
      poly(paint,[[-10,-16],[11,-16],[11,-13],[-5,-13],[-5,-8],[6,-8],[6,-10],[11,-10],[11,-3],
        [-10,-3]],LEAF,null);
      line(paint,[[-10,11],[-10,23]],INK,5);
      line(paint,[[-16,17],[-4,17]],INK,5);
      ell(paint,12,14,4,4,CORAL,INK,1.4);
      ell(paint,6,21,3,3,GOLD,INK,1.4);
    });
  }],
  ['moon-balloon','Moon Balloon',(ctx,t) => {
    const x = Math.sin(t*1.7)*3;
    path(ctx,[-10,32],[[-22,17,10,11],[18,6,x+3,-6]],null,CREAM,2.2);
    at(ctx,x,-23,.2,paint=>{
      path(paint,[12,-19],[[-6,-28,-22,-12,-19,4],[-15,25,12,24,21,4],[12,11,-2,5,0,-6],
        [1,-14,7,-18,12,-19]],GOLD);
      poly(paint,[[-4,18],[1,24],[7,17]],AMBER,INK,1.5);
      path(paint,[-11,-8],[[-17,1,-9,8]],null,CREAM,2.5);
      eye(paint,-7,1,1.7);
      sparkle(paint,14,-8,6,CREAM);
    });
  },true],
  ['bubble-tea','Bubble Tea Buddy',ctx => {
    floorShadow(ctx,0,30,20);
    line(ctx,[[3,5],[11,-38]],INK,7);
    line(ctx,[[3,5],[11,-38]],PINK,4);
    path(ctx,[-22,-18],[[22,-18],[15,25],[12,29,-12,29],[-15,24,-22,-18]],CREAM);
    path(ctx,[-18,-12],[[-5,-20,14,-12],[19,-14],[13,24],[10,26,-10,26],[-13,24,-18,-12]],AMBER,null);
    for (const [x,y] of [[-9,19],[-3,10],[8,14],[3,22],[-4,23],[10,22]]) ell(ctx,x,y,3,3,INK);
    round(ctx,-24,-20,48,7,3,SKY,INK,1.7);
    eye(ctx,-6,-5,2.2);
    eye(ctx,7,-5,2.2);
    smile(ctx,0,0);
    highlight(ctx,-13,-7,2.5);
  }],
  ['cassette-tape','Mixtape Cassette',ctx => {
    floorShadow(ctx,0,20,25);
    at(ctx,0,-3,-.2,paint=>{
      round(paint,-27,-18,54,35,5,'#424065');
      round(paint,-22,-14,44,20,3,CORAL,INK,1.3);
      poly(paint,[[-22,-11],[22,-11],[22,-6],[-22,5]],GOLD,null);
      round(paint,-16,-8,32,13,5,INK,null);
      for(const x of [-8,8]){
        ell(paint,x,-1,4.5,4.5,CREAM);
        star(paint,x,-1,2.5,1.3,PLUM,null,6);
      }
      poly(paint,[[-16,15],[-11,7],[11,7],[16,15]],LILAC,INK,1.6);
      for(const x of [-22,22]) ell(paint,x,12,1.7,1.7,CREAM);
      line(paint,[[-16,-12],[-3,-12]],CREAM,1.7);
    });
  }],
  ['pencil-rocket','Pencil Rocket',(ctx,t) => {
    at(ctx,0,Math.sin(t*3)*2,.36,paint=>{
      path(paint,[-8,17],[[-13,30,-1,38],[1,29,4,24],[8,29,10,18]],AMBER,INK,1.6);
      path(paint,[-4,18],[[-4,28,0,30],[1,24,5,18]],CREAM,null);
      poly(paint,[[-8,2],[-18,16],[-18,24],[-8,19]],RED);
      poly(paint,[[8,2],[18,16],[18,24],[8,19]],RED);
      round(paint,-10,-24,20,42,4,GOLD);
      line(paint,[[-4,-22],[-4,17]],CREAM,2);
      poly(paint,[[-10,-24],[0,-38],[10,-24]],AMBER);
      poly(paint,[[-3,-33],[0,-38],[3,-33]],INK,null);
      ell(paint,0,-12,5.5,5.5,SKY,INK,2);
      round(paint,-10,12,20,7,2,CORAL,INK,1.5);
      sparkle(paint,-21,-3,4,CREAM);
    });
  },true],
  ['ice-cream-tower','Triple Scoop Tower',ctx => {
    floorShadow(ctx,0,32,18);
    path(ctx,[-17,-3],[[17,-3],[11,12,1,35],[-8,19,-17,-3]],AMBER);
    for (const [x,y] of [[-10,6],[-5,15],[0,23],[4,17],[8,9]]) line(ctx,[[x-3,y],[x+4,y+4]],CREAM,1.25);
    ell(ctx,0,-11,20,14,TEAL,INK);
    path(ctx,[-16,-12],[[-20,-21,-11,-27],[2,-36,13,-23],[20,-14,9,-11],[1,-8,-7,-11],[-9,-6,-12,-10],[-16,-9,-16,-12]],PINK);
    ell(ctx,0,-28,12,11,CREAM,INK);
    ell(ctx,2,-38,5,5,RED,INK,1.6);
    path(ctx,[5,-40],[[10,-44,9,-47]],null,INK,1.8);
    for(const [x,y,color] of [[-7,-27,RED],[5,-26,PLUM],[-10,-19,GOLD],[8,-16,CREAM],[-11,-8,CREAM]]) line(ctx,[[x,y],[x+3,y-2]],color,1.8);
  }],
  ['compass-rose','Compass Rose',ctx => {
    floorShadow(ctx,0,29,24);
    ell(ctx,0,-4,24,27,AMBER,INK);
    ell(ctx,0,-5,20,22,GOLD,INK,1.7);
    ell(ctx,0,-5,17,19,CREAM,INK,1.3);
    star(ctx,0,-5,14,5,SKY,INK,4);
    poly(ctx,[[0,-19],[4,-6],[-4,-3]],RED,INK,1.3);
    poly(ctx,[[0,10],[-4,-3],[4,-6]],PLUM,INK,1.3);
    ell(ctx,0,-5,2.5,2.5,GOLD,INK,1);
    for (const [x,y] of [[-13,-5],[13,-5],[0,-21],[0,11]]) ell(ctx,x,y,1,1,INK);
    highlight(ctx,-14,-17,4);
  }],
  ['camping-lantern','Firelight Lantern',(ctx,t) => {
    floorShadow(ctx,0,28,20);
    path(ctx,[-12,-20],[[-18,-39,0,-39],[18,-39,12,-20]],null,INK,4);
    path(ctx,[-8,-22],[[-16,10,-15,16],[15,16],[16,10,8,-22]],'#f9dfa7',INK,2.7);
    ell(ctx,0,4,10+Math.sin(t*4),11,'#ffd17aa8');
    path(ctx,[1,13],[[-9,14,-8,4],[-7,0,-2,0],[-3,-6,2,-10],[2,-4,8,-2],[12,9,1,13]],AMBER,null);
    path(ctx,[0,10],[[-5,9,-3,4],[1,1,1,-1],[6,8,0,10]],CREAM,null);
    for (const x of [-10,10]) line(ctx,[[x,-18],[x*1.2,16]],LEAF,2.5);
    round(ctx,-13,-25,26,8,3,TEAL);
    round(ctx,-20,16,40,11,3,TEAL);
    line(ctx,[[-12,21],[12,21]],CREAM,1.7);
  },true],
  ['telescope','Stargazer Telescope',ctx => {
    floorShadow(ctx,0,29,22);
    line(ctx,[[-3,0],[-14,27]],INK,4);
    line(ctx,[[-3,0],[0,28]],INK,4);
    line(ctx,[[-3,0],[15,27]],INK,4);
    ell(ctx,-3,-2,6,6,AMBER,INK);
    at(ctx,2,-13,-.49,paint=>{
      round(paint,-25,-3,52,13,4,PLUM);
      round(paint,-15,-5,32,16,4,SKY);
      round(paint,21,-8,12,21,3,INK);
      round(paint,26,-6,5,17,2,TEAL,CREAM,1.3);
      round(paint,-28,-5,8,13,3,AMBER);
      highlight(paint,-6,-1,8);
    });
    sparkle(ctx,26,-32,5,CREAM);
    sparkle(ctx,15,-36,3,SKY);
  }],
  ['cactus-pot','Flowerpot Cactus',ctx => {
    floorShadow(ctx,0,31,19);
    path(ctx,[-18,13],[[-29,8,-26,-11],[-24,-16,-19,-11],[-23,4,-9,4],[-10,-18,-6,-27],[-3,-33,5,-31],
      [13,-28,11,-3],[24,-5,22,-16],[26,-22,31,-15],[35,5,12,11],[9,17]],GREEN);
    line(ctx,[[-4,8],[-4,-21],[0,-24]],LEAF,2);
    for(const [x,y] of [[-6,-9],[6,-17],[22,-9],[-23,-4],[5,2],[-4,-18]])line(ctx,[[x,y],[x+2,y-3]],CREAM,1.5);
    star(ctx,7,-27,9,4,PINK,INK,7);
    ell(ctx,7,-27,3,3,GOLD,INK,1);
    path(ctx,[-19,13],[[19,13],[13,29],[-13,29],[-19,13]],CORAL);
    round(ctx,-20,10,40,8,4,AMBER);
    poly(ctx,[[-12,19],[12,19],[9,25],[-9,25]],PINK,null);
  }],
  ['tabletop-globe','Family Adventure Globe',ctx => {
    floorShadow(ctx,0,30,22);
    path(ctx,[-12,19],[[-34,-4,-17,-25],[2,-42,23,-23],[37,-6,16,18],[1,30,-12,19]],null,GOLD,4.5);
    line(ctx,[[0,20],[0,28]],AMBER,4.5);
    round(ctx,-16,26,32,7,3,PLUM);
    ell(ctx,0,-9,22,22,BLUE,INK);
    path(ctx,[-19,-17],[[-15,-25,-4,-26],[4,-21,4,-15],[-9,-15,-8,-4],[-11,6,-17,2],[-16,-5,-19,-17]],GREEN,null);
    path(ctx,[9,-14],[[19,-16,21,-9],[20,-2,14,-4],[12,-1,15,6],[10,13,7,8],[3,1,3,-7],[5,-13,9,-14]],GREEN,null);
    path(ctx,[-21,-9],[[-3,-2,21,-9]],null,'#baffff9e',1.3);
    path(ctx,[0,-30],[[-13,-19,-13,2,2,12]],null,'#baffff9e',1.3);
    highlight(ctx,-11,-22,3);
  }],
  ['enchanted-umbrella','Enchanted Umbrella',(ctx,t) => {
    const tilt = -.21 + Math.sin(t*1.8)*.055;
    at(ctx,0,-5,tilt,paint=>{
      path(paint,[0,-26],[[0,25],[1,38,11,33],[15,30,14,24]],null,INK,5);
      path(paint,[0,-26],[[0,25],[1,38,11,33],[15,30,14,24]],null,SKY,2.2);
      path(paint,[-28,-6],[[-24,-33,-2,-32],[21,-32,29,-6],[21,-12,14,-6],[7,-13,0,-6],[-6,-13,-14,-6],[-22,-12,-28,-6]],PLUM);
      path(paint,[-14,-6],[[-9,-28,-2,-32],[8,-27,14,-6],[7,-12,0,-6],[-7,-12,-14,-6]],PINK,INK,1.5);
      line(paint,[[0,-33],[0,-37]],GOLD,3);
      for(const [x,y] of [[-19,-20],[1,-17],[18,-18]]) sparkle(paint,x,y,3,CREAM);
    });
  },true],
  ['disco-microphone','Disco Microphone',ctx => {
    floorShadow(ctx,0,30,18);
    at(ctx,1,0,.53,paint=>{
      path(paint,[-10,-7],[[10,-7],[7,24],[5,28,-5,28],[-7,23,-10,-7]],PLUM);
      path(paint,[-6,-3],[[-3,19]],null,LILAC,2);
      ell(paint,0,-20,13,14,SKY,INK);
      for(const y of [-27,-21,-15])path(paint,[-10,y],[[0,y+6,10,y]],null,BLUE,1.7);
      for(const x of [-4,4])path(paint,[x,-31],[[x*.15,-19,x,-10]],null,BLUE,1.5);
      round(paint,-5,3,10,4,2,GOLD,INK,1.5);
      highlight(paint,-5,-28,3);
    });
    sparkle(ctx,25,-27,7,PINK);
    sparkle(ctx,-12,-24,5,CREAM);
    sparkle(ctx,19,-10,3,SKY);
  }],
  ['checkerboard','Travel Checkerboard',ctx => {
    floorShadow(ctx,0,25,28);
    poly(ctx,[[-23,-19],[17,-24],[29,15],[-15,24],[-29,10]],'#7d455e');
    poly(ctx,[[-24,-20],[17,-26],[28,13],[-16,20]],GOLD);
    for (let row = 0; row < 5; row++) for(let column = 0; column < 5; column++) {
      const x=-21+column*7.55+row*1.8,y=-17+row*7.1-column*1.12;
      poly(ctx,[[x,y],[x+7.55,y-1.12],[x+9.35,y+5.98],[x+1.8,y+7.1]],(row+column)%2?CREAM:RED,null);
    }
    for(const [x,y,p] of [[-8,-11,PLUM],[6,-9,PLUM],[14,-14,PLUM],[-10,7,TEAL],[4,9,TEAL],[18,3,TEAL]]){
      ell(ctx,x,y,4.4,3.1,INK);ell(ctx,x,y-1.4,3.8,2.2,p);
      ell(ctx,x,y-1.5,1.3,.65,CREAM);
    }
  }],
  ['tiny-sailboat','Bottle-Cap Sailboat',(ctx,t) => {
    at(ctx,0,Math.sin(t*2.2)*1.6,Math.sin(t*2.2)*.08,paint=>{
      path(paint,[-26,22],[[-19,16,-11,22],[-3,27,4,22],[14,16,25,22]],null,SKY,4);
      path(paint,[-22,29],[[-14,24,-6,28],[1,32,8,28],[16,24,22,28]],null,TEAL,2.4);
      poly(paint,[[-29,10],[29,10],[20,21],[-19,23]],RED);
      line(paint,[[0,-29],[0,12]],INK,3.5);
      path(paint,[-2,-26],[[-9,-5,-21,6],[-2,6],[-2,-26]],CREAM);
      path(paint,[3,-23],[[12,-8,21,7],[3,5],[3,-23]],PINK);
      poly(paint,[[0,-31],[16,-28],[0,-24]],GOLD,INK,1.6);
      highlight(paint,-13,15,6);
    });
  },true],
  ['magic-polaroid','Instant Camera',(ctx,t) => {
    floorShadow(ctx,0,25,25);
    round(ctx,-27,-16,52,34,5,SKY);
    round(ctx,-22,-22,18,11,3,LILAC,INK,2);
    round(ctx,11,-11,10,6,2,PLUM,INK,1.5);
    ell(ctx,-4,0,13,13,INK);
    ell(ctx,-4,0,9,9,BLUE,CREAM,1.2);
    ell(ctx,-5,-2,5,5,TEAL);
    highlight(ctx,-7,-5,2.6);
    poly(ctx,[[2,11],[23,8],[25,29],[6,32]],CREAM);
    poly(ctx,[[6,14],[20,12],[22,25],[8,27]],PLUM,null);
    star(ctx,14,19,4.2,1.8,GOLD);
    if(Math.sin(t*2.3)>.7) sparkle(ctx,18,-19,6,CREAM);
  },true],
  ['honey-jar','Bumblebee Honey Jar',ctx => {
    floorShadow(ctx,0,31,20);
    path(ctx,[-11,-24],[[11,-24],[12,-16,17,-15],[27,-11,22,22],[18,28,0,28],[-19,28,-22,22],[-25,-7,-17,-14],[-12,-16,-11,-24]],AMBER);
    path(ctx,[-19,2],[[-9,-4,-2,2],[7,7,20,0],[20,22],[10,27,-11,25],[-21,20,-19,2]],GOLD,null);
    round(ctx,-14,-28,28,8,3,'#a25770');
    round(ctx,-13,-1,26,19,3,CREAM,INK,1.5);
    ell(ctx,0,8,6.2,4.1,GOLD,INK,1.2);
    for (const x of [-3,1.5]) line(ctx,[[x,5],[x,11]],INK,1.5);
    ell(ctx,-2,3,3,2,SKY,INK,1);ell(ctx,3,3,3,2,SKY,INK,1);
    highlight(ctx,-15,-9,3);
    sparkle(ctx,25,-22,4,CREAM);
  }]
];

const companions = [
  ['mini-dragon','Mini Dragon',ctx => {
    floorShadow(ctx,0,29,24);
    path(ctx,[-13,8],[[-29,17,-30,3],[-29,-4,-24,-7],[-26,4,-22,6],[-15,8,-10,4]],PLUM);
    path(ctx,[-11,2],[[-26,-4,-26,-22],[-20,-26,-10,-14],[-9,-20,-3,-21],[-6,-8,2,3]],LILAC);
    path(ctx,[5,5],[[10,-15,25,-16],[26,-11,22,-3],[30,-5,31,-2],[24,8,11,10]],PINK);
    path(ctx,[-16,9],[[-17,-2,-5,-5],[6,-6,10,4],[21,12,10,23],[-6,28,-15,22],[-19,17,-16,9]],PLUM);
    path(ctx,[-8,9],[[12,9,9,20],[-2,26,-8,17]],LILAC,INK,1.5);
    path(ctx,[-13,-10],[[-13,-20,1,-25],[8,-27,16,-21],[20,-19,20,-14],[28,-13,27,-4],[22,3,3,2],[-8,5,-13,-10]],TEAL);
    poly(ctx,[[-10,-19],[-14,-34],[-4,-30],[1,-23]],GOLD);
    poly(ctx,[[7,-24],[14,-32],[17,-19]],GOLD);
    eye(ctx,10,-14,3);
    ell(ctx,23,-9,1.8,1.8,INK);
    smile(ctx,17,-4,8);
    ell(ctx,-7,23,6,4,TEAL,INK);
    ell(ctx,8,23,6,4,TEAL,INK);
    sparkle(ctx,28,-27,4,GOLD);
  }],
  ['floating-crocodile','Floating Crocodile',(ctx,t) => {
    floorShadow(ctx,0,30,27);
    at(ctx,0,Math.sin(t*2.5)*2.4,-.05,paint=>{
      path(paint,[-14,14],[[-31,12,-33,2],[-34,-5,-30,-8],[-28,-3,-25,0],[-21,6,-10,4]],LEAF);
      path(paint,[-21,10],[[-21,-3,-9,-7],[15,-11,19,3],[22,23,-3,23],[-19,24,-21,10]],GREEN);
      for(const x of [-16,-6,5,16]) poly(paint,[[x,-2],[x+4,-12],[x+8,-4]],LEAF,INK,1.5);
      path(paint,[-11,14],[[5,13,12,20],[-5,23,-11,14]],GOLD,null);
      path(paint,[-5,-3],[[-10,-18,1,-24],[10,-28,17,-20],[17,-15,15,-11],[26,-15,32,-11],[38,-4,32,2],[14,11,1,5],[-4,3,-5,-3]],GREEN);
      path(paint,[4,0],[[18,5,33,-2],[29,5,17,9],[7,9,4,0]],CREAM,INK,1.4);
      for(const x of [17,25]) poly(paint,[[x,2],[x+2,6],[x+4,1]],CREAM,INK,1);
      eye(paint,8,-17,3.8);
      ell(paint,28,-8,1.9,1.9,INK);
      ell(paint,-11,19,7,3.8,LEAF,INK,1.6);
      ell(paint,6,20,7,3.8,LEAF,INK,1.6);
      sparkle(paint,-28,-21,6,SKY);
      sparkle(paint,32,-21,4,CREAM);
    });
  },true],
  ['tin-robot','Tin Robot Companion',ctx => {
    floorShadow(ctx,0,28,24);
    for(const x of [-11,11]){
      round(ctx,x-4,12,8,13,2,SKY);
      round(ctx,x-7,22,14,6,2,PLUM,INK,1.6);
    }
    line(ctx,[[0,-27],[0,-39]],INK,3);
    ell(ctx,0,-39,4,4,CORAL,INK,1.7);
    for(const x of [-19,19]){
      round(ctx,x-4,-23,8,13,2,GOLD,INK,1.7);
      line(ctx,[[Math.sign(x)*12,1],[x,3],[x*1.2,13]],INK,4);
      ell(ctx,x*1.2,14,4,4,SKY,INK,1.6);
    }
    round(ctx,-15,-2,30,20,4,BLUE);
    round(ctx,-11,2,22,11,2,CREAM,INK,1.4);
    for(const [x,y] of [[-5,7],[0,7],[5,7]]) ell(ctx,x,y,2,2,CORAL);
    round(ctx,-18,-28,36,25,5,TEAL);
    round(ctx,-13,-24,26,17,4,MIDNIGHT,INK,1.5);
    ell(ctx,-6,-17,3,3.4,GREEN);
    ell(ctx,6,-17,3,3.4,SKY);
    smile(ctx,0,-12,7,CREAM);
    highlight(ctx,-9,-26,3);
  }],
  ['pirate-parrot','Pirate Parrot',ctx => {
    floorShadow(ctx,0,31,27);
    path(ctx,[-7,11],[[-24,12,-31,27],[-18,21,-14,21],[-23,31,-21,32],[-7,30,0,20]],BLUE);
    path(ctx,[-13,-6],[[-7,-20,12,-16],[28,-5,19,16],[16,26,-7,23],[-23,17,-13,-6]],RED);
    path(ctx,[-10,4],[[-1,-10,8,-3],[13,5,4,17],[-4,25,-8,18],[-13,20,-13,15],[-20,12,-10,4]],GOLD,INK,1.7);
    path(ctx,[4,-13],[[-6,-24,2,-33],[15,-41,24,-29],[32,-25,28,-14],[19,-4,4,-13]],CORAL);
    ell(ctx,18,-23,8,7,CREAM,INK,1.4);
    eye(ctx,18,-24,2.8);
    path(ctx,[24,-23],[[37,-24,34,-13],[32,-6,26,-13],[28,-17,23,-17]],AMBER);
    path(ctx,[2,-31],[[8,-40,24,-32],[17,-34,17,-30],[17,-36,25,-31]],null,INK,3.4);
    for(const x of [-5,6]) line(ctx,[[x,23],[x,28],[x+4,28]],GOLD,3);
    line(ctx,[[8,-21],[11,-24]],INK,3.5);
  }],
  ['tiny-ufo','Tiny UFO',(ctx,t) => {
    at(ctx,0,Math.sin(t*3)*2.4,0,paint=>{
      floorShadow(paint,0,30,23);
      poly(paint,[[-9,8],[9,8],[18,28],[-18,28]],'#fdf29b94',null);
      ell(paint,0,-4,30,16,PLUM,INK);
      ell(paint,0,-9,28,11,SKY,INK,2);
      path(paint,[-17,-10],[[-18,-29,1,-30],[18,-28,17,-10],[-6,-4,-17,-10]],TEAL);
      ell(paint,0,-17,9,9,GREEN,INK,1.5);
      eye(paint,-3,-17,1.6);
      eye(paint,3,-17,1.6);
      smile(paint,0,-13,4);
      highlight(paint,-8,-23,3);
      for(const x of [-19,-8,8,19])ell(paint,x,2+2*(1-Math.abs(x)/20),2.8,2.1,GOLD,INK,1.3);
    });
  },true],
  ['ghost-companion','Peekaboo Ghost',(ctx,t) => {
    at(ctx,0,Math.sin(t*2.7)*2.8,0,paint=>{
      floorShadow(paint,0,29,25);
      path(paint,[-24,5],[[-30,-6,-19,-7],[-19,-26,-5,-29],[12,-37,23,-19],[24,1,31,-2],[39,1,28,10],
        [25,11,25,16],[27,24,21,22],[18,18,13,24],[10,29,4,23],[0,16,-7,23],[-19,29,-22,17],[-23,13,-24,5]],CREAM);
      path(paint,[-22,11],[[-10,17,0,13],[16,16,25,8],[29,15,23,21],[17,20,13,24],[7,28,2,20],[-8,20,-15,22],[-19,23,-22,11]],LILAC,null);
      eye(paint,-8,-9,3.9);eye(paint,7,-9,3.9);
      ell(paint,1,0,3.5,4,INK);
      ell(paint,-12,-1,4,2,PINK);ell(paint,12,-1,4,2,PINK);
      sparkle(paint,27,-25,6,SKY);
      sparkle(paint,-29,-15,4,CREAM);
    });
  },true],
  ['baby-dinosaur','Baby Stegosaur',ctx => {
    floorShadow(ctx,0,29,25);
    path(ctx,[-19,5],[[-29,6,-32,-3],[-35,-4,-34,2],[-32,15,-15,16]],TEAL);
    for(const [x,y,h] of [[-21,3,10],[-15,-5,12],[-5,-10,15],[7,-10,16],[17,-6,12]]){
      path(ctx,[x-4,y+3],[[x-6,y-h,x,y-h],[x+7,y-h,x+6,y+3]],PINK);
    }
    path(ctx,[-23,11],[[-20,-8,-4,-10],[11,-14,23,-4],[29,1,26,12],[20,26,-2,25],[-22,24,-23,11]],TEAL);
    path(ctx,[8,13],[[19,2,23,-7],[27,-13,33,-7],[37,-1,32,5],[27,6,22,13],[21,21,15,22],[8,14]],SKY);
    for(const x of [-11,9])round(ctx,x-4,17,9,9,3,BLUE,INK,1.7);
    eye(ctx,29,-4,2.1);ell(ctx,32,1,2.7,1.3,PINK);smile(ctx,28,3,5);
    for(const [x,y] of [[-16,10],[-9,3],[2,-2],[9,4]])ell(ctx,x,y,2.1,2.1,SKY);
  }],
  ['tiny-viking','Pocket Viking',ctx => {
    floorShadow(ctx,0,31,24);
    path(ctx,[-12,5],[[-17,18,-12,24],[12,24],[17,14,10,4]],LEAF);
    round(ctx,-15,23,13,7,3,MIDNIGHT);
    round(ctx,2,23,13,7,3,MIDNIGHT);
    ell(ctx,0,-8,16,20,'#efaf8a',INK);
    path(ctx,[-15,-5],[[-9,3,0,1],[10,2,14,-7],[20,4,10,13],[6,15,0,19],[-6,14,-14,10],[-16,2,-15,-5]],AMBER);
    path(ctx,[-19,-17],[[-30,-20,-29,-34],[-25,-26,-18,-25],[-12,-25,-10,-20]],CREAM);
    path(ctx,[19,-17],[[30,-20,29,-34],[25,-26,18,-25],[12,-25,10,-20]],CREAM);
    path(ctx,[-17,-13],[[-19,-32,0,-35],[19,-32,17,-13],[-17,-13]],SKY);
    round(ctx,-18,-16,36,7,3,BLUE);
    poly(ctx,[[-5,-32],[5,-32],[5,-10],[-5,-10]],GOLD,INK,1.6);
    eye(ctx,-6,-5,1.9);eye(ctx,6,-5,1.9);smile(ctx,0,2,6);
    ell(ctx,-16,15,10,11,RED,INK);
    ell(ctx,-16,15,7,8,GOLD,INK,1.5);
    ell(ctx,-16,15,2.5,2.5,SKY,INK,1.2);
  }],
  ['storm-dragon','Storm Dragon',(ctx,t) => {
    floorShadow(ctx,0,32,25);
    at(ctx,0,Math.sin(t*3.2)*2.2,0,paint=>{
      path(paint,[11,-7],[[-3,-11,-16,-3],[-27,7,-18,15],[-5,22,14,15],[25,12,23,20],[22,29,4,29],[-9,32,-20,26],[-29,22,-26,19],[-23,21,-14,22],
        [-9,23,1,21],[5,21,10,19],[-8,22,-22,17],[-32,12,-28,2],[-23,-12,-7,-13],[2,-16,11,-13]],BLUE);
      path(paint,[-19,9],[[-24,4,-20,-2],[-17,-8,-9,-10]],null,SKY,2.6);
      path(paint,[5,-16],[[-1,-25,10,-29],[19,-32,24,-26],[29,-23,29,-18],[36,-15,32,-9],[19,-6,11,-10],[6,-8,5,-16]],SKY);
      poly(paint,[[8,-28],[3,-40],[14,-35],[19,-28]],PLUM);
      poly(paint,[[19,-30],[24,-39],[28,-25]],GOLD);
      path(paint,[14,-12],[[19,1,31,-3],[37,-5,36,-10]],null,CREAM,1.5);
      eye(paint,20,-21,2.8);ell(paint,29,-14,1.7,1.7,INK);
      for (const [x,y] of [[-22,-7],[-12,-13],[-7,18],[5,17]]) sparkle(paint,x,y,3.4,PINK);
      poly(paint,[[-21,-38],[-10,-37],[-18,-28],[-10,-27],[-26,-14],[-20,-26],[-26,-27]],GOLD,INK,1.6);
    });
  },true],
  ['cloud-sheep','Cloud Sheep',ctx => {
    floorShadow(ctx,0,25,25);
    for(const x of [-18,-4,8,19])round(ctx,x-3,12,7,10,2,PLUM,INK,1.7);
    path(ctx,[-24,8],[[-34,-1,-24,-8],[-29,-22,-14,-23],[-10,-33,0,-27],[11,-32,16,-24],[29,-25,29,-14],[39,-6,30,6],[36,18,22,18],[17,24,7,18],[-3,27,-10,20],[-19,24,-24,8]],CREAM);
    for(const [x,y] of [[-14,-13],[-4,-19],[5,-15],[-14,6],[0,12]]) path(ctx,[x-4,y],[[x,y-5,x+4,y]],null,LILAC,1.6);
    ell(ctx,13,-1,16,17,LILAC,INK);
    ell(ctx,25,-6,6,4,PINK,INK,1.6,.18);
    ell(ctx,1,-6,6,4,PINK,INK,1.6,-.18);
    eye(ctx,8,-1,2.6);eye(ctx,18,-1,2.6);smile(ctx,13,6,6);
    sparkle(ctx,-23,-25,4,SKY);
  }],
  ['marshmallow-fox','Marshmallow Fox',ctx => {
    floorShadow(ctx,0,27,26);
    path(ctx,[7,20],[[37,24,33,-5],[29,-13,24,-10],[31,-1,21,11],[9,11,4,11]],AMBER);
    path(ctx,[28,8],[[34,0,30,-8],[25,-12,24,-10],[28,-2,23,4]],CREAM,INK,1.65);
    ell(ctx,-4,10,18,15,AMBER,INK);
    ell(ctx,-5,14,9,10,CREAM);
    path(ctx,[-19,-18],[[-24,-29,-20,-36],[-11,-34,-4,-25],[3,-27,8,-25],[15,-35,23,-34],[24,-24,19,-17],
      [27,-7,13,0],[2,8,-11,1],[-26,-6,-19,-18]],AMBER);
    path(ctx,[-17,-18],[[-21,-25,-18,-31],[-12,-27,-10,-24],[-17,-18]],PINK,INK,1.5);
    path(ctx,[12,-24],[[16,-28,20,-29],[20,-21,18,-18]],PINK,INK,1.5);
    path(ctx,[-20,-9],[[-9,-11,0,-3],[8,-13,20,-11],[16,2,0,3],[-16,1,-20,-9]],CREAM,null);
    eye(ctx,-9,-11,2.4);eye(ctx,10,-11,2.4);ell(ctx,0,-4,3.3,2.4,INK);smile(ctx,0,0,6);
    ell(ctx,-13,22,7,4,CREAM,INK,1.8);
    ell(ctx,3,23,7,4,CREAM,INK,1.8);
  }],
  ['moon-jelly','Moon Jellyfish',(ctx,t) => {
    const swing = Math.sin(t*3.1)*3;
    at(ctx,0,Math.sin(t*2)*1.8,0,paint=>{
      for(const [i,x] of [-19,-9,0,9,19].entries()){
        path(paint,[x,-3],[[x+swing*2,7,x-6,16],[x-3,23,x+swing,30]],null,[SKY,PINK,LILAC,GOLD,CREAM][i],3.3);
      }
      path(paint,[-28,-6],[[-30,-24,-12,-29],[4,-37,22,-25],[34,-15,28,-7],[22,2,12,-4],[4,5,0,-2],[-9,5,-14,-2],[-22,3,-28,-6]],LILAC);
      path(paint,[-20,-13],[[-17,-26,-2,-27]],null,CREAM,3);
      eye(paint,-7,-10,2.6);eye(paint,8,-10,2.6);smile(paint,1,-5,7);
      glint(paint,27,-25,5,CREAM);
    });
  },true],
  ['pocket-axolotl','Pocket Axolotl',ctx => {
    floorShadow(ctx,0,26,27);
    path(ctx,[10,15],[[26,6,30,-7],[37,6,31,19],[19,28,4,25]],PINK);
    path(ctx,[24,18],[[30,13,33,7],[33,15,31,19],[28,23,23,23]],PLUM,null);
    ell(ctx,1,9,21,17,PINK,INK);
    for(const x of [-13,12])round(ctx,x-5,16,10,7,3,LILAC,INK,1.7);
    for(const dir of [-1,1]){
      for(const [y,x] of [[-24,21],[-13,26],[-4,27]]) {
        path(ctx,[dir*13,y+2],[[dir*x,y-8,dir*(x+6),y-6],[dir*(x+4),y+2,dir*15,y+7]],CORAL,INK,1.7);
      }
    }
    ell(ctx,0,-10,21,16,'#f4b9de',INK);
    eye(ctx,-9,-11,2.9);eye(ctx,9,-11,2.9);smile(ctx,0,-4,9);
    ell(ctx,-12,-5,3.2,1.8,CORAL);ell(ctx,13,-5,3.2,1.8,CORAL);
    highlight(ctx,-7,-20,4);
  }],
  ['busy-bumblebee','Busy Bumblebee',(ctx,t) => {
    at(ctx,0,Math.sin(t*4)*3,-.15,paint=>{
      floorShadow(paint,0,28,21);
      const flutter=Math.sin(t*18)*.34;
      for(const side of [-1,1])ell(paint,side*13,-16,10,16,SKY,INK,1.7,side*(.5+flutter));
      ell(paint,2,1,24,18,GOLD,INK,2.8);
      path(paint,[12,-14],[[22,-6,17,11],[12,18,5,18],[13,7,10,-12]],INK,null);
      path(paint,[1,-16],[[9,-7,6,15],[0,19,-6,18],[2,10,0,-15]],INK,null);
      poly(paint,[[24,0],[34,4],[23,9]],INK);
      ell(paint,-14,0,13,13,AMBER,INK,2);
      for(const x of [-18,-8])eye(paint,x,0,2.4);
      smile(paint,-13,6,7);
      path(paint,[-19,-10],[[-20,-23,-28,-22]],null,INK,2);
      path(paint,[-10,-11],[[-9,-24,-3,-24]],null,INK,2);
      ell(paint,-27,-22,2.2,2.2,PINK);
      ell(paint,-3,-24,2.2,2.2,PINK);
    });
  },true],
  ['teacup-mouse','Teacup Mouse',ctx => {
    floorShadow(ctx,0,30,27);
    ell(ctx,0,24,29,7,PLUM,INK);
    path(ctx,[16,-4],[[35,-9,35,7],[33,16,17,15]],null,INK,6);
    path(ctx,[16,-4],[[35,-9,35,7],[33,16,17,15]],null,GOLD,3);
    ell(ctx,-15,-25,8,9,LILAC,INK);
    ell(ctx,10,-25,8,9,LILAC,INK);
    ell(ctx,-15,-25,4.5,5,PINK);
    ell(ctx,10,-25,4.5,5,PINK);
    ell(ctx,-3,-14,17,16,LILAC,INK);
    eye(ctx,-9,-13,2.4);eye(ctx,5,-13,2.4);
    ell(ctx,-2,-8,2.8,2,PINK,INK,1.2);smile(ctx,-2,-5,6);
    path(ctx,[-25,-3],[[-2,-8,23,-3],[22,19,9,24],[-6,30,-16,19],[-24,11,-25,-3]],TEAL);
    ell(ctx,-1,-4,23,5.5,CREAM,INK,2);
    ell(ctx,-2,-5,5,5,LILAC,INK,1.4);
    star(ctx,0,12,8,4,GOLD,INK);
  }],
  ['coral-octopus','Coral Octopus',ctx => {
    floorShadow(ctx,0,27,28);
    for(const [i,[x,y,k]] of [[-23,10,-1],[-16,19,-1],[-7,24,-1],[7,24,1],[17,20,1],[24,10,1]].entries()){
      path(ctx,[x*.56,1],[[x,12,x+3*k,y],[x+8*k,y+8,x+8*k,y-1]],null,INK,8.3);
      path(ctx,[x*.56,1],[[x,12,x+3*k,y],[x+8*k,y+8,x+8*k,y-1]],null,i%2?CORAL:RED,4.8);
    }
    path(ctx,[-20,8],[[-31,-15,-17,-29],[0,-40,19,-29],[30,-18,23,6],[19,17,0,17],[-16,17,-20,8]],CORAL);
    for(const [x,y] of [[-9,-23],[7,-28],[15,-23],[-16,-12]])ell(ctx,x,y,2.5,2.5,PINK);
    eye(ctx,-8,-5,3.3);eye(ctx,9,-5,3.3);
    smile(ctx,1,3,9);
    ell(ctx,-11,3,4,2.4,PINK);ell(ctx,14,2,4,2.4,PINK);
    highlight(ctx,-10,-24,5);
  }],
  ['raspberry-snail','Raspberry Snail',ctx => {
    floorShadow(ctx,0,22,28);
    path(ctx,[-28,10],[[-17,-3,2,-2],[8,-21,20,-22],[28,-19,26,-7],[27,0,32,7],[37,15,21,17],[-5,27,-28,16]],TEAL);
    ell(ctx,-7,-7,22,23,RED,INK);
    path(ctx,[-13,-15],[[-22,-21,-24,-9],[-23,3,-12,6],[4,11,10,-1],[14,-12,4,-17],[-7,-26,-15,-15],
      [-21,-6,-10,-2],[-1,2,3,-6],[3,-12,-5,-13],[-12,-10,-7,-5]],null,PINK,3.9);
    for(const x of [15,23])line(ctx,[[x,-19],[x+1,-29]],INK,2.4);
    eye(ctx,16,-29,2.6);eye(ctx,24,-28,2.6);
    smile(ctx,22,-10,7);
    ell(ctx,26,-13,3,1.8,PINK);
  }],
  ['penguin-postman','Penguin Postman',ctx => {
    floorShadow(ctx,0,28,23);
    ell(ctx,-11,24,9,4.6,AMBER,INK,1.7);ell(ctx,12,24,9,4.6,AMBER,INK,1.7);
    ell(ctx,0,2,23,24,BLUE,INK);
    ell(ctx,-19,5,7,16,MIDNIGHT,INK,1.8,.5);ell(ctx,19,5,7,16,MIDNIGHT,INK,1.8,-.5);
    ell(ctx,0,9,15,17,CREAM,INK,1.8);
    ell(ctx,0,-13,20,17,MIDNIGHT,INK);
    path(ctx,[-15,-11],[[-19,-26,-3,-26],[0,-22,3,-26],[19,-26,15,-11],[11,-3,0,-4],[-11,-3,-15,-11]],CREAM,null);
    eye(ctx,-7,-13,2.6);eye(ctx,8,-13,2.6);
    poly(ctx,[[-4,-5],[6,-5],[0,2]],AMBER,INK,1.6);
    path(ctx,[-17,-22],[[-15,-40,4,-39],[17,-34,18,-22],[-17,-22]],TEAL);
    round(ctx,-18,-25,39,7,2,BLUE,INK,1.6);
    ell(ctx,0,-30,4,3,GOLD);
    round(ctx,4,9,21,12,3,CORAL,INK,1.7);
    poly(ctx,[[6,11],[22,11],[14,17]],CREAM,INK,1.1);
  }],
  ['squeaky-otter','River Otter',ctx => {
    floorShadow(ctx,0,28,27);
    path(ctx,[-12,17],[[-21,20,-30,14],[-39,8,-33,23],[-21,30,-8,25]],'#a85d69');
    ell(ctx,-1,7,19,21,'#a85d69',INK);
    ell(ctx,-1,11,11,14,'#e6b499');
    ell(ctx,-16,-22,6,7,AMBER,INK,1.8);
    ell(ctx,13,-23,6,7,AMBER,INK,1.8);
    ell(ctx,-2,-15,20,18,'#c47b77',INK);
    ell(ctx,-2,-10,13,9,CREAM);
    eye(ctx,-10,-16,2.5);eye(ctx,7,-16,2.5);
    ell(ctx,-2,-11,4,2.8,INK);smile(ctx,-2,-5,8);
    for(const dir of [-1,1])line(ctx,[[dir*10,-8],[dir*19,-6]],CREAM,1.6);
    ell(ctx,-12,11,6,9,AMBER,INK,1.6,-.39);
    ell(ctx,11,11,6,9,AMBER,INK,1.6,.39);
    ell(ctx,-1,14,8,9,SKY,INK,1.8);
    for(let i=0;i<3;i++)line(ctx,[[-5+i*4,9],[-6+i*5,19]],BLUE,1.25);
  }],
  ['bookish-owl','Bookish Owl',ctx => {
    floorShadow(ctx,0,27,24);
    ell(ctx,0,8,24,19,'#ab6b79',INK);
    path(ctx,[-23,-6],[[-22,-17,-19,-33],[-10,-30,-6,-24],[0,-27,7,-24],[16,-32,23,-33],[24,-21,23,-8],[23,10,0,12],[-23,10,-23,-6]],PLUM);
    for(const x of [-9,10]){
      ell(ctx,x,-10,11,10,CREAM,INK,1.7);
      ell(ctx,x,-10,5,5,GOLD,INK,1.4);
      eye(ctx,x,-10,2.8);
    }
    poly(ctx,[[-5,-1],[6,-1],[1,8]],AMBER,INK,1.6);
    line(ctx,[[-1,-10],[2,-10]],INK,1.7);
    path(ctx,[-24,10],[[-13,4,0,11],[12,5,25,10],[23,22,23,25],[12,23,0,29],[-12,23,-23,25],[-24,10]],TEAL);
    path(ctx,[-20,12],[[-10,9,0,14],[11,8,21,12],[21,21],[9,20,0,25],[-11,20,-20,21],[-20,12]],CREAM,null);
    line(ctx,[[0,14],[0,25]],PLUM,1.4);
  }],
  ['firefly-frog','Firefly Frog',(ctx,t) => {
    floorShadow(ctx,0,27,27);
    ell(ctx,-16,16,12,7,LEAF,INK,2);
    ell(ctx,17,16,12,7,LEAF,INK,2);
    ell(ctx,0,9,19,16,GREEN,INK);
    ell(ctx,0,13,11,9,'#deed94');
    path(ctx,[-22,0],[[-29,-12,-19,-18],[-20,-28,-11,-31],[-1,-34,3,-22],[11,-34,18,-28],[23,-24,23,-16],[32,-9,23,1],[6,10,-10,8],[-20,7,-22,0]],GREEN);
    for(const x of [-10,15]){ell(ctx,x,-20,5,6,CREAM,INK,1.2);eye(ctx,x,-20,2.4);}
    smile(ctx,1,-5,12);
    ell(ctx,-13,-3,4,2,CORAL);ell(ctx,15,-4,4,2,CORAL);
    const pulse=.65+Math.sin(t*4)*.26;
    ell(ctx,28,-29,10+pulse*4,10+pulse*4,'#ffda6773');
    ell(ctx,28,-29,3.4,2.7,GOLD,INK,1.3);
    ell(ctx,25,-33,3.1,2.4,CREAM,INK,1.1,.43);
    ell(ctx,30,-33,3.1,2.4,CREAM,INK,1.1,-.43);
  },true],
  ['bunny-baker','Bunny Baker',ctx => {
    floorShadow(ctx,0,28,24);
    ell(ctx,0,10,19,15,LILAC,INK);
    for(const side of [-1,1]){
      ell(ctx,side*11,-24,7,17,CREAM,INK,2,side*.24);
      ell(ctx,side*11,-25,3.8,11,PINK,null,0,side*.24);
      ell(ctx,side*12,24,7,4,CREAM,INK,1.7);
    }
    ell(ctx,0,-6,19,16,CREAM,INK);
    eye(ctx,-7,-6,2.7);eye(ctx,8,-6,2.7);
    poly(ctx,[[-2,0],[3,0],[0,4]],CORAL,INK,1.1);smile(ctx,0,6,7);
    path(ctx,[-10,11],[[-4,9,0,13],[4,9,10,11],[10,20],[-10,20],[-10,11]],TEAL,INK,1.6);
    poly(ctx,[[8,9],[24,8],[27,27],[10,27]],AMBER);
    path(ctx,[9,10],[[3,3,12,0],[11,-6,16,-7],[20,-8,22,-3],[31,-3,29,5],[31,10,24,12],[18,8,9,10]],PINK,INK,2);
    ell(ctx,17,-5,3.4,3.4,CORAL,INK,1.1);
  }],
  ['derby-duck','Roller Derby Duck',ctx => {
    floorShadow(ctx,0,30,28);
    path(ctx,[-23,0],[[-28,18,-9,21],[11,24,21,14],[24,10,20,6],[6,7,0,-6],[-13,-8,-23,0]],GOLD);
    path(ctx,[-20,3],[[-9,-4,1,1],[7,8,-4,14],[-14,16,-20,3]],AMBER,INK,1.6);
    ell(ctx,9,-10,16,16,GOLD,INK);
    path(ctx,[20,-10],[[27,-12,32,-7],[33,-2,22,0],[17,-4,20,-10]],AMBER);
    path(ctx,[-6,-15],[[-1,-34,17,-28],[27,-24,25,-14],[-6,-15]],TEAL);
    round(ctx,-8,-17,36,5,2,SKY,INK,1.7);
    eye(ctx,15,-9,3);ell(ctx,18,-4,3.4,1.8,CORAL);
    round(ctx,-18,20,38,7,3,PLUM);
    for (const x of [-11,13])ell(ctx,x,29,4,4,CORAL,INK,1.7);
    star(ctx,9,-24,4.5,2.2,GOLD);
  }],
  ['rocket-cat','Rocket Cat',(ctx,t) => {
    at(ctx,0,Math.sin(t*3.6)*2.4,0,paint=>{
      floorShadow(paint,0,31,24);
      path(paint,[17,13],[[30,11,30,0],[33,-4,35,2],[37,15,20,20]],AMBER);
      round(paint,-25,4,11,17,3,TEAL);
      round(paint,14,4,11,17,3,TEAL);
      for(const x of [-20,19])path(paint,[x-3,19],[[x-4,27,x,33],[x+5,25,x+3,19]],AMBER,INK,1.4);
      ell(paint,0,10,16,17,AMBER,INK);
      ell(paint,0,13,9,11,CREAM);
      ell(paint,0,-10,22,21,SKY,INK,2.5);
      path(paint,[-14,-11],[[-16,-26,-13,-28],[-4,-22,-3,-20],[5,-22,9,-22],[15,-28,17,-25],[18,-14,15,-4],[10,4,0,5],[-14,5,-14,-11]],AMBER,INK,1.8);
      eye(paint,-7,-11,2.5);eye(paint,8,-11,2.5);smile(paint,1,-3,7);
      path(paint,[-17,-15],[[-14,-26,-6,-27]],null,CREAM,2.2);
      sparkle(paint,27,-20,5,CREAM);
    });
  },true],
  ['peekaboo-mimic','Peekaboo Treasure Chest',ctx => {
    floorShadow(ctx,0,28,25);
    path(ctx,[-25,2],[[-27,23,-22,26],[24,26],[27,3],[-25,2]],'#bd735a');
    path(ctx,[-25,-1],[[-8,-5,13,-5],[26,-8],[29,1,26,7],[-23,13,-26,8],[-25,-1]],MIDNIGHT);
    for(const x of [-17,-7,4,15])poly(ctx,[[x,3],[x+5,2],[x+3,8]],CREAM,INK,1);
    path(ctx,[-26,-1],[[-26,-15,-21,-23],[-7,-35,11,-29],[29,-22,27,-9],[-26,-1]],AMBER);
    for(const side of [-1,1])path(ctx,[side*19,-24],[[side*26,-21,side*25,-8],[side*19,-8],[side*20,-20,side*15,-26]],GOLD,INK,1.5);
    for(const x of [-16,17])round(ctx,x-2,15,5,11,2,GOLD,INK,1.3);
    for(const x of [-8,8])elliMimic(ctx,x,-11);
    round(ctx,-5,16,10,8,2,GOLD);
    sparkle(ctx,29,-28,5,CREAM);
  }],
  ['alpaca-scarf','Scarf Alpaca',ctx => {
    floorShadow(ctx,0,28,26);
    for(const x of [-15,-5,7,16])round(ctx,x-3,15,6,12,2,PLUM,INK,1.6);
    path(ctx,[-22,14],[[-29,5,-21,1],[-20,-8,-11,-7],[-4,-11,5,-2],[7,-22,12,-28],[26,-27,25,-8],[21,5,21,14],[12,25,-6,21],[-17,24,-22,14]],CREAM);
    path(ctx,[7,-17],[[5,-37,9,-40],[17,-38,18,-25],[23,-38,26,-36],[32,-23,24,-18]],CREAM);
    ell(ctx,17,-19,12,12,CREAM,INK);
    ell(ctx,21,-14,8,6,'#e4bbab',INK,1.5);
    eye(ctx,14,-21,2.6);ell(ctx,24,-14,1.5,1.5,INK);smile(ctx,22,-11,5);
    path(ctx,[6,-8],[[18,-3,24,-8],[24,-2,6,1],[8,8,6,18],[1,17,2,7],[1,2,6,-8]],RED);
    for(const x of [5,11,17])line(ctx,[[x,-5],[x+2,-1]],PINK,1.6);
    for(const x of [-15,-7,-2])path(ctx,[x-2,5],[[x,2,x+3,6]],null,LILAC,1.6);
  }],
  ['golden-koi','Golden Sky Koi',(ctx,t) => {
    at(ctx,0,Math.sin(t*2.8)*2.5,.3,paint=>{
      floorShadow(paint,0,29,27);
      path(paint,[-13,7],[[-22,13,-33,16],[-34,8,-25,1],[-33,-5,-32,-13],[-23,-12,-13,-5]],PINK);
      path(paint,[-10,-2],[[-8,-15,2,-23],[12,-22,10,-17],[8,-11,3,-7]],AMBER);
      path(paint,[-15,3],[[-10,-14,10,-15],[31,-16,33,-2],[29,13,8,17],[-5,17,-15,3]],GOLD);
      path(paint,[-10,6],[[-7,-4,2,-9],[9,-7,10,2],[7,13,4,15],[-4,14,-10,6]],CORAL,null);
      path(paint,[13,-13],[[20,-14,27,-8],[25,-4,19,-5],[13,0,13,-3]],CREAM,null);
      eye(paint,23,-2,3.2);smile(paint,27,4,6);
      path(paint,[4,10],[[7,24,15,20],[18,16,11,9]],PINK,INK,1.8);
      for(const x of [-4,2,7])path(paint,[x,-5],[[x+3,0,x,-.5]],null,CREAM,1.25);
      ell(paint,30,-19,3.5,3.5,null,SKY,1.2);
      ell(paint,22,-27,5,5,null,SKY,1.5);
    });
  },true],

];

function elliMimic(ctx,x,y) {
  ell(ctx,x,y,4,5,GOLD,INK,1.5);
  eye(ctx,x,y,1.9);
}

function scenicStars(ctx,seed,count,color = CREAM,minY=0,height=160) {
  scatter(ctx,seed,count,3,minY,250,height,(canvas,x,y,scale,i)=>{
    if(i%6===0) sparkle(canvas,x,y,4*scale,color);
    else ell(canvas,x,y,1.6*scale,1.6*scale,color);
  });
}

function cloud(ctx,x,y,size,fill) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(size,size);
  path(ctx,[-39,5],[[-46,-3,-33,-7],[-33,-20,-18,-18],[-11,-29,3,-26],[19,-27,25,-13],
    [38,-15,42,-2],[50,3,37,10],[-28,12,-39,5]],fill,null);
  ctx.restore();
}

function tree(ctx,x,y,size,fill,accent) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(size,size);
  poly(ctx,[[-4,18],[4,18],[4,-3],[-4,-3]],accent,null);
  poly(ctx,[[-20,3],[-13,-10],[-18,-10],[-5,-29],[-11,-29],[0,-50],[11,-29],[5,-29],[18,-10],
    [13,-10],[20,3]],fill,null);
  ctx.restore();
}

function hills(ctx,y,peaks,fill) {
  path(ctx,[0,256],[[0,y],...peaks,[256,256]],fill,null);
}

function distantCity(ctx,base,color,widths,lights = false) {
  let x=0;
  for(const [i,[w,h]] of widths.entries()){
    ctx.fillStyle=color;
    ctx.fillRect(x,base-h,w,256-base+h);
    if(i%3===2){
      ctx.fillRect(x+w*.25,base-h-8,w*.5,8);
      ctx.fillRect(x+w*.5,base-h-12,1.3,4);
    }
    if(lights)for(let column=0;column<Math.floor(w/8)-1;column++){
      for(let level=0;level<Math.floor(h/13);level++){
        if((column+level+i)%3===0){
          ctx.fillStyle=['#ffe797','#ffd0cb','#9feefb'][(i+level)%3];
          ctx.fillRect(x+5+column*8,base-h+6+level*13,2.4,4.4);
        }
      }
    }
    x+=w+3;
  }
}

const backgrounds = [
  ['galaxy-portal','Galaxy Portal',(ctx,t) => {
    sky(ctx,'#221b4e','#64387a');
    ell(ctx,128,121,117,99,'#7b56c3',null,0,-.4);
    ell(ctx,128,121,94,80,'#f383a3',null,0,-.4);
    ell(ctx,128,121,88,74,'#7a70d3',null,0,-.4);
    const portal=ctx.createRadialGradient(138,122,9,132,120,81);
    portal.addColorStop(0,'#427aa3');
    portal.addColorStop(.67,'#313664');
    portal.addColorStop(1,'#231b4c');
    ell(ctx,128,121,82,66,portal,null,0,-.4);
    path(ctx,[16,126],[[10,79,51,40],[100,-2,208,22,238,67],[254,89,239,113]],null,'#c8aaf2',4);
    path(ctx,[31,188],[[73,235,166,234],[223,225,247,182,244,143]],null,'#70e2e8',4);
    scenicStars(ctx,83,42,'#fff2be',0,251);
    const orbit=t*.35;
    const x=128+104*Math.cos(-.8+orbit),y=113+91*Math.sin(-.8+orbit);
    glint(ctx,x,y,8,'#f4edc8');
  },true],
  ['sunflower-field','Sunflower Field',ctx => {
    sky(ctx,'#82d9ed','#fff0a7');
    cloud(ctx,210,38,.9,'#fffbe9');
    cloud(ctx,39,61,.73,'#fffbe9');
    ell(ctx,50,47,21,21,'#ffd16b');
    hills(ctx,144,[[63,102,131,149],[201,89,256,132]],'#84bd66');
    hills(ctx,178,[[58,122,143,176],[192,149,256,166]],'#b4d273');
    for(const [x,y,scale] of [[17,206,.95],[45,224,.72],[69,201,.81],[204,198,1.05],[236,221,1.21]]){
      line(ctx,[[x,y+6],[x+4,y+39]],LEAF,4*scale);
      path(ctx,[x+2,y+21],[[x-15,y+10,x-13,y+20],[x-12,y+26,x+2,y+21]],GREEN,null);
      path(ctx,[x+3,y+26],[[x+19,y+14,x+16,y+25],[x+13,y+30,x+3,y+26]],LEAF,null);
      for(let petal=0;petal<9;petal++){
        const a=petal*Math.PI*2/9;
        ell(ctx,x+Math.cos(a)*11*scale,y+Math.sin(a)*11*scale,8*scale,3.8*scale,GOLD,AMBER,1.35,a);
      }
      ell(ctx,x,y,8*scale,8*scale,'#8c4c50','#6a4859',1.8);
      ell(ctx,x-2,y-3,1.2,1.2,CREAM);
    }
  }],
  ['northern-fjord','Northern Fjord',ctx => {
    sky(ctx,'#7898cb','#f5c3cb');
    ell(ctx,213,51,16,16,'#ffe7b2');
    band(ctx,165,'#387997');
    poly(ctx,[[0,47],[42,19],[79,45],[104,85],[128,118],[128,173],[0,184]],'#4d668d',null);
    poly(ctx,[[0,53],[42,19],[79,45],[105,89],[80,75],[61,63],[49,70],[36,56],[20,59]],CREAM,null);
    poly(ctx,[[256,55],[222,31],[187,55],[159,90],[139,121],[139,175],[256,186]],'#6075a1',null);
    poly(ctx,[[256,55],[222,31],[187,55],[169,79],[198,70],[204,58],[220,61],[232,49]],CREAM,null);
    hills(ctx,136,[[35,113,73,159],[86,169,107,176],[44,198,0,220]],'#3c786f');
    poly(ctx,[[152,180],[188,153],[221,144],[256,149],[256,212],[200,207]],'#5f9078',null);
    for(const [x,y,w] of [[15,212,56],[168,217,36],[188,193,45],[3,238,46],[209,244,33],[77,220,29]]){
      path(ctx,[x,y],[[x+w/2,y+2,x+w,y]],null,'#afe6ea',2.1);
    }
    for(const [x,y,s] of [[22,157,.58],[44,166,.78],[217,168,.48],[245,171,.72]])tree(ctx,x,y,s,'#426b77','#527a6b');
    for(const x of [19,66,191,229]) ell(ctx,x,230,5,1.4,'#c3e6ef');
  }],
  ['mushroom-cove','Mushroom Cove',ctx => {
    sky(ctx,'#5b86a2','#b8d995');
    scatter(ctx,9101,31,4,8,248,231,(g,x,y,r,i)=>ell(g,x,y,4*r,4*r,i%2?'#e9d48d9b':'#f5ddfc9b'));
    hills(ctx,143,[[56,158,114,142],[189,123,256,155]],'#638b6c');
    hills(ctx,205,[[61,164,114,211],[175,192,256,197]],'#447963');
    for(const [x,y,s,c] of [[30,176,1.3,CORAL],[53,219,.7,AMBER],[211,159,1.3,PLUM],[240,217,.85,RED]]){
      const mushroom = paint=>{
        path(paint,[-6,4],[[-13,39,-16,48],[12,51,15,45],[8,24,6,5]],CREAM,INK,2);
        path(paint,[-25,8],[[-23,-11,-11,-22,5,-27],[20,-28,33,-9,32,5],[10,18,-25,8]],c,INK,2);
        path(paint,[-23,6],[[-4,6,13,10],[29,5,31,6]],null,'#f3bad6',1.8);
        for(const [a,b,r] of [[-11,-4,4],[4,-14,5.5],[18,-7,3.6]])ell(paint,a,b,r,r*.72,CREAM);
      };
      ctx.save();ctx.translate(x,y);ctx.scale(s,s);mushroom(ctx);ctx.restore();
    }
    for (const x of [15,42,76,180,222,240]) line(ctx,[[x,247],[x-3,237],[x+1,240],[x+2,233]],GREEN,2.6);
  }],
  ['undersea-castle','Undersea Castle',ctx => {
    sky(ctx,'#429ec9','#225474');
    poly(ctx,[[31,0],[60,0],[146,211],[114,205]],'#9ff2e934',null);
    poly(ctx,[[190,0],[207,0],[139,204],[116,192]],'#bcf3db24',null);
    hills(ctx,218,[[65,177,117,205],[185,172,256,201]],'#527483');
    for(const [x,y,k] of [[16,183,.8],[62,196,.59],[198,175,.86],[232,144,1.07]]){
      ctx.save();ctx.translate(x,y);ctx.scale(k,k);
      round(ctx,-14,-28,28,72,3,'#b29dbf',null);
      poly(ctx,[[-22,-26],[0,-59],[22,-26]],'#ca9bc5','#725c9c',2);
      round(ctx,-6,-8,12,19,6,'#617da1',null);
      line(ctx,[[-9,19],[9,19]],'#d7bccc',2);
      ctx.restore();
    }
    for(const [x,y,r] of [[18,67,9],[51,93,5],[223,59,11],[246,81,4],[23,131,6],[197,105,4],[45,230,4],[224,127,3]]){
      ell(ctx,x,y,r,r,'#abdff353','#b3e8e7',1.5);
      highlight(ctx,x-r*.3,y-r*.35,1.8);
    }
    for(const [x,dir,color] of [[10,1,CORAL],[30,-1,PINK],[225,1,TEAL],[245,-1,GREEN]]){
      path(ctx,[x,256],[[x+dir*12,226,x-dir*2,212],[x-dir*5,196,x+dir*8,189]],null,color,5);
      path(ctx,[x+4,246],[[x+dir*22,231,x+dir*19,221]],null,color,3);
    }
  }],
  ['paint-splash','Paint Splash Wall',ctx => {
    ctx.fillStyle='#f4dded';ctx.fillRect(0,0,256,256);
    for(const [x,y,c] of [[19,32,TEAL],[219,46,PINK],[31,184,GOLD],[234,217,PLUM],[144,13,SKY]]){
      const blob=[];
      for(let i=0;i<24;i++){
        const angle=i*Math.PI/12;
        const radius=34+Math.cos(i*2.13+x)*7+Math.sin(i*1.61+y)*10;
        blob.push([x+radius*Math.cos(angle),y+radius*Math.sin(angle)]);
      }
      poly(ctx,blob,c,null);
      for(let i=0;i<9;i++){
        const angle=i*6.04+x;
        const radius=44+(i*17)%41;
        const r=2+(i*13)%8;
        ell(ctx,x+radius*Math.cos(angle),y+radius*Math.sin(angle),r,r*.72,c,null,0,angle);
      }
      highlight(ctx,x-2,y-6,10);
    }
    for(const [x,y,r] of [[72,27,8],[178,37,6],[39,115,7],[216,151,9],[56,230,9],[171,240,7]])sparkle(ctx,x,y,r,CREAM);
  }],
  ['retro-arcade','Retro Arcade Grid',ctx => {
    sky(ctx,'#271747','#4f376c');
    for(let n=0;n<11;n++)line(ctx,[[-122+n*47,256],[128+(n-5)*9,128]],'#ce84df',1.3);
    for(let n=0;n<7;n++){const y=147+n*n*3.25;line(ctx,[[0,y],[256,y]],'#935ec7',1.5);}
    for(const [x,y,w,h,c] of [[16,41,35,20,TEAL],[205,57,30,17,PINK],[32,91,17,13,PLUM],[226,113,20,9,TEAL],[21,126,29,11,AMBER]]){
      round(ctx,x,y,w,h,3,'#262549',c,3);
      line(ctx,[[x+5,y+h/2],[x+w-6,y+h/2]],c,2);
    }
    for(const [x,y,c] of [[26,216,SKY],[231,194,CORAL],[46,180,GOLD],[224,15,CREAM],[70,30,PINK]])star(ctx,x,y,10,4.3,c,null,4);
    for(const [x,y] of [[12,13],[52,65],[31,82],[243,51],[199,26]])round(ctx,x,y,4,4,0,CREAM,null);
  }],
  ['meteor-shower','Meteor Shower',ctx => {
    sky(ctx,'#22294f','#815f95');
    scenicStars(ctx,19,52,'#f8d7ca',0,216);
    ell(ctx,206,53,33,32,'#ba8cae');
    ell(ctx,210,52,31,29,'#f0b6b4');
    for(const [x,y] of [[203,38],[217,62],[191,63],[218,44]])ell(ctx,x,y,4,2.4,'#c88cad');
    for(const [x,y,n,c] of [[32,44,36,CREAM],[65,84,56,SKY],[228,138,50,PINK],[31,151,22,GOLD],[230,192,43,CREAM]]){
      const gradient=ctx.createLinearGradient(x+n,y-n,x,y);
      gradient.addColorStop(0,'#ffffff00');gradient.addColorStop(1,c);
      line(ctx,[[x+n,y-n],[x,y]],gradient,3.6);
      ell(ctx,x,y,2.6,2.5,CREAM);
    }
    hills(ctx,217,[[43,174,79,203],[118,220,169,202],[208,182,256,214]],'#403851');
    hills(ctx,243,[[61,211,124,249],[198,217,256,229]],'#513756');
  }],
  ['geode-cave','Rainbow Geode Cave',ctx => {
    sky(ctx,'#352848','#604157');
    for(const [stroke,noise] of [['#4a3557',0],['#765273',11],['#a36c8c',19],['#664574',28],['#d496ae',36],['#795b89',44]]){
      path(ctx,[2-noise,-5],[[44+noise,9,51+noise,47],[49+noise,86,21+noise,126],[1+noise,153,30+noise,181],
        [46+noise,223,23+noise,260]],null,stroke,9.3);
      path(ctx,[258+noise,-3],[[222-noise,21,221-noise,67],[218-noise,113,242-noise,146],[261-noise,197,241-noise,258]],null,stroke,11.5);
    }
    for(const [x,y,h,c] of [[18,228,90,PINK],[29,219,75,SKY],[54,230,47,LILAC],[232,242,96,TEAL],[213,248,62,PLUM],[246,228,58,SKY]]){
      poly(ctx,[[x-8,y],[x-12,y-h+21],[x-1,y-h],[x+13,y-h+20],[x+11,y]],c,INK,2);
      poly(ctx,[[x-8,y],[x-12,y-h+21],[x-1,y-h],[x-2,y-h+19],[x-1,y]],'#fcf2f28a',null);
      line(ctx,[[x-2,y-h+16],[x+4,y-h+22],[x+4,y-7]],CREAM,1.6);
    }
  }],
  ['violet-library','Violet Library',ctx => {
    sky(ctx,'#513754','#9e756c');
    for(const [x,w] of [[4,49],[201,51]]){
      round(ctx,x,14,w,190,3,'#754951','#c28373',2.5);
      const patterns=[TEAL,PLUM,GOLD,RED,SKY,AMBER,LEAF,PINK];
      for(let shelf=0;shelf<4;shelf++){
        const y=51+shelf*46;
        for(let k=0;k<8;k++){
          const h=11+((k*29+shelf*17)%23);
          round(ctx,x+3+k*5.35,y-h,4.4,h,1.1,patterns[(k+shelf*3)%patterns.length],null);
          line(ctx,[[x+4+k*5.35,y-6],[x+6.5+k*5.35,y-6]],CREAM,.8);
        }
        round(ctx,x+1,y,w-2,4,1,'#e6ac86',null);
      }
    }
    poly(ctx,[[0,215],[256,207],[256,256],[0,256]],'#7f615f',null);
    for(let x=-90;x<=302;x+=40)line(ctx,[[x,256],[128+(x-128)*.51,211]],'#e2a48f',1.8);
    path(ctx,[192,0],[[193,14,200,34]],null,GOLD,2.7);
    path(ctx,[184,28],[[210,28],[224,47],[174,47],[184,28]],AMBER,INK,2);
    ell(ctx,199,48,22,5,CREAM);
    for(const [x,y] of [[222,63],[173,55],[191,64]])sparkle(ctx,x,y,3.8,CREAM);
  }],
  ['sweetshop','Cloud Candy Shop',ctx => {
    sky(ctx,'#fcc8e7','#fee9b5');
    for(let n=0;n<9;n++)poly(ctx,[[n*33-12,0],[n*33+5,0],[n*33+32,47],[n*33+15,47]],n%2?CREAM:CORAL,null);
    for (let n=0;n<9;n++) ell(ctx,13+32*n,47,16,11,n%2?CREAM:CORAL);
    cloud(ctx,27,108,.67,'#fff4e5');cloud(ctx,208,93,.72,'#fff4e5');
    band(ctx,184,'#dfacd3');
    for(let y=196;y<270;y+=15)line(ctx,[[0,y],[256,y]],'#fff4e5',2.1);
    for(let x=-120;x<376;x+=50)line(ctx,[[x,256],[128+(x-128)*.42,186]],'#fff4e5',2.1);
    for(const [x,y,r,c] of [[26,143,17,PLUM],[228,125,22,TEAL],[242,184,15,AMBER],[45,187,12,RED]]){
      line(ctx,[[x,y],[x+4,229]],CREAM,5);
      ell(ctx,x,y,r,r,c,INK,2);
      path(ctx,[x+r*.66,y],[[x+r*.63,y-r*.85,x-r*.56,y-r*.80,x-r*.53,y-r*.11],
        [x-r*.71,y+r*.63,x+r*.40,y+r*.77,x+r*.31,y+r*.07],[x+r*.26,y-r*.43,x-r*.24,y-r*.24]],null,CREAM,2.7);
    }
  }],
  ['winter-cabin','Winter Cabin',ctx => {
    sky(ctx,'#7799bb','#bed4e7');
    ell(ctx,223,49,24,23,'#fff1d6');
    hills(ctx,148,[[38,76,83,137],[116,185,142,133],[198,55,256,129]],'#81a4b9');
    hills(ctx,191,[[61,166,113,196],[197,168,256,180]],'#edf2ee');
    hills(ctx,224,[[57,204,128,230],[188,221,256,217]],'#c9dce7');
    for(const [x,y,s] of [[20,167,.76],[38,183,1.19],[219,161,.83],[245,173,1.1]])tree(ctx,x,y,s,'#5d8992','#a57172');
    round(ctx,185,168,59,43,1,'#a77079','#6c5573',2);
    poly(ctx,[[181,172],[213,144],[248,171]],'#a46c81','#6c5573',2);
    poly(ctx,[[177,172],[213,142],[248,171],[239,175],[213,152],[186,176]],CREAM,null);
    round(ctx,197,180,15,15,1,'#ffdc8b','#6c5573',1.7);
    line(ctx,[[204.5,181],[204.5,194]],'#87708c',1.4);
    line(ctx,[[198,187],[211,187]],'#87708c',1.4);
    for(const [x,y,c] of [[17,46,CREAM],[52,28,CREAM],[226,98,CREAM],[31,225,SKY],[244,232,CREAM],[55,124,CREAM]]){
      sparkle(ctx,x,y,5,c);
    }
  }],
  ['midnight-city','Midnight City',ctx => {
    sky(ctx,'#26224e','#a05d82');
    ell(ctx,82,65,32,32,'#eec3a0');
    ell(ctx,90,60,31,31,'#3d2b58');
    scenicStars(ctx,290,30,'#f7caad',0,181);
    distantCity(ctx,210,'#5f3b6a',[[21,46],[18,63],[20,77],[25,49],[22,51],[24,37],[20,63],[16,74],[22,47],[23,65]]);
    distantCity(ctx,229,'#333654',[[24,51],[24,66],[14,45],[20,30],[27,46],[20,32],[21,61],[15,73],[27,85],[18,54]],true);
    band(ctx,231,'#2c2d48');
    for(let i=0;i<9;i++)line(ctx,[[4+i*29,249],[17+i*29,249]],i%2?'#f2c787':'#78678e',1.6);
    for(const [x,y] of [[14,154],[24,94],[223,42],[232,85]])glint(ctx,x,y,5,CREAM);
  }],
  ['skate-park','Sunset Skate Park',ctx => {
    sky(ctx,'#c184c4','#fdb09c');
    ell(ctx,203,49,34,34,'#ffde9b');
    for(const x of [181,198,213,227])line(ctx,[[x+3,55],[x,72]],'#fbb5a6',1);
    band(ctx,177,'#71628b');
    path(ctx,[0,150],[[21,164,32,197],[63,249,93,229],[144,229],[201,243,220,195],[236,168,256,156],
      [256,256],[0,256]],'#b18ca7','#534965',3);
    path(ctx,[0,163],[[21,175,31,207],[60,247,96,242],[151,241],[206,253,229,197],[241,180,256,170]],null,'#e7acc5',4);
    path(ctx,[0,194],[[15,197,27,229],[35,246,50,247]],null,TEAL,5);
    path(ctx,[204,242],[[227,229,237,210],[245,193,256,190]],null,TEAL,4);
    for(const c of [[28,138,TEAL], [226,150,PINK], [34,226,GOLD]]) star(ctx,c[0],c[1],10,4,c[2],CREAM,4);
    for(const x of [8,239]){
      line(ctx,[[x,165],[x,86],[x+12,82]],'#4f405d',3);
      ell(ctx,x+14,83,8,4,GOLD);
    }
  }],
  ['coral-lagoon','Coral Lagoon',ctx => {
    sky(ctx,'#a6e8ef','#fce0b2');
    ell(ctx,209,58,29,29,'#ffeec5');
    cloud(ctx,49,44,1.07,'#fff8ea');
    band(ctx,142,'#5bc5c3');
    hills(ctx,169,[[45,158,77,176],[114,194,150,175],[198,157,256,185]],'#89d6c4');
    hills(ctx,212,[[46,245,100,217],[152,191,204,224],[234,237,256,219]],'#f3cb9d');
    for (const [x,y,w] of [[17,183,28],[40,197,38],[190,186,52],[214,153,35],[6,149,29]]){
      path(ctx,[x,y],[[x+w*.45,y-3,x+w,y]],null,'#e9f7e0',2.8);
    }
    for(const [x,y,k] of [[18,229,.9],[229,233,1.08]]){
      path(ctx,[x,y],[[x+k*23,y-48,x+k*8,y-81]],null,'#a67572',5);
      for(const [dx,dy] of [[0,-23],[28,-16],[-20,-14],[23,12],[-19,12]])path(ctx,[x+k*8,y-81],[[x+k*(dx/2+7),y-90+k*dy,x+k*(dx+8),y-81+dy*k],[x+k*(dx+3),y-68+dy*k,x+k*8,y-81]],'#558f7c',null);
    }
  }],
  ['comet-meadow','Comet Meadow',ctx => {
    sky(ctx,'#4c477e','#da8f9e');
    scenicStars(ctx,415,35,'#ffedb5',0,130);
    path(ctx,[23,103],[[66,80,80,41],[126,12,153,16]],null,'#e7accb',5.8);
    path(ctx,[18,105],[[64,85,78,44],[130,15,151,18]],null,CREAM,2.6);
    star(ctx,152,18,13,6,CREAM,null,4);
    hills(ctx,185,[[42,125,91,165],[124,187,158,164],[217,127,256,161]],'#617883');
    hills(ctx,223,[[43,235,96,219],[171,192,256,201]],'#786a84');
    for(const [x,y,r] of [[14,218,5],[27,201,5],[46,224,3],[202,218,4],[221,205,6],[244,219,5]]){
      line(ctx,[[x,y],[x+2,y+19]],'#b5bc93',1.7);
      sparkle(ctx,x,y,r,GOLD);
    }
  }],
  ['ink-waves','Woodcut Waves',ctx => {
    sky(ctx,'#e5c9af','#c8adae');
    ell(ctx,205,69,38,38,CORAL);
    poly(ctx,[[0,139],[56,69],[113,154]],'#7b6880',null);
    poly(ctx,[[36,94],[56,69],[77,98],[61,92],[54,100],[48,93]],CREAM,null);
    for(const [i,c] of ['#476d83','#58859a','#4d788e','#3f627b'].entries()){
      const y=141+i*26;
      path(ctx,[0,y],[[31,y+12,42,y-31],[52,y-73,88,y-52],[121,y-35,92,y-15],[86,y-38,69,y-30],[62,y-18,97,y-9],
        [150,y+14,173,y-42],[196,y-62,207,y-26],[191,y-38,181,y-17],[223,y+10,256,y-16],[256,256],[0,256]],c,null);
      path(ctx,[0,y],[[31,y+12,42,y-31],[52,y-73,88,y-52],[121,y-35,92,y-15],[86,y-38,69,y-30]],null,CREAM,2.8);
    }
    for(const [x,y] of [[52,95],[221,137],[68,126],[191,166],[14,47]])ell(ctx,x,y,2,2,CREAM);
  }],
  ['storybook-forest','Storybook Forest',ctx => {
    sky(ctx,'#8ea6cf','#ebc5a8');
    ell(ctx,78,57,32,33,'#f2e8bd');
    for(const [x,y,s] of [[26,152,1.15],[55,168,.62],[224,151,1.16],[246,172,.9]])tree(ctx,x,y,s,'#5d8383','#926a78');
    hills(ctx,198,[[44,161,79,185],[150,167,193,188],[218,172,256,181]],'#7cad9e');
    hills(ctx,235,[[60,215,108,232],[191,207,256,218]],'#568d86');
    path(ctx,[93,256],[[155,231,150,211],[122,183,155,163],[171,149,178,143],[191,147],[160,173,164,190],
      [193,220,136,256],[93,256]],'#e8c4a6',null);
    for(const x of [18,38,215,241]){
      ellaLeaf(ctx,x,204+x%25,x%2?-1:1);
      sparkle(ctx,x,199-x%28,3,GOLD);
    }
    scatter(ctx,4,16,3,2,249,141,(g,x,y,r)=>ell(g,x,y,2*r,2*r,'#ffe9c2b0'));
  }],
  ['tangerine-desert','Tangerine Desert',ctx => {
    sky(ctx,'#b47baf','#f7b49f');
    ell(ctx,51,55,35,35,'#ffdb95');
    cloud(ctx,179,31,.7,'#ffd2a7');
    hills(ctx,176,[[38,168],[61,119],[98,108],[124,135],[165,143],[177,114],[216,105],[231,135],[256,141]],'#bd7489');
    hills(ctx,209,[[68,184,119,204],[185,173,256,191]],'#dc8d8e');
    hills(ctx,238,[[81,201,130,236],[190,211,256,227]],'#e7a18b');
    for(const [x,y,h] of [[19,231,55],[235,214,68],[215,248,38]]){
      path(ctx,[x,y],[[x,y-h]],null,'#4b8f87',9);
      path(ctx,[x,y-17],[[x-21,y-21,x-16,y-h*.69]],null,'#4b8f87',7);
      path(ctx,[x,y-29],[[x+16,y-28,x+13,y-h*.88]],null,'#4b8f87',7);
      line(ctx,[[x-2,y-h+4],[x-2,y-5]],'#a3c99f',1.8);
    }
  }],
  ['night-market','Night Market Lanterns',(ctx,t) => {
    sky(ctx,'#392853','#934d75');
    distantCity(ctx,240,'#593650',[[23,40],[20,70],[20,52],[24,65],[24,47],[23,66],[21,47],[18,57],[19,54],[18,63]],true);
    path(ctx,[0,29],[[98,67,256,22]],null,'#e49bb6',2.8);
    for(const [i,[x,y]] of [[18,42],[54,52],[94,61],[163,60],[200,50],[237,37]].entries()){
      const drift=Math.sin(t*2+i)*1.3;
      line(ctx,[[x,y-9],[x+drift,y+6]],'#ffce79',2);
      ell(ctx,x+drift,y+17,11,13,i%3?CORAL:GOLD,CREAM,1.5);
      path(ctx,[x+drift,y+5],[[x-9+drift,y+16,x+drift,y+30]],null,'#fff2bb',1.4);
      path(ctx,[x+drift,y+5],[[x+9+drift,y+16,x+drift,y+30]],null,'#fff2bb',1.4);
      for(const dx of [-3,0,3])line(ctx,[[x+dx+drift,y+29],[x+dx+drift,y+35]],GOLD,1.4);
    }
    band(ctx,243,'#372847');
  },true],
  ['bottle-ocean','Storm in a Bottle',ctx => {
    sky(ctx,'#7d719f','#c5b3bf');
    path(ctx,[9,239],[[0,224,6,59],[9,30,37,32],[219,32],[246,39,247,65],[253,204,245,235],[241,256,228,256],[30,256],[12,256,9,239]],'#6186a0','#e5d6db',6);
    hills(ctx,191,[[36,164,77,197],[109,204,149,178],[172,163,198,194],[225,202,256,188]],'#486f96');
    for(const [x,y,w] of [[14,204,55],[57,219,44],[184,221,54],[202,173,39],[16,164,45],[204,203,31]]){
      path(ctx,[x,y],[[x+w*.25,y-11,x+w*.54,y],[x+w*.82,y+7,x+w,y-1]],null,'#e2f0e6',3);
    }
    cloud(ctx,40,92,.55,'#57587f');cloud(ctx,223,86,.65,'#57587f');
    poly(ctx,[[25,105],[39,104],[30,118],[38,119],[20,137],[25,123],[18,124]],GOLD,null);
    poly(ctx,[[229,92],[243,92],[234,107],[240,107],[225,126],[229,112],[221,113]],GOLD,null);
    line(ctx,[[21,64],[21,124]],'#f2f5e8',4);
    line(ctx,[[237,128],[236,182]],'#f2f5e8',3);
  }],
  ['paper-optics','Kaleidoscope Paper',ctx => {
    ctx.fillStyle='#6b597d';ctx.fillRect(0,0,256,256);
    const colors=[PINK,PLUM,TEAL,GOLD,SKY,AMBER];
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      at(ctx,128,128,a,paint=>{
        poly(paint,[[0,0],[-56,-184],[0,-198],[55,-183]],colors[i%6],null);
        poly(paint,[[0,-18],[-25,-115],[0,-131],[28,-116]],'#f7e1e0',null);
        poly(paint,[[0,-73],[-17,-117],[0,-126],[17,-117]],colors[(i+3)%6],null);
        line(paint,[[0,-25],[0,-180]],'#6b597d',1.5);
      });
    }
    ell(ctx,128,128,79,79,'#7a5b91',CREAM,2);
    ell(ctx,128,128,68,68,'#a88bbc',null);
    for(const [x,y] of [[22,30],[232,21],[36,211],[238,224]])sparkle(ctx,x,y,8,CREAM);
  }],
  ['daybreak-mountains','Daybreak Mountains',ctx => {
    sky(ctx,'#6b83b7','#f5bfa6');
    ell(ctx,48,94,35,35,'#ffd698');
    cloud(ctx,177,43,.8,'#f4d4d7');
    for(const [fill,points] of [
      ['#8f7795',[[0,187],[64,73],[78,77],[103,106],[133,68],[154,60],[193,103],[210,90],[250,134],[256,153],[256,256],[0,256]]],
      ['#f1c9bc',[[43,110],[64,73],[78,77],[102,108],[84,99],[77,105],[64,91],[56,110]]],
      ['#f1c9bc',[[131,72],[153,60],[193,103],[176,98],[158,77],[151,88],[141,85]]],
      ['#6f7893',[[0,203],[49,134],[87,175],[132,132],[175,184],[223,112],[256,153],[256,256],[0,256]]],
      ['#e8c7c0',[[204,140],[223,112],[245,141],[233,135],[225,141],[218,130]]],
      ['#587585',[[0,220],[61,207],[111,238],[167,204],[224,218],[256,194],[256,256],[0,256]]]
    ])poly(ctx,points,fill,null);
    for(const [x,y,s] of [[21,222,.58],[42,238,.8],[226,240,.7],[246,226,.57]])tree(ctx,x,y,s,'#437586','#666a83');
  }],
  ['pixel-picnic','Pixel Picnic',ctx => {
    sky(ctx,'#8ccbe1','#efdda3');
    for(const [x,y,w] of [[14,41,43],[68,67,41],[202,38,44]]){
      ctx.fillStyle='#fff6df';
      ctx.fillRect(x,y+8,w,12);
      ctx.fillRect(x+7,y,w-20,11);
      ctx.fillRect(x+12,y-7,w-26,8);
    }
    band(ctx,153,'#76b886');
    for (let i=0;i<22;i++){
      const x=(i*67)%248,y=152+(i*31)%104;
      ctx.fillStyle=i%4===2?'#a8ca77':'#5fa38a';
      ctx.fillRect(x,y,7+i%3*2,4);
    }
    const left=3,right=253,top=183,lower=251;
    for(let row=0;row<5;row++)for(let col=0;col<11;col++){
      const y=top+row*(lower-top)/5;
      const w=(right-left)/11;
      ctx.fillStyle=(row+col)%2?CREAM:'#d57688';
      ctx.fillRect(left+w*col,y,w+1,(lower-top)/5+1);
    }
    for(const [x,y] of [[19,161],[43,176],[228,166],[240,218]]){
      round(ctx,x,y-1,5,12,0,LEAF,null);
      round(ctx,x-5,y-5,14,6,0,CREAM,null);
      round(ctx,x,y-9,5,14,0,CREAM,null);
      round(ctx,x,y-4,5,5,0,GOLD,null);
    }
  }],
  ['starlit-train','Starlit Night Train',ctx => {
    sky(ctx,'#393259','#8e627d');
    scenicStars(ctx,922,40,'#ffdfa1',0,148);
    ell(ctx,216,57,22,22,'#e4b888');
    for(const [x,y,r] of [[18,129,21],[44,100,19],[69,86,16]])ell(ctx,x,y,r,r*.77,'#d1a5ad93');
    hills(ctx,169,[[82,132,122,161],[180,123,256,167]],'#5f647e');
    band(ctx,218,'#554962');
    line(ctx,[[0,221],[256,221]],'#d19c95',3.5);
    line(ctx,[[0,230],[256,230]],'#a782a5',2.2);
    for(const [i,x] of [6,59,114,170,225].entries()){
      if(!i){
        round(ctx,x+5,164,39,43,6,'#7a4d6a',INK,2);
        round(ctx,x+8,154,17,15,3,'#7a4d6a',INK,2);
        round(ctx,x+6,152,21,5,2,AMBER,INK,1.7);
        round(ctx,x+23,171,14,15,4,GOLD,INK,1.2);
        glint(ctx,x+42,177,8,CREAM);
      }else{
        round(ctx,x,165,49,42,6,'#63567f',INK,2);
        round(ctx,x-2,163,54,6,1,'#92809c',INK,1.4);
        for(const k of [6,20,34])round(ctx,x+k,173,9,11,2,GOLD,INK,1);
      }
      for(const k of [12,33])ell(ctx,x+k,208,8,9,'#323149','#a782a3',2.2);
      line(ctx,[[x+3,191],[x+45,191]],AMBER,1.8);
    }
  }]
];

function ellaLeaf(ctx,x,y,dir) {
  path(ctx,[x,y+16],[[x+dir*4,y+7,x+dir,y],[x+dir*19,y-4,x+dir*14,y+5],[x+dir*8,y+12,x,y+16]],'#a0bd9f',null);
}

function auraGradient(ctx, x, y, width, stops) {
  const gradient=ctx.createLinearGradient(x,y,x+width,y);
  for(const [at,color] of stops) gradient.addColorStop(at,color);
  return gradient;
}

function orbit(ctx, x, y, rx, ry, offset, color, width, trim = [0.04,.96]) {
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,offset,Math.PI*2*trim[0],Math.PI*2*trim[1]);
  finish(ctx,null,color,width);
}

const effects = [
  ['aurora-halo','Aurora Halo',(ctx,t) => {
    const wave=Math.sin(t*2)*3;
    const ribbons = [['#86f3d885',9],['#ab99f6a0',0],['#f699df9e',-8]];
    for(const [color,offset] of ribbons){
      path(ctx,[41,64+offset],[[58,23-wave+offset,88,43+offset],
        [115,6+wave+offset,140,20+offset],[166,21-wave+offset,182,7+offset],
        [212,26+offset,217,59+offset],[186,25+offset,166,29+offset],[151,36+offset,121,27+offset],
        [90,39+offset,85,55+offset],[41,64+offset]],color,null);
    }
    for(const [x,y,r,c] of [[37,55,8,SKY],[79,28,5,CREAM],[125,11,8,CREAM],[182,16,6,PINK],[221,47,8,SKY]]){
      sparkle(ctx,x,y+Math.sin(t*3+x)*1.7,r,c);
    }
  },true,true],
  ['lightning-aura','Lightning Aura',(ctx,t) => {
    const tremor=Math.sin(t*12)*2;
    const branches = [
      [[4,116],[19,91],[23,98],[42,61],[39,89],[51,87],[29,128],[23,113],[10,145]],
      [[250,56],[238,91],[245,87],[231,113],[236,115],[211,151]],
      [[19,170],[28,164],[20,191],[28,184],[11,219]],
      [[254,161],[240,174],[247,178],[231,195],[232,205],[223,219]]
    ];
    for(const points of branches){
      const posed=points.map(([x,y],i)=>[x+(i%2?tremor:0),y]);
      line(ctx,posed,'#9b86f49c',9);
      line(ctx,posed,SKY,4.7);
      line(ctx,posed,CREAM,1.8);
    }
    for(const [x,y,r] of [[39,49,5],[21,136,6],[239,147,5],[224,213,5],[15,228,5]])sparkle(ctx,x,y,r,LILAC);
  },true],
  ['rainbow-flames','Rainbow Flames',(ctx,t) => {
    const delta=Math.sin(t*4.9)*3;
    for(const [x,side] of [[0,1],[256,-1]]){
      at(ctx,x,255,0,paint=>{
        paint.scale(side,1);
        path(paint,[0,0],[[0,-123],[16,-107,23,-148+delta],[35,-120,24,-93],[31,-74,44,-98-delta],
          [65,-73,50,-51],[58,-53,63,-66],[73,-32,59,-12],[60,0],[0,0]],'#ac79e8',null);
        path(paint,[0,0],[[0,-100],[11,-73,20,-119],[32,-88,14,-54],[28,-50,40,-76],[44,-55,41,-39],
          [49,-45,52,-54],[67,-28,53,0],[0,0]],'#f379b5',null);
        path(paint,[0,0],[[0,-65],[14,-43,15,-87],[25,-71,20,-39],[26,-24,38,-61],[51,-41,46,-15],
          [50,-22,53,-34],[58,-10,48,0],[0,0]],'#fda282',null);
        path(paint,[1,0],[[2,-39],[11,-23,17,-58],[25,-41,21,-13],[34,-13,38,-44],[45,-24,37,0],[1,0]],GOLD,null);
        path(paint,[3,0],[[8,-20],[14,-12,20,-31],[28,-20,26,0],[3,0]],CREAM,null);
        sparkle(paint,14,-123,6,SKY);
        sparkle(paint,44,-115+delta,5,GOLD);
        sparkle(paint,47,-92,4,CREAM);
      });
    }
  },true,true],
  ['victory-wings','Golden Victory Wings',(ctx,t) => {
    const flutter=Math.sin(t*2.7)*.04;
    for(const side of [-1,1]){
      ctx.save();ctx.translate(128,184);ctx.scale(side,1);ctx.rotate(flutter);
      path(ctx,[12,44],[[19,-5,38,-38],[60,-67,104,-88],[110,-79,107,-66],[124,-74,127,-65],
        [121,-52,113,-46],[130,-54,126,-42],[122,-27,109,-23],[126,-29,125,-18],[118,-6,100,-2],
        [110,-3,113,1],[112,17,93,16],[100,22,89,31],[56,58,22,57],[12,44]],GOLD,INK,3);
      path(ctx,[27,43],[[54,-10,105,-61],[108,-66,106,-71],[85,-64,74,-53],
        [60,-39,46,-30],[31,14,27,43]],AMBER,null);
      for(const [x,y] of [[107,-67],[113,-47],[108,-26],[99,-3],[93,15],[79,33]]){
        path(ctx,[32,47],[[61,22,x-23,y+29],[x-11,y+16,x,y]],null,CREAM,2.25);
      }
      sparkle(ctx,112,-90,7,CREAM);sparkle(ctx,119,-4,5,CREAM);
      ctx.restore();
    }
  },true,true],
  ['floating-runes','Floating Runes',(ctx,t) => {
    const angles=[-.92,-.58,-.24,.16,.5,.84].map(v=>v*Math.PI);
    const runes=[
      [[0,9],[0,-9],[6,-4],[0,0],[7,8]],
      [[-5,9],[0,-9],[6,8],[0,3],[-5,9]],
      [[0,-9],[0,9],[0,1],[6,-4],[-6,-4],[0,1]],
      [[-5,-7],[0,-1],[6,-7],[0,-1],[0,8]],
      [[-5,-8],[4,-2],[-3,2],[4,8]],
      [[-5,8],[-5,-9],[1,-4],[6,-9],[6,8]]
    ];
    for(const [i,base] of angles.entries()){
      const move=Math.sin(t*1.5+i)*.055;
      const x=128+108*Math.cos(base+move),y=124+105*Math.sin(base+move);
      ell(ctx,x,y,12,13,'#432653a6','#f1be8f',1.8);
      line(ctx,runes[i].map(([a,b])=>[x+a,y+b]),i%2?SKY:GOLD,2.25);
      ell(ctx,x-3,y-13,1.1,1.4,CREAM);
    }
  },true],
  ['celestial-armor','Celestial Armor',(ctx,t) => {
    const blue='#647bbb';
    for(const dir of [-1,1]){
      at(ctx,128,224,0,paint=>{
        paint.scale(dir,1);
        path(paint,[14,30],[[15,0,29,-17],[54,-30,77,-27],[106,-26,109,-11],[105,9,92,30],[14,30]],blue);
        path(paint,[21,30],[[31,3,41,-10],[65,-23,80,-20],[96,-20,99,-11],[92,3,84,7],[65,0,50,14],[45,21,43,31],[21,30]],SKY,INK,2.2);
        path(paint,[85,-9],[[75,-10,61,-2],[51,5,46,17]],null,CREAM,3.2);
        path(paint,[82,6],[[90,10,95,9],[91,20,85,29],[65,29],[65,23,69,15]],PLUM,INK,2);
        glint(paint,69,-8,4.3+Math.sin(t*3)*.8,CREAM);
      });
    }
    poly(ctx,[[82,236],[99,228],[116,238],[128,234],[140,238],[157,228],[174,236],[170,255],[85,255]],PLUM);
    star(ctx,128,242,13,6,GOLD,INK,4);
    ell(ctx,128,241,3,3,CREAM);
  },true],
  ['comet-trail','Comet Trail',(ctx,t) => {
    const spread=Math.sin(t*2)*3;
    const gradient=auraGradient(ctx,0,0,256,[[0,'#7fdaf500'],[.35,'#7fdaf5bd'],[.65,'#edb0ee90'],[1,'#fff2bdaa']]);
    path(ctx,[3,175],[[39,180,132,30],[153,11,206,23],[230,26,248,9+spread]],null,gradient,12);
    path(ctx,[0,207],[[46,177,99,78],[156,15,223,26],[235,24,248,11+spread]],null,SKY,2.6);
    path(ctx,[0,221],[[37,198,60,160],[114,79,150,43],[183,18,209,30],[241,23,246,12+spread]],null,PINK,2.3);
    for(const [x,y,r,c] of [[247,13,9,CREAM],[231,31,5,CREAM],[14,170,5,SKY],[36,177,4,GOLD],[165,32,4,PINK],[42,111,4,CREAM]]){
      sparkle(ctx,x,y,r,c);
    }
  },true,true],
  ['rose-petals','Rose Petal Drift',(ctx,t) => {
    for(const [i,[x,y,r]] of [[22,58,12],[49,85,8],[18,138,8],[45,161,11],[230,69,12],[244,119,9],[203,158,10],[237,204,11],[24,225,7]].entries()){
      at(ctx,x+Math.sin(t*2+i)*2,y+Math.cos(t*1.5+i)*2,(i%2?-.45:.65)+Math.sin(t*2+i)*.09,paint=>{
        path(paint,[0,r],[[-r*.85,r*.35,-r,-r*.29],[-r*.75,-r,0,-r*.84],
          [r*.81,-r,r,-r*.27],[r*.72,r*.52,0,r]],i%3===2?CORAL:PINK,INK,1.6);
        path(paint,[-r*.6,-r*.36],[[-r*.35,.72*r,.05*r,.84*r]],null,CREAM,1.25);
      });
    }
  },true],
  ['rainbow-prism','Rainbow Prism',(ctx,t) => {
    const wave=Math.sin(t*1.7)*4;
    const colors=['#f38fb4','#f4a578','#ffda78','#99e692','#7be1e4','#ad9ff7'];
    for(const side of [-1,1]){
      ctx.save();ctx.translate(128,128);ctx.scale(side,1);
      colors.forEach((color,i)=>{
        poly(ctx,[[74,-24],[117,-104+i*5+wave],[129,-85+i*5+wave],[77,-20]],color,null);
        poly(ctx,[[87,70],[128,84+i*6],[130,102+i*5],[92,75]],color,null);
      });
      poly(ctx,[[82,-27],[98,-47],[112,-27],[98,-7]],'#779fe6',INK,1.9);
      poly(ctx,[[82,-27],[98,-47],[94,-26],[98,-7]],CREAM,null);
      poly(ctx,[[94,-26],[112,-27],[98,-7]],PINK,null);
      ell(ctx,98,-27,4,3,CREAM);
      sparkle(ctx,106,-48,7,CREAM);
      sparkle(ctx,118,48,6,GOLD);
      ctx.restore();
    }
  },true,true],
  ['falling-starlight','Falling Starlight',(ctx,t) => {
    const stars=[
      [13,52,8,SKY],[31,18,6,GOLD],[57,34,4,CREAM],[222,31,7,SKY],[241,65,8,CREAM],[205,55,6,PINK],
      [28,109,5,CREAM],[16,174,8,GOLD],[38,207,6,SKY],[222,191,6,CREAM],[238,143,9,GOLD],[236,220,5,PINK]
    ];
    for(const [i,[x,y,r,color]] of stars.entries()){
      const size=r*(.94+.14*Math.sin(t*4+i));
      const fall=4*Math.sin(t*2+i*.7);
      path(ctx,[x-8,y-15+fall],[[x-2,y-10+fall,x,y+fall]],null,'#fff3b268',2);
      star(ctx,x,y+fall,size,size*.42,color,null,i%2?4:5);
      ell(ctx,x+size*.7,y-7+fall,1.3,1.3,CREAM);
    }
  },true],
  ['firefly-orbit','Firefly Orbit',(ctx,t) => {
    for(let i=0;i<12;i++){
      const phase=i*Math.PI/6+t*.45;
      const wobble=Math.sin(i+t*2.3)*.65+.8;
      const x=128+115*Math.cos(phase), y=124+106*Math.sin(phase);
      const light=ctx.createRadialGradient(x,y,1,x,y,9+3*wobble);
      light.addColorStop(0,'#fff29bdc');light.addColorStop(.48,'#ffe26b60');
      light.addColorStop(1,'#ffe26b00');
      ell(ctx,x,y,12,12,light);
      ell(ctx,x,y,3.3,2.65,i%3?GOLD:GREEN,INK,1.3);
      ell(ctx,x-2.4,y-3.3,2.4,1.4,CREAM,null,0,-.36);
      ell(ctx,x+2.4,y-3.3,2.4,1.4,CREAM,null,0,.36);
    }
  },true],
  ['enchanted-confetti','Enchanted Confetti',(ctx,t) => {
    scatter(ctx,8881,44,2,1,248,253,(paint,x,y,r,i)=>{
      if(x>55&&x<200&&y>54&&y<195) return;
      const colors=[CREAM,PINK,SKY,GOLD,LILAC,TEAL];
      const yOffset=Math.sin(t*2.8+i)*3.6;
      const xOffset=Math.cos(t*2.8+i*.5)*1.6;
      const color=colors[i%colors.length];
      at(paint,x+xOffset,y+yOffset,Math.sin(i*.21+t*.5)*.6,g=>{
        if(i%5===0)star(g,0,0,7*r,2.9*r,color,INK,4);
        else if(i%3===0)poly(g,[[-4*r,-6*r],[5*r,-2*r],[3*r,5*r],[-5*r,3*r]],color,INK,1.05);
        else path(g,[-4*r,0],[[0,-5*r,5*r,-2*r],[2*r,2*r,-2*r,4*r]],null,color,2.1);
      });
    });
  },true],
  ['frozen-halo','Frozen Halo',(ctx,t) => {
    const icy='#9febf3';
    orbit(ctx,128,121,110,100, -.24,'#a5e6f569',5,[.02,.91]);
    orbit(ctx,128,121,113,103, -.24,'#e9fdffbc',1.6,[.02,.91]);
    for(const [i,a] of [-2.5,-1.9,-1.35,-.81,-.27,.24,.91,1.72,2.58].entries()){
      const x=128+110*Math.cos(a),y=121+100*Math.sin(a);
      at(ctx,x,y,t*.12+(i%6)*.18,paint=>{
        const length=i%3?9:13;
        for(let ray=0;ray<6;ray++){
          const angle=ray*Math.PI/3;
          paint.save();paint.rotate(angle);
          line(paint,[[0,0],[0,-length]],CREAM,1.55);
          line(paint,[[-3.8,-length*.68],[0,-length*.44],[3.8,-length*.68]],icy,1.45);
          paint.restore();
        }
        ell(paint,0,0,2.1,2.1,SKY);
      });
    }
  },true,true],
  ['orbiting-hearts','Orbiting Hearts',(ctx,t) => {
    orbit(ctx,128,110,108,79,-.31,'#faa7cb67',2,[.15,.95]);
    for (const [index,a] of [-2.9,-2.25,-1.66,-1,-.26,.39,2.11,2.62].entries()){
      const phase=a+.055*Math.sin(index+t*2.2);
      const x=128+111*Math.cos(phase),y=112+76*Math.sin(phase)-19*Math.cos(phase);
      at(ctx,x,y,index%2?-.22:.44,paint=>{
        const r=10+2.2*Math.sin(index+t*3);
        path(paint,[0,r],[[-r,-.2*r,-r,-.61*r],[-.8*r,-1.33*r,0,-.56*r],
          [.74*r,-1.41*r,r,-.69*r],[r,-.08*r,0,r]],index%2?PINK:CORAL,INK,1.5);
        path(paint,[-r*.6,-r*.62],[[-r*.47,-r*.97,-r*.22,-r*.69]],null,CREAM,1.4);
      });
    }
  },true],
  ['ribbon-dance','Ribbon Dance',(ctx,t) => {
    const colors=[SKY,LILAC,PINK,AMBER];
    for(const dir of [-1,1]){
      at(ctx,128,128,0,paint=>{
        paint.scale(dir,1);
        for(let i=0;i<4;i++){
          const wave=Math.sin(t*2.6+i)*6;
          path(paint,[128,91+i*5],[[89,90+i*4,88,44+wave],[89,13,108,32+wave],[118,51,101,51],
            [74,48,87,14],[94,-6,114,-22+wave],[135,-43,109,-71+wave],[84,-81,78,-99+i*3]],null,colors[i],5.5);
        }
        for(const [x,y,r] of [[85,-104,6],[104,-82,4],[115,-51,5],[91,9,4],[120,65,6]])sparkle(paint,x,y,r,CREAM);
      });
    }
  },true,true]
];

function shoulder(slot,[id,name,paint,animated = false]) {
  const position = slot === 'prop' ? [44,196] : [209,196];
  return Object.freeze({
    id,name,slot,animated,
    draw(ctx,t = 0) {
      at(ctx,position[0],position[1],0,canvas=>paint(canvas,t));
    }
  });
}

function scene(slot,[id,name,paint,animated = false,behind = false]) {
  return Object.freeze({
    id,name,slot,animated,behind,
    draw(ctx,t = 0) {
      ctx.save();
      paint(ctx,t);
      ctx.restore();
    }
  });
}

export const WORLDS = Object.freeze([
  ...props.map(item=>shoulder('prop',item)),
  ...companions.map(item=>shoulder('companion',item)),
  ...backgrounds.map(item=>scene('background',item)),
  ...effects.map(item=>scene('effect',item)),
  ...PET_ART.map(item=>shoulder('companion',item))
]);
