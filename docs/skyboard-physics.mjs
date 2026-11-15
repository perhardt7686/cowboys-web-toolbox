// Simulation and replay share the same fixed clock, track and contact shapes.
export const SKY_HZ=120, SKY_DT=1/SKY_HZ, MAX_SKY_TICKS=18000;
export const SKY_INPUT={left:1,right:2,jump:4,drift:8,brake:16};
export const SKY_BOARDS={
  sunny:{speed:1,turn:1.12},snow:{speed:1.04,turn:.91},
  rocket:{speed:1.12,turn:.94},flower:{speed:1.01,turn:1.3},
  dragon:{speed:1.13,turn:1.12},star:{speed:1.17,turn:1.18}
};
const clamp=(x,min,max)=>Math.max(min,Math.min(x,max));
const smooth=t=>t*t*(3-2*t);
const lerp=(a,b,t)=>a+(b-a)*t;
function random(seed){
  let state=seed>>>0;
  return ()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };
}

export function buildSkyCourse(stage,seed){
  if(!Number.isInteger(stage)||stage<1||stage>30||!Number.isInteger(seed))throw Error('Invalid Skyboard course.');
  const rng=random(seed^Math.imul(stage,3313));
  const length=300+Math.min(105,stage*3), things=[];
  function add(kind,z,x=0,shape={}){
    things.push({id:things.length,kind,z,x,...shape});
  }
  const boostAt=43, second=Math.floor(length*.59);
  for(const [index,z] of [boostAt,second].entries()){
    add('boost',z,0,{half:5.5,duration:.49+Math.min(.12,stage*.004)});
    add('ball',z+41+index*4,0,{radius:2.18+stage*.012,travel:3.15+index*.51,
      rate:1.3+(stage%5)*.18,phase:rng()*Math.PI*2});
    if(stage>=12)add('ball',z+61,-.25,{radius:2.03,travel:3.7,rate:1.66,phase:rng()*Math.PI*2});
  }
  for(const [i,z] of [24,123,second-20,second+89,length-23].entries()){
    const x=(i%2?1:-1)*(1.9+rng()*1.5);
    add(i%2?'gate':'bar',z,x,{half:1.08+i*.055,height:.94+stage*.015});
    add('coin',z-7,-x*.78);
    add('coin',z+7,x*.54);
  }
  // Short lanes between the launch sections permit a full jump without
  // forcing a player to hit a hazard that is hidden at launch speed.
  if(stage>=3){
    add('gap',142,0,{span:2.75+Math.min(1,stage*.035)});
    if(stage>=8)add('platform',142,0,{span:2.80,half:1.12,travel:2.5,rate:1.48,phase:rng()*6.28});
  }
  if(stage>=6)add('spikes',second-10,2.6,{half:1.29,height:.82});
  const checkpoints=[0,112,Math.min(second-15,178),Math.min(second+78,length-28)]
    .filter((z,i,list)=>i===0||z>list[i-1]+8);
  things.sort((a,b)=>a.z-b.z);
  return {stage,seed,length,things,checkpoints,sway:4.2+(stage%6)*.54,phase:rng()*6.28};
}

export function skyTrack(course,z){
  const s=clamp(z,0,course.length);
  const center=Math.sin(s*.027+course.phase)*course.sway+Math.sin(s*.011)*2.7;
  const y=Math.sin(s*.038+course.phase)*.94+Math.sin(s*.021)*.73;
  const grade=Math.sin(Math.PI*clamp((s-108)/24,0,1))*.91;
  const half=5.75-(course.stage>=6?1.55:0)*Math.sin(Math.PI*clamp((s-109)/24,0,1))**2;
  return {center,y:y+grade,half};
}
export function skyObjectX(object,time){
  return object.travel?object.x+object.travel*Math.sin(time*object.rate+object.phase):object.x;
}
function trackGround(course,z,x,time){
  const track=skyTrack(course,z);
  if(Math.abs(x)>track.half)return null;
  const gap=course.things.find(o=>o.kind==='gap'&&Math.abs(z-o.z)<=o.span*.5);
  if(!gap)return track.y;
  const platform=course.things.find(o=>o.kind==='platform'&&Math.abs(z-o.z)<=o.span*.5&&Math.abs(x-skyObjectX(o,time))<=o.half);
  return platform?track.y-.12:null;
}

