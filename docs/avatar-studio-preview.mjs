import {drawPetPortrait,paintPrizeDemo,paintThumbnail,renderLoadout} from './avatar-reward-render.mjs?v=workshop1';

// Load the local rendering engine only when a member opens a character view.
let active=null,loading=null;
export function prepareStudioRenderer(){
  loading ||= import('./avatar-dressing-room.mjs?v=workshop1').then(renderer=>active=renderer).catch(()=>null);
  return loading;
}

export function studioCharacter(canvas,recipe,view,time=0,activity=null){
  // Preview-only original layered cel comparison: no recipe, account, or reward
  // changes. Keep the existing 3D renderer as the default family experience.
  if(view?.artStyle==='cel'){
    renderLoadout(canvas,recipe,time,activity,view);
    canvas.dataset.renderer='2d';
    canvas.dataset.backend='layered-cel';
    canvas.dataset.previewStyle='cel';
    return false;
  }
  const result=active?.paintRoomAvatar(canvas,recipe,view,time,activity)||false;
  if(result){canvas.dataset.previewStyle='3d';return true;}
  renderLoadout(canvas,recipe,time,activity,view);
  canvas.dataset.renderer='2d';
  canvas.dataset.backend='layered-cel';
  canvas.dataset.previewStyle='fallback';
  return false;
}

export function studioPrize(canvas,item,progress,recipe=null){
  const activity=progress===undefined?null:{progress};
  if(recipe&&active?.paintRoomAvatar(canvas,recipe,{angle:18},0,activity&&{...activity,id:item.id,action:'play'}))return;
  if(active?.paintRoomPrize(canvas,item,activity))return;
  if(activity)paintPrizeDemo(canvas,item,progress);
  else paintThumbnail(canvas,item);
}

export function studioPet(canvas,item,action,progress=0,view={}){
  const activity=action?{action,progress}:null;
  if(active?.paintRoomPet(canvas,item,view,activity))return;
  drawPetPortrait(canvas,item,action,progress,view);
}

export function studioPortrait(recipe,size=128){
  if(!active)return '';
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const rendered=active.paintRoomAvatar(canvas,recipe,{angle:15},0,null,'portrait');
  const url=rendered?canvas.toDataURL('image/webp',.89):'';
  active.releaseStudioView(canvas);
  return url;
}
export {avatarSnapshot} from './avatar-reward-render.mjs?v=workshop1';

export function studioLook(canvas,id){
  const drawn=active?.paintRoomLook(canvas,id);
  if(drawn)active.releaseStudioView(canvas);
  return drawn;
}

export function pickStudioPart(canvas,x,y){return active?.hitStudioAvatar(canvas,x,y);}
export function releaseStudioArt(canvas){active?.releaseStudioView(canvas);}
