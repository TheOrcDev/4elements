import * as THREE from 'three';
import { shared } from './shared.js';

/** Every live volume material. The pipeline toggles their depth test for the mirror pass. */
export const volumeMaterials = new Set();

/** World position varying for a raymarch proxy. Reconstruct the ray as vWorldPos - cameraPosition. */
export const VOLUME_VERT = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/**
 * Material for a raymarched volume on LAYERS.VOLUME.
 *
 * The fragment shader must output PREMULTIPLIED colour: rgb = radiance already
 * multiplied by coverage, a = opacity. Alpha 0 with non-zero rgb is pure emission
 * (flame); alpha near 1 hides what is behind (dense cloud).
 *
 * The volume stage has no depth buffer, so the shader has to clip its march
 * against the opaque scene itself with sceneRayDistance().
 */
export function createVolumeMaterial({
  vertexShader = VOLUME_VERT,
  fragmentShader,
  uniforms = {},
  defines = {},
  side = THREE.BackSide,
}) {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { ...shared, ...uniforms },
    defines,
    side,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  volumeMaterials.add(material);
  material.addEventListener('dispose', () => volumeMaterials.delete(material));
  return material;
}

/** Small deterministic PRNG (mulberry32) so every load builds the same scene. */
export function createRng(seed = 1) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
