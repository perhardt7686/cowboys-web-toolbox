import {AVATAR_OPTIONS} from './family-avatar-builder.mjs?v=workshop1';
import {normalizeBody,fitsBody} from './avatar-full-body.mjs?v=workshop1';
import {BY_ID} from './avatar-reward-catalog.mjs?v=workshop1';
import {THREE,attach,band,box,group,hash,join,medallion,oval,shade,shell,stroke,surface} from './avatar-studio-geometry.mjs?v=workshop1';
import {addGlasses,controlVisor,sculptFace} from './avatar-studio-faces.mjs?v=workshop1';
import {buildCompanion,heldItem,makeAura,rewardPigment,studioHat} from './avatar-studio-companions.mjs?v=workshop1';

const BODY={
  detective:{height:1.045,width:.85},
  mechanic:{height:1.012,width:1.18},
  sleuth:{height:.931,width:.89},
  specter:{height:1.048,width:.87},
  marsh:{height:1.094,width:.97},
  armor:{height:1.062,width:1.20},
  automaton:{height:.940,width:1.105},
  radio:{height:.855,width:1.03},
  scout:{height:.914,width:.89}
};
const avColor=(field,key)=>AVATAR_OPTIONS[field].find(([id])=>id===key)?.[2];
const dark='#292b39';

function pants(figure,style,pigment,body,shoes,wardrobe){
  const [fabric,seam,lining]=[surface(pigment),surface(shade(pigment,.68)),surface(shade(pigment,1.37))];
  const metallic=surface('#a6a9b5',{metalness:.66,roughness:.46});
  const hinges=surface('#383441');
  const dress=['dress','pleats'].includes(style);
  const hem=dress?(style==='dress'?.685:.820):0;
  const hip=body.width*.186;
  for(const side of [-1,1]){
    const x=side*hip,z=side*.066;
    const flare=style==='flares'?.132:style==='cuffs'?.086:.098;
    if(wardrobe.mechanical){
      join(figure,metallic,[x,.202,z],[x*.95,.656,z*.55],.074,.088);
      join(figure,metallic,[x*.95,.656,z*.55],[x,1.102,0],.103,.117);
      medallion(figure,lining,x*.95,.63,z*.55+.075,.076,.045);
      medallion(figure,hinges,x*.95,.63,z*.55+.103,.050,.029,10);
      medallion(figure,metallic,x*.95,.63,z*.55+.122,.026,.013,6);
      oval(figure,metallic,x,1.090,0,.109,.107,.103);
      box(figure,fabric,x*.96,.437,z*.8+.038,.125,.19,.12);
      for(let i=0;i<3;i++)box(figure,hinges,x*.96,.391+i*.043,z*.8+.103,.085,.010,.014);
    }else{
      const layers=[
        [.184,flare,flare*.91,x*1.14,z],
        [.232,flare*.96,flare*.88,x*1.13,z],
        [.345,flare*.88,.105,x*1.10,z],
        [.598,.104,.102,x*1.02,z*.54],
        [.706,.110,.108,x,z*.3],
        [.892,.128,.119,x*.92,0],
        [1.073,.151,.134,x*.86,0],
        [1.320,.169,.151,x*.76,-.006]
      ];
      const legs=dress?[...layers.filter(([y])=>y<hem),
        [hem+.024,.101,.091,x,.025*z]]:layers;
      shell(figure,dress?surface('#ede5d2'):fabric,legs,{segments:28});
      if(!dress){
        stroke(figure,seam,[[x+side*.095,.242,z+.058],[x+side*.084,.559,z*.56+.062],
          [x*.93+side*.111,.863,.073],[x*.81+side*.130,1.147,.079]],.0052);
        if(style==='cuffs')shell(figure,lining,[[.184,flare+.006,.102,x*1.14,z],[.253,flare+.004,.101,x*1.14,z]],{segments:24});
      }
    }
    shoe(figure,shoes,wardrobe.shoeColor,x*1.14,z,side);
  }
  if(dress){
    const folds=style==='pleats'?12:5;
    shell(figure,fabric,[[hem,.388*body.width,.232],[hem+.040,.375*body.width,.221],
      [.982,.295*body.width,.181],[1.157,.292*body.width,.183],[1.298,.286*body.width,.175]],
    {segments:48,warp([x,y,z],a,i){
      const ripple=1+Math.cos(a*folds)*.041*(1-i/7);
      return [x*ripple,y+Math.sin(a*folds)*.009*(1-i/6),z*ripple];
    }});
    shell(figure,lining,[[hem-.007,.389*body.width,.233],[hem+.024,.382*body.width,.231]],{segments:48});
  }
}

