import {INK,PAPER,tint,path,oval,paintScene} from './avatar-cel-art.mjs?v=workshop1';
import {SPECIAL_HAIR_STYLES,paintMysteryHair,paintMysteryExpression,paintMysteryGlasses,paintMysteryGarment} from './avatar-mystery-features.mjs?v=workshop1';

const warmShade = color => tint(color,'#763a43',.36);
const warmLight = color => tint(color,'#ffe3b1',.33);
const dark = color => tint(color,'#321d31',.56);

// Shapes are drawn as separated ink and paint, including the broken highlights
// and asymmetric silhouettes that stay readable at message-board icon size.
function backHair(c, style, color) {
  if (style==='ponytail') {
    path(c,[159,73],[[175,46,216,48,225,81],[238,110,207,148,213,168],
      [221,181,230,180],[200,187,189,160],[176,133,199,101,180,91]],color);
    path(c,[197,61],[[220,71,219,105],[215,126,197,145],[206,116,209,82,197,61]],warmLight(color),null);
    oval(c,187,83,8,10,'#c87049',INK,2,-.45);
    return;
  }
  if (style==='bun') {
    oval(c,134,33,29,26,color,INK,2.7,-.25);
    path(c,[113,37],[[114,17,139,12],[151,13,160,23]],null,warmLight(color),3);
    return;
  }
  if (!['long','wavy','bob','locs','braids','curly'].includes(style)) return;
  const end=style==='bob'?160:style==='long'?228:style==='wavy'?210:187;
  path(c,[58,103],[[52,76,69,48,93,42],[126,24,167,36,184,61],[200,73,210,91,200,119],
    [199,143,212,end-18,205,end],[184,end-12,178,end+15,155,end-1],[104,end-24],
    [75,end+16,58,end-5,55,end],[64,end-25,40,151,58,103]],dark(color));
  if (['long','wavy','bob'].includes(style)) {
    path(c,[62,117],[[58,148,68,end-21],[63,end-13],[78,end-16,83,126]],color,null);
    path(c,[187,108],[[193,137,190,end-24],[201,end-7],[183,end-10,177,144]],color,null);
    path(c,[66,128],[[56,150,78,end-35],[71,end-17]],null,warmLight(color),2.5);
  }
}

