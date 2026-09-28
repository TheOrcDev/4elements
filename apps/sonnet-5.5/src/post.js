import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/** Final display-space pass: lens fringing, vignette, and film grain (which also kills sky banding). */
const FinishShader = {
  name: 'FinishShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.5 },
    uGrain: { value: 0.03 },
    uAberration: { value: 0.0007 },
    uHeat: { value: new THREE.Vector4(0.5, 0.5, 0.2, 0) }, // xy: centre (uv), z: radius (uv.y), w: strength
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    uniform vec4 uHeat;
    uniform float uAspect;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;

      // hot-air shimmer rising above the flame: a soft, tall ellipse of wobbling refraction
      if (uHeat.w > 0.001) {
        vec2 d = (uv - uHeat.xy) * vec2(uAspect, 1.0);
        float m = smoothstep(1.0, 0.0, length(d / vec2(uHeat.z * 0.6, uHeat.z)));
        m *= smoothstep(-0.25, 0.25, d.y / uHeat.z + 0.1);
        float w1 = sin(uv.y * 95.0 - uTime * 5.5) * sin(uv.x * 55.0 + uTime * 2.1);
        float w2 = sin(uv.y * 63.0 - uTime * 4.0 + uv.x * 20.0);
        uv += vec2(w1, w2 * 0.35) * 0.0026 * uHeat.w * m;
      }

      vec2 c = uv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * r2 * uAberration * 8.0;
      vec3 col = vec3(
        texture2D(tDiffuse, uv + off).r,
        texture2D(tDiffuse, uv).g,
        texture2D(tDiffuse, uv - off).b
      );
      float vig = smoothstep(0.9, 0.18, length(c) * 1.12);
      col *= mix(1.0 - uVignette, 1.0, vig);
      float g = hash(gl_FragCoord.xy + fract(uTime) * 61.7) - 0.5;
      col += g * uGrain * (0.45 + 0.55 * (1.0 - dot(col, vec3(0.3333))));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/** MSAA is expensive on a half-float target; at high pixel ratios the extra resolution already hides aliasing. */
const samplesFor = (pr) => (pr >= 1.75 ? 0 : pr >= 1.25 ? 2 : 4);

export function createPost(renderer, scene, camera, { width, height, pixelRatio }) {
  let samples = samplesFor(pixelRatio);
  const target = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio, {
    type: THREE.HalfFloatType,
    samples,
  });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(width, height);

  composer.addPass(new RenderPass(scene, camera));

  // Bloom is low-frequency by nature: run it at half resolution.
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.55, 0.9);
  const bloomSetSize = bloom.setSize.bind(bloom);
  bloom.setSize = (w, h) => bloomSetSize(Math.max(2, Math.floor(w * 0.5)), Math.max(2, Math.floor(h * 0.5)));
  // Guard: NaN/Inf pixels would be smeared across the whole screen by the blur. Clamp them away
  // (min/max drop NaN on all GPUs we care about) and cap absurd HDR spikes at the same time.
  bloom.materialHighPassFilter.fragmentShader = bloom.materialHighPassFilter.fragmentShader.replace(
    'vec4 texel = texture2D( tDiffuse, vUv );',
    'vec4 texel = min(max(texture2D( tDiffuse, vUv ), vec4(0.0)), vec4(48.0));',
  );
  bloom.materialHighPassFilter.needsUpdate = true;
  composer.addPass(bloom);

  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FinishShader);
  composer.addPass(finish);

  const applySamples = (n) => {
    if (n === samples) return;
    samples = n;
    for (const rt of [composer.renderTarget1, composer.renderTarget2]) {
      rt.samples = n;
      rt.dispose(); // re-allocated lazily with the new sample count
    }
  };

  return {
    composer,
    bloom,
    finish,
    setSize: (w, h) => composer.setSize(w, h),
    setPixelRatio: (pr) => {
      composer.setPixelRatio(pr);
      applySamples(samplesFor(pr));
    },
    render: (dt) => composer.render(dt),
    get samples() {
      return samples;
    },
  };
}
