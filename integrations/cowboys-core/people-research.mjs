const terminal=new Set(["finished","partial","timed_out","failed","cancelled","interrupted"]);
const labels={queued:"Waiting to start",running:"Searching public profiles",finished:"Search finished",partial:"Partial results",
  timed_out:"Time limit reached",failed:"Search failed",cancelled:"Cancelled",interrupted:"Interrupted"};
const messages={engine_waking_up:"The free service is waking up. Your search will retry automatically.",
  worker_busy:"Another search is finishing. Your search is waiting.",
  scan_limit_reached:"Search limit reached: 3 per hour and 12 per day for this shared workspace.",
  scan_already_active:"A search is already active. Open that case to follow it.",
  sign_in_required:"Your session expired. Sign in to Core again.",
  engine_not_configured:"People search is being connected. You can still save a case.",
  core_access_required:"This account does not have access to Core research."};
function el(tag,options={},children=[]) {
  const node=document.createElement(tag);
  for(const [key,value]of Object.entries(options)){
    if(key==="text")node.textContent=value;
    else if(key==="class")node.className=value;
    else node.setAttribute(key,value);
  }
  node.append(...children);return node;
}
function field(label,node){return el("label",{class:"core-people-field"},[el("span",{text:label}),node]);}
function date(value){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.valueOf())?"—":d.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short",hour12:false});}
function errorMessage(error){return messages[error?.code||error?.message]||"Couldn’t complete that action. Your saved case is still available.";}
function safeURL(value){try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password?url.href:null;}catch{return null;}}
function button(label,action,style=""){const b=el("button",{type:"button",class:style,text:label});b.addEventListener("click",action);return b;}

