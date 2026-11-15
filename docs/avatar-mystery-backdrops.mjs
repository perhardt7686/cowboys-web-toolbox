/* Original 1970s-inspired mystery-cartoon scenery. Background-only; no copyrighted assets. */
const INK = '#232238';
const MIST = '#e7dfca';
const GOLD = '#f4d696';

export function mysterySceneKind(theme = '') {
  const s = String(theme).toLowerCase();
  if (/robot|cyber|scanner|gear|clockwork|gremlin|visor|workshop|circuit|factory|mechanic/.test(s)) return 'workshop';
  if (/carnival|circus|festival|party|disco|balloon|carousel|showtime|rainbow/.test(s)) return 'carnival';
  if (/space|galax|cosmic|nebula|meteor|rocket|star|planet|aurora|celestial/.test(s)) return 'observatory';
  if (/forest|moss|garden|leaf|plant|dragon|wild|wood|swamp|lagoon/.test(s)) return 'forest';
  if (/arcade|pixel|dash|champion|fleet|game|trophy/.test(s)) return 'arcade';
  if (/haunt|ghost|phantom|spect|grave|gargoyle|fog|cloak|lantern|night|bat|moon|castle/.test(s)) return 'manor';
  return 'library';
}

function polygon(c, points, fill, stroke = INK, line = 4) {
  c.beginPath();
  c.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke && line) { c.strokeStyle = stroke; c.lineWidth = line; c.lineJoin = 'round'; c.stroke(); }
}

function line(c, points, stroke = INK, width = 4) {
  c.beginPath();
  c.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
  c.strokeStyle = stroke;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke();
}

function disc(c, x, y, r, fill, stroke = INK, width = 4) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill; c.fill();
  if (stroke && width) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function window(c, x, y, w = 28, h = 55, lit = false) {
  c.save();
  c.globalAlpha *= lit ? .65 : .55;
  polygon(c, [[x,y+h],[x,y+12],[x+w/2,y],[x+w,y+12],[x+w,y+h]],
    lit ? GOLD : '#2c324d', INK, 4);
  line(c, [[x+w/2,y+3],[x+w/2,y+h],[x+w,y+h]], INK, 3);
  c.restore();
}

function building(c, x, base, width, height, roofRise, colors) {
  polygon(c, [[x,base],[x,base-height],[x+width/2,base-height-roofRise],
    [x+width,base-height],[x+width,base]], colors.wall, INK, 5);
  polygon(c, [[x-9,base-height],[x+width/2,base-height-roofRise-16],
    [x+width+9,base-height]], colors.roof, INK, 6);
  line(c, [[x+9,base-height+16],[x+width-11,base-height+16]], INK, 3);
  const count = width < 95 ? 1 : 2;
  for (let i = 0; i < count; i++) window(c,x+width*(i+1)/(count+1)-12,base-height+38,24,47,i%2===0);
}

function branch(c, x, y, scale, flip = 1) {
  c.save();c.translate(x,y);c.scale(scale*flip,scale);
  line(c,[[0,0],[25,-60],[60,-84],[99,-79],[137,-109]],INK,13);
  line(c,[[44,-77],[58,-130],[86,-157]],INK,8);
  line(c,[[77,-83],[102,-46],[145,-34]],INK,7);
  c.restore();
}

function haze(c, y, alpha = .22) {
  c.save(); c.globalAlpha *= alpha;
  const fog = c.createLinearGradient(0,y-44,0,y+34);
  fog.addColorStop(0,'#d8d5d900');fog.addColorStop(.48,MIST);fog.addColorStop(1,'#d8d5d900');
  c.fillStyle = fog;c.fillRect(0,y-44,768,78);
  c.restore();
}

