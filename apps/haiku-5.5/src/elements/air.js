import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { NOISE_GLSL } from '../shared/glsl.js';
import { createGlowTexture } from '../shared/sprites.js';
import { createRandom, range } from '../shared/random.js';

/**
 * Air: wind made visible.
 *
 * About a thousand streamlines are traced once on the CPU through a
 * divergence-free flow (an axisymmetric updraft-and-swirl vortex plus curl
 * noise). They are drawn as screen-space ribbons in a single draw call, and a
 * shader sends light pulses travelling along each path. Soft haze sprites and
 * small motes add volume, all over a pale sky dome.
 */

// --- flow field --------------------------------------------------------------
// The vortex comes from the Stokes stream function psi = A e^(-K y) R^2 ln(1 + r^2 / R^2):
// an updraft that is strongest on the axis and widens with height like a trumpet.
// Any swirl v_theta(r, y) keeps it divergence-free; ours is proportional to the
// updraft so every stream surface has a steady pitch. Curl noise (also
// divergence-free) is scaled with the same e^(-K y) so it bends lines evenly.
const UPDRAFT = 0.35;
const FUNNEL_K = 0.42;
const UPDRAFT_RADIUS = 1.2;
const TWIST = 1.25;
const TWIST_CORE = 0.18;
const NOISE_STRENGTH = 0.16;
const NOISE_FREQUENCY = 0.38;
const NOISE_OFFSETS = [
  [11.3, 4.7, 27.1],
  [-31.9, 17.2, 5.3],
  [7.7, -23.4, 41.6],
];
const NOISE_GRID_MIN = new THREE.Vector3(-5, -3.2, -5);
const NOISE_GRID_MAX = new THREE.Vector3(5, 3.8, 5);
const NOISE_GRID_RES = [40, 28, 40];

// --- streamlines -------------------------------------------------------------
const RANDOM_SEED = 20261007;
const LINE_COUNT = 1000;
const POINTS_PER_LINE = 150;
const STEP = 0.06;
const MIN_POINTS = 36;
const Y_MIN = -2.1;
const Y_MAX = 2.7;
const R_MAX = 3.5;
const R_FADE = 2.1; // lines fade out between R_FADE and R_MAX
const SEED_R_MAX = 2.8;
// Seeds sit on stream surfaces S = e^(-K y) ln(1 + r^2 / R^2); this range spans
// the inner column (flares high) to the outer currents (flare near the base).
const STREAM_LEVEL_MIN = 0.09;
const STREAM_LEVEL_MAX = 0.9;

// --- look --------------------------------------------------------------------
// Sky colours are scene-linear values chosen so that, after EXPOSURE and ACES,
// they land on a soft slate-blue top and a clear cyan base while staying under
// the bloom threshold. Only the light in the streamlines blooms. Line hues are
// saturated so they keep their colour after exposure and tone mapping.
const EXPOSURE = 1.8;
const SKY_TOP = new THREE.Color('#425270');
const SKY_HORIZON = new THREE.Color('#6883a8');
const SKY_BOTTOM = new THREE.Color('#70bae6');
const SKY_GLOW = new THREE.Color('#fff4e8');
const SKY_GLOW_DIR = new THREE.Vector3(-0.55, 0.32, -0.77).normalize();
const LINE_CYAN = new THREE.Color('#3fcfff');
const LINE_LAVENDER = new THREE.Color('#9a80ff');
const LINE_WHITE = new THREE.Color('#f0fcff');
const HAZE_COLOR = new THREE.Color('#c6dcec');
const MOTE_COLOR = new THREE.Color('#eafcff');
const VORTEX_SPIN = 0.05; // radians per second
const GUST_RATE = 0.52; // radians per second, a period of about 12 s

const HAZE_COUNT = 180;
const MOTE_COUNT = 800;

// --- camera ------------------------------------------------------------------
const CAMERA_TARGET = new THREE.Vector3(0, 0.05, 0);
const CAMERA_OFFSET = new THREE.Vector3(0.5, 0.8, 6.5);
// Desktop sits a little back so both the root and the flare clear the UI;
// narrow (portrait) windows step back further so the fan still fits.
const CAMERA_PULL_MIN = 1.12;
const CAMERA_PULL_MAX = 1.6;
// Camera distance at which ribbon widths and mote sizes are drawn as specified.
const REFERENCE_DEPTH = 7.3;

