import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FIELD_GLSL } from './field.glsl.js';
import { earthUniforms, EARTH_UNIFORMS_GLSL } from './rockMaterial.js';

// What still lives on the rock: tufts of dry grass on the old ground surface and its upper
// ledges, and the roots left dangling from the underside when the mass tore free.
// Both are instanced curves shaped in the vertex shader (so they can sway) and lit by a
// small hand-written model: sky, moon, afterglow (grass blades also let it shine through),
// fire, and the geode.

const LIGHT_GLSL = /* glsl */ `
${FIELD_GLSL}
${EARTH_UNIFORMS_GLSL}
// n: world normal of a thin, two-sided thing; through: how much light passes through it.
vec3 floraLight(vec3 p, vec3 n, vec3 viewDir, float sky, float glowVis, float through) {
  vec3 light = skyAmbient(n) * 0.32 * sky;
  light += uMoonColor * 0.5 * sky * (0.25 + 0.75 * abs(dot(n, uMoonDir)));
  vec3 glowDir = normalize(vec3(uSunDir.x, 0.16, uSunDir.z));
  // Seen against the afterglow a blade lights up from behind.
  float behind = spow(saturate(dot(viewDir, glowDir)), 3.0);
  light += vec3(1.0, 0.5, 0.24) * 0.37 * glowVis * (abs(dot(n, glowDir)) * 0.7 + 0.3 + through * behind * 2.5);
  vec3 toFire = uFireLightPos - p;
  light += uFireLightColor * 0.32 / (dot(toFire, toFire) + 1.0) * (0.4 + 0.6 * abs(dot(n, normalize(toFire))));
  vec3 fromHeart = normalize(p - uEarthHeart);
  float spill = max(smoothstep(0.05, 0.7, dot(fromHeart, uEarthMouth)), 0.25 * smoothstep(0.5, 0.95, fromHeart.y));
  vec3 d = uEarthLightPos[0] - p;
  light += uEarthLightColor[0] * (0.45 + 0.85 * heartbeat(0.0)) * spill * 0.32 / (dot(d, d) + 0.2);
  vec3 toFlash = uFlash.xyz - p;                               // lightning over the air element
  light += flashIntensity() * 0.32 / (dot(toFlash, toFlash) + 1.0) * (0.4 + 0.6 * abs(dot(n, normalize(toFlash))));
  return light;
}
`;

const GRASS_VERT = /* glsl */ `
${VERT_PRELUDE}
${LIGHT_GLSL}
attribute vec3 aRoot;       // rock space
attribute vec4 aLean;       // xyz: the direction the blade leans and curls toward, w: seed
attribute vec4 aBlade;      // height, width (m), sky visibility, afterglow visibility
varying vec3 vColor;
void main() {
  float t = position.y;                                         // 0 at the root, 1 at the tip
  vec3 root = (modelMatrix * vec4(aRoot, 1.0)).xyz;
  vec3 up = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));
  vec3 lean = mat3(modelMatrix) * aLean.xyz;
  // A light air moves the tips: two slow sines per blade, in step across each tuft.
  float gust = sin(uTime * 1.1 + root.x * 1.7 + root.z * 1.3) * 0.6 + sin(uTime * 2.3 + aLean.w * 40.0) * 0.4;
  vec3 sway = vec3(0.8, 0.0, 0.6) * gust * 0.12;
  vec3 curve = up * t + (lean + sway) * t * t;                  // the blade bends over toward its tip
  vec3 tangent = normalize(up + (lean + sway) * 2.0 * t);
  vec3 p = root + curve * aBlade.x;
  vec3 viewDir = normalize(p - cameraPosition);
  vec3 side = normalize(cross(tangent, viewDir));               // always turn the flat of the blade to the eye
  // A blade thinner than a pixel would flicker in and out between pixels as the camera
  // moves: from a distance it is drawn a pixel wide instead (fewer blades are drawn there).
  float pixel = distance(p, cameraPosition) * 2.0 / (projectionMatrix[1][1] * uResolution.y);   // metres per pixel at the blade
  p += side * position.x * max(aBlade.y, 1.1 * pixel) * (1.0 - t * t);
  vec3 n = normalize(cross(side, tangent));
  // Dry straw, greener at the base.
  vec3 tone = mix(vec3(0.16, 0.20, 0.07), vec3(0.42, 0.36, 0.17), smoothstep(0.1, 0.9, t + (aLean.w - 0.5) * 0.6));
  vColor = tone * floraLight(p, n, viewDir, aBlade.z, aBlade.w, 1.0) * (0.45 + 0.55 * t);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

const ROOT_VERT = /* glsl */ `
${VERT_PRELUDE}
${LIGHT_GLSL}
attribute vec3 aRoot;       // rock space
attribute vec4 aLean;       // xyz: the direction the root leaves the rock, w: seed
attribute vec4 aBlade;      // length, thickness (m), -, afterglow visibility
varying vec3 vColor;

