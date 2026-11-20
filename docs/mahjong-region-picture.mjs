/* Mystery Road: 20 illustrated regional map scenes, locally drawn and safe.
 * SVG uses only the allowlisted static themes. No network images, paid art,
 * audio, account writes or dependence on emoji font availability for paths.
 */
export const REGION_MAP_MOTIFS=Object.freeze([
 ['Daisy footpath','🌼','🦋','🌳'],['Golden meadow','🌻','🐝','🌾'],
 ['Fox den','🌿','🦊','🍄'],['Bluebird orchard','🪻','🐦','🌳'],
 ['Purple terraces','🪻','🐝','🌾'],['Briar garden','🌷','🐇','🌳'],
 ['Monarch meadow','🌺','🦋','🌾'],['Heron wetlands','🪷','🐸','🪨'],
 ['Rose courtyard','🌹','🐦','🌿'],['Moonlit orchids','🌸','🦋','🌙'],
 ['Firefly forest','✨','🪲','🌳'],['Copperwood ridge','🍁','🐿️','🌲'],
 ['Crystal stream','🌿','🦦','💧'],['Snowdrop woodland','❄️','🐇','🌲'],
 ['Sunflower valley','🌻','🐦','🌾'],['Jungle canopy','🌺','🦜','🌳'],
 ['Lily lake','🪷','🦋','💧'],['Starlit hedgerow','🌙','🦉','🌸'],
 ['Aurora garden','🌸','🐦','✨'],['Evergreen crown','🌲','🦌','👑']
].map(group=>Object.freeze(group)));

