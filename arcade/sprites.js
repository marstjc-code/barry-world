/* Barry's Paper Round: sprites. Everything is drawn here, pixel by pixel, onto small off-screen canvases (no photographs, no
   screenshots). The one borrowed picture is the Small Plates shop front for the finish line, taken from the world's own plate. */
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ctx = c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; };
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const P = (g, x, y, c) => R(g, x, y, 1, 1, c);
function line(g, x0, y0, x1, y1, c, t = 1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (;;) { R(g, x0, y0, t, t, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function disc(g, cx, cy, r, c) { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); R(g, cx - w, cy + y, w * 2 + 1, 1, c); } }
function ring(g, cx, cy, r, c) { for (let a = 0; a < 64; a++) P(g, Math.round(cx + Math.cos(a / 64 * 6.2832) * r), Math.round(cy + Math.sin(a / 64 * 6.2832) * r), c); }
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

/* ---- a 3x5 pixel font ---- */
const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111',
  J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  '.': '000000000000010', '!': '010010010000010', '/': '001001010100100', "'": '010010000000000', '-': '000000111000000', '+': '000010111010000', ' ': '000000000000000' };
export function text(g, str, x, y, c, outline) {
  str = String(str).toUpperCase(); const w = str.length * 4 - 1; x = Math.round(x - w / 2);
  const put = (ox, oy, col) => { g.fillStyle = col; [...str].forEach((ch, i) => { const b = F[ch] || F[' ']; for (let k = 0; k < 15; k++) if (b[k] === '1') g.fillRect(x + i * 4 + k % 3 + ox, y + (k / 3 | 0) + oy, 1, 1); }); };
  if (outline) for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) put(ox, oy, outline);
  put(0, 0, c);
}

