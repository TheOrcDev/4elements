import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { LAYERS } from '../../core/layers.js';
import { RADIUS, LEVEL, MAX_SWELL, waveHeight } from './waves.js';
import { WaveField } from './wavefield.js';
import { WATER_VERT, WATER_FRAG, RUNNEL_COUNT } from './waterShader.js';
import { createSpray, Drips } from './spray.js';
import { createMist } from './mist.js';
import { createReflection } from './reflection.js';
import { Shoal } from './fish.js';

// WATER - The Deep. A core of open sea standing on the film: bare water for a wall, a
// living sea for a lid. See waterShader.js for the optics and wavefield.js for the sea state.

const RIM_SLOTS = 32;           // places round the rim where the CPU watches the sea
const SPILL_HEIGHT = 0.17;      // m above mean level at which a rising crest slops over the lip
const SLAP_HEIGHT = 0.14;       // ... and at which its weight against the wall is felt by the film at its foot
const SPRAY_COUNT = [4000, 7000, 10000];
const FAR = 20;                 // m from the camera beyond which a pixel of the column is over a centimetre: the sea is then
                                // simulated at half rate and the body is blended over the frame instead of refracting it

export default class WaterElement {
  constructor(ctx) {
    this.ctx = ctx;
    this.group = new THREE.Group();
    this.focus = { center: new THREE.Vector3(0, 2.1, 0), radius: 4.4 };
    this.random = ctx.rng(90210);

    this.waves = new WaveField(ctx.renderer);
    this.shoal = new Shoal(ctx.rng(1618));

    // ---- the body: a proxy cylinder whose fragment shader ray-traces the whole column ----
    // The middle of the ring the elements stand on, seen from here: the shader uses it to
    // judge how far away the things seen through the water are likely to be.
    const hub = new THREE.Vector2();
    for (const e of ctx.layout) hub.add(new THREE.Vector2(e.position[0], e.position[2]));
    hub.divideScalar(Math.max(ctx.layout.length, 1)).sub(new THREE.Vector2(ctx.origin.x, ctx.origin.z));
    this.uniforms = {
      ...shared,
      ...this.waves.uniforms,
      uOrigin: { value: ctx.origin.clone() },
      uHub: { value: hub },
      uBlend: { value: 0 },
      uRunnels: { value: Array.from({ length: RUNNEL_COUNT }, () => new THREE.Vector4(0, -1000, 1, 0)) },
      uRunnelsLive: { value: 0 },
      uFish: { value: this.shoal.positions },
      uFishDir: { value: this.shoal.headings },
      uShoal: { value: this.shoal.bounds },
    };
    // A little wider than the water so the analytic silhouette has room to fade inside the mesh.
    const top = LEVEL + MAX_SWELL + 0.05;
    const proxy = new THREE.CylinderGeometry(RADIUS * 1.03, RADIUS * 1.03, top, 48, 1, false);
    proxy.translate(0, top / 2, 0);
    // The shader hands its colour over premultiplied, with the coverage of the silhouette
    // (and, from far off, the see-through of the water) in alpha; it writes its own depth.
    this.body = new THREE.Mesh(proxy, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: WATER_VERT,
      fragmentShader: WATER_FRAG,
      transparent: true,
      depthWrite: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    }));
    this.body.layers.set(LAYERS.REFRACT);
    this.group.add(this.body);
    // Its image in the film is a mesh of its own (the body folds itself away in that pass).
    this.group.add(createReflection({ ...this.waves.uniforms, uOrigin: this.uniforms.uOrigin }));

    // An element with something on the REFRACT layer costs the pipeline a copy of the whole
    // frame, whether or not any of it is in the picture: more than the column itself costs
    // from across the scene. So the body is only there while the camera can see the column,
    // and from beyond FAR it moves to the FX layer, where no copy is made, and lets the frame
    // through by blending instead of reading it (uBlend, see the end of the shader). The
    // pipeline draws the opaque stage before it sorts objects into the later ones, so a
    // probe in that stage (one triangle of no size, main view only) settles both for the
    // frame in hand, with the camera that frame is drawn with.
    this.bounds = new THREE.Sphere(new THREE.Vector3(ctx.origin.x, top / 2, ctx.origin.z), Math.hypot(RADIUS * 1.03, top / 2));
    this.frustum = new THREE.Frustum();
    this.viewProjection = new THREE.Matrix4();
    this.blended = false;
    const nothing = new THREE.BufferGeometry();
    nothing.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    const probe = new THREE.Mesh(nothing, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false }));
    probe.frustumCulled = false;
    probe.layers.set(LAYERS.MAIN_ONLY);
    probe.onBeforeRender = (renderer, scene, camera) => {
      this.viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.viewProjection);
      this.body.visible = this.frustum.intersectsSphere(this.bounds);
      // (A metre of slack either way, so a camera that hovers at the limit does not flicker.)
      const away = Math.hypot(camera.position.x - this.bounds.center.x, camera.position.z - this.bounds.center.z);
      if (away > FAR + 0.5) this.blended = true; else if (away < FAR - 0.5) this.blended = false;
      this.uniforms.uBlend.value = this.blended ? 1 : 0;
      this.body.layers.set(this.blended ? LAYERS.FX : LAYERS.REFRACT);
    };
    this.group.add(probe);
    // The column together with its image in the film: while that is out of the picture the
    // sea need not be simulated. (Tested in update(), before the camera's move for the
    // frame: hence the margin.)
    this.reach = new THREE.Sphere(new THREE.Vector3(ctx.origin.x, 0, ctx.origin.z), Math.hypot(RADIUS * 1.03, top) + 1.5);

    // ---- water that leaves the column ----
    this.spray = createSpray(ctx, SPRAY_COUNT[2]);
    this.group.add(this.spray);
    this.drips = new Drips(40);
    this.group.add(this.drips.mesh);
    this.group.add(createMist(ctx.origin));
    this._onLand = (x, z, radius) => {
      ctx.ripples.drop(ctx.origin.x + x, ctx.origin.z + z, 0.14 + radius * 18, 0.012 + radius * 2.4);
    };

    // The sea at the rim, as the CPU sees it: where a crest climbs over the lip, a runnel
    // starts down the wall and a few heavy drops are thrown clear.
    this.rimCos = new Float32Array(RIM_SLOTS);
    this.rimSin = new Float32Array(RIM_SLOTS);
    this.rimHeight = new Float32Array(RIM_SLOTS);
    this.rimRest = new Float32Array(RIM_SLOTS);         // seconds before a slot may spill again
    for (let i = 0; i < RIM_SLOTS; i++) {
      const a = (i / RIM_SLOTS) * Math.PI * 2;
      this.rimCos[i] = Math.cos(a);
      this.rimSin[i] = Math.sin(a);
      this.rimHeight[i] = waveHeight(this.rimCos[i] * RADIUS, this.rimSin[i] * RADIUS, 0);
      this.rimRest[i] = this.random() * 1.5;
    }
    this.runnelLanded = new Uint8Array(RUNNEL_COUNT);
    this.runnelDrained = new Float32Array(RUNNEL_COUNT);    // time at which each runnel slot is free again
    this.rippleClock = 0;

    this.setQuality(ctx.quality);
  }

  update(dt, t) {
    const camera = this.ctx.camera;
    this.viewProjection.compose(camera.position, camera.quaternion, camera.scale).invert().premultiply(camera.projectionMatrix);
    this.frustum.setFromProjectionMatrix(this.viewProjection);
    const away = Math.hypot(camera.position.x - this.reach.center.x, camera.position.z - this.reach.center.z);
    this.waves.update(dt, t, away > FAR, !this.frustum.intersectsSphere(this.reach));
    this.shoal.update(t);
    this._watchRim(dt, t);
    this._feedFilm(dt, t);
    this.drips.update(t, this._onLand);
  }

  _watchRim(dt, t) {
    const random = this.random;
    const { ripples, origin } = this.ctx;
    for (let i = 0; i < RIM_SLOTS; i++) {
      const cx = this.rimCos[i], cz = this.rimSin[i];
      const h = waveHeight(cx * RADIUS, cz * RADIUS, t);
      const before = this.rimHeight[i];
      const rise = (h - before) / Math.max(dt, 1e-3);
      this.rimHeight[i] = h;
      this.rimRest[i] -= dt;
      // A crest running up the wall leans on the film at its foot: one broad ring leaves the
      // column there. Slot after slot as the crest sweeps round, they join into an arc that
      // travels out over the film in time with the swell.
      if (before < SLAP_HEIGHT && h >= SLAP_HEIGHT) {
        ripples.drop(origin.x + cx * (RADIUS + 0.2), origin.z + cz * (RADIUS + 0.2), 0.5, 0.02);
      }
      if (h < SPILL_HEIGHT || rise < 0.15 || this.rimRest[i] > 0) continue;
      this.rimRest[i] = 0.8 + random() * 1.8;

      const angle = Math.atan2(cz, cx) + (random() - 0.5) * (Math.PI * 2 / RIM_SLOTS);
      const ax = Math.cos(angle), az = Math.sin(angle);
      // A runnel, if one of the slots has drained.
      const runnels = this.uniforms.uRunnels.value;
      for (let k = 0; k < RUNNEL_COUNT; k++) {
        if (t < this.runnelDrained[k]) continue;
        const speed = 0.75 + random() * 0.8;
        runnels[k].set(angle, t, speed, LEVEL + h);
        // Same timing as runnels() in the shader: the trail starts to drain a few seconds
        // after the spill and is gone once its top has slid the whole height of the wall.
        const seed = angle * 37.13 - Math.floor(angle * 37.13);
        this.runnelDrained[k] = Math.min(t + 2.0 + 2.5 * seed + (LEVEL + h) / (0.9 * speed), t + 12);
        this.runnelLanded[k] = 0;
        break;
      }
      // Heavy drops thrown clear of the wall, harder when the crest came up fast.
      const throwing = Math.min(rise, 2.2);
      const drops = 1 + Math.floor(random() * 2.4);
      for (let k = 0; k < drops; k++) {
        const out = 0.2 + random() * 0.5 * (0.6 + throwing);
        const up = 0.15 + random() * 0.9 * throwing;
        const side = (random() - 0.5) * 0.9;
        this.drips.spawn(
          t, ax * (RADIUS + 0.03), LEVEL + h, az * (RADIUS + 0.03),
          ax * out - az * side, up, az * out + ax * side, 0.004 + random() * 0.005,
        );
      }
    }
  }

  // Everything that keeps the film around the foot of the column moving.
  _feedFilm(dt, t) {
    const { ripples, origin } = this.ctx;
    const random = this.random;

    // Runnels reaching the film: a ring when the bead arrives, then a trickle while the trail drains.
    const runnels = this.uniforms.uRunnels.value;
    let live = 0;
    for (let k = 0; k < RUNNEL_COUNT; k++) {
      if (t < this.runnelDrained[k]) live = k + 1;
      const r = runnels[k];
      const age = t - r.y;
      if (age < 0 || age > 12) continue;
      // Same motion as runnels() in the shader.
      const head = r.w - r.z * age * (0.55 + 0.45 * Math.min(age, 1));
      if (head > 0) continue;
      const seed = r.x * 37.13 - Math.floor(r.x * 37.13);
      const tail = r.w - r.z * 0.9 * Math.max(age - 2.0 - 2.5 * seed, 0);
      const x = origin.x + Math.cos(r.x) * (RADIUS + 0.03);
      const z = origin.z + Math.sin(r.x) * (RADIUS + 0.03);
      if (!this.runnelLanded[k]) {
        this.runnelLanded[k] = 1;
        ripples.drop(x, z, 0.2, 0.014);
      } else if (tail > 0 && random() < dt * 5) {
        ripples.drop(x, z, 0.14, 0.004);
      }
    }
    this.uniforms.uRunnelsLive.value = live;      // the shader only walks the slots that hold something

    // The column itself: the swell heaving against the wall sends faint ripples out all round.
    this.rippleClock -= dt;
    if (this.rippleClock <= 0) {
      this.rippleClock = 0.07 + random() * 0.09;
      const i = Math.floor(random() * RIM_SLOTS) % RIM_SLOTS;
      const reach = RADIUS + 0.1 + random() * 0.1;
      const push = 0.008 + 0.035 * Math.max(this.rimHeight[i], 0);
      ripples.drop(origin.x + this.rimCos[i] * reach, origin.z + this.rimSin[i] * reach, 0.28 + random() * 0.25, push);
    }
  }

  setQuality(level) {
    this.spray.geometry.setDrawRange(0, SPRAY_COUNT[Math.max(0, Math.min(2, level | 0))]);
  }

  dispose() {
    this.waves.dispose();
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }
}
