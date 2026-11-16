import {INK,PAPER,oval,path,tint,glint} from './avatar-cel-art.mjs?v=workshop1';
import {expressionActing} from './avatar-expression-acting.mjs';

const warm='#936755';
const hairCuts={
  short:[17,0,0],wavy:[21,0,1],curly:[29,10,3],long:[18,53,1],spiky:[31,0,4],
  braids:[16,49,5],bun:[21,6,2],locs:[21,43,5],bob:[19,31,0],part:[23,0,0],
  crop:[12,0,0],shaved:[5,0,0],coils:[24,4,3],ponytail:[18,43,2],shag:[23,27,4],
  flip:[24,37,1],pompadour:[34,2,0],afro:[32,21,3],fringe:[19,5,0],feathered:[28,27,4]
};
const faceShapes={
  oval:[32,20,78],round:[35,26,73],long:[30,16,88],
  angular:[33,13,82],square:[35,30,78],heart:[33,15,73]
};
const noseLengths={button:12,straight:16,swoop:15,pointed:20,freckled:12};

function planes(c,hair,skin,frame,recipe){
  const {view}=frame;
  const rear=view.across<-.28;
  const dark=tint(hair,'#251f32',.62);
  const light=tint(hair,'#f1bb7b',.39);
  const style=recipe.style||'wavy';
  if(style==='bald'){
    if(rear){
      path(c,[-36,39],[[-38,2,-19,-8,0,-8],[22,-9,39,7,36,36],[36,63,28,73,0,77],
        [-18,76,-36,61,-36,39]],skin);
      path(c,[-32,35],[[-26,64,7,78,24,62],[9,72,-22,74,-32,54],[-32,35]],tint(skin,warm,.45),null);
    }
    return;
  }
  const [rise,length,edges]=hairCuts[style]||hairCuts.wavy;
  const offset=view.depth*7;
  let brim;
  if(edges===4)brim=[[-33,-rise+6],[-22,-rise-3],[-13,-rise+3],[0,-rise-7],[12,-rise-1],[28,-rise+3],[37,-7]];
  else if(edges===3)brim=[[-41,-9,-32,-rise,-24,-rise+4],[-23,-rise-4,-6,-rise-8,-2,-rise+1],
    [12,-rise-10,22,-rise-4,24,-rise+2],[40,-rise-4,46,-9,38,7]];
  else brim=[[-36,-rise+4,-17,-rise-5,1,-rise],[23,-rise-3,41,-rise+12,37,12]];
  c.save();
  c.translate(offset,0);
  const end=rear?63+length:33+length;
  const lock=edges===1||edges===4;
  path(c,[-36,18],[...brim,[38,31],[35,52,34,end-3,36,end],[25,end-2,27,end+9,17,end+7],
    [0,end+10,-15,end-3,-29,end+4],[-27,end-13,-41,52,-36,18]],hair,INK,2.6);
  path(c,[-33,31],[[-28,49,-36,end-5,-24,end],[7,end-14,25,end+6,35,end],
    [20,end-15,31,37,33,14],[9,42,-17,35,-33,31]],dark,null);
  path(c,[-29,-4],[[-11,-rise+1,15,-rise+3,29,-rise+11],[13,-rise+8,-9,0,-26,11]],light,null);
  if (style==='bun'||style==='ponytail'){
    oval(c,rear?9: -view.depth*33,style==='bun'?-16:26,style==='bun'?16:11,style==='bun'?17:26,hair,INK,2.3,view.depth*.24);
    path(c,[rear?0:-view.depth*38,style==='bun'?-27:20],[[rear?12:-view.depth*27,style==='bun'?-33:8]],null,light,2.3);
  }
  if(edges===5){
    for(const side of [-1,1]){
      const x=side*31;
      path(c,[x,21],[[x+side*2,53,x+side*13,76,x+side*6,98]],null,INK,11);
      path(c,[x,21],[[x+side*2,53,x+side*13,76,x+side*6,98]],null,hair,8);
      for(let y=36;y<94;y+=9)path(c,[x+side*3,y],[[x+side*8,y+4]],null,light,1.6);
      oval(c,x+side*7,94,5,2.6,'#d39a56',INK,1.2);
    }
  }
  if(rear||lock){
    for(const x of [-23,-9,9,23]){
      path(c,[x,-1],[[x+7,13,x+3,33],[x-2,48,x+3,end-3]],null,tint(hair,PAPER,.25),1.35);
    }
  }
  if (edges===3) for (const [x,y,r] of [[-24,-2,8],[-9,-12,7],[10,-13,8],[28,-4,7]]) {
    path(c,[x-r,y],[[x-r,y-r,x+r,y-r,x+r,y],[x+r,y+r,x-1,y+r,x-1,y+1]],null,light,1.9);
  }
  c.restore();
}

