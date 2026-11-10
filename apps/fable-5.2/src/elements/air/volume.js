import * as THREE from 'three';
import { createVolumeMaterial, VOLUME_VERT } from '../../core/materials.js';
import { FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FLOW_GLSL, HORN_TOP, axisAt, radiusAt, hornAt, axisReach, axisSag } from './flow.js';
import { buildCloudField, CLOUD_GRID, CLOUD_MIN, CLOUD_SIZE, CLOUD_NEG, CLOUD_POS } from './cloud.js';

// The funnel, the storm cloud it hangs from and the spray skirt: one raymarched volume.
//
// Funnel   one horn, analytic: a tapering tube around the swaying centre line that runs on as
//          a cone into the base of the cloud. The shader works with its inside-distance in
//          metres, so a step can be as long as the vapour is far and short only in its skin.
//          Its detail is the baked noise, looked up in flow coordinates (see flow.js), so
//          every lump is carried round the funnel and up it by the helical wind.
// Cloud    a shape of its own, modelled once at start-up (cloud.js) and kept as a 3D texture
//          of inside-distances that turns with the disc: a flat base with a lowering around
//          the funnel, a crown of turrets crowded with billows, scud and torn streamers.
//          One fetch a step says how far away it is or how dense. The shader wears that
//          surface into finer billows with the baked noise, and joins funnel and cloud by a
//          smooth union, so that the one grows out of the other without a seam.
// Foot     a bowl of spray thrown up around the rope and a sheet of mist on the film, both
//          drawn along the streamlines of the same sink-with-swirl that carries the specks.
// Cost     (1) Bounds: the ray is clipped to a stack of sheared cylinders that follow the
//          centre line, and to the circles that hold the cloud at each height, so only pixels
//          that can hold vapour are marched and the march starts where the vapour does.
//          (2) The march finds out where the vapour is with one or two fetches a step.
//          (3) The funnel's light is worked out once per pixel, for the place the eye actually
//          sees. The cloud's is worked out at the few steps in its skin that the eye sees
//          most of, from a handful of further fetches of the same two textures.
// Light    sky ambient, the afterglow through a forward-scattering phase function, the moon,
//          both again as reflected by the film, the pyre and the element's own lightning.
//          The funnel is lit like a soft surface (wrapped diffuse, a silver lining where the
//          eye grazes it) and shadowed analytically by the rest of itself. In the cloud every
//          sample asks how much cloud each light has to cross to reach it: the field a short
//          way toward the afterglow and a short way up gives the slope of the surface in the
//          plane that all the lights of this scene lie close to, and with the depth of the
//          sample below the surface that is a chord through a billow. Blurred copies of the
//          field further out stand for the turrets in the light's way. So every billow has a
//          lit and a dark side, the creases between billows are dark, and whatever is thin
//          (a wisp, the edge of a head against the light) glows through.

// ---- constants shared by the shader and the bounds below ----
const SPRAY_R = 3.8;          // reach of the mist around the foot, m
const SPRAY_H = 1.6;          // height of the bowl of spray
const VEIL_REACH = 0.62;      // the sheath of thin vapour ends this many funnel radii outside the wall
const HORN_FADE = [8.5, 9.9]; // the funnel's own lumps and sheath fade out between these heights: above, the cloud's take over
const DISC_SPIN = 0.13;       // rad/s, turn rate of the cloud
const FRAY = 0.12;            // how deep the wind tears into the skin of the funnel's wall, in the units its lumps are measured in (R^(7/8) m)
const FRAY_OUT = 0.5;         // share of that by which the wall is first swollen, so that the funnel keeps its girth

// ---- bounds of the funnel ----
// Heights at which the stack of bounding cylinders is cut. Each slice leans the way the centre
// line does across it and is as wide as the widest vapour inside it.
const SLAB_Y = [0, 0.6, 1.6, 3.0, 4.4, 5.8, 7.2, 8.4, 9.4, HORN_TOP + 0.02];
const SLABS = SLAB_Y.length - 1;

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// Largest distance from the centre line at which the funnel or its spray can have vapour at
// height y. This mirrors the shader with every lump at its extreme.
function outerRadius(y) {
  let r = 0;
  if (y < 0.6) r = SPRAY_R;
  if (y < SPRAY_H) { const ys = Math.max(y, 1e-3); r = Math.max(r, 0.45 + ys ** 0.75 + 2 * (0.07 + 0.16 * ys)); }
  const R = radiusAt(y);
  const fade = 1 - smooth(HORN_FADE[0], HORN_FADE[1], y);
  const amp = 1.05 * (0.2 * 1.1 + FRAY * FRAY_OUT) * R ** 0.875 * fade;
  return Math.max(r, hornAt(y) * (1 + 0.07 * fade) + Math.max(amp, VEIL_REACH * R * fade));
}

const SLAB_R = [];
for (let i = 0; i < SLABS; i++) {
  const ya = SLAB_Y[i], dy = SLAB_Y[i + 1] - ya;
  let r = 0;
  for (let k = 0; k <= 16; k++) r = Math.max(r, outerRadius(ya + dy * k / 16));
  SLAB_R.push(r + axisSag(ya, dy) + 0.04);
}

// Above HORN_NARROW_Y all of the funnel's vapour lies within HORN_NARROW_R of the element's
// vertical, wherever the centre line sways.
const HORN_NARROW_Y = 8.2;
let HORN_NARROW_R = 0;
for (let y = HORN_NARROW_Y; y <= HORN_TOP + 0.05; y += 0.05) HORN_NARROW_R = Math.max(HORN_NARROW_R, outerRadius(y) + axisReach(y) + 0.1);

const f = (x) => Number(x).toFixed(5);
const list = (a) => a.map(f).join(', ');

