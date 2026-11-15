import {THREE,attach,band,box,color,group,hash,join,medallion,oval,shade,shell,stroke,surface} from './avatar-studio-geometry.mjs?v=workshop1';
import {petBehavior} from './avatar-prize-actions.mjs?v=workshop1';

const collection=['#b76e61','#63968f','#9686b4','#d3aa67','#647ca8','#b880a0','#93a56f','#b77652','#6499ab','#b395c7'];
const brass='#d4ab6a',iron='#3a3d50',ink='#272838',silver='#a5b8c1';
const angle=i=>i*Math.PI/4;
export function rewardPigment(item){
  const prominent=item.tags?.find(tag=>['fire','space','water','gold','moon','plant','retro','royal','science','neon'].includes(tag));
  const themes={fire:['#dd8158','#cc615b','#c66a53'],space:['#8279a6','#6a92ad','#6e8d9e'],
    water:['#5c9aa3','#7399be','#6bafa1'],gold:['#cfad6c','#c49f67','#dabc87'],
    moon:['#bac5ca','#ad9ec7','#a1b2d2'],plant:['#91a071','#83a175','#75a58f'],
    retro:['#8e769e','#bc815f','#8d9b66'],royal:['#a1779f','#bd9165','#9f7698'],
    science:['#629a96','#79a3aa','#879ac4'],neon:['#66b3ab','#a788c9','#cf92ac']};
  const range=themes[prominent]||collection;
  if(item.color)return item.color;
  const seed=hash(item.id);
  return color(range[seed%range.length])
    .offsetHSL(((seed>>>8)%53-26)*.0026,((seed>>>15)%19-9)*.009,((seed>>>20)%37-18)*.005)
    .getStyle();
}

function hatBrim(head,pigment,hat,kind){
  const fabric=surface(pigment),lining=surface(shade(pigment,.63)),bandMat=surface(shade(pigment,.71));
  const cowboy=kind==='western';
  const bowler=kind==='bowler';
  const point=kind==='pointed';
  const cap=kind==='cap';
  const beret=kind==='beret';
  const y=cap?.235:.238;
  if(cap){
    oval(head,fabric,0,.247,-.015,.251,.106,.216);
    oval(head,lining,.017,.227,.179,.234,.016,.162).rotation.x=-.14;
    oval(head,bandMat,0,.354,-.028,.022,.012,.023);
    for(const s of [-1,1])stroke(head,bandMat,[[s*.109,.336,.086],[s*.170,.294,.083],[s*.206,.248,.054]],.0048);
  }else if(beret){
    oval(head,lining,.008,.259,-.023,.234,.053,.199);
    oval(head,fabric,-.045,.309,-.027,.279,.067,.227).rotation.z=.15;
    oval(head,bandMat,-.091,.379,-.046,.020,.023,.017);
  }else{
    if(!['beanie','helmet'].includes(kind)){
      const rim=cowboy?.373:point?.329:bowler?.285:.317;
      const brim=oval(head,lining,0,y,-.012,rim,cowboy?.041:.022,rim*.79);
      brim.rotation.z=cowboy?.06:0;
      if(cowboy){
        for(const s of [-1,1])oval(head,fabric,s*.232,y+.026,-.004,.177,.027,.176).rotation.z=s*.27;
      }
    }
    const h=point?.302:cowboy?.167:kind==='helmet'?.192:.135;
    const peak=point?.014:cowboy?.142:kind==='helmet'?.092:bowler?.118:.073;
    const crown=shell(head,fabric,[[y-.018,.241,.211],[y+.019,.239,.202],[y+h*.51,.213,.191],
      [y+h*.85,peak,.135],[y+h,.022,.028]],{segments:40,warp([x,ny,z],a,i){
        return [x+(point?.130*(i/4)**2:0),ny-(cowboy&&i>2?Math.abs(Math.cos(a))*.018:0),z];
      }});
    crown.material.side=THREE.DoubleSide;
    shell(head,bandMat,[[y+.015,.242,.203],[y+.054,.234,.200]],{segments:36});
  }
  if(hat){
    const pin=surface(brass,{metalness:.64,roughness:.38});
    const medal=medallion(head,pin,0,y+.054,.210,.041,.018,6+(hash(hat.id)%4));
    medal.rotation.y=.12;
  }
}

function crown(head,hat,pigment){
  const metal=surface(shade(pigment,1.24),{metalness:.65,roughness:.36});
  const jewel=surface(pigment,{metalness:.24,roughness:.23,emissive:pigment,emissiveIntensity:.095});
  const flames=hat?.tags?.includes('dragon');
  shell(head,metal,[[.240,.239,.207],[.280,.234,.199],[.318,.243,.204]],{segments:48});
  for(let i=0;i<(flames?7:8);i++){
    const a=i/(flames?7:8)*2*Math.PI;
    const x=Math.sin(a),z=Math.cos(a);
    const tip=[x*.257,.368+(i%2?.026:.063),z*.219];
    join(head,metal,[x*.228,.292,z*.189],tip,.031,.010,8);
    oval(head,jewel,...tip,.026,.022,.021);
  }
  medallion(head,jewel,0,.291,.219,.052,.025,6);
}

