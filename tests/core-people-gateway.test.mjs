import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,safeFindings} from '../supabase/functions/core-people-research/handler.mjs';

const owner='11111111-1111-4111-8111-111111111111';
const caseId='22222222-2222-4222-8222-222222222222';
const runId='33333333-3333-4333-8333-333333333333';
const requestId='44444444-4444-4444-8444-444444444444';
const origin='https://core.example';
function fixture({allowed=true,enabled=true,worker='running',lost=false}={}){
  const calls=[];
  let run={id:runId,owner_id:owner,case_id:caseId,status:'queued'};
  const handler=createHandler({
    supabaseUrl:'https://fixture.supabase.co',anonKey:'public-fixture',serviceKey:'secret-fixture',allowedOrigins:[origin],
    fetchImpl:async(url,init={})=>{
      calls.push({url,init});
      const body=init.body?JSON.parse(init.body):undefined;
      if(url.endsWith('/auth/v1/user'))return Response.json({id:owner});
      if(url.endsWith('/rpc/cowboys_core_data_owner'))return Response.json(allowed?owner:null);
      if(url.includes('cowboys_core_people_config'))return Response.json([{enabled,engine_url:'https://fixture.onrender.com'}]);
      if(url.endsWith('/rpc/cowboys_core_people_begin_run'))return Response.json(run);
      if(url.includes('cowboys_core_people_runs?')){
        if(init.method==='PATCH'){run={...run,...body};return Response.json([run]);}
        return Response.json([run]);
      }
      if(url.endsWith('/rpc/cowboys_core_people_finish_run')){
        run={...run,status:body.p_status};return Response.json(run);
      }
      if(url.startsWith('https://fixture.onrender.com')){
        if(lost&&init.method==='GET')return Response.json({error:'run_not_found'},{status:404});
        return Response.json({id:runId,status:worker,engine_status:worker==='finished'?'FINISHED':'ERROR-FAILED',
          findings:[{event_type:'ACCOUNT_EXTERNAL_OWNED',source_url:'https://gitlab.com/corefixture',
          source_name:'GitLab',observed_at:'2026-01-01T00:00:00Z',association:'unverified'}]},{status:202});
      }
      throw new Error('unexpected fixture URL '+url);
    }
  });
  return {handler,calls};
}
function request(body,token='fixture-token',requestOrigin=origin){
  return new Request('https://fixture.supabase.co/functions/v1/core-people-research',{
    method:'POST',headers:{Authorization:'Bearer '+token,Origin:requestOrigin,'Content-Type':'application/json'},
    body:JSON.stringify(body)});
}
test('unrelated valid account cannot read status or start worker',async()=>{
  const {handler,calls}=fixture({allowed:false});
  assert.equal((await handler(request({action:'status'}))).status,403);
  assert.ok(!calls.some(c=>c.url.includes('onrender.com')));
});
test('origin mismatch rejected before any auth or backend access',async()=>{
  const {handler,calls}=fixture();
  assert.equal((await handler(request({action:'status'},'fixture-token','https://evil.example'))).status,403);
  assert.equal(calls.length,0);
});
test('setup state is honest and does not enqueue scans',async()=>{
  const {handler,calls}=fixture({enabled:false});
  const response=await handler(request({action:'status'}));
  assert.equal((await response.json()).state,'setup_required');
  assert.equal((await handler(request({action:'start',case_id:caseId,request_id:requestId}))).status,503);
  assert.ok(!calls.some(c=>c.url.includes('begin_run')));
});
test('start uses a registered run id, never a caller supplied target or module',async()=>{
  const {handler,calls}=fixture();
  const response=await handler(request({action:'start',case_id:caseId,request_id:requestId,query:'ignored',module:'sfp_portscan'}));
  assert.equal(response.status,202);
  const worker=calls.find(c=>c.url==='https://fixture.onrender.com/v1/scans');
  assert.deepEqual(JSON.parse(worker.init.body),{run_id:runId});
  assert.equal(worker.init.headers.Authorization,'Bearer fixture-token');
  assert.ok(!(await response.text()).includes('secret-fixture'));
});
test('completed results are persisted with a server-only credential',async()=>{
  const {handler,calls}=fixture({worker:'finished'});
  const response=await handler(request({action:'start',case_id:caseId,request_id:requestId}));
  assert.equal(response.status,200);
  const write=calls.find(c=>c.url.endsWith('/rpc/cowboys_core_people_finish_run'));
  assert.equal(write.init.headers.Authorization,'Bearer secret-fixture');
  assert.equal(JSON.parse(write.init.body).p_findings[0].association,'unverified');
});
test('invalid source URLs are rejected and are never persisted',async()=>{
  const {handler}=fixture();
  assert.equal((await handler(request({action:'start',case_id:'not-an-id',request_id:requestId}))).status,400);
});
test('cancellation is durable before the worker is contacted',async()=>{
  const {handler,calls}=fixture();
  assert.equal((await handler(request({action:'cancel',run_id:runId}))).status,200);
  assert.ok(calls.findIndex(c=>c.url.endsWith('/rpc/cowboys_core_people_finish_run')) <
    calls.findIndex(c=>c.init.method==='DELETE'));
});

test('unsafe evidence URLs rejected and confidence always unverified',()=>{
  assert.throws(()=>safeFindings([{event_type:'ACCOUNT_EXTERNAL_OWNED',source_url:'javascript:alert(1)',observed_at:'2026-01-01'}]));
  assert.throws(()=>safeFindings([{event_type:'ACCOUNT_EXTERNAL_OWNED',source_url:'https://user:pass@example.com/a',observed_at:'2026-01-01'}]));
  const result=safeFindings([{event_type:'ACCOUNT_EXTERNAL_OWNED',source_url:'https://gitlab.com/corefixture',
    source_name:'GitLab',observed_at:'2026-01-01',association:'verified'}]);
  assert.equal(result[0].association,'unverified');
});
test('unrelated account cannot reach worker or secret config',async()=>{
  const {handler,calls}=fixture({allowed:false});
  const response=await handler(request({action:'start',case_id:caseId,request_id:requestId}));
  assert.equal(response.status,403);
  assert.ok(calls.every(c=>!c.url.includes('onrender.com')&&!c.url.includes('people_config')));
  assert.ok(!(await response.text()).includes('secret-fixture'));
});
test('finished results persist once through service-only endpoint',async()=>{
  const {handler,calls}=fixture({worker:'finished'});
  const response=await handler(request({action:'start',case_id:caseId,request_id:requestId}));
  assert.equal(response.status,200);
  const write=calls.find(c=>c.url.endsWith('/rpc/cowboys_core_people_finish_run'));
  assert.equal(JSON.parse(write.init.body).p_status,'finished');
  assert.equal(JSON.parse(write.init.body).p_findings[0].association,'unverified');
  assert.ok(!(await response.text()).includes('secret-fixture'));
});
test('engine wake failures remain queued for retry',async()=>{
  const {handler,calls}=fixture();
  const response=await handler(request({action:'status'}));
  assert.equal(response.status,200);
  assert.equal((await response.json()).enabled,true);
  assert.ok(calls.every(c=>!c.url.includes('onrender.com')));
});
