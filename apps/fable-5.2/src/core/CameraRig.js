import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ELEMENTS } from './layout.js';
import { shared } from './shared.js';

// Orbit camera with eased flights between an overview and one framing per element.
// A view is { target, azimuth, elevation, distance, ... }: the camera sits at
// target + distance * (sin(az) cos(el), sin(el), cos(az) cos(el)). Optional fields:
//   sway   while idle the camera swings this many radians either side of where it stands
//   fit    the distance from which the subject just fills the width of a 3:2 window; narrower
//          windows stand further back in proportion, so that it still fits (default: distance)
//   limit  the furthest the camera may stand, whatever the window (default: none)
//   top    the height (m above the film) of the tallest part of the subject: the camera looks
//          at the height that keeps it in frame with a strip of sky above (target[1] is ignored)
//   upright  { azimuth, distance, sway } used instead on windows taller than wide (where the
//          caption runs across the bottom); the camera is kept clear of the other elements

const DEG = Math.PI / 180;

export const VIEWS = {
  // High enough that the two far elements stand clear above the near ones, turned so the
  // four spread evenly across the frame once perspective has pulled the far pair inward.
  overview: { target: [0, 3.7, 0], azimuth: -15 * DEG, elevation: 11 * DEG, distance: 33.5 },
  // Every close-up looks the same way as the overview (toward -z, the afterglow to the
  // right), so the scene has a front and no flight between views crosses an element.
  // Each is shot from low over the film and far enough back to hold the element's
  // reflection, which is half the picture.
  // Fire is seen from inside the ring against the open dusk, from the tip of the flame in its
  // gusts down through the bright part of its reflection. That takes a frame some 13 m tall,
  // and the ring has room for it only in the gap between the sea and the vortex, where it
  // leaves 19 m: the camera stands there, beside the sea rather than in front of it, and its
  // swing is kept short on that side (the sea is near). (Turned further toward the vortex, its
  // cloud starts to reach into the frame, and costs the frame its volume pass.) An upright
  // window stands a little further back in the same gap, its swing shorter still.
  fire: {
    target: [0, 2.5, -10], azimuth: 16 * DEG, elevation: 2.5 * DEG, distance: 19.5, sway: 0.22,
    top: 8.4, upright: { distance: 20, sway: 0.035 },
  },
  // Water from outside, low enough to look into it, the pyre glowing through it.
  water: { target: [0, 1.4, 10], azimuth: 18 * DEG, elevation: 2.5 * DEG, distance: 12.5, fit: 10.5, sway: 0.3 },
  // Earth from the same side, the moon over the camera's shoulder, the pyre small beyond it,
  // low enough in the frame for the geode's reflection. (Beyond 17 m from the rock the
  // element draws its lighter set: the view stays inside that.)
  earth: { target: [-10, 1.6, 0], azimuth: -15 * DEG, elevation: 3 * DEG, distance: 16.5, fit: 13.5, sway: 0.2 },
  // Air needs room: from outside the ring, far enough back for the whole funnel and its cloud,
  // lit from the side by the afterglow. Aimed 3.5 m behind the funnel and swung toward the
  // sea, so that the sea and the rock stand wholly outside the left edge of a landscape frame
  // (where the caption is) instead of sliced by it; the swing is kept short for the same reason.
  air: { target: [10, 6.3, -3.5], azimuth: 10 * DEG, elevation: 2 * DEG, distance: 25.5, sway: 0.1 },
};

// The moon stands low over the horizon (shared.uMoonDiscDir). The overview's idle orbit looks
// toward it for a while; there it dips toward the film (by MOON_DIP at most) so that the disc
// sits a fifth of the way down the frame, below the interface's top row, instead of on the
// edge. The dip fades in and out over the azimuths in MOON_NEAR..MOON_FAR either side.
const MOON_AZ = Math.atan2(-shared.uMoonDiscDir.value.x, -shared.uMoonDiscDir.value.z);
const MOON_EL = 6.5 * DEG;      // the camera's elevation that puts the disc there
const MOON_DIP = 4.5 * DEG;
const MOON_BACK = 0.1;          // share of its distance the camera also backs off at the full dip (a lower camera
                                // sees the near elements taller: this keeps the vortex's cloud inside the frame)
