import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clamp, easeInOutCubic, lerp } from './utils/rng.js';

/**
 * Orbit camera with cinematic fly-to transitions between the overview and each shrine.
 * A flight interpolates the orbit *offset* (spherical) around a moving target, so the camera
 * sweeps around the scene instead of cutting straight through it.
 */
export class CameraRig {
  constructor(camera, dom, elements) {
    this.camera = camera;
    const c = (this.controls = new OrbitControls(camera, dom));
    c.enableDamping = true;
    c.dampingFactor = 0.06;
    c.rotateSpeed = 0.55;
    c.zoomSpeed = 0.75;
    c.panSpeed = 0.6;
    c.minDistance = 4.5;
    c.maxDistance = 60;
    c.minPolarAngle = 0.1;
    c.maxPolarAngle = Math.PI * 0.492;
    c.screenSpacePanning = false;
    c.autoRotate = true;
    c.autoRotateSpeed = 0.42;

    this.views = {
      all: { position: new THREE.Vector3(13.5, 18.5, 26.5), target: new THREE.Vector3(0, 2.4, 0) },
    };
    for (const el of elements) this.views[el.id] = this.viewFor(el);

    camera.position.copy(this.views.all.position);
    c.target.copy(this.views.all.target);
    c.update();

    this.current = 'all';
    this.flight = null;
    this.idle = 0;
    this.autoOrbit = true;
    this._interacting = false;
    this._touched = false;
    this.fit = 1; // >1 pulls the camera back on narrow (portrait) screens

    c.addEventListener('start', () => {
      this._touched = true;
      this.flight = null;
      this.idle = 0;
      this._interacting = true;
      c.autoRotate = false;
    });
    c.addEventListener('end', () => {
      this._interacting = false;
      this.idle = 0;
    });
  }

  viewFor(el) {
    const anchor = el.position.clone();
    const focus = anchor.clone().add(el.focus);
    const inward = new THREE.Vector3(-anchor.x, 0, -anchor.z).normalize();
    // 3/4 view from the plaza side, slightly rotated so the shrine isn't dead-centre
    inward.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.16);
    const dist = el.viewDistance ?? el.radius * 2.9 + 3.5;
    const position = focus.clone().addScaledVector(inward, dist);
    position.y = focus.y + el.radius * 0.55 + 0.4;
    return { position, target: focus };
  }

  flyTo(name, duration = 2.6) {
    const v = this.views[name];
    if (!v) return;
    const cam = this.camera;
    const ctrl = this.controls;
    const fromTarget = ctrl.target.clone();
    const s0 = new THREE.Spherical().setFromVector3(cam.position.clone().sub(fromTarget));
    const s1 = new THREE.Spherical().setFromVector3(v.position.clone().sub(v.target).multiplyScalar(this.fit));
    let dTheta = s1.theta - s0.theta;
    dTheta = ((((dTheta + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
    this.flight = { t: 0, duration, fromTarget, toTarget: v.target.clone(), s0, s1, dTheta };
    this.current = name;
    this.idle = 0;
    ctrl.autoRotate = false;
  }

  update(dt) {
    const ctrl = this.controls;
    const f = this.flight;
    if (f) {
      f.t += dt;
      const k = easeInOutCubic(clamp(f.t / f.duration, 0, 1));
      const target = f.fromTarget.clone().lerp(f.toTarget, k);
      const sph = new THREE.Spherical(
        lerp(f.s0.radius, f.s1.radius, k) * (1 + 0.16 * Math.sin(Math.PI * k)),
        lerp(f.s0.phi, f.s1.phi, k),
        f.s0.theta + f.dTheta * k,
      );
      this.camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(sph));
      ctrl.target.copy(target);
      if (f.t >= f.duration) this.flight = null;
    } else if (!this._interacting) {
      this.idle += dt;
      ctrl.autoRotate = this.autoOrbit && this.idle > 4;
    }
    // Let the camera dip below its target for dramatic low angles, but never below ~0.9 above the plaza.
    const r = this.camera.position.distanceTo(ctrl.target);
    const room = (ctrl.target.y - 0.9) / Math.max(r, 1e-3);
    ctrl.maxPolarAngle = Math.min(Math.PI * 0.6, Math.acos(-clamp(room, -0.99, 0.99)));
    ctrl.update(dt);
    // keep panning inside the arena
    ctrl.target.x = clamp(ctrl.target.x, -26, 26);
    ctrl.target.z = clamp(ctrl.target.z, -26, 26);
    ctrl.target.y = clamp(ctrl.target.y, 0.2, 16);
  }

  /** Adapt framing to the viewport: pull back on portrait screens. Snaps only if the user hasn't moved the camera. */
  setFit(fit) {
    if (Math.abs(fit - this.fit) < 1e-3) return;
    const ratio = fit / this.fit;
    this.fit = fit;
    if (!this._touched && !this.flight) {
      const target = this.controls.target;
      this.camera.position.sub(target).multiplyScalar(ratio).add(target);
      this.controls.update();
    }
  }

  setAutoOrbit(on) {
    this.autoOrbit = on;
    if (!on) this.controls.autoRotate = false;
  }

  get busy() {
    return !!this.flight;
  }
}
