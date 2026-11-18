// Original, recipe-pure acting silhouettes shared between the 2D and 3D rigs.
// Quantities are stage-relative: handLift lifts, elbowOut opens the sleeve,
// headRoll counters the shoulder gesture, yaw subtly turns the whole torso.
// Left/right arrays are in anatomical order and do not alter saved fields.
const POSES=Object.freeze({
  smile:      {elbowOut:[0,0],       handLift:[0,0],       headRoll:0,     yaw:0},
  grin:       {elbowOut:[.047,.047], handLift:[.041,.041], headRoll:-.017, yaw:0},
  calm:       {elbowOut:[-.012,-.012],handLift:[-.020,-.020],headRoll:.012,yaw:0},
  wink:       {elbowOut:[.010,.075], handLift:[0,.060],   headRoll:-.036,yaw:-.028},
  curious:    {elbowOut:[.014,.068], handLift:[-.012,.060],headRoll:.038,yaw:.045},
  smirk:      {elbowOut:[.010,.067], handLift:[-.022,.055],headRoll:-.031,yaw:.032},
  laugh:      {elbowOut:[.071,.071], handLift:[.087,.087], headRoll:-.026,yaw:.012},
  determined: {elbowOut:[.064,.064], handLift:[.032,.032], headRoll:0,    yaw:0}
});
export const BODY_ACTING_EXPRESSIONS=Object.freeze(Object.keys(POSES));
export function expressionBodyActing(name){
  const pose=POSES[name]||POSES.smile;
  return {elbowOut:[...pose.elbowOut],handLift:[...pose.handLift],
    headRoll:pose.headRoll,yaw:pose.yaw};
}
