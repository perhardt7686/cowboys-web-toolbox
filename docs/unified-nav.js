/* One accessible navigation system for Cowboy's Toolbox and Family Message Board.
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
    '<strong>Family Message Board</strong>';
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
  panel.setAttribute('aria-label','Toolbox and Family Message Board navigation');
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
  function item(label, iconName, href, action, current = false, target = null) {
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
    (target || panel).append(el);
    return el;
  }
  section('Explore');
  item('Home','home','./',null,page==='toolbox');
  let memberActions;
  if (page === 'toolbox') {
    item('Explore tools','search','#explore');
    item('Starter guides','tools','#starter-packs');
    item('Family Message Board','message','community.html').classList.add('cowboy-nav-family');
  } else {
    item('Family Message Board','message','#family-welcome',null,true);
    memberActions = document.createElement('div');
    memberActions.className = 'cowboy-member-actions';
    panel.append(memberActions);
  }
  section('More');
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
  panel.addEventListener('click', event => {
    const target = event.target.closest('.cowboy-nav-item');
    if (!target) return;
    const action = target.dataset.cowboyAction;
    close();
    if (action === 'new-post') {
      const button = document.getElementById('new-thread') || document.getElementById('hero-new');
      if (button && !document.getElementById('conversations')?.hidden) button.click();
      else signIn();
    }
  });
  // Restore bookmarked game links after the approved board mounts.
  if (memberActions) {
    const board = document.getElementById('conversations');
    const main = board?.querySelector('.community-main');
    let approved;
    const syncMemberNav = () => {
      const visible = Boolean(board && !board.hidden);
      if (visible === approved) return;
      approved = visible;
      memberActions.replaceChildren();
      if (!approved) return;
      item('Family games','game','#family-games',null,false,memberActions);
      item('Conversations','message','#family-conversations',null,false,memberActions);
      item('Fridge','tools','#family-fridge',null,false,memberActions);
      item('Calendar','word','#family-calendar',null,false,memberActions);
      item('New post','plus',null,'new-post',false,memberActions);
    };
    const tryOpen = () => {
      if (!approved) return;
      const match = /^#open-([a-z]+)$/.exec(location.hash);
      const game = match && games.find(g => g.id === match[1]);
      const button = game && document.getElementById(game.button);
      if (!button || button.disabled || button.closest('[hidden]')) return;
      history.replaceState(null,'',location.pathname + location.search + '#family-games');
      button.click();
    };
    const refresh = () => { syncMemberNav(); tryOpen(); };
    if (board) new MutationObserver(refresh).observe(board,{attributes:true,attributeFilter:['hidden']});
    if (main) new MutationObserver(tryOpen).observe(main,{childList:true,subtree:true});
    window.addEventListener('hashchange',tryOpen);
    refresh();
  }
})();
