// The storm cloud the vortex hangs from: its shape, modelled once at start-up.
//
// A cumulus is not a blob with noise on it. It is a crowd of rising turrets, each a heap of
// rounded heads, each head crowded with smaller ones: a cauliflower. That is how this one is
// built, out of a few hundred rounded solids joined smoothly:
//
//   base      a flat slab at the condensation level, lobed like the crown above it, that runs
//             out beyond the turrets as a thin shelf with a torn, wispy edge
//   lowering  the wall cloud: lumps that hang from the base around the funnel
//   crown     one tall tower and lower turrets round it, each covered with billows of very
//             different sizes (a few big ones among many small), each with heads half a metre across
//   rim       billows along the edge of the base, and smaller ones wherever it lies bare
//   wisps     scud under the edge of the base, and streamers torn off the lobes that trail
//             behind them as the disc turns
//
// The result is stored as a field: for every cell of a grid, how far inside the cloud it
// lies, in metres (negative outside), and how much of what is there is wisp rather than
// firm cloud. The volume shader reads it as a 3D texture: one fetch tells it how far the
// next step may go or how dense the vapour is, and two more, a little way toward the light,
// tell it how much cloud the light has to cross.
//
// Everything is in the cloud's own frame, which turns with the disc: x and z are metres
// from the element's vertical, y is the height above the film.

export const CLOUD_GRID = [176, 64, 176];              // cells along x, y, z
export const CLOUD_MIN = [-7.3, 8.3, -7.3];            // corner of the grid, m
export const CLOUD_SIZE = [14.6, 5.44, 14.6];          // its extent, m
export const CLOUD_NEG = 0.24;                         // the field is stored from -CLOUD_NEG ...
export const CLOUD_POS = 0.64;                         // ... to CLOUD_POS metres
export const CLOUD_BASE = 10.05;                       // height of the flat base

const [NX, NY, NZ] = CLOUD_GRID;
const [X0, Y0, Z0] = CLOUD_MIN;
const DX = CLOUD_SIZE[0] / NX, DY = CLOUD_SIZE[1] / NY, DZ = CLOUD_SIZE[2] / NZ;
// The shader wears the modelled surface back into finer billows (ERODE in volume.js), so
// what is stored is the model swollen by about as much as that takes away.
const SWELL = 0.09;
const EMPTY = -CLOUD_NEG - SWELL;                      // the model's field where nothing is near
const FULL = CLOUD_POS - SWELL + 0.01;                 // and where it is deep inside: both ends of what is stored
const REACH = 0.02 - EMPTY;                            // how far outside a solid its field is written

// The turrets of the crown: [x, z, height of the top (billows included), radius of the core].
// One tower is the updraft itself; round it they fall away to low mounds on the shelf.
const TURRETS = [
  [0.9, -0.5, 13.45, 1.75],
  [-2.0, 1.0, 12.6, 1.3],
  [2.9, 1.9, 11.95, 1.0],
  [1.6, -3.1, 12.3, 1.15],
  [-1.5, -2.6, 11.6, 0.8],
  [-4.2, -0.6, 11.3, 0.65],
  [-0.4, 3.6, 11.75, 0.95],
  [4.5, -0.9, 11.2, 0.6],
  [-3.3, 3.2, 11.15, 0.6],
  [3.45, -3.25, 11.1, 0.55],
  [-3.5, -3.1, 11.0, 0.5],
];
// The flat base runs out this far beyond the turrets as a thin shelf with a torn edge (but
// never beyond SHELF_R from the vertical), thickening inward from SHELF_EDGE to the full base.
const SHELF = 1.35;
const SHELF_R = 6.75;
const SHELF_EDGE = 0.32;
const CROWDING = 1.42;       // a turret with its billows and their heads is this many core radii high
// The lowering: [x, z, radius, how far it hangs below the base]. It hangs lowest on one side.
const LOWERING = [
  [0.3, 0.2, 2.5, 1.25],
  [1.6, -1.3, 1.6, 1.15],
  [-1.9, 0.5, 1.5, 1.0],
  [1.2, 1.9, 1.4, 0.8],
  [-0.9, -2.0, 1.5, 0.9],
  [-2.6, -1.4, 1.1, 0.6],
  [2.9, 0.4, 1.2, 0.65],
];
// Where streamers leave the rim: [angle of the lobe they trail from, radius there, how many
// metres they trail].
const TAILS = [[0.3, 5.1, 4.4], [2.05, 4.9, 2.4], [3.45, 5.2, 5.2], [4.9, 5.0, 2.0]];

