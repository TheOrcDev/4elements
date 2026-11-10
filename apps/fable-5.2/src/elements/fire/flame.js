import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { shared } from '../../core/shared.js';
import { createVolumeMaterial } from '../../core/materials.js';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FIRE_GLSL, FIRE_Y0, WORLD_VERT } from './common.js';
import { FUEL_FIELD } from './fuel.js';

// The flame and its smoke: one raymarched medium of soot. (And, at the end of the file, the
// glow of the air around the fire, which is not marched at all.)
//
// A sooty flame is a cloud of carbon particles. Where they are hot they glow like a black
// body; where they have cooled they are simply black smoke. So the shader marches a single
// medium with two properties, soot extinction and temperature, and gets both phenomena, and
// the passage from one to the other, out of the same field.
//
// The field is not simulated: it is built in the travel-time coordinate of a buoyant plume
// (see fireTravelTime in common.js). A parcel of gas is identified by where and when it left
// the fuel bed; noise looked up at that identity gives it a "richness". The parcel burns
// until it has aged past what its richness allows. Low down most of them burn; higher up
// only the rich pockets are left, each stretched by the accelerating flow, and they pinch
// off from the body, shrink and go out one by one.
//
// Soot does not glow throughout a tongue of flame. It burns in thin sheets where fuel meets
// air: the skin of each tongue, and folds of that skin drawn into its interior. A sheet is
// far thinner than a marching step, so sampling it would turn it into flickering grain.
// Instead each step integrates the sheet profile in closed form between the field values
// at its two ends (the fields are close to linear over a step). Sheets stay crisp at any
// step length, and edge-on they are the bright filaments that make a flame look like one.
//
// What the march costs is decided by the distance it is seen from: the noise is read from
// the mip level whose texels match a pixel, and the steps grow with the pixel too, so the
// fire costs a fraction from across the water of what it does in close-up, and looks the same.

// Bounding volumes, local space, metres. The shaders and the proxy geometry both read them.
const FLAME = { radius: 2.7, top: 8.2 };               // upright cylinder from the bed
const SMOKE = { radius: 2.6, y0: 4.4, y1: 12.3 };      // cylinder sheared along the wind
const HALO = { y: 2.4, radius: 7.5 };                  // sphere of warm air glow

const f3 = (x) => x.toFixed(3);

/** The bounds as GLSL, and the shear of the smoke column. Vertex and fragment. */
const BOUNDS_GLSL = /* glsl */ `
const float FLAME_R = ${f3(FLAME.radius)};
const float FLAME_TOP = ${f3(FLAME.top)};
const float SMOKE_R = ${f3(SMOKE.radius)};
const float SMOKE_Y0 = ${f3(SMOKE.y0)};
const float SMOKE_Y1 = ${f3(SMOKE.y1)};

// The smoke leans with the wind, more with height. Its bounding cylinder follows: the
// axis at height y stands at base + rate * y, a straight line from the plume's lean at
// the foot of the cylinder to its lean at the top (a shear, which keeps rays straight).
void smokeShear(out vec2 base, out vec2 rate) {
  vec2 leanA = fireLean(SMOKE_Y0 - FIRE_Y0), leanB = fireLean(SMOKE_Y1 - FIRE_Y0);
  rate = (leanB - leanA) / (SMOKE_Y1 - SMOKE_Y0);
  base = leanA - rate * SMOKE_Y0;
}
`;

// The proxy is the two bounds as two convex shapes in one mesh: the flame cylinder, and the
// smoke cylinder, sheared here exactly as the fragment shader shears its bound.
const FLAME_VERT = /* glsl */ `
${VERT_PRELUDE}
${FIRE_GLSL}
${BOUNDS_GLSL}
attribute float aPart;           // 0: flame cylinder, 1: smoke column
varying vec3 vWorldPos;
varying float vPart;
void main() {
  vec3 p = position;
  if (aPart > 0.5) {
    vec2 base, rate;
    smokeShear(base, rate);
    p.xz += base + rate * p.y;
  }
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vPart = aPart;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FLAME_FRAG = /* glsl */ `
${FRAG_PRELUDE}
${FIRE_GLSL}
${BOUNDS_GLSL}
uniform sampler3D uFuelField;    // where the flames take root: r richness, g rise since the fuel (see fuel.js)
const vec3 FUEL_MIN = vec3(${FUEL_FIELD.min.map((v) => v.toFixed(3)).join(', ')});
const vec3 FUEL_SIZE = vec3(${FUEL_FIELD.size.map((v) => v.toFixed(3)).join(', ')});
const float FUEL_RISE = ${FUEL_FIELD.rise.toFixed(3)};
// Height above the bed up to which the flames remember the fuel they stand on.
const float FUEL_REACH = ${(FUEL_FIELD.min[1] + FUEL_FIELD.size[1] - FIRE_Y0 - 0.02).toFixed(3)};
varying vec3 vWorldPos;
varying float vPart;             // which proxy drew this fragment: 0 the flame cylinder, 1 the smoke column

