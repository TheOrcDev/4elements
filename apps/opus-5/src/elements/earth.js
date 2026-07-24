import * as THREE from "three";
import { NOISE } from "../glsl/noise.js";

/**
 * EARTH — a ridged-multifractal planetoid with molten veins.
 *
 * The silhouette is real displaced geometry (ridged noise gives crests that
 * actually look eroded, unlike plain fbm's rolling blobs), the normals are
 * rebuilt from the displaced surface, and a fragment-stage bump adds crunch
 * closer in. Magma pools in the low ground and glows through thin cracks, which
 * is what the bloom pass then blooms.
 */

const CRYSTAL_COUNT = 15;
const MOTE_COUNT = 700;

// Terrain shared by the vertex stage; kept in one place so the displacement and
// the shading agree about where the valleys are.
const TERRAIN = /* glsl */ `
float elevation(vec3 dir) {
  float base = ridged(dir * 1.55, 5);
  float plates = fbm3(dir * 0.85) * 0.30;
  float detail = fbm4(dir * 4.60) * 0.11;
  return base * 0.72 + plates + detail;
}
`;

const earthVert = /* glsl */ `
uniform float uRadius;
uniform float uAmp;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vDir;
varying float vElev;

${NOISE}
${TERRAIN}

vec3 surface(vec3 dir) {
  return dir * (uRadius * (0.86 + elevation(dir) * uAmp));
}

void main() {
  vec3 dir = normalize(position);
  vDir = dir;

  vec3 p = surface(dir);
  vElev = elevation(dir);

  vec3 tangent = normalize(cross(dir, abs(dir.y) > 0.94 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
  vec3 bitan = cross(dir, tangent);
  const float eps = 0.010;
  vec3 pa = surface(normalize(dir + tangent * eps));
  vec3 pb = surface(normalize(dir + bitan * eps));
  vec3 n = normalize(cross(pa - p, pb - p));
  if (dot(n, dir) < 0.0) n = -n;

  vNormal = normalize(mat3(modelMatrix) * n);

  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const earthFrag = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uFillDir;
uniform vec3 uFillColor;
uniform vec3 uLavaColor;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vDir;
varying float vElev;

${NOISE}

// Mikkelsen-style bump on an unparametrised surface: perturb the normal by the
// screen-space gradient of a height field. Buys close-up grit for one noise.
vec3 bumped(vec3 n, vec3 wp, float h) {
  vec3 dp1 = dFdx(wp);
  vec3 dp2 = dFdy(wp);
  float dhx = dFdx(h);
  float dhy = dFdy(h);
  vec3 r1 = cross(dp2, n);
  vec3 r2 = cross(n, dp1);
  float det = dot(dp1, r1);
  vec3 grad = (r1 * dhx + r2 * dhy) / max(abs(det), 1e-7);
  return normalize(n - grad * 0.030);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);

  float grit = fbm4(vDir * 26.0);
  N = bumped(N, vWorld, grit);

  // --- rock ------------------------------------------------------------
  float mottle = fbm4(vDir * 7.0) * 0.5 + 0.5;
  float strata = fbm3(vDir * 2.3 + vec3(0.0, vElev * 3.0, 0.0)) * 0.5 + 0.5;

  vec3 basalt = vec3(0.045, 0.042, 0.050);
  vec3 granite = vec3(0.155, 0.140, 0.125);
  vec3 rock = mix(basalt, granite, mottle * strata);
  rock = mix(rock, vec3(0.20, 0.19, 0.17), smoothstep(0.42, 0.70, vElev) * 0.7);

  // Lichen clinging to the sheltered upward faces.
  float up = clamp(dot(N, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
  float lichen = smoothstep(0.55, 0.95, up) * smoothstep(0.30, 0.55, mottle) * 0.55;
  rock = mix(rock, vec3(0.075, 0.165, 0.105), lichen);

  // --- magma -----------------------------------------------------------
  // Thin veins where a noise field crosses zero, gated to the low ground.
  float vein = 1.0 - smoothstep(0.0, 0.075, abs(snoise(vDir * 2.35)));
  float vein2 = 1.0 - smoothstep(0.0, 0.045, abs(snoise(vDir * 4.10 + 11.3)));
  float lowland = (1.0 - smoothstep(0.10, 0.34, vElev));
  float crack = clamp(vein + vein2 * 0.7, 0.0, 1.0) * lowland;

  // Slow convective breathing so the glow never sits still.
  float pulse = 0.65 + 0.35 * sin(uTime * 0.9 + fbm3(vDir * 3.0) * 6.0);
  float magma = pow(crack, 1.6) * pulse;

  // --- lighting --------------------------------------------------------
  float ndl = clamp(dot(N, uKeyDir), 0.0, 1.0);
  float ndf = clamp(dot(N, uFillDir), 0.0, 1.0);
  float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);

  // Cheap AO: valleys are occluded, crests catch light.
  float ao = mix(0.35, 1.0, smoothstep(0.05, 0.55, vElev));

  vec3 H = normalize(uKeyDir + V);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 40.0) * (0.10 + 0.35 * mottle);

  vec3 col = rock * (uKeyColor * ndl * 1.55 + uFillColor * ndf * 0.55 + 0.055) * ao;
  col += uKeyColor * spec * 0.55;
  col += vec3(0.20, 0.28, 0.34) * rim * 0.35;

  // Magma lights the rock around it before it blows out to white-hot.
  col += uLavaColor * magma * 2.6;
  col += uLavaColor * pow(magma, 0.5) * 0.35 * ao;
  col = mix(col, vec3(1.0, 0.93, 0.72), clamp(magma - 0.72, 0.0, 1.0) * 0.8);

  gl_FragColor = vec4(col, 1.0);
}
`;

const crystalVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vLocal;

void main() {
  vLocal = position;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const crystalFrag = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uKeyDir;

varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vLocal;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);
  float ndl = clamp(dot(N, uKeyDir), 0.0, 1.0);

  // The octahedron's local space runs |x|+|y|+|z| = 1, so |y| is effectively
  // "how close to a tip". Thin ends pipe light, which is what separates a gem
  // from a flat-shaded green solid.
  float tip = clamp(abs(vLocal.y) * 1.15, 0.0, 1.0);
  float breathe = 0.90 + 0.10 * sin(uTime * 1.6 + vLocal.y * 5.0);

  vec3 deep = uColor * 0.09;
  vec3 bright = uColor * 1.10;

  vec3 col = mix(deep, bright, 0.20 + 0.60 * tip) * breathe;
  col *= 0.30 + 0.90 * ndl;
  col += uColor * fres * 1.30;                                    // lit edges
  col += vec3(0.86, 1.0, 0.93) *
         pow(clamp(dot(N, normalize(uKeyDir + V)), 0.0, 1.0), 64.0) * 0.85;

  gl_FragColor = vec4(col, 1.0);
}
`;

const moteVert = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;

attribute float aPhase;
attribute float aSpeed;
attribute float aRadius;

varying float vFade;

void main() {
  float a = aPhase * 6.28318 + uTime * aSpeed * 0.12;
  float y = sin(aPhase * 21.7 + uTime * aSpeed * 0.28) * 1.5;
  float r = aRadius * (1.0 + 0.06 * sin(uTime * 0.7 + aPhase * 13.0));

  vec3 p = vec3(cos(a) * r, y, sin(a) * r);
  vFade = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.3 + aPhase * 31.0));

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.6 + 2.4 * fract(aPhase * 7.0)) * uPixelRatio * (12.0 / -mv.z);
}
`;

const moteFrag = /* glsl */ `
precision highp float;
varying float vFade;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = (1.0 - smoothstep(0.0, 0.5, d));
  gl_FragColor = vec4(mix(vec3(1.0, 0.62, 0.22), vec3(0.55, 1.0, 0.72), fract(vFade * 3.0)) * 0.95, core * vFade * 0.24);
}
`;

