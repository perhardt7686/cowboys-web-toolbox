import {STAGE_WIDTH as W,STAGE_HEIGHT as H,projectTurn,wrapAngle} from './avatar-full-body.mjs?v=studio3';

export function turntableHTML({editor=false}={}){
  return '<div class="avatar-turntable" data-avatar-turntable>'+
    '<div class="avatar-turntable-frame"><canvas class="avatar-turntable-canvas" '+
    (editor?'id="family-avatar-canvas" ':'')+
    'width="'+(W*2)+'" height="'+(H*2)+'" tabindex="0" role="img" aria-label="Full-body preview. Drag to rotate or zoom in to pan."></canvas></div>'+
    (editor?'<div class="studio-camera-presets" role="group" aria-label="Camera presets">'+
      '<button type="button" data-turn="body" aria-pressed="true">Full body</button>'+
      '<button type="button" data-turn="face" aria-pressed="false">Face</button></div>':'')+
    '<div class="avatar-turntable-controls" role="group" aria-label="Turntable view">'+
    '<button type="button" data-turn="left" aria-label="Rotate left">‹</button>'+
    '<output class="avatar-view-angle" data-view-angle aria-live="polite">Front</output>'+
    '<button type="button" data-turn="right" aria-label="Rotate right">›</button>'+
    '<button type="button" data-turn="spin" aria-pressed="false">Spin</button>'+
    '<button type="button" data-turn="less" aria-label="Zoom out">−</button>'+
    '<button type="button" data-turn="more" aria-label="Zoom in">+</button>'+
    '<button type="button" data-turn="fit">Fit</button>'+
    '<button type="button" data-turn="reset">Reset view</button>'+
    '</div></div>';
}