const MOON_NEAR = 30 * DEG, MOON_FAR = 58 * DEG;
const MOON_RATE = 0.8 * DEG;    // rad/s, the fastest the dip moves (when the orbit starts inside it)

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
const SWAY_PERIOD = 45;         // s, the shortest time a swing takes there and back (a short swing goes slower)
const SWAY_BOB = 0.016;         // rad, how far the idle camera also rises and sinks
const HEADROOM = 0.04;          // share of the frame's height left as sky above a tall subject (see `top`)
const STAND_CLEAR = -0.3;       // m: a framing may stand this much inside a neighbour's KEEP_OUT radius

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
    // The overview's idle orbit, about three minutes a turn. It runs the way the opening move
    // drifts (azimuth increasing), which carries the camera round toward the moon, low over
    // the far horizon, within the first minute and a half instead of near the end of the turn.
    c.autoRotateSpeed = -0.32;

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
    this.swayReach = 0.3;          // radians either side, for the view being shown (see _resolve)
    this.dip = 0;                  // how far the overview's orbit has dipped toward the film to frame the moon (rad)
    this.dipBack = 0;              // and how far it has backed off with it (m)
    this._grab = new THREE.Spherical();
    c.addEventListener('start', () => {
      this.flight = null; this.idle = 0; this.userMoved = true; this.dip = 0; this.dipBack = 0;
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
    const half = Math.tan(this.camera.fov * DEG / 2);
    if (v.top !== undefined) return this._resolveTall(id, v, half);
    const distance = Math.min(Math.max(v.distance, (v.fit ?? v.distance) * this.aspectDistance), v.limit ?? Infinity);
    if (this.aspect >= 1) return { ...v, distance };
    // Upright screens carry a caption across the bottom of a close-up: look a little below
    // the subject (never below the film) so that it stands clear of the words.
    const drop = 0.13 * 2 * distance * half;
    return { ...v, distance, target: [v.target[0], Math.max(0.3, v.target[1] - drop), v.target[2]] };
  }

  /**
   * A view framed by its subject's height (see `top` and `upright` above). The frame's upper
   * edge, where it passes the subject, is put a strip of sky (HEADROOM of the frame) above
   * `top`; on an upright window that also lifts the subject's foot clear of the caption.
   */
  _resolveTall(id, v, half) {
    const up = this.aspect < 1 && v.upright;
    const view = { ...v, ...(up || {}) };
    view.distance = Math.min(view.distance, up ? Infinity : v.limit ?? Infinity);
    view.sway = view.sway ?? 0.3;
    // Where the camera would stand at distance d, with a target height that does not matter
    // here (the camera stays below every keep-out top at these heights).
    const at = (d, azimuth) => this._c.set(
      v.target[0] + Math.sin(azimuth) * Math.cos(v.elevation) * d, 2,
      v.target[2] + Math.cos(azimuth) * Math.cos(v.elevation) * d);
    // A framing may stand nearer a neighbour than a flight passes it (STAND_CLEAR), but not
    // in it: step in until clear, then shorten the swing until its whole arc stays clear too.
    for (let i = 0; i < 60 && !this._clearOf(at(view.distance, view.azimuth), id, STAND_CLEAR); i++) view.distance -= 0.1;
    for (let i = 0; i < 40; i++) {
      let clear = true;
      for (let k = -4; k <= 4 && clear; k++) clear = this._clearOf(at(view.distance, view.azimuth + view.sway * k / 4), id, STAND_CLEAR);
      if (clear) break;
      view.sway *= 0.85;
    }
    // The upper edge of the frame meets the subject's axis at camera height + d cos(el) tan(fov/2 - el).
    const d = view.distance, el = v.elevation;
    const edge = d * Math.sin(el) + d * Math.cos(el) * Math.tan(Math.atan(half) - el);
    const y = v.top + HEADROOM * 2 * d * half - edge;
    view.target = [v.target[0], Math.max(0.3, y), v.target[2]];
    return view;
  }

  /** Is a camera at `p` outside the keep-out cylinder of every element but `own` (with a margin)? */
  _clearOf(p, own, margin = 0) {
    for (const e of ELEMENTS) {
      const keep = KEEP_OUT[e.id];
      if (!keep || e.id === own || p.y >= keep[1]) continue;
      if (Math.hypot(p.x - e.position[0], p.z - e.position[2]) < keep[0] + margin) return false;
    }
    return true;
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
    this.swayReach = view.sway ?? 0.3;
    this.controls.target.fromArray(view.target);
    this.camera.position.copy(viewToOffset(view, this._a)).add(this.controls.target);
    this.camera.lookAt(this.controls.target);
    this.flight = null;
    this.userMoved = false;
    this.dip = 0; this.dipBack = 0;
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
    this.swayReach = view.sway ?? 0.3;
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
    this.dip = 0; this.dipBack = 0;
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
    // The lift over an element follows the eased progress, like everything else: it rises and
    // settles with the camera's own speed instead of finishing after the camera has stopped.
    if (f.over) position.y += f.over.rise * bump(k, f.over.at);
    // Both ends of a flight are where they are (the fire view stands right in front of the
    // sea): the steering fades in after the start and out again before the end.
    if (steer) this._steerClear(position, smoothstep(t, 0, 0.3) * smoothstep(1 - t, 0, 0.3), f.over && f.over.id);
  }

  /**
   * A route that would run over the middle of an element is lifted over it, in one long
   * arc, rather than squeezed round it at the last moment: overview to fire crosses the sea.
   */
  _planOver(f) {
    const p = this._c, before = this._d, target = this._a;
    // An element the flight starts or ends beside is being left or reached, not crossed.
    const beside = (e, at) => {
      const keep = KEEP_OUT[e.id];
      this._flightPoint(f, at, p, target, false);
      return p.y < keep[1] && Math.hypot(p.x - e.position[0], p.z - e.position[2]) < keep[0];
    };
    const crossable = ELEMENTS.filter((e) => KEEP_OUT[e.id] && !beside(e, 0) && !beside(e, 1));
    let middle = 0.5;                                   // of the keep-out radius
    let over = null;
    this._flightPoint(f, 0, before, target, false);
    for (let i = 1; i <= SAMPLES; i++) {
      this._flightPoint(f, i / SAMPLES, p, target, false);
      for (const e of crossable) {
        const keep = KEEP_OUT[e.id];
        if (Math.min(p.y, before.y) >= keep[1]) continue;
        // How near this stretch of the path comes to the element's axis, seen from above.
        const ax = e.position[0] - before.x, az = e.position[2] - before.z, sx = p.x - before.x, sz = p.z - before.z;
        const along = THREE.MathUtils.clamp((ax * sx + az * sz) / (sx * sx + sz * sz || 1), 0, 1);
        const d = Math.hypot(ax - along * sx, az - along * sz) / keep[0];
        if (d < middle) { middle = d; over = e; }
      }
      before.copy(p);
    }
    if (!over) { this._planSight(f); return; }
    // Lift the path by enough to clear the element's own footprint, most where it needs it most.
    // (`at` and the samples are in eased progress, which is what drives the lift.)
    const [radius, height] = KEEP_OUT[over.id];
    const inside = [];
    let at = 0.5, rise = 0;
    for (let i = 1, n = SAMPLES * 4; i < n; i++) {
      this._flightPoint(f, i / n, p, target, false);
      if (Math.hypot(p.x - over.position[0], p.z - over.position[2]) > 0.7 * radius || p.y >= height) continue;
      const k = f.ease(i / n);
      inside.push(k, height - p.y);
      if (height - p.y > rise) { rise = height - p.y; at = k; }
    }
    for (let i = 0; i < inside.length; i += 2) rise = Math.max(rise, inside[i + 1] / Math.max(bump(inside[i], at), 0.2));
    f.over = { id: over.id, at, rise: Math.min(rise, 10) };
  }

  /**
   * A route that passes behind another element would, for a moment, show it standing in front
   * of the element being flown to (a phone's fly-in to the fire comes in behind the sea): lift
   * the route by enough that the line of sight to the subject's foot clears the other's top.
   */
  _planSight(f) {
    if (!KEEP_OUT[this.viewId]) return;                 // only on the way in to an element
    const p = this._c, target = this._a;
    const foot = this._d.set(f.toTarget.x, 0.6, f.toTarget.z);
    const near = (e, v) => Math.hypot(v.x - e.position[0], v.z - e.position[2]) < KEEP_OUT[e.id][0];
    const others = ELEMENTS.filter((e) => KEEP_OUT[e.id] && !near(e, f.fromTarget) && !near(e, f.toTarget));
    const need = [];
    let at = 0.5, most = 0;
    for (let i = 1; i < SAMPLES; i++) {
      // The subject matters once the camera is closing in on it; before that the lift is free to rise.
      if (f.ease(i / SAMPLES) < 0.35) continue;
      this._flightPoint(f, i / SAMPLES, p, target, false);
      const sx = foot.x - p.x, sz = foot.z - p.z;
      for (const e of others) {
        const [radius, height] = KEEP_OUT[e.id];
        // The element's body is about 0.6 of its keep-out radius, its top 2 m below the keep-out's.
        const s = THREE.MathUtils.clamp(((e.position[0] - p.x) * sx + (e.position[2] - p.z) * sz) / (sx * sx + sz * sz || 1), 0, 0.9);
        if (Math.hypot(p.x + s * sx - e.position[0], p.z + s * sz - e.position[2]) > 0.6 * radius) continue;
        const lift = (height - 1.7 - (p.y + (foot.y - p.y) * s)) / (1 - s);
        if (lift <= 0) continue;
        const k = f.ease(i / SAMPLES);
        need.push(k, lift);
        if (lift > most) { most = lift; at = k; }
      }
    }
    if (!most) return;
    let rise = most;
    for (let i = 0; i < need.length; i += 2) rise = Math.max(rise, need[i + 1] / Math.max(bump(need[i], at), 0.2));
    f.over = { id: null, at: Math.min(at, 0.85), rise: Math.min(rise, 4) };
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
      if (c.autoRotate) this._moonDip(dt);
    }
    c.update(dt);
  }

  /**
   * While the overview orbits, lower it toward the film as it turns to face the moon (see
   * MOON_DIP), and raise it again as it turns away. Like the sway it is an offset to wherever
   * the camera stands: a camera the visitor has raised high, where the moon is out of the
   * frame anyway, is left alone, and only what was dipped is given back.
   */
  _moonDip(dt) {
    const c = this.controls;
    this._s0.setFromVector3(this._a.copy(this.camera.position).sub(c.target));
    const off = Math.abs(wrapAngle(this._s0.theta - MOON_AZ));
    const elevation = Math.PI / 2 - this._s0.phi + this.dip;           // where the camera would be without the dip
    const want = (1 - smoothstep(off, MOON_NEAR, MOON_FAR)) * (1 - smoothstep(elevation, 15 * DEG, 20 * DEG))
      * THREE.MathUtils.clamp(elevation - MOON_EL, 0, MOON_DIP);
    const step = THREE.MathUtils.clamp(want - this.dip, -MOON_RATE * dt, MOON_RATE * dt);
    if (Math.abs(step) < 1e-7) return;
    const phi = THREE.MathUtils.clamp(this._s0.phi + step, c.minPolarAngle, c.maxPolarAngle);
    this.dip += phi - this._s0.phi;
    this._s0.phi = phi;
    const back = (this.dip / MOON_DIP) * MOON_BACK * (this._s0.radius - this.dipBack);
    this._s0.radius += back - this.dipBack;
    this.dipBack = back;
    this.camera.position.setFromSpherical(this._s0).add(c.target);
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
    const reach = this.swayReach;
    s.phase += Math.min(SWAY_SPEED / reach, 2 * Math.PI / SWAY_PERIOD) * s.rate * dt;
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
