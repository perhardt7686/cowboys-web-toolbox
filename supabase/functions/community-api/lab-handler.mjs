import {text} from './domain.mjs';
import {canonicalHost,officialURL,SITE_CATEGORIES,additionToSite} from './lab-domain.mjs';

const checked=result=>{if(result.error){if(['22023','22P02','23514','23505'].includes(result.error.code))throw new Error('Please check your request. '+(result.error.code==='23505'?'That discovery is already recorded.':result.error.message));throw new Error('Please try again. The community could not save that change.');}return result.data;};
export async function currentCatalog(db,base){const rows=checked(await db.from('community_catalog_additions').select('*').eq('published',true).limit(500));return [...base,...rows.map(additionToSite)];}
export async function handleLabAction({payload,user,db,catalog,notifyOwner}){
  const action=payload.action;
  if(action==='hub_state')return checked(await db.rpc('community_hub_state',{p_actor:user.id}));
  if(action==='hub_mutate'){
    const allowed=['helpful','following','saved','poll_vote','accept_answer','notification_read','digest','site_report'];
    if(!allowed.includes(payload.kind))throw new Error('Please choose a community action.');
    const result=checked(await db.rpc('community_hub_mutate',{p_actor:user.id,p_action:payload.kind,p_data:payload.data||{}}));
    if(payload.kind==='site_report')result.emailSent=await notifyOwner('A website listing needs review','A member reported a changed link, price, signup requirement or listing detail. Review the private site-report queue in your owner dashboard.');
    return result;
  }
  if(action==='hub_owner'){
    const kind=payload.kind;
    if(kind==='overview')return {...checked(await db.rpc('community_hub_owner',{p_actor:user.id,p_action:kind,p_data:{}})),...checked(await db.rpc('community_programs_overview',{p_actor:user.id}))};
    if(payload.confirm!==true)throw new Error('Please confirm the owner change.');
    if(kind==='publish_prompt')return checked(await db.rpc('community_publish_program',{p_actor:user.id,p_slug:text(payload.slug,60,1)}));
    if(!['review_discovery','feature_project','resolve_site_report'].includes(kind))throw new Error('Please choose an owner action.');
    const data={...(payload.data||{}),confirm:true};
    if(kind==='review_discovery'&&data.status==='added'){
      const row=checked(await db.from('community_threads').select('*').eq('id',data.threadId).eq('status','published').maybeSingle());
      if(!row||row.post_kind!=='discovery')throw new Error('Please choose a published discovery.');
      const url=officialURL(row.post_data.url),host=canonicalHost(url),all=await currentCatalog(db,catalog);
      const existing=all.find(s=>canonicalHost(s.url)===host);
      if(existing)data.existingSiteId=existing.id;
      else{if(!SITE_CATEGORIES.includes(data.category))throw new Error('Please choose a toolbox category.');Object.assign(data,{name:text(data.name||row.post_data.name,80,2),description:text(data.description||row.post_data.useCase,240,12),url,host});}
    }
    return checked(await db.rpc('community_hub_owner',{p_actor:user.id,p_action:kind,p_data:data}));
  }
  throw new Error('Please choose a community action.');
}