function frontHair(c, style, color) {
  if(style==='bald')return;
  const shine=warmLight(color);
  if(style==='shaved') {
    path(c,[62,99],[[65,39,137,36,169,53],[184,60,191,76,188,91],
      [152,69,109,67,78,109]],tint(color,'#aa826a',.3));
    return;
  }
  if(style==='spiky') {
    path(c,[58,111],[[51,83,61,64],[49,61],[72,50],[78,28],[93,41],[111,24],[116,38],
      [146,24],[141,42],[169,31],[166,46],[184,40],[184,55],[201,64],[192,76],[195,109],
      [177,94],[170,65],[139,85],[150,68],[116,88],[113,77],[86,101],[83,113],[71,109]],color);
    path(c,[72,81],[[83,60,110,49],[102,62],[130,49],[123,59],[153,45],[131,69],[99,68,72,81]],shine,null);
    return;
  }
  if(style==='curly'||style==='coils') {
    path(c,[53,108],[[39,96,47,76,59,73],[52,56,69,44,85,48],[87,28,113,30,123,38],
      [143,24,161,34,169,48],[188,42,202,57,199,74],[216,82,202,109,187,110],
      [190,91,175,77,167,77],[156,100,130,92,130,80],[109,96,91,93,82,83],[77,102,67,116,53,108]],color);
    const curls=style==='coils'?
      [[62,83,7], [75,60,8], [91,75,8], [98,49,8], [115,55,8], [114,77,8], [140,48,8], [149,69,9], [165,63,8], [185,65,7], [190,88,7]]:
      [[65,84,12], [88,55,12], [114,66,14], [143,48,10], [165,67,13], [192,82,9]];
    for (const [x,y,r] of curls) {
      path(c,[x-r,y],[[x-r,y-r,x+r,y-r,x+r,y],[x+r,y+r,x-1,y+r,x-1,y+1]],null,shine,2.3);
      path(c,[x+3,y+3],[[x+6,y+7,x+8,y+2]],null,dark(color),1.4);
    }
    return;
  }
  if(style==='part'||style==='crop'||style==='short') {
    const crop=style==='crop';
    path(c,[57,112],[[51,77,77,45,115,37],[140,31,154,41,158,48],[176,46,191,63,191,94],
      [187,crop?92:106],[173,90,164,71,153,59],
      [134,crop?78:88,106,crop?75:99,84,crop?79:103],[76,100,71,107,67,120]],color);
    path(c,[63,89],[[87,52,114,44,148,49],[112,57,105,72,82,80],[63,89]],shine,null);
    path(c,[85,89],[[118,82,132,68,149,58]],null,dark(color),1.8);
    return;
  }
  path(c,[55,113],[[48,101,57,81,62,70],[65,50,91,36,119,34],[148,27,184,41,193,65],
    [209,86,196,103,191,112],[180,92,175,72,162,65],[145,82,137,99,107,91],
    [114,87,121,80],[98,83,94,101,70,105],[66,110,62,120,55,113]],color);
  path(c,[62,89],[[65,67,84,55,112,50],[135,44,150,45,162,50],[137,48,120,62,100,66],
    [89,70,73,73,62,89]],shine,null);
  path(c,[98,80],[[122,71,126,55,155,51]],null,dark(color),1.75);
  if (style==='bob') {
    for(const [x,side] of [[64,-1],[187,1]]) {
      path(c,[x,91],[[x+side*23,106,x+side*22,143,x+side*7,164],
        [x+side*10,150,x-side*10,152],[x-side*10,128,x-side*5,109,x,91]],color);
      path(c,[x+side*5,106],[[x+side*13,129,x+side*9,145]],null,shine,2);
    }
  }
  if (style==='wavy'||style==='long') {
    path(c,[70,99],[[66,122,51,121,57,141],[61,134,51,152,66,163],[67,154,76,150,75,134],
      [70,125,92,111,83,96]],color);
    path(c,[182,74],[[206,92,186,118,201,131],[213,143,200,157,190,150],[203,143,184,138,184,126],
      [174,112,192,99,182,74]],color);
    path(c,[66,105],[[57,119,63,126,64,132]],null,shine,2);
  }
  if (style==='braids'||style==='locs') {
    const braid=style==='braids';
    for(const side of [-1,1]) {
      for(let k=0;k<(braid?2:4);k++){
        const x=127+side*(55+k*8),end=183+k*9,tip=x+side*(4+(k%2)*6);
        const strand=[[x+side*14,131,tip-side*5,end-19,tip,end]];
        path(c,[x,101],strand,null,INK,braid?12:8);
        path(c,[x,101],strand,null,color,braid?8.5:5);
        for(let y=115;y<end-4;y+=12)
          path(c,[x+side*1,y],[[x+side*5,y+4]],null,shine,1.6);
        if(braid)oval(c,tip,end,5,3,'#d79a44',INK,1.5);
      }
    }
  }
}

