import * as THREE from 'three';
import { surfaceNets, coarsenGrid, gradientNormals, occupancyVolume, blurVolume, sampleGrid, marchVisibility, clusterMesh } from './bake.js';
import { GEODE_CENTRE } from './field.glsl.js';

// Builds the monolith's meshes from its distance field and bakes, per vertex, the lighting
// facts a rasteriser cannot know: how crowded the point is by rock at two scales (ambient
// occlusion), how sharp a ridge or crevice it sits on, and whether it can see the open
// sky, the afterglow, the fire and the heart of the geode.
//
// One field, three meshes:
//   near    every sample of the grid: what the camera sees from close by
//   far     the near mesh with its vertices merged over cubes of FAR_CLUSTER (about a quarter of
//           the triangles): the same surface, baked data and all, for the view from across the ring
//   proxy   every fourth sample, shrunk a few centimetres so it never pokes through the other
//           two: the mass that is reflected in the film and casts the moon's shadow

const CELL = 0.032;                                      // grid spacing in metres
const CELLS = [128, 152, 128];                           // multiples of 4, so the coarser grid spans the same box
const MIN = new THREE.Vector3(-1.92, -2.24, -2.048);     // rock-space position of the first sample
const LEVELS = {
  near: { factor: 1, inset: 0 },
  proxy: { factor: 4, inset: 0.04 },
};
const FAR_CLUSTER = 0.074;                               // metres

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A monolith mesh from its per-vertex arrays (rock space; bake and vis are the shader's aBake and aVis). */
function createMesh(name, positions, normals, bake, vis, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('aBake', new THREE.BufferAttribute(bake, 4, true));
  geometry.setAttribute('aVis', new THREE.BufferAttribute(vis, 4, true));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  const mesh = new THREE.Mesh(geometry);
  // All three may cast: the shadow map is drawn with the reflection, where only the proxy's
  // layer is seen; the others take over if the reflection is ever switched off.
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `monolith-${name}`;
  return mesh;
}

/**
 * One level of detail meshed from the field. fine: the full-resolution distance grid; near,
 * wide, edge: blurred occupancy at three scales; lights: { glowDir, fireDir, heart, spill }.
 * Returns { mesh, positions, normals, bake, vis, indices, lamp, sky, glow }: the arrays are per vertex, in rock space.
 */
function buildLevel(name, fine, { near, wide, edge }, lights) {
  const { factor, inset } = LEVELS[name];
  const net = surfaceNets(factor === 1 ? fine : coarsenGrid(fine, factor, inset));
  const { positions, vertexCount } = net;
  const normals = gradientNormals(fine, positions, 0.45 * factor);

  // The point of the true surface each vertex stands for (the proxy's vertices lie inside it).
  let surface = positions;
  if (inset > 0) {
    surface = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i++) surface[i] = positions[i] + normals[i] * inset;
  }
  // A coarse vertex can sit a little off the surface: start its shadow rays further out.
  const lift = CELL * (1.6 + 0.6 * (factor - 1));
  const sky = marchVisibility(fine, surface, normals, { dir: new THREE.Vector3(0, 1, 0), maxDistance: 2.2, softness: 5, lift });
  const glow = marchVisibility(fine, surface, normals, { dir: lights.glowDir, maxDistance: 2.6, softness: 8, lift });
  const fire = marchVisibility(fine, surface, normals, { dir: lights.fireDir, maxDistance: 2.6, softness: 8, lift });
  const lamp = marchVisibility(fine, surface, normals, { point: lights.heart, maxDistance: 3.2, softness: 6, lift });
  const spill = marchVisibility(fine, surface, normals, { point: lights.spill, maxDistance: 2.4, softness: 6, lift });

  const bake = new Uint8Array(vertexCount * 4);
  const vis = new Uint8Array(vertexCount * 4);
  for (let v = 0; v < vertexCount; v++) {
    const o = v * 3;
    const x = surface[o], y = surface[o + 1], z = surface[o + 2];
    const nx = normals[o], ny = normals[o + 1], nz = normals[o + 2];
    // A flat wall reads ~0.15 a little above its surface; corners, grooves and hollows read more.
    const fineAo = 1 - smooth(0.16, 0.52, sampleGrid(near, x + nx * 0.10, y + ny * 0.10, z + nz * 0.10));
    const broadAo = 1 - smooth(0.18, 0.62, sampleGrid(wide, x + nx * 0.35, y + ny * 0.35, z + nz * 0.35));
    // On the surface itself a flat wall reads 0.5, a ridge less, a crevice more.
    const convex = Math.min(1, Math.max(0, (0.5 - sampleGrid(edge, x, y, z)) * 3.2 + 0.5));
    const b = v * 4;
    bake[b] = fineAo * 255;
    bake[b + 1] = broadAo * 255;
    bake[b + 2] = convex * 255;
    bake[b + 3] = lamp[v] * 255;
    vis[b] = glow[v] * 255;
    vis[b + 1] = fire[v] * 255;
    vis[b + 2] = sky[v] * 255;
    vis[b + 3] = spill[v] * 255;
  }

  const mesh = createMesh(name, positions, normals, bake, vis, net.indices);
  return { mesh, positions, normals, bake, vis, indices: net.indices, lamp, sky, glow };
}

/**
 * glowDir, fireDir: unit vectors toward the afterglow and the pyre, in rock space. spill: the
 * point before the geode's mouth that its light is taken to spill from, in rock space.
 * Returns { mesh, far, proxy, positions, normals, lamp, sky, glow, grid }: the three meshes,
 * and the near mesh's per-vertex arrays in rock space (lamp, sky and glow are the visibility
 * of the geode's heart, of the open sky overhead and of the afterglow) for whatever grows on it.
 */
export function buildMonolith(baker, { glowDir, fireDir, spill }) {
  const grid = baker.bake({ shape: 0, min: MIN, cell: CELL, dims: CELLS.map((n) => n + 1) });
  // Occupancy at half resolution, blurred over ~25 cm (occlusion close to the surface) and
  // over ~10 cm (the sharpness of edges), and at an eighth, blurred over ~1 m.
  const near = occupancyVolume(grid, 2);
  const wide = blurVolume(occupancyVolume(near, 4, true), 2);
  const edge = blurVolume({ ...near, data: near.data.slice() }, 1, 1);
  blurVolume(near, 2);
  const volumes = { near, wide, edge };
  const lights = { glowDir, fireDir, spill, heart: new THREE.Vector3(...GEODE_CENTRE) };

  const detail = buildLevel('near', grid, volumes, lights);
  const light = clusterMesh(detail.positions, detail.normals, [detail.bake, detail.vis], detail.indices, FAR_CLUSTER);
  // Averaging leaves a vertex a little inside wherever the surface bulges or turns a corner: put it back on the surface.
  for (let o = 0; o < light.positions.length; o += 3) {
    const d = Math.max(-CELL, Math.min(CELL, sampleGrid(grid, light.positions[o], light.positions[o + 1], light.positions[o + 2])));
    for (let k = 0; k < 3; k++) light.positions[o + k] -= light.normals[o + k] * d;
  }
  const far = createMesh('far', light.positions, light.normals, light.bytes[0], light.bytes[1], light.indices);
  const proxy = buildLevel('proxy', grid, volumes, lights).mesh;
  return { ...detail, far, proxy, grid };
}
