import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { footAt } from './flow.js';
import { createFunnelVolume } from './volume.js';
import { createSpecks } from './specks.js';
import { createPetals } from './petals.js';
import { createRibbons } from './ribbons.js';
import { Lightning } from './lightning.js';

// AIR - The Vortex.
//
// A tornado standing on the water film: a raymarched funnel hanging from a small, slowly
// turning storm cloud, a skirt of spray at its foot, and the things the wind carries (dust,
// droplets, petals, trails of vapour), all driven by the one flow model in flow.js. It writes
// ripples into the film around its foot and lights itself, and the scene, with its own lightning.

// Share of each particle population kept at quality 0 / 1 / 2.
const DETAIL = [0.5, 0.75, 1.0];

// Three points circle the foot and press on the film as they go. They travel at about the
// speed of the film's waves, so their wakes pile up into spiral arms.
const WAKES = [
  { radius: 0.55, speed: 3.1, phase: 0.0, size: 0.26, strength: 0.0042 },
  { radius: 1.05, speed: 1.9, phase: 2.2, size: 0.34, strength: 0.0036 },
  { radius: 1.70, speed: 1.15, phase: 4.3, size: 0.42, strength: 0.0030 },
];

// Upright cylinders around the element's vertical, [radius, y0, y1] in metres, that hold all
// of what the wind carries, and the funnel that the thick of the swarm surrounds. They are
// what is tested against the view to skip whatever is out of sight. (The vapour has tighter
// bounds of its own, see volume.js.)
const SWARM_BOUNDS = [13.0, 0, 12.5];
const CORE_BOUNDS = [1.5, 0, 11.0];
const CULL_MARGIN = 0.4;      // m, for the frame by which the test can lag behind the camera

