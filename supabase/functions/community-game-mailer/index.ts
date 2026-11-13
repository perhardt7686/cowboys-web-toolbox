import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import nodemailer from 'npm:nodemailer@10.2.1';

const required=(name)=>{const value=Deno.env.get(name);if(!value)throw new Error('Missing server configuration: '+name);return value;};
const db=createClient(required('SUPABASE_URL'),required('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
const target=required('OWNER_EMAIL');
const page=required('COMMUNITY_URL');

function sameToken(left,right){
 const a=new TextEncoder().encode(String(left||'')),b=new TextEncoder().encode(String(right||''));
 if(a.length!==64||b.length!==64)return false;
 let diff=0;for(let i=0;i<64;i++)diff|=(a[i]^b[i]);
 return diff===0;
}
function clean(x,max=130){return String(x??'').replace(/[\r\n\t]+/g,' ').trim().slice(0,max);}
async function getOne(table,column,value,fields){
 const {data,error}=await db.from(table).select(fields).eq(column,value).maybeSingle();
 if(error)throw error;return data;
}
function transport(){
 if((Deno.env.get('SMTP_PORT')||'465')!=='465')throw new Error('Unexpected email transport port');
 const host=required('SMTP_HOST');const rawPassword=required('SMTP_PASSWORD');
 return nodemailer.createTransport({
  host,port:465,secure:true,requireTLS:true,
  auth:{user:required('SMTP_USER'),pass:host==='smtp.gmail.com'?rawPassword.replace(/\s+/g,''):rawPassword},
  tls:{rejectUnauthorized:true},logger:false,debug:false,connectionTimeout:12000,socketTimeout:12000
 });
}

const escapeHTML=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function emailTheme(kind){
 const month=new Date().getUTCMonth()+1;
 const seasonal={
  1:['❄️','WINTER DAYS','#2b6694','#d8eefa'],
  2:['💝','HEARTS & HOME','#923d68','#ffe1ee'],
  3:['🌷','SPRING IS COMING','#4b815f','#e3f5df'],
  4:['🌼','SPRINGTIME','#487d62','#e3f5df'],
  5:['🌻','BRIGHT DAYS','#98702c','#fff1cf'],
  6:['☀️','SUMMER PLANS','#237d91','#d8f8f7'],
  7:['🎆','SUMMER CELEBRATIONS','#365da0','#e2ebff'],
  8:['🌞','SUMMER DAYS','#98702c','#fff1cf'],
  9:['🍁','AUTUMN DAYS','#8b542d','#fff0db'],
  10:['🎃','SPOOKY SEASON','#a45329','#ffeadc'],
  11:['🦃','THANKSGIVING SEASON','#98532f','#fff0d8'],
  12:['🎄','CHRISTMAS SEASON','#175f4b','#f0f7df']
 }[month];
 if(kind.startsWith('calendar_'))return {icon:seasonal[0],tag:'THE FAMILY CALENDAR · '+seasonal[1],accent:seasonal[2],tint:seasonal[3],graphic:'✦  ✧  ✦'};
 if(kind==='plate')return {icon:'🚘',tag:'LICENSE PLATE CHALLENGE',accent:'#297f88',tint:'#e4f5f5',graphic:'━ ━ ━  •  ━ ━ ━'};
 if(kind==='word_guess')return {icon:'🟩',tag:'DAILY WORD QUEST',accent:'#367b58',tint:'#e2f5e8',graphic:'▣  ▣  ▣  ▣  ▣'};
 if(kind.startsWith('mahjong_'))return {icon:'🀄',tag:'MAHJONG ARCADE',accent:'#704aa0',tint:'#efe6ff',graphic:'◆  ◇  ◆  ◇  ◆'};
 if(kind.startsWith('race_'))return {icon:'🏁',tag:'STREET R0D RACING',accent:'#a34245',tint:'#ffe9e8',graphic:'▦ ▦ ▦ ▦ ▦'};
 return {icon:'💬',tag:'THE COMMONS MESSAGE BOARD',accent:'#6a478a',tint:'#eee5f8',graphic:'●  ◌  ●  ◌  ●'};
}
function styledHtml(mail,item){
 const t=emailTheme(item.event_type);
 const body=escapeHTML(mail.body).split(/\n\s*\n/g).map(p=>'<p style="margin:0 0 14px;line-height:1.65;color:#273044;font-size:16px;white-space:pre-line;">'+p.replace(/\n/g,'<br>')+'</p>').join('');
 const href=escapeHTML(item.event_type.startsWith('calendar_')?'https://calendar.google.com/calendar/u/0/r':page);
 const cta=item.event_type.startsWith('calendar_')?'Open Google Calendar':'Open the Commons';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
 +'<body style="margin:0;padding:0;background:#ebe8ed;font-family:Arial,Helvetica,sans-serif;color:#172238;">'
 +'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ebe8ed"><tr><td align="center" style="padding:22px 12px">'
 +'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #ded8e4;border-radius:18px;overflow:hidden">'
 +'<tr><td style="background:'+t.accent+';padding:25px 28px;color:#ffffff;text-align:left;">'
 +'<div style="font-size:34px;line-height:1.15;margin-bottom:12px;" aria-hidden="true">'+t.icon+'</div>'
 +'<div style="font-weight:800;font-size:12px;letter-spacing:2px;color:#ffffff;">'+escapeHTML(t.tag)+'</div>'
 +'<div style="font-size:29px;line-height:1.22;font-weight:800;margin:12px 0 8px;color:#ffffff;">'+escapeHTML(mail.subject)+'</div>'
 +'<div style="font-size:17px;letter-spacing:5px;color:#ffffff;opacity:.86" aria-hidden="true">'+t.graphic+'</div></td></tr>'
 +'<tr><td style="padding:26px 27px 14px;"><div style="height:6px;border-radius:7px;background:'+t.tint+';margin-bottom:20px"></div>'+body+'</td></tr>'
 +'<tr><td style="padding:0 27px 29px"><a href="'+href+'" style="display:inline-block;padding:14px 21px;border-radius:9px;background:'+t.accent+';color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;">'+cta+'</a>'
 +'<p style="margin:18px 0 0;color:#657080;font-size:12px;line-height:1.5">Private owner notification from Cowboy’s Toolbox. Calendar details stay in your owner inbox.</p></td></tr>'
 +'</table></td></tr></table></body></html>';
}

async function compose(item){
 const gameTypes=new Set(['plate','word_guess','mahjong_record','mahjong_best','mahjong_badge','mail_test','calendar_new','calendar_week','calendar_day']);
 if(gameTypes.has(item.event_type)){
  const d=await getOne('community_game_mail_details','event_key',item.event_key,'subject,body');
  if(!d)throw Error('Missing mail details for queued game event');
  return {subject:clean(d.subject,150),body:String(d.body).slice(0,3000)+'\n\nOpen the members-only Commons:\n'+page};
 }
 if(item.event_type!=='discussion'&&item.event_type!=='reply')throw Error('Unrecognized event type');
 const thread=await getOne('community_threads','id',item.thread_id,'title,status');
 const member=await getOne('community_members','user_id',item.actor_id,'display_name,role,status');
 if(!thread||thread.status!=='published'||!member||member.role==='owner'||member.status!=='approved')
   throw Error('Event no longer qualifies for member discussion notification');
 const who=clean(member.display_name,80)||'A member';
 const title=clean(thread.title,100)||'Conversation';
 const type=item.event_type==='reply'?'reply':'discussion';
 const detail=type==='reply'?who+' replied in “'+title+'”.':who+' started a discussion: “'+title+'”.';
 return {subject:'New '+type+': '+title,body:detail+'\n\nOpen the members-only Commons:\n'+page};
}
const response=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
Deno.serve(async request=>{
 try{
  if(request.method!=='POST')return response(405,{ok:false});
  const token=request.headers.get('x-community-mail-key');
  if(!token)return response(403,{ok:false});
  const key=await getOne('community_game_mail_secret','id',true,'token');
  if(!key||!sameToken(token,key.token))return response(403,{ok:false});
  const {data:items,error}=await db.rpc('community_claim_owner_mail',{p_limit:5});
  if(error)throw error;
  let delivered=0,failed=0;
  for(const item of items||[]){
   let sent=false;
   try{
    const mail=await compose(item);
    const info=await transport().sendMail({
     from:{name:'Cowboy’s Web Toolbox',address:required('SMTP_FROM')},
     to:target,subject:'[Cowboy’s Toolbox] '+mail.subject,text:mail.body,html:styledHtml(mail,item),
     disableFileAccess:true,disableUrlAccess:true
    });
    if(!Array.isArray(info.accepted)||!info.accepted.some(a=>String(a).toLowerCase()===target.toLowerCase()))
      throw Error('Owner mailbox not accepted');
    sent=true;delivered++;
   }catch(error){failed++;console.error('Owner mail delivery failure:',String(error?.message||error).slice(0,160));}
   const done=await db.rpc('community_finish_owner_mail',{p_event_key:item.event_key,p_sent:sent});
   if(done.error)console.error('Mail ledger could not be finalized');
  }
  return response(200,{ok:true,processed:(items||[]).length,delivered,failed});
 }catch(error){
  console.error('Game mailer error:',String(error?.message||error).slice(0,160));
  return response(500,{ok:false});
 }
});