const NS='http://www.w3.org/2000/svg';
const node=(name,attributes={})=>{
 const el=document.createElementNS(NS,name);
 for(const [key,value] of Object.entries(attributes))el.setAttribute(key,String(value));
 return el;
};
const add=(parent,name,attributes={})=>{const el=node(name,attributes);parent.append(el);return el;};
const text=(parent,x,y,value,size=32)=>{
 const el=add(parent,'text',{x,y,'font-size':size,'text-anchor':'middle',
 'dominant-baseline':'central','aria-hidden':'true'});
 el.textContent=value;return el;
};
function tree(g,x,y,scale,color,trunk='#72593d'){
 const group=add(g,'g',{transform:'translate('+x+' '+y+') scale('+scale+')'});
 add(group,'path',{d:'M-5 18L-5 69Q0 77 5 69L5 18Z',fill:trunk,stroke:'#4d4a37','stroke-width':2});
 for(const [dx,dy,r] of [[0,-4,30],[-22,14,21],[20,14,22],[0,28,21]])
  add(group,'circle',{cx:dx,cy:dy,r,fill:color,stroke:'#214c3e','stroke-width':2.2,
  opacity:'.91'});
 add(group,'path',{d:'M-20 5Q-2 -21 18 -7','stroke':'#f7f3c8','stroke-width':4,
  opacity:'.52',fill:'none','stroke-linecap':'round'});
}
function blossom(g,x,y,color){
 const f=add(g,'g',{transform:'translate('+x+' '+y+')'});
 add(f,'path',{d:'M0 2L-2 19','stroke':'#34734f','stroke-width':2.8,'stroke-linecap':'round'});
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5;
  add(f,'ellipse',{cx:Math.round(Math.cos(a)*8),cy:Math.round(Math.sin(a)*8),
   rx:7,ry:8,fill:color,stroke:'#fff6c6','stroke-width':1.2,opacity:'.93'});
 }
 add(f,'circle',{r:4.4,fill:'#f9d353'});
}
function seeded(i,j){return (((i+5)*97+(j+11)*139)*73)%977/977;}
export function illustratedRegionMap(index,region){
 const id=Math.max(0,Math.min(19,Math.trunc(index)||0));
 const motif=REGION_MAP_MOTIFS[id];
 if(!region)return null;
 const svg=node('svg',{class:'nature-region-illustration',viewBox:'0 0 1000 620',
  role:'img','aria-label':region.name+' illustrated area map: '+motif[0],
  preserveAspectRatio:'xMidYMid slice'});
 svg.dataset.picture=String(id);
 const defs=add(svg,'defs');
 const bg=add(defs,'linearGradient',{id:'road-landscape-sky',x1:'0',y1:'0',x2:'.3',y2:'1'});
 add(bg,'stop',{offset:'0%', 'stop-color':region.sky});
 add(bg,'stop',{offset:'100%','stop-color':region.land});
 const hill=add(defs,'linearGradient',{id:'road-hills',x1:'0',y1:'0',x2:'1',y2:'1'});
 add(hill,'stop',{offset:'0%','stop-color':region.land});
 add(hill,'stop',{offset:'100%','stop-color':region.ink});
 add(svg,'rect',{width:1000,height:620,fill:'url(#road-landscape-sky)'});
 // Watercolor sky, undulating terrain, distant glades and a branching river
 // vary by region. All artwork is independent of unlock and tile mechanics.
 add(svg,'circle',{cx:740+(id%3)*40,cy:90+id%4*14,r:92,fill:region.accent,opacity:'.31'});
 add(svg,'path',{d:'M0 285Q180 '+(150+id%4*23)+' 400 275T760 244T1000 263V620H0Z',
  fill:region.land,opacity:'.57'});
 add(svg,'path',{d:'M0 422Q180 '+(305+id%6*11)+' 381 396T721 340T1000 401V620H0Z',
  fill:'url(#road-hills)',opacity:'.37'});
 add(svg,'path',{d:'M-30 540Q160 '+(415+id%3*23)+' 365 515T790 467T1045 555V660H-30Z',
  fill:region.sky,opacity:'.43'});
 const water=(id%5===2||id%5===3||id%5===4);
 if(water){
  add(svg,'path',{d:id%2?
   'M985 32Q721 180 775 275T538 454T380 651':
   'M-30 80Q218 190 161 276T393 417T646 650',
   fill:'none',stroke:id%5===4?'#b6e3ec':'#9ddbe5',
   'stroke-width':74,'stroke-linecap':'round',opacity:'.65'});
  add(svg,'path',{d:id%2?
   'M985 32Q721 180 775 275T538 454T380 651':
   'M-30 80Q218 190 161 276T393 417T646 650',
   fill:'none',stroke:'#e5f9fb','stroke-width':5,'stroke-dasharray':'14 29',opacity:'.7'});
 }else{
  add(svg,'path',{d:'M-30 360Q275 300 460 378T765 305T1040 360',
   fill:'none',stroke:region.accent,'stroke-width':93,opacity:'.19',
   'stroke-linecap':'round'});
 }
 const g=add(svg,'g',{opacity:'.85'});
 for(let i=0;i<10;i++){
  const x=45+seeded(id,i)*905,y=80+seeded(id,i+20)*480;
  if(i%2===0)tree(g,x,y,.45+seeded(id,i+40)*.4,
    id%5===1?'#bc9b42':id%5===3?'#5f9fa6':region.land);
  else blossom(g,x,y,region.accent);
 }
 // Region-specific storybook landmarks: twenty unique map signatures.
 const landmarks=add(svg,'g',{'aria-hidden':'true'});
 const offset=(id%4)*18;
 text(landmarks,140+offset,128,motif[1],62);
 text(landmarks,840-offset,175,motif[2],55);
 text(landmarks,790,510,motif[3],60);
 for(let i=0;i<9;i++){
  const x=120+seeded(id,i+60)*790;
  const y=72+seeded(id,i+70)*482;
  if(i%3===0)text(landmarks,x,y,motif[1],27);
 }
 const title=add(svg,'g',{transform:'translate(500 28)'});
 add(title,'rect',{x:-186,y:0,width:372,height:43,rx:20,fill:'#fff9e3',opacity:'.88'});
 const t=add(title,'text',{'text-anchor':'middle',x:0,y:29,
  'font-size':25,'font-weight':800,fill:region.ink,'font-family':'Georgia, serif'});
 t.textContent=region.name;
 const ridge=add(svg,'path',{d:'M12 606Q280 589 500 607T988 603',
  stroke:region.ink,'stroke-width':3,opacity:'.32',fill:'none'});
 ridge.setAttribute('aria-hidden','true');
 return svg;
}
