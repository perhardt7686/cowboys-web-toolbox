// Original, layered vector artwork in the studio's 256×256 portrait space.
// Each silhouette is drawn directly with Canvas rather than a font or sticker.
const INK = '#302038';
const CREAM = '#fff6dd';
const GOLD = '#f6bf53';
const MINT = '#97eac2';
const CYAN = '#74d9f5';
const VIOLET = '#8359cc';
const CORAL = '#ee786f';
const ROSE = '#e86eab';
const RED = '#d55465';

function fillStroke(ctx, fill, stroke, width) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

// Point arrays of length 2 draw lines, 4 draw conics, and 6 draw cubics.
function path(ctx, fill, points, stroke = INK, width = 3, close = true) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) {
    if (point.length === 6) ctx.bezierCurveTo(...point);
    else if (point.length === 4) ctx.quadraticCurveTo(...point);
    else ctx.lineTo(...point);
  }
  if (close) ctx.closePath();
  fillStroke(ctx, fill, stroke, width);
}

function line(ctx, color, width, ...points) {
  path(ctx, null, points, color, width, false);
}

function oval(ctx, x, y, rx, ry, fill, stroke = INK, width = 3, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  fillStroke(ctx, fill, stroke, width);
}

function dot(ctx, x, y, radius, color) {
  oval(ctx, x, y, radius, radius, color, null);
}

function box(ctx, x, y, width, height, radius, fill, stroke = INK, weight = 3) {
  const r = Math.min(radius, width / 2, height / 2);
  path(ctx, fill, [[x+r,y],[x+width-r,y],[x+width,y,x+width,y+r],
    [x+width,y+height-r],[x+width,y+height,x+width-r,y+height],
    [x+r,y+height],[x,y+height,x,y+height-r],[x,y+r],[x,y,x+r,y]],
  stroke, weight);
}

function star(ctx, x, y, radius, fill, stroke = null, points = 5, tilt = -Math.PI / 2) {
  const vertices = Array.from({length: points * 2}, (_, index) => {
    const angle = tilt + index * Math.PI / points;
    const size = index % 2 ? radius * .45 : radius;
    return [x + Math.cos(angle) * size, y + Math.sin(angle) * size];
  });
  path(ctx, fill, vertices, stroke, 2);
}

function heart(ctx, x, y, size, fill, stroke = INK) {
  path(ctx, fill, [[x,y+size],[x-size*1.25,y+size*.1,x-size*1.12,y-size*.88,x-size*.57,y-size*.83],
    [x-size*.26,y-size*.83,x,y-size*.58],[x+size*.28,y-size*.93,x+size*1.03,y-size*.95,x+size*1.02,y-size*.28],
    [x+size*.93,y+size*.12,x,y+size]],stroke,2.5);
}

function flame(ctx, x, y, height, width, fill, core = GOLD) {
  path(ctx, fill, [[x-width,y],[x-width-1,y-height*.33,x-width*.35,y-height*.45],
    [x-width*.45,y-height*.78,x+width*.23,y-height],
    [x+width*.06,y-height*.57,x+width*.72,y-height*.61],
    [x+width*.78,y-height*.37,x+width,y-height*.26,x+width,y],
    [x,y+height*.32,x-width,y]], INK, 2.4);
  if (core) path(ctx, core, [[x-width*.5,y],[x-width*.25,y-height*.25,x+width*.07,y-height*.49],
    [x+width*.17,y-height*.22,x+width*.59,y],[x,y+height*.13,x-width*.5,y]], null);
}

function gem(ctx, x, y, width, height, fill, light = CREAM, stroke = INK) {
  path(ctx, fill, [[x,y-height],[x+width,y-height*.28],[x+width*.59,y+height*.57],[x,y+height],
    [x-width*.63,y+height*.57],[x-width,y-height*.28]],stroke,2);
  path(ctx, light, [[x,y-height+2],[x+width*.55,y-height*.17],[x-1,y+height*.42],[x-width*.61,y-height*.18]],null);
  line(ctx, stroke || fill, 1.15, [x-width*.8,y-height*.26],[x+width*.78,y-height*.26]);
}

function ribbon(ctx, fill, x = 65, y = 63, width = 126, bend = 8) {
  path(ctx, fill, [[x,y],[x+width*.5,y+bend,x+width,y],
    [x+width-3,y+10],[x+width*.5,y+bend+12,x+3,y+10]],INK,2.6);
}

function lensBridge(ctx, fill = INK, height = 120, span = 22, width = 5) {
  line(ctx, fill, width, [128-span/2,height+3],[128,height-8,128+span/2,height+3]);
}

function translated(ctx, x, y, paint) {
  ctx.save();
  ctx.translate(x,y);
  paint();
  ctx.restore();
}

function reflected(ctx, x, y, flip, paint) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(flip,1);
  paint();
  ctx.restore();
}

const makeItems = (slot, entries) => entries.map(([id, name, paint, tags = []]) => Object.freeze({
  id, name, slot, tags:Object.freeze(tags),
  draw(ctx, seconds = 0) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    try {
      paint(ctx, Number.isFinite(seconds) ? seconds : 0);
    } finally {
      ctx.restore();
    }
  }
}));