// The fragment shader, for a cloud whose bounds are `bands` (see cloud.js).
const fragment = (bands) => /* glsl */ `
${FRAG_PRELUDE}
${FLOW_GLSL}

uniform vec3 uOrigin;      // world position of the element
uniform vec4 uBoltLo;      // lower end of the lightning channel, axis-relative; w = intensity
uniform vec3 uBoltHi;      // upper end
uniform vec2 uSlabAxis[${SLABS + 1}];   // the centre line at the heights SLAB_Y
uniform sampler3D uCloud;  // the cloud: r inside-distance, g share of wisp, see cloud.js
varying vec3 vWorldPos;

const int SLABS = ${SLABS};
const float SLAB_Y[${SLABS + 1}] = float[${SLABS + 1}](${list(SLAB_Y)});
const float SLAB_R[${SLABS}] = float[${SLABS}](${list(SLAB_R)});
// The cloud at each height: the circle that holds it, in its own turning frame.
const int BANDS = ${bands.length};
const float BAND_Y[${bands.length + 1}] = float[${bands.length + 1}](${list([...bands.map((b) => b.y0), bands[bands.length - 1].y1])});
const vec3 BAND_C[${bands.length}] = vec3[${bands.length}](${bands.map((b) => `vec3(${f(b.x)}, ${f(b.z)}, ${f(b.r)})`).join(', ')});

const float HORN_NARROW_Y = ${f(HORN_NARROW_Y)};
const float HORN_NARROW_R = ${f(HORN_NARROW_R)};
const float SPRAY_R = ${f(SPRAY_R)};
const float SPRAY_H = ${f(SPRAY_H)};
const float SPRAY_D = 2.4;        // extinction scale of the spray, 1/m
const float MIST_Q = 3.0;         // m^2/s: the spray is drawn in more slowly than the specks
const float VEIL_REACH = ${f(VEIL_REACH)};
const float DISC_SPIN = ${f(DISC_SPIN)};
const float STALL_Y = 8.85;       // the updraft begins to stall here, on its way into the cloud
const float CAP_STALL = 3.0;      // s/m added to the climb above that
const float NOISE_RATE = 0.06;    // noise periods per second of travel along the wind
const float STREAK_R = 0.42;      // radius of the striation cylinder in noise space
const float LIGHT_CORE = 0.14;    // how much of the funnel's core counts when light crosses it
// The cloud.
const vec3 CLOUD_MIN = vec3(${list(CLOUD_MIN)});
const vec3 CLOUD_INV = vec3(${list(CLOUD_SIZE.map((v) => 1 / v))});
const float CLOUD_NEG = ${f(CLOUD_NEG)};
const float CLOUD_RANGE = ${f(CLOUD_NEG + CLOUD_POS)};
const float CLOUD_ZERO = ${f(CLOUD_NEG / (CLOUD_NEG + CLOUD_POS))};       // what the texture holds at the surface
const float JOIN = 0.35;          // size of the fillet between funnel and cloud, m
const float SIGMA_CLOUD = 7.0;    // extinction of the cloud, 1/m: the eye stops within a hand's breadth of a billow's skin
const float SOFT_CLOUD = 0.1;     // width of the cloud's skin on its crown, m
const float SOFT_LOW = 0.14;      // down at its base
const float SOFT_WISP = 0.42;     // and of its wisps (scud, streamers), which are thinner than that: the eye sees through them
const float GRAIN = 0.21;         // noise periods per metre for the cloud's fine structure (its cells are 1.2 m and 0.4 m across)
const vec2 ERODE = vec2(0.16, 0.05);   // how deep that structure is worn into the modelled surface, m (coarse, fine)
const float TAP = 0.28;           // how far toward a light the cloud's field is read again, m
const float TAP_FINE = 0.14;      // and its fine structure
const float BILLOW = 0.9;         // radius of the billow a sample is taken to sit in, m
const float SIGMA_LIGHT = 3.8;    // extinction of the cloud for light on its way in, 1/m
const float FAR_SUN = 2.0;        // how far toward the afterglow the blurred field is first read, m (and again at 2.3 times that)
const float FAR_SKY = 1.5;        // and toward the moon and the sky
// How strongly each light is scattered toward the eye (artistic, in scene-linear radiance).
const float AMBIENT_GAIN = 0.5;
const float SUN_GAIN = 0.20;
const float MOON_GAIN = 0.16;
const float GLOW_GAIN = 0.13;     // the afterglow's reflection in the film
const float MOONUP_GAIN = 0.10;   // and the moon's
const float FIRE_GAIN = 0.5;
const float FLASH_GAIN = 2.6;     // lightning: the glow of a channel inside the funnel
const float FLASH_CLOUD = 5.3;    // the same light inside the cloud, where it is scattered far from the channel
const float FLASH_LAMP = 7.0;     // and what a channel some way off throws on the funnel's wall (falls off as 1 / (FLASH_LAMP_D2 + d^2))
const float FLASH_LAMP_D2 = 6.2;
const float FLASH_KNEE = 0.8;     // a stroke of intensity w lights the vapour as w / (1 + FLASH_KNEE w), see flashLevel
const float RELIEF = 0.55;        // how far the slope of a bump turns the funnel's surface toward or away from a light (a cosine per unit slope)
const float WRAP = 0.45;          // how far light creeps round the terminator of the funnel (a cosine)
const float SEEP = 0.14;          // share of the light that soaks through a body's skin whatever way it faces
const float LINING = 0.8;         // light let through by the thin edge of a body that stands against it, relative to its lit face
const float HAZE = 0.45;          // density of the outermost skin of the funnel's wall, relative to its depths
const float FRAY = ${f(FRAY)};
const float FRAY_OUT = ${f(FRAY_OUT)};
const vec3 ALBEDO = vec3(0.86, 0.91, 1.0);     // of the funnel's vapour (the cloud's light is used as it comes)
const vec3 FLASH_TINT = vec3(0.60, 0.74, 1.0);

// Henyey-Greenstein lobe scaled so that an isotropic scatterer returns 1.
float hg(float mu, float g) {
  float g2 = g * g;
  return (1.0 - g2) / pow(max(1.0 + g2 - 2.0 * g * mu, 1e-3), 1.5);
}

// Beer's law with a long tail: light that has been scattered several times gets further
// into a cloud than the single-scattering exponential allows.
float through(float opticalDepth) {
  return 0.88 * exp(-opticalDepth) + 0.12 * exp(-opticalDepth * 0.3);
}

// Light scattered back out of a dense body of vapour whose surface is lit at the cosine mu:
// a diffuse surface whose terminator is softened by wrap (light gets round the edge of a
// cloud), plus a share SEEP that soaks through whatever way the surface faces. Where the eye
// grazes the body and the light stands beyond it (edge = 1) it looks through its thin edge
// instead, which lets light through from behind: a lining, never brighter than the lit
// face. Thin vapour (body = 0) has no surface at all and simply returns 1.
float surfaceLit(float mu, float wrap, float edge, float body) {
  float m = saturate((mu + wrap) / (1.0 + wrap));
  float lit = SEEP + (1.0 - SEEP) * m * (0.5 + m * (1.5 - m));
  return mix(1.0, mix(lit, LINING, edge), body);
}

// How far a light in direction L stands beyond what the eye is looking at along rd (1) rather
// than behind the eye (0): only then does the edge of a body let it through.
float beyond(vec3 rd, vec3 L) { return smoothstep(-0.25, 0.6, dot(rd, L)); }

// How strongly a stroke of intensity w (lightning.js: about 3.5 at the peak of the first,
// under 1 while the continuing current lasts) lights the vapour around it. A stronger stroke
// fills the cloud with light rather than burning its core white, and the long tail of a
// strike stays worth looking at.
float flashLevel(float w) { return w / (1.0 + FLASH_KNEE * w); }

// The funnel's smooth body at one point.
struct Shape {
  vec2 q;           // offset from the centre line
  float ra;         // its length
  float R;          // radius the wind is organised around at this height
  float Rw;         // radius of the condensation wall
  float slope;      // d Rw / d y
  float cw;         // cosine of the wall's lean
  float rough;      // how rough this stretch of the wall is
  float fade;       // 1 on the funnel .. 0 where it has entered the cloud
  float field0;     // inside-distance, m (positive inside)
};

Shape shapeAt(vec3 p, vec2 foot, float kink) {
  Shape s;
  float y = p.y;
  s.q = p.xz - airAxis(y, foot, kink);
  s.ra = length(s.q);
  s.R = airRadius(y);
  s.Rw = airHorn(y, s.slope);
  s.fade = 1.0 - smoothstep(${f(HORN_FADE[0])}, ${f(HORN_FADE[1])}, y);
  // A slow swell climbs the funnel with the wind, and with it stretches where the wall is
  // rougher and stretches where it runs smooth.
  float climb = y / AIR_UPDRAFT - uTime;
  s.Rw *= 1.0 + 0.07 * sin(0.55 * climb + 2.0) * s.fade;
  s.rough = 0.8 + 0.3 * sin(0.8 * climb);
  s.cw = inversesqrt(1.0 + s.slope * s.slope);
  // (the horn ends inside the base of the cloud, where nobody sees how)
  s.field0 = min((s.Rw - s.ra) * s.cw, HORN_TOP - y);
  return s;
}

// Flow coordinates of a point on or near the funnel: where in the noise its parcel of air
// reads from. scale is noise periods per metre there, tauY the rate at which the time of
// flight grows with height.
void flowAt(Shape s, float y, out vec2 nq, out float nz, out float scale, out mat2 unwind, out float tauY) {
  float hN = saturate(y / AIR_H);
  // Outside the wall the pattern is wound into trailing logarithmic spiral arms (spiral, in
  // radians per e-fold of radius): differential rotation shears whatever is out there into
  // thin shells wrapped around the funnel. It also lags with distance from the wall (lag,
  // seconds per metre), which leans its layers inward the way a spiralling inflow would.
  float aloft = smoothstep(0.17, 0.7, hN);
  float spiral = mix(-2.5, -4.5, aloft);
  float lag = mix(-1.25, -2.0, aloft);
  float theta = airTwist(y) + spiral * log(max(s.ra / s.R, 1.0));
  // Time of flight from the water. The updraft stalls where it enters the cloud.
  float into = max(y - STALL_Y, 0.0);
  tauY = 1.0 / AIR_UPDRAFT + CAP_STALL * into * (into + 1.2) / sq(into + 0.6);
  float tau = y / AIR_UPDRAFT + CAP_STALL * into * into / (into + 0.6) + max(s.ra - s.R, 0.0) * lag;
  scale = 0.34 * sqrt(sqrt(sqrt(s.R))) / s.R;                // 0.34 R^(-7/8): eddies grow with the funnel
  unwind = rot2(-theta);
  nq = unwind * s.q * scale;
  nz = (tau - uTime) * NOISE_RATE;
}

// Metres of dense vapour between a point q on the funnel's wall and a far light in direction
// L: the chord through a tube with a thin wall and a core that light crosses easily, which
// leaves the far side of a thin rope glowing and of a thick trunk dark.
float bodyDepth(vec2 q, float Rw, float Rin, vec3 L) {
  float depth = airChordCylinder(q, Rw, L) - airChordCylinder(q, Rin, L) * (1.0 - LIGHT_CORE);
  // (a chord starts out of nothing at full tilt where the light first grazes the tube; eased
  // in, the shadow of the body on itself has a soft edge instead of a line)
  return depth * depth / (depth + 0.6 * Rw);
}

// The cloud's inside-distance in metres at a point of its texture.
float cloudField(vec3 uvw) { return textureLod(uCloud, uvw, 0.0).r * CLOUD_RANGE - CLOUD_NEG; }

// Metres of cloud that light has to cross to reach a sample that lies depth metres below the
// surface, when the outward slope of the field toward the light is mu (1: the light stands
// over the surface, -1: it is on the other side). The sample is taken to sit in a billow of
// radius BILLOW, and the answer is the way out of that sphere. It bends round smoothly at the
// terminator, and stays short for anything shallow that is seen against the light.
float chordOut(float depth, float mu) {
  float c = (BILLOW - depth) * mu;
  return sqrt(c * c + depth * (2.0 * BILLOW - depth)) - c;
}

void main() {
  vec3 ro = cameraPosition - uOrigin;
  vec3 rd = normalize(vWorldPos - cameraPosition);

  // ---- bounds: the stretch of the ray inside the stack of sheared cylinders ----
  float tNear = 1e9, tFar = -1e9;
  float invY = 1.0 / (abs(rd.y) > 1e-5 ? rd.y : 1e-5);
  for (int i = 0; i < SLABS; i++) {
    float ya = SLAB_Y[i], yb = SLAB_Y[i + 1];
    float ta = (ya - ro.y) * invY, tb = (yb - ro.y) * invY;
    float t0 = max(min(ta, tb), 0.0), t1 = max(ta, tb);
    if (t1 <= t0) continue;
    // In coordinates that slide sideways with the centre line the slice is an upright cylinder.
    vec2 lean = (uSlabAxis[i + 1] - uSlabAxis[i]) / (yb - ya);
    vec2 o = ro.xz - uSlabAxis[i] - lean * (ro.y - ya);
    vec2 d = rd.xz - lean * rd.y;
    float A = dot(d, d) + 1e-9, B = dot(o, d), C = dot(o, o) - SLAB_R[i] * SLAB_R[i];
    float disc = B * B - A * C;
    if (disc <= 0.0) continue;
    float root = sqrt(disc);
    t0 = max(t0, (-B - root) / A);
    t1 = min(t1, (-B + root) / A);
    if (t1 > t0) { tNear = min(tNear, t0); tFar = max(tFar, t1); }
  }
  // ---- and inside the circles that hold the cloud, in the frame that turns with it ----
  mat2 discTurn = rot2(-uTime * DISC_SPIN);
  vec2 roC = discTurn * ro.xz, rdC = discTurn * rd.xz;
  float rdC2 = dot(rdC, rdC) + 1e-9;
  bool meetsCloud = false;
  for (int i = 0; i < BANDS; i++) {
    float ta = (BAND_Y[i] - ro.y) * invY, tb = (BAND_Y[i + 1] - ro.y) * invY;
    float t0 = max(min(ta, tb), 0.0), t1 = max(ta, tb);
    if (t1 <= t0) continue;
    vec2 o = roC - BAND_C[i].xy;
    float B = dot(o, rdC), C = dot(o, o) - BAND_C[i].z * BAND_C[i].z;
    float disc = B * B - rdC2 * C;
    if (disc <= 0.0) continue;
    float root = sqrt(disc);
    t0 = max(t0, (-B - root) / rdC2);
    t1 = min(t1, (-B + root) / rdC2);
    if (t1 > t0) { tNear = min(tNear, t0); tFar = max(tFar, t1); meetsCloud = true; }
  }
  tFar = min(tFar, sceneRayDistance(screenUV(), rd));
  if (tFar <= tNear) discard;

  bool mirror = uIsMirrorPass > 0.5;
  // (the reflection is half the size, blurred and bent by ripples: it gets by on less again)
  float quality = clamp(uQuality, 0.3, 1.3) * (mirror ? 0.8 : 1.0);
  // (a ray that has to find the cloud and then skims its rough skin needs more steps than one
  // through the funnel)
  int maxSteps = meetsCloud ? max(int(56.0 * quality), mirror ? 18 : 20) : max(int(40.0 * quality), 12);
  // Dither for the march: interleaved gradient noise, moved on by the golden ratio each frame
  // so that the eye averages away what the trapezoid rule below leaves of the stepping.
  float dither = fract(ign(floor(gl_FragCoord.xy)) + mod(uFrame, 256.0) * 0.61803);

  vec2 foot = airFoot(uTime);
  float kink = airKink(uTime);
  // The sheath of thin vapour around the funnel is too faint to see from far away: it is left
  // out there, and in the reflection.
  float veilReach = mirror ? 0.0 : VEIL_REACH * smoothstep(33.0, 26.0, length(ro.xz));
  // So are the frayed, hazy skin of its wall and the streamers torn from it: from far away
  // the wall is firm, which is all the pixels can show of it, and costs fewer steps.
  float ragged = mirror ? 0.0 : smoothstep(32.0, 22.0, length(ro.xz));
  // Angle subtended by one pixel of this buffer: sets the mip level of the noise.
  float pixelAngle = 2.0 * uProjectionMatrixInverse[1][1] / uResolution.y;

  // ---- the lights ----
  vec3 sunDir = normalize(uSunDir);
  vec3 moonDir = normalize(uMoonDir);
  float muSun = dot(rd, sunDir);
  float muMoon = dot(rd, moonDir);
  // The afterglow is a broad band of sky, not a point, so its lobe is a wide one.
  float phaseSun = 0.85 * hg(muSun, 0.35) + 0.15 * hg(muSun, -0.2);
  float phaseMoon = 0.6 * hg(muMoon, 0.45) + 0.4 * hg(muMoon, -0.25);
  // uSunDir points just below the horizon, but what lights the scene from there is the band of
  // afterglow above it: surfaces are lit as from a little way up the sky.
  vec3 sunLit = normalize(vec3(sunDir.x, max(sunDir.y, 0.1), sunDir.z));
  // The film is a mirror, so the afterglow also arrives from below the horizon: it is what
  // warms the underside of the cloud and picks out the billows that hang from it.
  vec3 glowDir = normalize(vec3(sunDir.x, -0.3, sunDir.z));
  float muGlow = dot(rd, glowDir);
  float phaseGlow = 0.85 * hg(muGlow, 0.3) + 0.15 * hg(muGlow, -0.2);
  // The film also throws a little of the moon back up.
  vec3 moonUp = vec3(moonDir.x, -moonDir.y, moonDir.z);
  float muUp = dot(rd, moonUp);
  float phaseUp = 0.6 * hg(muUp, 0.45) + 0.4 * hg(muUp, -0.25);
  // (vapour is white: it takes the colour of the afterglow, but the eye expects a cloud at dusk
  // to be peach and gold rather than the orange of lit stone)
  vec3 sunColor = mix(uSunColor, vec3(dot(uSunColor, vec3(0.33))), 0.22);
  // (and the cloud, which is lit by the whole band of afterglow, paler still)
  vec3 sunCloud = mix(uSunColor, vec3(dot(uSunColor, vec3(0.33))), 0.34) * 1.2;

  // ---- the cloud's frame ----
  // The ray in the cloud's texture, and the two places near a sample where its field is read
  // again: a short way toward the afterglow (level) and a short way up. Every light of the
  // scene lies close to the upright plane through the afterglow, so each is a mix of the two.
  vec3 roT = (vec3(roC.x, ro.y, roC.y) - CLOUD_MIN) * CLOUD_INV;
  vec3 rdT = vec3(rdC.x, rd.y, rdC.y) * CLOUD_INV;
  vec2 level = normalize(sunDir.xz);
  vec2 levelC = discTurn * level;
  vec3 tapSun = vec3(levelC.x, 0.0, levelC.y) * CLOUD_INV * TAP;
  vec3 tapUp = vec3(0.0, CLOUD_INV.y * TAP, 0.0);
  // (and the same two for the fine structure, in the noise)
  vec3 fineSun = vec3(levelC.x, 0.0, levelC.y) * (GRAIN * TAP_FINE);
  vec3 fineUp = vec3(0.0, GRAIN * TAP_FINE, 0.0);
  // (the crown stands high: it catches the band of afterglow from further up than the funnel does)
  vec2 kSun = normalize(vec2(1.0, 0.14));
  vec2 kGlow = vec2(dot(glowDir.xz, level), glowDir.y);
  vec2 kMoon = vec2(dot(moonDir.xz, level), moonDir.y);
  vec2 kMoonUp = vec2(kMoon.x, -kMoon.y);
  vec3 coneSun = vec3(levelC.x * kSun.x, kSun.y, levelC.y * kSun.x) * CLOUD_INV * FAR_SUN;
  vec2 moonC = discTurn * moonDir.xz;
  vec3 coneSky = normalize(vec3(moonC.x, moonDir.y + 0.6, moonC.y)) * CLOUD_INV * FAR_SKY;

  // ---- the march: where is the vapour, and how much of it ----
  // The integral is taken by the trapezoid rule between one sample and the next, which costs
  // nothing and puts the surface where it is rather than at the nearest step.
  float trans = 1.0;
  float sumW = 0.0, sumT = 0.0, sumSkin = 0.0, sumDens = 0.0, sumSpray = 0.0;
  vec3 sumN = vec3(0.0);
  vec3 cloudCol = vec3(0.0);                  // light scattered toward the eye by the cloud
  float cloudA = 0.0;                         // and the cloud's share of the opacity
  float t = tNear + 0.02 + 0.08 * dither;
  float tPrev = tNear, yPrev = ro.y + rd.y * tNear;
  float sigmaPrev = 0.0, skinPrev = 1.0, densPrev = 0.0, sprayPrev = 0.0, sharePrev = 0.0;
  vec3 litPrev = vec3(0.0);
  float tLast = tNear, fieldLast = -1.0;      // the last place looked at, and how far inside the vapour it was
  bool locked = false;                        // true while the samples sit at fixed depths below a surface
  int seek = 0;                               // short steps left to find a surface that was aimed at and missed
  bool entered = false;                       // true while the ray is inside one body of cloud
  float farSun = 0.0, farSky = 0.0;           // what stands between that body and the lights, further out

  for (int i = 0; i < maxSteps; i++) {
    if (t >= tFar) break;
    vec3 p = ro + rd * t;
    float y = p.y;
    // Width of a skin. Nothing is gained by one thinner than the pixels that look at it:
    // from far away it is as wide as two of them, which lets the march take longer steps too.
    float pixel = t * pixelAngle;
    // The finest step is a fraction of the skin, longer from far away and in the cheaper passes.
    float stepScale = (1.0 + 0.03 * max(t - 12.0, 0.0)) / quality;
    // Whatever happens, never step shorter than it takes to reach the far end with the steps
    // that are left once half of them are spent: a long ray then gets coarser instead of
    // being cut off part-way.
    float progress = float(i) / float(maxSteps);
    float reachEnd = (tFar - t) / float(maxSteps - i) * smoothstep(0.45, 0.85, progress);

    // ---- empty space: conservative distance to the nearest place that can hold vapour ----
    Shape s;
    float r8 = 1.0, r875 = 1.0, amp = 0.0, fray = 0.0, softF = 0.1, veilR = 0.0, ringR = 1.0, ringW = 0.1;
    float dHorn = 1e3, dSpray = 1e3, dCloud = 1e3;
    // (up among the cloud the funnel is only looked at where it can be, near the vertical;
    // anywhere else it is at least as far away as that upright cylinder is)
    float r2 = dot(p.xz, p.xz);
    bool inHorn = y < HORN_TOP && (y < HORN_NARROW_Y || r2 < HORN_NARROW_R * HORN_NARROW_R);
    if (!inHorn && y < HORN_TOP + 1.0) dHorn = max(y - HORN_TOP, sqrt(r2) - HORN_NARROW_R) + 0.02;
    if (inHorn) {
      s = shapeAt(p, foot, kink);
      r8 = inversesqrt(sqrt(sqrt(s.R)));                     // R^(-1/8)
      r875 = s.R * r8;                                       // R^(7/8): eddies grow with the funnel
      amp = 0.2 * r875 * s.rough * s.fade;                   // the noise moves the surface this far
      fray = FRAY * r875 * s.fade * ragged;                  // and the wind tears this deep into it
      softF = max(max(0.11 * r875, 0.05), 2.0 * pixel);
      veilR = veilReach * s.R * s.fade;
      dHorn = (-s.field0 - 1.05 * (amp + FRAY_OUT * fray) - veilR) * 0.8;
      // The spray: a bowl thrown up and out around the rope, and a film of mist further out.
      float ys = clamp(y, 1e-3, SPRAY_H);
      ringR = 0.45 + sqrt(ys) * sqrt(sqrt(ys));              // the wall of the bowl
      ringW = 0.07 + 0.16 * ys;
      dSpray = min(max((s.ra - ringR - 2.0 * ringW) * 0.5, y - SPRAY_H), max(s.ra - SPRAY_R, y - 0.6));
    }
    float fCloud = -1.0, softC = 0.2, worn = 0.0, wear = 0.0, lodG = 0.0, wisp = 0.0, near = 1.0;
    // (from far away the cloud's steps lengthen a little faster than the funnel's: its skin is as wide as the pixels by then)
    float stepC = stepScale + 0.012 * max(t - 20.0, 0.0) / quality;
    vec3 pT = roT + rdT * t, pG = vec3(0.0);
    bool inCloud = y > BAND_Y[0];
    if (inCloud) {
      vec2 cell = textureLod(uCloud, pT, 0.0).rg;
      fCloud = cell.r * CLOUD_RANGE - CLOUD_NEG;
      wisp = cell.g;                                          // scud and streamers: soft, thin, ragged
      vec2 hC = roC + rdC * t;
      float low = smoothstep(11.2, 10.2, y);
      softC = max(mix(mix(SOFT_CLOUD, SOFT_LOW, low), SOFT_WISP, wisp), 2.0 * pixel);
      float hFineC = max(0.4 * softC, 0.02) * stepC;
      // (its field is a true distance: one stride lands just short of the surface, and within
      // a fraction of a fine step of it the cloud is looked at properly)
      dCloud = -0.96 * fCloud - 0.35 * hFineC;
      // Where the field says no more than "far", a coarse copy of it says how far: if that
      // is empty too, there is no cloud within a third of a metre of here, nor within the
      // field's own reach of that.
      if (fCloud < 0.01 - CLOUD_NEG && textureLod(uCloud, pT, 3.0).r <= 0.0) dCloud = 0.45;
      // The modelled surface is worn into finer billows by the baked noise: cells whose
      // borders are creases. That only ever takes cloud away, so the distances above stay safe.
      // (Not in the reflection, which is small, blurred and bent by ripples.)
      if (fCloud > 0.0 && !mirror) {
        // (nothing finer than the march can step through, or it turns to grit along every limb)
        lodG = clamp(log2(max(pixel * 4.0, hFineC * 1.5) * 128.0 * GRAIN), 0.0, 4.0);
        pG = vec3(hC.x, y - uTime * 0.02, hC.y) * GRAIN + vec3(0.37, 0.11, 0.71);
        // Under the base, and in the wisps, it is worn further: ragged, where the crown is firm.
        // And a ray that has spent most of its steps skimming through the worn skin sees less
        // and less of it: the surface as modelled is always found at once.
        wear = (1.0 + (0.9 - 0.6 * wisp) * smoothstep(10.5, 10.0, y) + 0.3 * wisp) * (1.0 - smoothstep(0.55, 0.8, progress));
        // (from close by the finest cells are worn in deeper: there is nothing else that fine to see)
        near = 1.0 + smoothstep(18.0, 8.0, t);
        worn = dot(ERODE * vec2(1.0, near), 1.0 - noiseTexLod(pG, lodG).ga) * wear;
        fCloud -= worn;
      }
    }
    float dEmpty = min(min(dHorn, dSpray), dCloud);

    float sigma = 0.0, skin = 1.0, dens = 0.0, spray = 0.0, sheetTau = 0.0, dt = 0.0, share = 0.0;
    vec3 facing = vec3(0.0), lit = vec3(0.0);
    float seg = t - tPrev;
    if (dEmpty <= 0.0) {
      float soft = softC, sigmaBody = SIGMA_CLOUD, inner = 1.0, thin = 0.0, fieldF = -1e3;
      bool inSpray = false, inVeil = false;
      float sOut = 0.0;
      if (min(dHorn, dSpray) <= 0.0) {
        // ---- the funnel's noise: one pattern for each kind of place ----
        //   spray       streamlines of the sink that feeds the foot: each point is labelled with
        //               the spiral it lies on and the moment its water reaches the rope
        //   funnel      flow coordinates
        inSpray = dSpray < 0.0;
        bool sprayNoise = inSpray && s.ra > 1.3 * s.R;
        float hFineF = max(0.4 * softF, 0.02) * stepScale;
        // The mip level follows the size of a pixel out there and of that step, and nothing else.
        // It must not depend on how the march got here, or the surface would be in a different
        // place for every ray. Nor may it keep detail finer than the march can step over, or that
        // detail is found by one pixel and missed by the next, and turns to grain.
        float grain = max(pixel * 1.4, hFineF * 1.5) * 128.0;              // in texels per noise period
        vec4 nf = vec4(0.5);
        float lump = 0.5;
        if (sprayNoise) {
          float rb = s.ra + IN_B;
          vec2 e = rot2(IN_K * log(rb) - 2.4 * y) * (s.q / s.ra);
          float arrive = uTime + (rb * rb - IN_B * IN_B) / (2.0 * MIST_Q) - y / 1.6;
          nf = noiseTexLod(vec3(e * 0.25, arrive * 0.12), 1.3);
          lump = saturate((nf.r - 0.5) * 2.6 + 0.5);
        } else {
          vec2 nq; float nz, scale, tauY; mat2 unwind;
          flowAt(s, y, nq, nz, scale, unwind, tauY);
          nf = noiseTexLod(vec3(nq, nz), clamp(log2(grain * scale), 0.0, 4.0));
          lump = saturate((nf.r - 0.5) * 2.4 + 0.5);
        }
        // ---- the displaced surface: the lumps the wind carries ----
        fieldF = s.field0 + amp * (lump - 0.5) * 2.0;
        // The wind frays the skin of the wall: streamers a hand's breadth across are torn out
        // of it and drawn along with the flow, so its outline is ragged rather than turned on
        // a lathe. (The wall is swollen first by half of what that takes away on average, so
        // the funnel is as stout as its radius says.)
        fieldF += fray * (FRAY_OUT - (sprayNoise ? 0.5 : smoothstep(0.34, 0.74, nf.b * 0.6 + nf.a * 0.4)));
        inner = 0.55 + 0.9 * lump;                                            // inner structure
        // Thin shells of vapour are dragged around outside the wall: the layer the eye reads depth
        // from. Near the water they thicken into the spray that climbs the rope.
        sOut = (s.ra - s.Rw) / s.R;                                           // funnel radii outside the wall
        inVeil = veilR > 0.0 && sOut > -0.2 && sOut < veilReach;
        if (inVeil) {
          float shells = smoothstep(0.38, 0.78, lump * 0.85 + nf.b * 0.15);
          thin = 0.09 * exp(-max(sOut, 0.0) * 3.5) * smoothstep(veilReach, 0.55 * veilReach, sOut) * shells
               * s.fade * (1.0 + 2.5 * exp(-y / 0.7));
        }
        // ---- touchdown: spray torn off the film, drawn in along the spiral streamlines of the
        // sink and lifted where they close on the rope ----
        if (inSpray) {
          float fil = nf.b * 0.6 + nf.a * 0.4;
          float fray = 0.4 + 0.6 * smoothstep(0.38, 0.66, fil);
          // The wall of the bowl is combed into helical streaks and torn off at a different height
          // on every spiral arm; inside it hangs a little mist, and a thin sheet of mist lies on
          // the film all around.
          float x = (s.ra - ringR) / ringW;
          float top = SPRAY_H * (0.35 + 0.65 * lump);
          float curtain = sq(sq(max(1.0 - x * x * 0.25, 0.0))) * (1.0 - smoothstep(0.4 * top, top, y))
                        * (0.4 + 0.6 * smoothstep(0.4, 0.62, fil));
          float mound = 0.4 * smoothstep(0.5, -1.5, x) * exp(-y / 0.45);
          spray = SPRAY_D * (1.2 * curtain + mound) * fray;
          // (The sheet is thinner than a step: use its exact mean over the stretch just crossed.)
          float ya = max(yPrev, 0.0), yb = max(y, 0.0);
          float mean = abs(yb - ya) > 1e-3 ? 0.16 * abs(exp(-ya / 0.16) - exp(-yb / 0.16)) / abs(yb - ya) : exp(-ya / 0.16);
          float sheet = mean * 0.3 * exp(-s.ra / 1.8) * (1.0 - smoothstep(2.6, SPRAY_R, s.ra)) * (0.25 + 0.75 * smoothstep(0.3, 0.72, lump));
          sheetTau = SPRAY_D * sheet * fray * seg;
        }
      }
      // ---- funnel and cloud, joined ----
      // (share: how much of what is here is cloud)
      // (where the cloud's field knows of no cloud nearby there is none to join)
      bool joined = fCloud > 0.005 - CLOUD_NEG - worn;
      share = joined ? saturate(0.5 + 0.5 * (fCloud - fieldF) / JOIN) : 0.0;
      float field = joined ? mix(fieldF, fCloud, share) + JOIN * share * (1.0 - share) : fieldF;
      if (share > 0.0) {
        soft = mix(softF, softC, share);
        // Dense enough that the eye stops within a fraction of a billow, or the billows blur away.
        sigmaBody = mix(5.0 * r8 * r8 * r8, SIGMA_CLOUD * (1.0 - 0.45 * wisp), share);     // (R^(-3/8) on the funnel)
        inner = mix(inner, 1.0, share);
      } else {
        soft = softF;
        sigmaBody = 5.0 * r8 * r8 * r8;
      }
      float hFine = max(0.4 * soft, 0.02) * mix(stepScale, stepC, share);

      // ---- density ----
      // The cloud is firm right up to its surface. The funnel's wall is not: its outermost
      // skin is haze that thickens inward, so the eye sees a little way into it, and through
      // its limb to whatever is behind.
      float deep = smoothstep(soft, 3.0 * soft, field);
      float hazy = inHorn ? s.fade * (1.0 - share) * ragged : 0.0;
      dens = smoothstep(0.0, soft, field) * inner * (1.0 - hazy * (1.0 - HAZE) * (1.0 - deep));
      sigma = max(dens, thin) * sigmaBody + spray;

      // ---- next step: as far as the surface is away, short inside its skin, longer once past it ----
      // A step that has carried the ray from clear air to inside the vapour has crossed its
      // surface somewhere on the way. Go back to where (by linear interpolation) and come in
      // again from there: every pixel then samples the skin at the same depths below the
      // surface, and what it finds there no longer depends on the dither.
      if (!locked && !mirror && field > 0.0 && fieldLast < 0.0 && progress < 0.8) {
        float tCross = max(mix(tLast, t, fieldLast / (fieldLast - field)), tLast + 0.004);
        // (clear air up to there: the stretch that is added next begins at the surface, not
        // at wherever the last step happened to land)
        if (sigmaPrev <= 0.0) tPrev = tCross;
        t = tCross + 0.3 * hFine;
        locked = true;
        seek = 3;
        continue;
      }
      // (the worn skin is rough: where the surface turns out to lie a little further on than
      // the straight line said, it is felt for in a few short steps rather than aimed at again)
      if (field >= 0.0) seek = 0; else if (seek > 0) seek--; else locked = false;
      fieldLast = field;
      skin = 1.0 - deep;
      if (inHorn) {
        // Which way the funnel's wall faces here.
        vec2 qh = s.q / max(s.ra, 1e-3);
        facing = s.cw * vec3(qh.x, -s.slope, qh.y);
      }
      // (The cloud's field is a true distance, the funnel's displaced one is not. Where the cloud
      // has been worn away the step may overshoot a little: the surface is then found by going
      // back, as above, and features finer than a couple of steps do not matter there.)
      // (and the cloud is dense: past its skin the eye sees little, so there the steps lengthen sooner)
      float grow = mix(deep, smoothstep(0.8 * soft, 1.8 * soft, field), share);
      dt = field < 0.0 ? (seek > 0 ? 0.5 * hFine : max(hFine * (worn > 0.0 ? 1.6 : 1.0), -mix(0.4, 0.9, share) * field)) : hFine * (1.0 + 4.0 * grow);
      // (what little is still seen behind that takes the light of the sample before it, see below)
      if (share > 0.5 && trans < 0.15) dt *= 2.5;
      // (a ray that runs along the sheath sees it change slowly and may step further than one that pierces it)
      if (inVeil && sOut > 0.0) dt = min(dt, max(s.R * mix(0.45, 0.2, abs(dot(s.q, rd.xz)) / (s.ra * length(rd.xz) + 1e-4)), 0.04) * stepScale);
      if (thin > 0.0 && field < 0.0) dt = min(dt, 0.5 * stepScale);
      if (inSpray) dt = min(dt, (abs(s.ra - ringR) < 2.0 * ringW ? max(0.6 * ringW, 0.06) : clamp(0.1 + 0.14 * s.ra, 0.12, 0.5)) * stepScale);
      dt *= 1.0 + 2.0 * smoothstep(0.75, 1.0, progress);
      // Outside the vapour every step is a little longer or shorter than the last, so its error
      // does not add up along the ray.
      // (not in the cloud: its skin is rough, and uneven steps would show there as grit)
      if (!locked && share < 0.5) dt *= 0.9 + 0.2 * fract(dither + float(i) * 0.61803);
      dt = max(dt, reachEnd);

      // ---- the cloud's light, here ----
      // (what the eye hardly sees any more takes the light of the sample before it)
      if (share > 0.004 && dens > 0.0 && (trans > 0.15 || !entered)) {
        float depth = clamp(fCloud, 0.0, 0.8 * BILLOW);
        // Slope of the field toward the afterglow and upward (metres per metre, about -1 .. 1):
        // of the surface as modelled, and of the finer billows worn into it.
        // (a tap that falls outside what the field stores has left the cloud: full slope)
        float model = fCloud + worn;
        vec2 slope = (vec2(cloudField(pT + tapSun), cloudField(pT + tapUp)) - model) / max(min(TAP, model + CLOUD_NEG), 0.05);
        // (the latter only from near enough for the pixels to show it)
        float fine = wear * smoothstep(2.5, 2.1, lodG);
        if (fine > 0.0) {
          vec2 erode = ERODE * vec2(1.0, near);
          vec2 wornThere = vec2(dot(erode, 1.0 - noiseTexLod(pG + fineSun, lodG).ga), dot(erode, 1.0 - noiseTexLod(pG + fineUp, lodG).ga)) * wear;
          slope -= (wornThere - worn) / TAP_FINE * smoothstep(2.5, 2.1, lodG);
        }
        // The blurred field further out: is there a turret in the light's way? It changes
        // slowly, so it is read once for each body of cloud the ray enters.
        if (!entered) {
          entered = true;
          farSun = 3.2 * smoothstep(CLOUD_ZERO - 0.1, CLOUD_ZERO + 0.28, textureLod(uCloud, pT + coneSun, 3.0).r);
          farSky = smoothstep(CLOUD_ZERO - 0.1, CLOUD_ZERO + 0.28, textureLod(uCloud, pT + coneSky, 3.0).r);
          if (!mirror) farSun += 3.5 * smoothstep(0.1, 0.42, textureLod(uCloud, pT + coneSun * 2.3, 4.0).r);
        }
        // A crease between billows has more cloud around it than a point on a billow has.
        float crease = 1.0;
        if (!mirror) {
          float buried = textureLod(uCloud, pT, 2.0).r - (model + CLOUD_NEG) / CLOUD_RANGE;
          crease = (1.0 - 0.9 * smoothstep(-0.02, 0.17, buried)) * (1.0 - 0.35 * smoothstep(0.06, 0.24, worn));
        }
        float muSunC = -dot(kSun, slope), muGlowC = -dot(kGlow, slope);
        // (the afterglow goes out quickly inside the cloud: what is left in its shadow is the sky's blue)
        float tauSun = SIGMA_LIGHT * chordOut(depth, muSunC) + farSun;
        float tSun = 0.94 * exp(-tauSun) + 0.06 * exp(-0.35 * tauSun);
        // (its mirror image in the film comes from below the horizon: nothing of the cloud is in its way but the billow itself)
        float tGlow = through(SIGMA_LIGHT * chordOut(depth, muGlowC));
        float tMoon = through(SIGMA_LIGHT * chordOut(depth, -dot(kMoon, slope)) + 2.4 * farSky);
        float tMoonUp = through(SIGMA_LIGHT * chordOut(depth, -dot(kMoonUp, slope)));
        // Sky light comes from everywhere above, the film's from everywhere below: what a
        // sample gets of each goes by how its surface is turned, how deep it lies and how
        // much stands over it.
        float open = through(SIGMA_LIGHT * depth) * crease;
        vec3 ambient = mix(vec3(0.018, 0.028, 0.055), vec3(0.036, 0.062, 0.135) * (1.0 - 0.85 * farSky), saturate(0.5 - 0.5 * slope.y)) * open;
        // (the afterglow is a broad band: part of it arrives as from a wide lamp)
        float wide = saturate(0.5 + 0.5 * muSunC), wideGlow = saturate(0.5 + 0.5 * muGlowC);
        float direct = 0.25 + 0.75 * crease;
        // Thin vapour throws light on the way it was going; a dense body has scattered it so
        // often that it comes out much the same in every direction.
        float solid = smoothstep(0.1, 0.7, dens);
        lit = ambient * 0.8;
        // Lit from behind the eye, the outermost skin of a cloud sends little back (the light
        // goes on into it): limbs are dull then, not outlined. Against the light they shine.
        float powder = 1.0 - 0.8 * exp(-11.0 * depth);
        float powderSun = mix(powder, 1.0, smoothstep(0.0, 0.8, muSun));
        float powderMoon = mix(powder, 1.0, smoothstep(0.0, 0.8, muMoon));
        lit += sunCloud * (((0.44 * mix(min(phaseSun, 2.0), 0.9, solid) + 0.4 * wide * sqrt(wide)) * tSun * powderSun
                          + (0.1 * mix(phaseGlow, 0.9, solid) + 0.2 * wideGlow * wideGlow) * tGlow) * direct);
        lit += uMoonColor * ((0.36 * mix(phaseMoon, 0.9, solid) * tMoon * powderMoon + 0.05 * phaseUp * tMoonUp) * direct);
        // The pyre: from below and from one side.
        vec3 toFire = uFireLightPos - uOrigin - p;
        float fd2 = dot(toFire, toFire);
        vec3 fireDir = toFire * inversesqrt(max(fd2, 1e-3));
        // (it stands to one side of the plane of the other lights: which way a flank is turned
        // to it is told by where on the cloud the flank is)
        float muFire = -fireDir.y * slope.y + dot(fireDir.xz, p.xz) / (length(p.xz) + 1.0);
        lit += uFireLightColor / (1.0 + fd2) * (0.2 * direct * through(SIGMA_LIGHT * chordOut(depth, muFire)));
        // Lightning: a line of light inside the cloud. Scattered over and over it spreads
        // through the whole body, thinning out with distance and with the vapour it crosses,
        // so the cloud glows from within, brightest round the channel.
        if (uBoltLo.w > 0.001) {
          vec3 ab = uBoltHi - uBoltLo.xyz;
          vec3 ap = p - uBoltLo.xyz;
          vec3 off = ap - ab * clamp(dot(ap, ab) / max(dot(ab, ab), 1e-3), 0.0, 1.0);
          float d2 = dot(off, off);
          // (the creases lie nearer the light than the billows round them: they glow, the billows stand dark against them)
          float inner = mirror ? 0.9 : mix(1.45, 0.6, crease);
          lit += FLASH_TINT * flashLevel(uBoltLo.w) * inner * (FLASH_CLOUD / (2.0 + d2 * 0.35))
               * through(0.25 * sqrt(d2) + 1.5 * (0.8 * BILLOW - depth));
        }
      } else lit = litPrev;
      if (field < 0.0) entered = false;
    } else {
      fieldLast = min(max(inHorn ? s.field0 : -1.0, fCloud), -0.05);
      locked = false;
      seek = 0;
      entered = false;
    }
    tLast = t;

    // ---- add the stretch since the last sample to the integral ----
    float tau = 0.5 * (sigmaPrev + sigma) * seg + sheetTau;
    if (tau > 1e-5) {
      float a = 1.0 - exp(-tau);
      // where in the stretch its vapour is centred, for density running linearly from one end to the other
      float c = (sigmaPrev + 2.0 * sigma + 1e-4) / (3.0 * (sigmaPrev + sigma) + 2e-4);
      // The cloud's share of the stretch takes the light worked out at its ends (at the one
      // that has vapour, where the other lies in clear air).
      float seen = trans * a;
      // (of a long stretch of dense cloud the eye sees mostly the near end)
      float e = sigma <= 0.0 ? 0.0 : sigmaPrev <= 0.0 ? 1.0 : c * (tau > 0.02 ? 2.0 * (1.0 / tau - (1.0 - a) / a) : 1.0);
      float cloudy = mix(sharePrev, share, e);
      cloudCol += seen * cloudy * mix(litPrev, lit, e);
      cloudA += seen * cloudy;
      // What the funnel's light will need to know about this stretch is weighted by how much
      // the eye sees of it and by how dense it is: where thin vapour hangs in front of a body,
      // it is the body that is lit.
      float w = seen * (1.0 - cloudy) * (sigmaPrev + sigma + 1e-3);
      sumW += w;
      sumT += w * (tPrev + seg * c);
      sumSkin += w * mix(skinPrev, skin, c);
      // (the way a body faces is told by its skin: deep inside, the nearest surface may be the far one)
      sumN += w * (0.15 + skin) * facing;
      sumDens += w * mix(densPrev, dens, c);
      sumSpray += w * (mix(sprayPrev, spray, c) + sheetTau / max(seg, 1e-3));
      trans *= 1.0 - a;
      if (trans < 0.04) { trans = 0.0; break; }
    }

    if (dEmpty > 0.0) {
      // Skip, and land at a dithered depth or the step pattern shows as rings.
      float land = inHorn ? clamp(0.3 * s.R, 0.06, 0.3) * (0.35 + 0.3 * dither) * (1.0 + 0.012 * t) : 0.0;
      t += max(max(dEmpty, 0.03 + 1.2 * progress * progress), reachEnd) + land;
      tPrev = t - land;                                    // (the vapour begins somewhere in that last stretch)
      sigmaPrev = 0.0; skinPrev = 1.0; densPrev = 0.0; sprayPrev = 0.0; sharePrev = 0.0; litPrev = vec3(0.0);
    } else {
      tPrev = t;
      sigmaPrev = sigma; skinPrev = skin; densPrev = dens; sprayPrev = spray; sharePrev = share; litPrev = lit;
      t += dt;
    }
    yPrev = ro.y + rd.y * tPrev;
  }

  float alpha = 1.0 - trans;
  if (alpha < 0.002) discard;
  vec3 colour = cloudCol;

  // ---- the funnel's light, once, at the depth the eye sees ----
  float alphaF = alpha - cloudA;
  if (alphaF > 0.002 && sumW > 0.0) {
    float tm = sumT / sumW;
    float skinM = sumSkin / sumW;                           // share of what the eye sees that is the outer skin of the vapour
    float densM = sumDens / sumW;
    float sprayM = sumSpray / sumW;
    vec3 p = ro + rd * tm;
    float y = p.y;
    Shape s = shapeAt(p, foot, kink);
    float r8 = inversesqrt(sqrt(sqrt(s.R)));
    float r875 = s.R * r8;
    float amp = 0.2 * r875 * s.rough * s.fade;
    float soft = max(max(0.11 * r875, 0.05), 2.0 * tm * pixelAngle);
    float sigmaBody = 5.0 * r8 * r8 * r8;
    // How far what is seen is a body with a surface, shadowing itself, rather than thin vapour
    // lit all the way through: dense vapour is, and so is any depth of thin vapour the eye
    // cannot see through.
    float bodyW = max(saturate(densM * 4.0), smoothstep(0.35, 0.9, alpha));

    // The relief tap looks along this axis: toward the afterglow, away from the moon.
    vec3 lightAxis = normalize(sunDir - moonDir * 0.6);

    // ---- outward normal of the smooth body, as the march met it ----
    vec2 qh = s.q / max(s.ra, 1e-3);
    vec3 nrm = normalize(sumN + vec3(qh.x, 0.1, qh.y) * 1e-5);

    // ---- relief: the same noise a short way toward the afterglow ----
    // (the mirror image is small, blurred and bent by ripples: it goes without)
    float reach = clamp(0.45 * s.R, 0.14, 0.8);
    float nHere = 0.5, nThere = 0.5, streak = 0.5;
    if (!mirror) {
      float hFine = max(0.4 * soft, 0.02) * (1.0 + 0.03 * max(tm - 12.0, 0.0)) / quality;
      float grain = max(tm * pixelAngle * 1.4, hFine * 1.5) * 256.0;      // (one mip level up from the march: slopes, not grain)
      vec2 nq; float nz, scale, tauY; mat2 unwind;
      flowAt(s, y, nq, nz, scale, unwind, tauY);
      float lod = clamp(log2(grain * scale), 0.0, 5.0);
      nHere = saturate((noiseTexLod(vec3(nq, nz), lod).r - 0.5) * 2.4 + 0.5);
      nThere = saturate((noiseTexLod(vec3(nq + unwind * lightAxis.xz * (reach * scale), nz + lightAxis.y * reach * NOISE_RATE * tauY), lod).r - 0.5) * 2.4 + 0.5);
      // Striations are read from a cylinder in noise space, so they hardly change along the
      // radius: sheets wrapped around the axis, resolved by the pixels rather than by the march.
      vec2 around = unwind * qh;
      float lodS = clamp(log2(tm * pixelAngle * STREAK_R / max(s.ra, 0.5 * s.R) * 128.0), 0.0, 3.0);
      vec4 ns = noiseTexLod(vec3(around * (STREAK_R + 0.06 * s.ra / s.R), nz * 1.3 + uTime * 0.008 + 0.37), lodS);
      streak = saturate((ns.r * 0.7 + ns.b * 0.3 - 0.5) * 2.6 + 0.5);
    }
    // (Where the eye skims the surface it looks along many bumps at once, and which of them a
    // pixel happens to land on is a matter of chance: the relief is faded out there.)
    float grazing = 1.0 - saturate(dot(nrm, -rd));
    float steady = 1.0 - sq(sq(grazing));
    nThere = mix(nHere, nThere, steady);
    nHere = mix(0.55, nHere, steady);
    // The difference, read as a slope: how much the bumps of the surface lean toward the
    // afterglow (negative) or toward the moon (positive).
    float lean = amp * (nThere - nHere) * 2.0 / reach;
    float tilt = RELIEF * clamp(lean, -1.2, 1.2) * bodyW;

    // ---- light reaching this point ----
    // Each far light is dimmed twice: by the rest of the body on the way in (the chord through
    // the funnel, the spray, and for the moon the cloud's shadow on the funnel below it), and
    // by how the surface the eye sees is turned to it, bumps included.
    float sigmaMean = sigmaBody * 0.75;
    float Rin = max(s.Rw - 0.36 * s.R, 0.0);
    // The place on the funnel's wall the eye is looking at, taken a little outside it: the body
    // then begins to stand in the light's way some 30 degrees past the terminator, where the
    // surface has already turned dark by itself, instead of cutting a hard line along it.
    vec2 qs = qh * (1.15 * s.Rw);
    // The edge of the body, as the eye meets it: a ramp over the outer half of its width, as
    // seen (the sine of the angle between the surface and the line of sight).
    float edge = smoothstep(0.45, 1.0, sqrt(grazing * (2.0 - grazing))) * skinM;
    float litSun = through(sigmaMean * bodyDepth(qs, s.Rw, Rin, sunLit) + sprayM * 0.8)
                 * surfaceLit(dot(nrm, sunLit) - tilt, WRAP, edge * beyond(rd, sunLit), bodyW);
    float litMoon = through(sigmaMean * bodyDepth(qs, s.Rw, Rin, moonDir) + sprayM * 0.4 + airCapCover(p, moonDir) * 2.2)
                  * surfaceLit(dot(nrm, moonDir) + tilt, WRAP, edge * beyond(rd, moonDir), bodyW);
    float litGlow = through(sigmaMean * bodyDepth(qs, s.Rw, Rin, glowDir) + sprayM * 0.8)
                  * surfaceLit(dot(nrm, glowDir) - tilt, WRAP, edge * beyond(rd, glowDir), bodyW);
    float litUp = through(sigmaMean * bodyDepth(qs, s.Rw, Rin, moonUp) + sprayM * 0.6)
                * surfaceLit(dot(nrm, moonUp) + tilt, WRAP, edge * beyond(rd, moonUp), bodyW);
    // (the top of the horn stands under the cloud: the sky is shut out there, and the film's
    // light comes up into a hollow)
    float shade = 1.0 - smoothstep(8.2, 10.0, y);
    vec3 light = skyAmbient(nrm) * (AMBIENT_GAIN * (0.35 + 0.65 * shade));
    light += sunColor * (SUN_GAIN * phaseSun * litSun + GLOW_GAIN * phaseGlow * litGlow) * (0.75 + 0.25 * shade);
    light += uMoonColor * (MOON_GAIN * phaseMoon * litMoon + MOONUP_GAIN * phaseUp * litUp * (0.4 + 0.6 * shade));

    vec3 toFire = uFireLightPos - uOrigin - p;
    float fd2 = dot(toFire, toFire);
    vec3 fireDir = toFire * inversesqrt(max(fd2, 1e-3));
    light += uFireLightColor / (1.0 + fd2) * FIRE_GAIN
           * through(sigmaMean * bodyDepth(qs, s.Rw, Rin, fireDir) + sprayM)
           * surfaceLit(dot(nrm, fireDir), WRAP, edge * beyond(rd, fireDir), bodyW);

    // ---- what the vapour does to that light on its own scale ----
    // The tops of the lumps catch it and the creases between them do not; and light is
    // plentiful in the outer skin of a body and scarce in its depths, so wherever the eye
    // grazes the skin (the limb of a lump, a thin edge) it sees more of it than face on.
    float crease = 0.62 + 0.55 * nHere;
    // (through a hazy skin the eye sees further into the wall, and less of what it sees is skin)
    light *= mix(1.0, crease * (0.62 + 0.1 * ragged + 0.6 * skinM), bodyW);
    // The wind combs the funnel wall into fine striations.
    light *= mix(1.0, 0.74 + 0.52 * streak, bodyW);
    // Spray is drops, not vapour: it throws back more of the light that falls on it.
    light *= 1.0 + 0.9 * saturate(sprayM / (sprayM + densM * sigmaBody + 0.05));

    // Lightning: a line of light. Where it runs down the core it falls off with distance and
    // is soaked up by the vapour it crosses on the way out, so the funnel glows from within
    // and whatever stands proud of it (a lump on the wall) is the darker for it. Where it
    // crawls through the cloud it hangs over the funnel like a lamp, with the whole lit base
    // of the cloud around it: the wall is lit from above, most on the side the channel is on.
    if (uBoltLo.w > 0.001) {
      vec3 pa = vec3(s.q.x, y, s.q.y);
      vec3 ab = uBoltHi - uBoltLo.xyz;
      vec3 ap = pa - uBoltLo.xyz;
      vec3 off = ap - ab * clamp(dot(ap, ab) / max(dot(ab, ab), 1e-3), 0.0, 1.0);
      float d2 = dot(off, off);
      float crossed = sigmaBody * (0.3 * sqrt(d2) + 3.5 * amp * max(nHere - 0.3, 0.0)) * bodyW;
      float lamp = FLASH_LAMP / (FLASH_LAMP_D2 + d2) * surfaceLit(-dot(nrm, off) * inversesqrt(max(d2, 1e-3)), 1.0, 0.0, bodyW);
      light += FLASH_TINT * (flashLevel(uBoltLo.w) * FLASH_GAIN) * (through(crossed) / (1.0 + d2 * 1.6) + lamp);
    }
    colour += light * ALBEDO * alphaF;
  }

  gl_FragColor = vec4(colour, alpha);
}
`;