// Centre line: leaves the rock along its direction, then hangs; kinked like a real root.
vec3 rootCurve(float t, vec3 start, vec3 dir, float len, float seed) {
  vec3 hang = dir * t * (1.0 - 0.6 * t) + vec3(0.0, -1.0, 0.0) * t * t * 0.8;
  vec3 kink = vec3(sin(t * 9.0 + seed * 30.0), 0.0, cos(t * 7.0 + seed * 50.0)) * 0.05 * t;
  vec3 sway = vec3(0.8, 0.0, 0.6) * sin(uTime * 0.8 + seed * 20.0) * 0.035 * t * t;
  return start + (hang + kink + sway) * len;
}
void main() {
  float t = position.y;
  vec3 start = (modelMatrix * vec4(aRoot, 1.0)).xyz;
  vec3 dir = mat3(modelMatrix) * aLean.xyz;
  vec3 c = rootCurve(t, start, dir, aBlade.x, aLean.w);
  vec3 tangent = normalize(rootCurve(t + 0.02, start, dir, aBlade.x, aLean.w) - c);
  vec3 u = normalize(cross(tangent, vec3(0.31, 0.12, 0.94)));
  vec3 v = cross(u, tangent);
  vec3 n = u * position.x + v * position.z;                     // the ring is a unit circle in xz
  vec3 p = c + n * aBlade.y * (1.0 - 0.85 * t);
  vColor = vec3(0.075, 0.055, 0.038) * floraLight(p, n, normalize(p - cameraPosition), 0.5, aBlade.w, 0.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

const FRAG = /* glsl */ `
${FRAG_PRELUDE}
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }
`;

function instanced(base, roots, leans, blades) {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', base.getAttribute('position'));
  geometry.setIndex(base.getIndex());
  geometry.setAttribute('aRoot', new THREE.InstancedBufferAttribute(new Float32Array(roots), 3));
  geometry.setAttribute('aLean', new THREE.InstancedBufferAttribute(new Float32Array(leans), 4));
  geometry.setAttribute('aBlade', new THREE.InstancedBufferAttribute(new Float32Array(blades), 4));
  geometry.instanceCount = roots.length / 3;
  // The instances are placed in the vertex shader: this sphere (rock space) holds the whole rock.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 3.2);
  return geometry;
}

function material(vertexShader, side) {
  return new THREE.ShaderMaterial({ uniforms: { ...shared, ...earthUniforms }, vertexShader, fragmentShader: FRAG, side });
}

/** A blade: a strip five rows tall, x in ±0.5, y from 0 to 1. The vertex shader tapers it. */
function bladeGeometry() {
  const position = [], index = [];
  const ROWS = 5;
  for (let r = 0; r < ROWS; r++) position.push(-0.5, r / (ROWS - 1), 0, 0.5, r / (ROWS - 1), 0);
  for (let r = 0; r < ROWS - 1; r++) index.push(r * 2, r * 2 + 1, r * 2 + 3, r * 2, r * 2 + 3, r * 2 + 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setIndex(index);
  return geometry;
}

/** A root: a five-sided tube of unit radius about +Y, y from 0 to 1. */
function tubeGeometry() {
  const position = [], index = [];
  const RINGS = 10, SIDES = 5;
  for (let r = 0; r < RINGS; r++) {
    for (let k = 0; k < SIDES; k++) {
      const a = (k / SIDES) * Math.PI * 2;
      position.push(Math.cos(a), r / (RINGS - 1), Math.sin(a));
    }
  }
  for (let r = 0; r < RINGS - 1; r++) {
    for (let k = 0; k < SIDES; k++) {
      const a = r * SIDES + k, b = r * SIDES + ((k + 1) % SIDES);
      index.push(a, a + SIDES, b + SIDES, a, b + SIDES, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setIndex(index);
  return geometry;
}

/** monolith: the result of buildMonolith. Returns { group, grass }: a Group in rock space and the grass mesh in it. */
export function buildFlora(ctx, monolith) {
  const rng = ctx.rng(2718);
  const { positions, normals, lamp, sky, glow } = monolith;
  const count = positions.length / 3;
  const group = new THREE.Group();
  const spaced = (list, v, least) => list.every((o) => Math.hypot(
    positions[o * 3] - positions[v * 3], positions[o * 3 + 1] - positions[v * 3 + 1], positions[o * 3 + 2] - positions[v * 3 + 2]) > least);

  // ---- grass: tufts on level, open ground high on the rock
  const ground = [];
  for (let v = 0; v < count; v++) {
    if (normals[v * 3 + 1] > 0.82 && positions[v * 3 + 1] > 0.85 && sky[v] > 0.75 && lamp[v] < 0.2) ground.push(v);
  }
  const tufts = [];
  for (let attempt = 0; attempt < 4000 && tufts.length < 85 && ground.length > 0; attempt++) {
    const v = ground[Math.floor(rng() * ground.length)];
    if (spaced(tufts, v, 0.11)) tufts.push(v);
  }
  const roots = [], leans = [], blades = [];
  for (const v of tufts) {
    const size = 0.07 + 0.15 * rng() * rng();
    const members = 9 + Math.floor(rng() * 8);
    for (let b = 0; b < members; b++) {
      const a = rng() * Math.PI * 2, spread = 0.035 * Math.sqrt(rng());
      roots.push(positions[v * 3] + Math.cos(a) * spread, positions[v * 3 + 1] - 0.01, positions[v * 3 + 2] + Math.sin(a) * spread);
      const out = 0.15 + 0.55 * rng();
      leans.push(Math.cos(a) * out, 0, Math.sin(a) * out, rng());
      blades.push(size * (0.55 + 0.6 * rng()), 0.004 + 0.004 * rng(), sky[v], Math.max(glow[v], 0.25));
    }
  }
  let grass = null;
  if (roots.length > 0) {
    grass = new THREE.Mesh(instanced(bladeGeometry(), roots, leans, blades), material(GRASS_VERT, THREE.DoubleSide));
    grass.userData.full = roots.length / 3;         // quality levels draw a leading part of the blades
    group.add(grass);
  }

  // ---- roots: hanging from the flanks of the torn underside
  const under = [];
  for (let v = 0; v < count; v++) {
    const y = positions[v * 3 + 1];
    if (y < -0.95 && y > -1.9 && normals[v * 3 + 1] < -0.25) under.push(v);
  }
  const hung = [];
  for (let attempt = 0; attempt < 2000 && hung.length < 26 && under.length > 0; attempt++) {
    const v = under[Math.floor(rng() * under.length)];
    if (spaced(hung, v, 0.16)) hung.push(v);
  }
  const rRoots = [], rLeans = [], rBlades = [];
  for (const v of hung) {
    rRoots.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
    rLeans.push(normals[v * 3] + (rng() - 0.5) * 0.6, normals[v * 3 + 1] * 0.5, normals[v * 3 + 2] + (rng() - 0.5) * 0.6, rng());
    rBlades.push(0.25 + 0.6 * rng() * rng(), 0.006 + 0.008 * rng(), 0, Math.max(glow[v], 0.3));
  }
  if (rRoots.length > 0) {
    const mesh = new THREE.Mesh(instanced(tubeGeometry(), rRoots, rLeans, rBlades), material(ROOT_VERT, THREE.DoubleSide));
    group.add(mesh);
  }
  return { group, grass };
}