function shoe(parent,style,pigment,x,z,side){
  const shoe=group(parent,x,0,z);shoe.rotation.y=side*.112;
  const leather=surface(pigment||(['boots','highboots'].includes(style)?'#573b38':style==='sneakers'?'#c6c8bc':'#493849'),{roughness:.47});
  const rubber=surface(style==='sneakers'?'#eddfc7':'#302b33');
  const stitching=surface(shade(leather.color,1.62));
  box(shoe,rubber,0,.046,.087,.249,.074,.344);
  oval(shoe,leather,0,.111,.086,.126,.085,.180);
  oval(shoe,leather,0,.147,.002,.103,.105,.112);
  if(['boots','highboots'].includes(style)){
    shell(shoe,leather,[[.110,.104,.106],[.215,.101,.103],[style==='highboots'?.435:.275,.098,.102]],{segments:28});
    const trim=style==='highboots'?.390:.244;
    shell(shoe,stitching,[[trim-.018,.100,.104],[trim,.099,.104]],{segments:26});
    stroke(shoe,stitching,[[-.04,.135,.161],[-.045,.189,.111],[-.023,trim-.035,.109]],.004);
    stroke(shoe,rubber,[[-.048,.128,-.084],[-.053,.184,-.104],[0,.196,-.108],[.054,.175,-.100]],.0042);
  }
  if(style==='maryjanes')box(shoe,stitching,0,.189,.044,.183,.021,.046);
  if(style==='sneakers'||style==='boots')for(let i=0;i<4;i++)
    stroke(shoe,stitching,[[-.052,.176+i*.013,.148-i*.020],[.006,.177+i*.013,.149-i*.020],[.047,.172+i*.013,.138-i*.021]],.005);
  if(style==='loafers')box(shoe,stitching,0,.174,.105,.180,.021,.049);
}

