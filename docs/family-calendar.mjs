import {
  addDays, boardTime, button, clockTime, dateFromKey, dayKey, easternMidnight, el, eventOnDate,
  field, persistentFold, preference, reportError, shiftMonth, startOfMonth, startOfWeek, statusLine
} from './family-board-core.mjs?v=family3';

const categories = {plans: 'Family plans', appointment: 'Appointment', work: 'Work', celebration: 'Celebration', other: 'Other'};
const headingFormat = new Intl.DateTimeFormat('en-US', {month: 'long', year: 'numeric', timeZone: 'UTC'});
const dayFormat = new Intl.DateTimeFormat('en-US', {weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC'});
const shortDay = new Intl.DateTimeFormat('en-US', {weekday: 'short', day: 'numeric', timeZone: 'UTC'});
const googleCalendar = 'https://calendar.google.com/calendar/u/0/r';

export function makeCalendar({rpc}) {
  const panel = persistentFold('family-calendar', 'Family Calendar');
  const body = el('div', 'family-panel-body');
  const toolbar = el('div', 'family-controls family-calendar-controls');
  const heading = el('h3', 'family-period');
  const modes = el('div', 'family-controls family-calendar-modes');
  const status = statusLine('Open the calendar to load events.');
  const grid = el('div', 'family-date-grid');
  const list = el('div', 'family-event-list');
  const footer = el('p', 'family-status');
  const editor = el('div', 'family-editor');
  const timeZone = el('p', 'family-status', 'Eastern time · 24-hour clock');
  const today = () => dayKey(new Date());
  let selected = today();
  let view = preference('calendar-view');
  if (!['month', 'week', 'agenda'].includes(view)) view = 'month';
  let events = [], loadedRange = '', request = 0, active = true, needsRefresh = true;
  let editing = false, saving = false;
  const go = delta => openDate(view === 'week' ? addDays(selected, delta * 7) : shiftMonth(selected, delta));
  const previous = button('‹', () => go(-1), {'aria-label': 'Previous period'});
  const next = button('›', () => go(1), {'aria-label': 'Next period'});
  toolbar.append(previous, button('Today', () => openDate(today())), next);
  const add = button('Add event', () => showEditor());
  add.className = 'family-primary';
  toolbar.append(add, button('Refresh', () => void refresh(true)));
  for (const [key, label] of [['month', 'Month'], ['week', 'Week'], ['agenda', 'Agenda']]) {
    const control = button(label, () => { view = key; preference('calendar-view', view); openDate(selected); });
    control.dataset.calendarView = key;
    modes.append(control);
  }
  body.append(toolbar, timeZone, modes, heading, editor, status, grid, list, footer);
  panel.append(body);

  function range() {
    if (view === 'week') {
      const first = startOfWeek(selected);
      return [first, addDays(first, 7)];
    }
    const first = startOfMonth(selected);
    return [first, shiftMonth(first, 1)];
  }
  function openDate(value) {
    selected = value;
    render();
    if (range().join('/') !== loadedRange || needsRefresh) void refresh();
  }
  function render() {
    const [from, until] = range();
    const current = range().join('/') === loadedRange;
    heading.textContent = view === 'week'
      ? dayFormat.format(dateFromKey(from)) + ' – ' + dayFormat.format(dateFromKey(addDays(until, -1)))
      : headingFormat.format(dateFromKey(selected));
    previous.setAttribute('aria-label', view === 'week' ? 'Previous week' : 'Previous month');
    next.setAttribute('aria-label', view === 'week' ? 'Next week' : 'Next month');
    add.disabled = saving;
    for (const control of modes.children) control.setAttribute('aria-pressed', String(control.dataset.calendarView === view));
    grid.hidden = view === 'agenda';
    grid.classList.toggle('family-date-grid-week', view === 'week');
    grid.replaceChildren();
    if (view === 'month') {
      for (const name of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) grid.append(el('span', 'family-weekday', name));
      for (let i = 0; i < dateFromKey(from).getUTCDay(); ++i) grid.append(el('span', 'family-date-spacer'));
    }
    if (view !== 'agenda') {
      for (let key = from; key < until; key = addDays(key, 1)) {
        const date = key;
        const matches = current ? events.filter(event => eventOnDate(event, date)).length : 0;
        const control = button(view === 'week' ? shortDay.format(dateFromKey(date)) : String(Number(date.slice(-2))), () => {
          openDate(date);
          grid.querySelector('[aria-pressed="true"]')?.focus();
        }, {'aria-pressed': String(date === selected),
          'aria-label': dayFormat.format(dateFromKey(date)) + (matches ? ', ' + matches + ' events' : '')});
        if (date === today()) control.setAttribute('aria-current', 'date');
        if (matches) control.append(el('small', 'family-date-count', String(matches)));
        grid.append(control);
      }
    }
    list.replaceChildren();
    if (!current) return;
    const items = view === 'agenda' ? events : events.filter(event => eventOnDate(event, selected));
    const title = view === 'agenda' ? 'This month' : dayFormat.format(dateFromKey(selected));
    list.append(el('h4', '', title));
    if (!items.length) list.append(el('p', 'family-status', 'No events scheduled.'));
    for (const event of items) {
      const row = el('details', 'family-event');
      const header = el('summary');
      const time = event.all_day ? 'All day' : clockTime(event.start) + '–' + clockTime(event.end);
      const span = el('span', 'family-event-title', event.title);
      const metadata = (view === 'agenda' ? dayFormat.format(dateFromKey(dayKey(event.start))) + ' · ' : '') + time;
      header.append(span, el('small', '', metadata));
      const detail = el('div', 'family-event-body');
      const end = event.all_day && +new Date(event.end) > +new Date(event.start)
        ? new Date(+new Date(event.end) - 1) : event.end;
      const startDay = dayKey(event.start), endDay = dayKey(end);
      if (startDay !== endDay) detail.append(el('p', '', dayFormat.format(dateFromKey(startDay)) + ' – ' + dayFormat.format(dateFromKey(endDay))));
      detail.append(el('p', 'family-event-tag', event.source === 'google' ? 'Google Family Calendar' : categories[event.category] || 'Family plans'));
      if (event.location) detail.append(el('p', 'family-event-location', event.location));
      if (event.description) detail.append(el('p', 'family-event-description', event.description));
      if (event.status === 'tentative') detail.append(el('small', '', 'Tentative'));
      const controls = el('div', 'family-controls');
      if (event.editable) {
        controls.append(button('Edit event', () => showEditor(event)),
          button('Delete event', () => {
            if (window.confirm('Delete this event from the Family Message Board?')) void save('remove', event.id, event.updated_at);
          }));
      } else if (event.source === 'google') {
        const link = el('a', '', 'Open Google Calendar');
        link.href = googleCalendar;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        controls.append(link);
      }
      detail.append(controls);
      row.append(header, detail);
      list.append(row);
    }
  }
  async function refresh(manual = false) {
    if (!active || !panel.open) { needsRefresh = true; return; }
    needsRefresh = false;
    const [from, until] = range();
    const key = [from, until].join('/');
    const id = ++request;
    if (manual || key !== loadedRange) status.textContent = 'Loading calendar…';
    try {
      const {data, error} = await rpc('community_family_calendar_feed',
        {p_from: easternMidnight(from).toISOString(), p_until: easternMidnight(until).toISOString()});
      if (!active || request !== id) return;
      if (error) throw error;
      events = data.events || [];
      loadedRange = key;
      footer.textContent = data.last_synced ? 'Google Calendar last synced ' + boardTime(data.last_synced) : 'Google Calendar sync time is unavailable.';
      status.textContent = manual ? 'Calendar refreshed.' : '';
      render();
    } catch (error) {
      if (!active || request !== id) return;
      needsRefresh = true;
      status.textContent = reportError(error, key === loadedRange ? 'Showing the last loaded events. Refresh to reconnect.' : 'Could not load these dates. Try Refresh.');
    }
  }
  function showEditor(event) {
    if (saving) return;
    const form = el('form', 'family-form family-event-form');
    const title = el('input');
    title.required = true;
    title.maxLength = 120;
    title.value = event?.title || '';
    const location = el('input');
    location.maxLength = 200;
    location.value = event?.location || '';
    const description = el('textarea');
    description.maxLength = 1500;
    description.rows = 3;
    description.value = event?.description || '';
    const category = el('select');
    for (const [value, label] of Object.entries(categories)) {
      const option = el('option', '', label);
      option.value = value;
      category.append(option);
    }
    category.value = event?.category || 'plans';
    const allDay = el('input');
    allDay.type = 'checkbox';
    allDay.checked = event?.all_day || false;
    const start = el('input'), end = el('input');
    start.required = end.required = true;
    const localValue = value => dayKey(value) + 'T' + clockTime(value);
    function changeType(startValue, endValue) {
      start.type = end.type = allDay.checked ? 'date' : 'datetime-local';
      start.value = allDay.checked ? startValue.slice(0, 10) : (startValue.length > 10 ? startValue : startValue + 'T09:00');
      end.value = allDay.checked ? endValue.slice(0, 10) : (endValue.length > 10 ? endValue : endValue + 'T10:00');
    }
    changeType(event?.start ? localValue(event.start) : selected,
      event?.end ? localValue(allDay.checked ? new Date(+new Date(event.end) - 1) : event.end) : selected);
    allDay.addEventListener('change', () => changeType(start.value || selected, end.value || selected));
    const endField = field(allDay.checked ? 'Last day' : 'Ends at (Eastern)', end);
    const startField = field(allDay.checked ? 'First day' : 'Starts at (Eastern)', start);
    allDay.addEventListener('change', () => {
      endField.firstElementChild.textContent = allDay.checked ? 'Last day' : 'Ends at (Eastern)';
      startField.firstElementChild.textContent = allDay.checked ? 'First day' : 'Starts at (Eastern)';
    });
    const confirm = el('button', '', event ? 'Save changes' : 'Add to calendar');
    confirm.type = 'submit';
    confirm.className = 'family-primary';
    const cancel = button('Cancel', () => { editing = false; editor.replaceChildren(); add.focus(); });
    const message = statusLine();
    form.append(field('Event title', title), field('Category', category), field('Location', location),
      field('Description', description), field('All day', allDay), startField, endField, confirm, cancel, message);
    editor.replaceChildren(form);
    editing = true;
    title.focus();
    const id = event?.id || 'board:' + crypto.randomUUID();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (saving) return;
      confirm.disabled = cancel.disabled = true;
      message.textContent = 'Saving…';
      const data = {title: title.value, category: category.value, location: location.value, description: description.value,
        start: start.value, end: end.value, all_day: allDay.checked};
      const failure = await save(event ? 'edit' : 'add', id, event?.updated_at, data);
      if (!active || !editing) return;
      if (failure) {
        confirm.disabled = cancel.disabled = false;
        message.textContent = failure;
      } else {
        editing = false;
        editor.replaceChildren();
        add.focus();
      }
    });
  }
  async function save(action, id, updated, data) {
    if (!active || saving) return 'A calendar change is already saving.';
    saving = true;
    add.disabled = true;
    let failure = '';
    try {
      const {error} = await rpc('community_family_calendar_change',
        {p_action: action, p_id: id, p_updated_at: updated || null, p_event: data || null});
      if (error) throw error;
      if (!active) return '';
      if (data) selected = data.start.slice(0, 10);
      await refresh();
      if (active) status.textContent = action === 'remove' ? 'Event deleted.' : 'Event saved.';
    } catch (error) {
      failure = reportError(error, 'Unable to save the event. Check your connection and try again.');
      if (active && action === 'remove') status.textContent = failure;
      if (active && error?.code === '40001') void refresh();
    } finally {
      saving = false;
      add.disabled = false;
    }
    return failure;
  }
  panel.addEventListener('toggle', () => { if (panel.open && (!loadedRange || needsRefresh)) void refresh(); });
  render();
  return {panel, refresh, dispose: () => { active = false; ++request; }};
}
