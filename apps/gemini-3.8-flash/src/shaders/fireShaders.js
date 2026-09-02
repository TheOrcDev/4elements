import { commonNoiseGLSL } from './noiseGlsl.js';

export const fireCoreVertexShader = /* glsl */ `
uniform float uTime;
uniform float uDisplacement;
uniform float uSpeed;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;
varying float vNoise;
varying vec2 vUv;

${commonNoiseGLSL}

void main() {
  vUv = uv;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  
  // Animate sample coordinates upward to simulate rising flames
  vec3 noiseCoord = position * 1.8 + vec3(0.0, -uTime * uSpeed * 2.2, 0.0);
  float n = fbm4(noiseCoord);
  vNoise = n;

  // Stretch flames upwards (positive Y gets more displacement)
  float heightBias = smoothstep(-1.2, 1.5, position.y) * 0.7 + 0.3;
  vec3 displaced = position + normal * (n * uDisplacement * heightBias);
  
  // Extra upward tongue flick
  displaced.y += max(0.0, n) * 0.35 * heightBias;

  vPosition = displaced;
  vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
  
  // Re-estimate normal along displaced surface for true 3D sculpting
  vec3 displacedNormal = normalize(mat3(modelMatrix) * (normal + vec3(0.0, n * 0.4, 0.0)));
  vWorldNormal = displacedNormal;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

export const fireCoreFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorCore;
uniform vec3 uColorMid;
uniform vec3 uColorRim;
uniform vec3 uColorDark;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;
varying float vNoise;
varying vec2 vUv;

void main() {
  vec3 worldNorm = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Key celestial sun & hemisphere illumination
  vec3 sunDir = normalize(vec3(12.0, 22.0, 10.0));
  float diff = max(dot(worldNorm, sunDir), 0.0);
  float hemi = worldNorm.y * 0.35 + 0.65; // 0.3 to 1.0

  // Upward warm bounce from the lava pedestal so underside isn't pitch black
  float lavaBounce = max(-worldNorm.y, 0.0);

  // Heat map for volcanic crust and molten cracks - distinct defined fissures
  float heat = clamp(vNoise * 0.88 + 0.40, 0.0, 1.0);

  // Volcanic basalt rock: defined warm charcoal with mineral sheen
  vec3 rockBase = vec3(0.36, 0.26, 0.20);
  vec3 rockLit = rockBase * (diff * 0.70 + hemi * 0.55 + 0.52);
  rockLit += vec3(0.42, 0.12, 0.02) * lavaBounce * 0.26;

  // Specular glint on cooled basalt crust
  vec3 halfVec = normalize(sunDir + viewDir);
  float spec = pow(max(dot(worldNorm, halfVec), 0.0), 24.0);
  rockLit += vec3(0.30, 0.22, 0.16) * spec * 0.16;

  // Molten magma glowing inside the fissures - deep ruby and warm amber (toned down, rich and organic, no white hot points)
  vec3 magmaDark = vec3(0.38, 0.05, 0.01);   // deep glowing ruby
  vec3 magmaMid  = vec3(0.52, 0.16, 0.02);   // warm molten amber
  vec3 magmaHot  = vec3(0.66, 0.26, 0.03);   // subdued molten amber-orange (never glaring or yellow)

  float magmaMask = smoothstep(0.50, 0.82, heat);
  vec3 magmaCol = mix(magmaDark, magmaMid, smoothstep(0.50, 0.68, heat));
  magmaCol = mix(magmaCol, magmaHot, smoothstep(0.68, 0.88, heat));

  // Blend rock and molten magma
  vec3 col = mix(rockLit, magmaCol, magmaMask);

  // Subtle plasma rim (Fresnel)
  float fresnel = 1.0 - max(dot(viewDir, worldNorm), 0.0);
  fresnel = pow(fresnel, 2.5);
  col += vec3(0.28, 0.06, 0.01) * fresnel * 0.06;

  gl_FragColor = vec4(col * uIntensity, 1.0);
}
`;

