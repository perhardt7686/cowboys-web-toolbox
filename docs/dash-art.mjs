import {DASH_CEILING,DASH_MODES,DASH_TOOLS,dashShape} from './dash-physics.mjs';

export const DASH_PALETTES={C:'#ffda68',S:'#69eaff',B:'#ed9aff',U:'#93ffc2',W:'#ff9b6e',
  R:'#a4b4ff',P:'#ff83af',V:'#fff5ac',I:'#fa8ce2',F:'#fe9a5f',L:'#8bcdff',E:'#acfbcd',
  J:'#ffdb56',O:'#ff944e',M:'#7be9ca',K:'#ceabff',D:'#8983da',T:'#8fff73'};
const hazards={s:'#ff608d',b:'#ffad52',l:'#f087fb',w:'#ffbf77',c:'#9ae3ff',
  p:'#bc9dfd',f:'#ffa231',r:'#69f5cc',m:'#ed97d8',o:'#ff72c6',d:'#81e8fc',h:'#bd9bff'};
function bounds(g,poly,fill,stroke='#241a43',width=2.6){
  g.fillStyle=fill;g.strokeStyle=stroke;g.lineWidth=width;g.beginPath();
  for(const [i,p] of poly.entries())i?g.lineTo(...p):g.moveTo(...p);
  g.closePath();g.fill();g.stroke();
}
function circle(g,x,y,r,fill,stroke='#24224b',width=2.6){
  g.fillStyle=fill;g.strokeStyle=stroke;g.lineWidth=width;
  g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.stroke();
}
function label(g,text,x,y,color){
  g.save();g.font='900 10px system-ui';g.textAlign='center';
  const width=g.measureText(text).width+10;
  g.fillStyle='#19203e';g.fillRect(x-width/2,y-11,width,14);
  g.fillStyle=color;g.fillText(text,x,y);g.restore();
}
export function drawDashObject(g,course,cell,cam,ground,size,time,{disabled=false,selected=false,verticalScale=size}={}){
  const {token,index}=cell,shape=dashShape(course,cell,time);
  const x=shape.x*size-cam,y=ground-shape.low*verticalScale,w=shape.half*size,h=(shape.high-shape.low)*verticalScale;
  if(x<-size*2||x>g.canvas.width+size*2)return;
  g.save();
  if(cell.decor||token==='D'){
    const sky=ground-(cell.decor===2?3.1:2.55)*verticalScale;
    g.strokeStyle='#a79ade88';g.lineWidth=2;
    g.strokeRect(x-size*.38,sky-size*.29,size*.76,size*.58);
    g.fillStyle=cell.decor===2?'#8ae8ca59':'#f9bb7967';
    g.fillRect(x-size*.24,sky-size*.14,size*.48,size*.28);
    if(token==='D')circle(g,x,y-h*.5,size*.11,'#e0acff','#5a4aaf',1.5);
  }
  if(token==='g'){
    g.fillStyle='#111528';g.fillRect(index*size-cam,ground-2,size,g.canvas.height-ground+2);
    g.strokeStyle='#ec8ec7';g.lineWidth=2;g.strokeRect(index*size-cam+3,ground+1,size-6,20);
  }else if(token in DASH_MODES||['I','F','L','E'].includes(token)){
    const color=DASH_PALETTES[token];
    g.strokeStyle=color;g.lineWidth=5;g.shadowColor=color;g.shadowBlur=11;
    const middle=ground-DASH_CEILING*.5*verticalScale;
    g.beginPath();g.ellipse(x,middle,size*.26,verticalScale*.89,0,0,Math.PI*2);g.stroke();
    g.shadowBlur=0;g.setLineDash([4,4]);g.lineWidth=2;
    g.beginPath();g.ellipse(x,middle,size*.42,verticalScale*1.04,0,0,Math.PI*2);g.stroke();g.setLineDash([]);
    label(g,DASH_MODES[token]||{I:'FLIP',F:'FAST',L:'SLOW',E:'NORMAL'}[token],x,middle-verticalScale*1.17,color);
  }else if(hazards[token]){
    const color=hazards[token];
    g.shadowColor=color;g.shadowBlur=disabled?0:7;
    g.globalAlpha=disabled?.24:1;
    if(shape.tip){
      const bottom=shape.inverted?y-h:y,top=shape.inverted?y:y-h;
      bounds(g,[[x-w,bottom],[x,top],[x+w,bottom]],color);
      g.shadowBlur=0;
      bounds(g,[[x-w*.50,bottom-1],[x,top+(shape.inverted?-9:9)],[x+w*.19,bottom-1]],'#ffe1c27d',color,1);
    }else{
      g.fillStyle=color;g.strokeStyle='#262452';g.lineWidth=3;
      g.fillRect(x-w,y-h,w*2,h);g.strokeRect(x-w,y-h,w*2,h);g.shadowBlur=0;
      if(['w','o','r'].includes(token)){
        circle(g,x,y-h*.5,Math.min(w-2,h*.39),'#221a45',color,2);
        g.save();g.translate(x,y-h*.5);g.rotate(time*4);
        g.fillStyle=color;g.fillRect(-w*.66,-3,w*1.32,6);g.fillRect(-3,-w*.55,6,w*1.1);g.restore();
      }else if(token==='d'||token==='h'){
        g.fillStyle='#191d44';g.fillRect(x-w*.70,y-h*.72,w*1.40,h*.47);
        g.fillStyle='#fff0c0';g.fillRect(x-6,y-h*.54,12,4);
      }else{
        g.strokeStyle='#fff2bb';g.lineWidth=2;g.strokeRect(x-w*.72,y-h*.79,w*1.44,h*.59);
        if(token==='l'){g.fillStyle=disabled?'#615489':'#fce6ff';g.fillRect(x-w,y-h*.55,w*2,5);}
      }
    }
    if(cell.attack)label(g,'BOSS',x,y-h-5,'#ffcb87');
  }else if(token==='O'){
    circle(g,x,y-h*.5,Math.min(w,h*.5),disabled?'#71638e':'#ffaa50','#ffed9f',3);
    circle(g,x,y-h*.5,Math.min(w,h*.5)*.39,'#fff5b0','#b36546',1.3);
  }else if(token==='M'||token==='J'){
    const color=DASH_PALETTES[token];
    const deck=token==='J'?ground:y-h;
    g.fillStyle=color;g.strokeStyle='#182449';g.lineWidth=2;
    g.fillRect(x-w,deck-7,w*2,7);g.strokeRect(x-w,deck-7,w*2,7);
    label(g,token==='M'?'LIFT':'PAD',x,deck-10,color);
  }else if(token==='K'||token==='T'){
    const color=DASH_PALETTES[token];
    g.fillStyle=color;g.fillRect(x-2,ground-46,4,46);
    bounds(g,[[x,ground-46],[x+18,ground-44],[x+15,ground-33],[x,ground-33]],color);
    label(g,token==='K'?'CHECKPOINT':'LASER OFF',x,ground-51,color);
  }
  if(selected){
    g.globalAlpha=1;g.strokeStyle='#fff9a7';g.lineWidth=3;g.setLineDash([5,3]);
    g.strokeRect(index*size-cam+2,52,size-4,ground-49);g.setLineDash([]);
  }
  g.restore();
}

