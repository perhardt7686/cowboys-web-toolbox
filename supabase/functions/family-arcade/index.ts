import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {replaySky} from '../../../docs/skyboard-physics.mjs';
import {replayDash} from '../../../docs/dash-physics.mjs';

const project=Deno.env.get('SUPABASE_URL')!;
const anonymous=Deno.env.get('SUPABASE_ANON_KEY')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const auth=createClient(project,anonymous,{auth:{persistSession:false,autoRefreshToken:false}});
const verifier=createClient(project,service,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Cache-Control':'no-store'
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function answer(body:unknown,status=200){
  return Response.json(body,{status,headers:cors});
}
async function boundedBody(request:Request){
  const reader=request.body?.getReader();
  if(!reader)throw Error('A control replay is required.');
  const decoder=new TextDecoder('utf-8',{fatal:true});
  let total=0,body='';
  for(;;){
    const {value,done}=await reader.read();
    if(done)break;
    total+=value.byteLength;
    if(total>48_000){await reader.cancel();throw Error('This replay is too large.');}
    body+=decoder.decode(value,{stream:true});
  }
  return JSON.parse(body+decoder.decode());
}

Deno.serve(async (request)=>{
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return answer({message:'Send a game replay using POST.'},405);
  const match=/^Bearer (\S+)$/.exec(request.headers.get('Authorization')||'');
  if(!match)return answer({message:'Sign in to the Family Message Board.'},401);
  try{
    const {data:{user},error:authError}=await auth.auth.getUser(match[1]);
    if(authError||!user)return answer({message:'Sign back in to verify a race.'},401);
    const {game,id,trace}=await boundedBody(request);
    if((game!=='skyboard'&&game!=='dash')||typeof id!=='string'||!uuid.test(id)||!Array.isArray(trace))
      return answer({message:'Invalid game or replay.'},400);
    const {data:input,error}=await verifier.rpc('community_arcade_replay_input',{p_owner:user.id,p_game:game,p_id:id});
    if(error)return answer({message:error.message},error.code==='42501'?403:422);
    if(game==='skyboard'){
      const result=replaySky(input.stage,input.seed,input.board,trace,{sample:input.sample,edition:input.edition??1});
      const {data,error:commit}=await verifier.rpc('community_boardride_commit_v2',{p_owner:user.id,p_id:id,p_result:result});
      if(commit)return answer({message:commit.message},422);
      return answer(data);
    }
    const rules=input.rules;
    const result=replayDash(input.pattern,rules.pace,{boss:rules.boss,bossStyle:rules.boss_style,layout:rules.layout,stage:rules.stage,edition:rules.edition??1},trace);
    const {data,error:commit}=await verifier.rpc('community_dash_commit_v2',{p_owner:user.id,p_id:id,p_trace:trace,p_result:result});
    if(commit)return answer({message:commit.message},422);
    return answer(data);
  }catch(error){
    if(error instanceof SyntaxError||error instanceof TypeError)return answer({message:'The control replay could not be read.'},400);
    return answer({message:error instanceof Error?error.message:'The replay could not be verified.'},422);
  }
});
