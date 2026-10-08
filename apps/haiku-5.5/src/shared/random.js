/**
 * Small, fast, seeded PRNG (mulberry32). Same seed → same sequence, so scenes
 * look identical on every load.
 *
 * @param {number} seed
 * @returns {() => number} function returning floats in [0, 1)
 */
export function createRandom(seed = 1) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {() => number} random @param {number} min @param {number} max */
export function range(random, min, max) {
  return min + (max - min) * random();
}