// A slow, broad gust shared by the threads and the motes: the vortex leans and
// its flare breathes, more strongly with height.
const GUST_GLSL = /* glsl */ `
  vec3 gust(vec3 p, float t) {
    float lift = smoothstep(${Y_MIN.toFixed(3)}, ${Y_MAX.toFixed(3)}, p.y);
    float phase = t * ${GUST_RATE.toFixed(3)};
    vec2 lean = mix(0.05, 0.15, lift) * vec2(sin(phase + p.y * 0.35), cos(phase * 0.83 + p.y * 0.3 + 1.3));
    float breathe = 0.06 * lift * sin(phase * 0.7 + 0.8);
    return vec3(p.x * breathe + lean.x, 0.0, p.z * breathe + lean.y);
  }
`;

// Landscape layouts put the title and blurb top left and the toolbar top right,
// so strands and motes fade out in those corners of the screen.
const CORNER_FADE_GLSL = /* glsl */ `
  float cornerFade(vec4 clip, vec2 resolution) {
    vec2 ndc = clip.xy / max(clip.w, 1e-3);
    float landscape = smoothstep(1.0, 1.4, resolution.x / max(resolution.y, 1.0));
    return 1.0 - landscape * smoothstep(0.25, 0.4, abs(ndc.x)) * smoothstep(0.35, 0.55, ndc.y);
  }
`;

/** @param {import('./index.js').ElementContext} ctx @returns {import('./index.js').ElementScene} */
export function createAir(ctx) {
  const random = createRandom(RANDOM_SEED);
  const root = new THREE.Group();
  const vortex = new THREE.Group();
  root.add(vortex);

  const time = { value: 0 };
  const resolution = { value: ctx.renderer.getDrawingBufferSize(new THREE.Vector2()) };
  const pixelRatio = { value: ctx.pixelRatio };

  const sky = createSky(time);
  root.add(sky);

  const streamlines = createStreamlines(random, time, resolution, pixelRatio);
  vortex.add(streamlines);

  const glowTexture = createGlowTexture(128);
  const haze = createHaze(random, time, glowTexture);
  vortex.add(haze);

  const motes = createMotes(random, time, resolution, pixelRatio);
  vortex.add(motes);

  const aspect = ctx.camera.aspect || 1.6;
  const pullBack = THREE.MathUtils.clamp(Math.sqrt(1.1 / aspect), CAMERA_PULL_MIN, CAMERA_PULL_MAX);
  const target = CAMERA_TARGET.clone();
  const position = CAMERA_OFFSET.clone().multiplyScalar(pullBack).add(target);

  return {
    root,
    update(t) {
      time.value = t;
      vortex.rotation.y = -t * VORTEX_SPIN;
    },
    dispose() {
      for (const object of [sky, streamlines, haze, motes]) {
        object.geometry.dispose();
        object.material.dispose();
      }
      glowTexture.dispose();
    },
    onResize() {
      ctx.renderer.getDrawingBufferSize(resolution.value);
    },
    camera: { position, target },
    look: {
      background: null,
      environment: null,
      fog: null,
      exposure: EXPOSURE,
      bloom: { strength: 0.38, radius: 0.3, threshold: 0.85 },
    },
    controls: {
      minDistance: 3,
      maxDistance: 14,
      maxPolarAngle: Math.PI * 0.68,
    },
  };
}

// --- flow field ----------------------------------------------------------------

/**
 * Curl of a 3-component ImprovedNoise potential, baked onto a grid once and
 * sampled trilinearly, so streamline integration stays fast.
 */
