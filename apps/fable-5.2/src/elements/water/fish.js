import * as THREE from 'three';

// A small shoal of silver fish cruising round the column at mid-depth. The CPU works out
// where each fish is, which way it points and where its tail beat stands (a handful of
// sines per fish); the ray tracer finds them by sphere tracing a signed distance field of
// one fish (body, forked tail, dorsal and anal fin, bent by the swimming wave), and only
// for rays that pass through a fish's own bounding sphere inside the sphere of the shoal.

export const FISH_COUNT = 18;

const LAP = 34;             // seconds for the shoal to go once round the column
const STRING = 3.6;         // the shoal is strung out over this many seconds of its own track
const BODY = 0.076;         // half-length of a body (m), before the per-fish scale

// The track every fish follows, each a little behind the leader: a slow loop round the
// axis that wanders in and out and up and down, clear of the boulders and the wall.
function track(s, out) {
  const a = (s * 2 * Math.PI) / LAP;
  const r = 1.12 + 0.30 * Math.sin(a * 2 + 1.0);
  out.x = r * Math.cos(a);
  out.y = 2.20 + 0.40 * Math.sin(a * 3 + 0.5) + 0.10 * Math.sin(a * 7);
  out.z = r * Math.sin(a) * 0.9;
}

export class Shoal {
  constructor(rng) {
    this.lag = new Float32Array(FISH_COUNT);
    this.across = new Float32Array(FISH_COUNT);
    this.above = new Float32Array(FISH_COUNT);
    this.beat = new Float32Array(FISH_COUNT);
    this.phase = new Float32Array(FISH_COUNT);
    for (let i = 0; i < FISH_COUNT; i++) {
      this.lag[i] = Math.pow(rng(), 1.4) * STRING;         // bunched toward the front
      this.across[i] = (rng() - 0.5) * 0.50;
      this.above[i] = (rng() - 0.5) * 0.40;
      this.beat[i] = 8.5 + rng() * 4;                      // tail beats, radians per second
      this.phase[i] = rng() * Math.PI * 2;
    }
    /** xyz = position (local), w = phase of the swimming wave (radians). */
    this.positions = Array.from({ length: FISH_COUNT }, () => new THREE.Vector4());
    /** xyz = unit heading, w = half-length of the body (m). */
    this.headings = Array.from({ length: FISH_COUNT }, (_, i) => new THREE.Vector4(1, 0, 0, BODY * (0.78 + 0.5 * rng() + (i === 0 ? 0.12 : 0))));
    /** Sphere that holds the whole shoal: xyz = centre, w = radius. */
    this.bounds = new THREE.Vector4(0, 2, 0, 1);
    this._a = { x: 0, y: 0, z: 0 };
    this._b = { x: 0, y: 0, z: 0 };
  }

  update(t) {
    const a = this._a, b = this._b;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < FISH_COUNT; i++) {
      // Nobody in a shoal holds a steady pace: each fish drifts a little ahead and behind.
      const s = t - this.lag[i] + 0.35 * Math.sin(t * 0.23 + i * 2.1);
      track(s, a);
      track(s + 0.08, b);
      let hx = b.x - a.x, hy = b.y - a.y, hz = b.z - a.z;
      // Each fish keeps its own station beside the track and weaves a little about it.
      const sl = Math.hypot(hx, hz) || 1;
      const sx = hz / sl, sz = -hx / sl;
      const wobble = Math.sin(t * 0.7 + i * 1.9);
      const weave = this.across[i] * (1 + 0.25 * wobble) + 0.03 * Math.sin(t * 1.9 + i * 2.3);
      const x = a.x + sx * weave;
      const y = a.y + this.above[i] + 0.03 * Math.sin(t * 1.3 + i);
      const z = a.z + sz * weave;
      // ... and noses in and out with it, so the bodies are never quite parallel.
      const yaw = 0.22 * Math.cos(t * 0.7 + i * 1.9) * Math.sign(this.across[i] || 1) + 0.10 * Math.sin(t * 1.1 + i * 4.3);
      hx += sx * yaw * sl; hz += sz * yaw * sl;
      hy += 0.05 * sl * Math.cos(t * 1.3 + i);
      const hl = Math.hypot(hx, hy, hz) || 1;
      this.positions[i].set(x, y, z, (t * this.beat[i] + this.phase[i]) % (Math.PI * 2));
      const h = this.headings[i];
      h.set(hx / hl, hy / hl, hz / hl, h.w);
      cx += x; cy += y; cz += z;
    }
    cx /= FISH_COUNT; cy /= FISH_COUNT; cz /= FISH_COUNT;
    let far = 0;
    for (let i = 0; i < FISH_COUNT; i++) {
      const p = this.positions[i];
      far = Math.max(far, Math.hypot(p.x - cx, p.y - cy, p.z - cz));
    }
    this.bounds.set(cx, cy, cz, far + BODY * 2.4);
  }
}