const smooth01 = (x) => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t); };

// Smooth maximum: the union of two solids, with a fillet of size k where they meet.
function smax(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}

// Field of one solid at a point. A solid is a sphere of radius r, or (with up / down set)
// a body of revolution that is a half-ellipsoid above its centre and another below, or (with
// rz set as well) such a body stretched along a horizontal direction.
function solidField(s, x, y, z) {
  let dx = x - s.x, dy = y - s.y, dz = z - s.z;
  if (s.up === undefined) return s.r - Math.sqrt(dx * dx + dy * dy + dz * dz);
  // Measured in the space where the body is a sphere of radius r, then scaled back by how
  // much that space is squeezed along the way out of the body.
  let squeeze = 1;
  if (s.rz !== undefined) {
    const t = dx * s.cos + dz * s.sin;
    dz = (dz * s.cos - dx * s.sin) * s.r / s.rz; dx = t;
    squeeze = s.rz / s.r;
  }
  const ry = (dy > 0 ? s.up : s.down) / s.r;
  dy /= ry;
  const d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2);
  const w = d2 > 1e-6 ? dy * dy / d2 : 0, wz = d2 > 1e-6 ? dz * dz / d2 : 0;
  return (s.r - d) * (1 + (ry - 1) * w + (squeeze - 1) * wz);
}

function unionField(solids, x, y, z, skip) {
  let f = -1e3;
  for (const s of solids) if (s !== skip) f = Math.max(f, solidField(s, x, y, z));
  return f;
}

// Index of the first / last cell whose centre lies at or beyond / at or before a coordinate.
const cellFrom = (v, origin, step) => Math.ceil((v - origin) / step - 0.5);
const cellTo = (v, origin, step) => Math.floor((v - origin) / step - 0.5);

