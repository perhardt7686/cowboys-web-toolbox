import {button as makeButton, el, preference} from './family-board-core.mjs?v=family3';
import {getAvatarPhoto} from './family-avatar-cache.mjs?v=stable1';
import {avatarProjections,cacheAvatarCharacter} from './avatar-character-images.mjs?v=turn1';
import {activeCar, carOffer, carSpec, challengeProblem, dateLabel, gasCost, makeCar, matches, repairCost, roadProblem, saleValue} from './hot-rod-campaign.mjs';
import {BOLTS, CAR_LIST, CARS, COLORS, DOLLARS, FUEL_TANK, MAKES, PART_LIST, PARTS, RIVALS,
  SLOT_NAMES, SLOTS, WAGERS, WHEELS, fullBolts, isWheel} from './hot-rod-catalog.mjs';
import {paintScene} from './hot-rod-art.mjs?v=period2';
import {BAY_MENU,IGNITION,SHELF_LIST,workbenchFasteners} from './hot-rod-engine-bay.mjs';
import {DRIVE_IN_HOTSPOTS,NEWSPAPER_HOTSPOTS} from './hot-rod-period-scenes.mjs';
import {createRace, displaySpeed, raceClock, recordInput, stepRace, STEP} from './hot-rod-racing.mjs';
import {connectDrivingInput} from './hot-rod-input.mjs';

const cash = amount => '$' + Number(amount).toLocaleString('en-US');
const time = ms => ms === null || ms === undefined ? '—' : (ms / 1000).toFixed(2) + ' s';
const memberBadge = name => el('span','hot-rod-avatar',(name || 'Family driver').slice(0,2).toUpperCase());
const engineAssembly = ['engine','manifold','carb'];
const garageSlots = {engine:'Cylinder block',manifold:'Intake manifold',carb:'Carburetor',gearbox:'Gearbox'};
const endings = {champion:'King of the road',deadline:'School starts today',broke:'Out of money',jail:'The summer ends in jail'};
const playoff = {finish:'Time recorded',win:'Victory',loss:'Second place',false_start:'False start',crash:'Wrecked',engine:'Engine failure',
  gearbox:'Transmission failed',fuel:'Out of fuel',police20:'Stopped by patrol',police75:'Caught by patrol',abandoned:'Forfeited'};