function createCurlNoise() {
  const noise = new ImprovedNoise();
  const [nx, ny, nz] = NOISE_GRID_RES;
  const hx = (NOISE_GRID_MAX.x - NOISE_GRID_MIN.x) / (nx - 1);
  const hy = (NOISE_GRID_MAX.y - NOISE_GRID_MIN.y) / (ny - 1);
  const hz = (NOISE_GRID_MAX.z - NOISE_GRID_MIN.z) / (nz - 1);
  const index = (i, j, k) => (k * ny + j) * nx + i;
  const potentialScale = (NOISE_STRENGTH * UPDRAFT) / NOISE_FREQUENCY;

  const potential = new Float32Array(nx * ny * nz * 3);
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const x = (NOISE_GRID_MIN.x + i * hx) * NOISE_FREQUENCY;
        const y = (NOISE_GRID_MIN.y + j * hy) * NOISE_FREQUENCY;
        const z = (NOISE_GRID_MIN.z + k * hz) * NOISE_FREQUENCY;
        const amplitude = potentialScale * Math.exp(-FUNNEL_K * (NOISE_GRID_MIN.y + j * hy));
        const n = index(i, j, k) * 3;
        for (let c = 0; c < 3; c++) {
          const o = NOISE_OFFSETS[c];
          potential[n + c] = amplitude * noise.noise(x + o[0], y + o[1], z + o[2]);
        }
      }
    }
  }

  // Central differences (one-sided at the borders) give the curl at each node.
  const velocity = new Float32Array(nx * ny * nz * 3);
  for (let k = 0; k < nz; k++) {
    const k0 = Math.max(k - 1, 0);
    const k1 = Math.min(k + 1, nz - 1);
    const dz = (k1 - k0) * hz;
    for (let j = 0; j < ny; j++) {
      const j0 = Math.max(j - 1, 0);
      const j1 = Math.min(j + 1, ny - 1);
      const dy = (j1 - j0) * hy;
      for (let i = 0; i < nx; i++) {
        const i0 = Math.max(i - 1, 0);
        const i1 = Math.min(i + 1, nx - 1);
        const dx = (i1 - i0) * hx;
        const px0 = index(i0, j, k) * 3;
        const px1 = index(i1, j, k) * 3;
        const py0 = index(i, j0, k) * 3;
        const py1 = index(i, j1, k) * 3;
        const pz0 = index(i, j, k0) * 3;
        const pz1 = index(i, j, k1) * 3;
        const dPzdy = (potential[py1 + 2] - potential[py0 + 2]) / dy;
        const dPydz = (potential[pz1 + 1] - potential[pz0 + 1]) / dz;
        const dPxdz = (potential[pz1] - potential[pz0]) / dz;
        const dPzdx = (potential[px1 + 2] - potential[px0 + 2]) / dx;
        const dPydx = (potential[px1 + 1] - potential[px0 + 1]) / dx;
        const dPxdy = (potential[py1] - potential[py0]) / dy;
        const n = index(i, j, k) * 3;
        velocity[n] = dPzdy - dPydz;
        velocity[n + 1] = dPxdz - dPzdx;
        velocity[n + 2] = dPydx - dPxdy;
      }
    }
  }

  /** Adds the interpolated curl-noise velocity at (x, y, z) to `out`. */
  return function addCurlNoise(x, y, z, out) {
    const gx = THREE.MathUtils.clamp((x - NOISE_GRID_MIN.x) / hx, 0, nx - 1.001);
    const gy = THREE.MathUtils.clamp((y - NOISE_GRID_MIN.y) / hy, 0, ny - 1.001);
    const gz = THREE.MathUtils.clamp((z - NOISE_GRID_MIN.z) / hz, 0, nz - 1.001);
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const k = Math.floor(gz);
    const tx = gx - i;
    const ty = gy - j;
    const tz = gz - k;
    const n000 = index(i, j, k) * 3;
    const n100 = n000 + 3;
    const n010 = index(i, j + 1, k) * 3;
    const n110 = n010 + 3;
    const n001 = index(i, j, k + 1) * 3;
    const n101 = n001 + 3;
    const n011 = index(i, j + 1, k + 1) * 3;
    const n111 = n011 + 3;
    for (let c = 0; c < 3; c++) {
      const a = velocity[n000 + c] + (velocity[n100 + c] - velocity[n000 + c]) * tx;
      const b = velocity[n010 + c] + (velocity[n110 + c] - velocity[n010 + c]) * tx;
      const d = velocity[n001 + c] + (velocity[n101 + c] - velocity[n001 + c]) * tx;
      const e = velocity[n011 + c] + (velocity[n111 + c] - velocity[n011 + c]) * tx;
      const front = a + (b - a) * ty;
      const back = d + (e - d) * ty;
      out[c] += front + (back - front) * tz;
    }
  };
}

/** Builds the full wind velocity sampler: vortex updraft + swirl + curl noise. */
function createFlowField() {
  const addCurlNoise = createCurlNoise();
  const radius2 = UPDRAFT_RADIUS * UPDRAFT_RADIUS;

  /** Writes the velocity at (x, y, z) into `out` ([vx, vy, vz]). */
  return function flow(x, y, z, out) {
    const r2 = x * x + z * z;
    const r = Math.sqrt(r2);
    const q = r2 / radius2;
    const axial = UPDRAFT * Math.exp(-FUNNEL_K * y);
    const profile = 1 / (1 + q);
    // ln(1 + q) / q tends to 1 on the axis.
    const spread = q > 1e-5 ? Math.log1p(q) / q : 1 - q * 0.5;
    const radialOverR = FUNNEL_K * axial * spread;
    const swirlOverR = (2 * TWIST * axial * Math.sqrt(profile)) / (r + TWIST_CORE);

    out[0] = radialOverR * x - swirlOverR * z;
    out[1] = 2 * axial * profile;
    out[2] = radialOverR * z + swirlOverR * x;
    addCurlNoise(x, y, z, out);
  };
}

/**
 * Traces one streamline with RK4 on the normalised velocity, so points are
 * spaced evenly in arc length. Writes up to `maxPoints` xyz triples into
 * `points`, stepping by `step` (negative = upstream). The seed itself is not
 * written. Returns the number of points written.
 */
