import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { NOISE_GLSL } from '../shared/glsl.js';
import { createGlowTexture } from '../shared/sprites.js';
import { createRandom, range } from '../shared/random.js';

/**
 * Earth: a sedimentary butte in golden-hour light.
 *
 * The terrain is one CPU-displaced grid whose cells are packed densely around
 * the butte. Its height is rolling ground plus a few landforms (the butte, a
 * spire, distant mesas and an escarpment ring). Every landform is pushed through
 * a strata table: hard layers become cliffs topped by benches, soft layers
 * weather into talus slopes, so ledges and bands share the same boundaries.
 *
 * Vertex colours carry the stratum palette, soil, slope darkening and fake AO.
 * A small shader patch re-resolves the stratum colour per pixel (crisp bands on
 * near-vertical faces) and adds bedding, joints, desert varnish, angular scree,
 * sand ripples, matching micro relief and drifting cloud shadows. Instanced
 * boulders and shrubs, a shader sky with drifting cirrus, dust motes and low
 * blowing-sand streamers complete the scene.
 */

const SEED = 4127;

// --- terrain grid -------------------------------------------------------------
const TERRAIN_SIZE = 200;
const TERRAIN_SEGMENTS = 320;
// Grid remap x = size/2 * (a*u + b*u^3 + c*u^5): cells near the butte are ~7x
// smaller than at the rim. Weights sum to 1 so the grid still spans the plane.
const GRID_WARP = [0.2, 0.3, 0.5];

// --- landforms ----------------------------------------------------------------
const WARP_AMOUNT = 1.8; // domain warp in world units: buttresses and alcoves
const GULLY_DEPTH = 0.13; // in normalised radius: vertical gullies through every ledge
const FLUTE_DEPTH = 0.015; // finer vertical fluting between the gullies
const ALCOVE_DEPTH = 0.12; // coarser bites out of the cliff line
const FACET_CELL = 1.8; // world units: joint blocks that break the cliff line into flat faces
const FACET_DEPTH = 0.07; // in normalised radius
const LEDGE_WOBBLE = 0.34; // lets each ledge protrude or recede on its own
const CLIFF_FOOT = 0.3; // fraction of a landform's height where talus meets the cliffs
const DIP = { x: 0.016, z: -0.011 }; // the strata dip gently, like real bedding

/**
 * Plan-view ellipses (rx, rz in world units, rotated by `angle`). `height` is the
 * envelope height before terracing; terracing snaps it onto the bench of the
 * hard layer it lands in. `plateau` and `talus` are radii in normalised units.
 */
const LANDFORMS = [
  { name: 'butte', x: -1.2, z: -1.2, rx: 6.6, rz: 4.4, angle: -0.55, height: 7.3, plateau: 0.74, talus: 1.75 },
  { name: 'spire', x: 4.0, z: -16, rx: 1.6, rz: 1.0, angle: 0.4, height: 6.1, plateau: 0.5, talus: 1.6 },
  { name: 'mesa-west', x: -58, z: -48, rx: 16, rz: 7, angle: 0.5, height: 9.8, plateau: 0.78, talus: 1.7 },
  { name: 'mesa-north', x: 24, z: -64, rx: 12, rz: 6, angle: -0.3, height: 7.3, plateau: 0.72, talus: 1.8 },
  { name: 'mesa-east', x: 60, z: -20, rx: 8, rz: 5.5, angle: 1.1, height: 9.8, plateau: 0.7, talus: 1.9 },
];
for (const form of LANDFORMS) {
  form.cos = Math.cos(form.angle);
  form.sin = Math.sin(form.angle);
  form.reach = Math.max(form.rx, form.rz) * form.talus + WARP_AMOUNT * 2;
}

const JOINT_CENTER = new THREE.Vector2(LANDFORMS[0].x, LANDFORMS[0].z); // joints radiate from the butte

// A ring of cliffs closes the basin, so the horizon is a hazy escarpment
// instead of the edge of the grid.
const ESCARPMENT = { radius: 90, radiusVariation: 8, width: 5, height: 6.5, heightVariation: 4.5 };

/**
 * Strata from bottom to top in stratigraphic height (≈ world y). Hard layers
 * stand as cliffs with a bench on top; soft layers weather into concave talus.
 */
const STRATA = [
  { top: 0.6, color: '#76493a', hard: false }, // sienna shale
  { top: 1.15, color: '#6e5d52', hard: false }, // grey mudstone
  { top: 1.45, color: '#8a5238', hard: true }, // rust sandstone ledge
  { top: 2.3, color: '#7d4c38', hard: false }, // sienna shale
  { top: 2.85, color: '#7a6b60', hard: false }, // grey mudstone, recessed under the wall
  { top: 3.75, color: '#a06c47', hard: true }, // ochre sandstone, base of the wall
  { top: 3.9, color: '#86604a', hard: false }, // parting
  { top: 4.85, color: '#94593d', hard: true }, // rust sandstone
  { top: 5.0, color: '#87634c', hard: false }, // parting
  { top: 6.3, color: '#a6784f', hard: true }, // ochre massive sandstone
  { top: 6.45, color: '#88674f', hard: false }, // parting
  { top: 7.6, color: '#a69174', hard: true }, // cream caprock
  { top: 8.4, color: '#786a5f', hard: false }, // grey mudstone
  { top: 10.2, color: '#a0704a', hard: true }, // ochre
  { top: 10.8, color: '#a08a70', hard: false }, // buff
  { top: 12.6, color: '#a99579', hard: true }, // cream
];
// Every bed is pulled toward one sandstone, so beds differ mostly in value, not hue.
const SANDSTONE = new THREE.Color('#9a6a48');
const STRATA_UNITY = 0.3;
const STRATA_BASE = -3; // bottom of the lowest layer; anything below stays as is
const CLIFF_FRACTION = 0.3; // share of a hard layer's run taken by its cliff face
const BENCH_RISE = 0.06; // benches tilt up slightly instead of being dead flat
const TALUS_CURVE = 1.6; // soft layers steepen toward the ledge above
const STRATA_BLEND_CPU = 0.04; // band edge softness for the per-vertex palette
const STRATA_WANDER = 0.22; // bed boundaries pinch and swell by about ±0.1 around the butte

const SOIL_RED = new THREE.Color('#9a5c3c');
const SOIL_BUFF = new THREE.Color('#b48a64');
const SOIL_DARK = new THREE.Color('#6a4632');

// --- light and atmosphere -----------------------------------------------------
const SUN_DIRECTION = new THREE.Vector3(0.9, 0.36, -0.28).normalize(); // ~20° elevation, raking from the right
const SUN_COLOR = new THREE.Color('#ffb977');
const SUN_INTENSITY = 4.4;
const SKY_FILL = new THREE.Color('#a2abb9');
const GROUND_BOUNCE = new THREE.Color('#9a6040'); // red reflected light warms the shaded walls
const HEMI_INTENSITY = 0.6;
const ENV_INTENSITY = 0.25; // neutral studio fill, kept modest
const SHADOW_CENTER = new THREE.Vector3(-3, 1.5, -2);
const SHADOW_HALF_EXTENT = 19;

const SKY = {
  zenith: new THREE.Color('#2a5590'),
  mid: new THREE.Color('#7393bb'),
  horizon: new THREE.Color('#dba57a'),
  sunGlow: new THREE.Color('#ff8a3a'),
  cloudLit: new THREE.Color('#ffb880'),
  cloudShade: new THREE.Color('#7d6f80'),
};
const FOG_COLOR = new THREE.Color('#c9946c');
const FOG_NEAR = 35;
const FOG_FAR = 165;