function lips(c,x,y,v,skin){
  const expression=v.expression;
  const asleep=expression==='determined'||expression==='calm';
  const lift=expression==='smirk'?5:expression==='grin'||expression==='laugh'?0:2;
  const width=expression==='grin'||expression==='laugh'?31:24;
  if(expression==='curious'){
    oval(c,x+2,y+4,4.5,6,'#542b32',INK,1.65,-.18);
    path(c,[x+1,y+7],[[x+5,y+6]],null,'#d87768',1.25);
  }else if(asleep||expression==='smirk'){
    path(c,[x-width/2,y+lift],[[x-4,y+2,x+7,y+3,x+width/2,y-1]],
      null,INK,expression==='determined'?2.4:2.05);
  }else{
    const open=expression==='laugh'?13:expression==='grin'?8:5;
    path(c,[x-width/2,y],[[x-3,y+5,x+9,y+5,x+width/2,y-2],
      [x+11,y+open,x,y+open+3,x-width/2,y]],'#6f3940',INK,1.7);
    path(c,[x-width*.3,y+1],[[x+1,y+6,x+width*.32,y+1]],null,PAPER,2.8);
  }
  if(v.cheeks==='dimples')path(c,[x+width*.62,y-1],[[x+width*.68,y-1,x+width*.6,y+4]],null,tint(skin,warm,.7),1.4);
}

function eyebrow(c,x,y,v,offset){
  const arch={soft:-2,straight:0,bold:-3,arching:-6}[v.brows]??-2;
  path(c,[x-7,y+2],[[x-2,y+arch,x+5,y+offset]],null,INK,v.brows==='bold'?3.6:2.25);
}

function eye(c,x,y,iris,v,width=10,face=0){
  const mood=expressionActing(v.expression);
  const side=face>0?1:0;
  const base={classic:5,round:8,almond:4,wide:7,sleepy:2,dramatic:5.5}[v.eye_shape]||5;
  const lift=Math.max(1.9,base*mood.eyes[side]);
  eyebrow(c,x,y-10+mood.brows[side],v,mood.browEnd[side]);
  if(v.expression==='wink'&&face===1){
    path(c,[x-width,y+1],[[x,y-4,x+width,y]],null,INK,2.3);
    path(c,[x-width+2,y+4],[[x,y+6,x+width-2,y+3]],null,tint(iris,INK,.65),1.25);
    return;
  }
  if(v.expression==='laugh'){
    // Fully inked crescent eye, not a scaled-down spherical pupil.
    path(c,[x-width,y+1],[[x-3,y-lift-3,x+5,y-lift-3,x+width,y]],null,INK,2.65);
    path(c,[x-width+2,y+3],[[x-2,y+lift*.38,x+4,y+lift*.38,x+width-2,y+1]],null,tint(iris,INK,.6),1.3);
    return;
  }
  path(c,[x-width,y+1],[[x-4,y-lift-2,x+2,y-lift-4,x+width,y-1],
    [x+3,y+lift,x-4,y+lift+1,x-width,y+1]],PAPER,INK,1.7);
  const offset=width*.23+face*.45+mood.gaze[side]*.72;
  const pupilX=Math.min(x+width-3,Math.max(x-width+3,x+offset));
  oval(c,pupilX,y-.5,Math.min(width*.44,3.5),Math.min(lift*.79,4.85),iris,INK,.85);
  oval(c,pupilX+.5,y-.45,Math.min(width*.27,2.35),Math.min(lift*.66,3.8),INK);
  if(lift>3)oval(c,pupilX-.73,y-2.45,.76,.77,PAPER);
  if(v.expression==='calm'||v.eye_shape==='sleepy'){
    // Upper lid and warm cheek-shadow carry the relaxed expression.
    path(c,[x-width,y-4],[[x-3,y-lift*.35,x+5,y-lift*.52,x+width,y-4]],
      tint(iris,PAPER,.05),INK,2);
  }
  if(v.expression==='determined'){
    path(c,[x-width+1,y+lift*.91],[[x,y+lift*.61,x+width-1,y+lift*.91]],
      null,INK,1.8);
  }
}

