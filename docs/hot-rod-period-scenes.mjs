import {CAR_LIST, CARS, DEADLINE, PART_LIST, START} from './hot-rod-catalog.mjs';

const HOUR = 3600000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const PAGE_SIZE = 5;
const AFTERMARKET = PART_LIST.filter(part => !part.stock);

export const NEWSPAPER_HOTSPOTS = Object.freeze({
  cover: Object.freeze({parts: [10, 8, 242, 29], cars: [10, 38, 270, 34], garage: [247, 152, 66, 29]}),
  listings: Object.freeze({cover: [9, 7, 71, 23], cars: [84, 7, 71, 23], parts: [159, 7, 76, 23],
    garage: [239, 7, 72, 23], previous: [6, 34, 43, 146], next: [271, 34, 43, 146]}),
  listing: Object.freeze(Array.from({length: PAGE_SIZE}, (_, index) => [54, 47 + index * 25, 212, 24]))
});

export const DRIVE_IN_HOTSPOTS = Object.freeze({
  caller: [230, 92, 35, 33], challenge: [40, 125, 173, 53], inspect: [213, 125, 70, 53],
  menu: Object.freeze(Array.from({length: 4}, (_, index) => [22, 58 + index * 17, 100, 17]))
});

const masthead = {
  L: '18 38 6a 66 20 20 20 20 24 2e 75 42', o: '00 00 00 00 0c 12 32 22 22 26 14 08',
  s: '00 00 00 00 0e 12 30 1c 0e 42 64 38', A: '08 1c 36 63 63 63 7f 63 63 63 76 22',
  n: '00 00 00 00 25 3a 32 22 22 22 66 24', g: '00 00 00 00 1c 32 22 22 3e 02 24 18',
  e: '00 00 00 00 1c 32 26 2c 30 32 1c 08', l: '18 30 30 20 20 20 20 20 20 24 18 08',
  N: '22 76 72 72 5a 5a 4a 4e 46 46 67 22', w: '00 00 00 00 22 6b 6b 49 49 5d 36 22'
};

const campaignDate = hours => new Date(START + (Number.isFinite(hours) ? hours : 0) * HOUR);

function periodStatus(s, view, message) {
  s.box(0, 187, 320, 13, 0);
  s.box(0, 186, 320, 1, 7);
  const balance = Number.isFinite(view.cash) ? `Bankroll $${view.cash}` : '';
  if (balance) s.text(balance, 5, 190, 12);
  const text = message.slice(0, balance ? 34 : 50);
  s.text(text, 315 - text.length * 6, 190, 7);
}

function nameplate(s) {
  const title = 'Los Angeles News';
  let left = 17;
  for (const letter of title) {
    const rows = masthead[letter]?.split(' ') || [];
    rows.forEach((row, y) => {
      const bits = parseInt(row, 16);
      for (let x = 0; x < 7; x++) {
        if (bits & (64 >> x)) s.box(left + x * 2, 82 + y * 2, 2, 2, 0);
      }
    });
    left += 18;
  }
}

function printColumn(s, x, y, width, count) {
  for (let row = 0; row < count; row++) {
    const baseline = y + row * 4;
    for (let word = 0; word < width - 4;) {
      const size = 2 + (row * 13 + word * 7 + x) % 5;
      s.box(x + word, baseline, Math.min(size, width - word), 1, 0);
      if (word % 6 === 0) s.box(x + word, baseline + 1, 2, 1, 8);
      word += size + 2;
    }
  }
}

function paperStack(s, width, top, height) {
  s.box(4, top, width - 8, height, 7);
  s.frame(6, top + 3, width - 4, height, 15, 7, 8);
  s.frame(9, top + 7, width - 5, height, 15, 15, 0);
  s.box(10, top + 10, width - 7, 1, 7);
}

function sectionTab(s, area, label, active = false) {
  const [x, y, w, h] = area;
  s.frame(x, y, w, h, active ? 15 : 7, 15, 8);
  s.center(label, x + Math.floor(w / 2), y + Math.floor((h - 7) / 2), 0);
}

