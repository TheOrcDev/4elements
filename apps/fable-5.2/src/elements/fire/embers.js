import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FIRE_GLSL } from './common.js';

// Sparks, drawn as instanced streaks whose position is a pure function of a seed and time,
// so they cost nothing on the CPU. Five kinds share one draw call:
//   plume     thousands of sparks born in the flame and carried up the buoyant column,
//             one in twenty-five of them a firebrand: a bigger scrap that glows for longer
//   pops      bursts thrown out when a log cracks (the CPU only chooses when and where)
//   landers   a few that sail out, sink and die on the water (the CPU chooses the landing
//             point, so it can ring the film there at the right moment)
//   ash       grey flakes sifting down around the fire, lit by it
//   skitters  sparks that fell on the rim of the bowl and run along the iron, hopping

const POP_SLOTS = 6;
const PER_POP = 150;
const LANDERS = 14;
const ASH = 420;
const SKITTERS = 40;
const PLUME = 6400;

const KIND_PLUME = 0, KIND_POP = 1, KIND_LANDER = 2, KIND_ASH = 3, KIND_SKITTER = 4;

const EMBER_VERT = /* glsl */ `
${VERT_PRELUDE}
${FIRE_GLSL}
#define POP_SLOTS ${POP_SLOTS}
#define LANDERS ${LANDERS}
attribute vec4 aSeed;        // four independent random numbers
attribute vec4 aRand;        // four more
attribute vec2 aKind;        // x: kind of particle, y: slot (pop or lander index)
uniform vec4 uPop[POP_SLOTS];       // xyz: where the log cracked (local), w: when
uniform vec4 uLander[LANDERS];      // xy: landing point (local xz), z: take-off time, w: flight time
varying vec2 vStreak;        // x: across the streak in half-widths, y: along it in half-widths
varying float vLength;       // length of the streak in half-widths
varying vec3 vColor;
varying float vViewZ;

// Seconds of motion smeared into each streak, as a camera shutter would.
const float SHUTTER = 0.032;

// Radiance of a spark at temperature T: white-yellow when born, dull red before it dies.
vec3 sparkGlow(float T) {
  float x = saturate((T - 800.0) / 1300.0);
  return blackbody(T) * (22.0 * x * x);
}

// How lively the fire is at a given moment, 0..1 (the same gust curve the CPU uses).
float fireGust(float t) {
  return smoothstep(0.58, 0.92, 0.5 + 0.5 * sin(0.31 * t + 1.9 * sin(0.083 * t + 0.6) + 0.7 * sin(0.047 * t)));
}

// ---- plume sparks -------------------------------------------------------------------
// a: age in seconds, time: the moment it is evaluated at (so that the tail of a streak
// sees the eddies where they were).
vec3 plumePath(float a, float time) {
  float ang = aSeed.x * TAU;
  float r0 = sqrt(aSeed.y) * 0.62;
  float yb = 0.95 + 1.9 * aSeed.z * aSeed.z;                 // born inside the flame, mostly low
  // Buoyancy accelerates the spark to a cruising speed; each one tops out at its own
  // height, which it approaches ever more slowly as it cools and the plume loses its grip.
  float v0 = 1.0 + 1.2 * aRand.x, v1 = 2.4 + 2.8 * aRand.y;
  const float TACC = 0.7;
  float rise = v1 * a - (v1 - v0) * TACC * (1.0 - exp(-a / TACC));
  float reach = mix(2.8, 16.0, aRand.x * aRand.x);
  float y = yb + reach * (1.0 - exp(-rise / reach));
  float h = y - FIRE_Y0;
  // Carried by the column: drawn in where it contracts, spreading with it above, leaning with it.
  float spread = firePlumeRadius(h) / firePlumeRadius(yb - FIRE_Y0) * (1.0 + 0.12 * max(h - 3.0, 0.0));
  vec2 xz = fireLean(h) + vec2(cos(ang), sin(ang)) * r0 * spread;
  vec3 p = vec3(xz.x, y, xz.y);
  // Eddies: a displacement field that drifts upward more slowly than the sparks, so each
  // threads its way through them on a curling path. Neighbours share eddies and swirl together.
  vec3 q = p * 0.42 + vec3(0.0, -time * 0.55, 0.0) + aSeed.w * 0.3;
  float amp = (0.05 + 0.34 * a) / (1.0 + 0.12 * a);
  return p + amp * (snoise3(q) + 0.35 * snoise3(q * 2.7 + 11.0));
}

// ---- pops ---------------------------------------------------------------------------
// Thrown out ballistically in a fan, braked hard by the air, then taken by the updraft or
// by gravity.
vec3 popPath(float a, vec3 from) {
  float ang = aSeed.x * TAU;
  float cy = mix(0.05, 1.0, aSeed.y);
  float sy = sqrt(1.0 - cy * cy);
  vec3 dir = vec3(cos(ang) * sy, cy, sin(ang) * sy);
  float speed = mix(1.2, 8.0, aSeed.z * aSeed.z);
  const float DRAG = 2.4;
  float e = (1.0 - exp(-DRAG * a)) / DRAG;                    // integral of the decaying velocity
  vec3 p = from + dir * speed * e;
  p.y += mix(-1.6, 2.6, aRand.x) * (a - e);                   // terminal fall or rise
  p.xz += fireLean(max(p.y - FIRE_Y0, 0.0)) * 0.6;
  return p + 0.10 * a * snoise3(p * 1.3 + aSeed.w * 9.0);
}

// ---- landers ------------------------------------------------------------------------
// u runs 0..1 from take-off to touch-down. Whatever the seed, the path ends exactly on
// the landing point at the film, which is all the CPU needs to know.
vec3 landerPath(float u, vec4 flight) {
  vec2 lean = fireLean(3.0);
  vec3 from = vec3(lean.x + (aSeed.x - 0.5) * 0.5, 3.2 + aSeed.y * 1.4, lean.y + (aSeed.z - 0.5) * 0.5);
  vec2 xz = mix(from.xz, flight.xy, pow(u, 1.4));
  float y = from.y * (1.0 - u * u) + (1.6 + 2.8 * aSeed.w) * 4.0 * u * (1.0 - u) * (1.0 - u);
  float a = u * flight.w;
  xz += 0.32 * sin(PI * u) * vec2(sin(a * 1.3 + aSeed.x * 20.0), cos(a * 1.1 + aSeed.y * 20.0));
  return vec3(xz.x, y, xz.y);
}

// ---- ash ----------------------------------------------------------------------------
// A flake falls for one period, then starts again from the top. a: seconds into the fall.
float ashPeriod() { return 9.0 + 9.0 * aSeed.w; }
vec3 ashPath(float a) {
  float period = ashPeriod();
  float ang = aSeed.x * TAU + 0.12 * a;
  float r = 0.9 + 4.6 * sqrt(aSeed.y);
  float y = 6.5 * (1.0 - a / period) + 0.07 * sin(a * 2.3 + aSeed.z * 30.0);
  vec2 xz = vec2(cos(ang), sin(ang)) * r + uFireWind * 0.35 * (6.5 - y)
          + 0.22 * vec2(sin(a * 1.7 + aSeed.z * 40.0), cos(a * 1.3 + aSeed.w * 40.0));
  return vec3(xz.x, y, xz.y);
}

// ---- skitters -----------------------------------------------------------------------
// Along the rim at a speed that friction soon kills, in ever smaller hops.
vec3 skitterPath(float a) {
  float ang = aSeed.x * TAU + (aSeed.y - 0.5) * 5.0 * (1.0 - exp(-a * 2.5)) / 2.5;
  float hop = abs(sin(a * (9.0 + 8.0 * aSeed.z))) * 0.04 * exp(-a * 2.2);
  float r = RIM_R - 0.04 + 0.03 * aSeed.w;
  return vec3(cos(ang) * r, RIM_Y + 0.035 + hop, sin(ang) * r);
}

void main() {
  vec3 head = vec3(0.0), tail = vec3(0.0);
  vec3 color = vec3(0.0);
  float size = 0.006;                    // radius of the glowing grain, metres
  float kind = aKind.x;
  int slot = int(aKind.y + 0.5);

  // (Most sparks are dark at any one moment, waiting for their next flight. Their paths
  // are the costly part, so those are only worked out for the ones that are alight.)
  if (kind < 0.5) {
    float brand = step(0.96, aRand.z);
    float life = (1.0 + 6.5 * aSeed.w * sqrt(aSeed.w)) * (1.0 + 1.2 * brand);
    float period = life * (1.5 + 2.2 * aRand.z);
    float a = fract(uTime / period + aSeed.x * 7.13 + aRand.w) * period;
    float k = a / life;
    // More sparks leave the fire when a gust is fanning it.
    float born = uTime - a;
    if (k < 1.0 && aRand.w <= 0.55 + 0.45 * fireGust(born)) {
      head = plumePath(a, uTime);
      tail = plumePath(max(a - SHUTTER, 0.0), uTime - SHUTTER);
      float flare = 0.72 + 0.28 * sin(a * (7.0 + 15.0 * aRand.z) + aSeed.y * 40.0);
      float T = mix(2350.0, 930.0, pow(saturate(k), 0.62 + 0.6 * brand));
      // Deep inside the flame a spark is lost in the glare: let it emerge as it climbs out.
      float h = head.y - FIRE_Y0;
      vec2 off = head.xz - fireLean(h);
      float inFlame = (1.0 - smoothstep(0.35, 1.0, dot(off, off) / sq(firePlumeRadius(h)))) * (1.0 - smoothstep(1.5, 3.2, h / uFireState.x));
      color = sparkGlow(T) * flare * smoothstep(0.0, 0.08, a) * (1.0 - smoothstep(0.86, 1.0, k)) * (1.0 - 0.96 * inFlame);
      size = (0.0035 + 0.0045 * aRand.y * aRand.y) * (1.0 + 1.8 * brand);
    }
  } else if (kind < 1.5) {
    vec4 pop = uPop[slot];
    float a = uTime - pop.w - aRand.y * 0.07;
    float life = 0.45 + 1.7 * aRand.z * aRand.z;
    float k = a / life;
    if (a >= 0.0 && k < 1.0) {
      head = popPath(a, pop.xyz);
      tail = popPath(max(a - SHUTTER, 0.0), pop.xyz);
      float T = mix(2450.0, 950.0, pow(saturate(k), 0.7));
      color = sparkGlow(T) * (1.0 - smoothstep(0.8, 1.0, k)) * 1.2;
      size = 0.003 + 0.004 * aRand.w;
    }
  } else if (kind < 2.5) {
    vec4 flight = uLander[slot];
    float a = uTime - flight.z;
    float u = a / max(flight.w, 0.1);
    head = landerPath(saturate(u), flight);
    tail = landerPath(saturate(u - SHUTTER / max(flight.w, 0.1)), flight);
    // It glows on its way down, flares orange as it touches the water and is quenched.
    float afloat = max(a - flight.w, 0.0);
    float T = mix(1750.0, 1150.0, saturate(u)) + 260.0 * exp(-afloat * 9.0) * step(1.0, u);
    float flare = 0.75 + 0.25 * sin(a * (5.0 + 9.0 * aSeed.z));
    color = sparkGlow(T) * flare * step(0.0, a) * smoothstep(0.0, 0.3, a) * (1.0 - smoothstep(0.15, 0.45, afloat));
    size = 0.007;
  } else if (kind < 3.5) {
    float period = ashPeriod();
    float a = fract(uTime / period + aSeed.x * 3.7) * period;
    head = ashPath(a);
    tail = ashPath(max(a - SHUTTER, 0.0));
    // Not glowing: a pale flake catching the firelight and a little of the sky, turning
    // as it falls. It fades in at the top and out at the water.
    vec3 toFire = uFireLightPos - (head + uFireOrigin);
    color = 0.11 * (uFireLightColor / (dot(toFire, toFire) + 1.0) + skyAmbient(vec3(0.0, 1.0, 0.0)) * 2.0)
          * smoothstep(0.0, 0.6, a) * smoothstep(0.0, 0.25, head.y)
          * (0.5 + 0.5 * sin(uTime * (2.0 + 5.0 * aRand.x) + aSeed.z * 50.0));
    size = 0.006 + 0.008 * aRand.y;
  } else {
    float life = 0.5 + 0.9 * aRand.x;
    float period = 3.0 + 7.0 * aRand.y;
    float a = fract(uTime / period + aRand.z) * period;
    float k = a / life;
    head = skitterPath(a);
    tail = skitterPath(max(a - SHUTTER, 0.0));
    color = sparkGlow(mix(2000.0, 1000.0, saturate(k))) * step(k, 1.0) * (1.0 - smoothstep(0.7, 1.0, k));
    size = 0.004;
  }

  vec4 c1 = projectionMatrix * viewMatrix * vec4(head + uFireOrigin, 1.0);
  vec4 c0 = projectionMatrix * viewMatrix * vec4(tail + uFireOrigin, 1.0);
  vViewZ = c1.w;
  if (c1.w < uCameraNear || c0.w < uCameraNear || dot(color, color) <= 0.0) {
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);              // dead or behind the eye: clipped away
    vStreak = vec2(0.0); vLength = 0.0; vColor = vec3(0.0);
    return;
  }
  // Work in pixels. A spark is far smaller than a pixel at most distances: draw it at
  // least 1.5 pixels wide and dim it by the area it gained, so it neither aliases nor grows.
  vec2 halfRes = 0.5 * uResolution;
  vec2 s1 = c1.xy / c1.w * halfRes, s0 = c0.xy / c0.w * halfRes;
  float truePx = size * halfRes.y * projectionMatrix[1][1] / c1.w;
  float hw = max(truePx, 0.75);
  vec2 along = s1 - s0;
  float len = length(along);
  vec2 dir = len > 1e-3 ? along / len : vec2(0.0, 1.0);
  vec2 nrm = vec2(dir.y, -dir.x);
  const float PAD = 1.8;                                 // room for the soft edge
  float end = position.y * 2.0 - 1.0;                    // -1 at the tail, +1 at the head
  vec2 px = mix(s0, s1, position.y) + (nrm * position.x + dir * end) * hw * PAD;
  vStreak = vec2(position.x * PAD, position.y * len / hw + end * PAD);
  vLength = len / hw;
  // Energy: the grain's light is spread over the pixels it was widened to and, partly,
  // along its streak (fully would make the fast ones vanish, and the far ones too: a spark
  // seen from across the water has to stay a spark).
  vColor = color * pow(truePx / hw, 0.85) / sqrt(1.0 + 0.35 * vLength);
  gl_Position = vec4(px / halfRes * c1.w, c1.z, c1.w);
}
`;

