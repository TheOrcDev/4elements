import * as THREE from 'three';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FLOW_GLSL, axisAt, radiusAt, CLOUD_Y } from './flow.js';

// Lightning inside the vortex.
//
// Every 6 to 14 seconds a discharge either crawls through the base of the cloud or runs down the
// core of the funnel, sometimes all the way to the water. A strike is a burst of two to
// four strokes a few hundredths of a second apart, each one an instant rise and an exponential
// decay; the strokes share one channel, as real return strokes do. The first is by far the
// strongest, and a continuing current keeps the channel and the scene lit for a few tenths
// of a second after it: long enough for the eye to take in what the flash shows.
//
// What it drives:
//   - the cloud's own light: the volume shader lights the vapour from the line uBoltLo-uBoltHi
//   - a thin jagged filament (this mesh), dimmed by however much cloud hides it, so it is
//     crisp in the rope and only a glow in the wide of the funnel and inside the cloud
//   - shared.uFlash for the rest of the scene, and one point light for the lit materials

const MAX_SEGMENTS = 224;
const CHANNEL_POINTS = 64;          // a power of two (see _wander)

// Intensities are in the units of shared.uFlash.w: the scene's lightning light is 260 times that.
const FIRST_STROKE = [3.2, 3.9];    // peak of the first return stroke
const LATER_STROKE = [0.3, 0.65];   // of each one after it, as a share of the first
const CURRENT = [0.2, 0.28];        // the continuing current, as a share of the first stroke
const CURRENT_DECAY = 0.2;          // and the time it takes to die away, s
const STRIKE_SECONDS = 1.5;         // nothing is left of a strike after this long
// For visitors who ask for less motion a strike is a single stroke that fades gently, with
// no flicker.
const CALM_STROKE = 2.2;
const CALM_DECAY = 0.2;

const VERT = /* glsl */ `
${VERT_PRELUDE}
${FLOW_GLSL}

attribute vec3 aOther;      // the other end of this segment
attribute vec3 aInfo;       // x: side (-1 / +1), y: brightness, z: 0 at this end's start, 1 at its end
uniform vec3 uOrigin;
uniform float uBoltGlow;    // intensity of the current stroke
varying float vSide;
varying float vGlow;
varying float vViewZ;

void main() {
  vec4 clipA = projectionMatrix * viewMatrix * vec4(position + uOrigin, 1.0);
  vec4 clipB = projectionMatrix * viewMatrix * vec4(aOther + uOrigin, 1.0);
  vViewZ = clipA.w;
  if (clipA.w < 0.3 || clipB.w < 0.3 || uBoltGlow <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 d = (clipB.xy / clipB.w - clipA.xy / clipA.w) * uResolution;
  d = length(d) > 1e-4 ? normalize(d) : vec2(1.0, 0.0);
  // A channel a couple of centimetres across, but never so thin that its white core falls
  // between the pixels (the least width follows the size of the picture): bloom does the
  // rest. The side branches are finer than the trunk.
  float px = 0.024 * projectionMatrix[1][1] * uResolution.y * 0.5 / clipA.w;
  float halfW = max(px, max(2.0, uResolution.y / 430.0)) * mix(0.5, 1.0, aInfo.y);
  // aInfo.z flips the sense of d for the vertices that sit at the far end of the segment.
  vec2 normal = vec2(-d.y, d.x) * (1.0 - 2.0 * aInfo.z);
  gl_Position = vec4(clipA.xy + normal * aInfo.x * halfW * 2.0 / uResolution * clipA.w, clipA.zw);
  vSide = aInfo.x;

  // Vapour between the channel and the eye swallows the filament and leaves only its glow.
  vec3 toEye = normalize(cameraPosition - uOrigin - position);
  vec2 q = position.xz - airAxis(position.y, airFoot(uTime), airKink(uTime));
  float veil = exp(-1.8 * airChord(position, q, toEye));
  vGlow = uBoltGlow * aInfo.y * aInfo.y * veil;
}
`;

const FRAG = /* glsl */ `
${FRAG_PRELUDE}
varying float vSide;
varying float vGlow;
varying float vViewZ;

void main() {
  float core = exp(-vSide * vSide * 9.0);
  float halo = exp(-vSide * vSide * 2.2) * 0.25;
  vec3 colour = vec3(0.62, 0.74, 1.0) * halo + vec3(1.0, 0.97, 0.92) * core;
  gl_FragColor = vec4(colour * vGlow * 12.0 * softFade(vViewZ, 0.2), 1.0);
}
`;

