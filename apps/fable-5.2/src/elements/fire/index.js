import * as THREE from 'three';
import { createFireUniforms } from './common.js';
import { noise1 } from './noise.js';
import { createVessel } from './vessel.js';
import { createFuel } from './fuel.js';
import { createFlame, createGlow } from './flame.js';
import { Embers } from './embers.js';
import { createHaze, HAZE_BOUNDS } from './haze.js';

// FIRE - The Pyre.
// A great fire in a soot-black iron bowl on three basalt blocks standing in the water.
//
// One set of control signals, all pure functions of time, drives everything so that the
// parts stay in step: the burn level (height and width of the flame, strength of the
// light), a fast flicker (flame brightness and light together), the puff phase (the ring
// vortices that ride up the flame), the wind (lean of flame, smoke, sparks and haze) and
// the glow of the embers (fanned by gusts).

// Radiant intensity of the fire's light at full burn, linear RGB.
const LIGHT_R = 76, LIGHT_G = 27, LIGHT_B = 6.5;

// Level of detail by distance from the eye to the fire, metres. The solids come at three
// levels: level k is drawn once the eye is within DETAIL_IN[k] and kept until it is beyond
// DETAIL_OUT[k] again (the gap keeps a camera that hovers at a border from flipping between
// two levels every frame); further out, the last level.
const DETAIL_IN = [9.5, 21], DETAIL_OUT = [11, 23.5];
// The heat haze fades out between these two distances and is not drawn at all beyond.
const HAZE_FADE0 = 18, HAZE_FADE1 = 24;
// The share of the coal lumps that is drawn falls from all of them to a third between these.
const LUMPS_ALL = 16, LUMPS_FEW = 40;

/** Gusts, 0..1: a slow irregular swell. The spark shader evaluates the same curve (fireGust). */
function gustAt(t) {
  const x = 0.5 + 0.5 * Math.sin(0.31 * t + 1.9 * Math.sin(0.083 * t + 0.6) + 0.7 * Math.sin(0.047 * t));
  return THREE.MathUtils.smoothstep(x, 0.58, 0.92);
}

export default class FireElement {
  constructor(ctx) {
    this.ctx = ctx;
    this.group = new THREE.Group();
    this.focus = { center: new THREE.Vector3(0, 2.6, 0), radius: 4.2 };

    this.uniforms = createFireUniforms(ctx.origin);

    this.vessel = createVessel(ctx, this.uniforms);
    this.group.add(this.vessel.group);
    this.fuel = createFuel(ctx, this.uniforms);
    this.group.add(this.fuel.group);
    this.flame = createFlame(ctx, this.uniforms, this.fuel.fuelField);
    this.group.add(this.flame);
    this.glow = createGlow(ctx, this.uniforms);
    this.group.add(this.glow);
    this.embers = new Embers(ctx, this.uniforms, this.fuel.pops);
    this.group.add(this.embers.mesh);
    this.haze = createHaze(ctx, this.uniforms);
    this.group.add(this.haze);

    // The fire's light on the rest of the world. Our own surfaces shade the flame as a
    // line light instead (see common.js), so this lamp only matters to the other elements.
    this.light = new THREE.PointLight(0xffffff, 0, 0, 2);
    this.light.position.set(0, 2.2, 0);
    this.group.add(this.light);

    // Level of detail is chosen while the main view's opaque stage is being drawn: by then
    // the camera is where this frame is seen from (update() runs before the camera moves),
    // and the pipeline has yet to gather what the later stages draw, so hiding the haze
    // here takes effect in this very frame. The floor decal is the mesh that tells us:
    // never culled, it is drawn in that stage, and only there, every frame.
    this.detail = 1;
    this._centre = new THREE.Vector3(0, 1.5, 0).add(ctx.origin);
    this._hazeBounds = new THREE.Sphere(new THREE.Vector3(HAZE_BOUNDS[0], HAZE_BOUNDS[1], HAZE_BOUNDS[2]).add(ctx.origin), HAZE_BOUNDS[3]);
    this._frustum = new THREE.Frustum();
    this._viewProjection = new THREE.Matrix4();
    const decal = this.vessel.floorShadow;
    decal.frustumCulled = false;
    decal.onBeforeRender = (renderer, scene, camera) => { if (camera === ctx.camera) this._chooseDetail(camera); };

    this.setQuality(ctx.quality ?? 2);
    this.update(0, 0, { focus: 0 });
  }

