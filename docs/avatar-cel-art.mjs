/* Hand-inked portrait shapes and painted scenery on a 256 px cel. */
export const INK = '#382022';
export const PAPER = '#fff2d5';

export function tint(color, target, fraction) {
  const a = parseInt(color.slice(1), 16);
  const b = parseInt(target.slice(1), 16);
  const channels = [16, 8, 0].map(shift => {
    const original = (a >> shift) & 255;
    return Math.round(original + (((b >> shift) & 255) - original) * fraction);
  });
  return '#' + channels.map(c => c.toString(16).padStart(2, '0')).join('');
}

export function path(c, start, segments, fill, stroke = INK, width = 2.6) {
  c.beginPath();
  c.moveTo(...start);
  for (const segment of segments) {
    if (segment.length === 2) c.lineTo(...segment);
    else if (segment.length === 4) c.quadraticCurveTo(...segment);
    else c.bezierCurveTo(...segment);
  }
  if (fill) {
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.lineCap = c.lineJoin = 'round';
    c.stroke();
  }
}

export function oval(c, x, y, rx, ry, fill, stroke = null, width = 2, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

export function glint(c, x, y, r, color = PAPER) {
  path(c, [x-r,y], [[x-r*.23,y-r*.22,x,y-r],[x+r*.2,y-r*.24,x+r,y],
    [x+r*.22,y+r*.24,x,y+r],[x-r*.22,y+r*.24,x-r,y]], color, null);
}

const sceneColors = {
  lavender:['#697b9d','#f3ac7f','#79526b','#463449','#d68b42'],
  sunset:['#a5535d','#ffcf7a','#9f5360','#5b3638','#ea863a'],
  ocean:['#588c9b','#f2cb9b','#4c7d82','#254f5b','#edab5f'],
  mint:['#688d85','#e8d39b','#648064','#3b5849','#e5a451'],
  night:['#252d54','#564165','#494265','#242a48','#c87a48'],
  cloud:['#6f889a','#fae4b2','#74828b','#39485c','#c1874f'],
  sand:['#b8584f','#ffcf8b','#aa694d','#6a413b','#eebb58'],
  rose:['#a55d87','#ffd4a1','#865977','#51334c','#df8465'],
  heather:['#535c83','#d9a6b0','#6b5577','#3a314d','#daa363'],
  sky:['#629db3','#f6d699','#687e7a','#384f59','#f2a34e'],
  peach:['#a36063','#fed794','#956563','#633f42','#ec9766'],
  sunflower:['#86719e','#f8cb72','#a27667','#56475a','#ffb65f'],
  ochre:['#a76f59','#ffd99c','#a67155','#604b4c','#e1a759'],
  moss:['#4d8176','#e6c897','#5e8067','#31594f','#a2bf73']
};
const canopy = [
  [-12,15,32,19], [13,8,25,15], [42,4,22,11], [38,26,18,12],
  [1,40,26,20], [55,12,12,9], [-12,62,26,15], [9,81,15,12]
];
const grain = Array.from({length:180}, (_,i) => [
  (i*113+Math.floor(i/7)*21)%256,(i*67+Math.floor(i/11)*15)%256,1+i%3
]);

function trees(c, color, leaf, evening) {
  for (const side of [0,1]) {
    c.save();
    if (side) { c.translate(256,0); c.scale(-1,1); }
    c.translate(side ? -9 : -6,side ? -8 : 0);
    path(c,[0,193],[[17,141,9,91,0,54],[-3,34],[1,7],[14,0],[20,57],
      [29,42,34,15],[44,13],[37,49,22,71],[30,116,26,164,18,201]],color,null);
    path(c,[11,120],[[10,85,16,82,4,58]],null,tint(color,leaf,.36),2);
    for (const [x,y,rx,ry] of canopy) {
      const shadow=tint(color,leaf,.4);
      oval(c,x,y+4,rx,ry,shadow);
      oval(c,x-2,y-1,rx*.9,ry*.89,evening?shadow:leaf);
    }
    if (!evening) for (let i=0;i<17;i++) {
      const x=(i*19)%58-8,y=(i*43)%77-7;
      path(c,[x,y],[[x+2,y-3],[x+3,y],[x+7,y-1],[x+5,y+2],[x+8,y+4],[x+3,y+5],[x+2,y+8],[x+1,y+4],[x-3,y+3]],
        tint(leaf,i%2?PAPER:'#a25440',.52),null);
    }
    c.restore();
  }
}

export function paintScene(c, name) {
  const [top,horizon,ridge,deep,leaf] = sceneColors[name] || sceneColors.lavender;
  const evening = name === 'night' || name === 'heather';
  const sky = c.createLinearGradient(0,0,0,180);
  sky.addColorStop(0,top);
  sky.addColorStop(1,horizon);
  c.fillStyle=sky;
  c.fillRect(0,0,256,256);
  oval(c,201,61,31,31,evening?'#f4e9bc':'#f8d58a');
  if (evening) {
    oval(c,213,51,29,29,top);
    for (let i=0;i<12;i++) glint(c,(i*47+25)%251,13+(i*73)%99,1+i%3,'#e9d9a1');
  }
  c.globalAlpha=.55;
  path(c,[6,78],[[23,68,30,71],[49,59,73,67],[107,62,132,75],[91,79,6,78]],horizon,null);
  path(c,[129,99],[[152,91,167,93],[184,83,207,91],[239,89,257,95],[213,99,129,99]],horizon,null);
  c.globalAlpha=1;
  path(c,[0,147],[[32,119,61,123],[101,87,145,135],[174,120,200,130],[232,113,257,127],[256,231],[0,231]],ridge,null);
  path(c,[0,173],[[36,149,60,148],[92,149,117,169],[149,167,161,160],[219,144,256,157],[256,256],[0,256]],deep,null);
  path(c,[34,256],[[74,225,153,217],[100,197,132,180],[153,173,179,172],[160,178,149,186],
    [151,199,189,203],[220,215,195,232],[172,247,165,256]],tint(ridge,horizon,.47),null);
  if (name!=='ocean' && name!=='sky') {
    c.fillStyle=tint(deep,INK,.32);
    c.fillRect(192,138,27,28);
    c.fillRect(211,127,4,15);
    path(c,[187,140],[[203,122],[225,140]],tint(deep,INK,.58),null);
    c.fillStyle='#f9c96d';c.fillRect(209,144,5,9);
  }
  trees(c,deep,leaf,evening);
  for (const [x,y,r] of grain) {
    c.fillStyle=(x+y)%2?'#fff0b61c':'#25183420';
    c.fillRect(x,y,r,.85);
  }
}
