import {text,safeHttps} from './community-core.mjs';

export const PROFILE_THEMES=[{id:'forest',name:'Woodland'},{id:'copper',name:'Copper'},{id:'ocean',name:'Ocean'},{id:'midnight',name:'Midnight'},{id:'sunrise',name:'Sunrise'},{id:'plum',name:'Wild plum'}];
export const PROFILE_COVERS=[{id:'contours',name:'Trail lines'},{id:'dots',name:'Constellation'},{id:'sunburst',name:'Sunburst'},{id:'stripes',name:'Field notes'},{id:'plain',name:'Keep it simple'},{id:'circuit',name:'Circuit'}];
export const PROFILE_ICONS=[{id:'compass',symbol:'◈',name:'Compass'},{id:'spark',symbol:'✳',name:'Spark'},{id:'leaf',symbol:'❧',name:'Leaf'},{id:'hammer',symbol:'⚒',name:'Maker'},{id:'bolt',symbol:'ϟ',name:'Lightning'},{id:'mountain',symbol:'△',name:'Mountain'},{id:'coffee',symbol:'☕',name:'Coffee'},{id:'fox',symbol:'🦊',name:'Fox'},{id:'planet',symbol:'◉',name:'Planet'},{id:'rocket',symbol:'🚀',name:'Rocket'},{id:'paw',symbol:'🐾',name:'Paw'}];
export const PROFILE_FIELDS='user_id,display_name,handle,headline,bio,location,website,interests,links,avatar_mode,avatar_icon,avatar_path,theme,cover,published,account_active,badge,joined_at,updated_at';
export const AVATAR_BUCKET='community-avatars';
export const PROFILE_DEFAULTS=Object.freeze({handle:'',headline:'',bio:'',location:'',website:'',interests:[],links:[],avatar_mode:'initials',avatar_icon:'compass',avatar_path:null,theme:'forest',cover:'contours',published:false});
const optional=(value,max)=>value===undefined||value===null?'':text(value,max,0);
const choice=(value,options,fallback,label)=>{const v=value??fallback;if(!options.includes(v))throw new Error(`Choose a valid ${label}.`);return v};
const url=value=>{const v=optional(value,300);if(!v)return '';const parsed=safeHttps(v);if(!parsed)throw new Error('Profile links must use HTTPS and cannot contain login credentials.');return parsed;};
export function validateProfile(input,{userId,isOwner=false}={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Please check your profile details.');
  const handle=optional(input.handle,24).toLowerCase();
  if(handle&&!/^[a-z][a-z0-9_]{2,23}$/u.test(handle))throw new Error('Use 3–24 letters, numbers or underscores for your handle; start with a letter.');
  if(handle&&/^(edward|admin|administrator|moderator|support|system|owner|cowboy)$/u.test(handle)&&!(isOwner&&handle==='cowboy'))throw new Error('Choose a personal handle without a staff title.');
  if(input.published!==undefined&&typeof input.published!=='boolean')throw new Error('Choose whether to share your profile.');
  const interests=input.interests??[];if(!Array.isArray(interests)||interests.length>8)throw new Error('Choose up to eight interests.');
  const tags=[...new Set(interests.map(v=>optional(v,24)).filter(Boolean))];
  const links=input.links??[];if(!Array.isArray(links)||links.length>3)throw new Error('Add up to three links.');
  const cleanLinks=links.map(link=>{if(!link||typeof link!=='object')throw new Error('Check your profile links.');const href=url(link.url);return href?{label:optional(link.label,24)||'Website',url:href}:null}).filter(Boolean);
  const avatar_mode=choice(input.avatar_mode,['initials','icon','photo'],'initials','avatar style');
  const avatar_path=avatar_mode==='photo'?optional(input.avatar_path,100):null;
  if(avatar_mode==='photo'&&(!userId||!['avatar.webp','avatar.png'].some(name=>avatar_path===`${userId}/${name}`)))throw new Error('Upload a profile picture for your own account first.');
  return {handle,headline:optional(input.headline,80),bio:optional(input.bio,600),location:optional(input.location,60),website:url(input.website),interests:tags,links:cleanLinks,avatar_mode,avatar_icon:choice(input.avatar_icon,PROFILE_ICONS.map(v=>v.id),'compass','avatar icon'),avatar_path,theme:choice(input.theme,PROFILE_THEMES.map(v=>v.id),'forest','profile color'),cover:choice(input.cover,PROFILE_COVERS.map(v=>v.id),'contours','cover style'),published:input.published??false};
}
export function profileCompletion(profile={}){const done=[profile.avatar_mode==='photo'||profile.avatar_mode==='icon',!!profile.headline,!!profile.bio,profile.interests?.length>0,!!profile.website||profile.links?.length>0].filter(Boolean).length;return Math.round(done/5*100);}
export function csvText(rows){return rows.map(row=>row.map(value=>{let s=String(value??'');if(/^\s*[=+\-@]|^[\t\r\n]/u.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}).join(',')).join('\r\n');}
