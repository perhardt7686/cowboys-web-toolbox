import {THREE,attach,band,box,group,hash,join,medallion,oval,shade,shell,stroke,surface} from './avatar-studio-geometry.mjs?v=workshop1';

const HEAD_SHAPES={
  oval:[1,1,1], angular:[.98,1.065,1.08], round:[1.09,.94,.92],
  square:[1.07,.98,1.18], long:[.91,1.13,.93], heart:[1.03,.98,.79]
};
const HAIR_FORM={
  short:'sweep',wavy:'sweep',curly:'curls',long:'flow',spiky:'quiff',bald:'none',
  braids:'braids',bun:'bun',locs:'locks',bob:'bob',part:'part',crop:'crop',shaved:'crop',
  coils:'curls',ponytail:'pony',shag:'flow',flip:'bob',pompadour:'quiff',afro:'curls',
  fringe:'fringe',feathered:'flow'
};

function makeScalp(head,hair,shine,style,key){
  if(style==='none')return;
  const curly=style==='curls';
  const radius=style==='crop'?1.022:curly?1.095:1.076;
  const mesh=shell(head,hair,Array.from({length:14},(_,i)=>{
    const phi=.005+i*.16;
    return [phi,.237,.212,0,-.008];
  }),{segments:48,warp([x,phi,z],angle){
    const front=Math.max(0,Math.cos(angle));
    const drape=['flow','bob','braids','locks','pony'].includes(style)?.37:0;
    const hairline=1.94-front*(style==='fringe'?.57:.90)+drape*(1-front);
    const arc=phi/2.09*hairline;
    const crest=Math.sin(angle*3-1)*.007*Math.sin(arc);
    return [x*Math.sin(arc)*radius,.0315+Math.cos(arc)*.272*radius+crest,z*Math.sin(arc)*radius];
  }});
  // Cross sections run from crown to nape.
  mesh.material.side=THREE.DoubleSide;
  if(style==='crop'){
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2;
      oval(head,shine,.225*Math.sin(a),.054+.025*Math.cos(a),.201*Math.cos(a),.006,.010,.006);
    }
  }else if(curly){
    const scatter=hash(key)%7;
    for(let row=0;row<4;row++){
      const latitude=.25+row*.36;
      for(let i=0;i<10;i++){
        const angle=i/10*Math.PI*2+row*.32;
        if(row===3&&Math.cos(angle)>.5)continue;
        const fullness=key==='afro'?1.25:1;
        const curl=.036+((i+row+scatter)%4)*.006;
        oval(head,(i+row)%3===0?shine:hair,.229*Math.sin(latitude)*Math.sin(angle),
          .046+.247*Math.cos(latitude),.202*Math.sin(latitude)*Math.cos(angle)-.015,curl*fullness,curl*fullness,curl);
      }
    }
  }else{
    const broad=style==='quiff'?.105:style==='fringe'?.076:.064;
    const sweep=style==='part'?.125:style==='fringe'?.016:.084;
    for(let i=0;i<(style==='fringe'?6:4);i++){
      const x=-.138+i*.058,u=i*.012;
      const lock=oval(head,i%3===0?shine:hair,x+sweep*(i%2?.30:0),.179+u,.164+i*.01,
        broad,style==='quiff'?.105:.071,.049);
      lock.rotation.z=style==='fringe'?.15:-.64;
      lock.rotation.y=.12-i*.105;
    }
    stroke(head,shine,[[-.16,.195,.184],[-.091,.239,.161],[.031,.256,.134],[.106,.227,.132]],.008);
    const crease=surface(shade(hair.color,.45));
    stroke(head,crease,[[-.145,.183,.212],[-.108,.209,.218],[-.075,.230,.205],[-.061,.241,.180]],.0035);
  }
  if(['flow','bob','braids','locks'].includes(style)){
    for(const side of [-1,1]){
      const length=style==='bob'?.25:style==='braids'?.47:.40;
      if(style==='braids'||style==='locks'){
        for(let j=0;j<(style==='locks'?4:2);j++){
          const x=side*(.155+.035*j),z=.035-.049*j;
          for(let i=0;i<6;i++){
            const knot=oval(head,i%3===1?shine:hair,x+Math.cos(i*1.8)*.013,
              -.051-i*length/6,z,.032-i*.001,.050,.031);
            knot.rotation.z=side*Math.sin(i*1.3)*.5;
          }
        }
      }else{
        const panel=oval(head,hair,side*.17,-.067-length*.20,-.062,.086,length*.63,.132);
        panel.rotation.z=side*(key==='flip'?.31:-.16);
        stroke(head,shine,[[side*.21,.047,.036],[side*.22,-.102,.013],
          [side*.183,-length*.61,-.04]],.011);
      }
    }
  }
  if(style==='bun'||style==='pony'){
    oval(head,hair,-.031,.169,-.207,.122,.109,.108);
    if(style==='pony')oval(head,hair,-.058,-.100,-.244,.105,.195,.083).rotation.x=.28;
    stroke(head,shine,[[-.105,.17,-.272],[-.044,.232,-.292],[.038,.174,-.278]],.008);
  }
}