function facialHair(c,v,x,y,jaw,end,hair,skin,profile){
  if(v.beard==='none')return;
  const beard=tint(hair,'#392a39',.29);
  const trim=tint(hair,PAPER,.29);
  if(v.beard==='moustache'){
    path(c,[x-13,y-4],[[x-8,y-10,x-3,y-8,x,y-6],[x+5,y-12,x+10,y-9,x+14,y-5],
      [x+7,y-1,x+3,y-4,x,y-4],[x-5,y-1,x-10,y-1,x-13,y-4]],beard,INK,1.25);
    return;
  }
  const span=v.beard==='goatee'?13:jaw;
  if(v.beard==='stubble'){
    for(let n=0;n<29;n++){
      const yy=y+3+(n*13)%Math.max(4,end-y-2),xx=x+((n*43)%29-14)*Math.max(.47,1-(yy-y)/(end-y+20));
      path(c,[xx,yy],[[xx-.45,yy+1.15]],null,tint(skin,hair,.66),1.06);
    }
    return;
  }
  if(profile){
    path(c,[-31,y-8],[[-22,y-3,-14,y+7,-5,y+7],[8,y+9,16,y+4,22,y+4],
      [19,end+4,2,end+8,-7,end+1],[-23,end-2,-29,y+5,-31,y-8]],beard,INK,1.65);
  }else{
    path(c,[x-span,y-6],[[x-span*.4,y+1,x-7,y+6,x,y+6],[x+9,y+6,x+span*.76,y+1,x+span,y-7],
      [x+span*.93,end+2,x+10,end+6,x,end+5],[x-12,end+6,x-span*.9,end-2,x-span,y-6]],beard,INK,1.7);
  }
  path(c,[x-8,end-1],[[x+2,end+2,x+9,end-2]],null,trim,1.45);
}

function fullFace(c,v,skin,hair,iris,frame){
  const turn=frame.view.depth;
  const [width,jaw,end]=faceShapes[v.face]||faceShapes.oval;
  const tilt=turn*12;
  const shadow=tint(skin,warm,.49);
  const glow=tint(skin,'#ffdfae',.33);
  for(const side of [-1,1]){
    const dx=side*(width-2)+tilt*.27;
    oval(c,dx,40,8,13,side*turn<0?skin:shadow,INK,2.05,side*.22);
    path(c,[dx-2,36],[[dx+2,35,dx+2,42]],null,tint(shadow,INK,.4),1.55);
  }
  path(c,[-width+tilt*.5,33],[[-width-2,-1,-20,-10,tilt,-10],[width-7+tilt,-11,width+tilt,8,width+tilt*.64,28],
    [width-2+tilt,41,width-5+tilt,53,jaw+tilt,64],[jaw*.9+tilt,end-3,10+tilt,end+2,tilt,end],
    [-jaw+tilt,end-3,-width+2+tilt*.6,54,-width+tilt*.5,33]],skin,INK,2.45);
  path(c,[-width+tilt*.55,31],[[-width+2+tilt,5,-20+tilt,-4],[-24+tilt,27,-23+tilt,50],[-12+tilt,70,tilt+5,end-2],
    [-19+tilt,end-5,-width+tilt*.5,43,-width+tilt*.55,31]],shadow,null);
  path(c,[tilt-7,15],[[tilt+10,5,tilt+19,14],[tilt+14,21,tilt-7,15]],glow,null);
  const nose=tilt+4,length=noseLengths[v.nose]||12;
  const cheekx=tilt+17;
  if(v.cheeks==='rosy'||v.cheeks==='freckles'||v.accessory==='freckles'||v.nose==='freckled'){
    oval(c,cheekx,48,8.1,2.7,tint(skin,'#d56251',.37),null,2,-.2);
    if(v.cheeks==='freckles'||v.accessory==='freckles'||v.nose==='freckled')for(const [dx,dy] of [[-4,0],[1,1],[5,-1],[-24,2],[-18,0]])
      oval(c,cheekx+dx,47+dy,.87,.87,tint(shadow,INK,.5));
  }
  const mouthY=Math.max(59,end-17);
  facialHair(c,v,nose,mouthY,jaw,end,hair,skin,false);
  eye(c,tilt-14,32,iris,v,9-2*Math.max(0,turn),-1);
  eye(c,tilt+16,30,iris,v,8.6-2*Math.max(0,-turn),1);
  path(c,[nose-1,33],[[nose-3,37+length*.3,nose+4,35+length],[nose+7,36+length,nose+7,39+length,nose,40+length]],
    null,tint(shadow,INK,.66),1.75);
  lips(c,nose,mouthY,v,skin);
}

