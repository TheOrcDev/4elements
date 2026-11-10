import { FRAG_PRELUDE } from '../../core/glsl/index.js';
import { RADIUS, LEVEL, MAX_SWELL, IOR, glslFloat as f } from './waves.js';
import { CAUSTIC_PLANE } from './wavefield.js';
import { BED_GLSL, VENTS } from './bed.js';
import { FISH_GLSL } from './fish.js';
import { MEDIUM_GLSL } from './medium.js';

// The body of water: one fragment shader that ray-traces the whole column analytically.
//
//   eye ray -> cylinder wall or sea surface (Fresnel reflection of the world + refraction in)
//           -> inside: nearest of seabed (sand + boulders), fish, underside of the surface, far
//              wall, gathering in-scattered light, light shafts, marine snow and bubbles on the way
//           -> at the surface or the wall: reflect inside (total internal reflection gives the
//              mirrored underside) and/or refract out and pick up the world beyond, which is
//              the frame as it stood before the column was drawn (uSceneColor), read where
//              the refracted ray leads
//
// Everything is done in the element's local frame (world minus uOrigin; y = 0 is the film).
// How much of this is done depends on how big a pixel is at the column (gFoot): from across
// the scene there is no snow, no second reflection, and fewer steps in every march. The
// column's image in the film does not come from here at all: see reflection.js.

export const WATER_VERT = /* glsl */ `
uniform float uIsMirrorPass;
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  // The image in the film is drawn by a much lighter mesh of its own (reflection.js): there
  // the proxy is folded away and produces no fragments.
  gl_Position = uIsMirrorPass > 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * wp;
}
`;

export const RUNNEL_COUNT = 10;