// Cloud shadows drift across the land with the cirrus; they dim only the sun.
// The tile repeats every `period` world units, stretched along the wind like the cirrus.
const CLOUD_SHADOW = {
  textureSize: 256,
  cells: 5, // coarsest noise lattice across the tile
  cover: 0.12, // softness of the shadow edges, in noise units
  period: new THREE.Vector2(170, 85),
  speed: 1.4,
  floor: 0.5, // share of the sun left inside a shadow
};

// --- camera -------------------------------------------------------------------
const CAMERA_TARGET = new THREE.Vector3(0, 2.4, 0);
const CAMERA_OFFSET = new THREE.Vector3(14, 4, 16); // framed for a 1280x800 window
const DESIGN_ASPECT = 1280 / 800;
const MAX_PULL_BACK = 1.9; // how far a narrow (portrait) screen may back away
const MAX_DISTANCE = 46;

// --- props --------------------------------------------------------------------
const BOULDER_SHAPES = 3;
const BLOCKS_PER_SHAPE = 36; // blocks of all sizes, gathered at the cliff foot
const CHIPS_PER_SHAPE = 84; // small angular fragments, only at the cliff foot
const BOULDER_SINK = 0.2; // share of a block's height buried in the ground
const SCRUB_COUNT = 520;
const SCRUB_NEAR = 10; // shrubs closer than this to the camera stay small
const DUST_COUNT = 420;
const DUST_BOX_MIN = new THREE.Vector3(-18, 0, -16);
const DUST_BOX_SIZE = new THREE.Vector3(36, 6, 34);
const WIND = new THREE.Vector2(1, -0.17).normalize(); // the breeze the dust and sand follow
const STREAMERS = [
  // Lift off the talus toe and the butte's downwind foot, then run downwind clear of the cliffs.
  { x: -3.2, z: 7.0, length: 12, height: 1.4 },
  { x: 0.8, z: 5.8, length: 10, height: 1.1 },
  { x: 5.6, z: -2.5, length: 11, height: 1.6 },
];
const STREAMER_SEGMENTS = 32;
const STREAMER_SPEED = 2.6;

/** @param {import('./index.js').ElementContext} ctx @returns {import('./index.js').ElementScene} */
export function createEarth(ctx) {
  const root = new THREE.Group();
  const random = createRandom(SEED);
  const field = createTerrainField(random);
  const strataUniforms = createStrataUniforms();

  // Narrow screens pull back along the same view so the butte keeps its width.
  const cameraPose = { position: new THREE.Vector3(), target: CAMERA_TARGET.clone() };
  const frameCamera = (aspect) => {
    const pullBack = THREE.MathUtils.clamp((DESIGN_ASPECT / aspect) ** 0.75, 1, MAX_PULL_BACK);
    cameraPose.position.copy(cameraPose.target).addScaledVector(CAMERA_OFFSET, pullBack);
  };
  frameCamera(ctx.camera.aspect);
  const startDistance = cameraPose.position.distanceTo(cameraPose.target);

  // Materials get the env map directly: with only scene.environment, three
  // ignores envMapIntensity and lights everything at full strength.
  const roomEnvironment = new RoomEnvironment();
  const envTarget = ctx.pmrem.fromScene(roomEnvironment, 0.04);
  roomEnvironment.dispose();
  const envMap = envTarget.texture;

  // One clock for everything that moves: cloud shadows, cirrus, dust and sand.
  const time = { value: 0 };
  const cloudUniforms = { uTime: time, uCloudMap: { value: createCloudTexture() } };
  const terrain = buildTerrain(field, strataUniforms, envMap, cloudUniforms);
  const boulders = buildBoulders(field, random, envMap, cloudUniforms);
  const scrub = buildScrub(field, random, envMap, cloudUniforms, cameraPose.position);
  const sky = buildSky(time);
  const dust = buildDust(random, ctx.pixelRatio, time);
  const streamers = buildStreamers(field, time);
  const lights = buildLights();
  root.add(sky.mesh, terrain.mesh, ...boulders.meshes, scrub.mesh, dust.points, streamers.mesh, ...lights.objects);

  return {
    root,
    update(seconds) {
      time.value = seconds;
    },
    dispose() {
      terrain.dispose();
      boulders.dispose();
      scrub.dispose();
      sky.dispose();
      dust.dispose();
      streamers.dispose();
      lights.dispose();
      cloudUniforms.uCloudMap.value.dispose();
      envTarget.dispose();
    },
    camera: cameraPose,
    look: {
      background: FOG_COLOR.clone(),
      environment: envMap,
      fog: new THREE.Fog(FOG_COLOR.clone(), FOG_NEAR, FOG_FAR),
      exposure: 0.95,
      bloom: { strength: 0.1, radius: 0.5, threshold: 0.9 },
    },
    controls: {
      minDistance: 8,
      maxDistance: Math.max(MAX_DISTANCE, startDistance * 1.25),
      minPolarAngle: 0.35,
      maxPolarAngle: 1.45,
    },
    onResize(width, height) {
      frameCamera(width / Math.max(height, 1)); // updates the pose "Reset view" returns to
    },
  };
}

// --- terrain field -------------------------------------------------------------

/**
 * The height function shared by the terrain grid and the prop scatter.
 * `sample(x, z, out)` fills out.height, out.stratum (stratigraphic height, used
 * for colour), out.envelope (landform height before terracing) and out.land
 * (how strongly the strata shape the surface: 0 on open ground, 1 on a landform).
 */
