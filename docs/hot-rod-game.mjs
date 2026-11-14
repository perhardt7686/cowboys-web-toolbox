import {button as makeButton, el, preference} from './family-board-core.mjs?v=family3';
import {getAvatarPhoto} from './family-avatar-cache.mjs?v=stable1';
import {activeCar, carOffer, carSpec, challengeProblem, dateLabel, gasCost, matches, repairCost, roadProblem, saleValue} from './hot-rod-campaign.mjs';
import {BOLTS, CAR_LIST, CARS, COLORS, DOLLARS, FUEL_TANK, MAKES, PART_LIST, PARTS, RIVALS,
  SLOT_NAMES, SLOTS, WAGERS, WHEELS, fullBolts, isWheel} from './hot-rod-catalog.mjs';
import {paintScene, workbenchFasteners} from './hot-rod-art.mjs?v=classic1';
import {createRace, displaySpeed, raceClock, recordInput, stepRace, STEP} from './hot-rod-racing.mjs';
import {connectDrivingInput} from './hot-rod-input.mjs';

const cash = amount => '$' + Number(amount).toLocaleString('en-US');
const time = ms => ms === null || ms === undefined ? '—' : (ms / 1000).toFixed(2) + ' s';
const memberBadge = name => el('span','hot-rod-avatar',(name || 'Family driver').slice(0,2).toUpperCase());
const garageSlots = {engine:'Cylinder block',manifold:'Intake manifold',carb:'Carburetor',gearbox:'Gearbox'};
const endings = {champion:'King of the road',deadline:'School starts today',broke:'Out of money',jail:'The summer ends in jail'};
const playoff = {finish:'Time recorded',win:'Victory',loss:'Second place',false_start:'False start',crash:'Wrecked',engine:'Engine failure',
  gearbox:'Transmission failed',fuel:'Out of fuel',police20:'Stopped by patrol',police75:'Caught by patrol',abandoned:'Forfeited'};
const canvasLabels = {boot:'DOS startup',title:'Hot Rod title, a coupe at dusk',garage:'Garage with interactive tools and car',
  paper:'Newspaper classifieds',workbench:'Close-up on a mechanical part',diner:'Bob’s Drive-In',fuel:'Gus’s Gas',
  race:'First-person view with instruments and the road ahead',ending:'End of summer',crew:'Garage club',
  standings:'Hot Rod Hall of Fame'};

function audio(bus) {
  let context, oscillator, gain, ready = false, muted = false, melody;
  function play() {
    if (muted) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!context && Audio) {
        context = new Audio();
        oscillator = context.createOscillator();
        gain = context.createGain();
        oscillator.type = 'square';
        gain.gain.value = 0;
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
      }
      if (context) {
        ready = true;
        void context.resume().catch(() => {});
      }
    } catch {}
  }
  function tone(frequency, volume) {
    if (!ready || !context) return;
    const now = context.currentTime;
    oscillator.frequency.setTargetAtTime(frequency, now, 0.04);
    gain.gain.setTargetAtTime(muted ? 0 : volume, now, 0.04);
  }
  function radio() {
    clearInterval(melody);
    if (muted || !ready) return;
    const notes = [196,233,262,277,262,233,196,165,174,196,233,262,293,262,233,196];
    let index = 0;
    melody = setInterval(() => tone(notes[index++ % notes.length], 0.018), 176);
  }
  return {
    setMuted(value) {
      muted = value;
      if (muted) { clearInterval(melody); tone(60,0); } else play();
      bus.setAttribute('aria-pressed', String(!muted));
      bus.textContent = muted ? 'Sound off' : 'Sound on';
    },
    play, radio, tone,
    silence() { clearInterval(melody); tone(60,0); },
    close() { clearInterval(melody); if (context) void context.close().catch(() => {}); }
  };
}

class RequestError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export function makeHotRod({client, memberId, launcher}) {
  const dialog = el('dialog', 'hot-rod-monitor');
  dialog.setAttribute('aria-labelledby','hot-rod-title');
  const housing = el('div','hot-rod-housing');
  const header = el('header','hot-rod-header');
  const title = el('h2','','Hot Rod');
  title.id = 'hot-rod-title';
  const soundButton = makeButton('Sound off', () => {
    soundEnabled = !soundEnabled;
    preference('hot-rod-sound', soundEnabled ? 'on' : 'off');
    speaker.setMuted(!soundEnabled);
    if (soundEnabled && radio && scene === 'garage') speaker.radio();
  });
  const quit = makeButton('Back to games', () => close());
  const globalButtons = el('div','hot-rod-top-actions');
  globalButtons.append(soundButton, quit);
  header.append(title, globalButtons);

  const stat = el('div','hot-rod-bank');
  const screen = el('div','hot-rod-screen');
  const art = el('canvas','hot-rod-canvas');
  art.width = 320;
  art.height = 200;
  art.setAttribute('role','img');
  const hotspots = el('div','hot-rod-hotspots');
  screen.append(art,hotspots);
  const consolePanel = el('div','hot-rod-panel');
  const status = el('p','hot-rod-status');
  status.setAttribute('role','status');
  const tabs = el('nav','hot-rod-tabs');
  tabs.setAttribute('aria-label','Hot Rod rooms');
  const racePanel = el('div','hot-rod-driver');
  racePanel.tabIndex = 0;
  racePanel.hidden = true;
  racePanel.setAttribute('aria-label','Driving controls');
  const meters = el('div','hot-rod-meters');
  const leftPad = el('div','hot-rod-pad');
  const rightPad = el('div','hot-rod-pad');
  const middlePad = el('div','hot-rod-pad hot-rod-shifts');
  function pad(label, name) {
    const control = makeButton(label, () => {});
    control.dataset.drive = name;
    return control;
  }
  leftPad.append(pad('◀ Left','left'),pad('Right ▶','right'));
  middlePad.append(pad('− Gear','down'),pad('Clutch','clutch'),pad('+ Gear','up'));
  rightPad.append(pad('Brake','brake'),pad('Gas','gas'));
  const pads = el('div','hot-rod-pads');
  pads.append(leftPad,middlePad,rightPad);
  const raceOptions = el('div','hot-rod-row hot-rod-race-actions');
  const pauseButton = makeButton('Pause', togglePaused);
  const forfeitButton = makeButton('Forfeit race', () => {
    paused = true;
    input.clear();
    speaker.silence();
    showForfeit = true;
    renderRace();
  });
  raceOptions.append(pauseButton,forfeitButton);
  const raceDetails = el('div','hot-rod-race-details');
  racePanel.append(meters,pads,raceOptions,raceDetails);
  housing.append(header, stat, screen, racePanel, consolePanel, status, tabs);
  dialog.append(housing);
  document.body.append(dialog);

