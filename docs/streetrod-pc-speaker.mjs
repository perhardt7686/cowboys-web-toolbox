/* Cowboy's Street r0d · independently composed 1980s PC-speaker sound effects.
   No original DOS music or samples are copied, decoded or streamed.
   Synthesizes short monophonic beeps after a user gesture. */
const KEY='streetrod_reborn_sound_v1';
let enabled=false,context=null;
try{enabled=localStorage.getItem(KEY)==='1';}catch{}
export const soundEnabled=()=>enabled;
export function toggleSound(){
 enabled=!enabled;
 try{localStorage.setItem(KEY,enabled?'1':'0');}catch{}
 if(enabled)cue('start');
 return enabled;
}
const MOTIFS={
 menu:[[550,.055,0],[660,.05,.055]],
 click:[[490,.045,0]],
 start:[[250,.09,0],[375,.09,.11],[500,.13,.22]],
 wrench:[[340,.045,0],[410,.06,.065]],
 bolt:[[240,.025,0],[285,.035,.035]],
 gear:[[220,.05,0],[440,.09,.065]],
 buy:[[490,.08,0],[620,.09,.09],[740,.10,.2]],
 race:[[260,.075,0],[370,.065,.09],[520,.07,.17],[790,.13,.27]],
 warning:[[940,.1,0],[670,.13,.15]],
 engine:[[120,.15,0],[100,.13,.17]],
 victory:[[392,.13,0],[523,.14,.14],[659,.14,.30],[784,.28,.46]],
 defeat:[[440,.11,0],[330,.11,.13],[260,.20,.28]]
};
export function cue(kind='menu'){
 if(!enabled||typeof window==='undefined')return false;
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
 try{
  if(!context)context=new AC();
  // On iOS, the initial pointer event unlocks playback. If the audio
  // context stays suspended, do not promise or simulate a cue.
  if(context.state==='suspended')void context.resume().catch(()=>{});
  const now=context.currentTime;
  for(const [hz,duration,offset] of MOTIFS[kind]||MOTIFS.menu){
   const oscillator=context.createOscillator(),gain=context.createGain();
   oscillator.type='square';oscillator.frequency.value=hz;
   const start=now+.005+offset,end=start+duration;
   gain.gain.setValueAtTime(0,start);
   gain.gain.linearRampToValueAtTime(.035,start+.008);
   gain.gain.exponentialRampToValueAtTime(.001,end);
   oscillator.connect(gain).connect(context.destination);
   oscillator.start(start);oscillator.stop(end+.012);
  }
  return true;
 }catch{return false;}
}
