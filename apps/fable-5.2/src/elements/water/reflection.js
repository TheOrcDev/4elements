import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { LAYERS } from '../../core/layers.js';
import { FRAG_PRELUDE } from '../../core/glsl/index.js';
import { RADIUS, LEVEL, MAX_SWELL, IOR, glslFloat as f } from './waves.js';
import { CAUSTIC_PLANE } from './wavefield.js';
import { MEDIUM_GLSL } from './medium.js';
import { ROCK_DATA_GLSL } from './bed.js';

// The column's image in the film. The reflection is drawn at half resolution, bent by the
// ripples and seen at a flat angle: it has to have the form of the column (the wave line of
// its top edge, the glow dying away with depth, the bright underside of the sea, the dark
// boulders, the wall turning to mirror on its flanks) and none of its detail. So it gets a
// mesh of its own on LAYERS.MIRROR_ONLY and a shader that follows one ray through water in
// closed form: no marching, no fish, no snow, a handful of texture fetches.

const REFLECTION_VERT = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const REFLECTION_FRAG = /* glsl */ `
${FRAG_PRELUDE}
#define RADIUS ${f(RADIUS)}
#define LEVEL ${f(LEVEL)}
#define IOR ${f(IOR)}
#define BED_PLANE ${f(CAUSTIC_PLANE)}

uniform vec3 uOrigin;            // world position of the foot of the column
uniform sampler2D tField;        // r = surface height above LEVEL, gb = slope, a = foam
uniform sampler2D tCaustic;      // r = focused moonlight on the bed plane
uniform vec3 uFieldDomain;       // xy = centre (local xz), z = 1 / size
uniform vec3 uCausticDomain;
uniform vec3 uLightDir;          // unit direction moonlight travels under water
varying vec3 vWorldPos;

${MEDIUM_GLSL}
${ROCK_DATA_GLSL}

vec4 fieldAt(vec2 xz) { return textureLod(tField, (xz - uFieldDomain.xy) * uFieldDomain.z + 0.5, 0.0); }

// Moonlight focused by the waves, where the moon ray through p lands on the bed (1 = undisturbed).
float causticAt(vec3 p, float lod) {
  float fall = max(p.y - BED_PLANE, 0.0) / -uLightDir.y;
  return textureLod(tCaustic, (p.xz + uLightDir.xz * fall - uCausticDomain.xy) * uCausticDomain.z + 0.5, lod).r;
}

// Distance along p + d t (p inside or on the wall) to the wall ahead.
float toWall(vec3 p, vec3 d) {
  float a = max(dot(d.xz, d.xz), 1e-6), b = dot(p.xz, d.xz);
  return (-b + sqrt(max(b * b - a * (dot(p.xz, p.xz) - RADIUS * RADIUS), 0.0))) / a;
}

// Light scattered toward the eye along a straight stretch of water that starts at height
// y0, climbs dy per metre and is len long. The body marches this integral to draw its
// shafts; with even light it has a closed form: the light fades with depth as
// exp(-DOWNWELL depth / mu) and the view as exp(-EXTINCT t), so the integrand is one
// exponential in t.
vec3 glowAlong(float y0, float dy, float len, vec3 light) {
  float mu = -uLightDir.y;
  vec3 x = (DOWNWELL * dy / mu - EXTINCT) * len;
  // (exp(x) - 1) / x, with its series where x passes through zero.
  vec3 far = step(vec3(1e-3), abs(x));
  vec3 xs = mix(vec3(1.0), x, far);
  vec3 integral = len * mix(1.0 + 0.5 * x, (exp(xs) - 1.0) / xs, far);
  return GLOW * light * exp(-DOWNWELL * max(LEVEL - y0, 0.0) / mu) * integral;
}

// The nearest boulder on the ray before tMax, as a plain ellipsoid: t, or tMax. n = its normal there.
float boulder(vec3 p, vec3 d, float tMax, out vec3 n) {
  float best = tMax;
  n = vec3(0.0, 1.0, 0.0);
  for (int i = 0; i < ROCK_COUNT; i++) {
    vec3 r = ROCK_R[i].xyz;
    float cy = ROCK_C[i].w, sy = ROCK_R[i].w;
    vec3 o = p - ROCK_C[i].xyz;
    o = vec3(cy * o.x + sy * o.z, o.y, cy * o.z - sy * o.x) / r;
    vec3 v = vec3(cy * d.x + sy * d.z, d.y, cy * d.z - sy * d.x) / r;
    float a = dot(v, v), b = dot(o, v);
    float h = b * b - a * (dot(o, o) - 1.0);
    float t = (-b - sqrt(max(h, 0.0))) / a;
    if (h > 0.0 && t > 0.0 && t < best) {
      best = t;
      vec3 q = (o + v * t) / r;                                  // gradient of the ellipsoid, in its own frame
      n = normalize(vec3(cy * q.x - sy * q.z, q.y, sy * q.x + cy * q.z));
    }
  }
  return best;
}

void main() {
  // The eye of this pass is the camera's mirror image under the film: its rays come up
  // through the film and meet the wall from outside, climbing.
  vec3 ro = cameraPosition - uOrigin;
  vec3 rd = normalize(vWorldPos - cameraPosition);
  float a = dot(rd.xz, rd.xz), b = dot(ro.xz, rd.xz);
  float disc = b * b - a * (dot(ro.xz, ro.xz) - RADIUS * RADIUS);
  if (disc <= 0.0 || rd.y < 1e-4) discard;
  float tFilm = max(-ro.y / rd.y, 0.0);
  float t0 = (-b - sqrt(disc)) / a;
  // A ray that comes up inside the footprint would have had to come through the bed. The
  // film only shows that part of the image where a ripple bends the lookup under the foot
  // of the column, so it is simply carried on unbent.
  bool under = t0 <= tFilm;
  vec3 pw = ro + rd * max(t0, tFilm);
  vec4 rim = fieldAt(pw.xz);
  if (pw.y > LEVEL + rim.r) discard;                             // over the lip: the wave line of the top edge

  vec3 n = vec3(pw.x, 0.0, pw.z) / RADIUS;
  float fres = under ? 0.0 : fresnelDielectric(max(-dot(rd, n), 0.0), 1.0 / IOR);
  vec3 d = under ? rd : refract(rd, n, 1.0 / IOR);
  float mu = -uLightDir.y;
  vec3 moon = uMoonColor * 1.5;
  vec3 ambient = skyAmbient(vec3(0.0, 1.0, 0.0));

  // ---- the first stretch: to a boulder, to the underside of the sea, or to the far wall
  float tWall = toWall(pw, d);
  float climb = max(d.y, 1e-3);
  float tSea = (LEVEL - pw.y) / climb;
  vec3 at = pw + d * min(tSea, tWall);
  vec4 sea = fieldAt(at.xz);                                     // the sea where the ray would reach mean level
  tSea = max(tSea + clamp(sea.r / climb, -1.5, 1.5), 0.0);
  vec3 nRock;
  float tRock = boulder(pw, d, min(tWall, tSea), nRock);
  float len = min(tRock, min(tWall, tSea));
  vec3 hit = pw + d * len;
  // One look at the caustic map half way along: the slow light and dark of the shafts.
  float shafts = mix(1.0, causticAt(pw + d * (0.5 * len), 3.0), 0.7);
  vec3 light = moon * moonPhase(d) * shafts + ambient;
  vec3 glow = glowAlong(pw.y, d.y, len, light);
  vec3 trans = exp(-EXTINCT * len);

  // ---- what stands at the end of it
  // A boulder: dark stone under the moon and the glow of the water.
  float depth = max(LEVEL - hit.y, 0.0);
  vec3 stone = vec3(0.055) * (moon * (0.2 + 0.8 * max(dot(nRock, -uLightDir), 0.0)) * exp(-DOWNWELL * depth / mu)
                            + ambient * 2.2 * exp(-DOWNWELL * depth));
  // The underside of the sea. Seen this flat from below it is a perfect mirror, and what it
  // mirrors is the lit sand: follow the ray down to the bed (or to the wall, if that comes first).
  vec3 down = vec3(d.x, -d.y, d.z);
  float tBed = (hit.y - BED_PLANE) / climb;
  float tWall2 = toWall(hit, down);
  float len2 = min(tBed, tWall2);
  vec3 bedAt = hit + down * len2;
  float bedDepth = LEVEL - BED_PLANE;
  vec3 sand = SAND * 0.50 * (moon * causticAt(bedAt, 2.0) * mu * exp(-DOWNWELL * bedDepth / mu)
                           + (ambient * 2.2 + moon * 0.16) * exp(-DOWNWELL * bedDepth));
  vec3 mirrorOfBed = glowAlong(hit.y, down.y, len2, light) + exp(-EXTINCT * len2) * sand * step(tBed, tWall2);
  // Foam overhead is a pale ceiling, not a mirror.
  mirrorOfBed = mix(mirrorOfBed, (moon * 0.24 + ambient * 1.7) * vec3(0.55, 0.85, 0.80), smoothstep(0.22, 0.90, sea.a) * 0.8);
  // The far wall: a window onto the sky beyond, and partly a mirror of the water behind us.
  vec3 nFar = -vec3(hit.x, 0.0, hit.z) / RADIUS;
  float fresFar = fresnelDielectric(max(-dot(d, nFar), 0.0), IOR);
  vec3 out3 = refract(d, nFar, IOR);
  out3 = fresFar < 1.0 ? out3 : d;
  vec3 beyond = envColor(vec3(out3.x, abs(out3.y), out3.z), 0.25) * exp(vec3(0.12, 0.015, 0.0) * len);
  vec3 inside = GLOW * (1.0 - exp(-EXTINCT * 4.0)) / EXTINCT * (moon * 0.84 + ambient) * exp(-DOWNWELL * depth);
  vec3 window = mix(beyond, inside, fresFar);

  vec3 seen = tRock < min(tWall, tSea) ? stone : (tSea < tWall ? mirrorOfBed : window);
  vec3 col = glow + trans * seen;
  // The outside of the wall: the sky, more of it toward the flanks.
  col = mix(col, envColor(reflect(rd, n), 0.0), fres);
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}
`;

/** The mesh that stands in for the column in the reflection pass. `uniforms` must carry the wave-field maps and uOrigin. */
export function createReflection(uniforms) {
  const top = LEVEL + MAX_SWELL;
  // A hair wider than the water, so the facets of the mesh enclose the true circle.
  const geometry = new THREE.CylinderGeometry(RADIUS * 1.005, RADIUS * 1.005, top, 40, 1, false);
  geometry.translate(0, top / 2, 0);
  const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    uniforms: { ...shared, ...uniforms },
    vertexShader: REFLECTION_VERT,
    fragmentShader: REFLECTION_FRAG,
  }));
  mesh.layers.set(LAYERS.MIRROR_ONLY);
  return mesh;
}
