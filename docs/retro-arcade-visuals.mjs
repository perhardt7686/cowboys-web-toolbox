/* Original family arcade presentation helpers. These coordinates, silhouettes,
 * and animation cues are visual only. No collisions, verified replay, unlocks,
 * seed handling, or points may depend on them.
 */
import {alienAt} from './retro-arcade-engine.mjs?v=arcade2';

export function squadronFormation(tick,seed,width){
  const age=Math.max(0,tick-1),live=alienAt(age,seed);
  const bw=(width-36)/9;
  const offset=Math.sin(age*.16)*7;
  const ships=[];
  for(let row=0;row<3;row++)for(let lane=0;lane<9;lane++){
    // The bright attacker breaks from the waiting formation.
    if(row===live.wave%3&&lane===live.lane&&tick>0&&live.age<=7)continue;
    ships.push({
      row,lane,x:18+(lane+.5)*bw+offset+(row-1)*3,
      y:65+row*37+(lane%2)*3,
      scale:row===0 ? 0.62 : row===1 ? 0.74 : 0.84
    });
  }
  return ships;
}

export function squadronDiver(tick,seed,width){
  if(tick<=0)return null;
  const wave=alienAt(tick-1,seed);
  if(wave.age>7)return null;
  const bw=(width-36)/9;
  const progress=wave.age/7;
  // The attacking ship returns to its authoritative lane for impact.
  const sway=Math.sin(Math.PI*progress)*(wave.boss?17:12);
  return {
    ...wave,
    x:18+(wave.lane+.5)*bw+sway*(wave.wave%2?-1:1),
    y:65+progress*336,
    tilt:(wave.wave%2?-1:1)*Math.sin(Math.PI*progress)*.30
  };
}

export function wispActing(ghost,player,tick,index,power){
  const dx=Math.sign((player?.x??ghost.x)-ghost.x);
  const dy=Math.sign((player?.y??ghost.y)-ghost.y);
  return {
    frightened:power>0,
    pupilX:power>0?0:dx*2.2,
    pupilY:power>0?0:dy*1.5,
    bounce:Math.sin(tick*.85+index*1.4)*1.4,
    color:power>0?'#77cde1':['#fa9dba','#ffbe76','#b0a3f4'][index%3]
  };
}

export function drawSquadronShip(ctx,x,y,scale,color,{active=false,boss=false,tilt=0}={}){
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(scale,scale);
  ctx.strokeStyle=active?'#fff0b6':'#8ea2c8';
  ctx.fillStyle=color;ctx.lineWidth=active?3.5:1.8;
  ctx.beginPath();
  ctx.moveTo(0,-19);ctx.quadraticCurveTo(8,-20,13,-9);
  ctx.lineTo(28,-16);ctx.lineTo(23,-1);ctx.lineTo(34,9);
  ctx.lineTo(15,13);ctx.lineTo(0,7);ctx.lineTo(-15,13);
  ctx.lineTo(-34,9);ctx.lineTo(-23,-1);ctx.lineTo(-28,-16);
  ctx.lineTo(-13,-9);ctx.quadraticCurveTo(-8,-20,0,-19);
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=active?'#342c56':'#30354e';
  ctx.fillRect(-11,-6,8,9);ctx.fillRect(3,-6,8,9);
  if(boss){
    ctx.fillStyle='#ffe9a6';ctx.beginPath();
    ctx.moveTo(0,-29);ctx.lineTo(6,-20);ctx.lineTo(0,-16);ctx.lineTo(-6,-20);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}

export function drawMazeWisp(ctx,x,y,acting,index,tick){
  ctx.save();ctx.translate(x,y+acting.bounce);
  ctx.fillStyle=acting.color;ctx.strokeStyle='#eee0ff';ctx.lineWidth=1.9;
  const phase=tick*.54+index;
  ctx.beginPath();ctx.moveTo(-11,9);ctx.lineTo(-11,-2);
  ctx.bezierCurveTo(-11,-17,11,-17,11,-2);
  ctx.lineTo(11,9);
  for(let step=2;step>=0;step--){
    const xx=-11+step*7.4;
    ctx.quadraticCurveTo(xx+3.7,4+Math.sin(phase+step)*2,xx,10);
  }
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=acting.frightened?'#243a66':'#fff8ed';
  for(const side of [-1,1]){
    ctx.beginPath();ctx.ellipse(side*4,-3,3.25,4.4,0,0,Math.PI*2);ctx.fill();
    if(!acting.frightened){
      ctx.fillStyle='#253253';ctx.beginPath();
      ctx.arc(side*4+acting.pupilX*.55,-3+acting.pupilY*.55,1.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff8ed';
    }
  }
  if(acting.frightened){
    ctx.strokeStyle='#243a66';ctx.beginPath();
    ctx.moveTo(-5,5);ctx.lineTo(-2,3);ctx.lineTo(1,5);ctx.lineTo(4,3);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMazeDetective(ctx,x,y,action,tick,coat,outline){
  ctx.save();ctx.translate(x,y);
  const stride=tick%2?1:-1;
  const heading={L:Math.PI,R:0,U:-Math.PI/2,D:Math.PI/2}[action]??0;
  ctx.fillStyle='#3c325c';
  ctx.fillRect(-9,8+stride,7,5);ctx.fillRect(2,8-stride,7,5);
  ctx.fillStyle=coat;ctx.strokeStyle=outline;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(0,0,11.7,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.save();ctx.rotate(heading);
  ctx.fillStyle='#33274d';ctx.beginPath();
  ctx.arc(5,-2,2,0,Math.PI*2);ctx.arc(5,3,2,0,Math.PI*2);ctx.fill();
  // A tiny animated talking mouth and detective hat, not copied sprites.
  ctx.strokeStyle='#33274d';ctx.lineWidth=2.2;ctx.beginPath();
  ctx.moveTo(7,7);ctx.lineTo(11,6+stride);ctx.stroke();
  ctx.restore();
  ctx.fillStyle=outline;ctx.fillRect(-13,-14,26,4);ctx.fillRect(-8,-22,16,10);
  ctx.fillStyle='#edd6aa';ctx.fillRect(-6,-18,12,2);
  ctx.restore();
}