const hats = makeItems('hat', [
  ['dragon-crown','Dragon Crown',ctx => {
    path(ctx,'#733843',[[54,65],[52,47,55,35,66,24],[61,44,75,40,86,51],
      [87,33,99,25,113,26],[101,36,116,45,128,48],[148,45,159,31,153,17],
      [178,23,171,43,176,49],[188,44,198,42,200,28],[209,45,204,61,196,68],
      [155,86,97,83,54,65]]);
    path(ctx,'#ce744a',[[57,60],[70,59],[59,40,70,44,78,47],[91,55,96,39,103,31],
      [98,52,120,47,128,57],[149,49,166,42,159,23],[176,32,164,48,180,56],
      [186,48,194,47,199,41],[198,56,192,61,190,64],[140,80,100,77,57,60]],null);
    path(ctx,'#e4a86e',[[63,55],[58,45],[75,48],[85,54],[81,60]],null);
    path(ctx,'#eeb777',[[143,51],[163,41,163,32,162,28],[170,37,164,47,158,54]],null);
    ribbon(ctx,'#b77234',56,61,138,10);
    line(ctx,'#f7c77b',3.1,[61,62],[132,84,191,63]);
    for(const x of [68,83,101,152,174,187]) {
      const y=70+Math.max(0,7-Math.abs(x-124)/9);
      gem(ctx,x,y,3.3,3.6,'#924e4e','#f0ca7a');
    }
    path(ctx,'#5a2b42',[[108,60],[124,46],[145,56],[146,68],[126,84],[107,73]]);
    gem(ctx,126,64,13,15,'#bd575a','#f4b282','#4b2539');
    star(ctx,121,59,5,CREAM,null,4);
  },['dragon','royal']],
  ['giant-taco-hat','Giant Taco Hat',ctx => {
    path(ctx,'#e6ad41',[[48,64],[42,52],[63,28,85,18,119,13],[150,6,198,24,207,50],
      [208,58,194,67,177,64],[127,77,48,64]]);
    path(ctx,'#4c9f59',[[54,51],[72,36],[72,43],[86,23],[99,30],[113,22],[130,29],
      [147,17],[153,32],[174,27],[179,40],[200,45],[198,55]],null);
    path(ctx,'#f3c858',[[47,56],[76,40,97,29,129,30],[161,27,188,39,201,56],[175,68,65,74,47,56]]);
    for (const [x,y,r] of [[72,46,4],[97,40,5],[124,34,4],[154,39,4],[179,46,4],[189,50,4]]) dot(ctx,x,y,r,RED);
    for (const [x,y] of [[63,57],[82,60],[100,59],[123,53],[145,56],[171,58]]) dot(ctx,x,y,1.4,'#9b632f');
    line(ctx,'#ffe595',3,[62,55],[118,40,162,42],[190,55]);
  },['food','funny']],
  ['rubber-chicken-helmet','Rubber Chicken Helmet',ctx => {
    path(ctx,'#efb848',[[60,64],[54,49,65,32,91,33],[111,24,128,28,144,29],
      [156,29,173,43,184,49],[203,55],[193,70],[151,74,102,78,60,64]]);
    path(ctx,'#f5c45b',[[157,60],[154,42],[178,37],[180,11,197,5,203,22],[207,38,196,51,187,52],[173,68]]);
    path(ctx,RED,[[183,18],[178,9],[183,3,188,8],[191,1,196,10],[202,4,203,14]]);
    path(ctx,'#f0a943',[[202,25],[226,31],[202,40]]);
    dot(ctx,195,24,3,INK);
    dot(ctx,196,23,1,CREAM);
    path(ctx,'#fff0ad',[[74,45],[107,36,131,40],[125,53,92,61],[82,57,74,45]],'#b4773b',2);
    line(ctx,'#b4773b',2.5,[137,72],[145,80],[157,80]);
  },['animal','funny']],
  ['viking-battle-helmet','Viking Battle Helmet',ctx => {
    path(ctx,CREAM,[[86,51],[65,45,53,44,46,28],[34,19,45,4,53,14],[54,27,70,28,87,31]]);
    path(ctx,CREAM,[[168,52],[188,46,202,43,210,27],[220,16,210,4,203,16],[199,28,187,27,168,31]]);
    path(ctx,'#748a9b',[[65,67],[64,44,90,15,127,14],[166,12,187,42,191,66],[128,84,65,67]]);
    path(ctx,'#b3d2d6',[[75,57],[96,28,115,26,127,27],[161,27,165,36,177,53],[131,65,75,57]],null);
    ribbon(ctx,'#caa35c',64,59,128);
    box(ctx,121,19,14,58,4,'#d6bf78',INK,2.4);
    for (const x of [78,97,116,141,160,179]) dot(ctx,x,x>103&&x<155?70:66,2.5,INK);
    gem(ctx,128,50,5,8,'#398991','#a7f5e0',INK);
  },['history','norse']],
  ['golden-crocodile-crown','Golden Crocodile Crown',ctx => {
    path(ctx,'#b8783b',[[52,64],[45,53,49,43,56,46],[79,53],[86,38],[102,49],[117,29],[130,46],
      [157,30],[161,48],[180,43],[204,34],[196,68],[130,85,68,80,52,64]]);
    path(ctx,'#f2bb62',[[50,57],[78,62],[89,49],[103,55],[118,42],[128,56],[156,41],
      [161,56],[181,49],[198,43],[189,62],[132,75,78,76,50,57]],null);
    path(ctx,'#3b705a',[[63,50],[64,42,73,40,81,43],[91,33,110,33,119,37],
      [128,25,147,29,153,40],[165,40,188,39,196,47],[194,58,174,62,148,62],
      [129,61,116,58,100,55],[91,63,71,62,63,50]]);
    path(ctx,'#77b082',[[70,47],[92,40,118,42],[126,31,143,35,149,41],
      [156,44,185,40,191,47],[180,52,142,53,131,50],[123,48,100,48,70,47]],null);
    line(ctx,'#2f503f',2.4,[136,52],[169,58,190,50]);
    for(const x of [146,157,167,178]) path(ctx,CREAM,[[x,53],[x+5,53],[x+2,57]],null);
    oval(ctx,134,40,4,4.3,'#f3c065','#2d2836',1.7);
    line(ctx,'#2d2836',1.3,[135,37],[134,43]);
    oval(ctx,183,46,2.2,1.4,'#2f503f',null);
    ribbon(ctx,'#e9b960',58,64,134);
    line(ctx,'#ffdc90',2.4,[61,65],[123,81,190,66]);
    for(const x of [71,95,125,154,179]) gem(ctx,x,75-Math.abs(x-125)/14,5.5,5.5,'#3a9576','#d7f5bf');
  },['animal','royal']],
  ['alien-antenna-helmet','Alien Antenna Helmet',ctx => {
    line(ctx,INK,6,[92,42],[82,26,77,14]);
    line(ctx,INK,6,[164,42],[179,25,182,13]);
    oval(ctx,76,11,8,8,MINT);
    oval(ctx,184,11,8,8,ROSE);
    path(ctx,'#d6ef71',[[62,65],[65,45,82,23,124,24],[162,24,191,38,195,63],
      [153,78,102,82,62,65]]);
    oval(ctx,128,51,44,17,'#514d8b');
    for (const x of [107,127,147]) {
      oval(ctx,x,50,6,7,'#a5ffe1',null);
      dot(ctx,x+1,50,2,INK);
    }
    line(ctx,CREAM,3,[77,49],[85,39,101,35]);
    for (const x of [67,187]) box(ctx,x-5,57,10,11,3,'#ad8adb');
  },['space','funny']],
  ['flaming-cowboy-hat','Flaming Cowboy Hat',ctx => {
    for (const [x,y,h,w] of [[75,56,24,10],[94,47,31,11],[123,48,37,13],[151,47,36,11],[177,54,27,10]]) flame(ctx,x,y,h,w,'#e95c59','#ffe475');
    path(ctx,'#793b36',[[65,53],[47,63,43,54],[31,75,63,77],[127,86,201,73],[228,66,219,52],
      [205,61,189,55],[145,66,65,53]]);
    path(ctx,'#ab543b',[[70,61],[81,43,85,28,94,32],[118,46,135,44,157,29],[170,19,176,46,184,60],
      [129,75,70,61]]);
    ribbon(ctx,'#432537',72,54,112);
    star(ctx,129,63,9,GOLD,INK);
    line(ctx,'#ffdba6',2.5,[49,69],[112,78,169,70],[203,62]);
  },['western','fire']],
  ['disco-ball-helmet','Disco Ball Helmet',ctx => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(128,51,55,38,0,0,Math.PI*2);
    ctx.clip();
    for (let y=14;y<91;y+=9) for (let x=72;x<187;x+=11) {
      const palette = ['#edefff','#a4c9e8','#bb9aea','#7779ba','#d589bd','#f8d6a4','#8ecfc4'];
      const index = ((x - 72) / 11 + (y - 14) / 9 * 3) % palette.length;
      box(ctx,x,y,10,8,1,palette[index],null);
    }
    ctx.restore();
    oval(ctx,128,51,55,38,null,INK,3.5);
    ribbon(ctx,'#66548c',72,70,112,6);
    for (const [x,y,r] of [[78,24,11],[165,41,16],[135,14,6],[204,33,9],[57,49,7]]) star(ctx,x,y,r,CREAM,null,4);
  },['party','shiny']],
  ['pizza-crown','Pizza Crown',ctx => {
    path(ctx,'#bd793e',[[58,60],[69,54],[74,25],[95,45],[126,13],[148,44],[181,25],[186,57],
      [198,61],[183,73],[74,73]]);
    path(ctx,'#ffdb72',[[65,61],[78,25],[100,52],[126,13],[151,53],[180,25],[192,64],
      [128,74,65,61]],'#b1713d',2.6);
    for (const [x,y,r] of [[79,46,5],[103,54,4],[122,34,6],[133,49,5],[165,54,5],[179,43,4],[112,61,5]]) {
      dot(ctx,x,y,r,'#c44658');
      dot(ctx,x-1,y-1,1.2,'#f9a18a');
    }
    ribbon(ctx,'#c08248',64,62,130);
    line(ctx,'#f9b664',2.5,[70,65],[125,77,187,66]);
  },['food','royal']],
  ['mushroom-wizard-hat','Mushroom Wizard Hat',ctx => {
    path(ctx,'#756a9f',[[98,66],[103,37],[150,35],[166,70],[127,82,98,66]]);
    path(ctx,'#bc4377',[[51,50],[51,39,69,31,77,27],[106,3,155,6,183,30],
      [212,38,210,56,183,60],[128,67,79,65,51,50]]);
    path(ctx,'#e975a2',[[63,43],[92,7,151,10,180,29],[136,25,97,34,63,43]],null);
    for (const [x,y,rx,ry] of [[84,35,10,5],[119,20,11,7],[157,30,13,7],[189,44,8,5]]) oval(ctx,x,y,rx,ry,CREAM,null);
    ribbon(ctx,'#4d3060',99,61,60,7);
    star(ctx,128,65,9,GOLD,INK);
    line(ctx,'#e9c8f9',2,[70,49],[126,58,186,51]);
  },['magic','garden']],
  ['space-captain-helmet','Space Captain Helmet',ctx => {
    path(ctx,'#d2d9f0',[[60,89],[52,63,65,32,89,21],[110,5,147,6,170,21],[197,33,207,64,195,87],
      [176,81],[179,53,158,35,128,35],[98,35,78,53,79,84],[65,90]]);
    box(ctx,55,65,20,27,7,'#e47d71');
    box(ctx,180,65,20,27,7,'#e47d71');
    path(ctx,'#50587e',[[75,57],[103,32,156,33,182,56],[172,58],[126,48,84,61]],INK,2);
    line(ctx,CREAM,4,[81,37],[115,17,154,24]);
    gem(ctx,129,28,9,11,'#75bedb','#d6fbff');
    for (const x of [63,191]) line(ctx,'#ffdfaa',2,[x,73],[x+6,75],[x,79]);
  },['space','helmet']],
  ['birthday-cake-hat','Birthday Cake Hat',ctx => {
    oval(ctx,129,72,75,10,'#86c4cb');
    box(ctx,75,43,108,28,7,'#d583a7');
    box(ctx,90,24,77,24,5,'#ffd28e');
    line(ctx,CREAM,4,[76,46],[86,57,94,49],[107,58,115,48],[128,59,137,48],[150,57,159,47],[172,55,181,47]);
    line(ctx,'#fff2d0',4,[91,27],[103,35,117,27],[128,36,139,27],[152,35,165,26]);
    for (const [x,y,color] of [[104,22,CYAN],[129,20,ROSE],[153,22,MINT]]) {
      box(ctx,x-3,y-14,6,15,1,color,INK,1.2);
      oval(ctx,x,y-17,3.6,5,GOLD,RED,1.1);
    }
    for (const [x,y,color] of [[86,63,CYAN],[101,65,GOLD],[120,61,MINT],[132,64,VIOLET],[149,61,GOLD],[161,65,MINT],[173,60,CYAN]]) dot(ctx,x,y,2,color);
  },['party','food']],
  ['cheese-wedge-hat','Cheese Wedge Hat',ctx => {
    path(ctx,'#de9144',[[61,55],[145,14],[188,40],[193,65],[109,76],[61,64]]);
    path(ctx,'#ffe27a',[[58,50],[130,16],[187,36],[115,53,58,57]]);
    path(ctx,GOLD,[[59,54],[112,61],[187,37],[191,62],[165,73,109,78,61,65]]);
    for (const [x,y,rx,ry] of [[92,46,9,5],[126,35,12,6],[153,28,7,4],[150,61,10,6],[90,65,9,4],[174,54,7,5]]) oval(ctx,x,y,rx,ry,'#d98c46','#a65b3f',1.5);
    line(ctx,CREAM,3,[74,46],[130,20],[169,34]);
    // The crooked tooth marks are carved into the front of the wedge.
    line(ctx,INK,2,[61,55],[57,59],[62,62],[58,65]);
  },['food','funny']],
  ['pirate-captain-hat','Pirate Captain Hat',ctx => {
    path(ctx,'#4e3056',[[63,73],[55,54],[37,52,39,35],[64,41,76,22,103,26],
      [114,9,140,8,151,25],[180,21,185,43,218,34],[220,53,205,55],[191,74],[129,85,63,73]]);
    line(ctx,GOLD,4,[47,42],[82,49,99,29],[117,13,143,16,157,31],[185,49,207,40]);
    line(ctx,CORAL,6,[57,69],[128,82,199,69]);
    line(ctx,CREAM,3,[113,60],[142,43]);
    line(ctx,CREAM,3,[114,43],[143,60]);
    oval(ctx,128,46,12,11,CREAM,INK,2);
    box(ctx,122,48,12,9,2,CREAM,INK,2);
    for (const x of [124,132]) dot(ctx,x,45,2,INK);
  },['pirate','history']],
  ['dragon-skull-helmet','Dragon Skull Helmet',ctx => {
    path(ctx,'#fff2ca',[[58,68],[64,46],[47,22],[70,27],[79,36],[86,26],[76,5],[98,19],[112,31],
      [143,31],[159,19],[180,6],[171,29],[177,36],[191,25],[209,20],[196,47],[199,64],[181,81],[169,60],
      [145,57],[139,81],[118,81],[113,58],[87,62],[75,83]]);
    path(ctx,'#a79caf',[[70,67],[85,48],[107,54],[110,60],[87,62],[78,75]],null);
    path(ctx,'#a79caf',[[184,67],[171,48],[149,54],[146,60],[169,63],[179,75]],null);
    path(ctx,'#2d233f',[[85,47],[111,48],[104,60],[89,58]],null);
    path(ctx,'#2d233f',[[147,48],[171,45],[168,59],[153,61]],null);
    line(ctx,'#8e6275',2,[128,33],[125,43],[132,47],[126,58]);
    for (const x of [122,129,136]) line(ctx,'#82756e',1.5,[x,72],[x,79]);
  },['dragon','mask']],
  ['flying-saucer-hat','Flying Saucer Hat',ctx => {
    path(ctx,'#a3e4d9',[[87,43],[91,19,105,10,128,10],[151,10,169,20,171,43],[130,57,87,43]]);
    oval(ctx,129,31,9,11,'#c6e761',INK,1.8);
    dot(ctx,126,29,1.8,INK);
    dot(ctx,132,29,1.8,INK);
    line(ctx,CREAM,3,[100,25],[114,17,128,17]);
    oval(ctx,128,50,79,16,'#a183cf');
    oval(ctx,128,57,73,10,'#615388');
    for (const [x,y] of [[64,52],[85,59],[111,63],[143,63],[169,59],[191,53]]) dot(ctx,x,y,3.5,GOLD);
    line(ctx,'#f5bcf2',3,[59,45],[125,32,197,45]);
    path(ctx,'#83dbe7',[[112,66],[107,80],[148,80],[143,66]],null);
  },['space','ufo']],
  ['retro-tv-helmet','Retro TV Helmet',ctx => {
    line(ctx,INK,4,[129,23],[107,3]);
    line(ctx,INK,4,[136,23],[152,4]);
    dot(ctx,106,4,3,CYAN);
    dot(ctx,152,4,3,GOLD);
    box(ctx,66,19,124,66,12,'#9c665b');
    box(ctx,75,25,84,52,9,'#241c39');
    box(ctx,81,30,72,42,7,'#84d6c7',null);
    for (const [x,color] of [[90,CYAN],[101,ROSE],[112,GOLD],[123,'#b5e883'],[134,VIOLET]]) box(ctx,x,32,9,36,0,color,null);
    line(ctx,'#fff',3,[87,37],[106,37]);
    oval(ctx,173,40,8,8,CREAM);
    line(ctx,INK,2,[172,41],[178,36]);
    oval(ctx,173,62,6,6,'#d19b7d');
  },['retro','technology']],
  ['royal-chicken-crown','Royal Chicken Crown',ctx => {
    path(ctx,'#eab14b',[[64,67],[60,46],[80,49],[99,34],[111,54],[133,37],[146,51],[175,31],[179,50],[197,44],
      [188,68],[128,82,64,67]]);
    for (const [x,y,fill] of [[81,48,CREAM],[128,42,'#ffe7a1'],[173,41,CREAM]]) {
      oval(ctx,x,y-8,12,13,fill,INK,2);
      path(ctx,CORAL,[[x-8,y-19],[x-7,y-27,x-2,y-22],[x+1,y-29,x+4,y-22],[x+11,y-26,x+7,y-18]],INK,2);
      path(ctx,'#ef963c',[[x+7,y-9],[x+17,y-5],[x+7,y-2]],INK,1.6);
      dot(ctx,x+2,y-12,2,INK);
    }
    ribbon(ctx,GOLD,66,62,122);
    gem(ctx,127,68,8,8,RED,'#ffd3a3');
  },['animal','royal']],
  ['galactic-warrior-helmet','Galactic Warrior Helmet',ctx => {
    path(ctx,'#554e98',[[55,82],[58,41],[73,40],[86,16],[107,19],[128,7],[152,21],[170,16],[186,42],
      [199,40],[201,82],[180,75],[165,57],[128,66],[91,57],[77,74]]);
    path(ctx,'#9f87df',[[80,42],[101,23],[126,16],[119,37],[89,50]],null);
    path(ctx,'#9f87df',[[176,42],[155,23],[130,16],[138,37],[165,50]],null);
    path(ctx,CYAN,[[74,50],[103,46],[128,61],[154,46],[182,50],[158,57],[128,71],[101,58]]);
    gem(ctx,128,32,8,13,GOLD,'#fff1ad');
    for (const x of [65,190]) line(ctx,'#e0c5ff',3,[x,56],[x,70]);
  },['space','helmet']],
  ['aurora-crown','Aurora Crown',ctx => {
    path(ctx,'#645ba9',[[59,62],[58,38],[84,44],[83,22],[108,33],[129,7],[148,35],
      [176,20],[174,43],[198,36],[197,62],[128,77,59,62]]);
    line(ctx,MINT,5,[65,54],[105,56,129,21],[153,56,191,53]);
    line(ctx,CYAN,3,[73,45],[109,46,129,13],[147,47,183,44]);
    ribbon(ctx,'#a780cf',58,61,141);
    gem(ctx,128,54,10,13,'#457eae','#c0fefe');
    for (const [x,y] of [[71,33],[98,20],[160,22],[187,31]]) star(ctx,x,y,5,CREAM,null,4);
  },['magic','legendary']],
  ['mythical-storm-helmet','Mythical Storm Helmet',ctx => {
    path(ctx,'#454570',[[58,69],[72,47],[59,35],[89,29],[109,10],[126,22],[148,10],[170,29],[200,32],
      [183,48],[197,69],[162,75],[128,63],[91,76]]);
    path(ctx,'#7f9dcc',[[75,61],[105,31],[126,35],[151,29],[182,60],[151,65],[128,56],[103,66]],null);
    path(ctx,'#ffe88a',[[136,16],[105,44],[126,43],[112,69],[149,36],[131,37],[142,16]],INK,2.1);
    for (const [x,y] of [[59,35],[79,26],[185,26],[201,34]]) star(ctx,x,y,5,CYAN,null,4);
  },['weather','legendary']],
  ['frog-bucket-hat','Frog Bucket Hat',ctx => {
    oval(ctx,93,32,20,20,'#6bbb83');
    oval(ctx,163,32,20,20,'#6bbb83');
    path(ctx,'#79cc80',[[63,62],[66,34,94,29,128,34],[163,27,185,39,193,61],
      [205,64,208,74,197,77],[129,82,64,76],[50,73,53,66,63,62]]);
    for (const x of [92,164]) {
      oval(ctx,x,29,10,11,CREAM,INK,2);
      oval(ctx,x+1,31,3.6,6,INK,null);
      dot(ctx,x-1,28,1.5,CREAM);
    }
    for (const x of [84,171]) oval(ctx,x,52,9,4,'#ed9ca5',null);
    line(ctx,INK,2.6,[117,50],[128,61,139,50]);
    line(ctx,'#4b916e',3,[55,68],[126,80,200,68]);
  },['animal','garden']],
  ['octopus-beret','Octopus Beret',ctx => {
    for (const [x,y,bend] of [[78,64,-12],[96,65,-10],[114,67,-6],[141,67,6],[159,66,11],[177,64,14]]) {
      line(ctx,INK,10,[x,y-8],[x+bend,y+6,x+bend*1.1,y+13],[x+bend*1.45,y+15,x+bend*1.7,y+8]);
      line(ctx,'#b85b99',6,[x,y-8],[x+bend,y+6,x+bend*1.1,y+13],[x+bend*1.45,y+15,x+bend*1.7,y+8]);
      dot(ctx,x+bend*1.3,y+11,2,'#ffc3dc');
    }
    path(ctx,'#c269b5',[[63,55],[60,26,104,14,136,19],[176,13,193,39,194,58],[163,72,96,74,63,55]]);
    oval(ctx,107,31,20,6,'#e4a1dc',null,-.18);
    for (const x of [111,147]) {
      oval(ctx,x,47,6,8,CREAM,INK,1.7);
      dot(ctx,x+1,47,2.6,INK);
    }
    line(ctx,'#663860',2,[122,54],[129,59,136,54]);
  },['ocean','animal']],
  ['teapot-topper','Teapot Topper',ctx => {
    oval(ctx,175,45,24,20,null,INK,10);
    oval(ctx,175,45,24,20,null,'#6ab3b9',5);
    path(ctx,'#8cd4c5',[[86,48],[70,46],[64,35],[47,32],[55,48],[73,59],[91,62]]);
    oval(ctx,129,50,48,25,'#57aaa9');
    oval(ctx,127,25,40,8,'#9de7cf');
    oval(ctx,127,16,10,6,GOLD);
    for (const x of [106,128,151]) {
      path(ctx,CREAM,[[x-7,58],[x-3,45],[x,53],[x+5,45],[x+8,58]],null);
      dot(ctx,x,59,2.5,'#285c72');
    }
    line(ctx,'#d5fbdf',3,[96,40],[116,31,137,36]);
  },['kitchen','funny']],
  ['pie-stack-hat','Pie Stack Hat',ctx => {
    oval(ctx,128,74,73,8,'#95a0c3');
    path(ctx,'#af6653',[[59,53],[66,70],[191,70],[197,53]]);
    oval(ctx,128,53,69,18,'#f6be78');
    for (const [x,y] of [[77,51],[97,47],[118,45],[139,45],[159,48],[178,52]]) {
      dot(ctx,x,y,4,'#ad5e56');
      line(ctx,'#d89262',2,[x-7,y+4],[x+6,y-4]);
    }
    path(ctx,'#d28a4c',[[93,46],[113,17],[157,22],[148,48],[114,55]]);
    path(ctx,'#f1d595',[[93,46],[113,17],[157,22],[135,41],[111,46]]);
    path(ctx,CREAM,[[115,34],[112,26],[122,23],[126,13],[135,24],[141,27],[135,34]],'#b57e67',1.4);
    dot(ctx,132,14,5,'#bb4f64');
  },['food','funny']],
  ['jellyfish-beanie','Jellyfish Beanie',ctx => {
    path(ctx,'#79cacc',[[62,53],[67,15,113,9,132,12],[161,13,188,24,194,54],[190,62,174,63],
      [157,67,145,60],[131,70,117,62],[102,70,88,61],[71,65,62,53]]);
    for (const [x,y,bend] of [[77,59,-9],[96,61,9],[118,61,-6],[144,62,10],[164,61,10],[181,59,10]]) {
      line(ctx,INK,6,[x,y],[x+bend,y+11,x+1,y+17],[x-bend,y+24,x+bend,y+30]);
      line(ctx,x%2 ? '#e99ac3' : '#dff6dd',3,[x,y],[x+bend,y+11,x+1,y+17],[x-bend,y+24,x+bend,y+30]);
    }
    oval(ctx,121,28,28,8,'#b1f1de',null);
    for (const x of [105,150]) dot(ctx,x,47,3.5,'#355578');
    line(ctx,'#416687',2.5,[120,48],[128,58,136,48]);
  },['ocean','animal']],
  ['toast-helmet','Toast Helmet',ctx => {
    path(ctx,'#b57047',[[70,70],[70,43],[56,35,65,20],[81,3,106,15,126,11],[148,5,174,9,184,20],
      [199,33,188,44],[190,69],[133,80,70,70]]);
    path(ctx,'#ffe0a2',[[79,63],[79,40],[67,31,76,25],[96,14,110,22,129,19],[152,16,175,15,181,29],
      [184,34,177,39],[181,64],[131,73,79,63]],'#d2915c',2);
    translated(ctx,130,42,() => {
      ctx.rotate(-.18);
      box(ctx,-19,-11,38,22,4,GOLD,'#b87a38',2);
      line(ctx,CREAM,2,[-11,-5],[10,-5]);
    });
    for (const [x,y] of [[84,43],[96,27],[108,56],[155,55],[167,31]]) dot(ctx,x,y,1.7,'#aa7758');
  },['food','funny']],
  ['race-striped-helmet','Race Stripe Helmet',ctx => {
    path(ctx,'#ce5576',[[59,78],[54,50,75,19,108,14],[144,6,176,17,193,41],
      [203,56,197,77,195,81],[174,75],[177,50,156,48,128,48],[96,47,77,60,79,81]]);
    path(ctx,'#fff4db',[[118,12],[130,11],[141,46],[126,47]],null);
    path(ctx,'#f7c251',[[139,12],[147,13],[157,48],[148,46]],null);
    path(ctx,'#564b79',[[64,57],[94,43,134,43,180,53],[190,57],[181,67],[134,55,83,64,66,69]]);
    line(ctx,'#acf0f1',3,[76,58],[129,48,172,57]);
    for (const [x,y] of [[67,72],[189,72]]) box(ctx,x-8,y-6,16,13,3,'#74858b');
  },['race','helmet']],
  ['domino-top-hat','Domino Top Hat',ctx => {
    oval(ctx,128,73,73,9,'#4d3a69');
    translated(ctx,126,47,() => {
      ctx.rotate(.12);
      box(ctx,-30,-39,61,65,6,'#4b3658');
      line(ctx,'#e7caef',3,[-25,-6],[25,-6]);
      for (const [x,y] of [[-16,-25],[16,-25],[-17,5],[17,5],[0,10],[-17,17],[17,17]]) dot(ctx,x,y,3.8,CREAM);
    });
    ribbon(ctx,'#d8a95d',83,65,89,5);
  },['tabletop','formal']],
  ['traffic-cone-hat','Traffic Cone Hat',ctx => {
    path(ctx,'#ec9b60',[[60,63],[92,58],[111,10],[126,3],[135,13],[163,58],[196,66],
      [185,76],[73,73]]);
    path(ctx,'#f1744d',[[91,59],[119,6],[128,5],[137,17],[166,59],[128,70,91,59]],INK,2.5);
    path(ctx,CREAM,[[104,39],[128,48,154,43],[159,51],[132,61,99,49]],null);
    line(ctx,'#ffcf95',4,[115,22],[123,7]);
    line(ctx,'#ad6258',2,[65,65],[131,76,189,67]);
  },['funny','garage']],
  ['fox-ears-hood','Fox Ears Hood',ctx => {
    path(ctx,'#d66b58',[[59,78],[49,55],[56,9],[92,36],[131,26],[167,37],[198,8],[207,55],[195,79],
      [175,69],[158,49,131,48],[104,49,78,67],[75,83]]);
    path(ctx,'#f2b6aa',[[59,20],[83,40],[61,53]],INK,2);
    path(ctx,'#f2b6aa',[[197,19],[172,41],[197,54]],INK,2);
    path(ctx,CREAM,[[55,55],[71,56],[83,57],[72,77],[60,71]],null);
    path(ctx,CREAM,[[202,55],[183,56],[174,58],[186,77],[195,71]],null);
    dot(ctx,128,42,3,INK);
    for (const x of [115,141]) dot(ctx,x,36,2,'#8d444b');
  },['animal','hood']],
  ['pinwheel-hat','Pinwheel Hat',ctx => {
    path(ctx,'#67b4a9',[[61,66],[79,42,125,35,147,44],[173,45,199,56,195,67],
      [132,79,61,66]]);
    ribbon(ctx,'#3d7487',59,63,139,7);
    line(ctx,INK,4,[128,55],[128,24]);
    const vanes = [['#ec728c',0],['#f7c65d',Math.PI/2],['#9be1a3',Math.PI],['#8f91df',Math.PI*1.5]];
    for (const [color,angle] of vanes) translated(ctx,128,25,() => {
      ctx.rotate(angle);
      path(ctx,color,[[0,0],[-8,-10],[-16,-23],[7,-17],[13,-3],[0,0]],INK,2);
    });
    dot(ctx,128,25,4,'#48396c');
  },['party','toy']],
  ['boomerang-cowboy-hat','Boomerang Cowboy Hat',ctx => {
    path(ctx,'#9e5b50',[[48,52],[30,41],[39,66,77,77],[139,89,213,67,227,47],
      [206,55],[193,60,169,59],[116,62,78,62,48,52]]);
    path(ctx,'#cc8d64',[[67,61],[83,43,90,25,93,24],[103,25,114,37,129,34],
      [144,31,156,24,167,29],[174,35,174,49,187,60],[128,73,67,61]]);
    ribbon(ctx,'#623b48',68,55,121);
    path(ctx,CYAN,[[117,61],[132,57],[141,61],[130,64],[121,71],[116,68]],INK,1.5);
    line(ctx,'#f6bea0',2,[45,59],[113,84,174,67]);
  },['western','funny']],
  ['paper-boat-captain','Paper Boat Captain',ctx => {
    path(ctx,'#f8efd7',[[54,49],[81,61],[107,26],[122,18],[143,18],[174,58],[208,49],
      [188,76],[75,77]]);
    path(ctx,'#c7c6e1',[[81,62],[106,47],[132,64],[154,46],[176,62],[186,74],[77,74]],INK,2);
    path(ctx,'#ece4f7',[[54,49],[128,65],[208,49],[187,76],[75,77]]);
    line(ctx,'#845980',2,[122,20],[122,1]);
    path(ctx,ROSE,[[123,2],[151,7],[123,15]],INK,1.5);
    line(ctx,'#7790b0',2,[82,65],[127,73,172,65]);
  },['ocean','craft']],
  ['rubber-duck-rain-hat','Rubber Duck Rain Hat',ctx => {
    path(ctx,'#edbb50',[[57,66],[68,58],[76,40],[165,38],[183,58],[200,64],
      [128,81,57,66]]);
    path(ctx,'#ffd765',[[87,54],[79,43,93,38,112,44],[133,49,147,38,150,32],
      [149,18,166,12,178,22],[186,28,183,43,172,46],[155,65,109,66,87,54]]);
    path(ctx,'#ec9054',[[177,30],[196,32],[182,42],[174,38]],INK,2);
    dot(ctx,169,27,2.7,INK);
    ribbon(ctx,'#fbe28e',57,60,142);
    oval(ctx,116,49,18,7,'#efab46','#b57749',1.8);
    for (const [x,y] of [[64,46],[76,27],[113,23]]) path(ctx,CYAN,[[x,y-8],[x+9,y+4,x,y+6],[x-8,y+4,x,y-8]],INK,1.6);
  },['animal','weather']],
  ['ice-cream-sundae-hat','Ice Cream Sundae Hat',ctx => {
    path(ctx,'#7bb3bc',[[76,53],[89,68],[112,73],[105,79],[150,79],[145,72],[170,67],[184,53]]);
    oval(ctx,129,52,54,12,'#c5e7d9');
    for (const [x,y,r,color] of [[97,39,20,'#eba3be'],[159,39,20,'#a4d6a4'],[128,28,24,'#f4cea1']]) oval(ctx,x,y,r,r,color);
    path(ctx,'#9b5d70',[[109,21],[128,10,148,26],[143,38],[136,25,129,35],[122,26,113,32],[108,26]],INK,1.9);
    dot(ctx,128,8,6,RED);
    line(ctx,INK,1.8,[129,8],[135,0,141,4]);
    line(ctx,CREAM,2.8,[84,54],[132,68,176,54]);
  },['food','party']],
  ['tangled-noodle-bowl','Tangled Noodle Bowl',ctx => {
    for (const [x,y] of [[67,44],[91,33],[106,39],[136,28],[154,35],[171,42]]) {
      line(ctx,INK,7,[x,y+12],[x-7,y-4,x+6,y-8],[x+19,y-7,x+10,y+3],[x+3,y+8,x+17,y+16]);
      line(ctx,GOLD,4,[x,y+12],[x-7,y-4,x+6,y-8],[x+19,y-7,x+10,y+3],[x+3,y+8,x+17,y+16]);
    }
    line(ctx,INK,6,[134,45],[183,8]);
    line(ctx,INK,6,[150,45],[208,12]);
    line(ctx,'#dea267',3,[135,45],[183,8]);
    line(ctx,'#dea267',3,[150,45],[208,12]);
    path(ctx,'#7860a7',[[57,50],[128,61,199,50],[187,73,128,87,69,73],[57,50]]);
    line(ctx,'#adbee4',3,[68,63],[128,77,188,62]);
    dot(ctx,136,64,3,CREAM);
  },['food','funny']],
  ['goodnight-moon-cap','Goodnight Moon Cap',ctx => {
    path(ctx,'#66519c',[[65,67],[76,47,85,27,100,16],[124,-1,152,8,166,18],[176,26,178,36,182,46],
      [187,54,193,48,198,38],[205,57,190,70,169,66],[158,63],[127,78,65,67]]);
    path(ctx,'#ac95d5',[[75,60],[99,16,134,14,167,24],[135,21,111,53,75,60]],null);
    ribbon(ctx,'#493968',64,60,106,7);
    oval(ctx,198,39,10,11,CREAM);
    for (const [x,y,r] of [[118,29,7],[86,54,5],[144,41,6],[165,31,4],[111,51,3]]) star(ctx,x,y,r,GOLD);
  },['sleep','space']],
  ['blueberry-muffin-hat','Blueberry Muffin Hat',ctx => {
    path(ctx,'#9f72bf',[[74,52],[89,75],[167,75],[183,50]]);
    path(ctx,'#e6a37c',[[62,48],[63,35,80,32],[79,17,111,16],[125,1,144,10,148,16],
      [176,13,182,25,182,34],[206,43,184,54],[134,65,62,48]]);
    for (const [x,y,r] of [[92,32,6],[115,23,7],[140,18,6],[163,31,7],[180,43,4],[128,45,7],[73,41,4]]) {
      dot(ctx,x,y,r,'#6552a5');
      dot(ctx,x-2,y-2,1.6,'#beaedf');
    }
    for (const x of [89,102,116,129,142,156,170]) line(ctx,'#d4a8e1',2,[x,56],[128+(x-128)*.74,73]);
  },['food','funny']],
  ['bat-pilot-helmet','Bat Pilot Helmet',ctx => {
    path(ctx,'#6a5b95',[[54,78],[48,56],[56,15],[82,36],[99,27],[128,31],[153,25],[174,38],[200,13],
      [208,55],[196,79],[177,74],[164,55],[127,58],[89,54],[79,77]]);
    path(ctx,'#b88bc4',[[58,25],[75,42],[58,49]],INK,2);
    path(ctx,'#b88bc4',[[199,23],[180,41],[199,49]],INK,2);
    ribbon(ctx,'#514169',76,48,104,2);
    for (const [x,fill] of [[101,CYAN],[155,ROSE]]) {
      oval(ctx,x,52,18,13,'#34294d');
      oval(ctx,x,52,12,8,fill,null);
      line(ctx,CREAM,2,[x-5,48],[x+3,47]);
    }
    for (const x of [60,195]) dot(ctx,x,63,4,GOLD);
  },['animal','helmet']],
  ['garden-gnome-hat','Garden Gnome Hat',ctx => {
    path(ctx,'#b95a6c',[[62,66],[84,55],[92,35],[116,8],[132,3],[147,11],[158,31],[173,61],[190,68],
      [127,80,62,66]]);
    path(ctx,'#ec868c',[[88,59],[113,16],[131,7],[141,14],[113,47],[119,61]],null);
    ribbon(ctx,'#b35f67',64,61,124);
    for (const [x,y] of [[146,32],[152,46],[161,61]]) {
      dot(ctx,x,y,7,'#82bb79');
      dot(ctx,x+4,y-3,3,'#b5e897');
      line(ctx,'#406b5c',1.7,[x-4,y+4],[x+4,y-4]);
    }
  },['garden','story']],
  ['cloud-float-hat','Cloud Float Hat',ctx => {
    for (const [x,y,rx,ry] of [[73,51,22,15],[97,37,23,22],[128,29,25,23],[154,40,25,21],[181,52,25,14]])
      oval(ctx,x,y,rx,ry,'#e8efff',INK,2.5);
    oval(ctx,128,55,68,13,'#d7d6f3',null);
    line(ctx,'#9997c9',2.5,[76,58],[121,70,179,57]);
    for (const [x,y,color] of [[80,64,CYAN],[102,69,VIOLET],[126,72,MINT],[149,69,CYAN],[175,63,VIOLET]]) {
      path(ctx,color,[[x,y],[x+8,y+10,x,y+14],[x-8,y+10,x,y]],INK,1.3);
    }
    star(ctx,160,17,8,GOLD,INK);
  },['weather','magic']],
  ['snow-globe-hat','Snow Globe Hat',ctx => {
    path(ctx,'#aad6e7',[[76,60],[75,34,89,8,126,6],[162,6,180,33,179,60],
      [130,72,76,60]]);
    path(ctx,'#f7f5e4',[[79,55],[112,48,128,55],[145,48,177,55],[174,61],[86,64]],null);
    for (const [x,y] of [[103,36],[150,39]]) {
      path(ctx,'#4d9b85',[[x,y-13],[x+10,y],[x+7,y],[x+13,y+9],[x-13,y+9],[x-7,y],[x-10,y]],INK,1.3);
      box(ctx,x-2,y+9,4,7,0,'#af7b6b',null);
    }
    for (const [x,y] of [[93,26],[117,25],[139,17],[162,30],[123,40],[141,43],[165,51]]) dot(ctx,x,y,2,CREAM);
    line(ctx,CREAM,3,[81,44],[86,23,105,17]);
    box(ctx,70,58,116,17,6,'#74608e');
    line(ctx,GOLD,2,[80,63],[176,63]);
  },['winter','magic']],
  ['treasure-chest-helmet','Treasure Chest Helmet',ctx => {
    path(ctx,'#a96165',[[69,47],[80,16,113,15],[154,13,182,21,187,46],[173,57],[83,57]]);
    box(ctx,70,44,116,28,7,'#bc7b65');
    for (const x of [84,166]) {
      path(ctx,'#dea857',[[x,27],[x+11,22],[x+11,72],[x,72]],INK,2);
      for (const y of [38,53,63]) dot(ctx,x+5,y,1.7,INK);
    }
    box(ctx,119,49,18,14,3,GOLD);
    dot(ctx,128,55,2,INK);
    line(ctx,INK,1.6,[128,55],[128,59]);
    line(ctx,'#f4c899',3,[100,33],[133,26,160,35]);
  },['pirate','rare']],
  ['billiards-rack-hat','Billiards Rack Hat',ctx => {
    path(ctx,'#c89567',[[56,63],[126,13],[199,63],[185,73],[74,73]]);
    path(ctx,'#5ea080',[[69,62],[127,20],[187,62]],INK,2);
    for (const [x,y,color] of [[127,33,CREAM],[116,45,'#da685e'],[138,45,'#8270c8'],
      [104,56,'#65c5c9'],[126,56,'#403658'],[149,56,GOLD]]) {
      oval(ctx,x,y,8,8,color,INK,1.4);
      oval(ctx,x,y,3,3,CREAM,null);
      dot(ctx,x-2,y-3,1,'#fff5ee');
    }
    line(ctx,'#f0bf81',2,[72,68],[180,68]);
  },['tabletop','funny']],
  ['crab-captain-hat','Crab Captain Hat',ctx => {
    for (const [x,flip] of [[79,-1],[177,1]]) reflected(ctx,x,45,flip,() => {
      line(ctx,INK,8,[0,18],[22,10,28,-2]);
      line(ctx,CORAL,5,[0,18],[22,10,28,-2]);
      path(ctx,'#da7467',[[25,0],[14,-6,19,-18],[29,-21],[29,-8],[40,-19],[47,-9],[42,4],[30,8]]);
    });
    oval(ctx,128,53,51,18,'#d85967');
    for (const [x,bend] of [[108,-4],[149,3]]) {
      line(ctx,INK,5,[x,46],[x+bend,29]);
      oval(ctx,x+bend,27,7,7,CREAM,INK,2);
      dot(ctx,x+bend+1,28,2.6,INK);
    }
    line(ctx,CREAM,2,[117,54],[128,63,139,54]);
    ribbon(ctx,'#8a497b',73,62,110,7);
  },['ocean','animal']],
  ['popcorn-bucket-hat','Popcorn Bucket Hat',ctx => {
    path(ctx,'#dc7184',[[78,30],[178,30],[166,74],[89,74]]);
    for (const [x,tilt] of [[89,6],[110,3],[134,-1],[155,-4]]) path(ctx,CREAM,[[x,32],[x+9,32],[x+9+tilt,72],[x+tilt,72]],null);
    oval(ctx,128,33,50,9,'#b85e72');
    for (const [x,y,r] of [[85,28,10],[97,20,12],[111,25,11],[121,14,11],[142,16,12],[157,22,11],[171,29,9]]) {
      oval(ctx,x,y,r,r*.75,'#fff1aa','#aa704b',1.6);
      dot(ctx,x-1,y+2,r*.33,'#f3c769');
    }
    star(ctx,130,55,11,GOLD,INK);
  },['food','cinema']],
  ['hedgehog-cap','Hedgehog Cap',ctx => {
    path(ctx,'#785471',[[56,64],[59,43],[71,47],[70,29],[90,37],[91,18],[110,31],[117,11],[134,27],
      [149,11],[158,34],[177,21],[178,40],[196,34],[199,57],[189,72],[68,75]]);
    path(ctx,'#cd9d84',[[65,60],[83,57],[100,50,120,44],[150,39,180,52,195,64],[179,73,92,80,65,60]]);
    dot(ctx,66,61,6,INK);
    dot(ctx,104,56,3.6,INK);
    line(ctx,'#f4cfaa',2.5,[111,51],[151,42,179,58]);
    for (const [x,y] of [[85,39],[109,36],[141,32],[167,34],[181,45]]) line(ctx,'#ad7894',2,[x-3,y],[x+4,y+8]);
  },['animal','garden']],
  ['bubble-tea-hat','Bubble Tea Hat',ctx => {
    line(ctx,INK,10,[141,49],[159,6]);
    line(ctx,'#b8d798',6,[141,49],[159,6]);
    path(ctx,'#c482ab',[[79,27],[180,27],[171,71],[89,71]]);
    path(ctx,'#edb4bc',[[84,43],[175,39],[167,69],[91,69]],null);
    oval(ctx,129,28,53,9,'#f2cdd4');
    for (const [x,y,r] of [[96,58,6],[110,63,5],[124,55,6],[136,65,5],[152,58,6],[164,63,4]]) dot(ctx,x,y,r,'#694262');
    line(ctx,CREAM,3,[91,38],[96,53]);
    line(ctx,'#ecab92',3,[101,30],[146,32,170,28]);
  },['food','funny']],
  ['lighthouse-hat','Lighthouse Hat',ctx => {
    path(ctx,'#aaa3d2',[[54,65],[78,55],[102,61],[150,59],[178,54],[202,66],[178,74],[78,74]]);
    path(ctx,'#f0e7d6',[[103,64],[113,19],[145,19],[154,64]]);
    path(ctx,'#d66f70',[[112,29],[145,29],[148,39],[109,39]],null);
    path(ctx,'#d66f70',[[107,46],[149,46],[151,56],[105,56]],null);
    box(ctx,110,14,37,17,4,'#5a6b8b');
    box(ctx,117,17,23,10,3,'#ffe39b',null);
    path(ctx,'#8673a3',[[104,15],[128,1],[153,15]]);
    for (const [x,flip] of [[110,-1],[148,1]]) reflected(ctx,x,21,flip,() => {
      path(ctx,'#f8d48b',[[0,-2],[53,-10],[63,12],[0,4]],null);
      line(ctx,CREAM,2,[4,0],[47,0]);
    });
    box(ctx,122,55,13,10,2,'#69617f',null);
  },['ocean','tower']]
]);