function skinMesh(parent,tone,shape){
  const [w,h,jaw]=shape;
  return shell(parent,tone,[
    [-.278*h,.037,.065,0,.033],[-.262*h,.116*jaw*w,.104,0,.044],
    [-.207*h,.159*jaw*w,.141,0,.027],[-.155*h,.188*jaw*w,.163,0,.016],
    [-.08*h,.218*w,.181],[-.015*h,.229*w,.191],
    [.051*h,.229*w,.192],[.12*h,.224*w,.186],
    [.186*h,.197*w,.156,0,-.008],[.242*h,.136*w,.109,0,-.012],
    [.276*h,.065*w,.06,0,-.019],[.29*h,.001,.001,0,-.026]
  ],{segments:48,warp([x,y,z],angle){
    const cheek=Math.exp(-(((y+.073)/.04)**2))*.014*Math.max(0,Math.cos(angle*2-.10));
    const orbit=Math.exp(-(((y-.010)/.036)**2))*.012*Math.max(0,Math.sin(Math.abs(angle)*3));
    return [x,y,z+Math.max(0,Math.cos(angle))*(cheek-orbit)];
  }});
}

// Expression decisions are pure: the same saved recipe always gives the same face.
export function cartoonFaceExpression(v){
  const expression=v?.expression||'smile';
  const eyes=v?.eye_shape||'classic';
  const sizes={wide:[.073,.047],round:[.073,.052],almond:[.078,.037],
    sleepy:[.071,.029],dramatic:[.078,.044],classic:[.071,.042]};
  const [width,height]=sizes[eyes]||sizes.classic;
  const mood={
    smile:{mouth:'smile',lift:.014,brow:.004,pupil:0},
    grin:{mouth:'grin',lift:.022,brow:.009,pupil:0},
    smirk:{mouth:'smirk',lift:.010,brow:.018,pupil:.009},
    calm:{mouth:'calm',lift:0,brow:0,pupil:0},
    determined:{mouth:'determined',lift:-.016,brow:-.014,pupil:0},
    curious:{mouth:'curious',lift:.006,brow:.023,pupil:.013},
    wink:{mouth:'smile',lift:.013,brow:.011,pupil:0},
    laugh:{mouth:'laugh',lift:.021,brow:.016,pupil:0}
  }[expression]||{mouth:'smile',lift:.012,brow:0,pupil:0};
  return {...mood,eyes,width,height,wink:expression==='wink',squint:expression==='laugh'?.82:1};
}

function facePlanes(head,v,palette,w,h,jaw,specter){
  const shadow=surface(shade(palette.skin,specter?.62:.77));
  const light=surface(shade(palette.skin,1.17));
  const ink=surface(shade(palette.skin,.48));
  for(const side of [-1,1]){
    // Flat color blocks tuck behind the eyes and outline the cheek and jaw.
    const cheek=oval(head,shadow,side*.158*w,-.092*h,.128,.037,.068,.020);
    cheek.rotation.z=side*-.22;
    const highlight=oval(head,light,side*.111*w,.104*h,.159,.039,.013,.007);
    highlight.rotation.z=-side*.32;
    stroke(head,ink,[[side*.175*w,-.113*h,.142],
      [side*.147*w,-.174*h,.139],[side*.092*jaw*w,-.224*h,.107]],.0046,16);
  }
  stroke(head,ink,[[-.052*jaw*w,-.247*h,.099],[0,-.268*h,.078],
    [.052*jaw*w,-.247*h,.099]],.0046,14);
}

