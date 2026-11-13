import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import nodemailer from 'npm:nodemailer@10.2.1';
import {createProgramsHandler} from './handler.mjs';
const required=(name:string)=>{const value=Deno.env.get(name);if(!value)throw new Error('Missing runtime configuration');return value;};
const db=createClient(required('SUPABASE_URL'),required('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});

const htmlEscape=(v:string)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const digestHtml=(subject:string,body:string)=>{
 const lines=htmlEscape(body).replace(/(https:\/\/[^\s<>]+)/g,'<a href="$1" style="color:#6b3e91;text-decoration:underline;overflow-wrap:anywhere">Open on the Commons</a>').replace(/\n/g,'<br>');
 return '<!doctype html><html lang="en"><meta charset="utf-8"><body style="margin:0;background:#eeeaf3;padding:18px;font-family:Arial,Helvetica,sans-serif;">'
 +'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #dcd4e5;border-radius:16px;overflow:hidden;" cellpadding="0" cellspacing="0">'
 +'<tr><td style="background:#422858;color:#ffffff;padding:25px 30px;border-bottom:5px solid #dab56e"><div style="font-size:32px">💬</div><p style="font-size:12px;color:#f5dfb4;letter-spacing:2px;font-weight:800;">THE COMMONS · WEEKLY ROUNDUP</p>'
 +'<h1 style="font-size:25px;line-height:1.25;color:#fff;margin:5px 0;">'+htmlEscape(subject)+'</h1></td></tr>'
 +'<tr><td style="font-size:15px;line-height:1.7;padding:28px 30px;color:#2e2634;overflow-wrap:anywhere">'+lines+'</td></tr>'
 +'<tr><td style="background:#f5f0f8;padding:15px 30px;color:#756882;font-size:12px;">Only for opted-in Commons members. Use the unsubscribe link above to stop future digests.</td></tr>'
 +'</table></td></tr></table></body></html>';
};

Deno.serve(createProgramsHandler({db,auth:db.auth.admin,siteURL:required('COMMUNITY_URL'),allowedOrigins:required('ALLOWED_ORIGINS').split(',').map(s=>s.trim()).filter(Boolean),sendDigest:async({to,subject,text}:{to:string,subject:string,text:string})=>{
  if((Deno.env.get('SMTP_PORT')||'465')!=='465')throw new Error('TLS mail port required');
  const host=required('SMTP_HOST'),password=required('SMTP_PASSWORD');
  const transport=nodemailer.createTransport({host,port:465,secure:true,requireTLS:true,auth:{user:required('SMTP_USER'),pass:host==='smtp.gmail.com'?password.replace(/\s+/gu,''):password},logger:false,debug:false,connectionTimeout:5000,socketTimeout:5000,tls:{rejectUnauthorized:true}});
  await transport.sendMail({from:{name:'Cowboy’s Web Toolbox',address:required('SMTP_FROM')},to,subject,text,html:digestHtml(subject,text),disableFileAccess:true,disableUrlAccess:true});
}}));