function manor(c) {
  c.save();c.globalAlpha *= .42;
  disc(c,575,147,55,'#f6ebc7',null,0);
  c.restore();
  building(c,27,512,207,255,89,{wall:'#44445f',roof:'#24283c'});
  building(c,128,503,104,338,91,{wall:'#53516a',roof:'#28283d'});
  building(c,618,503,163,273,78,{wall:'#42435d',roof:'#292b45'});
  polygon(c,[[44,462],[61,436],[75,462],[84,451],[99,477],[109,494],[45,494]],'#2d3145',INK,3);
  c.save();c.globalAlpha=.64; branch(c,-16,456,1.15); branch(c,783,445,1.18,-1);c.restore();
  for(let i=0;i<8;i++) {
    const x=14+i*104;
    line(c,[[x,472],[x,520]],INK,4);
    if(i<7)line(c,[[x,488],[x+104,488]],INK,3);
  }
  haze(c,453,.16);
}

function forest(c) {
  c.save();c.globalAlpha=.36;disc(c,520,135,69,'#f2e4c1',null,0);c.restore();
  for(const [x,flipped,h] of [[23,1,1.45],[744,-1,1.7],[111,1,.65],[658,-1,.67]]) {
    c.save();c.translate(x,512);c.scale(flipped,1);
    polygon(c,[[-25,0],[-14,-270*h],[-32,-321*h],[1,-303*h],[20,-267*h],[35,0]],'#303d4a',INK,5);
    branch(c,-4,-237*h,.8*h,flipped<0?-1:1);
    c.restore();
  }
  polygon(c,[[0,481],[82,451],[171,472],[252,455],[331,482],[449,461],[543,487],[634,463],[768,482],[768,554],[0,554]],
    '#415365',null,0);
  for(let i=0;i<12;i++){
    const x=(i*101)%768,y=458+(i%4)*12;
    line(c,[[x,y+24],[x+8,y],[x+23,y+25]],'#243a42',3);
  }
  haze(c,466,.31);
}

function workshop(c) {
  polygon(c,[[0,112],[252,112],[245,477],[0,493]],'#3b4960',INK,6);
  polygon(c,[[571,95],[768,95],[768,511],[580,485]],'#3a4156',INK,6);
  for(let i=0;i<4;i++){
    const y=160+i*74;
    line(c,[[15,y],[222,y],[249,y-24]],'#242b40',7);
    for(let j=0;j<2;j++)disc(c,42+j*91,y+17,13,j%2?'#b79070':'#668d98',INK,3);
  }
  polygon(c,[[622,128],[739,128],[739,265],[622,265]],'#7c8290',INK,5);
  disc(c,678,193,43,'#c4b29c',INK,5);
  line(c,[[678,193],[700,170]],INK,5);
  for(let i=0;i<9;i++){
    const angle=i*Math.PI*2/9;
    disc(c,680+Math.cos(angle)*27,194+Math.sin(angle)*27,3,INK,null,0);
  }
  line(c,[[768,333],[650,333],[650,419],[587,419]],'#242638',17);
  line(c,[[768,333],[650,333],[650,419],[587,419]],'#89909c',10);
  for(let i=0;i<4;i++)polygon(c,[[34+i*51,417],[70+i*51,417],[64+i*51,459],[37+i*51,459]],'#7d9caa',INK,3);
  haze(c,479,.14);
}

function carnival(c) {
  polygon(c,[[0,384],[115,205],[242,387]],'#9a5767',INK,5);
  for(let i=0;i<5;i++){
    const x=i*49;
    polygon(c,[[x,390],[115,205],[Math.min(242,x+51),390]],
      i%2?'#c19b7c':'#5d6786',null,0);
  }
  line(c,[[3,390],[241,390]],INK,6);
  for(const x of [21,94,173,223])line(c,[[x,390],[x,490]],INK,4);
  c.save();c.globalAlpha=.6;
  disc(c,657,313,140,'#40465c',INK,5);
  disc(c,657,313,108,'#b1a4a4',INK,4);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    line(c,[[657,313],[657+140*Math.cos(a),313+140*Math.sin(a)]],INK,4);
    disc(c,657+122*Math.cos(a),313+122*Math.sin(a),12,i%2?'#d5b36e':'#b88486',INK,3);
  }
  c.restore();
  line(c,[[597,481],[657,313],[718,481]],INK,8);
  line(c,[[65,106],[540,134],[755,100]],INK,4);
  for(let i=0;i<10;i++){
    const x=84+i*61;
    polygon(c,[[x,114],[x+18,117],[x+6,146]],i%2?'#af7883':'#dfb477',INK,2);
  }
  haze(c,459,.1);
}

