import {INK,PAPER,glint,oval,path,tint} from './avatar-cel-art.mjs?v=workshop1';
import {paintAura,paintReaction,petBehavior,prizeAction} from './avatar-prize-actions.mjs?v=workshop1';
import {STAGE_WIDTH as W,STAGE_HEIGHT as H,normalizeBody,fitsBody,CENTER} from './avatar-full-body.mjs?v=workshop1';
import {figureAt,paintFigure} from './avatar-turnaround-figure.mjs?v=workshop1';
import {paintHead} from './avatar-turnaround-head.mjs?v=workshop1';
import {paintTurnaroundScene} from './avatar-turnaround-scenery.mjs?v=workshop1';
import {equippedHeadwearWidth,celCompanionHomeX} from './avatar-equipment-fit.mjs';

const dye=['#a06446','#9f535d','#51777a','#785c8b','#956745','#6f845e','#435c77','#c68f4c'];
const scopeFor={hat:[128,56,193],hair:[128,85,188],eyewear:[128,123,168],eyes:[128,128,164],
  prop:[44,194,74],offhand:[44,194,74],companion:[209,193,78]};
const getDye=item=>item.color||dye[[...item.id].reduce((value,ch)=>(value*31+ch.charCodeAt(0))>>>0,7)%dye.length];

function makeClothes(recipe,items,colors){
  const base=normalizeBody(recipe);
  const outer=items.outerwear,bottom=items.bottoms,feet=items.footwear;
  const style=outer?.cut||base.outerwear;
  const layers={denim:'#597985',trench:'#a87a50',raincoat:'#77886c',cape:'#684c64'};
  const neck=base.neckwear==='none'&&['scarf','bowtie'].includes(recipe.accessory)
    ?recipe.accessory==='scarf'?'scarf':'ascot':base.neckwear;
  return {
    form:items.top?.cut||recipe.garment,
    outerwear:style,layerColor:outer?.color||layers[style]||colors.shirt,
    bottoms:bottom?.cut||base.bottoms,bottomColor:bottom?.color,
    footwear:feet?.cut||base.footwear,shoeColor:feet?.color,
    hands:items.hands?.cut||base.hands,handColor:items.hands?.color,
    waist:items.waist?.cut||base.waist,waistColor:items.waist?.color,
    back:items.back?.cut||base.back,bagColor:items.back?.color,
    neckwear:items.neckwear?.cut||neck,neckColor:items.neckwear?.color
  };
}

function facingDetail(c,item,depth,front,alpha) {
  const color=getDye(item),shadow=tint(color,INK,.45),light=tint(color,PAPER,.3);
  c.save();c.globalAlpha*=alpha;
  if (item.slot==='eyewear'){
    const shift=depth*19;
    path(c,[shift-28,4],[[shift-11,-3,shift+10,-6],[shift+28,-5]],null,shadow,4.1);
    path(c,[shift-25,3],[[shift-5,-5,shift+6,-5]],null,light,1.35);
    if(front>-.49)oval(c,shift+17,-3,8,9,shadow+'a0',INK,1.7,-.27);
  }else if(item.slot==='hat'){
    const marks=item.id.includes('helmet')||item.id.includes('cap');
    if(marks)path(c,[-43,0],[[-46,-24,-33,-39,-2,-41],[34,-44,52,-15,46,0],[21,17,-19,13,-43,0]],color,INK,2.35);
    else path(c,[-56,0],[[-46,-5,-39,-1],[-34,-18,-29,-37,-22,-37],[0,-32,18,-34,25,-37],
      [36,-34,37,-12,40,-2],[49,-2,57,-7,57,0],[43,14,-36,15,-56,0]],color,INK,2.35);
    path(c,[-36,-3],[[2,8,42,-3]],null,shadow,5.4);
    if(item.tier==='legendary'||item.tier==='gold')glint(c,depth*25,-19,4.6,light);
    path(c,[-13,-27],[[4,-27,15,-22,19,-9]],null,light,1.6);
  }else if(item.slot==='hair'){
    path(c,[-39,8],[[-43,-24,-22,-35,1,-32],[27,-34,50,-22,46,11],[42,25,39,40,29,46],
      [11,37,-23,48,-37,42],[-36,30,-44,18,-39,8]],color,INK,2.5);
    path(c,[-29,-18],[[-24,11,-7,27,-20,38]],null,light,2.3);
    path(c,[-9,-24],[[12,-1,13,26,21,37]],null,shadow,2.8);
    path(c,[11,-26],[[32,-11,23,13,32,26]],null,light,1.7);
  }
  c.restore();
}