export function studioHat(head,hat,accessory){
  if((!hat||hat==='none')&&accessory!=='crown')return null;
  const root=group(head);
  root.userData.studioPart='gear';
  const custom=typeof hat==='object'?hat:null;
  const pigment=custom?rewardPigment(custom):hat==='western'?'#8f5c46':hat==='cap'?'#637c91':hat==='beanie'?'#7f658f':'#9f514e';
  const id=custom?.id||String(hat);
  const kind=custom?(id.includes('cowboy')||custom.tags?.includes('western')?'western':
    /wizard|witch|mushroom|cone/.test(id)?'pointed':/top|bowler/.test(id)?'bowler':
    /helmet|space|robot|helmet|alien/.test(id)?'helmet':/cap|pilot/.test(id)?'cap':
    /beret/.test(id)?'beret':'brim'):hat;
  if(id.includes('crown')||hat==='none'&&accessory==='crown')crown(root,custom,pigment);
  else if(id==='giant-taco-hat'){
    const shellMaterial=surface('#eab66e'),base=surface('#a56949'),lettuce=surface('#8e9d62');
    oval(root,shellMaterial,.008,.324,.004,.315,.140,.129).rotation.z=.12;
    oval(root,base,.019,.407,-.009,.256,.071,.071).rotation.z=.12;
    for(let i=0;i<10;i++){
      const x=-.221+i*.048;
      oval(root,lettuce,x,.417+.072*(1-(x/.27)**2),.007,.051,.045,.036).rotation.z=i*.65;
      if(i%2)box(root,surface('#bb6b5b'),x,.445+.053*(1-(x/.3)**2),.037,.049,.033,.029).rotation.z=i*.51;
    }
  }else hatBrim(root,pigment,custom,kind);
  if(id.includes('alien')){
    const metal=surface(brass,{metalness:.52}),tip=surface('#91d8b5',{emissive:'#71ad9a',emissiveIntensity:.35});
    for(const side of [-1,1]){
      join(root,metal,[side*.101,.343,-.015],[side*.220,.512,-.019],.018,.010);
      oval(root,tip,side*.220,.512,-.019,.041,.042,.037);
    }
  }
  // Reward headwear gets a readable silhouette, not only a new hat pigment.
  if(/viking|norse|horned/.test(id)){
    const horn=surface('#e6d6ac'),base=surface('#615368');
    for(const side of [-1,1]){
      oval(root,base,side*.211,.340,.003,.066,.066,.082);
      const points=[[side*.209,.367,.008],[side*.281,.390,.006],
        [side*.350,.432,-.015],[side*.390,.510,-.029]];
      for(let i=0;i<points.length-1;i++)
        join(root,horn,points[i],points[i+1],.044-i*.009,.036-i*.009,16);
      oval(root,horn,...points.at(-1),.009,.018,.011);
    }
  }
  if(id.includes('rubber-chicken')){
    const feather=surface('#e9b76b'),comb=surface('#c86c69'),beak=surface('#d98d4d');
    const neck=group(root,.154,.375,.029);
    oval(neck,feather,0,.091,0,.075,.152,.067).rotation.z=-.22;
    oval(neck,feather,.025,.222,.015,.077,.079,.065);
    for(let i=0;i<3;i++)oval(neck,comb,-.015+i*.025,.292+i%2*.008,.011,.025,.034,.018);
    oval(neck,beak,.093,.205,.044,.065,.027,.045);
    oval(neck,surface('#272535'),.045,.235,.071,.008,.012,.006);
  }
  if(/dragon|monster|gargoyle/.test(id)&&!id.includes('crown')){
    const ridge=surface(shade(pigment,1.36));
    for(const side of [-1,1]){
      join(root,ridge,[side*.170,.332,-.011],[side*.270,.429,-.047],.054,.005,12);
      oval(root,ridge,side*.232,.364,.061,.048,.025,.030);
    }
  }
  if(/space|moon|orbit|galaxy|saturn|cosmic/.test(id)){
    const orbit=surface('#ddc18a'),sparkle=surface('#93c8cd');
    const ring=band(root,orbit,0,.370,.004,.213,.012,1.20,.37);
    ring.rotation.z=-.25;
    medallion(root,sparkle,.054,.376,.159,.034,.012,6);
    for(const x of [-.126,.136])oval(root,sparkle,x,.384,.138,.013,.014,.010);
  }
  if(/flor|rose|flower|petal|garden/.test(id)){
    const flower=surface('#cf8d91'),center=surface('#ebc278');
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      const bud=oval(root,flower,.106+.040*Math.cos(a),.343+.040*Math.sin(a),.183,
        .031,.032,.015);
      bud.rotation.z=a;
    }
    oval(root,center,.106,.343,.206,.021,.020,.014);
  }
  if(/robot|cyber|circuit|clockwork/.test(id)){
    const signal=surface('#a3e1d2',{emissive:'#78b9a4',emissiveIntensity:.25});
    const metal=surface('#9c9fac');
    stroke(root,metal,[[-.164,.296,.178],[-.096,.355,.193],[.066,.357,.202]],.010);
    for(const x of [-.136,.060])oval(root,signal,x,.358,.207,.019,.014,.010);
  }
  return root;
}

