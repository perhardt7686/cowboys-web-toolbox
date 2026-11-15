/* Family Avatar Studio: original, fully local character art.
   No external images, tracking, accounts, or third-party avatar service. */
import {paintPortrait} from './avatar-cel-portrait.mjs?v=toon3';

export const AVATAR_OPTIONS = Object.freeze({
  skin:[['porcelain','Fair','#f5d2bb'],['bisque','Bisque','#eac3a4'],['sand','Warm','#dbad86'],['tan','Tan','#ce966a'],['amber','Golden','#bf8154'],['copper','Brown','#895138'],['deep','Deep','#603722'],['espresso','Rich','#402824']],
  hair:[['brown','Brown','#513020'],['black','Black','#221d29'],['blonde','Blonde','#e6b05a'],['auburn','Auburn','#953e27'],['silver','Silver','#b6bbc9'],['purple','Purple','#773d9b'],['chestnut','Chestnut','#733e26'],['red','Copper red','#bd582c'],['grey','Salt and pepper','#68636f'],['pale','Platinum','#f4e2bc'],['teal','Electric teal','#147f83'],['coral','Vintage coral','#ca6f65'],['lime','Lime green','#90ad45']],
  style:[['short','Short'],['wavy','Wavy'],['curly','Curly'],['long','Long'],['spiky','Spiky'],['bald','No hair'],['braids','Braids'],['bun','Bun'],['locs','Locs'],['bob','Bob'],['part','Side part'],['crop','Crop'],['shaved','Close shave'],['coils','Coils'],['ponytail','Ponytail'],['shag','70s shag'],['flip','Flipped ends'],['pompadour','Pompadour'],['afro','Rounded afro'],['fringe','Full fringe'],['feathered','Feathered waves']],
  eye_shape:[['classic','Classic toon eyes'],['round','Wide round eyes'],['almond','Almond eyes'],['wide','Alert detective eyes'],['sleepy','Sleepy side-eye'],['dramatic','Dramatic eyes']],
  eyes:[['brown','Brown','#513421'],['blue','Blue','#3e749e'],['green','Green','#438466'],['hazel','Hazel','#996a36'],['grey','Grey','#637581'],['amber','Amber','#be781f'],['black','Dark brown','#251820'],['violet','Violet','#835fa8'],['aqua','Aqua','#3a9dad']],
  shirt:[['violet','Violet','#673687'],['teal','Teal','#087d81'],['rose','Rose','#b74b79'],['gold','Gold','#cd9a42'],['navy','Navy','#3c4b81'],['forest','Forest','#30765a'],['cream','Cream','#ece0c6'],['rust','Rust','#a34439'],['sky','Sky','#5896b9'],['plum','Plum','#622846'],['olive','Olive','#62663d'],['black','Black','#292831'],['burntorange','Burnt orange','#cf6738'],['turquoise','Retro turquoise','#2f8c95'],['maroon','Maroon','#822f4e'],['lime','Lime','#a4ad4d']],
  background:[['lavender','Lavender','#d8b8ef'],['sunset','Sunset','#f1b9a6'],['ocean','Ocean','#aedbe5'],['mint','Mint','#b4dfc6'],['night','Night','#41345f'],['cloud','Cloud','#c5d2e3'],['sand','Sand','#ead092'],['rose','Rose','#efbfce'],['heather','Heather','#b8abd8'],['sky','Sky','#8acbde'],['peach','Peach','#f3c487'],['sunflower','Sunflower gold','#f2c76b'],['ochre','Golden ochre','#bd8864'],['moss','Mossy green','#689b80']],
  accessory:[['none','Nothing'],['glasses','Glasses'],['freckles','Freckles'],['headphones','Headphones'],['crown','Crown'],['earrings','Earrings'],['scarf','Scarf'],['bowtie','Bow tie'],['badge','Enamel pin']],
  brows:[['soft','Soft'],['straight','Straight'],['bold','Bold'],['arching','Arching']],
  beard:[['none','Clean shaven'],['stubble','Stubble'],['beard','Full beard'],['moustache','Moustache'],['goatee','Goatee']],
  expression:[['smile','Smile'],['grin','Grin'],['calm','Calm'],['wink','Wink'],['curious','Curious'],['smirk','Cheeky smirk'],['laugh','Big laugh'],['determined','Brave & serious']],
  pose:[['center','Portrait'],['tilt','Head tilt'],['wave','Wave']],
  face:[['oval','Classic oval'],['angular','Daring angular'],['round','Cheerful round'],['square','Sturdy square'],['long','Sleuth long'],['heart','Playful heart']],
  nose:[['button','Button nose'],['straight','Straight'],['swoop','Swoop'],['pointed','Sharp'],['freckled','Rosy nose']],
  cheeks:[['plain','Natural'],['rosy','Rosy cheeks'],['dimples','Dimples'],['freckles','Freckles']],
  garment:[['collared','Retro collared shirt'],['striped','Striped tee'],['cardigan','Comfy cardigan'],['sweater','Chunky sweater'],['denim','Denim jacket'],['vest','Explorer vest'],['turtleneck','Mystery turtleneck'],['jacket','Adventure jacket'],['jumpsuit','Adventure jumpsuit'],['hoodie','Mystery hoodie'],['safari','Safari explorer']],
  hat:[['none','No hat'],['cap','Ball cap'],['beanie','Beanie'],['western','Western hat'],['beret','Beret']],
  glasses:[['none','No glasses'],['round','Round frames'],['square','Square frames'],['oval','Oval frames'],['aviator','70s aviators'],['cat-eye','Dramatic cat-eye'],['retro-square','Chunky square frames']]
});
export const DEFAULT_AVATAR_RECIPE = Object.freeze({
  skin:'sand',hair:'brown',style:'wavy',eyes:'brown',shirt:'violet',background:'lavender',accessory:'none',
  eye_shape:'classic',brows:'soft',beard:'none',expression:'smile',pose:'center',face:'oval',nose:'button',cheeks:'plain',garment:'collared',hat:'none',glasses:'none'
});
export const AVATAR_LABELS = Object.freeze({
  skin:'Skin tone',hair:'Hair color',style:'Hairstyle',eyes:'Eye color',shirt:'Outfit',background:'Background',
  accessory:'Accessories',eye_shape:'Eye shape',face:'Face shape',nose:'Nose',cheeks:'Cheeks',garment:'Retro outfit',brows:'Brows',beard:'Facial hair',expression:'Expression',pose:'Pose',hat:'Basic hats',glasses:'Basic glasses'
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
const color=(key,option)=>AVATAR_OPTIONS[key].find(([id])=>id===option)?.[2];

export function drawFamilyAvatar(canvas, value, overlays = {}, t = 0) {
  const v=normalizeAvatarRecipe(value),ctx=canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.scale(canvas.width/256,canvas.height/256);
  ctx.clearRect(0,0,256,256);
  const layer=name=>{
    if(!overlays[name])return false;
    ctx.save();
    overlays[name](ctx,t);
    ctx.restore();
    return true;
  };
  layer.hasHair=Boolean(overlays.hair);
  paintPortrait(ctx,v,{
    skin:color('skin',v.skin),hair:color('hair',v.hair),shirt:color('shirt',v.shirt),eyes:color('eyes',v.eyes)
  },layer);
  ctx.restore();
}
export function makeAvatarStudioHTML(recipe) {
  const v=normalizeAvatarRecipe(recipe);
  const groups=[
    ['Face & skin',['skin','face','nose','cheeks']],
    ['Hair & facial hair',['style','hair','beard']],
    ['Eyes & expressions',['eyes','eye_shape','brows','expression']],
    ['Groovy wardrobe',['shirt','garment','hat','glasses','accessory']],
    ['Backdrop & pose',['background','pose']]
  ];
  const renderGroup=key=>'<fieldset class="family-avatar-field"><legend>'+AVATAR_LABELS[key]+'</legend><div class="family-avatar-picks">'+
    AVATAR_OPTIONS[key].map(([id,name,hex])=>
      '<button type="button" class="family-avatar-choice" data-avatar-feature="'+key+'" data-avatar-value="'+id+'" aria-pressed="'+(v[key]===id)+'" aria-label="'+AVATAR_LABELS[key]+': '+name+'">'+
      (hex?'<span class="family-avatar-color" style="background:'+hex+'"></span>':'')+'<span>'+name+'</span></button>'
    ).join('')+'</div></fieldset>';
  return '<section class="family-character-editor" aria-labelledby="family-character-title">'+
    '<div class="family-character-top"><div class="family-character-portrait">'+
    '<canvas id="family-avatar-canvas" width="256" height="256" role="img" aria-label="Preview of your custom character"></canvas></div>'+
    '<div class="family-character-intro"><h3 id="family-character-title">My mystery-cartoon character</h3>'+
    '<p id="avatar-preview-status" role="status">Choose a look, then save your avatar.</p>'+
    '<div class="avatar-preview-actions"><button type="button" class="button-quiet" data-avatar-random>Surprise me</button>'+
    '<button type="button" class="button-quiet" data-avatar-undo>Undo</button>'+
    '<button type="button" class="button-quiet" data-avatar-reset>Reset preview</button></div></div></div>'+
    '<div class="family-avatar-fields">'+groups.map(([title,keys],index)=>
      '<details class="avatar-feature-group"'+(index===0?' open':'')+'><summary>'+title+'</summary>'+
      '<div>'+keys.map(renderGroup).join('')+'</div></details>').join('')+'</div>'+
    '<div id="avatar-equipped"></div><div id="avatar-outfits"></div>'+
    '</section>';
}
export function randomAvatarRecipe(random=Math.random){
 const out={};
 for(const [key,items] of Object.entries(AVATAR_OPTIONS))
   out[key]=items[Math.min(items.length-1,Math.floor(random()*items.length))][0];
 return out;
}