export function drawDashPlayer(g,mode,x,y,color,rotation=0,gravity=1){
  g.save();g.translate(x,y);g.rotate(rotation);g.scale(1,gravity<0?-1:1);
  g.shadowColor=color;g.shadowBlur=14;
  if(mode==='B')circle(g,0,0,15,color);
  else if(mode==='S')bounds(g,[[-20,7],[-15,-7],[-5,-5],[4,-13],[19,0],[8,10]],color);
  else if(mode==='U'){circle(g,0,-5,11,'#a1f9ff');bounds(g,[[-21,1],[-9,-2],[13,-2],[21,3],[14,11],[-13,11]],color);}
  else if(mode==='W')bounds(g,[[-13,-10],[14,0],[-13,10],[-4,0]],color);
  else if(mode==='V')bounds(g,[[0,-16],[14,-5],[10,11],[0,17],[-13,7],[-14,-5]],color);
  else if(mode==='P'){
    for(const side of [-1,1])for(const pad of [-1,0,1])bounds(g,[[side*7,pad*5],[side*19,pad*6-4],[side*20,pad*6+2],[side*10,pad*5+4]],color);
    circle(g,0,0,11,color);
  }else if(mode==='R'){
    bounds(g,[[-14,-14],[14,-14],[15,11],[9,15],[-10,15],[-15,9]],color);
    g.fillStyle='#ffe396';g.fillRect(-16,4,5,10);g.fillRect(11,4,5,10);
  }else bounds(g,[[-15,-15],[15,-15],[15,15],[-15,15]],color);
  g.shadowBlur=0;g.fillStyle='#211a40';
  if(mode==='W'){g.fillRect(-4,-3,7,6);}
  else{g.fillRect(-8,-5,5,5);g.fillRect(4,-5,5,5);}
  g.restore();
}
