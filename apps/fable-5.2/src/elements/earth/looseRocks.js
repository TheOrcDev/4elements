import * as THREE from 'three';
import { surfaceNets, gradientNormals, occupancyVolume, blurVolume, sampleGrid, decimate } from './bake.js';

// Loose blocks of the same rock: a handful of shapes, each at five levels of detail, then
// instanced by the belt and by the rubble island. A shape is about one unit in radius;
// instances scale it to their size in metres. The most detailed level is meshed from the
// looseRockSDF field; every lighter one is that mesh with edges collapsed (decimate): the
// same block with the same corners and fracture faces, drawn with fewer triangles.
//
// Every set of rocks exists twice (createRockPair): in full detail for the camera when it is
// close, and as a lighter level of the same shapes for the reflection, the shadow map and
// the view from across the ring, where a stone is a few pixels wide.

const EXTENT = 1.4;                       // half-size of the baked cube, in rock radii
const SAMPLES = 23;                       // samples per axis of the detailed mesh
const LIGHTER = [                         // the lighter levels, and how many triangles each keeps
  { name: 'mid', triangles: 420 },
  { name: 'small', triangles: 260 },
  { name: 'low', triangles: 160 },
  { name: 'tiny', triangles: 56 },
];
const SHAPE_SEEDS = [3.1, 7.7, 12.3];     // three distinct blocks

function buildShape(baker, seed) {
  const cell = (EXTENT * 2) / (SAMPLES - 1);
  const grid = baker.bake({
    shape: 1, seed, cell, min: new THREE.Vector3(-EXTENT, -EXTENT, -EXTENT), dims: [SAMPLES, SAMPLES, SAMPLES],
  });
  const net = surfaceNets(grid);
  const normals = gradientNormals(grid, net.positions, 0.8);
  const crowd = blurVolume(occupancyVolume(grid, 1), 2, 1);
  const bake = new Uint8Array(net.vertexCount * 4);
  const vis = new Uint8Array(net.vertexCount * 4).fill(255);
  for (let v = 0; v < net.vertexCount; v++) {
    const o = v * 3;
    const x = net.positions[o], y = net.positions[o + 1], z = net.positions[o + 2];
    const convex = Math.min(1, Math.max(0, (0.5 - sampleGrid(crowd, x, y, z)) * 3.0 + 0.5));
    bake[v * 4] = 255 * Math.min(1, 0.55 + convex * 0.7);     // hollows of the block are a little occluded
    bake[v * 4 + 1] = 255;
    bake[v * 4 + 2] = 255 * convex;
    bake[v * 4 + 3] = 255;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(net.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('aBake', new THREE.BufferAttribute(bake, 4, true));
  geometry.setAttribute('aVis', new THREE.BufferAttribute(vis, 4, true));
  geometry.setIndex(new THREE.BufferAttribute(net.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** The part of a shape that a decimation kept: the surviving vertices with all they carry, and the new triangles. */
function lighterShape(shape, { keep, indices }) {
  const geometry = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'aBake', 'aVis']) {
    const source = shape.getAttribute(name);
    const size = source.itemSize;
    const array = new source.array.constructor(keep.length * size);
    for (let i = 0; i < keep.length; i++) for (let k = 0; k < size; k++) array[i * size + k] = source.array[keep[i] * size + k];
    geometry.setAttribute(name, new THREE.BufferAttribute(array, size, source.normalized));
  }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.boundingSphere = shape.boundingSphere;
  return geometry;
}

/** Returns { high: [geometry…], mid: […], small: […], low: […], tiny: […] }: one geometry per shape at each level. */
export function buildRockShapes(baker) {
  const shapes = { high: SHAPE_SEEDS.map((seed) => buildShape(baker, seed)) };
  for (const level of LIGHTER) shapes[level.name] = [];
  for (const shape of shapes.high) {
    const steps = decimate(shape.getAttribute('position').array, shape.getIndex().array, LIGHTER.map((level) => level.triangles));
    steps.forEach((step, i) => shapes[LIGHTER[i].name].push(lighterShape(shape, step)));
  }
  return shapes;
}

/**
 * An InstancedMesh of one rock shape. The geometry's buffers are shared with every other
 * mesh of that shape; only the per-instance data is its own, unless a twin is given: then
 * the new mesh shares the twin's instance matrices and attributes (the same rocks, another shape).
 * rocks: [{ seed, size, wet, moss }] in instance order.
 */
export function createRockInstances(shape, material, rocks, twin = null) {
  const geometry = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'aBake', 'aVis']) geometry.setAttribute(name, shape.getAttribute(name));
  geometry.setIndex(shape.getIndex());
  geometry.boundingSphere = shape.boundingSphere;
  if (twin) {
    geometry.setAttribute('aRock', twin.geometry.getAttribute('aRock'));
  } else {
    const data = new Float32Array(rocks.length * 4);
    rocks.forEach((r, i) => data.set([r.seed, r.size, r.wet || 0, r.moss || 0], i * 4));
    geometry.setAttribute('aRock', new THREE.InstancedBufferAttribute(data, 4));
  }
  const mesh = new THREE.InstancedMesh(geometry, material, rocks.length);
  if (twin) mesh.instanceMatrix = twin.instanceMatrix;
  mesh.receiveShadow = true;
  mesh.userData.full = rocks.length;               // quality levels draw a leading part of the set
  return mesh;
}

/**
 * One set of rocks at two levels of detail. near: what the main view draws while the camera
 * is close. far: the reflection and (with castShadow) the shadow of the same rocks, and what
 * the main view draws as well once the camera is across the ring. Where both are one shape
 * (debris too small to have a lighter one) nothing is ever swapped: near is the main view's
 * and far the reflection's, at any distance.
 * mirrored: false for debris too small to be worth reflecting; with nothing to swap either, there is then no far mesh.
 * Returns { near, far, meshes, setFar(isFar) }: far may be null, meshes lists the ones that exist.
 */
export function createRockPair(LAYERS, nearShape, farShape, material, rocks, { castShadow = true, mirrored = true } = {}) {
  const swaps = nearShape !== farShape;
  const near = createRockInstances(nearShape, material, rocks);
  const far = swaps || mirrored ? createRockInstances(farShape, material, rocks, near) : null;
  near.layers.set(LAYERS.MAIN_ONLY);
  near.castShadow = castShadow;
  // (The shadow map is drawn with the reflection, so it is the far mesh that casts; the near
  // one takes over if the reflection is ever switched off.)
  if (far) far.castShadow = castShadow;
  const pair = {
    near,
    far,
    meshes: far ? [near, far] : [near],
    /** isFar: true once the camera is across the ring. */
    setFar(isFar) {
      if (!far) return;
      near.visible = !(swaps && isFar);
      far.visible = mirrored || (swaps && isFar);
      far.layers.set(swaps && isFar ? LAYERS.OPAQUE : LAYERS.MIRROR_ONLY);
    },
  };
  pair.setFar(false);
  return pair;
}
