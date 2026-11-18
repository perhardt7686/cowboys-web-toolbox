import {el} from './family-board-core.mjs?v=family3';

export function createHotRodBoard() {
  const board = document.getElementById('conversations');
  const main = board.querySelector('.community-main');
  let entry = null, game = null, identity = null;

  function setAccess(client, member) {
    const next = client && !board.hidden && member?.status === 'approved' ? member.user_id : null;
    if (next === identity) return;
    identity = next;
    game?.destroy();
    game = null;
    entry?.remove();
    entry = null;
    if (!next) return;

    entry = el('section', 'mahjong-game hot-rod-entry');
    entry.id = 'hot-rod';
    const button = el('button', 'mahjong-entry-button');
    button.id = 'hot-rod-entry';
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    const flag = el('span', 'mahjong-entry-icon', '🏁');
    flag.setAttribute('aria-hidden', 'true');
    const copy = el('span', 'mahjong-entry-copy');
    copy.append(el('strong', '', 'Hot Rod'), el('small', '', 'Classic 1963 · Family challenges'));
    const arrow = el('span', 'mahjong-chevron', '›');
    arrow.setAttribute('aria-hidden', 'true');
    button.append(flag, copy, arrow);
    entry.append(button);
    const anchor = document.getElementById('family-conversations');
    if (anchor?.parentElement === main) main.insertBefore(entry, anchor);
    else main.append(entry);

    let opening = false;
    button.addEventListener('click', async () => {
      if (opening || identity !== next) return;
      opening = true;
      button.setAttribute('aria-busy', 'true');
      try {
        if (!game) {
          const {makeHotRod} = await import('./hot-rod-game.mjs?v=dosfidelity1');
          if (identity !== next || !button.isConnected || board.hidden) return;
          game = makeHotRod({client, memberId:next, launcher:button});
        }
        game.open();
      } catch {
        copy.querySelector('small').textContent = 'Couldn’t load Hot Rod. Tap to retry.';
      } finally {
        opening = false;
        button.removeAttribute('aria-busy');
      }
    });
    if (location.hash === '#hot-rod') requestAnimationFrame(() => {
      if (entry?.isConnected && !board.hidden) entry.scrollIntoView({block:'center'});
    });
  }
  return {setAccess};
}
