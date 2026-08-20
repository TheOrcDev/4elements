/**
 * Procedural GLSL Noise, FBM, Curl Noise, Fresnel and Utility Library
 */

export const GLSL_NOISE_SNIPPETS = /* glsl */ `
// --- Ashima Arts / Stefan Gustavson Simplex 3D Noise ---
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  // Permutations
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix contributions from the four corners
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// --- Fractional Brownian Motion (FBM) ---
float fbm(vec3 p, int octaves, float persistence, float lacunarity) {
  float total = 0.0;
  float frequency = 1.0;
  float amplitude = 1.0;
  float maxValue = 0.0;
  for(int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    total += snoise(p * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return total / max(maxValue, 0.0001);
}

// Default FBM
float fbm(vec3 p) {
  return fbm(p, 4, 0.5, 2.0);
}

// --- Cellular / Voronoi Noise 3D ---
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx)*p3.zyx);
}

vec2 voronoi3D(vec3 p) {
  vec3 n = floor(p);
  vec3 f = fract(p);
  float md = 8.0;
  float md2 = 8.0;
  for(int k=-1; k<=1; k++) {
    for(int j=-1; j<=1; j++) {
      for(int i=-1; i<=1; i++) {
        vec3 g = vec3(float(i), float(j), float(k));
        vec3 o = hash33(n + g);
        vec3 r = g + o - f;
        float d = dot(r, r);
        if(d < md) {
          md2 = md;
          md = d;
        } else if(d < md2) {
          md2 = d;
        }
      }
    }
  }
  return vec2(sqrt(max(md, 0.0)), sqrt(max(md2, 0.0)));
}

// --- 3D Curl Noise for Fluids, Wind, Embers ---
vec3 curlNoise(vec3 p, float time, float eps) {
  float n1 = snoise(p + vec3(0.0, eps, 0.0) + vec3(time * 0.1));
  float n2 = snoise(p - vec3(0.0, eps, 0.0) + vec3(time * 0.1));
  float n3 = snoise(p + vec3(0.0, 0.0, eps) + vec3(time * 0.1));
  float n4 = snoise(p - vec3(0.0, 0.0, eps) + vec3(time * 0.1));
  float n5 = snoise(p + vec3(eps, 0.0, 0.0) + vec3(time * 0.1));
  float n6 = snoise(p - vec3(eps, 0.0, 0.0) + vec3(time * 0.1));
  
  float x = (n1 - n2) / (2.0 * eps) - (n3 - n4) / (2.0 * eps);
  float y = (n3 - n4) / (2.0 * eps) - (n5 - n6) / (2.0 * eps);
  float z = (n5 - n6) / (2.0 * eps) - (n1 - n2) / (2.0 * eps);
  
  vec3 v = vec3(x, y, z);
  float len = length(v);
  return len > 0.0001 ? v / len : vec3(0.0, 1.0, 0.0);
}

// --- World-Space Fresnel Rim Glow Factor ---
float getFresnel(vec3 worldNormal, vec3 worldViewDir, float power, float bias) {
  float cosTheta = clamp(dot(normalize(worldNormal), normalize(worldViewDir)), 0.0, 1.0);
  return bias + (1.0 - bias) * pow(max(1.0 - cosTheta, 0.0001), power);
}

// --- Gerstner Wave Generator ---
vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal, float time) {
  float steepness = wave.z;
  float wavelength = wave.w;
  float k = 2.0 * 3.14159265 / max(wavelength, 0.001);
  float c = sqrt(9.8 / k);
  vec2 d = normalize(wave.xy);
  float f = k * (dot(d, p.xz) - c * time);
  float a = steepness / k;

  tangent += vec3(
    -d.x * d.x * (steepness * sin(f)),
    d.x * (steepness * cos(f)),
    -d.x * d.y * (steepness * sin(f))
  );
  binormal += vec3(
    -d.x * d.y * (steepness * sin(f)),
    d.y * (steepness * cos(f)),
    -d.y * d.y * (steepness * sin(f))
  );

  return vec3(
    d.x * (a * cos(f)),
    a * sin(f),
    d.y * (a * cos(f))
  );
}
`;