export const FISH_GLSL = /* glsl */ `
#define FISH_COUNT ${FISH_COUNT}
uniform vec4 uFish[FISH_COUNT];       // xyz = position, w = phase of the swimming wave
uniform vec4 uFishDir[FISH_COUNT];    // xyz = unit heading, w = half-length of the body (m)
uniform vec4 uShoal;                  // sphere holding the whole shoal

// Everything about one fish is written in its own frame, in units of half a body length:
// x toward the nose (the snout at +1, the tips of the tail near -1.45), y up, z across.

// Half-height of the body at station x: a blunt head, deepest a third of the way back,
// drawn out to the wrist of the tail.
float fishProfile(float x) {
  float head = sqrt(max(1.0 - sq((x - 0.28) / 0.72), 0.0));
  float aft = 0.15 + 0.85 * (0.5 + 0.5 * cos(PI * clamp((0.28 - x) / 1.14, 0.0, 1.0)));
  return 0.285 * (x > 0.28 ? pow(head, 0.8) : aft);
}

// How far the spine is thrown sideways at station x: the wave that drives the fish runs
// down the body from head to tail and grows as it goes.
float fishSway(float x, float phase) {
  float s = clamp((0.9 - x) / 1.9, 0.0, 1.25);
  return 0.24 * s * s * sin(phase - 3.0 * s);
}

// Distance (a safe underestimate) to the fish at p. part: 0 body, 1 a fin.
float fishDistance(vec3 p, float phase, out float part) {
  p.z -= fishSway(p.x, phase);
  // Body: an ellipse half as wide as it is deep, swept along the profile.
  float xc = clamp(p.x, -0.86, 1.0);
  float r = fishProfile(xc);
  float body = (length(vec3(p.x - xc, p.y, p.z * 2.0)) - r) * 0.46;
  // Tail fin: a forked blade in the plane of the body.
  float t = (-0.80 - p.x) / 0.64;
  float spread = 0.05 + 0.34 * pow(clamp(t, 0.0, 1.0), 0.85);
  float notch = 0.46 * (t - 0.42);
  float tail = max(max(abs(p.y) - spread, notch - abs(p.y)), max(-t, t - 1.0) * 0.64);
  tail = max(tail * 0.72, abs(p.z) - 0.014 * (1.25 - t));
  // Dorsal fin, raked back, and a small anal fin below.
  float dorsal = r + 0.20 * clamp(min((0.22 - p.x) / 0.16, (p.x + 0.42) / 0.50), 0.0, 1.0);
  float fin = max(max(p.y - dorsal, r * 0.5 - p.y), max(p.x - 0.22, -0.42 - p.x));
  float anal = r + 0.13 * clamp(min((-0.18 - p.x) / 0.12, (p.x + 0.62) / 0.34), 0.0, 1.0);
  fin = min(fin, max(max(-p.y - anal, r * 0.5 + p.y), max(p.x + 0.18, -0.62 - p.x)));
  fin = max(fin * 0.72, abs(p.z) - 0.010);
  float fins = min(tail, fin);
  part = fins < body ? 1.0 : 0.0;
  return min(body, fins);
}

// Nearest fish on the ray p + d t before tMax: t, or -1. n = surface normal (world);
// q = the hit in the fish's own frame with the swimming bend taken out; part = 0 for the
// body, 1 for a fin.
float intersectFish(vec3 p, vec3 d, float tMax, bool wanted, out vec3 n, out vec3 q, out float part) {
  n = vec3(0.0, 1.0, 0.0);
  q = vec3(0.0);
  part = -1.0;
  vec3 oc = p - uShoal.xyz;
  float b = dot(oc, d);
  float h = b * b - dot(oc, oc) + uShoal.w * uShoal.w;
  float reachIn = -b - sqrt(max(h, 0.0)), reachOut = -b + sqrt(max(h, 0.0));
  // The test on the shoal's sphere sets the length of the loop instead of guarding it: a
  // compiler is free to turn a guard round pure arithmetic into a select and run every
  // fish for every pixel of the column, but it cannot run a loop that has no iterations.
  int count = wanted && h > 0.0 && reachOut > 0.0 && reachIn < tMax ? FISH_COUNT : 0;
  float best = tMax;
  int who = -1;
  for (int i = 0; i < count; i++) {
    float size = uFishDir[i].w;
    vec3 fwd = uFishDir[i].xyz;
    // A sphere round each fish (centred a little aft, where the tail swings) settles
    // cheaply that most of them are nowhere near the ray.
    vec3 o = p - uFish[i].xyz + fwd * (0.22 * size);
    float ob = dot(o, d);
    float oh = ob * ob - dot(o, o) + sq(1.38 * size);
    float root = sqrt(max(oh, 0.0));
    float t = max(-ob - root, 0.0);
    float tOut = oh > 0.0 ? min(-ob + root, best) : -1.0;
    if (t >= tOut) continue;
    vec3 side = normalize(vec3(fwd.z, 0.0, -fwd.x));
    vec3 up = cross(fwd, side);
    vec3 ol = vec3(dot(p - uFish[i].xyz, fwd), dot(p - uFish[i].xyz, up), dot(p - uFish[i].xyz, side)) / size;
    vec3 dl = vec3(dot(d, fwd), dot(d, up), dot(d, side)) / size;
    float prt = 0.0;
    bool found = false;
    for (int k = 0; k < 16 && t < tOut; k++) {
      float dist = fishDistance(ol + dl * t, uFish[i].w, prt);
      if (dist < 0.006) { found = true; break; }
      t += dist * size;
    }
    if (found) { best = t; who = i; part = prt; }
  }
  if (who < 0) return -1.0;
  float size = uFishDir[who].w;
  vec3 fwd = uFishDir[who].xyz;
  vec3 side = normalize(vec3(fwd.z, 0.0, -fwd.x));
  vec3 up = cross(fwd, side);
  vec3 rel = p + d * best - uFish[who].xyz;
  vec3 l = vec3(dot(rel, fwd), dot(rel, up), dot(rel, side)) / size;
  const vec2 e = vec2(1.0, -1.0) * 0.012;
  float unused;
  float phase = uFish[who].w;
  vec3 g = e.xyy * fishDistance(l + e.xyy, phase, unused) + e.yyx * fishDistance(l + e.yyx, phase, unused)
         + e.yxy * fishDistance(l + e.yxy, phase, unused) + e.xxx * fishDistance(l + e.xxx, phase, unused);
  g = normalize(g + vec3(0.0, 0.0, 1e-5));
  n = normalize(fwd * g.x + up * g.y + side * g.z);
  q = vec3(l.x, l.y, l.z - fishSway(l.x, phase));
  return best;
}
`;
