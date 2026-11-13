/* Family Calendar: approved-member Google Calendar mirror.
 * Events are read from a private Supabase RPC and never exposed as a public Google embed.
 * Source Google Calendar is the existing, now-cleared primary calendar named Family.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const host=document.getElementById('conversations');
const cfg=window.COWBOY_COMMUNITY_CONFIG;
const tz='America/New_York';
const dateFmt=new Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'short',month:'short',day:'numeric',year:'numeric'});
const timeFmt=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false});
const dayFmt=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'});
const monthFmt=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',year:'numeric',month:'long'});
const el=(tag,cls,label)=>{
 const node=document.createElement(tag);if(cls)node.className=cls;if(label!==undefined)node.textContent=String(label);return node;
};
const dayKey=value=>{
 const parts=dayFmt.formatToParts(new Date(value)),pick=x=>parts.find(p=>p.type===x)?.value;
 return pick('year')+'-'+pick('month')+'-'+pick('day');
};
const currentMonth=()=>{
 const p=dayFmt.formatToParts(new Date()),get=x=>p.find(v=>v.type===x).value;
 return {year:Number(get('year')),month:Number(get('month'))};
};
const longMonth=(y,m)=>monthFmt.format(new Date(Date.UTC(y,m-1,1)));
const numberDate=(y,m,d)=>String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
const normMonth=(y,m)=>{const d=new Date(Date.UTC(y,m-1,1));return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1}};
if(host && cfg?.enabled && location.pathname.endsWith('community.html')){
 let panel=document.getElementById('family-calendar-panel');
 if(!panel){
  panel=el('section','family-calendar-panel container');
  panel.id='family-calendar-panel';panel.setAttribute('aria-label','The Family Calendar');panel.hidden=true;
  const fold=el('details');fold.id='family-calendar-fold';
  const summary=el('summary');
  summary.append(el('span','family-calendar-icon','▦'));
  const copy=el('span','family-calendar-copy');
  copy.append(el('strong','','THE FAMILY CALENDAR'),el('small','','The same events for every approved member'));
  summary.append(copy,el('span','family-calendar-open','▾'));
  const inner=el('div','family-calendar-inner');
  const intro=el('header','family-calendar-intro');
  const title=el('div');title.append(el('p','','THE COMMONS · FAMILY CORNER'),el('h2','','Our plans, in one place.'));
  title.append(el('span','','Everyone approved on the message board can view event times, descriptions and locations.'));
  intro.append(title,el('span','family-calendar-chip','MEMBERS ONLY'));
  const content=el('div','family-calendar-content');content.id='family-calendar-content';
  inner.append(intro,content);fold.append(summary,inner);panel.append(fold);
  host.before(panel);
 }
 const fold=panel.querySelector('#family-calendar-fold'),content=panel.querySelector('#family-calendar-content');
 const state={month:currentMonth(),view:'agenda',events:[],loading:false,client:null,connected:false,synced:null};
 const buildShell=()=>{
  content.replaceChildren();
  const toolbar=el('div','family-calendar-toolbar');
  const top=el('div','family-calendar-date-controls');
  const back=el('button','','‹');back.type='button';back.title='Previous month';back.setAttribute('aria-label','Previous month');
  const today=el('button','','Today');today.type='button';
  const next=el('button','','›');next.type='button';next.title='Next month';next.setAttribute('aria-label','Next month');
  const name=el('strong','family-calendar-month');name.id='family-calendar-month';
  top.append(back,today,next,name);
  const views=el('div','family-calendar-modes');
  const agenda=el('button','','Agenda'),month=el('button','','Month');
  agenda.type=month.type='button';
  agenda.dataset.view='agenda';month.dataset.view='month';
  views.append(agenda,month);toolbar.append(top,views);
  const status=el('p','family-calendar-feed-status','Opening your Family calendar…');status.id='family-calendar-feed-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const list=el('div','family-calendar-list');list.id='family-calendar-list';
  const footer=el('p','family-calendar-caution','Read-only here. Add or edit events in your Google Family calendar. New events appear after the next secure sync.');
  content.append(toolbar,status,list,footer);
  back.addEventListener('click',()=>changeMonth(-1));
  today.addEventListener('click',()=>{state.month=currentMonth();void refresh();});
  next.addEventListener('click',()=>changeMonth(1));
  views.addEventListener('click',event=>{
   const target=event.target.closest('button[data-view]');
   if(!target)return;state.view=target.dataset.view;render();
  });
 };
 function changeMonth(diff){state.month=normMonth(state.month.year,state.month.month+diff);void refresh();}
 function formatEventTime(item){
  if(item.all_day)return 'All day';
  const start=new Date(item.start),end=new Date(item.end);
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))return '';
  return timeFmt.format(start)+'–'+timeFmt.format(end);
 }
 function eventNode(item){
  const article=el('article','family-calendar-event');
  const header=el('div','family-calendar-event-header');
  const label=el('div');
  label.append(el('strong','',item.title||'Untitled event'),el('small','',dateFmt.format(new Date(item.start))+' · '+formatEventTime(item)));
  header.append(label);
  if(item.status==='tentative')header.append(el('span','family-calendar-tentative','Tentative'));
  article.append(header);
  if(item.location){const where=el('p','family-calendar-where','Location: '+item.location);article.append(where);}
  if(item.description){article.append(el('p','family-calendar-description',item.description));}
  return article;
 }
 function monthRender(parent,events){
  const year=state.month.year,month=state.month.month;
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const first=new Date(Date.UTC(year,month-1,1)).getUTCDay();
  const grid=el('div','family-calendar-grid');
  const headings=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for(const name of headings)grid.append(el('span','family-calendar-weekday',name));
  for(let i=0;i<first;i++)grid.append(el('span','family-calendar-empty'));
  for(let day=1;day<=days;day++){
   const key=numberDate(year,month,day);
   const cell=el('div','family-calendar-day');
   if(key===dayKey(new Date()))cell.classList.add('is-today');
   cell.append(el('strong','',day));
   const matches=events.filter(item=>dayKey(item.start)===key);
   const n=Math.min(matches.length,3);
   for(let i=0;i<n;i++)cell.append(el('span','family-calendar-day-event',matches[i].title||'Event'));
   if(matches.length>3)cell.append(el('small','','+'+(matches.length-3)+' more'));
   grid.append(cell);
  }
  parent.append(grid);
  const upcoming=el('div','family-calendar-month-list');
  upcoming.append(el('h3','','Events this month'));
  for(const event of events)upcoming.append(eventNode(event));
  if(!events.length)upcoming.append(el('p','family-calendar-empty-message','No family events scheduled this month.'));
  parent.append(upcoming);
 }
 function render(){
  const name=panel.querySelector('#family-calendar-month'),list=panel.querySelector('#family-calendar-list');
  if(!name||!list)return;
  name.textContent=longMonth(state.month.year,state.month.month)+' '+state.month.year;
  panel.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
  list.replaceChildren();
  const all=state.events.filter(e=>{
   const key=dayKey(e.start);
   return key.startsWith(numberDate(state.month.year,state.month.month,1).slice(0,7));
  }).sort((a,b)=>new Date(a.start)-new Date(b.start));
  if(state.view==='month'){monthRender(list,all);}
  else if(!all.length){list.append(el('p','family-calendar-empty-message','No family events scheduled for this month.'));}
  else for(const event of all)list.append(eventNode(event));
  const status=panel.querySelector('#family-calendar-feed-status');
  if(status&&!state.loading){
   status.textContent=(all.length+' event'+(all.length===1?'':'s')+' · ') +
    (state.synced?'Last synced '+dateFmt.format(new Date(state.synced))+' at '+timeFmt.format(new Date(state.synced)):'Sync pending')+
    ' · America/New_York';
  }
 }
 async function connect(){
  if(state.connected)return state.client;
  if(!cfg?.supabaseUrl||!cfg.publishableKey)throw Error('Member calendar connection unavailable.');
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
  const local=window.localStorage,session=window.sessionStorage;
  const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
  const key='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
  state.client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}});
  state.connected=true;
  return state.client;
 }
 async function refresh(){
  if(state.loading||panel.hidden||!fold.open)return;
  state.loading=true;
  const line=panel.querySelector('#family-calendar-feed-status');
  if(line)line.textContent='Loading family events…';
  try{
   const client=await connect(),session=await client.auth.getSession();
   if(!session.data.session?.user)throw Error('Please sign in to view the Family calendar.');
   const y=state.month.year,m=state.month.month;
   const from=new Date(Date.UTC(y,m-1,-2)).toISOString();
   const until=new Date(Date.UTC(y,m+1,3)).toISOString();
   const res=await client.rpc('community_family_calendar_feed',{p_from:from,p_until:until});
   if(res.error)throw res.error;
   state.events=res.data?.events||[];state.synced=res.data?.last_synced||null;
  }catch(error){
   state.events=[];state.synced=null;
   if(line)line.textContent='Could not load Family events: '+String(error.message||'Try signing in again.').slice(0,150);
   state.loading=false;return;
  }
  state.loading=false;render();
 }
 function visibility(){
  const shown=!host.hidden&&!host.closest('[hidden]');
  panel.hidden=!shown;
  if(shown&&fold.open)void refresh();
 }
 buildShell();
 fold.addEventListener('toggle',()=>{if(fold.open)void refresh();});
 new MutationObserver(visibility).observe(host,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!panel.hidden&&fold.open)void refresh();});
 visibility();
}