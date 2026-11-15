import {DASH_COURSE_EDITION,DASH_OVERHEAD,DASH_CUES,dashCampaignPlan} from './dash-campaign.mjs';
// The renderer, the level editor and the replay verifier use these world coordinates.
export const DASH_HZ=120,DASH_DT=1/DASH_HZ,DASH_MAX_TICKS=14400,DASH_CEILING=4.65;
export const DASH_PATTERN=/^[.sbglwcpfrmodhCSBUWRPVIFLEJOMKDTHANQ]+$/;
export const DASH_MODES={C:'Cube',S:'Ship',B:'Ball',U:'UFO',W:'Wave',R:'Robot',P:'Spider',V:'Swing'};
export const DASH_TOOLS={I:'Flip gravity',F:'Fast portal',L:'Slow portal',E:'Normal speed',J:'Jump pad',
  O:'Jump orb',M:'Moving platform',K:'Checkpoint',D:'Scenery',T:'Laser switch',H:'Beat gate',A:'Spring pad',N:'Brake strip',Q:'Light cue'};
const jaws=new Set(['s','w','c','l','p','f','r','m','o','d','h','b','H']);
const transformable=new Set([...jaws,'D','M','O']);
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const phaseAt=(length,at)=>Math.min(2,Math.floor(Math.max(0,at)/Math.max(1,length)*3));
const bodySizes={C:[.31,.34],S:[.41,.23],B:[.32,.32],U:[.34,.25],W:[.25,.25],R:[.31,.39],P:[.32,.26],V:[.29,.30]};
const boosts={F:1.32,L:.76,E:1};
const startsInAir=new Set(['S','U','W','V']);
const designs={s:[.41,1.02],b:[.45,1.08],l:[.33,1.2],w:[.39,1.02],c:[.36,1.29],p:[.31,1.29],H:[.36,1.39],
  f:[.35,1.16],r:[.35,.98],m:[.39,1.06],o:[.33,.91],d:[.30,.74],h:[.36,1.19]};
export const dashCanTransform=token=>transformable.has(token);
export const dashCanRotate=token=>['s','c','f'].includes(token);

export function validateDashLayout(pattern,layout=[]){
  if(!Array.isArray(layout)||layout.length>pattern.length)throw Error('Invalid level layout.');
  let previous=-1;
  for(const item of layout){
    const [above,cue]=Array.isArray(item)&&item.length===7?item.slice(5):['.','.'];
    if(!Array.isArray(item)||![5,7].includes(item.length)||!item.slice(0,5).every(Number.isInteger)||
      typeof above!=='string'||above.length!==1||!(DASH_OVERHEAD+'.').includes(above)||
      typeof cue!=='string'||cue.length!==1||!(DASH_CUES+'.').includes(cue)||
      item[0]<=previous||item[0]<4||item[0]>=pattern.length-4||
      (!transformable.has(pattern[item[0]])&&(item[1]!==0||item[2]!==2||item[3]!==0))||
      (item[3]!==0&&!dashCanRotate(pattern[item[0]]))||
      item[1]<0||item[1]>3||item[2]<1||item[2]>3||item[3]<0||item[3]>1||item[4]<0||item[4]>2)
      throw Error('Invalid tile transform.');
    previous=item[0];
  }
  return layout;
}

