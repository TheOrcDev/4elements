import { RADIUS, glslFloat as f } from './waves.js';

// The seabed at the foot of the column, described analytically so the ray tracer can
// intersect it without a mesh: a sand surface made of a few soft dunes, and a handful of
// boulders half sunk into it. Each boulder is an ellipsoid whose skin is pushed in and out
// by baked noise; the ray finds the ellipsoid in closed form and then walks the last few
// centimetres through the relief. (gFoot, the size of a pixel at the column, is a global of the
// shader these chunks go into.)

// Dunes: centre x, centre z, height (m), falloff (1/m^2). Height = base + sum of gaussians.
const SAND_BASE = 0.05;
const DUNES = [
  [0.45, -0.35, 0.30, 0.42],
  [-1.15, 0.85, 0.17, 1.30],
  [1.30, 1.10, 0.10, 1.10],
];

// The sand thins to nothing where it meets the wall, so the foot of the column is clean water.
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function sandHeight(x, z) {
  const r = Math.hypot(x, z);
  let dunes = 0;
  for (const [cx, cz, a, k] of DUNES) dunes += a * Math.exp(-k * ((x - cx) ** 2 + (z - cz) ** 2));
  return SAND_BASE * (1 - smooth(RADIUS - 0.5, RADIUS, r)) + dunes * (1 - smooth(RADIUS - 0.9, RADIUS - 0.1, r));
}

/** Nothing of the sand rises above this height (the sand march starts here). */
export const SAND_TOP = 0.46;

// Boulders: x, z, radii (x, y, z), yaw, how far the centre sits above the sand as a
// fraction of the vertical radius (below 1 means it is partly buried).
const ROCK_SPEC = [
  [-0.95, 0.60, 0.62, 0.52, 0.50, 0.5, 0.45],
  [-0.48, 1.02, 0.36, 0.29, 0.30, -0.4, 0.45],
  [-1.52, 0.18, 0.25, 0.18, 0.21, 1.2, 0.35],
  [1.12, -0.78, 0.46, 0.66, 0.52, 1.1, 0.55],
  [0.72, -1.30, 0.31, 0.25, 0.35, 0.3, 0.50],
  [1.62, 0.70, 0.23, 0.15, 0.19, -0.9, 0.30],
  [-0.25, -1.62, 0.33, 0.20, 0.26, 2.0, 0.35],
  [0.20, 1.55, 0.21, 0.14, 0.17, 0.7, 0.30],
];
// How far the relief pushes a boulder's skin in and out, as a fraction of its smallest radius.
const ROCK_CRAG = 0.85;

const ROCKS = ROCK_SPEC.map(([x, z, rx, ry, rz, yaw, lift]) => ({
  x, z, rx, ry, rz, y: sandHeight(x, z) + ry * lift, cos: Math.cos(yaw), sin: Math.sin(yaw),
}));

// Nothing of any boulder rises above this height: rays that stay higher skip them all.
const ROCK_TOP = Math.max(...ROCKS.map((r) => r.y + r.ry + Math.min(r.rx, r.ry, r.rz) * ROCK_CRAG * 0.5));

/** Places on the bed where bubbles seep out: tucked against the boulders. */
export const VENTS = [
  [-0.62, 0.20],
  [0.78, -0.42],
  [-1.25, 1.05],
  [1.35, -1.25],
  [0.05, 1.20],
  [-0.30, -1.20],
].map(([x, z]) => [x, sandHeight(x, z), z]);

/** The boulders as data. The reflection uses it on its own, to draw them as plain ellipsoids. */
export const ROCK_DATA_GLSL = /* glsl */ `
const int ROCK_COUNT = ${ROCKS.length};
// xyz = centre, w = cos(yaw)
const vec4 ROCK_C[ROCK_COUNT] = vec4[ROCK_COUNT](
${ROCKS.map((r) => `  vec4(${f(r.x)}, ${f(r.y)}, ${f(r.z)}, ${f(r.cos)})`).join(',\n')}
);
// xyz = radii, w = sin(yaw)
const vec4 ROCK_R[ROCK_COUNT] = vec4[ROCK_COUNT](
${ROCKS.map((r) => `  vec4(${f(r.rx)}, ${f(r.ry)}, ${f(r.rz)}, ${f(r.sin)})`).join(',\n')}
);
`;

