import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { shared } from '../../core/shared.js';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { COALS, coalY, bowlInnerY, FIRE_GLSL, SOLID_GLSL } from './common.js';
import { createNoise } from './noise.js';

// The fuel: charred timbers stacked over a heaped bed of coals.

// The hottest point of the pile, between the lower logs. Char and glow fall off from here
// (the log shader has the same point for the direction its embers face).
const HOT = new THREE.Vector3(0, 0.95, 0);

// ------------------------------------------------------------------------------- logs

/** How far the fire has got into the wood at a point of the pile (local space), 0..1. */
function charAt(x, z) {
  return THREE.MathUtils.clamp((1.25 - Math.hypot(x, z)) / 0.36, 0, 1);
}

/**
 * One timber as a displaced tube from a to b.
 * Vertex attributes: aLog = (position in the log's own straight frame, random seed) for the
 * procedural bark and char, aHeat = (how charred, how strongly it glows, 1 on the end faces,
 * how deep inside one of the long splits), the first two baked from where the vertex ends up
 * relative to the heart of the fire.
 * detail: 0 is the timber with every split and pit, for the close view; 1 the same timber
 * from a quarter of the triangles; 2 from a fifteenth, for the reflection, the shadow map and
 * the view from across the water. All three draw the same random numbers: one shape.
 */
function buildLog(spec, noise, rng, detail) {
  const { a, b, radius, seed } = spec;
  const axis = new THREE.Vector3().subVectors(b, a);
  const length = axis.length();
  const T = axis.clone().normalize();
  const ref = Math.abs(T.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const N1 = new THREE.Vector3().crossVectors(T, ref).normalize();
  const N2 = new THREE.Vector3().crossVectors(T, N1);
  const smoothstep = THREE.MathUtils.smoothstep;

  // At its finest, enough for the long splits and the pits where blocks of char have fallen away.
  const girth = Math.PI * 2 * radius;
  const around = THREE.MathUtils.clamp(Math.round(girth / [0.0135, 0.027, 0.06][detail]), [24, 14, 8][detail], [52, 26, 12][detail]);
  const body = Math.max([8, 6, 3][detail], Math.round(length / [0.024, 0.048, 0.11][detail]));
  // Rings along the log: [distance from a, radius scale, is it part of a sawn face]. Each end
  // is closed by a cap; a 'cut' end is a sawn face, a 'burnt' end a blunt stump, gnawed down.
  const rings = [];
  const endRings = (kind, at, dir) => {
    if (kind === 'cut') return [[at, 0, 1], [at, 0.55, 1], [at, 0.93, 1], [at + dir * 0.006, 1.0, 0]];
    return [[at - dir * 0.010, 0, 0], [at - dir * 0.006, 0.24, 0], [at + dir * 0.004, 0.40, 0], [at + dir * 0.018, 0.49, 0]];
  };
  const taperLength = spec.taper || 0.32;
  const taper = (x, kind) => (kind === 'cut' ? 1 : 0.52 + 0.48 * smoothstep(x, 0.02, taperLength));
  // The fire never eats a log evenly: a burnt end is gnawed away from one side.
  const gnawAngle = seed * 91.7;
  const gnaw = (x) => 0.36 * radius * (
    (spec.endA === 'burnt' ? 1 - smoothstep(x, 0.0, taperLength) : 0)
    + (spec.endB === 'burnt' ? 1 - smoothstep(length - x, 0.0, taperLength) : 0));
  for (const r of endRings(spec.endA, 0, 1)) rings.push(r);
  for (let i = 1; i < body; i++) {
    const x = (i / body) * length;
    rings.push([x, Math.min(taper(x, spec.endA), taper(length - x, spec.endB)), 0]);
  }
  for (const r of endRings(spec.endB, length, -1).reverse()) rings.push(r);

  // No trunk is round: an oval, slightly three-cornered section, turning slowly along it.
  const oval = 0.05 + 0.05 * rng(), ovalAt = rng() * Math.PI;
  const tri = 0.02 + 0.03 * rng(), triAt = rng() * Math.PI;
  // Long splits: as the wood chars it shrinks and opens along the grain. Each is a groove
  // that wanders a little round the log, deepest in the middle of its run.
  const splits = [];
  const splitCount = length > 0.7 ? 3 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2);
  for (let i = 0; i < splitCount; i++) {
    const run = Math.min(length, 0.30 + 0.75 * rng());
    const x0 = rng() * (length - run);
    splits.push({ at: rng() * Math.PI * 2, x0, x1: x0 + run, width: 0.009 + 0.007 * rng(), depth: 0.20 + 0.20 * rng(), phase: rng() * 40 });
  }

  const count = rings.length * around;
  const position = new Float32Array(count * 3);
  const aLog = new Float32Array(count * 4);
  const aHeat = new Float32Array(count * 4);
  const p = new THREE.Vector3();
  const centre = new THREE.Vector3();
  const so = seed * 19.7;
  for (let j = 0; j < rings.length; j++) {
    const [x, scale, cap] = rings[j];
    const u = x / length;
    // A gentle bow plus a wander, so no timber is a ruled cylinder.
    const bow = Math.sin(Math.PI * u) * (spec.bend || 0);
    const wander = 0.012 * noise.value(x * 1.7 + so, 3.1, so);
    const g = gnaw(x);
    centre.copy(a).addScaledVector(T, x)
      .addScaledVector(N1, bow + wander + Math.cos(gnawAngle) * g)
      .addScaledVector(N2, 0.012 * noise.value(so, x * 1.7, 9.2) + Math.sin(gnawAngle) * g);
    // Where a log crosses the heart of the fire it has been eaten thin.
    const eaten = 1 - (spec.eaten || 0) * Math.exp(-centre.distanceToSquared(HOT) / (0.34 * 0.34));
    // How charred this stretch is decides how broken its surface is.
    const charHere = charAt(centre.x, centre.z);
    // A burnt stump is knobbly: the char has broken away in lumps.
    const nearEnd = Math.max(spec.endA === 'burnt' ? 1 - smoothstep(x, 0.0, 0.16) : 0, spec.endB === 'burnt' ? 1 - smoothstep(length - x, 0.0, 0.16) : 0);
    const twist = 0.6 * noise.value(x * 0.9 + so, 7.7, so);
    for (let i = 0; i < around; i++) {
      const th = (i / around) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const section = 1 + oval * Math.cos(2 * (th - ovalAt - twist)) + tri * Math.cos(3 * (th - triAt + twist));
      const lump = 0.10 * noise.fbm(c * 1.1 + so, s * 1.1 - so, x * 1.3, 3)
                 + 0.050 * (noise.ridged(c * 3.6 + so, s * 3.6, x * 1.9 + so, 2) - 0.5)
                 + 0.16 * Math.max(0, noise.value(c * 0.9 + 5 + so, s * 0.9, x * 2.6) - 0.45)          // knots
                 // Char: pits where blocks of it have fallen away, lumps where they hang on.
                 - charHere * 0.12 * smoothstep(noise.value(c * 2.3 + so, s * 2.3 - so, x * 9.0), 0.15, 0.55)
                 + charHere * 0.05 * (noise.ridged(c * 6.0 + so, s * 6.0, x * 15.0, 2) - 0.6)
                 + nearEnd * 0.22 * noise.value(c * 2.9 - so, s * 2.9 + so, x * 14.0);
      let groove = 0, cut = 0;
      for (const sp of splits) {
        const along = smoothstep(x, sp.x0, sp.x0 + 0.10) * (1 - smoothstep(x, sp.x1 - 0.10, sp.x1));
        if (along <= 0) continue;
        const at = sp.at + 0.45 * noise.value(x * 2.3 + sp.phase, sp.phase, 3.3);
        const turn = Math.atan2(Math.sin(th - at), Math.cos(th - at));
        const k = Math.exp(-Math.pow((turn * radius) / sp.width, 2)) * along * charHere;
        groove = Math.max(groove, k);
        cut = Math.max(cut, k * sp.depth);
      }
      const rr = radius * scale * eaten * section * (cap ? 1 : (1 + lump) * (1 - cut));
      p.copy(centre).addScaledVector(N1, c * rr).addScaledVector(N2, s * rr);
      const k = j * around + i;
      position[k * 3] = p.x; position[k * 3 + 1] = p.y; position[k * 3 + 2] = p.z;
      aLog[k * 4] = x; aLog[k * 4 + 1] = c * rr; aLog[k * 4 + 2] = s * rr; aLog[k * 4 + 3] = seed;

      const rAxis = Math.hypot(p.x, p.z);
      const d = Math.hypot(rAxis, (p.y - HOT.y) * 0.85);
      const ragged = 0.12 * noise.fbm(p.x * 4, p.y * 4, p.z * 4, 3);
      aHeat[k * 4] = THREE.MathUtils.clamp((1.25 - rAxis) / 0.36 + ragged * 2.0, 0, 1);
      aHeat[k * 4 + 1] = THREE.MathUtils.clamp(1.22 - d / 0.86 + ragged, 0, 1);
      aHeat[k * 4 + 2] = cap;
      aHeat[k * 4 + 3] = cap ? 0 : groove;
    }
  }
  const index = [];
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < around; i++) {
      const p0 = j * around + i, p1 = j * around + ((i + 1) % around);
      index.push(p0, p1, p0 + around, p1, p1 + around, p0 + around);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(position, 3));
  g.setAttribute('aLog', new THREE.BufferAttribute(aLog, 4));
  g.setAttribute('aHeat', new THREE.BufferAttribute(aHeat, 4));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/**
 * Lays out the pile. Returns the timbers and a few points on them where the wood
 * cracks and throws sparks.
 */