export function createDashCourse(pattern,pace=210,{boss=false,bossStyle='none',layout=[],stage=0,edition=1}={}){
  if(typeof pattern!=='string'||pattern.length<24||pattern.length>90||!DASH_PATTERN.test(pattern)||
    !pattern.startsWith('....')||!pattern.endsWith('....')||
    !Number.isInteger(pace)||pace<100||pace>400)throw Error('Invalid Dash Forge track.');
  validateDashLayout(pattern,layout);
  const advanced=edition===DASH_COURSE_EDITION;
  const plan=advanced?dashCampaignPlan(stage,pattern.length,boss,bossStyle):null;
  if(plan){pattern=plan.pattern;layout=plan.layout;}
  const settings=new Map(layout.map(([tile,...detail])=>[tile,detail]));
  const cells=[...pattern].map((token,index)=>{
    const [lane,scale,flip,decor,above='.',cue='.']=settings.get(index)||[0,2,0,0];
    const cell={token,index,x:index+.5,lane,scale:[0,.77,1,1.22][scale],flip:Boolean(flip),decor};
    if(above!=='.')cell.above={token:above,index,x:cell.x,lane:3,scale:.87,flip:false,layer:'above'};
    if(cue!=='.')cell.cue={token:cue,index,x:cell.x,lane:0,scale:1,flip:false,layer:'cue'};
    return cell;
  });
  if(!advanced&&stage>=8&&stage%3!==0){
    const modes=['S','B','U','W','R','P','V'];
    const mode=modes[Math.floor((stage-8)/2)%modes.length];
    const entry=cells.find((cell)=>cell.index>=6&&cell.index<pattern.length-10&&
      cells.slice(cell.index-1,cell.index+5).every(item=>item.token==='.'));
    if(entry){entry.token=mode;cells[entry.index+3].token='C';}
  }
  if(boss&&!plan){
    const attacks=['d','h','l'];
    const styleOffset=[...bossStyle].reduce((n,c)=>n+c.charCodeAt(0),0)%attacks.length;
    for(let phase=0;phase<3;phase++){
      const slot=Math.round(pattern.length*(.22+phase*.26));
      const free=cells.slice(Math.max(4,slot-3),Math.min(pattern.length-4,slot+4))
        .filter((cell)=>cell.token==='.'&&cells.slice(cell.index-2,cell.index+3).every(entry=>entry.token==='.'))
        .sort((a,b)=>Math.abs(a.index-slot)-Math.abs(b.index-slot))[0];
      if(free){free.token=attacks[(styleOffset+phase)%attacks.length];free.attack=true;}
    }
  }
  return {cells,pattern,pace,boss,bossStyle,edition,sections:plan?.sections||[]};
}
export function dashObjects(cell){
  return [cell,cell.above,cell.cue].filter(Boolean);
}
export const dashBeatAt=state=>state.elapsed*500/state.course.pace;
export function dashGateActive(state,cell){
  if(cell.token!=='l'&&cell.token!=='H')return true;
  if(state.x<state.laserOff)return false;
  if(cell.token==='l')return true;
  const beat=dashBeatAt(state);
  return beat%4>=1.55;
}

export function dashShape(course,cell,elapsed){
  const {token,index,lane,scale,flip}=cell,phase=course.boss?phaseAt(course.pattern.length,index):0;
  let x=cell.x,low=lane===0?0:lane===1?1.1:lane===2?2.32:DASH_CEILING;
  let height=(designs[token]?.[1]||.55)*scale,half=(designs[token]?.[0]||.38)*scale;
  if(token==='d'||token==='w'||token==='o'||token==='h'){
    x+=Math.sin(elapsed*(2.6+phase*.75)+index*.76)*(.14+phase*.049);
    if(token==='d'||token==='w')low+=.23+Math.sin(elapsed*(3+phase*.8)+index)*.19;
  }
  if(token==='M'){x+=Math.sin(elapsed*2.65+index)*.21;low+=.57+Math.sin(elapsed*3.88+index)*.36;height=.16;half=.46*scale;}
  if(token==='O'){low+=.62;height=.56*scale;half=.28*scale;}
  const inverted=lane===3?!flip:flip;
  if(lane===3)low-=height;
  return {x,low,high:low+height,half,tip:dashCanRotate(token),inverted};
}

export function createDashRun(course,{tile=0,practice=false}={}){
  const start=clamp(Math.floor(tile),0,course.pattern.length-1),x=start+.10;
  const state={course,x,y:bodySizes.C[1],vy:0,mode:'C',gravity:1,speed:1,tick:0,elapsed:0,
    pressed:false,supported:true,jumpTicks:0,done:false,won:false,deathTile:null,
    event:'',checkpoint:start,laserOff:0,slowUntil:0,previousSpeed:1,lightCue:0,practice,immuneUntil:start?42:0,used:new Set()};
  for(let i=0;i<start;i++){
    for(const cell of dashObjects(course.cells[i]))
      if(cell.token in DASH_MODES||cell.token in boosts||cell.token==='I')enter(state,cell);
  }
  state.y=startsInAir.has(state.mode)?DASH_CEILING*.50:state.gravity>0?bodySizes[state.mode][1]:DASH_CEILING-bodySizes[state.mode][1];
  state.supported=!startsInAir.has(state.mode);
  return state;
}

