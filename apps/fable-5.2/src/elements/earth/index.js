import * as THREE from 'three';
import { FieldBaker } from './bake.js';
import { buildMonolith } from './monolith.js';
import { buildGeode } from './crystals.js';
import { buildRockShapes } from './looseRocks.js';
import { Belt } from './belt.js';
import { buildRubble } from './rubble.js';
import { buildFlora } from './flora.js';
import { chooseStreams, SandStreams, Dust, FallingPebbles, particleUniforms, streamFlow } from './particles.js';
import { createRockMaterial, earthUniforms } from './rockMaterial.js';
import { FISSURE_OUT, GEODE_CENTRE } from './field.glsl.js';

// EARTH — The Monolith.
//
// A mass of stratified rock torn from the ground and hanging over the island of rubble it
// left behind. A fissure has split it and broken open a geode at its heart; fragments orbit
// it, sand pours from its underside, dust hangs in the air around it.
//
//   field.glsl.js     the rock as distance fields (strata, joints, fissure, geode) — shared by mesh and shader
//   bake.js           distance field -> triangle mesh, plus occlusion / visibility baked from the same field
//   monolith.js       the split mass, at three levels of detail
//   rockMaterial.js   the procedural rock shader (monolith and its stand-in, belt, rubble, gravel, sand)
//   crystals.js       the geode
//   looseRocks.js     block shapes instanced by the belt and the rubble, each set at two levels of detail
//   belt.js           the orbiting fragments
//   rubble.js         the island
//   flora.js          grass on top, roots underneath
//   particles.js      sand streams, dust, falling pebbles
//
// Who draws what. The element is small on screen except in its own close-up, and solid
// geometry is drawn up to three times a frame (shadow map, reflection, main view), so:
//   - the main view gets everything in full detail (LAYERS.MAIN_ONLY) only while the camera
//     is close, and about a quarter of the triangles from across the ring;
//   - the water film and the moon's shadow map get light stand-ins (LAYERS.MIRROR_ONLY) at
//     any distance: a coarse monolith, the largest crystals, the lighter shapes of the loose rocks.
// What the main view draws from afar is always part of what it draws close to, never
// something else: the monolith and the loose rocks change to meshes decimated from their
// own detailed ones (at different distances, so that no frame changes both), and everything
// drawn in numbers (crystals, grass, pebbles, sand) thins out a few instances at a time as
// the camera backs away. _chooseDetail() sees to it, once a frame, from where that frame is
// seen. No fragment shader discards, so the GPU's hidden-surface removal keeps working on
// everything opaque.

const PIVOT_HEIGHT = 3.95;      // height of the geode's heart above the water film (rock space origin)
const ROCK_YAW = 0.31;          // the rock's heading: turns the mouth of the geode toward the close-up camera
const UP = new THREE.Vector3(0, 1, 0);
// Level of detail, by the camera's distance in metres from the heart of the rock.
const MONOLITH_FAR = 18;        // beyond it the monolith is drawn from its lighter mesh …
const ROCKS_FAR = 22;           // … and beyond this the belt and the rubble from their lighter shapes
const SWAP_MARGIN = 1;          // either side of those two, so that a camera hovering at one does not flicker
const THIN_FROM = 16.5;         // instance counts fall away evenly from here …
const THIN_TO = 23.5;           // … to here, where what is left is:
const FAR_POINTS = 320;         // this many of the geode's larger crystals, longest first
const FAR_DRUSE = 0.35;         // this share of its carpet of small ones (the wall glows in place of the rest)
const FAR_GRASS = 0.5;          // of the blades of grass
const FAR_SAND = 0.5;           // of the grains in the streams (each drawn more opaque)
const FAR_PEBBLES = 0.6;        // and of the island's pebbles, largest first

// What each quality level draws, as fractions of the full set.
const QUALITY = [
  { druse: 0.45, sand: 0.5, motes: 0.4, grass: 0.5, pebbles: 0.5 },
  { druse: 0.75, sand: 0.8, motes: 0.75, grass: 0.8, pebbles: 0.8 },
  { druse: 1, sand: 1, motes: 1, grass: 1, pebbles: 1 },
];

