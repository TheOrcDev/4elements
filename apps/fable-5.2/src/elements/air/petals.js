import * as THREE from 'three';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FLOW_GLSL } from './flow.js';
import { PATH_GLSL } from './paths.js';

// Pale petals and a few leaves caught in the circulation around the vortex.
//
// Unlike the specks they never leave: each one rides a closed loop in the vertical plane
// (up beside the funnel, out under the cloud, slowly down through the calmer air outside,
// back in along the water) while it is carried round the axis, quickly when close in and
// slowly when far out. Both motions are closed-form in time, so the petals are stateless.
// They are small flat quads that tumble, so they flash as they turn to the light.

const VERT = /* glsl */ `
${VERT_PRELUDE}
${FLOW_GLSL}
${PATH_GLSL}

attribute vec4 aSeed;
uniform vec3 uOrigin;
varying vec2 vUv;
varying vec4 vColor;
varying float vViewZ;

// Centre of a petal at the given time.
vec3 petalCentre(vec4 seed, float time) {
  float period = mix(24.0, 44.0, seed.x);
  float u = fract(seed.y + time / period);
  // Loop phase: 0 at the water beside the foot, pi at the top. The cosine term makes the
  // way up twice as quick as the way down.
  float phi = TAU * (u - 0.11 * cos(TAU * u) + 0.11);
  float top = mix(4.5, 10.2, fract(seed.z * 7.7));
  float y = 0.25 + (top - 0.25) * (0.5 - 0.5 * cos(phi));
  float x = -sin(phi);
  float bulge = 0.5 * (x + sqrt(x * x + 0.06));            // smooth max(x, 0): only on the way down
  float reach = mix(2.2, 6.0, fract(seed.w * 3.3)) * bulge;
  float rho = airRadius(y) * mix(1.25, 2.0, seed.z) + 0.25 + reach;
  // Angular speed spin * (1 + 0.72 sin(2 pi u)), integrated in closed form.
  float spin = mix(0.45, 0.8, fract(seed.x * 5.9));
  float theta = seed.w * TAU + spin * (time - 0.72 * period / TAU * cos(TAU * u));
  vec2 axis = airAxis(y, airFoot(time), airKink(time)) * exp(-reach * 0.5);
  vec3 p = vec3(axis.x + rho * cos(theta), y, axis.y - rho * sin(theta));
  // flutter
  p += 0.11 * vec3(sin(time * 2.1 + seed.x * 40.0), sin(time * 1.7 + seed.y * 40.0), cos(time * 2.4 + seed.z * 40.0));
  p.y = max(p.y, 0.05);
  return p;
}

void main() {
  vec3 centre = petalCentre(aSeed, uTime);

  // Tumbling frame.
  float a1 = uTime * mix(1.6, 4.5, fract(aSeed.y * 11.3)) + aSeed.x * 30.0;
  float a2 = uTime * mix(0.9, 2.8, fract(aSeed.z * 17.1)) + aSeed.w * 30.0;
  vec3 n = vec3(sin(a1) * cos(a2), cos(a1), sin(a1) * sin(a2));
  vec3 e1 = normalize(cross(n, vec3(0.31, 0.2, 0.93)) + 1e-4);
  vec3 e2 = cross(n, e1);

  float leaf = step(0.86, fract(aSeed.x * 77.7));
  vec3 world = centre + uOrigin;
  float viewZ = -(viewMatrix * vec4(world, 1.0)).z;
  float size = mix(0.022, 0.05, fract(aSeed.w * 13.7)) * (1.0 + 0.5 * leaf);     // metres, tip to base
  // Keep a petal at least a pixel and a half long on screen, and fade it instead of shrinking it.
  float px = size * projectionMatrix[1][1] * uResolution.y * 0.5 / max(viewZ, 0.3);
  float grow = max(1.0, 1.5 / max(px, 1e-3));
  world += (e1 * position.x * 0.5 + e2 * position.y * 0.32) * size * grow;
  vUv = position.xy;
  vec4 mv = viewMatrix * vec4(world, 1.0);
  vViewZ = -mv.z;
  gl_Position = projectionMatrix * mv;

  // ---- light: a thin translucent leaf, lit on both faces ----
  vec3 toEye = normalize(cameraPosition - uOrigin - centre);
  vec3 sunDir = normalize(uSunDir);
  vec3 moonDir = normalize(uMoonDir);
  vec2 q = centre.xz - airAxis(centre.y, airFoot(uTime), airKink(uTime));
  vec3 albedo = mix(mix(vec3(0.90, 0.70, 0.74), vec3(0.93, 0.90, 0.86), fract(aSeed.y * 31.0)), vec3(0.42, 0.50, 0.24), leaf);
  float facing = abs(dot(n, toEye));
  vec3 light = skyAmbient(n * sign(dot(n, toEye))) * 1.1;
  light += uMoonColor * (0.55 * abs(dot(n, moonDir)) * exp(-1.5 * airChord(centre, q, moonDir)));
  // Against the afterglow a petal glows through.
  float through = 0.35 + 0.65 * airPhase(dot(-toEye, sunDir), 0.5);
  light += uSunColor * (0.5 * (0.35 + 0.65 * abs(dot(n, sunDir))) * through * exp(-1.5 * airChord(centre, q, sunDir)));
  vec3 toFire = uFireLightPos - uOrigin - centre;
  light += uFireLightColor / (1.0 + dot(toFire, toFire));
  vec3 toFlash = uFlash.xyz - uOrigin - centre;
  light += flashIntensity() / (4.0 * PI * (1.0 + dot(toFlash, toFlash))) * 1.5;

  // (thinned out right in front of the lens, where one petal would cover half the view)
  float coverage = airSeen(centre, cameraPosition - uOrigin) / (grow * grow) * (0.35 + 0.65 * facing) * smoothstep(0.6, 1.8, viewZ);
  vColor = vec4(light * albedo * 0.8, 1.0) * coverage;
}
`;

const FRAG = /* glsl */ `
${FRAG_PRELUDE}
varying vec2 vUv;
varying vec4 vColor;
varying float vViewZ;

void main() {
  // A petal: an ellipse pinched toward its base.
  float d = length(vec2(vUv.x, vUv.y * (1.25 - 0.45 * vUv.x)));
  float a = smoothstep(1.0, 0.72, d) * softFade(vViewZ, 0.1);
  if (a <= 0.01) discard;
  // A faint midrib, so that close up it is not a flat chip of colour.
  float rib = 1.0 - 0.18 * smoothstep(0.12, 0.0, abs(vUv.y));
  gl_FragColor = vec4(vColor.rgb * rib, vColor.a) * a;
}
`;

/** Builds the petals. `uniforms` must provide the shared uniforms plus uOrigin. */
export function createPetals(ctx, uniforms, count) {
  const rng = ctx.rng(9311);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rng();

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3));
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
  geometry.instanceCount = count;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.userData.total = count;
  return mesh;
}
