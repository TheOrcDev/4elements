import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FIELD_GLSL, FISSURE_NORMAL, FISSURE_OUT, GEODE_CENTRE, GEODE_RADII } from './field.glsl.js';
import { earthUniforms, EARTH_UNIFORMS_GLSL, FRAG_OCCLUSION, VERT_WATERLINE, lightsChunk, patch } from './rockMaterial.js';
import { sampleGrid } from './bake.js';

// The geode: quartz points growing inward from the wall of the hollow.
//
// Every crystal is an instance of one hexagonal prism with a six-sided termination. The
// vertex shader gives each instance its own termination (unequal faces, off-centre point),
// so no two are alike. The fragment shader is MeshStandardMaterial with flat facets (sharp
// reflections of the sky, glints from the moon and the fire) plus a small ray trace through
// the prism for everything that happens inside the stone.

const UP = new THREE.Vector3(0, 1, 0);
const REFLECTED = 170;                  // how many of the largest crystals the water film reflects

/**
 * Unit crystal: circumradius 1, length 1 along +Y, base ring at y = 0 left open. sides: 6 for
 * quartz as it is; 3 for the thumb-sized points of the druse, which are a few pixels across
 * at best and read the same with half the triangles.
 */
function crystalGeometry(sides) {
  const position = [];
  const vert = [];                      // x: 0 base ring, 1 shoulder ring, 2 tip; y: corner number
  const index = [];
  for (let ring = 0; ring < 2; ring++) {
    for (let k = 0; k < sides; k++) {
      const a = (k * Math.PI * 2) / sides;
      position.push(Math.cos(a), ring * 0.7, Math.sin(a));
      vert.push(ring, k);
    }
  }
  position.push(0, 1, 0);
  vert.push(2, 0);
  for (let k = 0; k < sides; k++) {
    const n = (k + 1) % sides;
    index.push(k, sides + k, sides + n, k, sides + n, n, sides + k, 2 * sides, sides + n);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('aVert', new THREE.Float32BufferAttribute(vert, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

const VERT_PARS = /* glsl */ `
${VERT_PRELUDE}
attribute vec2 aVert;               // x: 0 base ring, 1 shoulder ring, 2 tip; y: corner number
attribute vec4 aCrystal;            // seed, metres from the heart, glow, 1 inside the geode / 0 in the open
varying vec3 vCrysPos;              // metres in the crystal's own frame, y from the root along the axis
varying vec2 vCrysSize;             // circumradius and length in metres
varying vec3 vAxisX;
varying vec3 vAxisY;
varying vec3 vAxisZ;
varying vec4 vCrystal;
varying vec3 vEarthWorld;
`;

const VERT_MAIN = /* glsl */ `
{
  vec3 cx = instanceMatrix[0].xyz, cy = instanceMatrix[1].xyz, cz = instanceMatrix[2].xyz;
  float cw = length(cx), cl = length(cy);
  float seed = aCrystal.x;
  // The termination is as tall as the prism is wide (quartz faces meet the axis at ~38 degrees),
  // whatever the crystal's length; its six faces are unequal and the point sits off-centre.
  float term = clamp(cw * (0.95 + 0.5 * hash11(seed * 7.1 + 0.3)) / cl, 0.04, 0.8);
  if (aVert.x > 1.5) {
    transformed.xz = (hash22(vec2(seed, 4.4)) - 0.5) * 0.5;
  } else if (aVert.x > 0.5) {
    transformed.y = 1.0 - term * (0.6 + 0.8 * hash11(seed * 3.3 + aVert.y * 1.7));
    transformed.xz *= 0.90 + 0.10 * hash11(seed * 1.9 + 0.6);
  }
  vCrysPos = transformed * vec3(cw, cl, cw);
  vCrysSize = vec2(cw, cl);
  mat3 rot = mat3(modelMatrix);
  vAxisX = normalize(rot * cx);
  vAxisY = normalize(rot * cy);
  vAxisZ = normalize(rot * cz);
  vCrystal = aCrystal;
  vEarthWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
}
`;

const FRAG_PARS = /* glsl */ `
${FRAG_PRELUDE}
${FIELD_GLSL}
${EARTH_UNIFORMS_GLSL}
varying vec3 vCrysPos;
varying vec2 vCrysSize;
varying vec3 vAxisX;
varying vec3 vAxisY;
varying vec3 vAxisZ;
varying vec4 vCrystal;
varying vec3 vEarthWorld;

float earthOcclusion = 1.0;
float earthHeartVis = 1.0;
float earthMouthVis = 1.0;
// Crystals inside the hollow are out of reach of the afterglow and the fire.
vec3 earthDirGain(vec3 dirView) {
  vec3 d = transformDirectionByInverseViewMatrix(dirView, viewMatrix);
  float isGlow = smoothstep(0.90, 0.98, dot(d, normalize(vec3(uSunDir.x, 0.16, uSunDir.z))));
  return vec3(1.0 - isGlow * vCrystal.w * 0.9);
}
float earthPointVis(vec3 dirView) { return 1.0 - vCrystal.w * 0.9; }

// Far wall of the hexagonal prism along a ray inside it (crystal frame, xz plane).
// Returns the distance and writes the wall's outward normal.
const vec2 HEX_WALLS[6] = vec2[6](
  vec2(0.866025, 0.5), vec2(0.0, 1.0), vec2(-0.866025, 0.5), vec2(-0.866025, -0.5), vec2(0.0, -1.0), vec2(0.866025, -0.5));
float crystalWall(vec2 ro, vec2 rd, float apothem, out vec2 wall) {
  float tBest = 1e9;
  wall = vec2(1.0, 0.0);
  for (int k = 0; k < 6; k++) {
    vec2 n = HEX_WALLS[k];
    float along = dot(rd, n);
    if (along > 1e-4) {
      float t = (apothem - dot(ro, n)) / along;
      if (t < tBest) { tBest = t; wall = n; }
    }
  }
  return max(tBest, 0.0);
}
`;

const FRAG_SURFACE = /* glsl */ `
{
  vec3 Nw = transformDirectionByInverseViewMatrix(normal, viewMatrix);
  vec3 Vw = normalize(cameraPosition - vEarthWorld);
  mat3 frame = mat3(vAxisX, vAxisY, vAxisZ);                   // crystal frame -> world
  float seed = vCrystal.x;
  float enclosed = vCrystal.w;
  float along = saturate(vCrysPos.y / vCrysSize.y);            // 0 at the root, 1 at the point
  float beat = heartbeat(vCrystal.y);

  // ---- colour zoning: cloudy and pale at the root, deepest at the point; amethyst, some rose, some indigo
  float hue = hash11(seed * 5.7 + 0.9);
  vec3 deep = mix(vec3(0.48, 0.13, 0.66), vec3(0.70, 0.20, 0.60), smoothstep(0.55, 0.95, hue));
  deep = mix(deep, vec3(0.30, 0.15, 0.68), smoothstep(0.18, 0.0, hue));
  float zone = smoothstep(0.05, 0.8, along + (hash11(seed * 2.3 + 0.1) - 0.5) * 0.3);
  vec3 tint = mix(vec3(0.82, 0.76, 0.90), deep, zone);         // what ~8 cm of the stone lets through
  float milk = 1.0 - zone;

  // ---- inside the stone: refract in, bounce once off the far wall of the prism, leave
  vec3 rd = normalize(refract(-Vw, Nw, 1.0 / 1.55) * frame);   // world -> crystal frame
  vec3 ro = vCrysPos;
  float apothem = vCrysSize.x * 0.866;
  vec2 wall1, wall2;
  float t1 = crystalWall(ro.xz, rd.xz, apothem, wall1);
  vec3 p1 = ro + rd * t1;
  vec3 rd2 = reflect(rd, vec3(wall1.x, 0.0, wall1.y));
  float t2 = crystalWall(p1.xz - wall1 * 1e-4, rd2.xz, apothem, wall2);
  // (The colour deepens with the length of the path, up to a point: a stone as thick as an
  // arm would otherwise be black.)
  float path = min(t1 + t2, 6.0 * vCrysSize.x);
  vec3 transmit = exp(log(max(tint, vec3(0.02))) * min(path / 0.08, 2.6));
  // Leaving through the second wall bends the ray, more for blue than for red: dispersion.
  vec3 wall3 = vec3(wall2.x, 0.0, wall2.y);
  vec3 outR = frame * normalize(rd2 + wall3 * 0.26);
  vec3 outG = frame * normalize(rd2 + wall3 * 0.34);
  vec3 outB = frame * normalize(rd2 + wall3 * 0.44);

  // What the ray meets outside: the sky if it leaves through the mouth of the geode (or the
  // crystal stands in the open), otherwise the dim glow of the other crystals.
  float glow = vCrystal.z * (0.42 + 1.45 * beat);
  vec3 lamp = vec3(0.60, 0.19, 1.0) * glow;                    // the light at the crystal's root
  float open = mix(1.0, smoothstep(0.15, 0.8, dot(outG, uEarthMouth)), enclosed);
  vec3 sky = vec3(envColor(outR, 0.12).r, envColor(outG, 0.12).g, envColor(outB, 0.12).b);
  vec3 toHeart = uEarthHeart - vEarthWorld;
  vec3 heartDir = normalize(toHeart + vec3(0.0, 1e-4, 0.0));
  vec3 moonHit = vec3(dot(outR, uMoonDir), dot(outG, uMoonDir), dot(outB, uMoonDir));
  vec3 heartHit = vec3(dot(outR, heartDir), dot(outG, heartDir), dot(outB, heartDir));
  // Inside the hollow a facet is bright when its internal bounce heads back toward the heart
  // and dark otherwise, which is what makes neighbouring faces differ and change with the view.
  vec3 seen = mix(lamp * (0.08 + 0.9 * spow(max(heartHit.g, 0.0), 3.0)), sky, open);

  // Sharp internal glints: the moon and the heart of the geode mirrored by the far wall, each
  // colour at its own angle.
  seen += uMoonColor * spow(moonHit, 700.0) * 26.0 * open;
  seen += vec3(0.75, 0.42, 1.0) * spow(heartHit, 120.0) * (0.6 + beat) * 3.0 / (dot(toHeart, toHeart) + 0.2);

  // The root light itself, seen down the length of the stone, and scattered by the cloudy
  // quartz: brightest at the root and fading toward the point, whatever the stone's length.
  float toRoot = ro.y / max(-rd.y, 0.04);
  vec3 rootSeen = lamp * exp(log(max(tint, vec3(0.02))) * (min(toRoot / vCrysSize.y, 1.5) * 1.6)) * smoothstep(0.05, -0.3, rd.y);
  // (Scattered light takes on the stone's own colour on its way up from the pale root.)
  vec3 scattered = lamp * exp(-along * 2.4) * (0.16 + 0.4 * milk) * mix(vec3(1.0), deep * 1.6, zone);

  // Veils and healed fractures hang inside the stone: sampled half-way along the path, so
  // they slide against the facets as the view changes.
  vec3 mid = ro + rd * (t1 * 0.5);
  float veil = noiseTex(mid * vec3(5.0, 2.2, 5.0) / max(vCrysSize.x * 8.0, 0.2) + seed * 0.37).r;
  transmit *= 0.55 + 0.9 * veil;
  scattered *= 0.6 + 0.8 * veil;
  // No two faces of a real crystal pass the same share of the light inside it: each face of
  // the prism and of the termination gets its own (the faces are numbered round the axis).
  vec3 Nc = Nw * frame;
  float face = floor(atan(Nc.z, Nc.x) / 1.0471976 + 0.5) + 7.0 * step(0.3, Nc.y);
  float faceGain = 0.4 + 1.2 * hash11(face * 3.17 + seed * 1.3);

  float fresnel = 0.045 + 0.955 * spow(1.0 - max(dot(Nw, Vw), 0.0), 5.0);
  vec3 inner = ((seen * transmit + scattered) * faceGain + rootSeen * 1.6) * (1.0 - fresnel);

  // Edges between facets gather the light travelling inside the stone.
  if (abs(vCrysPos.x) + abs(vCrysPos.z) > 1e-5) {
    float radial = length(vCrysPos.xz);
    float corner = abs(fract(atan(vCrysPos.z, vCrysPos.x) / 1.0471976 + 0.5) - 0.5) * 1.0471976 * radial;
    float edge = 1.0 - smoothstep(0.0, 0.002 + 0.03 * vCrysSize.x, corner);
    inner += (lamp * 0.22 + seen * 0.4) * edge * mix(1.0, 0.35, along);
  }

  // Flecks of pyrite caught in the faces flash gold in the moonlight and in the geode's own light.
  if (uIsMirrorPass < 0.5) {
    vec3 cell = floor(vCrysPos * 260.0) + seed;
    if (hash13(cell) > 0.93) {
      vec3 facet = normalize(Nw * 1.2 + (hash33(cell + 3.7) - 0.5) * 1.3);
      float flash = spow(dot(facet, normalize(uMoonDir + Vw)), 50.0) * open * 6.0
                  + spow(dot(facet, normalize(heartDir + Vw)), 30.0) * (0.5 + beat) * 2.5 / (dot(toHeart, toHeart) + 0.3);
      inner += vec3(1.0, 0.68, 0.22) * flash;
    }
  }

  diffuseColor.rgb = mix(vec3(0.030, 0.016, 0.050), vec3(0.30, 0.27, 0.33), milk * 0.7);
  roughnessFactor = 0.07 + 0.10 * hash11(seed * 4.1 + 0.5) + 0.25 * milk * milk;
  totalEmissiveRadiance += inner;
  // The hollow sees little of the sky, least of all at the roots.
  earthOcclusion = mix(1.0, mix(0.22, 0.6, along), enclosed);
}
`;

function createCrystalMaterial() {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0, flatShading: true });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, earthUniforms);
    shader.vertexShader = patch(shader.vertexShader, '#include <common>', `#include <common>\n${VERT_PARS}`);
    shader.vertexShader = patch(shader.vertexShader, '#include <begin_vertex>', `#include <begin_vertex>\n${VERT_MAIN}`);
    shader.vertexShader = patch(shader.vertexShader, '#include <project_vertex>', `#include <project_vertex>\n${VERT_WATERLINE}`);
    let f = shader.fragmentShader;
    f = patch(f, '#include <common>', `#include <common>\n${FRAG_PARS}`);
    f = patch(f, '#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${FRAG_SURFACE}`);
    f = patch(f, '#include <lights_fragment_begin>', lightsChunk());
    f = patch(f, '#include <aomap_fragment>', FRAG_OCCLUSION);
    shader.fragmentShader = f;
  };
  return material;
}

/** Collects crystal instances and turns them into an InstancedMesh. */
export class CrystalSet {
  constructor() {
    this.matrices = [];
    this.data = [];
    this.lengths = [];
    this._q = new THREE.Quaternion();
    this._roll = new THREE.Quaternion();
    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
  }

  /** base: where the crystal leaves the rock, axis: unit growth direction, width: circumradius, length: metres. */
  add(base, axis, width, length, { seed, heartDist, glow, enclosed, roll }) {
    this._q.setFromUnitVectors(UP, axis).multiply(this._roll.setFromAxisAngle(UP, roll));
    this._p.copy(base).addScaledVector(axis, -0.2 * length);          // the root is buried in the wall
    this._m.compose(this._p, this._q, this._s.set(width, length * 1.2, width));
    this.matrices.push(...this._m.elements);
    this.data.push(seed, heartDist, glow, enclosed);
    this.lengths.push(length);
  }

  get count() { return this.data.length / 4; }

  /** A new set holding this one's n longest crystals (all of them by default), longest first. */
  largest(n = this.count) {
    return this._pick(this.lengths.map((_, i) => i).sort((a, b) => this.lengths[b] - this.lengths[a]).slice(0, n));
  }

  /** A new set holding the same crystals in random order, so that any leading part of it is an even thinning of the whole. */
  shuffled(rng) {
    const order = this.lengths.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    return this._pick(order);
  }

  _pick(order) {
    const set = new CrystalSet();
    for (const i of order) {
      set.matrices.push(...this.matrices.slice(i * 16, i * 16 + 16));
      set.data.push(...this.data.slice(i * 4, i * 4 + 4));
      set.lengths.push(this.lengths[i]);
    }
    return set;
  }

  /** The crystals cast no shadows: they are too small for the moon's shadow map to resolve. */
  build(geometry, material) {
    const g = geometry.clone();
    g.setAttribute('aCrystal', new THREE.InstancedBufferAttribute(new Float32Array(this.data), 4));
    const mesh = new THREE.InstancedMesh(g, material, this.count);
    mesh.instanceMatrix.array.set(this.matrices);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    mesh.userData.full = this.count;               // quality levels draw a leading part of the set
    return mesh;
  }
}

/**
 * Grows the geode on the monolith. monolith: the result of buildMonolith (rock-space vertex
 * positions and normals, per-vertex visibility of the heart, the distance grid).
 * Returns { points, druse, reflected, geometry, material }: InstancedMeshes in rock space (the
 * crystals of some size, the carpet of small ones, and the largest again for the reflection)
 * plus the shared geometry and material, so more crystals can be scattered elsewhere.
 */
export function buildGeode(ctx, monolith) {
  const rng = ctx.rng(4242);
  const { positions, normals, lamp, grid } = monolith;
  const count = positions.length / 3;
  const C = new THREE.Vector3(...GEODE_CENTRE);
  const N = new THREE.Vector3(...FISSURE_NORMAL);
  const D = new THREE.Vector3(...FISSURE_OUT);
  const [rn, ry, rd] = GEODE_RADII;

  // Sort the monolith's vertices into the places crystals grow.
  const hollow = [];       // the wall of the geode itself
  const depthOf = new Float32Array(count);   // for those: 0 at the mouth and roof … 1 on the floor and at the back
  const cleft = [];        // the fissure walls above and below it
  const under = [];        // the torn underside
  const p = new THREE.Vector3(), n = new THREE.Vector3(), rel = new THREE.Vector3();
  for (let v = 0; v < count; v++) {
    p.fromArray(positions, v * 3);
    n.fromArray(normals, v * 3);
    rel.subVectors(p, C);
    const qn = rel.dot(N), qd = rel.dot(D);
    // The hollow, widened by the gape of the fissure that cut it in two.
    const e = Math.hypot(qn / (rn + 0.17), rel.y / (ry + 0.07), qd / (rd + 0.05));
    const facing = -n.dot(rel) / (rel.length() + 1e-6);
    if (lamp[v] > 0.5 && e < 1.04 && facing > 0.1) {
      hollow.push(v);
      depthOf[v] = Math.min(1, Math.max(0, Math.max(0.35 - qd / rd, -0.15 - rel.y / ry) * 1.25));
    } else if (lamp[v] > 0.35 && Math.abs(n.dot(N)) > 0.45 && Math.abs(qn) < 0.5 && rel.length() < 2.4) {
      cleft.push(v);
    } else if (p.y < -1.25 && n.y < -0.35) {
      under.push(v);
    }
  }

  const points = new CrystalSet();   // everything of some size
  const druse = new CrystalSet();    // the carpet of small ones
  const base = new THREE.Vector3(), axis = new THREE.Vector3(), tip = new THREE.Vector3(), jitter = new THREE.Vector3();
  const randomUnit = (out) => {
    const z = rng() * 2 - 1, a = rng() * Math.PI * 2, r = Math.sqrt(1 - z * z);
    return out.set(r * Math.cos(a), z, r * Math.sin(a));
  };
  // Grow one crystal from vertex v. spread: how far the axis strays from the wall normal;
  // lean: an extra pull on the axis (toward the mouth, upward). Shortened until its point is in open air.
  const grow = (set, v, length, slender, spread, lean, glow, enclosed, offset = 0) => {
    base.fromArray(positions, v * 3);
    n.fromArray(normals, v * 3);
    axis.copy(n).addScaledVector(randomUnit(jitter), spread);
    if (lean) axis.add(lean);
    axis.normalize();
    if (offset > 0) base.addScaledVector(randomUnit(jitter).projectOnPlane(n), offset);
    if (enclosed > 0) {
      // Points grow toward the middle of the hollow but leave it open: none may reach its axis.
      rel.subVectors(base, C);
      const toAxis = Math.hypot(rel.dot(N), rel.y);
      length = Math.min(length, Math.max(0.04, toAxis * 0.8));
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      tip.copy(base).addScaledVector(axis, length);
      if (length < 0.1 || sampleGrid(grid, tip.x, tip.y, tip.z) > 0.03) break;
      length *= 0.72;
    }
    // Inside the hollow the light is strongest deep down and at the back, and fades toward the mouth.
    const lit = enclosed > 0 ? glow * (0.3 + 0.95 * depthOf[v]) : glow;
    set.add(base, axis, length * slender, length, {
      seed: rng() * 97 + 1, heartDist: base.distanceTo(C), glow: lit, enclosed, roll: rng() * Math.PI * 2,
    });
  };
  const pick = (list) => list[Math.floor(rng() * list.length)];
  // A vertex of the hollow at least `least` deep.
  const pickDeep = (least) => {
    for (let attempt = 0; attempt < 400; attempt++) {
      const v = pick(hollow);
      if (depthOf[v] >= least) return v;
    }
    return pick(hollow);
  };
  const lean = new THREE.Vector3();

  if (hollow.length > 0) {
    // The druse: thousands of thumb-sized points carpeting the wall.
    for (let i = 0; i < 1900; i++) grow(druse, pick(hollow), 0.035 + 0.075 * rng() * rng(), 0.30 + 0.14 * rng(), 0.4, null, 0.30, 1);
    // Clusters of hand-sized points, thinning toward the mouth so that it stays open to the eye.
    for (let c = 0; c < 110; c++) {
      const v = pickDeep(0.6 * rng());
      const size = 0.08 + 0.10 * rng();
      const members = 3 + Math.floor(rng() * 5);
      for (let m = 0; m < members; m++) grow(points, v, size * (0.55 + 0.6 * rng()), 0.24 + 0.10 * rng(), 0.5, null, 0.55, 1, 0.045);
    }
    // Larger groups low and at the back, leaning a little toward the mouth.
    for (let c = 0; c < 26; c++) {
      const v = pickDeep(0.45);
      const members = 2 + Math.floor(rng() * 3);
      for (let m = 0; m < members; m++) {
        lean.copy(D).multiplyScalar(0.2).addScaledVector(UP, 0.2);
        grow(points, v, 0.18 + 0.15 * rng(), 0.24 + 0.07 * rng(), 0.32, lean, 1.1, 1, 0.06);
      }
    }
    // The heart: a few great points rising from the floor, where the light is born.
    for (let c = 0; c < 5; c++) {
      lean.copy(D).multiplyScalar(0.15).addScaledVector(UP, 0.35);
      grow(points, pickDeep(0.8), 0.36 + 0.16 * rng(), 0.25 + 0.05 * rng(), 0.2, lean, 1.8, 1, 0.05);
    }
  }
  // The fissure walls are crusted too, thinning away from the heart.
  for (let i = 0; i < 2000 && cleft.length > 0; i++) {
    const v = pick(cleft);
    const far = p.fromArray(positions, v * 3).distanceTo(C);
    if (rng() > Math.exp(-far * 1.4) * 1.6) continue;
    grow(druse, v, 0.03 + 0.07 * rng() * rng(), 0.30 + 0.14 * rng(), 0.45, null, 0.22 * Math.exp(-far * 0.7), 1);
  }
  // A few clusters hang from the underside.
  for (let c = 0; c < 7 && under.length > 0; c++) {
    const v = pick(under);
    const members = 3 + Math.floor(rng() * 4);
    for (let m = 0; m < members; m++) grow(points, v, 0.04 + 0.07 * rng(), 0.24 + 0.10 * rng(), 0.6, null, 0.18, 0, 0.03);
  }

  const geometry = crystalGeometry(6);
  const material = createCrystalMaterial();
  return {
    // Longest first: from across the ring only a leading part of the points is drawn.
    points: points.largest().build(geometry, material),
    druse: druse.shuffled(rng).build(crystalGeometry(3), material),
    reflected: points.largest(REFLECTED).build(geometry, material),
    geometry,
    material,
  };
}
