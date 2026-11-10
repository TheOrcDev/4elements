import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ELEMENTS } from './layout.js';

// Orbit camera with eased flights between an overview and one framing per element.
// A view is { target, azimuth, elevation, distance, ... }: the camera sits at
// target + distance * (sin(az) cos(el), sin(el), cos(az) cos(el)). Optional fields:
//   sway   while idle the camera swings this many radians either side of where it stands
//   fit    the distance from which the subject just fills the width of a 3:2 window; narrower
//          windows stand further back in proportion, so that it still fits (default: distance)
//   limit  the furthest the camera may stand, whatever the window (default: none)
//   drop   upright windows carry a caption across the bottom of a close-up: the camera looks
//          this share of the frame's height below the target, so the subject clears the words

const DEG = Math.PI / 180;

export const VIEWS = {
  // High enough that the two far elements stand clear above the near ones, turned so the
  // four spread evenly across the frame once perspective has pulled the far pair inward.
  overview: { target: [0, 3.7, 0], azimuth: -15 * DEG, elevation: 11 * DEG, distance: 33.5 },
  // Every close-up looks the same way as the overview (toward -z, the afterglow to the
  // right), so the scene has a front and no flight between views crosses an element.
  // Each is shot from low over the film and far enough back to hold the element's
  // reflection, which is half the picture.
  // Fire is seen from inside the ring against the open dusk, from the whole flame down to
  // the bright foot of its reflection. The sea stands two and a half metres behind the
  // camera, so this view never backs off, and its swing is kept short.
  fire: { target: [0, 2.2, -10], azimuth: 6 * DEG, elevation: 2.5 * DEG, distance: 15.5, limit: 15.5, drop: 0.08, sway: 0.22 },
  // Water from outside, low enough to look into it, the pyre glowing through it.
  water: { target: [0, 1.4, 10], azimuth: 18 * DEG, elevation: 2.5 * DEG, distance: 12.5, fit: 10.5, sway: 0.3 },
  // Earth from the same side, the moon over the camera's shoulder, the pyre small beyond it.
  earth: { target: [-10, 2.0, 0], azimuth: -15 * DEG, elevation: 3 * DEG, distance: 16, fit: 13.5, sway: 0.2 },
  // Air needs room: from outside the ring, far enough back for the whole funnel, its cloud
  // and its reflection, lit from the side by the afterglow.
  air: { target: [10, 6.0, 0], azimuth: 17 * DEG, elevation: 2 * DEG, distance: 24, sway: 0.15 },
};

// Flights steer round the elements instead of through them: [radius, height] of the upright
// cylinder about each element's axis that the camera is kept out of while it is being flown.
// At that height it may pass over, with a couple of metres to spare above what stands below.
const KEEP_OUT = { fire: [4.0, 9.5], water: [4.6, 6.0], earth: [5.2, 9.0], air: [3.6, 13.5] };

// A flight takes as long as its fastest moment needs, within these bounds (seconds): the
// camera never travels faster than FLIGHT_SPEED (m/s) nor swings its view faster than
// FLIGHT_TURN (rad/s), so a hop to the next element stays brisk and a long haul takes its time.
const FLIGHT_MIN = 2.5, FLIGHT_MAX = 4.2, FLIGHT_SPEED = 30, FLIGHT_TURN = 0.9;
const SAMPLES = 48;             // how finely a flight is looked over when it is planned

const SWAY_SPEED = 0.021;       // rad/s, the idle swing of a close-up at its fastest (mid-swing)
const SWAY_BOB = 0.016;         // rad, how far the idle camera also rises and sinks

const { lerp, smoothstep } = THREE.MathUtils;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const wrapAngle = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
// Rises smoothly from 0 at t = 0 to 1 at t = at, and falls back to 0 at t = 1.
const bump = (t, at) => (t < at ? smoothstep(t, 0, at) : 1 - smoothstep(t, at, 1));

function viewToOffset(view, out) {
  const ce = Math.cos(view.elevation);
  return out.set(Math.sin(view.azimuth) * ce, Math.sin(view.elevation), Math.cos(view.azimuth) * ce).multiplyScalar(view.distance);
}