function enter(s,cell){
  const token=cell.token;
  if(token in DASH_MODES){
    if(token!==s.mode){
      s.mode=token;s.vy=0;s.jumpTicks=0;s.event='mode';
      if(startsInAir.has(token)){
        const wave=token==='W'&&s.course.edition===DASH_COURSE_EDITION;
        s.y=wave?clamp(s.y,1.94,2.70):clamp(s.y,1.05,DASH_CEILING-1.05);
        s.supported=false;
      }
    }
  }else if(token==='I'){s.gravity*=-1;s.supported=false;s.event='gravity';}
  else if(token in boosts){s.speed=boosts[token];s.slowUntil=0;s.event='speed';}
  else if((token==='J'||token==='A')&&s.supported){
    s.supported=false;s.vy=s.gravity*(token==='A'?20.1:17.5);s.event='pad';
  }else if(token==='N'){
    if(!s.slowUntil)s.previousSpeed=s.speed;
    s.speed=.62;s.slowUntil=cell.index+4;s.event='speed';
  }else if(token==='Q'){
    s.lightCue=(s.lightCue+1)%4;s.event='light';
  }else if(token==='K'&&s.practice){
    s.checkpoint=cell.index+1;s.event='checkpoint';
  }else if(token==='T'){
    s.laserOff=cell.index+7;s.event='switch';
  }
}

function control(s,hold,tap,dt){
  switch(s.mode){
    case 'C':
      if(hold&&s.supported){s.vy=s.gravity*14.4;s.supported=false;s.event='jump';}
      s.vy-=s.gravity*51*dt;break;
    case 'R':
      if(hold&&s.supported){s.vy=s.gravity*11;s.jumpTicks=24;s.supported=false;s.event='jump';}
      if(!hold)s.jumpTicks=0;
      if(s.jumpTicks>0){s.vy+=s.gravity*22*dt;s.jumpTicks--;}
      s.vy-=s.gravity*49*dt;break;
    case 'S':
      s.vy=clamp(s.vy+s.gravity*(hold?29:-25)*dt,-8,8);s.supported=false;break;
    case 'B':
      if(tap&&s.supported){s.gravity*=-1;s.vy=0;s.supported=false;s.event='gravity';}
      s.vy-=s.gravity*38*dt;break;
    case 'U':
      if(tap){s.vy=s.gravity*10.2;s.event='jump';}
      s.vy-=s.gravity*29*dt;break;
    case 'W':
      s.vy=(hold?1:-1)*s.gravity*1000/s.course.pace*s.speed*.98;s.supported=false;break;
    case 'P':
      if(tap&&s.supported){
        s.gravity*=-1;
        s.y=s.gravity>0?bodySizes.P[1]:DASH_CEILING-bodySizes.P[1];
        s.vy=0;s.event='warp';
      }
      s.vy-=s.gravity*50*dt;break;
    case 'V':
      if(tap){s.gravity*=-1;s.event='gravity';}
      s.vy=clamp(s.vy-s.gravity*23*dt,-8.7,8.7);break;
  }
}

