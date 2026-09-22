import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Linear-HDR stage: heat haze above the fire + subtle lens chromatic aberration + HDR clamp.
const HazeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uNoise2D: { value: null },
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uHaze: { value: new THREE.Vector4(0.5, 0.5, 0.2, 0) },
    uCA: { value: 0.0022 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D uNoise2D;
    uniform float uTime;
    uniform float uAspect;
    uniform vec4 uHaze;
    uniform float uCA;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      if (uHaze.w > 0.0005) {
        vec2 d = uv - uHaze.xy;
        d.x *= uAspect;
        float hgt = max(uHaze.z, 1e-3);
        float yN = d.y / hgt;
        float xN = d.x / (hgt * 0.42);
        float mask = smoothstep(-0.1, 0.45, yN) * (1.0 - smoothstep(0.95, 2.1, yN)) * exp(-xN * xN * 1.4);
        vec2 np = d / hgt * vec2(1.6, 1.1) + vec2(0.0, -uTime * 0.55);
        vec2 n = texture2D(uNoise2D, np).rg - 0.5;
        vec2 n2 = texture2D(uNoise2D, np * 2.3 + 0.37).gb - 0.5;
        uv += (n * 0.7 + n2 * 0.3) * mask * uHaze.w * hgt * 0.05;
      }
      vec2 c = uv - 0.5;
      vec2 off = c * dot(c, c) * uCA * 4.0;
      vec3 col;
      col.r = texture2D(tDiffuse, uv - off).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv + off).b;
      // keep half-float overflow (tiny, very sharp highlights) from poisoning bloom/tone mapping
      col = max(min(col, vec3(6.0e4)), vec3(0.0));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

// Display-space stage: vignette + film grain (also dithers away banding).
const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 0.42 },
    uGrain: { value: 0.028 },
    uFade: { value: 0 },
  },
  vertexShader: HazeShader.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uFade;
    varying vec2 vUv;
    float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      vec2 c = vUv - 0.5;
      c.x *= uResolution.x / uResolution.y;
      float v = smoothstep(1.25, 0.2, length(c));
      col *= mix(1.0 - uVignette, 1.0, v);
      float g = ign(gl_FragCoord.xy + fract(uTime * 7.13) * 911.0) - 0.5;
      col += g * uGrain * (0.35 + 0.65 * (1.0 - dot(col, vec3(0.333))));
      col *= 1.0 - uFade;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export class PostFX {
  constructor(ctx) {
    const { renderer, scene, camera } = ctx;
    this.renderer = renderer;
    this.camera = camera;
    const dpr = renderer.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: dpr < 1.5 ? 4 : 0,
    });
    this.composer = new EffectComposer(renderer, rt);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // haze runs first so the distortion also bends the glow, and it sanitises HDR values for bloom
    this.haze = new ShaderPass(HazeShader);
    this.haze.uniforms.uNoise2D.value = ctx.noise2D;
    this.composer.addPass(this.haze);

    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.92);
    this.composer.addPass(this.bloom);

    this.output = new OutputPass();
    this.composer.addPass(this.output);

    this.finish = new ShaderPass(FinishShader);
    this.composer.addPass(this.finish);

    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
  }

  setSize(w, h, dpr) {
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.haze.uniforms.uAspect.value = w / h;
    this.finish.uniforms.uResolution.value.set(w * dpr, h * dpr);
  }

  /** Project the fire column to screen space to drive the heat-haze distortion. */
  setHazeSource(base, top, strength) {
    const a = this._a.copy(base).project(this.camera);
    const b = this._b.copy(top).project(this.camera);
    const u = this.haze.uniforms.uHaze.value;
    const visible = a.z < 1 && b.z < 1 && Math.abs(a.x) < 1.6 && a.y < 1.6;
    const hgt = (b.y - a.y) * 0.5;
    u.set(a.x * 0.5 + 0.5, a.y * 0.5 + 0.5, Math.max(hgt, 0.0), visible && hgt > 0.01 ? strength : 0);
  }

  render(time, dt) {
    this.haze.uniforms.uTime.value = time;
    this.finish.uniforms.uTime.value = time;
    this.composer.render(dt);
  }
}
