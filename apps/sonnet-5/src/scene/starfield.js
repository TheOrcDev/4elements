import * as THREE from 'three';
import { createParticlesMaterial } from '../shaders/particles.js';

const STAR_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aSeed;
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = 0.5 + 0.5 * sin(uTime * (0.4 + aSeed * 0.6) + aSeed * 60.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// A large static shell of twinkling points scattered far behind the four
// elements, purely for depth and atmosphere.
export function createStarfield(count = 4500) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colorAttr = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const radius = 45 + Math.random() * 160;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const tint = Math.random();
    if (tint < 0.15) color.setHSL(0.58, 0.55, 0.75 + Math.random() * 0.2);
    else if (tint < 0.3) color.setHSL(0.09, 0.45, 0.72 + Math.random() * 0.2);
    else color.setHSL(0.0, 0.0, 0.85 + Math.random() * 0.15);

    colorAttr[i * 3 + 0] = color.r;
    colorAttr[i * 3 + 1] = color.g;
    colorAttr[i * 3 + 2] = color.b;

    seeds[i] = Math.random();
    sizes[i] = Math.random() * 1.6 + 0.6;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colorAttr, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const material = createParticlesMaterial(STAR_VERTEX, { uTime: { value: 0 } });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    update(t) {
      material.uniforms.uTime.value = t;
    },
  };
}
