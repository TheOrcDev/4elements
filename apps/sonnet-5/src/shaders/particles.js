import * as THREE from 'three';

// Shared soft circular point-sprite fragment shader. Every particle system
// (fire sparks, water bubbles, air vortex, earth dust) writes a world-space
// position, a vColor and a vAlpha from its own vertex shader and reuses this.
export const softPointFragmentGLSL = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float edge = smoothstep(0.5, 0.0, d);
  float core = smoothstep(0.2, 0.0, d) * 0.6;
  float alpha = clamp((edge + core) * vAlpha, 0.0, 1.0);
  gl_FragColor = vec4(vColor, alpha);
}
`;

// All of our particle systems are fully GPU-driven: each particle's motion is
// an analytic function of uTime and a few per-particle attributes (seed,
// speed, radius...), looped with fract()/mod(). That means zero per-frame CPU
// work no matter how many particles are on screen - only the uTime uniform
// needs updating.
export function createParticlesMaterial(vertexShader, uniforms) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: softPointFragmentGLSL,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Fills a Float32Array-backed attribute with per-particle random seeds in [0, 1).
export function randomSeeds(count) {
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = Math.random();
  return seeds;
}