const INK = '#20202e', SKIN = '#e8b592', WHITE = '#f4f1ea', SHADE = '#cfcbd6', RED = '#d43a30', APRON = '#7a1f2b';
/* Barry on his red delivery bike: bald, big black moustache, chef whites, newspaper crate and one bacon butty. 36x36, feet at (16,34). */
function barry(frame, throwing) {
  const c = cv(36, 36), g = ctx(c);
  for (const [cx, cy] of [[8, 28], [27, 28]]) {               // wheels
    ring(g, cx, cy, 6, INK); ring(g, cx, cy, 5, '#3a3a4c');
    if (frame) { line(g, cx - 3, cy - 3, cx + 3, cy + 3, '#9a9db3'); line(g, cx - 3, cy + 3, cx + 3, cy - 3, '#9a9db3'); }
    else { line(g, cx - 4, cy, cx + 4, cy, '#9a9db3'); line(g, cx, cy - 4, cx, cy + 4, '#9a9db3'); }
    P(g, cx, cy, '#e6e6f0');
  }
  line(g, 8, 28, 16, 28, RED); line(g, 16, 28, 13, 19, RED); line(g, 13, 19, 24, 19, RED); line(g, 24, 19, 27, 28, RED); line(g, 16, 28, 24, 20, '#a82a24');
  line(g, 8, 28, 12, 20, RED); line(g, 24, 19, 25, 15, INK); R(g, 23, 15, 5, 1, INK); R(g, 10, 18, 6, 1, INK);
  R(g, 1, 20, 12, 1, '#5a4030'); R(g, 1, 14, 11, 6, '#9b6a3c'); R(g, 1, 16, 11, 1, '#7a4f2a'); R(g, 1, 19, 11, 1, '#7a4f2a'); R(g, 6, 14, 1, 6, '#7a4f2a');   // crate on the rack
  for (const x of [2, 5, 8]) { R(g, x, 11, 2, 3, '#f3ead3'); P(g, x, 12, '#9a8f86'); }                       // rolled papers
  R(g, 3, 8, 6, 1, '#d99a4e'); R(g, 3, 9, 6, 1, '#c8504a'); R(g, 2, 10, 8, 1, '#d99a4e'); P(g, 4, 9, '#f1e3a0');   // the bacon butty
  // legs, pedalling
  if (frame) { line(g, 15, 20, 17, 25, '#2d2d3a', 2); line(g, 17, 25, 14, 30, '#2d2d3a', 2); R(g, 13, 31, 4, 1, INK); }
  else { line(g, 15, 20, 19, 24, '#2d2d3a', 2); line(g, 19, 24, 17, 28, '#2d2d3a', 2); R(g, 16, 30, 4, 1, INK); }
  // body: chef whites, burgundy apron
  R(g, 12, 9, 9, 11, WHITE); R(g, 12, 9, 2, 11, SHADE); R(g, 11, 12, 1, 6, SHADE); R(g, 21, 11, 1, 7, WHITE);
  P(g, 17, 11, '#9a9db3'); P(g, 17, 14, '#9a9db3'); P(g, 19, 11, '#9a9db3'); P(g, 19, 14, '#9a9db3');
  R(g, 13, 17, 9, 3, APRON); R(g, 10, 16, 3, 2, WHITE); P(g, 9, 17, WHITE);                                   // apron and its bow at the back
  // head: bald and shiny
  disc(g, 17, 4, 4, SKIN); R(g, 15, 1, 2, 1, '#fbe0c8'); P(g, 13, 5, '#d99a7c'); P(g, 20, 4, INK); P(g, 22, 5, '#e89a86'); R(g, 14, 8, 6, 1, '#d99a7c');
  R(g, 18, 6, 5, 2, INK); P(g, 23, 5, INK); P(g, 23, 7, INK); R(g, 19, 3, 2, 1, INK);                         // handlebar moustache and brow
  if (throwing) { line(g, 13, 10, 8, 4, WHITE, 2); R(g, 6, 2, 3, 3, SKIN); line(g, 19, 11, 24, 15, WHITE, 2); R(g, 24, 14, 2, 2, SKIN); }
  else { line(g, 18, 11, 23, 14, WHITE, 2); R(g, 24, 14, 2, 2, SKIN); }
  return c;
}
function paper(f) {
  const c = cv(7, 7), g = ctx(c), A = '#f3ead3', B = '#9a8f86';
  if (f === 0) { R(g, 0, 2, 7, 3, A); R(g, 3, 2, 1, 3, B); } else if (f === 2) { R(g, 2, 0, 3, 7, A); R(g, 2, 3, 3, 1, B); }
  else for (let i = 0; i < 6; i++) { const x = f === 1 ? i : 5 - i; R(g, x, i, 2, 2, i === 2 || i === 3 ? B : A); }
  return c;
}
function gull(f) {
  const c = cv(24, 14), g = ctx(c);
  R(g, 8, 6, 9, 4, '#ffffff'); R(g, 16, 5, 4, 3, '#ffffff'); R(g, 20, 6, 3, 1, '#f2b53a'); P(g, 18, 6, INK); R(g, 5, 7, 4, 2, '#e9e9f2');
  if (f) { line(g, 12, 6, 6, 1, '#c9cbd9', 2); line(g, 6, 1, 3, 0, INK); line(g, 13, 6, 17, 1, '#c9cbd9', 2); }
  else { line(g, 12, 8, 6, 12, '#c9cbd9', 2); line(g, 6, 12, 3, 13, INK); line(g, 13, 8, 17, 12, '#c9cbd9', 2); }
  return c;
}
function burst(r, cols) { const c = cv(24, 24), g = ctx(c); for (let a = 0; a < 8; a++) { const x = Math.round(12 + Math.cos(a * 0.785) * r), y = Math.round(12 + Math.sin(a * 0.785) * r); line(g, 12, 12, x, y, cols[a % cols.length]); } disc(g, 12, 12, Math.max(1, r >> 2), '#ffffff'); return c; }
function spark(r) { const c = cv(11, 11), g = ctx(c); R(g, 5 - r, 5, r * 2 + 1, 1, '#fff3c9'); R(g, 5, 5 - r, 1, r * 2 + 1, '#fff3c9'); P(g, 5, 5, '#ffffff'); return c; }

