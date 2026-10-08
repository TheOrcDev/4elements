import * as THREE from 'three';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { NOISE_GLSL } from '../shared/glsl.js';
import { createGlowTexture } from '../shared/sprites.js';
import { createRandom, range } from '../shared/random.js';

/**
 * Fire: a hearth of charred logs in a loose teepee on an ash bed, ringed by
 * stones. The flame is a raymarched emission volume inside a box proxy; the
 * logs, coals and ground are MeshStandardMaterials with procedural charcoal,
 * glowing cracks and ash injected through onBeforeCompile. The upper fire
 * light casts the log and stone shadows across the ash.
 */

// --- layout ------------------------------------------------------------------

const FLAME_HEIGHT = 2.3;
const FLAME_HALF_WIDTH = 0.8;
const FLAME_BASE_Y = 0.03;
const FLAME_BASE_RADIUS = 0.5;
const FLAME_MAX_STEPS = 96;
const FLAME_MIN_STEP = 0.02;
const BREEZE = 0.16; // sideways lean of the flame tip and embers (+x)

const CAMERA_TARGET = new THREE.Vector3(0, 0.78, 0);
const CAMERA_OFFSET = new THREE.Vector3(3.12, 1.46, 3.95); // three-quarter view, ~17 degrees down

const NOISE_SIZE = 64; // voxels per side of the tiling noise volume
const NOISE_CELLS = 8; // gradient-noise cells per tile

const EMBER_COUNT = 460;
const COAL_COUNT = 60;
const COAL_BED_RADIUS = 0.4;
const STONE_COUNT = 11;
const STONE_RING_RADIUS = 1.55;
const STONE_CREASE_ANGLE = 0.6; // radians: sharper bends than this stay hard edges
const GROUND_RADIUS = 9;

// The low light sits in the coal bed; the high one above the teepee apex casts the shadows.
const LOW_LIGHT_Y = 0.45;
const LOW_LIGHT_INTENSITY = 2.2;
const HIGH_LIGHT_Y = 1.6;
const HIGH_LIGHT_INTENSITY = 6.5;

/** Teepee logs: foot position on the ground, lean toward the centre, overshoot past it. */
const LOGS = [
  { azimuth: 0.35, elevation: 0.52, foot: 1.0, overshoot: 0.22, radius: 0.105, lateral: 0.05 },
  { azimuth: 1.95, elevation: 0.6, foot: 0.92, overshoot: 0.16, radius: 0.095, lateral: -0.07 },
  { azimuth: 3.55, elevation: 0.47, foot: 1.05, overshoot: 0.26, radius: 0.115, lateral: 0.04 },
  { azimuth: 5.0, elevation: 0.56, foot: 0.95, overshoot: 0.18, radius: 0.09, lateral: -0.03 },
];

const COLORS = {
  background: new THREE.Color('#070403'),
  flameEmber: new THREE.Color('#3a0500'),
  flameRed: new THREE.Color('#c01a00'),
  flameOrange: new THREE.Color('#ff6510'),
  flameYellow: new THREE.Color('#ffb03c'),
  flameWhite: new THREE.Color('#fff0c8'),
  flameSmoke: new THREE.Color('#4a403a'),
  emberHot: new THREE.Color('#ffd27a'),
  emberWarm: new THREE.Color('#ff7a1f'),
  emberCool: new THREE.Color('#a3200a'),
  glowOrange: new THREE.Color('#ff5a12'),
  glowYellow: new THREE.Color('#ffa040'),
  glowDeep: new THREE.Color('#8a1802'),
  lightLow: new THREE.Color('#ff7a2c'),
  lightHigh: new THREE.Color('#ff9a4a'),
  skyFill: new THREE.Color('#1c2433'),
  groundFill: new THREE.Color('#0d0806'),
  halo: new THREE.Color('#ff5a14'),
};

// --- shared GLSL --------------------------------------------------------------

/** Height-derivative bump (Mikkelsen) for procedural surfaces without a bump map. */
const BUMP_GLSL = /* glsl */ `
vec3 proceduralBump(vec3 n, float height, float scale, float faceSign) {
  vec3 sigmaX = dFdx(-vViewPosition);
  vec3 sigmaY = dFdy(-vViewPosition);
  vec3 r1 = cross(sigmaY, n);
  vec3 r2 = cross(n, sigmaX);
  float det = dot(sigmaX, r1) * faceSign;
  vec2 dh = vec2(dFdx(height), dFdy(height)) * scale;
  vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2);
  vec3 bumped = abs(det) * n - grad;
  float len2 = dot(bumped, bumped);
  return len2 > 1e-24 ? bumped * inversesqrt(len2) : n;
}
`;

// --- flame volume -------------------------------------------------------------

const FLAME_VERTEX = /* glsl */ `
out vec3 vOrigin;
out vec3 vDirection;

void main() {
  vOrigin = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
  vDirection = position - vOrigin;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FLAME_FRAGMENT = /* glsl */ `
precision highp float;
precision highp sampler3D;

uniform sampler3D uNoise;
uniform float uTime;
uniform float uFlicker;
uniform float uDitherOffset;
uniform vec3 uColorEmber;
uniform vec3 uColorRed;
uniform vec3 uColorOrange;
uniform vec3 uColorYellow;
uniform vec3 uColorWhite;
uniform vec3 uColorSmoke;
uniform vec4 uLogStart[OCCLUDER_COUNT]; // xyz: axis start (flame space), w: radius
uniform vec3 uLogEnd[OCCLUDER_COUNT];

in vec3 vOrigin;
in vec3 vDirection;
layout(location = 0) out vec4 fragColor;

const float HEIGHT = ${FLAME_HEIGHT.toFixed(4)};
const float HALF_WIDTH = ${FLAME_HALF_WIDTH.toFixed(4)};
const float BASE_RADIUS = ${FLAME_BASE_RADIUS.toFixed(4)};
const float BREEZE = ${BREEZE.toFixed(4)};
const int MAX_STEPS = ${FLAME_MAX_STEPS};
const float MIN_STEP = ${FLAME_MIN_STEP.toFixed(4)};
const float ABSORPTION = 5.0;

// Noise volume tiles once per texture unit; these map object units to tiles.
const vec3 NOISE_SCALE = vec3(0.5, 0.2, 0.5);
const vec3 WARP_SCALE = vec3(0.2, 0.13, 0.2);
const float OCTAVE_GAIN = 2.13;
const float RISE_SPEED = 1.25;      // object units per second, first octave
const float RISE_SPEEDUP = 1.3;     // finer octaves rise faster: churning, not scrolling
const mat3 OCTAVE_ROTATION = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);

