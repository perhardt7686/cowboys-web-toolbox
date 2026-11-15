import {INK,PAPER,oval,path,tint} from './avatar-cel-art.mjs?v=cel1';
import {BODY_MODELS,CENTER,normalizeBody,projectTurn} from './avatar-full-body.mjs?v=turn1';

const PANTS='#705043',LEATHER='#634333',BUCKLE='#d7a75b';
const palette=(v,highlight=.29,shadow=.34)=>[v,tint(v,'#ffd697',highlight),tint(v,'#252b42',shadow)];
function seam(c,x,y,points,color,width=1.6){path(c,[x,y],points,null,color,width);}

export function figureAt(recipe,angle,holding=[]){
  const kit=normalizeBody(recipe),model=kit.model,design=BODY_MODELS[model],view=projectTurn(angle);
  const head={x:CENTER+view.head,y:design.head};
  const shoulder=head.y+89*design.scale;
  const hip=515-design.leg-45;
  const silhouette=(w,d,correction)=>Math.hypot(w*view.across,d*view.depth)*correction;
  const chest= silhouette(design.shoulder,design.depth,view.shoulder);
  const waist= silhouette(design.waist,design.depth*.69,.98);
  const pelvis=silhouette(design.hip,design.depth*.83,view.hip);
  const limbs=[-1,1].map(side=>{
    const raised=side===1&&recipe.pose==='wave'&&!holding.includes(side);
    const busy=holding.includes(side);
    const hipPose=side===1&&['sleuth','detective','scout'].includes(model)&&!raised&&!busy;
    const leading=side===1?17:-8;
    const xy=(x,z)=>CENTER+view.at(x*side,z);
    const near=view.toward(side*design.shoulder,0);
    return {
      side,near,raised,busy,
      shoulder:{x:xy(design.shoulder-7,1),y:shoulder+8+view.arm*side*.24},
      elbow:{x:xy(design.shoulder+(hipPose?20:5),raised?10:busy?17:5),y:raised?shoulder+63:hip-73},
      hand:{x:xy(hipPose?design.waist+7:design.shoulder+9,raised?15:busy?25:6),y:raised?shoulder-3:busy?hip-63:hip+(hipPose?-47:3)},
      thigh:{x:xy(design.hip*.49,2),y:hip-4},
      knee:{x:xy(design.hip*.63,leading*.4),y:hip+(487-hip)*.53},
      ankle:{x:xy(design.hip*.77,leading),y:488+(side===-1?-7:0)}
    };
  }).sort((a,b)=>a.near-b.near);
  return {view,kit,model,design,head,shoulder,hip,chest,waist,pelvis,limbs,floor:514};
}

function boot(c,f,leg,style,wearColor){
  const {view}=f,{ankle:{x,y},side}=leg;
  const toes=Math.abs(view.depth)*(side*view.depth<0?view.nearFoot:view.farFoot);
  c.save();c.translate(x,0);c.scale(view.depth<-.03?-1:1,1);c.translate(-x,0);
  const back=view.across<-.27;
  const tall=style==='highboots'?52:style==='boots'?30:13;
  const thick=style==='loafers'||style==='maryjanes'?12:15;
  const [leather,light,dark]=palette(wearColor|| (style==='sneakers'?'#d6bc80':style==='maryjanes'?'#824449':'#5f5047'));
  const heel= -toes*.47;
  const cuff=x+heel*.42;
  path(c,[cuff-thick*.73,y-tall],[[cuff+thick*.82,y-tall],[x+thick*.69,y+1],
    [x+toes+thick,y+7,x+toes+thick,y+14],[x+toes+thick-2,y+19],
    [x-thick+heel,y+19],[x-thick+heel-2,y+13],[cuff-thick*.73,y-tall]],leather,INK,2.6);
  path(c,[x-thick+heel,y+12],[[x+toes*.63,y+17,x+toes+thick,y+13],[x+toes+thick-1,y+19],
    [x-thick+heel-1,y+19]],dark,INK,1.75);
  if(back)seam(c,x+heel*.4,y-tall+3,[[x+heel*.48,y+13]],light,1.8);
  else{
    seam(c,x+toes*.58-thick*.49,y+5,[[x+toes*.6+thick*.31,y+3]],light,1.75);
    const count=style==='maryjanes'?1:style==='loafers'?2:3;
    for(let i=0;i<count;i++){
      const yy=y-6-i*4,xx=x+toes*(.49-i*.11);
      seam(c,xx-5,yy,[[xx+5,yy-1]],style==='sneakers'?PAPER:light,style==='maryjanes'?2.5:1.55);
    }
  }
  c.restore();
}

