import * as THREE from "three";
import { NOISE } from "../glsl/noise.js";

/**
 * FIRE — a true volumetric raymarch.
 *
 * The mesh is only a bounding sphere; the flame itself is integrated inside the
 * fragment shader. Each pixel solves ray/sphere intersection analytically, then
 * walks the segment accumulating emission and absorption through vertically
 * stretched turbulence shaped into a teardrop. Layered sprite billboards can't
 * hold up when you orbit them — this holds up from every angle.
 *
 * Two things do most of the work visually:
 *
 * - Emission spans orders of magnitude (see `fireRamp` and the cubic below).
 *   Real flame intensity does, and that range is what tone mapping converts
 *   into a white-hot core with saturated orange fringes. A linear ramp gives
 *   you flat orange no matter how bright you push it.
 * - The result composites with premultiplied alpha rather than additive
 *   blending, so dense sooty gas can *occlude* the glow behind it. Additive
 *   blending can only ever brighten, which caps how much contrast a flame can
 *   have — it can never have a dark side.
 */

const EMBER_COUNT = 1500;

const flameVert = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const flameFrag = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3  uCenter;
uniform vec3  uAxes;        // ellipsoid semi-axes, world units
uniform vec3  uFlameScale;  // unit-ellipsoid space -> flame space
uniform float uIntensity;
uniform float uFlicker;

varying vec3 vWorld;

${NOISE}

// Blackbody-ish ramp: deep ember red -> blood orange -> amber -> gold -> white.
// The pale end is squeezed into the top ~12%. Let white start earlier and the
// whole flame desaturates into a grey smear.
vec3 fireRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = mix(vec3(0.30, 0.008, 0.002), vec3(0.90, 0.055, 0.004), smoothstep(0.00, 0.22, t));
  c = mix(c, vec3(1.00, 0.185, 0.010), smoothstep(0.20, 0.48, t));
  c = mix(c, vec3(1.00, 0.420, 0.035), smoothstep(0.46, 0.70, t));
  c = mix(c, vec3(1.00, 0.720, 0.170), smoothstep(0.68, 0.90, t));
  c = mix(c, vec3(1.00, 0.950, 0.790), smoothstep(0.90, 1.00, t));
  return c;
}

// Turbulence — |noise| summed over octaves — rather than plain fbm. The folds
// at each octave's zero crossings are exactly the wispy, torn structure fire
// has; smooth fbm gives you a rolling cloud instead.
//
// Sample space is squashed vertically first: rising gas stretches, so features
// need to be taller than they are wide or the flame reads as bubbling soup.
// Each octave also scrolls upward faster than the last, so fine detail races
// through the coarse silhouette the way real flame does.
float fireTurb(vec3 p, float t) {
  p.y *= 0.42;

  // Four octaves, not five. This runs once per raymarch step for every covered
  // pixel, so it dominates the whole scene's cost; the fifth octave's detail is
  // sub-pixel at any normal viewing distance and is not worth 20% of frame time.
  float f = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    vec3 q = p;
    q.y -= t * (1.15 + float(i) * 0.80);
    f += a * abs(snoise(q));
    p *= 2.14;
    a *= 0.5;
  }
  // |snoise| averages ~0.24, so four weighted octaves land around 0.225. Scale
  // back to roughly 0..1 with a mean near 0.5 — every consumer below reads it
  // as a normalised field, and skipping this quietly halves the density.
  return clamp(f * 2.12, 0.0, 1.0);
}