vec3 gOctaveShift[4];
vec3 gWarpShift;

float noise3(vec3 p) {
  return texture(uNoise, p).r;
}

float turbulence(vec3 q) {
  vec3 s = q * NOISE_SCALE;
  float sum = 0.5 * noise3(s + gOctaveShift[0]);
  s = OCTAVE_ROTATION * s * OCTAVE_GAIN;
  sum += 0.25 * noise3(s + gOctaveShift[1]);
  s = OCTAVE_ROTATION * s * OCTAVE_GAIN;
  sum += 0.125 * noise3(s + gOctaveShift[2]);
  s = OCTAVE_ROTATION * s * OCTAVE_GAIN;
  sum += 0.0625 * noise3(s + gOctaveShift[3]);
  return sum;
}

// Per-octave texture offsets that make every octave rise straight up in object
// space at its own speed. Wrapped with fract (the volume tiles) to keep precision.
void prepareNoiseShifts() {
  mat3 rotation = mat3(1.0);
  float frequency = 1.0;
  float speed = RISE_SPEED;
  for (int i = 0; i < 4; i++) {
    vec3 rise = vec3(0.0, uTime * speed * NOISE_SCALE.y * frequency, 0.0);
    gOctaveShift[i] = fract(-(rotation * rise) + float(i) * 0.371);
    rotation = OCTAVE_ROTATION * rotation;
    frequency *= OCTAVE_GAIN;
    speed *= RISE_SPEEDUP;
  }
  gWarpShift = fract(vec3(0.0, -uTime * 0.45 * WARP_SCALE.y, 0.0));
}

// Signed flame field: > 0 inside. Writes the normalised height and temperature.
float flameField(vec3 p, out float h, out float temperature) {
  h = clamp(p.y / HEIGHT, 0.0, 1.0);

  // Travelling waves up the column plus a steady lean with the breeze.
  vec2 sway = vec2(
    0.6 * sin(h * 2.6 - uTime * 1.7) + 0.4 * sin(h * 5.3 - uTime * 3.1 + 1.3),
    0.6 * sin(h * 2.2 - uTime * 1.4 + 2.1) + 0.4 * sin(h * 4.6 - uTime * 2.7 + 0.4)
  ) * (0.02 + 0.09 * h * h);
  sway.x += BREEZE * h * h;

  vec3 q = p;
  q.xz -= sway;

  // Lazy large-scale domain warp, stronger toward the top.
  vec3 w = q * WARP_SCALE + gWarpShift;
  vec2 warp = vec2(noise3(w), noise3(w + vec3(0.43, 0.17, 0.71)));
  q.xz += warp * (0.04 + 0.18 * h);
  q.y += warp.x * 0.15;

  float n = turbulence(q);
  float r = length(q.xz);
  float radius = BASE_RADIUS * pow(max(1.0 - h, 1e-4), 0.65);
  float field = radius - r + n * (0.3 + 0.35 * h);

  // Hotter the deeper inside the flame, cooling with height.
  // Peak temperature by height: the fuel-rich base is a little cooler than the
  // body just above it, then the column cools toward the tips. Thin upper
  // tongues reach their peak at a shallower depth than the thick base.
  float peak = mix(0.6, 0.88, smoothstep(0.04, 0.32, h)) * (1.0 - 0.6 * smoothstep(0.3, 1.0, h));
  float depthToPeak = 0.12 + 0.25 * (1.0 - h);
  temperature = peak * smoothstep(0.0, depthToPeak, field) + n * 0.15;
  return field;
}

vec3 blackbody(float k) {
  vec3 c = mix(uColorEmber, uColorRed, smoothstep(0.0, 0.2, k));
  c = mix(c, uColorOrange, smoothstep(0.18, 0.45, k));
  c = mix(c, uColorYellow, smoothstep(0.42, 0.72, k));
  return mix(c, uColorWhite, smoothstep(0.82, 1.05, k));
}

vec2 hitBox(vec3 ro, vec3 rd) {
  vec3 boxMin = vec3(-HALF_WIDTH, 0.0, -HALF_WIDTH);
  vec3 boxMax = vec3(HALF_WIDTH, HEIGHT, HALF_WIDTH);
  vec3 safeDir = vec3(
    rd.x >= 0.0 ? max(rd.x, 1e-5) : min(rd.x, -1e-5),
    rd.y >= 0.0 ? max(rd.y, 1e-5) : min(rd.y, -1e-5),
    rd.z >= 0.0 ? max(rd.z, 1e-5) : min(rd.z, -1e-5));
  vec3 inv = 1.0 / safeDir;
  vec3 t0 = (boxMin - ro) * inv;
  vec3 t1 = (boxMax - ro) * inv;
  vec3 tMin = min(t0, t1);
  vec3 tMax = max(t0, t1);
  return vec2(max(max(tMin.x, tMin.y), tMin.z), min(min(tMax.x, tMax.y), tMax.z));
}

// Ray/capsule hit distance (Inigo Quilez), -1 on miss. Logs stop the march.
float capsuleHit(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float radius) {
  vec3 ba = pb - pa;
  vec3 oa = ro - pa;
  float baba = dot(ba, ba);
  float bard = dot(ba, rd);
  float baoa = dot(ba, oa);
  float rdoa = dot(rd, oa);
  float oaoa = dot(oa, oa);
  float a = max(baba - bard * bard, 1e-6);
  float b = baba * rdoa - baoa * bard;
  float c = baba * oaoa - baoa * baoa - radius * radius * baba;
  float disc = b * b - a * c;
  if (disc < 0.0) return -1.0;
  float t = (-b - sqrt(disc)) / a;
  float y = baoa + t * bard;
  if (y > 0.0 && y < baba) return t;
  vec3 oc = (y <= 0.0) ? oa : ro - pb;
  b = dot(rd, oc);
  c = dot(oc, oc) - radius * radius;
  disc = b * b - c;
  return disc > 0.0 ? -b - sqrt(disc) : -1.0;
}