const eyePositions = [99, 155];

function highlight(ctx, x, y, size = 10, color = '#ffffffc4') {
  line(ctx,color,2.5,[x-size,y+2],[x-4,y-4,x+2,y-4]);
}

function eyePair(ctx, painter, y = 123) {
  eyePositions.forEach((x,index) => translated(ctx,x,y,() => painter(ctx,index)));
}

function strap(ctx, fill, y = 119) {
  line(ctx,INK,8,[54,y-2],[75,y+2]);
  line(ctx,INK,8,[180,y+2],[203,y-2]);
  line(ctx,fill,4,[52,y-2],[76,y+2]);
  line(ctx,fill,4,[180,y+2],[204,y-2]);
}

function goggles(ctx, body, lens, {wide = 23, high = 17, y = 122} = {}) {
  strap(ctx,body,y);
  lensBridge(ctx,body,y-2,17,7);
  eyePair(ctx,c=>{
    oval(c,0,0,wide,high,body,INK,3);
    oval(c,0,0,wide-5,high-5,lens,INK,2);
    highlight(c,-2,-4);
  },y);
}

function spiral(ctx, x, y, size, color, turns = 2.2) {
  const vertices = Array.from({length:32},(_,index)=>{
    const fraction = index/31, angle = fraction*Math.PI*2*turns;
    return [x+Math.cos(angle)*size*fraction,y+Math.sin(angle)*size*fraction];
  });
  line(ctx,color,2.5,...vertices);
}