function traceStreamline(flow, seed, step, maxPoints, points, scratch) {
  const { k1, k2, k3, k4 } = scratch;
  let x = seed[0];
  let y = seed[1];
  let z = seed[2];
  let written = 0;

  const direction = (px, py, pz, out) => {
    flow(px, py, pz, out);
    const len = Math.hypot(out[0], out[1], out[2]);
    if (len < 1e-5) return false;
    out[0] /= len;
    out[1] /= len;
    out[2] /= len;
    return true;
  };

  while (written < maxPoints) {
    if (!direction(x, y, z, k1)) break;
    const h = step * 0.5;
    if (!direction(x + k1[0] * h, y + k1[1] * h, z + k1[2] * h, k2)) break;
    if (!direction(x + k2[0] * h, y + k2[1] * h, z + k2[2] * h, k3)) break;
    if (!direction(x + k3[0] * step, y + k3[1] * step, z + k3[2] * step, k4)) break;
    x += (step / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    y += (step / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    z += (step / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    if (y < Y_MIN || y > Y_MAX || x * x + z * z > R_MAX * R_MAX) break;
    const o = written * 3;
    points[o] = x;
    points[o + 1] = y;
    points[o + 2] = z;
    written++;
  }
  return written;
}

/** Radius of stream surface `level` at height y (may be Infinity once it has flared out). */
function streamSurfaceRadius(level, y) {
  return UPDRAFT_RADIUS * Math.sqrt(Math.expm1(level * Math.exp(FUNNEL_K * y)));
}

/**
 * Picks a seed point on a random stream surface, inside the visible volume.
 * Returns how far out that surface is: 0 = innermost column, 1 = outermost.
 */
function pickSeed(random, out) {
  let radius = Infinity;
  let y = 0;
  let level = 0;
  while (radius > SEED_R_MAX) {
    level = range(random, STREAM_LEVEL_MIN, STREAM_LEVEL_MAX);
    y = range(random, Y_MIN + 0.1, Y_MAX - 0.3);
    radius = streamSurfaceRadius(level, y);
  }
  const angle = random() * Math.PI * 2;
  out[0] = Math.cos(angle) * radius;
  out[1] = y;
  out[2] = Math.sin(angle) * radius;
  return (level - STREAM_LEVEL_MIN) / (STREAM_LEVEL_MAX - STREAM_LEVEL_MIN);
}

/** Traces every streamline. Returns { points: Float32Array, outerness: number } per line. */
function traceAllStreamlines(random) {
  const flow = createFlowField();
  const scratch = { k1: [0, 0, 0], k2: [0, 0, 0], k3: [0, 0, 0], k4: [0, 0, 0] };
  const seed = [0, 0, 0];
  const upstream = new Float32Array(POINTS_PER_LINE * 3);
  const downstream = new Float32Array(POINTS_PER_LINE * 3);
  const lines = [];
  const maxAttempts = LINE_COUNT * 4;

  for (let attempt = 0; attempt < maxAttempts && lines.length < LINE_COUNT; attempt++) {
    const outerness = pickSeed(random, seed);
    const half = Math.floor(POINTS_PER_LINE / 2);
    const back = traceStreamline(flow, seed, -STEP, half, upstream, scratch);
    const forward = traceStreamline(flow, seed, STEP, POINTS_PER_LINE - 1 - back, downstream, scratch);
    const count = back + 1 + forward;
    if (count < MIN_POINTS) continue;

    const points = new Float32Array(count * 3);
    for (let i = 0; i < back; i++) {
      const from = (back - 1 - i) * 3;
      points.set(upstream.subarray(from, from + 3), i * 3);
    }
    points.set(seed, back * 3);
    points.set(downstream.subarray(0, forward * 3), (back + 1) * 3);
    lines.push({ points, outerness });
  }
  return lines;
}

// --- streamline ribbons ------------------------------------------------------------

/**
 * Hue class for one line: 0 cyan, 1 lavender, 2 white (about 40/30/30 overall).
 * Lavender favours the outer surfaces, which sit over the slate-blue upper sky.
 */
function pickHue(random, outerness) {
  const roll = random();
  const lavender = 0.1 + 0.45 * outerness;
  if (roll < lavender) return 1;
  if (roll < lavender + 0.3) return 2;
  return 0;
}

/**
 * One geometry for all lines: each point becomes two vertices (side -1 / +1)
 * that the vertex shader pushes apart in screen space.
 */
function createStreamlines(random, time, resolution, pixelRatio) {
  const lines = traceAllStreamlines(random);
  let vertexCount = 0;
  let indexCount = 0;
  for (const { points } of lines) {
    const n = points.length / 3;
    vertexCount += n * 2;
    indexCount += (n - 1) * 6;
  }

  const positions = new Float32Array(vertexCount * 3);
  const tangents = new Float32Array(vertexCount * 3);
  const lineData = new Float32Array(vertexCount * 4); // side, arc length, u, seed
  const pulseData = new Float32Array(vertexCount * 4); // speed, spacing, brightness, hue
  const indices = new Uint32Array(indexCount);

  let v = 0;
  let w = 0;
  for (const { points, outerness } of lines) {
    const n = points.length / 3;
    const seed = random();
    const speed = range(random, 0.7, 1.35);
    const spacing = range(random, 8, 18);
    // The inner column glows brightest; within it most lines stay faint and a
    // few carry bright pulses.
    const brightness = (1 - 0.55 * outerness) * (0.12 + 0.88 * Math.pow(random(), 4));
    const hue = pickHue(random, outerness);
    const first = v;

    for (let i = 0; i < n; i++) {
      const prev = Math.max(i - 1, 0) * 3;
      const next = Math.min(i + 1, n - 1) * 3;
      let tx = points[next] - points[prev];
      let ty = points[next + 1] - points[prev + 1];
      let tz = points[next + 2] - points[prev + 2];
      const len = Math.hypot(tx, ty, tz) || 1;
      tx /= len;
      ty /= len;
      tz /= len;

      for (let side = -1; side <= 1; side += 2) {
        positions.set(points.subarray(i * 3, i * 3 + 3), v * 3);
        tangents[v * 3] = tx;
        tangents[v * 3 + 1] = ty;
        tangents[v * 3 + 2] = tz;
        lineData[v * 4] = side;
        lineData[v * 4 + 1] = i * STEP;
        lineData[v * 4 + 2] = i / (n - 1);
        lineData[v * 4 + 3] = seed;
        pulseData[v * 4] = speed;
        pulseData[v * 4 + 1] = spacing;
        pulseData[v * 4 + 2] = brightness;
        pulseData[v * 4 + 3] = hue;
        v++;
      }
    }

    for (let i = 0; i < n - 1; i++) {
      const a = first + i * 2;
      // Counter-clockwise on screen, given how the shader offsets each side.
      indices[w++] = a;
      indices[w++] = a + 2;
      indices[w++] = a + 1;
      indices[w++] = a + 1;
      indices[w++] = a + 2;
      indices[w++] = a + 3;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aTangent', new THREE.BufferAttribute(tangents, 3));
  geometry.setAttribute('aLine', new THREE.BufferAttribute(lineData, 4));
  geometry.setAttribute('aPulse', new THREE.BufferAttribute(pulseData, 4));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uResolution: resolution,
      uPixelRatio: pixelRatio,
      uCyan: { value: LINE_CYAN },
      uLavender: { value: LINE_LAVENDER },
      uWhite: { value: LINE_WHITE },
    },
    defines: {
      BASE_HALF_WIDTH: '0.9',
      HEAD_HALF_WIDTH: '1.6',
      MIN_HALF_WIDTH: '1.1',
      TRACE_ALPHA: '0.018',
      HEAD_INTENSITY: '2.0',
      BODY_COVER: '2.5',
      BODY_LEVEL: '0.9',
      HEAD_LENGTH: '0.12',
      TAIL_LENGTH: '2.0',
      SWAY: '0.05',
      REFERENCE_DEPTH: REFERENCE_DEPTH.toFixed(3),
      Y_MIN: Y_MIN.toFixed(3),
      Y_MAX: Y_MAX.toFixed(3),
      R_FADE: R_FADE.toFixed(3),
      R_MAX: R_MAX.toFixed(3),
    },
    vertexShader:
      GUST_GLSL +
      CORNER_FADE_GLSL +
      /* glsl */ `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uPixelRatio;
      uniform vec3 uCyan;
      uniform vec3 uLavender;
      uniform vec3 uWhite;
      attribute vec3 aTangent;
      attribute vec4 aLine;
      attribute vec4 aPulse;
      varying float vSide;
      varying vec3 vLight;
      varying float vCover;

      // Slow, smooth breathing of the threads so the lines never look frozen.
      vec3 sway(vec3 p, float seed) {
        float t = uTime * 0.35;
        return SWAY * vec3(
          sin(p.y * 1.7 + t + seed * 6.283),
          sin(p.x * 1.3 + p.z * 1.1 + t * 0.8),
          cos(p.y * 1.5 - t * 1.1 + seed * 4.0)
        );
      }

      void main() {
        float side = aLine.x;
        float arc = aLine.y;
        float u = aLine.z;
        float seed = aLine.w;

        vec3 p = position + sway(position, seed) + gust(position, uTime);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        vec4 clip = projectionMatrix * mvPosition;
        vec4 clipAhead = projectionMatrix * modelViewMatrix * vec4(p + aTangent * 0.06, 1.0);

        // Screen-space direction of the line, then its perpendicular.
        vec2 screen = clip.xy / max(clip.w, 1e-3) * uResolution;
        vec2 screenAhead = clipAhead.xy / max(clipAhead.w, 1e-3) * uResolution;
        vec2 dir = screenAhead - screen;
        float dirLength = length(dir);
        dir = dirLength > 1e-4 ? dir / dirLength : vec2(1.0, 0.0);
        vec2 normal = vec2(-dir.y, dir.x);

        // Light pulse: soft head, exponential tail behind it.
        float behind = fract(seed * 7.13 + (uTime * aPulse.x - arc) / aPulse.y) * aPulse.y;
        float pulse = smoothstep(0.0, HEAD_LENGTH, behind) * exp(-max(behind - HEAD_LENGTH, 0.0) / TAIL_LENGTH);

        // Gentle surges of brightness rolling up the vortex.
        float surge = 0.6 + 0.4 * sin(position.y * 1.1 - uTime * 0.8 + seed * 2.0);
        float ends = smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.8, 1.0, u));
        // The root fades in well above Y_MIN, and the upper flare fades before
        // it reaches the title and toolbar.
        float radius = length(position.xz);
        float bounds = (1.0 - smoothstep(R_FADE, R_MAX, radius))
          * (1.0 - smoothstep(1.6, 2.6, radius) * smoothstep(1.0, 2.0, position.y))
          * smoothstep(Y_MIN + 0.6, Y_MIN + 1.4, position.y)
          * (1.0 - smoothstep(Y_MAX - 1.3, Y_MAX, position.y));
        // Every line squeezes through the narrow base, so thin the light out there.
        float crowd = mix(0.75, 1.0, smoothstep(Y_MIN + 0.6, 0.0, position.y));

        // Depth layering: how far behind the axis a point sits, in units of the
        // local radius (-1 front, +1 back). Back strands turn dim, wide and soft.
        float depth = max(-mvPosition.z, 0.1);
        float axisDepth = -(modelViewMatrix * vec4(0.0, p.y, 0.0, 1.0)).z;
        float farness = smoothstep(-0.2, 0.6, (depth - axisDepth) / max(radius, 0.25));
        float defocus = mix(1.0, 1.8, farness);
        float nearFade = smoothstep(1.5, 3.5, depth);

        // Never draw a ribbon under about 2 px wide (the composer has no MSAA);
        // a thinner one is drawn at that width and dimmed to keep its coverage.
        float perspective = clamp(REFERENCE_DEPTH / depth, 0.6, 1.4);
        float halfWidth = (BASE_HALF_WIDTH + HEAD_HALF_WIDTH * pulse) * perspective * defocus * uPixelRatio;
        float drawnHalfWidth = max(halfWidth, MIN_HALF_WIDTH * uPixelRatio);
        clip.xy += normal * side * drawnHalfWidth * 2.0 / uResolution * clip.w;
        gl_Position = clip;

        // Colour: each line has its own hue (cyan, lavender or white). The head
        // adds hot, lightly tinted light. Behind it the body lays its hue over
        // the sky, partly covering it, because added light alone washes out to
        // white against the pale sky after tone mapping.
        vec3 hue = aPulse.w < 0.5 ? uCyan : (aPulse.w < 1.5 ? uLavender : uWhite);
        float tailT = clamp((behind - HEAD_LENGTH) / (2.0 * TAIL_LENGTH), 0.0, 1.0);
        float head = 1.0 - smoothstep(0.0, 0.12, tailT);
        float strength = pulse * surge * aPulse.z * sqrt(crowd);
        vec3 headLight = mix(uWhite, hue, 0.3) * HEAD_INTENSITY * strength * head;
        vec3 trace = hue * TRACE_ALPHA * (0.4 + aPulse.z) * crowd * (1.0 - 0.95 * farness);
        float fade = ends * bounds * cornerFade(clip, uResolution) * nearFade * mix(1.0, 0.15, farness)
          * (halfWidth / drawnHalfWidth) / defocus;
        float cover = clamp(BODY_COVER * strength * (1.0 - head) * fade, 0.0, 0.8);

        vSide = side;
        vLight = (headLight + trace) * fade + hue * BODY_LEVEL * cover;
        vCover = cover;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vSide;
      varying vec3 vLight;
      varying float vCover;

      // Premultiplied: vLight is added, and vCover of the sky behind is replaced.
      void main() {
        float edge = 1.0 - abs(vSide);
        float profile = edge * edge * (3.0 - 2.0 * edge);
        gl_FragColor = vec4(clamp(vLight * profile, 0.0, 16.0), clamp(vCover * profile, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return mesh;
}

// --- sky ------------------------------------------------------------------------------

function createSky(time) {
  const geometry = new THREE.SphereGeometry(80, 48, 24);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uTop: { value: SKY_TOP },
      uHorizon: { value: SKY_HORIZON },
      uBottom: { value: SKY_BOTTOM },
      uGlow: { value: SKY_GLOW },
      uGlowDir: { value: SKY_GLOW_DIR },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vDirection = world.xyz - cameraPosition;
        gl_Position = projectionMatrix * viewMatrix * world;
        gl_Position.z = gl_Position.w;
      }
    `,
    fragmentShader:
      NOISE_GLSL +
      /* glsl */ `
      uniform float uTime;
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uBottom;
      uniform vec3 uGlow;
      uniform vec3 uGlowDir;
      varying vec3 vDirection;

      void main() {
        vec3 dir = normalize(vDirection);
        float h = dir.y;
        vec3 color = mix(uBottom, uHorizon, smoothstep(-0.38, -0.02, h));
        color = mix(color, uTop, smoothstep(-0.04, 0.34, h));

        // Soft daylight haze from one side of the sky.
        float sun = max(dot(dir, uGlowDir), 0.0);
        color += uGlow * (0.05 * pow(sun, 4.0) + 0.04 * pow(sun, 24.0));

        // Faint high wisps, stretched along the horizon and drifting slowly.
        vec3 q = vec3(dir.x * 1.4, dir.y * 4.5, dir.z * 1.4) + vec3(uTime * 0.012, 0.0, uTime * 0.007);
        float wisps = smoothstep(0.05, 0.75, 0.65 * snoise(q) + 0.35 * snoise(q * 2.3 + 4.1));
        color += uHorizon * (0.22 * wisps * smoothstep(-0.25, 0.2, h));

        gl_FragColor = vec4(min(color, vec3(4.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;
  return mesh;
}

// --- haze ------------------------------------------------------------------------------

/** Very soft, low-alpha billboards drifting around the vortex for a sense of volume. */
function createHaze(random, time, glowTexture) {
  const quad = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = quad.index;
  geometry.setAttribute('position', quad.getAttribute('position'));
  geometry.setAttribute('uv', quad.getAttribute('uv'));
  geometry.instanceCount = HAZE_COUNT;

  const centers = new Float32Array(HAZE_COUNT * 4); // xyz, size
  const phases = new Float32Array(HAZE_COUNT * 2); // phase, drift
  for (let i = 0; i < HAZE_COUNT; i++) {
    const angle = random() * Math.PI * 2;
    // Kept off the narrow root, where every streamline already crowds together.
    const y = range(random, -1.0, 3.0);
    const radius = range(random, 0.2, 1.0) * Math.min(streamSurfaceRadius(0.9, y), 3.8);
    centers[i * 4] = Math.cos(angle) * radius;
    centers[i * 4 + 1] = y;
    centers[i * 4 + 2] = Math.sin(angle) * radius;
    centers[i * 4 + 3] = range(random, 0.9, 2.2);
    phases[i * 2] = random();
    phases[i * 2 + 1] = random();
  }
  geometry.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 4));
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 2));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uMap: { value: glowTexture },
      uColor: { value: HAZE_COLOR },
    },
    defines: { HAZE_ALPHA: '0.05' },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute vec4 aCenter;
      attribute vec2 aPhase;
      varying vec2 vUv;
      varying float vAlpha;

      void main() {
        float phase = aPhase.x * 6.283;
        float angle = uTime * (0.04 + 0.05 * aPhase.y);
        float c = cos(angle);
        float s = sin(angle);
        vec3 center = aCenter.xyz;
        // Turn the same way as the wind.
        center.xz = vec2(c * center.x - s * center.z, s * center.x + c * center.z);
        center.y += 0.18 * sin(uTime * 0.21 + phase);

        float breathe = 1.0 + 0.15 * sin(uTime * 0.33 + phase);
        vec4 mvPosition = modelViewMatrix * vec4(center, 1.0);
        mvPosition.xy += position.xy * aCenter.w * breathe;
        gl_Position = projectionMatrix * mvPosition;

        vUv = uv;
        vAlpha = HAZE_ALPHA * (0.65 + 0.35 * sin(uTime * 0.4 + phase * 2.0));
        vAlpha *= smoothstep(1.2, 3.5, -mvPosition.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vAlpha;

      void main() {
        float a = texture2D(uMap, vUv).a;
        gl_FragColor = vec4(uColor, clamp(a * a * vAlpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  quad.dispose();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return mesh;
}

// --- motes ------------------------------------------------------------------------------

/** Tiny bright specks riding the vortex: each one rises along a stream surface, following its helix. */
function createMotes(random, time, resolution, pixelRatio) {
  const data = new Float32Array(MOTE_COUNT * 4); // stream level, angle, height phase, seed
  for (let i = 0; i < MOTE_COUNT; i++) {
    data[i * 4] = range(random, STREAM_LEVEL_MIN, STREAM_LEVEL_MAX * 0.8);
    data[i * 4 + 1] = random() * Math.PI * 2;
    data[i * 4 + 2] = random();
    data[i * 4 + 3] = random();
  }
  const geometry = new THREE.BufferGeometry();
  // Positions are computed in the shader; this attribute only sets the vertex count.
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOTE_COUNT * 3), 3));
  geometry.setAttribute('aMote', new THREE.BufferAttribute(data, 4));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uResolution: resolution,
      uPixelRatio: pixelRatio,
      uColor: { value: MOTE_COLOR },
    },
    defines: {
      Y_BOTTOM: Y_MIN.toFixed(3),
      Y_TOP: (Y_MAX - 0.4).toFixed(3),
      FUNNEL_K: FUNNEL_K.toFixed(3),
      UPDRAFT_RADIUS: UPDRAFT_RADIUS.toFixed(3),
      TWIST: TWIST.toFixed(3),
      TWIST_CORE: TWIST_CORE.toFixed(3),
      R_FADE: R_FADE.toFixed(3),
      R_MAX: R_MAX.toFixed(3),
      HELIX_STEPS: '8',
      MIN_POINT_SIZE: '3.2',
      REFERENCE_DEPTH: REFERENCE_DEPTH.toFixed(3),
    },
    vertexShader:
      GUST_GLSL +
      CORNER_FADE_GLSL +
      /* glsl */ `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uPixelRatio;
      attribute vec4 aMote;
      varying float vAlpha;

      // Same stream-surface radius as the CPU tracer, capped before it explodes.
      float surfaceRadius(float level, float y) {
        float e = min(level * exp(FUNNEL_K * y), 2.6);
        return UPDRAFT_RADIUS * sqrt(max(exp(e) - 1.0, 0.0));
      }

      // Angle the swirl carries a parcel through while it rises from Y_BOTTOM to
      // y on this surface, using the tracer's pitch:
      // dtheta/dy = TWIST sqrt(1 + r^2 / R^2) / (r + TWIST_CORE).
      float helixAngle(float level, float y) {
        float h = (y - Y_BOTTOM) / float(HELIX_STEPS);
        float angle = 0.0;
        for (int i = 0; i < HELIX_STEPS; i++) {
          float r = surfaceRadius(level, Y_BOTTOM + (float(i) + 0.5) * h);
          float q = r * r / (UPDRAFT_RADIUS * UPDRAFT_RADIUS);
          angle += TWIST * sqrt(1.0 + q) / (r + TWIST_CORE);
        }
        return angle * h;
      }

      void main() {
        float level = aMote.x;
        float seed = aMote.w;
        // Motes ride the same helices as the pulses, at about half their speed.
        float cycle = fract(aMote.z + uTime * (0.06 + 0.04 * seed));
        float y = mix(Y_BOTTOM, Y_TOP, cycle);
        float radius = surfaceRadius(level, y);
        float angle = aMote.y + helixAngle(level, y);
        vec3 p = vec3(cos(angle) * radius, y, sin(angle) * radius);
        p += gust(p, uTime);

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float depth = max(-mvPosition.z, 0.1);
        // Small motes are drawn at a minimum size and dimmed, so they stay soft discs.
        float size = (1.3 + 2.0 * fract(seed * 17.0)) * clamp(REFERENCE_DEPTH / depth, 0.5, 2.0);
        float drawnSize = max(size, MIN_POINT_SIZE);
        gl_PointSize = drawnSize * uPixelRatio;

        float twinkle = 0.55 + 0.45 * sin(uTime * (1.5 + 2.5 * seed) + seed * 40.0);
        float lifetime = smoothstep(0.0, 0.08, cycle) * (1.0 - smoothstep(0.85, 1.0, cycle));
        float bounds = (1.0 - smoothstep(R_FADE, R_MAX, radius))
          * (1.0 - smoothstep(1.6, 2.6, radius) * smoothstep(1.0, 2.0, y))
          * smoothstep(Y_BOTTOM + 0.6, Y_BOTTOM + 1.4, y);
        float coverage = size / drawnSize;
        vAlpha = twinkle * lifetime * bounds * cornerFade(gl_Position, uResolution) * coverage * coverage;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;

      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float glow = exp(-d * d * 3.0) * (1.0 - smoothstep(0.7, 1.0, d));
        gl_FragColor = vec4(uColor * 2.6, clamp(glow * vAlpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 3;
  return points;
}