function profileFace(c,v,skin,hair,iris,frame){
  const turn=Math.sign(frame.view.depth)||1;
  const [width,jaw,end]=faceShapes[v.face]||faceShapes.oval;
  const length=noseLengths[v.nose]||12;
  const shadow=tint(skin,warm,.42);
  c.save();
  c.scale(turn,1);
  const noseX=31+length,tipY=35+length*.56;
  path(c,[-37,34],[[-42,8,-24,-9,-5,-10],[21,-13,width,6,width,24],[width-2,32,noseX,tipY],
    [noseX+1,tipY+4,width-2,tipY+5],[width-3,tipY+9,width+2,tipY+12],[width,tipY+15,width-7,tipY+15],
    [width-7,end-6,jaw*.3,end],[-18,end-2,-31,64,-37,34 ]],skin,INK,2.45);
  c.save();c.clip();
  path(c,[-36,29],[[-30,48,-18,57,-10,65],[0,end-4,13,end-4],[-8,end-1,-22,71,-30,58],
    [-40,40,-36,29]],shadow,null);
  oval(c,-17,43,9,13,shadow,INK,1.85);
  path(c,[-19,38],[[-13,36,-14,44]],null,tint(shadow,INK,.45),1.65);
  const mouthY=tipY+13;
  facialHair(c,v,width-10,mouthY,jaw,end,hair,skin,true);
  if(frame.view.across>-.23){
    eye(c,width-14,31,iris,v,7.5,0);
    const x=width-15;
    if(v.expression==='grin'||v.expression==='laugh'||v.expression==='smile'){
      const depth=v.expression==='laugh'?8:v.expression==='grin'?5:3;
      path(c,[x-6,mouthY],[[x+2,mouthY+3,x+10,mouthY-2],
        [x+7,mouthY+depth,x-2,mouthY+depth,x-6,mouthY]],'#6f3940',INK,1.6);
      path(c,[x-2,mouthY+1],[[x+3,mouthY+2,x+7,mouthY]],null,PAPER,1.95);
    }else if(v.expression==='curious')oval(c,x+5,mouthY+2,3,4,'#673a40',INK,1.2);
    else path(c,[x-5,mouthY+1],[[x+3,mouthY+3,x+9,mouthY]],null,INK,1.8);
    if(v.cheeks==='rosy'||v.cheeks==='freckles')
      oval(c,width-15,49,6,2.4,tint(skin,'#d46557',.4),null,1,-.2);
  }
  c.restore();c.restore();
}

function bangs(c,v,color,frame){
  if(v.style==='bald'||v.style==='shaved'||frame.view.across<-.26)return;
  const turn=frame.view.depth;
  const name=v.style;
  const high=name==='pompadour'?-29:name==='crop'?-13:-18;
  const spot=frame.view.at(17,24);
  const light=tint(color,PAPER,.4);
  const cover=name==='fringe'?24:name==='part'?13:name==='shag'?18:9;
  path(c,[-36,31],[[-35,-1,-24,high,-9,high+2],[20,high-11,40,high+6,38,21],
    [25+spot*.26,12,21+spot*.46,cover-2],[18+spot*.4,cover+7,4+spot*.7,cover],
    [-4+spot,cover+10,-18,cover+9],[-23,17,-27,31,-36,31]],color,INK,2.35);
  path(c,[-30,1],[[-21,high+4,4,high+3,21,high+4],[-1,high+5,-9,4,-30,9]],light,null);
  if(['shag','spiky','feathered','wavy','long'].includes(name))
    path(c,[spot-13,cover-2],[[spot-4,cover-4,spot+8,cover-12]],null,tint(color,INK,.48),1.55);
  if(Math.abs(turn)>.55)path(c,[-30*turn,11],[[-27*turn,39,-31*turn,47]],null,color,5);
}