const EMBER_FRAG = /* glsl */ `
${FRAG_PRELUDE}
varying vec2 vStreak;
varying float vLength;
varying vec3 vColor;
varying float vViewZ;
void main() {
  // Distance to the streak's centre line (a capsule), in half-widths.
  float d = length(vec2(vStreak.x, vStreak.y - clamp(vStreak.y, 0.0, vLength)));
  // Brightest at the head, where the grain is now; the tail is the fading memory of it.
  float shape = exp(-d * d * 2.2) * mix(0.25, 1.0, saturate(vStreak.y / max(vLength, 1e-3)));
  gl_FragColor = vec4(vColor * shape * softFade(vViewZ, 0.2), 0.0);
}
`;

export class Embers {
  /**
   * @param ctx          element context
   * @param fireUniforms shared fire uniforms
   * @param popPoints    local positions on the logs where sparks may burst
   */
  constructor(ctx, fireUniforms, popPoints) {
    this.ctx = ctx;
    this.popPoints = popPoints;
    this.rng = ctx.rng(2718);
    const rng = ctx.rng(1618);

    // Order: pops, landers, ash, skitters, then the plume, so quality can trim the plume by count.
    this.fixedCount = POP_SLOTS * PER_POP + LANDERS + ASH + SKITTERS;
    const count = this.fixedCount + PLUME;
    const seed = new Float32Array(count * 4);
    const rand = new Float32Array(count * 4);
    const kind = new Float32Array(count * 2);
    for (let i = 0; i < count * 4; i++) { seed[i] = rng(); rand[i] = rng(); }
    let k = 0;
    for (let s = 0; s < POP_SLOTS; s++) for (let i = 0; i < PER_POP; i++, k++) { kind[k * 2] = KIND_POP; kind[k * 2 + 1] = s; }
    for (let i = 0; i < LANDERS; i++, k++) { kind[k * 2] = KIND_LANDER; kind[k * 2 + 1] = i; }
    for (let i = 0; i < ASH; i++, k++) { kind[k * 2] = KIND_ASH; kind[k * 2 + 1] = 0; }
    for (let i = 0; i < SKITTERS; i++, k++) { kind[k * 2] = KIND_SKITTER; kind[k * 2 + 1] = 0; }
    for (let i = 0; i < PLUME; i++, k++) { kind[k * 2] = KIND_PLUME; kind[k * 2 + 1] = 0; }

    const geometry = new THREE.InstancedBufferGeometry();
    // One quad: x is the side (-1, 1), y runs from the tail (0) to the head (1) of the streak.
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
    geometry.setAttribute('aRand', new THREE.InstancedBufferAttribute(rand, 4));
    geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 2));
    geometry.instanceCount = count;
    // The quad says nothing about where the sparks are (the vertex shader places them), so
    // the sphere they stay inside is given by hand: the plume at its furthest lean, the
    // landers' reach, the ash. With it the draw is skipped when the fire is out of view.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 9, 0), 14.5);
    this.geometry = geometry;

    this.uPop = [];
    for (let i = 0; i < POP_SLOTS; i++) this.uPop.push(new THREE.Vector4(0, 1, 0, -100));
    this.uLander = [];
    this.landed = [];
    for (let i = 0; i < LANDERS; i++) { this.uLander.push(new THREE.Vector4(0, 0, -100, 1)); this.landed.push(true); }

    const material = new THREE.ShaderMaterial({
      uniforms: { ...shared, ...fireUniforms, uPop: { value: this.uPop }, uLander: { value: this.uLander } },
      vertexShader: EMBER_VERT,
      fragmentShader: EMBER_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'embers';
    // Drawn after the element's refractive stage rather than with its other particles: a
    // spark is in the hot column, not behind it, so the heat haze must not bend it.
    this.mesh.layers.set(ctx.LAYERS.LATE);

    this.nextPop = 1.5;
    this.popSlot = 0;
    /** Brightness of the most recent pop, decaying: the fire's light jumps with it. */
    this.flash = 0;
  }

  /** level: 0 low, 1 medium, 2 high. */
  setQuality(level) {
    const share = [0.4, 0.7, 1][level] ?? 1;
    this.geometry.instanceCount = this.fixedCount + Math.round(PLUME * share);
  }

  /**
   * @param dt    seconds
   * @param t     seconds since start
   * @param gust  0..1, how hard the wind is fanning the fire
   * @param wind  the plume's lean vector (local xz)
   */
  update(dt, t, gust, wind) {
    const rng = this.rng;

    // A log cracks: pick one, burst a fan of sparks from it. More often when it is gusty.
    this.flash *= Math.exp(-dt * 7);
    if (t >= this.nextPop) {
      const p = this.popPoints[Math.floor(rng() * this.popPoints.length) % this.popPoints.length];
      this.uPop[this.popSlot].set(p.x, p.y, p.z, t);
      this.popSlot = (this.popSlot + 1) % POP_SLOTS;
      this.nextPop = t + (0.7 + 3.6 * rng() * rng()) * (1.25 - 0.7 * gust);
      this.flash = 0.5 + 0.5 * rng();
    }

    // Landers: each rests a while, then takes off toward a new landing point downwind.
    const origin = this.ctx.origin;
    for (let i = 0; i < LANDERS; i++) {
      const f = this.uLander[i];
      const touch = f.z + f.w;
      if (!this.landed[i] && t >= touch) {
        this.landed[i] = true;
        // (a hiss and one small ring on the film)
        this.ctx.ripples.drop(origin.x + f.x, origin.z + f.y, 0.16, 0.012);
      }
      if (this.landed[i] && t > touch + 1.0) {
        const downwind = Math.atan2(wind.y, wind.x) + (rng() - 0.5) * 3.2;
        const r = 2.6 + 5.2 * rng();
        f.set(Math.cos(downwind) * r, Math.sin(downwind) * r, t + 8 * rng(), 5.5 + 4.5 * rng());
        this.landed[i] = false;
      }
    }
  }
}