function trouser(c,f,leg,clothes,color){
  const {thigh,knee,ankle}=leg;
  const width=f.design.hip*.36*(.78+.22*Math.abs(f.view.across));
  const cut=clothes.bottoms;
  const dress=cut==='dress'||cut==='pleats';
  const rig=f.design.family==='robot'||f.model==='armor';
  const [fabric,light,dark]=palette(color|| (dress?'#9e534b':rig?'#687985':PANTS));
  const flare=cut==='flares'?width*1.39:cut==='cuffs'?width*1.06:width*.78;
  const end=ankle.y-(dress?31:8);
  const start=dress?knee:thigh;
  const w=dress?width*.63:width;
  const main=dress?tint(fabric,'#ecc193',.62):fabric;
  path(c,[start.x-w,start.y],[[start.x+w,start.y],[knee.x+width*.69,knee.y],
    [ankle.x+flare*(dress?.54:1),end],[ankle.x-flare*(dress?.52:1),end],
    [knee.x-width*.58,knee.y],[start.x-w,start.y]],main,INK,2.55);
  path(c,[start.x-w*.79,start.y+3],[[knee.x-width*.47,knee.y],[ankle.x-flare*.76,end-1],
    [ankle.x-flare*.18,end-1],[knee.x-width*.02,knee.y],[start.x-1,start.y+3]],dark+'71',null);
  if(rig&&!dress){
    oval(c,knee.x,knee.y,width*.6,11,dark,INK,1.9);
    oval(c,knee.x-2,knee.y-2,width*.3,4,light,INK,1);
    seam(c,knee.x+width*.3,knee.y+16,[[ankle.x+flare*.53,end-4]],light);
  }else{
    seam(c,start.x+w*.38,start.y+6,[[knee.x+width*.41,knee.y+8],[ankle.x+flare*.51,end-5]],light+'b9',1.5);
    if(cut==='cuffs')path(c,[ankle.x-flare,end-7],[[ankle.x+flare,end-9],[ankle.x+flare,end+1],[ankle.x-flare,end+2]],dark,INK,1.65);
  }
  boot(c,f,leg,clothes.footwear,clothes.shoeColor);
}

function skirt(c,f,color,style){
  const {hip,pelvis:p,view}=f;
  const [fabric,light,dark]=palette(color);
  const sweep=p*1.15+5;
  const edge=hip+(style==='dress'?103:72);
  const skew=3*view.depth;
  path(c,[CENTER-p*.85,hip-36],[[CENTER+p*.85,hip-36],[CENTER+sweep+skew,edge-3],
    [CENTER+skew,edge+9,CENTER-sweep+skew,edge],[CENTER-p*.85,hip-36]],fabric,INK,2.65);
  if(style==='pleats'){
    for(const dx of [-.8,-.4,.03,.45,.81]){
      path(c,[CENTER+p*dx*.69,hip-29],[[CENTER+sweep*dx+skew,edge+(1-Math.abs(dx))*4],
        [CENTER+sweep*(dx+.12)+skew,edge+(1-Math.abs(dx))*4]],dark,null);
    }
  }else seam(c,CENTER+sweep*.37,edge-14,[[CENTER+sweep*.87,edge-18]],light,2.15);
  seam(c,CENTER-sweep+6,edge-5,[[CENTER+skew,edge+3,CENTER+sweep-7,edge-7]],light,1.5);
}

function shoulderCape(c,f,clothes,color){
  const {shoulder,hip,view,chest}=f;
  const [cloth,light,dark]=palette(color);
  const u=CENTER+view.depth*12+Math.sin(clothes.flutter||0)*14;
  const len=clothes.outerwear==='cape'?106:f.model==='specter'?93:65;
  const edge=hip+len;
  path(c,[CENTER-chest*.65,shoulder-6],[[CENTER-13,shoulder-16,CENTER+chest*.68,shoulder-6],
    [u+chest*.94,shoulder+46,u+chest*.83,edge-6],[u+15,edge+14,u-18,edge-13],
    [u-chest*.84,edge+2,u-chest*.99,edge-5],[u-chest*.72,shoulder+48,CENTER-chest*.65,shoulder-6]],cloth,INK,2.7);
  path(c,[u-17,shoulder+11],[[u+11,hip-45,u+21,edge-4],[u-7,edge-13],
    [u+1,hip-60,u-17,shoulder+11]],dark,null);
  seam(c,u+chest*.46,hip-23,[[u+chest*.64,edge-16]],light,1.8);
}

