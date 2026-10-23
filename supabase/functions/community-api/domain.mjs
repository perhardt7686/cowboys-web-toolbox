/* Shared validation and catalog-only Edward replies. No credentials or private context. */
export const CATEGORIES = [
  { id:'discoveries', name:'New discoveries', icon:'↗', color:'#dce6bf', description:'Found something good? Pass it on.' },
  { id:'help', name:'How do I…?', icon:'?', color:'#e8e4ce', description:'Ask a question. Find a way forward.' },
  { id:'repair', name:'Repair & hands-on', icon:'⌁', color:'#f0dfc9', description:'Tools, vehicles, fixes and practical know-how.' },
  { id:'creative', name:'Creative corner', icon:'✳', color:'#e9dfe8', description:'Things to make, try and imagine.' },
  { id:'feedback', name:'Feedback & fixes', icon:'◇', color:'#dce8e3', description:'Help this little corner of the internet improve.' }
];
export const RULES_VERSION='2026-10-23';
export function text(value,max=6000,min=1){
  if(typeof value!=='string')throw new Error('Please enter text.');
  const clean=value.normalize('NFC').replace(/\r\n?/g,'\n').trim();
  if(clean.length<min||clean.length>max)throw new Error(`Please use ${min}–${max} characters.`);
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(clean))throw new Error('Please remove control characters.');
  return clean;
}
export function displayName(value){
  const name=text(value,36,2);
  if(/[<>\r\n]/u.test(name)||/^(?:(?:edward|cowboy)(?:[._\s-]*(?:the[._\s-]*)?(?:admin|moderator|owner))?|admin|administrator|moderator|support|system)$/iu.test(name))throw new Error('Choose a personal display name without a staff title.');
  return name;
}
export function validatePost(input,catalog=[]){
  const title=text(input.title,140,8),body=text(input.body,6000,12);
  if(!CATEGORIES.some(c=>c.id===input.category))throw new Error('Choose a discussion category.');
  const siteId=input.siteId||null;
  if(siteId&&!catalog.some(s=>s.id===siteId))throw new Error('Choose a website from the collection.');
  return {title,body,category:input.category,site_id:siteId};
}
export function reviewContent(body){
  const reasons=[];
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/iu.test(body)||/\b(?:sk-proj-|sb_secret_)[A-Za-z0-9_-]{12,}/u.test(body))reasons.push('Possible private credential');
  if((body.match(/https?:\/\//giu)||[]).length>4)reasons.push('Many external links');
  return {status:reasons.length?'held':'published',reasons};
}
export function safeHttps(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function renderBody(value){
  return String(value??'').split(/(https:\/\/[^\s<>]+)/gu).map((part,i)=>{
    if(i%2===0)return escapeHTML(part).replace(/\n/g,'<br>');
    const url=safeHttps(part);return url?`<a href="${escapeHTML(url)}" target="_blank" rel="nofollow ugc noopener noreferrer">${escapeHTML(part)}</a>`:escapeHTML(part);
  }).join('');
}
export function initials(name){return String(name||'?').trim().split(/\s+/u).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();}
export function edwardReply(post,catalog){
  const prompt=`${post.title||''} ${post.body||''}`;
  if(!/(?:@?edward\b|\b(?:help|find|recommend|looking for|which website)\b)/iu.test(prompt))return null;
  const normalized=prompt.toLowerCase();
  const wantsIdentity=/\b(?:who are you|are you (?:an? )?(?:ai|human|bot)|real person)\b/iu.test(prompt);
  if(wantsIdentity)return 'I’m Edward, this community’s automated moderator. I can point you to the recorded tools and sources in Cowboy’s Web Toolbox. Cowboy handles member approvals, reports and moderation decisions.';
  const stop=new Set(['edward','please','could','would','which','website','websites','looking','about','there','their','have','with','that','this','find','help','recommend','need','want','some']);
  const words=[...new Set(normalized.match(/[\p{L}\p{N}]{3,}/gu)||[])].filter(w=>!stop.has(w));
  const ranked=catalog.map(site=>{
    const hay=`${site.name} ${site.description} ${site.category}`.toLowerCase();
    const exact=normalized.includes(site.name.toLowerCase())?15:0;
    const score=exact+words.reduce((n,w)=>n+(hay.includes(w)?1:0),0)+(post.site_id===site.id?20:0);
    return {site,score};
  }).filter(x=>x.score>=2).sort((a,b)=>b.score-a.score).slice(0,3);
  if(!ranked.length)return 'I’m Edward, the automated moderator. I can help with websites recorded in this collection. Add a tool’s name or a concrete task—such as finding auto parts, editing a PDF or drawing a floor plan—and I’ll look for a relevant recorded entry. Cowboy reviews reports and account approvals.';
  return 'Edward here—your automated moderator. These recorded entries may help:\n\n'+ranked.map(({site})=>`${site.name} — ${site.description}\n${safeHttps(site.url)||'See the collection for the website link.'}${site.source_urls?.[0]&&safeHttps(site.source_urls[0])?'\nOriginal source video: '+safeHttps(site.source_urls[0]):''}${site.destinationCheck?.status==='availability_unverified'?'\nCurrent availability is unverified.':''}`).join('\n\n')+'\n\nThese suggestions use the catalog descriptions; I haven’t independently tested the services. Source videos may require Facebook access.';
}
export function canPost(member){return !!member&&member.status==='approved'&&['member','owner'].includes(member.role);}