function createTerrainField(random) {
  const perlin = new ImprovedNoise();
  const seeded = () => [range(random, -300, 300), range(random, -300, 300), range(random, -300, 300)];
  const OFFSET = {
    warpX: seeded(),
    warpZ: seeded(),
    gully: seeded(),
    ledge: seeded(),
    swell: seeded(),
    ground: seeded(),
    rim: seeded(),
  };

  const noise = (x, y, z, o) => perlin.noise(x + o[0], y + o[1], z + o[2]);

  function fbm(x, y, z, octaves, o) {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise(x * freq, y * freq, z * freq, o);
      amp *= 0.5;
      freq *= 2.03;
    }
    return sum;
  }

  // Billowy swells (|noise| gives round crests and creased hollows) and fine roll.
  function groundHeight(x, z) {
    let swell = 0;
    let amp = 0.5;
    let freq = 0.022;
    for (let i = 0; i < 3; i++) {
      swell += amp * Math.abs(noise(x * freq, 0.3, z * freq, OFFSET.swell));
      amp *= 0.5;
      freq *= 2.1;
    }
    const roll = fbm(x * 0.09, 0.6, z * 0.09, 3, OFFSET.ground);
    return 2.0 * swell + 0.4 * roll - 0.45;
  }

  function landformProfile(r, plateau, talus) {
    if (r <= plateau) return 1;
    if (r <= 1) return 1 - ((1 - CLIFF_FOOT) * (r - plateau)) / (1 - plateau);
    if (r >= talus) return 0;
    const t = 1 - (r - 1) / (talus - 1);
    return CLIFF_FOOT * t * t;
  }

  function escarpmentHeight(x, z, gully) {
    const dist = Math.hypot(x, z);
    if (dist < ESCARPMENT.radius - ESCARPMENT.radiusVariation - ESCARPMENT.width * 3) return 0;
    const ux = x / Math.max(dist, 1e-3);
    const uz = z / Math.max(dist, 1e-3);
    const radius = ESCARPMENT.radius + ESCARPMENT.radiusVariation * fbm(ux * 2.2, 0.5, uz * 2.2, 3, OFFSET.rim);
    const height = ESCARPMENT.height + ESCARPMENT.heightVariation * noise(ux * 3.1, 2.5, uz * 3.1, OFFSET.rim);
    const r = 0.4 + (radius - dist) / ESCARPMENT.width + gully;
    return height * landformProfile(r, 0.4, 1.9);
  }

  function terraceStrata(s) {
    if (s < STRATA_BASE) return s;
    let bottom = STRATA_BASE;
    for (const layer of STRATA) {
      if (s < layer.top) {
        const thickness = layer.top - bottom;
        const f = (s - bottom) / thickness;
        return bottom + thickness * (layer.hard ? cliffProfile(f) : slopeProfile(f));
      }
      bottom = layer.top;
    }
    return s;
  }

  function sample(x, z, out) {
    const wx = x + WARP_AMOUNT * fbm(x * 0.06, 1.3, z * 0.06, 3, OFFSET.warpX);
    const wz = z + WARP_AMOUNT * fbm(x * 0.06, 2.7, z * 0.06, 3, OFFSET.warpZ);
    const crease = Math.min(Math.max(1 - Math.abs(noise(wx * 0.32, 0.5, wz * 0.32, OFFSET.gully)), 0), 1);
    const bite = Math.min(Math.max(1 - Math.abs(noise(wx * 0.11, 4.5, wz * 0.11, OFFSET.gully)), 0), 1);
    const flute = Math.min(Math.max(1 - Math.abs(noise(wx * 0.85, 8.5, wz * 0.85, OFFSET.gully)), 0), 1);
    const facet = cellEdge(wx / FACET_CELL, wz / FACET_CELL);
    const gully = GULLY_DEPTH * crease ** 4 + ALCOVE_DEPTH * bite ** 3 + FLUTE_DEPTH * flute ** 3 + FACET_DEPTH * facet;

    let envelope = escarpmentHeight(wx, wz, gully);
    for (const form of LANDFORMS) {
      const dx = wx - form.x;
      const dz = wz - form.z;
      if (Math.abs(dx) > form.reach || Math.abs(dz) > form.reach) continue;
      const u = (dx * form.cos + dz * form.sin) / form.rx;
      const v = (dz * form.cos - dx * form.sin) / form.rz;
      // Superellipse (p = 3) gives blockier, more mesa-like outlines than a circle.
      const r = (Math.abs(u) ** 3 + Math.abs(v) ** 3) ** (1 / 3) + gully;
      envelope = Math.max(envelope, form.height * landformProfile(r, form.plateau, form.talus));
    }

    const ground = groundHeight(x, z);
    const tilt = DIP.x * x + DIP.z * z;
    const wobble = LEDGE_WOBBLE * noise(x * 0.25, envelope * 0.3, z * 0.25, OFFSET.ledge);
    const raw = ground + envelope + tilt + wobble;
    // Low on the talus the ledges are half buried, so they surface in patches.
    const buried = smoothstep(-0.15, 0.25, noise(x * 0.16, 6.5, z * 0.16, OFFSET.ledge));
    const land = smoothstep(0.05, 0.8, envelope) * (buried + (1 - buried) * smoothstep(1.6, 2.6, envelope));
    const stratum = raw + (terraceStrata(raw) - raw) * land;

    // Weathered surfaces: small rubble on benches and tops, a ragged rim.
    const rubble = 0.12 * land * fbm(x * 0.9, 5.5, z * 0.9, 2, OFFSET.ledge);
    out.height = stratum - tilt - wobble + rubble;
    out.stratum = stratum;
    out.land = land;
    out.envelope = envelope;
    return out;
  }

  const probe = { height: 0, stratum: 0, land: 0, envelope: 0 };
  /** Terrain normal by central differences, written into `target`. */
  function normalAt(x, z, target, step = 0.25) {
    const hx0 = sample(x - step, z, probe).height;
    const hx1 = sample(x + step, z, probe).height;
    const hz0 = sample(x, z - step, probe).height;
    const hz1 = sample(x, z + step, probe).height;
    return target.set(hx0 - hx1, 2 * step, hz0 - hz1).normalize();
  }

  return { sample, normalAt, noise, fbm, OFFSET };
}

// Hard layer: a sheer face with a crisp rim, then a narrow bench.
function cliffProfile(f) {
  return (1 - BENCH_RISE) * Math.min(f / CLIFF_FRACTION, 1) + BENCH_RISE * f;
}

