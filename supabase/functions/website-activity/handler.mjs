export function createActivityHandler({db,catalog,allowedOrigins}){
  const sites=new Set(catalog.map(s=>s.id)),origins=new Set(allowedOrigins);
  return async request=>{
    const origin=request.headers.get('Origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'apikey, content-type'});
    const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers});
    if(!origins.has(origin))return reply(403,{error:'This origin is not allowed.'});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return reply(405,{error:'Use POST.'});
    if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return reply(415,{error:'Send JSON.'});
    if(Number(request.headers.get('Content-Length')||0)>4096)return reply(413,{error:'Request too large.'});
    try{
      const reader=request.body?.getReader();if(!reader)return reply(400,{error:'Invalid event.'});
      const chunks=[];let length=0;
      try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>4096){await reader.cancel();return reply(413,{error:'Request too large.'});}chunks.push(value);}}finally{reader.releaseLock();}
      const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
      const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      if(!payload||typeof payload!=='object'||!sites.has(payload.siteId)||typeof payload.eventId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(payload.eventId))return reply(400,{error:'Invalid catalog event.'});
      const {data,error}=await db.rpc('community_record_click',{p_site_id:payload.siteId,p_event_id:payload.eventId});
      if(error)return reply(503,{error:'Activity could not be recorded.'});
      return reply(200,{siteId:payload.siteId,clicks:Number(data.clicks)||0,recorded:data.recorded===true});
    }catch{return reply(400,{error:'Invalid event.'});}
  };
}