const DOOR = { red: ['#c8362e', '#8f1f22'], teal: ['#1f9aa0', '#136a74'], mustard: ['#e0b02c', '#a87c12'], green: ['#2f8a4e', '#1d5c36'] };
/* One terraced house front, flat: 120 wide, 52 tall. Flint wall, brick trim, a window with lace, a coloured door. Subscribers get a
   cream newspaper symbol above the number plate. */
function house(h) {
  const c = cv(120, 52), g = ctx(c), r = rng(h.k * 97 + 5), [d1, d2] = DOOR[h.colour];
  R(g, 0, 0, 120, 52, '#8d7f8f');
  for (let i = 0; i < 900; i++) P(g, r() * 120 | 0, r() * 52 | 0, ['#b9aa9c', '#6f6377', '#d3c6b0', '#a08f8a'][r() * 4 | 0]);
  for (const x of [0, 116]) { R(g, x, 0, 4, 52, '#b5533c'); for (let y = 3; y < 52; y += 4) R(g, x, y, 4, 1, '#7c3a30'); }
  R(g, 0, 49, 120, 3, '#5b4a63'); R(g, 0, 0, 120, 2, '#4a3d5c');
  // window
  R(g, 12, 9, 46, 3, '#c0603f'); R(g, 13, 12, 44, 28, '#efe2c2'); R(g, 15, 14, 40, 24, '#2b2f55');
  for (let y = 14; y < 38; y += 2) for (let x = 15 + (y % 4 ? 1 : 0); x < 55; x += 2) if (y < 22 || x < 23 || x > 46) P(g, x, y, '#e8ecf6');
  R(g, 34, 14, 2, 24, '#efe2c2'); R(g, 15, 25, 40, 2, '#efe2c2');
  R(g, 13, 40, 44, 3, '#7a4f2a'); for (let x = 15; x < 55; x += 3) { P(g, x, 39, '#3d8a4a'); P(g, x + 1, 38, r() > 0.4 ? '#e2413c' : '#f08ab0'); }
  // door, with its cream surround
  R(g, 69, 9, 31, 43, '#efe2c2'); R(g, 71, 8, 27, 1, '#efe2c2'); R(g, 72, 12, 25, 40, d1); R(g, 72, 12, 25, 1, d2);
  R(g, 75, 15, 8, 12, d2); R(g, 86, 15, 8, 12, d2); R(g, 75, 34, 8, 14, d2); R(g, 86, 34, 8, 14, d2);
  ring(g, 84, 22, 2, '#e6b84f'); R(g, 80, 30, 9, 2, '#e6b84f'); P(g, 93, 31, '#e6b84f'); R(g, 69, 50, 31, 2, '#cfc0a8');
  // number plate, and the newspaper symbol for subscribers
  R(g, 103, 24, 12, 9, '#efe2c2'); R(g, 103, 24, 12, 1, '#b9aa9c'); text(g, h.number, 109.5, 26, INK);
  if (h.sub) { R(g, 102, 10, 14, 11, INK); R(g, 103, 11, 12, 9, '#fff3c9'); R(g, 104, 12, 10, 2, INK); for (const y of [15, 17]) { R(g, 104, y, 4, 1, '#8a7f76'); R(g, 109, y, 5, 1, '#8a7f76'); } R(g, 104, 19, 10, 0, INK); }
  if (h.k % 3 === 0) { R(g, 104, 44, 10, 6, '#b5533c'); for (let i = 0; i < 26; i++) P(g, 102 + (r() * 14 | 0), 36 + (r() * 9 | 0), r() > 0.35 ? '#f08ab0' : '#3d8a4a'); }
  return c;
}
/* The slate roof above a house: 130 wide (it leans back and to the left), 18 tall. */
function roof(seed) {
  const c = cv(130, 18), g = ctx(c), r = rng(seed);
  for (let y = 0; y < 18; y++) { const x = Math.round(y * 10 / 17); R(g, x, y, 120, 1, y % 3 === 2 ? '#3c3760' : '#4a4470'); if (y % 3 !== 2) for (let i = x + (y % 2 ? 4 : 0); i < x + 120; i += 8) P(g, i, y, '#3c3760'); }
  for (let i = 0; i < 40; i++) { const y = 2 + (r() * 14 | 0); R(g, Math.round(y * 10 / 17) + (r() * 116 | 0), y, 2, 1, '#c9a23a'); }
  R(g, 0, 0, 120, 2, '#c8643a'); for (let x = 2; x < 120; x += 6) P(g, x, 1, '#8f3f26'); R(g, 10, 17, 120, 1, '#2a2648');
  return c;
}
function chimney() { const c = cv(12, 16), g = ctx(c); R(g, 1, 5, 10, 11, '#b5533c'); for (let y = 7; y < 16; y += 3) R(g, 1, y, 10, 1, '#7c3a30'); R(g, 0, 4, 12, 2, '#8f3f26'); R(g, 2, 0, 3, 4, '#c8643a'); R(g, 7, 0, 3, 4, '#c8643a'); return c; }
function seawall() {
  const c = cv(120, 52), g = ctx(c);
  R(g, 0, 38, 120, 14, '#cdbfd0'); R(g, 0, 36, 120, 2, '#e6dbe8'); R(g, 0, 49, 120, 3, '#9a86a8'); for (let x = 10; x < 120; x += 24) R(g, x, 39, 1, 10, '#b3a4b8');
  R(g, 0, 22, 120, 1, '#2a2648'); R(g, 0, 29, 120, 1, '#2a2648'); for (let x = 4; x < 120; x += 12) R(g, x, 21, 1, 15, '#2a2648');
  return c;
}
function wall(seed) { const c = cv(40, 11), g = ctx(c), r = rng(seed); R(g, 0, 3, 40, 8, '#b5533c'); for (let y = 5; y < 11; y += 3) R(g, 0, y, 40, 1, '#7c3a30'); R(g, 0, 2, 40, 1, '#efe2c2'); for (let i = 0; i < 16; i++) P(g, r() * 40 | 0, r() * 3 | 0, r() > 0.5 ? '#f08ab0' : '#3d8a4a'); return c; }
function lamp() { const c = cv(13, 46), g = ctx(c); R(g, 6, 12, 2, 34, INK); R(g, 4, 43, 6, 3, INK); R(g, 5, 11, 4, 1, INK); R(g, 3, 3, 8, 8, '#ffd27a'); R(g, 4, 4, 6, 6, '#fff3c9'); R(g, 3, 3, 1, 8, INK); R(g, 10, 3, 1, 8, INK); R(g, 2, 2, 10, 1, INK); R(g, 4, 0, 6, 2, INK); return c; }
function floatSide() {
  const c = cv(64, 30), g = ctx(c);
  R(g, 0, 2, 64, 3, '#fff8e6'); R(g, 0, 5, 64, 1, '#cbbf9f'); R(g, 0, 16, 64, 8, '#f2ead2'); R(g, 0, 23, 64, 1, '#cbbf9f');
  for (const x of [1, 30, 46, 62]) R(g, x, 5, 1, 11, '#cbbf9f');
  for (let x = 4; x < 44; x += 4) { R(g, x, 10, 2, 5, '#ffffff'); P(g, x, 9, '#4f8fd9'); P(g, x + 1, 9, '#4f8fd9'); }
  R(g, 3, 14, 42, 2, '#9b6a3c'); R(g, 48, 7, 13, 8, '#2b3a66'); R(g, 49, 8, 5, 3, '#9fc6e8'); R(g, 0, 18, 2, 3, '#d43a30');
  for (const x of [12, 50]) { disc(g, x, 25, 4, INK); disc(g, x, 25, 1, '#9a9db3'); }
  return c;
}
function binSide() { const c = cv(12, 18), g = ctx(c); R(g, 1, 3, 10, 13, '#3f8f5a'); R(g, 1, 3, 2, 13, '#2f6f45'); R(g, 0, 1, 12, 3, '#2f6f45'); R(g, 0, 1, 12, 1, '#5fb07a'); R(g, 2, 16, 2, 2, INK); R(g, 8, 16, 2, 2, INK); R(g, 4, 8, 4, 1, '#2f6f45'); return c; }

