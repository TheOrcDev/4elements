import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise.js';
import { createPedestal } from '../environment.js';

export const AIR_COLOR = 0xcfe9ff;

// shared trajectory: a tornado-like vortex that widens with height, perturbed by curl noise
const trajectoryGLSL = /* glsl */ `
  uniform float uTime, uHeight, uBaseR, uTopR, uTwist, uSpin;
  vec3 traj(float t, vec4 s) {
    float life = fract(s.y + t * 0.09 * s.w);
    float h = life;
    float ang = s.x + t * uSpin * (0.8 + 0.4 * s.w) + h * uTwist;
    float r = mix(uBaseR, uTopR, pow(h, 1.5)) * s.z;
    vec3 p = vec3(cos(ang) * r, 0.62 + h * uHeight, sin(ang) * r);
    p += curlNoise(p * 0.55 + vec3(0.0, -t * 0.45, 0.0)) * (0.12 + 0.45 * h);
    return p;
  }
  float trajLife(float t, vec4 s) { return fract(s.y + t * 0.09 * s.w); }
`;

function randomSeeds(n, radiusJitter = [0.7, 1.3]) {
  const seeds = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    seeds[i * 4] = Math.random() * Math.PI * 2;
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = radiusJitter[0] + Math.random() * (radiusJitter[1] - radiusJitter[0]);
    seeds[i * 4 + 3] = 0.7 + Math.random() * 0.7;
  }
  return seeds;
}

function quadInstancedGeometry(seeds, count) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex([0, 1, 2, 2, 1, 3]);
  geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  geo.setAttribute('aCorner', new THREE.Float32BufferAttribute([-1, -1, 1, -1, -1, 1, 1, 1], 2));
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
  geo.instanceCount = count;
  return geo;
}

/**
 * Air: a vortex of motion-stretched wind streaks, swirling dust, wisps of cloud,
 * flowing ribbons and leaves caught in the current.
 */
