/* Mystery Crew account sync.
   Uses the same tab-/device-scoped login policy as the approved family board.
   Existing family membership and RLS, not browser metadata, authorize access. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';

const config=window.COWBOY_COMMUNITY_CONFIG;
export const isLocalDemo=()=>location.hostname==='localhost'||location.hostname==='127.0.0.1';
let singleton=null;
export async function mysteryClient(){
 if(singleton)return singleton;
 if(!config?.enabled||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl))throw new Error('Family account connection unavailable.');
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
 const sessionStore=createAuthStorage({
  local:localStorage,session:sessionStorage,
  remember:()=>localStorage.getItem('cowboy-community-remember')==='yes'
 });
 const key='sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token';
 singleton=createClient(config.supabaseUrl,config.publishableKey,{auth:{
  storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:true,
  detectSessionInUrl:false,storage:sessionStore
 }});
 return singleton;
}
export async function mysteryAccount(){
 const client=await mysteryClient();
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.id)throw new Error('Sign in to your approved family account on the message board first.');
 const {data:member,error:memberError}=await client.from('community_members')
   .select('user_id,status,role').eq('user_id',user.id).maybeSingle();
 if(memberError||member?.status!=='approved'||!['owner','member'].includes(member?.role))
  throw new Error('Mystery Crew Creator is for approved family members.');
 return {client,user};
}
export async function mysteryLoad(){
 const {client,user}=await mysteryAccount();
 const {data,error}=await client.from('community_mystery_crews')
    .select('state,updated_at').eq('user_id',user.id).maybeSingle();
 if(error)throw error;
 if(!data?.state)throw new Error('Your starter crew has not been provisioned yet. Reload the family board.');
 return {state:data.state,updated_at:data.updated_at,userId:user.id,client};
}
export async function mysterySave(client,userId,state){
 const {data,error}=await client.from('community_mystery_crews')
 .update({state,updated_at:new Date().toISOString()})
 .eq('user_id',userId).select('state,updated_at').single();
 if(error)throw error;
 if(!data?.state)throw new Error('The family account did not accept this crew. Sign in again.');
 return data;
}