export const BED_GLSL = /* glsl */ `
#define SAND_TOP ${f(SAND_TOP)}
#define ROCK_TOP ${f(ROCK_TOP)}
const int DUNE_COUNT = ${DUNES.length};
const vec4 DUNE[DUNE_COUNT] = vec4[DUNE_COUNT](
${DUNES.map((d) => `  vec4(${d.map(f).join(', ')})`).join(',\n')}
);
${ROCK_DATA_GLSL}
// Sand height above the film: a thin base plus the dunes, both thinning to nothing at the wall.
float sandHeight(vec2 x) {
  float r = length(x);
  float dunes = 0.0;
  for (int i = 0; i < DUNE_COUNT; i++) {
    vec2 o = x - DUNE[i].xy;
    dunes += DUNE[i].z * exp(-DUNE[i].w * dot(o, o));
  }
  return ${f(SAND_BASE)} * (1.0 - smoothstep(${f(RADIUS - 0.5)}, ${f(RADIUS)}, r))
       + dunes * (1.0 - smoothstep(${f(RADIUS - 0.9)}, ${f(RADIUS - 0.1)}, r));
}
// Its gradient, away from the wall (the thinning there is too gentle to matter for shading).
vec2 sandGradient(vec2 x) {
  vec2 g = vec2(0.0);
  for (int i = 0; i < DUNE_COUNT; i++) {
    vec2 o = x - DUNE[i].xy;
    g -= 2.0 * DUNE[i].w * DUNE[i].z * exp(-DUNE[i].w * dot(o, o)) * o;
  }
  return g;
}

// Into the frame of boulder i (yawed, then squashed to a unit sphere).
vec3 toRock(int i, vec3 v) {
  float c = ROCK_C[i].w, s = ROCK_R[i].w;
  return vec3(c * v.x + s * v.z, v.y, c * v.z - s * v.x) / ROCK_R[i].xyz;
}

// Signed distance (near enough) from p to boulder i. relief = where its skin stands here:
// 0 deep in a hollow, 1 on a knob.
float rockDistance(int i, vec3 p, out float relief) {
  vec3 o = p - ROCK_C[i].xyz;
  float cy = ROCK_C[i].w, sy = ROCK_R[i].w;
  vec3 l = vec3(cy * o.x + sy * o.z, o.y, cy * o.z - sy * o.x);
  vec3 r = ROCK_R[i].xyz;
  float size = min(r.x, min(r.y, r.z));
  float k0 = length(l / r), k1 = length(l / (r * r));
  vec4 n = noiseTexLod(l * (0.21 / size) + float(i) * 0.37, 0.0);
  relief = n.r * 0.72 + n.b * 0.28;
  return k0 * (k0 - 1.0) / max(k1, 1e-3) - size * (relief - 0.5) * ${f(ROCK_CRAG)};
}

// Nearest boulder along the ray p + d t, t in (0, tMax). Returns t or -1; n = surface
// normal, relief as above. The ray is clipped to each boulder's padded ellipsoid in closed
// form and sphere-traced only inside it.
float intersectRocks(vec3 p, vec3 d, float tMax, out vec3 n, out float which, out float relief) {
  float best = tMax;
  which = -1.0;
  relief = 0.5;
  n = vec3(0.0, 1.0, 0.0);
  // A ray that stays above every boulder gets a loop of no iterations (a loop length,
  // unlike a branch, is something no compiler will trade for arithmetic).
  bool over = p.y > ROCK_TOP && (d.y >= 0.0 || p.y + d.y * tMax > ROCK_TOP);
  int count = over ? 0 : ROCK_COUNT;
  for (int i = 0; i < count; i++) {
    vec3 r = ROCK_R[i].xyz;
    vec3 shell = r + min(r.x, min(r.y, r.z)) * ${f(ROCK_CRAG * 0.5)};
    float cy = ROCK_C[i].w, sy = ROCK_R[i].w;
    vec3 o = p - ROCK_C[i].xyz;
    o = vec3(cy * o.x + sy * o.z, o.y, cy * o.z - sy * o.x) / shell;
    vec3 v = vec3(cy * d.x + sy * d.z, d.y, cy * d.z - sy * d.x) / shell;
    float a = dot(v, v), b = dot(o, v), c = dot(o, o) - 1.0;
    float h = b * b - a * c;
    // Missing the shell likewise leaves the walk below with nowhere to go.
    float root = sqrt(max(h, 0.0));
    float t = max((-b - root) / a, 0.0);
    float tOut = h > 0.0 ? min((-b + root) / a, best) : -1.0;
    float rel = 0.5;
    bool found = false;
    for (int k = 0; k < 18 && t < tOut; k++) {
      float dist = rockDistance(i, p + d * t, rel);
      if (dist < max(0.004, 0.4 * gFoot)) { found = true; break; }      // within half a pixel of the skin
      t += dist * 0.7;                      // the relief makes the field a little steeper than a true distance
    }
    if (found) { best = t; which = float(i); relief = rel; }
  }
  if (which < 0.0) return -1.0;
  // Normal from the distance field: four taps on a tetrahedron.
  int i = int(which);
  vec3 q = p + d * best;
  vec2 e = vec2(1.0, -1.0) * max(0.012, gFoot);            // never finer than a pixel: no sparkle from far off
  float unused;
  n = normalize(e.xyy * rockDistance(i, q + e.xyy, unused) + e.yyx * rockDistance(i, q + e.yyx, unused)
              + e.yxy * rockDistance(i, q + e.yxy, unused) + e.xxx * rockDistance(i, q + e.xxx, unused));
  return best;
}

// Where the ray meets the sand. The dunes are smooth with a bounded slope, so stepping by
// (height above sand) / (worst closing speed) can never tunnel through them.
float intersectSand(vec3 p, vec3 d, float tMax) {
  float t = 0.0;
  bool clear = false;                 // above the highest dune and not coming down
  if (p.y > SAND_TOP) {
    clear = d.y >= 0.0;
    t = (SAND_TOP - p.y) / min(d.y, -1e-5);
  }
  float k = 1.0 / (abs(d.y) + 0.4 * length(d.xz) + 1e-5);
  float gap = 1.0;
  float found = -1.0;
  // A ray that never comes near the sand walks no steps at all (the count is data, so no
  // compiler can decide to walk them anyway and throw the result away).
  int steps = clear || t > tMax ? 0 : 12;
  for (int i = 0; i < steps; i++) {
    if (t > tMax) { gap = 1.0; break; }
    vec3 q = p + d * t;
    if (d.y > 0.0 && q.y > SAND_TOP) { gap = 1.0; break; }
    gap = q.y - sandHeight(q.xz);
    if (gap < 0.0015) { found = t; break; }
    t += gap * k;
  }
  // Out of steps but all but there (a ray skimming a dune): call it a hit.
  return found < 0.0 && gap < 0.03 && t < tMax ? t : found;
}

// Soft shadow (x) and contact occlusion (y) cast on the bed point q by every boulder but
// 'skipRock', treating them as plain ellipsoids. l = unit direction toward the light.
vec2 rockShade(vec3 q, vec3 l, float skipRock) {
  float shadow = 1.0, occlusion = 1.0;
  for (int i = 0; i < ROCK_COUNT; i++) {
    if (float(i) == skipRock) continue;
    vec3 o = toRock(i, q - ROCK_C[i].xyz);
    vec3 v = toRock(i, l);
    v /= length(v);
    float along = -dot(o, v);                           // where the light ray passes closest to the centre
    float miss = length(o + v * max(along, 0.0));       // ... and by how much (1 = grazing the boulder)
    shadow *= mix(1.0, smoothstep(0.80, 1.25, miss), step(0.0, along));
    float touch = clamp((1.55 - length(o)) / 0.55, 0.0, 1.0);
    occlusion *= 1.0 - 0.55 * touch * touch;
  }
  return vec2(shadow, occlusion);
}
`;
