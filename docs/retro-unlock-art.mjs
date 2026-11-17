/* Original in-game visual equipment for Star Squadron and Mystery Maze.
 * This module draws only. Never changes physics state, inputs, scoring or rewards.
 */
const ring=(c,x,y,r,stroke,width=2)=>{
 c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.lineWidth=width;c.strokeStyle=stroke;c.stroke();
};
export function drawFleetWake(c,look,s,x,y){
 if(look!=='comet')return;
 c.save();
 const flicker=3*Math.sin(s.tick*.7);
 for(const side of [-1,1]){
  c.beginPath();c.moveTo(x+side*13,y+17);
  c.lineTo(x+side*11,y+61+flicker);
  c.lineTo(x+side*5,y+35);c.closePath();
  c.fillStyle='#ff964f';c.fill();
  c.beginPath();c.moveTo(x+side*12,y+18);
  c.lineTo(x+side*10,y+44+flicker);
  c.lineTo(x+side*8,y+31);c.closePath();
  c.fillStyle='#fff0a2';c.fill();
 }
 c.restore();
}
export function drawFleetGear(c,look,s,x,y){
 c.save();c.translate(x,y);
 if(look==='signal'){
  c.fillStyle='#e9f9ff';
  for(const side of [-1,1]){
   c.fillRect(side*20-3,0,6,8);
   ring(c,side*20,-3,5,'#94e8ff',2);
  }
  c.fillStyle='#74b9fb';c.fillRect(-6,-13,12,13);
 }else if(look==='nova'){
  for(const side of [-1,1]){
   c.beginPath();c.moveTo(side*18,-6);c.lineTo(side*47,13);
   c.lineTo(side*30,-14);c.closePath();
   c.fillStyle='#ad83fa';c.fill();c.strokeStyle='#f3daff';c.lineWidth=2;c.stroke();
   c.beginPath();c.moveTo(side*19,5);c.lineTo(side*38,17);
   c.strokeStyle='#83fff1';c.lineWidth=3;c.stroke();
  }
 }else if(look==='admiral'){
  c.beginPath();c.moveTo(-16,-41);c.lineTo(-13,-56);c.lineTo(-4,-49);
  c.lineTo(0,-62);c.lineTo(6,-48);c.lineTo(15,-55);
  c.lineTo(16,-41);c.closePath();
  c.fillStyle='#ffde72';c.fill();c.strokeStyle='#fff7b8';c.lineWidth=2;c.stroke();
  c.fillStyle='#fff7d5';c.fillRect(-3,-51,6,5);
  for(const dx of [-17,17]){ring(c,dx,7,5,'#fff2b5',2);}
 }
 c.restore();
}
export function drawMazeFootprints(c,look,s,tile){
 if(look!=='footsteps')return;
 const seen=(s.seen||[]).slice(-15);
 c.save();
 for(const [i,key] of seen.entries()){
  const [gx,gy]=key.split(',').map(Number);
  if(!Number.isInteger(gx)||!Number.isInteger(gy))continue;
  const x=(gx+.5)*tile,y=(gy+.5)*tile;
  c.fillStyle='rgba(255,223,126,'+(0.18+0.65*i/Math.max(1,seen.length))+')';
  c.beginPath();c.ellipse(x-5,y+4,2.6,4.3,-.25,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(x+5,y-3,2.6,4.3,.25,0,Math.PI*2);c.fill();
 }
 c.restore();
}
export function drawMazeGear(c,look,s,x,y){
 c.save();
 if(look==='lantern'){
  const cx=x+20,cy=y+6;
  const glow=c.createRadialGradient(cx,cy,3,cx,cy,29);
  glow.addColorStop(0,'rgba(255,247,161,.45)');
  glow.addColorStop(1,'rgba(255,226,128,0)');
  c.fillStyle=glow;c.beginPath();c.arc(cx,cy,29,0,Math.PI*2);c.fill();
  c.strokeStyle='#754b4a';c.lineWidth=2;
  c.beginPath();c.moveTo(x+9,y+7);c.lineTo(cx-4,cy);c.stroke();
  c.fillStyle='#f8df8c';c.fillRect(cx-7,cy-6,14,15);
  c.fillStyle='#fdf7bf';c.fillRect(cx-3,cy-2,6,7);
  c.strokeStyle='#7d5d78';c.strokeRect(cx-7,cy-6,14,15);
  c.beginPath();c.arc(cx,cy-6,5,Math.PI,0);c.stroke();
 }else if(look==='compass'){
  const cx=x+22,cy=y-19;
  c.fillStyle='#f4edc9';c.beginPath();c.arc(cx,cy,11,0,Math.PI*2);c.fill();
  ring(c,cx,cy,12,'#759dff',2);
  c.save();c.translate(cx,cy);c.rotate((s.tick||0)*.12);
  c.beginPath();c.moveTo(0,-9);c.lineTo(-4,4);c.lineTo(0,1);
  c.lineTo(4,4);c.closePath();c.fillStyle='#714bca';c.fill();
  c.restore();
  c.fillStyle='#323358';c.font='bold 8px monospace';c.fillText('N',cx-3,cy-13);
 }else if(look==='keeper'){
  c.strokeStyle='#ffe99b';c.lineWidth=3;
  c.beginPath();c.arc(x,y-21,19,Math.PI*1.1,Math.PI*1.9);c.stroke();
  for(const [dx,dy] of [[-14,-38],[0,-44],[14,-38]]){
   c.beginPath();c.moveTo(x+dx,y+dy-7);c.lineTo(x+dx+3,y+dy);
   c.lineTo(x+dx+9,y+dy+2);c.lineTo(x+dx+3,y+dy+5);
   c.lineTo(x+dx,y+dy+11);c.lineTo(x+dx-3,y+dy+5);
   c.lineTo(x+dx-8,y+dy+2);c.lineTo(x+dx-3,y+dy);
   c.closePath();c.fillStyle='#ffe89d';c.fill();
  }
 }
 c.restore();
}