  const abort = new AbortController();
  let scene = 'title', state = null, revision = 0, busy = false, loaded = false, alive = true;
  let problem = '', message = '', retry = null, race = null, duel = null, inputLog = [], frame = 0, tickTime = 0, lag = 0;
  let paused = false, staged = false, showForfeit = false, finishing = false, radio = false, submitted = false;
  let soundEnabled = preference('hot-rod-sound') === 'on';
  let paperMode = 'cars', paperPage = 0, listing = null, selectedSlot = 'carb', bayMode = 'work';
  let workmanship = false, selectedRival = RIVALS[0], raceType = 'drag', wager = 'kicks';
  let negotiating = false, crew = null, focusedMember = null, standings = null, fetchingScores = false, fetchingCrew = false;
  let confirmNew = false, bootTimer = 0, panelName = '', crewError = '', scoreError = '';
  const input = connectDrivingInput(racePanel, () => dialog.open && !!race && !paused && !staged && !finishing && !race.result);
  const speaker = audio(soundButton);
  speaker.setMuted(!soundEnabled);

  function select(label, values, current, changed) {
    const field = el('label','hot-rod-field',label);
    const menu = el('select');
    for (const [value, caption] of values) {
      const item = el('option','',caption);
      item.value = value;
      menu.append(item);
    }
    menu.value = current;
    menu.addEventListener('change', () => changed(menu.value));
    field.append(menu);
    return field;
  }

  function action(label, handler, {disabled = false, accent = false, title: hint = '', focus = ''} = {}) {
    const node = makeButton(label, handler);
    node.disabled = disabled;
    if (accent) node.classList.add('hot-rod-primary');
    if (hint) node.title = hint;
    if (focus) node.dataset.hotRodFocus = focus;
    return node;
  }
  const row = (...nodes) => { const host = el('div','hot-rod-row'); host.append(...nodes); return host; };
  const copy = text => el('p','hot-rod-copy',text);
  const heading = text => el('h3','',text);

  function hotspot(label, x, y, w, h, activate, key = '') {
    const node = action(label, activate, {focus:key});
    node.classList.add('hot-rod-hotspot');
    for (const [name,value] of Object.entries({left:x / 320 * 100,top:y / 200 * 100,
      width:w / 320 * 100,height:h / 200 * 100})) node.style[name] = value + '%';
    node.title = label;
    node.setAttribute('aria-label', label);
    hotspots.append(node);
    return node;
  }

  function artView() {
    const car = activeCar(state);
    const currentMemberCar = memberCar();
    return {
      scene:scene === 'crew' && currentMemberCar ? 'garage' : scene === 'clip' ? 'garage' :
        scene === 'clock' || scene === 'calendar' || scene === 'body' ? 'garage' :
        scene === 'standings' || scene === 'crew' ? 'title' : scene,
      car:scene === 'crew' && focusedMember ? currentMemberCar :
        scene === 'paper' || scene === 'diner' ? null : car,
      model:scene === 'paper' ? CARS[listing] : scene === 'diner' ? CARS[selectedRival.model] :
        scene === 'crew' && currentMemberCar ? CARS[currentMemberCar.model] : CARS[car?.model],
      slot:selectedSlot, race, status:state?.status, rival:selectedRival, title:'Hot Rod',
      page:paperPage, mode:paperMode, radio
    };
  }

  function show(next) {
    if (!dialog.open) return;
    if (scene === 'race' && race && !race.result && !staged) return;
    scene = next;
    if (next !== 'clip') workmanship = false;
    problem = '';
    if (next !== 'garage') speaker.silence();
    else if (radio && soundEnabled) speaker.radio();
    render();
    if (next === 'standings') void refreshScores();
    if (next === 'crew') void refreshCrew();
  }

  async function request(body) {
    const {data, error} = await client.functions.invoke('hot-rod', {body});
    if (error) {
      const status = error.context?.status || 0;
      let explanation;
      try { explanation = (await error.context?.json())?.error; } catch {}
      throw new RequestError(explanation || 'Can’t reach the Hot Rod save service. Try again.', status);
    }
    return data;
  }

  function panel(text, ...items) {
    panelName = text;
    consolePanel.append(heading(text), ...items);
  }

  async function load() {
    if (busy || !alive) return;
    busy = true;
    problem = '';
    render();
    try {
      const reply = await request({type:'load'});
      if (!alive || !dialog.open) return;
      state = reply.state;
      revision = reply.revision;
      loaded = true;
      retry = null;
    } catch (error) {
      if (alive) problem = error.message;
    } finally {
      busy = false;
      if (alive && dialog.open) render();
    }
  }

  async function mutate(type, values = {}, after, existing = null) {
    if (busy || !alive || !dialog.open) return;
    const body = existing || {type, ...values, revision, operation:crypto.randomUUID()};
    busy = true;
    problem = '';
    retry = null;
    render();
    try {
      const data = await request(body);
      if (!alive || !dialog.open) return;
      if (Object.hasOwn(data,'revision')) {
        state = data.state;
        revision = data.revision;
      }
      message = data.message || '';
      after?.(data);
      if (['finish','forfeit','duel-finish','duel-forfeit'].includes(type)) {
        document.dispatchEvent(new Event('family-hot-rod-race-saved'));
      }
      return data;
    } catch (error) {
      if (!alive || !dialog.open) return;
      problem = error.message;
      if (error.status === 409 && !race) {
        retry = () => load();
      } else if (error.status === 409 && race?.result && !duel) {
        retry = async () => {
          const id = race?.contract.id;
          await load();
          if (state?.last?.id === id) { submitted = true; problem=''; render(); }
          else if (state?.race?.id === id) { retry = () => mutate(type,values,after); }
          else { race = null; show('title'); }
          render();
        };
      } else if (!error.status || error.status >= 500 || error.status === 429) {
        retry = () => mutate(type, values, after, body);
      }
    } finally {
      busy = false;
      if (alive && dialog.open) render();
    }
  }
  const doWork = (type, values, after) => () => void mutate(type, values, after);
  function work(slot) {
    selectedSlot = slot;
    bayMode = 'work';
    show('workbench');
  }