function arm(c,f,limb,skin,clothes,armColor){
  const {shoulder:a,elbow:b,hand:h}=limb;
  const {model,design,view}=f;
  const machine=design.family==='robot'||model==='armor';
  const sleeve=clothes.outerwear!=='none'||clothes.form!=='striped';
  const [base,light,dark]=palette(armColor);
  const width=(design.shoulder*.18+4)*(limb.near<0?.88:1);
  const mx=(b.x+h.x)*.5,my=(b.y+h.y)*.5;
  const handSkin=clothes.hands!=='none'?(clothes.handColor||tint(base,INK,.42)):machine?tint(skin,'#7f899d',.71):skin;
  const elbowColor=sleeve||machine?base:skin;
  path(c,[a.x-width,a.y],[[a.x-width*.48,a.y-13,a.x+width,a.y-7],
    [b.x+width*.82,b.y],[h.x+width*.59,h.y],[h.x-width*.57,h.y+1],
    [b.x-width*.78,b.y],[a.x-width,a.y]],elbowColor,INK,2.7);
  if(sleeve||machine){
    seam(c,a.x+width*.31,a.y+6,[[b.x+width*.49,b.y+1],[mx+width*.33,my]],light,1.9);
    path(c,[h.x-width*.58,h.y-8],[[h.x+width*.58,h.y-8],[h.x+width*.56,h.y],[h.x-width*.57,h.y]],dark,INK,1.75);
    if(machine){
      oval(c,b.x,b.y,width*.69,width*.7,dark,INK,1.8);
      oval(c,b.x-1,b.y-1,width*.31,width*.31,light,INK,1);
    }
  }
  const reach=limb.raised?-15:limb.busy?7:10;
  const drift=view.depth*1.5;
  path(c,[h.x-width*.49,h.y-4],[[h.x+width*.37,h.y-4],[h.x+width*.62,h.y+reach*.49],
    [h.x+width*.71+drift,h.y+reach,h.x+width*.25,h.y+reach+1],
    [h.x-width*.09,h.y+reach+5,h.x-width*.56,h.y+reach],
    [h.x-width*.69,h.y+2,h.x-width*.49,h.y-4]],handSkin,INK,2.05);
  seam(c,h.x+width*.32,h.y+1,[[h.x+width*.41,h.y+reach*.55,h.x-width*.09,h.y+reach*.49]],nullSafe(handSkin),1.3);
  if(limb.raised)for(const dx of [-5,0,5])
    seam(c,h.x+dx,h.y-7,[[h.x+dx+1,h.y-18+(dx===0?-2:1)]],nullSafe(handSkin),1.7);
}
function nullSafe(skin){return tint(skin,INK,.43);}

