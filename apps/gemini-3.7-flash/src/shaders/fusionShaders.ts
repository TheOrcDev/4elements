import { GLSL_NOISE_SNIPPETS } from './noise.glsl.ts';

export const FUSION_CORE_VERTEX = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uMorph;
uniform float uDisplacement;
uniform int uMode;

varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vNoise;

void main() {
  vUv = uv;
  vec3 p = position;
  
  // Multi-element hybrid noise field
  float nFire = snoise(p * 2.0 + vec3(0.0, -uTime * 1.5, 0.0));
  float nWater = snoise(p * 3.0 + vec3(uTime * 0.8));
  float nEarth = fbm(p * 2.5, 3, 0.5, 2.0);
  float nAir = snoise(p * 4.0 + vec3(uTime * 1.2, -uTime * 0.6, uTime * 0.4));
  
  float combinedNoise = (nFire + nWater + nEarth + nAir) * 0.25;
  vNoise = combinedNoise;

  float disp = combinedNoise * uDisplacement * (1.0 + sin(uTime * 2.0) * 0.2);
  p += normal * disp;

  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vPosition = p;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const FUSION_CORE_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform float uMorph;
uniform int uMode; // 0: Genesis, 1: Magma, 2: Steam, 3: Sandstorm, 4: Blizzard
uniform float uIntensity;

varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vNoise;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = getFresnel(vWorldNormal, viewDir, 2.5, 0.15);
  
  vec3 baseColor = vec3(0.0);
  vec3 glowColor = vec3(0.0);

  // Mode 0: Genesis Quintessence (Primal 4-Element Cycle)
  if (uMode == 0) {
    float angle = atan(vPosition.z, vPosition.x) + uTime * 0.5;
    float normAngle = fract(angle / (2.0 * 3.14159265));
    
    vec3 cFire = vec3(1.0, 0.3, 0.05);
    vec3 cWater = vec3(0.05, 0.7, 1.0);
    vec3 cEarth = vec3(0.2, 0.85, 0.4);
    vec3 cAir = vec3(0.8, 0.95, 1.0);
    
    if (normAngle < 0.25) {
      baseColor = mix(cFire, cWater, normAngle * 4.0);
    } else if (normAngle < 0.5) {
      baseColor = mix(cWater, cEarth, (normAngle - 0.25) * 4.0);
    } else if (normAngle < 0.75) {
      baseColor = mix(cEarth, cAir, (normAngle - 0.5) * 4.0);
    } else {
      baseColor = mix(cAir, cFire, (normAngle - 0.75) * 4.0);
    }
    glowColor = vec3(0.85, 0.8, 1.0);
  }
  // Mode 1: Magma (Fire + Earth)
  else if (uMode == 1) {
    vec2 vor = voronoi3D(vPosition * 3.5 + vec3(0.0, -uTime * 0.5, 0.0));
    float fissure = smoothstep(0.05, 0.4, vor.y - vor.x);
    baseColor = mix(vec3(0.9, 0.25, 0.05), vec3(0.12, 0.08, 0.08), fissure);
    glowColor = vec3(1.0, 0.6, 0.1);
  }
  // Mode 2: Steam (Fire + Water)
  else if (uMode == 2) {
    float steam = fbm(vPosition * 2.5 + vec3(0.0, -uTime * 1.0, 0.0)) * 0.5 + 0.5;
    baseColor = mix(vec3(0.1, 0.4, 0.8), vec3(0.9, 0.95, 1.0), steam);
    glowColor = vec3(0.7, 0.85, 1.0);
  }
  // Mode 3: Sandstorm (Earth + Air)
  else if (uMode == 3) {
    float dust = snoise(vPosition * 4.0 + vec3(uTime * 2.0, uTime * 0.5, 0.0)) * 0.5 + 0.5;
    baseColor = mix(vec3(0.85, 0.65, 0.3), vec3(0.4, 0.3, 0.15), dust);
    glowColor = vec3(1.0, 0.8, 0.4);
  }
  // Mode 4: Blizzard (Water + Air)
  else {
    float frost = snoise(vPosition * 5.0 + vec3(uTime * 0.8)) * 0.5 + 0.5;
    baseColor = mix(vec3(0.1, 0.5, 0.85), vec3(0.8, 0.95, 1.0), frost);
    glowColor = vec3(0.5, 0.8, 1.0);
  }

  vec3 col = baseColor * (0.8 + vNoise * 0.2);
  col += glowColor * fresnel * 0.45;

  gl_FragColor = vec4(col, 0.95);
}
`;

export const RUNE_RING_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const RUNE_RING_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // Sacred runic circular pulses
  float rune = sin(vUv.x * 48.0 - uTime * uSpeed * 2.0) * 0.5 + 0.5;
  float pulse = sin(uTime * 2.5 + vUv.x * 12.0) * 0.3 + 0.7;
  
  float glow = smoothstep(0.1, 0.9, rune) * pulse;
  
  gl_FragColor = vec4(uColor * 1.5, glow * 0.85);
}
`;

export const COSMIC_BACKGROUND_VERTEX = /* glsl */ `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const COSMIC_BACKGROUND_FRAGMENT = /* glsl */ `
${GLSL_NOISE_SNIPPETS}

uniform float uTime;
varying vec3 vWorldPosition;

void main() {
  vec3 dir = normalize(vWorldPosition);
  
  // Deep celestial gradient
  vec3 topColor = vec3(0.01, 0.02, 0.08);
  vec3 horizonColor = vec3(0.03, 0.06, 0.14);
  vec3 bottomColor = vec3(0.005, 0.01, 0.03);
  
  float h = dir.y * 0.5 + 0.5;
  vec3 bg = mix(bottomColor, horizonColor, smoothstep(0.0, 0.5, h));
  bg = mix(bg, topColor, smoothstep(0.5, 1.0, h));

  // Nebula clouds
  vec3 nebulaCoord = dir * 2.5 + vec3(uTime * 0.02, 0.0, uTime * 0.01);
  float nebula1 = fbm(nebulaCoord, 3, 0.5, 2.0) * 0.5 + 0.5;
  float nebula2 = fbm(nebulaCoord * 2.0 + vec3(1.5), 3, 0.5, 2.0) * 0.5 + 0.5;
  
  vec3 nebCol1 = vec3(0.12, 0.04, 0.25) * pow(nebula1, 2.2);
  vec3 nebCol2 = vec3(0.02, 0.15, 0.22) * pow(nebula2, 2.0);
  
  bg += nebCol1 * 0.6 + nebCol2 * 0.5;

  gl_FragColor = vec4(bg, 1.0);
}
`;
