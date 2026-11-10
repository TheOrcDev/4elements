// The rock, written once as GLSL and used twice: bake.js evaluates the distance fields on a
// grid to build the meshes, and the materials evaluate the same strata / fissure / geode
// functions per pixel, which is what keeps the painted beds exactly on the carved ledges.
//
// "Rock space" is the monolith's own frame: metres, +Y up, origin at the heart of the geode.
// Both chunks need the core prelude in front of them (noiseTex, hashes, rot2, sq).

// Constants the JavaScript side needs as well (crystal placement, lights). The GLSL below is
// generated from them so the two can never disagree.
export const FISSURE_NORMAL = [0.848048, 0, 0.529919];     // unit normal of the fissure plane
export const FISSURE_OUT = [-0.529919, 0, 0.848048];       // horizontal direction out of the rock, in that plane
export const GEODE_CENTRE = [FISSURE_OUT[0] * 0.62, 0.05, FISSURE_OUT[2] * 0.62];
export const GEODE_RADII = [0.48, 0.86, 0.95];             // across the fissure, up, along FISSURE_OUT

// The rubble island under the monolith is a low mound: this is the height of its bed above
// the water film at element-local (x, z), before the stones are piled on it. Negative = under water.
const MOUND_HEIGHT = 0.36;
const MOUND_RADIUS = 1.5;
export function moundHeight(x, z) {
  const r = Math.hypot(x, z * 1.12) + 0.22 * Math.sin(x * 1.3 + 0.4) * Math.sin(z * 1.7 + 1.1);
  return MOUND_HEIGHT * Math.exp(-(r * r) / (MOUND_RADIUS * MOUND_RADIUS)) - 0.07;
}

const vec3 = (v) => `vec3(${v.map((x) => x.toFixed(6)).join(', ')})`;