  function renderTitle() {
    if (!loaded) {
      panel('Classic 1963',copy(busy ? 'Loading your garage…' : 'From the classifieds to Bob’s Drive-In.'),
        action('Try again', load, {disabled:busy,accent:true}));
      return;
    }
    const start = action(state ? 'Continue Classic 1963' : 'Start Classic 1963', () => {
      if (state) { show(state.status === 'summer' ? 'garage' : 'ending'); return; }
      void mutate('new',{},() => show('paper'));
    }, {accent:true, disabled:busy});
    const secondary = row(action('Family garages & challenges', () => show('crew')),
      action('Hall of Fame', () => show('standings')), action('Cowboy Remix', remix));
    panel('Classic 1963',copy('An unofficial homage to the 1989 DOS game. Buy a car, build it, and take on The King.'),
      state?.race ? action('Resume pending race', () => prepareRace(state.race), {accent:true}) : start,
      secondary);
  }

  function renderGarage() {
    const car = activeCar(state), counts = state?.cars || [];
    hotspot('Hit the street',0,33,61,108, () => cruise());
    hotspot('Clock and save',133,21,38,37,() => show('clock'));
    hotspot('Wall calendar',276,38,43,39,() => show('calendar'));
    hotspot(radio ? 'Turn radio off' : 'Turn radio on',224,49,48,40,toggleRadio);
    hotspot('Vehicle clipboard',82,52,43,41,() => show('clip'));
    hotspot('Open newspaper',5,151,66,41,() => show('paper'));
    hotspot('Jack and wheels',95,154,54,39,() => work(WHEELS[0]));
    hotspot('Paint and bodywork',192,154,58,39,() => show('body'));
    hotspot('Fuel can',266,151,54,43,() => show('fuel'));
    if (car) {
      hotspot('Open the hood',223,98,75,41,() => work('carb'));
      hotspot('Transmission tunnel',144,110,68,43,() => work('gearbox'));
    }
    if (state?.race) {
      panel('Race waiting at the line',action('Resume race', () => prepareRace(state.race),{accent:true}),
        action('Forfeit pending race', () => { prepareRace(state.race); showForfeit = true; renderRace(); }));
      return;
    }
    const spec = car ? carSpec(car) : null;
    const issue = roadProblem(car);
    panel(car ? CARS[car.model].name : 'Your garage',
      copy(car ? [spec.hp + ' hp',Math.floor(car.fuel) / 10 + ' gal',issue || 'Ready for the road.'].join(' · ') :
        'The garage is empty. Pick up the newspaper to find your first car.'),
      row(action('Newspaper', () => show('paper'), {accent:!car}), action('Hit the street', cruise, {accent:!!car}),
        action('Under the hood', () => work('carb'), {disabled:!car}), action('Car info', () => show('clip'), {disabled:!car})),
      counts.length > 1 ? select('Garage bay',counts.map(item=>[item.number,CARS[item.model].name]),car.number,
        number => void mutate('select-car',{number:Number(number)})) : el('span'));
  }

  function openPaper(mode = paperMode) {
    paperMode = mode;
    listing = null;
    paperPage = 0;
    show('paper');
  }

  function renderPaper() {
    const car = activeCar(state);
    const listings = paperMode === 'cars' ? CAR_LIST :
      PART_LIST.filter(item => !item.stock && (!car || !item.make || item.make === CARS[car.model].make));
    const totalPages = Math.ceil(listings.length / 5);
    const back = action('Used cars', () => openPaper('cars'), {accent:paperMode === 'cars'});
    const parts = action('Auto parts', () => openPaper('parts'), {accent:paperMode === 'parts'});
    const navigation = row(back,parts,action('Garage',() => show('garage')));
    if (listing) {
      const model = CARS[listing];
      const detail = el('div','hot-rod-newspaper');
      detail.append(el('p','',MAKES[model.make] + ' · ' + model.hp + ' hp · ' + model.weight.toLocaleString() +
        ' lb · ' + model.wear + '% condition · ' + (model.auto ? 'Automatic' : '3-speed manual')));
      const offer = el('input');
      offer.type = 'number';
      offer.inputMode = 'numeric';
      offer.min = '1';
      offer.max = String(model.price);
      offer.value = String(model.price);
      const price = el('label','hot-rod-field','Your offer');
      price.append(offer);
      detail.append(row(price,action('Make offer', () => void mutate('buy-car',{id:model.id,offer:Number(offer.value)},() => show('garage')),
        {disabled:busy,accent:true}),action('Back to listings', () => { listing = null; render(); })));
      panel(model.name, navigation, detail);
      return;
    }
    const classified = el('ul','hot-rod-classifieds');
    for (const item of listings.slice(paperPage * 5,paperPage * 5 + 5)) {
      const itemRow = el('li');
      itemRow.append(action(item.name + ' · ' + cash(item.price), () => {
        if (paperMode === 'cars') { listing = item.id; render(); return; }
        void mutate('buy-part',{id:item.id});
      }, {disabled:paperMode === 'parts' && (busy || item.price > state?.cash),
        focus:'paper-' + item.id}));
      if (paperMode === 'parts') itemRow.append(el('small','',item.slot === 'tire' ? 'Each tire' : garageSlots[item.slot]));
      else itemRow.append(el('small','',item.wear + '% · ' + (item.auto ? 'Automatic' : 'Manual') + ' · ' +
        (carOffer(item) <= state?.cash ? 'Within your budget' : 'Above your budget')));
      classified.append(itemRow);
    }
    const paging = row(action('‹ Previous',() => {paperPage--;render();},{disabled:paperPage===0,focus:'paper-prev'}),
      el('span','',(paperPage + 1) + ' / ' + totalPages),
      action('Next ›',() => {paperPage++;render();},{disabled:paperPage>=totalPages-1,focus:'paper-next'}));
    panel(paperMode === 'cars' ? 'Used car classifieds' : 'Auto parts classifieds',navigation,classified,paging);
  }