// Writes one solid into the grid, joined to what is there with a fillet of size s.k. With W
// given, also notes there how much of each cell the solid has made its own (0 .. 255).
// (This is where the time goes: cells deep inside a solid are simply marked full, and only
// the shell around its surface is worked out.)
function splat(F, s, W) {
  const k = s.k, q = 0.25 / k;
  const round = s.rz === undefined;                       // a body of revolution
  const up = s.up ?? s.r, down = s.down ?? s.r;
  const reach = Math.max(s.r, s.rz ?? 0) + REACH, reach2 = reach * reach;
  // In the space where the body is a sphere, cells within `core` of the centre are full.
  const core = round ? s.r * (1 - FULL / Math.min(up, down, s.r)) : 0, core2 = core > 0 ? core * core : -1;
  const i0 = Math.max(0, cellFrom(s.x - reach, X0, DX)), i1 = Math.min(NX - 1, cellTo(s.x + reach, X0, DX));
  const j0 = Math.max(0, cellFrom(s.y - down - REACH, Y0, DY)), j1 = Math.min(NY - 1, cellTo(s.y + up + REACH, Y0, DY));
  const k0 = Math.max(0, cellFrom(s.z - reach, Z0, DZ)), k1 = Math.min(NZ - 1, cellTo(s.z + reach, Z0, DZ));
  for (let kk = k0; kk <= k1; kk++) {
    const z = Z0 + (kk + 0.5) * DZ, dz = z - s.z, dz2 = dz * dz;
    if (dz2 >= reach2) continue;
    for (let j = j0; j <= j1; j++) {
      const y = Y0 + (j + 0.5) * DY, dy = y - s.y;
      const ry = (dy > 0 ? up : down) / s.r, sy = dy / ry, yz2 = dz2 + sy * sy;
      const row = NX * (j + NY * kk);
      let a = i0, b = i1, fa = 1, fb = 0;                   // the row's cells, and those of them that are full
      if (round) {
        // (a body of revolution is no wider than a sphere of its radius at this height)
        const half2 = reach2 - dz2 - (ry >= 1 ? dy * dy : 0);
        if (half2 <= 0) continue;
        const half = Math.sqrt(half2);
        a = Math.max(i0, cellFrom(s.x - half, X0, DX));
        b = Math.min(i1, cellTo(s.x + half, X0, DX));
        if (core2 > yz2) {
          const h = Math.sqrt(core2 - yz2);
          fa = Math.max(a, cellFrom(s.x - h, X0, DX));
          fb = Math.min(b, cellTo(s.x + h, X0, DX));
        }
      }
      for (let i = a; i <= b; i++) {
        if (i === fa && fb >= fa) {
          for (; i <= fb; i++) if (F[row + i] < FULL) F[row + i] = FULL;
          if (i > b) break;
        }
        const dx = X0 + (i + 0.5) * DX - s.x;
        let f;
        if (round) {
          const d2 = dx * dx + yz2, d = Math.sqrt(d2);
          f = ry === 1 ? s.r - d : (s.r - d) * (1 + (ry - 1) * (d2 > 1e-6 ? sy * sy / d2 : 0));
        } else f = solidField(s, X0 + (i + 0.5) * DX, y, z);
        const cur = F[row + i], d = f - cur;
        if (d >= k) F[row + i] = f;
        else if (d > -k) { const h = k - Math.abs(d); F[row + i] = (d > 0 ? f : cur) + h * h * q; }
        if (W !== undefined && d > -k) { const w = d >= k ? 255 : 127.5 * (1 + d / k); if (w > W[row + i]) W[row + i] = w; }
      }
    }
  }
}

// Unit directions spread evenly over the cap of a sphere around an axis (out to the polar
// angle maxPolar), by the golden-angle spiral, each nudged a little.
function capDirections(count, maxPolar, axis, rng) {
  const out = [];
  // a frame around the axis
  const [ax, ay, az] = axis;
  let ux = -az, uy = 0, uz = ax;
  let n = Math.hypot(ux, uz);
  if (n < 1e-3) { ux = 1; uz = 0; n = 1; }
  ux /= n; uz /= n;
  const vx = ay * uz - az * uy, vy = az * ux - ax * uz, vz = ax * uy - ay * ux;
  const cosMax = Math.cos(maxPolar);
  const turn = rng() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const c = 1 - (1 - cosMax) * (i + 0.35 + 0.5 * rng()) / count;
    const sn = Math.sqrt(Math.max(1 - c * c, 0));
    const phi = turn + i * 2.39996 + (rng() - 0.5) * 0.5;
    const cu = Math.cos(phi) * sn, cv = Math.sin(phi) * sn;
    out.push([ax * c + ux * cu + vx * cv, ay * c + uy * cu + vy * cv, az * c + uz * cu + vz * cv]);
  }
  return out;
}

/**
 * Builds the cloud. rng: a seeded generator of numbers in [0, 1).
 * Returns { data, bands, solids, ms }:
 *   data    the field, two bytes a cell of CLOUD_GRID, x fastest then y then z. The first is
 *           the inside-distance, 0 = CLOUD_NEG metres outside (or more) .. 255 = CLOUD_POS
 *           metres inside (or more); the second is 255 where the cloud is all wisp, 0 where
 *           it is firm.
 *   bands   for slices of height, the circle that holds all the cloud there
 *           ({ y0, y1, x, z, r }, in the cloud's frame).
 */