export default class EarthElement {
  constructor(ctx) {
    this.ctx = ctx;
    const { LAYERS } = ctx;
    this.group = new THREE.Group();
    this.focus = { center: new THREE.Vector3(0, 3.3, 0), radius: 4.5 };

    // The monolith and everything fixed to it turn and bob as one body.
    this.rock = new THREE.Group();
    this.rock.position.set(0, PIVOT_HEIGHT, 0);
    this.group.add(this.rock);

    // Rock space is turned by ROCK_YAW against the element: fixed directions go into the bake in rock space …
    const baker = new FieldBaker(ctx.renderer);
    const fire = ctx.layout.find((e) => e.id === 'fire');
    const fireDir = new THREE.Vector3(fire.position[0], 2.2, fire.position[2]).sub(ctx.origin).sub(this.rock.position).normalize().applyAxisAngle(UP, -ROCK_YAW);
    const glowDir = ctx.lights.glow.position.clone().normalize().applyAxisAngle(UP, -ROCK_YAW);
    // … and what the island needs to know about the rock comes back out in the element's frame.
    const mouth = new THREE.Vector3(...FISSURE_OUT).applyAxisAngle(UP, ROCK_YAW);
    const heart = new THREE.Vector3(...GEODE_CENTRE).applyAxisAngle(UP, ROCK_YAW).add(this.rock.position);
    // The geode's light: the heart, a smaller cluster above and below it in the fissure, and
    // the glow that spills out of the mouth onto the face around it (four analytic point
    // lights in the earth shaders, shadowed by baked visibility). Rock space.
    this._heartLocal = new THREE.Vector3(...GEODE_CENTRE);
    this._mouthLocal = new THREE.Vector3(...FISSURE_OUT);
    this._lightLocal = [
      new THREE.Vector3(...GEODE_CENTRE).addScaledVector(this._mouthLocal, 0.1),
      new THREE.Vector3(...GEODE_CENTRE).addScaledVector(this._mouthLocal, 0.25).add(new THREE.Vector3(0, 0.95, 0)),
      new THREE.Vector3(...GEODE_CENTRE).addScaledVector(this._mouthLocal, 0.2).add(new THREE.Vector3(0, -0.8, 0)),
      new THREE.Vector3(...GEODE_CENTRE).addScaledVector(this._mouthLocal, 1.6).add(new THREE.Vector3(0, 0.1, 0)),
    ];
    this.monolith = buildMonolith(baker, { glowDir, fireDir, spill: this._lightLocal[3] });
    const { mesh, far, proxy } = this.monolith;
    mesh.material = far.material = createRockMaterial('monolith');
    proxy.material = createRockMaterial('proxy');
    mesh.layers.set(LAYERS.MAIN_ONLY);
    far.layers.set(LAYERS.MAIN_ONLY);
    far.visible = false;                                        // (until _chooseDetail() says otherwise)
    proxy.layers.set(LAYERS.MIRROR_ONLY);
    this.geode = buildGeode(ctx, this.monolith);
    this.geode.points.layers.set(LAYERS.MAIN_ONLY);
    this.geode.druse.layers.set(LAYERS.MAIN_ONLY);
    this.geode.reflected.layers.set(LAYERS.MIRROR_ONLY);
    this.flora = buildFlora(ctx, this.monolith);
    ctx.setLayer(this.flora.group, LAYERS.MAIN_ONLY);           // too fine to show in the reflection
    this.rock.add(mesh, far, proxy, this.geode.points, this.geode.druse, this.geode.reflected, this.flora.group);

    const shapes = buildRockShapes(baker);
    baker.dispose();
    const beltMaterial = createRockMaterial('belt');
    this.belt = new Belt(ctx, shapes, beltMaterial, PIVOT_HEIGHT - 0.2);
    this.group.add(this.belt.group);

    this.streams = chooseStreams(this.monolith, ctx.rng(77), ROCK_YAW);
    this.rubble = buildRubble(ctx, shapes, {
      rubble: createRockMaterial('rubble'), gravel: createRockMaterial('gravel'), sand: createRockMaterial('sand'),
    }, this.geode, this.streams.map((s) => s.landing), heart, mouth);
    this.group.add(this.rubble.group);

    this.sand = new SandStreams(ctx, this.streams);
    this.dust = new Dust(ctx, this.streams, heart, mouth);
    this.pebbles = new FallingPebbles(ctx, this.monolith, shapes.low[0], beltMaterial, this.rock);
    this.group.add(this.sand.mesh, this.dust.points, this.pebbles.mesh);

    earthUniforms.uEarthOrigin.value.copy(ctx.origin);
    earthUniforms.uEarthLightColor.value[0].set(0.66, 0.22, 1.0).multiplyScalar(2.2);
    earthUniforms.uEarthLightColor.value[1].set(0.74, 0.28, 0.95).multiplyScalar(0.7);
    earthUniforms.uEarthLightColor.value[2].set(0.60, 0.20, 1.0).multiplyScalar(0.8);
    earthUniforms.uEarthLightColor.value[3].set(0.66, 0.24, 1.0).multiplyScalar(0.5);

    this._rng = ctx.rng(4711);
    this._nextStreamRipple = 0;
    this._nextShoreRipple = 2;

    // Level of detail is chosen while a frame is being drawn, not in update(): by then the
    // camera is where that frame is seen from (update() runs before the camera moves, and not
    // at all while time is paused, though the camera still flies). The island's bed tells us
    // when: with culling off, one of its two meshes is drawn in the reflection (the first pass
    // of every frame) and the other in the main view. Whichever comes first settles the frame;
    // in the reflection that is before the main view's draw list is made, so the choice shows
    // in that very frame.
    this._centre = new THREE.Vector3(ctx.origin.x, PIVOT_HEIGHT, ctx.origin.z);
    this._monolithFar = false;
    this._rocksFar = false;
    this._thin = 0;                // 0 within THIN_FROM of the camera … 1 beyond THIN_TO
    for (const bed of this.rubble.beds) {
      bed.frustumCulled = false;
      bed.onBeforeRender = () => this._chooseDetail(ctx.camera.position);
    }

    this.setQuality(ctx.quality ?? 2);
    this.update(0, 0);
  }