function flower(ctx, x, y, petals, radius, color, center, stroke = INK) {
  for (let index=0; index<petals; index+=1) {
    const angle = index/petals*Math.PI*2;
    oval(ctx,x+Math.cos(angle)*radius*.57,y+Math.sin(angle)*radius*.57,radius*.39,radius*.26,color,stroke,1.5,angle);
  }
  oval(ctx,x,y,radius*.29,radius*.29,center,stroke,1.6);
}

function pane(ctx, x, y, width, height, fill, color = INK, weight = 3) {
  const corners = [[x+5,y],[x+width-6,y],[x+width,y+6],[x+width-2,y+height-6],
    [x+width-10,y+height],[x+9,y+height],[x+2,y+height-5],[x,y+7]];
  path(ctx,fill,corners,color,weight);
}

const eyewear = makeItems('eyewear', [
  ['googly-glasses','Googly Glasses',(ctx,t) => {
    lensBridge(ctx,ROSE,119,18,7);
    strap(ctx,ROSE);
    eyePair(ctx,(c,i) => {
      oval(c,0,0,23,23,i ? '#eda9a1' : '#8bdac1');
      oval(c,-1,0,18,18,CREAM,INK,2.3);
      const phase = t*2+i*1.6;
      dot(c,Math.sin(phase)*5+(i ? 2 : -4),Math.cos(phase)*6,8,'#29253d');
      dot(c,Math.sin(phase)*5+(i ? -1 : -7),Math.cos(phase)*6-3,2,'#fff');
    });
  },['funny','animated']],
  ['hypnotic-spiral-glasses','Hypnotic Spiral Glasses',ctx => {
    lensBridge(ctx,'#694e9d',119);
    eyePair(ctx,(c,i) => {
      oval(c,0,0,23,21,i ? '#553772' : '#563f84');
      spiral(c,0,0,16,i ? '#ffc692' : '#c4ffe4',i ? -2.1 : 2.1);
      oval(c,0,0,19,17,null,'#ae85ce',1.8);
    });
  },['magic','retro']],
  ['heart-sunglasses','Heart-Shaped Sunglasses',ctx => {
    lensBridge(ctx,'#692848',120,20,5);
    strap(ctx,'#b63e73',114);
    eyePair(ctx,c => {
      heart(c,0,-2,22,'#b03667');
      heart(c,0,-2,17,'#e184ae',null);
      highlight(c,-5,-9,7);
    });
  },['party','hearts']],
  ['laser-goggles','Laser Goggles',ctx => {
    strap(ctx,'#d35d69');
    pane(ctx,65,106,126,35,'#643854');
    box(ctx,72,111,112,26,5,'#a94f6a',INK,2);
    for (const x of [101,155]) {
      box(ctx,x-15,116,30,12,4,'#ffe4b5',null);
      line(ctx,'#ff376b',2,[x-16,122],[x+18,122]);
    }
    line(ctx,CORAL,2.7,[22,124],[79,122]);
    line(ctx,CORAL,2.7,[170,122],[236,119]);
    for (const x of [29,230]) star(ctx,x,122,5,'#ffb5a7',null,4);
  },['sci-fi','neon']],
  ['pirate-eyepatch','Pirate Eyepatch',ctx => {
    line(ctx,INK,7,[56,96],[192,135]);
    line(ctx,'#8b5b74',2,[56,94],[192,133]);
    path(ctx,'#47324f',[[76,111],[98,102,116,109,120,122],[120,136,104,146,95,143],
      [83,143,75,128,76,111]]);
    path(ctx,'#835770',[[83,113],[97,109,109,116],[112,129],[102,137,91,133]],null);
    star(ctx,101,124,7,GOLD,INK);
  },['pirate','patch']],
  ['rainbow-visor','Rainbow Visor',ctx => {
    path(ctx,'#73539c',[[63,106],[83,97,125,103,128,103],[163,99,186,103,194,109],
      [183,139],[153,143],[129,134],[102,142],[74,136],[63,106]]);
    const shades = ['#e47f96','#f3b891','#ffe893','#b5eacb','#7ad9e6','#a58fe7'];
    for (let index=0;index<shades.length;index++) line(ctx,shades[index],3.5,
      [69+index*1.4,110+index*3.2],[119,102+index*4,186-index*1.4,111+index*3.2]);
    line(ctx,CREAM,2,[74,109],[97,105,106,106]);
  },['neon','retro']],
  ['golden-monocle','Golden Monocle',ctx => {
    oval(ctx,155,123,21,24,'#fff1c33a',INK,5);
    oval(ctx,155,123,20,23,null,GOLD,3.8);
    highlight(ctx,154,111,12);
    line(ctx,'#8e6638',2.4,[174,134],[184,172,162,192],[153,207,171,217]);
    for (const [x,y] of [[178,146],[178,154],[177,163],[172,173],[166,184],[160,193]]) oval(ctx,x,y,2.6,3.8,null,'#e2aa52',1.3,.2);
    gem(ctx,173,217,5,7,'#edbb62');
  },['formal','retro']],
  ['mad-scientist-goggles','Mad Scientist Goggles',ctx => {
    goggles(ctx,'#688994','#98cfc2',{wide:25,high:22});
    oval(ctx,99,122,13,15,'#d5ee96',INK,2);
    spiral(ctx,99,122,10,'#40596c',1.9);
    oval(ctx,155,122,16,18,'#7b709f',INK,2.8);
    oval(ctx,155,122,9,10,'#e9a4aa');
    for (const [x,y] of [[82,110],[112,136],[145,105],[168,135]]) dot(ctx,x,y,2.7,GOLD);
    line(ctx,CREAM,2,[150,117],[157,113]);
  },['science','retro']],
  ['pixel-sunglasses','Pixel Sunglasses',ctx => {
    path(ctx,'#2f2348',[[61,111],[193,111],[193,119],[184,119],[184,129],[179,129],[179,137],[139,137],
      [139,129],[134,129],[134,121],[122,121],[122,129],[116,129],[116,138],[78,138],[78,130],[72,130],
      [72,121],[61,121]]);
    for (const x of [79,145]) {
      box(ctx,x,118,5,5,0,CREAM,null);
      box(ctx,x+5,123,5,5,0,'#a7a4d5',null);
      box(ctx,x+10,128,5,5,0,'#a7a4d5',null);
      box(ctx,x+11,118,5,5,0,CYAN,null);
    }
  },['pixel','retro']],
  ['cyberpunk-visor','Cyberpunk Visor',ctx => {
    path(ctx,'#4b3864',[[52,119],[73,103],[181,107],[203,125],[192,137],[157,143],[130,130],
      [112,137],[74,136]]);
    path(ctx,'#b15d9a',[[61,119],[77,110],[183,114],[195,126],[182,130],[153,133],[130,120],
      [109,130],[79,129]],INK,1.8);
    line(ctx,'#92ffce',3,[77,119],[105,118],[111,123],[119,116],[141,119],[151,126],[174,125]);
    for (const y of [110,115,120]) line(ctx,CYAN,2,[67,y],[71,y]);
    for (const x of [177,183,189]) dot(ctx,x,128,1.8,GOLD);
  },['sci-fi','neon']],
  ['dragon-eye-glasses','Dragon-Eye Glasses',ctx => {
    lensBridge(ctx,'#915b69',120,17,4.5);
    eyePair(ctx,(c,i) => {
      if (i) c.scale(-1,1);
      path(c,'#845e9d',[[-30,-15],[-12,-9],[-1,-18],[14,-12],[25,-15],[22,4],
        [9,15,0,15,-13,12],[-26,9,-31,-2,-30,-15]]);
      path(c,'#f1bf6e',[[-21,1],[-3,-17,16,-3,19,1],[2,17,-8,17,-21,1]],INK,2.2);
      path(c,'#714253',[[0,-10],[5,-1,0,10],[-5,0,0,-10]],null);
      line(c,CREAM,2,[-15,-2],[-7,-6]);
      dot(c,-5,-10,2,CYAN);
    });
  },['dragon','animal']],
  ['giant-comedy-spectacles','Giant Comedy Spectacles',ctx => {
    lensBridge(ctx,'#ce7b9a',119,18,6);
    eyePair(ctx,(c,i) => {
      c.rotate(i ? .09 : -.13);
      oval(c,0,0,24,26,'#f7b8c7',INK,4);
      oval(c,0,0,18,19,'#fff5d836',INK,2.5);
      highlight(c,-2,-7,13);
      dot(c,i ? 19 : -18,-12,4,GOLD);
    });
    path(ctx,'#ecae90',[[119,133],[126,121,132,127],[146,142,135,149],[124,152,115,143,119,133]]);
    path(ctx,'#55324f',[[98,157],[116,158,117,148,128,151],[139,149,140,158,158,157],
      [146,174,133,167,128,163],[119,171,105,169,98,157]]);
  },['funny','retro']],
  ['butterfly-mask','Butterfly Mask',ctx => {
    for (const [x,fl] of [[126,-1],[130,1]]) reflected(ctx,x,123,fl,()=>{
      path(ctx,'#ac6fc0',[[0,-2],[17,-28,45,-32,55,-22],[76,-25,67,-7,48,0],
        [64,15,48,27,32,20],[12,27,6,13,0,-2]]);
      path(ctx,'#eda0ca',[[6,0],[24,-22,43,-26,59,-19],[48,-10,39,-6],[25,1],[48,3,48,12,34,15],
        [21,15,15,7,6,0]],null);
      path(ctx,'#784f91',[[15,1],[25,-10,37,-10,45,0],[31,12,22,10,15,1]]);
      for (const [px,py] of [[44,-18],[56,-13],[39,12],[18,-10]]) dot(ctx,px,py,2.3,CREAM);
    });
    gem(ctx,128,122,5,8,GOLD,'#ffe8a4');
  },['garden','mask']],
  ['luna-moth-mask','Luna Moth Mask',ctx => {
    for (const [x,fl] of [[126,-1],[130,1]]) reflected(ctx,x,120,fl,()=>{
      path(ctx,'#a9cfac',[[0,0],[8,-21,27,-18,62,-32],[62,-7,48,1,41,7],[39,10,47,18,41,23],
        [38,29,26,29,32,44],[21,49,16,22,19,16],[5,15,3,7,0,0]]);
      path(ctx,'#86b0a3',[[12,-2],[27,-15,52,-22,59,-27],[46,-8,46,1,32,2],[19,2,19,14,33,22],[19,19,12,9,12,-2]],null);
      oval(ctx,25,4,10,8,'#674a78',INK,2);
      oval(ctx,25,4,5,4,'#f6df94',null);
      line(ctx,'#f1edc3',1.8,[8,-2],[29,-18,51,-20]);
    });
    oval(ctx,128,126,6,14,'#e2d08b',INK,2);
  },['night','animal']],
  ['northern-ski-goggles','Northern Ski Goggles',ctx => {
    strap(ctx,'#798dba');
    path(ctx,'#839acc',[[61,117],[70,100],[184,100],[195,117],[185,136],[71,136]]);
    path(ctx,'#c2e9ed',[[67,118],[77,105],[178,105],[189,118],[179,130],[77,130]],INK,2.4);
    path(ctx,'#688eab',[[73,123],[98,109],[116,125],[136,110],[168,122],[181,114],[181,130],[77,130]],null);
    path(ctx,'#eff9ea',[[91,116],[98,109],[105,118],[98,115],[97,119]],null);
    path(ctx,'#eff9ea',[[127,118],[136,110],[145,115],[137,115],[134,120]],null);
    highlight(ctx,94,107,11);
  },['winter','sports']],
  ['clockwork-double-monocle','Clockwork Double Monocle',ctx => {
    lensBridge(ctx,'#ad754b',121,21,4);
    for (const [x,size,fill] of [[98,18,'#f2ce7d'],[155,23,'#ba8b68']]) {
      for (let i=0;i<10;i++) translated(ctx,x,123,()=>{
        ctx.rotate(i*Math.PI/5);
        box(ctx,-3,-size-4,6,7,1,fill,INK,1.2);
      });
      oval(ctx,x,123,size,size,fill,INK,3);
      oval(ctx,x,123,size-5,size-5,'#c3d4cf78',INK,2.1);
      highlight(ctx,x-3,115,8);
    }
    line(ctx,'#ab754f',3,[176,134],[184,154,183,167]);
    gem(ctx,183,168,4,6,GOLD);
  },['clockwork','formal']],
  ['banana-split-shades','Banana Split Shades',ctx => {
    lensBridge(ctx,'#98653b',120,22,6);
    eyePair(ctx,(c,i) => {
      if (i) c.scale(-1,1);
      path(c,'#f5cf67',[[-25,-3],[-29,-12,-24,-18,-18,-14],[-16,-1,-3,5,8,3],
        [18,1,24,-1,27,-10],[30,7,14,13,2,15],[-9,15,-20,10,-25,-3]]);
      line(c,'#fff3a1',3,[-20,-5],[-18,6,-1,10],[10,10,17,7]);
      box(c,-27,-16,7,6,1,'#916643');
      dot(c,14,-4,3,RED);
    });
  },['food','funny']],
  ['comet-trail-specs','Comet-Trail Specs',ctx => {
    lensBridge(ctx,'#7a6598',120,18,5);
    for (const [x,fl] of [[99,-1],[155,1]]) reflected(ctx,x,123,fl,()=>{
      path(ctx,'#a18ad4',[[-18,-8],[3,-16],[28,-14],[47,-25],[41,-10],[49,-3],[34,3],[43,11],
        [25,12],[1,15],[-16,11]]);
      oval(ctx,0,0,17,12,'#504b8b',INK,2.2);
      star(ctx,2,-1,11,'#ffd77a',CREAM,4);
      line(ctx,'#baf6f0',2,[24,-4],[38,-12]);
    });
  },['space','magic']],
  ['flower-power-shades','Flower Power Shades',ctx => {
    lensBridge(ctx,'#694888',122,17,7);
    for (const [x,color] of [[99,'#c387dc'],[155,'#e58aa3']]) {
      flower(ctx,x,123,7,25,color,'#f6c967');
      oval(ctx,x,123,11,10,'#695b88',INK,2);
      highlight(ctx,x,118,7);
    }
  },['garden','retro']],
  ['checkerboard-racing-shades','Checkerboard Racing Shades',ctx => {
    lensBridge(ctx,'#6672a3',120,21,6);
    eyePair(ctx,c=>{
      pane(c,-25,-14,50,30,'#ece6df');
      for (let y=0;y<4;y++) for (let x=0;x<6;x++) {
        if ((x+y)%2===0) box(c,-20+x*7,-10+y*6,7,6,0,'#3f405d',null);
      }
      path(c,'#915e8e',[[1,-15],[18,-15],[27,-4],[20,8],[5,13],[10,1]],INK,1.8);
      line(c,CREAM,2,[6,-10],[15,-10]);
    });
  },['race','pattern']],
  ['crescent-moon-frames','Crescent Moon Frames',ctx => {
    lensBridge(ctx,'#86689f',120,22,4.5);
    for (const [x,fl] of [[99,-1],[155,1]]) reflected(ctx,x,123,fl,()=>{
      oval(ctx,0,0,17,13,'#615785a4','#744d82',2);
      path(ctx,'#f8d77e',[[4,-22],[20,-21,25,-10,25,2],[22,22,0,26,-10,18],
        [6,20,14,13,15,1],[14,-8,12,-16,4,-22]]);
      star(ctx,-5,-5,7,CYAN,CREAM,4);
      dot(ctx,28,-13,2.5,CREAM);
    });
  },['space','moon']],
  ['chalkboard-glasses','Chalkboard Glasses',ctx => {
    lensBridge(ctx,'#946775',120,20,6);
    for (const x of eyePositions) box(ctx,x-22,108,44,31,4,'#4d8178','#986b58',5);
    line(ctx,CREAM,2.1,[86,129],[95,115],[105,129]);
    line(ctx,CREAM,2.1,[90,123],[102,123]);
    line(ctx,'#ffe397',2.2,[146,121],[154,129],[165,115]);
    for (const [x,y] of [[111,115],[109,133],[143,132],[167,131]]) dot(ctx,x,y,1.8,CYAN);
  },['school','funny']],
  ['teardrop-safety-goggles','Teardrop Safety Goggles',ctx => {
    lensBridge(ctx,'#396a77',121,18,6);
    strap(ctx,'#6ba4a4');
    for (const [x,flip] of [[99,-1],[155,1]]) reflected(ctx,x,123,flip,()=>{
      path(ctx,'#9be1c7',[[0,-17],[17,-15,32,-6,25,9],[16,24,-12,20,-22,13],
        [-25,6,-16,-12,0,-17]]);
      path(ctx,'#4f818c',[[0,-12],[18,-14,27,-3,22,7],[13,15,-13,17,-17,7],
        [-18,0,-11,-10,0,-12]],INK,1.6);
      highlight(ctx,-3,-7,10);
      for (const [x,y] of [[11,7],[15,5],[18,3]]) dot(ctx,x,y,1.6,CREAM);
    });
  },['science','ocean']],
  ['bubble-wand-glasses','Bubble Wand Glasses',ctx => {
    lensBridge(ctx,'#af86c4',122,17,5);
    eyePair(ctx,c=>{
      oval(c,0,0,21,20,'#83bced6e','#6b659f',3.7);
      oval(c,0,0,18,17,null,'#eacfef',2.4);
      highlight(c,-2,-6,11);
    });
    for (const [x,y,r,fill] of [[62,104,9,MINT],[48,88,7,CYAN],[190,99,8,ROSE],[204,86,7,MINT],[211,103,4,CYAN]]) {
      oval(ctx,x,y,r,r,fill,'#7473a6',2);
      dot(ctx,x-2,y-3,1.5,CREAM);
    }
  },['party','bubbles']],
  ['hologram-hex-specs','Hologram Hex Specs',(ctx,t) => {
    lensBridge(ctx,'#7d8dbe',122,21,5);
    eyePair(ctx,c => {
      path(c,'#7cc7cfa2',[[-25,0],[-14,-16],[15,-16],[25,0],[15,16],[-14,16]],'#333754',3);
      path(c,null,[[-18,0],[-10,-11],[10,-11],[18,0],[10,11],[-10,11]],'#c6fff0',2.3);
      line(c,'#a8f6ea',1.4,[-19,0],[18,0]);
      const y = Math.sin(t*3)*6;
      line(c,'#e0fff1',1.7,[0,-10],[0,10]);
      dot(c,0,y,3.2,CREAM);
    });
  },['science','animated']],
  ['windshield-wiper-glasses','Windshield Wiper Glasses',(ctx,t) => {
    lensBridge(ctx,'#586d95',120,20,5);
    eyePair(ctx,(c,i) => {
      pane(c,-25,-16,50,33,'#a7cff1');
      for (const [x,y] of [[-16,-6],[-6,0],[3,-9],[14,-2],[17,9]]) line(c,'#d9fff2',2,[x,y-2],[x-3,y+2]);
      translated(c,0,13,() => {
        c.rotate(Math.sin(t*2+i*.2)*.63+.36);
        line(c,INK,3,[0,0],[-2,-17]);
        line(c,'#626988',4,[-12,-18],[8,-18]);
      });
    });
  },['weather','animated']],
  ['cat-eye-glasses','Cat-Eye Glasses',ctx => {
    lensBridge(ctx,'#693c68',120,15,4.6);
    for (const [x,flip] of [[99,-1],[155,1]]) reflected(ctx,x,123,flip,()=>{
      path(ctx,'#754a79',[[-19,-7],[1,-16,16,-8,32,-17],[29,9,14,19,4,15],[-13,17,-20,10,-19,-7]]);
      path(ctx,'#b697c1',[[-13,-3],[1,-10,15,-1,24,-8],[20,7,5,13,-3,9],[-16,11,-15,2,-13,-3]],null);
      highlight(ctx,2,-6,8);
      dot(ctx,24,-11,2.8,GOLD);
    });
  },['retro','formal']],
  ['cinema-double-feature','Cinema Double Feature',ctx => {
    lensBridge(ctx,'#d0a1c0',119,18,6);
    for (const [x,fill] of [[99,'#d17a88'],[155,'#68b9d3']]) {
      box(ctx,x-24,107,48,30,2,'#efe1d7');
      box(ctx,x-19,111,38,22,2,fill,INK,2);
      for (const dx of [-14,-5,4,13]) dot(ctx,x+dx,113,1.3,'#fff6da');
    }
    path(ctx,'#8f648c',[[60,106],[66,106],[66,129],[59,129]],INK,1.5);
    path(ctx,'#8f648c',[[191,106],[197,106],[197,129],[190,129]],INK,1.5);
  },['cinema','retro']],
  ['candy-cane-spectacles','Candy Cane Spectacles',ctx => {
    lensBridge(ctx,'#b94b6a',119,20,5);
    eyePair(ctx,c=>{
      oval(c,0,0,21,20,'#fef0dd4d',INK,5);
      oval(c,0,0,21,20,null,CREAM,3.6);
      c.save();
      c.setLineDash([5,5]);
      oval(c,0,0,21,20,null,'#dc7189',3.6);
      c.restore();
      highlight(c,-1,-7,10);
    });
    path(ctx,MINT,[[118,109],[122,99],[129,107],[136,98],[139,109],[132,117],[125,116]],INK,1.8);
    dot(ctx,128,110,3,GOLD);
  },['food','winter']],
  ['magic-keyhole-mask','Magic Keyhole Mask',ctx => {
    path(ctx,'#ba9967',[[62,126],[61,105],[81,90],[105,94],[128,103],[154,91],[179,96],[193,107],[193,126],
      [172,145],[150,144],[128,134],[108,145],[85,144]]);
    eyePair(ctx,c=>{
      path(c,'#564063',[[0,-15],[12,-15,13,-3,6,3],[12,13],[-12,13],[-5,3],
        [-14,-7,-8,-15,0,-15]],INK,2.5);
      dot(c,0,-5,5,'#a6e6d2');
      line(c,'#c7f2c6',1.8,[0,0],[0,8]);
    });
    for (const [x,y] of [[70,116],[76,106],[128,112],[180,105],[185,115]]) star(ctx,x,y,3.6,CREAM,null,4);
  },['magic','mask']],
  ['robot-scanner','Robot Scanner',(ctx,t) => {
    strap(ctx,'#726d8f');
    path(ctx,'#8f91b0',[[64,108],[88,101],[166,101],[193,106],[195,131],[179,142],[76,142],[61,130]]);
    box(ctx,72,111,111,20,5,'#39495c',INK,3);
    const scan = 128+Math.sin(t*2)*40;
    box(ctx,76,118,103,6,1,'#72c5bc',null);
    dot(ctx,scan,121,7,'#ccf7a1');
    for (const x of [68,188]) dot(ctx,x,132,3.6,'#ddad7e');
  },['robot','animated']],
  ['starburst-gala-glasses','Starburst Gala Glasses',ctx => {
    lensBridge(ctx,'#a26988',123,19,5);
    for (const [x,fill,shade] of [[99,'#e8bc71','#77578c'],[155,'#d482b2','#664d8c']]) {
      star(ctx,x,123,28,fill,INK,5);
      star(ctx,x,123,18,shade,INK,5);
      star(ctx,x-4,120,7,'#f8dbaa',null,4);
      dot(ctx,x+7,123,2,CREAM);
    }
  },['party','space']],
  ['masquerade-feather-mask','Masquerade Feather Mask',ctx => {
    path(ctx,'#734d8e',[[61,111],[89,96,104,101,128,109],[151,101,174,96,195,111],[184,138],[165,147],
      [145,146],[127,136],[109,145],[86,148],[69,139],[61,111]]);
    path(ctx,'#b374ac',[[72,116],[81,104,106,106,125,118],[143,105,168,103,184,114],[167,130,147,136,127,128],
      [103,136,94,135,72,116]],null);
    eyePair(ctx,c => path(c,'#e8c9d0',[[-16,0],[-7,-9,8,-9,17,0],[7,10,-7,9,-16,0]],INK,2.1));
    for (const [x,y,fill] of [[68,119,ROSE],[62,108,CYAN],[73,104,VIOLET],[55,96,MINT]]) {
      path(ctx,fill,[[x+10,y+12],[x-9,y+5,x-15,y-17],[x+8,y-18,x+13,y+2],[x+10,y+12]],INK,1.7);
      line(ctx,CREAM,1.4,[x-7,y-12],[x+7,y+8]);
    }
    gem(ctx,128,116,6,9,GOLD,'#ffeea5');
  },['formal','mask']],
  ['welder-flip-goggles','Welder Flip Goggles',ctx => {
    goggles(ctx,'#9b7f78','#623e58',{wide:24,high:19});
    path(ctx,'#586079',[[75,110],[62,91],[73,86],[109,89],[123,106],[119,114]]);
    path(ctx,'#a6c4bd',[[76,107],[67,93],[77,90],[109,94],[116,106]],INK,2);
    line(ctx,CREAM,2,[73,96],[93,96]);
    for (const [x,y] of [[86,111],[111,136],[142,113],[167,135]]) dot(ctx,x,y,2.4,GOLD);
    line(ctx,'#ade9c9',3,[144,116],[158,111,168,117]);
  },['garage','science']],
  ['bird-beak-mask','Bird Beak Mask',ctx => {
    path(ctx,'#66558e',[[60,121],[77,101],[101,95],[131,111],[154,99],[178,99],[199,116],
      [185,140],[163,145],[131,133],[103,147],[80,140]]);
    eyePair(ctx,c=>{
      oval(c,0,0,17,12,'#d9c9e4',INK,2.3);
      oval(c,0,0,9,8,'#a183b0',INK,2);
      dot(c,2,0,3.2,INK);
    });
    path(ctx,'#e6ac67',[[114,121],[131,112],[144,126],[143,149],[128,159],[120,143]]);
    path(ctx,'#f5ce83',[[124,123],[131,116],[141,126],[137,144],[128,151]],null);
    line(ctx,'#87596e',2,[131,118],[132,142]);
  },['animal','mask']]
]);

