import * as THREE from 'three';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FLOW_GLSL } from './flow.js';
import { PATH_GLSL } from './paths.js';

// Dust, droplets and spray: the things that make the wind visible.
//
// Each one is a screen-space capsule stretched between where the particle is now and where
// it was one exposure ago, both taken from the closed-form paths in paths.js, so the streak
// follows the curve of the flow exactly and its length is the particle's true speed.
//
// From far away fewer of them are drawn, each a little wider and brighter (see uBoost), so
// that the swarm keeps its weight in the picture at a fraction of the price.

const VERT = /* glsl */ `
${VERT_PRELUDE}
${FLOW_GLSL}
${PATH_GLSL}

attribute vec4 aSeed;
attribute float aKind;      // 0 = wind-borne speck, 1 = spray droplet
uniform vec3 uOrigin;
uniform float uExposure;    // seconds of motion blur
uniform float uBoost;       // how many specks each one drawn stands for (1 when all are drawn)
varying vec2 vLocal;        // pixels: x along the streak from the tail, y across
varying vec2 vShape;        // streak length and half width, pixels
varying vec4 vColor;        // premultiplied radiance and coverage

void main() {
  // The reflection is small, blurred and bent by ripples: one speck in three is enough for it.
  float boost = uBoost;
  if (uIsMirrorPass > 0.5) {
    if (gl_InstanceID % 3 != 0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    boost *= 3.0;
  }
  float fade, fadeTail, flung;
  vec3 head, tail;
  float droplet;            // 1 for water, 0 for dust
  vec3 eye = cameraPosition - uOrigin;
  if (aKind < 0.5) {
    float period = airSpeckPeriod(aSeed);
    float age = fract(aSeed.z + uTime / period) * period;
    head = airSpeck(aSeed, age, uTime, fade, flung);
    // The shutter is slower for what is far away, so that a streak is still long enough there
    // to show which way the wind goes, and quicker close by, where it would become a scratch
    // across the frame. Low over the film the inflow is slow: a longer exposure draws it out.
    float far = clamp(length(eye - head) / 9.0, 0.6, 2.3);
    float exposure = uExposure * far * mix(1.0 + 0.6 * far, 1.0, smoothstep(0.25, 1.2, head.y));
    tail = airSpeck(aSeed, age - exposure, uTime - exposure, fadeTail, flung);
    droplet = step(0.45, fract(aSeed.x * 91.7));
    // Gusts: what the wind picks up comes in bursts from one side or another, so the specks
    // travel in loose bands rather than as an even haze. A band is everything picked up at
    // about the same time and bearing.
    float born = uTime - age;
    float gust = vnoise(vec2(aSeed.w * 5.0 + born * 0.11, born * 0.45 + aSeed.w * 3.0));
    fade *= 0.12 + 0.88 * smoothstep(0.38, 0.68, gust);
  } else {
    float life = airSprayLife(aSeed);
    float age = fract(aSeed.z + uTime / life) * life;
    head = airSpray(aSeed, age, uTime, fade);
    float exposure = uExposure * 0.3 * clamp(length(eye - head) / 9.0, 0.6, 2.3);
    tail = airSpray(aSeed, age - exposure, uTime - exposure, fadeTail);
    droplet = 1.0;
  }

  vec4 clipHead = projectionMatrix * viewMatrix * vec4(head + uOrigin, 1.0);
  vec4 clipTail = projectionMatrix * viewMatrix * vec4(tail + uOrigin, 1.0);
  // Behind the eye, not alive, or out of the picture: cull, before the costly part.
  bool outside = max(abs(clipHead.x), abs(clipHead.y)) > 1.1 * clipHead.w && max(abs(clipTail.x), abs(clipTail.y)) > 1.1 * clipTail.w;
  if (clipHead.w < 0.3 || clipTail.w < 0.3 || fade <= 0.0 || outside) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  // The streak in pixels.
  vec2 a = clipTail.xy / clipTail.w, b = clipHead.xy / clipHead.w;
  vec2 d = (b - a) * 0.5 * uResolution;
  float len = length(d);
  vec2 dir = len > 1e-3 ? d / len : vec2(1.0, 0.0);
  float size = mix(0.004, 0.011, fract(aSeed.y * 57.3)) * mix(1.0, 0.5, aKind);      // metres across
  // One speck that stands for several is that much wider, and as much brighter again (below).
  float spreadOut = sqrt(boost);
  float px = size * spreadOut * projectionMatrix[1][1] * uResolution.y * 0.5 / clipHead.w;
  float halfW = clamp(px * 0.5, 0.6, 2.0);                   // never thinner than a pixel...
  float thin = clamp(px * 0.5 / 0.6, 0.38, 1.0);             // ...but fainter instead (yet never lost)
  thin *= smoothstep(0.8, 2.5, clipHead.w);                  // and gone before it smears across the lens
  vec2 corner = vec2(position.x * (len + 2.0 * halfW) - halfW, position.y * halfW);
  vLocal = corner;
  vShape = vec2(len, halfW);
  vec2 offsetPx = dir * corner.x + vec2(-dir.y, dir.x) * corner.y;
  gl_Position = vec4((a + offsetPx * 2.0 / uResolution) * clipHead.w, clipHead.z, clipHead.w);

  // ---- light ----
  vec3 toEye = normalize(eye - head);
  vec3 light = airSmallLight(head, toEye, mix(0.2, 0.5, droplet), uOrigin);
  vec3 albedo = mix(vec3(0.50, 0.46, 0.42), vec3(0.80, 0.90, 1.0), droplet);
  // A few droplets catch the light as they tumble.
  float glint = pow(saturate(sin(uTime * (3.0 + aSeed.x * 9.0) + aSeed.w * 40.0)), 12.0) * droplet;
  float bright = fract(aSeed.w * 23.1);
  float gain = (0.16 + 0.75 * bright * bright * bright + 2.0 * glint) * mix(1.0, 0.9, aKind);
  // The same light spread over a longer streak is fainter per pixel.
  float spread = min((2.0 * halfW) / (len + 2.0 * halfW), 0.4);
  float coverage = fade * thin * airSeen(head, eye) * max(spread * 3.6, 0.25) * min(boost / spreadOut, 2.5);
  // (they hide little of what is behind them: against the lit funnel, a swarm of opaque specks
  // reads as dirt on the cloud)
  vColor = vec4(light * albedo * gain, mix(0.16, 0.1, droplet)) * coverage;
}
`;

