import * as THREE from 'three';
import { shared } from './shared.js';

// Height-field ripple simulation for the water film: a damped 2D wave equation on a
// square grid centred on the origin. Anything can disturb it with drop(x, z, ...).
// Texture layout: r = height (metres), g = vertical velocity.

const SIZE = 1024;
const MAX_DROPS = 96;

const FS_VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

const SIM_FRAG = /* glsl */ `
uniform sampler2D tPrev;
uniform vec2 uTexel;
uniform float uStiffness;
uniform float uDamping;
varying vec2 vUv;
void main() {
  vec2 s = texture2D(tPrev, vUv).rg;
  float avg = (texture2D(tPrev, vUv + vec2(uTexel.x, 0.0)).r + texture2D(tPrev, vUv - vec2(uTexel.x, 0.0)).r
             + texture2D(tPrev, vUv + vec2(0.0, uTexel.y)).r + texture2D(tPrev, vUv - vec2(0.0, uTexel.y)).r) * 0.25;
  float v = (s.g + (avg - s.r) * uStiffness) * uDamping;
  float h = (s.r + v) * 0.9992;
  // Absorb waves at the border of the grid instead of bouncing them back.
  float edge = smoothstep(0.0, 0.05, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
  gl_FragColor = vec4(h * edge, v * edge, 0.0, 1.0);
}
`;

const DROP_VERT = /* glsl */ `
attribute vec4 aDrop;     // xy = centre in grid UV, z = radius in UV, w = strength in metres
varying vec2 vLocal;
varying float vStrength;
void main() {
  vLocal = position.xy;
  vStrength = aDrop.w;
  vec2 uv = aDrop.xy + position.xy * aDrop.z;
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}
`;

const DROP_FRAG = /* glsl */ `
varying vec2 vLocal;
varying float vStrength;
void main() {
  float q = length(vLocal);
  if (q >= 1.0) discard;
  float f = 1.0 - q * q;
  // A dip in the middle with a raised rim, so a drop adds almost no net volume.
  gl_FragColor = vec4(-vStrength * f * f * cos(q * 3.4), 0.0, 0.0, 0.0);
}
`;

export class Ripples {
  constructor(renderer) {
    this.renderer = renderer;
    this.domain = shared.uRippleDomain.value;
    this.size = SIZE;
    const options = {
      type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false,
      magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
    };
    this.a = new THREE.WebGLRenderTarget(SIZE, SIZE, options);
    this.b = new THREE.WebGLRenderTarget(SIZE, SIZE, options);

    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.simMaterial = new THREE.ShaderMaterial({
      vertexShader: FS_VERT,
      fragmentShader: SIM_FRAG,
      uniforms: {
        tPrev: { value: null },
        uTexel: { value: new THREE.Vector2(1 / SIZE, 1 / SIZE) },
        uStiffness: { value: 0.42 },
        uDamping: { value: 0.988 },
      },
      depthTest: false, depthWrite: false,
    });
    this.simMesh = new THREE.Mesh(tri, this.simMaterial);
    this.simMesh.frustumCulled = false;

    const quad = new THREE.InstancedBufferGeometry();
    quad.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    this.dropData = new Float32Array(MAX_DROPS * 4);
    this.dropAttribute = new THREE.InstancedBufferAttribute(this.dropData, 4);
    this.dropAttribute.setUsage(THREE.DynamicDrawUsage);
    quad.setAttribute('aDrop', this.dropAttribute);
    quad.instanceCount = 0;
    this.dropGeometry = quad;
    this.dropMesh = new THREE.Mesh(quad, new THREE.ShaderMaterial({
      vertexShader: DROP_VERT,
      fragmentShader: DROP_FRAG,
      depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    }));
    this.dropMesh.frustumCulled = false;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.dropCount = 0;
    this.accumulator = 0;
    shared.uRippleTex.value = this.a.texture;
  }

  /**
   * Disturb the film at world position (x, z).
   * radius: metres, 0.1 (a droplet) to 1.5 (a boulder). strength: metres of displacement,
   * 0.004 (barely visible) to 0.06 (a splash). Negative strength pushes the surface up.
   */
  drop(x, z, radius = 0.25, strength = 0.02) {
    if (this.dropCount >= MAX_DROPS) return;
    const u = x / this.domain + 0.5;
    const v = z / this.domain + 0.5;
    if (u < 0.02 || u > 0.98 || v < 0.02 || v > 0.98) return;
    const i = this.dropCount * 4;
    this.dropData[i] = u;
    this.dropData[i + 1] = v;
    this.dropData[i + 2] = Math.max(radius / this.domain, 1.5 / SIZE);
    this.dropData[i + 3] = strength;
    this.dropCount++;
  }

  update(dt) {
    const renderer = this.renderer;
    const previousTarget = renderer.getRenderTarget();
    const previousAutoClear = renderer.autoClear;
    renderer.autoClear = false;

    if (this.dropCount > 0) {
      this.dropAttribute.needsUpdate = true;
      this.dropGeometry.instanceCount = this.dropCount;
      renderer.setRenderTarget(this.a);
      renderer.render(this.dropMesh, this.camera);
      this.dropCount = 0;
    }

    // Fixed 60 Hz steps keep the wave speed independent of the frame rate.
    this.accumulator = Math.min(this.accumulator + dt, 3 / 60);
    while (this.accumulator >= 1 / 60) {
      this.accumulator -= 1 / 60;
      this.simMaterial.uniforms.tPrev.value = this.a.texture;
      renderer.setRenderTarget(this.b);
      renderer.render(this.simMesh, this.camera);
      const t = this.a; this.a = this.b; this.b = t;
    }
    shared.uRippleTex.value = this.a.texture;

    renderer.setRenderTarget(previousTarget);
    renderer.autoClear = previousAutoClear;
  }

  dispose() {
    this.a.dispose();
    this.b.dispose();
  }
}
