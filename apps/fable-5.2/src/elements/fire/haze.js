import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FIRE_GLSL, REFRACT_VERT } from './common.js';

// Heat haze: the column of hot gas above the fire bends the light that crosses it.
// A cylinder on the REFRACT layer re-samples the finished scene behind it at screen
// positions pushed around by a rising noise field. It is strongest through the middle of
// the column, where the flame gives way to clear hot gas, fades to nothing at the sides and
// thins out with height. The bend is an angle: it moves what is far behind the column and
// leaves alone what stands in it.
//
// Anything on the REFRACT layer costs the frame a full-size copy of itself, which is a lot
// for a shimmer of a few pixels. So the element fades the haze out with distance (uHazeFade)
// and hides the mesh where it has faded away or is out of view (see index.js).

// (wide enough to hold the column when a gust leans it over)
const HAZE_R = 2.6;
const HAZE_Y0 = 0.9;
const HAZE_Y1 = 9.5;

/** Bounding sphere of the hazy column, local space: [x, y, z, radius]. */
export const HAZE_BOUNDS = [0, (HAZE_Y0 + HAZE_Y1) / 2, 0, Math.hypot(HAZE_R, (HAZE_Y1 - HAZE_Y0) / 2) + 0.2];

const HAZE_FRAG = /* glsl */ `
${FRAG_PRELUDE}
${FIRE_GLSL}
uniform float uHazeFade;         // 1 close by, 0 from so far away that the shimmer would be lost
varying vec3 vWorldPos;

// Largest angle, in radians, by which the hot gas turns a ray that crosses the column.
const float HAZE_ANGLE = 0.013;

void main() {
  vec2 uv = screenUV();
  vec3 ro = cameraPosition - uFireOrigin;
  vec3 rd = normalize(vWorldPos - cameraPosition);
  vec2 hit = cylinderIntersect(ro, rd, vec3(0.0), ${HAZE_R.toFixed(2)}, ${HAZE_Y0.toFixed(2)}, ${HAZE_Y1.toFixed(2)});
  float t0 = max(hit.x, 0.0);
  float chord = hit.y - t0;
  if (chord <= 0.0) discard;

  // Take the hot column at the middle of the chord: is it inside the plume, and how hot?
  // The shimmer is strongest where the flame gives way to clear hot gas, and thins out above.
  vec3 mid = ro + rd * (t0 + 0.5 * chord);
  float h = max(mid.y - FIRE_Y0, 0.0);
  vec2 off = mid.xz - fireLean(h);
  float R = firePlumeRadius(h) * 1.25;
  float core = saturate(1.0 - dot(off, off) / (R * R));
  float heat = core * core * smoothstep(0.3, 3.4, h) * exp(-max(h - 4.5, 0.0) * 0.22)
             * (1.0 - smoothstep(7.4, 8.8, h)) * (0.75 + 0.35 * uFireState.x) * uHazeFade;
  // Outside the hot column the picture stays as it is.
  if (heat < 0.003) discard;

  // Cells of hot and cooler gas, rising with the plume and drawn out along it.
  float s = fireTravelTime(h) - uTime;
  vec3 q = vec3(mid.x * 0.55, s * 0.9, mid.z * 0.55);
  vec4 n = noiseTexLod(q, 0.0);
  vec4 n2 = noiseTexLod(q * 1.4 + 0.37, 0.0);
  vec2 bend = (vec2(n.r, n.b) - 0.5) * 1.4 + (vec2(n2.b, n2.r) - 0.5) * 0.8;

  // The gas turns the ray by an angle. What stands far behind the column is displaced by
  // that whole angle whatever the distance it is seen from; what stands at the column (the
  // timbers in the fire) hardly at all: the displacement goes with D / (D + d), the share of
  // the path that lies beyond the column.
  vec2 shift = bend * heat * HAZE_ANGLE / (2.0 * uProjectionMatrixInverse[1][1]);
  shift.x *= uResolution.y / uResolution.x;
  float zColumn = max(dot(mid - ro, cameraForward()), 0.3);
  float beyond = saturate(1.0 - zColumn / sceneViewZ(uv));
  // Nor may anything nearer be dragged across the background from the place we sample.
  beyond = min(beyond, saturate(1.0 - zColumn / sceneViewZ(uv + shift * beyond)));
  gl_FragColor = vec4(texture2D(uSceneColor, uv + shift * beyond).rgb, 1.0);
}
`;

/** The heat-haze proxy, on the REFRACT layer. */
export function createHaze(ctx, fireUniforms) {
  const height = HAZE_Y1 - HAZE_Y0;
  const geometry = new THREE.CylinderGeometry(HAZE_R, HAZE_R, height, 24, 1, false);
  geometry.translate(0, HAZE_Y0 + height / 2, 0);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fireUniforms, uHazeFade: { value: 1 } },
    vertexShader: REFRACT_VERT,          // folds the mesh away in the mirror pass: no scene to bend there
    fragmentShader: HAZE_FRAG,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'heat-haze';
  // Draw before other refractive surfaces: they sample the scene as it was before this
  // stage, so whatever is drawn later simply replaces the haze where the two overlap.
  mesh.renderOrder = -100;
  mesh.layers.set(ctx.LAYERS.REFRACT);
  return mesh;
}
