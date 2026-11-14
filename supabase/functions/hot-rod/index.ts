import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {makeHotRodHandler} from './handler.mjs';

const url = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !serviceKey) throw new Error('Hot Rod backend configuration is missing');
const client = createClient(url, serviceKey, {auth:{autoRefreshToken:false,persistSession:false}});
Deno.serve(makeHotRodHandler({
  auth:(token:string) => client.auth.getUser(token),
  rpc:(name:string,args:Record<string,unknown>) => client.rpc(name,args),
  origins:['https://perhardt7686.github.io'],
}));