// A fixed rotation between the flow and the lattice of the noise texture. Without it the
// texture's period would show as the same tongue rising twice side by side, and the whole
// field would repeat every time the flow has scrolled through one period.
const mat3 ROT = mat3(0.36, 0.48, -0.80, -0.80, 0.60, 0.00, 0.48, 0.64, 0.60);

// How fast the two sheet fields change across a sheet, per metre (typical values). They
// turn the size of a pixel into field units, so no sheet is drawn thinner than a pixel.
const float GRAD_D = 7.0;
const float GRAD_F = 3.5;
// The skin of a tongue in units of the burn field d: it starts just outside d = 0, peaks
// a little way in and tails off into the tongue.
const float SKIN_OUT = 0.09, SKIN_PEAK = 0.05, SKIN_IN = 0.26;
// Half-width of an inner fold in units of the fold field.
const float FOLD_W = 0.06;

// Height above the bed, per unit of burn level, at which the last flames go out.
const float TIP_H = 6.2;

// One texel of the noise texture at the scale the first lookup reads it, in metres (128
// texels to a period, which spans 1 / 0.70 plume radii).
const float TEXEL = 0.009;

// Set once per pixel: the travel time to the height where the last flames go out, and the
// parts of the smoke's lighting that do not change along a ray.
float gTipTime;
vec3 gFlameAt;
vec3 gSmokeAmbient;

// Source radiance of glowing soot at temperature T. A true black body brightens a thousand
// times between 1300 K and 2300 K; this gentler power law keeps the cool red tips on screen
// next to a core that is still fifty times brighter. The colour is the core's blackbody()
// over the range a wood fire spans (850 to 2750 K), where red is 1, green is all but linear
// in T and blue a parabola that starts at 1900 K: fitted (to half a percent), so that a
// march step pays no logarithms or powers for it.
vec3 sootGlow(float T) {
  float s = (T - 850.0) / 1400.0;
  float x = saturate(s);
  float b = max(s - 0.75, 0.0);
  return vec3(1.0, 0.0244 + s * (0.2757 + 0.0034 * s), 0.30 * b * b) * (21.0 * x * x * x);
}

// Mean over [x0, x1] of the triangular bump that is 0 at a, 1 at b and 0 again at c.
float triInt(float x, float a, float b, float c) {
  float u = clamp(x, a, b) - a, v = clamp(x, b, c) - b;
  return u * u / (2.0 * (b - a)) + v - v * v / (2.0 * (c - b));
}
float triMean(float x0, float x1, float a, float b, float c) {
  float dx = x1 - x0;
  if (abs(dx) < 2e-3) {
    float x = 0.5 * (x0 + x1);
    return max(min((x - a) / (b - a), (c - x) / (c - b)), 0.0);
  }
  return (triInt(x1, a, b, c) - triInt(x0, a, b, c)) / dx;
}

struct Medium {
  float d;        // burn field: > 0 inside a tongue of flame, -9 where nothing can burn
  float f;        // fold field: 0 on a sheet folded into the tongue (valid where d > -0.4)
  float gain;     // extinction (1/m) of a sheet of burning soot here
  float T;        // its temperature, kelvin
  float root;     // 1 where a flame is rooted on the fuel and too young to hold soot
  float cold;     // extinction (1/m) of soot that has cooled to smoke
  float side;     // -1 on the side of the column away from the moon, 1 on the side facing it
  float skip;     // metres the march may safely stride from here (0: take an ordinary step)
};

