import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {createActivityHandler} from './handler.mjs';
import catalog from './catalog.json' with {type:'json'};
const required=(key:string)=>{const value=Deno.env.get(key);if(!value)throw new Error('Missing runtime configuration');return value};
const db=createClient(required('SUPABASE_URL'),required('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createActivityHandler({db,catalog:catalog.sites,allowedOrigins:required('ALLOWED_ORIGINS').split(',').map(v=>v.trim()).filter(Boolean)}));