function dagger(node,alloy,material,trim){
  const coords=[[-.066,.113],[.066,.113],[.049,.553],[.006,.655],[-.051,.553]];
  const shape=new THREE.Shape(coords.map(([x,y])=>new THREE.Vector2(x,y)));
  const blade=new THREE.ExtrudeGeometry(shape,{depth:.025,steps:1,bevelEnabled:true,bevelSize:.011,bevelThickness:.010,bevelSegments:2});
  attach(node,blade,alloy,0,0,-.01);
  stroke(node,trim,[[0,.124,.031],[.001,.406,.031],[.001,.585,.019]],.0058);
  box(node,trim,0,.103,.012,.230,.046,.058).rotation.z=-.09;
  join(node,material,[0,-.157,.002],[0,.080,.002],.030,.028,20);
  oval(node,trim,0,-.156,0,.043,.037,.041);
}

function metalLantern(node,alloy,pigment){
  const glass=new THREE.MeshPhysicalMaterial({color:'#eac788',emissive:'#efb149',emissiveIntensity:.95,
    transparent:true,opacity:.81,roughness:.34,depthWrite:true});
  const inner=surface('#fff0b7',{emissive:'#fbc253',emissiveIntensity:1.4});
  const y=-.263;
  stroke(node,alloy,[[-.087,y+.177,0],[-.084,y+.258,0],[0,y+.307,0],[.086,y+.252,0],[.088,y+.173,0]],.014);
  box(node,alloy,0,y-.146,0,.193,.032,.163);
  box(node,alloy,0,y+.122,0,.177,.035,.156);
  box(node,glass,0,y-.004,0,.144,.23,.129);
  oval(node,inner,0,y-.023,0,.051,.083,.049);
  for(const x of [-.081,.081])for(const z of [-.059,.059])
    join(node,alloy,[x,y-.146,z],[x,y+.111,z],.009);
  oval(node,surface(pigment,{metalness:.55}),0,y+.143,0,.084,.039,.074);
  return glass;
}

