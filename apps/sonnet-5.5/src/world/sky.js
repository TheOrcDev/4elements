import * as THREE from 'three';
import { GLSL_SNOISE, GLSL_HASH } from '../shaders/glsl.js';
import { mulberry32 } from '../utils/rng.js';

/** Colour the far ground fades into — must match the sky's horizon so the seam disappears. */
export const HORIZON = new THREE.Color(0.062, 0.078, 0.2);

/**
 * Bakes the low-frequency sky (gradient, nebula, mountain haze, moon glow) once into an
 * equirectangular HDR texture. It is used as background, PMREM environment and as the
 * reflection source for the water surface.
 */
export function bakeSky(renderer, moonDir) {
  const W = 2048;
  const H = 1024;
  const rt = new THREE.WebGLRenderTarget(W, H, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: true,
    depthBuffer: false,
  });

  const material = new THREE.ShaderMaterial({
    uniforms: { uMoonDir: { value: moonDir.clone() }, uHorizon: { value: HORIZON.clone() } },
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uMoonDir;
      uniform vec3 uHorizon;
      ${GLSL_HASH}
      ${GLSL_SNOISE}

      vec3 dirFromUV(vec2 uv) {
        float phi = (uv.x - 0.5) * 6.28318530718;
        float th = (uv.y - 0.5) * 3.14159265359;
        return vec3(cos(th) * cos(phi), sin(th), cos(th) * sin(phi));
      }

      // 1D-ish ridge line for the distant mountains (function of azimuth)
      float ridge(float az, float seed, float amp, float freq) {
        vec3 p = vec3(cos(az) * freq, sin(az) * freq, seed);
        return amp * (0.55 + 0.45 * snoise(p) + 0.28 * snoise(p * 2.3 + 5.0) + 0.12 * snoise(p * 5.1 - 3.0));
      }

      void main() {
        vec3 d = dirFromUV(vUv);
        float h = d.y;
        float az = atan(d.z, d.x);

        vec3 zenith = vec3(0.004, 0.008, 0.032);
        vec3 midSky = vec3(0.010, 0.028, 0.105);
        vec3 col = mix(uHorizon, midSky, smoothstep(0.0, 0.32, h));
        col = mix(col, zenith, smoothstep(0.22, 1.0, h));

        // twilight glow just above the horizon, tinted differently around the compass
        float band = exp(-(h - 0.07) * (h - 0.07) * 42.25) * smoothstep(0.0, 0.05, h);
        vec3 tint = mix(vec3(0.24, 0.085, 0.20), vec3(0.04, 0.16, 0.30), 0.5 + 0.5 * sin(az + 0.8));
        col += tint * band * 0.75;

        // galactic band + nebulae
        vec3 bandN = normalize(vec3(0.38, 0.78, -0.5));
        float gal = exp(-(dot(d, bandN) * 2.4) * (dot(d, bandN) * 2.4) * 1.0);
        float n1 = fbm3(d * 2.4 + 4.0);
        float n2 = fbm3(d * 5.1 - 9.0);
        float neb = smoothstep(-0.15, 0.75, n1 * 0.75 + n2 * 0.45) * gal;
        vec3 nebCol = mix(vec3(0.04, 0.24, 0.38), vec3(0.34, 0.07, 0.40), smoothstep(-0.45, 0.6, fbm3(d * 1.6 + 20.0)));
        float lane = smoothstep(0.1, 0.5, fbm3(d * 7.0 + 40.0)); // dust lanes
        col += nebCol * neb * 0.62 * (1.0 - 0.5 * lane) * smoothstep(0.02, 0.3, h);
        col += vec3(0.55, 0.62, 0.9) * gal * 0.03 * smoothstep(0.0, 0.3, h) * (1.0 - lane * 0.6);

        // moon glow only — the disc itself is a crisp procedural mesh
        float md = dot(d, uMoonDir);
        col += vec3(0.55, 0.68, 1.0) * (exp(-(1.0 - md) * 55.0) * 0.1 + exp(-(1.0 - md) * 9.0) * 0.03);
        col += vec3(2.4, 2.6, 3.0) * smoothstep(0.9975, 0.9990, md) * 0.05; // faint hot spot so glossy surfaces catch a hint of moon

        // two layers of distant mountains
        float r1 = ridge(az, 1.7, 0.085, 1.4);
        float r2 = ridge(az, 6.3, 0.055, 2.2);
        vec3 far = mix(uHorizon, vec3(0.03, 0.045, 0.11), 0.72);
        vec3 near = vec3(0.012, 0.018, 0.045);
        float m1 = smoothstep(r1 + 0.004, r1 - 0.004, h);
        float m2 = smoothstep(r2 + 0.003, r2 - 0.003, h);
        float haze1 = smoothstep(r1, -0.03, h);
        col = mix(col, mix(far, uHorizon, haze1 * 0.55), m1);
        col = mix(col, mix(near, uHorizon * 0.8, smoothstep(r2, -0.02, h) * 0.5), m2);
        // everything at / below the horizon settles to the fog colour
        col = mix(col, uHorizon, smoothstep(0.012, -0.02, h));

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const cam = new THREE.Camera();

  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(scene, cam);
  renderer.setRenderTarget(prev);

  material.dispose();
  quad.geometry.dispose();

  rt.texture.mapping = THREE.EquirectangularReflectionMapping;
  return rt.texture;
}

/** Crisp twinkling star points + a procedural moon (disc, craters, halo). */
export function createSkyDome(moonDir, time) {
  const group = new THREE.Group();
  group.name = 'skyDome';

  // ---------------- stars ----------------
  const rng = mulberry32(99);
  const N = 5200;
  const pos = new Float32Array(N * 3);
  const attr = new Float32Array(N * 4); // size, brightness, tint, phase
  const R = 420;
  for (let i = 0; i < N; i++) {
    const u = rng() * 2 - 1;
    const a = rng() * Math.PI * 2;
    const y = u * 0.98 + 0.02; // tilt slightly toward the upper hemisphere
    const s = Math.sqrt(Math.max(0, 1 - y * y));
    pos[i * 3] = Math.cos(a) * s * R;
    pos[i * 3 + 1] = Math.max(y, -0.05) * R;
    pos[i * 3 + 2] = Math.sin(a) * s * R;
    const b = Math.pow(rng(), 5.0);
    attr[i * 4] = 1.1 + b * 2.6 + rng() * 0.6;
    attr[i * 4 + 1] = 0.35 + b * 3.4;
    attr[i * 4 + 2] = rng();
    attr[i * 4 + 3] = rng() * 100;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aStar', new THREE.BufferAttribute(attr, 4));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aStar;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 0.72 + 0.28 * sin(uTime * (1.2 + aStar.w * 0.05) + aStar.w);
        vec3 cool = vec3(0.62, 0.76, 1.0);
        vec3 warm = vec3(1.0, 0.86, 0.68);
        vColor = mix(cool, warm, aStar.z) * aStar.y * tw;
        vAlpha = smoothstep(-0.02, 0.22, normalize(position).y);
        gl_PointSize = aStar.x * uPixelRatio;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        a *= a;
        gl_FragColor = vec4(vColor * a, a * vAlpha);
      }
    `,
  });
  const stars = new THREE.Points(sg, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = -10;
  group.add(stars);

  // ---------------- moon ----------------
  const moonMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {},
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      ${GLSL_SNOISE}
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;          // plane spans +-1
        float r = length(p);
        float discR = 0.25;
        float rr = r / discR;                // 1.0 at the limb
        float halo = exp(-max(r - discR, 0.0) * 9.0) * 0.28 + exp(-max(r - discR, 0.0) * 26.0) * 0.35;
        vec3 col = vec3(0.55, 0.68, 1.0) * halo * smoothstep(1.0, 0.24, r);

        if (rr < 1.0) {
          // fake sphere normal for shading
          float z = sqrt(max(1.0 - rr * rr, 0.0));
          vec3 n = vec3(p / discR, z);
          vec3 sp = n * 3.0;
          float maria = smoothstep(-0.25, 0.45, snoise(sp * 0.9) + 0.45 * snoise(sp * 2.1));
          float craters = snoise(sp * 7.0) * 0.5 + snoise(sp * 15.0) * 0.25;
          float albedo = 0.86 - maria * 0.32 + craters * 0.07;
          float limb = pow(z, 0.35);
          vec3 lightDir = normalize(vec3(-0.35, 0.3, 0.9));
          float lit = 0.55 + 0.45 * max(dot(n, lightDir), 0.0);
          vec3 moon = vec3(0.86, 0.9, 1.0) * albedo * limb * lit * 0.62;
          float edge = smoothstep(1.0, 0.985, rr);
          col = mix(col, moon, edge);
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const size = 240;
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(size, size), moonMat);
  moon.position.copy(moonDir).multiplyScalar(440);
  moon.lookAt(0, 0, 0);
  moon.renderOrder = -9;
  moon.frustumCulled = false;
  group.add(moon);

  return { group, starMat };
}