function torso(parent,v,wardrobe,palette,body){
  const w=body.width;
  const material=surface(wardrobe.topColor||palette.cloth);
  const coat=surface(wardrobe.outerColor||'#857255');
  const trim=surface(shade(coat.color,.58));
  const welt=surface(shade(material.color,.62));
  const light=surface(shade(material.color,1.30));
  const warm=surface('#c99f63',{metalness:.58,roughness:.56});
  let capeParts=null;
  const sections=[
    [1.132,.254,.148], [1.172,.309,.170], [1.251,.317,.179],
    [1.358,.293,.171],[1.479,.310,.181],[1.590,.333,.185],
    [1.735,.370,.195],[1.883,.411,.179],[1.978,.393,.154],
    [2.048,.218,.121],[2.073,.105,.092]
  ].map(([y,x,z])=>[y,x*w,z]);
  shell(parent,material,sections,{segments:38});
  if(wardrobe.mechanical){
    const metal=surface(shade(palette.cloth,.76),{metalness:.63,roughness:.37});
    box(parent,metal,0,1.127,0,.532*w,.168,.279);
    box(parent,metal,0,1.663,0,.719*w,.574,.375);
    box(parent,material,0,1.663,.151,.628*w,.433,.153);
    box(parent,welt,-.086,1.658,.234,.278,.163,.031);
    for(let i=0;i<3;i++)oval(parent,warm,-.158+i*.070,1.654,.258,.019,.020,.010);
    box(parent,metal,.048,1.654,-.205,.470,.332,.111);
    for(let i=0;i<5;i++)box(parent,light,-.085+i*.067,1.653,-.268,.018,.197,.021);
    if(wardrobe.armor){
      const plate=oval(parent,metal,.012,1.730,.183,.279*w,.255,.099);
      plate.rotation.z=-.10;
      for(const side of [-1,1]){
        oval(parent,light,side*.276*w,1.908,.025,.165,side===1?.105:.143,.164);
        oval(parent,warm,side*.237*w,1.863,.154,.021,.022,.013);
      }
      medallion(parent,warm,.064,1.759,.278,.058,.023,6);
      for(const side of [-1,1]){
        const pauldron=box(parent,metal,side*.350*w,1.895,.008,.238,.163,.321);
        pauldron.rotation.z=side*.24;
        join(parent,light,[side*.390*w,1.953,-.058],[side*.507*w,2.080,-.095],.071,.003,6);
      }
    }else{
      const paint=surface('#ead481');
      for(const side of [-1,1]){
        box(parent,paint,side*.256*w,1.445,.210,.095,.024,.016).rotation.z=side*.43;
        box(parent,welt,side*.256*w,1.427,.215,.103,.014,.020).rotation.z=side*.43;
      }
    }
  }else if(wardrobe.top==='striped'){
    for(const index of [2,4,6,8]){
      const [y,rx,rz]=sections[index];
      shell(parent,light,[[y-.012,rx+.003,rz+.004],[y+.010,rx+.005,rz+.005]],{segments:38});
    }
  }else if(wardrobe.top==='turtleneck'||wardrobe.top==='sweater'){
    shell(parent,light,[[1.971,.146,.132],[2.080,.130,.112],[2.125,.125,.104]],{segments:25});
    for(let i=0;i<13;i++){
      const x=(i-6)*.036*w;
      const z=.181*Math.sqrt(Math.max(0,1-(x/(.324*w))**2))+.004;
      stroke(parent,light,[[x,1.12,z*.91],[x*.93,1.332,z*.97],[x,1.55,z]],.0027);
    }
  }else{
    for(const s of [-1,1]){
      const collar=box(parent,light,s*.107,1.941,.141,.147,.114,.045);
      collar.rotation.z=s*.34;collar.rotation.y=s*.18;collar.rotation.x=-.31;
    }
    stroke(parent,welt,[[0,1.889,.180],[0,1.632,.191],[0,1.401,.182],[0,1.137,.179]],.008);
    for(const y of [1.36,1.50,1.64,1.78])oval(parent,warm,0,y,.194,.014,.014,.009);
    if(['safari','denim','vest','jacket','hoodie','jumpsuit'].includes(wardrobe.top)){
      for(const s of [-1,1]){
        box(parent,welt,s*.188*w,1.633,.164,.179,.132,.029).rotation.y=s*.14;
        box(parent,light,s*.188*w,1.686,.183,.199,.030,.032).rotation.y=s*.15;
      }
    }
    if(wardrobe.top==='hoodie'){
      oval(parent,material,0,1.976,-.105,.206,.152,.166);
      for(const s of [-1,1])stroke(parent,light,[[s*.079,1.985,.167],[s*.057,1.801,.207],[s*.083,1.711,.193]],.008);
    }
    if(wardrobe.top==='cardigan')for(const s of [-1,1]){
      stroke(parent,light,[[s*.143,1.985,.136],[s*.079,1.819,.183],[s*.054,1.693,.195],[s*.043,1.214,.193]],.015);
    }
  }
  if(wardrobe.outer!=='none'){
    const lower={'cape':1.093,'trench':.790,'raincoat':.859,'denim':1.174};
    const bottom=lower[wardrobe.outer];
    const cape=wardrobe.outer==='cape';
    const starts=cape?1.25:.39,ends=Math.PI*2-starts;
    const panel=cape?group(parent):parent;
    const cloth=shell(panel,coat,[
      [bottom,(cape?.495:.414)*w,.265,0,-.027],[bottom+.060,(cape?.469:.402)*w,.228],
      [1.164,.347*w,.208],[1.310,.332*w,.195],
      [1.545,.356*w,.201],[1.738,.406*w,.219],[1.901,.421*w,.198],
      [1.984,.387*w,.184],[2.079,.137,.151]
    ].filter((row,index,array)=>index===0||row[0]>array[index-1][0]),
    {start:starts,end:ends,segments:40,warp([x,y,z],a,i){
      const pleat=(1-i/10)*(cape?.030:.012)*Math.sin(a*5);
      return [x+pleat*Math.sin(a),y+(cape?.031*Math.sin(a*3)*(1-i/10):0),z+pleat*Math.cos(a)];
    }});
    coat.side=THREE.DoubleSide;
    if(!cape)for(const s of [-1,1]){
      const x=s*.158*w;
      const lapel=box(parent,trim,x,1.824,.200,.107,.252,.042);
      lapel.rotation.z=-s*.31;lapel.rotation.y=s*.28;
      stroke(parent,trim,[[x,1.700,.229],[x*.91,1.415,.212],[x*1.13,1.208,.227],[x*1.22,bottom+.014,.222]],.0065);
      box(parent,trim,s*.235*w,1.331,.200,.12,.035,.033).rotation.z=s*.22;
      for(const y of [1.19,1.45,1.57])oval(parent,warm,s*.190*w,y,.203,.011,.011,.008);
    }
    const seam=surface(shade(coat.color,1.34));
    const piping=stroke(panel,seam,[[0,1.967,-.191],[0,1.699,-.219],[0,1.331,-.205],[0,bottom+.032,-.249]],.006);
    if(cape){
      const clasp=surface('#d5a263');
      for(const side of [-1,1])medallion(parent,clasp,side*.155*w,1.962,.163,.043,.021,10);
      stroke(parent,clasp,[[-.151*w,1.962,.182],[0,1.919,.204],[.151*w,1.962,.182]],.009,16);
      capeParts=[cloth,piping].map(mesh=>{
        const position=mesh.geometry.attributes.position;
        return {mesh,position,idle:position.array.slice()};
      });
    }
  }
  if(wardrobe.bottoms==='overalls'){
    const denim=surface('#4d6775'),stitch=surface('#b5a286');
    box(parent,denim,0,1.415,.173,.327*w,.304,.077);
    for(const s of [-1,1]){
      stroke(parent,denim,[[s*.13*w,1.417,.207],[s*.17*w,1.880,.175],[s*.19*w,2.000,0],[s*.13*w,1.626,-.199],[s*.11*w,1.398,-.201]],.041,20);
      oval(parent,warm,s*.13*w,1.562,.212,.020,.020,.013);
    }
    stroke(parent,stitch,[[-.11*w,1.397,.21],[0,1.379,.216],[.11*w,1.397,.21]],.0045);
  }
  if(wardrobe.belt!=='none'){
    const leather=surface(wardrobe.beltColor||'#4a383a',{roughness:.49});
    shell(parent,leather,[[1.194,.333*w,.193],[1.251,.332*w,.195]],{segments:36});
    box(parent,warm,0,1.222,.202,.094,.066,.031);
    box(parent,leather,0,1.222,.221,.057,.039,.018);
    for(let i=0;i<5;i++){
      const a=(i+.5)*1.23;
      box(parent,leather,.336*w*Math.sin(a),1.225,.196*Math.cos(a),.019,.090,.022).rotation.y=a;
    }
    if(wardrobe.belt==='utility')
      for(const s of [-1,1])box(parent,leather,s*.295*w,1.187,.118,.088,.135,.102).rotation.y=s*.32;
  }
  if(wardrobe.neck!=='none'){
    const scarf=surface(wardrobe.neckColor||'#a84f46');
    const gold=surface('#eac38a',{metalness:.68});
    if(wardrobe.neck==='pendant'){
      stroke(parent,gold,[[-.115,2.069,.048],[-.089,1.898,.165],[0,1.814,.215],[.094,1.918,.154],[.118,2.068,.040]],.0063);
      medallion(parent,gold,0,1.823,.219,.041,.011);
    }else{
      shell(parent,scarf,[[1.982,.140,.146],[2.031,.146,.127],[2.088,.125,.121]],{segments:30});
      oval(parent,scarf,-.066,1.967,.143,.068,.043,.046);
      const tail=oval(parent,scarf,.029,1.845,.199,.044,.139,.035);
      tail.rotation.z=.61;
    }
  }
  if(wardrobe.bag!=='none'){
    const leather=surface(wardrobe.bagColor||'#7a5147',{roughness:.56});
    const strip=surface(shade(leather.color,.65));
    const pack=wardrobe.bag==='pack';
    const bag=box(parent,leather,pack?0:-.327*w,pack?1.541:1.201,pack?-.249:-.059,
      pack?.46:.267,pack?.487:.298,pack?.203:.191);
    bag.rotation.y=pack?0:.40;
    box(parent,strip,pack?0:-.346*w,pack?1.592:1.251,pack?-.362:.024,
      pack?.365:.247,pack?.212:.141,.032);
    if(pack){
      for(const s of [-1,1]){
        stroke(parent,strip,[[s*.117*w,1.355,-.254],[s*.174*w,1.899,-.172],[s*.16*w,1.995,.012],[s*.173*w,1.659,.184],[s*.14*w,1.290,.162]],.025,20);
      }
      box(parent,warm,0,1.571,-.384,.060,.044,.022);
    }else{
      stroke(parent,strip,[[-.325*w,1.206,.021],[-.223*w,1.504,.183],[.187*w,1.994,.086],
        [.199*w,1.899,-.169],[-.325*w,1.251,-.142]],.022,24);
    }
  }
  if(v.accessory==='badge'||wardrobe.plate){
    medallion(parent,warm,-.206*w,1.781,.236,.040,.019);
    medallion(parent,light,-.206*w,1.781,.252,.022,.008,7);
  }
  return {coat,material,warm,capeParts};
}