// Eye layers are cel-thin and nearly follow the face surface. The original stack
// projected ~0.04 units ahead of the socket and looked like loose globes in profile.
// Keep color/pupil readability while limiting the forward depth on every head shape.
function browsAndEyes(head,v,palette,w,spacing){
  const faceInk=surface('#2c2232'),ivory=surface('#fff3dc');
  const eyeColor=surface(palette.eye),glint=surface('#fffdf2');
  const pupil=surface('#251b27');
  const brow=surface(shade(palette.hair,.46));
  const shadow=surface(shade(palette.skin,.67));
  const skin=surface(palette.skin);
  const expression=cartoonFaceExpression(v);
  for(const side of [-1,1]){
    const x=side*(.100+spacing*.010)*w;
    const eye=group(head,x,.014,.173);
    eye.userData.studioEye=true; // Testable fitted cel layer, not a floating spherical eyeball.
    eye.rotation.y=side*.225;
    const asymmetry=expression.mouth==='curious'&&side===1?.012:0;
    const sleepy=expression.eyes==='sleepy';
    if(expression.wink&&side===1){
      stroke(eye,faceInk,[[-.053,-.004,.012],[-.016,-.014,.021],
        [.022,-.012,.024],[.051,.003,.012]],.0073,16);
      stroke(eye,skin,[[-.049,-.027,.009],[0,-.027,.019],[.045,-.023,.008]],.0045,12);
    }else{
      const ew=expression.width*.92,eh=expression.height*expression.squint*.87;
      // A pronounced ink lid gives facial expressions definition at thumbnail scale.
      oval(eye,faceInk,0,-.002,.001,ew+.008,eh+.010,.008);
      oval(eye,ivory,0,0,.009,ew,eh,.005);
      const look=expression.pupil*(side===1?1:.55);
      oval(eye,eyeColor,look-.006,-.004,.016,.022,eh*.75,.004);
      oval(eye,pupil,look-.008,-.004,.021,.013,eh*.58,.003);
      oval(eye,glint,look-.017,.012,.025,.007,.007,.002);
      if(sleepy){
        oval(eye,skin,0,eh*.76,.018,ew+.009,eh*.46,.007);
        stroke(eye,shadow,[[-ew,eh*.60,.013],[0,eh*.70,.021],[ew,eh*.56,.013]],.0055);
      }else{
        stroke(eye,faceInk,[[-ew-.005,.004,.010],[-ew*.52,eh*.94,.013],
          [0,eh*1.06,.015],[ew*.64,eh*.94,.013],[ew+.004,.002,.010]],.0078,18);
        if(expression.eyes==='dramatic'){
          for(let i=0;i<3;i++)stroke(eye,faceInk,[
            [ew*.66+i*.009,eh*.74-i*.005,.015],
            [ew*.93+i*.014,eh*(1.52-i*.10),.014]],.0043,9);
        }
      }
      stroke(eye,shadow,[[-ew*.64,-eh*.94,.008],
        [0,-eh*1.06,.013],[ew*.62,-eh*.89,.008]],.0035);
    }
    const brows=expression.brow+(v.brows==='arching'?.013:0);
    const height=.071+asymmetry+(v.brows==='bold'?.004:0);
    const pitch=expression.mouth==='determined'?-side*.024:side*brows*.5;
    stroke(eye,brow,[[-.061,height+pitch*.8,-.003],
      [-.023,height+.010+pitch,.016],[.034,height+brows*.5-pitch,.010],
      [.062,height-.008-pitch*.7,-.007]],v.brows==='bold'?.012:.0094,20);
  }
}

