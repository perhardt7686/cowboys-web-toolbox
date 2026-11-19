/* Original classic-style Mahjong tiles for the Commons.
 * This is presentation only. The server alone decides which symbols match.
 * Existing 18 symbol families and flower/sun variants remain unchanged. */
const NUMERALS=Object.freeze(['一','二','三','四','五','六']);
const SUITS=Object.freeze([
  Object.freeze({name:'Character',plural:'Characters',code:'C',kind:'characters'}),
  Object.freeze({name:'Circle',plural:'Circles',code:'D',kind:'dots'}),
  Object.freeze({name:'Bamboo',plural:'Bamboo',code:'B',kind:'bamboo'})
]);

export function classicFaceForTile(symbol){
  const n=Number(symbol);
  const family=Number.isInteger(n)&&n>=1?((n-1)%18):0;
  const suit=SUITS[Math.floor(family/6)];
  const value=(family%6)+1;
  return {kind:suit.kind,value,code:suit.code+value,
    name:value+' '+suit.name+(value===1?'':'s'),
    variant:n>18?'sun':'flower',
    numeral:NUMERALS[value-1]};
}

export function addClassicTileArtwork(tile,symbol){
  const face=classicFaceForTile(symbol);
  const art=document.createElement('span');
  art.className='mahjong-classic-face mahjong-classic-'+face.kind;
  art.setAttribute('aria-hidden','true');
  if(face.kind==='characters'){
    const num=document.createElement('span');
    num.className='mahjong-classic-numeral';
    num.textContent=face.numeral;
    const unit=document.createElement('span');
    unit.className='mahjong-classic-unit';
    unit.textContent='萬';
    art.append(num,unit);
  }else{
    const pattern=document.createElement('span');
    pattern.className=face.kind==='dots'?'mahjong-classic-pips':'mahjong-classic-stalks';
    pattern.dataset.count=String(face.value);
    for(let i=0;i<face.value;i++){
      const piece=document.createElement('span');
      piece.className=face.kind==='dots'?'mahjong-classic-pip':'mahjong-classic-stalk';
      pattern.append(piece);
    }
    art.append(pattern);
  }
  const code=document.createElement('span');
  code.className='mahjong-classic-code';
  code.textContent=face.code;
  art.append(code);
  tile.append(art);
  return face;
}

/* Quiet, original synthetic click/chime: no audio download, no autoplay. */
let context=null;
export function playMahjongSound(kind,enabled){
  if(!enabled||typeof window==='undefined')return;
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  try{
    if(!context)context=new Audio();
    if(context.state==='suspended')void context.resume().catch(()=>{});
    const t=context.currentTime;
    const notes={win:[392,523.25,659.25],match:[392,587.33],blocked:[185],
      streak:[440,554.37,659.25],rush:[587.33,739.99,880],
      award:[392,523.25,659.25,783.99],legendary:[392,493.88,587.33,783.99,1046.5]};
    const pitches=notes[kind]||[330];
    const length=kind==='legendary'?.22:kind==='award'?.18:kind==='win'?.17:kind==='match'?.11:.08;
    pitches.forEach((frequency,index)=>{
      const oscillator=context.createOscillator();
      const volume=context.createGain();
      oscillator.type=kind==='blocked'?'triangle':'sine';
      oscillator.frequency.setValueAtTime(frequency,t+index*.075);
      volume.gain.setValueAtTime(.0001,t+index*.075);
      volume.gain.exponentialRampToValueAtTime(kind==='blocked'?.018:.037,t+index*.075+.008);
      volume.gain.exponentialRampToValueAtTime(.0001,t+index*.075+length);
      oscillator.connect(volume);volume.connect(context.destination);
      oscillator.start(t+index*.075);
      oscillator.stop(t+index*.075+length+.005);
    });
  }catch{/* Audio can be blocked by user settings; gameplay must continue. */}
}