void main() {
  vec3 ro = vOrigin;
  vec3 rd = normalize(vDirection);
  vec2 span = hitBox(ro, rd);
  float tNear = max(span.x, 0.0);
  float tFar = span.y;
  for (int i = 0; i < OCCLUDER_COUNT; i++) {
    float hit = capsuleHit(ro, rd, uLogStart[i].xyz, uLogEnd[i], uLogStart[i].w);
    if (hit > 0.0) tFar = min(tFar, hit);
  }
  if (tFar <= tNear) discard;

  prepareNoiseShifts();

  // Fine steps inside the flame; empty samples stride further (see below), so
  // the step budget still spans the whole box.
  float stepLength = max(MIN_STEP, (tFar - tNear) / float(MAX_STEPS + MAX_STEPS / 3));
  // Interleaved gradient noise offsets the first sample to hide step banding;
  // the per-frame golden-ratio shift turns its fixed hatch into temporal grain.
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  float dither = fract(ign + uDitherOffset);
  float t = tNear + stepLength * dither;

  vec3 color = vec3(0.0);
  float transmittance = 1.0;

  for (int i = 0; i < MAX_STEPS; i++) {
    if (t > tFar || transmittance < 0.03) break;
    vec3 p = ro + rd * t;

    // Cheap reject outside the flame's widest possible reach.
    float hb = clamp(p.y / HEIGHT, 0.0, 1.0);
    vec2 axis = vec2(BREEZE * hb * hb, 0.0);
    if (length(p.xz - axis) > BASE_RADIUS * (1.0 - 0.5 * hb) + 0.19 + 0.5 * hb) {
      t += stepLength * 3.0;
      continue;
    }

    float h;
    float temperature;
    float field = flameField(p, h, temperature);
    float density = smoothstep(0.0, 0.06 + 0.06 * h, field)
      * smoothstep(0.02, 0.1, h)
      * (1.0 - smoothstep(0.72, 1.0, h));
    if (density < 0.002) {
      t += stepLength * 1.5;
      continue;
    }
    t += stepLength;

    float k = clamp(temperature, 0.0, 1.0);
    vec3 emission = blackbody(k) * (0.3 + 12.0 * k * k * k);
    // Cooling tips at the top of the column turn to dim smoke.
    float smoke = smoothstep(0.62, 0.95, h) * (1.0 - smoothstep(0.0, 0.3, k));
    emission = mix(emission, uColorSmoke * 0.08, smoke);

    float stepDensity = density * stepLength;
    color += transmittance * emission * stepDensity;
    transmittance *= exp(-stepDensity * ABSORPTION);
  }

  // Hue-preserving soft shoulder (ceiling ~1.8): the core stays a pale yellow
  // with visible structure instead of clipping to a white blob after tone mapping.
  color = max(color, vec3(0.0)) * uFlicker;
  float peakChannel = max(max(color.r, color.g), color.b);
  color *= 1.1 / (1.0 + 0.6 * peakChannel);
  fragColor = vec4(min(color, vec3(8.0)), 0.0);
}
`;

// --- embers -------------------------------------------------------------------

const EMBER_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uHot;
uniform vec3 uWarm;
uniform vec3 uCool;
attribute vec4 aSeed;
varying vec3 vColor;

const float BREEZE = ${BREEZE.toFixed(4)};

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  float lifetime = mix(1.4, 3.8, aSeed.x);
  float cycle = uTime / lifetime + aSeed.y;
  float age = fract(cycle);
  float generation = floor(cycle);

  // Every generation spawns from a fresh point in the fire bed.
  float r1 = hash(generation * 17.13 + aSeed.z * 101.7);
  float r2 = hash(generation * 31.71 + aSeed.w * 57.3);
  float r3 = hash(generation * 7.37 + aSeed.x * 213.1);
  float angle = r1 * 6.28318;
  float spawnRadius = sqrt(r2) * 0.42;
  vec3 pos = vec3(cos(angle) * spawnRadius, 0.2 + r3 * 0.45, sin(angle) * spawnRadius);

  // Buoyant rise that slows as the ember cools, with swirl, spread and breeze.
  float rise = mix(1.5, 3.4, r3);
  pos.y += rise * (1.0 - pow(max(1.0 - age, 1e-4), 1.7));
  float swirl = aSeed.z * 6.28318 + uTime * (0.6 + aSeed.w);
  pos.x += sin(swirl + age * 7.0) * 0.2 * age + cos(angle) * age * 0.4 + BREEZE * 2.5 * age * age;
  pos.z += cos(swirl * 1.3 + age * 5.0) * 0.2 * age + sin(angle) * age * 0.4;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float size = mix(1.6, 5.5, aSeed.w * aSeed.w);
  gl_PointSize = clamp(size * uPixelRatio * 4.5 / max(-mvPosition.z, 0.1), 1.0, 40.0);

  float fadeIn = smoothstep(0.0, 0.06, age);
  float fadeOut = 1.0 - smoothstep(0.5, 1.0, age);
  float flicker = 0.55 + 0.45 * sin(uTime * (9.0 + 14.0 * aSeed.y) + aSeed.x * 40.0);
  vec3 tint = mix(uHot, uWarm, smoothstep(0.0, 0.35, age));
  tint = mix(tint, uCool, smoothstep(0.35, 0.95, age));
  vColor = tint * fadeIn * fadeOut * flicker * mix(1.6, 4.5, r1);
}
`;

const EMBER_FRAGMENT = /* glsl */ `
varying vec3 vColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c) * 4.0;
  float glow = exp(-d2 * 5.0) * max(1.0 - d2, 0.0);
  gl_FragColor = vec4(vColor * glow, 1.0);
}
`;

// --- charcoal (logs and coals) ------------------------------------------------

const CHARCOAL_PARS = /* glsl */ `
uniform float uTime;
uniform float uFireGlow;
uniform vec3 uEmberColor;
uniform vec3 uEmberHot;
uniform float uSeed;
uniform float uCrackScale;
uniform vec3 uCrackStretch;
uniform float uCapRings;
uniform float uBumpScale;
uniform float uCrackGlow;
varying vec3 vCharLocal;
varying vec3 vCharWorld;
varying vec3 vCharNormal;

vec3 cellHash(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}

// x: distance to the nearest cell border (F2 - F1), y: random value of the nearest cell.
vec2 crackCells(vec3 x) {
  vec3 cell = floor(x);
  vec3 f = fract(x);
  float d1 = 8.0;
  float d2 = 8.0;
  float id = 0.0;
  for (int k = -1; k <= 1; k++)
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec3 b = vec3(float(i), float(j), float(k));
    vec3 o = cellHash(cell + b);
    vec3 r = b + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = o.x; }
    else if (d < d2) { d2 = d; }
  }
  return vec2(sqrt(d2) - sqrt(d1), id);
}

// Distance from a world point to the hot core of the fire.
float fireDistance(vec3 w) {
  float r = length(w.xz);
  float dy = max(w.y - 0.8, 0.0);
  return sqrt(r * r + dy * dy);
}
` + BUMP_GLSL;