  /** Fits what is drawn to where the eye is (see the constructor for when this runs). */
  _chooseDetail(camera) {
    const distance = camera.position.distanceTo(this._centre);
    while (this.detail < DETAIL_OUT.length && distance > DETAIL_OUT[this.detail]) this.detail++;
    while (this.detail > 0 && distance < DETAIL_IN[this.detail - 1]) this.detail--;
    // (the solids are already in this stage's draw list: for them the choice counts from the next frame)
    this.vessel.setDetail(this.detail);
    this.fuel.setDetail(this.detail, 1 - 0.67 * THREE.MathUtils.smoothstep(distance, LUMPS_ALL, LUMPS_FEW));

    const fade = 1 - THREE.MathUtils.smoothstep(distance, HAZE_FADE0, HAZE_FADE1);
    this.haze.material.uniforms.uHazeFade.value = fade;
    let seen = fade > 0;
    if (seen) {
      this._viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      seen = this._frustum.setFromProjectionMatrix(this._viewProjection).intersectsSphere(this._hazeBounds);
    }
    this.haze.visible = seen;
  }

  setQuality(level) {
    this.embers.setQuality(level);
  }

  update(dt, t) {
    const u = this.uniforms;
    const lights = this.ctx.lights;
    if (lights) {
      const moon = lights.moon, glow = lights.glow;
      u.uMoonLight.value.set(moon.color.r, moon.color.g, moon.color.b).multiplyScalar(moon.intensity);
      u.uGlowLight.value.set(glow.color.r, glow.color.g, glow.color.b).multiplyScalar(glow.intensity);
      u.uGlowDir.value.copy(glow.position).normalize();
    }

    // ---- signals ----
    // Gusts: now and then the wind picks up; the fire leans, flares and its embers brighten.
    const gust = gustAt(t);
    const burn = 0.84 + 0.20 * noise1(t * 0.19) + 0.12 * noise1(t * 0.53 + 17.3) + 0.18 * gust;
    const flicker = 1.0 + 0.16 * (noise1(t * 7.3) - 0.5) + 0.10 * (noise1(t * 17.1 + 3.0) - 0.5);
    const puffPhase = 0.92 * t + 0.35 * noise1(t * 0.21 + 9.0);
    const windAngle = -0.32 + 1.1 * (noise1(t * 0.07 + 3.0) - 0.5);
    const windSpeed = 0.30 + 0.70 * noise1(t * 0.13 + 11.0) + 0.55 * gust;
    const emberGlow = 0.80 + 0.30 * noise1(t * 0.31 + 5.0) + 0.40 * gust;

    u.uFireState.value.set(burn, flicker, puffPhase, emberGlow);
    u.uFireWind.value.set(Math.cos(windAngle) * windSpeed, Math.sin(windAngle) * windSpeed);

    this.embers.update(dt, t, gust, u.uFireWind.value);

    // ---- light ----
    // A new puff leaving the bed is a fresh sheet of flame, and a cracking log throws a
    // handful of sparks: the light swells with both.
    const beat = 0.5 + 0.5 * Math.cos(Math.PI * 2 * puffPhase);
    const level = Math.pow(burn, 1.4) * flicker * (0.93 + 0.07 * beat) * (1 + 0.10 * this.embers.flash);
    const lean = 0.052 * Math.pow(1.6, 1.5);               // fireLean() at the height of the light
    const lx = u.uFireWind.value.x * lean + 0.10 * (noise1(t * 3.1 + 1.0) - 0.5);
    const lz = u.uFireWind.value.y * lean + 0.10 * (noise1(t * 2.7 + 8.0) - 0.5);
    const ly = 1.55 + 0.75 * burn + 0.12 * (flicker - 1.0);
    this.light.position.set(lx, ly, lz);
    // A low fire burns redder.
    this.light.color.setRGB(1, LIGHT_G / LIGHT_R * (0.86 + 0.14 * burn), LIGHT_B / LIGHT_R * (0.7 + 0.3 * burn));
    this.light.intensity = LIGHT_R * level;
    const shared = this.ctx.shared;
    const origin = this.ctx.origin;
    shared.uFireLightPos.value.set(origin.x + lx, origin.y + ly, origin.z + lz);
    shared.uFireLightColor.value.set(this.light.color.r, this.light.color.g, this.light.color.b).multiplyScalar(this.light.intensity);
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    this.fuel.fuelField.dispose();
  }
}
