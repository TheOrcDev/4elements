import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { VERT_PRELUDE } from '../../core/glsl/index.js';
import { FIELD_GLSL, SDF_GLSL } from './field.glsl.js';

// Geometry from signed-distance fields.
//
// Every rock in this element starts as a GLSL function "distance to the surface at p".
// FieldBaker evaluates such a function on a regular grid on the GPU (one draw call into a
// float atlas, read back once); surfaceNets() turns the grid into a closed triangle mesh;
// the remaining helpers derive shading data from the same grid: normals from its gradient,
// ambient occlusion from blurred occupancy, and soft visibility toward fixed light directions.

const BAKE_FRAG = /* glsl */ `
${VERT_PRELUDE}
${FIELD_GLSL}
${SDF_GLSL}
uniform vec3 uMin;        // position of sample (0, 0, 0)
uniform float uCell;      // grid spacing
uniform vec2 uTile;       // samples along x and z: one atlas tile
uniform float uCols;      // tiles per atlas row
uniform int uShape;       // 0 = the monolith, 1 = a loose rock
uniform float uSeed;
void main() {
  // The atlas is a grid of x-z slices; each texel stores four consecutive y levels in rgba.
  vec2 tileXY = floor(gl_FragCoord.xy / uTile);
  vec2 inTile = gl_FragCoord.xy - tileXY * uTile - 0.5;
  float level = (tileXY.x + tileXY.y * uCols) * 4.0;
  vec4 d;
  for (int c = 0; c < 4; c++) {
    vec3 p = uMin + vec3(inTile.x, level + float(c), inTile.y) * uCell;
    d[c] = uShape == 0 ? monolithSDF(p) : looseRockSDF(p, uSeed);
  }
  gl_FragColor = d;
}
`;

export class FieldBaker {
  constructor(renderer) {
    this.renderer = renderer;
    this.uniforms = {
      ...shared,
      uMin: { value: new THREE.Vector3() },
      uCell: { value: 1 },
      uTile: { value: new THREE.Vector2() },
      uCols: { value: 1 },
      uShape: { value: 0 },
      uSeed: { value: 0 },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: BAKE_FRAG,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /**
   * Sample a field on a grid. min: position of the first sample, cell: spacing, dims: [nx, ny, nz]
   * sample counts. Returns { data, dims, min, cell } with data[i + nx * (k + nz * j)]
   * (x fastest, then z, then y).
   */
  bake({ shape, seed = 0, min, cell, dims }) {
    const [nx, ny, nz] = dims;
    const tiles = Math.ceil(ny / 4);
    const cols = Math.ceil(Math.sqrt(tiles * nz / nx));
    const rows = Math.ceil(tiles / cols);
    const width = cols * nx;
    const height = rows * nz;
    const target = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: false,
      magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter,
    });
    const u = this.uniforms;
    u.uMin.value.copy(min);
    u.uCell.value = cell;
    u.uTile.value.set(nx, nz);
    u.uCols.value = cols;
    u.uShape.value = shape;
    u.uSeed.value = seed;

    const renderer = this.renderer;
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(this.mesh, this.camera);
    const atlas = new Float32Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, atlas);
    renderer.setRenderTarget(previous);
    target.dispose();

    const data = new Float32Array(nx * ny * nz);
    for (let j = 0; j < ny; j++) {
      const tile = j >> 2;
      const channel = j & 3;
      const tx = tile % cols;
      const ty = (tile - tx) / cols;
      for (let k = 0; k < nz; k++) {
        let src = ((ty * nz + k) * width + tx * nx) * 4 + channel;
        let dst = nx * (k + nz * j);
        for (let i = 0; i < nx; i++, src += 4, dst++) data[dst] = atlas[src];
      }
    }
    return { data, dims, min: min.clone(), cell };
  }

  dispose() {
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}

/**
 * Every factor-th sample of a grid: the same field at a coarser spacing, for a lighter mesh.
 * (dims - 1) should be a multiple of factor on every axis so the coarse grid spans the same box.
 * inset (metres) moves the surface that far into the solid.
 */
