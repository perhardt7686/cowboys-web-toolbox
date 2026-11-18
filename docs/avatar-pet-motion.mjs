// Deterministic presentation-only pet acting. The saved ownership, recipe and
// achievement records never contain these values. Actions settle to precisely
// neutral when progress reaches 0 or 1.
const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
const finite=(value,elseValue)=>Number.isFinite(value)?value:elseValue;

export function petMotionFrame({species='woodland',move='hop',action='play',
  progress=0,time=0,active=false}={}){
  const p=clamp(finite(progress,0),0,1);
  const t=finite(time,0);
  const extent=active?Math.sin(Math.PI*p):0;
  const idle=!active&&t>0;
  const clock=idle?Math.sin(t*.92):0;
  const petting=action==='pet',observing=action==='sniff'||action==='scan';
  const intensity=petting?.30:observing?.43:1;
  const energy=extent*intensity;
  const cycle=Math.sin(9*Math.PI*p)*energy;
  const doubleStep=Math.abs(Math.sin(6*Math.PI*p))*energy;
  const kind=species==='automaton'?'clockwork':
    species==='moth'?'flutter':
    species==='phantom'?'drift':
    species==='winged'&&move!=='hop'?'flight':
    species==='bird'&&move==='glide'?'flight':
    species==='hunter'?'trot':
    species==='woodland'?'hop':
    species==='reptile'&&move==='float'?'drift':
    species==='reptile'?'crawl':
    species==='bird'?'waddle':
    species==='winged'?'spring':'drift';
  const acting={kind,bob:0,forward:0,side:0,roll:0,pitch:0,
    yaw:0,stride:0,wing:0,tail:0};
  if(kind==='trot'){
    acting.bob=doubleStep*.058+clock*.003;
    acting.forward=energy*.050;
    acting.stride=cycle*.36;
    acting.pitch=-energy*.047;
    acting.tail=energy*.19+clock*.085;
  }else if(kind==='hop'||kind==='spring'){
    acting.bob=doubleStep*(kind==='spring'?.17:.135)+clock*.008;
    acting.forward=energy*.025;
    acting.stride=cycle*.26;
    acting.pitch=-energy*.095;
    acting.roll=cycle*.045;
    acting.tail=cycle*.12;
  }else if(kind==='crawl'){
    acting.bob=doubleStep*.012;
    acting.forward=energy*.040;
    acting.stride=cycle*.17;
    acting.roll=cycle*.032;
    acting.tail=cycle*.25+clock*.045;
  }else if(kind==='waddle'){
    acting.bob=doubleStep*.023;
    acting.side=cycle*.038;
    acting.roll=cycle*.135;
    acting.stride=cycle*.20;
    acting.yaw=cycle*.075;
  }else if(kind==='flutter'||kind==='flight'){
    acting.bob=energy*(kind==='flutter'?.105:.135)+clock*.014;
    acting.forward=energy*.090;
    acting.side=cycle*.046;
    acting.roll=cycle*.12;
    acting.pitch=-energy*.10;
    acting.wing=energy*(kind==='flutter'?.78:.62)+
      (idle?.075*(1+Math.sin(t*6.7)):0);
  }else if(kind==='clockwork'){
    // Deliberately stepped/ratcheting rather than biologically smooth.
    const tick=Math.round(p*8)/8;
    acting.yaw=energy*Math.sin(tick*6*Math.PI)*.21;
    acting.roll=energy*Math.sin(tick*4*Math.PI)*.075;
    acting.bob=doubleStep*.021;
    acting.forward=energy*.03;
  }else{
    // Ghosts, aquatic oddities and floating reptiles drift, not trot.
    acting.bob=energy*.09+clock*.021;
    acting.side=cycle*.052;
    acting.roll=cycle*.09;
    acting.yaw=cycle*.12;
    acting.pitch=energy*.035;
    acting.tail=cycle*.08;
  }
  // Keep the owner's stage socket fixed; only the animal animates.
  // All values remain finite even for invalid animation frames.
  for(const key of ['bob','forward','side','roll','pitch','yaw','stride','wing','tail'])
    acting[key]=Math.abs(acting[key])<1e-12?0:acting[key];
  return Object.freeze(acting);
}
