// Original EGA art for the garage's inset mechanical panels. All coordinates
// are shared with the matching keyboard- and touch-accessible controls.
import {BOLTS,PARTS,SLOT_NAMES,fullBolts,isWheel} from './hot-rod-catalog.mjs';

export const BAY_MENU = Object.freeze({
  tune:[100,152,61,25],parts:[166,152,74,25],done:[245,152,62,25],
  back:[100,152,61,25],change:[166,152,74,25],up:[276,50,24,27],down:[276,110,24,27]
});
export const IGNITION = [208,128,54,19];
const locations = {
  carb:[[149,53],[174,53],[220,53],[245,53]],
  manifold:[[134,73],[159,74],[189,73],[215,75],[245,74],[274,73]],
  engine:[[124,104],[148,102],[183,102],[219,102],[255,102],[284,106]],
  gearbox:[[128,91],[148,74],[171,79],[133,117],[156,126],[181,113]],
  wheel:[[196,67],[222,86],[212,116],[181,116],[170,86]]
};
export function workbenchFasteners(slot) {
  return (locations[isWheel(slot)?'wheel':slot]||[]).map(([x,y])=>({x,y}));
}

function bevel(s,x,y,w,h,fill=7) {
  s.frame(x,y,w,h,8,15,0);
  s.frame(x+2,y+2,w-4,h-4,fill,7,0);
}
function key(s,bounds,text,enabled=true) {
  const [x,y,w,h]=bounds;
  bevel(s,x,y,w,h);
  s.frame(x+5,y+5,w-10,h-10,enabled?4:8,0,15);
  s.box(x+7,y+7,w-14,1,enabled?12:7);
  s.center(text,x+Math.round(w/2),y+9,enabled?15:7);
}
function edge(s,upper,lower) {
  s.poly(lower,8);
  s.poly(upper,7);
  for(let i=1;i<upper.length;i++)s.line(...upper[i-1],...upper[i],15);
}
function recess(s,x,y,kind=0) {
  s.ellipse(x,y,5,4,8);
  s.ellipse(x,y,3,2,0);
  s.line(x-3,y+2,x+3,y+2,7);
  if (kind) s.box(x-1,y,3,1,kind);
}
function pulley(s,x,y,rx,ry) {
  s.ellipse(x,y,rx,ry,0);
  s.ellipse(x,y,rx-2,ry-2,7);
  s.ellipse(x,y,rx-4,ry-4,8);
  s.ellipse(x,y,rx-5,ry-5,0);
  s.line(x-1,y-ry+2,x-1,y+ry-3,15);
  s.ellipse(x,y,3,3,7);
}
function cylinderBlock(s,part) {
  const isSix=part?.format==='six', length=isSix?118:137;
  edge(s,[[120,91],[137,77],[263,77],[286,90],[283,111],[125,112]],
    [[114,89],[137,76],[269,78],[300,103],[287,122],[259,128],[143,125],[113,115]]);
  bevel(s,130,87,length+22,27);
  s.box(136,93,length+10,13,15);
  s.box(138,95,length+6,9,7);
  for(let x=143;x<145+length;x+=4)s.line(x,96,x+5,103,8);
  s.line(145,118,267,118,7);
  s.line(160,123,254,123,0);
  for(const x of isSix?[151,179,207,235]:[148,183,219,255])recess(s,x,102);
  // Water pump, front pulley, starter, and exhaust collector.
  pulley(s,119,105,12,19);
  s.frame(104,103,13,5,7,15,0);
  s.frame(128,115,29,9,8,7,0);
  s.line(133,115,153,115,15);s.line(144,116,144,123,15);
  s.frame(257,117,17,9,8,7,0);
  for(const x of [276,281,286]){
    s.line(x,83,x+3,88,15);s.line(x+3,88,x+3,96,8);
  }
  for(const [x,y,count] of [[141,128,39],[241,128,15],[259,121,18]]){
    s.noise(x,y,26,4,count,[7,8,0],211+x);
  }
  s.line(270,117,278,117,15);
  s.frame(274,116,5,6,7,15,0);
}
function inlet(s,part) {
  edge(s,[[130,72],[149,60],[252,60],[277,72],[271,81],[134,81]],
    [[124,74],[145,63],[263,65],[288,77],[280,85],[131,85]]);
  const stacks=part?.flange==='4b'?[164,198,232]:[171,218];
  for(const x of stacks){
    s.poly([[x-16,75],[x-6,63],[x+7,63],[x+18,75],[x+11,80],[x-11,80]],8);
    s.line(x-15,74,x-5,64,15);
    s.box(x-7,65,15,3,0);
  }
  s.line(137,78,271,78,15);
}
function intake(s,part) {
  const chambers=[161,232];
  for(const x of chambers){
    edge(s,[[x-19,42],[x-14,38],[x+14,38],[x+20,42],[x+13,47],[x-14,47]],
      [[x-20,42],[x+20,42],[x+18,56],[x+24,61],[x+16,65],[x-17,65],[x-23,59],[x-16,54]]);
    s.frame(x-14,42,28,7,8,15,0);
    s.box(x-13,43,26,2,0);
    if(part?.flange==='4b')s.box(x-1,43,2,3,15);
    s.box(x-10,50,21,4,7);
    for(const dx of [-8,-3,2,7])s.box(x+dx,50,1,5,15);
    s.frame(x-21,57,43,7,7,15,8);
  }
  s.line(178,60,216,60,7);
  s.line(198,59,198,64,6);
}
function gearbox(s) {
  edge(s,[[123,85],[143,70],[185,70],[211,85],[250,92],[259,103],[288,107],[271,115],[226,115],[181,124],[149,128],[122,116]],
    [[121,85],[142,67],[188,69],[221,91],[263,98],[295,110],[282,119],[231,118],[183,129],[146,132],[116,117]]);
  pulley(s,122,102,13,20);
  for(const x of [145,157,169,181,193]){
    s.line(x,72,x+15,89,15);s.line(x+15,89,x+1,119,8);
  }
  s.box(228,97,25,3,15);s.box(252,107,28,2,7);
}
function wheel(s) {
  const x=196,y=94;
  s.ellipse(x,y,49,44,8);s.ellipse(x,y,47,42,0);
  s.ellipse(x,y,43,38,8);s.ellipse(x,y,38,34,0);
  s.ellipse(x,y,34,30,15);s.ellipse(x,y,31,27,7);
  s.ellipse(x,y,25,23,8);s.ellipse(x,y,15,14,7);
  s.ellipse(x,y,10,9,0);s.ellipse(x,y,6,5,15);
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12;
    s.line(x+46*Math.cos(a),y+40*Math.sin(a),x+44*Math.cos(a+.09),y+38*Math.sin(a+.09),7);
  }
}
function ignition(s,connected,highlight) {
  const line=highlight?12:4;
  const tip=connected?[252,114]:[229,137];
  s.line(215,125,227,132,line);s.line(227,132,243,133,line);
  s.line(243,133,251,127,line);s.line(251,127,...tip,line);
  s.box(tip[0]-2,tip[1]-1,6,3,connected?14:10);
  s.box(214,124,6,3,8);s.box(213,124,3,2,15);
}
function wrench(s,x,y) {
  s.line(x-2,y+4,x+8,y+12,4);s.line(x-1,y+4,x+9,y+12,12);
  s.box(x+8,y+11,3,3,12);
  s.poly([[x-4,y-3],[x-2,y-1],[x-2,y+1],[x+1,y+2],[x+2,y],[x+5,y+2],[x+3,y+6],[x-2,y+6],[x-5,y+3]],12);
}
function fastener(s,x,y,tight,stage,highlight) {
  if(!tight&&!stage){recess(s,x,y,highlight?6:0);return;}
  const top=y-(tight&&!stage?2:stage===1?5:3);
  s.ellipse(x,y+2,5,3,0);
  s.box(x-2,top,5,y-top+3,8);s.box(x-1,top,1,y-top+2,7);
  s.poly([[x-4,top],[x-2,top-2],[x+2,top-2],[x+4,top],[x+2,top+2],[x-2,top+2]],stage?14:15);
  s.line(x-2,top,x+2,top,stage?6:8);
  if(!stage)s.box(x-1,top-2,3,1,4);
  if(stage&&highlight)wrench(s,x+3,y+2);
}
function paintTiming(s,view) {
  const marker=Math.round(109-(view.timing??0)*3.1);
  const neutral=Math.round(109-(view.timingReference??8)*3.1);
  edge(s,[[115,76],[122,57],[143,51],[168,57],[185,76],[190,105],[171,126],[137,128],[118,115]],
    [[111,76],[123,54],[160,50],[179,60],[191,79],[193,108],[172,130],[135,132],[115,119]]);
  pulley(s,148,87,23,26);pulley(s,156,117,14,12);
  s.line(126,87,145,119,8);s.line(169,81,171,112,7);
  s.frame(210,47,38,81,8,15,0);
  s.box(214,51,30,72,0);
  for(let i=0;i<17;i++){
    const y=Math.round(109-i*3.1);
    s.box(i%4===0?217:223,y,i%4===0?17:11,1,i%4===0?15:7);
  }
  s.box(217,neutral,20,2,12);
  s.poly([[229,marker],[245,marker-4],[245,marker+4]],14);
  s.center(String(view.timing??0)+' DEG',230,133,15);
  key(s,BAY_MENU.up,'-',view.timing>0);
  key(s,BAY_MENU.down,'+',view.timing<16);
}
function paintShelf(s,view) {
  const parts=view.shelfParts||[];
  s.center('SPARE PARTS',199,41,14);
  if(!parts.length){s.center('NO PARTS FIT THIS POSITION',199,84,7);return;}
  parts.slice(0,4).forEach((part,index)=>{
    const y=57+index*18;
    s.frame(103,y,199,16,index===view.shelfIndex?7:8,15,0);
    s.text(part.label.slice(0,25),109,y+4,index===view.shelfIndex?0:15);
  });
}
export const SHELF_LIST = [0,1,2,3].map(i=>[103,57+i*18,199,16]);