export function coarsenGrid(grid, factor, inset = 0) {
  const { data, dims, min, cell } = grid;
  const [nx, ny, nz] = dims;
  const mx = Math.floor((nx - 1) / factor) + 1, my = Math.floor((ny - 1) / factor) + 1, mz = Math.floor((nz - 1) / factor) + 1;
  const out = new Float32Array(mx * my * mz);
  for (let j = 0; j < my; j++) {
    for (let k = 0; k < mz; k++) {
      let src = nx * (k * factor + nz * j * factor);
      let dst = mx * (k + mz * j);
      for (let i = 0; i < mx; i++, src += factor, dst++) out[dst] = data[src] + inset;
    }
  }
  return { data: out, dims: [mx, my, mz], min: min.clone(), cell: cell * factor };
}

/**
 * Naive surface nets: one vertex in every grid cell the surface passes through (placed at
 * the mean of the cell's edge crossings), one quad for every grid edge whose ends lie on
 * different sides. Gives evenly sized, well-shaped triangles and keeps sharp steps in the
 * field as crisp one-cell bevels. field < 0 is solid.
 */
export function surfaceNets(grid) {
  const { data, dims, min, cell } = grid;
  const [nx, ny, nz] = dims;
  const sz = nx;
  const sy = nx * nz;
  const cellVertex = new Int32Array(nx * ny * nz);
  let capacity = 1 << 16;
  let positions = new Float32Array(capacity * 3);
  let indices = new Uint32Array(capacity * 12);
  let vertexCount = 0;
  let indexCount = 0;

  const quad = (a, b, c, d, flip) => {
    if (indexCount + 6 > indices.length) {
      const grown = new Uint32Array(indices.length * 2);
      grown.set(indices);
      indices = grown;
    }
    // Split along the shorter diagonal.
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
    const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
    const dx = positions[d * 3], dy = positions[d * 3 + 1], dz = positions[d * 3 + 2];
    const ac = (ax - cx) * (ax - cx) + (ay - cy) * (ay - cy) + (az - cz) * (az - cz);
    const bd = (bx - dx) * (bx - dx) + (by - dy) * (by - dy) + (bz - dz) * (bz - dz);
    if (flip) { const t = b; b = d; d = t; }
    if (ac <= bd) {
      indices[indexCount++] = a; indices[indexCount++] = b; indices[indexCount++] = c;
      indices[indexCount++] = a; indices[indexCount++] = c; indices[indexCount++] = d;
    } else {
      indices[indexCount++] = a; indices[indexCount++] = b; indices[indexCount++] = d;
      indices[indexCount++] = b; indices[indexCount++] = c; indices[indexCount++] = d;
    }
  };

  for (let j = 0; j < ny - 1; j++) {
    for (let k = 0; k < nz - 1; k++) {
      let base = nx * (k + nz * j);
      for (let i = 0; i < nx - 1; i++, base++) {
        // Corner samples: bit 0 = +x, bit 1 = +z, bit 2 = +y.
        const v0 = data[base], v1 = data[base + 1], v2 = data[base + sz], v3 = data[base + sz + 1];
        const v4 = data[base + sy], v5 = data[base + sy + 1], v6 = data[base + sy + sz], v7 = data[base + sy + sz + 1];
        const s0 = v0 < 0, s1 = v1 < 0, s2 = v2 < 0, s3 = v3 < 0, s4 = v4 < 0, s5 = v5 < 0, s6 = v6 < 0, s7 = v7 < 0;
        const inside = s0 + s1 + s2 + s3 + s4 + s5 + s6 + s7;
        if (inside === 0 || inside === 8) continue;

        // Mean of the edge crossings, in cell units.
        let x = 0, y = 0, z = 0, n = 0;
        if (s0 !== s1) { x += v0 / (v0 - v1); n++; }
        if (s2 !== s3) { x += v2 / (v2 - v3); z += 1; n++; }
        if (s4 !== s5) { x += v4 / (v4 - v5); y += 1; n++; }
        if (s6 !== s7) { x += v6 / (v6 - v7); z += 1; y += 1; n++; }
        if (s0 !== s2) { z += v0 / (v0 - v2); n++; }
        if (s1 !== s3) { z += v1 / (v1 - v3); x += 1; n++; }
        if (s4 !== s6) { z += v4 / (v4 - v6); y += 1; n++; }
        if (s5 !== s7) { z += v5 / (v5 - v7); x += 1; y += 1; n++; }
        if (s0 !== s4) { y += v0 / (v0 - v4); n++; }
        if (s1 !== s5) { y += v1 / (v1 - v5); x += 1; n++; }
        if (s2 !== s6) { y += v2 / (v2 - v6); z += 1; n++; }
        if (s3 !== s7) { y += v3 / (v3 - v7); x += 1; z += 1; n++; }

        if (vertexCount === capacity) {
          capacity *= 2;
          const grown = new Float32Array(capacity * 3);
          grown.set(positions);
          positions = grown;
        }
        const o = vertexCount * 3;
        positions[o] = min.x + (i + x / n) * cell;
        positions[o + 1] = min.y + (j + y / n) * cell;
        positions[o + 2] = min.z + (k + z / n) * cell;
        cellVertex[base] = vertexCount++;

        // Quads around the three edges that leave corner 0. The four cells sharing an edge
        // are listed counter-clockwise as seen from the edge's positive end.
        if (s0 !== s1 && j > 0 && k > 0) {
          quad(cellVertex[base - sy - sz], cellVertex[base - sz], cellVertex[base], cellVertex[base - sy], !s0);
        }
        if (s0 !== s2 && i > 0 && j > 0) {
          quad(cellVertex[base - 1 - sy], cellVertex[base - sy], cellVertex[base], cellVertex[base - 1], !s0);
        }
        if (s0 !== s4 && i > 0 && k > 0) {
          quad(cellVertex[base - sz - 1], cellVertex[base - 1], cellVertex[base], cellVertex[base - sz], !s0);
        }
      }
    }
  }
  return { positions: positions.slice(0, vertexCount * 3), indices: indices.slice(0, indexCount), vertexCount };
}