// Shared by the bake and by every earth material.
export const FIELD_GLSL = /* glsl */ `
float tri(float x) { return abs(fract(x) - 0.5) * 4.0 - 1.0; }       // triangle wave, period 1, [-1, 1]

// ---------------------------------------------------------------- the fissure
// The monolith split along a master joint: a vertical plane with normal FIS_N. FIS_D is
// the horizontal direction in that plane that points out of the rock toward the viewer.
const vec3 FIS_N = ${vec3(FISSURE_NORMAL)};
const vec3 FIS_D = ${vec3(FISSURE_OUT)};

// Signed offset from the fracture surface: the plane, broken into facets by triangle
// waves so the crack zig-zags down the face and through the depth of the rock.
float fissurePlane(vec3 p) {
  float q = dot(p, FIS_D);
  return dot(p, FIS_N) - 0.03 + 0.05 * p.y
       + 0.100 * tri(p.y * 0.83 + 0.15)
       + 0.045 * tri(p.y * 2.10 + q * 0.4 + 1.3)
       + 0.055 * tri(q * 1.10 + p.y * 0.5 + 0.7);
}

// The crack gapes at the top of the front face and closes toward the back of the rock and
// toward its root, so the two halves are still one body. Half-width of the gap at p:
const float FIS_GAPE = 0.17;
float fissureOpening(vec3 p) {
  return FIS_GAPE * smoothstep(-1.45, 0.9, p.y) * smoothstep(-0.95, 1.1, dot(p, FIS_D));
}
// One half also slipped a few centimetres along the fault as the crack opened, so its beds
// no longer meet the other half's across the gap.
const vec3 FIS_SLIP = vec3(0.0, 0.07, 0.0);

// Where a point of one half lay before the rock split. side: +1 for the half on +FIS_N, -1 for the other.
vec3 unsplit(vec3 p, float side) {
  float o = fissureOpening(p);
  vec3 q = p - side * FIS_N * o;
  return side < 0.0 ? q + FIS_SLIP * (o / FIS_GAPE) : q;
}

// ---------------------------------------------------------------- the geode
// A hollow inside the massive sandstone bed, cut in two by the fissure and broken open at
// the front face. Negative inside the hollow; roughly metres near its wall.
const vec3 GEODE_C = ${vec3(GEODE_CENTRE)};
const vec3 GEODE_R = ${vec3(GEODE_RADII)};                // radii across the fissure, up, and along FIS_D
float geodeDist(vec3 p) {
  vec3 r = p - GEODE_C;
  vec3 q = vec3(dot(r, FIS_N), r.y, dot(r, FIS_D)) / GEODE_R;
  float lumps = noiseTexLod(p * 0.23 + 0.17, 0.0).g - 0.5;     // (explicit level: also called inside branches)
  return (length(q) - 1.0) * GEODE_R.x + lumps * 0.07;
}

// ---------------------------------------------------------------- strata
// Height in the stratigraphic column: bedding planes dip gently and are folded by a broad noise.
float strataCoord(vec3 p) {
  float fold = noiseTex(p * 0.075 + vec3(0.13, 0.57, 0.31)).r - 0.5;
  float ripple = noiseTex(p * vec3(0.31, 0.12, 0.31) + 0.7).b - 0.5;
  return p.y + dot(p.xz, vec2(0.085, -0.05)) + fold * 0.42 + ripple * 0.05;
}

// The column, bottom to top. LAYER_TOP: height of each bed's roof. LAYER_ROCK: rgb = albedo of
// the fresh rock (linear), a = hardness (1 = cliff-forming sandstone, 0 = crumbling shale).
const int LAYER_COUNT = 16;
const float LAYER_TOP[16] = float[16](
  -1.83, -1.61, -1.25, -1.15, -0.73, -0.58, -0.28, -0.16, 0.34, 0.42, 0.72, 0.79, 1.15, 1.37, 1.87, 99.0);
const vec4 LAYER_ROCK[16] = vec4[16](
  vec4(0.140, 0.145, 0.165, 0.35),   // basal mudstone: the torn root
  vec4(0.240, 0.160, 0.100, 0.55),   // umber siltstone
  vec4(0.540, 0.410, 0.250, 0.85),   // buff sandstone
  vec4(0.120, 0.120, 0.135, 0.15),   // shale parting
  vec4(0.600, 0.420, 0.200, 0.90),   // ochre sandstone …
  vec4(0.400, 0.200, 0.110, 0.80),   // … capped by ironstone, the rust band: one cliff
  vec4(0.290, 0.300, 0.330, 0.45),   // grey slate
  vec4(0.200, 0.135, 0.090, 0.15),   // umber shale
  vec4(0.640, 0.530, 0.360, 1.00),   // pale massive sandstone: hosts the geode
  vec4(0.230, 0.230, 0.245, 0.60),   // a slate parting that barely shows in relief
  vec4(0.560, 0.370, 0.170, 0.85),   // ochre sandstone
  vec4(0.370, 0.190, 0.105, 0.70),   // thin rust seam
  vec4(0.180, 0.185, 0.210, 0.18),   // thick grey shale: the deep recess under the cap
  vec4(0.360, 0.240, 0.135, 0.75),   // brown sandstone
  vec4(0.600, 0.470, 0.290, 0.95),   // buff caprock
  vec4(0.140, 0.105, 0.070, 0.30));  // weathered top and soil

// How far each bed's weathered face stands proud of (+) or is cut back behind (-) the mean
// cliff, in metres: mostly modest steps, one deep recess under the cap and a notch mid-way.
const float LAYER_RELIEF[16] = float[16](
  0.0, -0.02, 0.04, -0.05, 0.03, 0.06, -0.04, -0.10, 0.04, 0.0, 0.03, 0.06, -0.21, 0.0, 0.06, -0.03);

int stratumIndex(float s) {
  int index = LAYER_COUNT - 1;
  for (int i = LAYER_COUNT - 2; i >= 0; i--) if (s < LAYER_TOP[i]) index = i;
  return index;
}

// One bed of the column at height s. A bed's lower few centimetres blend from the bed
// beneath it: abruptly where a hard bed overhangs a soft one or steps back from another
// hard one, in a slope where soft rock has weathered back from a hard bench.
struct Stratum {
  int index;
  int below;       // the bed underneath (or itself at the bottom of the column)
  float up;        // height above the bed's floor
  float inside;    // 0 at the floor … 1 once clear of the blend with the bed underneath
  float hardness;  // blended across the floor
};
Stratum stratumAt(float s) {
  Stratum st;
  st.index = stratumIndex(s);
  st.below = max(st.index - 1, 0);
  float base = st.index > 0 ? LAYER_TOP[st.below] : -9.0;
  st.up = s - base;
  float slope = min(0.12, 0.5 * (LAYER_TOP[st.index] - base));
  float w = LAYER_RELIEF[st.index] > LAYER_RELIEF[st.below] ? 0.04 : mix(slope, 0.05, smoothstep(0.4, 0.75, LAYER_ROCK[st.index].a));
  st.inside = smoothstep(0.0, w, st.up);
  st.hardness = mix(LAYER_ROCK[st.below].a, LAYER_ROCK[st.index].a, st.inside);
  return st;
}

// Large flat breaks where slabs came away after the rock had weathered: they cut cleanly
// across the beds. xyz = outward unit normal, w = distance of the plane from the heart.
const vec4 BREAKS[7] = vec4[7](
  vec4(-0.550, 0.620, 0.560, 2.27), vec4(0.679, 0.449, -0.579, 2.04), vec4(0.849, -0.420, 0.320, 1.10),
  vec4(-0.319, -0.618, 0.718, 1.20), vec4(-0.577, -0.557, -0.597, 1.20), vec4(-0.503, 0.704, -0.503, 2.36),
  vec4(-0.925, 0.099, -0.358, 1.50));
// Distance outside the nearest break plane (negative inside all of them).
float breakDist(vec3 p) {
  float d = -1e9;
  for (int i = 0; i < 7; i++) d = max(d, dot(p, BREAKS[i].xyz) - BREAKS[i].w);
  return d;
}

// ---------------------------------------------------------------- the rubble island
// Height of the mound's bed at element-local xz (the same formula as moundHeight in JavaScript).
float moundHeight(vec2 xz) {
  float r = length(xz * vec2(1.0, 1.12)) + 0.22 * sin(xz.x * 1.3 + 0.4) * sin(xz.y * 1.7 + 1.1);
  return ${MOUND_HEIGHT.toFixed(3)} * exp(-r * r / ${(MOUND_RADIUS * MOUND_RADIUS).toFixed(4)}) - 0.07;
}

// ---------------------------------------------------------------- the heartbeat
// The geode's light pulses about once every 4.6 s in a double beat that travels outward
// from the heart at ~1.1 m/s. dist: metres from the heart. Returns 0 … 1.
float heartbeat(float dist) {
  float x = fract((uTime - dist / 1.1) / 4.6);
  float lub = exp(-sq((x - 0.10) / 0.055));
  float dub = exp(-sq((x - 0.26) / 0.075)) * 0.62;
  return lub + dub;
}
`;

