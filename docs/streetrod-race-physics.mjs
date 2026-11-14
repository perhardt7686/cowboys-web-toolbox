/* Street r0d Reborn: independent real-time driving physics.
 * Derives mass, ratios, final drive, tyre radius, torque and drag from the
 * existing community_streetrod_engineering_specs server configuration.
 * This is visual/player-input physics only. The signed-in Supabase race finish
 * remains the sole authority for wagers, scores, damage and saved history.
 *
 * Race-engine reference: Street Rod SDL3 MIT C port (race_phys.c),
 * https://github.com/kylofon/street-rod-sdl3. No copied game data or assets.
 */
const SPECS={
 rattler:[1280,175,330,5000,3.55,.318,[2.9,1.8,1.29,1],.47,2.32,.89,.53],
 comet:[1160,225,350,6100,3.90,.306,[3.02,1.92,1.31,1],.41,2.07,.94,.51],
 dustline32:[1202,140,237,5550,3.58,.326,[2.96,1.9,1.31,1],.42,1.92,.94,.52],
 duchess41:[1654,156,279,5250,3.68,.334,[2.96,1.9,1.31,1],.41,2.24,.92,.53],
 wren49:[1226,186,326,5350,3.78,.342,[2.96,1.9,1.31,1],.43,2.07,.91,.53],
 brookline60:[1550,220,372,5550,3.98,.310,[2.96,1.9,1.31,1],.41,2.24,.92,.53],
 gravelking57:[1978,240,381,5900,3.68,.310,[2.96,1.9,1.31,1],.50,2.76,.89,.53],
 nomad:[1335,305,445,5950,3.70,.324,[3,1.9,1.31,1],.44,2.30,.97,.54],
 oldirons49:[1926,165,267,5800,3.58,.302,[2.96,1.9,1.31,1],.50,2.76,.89,.53],
 saturn58:[1448,252,434,5450,3.88,.302,[2.96,1.9,1.31,1],.47,2.30,.87,.52],
 phantom:[1360,575,720,7300,4.05,.346,[2.96,1.9,1.30,1],.34,2.10,1.16,.58],
 cipherx:[2380,1120,1380,7450,3.86,.339,[2.90,1.84,1.26,1],.34,2.52,1.35,.64]
};
const g=9.80665,mphtoms=.44704,mstomph=2.2369362921;
export const supportedModels=Object.freeze(Object.keys(SPECS));
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function specFor(key){
 const d=SPECS[key]||SPECS.rattler;
 return {mass:d[0],hp:d[1],torque:d[2],redline:d[3],fd:d[4],radius:d[5],
  ratios:[...d[6]],cd:d[7],area:d[8],mu:d[9],rear:d[10],key:key||'rattler'};
}
export function roadCurve(seed,t,road=true){
 if(!road)return 0;
 // Server validates one steering sample each second using this curve.
 return Math.sin((Math.max(0,Math.floor(t/1000))+Math.abs(seed%17))*0.46)*0.78;
}
export function makePowertrain(car={},run={}){
 const spec=specFor(car.car_key||run.car);
 const engine=clamp(Number(car.engine)||0,0,5),tyres=clamp(Number(car.tires)||0,0,5);
 const gearbox=clamp(Number(car.gearbox)||0,0,5);
 const condition=clamp(Number(car.condition??100),0,100);
 const tune=clamp(Number(car.tune)||0,-3,3);
 return {
  spec,engine,tyres,gearbox,condition,tune,gear:1,
  speed:0,distance:0,rpm:900,temperature:87,offroad:0,
  steer:0,skidding:false,redlineHits:0,shiftUntil:0,shiftedAt:[],
  lastDelta:0,automatic:true,finished:false,elapsed:0,
  launchReactionMs:null,seed:Number(run.seed)||0,mode:run.type==='road'?'road':'drag'
 };
}
export function rpmFor(s,gear=s.gear){
 const sp=s.spec,ratio=sp.ratios[clamp(gear,1,4)-1];
 const final=sp.fd*clamp(1-s.tune*.013,.89,1.12);
 return Math.max(850,s.speed*mphtoms/(2*Math.PI*sp.radius)*60*ratio*final);
}
export function changeGear(s,dir=1,elapsed=0){
 const next=clamp(s.gear+dir,1,4);
 if(next===s.gear)return false;
 s.gear=next;
 // Physical torque interruption while disengaging clutch and changing gears.
 s.shiftUntil=Math.max(s.shiftUntil,elapsed+(0.29-s.gearbox*.035)*1000);
 if(dir>0)s.shiftedAt.push(Math.floor(elapsed));
 s.rpm=rpmFor(s);
 return true;
}
export function stepPowertrain(s,inputs={},dt=.04,elapsed=0){
 // Mutates the current race's ephemeral motor state, never the saved garage.
 dt=clamp(Number(dt)||0,0,.12);
 if(!dt)return s;
 const sp=s.spec,gear=s.gear,gas=clamp(Number(inputs.gas)||0,0,1);
 const brake=clamp(Number(inputs.brake)||0,0,1);
 const steer=clamp(Number(inputs.steer)||0,-1,1);
 const ratio=sp.ratios[gear-1],mass=sp.mass+85;
 const final=sp.fd*clamp(1-s.tune*.013,.89,1.12);
 const mu=(sp.mu+s.tyres*.038)*clamp(s.condition/160+.38,.72,1.05);
 const speedMs=s.speed*mphtoms;
 const rpm=Math.max(850,rpmFor(s),gear===1&&gas>.05?1750+gas*1100:850);
 const x=rpm/sp.redline;
 const tqFactor=x<.35?.61+x*.95:x<.62?.9425+(x-.35)*.23:1.0046-(x-.62)*.83;
 const nm=sp.torque*(1+s.engine*.06)*clamp(tqFactor,.28,1.01);
 const powerLimited=sp.hp*(1+s.engine*.065)*745.7/(rpm*2*Math.PI/60);
 let torque=Math.min(nm,powerLimited);
 if(rpm>sp.redline){torque*=.12;s.redlineHits+=1;}
 if(elapsed<s.shiftUntil)torque*=.1;
 if(s.temperature>112)torque*=clamp(1-(s.temperature-112)*.025,.45,1);
 const wheelForce=torque*ratio*final*(.84+s.gearbox*.012)/sp.radius*gas;
 const traction=mass*g*sp.rear*mu;
 const tractionLimited=Math.min(wheelForce,traction);
 const drag=.5*1.225*sp.cd*sp.area*speedMs*speedMs;
 const rolling=mass*g*.014;
 const braking=brake*mass*g*clamp(.38+s.tyres*.075,.38,.9);
 const idealSteer=roadCurve(s.seed,elapsed,s.mode==='road');
 const steeringError=Math.abs(steer-idealSteer);
 // Cornering load makes excess speed and steering error cost grip.
 const cornerSeverity=s.mode==='road'?clamp(steeringError*.6+(speedMs/55)*.23,0,1.8):Math.abs(steer)*.35;
 const offroad=s.mode==='road'&&cornerSeverity>1.0;
 const cornerDrag=(cornerSeverity*cornerSeverity)*(mass*1.8)+(offroad?mass*2.5:0);
 const accel=clamp((tractionLimited-drag-rolling-braking-cornerDrag)/(mass*1.055),-g,13);
 const newSpeed=Math.max(0,speedMs+accel*dt);
 s.distance+=(speedMs+newSpeed)*.5*dt*3.280839895;
 s.speed=newSpeed*mstomph;
 s.rpm=Math.round(Math.max(850,rpmFor(s)));
 s.steer=steer;
 s.skidding=offroad||cornerSeverity>1.05;
 if(offroad)s.offroad+=dt;
 const overload=gas>0.7&&rpm>sp.redline*.87?2.4:gas>.8?.8:-1.3;
 s.temperature=clamp(s.temperature+(overload-(s.speed>30?1.0:.2))*dt,73,135);
 s.elapsed=elapsed;
 s.lastDelta=accel;
 return s;
}
export function suggestedGear(s){
 if(s.gear>=4)return s.gear;
 const rpm=rpmFor(s);
 return rpm>=s.spec.redline*(.83+s.gearbox*.01)?s.gear+1:s.gear;
}
export function automaticShift(s,elapsed){
 if(!s.automatic)return false;
 if(suggestedGear(s)>s.gear)return changeGear(s,1,elapsed);
 return false;
}
export function roadWarning(s,elapsed){
 const curve=roadCurve(s.seed,elapsed,s.mode==='road');
 if(Math.abs(curve)>.4)return curve>0?'CURVE RIGHT':'CURVE LEFT';
 if(s.rpm>s.spec.redline*.93)return 'SHIFT UP / REV LIMIT';
 if(s.skidding)return 'TRACTION LOST';
 if(s.temperature>112)return 'ENGINE HOT';
 return s.automatic?'AUTO SHIFT':'MANUAL SHIFT';
}
