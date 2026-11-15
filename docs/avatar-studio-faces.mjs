import {THREE,attach,band,box,group,hash,join,medallion,oval,shade,shell,stroke,surface} from './avatar-studio-geometry.mjs?v=studio3';

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

function browsAndEyes(head,v,palette,w,spacing){
  const ivory=surface('#fff6e9',{roughness:.39});
  const glass=surface(palette.eye,{roughness:.29});
  const glint=surface('#fffdeb',{roughness:.24});
  const pupil=surface('#241725');
  const brow=surface(shade(palette.hair,.49));
  const rim=surface(shade(palette.skin,.31));
  const lid=surface(shade(palette.skin,.83));
  const eyeWidth=v.eye_shape==='round'?.059:v.eye_shape==='almond'?.066:.061;
  const eyeHeight={wide:.036,round:.039,almond:.026,sleepy:.019,dramatic:.024,classic:.031}[v.eye_shape];
  const open=v.expression==='laugh'?.79:1;
  for(const side of [-1,1]){
    const face=group(head,side*(.099+spacing*.009)*w,.015,.169-Math.max(0,spacing)*.003);
    face.rotation.y=side*.27;
    const blink=v.expression==='wink'&&side===1;
    const arch=v.expression==='curious'&&side===1?.014:v.expression==='determined'?-side*.013:0;
    if(blink){
      stroke(face,rim,[[-.047,.002,.013],[0,-.009,.028],[.049,.003,.013]],.006);
    }else{
      const h=eyeHeight*open;
      oval(face,lid,0,-.003,-.004,eyeWidth+.005,h+.008,.028);
      oval(face,ivory,0,0,.001,eyeWidth,h,.023);
      oval(face,glass,-.007,0,.021,.020,h*.80,.009);
      oval(face,pupil,-.008,0,.028,.009,h*.55,.004);
      oval(face,glint,-.014,.009,.032,.0045,.005,.002);
      stroke(face,rim,[[-eyeWidth,0,.014],[-eyeWidth*.48,h*.92,.022],[eyeWidth*.42,h,.022],[eyeWidth,.003,.014]],.0061);
      stroke(face,lid,[[-eyeWidth*.73,-.012,.020],[0,-h*.91,.015],[eyeWidth*.68,-.010,.017]],.0032);
      if(v.eye_shape==='dramatic')stroke(face,rim,[[.023,.014,.023],[.048,.022,.013],[.066,.032,.010]],.0048);
    }
    const lineHeight=v.brows==='straight'?.004:v.brows==='arching'?.021:.011;
    stroke(face,brow,[[-.054,.056+arch,.002],[0,.058+lineHeight+arch,.021],[.047,.052+arch,.002]],v.brows==='bold'?.010:.007);
  }
}

