import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FIELD_GLSL } from './field.glsl.js';

// The rock shader: MeshStandardMaterial (so it gets the scene's image-based light, the moon's
// shadow map, the afterglow and every point light for free) with its surface replaced by a
// procedural one. Nothing is UV-mapped: colour, roughness and relief are all functions of
// position in the rock, built from the same strata / joint / fissure fields that carved the mesh.
//
// Six variants share the code:
//   monolith  the split mass itself (fields in its own frame, baked occlusion and visibility)
//   proxy     the monolith's stand-in in the reflection: the same beds, none of the fine detail
//   belt      instanced fragments in orbit: loose blocks of the same column, flat-shaded
//   rubble    the same blocks piled on the island: wet at the waterline, shadowed by the mass above
//   gravel    the bed of the island: small stones packed in grit
//   sand      the sand poured by the streams

/** Uniforms every earth material shares. index.js keeps them current. */
export const earthUniforms = {
  uEarthOrigin: { value: new THREE.Vector3() },                 // world position of the element
  uEarthHeart: { value: new THREE.Vector3() },                  // world position of the geode's heart
  uEarthMouth: { value: new THREE.Vector3(0, 0, 1) },           // world direction the geode opens toward
  // The geode's light as points: [0 … 2] in the hollow and the fissure, [3] the spill out of its mouth.
  uEarthLightPos: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
  uEarthLightColor: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
  uEarthDruse: { value: 1 },                                    // the share of the carpet of small crystals that is drawn; the wall stands in for the rest
};

export const EARTH_UNIFORMS_GLSL = /* glsl */ `
uniform vec3 uEarthOrigin;
uniform vec3 uEarthHeart;
uniform vec3 uEarthMouth;
uniform vec3 uEarthLightPos[4];     // the crystal clusters as point lights, and the spill from the mouth; world space
uniform vec3 uEarthLightColor[4];   // linear rgb intensity
uniform float uEarthDruse;
`;

const VERT_PARS = /* glsl */ `
${VERT_PRELUDE}
attribute vec4 aBake;               // fine occlusion, wide occlusion, convexity, visibility of the geode's heart
attribute vec4 aVis;                // visibility of the afterglow, of the fire, of the open sky, of the light spilling from the geode
#ifdef EARTH_LOOSE
attribute vec4 aRock;               // per instance: seed, size in metres, wetness bias, moss bias
varying vec4 vRock;
#endif
varying vec3 vRockPos;
varying vec3 vRockNormal;
varying vec3 vEarthWorld;
varying vec4 vBake;
varying vec4 vVis;
`;

const VERT_MAIN = /* glsl */ `
vBake = aBake;
vVis = aVis;
vRockNormal = normal;
#ifdef EARTH_LOOSE
  vRock = aRock;
  vRockPos = position * aRock.y;                 // metres, in the block's own frame
#else
  vRockPos = position;
#endif
vec4 earthWorld = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  earthWorld = instanceMatrix * earthWorld;
#endif
vEarthWorld = (modelMatrix * earthWorld).xyz;
`;