export const WATER_FRAG = /* glsl */ `
${FRAG_PRELUDE}
#define RADIUS ${f(RADIUS)}
#define LEVEL ${f(LEVEL)}
#define SWELL ${f(MAX_SWELL)}
#define IOR ${f(IOR)}
#define BED_PLANE ${f(CAUSTIC_PLANE)}
#define RUNNEL_COUNT ${RUNNEL_COUNT}

uniform mat4 projectionMatrix;
uniform vec3 uOrigin;            // world position of the foot of the column
uniform sampler2D tField;        // r = surface height above LEVEL, gb = slope, a = foam
uniform sampler2D tCaustic;      // r = focused moonlight on the bed plane
uniform sampler2D tFoam;         // tiling picture of foam: r = lace, g = heap, b = breakup, a = specks
uniform vec3 uFieldDomain;       // xy = centre (local xz), z = 1 / size
uniform vec3 uCausticDomain;
uniform vec3 uLightDir;          // unit direction moonlight travels under water
uniform vec4 uRunnels[RUNNEL_COUNT];   // x = angle on the wall, y = time it spilled, z = speed (m/s), w = height it spilled from
uniform int uRunnelsLive;        // slots at or beyond this index hold nothing
uniform vec2 uHub;               // the middle of the ring the four elements stand on (local xz)
uniform float uBlend;            // 1 from far off: the column is blended over the frame instead of reading it (see main)
varying vec3 vWorldPos;

float gDetail;      // 0..1 from uQuality: scales every step count (about 0.7 at 'high')
float gPixel;       // angle subtended by one pixel (radians)
float gFoot;        // size of a pixel at the column (m): whatever is much smaller than that is not traced
float gFar;         // 0 while gFoot is under 8 mm (the close-up), 1 from 14 mm up (the overview)
float gFrontZ;      // view-space depth of the first water hit; nearer scene pixels stand in front of the column
float gJitter;      // per-pixel dither in [0, 1)
float gThrough;     // far off: the share of what stands behind the pixel that comes straight through the column
vec3 gMoon;         // moonlight just under the surface
vec3 gAmbient;      // sky light just under the surface

${BED_GLSL}
${FISH_GLSL}

// ---------------------------------------------------------------- the medium
${MEDIUM_GLSL}
// Lightning is a point light of radiant intensity flashIntensity() (see the core's common
// chunk): over the distance squared it is an irradiance, like the moon's.

vec4 fieldAt(vec2 xz) { return textureLod(tField, (xz - uFieldDomain.xy) * uFieldDomain.z + 0.5, 0.0); }
float surfaceY(vec2 xz) { return LEVEL + fieldAt(xz).r; }

// Where the moon ray through p lands on the bed plane, as a UV of the caustic map.
vec2 causticUV(vec3 p) {
  float fall = clamp(p.y - BED_PLANE, 0.0, LEVEL + 0.3 - BED_PLANE) / -uLightDir.y;
  return (p.xz + uLightDir.xz * fall - uCausticDomain.xy) * uCausticDomain.z + 0.5;
}

// Distance from x to the wall, going horizontally toward 'dir' (unit): how much water a
// light entering through the side has crossed to reach x.
float waterToward(vec2 x, vec2 dir) {
  float b = dot(x, dir);
  return -b + sqrt(max(b * b - dot(x, x) + RADIUS * RADIUS, 0.0));
}

// ---------------------------------------------------------------- the world outside
// The moon as the sky shader draws it (the environment cube map leaves it out).
vec3 moonDisc(vec3 d) {
  float ang = acos(clamp(dot(d, uMoonDir), -1.0, 1.0));
  return vec3(1.25, 1.32, 1.50) * 1.5 * smoothstep(0.021, 0.0195, ang)
       + uMoonColor * (0.10 * exp(-ang * 26.0) + 0.02 * exp(-ang * 5.0));
}

// The pyre, seen by a ray from p along d when the frame cannot show it (it stands behind
// the camera, or the column is too far off for the frame to be read at all): a soft upright
// glow where the flame is. uFireLightColor is a radiant intensity; a twentieth of it is
// about the radiance of the flame.
//
// The wall of the column is a mirror, and a lens, that squeezes the world sideways sixteen
// times over: seen in it sharp, even a glow comes out as a hairline of orange standing in
// the water. But the skin of a wall of sea is never still, and what that does to a mirror
// is to leave the broad sky in it as it was and draw a small bright light out into a path
// of glitter. So the ray stands for a bundle FIRE_SPREAD wide: the glow is that much
// broader where the flame stands, and that much dimmer, the light being the same.
const float FIRE_SPREAD = 0.06;       // radians
vec3 fireGlint(vec3 p, vec3 d) {
  vec3 fire = uFireLightPos - uOrigin;
  float a = dot(d.xz, d.xz);
  float t = dot(fire.xz - p.xz, d.xz) / max(a, 1e-6);
  vec3 q = p + d * max(t, 0.0);
  float up = (q.y - (fire.y - 1.6)) / 3.4;                       // 0 at the hearth, 1 at the tip of the flame
  float flicker = 0.85 + 0.15 * sin(uTime * 7.0 + q.y * 3.0 + 1.7 * sin(uTime * 2.3));
  float aside = length(q.xz - fire.xz);
  // Half-width and half-height of the flame's glow (m): its own, and the bundle's on top.
  vec2 size = sqrt(vec2(0.25, 2.04) + sq(FIRE_SPREAD * max(t, 0.0)));
  float flame = 0.714 / (size.x * size.y) * exp(-sq((q.y - fire.y + 0.51) / size.y) - sq(aside / size.x));
  // The flame, and the haze of light round it.
  return uFireLightColor * flicker * step(0.0, t)
       * (0.06 * flame + 0.012 * exp(-sq((up - 0.35) / 0.8) - sq(aside / 3.0)));
}

// The frame at uv as it looks through metres of sea: a good third of it crisp, the rest spread
// over a disc of the given radius (a fraction of the frame's height), which is what
// scattering in water does to a picture, a sharp core inside a halo. All of it crisp, a
// flame or an engraved line behind the column reads as a fault in the glass; all of it
// spread by a handful of taps, a thin bright line breaks up into grit.
vec3 frameSoft(vec2 uv, float radius) {
  vec3 core = textureLod(uSceneColor, uv, 0.0).rgb;
  // The number of extra taps is data, not a branch: a compiler cannot trade a loop that
  // may have no iterations for arithmetic that always runs.
  int taps = radius > 0.0 ? 4 : 0;
  vec2 r = vec2(uResolution.y / uResolution.x, 1.0) * radius;
  float turn = gJitter * TAU;
  vec3 halo = vec3(0.0);
  for (int i = 0; i < taps; i++) {
    float fi = float(i);
    float a = turn + fi * 2.39996;
    halo += textureLod(uSceneColor, uv + vec2(cos(a), sin(a)) * r * sqrt((fi + 0.5) / 4.0), 0.0).rgb;
  }
  return taps > 0 ? core * 0.36 + halo * 0.16 : core;
}

// Where local point x falls in the frame: xy = uv, z = 1 on screen, fading to 0 toward the frame's edge.
vec3 onScreen(vec3 x) {
  vec4 clip = projectionMatrix * viewMatrix * vec4(x + uOrigin, 1.0);
  vec2 uv = clamp(clip.xy / max(clip.w, 0.05) * 0.5 + 0.5, 0.0, 1.0);
  vec2 inside = smoothstep(vec2(0.0), vec2(0.06), uv) * smoothstep(vec2(1.0), vec2(0.94), uv);
  return vec3(uv, inside.x * inside.y * step(0.05, clip.w));
}

// The world outside as far as it can be known without looking: the sky cube, the moon, the
// glow of the pyre, and below the horizon the film, a mirror at flat angles and dark stone
// at steep ones. rough = blur of the sky (0 crisp .. 1).
vec3 worldStandIn(vec3 p, vec3 d, float rough) {
  vec3 u = vec3(d.x, abs(d.y), d.z);
  vec3 col = envColor(u, rough) + moonDisc(u) + fireGlint(vec3(p.x, p.y * sign(d.y), p.z), u);
  return d.y < 0.0 ? mix(vec3(0.004, 0.005, 0.007), col, 0.05 + 0.95 * pow(max(1.0 + d.y, 0.0), 4.2)) : col;
}

// Radiance arriving at p from direction d through open air: the frame, read where the ray
// leads, which is all that "seen through the water" needs to be.
//
// A ray that heads down lands on the film, and the frame is read at the landing point (the
// film there already carries its own mirror image of the sky). Any other ray is followed
// as far as the things it is likely to show: the elements stand on a ring, and a ray that
// crosses the ring meets its far side at twice the distance of its closest approach to the
// hub, so a neighbour seen through the column sits where refraction puts it; a ray that
// leaves the ring behind is followed to the horizon. One smooth rule and one lookup: no
// outlines to get wrong.
//
// soft: radius of the blur (a fraction of the frame's height), 0 for a crisp mirror image.
// behind: the ray has come through the column, so only what lies beyond its near face
// counts. Where the frame has no answer (off screen, or hidden by something that stands in
// front of the column) the stand-in takes over.
vec3 world(vec3 p, vec3 d, float soft, bool behind) {
  float nearest = dot(uHub - p.xz, d.xz) / max(dot(d.xz, d.xz), 1e-5);       // closest approach to the hub
  // Parallax goes with one over the distance, so that is what is blended.
  float reach = 1.0 / mix(1.0 / 150.0, 1.0 / max(2.0 * nearest, 8.0), smoothstep(2.0, 6.0, nearest));
  if (d.y < 0.0) reach = min(reach, -p.y / d.y);
  vec3 at = onScreen(p + d * reach);
  if (behind) at.z *= step(gFrontZ, viewZFromDepth(textureLod(uSceneDepth, at.xy, 0.0).r));
  return mix(worldStandIn(p, d, soft > 0.0 ? 0.22 : 0.0), frameSoft(at.xy, soft), at.z);
}

// The sky from below, through a window in the waves (a slope steep enough to let the eye
// out). The sea hands it down as light, not as a picture: read as a picture, every such
// window is rimmed with the whole horizon squeezed into a bright ring. So it is the sky
// well above the horizon, blurred, and the glow round the moon.
vec3 skyThroughSea(vec3 d) {
  vec3 u = normalize(vec3(d.x, max(abs(d.y), 0.35), d.z));
  return envColor(u, 0.7) + uMoonColor * 0.3 * exp(-5.0 * acos(clamp(dot(u, uMoonDir), -1.0, 1.0)));
}

// Light on a surface in open air (foam, spray): sky, moon, afterglow, pyre, lightning.
vec3 airLight(vec3 q, vec3 n) {
  vec3 e = skyAmbient(n) * 1.4 + uMoonColor * 0.75 * max(dot(n, uMoonDir), 0.0);
  e += uSunColor * 0.35 * max(dot(n, normalize(vec3(uSunDir.x, 0.16, uSunDir.z))), 0.0);
  vec3 toFire = uFireLightPos - uOrigin - q;
  float fd2 = dot(toFire, toFire);
  e += uFireLightColor * max(dot(n, toFire), 0.0) / (sqrt(fd2) * (fd2 + 1.0));
  vec3 toFlash = uFlash.xyz - uOrigin - q;
  e += flashIntensity() / PI * (0.4 + 0.6 * max(dot(n, normalize(toFlash)), 0.0)) / (dot(toFlash, toFlash) + 1.0);
  return e;
}

// Lightning as the water and what stands in it take it, at q: an irradiance, before the
// water it has to cross. This sea glows far more than water does (see medium.js): that is
// what moonlight needs, and what would turn the column into a flat bright lamp at every
// near stroke, its shafts, caustics and shadows gone. So a stroke no stronger here than
// the moon comes through whole, and of a stronger one the water takes less and less (a
// stroke four times as bright lights it twice as much).
vec3 flashInWater(vec3 q) {
  vec3 toFlash = uFlash.xyz - uOrigin - q;
  vec3 e = flashIntensity() / (dot(toFlash, toFlash) + 1.0);
  return e / (1.0 + 0.33 * max(e.b - 1.0, 0.0));
}

// Light that enters through the wall rather than the surface: the afterglow lying on the
// horizon, the pyre, lightning. Each has crossed some water to reach q and has lost its red
// on the way, so the warm rim only reaches a metre or so into the body.
vec3 sideLight(vec3 q) {
  vec3 e = uSunColor * 0.55 * exp(-EXTINCT * waterToward(q.xz, normalize(uSunDir.xz)));
  if (uFireLightColor.r > 0.0) {
    vec3 toFire = uFireLightPos - uOrigin - q;
    e += uFireLightColor * 1.5 / (dot(toFire, toFire) + 1.0) * exp(-EXTINCT * waterToward(q.xz, normalize(toFire.xz + 1e-4)));
  }
  if (uFlash.w > 0.0) {
    vec2 toFlash = uFlash.xz - uOrigin.xz - q.xz;
    e += flashInWater(q) * exp(-EXTINCT * waterToward(q.xz, normalize(toFlash + 1e-4)));
  }
  return e;
}

// A cheap picture of the inside of the column in direction r, for things too small or
// too many bounces deep to deserve a real trace (bubbles, the last reflection).
vec3 insideEnv(vec3 q, vec3 r) {
  vec3 fade = exp(-DOWNWELL * max(LEVEL - q.y, 0.0));
  // the glow gathered over a typical chord of the column
  vec3 body = GLOW * (1.0 - exp(-EXTINCT * 4.0)) / EXTINCT * (gMoon * 0.84 + gAmbient) * fade;
  vec3 bed = SAND * 0.3 * (gMoon * 0.6 + gAmbient) * exp(-DOWNWELL * LEVEL);
  vec3 c = mix(body, bed, smoothstep(-0.15, -0.8, r.y) * 0.7);
  // Looking up: Snell's window, the whole sky squeezed into a 97 degree cone, moon and all.
  vec3 window = (skyAmbient(vec3(0.0, 1.0, 0.0)) * 2.2 + uMoonColor * 9.0 * pow(saturate(dot(r, -uLightDir)), 90.0)) * fade;
  return mix(c, window, smoothstep(0.62, 0.74, r.y));
}

// ---------------------------------------------------------------- the surface
// Foam, read from the baked picture. x = how much of the pixel is foam, y = how white it
// is. density is the foam field: near 1 where water has just broken, below a half the lace
// it leaves behind. footprint = size of a pixel on the sea (m).
vec2 foamLook(vec2 x, vec2 slope, float density, float footprint) {
  if (density < 0.012) return vec2(0.0);
  // Foam rides the water: carried forward on the crests and back in the troughs.
  vec2 u = (x - slope * 0.08) / 0.62;
  float lod = log2(max(footprint * (512.0 / 0.62), 1.0));
  vec4 a = textureLod(tFoam, u + vec2(uTime * 0.004, 0.0), lod);
  // The same picture twice the size, turned: its cells are a hand across, which is the
  // grain of foam that can still be made out from across the scene.
  const mat2 TURN = mat2(0.41, 0.31, -0.31, 0.41);
  vec2 ub = TURN * u + 0.31;
  float lodB = max(lod - 0.95, 0.0);
  vec4 b = textureLod(tFoam, ub, lodB);
  // The field says how much foam there is; two noises decide where it holds together:
  // one in blots, one drawn out along the run of the waves, which is how foam is left
  // behind a crest. Together they feather the smooth outline of the field into tongues.
  float streaks = noiseTexLod(vec3(x.x * 0.17, x.y * 0.83, 0.37 + uTime * 0.004), 0.0).r;
  float tear = (a.b * 0.5 + b.b * 0.5) * 0.55 + streaks * 0.45;
  float m = density * (0.10 + 1.60 * smoothstep(0.32, 0.66, tear));
  // A sheet of foam is translucent where it is thin (and the last wisps of it are let go:
  // strands too faint to read as foam only vein the sea like marble)...
  float sheet = smoothstep(0.14, 0.62, m);
  // ... and full of holes, which grow as it ages until only strands are left. Even water
  // that has just broken keeps its pores: a sheet without them reads as paint.
  float lace = max(a.r, b.r * 0.9);
  float open = mix(0.86, 0.22, smoothstep(0.08, 0.80, m));
  float net = smoothstep(open - 0.10, open + 0.10, lace);
  float solid = smoothstep(0.62, 1.0, m);
  float cover = sheet * mix(net, 1.0, solid * 0.62) + a.a * smoothstep(0.05, 0.3, m) * 0.4;
  // Far away the net is smaller than a pixel: what is left of it is its average.
  cover = mix(min(cover, 1.0), sheet * mix(0.45, 0.85, solid), smoothstep(2.5, 5.0, lod));
  // Relief. The walls between the big cells stand proud, and the side of each that faces
  // the moon is the bright one: one more look at the picture, a texel toward the light.
  vec2 toMoon = TURN * normalize(uMoonDir.xz) * (1.6 * exp2(lodB) / 512.0);
  float relief = clamp((b.r - textureLod(tFoam, ub + toMoon, lodB).r) * 2.2, -0.6, 0.8) * smoothstep(5.5, 3.0, lod);
  // Thick where it holds together, thin and grey where it is tearing.
  float body = 0.55 + 0.75 * smoothstep(0.30, 0.75, tear);
  float white = mix(0.62 + 0.30 * lace, body * (0.62 + 0.30 * a.g + 0.22 * lace), solid) * (1.0 + relief);
  return vec2(cover, white);
}

// Ripples too fine for the wave field (a few centimetres and less), read from the baked
// noise so that they filter themselves away as they shrink below a pixel. xy = slope,
// z = how ruffled the water is here (cat's paws: wind never roughens a sea evenly).
vec3 microSlope(vec2 x, float footprint, float finer) {
  float t = uTime;
  float gust = smoothstep(0.38, 0.62, noiseTexLod(vec3(x * 0.11 + vec2(t * 0.012, -t * 0.008), t * 0.006), 1.0).r);
  float ruffle = 0.35 + 0.65 * gust;
  float lod = log2(max(footprint / 0.0025, 1.0)) - finer;      // finer > 0: read below the pixel (for glitter)
  if (lod > 6.0) return vec3(0.0, 0.0, ruffle);
  vec2 q = x * 3.1 + vec2(t * 0.11, t * 0.035);
  float n1 = noiseTexLod(vec3(q, t * 0.19), lod).r;
  float n2 = noiseTexLod(vec3(q.yx * vec2(1.0, -1.0) + vec2(0.37, 0.71), t * 0.19 + 0.43), lod).r;
  return vec3((vec2(n1, n2) - 0.5) * 0.62 * ruffle, ruffle);
}

// The ray p + d t is above the sea at t = ta. Find where it comes down onto the surface
// before tb, or return -1. Steps by (height above the water) / (worst closing speed), then
// one secant step across the crossing. A ray that skims the sea would need hundreds of
// such steps, so the last few stride evenly over whatever distance is left: better a
// crest clipped by a hair than a hole torn in the far side of the sea. When the ray
// clears the sea altogether, graze is the smallest gap it left, in pixels, and tGraze
// where: the silhouette of a crest is anti-aliased with it.
float surfaceFromAbove(vec3 p, vec3 d, float ta, float tb, int steps, out float tGraze, out float graze) {
  graze = 1e3;
  tGraze = ta;
  float t = ta;
  bool clear = false;                     // above everything and climbing: it can never come down
  if (p.y + d.y * t > LEVEL + SWELL) {
    clear = d.y >= 0.0;
    t = (LEVEL + SWELL - p.y) / min(d.y, -1e-5);
  }
  float k = 1.0 / (0.9 * length(d.xz) + max(-d.y, 0.0) + 1e-4);
  float tPrev = t, gPrev = 0.0;
  float found = -1.0;
  int count = clear ? 0 : steps + 1;      // the last turn looks at the far rim
  for (int i = 0; i < count; i++) {
    bool last = i == steps || t >= tb;
    float ti = last ? tb : t;
    vec3 q = p + d * ti;
    float g = q.y - surfaceY(q.xz);
    if (g <= 0.0) { found = i == 0 ? ti : mix(tPrev, ti, gPrev / (gPrev - g)); break; }
    float gp = g / (gPixel * ti);
    if (gp < graze) { graze = gp; tGraze = last ? tb - 2e-3 : ti; }
    if (last) break;
    tPrev = t; gPrev = g;
    float stride = max(g * k, max(0.008, gPixel * ti * 2.0));
    if (i >= steps - 10) stride = max(stride, (tb - t) / float(steps - i));
    t += stride;
  }
  return found;
}

// Same from below: the ray is under water at t = 0 and may break through before tMax.
float surfaceFromBelow(vec3 p, vec3 d, float tMax, int steps) {
  float yEnd = p.y + d.y * tMax;
  float t = p.y < LEVEL - SWELL ? (LEVEL - SWELL - p.y) / max(d.y, 1e-5) : 0.0;
  float k = 1.0 / (0.9 * length(d.xz) + abs(d.y) + 1e-4);
  float tPrev = t, gPrev = 0.0;
  float found = -1.0;
  int count = max(p.y, yEnd) < LEVEL - SWELL ? 0 : steps + 1;     // never reaches the waves: nothing to walk
  for (int i = 0; i < count; i++) {
    bool last = i == steps || t >= tMax;
    float ti = last ? tMax : t;
    vec3 q = p + d * ti;
    if (d.y < 0.0 && q.y < LEVEL - SWELL) break;
    float g = surfaceY(q.xz) - q.y;
    if (g <= 0.0) { if (i > 0) found = mix(tPrev, ti, gPrev / (gPrev - g)); break; }
    if (last) break;
    tPrev = t; gPrev = g;
    float stride = max(g * k, 0.008);
    if (i >= steps - 8) stride = max(stride, (tMax - t) / float(steps - i));
    t += stride;
  }
  return found;
}

// ---------------------------------------------------------------- the seabed
// Jittered-grid pebbles: distance to the nearest stone centre (x), its hash (y) and the
// vector to it (to).
vec2 pebbles(vec2 p, out vec2 to) {
  vec2 cell = floor(p), fr = fract(p);
  float best = 8.0, id = 0.0;
  to = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j));
    vec2 h = hash22(cell + o);
    vec2 r = o + 0.15 + 0.7 * h - fr;
    float dd = dot(r, r);
    if (dd < best) { best = dd; to = r; id = fract(h.x * 7.31 + h.y * 3.17); }
  }
  return vec2(sqrt(best), id);
}

// Moonlight and sky light reaching a point of the bed with normal n (caustics included).
// spread widens the caustic lookup (distance, or surfaces that sit above the focal plane).
vec3 bedLight(vec3 q, vec3 n, float skipRock, float spread) {
  vec2 shade = rockShade(q, -uLightDir, skipRock);
  float depth = max(LEVEL - q.y, 0.0);
  vec3 fade = exp(-DOWNWELL * depth / -uLightDir.y);
  // The three colours focus a hair apart (dispersion): the bright lines get rainbow fringes.
  vec2 uv = causticUV(q);
  vec2 split = uLightDir.xz * uCausticDomain.z * 0.014;
  float lod = 0.25 + spread;
  vec3 caustic = vec3(textureLod(tCaustic, uv - split, lod).r, textureLod(tCaustic, uv, lod).r, textureLod(tCaustic, uv + split, lod).r);
  caustic = caustic * (0.55 + 0.45 * caustic);                  // a little more bite in the bright lines
  vec3 e = gMoon * caustic * max(dot(n, -uLightDir), 0.0) * shade.x * fade;
  // Sky light from above, and the glow of the water itself from every side.
  e += (gAmbient * 2.2 * (0.55 + 0.45 * n.y) + gMoon * 0.16) * shade.y * exp(-DOWNWELL * depth);
  // Light through the walls: the afterglow, and lightning when it comes.
  e += uSunColor * 0.25 * max(dot(n, normalize(vec3(uSunDir.x, 0.25, uSunDir.z))), 0.0)
     * exp(-EXTINCT * waterToward(q.xz, normalize(uSunDir.xz))) * shade.y;
  if (uFlash.w > 0.0) {
    vec3 toFlash = normalize(uFlash.xyz - uOrigin - q);
    // Under water even lightning comes from high up (Snell bends all light toward the
    // vertical), so it does not rake the ripple marks; and what crowds a spot of the bed
    // keeps the flash off it as it keeps the sky off.
    vec2 lean = toFlash.xz / IOR;
    vec3 l = vec3(lean.x, sqrt(1.0 - dot(lean, lean)), lean.y);
    e += flashInWater(q) * (0.3 + 0.7 * max(dot(n, l), 0.0))
       * exp(-EXTINCT * waterToward(q.xz, normalize(toFlash.xz + 1e-4))) * shade.y;
  }
  return e;
}

// The sand at q: what it is made of (albedo, with the shade of its own grain folded in),
// which way it faces, and how wide the caustic lookup should be.
void sandSurface(vec3 q, float footprint, out vec3 albedo, out vec3 n, out float spread) {
  vec2 x = q.xz;
  vec2 slope = sandGradient(x);
  // Each kind of detail fades out before it shrinks below a pixel (the ripple marks by
  // the time two pixels span one of them: any later and they beat against the pixel grid).
  float seeRipples = smoothstep(0.040, 0.016, footprint);
  float seePebbles = smoothstep(0.045, 0.018, footprint);
  float seeGrit = smoothstep(0.020, 0.006, footprint);
  // Ripple marks left by the surge, about 9 cm apart, bent by a slow warp.
  float warp = 1.5 * sin(x.x * 1.3 + 0.8 * sin(x.y * 1.9)) + 0.9 * sin(x.y * 2.3 - 1.0);
  float ph = dot(x, vec2(0.93, 0.37)) * 70.0 + warp;
  slope += vec2(0.93, 0.37) * cos(ph) * 0.34 * seeRipples;
  albedo = SAND;
  vec4 mottle = noiseTexLod(vec3(x * 0.31, 0.37), 0.0);
  albedo *= 0.78 + 0.5 * mottle.r;
  albedo *= 1.0 - 0.20 * seeRipples * (0.5 - 0.5 * sin(ph));    // darker, heavier grains settle in the troughs
  // Pebbles, gathered in drifts rather than sown evenly.
  float occl = 1.0;
  vec2 to;
  for (int k = 0; k < (seePebbles > 0.0 ? 1 : 0); k++) {
    vec2 pb = pebbles(x * 7.5, to);
    float rad = 0.13 + 0.20 * fract(pb.y * 13.7);
    if (pb.y > 0.78 - 0.5 * smoothstep(0.42, 0.62, mottle.g)) {
      // No two pebbles are round the same way: each is an oval lying its own way.
      float lie = pb.y * 37.0;
      vec2 axis = vec2(cos(lie), sin(lie));
      vec2 oval = to + axis * dot(to, axis) * (0.9 * fract(pb.y * 71.3) - 0.2);
      float u = length(oval) / rad;
      if (u < 1.0) {
        // A worn dome half sunk in the sand: steepest two thirds of the way out, easing
        // into the bed at its rim.
        slope += -oval / max(length(oval), 1e-4) * u * (1.0 - u * u * 0.6) * 1.5 * seePebbles;
        vec3 stone = mix(vec3(0.24, 0.24, 0.25), vec3(0.72, 0.69, 0.63), fract(pb.y * 5.3));
        stone = mix(stone, vec3(0.36, 0.23, 0.16), step(0.85, fract(pb.y * 29.1)));
        stone *= 0.85 + 0.3 * noiseTexLod(vec3(x * 9.0, 0.21), 0.0).b;
        albedo = mix(albedo, stone, smoothstep(1.0, 0.82, u) * 0.92 * seePebbles);
      }
      occl *= 1.0 - 0.22 * seePebbles * smoothstep(1.7, 1.0, u) * step(1.0, u);                  // a soft shadow where it meets the sand
    }
  }
  for (int k = 0; k < (seeGrit > 0.0 ? 1 : 0); k++) {
    vec2 gv = pebbles(x * 21.0 + 7.7, to);
    float grit = smoothstep(0.30, 0.18, gv.x) * step(0.5, gv.y) * seeGrit;
    albedo = mix(albedo, mix(vec3(0.16, 0.15, 0.15), vec3(0.75, 0.72, 0.66), fract(gv.y * 9.1)), grit * 0.8);
  }
  n = normalize(vec3(-slope.x, 1.0, -slope.y));
  albedo *= occl * 0.50;
  spread = footprint * 14.0;
}

// The same for a boulder; n comes in as the normal of its shape and goes out with its grain.
void rockSurface(vec3 q, float id, float relief, float footprint, inout vec3 n, out vec3 albedo, out float spread) {
  vec4 n1 = noiseTexLod(q * 0.47 + id * 0.37, 0.0);
  vec4 n2 = noiseTexLod(q * 1.7 + 0.5 + id * 0.11, 0.0);
  n = normalize(n + (vec3(n2.r, n1.b, n2.b) - 0.5) * 0.6);                 // grain finer than the relief
  albedo = mix(vec3(0.12, 0.125, 0.14), vec3(0.42, 0.39, 0.35), n1.r * n1.r * 1.6);
  albedo *= 0.30 + 1.0 * smoothstep(0.22, 0.72, relief);                   // hollows hold the dark
  albedo *= 0.62 + 0.55 * smoothstep(0.30, 0.60, n2.g);                    // pits
  // Sediment settles on whatever faces up; a crust of algae takes the shoulders, and
  // pale coralline patches the faces the surge keeps clean.
  float dust = smoothstep(0.55, 0.95, n.y + (n2.b - 0.5) * 0.5);
  float algae = smoothstep(0.50, 0.68, n1.g) * (1.0 - dust) * smoothstep(-0.3, 0.3, n.y);
  float crust = smoothstep(0.60, 0.70, n2.a + (n1.b - 0.5) * 0.3) * (1.0 - dust) * smoothstep(0.35, 0.6, relief);
  albedo = mix(albedo, vec3(0.045, 0.110, 0.050), algae * 0.75);
  albedo = mix(albedo, vec3(0.52, 0.43, 0.44), crust * 0.6);
  albedo = mix(albedo, SAND * 0.8, dust * 0.7);
  // Darkens toward the sand it sits in.
  float skirt = smoothstep(0.0, 0.16, q.y - sandHeight(q.xz));
  float occl = (0.40 + 0.60 * skirt) * (0.45 + 0.55 * smoothstep(0.2, 0.62, relief));
  albedo *= occl * 0.5;
  spread = footprint * 30.0 + (q.y - BED_PLANE) * 1.6;
}

// A fish. Its flank is a mirror that stands upright, so from the side it shows the water
// around it (which is how a silver fish hides), darkening to the back and paling to the
// belly; when it rolls or turns the flank catches the light from above and flashes.
// q = the hit in the fish's own frame (see fish.js), part = 0 body, 1 fin.
vec3 shadeFish(vec3 hit, vec3 d, vec3 n, vec3 q, float part) {
  float depth = max(LEVEL - hit.y, 0.0);
  vec3 sun = gMoon * textureLod(tCaustic, causticUV(hit), 1.2).r * exp(-DOWNWELL * depth / -uLightDir.y);
  vec3 sky = gAmbient * 2.2 * exp(-DOWNWELL * depth);
  float facing = max(dot(n, -uLightDir), 0.0);
  vec3 r = reflect(d, n);
  vec3 around = insideEnv(hit, r);
  if (part > 0.5) {
    // A fin: a thin membrane ribbed with rays, more lit through than lit.
    float rays = 0.72 + 0.28 * sin(atan(q.y, -q.x - 0.55) * 46.0);
    return vec3(0.26, 0.34, 0.35) * (sun * (0.35 + 0.4 * facing) + sky * 1.3) * 0.42 * rays + around * 0.30;
  }
  float v = clamp(q.y / max(fishProfile(clamp(q.x, -0.86, 1.0)), 0.03), -1.0, 1.0);    // -1 belly .. 1 back
  // Rows of scales, each a slightly different mirror.
  vec2 cell = vec2(q.x * 26.0 + 0.5 * floor(v * 7.0), v * 7.0);
  float scale = hash12(floor(cell) + 3.0);
  vec2 inCell = fract(cell) - 0.5;
  float edge = smoothstep(0.50, 0.30, abs(inCell.x)) * smoothstep(0.50, 0.34, abs(inCell.y));
  float glitter = 0.80 + 0.35 * scale * edge;
  vec3 flash = sun * 2.6 * pow(saturate(dot(r, -uLightDir)), 7.0);
  vec3 silver = (around * 0.85 + vec3(0.70, 0.75, 0.77) * (sun * facing + sky * (0.55 + 0.45 * n.y)) * 0.36 + flash) * glitter;
  vec3 back = vec3(0.030, 0.070, 0.085) * (sun * facing + sky) * 0.42 + around * 0.12 + flash * 0.15;
  vec3 belly = vec3(0.76, 0.80, 0.80) * (sun * 0.25 + sky) * 0.42 + around * 0.30;
  vec3 col = mix(silver, back, smoothstep(0.22, 0.72, v));
  col = mix(col, belly, smoothstep(-0.45, -0.95, v));
  // The lateral line, the gill cover, and the eye: a dark pupil in a silver ring.
  col *= 1.0 - 0.22 * smoothstep(0.05, 0.0, abs(v - 0.10 - 0.12 * q.x)) * step(q.x, 0.45);
  col *= 1.0 - 0.40 * smoothstep(0.035, 0.0, abs(q.x - 0.50 + 0.20 * v * v)) * step(abs(v), 0.85);
  float eye = length(vec2(q.x - 0.73, q.y - 0.065));
  col = mix(col, vec3(0.80, 0.84, 0.84) * (sun * 0.5 + sky) * 0.42 + around * 0.5, smoothstep(0.085, 0.070, eye));
  col = mix(col, vec3(0.002), smoothstep(0.052, 0.040, eye));
  return col;
}

// Nearest of sand and boulders. Returns t or -1; rock = boulder index, -1 for sand.
float intersectBed(vec3 p, vec3 d, float tMax, out vec3 n, out float rock, out float relief) {
  float tRock = intersectRocks(p, d, tMax, n, rock, relief);
  float tSand = intersectSand(p, d, tRock > 0.0 ? tRock : tMax);
  if (tSand >= 0.0) { rock = -1.0; return tSand; }
  return tRock;
}

// ---------------------------------------------------------------- in the water
// Light scattered toward the eye along p + d t, t in [0, tEnd]; trans = what survives the
// trip. mark = the share gathered before tMark (bubbles sit part-way along a segment).
vec3 inscatter(vec3 p, vec3 d, float tEnd, int steps, float jitter, float tMark, out vec3 trans, out vec3 mark) {
  // Moon and sky come down through the surface and fade with depth; the view ray fades
  // what it gathers. Both are exponentials of something linear in t, so the integrand is
  // one exp(rate * t) times the caustic map, and that modulation is what draws the shafts.
  // Evenly spaced steps turn the exponential into a running product.
  float mu = -uLightDir.y;
  vec3 atStart = exp(-DOWNWELL * (LEVEL - p.y) / mu);
  vec3 rate = DOWNWELL * d.y / mu - EXTINCT;
  vec3 direct = gMoon * moonPhase(d);
  // A shaft is a shaft when it is seen from the side. Looked along (down through the sea
  // surface, mostly) the shafts stack up into a net of bright veins: there they are played down.
  float shaft = 2.4 * mix(1.0, 0.2, smoothstep(0.55, 0.95, abs(dot(d, uLightDir))));
  vec2 uv0 = (p.xz + uLightDir.xz * (p.y - BED_PLANE) / mu - uCausticDomain.xy) * uCausticDomain.z + 0.5;
  vec2 duv = (d.xz + uLightDir.xz * d.y / mu) * uCausticDomain.z;
  // Six texels across from close by; from far off twice that, which is still narrower than
  // a shaft and lets the sampler make do with half the taps.
  float lod = 2.5 + gFar;
  float dt = tEnd / float(steps);
  vec3 fade = exp(rate * dt);
  vec3 weight = exp(rate * dt * 0.5);
  float below0 = LEVEL - p.y;
  vec3 sum = vec3(0.0);
  mark = vec3(0.0);
  // Each lookup is asked to cover the whole of its step: the gradients handed to the
  // sampler are the step itself along the ray and a few texels across it, and the
  // anisotropic filter does the line integral. That is what keeps the shafts free of the
  // grain a handful of point samples would leave.
  vec2 along = duv * dt;
  vec2 across = vec2(-duv.y, duv.x) / max(length(duv), 1e-5) * (exp2(lod) / 512.0);
  for (int i = 0; i < steps; i++) {
    float t = (float(i) + 0.25 + 0.5 * jitter) * dt;
    float c = textureGrad(tCaustic, uv0 + duv * t, along, across).r;
    float formed = saturate((below0 - d.y * t) * 0.8);             // beams need some depth to gather
    vec3 s = (direct * max(1.0 + (c - 1.0) * shaft * formed, 0.0) + gAmbient) * weight;
    sum += s;
    mark += s * step(t, tMark);
    weight *= fade;
  }
  // Light through the walls is smooth: one tap, a third of the way along, is enough.
  vec3 side = sideLight(p + d * (0.35 * tEnd)) * exp(-EXTINCT * (0.35 * tEnd)) * GLOW * tEnd * 0.55;
  vec3 scale = GLOW * atStart * dt;
  trans = exp(-EXTINCT * tEnd);
  mark = mark * scale + side * saturate(tMark / max(tEnd, 1e-4));
  return sum * scale + side;
}

// Marine snow: one mote per cell of a slowly sinking lattice, found by walking the cells
// the ray passes through (3D DDA). Motes smaller than a pixel are drawn a pixel wide and
// dimmed by the same ratio, so they never alias and never gain energy. A pixel is rarely
// lit by more than one mote, so the shaft of moonlight it stands in is looked up once,
// for the mote that counts most.
vec3 marineSnow(vec3 p, vec3 d, float tEnd, float eyeDist, int cells) {
  const float CELL = 0.40;
  vec3 drift = vec3(0.06 * sin(uTime * 0.11), -0.017 * uTime, 0.06 * cos(uTime * 0.09));
  vec3 g = (p - drift) / CELL;
  vec3 cell = floor(g);
  vec3 dd = mix(d, vec3(1e-5), step(abs(d), vec3(1e-5)));
  vec3 stp = sign(dd);
  vec3 next = (cell + max(stp, 0.0) - g) * CELL / dd;
  vec3 delta = CELL / abs(dd);
  float mu = -uLightDir.y;
  // How fast a mote dims with the water above it and the water in front of it, as one
  // number (green is what the eye goes by here); the colour is put right once, at the end.
  float fall = DOWNWELL.g / mu;
  float sum = 0.0, lead = 0.0;
  vec3 leadAt = p;
  for (int i = 0; i < cells; i++) {
    vec3 h = hash33(cell);
    // Each mote keeps its place in the lattice but breathes about it, out of step with the rest.
    float wander = abs(fract(uTime * (0.04 + h.y * 0.07) + h.z) - 0.5) * 0.5;
    vec3 c = (cell + 0.5 + (h - 0.5) * (0.50 + wander)) * CELL + drift;
    float tc = dot(c - p, d);
    float r0 = mix(0.0020, 0.0048, h.x * h.x);
    float r = max(r0, gPixel * (eyeDist + tc) * 0.7);
    vec3 off = c - p - d * tc;
    float w = exp(-2.0 * dot(off, off) / (r * r) - fall * max(LEVEL - c.y, 0.0) - EXTINCT.g * tc) * sq(r0 / r) * step(0.0, tc) * step(tc, tEnd);
    sum += w;
    if (w > lead) { lead = w; leadAt = c; }
    float tn = min(next.x, min(next.y, next.z));
    if (tn > tEnd) break;
    vec3 m = step(next, vec3(tn));
    cell += stp * m;
    next += delta * m;
  }
  vec3 col = vec3(0.0);
  for (int k = 0; k < (lead > 0.002 ? 1 : 0); k++) {
    float depth = max(LEVEL - leadAt.y, 0.0), tc = dot(leadAt - p, d);
    vec3 tint = exp(-(DOWNWELL - DOWNWELL.g) * (depth / mu) - (EXTINCT - EXTINCT.g) * tc);     // red gone first, as everywhere
    float shaft = textureLod(tCaustic, causticUV(leadAt), 1.5).r;
    col = (sum * (gMoon * 1.35 + gAmbient * 2.0) + lead * gMoon * (shaft - 1.0)) * tint;
  }
  return max(col, vec3(0.0)) * 0.42;
}

// Bubble streams. Each vent on the bed lets go of a bubble every BUBBLE_GAP seconds (in
// bursts); bubble k of a stream is a pure function of time, so a ray only has to look at
// the few bubbles that are at its own height inside the stream's tube.
const int VENT_COUNT = ${VENTS.length};
const vec3 VENT[VENT_COUNT] = vec3[VENT_COUNT](
${VENTS.map((v) => `  vec3(${v.map(f).join(', ')})`).join(',\n')}
);
const float BUBBLE_GAP = 0.105;
const float BUBBLE_RISE = 0.44;
const float BUBBLE_TUBE = 0.13;

// Centre (xyz) and radius (w) of bubble k of stream s; w = 0 when there is none.
vec4 bubbleAt(int s, float k) {
  vec3 vent = VENT[s];
  float fs = float(s);
  vec3 h = hash32(vec2(k, fs * 17.0 + 3.0));
  float age = uTime - (k + h.x * 0.7) * BUBBLE_GAP;
  float burst = 0.5 + 0.5 * sin(k * 0.19 + fs * 2.1);
  if (age < 0.0 || h.y > 0.2 + 0.65 * burst) return vec4(0.0);
  float y = vent.y + BUBBLE_RISE * age;
  float loose = 1.0 - exp(-age * 0.7);                          // paths open out as the bubbles climb
  // The stream leans and sways as a whole; each bubble spirals about it on its own.
  float lean = y * 1.7 + uTime * 0.55 + fs;
  float spin = age * (4.6 + 3.0 * h.x) + h.z * 40.0;
  vec2 xz = vent.xz + loose * (0.040 * vec2(sin(lean), cos(lean * 0.8)) + (0.02 + 0.04 * h.z) * vec2(sin(spin), cos(spin)));
  // (A bubble that has climbed out of the water lies beyond the end of the ray's stretch
  // of sea, so nobody has to ask the surface where it is.)
  return vec4(xz.x, y, xz.y, mix(0.006, 0.02, h.z * h.z) * (1.0 + 0.08 * age));
}

// Nearest bubble on the ray before tEnd: t, or -1. ball = centre and drawn radius,
// fade = dimming for bubbles drawn larger than life (smaller than a pixel).
float intersectBubbles(vec3 p, vec3 d, float tEnd, float eyeDist, bool wanted, out vec4 ball, out float fade) {
  ball = vec4(0.0);
  fade = 0.0;
  float best = tEnd;
  float a = dot(d.xz, d.xz);
  if (a < 1e-5) return -1.0;
  for (int s = 0; s < VENT_COUNT; s++) {
    vec2 o = p.xz - VENT[s].xz;
    float b = dot(o, d.xz);
    float h = b * b - a * (dot(o, o) - BUBBLE_TUBE * BUBBLE_TUBE);
    float root = sqrt(max(h, 0.0));
    float ta = max((-b - root) / a, 0.0), tb = min((-b + root) / a, best);
    float ya = p.y + d.y * ta, yb = p.y + d.y * tb;
    float oldest = (max(ya, yb) + 0.03 - VENT[s].y) / BUBBLE_RISE;
    float newest = (min(ya, yb) - 0.03 - VENT[s].y) / BUBBLE_RISE;
    float k0 = floor((uTime - oldest) / BUBBLE_GAP - 0.7);
    float k1 = ceil((uTime - newest) / BUBBLE_GAP);
    // No bubbles to try when the ray misses the tube: the miss sets the count to zero.
    int count = wanted && h > 0.0 && tb > ta ? int(min(k1 - k0 + 1.0, 5.0)) : 0;
    for (int j = 0; j < count; j++) {
      vec4 bb = bubbleAt(s, k0 + float(j));
      if (bb.w <= 0.0) continue;
      vec3 oc = p - bb.xyz;
      float tc = -dot(oc, d);
      if (tc <= 0.0) continue;
      float r = max(bb.w, gPixel * (eyeDist + tc) * 0.75);
      float miss2 = dot(oc, oc) - tc * tc;
      if (miss2 >= r * r) continue;
      float t = tc - sqrt(r * r - miss2);
      if (t > 0.0 && t < best) { best = t; ball = vec4(bb.xyz, r); fade = sq(bb.w / r); }
    }
  }
  return ball.w > 0.0 ? best : -1.0;
}

// Radiance arriving at p from direction d, with p just inside the water. Follows the ray
// through at most one internal reflection; whatever is left after that is filled in by
// insideEnv(). fromSurface: the ray has just come through the sea surface (it cannot meet it again).
vec3 traceInside(vec3 p, vec3 d, float eyeDist, float jitter, bool fromSurface) {
  int marchSteps = int(mix(4.0, 9.0, gDetail) * mix(1.0, 0.6, gFar));
  int surfSteps = int(mix(12.0, 28.0, gDetail));
  int snowCells = int(mix(4.0, 10.0, gDetail));
  // The view follows the light through two stretches of water, the second after one
  // reflection inside; from far off the first is all that can be told. (The count is not
  // a constant on purpose: a compiler that cannot know it writes the body of the loop out
  // once. Every switch below is a loop count for the same reason: zero turns cost nothing,
  // where a branch round pure arithmetic is often run and thrown away.)
  int legs = gFar < 1.0 ? 2 : 1;
  vec3 col = vec3(0.0);
  vec3 thr = vec3(1.0);
  bool skipSurface = fromSurface;
  for (int leg = 0; leg < legs; leg++) {
    bool firstLeg = leg == 0;
    // ---- what the ray runs into
    float a = dot(d.xz, d.xz), b = dot(p.xz, d.xz), c = dot(p.xz, p.xz) - RADIUS * RADIUS;
    float tWall = a > 1e-7 ? (-b + sqrt(max(b * b - a * c, 0.0))) / a : 1e4;
    vec3 n;
    float rock, relief;
    float tBed = intersectBed(p, d, tWall, n, rock, relief);
    int kind = tBed >= 0.0 ? 1 : 2;                        // 1 bed, 2 wall, 3 surface, 4 fish
    float tEnd = tBed >= 0.0 ? tBed : tWall;
    float tSurf = surfaceFromBelow(p, d, tEnd, skipSurface ? -1 : surfSteps);
    if (tSurf >= 0.0) { tEnd = tSurf; kind = 3; }
    tEnd = min(tEnd, 12.0);
    vec3 fishN, fishQ;
    float fishPart;
    float tFish = intersectFish(p, d, tEnd, firstLeg && gFoot < 0.03, fishN, fishQ, fishPart);
    if (tFish >= 0.0) { tEnd = tFish; kind = 4; n = fishN; }
    vec3 hit = p + d * tEnd;

    // ---- the water on the way there
    vec4 ball = vec4(0.0);
    float ballFade = 0.0;
    float tBall = intersectBubbles(p, d, tEnd, eyeDist, firstLeg && gFoot < 0.03, ball, ballFade);
    vec3 trans, upToBall;
    vec3 scat = inscatter(p, d, tEnd, firstLeg ? marchSteps : marchSteps / 2, jitter, tBall, trans, upToBall);
    // Motes are a few millimetres across: they fade out as a pixel grows past a centimetre.
    float snow = 1.0 - smoothstep(0.009, 0.014, gFoot);
    scat += marineSnow(p, d, tEnd, eyeDist, firstLeg && snow > 0.0 ? snowCells : 0) * snow;

    // ---- what it finds there
    vec3 seen = vec3(0.0);       // radiance leaving the hit toward us
    vec3 onward = vec3(0.0);     // share of the throughput that carries on along the reflected ray
    vec3 dNext = d;
    for (int k = 0; k < (kind == 4 ? 1 : 0); k++) {
      seen = shadeFish(hit, d, n, fishQ, fishPart);
    }
    for (int k = 0; k < (kind == 1 ? 1 : 0); k++) {
      float footprint = gPixel * (eyeDist + tEnd);
      vec3 albedo;
      float spread;
      for (int j = 0; j < (rock < 0.0 ? 1 : 0); j++) sandSurface(hit, footprint / (abs(d.y) + 0.08), albedo, n, spread);     // seen at a flat angle a pixel covers a long strip of sand
      for (int j = 0; j < (rock < 0.0 ? 0 : 1); j++) rockSurface(hit, rock, relief, footprint, n, albedo, spread);
      // Looked down on through the waves, or at in the mirror of their underside, the net of
      // light on the bed is a soft dapple, not wire.
      seen = albedo * bedLight(hit, n, rock, spread + (firstLeg ? (fromSurface ? 1.6 : 0.0) : 2.2));
    }
    for (int k = 0; k < (kind == 2 || kind == 3 ? 1 : 0); k++) {
      float lid = 0.0;
      if (kind == 2) {
        n = -vec3(hit.x, 0.0, hit.z) / RADIUS;                      // facing the ray, into the water
      } else {
        vec4 fld = fieldAt(hit.xz);
        // From below the sea is a mirror, and a mirror dimpled by every ripple wraps the
        // bright bed into rings within rings. It is given the shape of the swell (the
        // field's heights, which the ripples do not touch, taken a hand's breadth apart so
        // that the sharpest crests are rounded off too) and a quarter of the ripples.
        const float e = 0.10;
        vec2 swell = vec2(fieldAt(hit.xz + vec2(e, 0.0)).r - fieldAt(hit.xz - vec2(e, 0.0)).r,
                          fieldAt(hit.xz + vec2(0.0, e)).r - fieldAt(hit.xz - vec2(0.0, e)).r) / (2.0 * e);
        vec2 slope = mix(swell, fld.gb, 0.25);
        n = normalize(vec3(slope.x, -1.0, slope.y));
        float facing = dot(d, n);
        if (facing > -0.02) n = normalize(n - d * (facing + 0.02));
        lid = smoothstep(0.22, 0.90, fld.a) * 0.8;      // from below, foam is a pale cloud without edges
      }
      float fres = fresnelDielectric(max(-dot(d, n), 0.0), IOR);
      // The world beyond, softened by the water it is seen through (the blur grows with
      // the depth of water and is never less than a hundredth of the frame). It keeps a
      // little more of its red than Beer-Lambert would leave it, so that a fire seen
      // through the sea still reads as fire and the afterglow as gold, not green.
      float soft = max((0.07 + 0.012 * tEnd) / ((eyeDist + tEnd) * gPixel * uResolution.y), 0.011);
      // A ray that came down through the sea surface and has reached the wall is not let
      // out, nor followed back in. Seen through the waves, the patchwork of what lies
      // beyond each stretch of wall and of what each mirrors turns the top of the sea into
      // marbled glass; closed off with a likeness of the inside it is a sea to look into.
      bool sea = firstLeg && fromSurface;
      bool out1 = fres < 0.999 && !sea && kind == 2 && firstLeg;
      for (int j = 0; j < (out1 && uBlend < 0.5 ? 1 : 0); j++) {
        seen = (1.0 - fres) * world(hit, refract(d, n, IOR), soft, true) * exp(vec3(0.12, 0.015, 0.0) * tEnd);
      }
      // From far off the frame is not read at all: light from behind the pixel is let
      // through by blending instead (see main). Only the share that would have come through
      // sharp: blending cannot spread the rest into a halo, and an engraved line behind the
      // column, let through whole and unbent, reads as a drawing laid over the water.
      if (out1 && uBlend > 0.5) gThrough = 0.4 * (1.0 - fres) * dot(trans * exp(vec3(0.12, 0.015, 0.0) * tEnd), vec3(0.25, 0.5, 0.25));
      // After a reflection inside, the ray is looking at the world in a rippling mirror: the
      // stand-in will do, and it has none of the engraved rings of the film, which every
      // dimple of the sea's underside would otherwise show as a ring of its own.
      for (int j = 0; j < (fres < 0.999 && kind == 2 && !firstLeg ? 1 : 0); j++) {
        seen = (1.0 - fres) * worldStandIn(hit, refract(d, n, IOR), 0.3) * exp(vec3(0.12, 0.015, 0.0) * tEnd);
      }
      for (int j = 0; j < (fres < 0.999 && kind == 3 ? 1 : 0); j++) seen = (1.0 - fres) * skyThroughSea(refract(d, n, IOR));
      dNext = reflect(d, n);
      // The reflected share is followed on the next leg where that will show; a weak one,
      // or any at all from far off, is filled in with the likeness as well. So is the
      // underside of the sea where it is seen at a glancing angle: a rippling mirror looked
      // along holds no picture, only the bright bed wrapped into a ring round every crest.
      float follow = sea || leg == legs - 1 || fres < 0.12 ? 0.0 : 1.0 - gFar;
      if (kind == 3) follow *= smoothstep(0.18, 0.50, -dot(d, n));
      seen += (sea ? 1.0 : fres * (1.0 - follow)) * insideEnv(hit, dNext);
      onward = vec3(fres * follow);
      // Foam seen from below: a pale, milky ceiling lit from above.
      seen = mix(seen, (gMoon * 0.24 + gAmbient * 1.7) * vec3(0.55, 0.85, 0.80), lid);
      onward *= 1.0 - lid;
    }

    // ---- put the segment together, with the nearest bubble laid over it
    vec3 segment = scat + trans * seen;
    if (tBall >= 0.0) {
      vec3 at = p + d * tBall;
      vec3 bn = (at - ball.xyz) / ball.w;
      float cosb = max(-dot(d, bn), 0.0);
      float bf = fresnelDielectric(cosb, IOR);                     // an air bubble is a mirror outside 48.6 degrees
      // At its very rim the mirror shows what lies straight on, which is what is there
      // anyway: the ring melts into the water instead of being drawn round the bubble.
      float cover = bf * ballFade * smoothstep(0.0, 0.42, cosb);
      // The mirror shows the water all round and, on the shoulder that faces it, the moon
      // coming down through the surface: every bubble carries a spark.
      vec3 br = reflect(d, bn);
      vec3 shine = insideEnv(at, br) + gMoon * 1.6 * pow(saturate(dot(br, -uLightDir)), 14.0) * exp(-DOWNWELL * max(LEVEL - at.y, 0.0));
      segment = mix(segment, upToBall + exp(-EXTINCT * tBall) * shine, cover);
      onward *= 1.0 - cover;
    }
    col += thr * segment;
    thr *= trans * onward;
    if (max(thr.r, max(thr.g, thr.b)) < 0.004) break;
    eyeDist += tEnd;
    p = hit + n * 2e-3;
    d = dNext;
    skipSurface = kind == 3;
    jitter = fract(jitter + 0.618);
  }
  return col;
}

// A soft highlight: the GGX lobe of a surface with normal n, seen from v (toward the eye),
// lit from l (toward the light), without the Fresnel factor. Peak 1 / (4 pi rough^4).
float glint(vec3 n, vec3 v, vec3 l, float rough) {
  vec3 h = normalize(v + l);
  float nh = max(dot(n, h), 0.0);
  float a2 = rough * rough * rough * rough;
  float d = nh * nh * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d) * 0.25 * step(0.0, dot(n, l));
}

// Runnels: water that slopped over the lip and is sliding down the outside of the wall.
// The wall is water too, so a runnel is not a white thread on glass: it is a fat bead
// sliding down with a thin film in its wake that pinches into smaller beads as it drains.
// What shows is mostly lens work: the bead bends the view of the inside, its steep rim
// mirrors the sky. Returns the slope of that extra skin of water in the wall's own frame
// (x = round the wall, y = up) and how much water there is (z). footprint = size of a pixel
// on the wall: a film thinner than that is spread over the pixel and flattened to match.
// The CPU (index.js) starts them and keeps the same clock, to ring the film when they land.
vec3 runnels(vec3 pw, float footprint) {
  // Which runnel, if any, passes this spot on the wall: plain arithmetic for every slot,
  // then the meanders and the shapes for that one alone.
  float ang = atan(pw.z, pw.x);
  float near = 0.16;
  vec4 r = vec4(0.0);
  float across = 0.0;
  for (int i = 0; i < (gFoot < 0.02 ? uRunnelsLive : 0); i++) {      // a bead is two centimetres wide
    vec4 ri = uRunnels[i];
    float age = uTime - ri.y;
    float da = ang - ri.x;
    da -= TAU * floor(da / TAU + 0.5);
    float ai = da * RADIUS;                                        // metres round the wall from the runnel
    float head = ri.w - ri.z * age * (0.55 + 0.45 * min(age, 1.0));
    bool here = age > 0.0 && age < 12.0 && abs(ai) < near && pw.y > head - 0.06 && pw.y < ri.w;
    if (here) { near = abs(ai); r = ri; across = ai; }
  }
  vec3 acc = vec3(0.0);
  int found = r.z > 0.0 ? 1 : 0;
  for (int k = 0; k < found; k++) {
    float age = uTime - r.y;
    float seed = fract(r.x * 37.13);
    float head = r.w - r.z * age * (0.55 + 0.45 * min(age, 1.0));   // slow off the lip, then a steady slide
    float tail = r.w - r.z * 0.9 * max(age - 2.0 - 2.5 * seed, 0.0);  // the supply stops; the trail drains from the top
    float v = pw.y - head;                                         // metres above the bead
    if (pw.y > tail) continue;
    // The path: a lazy meander with a nervous one on top, the same for the bead and its wake.
    float wander = 0.030 * sin(pw.y * 3.1 + seed * 40.0) + 0.012 * sin(pw.y * 8.7 + seed * 17.0) + 0.004 * sin(pw.y * 23.0 + seed * 91.0);
    float dwander = 0.093 * cos(pw.y * 3.1 + seed * 40.0) + 0.104 * cos(pw.y * 8.7 + seed * 17.0) + 0.092 * cos(pw.y * 23.0 + seed * 91.0);
    float u = across - wander;

    // The bead: a drop the size of a thumb, blunt below, drawn out above.
    vec2 size = vec2(0.013 + 0.007 * seed, 0.020 + 0.012 * seed);
    size = max(size, vec2(footprint * 1.2));
    float squash = v < 0.0 ? 1.9 : 0.75;
    vec2 q = vec2(u, v * squash) / size;
    float rho2 = dot(q, q);
    if (rho2 < 1.0) {
      float cap = sqrt(1.0 - rho2);
      float shrunk = min(0.013 / size.x, 1.0);                     // drawn bigger than life: flatter and fainter
      float steep = min(0.85 / max(cap, 0.25), 3.0) * shrunk;
      acc.xy -= vec2(q.x, q.y * squash * size.x / size.y) * steep;
      acc.z += (0.35 + 0.65 * cap) * shrunk;
    }
    // The wake: a film a finger wide that thins away from the bead and breaks into pearls.
    if (v > 0.0) {
      float w = max(0.0055 + 0.003 * seed, footprint * 1.1);
      float thin = exp(-v / (0.35 + 0.9 * seed)) * smoothstep(tail, tail - 0.3, pw.y);
      float pearls = smoothstep(-0.2, 0.75, sin(pw.y * (47.0 + 30.0 * seed) + seed * 13.0 + 2.5 * sin(pw.y * 13.0 + seed * 5.0)));
      pearls = mix(1.0, pearls, smoothstep(0.08, 0.5, v));           // whole near the bead, pearled further up
      float uu = u / w;
      if (abs(uu) < 1.6) {
        float film = exp(-uu * uu * 1.7) * thin * pearls * min(0.0055 / w, 1.0);
        acc.xy += vec2(-uu * 1.4, dwander * uu * 0.7) * film;
        acc.z += film * 0.8;
      }
    }
  }
  return acc;
}

void main() {
  vec3 ro = cameraPosition - uOrigin;
  vec3 rd = normalize(vWorldPos - cameraPosition);
  gDetail = saturate(uQuality - 0.3);
  gPixel = 2.0 / (projectionMatrix[1][1] * uResolution.y);
  gMoon = uMoonColor * 1.5;
  gAmbient = skyAmbient(vec3(0.0, 1.0, 0.0));

  // The wall: an upright cylinder of radius RADIUS.
  float a = dot(rd.xz, rd.xz);
  float b = dot(ro.xz, rd.xz);
  float c = dot(ro.xz, ro.xz) - RADIUS * RADIUS;
  float disc = b * b - a * c;
  if (disc <= 0.0 || a < 1e-8) discard;
  float root = sqrt(disc);
  float t0 = (-b - root) / a;
  float t1 = (-b + root) / a;
  if (t1 <= 0.0) discard;
  // Analytic coverage at the silhouette: how far inside the outline the ray passes, in pixels.
  float tMid = -b / a;
  float edge = RADIUS - sqrt(max(dot(ro.xz, ro.xz) - b * b / a, 0.0));
  float cover = saturate(edge / (gPixel * max(tMid, 0.1)));
  gFoot = gPixel * tMid;
  gFar = smoothstep(0.008, 0.014, gFoot);

  // Dither for every march in the column. It moves on with the frame, so the eye averages
  // it into the grain of the picture instead of reading it as a weave.
  float jitter = hash12(gl_FragCoord.xy + fract(uFrame * 0.61803) * 137.0);
  gJitter = jitter;

  // Where the ray first meets water: the wall, or, coming in over the lip, the sea itself.
  // (within: a camera placed inside the wall's radius by hand. The rig never goes there, but
  // the view from there should still be a view.)
  bool within = t0 <= 0.0;
  float tWall = max(t0, 0.0);
  vec3 pw = ro + rd * tWall;
  float lip = surfaceY(pw.xz);
  float over = pw.y - lip;                         // > 0: the ray passes above the water at the wall
  float tGraze, graze = 1e3;
  float tTop = surfaceFromAbove(ro, rd, tWall, t1, over > 0.0 ? int(mix(16.0, 44.0, gDetail) * mix(1.0, 0.6, gFar)) : -1, tGraze, graze);
  if (over > 0.0 && tTop < 0.0) {
    // Clears the sea altogether. Within a pixel of the lip, fade the wall in instead of
    // cutting it; within a pixel of a crest, fade the sea in.
    float px = gPixel * tWall;
    if (over <= px) {
      cover *= 1.0 - over / px;
      pw.y = lip - 1e-3;
      over = -1.0;
    } else if (graze < 1.0) {
      cover *= 1.0 - graze;
      tTop = tGraze;
    } else {
      discard;
    }
  }
  bool top = over > 0.0;                         // in through the sea surface, not through the wall
  bool sunk = within && !top;                    // the eye itself is under water
  // The foot of the wall: a ray that would meet it below the film has met the film first.
  // The last pixel above the film is faded in.
  float foot = pw.y / (gPixel * max(tWall, 0.3));
  if (!top && !sunk && foot < 0.0) discard;
  if (!top) cover *= saturate(0.5 + 0.5 * foot);
  float tHit = top ? tTop : tWall;
  vec3 first = top ? ro + rd * tTop : pw;        // first point of water on the ray: depth is written there
  if (sunk) first = ro + rd * 0.35;
  gFrontZ = -(viewMatrix * vec4(first + uOrigin, 1.0)).z - 0.05;
  gThrough = 0.0;

  vec3 n = vec3(0.0, 1.0, 0.0);  // the normal the ray is bent by
  float fres = 0.0;             // the share of the pixel that is mirror
  vec3 mirrored = vec3(0.0);    // what the mirror shows
  vec3 added = vec3(0.0);       // light the water adds of itself: glints on beads, crests lit through
  vec4 lather = vec4(0.0);      // foam: its colour, and how much of the pixel it covers
  vec3 toFire = uFireLightPos - uOrigin - first;
  float fd2 = dot(toFire, toFire);
  for (int k = 0; k < (top || sunk ? 0 : 1); k++) {
    // ---- the wall
    n = vec3(pw.x, 0.0, pw.z) / RADIUS;
    vec3 wet = runnels(pw, gPixel * t0 * 0.8);
    n = normalize(n - vec3(-n.z, 0.0, n.x) * wet.x - vec3(0.0, 1.0, 0.0) * wet.y);
    float cosi = -dot(rd, n);
    if (cosi < 0.04) { n = normalize(n - rd * (0.04 - cosi)); cosi = -dot(rd, n); }   // a rim seen from behind still faces the eye
    fres = fresnelDielectric(max(cosi, 0.0), 1.0 / IOR);
    // What the outside of the wall mirrors: face on, two parts in a hundred of whatever
    // is behind the eye; on the flanks, where it turns into a mirror, the frame beyond.
    for (int j = 0; j < (uBlend < 0.5 ? 1 : 0); j++) mirrored = world(pw, reflect(rd, n), 0.0, false);
    for (int j = 0; j < (uBlend < 0.5 ? 0 : 1); j++) mirrored = worldStandIn(pw, reflect(rd, n), 0.0);
    // A bead is a little lens: it gathers the moon, the afterglow and the pyre into a
    // glint, and its skin is never quite clean, so it holds a breath of sky light too.
    float wetness = min(wet.z, 1.0);
    added = wetness * (max(fres, 0.03) * (
          uMoonColor * 1.5 * glint(n, -rd, uMoonDir, 0.22)
        + uSunColor * 0.8 * glint(n, -rd, normalize(vec3(uSunDir.x, 0.10, uSunDir.z)), 0.34)
        + uFireLightColor / (fd2 + 1.0) * glint(n, -rd, toFire * inversesqrt(fd2), 0.28))
        + skyAmbient(n) * 0.17);
  }
  for (int k = 0; k < (top ? 1 : 0); k++) {
    // ---- the sea surface
    vec4 fld = fieldAt(first.xz);
    // Size of a pixel on the sea (m): across the line of sight, and along it, where a
    // slope that turns away from the eye lets one pixel take in a long strip of water.
    float slant = max(-dot(rd, normalize(vec3(-fld.g, 1.0, -fld.b))), 0.0);
    float across = gPixel * tTop;
    float footprint = across / sqrt(max(slant, 0.012));
    // Ripples are filtered by the long side of the pixel: read finer they would sparkle like sandpaper.
    vec3 micro = microSlope(first.xz, across / max(slant, 0.10), 0.0);
    vec2 slope = fld.gb + micro.xy;
    n = normalize(vec3(-slope.x, 1.0, -slope.y));
    float facing = dot(rd, n);
    if (facing > -0.03) n = normalize(n - rd * (facing + 0.03));    // seen edge-on, a facet must still face the eye
    // Roughness: the ripples a pixel can no longer tell apart blur what the sea mirrors.
    float alpha = clamp(0.012 + 5.0 * footprint * micro.z, 0.012, 0.24);
    float cosi = max(-dot(rd, n), 0.0);
    // A ruffled sea never becomes the perfect mirror at a glancing angle that flat water
    // does: the facets that face the eye are the steep ones. Without the floor every slope
    // that turns away is rimmed with a thin line of sky.
    fres = fresnelDielectric(max(cosi, 0.16 + alpha * 0.8), 1.0 / IOR);
    // Glitter is what ripples below the pixel do, so its normal is deliberately read
    // finer than the pixel can resolve: each pixel catches a light or misses it, and the
    // path of the moon breaks into sparks.
    vec2 spark = fld.gb + microSlope(first.xz, footprint, 3.0).xy * 1.5;
    vec3 ns = normalize(vec3(-spark.x, 1.0, -spark.y));
    vec3 rr = reflect(rd, n);
    // Where a slope turns away from the eye the mirrored ray runs on low over the sea
    // and meets the next wave, not the sky: there the water mirrors water. Without this
    // every crest would be outlined by a bright line of horizon.
    float open = smoothstep(0.0, 0.22, rr.y);
    rr.y = abs(rr.y);
    // The sky in a ruffled mirror. Ripples far too small to draw tilt the water by several
    // degrees either way, so the sea never shows the horizon as a line: the afterglow lies
    // on the slopes that face it as a sheen. (Cube level 3.4 is a blur of about four
    // degrees; it grows as the ripples that can be drawn shrink below a pixel.)
    mirrored = envColor(rr, clamp(log2(alpha * 327.0) + 1.5, 3.4, 6.5) / 6.0);
    float sharp = clamp(alpha * 0.45, 0.022, 0.09);
    vec3 toFlash = uFlash.xyz - uOrigin - first;
    vec3 lights = uMoonColor * 1.5 * glint(ns, -rd, uMoonDir, sqrt(sharp))
                + uFireLightColor / (fd2 + 1.0) * glint(ns, -rd, toFire * inversesqrt(fd2), sqrt(sharp + 0.07))
                + flashIntensity() / (dot(toFlash, toFlash) + 1.0) * glint(ns, -rd, normalize(toFlash), sqrt(sharp + 0.05));
    mirrored += min(lights / max(cosi, 0.12), vec3(40.0));
    fres *= open;
    // The foam field is smooth-edged (it is diffused as it ages). Read through a slow warp
    // it gets what foam has: tongues, bays, islands.
    vec4 wob = noiseTexLod(vec3(first.xz * 0.23, 0.17 + uTime * 0.012), 0.0);
    float foam = fieldAt(first.xz + (vec2(wob.r, wob.b) - 0.5) * vec2(0.44, 0.32)).a;
    // Moonlight and afterglow bleeding through the thin water of a crest. It shows where a
    // crest is seen edge on, with the light behind it; keyed on height alone it would paint
    // contour lines on the sea when looked at from above. And under and around foam the
    // water is full of fine bubbles: milky turquoise.
    float thin = smoothstep(0.03, 0.30, fld.r) * sq(1.0 - cosi);
    float backlit = sq(saturate(0.35 + 0.65 * dot(rd, uMoonDir)));
    float warm = sq(saturate(dot(normalize(rd.xz + 1e-5), normalize(uSunDir.xz))));
    added = (1.0 - fres) * (thin * (vec3(0.03, 0.30, 0.28) * uMoonColor * (0.25 + backlit) + vec3(0.14, 0.20, 0.06) * warm * 0.6) * 1.6
          + vec3(0.03, 0.17, 0.16) * (gMoon * 0.5 + gAmbient * 2.0) * smoothstep(0.15, 0.70, foam)
          // The top hand's breadth of a sea is full of fine air and scatters more than the
          // deep: under the moon the surface is a shade brighter than what lies below it.
          + vec3(0.010, 0.040, 0.042) * (gMoon * 0.6 + gAmbient));
    // The foam itself: sky-lit white, a little translucent and greener where it thins.
    vec2 froth = foamLook(first.xz, fld.gb, foam, footprint);
    vec3 foamLight = airLight(first, normalize(n + vec3(0.0, 0.8, 0.0)));
    lather = vec4(mix(vec3(0.58, 0.84, 0.82), vec3(0.90, 0.93, 0.95), smoothstep(0.25, 0.9, froth.x)) * foamLight * froth.y, froth.x);
    // What is seen through the surface is bent by the swell and the larger ripples only:
    // bent by every last wrinkle, the inside of the sea turns to marble.
    n = normalize(vec3(-(fld.gb + micro.xy * 0.4), 1.0).xzy);
    facing = dot(rd, n);
    if (facing > -0.03) n = normalize(n - rd * (facing + 0.03));
  }
  vec3 din = sunk ? rd : refract(rd, n, 1.0 / IOR);
  vec3 start = sunk ? ro : first + din * (top ? 0.02 : 2e-3);
  vec3 inWater = traceInside(start, din, sunk ? 0.0 : tHit, jitter, top);
  vec3 col = mix(inWater, min(mirrored, vec3(16.0)), fres) + added;
  col = mix(col, lather.rgb, lather.a);


  // The colour goes out premultiplied and is blended over the frame. Close by, alpha is the
  // coverage: it only softens the silhouette, the lip and the foot, and what is seen
  // through the water has been read out of the frame, refracted. From far off (uBlend) the
  // column is drawn a stage earlier, where the pipeline need not copy the whole frame for
  // it, and alpha also lets through what stands behind each pixel: unbent, which at that
  // size cannot be told from bent.
  float alpha = cover * (1.0 - gThrough * (1.0 - fres) * (1.0 - lather.a));
  vec4 clip = projectionMatrix * viewMatrix * vec4(first + uOrigin, 1.0);
  gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(max(col, vec3(0.0)) * cover, alpha);
}
`;
