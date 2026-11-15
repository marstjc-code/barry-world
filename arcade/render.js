/* Barry's Paper Round: rendering. A fixed three-quarter camera: the street rises from lower left to upper right, houses above the
   kerb, road below, sea and pier above the roofs. Barry stays put on screen; the street moves past him. Canvas 2D, whole pixels only. */
import { route as R } from './route.js';
import { flight, paperAt, onMat } from './sim.js';
import { makeSprites, backdrop, text } from './sprites.js';
const C = R.C, D0 = 34;

export function makeRenderer(canvas) {
  const g = canvas.getContext('2d'); const S = makeSprites(R.houses);
  let W = 480, H = 270, BX, BY, ax, ay, bx, by, K, sky = null, cam = 0, shake = 0;
  const fx = [];                                   // short-lived effects: {type, s, d, t0, ...}
  let throwT = -9, now = 0;

  function resize(w, h, portrait) {
    W = canvas.width = w; H = canvas.height = h; g.imageSmoothingEnabled = false;
    if (portrait) { BX = Math.round(W * 0.30); BY = Math.round(H * 0.74); ax = 0.78; ay = 0.6; bx = 0.42; by = 0.7; }   // Barry lower, more street ahead
    else { BX = Math.round(W * 0.32); BY = Math.round(H * 0.69); ax = 1; ay = 0.4; bx = 0.45; by = 0.8; }
    K = bx * ay + by * ax; sky = backdrop(W, H, Math.round(H * (portrait ? 0.3 : 0.36)));
  }
  const X = (s, d) => Math.round(BX + (s - cam) * ax + (d - D0) * bx);
  const Y = (s, d) => Math.round(BY - (s - cam) * ay + (d - D0) * by);
  const rowX = (d, y) => Math.round(BX + ((d - D0) * K - (y - BY) * ax) / ay);       // where the line "distance d from the kerb" crosses screen row y
  const R_ = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  /* a flat sprite standing along the street (a house front, a van's side): drawn a column at a time so the pixels stay crisp */
  function along(img, s, d, h = 0) {
    const x0 = X(s, d), y0 = Y(s, d) - h, n = Math.round(img.width * ax);
    if (x0 > W || x0 + n < 0) return;
    for (let c = Math.max(0, -x0); c < n && x0 + c < W; c++) g.drawImage(img, Math.min(img.width - 1, c / ax | 0), 0, 1, img.height, x0 + c, y0 - img.height - Math.round(c * ay / ax), 1, img.height);
  }
  /* a patch lying on the ground between s0..s1 and d0..d1 */
  function patch(s0, s1, d0, d1, fill) {
    const rows = Math.max(1, Math.round((d1 - d0) * by)), n = Math.max(1, Math.round((s1 - s0) * ax));
    for (let r = 0; r <= rows; r++) { const d = d0 + (d1 - d0) * r / rows, x0 = X(s0, d), y0 = Y(s0, d); if (x0 > W || x0 + n < 0) continue; for (let c = 0; c < n; c++) { const col = fill(c / n, r / rows, c, r); if (col) R_(x0 + c, y0 - Math.round(c * ay / ax), 1, 1, col); } }
  }
  /* an upright face across the road (the back of a van) */
  function across(s, d0, d1, hgt, col) { const n = Math.round((d1 - d0) * bx) + 1; for (let c = 0; c < n; c++) { const d = d0 + (d1 - d0) * c / n; R_(X(s, d), Y(s, d) - hgt, 1, hgt, col); } }
  const upright = (img, s, d, h = 0, ox = img.width >> 1) => g.drawImage(img, X(s, d) - ox, Y(s, d) - img.height - Math.round(h));
  function ellipse(x, y, rx, ry, col) { g.fillStyle = col; for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry + 0.01))); g.fillRect(x - w, y + j, w * 2 + 1, 1); } }

  function ground() {
    for (let y = 0; y < H; y++) {
      const xp = rowX(C.PAVE, y), xk = rowX(-1.5, y), xr = rowX(0.8, y), xg = rowX(3, y);
      if (xp < W) R_(Math.max(0, xp), y, Math.min(W, xk) - Math.max(0, xp), 1, '#a493b4');
      if (xk < W) R_(Math.max(0, xk), y, Math.max(1, xr - xk), 1, '#e6dbe8');
      if (xr < W) { R_(Math.max(0, xr), y, W - Math.max(0, xr), 1, '#55467a'); R_(Math.max(0, xr), y, Math.max(1, xg - xr), 1, '#463a68'); }
      const xf = rowX(112, y), xf2 = rowX(114.5, y);                    // the far kerb and the promenade beyond it
      if (xf < W) { R_(Math.max(0, xf), y, Math.max(1, xf2 - xf), 1, '#e6dbe8'); if (xf2 < W) R_(Math.max(0, xf2), y, W - Math.max(0, xf2), 1, '#a493b4'); }
    }
    const sA = cam - 260, sB = cam + 520;
    for (let s = Math.ceil(sA / 24) * 24; s < sB; s += 24) { const n = Math.round(28 * by); for (let r = 0; r < n; r++) { const d = C.PAVE + 1 + r / by; R_(X(s, d), Y(s, d), 1, 1, '#9584a6'); } }   // paving joints
    for (let s = Math.ceil(sA / 64) * 64; s < sB; s += 64) patch(s, s + 20, 55, 57, () => '#8f82b4');     // centre-line dashes
    if (R.FINISH - 70 < sB) patch(R.FINISH - 74, R.FINISH - 66, 0, 80, (u, v, c, r) => ((c >> 2) + (r >> 2)) % 2 ? '#f4f1ea' : '#20202e');
  }

  function buildings() {
    const k0 = Math.floor((cam - 300 - C.FIRST) / C.HOUSE_W), k1 = Math.ceil((cam + 560 - C.FIRST) / C.HOUSE_W);
    for (let k = k1; k >= k0; k--) {                     // far to near
      const s0 = C.FIRST + k * C.HOUSE_W, h = R.houses[k];
      if (!h) { if (Math.abs(s0 - (R.FINISH - 75)) > 100 || s0 < R.FINISH - 75) along(S.seawall, s0, C.PAVE); continue; }
      along(S.roof[k % 3], s0 - 10 / ax, C.PAVE, 52); along(S.house[k], s0, C.PAVE);
      g.drawImage(S.chimney, X(s0 + 30, C.PAVE) - 10, Y(s0 + 30, C.PAVE) - 52 - 18 - 13);
      along(S.wall[k % 2], s0 + 14, C.PAVE + 3);
    }
    along(S.shop, R.FINISH - 75, C.PAVE);                // Small Plates: the finish line
  }

  function mats(st) {
    const next = R.houses.findIndex((h, k) => st.status[k] === 'due' && h.door > st.s - 40);
    R.houses.forEach((h, k) => {
      if (!h.sub || h.door < cam - 220 || h.door > cam + 480) return;
      const live = k === next, pulse = live && (now * 4 | 0) % 2, edge = st.status[k] === 'hit' ? '#9be7a8' : pulse ? '#ffffff' : '#fff3c9';
      patch(h.door - C.MAT_HALF_S, h.door + C.MAT_HALF_S, C.MAT_D - C.MAT_HALF_D, C.MAT_D + C.MAT_HALF_D, (u, v, c, r) => (r === 0 || v === 1 || c === 0 || u >= 0.95) ? edge : (r + (c >> 1)) % 2 ? '#8a5a34' : '#74482a');
    });
  }

  function hazard(h) {
    if (h.type === 'float') { patch(h.s, h.s + h.len, h.d0, h.d1, () => '#3a2f5c'); across(h.s, h.d0, h.d1, 28, '#d9cfb4'); g.save(); g.translate(0, -28); patch(h.s, h.s + h.len, h.d0, h.d1, (u, v) => v > 0.92 ? '#cbbf9f' : '#fff8e6'); g.restore(); along(S.float, h.s, h.d1); }
    else { ellipse(X(h.s + 6, 9), Y(h.s + 6, 9), 8, 3, '#3a2f5c'); across(h.s, h.d0 + 2, h.d1, 14, '#2f6f45'); g.save(); g.translate(0, -15); patch(h.s, h.s + h.len, h.d0 + 2, h.d1, () => '#5fb07a'); g.restore(); along(S.bin, h.s, h.d1); }
  }

  function preview(st) {
    if (st.phase !== 'ride') return;
    const f = flight(st.s, st.d, st.v), k = R.houses.findIndex((h, i) => st.status[i] === 'due' && h.door - f.ls > -34 && h.door - f.ls < 190);
    if (k < 0) return;
    const on = onMat(R.houses[k], f.ls, f.ld), col = on ? '#9bffb0' : '#fff3c9';
    for (let i = 1; i < 9; i++) { const p = paperAt(f, f.T * i / 9); R_(X(p.s, p.d), Y(p.s, p.d) - Math.round(p.h) - 14, 1, 1, col); }
    const x = X(f.ls, f.ld), y = Y(f.ls, f.ld);
    for (let a = 0; a < 16; a++) R_(Math.round(x + Math.cos(a * 0.3927) * 6), Math.round(y + Math.sin(a * 0.3927) * 3), 1, 1, col);
    if (on) R_(x, y, 1, 1, '#ffffff');
  }

  function events(st) {
    for (const e of st.ev) {
      if (e.e === 'throw') throwT = now;
      if (e.e === 'hit') fx.push({ type: 'hit', s: e.s, d: e.d, t0: now }, { type: 'say', s: e.s, d: e.d, t0: now, msg: 'LOVELY.', col: '#fff3c9' });
      if (e.e === 'streak') fx.push({ type: 'say', s: e.s, d: e.d - 10, t0: now + 0.25, msg: '+150 STREAK', col: '#ffd27a' });
      if (e.e === 'miss' && e.why !== 'passed' && e.why !== 'stray') fx.push({ type: 'say', s: e.s, d: e.d, t0: now, msg: e.why === 'short' ? 'TOO FAR OUT' : e.why, col: '#ffb3c1' });
      if (e.e === 'bump') { fx.push({ type: 'bump', s: st.s, d: st.d, t0: now }, { type: 'say', s: st.s, d: st.d - 26, t0: now, msg: '-50', col: '#ff8a80' }); shake = 6; }
    }
  }

  function draw(st, t, title) {
    now = t; cam = st.s; events(st);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(sky, -Math.round((cam * 0.04) % 6), 0);
    if (shake > 0) { g.translate(shake % 2 ? 1 : -1, shake % 3 ? 1 : 0); shake--; }
    ground(); buildings(); mats(st);
    for (const p of st.landed) { if (p.s < cam - 220) continue; const hop = p.ok ? Math.max(0, Math.sin(Math.min(1, (st.t - p.t) / 0.28) * Math.PI)) * 5 : 0; g.drawImage(S.paper[0], X(p.s, p.d) - 3, Y(p.s, p.d) - 5 - Math.round(hop)); }
    // things standing on the street, far to near
    const things = [];
    for (let s = Math.ceil((cam - 240) / 360) * 360; s < cam + 520; s += 360) if (s > 60) things.push({ z: -4 * by - s * ay, f: () => upright(S.lamp, s + 40, -4) });
    for (const h of st.hazards) if (h.s + h.len > cam - 240 && h.s < cam + 520) things.push({ z: h.d1 * by - (h.s + h.len) * ay, f: () => hazard(h) });
    const blink = st.grace > 0 && (t * 14 | 0) % 2;
    things.push({ z: st.d * by - st.s * ay, f: () => {
      ellipse(X(st.s, st.d), Y(st.s, st.d), 13, 3, '#3a2f5c');
      if (!blink) g.drawImage(now - throwT < 0.2 ? S.barryThrow : S.barry[st.v > 4 ? (t * 9 | 0) % 2 : 0], X(st.s, st.d) - 16, Y(st.s, st.d) - 34);
    } });
    things.sort((a, b) => a.z - b.z).forEach(o => o.f());
    if (!title) preview(st);
    for (const p of st.papers) { const q = paperAt(p, p.age); ellipse(X(q.s, q.d), Y(q.s, q.d), 2, 1, '#3a2f5c'); g.drawImage(S.paper[(p.age * 16 | 0) % 4], X(q.s, q.d) - 3, Y(q.s, q.d) - 4 - Math.round(q.h) - 14 * (1 - p.age / p.T)); }
    // gulls: a shadow sliding into Barry's lane first, then the bird
    for (const gl of st.gulls) {
      if (gl.state === 'wait') continue;
      const p = Math.min(1, (st.s - gl.trig) / gl.lead), q = (st.s - gl.s) / 70;
      if (gl.state === 'dive') { const d = 64 + (gl.d - 64) * Math.min(1, p * 1.7); ellipse(X(gl.s, d), Y(gl.s, d), 4 + Math.round(p * 6), 2 + Math.round(p * 2), '#2e2552'); g.drawImage(S.gull[(t * 8 | 0) % 2], X(gl.s, d) - 12 + Math.round(70 * (1 - p)), Y(gl.s, d) - 12 - Math.round(130 * Math.pow(1 - p, 1.4))); }
      else if (q < 1.4) g.drawImage(S.gull[(t * 8 | 0) % 2], X(gl.s, gl.d) - 12 - Math.round(90 * q), Y(gl.s, gl.d) - 14 - Math.round(100 * q));
    }
    for (const e of fx) {
      const a = now - e.t0; if (a < 0) continue; const x = X(e.s, e.d), y = Y(e.s, e.d);
      if (e.type === 'hit' && a < 0.36) g.drawImage(S.spark[Math.min(2, a / 0.12 | 0)], x - 5, y - 12);
      if (e.type === 'bump' && a < 0.3) g.drawImage(S.impact[Math.min(2, a / 0.1 | 0)], x - 2, y - 30);
      if (e.type === 'say' && a < 0.9) text(g, e.msg, Math.max(e.msg.length * 2 + 2, Math.min(W - e.msg.length * 2 - 2, x)), y - 16 - Math.round(a * 12), e.col, '#20202e');
    }
    for (let i = fx.length - 1; i >= 0; i--) if (now - fx[i].t0 > 1) fx.splice(i, 1);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  return { resize, draw, get size() { return [W, H]; } };
}
