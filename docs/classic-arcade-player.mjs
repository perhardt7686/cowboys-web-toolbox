/* Standalone opaque-origin frame. No supabase client, cookies or member credentials.
 * Game bytes arrive from parent via transferable message only; never POSTed.
 */
const $=id=>document.getElementById(id);
const ALLOWED={centipede:'atari2600',topgear:'snes',pacman:'dos'};
let token=null,loaded=false,mediaUrl=null,holding=new Set(),queued=[];
const notify=(type,message='')=>window.parent.postMessage({type,token,message},'*');
function display(message){$('state').textContent=message;notify('classic-player-status',message);}
function sendInput(code,pressed){
 const index=Number(code);
 if(!Number.isInteger(index)||index<0||index>31)return;
 const simulate=window.EJS_emulator?.gameManager?.simulateInput;
 if(typeof simulate==='function'){
  try{simulate.call(window.EJS_emulator.gameManager,0,index,pressed?1:0);}
  catch{display('Controller binding unavailable. Try the emulator keyboard/gamepad controls.');}
 }else if(queued.length<32)queued.push({code:index,pressed});
}
function flush(){
 if(!window.EJS_emulator?.gameManager?.simulateInput)return;
 const batch=queued.splice(0);
 for(const {code,pressed} of batch)sendInput(code,pressed);
}
function releaseAll(){for(const code of holding)sendInput(code,false);holding.clear();queued=[];}
async function initialize(data){
 if(loaded)throw Error('A player is already loaded. Exit and reopen to change games.');
 if(!Object.hasOwn(ALLOWED,data.game)||ALLOWED[data.game]!==data.core)throw Error('Unsupported emulator core.');
 if(!(data.bytes instanceof ArrayBuffer)||data.bytes.byteLength<100||data.bytes.byteLength>25*1024*1024)
  throw Error('Invalid or oversized local game file.');
 token=data.token;loaded=true;
 mediaUrl=URL.createObjectURL(new Blob([data.bytes],{type:'application/octet-stream'}));
 window.EJS_player='#game';
 window.EJS_gameName='family-classic-'+data.game;
 window.EJS_gameUrl=mediaUrl;
 window.EJS_core=data.core;
 window.EJS_gameID={centipede:2600,topgear:1992,pacman:1983}[data.game];
 window.EJS_pathtodata='https://cdn.emulatorjs.org/stable/data/';
 window.EJS_startOnLoaded=true;
 window.EJS_threads=false;
 window.EJS_AdUrl='';
 window.EJS_AdTimer=-1;
 window.EJS_disableLocalStorage=true;
 window.EJS_CacheLimit=0;
 window.EJS_noAutoFocus=true;
 window.EJS_onGameStart=()=>{display('Emulator started. Use the arcade controls underneath. Scores are not verified.');flush();notify('classic-player-started');};
 window.EJS_ready=()=>{display('Emulator ready. Select Start in the player if it has not started.');flush();notify('classic-player-loaded');};
 const script=document.createElement('script');
 script.src='https://cdn.emulatorjs.org/stable/data/loader.js';
 script.async=true;
 script.onerror=()=>{display('Emulator runtime could not load. Check network/CDN, then retry.');notify('classic-player-error','Emulator runtime unavailable');};
 document.body.append(script);
 display('Starting '+data.game+' from a file kept on this device…');
}
window.addEventListener('message',event=>{
 if(event.source!==window.parent||!event.data||typeof event.data!=='object')return;
 const msg=event.data;
 if(msg.type==='classic-init'&&!loaded){
  initialize(msg).catch(e=>{display(e.message);notify('classic-player-error',e.message);});
  return;
 }
 if(!token||msg.token!==token)return;
 if(msg.type==='classic-input'){
  const key=Number(msg.index),pressed=msg.down===true;
  if(pressed)holding.add(key);else holding.delete(key);
  sendInput(key,pressed);
 }
 if(msg.type==='classic-release')releaseAll();
});
window.addEventListener('blur',releaseAll);
window.addEventListener('pagehide',()=>{releaseAll();if(mediaUrl)URL.revokeObjectURL(mediaUrl);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
notify('classic-player-hello');