function layoutLogs(rng) {
  const logs = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rad = (deg) => deg * Math.PI / 180;

  // Three heavy timbers woven into a triangle on the coals: each rests one end on the bed
  // and the other on its neighbour.
  for (let k = 0; k < 3; k++) {
    const phi = rad(24 + 120 * k);
    const d = 0.29;
    const r = 0.130 + 0.018 * rng();
    const cx = Math.cos(phi) * d, cz = Math.sin(phi) * d;
    const tx = -Math.sin(phi), tz = Math.cos(phi);
    const half = 0.80 + 0.10 * rng();
    const yLow = coalY(Math.hypot(cx - tx * half, cz - tz * half)) + r + 0.085;
    logs.push({
      a: V(cx - tx * half, yLow, cz - tz * half),
      b: V(cx + tx * (half + 0.06), yLow + 0.34, cz + tz * (half + 0.06)),
      radius: r, seed: rng(), endA: 'burnt', endB: k === 1 ? 'cut' : 'burnt', bend: 0.02 * (rng() - 0.5), eaten: 0.30, taper: 0.30,
    });
  }

  // A cone of lighter timbers leaning together over them. Each passes the axis a hand's
  // width to one side, so they wind round one another like the poles of a tent.
  const cone = [
    { phi: 52, foot: 0.84, apex: 1.80, over: 0.34, r: 0.104 },
    { phi: 121, foot: 0.80, apex: 1.95, over: 0.22, r: 0.092 },
    { phi: 196, foot: 0.86, apex: 1.72, over: 0.42, r: 0.112 },
    { phi: 262, foot: 0.82, apex: 2.02, over: 0.16, r: 0.088 },
    { phi: 334, foot: 0.85, apex: 1.86, over: 0.30, r: 0.100 },
  ];
  for (const c of cone) {
    const phi = rad(c.phi);
    const foot = V(Math.cos(phi) * c.foot, coalY(c.foot) + 0.03, Math.sin(phi) * c.foot);
    const pass = V(-Math.sin(phi) * 0.16, c.apex, Math.cos(phi) * 0.16);
    const dir = new THREE.Vector3().subVectors(pass, foot).normalize();
    logs.push({
      a: foot, b: pass.clone().addScaledVector(dir, c.over),
      radius: c.r, seed: rng(), endA: 'cut', endB: 'burnt', bend: 0.035 * (rng() - 0.5), eaten: 0.18, taper: 0.38,
    });
  }

  // One that slipped and lies lower across the pile, and a long feeder log resting on the
  // rim with its butt outside the bowl, still unburnt bark.
  logs.push({
    a: V(-0.72, coalY(0.78) + 0.10, 0.30), b: V(0.36, 1.26, -0.20),
    radius: 0.094, seed: rng(), endA: 'cut', endB: 'burnt', bend: 0.03, eaten: 0.25, taper: 0.30,
  });
  logs.push({
    a: V(1.62, 0.905, 0.62), b: V(0.10, 0.99, -0.04),
    radius: 0.112, seed: rng(), endA: 'cut', endB: 'burnt', bend: -0.02, eaten: 0.2, taper: 0.45,
  });
  logs.push({
    a: V(-0.98, 0.885, -1.32), b: V(-0.16, 1.00, 0.10),
    radius: 0.086, seed: rng(), endA: 'cut', endB: 'burnt', bend: 0.015, eaten: 0.2, taper: 0.40,
  });

  // Burnt-through stubs lying in the coals.
  for (let i = 0; i < 5; i++) {
    const phi = rng() * Math.PI * 2;
    const r0 = 0.45 + 0.35 * rng();
    const len = 0.24 + 0.22 * rng();
    const yaw = phi + Math.PI / 2 + (rng() - 0.5) * 1.6;
    const rr = 0.045 + 0.03 * rng();
    const c = V(Math.cos(phi) * r0, coalY(r0) + rr * 0.9 + 0.03, Math.sin(phi) * r0);
    logs.push({
      a: c.clone().add(V(Math.cos(yaw) * len / 2, -0.01, Math.sin(yaw) * len / 2)),
      b: c.clone().add(V(-Math.cos(yaw) * len / 2, 0.02, -Math.sin(yaw) * len / 2)),
      radius: rr, seed: rng(), endA: 'burnt', endB: 'burnt', bend: 0, eaten: 0, taper: 0.12,
    });
  }

  // Sparks burst from the hot middle stretch of the lower timbers.
  const pops = [];
  for (let k = 0; k < 9; k++) {
    const log = logs[k];
    const u = 0.3 + 0.4 * rng();
    pops.push(new THREE.Vector3().lerpVectors(log.a, log.b, u).add(V(0, log.radius, 0)));
  }
  return { logs, pops };
}