export function sweepSphere(from,to,before,after,radius){
  const offset=from.map((v,i)=>v-before[i]);
  const delta=to.map((v,i)=>v-after[i]-offset[i]);
  const c=offset.reduce((s,v)=>s+v*v,0)-radius*radius;
  if(c<=0)return 0;
  const a=delta.reduce((s,v)=>s+v*v,0);
  const b=offset.reduce((s,v,i)=>s+v*delta[i],0);
  const d=b*b-a*c;
  if(a<1e-9||b>=0||d<0)return null;
  const t=(-b-Math.sqrt(d))/a;
  return t>=0&&t<=1?t:null;
}

function sweepBox(from,to,low,high){
  let enter=0,exit=1;
  for(let i=0;i<3;i++){
    const delta=to[i]-from[i];
    if(Math.abs(delta)<1e-8){
      if(from[i]<low[i]||from[i]>high[i])return null;
      continue;
    }
    const a=(low[i]-from[i])/delta,b=(high[i]-from[i])/delta;
    enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));
    if(enter>exit)return null;
  }
  return enter;
}

export function createSkyRide(course,boardId='sunny'){
  if(!SKY_BOARDS[boardId])throw Error('Invalid board.');
  const params=SKY_BOARDS[boardId];
  const normal=(14.1+Math.min(3.4,course.stage*.14))*params.speed;
  return {course,boardId,params,normal,tick:0,elapsed:0,progress:0,x:0,y:skyTrack(course,0).y,
    speed:normal,vx:0,vy:0,mask:0,lean:0,grounded:true,lives:3,coins:0,used:new Set(),
    boost:0,coast:0,boosts:0,boostClears:0,ballHits:0,hurt:0,protectedUntil:0,checkpoint:0,
    recovery:0,event:'',done:false,won:false};
}

function riderCenter(course,z,x,y){
  return [skyTrack(course,z).center+x,y+.78,z];
}
function ballCenter(course,ball,time){
  const track=skyTrack(course,ball.z);
  return [track.center+skyObjectX(ball,time),track.y+ball.radius-.15,ball.z];
}
function resetAfterFall(s){
  s.lives--;
  s.event='fall';
  if(s.lives<=0){s.done=true;return;}
  s.progress=s.checkpoint;s.x=0;s.y=skyTrack(s.course,s.progress).y;
  s.vx=s.vy=s.boost=s.coast=s.hurt=0;
  s.recovery=.52;s.protectedUntil=s.elapsed+1.7;s.grounded=true;
}