export function heldItem(parent,item,point=[0,0,0],side=-1){
  const root=group(parent,point[0],point[1]-.043,point[2]+.100);
  root.userData.studioPart='gear';
  root.rotation.set(.11,side*.11,-side*.22);
  const shape=group(root);
  const id=item.id,pigment=rewardPigment(item);
  const material=surface(pigment,{roughness:.59}),edge=surface(brass,{metalness:.67,roughness:.34});
  const alloy=surface('#b9d4d0',{roughness:.35,metalness:.58});
  const dark=surface('#463848'),high=surface(shade(pigment,1.45),{roughness:.52});
  let glow=null,trail=null,movable=null;
  if(item.art==='telescope'){
    join(shape,dark,[0,-.15,.01],[0,.11,.01],.035,.039);
    join(shape,edge,[-.19,.15,.031],[.24,.15,.031],.062,.077,28);
    movable=group(shape,.20,.15,.031);
    join(movable,edge,[0,0,0],[.16,0,0],.061,.069,26);
    join(movable,material,[.148,0,0],[.185,0,0],.083,.083,28);
    glow=surface('#9ad1db',{emissive:'#fbd897',emissiveIntensity:.17});
    join(movable,glow,[.184,0,0],[.190,0,0],.061,.061,26);
    join(shape,dark,[-.27,.15,.031],[-.19,.15,.031],.040,.054,22);
    for(const x of [-.123,.033,.18])join(shape,alloy,[x,.15,.031],[x+.014,.15,.031],.073,.073,26);
  }else if(item.art==='compass'){
    const paper=surface('#f4dca2');
    medallion(shape,edge,0,-.015,0,.100,.057,32);
    medallion(shape,paper,0,-.015,.032,.084,.010,28);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      const tick=box(shape,dark,Math.sin(a)*.070,-.015+Math.cos(a)*.070,.040,.006,i%3?.009:.019,.007);
      tick.rotation.z=-a;
    }
    movable=group(shape,0,-.015,.048);
    join(movable,surface('#ac4e53'),[0,-.018,.002],[0,.058,.002],.015,.001,8);
    join(movable,surface('#465b70'),[0,.015,.002],[0,-.054,.002],.014,.001,8);
    medallion(movable,edge,0,0,.007,.011,.01,8);
    band(shape,edge,0,.115,.008,.021,.008);
  }else if(item.art==='flashlight'){
    join(shape,material,[0,-.15,0],[0,.08,0],.043,.045,24);
    join(shape,edge,[0,.07,0],[0,.157,0],.043,.070,26);
    glow=surface('#f3e6ad',{emissive:'#ebb068',emissiveIntensity:.22});
    join(shape,glow,[0,.156,0],[0,.166,0],.061,.062,26);
    box(shape,dark,0,-.034,.044,.018,.038,.011);
  }else if(/sword|saber|dagger/.test(id)){
    glow=surface(pigment,{metalness:.37,roughness:.32,emissive:pigment,emissiveIntensity:.26});
    dagger(shape,glow,dark,edge);
    trail=attach(shape,new THREE.TorusGeometry(.302,.028,10,40,2.75),
      new THREE.MeshBasicMaterial({color:pigment,transparent:true,depthWrite:false,opacity:0}),0,.345,.012);
    trail.visible=false;
  }else if(id.includes('lantern')){
    glow=metalLantern(shape,edge,pigment);
  }else if(id.includes('scanner')){
    const dial=surface('#96e2cc',{emissive:'#4edbb5',emissiveIntensity:.7});
    box(shape,edge,0,.029,0,.159,.249,.089);
    box(shape,dial,0,.057,.053,.122,.105,.022);
    for(let i=0;i<3;i++)box(shape,alloy,-.033+i*.033,-.050,.055,.019,.027,.009);
    join(shape,alloy,[-.060,.151,0],[-.075,.277,0],.013,.008);
    oval(shape,dial,-.075,.283,0,.021,.027,.021);
    glow=dial;
    trail=attach(shape,new THREE.RingGeometry(.15,.22,30,1,-.36,.84),
      new THREE.MeshBasicMaterial({color:'#92e0c5',side:THREE.DoubleSide,transparent:true,depthWrite:false,opacity:0}),0,.053,.18);
    trail.visible=false;
  }else if(/shield|waffle/.test(id)){
    medallion(shape,dark,0,-.065,0,.198,.057,10);
    medallion(shape,edge,0,-.063,.024,.190,.029,10);
    medallion(shape,material,0,-.063,.045,.162,.029,10);
    medallion(shape,alloy,0,-.063,.073,.064,.035,8);
    for(let i=0;i<8;i++)oval(shape,edge,Math.sin(angle(i))*.145,-.063+Math.cos(angle(i))*.145,.077,.014,.014,.009);
  }else if(/book|tablet|arcade|case|camera|radio/.test(id)){
    const book=id.includes('book');
    box(shape,material,0,.043,.032,.258,.309,.099).rotation.z=.16;
    box(shape,book?surface('#e5d6b8'):dark,.011,.042,.090,.23,.259,.023).rotation.z=.16;
    if(book){
      for(let i=0;i<6;i++)box(shape,edge,0,-.050+i*.027,.107,.138-(i%2*.031),.006,.011).rotation.z=.16;
    }else{
      oval(shape,alloy,0,.089,.110,.084,.076,.024);
      oval(shape,high,0,.089,.128,.060,.058,.025);
      box(shape,alloy,0,-.051,.107,.174,.028,.021);
    }
  }else if(/trophy|cup|goblet/.test(id)){
    join(shape,edge,[0,-.093,0],[0,.133,0],.037,.023);
    shell(shape,edge,[[.088,.064,.053],[.164,.094,.082],[.249,.114,.103],[.284,.119,.103]],{segments:28});
    for(const s of [-1,1])band(shape,edge,s*.105,.226,-.002,.056,.011,.78,1.05);
    oval(shape,dark,0,-.113,0,.100,.031,.093);
  }else if(/pizza|taco|cheese|sandwich|cake|donut|ice-cream|popcorn/.test(id)){
    const pie=surface('#d6a569');
    medallion(shape,pie,0,.042,.016,.129,.056,15);
    for(let i=0;i<7;i++)oval(shape,i%3?material:edge,Math.sin(i*2.5)*.083,.04+Math.cos(i*2.5)*.091,.048,.027,.024,.013);
  }else if(/chicken/.test(id)){
    const clay=surface('#e5b66d'),red=surface('#b96b58');
    oval(shape,clay,0,.103,.011,.074,.153,.057).rotation.z=-.21;
    oval(shape,clay,.043,.263,.007,.052,.062,.045);
    oval(shape,red,.064,.329,.006,.018,.063,.034).rotation.z=-.44;
    oval(shape,edge,.100,.273,.012,.033,.019,.024);
    oval(shape,dark,.064,.277,.041,.012,.010,.006);
    for(const s of [-1,1])stroke(shape,red,[[s*.025,-.024,.007],[s*.042,-.117,.012],[s*.061,-.148,.020]],.012);
  }else if(/staff|wand|torch|broom|flower|balloon|fishing/.test(id)){
    const length=id.includes('staff')?.63:.45;
    join(shape,dark,[0,-.137,0],[0,length,0],.019,.014,16);
    const diamond=attach(shape,new THREE.IcosahedronGeometry(.101,0),material,0,length+.033,0);
    diamond.scale.set(.76,1.16,.73);
    band(shape,edge,0,length+.021,0,.113,.012,1,1.16);
  }else{
    const count=5+hash(id)%5;
    join(shape,dark,[0,-.125,0],[0,.167,0],.040,.035);
    const ornament=attach(shape,new THREE.IcosahedronGeometry(.126,1),material,0,.192,.011);
    ornament.scale.set(1,.68+(hash(id)%7)/11,.84);
    band(shape,edge,0,.189,.015,.144,.011,1,.94);
    for(let i=0;i<count;i++){
      const turn=i/count*2*Math.PI;
      oval(shape,high,.133*Math.sin(turn),.191+.129*Math.cos(turn),.018,.019,.020,.019);
    }
  }
  return {root,shape,item,glow,trail,movable};
}