function collide(s,cell,shape,oldY,halfW,halfH){
  if(!dashGateActive(s,cell))return false;
  const left=s.x-halfW,right=s.x+halfW,bottom=s.y-halfH,top=s.y+halfH;
  if(right<=shape.x-shape.half||left>=shape.x+shape.half)return false;
  if(cell.token==='M'||cell.token==='b'){
    if(s.gravity>0&&s.vy<=0&&oldY-halfH>=shape.high-.016&&bottom<=shape.high){
      s.y=shape.high+halfH;s.vy=0;s.supported=true;return false;
    }
    if(s.gravity<0&&s.vy>=0&&oldY+halfH<=shape.low+.016&&top>=shape.low){
      s.y=shape.low-halfH;s.vy=0;s.supported=true;return false;
    }
  }
  if(cell.token==='M')return false;
  if(!jaws.has(cell.token)||top<=shape.low||bottom>=shape.high)return false;
  if(!shape.tip)return true;
  const dx=Math.max(0,left-shape.x,shape.x-right);
  const slope=(shape.high-shape.low)*(1-dx/shape.half);
  return shape.inverted?top>shape.high-slope:bottom<shape.low+slope;
}
function stop(s,cell){
  s.done=true;s.won=false;s.deathTile=clamp(cell,0,s.course.pattern.length-1);s.event='crash';
}
export function stepDash(s,mask=0){
  if(s.done)return s;
  s.tick++;s.elapsed=s.tick/DASH_HZ;s.event='';
  const hold=Boolean(mask&1),tap=Boolean(mask&2)||(hold&&!s.pressed);
  s.pressed=hold;
  const path=s.course,from=s.x;
  if(s.slowUntil&&s.x>=s.slowUntil){s.speed=s.previousSpeed;s.slowUntil=0;}
  s.x+=1000/path.pace*s.speed*DASH_DT;
  const center=path.cells[Math.floor(s.x)];
  if(center&&from<center.x&&s.x>=center.x)
    for(const object of dashObjects(center))enter(s,object);
  const [halfW,halfH]=bodySizes[s.mode];
  const near=path.cells.slice(Math.max(0,Math.floor(s.x)-1),Math.ceil(s.x)+1).flatMap(dashObjects);
  let orb=false;
  if(tap){
    for(const cell of near){
      if(cell.token!=='O'||s.used.has(cell.index))continue;
      const shape=dashShape(path,cell,s.elapsed);
      if(Math.abs(s.x-shape.x)<.70&&Math.abs(s.y-(shape.high+shape.low)/2)<.94){
        s.used.add(cell.index);orb=true;s.event='orb';s.vy=s.gravity*15.8;s.supported=false;break;
      }
    }
  }
  if(!orb)control(s,hold||tap,tap,DASH_DT);
  const oldY=s.y;
  s.y+=s.vy*DASH_DT;s.supported=false;
  const gap=center?.token==='g';
  if((gap&&s.y-halfH<-.27)||(s.mode==='W'&&(s.y-halfH<0||s.y+halfH>DASH_CEILING))){
    stop(s,center?.index??Math.floor(s.x));return s;
  }
  if(s.y-halfH<=0&&(!gap||s.mode==='W')){
    s.y=halfH;
    s.supported=s.gravity>0;
    s.vy=0;
  }
  if(s.y+halfH>=DASH_CEILING){
    s.y=DASH_CEILING-halfH;
    s.supported=s.gravity<0;
    s.vy=0;
  }
  // At 120 Hz the fastest player moves under .12 tiles per step. Player
  // and obstacle shapes share the same clock and greatly exceed that span.
  for(const cell of near){
    if(collide(s,cell,dashShape(path,cell,s.elapsed),oldY,halfW,halfH)&&s.tick>s.immuneUntil){
      stop(s,cell.index);return s;
    }
  }
  if(s.y<-.34){stop(s,center?.index??Math.floor(s.x));return s;}
  if(s.x>=path.pattern.length){s.done=true;s.won=true;s.event='finish';}
  if(s.tick>=DASH_MAX_TICKS&&!s.done)stop(s,Math.floor(s.x));
  return s;
}

export function replayDash(pattern,pace,options,trace){
  if(!Array.isArray(trace)||trace.length>1800)throw Error('Invalid Dash Forge trace.');
  let last=-1;
  for(const event of trace){
    if(!Array.isArray(event)||event.length!==2||!event.every(Number.isInteger)||
      event[0]<=last||event[0]>=DASH_MAX_TICKS||event[1]<0||event[1]>3)throw Error('Invalid Dash Forge control event.');
    last=event[0];
  }
  const state=createDashRun(createDashCourse(pattern,pace,options));
  let input=0,cursor=0;
  while(!state.done){
    if(trace[cursor]?.[0]===state.tick)input=trace[cursor++][1];
    stepDash(state,input);
  }
  if(cursor!==trace.length)throw Error('Control events extend past the run.');
  return {won:state.won,elapsed_ms:Math.round(state.elapsed*1000),death_tile:state.deathTile,tiles:Math.floor(state.x)+1};
}