Medium fireMedium(vec3 l, float lod) {
  Medium m = Medium(-9.0, 0.0, 0.0, 300.0, 0.0, 0.0, 0.0, 0.12);
  float h = l.y - FIRE_Y0;
  if (h < 0.0) return m;
  // Below the rim the gas is confined by the plate of the bowl.
  if (l.y < RIM_Y && l.y < bowlInnerY(length(l.xz)) + 0.03) return m;
  // Empty space is crossed in a few long strides: nothing burns or smokes outside a cone
  // drawn generously around the leaning column, so the distance to that cone is safe to skip
  // (scaled down for how fast the cone itself can shift along a steep ray).
  vec2 lean = fireLean(h);
  float gap = length(l.xz - lean) - max(1.95 - 0.5 * h, 1.5 + 0.15 * h);
  if (gap > 0.0) { m.skip = gap * 0.75; return m; }
  float burn = uFireState.x;
  float tau = fireTravelTime(h);
  float s = tau - uTime;                       // constant for a parcel as it rises

  // Axis of the plume: the wind's lean plus kinks that are carried up with the gas.
  vec2 kink = vec2(sin(s * 2.1 + 0.7), cos(s * 1.7 + 1.1));
  vec2 off = l.xz - lean - (0.045 + 0.06 * h) * kink;
  // Large fires puff: ring vortices form at the rim about once a second and ride up the
  // column, so the flame bulges and necks in a travelling wave. The rings are never level:
  // one side leads (which side keeps changing), so the bulges climb lopsided.
  float puff = sin(TAU * (uFireState.z - 0.95 * tau) + 1.2 * dot(off, kink));
  float R = firePlumeRadius(h) * (0.88 + 0.12 * burn)
          * (1.0 + 0.20 * puff * smoothstep(0.1, 0.8, h) * (1.0 - smoothstep(2.6, 5.2, h)));
  vec2 c = off / R;                            // position across the plume, 1 at its edge
  float rho2 = dot(c, c);
  if (rho2 > 2.4) { m.skip = (sqrt(rho2) - 1.549) * R * 0.6; return m; }
  m.skip = 0.0;
  m.side = dot(c, uMoonDir.xz) * inversesqrt(max(dot(uMoonDir.xz, uMoonDir.xz) * max(rho2, 1.0), 1e-4));

  // Low in the fire the flames are still individuals, each standing on the timber or the
  // patch of coals that feeds it: the fuel field says how rich the gas is here and how far it
  // has risen since it left its fuel. Away from any fuel nothing burns down at the bed.
  float bed = exp(-h * 1.8);
  float rooted = max(bed - 0.15, 0.0) / 0.85;  // 1 at the bed, 0 from about a metre up
  float fuel = 0.0, young = 0.0;
  if (h < FUEL_REACH) {
    vec2 ff = textureLod(uFuelField, (l - FUEL_MIN) / FUEL_SIZE, 0.0).rg;
    float w = 1.0 - smoothstep(1.3, FUEL_REACH, h);
    fuel = ff.r * w;
    young = (1.0 - smoothstep(0.03, 0.24, ff.g * FUEL_RISE)) * smoothstep(0.04, 0.30, fuel);
  }
  float rootBias = fuel * 0.85 - 0.50 * rooted;
  // Only above the pile does turbulence take hold: a slow, large swirl that displaces the
  // lookup sideways, more with height (a few sines are enough for it, and cheaper than
  // another noise fetch).
  if (h > 1.05) {
    float ang = 2.6 * sin(l.x * 1.07 + s * 0.76 + 1.3) + 2.4 * sin(l.z * 1.19 - s * 0.57) + s * 0.3;
    float reach = 0.30 + 0.12 * sin(l.x * 2.3 - l.z * 1.7 + s * 1.1);
    c += vec2(cos(ang), sin(ang)) * reach * (0.10 + 0.085 * h) * smoothstep(1.05, 1.7, h) / R;
  }

  // Identity of the parcel: where across the bed it started and when it left.
  vec3 q = vec3(c.x * 0.70, s * 0.64, c.y * 0.70);
  vec4 n = noiseTexLod(ROT * q + vec3(uTime * 0.019, 0.0, -uTime * 0.014), lod);

  float u = tau / gTipTime;                    // age: 1 where the last flames go out
  float rich = 0.5 + (n.r - 0.5) * 2.9 + (n.g - 0.45) * 0.45 + rootBias;

  if (u < 1.3) {
    // The parcel burns while its richness exceeds a bar that rises with age and toward
    // the cold edge of the plume. d > 0 is inside a flame, d = 0 its surface. The bar is
    // never so low that everything burns: the body of the fire is a crowd of separate
    // tongues with air between them, and a ray through it crosses several. At the bed
    // itself the flames are fewer still, and they stand inside the bowl.
    // (the last two terms close the field before the bounds of the plume cut it off)
    float d = rich - (0.05 + 0.78 * u * u + 0.30 * rho2 + bed * (0.42 + 2.0 * max(rho2 - 0.9, 0.0))
                      + 2.5 * smoothstep(1.75, 2.4, rho2) + 8.0 * sq(max(u - 1.05, 0.0)));
    m.d = d;
    if (d > -0.4) {
      // The second fetch: fine wrinkles for the skin (b), the folds inside the tongue (r)
      // and hotter and cooler stretches along a sheet (g), all drawn out along the flow.
      // It reads the texture at twice the scale, so from one mip level further up; the
      // rippled, blurred reflection in the water does without it.
      vec4 n2 = vec4(0.5);
      if (uIsMirrorPass < 0.5) n2 = noiseTexLod(ROT * vec3(q.x * 2.1, q.y * 1.5, q.z * 2.1) + vec3(0.0, uTime * 0.04, 0.0), lod + 1.0);
      m.d = d + (n2.b - 0.5) * 0.30;
      m.f = n.g - 0.47 + (n2.r - 0.5) * 0.45;
      // The gas needs a little height above the fuel before it burns in earnest: over the
      // open bed that is height above the coals, on a timber the rise since it left the wood.
      float lift = smoothstep(0.12, 1.5, h + (rich - 0.5) * 0.6);
      float foot = bed * bed * (1.0 - lift);
      lift = max(lift, 0.80 * smoothstep(0.08, 0.50, fuel)) * (1.0 - 0.85 * young);
      // Hottest just above the fuel, cooling as the parcel radiates and mixes with air.
      // The heart of the fire, low on the axis, is hotter again by several hundred kelvin,
      // but not evenly: the white heat sits in the cores of the billows, and the sheets
      // between them stay orange, so the body of the fire keeps its structure instead of
      // burning out into one bright wall.
      float heart = smoothstep(0.08, 0.30, u) * (1.0 - smoothstep(0.30, 0.70, u)) * (1.0 - smoothstep(0.0, 0.7, rho2))
                  * (0.30 + 0.70 * smoothstep(0.36, 0.60, n.g));
      float fresh = saturate(1.0 - u);
      m.T = 1180.0 + 560.0 * fresh * (0.9 + 0.1 * fresh) + 700.0 * heart - 400.0 * max(u - 1.0, 0.0)
          + (n.g - 0.45) * 460.0 + (n2.g - 0.5) * 200.0;
      m.gain = lift * (2.1 + 2.9 * heart);
      m.root = max(foot, young * (0.10 + 0.40 * bed));
    } else {
      m.skip = min((-d - 0.25) / 7.0, 0.22);   // well outside any tongue: nothing close by
    }
  }

  // Smoke: the soot of parcels that have burnt out, billowing, thinning as the plume
  // spreads and gone by eleven or twelve metres.
  float gate = smoothstep(0.70, 1.15, u + (0.5 - rich) * 0.35);
  if (gate > 0.0) {
    float body = saturate(n.g * 2.3 - 0.95 + (1.0 - rho2) * 0.50 - n.a * 0.35);
    float thin = min(sq(firePlumeRadius(4.0) / firePlumeRadius(h)), 1.0);
    m.cold = gate * body * 1.25 * thin * (1.0 - smoothstep(8.2, 11.6, h));
    m.skip = 0.0;
  }
  return m;
}

