import {text,displayName,validatePost,reviewContent,edwardReply,canPost,RULES_VERSION} from './domain.mjs';
import {validateProfile} from './profile-domain.mjs';
import {validateLabPost} from './lab-domain.mjs';
import {handleLabAction,currentCatalog} from './lab-handler.mjs';

export class HttpError extends Error {constructor(status,message){super(message);this.status=status}}
const uuid=value=>{if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value))throw new HttpError(400,'Invalid record.');return value};
const check=result=>{if(result.error)throw new HttpError(503,'The community could not complete that request. Please try again.');return result.data};
const changed=result=>{const row=check(result);if(!row)throw new HttpError(404,'That record is unavailable. Refresh the owner dashboard.');return row};
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function tokenHash(value){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))))}
export function isVerifiedOwner(user,email){return !!user?.email_confirmed_at&&typeof email==='string'&&email.length>0&&user.email?.toLowerCase()===email.toLowerCase()}
async function readJSON(request){
  const limit=20000;
  if(Number(request.headers.get('Content-Length')||0)>limit)throw new HttpError(413,'That request is too large.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Invalid request.');
  const chunks=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw new HttpError(413,'That request is too large.');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{throw new HttpError(400,'Invalid request.');}
}

export function createCommunityHandler({db,auth,sendMail,catalog,ownerEmail,siteURL,allowedOrigins,senderConfigured=false}){
  const baseURL=new URL(siteURL);if(baseURL.protocol!=='https:')throw new Error('An HTTPS community URL is required.');
  if(!ownerEmail||!Array.isArray(allowedOrigins)||!allowedOrigins.length)throw new Error('Owner and origin configuration is required.');
  const origins=new Set(allowedOrigins);
  async function claim(bucket,seconds,limit){const ok=check(await db.rpc('community_claim_action',{p_bucket:bucket,p_window_seconds:seconds,p_limit:limit}));if(!ok)throw new HttpError(429,'Please give the community a moment, then try again.');}
  async function audit(actor,action,subject,details={}){check(await db.from('community_audit').insert({actor_id:actor,action,subject_id:subject,details}));}
  async function notifyOwner(subject,message){
    try{await claim('email:owner',86400,50);await sendMail({to:ownerEmail,subject:`[Cowboy’s Web Toolbox] ${subject}`,text:message});return true}catch{return false}
  }
  async function getMember(user){return check(await db.from('community_members').select('*').eq('user_id',user.id).maybeSingle());}
  async function ensureMember(user,payload){
    let member=await getMember(user);const owner=isVerifiedOwner(user,ownerEmail);
    if(owner){
      if(!member||member.role!=='owner'||member.status!=='approved')member=check(await db.from('community_members').upsert({user_id:user.id,display_name:'Cowboy',role:'owner',status:'approved',rules_version:RULES_VERSION},{onConflict:'user_id'}).select().single());
      return member;
    }
    if(!member){
      if(payload.rulesVersion!==RULES_VERSION)throw new HttpError(400,'Please accept the current community guidelines.');
      const name=displayName(payload.displayName||user.user_metadata?.display_name);
      const result=await db.from('community_members').insert({user_id:user.id,display_name:name,rules_version:RULES_VERSION}).select().single();
      if(result.error?.code==='23505')member=await getMember(user);else member=check(result);
    }
    return member;
  }
  async function approvalEmail(member,renew=false){
    const existing=check(await db.from('community_approvals').select('id,email_status,expires_at,consumed_at').eq('user_id',member.user_id).maybeSingle());
    if(existing&&!renew)return existing.email_status;
    const token=hex(crypto.getRandomValues(new Uint8Array(32)));
    const data={user_id:member.user_id,token_hash:await tokenHash(token),expires_at:new Date(Date.now()+48*3600000).toISOString(),consumed_at:null,email_status:'pending'};
    let inserted;
    if(renew)inserted=await db.from('community_approvals').upsert(data,{onConflict:'user_id'}).select('id').single();
    else inserted=await db.from('community_approvals').insert(data).select('id').single();
    if(inserted.error?.code==='23505')return 'pending';
    const record=check(inserted);
    const reviewURL=new URL(baseURL);reviewURL.hash='review='+token;
    const sent=await notifyOwner('A member is ready for review',`A verified member, ${member.display_name}, requested posting access.\n\nReview the request: ${reviewURL.href}\n\nThis link expires in 48 hours. Sign in using the verified owner email, then explicitly approve or decline. Opening the link alone changes nothing.\n\nNever forward authorization links. You can also review requests in the owner dashboard.`);
    check(await db.from('community_approvals').update({email_status:sent?'sent':'failed'}).eq('id',record.id));
    return sent?'sent':'failed';
  }
  function requireOwner(user){if(!isVerifiedOwner(user,ownerEmail))throw new HttpError(403,'Owner access is required.');}
  function requirePosting(member){if(!canPost(member))throw new HttpError(403,member?.status==='pending'?'Cowboy must approve your posting access first.':'Posting access is unavailable.');}
  async function publicThread(id){const thread=check(await db.from('community_threads').select('*').eq('id',uuid(id)).eq('status','published').maybeSingle());if(!thread)throw new HttpError(404,'That conversation is unavailable.');return thread;}
  async function dispatch(payload,user){
    const action=payload.action;
    if(action==='bootstrap'){
      const member=await ensureMember(user,payload);let notice=null;
      if(member.status==='pending')notice=await approvalEmail(member);
      const profile=check(await db.from('community_profiles').select('*').eq('user_id',user.id).maybeSingle());
      return {member:{...member,role:isVerifiedOwner(user,ownerEmail)?'owner':'member'},profile,approvalEmailStatus:notice};
    }
    const member=await getMember(user);
    if(!member)throw new HttpError(403,'Complete your membership request first.');
    if(action==='resend_approval'){
      if(member.status!=='pending')throw new HttpError(409,'This account has already been reviewed.');
      await claim(`approval:${user.id}`,3600,1);
      return {approvalEmailStatus:await approvalEmail(member,true)};
    }
    if(action==='profile'){
      await claim(`profile:${user.id}`,60,6);
      const name=isVerifiedOwner(user,ownerEmail)?'Cowboy':displayName(payload.displayName);
      let profile=null;
      if(payload.profile!==undefined){try{profile=validateProfile(payload.profile,{userId:user.id,isOwner:isVerifiedOwner(user,ownerEmail)});}catch(error){throw new HttpError(400,error.message);}}
      if(profile?.published&&reviewContent(profile.headline+'\n'+profile.bio).status==='held')throw new HttpError(400,'Please remove private credentials or link floods before sharing your profile.');
      const result=await db.rpc('community_save_profile',{p_user:user.id,p_name:name,p_profile:profile});
      if(result.error?.code==='23505')throw new HttpError(409,'That profile handle is already in use. Choose another.');
      return {display_name:name,profile:check(result)};
    }
    if(action.startsWith('hub_')){if(action==='hub_owner')requireOwner(user);return handleLabAction({payload,user,member,db,catalog,notifyOwner});}
    if(action==='create_thread'){
      requirePosting(member);await claim(`thread:${user.id}`,60,1);await claim(`thread-day:${user.id}`,86400,10);
      const available=await currentCatalog(db,catalog);const post={...validatePost(payload,available),...validateLabPost(payload,available,{isOwner:isVerifiedOwner(user,ownerEmail)})};const review=reviewContent(post.title+'\n'+post.body+'\n'+JSON.stringify(post.post_data));
      const thread=check(await db.rpc('community_create_lab_thread',{p_actor:user.id,p_post:{...post,status:review.status}}));
      await audit(user.id,'thread.created',thread.id,{status:thread.status});
      if(review.status==='held')await notifyOwner('A conversation needs review',`A conversation was held for review: ${thread.title}\nReason: ${review.reasons.join('; ')}\n\nSign in to the owner dashboard: ${baseURL.href}`);
      else {
        const reply=edwardReply(thread,catalog);
        if(reply)check(await db.from('community_replies').insert({thread_id:thread.id,author_id:null,author_name:'Edward',author_kind:'edward',body:reply}));
      }
      return {thread};
    }
    if(action==='reply'){
      requirePosting(member);await claim(`reply:${user.id}`,30,1);await claim(`reply-day:${user.id}`,86400,40);
      const thread=await publicThread(payload.threadId);if(thread.locked)throw new HttpError(409,'This conversation is closed to new replies.');
      const body=text(payload.body,6000,2),review=reviewContent(body);
      const reply=check(await db.from('community_replies').insert({thread_id:thread.id,author_id:user.id,author_name:member.display_name,author_kind:'member',body,status:review.status}).select().single());
      if(review.status==='held')await notifyOwner('A reply needs review',`A reply in “${thread.title}” was held.\n\nReview it in the owner dashboard: ${baseURL.href}`);
      else {
        const answer=edwardReply({title:'',body,site_id:thread.site_id},catalog);
        if(answer)check(await db.from('community_replies').insert({thread_id:thread.id,author_id:null,author_name:'Edward',author_kind:'edward',body:answer}));
      }
      return {reply};
    }
    if(action==='report'){
      if(member.status==='suspended')throw new HttpError(403,'This account is suspended.');
      await claim(`report:${user.id}`,3600,3);const thread=await publicThread(payload.threadId);
      const reason=payload.reason;if(!['spam','privacy','abuse','broken-link','other'].includes(reason))throw new HttpError(400,'Choose a report reason.');
      const replyId=payload.replyId?uuid(payload.replyId):null;
      if(replyId){const reply=check(await db.from('community_replies').select('id').eq('id',replyId).eq('thread_id',thread.id).eq('status','published').maybeSingle());if(!reply)throw new HttpError(404,'That reply is unavailable.');}
      const report=check(await db.from('community_reports').insert({reporter_id:user.id,thread_id:thread.id,reply_id:replyId,reason,details:payload.details?text(payload.details,2000,1):''}).select('id').single());
      const emailSent=await notifyOwner('A community report needs review',`A member reported “${thread.title}” for ${reason}.\n\nReview report ${report.id} in the owner dashboard: ${baseURL.href}\n\nThe report is private. No automatic ban or removal has been applied.`);
      return {recorded:true,emailSent};
    }
    if(action==='deletion_request'){
      await claim(`deletion:${user.id}`,86400,1);
      check(await db.from('community_deletion_requests').upsert({user_id:user.id},{onConflict:'user_id',ignoreDuplicates:true}));
      const emailSent=await notifyOwner('An account deletion request needs review',`A member requested account deletion. Review the request in the owner dashboard: ${baseURL.href}`);
      return {requested:true,emailSent};
    }
    requireOwner(user);
    if(action==='admin_discovery')return check(await db.rpc('community_discovery_overview',{}));
    if(action==='admin_overview')return {...check(await db.rpc('community_admin_overview',{p_actor:user.id})),senderConfigured};
    if(action==='admin_members')return check(await db.rpc('community_admin_members',{p_actor:user.id,p_search:payload.search?text(payload.search,80,0):'',p_status:payload.status||'all',p_offset:Number.isInteger(payload.offset)?payload.offset:0}));
    if(action==='admin_bulk'){
      if(payload.confirm!==true)throw new HttpError(400,'Confirm the selected member changes.');
      if(!Array.isArray(payload.userIds)||payload.userIds.length<1||payload.userIds.length>20)throw new HttpError(400,'Choose one to twenty members.');
      const ids=[...new Set(payload.userIds.map(uuid))];
      if(!['approved','declined','suspended'].includes(payload.status))throw new HttpError(400,'Choose a valid member status.');
      return check(await db.rpc('community_bulk_member_status',{p_actor:user.id,p_users:ids,p_status:payload.status}));
    }
    if(action==='announcement'){
      if(payload.confirm!==true||typeof payload.enabled!=='boolean')throw new HttpError(400,'Confirm the announcement change.');
      return {announcement:check(await db.rpc('community_set_announcement',{p_actor:user.id,p_text:text(payload.text||'',500,0),p_enabled:payload.enabled}))};
    }
    if(action==='owner_test_mail'){
      if(payload.confirm!==true)throw new HttpError(400,'Confirm the owner email test.');
      await claim('email:owner-test',600,1);
      return {emailSent:await notifyOwner('Owner notification test','Your message-board notification sender accepted this owner test. No password, session credential or authorization link is included.')};
    }
    if(action==='admin_queue'){
      const [members,reports,threads,replies,deletions,accounts]=await Promise.all([
        db.from('community_members').select('user_id,display_name,status,created_at').eq('status','pending').order('created_at').limit(50),
        db.from('community_reports').select('*').eq('status','open').order('created_at').limit(50),
        db.from('community_threads').select('*').eq('status','held').order('created_at').limit(50),
        db.from('community_replies').select('*').eq('status','held').order('created_at').limit(50),
        db.from('community_deletion_requests').select('*').eq('status','pending').order('created_at').limit(50),
        db.from('community_members').select('user_id,display_name,status,created_at').eq('role','member').neq('status','pending').order('created_at',{ascending:false}).limit(50)
      ]);
      return {members:check(members),reports:check(reports),threads:check(threads),replies:check(replies),deletions:check(deletions),accounts:check(accounts)};
    }
    if(action==='review_link'){
      const token=text(payload.token,64,64);if(!/^[0-9a-f]{64}$/u.test(token))throw new HttpError(400,'Invalid review link.');
      const approval=check(await db.from('community_approvals').select('user_id,expires_at,consumed_at').eq('token_hash',await tokenHash(token)).maybeSingle());
      if(!approval||approval.consumed_at||Date.parse(approval.expires_at)<=Date.now())throw new HttpError(410,'This review link expired or has already been used. Open the owner queue instead.');
      return {member:check(await db.from('community_members').select('user_id,display_name,status,created_at').eq('user_id',approval.user_id).single())};
    }
    if(action==='review_member'){
      if(payload.confirm!==true)throw new HttpError(400,'Confirm the membership decision.');
      const decision=payload.decision;if(!['approved','declined'].includes(decision))throw new HttpError(400,'Choose approve or decline.');
      const hash=payload.token?await tokenHash(text(payload.token,64,64)):null;
      const result=await db.rpc('community_review_member',{p_actor:user.id,p_user:uuid(payload.userId),p_decision:decision,p_token_hash:hash});
      if(result.error)throw new HttpError(409,'The request or review link is no longer available. Refresh the owner queue.');
      return {reviewed:true,decision};
    }
    if(action==='moderate'){
      if(payload.confirm!==true)throw new HttpError(400,'Confirm the moderation action.');
      const id=uuid(payload.id),kind=payload.kind;
      if(kind==='thread'||kind==='reply'){
        if(!['published','hidden'].includes(payload.status))throw new HttpError(400,'Choose publish or hide.');
        changed(await db.from(kind==='thread'?'community_threads':'community_replies').update({status:payload.status}).eq('id',id).select('id').maybeSingle());
      }else if(kind==='lock'){
        if(typeof payload.locked!=='boolean')throw new HttpError(400,'Choose a conversation state.');
        changed(await db.from('community_threads').update({locked:payload.locked}).eq('id',id).select('id').maybeSingle());
      }else if(kind==='pin'){
        if(typeof payload.pinned!=='boolean')throw new HttpError(400,'Choose a pin state.');
        changed(await db.from('community_threads').update({pinned:payload.pinned}).eq('id',id).select('id').maybeSingle());
      }else if(kind==='member'){
        if(id===user.id)throw new HttpError(400,'You cannot suspend your owner account.');
        if(!['suspended','approved'].includes(payload.status))throw new HttpError(400,'Choose suspend or restore.');
        changed(await db.from('community_members').update({status:payload.status}).eq('user_id',id).eq('role','member').select('user_id').maybeSingle());
      }else if(kind==='report')changed(await db.from('community_reports').update({status:'resolved',resolved_at:new Date().toISOString()}).eq('id',id).select('id').maybeSingle());
      else throw new HttpError(400,'Unknown moderation action.');
      await audit(user.id,`moderation.${kind}`,id,{status:payload.status||null,locked:payload.locked??null,pinned:payload.pinned??null});return {updated:true};
    }
    throw new HttpError(400,'Unknown community action.');
  }
  return async function handler(request){
    const origin=request.headers.get('Origin');const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(origin&&origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'});
    const respond=(status,value)=>new Response(JSON.stringify(value),{status,headers});
    try{
      if(origin&&!origins.has(origin))throw new HttpError(403,'This origin is not allowed.');
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
      if(request.method!=='POST')throw new HttpError(405,'Use a confirmed POST request.');
      if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw new HttpError(415,'Send JSON.');
      const token=request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/u)?.[1];
      if(!token)throw new HttpError(401,'Sign in to continue.');
      const {data,error}=await auth.getUser(token);
      if(error||!data?.user)throw new HttpError(401,'Your session expired. Sign in again.');
      if(!data.user.email_confirmed_at)throw new HttpError(403,'Verify your own email address before continuing.');
      const payload=await readJSON(request);
      if(!payload||typeof payload!=='object'||Array.isArray(payload)||typeof payload.action!=='string')throw new HttpError(400,'Choose an action.');
      return respond(200,await dispatch(payload,data.user));
    }catch(error){const known=error instanceof HttpError;const validation=!known&&error instanceof Error&&/^(Please |Choose )/u.test(error.message);return respond(known?error.status:validation?400:500,{error:known||validation?error.message:'The community is temporarily unavailable. Please try again.'});}
  };
}