function torso(c,f,v,clothes,colors,skin){
  const {shoulder:y,hip:h,head,view,design,chest:w,waist:a,pelvis:p}=f;
  const x=CENTER, color=clothes.outerwear==='none'?colors.shirt:clothes.layerColor;
  const [fabric,light,dark]=palette(color);
  const robot=design.family==='robot', metal=robot||f.model==='armor';
  const front=view.across;
  path(c,[head.x-14,head.y+63*design.scale],[[head.x+15,head.y+62*design.scale],
    [head.x+14,y-7],[x+w*.35,y],[x,y+20],[x-w*.37,y],[head.x-14,y-7]],skin,INK,2.3);
  path(c,[x-w,y+6],[[x-w*.71,y-10,head.x-17,y-9],[head.x,y+5,head.x+16,y-9],
    [x+w*.6,y-7,x+w,y+6],[x+a,h-54],[x+p*.91,h-3],
    [x+8,h+3,x-p*.89,h-4],[x-a,h-49],[x-w,y+6]],fabric,INK,3.2);
  path(c,[x+w*.53,y+1],[[x+w,y+8],[x+a,h-53],[x+p*.86,h-7],
    [x+a*.25,h-3],[x+a*.35,h-52],[x+w*.26,y+34]],dark,null);
  path(c,[x-w*.86,y+12],[[x-w*.61,y+6,x-w*.33,y+1],[x-a*.48,h-58],
    [x-a*.73,h-15],[x-a*.81,h-61]],light,null);
  if(front<-.38){
    const x0=x+view.depth*w*.28;
    seam(c,x-w*.73,y+31,[[x0,y+48,x+w*.64,y+30]],dark,2.2);
    seam(c,x0,y+46,[[x0-2,h-38,x0+3,h-5]],dark,1.8);
    if(metal)path(c,[x0-w*.43,y+54],[[x0+w*.47,y+54],[x0+w*.42,h-40],[x0-w*.4,h-38]],light,INK,1.9);
    if(robot)for(let i=0;i<4;i++)seam(c,x0-w*.26,y+60+i*8,[[x0+w*.27,y+60+i*8]],dark,2);
    if(clothes.outerwear==='trench'||clothes.outerwear==='raincoat')seam(c,x-a*.82,h-22,[[x,h-11,x+a*.62,h-24]],light,1.8);
  }else{
    const x0=x+view.depth*w*.27;
    if(metal){
      path(c,[x0-w*.45,y+34],[[x0+w*.41,y+30],[x0+w*.38,h-48],[x0-w*.38,h-41]],dark,INK,2.2);
      if(robot){
        oval(c,x0+1,y+56,w*.23,13,'#d7b974',INK,1.8);
        seam(c,x0+2,y+57,[[x0+w*.12,y+51]],INK,1.7);
        oval(c,x0-9,y+82,3,3,'#d36953',INK,1);
        oval(c,x0+7,y+82,3,3,'#9cbf8b',INK,1);
      }else for(let i=0;i<4;i++)seam(c,x0-w*.28,y+59+i*8,[[x0+w*.27,y+55+i*8]],light,2.25);
    }else if(clothes.form==='sweater'||clothes.form==='turtleneck'){
      path(c,[head.x-20,y-7],[[head.x+17,y-9],[head.x+22,y+10],[head.x+2,y+21,head.x-22,y+10]],fabric,INK,2.05);
      for(let n=-15;n<=15;n+=6)seam(c,head.x+n,y-2,[[head.x+n,y+11]],light,1.15);
    }else if(clothes.form==='striped'){
      for(let i=0;i<4;i++)seam(c,x-a*.77,y+38+i*19,[[x+4,y+43+i*19,x+a*.71,y+37+i*19]],light,5);
    }else{
      path(c,[head.x-16,y-8],[[head.x,y+6],[x0-16,y+26],[x0-w*.51,y+4]],light,INK,1.8);
      path(c,[head.x+16,y-8],[[x0+w*.47,y+6],[x0+16,y+26],[head.x,y+6]],light,INK,1.8);
      seam(c,x0,y+15,[[x0+view.depth*2,h-8]],dark,1.8);
      for(let i=0;i<4;i++)oval(c,x0+5,y+30+i*20,2.35,2.35,light,INK,1);
      if(['denim','safari','vest','jacket','cardigan'].includes(clothes.form)||clothes.outerwear!=='none'){
        const l=x+view.at(-w*.54,14);
        path(c,[l-12,y+52],[[l+13,y+51],[l+12,y+72],[l-11,y+74]],light,INK,1.65);
        seam(c,l-11,y+57,[[l+12,y+56]],dark,1.4);
      }
    }
    if(clothes.bottoms==='overalls'){
      for(const l of [-.5,.5]){
        const dx=x0+w*l;
        path(c,[dx-7,y+6],[[dx+4,y+7],[dx+3,h-56],[dx-7,h-52]],'#586979',INK,1.6);
        oval(c,dx-2,h-58,3,3,BUCKLE,INK,1.05);
      }
      path(c,[x0-w*.49,h-53],[[x0+w*.44,h-56],[x0+w*.53,h-3],[x0-w*.49,h-3]],'#586979',INK,2);
    }
    if(v.accessory==='badge'){
      const pin=x+view.at(-w*.56,17);
      oval(c,pin,y+43,5,5,BUCKLE,INK,1.2);
      seam(c,pin-1.5,y+45,[[pin,y+40],[pin+2,y+44]],PAPER,1.15);
    }
  }
  if(clothes.waist!=='none'){
    const belted=clothes.waistColor||LEATHER;
    path(c,[x-p*.88,h-23],[[x,h-11,x+p*.88,h-24],[x+p*.96,h-14],
      [x,h-2,x-p*.93,h-13]],belted,INK,1.6);
    if(front>-.26){
      const cx=x+view.depth*p*.3;
      path(c,[cx-8,h-19],[[cx+8,h-20],[cx+8,h-9],[cx-8,h-9]],BUCKLE,INK,1.45);
      seam(c,cx-4,h-14,[[cx+4,h-14]],LEATHER,2.05);
    }
    if(clothes.waist==='utility')for(const side of [-1,1]){
      const cx=x+view.at(side*p*.7,5);
      path(c,[cx-7,h-17],[[cx+7,h-17],[cx+7,h+1],[cx-7,h+1]],'#8d664e',INK,1.5);
      oval(c,cx,h-8,1.8,1.8,BUCKLE);
    }
  }
  return armColor(f,clothes,colors);
}
function armColor(f,clothes,colors){
  return clothes.outerwear==='none'?colors.shirt:clothes.layerColor;
}

