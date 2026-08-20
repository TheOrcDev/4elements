import { GLSL_NOISE_SNIPPETS } from './noise.glsl.ts';

export const WATER_CORE_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uWaveHeight;
uniform float uWaveSpeed;
uniform float uWaveFrequency;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;
varying vec2 vUv;
varying float vDisplacement;

void main() {
  vUv = uv;
  vec3 p = position;
  
  // Multi-directional undulating waves
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 bitangent = vec3(0.0, 0.0, 1.0);
  
  // Wave 1
  vec4 wave1 = vec4(1.0, 0.3, 0.25, 2.0 / uWaveFrequency);
  p += gerstnerWave(wave1, position, tangent, bitangent, uTime * uWaveSpeed);
  
  // Wave 2
  vec4 wave2 = vec4(-0.6, 0.8, 0.2, 1.2 / uWaveFrequency);
  p += gerstnerWave(wave2, position, tangent, bitangent, uTime * uWaveSpeed * 1.3);

  // Micro-surface ripples
  float ripple = snoise(p * 4.0 + vec3(uTime * 0.8)) * 0.08 * uWaveHeight;
  p += normal * ripple;
  
  vDisplacement = length(p) - length(position);
  vPosition = p;

  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vWorldPosition = worldPos.xyz;
  
  // World space normal
  vec3 cr = cross(tangent, bitangent);
  float crLen = length(cr);
  vec3 calculatedNormal = crLen > 0.0001 ? cr / crLen : normal;
  vWorldNormal = normalize(mat3(modelMatrix) * calculatedNormal);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const WATER_CORE_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform vec3 uLightPos;
uniform float uRefractionRatio;
uniform float uCausticIntensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;
varying vec2 vUv;
varying float vDisplacement;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 lightDir = normalize(uLightPos - vWorldPosition);
  
  // World Fresnel Factor
  float fresnel = getFresnel(vWorldNormal, viewDir, 3.0, 0.15);

  // Procedural 3D Voronoi Caustics
  vec2 causticsVor = voronoi3D(vPosition * 3.5 + vec3(uTime * 0.4, uTime * 0.3, -uTime * 0.2));
  float causticPattern = pow(max(1.0 - (causticsVor.y - causticsVor.x), 0.0), 3.0);
  
  // Specular Blinn-Phong Glint
  vec3 halfVec = normalize(lightDir + viewDir);
  float spec = pow(max(dot(vWorldNormal, halfVec), 0.0), 64.0) * 1.5;

  // Foam on wave peaks
  float foam = smoothstep(0.12, 0.28, vDisplacement);

  // Water color grading
  vec3 waterColor = mix(uDeepColor, uShallowColor, fresnel * 0.75 + 0.25);
  waterColor += uCausticIntensity * causticPattern * vec3(0.5, 0.85, 1.0);
  waterColor = mix(waterColor, uFoamColor, foam * 0.8);
  waterColor += vec3(1.0) * spec;
  waterColor += uShallowColor * fresnel * 0.6;

  gl_FragColor = vec4(waterColor, 0.88);
}
`;

export const WATER_RIPPLE_STREAM_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uSpeed;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec3 p = position;
  
  // Helical stream wave pulsation
  float pulse = snoise(vec3(uv * 5.0, uTime * uSpeed)) * 0.12;
  p += normal * pulse;

  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const WATER_RIPPLE_STREAM_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = getFresnel(vWorldNormal, viewDir, 2.0, 0.1);
  
  // Animated flowing stream texture
  float flow = snoise(vec3(vUv * 8.0, uTime * 0.8)) * 0.5 + 0.5;
  float alpha = (flow * 0.5 + 0.5) * fresnel * 0.75;

  gl_FragColor = vec4(uColor + vec3(0.2, 0.4, 0.6) * fresnel, alpha);
}
`;

export const WATER_DROPLET_PARTICLE_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uSpeed;
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
  float t = uTime * uSpeed + aSeed * 5.0;
  
  // Curl noise vortex deviation
  vec3 curl = curlNoise(p * 0.8, t, 0.1);
  p += curl * 0.25 * (1.0 - aLife);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  
  float sizeDecay = sin(clamp(aLife, 0.0, 1.0) * 3.14159);
  gl_PointSize = clamp(aSize * (40.0 / -mvPosition.z) * uPixelRatio, 1.0, 20.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const WATER_DROPLET_PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;

varying float vLife;
varying float vSeed;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float ring = smoothstep(0.48, 0.35, dist) * smoothstep(0.0, 0.3, dist);
  float center = smoothstep(0.2, 0.0, dist) * 0.8;
  float alpha = (ring + center) * 0.85;

  vec3 col = uColor + vec3(0.4, 0.7, 1.0) * center;
  gl_FragColor = vec4(col, alpha);
}
`;