  function renderWorkbench() {
    const car = activeCar(state);
    if (!car) { panel('Workbench',copy('There’s no car in the bay.'),action('Newspaper',() => openPaper('cars')));return; }
    const slot = selectedSlot, item = car.installed[slot], bolts = car.bolts[slot], tire = isWheel(slot);
    const availableParts = state.inventory.map((part,index) => [part,index]).filter(([part]) => matches(car,slot,part.id));
    const mount = select('Work area',SLOTS.map(name=>[name,SLOT_NAMES[name]]),slot,value=>work(value));
    const choose = row(mount,action('Parts classifieds',() => openPaper('parts')),action('Garage',() => show('garage')));
    const toolRow = row(action('Wrench',() => {bayMode='work';render();},{accent:bayMode==='work'}),
      action('Spare parts',() => {bayMode='shelf';render();},{accent:bayMode==='shelf'}),
      action('Ignition timing',() => {bayMode='tune';render();},{accent:bayMode==='tune'}));
    if (bayMode === 'shelf') {
      const shelf = state.inventory.map((part,index) => row(
        el('span','',PARTS[part.id].name + ' · ' + part.wear + '%'),
        action('Sell',doWork('sell-part',{index}),{disabled:busy || PARTS[part.id].slot === 'tire'})
      ));
      panel('Parts shelf',choose,toolRow,...(shelf.length ? shelf : [copy('No spare parts. Try the classifieds.')]));
      return;
    }
    if (bayMode === 'tune') {
      const value = el('input');
      value.type = 'range';
      value.min = '0';
      value.max = '16';
      value.value = String(car.timing);
      const label = el('label','hot-rod-field','Distributor advance');
      const number = el('output','',value.value + '°');
      value.addEventListener('input',() => number.textContent = value.value + '°');
      label.append(value,number);
      const timing = PARTS[car.installed.engine?.id]?.timing;
      panel('Ignition timing',choose,toolRow,copy('Listen for a smooth idle. This block’s reference is ' + (timing ?? '—') + '°.'),
        row(label,action('Set timing',() => void mutate('tune',{value:Number(value.value)}),{disabled:busy,accent:true})));
      return;
    }
    const loose = item ? BOLTS[slot] - [...Array(BOLTS[slot]).keys()].filter(i=>bolts & (1 << i)).length : 0;
    const help = tire && car.jack !== slot ? 'Raise this corner before working on the lugs.' :
      !item ? 'Fit a compatible part from the shelf.' :
      slot === 'engine' && car.installed.manifold || slot === 'manifold' && car.installed.carb ?
        'Remove the part sitting above this one to reach its bolts.' :
        'Turn the ' + (tire ? 'lugs' : 'fasteners') + ' on the drawing or use the numbered wrench controls.';
    const mechanics = el('div','hot-rod-wrench');
    if (item) workbenchFasteners(slot).forEach(({x,y},index) => {
      const tight = !!(bolts & (1 << index));
      const label = (tight ? 'Loosen' : 'Tighten') + ' ' + (tire ? 'lug ' : 'bolt ') + (index + 1);
      const wrench = doWork('bolt',{slot,index});
      const isDisabled = busy || (tire && car.jack !== slot);
      if (!isDisabled) hotspot(label,x-13,y-13,26,26,wrench,'art-bolt'+index).classList.add('hot-rod-fastener',tight ? 'tight' : 'loose');
      mechanics.append(action(label,wrench,{disabled:isDisabled,focus:'bolt'+index}));
    });
    const controls = row(tire ? action(car.jack ? 'Lower jack' : 'Raise corner',doWork('jack',{slot}),{disabled:busy}) :
      action(car.ignition ? 'Disconnect ignition' : 'Connect ignition',doWork('ignition'),{disabled:busy}));
    if (item) controls.append(action('Remove ' + SLOT_NAMES[slot],doWork('remove',{slot}),
      {disabled:busy || bolts !== 0,accent:bolts === 0}));
    else for (const [part,index] of availableParts) controls.append(action('Fit ' + PARTS[part.id].name + ' · ' + part.wear + '%',
      doWork('install',{slot,index}),{disabled:busy,accent:true}));
    panel(item ? PARTS[item.id].name : SLOT_NAMES[slot],choose,toolRow,copy(help),
      item ? copy(item.wear + '% condition · ' + loose + ' loose') : copy(availableParts.length ? 'Choose a replacement below.' : 'No compatible spare on the shelf.'),
      mechanics,controls);
  }

  function renderClip() {
    const car = activeCar(state);
    if (!car) { panel('Vehicle clipboard',copy('The bay is empty.')); return; }
    const spec = carSpec(car);
    const list = el('dl','hot-rod-spec');
    for (const [label,value] of [
      ['Power',spec.hp + ' hp'],['Weight',spec.weight + ' lb'],['Tires',Math.round(spec.grip * 100) + '% grip'],
      ['Fuel',Math.round(car.fuel) / 10 + ' gal'],['Body condition',car.condition + '%'],
      ['Transmission',(spec.automatic ? 'Automatic' : 'Manual') + ' · ' + spec.ratios.length + ' speeds'],
      ...SLOTS.map(slot => [SLOT_NAMES[slot],car.installed[slot] ? PARTS[car.installed[slot].id].name + ' · ' + car.installed[slot].wear + '%' : 'Missing'])
    ]) list.append(el('dt','',label),el('dd','',value));
    panel(CARS[car.model].name, list, row(
      action(car.damage ? 'Scrap for ' + cash(saleValue(car,true)) : 'Sell for ' + cash(saleValue(car)), () => {
        workmanship = true; render();
      },{disabled:busy}),
      car.damage ? action('Repair for ' + cash(repairCost(car)),doWork('repair'),{disabled:busy}) : el('span'),
      action('Back to garage',() => { workmanship = false; show('garage'); })));
    if (workmanship) consolePanel.append(row(copy('Hand over this car?'),
      action('Confirm sale',doWork(car.damage ? 'scrap' : 'sell-car',{},() => { workmanship = false; show('garage'); }),{disabled:busy}),
      action('Keep the car',() => { workmanship=false;render(); })));
  }