function observatory(c) {
  c.save();c.globalAlpha=.55;
  disc(c,662,157,67,'#e2bd90','#35334e',5);
  c.beginPath();c.ellipse(662,159,113,21,-.20,0,Math.PI*2);
  c.strokeStyle='#34354c';c.lineWidth=9;c.stroke();
  c.restore();
  for(let i=0;i<28;i++){
    const x=(i*233+47)%730+15, y=(i*131+29)%362+29;
    const r=i%6===0?4:1.9;
    line(c,[[x-r,y],[x+r,y]],'#f7eac7',r<3?2.2:3);
    if(i%6===0)line(c,[[x,y-r],[x,y+r]],'#f7eac7',2);
  }
  polygon(c,[[20,497],[20,302],[81,264],[153,310],[153,497]],'#3c435f',INK,6);
  polygon(c,[[6,302],[83,214],[164,302]],'#33354d',INK,5);
  disc(c,86,370,49,'#657a94',INK,5);
  line(c,[[86,317],[86,423]],INK,4);line(c,[[38,370],[133,370]],INK,4);
  polygon(c,[[587,496],[591,397],[628,352],[654,354],[655,496]],'#424861',INK,5);
  polygon(c,[[608,352],[646,292],[673,354]],'#34374f',INK,5);
}

function arcade(c) {
  for(let i=0;i<5;i++){
    const inset=i*24;
    c.save();c.globalAlpha=.17+i*.07;
    polygon(c,[[inset,136+inset],[768-inset,136+inset],[768-inset,512-inset],[inset,512-inset]],
      i%2?'#b6a6a9':'#29324b',INK,5);
    c.restore();
  }
  polygon(c,[[13,297],[154,269],[154,490],[13,490]],'#30394f',INK,5);
  polygon(c,[[614,269],[756,296],[756,490],[614,490]],'#34394e',INK,5);
  for(const x of [36,633])for(let i=0;i<3;i++){
    polygon(c,[[x,314+i*52],[x+96,314+i*52],[x+96,352+i*52],[x,352+i*52]],
      i===1?'#ae8277':'#6f8897',INK,3);
  }
  for(let i=0;i<7;i++){
    const x=8+i*130;
    line(c,[[x,511],[384+(x-384)*1.65,768]],'#2c334a',3);
  }
}

function library(c) {
  polygon(c,[[20,124],[197,124],[197,509],[20,509]],'#4c5069',INK,6);
  polygon(c,[[580,124],[750,124],[750,509],[580,509]],'#4c5069',INK,6);
  for(const x of [35,600]){
    for(let row=0;row<4;row++){
      const y=170+row*82;
      line(c,[[x,y+55],[x+138,y+55]],INK,6);
      for(let i=0;i<7;i++){
        const h=36+(i*11+row*17)%24;
        polygon(c,[[x+i*18,y+54],[x+i*18,y+54-h],[x+i*18+16,y+54-h],[x+i*18+16,y+54]],
          i%3?'#99838a':'#9a9c86',INK,2);
      }
    }
  }
  polygon(c,[[243,473],[243,193],[268,165],[500,165],[525,193],[525,473]],'#555d78',INK,5);
  polygon(c,[[262,470],[262,206],[285,187],[484,187],[504,206],[504,470]],'#93a1b3',INK,4);
  line(c,[[384,190],[384,471]],INK,5);
  haze(c,470,.13);
}

/* Everything is painted behind the 3D actor and uses no downloaded image assets. */
export function paintMysteryBackdrop(c,theme='',options={}){
  if(!c || typeof c.save!=='function')return 'library';
  const kind=mysterySceneKind(theme);
  c.save();
  c.globalAlpha *= options.opacity ?? .73;
  switch(kind){
    case 'manor':manor(c);break;
    case 'forest':forest(c);break;
    case 'workshop':workshop(c);break;
    case 'carnival':carnival(c);break;
    case 'observatory':observatory(c);break;
    case 'arcade':arcade(c);break;
    default:library(c);
  }
  c.restore();
  return kind;
}
