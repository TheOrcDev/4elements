import * as THREE from "three";
import { CURL } from "../glsl/noise.js";

/**
 * AIR — 50k particles advected through an analytic curl field.
 *
 * Every particle integrates its own path in the vertex shader: ten Euler steps
 * through a divergence-free curl field plus a vortex and a soft containment
 * pull. No simulation state, no GPGPU ping-pong, and because the field is
 * exactly divergence-free the flow folds and shears without particles ever
 * collapsing into clumps.
 *
 * Particles are issued in streamers — 28 share a seed with staggered life
 * offsets, so they string out nose-to-tail along the same streamline and read
 * as wisps of wind rather than a fog of dots.
 */

const STREAMERS = 2400;
const PER_STREAMER = 20;
const COUNT = STREAMERS * PER_STREAMER;

// Total length of a streamer, as a fraction of the life cycle. Multiplied by
// the advection span it sets the wisp's arc length. Too short and each streamer
// collapses into a bright dot; too long and they comb into parallel strands
// that read as fur rather than wind.
const TRAIL_SPAN = 0.17;

const airVert = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uRadius;
uniform float uSpeed;
uniform float uTrail;

attribute vec3 aSeed;
attribute float aPhase;
attribute float aIndex;   // 0 = head of the streamer, 1 = tail
attribute float aSpeed;

varying float vFade;
varying float vSpeedGlow;
varying float vHead;

${CURL}

void main() {
  // The head wraps; the tail trails behind it by a fixed slice. Subtracting
  // inside the fract() instead would teleport the tail to the far end of the
  // streamline every time the head crosses zero, tearing the wisp in half.
  float head = fract(aPhase + uTime * uSpeed * aSpeed * 0.055);
  // Per-streamer trail length, so the wisps aren't all cut to one measure.
  float life = head - aIndex * uTrail * aSpeed;
  float born = step(0.0, life);
  life = max(life, 0.0);

  const int STEPS = 10;
  float total = life * 2.2;
  float dt = total / float(STEPS);

  vec3 p = aSeed;
  vec3 v = vec3(0.0);

  for (int i = 0; i < STEPS; i++) {
    // Curl leads, and its spatial frequency is what matters most here. At the
    // field's natural scale one wavelength is wider than the whole cloud, so
    // every streamline points the same way and the result reads as combed fur.
    // Compressing it fits several independent eddies inside the sphere.
    v = curlField(p * 2.10, uTime * 0.35) * 0.70;

    // Vortex about the vertical axis — enough to give the cloud a sense of
    // rotation, not enough to drown out the curl.
    float rxz = length(p.xz) + 0.2;
    v += cross(vec3(0.0, 1.0, 0.0), p) * (0.50 / rxz) * 0.55;

    // A little lift, countering the inward pull's tendency to make everything
    // droop toward the centre.
    v.y += 0.05;

    // Containment starts well inside the shell and pulls gently, so particles
    // ease back instead of piling into a hard crust at the boundary.
    float over = length(p) - uRadius * 0.78;
    v -= normalize(p + 1e-5) * max(over, 0.0) * 1.75;

    p += v * dt;
  }

  vSpeedGlow = clamp((length(v) - 0.75) * 0.55, 0.0, 1.0);
  vHead = 1.0 - aIndex;

  // Fade in at birth, out at death, and taper along the streamer's tail.
  float lifeFade = smoothstep(0.0, 0.10, life) * (1.0 - smoothstep(0.72, 1.0, life));
  vFade = lifeFade * mix(1.0, 0.12, aIndex) * born;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.2 + 2.8 * vHead * vHead) * uPixelRatio * (12.0 / -mv.z);
}
`;

const airFrag = /* glsl */ `
precision highp float;

varying float vFade;
varying float vSpeedGlow;
varying float vHead;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = (1.0 - smoothstep(0.0, 0.5, d));

  // Fast air runs white-hot, slow air stays a cold pale blue.
  vec3 cold = vec3(0.30, 0.62, 0.92);
  vec3 warm = vec3(0.86, 0.97, 1.0);
  vec3 col = mix(cold, warm, vSpeedGlow * 0.75 + vHead * 0.35);

  // Deliberately faint: sixty thousand additive sprites overlap hard through
  // the core, and anything brighter than this integrates to a white ball.
  gl_FragColor = vec4(col * (0.38 + 1.15 * core), core * vFade * 0.14);
}
`;

const coreVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const coreFrag = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vWorld;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.2);
  float breathe = 0.75 + 0.25 * sin(uTime * 1.1);
  gl_FragColor = vec4(uColor * fres * breathe * 0.30, fres * 0.10 * breathe);
}
`;

export function createAir({ radius = 1.85 } = {}) {
  const group = new THREE.Group();

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT * 3);
  const phase = new Float32Array(COUNT);
  const index = new Float32Array(COUNT);
  const speed = new Float32Array(COUNT);

  let w = 0;
  for (let s = 0; s < STREAMERS; s++) {
    // Seed inside the shell, biased outward so the core stays readable.
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const sr = Math.sqrt(1 - u * u);
    const r = radius * (0.25 + 0.75 * Math.cbrt(Math.random()));
    const sx = sr * Math.cos(th) * r;
    const sy = u * r * 0.85;
    const sz = sr * Math.sin(th) * r;

    const ph = Math.random();
    const sp = 0.7 + Math.random() * 0.7;

    for (let j = 0; j < PER_STREAMER; j++) {
      seed[w * 3 + 0] = sx;
      seed[w * 3 + 1] = sy;
      seed[w * 3 + 2] = sz;
      pos[w * 3 + 0] = sx;
      pos[w * 3 + 1] = sy;
      pos[w * 3 + 2] = sz;
      phase[w] = ph;
      index[w] = j / (PER_STREAMER - 1);
      speed[w] = sp;
      w++;
    }
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geo.setAttribute("aIndex", new THREE.BufferAttribute(index, 1));
  geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRadius: { value: radius },
      uSpeed: { value: 1.0 },
      uTrail: { value: TRAIL_SPAN },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: airVert,
    fragmentShader: airFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  group.add(points);

  // ---- faint core ------------------------------------------------------
  const coreMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x9f_dc_ff) },
    },
    vertexShader: coreVert,
    fragmentShader: coreFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius * 0.42, 4),
    coreMat
  );
  group.add(core);

  return {
    name: "air",
    group,
    radius,
    // Bluer than the particles themselves: this tints the floor pool and
    // reflection, and a near-white tint there just smears the stone grey.
    color: new THREE.Color(0x8e_cd_ff),
    hitRadius: radius * 0.95,

    update(t) {
      mat.uniforms.uTime.value = t;
      coreMat.uniforms.uTime.value = t;
    },

    setPixelRatio(pr) {
      mat.uniforms.uPixelRatio.value = pr;
    },

    particleCount: COUNT,
  };
}