const FRAG_PARS = /* glsl */ `
${FRAG_PRELUDE}
${FIELD_GLSL}
${EARTH_UNIFORMS_GLSL}
#ifdef EARTH_LOOSE
varying vec4 vRock;
#endif
varying vec3 vRockPos;
varying vec3 vRockNormal;
varying vec3 vEarthWorld;
varying vec4 vBake;
varying vec4 vVis;

float earthOcclusion = 1.0;         // ambient occlusion: set by the surface code, applied after the lights
float earthHeartVis = 1.0;          // how much of the light inside the geode reaches this fragment
float earthMouthVis = 1.0;          // and of the light that spills out of its mouth
vec3 earthDuskFill = vec3(0.0);     // skylight from the afterglow's side of the sky (irradiance): set by the surface code
float earthGrazing = 0.0;           // 1 where the surface is seen edge-on: set by the surface code

// The scene lights the afterglow as one orange directional lamp, but the sun is under the
// horizon: what reaches the rock is the glow of a band of sky, broad and soft, with the cool
// dusk above it mixed in. Taken at full strength it turns every face that looks that way
// terracotta (ochre stone times orange light) and makes the rock a second pyre. So on stone
// it is a fill, not a key: about half as strong and a third of the way to neutral, which is
// (0.85, 0.62, 0.48) in place of the lamp's (1.0, 0.5, 0.24) …
const vec3 GLOW_ON_ROCK = 0.55 * vec3(0.85, 0.62, 0.48) / vec3(1.0, 0.5, 0.24);
// … and the dusk sky on that side lights what the glow itself cannot reach: the joints and
// the recessed beds, which would otherwise be black. Irradiance on a face turned squarely to it.
const vec3 DUSK_FILL = vec3(0.100, 0.150, 0.270);
const float MENISCUS_GAIN = 0.6;    // its share of that sky (the steep part of the film, at a glancing angle)
const float MENISCUS_WIDTH = 0.006; // metres
vec3 earthGlowDir() { return normalize(vec3(uSunDir.x, 0.16, uSunDir.z)); }
// The lamp keeps its full strength where a face is seen edge-on: from the moonlit side that
// is the thin warm rim down the flank of the rock, which is all of the afterglow one sees there.
vec3 earthGlowGain() { return mix(GLOW_ON_ROCK, vec3(1.0), earthGrazing); }

// Surface-gradient bump mapping (Mikkelsen): tilts the view-space normal n by a height field
// whose change across one pixel is dHdxy (metres).
vec3 earthBump(vec3 surfPos, vec3 n, vec2 dHdxy) {
  vec3 sx = dFdx(surfPos), sy = dFdy(surfPos);
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1);
  vec3 r = abs(det) * n - sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return dot(r, r) > 1e-18 ? normalize(r) : n;
}

// Relief in metres, from two noise lookups the caller also reuses as masks.
// Broad: lumps, pits and spall scars at 44 cm / 15 cm, from a = noise(p * RELIEF_BROAD).
// Fine: chips at 9 cm / 3 cm, shallow flat-floored bites with crisp rims, from c = noise(p * RELIEF_FINE).
#define RELIEF_BROAD(p) ((p) * 0.57 + 0.37)
#define RELIEF_FINE(p) ((p) * 2.9 + 0.73)
float earthBroad(vec4 a) {
#if defined(EARTH_GRAVEL)
  return a.a * 0.02;
#elif defined(EARTH_SAND)
  return 0.0;
#else
  return a.b * 0.026 - a.a * 0.016 - 0.007 * smoothstep(0.50, 0.56, a.g);
#endif
}
float earthFine(vec4 c) {
#if defined(EARTH_GRAVEL)
  return max(c.a * 0.014, c.g * 0.028);                        // stones standing proud of the grit
#elif defined(EARTH_SAND)
  return c.b * 0.004 + c.a * 0.002;
#else
  return c.r * 0.009 + c.b * 0.005 - c.a * 0.007 - 0.003 * smoothstep(0.62, 0.70, c.g);
#endif
}
// The grain of the stone, millimetres deep: only worth its fetches close to the camera.
float earthGrit(vec3 p, float lod) {
  vec4 g = noiseTexLod(p * 9.1 + 0.19, lod);
  return g.b * 0.0016 - g.a * 0.0022;
}

// Glitter that stays about a pixel across at any distance: space is diced into cells the
// size of the pixel footprint (metres of p under one pixel), a fraction of them hold a facet
// with a random tilt, and a facet flashes when it mirrors the light toward the eye (h = half vector).
float earthGlint(vec3 p, float footprint, vec3 n, vec3 h, float density, float tightness) {
  float size = exp2(ceil(log2(max(footprint * 1.5, 2e-4))));
  vec3 cell = floor(p / size) + size * 91.7;
  if (hash13(cell + 5.3) > density) return 0.0;
  vec3 m = normalize(n * 1.1 + (hash33(cell) - 0.5) * 1.2);     // the tilt can never cancel the normal
  return pow(max(dot(m, h), 0.0), tightness);
}

// A hairline along the level set n = level of some noise: its coverage of this pixel, for a
// crack "width" metres wide when a pixel spans "footprint" metres. The distance to the level
// set is measured with the noise's own screen-space gradient, so the line keeps its width
// whatever the noise does, and fades instead of aliasing once it is thinner than a pixel.
float hairlineCover(float distPx, float width, float footprint) {
  float widthPx = width / footprint;
  float drawn = max(widthPx, 0.8);
  return (1.0 - smoothstep(drawn * 0.5, drawn, distPx)) * min(1.0, widthPx / 0.8);
}
float hairline(float n, float level, float width, float footprint) {
  float v = n - level;
  return hairlineCover(abs(v) / max(length(vec2(dFdx(v), dFdy(v))), 1e-6), width, footprint);
}

// Where the film meets a stone it climbs it a few millimetres, curving from level to steep and
// round the stone, so some part of that meniscus always turns the low sky just over the
// horizon toward the eye, and the afterglow from well to one side of where one looks: seen
// from anywhere it is a fine bright line. Its radiance; Vw: from the surface toward the eye.
vec3 earthMeniscus(vec3 Vw) {
  vec2 look = -Vw.xz / max(length(Vw.xz), 1e-4);
  vec2 bearing = look + normalize(uSunDir.xz) * 0.6;           // never shorter than 0.4
  bearing /= length(bearing);
  // (A few degrees up: the line is the mean over the curve, of which only a sliver mirrors the horizon itself.)
  return min(envColor(normalize(vec3(bearing.x, 0.05, bearing.y)), 0.3) * MENISCUS_GAIN, vec3(0.45));
}
// The line where something comes out of the water: its coverage of the pixel, a few
// millimetres of surface wide, so that it narrows with distance as the real one does (and
// fades instead of aliasing once it is under a pixel). height: of this point above the
// waterline, metres. footprint: metres of surface under a pixel.
float earthWaterline(float height, float footprint) {
  float slope = max(length(vec2(dFdx(height), dFdy(height))), 1e-6);    // metres of height per pixel
  return hairlineCover(abs(height - 0.002) / slope, MENISCUS_WIDTH, footprint);
}

// A quartz vein: a thin sheet with unit normal n through the rock, wandering by "wobble".
float veinSheet(vec3 q, vec3 n, float offset, float wobble, float width) {
  return 1.0 - smoothstep(width * 0.5, width, abs(dot(q, n) - offset + wobble));
}

// What reaches the surface of the lights that have no shadow map. Directions arrive in view space.
// The afterglow: toned down to a fill (above) and, on the monolith, shadowed by the baked visibility.
vec3 earthDirGain(vec3 dirView) {
  vec3 d = transformDirectionByInverseViewMatrix(dirView, viewMatrix);
  float isGlow = smoothstep(0.90, 0.98, dot(d, earthGlowDir()));
#ifdef EARTH_MONOLITH
  return mix(vec3(1.0), earthGlowGain() * vVis.x, isGlow);
#else
  return mix(vec3(1.0), earthGlowGain(), isGlow);
#endif
}
float earthPointVis(vec3 dirView) {
#ifdef EARTH_MONOLITH
  vec3 d = transformDirectionByInverseViewMatrix(dirView, viewMatrix);
  float isFire = smoothstep(0.90, 0.98, dot(d, normalize(uFireLightPos - uEarthHeart)));
  return mix(mix(0.2, 1.0, vBake.y), vVis.y, isFire);
#else
  return 1.0;
#endif
}
`;