function frames(c,kind,v,frame){
  if(kind==='none'&&v.accessory!=='glasses')return;
  const shift=frame.view.depth*12;
  const wide=kind==='aviator'||kind==='retro-square';
  const front=frame.view.across;
  const profile=front<=.54;
  const sign=Math.sign(frame.view.depth)||1;
  const x=sign*(profile?22:11)+shift*.4;
  const color=kind==='aviator'?'#ab7847':INK;
  if(front>-.26){
    for(const at of (profile?[x]:[shift-14,shift+16])){
      if(kind==='square'||kind==='retro-square'||kind==='cat-eye')path(c,[at-12,23],[[at+13,kind==='cat-eye'?20:23],[at+10,39],
        [at-7,42,at-12,35],[at-12,23]],'#c9d5bf28',color,wide?3:2.7);
      else oval(c,at,32,wide?13:11,kind==='oval'?7:9,'#d8dfb928',color,2.65,-.14);
      path(c,[at-6,27],[[at-2,25]],null,'#f7eadc',1.25);
    }
    if(!profile)path(c,[shift-3,29],[[shift,24,shift+5,28]],null,color,2.6);
  }
  path(c,[x-sign*8,29],[[x-sign*25,29,x-sign*37,36]],null,color,2.5);
}

function hat(c,v,frame){
  const side=frame.view.depth;
  const tilt=side*6;
  if(v.hat==='western'){
    path(c,[-55,3],[[-64,-3,-56,-17,-43,-5],[-38,-7,-33,-6],[-31,-33,-24,-43,-9,-33],
      [0,-27,17,-41,25,-39],[36,-30,38,-9], [52+tilt,-13,61,-17,58,-4],[55,12,7,12,-23,12],
      [-40,13,-51,10,-55,3]],'#a76035',INK,2.8);
    path(c,[-27,-8],[[0,-5,25,-8,36,-13]],null,'#6c3e32',6);
    path(c,[-49,1],[[-40,8,-19,7]],null,'#e5ac68',2);
  }else if(v.hat==='cap'){
    path(c,[-38,11],[[-44,-16,-26,-32,2,-34],[28,-33,44,-9,42,10],[13,19,-9,20,-38,11]],'#396473',INK,2.8);
    const front=frame.view.across;
    if(front>-.85)path(c,[-25+tilt,10],[[15+tilt,9,35+tilt,4],[68*side+22*front,11,46*side+13*front,20],
      [32+tilt,21,-14+tilt,19,-25+tilt,10]],'#284756',INK,2.25);
    path(c,[-12,-27],[[1,-21,7,-5,8,7]],null,'#8db2b4',1.65);
  }else if(v.hat==='beanie'){
    path(c,[-39,8],[[-41,-17,-18,-38,2,-37],[25,-39,43,-18,44,8],[22,19,-17,22,-39,8]],'#96454c',INK,2.65);
    path(c,[-38,0],[[1,10,41,-1],[44,9],[2,21,-37,12]],'#6e3645',INK,2);
    oval(c,2,-39,8,7,'#daa172',INK,2);
    for(let x=-30;x<37;x+=8)path(c,[x,5],[[x+1,12]],null,'#cc8a6c',1.25);
  }else if(v.hat==='beret'){
    path(c,[-42,7],[[-52,-6,-30,-27,5,-28],[37,-31,58,-13,51,4],[40,20,-26,20,-42,7]],'#92433f',INK,2.6);
    path(c,[-29,9],[[9,13,35,9]],null,'#cb8260',2);
    path(c,[10,-23],[[12,-32,16,-34]],null,INK,3.6);
  }
}