const CHARCOAL_SURFACE = /* glsl */ `
vec3 charCoord = (vCharLocal * uCrackStretch + uSeed) * uCrackScale;
vec2 charCell = crackCells(charCoord);
float charNoise = snoise(vCharLocal * 2.3 + uSeed);
float fireDist = fireDistance(vCharWorld);
float charring = 1.0 - smoothstep(0.55, 1.1, fireDist + charNoise * 0.18);
float charHeat = 1.0 - smoothstep(0.12, 0.6, fireDist + charNoise * 0.08);
float capFace = smoothstep(0.75, 0.95, abs(normalize(vCharNormal).y));

// Alligator checking: stretched cell borders run as fissures along the grain,
// and transverse cracks (offset per cell) break them into blocks. Widths range
// from hairlines to deep fissures; edges are filtered to the pixel footprint.
float crackWidth = mix(0.04, 0.1, charHeat) * mix(0.3, 1.4, snoise(charCoord * 0.4) * 0.5 + 0.5);
float fissureAA = fwidth(charCell.x) * 1.5;
float fissure = 1.0 - smoothstep(crackWidth - fissureAA, crackWidth + fissureAA, charCell.x);
// Transverse bands wander and about a third are skipped, so block lengths vary.
float bandCoord = vCharLocal.y * uCrackScale * 1.1 + snoise(charCoord * 0.6 + 3.1) * 0.35;
float bandPhase = bandCoord + charCell.y * 7.0;
float bandKeep = step(0.35, fract(sin(floor(bandPhase + 0.5) * 91.7 + charCell.y * 47.3) * 43758.5453));
float bandDist = (0.5 - abs(fract(bandPhase) - 0.5)) * 2.0 + capFace + (1.0 - bandKeep);
float bandAA = fwidth(bandCoord) * 3.0;
float transverse = 1.0 - smoothstep(crackWidth - bandAA, crackWidth + bandAA, bandDist);
float crackDist = min(charCell.x, bandDist);
float crack = max(fissure, transverse) * charring;
float grain = snoise(vec3(vCharLocal.x * 22.0, vCharLocal.y * 2.5, vCharLocal.z * 22.0) + uSeed * 3.0);

vec3 bark = mix(vec3(0.045, 0.028, 0.018), vec3(0.11, 0.07, 0.04), grain * 0.5 + 0.5);
vec3 coal = mix(vec3(0.016, 0.015, 0.014), vec3(0.05, 0.047, 0.044), charCell.y);
float ash = smoothstep(0.2, 0.75, snoise(charCoord * 0.35 + 7.0)) * (1.0 - charHeat * 0.5);
coal = mix(coal, vec3(0.26, 0.25, 0.24), ash * 0.6);
vec3 charAlbedo = mix(bark, coal, charring);

// Cut ends show growth rings until the fire reaches them.
float capMask = uCapRings * capFace;
float rings = 0.5 + 0.5 * sin(length(vCharLocal.xz) * 150.0 + grain * 2.0);
vec3 endGrain = mix(vec3(0.16, 0.1, 0.06), vec3(0.09, 0.055, 0.03), rings);
charAlbedo = mix(charAlbedo, mix(endGrain, coal, charring), capMask);
charAlbedo *= 1.0 - crack * 0.9;
diffuseColor.rgb = charAlbedo;
float charHeight = (1.0 - crack) * 0.7 + grain * 0.3 * (1.0 - charring);
`;

const CHARCOAL_EMISSIVE = /* glsl */ `
float breathe = 0.65 + 0.35 * snoise(vCharWorld * 3.0 + vec3(0.0, -uTime * 0.6, uTime * 0.25));
float glow = charHeat * uFireGlow * breathe;
vec3 emberTint = mix(uEmberColor, uEmberHot, charHeat * charHeat * charHeat);
float coreGlow = charHeat * charHeat * charHeat * charHeat * (1.0 - ash);
// Cracks glow only where the fire reaches; the cool ends stay dark bark.
float crackGlow = crack * smoothstep(0.15, 0.3, charHeat);
float bleed = exp(-crackDist * 14.0) * 0.35 * charHeat * charring;
// Hot surfaces glow brightest low down, in the gaps of the coal bed; tops crust over.
float crevice = (1.0 - smoothstep(0.0, 0.05, vCharWorld.y)) * charHeat * 0.6;
totalEmissiveRadiance += emberTint * glow * (crackGlow * uCrackGlow + bleed + crevice + coreGlow * 0.25);
`;

// Wood inside the flame reads dark against it: direct firelight fades out close
// to the core, leaving only the glowing cracks.
const CHARCOAL_LIGHTING = /* glsl */ `
float fireShade = smoothstep(0.2, 0.75, fireDist);
reflectedLight.directDiffuse *= mix(0.3, 1.0, fireShade);
reflectedLight.directSpecular *= mix(0.1, 1.0, fireShade);
`;

// --- stones -------------------------------------------------------------------

const STONE_SURFACE = /* glsl */ `
float stoneBlotch = fbm(vStonePos * 3.2);
float stoneGrain = snoise(vStonePos * 40.0);
diffuseColor.rgb *= 0.8 + 0.35 * stoneBlotch + 0.1 * stoneGrain;
float stoneHeight = stoneBlotch * 0.7 + stoneGrain * 0.06;
`;

// --- ground -------------------------------------------------------------------

const GROUND_PARS = /* glsl */ `
uniform float uTime;
uniform float uFireGlow;
uniform vec3 uEmberColor;
uniform vec3 uEmberDeep;
uniform vec4 uLogFoot[LOG_COUNT]; // xyz: log axis at the ground end, w: radius
uniform vec3 uLogTip[LOG_COUNT];
varying vec3 vGroundPos;

// Gap between a ground point and the nearest log surface, for contact shading.
float logGap(vec3 p) {
  float gap = 1e3;
  for (int i = 0; i < LOG_COUNT; i++) {
    vec3 a = uLogFoot[i].xyz;
    vec3 ba = uLogTip[i] - a;
    float t = clamp(dot(p - a, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    gap = min(gap, length(p - a - ba * t) - uLogFoot[i].w);
  }
  return gap;
}
` + BUMP_GLSL;