const CREATURES=[
  [/dragon|gargoyle|carnival-bat/,'winged'],
  [/ghost|wisp|moon-jelly/,'phantom'],
  [/robot|ufo|drone|clockwork|gremlin/,'automaton'],
  [/bird|owl|parrot|duck|penguin/,'bird'],
  [/gecko|crocodile|dinosaur|turtle|axolotl|frog/,'reptile'],
  [/koi|octopus|snail|bumble|firefly/,'oddity'],
  [/husky|hound|puppy|pup|fox|raccoon|ferret|cat/,'hunter'],
  [/mouse|hamster|bunny|hedgehog|otter|sheep|alpaca/,'woodland']
];
const ITEM_COATS={
  'trail-husky':['#5e6877','#e9ddd1'], 'fog-hound':['#758d85','#d3e1c7'],
  'bell-tower-gargoyle':['#828d9e','#b8c4ce'], 'wind-up-gremlin':['#9b936a','#a5bfd0'],
  'lamp-house-ghost':['#b4c9c5','#edd8a4'], 'lantern-raccoon':['#737385','#c5b6a3'],
  'moon-fox':['#c5c1dd','#ece2de'], 'rocket-cat':['#bb926f','#e8ccb3'],
  'phantom-puppy':['#9c8cba','#d8c2df']
};

function wing(parent,material,light,sign){
  const g=group(parent,sign*.143,.271,-.079);
  const shape=new THREE.Shape();
  shape.moveTo(0,0);shape.quadraticCurveTo(sign*.07,.214,sign*.230,.245);
  shape.quadraticCurveTo(sign*.181,.13,sign*.258,.102);
  shape.quadraticCurveTo(sign*.205,.085,sign*.171,.013);
  shape.quadraticCurveTo(sign*.131,.042,0,0);
  const membrane=new THREE.ExtrudeGeometry(shape,{depth:.022,bevelSize:.009,bevelThickness:.008,bevelSegments:2});
  attach(g,membrane,material);
  stroke(g,light,[[0,0,.03],[sign*.094,.138,.030],[sign*.228,.246,.022]],.008);
  stroke(g,light,[[sign*.017,.013,.028],[sign*.119,.092,.033],[sign*.257,.104,.028]],.006);
  return g;
}

function critterEyes(head,cream,dark,kind){
  const paint=surface('#e0a46b',{emissive:'#ecab6d',emissiveIntensity:.12});
  for(const side of [-1,1]){
    const x=side*(kind==='bird'?.084:.071);
    oval(head,dark,x,.022,.125,.052,.049,.027);
    oval(head,cream,x,.022,.126,.046,.046,.032);
    oval(head,kind==='winged'?paint:dark,x-side*.012,.018,.153,.023,.028,.014);
    oval(head,cream,x-side*.018,.029,.166,.008,.010,.004);
  }
}