function shirtAndNeck(c,v,skin,shirt) {
  const shade=warmShade(skin),fabric=dark(shirt),fold=warmLight(shirt);
  const wave=v.pose==='wave';
  if(wave) {
    path(c,[182,242],[[202,228,206,208,209,188],[229,195],[230,223,226,241,216,261]],
      shirt,INK,3.5);
    path(c,[208,193],[[199,181,198,177,198,170],[194,159,200,156,206,165],[208,166],[208,149,212,142,215,145],
      [219,147,215,161,218,164],[220,152,223,147,226,151],[229,155,223,164,227,165],
      [233,156,238,161,234,167],[236,167,241,166,242,171],[237,178],[228,199]],skin);
    path(c,[217,173],[[226,175,225,183]],null,shade,1.8);
  }
  path(c,[7,256],[[17,216,40,201,99,190],[109,181,144,182,158,189],[213,202,239,217,249,256]],shirt,INK,3.8);
  path(c,[21,256],[[33,230,58,216,94,209],[81,228,77,242,73,256]],fold,null);
  path(c,[146,256],[[171,227,192,230,213,217],[231,228,237,246,242,256]],fabric,null);
  path(c,[94,197],[[101,188,100,165,102,158],[145,155],[149,179,150,191],[160,197],
    [139,221,112,215,94,197]],skin,INK,2.9);
  path(c,[104,170],[[124,168,143,164],[148,183,146,194,143,199],[123,204,107,192,104,170]],shade,null);
  if(v.shirt==='gold'||v.shirt==='rust'){
    path(c,[90,188],[[109,194,140,199,158,186],[166,194,164,204],[148,222,110,220,91,205],[88,198,90,188]],shirt);
    for(let x=97;x<159;x+=7) path(c,[x,197],[[x+2,208]],null,fabric,1.45);
  }else{
    path(c,[95,193],[[112,212,129,214],[112,229],[85,205],[95,193]],fold,INK,2);
    path(c,[151,192],[[142,206,129,214],[142,228],[163,204],[151,192]],fold,INK,2);
    path(c,[129,214],[[126,235,127,256]],null,fabric,2);
    oval(c,135,237,2.7,2.7,fold,INK,1);
  }
  path(c,[52,232],[[58,240,57,256]],null,fabric,2.2);
  path(c,[208,230],[[199,239,202,256]],null,fabric,2.2);
  mysteryGarment(c,v,shirt);
  if(v.accessory==='scarf'){
    path(c,[89,196],[[105,206,144,208,157,195],[165,206,150,220,136,217],[137,225,169,239,157,256],
      [133,246,124,223,124,218],[106,220,90,211,89,196]],'#b05055');
    path(c,[102,207],[[118,213,141,213,154,204]],null,'#ec9276',2.7);
  }
  if(v.accessory==='bowtie'){
    path(c,[104,203],[[126,209],[147,201],[145,222],[127,216],[108,225]],'#633d72');
    oval(c,126,213,7,6,'#bc664e',INK,2);
  }
  if(v.accessory==='badge'){
    oval(c,172,229,9,9,'#e3a343',INK,2.1);
    path(c,[167,231],[[172,223],[177,231],[167,231]],PAPER,null);
  }
}