  function renderBody() {
    const car = activeCar(state);
    if (!car) { panel('Body shop',copy('There’s no car to paint.'));return; }
    const colors = Object.entries(COLORS);
    const selectColor = select('Paint color',colors,String(car.color),() => {});
    const menu = selectColor.querySelector('select');
    panel('Paint and bodywork',
      row(selectColor,action('Paint · $35',() => void mutate('paint',{value:Number(menu.value)}),{disabled:busy})),
      row(action(car.roof ? 'Restore roof · $48' : 'Chop roof · $48',doWork('body',{slot:'roof'}),{disabled:busy}),
        action((car.front ? 'Strip' : 'Fit') + ' front bumper · $12',doWork('body',{slot:'front'}),{disabled:busy}),
        action((car.rear ? 'Strip' : 'Fit') + ' rear bumper · $12',doWork('body',{slot:'rear'}),{disabled:busy})),
      row(...['Bare paint','Shop stripe','Checkered flag','Lightning'].map((name,value)=>action(name+(value?' · $8':''),
        doWork('decal',{value}),{disabled:busy,accent:value===car.decal}))));
  }

  function renderClock() {
    panel('Garage clock',copy('Your campaign saves after every confirmed action.'),
      row(action('Back to garage',() => show('garage')),action('Save & exit',() => close()),
        action('Main menu',() => show('title')),action('Hall of Fame',() => show('standings'))));
  }

  function renderFuel() {
    const car = activeCar(state);
    if (!car) { panel('Gus’s Gas',copy('Bring a car to the pump.')); return; }
    const deficit = FUEL_TANK - car.fuel;
    panel('Gus’s Gas',copy((car.fuel / 10).toFixed(1) + ' of ' + FUEL_TANK / 10 + ' gallons · 32¢ per gallon'),
      row(action('Add 5 gallons · ' + cash(gasCost(Math.min(50,deficit))),doWork('fuel',{value:5}),{disabled:busy||!deficit}),
        action('Fill tank · ' + cash(gasCost(deficit)),doWork('fuel',{value:'full'}),{accent:true,disabled:busy||!deficit}),
        action('Garage',() => show('garage'))));
  }

  function cruise() {
    if (state?.race) { prepareRace(state.race); return; }
    const issue = roadProblem(activeCar(state), 7);
    if (issue) { problem=issue; render(); return; }
    void mutate('trip',{},() => show('diner'));
  }

  function chooseRival(id) {
    selectedRival = RIVALS.find(rival=>rival.id===id) || RIVALS[0];
    raceType = selectedRival.id === 'king' ? 'road' : 'drag';
    wager = selectedRival.id === 'king' ? 'pink' : 'kicks';
    negotiating = false;
    render();
  }

  function renderDiner() {
    const rival = selectedRival, model = CARS[rival.model];
    const requirements = state.dragWins < rival.drag || state.roadWins < rival.road;
    const wagerOptions = WAGERS[raceType].map(key => [key,key === 'kicks' ? 'For kicks' : key === 'pink' ? 'Pink slips' : cash(DOLLARS[key])]);
    const inspect = () => { negotiating = !negotiating; render(); };
    hotspot('Inspect rival engine',214,103,92,48,inspect);
    hotspot('Call another driver',13,35,64,65,() => consolePanel.querySelector('select')?.focus());
    const info = negotiating ? copy(model.name + ' · ' + model.hp + ' hp · ' + model.weight + ' lb · ' +
      (model.auto ? 'Automatic' : 'Manual transmission')) : copy(model.name + ' · “' + rival.line + '”');
    const blocked = challengeProblem(state,rival,raceType,wager);
    panel('Bob’s Drive-In',row(select('Call a driver',RIVALS.map(person=>[person.id,person.name +
      (state.beaten.includes(person.id) ? ' ✓' : '')]),rival.id,chooseRival),
      action('Inspect car',inspect,{focus:'inspect-rival'}),action('Garage',() => show('garage'))),info,
      requirements ? copy('Required wins: ' + rival.drag + ' drag · ' + rival.road + ' road.') : el('span'),
      row(select('Race',[['drag','¼-mile drag'],['road','2½-mile road']],raceType,value=>{
        raceType=value;wager=WAGERS[value][0];render();
      }),select('Wager',wagerOptions,wager,value=>{wager=value;render();}),
      action('Challenge ' + rival.name,() => void mutate('challenge',{rival:rival.id,kind:raceType,stake:wager},
        () => prepareRace(state.race)), {disabled:busy,accent:true})),
      blocked ? copy(blocked) : el('span'));
  }

  function renderCalendar() {
    panel('Summer calendar',copy(dateLabel(state.hours) + ' · School starts September 15.'),
      copy(state.dragWins + ' drag wins · ' + state.roadWins + ' road wins · ' + state.losses + ' losses'),
      row(action('Wait one day',doWork('rest'),{disabled:busy}),action('Garage',() => show('garage'))));
  }

  function toggleRadio() {
    radio = !radio;
    if (radio && soundEnabled) { speaker.play(); speaker.radio(); }
    else speaker.silence();
    message = radio ? 'Radio on.' : 'Radio off.';
    render();
  }

  function remix() {
    if (!document.getElementById('streetrod-root')) {
      problem = 'The original family garage is still connecting. Try again in a moment.';
      render();
      return;
    }
    close(true);
    document.dispatchEvent(new Event('hot-rod-remix'));
  }

  function renderEnding() {
    const crown = state.status === 'champion';
    const bonus = state.bonus;
    const achievementList = achievements();
    panel(endings[state.status] || 'Summer results',copy(state.wins + ' wins · ' + state.losses + ' losses · ' + state.points + ' career points earned this summer'),
      ...(crown ? [copy(bonus?.won ? 'You beat The King and the Mystery Machine.' :
        'The King’s title is yours. The Mystery Machine is waiting.'),row(
        bonus?.won ? el('span','hot-rod-achievement','Final boss defeated') :
        action('Challenge the Mystery Machine',() => void mutate('challenge',
          {rival:'mystery',kind:'road',stake:'kicks'}, () => prepareRace(state.race)),{accent:true,disabled:busy}),
        bonus?.bestMs ? el('span','','Mystery Machine best ' + time(bonus.bestMs)) : el('span'))] : []),
      row(...achievementList.map(badge=>el('span','hot-rod-achievement',badge))),
      row(action('Hall of Fame',() => show('standings')),
        action(confirmNew ? 'Confirm new summer' : 'Start another summer',() => {
          if (!confirmNew) { confirmNew=true;render();return; }
          void mutate('new',{},() => { confirmNew=false;openPaper('cars'); });
        },{disabled:busy}),action('Cowboy Remix',remix)));
  }