  /** Fits what the main view draws to the distance of the eye (see the constructor for when this runs). */
  _chooseDetail(eye) {
    const distance = eye.distanceTo(this._centre);
    if (this._monolithFar ? distance < MONOLITH_FAR - SWAP_MARGIN : distance > MONOLITH_FAR + SWAP_MARGIN) {
      this._monolithFar = !this._monolithFar;
      this.monolith.mesh.visible = !this._monolithFar;
      this.monolith.far.visible = this._monolithFar;
    }
    if (this._rocksFar ? distance < ROCKS_FAR - SWAP_MARGIN : distance > ROCKS_FAR + SWAP_MARGIN) {
      this._rocksFar = !this._rocksFar;
      this.belt.setFar(this._rocksFar);
      this.rubble.setFar(this._rocksFar);
    }
    const thin = Math.min(1, Math.max(0, (distance - THIN_FROM) / (THIN_TO - THIN_FROM)));
    if (thin !== this._thin) {
      this._thin = thin;
      this._applyDetail();
    }
  }

  /** Instance counts: what the quality level allows, less what the distance makes pointless. */
  _applyDetail() {
    const q = this._quality, thin = this._thin;
    const left = (far) => 1 - thin * (1 - far);                 // 1 close to … `far` from across the ring
    const { druse, points } = this.geode;
    // From across the ring the thumb-sized crystals are specks: a third of them is drawn and
    // the wall of the hollow glows in place of the rest.
    const carpet = q.druse * left(FAR_DRUSE);
    druse.count = Math.floor(druse.userData.full * carpet);
    earthUniforms.uEarthDruse.value = carpet;
    points.count = Math.round(points.userData.full * left(Math.min(1, FAR_POINTS / points.userData.full)));
    const grass = this.flora.grass;
    if (grass) grass.geometry.instanceCount = Math.floor(grass.userData.full * q.grass * left(FAR_GRASS));
    this.sand.setDensity(q.sand * left(FAR_SAND));
    this.rubble.setPebbleDensity(q.pebbles, left(FAR_PEBBLES));
  }

  update(dt, t) {
    // Thousands of tonnes: a few centimetres of bob over many seconds, a degree or two of turn.
    const rock = this.rock;
    const bob = 0.035 * Math.sin(t * 0.37) + 0.018 * Math.sin(t * 0.83 + 1.3);
    rock.position.y = PIVOT_HEIGHT + bob;
    rock.rotation.y = ROCK_YAW + 0.035 * Math.sin(t * 0.11 + 0.6);
    rock.rotation.x = 0.006 * Math.sin(t * 0.23);
    rock.rotation.z = 0.006 * Math.sin(t * 0.19 + 2.0);
    rock.updateMatrixWorld();

    // World-space anchors for the shaders.
    earthUniforms.uEarthHeart.value.copy(this._heartLocal).applyMatrix4(rock.matrixWorld);
    earthUniforms.uEarthMouth.value.copy(this._mouthLocal).transformDirection(rock.matrixWorld);
    for (let i = 0; i < 4; i++) earthUniforms.uEarthLightPos.value[i].copy(this._lightLocal[i]).applyMatrix4(rock.matrixWorld);
    particleUniforms.uRockMatrix.value.copy(rock.matrixWorld);

    this.belt.update(t, bob);
    this.pebbles.update(t);

    const origin = this.ctx.origin;
    // A stream that misses the island keeps the film trembling where it lands.
    if (t >= this._nextStreamRipple) {
      this._nextStreamRipple = t + 0.11;
      for (let i = 0; i < this.streams.length; i++) {
        const s = this.streams[i];
        if (s.landing.radius > 0) continue;
        const flow = streamFlow(s.seed, t - 0.6);
        if (flow > 0.15) {
          this.ctx.ripples.drop(origin.x + s.landing.x + Math.sin(t * 31.7 + s.seed * 9) * 0.03, origin.z + s.landing.z + Math.cos(t * 27.3) * 0.03, 0.16, 0.012 * flow);
        }
      }
    }
    // Grains trickle off the heap into the water all round its shore, and now and then a
    // handful slumps in: slow rings leave the island one at a time. (The film's grid is some
    // nine centimetres to the cell: a ring has to start a few cells wide to travel at all.)
    if (t >= this._nextShoreRipple) {
      const rng = this._rng;
      this._nextShoreRipple = t + 0.5 + 1.6 * rng();
      const a = rng() * Math.PI * 2, r = 1.9 + 0.9 * rng();
      this.ctx.ripples.drop(origin.x + Math.cos(a) * r, origin.z + Math.sin(a) * r, 0.26 + 0.16 * rng(), 0.012 + 0.008 * rng());
    }
  }

  setQuality(level) {
    const q = QUALITY[Math.max(0, Math.min(2, level))];
    this._quality = q;
    this.dust.setDensity(q.motes);
    this._applyDetail();
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }
}