const FRAG = /* glsl */ `
${FRAG_PRELUDE}
varying vec2 vLocal;
varying vec2 vShape;
varying vec4 vColor;

void main() {
  // Distance to the streak's centre line, in half widths: a capsule with soft edges.
  float along = clamp(vLocal.x, 0.0, vShape.x);
  float dist = length(vec2(vLocal.x - along, vLocal.y)) / vShape.y;
  float a = saturate(1.0 - dist * dist);
  // A comet: bright at the head, fading away down the tail.
  float u = saturate(vLocal.x / max(vShape.x, 1e-3));
  a *= mix(0.06, 1.0, u * u);
  if (a <= 0.002) discard;
  gl_FragColor = vColor * a;
}
`;

/**
 * Builds the streak particles. counts = { specks, spray }.
 * `uniforms` must provide the shared uniforms plus uOrigin.
 */
export function createSpecks(ctx, uniforms, counts) {
  const total = counts.specks + counts.spray;
  const rng = ctx.rng(4107);
  const seeds = new Float32Array(total * 4);
  const kinds = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    for (let k = 0; k < 4; k++) seeds[i * 4 + k] = rng();
    kinds[i] = i < counts.specks ? 0 : 1;
  }
  // Shuffle so that lowering instanceCount for a lower quality thins both kinds evenly.
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    for (let k = 0; k < 4; k++) { const t = seeds[i * 4 + k]; seeds[i * 4 + k] = seeds[j * 4 + k]; seeds[j * 4 + k] = t; }
    const t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t;
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0], 3));
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
  geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(kinds, 1));
  geometry.instanceCount = total;

  const material = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uExposure: { value: 0.11 }, uBoost: { value: 1 } },
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
  mesh.userData.total = total;
  return mesh;
}