function arm(parent,side,v,body,wardrobe,palette,materials,item){
  const x=body.width*.402*side;
  const point=[x,1.902,.001],elbow=[x+side*.091,1.570,.012+side*.016];
  const hand=[x+side*.12,1.229,.074];
  if(side===1&&v.pose==='wave'&&!item){
    elbow[0]+=side*.054;hand[0]+=side*.157;
    hand[1]=1.969;hand[2]=.169;
  }else if(item){
    hand[0]+=side*.020;hand[1]=1.398;hand[2]=.256;
  }else if(v.pose==='tilt'&&!wardrobe.mechanical){
    // Contrapposto is visible even before the head rotates. This small
    // asymmetry avoids two identical stiff hanging sleeves; item-held arms
    // keep their existing socket and hand position instead.
    elbow[0]+=side*(side===1?.065:.025);
    elbow[1]+=side===1?.055:-.029;
    hand[0]+=side*(side===1?.114:.031);
    hand[1]+=side===1?.121:-.040;
    hand[2]+=side===1?.059:.018;
  }else if(wardrobe.mechanical){
    elbow[0]+=side*.028;
    hand[0]+=side*.024;
    hand[1]+=.049;
    hand[2]+=.047;
  }
  const covered=wardrobe.outer!=='none'&&wardrobe.outer!=='cape';
  const fabric=covered?materials.coat:materials.material;
  const short=['striped','safari','vest'].includes(wardrobe.top)&&!covered;
  const skin=surface(palette.skin);
  const wrist=wardrobe.gloves!=='none'?surface(wardrobe.gloveColor||'#58444c'):skin;
  const mechanical=wardrobe.mechanical;
  const metal=surface('#8e9da7',{metalness:.56,roughness:.47});
  const sleeveEnd=short?
    [point[0]*.37+elbow[0]*.63,point[1]*.37+elbow[1]*.63,elbow[2]]:elbow;
  const offset=(to,from)=>to.map((value,index)=>value-from[index]);
  const origin=[0,0,0];
  const shoulder=group(parent,...point);
  const hinge=group(shoulder,...offset(elbow,point));
  oval(shoulder,fabric,0,-.027,0,.109,.126,.110);
  join(shoulder,fabric,origin,offset(sleeveEnd,point),.104,.081);
  oval(hinge,short?skin:mechanical?metal:fabric,0,0,0,.078,.083,.080);
  if(mechanical){
    medallion(hinge,surface('#39343b'),0,0,.078,.048,.014,10);
    medallion(hinge,surface('#b7c4c7'),0,0,.090,.025,.015,6);
  }
  const forearm=short?skin:mechanical?metal:fabric;
  if(short)join(shoulder,skin,offset(sleeveEnd,point),offset(elbow,point),.079,.072);
  const wristAt=offset(hand,elbow);
  const cuff=wristAt.map(value=>value*.87);
  join(hinge,forearm,origin,cuff,.082,.062);
  if(!short)join(hinge,surface(shade(fabric.color,.57)),cuff,wristAt,.069,.064);
  const palm=group(hinge,...wristAt);
  palm.rotation.x=item?.slot==='offhand'?-.14:v.pose==='wave'&&side===1?-2.65:.16;
  palm.rotation.z=side*(item?-.20:.049);
  oval(palm,mechanical?metal:wrist,0,-.040,.012,.065,.078,.048);
  const fingers=[];
  for(let i=0;i<4;i++){
    const finger=oval(palm,wrist,-.039+i*.023,item?-.077:-.101+(i===0?.019:0),item?.052:.011,.015,.043,.017);
    finger.rotation.x=item?-.78:.044;
    fingers.push(finger);
  }
  oval(palm,wrist,-side*.050,-.046,.044,.024,.045,.019).rotation.z=side*.38;
  const prop=item?heldItem(palm,item,undefined,side):null;
  if(prop)prop.root.position.set(0,item.id.includes('lantern')?-.088:-.052,.066);
  return {shoulder,hinge,palm,fingers,side,prop,
    wristRest:palm.rotation.x,rollRest:palm.rotation.z,fingerRest:item?-.78:.044};
}

