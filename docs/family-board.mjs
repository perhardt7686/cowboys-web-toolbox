import {PROFILE_ICONS} from './profile-core.mjs?v=powers1';
import {getAvatarPhoto,cachedAvatarPhoto} from './family-avatar-cache.mjs?v=stable1';
import {boardTime, button, el, preference, statusLine} from './family-board-core.mjs?v=family3';
import {avatarProjections,cacheAvatarCharacter} from './avatar-character-images.mjs?v=studio3';
import {makeFridge} from './family-fridge.mjs?v=family3';
import {makeCalendar} from './family-calendar.mjs?v=family3';

const games = {
  mahjong: {label: 'Mahjong', unit: 'best score', achievement: 'wins', entry: 'mahjong-toggle'},
  wordle: {label: 'w0rdle', unit: 'points', achievement: 'solves', entry: 'letter-lock-toggle'},
  wordquest: {label: 'Word Quest', unit: 'points', achievement: 'solves', entry: 'word-game-toggle'},
  plates: {label: 'License Plates', unit: 'points', achievement: 'approved plates', entry: 'plate-game-open'},
  hotrod: {label: 'Hot Rod', unit: 'points', achievement: 'achievements', entry: 'hot-rod-entry'}
};
const topics = ['scores', 'fridge', 'calendar'];
const routes = [
  ['games', 'Games'],
  ['conversations', 'Conversations'],
  ['fridge', 'Fridge'],
  ['calendar', 'Calendar']
];
const number = value => Number(value || 0).toLocaleString('en-US');