// Light scattered by the smoke: the flame below it, the moon on one side, the sky all round.
vec3 smokeLight(vec3 l, float side) {
  vec3 toFlame = gFlameAt - l;
  // The smoke between here and the flame takes most of that light on the way up.
  vec3 fire = uFireLightColor / (dot(toFlame, toFlame) + 1.5) * exp(-max(l.y - 4.2, 0.0) * 0.55);
  // The far side of the column stands in its own shadow.
  vec3 moon = uMoonColor * exp(-2.2 * (0.5 - 0.5 * side));
  return fire * 0.075 + moon * 0.028 + gSmokeAmbient;
}

// Marches the fire along one ray and adds it to what the ray has gathered so far (col,
// trans). fa: where the ray crosses the flame's bounding cylinder. pixel: the size of a
// pixel at one metre. tFront: distance to the first soot.
void marchFire(vec3 ro, vec3 rd, vec2 fa, float tScene, float quality, float pixel, inout vec3 col, inout float trans, out float tFront) {
  tFront = -1.0;
  // Shearing space by the lean keeps the ray straight, so the same intersection works.
  vec2 base, rate;
  smokeShear(base, rate);
  vec3 sro = vec3(ro.x - base.x - rate.x * ro.y, ro.y, ro.z - base.y - rate.y * ro.y);
  vec3 srd = vec3(rd.x - rate.x * rd.y, rd.y, rd.z - rate.y * rd.y);
  vec2 sb = cylinderIntersect(sro, srd, vec3(0.0), SMOKE_R, SMOKE_Y0, SMOKE_Y1);

  float a0 = max(fa.x, 0.0), a1 = min(fa.y, tScene);
  float b0 = max(sb.x, 0.0), b1 = min(sb.y, tScene);
  bool hitA = a1 > a0, hitB = b1 > b0;
  if (!hitA && !hitB) return;
  float t0 = hitA ? (hitB ? min(a0, b0) : a0) : b0;
  float t1 = hitA ? (hitB ? max(a1, b1) : a1) : b1;

  // The footprint of a pixel where the ray enters the fire decides how much of the field
  // can be seen at all. The noise is read from the mip level whose texels match it: finer
  // octaves would only alias into grain, and they are what a march pays most for (a 3D
  // lookup that lands on scattered texels misses the cache every time). The reflection,
  // blurred again by the water, reads one level further up.
  float foot = max(t0, 0.5) * pixel;
  float lod = log2(max(foot / TEXEL, 1.0)) + uIsMirrorPass;
  // Fine steps inside the flame: 5.6 cm from close by, and never finer than three and
  // three quarter pixels, which the closed-form sheets do not need. Long strides through
  // the empty part of the bounds and through the soft smoke: eleven or so to cross it, no
  // shorter than 22 cm or six pixels. Steep rays have further to go, so their steps stretch.
  float dtFine = max(0.056, 3.75 * foot) / (quality * max(length(rd.xz), 0.35));
  float dtCoarse = max(min((b1 - b0) / (11.0 * quality), 0.6), max(0.22, 6.0 * foot) / quality);
  float flameTop = TIP_H * uFireState.x + 0.7;
  // The start of the march is dithered per pixel and re-dealt every frame (a golden-ratio
  // shift keeps each pixel's offsets evenly spread over time), so what remains of the
  // stepping is fine, flickering grain instead of a fixed weave across the flame's edges.
  float t = t0 + fract(ign(gl_FragCoord.xy) + hash12(gl_FragCoord.xy) * 0.5 + 0.618034 * mod(uFrame, 256.0)) * dtFine;
  int maxSteps = int(64.0 * quality);
  tFront = t1;
  float pd = -9.0, pf = 0.0, tPrev = t;         // the fields at the previous sample, and where it was
  for (int i = 0; i < maxSteps; i++) {
    if (t >= t1) break;
    // What little would still come through 4% transmittance is not worth marching for.
    if (trans < 0.04) { trans = 0.0; break; }
    bool inA = hitA && t >= a0 && t <= a1;
    bool inB = hitB && t >= b0 && t <= b1;
    if (!inA && !inB) {
      // Between the two bounds: hop to whichever starts next.
      t = (hitA && t < a0) ? a0 : ((hitB && t < b0) ? b0 : t1);
      pd = -9.0;
      continue;
    }
    vec3 l = ro + rd * t;
    bool fine = inA && (l.y - FIRE_Y0) < flameTop;
    float dt = fine ? dtFine : dtCoarse;
    Medium m = fireMedium(l, fine ? lod : max(lod, 1.0));

    // Sheets are integrated over the stretch since the previous sample (which a stride
    // may have made longer than one step), everything else is sampled here.
    float seg = pd > -8.0 ? t - tPrev : dt;
    float hot = 0.0, fog = 0.0, blue = 0.0;
    if (m.d > -0.4) {
      // No sheet thinner than a pixel: widen it and dim it by as much.
      float px = t * pixel;
      float wOut = max(SKIN_OUT, px * GRAD_D), wIn = max(SKIN_IN, 2.0 * px * GRAD_D);
      float kf = max(1.0, px * GRAD_F / FOLD_W * 1.2);
      float skin = triMean(pd > -8.0 ? pd : m.d, m.d, SKIN_PEAK - wOut, SKIN_PEAK, SKIN_PEAK + wIn)
                 * ((SKIN_OUT + SKIN_IN) / (wOut + wIn));
      float inner = smoothstep(0.10, 0.36, m.d);
      float fold = triMean(pd > -0.4 ? pf : m.f, m.f, -FOLD_W * kf, 0.0, FOLD_W * kf) / kf;
      // A flame stands off from what it burns on: the gas next to a log or the coals is
      // fuel that has not met its air yet. Only the skins of the flames come close; their
      // glowing interiors keep further away, which lets the timbers show through the fire.
      float ahead = tScene - t;
      float body = m.gain * smoothstep(0.03, 0.45, ahead);
      hot = skin * 1.1 * m.gain * smoothstep(0.0, 0.08, ahead) + inner * fold * body;
      // Between the sheets the tongue is filled with thinner, cooler, redder soot.
      fog = inner * 0.10 * body;
      // Where a flame is rooted on the fuel its skin is too young to hold soot: it burns blue.
      blue = skin * m.root * smoothstep(0.02, 0.30, ahead);
    }
    pd = m.d; pf = m.f; tPrev = t;

    float cold = m.cold * (1.0 - saturate(hot + fog));
    float tau = hot * seg + (fog + cold) * dt;
    if (tau > 1e-5) {
      tFront = min(tFront, t);
      vec3 source = vec3(0.0);
      if (hot + fog > 0.0) source = (hot * seg + fog * dt * vec3(0.42, 0.28, 0.10)) * sootGlow(m.T) * uFireState.y;
      if (cold > 0.0) source += cold * dt * smokeLight(l, m.side);
      float a = 1.0 - exp(-tau);
      col += trans * a * source / tau;
      trans *= 1.0 - a;
    }
    col += trans * blue * vec3(0.10, 0.28, 1.0) * (0.9 * seg);
    // Deeper in, what the ray still gathers counts for less (it is weighted by the
    // transmittance left), so the steps grow as the flame in front closes over the rest.
    t += max(fine ? dt * (2.0 - trans) : dt, m.skip);
  }
}