function machineHead(c,v,frame,color,faceLight,hood){
  const {view,model}=frame,front=view.across;
  const x=view.depth*11;
  const curved=model==='scout'||model==='armor';
  const metal=tint(color,'#a2aebe',.42);
  const edge=tint(metal,'#272c42',.58);
  const bright=tint(metal,'#f1dfb5',.6);
  if(model==='scout'){
    path(c,[-8,-18],[[-8,-39]],null,INK,4);
    oval(c,-8,-42,6,6,'#d5a45a',INK,2);
  }
  if(hood)path(c,[-49,68],[[-57,26,-45,0,-19,-21],[4,-38,45,-12,49,18],[55,38,43,56,53,73],
    [10,91,-32,88,-49,68]],tint(color,'#252c46',.39),INK,3);
  if(curved){
    path(c,[-39,29],[[-35,-12,-13,-21,5,-16],[32,-16,48,7,44,34],[40,56,24,72,0,71],
      [-23,74,-43,59,-39,29]],hood?'#535c6d':metal,INK,3.2);
    path(c,[-29,9],[[-17,-11,8,-11,25,-2],[10,-5,-10,2,-29,16]],bright,null);
  }else{
    path(c,[-40,5],[[-22,-11],[28,-10],[43,3],[43,50],[22,69],[-24,69],[-43,49],[-40,5]],metal,INK,3.2);
    path(c,[-38,6],[[-19,-7],[31,-5],[39,4],[21,12],[-27,15],[-38,6]],bright,null);
    path(c,[25,13],[[43,4],[43,48],[23,67],[19,56]],edge,null);
  }
  for(const side of [-1,1]) oval(c,side*38+view.depth*3,33,6.5,13,edge,INK,2.1);
  const visorCenter=x*2;
  if(front>-.39){
    const w=17+Math.max(0,front)*17;
    const fill=hood?'#272438':'#302d43';
    path(c,[visorCenter-w,23],[[visorCenter+w,18],[visorCenter+w,43],[visorCenter-w+4,47]],fill,INK,2.3);
    const colors=hood?'#e8ad68':tint(faceLight,'#ffedb1',.58);
    for(const dx of (front>.63?[-13,13]:[Math.sign(view.depth)*6])){
      const round=v.expression==='determined'?2.9:v.expression==='curious'?5.6:4.3;
      oval(c,visorCenter+dx,32,hood?3:5,round,colors,INK,1.25);
      oval(c,visorCenter+dx-1,31,.9,.95,PAPER);
    }
    if(!hood)for(let i=-2;i<=2;i++)path(c,[x+i*5,54],[[x+i*5,59]],null,edge,2);
  }else{
    path(c,[-23+x*.5,22],[[22+x*.5,22],[20+x*.5,52],[-22+x*.5,55]],edge,INK,2.2);
    for(let i=0;i<3;i++)path(c,[-15+i*11+x*.5,30],[[-15+i*11+x*.5,44]],null,bright,1.7);
  }
}

export function paintHead(c,frame,v,colors,stamp){
  const {view,design}=frame;
  const skin=frame.model==='specter'?tint(colors.skin,'#79a285',.71):colors.skin;
  const machine=design.family==='robot'||frame.model==='armor';
  c.save();
  c.translate(frame.head.x,frame.head.y);
  c.rotate(v.pose==='tilt'?.08*view.across:0);
  c.scale(design.scale,design.scale);
  if(machine){
    machineHead(c,v,frame,colors.shirt,colors.eyes,frame.model==='armor');
  }else{
    const hood=frame.model==='specter';
    if(hood)path(c,[-46,62],[[-56,14,-39,-15,-9,-31],[16,-37,37,-12,43,14],
      [47,31,40,56,49,72],[9,94,-30,88,-46,62]],'#576c61',INK,2.9);
    if(view.across<-.29){
      planes(c,colors.hair,skin,frame,v);
      const near= Math.sign(view.depth)*-32;
      if(!hood&&Math.abs(view.depth)>.18)oval(c,near,45,6,10,tint(skin,warm,.26),INK,1.5);
    }else{
      planes(c,colors.hair,skin,frame,v);
      if(view.across>.56)fullFace(c,v,skin,colors.hair,colors.eyes,frame);
      else profileFace(c,v,skin,colors.hair,colors.eyes,frame);
      bangs(c,v,colors.hair,frame);
      if(hood)path(c,[-46,60],[[-54,11,-27,-18,-6,-24],[21,-28,40,6,44,28]],
        null,'#35484a',4);
    }
    if(v.accessory==='earrings'&&view.across>-.73)oval(c,-35+view.depth*11,50,3.5,5.5,null,'#ddb160',2);
    if(v.accessory==='headphones'){
      path(c,[-36,38],[[-53,-14,0,-26,24,-14],[41,-4,45,16,40,31]],null,INK,4.6);
      oval(c,frame.view.depth*-22,38,9,12,'#715572',INK,2);
    }
  }
  stamp('hair',c,0,12,86,view.across);
  stamp('eyes',c,0,36,69,view.across);
  if(!stamp('eyewear',c,0,31,72,view.across)&&!machine)frames(c,v.glasses,v,frame);
  if(!stamp('hat',c,0,2,99,view.across)){
    hat(c,v,frame);
    if(v.hat==='none'&&v.accessory==='crown'){
      path(c,[-35,-11],[[-39,-37],[-20,-26],[-10,-39],[4,-27],[24,-36],[33,-12],[0,-4]],'#d9a24f',INK,2);
      glint(c,0,-19,4,PAPER);
    }
  }
  c.restore();
}
