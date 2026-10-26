import {text,safeHttps} from './community-core.mjs';

export const POST_KINDS=[['discussion','A conversation'],['request','Find me a tool'],['discovery','A new discovery'],['review','Community tested'],['project','Made with the toolbox'],['poll','Ask the community'],['challenge','Cowboy’s challenge']];
export const KIND_LABELS=Object.fromEntries(POST_KINDS);
export const OUTCOMES={worked:'Worked for me',paid:'Needed a paid feature',problem:'Had a problem'};
export const SITE_CATEGORIES=['Utilities','Creative','Learning','Games','Movies & media','Travel','Shopping','Maps & world','Repair & vehicles'];
export function officialURL(value){const result=safeHttps(value);if(!result||result.length>500)throw new Error('Please use an official HTTPS address without embedded credentials.');const u=new URL(result);if(!u.hostname.includes('.')||u.port)throw new Error('Please use a public website address without a custom port.');return result;}
export function canonicalHost(value){return new URL(officialURL(value)).hostname.toLowerCase().replace(/^www\./u,'');}
const field=(data,key,max,min=0)=>text(data[key]??'',max,min);
export function validateLabPost(input,catalog=[],{isOwner=false}={}){
  const kind=input.postKind||'discussion';if(!KIND_LABELS[kind])throw new Error('Please choose a post format.');
  const data=input.postData??{};if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Please check the post details.');
  let result={};
  if(kind==='request')result={goal:field(data,'goal',800,12),device:field(data,'device',120,2),tried:field(data,'tried',800),budget:field(data,'budget',120),success:field(data,'success',500)};
  if(kind==='discovery'){
    const url=officialURL(data.url),host=canonicalHost(url),existing=catalog.find(s=>{try{return canonicalHost(s.url)===host}catch{return false}});
    if(existing)throw new Error('Please choose a new discovery. '+existing.name+' is already in the toolbox; share a tip or review there.');
    result={url,name:field(data,'name',80,2),useCase:field(data,'useCase',240,12),tried:field(data,'tried',800,12),access:field(data,'access',300),credit:data.credit===true};
  }
  if(kind==='review'){
    if(!catalog.some(s=>s.id===input.siteId))throw new Error('Please choose the tool you tried.');
    if(!OUTCOMES[data.outcome])throw new Error('Please choose an experience outcome.');
    const checked=field(data,'checked',10,10);if(!/^\d{4}-\d{2}-\d{2}$/u.test(checked)||!Number.isFinite(Date.parse(checked)))throw new Error('Please use a valid checked date.');
    result={task:field(data,'task',800,12),device:field(data,'device',120,2),outcome:data.outcome,checked,limits:field(data,'limits',500)};
  }
  if(kind==='project'){
    const tools=Array.isArray(data.tools)?[...new Set(data.tools)].slice(0,3):[];
    if(!tools.length||tools.some(id=>!catalog.some(s=>s.id===id)))throw new Error('Please choose one to three tools from the collection.');
    result={goal:field(data,'goal',800,12),tools,steps:field(data,'steps',1800,12),result:field(data,'result',1000,12),tip:field(data,'tip',500),link:data.link?officialURL(data.link):''};
  }
  if(kind==='poll'){
    const options=Array.isArray(data.options)?data.options.map(v=>text(v,100,1)):[];
    if(options.length<2||options.length>6||new Set(options.map(v=>v.toLowerCase())).size!==options.length)throw new Error('Please provide two to six different poll options.');
    result={options};
  }
  if(kind==='challenge'){if(!isOwner)throw new Error('Please leave owner challenges to Cowboy.');result={ownerPrompt:true};}
  return {post_kind:kind,post_data:result};
}
export function formatPostBody(kind,data,body=''){
  const lines=[];const add=(label,value)=>{if(value)lines.push(label+':\n'+value);};
  if(kind==='request'){add('My goal',data.goal);add('Device and browser',data.device);add('What I tried',data.tried);add('Budget / signup preference',data.budget);add('A successful result',data.success);}
  if(kind==='discovery'){add('Official website',data.url);add('The task it solves',data.useCase);add('What I actually tried',data.tried);add('Account or payment requirements',data.access);}
  if(kind==='review'){add('The task',data.task);add('Device and browser',data.device);add('My experience',OUTCOMES[data.outcome]);add('Checked',data.checked);add('Limits I encountered',data.limits);}
  if(kind==='project'){add('My goal',data.goal);add('Steps that mattered',data.steps);add('The result',data.result);add('One tip',data.tip);add('My work / source',data.link);}
  if(body.trim())lines.push(body.trim());return text(lines.join('\n\n'),6000,12);
}
export function additionToSite(row){return {id:row.id,name:row.name,url:row.url,category:row.category,description:row.description,origin:'community',sources:[],source_urls:[],monogram:row.name.slice(0,2).toUpperCase(),role:'community',accessLabel:row.access_label,evidence:'A community discovery reviewed and published by Cowboy.'+(row.credit_name?' Found by '+row.credit_name+'.':''),evidenceUrls:[],sourceThreadId:row.source_thread_id,destinationCheck:{status:'owner_reviewed_community_find',checkedDate:row.checked_at,notes:'Published after owner review. Member experiences and access details may change.'}};}