export function stepSky(s,mask=0){
  if(s.done)return s;
  const dt=SKY_DT,course=s.course,oldTime=s.elapsed;
  s.tick++;s.elapsed=s.tick/SKY_HZ;s.event='';
  if(s.recovery>0){s.recovery=Math.max(0,s.recovery-dt);s.mask=mask;return s;}
  const side=Number(Boolean(mask&SKY_INPUT.right))-Number(Boolean(mask&SKY_INPUT.left));
  const drifting=Boolean(mask&SKY_INPUT.drift),jump=Boolean(mask&SKY_INPUT.jump)&&!(s.mask&SKY_INPUT.jump);
  s.mask=mask;
  const target=side*(drifting?8.3:6.8)*s.params.turn*(s.boost>0?1.68:1);
  s.vx=lerp(s.vx,target,Math.min(1,dt*(drifting?4.4:11)));
  s.lean=lerp(s.lean,clamp(s.vx/11,-1,1),.126);
  const braking=Boolean(mask&SKY_INPUT.brake)&&s.boost<=0;
  const normal=s.normal*(braking?.50:1);
  if(s.hurt>0){
    s.hurt=Math.max(0,s.hurt-dt);
    s.speed=Math.min(-10,s.speed+dt*14);
  }else if(s.boost>0){
    s.speed=normal*10;
    s.boost-=dt;
    if(s.boost<=0){s.boost=0;s.coast=.31;s.boostClears++;s.event='boost-clear';}
  }else if(s.coast>0){
    s.coast=Math.max(0,s.coast-dt);
    s.speed=normal*(1+9*(s.coast/.31)**2);
  }else s.speed=lerp(s.speed,normal,Math.min(1,dt*9));

  const old=s.progress,oldX=s.x,oldY=s.y;
  let z=clamp(old+s.speed*dt,0,course.length),x=clamp(oldX+s.vx*dt,-8.25,8.25);
  const floor=trackGround(course,z,x,s.elapsed);
  if(jump&&s.grounded){s.grounded=false;s.vy=7.8;s.event='jump';}
  let y=oldY;
  if(s.grounded&&floor!==null){y=floor;s.vy=0;}
  else{
    s.grounded=false;s.vy-=17.6*dt;y+=s.vy*dt;
    if(floor!==null&&s.vy<=0&&y<=floor&&oldY>=floor-.26){
      y=floor;s.vy=0;s.grounded=true;s.event='land';
    }
  }
  const a=riderCenter(course,old,oldX,oldY),b=riderCenter(course,z,x,y);
  let first=null;
  for(const obstacle of course.things){
    if(obstacle.z<Math.min(z,old)-5||obstacle.z>Math.max(z,old)+5)continue;
    const track=skyTrack(course,obstacle.z);
    const center=track.center+obstacle.x;
    if(z>=old&&old<=obstacle.z&&z>=obstacle.z&&!s.used.has(obstacle.id)){
      const at=lerp(oldX,x,clamp((obstacle.z-old)/Math.max(.001,z-old),0,1));
      if(obstacle.kind==='boost'&&Math.abs(at)<obstacle.half&&Math.abs(y-track.y)<.69){
        s.boost=obstacle.duration;s.coast=0;s.boosts++;s.event='boost';
        s.used.add(obstacle.id);
      }else if(obstacle.kind==='coin'&&Math.abs(at-obstacle.x)<.84&&Math.abs(y-track.y)<1.86){
        s.coins++;s.used.add(obstacle.id);s.event='coin';
      }
    }
    if(s.elapsed<s.protectedUntil)continue;
    let contact=null;
    if(obstacle.kind==='ball'){
      contact=sweepSphere(a,b,ballCenter(course,obstacle,oldTime),ballCenter(course,obstacle,s.elapsed),obstacle.radius+.60);
    }else if(['bar','spikes','gate'].includes(obstacle.kind)){
      contact=sweepBox(a,b,[center-obstacle.half-.43,track.y-.23,obstacle.z-.82],
        [center+obstacle.half+.43,track.y+obstacle.height+.53,obstacle.z+.82]);
    }
    if(contact!==null&&(!first||contact<first.contact))first={obstacle,contact};
  }
  if(first){
    const fraction=Math.max(0,first.contact-.01);
    z=lerp(old,z,fraction);x=lerp(oldX,x,fraction);y=lerp(oldY,y,fraction);
    const ball=first.obstacle.kind==='ball';
    s.speed=-Math.max(ball?23:13,Math.abs(s.speed)*(ball?.23:.11));
    s.hurt=ball?.34:.23;s.protectedUntil=s.elapsed+(ball?1.52:1.2);
    s.boost=s.coast=0;
    s.event=ball?'ball-hit':'bar-hit';
    if(ball)s.ballHits++;
  }
  s.progress=z;s.x=x;s.y=y;
  for(const checkpoint of course.checkpoints)
    if(s.progress>=checkpoint)s.checkpoint=Math.max(s.checkpoint,checkpoint);
  if(y<skyTrack(course,z).y-4.1)resetAfterFall(s);
  if(!s.done&&s.progress>=course.length){s.done=true;s.won=true;s.event='finish';}
  if(s.tick>=MAX_SKY_TICKS)s.done=true;
  return s;
}

export function replaySky(stage,seed,boardId,trace,{sample=false,maxTicks=MAX_SKY_TICKS}={}){
  if(!Array.isArray(trace)||trace.length>1500||!Number.isInteger(maxTicks)||maxTicks<1||maxTicks>MAX_SKY_TICKS)
    throw Error('Invalid Skyboard controls.');
  let last=-1;
  for(const event of trace){
    if(!Array.isArray(event)||event.length!==2||!event.every(Number.isInteger)||
      event[0]<=last||event[0]>=maxTicks||event[1]<0||event[1]>31)throw Error('Invalid Skyboard control event.');
    last=event[0];
  }
  const state=createSkyRide(buildSkyCourse(stage,seed),boardId);
  const frames=[];
  let input=0,cursor=0;
  while(!state.done&&state.tick<maxTicks){
    if(trace[cursor]?.[0]===state.tick)input=trace[cursor++][1];
    stepSky(state,input);
    if(sample&&(state.tick%12===0||state.done))
      frames.push([state.tick,Math.round(state.progress*100),Math.round(state.x*100),Math.round(state.y*100)]);
  }
  if(cursor!==trace.length)throw Error('Control events extend past the run.');
  return {won:state.won,elapsed_ms:Math.round(state.elapsed*1000),coins:state.coins,
    boost_clears:state.boostClears,ball_hits:state.ballHits,frames};
}