function neckwear(c,f,style,tone){
  const {view,head,shoulder:y}=f;
  const x=head.x+view.depth*5, cloth=tone||'#ac5249';
  if(style==='none')return;
  const front=view.across;
  if(style==='pendant'){
    if(front>-.27){
      seam(c,x-17,y-1,[[x+2,y+48,x+17,y-3]],'#bf8a51',2);
      oval(c,x+2,y+28,5.5,6.5,BUCKLE,INK,1.65);
    }
    return;
  }
  path(c,[x-18,y-6],[[x,y+5,x+16,y-7],[x+20,y+4],
    [x+2,y+17,x-20,y+3]],cloth,INK,1.9);
  if(front<-.42||style==='scarf'){
    const tail=front<-.42?-1:1;
    path(c,[x+tail*12,y+3],[[x+tail*27,y+13,x+tail*24,y+28],[x+tail*34,y+42],
      [x+tail*23,y+43],[x+tail*13,y+32],[x+tail*15,y+21,x+tail*7,y+9]],cloth,INK,1.6);
  }else{
    path(c,[x+1,y+7],[[x-8,y+27],[x+2,y+39],[x+13,y+28],[x+6,y+8]],cloth,INK,1.6);
  }
  seam(c,x-13,y+1,[[x,y+7,x+13,y+1]],tint(cloth,PAPER,.6),1.45);
}

function bag(c,f,style,tone){
  if(style==='none')return;
  const {view,chest,shoulder:y,hip,design}=f;
  const cx=CENTER+view.at(design.waist*.62,view.across<0?-20:5);
  const dark=tint(tone||'#936642',INK,.4);
  const color=tone||'#936642';
  if(style==='pack'&&view.across<.18){
    const x=CENTER+view.at(2,-26);
    path(c,[x-24,y+14],[[x+1,y+7,x+23,y+14],[x+27,y+75],[x+21,y+89],[x-25,y+83]],color,INK,2.1);
    path(c,[x-21,y+37],[[x+23,y+35],[x+22,y+59],[x-21,y+58]],tint(color,PAPER,.28),INK,1.55);
    oval(c,x,y+46,2.2,2.2,BUCKLE);
  }
  if(style==='satchel'||view.across>.17){
    seam(c,CENTER-chest*.48,y+7,[[cx,hip-10]],INK,5.7);
    seam(c,CENTER-chest*.48,y+7,[[cx,hip-10]],dark,3.9);
  }
  if(style==='satchel'){
    path(c,[cx-21,hip-17],[[cx+19,hip-22],[cx+22,hip+15],[cx-18,hip+20]],color,INK,2.35);
    path(c,[cx-21,hip-17],[[cx+19,hip-22],[cx+17,hip-1],[cx,hip+7],[cx-21,hip+1]],dark,INK,1.95);
    oval(c,cx,hip-1,3,3,BUCKLE,INK,.9);
  }
}

export function paintFigure(c,f,v,colors,clothes,hold){
  const {view,limbs,model}=f;
  const skin=model==='specter'?tint(colors.skin,'#79a285',.71):colors.skin;
  const rear=view.across<-.33;
  const outer=clothes.outerwear;
  const coat=outer==='raincoat'||outer==='trench';
  const [far,near]=limbs;
  oval(c,CENTER+view.depth*5,515,Math.max(42,f.pelvis*1.16),8,'#15192977');
  if(outer==='cape'&& !rear)shoulderCape(c,f,clothes,clothes.layerColor);
  trouser(c,f,far,clothes,clothes.bottomColor);
  trouser(c,f,near,clothes,clothes.bottomColor);
  if(clothes.bottoms==='dress'||clothes.bottoms==='pleats')
    skirt(c,f,clothes.bottomColor||'#a05752',clothes.bottoms);
  if(coat)shoulderCape(c,f,clothes,clothes.layerColor);
  arm(c,f,far,skin,clothes,armColor(f,clothes,colors));hold(far);
  const hue=torso(c,f,v,clothes,colors,skin);
  if(outer==='cape'&&rear)shoulderCape(c,f,clothes,clothes.layerColor);
  bag(c,f,clothes.back,clothes.bagColor);
  neckwear(c,f,clothes.neckwear,clothes.neckColor);
  arm(c,f,near,skin,clothes,hue);hold(near);
}