  function achievements() {
    const list = [];
    if (state?.dragWins) list.push('First drag win');
    if (state?.roadWins) list.push('First road win');
    if (state?.wins >= 10) list.push('Ten race wins');
    if (state?.status === 'champion') list.push('Classic champion');
    const career = standings?.entries?.find(entry => entry.mine);
    if (career?.duel_wins) list.push('First family challenge win');
    if (state?.bonus?.won) list.push('Mystery Machine defeated');
    return list;
  }

  function avatar(person) {
    const icon = memberBadge(person.name);
    const path = person.avatar_path;
    if (path) void getAvatarPhoto(client,path).then(url => {
      if (!url || !alive || !dialog.open || !icon.isConnected) return;
      const image = el('img');
      image.alt = '';
      image.width = image.height = 32;
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('load',() => icon.replaceChildren(image),{once:true});
      image.src = url;
    }).catch(() => {});
    if (person.avatar_member || person.id) icon.dataset.familyAvatar = person.avatar_member || person.id;
    icon.setAttribute('aria-hidden','true');
    return icon;
  }

  async function refreshScores() {
    if (fetchingScores) return;
    fetchingScores = true;
    scoreError = '';
    try {
      const {data,error} = await client.rpc('community_hot_rod_standings');
      if (error) throw new Error('Couldn’t refresh the Hall of Fame.');
      if (alive && dialog.open) standings = data;
    } catch (error) { scoreError = error.message; }
    finally {
      fetchingScores=false;
      if (alive && dialog.open && scene === 'standings') render();
    }
  }

  function renderStandings() {
    const records = el('ol','hot-rod-standings');
    for (const entry of standings?.entries || []) {
      const node = el('li');
      const name = el('strong','',entry.name + (entry.mine ? ' (you)' : ''));
      const info = el('div');
      const progress = ['Entered a race','Drag winner','Road winner','Top contender','Classic champion','Mystery Machine defeated'][entry.progress] ?? '';
      info.append(name,el('small','',entry.crowns+' crowns · '+entry.wins+' wins · '+entry.losses+' losses'),
        el('small','',progress + (entry.best_hours ? ' · Best crown ' + entry.best_hours + ' game hours' : '')),
        el('small','',(entry.mystery_wins || 0) + ' Mystery Machine wins · ' + (entry.duel_wins || 0) + ' member challenge wins'));
      node.append(el('b','','#'+entry.rank),avatar(entry),info,el('b','',entry.score+' pts'));
      records.append(node);
    }
    const milestones = row(...achievements().map(badge=>el('span','hot-rod-achievement',badge)));
    panel('Hall of Fame',copy('Ranked by Mystery Machine wins, Classic crowns, career points, fastest crown, then wins. Exact ties share a rank.'),
      standings?.entries?.length ? records : copy(scoreError || (fetchingScores ? 'Loading standings…' : 'No verified race results yet.')),
      milestones,row(action('Refresh',refreshScores,{disabled:fetchingScores}),action('Back',() => show(state ? state.status === 'summer' ? 'garage' : 'ending' : 'title'))));
  }

  async function refreshCrew() {
    if (fetchingCrew) return;
    fetchingCrew = true;
    crewError = '';
    try {
      const data = await request({type:'crew'});
      if (alive && dialog.open) {
        crew = data;
        focusedMember = crew.members?.find(person => person.id === focusedMember?.id) || null;
      }
    } catch (error) { crewError=error.message; }
    finally {
      fetchingCrew = false;
      if (alive && dialog.open && scene === 'crew') render();
    }
  }

  let inspectCarNumber = null, memberRaceType = 'drag';
  function showMember(person) {
    focusedMember = person;
    inspectCarNumber = person?.garage?.selected ?? person?.garage?.cars?.[0]?.number ?? null;
    render();
  }

  function memberCar() {
    return focusedMember?.garage?.cars?.find(car=>car.number === inspectCarNumber);
  }

  function renderCrew() {
    const people = el('ul','hot-rod-people');
    for (const person of crew?.members || []) {
      const item = el('li');
      item.append(avatar(person),action(person.name + (person.id === memberId ? ' (you)' : ''),() => showMember(person),{accent:focusedMember?.id===person.id}));
      people.append(item);
    }
    const list = el('ul','hot-rod-challenges');
    for (const duel of crew?.challenges || []) {
      const opponent = crew.members.find(person=>person.id===duel.opponent);
      const item = el('li');
      item.append(el('strong','',(opponent?.name || 'Family driver') + ' · ' + (duel.kind==='drag' ? 'Drag' : 'Road')),
        el('small','','Status: ' + (duel.status==='completed' ? duel.isTie ? 'Tied' : duel.winner===duel.you ? 'You won' : duel.winner ? 'Other driver won' : 'No clean finish' : duel.status)));
      if (duel.youResult || duel.theirResult) item.append(el('small','',
        'You ' + duelLabel(duel.youResult) + ' · Them ' + duelLabel(duel.theirResult)));
      if (duel.status==='pending' && duel.you===duel.challenged) {
        item.append(row(action('Accept',() => void mutate('respond',{challengeId:duel.id,accept:true},refreshCrew),{disabled:busy,accent:true}),
          action('Decline',() => void mutate('respond',{challengeId:duel.id,accept:false},refreshCrew),{disabled:busy})));
      } else if (duel.status==='accepted' && !duel.finished) {
        item.append(action(duel.started ? 'Resume your run' : 'Drive your run',() => void mutate('duel-start',{challengeId:duel.id},
          reply => prepareRace(reply.race,duel.id)),{accent:true,disabled:busy}));
      }
      list.append(item);
    }
    panel('Family garages',copy(crewError || (crew ? 'Pick a driver to see their cars or challenge them.' : 'Loading family garages…')),
      row(action('Refresh',refreshCrew,{disabled:fetchingCrew}),action('Back',() => show(state ? state.status === 'summer' ? 'garage' : 'ending' : 'title'))),
      people);
    if (focusedMember) {
      const person = focusedMember;
      const car = memberCar();
      const carList = person.garage?.cars || [];
      const inspect = carList.length > 1 ? select('Garage bay',carList.map(car=>[car.number,CARS[car.model].name]),
        inspectCarNumber,value=>{inspectCarNumber=Number(value);render();}) : el('span');
      consolePanel.append(heading(person.name + '’s garage'),inspect,
        car ? copy(CARS[car.model].name + ' · ' + car.hp + ' hp · ' + car.condition + '% condition · ' + (car.gearbox || 'Transmission out')) :
        copy('No Classic 1963 car in this garage.'),
        person.id === memberId ? el('span') :
          row(select('Challenge course',[['drag','¼-mile drag'],['road','2½-mile road']],memberRaceType,value=>memberRaceType=value),
            action('Send challenge',() => void mutate('invite',{memberId:person.id,kind:memberRaceType},refreshCrew),{disabled:busy,accent:true})));
    }
    consolePanel.append(heading('Member challenges'),copy('Drive your run when ready. Both drivers take the same course in their own cars.'),list);
  }

