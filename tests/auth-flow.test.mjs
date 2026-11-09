import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createAuthStorage,createRecoveryStep,requestPasswordReset,authErrorMessage,resetRetrySeconds,AUTH_HANDSHAKE_TTL} from '../docs/auth-flow.mjs';

function memory(){const map=new Map();return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};}
const key='sb-fictional-project-auth-token';

test('a new tab shares only expiring PKCE handshakes while ordinary sessions stay tab-local',()=>{
  const local=memory(),tabA=memory(),tabB=memory();let now=1000;
  const a=createAuthStorage({local,session:tabA,now:()=>now}),b=createAuthStorage({local,session:tabB,now:()=>now});
  a.setItem(key,'fictional-session');a.setItem(key+'-flow-example123-code-verifier','fictional-handshake/recovery');
  assert.equal(local.getItem(key),null);assert.equal(b.getItem(key),null);assert.equal(b.getItem(key+'-flow-example123-code-verifier'),'fictional-handshake/recovery');
  now+=AUTH_HANDSHAKE_TTL+1;assert.equal(b.getItem(key+'-flow-example123-code-verifier'),null);assert.equal(local.map.size,0);assert.equal(a.getItem(key),'fictional-session');
});
test('an existing tab can migrate its old handshake; remember-device still controls session persistence',()=>{
  const local=memory(),session=memory();session.setItem(key+'-code-verifier','"old-fictional-handshake/recovery"');let remember=false;
  const storage=createAuthStorage({local,session,remember:()=>remember});assert.equal(storage.getItem(key+'-code-verifier'),'"old-fictional-handshake/recovery"');assert.equal(session.getItem(key+'-code-verifier'),null);
  storage.setItem(key,'temporary');remember=true;storage.setItem(key,'remembered');assert.equal(local.getItem(key),'remembered');assert.equal(session.getItem(key),null);
  storage.removeItem(key);storage.removeItem(key+'-code-verifier');assert.equal(local.map.size,0);
});
test('blocked handshake storage fails explicitly instead of silently sending an unusable recovery email',()=>{
  const denied={getItem:()=>{throw Error('Blocked')},setItem:()=>{throw Error('Blocked')},removeItem:()=>{throw Error('Blocked')}};
  const storage=createAuthStorage({local:denied,session:memory()});assert.throws(()=>storage.setItem(key+'-code-verifier','fictional'),/Allow this website/);
});
test('recovery screen resumption is short-lived, tab-local and tied to the authenticated account',()=>{
  const tab=memory();let now=1000;const step=createRecoveryStep(tab,'recovery',{now:()=>now});step.mark('fictional-user');assert.equal(step.active('fictional-user'),true);
  const reload=createRecoveryStep(tab,'recovery',{now:()=>now});assert.equal(reload.active('fictional-user'),true);assert.equal(reload.active('other-user'),false);
  step.mark('fictional-user');now+=15*60*1000;assert.equal(step.active('fictional-user'),false);
  tab.setItem('recovery',JSON.stringify({userId:'fictional-user'}));assert.equal(step.active('fictional-user'),false);
});
test('recovery errors explain rate limits and expired links without exposing provider diagnostics',()=>{
  const limited={status:429,code:'over_email_send_rate_limit',message:'For security purposes, you can only request this after 5 seconds.'};assert.equal(resetRetrySeconds(limited),5);assert.match(authErrorMessage(limited,'forgot'),/wait 5 seconds/);
  assert.equal(resetRetrySeconds({status:429,message:'after 999999 seconds'}),3600);assert.match(authErrorMessage({message:'private-provider-diagnostics'},'callback'),/same browser/);assert.doesNotMatch(authErrorMessage({message:'private-provider-diagnostics'},'forgot'),/private-provider/);
  assert.match(authErrorMessage({code:'same_password'},'reset'),/different/);assert.match(authErrorMessage({status:401},'reset'),/expired/);
});

test('the pinned Supabase SDK completes recovery in another tab and preserves an earlier link after a throttled retry',async()=>{
  const local=memory(),original=memory(),secondTab=memory(),flows=new Map();let rejectNext=false,requests=0,exchanges=0;
  const user={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',aud:'authenticated',role:'authenticated',email:'example@example.invalid',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
  const now=Math.floor(Date.now()/1000),encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const token=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:user.id,aud:'authenticated',role:'authenticated',iat:now,exp:now+3600})+'.fictional-test-signature';
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','x-supabase-api-version':'2024-01-01'}});
  const fetch=async(input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url),body=JSON.parse(options.body||'{}');
    if(url.pathname.endsWith('/recover')){requests++;if(rejectNext)return json({code:'over_email_send_rate_limit',msg:'For security purposes, you can only request this after 5 seconds.'},429);assert.equal(url.searchParams.get('redirect_to'),'https://toolbox.example/community.html');flows.set('fictional-code-'+requests,body.code_challenge);return json({});}
    if(url.pathname.endsWith('/token')){assert.equal(url.searchParams.get('grant_type'),'pkce');assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'),flows.get(body.auth_code));exchanges++;return json({access_token:token,refresh_token:'fictional-refresh-token',expires_in:3600,token_type:'bearer',user});}
    throw new Error('Unexpected fictional auth endpoint: '+url.pathname);
  };
  const client=storage=>createClient('https://fictional-project.supabase.co','fictional-publishable-key',{global:{fetch},auth:{storageKey:key,storage,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
  const aStorage=createAuthStorage({local,session:original}),a=client(aStorage);await a.auth.initialize();
  const start=await requestPasswordReset(a.auth,user.email,'https://toolbox.example/community.html',aStorage,key);assert.equal(start.error,null);
  rejectNext=true;const limited=await requestPasswordReset(a.auth,user.email,'https://toolbox.example/community.html',aStorage,key);assert.equal(limited.error.status,429);assert.equal(resetRetrySeconds(limited.error),5);assert.equal(requests,2);
  const b=client(createAuthStorage({local,session:secondTab}));let recovered=false;const {data:{subscription}}=b.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')recovered=true;});
  await b.auth.initialize();const result=await b.auth.exchangeCodeForSession('fictional-code-1');assert.equal(result.error,null);assert.equal(result.data.redirectType,'recovery');assert.equal(recovered,true);assert.equal(exchanges,1);
  assert.ok(secondTab.getItem(key));assert.equal(local.getItem(key),null);assert.equal(original.getItem(key),null);assert.equal(local.getItem(key+'-code-verifier'),null);subscription.unsubscribe();a.auth.stopAutoRefresh();b.auth.stopAutoRefresh();
});
