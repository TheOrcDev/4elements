// The vortex model.
//
// One description of the flow, shared by the raymarched cloud, the particles, the ribbons
// and the CPU side (ripples, lightning), so that everything sways and turns together:
//
//   axis      the centre line. Its foot wanders over the film, a helical kink travels along
//             it, and it is pinned under the middle of the cloud.
//   radius    the condensation wall: a rope at the water, widening toward the cloud.
//   horn      the same wall carried straight on up into the base of the storm cloud. The
//             cloud itself is a shape of its own (cloud.js); what is here of it is only
//             its outline, for the things that have to know where it is.
//   twist     how far a parcel of air has turned (radians, counter-clockwise seen from above)
//             by the time it has climbed to a height y. Because the flow is steady, a parcel
//             that is at height y now left the water y / UPDRAFT seconds ago and twist(y)
//             radians back. Labelling every point with those two numbers gives texture
//             coordinates that are carried exactly by the helical flow and never wind up,
//             however long the scene runs. The wall turns at UPDRAFT * d twist / d y:
//             once every two seconds on the rope, far more slowly under the cloud.
//   inflow    the sink with swirl that feeds the foot along the water (see paths.js): the
//             same constants drive the specks, the mist on the film and the ripples.
//
// All lengths are metres in the element's local space (y = 0 is the water film). A rotation
// by a positive angle a takes the point (r, 0) to (r cos a, -r sin a) in (x, z): that is
// counter-clockwise for someone looking down on it, and what rot2(a) of the shared GLSL does.

import { CLOUD_BASE } from './cloud.js';

const FUNNEL_HEIGHT = 11.0;          // where the funnel has merged into the cloud
const UPDRAFT = 0.75;                // m/s, climb speed of the features on the funnel wall
const TWIST = 24.0;                  // rad, total turn of a parcel between the water and the cloud
const TWIST_K = 2.05;                // how quickly the turn rate decays with height

const HORN_Y0 = 7.6;                 // from here up the wall keeps the lean it has: a cone into the cloud
const FLARE_Y = 8.7;                 // and from here it flares out a little more into the lowering, like a trumpet's bell
const FLARE_K = 0.22;                // (by FLARE_K (y - FLARE_Y)^2 metres)
export const HORN_TOP = 10.45;       // where the funnel's own vapour ends, inside the cloud's base
export const CLOUD_Y = 10.6;         // the heart of the cloud's base (where the lightning crawls)
// The cloud as the things around it know it: a body of revolution that widens from the
// lowering into the base and closes over the crown.
const CLOUD_FLOOR = CLOUD_BASE;       // height of its flat base
const CLOUD_R = 5.4;                 // radius of the base
const CLOUD_SHOULDER = 10.9;         // above this the crown draws in
const CLOUD_TOP = 13.3;              // and it ends here
// The disc that stands for the cloud where it shades what is below it from the moon.
const SHADE_Y = 11.4;
const SHADE_R = 5.6;

const KINK_SPEED = 0.38;             // rad/s, precession of the helical kink
const KINK_TURN = 4.6;               // rad of helix between the water and the cloud
const KINK_AMP = 0.85;               // m, largest sideways excursion (one third of the way up)
const FOOT_AMP = 0.5;                // m, scale of the foot's wander (it stays within 1.1 m)

export const IN_Q = 7.0;             // m^2/s, strength of the sink that feeds the foot
export const IN_B = 2.2;             // m, core softening of that sink
export const IN_K = 2.0;             // rad of turn per e-fold of radius on the way in

const f = (x) => Number(x).toFixed(5);

