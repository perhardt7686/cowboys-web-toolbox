import {drawPetPortrait,paintPrizeDemo,paintThumbnail,renderLoadout} from './avatar-reward-render.mjs?v=studio2';

// Load the local rendering engine only when a member opens a character view.
let active=null,loading=null;
export function prepareStudioRenderer(){
  loading ||= import('./avatar-dressing-room.mjs?v=studio2').then(renderer=>active=renderer).catch(()=>null);
  return loading;
}

export function studioCharacter(canvas,recipe,view,time=0,activity=null){
  if(active?.paintRoomAvatar(canvas,recipe,view,time,activity))return true;
  renderLoadout(canvas,recipe,time,activity,view);
  return false;
}

export function studioPrize(canvas,item,progress){
  const activity=progress===undefined?null:{progress};
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

export function studioLook(canvas,id){
  const drawn=active?.paintRoomLook(canvas,id);
  if(drawn)active.releaseStudioView(canvas);
  return drawn;
}

export function pickStudioPart(canvas,x,y){return active?.hitStudioAvatar(canvas,x,y);}
export function releaseStudioArt(canvas){active?.releaseStudioView(canvas);}