export function paintNewspaper(s, view, paintCar) {
  const mode = view.mode || (view.scene === 'parts' ? 'parts' : 'cars');
  const parts = mode === 'parts';
  s.box(0, 0, 320, 200, 0);
  if (mode === 'cover') {
    const date = campaignDate(view.hours);
    paperStack(s, 248, 3, 53);
    paperStack(s, 278, 34, 51);
    paperStack(s, 313, 68, 111);
    s.center('AUTO PARTS', 130, 19, 0, 2);
    s.center('USED CARS', 144, 49, 0, 2);
    nameplate(s);
    s.box(14, 110, 297, 1, 8);
    s.center(`${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`, 160, 115, 0);
    s.text('10 CENTS', 253, 115, 0);
    s.box(14, 126, 297, 1, 0);
    s.center('SUMMER RACING SEASON OPENS', 160, 132, 0);
    for (const column of [16, 91, 165, 239]) printColumn(s, column, 145, 66, 8);
    sectionTab(s, NEWSPAPER_HOTSPOTS.cover.garage, 'Garage');
    periodStatus(s, view, 'Select a section');
    return;
  }

  const tabs = NEWSPAPER_HOTSPOTS.listings;
  s.frame(4, 4, 312, 179, 15, 7, 8);
  sectionTab(s, tabs.cover, 'Front page');
  sectionTab(s, tabs.cars, 'Used cars', !parts);
  sectionTab(s, tabs.parts, 'Auto parts', parts);
  sectionTab(s, tabs.garage, 'Garage');
  printColumn(s, 8, 38, 39, 34);
  printColumn(s, 272, 38, 39, 34);
  s.box(49, 35, 1, 144, 8);
  s.box(269, 35, 1, 144, 8);

  const page = view.page ?? 0;
  const source = parts ? AFTERMARKET : CAR_LIST;
  const pageCount = view.pageCount ?? Math.ceil(source.length / PAGE_SIZE);
  const listings = view.listings || source.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const showCar = view.model && !parts;
  s.center(parts ? 'PARTS AND ACCESSORIES' : 'USED CAR CLASSIFIEDS', 160, 36, 0);
  if (showCar) {
    s.frame(55, 48, 210, 91, 8, 0, 0);
    paintCar(s, view.model, null, 66, 66, 0.79);
    s.center(view.model.name.slice(0, 34), 160, 145, 0);
    s.center(`$${view.model.price}  /  ${view.model.hp} HP`, 160, 158, 0);
  } else {
    listings.slice(0, PAGE_SIZE).forEach((item, index) => {
      const [x, y, w] = NEWSPAPER_HOTSPOTS.listing[index];
      s.line(x, y, x + w - 1, y, 7);
      s.text(item.name.slice(0, 34), x + 4, y + 4, 0);
      s.text(`$${item.price}`, x + 4, y + 14, 8);
      if (parts && item.slot) s.text(item.slot, x + 67, y + 14, 8);
      if (!parts && Number.isFinite(item.hp)) s.text(`${item.hp} HP`, x + 67, y + 14, 8);
    });
    if (!listings.length) s.center('NO LISTINGS', 160, 95, 8);
    if (page > 0) sectionTab(s, [7, 98, 41, 18], 'Prev');
    if (page < pageCount - 1) sectionTab(s, [272, 98, 41, 18], 'Next');
  }
  periodStatus(s, view, showCar ? 'Make an offer' : `Page ${pageCount ? page + 1 : 0} / ${pageCount}`);
}

function calendarCell(s, date, current, column, row, top) {
  const x = 97 + column * 21;
  const y = top + 12 + row * 8;
  if (date === START - 8 * HOUR || date === START + DEADLINE * HOUR) {
    s.ellipse(x, y + 3, 9, 5, 5);
    s.ellipse(x, y + 3, 8, 4, 15);
  }
  if (date === current) {
    s.line(x - 7, y - 1, x + 7, y - 1, 4);
    s.line(x - 7, y + 7, x + 7, y + 7, 4);
    s.box(x - 7, y, 1, 7, 4);
    s.box(x + 7, y, 1, 7, 4);
  }
  s.center(String(new Date(date).getUTCDate()), x, y, column === 0 || date === current ? 4 : 0);
}