export function buildCompanion(item){
  const id=item.id,species=item.art==='moth'?'moth':CREATURES.find(([match])=>match.test(id))?.[1]||'woodland';
  const [pigment,accent]=ITEM_COATS[id]||[rewardPigment(item),shade(rewardPigment(item),1.61)];
  const shellMat=surface(pigment),cream=surface(accent),
    black=surface('#413548'),bronzeMat=surface(brass,{metalness:.63,roughness:.46});
  const stage=group(null);
  const animal=group(stage),head=group(animal);
  const tails=[],wings=[],ears=[];
  let antenna=null,spark=null,steam=null,perch=0;
  if(id==='bell-tower-gargoyle'||item.art==='gargoyle'){
    perch=.104;
    const stone=surface('#777787'),edge=surface('#aaa5a0');
    attach(stage,new THREE.CylinderGeometry(.208,.231,.088,8),stone,0,.046,.05);
    attach(stage,new THREE.CylinderGeometry(.212,.212,.025,8),edge,0,.090,.05);
    stroke(stage,black,[[-.14,.098,.145],[-.079,.099,.112],[-.025,.100,.119],[.021,.098,.168]],.004);
  }
  if(species==='moth'){
    const fur=surface('#86625b');
    oval(animal,fur,0,.29,-.002,.070,.155,.071);
    oval(animal,cream,0,.212,.032,.052,.082,.047);
    head.position.set(0,.441,.025);
    oval(head,shellMat,0,0,0,.096,.078,.072);
    for(const side of [-1,1]){
      oval(head,black,side*.043,-.001,.067,.021,.026,.014);
      oval(head,cream,side*.047,.009,.080,.007,.009,.005);
      stroke(head,bronzeMat,[[side*.033,.055,.010],[side*.079,.111,-.011],[side*.103,.127,-.047]],.008);
      oval(head,cream,side*.103,.127,-.047,.013,.015,.011);
      const hinge=group(animal,side*.036,.268,-.006);
      const outline=new THREE.Shape();
      outline.moveTo(0,0);
      outline.bezierCurveTo(side*.11,.232,side*.31,.247,side*.329,.119);
      outline.bezierCurveTo(side*.361,.021,side*.217,-.069,side*.139,-.013);
      outline.bezierCurveTo(side*.237,-.130,side*.110,-.184,side*.035,-.082);
      outline.lineTo(0,0);
      attach(hinge,new THREE.ExtrudeGeometry(outline,{depth:.009,bevelSize:.006,bevelSegments:1,bevelThickness:.005}),shellMat);
      const patch=oval(hinge,fur,side*.215,.105,.019,.074,.052,.013);patch.rotation.z=side*.42;
      oval(hinge,cream,side*.215,.107,.030,.031,.026,.005);
      stroke(hinge,cream,[[side*.028,.004,.021],[side*.128,.113,.020],[side*.285,.134,.020]],.006);
      wings.push(hinge);
    }
    for(const side of [-1,1])join(animal,fur,[side*.026,.170,.01],[side*.054,.089,.035],.015,.008,8);
  }else if(species==='phantom'){
    const sheen=surface(pigment,{roughness:.35,emissive:pigment,emissiveIntensity:.22});
    shell(animal,sheen,[[.10,.005,.028,.095],[.14,.168,.132],[.225,.185,.126],
      [.363,.147,.149],[.477,.149,.133],[.55,.098,.105],[.585,.002,.002]],
    {segments:40,warp([x,y,z],a,i){return [x,y+Math.sin(a*4)*.024*(1-i/7),z];}});
    head.position.set(0,.392,.046);
    critterEyes(head,cream,black,'phantom');
    oval(head,bronzeMat,0,.077,-.065,.101,.022,.102);
    oval(head,surface('#ffdf8e',{emissive:'#daa15d',emissiveIntensity:.7}),0,.126,-.061,.052,.043,.046);
    for(const s of [-1,1])oval(animal,sheen,s*.176,.269,.005,.084,.045,.061).rotation.z=s*-.44;
  }else if(species==='automaton'){
    const steel=surface(pigment,{metalness:.52,roughness:.38});
    box(animal,steel,0,.222,0,.363,.272,.335);
    box(animal,cream,0,.232,.158,.284,.207,.056);
    box(animal,black,0,.230,.197,.169,.066,.040);
    for(const x of [-.097,.097])box(animal,bronzeMat,x,.070,.055,.145,.120,.199);
    head.position.set(0,.438,0);
    box(head,steel,0,0,0,.384,.206,.335);
    box(head,black,0,.023,.165,.345,.108,.034);
    const signal=surface('#92c9af',{emissive:'#70caa0',emissiveIntensity:.49});
    for(const s of [-1,1]){
      oval(head,signal,s*.090,.026,.185,.040,.029,.015);
      join(animal,steel,[s*.171,.265,0],[s*.239,.121,.031],.042,.040);
      oval(animal,bronzeMat,s*.239,.113,.036,.056,.049,.052);
    }
    join(head,bronzeMat,[0,.095,-.024],[.052,.206,-.030],.012,.010);
    antenna=oval(head,signal,.052,.213,-.030,.028,.028,.026);
    if(id==='wind-up-gremlin'){
      spark=attach(head,new THREE.OctahedronGeometry(.026),
        new THREE.MeshBasicMaterial({color:'#f4d575',transparent:true,depthWrite:false,opacity:0}),
        .065,.264,-.031);
      spark.visible=false;
    }
    const key=group(animal,0,.225,-.185);
    box(key,bronzeMat,0,0,-.030,.051,.051,.091);
    band(key,bronzeMat,.050,0,-.087,.050,.013);
    band(key,bronzeMat,-.050,0,-.087,.050,.013);
    tails.push(key);
  }else{
    const bird=species==='bird',flier=species==='winged',
      reptile=species==='reptile',mammal=species==='hunter'||species==='woodland';
    const longLegs=id.includes('hound');
    const bodyHeight=bird||flier?.260:longLegs?.270:.223;
    const silhouette=1+(hash(id)%8-3)*.028;
    oval(animal,shellMat,0,bodyHeight,-.079,.148*silhouette,.144,.265*silhouette);
    oval(animal,cream,0,bodyHeight,.093,.105,.110,.143);
    const pads=surface(shade(pigment,.69));
    if(!bird||id.includes('duck')||id.includes('penguin')){
      for(const s of [-1,1])for(const end of [-1,1]){
        if(bird&&end===-1)continue;
        const x=s*.104,z=end*.146-.021;
        const shank=longLegs?.224:.156;
        join(animal,shellMat,[x,.076,z],[x*.88,shank+.090,z],.037,.047);
        oval(animal,pads,x,.056,z+.042,.060,.050,.077);
        for(let toe=0;toe<2;toe++){
          oval(animal,cream,x+(toe-.5)*.038,.026,z+.095,.016,.016,.025);
        }
      }
    }else for(const s of [-1,1])oval(animal,bronzeMat,s*.089,.047,.093,.077,.038,.087);
    head.position.set(0,.408+(flier||longLegs?.043:0),.094);
    const headSize=bird?.207:.168;
    oval(head,shellMat,0,0,-.019,headSize,.135,.147);
    critterEyes(head,cream,black,bird?'bird':flier?'winged':'woodland');
    if(bird||flier)for(const s of [-1,1]){
      wings.push(wing(animal,shellMat,cream,s));
      if(flier)join(head,bronzeMat,[s*.092,.087,-.027],[s*.163,.205,-.031],.035,.005,12);
    }
    if(!flier&&mammal){
      const long=id.includes('hound')||id.includes('bunny');
      for(const s of [-1,1]){
        const droop=id==='fog-hound';
        const ear=group(head,s*.111,long?.140:.121,-.046);
        ear.rotation.z=s*(droop?.51:long?.30:.37);
        oval(ear,shellMat,0,droop?-.076:.022,0,.052,droop?.147:long?.118:.087,.037);
        oval(ear,cream,0,droop?-.075:.024,.024,.029,droop?.109:long?.083:.052,.020);
        ears.push({ear,roll:ear.rotation.z});
      }
    }
    if(reptile)for(const s of [-1,1]){
      oval(head,shellMat,s*.112,.090,.055,.057,.062,.058);
      if(id.includes('axolotl'))for(let i=0;i<3;i++){
        join(head,cream,[s*.148,.027+i*.024,-.028],[s*(.208+i*.013),.086+i*.039,-.069],.015,.007,12);
      }
    }
    oval(head,bird?bronzeMat:cream,0,flier?-.073:-.046,.128,bird?.092:.103,bird?.031:.051,bird?.060:.084);
    if(!bird){
      oval(head,black,0,-.039,.203,.045,.026,.034);
      stroke(head,black,[[-.044,-.083,.188],[0,-.093,.205],[.044,-.080,.190]],.005);
    }
    if(id==='fog-hound'||item.art==='hound'){
      for(const side of [-1,1]){
        stroke(head,black,[[side*.044,.071,.154],[side*.074,.084,.158],[side*.108,.065,.136]],.007);
        join(head,cream,[side*.057,-.055,.159],[side*.039,-.062,.225],.031,.019);
      }
      const layer=group(stage);
      const paint=new THREE.MeshBasicMaterial({color:'#c4e9dd',transparent:true,depthWrite:false,opacity:0});
      const curls=Array.from({length:4},(_,i)=>stroke(layer,paint,
        [[-.045,.00,-.03],[-.013,.013,.011],[.039,.003,.022],[.026,-.004,.070]],.010+i*.001));
      steam={layer,paint,curls};
    }
    if(!bird){
      const tail=group(animal,0,bodyHeight-.028,-.267);
      const curl=id.includes('hound')||id.includes('husky');
      stroke(tail,shellMat,[[0,0,0],[.049,.035,-.098],[.097,.084,-.161],
        [.108,curl?.243:.164,-.169],[.035,curl?.253:.184,-.192]],reptile?.034:.049,20);
      oval(tail,cream,.035,curl?.253:.184,-.192,.041,.050,.044);
      tails.push(tail);
    }
    if(reptile&&id.includes('turtle'))oval(animal,cream,0,.286,-.123,.177,.154,.225);
    // Distinctive species acting marks carry through to thumbnail scale.
    if(id.includes('raccoon')){
      const mask=surface(shade(pigment,.53));
      for(const side of [-1,1]){
        oval(head,mask,side*.074,.023,.138,.067,.064,.035);
        oval(head,cream,side*.074,.033,.169,.026,.029,.012);
        oval(head,black,side*.069,.033,.184,.014,.016,.008);
      }
      for(let i=0;i<3;i++)oval(animal,mask,.061,.243,-.284-i*.042,.031,.025,.021);
    }
    if(id.includes('fox')){
      const snow=surface('#f4dfc6');
      for(const side of [-1,1]){
        const ear=oval(head,shellMat,side*.115,.150,-.037,.052,.084,.038);
        ear.rotation.z=side*-.24;
        oval(head,snow,side*.113,.148,-.001,.023,.047,.012).rotation.z=side*-.24;
      }
      oval(head,snow,0,-.073,.141,.072,.036,.032);
    }
    if(id.includes('gargoyle')){
      const stone=surface('#b3b4b6'),dark=surface('#4e5462');
      for(const side of [-1,1]){
        join(head,stone,[side*.124,.093,-.025],[side*.186,.214,-.089],.050,.005,14);
        stroke(head,dark,[[side*.026,.067,.155],[side*.072,.084,.159],
          [side*.115,.064,.132]],.008,12);
      }
      oval(head,stone,0,-.106,.108,.074,.029,.045);
    }
    if(id.includes('husky')||id.includes('hound')){
      for(const side of [-1,1])
        stroke(head,cream,[[side*.032,.081,.158],[side*.081,.106,.128],
          [side*.117,.067,.087]],.017,14);
    }
    if(id.includes('axolotl')){
      for(const side of [-1,1])for(let j=0;j<3;j++)
        oval(head,cream,side*(.160+j*.011),.066+j*.045,-.028-j*.013,.021,.029,.015);
    }
  
    if(id.includes('raccoon')||id.includes('ferret')){
      for(const s of [-1,1])stroke(head,surface(shade(pigment,.63)),
        [[s*.097,-.004,.116],[s*.141,.056,.064],[s*.155,.040,.007]],.024);
    }
    if(!bird&&!flier){
      shell(animal,bronzeMat,[[bodyHeight-.015,.116,.105,0,.134],
         [bodyHeight+.017,.117,.105,0,.132]],{segments:24});
      medallion(animal,bronzeMat,0,bodyHeight-.084,.237,.034,.012,6);
    }
  }
  animal.position.y=perch;
  return {root:stage,animal,head,tails,wings,ears,antenna,spark,steam,perch,species,item};
}

