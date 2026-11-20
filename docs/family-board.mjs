import {el} from './family-board-core.mjs?v=family3';
import {makeFridge} from './family-fridge.mjs?v=family3';
import {makeCalendar} from './family-calendar.mjs?v=calendar6';

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
    window.dispatchEvent(new Event('family-unified-scoreboard-clear'));
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
    const active = () => membership === memberId && host.isConnected && !host.hidden && !board.hidden;

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
    const gamesTitle = el('h2', 'family-games-title', 'Family Games');
    gamesTitle.id = 'family-games';
    gamesTitle.tabIndex = -1;
    const celebration = el('div');
    celebration.id = 'avatar-lobby-celebration';
    // The one FAMILY FUN marquee owns all scoreboard UI.
    host.append(nav, celebration, gamesTitle);
    // One family character product: the new Mystery Crew Creator.
    // The previous Avatar Studio rewards showcase is retired.
    const crewLink=el('a','family-mystery-crew-showcase');
    crewLink.href='mystery-crew-creator.html';
    crewLink.setAttribute('aria-label','Open Mystery Crew Creator to customize characters, pets and unlockables');
    const crewSymbol=el('span','family-mystery-crew-symbol','✦');
    crewSymbol.setAttribute('aria-hidden','true');
    const crewCopy=el('span','family-mystery-crew-text');
    crewCopy.append(el('strong','','Mystery Crew Creator'),
      el('small','','Your characters · Pets · Outfits · Unlockables'));
    const crewArrow=el('span','family-mystery-crew-arrow','Open creator ›');
    crewLink.append(crewSymbol,crewCopy,crewArrow);
    gamesTitle.after(crewLink);
    // Keep family announcements in their permanent DOM home across sign-out.
    const sidebar = board.querySelector('.community-sidebar');
    document.getElementById('family-conversations')?.after(sidebar);

    let data = null, connected = false, busy = false, dirty = false;
    let reconnectAt = 0, lastBackgroundRefresh = 0;
    const retryTimers = new Map();

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
    async function refreshScores() {
      if (!active()) return;
      if (busy) { dirty = true; return; }
      busy = true;
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
        // Send only approved-member, server-returned rankings to the one marquee.
        // Other game modules own their ranking metrics; never compare mixed score units.
        const rankGames = {};
        for(const [key,info] of Object.entries(result.games||{})){
          if(key==='plates'&&!result.plate_access)continue;
          rankGames[key]={entries:(info?.entries||[]).slice(0,12).map(entry=>({
            rank:entry.rank,name:entry.name,score:entry.score,mine:Boolean(entry.mine)
          }))};
        }
        window.dispatchEvent(new CustomEvent('family-unified-scoreboard',{
          detail:{member:memberId,games:rankGames,plateAccess:result.plate_access,asOf:result.as_of}
        }));
        // Activity is sourced from saved server-side play events. It is not
        // inferred from opening the scoreboard, which would fake recency.
        void Promise.resolve().then(()=>client.rpc('community_family_arcade_activity'))
          .then(({data:activity,error})=>{
            if(!active()||error||!activity?.games)return;
            window.dispatchEvent(new CustomEvent('family-arcade-recent-activity',{
              detail:{member:memberId,games:activity.games,asOf:activity.asOf}
            }));
          }).catch(()=>{ /* Leave verified rankings intact if activity is unavailable. */ });
        paintButtonSummaries();
        // Read-only adapters for the other two ranked family games. No scores are
        // fabricated or compared between incompatible metrics.
        void Promise.all([
          Promise.resolve().then(()=>client.rpc('community_dash_state')).catch(()=>({error:true})),
          Promise.resolve().then(()=>client.rpc('community_boardride_state')).catch(()=>({error:true}))
        ]).then(([dash,sky])=>{
          if(!active())return;
          if(!dash.error&&Array.isArray(dash.data?.leaders)){
            window.dispatchEvent(new CustomEvent('family-arcade-game-rankings',{detail:{
              member:memberId,game:'dashforge',entries:dash.data.leaders.map((entry,index)=>({
                rank:index+1,name:entry.name,score:entry.player_points,mine:entry.user_id===memberId
              }))
            }}));
          }
          if(!sky.error&&Array.isArray(sky.data?.leaders)){
            window.dispatchEvent(new CustomEvent('family-arcade-game-rankings',{detail:{
              member:memberId,game:'skyboard',entries:sky.data.leaders.map((entry,index)=>({
                rank:index+1,name:entry.name,score:entry.points,mine:entry.user_id===memberId
              }))
            }}));
          }
        });
      } catch (error) {
        if (!active()) return;
        if (error?.code === '42501' || error?.code === 'PGRST301') {
          data = null;
          window.dispatchEvent(new Event('family-unified-scoreboard-clear'));
        }
      } finally {
        busy = false;
        if (dirty && active()) { dirty = false; schedule('scores'); }
      }
    }
    const onHotRodSaved = () => schedule('scores');
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
      });
    }
    function onOnline() {
      if (!connected && channel) reconnectAt = Date.now();
      connect();
      resync();
    }
    function onOffline() { connected = false; }
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
      document.removeEventListener('family-hot-rod-race-saved',onHotRodSaved);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      fridge.dispose();
      calendar.dispose();
      if (channel) { const lastChannel = channel; channel = null; void client.removeChannel(lastChannel); }
    };
    connect();
    resync();
    requestAnimationFrame(launchHash);
  }

  return {setAccess};
}