  function duelLabel(result) {
    if (!result) return 'waiting';
    return result.finished ? time(result.ms) : playoff[result.outcome] || 'incomplete';
  }

  function renderTabs() {
    const rooms = state ? [['garage','Garage'],['paper','Newspaper'],['crew','Family garages'],['standings','Hall of Fame']] :
      [['title','Main menu']];
    if (state && state.status !== 'summer') rooms.splice(0,2,['ending','Summer results']);
    tabs.replaceChildren(...rooms.map(([id,label]) => {
      const node = action(label,() => id==='paper' ? openPaper() : show(id),{disabled:busy});
      if (id===scene) node.setAttribute('aria-current','page');
      return node;
    }));
    tabs.hidden = scene === 'race' || scene === 'boot' || scene === 'title';
  }

  function render() {
    if (!alive || !dialog.open) return;
    const oldFocus = document.activeElement?.dataset?.hotRodFocus;
    if (state && scene !== 'title' && scene !== 'race' && scene !== 'boot') {
      if (state.status !== 'summer' && !['ending','crew','standings'].includes(scene)) scene = 'ending';
      if (state.status === 'summer' && state.race && !['garage','standings','crew'].includes(scene)) scene = 'garage';
    }
    dialog.dataset.scene = scene;
    housing.setAttribute('aria-busy',String(busy));
    screen.setAttribute('data-cursor',scene === 'workbench' ? 'wrench' : '');
    stat.textContent = state ? 'BANKROLL ' + cash(state.cash) + '   ' + dateLabel(state.hours).toUpperCase() : '';
    stat.hidden = !state || ['boot','title','race'].includes(scene);
    quit.disabled = busy;
    consolePanel.replaceChildren();
    hotspots.replaceChildren();
    racePanel.hidden = scene !== 'race';
    consolePanel.hidden = scene === 'race' || scene === 'boot';
    if (scene === 'race') {
      renderRace();
    } else {
      if (scene === 'boot') panelName='Loading';
      else if (scene === 'title') renderTitle();
      else if (scene === 'garage') renderGarage();
      else if (scene === 'paper') renderPaper();
      else if (scene === 'workbench') renderWorkbench();
      else if (scene === 'clip') renderClip();
      else if (scene === 'diner') renderDiner();
      else if (scene === 'fuel') renderFuel();
      else if (scene === 'body') renderBody();
      else if (scene === 'calendar') renderCalendar();
      else if (scene === 'clock') renderClock();
      else if (scene === 'ending') renderEnding();
      else if (scene === 'standings') renderStandings();
      else if (scene === 'crew') renderCrew();
      renderTabs();
      art.setAttribute('aria-label', canvasLabels[scene] || panelName);
      paintScene(art,artView());
    }
    paintStatus();
    if (oldFocus && document.activeElement === document.body) {
      dialog.querySelector('[data-hot-rod-focus="' + oldFocus + '"]')?.focus({preventScroll:true});
    }
  }

  function paintStatus() {
    status.replaceChildren();
    const label = problem || message;
    if (label) status.append(el('span','',label));
    if (retry) status.append(action('Retry save',retry,{disabled:busy,accent:true}));
    status.hidden = !label && !retry;
    status.classList.toggle('has-error',!!problem);
  }

  function prepareRace(contract, challengeId = null) {
    if (!contract) return;
    cancelAnimationFrame(frame);
    speaker.silence();
    input.clear();
    race = createRace(contract);
    duel = challengeId;
    inputLog = [];
    tickTime = 0;
    lag = 0;
    paused = false;
    finishing = false;
    submitted = false;
    staged = true;
    showForfeit = false;
    scene = 'race';
    render();
  }

  function getDrivingResult() {
    if (!duel) return state?.last;
    return null;
  }

  function renderRace() {
    if (!race) return;
    tabs.hidden = true;
    consolePanel.hidden = true;
    racePanel.hidden = false;
    raceDetails.replaceChildren();
    art.setAttribute('aria-label',canvasLabels.race);
    paintScene(art,artView());
    paintMeters();
    pads.hidden = staged || paused || !!race.result;
    raceOptions.hidden = staged || !!race.result;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    if (staged && !showForfeit) {
      const opponent = race.contract.rival === 'mystery' ? 'Mystery Machine' :
        RIVALS.find(person=>person.id===race.contract.rival)?.name || 'Family challenge';
      raceDetails.append(heading(opponent),copy(race.contract.kind==='drag' ? 'Quarter-mile drag' : 'Two and a half miles of winding road'),
        copy('Wait for green. Arrow keys steer, accelerate and brake. E / Q shift. Ease off the gas or use Shift for the clutch.'),
        row(action('Stage at the line',goRace,{accent:true,disabled:busy}),action('Forfeit race',()=>{showForfeit=true;renderRace();})));
    } else if (showForfeit) {
      const hasStake = !duel && !['kicks',undefined].includes(race.contract.stake);
      raceDetails.append(copy(hasStake ? 'Forfeit this run and lose the wager?' : 'Forfeit this run?'),row(
        action('Confirm forfeit',() => void submitRace(true),{disabled:busy,accent:true}),
        action('Keep racing',()=>{showForfeit=false;renderRace();})));
    } else if (finishing || race.result) {
      const outcome = race.result?.outcome;
      const receipt = getDrivingResult();
      raceDetails.append(heading(finishing ? 'Saving race result…' : playoff[outcome] || 'Race result'));
      if (!finishing && submitted) {
        raceDetails.append(copy(duel ? 'Your run is saved. The challenge settles after both drivers finish.' :
          (receipt?.points ? receipt.points + ' career points · ' : '') + time(race.result?.ms)),
          action(duel ? 'Back to challenges' : 'Continue',finishView,{accent:true}));
      }
    } else if (paused) {
      raceDetails.append(copy('Paused. Resume when you’re ready.'));
    }
    racePanel.classList.toggle('hot-rod-driving',!staged && !paused && !finishing && !race.result);
  }