export function mountTurntable(root,paint,preferReducedMotion=()=>false,selectPart){
  const canvas=root.querySelector('canvas');
  const label=root.querySelector('[data-view-angle]');
  const spin=root.querySelector('[data-turn=spin]');
  const minus=root.querySelector('[data-turn=less]');
  const plus=root.querySelector('[data-turn=more]');
  const presets=root.querySelector('.studio-camera-presets');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>media.matches||preferReducedMotion();
  const camera={angle:0,zoom:1,x:0,y:0};
  let pointer=null,frame=0,rotating=false,paintTime=0,positionTime=0;
  let pausedAt=0,animationStart=0,tweenFrom=0,tweenDistance=0;
  const controller=new AbortController();
  const {signal}=controller;

  function draw(time=0,activity=null){
    spin.disabled=reduced();
    minus.disabled=camera.zoom<=1;
    plus.disabled=camera.zoom>=2.45;
    for(const button of presets?.children||[])
      button.setAttribute('aria-pressed',String(button.dataset.turn===(camera.zoom>=2?'face':'body')));
    const direction=projectTurn(camera.angle).name;
    if(label.textContent!==direction)label.textContent=direction;
    canvas.dataset.angle=String(Math.round(camera.angle));
    canvas.dataset.zoom=String(camera.zoom);
    paint(camera,time,activity);
  }

  function stop(){
    rotating=false;
    cancelAnimationFrame(frame);frame=0;
    spin.textContent='Spin';spin.setAttribute('aria-pressed','false');
    label.setAttribute('aria-live','polite');
  }

  function visible(){
    const dialog=root.closest('dialog');
    return root.isConnected&&canvas.getClientRects().length>0&&!document.hidden&&(!dialog||dialog.open);
  }

  function animate(now){
    if(!visible()||reduced()){stop();return;}
    if(rotating){
      const elapsed=positionTime?Math.min(now-positionTime,50):0;
      positionTime=now;
      camera.angle=wrapAngle(camera.angle+elapsed*.037);
    }else{
      const duration=Math.min(1,(now-animationStart)/170);
      camera.angle=wrapAngle(tweenFrom+tweenDistance*duration*(2-duration));
      if(duration>=1){draw();frame=0;return;}
    }
    if(now-paintTime>=28){draw(now/1000);paintTime=now;}
    frame=requestAnimationFrame(animate);
  }

  function step(direction){
    stop();
    tweenFrom=camera.angle;tweenDistance=45*direction;
    if(reduced()||!visible()){
      camera.angle=wrapAngle(tweenFrom+tweenDistance);
      draw();return;
    }
    animationStart=performance.now();paintTime=0;
    frame=requestAnimationFrame(animate);
  }

  function setZoom(value){
    const old=camera.zoom;
    camera.zoom=Math.max(1,Math.min(2.45,Number(value.toFixed(2))));
    if(camera.zoom===1)camera.x=camera.y=0;
    else if(old===1)camera.y=74;
    draw();
  }
  function face(){
    stop();
    camera.x=0;camera.y=166;camera.zoom=2.45;
    draw();
  }

  root.addEventListener('click',event=>{
    const action=event.target.closest('[data-turn]')?.dataset.turn;
    if(!action)return;
    if(action==='left'||action==='right'){step(action==='left'?-1:1);return;}
    if(action==='spin'){
      if(rotating||reduced()){stop();return;}
      stop();rotating=true;positionTime=paintTime=0;
      spin.textContent='Pause';spin.setAttribute('aria-pressed','true');label.setAttribute('aria-live','off');
      frame=requestAnimationFrame(animate);return;
    }
    stop();
    if(action==='face'){face();return;}
    if(action==='reset')camera.angle=0;
    setZoom(action==='more'?camera.zoom+.35:action==='less'?camera.zoom-.35:1);
  },{signal});

  canvas.addEventListener('keydown',event=>{
    const {key}=event;
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(key))return;
    if((key==='ArrowUp'||key==='ArrowDown')&&camera.zoom===1)return;
    event.preventDefault();
    if(key==='ArrowLeft'||key==='ArrowRight'){step(key==='ArrowLeft'?-1:1);return;}
    stop();
    if(key==='Home'){camera.angle=0;setZoom(1);}
    else if(key==='+'||key==='-')setZoom(camera.zoom+(key==='+'?.35:-.35));
    else {
      camera.y=Math.max(-155,Math.min(176,camera.y+(key==='ArrowUp'?24:-24)));
      draw();
    }
  },{signal});

  canvas.addEventListener('pointerdown',event=>{
    if(pointer||event.button!==0)return;
    stop();
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,at:camera.angle,
      panX:camera.x,panY:camera.y,drag:false};
  },{signal});
  canvas.addEventListener('pointermove',event=>{
    if(pointer?.id!==event.pointerId)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(!pointer.drag){
      if(Math.hypot(dx,dy)<8)return;
      if(camera.zoom===1&&Math.abs(dy)>Math.abs(dx)){pointer=null;return;}
      pointer.drag=true;canvas.setPointerCapture(event.pointerId);
    }
    if(camera.zoom>1&&(event.shiftKey||Math.abs(dy)>Math.abs(dx))){
      const factor=W/(canvas.clientWidth*camera.zoom);
      camera.x=Math.max(-141,Math.min(141,pointer.panX+dx*factor));
      camera.y=Math.max(-155,Math.min(176,pointer.panY+dy*factor));
    }else{
      camera.angle=wrapAngle(pointer.at+dx*1.42);
    }
    const now=performance.now();
    if(now-pausedAt>16){pausedAt=now;draw();}
  },{signal});
  const released=event=>{
    if(pointer?.id!==event.pointerId)return;
    const tap=event.type==='pointerup'&&!pointer.drag&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<8;
    pointer=null;draw();
    if(tap&&selectPart){
      const box=canvas.getBoundingClientRect();
      selectPart((event.clientX-box.left)/box.width,(event.clientY-box.top)/box.height,camera);
    }
  };
  canvas.addEventListener('pointerup',released,{signal});
  canvas.addEventListener('pointercancel',released,{signal});
  canvas.addEventListener('lostpointercapture',released,{signal});
  media.addEventListener('change',()=>{if(reduced())stop();if(visible())draw();},{signal});
  draw();
  return {canvas,draw,stop,face,destroy(){stop();controller.abort();}};
}
