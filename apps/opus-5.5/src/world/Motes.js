import * as THREE from 'three';
import { mulberry32 } from '../gl/noise.js';

/** Faint drifting dust motes that catch the light across the sanctum. */
export class Motes {
  constructor(ctx) {
    const count = 700;
    const rand = mulberry32(3);
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(rand()) * 14;
      const a = rand() * Math.PI * 2;
      pos.set([Math.sin(a) * r, 0.3 + rand() * 8, Math.cos(a) * r], i * 3);
      rnd.set([rand(), rand(), rand(), rand()], i * 4);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uScale: ctx.uniforms.uPointScale },
      vertexShader: /* glsl */ `
        attribute vec4 aRand;
        uniform float uTime;
        uniform float uScale;
        varying float vA;
        void main() {
          vec3 p = position;
          float t = uTime * (0.05 + aRand.x * 0.08);
          p.x += sin(t * 3.0 + aRand.y * 40.0) * 0.8;
          p.z += cos(t * 2.6 + aRand.z * 40.0) * 0.8;
          p.y += sin(t * 2.0 + aRand.w * 40.0) * 0.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max((0.012 + aRand.w * 0.02) * uScale / -mv.z, 1.0);
          vA = (0.25 + 0.75 * aRand.z) * (0.5 + 0.5 * sin(uTime * (0.5 + aRand.x) + aRand.y * 20.0));
          vA *= smoothstep(1.0, 3.0, -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(0.75, 0.8, 1.0) * a * a * vA * 0.9, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }

  update() {}
}
