// Procedural noise library shared by every shader in the scene.
// Works in vertex and fragment shaders (GLSL ES 3.00).
export const GLSL_NOISE = /* glsl */ `
// ---------------------------------------------------------------- hashes
// "Hash without sine" by Dave Hoskins. All return values in [0, 1).
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec2 hash21(float p) { vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
vec3 hash31(float p) { vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }
vec3 hash32(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }
vec3 hash33(vec3 p3) { p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }

// ---------------------------------------------------------------- value noise, [0, 1]
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), u.x),
                 mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
             mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), u.x),
                 mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

// ---------------------------------------------------------------- simplex noise, [-1, 1]
// Ian McEwan / Stefan Gustavson (Ashima Arts), MIT licence.
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Three decorrelated simplex samples, each in [-1, 1].
vec3 snoise3(vec3 p) {
  return vec3(snoise(p), snoise(p.yzx + vec3(31.416, -47.853, 12.793)), snoise(p.zxy + vec3(-233.145, -113.408, -185.31)));
}

// ---------------------------------------------------------------- fractal sums
// Simplex fBm, roughly [-1, 1].
float fbm(vec3 p, int octaves) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < octaves; i++) { s += a * snoise(p); p = p * 2.02 + vec3(17.13, 3.71, 9.37); a *= 0.5; }
  return s;
}
float fbm(vec2 p, int octaves) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < octaves; i++) { s += a * snoise(p); p = p * 2.02 + vec2(17.13, 3.71); a *= 0.5; }
  return s;
}
// Value-noise fBm, cheaper, [0, 1].
float vfbm(vec3 p, int octaves) {
  float a = 0.5, s = 0.0, n = 0.0;
  for (int i = 0; i < octaves; i++) { s += a * vnoise(p); n += a; p = p * 2.03 + vec3(11.7, 5.3, 23.1); a *= 0.5; }
  return s / n;
}
float vfbm(vec2 p, int octaves) {
  float a = 0.5, s = 0.0, n = 0.0;
  for (int i = 0; i < octaves; i++) { s += a * vnoise(p); n += a; p = p * 2.03 + vec2(11.7, 5.3); a *= 0.5; }
  return s / n;
}
// Ridged multifractal, [0, 1]. Sharp crests: rock strata, lightning, veins.
float ridged(vec3 p, int octaves) {
  float a = 0.5, s = 0.0, n = 0.0, prev = 1.0;
  for (int i = 0; i < octaves; i++) {
    float r = 1.0 - abs(snoise(p)); r *= r;
    s += a * r * prev; n += a; prev = r;
    p = p * 2.05 + vec3(7.3, 19.1, 2.9); a *= 0.5;
  }
  return s / n;
}

// ---------------------------------------------------------------- cellular
// F1 distance to the nearest feature point, [0, ~1].
float worley(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y));
    vec2 r = o + hash22(i + o) - f;
    d = min(d, dot(r, r));
  }
  return sqrt(d);
}
float worley(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d = 8.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(float(x), float(y), float(z));
    vec3 r = o + hash33(i + o) - f;
    d = min(d, dot(r, r));
  }
  return sqrt(d);
}
// 2D Voronoi: x = F1, y = distance to the nearest cell border, z = random id of the cell.
vec3 voronoi(vec2 p) {
  vec2 n = floor(p), f = fract(p);
  vec2 mg, mr; float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 r = g + hash22(n + g) - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  float bd = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 r = g + hash22(n + g) - f;
    if (dot(mr - r, mr - r) > 1e-5) bd = min(bd, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec3(sqrt(md), bd, hash12(n + mg));
}

// ---------------------------------------------------------------- curl noise
// Divergence-free flow field, magnitude ~1. 18 simplex evaluations: use it per
// vertex or per particle, not per raymarch step.
vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0), dy = vec3(0.0, e, 0.0), dz = vec3(0.0, 0.0, e);
  vec3 px0 = snoise3(p - dx), px1 = snoise3(p + dx);
  vec3 py0 = snoise3(p - dy), py1 = snoise3(p + dy);
  vec3 pz0 = snoise3(p - dz), pz1 = snoise3(p + dz);
  return vec3(py1.z - py0.z - pz1.y + pz0.y,
              pz1.x - pz0.x - px1.z + px0.z,
              px1.y - px0.y - py1.x + py0.x) / (2.0 * e);
}

// ---------------------------------------------------------------- baked 3D noise
// uNoise3D is a tiling 128^3 RGBA texture (period 1 on every axis, trilinear, mipmapped).
// One fetch is far cheaper than any procedural noise above: use it inside raymarch loops.
//   r: Perlin fBm, base frequency 4      (soft, cloudy;   mean 0.5)
//   g: Worley fBm, base frequency 4      (billowy cells;  1 at cell centres)
//   b: Perlin fBm, base frequency 12     (fine detail;    mean 0.5)
//   a: Worley fBm, base frequency 12     (fine billows)
vec4 noiseTex(vec3 p) { return texture(uNoise3D, p); }
vec4 noiseTexLod(vec3 p, float lod) { return textureLod(uNoise3D, p, lod); }
`;