// The reflection must not show what lies under the water film. A discard in the fragment
// shader would do it, but any shader that can discard loses the GPU's hidden-surface removal
// for every pixel it draws, in every pass. So the mirror pass flattens whatever is under the
// film onto the film instead: the mirror camera sees that sheet edge-on, behind the waterline.
export const VERT_WATERLINE = /* glsl */ `
if (uIsMirrorPass > 0.5 && vEarthWorld.y < 0.0) {
  mvPosition = viewMatrix * vec4(vEarthWorld.x, 0.0, vEarthWorld.z, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

// Runs once three has prepared diffuseColor, roughnessFactor and the view-space normal.
const FRAG_SURFACE = /* glsl */ `
{
  vec3 P = vRockPos;
  vec3 Nw = transformDirectionByInverseViewMatrix(normal, viewMatrix);
  vec3 Nr = normalize(vRockNormal);
  vec3 Vw = normalize(cameraPosition - vEarthWorld);
  float aoFine = vBake.x, aoWide = vBake.y, convex = vBake.z;
  float wet = 0.0;
  vec3 dPdx = dFdx(P), dPdy = dFdy(P);
  float footprint = max(length(dPdx), length(dPdy));           // metres of rock under one pixel

#ifdef EARTH_MONOLITH
  float side = fissurePlane(P) >= 0.0 ? 1.0 : -1.0;
  float gape = fissureOpening(P);
  vec3 Q = unsplit(P, side);                                   // where this rock lay before the split
  float wallDepth = fissurePlane(Q) * side;                    // metres behind the fracture surface
  float s = strataCoord(Q);
  vec3 sGrad = vec3(0.085, 1.0, -0.05);
  vec3 dipDir = vec3(0.8, 0.0, 0.6);
  float heartDist = length(Q - GEODE_C);
  float geode = 1.0;                                           // (nothing of the geode reaches further than this)
  if (heartDist < 1.45) geode = geodeDist(Q);
  // Fresh rock shows on the fissure walls, on the clean breaks and on the torn root.
  float onWall = smoothstep(0.015, 0.05, gape) * (1.0 - smoothstep(0.10, 0.22, wallDepth)) * smoothstep(0.15, 0.6, dot(Nr, -side * FIS_N));
  float onBreak = 1.0 - smoothstep(0.03, 0.10, abs(breakDist(Q)));
  float fresh = max(max(onWall, onBreak), 1.0 - smoothstep(-1.75, -1.25, P.y));
  float skyVis = vVis.z;
  float mossBias = smoothstep(-0.8, 1.7, P.y);
  earthHeartVis = vBake.w;
  earthMouthVis = vVis.w;
#else
  // A loose block: broken from somewhere in the same column and lying at its own angle.
  float seed = vRock.x;
  vec3 Q = P + (hash31(seed * 3.7 + 0.2) - 0.5) * 60.0;        // each block reads the noise somewhere else
  vec3 bedAxis = normalize(hash31(seed * 2.7 + 4.1) - 0.5);
  vec3 sGrad = bedAxis * 0.8;
  vec3 dipDir = normalize(cross(bedAxis, vec3(0.31, 0.52, 0.79)));
  float s = mix(-2.3, 1.85, hash11(seed * 9.1 + 0.3)) + dot(P, sGrad) + (noiseTex(Q * 0.09).r - 0.5) * 0.25;
  float heartDist = length(vEarthWorld - uEarthHeart);
  float geode = 1.0;
  float onWall = 0.0;
  // One side of the block is old weathered surface, the rest is fresh fracture.
  vec3 oldDir = normalize(hash31(seed * 6.3 + 1.7) - 0.5);
  float fresh = smoothstep(0.35, -0.25, dot(Nr, oldDir) + (noiseTex(Q * 0.21).r - 0.5) * 0.8);
  float skyVis = 1.0;
  float mossBias = vRock.w;
  vec3 fromHeart = normalize(vEarthWorld - uEarthHeart);
  earthHeartVis = max(smoothstep(0.05, 0.7, dot(fromHeart, uEarthMouth)), 0.25 * smoothstep(0.5, 0.95, fromHeart.y));
#endif

  // ---- detail noise: the taps of the relief double as masks
#ifdef EARTH_GRAVEL
  // (The bed is seen at a low angle, where a pixel is far longer than it is wide: its stones
  // are kept one level sharper than the pixel's length alone would allow.)
  float fineLod = log2(max(max(0.5 * footprint, min(length(dPdx), length(dPdy))) * 2.9 * 128.0, 1.0));
#else
  float fineLod = log2(max(footprint * 2.9 * 128.0, 1.0));     // mip level at which a texel of the fine lookup fills a pixel
#endif
  vec4 nB = noiseTex(RELIEF_BROAD(Q));
  vec4 nC = noiseTexLod(RELIEF_FINE(Q), fineLod);
  float hBroad = earthBroad(nB), hFine = earthFine(nC);
  float h0 = hBroad + hFine;
  vec4 nA = noiseTex(Q * 0.057 + 0.11);                        // metre-scale masks

  // ---- the bed and its laminae
  Stratum st = stratumAt(s);
  float hard = LAYER_ROCK[st.index].a;
  // Sandstone beds are cross-bedded: their laminae dip one way or the other, bed by bed.
  float dip = step(0.7, hard) * (mod(float(st.index), 2.0) * 2.0 - 1.0) * 0.3;
  float lamCoord = s + dip * dot(Q, dipDir);
  vec3 lamAxis = sGrad + dip * dipDir;
  vec3 bedN = normalize(sGrad);
  vec3 lamBase = Q * 0.04 + float(st.index) * 0.137;
  float lam = noiseTex(lamBase + bedN * (lamCoord * 2.3)).r;
#ifdef EARTH_PROXY
  float lamFine = 0.5;
#else
  float lamUp = noiseTex(lamBase + bedN * ((lamCoord + 0.004) * 2.3)).r;
  float lamFine = noiseTex(Q * 0.17 + bedN * (lamCoord * 8.0)).b;
#endif

  vec3 rockCol = mix(LAYER_ROCK[st.below].rgb, LAYER_ROCK[st.index].rgb, smoothstep(0.0, 0.012, st.up + (nC.r - 0.5) * 0.014));
  rockCol *= (0.70 + 0.60 * lam) * (0.88 + 0.24 * lamFine) * (0.86 + 0.28 * nB.r);
  rockCol *= 1.0 - 0.5 * smoothstep(0.62, 0.70, lam) * (1.0 - hard);                 // dark partings in the shales
  // The bedding plane under each bed is a tight dark parting.
  float parting = 1.0 - smoothstep(0.0, 0.014, st.up + (nC.b - 0.5) * 0.01);
  rockCol *= 1.0 - 0.45 * parting;
  // Iron staining bleeds through the sandstones in blotches.
  rockCol = mix(rockCol, rockCol * vec3(1.25, 0.62, 0.36), smoothstep(0.52, 0.72, nA.b * 0.6 + nB.r * 0.5) * 0.6 * hard);

  // ---- weathered crust over everything that has been exposed for long
  float crust = (1.0 - fresh) * (0.4 + 0.5 * smoothstep(0.3, 0.7, nA.b));
  vec3 albedo = mix(rockCol, mix(vec3(luma(rockCol)), rockCol, 0.7) * 0.84 + vec3(0.012, 0.009, 0.006), crust);
  float rough = mix(0.93, 0.82, hard) - crust * 0.12;
  // Worn edges are paler, crevices hold dirt; so, at a smaller scale, do the pits of the relief.
  albedo *= mix(0.68, 1.0, smoothstep(0.08, 0.45, convex)) * (1.0 + 0.4 * smoothstep(0.58, 0.92, convex));
  albedo *= mix(0.72, 1.12, saturate(0.5 + (h0 - 0.011) * 35.0));

  vec3 emissive = vec3(0.0);
  float glitter = 0.03 * hard * fresh;                         // mica in the fresh sandstone
  float beat = heartbeat(heartDist);

#if defined(EARTH_MONOLITH) && !defined(EARTH_PROXY)
  // ---- stains running down the cliffs
  // (One lookup, stretched twenty times along the fall line, holds all three in its channels.)
  float cliff = (1.0 - abs(Nr.y)) * (1.0 - fresh);
  vec4 run = noiseTex(vec3(Q.x * 0.8, Q.y * 0.05, Q.z * 0.8) + 0.4);
  albedo *= 1.0 - 0.5 * smoothstep(0.52, 0.70, run.r) * cliff;
  albedo = mix(albedo, vec3(0.40, 0.38, 0.34), 0.4 * smoothstep(0.66, 0.80, run.b) * cliff);
  // Water seeps out from under the soil of the cap and runs down the cliff below it.
  float seep = smoothstep(0.50, 0.66, run.g) * cliff * smoothstep(0.5, 1.5, P.y);
  wet = seep * 0.8;
  albedo *= 1.0 - 0.45 * seep;
  rough = mix(rough, 0.32, seep);
#endif

#if defined(EARTH_GRAVEL)
  // The bed of the island: small stones from every bed of the column, packed in dark grit.
  float stones = smoothstep(0.009, 0.015, hFine);              // 1 on a stone standing proud of the grit (see earthFine), 0 in the gaps
  vec3 tone = mix(vec3(0.20, 0.15, 0.10), vec3(0.36, 0.28, 0.17), smoothstep(0.40, 0.60, nC.r));
  tone = mix(tone, vec3(0.13, 0.14, 0.16), smoothstep(0.50, 0.62, noiseTex(Q * 1.7 + 0.4).r));
  albedo = mix(vec3(0.060, 0.050, 0.042), tone * (0.8 + 0.4 * nB.b), stones);
  rough = 0.92;
  glitter = 0.0;
  fresh = 1.0;
  hard = 0.0;
#elif defined(EARTH_SAND)
  albedo = vec3(0.50, 0.40, 0.26) * (0.82 + 0.36 * nC.b) * (0.9 + 0.2 * nB.r);
  rough = 0.95;
  glitter = 0.10;
  fresh = 1.0;
  hard = 0.0;
#endif

#ifndef EARTH_PROXY
  // ---- lichen: crusty rosettes on the hard beds
  float lichen = smoothstep(0.50, 0.57, nB.a) * smoothstep(0.50, 0.62, nA.b * 0.5 + nB.g * 0.5 + 0.05)
               * (1.0 - fresh) * skyVis * smoothstep(0.35, 0.7, hard);
  albedo = mix(albedo, mix(vec3(0.24, 0.27, 0.21), vec3(0.40, 0.29, 0.07), step(0.62, nA.a)), lichen * 0.85);
#endif

  // ---- hairline cracks along the bedding and up the joints, and quartz veins cutting across both
  float vein = 0.0;
#if !defined(EARTH_GRAVEL) && !defined(EARTH_SAND) && !defined(EARTH_PROXY)
  if (uIsMirrorPass < 0.5) {
    float alongBed = noiseTex(Q * vec3(0.11, 0.02, 0.11) + bedN * (s * 1.3) + 0.5).r;
    float upJoint = noiseTex(vec3(dot(Q, FIS_N) * 0.9, Q.y * 0.10, dot(Q, FIS_D) * 0.9) + 0.2).r;
    float cracks = max(hairline(alongBed, 0.42, 0.003, footprint), hairline(alongBed, 0.58, 0.002, footprint)) * mix(1.0, 0.5, hard)
                 + max(hairline(upJoint, 0.38, 0.003, footprint), hairline(upJoint, 0.6, 0.002, footprint)) * hard;
    albedo *= 1.0 - 0.28 * saturate(cracks);

    float wobble = (nB.r - 0.5) * 0.11 + (nA.b - 0.5) * 0.40 + (nC.r - 0.5) * 0.012;
    float width = 0.003 + 0.011 * nB.b * nB.b * 2.0;
#ifdef EARTH_MONOLITH
    // One sheet passes through the heart of the geode, as if it had fed it.
    vein = veinSheet(Q, vec3(0.50, -0.62, 0.60), dot(GEODE_C, vec3(0.50, -0.62, 0.60)), wobble, width) * smoothstep(0.30, 0.42, nA.r)
         + veinSheet(Q, vec3(0.72, 0.35, -0.60), 0.55, wobble, width * 0.8) * smoothstep(0.46, 0.56, nA.g)
         + veinSheet(Q, vec3(-0.30, 0.20, 0.93), -0.75, -wobble, width * 0.7) * smoothstep(0.48, 0.58, nA.b);
#else
    vein = veinSheet(P, normalize(hash31(seed * 4.9 + 0.8) - 0.5), (hash11(seed * 8.3) - 0.5) * 3.0 * vRock.y, wobble * 0.2, min(width, 0.06 * vRock.y));
#endif
    vein = saturate(vein);
  }
#endif
  albedo = mix(albedo, vec3(0.50, 0.46, 0.55), vein * 0.8);
  rough = mix(rough, 0.3, vein);
  glitter += vein * 0.3;
  // Near the geode the veins carry a little of its light, a beat behind the heart.
  emissive += vec3(0.55, 0.16, 0.90) * vein * (0.1 + 0.9 * beat) * (1.0 - smoothstep(0.5, 1.9, heartDist)) * 0.12;

#ifdef EARTH_MONOLITH
  // ---- the geode in section: a dark rind, banded agate, then the druse lining the hollow
#ifndef EARTH_PROXY
  // (How fast the distance to the hollow changes across a pixel, for the lines ruled on the
  // agate. Screen-space derivatives have to be taken outside the branch below.)
  float ruled = geode + (nC.r - 0.5) * 0.004;
  float ruledSlope = max(length(vec2(dFdx(ruled), dFdy(ruled))), 1e-6);
#endif
  if (geode < 0.2 || onWall > 0.001) {
    // The agate shell is a hand's breadth thick in one place and pinches out in the next.
    float druse = 1.0 - smoothstep(0.015, 0.04, geode);
    float shell = 0.035 + 0.075 * smoothstep(0.25, 0.7, nB.g) + (nB.b - 0.5) * 0.02;
    float agate = (1.0 - smoothstep(shell - 0.005, shell + 0.005, geode)) * (1.0 - druse);
    float rind = (1.0 - smoothstep(shell + 0.015, shell + 0.045, geode)) * (1.0 - druse) * (1.0 - agate);
#ifdef EARTH_PROXY
    float band = 0.5, lines = 0.0;
    float bare = 1.0;                                          // how much of the wall shows between the small crystals
#else
    // Agate: pale chalcedony in soft bands of uneven width, ruled with fine dark lines that
    // follow the outline of the hollow.
    float band = noiseTexLod(vec3(geode * 3.4 + nB.b * 0.04, nA.r * 0.3, 0.37), log2(max(footprint * 3.4 * 128.0, 1.0))).b;
    float lines = max(max(hairlineCover(abs(ruled - 0.024) / ruledSlope, 0.003, footprint), hairlineCover(abs(ruled - 0.037) / ruledSlope, 0.002, footprint)),
                      max(hairlineCover(abs(ruled - 0.049) / ruledSlope, 0.004, footprint), hairlineCover(abs(ruled - 0.066) / ruledSlope, 0.002, footprint)));
    float bare = 1.0 - uEarthDruse;
#endif
    float carpet = druse * bare;
    albedo = mix(albedo, vec3(0.040, 0.046, 0.038), rind * 0.85);
    albedo = mix(albedo, mix(vec3(0.22, 0.19, 0.25), vec3(0.56, 0.53, 0.52), smoothstep(0.40, 0.58, band)) * (1.0 - 0.6 * lines), agate);
    rough = mix(rough, 0.36, agate);
    albedo = mix(albedo, vec3(0.030, 0.014, 0.048), druse);
    rough = mix(rough, mix(0.4, 1.0, bare), druse);            // (a bare wall must not shine like one smooth sheet)
    // The wall glows between the crystals, most of all at the heart. Where the carpet of small
    // crystals is not drawn (from across the ring, and in the reflection) it glows in their
    // place, as they do: little at the mouth and under the roof, strongly low down and at the back.
    vec3 fromCentre = Q - GEODE_C;
    float deep = saturate(max(0.35 - dot(fromCentre, FIS_D) / GEODE_R.z, -0.15 - fromCentre.y / GEODE_R.y) * 1.25);
    emissive += vec3(0.48, 0.12, 0.72) * druse * (0.3 + 0.7 * beat) * (0.10 + 0.5 * deep * deep);
    emissive += vec3(0.50, 0.14, 0.78) * carpet * (0.42 + 1.45 * beat) * (0.03 + 0.3 * deep) * (0.4 + 1.2 * nB.g);
    // The fissure walls are crusted with small crystals, thinning away from the heart.
    float mineral = onWall * (1.0 - smoothstep(0.6, 2.6, heartDist)) * smoothstep(0.40, 0.62, nB.g + nB.r * 0.4) * (1.0 - druse);
    albedo = mix(albedo, vec3(0.27, 0.21, 0.36), mineral * 0.7);
    rough = mix(rough, 0.42, mineral);
    glitter += druse + mineral * 0.6;
  }
#endif

  // ---- dust on the ledges, moss where rain reaches
  float up = smoothstep(0.35, 0.8, Nw.y + (nB.b - 0.5) * 0.5);
  float moss = up * mix(0.12, 1.0, mossBias) * skyVis * smoothstep(0.38, 0.6, nB.r * 0.45 + nA.b * 0.45 + (1.0 - aoFine) * 0.35);
  float dust = smoothstep(0.55, 0.9, Nw.y) * (1.0 - moss) * smoothstep(0.3, 0.6, nB.b) * (1.0 - fresh * 0.5);
  albedo = mix(albedo, vec3(0.34, 0.28, 0.19), dust * 0.6);
  vec3 mossCol = mix(vec3(0.040, 0.075, 0.022), vec3(0.150, 0.180, 0.050), nC.b * nC.b * 1.6);
  mossCol *= 1.0 + 1.6 * spow(1.0 - max(dot(Nw, Vw), 0.0), 2.5);            // the pile catches light edge-on
  albedo = mix(albedo, mossCol, moss);
  rough = mix(rough, 1.0, max(moss, dust * 0.6));
  glitter *= 1.0 - moss;

#ifdef EARTH_GRAVEL
  // ---- the shore of the bed. The film laps in among the gravel: where the bed lies within a
  // stone's height of the water only the stones stand clear of it, the grit between them is
  // under water, and the water climbs each stone a little way in a meniscus. Above that the
  // gravel is glossy wet for a hand's breadth, and damp for another.
  float clear = vEarthWorld.y + hFine - 0.02;                  // height above the water of this point of the relief, metres
  vec2 clearStep = vec2(dFdx(clear), dFdy(clear));             // its change across one pixel
  float clearSlope = max(length(clearStep), 1e-6);
  float pool = 1.0 - smoothstep(-0.5, 0.5, clear / clearSlope);     // 1 under water (the edge is one pixel wide)
  float meniscus = hairlineCover(abs(clear) / clearSlope, 0.008, footprint);
  float damp = smoothstep(0.16, 0.02, vEarthWorld.y + (nB.r - 0.5) * 0.10);
  wet = smoothstep(0.09, 0.025, vEarthWorld.y + (nB.r - 0.5) * 0.04);
  albedo = mix(albedo, albedo * albedo * 1.1 + albedo * 0.32, damp) * (1.0 - 0.5 * pool);
  rough = mix(mix(mix(rough, 0.36, wet * wet), 0.06, pool), 0.22, meniscus);
  // The waterline itself catches the low sky, round every stone and along the whole shore,
  // brighter where the film climbs higher. (Seen at a glancing angle a pixel spans far more of
  // the bed one way than the other: the line is drawn as wide as their mean.)
  float sheen = earthWaterline(clear, sqrt(length(dPdx) * length(dPdy))) * mix(0.35, 1.4, nB.b);
  if (sheen > 0.0 && uIsMirrorPass < 0.5) emissive += earthMeniscus(Vw) * sheen;
#elif defined(EARTH_RUBBLE)
  // ---- wet where the film laps the stones, with a dark line of algae at the water itself
  float waterline = vEarthWorld.y + (nB.r - 0.5) * 0.10;
  wet = saturate(vRock.z * smoothstep(0.30, 0.10, waterline) + smoothstep(0.16, 0.02, waterline));
  albedo = mix(albedo, albedo * albedo * 1.1 + albedo * 0.32, wet);
  albedo = mix(albedo, vec3(0.018, 0.030, 0.018), smoothstep(0.05, 0.0, waterline) * 0.7);
  rough = mix(rough, 0.3, wet * wet);
  // … and below that line the bright thread of the meniscus, where the stone stands in the film.
  float sheen = earthWaterline(vEarthWorld.y, sqrt(length(dPdx) * length(dPdy))) * mix(0.35, 1.4, nB.b);
  if (sheen > 0.0 && uIsMirrorPass < 0.5) emissive += earthMeniscus(Vw) * sheen;
#endif

#ifndef EARTH_PROXY
  // ---- relief: ribs along the laminae plus the fine lumps and pits
  // The relief is faded out (and its extra taps skipped) once it is far smaller than a pixel.
  float reliefFade = (1.0 - uIsMirrorPass) * smoothstep(0.035, 0.02, footprint);
#if defined(EARTH_GRAVEL) || defined(EARTH_SAND)
  vec3 grad = vec3(0.0);
#else
  vec3 grad = lamAxis * (((lamUp - lam) / 0.004) * mix(0.010, 0.005, hard) + parting * (1.0 - parting) * 1.2);
#endif
  // The broad relief changes slowly enough for the screen-space derivative of its height to
  // give its slope; the fine relief takes three more taps (forward differences in rock space).
  vec2 dHdxy = vec2(dFdx(hBroad), dFdy(hBroad)) * reliefFade;
  if (reliefFade > 0.0) {
    const float e = 0.004;
    grad += (vec3(earthFine(noiseTexLod(RELIEF_FINE(Q + vec3(e, 0.0, 0.0)), fineLod)), earthFine(noiseTexLod(RELIEF_FINE(Q + vec3(0.0, e, 0.0)), fineLod)),
                  earthFine(noiseTexLod(RELIEF_FINE(Q + vec3(0.0, 0.0, e)), fineLod))) - hFine) / e * reliefFade;
#if !defined(EARTH_GRAVEL) && !defined(EARTH_SAND)
    float gritFade = smoothstep(0.008, 0.004, footprint);
    if (gritFade > 0.0) {
      const float eg = 0.0015;
      float gritLod = log2(max(footprint * 9.1 * 128.0, 1.0));
      grad += (vec3(earthGrit(Q + vec3(eg, 0.0, 0.0), gritLod), earthGrit(Q + vec3(0.0, eg, 0.0), gritLod), earthGrit(Q + vec3(0.0, 0.0, eg), gritLod))
               - earthGrit(Q, gritLod)) / eg * gritFade;
    }
#endif
  }
#ifdef EARTH_GRAVEL
  // Wet stones keep their shape; water lies level, and its meniscus leans away from the stone
  // it climbs by some forty degrees (which is what makes it catch the moon and the afterglow).
  dHdxy = (dHdxy + vec2(dot(grad, dPdx), dot(grad, dPdy))) * (1.0 - 0.6 * moss) * (1.0 - pool);
  normal = normalize(mix(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz), max(pool, meniscus)));
  dHdxy = mix(dHdxy, clearStep * (0.85 * footprint / clearSlope), meniscus * (1.0 - uIsMirrorPass));