// Soft layer: concave talus, flat at the foot, steepening toward the ledge above.
function slopeProfile(f) {
  return f ** TALUS_CURVE;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Integer hash of a grid cell to [0, 1). */
function hashCell(x, z, k) {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(k + SEED, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Cellular F2 - F1 on a jittered grid (in cell units): 0 on cell borders and
 * rising roughly linearly inward, so a contour pushed by it turns into flat
 * facets meeting at sharp corners.
 */
function cellEdge(x, z) {
  const cx = Math.floor(x);
  const cz = Math.floor(z);
  let f1 = Infinity;
  let f2 = Infinity;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const gx = cx + i;
      const gz = cz + j;
      const dx = gx + hashCell(gx, gz, 0) - x;
      const dz = gz + hashCell(gx, gz, 1) - z;
      const d = dx * dx + dz * dz;
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return Math.sqrt(f2) - Math.sqrt(f1);
}

// --- strata palette -------------------------------------------------------------

const STRATA_COLORS = STRATA.map((layer) => new THREE.Color(layer.color).lerp(SANDSTONE, STRATA_UNITY));

function createStrataUniforms() {
  return {
    uStrataTop: { value: STRATA.map((layer) => layer.top) },
    uStrataColor: { value: STRATA_COLORS },
  };
}

/** Stratum colour at stratigraphic height `s`, blended over ±`blend` at boundaries. */
function strataColor(s, blend, target) {
  target.copy(STRATA_COLORS[0]);
  for (let i = 0; i < STRATA.length - 1; i++) {
    const t = smoothstep(STRATA[i].top - blend, STRATA[i].top + blend, s);
    if (t > 0) target.lerp(STRATA_COLORS[i + 1], t);
  }
  return target;
}

// The GLSL twin of strataColor().
const STRATA_GLSL = /* glsl */ `
uniform float uStrataTop[${STRATA.length}];
uniform vec3 uStrataColor[${STRATA.length}];
vec3 strataColor(float s, float blend) {
  vec3 color = uStrataColor[0];
  for (int i = 0; i < ${STRATA.length - 1}; i++) {
    if (s < uStrataTop[i] - blend) break; // boundaries are sorted: nothing above can blend in
    color = mix(color, uStrataColor[i + 1], smoothstep(uStrataTop[i] - blend, uStrataTop[i] + blend, s));
  }
  return color;
}
`;

// --- terrain mesh ----------------------------------------------------------------

function warpAxis(u) {
  const [a, b, c] = GRID_WARP;
  const u3 = u * u * u;
  return (TERRAIN_SIZE / 2) * (a * u + b * u3 + c * u3 * u * u);
}

function buildTerrain(field, strataUniforms, envMap, cloudUniforms) {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
  geometry.rotateX(-Math.PI / 2);
  geometry.deleteAttribute('uv');

  const grid = TERRAIN_SEGMENTS + 1;
  const count = grid * grid;
  const position = geometry.attributes.position;
  const heights = new Float32Array(count);
  const strata = new Float32Array(count * 2); // stratigraphic height, talus weight
  const lands = new Float32Array(count);
  const sample = { height: 0, stratum: 0, land: 0, envelope: 0 };
  const half = TERRAIN_SIZE / 2;
  const { noise, fbm, OFFSET } = field;

  // Displace. Colour boundaries wander a little around the ledges (each one on
  // its own), so beds pinch and swell instead of forming perfect rings.
  for (let i = 0; i < count; i++) {
    const x = warpAxis(position.getX(i) / half);
    const z = warpAxis(position.getZ(i) / half);
    field.sample(x, z, sample);
    position.setXYZ(i, x, sample.height, z);
    heights[i] = sample.height;
    strata[i * 2] = sample.stratum + STRATA_WANDER * fbm(x * 0.08, sample.stratum * 0.7, z * 0.08, 2, OFFSET.rim);
    strata[i * 2 + 1] = smoothstep(0.05, 0.6, sample.envelope);
    lands[i] = sample.land;
  }
  geometry.computeVertexNormals();

  // Fake ambient occlusion: compare each vertex with its neighbourhood average
  // at two scales. Hollows (average above the vertex) darken, crests lift a touch.
  const nearAverage = boxBlur(heights, grid, 3);
  const farAverage = boxBlur(heights, grid, 12);

  const colors = new Float32Array(count * 3);
  const palette = new Float32Array(count * 4);
  const normal = geometry.attributes.normal;
  const stratumColor = new THREE.Color();
  const rockColor = new THREE.Color();
  const soilColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const up = normal.getY(i);
    const land = lands[i];

    strataColor(strata[i * 2], STRATA_BLEND_CPU, stratumColor);

    // Bare rock only on real ledges steeper than ~40°; everything else, steep
    // debris included, is soil or talus.
    const rock = smoothstep(0.82, 0.55, up) * smoothstep(0.65, 0.95, land);

    // Rock tone: per-vertex variation, darker on the steepest faces.
    const variation = 1 + 0.16 * fbm(x * 0.45, y * 0.45, z * 0.45, 3, OFFSET.ledge);
    const hue = fbm(x * 0.12, y * 0.2, z * 0.12, 2, OFFSET.warpX); // redder or yellower along a band
    rockColor.copy(stratumColor).multiplyScalar(variation * (1 - 0.22 * rock));
    rockColor.r *= 1 + 0.12 * hue;
    rockColor.b *= 1 - 0.18 * hue;

    // Soil: red and buff patches, darker sand in the hollows. On a landform the
    // talus is mixed debris from all the layers above, so it barely takes a band's tint.
    const patch = fbm(x * 0.05, 0.2, z * 0.05, 3, OFFSET.ground);
    const fine = noise(x * 0.7, 3.1, z * 0.7, OFFSET.swell);
    soilColor.copy(SOIL_RED).lerp(SOIL_BUFF, smoothstep(-0.25, 0.35, patch));
    soilColor.lerp(SOIL_DARK, smoothstep(0.1, 0.6, nearAverage[i] - heights[i]) * 0.6);
    soilColor.multiplyScalar(0.92 + 0.1 * fine);
    soilColor.lerp(stratumColor, 0.08 * land);

    const hollow = (nearAverage[i] - heights[i]) * 0.9 + (farAverage[i] - heights[i]) * 0.22;
    const ao = Math.min(Math.max(1 - hollow, 0.42), 1.08);

    soilColor.lerp(rockColor, rock).multiplyScalar(ao);
    colors[i * 3] = soilColor.r;
    colors[i * 3 + 1] = soilColor.g;
    colors[i * 3 + 2] = soilColor.b;
    palette[i * 4] = stratumColor.r;
    palette[i * 4 + 1] = stratumColor.g;
    palette[i * 4 + 2] = stratumColor.b;
    palette[i * 4 + 3] = rock;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aPalette', new THREE.BufferAttribute(palette, 4));
  geometry.setAttribute('aStrata', new THREE.BufferAttribute(strata, 2));
  geometry.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    envMap,
    envMapIntensity: ENV_INTENSITY,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, strataUniforms);
    patchRockShader(shader, { strata: true });
    addCloudShadows(shader, cloudUniforms);
  };
  material.customProgramCacheKey = () => 'earth-terrain';

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

/** Separable box blur of a square grid of values (running sums, clamped edges). */
function boxBlur(values, size, radius) {
  const temp = new Float32Array(values.length);
  const out = new Float32Array(values.length);
  const window = radius * 2 + 1;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        sum += values[row * size + Math.min(Math.max(col + k, 0), size - 1)];
      }
      temp[row * size + col] = sum / window;
    }
  }
  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size; row++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        sum += temp[Math.min(Math.max(row + k, 0), size - 1) * size + col];
      }
      out[row * size + col] = sum / window;
    }
  }
  return out;
}

// --- rock shading patch ------------------------------------------------------------

/**
 * Adds per-pixel detail to a MeshStandardMaterial: grain and bedding everywhere;
 * varnish streaks and joints on cliffs; angular scree chips and ripples on soil;
 * and a matching micro-relief normal. With `strata` (the terrain), it also swaps
 * the interpolated stratum colour for a per-pixel one; without it (boulders),
 * the bedding follows each block's own local height.
 */
