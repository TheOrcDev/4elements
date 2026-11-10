// Small maths helpers shared by the soundscape modules. No Web Audio in here.

/**
 * Seeded PRNG (mulberry32). Returns a function that yields numbers in [0, 1).
 * The state lives in a typed array so that stepping it never allocates.
 */
export function createRng(seed = 1) {
  const state = new Uint32Array([seed]);
  return function rng() {
    let t = (state[0] += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
export const dbToGain = (db) => Math.pow(10, db / 20);

export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Log-uniform random value in [lo, hi): the right distribution for frequencies and decay times. */
export const expRand = (rng, lo, hi) => lo * Math.pow(hi / lo, rng());

/** Exponentially distributed waiting time with the given mean, i.e. Poisson arrivals. */
export const waitTime = (rng, mean) => -Math.log(1 - rng()) * mean;

function hash1(n) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Smooth deterministic 1-D value noise in [0, 1]. Allocation-free, for slow wander computed per frame. */
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i + seed * 7919) * (1 - u) + hash1(i + 1 + seed * 7919) * u;
}