export const FLOW_GLSL = /* glsl */ `
const float AIR_H = ${f(FUNNEL_HEIGHT)};
const float AIR_UPDRAFT = ${f(UPDRAFT)};
const float AIR_TWIST = ${f(TWIST)};
const float AIR_TWIST_K = ${f(TWIST_K)};
const float CLOUD_Y = ${f(CLOUD_Y)};
const float HORN_Y0 = ${f(HORN_Y0)};
const float FLARE_Y = ${f(FLARE_Y)};
const float FLARE_K = ${f(FLARE_K)};
const float HORN_TOP = ${f(HORN_TOP)};
const float CLOUD_FLOOR = ${f(CLOUD_FLOOR)};
const float CLOUD_R = ${f(CLOUD_R)};
const float CLOUD_SHOULDER = ${f(CLOUD_SHOULDER)};
const float CLOUD_TOP = ${f(CLOUD_TOP)};
const float SHADE_Y = ${f(SHADE_Y)};
const float SHADE_R = ${f(SHADE_R)};
const float IN_Q = ${f(IN_Q)};
const float IN_B = ${f(IN_B)};
const float IN_K = ${f(IN_K)};

// Where the foot of the vortex stands on the film at time t (a slow Lissajous wander).
vec2 airFoot(float t) {
  return vec2(sin(t * 0.21) + 0.55 * sin(t * 0.47 + 1.7),
              cos(t * 0.17 + 0.6) + 0.55 * cos(t * 0.39 + 4.1)) * ${f(FOOT_AMP)};
}
float airKink(float t) { return t * ${f(KINK_SPEED)}; }

// Horizontal offset of the centre line at height y. foot = airFoot(t), kink = airKink(t).
// h (1 - h)^2 peaks at h = 1/3 with the value 4/27, hence the 6.75.
vec2 airAxis(float y, vec2 foot, float kink) {
  float h = clamp(y / AIR_H, 0.0, 1.0);
  float k = 1.0 - h;
  float ph = kink - h * ${f(KINK_TURN)};
  return foot * (k * k) + vec2(cos(ph), sin(ph)) * (h * k * k * 6.75 * ${f(KINK_AMP)});
}

// Radius of the funnel at height y: 0.36 m at the water, about 4 m where it has merged into
// the cloud. This is the radius the wind is organised around (the specks orbit at multiples
// of it); the visible wall follows it up to HORN_Y0, see airHorn.
float airRadius(float y) {
  float h = clamp(y / AIR_H, 0.0, 1.0);
  float h2 = h * h, h4 = h2 * h2;
  return 0.36 + 0.5 * h + 2.3 * h4 + 0.8 * h4 * h4 * h4;
}

// Radius of the condensation wall at height y: the funnel up to HORN_Y0, then a cone that
// keeps the lean the wall has there, flaring into the base of the cloud. slope = d radius / d y.
float airHorn(float y, out float slope) {
  float h = clamp(min(y, HORN_Y0) / AIR_H, 0.0, 1.0);
  float h3 = h * h * h;
  float lean = (0.5 + 9.2 * h3) / AIR_H;
  float bell = max(y - FLARE_Y, 0.0);
  slope = lean + 2.0 * FLARE_K * bell;
  return 0.36 + 0.5 * h + 2.3 * h3 * h + lean * max(y - HORN_Y0, 0.0) + FLARE_K * bell * bell;
}

// Turn accumulated by a parcel that has climbed to height y.
float airTwist(float y) {
  float h = clamp(y / AIR_H, 0.0, 1.15);
  return AIR_TWIST * (1.0 - exp(-AIR_TWIST_K * h));
}

// Length of the part of the ray q + L s (s > 0) that lies inside an upright cylinder of
// radius R around the axis. q is horizontal, L a unit 3D direction; the result is a 3D length.
float airChordCylinder(vec2 q, float R, vec3 L) {
  float a = dot(L.xz, L.xz) + 1e-4;
  float b = dot(q, L.xz);
  float c = dot(q, q) - R * R;
  float disc = b * b - a * c;
  if (disc <= 0.0) return 0.0;
  float s = sqrt(disc);
  return max((-b + s) / a, 0.0) - max((-b - s) / a, 0.0);
}

// Radius of the whole condensation body at height y: the horn, the base it widens into under
// the cloud, and the crown closing over it.
float airProfile(float y) {
  float slope;
  float r = mix(airHorn(min(y, CLOUD_FLOOR), slope), CLOUD_R, smoothstep(CLOUD_FLOOR - 0.85, CLOUD_FLOOR + 0.05, y));
  float over = max(y - CLOUD_SHOULDER, 0.0) / (CLOUD_TOP - CLOUD_SHOULDER);
  return r * sqrt(max(1.0 - over * over, 0.0));
}

// How much cloud lies between local point p (axis-relative offset q) and a distant point in
// direction L: the body is treated as a cylinder of its local radius, capped by the cloud top.
// Cheap enough for a vertex shader; the volume itself uses finer estimates.
float airChord(vec3 p, vec2 q, vec3 L) {
  float len = airChordCylinder(q, airProfile(p.y + L.y * 0.6), L);
  if (L.y > 0.0) len = min(len, max(CLOUD_TOP - p.y, 0.0) / L.y);
  return len;
}

// 1 where the ray from local point p along L goes through the disc that stands for the cloud
// as a shade (see SHADE_Y), 0 where it misses: the cloud's shadow on what is below it.
float airCapCover(vec3 p, vec3 L) {
  float s = (SHADE_Y - p.y) / (abs(L.y) > 1e-3 ? L.y : 1e-3);
  if (s <= 0.0) return 0.0;
  vec2 c = p.xz + L.xz * s;
  return 1.0 - smoothstep(0.42, 0.85, dot(c, c) / (SHADE_R * SHADE_R));
}

// 1 where the base of the cloud lies between local point p and something dist metres away
// in direction L, 0 where it does not: what the cloud hides.
float airCloudHides(vec3 p, vec3 L, float dist) {
  float s = (CLOUD_FLOOR + 0.3 - p.y) / (abs(L.y) > 1e-3 ? L.y : 1e-3);
  if (s <= 0.0 || s >= dist) return 0.0;
  vec2 c = p.xz + L.xz * s;
  return 1.0 - smoothstep(0.55, 1.0, dot(c, c) / (CLOUD_R * CLOUD_R));
}
`;