const LOG_VERT = /* glsl */ `
attribute vec4 aLog;
attribute vec4 aHeat;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec4 vLog;
varying vec4 vHeat;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vLog = aLog;
  vHeat = aHeat;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/** Helpers shared by the log and coal shaders. */
const EMBER_GLSL = /* glsl */ `
// Radiance of glowing charcoal at temperature T: a black body, scaled for the screen.
vec3 emberGlow(float T) {
  float x = saturate((T - 800.0) / 900.0);
  return blackbody(T) * (10.0 * x * x * sqrt(x));
}

// 3D cellular noise. x: distance to the nearest feature point, y: F2 - F1 (zero on the
// walls between cells), z: random id of the nearest cell.
vec3 cells(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(float(x), float(y), float(z));
    vec3 h = hash33(i + o);
    vec3 r = o + h - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h.z; } else if (d < d2) { d2 = d; }
  }
  d1 = sqrt(d1); d2 = sqrt(d2);
  return vec3(d1, d2 - d1, id);
}
`;

const LOG_FRAG = /* glsl */ `
${FRAG_PRELUDE}
${FIRE_GLSL}
${SOLID_GLSL}
${EMBER_GLSL}
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec4 vLog;
varying vec4 vHeat;

// Wood that chars shrinks, and breaks into rows of blocks ("alligatoring"): long cracks
// along the grain, shorter staggered ones across it, like courses of brick.
// st: (metres along the log, angle round it). rows: how many rows go round the log (a whole
// number, so the pattern closes on itself), len: mean length of a block in metres, rad: the
// log's radius here. Returns x: distance to the nearest crack, in metres, y: a random
// number for the block, z: one for its row.
vec3 charBlocks(vec2 st, float rows, float len, float rad) {
  float v = st.y / TAU * rows;
  float row = floor(v);
  float fv = v - row;
  float rid = mod(row, rows);
  vec2 h = hash21(rid * 7.13 + rows * 1.7);
  float l = len * (0.65 + 0.70 * h.y);
  float u = st.x / l + h.x * 13.0;
  float cell = floor(u);
  // The cross cracks do not keep step: each is shifted by up to a third of a block.
  float key = rid * 3.7 + rows;
  float lo = cell + (hash12(vec2(cell, key)) - 0.5) * 0.66;
  float hi = cell + 1.0 + (hash12(vec2(cell + 1.0, key)) - 0.5) * 0.66;
  if (u < lo) { hi = lo; cell -= 1.0; lo = cell + (hash12(vec2(cell, key)) - 0.5) * 0.66; }
  else if (u > hi) { lo = hi; cell += 1.0; hi = cell + 1.0 + (hash12(vec2(cell + 1.0, key)) - 0.5) * 0.66; }
  float across = min(fv, 1.0 - fv) * (TAU * rad / rows);
  float along = min(u - lo, hi - u) * l;
  return vec3(min(across, along), hash12(vec2(cell + 0.5, key + 17.0)), h.x);
}

