export const FAMILY_ZONE = 'America/New_York';

const dateKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: FAMILY_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
});
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: FAMILY_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});
const timeStampFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: FAMILY_ZONE, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});

export const dayKey = value => dateKeyFormat.format(new Date(value));
export const clockTime = value => timeFormat.format(new Date(value));
export const boardTime = value => timeStampFormat.format(new Date(value)) + ' ET';
export const dateFromKey = key => new Date(key + 'T12:00:00Z');
export const dateKey = value => value.toISOString().slice(0, 10);
export function addDays(key, days) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}
export function shiftMonth(key, months) {
  const date = dateFromKey(key);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months + 1, 0);
  date.setUTCDate(Math.min(day, date.getUTCDate()));
  return dateKey(date);
}
export const startOfMonth = key => key.slice(0, 7) + '-01';
export const startOfWeek = key => addDays(key, -dateFromKey(key).getUTCDay());
export function easternMidnight(key) {
  // The offset at Eastern midnight is derived separately for each day.
  const noon = new Date(key + 'T12:00:00Z');
  const offset = 12 - Number(clockTime(noon).slice(0, 2));
  // Clock changes in Eastern time occur after midnight. Use a second probe.
  const guess = new Date(key + 'T' + String(offset).padStart(2, '0') + ':00:00Z');
  const hour = Number(clockTime(guess).slice(0, 2));
  const delta = (hour + 12) % 24 - 12;
  return new Date(+guess - delta * 3600000);
}
export function eventOnDate(event, key) {
  const start = +new Date(event.start);
  const end = +new Date(event.end);
  const from = +easternMidnight(key);
  const until = +easternMidnight(addDays(key, 1));
  return start < until && (end > from || (end === start && end === from));
}

export function el(tag, classes = '', label) {
  const node = document.createElement(tag);
  if (classes) node.className = classes;
  if (label !== undefined) node.textContent = String(label);
  return node;
}
export function button(label, activate, attr = {}) {
  const node = el('button', '', label);
  node.type = 'button';
  for (const [key, value] of Object.entries(attr)) node.setAttribute(key, value);
  node.addEventListener('click', activate);
  return node;
}
export function field(label, input) {
  const node = el('label', 'family-field');
  node.append(el('span', '', label), input);
  return node;
}
export function preference(key, value) {
  try {
    if (value !== undefined) localStorage.setItem('cowboy-family-ui:' + key, value);
    return localStorage.getItem('cowboy-family-ui:' + key);
  } catch { return null; }
}
export function persistentFold(id, label) {
  const details = el('details', 'family-panel');
  details.id = id;
  details.append(el('summary', '', label));
  details.open = preference(id) === 'open';
  details.addEventListener('toggle', () => preference(id, details.open ? 'open' : 'closed'));
  return details;
}
export function statusLine(initial = '') {
  const node = el('p', 'family-status', initial);
  node.setAttribute('role', 'status');
  return node;
}
export function reportError(error, fallback) {
  if (error?.code === '42501' || error?.code === 'PGRST301') return 'Family membership or sign-in could not be verified.';
  if (['22023', '22007', '22008', '23505', '40001'].includes(error?.code)) return error.message;
  return fallback;
}
