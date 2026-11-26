export const TERMINAL = new Set(["finished","partial","timed_out","failed","cancelled","interrupted"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const events = new Set(["ACCOUNT_EXTERNAL_OWNED","ACCOUNT_EXTERNAL_USER_SHARED","ACCOUNT_EXTERNAL_USER_SHARED_COMPROMISED"]);

class APIError extends Error {
  constructor(status, code) { super(code); this.status=status; this.code=code; }
}
function id(value) {
  if(typeof value!=="string"||!uuid.test(value)) throw new APIError(400,"invalid_id");
  return value.toLowerCase();
}
export function safeFindings(value) {
  if(!Array.isArray(value)||value.length>100) throw new APIError(502,"invalid_engine_result");
  return value.filter(f=>events.has(f?.event_type)).map(f=>{
    let url;
    try { url=new URL(f.source_url); } catch {throw new APIError(502,"invalid_engine_result");}
    if(url.protocol!=="https:"||url.username||url.password||(url.port&&url.port!=="443")||url.href.length>2048)
      throw new APIError(502,"invalid_engine_result");
    const date=new Date(f.observed_at);
    if(!Number.isFinite(date.getTime())) throw new APIError(502,"invalid_engine_result");
    return {event_type:f.event_type,source_url:url.href,
      source_name:String(f.source_name||url.hostname).slice(0,160),observed_at:date.toISOString(),association:"unverified"};
  });
}

export function createHandler({supabaseUrl,anonKey,serviceKey,allowedOrigins,fetchImpl=fetch}) {
  const origins=new Set(allowedOrigins);
  async function database(path,token,method="GET",body) {
    const response=await fetchImpl(supabaseUrl+path,{method,
      headers:{apikey:token===serviceKey?serviceKey:anonKey,Authorization:"Bearer "+token,
        "Content-Type":"application/json",Prefer:"return=representation"},
      body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000),redirect:"error"});
    const text=await response.text();
    let data;
    try{data=text?JSON.parse(text):null;}catch{throw new APIError(503,"core_database_unavailable");}
    if(!response.ok) {
      const code=String(data?.message||"core_database_unavailable");
      if(response.status===401) throw new APIError(401,"sign_in_required");
      if(response.status===403) throw new APIError(403,"core_access_required");
      if(["scan_already_active","request_expired","request_case_mismatch"].includes(code)) throw new APIError(409,code);
      if(/limit/.test(code)) throw new APIError(429,"scan_limit_reached");
      if(/not_found|not_available/.test(code)) throw new APIError(404,"record_not_found");
      throw new APIError(503,"core_database_unavailable");
    }
    return data;
  }
  async function engine(url,token,method,path,body) {
    if(!/^https:\/\/[a-z0-9][a-z0-9-]*\.onrender\.com$/.test(url)) throw new APIError(503,"engine_not_configured");
    try {
      const response=await fetchImpl(url+path,{method,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
        body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000),redirect:"error"});
      const raw=await response.text();
      if(raw.length>262144) throw new APIError(502,"invalid_engine_result");
      let data;
      try {data=JSON.parse(raw);}catch{throw new APIError(503,"engine_waking_up");}
      if(!response.ok) {
        if(response.status===404) throw new APIError(404,"engine_job_lost");
        if(response.status===409) throw new APIError(409,"worker_busy");
        if(response.status===401||response.status===403) throw new APIError(response.status,"core_access_required");
        throw new APIError(503,"engine_waking_up");
      }
      return data;
    }catch(error){
      if(error instanceof APIError) throw error;
      throw new APIError(503,"engine_waking_up");
    }
  }
  async function persist(run,result) {
    if(result?.id!==run.id||!TERMINAL.has(result?.status)) throw new APIError(502,"invalid_engine_result");
    if(result.status==="finished"&&result.engine_status!=="FINISHED") throw new APIError(502,"invalid_engine_result");
    return await database("/rest/v1/rpc/cowboys_core_people_finish_run",serviceKey,"POST",{
      p_run_id:run.id,p_status:result.status,p_engine_status:String(result.engine_status||"").slice(0,100),
      p_revision:String(result.engine_revision||"").slice(0,64),p_findings:safeFindings(result.findings||[])});
  }
  return async function handler(request) {
    const origin=request.headers.get("Origin");
    const headers={"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
    if(origin&&origins.has(origin)) Object.assign(headers,{"Access-Control-Allow-Origin":origin,Vary:"Origin",
      "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"GET, POST, OPTIONS"});
    const reply=(status,data)=>new Response(status===204?null:JSON.stringify(data),{status,headers});
    try {
      if(origin&&!origins.has(origin)) throw new APIError(403,"origin_not_allowed");
      if(request.method==="OPTIONS") return reply(origin?204:403,origin?null:{error:"origin_required"});
      if(!["GET","POST"].includes(request.method)) throw new APIError(405,"method_not_allowed");
      const authorization=request.headers.get("Authorization")||"";
      if(!authorization.startsWith("Bearer ")||authorization.length>8200) throw new APIError(401,"sign_in_required");
      const token=authorization.slice(7);
      const user=await database("/auth/v1/user",token);
      if(!user?.id) throw new APIError(401,"sign_in_required");
      const owner=await database("/rest/v1/rpc/cowboys_core_data_owner",token,"POST",{});
      if(!owner) throw new APIError(403,"core_access_required");
      id(owner);
      let body={action:"status"};
      if(request.method==="POST") {
        const raw=await request.text();
        if(raw.length>8192) throw new APIError(413,"body_too_large");
        try {body=JSON.parse(raw);}catch{throw new APIError(400,"invalid_body");}
        if(!body||typeof body!=="object") throw new APIError(400,"invalid_body");
      }
      const configs=await database("/rest/v1/cowboys_core_people_config?singleton=eq.true&select=engine_url,enabled",serviceKey);
      const config=configs?.[0];
      if(body.action==="status") return reply(200,{enabled:!!(config?.enabled&&config?.engine_url),
        state:config?.enabled&&config?.engine_url?"ready":"setup_required",
        scope:{sites:12,seconds:90,scans_per_hour:3,scans_per_day:12},engine:"SpiderFoot",associations:"unverified"});
      if(!config?.enabled||!config?.engine_url) throw new APIError(503,"engine_not_configured");
      let run;
      if(body.action==="start") {
        run=await database("/rest/v1/rpc/cowboys_core_people_begin_run",token,"POST",{
          p_case_id:id(body.case_id),p_request_id:id(body.request_id)});
      } else if(["poll","cancel"].includes(body.action)) {
        const rows=await database("/rest/v1/cowboys_core_people_runs?id=eq."+id(body.run_id)+"&select=*",token);
        run=rows?.[0];
        if(!run) throw new APIError(404,"record_not_found");
      } else throw new APIError(400,"invalid_action");
      if(run.owner_id!==owner) throw new APIError(403,"core_access_required");
      if(TERMINAL.has(run.status)) return reply(200,{run});
      if(body.action==="cancel") {
        const finished=await database("/rest/v1/rpc/cowboys_core_people_finish_run",serviceKey,"POST",
          {p_run_id:run.id,p_status:"cancelled",p_engine_status:"USER-CANCELLED",p_revision:"",p_findings:[]});
        try {await engine(config.engine_url,token,"DELETE","/v1/scans/"+run.id);}catch{/* saved cancellation remains authoritative */}
        return reply(200,{run:finished});
      }
      try {
        let result;
        if(run.status==="queued") result=await engine(config.engine_url,token,"POST","/v1/scans",{run_id:run.id});
        else result=await engine(config.engine_url,token,"GET","/v1/scans/"+run.id);
        if(result?.id!==run.id) throw new APIError(502,"invalid_engine_result");
        if(TERMINAL.has(result.status)) return reply(200,{run:await persist(run,result)});
        if(result.status!=="running") throw new APIError(502,"invalid_engine_result");
        const updated=await database("/rest/v1/cowboys_core_people_runs?id=eq."+run.id+"&status=eq.queued",serviceKey,"PATCH",
          {status:"running",started_at:new Date().toISOString()});
        return reply(202,{run:updated?.[0]||run});
      } catch(error) {
        if(error instanceof APIError&&error.code==="engine_job_lost") {
          const finished=await database("/rest/v1/rpc/cowboys_core_people_finish_run",serviceKey,"POST",
            {p_run_id:run.id,p_status:"interrupted",p_engine_status:"WORKER-RESTARTED",p_revision:"",p_findings:[]});
          return reply(200,{run:finished});
        }
        if(error instanceof APIError&&["engine_waking_up","worker_busy"].includes(error.code))
          return reply(202,{run,notice:error.code});
        throw error;
      }
    } catch(error) {
      return reply(error instanceof APIError?error.status:503,
        {error:error instanceof APIError?error.code:"core_research_unavailable"});
    }
  };
}
