// Shared GLSL: uniform declarations, maths, the analytic sky, ray helpers and
// depth helpers. Concatenate the chunks you need in front of your shader source.

/** Declarations for every uniform in src/core/shared.js. Vertex and fragment. */
export const GLSL_UNIFORMS = /* glsl */ `
precision highp sampler3D;
uniform float uTime;
uniform float uDeltaTime;
uniform float uFrame;
uniform vec2 uResolution;
uniform sampler2D uSceneColor;
uniform sampler2D uSceneDepth;
uniform float uCameraNear;
uniform float uCameraFar;
uniform mat4 uProjectionMatrixInverse;
uniform mat4 uCameraWorldMatrix;
uniform float uIsMirrorPass;
uniform float uQuality;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
uniform vec3 uMoonDiscDir;
uniform vec3 uFireLightPos;
uniform vec3 uFireLightColor;
uniform vec4 uFlash;
uniform sampler3D uNoise3D;
uniform samplerCube uEnvCube;
uniform sampler2D uRippleTex;
uniform float uRippleDomain;
`;

/** Maths, sky model, intersections. Needs GLSL_UNIFORMS. Vertex and fragment. */
export const GLSL_COMMON = /* glsl */ `
#ifndef PI
#define PI 3.141592653589793
#endif
#ifndef TAU
#define TAU 6.283185307179586
#endif
#ifndef saturate
#define saturate(x) clamp(x, 0.0, 1.0)
#endif

float sq(float x) { return x * x; }
float remap(float x, float a, float b, float c, float d) { return c + (d - c) * clamp((x - a) / (b - a), 0.0, 1.0); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
mat2 rot2(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
// pow() of a negative base is NaN on Apple GPUs and one NaN blacks out the bloom chain.
float spow(float x, float e) { return pow(max(x, 0.0), e); }
vec3 spow(vec3 x, float e) { return pow(max(x, vec3(0.0)), vec3(e)); }

// Interleaved gradient noise: a stable per-pixel dither in [0, 1). Offset ray starts with it.
float ign(vec2 fragCoord) { return fract(52.9829189 * fract(dot(fragCoord, vec2(0.06711056, 0.00583715)))); }

// ---------------------------------------------------------------- sky
// Analytic dusk sky: deep indigo zenith, an afterglow on the horizon toward uSunDir
// and a faint Belt of Venus opposite it. HDR linear radiance. No stars, clouds or moon.
// Directions below the horizon return the mirrored sky, because the ground is a mirror.
vec3 skyColor(vec3 d) {
  float h = abs(d.y);
  vec2 az = d.xz / max(length(d.xz), 1e-5);
  vec2 sunAz = uSunDir.xz / max(length(uSunDir.xz), 1e-5);
  float toward = dot(az, sunAz) * 0.5 + 0.5;          // 1 facing the afterglow, 0 opposite
  float narrow = toward * toward * toward; narrow *= narrow;
  float wide = toward * toward;

  vec3 zenith = vec3(0.0042, 0.0080, 0.0270);
  vec3 midSky = vec3(0.0115, 0.0270, 0.0740);
  vec3 col = mix(midSky, zenith, smoothstep(0.0, 0.65, h));

  // Haze band hugging the whole horizon: teal toward the glow, slate blue away from it.
  vec3 hazeCol = mix(vec3(0.021, 0.031, 0.064), vec3(0.046, 0.108, 0.152), wide);
  col = mix(col, hazeCol, exp(-h * 9.0) * 0.9);

  // Belt of Venus above the earth shadow, opposite the sun.
  float away = 1.0 - toward;
  col += vec3(0.150, 0.070, 0.105) * exp(-sq((h - 0.11) / 0.07)) * away * away * 0.30;

  // Afterglow: a tight ember line on the horizon inside a broad peach wash.
  col += vec3(1.55, 0.50, 0.12) * exp(-h * 26.0) * narrow;
  col += vec3(0.80, 0.36, 0.20) * exp(-h * 9.0) * wide * wide * 0.22;
  col += vec3(0.10, 0.22, 0.26) * exp(-h * 3.5) * wide * 0.10;
  return col;
}

// Cheap irradiance for a surface or a puff of vapour with normal n. Sky above, mirrored
// sky below, with the afterglow adding warmth on the side that faces it.
vec3 skyAmbient(vec3 n) {
  vec3 base = mix(vec3(0.030, 0.046, 0.090), vec3(0.036, 0.062, 0.135), n.y * 0.5 + 0.5);
  vec3 glowDir = normalize(vec3(uSunDir.x, 0.12, uSunDir.z));
  float g = saturate(dot(n, glowDir) * 0.5 + 0.5);
  return base + vec3(0.300, 0.150, 0.075) * g * g * g;
}

// Mirror-ball style environment lookup with roughness in [0, 1] (uses the sky cube map mips).
vec3 envColor(vec3 dir, float roughness) { return textureLod(uEnvCube, dir, roughness * 6.0).rgb; }

// Lightning, as a light: a point source at uFlash.xyz with this radiant intensity (the air
// element drives a real PointLight with the same numbers). A surface receives
// flashIntensity() * max(dot(n, l), 0.0) / d^2 as irradiance (times albedo / PI); vapour
// and particles scatter about flashIntensity() / (4.0 * PI * d^2).
vec3 flashIntensity() { return vec3(0.62, 0.74, 1.0) * (uFlash.w * 260.0); }

// Approximate black-body colour for a temperature in Kelvin, linear RGB, peak channel = 1.
vec3 blackbody(float kelvin) {
  float t = clamp(kelvin, 800.0, 20000.0) / 100.0;
  vec3 c;
  c.r = t <= 66.0 ? 1.0 : saturate(1.29293618606 * pow(t - 60.0, -0.1332047592));
  c.g = t <= 66.0 ? saturate(0.39008157876 * log(t) - 0.63184144378) : saturate(1.12989086089 * pow(t - 60.0, -0.0755148492));
  c.b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : saturate(0.54320678911 * log(t - 10.0) - 1.19625408914));
  return pow(c, vec3(2.2));
}

// ---------------------------------------------------------------- ray / shape intersections
// All return (tNear, tFar) along the ray. The ray misses when tNear > tFar.
vec2 boxIntersect(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax) {
  vec3 inv = 1.0 / (rd + vec3(1e-7) * (1.0 - abs(sign(rd))));
  vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;
  vec3 tmin = min(t0, t1), tmax = max(t0, t1);
  return vec2(max(max(tmin.x, tmin.y), tmin.z), min(min(tmax.x, tmax.y), tmax.z));
}
vec2 sphereIntersect(vec3 ro, vec3 rd, vec3 centre, float radius) {
  vec3 oc = ro - centre;
  float b = dot(oc, rd);
  float h = b * b - (dot(oc, oc) - radius * radius);
  if (h < 0.0) return vec2(1.0, -1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}
// Upright capped cylinder: axis through centre.xz, radius, between heights y0 and y1.
vec2 cylinderIntersect(vec3 ro, vec3 rd, vec3 centre, float radius, float y0, float y1) {
  vec2 o = ro.xz - centre.xz;
  float a = max(dot(rd.xz, rd.xz), 1e-8);
  float b = dot(o, rd.xz);
  float h = b * b - a * (dot(o, o) - radius * radius);
  if (h < 0.0) return vec2(1.0, -1.0);
  h = sqrt(h);
  float ry = abs(rd.y) < 1e-6 ? 1e-6 : rd.y;
  float ta = (y0 - ro.y) / ry, tb = (y1 - ro.y) / ry;
  return vec2(max((-b - h) / a, min(ta, tb)), min((-b + h) / a, max(ta, tb)));
}
`;