export function createEarth({ radius = 1.6 } = {}) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  const uniforms = {
    uTime: { value: 0 },
    uRadius: { value: radius },
    uAmp: { value: 0.3 },
    uKeyDir: { value: new THREE.Vector3(0.55, 0.75, 0.38).normalize() },
    uKeyColor: { value: new THREE.Color(0xff_f0_dc) },
    uFillDir: { value: new THREE.Vector3(-0.6, 0.15, -0.5).normalize() },
    uFillColor: { value: new THREE.Color(0x3a_6e_a8) },
    uLavaColor: { value: new THREE.Color(0xff_5c_14) },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: earthVert,
    fragmentShader: earthFrag,
  });

  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 32), mat);
  body.frustumCulled = false;
  spin.add(body);

  // ---- crystal shards --------------------------------------------------
  const crystalUniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x2f_e0_8a) },
    uKeyDir: { value: uniforms.uKeyDir.value.clone() },
  };
  const crystalMat = new THREE.ShaderMaterial({
    uniforms: crystalUniforms,
    vertexShader: crystalVert,
    fragmentShader: crystalFrag,
  });

  // ShaderMaterial ignores `flatShading`, so bake flat normals into the
  // geometry instead — the octahedron is non-indexed, so recomputing normals
  // gives one per face, which is what makes the facets read as facets.
  const shardGeo = new THREE.OctahedronGeometry(1, 0);
  shardGeo.computeVertexNormals();
  const crystals = [];
  const crystalOrbit = new THREE.Group();
  spin.add(crystalOrbit);

  for (let i = 0; i < CRYSTAL_COUNT; i++) {
    const m = new THREE.Mesh(shardGeo, crystalMat);
    const s = 0.05 + Math.random() * 0.085;
    m.scale.set(
      s * (0.5 + Math.random() * 0.5),
      s * (1.8 + Math.random() * 1.5),
      s * (0.5 + Math.random() * 0.5)
    );

    const dir = new THREE.Vector3(
      Math.random() - 0.5,
      (Math.random() - 0.5) * 0.65,
      Math.random() - 0.5
    ).normalize();
    m.position.copy(dir).multiplyScalar(radius * (1.02 + Math.random() * 0.28));
    m.lookAt(0, 0, 0);
    m.rotateX(Math.PI / 2);
    m.rotation.z = Math.random() * Math.PI;

    crystals.push({
      mesh: m,
      wobble: Math.random() * Math.PI * 2,
      base: m.position.clone(),
    });
    crystalOrbit.add(m);
  }

  // ---- dust motes ------------------------------------------------------
  const mg = new THREE.BufferGeometry();
  const mpos = new Float32Array(MOTE_COUNT * 3);
  const mphase = new Float32Array(MOTE_COUNT);
  const mspeed = new Float32Array(MOTE_COUNT);
  const mrad = new Float32Array(MOTE_COUNT);
  for (let i = 0; i < MOTE_COUNT; i++) {
    mphase[i] = Math.random();
    mspeed[i] = 0.4 + Math.random() * 1.4;
    mrad[i] = radius * (1.15 + Math.random() * 0.85);
  }
  mg.setAttribute("position", new THREE.BufferAttribute(mpos, 3));
  mg.setAttribute("aPhase", new THREE.BufferAttribute(mphase, 1));
  mg.setAttribute("aSpeed", new THREE.BufferAttribute(mspeed, 1));
  mg.setAttribute("aRadius", new THREE.BufferAttribute(mrad, 1));

  const moteMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: moteVert,
    fragmentShader: moteFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const motes = new THREE.Points(mg, moteMat);
  motes.frustumCulled = false;
  group.add(motes);

  return {
    name: "earth",
    group,
    radius,
    color: new THREE.Color(0x57_d9_8a),
    hitRadius: radius * 1.2,

    update(t) {
      uniforms.uTime.value = t;
      crystalUniforms.uTime.value = t;
      moteMat.uniforms.uTime.value = t;

      spin.rotation.y = t * 0.055;
      spin.rotation.z = Math.sin(t * 0.11) * 0.05;
      crystalOrbit.rotation.y = t * 0.09;

      for (let i = 0; i < crystals.length; i++) {
        const c = crystals[i];
        const bob = Math.sin(t * 0.9 + c.wobble) * 0.045;
        c.mesh.position.copy(c.base).multiplyScalar(1 + bob);
      }
    },

    setPixelRatio(pr) {
      moteMat.uniforms.uPixelRatio.value = pr;
    },

    particleCount: MOTE_COUNT,
  };
}