/**
 * A lighter copy of a large mesh by vertex clustering. Space is diced into cubes `size`
 * metres across; the vertices in a cube whose normals share a dominant axis become one
 * vertex at their mean, and triangles that lose a corner that way are dropped. Unlike
 * meshing the field again on a coarser grid, this is the same surface with fewer points on
 * it: ledges and edges stay where the detailed mesh has them, and the split by facing keeps
 * the two sides of a thin ledge apart. Linear in the size of the mesh.
 * normals: 3 floats per vertex. bytes: per-vertex Uint8Arrays (4 per vertex), averaged like the rest.
 * Returns { positions, normals, bytes, indices, vertexCount }.
 */
export function clusterMesh(positions, normals, bytes, indices, size) {
  const count = positions.length / 3;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  for (let o = 0; o < positions.length; o += 3) {
    if (positions[o] < minX) minX = positions[o];
    if (positions[o + 1] < minY) minY = positions[o + 1];
    if (positions[o + 2] < minZ) minZ = positions[o + 2];
  }
  const inv = 1 / size;
  const cluster = new Int32Array(count);
  const ids = new Map();
  for (let v = 0; v < count; v++) {
    const o = v * 3;
    const nx = normals[o], ny = normals[o + 1], nz = normals[o + 2];
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    const facing = ax >= ay && ax >= az ? (nx < 0 ? 0 : 1) : ay >= az ? (ny < 0 ? 2 : 3) : (nz < 0 ? 4 : 5);
    const key = ((Math.floor((positions[o] - minX) * inv) * 1024 + Math.floor((positions[o + 1] - minY) * inv)) * 1024
               + Math.floor((positions[o + 2] - minZ) * inv)) * 6 + facing;
    let id = ids.get(key);
    if (id === undefined) { id = ids.size; ids.set(key, id); }
    cluster[v] = id;
  }

  const vertexCount = ids.size;
  const members = new Float32Array(vertexCount);
  const outPositions = new Float32Array(vertexCount * 3);
  const outNormals = new Float32Array(vertexCount * 3);
  const sums = bytes.map(() => new Float32Array(vertexCount * 4));
  for (let v = 0; v < count; v++) {
    const c = cluster[v];
    members[c]++;
    for (let k = 0; k < 3; k++) {
      outPositions[c * 3 + k] += positions[v * 3 + k];
      outNormals[c * 3 + k] += normals[v * 3 + k];
    }
    for (let b = 0; b < bytes.length; b++) for (let k = 0; k < 4; k++) sums[b][c * 4 + k] += bytes[b][v * 4 + k];
  }
  for (let c = 0; c < vertexCount; c++) {
    const o = c * 3, w = 1 / members[c];
    outPositions[o] *= w; outPositions[o + 1] *= w; outPositions[o + 2] *= w;
    const l = Math.hypot(outNormals[o], outNormals[o + 1], outNormals[o + 2]) || 1;
    outNormals[o] /= l; outNormals[o + 1] /= l; outNormals[o + 2] /= l;
  }
  const outBytes = sums.map((sum) => {
    const out = new Uint8Array(sum.length);
    for (let i = 0; i < sum.length; i++) out[i] = Math.round(sum[i] / members[i >> 2]);
    return out;
  });

  // Several triangles of the detailed mesh can come down to the same three clusters: the first is kept.
  const outIndices = new Uint32Array(indices.length);
  const seen = new Set();
  let n = 0;
  for (let i = 0; i < indices.length; i += 3) {
    let a = cluster[indices[i]], b = cluster[indices[i + 1]], c = cluster[indices[i + 2]];
    if (a === b || b === c || a === c) continue;
    // (Rotated so that the lowest id leads: the same triangle then always gives the same key.)
    if (b < a && b < c) { const t = a; a = b; b = c; c = t; } else if (c < a && c < b) { const t = a; a = c; c = b; b = t; }
    const key = (a * vertexCount + b) * vertexCount + c;
    if (seen.has(key)) continue;
    seen.add(key);
    outIndices[n++] = a; outIndices[n++] = b; outIndices[n++] = c;
  }
  return { positions: outPositions, normals: outNormals, bytes: outBytes, indices: outIndices.slice(0, n), vertexCount };
}

