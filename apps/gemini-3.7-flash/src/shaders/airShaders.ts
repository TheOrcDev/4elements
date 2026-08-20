import { GLSL_NOISE_SNIPPETS } from './noise.glsl.ts';

export const AIR_VORTEX_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uTwist;
uniform float uSpeed;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying float vHeight;

void main() {
  vUv = uv;
  vec3 p = position;
  
  vHeight = clamp((p.y + 1.6) / 3.2, 0.0, 1.0);
  
  // Helical cyclone twist
  float angle = p.y * uTwist - uTime * uSpeed;
  float cosA = cos(angle);
  float sinA = sin(angle);
  
  vec2 rotatedXZ = vec2(
    p.x * cosA - p.z * sinA,
    p.x * sinA + p.z * cosA
  );
  
  float wave = snoise(vec3(rotatedXZ * 1.5, uTime * 1.2)) * 0.12;
  p.x = rotatedXZ.x * (1.0 + wave);
  p.z = rotatedXZ.y * (1.0 + wave);

  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const AIR_VORTEX_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uHighlight;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying float vHeight;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = getFresnel(vWorldNormal, viewDir, 2.0, 0.15);
  
  // Helical spiral wind streaks
  float ribbon = sin(vUv.x * 18.0 + vUv.y * 8.0 - uTime * 3.0);
  float noise = snoise(vec3(vUv.x * 8.0, vUv.y * 4.0 - uTime * 1.5, uTime * 0.3)) * 0.5 + 0.5;
  
  float pattern = smoothstep(0.2, 0.85, ribbon * 0.5 + 0.5 + noise * 0.35);
  
  // Fade at very top and very bottom of the funnel
  float heightFade = smoothstep(0.0, 0.2, vHeight) * smoothstep(1.0, 0.8, vHeight);
  float alpha = pattern * heightFade * (0.35 + fresnel * 0.45);
  
  vec3 col = mix(uColor1, uColor2, vHeight);
  col = mix(col, uHighlight, pattern * 0.5);
  col += uHighlight * fresnel * 0.4;

  gl_FragColor = vec4(col, alpha);
}
`;

export const AIR_CORE_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uSpeed;

varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 noiseCoord = position * 1.5 + vec3(uTime * 0.5, -uTime * 0.3, uTime * 0.4);
  float n = snoise(noiseCoord) * 0.2;
  
  vec3 newPosition = position + normal * n;
  
  vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vPosition = newPosition;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const AIR_CORE_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform vec3 uCoreColor;
uniform vec3 uRimColor;
uniform vec3 uWispColor;

varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = getFresnel(vWorldNormal, viewDir, 2.5, 0.15);
  
  vec3 wispCoord = vPosition * 2.0 + vec3(uTime * 0.4, uTime * 0.5, -uTime * 0.2);
  float wisp = fbm(wispCoord, 4, 0.5, 2.0) * 0.5 + 0.5;
  
  vec3 col = mix(uCoreColor, uWispColor, wisp);
  col += uRimColor * fresnel * 0.45;
  
  float alpha = (wisp * 0.25 + fresnel * 0.45) * 0.65;

  gl_FragColor = vec4(col, alpha);
}
`;

export const AIR_GALE_PARTICLE_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uSpeed;
uniform float uPixelRatio;

attribute float aLife;
attribute float aSize;
attribute float aRadius;
attribute float aHeight;
attribute float aSpeed;
attribute float aSeed;

varying float vLife;
varying float vSeed;

void main() {
  vLife = aLife;
  vSeed = aSeed;

  // Helical cyclone spiral
  float t = uTime * aSpeed * 1.8 + aSeed * 20.0;
  float h = mod(aHeight + uTime * aSpeed * 0.7, 3.6) - 1.8;
  
  float coneFactor = (h + 1.8) * 0.3 + 0.35;
  float r = aRadius * coneFactor;
  
  vec3 p = vec3(
    cos(t) * r,
    h,
    sin(t) * r
  );
  
  vec3 curl = curlNoise(p * 0.6, uTime * 0.3, 0.1);
  p += curl * 0.2;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  
  float sizeDecay = sin(clamp((h + 1.8) / 3.6, 0.0, 1.0) * 3.14159);
  gl_PointSize = clamp(aSize * sizeDecay * (40.0 / -mvPosition.z) * uPixelRatio, 1.0, 20.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const AIR_GALE_PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uColor1;
uniform vec3 uColor2;

varying float vLife;
varying float vSeed;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float glow = smoothstep(0.5, 0.0, dist);
  
  vec3 col = mix(uColor1, uColor2, vSeed);
  col += vec3(0.4, 0.7, 1.0) * pow(glow, 2.0);
  
  gl_FragColor = vec4(col, glow * 0.85);
}
`;
