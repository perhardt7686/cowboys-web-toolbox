/* Original matching cel icons for the full-body wardrobe reward catalog.
   Every garment has a 2D illustration AND a fitted 3D counterpart. */
const INK='#282335';
const PAPER='#f6e5c9';
const LIGHT='#f8d99c';

function figure(c,vertices,fill,stroke=INK,width=3.7){
  c.beginPath();
  c.moveTo(vertices[0][0],vertices[0][1]);
  for(const p of vertices.slice(1))c.lineTo(p[0],p[1]);
  c.closePath();c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function curve(c,vertices,stroke=INK,width=3){
  c.beginPath();c.moveTo(...vertices[0]);
  for(const p of vertices.slice(1))c.lineTo(...p);
  c.strokeStyle=stroke;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
}
function ellipse(c,x,y,rx,ry,color,outline=INK,width=3,rotate=0){
  c.beginPath();c.ellipse(x,y,rx,ry,rotate,0,Math.PI*2);
  c.fillStyle=color;c.fill();
  if(outline){c.lineWidth=width;c.strokeStyle=outline;c.stroke();}
}
function buckle(c,x,y,size=14){
  figure(c,[[x-size,y-size*.65],[x+size,y-size*.65],[x+size,y+size*.65],[x-size,y+size*.65]],LIGHT,INK,3);
  figure(c,[[x-size*.60,y-size*.3],[x+size*.6,y-size*.3],[x+size*.6,y+size*.3],[x-size*.6,y+size*.3]],INK,null,0);
  ellipse(c,x+size*.24,y,2,2,PAPER,null,0);
}
function stitched(c,from,to,n=6){
  for(let i=0;i<n;i++){
    const t=(i+.35)/n;
    const x=from[0]+(to[0]-from[0])*t,y=from[1]+(to[1]-from[1])*t;
    curve(c,[[x,y],[x+3,y+1]],PAPER,1.5);
  }
}
function costume(c,kind,color,id){
  const cape=kind==='cape';
  figure(c,[[-33,-73],[-62,-60],[-87,-17],[-65,12],[-53,-11],
    [-64,75],[0,85],[64,75],[53,-11],[65,12],[87,-17],
    [62,-60],[31,-73],[19,-60],[-19,-60]],color);
  if(cape){
    figure(c,[[-40,-63],[-68,-50],[-93,73],[-44,90],[-10,60],[0,79],
      [11,60],[43,91],[93,73],[69,-50],[40,-63]],color);
    curve(c,[[-42,-59],[-50,61],[-83,73]],PAPER,2.5);
    curve(c,[[42,-59],[50,61],[83,73]],PAPER,2.5);
    ellipse(c,0,-62,17,8,LIGHT);
    ellipse(c,0,-61,5,5,INK,null,0);
    if(id.includes('phantom')){
      for(let side of [-1,1])ellipse(c,side*53,45,9,15,'#b2c9cf',null,0,side*.22);
    }else{
      buckle(c,0,-49,10);
    }
  }else{
    figure(c,[[-14,-73],[0,-40],[-6,85],[-47,85],[-47,-49]],'#ead7b6',INK,2);
    figure(c,[[14,-73],[0,-40],[6,85],[47,85],[47,-49]],color,INK,2);
    figure(c,[[-23,-69],[-5,-40],[-31,-8],[-42,-54]],PAPER,INK,2);
    figure(c,[[23,-69],[5,-40],[31,-8],[42,-54]],PAPER,INK,2);
    curve(c,[[0,-37],[0,75]],INK,3);
    for(let i=0;i<4;i++)ellipse(c,9,-11+i*20,3.2,3.2,LIGHT);
    if(id.includes('carburetor')){
      ellipse(c,35,5,12,12,'#83aaab',INK,2.5);
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3;
        ellipse(c,35+Math.cos(a)*9,5+Math.sin(a)*9,2.5,2.5,INK,null,0);
      }
    }else for(let side of [-1,1])stitched(c,[side*57,-36],[side*53,63],9);
  }
}
function shirt(c,color,striped){
  figure(c,[[-35,-77],[-59,-64],[-93,-18],[-65,2],[-54,-20],
    [-49,80],[49,80],[54,-20],[65,2],[93,-18],[59,-64],[35,-77],
    [16,-65],[-16,-65]],color);
  if(striped){
    for(let i=0;i<6;i++){
      const y=-41+i*21;
      curve(c,[[-47,y],[-15,y+4],[20,y+3],[50,y]],i%2?PAPER:'#4a455c',6);
    }
    for(const x of [-63,63])curve(c,[[x,-57],[x*.95,-24]],PAPER,3);
  }else{
    figure(c,[[-21,-74],[-17,-40],[18,-40],[22,-74]],'#ddc29a',INK,2);
    for(let i=0;i<5;i++)curve(c,[[-21,-68+i*6],[23,-68+i*6]],PAPER,1.8);
    curve(c,[[-17,-38],[0,-32],[17,-38]],INK,2.5);
  }
  stitched(c,[-40,76],[40,76],9);
}
function bottoms(c,kind,color){
  if(kind==='flares'){
    figure(c,[[-53,-74],[-5,-74],[-2,-7],[-7,84],[-75,84],
      [-54,-4]],color);
    figure(c,[[5,-74],[53,-74],[54,-4],[75,84],[7,84],[2,-7]],color);
    curve(c,[[-20,-68],[-26,40]],PAPER,3);
    curve(c,[[20,-68],[26,40]],PAPER,3);
  }else{
    const pleats=kind==='pleats';
    figure(c,[[-40,-73],[40,-73],[57,-23],[82,76],[-82,76],[-57,-23]],color);
    curve(c,[[-42,-56],[42,-56]],PAPER,3);
    for(let x=-53;x<=53;x+=18){
      const spread=pleats?.43:.30;
      curve(c,[[x*spread,-27],[x,70]],x%3?INK:PAPER,pleats?2.5:1.6);
    }
    if(!pleats)for(const x of [-52,52])ellipse(c,x,66,10,8,LIGHT,null,0);
  }
}
function shoes(c,kind,color){
  for(const side of [-1,1]){
    c.save();c.translate(side*41,0);c.rotate(side*-.11);
    if(kind==='highboots'){
      figure(c,[[-23,-72],[21,-72],[28,29],[35,57],[47,61],[47,78],
        [-35,78],[-38,57],[-25,42]],color);
      curve(c,[[-15,-54],[-10,36],[4,46]],PAPER,3);
      for(let i=0;i<4;i++)curve(c,[[-14,-45+i*20],[15,-37+i*20]],INK,2);
    }else{
      figure(c,[[-26,-11],[18,-11],[22,33],[45,45],[47,59],[39,70],[-37,70],[-42,54]],color);
      figure(c,[[-21,0],[18,0],[22,14],[-24,14]],'#d8be9d',INK,2);
      ellipse(c,4,14,5,4,LIGHT);
      curve(c,[[-30,54],[40,54]],PAPER,2);
    }
    curve(c,[[-35,80],[45,80]],INK,6);
    c.restore();
  }
}
function gloves(c,color){
  for(const side of [-1,1]){
    c.save();c.translate(side*52,8);c.rotate(side*.20);
    figure(c,[[-29,55],[-31,14],[-37,-31],[-29,-59],[-17,-61],
      [-12,-10],[-7,-66],[8,-67],[12,-14],[17,-60],[31,-54],
      [25,-10],[38,11],[30,59]],color);
    ellipse(c,-9,11,14,22,'#a8786c',null,0);
    curve(c,[[-23,41],[25,41]],PAPER,2);
    c.restore();
  }
}
function belt(c,color){
  figure(c,[[-97,-25],[93,-25],[93,25],[-97,25]],color);
  for(const x of [-77,-49,50,77])figure(c,[[x-9,-29],[x+9,-29],[x+9,29],[x-9,29]],'#6e4d45',INK,2);
  buckle(c,0,0,21);
  for(const x of [-72,72])figure(c,[[x-16,28],[x+16,28],[x+18,66],[x-18,66]],color);
  stitched(c,[-91,-13],[90,-13],17);
}
function necktie(c,color){
  ellipse(c,0,-66,24,18,LIGHT);
  figure(c,[[-18,-62],[2,-57],[29,-28],[-14,45],[-29,25]],color);
  figure(c,[[3,-61],[32,-52],[25,-22],[51,53],[31,74],[0,6]],color);
  ellipse(c,0,-52,14,12,'#c5a284');
  curve(c,[[-11,-55],[-25,-18]],PAPER,3);
}
function bag(c,backpack,color){
  if(backpack){
    for(const side of [-1,1]){
      figure(c,[[side*28,-77],[side*57,-69],[side*66,50],
        [side*43,66],[side*19,-31]],'#bda382',INK,2);
    }
    figure(c,[[-55,-58],[55,-58],[70,73],[-70,73]],color);
    figure(c,[[-55,-58],[0,-87],[55,-58]],'#b7a07c');
    figure(c,[[-40,11],[40,11],[47,67],[-47,67]],'#b8aa91');
    buckle(c,0,40,14);
    for(const side of [-1,1])ellipse(c,side*46,-22,7,7,LIGHT);
  }else{
    figure(c,[[-61,-5],[61,-5],[73,65],[-73,65]],color);
    figure(c,[[-69,-19],[69,-19],[58,22],[-56,22]],'#b68b69');
    curve(c,[[-61,-10],[-60,-48],[-27,-79],[27,-79],[62,-47],[63,-8]],INK,7);
    buckle(c,0,17,12);
    stitched(c,[-49,55],[48,55],11);
  }
}
function machine(c,heart,color){
  if(heart){
    figure(c,[[0,-68],[65,-45],[69,35],[0,83],[-69,35],[-65,-45]],color);
    figure(c,[[0,-39],[17,-58],[39,-44],[41,-20],[0,27],
      [-41,-20],[-39,-44],[-17,-58]],'#e0b7a8');
    ellipse(c,0,13,12,15,LIGHT);
    for(const side of [-1,1])curve(c,[[side*50,-34],[side*56,30]],PAPER,2.5);
  }else{
    figure(c,[[-93,-50],[93,-50],[85,52],[-85,52]],color);
    figure(c,[[-77,-35],[77,-35],[69,27],[-70,27]],'#2f4556');
    for(const side of [-1,1]){
      ellipse(c,side*41,0,26,20,'#9be1b6',INK,4);
      ellipse(c,side*41,0,13,11,'#33697b');
      ellipse(c,side*46,-4,4,4,PAPER,null,0);
    }
    curve(c,[[-70,40],[68,40]],LIGHT,4);
  }
}
export function drawWardrobeReward(c,item){
  c.save();
  c.lineJoin='round';c.lineCap='round';
  // Soft off-center page shadow makes every catalog thumbnail legible.
  ellipse(c,128,215,66,9,'#31273e35',null,0);
  c.translate(128,127);
  const color=item.color||'#8f7b85';
  switch(item.slot){
    case 'outerwear':costume(c,item.cut,color,item.id);break;
    case 'top':shirt(c,color,item.cut==='striped');break;
    case 'bottoms':bottoms(c,item.cut,color);break;
    case 'footwear':shoes(c,item.cut,color);break;
    case 'hands':gloves(c,color);break;
    case 'waist':belt(c,color);break;
    case 'neckwear':necktie(c,color);break;
    case 'back':bag(c,item.cut==='pack',color);break;
    case 'bodypart':machine(c,item.cut==='plate',color);break;
    default:throw new Error('Unknown wardrobe slot: '+item.slot);
  }
  c.restore();
}