function calendarGrid(s, year, month, current, top) {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startColumn = first.getUTCDay();
  s.text(MONTHS[first.getUTCMonth()].slice(0, 3), 79, top, 0);
  for (const [column, day] of [...'SMTWTFS'].entries()) s.center(day, 97 + column * 21, top, column === 0 ? 4 : 8);
  s.line(78, top + 8, 241, top + 8, 8);
  for (let day = 1; day <= days; day++) {
    const square = startColumn + day - 1;
    calendarCell(s, Date.UTC(year, month, day), current, square % 7, Math.floor(square / 7), top);
  }
}

export function paintCalendar(s, view, paintCar) {
  const date = campaignDate(view.hours);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const current = Date.UTC(year, month, date.getUTCDate());
  s.box(76, 10, 175, 176, 0);
  s.frame(73, 7, 174, 178, 8, 15, 0);
  s.frame(76, 10, 168, 172, 15, 7, 0);
  calendarGrid(s, year, month, current, 14);
  s.frame(79, 74, 162, 43, 3, 8, 0);
  s.box(80, 103, 160, 13, 6);
  s.line(80, 103, 239, 103, 14);
  for (const [x, y] of [[88, 80], [99, 85], [205, 83], [224, 80]]) {
    s.box(x, y, 13, 1, 11);
    s.box(x + 2, y - 1, 6, 1, 15);
  }
  paintCar(s, CARS.chevy40, {color: 12}, 96, 75, 0.54);
  calendarGrid(s, year, month + 1, current, 122);
  periodStatus(s, view, 'School starts September 15');
}

function parkedCar(s, x, y, color, light) {
  s.ellipse(x + 37, y + 28, 39, 3, 0);
  s.poly([[x, y + 21], [x + 4, y + 14], [x + 12, y + 13], [x + 20, y + 1],
    [x + 52, y], [x + 63, y + 13], [x + 72, y + 15], [x + 76, y + 21],
    [x + 72, y + 28], [x + 3, y + 28]], color);
  s.poly([[x + 17, y + 13], [x + 23, y + 3], [x + 50, y + 2], [x + 58, y + 13]], 0);
  s.line(x + 23, y + 3, x + 50, y + 2, 7);
  s.line(x + 7, y + 17, x + 70, y + 17, light);
  s.box(x + 3, y + 23, 70, 2, 8);
  s.box(x + 4, y + 22, 68, 1, 15);
  for (const side of [7, 57]) {
    s.box(x + side, y + 18, 12, 4, 4);
    s.box(x + side, y + 18, 12, 1, 12);
  }
  s.frame(x + 30, y + 21, 14, 5, 7, 15, 0);
  s.box(x + 9, y + 26, 9, 3, 0);
  s.box(x + 58, y + 26, 9, 3, 0);
}

function dinerPatron(s, x, y, hair, shirt) {
  s.ellipse(x, y + 3, 4, 4, hair);
  s.box(x - 2, y + 3, 5, 4, 6);
  s.box(x, y + 4, 2, 2, 12);
  s.poly([[x - 5, y + 8], [x + 4, y + 8], [x + 8, y + 15], [x - 8, y + 15]], shirt);
  s.box(x + 1, y + 9, 1, 4, 15);
}

function dinerCaller(s) {
  dinerPatron(s, 249, 93, 0, 15);
  s.poly([[244, 107], [248, 106], [253, 108], [251, 127], [245, 136], [240, 136], [243, 125]], 3);
  s.line(246, 110, 245, 126, 11);
  s.line(249, 121, 253, 134, 1);
  s.line(250, 121, 254, 133, 3);
  s.line(244, 104, 239, 111, 6);
  s.line(253, 102, 258, 108, 12);
  s.line(258, 108, 253, 114, 6);
  s.box(238, 136, 8, 2, 15);
  s.box(252, 134, 6, 2, 7);
}

