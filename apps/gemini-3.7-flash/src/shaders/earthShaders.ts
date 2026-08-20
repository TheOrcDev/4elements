import { GLSL_NOISE_SNIPPETS } from './noise.glsl.ts';

export const EARTH_CORE_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uDisplacement;
uniform float uPlateScale;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;
varying vec2 vUv;
varying float vHeight;
varying float vVein;

void main() {
  vUv = uv;
  vec3 p = position;
  
  // Tectonic plate displacement
  float rockNoise = fbm(p * 2.0, 4, 0.55, 2.1) * 0.5 + 0.5;
  vec2 vor = voronoi3D(p * uPlateScale);
  float plate = smoothstep(0.08, 0.45, vor.y - vor.x);
  
  float disp = (rockNoise * 0.6 + plate * 0.4) * uDisplacement;
  p += normal * disp;

  vHeight = disp;
  vVein = 1.0 - plate; // Fissure channels
  vPosition = p;

  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vWorldPosition = worldPos.xyz;
  
  // Approximate normal
  vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.001)));
  vec3 bitangent = normalize(cross(normal, tangent));
  vec3 cr = cross(tangent, bitangent);
  float crLen = length(cr);
  vec3 calculatedNormal = crLen > 0.0001 ? cr / crLen : normal;
  vWorldNormal = normalize(mat3(modelMatrix) * calculatedNormal);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const EARTH_CORE_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform vec3 uRockColorDark;
uniform vec3 uRockColorLight;
uniform vec3 uMossColor;
uniform vec3 uCrystalGlowColor;
uniform vec3 uLightPos;
uniform float uGlowPulse;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;
varying vec2 vUv;
varying float vHeight;
varying float vVein;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 lightDir = normalize(uLightPos - vWorldPosition);
  
  // Diffuse shading
  float diff = max(dot(vWorldNormal, lightDir), 0.15);
  
  // Rock stratum texture
  float grain = snoise(vPosition * 12.0) * 0.5 + 0.5;
  vec3 rock = mix(uRockColorDark, uRockColorLight, grain * 0.5 + vHeight * 0.5);
  
  // Vegetation/Flora on crags
  float mossWeight = smoothstep(0.12, 0.35, vHeight) * smoothstep(-0.2, 0.8, vPosition.y);
  vec3 surfaceColor = mix(rock, uMossColor, mossWeight * 0.7);
  
  // Bioluminescent crystalline energy in magma fissures
  float pulse = sin(uTime * 2.0 + vPosition.x * 3.0) * 0.2 + 0.8;
  float fissureEnergy = smoothstep(0.4, 0.85, vVein) * pulse * uGlowPulse;
  vec3 fissureGlow = uCrystalGlowColor * fissureEnergy * 2.2;
  
  // Fresnel rock rim
  float fresnel = getFresnel(vWorldNormal, viewDir, 3.5, 0.05);
  vec3 finalColor = surfaceColor * diff + fissureGlow + uMossColor * fresnel * 0.35;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const CRYSTAL_SHARD_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const CRYSTAL_SHARD_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform vec3 uCrystalColor;
uniform vec3 uHighlightColor;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = getFresnel(vWorldNormal, viewDir, 2.5, 0.2);
  
  // Internal crystalline refractive shimmer
  float facetNoise = snoise(vPosition * 8.0 + vec3(uTime * 0.5)) * 0.5 + 0.5;
  
  // Specular facet glints
  vec3 lightDir = normalize(vec3(5.0, 10.0, 7.0));
  vec3 halfVec = normalize(lightDir + viewDir);
  float spec = pow(max(dot(vWorldNormal, halfVec), 0.0), 32.0);

  vec3 col = mix(uCrystalColor, uHighlightColor, fresnel * 0.8 + facetNoise * 0.2);
  col += vec3(1.0) * spec * 1.5;

  gl_FragColor = vec4(col, 0.92);
}
`;

export const EARTH_SPORE_PARTICLE_VERTEX = /* glsl */ `
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
  float t = uTime * uSpeed + aSeed * 20.0;
  
  // Organic floating drift
  vec3 curl = curlNoise(p * 0.5, t * 0.3, 0.1);
  p += curl * 0.3;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  
  float sizeDecay = sin(clamp(aLife, 0.0, 1.0) * 3.14159);
  gl_PointSize = clamp(aSize * sizeDecay * (40.0 / -mvPosition.z) * uPixelRatio, 1.0, 20.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const EARTH_SPORE_PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;

varying float vLife;
varying float vSeed;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float glow = smoothstep(0.5, 0.0, dist);
  float twinkle = sin(vLife * 12.0 + vSeed * 6.28) * 0.3 + 0.7;

  vec3 col = uColor * twinkle;
  col += vec3(0.8, 1.0, 0.4) * pow(glow, 2.0);

  gl_FragColor = vec4(col, glow * 0.95);
}
`;
