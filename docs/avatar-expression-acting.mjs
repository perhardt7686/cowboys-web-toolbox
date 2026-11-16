// Shared, original mystery-cartoon acting poses. Only visual geometry changes;
// recipe fields, saved values, rewards, and member state remain untouched.
// Values are expressed in 2D cel pixels; 3D applies proportional conversions.
const ACTING=Object.freeze({
  smile:       {brows:[0,0],      eyes:[1,1],     gaze:[0,0],   browEnd:[0,0]},
  grin:        {brows:[-2,-2],    eyes:[.88,.88], gaze:[0,0],   browEnd:[-1,1]},
  calm:        {brows:[2,2],      eyes:[.67,.67], gaze:[0,0],   browEnd:[0,0]},
  wink:        {brows:[-2,-1],    eyes:[1,0],     gaze:[-1,0],  browEnd:[0,1]},
  curious:     {brows:[-7,1],     eyes:[1.12,.96],gaze:[2,2],   browEnd:[-3,2]},
  smirk:       {brows:[-2,4],     eyes:[.88,.65],gaze:[2,2],   browEnd:[-1,3]},
  laugh:       {brows:[-3,-3],    eyes:[.50,.50],gaze:[0,0],   browEnd:[-2,2]},
  determined:  {brows:[3,3],      eyes:[.70,.70],gaze:[-1,-1], browEnd:[5,-5]}
});
export const EXPRESSION_KEYS=Object.freeze(Object.keys(ACTING));
export function expressionActing(name){
  // Return a fresh copy; consumers can never mutate the canonical model sheet.
  const pose=ACTING[name]||ACTING.smile;
  return {
    brows:[...pose.brows],eyes:[...pose.eyes],
    gaze:[...pose.gaze],browEnd:[...pose.browEnd]
  };
}
