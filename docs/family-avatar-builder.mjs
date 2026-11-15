/* Family Avatar Studio: original, fully local character art.
   No external images, tracking, accounts, or third-party avatar service. */
import {FULL_BODY_OPTIONS,SCULPT_LABELS,WARDROBE_LABELS,normalizeBody} from './avatar-full-body.mjs?v=studio2';
import {turntableHTML} from './avatar-turntable-controls.mjs?v=studio2';
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
  const kit=normalizeBody(recipe);
  const renderField=key=>{
    const full=Boolean(FULL_BODY_OPTIONS[key]);
    const label=full?WARDROBE_LABELS[key]:AVATAR_LABELS[key];
    const choices=full?FULL_BODY_OPTIONS[key]:AVATAR_OPTIONS[key];
    const selected=full?kit[key]:v[key];
    return '<fieldset class="family-avatar-field" data-studio-field="'+key+'"><legend>'+label+'</legend><div class="family-avatar-picks">'+
      choices.map(([id,name,hex])=>
        '<button type="button" class="family-avatar-choice" '+(full?'data-avatar-body':'data-avatar-feature')+
        '="'+key+'" data-avatar-value="'+id+'" aria-pressed="'+(selected===id)+'" aria-label="'+label+': '+name+'">'+
        (key==='model'?'<canvas class="studio-look-art" width="156" height="176" data-look-preview="'+id+'" aria-hidden="true"></canvas>':'')+
        (hex?'<span class="family-avatar-color" style="background:'+hex+'"></span>':'')+'<span>'+name+'</span></button>'
      ).join('')+'</div></fieldset>';
  };
  const panels=[
    ['looks','Looks',[['Body styles',['model']],['Pose',['pose']]]],
    ['face','Face',[['Face & skin',['skin','face','nose','cheeks']],['Eyes & expressions',['eyes','eye_shape','brows','expression']]]],
    ['hair','Hair',[['Hair & facial hair',['style','hair','beard']]]],
    ['clothes','Clothes',[['Tops & jackets',['garment','shirt','outerwear']],['Bottoms & shoes',['bottoms','footwear']]]],
    ['gear','Gear',[['Hats & glasses',['hat','glasses','accessory']],['Layers & accessories',['neckwear','waist','hands','back']]]],
    ['scenes','Scenes',[['Backdrops',['background']]]]
  ];
  const sliders=keys=>'<fieldset class="studio-sculpt"><legend>Fine tune</legend>'+
    keys.map(key=>'<label><span>'+SCULPT_LABELS[key]+'</span><input type="range" min="-2" max="2" step="1" value="'+
      (kit[key]??'0')+'" data-studio-sculpt="'+key+'"></label>').join('')+'</fieldset>';
  return '<section class="family-character-editor avatar-dressing-studio" aria-label="Avatar editor">'+
    '<div class="family-character-top studio-stage">'+
      '<div class="studio-stage-title"><h3 id="family-character-title">Character</h3>'+
      '<div class="avatar-preview-actions" role="group" aria-label="Edit history">'+
      '<button type="button" class="studio-text-button" data-avatar-undo>Undo</button>'+
      '<button type="button" class="studio-text-button" data-avatar-reset>Restore saved</button></div></div>'+
      turntableHTML({editor:true})+
      '<p id="avatar-preview-status" class="studio-preview-message" role="status"></p>'+
    '</div>'+
    '<div class="studio-editor-panel">'+
      '<div class="family-avatar-fields"><div class="studio-edit-tabs" role="group" aria-label="Character parts">'+
      panels.map(([id,label],index)=>'<button type="button" data-studio-part="'+id+'" aria-pressed="'+(!index)+'">'+label+'</button>').join('')+
      '</div>'+
      panels.map(([id,label,groups],index)=>'<div data-studio-panel="'+id+'" role="region" aria-label="'+label+'"'+(index?' hidden':'')+'>'+
        groups.map(([title,keys],position)=>'<details class="avatar-feature-group"'+(!position?' open':'')+'><summary>'+title+'</summary>'+
          '<div>'+keys.map(renderField).join('')+'</div></details>').join('')+
        (id==='looks'?sliders(['height','build']):id==='face'?sliders(['jaw','eye_spacing']):'')+
        (!index?'<button type="button" class="studio-shuffle studio-text-button" data-avatar-random>Surprise me</button>':'')+
        '</div>').join('')+
      '</div>'+
      '<div id="avatar-equipped"></div><div id="avatar-outfits"></div>'+
    '</div>'+
    '</section>';
}
export function randomAvatarRecipe(random=Math.random){
 const out={};
 for(const [key,items] of Object.entries(AVATAR_OPTIONS))
   out[key]=items[Math.min(items.length-1,Math.floor(random()*items.length))][0];
 return out;
}
