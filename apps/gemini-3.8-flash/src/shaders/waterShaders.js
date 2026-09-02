import { commonNoiseGLSL } from './noiseGlsl.js';

export const waterCoreVertexShader = /* glsl */ `
uniform float uTime;
uniform float uWaveHeight;
uniform float uWaveSpeed;

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;
varying vec2 vUv;

${commonNoiseGLSL}

void main() {
  vUv = uv;
  vec3 pos = position;

  // Multi-frequency wave displacement
  float t = uTime * uWaveSpeed;
  
  // Primary ocean swell
  float wave1 = snoise(pos * 1.5 + vec3(t * 0.8, t * 0.5, t * 0.6));
  // High frequency ripples
  float wave2 = snoise(pos * 3.2 - vec3(t * 1.2, t * 1.0, -t * 0.7)) * 0.45;
  // Micro chop
  float wave3 = snoise(pos * 6.5 + vec3(0.0, t * 2.0, 0.0)) * 0.2;

  float totalWave = wave1 + wave2 + wave3;
  vDisplacement = totalWave;

  // Push vertices along normal
  pos += normal * (totalWave * uWaveHeight);

  // Tangent surface perturbations for accurate 3D liquid normals
  vec3 displacedNormal = normalize(normal + vec3(wave2 * 0.3, wave3 * 0.2, wave1 * 0.3));
  vNormal = normalize(normalMatrix * displacedNormal);
  vWorldNormal = normalize(mat3(modelMatrix) * displacedNormal);
  vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const waterCoreFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorDeep;
uniform vec3 uColorShallow;
uniform vec3 uColorFoam;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;
varying vec2 vUv;

${commonNoiseGLSL}

// Procedural water caustics using overlapping voronoi-like cellular noise
float causticPattern(vec3 p) {
  float n1 = snoise(p);
  float n2 = snoise(p * 2.1 + vec3(0.7, 1.3, 0.2));
  float c = pow(1.0 - abs(n1), 3.0) + pow(1.0 - abs(n2), 3.0) * 0.5;
  return c;
}

void main() {
  vec3 worldNorm = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Key sun light and celestial hemisphere
  vec3 sunDir = normalize(vec3(12.0, 22.0, 10.0));
  float diff = max(dot(worldNorm, sunDir), 0.0);
  float hemi = worldNorm.y * 0.35 + 0.65; // 0.3 to 1.0

  // Fresnel effect (water is transparent facing straight on, reflective at grazing angles)
  float fresnel = 1.0 - max(dot(viewDir, worldNorm), 0.0);
  fresnel = pow(fresnel, 3.0);

  // Depth-based color gradient: oceanic deep sapphire in troughs, rich deep azure on ripples
  float depthRatio = smoothstep(-0.35, 0.40, vDisplacement);
  vec3 deepNavy = vec3(0.01, 0.08, 0.20);
  vec3 clearAzure = vec3(0.04, 0.18, 0.36);
  vec3 waterColor = mix(deepNavy, clearAzure, depthRatio);

  // Dynamic animated caustics dancing on surface
  vec3 causticCoord = vWorldPosition * 2.0 + vec3(uTime * 0.35, uTime * 0.25, uTime * 0.15);
  float caustic = causticPattern(causticCoord);
  waterColor += vec3(0.03, 0.12, 0.24) * caustic * 0.15;

  // Wave crest highlights - subtle seafoam
  float foamFactor = smoothstep(0.40, 0.80, vDisplacement);
  waterColor = mix(waterColor, vec3(0.10, 0.22, 0.36), foamFactor * 0.12);

  // Realistic directional & ambient liquid shading
  waterColor *= (diff * 0.45 + hemi * 0.45 + 0.32);

  // Specular sun glint - subtle crisp aquatic highlight
  vec3 halfVector = normalize(sunDir + viewDir);
  float spec = pow(max(dot(worldNorm, halfVector), 0.0), 36.0);
  waterColor += vec3(0.06, 0.14, 0.24) * spec * 0.08;

  // Subtle luminous rim
  waterColor += vec3(0.02, 0.08, 0.16) * fresnel * 0.06;

  float alpha = clamp(0.85 + fresnel * 0.10 + foamFactor * 0.08, 0.0, 0.95);
  gl_FragColor = vec4(waterColor, alpha);
}
`;

export const waterRingVertexShader = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;

${commonNoiseGLSL}

void main() {
  vUv = uv;
  vec3 pos = position;

  // Wave perturbation along toroidal ring
  float angle = atan(pos.z, pos.x);
  float wave = sin(angle * 6.0 + uTime * 3.0) * 0.08;
  pos.y += wave;

  vPos = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const waterRingFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;
varying vec3 vPos;

${commonNoiseGLSL}

void main() {
  // Flowing UV pattern
  float flow = snoise(vec3(vUv.x * 12.0 - uTime * 2.5, vUv.y * 6.0, uTime * 0.5));
  float alpha = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
  alpha *= (0.5 + flow * 0.3);

  vec3 col = uColor * 0.40 + vec3(flow * 0.02, flow * 0.05, flow * 0.10);

  gl_FragColor = vec4(col, alpha * 0.16);
}
`;

export const bubbleVertexShader = /* glsl */ `
uniform float uTime;
attribute float aSize;
attribute float aSpeed;
attribute vec3 aRandom;

varying float vLife;
varying vec3 vRandom;

void main() {
  vRandom = aRandom;
  float t = mod(uTime * aSpeed * 0.3 + aRandom.y * 5.0, 1.0);
  vLife = t;

  float radius = 0.4 + aRandom.x * 1.5;
  float angle = aRandom.z * 6.28318 + t * 2.0;

  // Sinusoidal gentle wobble
  float wobbleX = sin(uTime * 2.0 + aRandom.x * 10.0) * 0.12;
  float wobbleZ = cos(uTime * 2.5 + aRandom.z * 10.0) * 0.12;

  vec3 pos = vec3(
    cos(angle) * radius + wobbleX,
    -1.5 + t * 4.2,
    sin(angle) * radius + wobbleZ
  );

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float sizeScale = sin(t * 3.14159);
  gl_PointSize = (aSize * sizeScale * (1.0 / -mvPosition.z)) * 36.0;
}
`;

export const bubbleFragmentShader = /* glsl */ `
varying float vLife;
varying vec3 vRandom;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  // Bubble rim highlight
  float rim = smoothstep(0.28, 0.49, dist) - smoothstep(0.49, 0.5, dist);
  // Glint on top-left of bubble
  vec2 glintOffset = coord - vec2(-0.16, -0.16);
  float glint = 1.0 - smoothstep(0.0, 0.12, length(glintOffset));

  vec3 col = vec3(0.12, 0.35, 0.60);
  col += vec3(0.25, 0.55, 0.80) * glint * 0.25;
  col += vec3(0.08, 0.32, 0.55) * rim * 0.20;

  float alpha = rim * 0.35 + glint * 0.35 + 0.05;
  gl_FragColor = vec4(col, alpha * (1.0 - vLife * 0.4));
}
`;
