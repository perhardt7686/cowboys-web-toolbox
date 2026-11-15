// Original short arrangements. Notes are semitone offsets from each track's root.
export const DASH_SONGS={
  pulse:{title:'Midnight Pulse',root:110,voice:'triangle',lead:[0,3,7,10,7,3,5,12],bass:[0,0,-5,-2]},
  hangar:{title:'Hangar Radio',root:130.81,voice:'sine',lead:[7,12,14,17,14,12,9,7],bass:[0,-3,5,-5]},
  circuit:{title:'Circuit Lights',root:98,voice:'square',lead:[0,0,12,7,5,12,15,7],bass:[0,-2,3,-5]},
  ember:{title:'Ember Drive',root:82.41,voice:'sawtooth',lead:[0,7,12,15,14,7,5,3],bass:[0,0,3,-5]},
  tide:{title:'Glass Tide',root:146.83,voice:'triangle',lead:[12,9,7,4,2,4,7,9],bass:[-5,0,4,2]}
};
export function campaignSong(stage){
  const keys=['pulse','hangar','circuit','ember','tide'];
  return keys[(Math.max(1,stage)-1)%keys.length];
}
function tone(context,kind,hz,at,length,gain){
  const note=context.createOscillator(),volume=context.createGain();
  note.type=kind;note.frequency.setValueAtTime(hz,at);
  volume.gain.setValueAtTime(.0001,at);
  volume.gain.exponentialRampToValueAtTime(gain,at+.011);
  volume.gain.exponentialRampToValueAtTime(.0001,at+length);
  note.connect(volume);volume.connect(context.destination);
  note.start(at);note.stop(at+length+.015);
}
export function playDashNote(context,key,beat,at=context.currentTime,spacing=.28){
  const track=DASH_SONGS[key]||DASH_SONGS.pulse;
  const pitch=(offset,scale=1)=>track.root*scale*Math.pow(2,offset/12);
  tone(context,track.voice,pitch(track.lead[beat%track.lead.length],2),at,spacing*.70,.026);
  const low=pitch(track.bass[Math.floor(beat/2)%track.bass.length],.5);
  tone(context,'sine',low,at,spacing*.87,beat%2?.035:.055);
  if(beat%2===0)tone(context,'sine',49,at,.088,.04);
  if(beat%2===1)tone(context,'triangle',408,at+.012,.046,.018);
}