const canvasLabels = {boot:'DOS startup',title:'Hot Rod title, a coupe at dusk',garage:'Garage with interactive tools and car',
  paper:'Newspaper classifieds',workbench:'Assembled engine and mechanical controls',diner:'Bob’s Drive-In',fuel:'Gus’s Gas',
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
  let paperMode = 'cover', paperPage = 0, listing = null, selectedSlot = 'carb', bayMode = 'work';
  let workmanship = false, selectedRival = RIVALS[0], raceType = 'drag', wager = 'kicks';
  let negotiating = false, dinerMenu = '', callerPage=0, crew = null, focusedMember = null, standings = null, fetchingScores = false, fetchingCrew = false;
  const fastenerTurns=new Map(), portraits=new Map();
  let focusBolt=null, shelfSelection=0, timing=0;
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

  const pixelButton=(label,coords,handler,focus='')=>hotspot(label,...coords,handler,focus);

  function artView() {
    const car = activeCar(state);
    const currentMemberCar = memberCar();
    const rivalModel=CARS[selectedRival.model];
    const view = {
      scene:scene === 'crew' && currentMemberCar ? 'garage' : scene === 'clip' ? 'garage' :
        scene === 'clock' || scene === 'body' ? 'garage' :
        scene === 'standings' || scene === 'crew' ? 'title' :
        scene === 'diner' && negotiating ? 'diner-inspect' : scene,
      car:scene === 'crew' && focusedMember ? currentMemberCar :
        scene === 'paper' ? null : scene === 'diner' ? (negotiating?makeCar(rivalModel,0):null) : car,
      model:scene === 'paper' ? CARS[listing] : scene === 'diner' ? rivalModel :
        scene === 'crew' && currentMemberCar ? CARS[currentMemberCar.model] : CARS[car?.model],
      slot:selectedSlot, race, status:state?.status, rival:selectedRival, title:'Hot Rod',
      page:paperPage, mode:paperMode, radio, cash:state?.cash, hours:state?.hours
    };
    if(scene==='paper'){
      const listings=paperListings(car);
      view.listings=listings.slice(paperPage*5,paperPage*5+5);
      view.pageCount=Math.ceil(listings.length/5);
    }
    if(scene==='diner'&&!negotiating)
      view.menuItems=challengeChoices().map(({label,selected,disabled})=>({label,active:selected,disabled}));
    if(scene==='workbench'&&car){
      view.bayMode=bayMode;
      view.turns=Object.fromEntries(workbenchFasteners(selectedSlot).map((_,index)=>[index,fastenerStage(car,selectedSlot,index)]));
      view.focusBolt=focusBolt;
      view.locked=Boolean(bayBlock(car,selectedSlot));
      view.tuneAvailable=canTune(car);
      view.timing=timing;
      view.timingReference=PARTS[car.installed.engine?.id]?.timing;
      view.shelfParts=compatibleParts(car).map(entry=>({label:PARTS[entry.part.id].name}));
      view.canFitSpare=!car.installed[selectedSlot]&&!view.locked&&view.shelfParts.length>0;
      view.shelfIndex=shelfSelection;
    }
    if(scene==='diner'&&negotiating)view.slot='engine';
    return view;
  }

  function show(next) {
    if (!dialog.open) return;
    if (scene === 'race' && race && !race.result && !staged) return;
    scene = next;
    if (next !== 'clip') workmanship = false;
    if (next !== 'diner') {negotiating=false;dinerMenu='';}
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
      fastenerTurns.clear();
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
    shelfSelection=0;focusBolt=null;
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
      void mutate('new',{},() => openPaper('cover'));
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
    hotspot('Open newspaper',5,151,66,41,() => openPaper('cover'));
    hotspot('Jack and wheels',111,153,49,35,() => work(WHEELS[0]));
    hotspot('Paint and bodywork',192,154,58,39,() => show('body'));
    hotspot('Fuel can',266,151,54,43,() => show('fuel'));
    if (car) {
      hotspot('Open the hood',213,110,84,40,openHood);
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
      row(action('Newspaper', () => openPaper('cover'), {accent:!car}), action('Hit the street', cruise, {accent:!!car}),
        action('Under the hood', openHood, {disabled:!car}), action('Car info', () => show('clip'), {disabled:!car})),
      counts.length > 1 ? select('Garage bay',counts.map(item=>[item.number,CARS[item.model].name]),car.number,
        number => void mutate('select-car',{number:Number(number)})) : el('span'));
  }

  function openPaper(mode = 'cover') {
    paperMode = mode;
    listing = null;
    paperPage = 0;
    show('paper');
  }

  function paperListings(car) {
    return paperMode === 'cars' ? CAR_LIST :
      PART_LIST.filter(item => !item.stock && (!car || !item.make || item.make === CARS[car.model].make));
  }

  function renderPaper() {
    const garage=()=>show('garage');
    const cars=()=>openPaper('cars'), parts=()=>openPaper('parts'), cover=()=>openPaper('cover');
    const controls=paperMode==='cover'?NEWSPAPER_HOTSPOTS.cover:NEWSPAPER_HOTSPOTS.listings;
    pixelButton('Open used cars',controls.cars,cars);
    pixelButton('Open auto parts',controls.parts,parts);
    pixelButton('Drop newspaper and return to garage',controls.garage,garage);
    if(paperMode==='cover'){
      panel('Los Angeles News',row(action('Used cars',cars,{accent:true}),
        action('Auto parts',parts),action('Garage',garage)));
      return;
    }
    const listings = paperListings(activeCar(state));
    const totalPages = Math.ceil(listings.length / 5);
    pixelButton('Show newspaper front page',controls.cover,cover);
    const navigation = row(action('Front page',cover),
      action('Used cars',cars,{accent:paperMode==='cars'}),
      action('Auto parts',parts,{accent:paperMode==='parts'}),action('Garage',garage));
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
    const pageItems=listings.slice(paperPage*5,paperPage*5+5);
    for (const [index,item] of pageItems.entries()) {
      const itemRow = el('li');
      const open=()=>{
        if (paperMode === 'cars') { listing = item.id; render(); return; }
        void mutate('buy-part',{id:item.id});
      };
      const disabled=paperMode==='parts'&&(busy||item.price>state?.cash);
      if(!disabled)pixelButton((paperMode==='cars'?'Inspect ':'Buy spare ')+item.name,NEWSPAPER_HOTSPOTS.listing[index],open,'art-paper-'+item.id);
      itemRow.append(action(item.name+' · '+cash(item.price),open,{disabled,focus:'paper-'+item.id}));
      if (paperMode === 'parts') itemRow.append(el('small','',item.slot === 'tire' ? 'Each tire' : garageSlots[item.slot]));
      else itemRow.append(el('small','',item.wear+'% · '+(item.auto?'Automatic':'Manual')+' · '+
        (carOffer(item)<=state?.cash?'Within your budget':'Above your budget')));
      classified.append(itemRow);
    }
    const previous=()=>{paperPage--;render();}, next=()=>{paperPage++;render();};
    if(paperPage>0)pixelButton('Previous classifieds page',controls.previous,previous,'art-paper-prev');
    if(paperPage<totalPages-1)pixelButton('Next classifieds page',controls.next,next,'art-paper-next');
    const paging = row(action('‹ Previous',previous,{disabled:paperPage===0,focus:'paper-prev'}),
      el('span','',(paperPage+1)+' / '+totalPages),
      action('Next ›',next,{disabled:paperPage>=totalPages-1,focus:'paper-next'}));
    panel(paperMode==='cars'?'Used car classifieds':'Auto parts classifieds',navigation,classified,paging);
  }

  function openHood(){
    const fitted=activeCar(state)?.installed;
    work(fitted?.carb?'carb':fitted?.manifold?'manifold':'engine');
  }
  const fastenerKey=(car,slot,index)=>car.number+'|'+slot+'|'+index;
  const fastenerStage=(car,slot,index)=>fastenerTurns.get(fastenerKey(car,slot,index))||0;
  const canTune=car=>!roadProblem({...car,damage:0,fuel:20});

  function bayBlock(car,slot) {
    if(isWheel(slot)&&car.jack!==slot)return 'Raise this corner before touching the lugs.';
    if(slot==='engine'&&(car.installed.carb||car.installed.manifold))
      return 'Remove the carburetor and intake to reach the engine mounts.';
    if(slot==='manifold'&&car.installed.carb)return 'Remove the carburetor to reach the intake.';
    return '';
  }
  function compatibleParts(car) {
    return state.inventory.map((part,index)=>({part,index})).filter(({part})=>matches(car,selectedSlot,part.id));
  }

  function removeIfReady(slot) {
    const car=activeCar(state);
    if(!car?.installed[slot]||car.bolts[slot]!==0||bayBlock(car,slot)||slot==='engine'&&car.ignition)return;
    queueMicrotask(()=>{
      if(!alive||!dialog.open||activeCar(state)?.number!==car.number||activeCar(state)?.bolts[slot]!==0)return;
      void mutate('remove',{slot},()=>{
        for(let index=0;index<BOLTS[slot];index++)fastenerTurns.delete(fastenerKey(car,slot,index));
        if(slot==='carb')selectedSlot='manifold';
        else if(slot==='manifold')selectedSlot='engine';
        focusBolt=null;
      });
    });
  }
  function turnFastener(car,slot,index){
    if(busy||bayBlock(car,slot)||!car.installed[slot])return;
    const key=fastenerKey(car,slot,index),stage=fastenerStage(car,slot,index);
    const tight=Boolean(car.bolts[slot]&(1<<index));
    focusBolt=index;
    if(stage<(tight?1:2)){
      fastenerTurns.set(key,stage+1);
      message=!tight&&!stage?'Bolt seated. Turn it twice to tighten.':'One turn. Turn again to '+(tight?'remove':'tighten')+' the fastener.';
      problem='';retry=null;render();return;
    }
    void mutate('bolt',{slot,index},()=>{
      fastenerTurns.delete(key);
      if(tight)removeIfReady(slot);
    });
  }
  function selectSpare(car,index){
    if(car.installed[selectedSlot]||busy||bayBlock(car,selectedSlot))return;
    const slot=selectedSlot;
    void mutate('install',{slot,index},()=>{
      for(let n=0;n<BOLTS[slot];n++)fastenerTurns.set(fastenerKey(car,slot,n),1);
      bayMode='work';focusBolt=null;shelfSelection=0;
    });
  }

  function renderWorkbench() {
    const car=activeCar(state);
    if(!car){panel('Workbench',copy('There’s no car in the bay.'),action('Newspaper',()=>openPaper()));return;}
    const slot=selectedSlot, item=car.installed[slot], bolts=car.bolts[slot], tire=isWheel(slot);
    const blocked=bayBlock(car,slot), spare=compatibleParts(car);
    const parts=()=>{
      if(engineAssembly.includes(slot)){
        selectedSlot=engineAssembly.find(part=>!car.installed[part])||slot;
      }
      bayMode='shelf';shelfSelection=0;render();
    };
    const back=()=>{bayMode='work';render();};
    const done=()=>show('garage');
    const tune=()=>{
      if(!canTune(car))return;
      timing=car.timing;bayMode='tune';render();
    };
    const mount=select('Work area',SLOTS.map(name=>[name,SLOT_NAMES[name]]),slot,work);
    if(bayMode==='tune'){
      const adjust=delta=>{
        timing=Math.max(0,Math.min(16,timing+delta));render();
      };
      const save=()=>{
        if(timing===car.timing){back();return;}
        void mutate('tune',{value:timing},back);
      };
      pixelButton('Back to engine',BAY_MENU.back,back,'art-bay-back');
      pixelButton('Save timing and return to engine',BAY_MENU.done,save,'art-timing-done');
      if(timing>0)pixelButton('Timing belt up',BAY_MENU.up,()=>adjust(-1),'art-retard');
      if(timing<16)pixelButton('Timing belt down',BAY_MENU.down,()=>adjust(1),'art-advance');
      panel('Timing belt',copy('Up retards timing. Down advances it. The red mark is this engine’s reference.'),
        row(action('↑ Retard timing',()=>adjust(-1),{disabled:busy||timing<=0,focus:'retard'}),
        el('output','',timing+'°'),
        action('↓ Advance timing',()=>adjust(1),{disabled:busy||timing>=16,focus:'advance'})),
        row(action('Back',back),action('Done',save,{accent:true,disabled:busy,focus:'timing-done'})));
      return;
    }
    if(bayMode==='shelf'){
      const pick=index=>{shelfSelection=index;render();};
      const change=()=>{if(spare[shelfSelection])selectSpare(car,spare[shelfSelection].index);};
      if(!busy){
        pixelButton('Back to engine',BAY_MENU.back,back,'art-bay-back');
        pixelButton('Close parts and return to garage',BAY_MENU.done,done);
        if(!item&&!blocked&&spare.length)pixelButton('Fit the selected part',BAY_MENU.change,change,'art-fit');
        spare.slice(0,4).forEach(({part},index)=>pixelButton('Select '+PARTS[part.id].name,SHELF_LIST[index],()=>pick(index),'art-spare-'+index));
      }
      const selectors=spare.map(({part},index)=>action(PARTS[part.id].name+' · '+part.wear+'%',()=>pick(index),
        {accent:shelfSelection===index,focus:'shelf-'+index}));
      const sell=spare[shelfSelection];
      panel('Parts shelf',mount,copy(item?'Finish removing the installed part before fitting a spare.':
        blocked||(!spare.length?'No matching spare in the garage. Try the newspaper.':'Select a part and choose Change.')),
      row(...selectors),row(action('Change',change,{accent:true,disabled:busy||!!item||!!blocked||!spare.length}),
        action('Parts classifieds',()=>openPaper('parts')),
        ...(sell&&PARTS[sell.part.id].slot!=='tire'?[action('Sell this spare',doWork('sell-part',{index:sell.index},()=>{shelfSelection=0;}),{disabled:busy})]:[]),
        action('Back',back),action('Done',done)));
      return;
    }
    if(!busy) {
      if(canTune(car))pixelButton('Tune engine',BAY_MENU.tune,tune,'art-tune');
      pixelButton('Open parts shelf',BAY_MENU.parts,parts,'art-parts');
      pixelButton('Close the hood',BAY_MENU.done,done,'art-done');
    }
    const loose=item?BOLTS[slot]-workbenchFasteners(slot).filter((_,i)=>bolts&(1<<i)).length:0;
    const mechanics=el('div','hot-rod-wrench');
    if(item&&!blocked)workbenchFasteners(slot).forEach(({x,y},index)=>{
      const tight=Boolean(bolts&(1<<index)),turn=fastenerStage(car,slot,index);
      const type=tire?'lug ':'bolt ';
      const label=(tight?(turn?'Remove ':'Loosen '):(turn===0?'Seat ':turn===1?'Tighten ':'Torque '))+type+(index+1);
      const wrench=()=>turnFastener(car,slot,index);
      if(!busy)hotspot(label,x-11,y-9,22,18,wrench,'art-bolt'+index).classList.add('hot-rod-fastener');
      mechanics.append(action(label,wrench,{disabled:busy,focus:'bolt'+index}));
    });
    const ignition=()=>{
      void mutate('ignition',{},()=>{if(car.ignition)removeIfReady(slot);});
    };
    const canConnect=!!car.installed.engine&&car.bolts.engine===fullBolts('engine');
    const ignitionLabel=car.ignition?'Disconnect ignition':'Connect ignition';
    if(!tire&&slot!=='gearbox'&&!busy&&(car.ignition||canConnect))
      pixelButton(ignitionLabel+' lead',IGNITION,ignition,'art-ignition');
    const controls=row();
    if(tire)controls.append(action(car.jack?'Lower jack':'Raise corner',doWork('jack',{slot}),
      {disabled:busy||Boolean(car.jack&&car.jack!==slot)}));
    else if(slot!=='gearbox')controls.append(action(ignitionLabel,ignition,{disabled:busy||!car.ignition&&!canConnect}));
    if(item&&bolts===0&&!blocked)controls.append(action('Lift off '+SLOT_NAMES[slot],()=>removeIfReady(slot),
      {accent:true,disabled:busy||slot==='engine'&&car.ignition}));
    if(!item&&!blocked)controls.append(action('Choose a spare',parts,{accent:true,disabled:busy}));
    const note=blocked||(!item?'Open Parts to fit a compatible spare.':
      slot==='engine'&&bolts===0&&car.ignition?'Unclip the ignition lead to lift the block.':
      'Turn each '+(tire?'lug':'bolt')+' twice to remove it. Tap an empty hole to seat it again.');
    panel(item?PARTS[item.id].name:SLOT_NAMES[slot],mount,
      row(action('Tune',tune,{disabled:busy||!canTune(car)}),action('Parts',parts,{disabled:busy}),action('Done',done,{disabled:busy})),
      copy(note),item?copy(item.wear+'% condition · '+loose+' loose'):el('span'),mechanics,controls);
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
    negotiating=false;dinerMenu='';
    render();
  }

  const wagerLabel=key=>key==='kicks'?'For kicks':key==='pink'?'Pink slips':cash(DOLLARS[key]);
  const courseLabels=[['drag','¼-mile drag'],['road','2½-mile road']];
  function chooseCourse(kind){
    raceType=kind;wager=WAGERS[kind][0];
  }
  function startChallenge(stake=wager){
    const rival=selectedRival;
    void mutate('challenge',{rival:rival.id,kind:raceType,stake},()=>prepareRace(state.race));
  }
  function challengeChoices(){
    const cancel={label:'Forget it',activate:()=>{dinerMenu='';render();}};
    if(dinerMenu==='call'){
      const names=RIVALS.slice(callerPage*3,callerPage*3+3).map(person=>({
        label:'Call '+person.name,selected:person.id===selectedRival.id,activate:()=>chooseRival(person.id)
      }));
      return [...names,{label:'More drivers',activate:()=>{callerPage=(callerPage+1)%Math.ceil(RIVALS.length/3);render();}}];
    }
    if(dinerMenu==='course')return [...courseLabels.map(([kind])=>({
      label:kind==='drag'?'Drag race':'Road race',activate:()=>{chooseCourse(kind);dinerMenu='stake';render();}
    })),cancel];
    if(dinerMenu==='stake')return [...WAGERS[raceType].map(stake=>({
      label:wagerLabel(stake),selected:stake===wager,disabled:!!challengeProblem(state,selectedRival,raceType,stake),
      activate:()=>startChallenge(stake)
    })),cancel];
    return [];
  }

  function renderDiner() {
    const rival=selectedRival, model=CARS[rival.model], zones=DRIVE_IN_HOTSPOTS;
    const requirements=state.dragWins<rival.drag||state.roadWins<rival.road;
    const inspect=()=>{negotiating=!negotiating;dinerMenu='';render();};
    if(negotiating)pixelButton('Done inspecting rival',BAY_MENU.done,inspect,'art-rival-done');
    else {
      pixelButton('Inspect rival engine',zones.inspect,inspect,'art-inspect-rival');
      pixelButton('Call another driver',zones.caller,()=>{
        dinerMenu=dinerMenu==='call'?'':'call';
        callerPage=Math.floor(RIVALS.indexOf(rival)/3);render();
      },'art-call-rival');
      pixelButton('Discuss a race with '+rival.name,zones.challenge,()=>{dinerMenu='course';render();},'art-diner-course');
      challengeChoices().forEach(({label,activate,disabled},index)=>{
        if(!busy&&!disabled)pixelButton(label,zones.menu[index],activate,'art-diner-'+index);
      });
    }
    const info=negotiating?copy(model.name+' · '+model.hp+' hp · '+model.weight+' lb · '+
      (model.auto?'Automatic':'Manual transmission')):copy(model.name+' · “'+rival.line+'”');
    const blocked=challengeProblem(state,rival,raceType,wager);
    panel('Bob’s Drive-In',row(select('Call a driver',RIVALS.map(person=>[person.id,person.name+
      (state.beaten.includes(person.id)?' ✓':'')]),rival.id,chooseRival),
      action(negotiating?'Close rival’s hood':'Inspect car',inspect,{focus:'inspect-rival'}),action('Garage',()=>show('garage'))),info,
      requirements?copy('Required wins: '+rival.drag+' drag · '+rival.road+' road.'):el('span'),
      row(select('Race',courseLabels,raceType,kind=>{chooseCourse(kind);render();}),
        select('Wager',WAGERS[raceType].map(key=>[key,wagerLabel(key)]),wager,value=>{wager=value;render();}),
        action('Challenge '+rival.name,()=>startChallenge(),{disabled:busy,accent:true})),
      blocked?copy(blocked):el('span'));
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
          void mutate('new',{},() => { confirmNew=false;openPaper('cover'); });
        },{disabled:busy}),action('Cowboy Remix',remix)));
  }

  function achievements() {
    const list = [];
    const career = standings?.entries?.find(entry => entry.mine);
    if (state?.dragWins || career?.drag_wins) list.push('First drag win');
    if (state?.roadWins || career?.road_wins) list.push('First road win');
    if ((state?.wins ?? 0) >= 10 || (career?.wins ?? 0) >= 10) list.push('Ten race wins');
    if (state?.status === 'champion' || career?.crowns) list.push('Classic champion');
    if (career?.duel_wins) list.push('First family challenge win');
    if (state?.bonus?.won || career?.mystery_wins) list.push('Mystery Machine defeated');
    return list;
  }

  async function loadPortraits(people) {
    const ids=people.map(person=>person.avatar_member||person.id).filter(Boolean);
    const recipes=await avatarProjections(client,ids);
    const urls=await Promise.all([...recipes].map(async ([id,recipe])=>[id,await cacheAvatarCharacter(id,recipe)]));
    if(!alive||!dialog.open)return;
    ids.forEach(id=>portraits.delete(id));
    for(const [id,url] of urls)if(url)portraits.set(id,url);
  }

  function avatar(person) {
    const icon = memberBadge(person.name);
    const id=person.avatar_member||person.id, path=person.avatar_path;
    const source=portraits.get(id);
    if (source||path) void (source?Promise.resolve(source):getAvatarPhoto(client,path)).then(url => {
      if (!url || !alive || !dialog.open || !icon.isConnected) return;
      const image = el('img');
      image.alt = '';
      image.width = image.height = 32;
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('load',() => icon.replaceChildren(image),{once:true});
      image.src = url;
    }).catch(() => {});
    if(id)icon.dataset.familyAvatar=id;
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
      await loadPortraits(data?.entries||[]);
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
      await loadPortraits(data?.members||[]);
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
    dialog.dataset.bayMode=scene==='workbench'?bayMode:'';
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
    fastenerTurns.clear();
    state = null;
    loaded = false;
    crew = standings = focusedMember = null;
    portraits.clear();
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
    if (scene==='garage' && event.code==='KeyN') openPaper('cover');
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