/** Fragment-only helpers: screen coordinates and the opaque scene's depth. */
export const GLSL_FRAG = /* glsl */ `
// UV of this fragment in the current render target.
vec2 screenUV() { return gl_FragCoord.xy / uResolution; }

// Depth-buffer value -> positive distance along the camera's forward axis.
float viewZFromDepth(float depth) {
  float z = depth * 2.0 - 1.0;
  return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uCameraNear - z * (uCameraFar - uCameraNear));
}
// Forward-axis distance to the opaque scene at uv. Reads as "very far" in the mirror pass.
float sceneViewZ(vec2 uv) { return viewZFromDepth(texture(uSceneDepth, uv).r); }

vec3 cameraForward() { return -normalize(uCameraWorldMatrix[2].xyz); }

// Distance along a world-space ray (from the camera, direction rd) to the opaque scene.
// Clamp a raymarch with it: tMax = min(tExit, sceneRayDistance(screenUV(), rd)).
float sceneRayDistance(vec2 uv, vec3 rd) { return sceneViewZ(uv) / max(dot(rd, cameraForward()), 1e-4); }

// World position of the opaque scene at uv.
vec3 sceneWorldPos(vec2 uv) {
  vec4 clip = vec4(uv * 2.0 - 1.0, texture(uSceneDepth, uv).r * 2.0 - 1.0, 1.0);
  vec4 view = uProjectionMatrixInverse * clip;
  return (uCameraWorldMatrix * (view / view.w)).xyz;
}

// Soft-particle fade: 0 where the fragment touches opaque geometry, 1 once it is
// 'range' metres in front of it. fragViewZ = -(modelViewMatrix * position).z.
float softFade(float fragViewZ, float range) { return saturate((sceneViewZ(screenUV()) - fragViewZ) / range); }
`;
