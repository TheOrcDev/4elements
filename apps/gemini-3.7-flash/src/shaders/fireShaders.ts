import { GLSL_NOISE_SNIPPETS } from './noise.glsl.ts';

export const FIRE_CORE_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uDisplacement;
uniform float uSpeed;
uniform float uTurbulence;

varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vNoise;

void main() {
  vUv = uv;
  
  // Turbulent flame displacement along local normal
  vec3 noiseCoord = position * uTurbulence + vec3(0.0, -uTime * uSpeed, 0.0);
  float n1 = snoise(noiseCoord);
  float n2 = snoise(noiseCoord * 2.2 + vec3(1.7, 3.2, 0.5)) * 0.5;
  float n3 = snoise(noiseCoord * 4.0 - vec3(0.5, 1.2, 3.4)) * 0.25;
  float noiseVal = (n1 + n2 + n3);
  vNoise = noiseVal;

  float heightWeight = smoothstep(-1.2, 1.2, position.y);
  float disp = (noiseVal * 0.4 + 0.1) * uDisplacement * (1.0 + heightWeight * 1.5);
  vec3 newPosition = position + normal * disp;
  
  // Compute world position and world normal
  vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vPosition = newPosition;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const FIRE_CORE_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorCore;
uniform vec3 uColorMid;
uniform vec3 uColorOuter;
uniform vec3 uColorDark;

varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vNoise;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  
  // Internal turbulent magma flow
  vec3 fbmCoord = vPosition * 2.2 + vec3(0.0, -uTime * 1.5, 0.0);
  float f = fbm(fbmCoord, 4, 0.5, 2.0) * 0.5 + 0.5;
  
  // Voronoi fissures
  vec2 vor = voronoi3D(vPosition * 3.0 + vec3(0.0, -uTime * 1.0, 0.0));
  float fissure = smoothstep(0.05, 0.5, vor.y - vor.x);
  
  float nNorm = vNoise * 0.5 + 0.5;
  float heat = clamp((f * 0.45 + fissure * 0.35 + nNorm * 0.35) * uIntensity, 0.0, 2.0);
  
  // Rich thermal gradient
  vec3 fireColor = mix(uColorDark, uColorOuter, smoothstep(0.0, 0.35, heat));
  fireColor = mix(fireColor, uColorMid, smoothstep(0.35, 0.75, heat));
  fireColor = mix(fireColor, uColorCore, smoothstep(0.75, 1.25, heat));

  // Fresnel rim fire
  float fresnel = getFresnel(vWorldNormal, viewDir, 2.2, 0.1);
  fireColor += uColorMid * fresnel * 0.85;
  
  // Hot incandescent core center
  fireColor += uColorCore * pow(heat, 3.0) * 0.35;

  gl_FragColor = vec4(fireColor, 1.0);
}
`;

export const FIRE_CORONA_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uExpansion;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 noiseCoord = position * 1.8 + vec3(0.0, -uTime * 1.8, 0.0);
  float n = snoise(noiseCoord) * 0.2;
  vec3 newPos = position + normal * (uExpansion + n);
  
  vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const FIRE_CORONA_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform vec3 uColor;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = getFresnel(vWorldNormal, viewDir, 2.5, 0.0);
  
  float noise = snoise(vWorldPosition * 2.0 + vec3(0.0, -uTime * 2.0, 0.0)) * 0.5 + 0.5;
  float alpha = fresnel * noise * 0.65;

  gl_FragColor = vec4(uColor, alpha);
}
`;

export const EMBER_PARTICLE_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uSpeed;
uniform float uTurbulence;
uniform float uPixelRatio;

attribute float aLife;
attribute float aSize;
attribute vec3 aVelocity;
attribute float aSeed;

varying float vLife;
varying float vSeed;

void main() {
  vLife = aLife;
  vSeed = aSeed;

  vec3 p = position;
  float t = uTime * uSpeed + aSeed * 10.0;
  
  // Curl noise particle ascent
  vec3 curl = curlNoise(p * uTurbulence * 0.8, t * 0.5, 0.1);
  p += curl * 0.35 * (1.0 - aLife);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  
  // Size decay with life cycle
  float sizeDecay = sin(clamp(aLife, 0.0, 1.0) * 3.14159);
  gl_PointSize = clamp(aSize * sizeDecay * (45.0 / -mvPosition.z) * uPixelRatio, 1.0, 24.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const EMBER_PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uColorEmber;
uniform vec3 uColorHot;

varying float vLife;
varying float vSeed;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float glow = smoothstep(0.5, 0.0, dist);
  
  // Color shifts from hot yellow-white to burning red-orange
  vec3 col = mix(uColorEmber, uColorHot, vLife);
  col += vec3(1.0, 0.6, 0.1) * pow(glow, 2.5);

  gl_FragColor = vec4(col, glow * 0.9);
}
`;