export const flameTongueVertexShader = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vHeight;

${commonNoiseGLSL}

void main() {
  vUv = uv;
  vHeight = position.y;

  // Turbulent wave displacement
  vec3 pos = position;
  float t = uTime * 3.0;
  float swayX = snoise(vec3(pos.y * 1.5, t * 0.7, 0.0)) * 0.25;
  float swayZ = snoise(vec3(0.0, t * 0.7, pos.y * 1.5)) * 0.25;

  // Taper and twist upward
  float progress = clamp((pos.y + 1.0) / 2.5, 0.0, 1.0);
  pos.x += swayX * progress * 1.5;
  pos.z += swayZ * progress * 1.5;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const flameTongueFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorBase;
uniform vec3 uColorTip;

varying vec2 vUv;
varying float vHeight;

${commonNoiseGLSL}

void main() {
  vec2 uvCoord = vUv;
  // Scrolling noise upward
  float n = snoise(vec3(uvCoord.x * 4.0, uvCoord.y * 3.0 - uTime * 3.5, uTime * 0.5));
  float n2 = snoise(vec3(uvCoord.x * 8.0, uvCoord.y * 6.0 - uTime * 5.0, 1.5));
  float combined = n * 0.6 + n2 * 0.4;

  // Vertical dissipation
  float alpha = smoothstep(0.05, 0.4, combined + 0.3) * (1.0 - smoothstep(0.4, 1.0, vUv.y));
  alpha *= smoothstep(0.0, 0.2, vUv.y); // soft bottom

  vec3 col = mix(uColorBase * 0.85, uColorTip, vUv.y);

  gl_FragColor = vec4(col, alpha * 0.25);
}
`;

export const emberVertexShader = /* glsl */ `
uniform float uTime;
attribute float aSize;
attribute float aSpeed;
attribute vec3 aRandom;
attribute float aLifetime;

varying float vLife;
varying vec3 vColor;

${commonNoiseGLSL}

void main() {
  // Compute progress of ember particle (0 to 1 loop)
  float t = mod(uTime * aSpeed * 0.5 + aRandom.x * 10.0, 1.0);
  vLife = t;

  // Origin at base, spiral upwards
  float radius = 0.3 + aRandom.y * 1.2 * (1.0 + t * 0.8);
  float angle = aRandom.z * 6.28318 + t * 4.0 * (aRandom.x > 0.5 ? 1.0 : -1.0);
  
  // Curl noise perturbation
  vec3 turb = vec3(
    snoise(vec3(radius, t * 2.0, 0.0)),
    t * 3.5,
    snoise(vec3(0.0, t * 2.0, radius))
  ) * 0.5;

  vec3 pos = vec3(
    cos(angle) * radius + turb.x,
    -1.2 + t * 4.5,
    sin(angle) * radius + turb.z
  );

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Particle size attenuates with distance and fades at end of life
  float sizeFade = sin(t * 3.14159);
  gl_PointSize = (aSize * sizeFade * (1.0 / -mvPosition.z)) * 40.0;
}
`;

export const emberFragmentShader = /* glsl */ `
varying float vLife;

void main() {
  // Circular soft particle
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float strength = 1.0 - smoothstep(0.0, 0.5, dist);
  strength = pow(strength, 1.8);

  // Color cools down as it flies higher: white -> yellow -> orange -> dark red
  vec3 cCore = vec3(0.95, 0.75, 0.35);
  vec3 cMid = vec3(0.85, 0.32, 0.04);
  vec3 cCool = vec3(0.45, 0.06, 0.01);

  vec3 col = mix(cCore, cMid, smoothstep(0.0, 0.4, vLife));
  col = mix(col, cCool, smoothstep(0.4, 1.0, vLife));

  gl_FragColor = vec4(col, strength * 0.45 * (1.0 - vLife * 0.6));
}
`;
