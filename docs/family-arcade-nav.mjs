import {button, el} from './family-board-core.mjs?v=family3';

const labels = {
  mahjong: {play: 'Playing board', levels: 'Campaign levels', scores: 'Leaderboard', personal: 'My scores', badges: 'Achievements', history: 'Game history'},
  wordle: {play: 'Today’s puzzle', scores: 'Leaderboard', awards: 'Achievements', history: 'Game history'},
  wordquest: {play: 'Today’s puzzle', scores: 'Leaderboard', progress: 'Level and achievements', history: 'Game history'},
  plates: {post: 'Post a Plate', vote: 'Review Plates', history: 'Photo Gallery', scores: 'Scores'},
  drawing: {draw: 'Canvas'},
  study: {cards: 'Study cards', awards: 'Milestones', sources: 'Study resources'}
};
const instructions = {
  mahjong: 'Match tiles with the same picture and corner mark. A playable tile is uncovered and has an open left or right side. Zoom in, then swipe to pan. Fit board brings the full layout back into view. Campaign stages unlock as you qualify.',
  wordle: 'Guess five-letter words as a team. Green means the correct position and earns 12 personal points. Gold means the letter belongs elsewhere and earns 5. A solve adds a bonus and awards contributing players 35 team-victory points each. The shared word resets at midnight Eastern.',
  wordquest: 'Use the clue to solve today’s five-letter word together. Valid guesses score 5 points, with bonus points for solving. Everyone who contributes gets a team win when the team solves. Open Levels and achievements to see your XP and badges. The puzzle resets at midnight Eastern.',
  plates: 'Post a photo, enter the plate characters and region, then explain your interpretation. The other player can agree for one point or explain a disagreement. A revised interpretation goes back for review. Each photo can earn one point.',
  drawing: 'Draw with a touch, mouse or stylus. Open Tools and layers to change tools, add a layer, zoom or select Pan, and see undo, redo and export options. Save editable project and Open project keep your layers. PNG and JPEG export a flat image.',
  study: 'Pick a topic or study mode. Reveal the card, then choose Study again or Got it. Milestones and progress are stored on this device for your account. Official preparation resources are listed under Study resources.'
};
const get = id => document.getElementById(id);
const sceneAction = (label, scene, scope) => ({label, scene, scope});
const clickAction = (label, target, scene) => ({label, target, scene});
const actions = {
  mahjong: [
    {label: 'Resume game', scene: 'play', action: 'resume'},
    sceneAction('Current level', 'levels'), clickAction('Level selection', 'mahjong-browse-level', 'levels'),
    sceneAction('Leaderboard', 'scores'), sceneAction('My scores', 'personal'),
    sceneAction('Achievements', 'badges'), sceneAction('History', 'history'),
    {label: 'Pause or resume', scene: 'play', action: 'pause'}
  ],
  wordle: [sceneAction('Today’s puzzle', 'play'), sceneAction('Daily leaderboard', 'scores'),
    sceneAction('Game history', 'history'), sceneAction('Achievements', 'awards')],
  wordquest: [sceneAction('Current puzzle', 'play'), sceneAction('Leaderboard', 'scores'),
    sceneAction('Level, XP and achievements', 'progress'), sceneAction('Game history', 'history')],
  plates: [
    sceneAction('Post challenge', 'post'), sceneAction('Review pending plates', 'vote', 'pending'),
    sceneAction('My reviews', 'vote', 'reviews'), sceneAction('All submitted plates', 'vote', 'all'),
    sceneAction('Photo gallery', 'history'), sceneAction('My submissions', 'vote', 'mine'),
    sceneAction('Leaderboard', 'scores'), sceneAction('Previous challenges', 'vote', 'past'),
    clickAction('Refresh scores and photos', 'plate-refresh')
  ],
  drawing: [
    clickAction('Tools and layers', 'art-tools-toggle'), clickAction('Undo', 'art-undo'),
    clickAction('Redo', 'art-redo'), clickAction('Save editable project', 'art-save-project'),
    clickAction('Open project', 'art-import-project')
  ],
  study: [sceneAction('Study cards', 'cards'), sceneAction('Milestones', 'awards'), sceneAction('Study resources', 'sources')]
};

