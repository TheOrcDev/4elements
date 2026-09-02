import { commonNoiseGLSL } from './noiseGlsl.js';

export const airCoreVertexShader = /* glsl */ `
uniform float uTime;
uniform float uSpeed;

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

  // High velocity rotational twist
  float angle = atan(pos.z, pos.x) + uTime * uSpeed * 2.0;
  float rad = length(pos.xz);
  
  // Turbulent atmospheric ripples
  float n = snoise(vec3(cos(angle) * rad * 2.0, pos.y * 3.0 - uTime * 3.0, sin(angle) * rad * 2.0));
  vNoise = n;

  pos += normal * (n * 0.22);

  vec3 displacedNormal = normalize(normal + vec3(n * 0.2, 0.0, -n * 0.2));
  vNormal = normalize(normalMatrix * displacedNormal);
  vWorldNormal = normalize(mat3(modelMatrix) * displacedNormal);
  vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const airCoreFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorCore;
uniform vec3 uColorGlow;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vNoise;
varying vec2 vUv;

void main() {
  vec3 worldNorm = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Key sun & celestial hemisphere
  vec3 sunDir = normalize(vec3(12.0, 22.0, 10.0));
  float diff = max(dot(worldNorm, sunDir), 0.0);
  float hemi = worldNorm.y * 0.35 + 0.65;

  // Fresnel wisp rim
  float fresnel = 1.0 - max(dot(viewDir, worldNorm), 0.0);
  fresnel = pow(fresnel, 2.2);

  // High speed swirling atmospheric bands
  float bands = sin(vWorldPosition.y * 10.0 + uTime * 5.0 + vNoise * 3.5) * 0.5 + 0.5;

  // Clear atmospheric azure body with distinct warm amber streaks
  vec3 skyAzure = vec3(0.06, 0.28, 0.50);
  vec3 goldStreamer = vec3(0.52, 0.36, 0.12);
  vec3 col = mix(skyAzure, goldStreamer, bands * 0.25);
  col += vec3(0.08, 0.32, 0.58) * fresnel * 0.18;

  // Directional diffuse shading to sculpt the 3D volume with clear ambient fill
  col *= (diff * 0.55 + hemi * 0.45 + 0.35);

  // Balanced opacity so the spherical volume is distinctly present and readable
  float alpha = smoothstep(0.12, 0.65, fresnel) * 0.42 + bands * 0.18 + 0.22;
  gl_FragColor = vec4(col * uIntensity, clamp(alpha, 0.0, 0.65));
}
`;

export const cycloneVertexShader = /* glsl */ `
uniform float uTime;
uniform float uSpinSpeed;
uniform float uHeightScale;

varying vec2 vUv;
varying float vHeight;
varying vec3 vPos;

${commonNoiseGLSL}

void main() {
  vUv = uv;
  vec3 pos = position;

  // Height progress (0 at base, 1 at top)
  float h = (pos.y + 1.6) / 3.2;
  vHeight = h;

  // Funnel expansion: narrower at base, wide trumpet flare at top
  float flare = 0.5 + pow(h, 1.4) * 1.6;
  pos.x *= flare;
  pos.z *= flare;

  // Spiral vortex twist based on height and time
  float angle = h * 8.0 - uTime * uSpinSpeed * 4.0;
  float cosA = cos(angle);
  float sinA = sin(angle);
  
  float nx = pos.x * cosA - pos.z * sinA;
  float nz = pos.x * sinA + pos.z * cosA;
  pos.x = nx;
  pos.z = nz;

  // Wind turbulence offset
  float turb = snoise(vec3(pos.x * 2.0, pos.y * 2.0 - uTime * 4.0, pos.z * 2.0)) * 0.15;
  pos.x += turb;
  pos.z += turb;

  vPos = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const cycloneFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorLight;
uniform vec3 uColorGold;

varying vec2 vUv;
varying float vHeight;
varying vec3 vPos;

${commonNoiseGLSL}

void main() {
  // Fast spiraling wind streaks along UV coordinates
  float streaks1 = snoise(vec3(vUv.x * 16.0 - uTime * 5.0, vUv.y * 6.0, uTime * 1.2));
  float streaks2 = snoise(vec3(vUv.x * 32.0 - uTime * 9.0, vUv.y * 12.0, 2.0));
  float wind = streaks1 * 0.6 + streaks2 * 0.4;

  float alpha = smoothstep(-0.2, 0.5, wind);
  // Dissipate softly at bottom and top
  alpha *= smoothstep(0.0, 0.20, vHeight) * (1.0 - smoothstep(0.88, 1.0, vHeight));

  vec3 col = mix(uColorLight, uColorGold, sin(vHeight * 6.28 + uTime * 2.0) * 0.5 + 0.5);

  gl_FragColor = vec4(col, alpha * 0.22);
}
`;

export const windParticleVertexShader = /* glsl */ `
uniform float uTime;
attribute float aSize;
attribute float aSpeed;
attribute vec3 aRandom;

varying float vLife;

void main() {
  // Progress along tornado funnel
  float t = mod(uTime * aSpeed * 0.4 + aRandom.y * 10.0, 1.0);
  vLife = t;

  // Radius expands as particle climbs upward
  float radius = 0.3 + pow(t, 1.2) * 2.2 + aRandom.x * 0.4;
  // Fast logarithmic spiral angle
  float angle = aRandom.z * 6.28318 + t * 14.0 * (aRandom.x > 0.5 ? 1.0 : 1.15);

  vec3 pos = vec3(
    cos(angle) * radius,
    -1.5 + t * 3.8,
    sin(angle) * radius
  );

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float sizeScale = sin(t * 3.14159);
  gl_PointSize = (aSize * sizeScale * (1.0 / -mvPosition.z)) * 36.0;
}
`;

export const windParticleFragmentShader = /* glsl */ `
varying float vLife;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 2.0);

  // Ethereal wind wisp color: soft azure cyan -> soft golden amber
  vec3 col = mix(vec3(0.18, 0.48, 0.72), vec3(0.55, 0.42, 0.20), vLife);

  gl_FragColor = vec4(col, glow * 0.22 * (0.8 - vLife * 0.25));
}
`;
