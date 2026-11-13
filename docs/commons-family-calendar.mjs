/* Cowboy's Commons: dedicated Family Google Calendar foldout.
 * Never injects a private or primary calendar; Google embed only after a separate
 * intentionally shared calendar ID is set in commons-family-calendar-config.js.
 */
const board=document.getElementById('conversations');
const cfg=window.COWBOY_FAMILY_CALENDAR||{};
const validId=id=>typeof id==='string'&&id.length<260&&/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+$/.test(id)&&!/[<>]/.test(id);
if(board&&location.pathname.endsWith('community.html')){
 let panel=document.getElementById('family-calendar-panel');
 if(!panel){
  panel=document.createElement('section');
  panel.id='family-calendar-panel';
  panel.className='family-calendar-panel container';
  panel.setAttribute('aria-label','The Family Calendar');
  panel.hidden=true;
  panel.innerHTML='<details id="family-calendar-fold"><summary><span class="family-calendar-icon" aria-hidden="true">▦</span><span class="family-calendar-copy"><strong>THE FAMILY CALENDAR</strong><small>Upcoming get-togethers, activities and shared family events</small></span><span class="family-calendar-open" aria-hidden="true">▾</span></summary><div class="family-calendar-inner"><header class="family-calendar-intro"><div><p>THE COMMONS · FAMILY CORNER</p><h2>Our plans, in one place.</h2><span>A dedicated calendar for events intended to be shared with the group. Private appointments stay on private calendars.</span></div><span class="family-calendar-chip">SHARED EVENTS ONLY</span></header><div id="family-calendar-content" class="family-calendar-content"></div></div></details>';
  board.before(panel);
 }
 const open=panel.querySelector('details');
 const slot=panel.querySelector('#family-calendar-content');
 let inserted=false;
 const draw=()=>{
  if(inserted||!open.open||panel.hidden)return;
  inserted=true;
  const id=cfg.googleCalendarId;
  if(validId(id)){
   const controls=document.createElement('div');
   controls.className='family-calendar-controls';
   const link=document.createElement('a');
   link.href='https://calendar.google.com/calendar/u/0/r?cid='+encodeURIComponent(id);
   link.target='_blank';link.rel='noopener noreferrer';
   link.textContent='Open in Google Calendar';
   const note=document.createElement('span');
   note.textContent='Times displayed in Eastern time. Select an event in the calendar for details.';
   controls.append(link,note);
   const frame=document.createElement('iframe');
   frame.title='Family Calendar events from Google Calendar';
   frame.loading='lazy';frame.referrerPolicy='no-referrer';frame.allowFullscreen=false;
   const params=new URLSearchParams({src:id,ctz:cfg.timezone||'America/New_York',mode:'AGENDA',showTitle:'0',showCalendars:'0',showTabs:'0',showPrint:'0',showTz:'1',bgcolor:'#fffdf6'});
   frame.src='https://calendar.google.com/calendar/embed?'+params.toString();
   frame.className='family-calendar-frame';frame.setAttribute('scrolling','auto');
   slot.replaceChildren(controls,frame);
  }else{
   const card=document.createElement('div');card.className='family-calendar-setup';
   const title=document.createElement('h3');title.textContent='The Family Calendar is ready to connect.';
   const copy=document.createElement('p');
   copy.textContent='The shared Google calendar has not been linked yet. Until then, no family or personal events are displayed.';
   const link=document.createElement('a');
   link.href='https://calendar.google.com/calendar/u/0/r/settings/createcalendar';
   link.target='_blank';link.rel='noopener noreferrer';
   link.textContent='Create a separate Family calendar in Google';
   const warning=document.createElement('p');warning.className='family-calendar-caution';
   warning.textContent='Use a separate calendar for group-safe events. Do not publish a personal calendar with children’s private details, addresses or appointments.';
   card.append(title,copy,link,warning);slot.replaceChildren(card);
  }
 };
 const update=()=>{
  const visible=!board.hidden&&!board.closest('[hidden]');
  panel.hidden=!visible;
  if(visible)draw();
 };
 open.addEventListener('toggle',draw);
 const observer=new MutationObserver(update);
 observer.observe(board,{attributes:true,attributeFilter:['hidden']});
 update();
}
