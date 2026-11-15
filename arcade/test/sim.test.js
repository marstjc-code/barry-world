/* Run: node site/arcade/test/sim.test.js   (plays the simulation at full speed; no browser needed) */
import { route as R } from '../route.js';
import { createState, step, flight, onMat } from '../sim.js';
const C = R.C, DT = 1 / 60; let fails = 0;
const ok = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const run = (st, secs, inp = () => ({})) => { const evs = []; for (let i = 0; i < secs * 60; i++) { step(st, DT, inp(st, i) || {}); evs.push(...st.ev.map(e => ({ ...e }))); } return evs; };
const first = R.houses.find(h => h.sub);
/* ride until a throw from lane d would land on house h's mat centre, offset by off units along the street */
const throwAt = (st, h, off = 0) => { let done = false; return s => { if (done) return {}; const f = flight(s.s, s.d, s.v); if (f.ls >= h.door + off) { done = true; return { throw: true }; } return {}; }; };

{ const st = createState(); const ev = run(st, 8, throwAt(st, first)); ok('clean hit scores 100', st.score === 100 && st.delivered === 1 && ev.some(e => e.e === 'hit')); }
{ const st = createState(); const ev = run(st, 8, throwAt(st, first, -40)); const m = ev.find(e => e.e === 'miss'); ok('early throw lands short of the mat and is reported early', st.score === 0 && m && m.why === 'early', JSON.stringify(m)); }
{ const st = createState(); const ev = run(st, 8, throwAt(st, first, 40)); const m = ev.find(e => e.e === 'miss'); ok('late throw lands past the mat and is reported late', st.score === 0 && m && m.why === 'late', JSON.stringify(m)); }
{ const st = createState(); st.d = 50; const ev = run(st, 8, throwAt(st, first)); const m = ev.find(e => e.e === 'miss'); ok('throw from too far out falls short of the mats', st.score === 0 && m && m.why === 'short', JSON.stringify(m)); }
{ const st = createState(); const f = flight(100, 10, 62), g = flight(100, 36, 62); ok('closer to the kerb lands sooner', f.T < g.T && f.ls < g.ls, `${f.T.toFixed(2)}s vs ${g.T.toFixed(2)}s`); }
{ const st = createState(); run(st, 8, s => ({ throw: true })); ok('holding/spamming throw cannot farm an address', st.delivered <= 1 && st.score <= 100, `score ${st.score}, thrown ${st.thrown}`); }
{ const st = createState(); st.s = R.hazards[0].s - 100; st.d = 14; st.score = 30; const ev = run(st, 4); ok('collision: -50 with a floor of zero, one penalty per obstacle, slows then recovers', st.score === 0 && st.bumps === 1 && ev.filter(e => e.e === 'bump').length === 1 && Math.abs(st.v - C.SPEED) < 1, `bumps ${st.bumps} v ${st.v.toFixed(1)}`); }
{ const st = createState(); st.score = 500; st.s = R.hazards[0].s - 100; st.d = 14; run(st, 4); ok('collision costs exactly 50', st.score === 450); }
{ const st = createState(); const ev = run(st, 10); ok('riding past a subscriber counts as one miss', st.status[1] === 'missed' && ev.filter(e => e.e === 'miss' && e.why === 'passed').length === 1); }
{ // streak bonus: three clean hits in a row = 300 + 150, and the counter resets
  const st = createState(); const subs = R.houses.filter(h => h.sub); let i = 0;
  run(st, 16, s => { if (i < 3) { const f = flight(s.s, s.d, s.v); if (f.ls >= subs[i].door) { i++; return { throw: true }; } } return {}; });
  ok('three in a row pays the 150 streak bonus once and resets', st.score === 450 && st.streak === 0 && st.best === 3, `score ${st.score}`); }
{ // a full round by a simple bot: steer round what is ahead, throw when the preview is on the mat
  const st = createState(); let frames = 0;
  const bot = s => {
    let want = 20;
    for (const h of s.hazards) if (h.s + h.len > s.s - 12 && h.s < s.s + 70) want = Math.max(want, h.d1 + 8);
    for (const g of s.gulls) if (g.state === 'dive') want = Math.max(want > 20 ? want : 0, g.d >= 26 ? g.d - 14 : g.d + 14);   // step out of the gull's lane, kerbward if there is room
    const f = flight(s.s, s.d, s.v), k = R.houses.findIndex((h, i) => s.status[i] === 'due' && onMat(h, f.ls, f.ld));
    return { steer: Math.abs(want - s.d) < 1 ? 0 : Math.sign(want - s.d), throw: k >= 0 && Math.abs(f.ls - R.houses[k].door) < 4 };
  };
  while (st.phase !== 'done' && frames < 60 * 200) { step(st, DT, bot(st)); frames++; }
  ok('a full round finishes at Small Plates', st.phase === 'done', `${(frames / 60).toFixed(1)} s`);
  ok('round length is about 90 s', frames / 60 > 80 && frames / 60 < 100);
  if (st.delivered < 12) console.log('   missed:', R.houses.filter((h, i) => st.status[i] === 'missed').map(h => h.k).join(','));
  ok('a careful rider can deliver all 12', st.delivered === 12, `delivered ${st.delivered}, bumps ${st.bumps}, score ${st.score}`);
  ok('perfect score is 12x100 + 4x150', st.bumps > 0 || st.score === 1800, `score ${st.score}`);
}
{ const st = createState(); let frames = 0; while (st.phase !== 'done' && frames < 60 * 300) { step(st, DT, { steer: -1 }); frames++; } ok('a player who hits everything still finishes', st.phase === 'done', `${(frames / 60).toFixed(1)} s, bumps ${st.bumps}`); }
{ const st = createState(); const t1 = (R.houses.find(h => h.sub).door - 60) / C.SPEED; ok('first target within five seconds', t1 < 5, t1.toFixed(1) + ' s'); }
{ // the preview and the throw must agree exactly, also while steering and while slowed after a bump
  let bad = 0, n = 0; const rnd = (() => { let x = 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 4000; i++) { const st = createState(); st.s = 200 + rnd() * 4500; st.d = 8 + rnd() * 44; st.v = 28 + rnd() * 34; st.slow = rnd() < 0.3 ? 0.5 : 0;
    const f = flight(st.s, st.d, st.v); step(st, DT, { throw: true, steer: rnd() < 0.5 ? 1 : -1 }); const p = st.papers[0]; n++; if (Math.abs(p.ls - f.ls) > 1e-9 || Math.abs(p.ld - f.ld) > 1e-9) bad++; }
  ok('the paper lands exactly where the preview said (4000 random throws, steering and slowed)', bad === 0, `${bad} of ${n} differ`); }
console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
