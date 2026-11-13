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

/* Selected month drives seasonal art, not the browser's current month.
 * Decorative holiday markers do not create or modify Google events.
 */
const familyMonthThemes=Object.freeze({
 1:{season:'winter',icon:'❄️',heading:'Winter days, warm company.',tag:'Snowy beginnings · Family time'},
 2:{season:'hearts',icon:'💗',heading:'A month for the people we love.',tag:'Hearts & family traditions'},
 3:{season:'spring',icon:'🌷',heading:'A fresh chapter together.',tag:'Early blooms · Spring plans'},
 4:{season:'spring',icon:'🌼',heading:'Let the good days bloom.',tag:'Springtime in the Commons'},
 5:{season:'spring',icon:'🌻',heading:'Sunshine and shared plans.',tag:'Flowers · Family weekends'},
 6:{season:'summer',icon:'☀️',heading:'Long days, good memories.',tag:'Welcome, summer'},
 7:{season:'summer',icon:'🎆',heading:'Summer nights, family lights.',tag:'Summer celebrations'},
 8:{season:'summer',icon:'🍉',heading:'Make the most of summer.',tag:'Late-summer family time'},
 9:{season:'autumn',icon:'🍁',heading:'A new season to gather.',tag:'Golden days · Back-to-routine'},
 10:{season:'spooky',icon:'🎃',heading:'A little autumn magic.',tag:'Pumpkins · October adventures'},
 11:{season:'harvest',icon:'🦃',heading:'Grateful for time together.',tag:'Thanksgiving month · Cozy memories'},
 12:{season:'holiday',icon:'🎄',heading:'Home for the holidays.',tag:'Christmas lights · Winter traditions'}
});
function familyHoliday(year,month,day){
 if(month===11){
  const first=new Date(Date.UTC(year,10,1)).getUTCDay();
  const fourthThursday=1+(4-first+7)%7+21;
  if(day===fourthThursday)return {icon:'🦃',label:'Thanksgiving Day'};
 }
 const notable={
  1:{1:['✨',"New Year's Day"]},
  2:{14:['💗',"Valentine's Day"]},
  7:{4:['🎆','Independence Day']},
  10:{31:['🎃','Halloween']},
  12:{25:['🎄','Christmas Day']}
 };
 const val=notable[month]?.[day];
 return val?{icon:val[0],label:val[1]}:null;
}

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
 const state={month:currentMonth(),view:'agenda',events:[],loading:false,queued:false,client:null,connected:false,synced:null};

 function paintSeason(){
  const theme=familyMonthThemes[state.month.month];
  if(!theme)return;
  panel.dataset.season=theme.season;
  panel.dataset.selectedMonth=String(state.month.month);
  const summaryIcon=panel.querySelector('.family-calendar-icon');
  const subhead=panel.querySelector('.family-calendar-copy small');
  const intro=panel.querySelector('.family-calendar-intro');
  if(summaryIcon)summaryIcon.textContent=theme.icon;
  if(subhead)subhead.textContent=longMonth(state.month.year,state.month.month)+' '+state.month.year+' · '+theme.tag;
  const headline=intro?.querySelector('h2'),caption=intro?.querySelector('p');
  if(headline)headline.textContent=theme.heading;
  if(caption)caption.textContent='THE COMMONS · THE FAMILY CALENDAR · '+longMonth(state.month.year,state.month.month).toUpperCase();
 }

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
   const holiday=familyHoliday(year,month,day);
   if(holiday){
    cell.classList.add('is-holiday');
    cell.setAttribute('aria-label',longMonth(year,month)+' '+day+': '+holiday.label);
    const mark=el('span','family-calendar-holiday-marker',holiday.icon);
    mark.title=holiday.label;
    mark.setAttribute('aria-hidden','true');
    cell.append(mark);
   }
   const matches=events.filter(item=>{const end=new Date(item.end).getTime(),start=new Date(item.start).getTime();const last=dayKey(new Date(Math.max(start,end-1)));return dayKey(item.start)<=key&&last>=key;});
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
  paintSeason();
  name.textContent=longMonth(state.month.year,state.month.month)+' '+state.month.year;
  panel.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
  list.replaceChildren();
  const monthStart=numberDate(state.month.year,state.month.month,1);
  const lastDay=numberDate(state.month.year,state.month,new Date(Date.UTC(state.month.year,state.month.month,0)).getUTCDate());
  const all=state.events.filter(e=>{
   const from=dayKey(e.start),end=new Date(e.end).getTime(),start=new Date(e.start).getTime();
   const last=dayKey(new Date(Math.max(start,end-1)));
   return from<=lastDay&&last>=monthStart;
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
  if(state.loading){state.queued=true;return;}
  if(panel.hidden||!fold.open)return;
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
   state.loading=false;
   if(state.queued){state.queued=false;void refresh();}
   return;
  }
  state.loading=false;render();
  if(state.queued){state.queued=false;void refresh();}
 }
 function visibility(){
  const shown=!host.hidden&&!host.closest('[hidden]');
  panel.hidden=!shown;
  if(shown&&fold.open)void refresh();
 }
 buildShell();
 paintSeason();
 fold.addEventListener('toggle',()=>{if(fold.open)void refresh();});
 new MutationObserver(visibility).observe(host,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!panel.hidden&&fold.open)void refresh();});
 visibility();
}