function hairCap(ctx, fill, light) {
  path(ctx,fill,[[59,104],[54,76,70,50,92,38],[112,26,143,28,166,38],
    [191,50,203,76,195,105],[175,89,170,68,154,62],[130,81,108,73,91,79],
    [80,88,72,102,59,104]]);
  if (light) line(ctx,light,3.4,[69,78],[85,48,115,41],[139,32,163,46]);
}

function sweep(ctx, fill, strokes) {
  path(ctx,fill,[[60,109],[57,85,62,66,77,51],[94,29,124,23,146,33],[185,32,202,66,194,96],
    [170,87,158,60,147,62],[130,82,110,87,91,86],[77,87,70,99,60,109]]);
  for (const [color,width,...points] of strokes) line(ctx,color,width,...points);
}

function hairCurl(ctx, x, y, radius, base, light) {
  oval(ctx,x,y,radius,radius*.92,base,INK,2.3);
  line(ctx,light,2.5,[x-radius*.58,y+1],[x-radius*.7,y-radius*.59,x,y-radius*.59],
    [x+radius*.65,y-radius*.57,x+radius*.47,y+2],[x+radius*.25,y+radius*.61,x-2,y+3]);
}

function braid(ctx, x, y, angle, base, shade, light, segments = 6) {
  translated(ctx,x,y,() => {
    ctx.rotate(angle);
    for (let index=0; index<segments; index++) {
      const taper = 1 - index*.064, ty = index*13;
      oval(ctx,0,ty,13*taper,10*taper,index%2 ? base : shade,INK,2.3,index%2 ? .48 : -.48);
      line(ctx,light,2,[index%2 ? -6 : 5,ty-3],[index%2 ? 6 : -5,ty+4]);
    }
    box(ctx,-7,segments*13-8,14,7,2,'#e6bd79',INK,1.8);
    path(ctx,base,[[-4,segments*13-2],[7,segments*13-2],[4,segments*13+12],[-6,segments*13+10]],INK,1.8);
  });
}