/**
 * Lighter copies of a small closed mesh by edge collapse (the quadric error metric of
 * Garland and Heckbert). The cheapest collapse is made again and again, one end of an edge
 * sliding onto the other, where "cheap" means that the faces left around the survivor stay
 * close to the planes of every face it has swallowed. Flat faces thin out first and corners
 * go last, so a block keeps its outline and its fracture faces down to a few dozen
 * triangles; and every vertex left is a vertex of the original, so data baked per vertex
 * carries over unchanged.
 * targets: triangle counts, largest first. Returns one { keep, indices } per target: the
 * original vertices that survive, and the triangles over them (indices into keep).
 */
export function decimate(positions, indices, targets) {
  const vertexTotal = positions.length / 3;
  const faces = Int32Array.from(indices);
  const faceTotal = faces.length / 3;
  const alive = new Uint8Array(faceTotal).fill(1);
  const gone = new Uint8Array(vertexTotal);
  const around = Array.from({ length: vertexTotal }, () => []);        // the faces at each vertex (dead ones are weeded out lazily)
  // Each vertex carries the sum of the squared distances to the planes of its faces as a
  // quadric: the ten distinct entries of a symmetric 4 x 4 matrix.
  const quadric = new Float64Array(vertexTotal * 10);
  for (let f = 0; f < faceTotal; f++) {
    const a = faces[f * 3] * 3, b = faces[f * 3 + 1] * 3, c = faces[f * 3 + 2] * 3;
    const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const area = Math.hypot(nx, ny, nz);
    if (area > 1e-12) { nx /= area; ny /= area; nz /= area; }
    const d = -(nx * positions[a] + ny * positions[a + 1] + nz * positions[a + 2]);
    const plane = [nx * nx, nx * ny, nx * nz, nx * d, ny * ny, ny * nz, ny * d, nz * nz, nz * d, d * d];
    for (let k = 0; k < 3; k++) {
      const v = faces[f * 3 + k];
      around[v].push(f);
      for (let i = 0; i < 10; i++) quadric[v * 10 + i] += plane[i] * area;      // larger faces weigh more
    }
  }
  const errorAt = (v, p) => {
    const q = v * 10, x = positions[p * 3], y = positions[p * 3 + 1], z = positions[p * 3 + 2];
    return quadric[q] * x * x + 2 * quadric[q + 1] * x * y + 2 * quadric[q + 2] * x * z + 2 * quadric[q + 3] * x
         + quadric[q + 4] * y * y + 2 * quadric[q + 5] * y * z + 2 * quadric[q + 6] * y + quadric[q + 7] * z * z + 2 * quadric[q + 8] * z + quadric[q + 9];
  };
  const neighbours = (v, out) => {
    out.length = 0;
    const list = around[v];
    let kept = 0;
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (!alive[f]) continue;
      list[kept++] = f;
      for (let k = 0; k < 3; k++) { const w = faces[f * 3 + k]; if (w !== v && !out.includes(w)) out.push(w); }
    }
    list.length = kept;
    return out;
  };
  // Would moving v onto u turn one of v's faces over, or flatten it to nothing?
  const folds = (v, u) => {
    const list = around[v];
    const px = positions[u * 3], py = positions[u * 3 + 1], pz = positions[u * 3 + 2];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (!alive[f]) continue;
      let a = faces[f * 3], b = faces[f * 3 + 1], c = faces[f * 3 + 2];
      if (a === u || b === u || c === u) continue;                       // this face goes with the edge
      if (b === v) { const t = a; a = b; b = c; c = t; } else if (c === v) { const t = a; a = c; c = b; b = t; }
      const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
      const ex = positions[c * 3] - bx, ey = positions[c * 3 + 1] - by, ez = positions[c * 3 + 2] - bz;
      const ox = positions[a * 3] - bx, oy = positions[a * 3 + 1] - by, oz = positions[a * 3 + 2] - bz;
      const mx = px - bx, my = py - by, mz = pz - bz;
      // Normals before and after, both as (c - b) x (apex - b).
      const n0x = ey * oz - ez * oy, n0y = ez * ox - ex * oz, n0z = ex * oy - ey * ox;
      const n1x = ey * mz - ez * my, n1y = ez * mx - ex * mz, n1z = ex * my - ey * mx;
      const dot = n0x * n1x + n0y * n1y + n0z * n1z;
      if (dot <= 0.2 * Math.sqrt((n0x * n0x + n0y * n0y + n0z * n0z) * (n1x * n1x + n1y * n1y + n1z * n1z))) return true;
    }
    return false;
  };
  // The cheapest neighbour for each vertex to collapse onto.
  const cost = new Float64Array(vertexTotal).fill(Infinity);
  const onto = new Int32Array(vertexTotal).fill(-1);
  const ring = [], ringOther = [], ringCost = [];
  const appraise = (v) => {
    cost[v] = Infinity;
    onto[v] = -1;
    neighbours(v, ring);
    for (let i = 0; i < ring.length; i++) {
      const u = ring[i];
      const dx = positions[u * 3] - positions[v * 3], dy = positions[u * 3 + 1] - positions[v * 3 + 1], dz = positions[u * 3 + 2] - positions[v * 3 + 2];
      // (A trace of the edge's length decides between collapses that cost nothing: short edges first.)
      ringCost[i] = errorAt(v, u) + errorAt(u, u) + 1e-7 * (dx * dx + dy * dy + dz * dz);
    }
    // The costs are cheap and the tests are not: take the cheapest candidate that passes them.
    for (;;) {
      let best = -1, least = Infinity;
      for (let i = 0; i < ring.length; i++) if (ringCost[i] < least) { least = ringCost[i]; best = i; }
      if (best < 0) return;
      const u = ring[best];
      // On a closed surface an edge can only go if its ends share exactly two neighbours.
      neighbours(u, ringOther);
      let shared = 0;
      for (let k = 0; k < ringOther.length; k++) if (ring.includes(ringOther[k])) shared++;
      if (shared === 2 && !folds(v, u)) { cost[v] = least; onto[v] = u; return; }
      ringCost[best] = Infinity;
    }
  };
  for (let v = 0; v < vertexTotal; v++) appraise(v);

  const results = [];
  const affected = [];
  let faceCount = faceTotal;
  for (const target of targets) {
    while (faceCount > target) {
      let v = -1, least = Infinity;
      for (let i = 0; i < vertexTotal; i++) if (!gone[i] && cost[i] < least) { least = cost[i]; v = i; }
      if (v < 0) break;                                                  // nothing more can go without folding the surface
      const u = onto[v];
      const list = around[v];
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        if (!alive[f]) continue;
        const o = f * 3;
        if (faces[o] === u || faces[o + 1] === u || faces[o + 2] === u) { alive[f] = 0; faceCount--; continue; }
        for (let k = 0; k < 3; k++) if (faces[o + k] === v) faces[o + k] = u;
        around[u].push(f);
      }
      for (let i = 0; i < 10; i++) quadric[u * 10 + i] += quadric[v * 10 + i];
      gone[v] = 1;
      cost[v] = Infinity;
      appraise(u);
      neighbours(u, affected);
      for (let i = 0; i < affected.length; i++) appraise(affected[i]);
    }
    // Snapshot: the vertices still in use, and the faces over them.
    const slot = new Int32Array(vertexTotal).fill(-1);
    const keep = [];
    const out = [];
    for (let f = 0; f < faceTotal; f++) {
      if (!alive[f]) continue;
      for (let k = 0; k < 3; k++) {
        const v = faces[f * 3 + k];
        if (slot[v] < 0) { slot[v] = keep.length; keep.push(v); }
        out.push(slot[v]);
      }
    }
    results.push({ keep: Int32Array.from(keep), indices: Uint32Array.from(out) });
  }
  return results;
}