void main() {
  vec3 ro = cameraPosition - uFireOrigin;
  vec3 rd = normalize(vWorldPos - cameraPosition);
  // Every pixel is shaded by one proxy only: by the flame cylinder where its ray crosses
  // that bound, by the smoke column where it does not (the two overlap on screen, and
  // drawn twice the fire would add up).
  vec2 fa = cylinderIntersect(ro, rd, vec3(0.0), FLAME_R, FIRE_Y0, FLAME_TOP);
  bool inFlame = fa.y > max(fa.x, 0.0);
  if ((vPart > 0.5) == inFlame) discard;

  float tScene = sceneRayDistance(screenUV(), rd);
  gTipTime = fireTravelTime(TIP_H * uFireState.x);
  vec2 lean = fireLean(3.0);
  gFlameAt = vec3(lean.x, 3.4, lean.y);
  gSmokeAmbient = skyAmbient(vec3(0.0, 1.0, 0.0)) * 0.03;

  vec3 col = vec3(0.0);
  float trans = 1.0;
  float tFront;                                 // distance to the first soot along the ray
  // The reflection in the water is half the size and rippled: it gets by on fewer steps.
  float quality = max(uQuality, 0.3) * mix(1.0, 0.7, uIsMirrorPass);
  // Size of a pixel of this buffer at one metre.
  float pixel = 2.0 * uProjectionMatrixInverse[1][1] / uResolution.y;
  marchFire(ro, rd, fa, tScene, quality, pixel, col, trans, tFront);
  gl_FragColor = vec4(col, 1.0 - trans);

  // The mirror pass has no depth texture to clip the march with; it depth-tests this
  // fragment instead. Tested at the proxy's far side, any log standing inside the flame
  // would punch a hole through its reflection, so there the fragment is moved to where
  // the ray first meets soot: what stands in front of the fire still hides it.
  float depth = gl_FragCoord.z;
  if (uIsMirrorPass > 0.5 && tFront > 0.0 && trans < 1.0) {
    float viewZ = max(tFront * dot(rd, cameraForward()), uCameraNear);
    float ndc = (uCameraFar + uCameraNear - 2.0 * uCameraNear * uCameraFar / viewZ) / (uCameraFar - uCameraNear);
    depth = ndc * 0.5 + 0.5;
  }
  gl_FragDepth = depth;
}
`;

/** The flame and its smoke as one mesh on the VOLUME layer. */
export function createFlame(ctx, fireUniforms, fuelField) {
  const material = createVolumeMaterial({
    vertexShader: FLAME_VERT,
    fragmentShader: FLAME_FRAG,
    uniforms: { ...fireUniforms, uFuelField: { value: fuelField } },
  });
  // The two proxies, each a little larger than the bound it stands for, because a faceted
  // cylinder lies inside the round one.
  const cylinder = (radius, y0, y1, part) => {
    const geometry = new THREE.CylinderGeometry(radius * 1.03, radius * 1.03, y1 - y0 + 0.1, 16, 1, false);
    geometry.translate(0, (y0 + y1) / 2, 0);
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    geometry.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(part), 1));
    return geometry;
  };
  const geometry = mergeGeometries([cylinder(FLAME.radius, FIRE_Y0, FLAME.top, 0), cylinder(SMOKE.radius, SMOKE.y0, SMOKE.y1, 1)]);
  // (room for the column at its furthest lean)
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6.5, 0), 8.6);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'flame';
  mesh.layers.set(ctx.LAYERS.VOLUME);
  return mesh;
}

// The glow of the air: single scattering of the fire's light in faintly hazy air. For a
// point light the in-scattered radiance along a ray, the integral of 1 / (d^2 + e^2) dt, is
// an arctangent, so there is nothing to march: one sphere on the FX layer adds the glow in
// front of whatever the ray ends on, at full resolution and for a few dozen instructions a
// pixel. (It used to be part of the flame's volume, which made most of the screen "volume"
// and paid for it in the half-resolution buffer and again when that was joined to the frame.)
const GLOW_FRAG = /* glsl */ `
${FRAG_PRELUDE}
uniform vec3 uFireOrigin;
varying vec3 vWorldPos;
const vec3 HALO_C = vec3(0.0, ${f3(HALO.y)}, 0.0);
const float HALO_R = ${f3(HALO.radius)};
void main() {
  vec3 ro = cameraPosition - uFireOrigin;
  vec3 rd = normalize(vWorldPos - cameraPosition);
  vec2 ts = sphereIntersect(ro, rd, HALO_C, HALO_R);
  float ta = max(ts.x, 0.0), tb = min(ts.y, sceneRayDistance(screenUV(), rd));
  // The reflection's rays start under the film; the air they cross begins at the film.
  if (uIsMirrorPass > 0.5) ta = max(ta, -ro.y / max(rd.y, 1e-4));
  if (tb <= ta) discard;
  vec3 oc = HALO_C - ro;
  float tc = dot(oc, rd);
  const float e2 = 0.6;                         // softening: the flame is not a point
  float hh = sqrt(max(dot(oc, oc) - tc * tc, 0.0) + e2);
  // The constant subtracted from the integrand makes the glow vanish at the edge of the
  // sphere, so the proxy geometry never shows.
  float integral = (atan((tb - tc) / hh) - atan((ta - tc) / hh)) / hh - (tb - ta) / (HALO_R * HALO_R + e2);
  gl_FragColor = vec4(uFireLightColor * (max(integral, 0.0) * 0.0012), 0.0);
}
`;

/** The warm glow of the air around the fire: an additive sphere on the FX layer. */
export function createGlow(ctx, fireUniforms) {
  const material = new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fireUniforms },
    vertexShader: WORLD_VERT,
    fragmentShader: GLOW_FRAG,
    side: THREE.BackSide,                         // so it still draws with the eye inside it
    transparent: true,
    depthTest: false,                             // the shader clips the glow against the scene's depth itself
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
  });
  // (a little larger than the bound: a faceted sphere lies inside the round one)
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(HALO.radius * 1.02, 24, 16), material);
  mesh.position.set(0, HALO.y, 0);
  mesh.name = 'air-glow';
  // The mirror pass has no depth texture to clip against: there the depth test does it.
  mesh.onBeforeRender = () => { material.depthTest = shared.uIsMirrorPass.value > 0.5; };
  mesh.layers.set(ctx.LAYERS.FX);
  return mesh;
}