// ---------------------------------------------------------------- CPU mirrors of the GLSL above

/** Foot of the vortex on the film at time t, relative to the element origin. Writes out.x / out.y (= z). */
export function footAt(t, out) {
  out.x = (Math.sin(t * 0.21) + 0.55 * Math.sin(t * 0.47 + 1.7)) * FOOT_AMP;
  out.y = (Math.cos(t * 0.17 + 0.6) + 0.55 * Math.cos(t * 0.39 + 4.1)) * FOOT_AMP;
  return out;
}

/** Horizontal offset of the centre line at height y and time t. Writes out.x / out.y (= z). */
export function axisAt(y, t, out) {
  const h = Math.min(Math.max(y / FUNNEL_HEIGHT, 0), 1);
  const k = 1 - h;
  const ph = t * KINK_SPEED - h * KINK_TURN;
  const e = h * k * k * 6.75 * KINK_AMP;
  footAt(t, out);
  out.x = out.x * k * k + Math.cos(ph) * e;
  out.y = out.y * k * k + Math.sin(ph) * e;
  return out;
}

/** Radius of the condensation wall at height y (see airHorn). */
export function hornAt(y) {
  const h = Math.min(Math.max(Math.min(y, HORN_Y0) / FUNNEL_HEIGHT, 0), 1);
  const h3 = h * h * h;
  const bell = Math.max(y - FLARE_Y, 0);
  return 0.36 + 0.5 * h + 2.3 * h3 * h + (0.5 + 9.2 * h3) / FUNNEL_HEIGHT * Math.max(y - HORN_Y0, 0) + FLARE_K * bell * bell;
}

/** Largest horizontal distance the centre line can be from the element's vertical at height y. */
export function axisReach(y) {
  const h = Math.min(Math.max(y / FUNNEL_HEIGHT, 0), 1);
  const k = 1 - h;
  return 1.55 * Math.SQRT2 * FOOT_AMP * k * k + h * k * k * 6.75 * KINK_AMP;
}

/**
 * Upper bound of how far the centre line bows away from its chord over a stretch of height dy
 * starting at y (|second derivative| dy^2 / 8, see the helix in airAxis).
 */
export function axisSag(y, dy) {
  let worst = 0;
  const C = 6.75 * KINK_AMP, w = KINK_TURN / FUNNEL_HEIGHT, H = FUNNEL_HEIGHT;
  for (let i = 0; i <= 8; i++) {
    const h = Math.min((y + dy * i / 8) / H, 1), k = 1 - h;
    const e = C * h * k * k, e1 = Math.abs(C * k * (1 - 3 * h)) / H, e2 = Math.abs(C * (6 * h - 4)) / (H * H);
    worst = Math.max(worst, e2 + 2 * e1 * w + e * w * w + 2 * 1.55 * Math.SQRT2 * FOOT_AMP / (H * H));
  }
  return worst * dy * dy / 8;
}

/** Radius of the funnel at height y (see airRadius). */
export function radiusAt(y) {
  const h = Math.min(Math.max(y / FUNNEL_HEIGHT, 0), 1);
  const h4 = h * h * h * h;
  return 0.36 + 0.5 * h + 2.3 * h4 + 0.8 * h4 * h4 * h4;
}
