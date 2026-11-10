import * as THREE from 'three';

// Dimensions of the pyre, in metres, local space (y = 0 is the water film).
// JS geometry builders and GLSL shaders both read these, so the analytic shadows and
// the meshes can never drift apart.
export const BOWL = {
  rimY: 0.75,        // height of the rim above the film
  rimR: 1.30,        // outer radius at the rim
  depth: 0.42,       // rim to the lowest point of the outer skin
  wall: 0.030,       // plate thickness
};
// The bowl is a spherical cap: radius of the outer skin and height of the sphere's centre.
BOWL.outerR = (BOWL.rimR * BOWL.rimR + BOWL.depth * BOWL.depth) / (2 * BOWL.depth);
BOWL.centreY = BOWL.rimY - BOWL.depth + BOWL.outerR;
BOWL.innerR = BOWL.outerR - BOWL.wall;

// Heaped coal bed: y = top - drop * r^2. It meets the inside of the bowl at r ~ 0.93.
export const COALS = { top: 0.86, drop: 0.33, radius: 0.95 };

// Height (local) at which the burning gas leaves the fuel bed.
export const FIRE_Y0 = 0.60;

/** Height of the bowl's outer skin under radius r (r <= rimR). */
export function bowlOuterY(r) {
  return BOWL.centreY - Math.sqrt(Math.max(BOWL.outerR * BOWL.outerR - r * r, 0));
}
/** Height of the bowl's inner skin at radius r. */
export function bowlInnerY(r) {
  return BOWL.centreY - Math.sqrt(Math.max(BOWL.innerR * BOWL.innerR - r * r, 0));
}
export function coalY(r) { return COALS.top - COALS.drop * r * r; }

const f = (x) => x.toFixed(5);

/**
 * Uniforms that describe the state of the fire. One set of objects, shared by reference by
 * every fire material, written once per frame in FireElement.update().
 */
export function createFireUniforms(origin) {
  return {
    uFireOrigin: { value: origin.clone() },
    // x: burn level (slow, ~0.85..1.35)  y: fast flicker (~0.87..1.13)
    // z: puff phase in cycles            w: glow of the embers and coals (fanned by gusts)
    uFireState: { value: new THREE.Vector4(1, 1, 0, 1) },
    uFireWind: { value: new THREE.Vector2(0.6, -0.2) },
    // The two directional lights of the world, as colour * intensity, so that our
    // hand-written shading matches what MeshStandardMaterial would produce.
    uMoonLight: { value: new THREE.Vector3(0.85, 1.05, 1.55) },
    uGlowLight: { value: new THREE.Vector3(1.15, 0.58, 0.28) },
    uGlowDir: { value: new THREE.Vector3(0.84, 0.16, -0.54).normalize() },
  };
}

/** Declarations + the geometry of the plume. Vertex and fragment. Needs the core prelude. */
export const FIRE_GLSL = /* glsl */ `
uniform vec3 uFireOrigin;
uniform vec4 uFireState;
uniform vec2 uFireWind;
uniform vec3 uMoonLight;
uniform vec3 uGlowLight;
uniform vec3 uGlowDir;

const float RIM_Y = ${f(BOWL.rimY)};
const float RIM_R = ${f(BOWL.rimR)};
const float BOWL_CY = ${f(BOWL.centreY)};
const float BOWL_RO = ${f(BOWL.outerR)};
const float BOWL_RI = ${f(BOWL.innerR)};
const float COAL_TOP = ${f(COALS.top)};
const float COAL_DROP = ${f(COALS.drop)};
const float FIRE_Y0 = ${f(FIRE_Y0)};

// ---- the buoyant plume -------------------------------------------------------------
// Gas leaves the bed slowly and is accelerated by buoyancy, v = v0 * sqrt(1 + h / h0); above
// the flame it mixes with cold air and slows again (the two polynomial terms). Integrating
// 1 / v gives the time a parcel needs to reach height h. Everything that rides the plume
// (flame, smoke, sparks, haze) is animated in this travel-time coordinate: a feature
// released at time t0 sits at the height where fireTravelTime(h) = t - t0, so it stretches
// as it accelerates and bunches up again as it slows.
float fireTravelTime(float h) {
  return 0.66 * (sqrt(1.0 + h / 0.35) - 1.0) + 0.0125 * h * h + 0.035 * sq(max(h - 4.5, 0.0));
}

// Sideways drift of the plume axis in the wind: barely any near the bed, more with height.
vec2 fireLean(float h) { float hc = max(h, 0.0); return uFireWind * (0.052 * hc * sqrt(hc)); }

// Radius of the plume: it contracts above the bed as the gas speeds up, then widens
// slowly as it entrains air.
float firePlumeRadius(float h) { return 0.98 * (0.55 + 0.45 * exp(-h)) + 0.07 * h; }

float bowlOuterY(float r) { return BOWL_CY - sqrt(max(BOWL_RO * BOWL_RO - r * r, 0.0)); }
float bowlInnerY(float r) { return BOWL_CY - sqrt(max(BOWL_RI * BOWL_RI - r * r, 0.0)); }
float coalY(float r) { return COAL_TOP - COAL_DROP * r * r; }
`;

