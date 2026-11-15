/* Barry's Paper Round: input. Keys and touch feed one small state: steer (-1 kerb, +1 road) and a queue of throw presses.
   A throw is counted on the press only, so holding the key or button down cannot repeat it. Steering and throwing work together. */
export function makeInput({ onPause, active }) {
  const held = new Set(); let throws = 0; const off = [];
  const on = (t, e, f, o) => { t.addEventListener(e, f, o); off.push(() => t.removeEventListener(e, f, o)); };
  const KERB = ['ArrowUp', 'KeyW'], ROAD = ['ArrowDown', 'KeyS'];
  on(window, 'keydown', e => {
    if (!active()) return;
    if ([...KERB, ...ROAD, 'Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space') { if (!e.repeat && !/^(BUTTON|A|INPUT)$/.test(e.target.tagName)) throws++; return; }
    if (e.code === 'KeyP' && !e.repeat) return onPause();
    held.add(e.code);
  });
  on(window, 'keyup', e => held.delete(e.code));
  on(window, 'blur', () => held.clear());
  const touch = { kerb: 0, road: 0 };
  function button(el, what) {                       // each button keeps its own pointer, so two thumbs work at once
    const down = e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {} el.classList.add('down'); if (what === 'throw') throws++; else touch[what] = 1; };
    const up = e => { el.classList.remove('down'); if (what !== 'throw') touch[what] = 0; };
    on(el, 'pointerdown', down); on(el, 'pointerup', up); on(el, 'pointercancel', up); on(el, 'lostpointercapture', up); on(el, 'contextmenu', e => e.preventDefault());
  }
  return {
    button,
    read() { const k = KERB.some(c => held.has(c)) || touch.kerb, r = ROAD.some(c => held.has(c)) || touch.road; const t = throws > 0; if (t) throws--; return { steer: (r ? 1 : 0) - (k ? 1 : 0), throw: t }; },
    clear() { held.clear(); throws = 0; touch.kerb = touch.road = 0; },
    destroy() { off.forEach(f => f()); },
  };
}
