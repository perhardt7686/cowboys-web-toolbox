// Session tokens remain tab-local unless Remember this device is selected.
// PKCE handshakes must survive an email opening a second tab in the same browser.
export const AUTH_HANDSHAKE_TTL=60*60*1000;
const safeRead=(storage,key)=>{try{return storage?.getItem(key)??null}catch{return null}};
const safeRemove=(storage,key)=>{try{storage?.removeItem(key)}catch{}};
const storageError=()=>new Error('Allow this website to use browser storage, then try again.');
export function createAuthStorage({local,session,remember=()=>false,now=Date.now}){
  const isHandshake=key=>key.endsWith('-code-verifier');
  const writeHandshake=(key,value)=>{try{local.setItem(key,JSON.stringify({toolboxHandshake:1,value,expiresAt:now()+AUTH_HANDSHAKE_TTL}));safeRemove(session,key);}catch{throw storageError()}};
  return {
    getItem(key){
      if(!isHandshake(key))return safeRead(session,key)??safeRead(local,key);
      const raw=safeRead(local,key)??safeRead(session,key);if(raw===null)return null;
      let parsed;try{parsed=JSON.parse(raw)}catch{}
      if(parsed?.toolboxHandshake===1){if(typeof parsed.value!=='string'||!Number.isFinite(parsed.expiresAt)||parsed.expiresAt<=now()){safeRemove(local,key);safeRemove(session,key);return null;}return parsed.value;}
      // Preserve an in-progress link from the older adapter when this tab still has it.
      writeHandshake(key,raw);return raw;
    },
    setItem(key,value){
      if(isHandshake(key)){writeHandshake(key,value);return;}
      const persistent=remember(),target=persistent?local:session,other=persistent?session:local;
      try{target.setItem(key,value);}catch{throw storageError()}
      safeRemove(other,key);
    },
    removeItem(key){safeRemove(session,key);safeRemove(local,key);}
  };
}
export function createRecoveryStep(storage,key,{now=Date.now}={}){
  const clear=()=>safeRemove(storage,key);
  return {
    mark(userId){if(!userId)return;try{storage.setItem(key,JSON.stringify({userId,expiresAt:now()+15*60*1000}));}catch{}},
    active(userId){let value;try{value=JSON.parse(safeRead(storage,key)||'null')}catch{}if(!value||value.userId!==userId||!Number.isFinite(value.expiresAt)||value.expiresAt<=now()){clear();return false;}return true;},
    clear
  };
}
export async function requestPasswordReset(auth,email,redirectTo,storage,storageKey){
  // The pinned SDK uses a legacy verifier when the exact redirect URL has no
  // flow-id parameter. A failed resend must not erase the previous good link.
  const key=storageKey+'-code-verifier',prior=storage.getItem(key);
  const result=await auth.resetPasswordForEmail(email,{redirectTo});
  if(result.error&&prior&&!storage.getItem(key))storage.setItem(key,prior);
  return result;
}
export function resetRetrySeconds(error){
  if(error?.status!==429&&!['over_email_send_rate_limit','over_request_rate_limit'].includes(error?.code))return 0;
  const seconds=Number(/after\s+(\d+)\s+seconds?/iu.exec(error?.message||'')?.[1]||60);return Math.max(1,Math.min(3600,seconds));
}
export function authErrorMessage(error,view){
  const retry=resetRetrySeconds(error);
  if(retry)return `Please wait ${retry} seconds before requesting another link. Check your inbox for a recent email and use only the newest link.`;
  if(view==='callback')return 'This email link could not be completed in this browser. Request one fresh reset link here, then open the newest email in this same browser. Links work once.';
  if(view==='reset'){
    if(error?.code==='same_password')return 'Choose a new passphrase different from your current password.';
    if(error?.code==='weak_password')return 'Use a strong passphrase of at least 15 characters.';
    if(error?.status===401||['session_not_found','refresh_token_not_found','flow_state_expired','otp_expired'].includes(error?.code))return 'This reset session has expired. Request a fresh reset link and use the newest email.';
    return 'Your new password could not be saved. Keep this page open and try again, or request a fresh reset link.';
  }
  if(error?.name==='AuthRetryableFetchError'||error?.status===0)return 'The sign-in service could not be reached. Check your connection and try again.';
  if(error?.code==='email_address_invalid')return 'Check the email address and try again.';
  return 'The reset email could not be sent. Please try again shortly.';
}