function noseAndMouth(head,v,tone,palette){
  const bridge={straight:.057,pointed:.041,swoop:.030,button:.020,freckled:.026}[v.nose];
  const length=v.nose==='pointed'?.276:v.nose==='swoop'?.258:.249;
  const width=v.nose==='button'?.047:.039;
  shell(head,tone,[
    [-.101,.012,.005,0,.186],[-.094,width*.79,.030,0,.212],
    [-.079,width,(length-.199)*.50,.002,(length+.199)*.50],
    [-.053,width*.83,.028,0,length-.057],
    [-.017,width*.72,.021,0,.177],[bridge,.012,.008,0,.165]
  ],{segments:26});
  const noseInk=surface(shade(palette.skin,.48));
  stroke(head,noseInk,[[.022,-.066,length-.009],[.026,-.084,length-.012],[.012,-.094,.237]],.0034);
  const dark=surface(shade(palette.skin,.29)),lip=surface(shade(palette.skin,.73));
  const lightLip=surface(shade(palette.skin,1.06));
  const grin=['grin','laugh'].includes(v.expression);
  const corner={smile:.012,grin:.018,smirk:.019,calm:0,determined:-.011,curious:.005,wink:.010,laugh:.02}[v.expression];
  const left=[-.068,-.152+corner,.173],right=[.068,-.152+(v.expression==='smirk'?-.004:corner),.173];
  if(grin){
    oval(head,dark,0,-.154,.185,.066,v.expression==='laugh'?.029:.021,.013);
    oval(head,surface('#fff2de'),0,-.148,.197,.050,.011,.004);
  }else{
    stroke(head,lip,[left,[-.028,-.150,.181],[0,-.155,.190],[.028,-.152,.181],right],.006);
    stroke(head,dark,[left,[0,-.155,.196],right],.0037);
  }
  stroke(head,lightLip,[[-.029,-.177,.176],[0,-.178,.182],[.029,-.177,.176]],.003);
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
  const chin=shell(head,hair,[
    [-.286,.07,.070,0,.049],[-.278,.123*jaw*w,.112,0,.050],
    [-.249,.151*jaw*w,.139,0,.041],[-.218,.174*jaw*w,.148,0,.033],
    [-.179,.194*jaw*w,.158,0,.028],[-.135,.210*w,.172,0,.018]
  ], {start:-1.68,end:1.68,segments:30,warp([x,y,z],a,i){
    const side=Math.pow(Math.abs(Math.sin(a)),2.3);
    return [x,y+side*i*.014-(i===5?.061*Math.max(0,Math.cos(a))**3:0),z];
  }});
  chin.material.side=THREE.DoubleSide;
  for(const s of [-1,1]){
    stroke(head,edge,[[s*.199*w,-.062,.115],[s*.174*w,-.136,.149],
      [s*.117*jaw*w,-.173,.170],[s*.065*jaw*w,-.193,.195]],.0047);
    stroke(head,light,[[s*.188*w,-.094,.116],[s*.161*w,-.176,.151],
      [s*.115*jaw*w,-.233,.167],[s*.035*jaw*w,-.265,.165]],.005);
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

export function addGlasses(head,kind,metal,single=false){
  if(kind==='none')return;
  const frame=surface(metal,{metalness:.52,roughness:.37});
  const lens=new THREE.MeshPhysicalMaterial({color:'#b6d8e5',transparent:true,opacity:.24,roughness:.29,depthWrite:false});
  const angular=['square','retro-square','cat-eye','visor'].includes(kind);
  const height=kind==='aviator'?1.02:kind==='oval'?.70:.86;
  for(const s of (single?[1]:[-1,1])){
    const piece=group(head,s*.105,.010,.225);
    piece.rotation.y=s*.22;
    if(angular){
      stroke(piece,frame,[[-.071,-.036,0],[.068,-.038,0],[.070,.041,0],[-.070,.042,0],[-.071,-.036,0]],.0075);
      box(piece,lens,0,0,-.005,.134,.072,.018);
    }else{
      band(piece,frame,0,0,0,.061,.006,1.16,height);
      oval(piece,lens,0,0,0,.065,.060*height,.007);
    }
    join(head,frame,[s*.17,.020,.224],[s*.239,.037,.004],.0058);
  }
  if(!single)stroke(head,frame,[[-.035,.020,.236],[0,.031,.254],[.035,.020,.236]],.006);
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

export function sculptFace(head,v,palette,{mechanical=false,armor=false,scout=false,specter=false,jawTune=0,eyeSpacing=0,styleReward,eyeReward}={}){
  if(mechanical||armor){
    const alloy=surface(shade(palette.cloth,.88),{metalness:.58,roughness:.39});
    const edge=surface(armor?'#d5ac6d':'#c7d7d6',{metalness:.68,roughness:.34});
    const screen=surface('#252536',{roughness:.36});
    const signal=surface(palette.eye,{emissive:palette.eye,emissiveIntensity:.49});
    const width=1+jawTune*.054;
    if(scout){
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