function patchRockShader(shader, { strata }) {
  shader.uniforms.uJointCenter = { value: JOINT_CENTER };
  shader.uniforms.uSunDirection = { value: SUN_DIRECTION };
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      /* glsl */ `#include <common>
${NOISE_GLSL}
varying vec3 vRockPosition;
varying vec3 vRockLocal;
varying vec4 vRockNoise;
${strata ? 'attribute vec2 aStrata;\nattribute vec4 aPalette;\nvarying vec2 vStrata;\nvarying vec4 vPalette;' : ''}`,
    )
    .replace(
      '#include <project_vertex>',
      /* glsl */ `#include <project_vertex>
vec4 rockWorld = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  rockWorld = instanceMatrix * rockWorld;
#endif
vRockPosition = (modelMatrix * rockWorld).xyz;
vRockLocal = transformed;
// Low-frequency patterns are sampled per vertex; the grid is fine enough for them.
vRockNoise = vec4(
  snoise(vec3(vRockPosition.x * 1.4, vRockPosition.y * 0.1, vRockPosition.z * 1.4)), // varnish streaks
  snoise(vRockPosition * vec3(0.5, 0.45, 0.5)), // where joints run
  snoise(vRockPosition * 0.07 + 3.0), // ripple patches
  snoise(vRockPosition * 0.35) // ripple wander
);
${strata ? 'vStrata = aStrata;\nvPalette = aPalette;' : ''}`,
    );

  const strataBlock = strata
    ? /* glsl */ `
  // Crisp strata: replace the interpolated palette colour with the per-pixel one.
  float stratumWidth = max(fwidth(vStrata.x), 0.015);
  vec3 pixelStrata = strataColor(vStrata.x, stratumWidth);
  vec3 strataRatio = clamp(pixelStrata / max(vPalette.rgb, vec3(1e-3)), vec3(0.25), vec3(4.0));
  diffuseColor.rgb *= mix(vec3(1.0), strataRatio, vPalette.a);
  float rockMask = vPalette.a;
  float beddingStrength = rockMask;
  float jointStrength = rockMask;
  float bedHeight = vStrata.x;
  float talus = vStrata.y;`
    : /* glsl */ `
  float rockMask = 1.0;
  float beddingStrength = 0.2;
  float jointStrength = 0.0;
  float stratumWidth = max(fwidth(vRockLocal.y * 0.5), 1e-3);
  float bedHeight = vRockLocal.y * 0.5;
  float talus = 0.0;`;

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      /* glsl */ `#include <common>
varying vec3 vRockPosition;
varying vec3 vRockLocal;
varying vec4 vRockNoise;
uniform vec2 uJointCenter;
uniform vec3 uSunDirection;
${strata ? 'varying vec2 vStrata;\nvarying vec4 vPalette;\n' + STRATA_GLSL : ''}
${NOISE_GLSL}

// 1 while a pattern is well resolved, fading to 0 before it aliases.
float detailFade(float frequency, float footprint) {
  return 1.0 - smoothstep(0.25, 0.6, frequency * footprint);
}

vec2 chipHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// Cellular noise on a jittered grid. x: F2 - F1 (0 on cell borders, rising
// inward), y: a random value per cell, zw: offset of this pixel from the cell's site.
vec4 chipCell(vec2 x) {
  vec2 n = floor(x);
  vec2 f = x - n;
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 id = n;
  vec2 offset = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + chipHash(n + g) - f;
      float d = dot(r, r);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = n + g;
        offset = -r;
      } else if (d < d2) {
        d2 = d;
      }
    }
  }
  return vec4(sqrt(d2) - sqrt(d1), chipHash(id + 41.0).x, offset);
}

// Bump from a scalar height (Mikkelsen, unnormalised screen derivatives).
vec3 perturbRockNormal(vec3 surfacePos, vec3 surfaceNormal, vec2 dHdxy, float faceDir) {
  vec3 sigmaX = dFdx(surfacePos);
  vec3 sigmaY = dFdy(surfacePos);
  vec3 r1 = cross(sigmaY, surfaceNormal);
  vec3 r2 = cross(surfaceNormal, sigmaX);
  float det = dot(sigmaX, r1) * faceDir;
  if (abs(det) < 1e-12) return surfaceNormal;
  vec3 bent = abs(det) * surfaceNormal - sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  float len = length(bent);
  return len > 1e-12 ? bent / len : surfaceNormal;
}`,
    )
    .replace(
      '#include <normal_fragment_maps>',
      /* glsl */ `#include <normal_fragment_maps>
{
  vec3 p = vRockPosition;
  float footprint = max(length(fwidth(p)), 1e-4);
  vec3 upView = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  float steep = 1.0 - smoothstep(0.55, 0.88, dot(nonPerturbedNormal, upView));
${strataBlock}

  float soil = (1.0 - rockMask) * (1.0 - steep);

  // Grain at two scales (vertex colours carry the coarser mottling), each faded
  // out before it can shimmer. On rock the mid grain is drawn out along the
  // bedding like laminae; on soil it is isotropic.
  float grainSoil = 0.0;
  float grainRock = 0.0;
  if (rockMask < 0.99) grainSoil = snoise(p * 6.3 + 11.0) * detailFade(6.3, footprint);
  if (rockMask > 0.01) grainRock = snoise(p * vec3(2.5, 14.0, 2.5) + 11.0) * detailFade(14.0, footprint);
  float grainMid = mix(grainSoil, grainRock, rockMask);
  float grainFine = 0.0;
  float fineFade = detailFade(17.0, footprint);
  if (fineFade > 0.0) grainFine = snoise(p * 17.0 + 23.0) * fineFade;
  float grain = 0.75 * grainMid + 0.25 * grainFine;

  // Rock and soil detail are only evaluated where they show. Every derivative
  // (footprint, stratumWidth, the relief below) is taken outside these branches.
  float bedding = 0.0;
  float varnish = 0.0;
  float joint = 0.0;
  if (rockMask > 0.01) {
    // Thin bedding inside each stratum, ridged so the low sun catches each lip.
    // Some bed sets are finely laminated, others massive.
    float bedFrequency = 4.5;
    float bedNoise = snoise(vec3(p.x * 0.11, bedHeight * bedFrequency, p.z * 0.11));
    float bedSet = smoothstep(-0.45, 0.55, snoise(vec3(p.x * 0.04, bedHeight * 1.1, p.z * 0.04)));
    bedding = (1.0 - 2.0 * abs(bedNoise)) * bedSet * detailFade(bedFrequency, stratumWidth);

    // Desert varnish: dark streaks running down steep faces.
    varnish = smoothstep(0.2, 0.8, vRockNoise.x) * steep * rockMask;

    // Joints: straight vertical fractures. The noise depends only on the bearing
    // from the butte, so its zero lines are radial and cut the walls vertically;
    // a second noise lets each joint start and stop.
    if (jointStrength > 0.0) {
      vec2 bearing = normalize(p.xz - uJointCenter + vec2(1e-4));
      float jointLine = 1.0 - abs(snoise(vec3(bearing * 7.0, 0.5)));
      float jointReach = smoothstep(0.0, 0.5, vRockNoise.y);
      joint = smoothstep(0.9, 0.985, jointLine) * jointReach * detailFade(16.0, footprint) * steep * jointStrength;
    }
  }

  float stones = 0.0;
  float stoneLift = 0.0;
  float stoneTone = 1.0;
  float stoneShadow = 0.0;
  float ripple = 0.0;
  if (soil > 0.01) {
    // Scree: angular chips cut from a cellular pattern. F2 - F1 rises linearly
    // from each cell border, so a clamped ramp of it makes a low truncated
    // pyramid whose planar facets catch the sun differently. Fine, sparse gravel
    // on the flats; coarser, packed debris on the talus. Each chip casts a short
    // soft shadow on the ground behind it.
    float chipFrequency = mix(6.0, 3.8, talus);
    float chipFade = detailFade(chipFrequency, footprint) * soil;
    if (chipFade > 0.01) {
      vec4 cell = chipCell(p.xz * chipFrequency);
      float present = step(cell.y, mix(0.16, 0.5, talus));
      float inset = 0.06 + 0.2 * fract(cell.y * 7.13); // chips vary in size
      float edge = max(0.04, 1.5 * chipFrequency * footprint);
      float body = smoothstep(inset, inset + edge, cell.x);
      float away = clamp(-dot(normalize(cell.zw + vec2(1e-4)), normalize(uSunDirection.xz)), 0.0, 1.0);
      stones = present * body * chipFade;
      stoneLift = present * clamp((cell.x - inset) / 0.3, 0.0, 1.0) * chipFade;
      stoneTone = mix(0.78, 1.12, fract(cell.y * 13.7)); // some darker, some paler
      stoneShadow = present * away * smoothstep(inset - 0.1, inset, cell.x) * (1.0 - body) * chipFade;
    }

    // Wind ripples on the open sand, wandering a little and coming and going in patches.
    float rippleFrequency = 7.0;
    float rippleField = smoothstep(-0.3, 0.5, vRockNoise.z) * (1.0 - talus);
    ripple = sin(dot(p.xz, vec2(0.83, 0.56)) * rippleFrequency + 2.5 * vRockNoise.w)
      * detailFade(rippleFrequency * 0.3, footprint) * soil * rippleField;
  }

  diffuseColor.rgb *= (1.0 + 0.07 * bedding * beddingStrength) * (1.0 + 0.13 * grain)
    * mix(vec3(1.0), vec3(0.6, 0.47, 0.38), varnish) // varnish is a dark brown stain
    * (1.0 - 0.45 * joint) * mix(1.0, stoneTone, stones) * (1.0 - 0.25 * stoneShadow);

  // Micro relief: ledge lips and recessed joints on rock, ripples on sand,
  // faceted chips, and only a light grain (more reads as stucco, not sandstone).
  float relief = 0.035 * bedding * beddingStrength + 0.008 * grainMid + 0.004 * grainFine
    + 0.009 * ripple - 0.05 * joint + 0.05 * stoneLift * mix(0.5, 1.0, talus);
  normal = perturbRockNormal(-vViewPosition, normal, vec2(dFdx(relief), dFdy(relief)), faceDirection);
}`,
    );
}

// --- cloud shadows -------------------------------------------------------------------

/**
 * The cloud-shadow field as a small tileable texture: periodic value-noise fbm,
 * baked to 0 (shadow) .. 1 (sun). One fetch per pixel is far cheaper than
 * evaluating fbm on every vertex of the boulders and shrubs.
 */
