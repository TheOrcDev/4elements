import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** OrbitControls plus smooth cinematic fly-to transitions between views. */
export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, dom);
    const c = this.controls;
    c.enableDamping = true;
    c.dampingFactor = 0.06;
    c.rotateSpeed = 0.55;
    c.zoomSpeed = 0.7;
    c.enablePan = false;
    c.minPolarAngle = 0.15;
    c.maxPolarAngle = Math.PI * 0.485;
    c.autoRotateSpeed = 0.35;
    this.tween = null;
    this.limits = { overview: [7, 34], focus: [3.2, 14] };
    this.setLimits('overview');
  }

  setLimits(mode) {
    const [min, max] = this.limits[mode];
    this.controls.minDistance = min;
    this.controls.maxDistance = max;
  }

  jumpTo(pos, target) {
    this.tween = null;
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.controls.enabled = true;
    this.controls.update();
  }

  #clearInertia() {
    const c = this.controls;
    c._sphericalDelta?.set(0, 0, 0);
    c._panOffset?.set(0, 0, 0);
    if (c._scale !== undefined) c._scale = 1;
  }

  flyTo(pos, target, { duration = 2.2, arc = 1.5, onDone } = {}) {
    this.#clearInertia();
    this.tween = {
      p0: this.camera.position.clone(),
      t0: this.controls.target.clone(),
      p1: pos.clone(),
      t1: target.clone(),
      k: 0,
      duration,
      arc,
      onDone,
    };
    this.controls.enabled = false;
    this.controls.autoRotate = false;
  }

  get busy() {
    return this.tween !== null;
  }

  /** Stop a flight where it is and hand control back to the user. */
  cancel() {
    if (!this.tween) return;
    const done = this.tween.onDone;
    this.tween = null;
    done?.();
    this.#clearInertia();
    this.controls.enabled = true;
    this.controls.update();
  }

  update(dt) {
    const tw = this.tween;
    if (tw) {
      tw.k = Math.min(tw.k + dt / tw.duration, 1);
      const e = easeInOutCubic(tw.k);
      // blend in cylindrical coordinates around the sanctum centre for a sweeping move
      const a0 = Math.atan2(tw.p0.x, tw.p0.z), a1 = Math.atan2(tw.p1.x, tw.p1.z);
      let da = a1 - a0;
      if (da > Math.PI) da -= Math.PI * 2;
      if (da < -Math.PI) da += Math.PI * 2;
      const r0 = Math.hypot(tw.p0.x, tw.p0.z), r1 = Math.hypot(tw.p1.x, tw.p1.z);
      const useCyl = r0 > 2 && r1 > 2;
      if (useCyl) {
        const a = a0 + da * e;
        const r = THREE.MathUtils.lerp(r0, r1, e);
        this.camera.position.set(Math.sin(a) * r, THREE.MathUtils.lerp(tw.p0.y, tw.p1.y, e), Math.cos(a) * r);
      } else {
        this.camera.position.lerpVectors(tw.p0, tw.p1, e);
      }
      this.camera.position.y += Math.sin(e * Math.PI) * tw.arc;
      this.controls.target.lerpVectors(tw.t0, tw.t1, e);
      this.camera.lookAt(this.controls.target);
      if (tw.k >= 1) {
        this.tween = null;
        tw.onDone?.(); // may change zoom limits — must run before the controls clamp
        this.#clearInertia();
        this.controls.enabled = true;
        this.controls.update();
      }
      return;
    }
    this.controls.update(dt);
  }
}