function curlTail(ctx, x, y, flip, fill, light) {
  reflected(ctx,x,y,flip,()=>{
    path(ctx,fill,[[0,0],[36,-12,49,13,33,40],[19,62,5,68,22,83],
      [4,95,-15,80,-10,61],[-6,42,3,34,7,26],[13,12,4,9,0,0]]);
    line(ctx,light,3,[11,4],[33,11,23,39],[2,65,-2,73]);
  });
}

const hair = makeItems('hair', [
  ['rainbow-lightning-hair','Rainbow Lightning Hair',(ctx,t) => {
    path(ctx,'#6a4d9b',[[61,112],[49,82],[62,74],[54,53],[77,55],[70,29],[96,36],[108,10],
      [124,31],[146,9],[151,33],[177,24],[167,46],[198,38],[186,59],[209,61],
      [195,73],[205,89],[183,87],[165,74],[152,95],[129,89],[106,103],[96,90],[61,112]]);
    const bands = [
      [ROSE,[62,88],[79,66],[75,51],[94,57],[106,34],[116,46],[138,18]],
      ['#edb583',[65,94],[87,71],[80,63],[99,68],[112,44],[123,53],[144,27]],
      [GOLD,[71,96],[93,79],[91,73],[108,76],[121,55],[133,59],[151,37]],
      [MINT,[79,95],[106,84],[115,87],[133,68],[146,69],[164,47]],
      [CYAN,[91,94],[117,87],[126,91],[148,74],[166,75],[189,57]]
    ];
    for (const [color,...points] of bands) line(ctx,color,4.8,...points);
    const flicker = 2*Math.sin(t*2.8);
    star(ctx,47,62+flicker,7,GOLD,null,4);
    star(ctx,182,29-flicker,7,CYAN,null,4);
  },['neon','animated']],
  ['flaming-hair','Flaming Hair',(ctx,t) => {
    for (const [x,y,h,w,fill] of [[65,88,45,15,RED],[82,73,53,16,CORAL],[104,70,54,17,'#e95d57'],
      [127,68,61,20,RED],[153,71,54,18,CORAL],[177,77,42,14,'#e95d57'],[193,88,43,12,'#ec8860']]) {
      flame(ctx,x,y,h+Math.sin(t*4+x)*4,w,fill,'#ffce69');
    }
    path(ctx,'#cc5362',[[60,105],[65,79],[90,65],[127,52],[154,61],[186,72],[195,103],
      [177,95],[164,76],[145,71],[133,88],[111,84],[97,92],[79,91],[60,105]]);
    line(ctx,'#ffd778',4,[69,87],[105,59,128,65],[159,58,183,88]);
    for (const [x,y] of [[54,29],[179,20],[197,42]]) dot(ctx,x,y,3+Math.sin(t*3+y),GOLD);
  },['fire','animated']],
  ['lightning-bolt-hair','Lightning Bolt Hair',ctx => {
    path(ctx,'#486cba',[[59,109],[54,81],[76,66],[67,57],[103,39],[91,24],[128,24],[135,9],[152,21],
      [177,12],[176,37],[203,36],[190,62],[198,76],[191,104],[174,83],
      [158,70],[137,82],[119,74],[96,92],[74,89],[59,109]]);
    path(ctx,'#c2ffff',[[166,20],[114,54],[144,51],[106,83],[166,50],[139,49],[179,20]],'#4677c0',2.8);
    line(ctx,'#88ccee',3,[67,88],[99,72],[86,69],[117,56]);
    for (const [x,y] of [[54,51],[192,26],[214,67],[89,20]]) star(ctx,x,y,5,GOLD,null,4);
  },['weather','neon']],
  ['cosmic-purple-hair','Cosmic Purple Hair',ctx => {
    curlTail(ctx,71,65,-1,'#694787','#ad87d2');
    curlTail(ctx,184,62,1,'#694787','#ad87d2');
    sweep(ctx,'#7955a8',[
      ['#ae85d7',5,[61,91],[85,47,125,43],[170,35,190,70]],
      ['#9d6ec8',4,[75,86],[108,59,144,50],[166,47,180,62]],
      ['#d9b6f6',3,[78,64],[116,36,156,43]]
    ]);
    for (const [x,y,r] of [[72,96,4],[105,55,6],[147,38,5],[172,60,5],[192,123,7],[60,125,4]]) star(ctx,x,y,r,CREAM,null,4);
    oval(ctx,125,47,7,7,'#e7bcdb',INK,1.2);
    line(ctx,'#93d3df',1.8,[113,49],[124,42,141,49]);
  },['space','rare']],
  ['neon-green-curls','Neon Green Curls',ctx => {
    hairCap(ctx,'#589972',null);
    for (const [x,y,r] of [[68,84,21],[75,57,23],[95,38,24],[119,31,23],[144,32,25],
      [165,43,23],[183,63,23],[192,87,16],[105,64,22],[136,61,24],[161,71,17]])
      hairCurl(ctx,x,y,r,'#90df82','#e4fba6');
    for (const [x,y] of [[61,57],[100,24],[142,19],[175,48],[203,79]]) dot(ctx,x,y,3.3,'#fbffb1');
  },['neon','garden']],
  ['electric-blue-spikes','Electric Blue Spikes',ctx => {
    path(ctx,'#416bbd',[[58,107],[54,80],[42,56],[67,63],[62,31],[88,44],[92,10],[109,35],
      [130,11],[141,37],[168,8],[166,41],[195,27],[180,54],[207,47],[197,73],[198,106],
      [175,94],[171,70],[150,76],[128,70],[112,86],[88,83],[75,101],[58,107]]);
    for (const [start,end,jag] of [[[70,77],[74,35],[88,54]],[[102,63],[100,18],[115,44]],[[137,54],[166,16],[158,40]],[[168,72],[193,34],[182,57]]]) {
      line(ctx,'#99e9fc',4,end,jag,start);
    }
    line(ctx,'#8d99ea',2,[67,94],[110,72,141,64],[171,60,186,79]);
  },['neon','science']],
  ['viking-battle-braids','Viking Battle Braids',ctx => {
    braid(ctx,70,82,.18,'#e2b16e','#b78560','#f6d4a0',7);
    braid(ctx,187,81,-.2,'#e4b970','#ae795a','#f8dba5',7);
    hairCap(ctx,'#c7935e','#f0c493');
    for (const [x,y] of [[82,62],[103,49],[126,43],[147,46],[171,61]]) {
      oval(ctx,x,y,12,6,'#e5b672','#8f6355',1.6,.2);
    }
    line(ctx,'#94694f',2,[126,39],[137,57],[129,68]);
    gem(ctx,71,108,4,5,CYAN);
    gem(ctx,187,107,4,5,CYAN);
  },['history','norse']],
  ['galaxy-hair','Galaxy Hair',ctx => {
    path(ctx,'#483b76',[[59,126],[41,101,57,68,62,57],[78,34,104,22,127,24],
      [150,19,183,39,198,62],[213,82,211,103,198,119],[200,90,177,67,155,67],
      [135,67,122,89,112,92],[100,84,82,71,66,96],[62,108,59,126]]);
    const gal = ctx.createLinearGradient(63,40,194,92);
    for (const [p,c] of [[0,'#b789e5'],[.33,'#ef90c4'],[.64,'#7587da'],[1,'#80dbc6']]) gal.addColorStop(p,c);
    line(ctx,gal,9,[61,86],[92,48,127,42],[163,36,189,66],[197,78,201,94]);
    line(ctx,'#bb8bda',4,[67,92],[110,78,128,56],[158,45,180,76]);
    for (const [x,y,r] of [[75,74,4],[99,56,5],[122,37,3],[157,49,4],[178,63,6],[182,80,3],[65,108,5]]) star(ctx,x,y,r,CREAM,null,4);
    oval(ctx,148,56,7,5,'#b8a1e9',null);
    line(ctx,'#f7d8ec',1.2,[137,59],[150,52,160,53]);
  },['space','legendary']],
  ['golden-glowing-hair','Golden Glowing Hair',(ctx,t) => {
    ctx.save();
    ctx.globalAlpha=.58+.12*Math.sin(t*2.5);
    oval(ctx,126,61,80,52,'#ffc95d4f',null);
    ctx.restore();
    sweep(ctx,'#c18d51',[
      ['#f6c96d',9,[66,95],[88,68,113,60],[152,38,184,64]],
      ['#fee798',6,[66,81],[108,41,153,45],[171,46,189,64]],
      ['#deaa62',5,[105,80],[148,57,174,69],[187,87]]
    ]);
    for (const [x,y,r] of [[42,45,8],[70,31,5],[163,18,7],[199,37,9],[213,71,4]]) star(ctx,x,y,r,'#fff3b4',null,4);
  },['shiny','animated']],
  ['jelly-braids','Jelly Braids',ctx => {
    braid(ctx,70,73,.26,'#a16fce','#d897d4','#f9d6f4',7);
    braid(ctx,182,73,-.25,'#6caace','#9bd8df','#e3ffda',7);
    hairCap(ctx,'#a185c9','#efb9e6');
    line(ctx,'#f6d8f2',5,[69,86],[78,50,106,44],[125,39,140,43]);
    line(ctx,'#ade8e6',5,[147,41],[174,49,187,74]);
    for (const [x,y,c] of [[59,119,GOLD],[187,118,CORAL],[61,141,MINT],[189,148,GOLD]]) dot(ctx,x,y,4,c);
  },['funny','neon']],
  ['space-bun-satellites','Space Bun Satellites',ctx => {
    for (const [x,y,fill] of [[70,48,'#7466ac'],[190,46,'#6669a4']]) {
      oval(ctx,x,y,28,28,fill,INK,3);
      line(ctx,'#b4a5da',4,[x-17,y+3],[x-15,y-17,x+5,y-15],[x+19,y-14,x+19,y]);
    }
    sweep(ctx,'#8270b7',[
      ['#c7a7e5',4,[68,89],[99,48,131,43],[168,47,183,79]],
      ['#aab0e9',3,[104,77],[135,63,159,57]]
    ]);
    oval(ctx,70,49,36,9,null,CYAN,3,-.27);
    oval(ctx,189,45,37,9,null,GOLD,3,.3);
    star(ctx,213,31,7,MINT,null,4);
    star(ctx,39,35,7,GOLD,null,4);
  },['space','toy']],
  ['waterfall-hair','Waterfall Hair',ctx => {
    curlTail(ctx,82,74,-1,'#5397c2','#a2e6e9');
    curlTail(ctx,177,76,1,'#4a94bc','#9de1e8');
    hairCap(ctx,'#507ba4',null);
    path(ctx,'#6bbacb',[[79,80],[104,27,136,24,159,36],[181,39,190,64,188,79],[165,69,159,51,132,50],
      [104,57,111,78,79,80]],'#3e6f99',2.3);
    line(ctx,'#bbfbef',4,[65,83],[83,47,118,41],[149,30,173,49]);
    for (const [x,y] of [[59,124],[71,143],[193,121],[205,138]]) path(ctx,CYAN,[[x,y-8],[x+8,y+4,x,y+8],[x-8,y+4,x,y-8]],'#527ca4',1.6);
  },['water','nature']],
  ['whipped-cream-quiff','Whipped Cream Quiff',ctx => {
    path(ctx,'#ead9da',[[61,110],[58,89,72,77,84,72],[60,52,84,35,109,45],[83,30,105,13,129,39],
      [118,13,144,10,152,27],[175,29,195,44,199,69],[204,83,187,98,178,96],
      [154,74,138,70,130,73],[111,97,82,85,61,110]]);
    line(ctx,'#b597b8',3.5,[81,65],[100,54,125,56],[155,77,182,67]);
    line(ctx,'#ffffff',5,[96,40],[123,42,136,55],[154,63,170,57]);
    line(ctx,'#f7abbb',4,[71,83],[101,72,116,75],[137,65,164,71]);
    dot(ctx,148,16,8,RED);
    line(ctx,INK,2,[145,14],[150,4,158,8]);
  },['food','funny']],
  ['orchid-braid-bob','Orchid Braid Bob',ctx => {
    path(ctx,'#625075',[[59,130],[42,96,55,53,74,46],[92,26,156,17,183,49],
      [202,69,207,107,195,142],[168,141],[185,103,173,69,154,62],[121,81,110,83,71,95],
      [80,111,78,125,70,140]]);
    line(ctx,'#a388b8',5,[59,108],[66,56,111,43],[165,36,190,80]);
    for (const [x,y,fill] of [[175,73,ROSE],[185,90,'#e3b8df'],[181,57,'#bc8cd7']]) flower(ctx,x,y,5,13,fill,GOLD);
    for (const [x,y] of [[68,74],[76,65],[85,57],[97,52],[110,47]]) oval(ctx,x,y,7,4,'#a8729c',INK,1.5,-.5);
  },['garden','formal']],
  ['checkered-flag-fringe','Checkered Flag Fringe',ctx => {
    hairCap(ctx,'#584669',null);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(60,100);
    ctx.bezierCurveTo(62,38,117,21,162,36);
    ctx.bezierCurveTo(189,43,197,72,190,87);
    ctx.bezierCurveTo(166,79,142,61,117,81);
    ctx.lineTo(63,102);
    ctx.clip();
    for (let y=28;y<107;y+=9) for (let x=56;x<198;x+=10) {
      const index = ((x-56)/10+(y-28)/9)%2;
      box(ctx,x,y,10,9,0,index ? '#f4e8dc' : '#654d82',null);
    }
    ctx.restore();
    line(ctx,'#d297b8',4,[64,91],[93,52,126,50],[166,50,190,75]);
    line(ctx,'#343055',3,[71,99],[118,81,147,70],[165,77,186,87]);
  },['race','pattern']],
  ['cotton-candy-puffs','Cotton Candy Puffs',ctx => {
    for (const [x,y,r,fill] of [[65,65,26,'#c58ee3'],[77,43,28,'#df9cd1'],[100,32,27,'#eeb2d7'],
      [131,35,30,'#efa4ca'],[157,39,29,'#c095de'],[182,57,27,'#9daede'],[194,80,17,'#9bc8e6'],[111,61,22,'#f6c5e5'],[146,64,24,'#d5b7e7']]) oval(ctx,x,y,r,r*.85,fill,INK,2.4);
    line(ctx,'#fff0ed',3.5,[69,58],[79,37,100,38],[118,26,135,37]);
    line(ctx,'#fff0ed',3,[154,47],[168,42,185,57]);
    for (const [x,y,c] of [[72,25,CYAN],[191,33,GOLD],[61,80,VIOLET],[152,76,MINT]]) star(ctx,x,y,5.5,c,null,4);
  },['food','party']],
  ['tornado-swirl-cut','Tornado Swirl Cut',ctx => {
    path(ctx,'#7d749d',[[61,102],[65,85,93,77,105,65],[71,62,72,45,113,39],
      [82,30,103,6,138,11],[178,11,196,25,174,39],[157,50,145,41,136,49],
      [171,47,194,62,184,75],[174,91,144,78,127,89],[110,87,97,115,61,102]]);
    line(ctx,'#dcd4ec',5,[99,27],[139,9,177,23],[153,34,126,36]);
    line(ctx,'#bcdde2',4,[90,53],[126,46,157,54],[183,62,168,71],[134,73,107,80]);
    line(ctx,'#ebe1f4',3,[71,94],[98,101,124,80],[157,68,178,74]);
    for (const [x,y,r] of [[65,40,5],[191,44,6],[204,60,3],[76,26,3]]) star(ctx,x,y,r,CYAN,null,4);
  },['weather','magic']],
  ['volcano-mohawk','Volcano Mohawk',ctx => {
    path(ctx,'#764e6d',[[80,105],[82,78],[94,64],[87,54],[105,45],[109,27],[120,33],[125,14],
      [141,24],[155,20],[149,40],[168,47],[158,62],[172,76],[170,95],[156,86],[147,94],
      [126,84],[115,95],[98,84],[80,105]]);
    path(ctx,'#e57766',[[120,27],[123,54,118,67],[133,60],[140,80],[144,57],[151,61],
      [147,37],[154,22],[138,27],[128,18]],INK,2);
    line(ctx,'#f9c97a',3.8,[130,22],[133,39,131,52],[141,67]);
    for (const [x,y] of [[109,11],[151,7],[163,22],[112,21]]) dot(ctx,x,y,2.6,GOLD);
    for (const x of [94,159]) line(ctx,'#a188a3',2.6,[x,77],[x+5,69]);
  },['fire','rare']],
  ['moonlit-pigtail-curls','Moonlit Pigtail Curls',ctx => {
    curlTail(ctx,70,79,-1,'#766997','#b9acd8');
    curlTail(ctx,185,77,1,'#766997','#b9acd8');
    sweep(ctx,'#625a86',[
      ['#9c93ca',4.5,[62,90],[101,43,136,39],[177,44,193,78]],
      ['#d4c7e4',3,[85,78],[122,56,158,54]]
    ]);
    for (const [x,y] of [[63,82],[191,82]]) {
      path(ctx,CREAM,[[x,y-13],[x-14,y-4,x-9,y+7],[x,y+15,x+9,y+5],[x-2,y+7,x-3,y+2],[x-5,y-5,x,y-13]],INK,2);
      star(ctx,x+5,y-6,4,CYAN,null,4);
    }
  },['space','sleep']],
  ['lemon-sherbet-waves','Lemon Sherbet Waves',ctx => {
    path(ctx,'#e9b767',[[57,107],[49,81,65,61,84,61],[61,41,82,24,115,39],[105,19,137,17,147,36],
      [161,22,186,39,181,53],[201,59,210,76,197,100],[173,103,165,79,154,77],
      [142,88,125,91,115,78],[111,95,90,100,81,83],[65,88,69,103,57,107]]);
    line(ctx,'#fff4b3',7,[65,78],[77,62,106,69],[132,67,113,44],[95,40,87,45]);
    line(ctx,'#ffdfa1',5,[131,43],[145,51,162,49],[178,54,180,69],[191,70,194,82]);
    line(ctx,'#a27562',2,[62,92],[76,95,80,84]);
    for (const [x,y] of [[116,37],[162,38],[180,59]]) dot(ctx,x,y,2.8,CREAM);
  },['food','sunshine']],
  ['storm-cloud-afro','Storm Cloud Afro',ctx => {
    for (const [x,y,rx,ry] of [[64,75,22,22],[72,51,24,23],[99,37,27,25],[126,32,32,28],
      [155,37,29,26],[181,49,23,23],[192,72,21,23],[105,65,27,24],[146,66,28,25]])
      oval(ctx,x,y,rx,ry,'#625c9b',INK,2.3);
    line(ctx,'#aaa6d7',4,[60,62],[68,38,93,43],[103,18,126,27],[153,21,163,45],[184,37,194,62]);
    path(ctx,GOLD,[[98,66],[89,85],[102,84],[89,104],[111,82],[100,83],[110,68]],INK,1.5);
    path(ctx,'#9ee8f4',[[176,77],[166,87],[177,87],[173,100],[189,83],[180,83],[184,76]],INK,1.5);
    for (const [x,y] of [[57,98],[193,104],[202,90]]) dot(ctx,x,y,2.8,CYAN);
  },['weather','magic']],
  ['autumn-leaf-locks','Autumn Leaf Locks',ctx => {
    curlTail(ctx,75,76,-1,'#815671','#bb7772');
    curlTail(ctx,184,76,1,'#8b5774','#c88176');
    hairCap(ctx,'#965b70','#cd8d81');
    const leaves = [[64,70,-.72,RED],[78,49,-.4,'#e9915f'],[105,42,-.24,GOLD],[132,40,.14,'#d68765'],
      [152,46,.42,'#f2b272'],[177,62,.65,'#bc746e'],[184,82,.65,'#e8a46b'],[65,108,-.6,GOLD]];
    for (const [x,y,tilt,fill] of leaves) translated(ctx,x,y,()=>{
      ctx.rotate(tilt);
      path(ctx,fill,[[0,14],[-12,9],[-7,4],[-14,-2],[-7,-5],[-10,-13],[0,-10],[6,-18],
        [11,-10],[9,-4],[14,1],[7,4],[10,7]],INK,1.6);
      line(ctx,'#79566c',1.2,[0,14],[4,-9]);
    });
  },['nature','autumn']],
  ['bubblegum-layered-hair','Bubblegum Layered Hair',ctx => {
    path(ctx,'#c9619a',[[59,113],[43,91,62,71,70,68],[45,52,74,29,103,34],[106,18,144,23,156,38],
      [181,29,199,45,195,65],[213,85,198,116,191,120],[172,100,172,82,158,74],
      [144,88,130,83,118,76],[102,92,92,84,80,76],[68,89,78,104,59,113]]);
    line(ctx,'#f6a2c9',6,[58,86],[91,55,113,57],[137,67,165,54],[185,53,197,76]);
    line(ctx,'#ffdbed',4,[67,68],[96,44,137,44],[165,47,176,58]);
    for (const [x,y,r] of [[59,57,9],[191,86,12],[211,72,6],[74,108,4]]) oval(ctx,x,y,r,r,'#eaaecc','#8f5684',1.7);
    dot(ctx,187,82,2.5,CREAM);
  },['food','funny']],
  ['opal-ribbon-cut','Opal Ribbon Cut',ctx => {
    sweep(ctx,'#bcb6d7',[
      ['#654f85',8,[61,98],[80,65,110,57],[162,44,187,65]],
      ['#e6c7e5',6,[68,104],[84,80,120,78],[145,68,173,70],[184,77,187,83]],
      ['#8ac6bf',5,[65,80],[112,37,150,42],[178,46,187,65]],
      ['#f3dfab',4,[77,62],[100,45,120,43]]
    ]);
    gem(ctx,165,64,14,17,'#9a95cc','#c3f6e0');
    for (const x of [150,179]) star(ctx,x,64,4,CREAM,null,4);
  },['opulent','magic']],
  ['circuit-board-bob','Circuit Board Bob',ctx => {
    path(ctx,'#325f65',[[60,136],[49,117],[54,63],[68,43],[96,27],[152,27],[181,39],[198,56],[204,114],[194,136],
      [174,139],[183,85],[155,74],[139,84],[111,81],[78,88],[79,137]]);
    const traces = [
      [[62,117],[65,71],[81,55],[98,55],[105,47],[118,47]],
      [[77,112],[78,73],[91,72],[110,60],[123,61]],
      [[194,120],[188,68],[168,54],[159,54],[150,49],[135,49]],
      [[180,106],[181,79],[162,68],[147,68],[132,75]]
    ];
    for (const pts of traces) {
      line(ctx,'#8edaab',2.4,...pts);
      const [xa,ya] = pts[0], [xb,yb] = pts.at(-1);
      dot(ctx,xa,ya,3.2,'#e5d98b');
      dot(ctx,xb,yb,3.2,'#e5d98b');
    }
    box(ctx,123,31,30,15,3,'#628d91',INK,2);
    for (const x of [128,133,138,143,148]) dot(ctx,x,37,1.4,CYAN);
  },['technology','neon']],
  ['glass-comb-cut','Glass Comb Cut',ctx => {
    path(ctx,'#9bc4e8',[[58,108],[62,72],[74,37],[92,31],[99,38],[117,20],[128,25],[134,39],
      [149,19],[162,22],[173,42],[186,36],[196,51],[197,87],[190,104],[172,76],[151,72],
      [142,80],[122,72],[95,90],[77,89],[58,108]]);
    const segments = [
      ['#576d97',[[66,91],[74,51],[93,32],[89,67],[82,88]]],
      ['#cfeeee',[[94,82],[98,50],[113,28],[127,25],[125,63]]],
      ['#597cae',[[123,72],[134,48],[150,24],[160,30],[151,72]]],
      ['#dce6f1',[[160,74],[172,57],[187,41],[194,53],[190,92]]]
    ];
    for (const [fill,pts] of segments) path(ctx,fill,pts,'#577599',1.7);
    line(ctx,CREAM,2.3,[71,78],[89,49]);
    line(ctx,CREAM,2.3,[106,64],[119,36]);
    line(ctx,CREAM,2.3,[164,68],[185,49]);
  },['ice','rare']],
  ['bee-hive-bouffant','Bee Hive Bouffant',ctx => {
    path(ctx,'#c79557',[[62,105],[55,85,70,73,75,68],[61,46,81,27,96,27],
      [109,9,140,10,154,25],[178,21,191,46,181,59],[198,69,195,92,187,100],
      [177,91,169,77,154,73],[143,83,134,80,124,75],[107,86,89,80,83,87],[73,91,69,99,62,105]]);
    for (const [x,y,w] of [[88,57,82],[96,41,66],[111,27,41],[71,75,113]]) line(ctx,'#f5cf78',4,[x,y],[x+w*.5,y-12,x+w,y]);
    for (const [x,y,angle] of [[67,49,-.3],[180,42,.24],[153,28,.2]]) translated(ctx,x,y,()=>{
      ctx.rotate(angle);
      oval(ctx,-4,-6,6,4,'#e4fceb',INK,1);
      oval(ctx,5,-6,6,4,'#e4fceb',INK,1);
      oval(ctx,0,1,9,5,GOLD,INK,1.4);
      for (const px of [-3,3]) line(ctx,INK,1.4,[px,-3],[px,4]);
    });
  },['animal','garden']],
  ['snowflake-fade','Snowflake Fade',ctx => {
    path(ctx,'#6d88bb',[[60,105],[59,74,72,50,88,43],[114,28,136,30,154,41],
      [174,40,189,54,193,68],[188,85],[170,66],[154,71],[135,65],[109,74],[88,85],[73,85],[60,105]]);
    line(ctx,'#c2d6ed',6,[63,91],[89,55,132,50],[167,48,187,65]);
    for (const [x,y,r] of [[86,61,12],[122,53,14],[157,57,11],[178,69,6]]) {
      for (let axis=0;axis<3;axis++) translated(ctx,x,y,()=>{
        ctx.rotate(axis*Math.PI/3);
        line(ctx,'#f0fff4',2,[0,-r],[0,r]);
        line(ctx,'#c6f9ed',1.4,[-3,-r*.52],[0,-r*.67],[3,-r*.52]);
        line(ctx,'#c6f9ed',1.4,[-3,r*.52],[0,r*.67],[3,r*.52]);
      });
    }
  },['winter','ice']],
  ['dragon-scale-crest','Dragon Scale Crest',ctx => {
    path(ctx,'#65558b',[[66,110],[72,65],[86,72],[81,43],[103,53],[98,22],[121,34],
      [124,11],[147,27],[151,15],[164,43],[180,32],[182,62],[197,53],[192,108],
      [170,83],[150,86],[135,77],[113,88],[87,89],[66,110]]);
    for (const [x,y,r,c] of [[102,63,17,'#9674b3'],[135,50,21,'#689aa8'],[160,66,17,'#9086bf'],[127,74,15,'#a27dbf'],[168,46,11,'#bc86ad'],[84,78,13,'#78acb4']]) {
      path(ctx,c,[[x-r,y-r*.25],[x,y-r],[x+r,y-r*.25],[x+r*.7,y+r*.55],[x,y+r],[x-r*.7,y+r*.55]],INK,1.7);
      line(ctx,'#d9f2de',1.8,[x-r*.56,y-r*.26],[x,y-r*.62],[x+r*.44,y-r*.3]);
    }
  },['dragon','magic']],
  ['maple-bun-with-chopsticks','Maple Bun with Chopsticks',ctx => {
    oval(ctx,146,34,33,26,'#955e73');
    path(ctx,'#bc756e',[[59,110],[61,66,82,47,110,40],[157,26,187,57,195,77],
      [185,96],[168,75],[150,63],[126,84],[107,77],[82,89],[71,99],[59,110]]);
    line(ctx,'#e6aa8e',4,[63,88],[90,58,122,51],[171,41,185,71]);
    line(ctx,'#502f52',7,[123,23],[176,5]);
    line(ctx,'#f6da9a',3.5,[123,23],[176,5]);
    line(ctx,'#502f52',7,[135,27],[194,13]);
    line(ctx,'#f6da9a',3.5,[135,27],[194,13]);
    for (const [x,y] of [[124,25],[135,28],[177,5],[194,13]]) dot(ctx,x,y,3,'#a2d6c0');
  },['formal','rare']],
  ['dandelion-fluff-hair','Dandelion Fluff Hair',ctx => {
    hairCap(ctx,'#b6ad9b',null);
    for (const [x,y,r] of [[67,78,21],[77,53,24],[100,43,23],[124,34,26],[149,45,23],[173,52,25],[191,78,19],[121,59,22],[153,68,18]]) {
      oval(ctx,x,y,r,r*.78,'#f8edcf','#9e889b',1.7);
      for (const n of [0,1,2]) {
        const px = x+(n-1)*r*.36;
        line(ctx,'#fffdf0',2.2,[px-2,y+5],[px+5,y-7]);
      }
    }
    for (const [x,y] of [[50,51],[189,31],[205,46],[39,78]]) {
      line(ctx,'#a290a8',1.5,[x,y+5],[x+3,y-3]);
      star(ctx,x+3,y-3,4,CREAM,'#9e889b',4);
    }
  },['garden','nature']],
  ['campfire-curls','Campfire Curls',ctx => {
    hairCap(ctx,'#a75d65','#efb47e');
    for (const [x,y,r] of [[66,83,19],[75,59,20],[91,49,18],[110,39,22],[135,41,22],[158,47,23],[177,63,22],[192,86,16]]) {
      hairCurl(ctx,x,y,r,'#c27068','#eaa375');
    }
    for (const [x,y] of [[77,43],[103,34],[127,36],[153,41],[178,57]]) {
      line(ctx,'#ffd77a',3,[x-5,y+9],[x+.5,y+3,x+5,y-6]);
    }
    for (const [x,y] of [[59,45],[160,25],[190,38]]) star(ctx,x,y,4.8,GOLD,null,4);
  },['fire','nature']],
  ['kite-string-ponytail','Kite String Ponytail',ctx => {
    path(ctx,'#6d79b9',[[166,57],[189,37,210,50,216,63],[228,81,216,107,199,125],
      [182,144,186,163,203,169],[192,179,164,172,164,152],[171,125,185,109,191,96],
      [196,82,190,69,173,75]]);
    hairCap(ctx,'#7065ad','#bdb0e1');
    line(ctx,'#ab9ee2',5,[168,62],[198,46,207,63],[218,81,194,109],[178,133,180,153]);
    path(ctx,ROSE,[[180,60],[199,47],[212,66],[189,81]],INK,2.2);
    line(ctx,CREAM,2,[187,62],[207,65]);
    line(ctx,CREAM,2,[200,50],[192,76]);
    for (const [x,y,fill] of [[198,111,GOLD],[185,134,MINT],[190,157,ROSE]]) path(ctx,fill,[[x-7,y-5],[x,y],[x+7,y-5],[x+7,y+5],[x,y],[x-7,y+5]],INK,1.6);
  },['toy','wind']],
  ['seashell-sculpted-bob','Seashell Sculpted Bob',ctx => {
    path(ctx,'#ad7f9b',[[60,139],[48,118,51,84,64,61],[81,28,104,21,132,25],[158,21,187,46,199,67],
      [209,88,204,119,196,141],[178,139],[175,103,168,79,150,71],[126,82,98,78,76,96],[78,115,72,130,60,139]]);
    for (const [x,y] of [[61,101],[67,77],[81,53],[102,40],[127,36],[152,42],[171,56],[186,76],[193,103]]) {
      line(ctx,'#eed1d4',3,[x,y],[125,73,128,65]);
      dot(ctx,x,y,2.2,CREAM);
    }
    path(ctx,CREAM,[[124,68],[119,58],[112,49],[120,47],[127,42],[133,47],[142,47],[139,58],[133,68]],'#946d93',1.3);
    oval(ctx,127,63,5,5,'#9acece',INK,1.5);
  },['ocean','formal']],
  ['slinky-spring-hair','Slinky Spring Hair',ctx => {
    hairCap(ctx,'#765f9e',null);
    const rings = [[61,78,17,10,-.4],[69,59,20,11,-.36],[84,45,20,12,-.2],
      [104,37,20,13,-.1],[126,34,20,14,0],[149,37,22,13,.12],[171,46,21,12,.27],[186,62,21,11,.38],[193,81,15,9,.44]];
    rings.forEach(([x,y,rx,ry,rot],i)=>{
      oval(ctx,x,y,rx,ry,'#88599f',INK,3,rot);
      oval(ctx,x,y,rx-4,ry-3,null,['#93cdb2','#ed9bb7','#f4d285',CYAN][i%4],2.7,rot);
    });
    line(ctx,'#d8c2e7',3,[64,91],[98,61,128,64],[167,59,189,89]);
  },['toy','funny']],
  ['mosaic-petal-cut','Mosaic Petal Cut',ctx => {
    hairCap(ctx,'#765a86',null);
    const faces = [[65,76,18,'#d98fae'],[78,56,20,'#9bc6bf'],[96,43,19,'#e9ab7d'],[120,35,21,'#ca92c4'],
      [140,39,18,'#f5ce86'],[159,49,19,'#9b96d1'],[180,63,19,'#e2a7b7'],[190,85,17,'#8fc6bd'],
      [109,66,18,'#ad8ecb'],[140,65,17,'#da869f']];
    faces.forEach(([x,y,r,c],i)=>star(ctx,x,y,r,c,'#62456c',i%2+5,(i*.6)));
    line(ctx,'#ffefcf',3,[66,84],[102,48,129,46],[168,47,186,83]);
  },['garden','pattern']],
  ['puff-of-stars','Puff of Stars',ctx => {
    hairCap(ctx,'#514f91',null);
    for (const [x,y,r,fill] of [[66,75,21,'#7b70b4'],[81,47,23,'#8c79ba'],[105,33,27,'#7767a7'],
      [133,34,26,'#6d6cb0'],[161,42,25,'#8c71ac'],[186,63,24,'#7466ab'],[129,61,31,'#8273bc']]) {
      oval(ctx,x,y,r,r*.78,fill,INK,2.1);
    }
    for (const [x,y,r,fill] of [[63,83,6,GOLD],[85,57,8,CYAN],[113,39,11,CREAM],[144,43,10,GOLD],
      [175,68,7,CYAN],[120,74,6,ROSE],[69,37,5,CREAM],[180,30,6,GOLD]]) star(ctx,x,y,r,fill,INK,5);
  },['space','party']],
  ['jigsaw-jazz-hair','Jigsaw Jazz Hair',ctx => {
    path(ctx,'#7862a5',[[58,107],[53,83],[61,72],[56,56],[75,58],[78,39],[98,38],[106,23],
      [149,23],[160,40],[179,39],[187,52],[202,57],[197,78],[199,100],[177,92],[169,77],[148,78],[129,70],[109,86],[83,84],[72,99]]);
    const pieces = [
      ['#edab9b',[[60,74],[78,59],[95,66],[100,57,109,65],[101,74],[91,88],[76,97],[69,90]]],
      [CYAN,[[78,39],[104,37],[110,27],[128,28],[126,42],[119,45,127,53],[117,59],[96,58],[93,48]]],
      [GOLD,[[130,26],[150,26],[160,42],[179,40],[185,50],[170,62],[160,54,151,60],[138,62],[132,50]]],
      [MINT,[[170,68],[185,60],[198,61],[194,76],[198,97],[181,90],[172,81]]]
    ];
    for (const [fill,points] of pieces) path(ctx,fill,points,INK,2);
  },['tabletop','pattern']],
  ['seaweed-pigtail-bows','Seaweed Pigtail Bows',ctx => {
    curlTail(ctx,71,63,-1,'#527f83','#97cab4');
    curlTail(ctx,184,62,1,'#527f83','#97cab4');
    hairCap(ctx,'#60999b','#9bd2bb');
    line(ctx,'#b4e0bf',3,[74,84],[116,45,164,51],[179,60,188,75]);
    for (const [x,y,flip] of [[70,83,-1],[187,84,1]]) reflected(ctx,x,y,flip,()=>{
      path(ctx,'#a5c989',[[0,-1],[9,-14,24,-8],[28,-4],[16,1],[25,14],[11,13,0,5],[-10,7],[-11,-7]]);
      line(ctx,'#4c8d87',2,[0,1],[17,-4]);
      dot(ctx,0,0,4,'#f4c29a');
    });
  },['ocean','nature']],
  ['comet-shard-quiff','Comet Shard Quiff',ctx => {
    path(ctx,'#625c9e',[[58,105],[50,71],[78,72],[68,57],[104,44],[84,27],[121,34],[119,18],[159,31],
      [150,10],[183,18],[171,39],[198,41],[185,53],[213,62],[192,70],[194,99],[174,87],
      [154,70],[133,82],[120,72],[98,91],[83,84],[58,105]]);
    const shards = [[86,64,12,15,'#a4cade'],[121,45,20,19,'#bda7e3'],[155,55,17,22,'#94e1db'],[179,66,11,14,'#e4abcf']];
    for (const [x,y,w,h,fill] of shards) gem(ctx,x,y,w,h,fill,CREAM);
    line(ctx,'#e1bded',3,[62,87],[98,76],[129,58]);
  },['space','rare']],
  ['rose-vine-twist','Rose Vine Twist',ctx => {
    oval(ctx,158,34,29,22,'#794d76');
    sweep(ctx,'#774c79',[
      ['#bc85ac',4,[64,91],[86,56,124,52],[158,44,184,72]],
      ['#9c6799',4,[77,91],[117,70,150,64]]
    ]);
    line(ctx,'#639a79',4,[67,102],[92,72,124,66],[159,64,182,75]);
    for (const [x,y,r] of [[69,95,8],[92,75,10],[119,65,13],[151,66,10],[176,76,8]]) {
      oval(ctx,x,y,r,r*.75,ROSE,INK,1.7);
      spiral(ctx,x,y,r*.65,'#973e75',1.7);
      dot(ctx,x-2,y-2,1.3,CREAM);
    }
  },['garden','formal']]
]);