function createCloudTexture() {
  const { textureSize: size, cells, cover } = CLOUD_SHADOW;
  const random = createRandom(SEED + 1); // its own stream, so the props scatter is unchanged
  const values = new Float32Array(size * size);
  let amplitude = 0.5;
  for (let octave = 0; octave < 4; octave++) {
    const n = cells << octave; // lattice cells across the tile; every octave wraps
    const lattice = Float32Array.from({ length: n * n }, () => random() * 2 - 1);
    const at = (i, j) => lattice[(j % n) * n + (i % n)];
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * n;
      const y0 = Math.floor(fy);
      const ty = smoothstep(0, 1, fy - y0);
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * n;
        const x0 = Math.floor(fx);
        const tx = smoothstep(0, 1, fx - x0);
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
        const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
        values[y * size + x] += amplitude * (top + (bottom - top) * ty);
      }
    }
    amplitude *= 0.5;
  }
  const data = new Uint8Array(size * size);
  for (let i = 0; i < data.length; i++) data[i] = Math.round(255 * smoothstep(-cover, cover, values[i]));

  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Drifting cloud shadows for a MeshStandardMaterial: the cloud texture, laid
 * on the ground plane, scrolls downwind with the cirrus and dims only the
 * direct sun, so shaded faces keep their sky and ground fill.
 */
function addCloudShadows(shader, cloudUniforms) {
  Object.assign(shader.uniforms, cloudUniforms);
  const { period, speed, floor } = CLOUD_SHADOW;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec2 vCloudUv;')
    .replace(
      '#include <project_vertex>',
      /* glsl */ `#include <project_vertex>
{
  vec4 cloudWorld = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    cloudWorld = instanceMatrix * cloudWorld;
  #endif
  vec2 cloudXZ = (modelMatrix * cloudWorld).xz - vec2(uTime * ${speed.toFixed(3)}, 0.0);
  vCloudUv = cloudXZ / vec2(${period.x.toFixed(1)}, ${period.y.toFixed(1)});
}`,
    );
  const sunLoop = 'getDirectionalLightInfo( directionalLight, directLight );';
  const lights = THREE.ShaderChunk.lights_fragment_begin.replace(sunLoop, `${sunLoop}\n\t\tdirectLight.color *= cloudLit;`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform sampler2D uCloudMap;\nvarying vec2 vCloudUv;')
    .replace(
      '#include <lights_fragment_begin>',
      `float cloudLit = mix(${floor.toFixed(3)}, 1.0, texture(uCloudMap, vCloudUv).r);\n${lights}`,
    );
}

// --- boulders ------------------------------------------------------------------------

/** A broken sandstone block: an icosphere sliced by random planes, then weathered. */
function createBoulderGeometry(random, noise) {
  const sphere = new THREE.IcosahedronGeometry(1, 2);
  sphere.deleteAttribute('normal');
  sphere.deleteAttribute('uv');
  const geometry = mergeVertices(sphere);
  sphere.dispose();

  const cuts = [];
  for (let i = 0; i < 10; i++) {
    const normal = new THREE.Vector3(range(random, -1, 1), range(random, -0.6, 1), range(random, -1, 1)).normalize();
    cuts.push({ normal, depth: range(random, 0.5, 0.8) });
  }
  const seed = range(random, 0, 100);
  const position = geometry.attributes.position;
  const p = new THREE.Vector3();
  const colors = new Float32Array(position.count * 3);

  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i);
    for (const cut of cuts) {
      const excess = p.dot(cut.normal) - cut.depth;
      if (excess > 0) p.addScaledVector(cut.normal, -excess);
    }
    const lump = 1 + 0.06 * noise(p.x * 1.6 + seed, p.y * 1.6, p.z * 1.6) + 0.025 * noise(p.x * 5, p.y * 5 + seed, p.z * 5);
    p.multiplyScalar(lump);
    position.setXYZ(i, p.x, p.y, p.z);

    // Darker toward the ground contact, a little mottling elsewhere.
    const shade = (0.62 + 0.38 * smoothstep(-0.7, 0.3, p.y)) * (0.9 + 0.1 * noise(p.x * 3 + seed, p.y * 3, p.z * 3));
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  // Creased normals keep the fracture planes crisp instead of smoothing them into a pebble.
  const creased = toCreasedNormals(geometry, 0.6);
  geometry.dispose();
  return creased;
}

function buildBoulders(field, random, envMap, cloudUniforms) {
  const noise = (x, y, z) => field.noise(x, y, z, field.OFFSET.ground);
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.93,
    metalness: 0,
    envMap,
    envMapIntensity: ENV_INTENSITY,
  });
  material.onBeforeCompile = (shader) => {
    patchRockShader(shader, { strata: false });
    addCloudShadows(shader, cloudUniforms);
  };
  material.customProgramCacheKey = () => 'earth-boulder';

  const butte = LANDFORMS[0];
  const hardColors = STRATA_COLORS.filter((_, i) => STRATA[i].hard && STRATA[i].top > 2 && STRATA[i].top < 7);
  const sample = { height: 0, stratum: 0, land: 0, envelope: 0 };
  const up = new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const tilt = new THREE.Quaternion();
  const spin = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  const tint = new THREE.Color();
  const geometries = [];
  const meshes = [];

  for (let shape = 0; shape < BOULDER_SHAPES; shape++) {
    const geometry = createBoulderGeometry(random, noise);
    const capacity = BLOCKS_PER_SHAPE + CHIPS_PER_SHAPE;
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    let placed = 0;

    for (let attempt = 0; attempt < 12000 && placed < capacity; attempt++) {
      const chip = placed >= BLOCKS_PER_SHAPE; // blocks first, then the small fragments
      const angle = random() * Math.PI * 2;
      const dist = 4 + 20 * Math.sqrt(random());
      const x = butte.x + Math.cos(angle) * dist * 1.1;
      const z = butte.z + Math.sin(angle) * dist * 0.8;
      field.sample(x, z, sample);
      if (sample.height > 5.5) continue;

      // Blocks gather at the foot of cliffs and on the talus, a few stray onto the
      // flats; fragments stay close under the cliffs they fell from.
      const atFoot = smoothstep(0.3, 1.2, sample.envelope) * (1 - smoothstep(3.2, 5, sample.envelope));
      if (random() > (chip ? atFoot * atFoot : 0.1 + 0.85 * atFoot)) continue;
      field.normalAt(x, z, normal);
      if (normal.y < 0.7) continue; // too steep for a block to rest

      const big = !chip && atFoot > 0.5 && random() < 0.22;
      let size = 0.12 + 0.42 * random() ** 2.2;
      if (big) size = range(random, 0.6, 1.15);
      if (chip) size = 0.06 + 0.24 * random() ** 1.5;
      scale.set(size * range(random, 0.9, 1.3), size * range(random, 0.7, 1.0), size * range(random, 0.85, 1.2));

      // Mostly follow the slope, with some random lean, partly sunk into the ground.
      normal.lerp(up, 0.25).normalize();
      tilt.setFromUnitVectors(up, normal);
      spin.setFromAxisAngle(up, random() * Math.PI * 2);
      tilt.multiply(spin);
      position.set(x, sample.height - scale.y * BOULDER_SINK, z);
      matrix.compose(position, tilt, scale);
      mesh.setMatrixAt(placed, matrix);

      // Tint from a cliff-forming layer above, greyed and darkened a little.
      tint.copy(hardColors[Math.floor(random() * hardColors.length)]);
      tint.lerp(STRATA_COLORS[1], range(random, 0.1, 0.4)).multiplyScalar(range(random, 0.7, 0.95));
      mesh.setColorAt(placed, tint);
      placed++;
    }

    mesh.count = placed;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    geometries.push(geometry);
    meshes.push(mesh);
  }

  return {
    meshes,
    dispose() {
      for (const mesh of meshes) mesh.dispose();
      for (const geometry of geometries) geometry.dispose();
      material.dispose();
    },
  };
}

// --- scrub ------------------------------------------------------------------------------

/**
 * One desert shrub in unit space: tapered twigs fanning up and out from the
 * base, with sparse sage leaf tufts along them. Leaf normals lean away from the
 * shrub's centre so the crown shades as one soft volume; everything darkens
 * toward the ground contact.
 */