// Returns density in .x, normalised height in .y, turbulence in .z, and how
// close to the flame's axis the sample sits in .w.
//
// The point arrives in flame space: y runs about -0.95 to 0.93 over the
// flame's height, and the body reaches a radius of roughly 0.65.
vec4 flame(vec3 p, float t) {
  float h = (p.y + 0.95) / 1.88;
  if (h < 0.0 || h > 1.0) return vec4(0.0);

  // Teardrop: pinched at the wick, bulging at the shoulder, tapering to a tip.
  // A flame is far taller than it is wide — let the radius creep much past this
  // and it reads as a bonfire puddle rather than a flame.
  // Roughly 1.7:1 tall-to-wide. Slimmer than this and the flame reads as a
  // thin candle next to the other elements' volumes; much fatter and it stops
  // reading as a flame at all.
  float taper = pow(1.0 - h, 0.52);
  float foot  = smoothstep(0.0, 0.14, h);
  float radius = 0.56 * taper * (0.30 + 0.88 * foot);

  // Cheap rejection before the expensive turbulence: nothing beyond the widest
  // possible envelope can contribute, and most of the bounding sphere is out
  // there. This is what pays for the fifth octave.
  float rxz = length(p.xz);
  if (rxz > radius + 0.45) return vec4(0.0);

  // Base frequency has to put several features across the flame's width. Much
  // lower and the coarsest octave spans the whole column, so it shifts the
  // silhouette bodily instead of breaking it into tongues.
  vec3 q = p * 3.40;
  q.xz *= rot2(p.y * 0.75 + t * 0.28);
  float turb = fireTurb(q, t);

  // Centre the turbulence so it both eats gaps into the body and throws
  // tongues out past it, biting harder toward the tip.
  float bite = (turb - 0.50) * (0.24 + 0.70 * h);
  float d = rxz - radius + bite;

  // Two separate falloffs, and keeping them separate is the point.
  //
  // The edge stays narrow: it carries the licking tongues, and widening it to
  // get an interior gradient smears them into a smooth egg.
  float edge = 1.0 - smoothstep(-0.06, 0.10, d);

  // The interior gradient instead comes from distance to the axis, so the
  // flame is dense along its centreline and thin at its flanks without the
  // silhouette losing its bite.
  float core = 1.0 - smoothstep(0.15, 1.05, rxz / max(radius, 1e-4));

  // Turbulence has to carve actual voids through the interior, not just
  // modulate its amplitude. Scaling density by something like (0.4 + 0.9*turb)
  // never reaches zero, so every view ray integrates a continuous slab and the
  // structure averages away into a smooth column. Thresholding punches real
  // holes, and those holes are the tongues.
  float wisp = smoothstep(0.16, 0.60, turb);
  float dens = edge * (0.30 + 0.80 * core) * wisp;

  dens *= 1.0 - smoothstep(0.70, 1.0, h);            // dissolve at the tip
  dens *= smoothstep(-0.97, -0.80, p.y);             // soften the base
  dens *= 0.70 + 0.30 * uFlicker;

  return vec4(clamp(dens, 0.0, 1.0), h, turb, core);
}