export default class AirElement {
  constructor(ctx) {
    this.ctx = ctx;
    this.group = new THREE.Group();
    this.focus = { center: new THREE.Vector3(0, 6.2, 0), radius: 7.6 };

    const { LAYERS } = ctx;
    // One uniform block for every material of the element: the shared ones by reference,
    // plus the element's place in the world and the lightning channel.
    this.uniforms = {
      ...shared,
      uOrigin: { value: ctx.origin.clone() },
      uBoltLo: { value: new THREE.Vector4(0, 4, 0, 0) },      // xyz lower end (axis-relative), w intensity
      uBoltHi: { value: new THREE.Vector3(0, 11, 0) },        // upper end
    };

    this.volume = createFunnelVolume(this.uniforms, ctx.rng(5113));
    this.volume.layers.set(LAYERS.VOLUME);
    this.volume.renderOrder = 0;

    this.ribbons = createRibbons(ctx, this.uniforms, 54);
    this.ribbons.layers.set(LAYERS.FX);
    this.ribbons.renderOrder = 1;

    this.specks = createSpecks(ctx, this.uniforms, { specks: 26000, spray: 7000 });
    this.specks.layers.set(LAYERS.FX);
    this.specks.renderOrder = 2;

    this.petals = createPetals(ctx, this.uniforms, 800);
    this.petals.layers.set(LAYERS.FX);
    this.petals.renderOrder = 3;

    this.lightning = new Lightning(ctx, this.uniforms);
    this.lightning.mesh.layers.set(LAYERS.FX);
    this.lightning.mesh.renderOrder = 4;

    // Nothing to look at: a single degenerate triangle among the solid geometry, there for its
    // onBeforeRender. In the frame's own view that is called when the camera is where the
    // frame is drawn from, and before the pipeline lists what the later stages have to draw.
    const watchGeometry = new THREE.BufferGeometry();
    watchGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    this.watch = new THREE.Mesh(watchGeometry, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false }));
    this.watch.frustumCulled = false;
    this.watch.onBeforeRender = (renderer, scene, camera) => { if (camera === ctx.camera) this._watch(); };

    this.group.add(this.volume, this.ribbons, this.specks, this.petals, this.lightning.mesh, this.lightning.light, this.watch);

    this._foot = new THREE.Vector2();
    this._frustum = new THREE.Frustum();
    this._matrix = new THREE.Matrix4();
    this._coreSeen = true;
    this._swarm = 1;                    // share of the specks drawn on account of what is in view, eased
    this._time = 0;                     // time of the last update()
    this._drawnTime = -1;               // and what it was when the last frame was drawn
    this._drawnAt = 0;                  // the clock on the wall at that frame, ms
    this.setQuality(ctx.quality ?? 2);
  }

  update(dt, t) {
    this._time = t;
    this.lightning.update(t);
    this.volume.userData.update(t);
    // (with the camera of the frame before: this is what the reflection pass goes by, see _cull)
    this._cull();
    this._thin(dt);

    // ---- the film: spiral wakes around the foot, and a swell where the core lifts the water ----
    const ripples = this.ctx.ripples;
    const origin = this.uniforms.uOrigin.value;
    const foot = footAt(t, this._foot);
    const x = origin.x + foot.x, z = origin.z + foot.y;
    const perFrame = Math.min(dt * 60, 3);              // drops add up, so scale them with the step
    for (let i = 0; i < WAKES.length; i++) {
      const w = WAKES[i];
      const a = t * w.speed + w.phase;                  // counter-clockwise seen from above, like the wind
      ripples.drop(x + Math.cos(a) * w.radius, z - Math.sin(a) * w.radius, w.size, w.strength * perFrame);
    }
    ripples.drop(x, z, 0.5, -0.003 * perFrame);
    if (this.lightning.touchdown) {
      this.lightning.touchdown = false;
      ripples.drop(x, z, 0.7, 0.05);
    }
  }

  // True when an upright cylinder (centre x, z, radius, from y0 to y1), or its reflection in the
  // film, may be in view.
  _sees(x, z, radius, y0, y1) {
    const planes = this._frustum.planes;
    const r = radius + CULL_MARGIN;
    y0 -= CULL_MARGIN; y1 += CULL_MARGIN;
    let direct = true, mirrored = true;
    for (let i = 0; i < 6; i++) {
      const n = planes[i].normal;
      // the point of the cylinder that reaches furthest into the half-space of this plane
      const reach = n.x * x + n.z * z + planes[i].constant + r * Math.hypot(n.x, n.z);
      if (reach + Math.max(n.y * y0, n.y * y1) < 0) direct = false;
      if (reach + Math.max(-n.y * y0, -n.y * y1) < 0) mirrored = false;
    }
    return direct || mirrored;
  }

  // Called as the frame's own view is about to be drawn, with the camera where the frame is
  // seen from. While time stands still nobody calls update(), but the camera can still be
  // moved: the specks are then counted here, and eased by the clock on the wall.
  _watch() {
    this._cull();
    const now = performance.now();
    const still = this._time === this._drawnTime;
    this._thin(still ? Math.min(Math.max(now - this._drawnAt, 0) / 1000, 0.1) : 0);
    this._drawnTime = this._time;
    this._drawnAt = now;
  }

  // Hides what is out of sight: the volume (whose stage costs a pass over the whole frame even
  // when not one of its pixels is on screen) and what the wind carries (whose vertices are
  // worked out whether or not they land in the picture). Called twice a frame: from update(),
  // for the reflection pass, with the camera as it was a frame ago, and again as the frame's
  // own view is drawn (_watch), with the camera as it is.
  _cull() {
    const camera = this.ctx.camera;
    const o = this.uniforms.uOrigin.value;
    this._matrix.copy(camera.matrixWorld).invert().premultiply(camera.projectionMatrix);
    this._frustum.setFromProjectionMatrix(this._matrix);

    // The vapour: the upright cylinders that hold the funnel, slice by slice, and the cloud.
    const bounds = this.volume.userData.bounds;
    let vapour = false;
    for (let i = 0; i < bounds.length && !vapour; i++) {
      const c = bounds[i];
      vapour = this._sees(o.x + c[0], o.z + c[1], c[2], c[3], c[4]);
    }
    this.volume.visible = vapour;

    const swarm = this._sees(o.x, o.z, SWARM_BOUNDS[0], SWARM_BOUNDS[1], SWARM_BOUNDS[2]);
    this.specks.visible = swarm;
    this.petals.visible = swarm;
    this.ribbons.visible = swarm;
    this._coreSeen = this._sees(o.x, o.z, CORE_BOUNDS[0], CORE_BOUNDS[1], CORE_BOUNDS[2]);
  }

  // Draws fewer specks from far away, and fewer still while only the fringe of the swarm is in
  // view. The specks are stored in random order, so any leading share of them is an even
  // thinning of the whole; each one drawn is made to stand for the ones that are not (uBoost).
  _thin(dt) {
    const camera = this.ctx.camera.position, origin = this.uniforms.uOrigin.value;
    const far = Math.min(Math.max((Math.hypot(camera.x - origin.x, camera.z - origin.z) - 10) / 24, 0), 1);
    const distant = 1 - 0.72 * far * far * (3 - 2 * far);                        // 1 within 10 m .. 0.28 beyond 34 m
    this._swarm += ((this._coreSeen ? 1 : 0.3) - this._swarm) * (1 - Math.exp(-4 * dt));
    const specks = this.specks;
    specks.geometry.instanceCount = Math.floor(specks.userData.total * this._detail * distant * this._swarm);
    specks.material.uniforms.uBoost.value = Math.min(1 / (this._detail * distant), 4);
  }

  setQuality(level) {
    this._detail = DETAIL[Math.max(0, Math.min(2, level | 0))];
    this.petals.geometry.instanceCount = Math.floor(this.petals.userData.total * this._detail);
    this.ribbons.geometry.setDrawRange(0, Math.floor(this.ribbons.userData.total * this._detail) * this.ribbons.userData.indicesPerRibbon);
    this._thin(0);
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }
}