export function createFamilyBoard() {
  const board = document.getElementById('conversations');
  const host = document.getElementById('family-overview');
  const tools = document.getElementById('family-tools');
  let membership = null, channel = null, sessionCleanup = null;

  function clear() {
    membership = null;
    sessionCleanup?.();
    sessionCleanup = null;
    host.replaceChildren();
    tools.replaceChildren();
    host.hidden = tools.hidden = true;
  }

  function setAccess(client, member) {
    if (!client || member?.status !== 'approved') { if (membership) clear(); return; }
    if (membership === member.user_id) return;
    clear();
    membership = member.user_id;
    const memberId = membership;
    const rpc = async (name, values) => {
      const result = await client.rpc(name, values);
      if (membership === memberId && ['42501', 'PGRST301'].includes(result.error?.code)) {
        board.hidden = true;
        clear();
        document.dispatchEvent(new Event('family-membership-changed'));
      }
      return result;
    };
    const fridge = makeFridge({rpc});
    const calendar = makeCalendar({rpc});
    tools.append(fridge.panel, calendar.panel);
    tools.hidden = false;
    host.hidden = false;
    const active = () => membership === memberId && host.contains(scoreboard) && !board.hidden;

    const nav = el('nav', 'family-quick-links');
    nav.setAttribute('aria-label', 'Family board sections');
    for (const [route, label] of routes) {
      const link = el('a', 'family-quick-link');
      const artwork = el('img', 'family-quick-art');
      artwork.src = new URL('./family-route-' + route + '.webp', import.meta.url).href;
      artwork.alt = '';
      artwork.width = artwork.height = 160;
      artwork.decoding = 'async';
      link.href = '#family-' + route;
      link.dataset.route = route;
      link.append(artwork, el('span', 'family-quick-label', label));
      nav.append(link);
    }
    const scoreboard = el('section', 'family-panel family-scoreboard');
    scoreboard.setAttribute('aria-labelledby', 'family-score-title');
    const heading = el('h2', '', 'Family Scoreboard');
    heading.id = 'family-score-title';
    const refreshButton = button('Refresh', () => void refreshScores(true), {'aria-label': 'Refresh family scores'});
    const top = el('div', 'family-score-heading');
    top.append(heading, refreshButton);
    const picker = el('select');
    picker.setAttribute('aria-label', 'Standings by game');
    const status = statusLine('Loading standings…');
    const list = el('div', 'family-score-content');
    const all = button('View All Standings', showStandings);
    all.disabled = true;
    const control = el('div', 'family-score-controls');
    control.append(picker, all);
    scoreboard.append(top, control, list, status);
    const gamesTitle = el('h2', 'family-games-title', 'Family Games');
    gamesTitle.id = 'family-games';
    gamesTitle.tabIndex = -1;
    const celebration = el('div');
    celebration.id = 'avatar-lobby-celebration';
    host.append(nav, scoreboard, celebration, gamesTitle);
    void import('./avatar-reward-studio.mjs?v=reward1').then(({makeAvatarShowcase})=>{
      if(!active())return;
      const showcase=makeAvatarShowcase(item=>document.dispatchEvent(new CustomEvent('family-open-avatar-studio',{
        detail:{section:'collection',item}
      })));
      gamesTitle.after(showcase);
    }).catch(()=>{});
    const updates = document.getElementById('family-updates');
    if (updates) scoreboard.before(updates);
    const sidebar = board.querySelector('.community-sidebar');
    document.getElementById('family-conversations')?.after(sidebar);

    const dialog = el('dialog', 'family-standings-dialog');
    dialog.setAttribute('aria-labelledby', 'family-standings-title');
    const dialogTitle = el('h2', '', 'Family Standings');
    dialogTitle.id = 'family-standings-title';
    const dialogBody = el('div', 'family-score-content');
    dialog.append(dialogTitle, button('Close', () => dialog.close()), dialogBody);
    scoreboard.append(dialog);

    let selected = preference('score-view') || 'all';
    let data = null, connected = false, busy = false, dirty = false, offline = false, failed = false;
    let scoreTime = '', reconnectAt = 0, lastBackgroundRefresh = 0, lastScore = '';
    const retryTimers = new Map();
    const images = new Map();
    let portraits = new Map();
    let lastInput = '';

    function launchHash() {
      if (!active()) return;
      let current;
      for (const link of nav.children) {
        if (link.hash === location.hash) {
          link.setAttribute('aria-current', 'location');
          current = link;
        } else link.removeAttribute('aria-current');
      }
      if (!current) return;
      const target = document.getElementById(current.hash.slice(1));
      if (target?.tagName === 'DETAILS') target.open = true;
      target?.scrollIntoView({block: 'start'});
    }
    nav.addEventListener('click', event => {
      const link = event.target.closest('.family-quick-link');
      if (link?.hash === location.hash && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) launchHash();
    });
    window.addEventListener('hashchange', launchHash);
    function showStandings() {
      if (!dialog.open) dialog.showModal();
      paintScores();
    }
    function scoreOption(value, label) {
      const option = el('option', '', label);
      option.value = value;
      return option;
    }
    picker.append(scoreOption('all', 'All Games'));
    picker.addEventListener('change', () => {
      selected = picker.value;
      preference('score-view', selected);
      paintScores();
    });
    function avatar(entry) {
      const node = el('span', 'family-score-avatar');
      node.setAttribute('aria-hidden', 'true');
      if (entry.avatar_member) node.dataset.familyAvatar = entry.avatar_member;
      const signed = portraits.get(entry.avatar_member)||images.get(entry.avatar_path);
      if (signed?.url) {
        const image = el('img');
        image.src = signed.url;
        image.alt = '';
        image.width = image.height = 28;
        image.decoding = 'async';
        image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', () => {
          image.remove();
          node.textContent = (entry.name || 'Member').slice(0, 2).toUpperCase();
        }, {once: true});
        node.append(image);
      } else {
        node.textContent = PROFILE_ICONS.find(icon => icon.id === entry.avatar_icon)?.symbol
          || (entry.name || 'Member').slice(0, 2).toUpperCase();
      }
      return node;
    }
    function paintRows(target, key, entries) {
      if (!entries.length) {
        target.append(el('p', 'family-status', 'No recorded scores yet.'));
        return;
      }
      const rows = el('ol', 'family-score-list');
      for (const entry of entries) {
        const row = el('li', entry.mine ? 'is-mine' : '');
        const label = el('span', 'family-score-name', entry.name + (entry.mine ? ' (you)' : ''));
        row.append(el('span', 'family-score-rank', '#' + entry.rank), avatar(entry), label,
          el('strong', '', number(entry.score) + ' ' + games[key].unit));
        if (key === 'hotrod') label.append(el('small', 'family-hot-rod-record',
          number(entry.crowns) + ' crowns · ' + number(entry.wins) + ' wins · ' + number(entry.losses) +
          ' losses · ' + number(entry.duel_wins) + ' challenge wins'));
        rows.append(row);
      }
      target.append(rows);
    }
    function paintOverview(target) {
      const rows = el('ul', 'family-game-leaders');
      for (const key of Object.keys(games).filter(key => key !== 'plates' ? key !== 'hotrod' || data?.games?.hotrod : data?.plate_access)) {
        const meta = games[key];
        const info = data?.games?.[key];
        const row = el('li');
        const leader = info?.entries?.[0];
        const sharedLead = info?.entries?.[1]?.rank === 1;
        const select = button(meta.label, () => {
          selected = key;
          preference('score-view', key);
          paintScores();
          picker.focus();
        });
        row.append(select);
        if (leader) {
          const text = sharedLead ? leader.name + ' and others tied' : leader.name;
          row.append(avatar(leader), el('span', 'family-overall-leader', text + ' · ' + number(leader.score) + ' ' + meta.unit));
        } else row.append(el('span', 'family-overall-leader', 'No scores'));
        row.append(el('small', '', info ? number(info.players) + ' played · ' + number(info.achievements) + ' ' + meta.achievement : ''));
        rows.append(row);
      }
      target.append(rows);
    }
    function paintStatus() {
      let label = busy && !data ? 'Loading standings…' : connected ? 'Live updates connected' : 'Automatic refresh';
      if (offline) label = 'Offline';
      else if (failed) label = 'Could not refresh standings';
      if (scoreTime) label += ' · Updated ' + boardTime(scoreTime);
      status.textContent = label;
    }
    function paintScores() {
      if (!active()) return;
      all.disabled = !data;
      if (!data) { paintStatus(); return; }
      const choices = ['all', ...Object.keys(games).filter(key => key !== 'plates' ? key !== 'hotrod' || data.games?.hotrod : data.plate_access)];
      const optionKey = choices.join(',');
      if (optionKey !== lastInput) {
        picker.replaceChildren(...choices.map(key => scoreOption(key, games[key]?.label || 'All Games')));
        lastInput = optionKey;
      }
      if (!choices.includes(selected)) selected = 'all';
      picker.value = selected;
      list.replaceChildren();
      dialogBody.replaceChildren();
      if (selected === 'all') paintOverview(list);
      else {
        const entries = data.games?.[selected]?.entries || [];
        const rows = entries.slice(0, 3);
        const mine = entries.find(entry => entry.mine);
        if (mine && !rows.includes(mine)) rows.push(mine);
        paintRows(list, selected, rows);
        if (!mine && entries.length) list.append(el('p', 'family-status', 'You have no ranked result yet.'));
      }
      if (dialog.open) {
        for (const key of (selected === 'all' ? choices.slice(1) : [selected])) {
          dialogBody.append(el('h3', '', games[key].label));
          paintRows(dialogBody, key, data.games?.[key]?.entries || []);
        }
      }
      paintButtonSummaries();
      paintStatus();
    }
    function paintButtonSummaries() {
      if (!data || !active()) return;
      for (const [key, meta] of Object.entries(games)) {
        const entry = document.getElementById(meta.entry);
        if (!entry) continue;
        const info = data.games?.[key];
        const mine = info?.entries?.find(row => row.mine);
        const text = {
          hotrod: mine ? number(mine.score) + ' career points · ' + number(mine.wins) + ' wins' : '',
          mahjong: 'Level ' + number(data.mahjong_level) + (mine ? ' · Best ' + number(mine.score) : ''),
          wordle: number(data.wordle_today) + ' pts today · ' + (data.wordle_solved ? 'Team solved' : number(data.wordle_attempts) + ' team guesses'),
          wordquest: 'Level ' + number(data.quest_level) + ' · ' + number(data.quest_xp) + ' XP',
          plates: data.plate_access && mine ? number(mine.score) + ' pts · Rank ' + mine.rank + (info.entries[0]?.rank === info.entries[1]?.rank ? ' · Tied' : ' · Leader ' + info.entries[0]?.name) : ''
        }[key];
        let detail = entry.querySelector('.family-entry-stat');
        if (!detail) {
          detail = el('small', 'family-entry-stat');
          const holder = entry.querySelector('.mahjong-entry-copy, .plate-entry-copy') || entry;
          holder.append(detail);
        }
        if (detail.textContent !== text) detail.textContent = text;
      }
    }
    async function updatePhotos(result) {
      const entries = Object.values(result.games || {}).flatMap(game => game.entries||[]);
      const paths = [...new Set(entries.map(entry => entry.avatar_path).filter(Boolean))];
      const ids = entries.map(entry=>entry.avatar_member).filter(Boolean);
      const [photos,projections]=await Promise.all([
        Promise.all(paths.filter(path=>!images.has(path)).map(async path=>[path,await getAvatarPhoto(client,path)])),
        avatarProjections(client,ids)
      ]);
      const painted=await Promise.all([...projections].map(async ([id,recipe])=>[id,await cacheAvatarCharacter(id,recipe)]));
      if (!active()) return '';
      const next=new Map(painted.filter(([,url])=>url).map(([id,url])=>[id,{url}]));
      portraits=next;
      for (const [path,url] of photos) if (url) images.set(path, {url});
      return JSON.stringify([...projections]);
    }
    async function refreshScores(manual = false) {
      if (!active()) return;
      if (busy) { dirty = true; return; }
      busy = true;
      refreshButton.disabled = true;
      if (manual || !data) status.textContent = 'Refreshing standings…';
      try {
        const [shared, racing] = await Promise.all([
          rpc('community_family_scoreboard'),
          Promise.resolve().then(() => client.rpc('community_hot_rod_standings')).catch(() => ({}))
        ]);
        if (shared.error) throw shared.error;
        const result = {...shared.data, games:{...shared.data.games}};
        if (racing.data && !racing.error) result.games.hotrod = racing.data;
        else if (data?.games?.hotrod && !['42501','PGRST301'].includes(racing.error?.code)) {
          result.games.hotrod = data.games.hotrod;
        }
        if (!active()) return;
        data = result;
        scoreTime = result.as_of;
        offline = false;
        failed = false;
        const displayed = {...result};
        delete displayed.as_of;
        const portraitSignature = await updatePhotos(result);
        const signature = JSON.stringify(displayed)+portraitSignature;
        if (!active()) return;
        if (lastScore !== signature) {
          lastScore = signature;
          paintScores();
        } else paintStatus();
      } catch (error) {
        if (!active()) return;
        failed = true;
        if (error?.code === '42501' || error?.code === 'PGRST301') {
          data = null;
          images.clear();portraits.clear();
          scoreTime = '';
          lastScore = '';
          list.replaceChildren();
          dialogBody.replaceChildren();
          if (dialog.open) dialog.close();
          all.disabled = true;
        }
        paintStatus();
      } finally {
        busy = false;
        refreshButton.disabled = false;
        if (dirty && active()) { dirty = false; schedule('scores'); }
      }
    }
    function onAvatarUpdated(event){
      const path=event?.detail?.path;
      const url=cachedAvatarPhoto(path);
      if(path&&url){
        images.set(path,{url});
        lastScore='';
        paintScores();
      }
      schedule('scores');
    }
    const onHotRodSaved = () => schedule('scores');
    window.addEventListener('family-avatar-updated',onAvatarUpdated);
    document.addEventListener('family-hot-rod-race-saved',onHotRodSaved);
    function schedule(topic) {
      if (!active() || !topics.includes(topic)) return;
      clearTimeout(retryTimers.get(topic));
      if (document.hidden) return;
      retryTimers.set(topic, setTimeout(() => {
        retryTimers.delete(topic);
        if (topic === 'scores') {
          void refreshScores();
          if (data?.plate_access) document.dispatchEvent(new Event('family-plate-scores-changed'));
          document.dispatchEvent(new Event('family-hot-rod-scores-changed'));
          document.dispatchEvent(new Event('family-game-progress'));
        } else if (topic === 'fridge') void fridge.refresh();
        else void calendar.refresh();
      }, 180));
    }
    function resync() {
      if (!active() || document.hidden) return;
      topics.forEach(schedule);
      lastBackgroundRefresh = Date.now();
    }
    function connect() {
      if (channel || !active() || !navigator.onLine) return;
      const realtime = client.channel('family-board-revisions');
      channel = realtime;
      realtime.on('postgres_changes', {
        schema: 'public', table: 'community_family_revisions', event: 'UPDATE'
      }, change => schedule(change.new?.topic));
      realtime.subscribe(state => {
        if (!active() || channel !== realtime) return;
        connected = state === 'SUBSCRIBED';
        if (connected) resync();
        else reconnectAt = Date.now() + 10000;
        paintStatus();
      });
    }
    function onOnline() {
      offline = false;
      if (!connected && channel) reconnectAt = Date.now();
      connect();
      resync();
      paintStatus();
    }
    function onOffline() { offline = true; connected = false; paintStatus(); }
    function onVisible() { if (!document.hidden) { connect(); resync(); } }
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    const observer = new MutationObserver(paintButtonSummaries);
    observer.observe(board.querySelector('.community-main'), {childList: true});
    const timer = setInterval(() => {
      if (!active() || document.hidden || !navigator.onLine) return;
      if (!connected && channel && reconnectAt && Date.now() > reconnectAt) {
        const stale = channel;
        channel = null;
        reconnectAt = Date.now() + 10000;
        void client.removeChannel(stale).finally(() => connect());
      } else connect();
      if (Date.now() - lastBackgroundRefresh > (connected ? 300000 : 45000)) resync();
    }, 10000);
    sessionCleanup = () => {
      clearInterval(timer);
      observer.disconnect();
      retryTimers.forEach(clearTimeout);
      retryTimers.clear();
      window.removeEventListener('hashchange', launchHash);
      window.removeEventListener('family-avatar-updated',onAvatarUpdated);
      document.removeEventListener('family-hot-rod-race-saved',onHotRodSaved);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      fridge.dispose();
      calendar.dispose();
      if (dialog.open) dialog.close();
      if (channel) { const lastChannel = channel; channel = null; void client.removeChannel(lastChannel); }
    };
    connect();
    resync();
    requestAnimationFrame(launchHash);
  }

  return {setAccess};
}
