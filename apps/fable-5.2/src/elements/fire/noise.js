// Small deterministic lattice noise for shaping geometry on the CPU at start-up.

/** Returns { value(x, y, z) in [-1, 1], fbm(x, y, z, octaves) in ~[-1, 1], ridged(...) in [0, 1], cell(...) }. */
export function createNoise(seed = 1) {
  const s = seed | 0;
  const hash = (x, y, z) => {
    let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683) ^ Math.imul(s, 2246822519);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 2147483648 - 1;
  };
  const fade = (t) => t * t * (3 - 2 * t);
  const value = (x, y, z) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
    const lerp = (a, b, t) => a + (b - a) * t;
    return lerp(
      lerp(lerp(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx), lerp(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx), fy),
      lerp(lerp(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx), lerp(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx), fy),
      fz,
    );
  };
  const fbm = (x, y, z, octaves = 4) => {
    let a = 0.5, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += a * value(x, y, z);
      norm += a;
      x = x * 2.03 + 11.7; y = y * 2.03 + 5.3; z = z * 2.03 + 23.1;
      a *= 0.5;
    }
    return sum / norm;
  };
  const ridged = (x, y, z, octaves = 3) => {
    let a = 0.5, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      const r = 1 - Math.abs(value(x, y, z));
      sum += a * r * r;
      norm += a;
      x = x * 2.07 + 3.1; y = y * 2.07 + 17.9; z = z * 2.07 + 7.7;
      a *= 0.5;
    }
    return sum / norm;
  };
  // Cellular noise: the nearest of one jittered feature point per lattice cell.
  // Returns the vector from that point to (x, y, z) and three random numbers that
  // belong to the cell, written into 'out' = { dx, dy, dz, a, b, c }.
  const cell = (x, y, z, out) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    let best = Infinity;
    for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = ix + i, cy = iy + j, cz = iz + k;
      const px = cx + 0.5 + 0.45 * hash(cx, cy, cz);
      const py = cy + 0.5 + 0.45 * hash(cx + 37, cy, cz);
      const pz = cz + 0.5 + 0.45 * hash(cx, cy + 59, cz);
      const dx = x - px, dy = y - py, dz = z - pz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < best) {
        best = d;
        out.dx = dx; out.dy = dy; out.dz = dz;
        out.a = hash(cx, cy, cz + 17); out.b = hash(cx + 91, cy, cz); out.c = hash(cx, cy + 23, cz + 5);
      }
    }
    return out;
  };
  return { value, fbm, ridged, cell };
}

/** Smooth 1D value noise in [0, 1] for the fire's control signals (pure function of x). */
export function noise1(x) {
  const i = Math.floor(x);
  const t = x - i;
  const u = t * t * (3 - 2 * t);
  const h = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  return h(i) + (h(i + 1) - h(i)) * u;
}