export function poseCompanion(pet,time,motion){
  if(!pet)return;
  const p=motion?.progress??0,amount=motion?Math.sin(p*Math.PI):0;
  // Calm species-specific life between tricks, without affecting the ownership record.
  const idle=!motion&&time>0&&Number.isFinite(time);
  const sway=idle?Math.sin(time*(pet.species==='automaton'?1.92:.84)):0;
  const float=idle?(pet.species==='phantom'?.022:pet.species==='automaton'?.004:.008)*sway:0;
  const action=motion?.action||'play';
  const trick=action==='trick',gesture=action==='pet';
  const move=petBehavior(pet.item,trick?'trick':gesture?'pet':'play').move;
  const seek=action==='sniff'||action==='scan';
  const target=motion?.target;
  const aim=target?Math.atan2(target.x,target.z-pet.head.position.z):0;
  const lean=Math.max(-1.34,Math.min(1.34,aim))*amount;
  const bounce=move==='hop'?Math.sin(p*Math.PI)**2:amount;
  const activeHeight=action==='scan'?.072:gesture||seek?0:trick?.23:.10;
  const wingPose=pet.species==='moth'?(action==='perch'?.78:amount>.03?Math.sin(p*28)*.80:.22):pet.perch?1.16-bounce*.95:.17+amount*Math.cos(p*19)*.60;
  pet.animal.position.set(Math.sin(lean)*.081,pet.perch+(pet.species==='phantom'?.022:pet.species==='moth'?-.085:0)+bounce*activeHeight+float,
    move==='glide'&&!seek?amount*.12:0);
  pet.animal.rotation.z=move==='wobble'?Math.sin(p*13)*amount*.16:0;
  pet.head.rotation.set((gesture||action==='sniff'?.26:-.10)*amount+(idle?.018*Math.sin(time*.5):0),
    lean+(seek?0:Math.sin(time*2.3)*.07*amount)+(idle?.045*Math.sin(time*.63):0),-.15*amount);
  for(const [i,w] of pet.wings.entries())w.rotation.y=(i===0?-1:1)*(wingPose+(idle?Math.sin(time*.71)*.035:0));
  for(const {ear,roll} of pet.ears)ear.rotation.z=roll+Math.sign(roll)*amount*.16+(idle?.023*sway:0);
  for(const t of pet.tails)t.rotation.y=amount*Math.sin(p*16)*.52+(idle?Math.sin(time*.88)*.13:0);
  if(pet.species==='automaton'){
    pet.tails[0].rotation.z=seek||trick?p*Math.PI*4:amount*.41;
    pet.antenna.material.emissiveIntensity=.43+(seek||trick?amount*1.6:0)+(idle?.11*(1+sway):0);
    pet.antenna.scale.set(.028*(1+amount*.26),.028*(1+amount*.26),.026*(1+amount*.26));
  }
  if(pet.spark){
    pet.spark.visible=(seek||trick)&&amount>.05;
    pet.spark.material.opacity=amount*.91;
    pet.spark.rotation.z=p*7.2;
    pet.spark.scale.set(.8+amount,.7+amount*1.9,.7);
  }
  if(pet.steam){
    const {layer,paint,curls}=pet.steam;
    layer.visible=Boolean(motion&&!gesture&&amount>.015);
    paint.opacity=amount*.63;
    layer.position.set(Math.sin(lean)*.25,.061,Math.cos(lean)*.29);
    layer.rotation.y=lean;
    for(const [i,curl] of curls.entries()){
      const drift=(p+i*.067);
      curl.position.set(Math.sin(i*3.2+p*6)*.033,.008+i*.011,.052*i+drift*.14);
      curl.scale.setScalar(.86+drift*.35);
    }
  }
}

export function makeAura(parent,item){
  const root=group(parent,0,1.47,0);
  const pigment=rewardPigment(item);
  const lamp=new THREE.MeshBasicMaterial({color:pigment,transparent:true,opacity:.79});
  const hot=new THREE.MeshBasicMaterial({color:shade(pigment,1.46),transparent:true,opacity:.77});
  const n=7+hash(item.id)%9,points=[];
  for(let i=0;i<n;i++){
    const a=i/n*2*Math.PI;
    const mote=attach(root,new THREE.OctahedronGeometry(.032+i%3*.007),i%2?lamp:hot,
      Math.sin(a)*.865,.410*Math.cos(i*3.2),Math.cos(a)*.73);
    points.push(mote);
  }
  return {root,points};
}