function classicFace(c,v,skin){
  // Six original, deliberately asymmetric animation-cel face silhouettes.
  const starts={
    oval:[[66,95],[[64,68,96,49,127,50],[169,46,188,77,188,104],[189,133,182,156,161,177],[140,201,109,186,89,168],[67,144,62,118,66,95]]],
    angular:[[65,94],[[72,56,111,48,135,51],[164,53,192,74,187,106],[186,135,166,170,143,195],[136,205,115,191,91,169],[75,150,61,118,65,94]]],
    round:[[61,101],[[57,67,96,47,127,49],[171,47,199,78,197,113],[202,149,176,183,141,190],[113,198,78,178,65,147],[54,127,55,115,61,101]]],
    square:[[65,91],[[67,62,101,47,130,50],[166,50,192,75,190,100],[195,130,190,157,174,176],[142,190,99,190,77,171],[62,151,61,115,65,91]]],
    long:[[70,84],[[72,59,102,42,129,47],[167,45,183,74,184,102],[188,140,178,171,160,197],[133,216,107,195,89,177],[74,152,60,114,70,84]]],
    heart:[[62,93],[[66,60,94,46,128,55],[159,42,198,62,192,106],[188,136,168,165,146,189],[126,204,117,194,103,177],[78,157,57,124,62,93]]]
  };
  const [start,segments]=starts[v.face]||starts.oval;
  path(c,start,segments,skin,INK,3.4);
  // Paint the shadow INSIDE the chosen silhouette. The previous fixed
  // shadow erased the visual difference between the six face shapes.
  c.save();
  c.beginPath();c.moveTo(...start);
  for(const segment of segments){
    if(segment.length===2)c.lineTo(...segment);
    else if(segment.length===4)c.quadraticCurveTo(...segment);
    else c.bezierCurveTo(...segment);
  }
  c.closePath();c.clip();
  path(c,[47,63],[[67,94,63,128,78,160],[88,188,105,201,135,211],
    [82,204,52,161,48,119],[42,95,47,63]],warmShade(skin),null);
  path(c,[91,87],[[116,69,147,66,162,82],[150,82,129,91,113,99],
    [103,100,91,87]],warmLight(skin),null);
  path(c,[158,113],[[177,132,173,149,164,155],[164,140,158,125,158,113]],
    tint(skin,'#cf7361',.22),null);
  c.restore();
}
function cheekDetails(c,v,skin){
 const shade=tint(skin,'#b25a62',.58);
 if(v.cheeks==='rosy'){
   oval(c,89,147,12,5,'#c9646355',null,1,-.25);
   oval(c,158,141,12,5,'#c9646355',null,1,.19);
 }else if(v.cheeks==='dimples'){
   path(c,[89,155],[[92,160,96,156]],null,shade,2.2);
   path(c,[158,150],[[162,155,164,149]],null,shade,2.2);
 }else if(v.cheeks==='freckles'){
   for(const [x,y] of [[84,143],[91,147],[98,145],[151,139],[158,141],[165,137]])
     oval(c,x,y,1.65,1.25,shade,null);
 }
}
function mysteryGarment(c,v,shirt){
 const darkFabric=dark(shirt),light=warmLight(shirt);
 if(v.garment==='striped'){
   for(const y of [219,229,240,251]){
     path(c,[20,y],[[55,y-3,76,y+3,91,y+2]],null,light,4.5);
     path(c,[163,y+2],[[190,y-4,218,y+2,239,y]],null,light,4.5);
   }
 }else if(v.garment==='cardigan'||v.garment==='denim'){
   const ink=v.garment==='denim'?'#224a68':'#53345d';
   path(c,[95,193],[[75,207,71,223,66,255]],null,ink,6);
   path(c,[151,193],[[172,214,180,238,185,255]],null,ink,6);
   for(const y of [225,237,249])oval(c,128,y,2.8,2.8,light,INK,1);
   if(v.garment==='denim'){
     path(c,[29,228],[[57,225,79,233]],null,'#f2dda5',2);
     path(c,[185,232],[[215,227,238,236]],null,'#f2dda5',2);
   }
 }else if(v.garment==='vest'){
   path(c,[89,192],[[72,217,74,245,77,256],[112,256],[124,214],[96,195]],'#916e4c',INK,2);
   path(c,[157,193],[[179,214,183,241,179,256],[143,256],[126,214],[151,193]],'#916e4c',INK,2);
   path(c,[88,236],[[111,242,116,241]],null,'#dfba74',2);
 }else if(v.garment==='turtleneck'){
   path(c,[100,189],[[108,199,142,203,153,188],[151,208,144,215,130,219],
     [116,216,105,209,100,189]],shirt,INK,2.4);
   for(const y of [200,205,210])path(c,[108,y],[[128,y+3,146,y]],null,darkFabric,1.5);
 }else if(v.garment==='sweater'){
   for(let x=42;x<225;x+=14){
     const y=240+(x%3)*4;
     path(c,[x,y],[[x+5,y-5],[x+10,y]],null,light,2.2);
   }
 }
}
function face(c,v,skin,hair,iris) {
  const shade=warmShade(skin);
  path(c,[70,112],[[51,100,49,118,54,135],[58,148,69,152,76,141]],skin);
  path(c,[60,119],[[67,113,70,130,65,133]],null,tint(shade,INK,.45),1.9);
  path(c,[179,107],[[199,101,201,117,194,129],[190,135,187,141,181,135]],shade);
  classicFace(c,v,skin);
  // Silhouette-aware cel shade is already applied in classicFace.
  path(c,[78,147],[[87,169,105,182,120,184]],null,tint(skin,INK,.25),1.35);
  path(c,[103,101],[[113,89,133,88,148,94],[127,93,118,101,103,101]],warmLight(skin),null);
  path(c,[153,149],[[164,143,174,145,172,150],[168,154,157,155,153,149]],tint(skin,'#da674e',.34),null);
  cheekDetails(c,v,skin);
  if(v.accessory==='freckles') for(const [x,y] of [[88,145],[95,147],[103,145],[149,141],[158,142],[164,140]])
    oval(c,x,y,1.55,1.25,tint(shade,INK,.4));
  if(v.accessory==='earrings'){
    oval(c,59,149,6,9,null,'#f5c562',3.1,-.12);
    oval(c,192,139,5,8,null,'#f5c562',2.8,.12);
  }
  if(v.beard==='beard'||v.beard==='goatee'){
    const start=v.beard==='beard'?78:112;
    path(c,[start,147],[[99,157,113,170,129,165],[149,164,166,151,176,149],
      [177,169,158,193,136,200],[111,201,95,174,start,147]],dark(hair),INK,2);
    path(c,[110,177],[[121,184,139,190,153,180]],null,warmLight(hair),2);
  } else if(v.beard==='stubble'){
    for(let i=0;i<36;i++){
      const x=85+(i*29)%87,y=155+(i*17)%33;
      if(Math.hypot((x-128)*.58,y-157)<28) oval(c,x,y,1,.8,tint(skin,hair,.62));
    }
  } else if(v.beard==='moustache'){
    path(c,[114,147],[[124,143,133,149,137,149],[145,144,156,144,164,152],
      [151,158,141,154,137,153],[126,156,118,157,110,153]],hair,INK,1.4);
  }
}

