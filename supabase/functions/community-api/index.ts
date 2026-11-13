import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import nodemailer from 'npm:nodemailer@10.2.1';
import {createCommunityHandler} from './handler.mjs';
import catalog from './catalog.json' with {type:'json'};

const required=(key:string)=>{const value=Deno.env.get(key);if(!value)throw new Error(`Missing runtime configuration: ${key}`);return value};
const url=required('SUPABASE_URL'),serviceKey=required('SUPABASE_SERVICE_ROLE_KEY');
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const ownerEmail=required('OWNER_EMAIL');
// Mail configuration is read only when sending. An unavailable mail sender
// must not prevent JWT validation or discard a request from the private queue.
const ownerTransport=()=>{
  // Supabase Edge Functions block outgoing ports 25 and 587. Use TLS on 465.
  if((Deno.env.get('SMTP_PORT')||'465')!=='465')throw new Error('Owner mail requires SMTP port 465.');
  const host=required('SMTP_HOST'),password=required('SMTP_PASSWORD');
  return nodemailer.createTransport({
    host,port:465,secure:true,requireTLS:true,
    auth:{user:required('SMTP_USER'),pass:host==='smtp.gmail.com'?password.replace(/\s+/gu,''):password},
    logger:false,debug:false,connectionTimeout:10000,socketTimeout:10000,
    tls:{rejectUnauthorized:true}
  });
};

const mailSafe=(value:string)=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const ownerHtml=(subject:string,body:string)=>{
  const category=/approval|member is ready/i.test(subject)?'MEMBER ACCESS':/report|held|review|deletion/i.test(subject)?'MODERATION DESK':'THE COMMONS MESSAGE BOARD';
  const title=mailSafe(subject);
  const copy=mailSafe(body).replace(/(https:\/\/[^\s<>]+)/g,'<a href="$1" style="color:#623c8a;text-decoration:underline;overflow-wrap:anywhere;">Open relevant page</a>')
    .replace(/\n/g,'<br>');
  return '<!doctype html><html lang="en"><meta charset="utf-8"><body style="margin:0;padding:18px;background:#efebf3;font-family:Arial,Helvetica,sans-serif;">'
  +'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e1d7eb;border-radius:14px;overflow:hidden;">'
  +'<tr><td style="background:#402655;color:#ffffff;padding:25px 28px;border-bottom:5px solid #ddb775;"><div style="font-size:29px;" aria-hidden="true">💬</div><p style="font-size:12px;font-weight:bold;letter-spacing:2px;margin:11px 0;color:#f8e1aa;">'+category+'</p><h1 style="font-size:26px;line-height:1.2;margin:0;color:#ffffff;">'+title+'</h1></td></tr>'
  +'<tr><td style="padding:25px 28px;font-size:16px;line-height:1.65;color:#282338;overflow-wrap:anywhere">'+copy+'</td></tr>'
  +'<tr><td style="padding:15px 28px;background:#f2edf6;color:#62566b;font-size:12px;">Cowboy’s Toolbox · Private owner notification · Never forward private review links.</td></tr>'
  +'</table></td></tr></table></body></html>';
};

const handler=createCommunityHandler({
  db,auth:db.auth,catalog:catalog.sites,ownerEmail,
  siteURL:required('COMMUNITY_URL'),
  allowedOrigins:required('ALLOWED_ORIGINS').split(',').map(v=>v.trim()).filter(Boolean),
  senderConfigured:['SMTP_HOST','SMTP_USER','SMTP_FROM','SMTP_PASSWORD'].every(key=>!!Deno.env.get(key)),
  sendMail:async({to,subject,text}:{to:string,subject:string,text:string})=>{
    // This transport sends operational notices only to the configured owner.
    if(to.toLowerCase()!==ownerEmail.toLowerCase())throw new Error('Owner mailbox only');
    await ownerTransport().sendMail({from:{name:'Cowboy’s Web Toolbox',address:required('SMTP_FROM')},to,subject,text,html:ownerHtml(subject,text),disableFileAccess:true,disableUrlAccess:true});
  }
});
Deno.serve(handler);
