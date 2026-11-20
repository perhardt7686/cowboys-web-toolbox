/* Tactile 1980s-style cabinet controls for the two original retro games.
 * The element is DOM-only; gameplay authority lives in retro-arcade-engine.mjs
 * and the server replay. The pause callback never writes an action.
 */
import {retroStickOffset} from './retro-arcade-joystick.mjs?v=cabinet2';
import {retroCabinetDirection,retroCabinetButton} from './retro-arcade-cabinet.mjs?v=controls1';

const keyDirection={ArrowLeft:'L',KeyA:'L',ArrowRight:'R',KeyD:'R',
 ArrowUp:'U',KeyW:'U',ArrowDown:'D',KeyS:'D'};

function tag(name,cls,text){
 const element=document.createElement(name);
 if(cls)element.className=cls;
 if(text!==undefined)element.textContent=text;
 return element;
}

export function createRetroCabinet({game,input,isLive,onPause}){
 if(!['maze','fleet'].includes(game))throw new Error('Unknown cabinet game');
 const deck=tag('div','retro-controls retro-cabinet-controls');
 deck.dataset.retroGame=game;
 const stage=tag('div','retro-cabinet-stage');
 const stick=tag('button','retro-cabinet-stick');
 stick.type='button';stick.dataset.retroJoystick=game;
 stick.style.touchAction='none';
 stick.setAttribute('aria-label',game==='maze'?
  'Four-way arcade joystick. Drag to steer the detective.':
  'Two-way arcade joystick. Drag left or right to steer.');
 stick.append(tag('span','retro-stick-plate'),tag('span','retro-stick-stem'),tag('span','retro-stick-ball'));
 stage.append(stick,tag('small','retro-cabinet-hint',game==='maze'?'4-WAY JOYSTICK':'2-WAY JOYSTICK'));
 const buttons=tag('div','retro-cabinet-buttons');
 const action=tag('button','retro-cabinet-action retro-cabinet-a',game==='maze'?'A · BRAKE':'A · FIRE');
 action.type='button';action.dataset.retroAction=game;
 action.setAttribute('aria-label',game==='maze'?'Brake and stop movement':'Fire laser; hold to keep firing');
 action.style.touchAction='none';
 const pause=tag('button','retro-cabinet-action retro-cabinet-b','B · PAUSE');
 pause.type='button';pause.dataset.retroPause=game;pause.disabled=true;
 pause.setAttribute('aria-label','Pause or resume the current arcade round');
 pause.setAttribute('aria-pressed','false');
 pause.addEventListener('click',()=>{if(isLive('pause'))onPause();});
 buttons.append(action,pause,tag('small','retro-cabinet-hint',
  game==='maze'?'A STOP · B PAUSE':'A FIRE · B PAUSE'));
 deck.append(stage,buttons);

 let pointer=null,lastDirection='N';
 function steer(event){
  if(pointer!==event.pointerId||!isLive('move'))return;
  const area=stick.getBoundingClientRect();
  const dx=event.clientX-(area.left+area.width/2);
  const dy=event.clientY-(area.top+area.height/2);
  const direction=retroCabinetDirection(game,dx,dy);
  const [x,y]=retroStickOffset(dx,game==='fleet'?0:dy,22);
  stick.style.setProperty('--cabinet-x',x+'px');
  stick.style.setProperty('--cabinet-y',y+'px');
  if(direction===lastDirection)return;
  if(lastDirection!=='N')input.release(lastDirection);
  if(direction!=='N')input.press(game,direction);
  lastDirection=direction;
 }
 function releaseStick(event){
  if(pointer!==event.pointerId)return;
  pointer=null;if(lastDirection!=='N')input.release(lastDirection);
  lastDirection='N';stick.classList.remove('is-pressed');
  stick.style.setProperty('--cabinet-x','0px');
  stick.style.setProperty('--cabinet-y','0px');
 }
 stick.addEventListener('pointerdown',event=>{
  if(pointer!==null||!isLive('move'))return;
  event.preventDefault();pointer=event.pointerId;
  stick.setPointerCapture?.(pointer);
  stick.classList.add('is-pressed');steer(event);
 });
 stick.addEventListener('pointermove',steer);
 for(const name of ['pointerup','pointercancel','lostpointercapture'])
  stick.addEventListener(name,releaseStick);
 const keyboard=new Map();
 stick.addEventListener('keydown',event=>{
  const dir=keyDirection[event.code];
  if(!dir||(game==='fleet'&&!['L','R'].includes(dir)))return;
  event.preventDefault();
  if(event.repeat||keyboard.has(event.code)||!isLive('move'))return;
  keyboard.set(event.code,dir);input.press(game,dir);
 });
 stick.addEventListener('keyup',event=>{
  if(!keyboard.has(event.code))return;
  event.preventDefault();input.release(keyboard.get(event.code));
  keyboard.delete(event.code);
 });
 stick.addEventListener('blur',()=>{
  keyboard.forEach(dir=>input.release(dir));keyboard.clear();
 });

 const code=retroCabinetButton(game,'A');
 let actionPointer=null;
 action.addEventListener('pointerdown',event=>{
  if(actionPointer!==null||!isLive('move'))return;
  event.preventDefault();actionPointer=event.pointerId;
  action.setPointerCapture?.(actionPointer);
  action.classList.add('is-pressed');input.press(game,code);
 });
 function releaseAction(event){
  if(event.pointerId!==actionPointer)return;
  actionPointer=null;action.classList.remove('is-pressed');input.release(code);
 }
 for(const name of ['pointerup','pointercancel','lostpointercapture'])
  action.addEventListener(name,releaseAction);
 action.addEventListener('click',event=>{
  // Keyboard/switch click only. Pointer is handled on down/up, so no double fire.
  if(event.detail===0&&isLive('move'))input.tap(game,code);
 });
 return deck;
}