export function buildAvatar(recipe){
  const outfits=normalizeBody(recipe);
  const model=outfits.model;
  const shape=BODY[model];
  const mechanical=['armor','automaton','scout','radio'].includes(model);
  const specter=model==='specter'||model==='marsh';
  const cosmetics=Object.fromEntries(Object.entries(recipe.cosmetics||{}).flatMap(([slot,id])=>{
    const item=BY_ID.get(id);
    return item&&fitsBody(recipe,item)?[[slot,item]]:[];
  }));
  const tint=avColor('skin',recipe.skin)||'#dbad86';
  const palette={
    skin:specter?new THREE.Color(tint).lerp(new THREE.Color(model==='marsh'?'#598e61':'#73a086'),.74):tint,
    cloth:avColor('shirt',recipe.shirt)||'#62663d',
    hair:avColor('hair',recipe.hair)||'#513020',
    eye:cosmetics.eyes?rewardPigment(cosmetics.eyes):(avColor('eyes',recipe.eyes)||'#513421')
  };
  if(cosmetics.hair)palette.rewardHair=rewardPigment(cosmetics.hair);
  const wardrobe={
    top:cosmetics.top?.cut||recipe.garment,topColor:cosmetics.top?.color||cosmetics.bodypart?.color,
    outer:cosmetics.outerwear?.cut||outfits.outerwear,
    outerColor:cosmetics.outerwear?.color||{denim:'#526e87',trench:'#a27a53',raincoat:'#70856b',cape:'#6c4b72'}[outfits.outerwear],
    bottoms:cosmetics.bottoms?.cut||outfits.bottoms,
    shoes:cosmetics.footwear?.cut||outfits.footwear,shoeColor:cosmetics.footwear?.color,
    belt:cosmetics.waist?.cut||outfits.waist,beltColor:cosmetics.waist?.color,
    gloves:cosmetics.hands?.cut||outfits.hands,gloveColor:cosmetics.hands?.color,
    neck:cosmetics.neckwear?.cut||((recipe.accessory==='scarf'&&outfits.neckwear==='none')?'scarf':outfits.neckwear),
    neckColor:cosmetics.neckwear?.color,bag:cosmetics.back?.cut||outfits.back,bagColor:cosmetics.back?.color,
    mechanical,armor:model==='armor',plate:cosmetics.bodypart
  };
  const root=group(null);
  const figure=group(root);
  // Shift the whole organic upper silhouette, not merely the head/hand decals.
  // Rotating the rig preserves the parent-child chain for hats, hands and held props;
  // machines retain rigid mechanical posture and the feet stay close to the floor.
  const lean=recipe.pose==='tilt'&&!mechanical?0.077:0;
  figure.rotation.z=lean;
  figure.userData.studioActingLean=lean;
  const body={...shape,width:shape.width*(1+(Number(outfits.build)||0)*.078)};
  figure.scale.y=shape.height*(1+(Number(outfits.height)||0)*.042);
  const color=cosmetics.bottoms?.color||{overalls:'#4b6878',dress:palette.cloth,pleats:'#a35757',flares:'#7b5653',slacks:'#575667',cuffs:'#596c6e'}[wardrobe.bottoms];
  pants(figure,wardrobe.bottoms,color,body,wardrobe.shoes,wardrobe);
  const materials=torso(figure,recipe,wardrobe,palette,body);
  const neck=surface(mechanical?'#a9afb7':palette.skin,{metalness:mechanical?.5:0});
  join(figure,neck,[0,2.020,0],[0,2.304,0],.113,mechanical?.089:.101);
  const head=group(figure,model==='armor'?-.032:0,2.440,0);
  head.rotation.y={detective:.065,mechanic:-.075,sleuth:.08,specter:-.115,marsh:.17,armor:-.04,scout:.10,radio:.08}[model]||0;
  head.rotation.z={detective:-.055,mechanic:.035,sleuth:-.079,specter:.048,marsh:.06,radio:-.043}[model]||0;
  if(model==='detective')head.scale.set(.99,1.015,1.00);
  if(model==='mechanic')head.scale.set(1.07,.99,1.07);
  if(model==='sleuth')head.scale.set(1,.99,.985);
  if(model==='specter')head.scale.set(.90,1.075,.965);
  if(model==='marsh')head.scale.set(1.02,1.065,1.09);
  if(model==='armor')head.rotation.z=-.10;
  if(recipe.pose==='tilt')head.rotation.z=-.205;
  sculptFace(head,recipe,palette,{mechanical,armor:model==='armor',scout:model==='scout',radio:model==='radio',marsh:model==='marsh',specter,
    headCovered:Boolean(cosmetics.hat||(recipe.hat&&recipe.hat!=='none')||recipe.accessory==='crown'),
    jawTune:Number(outfits.jaw)||0,eyeSpacing:Number(outfits.eye_spacing)||0,
    styleReward:cosmetics.hair,eyeReward:cosmetics.eyes});
  const gearFit={round:1.08,square:1.07,long:.92,heart:1.015,angular:.99,oval:1}[recipe.face]||1;
  const gear=cosmetics.eyewear;
  if(gear){
    if(gear.tags?.includes('patch')){
      oval(head,surface(rewardPigment(gear)),.112,.014,.214,.064,.044,.029);
      stroke(head,surface(dark),[[-.221,.030,.005],[-.088,.055,.194],[.152,.014,.230],[.228,.059,-.004]],.009,20);
    }else{
      const kind=gear.cut|| (gear.id.includes('visor')||gear.id.includes('pixel')?'visor':gear.id.includes('heart')?'cat-eye':'round');
      addGlasses(head,kind,rewardPigment(gear),gear.id.includes('monocle'),gearFit);
    }
  }else if(!mechanical)addGlasses(head,recipe.glasses==='none'&&recipe.accessory==='glasses'?'round':recipe.glasses,'#6b4948',false,gearFit);
  const headwear=cosmetics.hat||recipe.hat;
  const hat=studioHat(head,headwear,recipe.accessory);
  const visor=(cosmetics.bodypart?.id==='carnival-visor-plate'||cosmetics.bodypart?.art==='visor')?controlVisor(head,rewardPigment(cosmetics.bodypart)):null;
  const arms=[arm(figure,-1,recipe,body,wardrobe,palette,materials,cosmetics.prop),
    arm(figure,1,recipe,body,wardrobe,palette,materials,cosmetics.offhand)];
  const props=arms.flatMap(arm=>arm.prop?[arm.prop]:[]);
  const pet=cosmetics.companion&&buildCompanion(cosmetics.companion);
  if(pet){pet.root.position.set(.897,0,.242);pet.home=pet.root.position.clone();root.add(pet.root);}
  if(model==='marsh'){
    const tail=group(figure,0,1.16,-.16);
    stroke(tail,surface('#557760'),[[0,0,0],[-.09,-.20,-.29],[-.21,-.36,-.46],
      [-.41,-.30,-.48],[-.50,-.215,-.43]],.059,22);
    for(let i=0;i<3;i++)oval(tail,surface('#8fac6f'),-.29-i*.07,-.32+i*.025,-.50,.064,.029,.034);
  }
  const aura=cosmetics.effect&&makeAura(figure,cosmetics.effect);
  return {root,figure,head,pet,aura,arms,props,hat,visor,cosmetics,capeParts:materials.capeParts,headTilt:head.rotation.z};
}