function createShrubGeometry(random) {
  const parts = [];
  const twigColor = new THREE.Color('#6a5a48'); // weathered grey-brown wood
  const leafColor = new THREE.Color('#7c7f5c'); // dusty sage
  const dryColor = new THREE.Color('#8c7a58');
  const color = new THREE.Color();
  const crown = new THREE.Vector3(0, 0.3, 0);
  const radial = new THREE.Vector3();
  const n = new THREE.Vector3();

  const paint = (geometry, base, leafy) => {
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const colors = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      if (leafy) {
        radial.fromBufferAttribute(position, i).sub(crown).normalize();
        n.fromBufferAttribute(normal, i).multiplyScalar(0.4).addScaledVector(radial, 0.6).normalize();
        normal.setXYZ(i, n.x, n.y, n.z);
      }
      const contact = 0.4 + 0.6 * smoothstep(0, 0.45, y);
      colors[i * 3] = base.r * contact;
      colors[i * 3 + 1] = base.g * contact;
      colors[i * 3 + 2] = base.b * contact;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.deleteAttribute('uv');
    parts.push(geometry);
  };

  const twigs = 11;
  for (let i = 0; i < twigs; i++) {
    const length = range(random, 0.55, 0.95);
    const lean = range(random, 0.3, 1.15);
    const bearing = ((i + range(random, -0.3, 0.3)) / twigs) * Math.PI * 2;
    const cylinder = new THREE.CylinderGeometry(0.016, 0.05, length, 4, 1, true);
    const twig = cylinder.toNonIndexed();
    cylinder.dispose();
    twig.translate(0, length / 2, 0);
    twig.rotateZ(lean);
    twig.rotateY(bearing);
    paint(twig, twigColor, false);

    // Small tufts short of the tip, so twig ends poke out of the crown.
    const tip = new THREE.Vector3(0, length, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), lean);
    tip.applyAxisAngle(new THREE.Vector3(0, 1, 0), bearing);
    const stops = [range(random, 0.8, 0.9), range(random, 0.55, 0.7)];
    if (random() < 0.5) stops.push(range(random, 0.35, 0.5));
    for (const along of stops) {
      const radius = range(random, 0.09, 0.16) * (0.6 + 0.5 * along);
      const tuft = new THREE.OctahedronGeometry(radius, 0);
      tuft.scale(1, range(random, 0.6, 0.9), 1);
      tuft.rotateY(random() * Math.PI);
      tuft.translate(tip.x * along, tip.y * along, tip.z * along);
      color.copy(leafColor).lerp(dryColor, random() * 0.6).multiplyScalar(range(random, 0.85, 1.1));
      paint(tuft, color, true);
    }
  }

  const geometry = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return geometry;
}