/** Trilinear lookup into a grid at a world position (clamped to the grid). */
export function sampleGrid(grid, x, y, z) {
  const { data, dims, min, cell } = grid;
  const nx = dims[0], ny = dims[1], nz = dims[2];
  let gx = (x - min.x) / cell, gy = (y - min.y) / cell, gz = (z - min.z) / cell;
  gx = gx < 0 ? 0 : gx > nx - 1.001 ? nx - 1.001 : gx;
  gy = gy < 0 ? 0 : gy > ny - 1.001 ? ny - 1.001 : gy;
  gz = gz < 0 ? 0 : gz > nz - 1.001 ? nz - 1.001 : gz;
  const ix = gx | 0, iy = gy | 0, iz = gz | 0;
  const fx = gx - ix, fy = gy - iy, fz = gz - iz;
  const sz = nx, sy = nx * nz;
  const b = ix + nx * (iz + nz * iy);
  const a00 = data[b] + (data[b + 1] - data[b]) * fx;
  const a01 = data[b + sz] + (data[b + sz + 1] - data[b + sz]) * fx;
  const a10 = data[b + sy] + (data[b + sy + 1] - data[b + sy]) * fx;
  const a11 = data[b + sy + sz] + (data[b + sy + sz + 1] - data[b + sy + sz]) * fx;
  const a0 = a00 + (a01 - a00) * fz;
  const a1 = a10 + (a11 - a10) * fz;
  return a0 + (a1 - a0) * fy;
}

