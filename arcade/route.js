/* Barry's Paper Round: route data. One morning route along the seafront, start to Small Plates.
   World units: s = distance along the street, d = distance out from the kerb (negative = pavement side). 1 unit = 1 logical pixel along the street. */
export const C = {
  SPEED: 62,            // cruising speed, units per second (the whole route takes about 90 s)
  LAT: 58,              // steering speed across the road
  D_MIN: 8, D_MAX: 52,  // how close to the kerb / how far out Barry can ride
  PAVE: -30,            // house fronts stand here; the pavement is PAVE..0
  MAT_D: -18,           // the line of doormats
  MAT_HALF_S: 11, MAT_HALF_D: 6,
  HIT_MARGIN: 6,        // generous extra reach around a mat, tuned by playing (see test/)
  VLAT: 78,             // how fast a thrown paper crosses towards the houses
  T_MAX: 0.62,          // longest flight: beyond VLAT*T_MAX the paper falls short
  HAND: 6, H0: 16, G: 260,
  COOLDOWN: 0.22,
  HOUSE_W: 120, FIRST: 140, DOOR: 84,
  SLOW: 0.45, SLOW_T: 1.0, GRACE_T: 1.6, PENALTY: 50,
  HIT: 100, STREAK_N: 3, STREAK_BONUS: 150,
  PASS: 150,            // a target this far behind Barry counts as missed
};
export const DOORS = ['red', 'teal', 'mustard', 'green'];
const SUBS = [1, 3, 5, 9, 12, 16, 19, 23, 27, 31, 35, 39];   // 12 subscribers; the first three are on a clear road
export const N_HOUSES = 43;
export const houses = Array.from({ length: N_HOUSES }, (_, k) => {
  const s0 = C.FIRST + k * C.HOUSE_W;
  return { k, s0, door: s0 + C.DOOR, colour: DOORS[k % 4], number: 2 + k * 2, sub: SUBS.includes(k) };
});
const door = k => houses[k].door;
/* Hazards, introduced one at a time: a parked milk float, then a wheelie bin, then a gull. */
export const hazards = [
  { type: 'float', s: door(9) - 78, len: 64, d0: 2, d1: 26 },     // forces a throw from further out
  { type: 'bin', s: door(12) - 44, len: 12, d0: 2, d1: 15 },      // punishes hugging the kerb
  { type: 'float', s: door(23) - 84, len: 64, d0: 2, d1: 26 },
  { type: 'bin', s: door(23) + 60, len: 12, d0: 2, d1: 15 },
  { type: 'bin', s: door(27) - 52, len: 12, d0: 2, d1: 15 },
  { type: 'float', s: door(31) - 70, len: 64, d0: 2, d1: 26 },
  { type: 'bin', s: door(35) - 36, len: 12, d0: 2, d1: 15 },
  { type: 'float', s: door(39) - 90, len: 64, d0: 2, d1: 26 },
];
/* Gulls dive on a spot ahead of Barry; the spot is the lane he is riding in when the shadow appears. */
export const gulls = [door(16) - 70, door(27) + 70, door(35) - 150, door(39) + 40].map(s => ({ s, lead: 170 }));
export const FINISH = C.FIRST + N_HOUSES * C.HOUSE_W + 90;      // the Small Plates door
export const route = { C, houses, hazards, gulls, FINISH, total: SUBS.length };
