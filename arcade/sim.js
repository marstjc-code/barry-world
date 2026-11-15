/* Barry's Paper Round: simulation. No drawing, no DOM, no clock: step(state, dt, input) only, so it can be tested at any speed. */
import { route as R } from './route.js';
const C = R.C;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Where a paper thrown from (s, d) at forward speed v will go. The preview arc and the real throw both use this. */
export function flight(s, d, v) {
  const T = clamp((d - C.MAT_D) / C.VLAT, 0.2, C.T_MAX);
  return { s0: s + C.HAND, d0: d, vs: v, T, ls: s + C.HAND + v * T, ld: d - C.VLAT * T, vh: (0.5 * C.G * T * T - C.H0) / T };
}
export const paperAt = (p, t) => ({ s: p.s0 + p.vs * t, d: p.d0 - C.VLAT * t, h: Math.max(0, C.H0 + p.vh * t - 0.5 * C.G * t * t) });
export const onMat = (h, s, d) => Math.abs(s - h.door) <= C.MAT_HALF_S + C.HIT_MARGIN && Math.abs(d - C.MAT_D) <= C.MAT_HALF_D + C.HIT_MARGIN;

export function createState() {
  return { t: 0, s: 0, d: 34, v: C.SPEED, slow: 0, grace: 0, cool: 0, score: 0, delivered: 0, streak: 0, run: 0, best: 0, thrown: 0, bumps: 0,
    status: R.houses.map(h => h.sub ? 'due' : 'none'),        // due | hit | missed | none
    hazards: R.hazards.map(h => ({ ...h, hit: 0 })), gulls: R.gulls.map(g => ({ ...g, trig: g.s - g.lead, state: 'wait', d: 0, hit: 0 })),
    papers: [], landed: [], ev: [], phase: 'ride', stopT: 0 };
}

function miss(st, why, s, d) { st.streak = 0; st.run = 0; st.ev.push({ e: 'miss', why, s, d }); }

function land(st, p) {
  const { ls: s, ld: d } = p;
  const k = R.houses.findIndex(h => h.sub && onMat(h, s, d));
  if (k >= 0 && st.status[k] === 'due') {            // each address pays once
    st.status[k] = 'hit'; st.delivered++; st.score += C.HIT; st.streak++; st.run++; st.best = Math.max(st.best, st.run);
    st.ev.push({ e: 'hit', k, s, d });
    if (st.streak === C.STREAK_N) { st.score += C.STREAK_BONUS; st.streak = 0; st.ev.push({ e: 'streak', s, d }); }
    st.landed.push({ s, d, ok: 1, t: st.t });
    return;
  }
  st.landed.push({ s, d, ok: 0, t: st.t });
  if (k >= 0) return st.ev.push({ e: 'spare', s, d });   // a second paper on a mat already served: no points, no penalty
  // say why, relative to the next address still waiting
  const next = R.houses.find((h, i) => st.status[i] === 'due' && h.door > s - 60);
  const why = d > C.MAT_D + C.MAT_HALF_D + C.HIT_MARGIN ? 'short' : !next ? 'stray' : s < next.door ? 'early' : 'late';
  miss(st, why, s, d);
}

export function step(st, dt, inp) {
  st.ev.length = 0;
  if (st.phase === 'done') return st;
  st.t += dt; st.cool = Math.max(0, st.cool - dt); st.grace = Math.max(0, st.grace - dt); st.slow = Math.max(0, st.slow - dt);
  if (st.phase === 'ride') {
    if (inp.throw && st.cool <= 0) {                  // one press, one paper (the input layer sends the press edge only). Thrown from exactly
      st.papers.push({ ...flight(st.s, st.d, st.v), age: 0 }); st.cool = C.COOLDOWN; st.thrown++; st.ev.push({ e: 'throw' });   // the position the preview was drawn from, before this step moves Barry
    }
    const target = C.SPEED * (st.slow > 0 ? C.SLOW : 1);
    st.v += clamp(target - st.v, -220 * dt, 60 * dt);
    st.d = clamp(st.d + (inp.steer || 0) * C.LAT * dt, C.D_MIN, C.D_MAX);
  } else {                                            // rolling up to Small Plates
    st.v = Math.max(0, st.v - 70 * dt); st.d += clamp(20 - st.d, -30 * dt, 30 * dt);
    if (st.v === 0 && !st.papers.length) { st.stopT += dt; if (st.stopT > 0.7) { st.phase = 'done'; st.ev.push({ e: 'finish' }); } }
  }
  st.s += st.v * dt;
  for (const p of st.papers) p.age += dt;
  for (const p of st.papers.filter(p => p.age >= p.T)) land(st, p);
  st.papers = st.papers.filter(p => p.age < p.T);
  if (st.landed.length > 24) st.landed.splice(0, st.landed.length - 24);
  // addresses ridden past without a delivery
  R.houses.forEach((h, k) => { if (st.status[k] === 'due' && st.s > h.door + C.PASS) { st.status[k] = 'missed'; miss(st, 'passed', h.door, C.MAT_D); } });
  // obstacles: slow down, lose 50 (never below zero), then a short grace so one obstacle costs once. Barry always rides on.
  const bump = what => { if (st.grace > 0) return; st.score = Math.max(0, st.score - C.PENALTY); st.slow = C.SLOW_T; st.grace = C.GRACE_T; st.bumps++; st.ev.push({ e: 'bump', what }); };
  if (st.phase === 'ride') {
    for (const h of st.hazards) if (st.s + 12 > h.s && st.s - 10 < h.s + h.len && st.d + 4 > h.d0 && st.d - 4 < h.d1) { if (!h.hit) { h.hit = st.t; bump(h.type); } }   // each obstacle can only cost once
    for (const g of st.gulls) {
      if (g.state === 'wait' && st.s >= g.trig) { g.state = 'dive'; g.d = clamp(st.d, 12, 58); st.ev.push({ e: 'gull' }); }
      if (g.state === 'dive' && st.s >= g.s - 12) { g.state = 'gone'; if (Math.abs(st.d - g.d) < 9) { g.hit = st.t; bump('gull'); } else st.ev.push({ e: 'dodge' }); }
    }
    if (st.s >= R.FINISH - 70) st.phase = 'arrive';
  }
  return st;
}
