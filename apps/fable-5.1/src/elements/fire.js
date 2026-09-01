import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise.js';
import { createPedestal } from '../environment.js';

export const FIRE_COLOR = 0xff6a1a;

/**
 * Fire: a ray-marched volumetric flame (3D noise density inside a bounding box),
 * glowing coals, rising embers and a flickering point light.
 */
export function createFire({ position }) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.add(createPedestal(FIRE_COLOR));

  const uTime = { value: 0 };
  const uPixelRatio = { value: Math.min(window.devicePixelRatio, 1.5) };

  // ---------------------------------------------------------------- coals
  const coalsGeo = new THREE.SphereGeometry(1.0, 64, 32);
  coalsGeo.scale(1.3, 0.3, 1.3);
  const coalsMat = new THREE.ShaderMaterial({
    uniforms: { uTime },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime;
      varying vec3 vPos;
      void main() {
        vec3 p = vec3(vPos.x, vPos.y * 3.0, vPos.z);
        float cells = fbm(p * 2.4);
        float cracks = 1.0 - abs(snoise(p * 3.2 + 2.0));
        float glow = smoothstep(0.6, 1.0, cracks);
        float pulse = 0.55 + 0.45 * snoise(vec3(p.xz * 1.4, uTime * 0.9));
        glow = glow * (0.45 + 0.55 * pulse) + smoothstep(0.25, 0.75, cells) * 0.4 * pulse;
        float top = smoothstep(-0.2, 0.7, normalize(vPos).y);
        vec3 ember = mix(vec3(1.0, 0.22, 0.02), vec3(1.0, 0.72, 0.22), glow);
        vec3 rock = vec3(0.05, 0.035, 0.03) * (0.6 + 0.4 * cells);
        vec3 col = mix(rock, ember * 2.4, clamp(glow * top, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const coals = new THREE.Mesh(coalsGeo, coalsMat);
  coals.position.y = 0.58;
  group.add(coals);

  // ---------------------------------------------------------------- volumetric flame
  const H = 3.8;
  const W = 2.8;
  const flameGeo = new THREE.BoxGeometry(W, H, W);
  flameGeo.translate(0, H / 2, 0);
  const flameMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      uCamPos: { value: new THREE.Vector3() },
      uBoxMin: { value: new THREE.Vector3(-W / 2, 0, -W / 2) },
      uBoxMax: { value: new THREE.Vector3(W / 2, H, W / 2) },
      uHeight: { value: H },
      uRadius: { value: 1.3 },
      uDensity: { value: 2.6 },
      uIntensity: { value: 0.85 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      #define STEPS 36
      ${noiseGLSL}
      uniform float uTime;
      uniform vec3 uCamPos, uBoxMin, uBoxMax;
      uniform float uHeight, uRadius, uDensity, uIntensity;
      varying vec3 vPos;

      float flameDensity(vec3 p, float t) {
        float h = clamp(p.y / uHeight, 0.0, 1.0);
        // the whole column sways more the higher it gets
        float swayX = snoise(vec3(t * 0.9, p.y * 0.6, 1.3)) * 0.45 * h;
        float swayZ = snoise(vec3(4.2, p.y * 0.6, t * 0.8)) * 0.45 * h;
        vec2 q = p.xz - vec2(swayX, swayZ);
        float r = length(q);
        float radius = uRadius * pow(1.0 - h, 0.5) + 0.04;
        float shape = 1.0 - smoothstep(0.0, radius, r);
        if (shape < 0.002) return 0.0;
        vec3 np = vec3(p.x * 2.1, p.y * 1.35 - t * 3.0, p.z * 2.1);
        float n = 0.5 + 0.5 * fbm3(np);
        float d = shape * 1.05 - n * (0.8 + 0.8 * h);
        d *= smoothstep(0.0, 0.05, h);
        return clamp(d, 0.0, 1.0);
      }

      vec3 flameColor(float temp) {
        vec3 c1 = vec3(0.55, 0.03, 0.0);
        vec3 c2 = vec3(1.0, 0.32, 0.02);
        vec3 c3 = vec3(1.0, 0.78, 0.22);
        vec3 c4 = vec3(1.0, 0.9, 0.55);
        vec3 c = mix(c1, c2, smoothstep(0.0, 0.32, temp));
        c = mix(c, c3, smoothstep(0.38, 0.72, temp));
        c = mix(c, c4, smoothstep(0.74, 1.0, temp));
        return c;
      }

      void main() {
        vec3 ro = uCamPos;
        vec3 rd = normalize(vPos - ro);
        vec3 inv = 1.0 / rd;
        vec3 ta = (uBoxMin - ro) * inv;
        vec3 tb = (uBoxMax - ro) * inv;
        vec3 tmin = min(ta, tb);
        vec3 tmax = max(ta, tb);
        float tNear = max(max(tmin.x, tmin.y), tmin.z);
        float tFar = min(min(tmax.x, tmax.y), tmax.z);
        tNear = max(tNear, 0.0);
        if (tFar <= tNear) discard;

        float stepLen = (tFar - tNear) / float(STEPS);
        float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float t = tNear + stepLen * jitter;
        vec3 acc = vec3(0.0);
        float alpha = 0.0;
        for (int i = 0; i < STEPS; i++) {
          vec3 p = ro + rd * t;
          float d = flameDensity(p, uTime);
          if (d > 0.001) {
            float h = p.y / uHeight;
            float temp = d * (0.92 - h * 0.7);
            vec3 col = flameColor(temp) * (0.8 + d * 0.8);
            float a = d * stepLen * uDensity;
            acc += col * a * (1.0 - alpha);
            alpha += a * (1.0 - alpha);
            if (alpha > 0.985) break;
          }
          t += stepLen;
        }
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(acc * uIntensity, 1.0);
      }`,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = 0.66;
  flame.renderOrder = 20;
  group.add(flame);

  // ---------------------------------------------------------------- embers
  const EMBERS = 320;
  const seeds = new Float32Array(EMBERS * 4);
  for (let i = 0; i < EMBERS; i++) {
    seeds[i * 4] = Math.random() * Math.PI * 2;
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = 0.6 + Math.random() * 0.9;
    seeds[i * 4 + 3] = Math.random();
  }
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(EMBERS * 3), 3));
  emberGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const emberMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uPixelRatio },
    vertexShader: /* glsl */ `
      ${noiseGLSL}
      attribute vec4 aSeed;
      uniform float uTime, uPixelRatio;
      varying float vLife;
      varying float vSpark;
      void main() {
        float life = fract(aSeed.w + uTime * 0.16 * aSeed.z);
        float y = 0.7 + life * 5.0;
        float ang = aSeed.x + life * 1.8 + uTime * 0.25;
        float rad = (0.05 + aSeed.y * 0.45) * (1.0 + life * 0.9);
        vec3 p = vec3(cos(ang) * rad, y, sin(ang) * rad);
        p.x += snoise(vec3(aSeed.x * 7.0, uTime * 0.6, life * 2.5)) * 0.3 * (0.2 + life);
        p.z += snoise(vec3(aSeed.y * 7.0 + 3.0, uTime * 0.55, life * 2.5)) * 0.3 * (0.2 + life);
        vLife = life;
        vSpark = aSeed.y;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = (1.2 + 2.2 * (1.0 - life)) * (0.7 + 0.6 * aSeed.y);
        gl_PointSize = size * uPixelRatio * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vLife;
      varying float vSpark;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.08, d);
        a *= smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.5, 1.0, vLife));
        float flicker = 0.7 + 0.3 * sin(vLife * 60.0 + vSpark * 30.0);
        vec3 col = mix(vec3(1.0, 0.85, 0.45), vec3(1.0, 0.3, 0.04), smoothstep(0.0, 0.7, vLife));
        a *= flicker;
        gl_FragColor = vec4(col * a * 1.6, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  embers.frustumCulled = false;
  embers.renderOrder = 21;
  group.add(embers);

  // ---------------------------------------------------------------- smoke
  const smokeTex = makeSmokeTexture();
  const smokeMat = new THREE.SpriteMaterial({
    map: smokeTex,
    color: 0x4a423d,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const smoke = new THREE.Group();
  const SMOKE = 34;
  const puffs = [];
  for (let i = 0; i < SMOKE; i++) {
    const s = new THREE.Sprite(smokeMat.clone());
    s.material.rotation = Math.random() * Math.PI * 2;
    puffs.push({
      sprite: s,
      offset: Math.random(),
      speed: 0.09 + Math.random() * 0.05,
      ang: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.8,
      spin: (Math.random() - 0.5) * 0.5,
    });
    smoke.add(s);
  }
  smoke.renderOrder = 15;
  group.add(smoke);

  // ---------------------------------------------------------------- light
  const light = new THREE.PointLight(FIRE_COLOR, 34, 20, 2);
  light.position.y = 1.9;
  group.add(light);

  const tmp = new THREE.Vector3();
  function update(t, dt, camera) {
    uTime.value = t;
    tmp.copy(camera.position);
    flame.worldToLocal(tmp);
    flameMat.uniforms.uCamPos.value.copy(tmp);
    const flicker =
      Math.sin(t * 13.1) * 0.5 + Math.sin(t * 7.3 + 1.0) * 0.3 + Math.sin(t * 23.7) * 0.2;
    light.intensity = 30 + flicker * 7;
    light.position.x = Math.sin(t * 3.1) * 0.12;
    light.position.z = Math.cos(t * 2.7) * 0.12;
    for (const p of puffs) {
      const life = (p.offset + t * p.speed) % 1;
      const y = 3.2 + life * 4.5;
      const sway = Math.sin(t * 0.6 + p.ang) * 0.35 * life;
      p.sprite.position.set(Math.cos(p.ang) * 0.25 + sway + p.drift * life, y, Math.sin(p.ang) * 0.25 + p.drift * life * 0.5);
      const scale = 0.9 + life * 2.6;
      p.sprite.scale.set(scale, scale, 1);
      p.sprite.material.opacity = 0.32 * Math.sin(life * Math.PI) * (1 - life * 0.4);
      p.sprite.material.rotation += dt * p.spin;
    }
  }

  return {
    name: 'fire',
    color: FIRE_COLOR,
    group,
    update,
    focus: { target: new THREE.Vector3(position.x, 2.1, position.z) },
  };
}

function makeSmokeTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