export function makeArcadeNav({leave, view, settings}) {
  const header = el('header', 'family-game-header');
  header.id = 'family-game-header';
  header.hidden = true;
  const title = el('h1');
  const mode = el('p');
  const identity = el('div', 'family-game-identity');
  identity.append(title, mode);
  const back = button('Back to games', leave);
  back.className = 'family-game-back';
  const trigger = button('', () => popup.hidden ? openMenu() : closeMenu(), {
    'aria-label': 'Open game menu', 'aria-controls': 'family-game-menu', 'aria-expanded': 'false'
  });
  trigger.className = 'family-game-menu-button';
  for (let i = 0; i < 3; i++) trigger.append(el('span'));
  const first = el('div', 'family-game-nav-row');
  first.append(back, identity, trigger);
  const stats = el('div', 'family-game-stats');
  stats.setAttribute('aria-label', 'Game status');
  const primary = el('nav', 'family-plate-actions');
  primary.setAttribute('aria-label', 'License plate actions');
  const popup = el('nav', 'family-game-popup');
  popup.id = 'family-game-menu';
  popup.hidden = true;
  popup.setAttribute('aria-label', 'Controls for this game');
  const help = el('dialog', 'family-game-help');
  help.setAttribute('aria-labelledby', 'family-game-help-title');
  const helpTitle = el('h2', '', 'How to play');
  helpTitle.id = 'family-game-help-title';
  const helpText = el('p');
  help.append(helpTitle, helpText, button('Close help', () => help.close()));
  help.addEventListener('close', () => { if (!header.hidden) trigger.focus(); });
  header.append(first, stats, primary, popup, help);
  document.body.append(header);

  let selected = null, current = null, lastStats = null;
  function closeMenu(focus = false) {
    if (popup.hidden) return false;
    popup.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open game menu');
    if (focus) trigger.focus({preventScroll: true});
    return true;
  }
  function openMenu() {
    popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Close game menu');
    updatePopup();
  }
  function action(option) {
    closeMenu(true);
    if (option.scene) view(option.scene, option.scope);
    if (option.target) get(option.target)?.click();
    if (option.action === 'resume' && !get('mahjong-pause-screen')?.hidden) get('mahjong-overlay-resume')?.click();
    if (option.action === 'pause') get('mahjong-pause')?.click();
  }
  function updatePopup() {
    const pause = popup.querySelector('[data-pause-action]');
    if (pause) {
      pause.disabled = get('mahjong-pause')?.disabled ?? true;
      pause.textContent = get('mahjong-pause-screen')?.hidden ? 'Pause game' : 'Resume paused game';
    }
    const level = popup.querySelector('[data-current-level]');
    if (level) {
      const value = get('mahjong-level-number')?.textContent || '';
      level.textContent = value ? 'Current level · ' + value.replace(/^Level /, '') : 'Current level';
    }
  }
  function buildChoices(id) {
    popup.replaceChildren();
    for (const option of actions[id]) {
      const control = button(option.label, () => action(option));
      if (option.action === 'pause') control.dataset.pauseAction = '';
      if (option.label === 'Current level') control.dataset.currentLevel = '';
      popup.append(control);
    }
    popup.append(button('Display settings', () => { closeMenu(); settings(); }));
    popup.append(button(id === 'plates' ? 'Rules and help' : 'How to play', () => {
      closeMenu();
      helpText.textContent = instructions[id];
      if (!help.open) help.showModal();
    }));
    primary.replaceChildren();
    if (id === 'plates') {
      for (const [key, label] of Object.entries(labels.plates)) {
        const nav = button(label, () => view(key, key === 'vote' ? 'pending' : undefined));
        nav.dataset.gameScene = key;
        primary.append(nav);
      }
    }
    primary.hidden = id !== 'plates';
  }
  function show(game, scene) {
    if (!game || game.id === 'streetrod') { hide(); return; }
    const changed = selected !== game.id;
    selected = game.id;
    current = scene;
    if (changed) {
      title.textContent = game.name;
      popup.setAttribute('aria-label', game.name + ' menu');
      lastStats = null;
      buildChoices(game.id);
    }
    mode.textContent = labels[game.id]?.[scene] ?? '';
    for (const control of primary.children) control.setAttribute('aria-current', control.dataset.gameScene === scene ? 'page' : 'false');
    header.hidden = false;
    updateStats();
    if (changed) trigger.focus({preventScroll: true});
  }
  function hide() {
    closeMenu();
    if (help.open) help.close();
    header.hidden = true;
    selected = current = null;
  }
  function updateStats() {
    if (!selected || header.hidden) return;
    const text = id => (get(id)?.textContent || '').trim();
    const values = {
      mahjong: [text('mahjong-run-title').replace(/ · Combo .+$/, ''), text('mahjong-remaining')],
      wordle: [...(get('letter-lock-statline')?.children || [])].slice(1, 4).map(item => {
        const [label, value] = [...item.children].map(child => child.textContent);
        const renamed = {'TEAM GUESSES LEFT': 'Guesses left', 'TEAM SCORE': 'Team score', 'YOUR POINTS TODAY': 'Your points'};
        return value === undefined ? '' : (renamed[label] || label) + ' ' + value;
      }),
      wordquest: [get('commons-word')?.dataset.difficulty, get('commons-word-progress')?.dataset.remaining !== undefined ? get('commons-word-progress').dataset.remaining + ' guesses left' : text('commons-word-progress'), text('arcade-quest-rank-chip').split(' · ').slice(0, 2).join(' · ')],
      plates: [current === 'vote' ? text('family-plate-queue-label') : text('plate-top-score')],
      drawing: [get('art-toolbox')?.querySelector('[aria-pressed=true]')?.textContent?.trim(), get('art-zoom')?.selectedOptions[0]?.textContent],
      study: [text('vdacs-study-summary')]
    }[selected].filter(value => value && value !== '—');
    const key = values.join('|');
    if (key !== lastStats) {
      stats.replaceChildren(...values.map(value => el('span', '', value)));
      if (!values.length) stats.append(el('span', '', 'Loading game…'));
      lastStats = key;
    }
    if (!popup.hidden) updatePopup();
  }
  document.addEventListener('pointerdown', event => {
    if (!popup.hidden && !popup.contains(event.target) && !trigger.contains(event.target)) closeMenu();
  });
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (popup.hidden) openMenu();
      popup.querySelector('button')?.focus();
    }
  });
  const metrics = new ResizeObserver(() => {
    if (!header.hidden) document.body.style.setProperty('--family-game-header-height', header.offsetHeight + 'px');
  });
  metrics.observe(header);
  return {show, hide, updateStats, closeMenu};
}