export function paintDriveIn(s, view, paintCar) {
  const model = view.model || CARS[view.rival?.model] || CARS.chevy40;
  s.box(0, 0, 320, 200, 0);
  s.noise(0, 3, 320, 39, 82, [0, 0, 8, 7], 3103);
  s.poly([[0, 44], [28, 38], [292, 38], [320, 45], [320, 65], [0, 65]], 4);
  for (const y of [43, 48, 53, 57, 61]) s.box(0, y, 320, 1, y % 3 === 0 ? 6 : 12);
  // The original diner has a vivid layered EGA neon fascia, not flat text.
  s.center("BOB'S DRIVE-IN", 162, 28, 0, 3);
  s.center("BOB'S DRIVE-IN", 161, 26, 5, 3);
  s.center("BOB'S DRIVE-IN", 160, 24, 13, 3);
  for(let x=6;x<316;x+=12){
    s.box(x,35,6,1,x%3?14:13);
    s.box(x+1,38,3,1,15);
  }
  for(const x of [12,308]){
    s.line(x,37,x,59,5);
    s.box(x-2,36,5,3,13);
    s.box(x-3,59,7,2,14);
  }
  s.box(0, 63, 320, 3, 13);
  s.box(0, 66, 320, 2, 5);
  // Period checkerboard fringe under the bright marquee and bulbs.
  for(let row=0;row<3;row++)for(let x=0;x<320;x+=5)
    s.box(x,68+row*2,5,2,((x/5+row)&1)?0:15);
  for (let x = 4; x < 320; x += 12) {
    s.box(x, 64, 3, 1, 15);
    s.box(x+1, 62, 1, 1, 14);
  }
  s.box(1, 70, 318, 44, 7);

  for (const x of [3, 83, 163, 243]) {
    s.frame(x + 2, 69, 74, 37, 14, 6, 0);
    s.box(x + 7, 72, 64, 18, 15);
    s.box(x + 7, 72, 64, 3, 14);
    s.box(x + 14, 78, 55, 1, 14);
    // Lit lunch counter, stools and soft-drink cups behind the patrons.
    s.box(x+9,92,61,3,7);
    s.box(x+11,95,57,2,0);
    for(const cx of [x+17,x+42,x+58]){
      s.box(cx,87,4,5,15);
      s.box(cx+1,88,2,3,12);
      s.line(cx+2,86,cx+4,82,7);
    }
    dinerPatron(s, x + 21, 80, 4, 3);
    dinerPatron(s, x + 49, 82, 0, x % 3 ? 2 : 4);
    for (let n = 0; n < 33; n++) {
      s.box(x + 5 + n * 2, 96 + (n % 2) * 2, 2, 2, 0);
    }
    s.box(x, 106, 78, 2, 15);
    s.box(x, 108, 78, 2, 8);
  }
  s.box(151, 72, 21, 9, 4);
  s.center('EAT', 161, 73, 14);
  s.box(0, 113, 320, 13, 8);
  s.noise(0, 116, 320, 27, 360, [0, 8, 8, 7], 521);
  parkedCar(s, 8, 106, 2, 10);
  parkedCar(s, 269, 106, 4, 12);
  for (const x of [1, 78, 158, 237, 316]) {
    s.box(x, 68, 4, 73, 3);
    s.line(x, 69, x, 139, 11);
    s.line(x + 3, 70, x + 3, 140, 1);
  }
  dinerCaller(s);
  s.box(0, 145, 320, 42, 8);
  s.noise(0, 154, 320, 32, 263, [0, 8, 7], 403);
  // Neon reflections in the damp blacktop, aligned with the diner windows.
  for(const x of [25,105,184,266]){
    s.line(x,147,x-6,154,5);
    s.line(x+3,152,x-1,157,13);
    s.line(x-8,165,x+5,165,7);
  }
  const ownCar = view.car?.model === model.id && !view.rival ? view.car : null;
  paintCar(s, model, ownCar, 51, 101, 0.92);
  // Ground reflections and a chrome bumper glint anchor the opponent car.
  s.line(87,171,274,171,0);
  s.line(108,173,246,173,7);
  s.line(117,175,212,175,8);
  s.box(0, 170, 320, 2, 0);
  s.box(0, 172, 320, 2, 15);
  s.box(0, 174, 320, 2, 7);
  s.box(0, 178, 320, 2, 0);
  s.box(0, 181, 320, 2, 7);
  s.line(84, 180, 259, 180, 15);
  s.ellipse(19, 181, 14, 4, 0);
  s.ellipse(19, 179, 10, 4, 8);
  s.ellipse(19, 176, 6, 3, 7);
  s.line(14, 175, 23, 175, 15);

  const menu = view.menuItems || [];
  // The original used a little pop-up offer board in front of the diner.
  if(menu.length){
    s.frame(20,36,104,15,8,15,0);
    s.center('RACE OFFER',72,40,14);
  }
  menu.slice(0, DRIVE_IN_HOTSPOTS.menu.length).forEach((item, index) => {
    const [x, y, w, h] = DRIVE_IN_HOTSPOTS.menu[index];
    s.frame(x, y, w, h, item.active ? 14 : 7, 15, 8);
    s.center(item.label.slice(0, 15), x + Math.floor(w / 2), y + 5, item.disabled ? 8 : 0);
  });
  const left = menu.length ? 126 : 106;
  const bubbleWidth = 302 - left;
  s.poly([[left + 12, 66], [left + 39, 67], [left + 55, 90], [left + 16, 75]], 3);
  s.poly([[left + 15, 65], [left + 36, 65], [left + 44, 83], [left + 23, 72]], 15);
  s.frame(left, 51, bubbleWidth, 20, 3, 11, 1);
  s.box(left + 3, 54, bubbleWidth - 6, 13, 15);
  const quote = view.rival?.line || 'Pick a driver';
  s.center(quote.slice(0, Math.floor((bubbleWidth - 12) / 6)), left + Math.floor(bubbleWidth / 2), 57, 0);
  periodStatus(s, view, view.rival?.name || 'Drive-in');
}