function noseAndMouth(head,v,tone,palette){
  const expression=cartoonFaceExpression(v);
  const bridge={straight:.054,pointed:.041,swoop:.032,button:.019,freckled:.028}[v.nose]??.042;
  const length=v.nose==='pointed'?.287:v.nose==='swoop'?.266:.253;
  const width=v.nose==='button'?.052:v.nose==='pointed'?.037:.043;
  const outline=surface(shade(palette.skin,.46));
  const noseShade=surface(shade(palette.skin,.79));
  shell(head,tone,[
    [-.100,.011,.007,0,.191],[-.094,width*.82,.030,0,.212],
    [-.077,width,(length-.195)*.50,.002,(length+.195)*.50],
    [-.053,width*.88,.029,0,length-.053],
    [-.021,width*.72,.023,0,.181],[bridge,.011,.008,0,.169]
  ],{segments:30});
  const tip=oval(head,noseShade,.013,-.080,length-.015,width*.51,.017,.012);
  tip.rotation.z=-.26;
  stroke(head,outline,[[.022,-.069,length-.005],[.036,-.084,length-.013],
    [.019,-.095,length-.015],[.002,-.093,length-.018]],.0047,14);
  if(v.nose==='swoop')stroke(head,outline,[[-.027,-.040,.217],
    [-.011,-.071,.246],[.024,-.078,length-.017]],.0045,12);
  const mouthInk=surface('#49303b'),lip=surface(shade(palette.skin,.63));
  const tooth=surface('#fff0dc'),tongue=surface('#c8787e');
  const smile=expression.mouth;
  const l=expression.lift;
  const left=[-.071,-.151+l,.167],right=[.070,-.151+(smile==='smirk'?-.009:l),.167];
  if(smile==='grin'||smile==='laugh'){
    oval(head,mouthInk,0,-.154,.172,.068,smile==='laugh'?.041:.027,.017);
    oval(head,tooth,0,-.142,.186,.056,.011,.007);
    if(smile==='laugh')oval(head,tongue,0,-.181,.187,.037,.009,.007);
    for(const side of [-1,1])stroke(head,mouthInk,[[side*.063,-.132,.173],
      [side*.074,-.149,.164]],.0042,10);
  }else if(smile==='determined'){
    stroke(head,mouthInk,[[-.067,-.159,.168],[-.019,-.166,.191],
      [.026,-.166,.191],[.069,-.160,.165]],.007,18);
    stroke(head,lip,[[-.048,-.177,.164],[0,-.181,.182],
      [.047,-.177,.164]],.004,14);
  }else{
    const middle=smile==='curious'?-.159:smile==='smirk'?-.150:-.158;
    stroke(head,mouthInk,[left,[-.030,middle,.183],
      [0,middle-.002,.194],[.034,middle,.184],right],.0057,19);
    if(smile!=='calm')for(const side of [-1,1]){
      stroke(head,lip,[[side*.070,-.151+l,.165],
        [side*.078,-.158+l,.159]],.0044,9);
    }
  }
  stroke(head,lip,[[-.036,-.195,.150],[0,-.202,.166],
    [.036,-.195,.150]],.0037,14);
}

// Model the beard against the same six jaw cross-sections used for its ink.
// The former hard-coded strokes projected off the hair surface at side angles;
// the upper front ring also folded below the preceding ring near the mouth.
export function beardJawSections(width=1,jaw=1){
  return [
    [-.286,.070,.070,0,.049],
    [-.278,.123*jaw*width,.112,0,.050],
    [-.249,.151*jaw*width,.139,0,.041],
    [-.218,.174*jaw*width,.148,0,.033],
    [-.179,.194*width,.158,0,.028],
    [-.135,.210*width,.172,0,.018]
  ];
}
export function beardJawPoint(rings,index,angle,offset=0){
  const [height,width,depth,cx=0,cz=0]=rings[index];
  // A narrow lowered lip lets the mouth stay visible without folding the
  // upper beard ring into the lower one, including at strict profile.
  const cheekRise=Math.pow(Math.abs(Math.sin(angle)),2.3)*index*.014;
  const mouthClearance=index===rings.length-1
    ?.042*Math.pow(Math.max(0,Math.cos(angle)),3):0;
  return [cx+width*Math.sin(angle),
    height+cheekRise-mouthClearance,
    cz+depth*Math.cos(angle)+offset];
}

