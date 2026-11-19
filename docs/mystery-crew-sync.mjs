/* Mystery Crew Creator account connection.
 * Uses the SAME session storage adapter and pinned Supabase SDK as the
 * Family Message Board. All new data writes go to server-validated RPCs.
 * Never store keys or spoof achievements on the client.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const safeStorage=key=>{try{return window[key]}catch{return null}};
export async function connectMysteryCrew(){
  const cfg=window.COWBOY_COMMUNITY_CONFIG||{};
  if(cfg.enabled!==true||!/^https:\/\/[a-z0-9-]+\.supabase\.(?:co|in)$/u.test(cfg.supabaseUrl||'')
    ||typeof cfg.publishableKey!=='string'||cfg.publishableKey.length<20)
    throw new Error('Family account connection is not configured.');
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=safeStorage('localStorage'),session=safeStorage('sessionStorage');
  const storage=createAuthStorage({local,session,remember:()=>{try{return local?.getItem('cowboy-community-remember')==='yes'}catch{return false}}});
  const storageKey='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  const client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{
    storageKey,flowType:'pkce',persistSession:true,autoRefreshToken:true,
    detectSessionInUrl:false,storage
  }});
  const {data:{session:active},error}=await client.auth.getSession();
  if(error)throw error;
  if(!active?.user?.id){const issue=new Error('Sign in on the Family Message Board to use your synced Mystery Crew.');issue.code='LOGIN_REQUIRED';throw issue;}
  const call=async(name,params)=>{
    const {data,error:rpcError}=await client.rpc(name,params||{});
    if(rpcError)throw rpcError;
    return data;
  };
  const initial=await call('community_mystery_crew_state');
  return {client,call,initial,memberId:active.user.id};
}
