import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export const perlin = new ImprovedNoise();

/** fbm on top of ImprovedNoise, roughly in [-1, 1]. */
export function fbm(x, y, z, octaves = 4, lacunarity = 2.0, gain = 0.5) {
  let a = 1;
  let f = 1;
  let s = 0;
  let n = 0;
  for (let i = 0; i < octaves; i++) {
    s += a * perlin.noise(x * f + i * 17.3, y * f + i * 9.1, z * f + i * 4.7);
    n += a;
    a *= gain;
    f *= lacunarity;
  }
  return s / n;
}

/**
 * Instanced quad: one shared unit quad, plus per-instance attributes.
 * attrs: { name: { array: Float32Array, size: number } }
 */
export function createInstancedQuad(count, attrs) {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.getAttribute('position'));
  geo.setAttribute('uv', base.getAttribute('uv'));
  for (const [name, { array, size }] of Object.entries(attrs)) {
    geo.setAttribute(name, new THREE.InstancedBufferAttribute(array, size));
  }
  geo.instanceCount = count;
  return geo;
}

/** Float32Array of `count * size` random values in [0,1). */
export function randomArray(rng, count, size = 4) {
  const a = new Float32Array(count * size);
  for (let i = 0; i < a.length; i++) a[i] = rng();
  return a;
}

/**
 * A lathe surface (revolved profile) with shared seam vertices, subdivided along the
 * profile and displaced by `displace(vec3)` so it reads as rock rather than a CNC part.
 */
export function roughLathe(profile, segments, subdiv, displace) {
  const pts = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i];
    const [r1, y1] = profile[i + 1];
    for (let s = 0; s < subdiv; s++) {
      const t = s / subdiv;
      pts.push(new THREE.Vector2(r0 + (r1 - r0) * t, y0 + (y1 - y0) * t));
    }
  }
  const last = profile[profile.length - 1];
  pts.push(new THREE.Vector2(last[0], last[1]));

  let geo = new THREE.LatheGeometry(pts, segments);
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  geo = mergeVertices(geo, 1e-4);
  if (displace) {
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      displace(v);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/** A lumpy boulder: displaced icosahedron. Returns non-indexed geometry (flat-shaded look). */
export function rockGeometry({ radius = 1, detail = 2, amp = 0.35, freq = 1.4, seed = 0, squash = 1, flat = true }) {
  let geo = new THREE.IcosahedronGeometry(radius, detail);
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  geo = mergeVertices(geo, 1e-4);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * freq + seed, v.y * freq + seed * 0.7, v.z * freq - seed, 3);
    const ridged = 1 - Math.abs(fbm(v.x * freq * 1.9 - seed, v.y * freq * 1.9, v.z * freq * 1.9 + seed, 2));
    v.multiplyScalar(1 + amp * (n * 0.8 + ridged * 0.25 - 0.12));
    v.y *= squash;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  if (flat) geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  return geo;
}

/** Sets a per-vertex colour attribute from a function(position, normal, index) -> THREE.Color. */
export function paintVertices(geo, fn) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const c = fn(p, n, i);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