/** Unit normals from the gradient of the field (central differences, `step` cells wide). */
export function gradientNormals(grid, positions, step = 0.6) {
  const count = positions.length / 3;
  const normals = new Float32Array(count * 3);
  const e = grid.cell * step;
  for (let v = 0; v < count; v++) {
    const o = v * 3;
    const x = positions[o], y = positions[o + 1], z = positions[o + 2];
    const gx = sampleGrid(grid, x + e, y, z) - sampleGrid(grid, x - e, y, z);
    const gy = sampleGrid(grid, x, y + e, z) - sampleGrid(grid, x, y - e, z);
    const gz = sampleGrid(grid, x, y, z + e) - sampleGrid(grid, x, y, z - e);
    const l = Math.hypot(gx, gy, gz);
    if (l > 1e-12) { normals[o] = gx / l; normals[o + 1] = gy / l; normals[o + 2] = gz / l; }
    else normals[o + 1] = 1;                      // a perfectly flat spot in the field: any unit normal will do
  }
  return normals;
}

/**
 * Solid fraction of a volume, at 1 / factor of its resolution. `grid` is either a distance
 * field (each sample becomes an anti-aliased inside test) or, with fromOccupancy, a volume
 * this function made earlier. Blur it and sample it just above a surface point and it says
 * how much rock crowds that point: the basis of the baked ambient occlusion.
 */
export function occupancyVolume(grid, factor, fromOccupancy = false) {
  const { data, dims, min, cell } = grid;
  const [nx, , nz] = dims;
  const mx = Math.floor(dims[0] / factor), my = Math.floor(dims[1] / factor), mz = Math.floor(dims[2] / factor);
  const out = new Float32Array(mx * my * mz);
  const inv = 1 / cell;
  const norm = 1 / (factor * factor * factor);
  for (let j = 0; j < my; j++) for (let k = 0; k < mz; k++) for (let i = 0; i < mx; i++) {
    let sum = 0;
    for (let dj = 0; dj < factor; dj++) for (let dk = 0; dk < factor; dk++) {
      let src = i * factor + nx * (k * factor + dk + nz * (j * factor + dj));
      for (let di = 0; di < factor; di++, src++) {
        if (fromOccupancy) sum += data[src];
        else {
          const o = 0.5 - data[src] * inv;
          sum += o < 0 ? 0 : o > 1 ? 1 : o;
        }
      }
    }
    out[i + mx * (k + mz * j)] = sum * norm;
  }
  const half = (factor - 1) * 0.5 * cell;         // coarse samples sit at the centre of the fine ones they average
  return { data: out, dims: [mx, my, mz], min: new THREE.Vector3(min.x + half, min.y + half, min.z + half), cell: cell * factor };
}

