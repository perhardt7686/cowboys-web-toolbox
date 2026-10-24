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
const handler=createCommunityHandler({
  db,auth:db.auth,catalog:catalog.sites,ownerEmail,
  siteURL:required('COMMUNITY_URL'),
  allowedOrigins:required('ALLOWED_ORIGINS').split(',').map(v=>v.trim()).filter(Boolean),
  sendMail:async({to,subject,text}:{to:string,subject:string,text:string})=>{
    // This transport sends operational notices only to the configured owner.
    if(to.toLowerCase()!==ownerEmail.toLowerCase())throw new Error('Owner mailbox only');
    await ownerTransport().sendMail({from:{name:'Cowboy’s Web Toolbox',address:required('SMTP_FROM')},to,subject,text,disableFileAccess:true,disableUrlAccess:true});
  }
});
Deno.serve(handler);