/** Sparse desert shrubs that give the flats scale, clumped in the moister swales. */
function buildScrub(field, random, envMap, cloudUniforms, cameraPosition) {
  const geometry = createShrubGeometry(random);
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
    envMap,
    envMapIntensity: ENV_INTENSITY,
  });
  material.onBeforeCompile = (shader) => addCloudShadows(shader, cloudUniforms);
  material.customProgramCacheKey = () => 'earth-scrub';
  const mesh = new THREE.InstancedMesh(geometry, material, SCRUB_COUNT);
  const sample = { height: 0, stratum: 0, land: 0, envelope: 0 };
  const normal = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const scale = new THREE.Vector3();
  const spot = new THREE.Vector3();
  const tint = new THREE.Color();
  const dryTint = new THREE.Color(1.05, 0.95, 0.8);
  let placed = 0;

  for (let attempt = 0; attempt < 8000 && placed < SCRUB_COUNT; attempt++) {
    const x = range(random, -45, 45);
    const z = range(random, -45, 30);
    field.sample(x, z, sample);
    if (sample.envelope > 0.4) continue; // keep off the landforms
    // Clumped: shrubs follow the moister swales.
    const clump = field.fbm(x * 0.08, 7.7, z * 0.08, 2, field.OFFSET.swell);
    if (random() > smoothstep(-0.1, 0.35, clump)) continue;
    field.normalAt(x, z, normal, 0.4);
    if (normal.y < 0.94) continue;

    spot.set(x, sample.height, z);
    let size = range(random, 0.1, 0.24) * (1 + random() ** 4);
    if (spot.distanceTo(cameraPosition) < SCRUB_NEAR) size = Math.min(size, 0.16); // no giants in the foreground
    scale.set(size * range(random, 0.9, 1.4), size * range(random, 0.7, 1.0), size * range(random, 0.9, 1.4));
    rotation.setFromAxisAngle(up, random() * Math.PI * 2);
    spot.y -= size * 0.05;
    matrix.compose(spot, rotation, scale);
    mesh.setMatrixAt(placed, matrix);
    // Lightness and dryness vary from shrub to shrub; the hue lives in the vertex colours.
    tint.setRGB(1, 1, 1).lerp(dryTint, random()).multiplyScalar(range(random, 0.7, 1));
    mesh.setColorAt(placed, tint);
    placed++;
  }
  mesh.count = placed;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();

  return {
    mesh,
    dispose() {
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

// --- sky --------------------------------------------------------------------------------

function buildSky(time) {
  const uniforms = {
    uTime: time,
    uSunDirection: { value: SUN_DIRECTION.clone() },
    uZenith: { value: SKY.zenith },
    uMid: { value: SKY.mid },
    uHorizon: { value: SKY.horizon },
    uSunGlow: { value: SKY.sunGlow },
    uCloudLit: { value: SKY.cloudLit },
    uCloudShade: { value: SKY.cloudShade },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vDirection = world.xyz - cameraPosition;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader:
      NOISE_GLSL +
      /* glsl */ `
      uniform float uTime;
      uniform vec3 uSunDirection;
      uniform vec3 uZenith;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uSunGlow;
      uniform vec3 uCloudLit;
      uniform vec3 uCloudShade;
      varying vec3 vDirection;

      void main() {
        vec3 dir = normalize(vDirection);
        float up = max(dir.y, 0.0);
        float sun = max(dot(dir, uSunDirection), 0.0);

        vec3 sky = mix(uHorizon, uMid, smoothstep(0.0, 0.2, up));
        sky = mix(sky, uZenith, smoothstep(0.15, 0.8, up));

        // Warm glow around the low sun, widest along the horizon.
        float horizonBand = 1.0 - smoothstep(0.0, 0.35, up);
        sky += uSunGlow * (pow(max(sun, 0.0), 5.0) * (0.2 + 0.6 * horizonBand) + 0.8 * pow(max(sun, 0.0), 64.0));

        // High streaks of cloud, lit gold toward the sun and mauve away from it.
        vec2 plane = dir.xz / (up + 0.12);
        float cloud = fbm(vec3(plane * vec2(0.28, 0.9) + vec2(uTime * 0.012, 0.0), 1.7 + uTime * 0.004));
        float cover = smoothstep(0.0, 0.5, cloud) * smoothstep(0.02, 0.12, up) * (1.0 - smoothstep(0.5, 0.95, up));
        vec3 cloudColor = mix(uCloudShade, uCloudLit, 0.25 + 0.75 * pow(max(sun * 0.5 + 0.5, 0.0), 6.0));
        sky = mix(sky, cloudColor, cover * 0.8);

        gl_FragColor = vec4(min(sky, vec3(24.0)), 1.0);
      }
    `,
  });
  const geometry = new THREE.SphereGeometry(450, 48, 24);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;

  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

// --- dust motes ------------------------------------------------------------------------

function buildDust(random, pixelRatio, time) {
  const positions = new Float32Array(DUST_COUNT * 3);
  const seeds = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    positions[i * 3] = DUST_BOX_MIN.x + random() * DUST_BOX_SIZE.x;
    positions[i * 3 + 1] = DUST_BOX_MIN.y + random() ** 1.6 * DUST_BOX_SIZE.y; // denser near the ground
    positions[i * 3 + 2] = DUST_BOX_MIN.z + random() * DUST_BOX_SIZE.z;
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const texture = createGlowTexture(64);
  const uniforms = {
    uTime: time,
    uMap: { value: texture },
    uColor: { value: new THREE.Color('#ffc98f').multiplyScalar(0.55) },
    uSize: { value: 0.14 * 800 * pixelRatio },
    uBoxMin: { value: DUST_BOX_MIN },
    uBoxSize: { value: DUST_BOX_SIZE },
    uSunDirection: { value: SUN_DIRECTION },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSize;
      uniform vec3 uBoxMin;
      uniform vec3 uBoxSize;
      uniform vec3 uSunDirection;
      attribute float aSeed;
      varying float vAlpha;

      void main() {
        // A slow breeze along the sun's path with a lazy vertical drift.
        vec3 p = position;
        p.x += uTime * (0.22 + 0.25 * aSeed);
        p.z -= uTime * 0.06;
        p.y += sin(uTime * (0.25 + 0.3 * aSeed) + aSeed * 40.0) * 0.35;
        p = uBoxMin + mod(p - uBoxMin, uBoxSize);

        // Fade at the box faces so wrapping is invisible.
        vec3 edge = min(p - uBoxMin, uBoxMin + uBoxSize - p) / (uBoxSize * 0.12);
        float fade = clamp(min(edge.x, min(edge.y, edge.z)), 0.0, 1.0);
        float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + aSeed) + aSeed * 90.0);
        float lowLying = 1.0 - smoothstep(2.0, 5.5, p.y); // dust hangs close to the ground
        // Forward scattering: motes glow brighter when the view looks toward the sun.
        float towardSun = max(dot(normalize(p - cameraPosition), uSunDirection), 0.0);
        float scatter = 1.0 + 2.5 * pow(towardSun, 4.0);
        vAlpha = clamp(fade * twinkle * lowLying * scatter, 0.0, 2.5);

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = uSize * (0.5 + aSeed) / max(-mvPosition.z, 0.5);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      varying float vAlpha;

      void main() {
        float alpha = texture(uMap, gl_PointCoord).a * vAlpha;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}

// --- blowing sand -------------------------------------------------------------------

/**
 * Low veils of sand lifted off the talus and carried downwind: a few ribbons
 * laid along the ground, filled with streaky noise that scrolls with the wind.
 * Each ribbon turns about its own wind-aligned axis to face the camera (leaning
 * back at most part way), so it never shows edge-on as a thin line.
 */
function buildStreamers(field, time) {
  const vertsPerStreamer = (STREAMER_SEGMENTS + 1) * 2;
  const positions = new Float32Array(STREAMERS.length * vertsPerStreamer * 3);
  const ribbon = new Float32Array(STREAMERS.length * vertsPerStreamer * 4); // along, side, seed, height
  const indices = [];
  const sample = { height: 0, stratum: 0, land: 0, envelope: 0 };
  let vertex = 0;

  for (const [s, streamer] of STREAMERS.entries()) {
    for (let k = 0; k <= STREAMER_SEGMENTS; k++) {
      const along = k / STREAMER_SEGMENTS;
      const x = streamer.x + WIND.x * streamer.length * along;
      const z = streamer.z + WIND.y * streamer.length * along;
      const ground = field.sample(x, z, sample).height;
      const height = streamer.height * Math.sqrt(Math.sin(Math.PI * along)); // thin at both ends
      for (let side = 0; side < 2; side++) {
        positions.set([x, ground - 0.05, z], vertex * 3);
        ribbon.set([along, side, s / STREAMERS.length, height + 0.05], vertex * 4);
        vertex++;
      }
      if (k < STREAMER_SEGMENTS) {
        const a = vertex - 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRibbon', new THREE.BufferAttribute(ribbon, 4));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius += 2; // the shader lifts the ribbons off their base line

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uColor: { value: new THREE.Color('#f2bb86') }, // sunlit sand, paler than the ground
      uWind: { value: new THREE.Vector3(WIND.x, 0, WIND.y) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform vec3 uWind;
      attribute vec4 aRibbon;
      varying vec3 vRibbon;
      varying vec3 vWorld;
      varying float vSideOn;

      void main() {
        vec3 base = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 toCamera = normalize(cameraPosition - base);
        vec3 across = cross(uWind, toCamera);
        float acrossLength = length(across);
        vec3 lift = acrossLength > 1e-3 ? across / acrossLength : vec3(0.0, 1.0, 0.0);
        lift *= lift.y < 0.0 ? -1.0 : 1.0;
        lift = normalize(mix(vec3(0.0, 1.0, 0.0), lift, 0.7));
        // Seen end-on, a ribbon bunches into a column: fade it out.
        vec2 view = normalize(toCamera.xz + vec2(1e-4));
        vSideOn = 1.0 - smoothstep(0.7, 0.92, abs(dot(view, uWind.xz)));

        vec3 world = base + lift * aRibbon.w * aRibbon.y;
        vWorld = world;
        vRibbon = aRibbon.xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }
    `,
    fragmentShader:
      NOISE_GLSL +
      /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec3 vRibbon;
      varying vec3 vWorld;
      varying float vSideOn;

      void main() {
        // Streaks stretched along the wind, scrolling downwind and slowly churning.
        float downwind = dot(vWorld.xz, vec2(${WIND.x.toFixed(4)}, ${WIND.y.toFixed(4)})) - uTime * ${STREAMER_SPEED.toFixed(2)};
        vec3 q = vec3(downwind * 0.18, vRibbon.y * 2.6 + vRibbon.z * 17.0, uTime * 0.12 + vRibbon.z * 5.0);
        float streak = 0.6 * snoise(q) + 0.4 * snoise(q * vec3(2.6, 1.8, 1.5) + 7.0);
        float density = smoothstep(-0.1, 0.7, streak);
        // Gusts travel down the ribbon, so stretches of it lift and settle.
        float gust = smoothstep(-0.35, 0.45, snoise(vec3(downwind * 0.07, vRibbon.z * 9.0, uTime * 0.05)));

        float ends = smoothstep(0.0, 0.25, vRibbon.x) * (1.0 - smoothstep(0.6, 1.0, vRibbon.x));
        // Faded in off the ground (no hard contact line), densest low, thinning upward.
        float low = smoothstep(0.03, 0.25, vRibbon.y) * (1.0 - smoothstep(0.3, 1.0, vRibbon.y));
        float alpha = density * gust * ends * low * vSideOn * 0.3;
        gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 1;

  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

// --- lights ------------------------------------------------------------------------------

function buildLights() {
  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
  sun.position.copy(SHADOW_CENTER).addScaledVector(SUN_DIRECTION, 60);
  sun.target.position.copy(SHADOW_CENTER);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 3;
  // Everything that casts a shadow is static: draw the shadow map once.
  sun.shadow.autoUpdate = false;
  sun.shadow.needsUpdate = true;
  const shadowCamera = sun.shadow.camera;
  shadowCamera.left = -SHADOW_HALF_EXTENT;
  shadowCamera.right = SHADOW_HALF_EXTENT;
  shadowCamera.top = SHADOW_HALF_EXTENT;
  shadowCamera.bottom = -SHADOW_HALF_EXTENT;
  shadowCamera.near = 20;
  shadowCamera.far = 100;
  shadowCamera.updateProjectionMatrix();

  const fill = new THREE.HemisphereLight(SKY_FILL, GROUND_BOUNCE, HEMI_INTENSITY);

  return {
    objects: [sun, sun.target, fill],
    dispose() {
      sun.dispose();
      fill.dispose();
    },
  };
}