#else
  dHdxy = (dHdxy + vec2(dot(grad, dPdx), dot(grad, dPdy))) * (1.0 - 0.6 * moss) * (1.0 - 0.7 * wet);
#endif
#ifdef EARTH_MONOLITH
  // A share of the mesh's own flat facets in the normal keeps the fracture faces from looking moulded.
  vec3 facet = cross(dFdx(vViewPosition), dFdy(vViewPosition));
  if (dot(facet, facet) > 1e-20) normal = normalize(mix(normal, normalize(facet), 0.5 * (1.0 - moss)));
#endif
  normal = earthBump(-vViewPosition, normal, dHdxy);

  // ---- glitter: facets flashing in the moonlight and in the geode's own light
  if (glitter > 0.002 && uIsMirrorPass < 0.5) {
    vec3 toHeart = uEarthHeart - vEarthWorld;
    float hd2 = dot(toHeart, toHeart);
    float moonGlint = earthGlint(Q, footprint, Nw, normalize(uMoonDir + Vw), 0.35, 180.0) * skyVis;
    float heartGlint = earthGlint(Q + 7.3, footprint, Nw, normalize(normalize(toHeart) + Vw), 0.5, 90.0) * earthHeartVis / (hd2 + 0.25);
    emissive += glitter * (uMoonColor * moonGlint * 9.0 + vec3(0.70, 0.36, 1.0) * heartGlint * (0.5 + beat) * 4.0);
    // Flecks of pyrite in the druse and the veins flash gold.
    float gold = earthGlint(Q * 1.31 + 3.1, footprint * 1.31, Nw, normalize(uMoonDir + Vw), 0.12, 60.0) * skyVis
               + earthGlint(Q * 1.31 + 9.7, footprint * 1.31, Nw, normalize(normalize(toHeart) + Vw), 0.12, 40.0) * earthHeartVis * (0.4 + beat) / (hd2 + 0.3);
    emissive += vec3(1.0, 0.66, 0.20) * gold * min(glitter, 1.0) * 5.0;
  }