function frontalStamp(c,item,x,y,size,front,seconds,activity,depth,face){
  const [ax,ay,source]=scopeFor[item.slot];
  const scale=size/source;
  const u=Math.max(0,Math.min(1,(front+.49)/.93));
  c.save();
  c.translate(x,y);
  // Keep the earned object's original art, but follow the saved head geometry
  // through front/profile/rear turns instead of a one-size-fits-all stamp.
  c.scale(equippedHeadwearWidth(face,item.slot),1);
  if(item.slot!=='eyes'&&u<1)facingDetail(c,item,depth,front,1-u);
  if(u>0){
    c.globalAlpha*=u;
    c.translate(depth*10,0);
    c.scale(scale*(.68+Math.abs(front)*.32),scale);
    c.translate(-ax,-ay);
    item.draw(c,seconds);
    if(activity)paintReaction(c,item,prizeAction(item),activity.progress);
  }
  c.restore();
}

function equipInHand(c,item,limb,frame,handTone,seconds,activity){
  const {view}=frame,{hand:h}=limb;
  const [ax,ay,source]=scopeFor[item.slot]||scopeFor.prop;
  const motion=activity?Math.sin(Math.PI*2*activity.progress):0;
  c.save();
  c.translate(h.x,h.y+3);
  if(item.stageDraw){
    item.stageDraw(c,{angle:view,progress:activity?.progress,time:seconds});
  }else{
    c.rotate(-view.depth*.29+motion*.14);
    c.scale((.7+Math.abs(view.across)*.3)*1.15,1.15);
    c.translate(-ax,-ay);
    item.draw(c,seconds);
    if(activity)paintReaction(c,item,prizeAction(item),activity.progress);
  }
  c.restore();
  // Thumb and fingers sit over both the palm of the hand and the prop's grip.
  oval(c,h.x+3,h.y+2,4.9,4,tint(handTone,INK,view.across<0?.32:.12),INK,1.25,-.33);
}

function paintPet(c,item,frame,seconds,activity) {
  const q=activity?.progress??0;
  const radius=item.art==='gargoyle'?57:item.art==='moth'?50:45;
  const x=celCompanionHomeX({
    chest:frame.chest,petHalfWidth:radius,turnOffset:frame.view.at(7,9)
  });
  const y=477;
  c.save();c.translate(x,y);
  if(item.creature){
    item.creature(c,{angle:frame.view,progress:activity?.progress,action:activity?.action,time:seconds});
  }else{
    const [ax,ay]=scopeFor.companion;
    c.scale(1.06,1.06);c.translate(-ax,-ay);
    item.draw(c,seconds);
    if(activity)paintReaction(c,item,petBehavior(item,activity.action||'play'),q);
  }
  c.restore();
}

function framed(c,canvas,frame,camera){
  const base= Math.min(canvas.width/W,canvas.height/H);
  const viewSize=camera.crop;
  const zoom=viewSize?Math.min(canvas.width,canvas.height)/viewSize.size:base*Math.max(1,camera.zoom||1);
  const x=viewSize?(viewSize.x??frame.head.x):W/2;
  const y=viewSize?(viewSize.y??frame.head.y+41*frame.design.scale):H/2;
  c.translate(canvas.width*.5,canvas.height*.5);
  c.scale(zoom,zoom);
  c.translate(-x+(camera.x||0),-y+(camera.y||0));
}

