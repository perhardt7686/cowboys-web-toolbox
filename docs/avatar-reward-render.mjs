import {drawFamilyAvatar,normalizeAvatarRecipe} from './family-avatar-builder.mjs?v=reward1';
import {BY_ID,SLOT_LABELS} from './avatar-reward-catalog.mjs?v=reward1';

export const COSMETIC_SLOTS=Object.freeze(Object.keys(SLOT_LABELS));
const thumbnails=new WeakSet();

export function normalizeLoadout(value) {
  const cosmetics={};
  for(const slot of COSMETIC_SLOTS) {
    const id=value?.cosmetics?.[slot];
    if (typeof id==='string' && BY_ID.get(id)?.slot===slot) cosmetics[slot]=id;
  }
  return {...normalizeAvatarRecipe(value),cosmetics};
}

export function renderLoadout(canvas, value, t=0) {
  const loadout=normalizeLoadout(value),overlays={};
  for(const item of Object.values(loadout.cosmetics).map(id=>BY_ID.get(id))) {
    const target=item.slot==='effect'&&item.behind?'behind':item.slot;
    overlays[target]=item.draw;
  }
  drawFamilyAvatar(canvas, loadout, overlays, t);
}

export function paintThumbnail(canvas, item) {
  if (!canvas || !item || thumbnails.has(canvas)) return;
  const ctx=canvas.getContext('2d');
  if (!ctx) return;
  const size=canvas.width,scale=size/256,kind=item.slot;
  let scaleUp=1,x=128,y=128;
  if(kind==='hat'){scaleUp=1.2;y=53;}
  else if(kind==='eyewear'||kind==='eyes'){scaleUp=1.25;y=125;}
  else if(kind==='hair'){scaleUp=1.08;y=88;}
  else if(kind==='prop'||kind==='companion'){scaleUp=1.85;x=kind==='prop'?47:207;y=191;}
  ctx.clearRect(0,0,size,size);
  const gradient=ctx.createLinearGradient(0,0,size,size);
  gradient.addColorStop(0,'#211532');gradient.addColorStop(1,'#573064');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,size,size);
  ctx.save();ctx.translate(size/2,size/2);ctx.scale(scale*scaleUp,scale*scaleUp);ctx.translate(-x,-y);
  item.draw(ctx,0);
  ctx.restore();
  thumbnails.add(canvas);
}

export function avatarSnapshot(value, size=128) {
  if (!value || typeof value!=='object') return null;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  renderLoadout(canvas,value,0);
  return canvas.toDataURL('image/png');
}