/**
 * Builds the raymarched funnel and cloud. `uniforms` must provide uOrigin, uBoltLo and
 * uBoltHi; rng is a seeded generator (it shapes the cloud).
 * Call mesh.userData.update(t) once a frame: it moves the bounds with the centre line.
 * mesh.userData.bounds lists upright cylinders [x, z, radius, y0, y1] (element space, as of
 * the last update) that together hold all the vapour, for whoever wants to know where it can be.
 */
export function createFunnelVolume(uniforms, rng) {
  const cloud = buildCloudField(rng);
  const texture = new THREE.Data3DTexture(cloud.data, CLOUD_GRID[0], CLOUD_GRID[1], CLOUD_GRID[2]);
  texture.format = THREE.RGFormat;
  texture.type = THREE.UnsignedByteType;
  texture.wrapS = texture.wrapT = texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  // Proxy: the convex hull, turned about the vertical, of the bounding cylinders wherever the
  // centre line may carry them and the cloud's circles wherever it turns them. The shader
  // finds the tight bounds itself.
  const pts = [];                                  // [height, radius]
  for (let i = 0; i <= SLABS; i++) {
    const r = Math.max(i > 0 ? SLAB_R[i - 1] : 0, i < SLABS ? SLAB_R[i] : 0);
    pts.push([SLAB_Y[i], r + axisReach(SLAB_Y[i]) + 0.06]);
  }
  for (const b of cloud.bands) {
    const r = Math.hypot(b.x, b.z) + b.r + 0.06;
    pts.push([b.y0, r], [b.y1, r]);
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const hull = [];                                 // upper hull of radius over height
  for (const p of pts) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2], b = hull[hull.length - 1];
      if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0) hull.pop(); else break;
    }
    hull.push(p);
  }
  const top = pts[pts.length - 1][0];
  const profile = [new THREE.Vector2(1e-3, 0), ...hull.map(([y, r]) => new THREE.Vector2(r, y)), new THREE.Vector2(1e-3, top)];
  const geometry = new THREE.LatheGeometry(profile, 28);

  const slabAxis = SLAB_Y.map(() => new THREE.Vector2());
  const mesh = new THREE.Mesh(geometry, createVolumeMaterial({
    vertexShader: VOLUME_VERT,
    fragmentShader: fragment(cloud.bands),
    uniforms: { ...uniforms, uSlabAxis: { value: slabAxis }, uCloud: { value: texture } },
  }));
  mesh.frustumCulled = false;
  mesh.material.addEventListener('dispose', () => texture.dispose());

  const bounds = [];
  for (let i = 0; i < SLABS; i++) bounds.push([0, 0, SLAB_R[i], SLAB_Y[i], SLAB_Y[i + 1]]);
  // (the cloud turns: each of its circles sweeps a ring around the vertical)
  for (const b of cloud.bands) bounds.push([0, 0, Math.hypot(b.x, b.z) + b.r, b.y0, b.y1]);
  mesh.userData.bounds = bounds;
  mesh.userData.update = (t) => {
    for (let i = 0; i <= SLABS; i++) axisAt(SLAB_Y[i], t, slabAxis[i]);
    for (let i = 0; i < SLABS; i++) {
      const a = slabAxis[i], b = slabAxis[i + 1], c = bounds[i];
      c[0] = 0.5 * (a.x + b.x);
      c[1] = 0.5 * (a.y + b.y);
      c[2] = SLAB_R[i] + 0.5 * Math.hypot(b.x - a.x, b.y - a.y);
    }
  };
  mesh.userData.update(0);
  return mesh;
}