void main() {
  // Bound the flame with a fitted ellipsoid rather than a sphere. The flame is
  // a tall narrow column, so a sphere large enough to contain it is mostly
  // empty — and every one of those extra covered pixels still pays for a full
  // march. Squeezing the bound to the silhouette roughly halves the shaded
  // area and shortens every ray segment, which is by far the cheapest
  // performance win available here.
  //
  // Dividing the ray by the semi-axes turns the ellipsoid into a unit sphere,
  // so the intersection stays a two-line quadratic. The ray parameter remains
  // a world distance because the direction is normalised before the divide.
  vec3 rdW = normalize(vWorld - cameraPosition);
  vec3 ro = (cameraPosition - uCenter) / uAxes;
  vec3 rd = rdW / uAxes;

  float a = dot(rd, rd);
  float b = dot(ro, rd);
  float c = dot(ro, ro) - 1.0;
  float disc = b * b - a * c;
  if (disc < 0.0) discard;

  float sq = sqrt(disc);
  float tN = max((-b - sq) / a, 0.0);
  float tF = (-b + sq) / a;
  if (tF <= tN) discard;

  // Fixed step size rather than dividing each chord into the same count. A ray
  // clipping the silhouette spans a sliver of volume and has no business
  // spending a full budget of samples on it; sizing dt so only a ray down the
  // long axis uses all of them lets every shorter chord exit early.
  const int MAX_STEPS = 34;
  float dt = (2.0 * uAxes.y) / float(MAX_STEPS);

  // Dither the entry point to trade banding for a little grain.
  float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  float t = tN + dt * jitter;

  vec3 acc = vec3(0.0);
  float transmittance = 1.0;
  float halo = 0.0;

  for (int i = 0; i < MAX_STEPS; i++) {
    if (t > tF || transmittance < 0.008) break;

    vec3 pe = ro + rd * t;          // unit-ellipsoid space
    vec3 p = pe * uFlameScale;      // flame space

    // Heat halo: a soft falloff just past the column, integrated as we go for
    // free. Without it the flame ends abruptly at its own silhouette and reads
    // as a cut-out rather than something radiating into the air around it.
    // The falloff has to stay tight — the column is only ~0.6 wide here, and a
    // gentler curve paints the whole bounding volume as a visible orange disc.
    halo += exp(-length(p.xz) * 4.4) *
            (1.0 - smoothstep(-0.4, 0.7, p.y)) * (dt / uAxes.y);

    vec4 f = flame(p, uTime);
    // Fade out before the bound, or the silhouette gets sliced flat where the
    // marched segment runs out.
    float dens = f.x * (1.0 - smoothstep(0.86, 1.0, length(pe)));

    if (dens > 0.003) {
      // The luminous zone of a real flame is a band sitting just above the
      // base, not a ramp starting at it. A linear falloff from h=0 saturates
      // the entire bottom of the flame into one white slab.
      //
      // Gating on the axial term too confines white heat to a narrow column,
      // so the flanks stay orange and the outer wisps stay deep red. That
      // spread across a single silhouette is where the contrast comes from —
      // and folding the turbulence back in puts hot cores inside cooler
      // tongues, which is what reads as fire rather than as a gradient.
      // The axial exponent is high for a reason. The core term is a smoothstep,
      // so it stays near 1 across a good half of the flame's width — to a
      // gentle power and the entire body saturates white and the ramp's whole
      // orange range goes unused. At 3.5 the white core is confined to roughly
      // the inner quarter, gold sits around 40% out, and the flanks fall away
      // through orange into deep red.
      float heat = smoothstep(0.0, 0.10, f.y) * (1.0 - smoothstep(0.28, 0.82, f.y));
      float temp = pow(dens, 0.9) * pow(f.w, 3.5) * heat * (0.45 + 0.85 * f.z) * 1.25;
      temp = clamp(temp, 0.0, 1.0);

      // The cubic is the whole trick: it keeps the bulk of the volume down in
      // the deep-orange range while letting the densest core reach values many
      // times display white, so tone mapping burns it out the way a camera
      // does. Contrast comes from that spread, not from overall brightness.
      vec3 emit = fireRamp(temp) * (0.05 + 7.5 * temp * temp * temp);

      // Cool, sooty gas gathering at the crown. It absorbs hard and emits
      // almost nothing, so the tip silhouettes against the glow behind it
      // instead of just fading out — the dark side a flame needs.
      float soot = smoothstep(0.50, 0.95, f.y) * dens;

      // Optical thickness is a legibility control as much as a physical one:
      // a thin flame integrates its whole depth into mush, while a thicker one
      // is dominated by the samples nearest the camera, so the turbulent
      // structure at its surface actually survives to the screen.
      acc += emit * dens * dt * transmittance * 3.1;
      transmittance *= exp(-(dens * 7.5 + soot * 11.0) * dt);
    }

    t += dt;
  }

  acc += vec3(1.0, 0.30, 0.065) * halo * 0.55;
  acc *= uIntensity;

  // Premultiplied "over": emission adds, density occludes. The halo carries no
  // alpha, so it stays purely additive glow around the silhouette.
  float alpha = clamp(1.0 - transmittance, 0.0, 1.0);
  if (alpha < 0.0015 && dot(acc, vec3(1.0)) < 0.0025) discard;

  gl_FragColor = vec4(acc, alpha);
}
`;

const emberVert = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;

attribute vec3 aSeed;    // spawn offset around the wick
attribute float aPhase;  // life offset so embers don't pulse in lockstep
attribute float aSpeed;
attribute float aScale;  // a few big slow sparks among many small fast ones

varying float vLife;
varying float vHeat;
varying float vScale;

void main() {
  float life = fract(aPhase + uTime * aSpeed * 0.15);
  vLife = life;
  vScale = aScale;

  float rise = life * (3.4 + aScale * 2.2);

  // Wander widens as the ember cools and loses the plume.
  float wander = 0.20 + life * 1.15;
  vec3 p = aSeed;
  p.y += rise;
  p.x += sin(uTime * 1.4 * aSpeed + aPhase * 41.0 + rise * 1.3) * wander * 0.55;
  p.z += cos(uTime * 1.2 * aSpeed + aPhase * 27.0 + rise * 1.1) * wander * 0.55;

  vHeat = 1.0 - smoothstep(0.0, 0.72, life);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.8 + 5.5 * aScale) * (0.35 + 0.9 * vHeat) * uPixelRatio * (12.0 / -mv.z);
}
`;

const emberFrag = /* glsl */ `
precision highp float;
varying float vLife;
varying float vHeat;
varying float vScale;

void main() {
  vec2 uv = gl_PointCoord - 0.5;

  // Squashing y stretches the sprite vertically, which reads as the motion
  // blur of something travelling fast straight up.
  uv.y *= 0.42;
  float d = length(uv);
  if (d > 0.5) discard;

  // Squared so the falloff is soft rather than a hard-edged capsule — at this
  // aspect ratio a linear edge reads as a little rectangle, not a spark.
  float core = 1.0 - smoothstep(0.0, 0.5, d);
  core *= core;
  float glow = pow(core, 2.0);

  // Cooling embers slide from white-gold down to deep red before they die.
  vec3 col = mix(vec3(1.0, 0.16, 0.02), vec3(1.0, 0.94, 0.70), vHeat * vHeat);
  float fade = smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.5, 1.0, vLife));

  gl_FragColor = vec4(col * (0.4 + 2.6 * glow) * (0.35 + 1.4 * vHeat),
                      core * fade * (0.05 + 0.32 * vHeat));
}
`;