function eyesAt(ctx, draw) {
  for (const [x, side] of [[98,-1],[158,1]]) {
    reflected(ctx,x,124,side,()=>draw(ctx,side));
  }
}

function cheekArt(ctx, draw) {
  for (const [x, side] of [[86,-1],[169,1]]) {
    reflected(ctx,x,147,side,()=>draw(ctx,side));
  }
}

function iris(ctx,back,detail) {
  eyesAt(ctx,(c,side)=>{
    path(c,'#fff9ee',[[-15,0],[-8,-11,7,-11,15,0],[9,9,-7,10,-15,0]],INK,2.5);
    oval(c,0,-1,8,8,back,INK,1.2);
    detail(c,side);
    dot(c,-2,-4,1.6,CREAM);
  });
}

const eyes = makeItems('eyes', [
  ['galaxy-eyes','Galaxy Eyes',c=>iris(c,'#44286d',ctx=>{
    oval(ctx,0,0,7,4,'#9655bd',null,0,-.61);
    line(ctx,CYAN,1.3,[-8,4],[0,-1],[8,-4]);
    star(ctx,2,-1,3,CREAM,null,4);
  }),['space','galaxy']],
  ['cat-eyes','Cat Eyes',c=>iris(c,'#bbc56c',ctx=>{
    path(ctx,INK,[[0,-8],[-5,1],[0,7],[4,1]],null);
    line(ctx,GOLD,1,[-6,3],[-2,5]);
  }),['animal']],
  ['clockwork-eyes','Clockwork Eyes',c=>iris(c,GOLD,ctx=>{
    for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4){
      line(ctx,INK,1,[6*Math.cos(angle),6*Math.sin(angle)],[8*Math.cos(angle),8*Math.sin(angle)]);
    }
    line(ctx,INK,1.8,[0,-4],[0,0],[4,2]);
  }),['mechanical']],
  ['spiral-eyes','Spiral Eyes',c=>iris(c,MINT,ctx=>spiral(ctx,0,0,6,'#25666d',1.9)),['goofy']],
  ['hologram-eyes','Hologram Eyes',c=>iris(c,'#165560',ctx=>{
    line(ctx,CYAN,1.2,[-6,3],[-2,-5],[0,1],[3,-3],[7,2]);
    line(ctx,MINT,1,[-5,5],[6,5]);
  }),['space','tech']],
  ['moon-phase-eyes','Moon Phase Eyes',c=>iris(c,'#324568',(ctx,side)=>{
    dot(ctx,0,0,6,CREAM);dot(ctx,3*side,-2,5,'#324568');
  }),['space','moon']],
  ['diamond-iris','Diamond Iris',c=>iris(c,'#5a6f97',ctx=>gem(ctx,0,0,5.5,7,CYAN,CREAM)),['gem']],
  ['candy-swirl-eyes','Candy Swirl Eyes',c=>iris(c,'#ffbad0',ctx=>{
    for(let angle=0;angle<Math.PI*2;angle+=Math.PI/3) {
      reflected(ctx,0,0,1,()=>{ctx.rotate(angle);line(ctx,'#ae3f76',1.7,[0,0],[7,-4,5,5]);});
    }
  }),['food']],
  ['checker-eyes','Checker Eyes',c=>iris(c,'#faf6f2',ctx=>{
    for(const [x,y] of [[-5,-5],[0,0],[-5,0],[0,-5]]){
      ctx.fillStyle=(x===y)?'#2c2757':'#ba95ce';ctx.fillRect(x,y,5,5);
    }
  }),['racing']],
  ['flower-iris','Daisy Iris',c=>iris(c,'#42715b',ctx=>{
    for(let angle=0;angle<Math.PI*2;angle+=Math.PI/3)dot(ctx,4*Math.cos(angle),4*Math.sin(angle),2,CREAM);
    dot(ctx,0,0,2.3,GOLD);
  }),['garden']],
  ['rocket-face-paint','Rocket Face Paint',c=>cheekArt(c,ctx=>{
    path(ctx,CREAM,[[-5,5],[-3,-8,7,-12],[9,-1,5,5]],INK,1.4);
    dot(ctx,2,-1,2,CYAN);flame(ctx,-4,9,5,2,CORAL);
  }),['space','rocket']],
  ['cat-whiskers','Cat Whiskers',c=>{
    cheekArt(c,ctx=>{for(const dy of [-4,0,4])line(ctx,INK,1.6,[-9,dy],[10,dy+2]);});
    path(c,ROSE,[[123,141],[133,141],[128,146]],INK,1);
  },['animal']],
  ['rainbow-cheeks','Rainbow Cheeks',c=>cheekArt(c,ctx=>{
    for(const [i,color] of [ROSE,GOLD,MINT,CYAN,VIOLET].entries()){
      line(ctx,color,2.1,[-10+i,-i],[0,-12+i,10-i,-i]);
    }
  }),['rainbow']],
  ['tire-mark-warpaint','Tire Mark Warpaint',c=>cheekArt(c,ctx=>{
    line(ctx,INK,5,[-12,-4],[0,2],[12,3]);
    for(const x of [-8,-4,0,4,8])line(ctx,CREAM,1,[x,-3],[x+3,3]);
  }),['racing']],
  ['viking-warpaint','Viking Warpaint',c=>cheekArt(c,ctx=>{
    path(ctx,'#275c92',[[-12,-6],[7,-9],[3,-2],[10,0],[-8,5],[-3,-1]],null);
    dot(ctx,-5,7,1.5,GOLD);
  }),['warrior']],
  ['freckle-constellation','Freckle Constellation',c=>cheekArt(c,ctx=>{
    line(ctx,'#8d4867',.85,[-10,1],[-3,-4],[4,1],[11,-1]);
    for(const [x,y] of [[-10,1],[-3,-4],[4,1],[11,-1]])star(ctx,x,y,2.9,CREAM,null,4);
  }),['space','stars']],
  ['leaf-face-paint','Forest Leaves',c=>cheekArt(c,ctx=>{
    path(ctx,MINT,[[-11,4],[-6,-8,0,-5],[0,5,-11,4]],'#365b44',1);
    path(ctx,'#8abd72',[[0,6],[2,-3,10,-6],[12,4,0,6]],'#365b44',1);
    line(ctx,'#365b44',1,[-8,0],[-1,5],[8,-1]);
  }),['garden']],
  ['honeybee-cheeks','Honeybee Cheeks',c=>cheekArt(c,ctx=>{
    oval(ctx,-1,-4,5,3,CREAM,INK,1,-.4);oval(ctx,4,-5,4,3,CREAM,INK,1,.4);
    oval(ctx,0,0,8,4.4,GOLD,INK,1);
    line(ctx,INK,1.5,[-2,-4],[-2,4]);line(ctx,INK,1.5,[2,-4],[2,4]);
  }),['garden','animal']],
  ['dragon-scales-face','Dragon Scales',c=>cheekArt(c,ctx=>{
    for(const [x,y,w] of [[-7,-2,6],[1,-4,6],[8,-1,5],[-3,5,5],[4,5,5]]){
      path(ctx,'#65ad8f',[[x-w,y],[x,y-4],[x+w,y],[x,y+4]],'#2a5c60',1.4);
    }
  }),['dragon','fantasy']],
  ['lightning-face-paint','Lightning Cheeks',c=>cheekArt(c,ctx=>{
    path(ctx,GOLD,[[-2,-9],[9,-9],[4,-2],[10,-2],[-3,10],[0,1],[-6,1]],INK,1.15);
  }),['storm']],
  ['pirate-scar','Pirate Scar',c=>{
    line(c,'#864962',2,[151,100],[150,113],[154,128],[151,143]);
    for(const [x,y] of [[151,105],[152,117],[153,135]])line(c,'#eeb4a1',1.3,[x-3,y+1],[x+4,y-1]);
  },['pirate']],
  ['stage-stars','Stage Stars',c=>cheekArt(c,(ctx,side)=>{
    star(ctx,1,-2,7,side===1?GOLD:ROSE,INK,5);
    star(ctx,9,7,3,CREAM,null,4);
  }),['music','stars']],
  ['crescent-cheek','Moon and Comet',c=>cheekArt(c,(ctx,side)=>{
    if(side===-1){
      path(ctx,'#fde8a5',[[0,-8],[-13,-3,-7,8],[4,10,9,0],[-4,5,0,-8]],INK,1.4);
    }else{
      line(ctx,CYAN,2,[-10,7],[1,2],[7,-4]);star(ctx,7,-4,5,CREAM,INK,4);
    }
  }),['moon','space']],
  ['brick-brows','Brick Brows',c=>eyesAt(c,ctx=>{
    for(let i=0;i<3;i++)box(ctx,-13+i*8,-22+i*2,8,4,0,(i===1?CORAL:RED),INK,.9);
  }),['goofy','building']],
  ['avian-brows','Feather Brows',c=>eyesAt(c,ctx=>{
    path(ctx,CYAN,[[-16,-16],[-12,-22,16,-28],[13,-21,9,-18],[4,-19,3,-14],[-2,-15,-16,-16]],INK,1.4);
    line(ctx,'#287992',1,[-13,-17],[9,-22]);
  }),['bird']],
  ['crown-brows','Royal Brows',c=>eyesAt(c,ctx=>{
    path(ctx,GOLD,[[-12,-16],[-13,-24],[-5,-20],[0,-27],[6,-21],[12,-24],[11,-17],[1,-14]],INK,1.2);
    dot(ctx,0,-22,1.4,ROSE);
  }),['royal']],
  ['cloud-brows','Cloud Brows',c=>eyesAt(c,ctx=>{
    path(ctx,CREAM,[[-13,-17],[-19,-25,-10,-24],[-7,-30,-2,-24],[4,-27,7,-22],[16,-23,14,-15],[-10,-15]],'#637ca9',1.4);
  }),['weather']],
  ['chipmunk-grin','Chipmunk Grin',c=>{
    path(c,'#623447',[[110,158],[126,165,146,157],[141,178,128,178],[116,177,110,158]],INK,1.8);
    box(c,124,162,10,8,1,CREAM,INK,1);line(c,INK,.75,[129,162],[129,170]);
    cheekArt(c,ctx=>oval(ctx,2,4,5,2.8,'#ea9483',null));
  },['animal','expression']],
  ['robot-mouth','Robot Speaker',c=>{
    box(c,111,155,34,18,5,'#a8aeb7',INK,2);
    box(c,115,159,26,10,2,INK,null);
    for(const x of [119,124,129,134,139])line(c,MINT,1.3,[x,162],[x,167]);
  },['tech','goofy']],
  ['fangy-grin','Tiny Vampire Fangs',c=>{
    path(c,'#7d3a56',[[110,158],[128,169,146,158],[144,174,129,175],[117,175,110,158]],INK,1.5);
    for(const x of [118,138])path(c,CREAM,[[x-4,162],[x+4,163],[x,170]],null);
  },['fantasy','expression']]
]);

export const WEARABLES = Object.freeze([...hats,...eyewear,...hair,...eyes]);
