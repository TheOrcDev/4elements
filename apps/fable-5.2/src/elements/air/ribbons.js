import * as THREE from 'three';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FLOW_GLSL } from './flow.js';
import { PATH_GLSL } from './paths.js';

// Vapour trails: a few dozen thin, camera-facing ribbons, each the last few seconds of the
// path of one parcel of air (the same paths the specks follow, see paths.js). In a steady
// flow a trail lies along a streamline, so the ribbons draw the helix itself: in along the
// water, round and up the funnel, out under the cloud.

const SEGMENTS = 56;

const VERT = /* glsl */ `
${VERT_PRELUDE}
${FLOW_GLSL}
${PATH_GLSL}

attribute vec4 aSeed;
attribute vec2 aParam;      // x: 0 at the head of the trail .. 1 at its tail, y: side (-1 / +1)
uniform vec3 uOrigin;
varying vec3 vUvSeed;       // x along, y across, z a random number for this ribbon
varying vec4 vColor;
varying float vViewZ;

void main() {
  float period = airSpeckPeriod(aSeed);
  float age = fract(aSeed.z + uTime / period) * period;
  float duration = mix(1.8, 3.6, fract(aSeed.x * 19.3));          // seconds of trail
  float back = aParam.x * duration;
  float fade, fadeNext, flung, flungNext;
  // The whole trail is drawn around the centre line as it stands now: the vapour sways with it.
  vec3 p = airSpeck(aSeed, age - back, uTime, fade, flung);
  vec3 pNext = airSpeck(aSeed, age - back + 0.05, uTime, fadeNext, flungNext);

  vec3 toEye = normalize(cameraPosition - uOrigin - p);
  vec3 tangent = pNext - p;
  vec3 sideDir = cross(tangent, toEye);
  float sideLen = length(sideDir);
  sideDir = sideLen > 1e-5 ? sideDir / sideLen : vec3(0.0);
  // Thin at both ends, and broader up where the funnel and its eddies are broader.
  float taper = sin(PI * pow(aParam.x, 0.6));
  float width = mix(0.07, 0.2, fract(aSeed.y * 23.7)) * (0.7 + 0.3 * airRadius(p.y)) * taper;
  vec3 world = p + uOrigin + sideDir * aParam.y * width;
  vec4 mv = viewMatrix * vec4(world, 1.0);
  vViewZ = -mv.z;
  gl_Position = projectionMatrix * mv;

  vUvSeed = vec3(aParam, aSeed.w);
  vec3 light = airSmallLight(p, toEye, 0.3, uOrigin);
  float along = smoothstep(0.0, 0.1, aParam.x) * pow(1.0 - aParam.x, 1.4);
  // A trail that has not been born yet at this age collapses onto its start: hide it.
  // It thins away once the parcel is thrown out under the cloud.
  float alive = fade * step(back, age) * (1.0 - smoothstep(0.0, 1.2, flung));
  float coverage = along * alive * airSeen(p, cameraPosition - uOrigin) * mix(0.5, 1.0, fract(aSeed.w * 7.9));
  vColor = vec4(light * vec3(0.80, 0.88, 1.0) * 1.4, 0.6) * coverage * 0.13;
}
`;

const FRAG = /* glsl */ `
${FRAG_PRELUDE}
varying vec3 vUvSeed;
varying vec4 vColor;
varying float vViewZ;

void main() {
  float across = 1.0 - vUvSeed.y * vUvSeed.y;
  // Wisps: the trail thins and thickens along its length and frays into strands toward its edges.
  vec2 w = vec2(vUvSeed.x * 9.0 + vUvSeed.z * 53.0, vUvSeed.y * 1.3 + vUvSeed.z * 17.0);
  float wisp = vnoise(w) * 0.6 + vnoise(w * vec2(2.7, 3.1) + 7.3) * 0.4;
  float a = across * across * smoothstep(0.25, 0.85, wisp + across * 0.25) * softFade(vViewZ, 0.3);
  if (a <= 0.003) discard;
  gl_FragColor = vColor * a;
}
`;

/** Builds the ribbons as one merged strip mesh. `uniforms` must provide the shared uniforms plus uOrigin. */
export function createRibbons(ctx, uniforms, count) {
  const rng = ctx.rng(2203);
  const vertsPer = (SEGMENTS + 1) * 2;
  const seeds = new Float32Array(count * vertsPer * 4);
  const params = new Float32Array(count * vertsPer * 2);
  const index = [];
  for (let r = 0; r < count; r++) {
    // Close to the wall (seed.y -> orbit) and picked up not far from the foot (seed.x).
    const seed = [rng() * 0.6, rng() * 0.6, rng(), rng()];
    for (let j = 0; j <= SEGMENTS; j++) {
      for (let side = 0; side < 2; side++) {
        const v = r * vertsPer + j * 2 + side;
        seeds.set(seed, v * 4);
        params[v * 2] = j / SEGMENTS;
        params[v * 2 + 1] = side * 2 - 1;
      }
      if (j < SEGMENTS) {
        const a = r * vertsPer + j * 2;
        index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  // three.js wants a position attribute for the vertex count; the shader ignores it.
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * vertsPer * 3), 3));
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4));
  geometry.setAttribute('aParam', new THREE.Float32BufferAttribute(params, 2));
  geometry.setIndex(index);

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
  mesh.userData.indicesPerRibbon = SEGMENTS * 6;
  mesh.userData.total = count;
  return mesh;
}