/** Uses the EXISTING authenticated Supabase client. No separate account or public search endpoint. */
export async function mountPeopleResearch({host,client,confirmDelete=message=>globalThis.confirm(message)}) {
  if(!document.querySelector("link[data-core-people]"))document.head.append(el("link",{
    rel:"stylesheet",href:new URL("./people-research.css",import.meta.url).href,"data-core-people":""}));
  let destroyed=false,cases=[],selected=null,currentRun=null,findings=[],pollTimer=null,pollingId=null,busy=false;
  let enabled=false,pendingRequest=null;
  const root=el("section",{class:"core-people","aria-label":"People research"});
  const status=el("p",{class:"core-people-notice",role:"status","aria-live":"polite"});
  const caseList=el("div",{class:"core-people-cases"});
  const detail=el("div",{class:"core-people-detail"});
  const newButton=button("+ New case",openNew,"core-people-primary");
  const header=el("header",{class:"core-people-header"},[
    el("div",{},[el("span",{class:"core-people-eyebrow",text:"RESEARCH WORKSPACE"}),el("h1",{text:"Follow the clues."}),
    el("p",{text:"Keep your searches, source links and notes together."})]),newButton]);
  const aside=el("aside",{class:"core-people-sidebar","aria-label":"Saved cases"},[el("h2",{text:"Your cases"}),caseList]);
  root.append(header,status,el("div",{class:"core-people-layout"},[aside,detail]));
  host.replaceChildren(root);

  async function gateway(body) {
    const {data,error}=await client.functions.invoke("core-people-research",{body});
    if(error){let code="";try{code=(await error.context?.json())?.error||"";}catch{}throw {code:code||error.message};}
    if(data?.error)throw {code:data.error};
    return data;
  }
  function notice(text,kind="info"){status.textContent=text;status.dataset.kind=kind;}
  async function loadCases(preferred=selected?.id) {
    const {data,error}=await client.from("cowboys_core_people_cases").select("*").order("created_at",{ascending:false}).limit(100);
    if(error)throw error;
    if(destroyed)return;
    cases=data||[];
    selected=cases.find(c=>c.id===preferred)||cases[0]||null;
    renderCases();
    if(selected)await loadDetail(selected.id);else renderEmpty();
  }
  function renderCases(){
    caseList.replaceChildren(...cases.map(item=>{
      const b=button("",()=>selectCase(item.id),"core-people-case"+(item.id===selected?.id?" is-active":""));
      b.setAttribute("aria-pressed",String(item.id===selected?.id));
      b.append(el("strong",{text:item.title}),el("span",{text:item.kind+" · "+date(item.created_at)}));
      return b;
    }));
    if(!cases.length)caseList.append(el("p",{class:"core-people-muted",text:"Save your first case to get started."}));
  }
  function renderEmpty(){detail.replaceChildren(el("div",{class:"core-people-empty"},[
    el("span",{class:"core-people-empty-symbol","aria-hidden":"true",text:"⌕"}),el("h2",{text:"Start with one clue"}),
    el("p",{text:"A username gives the most focused search. A name tries likely usernames; an email checks its username portion."}),
    button("Create a case",openNew,"core-people-primary")]));}
  async function selectCase(id){selected=cases.find(c=>c.id===id);renderCases();try{await loadDetail(id);}catch(e){notice(errorMessage(e),"error");}}
  async function loadDetail(id) {
    const {data:runs,error}=await client.from("cowboys_core_people_runs").select("*").eq("case_id",id).order("created_at",{ascending:false}).limit(15);
    if(error)throw error;
    if(destroyed||selected?.id!==id)return;
    currentRun=runs?.[0]||null;
    findings=[];
    if(currentRun){
      const result=await client.from("cowboys_core_people_findings").select("*").eq("run_id",currentRun.id).order("observed_at",{ascending:false});
      if(result.error)throw result.error;
      if(destroyed||selected?.id!==id)return;
      findings=result.data||[];
    }
    renderDetail();
    if(currentRun&&!terminal.has(currentRun.status))schedulePoll(currentRun.id);
  }
  function renderDetail(){
    const item=selected;if(!item)return renderEmpty();
    const title=el("h2",{text:item.title});
    const target=el("p",{class:"core-people-target",text:item.query});
    const start=button(busy?"Starting…":currentRun&&!terminal.has(currentRun.status)?"Search in progress":"Search public profiles",startSearch,"core-people-primary");
    start.disabled=busy||!enabled||!!(currentRun&&!terminal.has(currentRun.status));
    const actions=el("div",{class:"core-people-detail-actions"},[start,
      button("Export case",exportCase),button("Delete case",deleteCase,"core-people-danger")]);
    if(currentRun&&!terminal.has(currentRun.status))actions.append(button("Cancel search",cancelSearch));
    const scope=el("p",{class:"core-people-scope",text:"12 public sites · up to 90 seconds · possible accounts"});
    const summary=el("div",{class:"core-people-summary"},[title,target,scope,actions]);
    const noteInput=el("textarea",{rows:"3",maxlength:"10000","aria-label":"Case notes",placeholder:"What are you looking for? Add context or leads to review."});
    noteInput.value=item.notes||"";
    const saveNotes=button("Save notes",async()=>{
      saveNotes.disabled=true;
      try{
        const result=await client.from("cowboys_core_people_cases").update({notes:noteInput.value}).eq("id",item.id);
        if(result.error)throw result.error;
        item.notes=noteInput.value;notice("Case notes saved.");
      }catch(e){notice(errorMessage(e),"error");}finally{saveNotes.disabled=false;}
    });
    const notes=el("div",{class:"core-people-notes"},[field("Case notes",noteInput),saveNotes]);
    const results=el("div",{class:"core-people-findings"});
    results.append(el("div",{class:"core-people-results-heading"},[el("h3",{text:"Source links"}),
      el("span",{text:findings.length+" possible "+(findings.length===1?"account":"accounts")})]));
    if(currentRun)results.append(el("p",{class:"core-people-run-status",text:(labels[currentRun.status]||currentRun.status)+" · "+date(currentRun.finished_at||currentRun.created_at)}));
    if(!findings.length)results.append(el("p",{class:"core-people-muted",text:currentRun&&terminal.has(currentRun.status)?
      "No profile links were saved from this run. A missing result does not prove an account does not exist.":
      "Source links will appear here after your search is saved."}));
    for(const finding of findings){
      const url=safeURL(finding.source_url);
      const source=url?el("a",{href:url,target:"_blank",rel:"noopener noreferrer",text:finding.source_name}):el("strong",{text:finding.source_name});
      const review=el("select",{"aria-label":"Review "+finding.source_name});
      for(const [value,label]of [["unreviewed","Not reviewed"],["possible_match","Possible match"],["different_person","Different person"]])
        review.append(el("option",{value,text:label}));
      review.value=finding.review_state;
      review.addEventListener("change",async()=>{
        review.disabled=true;
        try{
          const result=await client.from("cowboys_core_people_findings").update({review_state:review.value}).eq("id",finding.id);
          if(result.error)throw result.error;
          finding.review_state=review.value;notice("Review saved.");
        }catch(e){review.value=finding.review_state;notice(errorMessage(e),"error");}finally{review.disabled=false;}
      });
      results.append(el("article",{class:"core-people-finding"},[
        el("div",{},[el("span",{class:"core-people-match-label",text:"UNVERIFIED ACCOUNT"}),source,
          el("small",{text:"Observed "+date(finding.observed_at)})]),review]));
    }
    detail.replaceChildren(summary,el("p",{class:"core-people-context",text:
      "Review each source before linking it to a person. Public sites may change or block a search. The underlying account list was archived in November 2026."}),results,notes);
  }
  function schedulePoll(runId){
    if(destroyed||pollingId===runId)return;
    if(pollTimer)clearTimeout(pollTimer);
    pollingId=runId;
    const step=async()=>{
      if(destroyed)return;
      try{
        const response=await gateway({action:"poll",run_id:runId});
        if(destroyed)return;
        if(response.notice)notice(messages[response.notice]||"Search is waiting.");
        if(terminal.has(response.run.status)){
          pollingId=null;pendingRequest=null;
          if(selected?.id===response.run.case_id)await loadDetail(selected.id);
          notice((labels[response.run.status]||"Search updated")+". Your case is saved.");
          return;
        }
        if(selected?.id===response.run.case_id){currentRun=response.run;renderDetail();}
      }catch(e){
        notice(errorMessage(e),"error");
        if(["sign_in_required","core_access_required","record_not_found"].includes(e.code)){pollingId=null;return;}
      }
      pollTimer=setTimeout(step,4000);
    };
    pollTimer=setTimeout(step,1500);
  }
  async function startSearch(){
    if(!selected||busy)return;
    busy=true;renderDetail();
    const caseId=selected.id;
    pendingRequest=pendingRequest?.caseId===caseId?pendingRequest:{caseId,id:crypto.randomUUID()};
    try{
      const response=await gateway({action:"start",case_id:caseId,request_id:pendingRequest.id});
      if(destroyed)return;
      if(selected?.id===caseId){currentRun=response.run;renderDetail();}
      notice(response.notice?messages[response.notice]:"Searching. Keep this tab open until the results are saved.");
      if(!terminal.has(response.run.status))schedulePoll(response.run.id);
      else {pendingRequest=null;if(selected?.id===caseId)await loadDetail(caseId);}
    }catch(e){notice(errorMessage(e),"error");}
    finally{busy=false;if(!destroyed)renderDetail();}
  }
  async function cancelSearch(){
    if(!currentRun)return;
    try{
      const response=await gateway({action:"cancel",run_id:currentRun.id});
      if(selected?.id===response.run.case_id){currentRun=response.run;renderDetail();}
      pendingRequest=null;pollingId=null;if(pollTimer)clearTimeout(pollTimer);notice("Search cancelled. Saved cases are still available.");
    }catch(e){notice(errorMessage(e),"error");}
  }
  function openNew(){
    const dialog=el("dialog",{class:"core-people-new","aria-label":"New research case"});
    const form=el("form");
    const title=el("input",{name:"title",required:"",maxlength:"160",placeholder:"For example: Review a new lead"});
    const kind=el("select",{name:"kind"},[el("option",{value:"username",text:"Username"}),
      el("option",{value:"name",text:"Full name"}),el("option",{value:"email",text:"Email address"})]);
    const query=el("input",{name:"query",required:"",maxlength:"120",autocomplete:"off",placeholder:"Username to research"});
    kind.addEventListener("change",()=>{query.placeholder={username:"Username to research",name:"First and last name",email:"Email address"}[kind.value];});
    const error=el("p",{role:"alert",class:"core-people-form-error"});
    const submit=el("button",{type:"submit",class:"core-people-primary",text:"Save case"});
    form.append(el("h2",{text:"Start a new case"}),field("Case title",title),field("Search by",kind),field("Clue",query),
      el("p",{class:"core-people-muted",text:"Saving a case does not start a search."}),error,
      el("div",{class:"core-people-detail-actions"},[submit,button("Cancel",()=>dialog.close())]));
    form.addEventListener("submit",async event=>{
      event.preventDefault();submit.disabled=true;
      try{
        const result=await client.from("cowboys_core_people_cases").insert({title:title.value.trim(),kind:kind.value,query:query.value.trim(),notes:""}).select("*").single();
        if(result.error)throw result.error;
        await loadCases(result.data.id);dialog.close();notice("Case saved. Start a search when you’re ready.");
      }catch(e){error.textContent=errorMessage(e);}finally{submit.disabled=false;}
    });
    dialog.append(form);root.append(dialog);
    dialog.addEventListener("close",()=>{dialog.remove();newButton.focus();},{once:true});
    dialog.showModal();title.focus();
  }
  async function deleteCase(){
    const item=selected;
    if(!item||!confirmDelete("Delete this case, its saved searches and source links?"))return;
    try{
      if(currentRun&&currentRun.case_id===item.id&&!terminal.has(currentRun.status))await gateway({action:"cancel",run_id:currentRun.id});
      const result=await client.from("cowboys_core_people_cases").delete().eq("id",item.id);
      if(result.error)throw result.error;
      await loadCases();notice("Case deleted.");
    }catch(e){notice(errorMessage(e),"error");}
  }
  function exportCase(){
    if(!selected)return;
    const blob=new Blob([JSON.stringify({case:selected,run:currentRun,findings,exported_at:new Date().toISOString()},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),link=el("a",{href:url,download:"core-research-case.json"});
    link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  try{
    const configuration=await gateway({action:"status"});
    enabled=!!configuration.enabled;
    notice(enabled?"Searches use the free service. The first search may take about a minute to wake it up.":"People search is being connected. You can still save a case.");
    await loadCases();
  }catch(e){notice(errorMessage(e),"error");renderEmpty();}
  return {newCase:openNew,destroy(){destroyed=true;if(pollTimer)clearTimeout(pollTimer);root.querySelectorAll("dialog").forEach(d=>d.close());host.replaceChildren();}};
}
