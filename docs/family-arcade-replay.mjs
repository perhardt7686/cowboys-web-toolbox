export async function submitArcadeReplay(client,config,game,id,trace){
  const {data}=await client.auth.getSession();
  const token=data?.session?.access_token;
  if(!token)throw Error('Sign back in to save an official result.');
  const response=await fetch(new URL('/functions/v1/family-arcade',config.supabaseUrl),{
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,apikey:config.publishableKey},
    body:JSON.stringify({game,id,trace})
  });
  const result=await response.json();
  if(!response.ok)throw Error(result.message||'The server could not verify this run.');
  return result;
}
