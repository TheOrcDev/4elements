import * as THREE from 'three';
import { createRockPair } from './looseRocks.js';
import { CrystalSet } from './crystals.js';
import { moundHeight } from './field.glsl.js';

// The island under the monolith: a low mound of gravel breaking the water film, piled with
// broken blocks of the same strata (instances of the loose-rock shapes), small cones of
// sand where the streams from the underside land, and a scatter of fallen crystals.

const UP = new THREE.Vector3(0, 1, 0);
const MIRRORED_PEBBLES = 0.6;             // the share of the pebbles, largest first, that the water film reflects

const BED_RADIUS = 3.3;                   // of the gravel bed: well out under the water
const LUMP_RINGS = 16, LUMP_SECTORS = 72; // the polar grid of the bed's random lumps (see bedLumps)

/**
 * Toward its shore the bed is not the smooth mound of moundHeight: it rises and dips by a
 * few centimetres, which on so gentle a slope is enough to send tongues of gravel out into
 * the film and to let the film reach back into bays between them. Element-local x, z -> metres.
 */
function shoreRelief(x, z) {
  const t = Math.min(1, Math.max(0, (Math.hypot(x, z) - 1.0) / 0.6));
  return t * t * (3 - 2 * t) * (0.022 * Math.sin(x * 4.1 + 1.3) * Math.sin(z * 3.7 + 0.2) + 0.016 * Math.sin(x * 7.9 - z * 6.1 + 2.0)
                              + 0.009 * Math.sin(x * 9.7 + z * 11.3 + 0.7));
}

/**
 * Random lumps of a centimetre or so all over the bed: one height at each node of a polar
 * grid, blended smoothly between the nodes. Returns (angle, radius) -> metres.
 * (The grid's size is historical. Its nodes were once the bed's only vertices, and the
 * island's stones draw from the same generator after them: this keeps every stone where it was.)
 */
function bedLumps(rng) {
  const heights = new Float32Array((LUMP_RINGS + 1) * LUMP_SECTORS);       // (ring 0 is the centre: no lump)
  for (let i = LUMP_SECTORS; i < heights.length; i++) heights[i] = (rng() - 0.5) * 0.03;
  const ease = (t) => t * t * (3 - 2 * t);
  return (angle, radius) => {
    const ring = Math.min(LUMP_RINGS - 1e-4, LUMP_RINGS * Math.pow(radius / BED_RADIUS, 1 / 0.85));
    const sector = (angle / (Math.PI * 2)) * LUMP_SECTORS;
    const i = Math.floor(ring), j = Math.floor(sector) % LUMP_SECTORS, k = (j + 1) % LUMP_SECTORS;
    const u = ease(ring - i), v = ease(sector - Math.floor(sector));
    const inner = heights[i * LUMP_SECTORS + j] * (1 - v) + heights[i * LUMP_SECTORS + k] * v;
    const outer = heights[(i + 1) * LUMP_SECTORS + j] * (1 - v) + heights[(i + 1) * LUMP_SECTORS + k] * v;
    return inner * (1 - u) + outer * u;
  };
}

/**
 * The gravel bed: a disc draped over the mound, its lumps and its shore relief, dipping under
 * the water at an uneven shore. lumps: from bedLumps. step: the spacing of its rings across
 * the shore, where the waterline has to be followed closely, in metres. sectors: vertices per ring.
 */
function bedGeometry(lumps, step, sectors) {
  const radii = [0.3, 0.6, 0.9];                                // under the heap, where little of it shows
  for (let r = 1.2; r < 2.75; r += step) radii.push(r);
  radii.push(2.95, BED_RADIUS);                                 // always under water
  const position = [0, moundHeight(0, 0), 0], index = [];
  for (const r of radii) {
    for (let j = 0; j < sectors; j++) {
      const a = (j / sectors) * Math.PI * 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      position.push(x, moundHeight(x, z) + lumps(a, r) + shoreRelief(x, z), z);
    }
  }
  for (let j = 0; j < sectors; j++) index.push(0, 1 + ((j + 1) % sectors), 1 + j);
  for (let i = 1; i < radii.length; i++) {
    for (let j = 0; j < sectors; j++) {
      const a = 1 + (i - 1) * sectors + j, b = 1 + (i - 1) * sectors + ((j + 1) % sectors);
      const c = a + sectors, d = b + sectors;
      index.push(a, b, d, a, d, c);
    }
  }
  return finishStatic(position, index, { seed: 0.37, occlusion: 0.62 });
}