  function goRace() {
    if (!race || !staged) return;
    staged = false;
    paused = false;
    if (soundEnabled) speaker.play();
    renderRace();
    racePanel.focus({preventScroll:true});
    tickTime = 0;
    frame = requestAnimationFrame(loop);
  }

  function paintMeters() {
    const data = race.player;
    const label = race.result ? (playoff[race.result.outcome] || 'Finish').toUpperCase() :
      race.tick < race.greenAt ? 'WAIT FOR GREEN' : race.patrolAt !== null ? 'POLICE · SLOW DOWN' :
      raceClock(race).toFixed(1) + ' s';
    meters.textContent = displaySpeed(data) + ' MPH · ' + Math.round(data.engine) + ' RPM · ' +
      (race.contract.player.automatic ? 'AUTO '+data.gear : 'GEAR '+(data.gear || 'N')) + ' · ' + label;
  }

  function loop(now) {
    if (!dialog.open || !race || staged || paused) return;
    if (tickTime) lag += Math.min(150, now - tickTime);
    tickTime = now;
    while (lag >= STEP * 1000 && !race.result) {
      lag -= STEP * 1000;
      const mask = input.read();
      stepRace(race,mask);
      recordInput(inputLog,mask);
    }
    paintScene(art,artView());
    paintMeters();
    if (soundEnabled) speaker.tone(race.patrolAt !== null ? 495 + Math.sin(now/137)*115 : race.player.engine/27,
      0.019 + race.player.slip*0.012);
    if (race.result) void submitRace();
    else frame = requestAnimationFrame(loop);
  }

  async function submitRace(forfeit = false) {
    if (!race || busy || finishing) return;
    const contract = race.contract;
    input.clear();
    speaker.silence();
    cancelAnimationFrame(frame);
    finishing = true;
    showForfeit = false;
    if (forfeit) race.result = {outcome:'abandoned',ms:0};
    const type = duel ? forfeit ? 'duel-forfeit' : 'duel-finish' : forfeit ? 'forfeit' : 'finish';
    const values = {raceId:contract.id, ...(duel ? {challengeId:duel} : {}),
      ...(forfeit ? {} : {inputs:inputLog})};
    await mutate(type,values,() => { finishing=false; submitted=true; });
    finishing = false;
    if (alive && dialog.open) render();
  }

  function finishView() {
    const wasDuel = !!duel;
    race = duel = null;
    inputLog = [];
    show(wasDuel ? 'crew' : state?.status === 'summer' ? 'garage' : 'ending');
  }

  function togglePaused() {
    if (!race || staged || race.result || finishing) return;
    if (showForfeit) showForfeit = false;
    paused = !paused;
    cancelAnimationFrame(frame);
    input.clear();
    speaker.silence();
    renderRace();
    if (!paused) {
      tickTime=0;
      racePanel.focus({preventScroll:true});
      frame=requestAnimationFrame(loop);
    }
  }

  function close(programmatic = false) {
    if (!dialog.open || (busy && !programmatic)) return;
    cancelAnimationFrame(frame);
    clearTimeout(bootTimer);
    speaker.silence();
    input.clear();
    race = duel = null;
    inputLog = [];
    state = null;
    loaded = false;
    crew = standings = focusedMember = null;
    dialog.close();
    document.documentElement.classList.remove('hot-rod-open');
    if (launcher.isConnected) launcher.focus({preventScroll:true});
  }

  dialog.addEventListener('keydown',event=>{
    if (event.key === 'Tab' && scene === 'race' && racePanel.classList.contains('hot-rod-driving') &&
        event.target?.closest('[data-drive]')) input.clear();
  },{signal:abort.signal});
  dialog.addEventListener('cancel',event=>{
    event.preventDefault();
    if (scene==='race' && race && !race.result && !staged) togglePaused();
    else close();
  },{signal:abort.signal});
  dialog.addEventListener('keydown',event=>{
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,select,textarea,button')) return;
    if (scene==='garage' && event.code==='KeyN') openPaper('cars');
    if (scene==='garage' && event.code==='KeyM') toggleRadio();
    if (scene==='race' && event.code==='KeyP') togglePaused();
  },{signal:abort.signal});
  document.addEventListener('visibilitychange',() => {
    if (document.hidden && dialog.open && scene==='race' && race && !race.result && !staged && !paused) togglePaused();
    else if (document.hidden) speaker.silence();
  },{signal:abort.signal});
  document.addEventListener('family-hot-rod-scores-changed',() => {
    if (dialog.open && scene==='standings') void refreshScores();
    if (dialog.open && scene==='crew') void refreshCrew();
  },{signal:abort.signal});

  return {
    open() {
      if (dialog.open || !alive) return;
      scene='boot';
      message=problem='';
      retry=null;
      confirmNew=false;
      dialog.showModal();
      document.documentElement.classList.add('hot-rod-open');
      render();
      bootTimer=setTimeout(() => {
        if (!dialog.open) return;
        scene='title';
        render();
        void load();
      },window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:500);
    },
    destroy() {
      close(true);
      alive=false;
      input.dispose();
      speaker.close();
      abort.abort();
      dialog.remove();
    }
  };
}