export class Lightning {
  /** uniforms: the element's uniform block (needs uOrigin, uBoltLo, uBoltHi). */
  constructor(ctx, uniforms) {
    this.ctx = ctx;
    this.uniforms = uniforms;
    this.rng = ctx.rng(7741);           // where, when and what shape
    this.vary = ctx.rng(7742);          // how strong
    // Whether the visitor has asked for less motion: the app says so if it knows, and
    // otherwise the browser is asked at every strike (the setting can change while we run).
    this.motionQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    // ---- filament mesh: MAX_SEGMENTS quads rewritten in place at the start of each strike ----
    this.positions = new Float32Array(MAX_SEGMENTS * 4 * 3);
    this.others = new Float32Array(MAX_SEGMENTS * 4 * 3);
    this.infos = new Float32Array(MAX_SEGMENTS * 4 * 3);
    const index = new Uint16Array(MAX_SEGMENTS * 6);
    for (let i = 0; i < MAX_SEGMENTS; i++) {
      const v = i * 4;
      index.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], i * 6);
    }
    const geometry = new THREE.BufferGeometry();
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage);
    this.otherAttribute = new THREE.BufferAttribute(this.others, 3).setUsage(THREE.DynamicDrawUsage);
    this.infoAttribute = new THREE.BufferAttribute(this.infos, 3).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', this.positionAttribute);
    geometry.setAttribute('aOther', this.otherAttribute);
    geometry.setAttribute('aInfo', this.infoAttribute);
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
    geometry.setDrawRange(0, 0);
    this.boltUniforms = { ...uniforms, uBoltGlow: { value: 0 } };
    this.mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      uniforms: this.boltUniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }));
    this.mesh.frustumCulled = false;

    // One point light carries the flash to every lit material in the scene.
    this.light = new THREE.PointLight(new THREE.Color(0.62, 0.74, 1.0), 0, 0, 2);
    this.light.position.set(0, 9, 0);

    // ---- strike state ----
    this.nextStrike = 4.0 + this.rng() * 3.0;
    this.strokeTimes = new Float32Array(4);
    this.strokeGains = new Float32Array(4);
    this.strokeCount = 0;
    this.strikeStart = -100;
    this.sinceBefore = 0;               // age of the strike at the update before this one
    this.decay = 0.035;
    this.current = 0;                   // the continuing current at the start of the strike
    this.intensity = 0;
    this.flashLocal = new THREE.Vector3(0, 9, 0);
    this.touchdown = false;             // true for one update when a strike reaches the water
    this.channel = new Float32Array((CHANNEL_POINTS + 1) * 3);
    this.wander = new Float32Array((CHANNEL_POINTS + 1) * 2);
    this.segments = 0;
    this._axis = new THREE.Vector2();
  }

  // Appends one segment (two ends, four vertices) to the filament.
  _segment(ax, ay, az, bx, by, bz, brightness) {
    if (this.segments >= MAX_SEGMENTS) return;
    const o = this.segments * 12;
    const P = this.positions, O = this.others, I = this.infos;
    for (let k = 0; k < 4; k++) {
      const far = k >> 1;               // vertices 2 and 3 sit at b
      const side = (k & 1) * 2 - 1;
      const i = o + k * 3;
      P[i] = far ? bx : ax; P[i + 1] = far ? by : ay; P[i + 2] = far ? bz : az;
      O[i] = far ? ax : bx; O[i + 1] = far ? ay : by; O[i + 2] = far ? az : bz;
      I[i] = side; I[i + 1] = brightness; I[i + 2] = far;
    }
    this.segments++;
  }

  // A side branch: a jagged walk away from the channel that fades and thins as it goes, and
  // now and then forks again.
  _branch(x, y, z, dx, dy, dz, steps, stepLength, brightness, depth) {
    const rng = this.rng;
    for (let i = 0; i < steps; i++) {
      // Keep most of the heading, add a kick: the walk wanders but does not double back.
      dx += (rng() - 0.5) * 1.1; dy += (rng() - 0.5) * 0.9; dz += (rng() - 0.5) * 1.1;
      const n = 1 / Math.max(Math.hypot(dx, dy, dz), 1e-3);
      dx *= n; dy *= n; dz *= n;
      const k = stepLength * (0.6 + 0.8 * rng());
      const nx = x + dx * k, ny = Math.max(y + dy * k, 0.03), nz = z + dz * k;
      const b = brightness * (1 - 0.8 * i / steps);
      this._segment(x, y, z, nx, ny, nz, b);
      x = nx; y = ny; z = nz;
      if (depth < 1 && i > 0 && i < steps - 2 && rng() < 0.22) {
        this._branch(x, y, z, dx + (rng() - 0.5) * 1.6, dy - 0.3, dz + (rng() - 0.5) * 1.6, steps - i - 1, stepLength * 0.8, b * 0.7, depth + 1);
      }
    }
  }

  // Fills this.wander with two jagged paths from 0 to 0 over the channel's points, by
  // midpoint displacement: a real channel meanders at every scale, from the sweep of the
  // whole stroke down to the kinks of a hand's breadth.
  _wander(roughness) {
    const N = CHANNEL_POINTS, W = this.wander, rng = this.rng;
    for (let row = 0; row < 2; row++) {
      const o = row * (N + 1);
      W[o] = 0; W[o + N] = 0;
      let amp = 1;
      for (let span = N; span > 1; span >>= 1) {
        const half = span >> 1;
        for (let i = half; i < N; i += span) W[o + i] = 0.5 * (W[o + i - half] + W[o + i + half]) + (rng() - 0.5) * amp;
        amp *= roughness;
      }
    }
  }

  _strike(t) {
    const rng = this.rng;
    const C = this.channel;
    const W = this.wander;
    const N = CHANNEL_POINTS;
    this.segments = 0;
    this.touchdown = false;
    const lo = this.uniforms.uBoltLo.value;
    const hi = this.uniforms.uBoltHi.value;
    this._wander(0.56);

    let sink;                   // how steeply the side branches head downward
    if (rng() < 0.58) {
      // ---- down the core of the funnel ----
      sink = -0.75;
      const yTop = CLOUD_Y - 0.5 + rng() * 0.7;
      const reachesWater = rng() < 0.4;
      const yEnd = reachesWater ? 0.03 : 1.5 + rng() * 5.5;
      const a0 = rng() * Math.PI * 2;
      const r0 = 0.25 + rng() * 0.55;
      const sx = Math.cos(a0) * r0, sz = Math.sin(a0) * r0;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const y = yTop + (yEnd - yTop) * Math.pow(u, 0.9);
        const axis = axisAt(y, t, this._axis);
        // Jagged, but kept inside the wall.
        const amp = Math.min(1.1 * radiusAt(y), 1.0);
        C[i * 3] = axis.x + sx * (1 - u) + W[i] * amp;
        C[i * 3 + 1] = y;
        C[i * 3 + 2] = axis.y + sz * (1 - u) + W[N + 1 + i] * amp;
      }
      // The volume lights itself from a straight line in axis-relative space.
      hi.set(sx, yTop, sz);
      lo.set(0, yEnd, 0, 0);
      this.touchdown = reachesWater;
    } else {
      // ---- a crawler through the base of the cloud ----
      sink = -0.12;
      const a0 = rng() * Math.PI * 2;
      const half = 2.2 + rng() * 2.0;
      const cx = (rng() - 0.5) * 2.0, cz = (rng() - 0.5) * 2.0;
      const y0 = CLOUD_Y - 0.45 + rng() * 0.5;
      const dx = Math.cos(a0), dz = Math.sin(a0);
      for (let i = 0; i <= N; i++) {
        const u = i / N * 2 - 1;
        C[i * 3] = cx + dx * u * half - dz * W[i] * 1.6;
        C[i * 3 + 1] = y0 + W[N + 1 + i] * 0.6;
        C[i * 3 + 2] = cz + dz * u * half + dx * W[i] * 1.6;
      }
      hi.set(cx + dx * half, y0, cz + dz * half);
      lo.set(cx - dx * half, y0, cz - dz * half, 0);
    }

    for (let i = 0; i < N; i++) {
      this._segment(C[i * 3], C[i * 3 + 1], C[i * 3 + 2], C[i * 3 + 3], C[i * 3 + 4], C[i * 3 + 5], 1);
    }
    // Forks leave the trunk at a slant, in the direction it was travelling.
    const branches = 5 + Math.floor(rng() * 5);
    for (let b = 0; b < branches; b++) {
      const i = 3 + Math.floor(rng() * (N * 0.8));
      const y = C[i * 3 + 1];
      let tx = C[i * 3 + 3] - C[i * 3 - 3], ty = C[i * 3 + 4] - C[i * 3 - 2], tz = C[i * 3 + 5] - C[i * 3 - 1];
      const tn = 1 / Math.max(Math.hypot(tx, ty, tz), 1e-3);
      const a = rng() * Math.PI * 2;
      const steps = 4 + Math.floor(rng() * 5);
      const reach = (0.25 + 0.75 * rng()) * Math.min(0.5 + 0.6 * radiusAt(y), 2.0);
      this._branch(C[i * 3], y, C[i * 3 + 2], tx * tn + Math.cos(a) * 0.9, ty * tn + sink * 0.5, tz * tn + Math.sin(a) * 0.9,
        steps, reach / steps, 0.45 + rng() * 0.3, 0);
    }
    // The brightest stretch, for everything that is lit from outside.
    const m = Math.floor(N * 0.3) * 3;
    this.flashLocal.set(C[m], C[m + 1], C[m + 2]);

    this.positionAttribute.needsUpdate = true;
    this.otherAttribute.needsUpdate = true;
    this.infoAttribute.needsUpdate = true;
    this.mesh.geometry.setDrawRange(0, this.segments * 6);

    // ---- the strokes of this strike ----
    this.strikeStart = t;
    this.sinceBefore = -1;
    this.strokeCount = 2 + Math.floor(rng() * 3);
    this.decay = 0.026 + rng() * 0.016;
    const first = FIRST_STROKE[0] + this.vary() * (FIRST_STROKE[1] - FIRST_STROKE[0]);
    // (the current is flowing from the start: stroke and current together peak at `first`)
    this.current = first * (CURRENT[0] + this.vary() * (CURRENT[1] - CURRENT[0]));
    let at = 0;
    for (let i = 0; i < this.strokeCount; i++) {
      this.strokeTimes[i] = at;
      this.strokeGains[i] = i === 0 ? first - this.current : first * (LATER_STROKE[0] + rng() * (LATER_STROKE[1] - LATER_STROKE[0]));
      at += 0.035 + rng() * 0.045;
    }
    // (settled only now, after the dice are thrown: the storm keeps the same timetable either way)
    if (this._calm()) {
      this.strokeCount = 1;
      this.strokeGains[0] = CALM_STROKE;
      this.decay = CALM_DECAY;
      this.current = 0;
    }
    this.nextStrike = t + 6 + rng() * 8;
  }

  // True when a strike has to do without its flicker.
  _calm() {
    const asked = this.ctx.reducedMotion;
    return typeof asked === 'boolean' ? asked : !!(this.motionQuery && this.motionQuery.matches);
  }

  /** Advances the schedule and writes every uniform and light the flash drives. */
  update(t) {
    if (t >= this.nextStrike) this._strike(t);

    let intensity = 0;
    const since = t - this.strikeStart;
    if (since >= 0 && since < STRIKE_SECONDS) {
      // A stroke stands at its full height for the frame in which it begins, wherever in that
      // frame it began: how bright a strike looks does not depend on how the frames fall.
      for (let i = 0; i < this.strokeCount; i++) {
        const x = since - this.strokeTimes[i];
        if (x >= 0) intensity += this.strokeGains[i] * (this.strokeTimes[i] > this.sinceBefore ? 1 : Math.exp(-x / this.decay));
      }
      // (the strokes share one channel: two of them in one long frame are no brighter than the first)
      intensity = Math.min(intensity, this.strokeGains[0]) + this.current * Math.exp(-since / CURRENT_DECAY);
      if (intensity < 0.003) intensity = 0;
    }
    this.sinceBefore = since;
    this.intensity = intensity;

    this.uniforms.uBoltLo.value.w = intensity;
    this.boltUniforms.uBoltGlow.value = intensity;
    this.mesh.visible = intensity > 0;
    const origin = this.uniforms.uOrigin.value;
    const f = this.flashLocal;
    this.ctx.shared.uFlash.value.set(origin.x + f.x, origin.y + f.y, origin.z + f.z, intensity);
    this.light.position.copy(f);
    this.light.intensity = intensity * 260;
  }
}
