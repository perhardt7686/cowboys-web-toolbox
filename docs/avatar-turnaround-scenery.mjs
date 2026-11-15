import {oval,path,tint} from './avatar-cel-art.mjs?v=workshop1';
import {STAGE_WIDTH as W,STAGE_HEIGHT as H} from './avatar-full-body.mjs?v=workshop1';

const settings={
  lavender:['#393958','#786476','#d6ad79','#343b51','#252c3f'],
  sunset:['#584061','#c37e64','#efd29a','#644b59','#3b3643'],
  ocean:['#203c56','#598890','#caddaa','#345267','#293d4c'],
  mint:['#2b5255','#708b79','#d5cd83','#3b5953','#263a3c'],
  night:['#242743','#454c6d','#f1e1a5','#2e394e','#222939'],
  cloud:['#526d81','#9ca6a4','#f3d5a1','#526178','#374553'],
  sand:['#5b3f54','#b98361','#e9bd7a','#765650','#483c47'],
  rose:['#543a53','#9d6674','#ecc58d','#684b5d','#473545'],
  heather:['#353755','#6b6182','#d9bbc0','#484766','#302d47'],
  sky:['#355369','#8ba0a1','#f5dbab','#546777','#354c61'],
  peach:['#624052','#c4876f','#fce1a1','#75565d','#4c3a45'],
  sunflower:['#4d4350','#b88758','#f9df95','#605145','#383838'],
  ochre:['#453e54','#956a5e','#ebc68e','#615353','#42393e'],
  moss:['#283e46','#5b7f68','#e0c983','#3e504d','#293839']
};

function window(c,x,y,lit,shade,litColor){
  path(c,[x,y+27],[[x,y+7],[x+6,y-3,x+12,y+7],[x+12,y+27]],lit?litColor:shade,null);
  path(c,[x+6,y+4],[[x+6,y+27]],null,shade,1.6);
  path(c,[x,y+14],[[x+12,y+14]],null,shade,1.6);
}

function inn(c,shadow,lamp){
  path(c,[78,405],[[78,319],[57,319],[91,294],[115,242],[137,292],[164,306],[164,248],
    [151,245],[197,174],[245,244],[232,248],[232,312],[250,312],[250,278],[267,278],
    [299,207],[333,275],[347,275],[347,401]],shadow,null);
  path(c,[168,244],[[197,187],[232,242],[197,223]],tint(shadow,lamp,.2),null);
  path(c,[247,313],[[247,401],[269,395],[270,309],[249,313]],tint(shadow,lamp,.14),null);
  path(c,[267,276],[[300,219],[327,275],[298,257]],tint(shadow,lamp,.15),null);
  path(c,[85,322],[[115,254],[137,305],[104,289]],tint(shadow,lamp,.18),null);
  for(const [x,y,lit] of [[91,335,0],[119,345,1],[176,265,0],[197,260,1],[217,273,0],
    [280,298,0],[307,295,1],[323,332,0],[280,346,0]])window(c,x,y,lit,tint(shadow,'#171c28',.65),lamp);
  path(c,[173,401],[[173,359],[193,326,218,354],[218,400]],tint(shadow,'#151925',.47),null);
}

function tree(c,x,y,flip,paint){
  c.save();c.translate(x,y);c.scale(flip,1);
  path(c,[0,462],[[28,359,30,257,14,148],[6,100,-2,72,-25,53],[2,60,9,72,16,85],
    [5,36,23,13,32,-5],[23,47,25,68,41,105],[58,86,74,68,89,36],
    [83,83,68,99,48,138],[57,179,66,193,86,207],[65,203,57,199,52,190],[61,289,51,381,39,462]],paint,null);
  path(c,[30,360],[[48,266,39,166,26,119]],null,tint(paint,'#c09b87',.23),2);
  c.restore();
}

export function paintTurnaroundScene(c,recipe,item,t=0) {
  if(item){
    c.save();
    c.scale(W/256,H/256);
    item.draw(c,t);
    c.restore();
    path(c,[0,469],[[109,437,323,442,432,464],[432,572],[0,572]],'#23273aa8',null);
    return;
  }
  const [sky,low,moon,far,ground]=settings[recipe.background]||settings.night;
  const wash=c.createLinearGradient(0,0,0,495);
  wash.addColorStop(0,sky);wash.addColorStop(.88,low);
  c.fillStyle=wash;c.fillRect(0,0,W,H);
  oval(c,317,116,65,59,moon);
  for (let i=0;i<36;i++) {
    const x=(i*73+19)%W,y=18+(i*41)%166;
    if(i%3)oval(c,x,y,1+i%2*.5,.8,moon+'97');
  }
  path(c,[4,191],[[71,155,103,174],[163,148,217,171],[244,179,304,166],[432,171],[432,190],
    [300,198],[105,184],[4,191]],moon+'35',null);
  path(c,[0,367],[[35,319,76,347],[110,315,159,342],[196,307,257,349],[333,317,387,348],[432,325],
    [432,492],[0,492]],far,null);
  if(recipe.background==='ocean'||recipe.background==='sky'){
    for(let i=0;i<11;i++){
      const x=17+i*38,y=357+(i*17)%68;
      path(c,[x,y],[[x+18,y-2,x+43,y]],null,tint(far,moon,.3),1.6);
    }
    path(c,[281,391],[[292,358],[302,283],[317,283],[324,360],[338,398]],ground,null);
    path(c,[295,294],[[295,270],[326,270],[326,294]],moon,null);
    path(c,[285,271],[[311,252],[337,272]],ground,null);
  }else{
    inn(c,tint(far,ground,.52),moon);
  }
  path(c,[0,432],[[79,397,153,426],[244,408,271,423],[346,394,432,439],[432,H],[0,H]],ground,null);
  path(c,[151,572],[[149,536,216,498,241,484],[275,466,265,448,220,435],[260,434],
    [298,450,291,478,269,495],[233,525,254,555,286,572]],tint(ground,moon,.28),null);
  for(let i=0;i<46;i++){
    const x=(i*59)%W,y=435+(i*107)%136;
    path(c,[x,y],[[x+6+i%12,y-1]],null,tint(ground,moon,i%2?.24:.15),1.35);
  }
  tree(c,-10,9,1,tint(ground,'#18212c',.35));
  tree(c,455,26,-1,tint(ground,'#18212c',.4));
  for(let i=0;i<78;i++){
    const x=(i*67)%W,y=(i*151)%H;
    c.fillStyle=(i%2?moon:ground)+'28';c.fillRect(x,y,2+i%3,.8);
  }
}