const GROUND_SURFACE = /* glsl */ `
vec2 gp = vGroundPos.xz;
float gr = length(gp);
float broad = fbm(vec3(gp * 0.8, 1.7));
float fine = snoise(vec3(gp * 11.0, 4.2));
float grit = snoise(vec3(gp * 16.0, 8.9));

float ashEdge = 1.35 + broad * 0.4;
float ashCover = 1.0 - smoothstep(ashEdge - 0.6, ashEdge, gr);
float scorch = (1.0 - smoothstep(ashEdge, ashEdge + 0.9, gr)) * (1.0 - ashCover);
vec3 soil = mix(vec3(0.03, 0.023, 0.017), vec3(0.045, 0.035, 0.026), smoothstep(-0.6, 0.6, fine + broad));
soil *= 1.0 - scorch * 0.6;
vec3 ashTone = mix(vec3(0.1, 0.096, 0.092), vec3(0.16, 0.156, 0.149), smoothstep(-0.5, 0.7, fine * 0.7 + broad * 0.6));
// Black char bed under the fire, greying out to ash toward the stones.
ashTone *= mix(0.12, 1.0, smoothstep(0.2, 0.9, gr + broad * 0.2));
vec3 groundAlbedo = mix(soil, ashTone, ashCover);
float crumbs = smoothstep(0.6, 0.78, grit) * smoothstep(-0.2, 0.4, fine);
groundAlbedo = mix(groundAlbedo, vec3(0.012, 0.011, 0.01), crumbs * 0.6);
diffuseColor.rgb = groundAlbedo;
float groundHeight = fine * 0.5 + grit * 0.25;
`;

const GROUND_EMISSIVE = /* glsl */ `
// Glowing coals in the bed under the fire, slowly shifting and breathing.
float bed = 1.0 - smoothstep(0.05, 0.5, gr + broad * 0.2);
if (bed > 0.0) {
  float coals = smoothstep(0.0, 0.5, fbm(vec3(gp * 8.0, uTime * 0.12)));
  float pulse = 0.65 + 0.35 * snoise(vec3(gp * 2.5, uTime * 0.8));
  totalEmissiveRadiance += mix(uEmberDeep, uEmberColor, coals) * coals * bed * pulse * uFireGlow * 2.5;
}
`;

// Soft contact darkening where the log feet rest on the ash.
const GROUND_LIGHTING = /* glsl */ `
float logContact = smoothstep(0.0, 0.18, logGap(vGroundPos));
reflectedLight.directDiffuse *= logContact;
reflectedLight.indirectDiffuse *= logContact;
`;