/**
 * A cone of poured sand at the angle of repose. It runs on down inside the heap until it is
 * under water, so what shows is the cap on top of the blocks and the sand that has filled
 * the gaps between them.
 */
function coneInto(position, index, apex, rng) {
  const RINGS = 9, SECTORS = 26, SLOPE = 0.66;
  const radius = (apex.y + 0.08) / SLOPE;
  const first = position.length / 3;
  position.push(apex.x, apex.y, apex.z);
  for (let i = 1; i <= RINGS; i++) {
    for (let j = 0; j < SECTORS; j++) {
      const a = (j / SECTORS) * Math.PI * 2;
      // Small slides scallop the flanks.
      const r = radius * Math.pow(i / RINGS, 1.3) * (1 + 0.08 * Math.sin(a * 3 + apex.x * 9) + 0.05 * (rng() - 0.5));
      position.push(apex.x + Math.cos(a) * r, apex.y - r * SLOPE - (i > 1 ? 0.008 : 0), apex.z + Math.sin(a) * r);
    }
  }
  for (let j = 0; j < SECTORS; j++) index.push(first, first + 1 + ((j + 1) % SECTORS), first + 1 + j);
  for (let i = 1; i < RINGS; i++) {
    for (let j = 0; j < SECTORS; j++) {
      const a = first + 1 + (i - 1) * SECTORS + j, b = first + 1 + (i - 1) * SECTORS + ((j + 1) % SECTORS);
      index.push(a, b, b + SECTORS, a, b + SECTORS, a + SECTORS);
    }
  }
}

/** A non-instanced mesh for the loose-rock shader: per-vertex copies of the "instance" data. */
function finishStatic(position, index, { seed, occlusion }) {
  const count = position.length / 3;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const rock = new Float32Array(count * 4);
  const bake = new Uint8Array(count * 4);
  for (let v = 0; v < count; v++) {
    rock.set([seed, 1, 0, 0], v * 4);
    bake.set([occlusion * 255, 255, 128, 255], v * 4);
  }
  geometry.setAttribute('aRock', new THREE.BufferAttribute(rock, 4));
  geometry.setAttribute('aBake', new THREE.BufferAttribute(bake, 4, true));
  geometry.setAttribute('aVis', new THREE.BufferAttribute(new Uint8Array(count * 4).fill(255), 4, true));
  return geometry;
}

/**
 * shapes: from buildRockShapes. materials: { rubble, gravel, sand }. geode: from buildGeode
 * (its crystal geometry and material are reused). landings: [{ x, z, y, radius }] where sand
 * streams reach the island (element-local). Each landing's y is set here to the apex of the
 * cone of sand that has built up on the pile. heart, mouth: the geode's heart and the
 * direction it opens toward, element-local (the fallen crystals lie out in front of it and
 * pulse in step with their distance from it).
 * Returns { group, beds, setFar(far), setPebbleDensity(fraction, share) }: beds are the two
 * meshes of the gravel bed, the main view's and the reflection's.
 */