function introduceBeard(head,v,palette,w,jaw){
  if(v.beard==='none')return;
  const hair=surface(shade(palette.hair,v.beard==='stubble'?1.24:.81));
  const light=surface(shade(palette.hair,1.18));
  const edge=surface(shade(palette.hair,.48));
  if(v.beard==='moustache'||v.beard==='beard'){
    for(const s of [-1,1]){
      const lip=oval(head,hair,s*.032,-.119,.202,.050,.016,.016);
      lip.rotation.z=s*-.26;
      stroke(head,light,[[s*.003,-.111,.216],[s*.038,-.111,.213],[s*.064,-.125,.193]],.003);
    }
    if(v.beard==='moustache')return;
  }
  if(v.beard==='stubble'){
    for(let i=0;i<44;i++){
      const a=(i*2.399)%6.283-3.14;
      if(Math.abs(a)>1.38)continue;
      const y=-.181-((i*79)%61)/1000,r=.149-(Math.abs(y)-.18)*.45;
      oval(head,hair,Math.sin(a)*r*w,y,Math.cos(a)*(.155-(Math.abs(y)-.17)*.66)+.025,.003,.0033,.003);
    }
    return;
  }
  if(v.beard==='goatee'){
    oval(head,hair,0,-.231,.146,.082*jaw,.055,.052);
    stroke(head,light,[[-.025,-.211,.192],[-.010,-.238,.194],[.010,-.252,.177]],.003);
    return;
  }
  const rings=beardJawSections(w,jaw);
  const chin=shell(head,hair,rings,{
    start:-1.68,end:1.68,segments:40,
    warp(point,angle,index){return beardJawPoint(rings,index,angle);}
  });
  chin.material.side=THREE.DoubleSide;
  chin.userData.studioPart='fitted-beard';
  for(const s of [-1,1]){
    // Keep detail below the cheek transition: longer contours reached bare skin
    // in front view. These short ink paths follow the jaw surface at 90 degrees.
    const outer=[[3,1.03],[2,.72],[1,.31]]
      .map(([ring,angle])=>beardJawPoint(rings,ring,s*angle,.004));
    const inner=[[3,.77],[2,.46],[1,.17]]
      .map(([ring,angle])=>beardJawPoint(rings,ring,s*angle,.006));
    const outline=stroke(head,edge,outer,.0034,20);
    const shine=stroke(head,light,inner,.0029,20);
    outline.userData.studioPart='fitted-beard-ink';
    shine.userData.studioPart='fitted-beard-ink';
  }
}

function faceReward(head,item,pigment,width,spacing){
  const finish=surface(pigment,{roughness:.37,emissive:pigment,emissiveIntensity:.11});
  const light=surface(shade(pigment,1.62));
  const seed=hash(item.id);
  if(/eyes|iris/.test(item.id)){
    for(const side of [-1,1]){
      const x=side*(.092+spacing*.009)*width;
      const motif=medallion(head,finish,x,.015,.213,.018+seed%6*.0015,.016,5+seed%7);
      motif.rotation.y=side*.22;motif.rotation.z=(seed%9)*.21;
      oval(head,light,x-.004,.022,.229,.005,.006,.0035);
    }
  }else if(item.id.includes('brows')){
    for(const side of [-1,1])stroke(head,finish,[[side*.051,.082,.186],[side*.096,.100,.188],
      [side*.140,.074,.166]],.011+seed%3*.003);
  }else if(/grin|mouth/.test(item.id)){
    const smile=surface(shade(pigment,.48));
    oval(head,smile,0,-.154,.208,.055,.021,.010);
    for(const s of [-1,1])oval(head,light,s*.021,-.146,.222,.013,.014+seed%5*.002,.008);
  }else{
    const size=.020+seed%6*.002;
    const s=seed%2?1:-1,x=s*(.126+.008*(seed%4));
    const kind=item.id.includes('scar')||item.id.includes('warpaint')?'stroke':'mark';
    if(kind==='stroke')stroke(head,finish,[[x-s*.044,-.057,.195],[x,-.078,.171],
      [x+s*.021,-.109,.142]],.008+seed%4*.0015);
    else{
      for(let i=0;i<2+seed%3;i++)medallion(head,i%2?light:finish,
        x-s*i*.021,-.072-i*.018,.171+i*.009,size-i*.003,.008,4+seed%5).rotation.y=s*.35;
    }
  }
}

export function addGlasses(head,kind,metal,single=false,fit=1){
  if(kind==='none')return;
  const frame=surface(metal,{metalness:.52,roughness:.37});
  const lens=new THREE.MeshPhysicalMaterial({color:'#b6d8e5',transparent:true,opacity:.24,roughness:.29,depthWrite:false});
  const frameRoot=group(head);
  frameRoot.scale.x=Math.max(.85,Math.min(1.14,Number(fit)||1));
  frameRoot.userData.studioPart='gear';
  const angular=['square','retro-square','cat-eye','visor'].includes(kind);
  const height=kind==='aviator'?1.02:kind==='oval'?.70:.86;
  for(const s of (single?[1]:[-1,1])){
    const piece=group(frameRoot,s*.105,.010,.209);
    piece.rotation.y=s*.22;
    if(angular){
      stroke(piece,frame,[[-.071,-.036,0],[.068,-.038,0],[.070,.041,0],[-.070,.042,0],[-.071,-.036,0]],.0075);
      box(piece,lens,0,0,-.005,.134,.072,.018);
    }else{
      band(piece,frame,0,0,0,.061,.006,1.16,height);
      oval(piece,lens,0,0,0,.065,.060*height,.007);
    }
    join(frameRoot,frame,[s*.17,.020,.210],[s*.239,.037,.004],.0058);
  }
  if(!single)stroke(frameRoot,frame,[[-.035,.020,.221],[0,.031,.239],[.035,.020,.221]],.006);
}