export function drawTurnaround(canvas,recipe,colors,lookup,camera={},seconds=0,activity=null) {
  const c=canvas.getContext('2d');
  if(!c)return;
  const items={};
  for(const [slot,id] of Object.entries(recipe.cosmetics||{})){
    const item=lookup(id);
    if(item&&fitsBody(recipe,item))items[slot]=item;
  }
  const pigment={...colors,shirt:items.top?.color||items.bodypart?.color||colors.shirt};
  const clothes=makeClothes(recipe,items,pigment);
  if(items.outerwear?.id==='phantom-cloak'&&activity?.id===items.outerwear.id)
    clothes.flutter=activity.progress*Math.PI*2;
  const holding=Object.fromEntries([[-1,items.prop],[1,items.offhand]].filter(([,item])=>item));
  const frame=figureAt(recipe,camera.angle||0,Object.keys(holding).map(Number));
  const activityFor=item=>item?.id===activity?.id?activity:null;
  c.save();
  c.clearRect(0,0,canvas.width,canvas.height);
  c.fillStyle='#1d2232';c.fillRect(0,0,canvas.width,canvas.height);
  framed(c,canvas,frame,camera);
  paintTurnaroundScene(c,recipe,items.background,seconds);
  if(items.effect?.behind){
    c.save();c.translate(16,59);c.scale(400/256,430/256);items.effect.draw(c,seconds);c.restore();
  }
  if(activity&&items.offhand?.id==='museum-lantern'&&activity.id===items.offhand.id){
    c.save();c.translate(0,500);c.scale(1,.29);c.translate(0,-500);
    paintAura(c,CENTER+66,500,161,'#ffd583',.94);c.restore();
  }
  paintFigure(c,frame,recipe,pigment,clothes,limb=>{
    const item=holding[limb.side];
    if(item){
      const handTone=clothes.hands!=='none'?(clothes.handColor||tint(pigment.shirt,INK,.42)):
        frame.design.family==='robot'||frame.model==='armor'?tint(pigment.skin,'#7f899d',.71):
        frame.model==='specter'?tint(pigment.skin,'#79a285',.71):pigment.skin;
      equipInHand(c,item,limb,frame,handTone,seconds,activityFor(item));
    }
  });
  paintHead(c,frame,recipe,pigment,(slot,ctx,x,y,w,front)=>{
    const item=items[slot];
    if(!item)return false;
    frontalStamp(ctx,item,x,y,w,front,seconds,activityFor(item),frame.view.depth,recipe.face);
    return true;
  });
  if(items.bodypart){
    const point=frame.view.at(-frame.chest*.57,25);
    oval(c,CENTER+point,frame.shoulder+38,8,8,getDye(items.bodypart),INK,1.9);
    glint(c,CENTER+point,frame.shoulder+38,4.4,PAPER);
  }
  if(items.companion)paintPet(c,items.companion,frame,seconds,activityFor(items.companion));
  const curtain=items.effect;
  if(curtain){
    const action=activityFor(curtain),phase=action?.progress||0;
    c.save();c.translate(18,45);c.scale(396/256,453/256);
    if(!curtain.behind)curtain.draw(c,seconds);
    if(action)paintReaction(c,curtain,prizeAction(curtain),phase);
    c.restore();
  }
  const flare=activity&&Object.values(items).find(item=>item.id===activity.id);
  if(flare&&flare.slot==='background')paintAura(c,CENTER,369,180,prizeAction(flare).accent,.5);
  else if(flare&&!['prop','offhand','hat','hair','eyes','eyewear','effect','companion'].includes(flare.slot)){
    paintAura(c,CENTER,frame.shoulder+118,112,prizeAction(flare).accent,.64);
    for(const [px,py,r] of [[174,262,7],[258,352,5],[207,397,6]])glint(c,px,py,r,PAPER);
  }
  c.restore();
}