/** @param {import('./index.js').ElementContext} ctx @returns {import('./index.js').ElementScene} */
export function createFire(ctx) {
  const root = new THREE.Group();
  const disposables = [];
  const track = (resource) => {
    disposables.push(resource);
    return resource;
  };

  const random = createRandom(7);
  const perlin = new ImprovedNoise();

  const shared = {
    uTime: { value: 0 },
    uFireGlow: { value: 1 },
    uEmberColor: { value: COLORS.glowOrange },
    uEmberHot: { value: COLORS.glowYellow },
    uEmberDeep: { value: COLORS.glowDeep },
  };

  // --- ground -----------------------------------------------------------------

  // Log axes (filled in the logs loop below) for the ground's contact shading.
  const logAxes = { uLogFoot: { value: [] }, uLogTip: { value: [] } };
  const groundGeometry = track(new THREE.CircleGeometry(GROUND_RADIUS, 96).rotateX(-Math.PI / 2));
  const groundMaterial = track(new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }));
  groundMaterial.defines = { ...groundMaterial.defines, LOG_COUNT: LOGS.length };
  groundMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, logAxes);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGroundPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvGroundPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + NOISE_GLSL + GROUND_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GROUND_SURFACE)
      .replace(
        '#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\nnormal = proceduralBump(normal, groundHeight, 0.004, faceDirection);',
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + GROUND_EMISSIVE)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + GROUND_LIGHTING);
  };
  groundMaterial.customProgramCacheKey = () => 'fire-ground';
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.receiveShadow = true;
  root.add(ground);

  // --- logs -------------------------------------------------------------------

  const up = new THREE.Vector3(0, 1, 0);
  const logSegments = [];
  for (const [index, spec] of LOGS.entries()) {
    const cosA = Math.cos(spec.azimuth);
    const sinA = Math.sin(spec.azimuth);
    const length = (spec.foot + spec.overshoot) / Math.cos(spec.elevation);
    const direction = new THREE.Vector3(-cosA * Math.cos(spec.elevation), Math.sin(spec.elevation), -sinA * Math.cos(spec.elevation));
    const foot = new THREE.Vector3(cosA * spec.foot - sinA * spec.lateral, spec.radius * 0.55, sinA * spec.foot + cosA * spec.lateral);
    const tip = foot.clone().addScaledVector(direction, length);

    const geometry = track(createLogGeometry(length, spec.radius, random, perlin));
    const material = track(
      createCharcoalMaterial(shared, {
        seed: index * 3.7 + 1.3,
        crackScale: 20,
        stretch: [1, 0.3, 1],
        capRings: 1,
        bumpScale: 0.0025,
        crackGlow: 1.5,
      }),
    );
    const log = new THREE.Mesh(geometry, material);
    log.position.copy(foot).lerp(tip, 0.5);
    log.quaternion.setFromUnitVectors(up, direction);
    log.rotateY(range(random, 0, Math.PI * 2));
    log.castShadow = true;
    log.receiveShadow = true;
    root.add(log);

    // Occluders for the flame march along the bowed axis: two for the full-width
    // body, a thinner one for the burnt-down tip.
    log.updateMatrix();
    const axisPoint = (along) =>
      new THREE.Vector3(geometry.userData.bend * Math.sin(Math.PI * along), (along - 0.5) * length, 0).applyMatrix4(log.matrix);
    const [base, middle, neck, end] = [0, 0.45, 0.78, 0.96].map(axisPoint);
    logSegments.push(
      { start: base, end: middle, radius: spec.radius * 0.8 },
      { start: middle, end: neck, radius: spec.radius * 0.8 },
      { start: neck, end, radius: spec.radius * 0.45 },
    );
    logAxes.uLogFoot.value.push(new THREE.Vector4(foot.x, foot.y, foot.z, spec.radius));
    logAxes.uLogTip.value.push(tip);
  }

  // --- coals in the fire bed ----------------------------------------------------

  const coalGeometry = track(createRockGeometry(2, 0.35, 0.12, 0, random, perlin));
  const coalMaterial = track(
    createCharcoalMaterial(shared, { seed: 11.1, crackScale: 1.4, stretch: [1, 1, 1], capRings: 0, bumpScale: 0.0004, crackGlow: 0.6 }),
  );
  const coals = new THREE.InstancedMesh(coalGeometry, coalMaterial, COAL_COUNT);
  const coalMatrix = new THREE.Matrix4();
  const coalQuaternion = new THREE.Quaternion();
  const coalEuler = new THREE.Euler();
  const coalPosition = new THREE.Vector3();
  const coalScale = new THREE.Vector3();
  for (let i = 0; i < COAL_COUNT; i++) {
    const angle = range(random, 0, Math.PI * 2);
    const radius = Math.sqrt(random()) * COAL_BED_RADIUS;
    const size = range(random, 0.03, 0.09);
    coalPosition.set(Math.cos(angle) * radius, size * 0.1, Math.sin(angle) * radius);
    coalEuler.set(range(random, 0, 6.28), range(random, 0, 6.28), range(random, 0, 6.28));
    coalQuaternion.setFromEuler(coalEuler);
    coalScale.set(size, size * range(random, 0.5, 0.8), size * range(random, 0.8, 1.3));
    coals.setMatrixAt(i, coalMatrix.compose(coalPosition, coalQuaternion, coalScale));
  }
  coals.castShadow = true;
  root.add(coals);

  // --- ring of stones -----------------------------------------------------------

  const stoneGeometry = track(createStoneRingGeometry(random, perlin));
  const stoneMaterial = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0 }));
  stoneMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vStonePos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvStonePos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vStonePos;\n' + NOISE_GLSL + BUMP_GLSL)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + STONE_SURFACE)
      .replace(
        '#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\nnormal = proceduralBump(normal, stoneHeight, 0.02, faceDirection);',
      );
  };
  stoneMaterial.customProgramCacheKey = () => 'fire-stone';
  const stones = new THREE.Mesh(stoneGeometry, stoneMaterial);
  stones.castShadow = true;
  stones.receiveShadow = true;
  root.add(stones);

  // --- flame volume ---------------------------------------------------------------

  const noiseTexture = track(createNoiseVolume(createRandom(31)));
  const flameUniforms = {
    uNoise: { value: noiseTexture },
    uTime: shared.uTime,
    uFlicker: { value: 1 },
    uDitherOffset: { value: 0 },
    uColorEmber: { value: COLORS.flameEmber },
    uColorRed: { value: COLORS.flameRed },
    uColorOrange: { value: COLORS.flameOrange },
    uColorYellow: { value: COLORS.flameYellow },
    uColorWhite: { value: COLORS.flameWhite },
    uColorSmoke: { value: COLORS.flameSmoke },
    uLogStart: { value: logSegments.map((s) => new THREE.Vector4(s.start.x, s.start.y - FLAME_BASE_Y, s.start.z, s.radius)) },
    uLogEnd: { value: logSegments.map((s) => new THREE.Vector3(s.end.x, s.end.y - FLAME_BASE_Y, s.end.z)) },
  };
  const flameGeometry = track(
    new THREE.BoxGeometry(FLAME_HALF_WIDTH * 2, FLAME_HEIGHT, FLAME_HALF_WIDTH * 2).translate(0, FLAME_HEIGHT / 2, 0),
  );
  const flameMaterial = track(
    new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      defines: { OCCLUDER_COUNT: logSegments.length },
      uniforms: flameUniforms,
      vertexShader: FLAME_VERTEX,
      fragmentShader: FLAME_FRAGMENT,
      // Front faces + analytic log capsules: logs inside the box still occlude correctly.
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    }),
  );
  const flame = new THREE.Mesh(flameGeometry, flameMaterial);
  flame.position.y = FLAME_BASE_Y;
  flame.renderOrder = 2;
  root.add(flame);

  // --- embers -------------------------------------------------------------------

  const emberGeometry = track(new THREE.BufferGeometry());
  const emberSeeds = new Float32Array(EMBER_COUNT * 4);
  for (let i = 0; i < emberSeeds.length; i++) emberSeeds[i] = random();
  emberGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(EMBER_COUNT * 3), 3));
  emberGeometry.setAttribute('aSeed', new THREE.BufferAttribute(emberSeeds, 4));
  const emberMaterial = track(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: shared.uTime,
        uPixelRatio: { value: ctx.pixelRatio },
        uHot: { value: COLORS.emberHot },
        uWarm: { value: COLORS.emberWarm },
        uCool: { value: COLORS.emberCool },
      },
      vertexShader: EMBER_VERTEX,
      fragmentShader: EMBER_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const embers = new THREE.Points(emberGeometry, emberMaterial);
  embers.frustumCulled = false; // positions are computed in the vertex shader
  embers.renderOrder = 3;
  root.add(embers);

  // --- atmospheric halo ---------------------------------------------------------

  const haloTexture = track(createGlowTexture(256));
  const haloMaterial = track(
    new THREE.SpriteMaterial({
      map: haloTexture,
      color: COLORS.halo,
      transparent: true,
      opacity: 0.025,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false,
    }),
  );
  const halo = new THREE.Sprite(haloMaterial);
  halo.position.set(0, 0.95, 0);
  halo.scale.set(4.5, 4.5, 1);
  halo.renderOrder = 4;
  root.add(halo);

  // --- lights -------------------------------------------------------------------

  const lowLight = new THREE.PointLight(COLORS.lightLow, LOW_LIGHT_INTENSITY, 0, 2);
  lowLight.position.set(0, LOW_LIGHT_Y, 0);
  const highLight = track(new THREE.PointLight(COLORS.lightHigh, HIGH_LIGHT_INTENSITY, 0, 2));
  highLight.position.set(0, HIGH_LIGHT_Y, 0);
  // Log and stone shadows fan out across the ash and breathe with the flicker.
  highLight.castShadow = true;
  highLight.shadow.mapSize.set(1024, 1024);
  highLight.shadow.radius = 5;
  highLight.shadow.bias = -0.003;
  highLight.shadow.normalBias = 0.03;
  highLight.shadow.camera.near = 0.1;
  highLight.shadow.camera.far = 10;
  highLight.shadow.camera.updateProjectionMatrix();
  const fill = new THREE.HemisphereLight(COLORS.skyFill, COLORS.groundFill, 0.25);
  root.add(lowLight, highLight, fill);

  // --- frame update -----------------------------------------------------------

  function update(time) {
    shared.uTime.value = time;

    const slow = perlin.noise(time * 1.3, 0.31, 0.77);
    const fast = perlin.noise(time * 7.9, 3.7, 0.11);
    const crackle = perlin.noise(time * 19.0, 8.3, 4.2);
    const flicker = 1 + 0.16 * slow + 0.1 * fast + 0.05 * crackle;

    shared.uFireGlow.value = flicker;
    flameUniforms.uFlicker.value = 0.92 + 0.08 * flicker;
    flameUniforms.uDitherOffset.value = (flameUniforms.uDitherOffset.value + 0.61803398) % 1;
    lowLight.intensity = LOW_LIGHT_INTENSITY * flicker;
    highLight.intensity = HIGH_LIGHT_INTENSITY * (0.85 + 0.15 * flicker + 0.08 * fast);
    highLight.position.set(
      0.07 * perlin.noise(time * 2.1, 1.1, 5.3) + BREEZE * 0.2,
      HIGH_LIGHT_Y + 0.08 * perlin.noise(time * 3.1, 2.2, 6.1),
      0.07 * perlin.noise(time * 2.3, 3.3, 7.7),
    );
    lowLight.position.x = 0.04 * perlin.noise(time * 4.1, 4.4, 1.9);
    lowLight.position.z = 0.04 * perlin.noise(time * 3.7, 5.5, 2.8);
    haloMaterial.opacity = 0.018 + 0.008 * flicker;
  }

  // Narrow (portrait) viewports start further back so the logs fit the width.
  const cameraPose = { position: new THREE.Vector3(), target: CAMERA_TARGET.clone() };
  function frameFor(aspect) {
    const distanceScale = THREE.MathUtils.clamp(0.62 / Math.max(aspect, 0.1), 1, 1.4);
    cameraPose.position.copy(CAMERA_OFFSET).multiplyScalar(distanceScale).add(cameraPose.target);
  }
  frameFor(ctx.camera.aspect);

  function dispose() {
    for (const resource of disposables) resource.dispose();
    coals.dispose();
  }

  return {
    root,
    update,
    dispose,
    camera: cameraPose,
    look: {
      background: COLORS.background,
      environment: null,
      fog: new THREE.Fog(COLORS.background, 6, 14),
      exposure: 1,
      bloom: { strength: 0.6, radius: 0.35, threshold: 1.0 },
    },
    controls: {
      minDistance: 2.4,
      maxDistance: 9,
      minPolarAngle: 0.2,
      maxPolarAngle: 1.5,
    },
    onResize(width, height) {
      frameFor(width / height);
    },
  };
}

