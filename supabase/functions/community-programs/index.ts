import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import nodemailer from 'npm:nodemailer@10.2.1';
import {createProgramsHandler} from './handler.mjs';
const required=(name:string)=>{const value=Deno.env.get(name);if(!value)throw new Error('Missing runtime configuration');return value;};
const db=createClient(required('SUPABASE_URL'),required('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createProgramsHandler({db,auth:db.auth.admin,siteURL:required('COMMUNITY_URL'),allowedOrigins:required('ALLOWED_ORIGINS').split(',').map(s=>s.trim()).filter(Boolean),sendDigest:async({to,subject,text}:{to:string,subject:string,text:string})=>{
  if((Deno.env.get('SMTP_PORT')||'465')!=='465')throw new Error('TLS mail port required');
  const host=required('SMTP_HOST'),password=required('SMTP_PASSWORD');
  const transport=nodemailer.createTransport({host,port:465,secure:true,requireTLS:true,auth:{user:required('SMTP_USER'),pass:host==='smtp.gmail.com'?password.replace(/\s+/gu,''):password},logger:false,debug:false,connectionTimeout:5000,socketTimeout:5000,tls:{rejectUnauthorized:true}});
  await transport.sendMail({from:{name:'Cowboy’s Web Toolbox',address:required('SMTP_FROM')},to,subject,text,disableFileAccess:true,disableUrlAccess:true});
}}));
