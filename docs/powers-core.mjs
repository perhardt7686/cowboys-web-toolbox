import {text,CATEGORIES,reviewContent} from './community-core.mjs';

export const POWER_COLORS=['violet','gold','teal','rose','blue','ember'];
export const POWER_FRAMES=['plain','outline','glow'];
export const POWER_AURAS=['plain','halo','sparkle'];
export const POWERS=[
  {id:'posts.edit',group:'Posts',name:'Polish the words',description:'Edit post text, with original authorship, an editor label and a saved revision.'},
  {id:'posts.note',group:'Posts',name:'Add an editor note',description:'Attach a useful explanation or summary without rewriting the author.'},
  {id:'posts.style',group:'Posts',name:'Light it up',description:'Choose an accent, outline or gentle glow for a post.'},
  {id:'posts.label',group:'Posts',name:'Give it a ribbon',description:'Add a short, public label such as Worth a try or Great guide.'},
  {id:'topics.organize',group:'Topics',name:'Put things in order',description:'Rename a topic or move it to a better category.'},
  {id:'topics.pin',group:'Topics',name:'Pin a good find',description:'Pin or unpin a conversation at the top.'},
  {id:'topics.close',group:'Topics',name:'Open or pause a topic',description:'Close new replies and reopen the conversation later.'},
  {id:'topics.spotlight',group:'Topics',name:'Shine a spotlight',description:'Feature a conversation so useful work stands out.'},
  {id:'topics.move',group:'Topics',name:'Bring replies together',description:'Move selected replies to an existing topic while preserving their authors and links.'},
  {id:'topics.split',group:'Topics',name:'Give an idea its own room',description:'Split selected replies into a new, clearly attributed conversation.'},
  {id:'answers.choose',group:'Topics',name:'Recognize the answer',description:'Choose or clear a helpful member answer on a tool request.'},
  {id:'posts.review',group:'Posts',name:'Put a post in review',description:'Temporarily hold a post; only the owner releases held content.'},
  {id:'members.honor',group:'People',name:'Award a little honor',description:'Give a member a custom honor, title or ribbon; this grants no permissions.'},
  {id:'members.style',group:'People',name:'Add a flourish',description:'Award a color, halo or sparkle that the member can opt out of.'},
  {id:'history.undo',group:'Stewardship',name:'Turn back your changes',description:'Undo your own unchanged, permitted actions. The owner can undo any eligible action.'},
  {id:'ranks.delegate',group:'Stewardship',name:'Pass on permitted powers',description:'Assign lower ranks within your own powers, board scope and expiry. You cannot promote yourself.'}
];
export const POWER_IDS=POWERS.map(p=>p.id);
const optional=(value,max)=>text(value??'',max,0);
const reserved=value=>/\b(?:owner|administrator|admin|moderator|edward|cowboy)\b/iu.test(value);
const choice=(value,options,fallback)=>{const v=value??fallback;if(!options.includes(v))throw new Error('Choose an available visual style.');return v;};
export function validateRank(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Check the rank details.');
  const name=text(input.name,40,2);if(/\b(?:owner|cowboy|edward|system)\b/iu.test(name))throw new Error('Choose a rank name that does not impersonate the owner or system.');
  if(!Number.isInteger(input.level)||input.level<1||input.level>900)throw new Error('Use a rank level from 1 to 900. Cowboy remains at 1000.');
  if(!Array.isArray(input.capabilities)||input.capabilities.length>POWER_IDS.length||input.capabilities.some(p=>!POWER_IDS.includes(p)))throw new Error('Choose only the powers listed here.');
  if(input.active!==undefined&&typeof input.active!=='boolean')throw new Error('Choose whether this rank is active.');
  if(input.id!==undefined&&input.id!==null&&!/^[a-z][a-z0-9_-]{1,29}$/u.test(input.id))throw new Error('Invalid rank identifier.');
  return {id:input.id||null,name,level:input.level,color:choice(input.color,POWER_COLORS,'violet'),description:optional(input.description,200),capabilities:[...new Set(input.capabilities)],active:input.active??true,revision:Number.isInteger(input.revision)?input.revision:0};
}
export function validatePowerChange(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Choose a power.');
  const kind=input.kind,data=input.data||{},reason=text(input.reason,240,3);let clean;
  const reviewed=value=>{if(reviewContent(value).status==='held')throw new Error('Remove private credentials or excessive links before publishing this change.');return value;};
  if(kind==='edit')clean={body:reviewed(text(data.body,6000,input.targetKind==='thread'?12:2)),...(data.title!==undefined?{title:text(data.title,140,8)}:{})};
  else if(kind==='note')clean={note:reviewed(optional(data.note,500))};
  else if(kind==='style')clean={accent:choice(data.accent,POWER_COLORS,'violet'),frame:choice(data.frame,POWER_FRAMES,'plain')};
  else if(kind==='label')clean={label:optional(data.label,24)};
  else if(kind==='organize')clean={title:text(data.title,140,8),category:choice(data.category,CATEGORIES.map(c=>c.id),'help')};
  else if(['pin','close','spotlight'].includes(kind)){if(typeof data.enabled!=='boolean')throw new Error('Choose whether to enable this power.');clean={enabled:data.enabled};}
  else if(kind==='review')clean={};
  else if(kind==='answer')clean={replyId:data.replyId||null};
  else if(kind==='honor'){clean={title:optional(data.title,48),badge:optional(data.badge,32)};if(reserved(clean.title+' '+clean.badge))throw new Error('Honors must not impersonate a staff rank. Use the rank controls to grant actual authority.');}
  else if(kind==='member_style')clean={accent:choice(data.accent,POWER_COLORS,'violet'),aura:choice(data.aura,POWER_AURAS,'plain')};
  else if(kind==='move'||kind==='split'){
    if(!Array.isArray(data.replyIds)||!data.replyIds.length||data.replyIds.length>20)throw new Error('Choose one to twenty replies.');
    clean={replyIds:[...new Set(data.replyIds)],...(kind==='move'?{toThreadId:data.toThreadId}:{title:text(data.title,140,8),category:choice(data.category,CATEGORIES.map(c=>c.id),'help')})};
  }else throw new Error('Choose an available power.');
  return {kind,targetKind:input.targetKind,targetId:input.targetId,revision:Number.isInteger(input.revision)?input.revision:0,data:clean,reason};
}
export function publicHonor(row,now=Date.now()){
  if(!row||row.member_opt_out)return null;
  return {...row,rank_label:row.rank_expires_at&&Date.parse(row.rank_expires_at)<=now?'':row.rank_label};
}
