/* One accessible navigation system for Cowboy's Toolbox and the Commons.
   Preserve existing menus as no-JavaScript fallback and preserve all game logic. */
(() => {
  'use strict';
  const page = document.body.classList.contains('community-page') ? 'commons' :
    document.body.classList.contains('toolbox-page') ? 'toolbox' : '';
  if (!page || document.getElementById('cowboy-site-nav')) return;
  const header = document.querySelector('.masthead .header-inner');
  if (!header) return;
  const iconPaths = {
    home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
    tools:'<path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4"/>',
    message:'<path d="M4 4h16v13H9l-5 4zM8 9h8M8 13h5"/>',
    search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    game:'<path d="M7 8h10l4 7-2 5-5-4h-4l-5 4-2-5zM8 11v5M5.5 13.5h5M16 12h.01M19 14h.01"/>',
    trophy:'<path d="M7 3h10v8a5 5 0 0 1-10 0zM7 5H4v3a4 4 0 0 0 4 4M17 5h3v3a4 4 0 0 1-4 4M12 16v4M8 21h8"/>',
    word:'<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/>',
    plate:'<rect x="2" y="5" width="20" height="14" rx="3"/><circle cx="5.5" cy="8" r=".5"/><circle cx="18.5" cy="16" r=".5"/><path d="M7 12h10"/>',
    tiles:'<rect x="4" y="3" width="9" height="12" rx="1"/><rect x="11" y="9" width="9" height="12" rx="1"/>',
    art:'<path d="m4 20 4-1 11-11-3-3L5 16zM14 7l3 3M4 3h5M4 7h3"/>',
    account:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    help:'<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 5M12 18h.01"/>',
    plus:'<path d="M12 5v14M5 12h14"/>'
  };
  const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24">' +
    (iconPaths[name] || iconPaths.tools) + '</svg>';
  const games = [
    {label:'Mahjong',icon:'tiles',id:'mahjong',button:'mahjong-toggle'},
    {label:'w0rdle',icon:'word',id:'wordle',button:'letter-lock-toggle'},
    {label:'Word Quest',icon:'word',id:'wordquest',button:'word-game-toggle'},
    {label:'Plate Challenge',icon:'plate',id:'plates',button:'plate-game-open'},
    {label:'Drawing Studio',icon:'art',id:'drawing',button:'drawing-studio-toggle'}
  ];
  const shell = document.createElement('div');
  shell.className = 'cowboy-nav-heading';
  shell.innerHTML = page === 'toolbox' ?
    '<strong>Toolbox</strong><small>Tools, guides &amp; useful discoveries</small>' :
    '<strong>Message Board</strong><small>The Commons · Posts &amp; games</small>';
  const root = document.createElement('div');
  root.id = 'cowboy-site-nav';
  root.className = 'cowboy-site-nav';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'cowboy-nav-toggle';
  toggle.setAttribute('aria-label','Open navigation menu');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-controls','cowboy-nav-panel');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  const panel = document.createElement('nav');
  panel.id = 'cowboy-nav-panel';
  panel.className = 'cowboy-nav-panel';
  panel.setAttribute('aria-label','Toolbox and Commons navigation');
  panel.hidden = true;
  const title = document.createElement('strong');
  title.className = 'cowboy-nav-panel-title';
  title.textContent = 'Menu';
  panel.append(title);
  function section(label) {
    const el = document.createElement('div');
    el.className = 'cowboy-nav-section-label';
    el.textContent = label;
    panel.append(el);
  }
  function item(label, iconName, href, action, current = false) {
    const el = href ? document.createElement('a') : document.createElement('button');
    if (!href) el.type = 'button';
    el.className = 'cowboy-nav-item';
    if (href) el.setAttribute('href',href);
    if (action) el.dataset.cowboyAction = action;
    if (current) el.setAttribute('aria-current','page');
    el.innerHTML = icon(iconName);
    const text = document.createElement('span');
    text.textContent = label;
    el.append(text);
    panel.append(el);
    return el;
  }
  section('Explore');
  item('Home','home','./',null,page==='toolbox');
  if (page === 'toolbox') {
    item('Explore tools','search','#explore');
    item('Starter guides','tools','#starter-packs');
    item('Message Board','message','community.html#conversations');
  } else {
    item('Message Board','message','#conversations',null,true);
    item('New post','plus',null,'new-post');
    item('Toolbox','tools','./');
  }
  section('Games · Members');
  if (page === 'commons') {
    games.forEach(g => item(g.label,g.icon,null,'game:'+g.id));
  } else {
    games.forEach(g => item(g.label,g.icon,'community.html#open-'+g.id));
  }
  section('More');
  if (page === 'toolbox') item('Sign in / Account','account','community.html?auth=login');
  item('Help & accessibility','help','help.html');
  const utility = document.createElement('div');
  utility.className = 'cowboy-menu-utility';
  panel.append(utility);
  if (page === 'toolbox') {
    const language = header.querySelector('.language-control');
    const publicLabel = header.querySelector('.public-label');
    if (language) utility.append(language);
    if (publicLabel) utility.append(publicLabel);
  } else {
    const account = header.querySelector('#account-actions');
    if (account) utility.append(account);
  }
  const note = document.createElement('small');
  note.className = 'cowboy-nav-note';
  note.textContent = page === 'commons' ?
    'Community posts and games require approved membership.' :
    'Browse public tools freely. Games and community posts require membership.';
  panel.append(note);
  root.append(toggle,panel);
  header.querySelector('.brand')?.after(shell);
  header.append(root);
  document.body.classList.add('cowboy-nav-ready');
  function close(returnFocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open navigation menu');
    if (returnFocus) toggle.focus();
  }
  function open() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Close navigation menu');
  }
  toggle.addEventListener('click', () => {
    if (panel.hidden) {open();} else {close();}
  });
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !root.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();event.stopPropagation();close(true);
    }
    if (event.key === 'ArrowDown' && event.target === toggle && panel.hidden) {
      event.preventDefault();open();panel.querySelector('.cowboy-nav-item')?.focus();
    }
  });
  function signIn() {
    const button = document.querySelector('#account-actions [data-auth="login"], #account-actions button[data-auth]');
    if (button) button.click();
  }
  function launchGame(id) {
    const game = games.find(entry => entry.id === id);
    if (!game) return;
    const board = document.getElementById('conversations');
    const button = document.getElementById(game.button);
    if (!board || board.hidden || !button || button.disabled || button.closest('[hidden]')) {
      if (!board || board.hidden) signIn();
      else board.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    button.click();
  }
  panel.addEventListener('click', event => {
    const target = event.target.closest('.cowboy-nav-item');
    if (!target) return;
    const action = target.dataset.cowboyAction;
    close();
    if (action === 'new-post') {
      const button = document.getElementById('new-thread') || document.getElementById('hero-new');
      if (button && !document.getElementById('conversations')?.hidden) button.click();
      else signIn();
    } else if (action?.startsWith('game:')) {
      launchGame(action.slice(5));
    }
  });
  /* A Toolbox game link opens that exact game only once the existing
     membership-gated button is available. Never bypass authentication. */
  if (page === 'commons') {
    const match = /^#open-(mahjong|wordle|wordquest|plates|drawing)$/.exec(location.hash);
    if (match) {
      let attempts = 0;
      const tryOpen = () => {
        if (++attempts > 32) {clearInterval(timer);return;}
        const game = games.find(g => g.id === match[1]);
        const board = document.getElementById('conversations');
        const button = document.getElementById(game?.button);
        if (board && !board.hidden && button && !button.disabled && !button.closest('[hidden]')) {
          clearInterval(timer);
          history.replaceState(null,'',location.pathname + location.search + '#conversations');
          button.click();
        }
      };
      const timer = setInterval(tryOpen,250);
      tryOpen();
    }
  }
})();
