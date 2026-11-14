/* Family Avatar Studio: original, fully local character art.
   No external images, tracking, accounts, or third-party avatar service. */
export const AVATAR_OPTIONS=Object.freeze({
  skin:[['porcelain','Fair','#f5d2bb'],['sand','Warm','#dbad86'],['amber','Golden','#bf8154'],['copper','Brown','#895138'],['deep','Deep','#603722'],['espresso','Rich','#402824']],
  hair:[['brown','Brown','#513020'],['black','Black','#221d29'],['blonde','Blonde','#e6b05a'],['auburn','Auburn','#953e27'],['silver','Silver','#b6bbc9'],['purple','Purple','#773d9b']],
  style:[['short','Short'],['wavy','Wavy'],['curly','Curly'],['long','Long'],['spiky','Spiky'],['bald','No hair']],
  eyes:[['brown','Brown','#513421'],['blue','Blue','#3e749e'],['green','Green','#438466'],['hazel','Hazel','#996a36']],
  shirt:[['violet','Violet','#673687'],['teal','Teal','#087d81'],['rose','Rose','#b74b79'],['gold','Gold','#cd9a42'],['navy','Navy','#3c4b81'],['forest','Forest','#30765a']],
  background:[['lavender','Lavender','#d8b8ef'],['sunset','Sunset','#f1b9a6'],['ocean','Ocean','#aedbe5'],['mint','Mint','#b4dfc6'],['night','Night','#41345f']],
  accessory:[['none','Nothing'],['glasses','Glasses'],['freckles','Freckles'],['headphones','Headphones'],['crown','Crown']]
});
export const DEFAULT_AVATAR_RECIPE=Object.freeze({
 skin:'sand',hair:'brown',style:'wavy',eyes:'brown',
 shirt:'violet',background:'lavender',accessory:'none'
});
export const AVATAR_LABELS=Object.freeze({
 skin:'Skin tone',hair:'Hair color',style:'Hair style',eyes:'Eye color',
 shirt:'Outfit',background:'Background',accessory:'Fun extras'
});
export function normalizeAvatarRecipe(value){
 const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const result={};
 for(const [key,items] of Object.entries(AVATAR_OPTIONS))
   result[key]=items.some(item=>item[0]===source[key])?source[key]:DEFAULT_AVATAR_RECIPE[key];
 return result;
}
export function isValidAvatarRecipe(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const keys=Object.keys(AVATAR_OPTIONS);
 return Object.keys(value).length===keys.length&&keys.every(key=>
   typeof value[key]==='string'&&AVATAR_OPTIONS[key].some(item=>item[0]===value[key]));
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
export function drawFamilyAvatar(canvas,value){
 const v=normalizeAvatarRecipe(value),ctx=canvas.getContext('2d');
 if(!ctx)return;
 const W=256,H=256;
 ctx.clearRect(0,0,W,H);
 const bg=color('background',v.background),skin=color('skin',v.skin),
   hair=color('hair',v.hair),shirt=color('shirt',v.shirt),eyes=color('eyes',v.eyes);
 const grad=ctx.createLinearGradient(0,0,256,256);
 grad.addColorStop(0,bg);grad.addColorStop(1,'#f5e9ff');
 ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 ctx.globalAlpha=.23;
 ellipse(ctx,200,32,74,74,'#fff');ellipse(ctx,18,218,63,86,'#fff');
 ctx.globalAlpha=1;
 // Original character illustration, deterministic for a saved recipe.
 ellipse(ctx,130,258,118,86,'#372a44');
 ellipse(ctx,128,242,103,75,shirt);
 ellipse(ctx,128,192,25,36,skin);
 if(v.style==='long'||v.style==='wavy'){
   ellipse(ctx,127,114,77,94,hair);
   ellipse(ctx,71,169,24,54,hair);ellipse(ctx,184,168,24,56,hair);
 }
 // Ears first, then the rounded face.
 ellipse(ctx,59,128,15,20,skin);ellipse(ctx,197,128,15,20,skin);
 ellipse(ctx,128,120,68,80,skin);
 ctx.globalAlpha=.14;ellipse(ctx,128,165,48,22,'#702d2b');ctx.globalAlpha=1;
 if(v.style!=='bald'){
   if(v.style==='spiky'){
     curve(ctx,[64,103,57,79,65,52,75,72,86,33,104,60,116,24,128,48,145,33,172,46,167,31,190,70,190,107,166,95,151,71,121,77,92,80,77,106],hair);
   }else if(v.style==='curly'){
     for(const [x,y,r] of [[69,82,25],[84,57,24],[113,46,26],[144,45,25],[169,60,25],[187,82,22],[102,74,27],[152,74,25]])
       ellipse(ctx,x,y,r,r,hair);
   }else{
     curve(ctx,[62,107,61,58,93,39,128,40,169,39,195,61,194,111,174,99,164,84,152,74,122,94,92,78,73,96,62,107],hair);
     if(v.style==='wavy'){
       ellipse(ctx,81,80,23,16,hair);ellipse(ctx,112,65,24,16,hair);
     }
   }
 }
 // Brows and eyes, with a small highlight.
 for(const x of [99,155]){
   ctx.lineWidth=3;ctx.strokeStyle='#34272b';ctx.beginPath();
   ctx.moveTo(x-11,107);ctx.quadraticCurveTo(x,102,x+11,107);ctx.stroke();
   ellipse(ctx,x,123,12,9,'#fff9f4');ellipse(ctx,x,123,6,7,eyes);
   ellipse(ctx,x+1,123,3,4,'#201f28');ellipse(ctx,x-2,121,2,2,'#fff');
 }
 ctx.lineWidth=2;ctx.strokeStyle='#8d5650';ctx.beginPath();
 ctx.moveTo(128,128);ctx.lineTo(124,144);ctx.lineTo(131,146);ctx.stroke();
 ctx.strokeStyle='#6d3c3f';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();
 ctx.moveTo(109,160);ctx.quadraticCurveTo(128,175,147,160);ctx.stroke();
 ctx.globalAlpha=.28;
 ellipse(ctx,83,147,13,7,'#dc7d76');ellipse(ctx,174,147,13,7,'#dc7d76');
 ctx.globalAlpha=1;
 // Crisp outfit neckline.
 ctx.lineWidth=5;ctx.strokeStyle='#fff0de';ctx.beginPath();
 ctx.moveTo(106,195);ctx.quadraticCurveTo(128,218,150,195);ctx.stroke();
 if(v.accessory==='glasses'){
   ctx.strokeStyle='#252334';ctx.lineWidth=4;
   for(const x of [99,156]){ctx.beginPath();ctx.roundRect(x-18,110,36,28,8);ctx.stroke();}
   ctx.beginPath();ctx.moveTo(117,120);ctx.lineTo(138,120);ctx.stroke();
 }else if(v.accessory==='freckles'){
   for(const [x,y] of [[85,143],[93,145],[100,143],[154,143],[162,145],[170,143]])
     ellipse(ctx,x,y,1.8,1.8,'#885043');
 }else if(v.accessory==='headphones'){
   ctx.lineWidth=9;ctx.strokeStyle='#37304e';ctx.beginPath();
   ctx.arc(128,116,77,Math.PI*1.07,Math.PI*1.93);ctx.stroke();
   for(const x of [51,205])ellipse(ctx,x,137,13,30,'#663e93');
 }else if(v.accessory==='crown'){
   curve(ctx,[89,65,88,38,102,49,113,56,123,30,134,52,148,56,168,41,174,62,170,76,117,78,89,65],'#f4b73e');
   ctx.fillStyle='#fff1b5';ctx.fillRect(98,66,62,8);
 }
 ctx.strokeStyle='#ffffff95';ctx.lineWidth=4;ctx.beginPath();
 ctx.arc(128,128,121,0,Math.PI*2);ctx.stroke();
}
export function makeAvatarStudioHTML(recipe){
 const v=normalizeAvatarRecipe(recipe);
 const groups=[['skin','Face and skin'],['style','Hairstyle'],['hair','Hair color'],
   ['eyes','Eyes'],['shirt','Clothes'],['background','Background'],['accessory','Extras']];
 const renderGroup=([key,label])=>'<fieldset class="family-avatar-field"><legend>'+label+'</legend><div class="family-avatar-picks">'+
 AVATAR_OPTIONS[key].map(([id,name,hex])=>
  '<button type="button" class="family-avatar-choice" data-avatar-feature="'+key+'" data-avatar-value="'+id+'" aria-pressed="'+(v[key]===id)+'" aria-label="'+label+': '+name+'">'+
  (hex?'<span class="family-avatar-color" style="background:'+hex+'"></span>':'')+'<span>'+name+'</span></button>'
 ).join('')+'</div></fieldset>';
 return '<section class="family-character-editor" aria-labelledby="family-character-title">'+
   '<div class="family-character-top"><div class="family-character-portrait">'+
   '<canvas id="family-avatar-canvas" width="256" height="256" role="img" aria-label="Preview of your custom character"></canvas></div>'+
   '<div class="family-character-intro"><h3 id="family-character-title">Make your character</h3><p>Try colors, hair and accessories. Your creation stays on your family profile.</p>'+
   '<button type="button" class="button-quiet" data-avatar-random>Surprise me ✨</button></div></div>'+
   '<div class="family-avatar-fields">'+groups.map(renderGroup).join('')+'</div>'+
   '<p class="family-avatar-help">Changes appear instantly. Select <strong>Save my avatar</strong> to keep your character for the family games and conversations.</p>'+
   '</section>';
}
export function randomAvatarRecipe(random=Math.random){
 const out={};
 for(const [key,items] of Object.entries(AVATAR_OPTIONS))
   out[key]=items[Math.min(items.length-1,Math.floor(random()*items.length))][0];
 return out;
}
