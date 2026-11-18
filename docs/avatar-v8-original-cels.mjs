/* New original V8 mystery-cartoon character cels, designed for the live studio.
   Deterministic and side-effect-free. No copied TV, generator template, or member data.
   First art family: human, monster, and machine; existing legacy gear is deliberately
   routed to the proven renderer until matching new full-angle equipment cels ship. */
import {BODY_MODELS,normalizeBody,wrapAngle} from './avatar-full-body.mjs?v=workshop1';

const SKINS={porcelain:'#f5d2bb',bisque:'#eac3a4',sand:'#dbad86',tan:'#ce966a',amber:'#bf8154',copper:'#895138',deep:'#603722',espresso:'#402824'};
const HAIRS={brown:'#513020',black:'#221d29',blonde:'#e6b05a',auburn:'#953e27',silver:'#b6bbc9',purple:'#773d9b',chestnut:'#733e26',red:'#bd582c',grey:'#68636f',pale:'#f4e2bc',teal:'#147f83',coral:'#ca6f65',lime:'#90ad45'};
const SHIRTS={violet:'#673687',teal:'#087d81',rose:'#b74b79',gold:'#cd9a42',navy:'#3c4b81',forest:'#30765a',cream:'#ece0c6',rust:'#a34439',sky:'#5896b9',plum:'#622846',olive:'#62663d',black:'#292831',burntorange:'#cf6738',turquoise:'#2f8c95',maroon:'#822f4e',lime:'#a4ad4d'};
const INK='#292333';
const round=(n)=>Math.round(n*100)/100;
function path(c,d,fill,stroke=INK,w=4){
  const p=new Path2D(d);
  if(fill){c.fillStyle=fill;c.fill(p);}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke(p);}
}
function ellipse(c,x,y,rx,ry,fill,stroke=INK,w=4){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
}
function line(c,x1,y1,x2,y2,color=INK,w=4){
  c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.lineCap='round';c.lineWidth=w;c.strokeStyle=color;c.stroke();
}
function backdrop(c){
  const g=c.createLinearGradient(0,0,490,440);
  g.addColorStop(0,'#b6d0d7');g.addColorStop(.55,'#d8bca7');g.addColorStop(1,'#b78b83');
  c.fillStyle=g;c.fillRect(0,0,480,520);
  ellipse(c,375,81,48,48,'#f7dfb0',null);
  // Inked twilight pines and workshop porch. Architectural forms keep depth.
  path(c,'M0 304 L30 220 46 248 74 171 109 258 136 215 166 310 Z','#46696b','#425161',3);
  path(c,'M337 310 L374 186 397 251 425 142 459 249 480 196 480 331 Z','#41656b','#425161',3);
  path(c,'M-20 335 L69 314 141 327 215 309 297 327 373 306 500 324 L500 520 -20 520 Z','#b68d6c','#665561',4);
  for(let i=0;i<7;i++)line(c,-20+i*91,407,48+i*91,405,'#e4be95',2);
  path(c,'M0 369 L480 356',null,'#6d5462',4);
  path(c,'M0 469 Q231 436 480 467 L480 520 0 520 Z','#866d6a',null);
  ellipse(c,240,445,142,18,'#3d323e55',null);
}
function outfit(c,shirt,kit,body,back){
  const heavy=['mechanic','marsh','armor'].includes(body);
  const shoulder=heavy?74:body==='sleuth'?47:61;
  const x1=240-shoulder,x2=240+shoulder;
  const lower=(kit.bottoms==='dress'||kit.bottoms==='pleats');
  const topEnd=lower?348:341;
  // Legs are wide and dimensional, with cuff/boot silhouettes.
  if(!lower){
    path(c,'M194 328 L236 326 230 433 180 434 L182 390 Z','#344e69');
    path(c,'M244 326 L290 326 303 434 251 434 Z','#39576e');
    line(c,244,341,244,398,'#8aa0a2',3);
  }else path(c,'M199 324 L281 324 318 410 Q243 433 158 410 Z','#436f78');
  const boot=kit.footwear==='boots'||kit.footwear==='highboots';
  path(c,'M177 410 L227 413 232 442 161 443 Q165 423 177 410 Z',boot?'#6f4d45':'#f1ebd9');
  path(c,'M249 412 L300 409 319 440 247 443 Z',boot?'#6f4d45':'#f1ebd9');
  if(!back){
    path(c,'M196 425 L225 425',null,'#e1cab3',3);path(c,'M263 426 L301 423',null,'#e1cab3',3);
  }
  // Sleeves and actor hands. Big readable silhouette with clearly separated arms.
  path(c,'M'+x1+' 210 Q'+(x1-18)+' 215 '+(x1-34)+' 293 L'+(x1-14)+' 303 215 244 Z',shirt);
  path(c,'M'+x2+' 210 Q'+(x2+24)+' 216 '+(x2+34)+' 289 L'+(x2+12)+' 304 265 246 Z',shirt);
  ellipse(c,x1-19,307,16,19,body==='automaton'||body==='radio'||body==='scout'?'#c2b29d':'#d49d7a');
  ellipse(c,x2+19,306,16,19,body==='automaton'||body==='radio'||body==='scout'?'#c2b29d':'#d49d7a');
  const jacket=kit.outerwear==='trench'||kit.outerwear==='raincoat'||kit.outerwear==='denim';
  const cloth=jacket?(kit.outerwear==='trench'?'#ba9870':kit.outerwear==='denim'?'#66849b':'#598579'):shirt;
  path(c,'M'+x1+' 212 Q239 188 '+x2+' 212 L293 '+topEnd+' Q238 '+(topEnd+10)+' 187 '+topEnd+' Z',cloth);
  if(kit.outerwear==='cape'){
    path(c,'M'+x1+' 207 Q238 183 '+x2+' 207 L339 356 Q250 394 143 357 Z','#776b97');
    path(c,'M196 210 Q240 232 284 210',null,'#c2ae9b',5);
  }
  if(jacket){
    path(c,'M219 225 L231 238 218 330 194 334',null,'#3a535a',3);
    path(c,'M259 224 L246 239 264 331 288 333',null,'#3a535a',3);
    for(let y=257;y<310;y+=22)ellipse(c,250,y,3,3,'#e8d4ab',null);
  }else{
    path(c,'M222 218 Q240 240 258 218',null,'#e7ccb0',4);
    if(kit.neckwear==='ascot'||kit.neckwear==='scarf'){
      path(c,'M220 224 L243 252 262 223 Q243 234 220 224 Z',kit.neckwear==='ascot'?'#e7b974':'#c66c61');
    }
    line(c,242,257,242,333,'#214251',2.5);
  }
  if(kit.waist==='utility'||kit.waist==='leather'){
    path(c,'M187 326 Q240 336 294 326',null,'#634945',10);
    ellipse(c,239,330,8,7,'#d8b36a');
  }
}
function humanHead(c,recipe,back,profile){
  const skin=SKINS[recipe.skin]||SKINS.sand;
  const hair=HAIRS[recipe.hair]||HAIRS.brown;
  const chin=recipe.face==='square'?13:recipe.face==='long'?20:12;
  ellipse(c,240,186,20,25,skin);
  const face=profile?
    'M202 106 Q235 78 271 107 L286 148 Q307 160 294 174 L281 181 Q278 214 247 229 Q210 228 201 193 Z':
    'M185 104 Q218 71 263 89 Q302 105 298 164 Q300 205 271 224 Q240 '+(240+chin*.2)+' 210 219 Q179 203 182 164 Z';
  path(c,face,skin);
  if(back){
    path(c,'M182 105 Q206 71 268 85 Q302 98 304 169 L292 207 Q246 229 191 207 L179 171 Z',hair);
    path(c,'M193 195 Q245 211 289 191',null,'#44303d',3);
    return;
  }
  // Individually drawn coiffures, not a recolored generic cap.
  const style=recipe.style||'wavy';
  if(style==='bald'){
    path(c,'M186 117 Q240 89 293 120',null,'#946346',2);
  }else if(['long','shag','feathered','bob'].includes(style)){
    path(c,'M181 161 Q163 100 203 75 Q261 43 300 100 L307 221 292 231 282 165 Q264 120 230 130 Q200 147 181 161 Z',hair);
    path(c,'M188 165 Q175 201 186 235',null,'#392c3d',4);
  }else if(['afro','coils','curly'].includes(style)){
    for(const [x,y,r] of [[198,105,28],[230,81,34],[270,92,29],[294,124,23],[178,135,20]]){
      ellipse(c,x,y,r,r*.92,hair);
    }
  }else{
    path(c,'M177 152 Q159 96 209 75 Q256 50 283 78 Q310 93 307 144 Q280 118 259 127 Q238 111 225 137 Q207 118 177 152 Z',hair);
    path(c,'M208 100 Q229 75 264 87',null,'#9c765c',3);
    if(['wavy','pompadour','flip'].includes(style))path(c,'M264 94 Q289 67 306 77 Q316 97 293 119',hair);
  }
  if(profile){
    path(c,'M258 149 Q274 142 281 151',null,INK,4);
    ellipse(c,273,156,4,7,'#f5ebde');
    ellipse(c,273,156,2,4,INK,null);
    path(c,'M289 173 L302 184 284 192',skin);
  }else{
    const spacing=Number(recipe.eye_spacing||0)*2;
    const shape=recipe.eye_shape||'classic';
    const width=shape==='dramatic'?13:shape==='round'?12:shape==='almond'?12:10;
    const height=shape==='dramatic'?17:shape==='sleepy'?7:shape==='round'?14:12;
    for(const x of [217-spacing,263+spacing]){
      path(c,'M'+(x-14)+' 148 Q'+x+' '+(shape==='dramatic'?'131':'139')+' '+(x+13)+' 148',null,INK,3.4);
      ellipse(c,x,160,width,height,'#faf2df',INK,3);
      ellipse(c,x+1,162,4,6,recipe.eyes==='blue'?'#3c738e':'#442d36',null);
      ellipse(c,x+2,159,1.5,2.2,'#fff',null);
    }
    path(c,'M240 167 L232 186 Q243 192 248 186',null,'#875943',3);
  }
  const expr=recipe.expression||'smile';
  if(expr==='calm'||expr==='determined')line(c,228,207,253,207,INK,3);
  else if(expr==='laugh'||expr==='grin'){
    path(c,'M222 203 Q242 226 263 204 Q246 236 222 203 Z','#4f2c3b');
    path(c,'M226 207 Q244 214 257 207',null,'#f8ecdd',3);
  }else if(expr==='curious'||expr==='wink'){
    path(c,'M227 206 Q241 213 254 206',null,INK,3);
  }else path(c,'M223 204 Q241 221 260 204',null,INK,3.5);
  if(recipe.beard&&recipe.beard!=='none'){
    path(c,'M196 185 Q210 225 239 233 Q271 222 284 190 Q262 246 240 241 Q209 239 196 185 Z',
      recipe.beard==='stubble'?'#856555':hair,INK,2);
  }
  if(recipe.glasses&&recipe.glasses!=='none'){
    for(const x of [216,264])ellipse(c,x,160,19,16,'#d9c6b533','#3a2e3f',3.5);
    path(c,'M233 158 Q243 152 247 160',null,'#392b37',3);
  }
  ellipse(c,184,173,13,19,skin);
  ellipse(c,300,172,11,18,skin);
}
function robotHead(c,recipe,back,profile,model){
  const narrow=model==='automaton',wide=model==='radio';
  const x1=wide?169:narrow?189:184,x2=wide?309:narrow?291:297;
  path(c,'M'+(x1+8)+' 104 Q240 72 '+(x2-8)+' 105 L'+x2+' 203 Q240 240 '+x1+' 202 Z','#a2b3b3');
  path(c,'M'+(x1+13)+' 126 L'+(x2-13)+' 126 L'+(x2-13)+' 186 L'+(x1+13)+' 186 Z','#385d69');
  if(!back){
    for(const x of [212,267]){
      path(c,'M'+(x-14)+' 151 Q'+x+' 138 '+(x+14)+' 151',null,'#f6d7a1',3);
      ellipse(c,x,163,8,10,'#f6d7a1',null);
      ellipse(c,x,164,3,5,'#234555',null);
    }
    path(c,'M220 196 L263 196',null,'#e7d1aa',5);
  }
  ellipse(c,x1,157,12,16,'#b98c68');
  ellipse(c,x2,156,12,16,'#b98c68');
  path(c,'M223 105 L224 72 L255 72 L256 105','#7b777e');
  ellipse(c,239,65,12,11,'#e2c184');
  if(profile)path(c,'M'+(x2-15)+' 153 L'+(x2+12)+' 160 L'+(x2-15)+' 177 Z','#dbc1a0');
  path(c,'M202 216 L278 216 283 237 198 237 Z','#d7c7a3');
}
function monsterHead(c,recipe,back,profile,model){
  const green=model==='marsh'?'#819d7d':model==='armor'?'#adb3aa':'#b6b0a2';
  path(c,'M192 102 Q223 75 273 96 Q303 118 288 181 Q271 235 244 231 Q196 232 190 180 Z',green);
  path(c,'M193 118 Q168 87 171 62 Q198 69 211 101 Z','#879b8e');
  path(c,'M269 101 Q288 64 314 62 Q309 93 288 123 Z','#879b8e');
  if(!back){
    for(const x of [218,265]){
      ellipse(c,x,162,15,18,'#f9ebce');
      ellipse(c,x+1,163,5,8,'#3e5d5b',null);
      path(c,'M'+(x-15)+' 139 Q'+x+' 131 '+(x+15)+' 142',null,INK,4);
    }
    path(c,'M220 203 Q246 216 269 202',null,INK,4);
    ellipse(c,242,192,9,6,'#5f6a60');
  }
  for(const x of [211,231,252,276])line(c,x,99,x+7,90,'#c5b6a2',2);
  if(profile)path(c,'M283 175 L311 182 285 195 Z',green);
}
export function paintV8Character(canvas,recipe,view={},time=0){
  if(!canvas?.getContext)return false;
  const kit=normalizeBody(recipe),model=BODY_MODELS[kit.model];
  if(!model)return false;
  // Return control to established renderer for equipped achievement rewards
  // until the new multi-angle gear pack reaches item/slot coverage parity.
  if(Object.values(recipe?.cosmetics||{}).some(Boolean))return false;
  const c=canvas.getContext('2d');if(!c)return false;
  const w=canvas.width,h=canvas.height;
  c.save();c.setTransform(w/480,0,0,h/520,0,0);
  backdrop(c);
  const angle=wrapAngle(Number(view?.angle)||0);
  const back=angle>=135&&angle<=225;
  const profile=(angle>43&&angle<137)||(angle>223&&angle<317);
  const shirt=SHIRTS[recipe.shirt]||SHIRTS.violet;
  const zoom=Math.max(1,Math.min(2.45,Number(view?.zoom)||1));
  const panX=Number(view?.x)||0,panY=Number(view?.y)||0;
  c.save();
  c.translate(240+panX*.6,265+panY*1.05);
  c.scale(zoom,zoom);
  c.transform(1,0,Math.sin(angle*Math.PI/180)*.065,1,0,0);
  c.translate(-240,-265);
  const family=model.family;
  // The first three body families have distinct silhouettes, not scaled copies.
  if(family==='human')outfit(c,shirt,kit,kit.model,back);
  else if(family==='robot'){
    outfit(c,kit.model==='radio'?'#8b565d':'#a67a66',kit,kit.model,back);
    path(c,'M206 238 L273 238 L275 304 207 304 Z','#e1c395');
    path(c,'M217 249 L263 249 263 282 216 282 Z','#3d6a72');
    ellipse(c,224,291,6,6,'#cc8771');ellipse(c,259,291,6,6,'#80b8a4');
  }else{
    outfit(c,kit.model==='specter'?'#577168':shirt,kit,kit.model,back);
    path(c,'M201 232 Q242 253 279 231',null,'#c4d1b8',3);
  }
  if(family==='robot')robotHead(c,recipe,back,profile,kit.model);
  else if(family==='monster')monsterHead(c,recipe,back,profile,kit.model);
  else humanHead(c,recipe,back,profile);
  c.restore();
  // Diegetic actor label, not a pretend saved state.
  c.fillStyle='#f9edda';c.font='800 14px system-ui';
  c.fillText('THE AFTER-HOURS MYSTERY CREW',18,31);
  c.font='600 12px system-ui';c.fillText('Original V8 character art',18,51);
  c.restore();
  canvas.dataset.renderer='2d';canvas.dataset.backend='v8-original-cel';canvas.dataset.previewStyle='v8';
  return true;
}
