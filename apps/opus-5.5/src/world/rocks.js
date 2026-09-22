import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Noise3, mulberry32 } from '../gl/noise.js';

const noise = new Noise3(4242);

/** Irregular rock: a displaced icosphere with welded, smooth normals and baked vertex colours. */
export function makeRockGeometry(seed = 1, { detail = 3, roughness = 0.35, squash = 1, colorA = '#4a433c', colorB = '#6b6258' } = {}) {
  const rand = mulberry32(seed);
  let geo = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  geo = mergeVertices(geo);
  const pos = geo.attributes.position;
  const ox = rand() * 100, oy = rand() * 100, oz = rand() * 100;
  const stretch = new THREE.Vector3(0.8 + rand() * 0.5, (0.7 + rand() * 0.4) * squash, 0.8 + rand() * 0.5);
  const v = new THREE.Vector3();
  const colors = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(colorA), cB = new THREE.Color(colorB), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n = noise.fbm(v.x * 1.4 + ox, v.y * 1.4 + oy, v.z * 1.4 + oz, 4);
    const r = noise.ridged(v.x * 2.2 + oz, v.y * 2.2 + ox, v.z * 2.2 + oy, 3);
    // flat facets: quantise the displacement slightly for a chiselled look
    const d = 1 + n * roughness + (r - 0.5) * roughness * 0.6;
    v.multiplyScalar(d).multiply(stretch);
    pos.setXYZ(i, v.x, v.y, v.z);
    const t = THREE.MathUtils.clamp(0.5 + n * 1.6 + (rand() - 0.5) * 0.15, 0, 1);
    c.copy(cA).lerp(cB, t);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}
