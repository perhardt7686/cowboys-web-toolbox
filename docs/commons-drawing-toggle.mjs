/* Cowboy's Commons: Drawing Studio game button (safe wrapper, v2).
 * This leaves the original drawing engine untouched. It moves the *existing*
 * mounted drawing stage inside a collapsible game, preserving canvas state.
 * When the authorized session's family zone is removed, it tears down the
 * detached studio too, preventing cross-account display of old drawings.
 */
(() => {
  'use strict';
  const gameId = 'drawing-studio-game-root';
  const zoneId = 'commons-family-zone';
  const stageId = 'commons-art';
  const contentId = 'drawing-studio-inside';
  const toggleId = 'drawing-studio-toggle';
  let observer;
  let scheduled = false;
  let boundZone = null;

  function makeGame(stage) {
    const game = document.createElement('section');
    game.id = gameId;
    game.className = 'mahjong-game drawing-studio-game';
    game.setAttribute('aria-label', 'Drawing Studio');

    const button = document.createElement('button');
    button.id = toggleId;
    button.className = 'mahjong-entry-button';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', contentId);
    button.innerHTML = '<span class="mahjong-entry-icon" aria-hidden="true">🎨</span>' +
      '<span class="mahjong-entry-copy"><strong>Drawing Studio</strong>' +
      '<small>Paint, sketch, layers &amp; private saved art</small></span>' +
      '<span class="mahjong-chevron" aria-hidden="true">▾</span>';

    const content = document.createElement('div');
    content.id = contentId;
    content.hidden = true;
    content.append(stage);
    game.append(button, content);

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      content.hidden = !open;
      // Do not remove/rebuild the canvas on close. All drawing layers, undo
      // stack, and on-device artwork remain in the original studio instance.
    });
    return game;
  }

  function sync() {
    const board = document.getElementById('conversations');
    const zone = document.getElementById(zoneId);
    let existing = document.getElementById(gameId);
    if (!board || board.hidden || !zone) {
      // The original community module destroys the family zone at logout;
      // our stage has been moved out, so we must remove it explicitly here.
      existing?.remove();
      boundZone = null;
      return;
    }
    if (zone !== boundZone) {
      // A fresh family mount may belong to another approved member. Never
      // reuse the previous member's detached canvas across that boundary.
      existing?.remove();
      existing = null;
      boundZone = zone;
    }
    const main = board.querySelector('.community-main');
    const stage = document.getElementById(stageId);
    const drawingHost = document.getElementById('commons-drawing-root');
    if (!main || !stage || !drawingHost || drawingHost.dataset.ready !== 'true') return;

    let game = existing;
    if (!game) {
      game = makeGame(stage);
      main.append(game);
    } else {
      const container = game.querySelector('#' + contentId);
      if (container && stage.parentElement !== container) container.append(stage);
    }

    // Place alongside the other Commons game buttons, after w0rdle or Quest.
    const anchors = ['letter-lock-root', 'word-game-root', 'mahjong-root', 'plate-game-root'];
    const anchor = anchors.map(id => document.getElementById(id))
      .find(el => el && el.parentElement === main && el !== game);
    if (anchor) {
      if (game.parentElement !== main || game.previousElementSibling !== anchor) anchor.after(game);
    } else if (game.parentElement !== main) main.prepend(game);

    // Original family zone now has no visible children; keep it as the
    // existing module's session sentinel, without leaving a blank gap.
    if (!zone.contains(document.getElementById('commons-word')) && !zone.contains(stage)) {
      if (!zone.hidden) zone.hidden = true;
      if (zone.style.display !== 'none') zone.style.display = 'none';
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      sync();
    });
  }
  function start() {
    const body = document.body;
    if (!body || !body.classList.contains('community-page')) return;
    observer = new MutationObserver(schedule);
    observer.observe(body, {subtree: true, childList: true,
      attributes: true, attributeFilter: ['hidden', 'data-ready']});
    // All other game modules add and rearrange their buttons asynchronously.
    // Reuse the existing canvas while settling those layout changes.
    schedule();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once: true});
  } else start();
})();
