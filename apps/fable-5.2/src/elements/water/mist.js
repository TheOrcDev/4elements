import * as THREE from 'three';
import { LAYERS } from '../../core/layers.js';
import { createVolumeMaterial, VOLUME_VERT } from '../../core/materials.js';
import { FRAG_PRELUDE } from '../../core/glsl/index.js';
import { RADIUS, glslFloat as f } from './waves.js';

// A low collar of mist where the column meets the film: cold sea air spilling off the
// wall, pooling on the water and creeping outward. Drawn on the LATE layer so it lies in
// front of the lower wall instead of being painted over by the body; the far half of the
// ring is hidden by the column, which the shader knows analytically.
//
// The mist is a layer whose density falls off exponentially with height, so the vertical
// part of the integral along a ray is done in closed form and only the slow horizontal
// variation is sampled: a handful of taps, and no step noise.

const REACH = 2.3;      // how far the collar spreads from the wall (m)
const HEIGHT = 0.8;     // top of the proxy; the layer itself is a hand or two deep

const MIST_FRAG = /* glsl */ `
${FRAG_PRELUDE}
uniform vec3 uOrigin;
varying vec3 vWorldPos;

// x = how much mist stands over the film at this spot, y = scale height of the layer (m).
// turn = the slow rotation of the pattern round the column.
vec2 mistColumn(vec2 x, mat2 turn) {
  float r = length(x);
  float out01 = (r - ${f(RADIUS)}) / ${f(REACH)};
  // Thick at the wall, thinning outward.
  float ring = smoothstep(-0.02, 0.04, out01) * sq(1.0 - saturate(out01));
  // The pattern creeps outward and turns slowly round the column. It is read on a cone
  // (direction round the column, distance out along it), so features stretch into tongues
  // that run away from the wall instead of sitting in blots. One fetch: the coarse channel
  // shapes the wisps, the fine one frays them.
  vec4 n = noiseTexLod(vec3(turn * (x / max(r, 1e-3)) * 0.33, r * 0.075 - uTime * 0.012), 0.0);
  float wisps = smoothstep(0.30, 0.78, n.r + (n.b - 0.5) * 0.5) + 0.05;
  return vec2(ring * wisps, 0.06 + 0.26 * n.g * (1.0 - 0.6 * saturate(out01)));
}

void main() {
  vec3 ro = cameraPosition - uOrigin;
  vec3 rd = normalize(vWorldPos - cameraPosition);
  vec2 slab = cylinderIntersect(ro, rd, vec3(0.0), ${f(RADIUS + REACH)}, 0.0, ${f(HEIGHT)});
  float t0 = max(slab.x, 0.0);
  float t1 = min(slab.y, sceneRayDistance(screenUV(), rd));
  // The column stands in the middle of the ring and hides whatever mist lies behind it.
  vec2 column = cylinderIntersect(ro, rd, vec3(0.0), ${f(RADIUS)}, 0.0, 3.0);
  if (column.x < column.y && column.x > 0.0) t1 = min(t1, column.x);
  if (t1 <= t0) discard;

  // What lights the mist: sky and moon everywhere, the afterglow mostly when looked at
  // against it, the pyre and lightning by distance (they are far enough for one value to
  // serve the whole ray), and close to the wall the glow of the water itself.
  vec3 glowDir = normalize(vec3(uSunDir.x, 0.0, uSunDir.z));
  vec3 mid = ro + rd * (0.5 * (t0 + t1));
  vec3 toFire = uFireLightPos - uOrigin - mid;
  vec3 toFlash = uFlash.xyz - uOrigin - mid;
  vec3 base = skyAmbient(vec3(0.0, 1.0, 0.0)) * 1.3 + uMoonColor * 0.16
            + uSunColor * (0.04 + 0.5 * pow(saturate(dot(rd, glowDir)), 4.0))
            + uFireLightColor / (dot(toFire, toFire) + 1.0) * 0.5
            + flashIntensity() / (4.0 * PI * (dot(toFlash, toFlash) + 1.0));
  float spin = uTime * 0.02;
  mat2 turn = mat2(cos(spin), sin(spin), -sin(spin), cos(spin));

  // Evenly spaced taps, deliberately not dithered: the layer is smooth enough that fixed
  // taps give a smooth picture, where dither would only trade it for grain.
  int taps = uIsMirrorPass > 0.5 ? 3 : 4;
  float dt = (t1 - t0) / float(taps);
  float tau = 0.0;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < taps; i++) {
    float ta = t0 + dt * float(i);
    vec3 p = ro + rd * (ta + dt * 0.5);
    vec2 m = mistColumn(p.xz, turn);
    // Optical depth of this stretch: density exp(-y / L) integrated exactly along the ray.
    float ya = max(ro.y + rd.y * ta, 0.0), yb = max(ro.y + rd.y * (ta + dt), 0.0);
    float dy = yb - ya;
    float mean = abs(dy) > 1e-4 ? m.y * (exp(-ya / m.y) - exp(-yb / m.y)) / dy : exp(-ya / m.y);
    float depth = 1.15 * m.x * mean * dt;
    vec3 light = base + vec3(0.03, 0.26, 0.26) * exp(-(length(p.xz) - ${f(RADIUS)}) * 1.7);
    sum += light * (1.0 - exp(-depth)) * exp(-tau);
    tau += depth;
  }
  float alpha = 1.0 - exp(-tau);
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(sum, alpha);
}
`;

export function createMist(origin) {
  const geometry = new THREE.CylinderGeometry(RADIUS + REACH, RADIUS + REACH, HEIGHT, 40, 1, false);
  geometry.translate(0, HEIGHT / 2, 0);
  // The camera never comes this low this close, so front faces always cover the ring.
  const material = createVolumeMaterial({
    vertexShader: VOLUME_VERT,
    fragmentShader: MIST_FRAG,
    uniforms: { uOrigin: { value: origin.clone() } },
    side: THREE.FrontSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.layers.set(LAYERS.LATE);
  return mesh;
}