// --- builders -------------------------------------------------------------------

/**
 * MeshStandardMaterial with charred-wood shading: bark on the cool ends, cracked
 * charcoal with ash patches and glowing fissures near the flame.
 */
function createCharcoalMaterial(shared, { seed, crackScale, stretch, capRings, bumpScale, crackGlow }) {
  const material = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
  const uniforms = {
    ...shared,
    uSeed: { value: seed },
    uCrackScale: { value: crackScale },
    uCrackStretch: { value: new THREE.Vector3(...stretch) },
    uCapRings: { value: capRings },
    uBumpScale: { value: bumpScale },
    uCrackGlow: { value: crackGlow },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCharLocal;\nvarying vec3 vCharWorld;\nvarying vec3 vCharNormal;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vCharLocal = transformed;
        vCharNormal = objectNormal;
        vec4 charWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          charWorld = instanceMatrix * charWorld;
        #endif
        vCharWorld = (modelMatrix * charWorld).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + NOISE_GLSL + CHARCOAL_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + CHARCOAL_SURFACE)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.95, 0.8, charring * (1.0 - ash));')
      .replace(
        '#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\nnormal = proceduralBump(normal, charHeight, uBumpScale, faceDirection);',
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + CHARCOAL_EMISSIVE)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + CHARCOAL_LIGHTING);
  };
  material.customProgramCacheKey = () => 'fire-charcoal';
  return material;
}

/** A tapered, slightly bowed cylinder with bark bumps and split-bark ridges. Local +Y is the log axis. */
function createLogGeometry(length, radius, random, noise) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 36, 24);
  const position = geometry.attributes.position;
  const seed = range(random, 0, 100);
  const bend = range(random, -0.05, 0.05);
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const angle = Math.atan2(v.z, v.x);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const along = v.y / length + 0.5;
    // Axial ridges: |noise| that barely changes along the log cuts long V-grooves.
    const ridges = 0.06 * (Math.abs(noise.noise(ca * 3.2 + seed, v.y * 0.7, sa * 3.2)) - 0.25);
    const bumps =
      0.14 * noise.noise(ca * 1.6 + seed, v.y * 2.4, sa * 1.6) + 0.035 * noise.noise(ca * 5 + seed, v.y * 11, sa * 5) + ridges;
    // The end inside the fire has burnt down to an uneven, narrower stub.
    const burnt = THREE.MathUtils.smoothstep(along, 0.62, 1.0) * (0.5 + 0.15 * noise.noise(ca * 3 + seed, 4.2, sa * 3));
    const scale = (1 + bumps) * (1 - burnt);
    v.x = v.x * scale + bend * Math.sin(Math.PI * along);
    v.z *= scale;
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  geometry.userData.bend = bend; // local +X bow at mid-length, for the flame occluders
  return geometry;
}

/**
 * Irregular lump of unit size: icosphere with layered noise displacement, plus
 * optional sharp-crested ridges for weathered stone.
 */
function createRockGeometry(detail, roughness, fineRoughness, ridge, random, noise) {
  const base = new THREE.IcosahedronGeometry(1, detail);
  base.deleteAttribute('normal');
  base.deleteAttribute('uv');
  const geometry = mergeVertices(base);
  base.dispose();
  const position = geometry.attributes.position;
  const seed = range(random, 0, 100);
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const n1 = noise.noise(v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3);
    const n2 = noise.noise(v.x * 4.1 + seed, v.y * 4.1 + 7, v.z * 4.1);
    const n3 = ridge > 0 ? 0.3 - Math.abs(noise.noise(v.x * 7 + seed, v.y * 7 - 3, v.z * 7)) : 0;
    v.multiplyScalar(1 + roughness * n1 + fineRoughness * n2 + ridge * n3);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Shears a lump with random, mostly upright planes into flat fractured faces. */
function cutFaces(geometry, count, random) {
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();
  const plane = new THREE.Vector3();
  for (let c = 0; c < count; c++) {
    const angle = range(random, 0, Math.PI * 2);
    plane.set(Math.cos(angle), range(random, -0.5, 0.5), Math.sin(angle)).normalize();
    const offset = range(random, 0.55, 0.8);
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      const beyond = v.dot(plane) - offset;
      if (beyond > 0) position.setXYZ(i, v.x - plane.x * beyond, v.y - plane.y * beyond, v.z - plane.z * beyond);
    }
  }
}