export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);
    const c = this.controls;
    c.enableDamping = true;
    c.dampingFactor = 0.055;
    c.enablePan = false;
    c.rotateSpeed = 0.55;
    c.zoomSpeed = 0.7;
    c.minDistance = 5;
    c.maxDistance = 64;
    c.minPolarAngle = 0.35;
    c.maxPolarAngle = Math.PI / 2 - 0.012;
    c.autoRotateSpeed = 0.32;

    this.autoOrbit = true;
    this.viewId = 'overview';
    this.flight = null;
    this.idle = 10;
    this.aspectDistance = 1;
    this.overviewDistance = 1;
    this.aspect = 16 / 9;
    this.userMoved = false;       // has the visitor taken the camera since the last programmed view?
    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
    this._c = new THREE.Vector3();
    this._d = new THREE.Vector3();
    this._s0 = new THREE.Spherical();
    this._s1 = new THREE.Spherical();

    // Idle swing of a close-up: an offset added to wherever the camera stands, so that the
    // visitor's own moves and the swing never fight. `rate` eases it in and out.
    this.sway = { phase: 0, rate: 0, turn: 0, rise: 0 };
    this._grab = new THREE.Spherical();
    c.addEventListener('start', () => {
      this.flight = null; this.idle = 0; this.userMoved = true;
      this._grab.setFromVector3(this._a.copy(camera.position).sub(c.target));
    });
    // After the visitor lets go, the swing starts afresh around wherever they left the camera.
    c.addEventListener('end', () => {
      this._s1.setFromVector3(this._a.copy(camera.position).sub(c.target));
      if (Math.abs(wrapAngle(this._s1.theta - this._grab.theta)) + Math.abs(this._s1.phi - this._grab.phi) > 1e-3) this._resetSway();
    });
    this.jump('overview');
  }

  /** Narrow viewports need the camera further back to keep the subject in frame. */
  setAspect(aspect) {
    const before = this.aspectDistance + this.overviewDistance, was = this.aspect;
    this.aspect = aspect;
    const narrow = aspect >= 1.5 ? 1 : 1.5 / Math.max(aspect, 0.4);
    this.aspectDistance = Math.min(2.4, narrow);
    // The overview has to hold the whole ring, the vortex's cloud included: it backs off further.
    this.overviewDistance = Math.min(2.75, narrow);
    this.controls.maxDistance = 64 * this.overviewDistance;
    if (Math.abs(before - this.aspectDistance - this.overviewDistance) < 1e-4 && (was < 1) === (aspect < 1)) return;
    // Re-frame for the new shape, unless the visitor has placed the camera themselves.
    if (this.flight) {
      const f = this.flight;
      this.flyTo(this.viewId, { duration: Math.max(0.3, f.duration * (1 - f.t)), lift: 0, ease: f.ease });
    } else if (!this.userMoved) this.jump(this.viewId);
  }

  _resolve(id) {
    const v = VIEWS[id] || VIEWS.overview;
    if (id === 'overview' || !VIEWS[id]) return { ...v, distance: v.distance * this.overviewDistance };
    const distance = Math.min(Math.max(v.distance, (v.fit ?? v.distance) * this.aspectDistance), v.limit ?? Infinity);
    if (this.aspect >= 1) return { ...v, distance };
    // Upright screens carry a caption across the bottom of a close-up: look a little below
    // the subject (never below the film) so that it stands clear of the words.
    const drop = (v.drop ?? 0.13) * 2 * distance * Math.tan(this.camera.fov * DEG / 2);
    return { ...v, distance, target: [v.target[0], Math.max(0.3, v.target[1] - drop), v.target[2]] };
  }

  /** Opening move: start high and wide, already drifting in, and settle into the overview. */
  intro(duration = 6.5) {
    const v = this._resolve('overview');
    const start = { ...v, distance: v.distance * 1.34, elevation: v.elevation + 0.10, azimuth: v.azimuth - 0.26 };
    this.controls.target.fromArray(v.target);
    this.camera.position.copy(viewToOffset(start, this._a)).add(this.controls.target);
    this.camera.lookAt(this.controls.target);
    // No mid-flight swing here (it would carry the camera away before it comes in), and no
    // slow start: the push-in is under way as the picture fades up, and only decelerates.
    this.flyTo('overview', { duration, lift: 0, ease: easeOut });
  }

  /** Cut to a view with no transition. */
  jump(id) {
    const view = this._resolve(id);
    this.viewId = VIEWS[id] ? id : 'overview';
    this.controls.target.fromArray(view.target);
    this.camera.position.copy(viewToOffset(view, this._a)).add(this.controls.target);
    this.camera.lookAt(this.controls.target);
    this.flight = null;
    this.userMoved = false;
    this._resetSway();
    this.controls.update();
  }

  /**
   * Fly to a view. The flight lasts longer the further it has to go, unless `duration` says
   * otherwise; `lift` is how much wider the camera swings mid-flight. Returns the duration.
   */
  flyTo(id, { duration, lift = 0.12, ease = easeInOut } = {}) {
    const view = this._resolve(id);
    this.viewId = VIEWS[id] ? id : 'overview';
    const fromTarget = this.controls.target.clone();
    const fromOffset = this.camera.position.clone().sub(fromTarget);
    const toTarget = new THREE.Vector3().fromArray(view.target);
    const toOffset = viewToOffset(view, new THREE.Vector3());
    this._s0.setFromVector3(fromOffset);
    this._s1.setFromVector3(toOffset);
    const f = {
      t: 0, duration: duration ?? FLIGHT_MIN, lift, ease, over: null,
      fromTarget, toTarget,
      r0: this._s0.radius, r1: this._s1.radius,
      phi0: this._s0.phi, phi1: this._s1.phi,
      // Go the short way round.
      theta0: this._s0.theta, dTheta: wrapAngle(this._s1.theta - this._s0.theta),
    };
    this._planOver(f);
    if (duration === undefined) f.duration = this._flightTime(f);
    this.flight = f;
    this.userMoved = false;
    this.idle = 0;
    this._resetSway();
    return f.duration;
  }

  /** Where a flight has the camera, and what it looks at, when the share t of its time has passed. */
  _flightPoint(f, t, position, target, steer = true) {
    const k = f.ease(t);
    target.lerpVectors(f.fromTarget, f.toTarget, k);
    // Swing a little wider mid-flight so the move reads as an arc, not a slide.
    const lift = Math.sin(k * Math.PI) * f.lift;
    this._s0.set(lerp(f.r0, f.r1, k) * (1 + lift), lerp(f.phi0, f.phi1, k) - lift * 0.25, f.theta0 + f.dTheta * k);
    this._s0.makeSafe();
    position.setFromSpherical(this._s0).add(target);
    if (f.over) position.y += f.over.rise * bump(t, f.over.at);
    // Both ends of a flight are where they are (the fire view stands right in front of the
    // sea): the steering fades in after the start and out again before the end.
    if (steer) this._steerClear(position, smoothstep(t, 0, 0.3) * smoothstep(1 - t, 0, 0.3), f.over && f.over.id);
  }

  /**
   * A route that would run over the middle of an element is lifted over it, in one long
   * arc, rather than squeezed round it at the last moment: overview to fire crosses the sea.
   */
  _planOver(f) {
    const p = this._c, target = this._d;
    let middle = 0.4;                                   // of the keep-out radius
    let over = null;
    for (let i = 1; i < SAMPLES; i++) {
      this._flightPoint(f, i / SAMPLES, p, target, false);
      for (const e of ELEMENTS) {
        const keep = KEEP_OUT[e.id];
        if (!keep || p.y >= keep[1]) continue;
        const d = Math.hypot(p.x - e.position[0], p.z - e.position[2]) / keep[0];
        if (d < middle) { middle = d; over = e; }
      }
    }
    if (!over) return;
    // Lift the path by enough to clear the element's own footprint, most where it needs it most.
    const [radius, height] = KEEP_OUT[over.id];
    const inside = [];
    let at = 0.5, rise = 0;
    for (let i = 1; i < SAMPLES; i++) {
      this._flightPoint(f, i / SAMPLES, p, target, false);
      if (Math.hypot(p.x - over.position[0], p.z - over.position[2]) > 0.7 * radius || p.y >= height) continue;
      inside.push(i / SAMPLES, height - p.y);
      if (height - p.y > rise) { rise = height - p.y; at = i / SAMPLES; }
    }
    for (let i = 0; i < inside.length; i += 2) rise = Math.max(rise, inside[i + 1] / Math.max(bump(inside[i], at), 0.2));
    f.over = { id: over.id, at, rise: Math.min(rise, 10) };
  }

  /** How long a flight should take: see FLIGHT_SPEED and FLIGHT_TURN. */
  _flightTime(f) {
    const p = this._c, view = this._d, before = this._a, viewBefore = this._b;
    let step = 0, turn = 0;
    for (let i = 0; i <= SAMPLES; i++) {
      this._flightPoint(f, i / SAMPLES, p, view);
      view.sub(p).normalize();
      if (i > 0) { step = Math.max(step, p.distanceTo(before)); turn = Math.max(turn, view.angleTo(viewBefore)); }
      before.copy(p);
      viewBefore.copy(view);
    }
    return THREE.MathUtils.clamp(Math.max(step / FLIGHT_SPEED, turn / FLIGHT_TURN) * SAMPLES, FLIGHT_MIN, FLIGHT_MAX);
  }

  update(dt) {
    const c = this.controls;
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + dt / f.duration);
      this._flightPoint(f, f.t, this.camera.position, c.target);
      if (f.t >= 1) this.flight = null;
      c.autoRotate = false;
    } else {
      this.idle += dt;
      const drifting = this.autoOrbit && this.idle > 5;
      // The overview circles the whole ring: the camera stays well outside every element.
      // Close-ups only sway: a full orbit would carry the camera through the neighbours.
      c.autoRotate = drifting && this.viewId === 'overview';
      this._sway(dt, drifting && this.viewId !== 'overview');
    }
    c.update(dt);
  }

  _resetSway() {
    const s = this.sway;
    s.phase = 0; s.rate = 0; s.turn = 0; s.rise = 0;
  }

  /**
   * Idle swing of a close-up: a slow sine either side of where the camera stands, and a
   * slower, smaller one in height, so that it drifts like a held camera instead of
   * shuttling between two stops.
   */
  _sway(dt, on) {
    const s = this.sway;
    s.rate += ((on ? 1 : 0) - s.rate) * (1 - Math.exp(-dt / (on ? 1.5 : 0.35)));
    if (s.rate < 1e-4) { s.rate = 0; return; }
    const reach = VIEWS[this.viewId].sway ?? 0.3;
    s.phase += (SWAY_SPEED / reach) * s.rate * dt;
    const turn = reach * Math.sin(s.phase);
    const rise = SWAY_BOB * Math.sin(s.phase * 0.618);
    const c = this.controls;
    this._s0.setFromVector3(this._a.copy(this.camera.position).sub(c.target));
    this._s0.theta += turn - s.turn;
    this._s0.phi = THREE.MathUtils.clamp(this._s0.phi - (rise - s.rise), c.minPolarAngle, c.maxPolarAngle);
    s.turn = turn;
    s.rise = rise;
    this.camera.position.setFromSpherical(this._s0).add(c.target);
  }

  /**
   * Bend a camera position round any element it would otherwise pass through. Each element
   * pushes outward from its axis, by the whole radius at the axis and by nothing from twice
   * the radius on, so a path is bent smoothly and not kinked at a rim; the push also fades
   * out over the top metre and a half of the cylinder. `weight` scales it all; `skip` names
   * an element the flight has been planned to pass over.
   */
  _steerClear(p, weight = 1, skip = null) {
    if (weight <= 0) return;
    for (const e of ELEMENTS) {
      const keep = KEEP_OUT[e.id];
      if (!keep || e.id === skip || p.y >= keep[1]) continue;
      const dx = p.x - e.position[0], dz = p.z - e.position[2];
      const d = Math.hypot(dx, dz);
      if (d >= 2 * keep[0]) continue;
      const u = 1 - d / (2 * keep[0]);
      const to = d + keep[0] * u * u * weight * smoothstep(keep[1] - p.y, 0, 1.5);
      const s = d > 1e-3 ? to / d : 0;
      p.x = e.position[0] + (d > 1e-3 ? dx * s : to);
      p.z = e.position[2] + dz * s;
    }
  }

  dispose() { this.controls.dispose(); }
}