#endif

  // ---- occlusion
  earthOcclusion = aoFine * mix(0.3, 1.0, aoWide);
#ifdef EARTH_RUBBLE
  // The mass hanging overhead takes a large bite out of the sky: two spheres stand in for it.
  vec3 d1 = uEarthHeart + vec3(0.0, 0.5, 0.0) - vEarthWorld;
  vec3 d2 = uEarthHeart + vec3(0.0, -1.35, 0.0) - vEarthWorld;
  float shade = max(dot(Nw, normalize(d1)), 0.0) * 2.4 / dot(d1, d1) + max(dot(Nw, normalize(d2)), 0.0) * 0.6 / dot(d2, d2);
  earthOcclusion *= 1.0 - min(shade, 0.8);
#ifdef EARTH_GRAVEL
  // Water lying in the shallows mirrors the sky low over the film, as the film itself does
  // (and, like the film there, the island's own dark stones too: hence only half way).
  earthOcclusion = mix(earthOcclusion, 1.0, 0.5 * pool);
#endif
#if !defined(EARTH_GRAVEL) && !defined(EARTH_SAND)
  // Stones are darkest where they bed into the mound and into each other.
  float lift = vEarthWorld.y - moundHeight(vEarthWorld.xz - uEarthOrigin.xz);
  earthOcclusion *= mix(0.4, 1.0, smoothstep(-0.03, 0.22, lift));
  // Lower faces of a block see the heap, not the sky.
  earthOcclusion *= 0.55 + 0.45 * smoothstep(-0.6, 0.5, Nw.y);
