import {validateRank,validatePowerChange} from './powers-domain.mjs';
import {text,canPost} from './domain.mjs';

export async function handlePowerAction({payload,user,member,db,verifiedOwner,HttpError,claim}){
  const uuid=value=>{if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value))throw new HttpError(400,'Choose a valid record.');return value;};
  const rpc=async(name,args)=>{const result=await db.rpc(name,args);if(!result.error)return result.data;const code=result.error.code;
    if(code==='42501')throw new HttpError(403,'This power, board or member is outside your current rank.');
    if(['40001','40P01','23505'].includes(code))throw new HttpError(409,'This record or rank changed. Refresh before trying again.');
    if(code==='P0002')throw new HttpError(404,'That record is no longer available.');
    if(['23514','22P02','22023'].includes(code))throw new HttpError(400,'Check the selected power, destination and details.');
    throw new HttpError(503,'The Power House could not save that action. Try again shortly.');};
  if(member?.role==='owner'&&!verifiedOwner)throw new HttpError(403,'Verified owner access is required.');
  if(payload.action==='power_state')return rpc('community_power_state',{p_actor:user.id});
  if(!canPost(member))throw new HttpError(403,'Approved posting access is required.');
  if(payload.action==='power_console')return rpc('community_power_console',{p_actor:user.id,p_search:payload.search?text(payload.search,80,0):'',p_offset:Number.isInteger(payload.offset)?Math.max(0,Math.min(payload.offset,5000)):0});
  if(payload.action==='power_compare')return rpc('community_power_compare',{p_actor:user.id,p_receipt:uuid(payload.receipt)});
  if(payload.confirm!==true)throw new HttpError(400,'Review and confirm the exact change first.');
  await claim(`powers:${user.id}`,60,40);
  if(payload.action==='power_rank'){
    if(!verifiedOwner)throw new HttpError(403,'Only Cowboy can define the hierarchy.');
    let rank;try{rank=validateRank(payload.rank);}catch(error){throw new HttpError(400,error.message);}
    return {rank:await rpc('community_power_save_rank',{p_actor:user.id,p_rank:rank})};
  }
  if(payload.action==='power_assign'){
    const scopes=payload.scopes??[];
    if(!Array.isArray(scopes)||scopes.length>5||scopes.some(c=>!['discoveries','help','repair','creative','feedback'].includes(c)))throw new HttpError(400,'Choose valid board scopes.');
    if(payload.roleId!==null&&(typeof payload.roleId!=='string'||!/^[a-z][a-z0-9_-]{1,29}$/u.test(payload.roleId)))throw new HttpError(400,'Choose an available rank.');
    if(!Number.isInteger(payload.hours)||payload.hours<0||payload.hours>2160||!Number.isInteger(payload.revision)||payload.revision<0)throw new HttpError(400,'Check the grant duration.');
    return {state:await rpc('community_power_assign',{p_actor:user.id,p_user:uuid(payload.userId),p_role:payload.roleId,p_scopes:scopes,p_hours:payload.hours,p_expected:payload.revision})};
  }
  if(payload.action==='power_apply'){
    let change;try{change=validatePowerChange(payload.change);}catch(error){throw new HttpError(400,error.message);}
    change.targetId=uuid(change.targetId);if(!['thread','reply','member'].includes(change.targetKind))throw new HttpError(400,'Choose a post or member.');
    if(change.data.replyId)change.data.replyId=uuid(change.data.replyId);
    if(change.data.replyIds)change.data.replyIds=change.data.replyIds.map(uuid);
    if(change.data.toThreadId)change.data.toThreadId=uuid(change.data.toThreadId);
    return rpc('community_power_apply',{p_actor:user.id,p_change:change});
  }
  if(payload.action==='power_undo')return rpc('community_power_undo',{p_actor:user.id,p_receipt:uuid(payload.receipt)});
  throw new HttpError(400,'Unknown Power House action.');
}
