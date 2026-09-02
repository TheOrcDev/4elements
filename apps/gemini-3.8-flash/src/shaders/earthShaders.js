import { commonNoiseGLSL } from './noiseGlsl.js';

export const earthRockVertexShader = /* glsl */ `
uniform float uTime;
uniform float uPulse;

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vNoise;
varying vec2 vUv;

${commonNoiseGLSL}

void main() {
  vUv = uv;
  vec3 pos = position;

  // Rocky stratified crags
  float crag = fbm4(pos * 2.5);
  // Sharp faceted cliffs
  float ridge = abs(snoise(pos * 4.0)) * 0.35;
  vNoise = crag;

  pos += normal * ((crag * 0.35 + ridge) * (1.0 + uPulse * 0.2));

  vec3 displacedNormal = normalize(normal + vec3(ridge * 0.4, 0.0, crag * 0.3));
  vNormal = normalize(normalMatrix * displacedNormal);
  vWorldNormal = normalize(mat3(modelMatrix) * displacedNormal);
  vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const earthRockFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorRock;
uniform vec3 uColorMoss;
uniform vec3 uColorVein;
uniform float uVeinGlow;

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vNoise;
varying vec2 vUv;

${commonNoiseGLSL}

void main() {
  vec3 worldNorm = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Key celestial sun & hemisphere illumination
  vec3 sunDir = normalize(vec3(12.0, 22.0, 10.0));
  float diff = max(dot(worldNorm, sunDir), 0.0);
  float hemi = worldNorm.y * 0.35 + 0.65; // 0.3 to 1.0

  vec3 fillDir = normalize(vec3(-12.0, -8.0, -10.0));
  float fill = max(dot(worldNorm, fillDir), 0.0) * 0.3;

  // Rock base with strata layering - rich warm mineral granite texture
  float strata = sin(vWorldPosition.y * 7.0 + vNoise * 3.0) * 0.5 + 0.5;
  vec3 rockCol = mix(uColorRock * 0.95, uColorRock * 1.25, strata);

  // Top-facing slopes accumulate natural forest moss
  float topSlope = max(dot(worldNorm, vec3(0.0, 1.0, 0.0)), 0.0);
  rockCol = mix(rockCol, uColorMoss, smoothstep(0.25, 0.65, topSlope));

  // Balanced diffuse lighting on rock geometry with generous shadow fill
  vec3 rockLit = rockCol * (diff * 0.70 + fill * 0.6 + hemi * 0.60 + 0.38);

  // Mineral facet specular glint
  vec3 halfVec = normalize(sunDir + viewDir);
  float spec = pow(max(dot(worldNorm, halfVec), 0.0), 18.0);
  rockLit += vec3(0.24, 0.22, 0.18) * spec * 0.14;

  // Glowing magical emerald crystal veins in the fissures
  float veinNoise = abs(snoise(vWorldPosition * 3.5 + vec3(0.0, uTime * 0.08, 0.0)));
  float vein = 1.0 - smoothstep(0.0, 0.055, veinNoise);
  
  // Vein pulse - soft, organic luminescent emerald glow
  float pulse = sin(uTime * 2.0 + vWorldPosition.y * 3.0) * 0.5 + 0.5;
  vec3 emissiveVein = uColorVein * vein * (0.24 + pulse * 0.08) * uVeinGlow;

  // Mineral edge glint
  float fresnel = 1.0 - max(dot(viewDir, worldNorm), 0.0);
  fresnel = pow(fresnel, 3.0);

  vec3 finalCol = rockLit + emissiveVein + uColorVein * fresnel * 0.08;

  gl_FragColor = vec4(finalCol, 1.0);
}
`;

export const crystalVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const crystalFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorInner;
uniform vec3 uColorOuter;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 normal = normalize(vWorldNormal);

  // Crystal facets refraction & internal emerald glow
  float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
  fresnel = pow(fresnel, 2.0);

  // Sparkle internal facet glint
  float pulse = sin(uTime * 3.0 + vWorldPosition.x * 5.0) * 0.5 + 0.5;

  vec3 col = mix(uColorInner, uColorOuter, fresnel * 0.45);
  col += vec3(0.04, 0.28, 0.18) * pow(fresnel, 3.0) * 0.20; // emerald facet edge
  col += uColorOuter * pulse * 0.06;

  vec3 sunDir = normalize(vec3(12.0, 22.0, 10.0));
  float diff = max(dot(normal, sunDir), 0.0);
  float hemi = normal.y * 0.35 + 0.65;
  col *= (diff * 0.50 + hemi * 0.50);

  gl_FragColor = vec4(col, 0.88);
}
`;

export const sporeVertexShader = /* glsl */ `
uniform float uTime;
attribute float aSize;
attribute float aSpeed;
attribute vec3 aRandom;

varying float vLife;

void main() {
  float t = mod(uTime * aSpeed * 0.2 + aRandom.y * 8.0, 1.0);
  vLife = t;

  float radius = 0.6 + aRandom.x * 1.8;
  float angle = aRandom.z * 6.28318 + t * 1.5;

  // Meandering float like fireflies/spores
  float wanderX = sin(uTime * 1.2 + aRandom.x * 6.0) * 0.3;
  float wanderZ = cos(uTime * 1.5 + aRandom.z * 6.0) * 0.3;

  vec3 pos = vec3(
    cos(angle) * radius + wanderX,
    -1.4 + t * 4.0,
    sin(angle) * radius + wanderZ
  );

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float pulse = sin(t * 3.14159);
  gl_PointSize = (aSize * pulse * (1.0 / -mvPosition.z)) * 36.0;
}
`;

export const sporeFragmentShader = /* glsl */ `
varying float vLife;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 2.0);

  // Emerald/gold bioluminescent spore
  vec3 col = mix(vec3(0.12, 0.65, 0.32), vec3(0.65, 0.75, 0.22), vLife);

  gl_FragColor = vec4(col, glow * 0.65 * (1.0 - vLife * 0.3));
}
`;