#endif
#endif
  // Skylight from the afterglow's side: strongest on faces turned to it, none on those turned away.
  earthDuskFill = DUSK_FILL * sq(saturate(0.5 + 0.5 * dot(Nw, earthGlowDir()))) * mix(0.5, 1.0, earthOcclusion);
  earthGrazing = smoothstep(0.42, 0.82, 1.0 - saturate(dot(Nw, Vw)));

  diffuseColor.rgb = albedo;
  roughnessFactor = rough;
  totalEmissiveRadiance += emissive;
}
`;

// Appended to three's light loop: the geode's light as pulsing points along the fissure and
// before its mouth, each lagging the heart a little, run through the same BRDF as every other light.
const FRAG_GEODE_LIGHTS = /* glsl */ `
for (int i = 0; i < 4; i++) {
  vec3 toLight = uEarthLightPos[i] - vEarthWorld;
  float d2 = dot(toLight, toLight);
  // (The spill is a broad source, not a point: it has no hot spot close to.)
  float reach = (i < 3 ? earthHeartVis : earthMouthVis) * sq(saturate(1.0 - d2 / 30.0)) / (d2 + (i < 3 ? 0.06 : 0.7));
  // Most of the rock is out of sight of the geode: it skips the lighting maths for these.
  if (reach > 0.002) {
    directLight.direction = normalize((viewMatrix * vec4(toLight, 0.0)).xyz);
    directLight.color = uEarthLightColor[i] * ((0.45 + 0.85 * heartbeat(float(i) * 0.9)) * reach);
    directLight.visible = true;
    RE_Direct(directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight);
  }
}
`;

// Replaces three's ambient-occlusion map: the surface code's own occlusion on the image-based light.
export const FRAG_OCCLUSION = /* glsl */ `
reflectedLight.indirectDiffuse *= earthOcclusion;
reflectedLight.indirectSpecular *= computeSpecularOcclusion(saturate(dot(geometryNormal, geometryViewDir)), earthOcclusion, material.roughness);
`;

// Rock only: the dusk sky's fill on the side of the afterglow (see GLOW_ON_ROCK).
const FRAG_DUSK_FILL = /* glsl */ `
reflectedLight.indirectDiffuse += earthDuskFill * BRDF_Lambert(material.diffuseContribution);
`;

/** source.replace that complains when the patch point has gone (a three.js upgrade moved it). */
export function patch(source, find, replacement) {
  if (!source.includes(find)) console.warn(`[earth] shader patch point not found: ${find}`);
  return source.replace(find, replacement);
}

// three's light loop with a gain (visibility, and for the afterglow a tint) on the lights that cast no shadow map.
export function lightsChunk() {
  let chunk = THREE.ShaderChunk.lights_fragment_begin;
  chunk = patch(chunk, 'getDirectionalLightInfo( directionalLight, directLight );',
    'getDirectionalLightInfo( directionalLight, directLight );\n\t\tdirectLight.color *= earthDirGain( directLight.direction );');
  chunk = patch(chunk, 'getPointLightInfo( pointLight, geometryPosition, directLight );',
    'getPointLightInfo( pointLight, geometryPosition, directLight );\n\t\tdirectLight.color *= earthPointVis( directLight.direction );');
  return chunk + FRAG_GEODE_LIGHTS;
}

/** variant: 'monolith' | 'proxy' | 'rubble' | 'belt' | 'gravel' | 'sand'. */
export function createRockMaterial(variant) {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
  material.defines = { ...material.defines };
  const solid = variant === 'monolith' || variant === 'proxy';
  if (solid) material.defines.EARTH_MONOLITH = 1;
  else material.defines.EARTH_LOOSE = 1;
  if (variant === 'proxy') material.defines.EARTH_PROXY = 1;
  if (!solid && variant !== 'belt') material.defines.EARTH_RUBBLE = 1;
  if (variant === 'gravel') material.defines.EARTH_GRAVEL = 1;
  if (variant === 'sand') material.defines.EARTH_SAND = 1;
  // Broken blocks keep the flat facets they fractured along.
  material.flatShading = variant === 'rubble' || variant === 'belt';
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, earthUniforms);
    shader.vertexShader = patch(shader.vertexShader, '#include <common>', `#include <common>\n${VERT_PARS}`);
    shader.vertexShader = patch(shader.vertexShader, '#include <begin_vertex>', `#include <begin_vertex>\n${VERT_MAIN}`);
    if (!solid) shader.vertexShader = patch(shader.vertexShader, '#include <project_vertex>', `#include <project_vertex>\n${VERT_WATERLINE}`);
    let f = shader.fragmentShader;
    f = patch(f, '#include <common>', `#include <common>\n${FRAG_PARS}`);
    f = patch(f, '#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${FRAG_SURFACE}`);
    f = patch(f, '#include <lights_fragment_begin>', lightsChunk());
    f = patch(f, '#include <aomap_fragment>', FRAG_OCCLUSION + FRAG_DUSK_FILL);
    shader.fragmentShader = f;
  };
  return material;
}