/** Clips a lump's top and bottom into broad, slightly domed faces. */
function flattenFaces(geometry, limit) {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const excess = Math.abs(y) - limit;
    if (excess > 0) position.setY(i, Math.sign(y) * (limit + excess * 0.25));
  }
}

/** All hearth stones merged into one draw call, with soot on the faces toward the fire. */
function createStoneRingGeometry(random, noise) {
  const stones = [];
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const tone = new THREE.Color();
  const stoneTone = new THREE.Color('#8c8986');
  const soot = new THREE.Color('#141110');

  for (let i = 0; i < STONE_COUNT; i++) {
    const angle = (i / STONE_COUNT) * Math.PI * 2 + range(random, -0.12, 0.12);
    const radius = STONE_RING_RADIUS + range(random, -0.07, 0.07);
    const size = range(random, 0.17, 0.27);
    const lump = createRockGeometry(4, 0.34, 0.1, 0.08, random, noise);
    cutFaces(lump, 3 + Math.floor(random() * 3), random);
    flattenFaces(lump, range(random, 0.62, 0.8));
    euler.set(range(random, -0.3, 0.3), range(random, 0, 6.28), range(random, -0.3, 0.3));
    quaternion.setFromEuler(euler);
    scale.set(size * range(random, 1.0, 1.4), size * range(random, 0.55, 0.75), size * range(random, 0.9, 1.2));
    position.set(Math.cos(angle) * radius, scale.y * 0.45, Math.sin(angle) * radius);
    lump.applyMatrix4(matrix.compose(position, quaternion, scale));
    // Hard edges where the cuts meet, re-welded wherever the surface is smooth.
    const creased = toCreasedNormals(lump, STONE_CREASE_ANGLE);
    const geometry = mergeVertices(creased);
    lump.dispose();
    creased.dispose();

    const points = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const colors = new Float32Array(points.count * 3);
    const lightness = range(random, 0.5, 1.3);
    for (let v = 0; v < points.count; v++) {
      normal.fromBufferAttribute(normals, v);
      const px = points.getX(v);
      const pz = points.getZ(v);
      const inward = -(normal.x * px + normal.z * pz) / Math.hypot(px, pz);
      const speckle = 0.85 + 0.3 * noise.noise(px * 9, points.getY(v) * 9, pz * 9);
      tone.copy(stoneTone).multiplyScalar(lightness * speckle);
      const low = 1 - THREE.MathUtils.smoothstep(points.getY(v), 0, scale.y * 0.9);
      tone.lerp(soot, THREE.MathUtils.smoothstep(inward, 0.1, 0.9) * (0.15 + 0.35 * low));
      colors[v * 3] = tone.r;
      colors[v * 3 + 1] = tone.g;
      colors[v * 3 + 2] = tone.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    stones.push(geometry);
  }
  const merged = mergeGeometries(stones);
  for (const geometry of stones) geometry.dispose();
  return merged;
}

/**
 * Tiling 3D gradient noise (period NOISE_CELLS) in a half-float volume, scaled
 * to roughly unit amplitude. One trilinear fetch replaces a full simplex eval.
 */
function createNoiseVolume(random) {
  const cells = NOISE_CELLS;
  const size = NOISE_SIZE;
  const gradients = new Float32Array(cells * cells * cells * 3);
  for (let i = 0; i < cells * cells * cells; i++) {
    const z = range(random, -1, 1);
    const a = range(random, 0, Math.PI * 2);
    const s = Math.sqrt(1 - z * z);
    gradients[i * 3] = s * Math.cos(a);
    gradients[i * 3 + 1] = s * Math.sin(a);
    gradients[i * 3 + 2] = z;
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const corner = (ix, iy, iz, fx, fy, fz) => {
    const g = (((iz % cells) * cells + (iy % cells)) * cells + (ix % cells)) * 3;
    return gradients[g] * fx + gradients[g + 1] * fy + gradients[g + 2] * fz;
  };

  const values = new Float32Array(size * size * size);
  const step = cells / size;
  let sumSquares = 0;
  let index = 0;
  for (let z = 0; z < size; z++) {
    const pz = z * step;
    const iz = Math.floor(pz);
    const fz = pz - iz;
    const wz = fade(fz);
    for (let y = 0; y < size; y++) {
      const py = y * step;
      const iy = Math.floor(py);
      const fy = py - iy;
      const wy = fade(fy);
      for (let x = 0; x < size; x++) {
        const px = x * step;
        const ix = Math.floor(px);
        const fx = px - ix;
        const wx = fade(fx);
        const x00 = lerp(corner(ix, iy, iz, fx, fy, fz), corner(ix + 1, iy, iz, fx - 1, fy, fz), wx);
        const x10 = lerp(corner(ix, iy + 1, iz, fx, fy - 1, fz), corner(ix + 1, iy + 1, iz, fx - 1, fy - 1, fz), wx);
        const x01 = lerp(corner(ix, iy, iz + 1, fx, fy, fz - 1), corner(ix + 1, iy, iz + 1, fx - 1, fy, fz - 1), wx);
        const x11 = lerp(
          corner(ix, iy + 1, iz + 1, fx, fy - 1, fz - 1),
          corner(ix + 1, iy + 1, iz + 1, fx - 1, fy - 1, fz - 1),
          wx,
        );
        const value = lerp(lerp(x00, x10, wy), lerp(x01, x11, wy), wz);
        values[index++] = value;
        sumSquares += value * value;
      }
    }
  }

  // Normalise to a standard deviation of 0.5 so the field reads as ~[-1, 1].
  const gain = 0.5 / Math.sqrt(sumSquares / values.length);
  const data = new Uint16Array(values.length);
  for (let i = 0; i < values.length; i++) data[i] = THREE.DataUtils.toHalfFloat(values[i] * gain);

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.type = THREE.HalfFloatType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapR = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
