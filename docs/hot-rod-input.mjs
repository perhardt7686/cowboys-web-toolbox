import {INPUT} from './hot-rod-racing.mjs';

const keys = Object.freeze({
  ArrowUp:INPUT.gas, KeyW:INPUT.gas, ArrowDown:INPUT.brake, KeyS:INPUT.brake,
  ArrowLeft:INPUT.left, KeyA:INPUT.left, ArrowRight:INPUT.right, KeyD:INPUT.right,
  ShiftLeft:INPUT.clutch, ShiftRight:INPUT.clutch, KeyX:INPUT.clutch,
  KeyE:INPUT.up, KeyQ:INPUT.down,
});

export function connectDrivingInput(panel, active) {
  const held = new Map();
  let shifts = 0;
  const abort = new AbortController(), signal = abort.signal;
  const listen = (target, name, handler) => target.addEventListener(name, handler, {signal});
  const pulse = new Map();
  const blank = () => { held.clear(); pulse.clear(); shifts = 0; };
  const set = (key, bit) => {
    if (bit & (INPUT.up | INPUT.down)) shifts |= bit;
    else held.set(key, bit);
  };
  listen(panel, 'keydown', event => {
    if (!active() || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target?.closest('input,select,textarea')) return;
    let bit = keys[event.code];
    if (event.code === 'Space' && !event.target?.closest('button')) {
      bit = [...held.values()].includes(INPUT.brake) ? INPUT.down : INPUT.up;
    }
    if (!bit) return;
    event.preventDefault();
    if (!event.repeat) set(event.code, bit);
  });
  listen(window, 'keyup', event => held.delete(event.code));
  listen(panel, 'pointerdown', event => {
    const pad = event.target.closest('[data-drive]');
    if (!pad || !active()) return;
    event.preventDefault();
    try { pad.setPointerCapture?.(event.pointerId); } catch { /* The contact already ended. */ }
    set(event.pointerId, INPUT[pad.dataset.drive]);
    pad.classList.add('is-held');
  });
  const release = event => {
    held.delete(event.pointerId);
    event.target.closest('[data-drive]')?.classList.remove('is-held');
  };
  for (const name of ['pointerup','pointercancel','lostpointercapture']) listen(panel, name, release);
  listen(panel, 'click', event => {
    const pad = event.target.closest('[data-drive]');
    if (!pad || !active() || event.detail !== 0) return;
    const bit = INPUT[pad.dataset.drive];
    if (bit & (INPUT.up | INPUT.down)) set(pad,bit);
    else pulse.set(pad,bit);
  });
  listen(window, 'blur', blank);
  return {
    clear() {
      blank();
      panel.querySelectorAll('.is-held').forEach(node => node.classList.remove('is-held'));
    },
    read() {
      let mask = shifts;
      for (const bit of held.values()) mask |= bit;
      shifts = 0;
      for (const bit of pulse.values()) mask |= bit;
      pulse.clear();
      return mask;
    },
    dispose() { abort.abort(); blank(); }
  };
}