/** Box-blurs a volume `passes` times with the given radius in cells (separable running sums, edges clamped). */
export function blurVolume(volume, radius, passes = 2) {
  const [mx, my, mz] = volume.dims;
  let a = volume.data;
  let b = new Float32Array(a.length);
  const w = 1 / (radius * 2 + 1);
  const blurAxis = (src, dst, n, stride, lines, lineStart) => {
    for (let line = 0; line < lines; line++) {
      const start = lineStart(line);
      let sum = 0;
      for (let t = -radius; t <= radius; t++) sum += src[start + Math.min(n - 1, Math.max(0, t)) * stride];
      for (let t = 0; t < n; t++) {
        dst[start + t * stride] = sum * w;
        sum += src[start + Math.min(n - 1, t + radius + 1) * stride] - src[start + Math.max(0, t - radius) * stride];
      }
    }
  };
  for (let p = 0; p < passes; p++) {
    blurAxis(a, b, mx, 1, my * mz, (l) => l * mx);                                   // along x
    blurAxis(b, a, mz, mx, mx * my, (l) => (l % mx) + mx * mz * ((l / mx) | 0));     // along z
    blurAxis(a, b, my, mx * mz, mx * mz, (l) => l);                                  // along y
    const t = a; a = b; b = t;
  }
  volume.data = a;
  return volume;
}

/**
 * Soft visibility of each vertex toward a light, by sphere-tracing the distance field
 * (nearest-sample lookups: the result is smoothed across vertices anyway).
 * dir: unit vector toward a distant light, or pass `point` for a light at a finite position.
 * lift: how far off the surface the march starts, in metres (default: a cell and a half).
 * Returns 0 (blocked) … 1 (open) per vertex; vertices facing away from the light get 0.
 */
export function marchVisibility(grid, positions, normals, { dir = null, point = null, maxDistance = 2.5, softness = 10, lift = grid.cell * 1.6 }) {
  const { data, dims, min, cell } = grid;
  const nx = dims[0], ny = dims[1], nz = dims[2];
  const sz = nx, sy = nx * nz;
  const inv = 1 / cell;
  const count = positions.length / 3;
  const out = new Float32Array(count);
  const minStep = cell * 1.25;
  const skin = cell * 0.25;                      // the surface is taken to lie a little inside the zero level
  for (let v = 0; v < count; v++) {
    const o = v * 3;
    const nxn = normals[o], nyn = normals[o + 1], nzn = normals[o + 2];
    // Start off the surface so the march does not hit its own wall.
    const px = positions[o] + nxn * lift, py = positions[o + 1] + nyn * lift, pz = positions[o + 2] + nzn * lift;
    let lx, ly, lz, reach = maxDistance;
    if (point) {
      lx = point.x - px; ly = point.y - py; lz = point.z - pz;
      const l = Math.hypot(lx, ly, lz) || 1;
      lx /= l; ly /= l; lz /= l;
      reach = Math.min(maxDistance, l - cell * 2);
    } else { lx = dir.x; ly = dir.y; lz = dir.z; }
    if (nxn * lx + nyn * ly + nzn * lz <= 0) continue;
    let vis = 1;
    let t = minStep;
    while (t < reach) {
      const gx = ((px + lx * t - min.x) * inv + 0.5) | 0;
      const gy = ((py + ly * t - min.y) * inv + 0.5) | 0;
      const gz = ((pz + lz * t - min.z) * inv + 0.5) | 0;
      if (gx < 0 || gy < 0 || gz < 0 || gx >= nx || gy >= ny || gz >= nz) break;     // out of the grid: open air
      const d = data[gx + sz * gz + sy * gy];
      if (d < -skin) { vis = 0; break; }
      const s = softness * (d + skin) / t;         // how closely the ray grazes rock sets the penumbra (Quilez)
      if (s < vis) vis = s;
      t += d > minStep ? d * 0.8 : minStep;
    }
    out[v] = vis;
  }
  return out;
}