void main() {
  vec3 lp = vWorldPos - uFireOrigin;
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 N0 = normalize(vNormal);
  float seed = vLog.w;
  vec3 q = vLog.xyz + seed * vec3(17.0, 31.0, 47.0);
  float px = length(fwidth(vLog.xyz));                   // size of a pixel on the surface, metres
  float cap = vHeat.z;
  float groove = vHeat.w;
  float rad = max(length(vLog.yz), 1e-3);
  float ang = atan(vLog.z, vLog.y);

  // Baked noise, stretched along the grain (the log's own x axis).
  vec4 nA = noiseTex(q * vec3(0.9, 1.7, 1.7));           // broad: where the fire has got to, where ash lies
  vec4 nB = noiseTex(q * vec3(1.5, 8.5, 8.5));           // bark: plates 3 cm wide and a hand long
  vec4 nC = noiseTex(q * vec3(8.0, 40.0, 40.0));         // fibre

  // How far the fire has got into this piece of wood, with a ragged front.
  float charred = smoothstep(0.22, 0.50, vHeat.x + (nA.r - 0.5) * 0.5);

  // Char in two generations: plates between a few deep cracks, and the small blocks all
  // over them. The rows wander (the noise bends them), no two blocks are the same length.
  // (the rows are not all one width either: the angle is stretched here and squeezed there)
  float turn = ang + 0.22 * sin(2.0 * ang + seed * 30.0) + 0.09 * sin(5.0 * ang + seed * 70.0);
  vec3 plate = charBlocks(vec2(vLog.x + seed * 5.0 + (nA.b - 0.5) * 0.12, turn + (nA.g - 0.5) * 1.3 + (nB.r - 0.5) * 0.25 + seed * 9.0), 4.0, 0.34, rad);
  vec3 blk = charBlocks(vec2(vLog.x + seed * 3.0 + (nB.b - 0.5) * 0.022 + (nC.g - 0.5) * 0.006, turn + (nB.r - 0.5) * 0.22 + (nA.g - 0.5) * 0.5 + (nC.b - 0.5) * 0.05), 19.0, 0.046, rad);
  // No crack is drawn thinner than a pixel: it is widened, and its glow dimmed by as much.
  const float W_PLATE = 0.0042, W_BLOCK = 0.0017;
  float wPlate = W_PLATE + px * 1.2, wBlock = W_BLOCK + px * 1.2;
  float split = (1.0 - smoothstep(0.0, wPlate, plate.x)) * (1.0 - cap);
  float check = (1.0 - smoothstep(0.0, wBlock, blk.x)) * (1.0 - cap);
  // (1 on the face of a block, falling away into the cracks round it)
  float face = smoothstep(0.0, 0.008, blk.x) * smoothstep(0.0, 0.014, plate.x);
  face = mix(face, 1.0, cap);

  // Bark: corky plates between dark furrows. On a sawn end: growth rings and drying cracks.
  float cork = smoothstep(0.30, 0.62, nB.g);
  float ring = 0.5 + 0.5 * sin(length(vLog.yz) * 300.0 + nA.b * 9.0);
  float hChar = face * 0.0034 + (blk.y - 0.5) * 0.0042 * face + (plate.y - 0.5) * 0.005 - split * 0.007 - groove * 0.004 + (nC.r - 0.5) * 0.0012;
  float hBark = mix(cork * 0.0075 + (nB.b - 0.5) * 0.004 + (nC.r - 0.5) * 0.0015, ring * 0.0006, cap);
  vec3 N = bumpNormal(vWorldPos, N0, mix(hBark, hChar, charred) / (1.0 + sq(px * 45.0)));

  vec3 bark = mix(vec3(0.014, 0.011, 0.009), mix(vec3(0.085, 0.066, 0.050), vec3(0.14, 0.125, 0.105), nC.b), cork) * (0.7 + 0.6 * nA.b);
  vec3 endGrain = mix(vec3(0.30, 0.20, 0.11), vec3(0.19, 0.12, 0.065), ring) * (0.7 + 0.5 * nC.r)
                * (1.0 - 0.7 * smoothstep(0.62, 0.72, nB.r));
  vec3 wood = mix(bark, endGrain, cap);
  // Scorched brown-black toward the fire, before it chars.
  wood = mix(wood, vec3(0.014, 0.012, 0.011), smoothstep(0.05, 0.42, vHeat.x + (nA.r - 0.5) * 0.4));
  // Charcoal: near black, with a dull graphite sheen that differs from block to block.
  vec3 coal = vec3(0.021, 0.020, 0.020) * (0.50 + 1.0 * blk.y) * (0.8 + 0.4 * plate.y);
  float rough = mix(mix(0.88, 0.70, cap), mix(0.46, 0.86, blk.y) + 0.2 * check, charred);
  vec3 base = mix(wood, coal, charred);
  // White ash: it gathers on what faces up and where the wood burns hardest, block by block,
  // and lies on the faces of the blocks, not in the cracks between them.
  float ashy = charred * mix(0.45, 1.0, face) * smoothstep(0.60, 0.92, nA.b * 0.62 + nB.g * 0.26 + (blk.y - 0.5) * 0.16 + (nC.a - 0.5) * 0.20 + N0.y * 0.30 + vHeat.y * 0.20);
  base = mix(base, vec3(0.15, 0.14, 0.13) * (0.7 + 0.6 * nC.b), ashy * 0.8);
  rough = mix(rough, 1.0, ashy);

  Surface s;
  s.P = vWorldPos; s.N = N; s.V = V;
  s.base = base; s.metal = 0.0; s.rough = rough;
  s.ao = mix(0.55 + 0.45 * cork, (0.40 + 0.60 * face) * (1.0 - 0.6 * split), charred) * (1.0 - 0.7 * groove)
       * (0.65 + 0.35 * smoothstep(0.75, 1.3, lp.y));
  s.moonVis = 1.0; s.fireVis = 1.0; s.inside = 1.0;
  vec3 col = shadeSolid(s);

  // The glow. Char burns where air reaches it hot: on the faces turned to the heart of the
  // fire and down at the coals, and deepest in its cracks, which look into the hot inside of
  // the log from any side. The fire eats a log in patches that drift, and the whole of it
  // breathes with a slow pulse of its own and with the gusts.
  vec3 toHeart = vec3(0.0, 0.95, 0.0) - lp;
  toHeart *= inversesqrt(dot(toHeart, toHeart) + 1e-6);
  float facing = dot(N0, toHeart) * 0.5 + 0.5;
  float breath = vnoise(vec3(lp.xz * 2.6 + lp.y * 1.3, uTime * 0.33 + seed * 20.0));
  float pulse = 0.84 + 0.16 * sin(uTime * 0.83 + seed * 40.0);
  float patchy = smoothstep(0.34, 0.66, nA.r * 0.55 + nA.g * 0.50 + (breath - 0.5) * 0.45);
  float burning = vHeat.y * charred * (0.30 + 0.90 * patchy) * pulse * uFireState.w;
  // Higher up, in the body of the flames, the char burns too, though only its cracks show
  // it: a net of dull orange lines, flickering faster than the embers below.
  float inFire = (1.0 - smoothstep(0.30, 0.95, length(lp.xz))) * smoothstep(0.80, 1.15, lp.y) * (1.0 - smoothstep(2.05, 2.5, lp.y));
  float lick = vnoise(vec3(lp.xz * 4.0 + lp.y * 2.0, uTime * 1.3 + seed * 20.0));
  float deep = max(burning, inFire * charred * (0.16 + 0.34 * lick * lick) * (0.6 + 0.4 * uFireState.w));
  if (deep > 0.0) {
    // Air drawn through the cracks makes them shimmer.
    float shimmer = 0.85 + 0.30 * vnoise(vec3(q.x * 23.0, ang * 5.0, uTime * 2.7 + seed * 9.0));
    float outer = burning * (0.25 + 0.75 * facing * facing);          // the faces only glow where they are kept hot
    // (a split does not glow evenly along its length: stretches of it are choked with ash)
    float run = smoothstep(0.30, 0.60, nB.a * 0.6 + nA.r * 0.5 + (breath - 0.5) * 0.3);
    float tSplit = 900.0 + 640.0 * saturate(deep * 1.25) * (0.55 + 0.45 * run);
    float tCheck = 860.0 + 600.0 * saturate(deep * (0.80 + 0.5 * blk.y));
    float tFace = 770.0 + 620.0 * saturate(outer * 1.7 - 0.55 + (blk.y - 0.5) * 0.45);
    float inSplit = max(split * (W_PLATE / wPlate), smoothstep(0.55, 0.98, groove) * 0.012 / (0.012 + px));
    col += (emberGlow(tSplit) * inSplit * 1.2
          + emberGlow(tCheck) * check * (W_BLOCK / wBlock) * (1.0 - split)) * shimmer
         + emberGlow(tFace) * face * (1.0 - ashy * 0.85) * (0.55 + 0.45 * nC.r);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

// ------------------------------------------------------------------------------- coal bed

// The bed is two things: a smooth heap that glows from within, and several hundred
// separate lumps of charcoal lying on it. The glow is seen through the gaps between them.

const BED_VERT = /* glsl */ `
${VERT_PRELUDE}
${FIRE_GLSL}
varying vec3 vWorldPos;
void main() {
  vec3 p = position;
  float r = length(p.xz);
  // The heap, kept inside the plate of the bowl at its edge.
  p.y = max(coalY(r) - 0.03 + 0.012 * vnoise(p.xz * 24.0), bowlInnerY(r) - 0.012);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const BED_FRAG = /* glsl */ `
${FRAG_PRELUDE}
${FIRE_GLSL}
${SOLID_GLSL}
${EMBER_GLSL}
varying vec3 vWorldPos;

void main() {
  vec3 lp = vWorldPos - uFireOrigin;
  vec2 p = lp.xz;
  float r = length(p);
  vec3 V = normalize(cameraPosition - vWorldPos);

  // Granular embers: hot grains, dead grey grains, all of it shimmering as air is drawn through.
  vec3 grain = voronoi(p * 46.0);
  float slow = vnoise(vec3(p * 2.3, uTime * 0.22));
  float shimmer = vnoise(vec3(p * 17.0, uTime * 3.1));
  float heart = 1.0 - smoothstep(0.2, 1.0, r);
  float heat = (0.42 + 0.33 * heart + 0.35 * slow) * (0.80 + 0.35 * shimmer) * uFireState.w;
  float dead = smoothstep(0.55, 0.80, grain.z + (0.5 - heat) * 0.5);
  float T = 900.0 + 620.0 * saturate(heat * (0.75 + 0.45 * grain.z) - grain.x * 0.25);

  Surface s;
  s.P = vWorldPos; s.N = vec3(0.0, 1.0, 0.0); s.V = V;
  s.base = mix(vec3(0.03), vec3(0.20, 0.19, 0.18), dead);
  s.metal = 0.0; s.rough = 1.0; s.ao = 0.5;
  s.moonVis = 1.0; s.fireVis = 1.0; s.inside = 1.0;
  vec3 col = shadeSolid(s) + emberGlow(T) * (1.0 - 0.9 * dead);
  gl_FragColor = vec4(col, 1.0);
}
`;

const LUMP_VERT = /* glsl */ `
attribute float aSeed;
varying vec3 vWorldPos;
varying vec3 vLocal;
varying float vSeed;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vLocal = position;
  vSeed = aSeed;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const LUMP_FRAG = /* glsl */ `
${FRAG_PRELUDE}
${FIRE_GLSL}
${SOLID_GLSL}
${EMBER_GLSL}
varying vec3 vWorldPos;
varying vec3 vLocal;
varying float vSeed;

void main() {
  vec3 lp = vWorldPos - uFireOrigin;
  vec3 V = normalize(cameraPosition - vWorldPos);
  // Charcoal breaks along flat faces: shade the facets of the mesh, unsmoothed.
  vec3 N = cross(dFdx(vWorldPos), dFdy(vWorldPos));
  N *= (dot(N, V) < 0.0 ? -1.0 : 1.0) * inversesqrt(dot(N, N) + 1e-20);
  float px = length(fwidth(vLocal));

  vec3 q = vLocal * 2.6 + vSeed * vec3(13.0, 71.0, 29.0);
  vec3 c = cells(q);
  float fissure = (1.0 - smoothstep(0.0, 0.07 + px * 2.6, c.y)) * (0.07 / (0.07 + px * 2.6));
  float grainy = noiseTex(q * 0.5).b;

  // Each lump keeps its own slowly wandering temperature. Faces turned toward the bed and
  // toward the heart of the fire run hottest; the top crusts over with ash and goes dark.
  float slow = vnoise(vec2(uTime * 0.27 + vSeed * 53.0, vSeed * 91.0));
  float shimmer = vnoise(lp * 11.0 + vec3(0.0, uTime * 2.9 + vSeed * 7.0, 0.0));
  float heart = 1.0 - smoothstep(0.1, 1.0, length(lp.xz));
  float sheltered = saturate(0.62 - 0.75 * N.y);
  float heat = (0.08 + 0.30 * heart + 0.80 * smoothstep(0.22, 0.80, slow)) * (0.40 + 1.0 * sheltered) * (0.82 + 0.36 * shimmer) * uFireState.w;
  float ash = smoothstep(0.50, 0.78, grainy + N.y * 0.34 - heat * 0.50 + (c.z - 0.5) * 0.3);

  Surface s;
  s.P = vWorldPos; s.N = N; s.V = V;
  s.base = mix(vec3(0.020, 0.019, 0.019) * (0.6 + 0.8 * c.z), vec3(0.165, 0.150, 0.135), ash * 0.85);
  s.metal = 0.0; s.rough = mix(0.72 + 0.2 * c.z, 1.0, ash);
  s.ao = 0.45 + 0.55 * saturate(N.y * 0.5 + 0.5);
  // The fire and its smoke stand between the bed and the moon.
  s.moonVis = 0.3; s.fireVis = 1.0; s.inside = 1.0;
  vec3 col = shadeSolid(s);

  float tFace = 790.0 + 640.0 * saturate(heat * (0.80 + 0.45 * c.z) - 0.10);
  float tFissure = 900.0 + 800.0 * saturate(heat * 1.5);
  col += emberGlow(tFace) * (1.0 - 0.9 * ash) * (0.65 + 0.35 * grainy) + emberGlow(tFissure) * fissure * 0.55;
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * One angular lump of charcoal, unit size, as a low-polygon mesh (flat-shaded in the shader).
 * subdivisions: 1 for the close view (80 facets), 0 from further away (20).
 */
function buildLumpGeometry(rng, subdivisions) {
  const g = new THREE.IcosahedronGeometry(1, subdivisions);
  const pos = g.attributes.position;
  // Jitter by position so that the duplicated vertices of neighbouring faces stay welded.
  const jitter = (x, y, z) => {
    const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return h - Math.floor(h);
  };
  const cuts = [];
  for (let i = 0; i < 5; i++) {
    const n = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
    cuts.push({ n, d: 0.55 + 0.3 * rng() });
  }
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(0.78 + 0.44 * jitter(v.x, v.y, v.z));
    for (const c of cuts) {
      const e = v.dot(c.n) - c.d;
      if (e > 0) v.addScaledVector(c.n, -e);
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  return g;
}

// The bed lies inside the bowl, below its rim: nothing of it shows in the reflection (which
// sees the bowl from underneath) and it casts no shadow, so it is drawn in the main view only.
function buildCoals(ctx, fireUniforms) {
  const group = new THREE.Group();
  const rng = ctx.rng(5150);

  // A polar grid (a ring with a pin-hole centre) that the vertex shader bends into the heap.
  const grid = new THREE.RingGeometry(0.001, COALS.radius + 0.06, 72, 22);
  grid.rotateX(-Math.PI / 2);
  grid.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.7, 0), 1.4);
  const bed = new THREE.Mesh(grid, new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fireUniforms },
    vertexShader: BED_VERT,
    fragmentShader: BED_FRAG,
  }));
  bed.name = 'coal-bed';
  bed.layers.set(ctx.LAYERS.MAIN_ONLY);
  group.add(bed);

  const count = 620;
  const lumpMaterial = new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fireUniforms },
    vertexShader: LUMP_VERT,
    fragmentShader: LUMP_FRAG,
  });
  // (the two tessellations are cut by the same planes: both builders draw the same numbers)
  const fineGeometry = buildLumpGeometry(rng, 1), coarseGeometry = buildLumpGeometry(ctx.rng(5150), 0);
  const placed = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const r = (COALS.radius + 0.02) * Math.sqrt(rng());
    const th = rng() * Math.PI * 2;
    const s = 0.030 + 0.034 * rng() + (rng() < 0.12 ? 0.03 : 0);
    sc.set(s * (0.9 + 0.9 * rng()), s * (0.6 + 0.5 * rng()), s * (0.8 + 0.6 * rng()));
    const reach = Math.max(sc.x, sc.y, sc.z) * 1.15;      // furthest any corner gets from the centre
    // Mostly one layer, with a second one heaped toward the middle. Near the edge of the
    // bed the lumps rest on the plate of the bowl rather than in it.
    const stacked = rng() < 0.30 * (1 - r) ? s * 1.3 : 0;
    const y = Math.max(coalY(r) + s * (0.15 + 0.45 * rng()), bowlInnerY(r + reach) + reach * 0.8) + stacked;
    p.set(Math.cos(th) * r, y, Math.sin(th) * r);
    e.set(rng() * 6.28, rng() * 6.28, rng() * 6.28);
    q.setFromEuler(e);
    placed.push({ matrix: new THREE.Matrix4().compose(p, q, sc), seed: rng(), size: sc.x * sc.y * sc.z });
  }
  // Biggest first: from far away only the first so many are drawn (see setDetail), and the
  // ones left out are the ones too small to see from there.
  placed.sort((m, n) => n.size - m.size);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = placed[i].seed;
  const lumps = [fineGeometry, coarseGeometry].map((geometry, level) => {
    const mesh = new THREE.InstancedMesh(geometry, lumpMaterial, count);
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, placed[i].matrix);
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.75, 0), 1.2);
    mesh.name = level === 0 ? 'coals' : 'coals-far';
    mesh.layers.set(ctx.LAYERS.MAIN_ONLY);
    group.add(mesh);
    return mesh;
  });

  /** detail: 0 the faceted lumps, 1 or 2 the plain ones. share: the fraction of them worth drawing, 0..1. */
  const setDetail = (detail, share) => {
    lumps[0].visible = detail === 0;
    lumps[1].visible = detail !== 0;
    lumps[1].count = Math.max(1, Math.round(count * share));
  };
  return { group, setDetail };
}

/**
 * Where the flames take root, as a small 3D texture over the pile. A flame stands on its
 * fuel: it starts on the surface of a burning timber, or on a hot patch of the coal bed,
 * and rises from there. Two channels:
 *   r  how rich the gas is in fuel, 0..1: 1 on the charred surfaces, falling off within a
 *      hand's width to their sides, and carried upward from every source (fading over a few
 *      tens of centimetres, spreading a little) as the flame it feeds would be;
 *   g  how far that gas has risen since it left the fuel, in units of FUEL_FIELD.rise metres:
 *      young gas has not met its air yet, so a flame is dark and blue at its foot.
 * The flame shader reads both low in the fire, where the flames are still individuals.
 */
export const FUEL_FIELD = { min: [-1.28, 0.62, -1.28], size: [2.56, 1.92, 2.56], res: [64, 48, 64], rise: 0.6 };

function buildFuelField(logs, noise) {
  const [nx, ny, nz] = FUEL_FIELD.res;
  const [x0, y0, z0] = FUEL_FIELD.min;
  const [sx, sy, sz] = FUEL_FIELD.size;
  const field = new Float32Array(nx * ny * nz);
  const risen = new Float32Array(nx * ny * nz);          // metres above the source
  const px = (i) => x0 + (i + 0.5) / nx * sx;
  const py = (j) => y0 + (j + 0.5) / ny * sy;
  const pz = (k) => z0 + (k + 0.5) / nz * sz;
  const clampIndex = (v, n) => Math.max(0, Math.min(n - 1, v));
  const smoothstep = THREE.MathUtils.smoothstep;

  for (const log of logs) {
    const ax = log.a.x, ay = log.a.y, az = log.a.z;
    const bx = log.b.x - ax, by = log.b.y - ay, bz = log.b.z - az;
    const len2 = bx * bx + by * by + bz * bz;
    const reach = log.radius + 0.20;
    const i0 = clampIndex(Math.floor((Math.min(log.a.x, log.b.x) - reach - x0) / sx * nx), nx), i1 = clampIndex(Math.ceil((Math.max(log.a.x, log.b.x) + reach - x0) / sx * nx), nx);
    const j0 = clampIndex(Math.floor((Math.min(log.a.y, log.b.y) - reach - y0) / sy * ny), ny), j1 = clampIndex(Math.ceil((Math.max(log.a.y, log.b.y) + reach - y0) / sy * ny), ny);
    const k0 = clampIndex(Math.floor((Math.min(log.a.z, log.b.z) - reach - z0) / sz * nz), nz), k1 = clampIndex(Math.ceil((Math.max(log.a.z, log.b.z) + reach - z0) / sz * nz), nz);
    for (let k = k0; k <= k1; k++) {
      const z = pz(k);
      for (let j = j0; j <= j1; j++) {
        const y = py(j);
        for (let i = i0; i <= i1; i++) {
          const x = px(i);
          const t = THREE.MathUtils.clamp(((x - ax) * bx + (y - ay) * by + (z - az) * bz) / len2, 0, 1);
          const cx = ax + bx * t, cy = ay + by * t, cz = az + bz * t;
          const burning = charAt(cx, cz);
          if (burning <= 0) continue;
          const d = Math.hypot(x - cx, y - cy, z - cz) - log.radius * 0.9;
          if (d > 0.2) continue;
          const value = burning * Math.exp(-Math.max(d, 0) / 0.055);
          const n = i + nx * (j + ny * k);
          if (value > field[n]) field[n] = value;
        }
      }
    }
  }
  // Hot patches of the coal bed: low flames that play over the coals between the timbers.
  for (let k = 0; k < nz; k++) {
    const z = pz(k);
    for (let i = 0; i < nx; i++) {
      const x = px(i);
      const r = Math.hypot(x, z);
      if (r > COALS.radius - 0.04) continue;
      const hot = smoothstep(noise.fbm(x * 2.4 + 7.1, 0.37, z * 2.4 - 3.3, 2), -0.02, 0.30) * (1 - smoothstep(r, 0.55, COALS.radius - 0.04));
      if (hot <= 0) continue;
      const top = coalY(r) + 0.04;
      for (let j = 0; j < ny; j++) {
        const value = 0.85 * hot * Math.exp(-Math.max(py(j) - top, 0) / 0.07);
        if (value < 0.02) break;
        const n = i + nx * (j + ny * k);
        if (value > field[n]) field[n] = value;
      }
    }
  }
  // Carry every source upward: each layer is what rose from the one below (a little wider,
  // a little weaker, a layer older) or what starts here, whichever is richer.
  const dy = sy / ny;
  const decay = Math.exp(-dy / 0.34);
  const layer = nx * ny;
  for (let j = 1; j < ny; j++) {
    for (let k = 0; k < nz; k++) {
      const km = Math.max(k - 1, 0), kp = Math.min(k + 1, nz - 1);
      for (let i = 0; i < nx; i++) {
        const im = Math.max(i - 1, 0), ip = Math.min(i + 1, nx - 1);
        const row = nx * (j - 1);
        const c = i + row + layer * k, w = im + row + layer * k, e = ip + row + layer * k, s = i + row + layer * km, t = i + row + layer * kp;
        const sum = 0.52 * field[c] + 0.12 * (field[w] + field[e] + field[s] + field[t]);
        const below = decay * sum;
        const n = i + nx * (j + ny * k);
        if (below > field[n]) {
          // (the age of what arrives: the mean age of the gas that makes it up)
          const age = sum > 1e-6 ? (0.52 * field[c] * risen[c] + 0.12 * (field[w] * risen[w] + field[e] * risen[e] + field[s] * risen[s] + field[t] * risen[t])) / sum : 0;
          const own = field[n] / below;                  // share of the gas that starts here
          field[n] = below;
          risen[n] = (age + dy) * (1 - own);
        }
      }
    }
  }
  const data = new Uint8Array(nx * ny * nz * 2);
  for (let n = 0; n < field.length; n++) {
    data[n * 2] = Math.round(Math.min(field[n], 1) * 255);
    data[n * 2 + 1] = Math.round(Math.min(risen[n] / FUEL_FIELD.rise, 1) * 255);
  }
  const texture = new THREE.Data3DTexture(data, nx, ny, nz);
  texture.format = THREE.RGFormat;
  texture.type = THREE.UnsignedByteType;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Builds the logs and the coal bed. Returns { group, pops, fuelField, setDetail }: pops are
 * the local positions where sparks burst, fuelField the 3D texture of where the flames take
 * root (see buildFuelField), setDetail(detail, share) chooses what the main view draws.
 */
export function createFuel(ctx, fireUniforms) {
  const group = new THREE.Group();
  group.name = 'fuel';
  const rng = ctx.rng(9001);
  const noise = createNoise(311);
  const { MAIN_ONLY, MIRROR_ONLY } = ctx.LAYERS;

  const { logs, pops } = layoutLogs(rng);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fireUniforms },
    vertexShader: LOG_VERT,
    fragmentShader: LOG_FRAG,
  });
  // The pile at three levels of detail. The main view draws the one whose triangles are
  // about a pixel or two across from where the eye is (smaller ones cost time and show
  // nothing); the coarsest is also what the reflection (half size, rippled) and the shadow
  // map (soft) are drawn from.
  const geometries = [0, 1, 2].map((detail) => {
    const shapeRng = ctx.rng(7411);
    return mergeGeometries(logs.map((spec) => buildLog(spec, noise, shapeRng, detail)));
  });
  const mesh = (geometry, layer, name) => {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    // All of them may cast: the shadow map is drawn with whatever the first pass of the
    // frame can see, which is the mirror's stand-in (or, with the reflection switched
    // off, the main view's own mesh).
    m.castShadow = true;
    m.layers.set(layer);
    group.add(m);
    return m;
  };
  const levels = geometries.map((geometry, detail) => mesh(geometry, MAIN_ONLY, detail === 0 ? 'logs' : `logs-${detail}`));
  mesh(geometries[2], MIRROR_ONLY, 'logs-mirror');

  const coals = buildCoals(ctx, fireUniforms);
  group.add(coals.group);

  /** detail: 0 (the eye is close), 1 or 2 (far). share: fraction of the coal lumps worth drawing, 0..1. */
  const setDetail = (detail, share) => {
    for (let i = 0; i < levels.length; i++) levels[i].visible = i === detail;
    coals.setDetail(detail, share);
  };
  setDetail(1, 1);

  return { group, pops, fuelField: buildFuelField(logs, noise), setDetail };
}
