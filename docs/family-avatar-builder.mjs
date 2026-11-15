/* Family Avatar Studio: original, fully local character art.
   No external images, tracking, accounts, or third-party avatar service. */
import {paintPortrait} from './avatar-cel-portrait.mjs?v=cel1';

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
    ['Face & hair',['skin','style','hair','eyes','brows','beard','expression']],
    ['Wardrobe',['shirt','hat','glasses','accessory']],
    ['Scene & pose',['background','pose']]
  ];
  const renderGroup=key=>'<fieldset class="family-avatar-field"><legend>'+AVATAR_LABELS[key]+'</legend><div class="family-avatar-picks">'+
    AVATAR_OPTIONS[key].map(([id,name,hex])=>
      '<button type="button" class="family-avatar-choice" data-avatar-feature="'+key+'" data-avatar-value="'+id+'" aria-pressed="'+(v[key]===id)+'" aria-label="'+AVATAR_LABELS[key]+': '+name+'">'+
      (hex?'<span class="family-avatar-color" style="background:'+hex+'"></span>':'')+'<span>'+name+'</span></button>'
    ).join('')+'</div></fieldset>';
  return '<section class="family-character-editor" aria-labelledby="family-character-title">'+
    '<div class="family-character-top"><div class="family-character-portrait">'+
    '<canvas id="family-avatar-canvas" width="256" height="256" role="img" aria-label="Preview of your custom character"></canvas></div>'+
    '<div class="family-character-intro"><h3 id="family-character-title">My character</h3>'+
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
