import {escapeHTML as esc,renderBody,text} from './domain.mjs';

export const DETAIL_DEFAULTS=Object.freeze({title:'',pronouns:'',occupation:'',status:'',signature:'',skills:[],favorite_tools:[],share_about:false,share_signature:false,reply_location:false,frame:'plain',layout:'classic',density:'comfortable',text_size:'standard',hide_signatures:false,reduce_motion:false});
export function validateDetails(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Check your forum preferences.');
  const out={...DETAIL_DEFAULTS};
  for(const [key,max] of [['title',48],['pronouns',32],['occupation',60],['status',100],['signature',220]])out[key]=text(value[key]??'',max,0);
  if(/\b(?:admin|administrator|moderator|official staff|site owner)\b/iu.test(out.title))throw new Error('Your personal title cannot claim a staff role.');
  for(const [key,max,length] of [['skills',8,24],['favorite_tools',4,80]]){
    const list=value[key]??[];if(!Array.isArray(list)||list.length>max)throw new Error(`Choose up to ${max} ${key==='skills'?'skills':'favorite tools'}.`);
    out[key]=[...new Set(list.map(v=>text(v,length,0)).filter(Boolean))];
  }
  for(const key of ['share_about','share_signature','reply_location','hide_signatures','reduce_motion']){if(value[key]!==undefined&&typeof value[key]!=='boolean')throw new Error('Check your privacy choices.');out[key]=value[key]??false;}
  for(const [key,choices] of [['frame',['plain','ring','stamp']],['layout',['classic','showcase','minimal']],['density',['comfortable','compact']],['text_size',['standard','large']]]){
    out[key]=value[key]??DETAIL_DEFAULTS[key];if(!choices.includes(out[key]))throw new Error('Choose a valid forum appearance.');
  }
  return out;
}
export function publicDetails(value={}){
  const d=validateDetails(value),out={frame:d.frame,layout:d.layout,reply_location:d.reply_location};
  if(d.share_about)Object.assign(out,{share_about:true,title:d.title,pronouns:d.pronouns,occupation:d.occupation,status:d.status,skills:d.skills,favorite_tools:d.favorite_tools});
  if(d.share_signature)Object.assign(out,{share_signature:true,signature:d.signature});
  return out;
}
export function easternTime(value){
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return 'Time unavailable';
  return new Intl.DateTimeFormat('en-US',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'America/New_York',timeZoneName:'short'}).format(date);
}
export function replyLocation(reply,profile){
  if(reply.author_kind==='edward')return 'Automated assistant';
  return profile?.published&&profile?.account_active&&profile?.details?.reply_location&&profile?.location?profile.location:'Location not supplied';
}
// Format a deliberately small, escaped subset. No raw HTML, images or embeds.
export function forumBody(value){
  return String(value??'').split('\n').map(line=>{
    const quote=line.startsWith('> ');let html=renderBody(quote?line.slice(2):line);
    // Format text segments only; never modify hrefs or other generated markup.
    html=html.split(/(<a\b[^>]*>[\s\S]*?<\/a>)/gu).map((part,i)=>i%2?part:part.replace(/`([^`\n]+)`/gu,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/gu,'<strong>$1</strong>').replace(/\[b\]([\s\S]*?)\[\/b\]/giu,'<strong>$1</strong>').replace(/\[i\]([\s\S]*?)\[\/i\]/giu,'<em>$1</em>')).join('');
    return quote?`<blockquote>${html}</blockquote>`:html;
  }).join('<br>');
}
export function draftKey(user,kind,id=''){return `commons-draft-v1:${user||'guest'}:${kind}:${id}`;}
export function readDraft(storage,key){try{const d=JSON.parse(storage.getItem(key)||'null');if(d&&d.version===1&&Date.now()-d.saved_at<30*86400000)return d;storage.removeItem?.(key);return null;}catch{return null;}}
export function saveDraft(storage,key,values){try{storage.setItem(key,JSON.stringify({version:1,saved_at:Date.now(),values}));if(typeof storage.key==='function'){const keys=Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k?.startsWith('commons-draft-v1:'));const rows=keys.map(k=>[k,readDraft(storage,k)]).filter(([,d])=>d).sort((a,b)=>b[1].saved_at-a[1].saved_at);for(const [old] of rows.slice(20))storage.removeItem(old);}return true;}catch{return false;}}
export function timeHTML(value){return `<time datetime="${esc(value||'')}">${esc(easternTime(value))}</time>`;}