/** Physically based shading for the solid parts of the pyre. Fragment only. */
export const SOLID_GLSL = /* glsl */ `
float distGGX(float NoH, float a) { float a2 = a * a; float d = NoH * NoH * (a2 - 1.0) + 1.0; return a2 / (PI * d * d + 1e-6); }
float visSmith(float NoV, float NoL, float a) {
  float a2 = a * a;
  float gv = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
  float gl = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
  return 0.5 / (gv + gl + 1e-5);
}
// Schlick's Fresnel, with the grazing reflectance capped by roughness: a porous, matt
// surface such as soot or ash has no sheen at any angle.
vec3 fresnel(vec3 f0, float VoH, float rough) {
  float w = 1.0 - saturate(VoH); float w2 = w * w;
  return f0 + (max(vec3(1.0 - rough), f0) - f0) * (w2 * w2 * w);
}

// Diffuse + specular reflectance for one direction of light, times N.L.
vec3 brdf(vec3 N, vec3 V, vec3 L, vec3 albedo, vec3 f0, float rough) {
  vec3 H = normalize(V + L + vec3(0.0, 1e-5, 0.0));
  float NoL = saturate(dot(N, L)), NoV = saturate(dot(N, V)) + 1e-3;
  float a = max(rough * rough, 0.004);
  vec3 F = fresnel(f0, dot(V, H), rough);
  vec3 spec = F * (distGGX(saturate(dot(N, H)), a) * visSmith(NoV, NoL, a));
  return (albedo * (1.0 - F) / PI + spec) * NoL;
}
// Split-sum approximation of the environment BRDF (Karis, "Real Shading on Mobile").
vec3 envBRDF(vec3 f0, float rough, float NoV) {
  vec4 r = rough * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
  float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
  vec2 ab = vec2(-1.04, 1.04) * a004 + r.zw;
  return f0 * ab.x + ab.y;
}

// Perturb a normal by a scalar height field (metres) using its screen-space derivatives
// (Mikkelsen's "bump mapping unparametrized surfaces").
vec3 bumpNormal(vec3 P, vec3 N, float height) {
  vec3 dpdx = dFdx(P), dpdy = dFdy(P);
  float dhx = dFdx(height), dhy = dFdy(height);
  vec3 r1 = cross(dpdy, N), r2 = cross(N, dpdx);
  float det = dot(dpdx, r1);
  vec3 v = abs(det) * N - sign(det) * (dhx * r1 + dhy * r2);
  return v / max(length(v), 1e-9);
}

// From a point below the rim and outside the bowl, the bowl hides the lower part of the
// flame. Returns the height on the fire's axis above which the flame is visible: the ray
// to an axis point at height ys crosses the rim plane at radius r * (ys - RIM_Y) / (ys - y)
// and has to clear RIM_R there.
float flameHorizon(vec3 lp) {
  if (lp.y >= RIM_Y) return 0.0;
  float r = length(lp.xz);
  if (r <= RIM_R + 0.03) return 1e3;
  return (RIM_Y * r - RIM_R * lp.y) / (r - RIM_R);
}
// Moon shadow cast by the bowl onto whatever stands beneath it (soft edged).
float bowlMoonShadow(vec3 lp) {
  if (lp.y >= RIM_Y) return 1.0;
  vec2 c = lp.xz + uMoonDir.xz * ((RIM_Y - lp.y) / max(uMoonDir.y, 0.05));
  return smoothstep(RIM_R - 0.07, RIM_R + 0.07, length(c));
}

// The flame as a vertical line light standing on the fire's axis between heights y0 and y1
// (local space). Diffuse: Karis' closed form for the irradiance of a line segment, which
// tends to cos / d^2 far away. Specular: GGX toward the point of the segment closest to
// the reflection ray, with the highlight widened to account for the length of the source.
// The lamp that stands in for the flame is several times stronger than the flame we draw
// (it has to reach the other elements), which is harmless far away and ruinous close by:
// a point light a hand's width from a log would bleach it. No surface can receive more
// than a hemisphere full of flame, so the irradiance saturates at that (as a fraction of
// the lamp's intensity), and so does the brightest mirror image of the flame.
const float FLAME_NEAR = 0.075;
const float FLAME_MIRROR = 0.10;

vec3 flameLight(vec3 lp, vec3 N, vec3 V, vec3 albedo, vec3 f0, float rough, float horizon, float inside) {
  float top = 1.2 + 2.6 * uFireState.x;
  float y0 = max(1.0, horizon);
  float seen = saturate((top - y0) / (top - 1.0));
  if (seen <= 0.0) return vec3(0.0);
  vec2 ax = fireLean(1.6);
  vec3 L0 = vec3(ax.x, y0, ax.y) - lp, L1 = vec3(ax.x, top, ax.y) - lp;
  float d0 = max(length(L0), 1e-3), d1 = max(length(L1), 1e-3);
  float irr = 2.0 * saturate(0.5 * (dot(N, L0) / d0 + dot(N, L1) / d1)) / (d0 * d1 + dot(L0, L1) + 2.0);
  irr = FLAME_NEAR * (1.0 - exp(-irr / FLAME_NEAR));
  // Whatever stands in the body of the fire has flame on every side of it, not on its axis.
  float immersed = inside * exp(-dot(lp.xz, lp.xz) / 0.8) * smoothstep(0.75, 1.15, lp.y);
  irr = mix(irr, FLAME_NEAR * (0.62 + 0.20 * N.y), immersed * 0.8);
  vec3 col = albedo / PI * irr;

  vec3 R = reflect(-V, N);
  vec3 Ld = L1 - L0;
  float RoLd = dot(R, Ld);
  float tt = saturate((dot(R, L0) * RoLd - dot(L0, Ld)) / max(dot(Ld, Ld) - RoLd * RoLd, 1e-4));
  vec3 Lr = L0 + Ld * tt;
  float dr = max(length(Lr), 1e-3);
  vec3 L = Lr / dr;
  float a = max(rough * rough, 0.004);
  float aWide = saturate(a + 0.5 * (top - y0) / (3.0 * dr));
  vec3 H = normalize(V + L + vec3(0.0, 1e-5, 0.0));
  float NoL = saturate(dot(N, L)), NoV = saturate(dot(N, V)) + 1e-3;
  // (the same near-field ceiling as the diffuse term)
  float reach = FLAME_NEAR * (1.0 - exp(-NoL / ((dr * dr + 1.0) * FLAME_NEAR)));
  float lobe = distGGX(saturate(dot(N, H)), aWide) * visSmith(NoV, NoL, a) * sq(a / aWide) * reach;
  // A mirror can show the flame no brighter than the flame is.
  col += fresnel(f0, dot(V, H), rough) * min(lobe, FLAME_MIRROR);
  return col * uFireLightColor * seen;
}

struct Surface {
  vec3 P;          // world position
  vec3 N;          // shading normal
  vec3 V;          // toward the eye
  vec3 base;       // base colour
  float metal;
  float rough;
  float ao;        // ambient occlusion, 0..1
  float moonVis;   // moon shadow, 0..1
  float fireVis;   // 0: the flame is hidden behind the bowl's rim, 1: decide from the position
  float inside;    // 1 inside the bowl (lit by the coal bed and the whole flame)
};

vec3 shadeSolid(Surface s) {
  vec3 lp = s.P - uFireOrigin;
  vec3 albedo = s.base * (1.0 - s.metal);
  vec3 f0 = mix(vec3(0.04), s.base, s.metal);
  float NoV = saturate(dot(s.N, s.V));
  vec3 R = reflect(-s.V, s.N);

  // Sky: diffuse irradiance and a prefiltered reflection.
  vec3 col = albedo * skyAmbient(s.N) * s.ao;
  col += envColor(R, s.rough) * envBRDF(f0, s.rough, NoV) * s.ao * mix(1.0, 0.25, s.inside);

  // Moon and afterglow, the same two directional lights the rest of the scene uses.
  col += uMoonLight * brdf(s.N, s.V, uMoonDir, albedo, f0, s.rough) * s.moonVis;
  col += uGlowLight * brdf(s.N, s.V, uGlowDir, albedo, f0, s.rough) * (1.0 - s.inside);

  // The flame.
  float horizon = mix(1e3, mix(flameHorizon(lp), 0.0, s.inside), s.fireVis);
  col += flameLight(lp, s.N, s.V, albedo, f0, s.rough, horizon, s.inside) * mix(s.ao, 1.0, 0.5);

  // The coal bed lights whatever hangs over it, from below, in deep orange.
  float over = exp(-max(lp.y - COAL_TOP, 0.0) * 1.5) * (1.0 - smoothstep(0.7, 1.5, length(lp.xz)));
  col += albedo * vec3(3.0, 0.72, 0.10) * uFireState.w * over * saturate(0.55 - 0.45 * s.N.y) * s.inside;

  // Lightning over the air element (the same strength its own point light has).
  vec3 toFlash = uFlash.xyz - s.P;
  float fd2 = dot(toFlash, toFlash);
  col += albedo / PI * vec3(0.75, 0.85, 1.0) * (uFlash.w * 260.0 / (fd2 + 1.0)) * saturate(dot(s.N, toFlash * inversesqrt(fd2 + 1e-4)));
  return col;
}
`;

/** Minimal vertex shader: world position only. */
export const WORLD_VERT = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/** Vertex shader shared by the static solids: world position and normal. */
export const SOLID_VERT = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/**
 * Vertex shader for the heat haze: world position, and the mesh folded away in the mirror
 * pass, which has no finished scene to bend.
 */
export const REFRACT_VERT = /* glsl */ `
uniform float uIsMirrorPass;
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = uIsMirrorPass > 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * wp;
}
`;