export function paintWorkbench(s,view) {
  const {car,slot='carb',bayMode='work',locked=false,turns={},focusBolt}=view;
  const installed=car?.installed||{};
  bevel(s,91,9,224,176);
  s.frame(96,14,214,134,0,8,15);
  s.box(98,16,210,120,0);
  s.center(bayMode==='tune'?'TIMING BELT':bayMode==='shelf'?'PARTS SHELF':SLOT_NAMES[slot],202,23,15);
  if(bayMode==='tune')paintTiming(s,view);
  else if(bayMode==='shelf')paintShelf(s,view);
  else {
    if(isWheel(slot)){
      if(installed[slot])wheel(s);
      else {s.ellipse(196,94,26,25,8);s.ellipse(196,94,20,19,0);}
    }else if(slot==='gearbox'){
      if(installed.gearbox)gearbox(s);
      else {s.center('GEARBOX REMOVED',200,93,7);s.box(128,114,133,2,8);}
    }else {
      if(installed.engine)cylinderBlock(s,PARTS[installed.engine.id]);
      else {s.frame(120,106,166,22,8,7,0);s.center('ENGINE MOUNTS',204,113,7);}
      if(installed.manifold)inlet(s,PARTS[installed.manifold.id]);
      if(installed.carb)intake(s,PARTS[installed.carb.id]);
      ignition(s,car?.ignition,slot==='engine');
    }
    if(installed[slot]&&!locked&&!view.readOnly){
      const mask=car.bolts[slot]??fullBolts(slot);
      workbenchFasteners(slot).slice(0,BOLTS[slot]).forEach(({x,y},index)=>
        fastener(s,x,y,Boolean(mask&(1<<index)),turns[index]||0,focusBolt===index));
    }
  }
  if(bayMode==='work'){
    if(!view.readOnly){key(s,BAY_MENU.tune,'TUNE',view.tuneAvailable);key(s,BAY_MENU.parts,'PARTS');}
    key(s,BAY_MENU.done,'DONE');
  }else{
    key(s,BAY_MENU.back,'BACK');
    if(bayMode==='shelf')key(s,BAY_MENU.change,'CHANGE',Boolean(view.shelfParts?.length));
    key(s,BAY_MENU.done,'DONE');
  }
  s.box(0,186,320,14,0);s.box(0,186,320,1,7);
  s.text('BANKROLL $'+(view.cash??0),4,190,12);
  s.text(view.readOnly?'RIVAL ENGINE':bayMode==='work'?(locked?'ACCESS BLOCKED':isWheel(slot)?'TURN EACH LUG':'WORKING UNDER THE HOOD'):
    bayMode==='tune'?'SET DISTRIBUTOR TIMING':'CHOOSE A PART',162,190,7);
}