export function controlVisor(head,pigment){
  const plate=group(head,0,.042,.226);
  const enamel=surface(pigment),rim=surface('#332f42'),trim=surface('#deb16a');
  const signal=surface('#a2e0cb',{emissive:'#6be6c2',emissiveIntensity:.34});
  box(plate,rim,0,0,0,.402,.169,.087);
  box(plate,enamel,0,0,.027,.371,.139,.055);
  box(plate,rim,0,-.002,.057,.264,.094,.023);
  const shutters=[];
  for(const side of [-1,1]){
    oval(plate,signal,side*.072,-.001,.076,.049,.027,.010);
    medallion(plate,trim,side*.161,.011,.068,.014,.013,6);
    const cover=group(plate,side*.071,.044,.067);
    box(cover,enamel,0,-.014,.011,.112,.039,.028);
    shutters.push(cover);
  }
  const emitter=group(plate,.071,-.001,.088);
  const geometry=new THREE.ConeGeometry(.117,1,20,1,true);
  geometry.rotateX(-Math.PI/2);
  geometry.translate(0,0,.5);
  const beam=attach(emitter,geometry,new THREE.MeshBasicMaterial({color:'#a4f5cf',opacity:0,
    transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  beam.visible=false;
  return {signal,emitter,beam,shutters};
}

export function sculptFace(head,v,palette,{mechanical=false,armor=false,scout=false,radio=false,marsh=false,specter=false,jawTune=0,eyeSpacing=0,styleReward,eyeReward}={}){
  if(mechanical||armor){
    const alloy=surface(shade(palette.cloth,.88),{metalness:.58,roughness:.39});
    const edge=surface(armor?'#d5ac6d':'#c7d7d6',{metalness:.68,roughness:.34});
    const screen=surface('#252536',{roughness:.36});
    const signal=surface(palette.eye,{emissive:palette.eye,emissiveIntensity:.49});
    const width=1+jawTune*.054;
    if(radio){
      shell(head,alloy,[[-.196,.164,.121],[-.156,.226,.168],[.145,.225,.171],[.199,.185,.141],[.213,.074,.070]],{segments:42});
      box(head,edge,0,.174,.025,.403,.067,.323);
      for(let index=0;index<4;index++)box(head,screen,-.12+index*.076,-.137,.161,.034,.026,.025);
    }else if(scout){
      oval(head,alloy,0,.012,0,.245*width,.198,.204);
      oval(head,edge,0,.051,.151,.199,.101,.084);
    }else if(armor){
      shell(head,alloy,[[-.233,.131*width,.137],[-.203,.177*width,.179],[-.044,.209,.194],
        [.163,.205,.182],[.244,.147,.143],[.276,.005,.007]],{segments:38});
      const crest=oval(head,edge,.024,.273,.009,.060,.141,.140);
      crest.rotation.x=-.17;
      const shadow=surface(shade(edge.color,.49));
      for(const s of [-1,1]){
        join(head,shadow,[s*.164,.136,-.037],[s*.242,.205,-.038],.052,.039,7);
        join(head,edge,[s*.229,.187,-.041],[s*.314,.326,-.078],.043,.004,7);
      }
    }else{
      box(head,alloy,0,0,0,.435*width,.38,.377);
      box(head,edge,0,.163,0,.408,.052,.344);
      box(head,edge,.015,-.139,.154,.312,.073,.082);
    }
    box(head,screen,0,.038,.183,.375,.137,.062);
    for(const s of [-1,1]){
      oval(head,signal,s*(.098+eyeSpacing*.009),.042,.217,.043,.027,.008);
      const lug=medallion(head,edge,s*.229,.019,0,.066,.031);
      lug.rotation.y=Math.PI/2;
    }
    for(let i=0;i<6;i++)box(head,edge,-.105+i*.042,-.098,.191,.014,.038,.021);
    box(head,screen,0,.017,-.197,.273,.164,.037);
    for(let i=0;i<4;i++)box(head,edge,-.070+i*.046,.012,-.223,.015,.10,.021);
    if(!armor){
      join(head,edge,[.091,.167,-.035],[.146,.316,-.044],.012,.008);
      oval(head,signal,.146,.316,-.044,.025,.022,.025);
    }
    if(eyeReward)faceReward(head,eyeReward,palette.eye,1,eyeSpacing);
    return;
  }

  const tone=surface(palette.skin,{roughness:.65});
  const shadeSkin=surface(shade(palette.skin,.80));
  const shape=(HEAD_SHAPES[v.face]||HEAD_SHAPES.oval).slice();
  shape[2]*=1+jawTune*.069;
  const [w,h,jaw]=shape;
  skinMesh(head,tone,shape);
  facePlanes(head,v,palette,w,h,jaw,specter);
  for(const s of [-1,1]){
    const ear=oval(head,tone,s*.221*w,-.041,0,specter?.074:.044,specter?.076:.061,.033);
    ear.rotation.z=s*(specter?-.71:-.23);
    oval(head,shadeSkin,s*(.223*w+(specter?.023:.004)),-.041,.025,.019,.031,.011).rotation.z=s*-.32;
    stroke(head,shadeSkin,[[s*.166*w,-.103,.130],[s*.145*w,-.129,.146],[s*.124*w,-.138,.155]],.0042);
    if(v.accessory==='earrings')band(head,surface('#e8bc76',{metalness:.72}),s*.231*w,-.090,.026,.023,.006,.80,1.21);
  }
  browsAndEyes(head,v,palette,w,eyeSpacing);
  noseAndMouth(head,v,tone,palette);
  introduceBeard(head,v,palette,w,jaw);
  if(eyeReward)faceReward(head,eyeReward,palette.eye,w,eyeSpacing);
  if(['freckles','rosy','dimples'].includes(v.cheeks)||v.accessory==='freckles'){
    const fleck=surface(shade(palette.skin,v.cheeks==='rosy'?.92:.68));
    const count=v.cheeks==='rosy'?2:v.cheeks==='dimples'?1:9;
    for(const side of [-1,1])for(let i=0;i<count;i++){
      const x=side*(.098+(i%4)*.016),y=-.086-(i%3)*.01;
      oval(head,fleck,x,y,.182-Math.abs(x)*.11,v.cheeks==='rosy'?.025:.003,.003,.004);
    }
  }
  if(marsh){
    const leaf=surface('#668a52'),darkFin=surface('#375b50'),ridge=surface('#a5b266');
    for(const side of [-1,1]){
      const fin=oval(head,leaf,side*.24,.103,-.035,.068,.157,.045);fin.rotation.z=-side*.46;
      join(head,ridge,[side*.205,-.025,-.006],[side*.320,.194,-.020],.014,.004,12);
      for(let i=0;i<3;i++)stroke(head,darkFin,[[side*.231,.045+i*.029,.060],[side*.259,.039+i*.029,.039],
        [side*.282,.060+i*.028,-.009]],.0058);
    }
    const crest=oval(head,leaf,-.031,.292,-.042,.085,.057,.165);crest.rotation.z=.14;
  }
  const shadeHair=styleReward?palette.rewardHair:palette.hair;
  const hair=surface(shadeHair),shine=surface(shade(shadeHair,1.19),{roughness:.56});
  const style=styleReward?.tags?.includes('norse')?'braids':styleReward?.id.includes('curls')?'curls':
    styleReward?.id.includes('spike')||styleReward?.id.includes('flam')?'quiff':HAIR_FORM[v.style];
  const scalp=group(head);
  scalp.scale.set(w,h,1);
  makeScalp(scalp,hair,shine,style,v.style);
  if(v.accessory==='headphones'){
    const velvet=surface('#39304b'),metal=surface('#b495bc',{metalness:.62});
    stroke(head,metal,[[-.238,.018,-.014],[-.198,.210,-.025],[0,.298,-.039],[.198,.210,-.025],[.238,.018,-.014]],.018,20);
    for(const s of [-1,1])box(head,velvet,s*.240,.009,-.004,.072,.138,.116);
  }
}
