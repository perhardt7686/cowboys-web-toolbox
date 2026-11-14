/* Family Avatar Studio: original, fully local character art.
   No external images, tracking, accounts, or third-party avatar service. */
export const AVATAR_OPTIONS = Object.freeze({
  skin:[['porcelain','Fair','#f5d2bb'],['bisque','Bisque','#eac3a4'],['sand','Warm','#dbad86'],['tan','Tan','#ce966a'],['amber','Golden','#bf8154'],['copper','Brown','#895138'],['deep','Deep','#603722'],['espresso','Rich','#402824']],
  hair:[['brown','Brown','#513020'],['black','Black','#221d29'],['blonde','Blonde','#e6b05a'],['auburn','Auburn','#953e27'],['silver','Silver','#b6bbc9'],['purple','Purple','#773d9b'],['chestnut','Chestnut','#733e26'],['red','Copper red','#bd582c'],['grey','Salt and pepper','#68636f'],['pale','Platinum','#f4e2bc']],
  style:[['short','Short'],['wavy','Wavy'],['curly','Curly'],['long','Long'],['spiky','Spiky'],['bald','No hair'],['braids','Braids'],['bun','Bun'],['locs','Locs'],['bob','Bob'],['part','Side part'],['crop','Crop'],['shaved','Close shave'],['coils','Coils'],['ponytail','Ponytail']],
  eyes:[['brown','Brown','#513421'],['blue','Blue','#3e749e'],['green','Green','#438466'],['hazel','Hazel','#996a36'],['grey','Grey','#637581'],['amber','Amber','#be781f'],['black','Dark brown','#251820']],
  shirt:[['violet','Violet','#673687'],['teal','Teal','#087d81'],['rose','Rose','#b74b79'],['gold','Gold','#cd9a42'],['navy','Navy','#3c4b81'],['forest','Forest','#30765a'],['cream','Cream','#ece0c6'],['rust','Rust','#a34439'],['sky','Sky','#5896b9'],['plum','Plum','#622846'],['olive','Olive','#62663d'],['black','Black','#292831']],
  background:[['lavender','Lavender','#d8b8ef'],['sunset','Sunset','#f1b9a6'],['ocean','Ocean','#aedbe5'],['mint','Mint','#b4dfc6'],['night','Night','#41345f'],['cloud','Cloud','#c5d2e3'],['sand','Sand','#ead092'],['rose','Rose','#efbfce'],['heather','Heather','#b8abd8'],['sky','Sky','#8acbde'],['peach','Peach','#f3c487']],
  accessory:[['none','Nothing'],['glasses','Glasses'],['freckles','Freckles'],['headphones','Headphones'],['crown','Crown'],['earrings','Earrings'],['scarf','Scarf'],['bowtie','Bow tie'],['badge','Enamel pin']],
  brows:[['soft','Soft'],['straight','Straight'],['bold','Bold'],['arching','Arching']],
  beard:[['none','Clean shaven'],['stubble','Stubble'],['beard','Full beard'],['moustache','Moustache'],['goatee','Goatee']],
  expression:[['smile','Smile'],['grin','Grin'],['calm','Calm'],['wink','Wink'],['curious','Curious']],
  pose:[['center','Portrait'],['tilt','Head tilt'],['wave','Wave']],
  hat:[['none','No hat'],['cap','Ball cap'],['beanie','Beanie'],['western','Western hat'],['beret','Beret']],
  glasses:[['none','No glasses'],['round','Round frames'],['square','Square frames'],['oval','Oval frames']]
});
export const DEFAULT_AVATAR_RECIPE = Object.freeze({
  skin:'sand',hair:'brown',style:'wavy',eyes:'brown',shirt:'violet',background:'lavender',accessory:'none',
  brows:'soft',beard:'none',expression:'smile',pose:'center',hat:'none',glasses:'none'
});
export const AVATAR_LABELS = Object.freeze({
  skin:'Skin tone',hair:'Hair color',style:'Hairstyle',eyes:'Eye color',shirt:'Outfit',background:'Background',
  accessory:'Accessories',brows:'Brows',beard:'Facial hair',expression:'Expression',pose:'Pose',hat:'Basic hats',glasses:'Basic glasses'
});
export const FREE_OPTION_COUNT = Object.values(AVATAR_OPTIONS).reduce((total, values) => total + values.length, 0);
export function normalizeAvatarRecipe(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(Object.entries(AVATAR_OPTIONS).map(([key, choices]) =>
    [key, choices.some(([id]) => id === source[key]) ? source[key] : DEFAULT_AVATAR_RECIPE[key]]));
}
export function isValidAvatarRecipe(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(AVATAR_OPTIONS);
  return Object.keys(value).length === keys.length && keys.every(key =>
    typeof value[key] === 'string' && AVATAR_OPTIONS[key].some(([id]) => id === value[key]));
}
const color=(key,option)=>AVATAR_OPTIONS[key].find(i=>i[0]===option)?.[2]||'#777';
function ellipse(ctx,x,y,rx,ry,fill){
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
 ctx.fillStyle=fill;ctx.fill();
}
function curve(ctx,points,fill){
 ctx.beginPath();ctx.moveTo(points[0],points[1]);
 for(let i=2;i<points.length;){
   if(i+5<points.length){ctx.bezierCurveTo(...points.slice(i,i+6));i+=6;}
   else if(i+1<points.length){ctx.lineTo(points[i],points[i+1]);i+=2;}
   else break;
 }
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
}
function fillPath(c, color, fn) {
  c.beginPath();
  fn(c);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
function line(c, color, width, fn) {
  c.beginPath();
  fn(c);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.stroke();
}
function hairBehind(c, style, shade) {
  if (['long','wavy','bob','locs','braids'].includes(style)) {
    ellipse(c,127,113,77,style === 'bob' ? 76 : 94,shade);
    if (['long','wavy'].includes(style)) {
      ellipse(c,71,169,24,54,shade);
      ellipse(c,184,168,24,56,shade);
    }
  } else if (style === 'ponytail') {
    curve(c,[156,79,190,42,233,59,226,107,220,136,206,165,222,189,188,189,174,144,184,121,156,79],shade);
    ellipse(c,190,87,9,12,'#b85778');
  } else if (style === 'bun') {
    ellipse(c,139,39,27,27,shade);
    line(c,'#ffffff60',3,a=>{a.moveTo(116,34);a.quadraticCurveTo(134,11,153,23);});
  }
}
function hairFront(c, style, shade) {
  if (style === 'bald') return;
  if (style === 'spiky') {
    curve(c,[64,103,57,79,65,52,75,72,86,33,104,60,116,24,128,48,145,33,172,46,167,31,190,70,190,107,166,95,151,71,121,77,92,80,77,106],shade);
    return;
  }
  if (style === 'shaved') {
    c.globalAlpha=.56;
    fillPath(c,shade,a=>{a.moveTo(64,94);a.bezierCurveTo(63,22,194,24,194,94);a.quadraticCurveTo(130,52,64,94);});
    c.globalAlpha=1;
    return;
  }
  if (['curly','coils'].includes(style)) {
    if (style === 'curly') {
      for (const [x,y,r] of [[69,82,25],[84,57,24],[113,46,26],[144,45,25],[169,60,25],[187,82,22],[102,74,27],[152,74,25]]) ellipse(c,x,y,r,r,shade);
    } else {
      ellipse(c,127,71,67,38,shade);
      for(let n=0;n<24;n+=1){
        const x=64+n%8*18,y=49+Math.floor(n/8)*15+Math.min(17,Math.abs(n%8-3)*5);
        ellipse(c,x,y,11,11,shade);
        line(c,'#ffffff45',1.7,a=>a.arc(x,y,5,.3,5.3));
      }
    }
    return;
  }
  if (style === 'part') {
    fillPath(c,shade,a=>{a.moveTo(57,109);a.bezierCurveTo(59,36,139,26,158,47);a.bezierCurveTo(183,40,198,76,198,112);a.quadraticCurveTo(181,81,155,57);a.quadraticCurveTo(115,101,57,109);});
    line(c,'#ffffff55',2,a=>{a.moveTo(155,58);a.quadraticCurveTo(108,75,82,75);});
    return;
  }
  if (style === 'crop') {
    curve(c,[62,99,60,48,96,34,128,39,165,35,196,52,194,100,183,97,177,80,177,77,151,85,129,80,102,82,80,80,71,87,62,99],shade);
    return;
  }
  curve(c,[62,107,61,58,93,39,128,40,169,39,195,61,194,111,174,99,164,84,152,74,122,94,92,78,73,96,62,107],shade);
  if (style === 'wavy') {
    ellipse(c,81,80,23,16,shade);
    ellipse(c,112,65,24,16,shade);
  }
  if (style === 'bob') {
    for (const x of [65,191]) ellipse(c,x,130,18,44,shade);
  }
  if (style === 'braids' || style === 'locs') {
    const braid=style === 'braids';
    for (const side of [-1,1]) {
      const start=128+side*62;
      const count=braid?2:4;
      for (let n=0;n<count;n+=1) {
        const x=start+side*(n*6),h=144+n*14;
        line(c,'#302536',braid?12:8,a=>{a.moveTo(x,91);a.quadraticCurveTo(x+side*11,h-11,x+side*8,h+30);});
        line(c,shade,braid?9:6,a=>{a.moveTo(x,91);a.quadraticCurveTo(x+side*11,h-11,x+side*8,h+30);});
        if (braid){
          for(let y=101;y<h+26;y+=9) line(c,'#ffffff66',1.5,a=>{a.moveTo(x+side*4,y);a.lineTo(x+side*10,y+4);});
          ellipse(c,x+side*8,h+30,7,5,'#d8a744');
        }
      }
    }
  }
}
function baseHat(c, hat) {
  if (hat === 'cap') {
    fillPath(c,'#37548b',a=>{a.moveTo(64,77);a.quadraticCurveTo(71,22,130,24);a.quadraticCurveTo(176,25,186,70);a.lineTo(188,83);a.quadraticCurveTo(128,92,64,77);});
    ellipse(c,161,80,51,9,'#253758');
    line(c,'#91bec9',3,a=>{a.moveTo(123,30);a.quadraticCurveTo(146,42,147,76);});
  } else if (hat === 'beanie') {
    ellipse(c,128,56,64,39,'#a04476');
    ellipse(c,127,21,14,12,'#dbc0ed');
    c.fillStyle='#77335b';c.fillRect(66,61,124,20);
    for(let x=72;x<=183;x+=8){c.fillStyle='#e2a8c1';c.fillRect(x,65,2,13);}
  } else if (hat === 'western') {
    ellipse(c,128,71,88,15,'#6e421f');
    fillPath(c,'#bd8157',a=>{a.moveTo(76,70);a.lineTo(83,38);a.quadraticCurveTo(86,26,117,39);a.quadraticCurveTo(130,50,146,37);a.quadraticCurveTo(170,26,175,47);a.lineTo(181,70);a.quadraticCurveTo(128,83,76,70);});
    line(c,'#462b21',6,a=>{a.moveTo(82,63);a.quadraticCurveTo(128,75,176,63);});
  } else if (hat === 'beret') {
    c.save();c.translate(130,54);c.rotate(-.19);
    ellipse(c,0,0,68,28,'#783145');
    ellipse(c,15,-8,48,19,'#a54c60');
    ellipse(c,12,-26,6,7,'#783145');
    c.restore();
  }
}
function frames(c, kind) {
  for(const x of [99,156]){
    line(c,'#252334',4,a=>{
      if(kind==='round')a.ellipse(x,123,17,17,0,0,Math.PI*2);
      else if(kind==='oval')a.ellipse(x,123,19,13,0,0,Math.PI*2);
      else a.roundRect(x-18,110,36,28,kind==='square'?4:8);
    });
  }
  line(c,'#252334',4,a=>{a.moveTo(117,120);a.lineTo(138,120);});
}
function features(c, v, eyeColor, hairColor) {
  for (const x of [99,155]) {
    const arch = v.brows === 'arching' ? 96 : v.brows === 'straight' ? 107 : 102;
    line(c,'#34272b',v.brows==='bold'?5:3,a=>{a.moveTo(x-11,107);a.quadraticCurveTo(x,arch,x+11,107);});
    if(v.expression==='wink'&&x===155) line(c,'#452f32',3,a=>{a.moveTo(x-10,123);a.quadraticCurveTo(x,117,x+10,123);});
    else {
      ellipse(c,x,123,12,9,'#fff9f4');ellipse(c,x,123,6,7,eyeColor);
      ellipse(c,x+1,123,3,4,'#201f28');ellipse(c,x-2,121,2,2,'#fff');
    }
  }
  line(c,'#8d5650',2,a=>{a.moveTo(128,128);a.lineTo(124,144);a.lineTo(131,146);});
  if (v.beard !== 'none') {
    if (v.beard === 'stubble') {
      for(let i=0;i<44;i++){
        const x=83+(i*29)%91,y=157+(i*17)%37;
        if(Math.hypot((x-128)*.62,y-166)<37)ellipse(c,x,y,1,1,hairColor+'a0');
      }
    } else if(v.beard === 'moustache') {
      ellipse(c,116,151,14,5,hairColor);ellipse(c,140,151,14,5,hairColor);
    } else {
      fillPath(c,hairColor,a=>{a.moveTo(v.beard==='beard'?73:106,147);a.quadraticCurveTo(128,177,v.beard==='beard'?184:148,147);a.quadraticCurveTo(153,204,128,205);a.quadraticCurveTo(99,203,v.beard==='beard'?73:106,147);});
    }
  }
  if(v.expression==='grin'){
    fillPath(c,'#6a3b41',a=>{a.moveTo(107,156);a.quadraticCurveTo(126,163,149,155);a.quadraticCurveTo(132,186,107,156);});
    line(c,'#fff5e7',3,a=>{a.moveTo(115,161);a.quadraticCurveTo(131,166,142,159);});
  } else if(v.expression==='curious')ellipse(c,128,163,7,8,'#804753');
  else line(c,'#6d3c3f',3,a=>{a.moveTo(109,160);a.quadraticCurveTo(128,v.expression==='calm'?163:175,147,160);});
}

export function drawFamilyAvatar(canvas, value, overlays = {}, t = 0) {
  const v=normalizeAvatarRecipe(value),ctx=canvas.getContext('2d');
  if (!ctx) return;
  const scale=canvas.width/256;
  ctx.save();ctx.scale(scale,canvas.height/256);ctx.clearRect(0,0,256,256);
  const bg=color('background',v.background),skin=color('skin',v.skin),
    hair=color('hair',v.hair),shirt=color('shirt',v.shirt),eyes=color('eyes',v.eyes);
  const layer = name => {
    if (!overlays[name]) return;
    ctx.save();overlays[name](ctx,t);ctx.restore();
  };
  if (overlays.background) layer('background');
  else {
    const grad=ctx.createLinearGradient(0,0,256,256);
    grad.addColorStop(0,bg);grad.addColorStop(1,v.background==='night'?'#6f528c':'#f5e9ff');
    ctx.fillStyle=grad;ctx.fillRect(0,0,256,256);
    ctx.globalAlpha=.23;ellipse(ctx,200,32,74,74,'#fff');ellipse(ctx,18,218,63,86,'#fff');ctx.globalAlpha=1;
  }
  layer('behind');
  if(v.pose==='wave'){
    ellipse(ctx,206,215,17,38,shirt);ellipse(ctx,207,177,14,16,skin);
    for(let x=195;x<=215;x+=5)ellipse(ctx,x,166-(x%4)*2,3.5,10,skin);
  }
  ellipse(ctx,130,258,118,86,'#372a44');
  ellipse(ctx,128,242,103,75,shirt);
  ellipse(ctx,128,192,25,36,skin);
  line(ctx,'#fff0de',5,a=>{a.moveTo(106,195);a.quadraticCurveTo(128,218,150,195);});
  if(v.accessory==='scarf'){
    ellipse(ctx,128,199,36,12,'#b3426f');
    fillPath(ctx,'#d96384',a=>{a.moveTo(138,201);a.lineTo(161,203);a.lineTo(152,253);a.lineTo(132,248);});
  } else if(v.accessory==='bowtie'){
    fillPath(ctx,'#3b284e',a=>{a.moveTo(105,196);a.lineTo(151,216);a.lineTo(151,196);a.lineTo(105,216);});ellipse(ctx,128,206,7,6,'#b94e6d');
  } else if(v.accessory==='badge')ellipse(ctx,172,227,11,11,'#de9b3d');
  ctx.save();
  if(v.pose==='tilt'){ctx.translate(128,126);ctx.rotate(-.11);ctx.translate(-128,-126);}
  if(!overlays.hair)hairBehind(ctx,v.style,hair);
  ellipse(ctx,59,128,15,20,skin);ellipse(ctx,197,128,15,20,skin);
  ellipse(ctx,128,120,68,80,skin);
  ctx.globalAlpha=.14;ellipse(ctx,128,165,48,22,'#702d2b');ctx.globalAlpha=1;
  if(overlays.hair)layer('hair');else hairFront(ctx,v.style,hair);
  features(ctx,v,eyes,hair);
  ctx.globalAlpha=.28;ellipse(ctx,83,147,13,7,'#dc7d76');ellipse(ctx,174,147,13,7,'#dc7d76');ctx.globalAlpha=1;
  if(v.accessory==='freckles')for(const [x,y] of [[85,143],[93,145],[100,143],[154,143],[162,145],[170,143]])ellipse(ctx,x,y,1.8,1.8,'#885043');
  if(v.accessory==='earrings')for(const x of [55,201])line(ctx,'#edba54',4,a=>a.ellipse(x,143,7,10,0,0,Math.PI*2));
  layer('eyes');
  if(overlays.eyewear)layer('eyewear');
  else if(v.glasses!=='none'||v.accessory==='glasses')frames(ctx,v.glasses);
  if(overlays.hat)layer('hat');
  else if(v.hat!=='none')baseHat(ctx,v.hat);
  else if(v.accessory==='headphones'){
    line(ctx,'#37304e',9,a=>a.arc(128,116,77,Math.PI*1.07,Math.PI*1.93));
    for(const x of [51,205])ellipse(ctx,x,137,13,30,'#663e93');
  }else if(v.accessory==='crown'){
    curve(ctx,[89,65,88,38,102,49,113,56,123,30,134,52,148,56,168,41,174,62,170,76,117,78,89,65],'#f4b73e');
    ctx.fillStyle='#fff1b5';ctx.fillRect(98,66,62,8);
  }
  ctx.restore();
  layer('prop');layer('companion');layer('effect');
  line(ctx,'#ffffff95',4,a=>a.arc(128,128,121,0,Math.PI*2));
  ctx.restore();
}
export function makeAvatarStudioHTML(recipe) {
  const v=normalizeAvatarRecipe(recipe);
  const order=['skin','style','hair','eyes','shirt','background','hat','glasses','accessory','brows','beard','expression','pose'];
  const renderGroup=key=>'<fieldset class="family-avatar-field"><legend>'+AVATAR_LABELS[key]+'</legend><div class="family-avatar-picks">'+
    AVATAR_OPTIONS[key].map(([id,name,hex])=>
      '<button type="button" class="family-avatar-choice" data-avatar-feature="'+key+'" data-avatar-value="'+id+'" aria-pressed="'+(v[key]===id)+'" aria-label="'+AVATAR_LABELS[key]+': '+name+'">'+
      (hex?'<span class="family-avatar-color" style="background:'+hex+'"></span>':'')+'<span>'+name+'</span></button>'
    ).join('')+'</div></fieldset>';
  return '<section class="family-character-editor" aria-labelledby="family-character-title">'+
    '<div class="family-character-top"><div class="family-character-portrait">'+
    '<canvas id="family-avatar-canvas" width="256" height="256" role="img" aria-label="Preview of your custom character"></canvas></div>'+
    '<div class="family-character-intro"><h3 id="family-character-title">My character</h3>'+
    '<p id="avatar-preview-status" role="status">Every basic choice is free.</p>'+
    '<div class="avatar-preview-actions"><button type="button" class="button-quiet" data-avatar-random>Surprise me</button>'+
    '<button type="button" class="button-quiet" data-avatar-undo>Undo</button>'+
    '<button type="button" class="button-quiet" data-avatar-reset>Reset preview</button></div></div></div>'+
    '<div class="family-avatar-fields">'+order.map(renderGroup).join('')+'</div>'+
    '<div id="avatar-equipped"></div><div id="avatar-outfits"></div>'+
    '</section>';
}
export function randomAvatarRecipe(random=Math.random){
 const out={};
 for(const [key,items] of Object.entries(AVATAR_OPTIONS))
   out[key]=items[Math.min(items.length-1,Math.floor(random()*items.length))][0];
 return out;
}