// The distance fields themselves: only the bake needs these.
export const SDF_GLSL = /* glsl */ `
// Polynomial smooth min / max (Quilez): k is the width of the blend in metres.
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }

// Fracture facets: a sum of triangle waves along unrelated directions is piecewise linear,
// so adding it to a distance field breaks a smooth face into flat facets that meet at sharp
// creases, at several sizes. Roughly [-1.1, 1.1].
float facets(vec3 p) {
  return 0.50 * tri(dot(p, vec3(0.62, 0.48, -0.62)) * 0.71 + 0.3)
       + 0.30 * tri(dot(p, vec3(-0.41, 0.33, 0.85)) * 1.13 + 0.7)
       + 0.20 * tri(dot(p, vec3(0.80, -0.56, 0.21)) * 1.87 + 0.1)
       + 0.12 * tri(dot(p, vec3(-0.27, -0.71, -0.65)) * 3.1 + 0.5);
}

// A line cut at irregular intervals. x is measured in mean spacings; cuts sit near the
// integers. Returns the signed distance to the nearest cut and the ids of the intervals
// on either side of it.
float cutLine(float x, float salt, out float below, out float above) {
  float i = floor(x + 0.5);
  below = i - 1.0;
  above = i;
  return x - (i + (hash11(i * 1.31 + salt) - 0.5) * 0.6);
}

// Two near-vertical joint sets (parallel and square to the fissure) cut each hard bed into
// blocks of uneven width. The blocks have shifted on their joints, so each one's face stands
// a little proud of its neighbours' or behind them, and here and there one has fallen out
// of the face altogether. Returns how much of the block at p is missing (0 or 1) and writes
// how proud its face stands (0 … 1), both blended across the joints, the distance to the
// nearest joint in metres and how far that joint has weathered open.
const vec2 JOINT_SPACING = vec2(0.90, 1.05);
float blockFallen(vec2 cell, float bed) { return step(0.83, hash13(vec3(cell, bed * 1.37 + 0.5))); }
float blockProud(vec2 cell, float bed) { return hash13(vec3(cell.yx + 3.7, bed * 2.11 + 1.3)); }
float jointBlocks(vec3 p, float bed, out float jointDist, out float jointOpen, out float proud) {
  // The joints wander a few centimetres instead of running ruler-straight.
  vec2 wander = vec2(noiseTex(p * 0.13 + 0.61).b, noiseTex(p * 0.13 + 0.23).b) - 0.5;
  // Joints parallel to the fissure run through pairs of beds; the others stop at every bedding
  // plane. Some beds are broken into smaller blocks than others.
  vec2 salt = vec2(floor(bed * 0.5) * 3.1 + 0.7, bed * 5.3 + 2.9);
  vec2 spacing = JOINT_SPACING * (0.62 + 0.5 * vec2(hash11(salt.x + 0.2), hash11(salt.y + 0.4)));
  vec2 j = (vec2(dot(p, FIS_N), dot(p, FIS_D)) + wander * 0.16) / spacing;
  vec2 lo, hi;
  vec2 dj = vec2(cutLine(j.x, salt.x, lo.x, hi.x), cutLine(j.y, salt.y, lo.y, hi.y)) * spacing;
  vec2 w = smoothstep(vec2(-0.02), vec2(0.02), dj);
  float fallen = mix(mix(blockFallen(lo, bed), blockFallen(vec2(hi.x, lo.y), bed), w.x),
                     mix(blockFallen(vec2(lo.x, hi.y), bed), blockFallen(hi, bed), w.x), w.y);
  proud = mix(mix(blockProud(lo, bed), blockProud(vec2(hi.x, lo.y), bed), w.x),
              mix(blockProud(vec2(lo.x, hi.y), bed), blockProud(hi, bed), w.x), w.y);
  dj = abs(dj);
  jointDist = min(dj.x, dj.y);
  float open = dj.x < dj.y ? hash12(vec2(hi.x, salt.x)) : hash12(vec2(hi.y, salt.y + 9.0));
  jointOpen = open * open;
  return fallen;
}

// ---------------------------------------------------------------- the monolith
const float MONO_TOP = 2.2;       // the old ground surface
const float MONO_FLOOR = -1.75;   // where the body gives way to hanging splinters

// Horizontal radius of the body against height: a broad shoulder high up, tapering to a root.
float bodyProfile(float y) {
  float t = clamp((y - MONO_FLOOR) / (MONO_TOP - MONO_FLOOR), 0.0, 1.05);
  float r = 1.50 * sin(1.95 * pow(t, 0.75)) * (1.0 - 0.08 * smoothstep(0.85, 1.0, t));
  return r * (1.0 + 0.04 * sin(t * 8.0 + 0.9));
}

// Plan outline: seven fracture faces. xy = outward direction in xz, z = relative distance
// from the axis. Each face also leans in or out a little with height.
const vec3 BODY_SIDES[7] = vec3[7](
  vec3(-0.5299, 0.8480, 1.00), vec3(0.4695, 0.8829, 0.93), vec3(0.9962, 0.0872, 1.02),
  vec3(0.6428, -0.7660, 0.90), vec3(-0.1392, -0.9903, 1.00), vec3(-0.8829, -0.4695, 0.94),
  vec3(-0.9781, 0.2079, 1.03));
const float BODY_LEAN[7] = float[7](0.020, -0.040, 0.035, 0.050, -0.030, 0.040, -0.035);

// Broken roots hanging from the underside where the mass tore free. xyz = tip, w = flare.
const vec4 SHARDS[6] = vec4[6](
  vec4(0.06, -2.30, -0.05, 0.52), vec4(-0.40, -2.00, 0.28, 0.46), vec4(0.42, -2.12, 0.30, 0.40),
  vec4(0.20, -1.86, -0.50, 0.50), vec4(-0.42, -1.76, -0.36, 0.52), vec4(0.66, -1.62, -0.10, 0.40));

float shardField(vec3 p) {
  float d = 1e9;
  for (int i = 0; i < 6; i++) {
    vec3 q = p - SHARDS[i].xyz;
    float a = float(i) * 2.4 + 0.5;
    q.xz = rot2(a) * q.xz;
    q.xz += q.y * vec2(sin(a * 3.1), cos(a * 1.7)) * 0.14;                 // each leans its own way
    // Odd roots are three-sided, even ones four-sided, all lopsided.
    float g3 = max(max(q.x * 0.866 + q.z * 0.5, -q.x * 0.866 + q.z * 0.5), -q.z * 1.3);
    float g4 = max(abs(q.x + q.z * 0.3) * (0.8 + 0.5 * fract(a * 0.37)), abs(q.z));
    float g = (i & 1) == 1 ? g3 : g4;
    d = min(d, max((g - q.y * SHARDS[i].w) * 0.9, q.y - 0.95));
  }
  return d;
}

// The unbroken rock, before the split.
float monolithSolid(vec3 p) {
  // A broad warp and a slight lean so no fracture face is a perfect plane.
  vec3 w = vec3(noiseTex(p * 0.07 + 0.31).r, noiseTex(p * 0.07 + vec3(0.71, 0.13, 0.47)).r,
                noiseTex(p * 0.07 + vec3(0.29, 0.83, 0.61)).r) - 0.5;
  vec3 q = p + w * vec3(0.42, 0.20, 0.42);
  q.xz -= vec2(0.07, -0.05) * q.y + vec2(0.06, 0.05) * sin(q.y * 1.4 + vec2(0.4, 2.1));
  q.xz += vec2(0.26, -0.16) * smoothstep(0.3, -2.0, q.y);                  // the root hangs off-centre

  float gauge = -1e9;
  for (int i = 0; i < 7; i++) {
    gauge = smax(gauge, dot(q.xz, BODY_SIDES[i].xy) / (BODY_SIDES[i].z + BODY_LEAN[i] * q.y), 0.035);
  }
  float dSide = (gauge - bodyProfile(q.y)) * 0.9;
  float topRelief = (noiseTex(vec3(q.xz * 0.11, 0.37)).r - 0.5) * 0.55 + q.x * 0.06 - q.z * 0.03;
  float dTop = q.y - MONO_TOP - topRelief;
  float floorRelief = (noiseTex(vec3(q.xz * 0.21, 0.81)).r - 0.5) * 0.7 + q.z * 0.10;
  float dFloor = MONO_FLOOR + floorRelief - q.y;
  float d = smax(smax(dSide, dTop, 0.20), dFloor, 0.05);
  d = smin(d, shardField(q), 0.12);

  // Differential weathering: hard beds stand proud as ledges over the soft beds they cap.
  // Some faces have weathered far more than others, ledges swell and pinch along their
  // length, and the freshly torn root has not weathered at all.
  float s = strataCoord(p);
  Stratum st = stratumAt(s);
  float weathered = smoothstep(-1.75, -0.9, p.y) * mix(0.35, 1.0, smoothstep(0.34, 0.54, noiseTex(p * 0.05 + 0.9).r));
  // A ledge is not a shelf running right round the rock: each bed stands well proud along
  // one stretch of cliff and has broken back flush along the next, in its own places.
  vec3 along = p * vec3(0.13, 0.0, 0.13) + 0.45;
  float swellHere = mix(0.2, 1.7, smoothstep(0.36, 0.60, noiseTex(along + vec3(0.0, float(st.index) * 0.173, 0.0)).r));
  float swellBelow = mix(0.2, 1.7, smoothstep(0.36, 0.60, noiseTex(along + vec3(0.0, float(st.below) * 0.173, 0.0)).r));
  float relief = mix(LAYER_RELIEF[st.below] * swellBelow, LAYER_RELIEF[st.index] * swellHere, st.inside);
  float crumbling = (1.0 - st.hardness) * (noiseTex(p * vec3(0.27, 0.55, 0.27) + 0.2).b - 0.3) * 0.12;
  d -= weathered * (relief - crumbling);

  // Joints: blocks shifted in the hard beds or missing from them, and the cracks between those still in place.
  float jointDist, jointOpen, proud, unusedA, unusedB, proudBelow;
  float hardHere = smoothstep(0.4, 0.75, LAYER_ROCK[st.index].a), hardBelow = smoothstep(0.4, 0.75, LAYER_ROCK[st.below].a);
  // (No block is missing beside the fissure or over the geode: both keep their own outline.)
  float geode = geodeDist(p);
  float intact = smoothstep(0.10, 0.30, abs(fissurePlane(p))) * smoothstep(0.08, 0.35, geode);
  float fallen = jointBlocks(p, float(st.index), jointDist, jointOpen, proud) * hardHere * intact;
  float fallenBelow = jointBlocks(p, float(st.below), unusedA, unusedB, proudBelow) * hardBelow * intact;
  float acrossFloor = smoothstep(0.0, 0.05, st.up);
  d += weathered * mix(fallenBelow * (0.14 + 0.2 * proudBelow), fallen * (0.14 + 0.2 * proud), acrossFloor);
  d -= weathered * 0.15 * mix((proudBelow - 0.5) * hardBelow, (proud - 0.5) * hardHere, acrossFloor);
  d += weathered * smoothstep(0.4, 0.75, st.hardness) * jointOpen * 0.03 * (1.0 - smoothstep(0.0, 0.04, jointDist));

  // Clean breaks cut after the weathering; then lumps, conchoidal scars and spalled patches over everything.
  d = smax(d, breakDist(p), 0.03);
  // The whole mass broke along flat fracture faces that cut straight across the beds: gently
  // on the weathered cliffs, boldly on the root that tore out of the ground.
  d += facets(p) * mix(0.075, 0.17, 1.0 - smoothstep(-1.55, -0.35, p.y));
  d += (noiseTex(p * 0.21 + 0.4).r - 0.5) * 0.05;
  d += (noiseTex(p * 0.43 + 0.9).g - 0.4) * 0.035;
  d += smoothstep(0.62, 0.85, noiseTex(p * 0.19 + 0.33).g) * smoothstep(0.45, 0.6, noiseTex(p * 0.045 + 0.6).r) * 0.07;

  return max(d, -geode);
}

// One half of the split rock. Its fissure wall has crumbled back a little from the clean
// fracture, each half in its own way, so the two walls no longer fit.
float monolithHalf(vec3 p, float side) {
  vec3 q = unsplit(p, side);
  float open = smoothstep(0.0, 0.03, fissureOpening(p));
  float crumble = (0.01 + 0.07 * noiseTex(q * 0.33 + side * 0.21 + 0.5).r) * open;
  float f = fissurePlane(q) * side;
  // Where the crack is still closed it shows as a hairline groove on the surface.
  return max(monolithSolid(q) + (1.0 - open) * 0.02 * (1.0 - smoothstep(0.0, 0.035, abs(f))), crumble - f);
}

float monolithSDF(vec3 p) { return min(monolithHalf(p, 1.0), monolithHalf(p, -1.0)); }

// ---------------------------------------------------------------- loose rocks
// A broken block about one unit in radius: a random convex polytope (the fracture faces),
// squashed by a per-seed aspect, then weathered. Fragments of the belt and the stones of
// the rubble island are all instances of a handful of these.
float looseRockSDF(vec3 p, float seed) {
  vec3 aspect = vec3(1.0, 0.42 + 0.58 * hash11(seed * 7.13 + 0.7), 0.7 + 0.45 * hash11(seed * 3.31 + 1.9));
  vec3 q = p / aspect;
  float d = -1e9;
  for (int i = 0; i < 12; i++) {
    // Fibonacci-sphere directions, jittered, so the faces are spread around the block.
    float fi = float(i) + 0.5;
    float cosT = 1.0 - 2.0 * fi / 12.0;
    float sinT = sqrt(max(1.0 - cosT * cosT, 0.0));
    float phi = fi * 2.399963 + seed * 1.7;
    vec3 n = normalize(vec3(cos(phi) * sinT, cosT, sin(phi) * sinT) + (hash31(seed * 17.0 + fi * 3.1) - 0.5) * 0.9);
    d = smax(d, dot(q, n) - (0.62 + 0.38 * hash11(seed * 5.3 + fi * 7.7)), 0.02);
  }
  d += facets(q * 1.9 + seed * 3.0) * 0.06;
  d += (noiseTex(q * 0.12 + seed * 0.37).r - 0.5) * 0.10;
  d += (noiseTex(q * 0.31 + seed * 0.71).b - 0.5) * 0.05;
  vec3 bedding = normalize(hash31(seed * 2.7 + 4.1) - 0.5);
  d += 0.03 * smoothstep(0.75, 1.0, tri(dot(q, bedding) * 2.6 + seed));
  return d * min(aspect.y, aspect.z);
}
`;