export function createAir({ position }) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.add(createPedestal(AIR_COLOR));

  const shared = {
    uTime: { value: 0 },
    uHeight: { value: 3.7 },
    uBaseR: { value: 0.28 },
    uTopR: { value: 1.75 },
    uTwist: { value: 5.5 },
    uSpin: { value: 2.4 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
  };

  // ---------------------------------------------------------------- wind streaks
  const STREAKS = 2400;
  const streakGeo = quadInstancedGeometry(randomSeeds(STREAKS), STREAKS);
  const streakMat = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uColor: { value: new THREE.Color(0xd8efff) },
      uWidth: { value: 0.022 },
      uTrail: { value: 0.09 },
    },
    vertexShader: /* glsl */ `
      ${noiseGLSL}
      ${trajectoryGLSL}
      attribute vec2 aCorner;
      attribute vec4 aSeed;
      uniform float uWidth, uTrail;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        vec3 p0 = traj(uTime, aSeed);
        vec3 p1 = traj(uTime - uTrail * (0.6 + 0.8 * aSeed.z), aSeed);
        vec3 mid = mix(p1, p0, aCorner.x * 0.5 + 0.5);
        vec3 wMid = (modelMatrix * vec4(mid, 1.0)).xyz;
        vec3 dir = normalize(p0 - p1 + vec3(1e-4));
        vec3 viewDir = normalize(cameraPosition - wMid);
        vec3 side = normalize(cross(dir, viewDir));
        float width = uWidth * (0.5 + 0.7 * aSeed.z);
        vec3 wPos = wMid + side * aCorner.y * width;
        float life = trajLife(uTime, aSeed);
        vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.65, 1.0, life));
        vUv = aCorner * 0.5 + 0.5;
        gl_Position = projectionMatrix * viewMatrix * vec4(wPos, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        float across = 1.0 - abs(vUv.y * 2.0 - 1.0);
        float along = smoothstep(0.0, 0.6, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
        float a = across * across * along * vAlpha * 0.22;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const streaks = new THREE.Mesh(streakGeo, streakMat);
  streaks.frustumCulled = false;
  streaks.renderOrder = 20;
  group.add(streaks);

  // ---------------------------------------------------------------- dust points
  const DUST = 2500;
  const dustSeeds = randomSeeds(DUST, [0.5, 1.7]);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DUST * 3), 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeeds, 4));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */ `
      ${noiseGLSL}
      ${trajectoryGLSL}
      attribute vec4 aSeed;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        vec3 p = traj(uTime * 0.85, aSeed);
        float life = trajLife(uTime * 0.85, aSeed);
        vAlpha = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.7, 1.0, life));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (0.8 + 1.6 * fract(aSeed.z * 7.3)) * uPixelRatio * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.1, d) * vAlpha * 0.14;
        gl_FragColor = vec4(vec3(0.8, 0.9, 1.0) * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  dust.renderOrder = 20;
  group.add(dust);

  // ---------------------------------------------------------------- leaves caught in the wind
  const LEAVES = 70;
  const leafGeo = quadInstancedGeometry(randomSeeds(LEAVES, [0.85, 1.25]), LEAVES);
  const leafMat = new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */ `
      ${noiseGLSL}
      ${trajectoryGLSL}
      attribute vec2 aCorner;
      attribute vec4 aSeed;
      varying vec2 vCorner;
      varying float vShade;
      varying float vAlpha;
      varying float vTint;
      mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
      mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
      mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
      void main() {
        vec3 c = traj(uTime * 0.7, aSeed);
        float life = trajLife(uTime * 0.7, aSeed);
        mat3 R = rotY(uTime * (1.5 + aSeed.w) + aSeed.x) * rotX(uTime * (2.2 + aSeed.z) + aSeed.y * 6.0) * rotZ(aSeed.x);
        vec3 local = R * vec3(aCorner.x * 0.075, 0.0, aCorner.y * 0.13);
        vec3 n = R * vec3(0.0, 1.0, 0.0);
        vShade = 0.55 + 0.45 * abs(dot(n, normalize(vec3(0.3, 1.0, 0.4))));
        vAlpha = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.8, 1.0, life));
        vTint = fract(aSeed.z * 13.7);
        vCorner = aCorner;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(c + local, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vCorner;
      varying float vShade;
      varying float vAlpha;
      varying float vTint;
      void main() {
        float e = 1.0 - (vCorner.x * vCorner.x + vCorner.y * vCorner.y);
        if (e < 0.0 || vAlpha < 0.02) discard;
        vec3 green = vec3(0.35, 0.62, 0.2);
        vec3 amber = vec3(0.75, 0.55, 0.18);
        vec3 col = mix(green, amber, smoothstep(0.35, 0.8, vTint)) * vShade;
        col *= 1.0 - 0.45 * smoothstep(0.08, 0.0, abs(vCorner.x));
        gl_FragColor = vec4(col, 1.0);
      }`,
    side: THREE.DoubleSide,
  });
  const leaves = new THREE.Mesh(leafGeo, leafMat);
  leaves.frustumCulled = false;
  group.add(leaves);

  // ---------------------------------------------------------------- flowing ribbons
  const ribbonMat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uColor: { value: new THREE.Color(0xbfe4ff) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime; uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float band = fract(vUv.x * 2.5 - uTime * 0.55);
        float pulse = smoothstep(0.0, 0.45, band) * (1.0 - smoothstep(0.45, 1.0, band));
        float ends = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
        float grain = 0.6 + 0.4 * snoise(vec3(vUv.x * 18.0, vUv.y * 3.0, uTime * 1.5));
        float a = pulse * ends * grain * 0.14;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const ribbons = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const pts = [];
    const N = 160;
    const phase = (k / 3) * Math.PI * 2;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const ang = phase + t * Math.PI * 2 * 2.4;
      const r = 0.35 + 1.6 * Math.pow(t, 1.4);
      pts.push(new THREE.Vector3(Math.cos(ang) * r, 0.7 + t * 3.6, Math.sin(ang) * r));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.03, 6, false);
    const mesh = new THREE.Mesh(geo, ribbonMat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 19;
    ribbons.add(mesh);
  }
  group.add(ribbons);

  // ---------------------------------------------------------------- soft wisps (sprites)
  const wispTex = makeSoftTexture();
  const wisps = new THREE.Group();
  const wispMat = new THREE.SpriteMaterial({
    map: wispTex,
    color: 0x9fcbff,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const wispData = [];
  for (let i = 0; i < 22; i++) {
    const s = new THREE.Sprite(wispMat);
    const top = i < 14;
    const d = {
      ang: Math.random() * Math.PI * 2,
      r: top ? 1.3 + Math.random() * 1.0 : 0.9 + Math.random() * 0.9,
      y: top ? 3.4 + Math.random() * 1.2 : 0.75 + Math.random() * 0.5,
      speed: (top ? 0.5 : 0.8) + Math.random() * 0.4,
      scale: top ? 1.6 + Math.random() * 1.4 : 1.0 + Math.random() * 0.8,
    };
    s.scale.setScalar(d.scale);
    wispData.push({ sprite: s, ...d });
    wisps.add(s);
  }
  group.add(wisps);

  // ---------------------------------------------------------------- light
  const light = new THREE.PointLight(AIR_COLOR, 12, 14, 2);
  light.position.y = 2.6;
  group.add(light);

  function update(t) {
    shared.uTime.value = t;
    ribbons.rotation.y = t * 1.1;
    for (const w of wispData) {
      const a = w.ang + t * w.speed;
      w.sprite.position.set(Math.cos(a) * w.r, w.y + Math.sin(t * 0.7 + w.ang) * 0.15, Math.sin(a) * w.r);
    }
  }

  return {
    name: 'air',
    color: AIR_COLOR,
    group,
    update,
    focus: { target: new THREE.Vector3(position.x, 2.2, position.z) },
  };
}

function makeSoftTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