/* Sky, sun, sea and the pier, drawn once per screen shape. */
export function backdrop(W, H, hz) {
  const c = cv(W, H), g = ctx(c), sky = ['#5b4b9a', '#7a52a6', '#a2589f', '#c8609c', '#e97a8c', '#f59a6a', '#ffbf6f', '#ffd98a'];
  for (let y = 0; y < hz; y++) R(g, 0, y, W, 1, sky[Math.min(7, y / hz * 8 | 0)]);
  const r = rng(7); for (let i = 0; i < 9; i++) { const y = 6 + (r() * (hz - 22) | 0), x = r() * W | 0, w = 18 + (r() * 40 | 0); R(g, x, y, w, 2, '#f7a8b8'); R(g, x + 4, y - 1, w - 10, 1, '#ffc9c0'); }
  const sx = W * 0.2 | 0; disc(g, sx, hz, 15, '#ffe9a8'); disc(g, sx, hz, 11, '#fff7d6');
  const sea = ['#1f8f9f', '#27a3a8', '#2fb7b0', '#55c6b8', '#7ad2c0'];
  for (let y = hz; y < H; y++) R(g, 0, y, W, 1, sea[Math.min(4, (y - hz) / 26 | 0)]);
  for (let i = 0; i < 90; i++) { const y = hz + 2 + (r() * (H - hz - 4) | 0); R(g, r() * W | 0, y, 3 + (r() * 7 | 0), 1, '#d8f4ee'); }
  for (let y = hz; y < hz + 40; y += 2) R(g, sx - 8 + (y % 4 ? 2 : 0), y, 16 - ((y - hz) / 4 | 0), 1, '#ffe9a8');
  const py = hz - 9, x0 = W * 0.3 | 0, x1 = W * 0.78 | 0, PI = '#3a2f66';
  R(g, x0, py, x1 - x0, 2, PI); for (let x = x0 + 2; x < x1; x += 6) R(g, x, py + 2, 1, 9, PI); for (let x = x0; x < x1; x += 3) P(g, x, py - 2, PI); R(g, x0, py - 3, x1 - x0, 1, PI);
  const px = W * 0.56 | 0; R(g, px - 14, py - 9, 28, 7, PI); disc(g, px, py - 9, 6, PI); R(g, px, py - 21, 1, 7, PI); R(g, px + 1, py - 21, 4, 2, '#e97a8c');
  R(g, px - 24, py - 6, 9, 4, PI); R(g, px + 16, py - 6, 9, 4, PI); for (let x = px - 12; x < px + 13; x += 4) P(g, x, py - 6, '#ffd98a');
  return c;
}