export function buildCloudField(rng) {
  const started = performance.now();
  const F = new Float32Array(NX * NY * NZ).fill(EMPTY);
  const W = new Uint8Array(NX * NY * NZ);
  const big = [], heads = [], small = [], bulges = [], wisps = [];
  const rand = (a, b) => a + (b - a) * rng();

  // ---- the crown's turrets: a dome above, flattened below so that it sits on the base ----
  for (const [x, z, top, r] of TURRETS) {
    const y = top - CROWDING * r;
    big.push({ x, y, z, r, up: r, down: Math.max(y - CLOUD_BASE - 0.05, 0.3), k: 0.5 });
  }
  // ---- the lowering: lumps hanging from the base around the funnel ----
  const hanging = [];
  for (const [x, z, r, depth] of LOWERING) {
    const s = { x, y: CLOUD_BASE + 0.15, z, r, up: 0.45, down: depth + 0.15, k: 0.45 };
    big.push(s); hanging.push(s);
  }

  // The base under a point: a slab as wide as the turrets standing on it and a middle that
  // joins them. lateral is how far inside its outline the point is.
  const discs = new Float32Array([0, 0, 3.7, ...TURRETS.flatMap(([x, z, , r]) => [x, z, r * 1.05])]);
  const lateral = (x, z) => {
    let f = -1e3;
    for (let i = 0; i < discs.length; i += 3) {
      const ex = x - discs[i], ez = z - discs[i + 1];
      const g = discs[i + 2] - Math.sqrt(ex * ex + ez * ez);
      const h = Math.max(0.7 - Math.abs(f - g), 0);
      f = Math.max(f, g) + h * h * (0.25 / 0.7);
    }
    return f;
  };
  const baseTop = 10.72;

  // A billow on a parent: its centre sunk a little way into the parent's surface.
  const billow = (px, py, pz, dir, radius, sink, k) => ({
    x: px + dir[0] * -sink * radius, y: py + dir[1] * -sink * radius, z: pz + dir[2] * -sink * radius, r: radius, k,
  });
  const hidden = (s, depth, parent) => unionField(big, s.x, s.y, s.z, parent) > depth * s.r
    || unionField(heads, s.x, s.y, s.z, parent) > depth * s.r;

  // Nothing may reach the top of the grid (the field would be cut off flat there).
  const ceiling = CLOUD_MIN[1] + CLOUD_SIZE[1] - 0.22;
  // ---- billows on the turrets ----
  // (no two turrets alike: some are a few broad billows, some a crowd of small heads; and
  // on each, a few big billows among many small ones, not a crowd of equal puffs)
  for (const t of big) {
    if (hanging.includes(t)) continue;
    const broad = rng();
    const count = Math.round((13 + 3 * t.r) * (1.1 - 0.35 * broad));
    for (const d of capDirections(count, 1.95, [0, 1, 0], rng)) {
      const u = rng();
      let radius = Math.max(t.r * (0.2 + 0.52 * u * u) * (0.9 + 0.3 * broad), 0.24);
      const ry = d[1] > 0 ? t.up : t.down;
      const s = billow(t.x + d[0] * t.r, t.y + d[1] * ry, t.z + d[2] * t.r, d, radius, 0.3, 0.3 * radius);
      if (s.y + radius > ceiling) { radius = s.r = Math.max(ceiling - s.y, 0.2); s.k = 0.3 * radius; }
      if (s.y - 0.75 * radius < CLOUD_BASE - 0.1) continue;          // (the base stays flat)
      if (!hidden(s, 0.55, t)) { s.parent = t; s.heads = (1.25 - 0.9 * broad) * (radius > 0.7 ? 0.6 : 1.0); heads.push(s); }
    }
  }
  // ---- billows under the lowering (soft ones: they carry no heads) ----
  for (const t of hanging) {
    const count = Math.round(3 + 2.5 * t.r);
    for (const d of capDirections(count, 1.3, [0, -1, 0], rng)) {
      const radius = Math.min(t.r * rand(0.24, 0.36), 0.8);
      const s = billow(t.x + d[0] * t.r, t.y + d[1] * t.down, t.z + d[2] * t.r, d, radius, 0.5, 0.6 * radius);
      if (s.y - radius < CLOUD_MIN[1] + 0.4) continue;
      if (!hidden(s, 0.6, t)) { s.soft = true; heads.push(s); }
    }
  }
  // ---- billows along the rim of the base ----
  for (let a = rng() * 0.3; a < Math.PI * 2; ) {
    const c = Math.cos(a), sn = Math.sin(a);
    let edge = 7.0;
    while (edge > 2.5 && lateral(c * edge, -sn * edge) < 0) edge -= 0.05;
    const u = rng();
    const radius = 0.32 + 0.68 * u * u;
    const rr = edge - 0.2 * radius + rand(-0.1, 0.15);
    const s = { x: c * rr, y: rand(CLOUD_BASE + 0.25, baseTop), z: -sn * rr, r: radius, k: 0.3 * radius };
    if (!hidden(s, 0.5, null)) { s.parent = { x: c * (rr - 1), y: s.y - 0.3, z: -sn * (rr - 1) }; heads.push(s); }
    a += (1.5 * radius + rand(0.05, 0.3)) / Math.max(edge, 1);
  }
  // ---- and here and there where the top of the base lies bare: low, flattened mounds ----
  for (let gx = -6; gx <= 6; gx += 1.7) {
    for (let gz = -6; gz <= 6; gz += 1.7) {
      const x = gx + rand(-0.6, 0.6), z = gz + rand(-0.6, 0.6);
      if (lateral(x, z) < 0.5 || rng() < 0.35) continue;
      const u = rng();
      const radius = 0.4 + 0.75 * u * u;
      const s = { x, y: baseTop - 0.3 * radius + rand(0, 0.15), z, r: radius, up: 0.55 * radius, down: radius, k: 0.3 * radius };
      if (!hidden(s, 0.35, null)) { s.parent = { x, y: s.y - 1, z }; s.heads = 0.35; heads.push(s); }
    }
  }

  // ---- heads on the billows ----
  for (const b of heads) {
    if (b.soft || b.r < 0.36) continue;
    const p = b.parent;
    const ax = b.x - p.x, ay = b.y - p.y, az = b.z - p.z;
    const n = Math.hypot(ax, ay, az) || 1;
    const count = Math.round((2 + 8 * b.r) * (b.heads ?? 0.8));
    for (const d of capDirections(count, 1.75, [ax / n, ay / n, az / n], rng)) {
      const radius = Math.max(b.r * rand(0.32, 0.52), 0.2);
      const s = billow(b.x + d[0] * b.r, b.y + d[1] * b.r, b.z + d[2] * b.r, d, radius, 0.3, 0.45 * radius);
      if (s.y - 0.6 * radius < CLOUD_BASE - 0.12 || s.y + radius > ceiling) continue;
      if (unionField(big, s.x, s.y, s.z, null) > 0.3 * radius) continue;
      if (unionField(heads, s.x, s.y, s.z, b) > 0.45 * radius) continue;
      small.push(s);
    }
  }

  // ---- the underside of the base: bulges that hang from it, the larger the nearer the lowering ----
  for (let i = 0; i < 54; i++) {
    const a = rng() * Math.PI * 2, rr = 2.4 + Math.sqrt(rng()) * 3.4;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (lateral(x, z) < 0.3) continue;
    const r = rand(0.45, 1.0) * (1.25 - 0.08 * rr);
    bulges.push({ x, y: CLOUD_BASE + 0.15, z, r, up: 0.3, down: 0.15 + r * rand(0.35, 0.6), k: 0.2 });
  }

  // ---- wisps: flat, drawn-out shreds, thinner than their own soft skin is deep ----
  // (the long axis of a wisp at the bearing a lies along the wind there, turned outward by lean)
  const wisp = (a, rr, y, length, width, thick, lean) => {
    const turn = Math.PI / 2 - a - lean;
    wisps.push({ x: Math.cos(a) * rr, y, z: -Math.sin(a) * rr, r: length, rz: width, up: thick, down: thick * rand(1.0, 1.6), cos: Math.cos(turn), sin: Math.sin(turn), k: 0.2 });
  };
  // Scud hanging under the edge of the base.
  for (let i = 0; i < 20; i++) {
    const a = rng() * Math.PI * 2;
    let edge = 7.0;
    while (edge > 2.5 && lateral(Math.cos(a) * edge, -Math.sin(a) * edge) < 0.2) edge -= 0.1;
    wisp(a, Math.min(edge, 5.8) - rand(0.0, 1.5), CLOUD_BASE - rand(0.0, 0.3), rand(0.5, 1.1), rand(0.3, 0.5), rand(0.2, 0.32), rand(-0.3, 0.3));
  }
  // Streamers torn off the lobes, trailing behind them as the disc turns. (It turns counter-
  // clockwise seen from above: what trails lies clockwise, and drifts outward as it falls
  // behind.) Each is a run of overlapping shreds, smaller and thinner toward its end, broken
  // here and there.
  for (const [angle, radius, reach] of TAILS) {
    let a = angle, rr = radius, y = CLOUD_BASE + rand(0.35, 0.65);
    for (let run = 0; run < reach; ) {
      const u = run / reach;
      const length = (1.0 - 0.5 * u) * rand(0.7, 1.2);
      if (run === 0 || rng() > 0.18) wisp(a + rand(-0.15, 0.15) * length / rr, Math.min(rr + rand(-0.2, 0.2), 6.5 - 0.5 * length), y, length, (0.6 - 0.28 * u) * rand(0.7, 1.25), (0.38 - 0.16 * u) * rand(0.8, 1.2), 0.2 + rand(-0.25, 0.25));
      const step = length * rand(0.9, 1.5);
      a -= step / rr;
      rr = Math.min(rr + step * rand(0.08, 0.26), 6.0);
      y += rand(-0.1, 0.14);
      run += step;
    }
  }

  // ---- write everything into the grid ----
  for (const s of big) splat(F, s);
  // the base, and the shelf it runs out into: the same flat underside, but thin, with an
  // outline torn into tongues and bays, and wispy toward its edge
  const tear = (a) => 0.42 * Math.sin(3 * a + 0.7) + 0.28 * Math.sin(5 * a + 2.1) + 0.18 * Math.sin(9 * a + 4.0) + 0.1 * Math.sin(17 * a + 1.3);
  const j0 = Math.max(0, Math.floor((CLOUD_BASE - 0.5 - Y0) / DY)), j1 = Math.min(NY - 1, Math.ceil((baseTop + 0.4 - Y0) / DY));
  for (let kk = 0; kk < NZ; kk++) {
    const z = Z0 + (kk + 0.5) * DZ;
    for (let i = 0; i < NX; i++) {
      const x = X0 + (i + 0.5) * DX;
      const r2 = x * x + z * z;
      if (r2 > 49) continue;
      const lat = lateral(x, z);
      const shelf = Math.min(lat + SHELF + tear(Math.atan2(z, x)), SHELF_R - Math.sqrt(r2));
      if (Math.max(lat, shelf) < -REACH) continue;
      const bottom = CLOUD_BASE + 0.09 * Math.sin(1.3 * x + 0.5) * Math.sin(1.1 * z + 2.0);
      const shelfTop = bottom + SHELF_EDGE + (baseTop - 0.12 - bottom - SHELF_EDGE) * smooth01(shelf / 1.8);
      const wisp = 255 * (1 - smooth01((shelf + 0.1) / 1.1));
      for (let j = j0; j <= j1; j++) {
        const y = Y0 + (j + 0.5) * DY;
        const vertical = Math.min(y - bottom, baseTop - y);
        // (a rounded edge: the smooth minimum of the two distances)
        const h = Math.max(0.3 - Math.abs(lat - vertical), 0) / 0.3;
        const f = Math.min(lat, vertical) - h * h * 0.075;
        const vs = Math.min(y - bottom, shelfTop - y);
        const hs = Math.max(0.2 - Math.abs(shelf - vs), 0) / 0.2;
        const fs = Math.min(shelf, vs) - hs * hs * 0.05;
        const idx = i + NX * (j + NY * kk);
        F[idx] = smax(F[idx], Math.max(f, fs), 0.3);
        if (fs > f && fs > -REACH && wisp > W[idx]) W[idx] = wisp;
      }
    }
  }
  for (const s of heads) splat(F, s);
  for (const s of small) splat(F, s);
  for (const s of bulges) splat(F, s);
  for (const s of wisps) splat(F, s, W);

  // ---- pack ----
  // (a clamped array rounds and clamps by itself; the texture wants the plain kind)
  const packed = new Uint8ClampedArray(NX * NY * NZ * 2);
  const scale = 255 / (CLOUD_NEG + CLOUD_POS);
  for (let i = 0, o = 0; i < F.length; i++, o += 2) { packed[o] = (F[i] - EMPTY) * scale; packed[o + 1] = W[i]; }
  const data = new Uint8Array(packed.buffer);

  // ---- the circle that holds the cloud in each slice of height ----
  // Read off the field itself: the box round the cells that lie inside the cloud in a slice
  // (and in the layer of cells above and below it), then the furthest of them from its middle.
  // The surface runs between a cell inside and its neighbour outside, hence the margin.
  const LAYERS = 5, count = Math.ceil(NY / LAYERS), inside = Math.floor(CLOUD_NEG * scale);
  const box = new Int32Array(count * 4), far2 = new Float32Array(count);
  for (let b = 0; b < count; b++) { box[b * 4] = box[b * 4 + 2] = 1e6; box[b * 4 + 1] = box[b * 4 + 3] = -1; }
  for (let pass = 0; pass < 2; pass++) {
    for (let kk = 0, o = 0; kk < NZ; kk++) for (let j = 0; j < NY; j++) {
      // (a layer next to the boundary of a slice counts for the slice beyond it as well)
      const b0 = Math.floor(Math.max(j - 1, 0) / LAYERS), b1 = Math.floor(Math.min(j + 1, NY - 1) / LAYERS);
      for (let i = 0; i < NX; i++, o += 2) {
        if (data[o] <= inside) continue;
        for (let b = b0; b <= b1; b++) {
          const q = b * 4;
          if (pass === 0) {
            if (i < box[q]) box[q] = i; if (i > box[q + 1]) box[q + 1] = i;
            if (kk < box[q + 2]) box[q + 2] = kk; if (kk > box[q + 3]) box[q + 3] = kk;
          } else {
            const ex = (i - 0.5 * (box[q] + box[q + 1])) * DX, ez = (kk - 0.5 * (box[q + 2] + box[q + 3])) * DZ;
            if (ex * ex + ez * ez > far2[b]) far2[b] = ex * ex + ez * ez;
          }
        }
      }
    }
  }
  const all = [...big, ...heads, ...small, ...bulges, ...wisps];
  const bands = [];
  for (let b = 0; b < count; b++) {
    const q = b * 4, empty = box[q + 1] < 0;
    bands.push({
      y0: Y0 + b * LAYERS * DY, y1: Y0 + Math.min((b + 1) * LAYERS, NY) * DY,
      x: empty ? 0 : X0 + (0.5 * (box[q] + box[q + 1]) + 0.5) * DX, z: empty ? 0 : Z0 + (0.5 * (box[q + 2] + box[q + 3]) + 0.5) * DZ,
      r: empty ? 0 : Math.sqrt(far2[b]) + Math.hypot(DX, DZ) + 0.02,
    });
  }

  return { data, bands, solids: all.length, ms: performance.now() - started };
}