function expression(c,v,iris,skin) {
  const shade=tint(warmShade(skin),INK,.47);
  const [browY,browWidth]={soft:[100,3],straight:[103,3],bold:[99,4.8],arching:[94,3.3]}[v.brows];
  path(c,[88,107],[[97,browY,114,103]],null,INK,browWidth);
  path(c,[144,102],[[153,browY-4,169,100]],null,INK,browWidth);
  const drawEye=(cx,cy,rx,ry)=>{
    path(c,[cx-rx,cy+1],[[cx-rx*.38,cy-ry*1.4,cx+rx*.47,cy-ry*1.14,cx+rx,cy],
      [cx+rx*.56,cy+ry*.8,cx-rx*.59,cy+ry,cx-rx,cy+1]],PAPER,INK,2);
    oval(c,cx+3,cy-1,rx*.44,ry*.88,iris,INK,1.3,.13);
    oval(c,cx+4,cy-1,2.65,4,'#24191e');
    oval(c,cx+1.7,cy-3.6,1.55,1.55,'#fff8e5');
  };
  drawEye(101,122,13,9);
  if(v.expression==='wink') path(c,[143,121],[[150,113,166,119]],null,INK,2.8);
  else drawEye(155,118,12,8.4);
  if(v.nose==='pointed'){
    path(c,[134,116],[[134,125,143,134],[132,139],[126,135]],null,shade,2.4);
  }else if(v.nose==='swoop'){
    path(c,[134,114],[[140,126,145,129,140,134],[137,140,130,141]],null,shade,2.7);
  }else if(v.nose==='straight'){
    path(c,[135,114],[[132,127,134,132],[128,136,138,137]],null,shade,2.2);
  }else{
    path(c,[135,116],[[135,125,142,130,142,135],[140,139,134,141,128,138]],null,shade,2);
    if(v.nose==='freckled')oval(c,140,136,5,2.8,'#b96f70aa',null);
  }
  path(c,[135,131],[[139,133,138,135]],null,warmLight(skin),1.4);
  const paleLip=tint(skin,'#d88970',.36);
  if(v.expression==='grin'){
    path(c,[100,152],[[120,161,147,155,167,149],
      [172,166,151,185,132,185],[111,183,102,168,100,152]],
      '#6c3036',INK,2.65);
    path(c,[108,155],[[132,163,149,156,164,153],
      [158,166,130,171,108,162]],PAPER,null);
    path(c,[92,146],[[95,155,101,160]],null,paleLip,2);
    path(c,[167,143],[[173,152,172,159]],null,paleLip,2);
  }else if(v.expression==='smile'||v.expression==='wink'){
    path(c,[112,150],[[117,166,147,169,158,148]],null,INK,3);
    path(c,[108,149],[[111,158,113,159]],null,paleLip,1.7);
    path(c,[158,148],[[162,153,164,159]],null,paleLip,1.7);
  }else if(v.expression==='smirk'){
    path(c,[109,164],[[121,169,141,164,163,145]],null,INK,3.1);
    path(c,[155,148],[[164,145,168,149]],null,paleLip,1.9);
  }else if(v.expression==='curious'){
    oval(c,138,159,7,9,'#793e45',INK,2,-.2);
    path(c,[134,164],[[140,162,145,163]],null,'#d97c71',2);
  }else{
    path(c,[112,160],[[128,165,143,157,149,156]],null,shade,2.3);
  }
}