export function buildRubble(ctx, shapes, materials, geode, landings, heart, mouth) {
  const { LAYERS } = ctx;
  const group = new THREE.Group();
  const rng = ctx.rng(1723);

  // The bed: closely meshed across the shore for the main view, coarsely for its reflection.
  const lumps = bedLumps(rng);
  const bed = new THREE.Mesh(bedGeometry(lumps, 0.06, 144), materials.gravel);
  const bedMirrored = new THREE.Mesh(bedGeometry(lumps, 0.25, 72), materials.gravel);
  bed.layers.set(LAYERS.MAIN_ONLY);
  bedMirrored.layers.set(LAYERS.MIRROR_ONLY);
  bed.receiveShadow = bedMirrored.receiveShadow = true;
  group.add(bed, bedMirrored);

  // ---- stones, dropped largest first onto a height map of the pile so far: each comes to
  // rest on whatever is already under it, then raises the map with its own dome. The result
  // is a heap with the big blocks at the bottom and the small debris on top and around.
  const GRID = 72, SPAN = 3.5;                                  // cells per side, half-width in metres
  const cellSize = (SPAN * 2) / GRID;
  const pile = new Float32Array(GRID * GRID);
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) pile[i + j * GRID] = Math.max(moundHeight((i + 0.5) * cellSize - SPAN, (j + 0.5) * cellSize - SPAN), -0.03);
  }
  const pileAt = (x, z) => {
    const i = Math.min(GRID - 1, Math.max(0, Math.floor((x + SPAN) / cellSize)));
    const j = Math.min(GRID - 1, Math.max(0, Math.floor((z + SPAN) / cellSize)));
    return pile[i + j * GRID];
  };
  const stones = [];                                            // every near / far pair of stones
  const pebbles = [];                                           // the pairs of the smallest: thinned out at low quality
  const classes = [
    { level: 'high', far: 'low', count: 14, min: 0.27, max: 0.58, spread: 0.85 },
    { level: 'small', far: 'tiny', count: 85, min: 0.10, max: 0.23, spread: 1.15 },
    { level: 'tiny', far: 'tiny', count: 250, min: 0.035, max: 0.10, spread: 1.45, pebbles: true },
  ];
  const q = new THREE.Quaternion(), tilt = new THREE.Quaternion(), m = new THREE.Matrix4();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), axis = new THREE.Vector3(), lifted = new THREE.Vector3();
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rng() * 0.999)) * Math.cos(rng() * Math.PI * 2);
  for (const cls of classes) {
    const perShape = shapes[cls.level].map(() => ({ rocks: [] }));
    for (let n = 0; n < cls.count; n++) {
      const size = cls.min + (cls.max - cls.min) * rng() * rng();
      const x = Math.max(-SPAN + 0.3, Math.min(SPAN - 0.3, gauss() * cls.spread));
      const z = Math.max(-SPAN + 0.3, Math.min(SPAN - 0.3, gauss() * cls.spread));
      // Rest on the highest ground under the middle of the block, a little sunk in.
      const reach = size * 0.55;
      const support = Math.max(pileAt(x, z), pileAt(x + reach, z), pileAt(x - reach, z), pileAt(x, z + reach), pileAt(x, z - reach)) * 0.6 + pileAt(x, z) * 0.4;
      const flat = 0.42 + 0.3 * rng();                          // how much of its radius the block stands above its centre
      p.set(x, support + size * (flat - 0.22), z);
      // Blocks lie on their broad faces, tipped the way the heap slopes under them.
      const slopeX = pileAt(x + reach, z) - pileAt(x - reach, z), slopeZ = pileAt(x, z + reach) - pileAt(x, z - reach);
      axis.set(slopeZ, 0, -slopeX);
      const steep = Math.min(axis.length() / (2 * reach), 0.7);
      if (axis.lengthSq() < 1e-8) axis.set(1, 0, 0);
      axis.normalize();
      q.setFromAxisAngle(UP, rng() * Math.PI * 2).premultiply(tilt.setFromAxisAngle(axis, steep));
      axis.set(rng() - 0.5, 0, rng() - 0.5).normalize();
      q.premultiply(tilt.setFromAxisAngle(axis, (rng() - 0.5) * 0.5));
      // (The pile is built on the smooth mound; the bed's shore relief then carries each stone with it.)
      m.compose(lifted.set(x, p.y + shoreRelief(x, z), z), q, s.setScalar(size));
      const set = perShape[n % perShape.length];
      set.rocks.push({
        seed: 3 + rng() * 80, size, wet: p.y < 0.1 ? 0.3 + 0.5 * rng() : 0, moss: cls.level === 'high' && rng() < 0.5 ? 0.45 : 0.06,
        matrix: m.toArray(),
      });
      // Raise the pile under the block with a dome.
      const top = p.y + size * flat, r = size * 0.9;
      const i0 = Math.max(0, Math.floor((x - r + SPAN) / cellSize)), i1 = Math.min(GRID - 1, Math.floor((x + r + SPAN) / cellSize));
      const j0 = Math.max(0, Math.floor((z - r + SPAN) / cellSize)), j1 = Math.min(GRID - 1, Math.floor((z + r + SPAN) / cellSize));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const dx = (i + 0.5) * cellSize - SPAN - x, dz = (j + 0.5) * cellSize - SPAN - z;
          const d2 = (dx * dx + dz * dz) / (r * r);
          if (d2 < 1) pile[i + j * GRID] = Math.max(pile[i + j * GRID], top - size * flat * 1.4 * d2);
        }
      }
    }
    perShape.forEach((set, k) => {
      if (set.rocks.length === 0) return;
      // Largest first, so that drawing only a leading part of a set drops its smallest stones.
      set.rocks.sort((a, b) => b.size - a.size);
      const pair = createRockPair(LAYERS, shapes[cls.level][k], shapes[cls.far][k], materials.rubble, set.rocks, { castShadow: !cls.pebbles });
      set.rocks.forEach((rock, i) => pair.near.instanceMatrix.array.set(rock.matrix, i * 16));
      pair.near.computeBoundingSphere();
      pair.far.boundingSphere = pair.near.boundingSphere;
      group.add(pair.near, pair.far);
      stones.push(pair);
      if (cls.pebbles) pebbles.push(pair);
    });
  }

  // ---- sand cones under the streams
  const conePosition = [], coneIndex = [];
  for (const land of landings) {
    if (land.radius <= 0) continue;
    // The sand has heaped over whatever the stream fell on; the stream now stops at its apex.
    land.y = pileAt(land.x, land.z) + 0.03 + land.radius * 0.3;
    coneInto(conePosition, coneIndex, new THREE.Vector3(land.x, land.y, land.z), rng);
  }
  if (coneIndex.length > 0) {
    const cones = new THREE.Mesh(finishStatic(conePosition, coneIndex, { seed: 0.81, occlusion: 0.8 }), materials.sand);
    cones.receiveShadow = true;
    cones.layers.set(LAYERS.MAIN_ONLY);                     // small, pale and on top of the heap: not missed in the reflection
    group.add(cones);
  }

  // ---- crystals among the stones: small clusters, and a few broken points that fell from the geode
  const crystals = new CrystalSet();
  const add = (x, z, lift, dir, length, glow) => {
    p.set(x, Math.max(pileAt(x, z) + shoreRelief(x, z), 0) + lift, z);
    crystals.add(p, dir, length * (0.22 + 0.1 * rng()), length, {
      seed: 1 + rng() * 97, heartDist: p.distanceTo(heart), glow, enclosed: 0, roll: rng() * Math.PI * 2,
    });
  };
  for (let c = 0; c < 8; c++) {
    const r = 0.4 + 1.9 * rng(), a = rng() * Math.PI * 2;
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const members = 3 + Math.floor(rng() * 4);
    for (let k = 0; k < members; k++) {
      axis.set((rng() - 0.5) * 1.3, 1, (rng() - 0.5) * 1.3).normalize();
      add(cx + (rng() - 0.5) * 0.08, cz + (rng() - 0.5) * 0.08, -0.01, axis, 0.035 + 0.07 * rng(), 0.3);
    }
  }
  for (let c = 0; c < 2; c++) {
    // Lying almost flat, out in front of the mouth they dropped from.
    const r = 1.0 + 0.9 * rng(), side = (rng() - 0.5) * 1.4;
    axis.set(rng() - 0.5, 0.12 * rng(), rng() - 0.5).normalize();
    add(mouth.x * r - mouth.z * side, mouth.z * r + mouth.x * side, 0.035, axis, 0.13 + 0.10 * rng(), 0.22);
  }
  group.add(crystals.build(geode.geometry, geode.material));

  return {
    group,
    beds: [bed, bedMirrored],
    /** far: true once the camera is across the ring: the stones are then drawn from their lighter shapes. */
    setFar(far) { for (const pair of stones) pair.setFar(far); },
    /**
     * fraction: how many of the pebbles the quality level allows. share: how many of those the
     * main view draws (fewer with distance). Both drop the smallest first; the film only ever
     * reflects the larger ones.
     */
    setPebbleDensity(fraction, share = 1) {
      for (const pair of pebbles) {
        pair.near.count = Math.floor(pair.near.userData.full * fraction * share);
        pair.far.count = Math.floor(pair.far.userData.full * fraction * MIRRORED_PEBBLES);
      }
    },
  };
}
