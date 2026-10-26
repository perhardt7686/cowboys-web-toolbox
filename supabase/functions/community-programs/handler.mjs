const unwrap=result=>{if(result.error)throw new Error('Worker operation unavailable');return result.data;};
export function digestText(job,siteURL){
  const base=new URL(siteURL);const lines=['Cowboy’s Web Toolbox — your weekly roundup','',...job.threads.flatMap(t=>{const link=new URL(base);link.search='?thread='+encodeURIComponent(t.id);return [t.title,link.href,''];})];
  const unsubscribe=new URL(base);unsubscribe.search='';unsubscribe.hash='unsubscribe='+job.unsubscribeToken;
  return lines.concat(['You receive this because you chose the weekly digest in your board preferences.','Stop future digests: '+unsubscribe.href,'','This roundup contains public conversations. Reply on the board to join in.']).join('\n');
}
export function createProgramsHandler({db,auth,sendDigest,siteURL,allowedOrigins}){
  const origins=new Set(allowedOrigins);
  return async request=>{
    const origin=request.headers.get('Origin');const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(origin&&origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type, apikey','Access-Control-Allow-Methods':'POST, OPTIONS'});
    const respond=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    try{
      if(origin&&!origins.has(origin))return respond(403,{error:'Origin unavailable'});
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
      if(request.method!=='POST')return respond(405,{error:'Use POST'});
      if(!request.headers.get('Content-Type')?.startsWith('application/json'))return respond(415,{error:'Use JSON'});
      if(Number(request.headers.get('Content-Length'))>2048)return respond(413,{error:'Request too large'});
      const reader=request.body?.getReader();if(!reader)return respond(400,{error:'Invalid request'});let size=0,chunks=[];
      try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return respond(413,{error:'Request too large'});}chunks.push(value);}}finally{reader.releaseLock();}
      const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return respond(400,{error:'Invalid JSON'});}
      if(!body||!['run','unsubscribe'].includes(body.action)||! /^[a-f0-9]{64}$/u.test(body.token||''))return respond(400,{error:'Invalid request'});
      if(body.action==='unsubscribe'){const result=unwrap(await db.rpc('community_digest_unsubscribe',{p_token:body.token}));return respond(200,result);}
      const started=await db.rpc('community_programs_begin',{p_token:body.token});if(started.error)return respond(401,{error:'Worker token expired or used'});
      const result=started.data;if(!result.ok)return respond(409,{error:'Owner unavailable'});
      let accepted=0,failed=0,skipped=0;
      for(let i=0;i<5;i++){
        const job=unwrap(await db.rpc('community_digest_next',{p_week:result.week}));if(!job)break;
        let outcome='failed';
        try{
          const {data,error}=await auth.getUserById(job.userId);
          if(error||!data?.user?.email_confirmed_at||!data.user.email){outcome='skipped';skipped++;}
          else {
            // Recheck consent immediately before submission to the mail sender.
            const prefs=unwrap(await db.from('community_preferences').select('digest_enabled').eq('user_id',job.userId).maybeSingle());
            const member=unwrap(await db.from('community_members').select('status').eq('user_id',job.userId).maybeSingle());
            if(!prefs?.digest_enabled||member?.status!=='approved'){outcome='skipped';skipped++;}
            else{await sendDigest({to:data.user.email,subject:'Your Cowboy’s Web Toolbox weekly roundup',text:digestText(job,siteURL)});outcome='sent';accepted++;}
          }
        }catch{failed++;}
        unwrap(await db.rpc('community_digest_finish',{p_user:job.userId,p_week:job.week,p_status:outcome}));
      }
      // One run handles at most five recipients. A bounded dispatcher continues
      // remaining jobs without opening a browser or exposing member addresses.
      const pending=unwrap(await db.from('community_digest_jobs').select('status,attempts').eq('week_start',result.week).limit(20));
      if(pending.some(j=>j.status==='pending'||j.status==='failed'&&j.attempts<2))unwrap(await db.rpc('community_dispatch_weekly',{}));
      return respond(200,{ok:true,challengeCreated:result.challengeCreated,accepted,failed,skipped});
    }catch{return respond(503,{error:'Weekly programs could not complete. The owner can inspect the private status counts.'});}
  };
}