export function paintTrafficTicket(s, view) {
  const outcome = view.race?.result?.outcome;
  if (outcome !== 'police20' && outcome !== 'police75') return;
  const amount = outcome === 'police20' ? 20 : 75;
  const description = outcome === 'police20' ? 'Pulled over' : 'Patrol stop';
  const vehicle = view.model?.name || CARS[view.car?.model]?.name || 'Hot Rod';
  const makeBreak = vehicle.length > 22 ? vehicle.lastIndexOf(' ', 22) : -1;
  s.box(90, 14, 154, 142, 0);
  s.frame(87, 11, 154, 141, 15, 7, 8);
  s.frame(90, 14, 148, 135, 15, 0, 0);
  s.center('SPEEDING TICKET', 164, 19, 0);
  s.box(94, 29, 140, 1, 0);
  s.center('LOS ANGELES', 164, 34, 8);
  s.ellipse(164, 54, 10, 9, 8);
  s.ellipse(164, 54, 8, 7, 15);
  s.poly([[164, 47], [166, 52], [171, 52], [167, 55], [168, 60], [164, 57],
    [160, 60], [161, 55], [157, 52], [162, 52]], 8);
  s.text('OFFICIAL', 95, 45, 8);
  s.text('NOTICE', 101, 54, 8);
  s.text('OFFICIAL', 184, 45, 8);
  s.text('NOTICE', 190, 54, 8);
  for (const y of [66, 104, 119, 132]) s.line(94, y, 234, y, 8);
  s.text('VEHICLE', 96, 71, 8);
  s.text(makeBreak > 0 ? vehicle.slice(0, makeBreak) : vehicle.slice(0, 22), 96, 83, 0);
  if (makeBreak > 0) s.text(vehicle.slice(makeBreak + 1, makeBreak + 23), 96, 93, 0);
  s.text(description, 96, 109, 0);
  s.text('FINE', 96, 123, 8);
  s.text(`$${amount}`, 209, 123, 4);
  s.center('PAYABLE AT STOP', 164, 138, 8);

  s.poly([[25, 84], [41, 67], [59, 61], [87, 63], [109, 57], [117, 61], [116, 66],
    [86, 75], [81, 86], [63, 93], [49, 98], [30, 94]], 0);
  s.poly([[29, 85], [43, 69], [58, 65], [81, 66], [109, 59], [114, 62], [111, 65],
    [84, 74], [77, 84], [63, 90], [54, 93], [37, 93]], 8);
  s.line(43, 70, 61, 66, 7);
  s.line(69, 69, 100, 64, 7);
  s.line(54, 78, 74, 80, 0);
  s.line(49, 84, 64, 86, 0);
  periodStatus(s, view, `Speeding fine $${amount}`);
}