export function createFire({ radius = 1.55 } = {}) {
  const group = new THREE.Group();

  // The flame body reaches y = ±0.94 and a radius of about 0.65 in flame
  // space. FLAME_SCALE maps the unit ellipsoid onto that with a little headroom
  // on every axis, so the silhouette never reaches the bound and get sliced.
  const FLAME_SCALE = new THREE.Vector3(0.75, 1.12, 0.75);
  // Old convention: one flame-space unit was 0.72 * radius in world units.
  const axes = FLAME_SCALE.clone().multiplyScalar(0.72 * radius);

  // ---- volumetric body -------------------------------------------------
  const uniforms = {
    uTime: { value: 0 },
    uCenter: { value: new THREE.Vector3() },
    uAxes: { value: axes },
    uFlameScale: { value: FLAME_SCALE },
    uIntensity: { value: 1.0 },
    uFlicker: { value: 1.0 },
  };

  const bodyMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: flameVert,
    fragmentShader: flameFrag,
    transparent: true,
    depthWrite: false,
    // Premultiplied "over" rather than additive: the shader already weights
    // emission by transmittance, so this composites the volume correctly and
    // lets soot darken what's behind it.
    blending: THREE.NormalBlending,
    premultipliedAlpha: true,
    side: THREE.FrontSide,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), bodyMat);
  body.scale.copy(axes);
  body.frustumCulled = false;
  group.add(body);

  // ---- embers ----------------------------------------------------------
  const eg = new THREE.BufferGeometry();
  const seeds = new Float32Array(EMBER_COUNT * 3);
  const phases = new Float32Array(EMBER_COUNT);
  const speeds = new Float32Array(EMBER_COUNT);
  const scales = new Float32Array(EMBER_COUNT);

  for (let i = 0; i < EMBER_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.3 * radius;
    seeds[i * 3 + 0] = Math.cos(a) * r;
    seeds[i * 3 + 1] = -radius * 0.55 + Math.random() * 0.7;
    seeds[i * 3 + 2] = Math.sin(a) * r;
    phases[i] = Math.random();
    speeds[i] = 0.65 + Math.random() * 0.9;
    // Cubed, so most embers are fine sparks and only a handful are big.
    scales[i] = Math.random() ** 3;
  }

  eg.setAttribute("position", new THREE.BufferAttribute(seeds.slice(), 3));
  eg.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
  eg.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  eg.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  eg.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

  const emberMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: emberVert,
    fragmentShader: emberFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const embers = new THREE.Points(eg, emberMat);
  embers.frustumCulled = false;
  group.add(embers);

  const worldPos = new THREE.Vector3();
  const local = new THREE.Vector3();

  return {
    name: "fire",
    group,
    radius,
    // The flame is a narrow column inside a larger bounding volume, so the
    // floor's rune ring and reflection want the silhouette's width, not this.
    floorRadius: radius * 0.62,
    color: new THREE.Color(0xff_6a_1f),
    hitRadius: radius * 0.9,
    pulse: 1,

    update(t, dt, camera) {
      // Three detuned oscillators plus a slow drift read as an unpredictable
      // flicker; any single sine reads as a pulse.
      const flick =
        0.72 +
        0.16 * Math.sin(t * 11.3) +
        0.1 * Math.sin(t * 27.7 + 1.3) +
        0.08 * Math.sin(t * 4.1 + 0.7);

      uniforms.uTime.value = t;
      uniforms.uFlicker.value = flick;
      uniforms.uIntensity.value = 0.88 + 0.24 * flick;
      emberMat.uniforms.uTime.value = t;

      // Drives the light this throws onto the floor.
      this.pulse = 0.78 + 0.42 * flick;

      body.getWorldPosition(worldPos);
      uniforms.uCenter.value.copy(worldPos);

      // Flip the bounding volume inside-out if the camera enters it, so the
      // flame never pops out of existence up close. Tested in the ellipsoid's
      // own space, where the bound is the unit sphere.
      local.copy(camera.position).sub(worldPos).divide(axes);
      const inside = local.length() < 1.06;
      const wanted = inside ? THREE.BackSide : THREE.FrontSide;
      if (bodyMat.side !== wanted) {
        bodyMat.side = wanted;
        bodyMat.needsUpdate = true;
      }
    },

    setPixelRatio(pr) {
      emberMat.uniforms.uPixelRatio.value = pr;
    },

    particleCount: EMBER_COUNT,
  };
}