function basicHat(c,hat) {
  if(hat==='western'){
    path(c,[42,57],[[41,49,53,49,76,59],[76,32,84,21,96,26],[113,29,123,44,136,37],
      [165,16,181,24,183,58],[207,48,223,42,218,61],[215,82,175,86,125,76],[72,83,38,76,42,57]],
      '#9d5632',INK,3.4);
    path(c,[82,60],[[83,37,91,31],[111,35,122,51,137,42],[153,29,172,28,176,57],
      [140,62,117,65,82,60]],'#c68644',null);
    path(c,[73,64],[[105,72,153,69,182,60]],null,'#582d29',5.8);
    path(c,[48,59],[[46,71,70,73,94,71]],null,'#e4ac62',2.6);
    oval(c,128,68,6,4.7,'#e5b059',INK,1.4);
  } else if(hat==='cap') {
    path(c,[57,82],[[63,44,87,25,119,25],[155,23,177,42,183,65],[180,82,116,93,57,82]],'#3a5978');
    path(c,[110,30],[[130,38,143,59,144,70]],null,'#95b7bc',2.6);
    path(c,[98,80],[[133,62,179,66,209,70],[216,73,216,79,205,84],[173,91,145,78,98,80]],'#283858');
  } else if(hat==='beanie') {
    path(c,[59,78],[[55,54,75,29,100,24],[137,10,184,40,188,73],[174,85,91,91,59,78]],'#ab4a60');
    oval(c,108,21,12,10,'#e7ad94',INK,2.4);
    path(c,[59,70],[[94,81,157,73,187,64],[190,72,187,81],[155,92,90,99,60,85]],'#683444');
    for(let x=71;x<182;x+=8) path(c,[x,77+(x<118?5:1)],[[x+1,83+(x<118?5:1)]],null,'#d38b83',1.7);
  } else if(hat==='beret'){
    path(c,[59,69],[[58,48,98,24,145,25],[181,24,203,42,197,57],[190,70,167,71,151,69],
      [124,80,79,84,59,69]],'#8b344c');
    path(c,[66,65],[[92,37,151,30,184,39],[152,34,116,60,66,65]],'#bd645e',null);
    path(c,[137,34],[[141,23,151,23]],null,INK,3.8);
  }
}

function glasses(c,kind) {
  const rx=kind==='round'?17:20;
  path(c,[66,116],[[83,115]],null,INK,3.8);
  path(c,[119,120],[[127,112,137,118]],null,INK,3);
  for(const [x,y,r] of [[99,123,rx],[154,119,rx-1]]){
    if(kind==='square'){
      path(c,[x-r,y-13],[[x+r-3,y-13],[x+r+3,y-13,x+r,y-4],[x+r-3,y+13],
        [x-r+4,y+14],[x-r-1,y+12,x-r,y-13]],'#f9e4bd22',INK,3.8);
    }else oval(c,x,y,r,kind==='oval'?12:17,'#f9e4bd22',INK,3.6,-.12);
    path(c,[x-r*.66,y-6],[[x-3,y-12]],null,'#fff5d4b0',1.7);
  }
}

export function paintPortrait(c,v,colors,layer) {
  const {skin,hair,shirt,eyes}=colors;
  if(!layer('background'))paintScene(c,v.background);
  layer('behind');
  if(!layer.hasHair)backHair(c,v.style,hair);
  shirtAndNeck(c,v,skin,shirt);
  paintMysteryGarment(c,v,shirt);
  c.save();
  if(v.pose==='tilt'){c.translate(126,150);c.rotate(-.12);c.translate(-126,-150);}
  face(c,v,skin,hair,eyes);
  if(!layer('hair')){
    if(SPECIAL_HAIR_STYLES.includes(v.style))paintMysteryHair(c,v.style,hair);
    else frontHair(c,v.style,hair);
  }
  paintMysteryExpression(c,v,eyes,skin);
  layer('eyes');
  if(!layer('eyewear')&&(v.glasses!=='none'||v.accessory==='glasses')){
    if(['aviator','cat-eye','retro-square'].includes(v.glasses))paintMysteryGlasses(c,v.glasses);
    else glasses(c,v.glasses==='none'?'round':v.glasses);
  }
  if(!layer('hat')) {
    if(v.hat!=='none')basicHat(c,v.hat);
    else if(v.accessory==='headphones'){
      path(c,[53,117],[[44,38,115,21,157,42],[192,56,201,88,194,114]],null,INK,7);
      oval(c,57,123,10,21,'#754a66',INK,2.8,-.18);
      oval(c,191,115,8,18,'#754a66',INK,2.7,.18);
      path(c,[54,112],[[50,123,55,135]],null,'#d5a7ac',2.2);
    }else if(v.accessory==='crown'){
      path(c,[86,63],[[78,35],[104,48],[120,28],[138,46],[163,30],[171,61],[125,72]],'#e7ac45');
      path(c,[88,58],[[124,62,164,54]],null,'#ffdf8e',3.1);
      oval(c,121,52,5,6,'#ad4d54',INK,1.5);
    }
  }
  c.restore();
  layer('prop');
  layer('companion');
  layer('effect');
}