export function makeSprites(houses) {
  const S = { barry: [barry(0), barry(1)], barryThrow: barry(0, 1), paper: [0, 1, 2, 3].map(paper), gull: [gull(0), gull(1)],
    impact: [burst(5, ['#ffd27a', '#ffffff']), burst(8, ['#ffd27a', '#e2413c']), burst(11, ['#e2413c', '#ffd27a'])], spark: [spark(2), spark(4), spark(5)],
    house: houses.map(house), roof: [roof(3), roof(11), roof(29)], chimney: chimney(), seawall: seawall(), wall: [wall(1), wall(2)], lamp: lamp(), float: floatSide(), bin: binSide(), shop: null };
  // the finish line: the world's own Small Plates front, shrunk to pixel scale
  const fallback = cv(150, 104), fg = ctx(fallback); R(fg, 0, 0, 150, 104, '#642825'); R(fg, 0, 0, 150, 14, '#3f1513'); text(fg, 'SMALL PLATES', 75, 5, '#d7aa67'); R(fg, 14, 22, 122, 50, '#ffd396'); R(fg, 0, 100, 150, 4, '#3f1513');
  S.shop = fallback;
  const img = new Image(); img.onload = () => { const c = cv(150, 104), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 222, 262, 778, 538, 0, 0, 150, 104); S.shop = c; };
  img.src = new URL('../home/plate.jpg', import.meta.url).href;
  return S;
}
