import * as THREE from 'three';
import { patchMaterial } from '../gl/patch.js';
import { worldPosVaryingVertex } from '../gl/glsl.js';
import { mulberry32, noise1 } from '../gl/noise.js';
import { createPedestal } from '../world/Platform.js';
import { makeRockGeometry } from '../world/rocks.js';
import { PEDESTAL_TOP, stationPosition } from '../config.js';

const BED_Y = PEDESTAL_TOP + 0.3; // top of the coal bed (local)
const FLAME_H = 3.4;
const FLAME_HALF = 1.15;
const FIRE_SCALE = 1.25;

const FLAME_VERT = /* glsl */ `
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const flameFrag = (steps) => /* glsl */ `
uniform sampler3D uNoise;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uCamLocal;
uniform vec3 uBoxMin;
uniform vec3 uBoxMax;
varying vec3 vLocal;

#define STEPS ${steps}
const float H = ${FLAME_H.toFixed(3)};

vec2 boxHit(vec3 ro, vec3 rd) {
  vec3 inv = 1.0 / rd;
  vec3 t0 = (uBoxMin - ro) * inv;
  vec3 t1 = (uBoxMax - ro) * inv;
  vec3 tmin = min(t0, t1), tmax = max(t0, t1);
  float tn = max(max(tmin.x, tmin.y), tmin.z);
  float tf = min(min(tmax.x, tmax.y), tmax.z);
  return vec2(max(tn, 0.0), tf);
}

float flame(vec3 p, out float heat) {
  float h = p.y / H;
  // slow sway of the whole body, stronger toward the tips
  vec4 w = texture(uNoise, vec3(p.x * 0.09, p.y * 0.06 - uTime * 0.09, p.z * 0.09));
  vec3 q = p;
  q.xz += (w.ar - 0.5) * (0.05 + 1.5 * h * h);
  // vertically stretched turbulence rushing upward -> licking tongues
  vec3 tp = vec3(q.x * 0.42, q.y * 0.16 - uTime * 0.42, q.z * 0.42);
  float n1 = texture(uNoise, tp).r;
  float n2 = texture(uNoise, tp * vec3(2.2, 2.0, 2.2) + vec3(0.31, -uTime * 0.3, 0.67)).g;
  float n3 = texture(uNoise, tp * vec3(4.7, 3.6, 4.7) + vec3(0.73, -uTime * 0.5, 0.19)).r;
  float n = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;
  float r = length(q.xz);
  float R = mix(0.86, 0.04, pow(max(h, 1e-4), 0.85)) * (0.8 + 0.2 * smoothstep(0.0, 0.12, h));
  float field = (1.0 - r / R) + (n - 0.5) * (0.9 + 1.9 * h) - h * 0.72;
  float d = smoothstep(0.02, 0.42, field) * smoothstep(0.0, 0.05, h);
  heat = clamp(field * 1.25 * (1.1 - 0.55 * h), 0.0, 1.35);
  return d;
}

vec3 fireRamp(float x) {
  vec3 c = mix(vec3(0.25, 0.01, 0.0), vec3(1.0, 0.13, 0.01), smoothstep(0.0, 0.25, x));
  c = mix(c, vec3(1.0, 0.42, 0.05), smoothstep(0.2, 0.5, x));
  c = mix(c, vec3(1.0, 0.72, 0.26), smoothstep(0.5, 0.85, x));
  c = mix(c, vec3(1.0, 0.9, 0.72), smoothstep(0.9, 1.3, x));
  return c;
}

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

void main() {
  bool inside = all(greaterThan(uCamLocal, uBoxMin)) && all(lessThan(uCamLocal, uBoxMax));
  if (gl_FrontFacing == inside) discard;
  vec3 ro = uCamLocal;
  vec3 rd = normalize(vLocal - ro);
  vec2 th = boxHit(ro, rd);
  if (th.y <= th.x) discard;
  float dt = (th.y - th.x) / float(STEPS);
  float t = th.x + dt * ign(gl_FragCoord.xy);
  vec3 col = vec3(0.0);
  float T = 1.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * t;
    t += dt;
    float hN = p.y / H;
    if (dot(p.xz, p.xz) > pow(0.98 + 0.8 * hN * hN, 2.0)) continue;
    float heat;
    float d = flame(p, heat);
    if (d <= 0.002) continue;
    vec3 e = fireRamp(heat) * (0.4 + heat * heat * 3.0);
    col += e * d * dt * T * uIntensity;
    T *= exp(-d * dt * 0.8);
    if (T < 0.03) break;
  }
  gl_FragColor = vec4(col, (1.0 - T) * 0.22);
}`;

export class Fire {
  constructor(ctx, def) {
    this.def = def;
    this.ctx = ctx;
    this.group = new THREE.Group();
    this.group.name = 'fire';
    stationPosition(def, this.group.position);
    this.flicker = { value: 1 };
    this.rand = mulberry32(12);

    this.pedestal = createPedestal(ctx, def);
    this.group.add(this.pedestal.mesh);

    // everything above the pedestal lives in a rig scaled about the pedestal top
    this.rig = new THREE.Group();
    this.rig.scale.setScalar(FIRE_SCALE);
    this.rig.position.y = PEDESTAL_TOP * (1 - FIRE_SCALE);
    this.group.add(this.rig);

    this.#buildBrazier();
    this.#buildCoals(ctx);
    this.#buildLogs(ctx);
    this.#buildFlames(ctx);
    this.#buildEmbers(ctx);
    this.#buildSmoke(ctx);

    this.light = new THREE.PointLight(0xff7a33, 48, 22, 2);
    this.light.position.set(0, BED_Y + 0.85, 0);
    this.rig.add(this.light);

    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 5.2, 16), new THREE.MeshBasicMaterial());
    this.hit.position.y = 2.6;
    this.hit.visible = false;
    this.hit.userData.elementId = def.id;
    this.group.add(this.hit);

    this.hazeBase = new THREE.Vector3();
    this.hazeTop = new THREE.Vector3();
    this._v = new THREE.Vector3();
  }

  #buildBrazier() {
    const prof = [
      [0.0, 0.0], [0.46, 0.0], [0.52, 0.025], [0.55, 0.07], [0.72, 0.13], [0.9, 0.23], [1.03, 0.35],
      [1.1, 0.44], [1.15, 0.47], [1.15, 0.5], [1.1, 0.52], [1.05, 0.5], [0.97, 0.42], [0.84, 0.32],
      [0.64, 0.24], [0.38, 0.2], [0.0, 0.19],
    ].map(([r, y]) => new THREE.Vector2(r, y + PEDESTAL_TOP));
    const geo = new THREE.LatheGeometry(prof, 72);
    const mat = new THREE.MeshStandardMaterial({ color: '#3a2f29', metalness: 0.78, roughness: 0.36 });
    patchMaterial(mat, {
      key: 'brazier',
      uniforms: { uNoise3D: { value: this.ctx.noise3D } },
      vertexHeader: 'varying vec3 vWPos;',
      vertex: { begin_vertex: `#include <begin_vertex>\n${worldPosVaryingVertex}` },
      fragmentHeader: 'uniform sampler3D uNoise3D; varying vec3 vWPos;',
      fragment: {
        // hammered-metal variation from seamless solid noise
        roughnessmap_fragment: /* glsl */ `
          vec4 hn = texture(uNoise3D, vWPos * 0.9 + 0.2);
          float roughnessFactor = roughness * (0.7 + 0.6 * hn.r);
          diffuseColor.rgb *= 0.75 + 0.5 * hn.g;`,
      },
    });
    const bowl = new THREE.Mesh(geo, mat);
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    this.rig.add(bowl);

    // four little flared horns on the rim
    const hornGeo = new THREE.ConeGeometry(0.06, 0.34, 8, 1);
    hornGeo.translate(0, 0.17, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const horn = new THREE.Mesh(hornGeo, mat);
      horn.position.set(Math.sin(a) * 1.12, PEDESTAL_TOP + 0.5, Math.cos(a) * 1.12);
      horn.rotation.set(Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45);
      horn.castShadow = true;
      this.rig.add(horn);
    }
  }

  #emberPatch(mat, key, extraHeader = '', emissiveCode) {
    // world-space centre of the coal bed (the group never moves after construction)
    const center = new THREE.Vector3(this.group.position.x, PEDESTAL_TOP * (1 - FIRE_SCALE) + BED_Y * FIRE_SCALE, this.group.position.z);
    patchMaterial(mat, {
      key,
      uniforms: {
        uTime: this.ctx.uniforms.uTime,
        uFlicker: this.flicker,
        uNoise3D: { value: this.ctx.noise3D },
        uNoise2D: { value: this.ctx.noise2D },
        uCenter: { value: center },
      },
      vertexHeader: 'varying vec3 vWPos; varying vec2 vUv2;',
      vertex: { begin_vertex: `#include <begin_vertex>\nvUv2 = uv;\n${worldPosVaryingVertex}` },
      fragmentHeader: /* glsl */ `
        uniform float uTime; uniform float uFlicker; uniform sampler3D uNoise3D; uniform sampler2D uNoise2D; uniform vec3 uCenter;
        varying vec3 vWPos; varying vec2 vUv2;
        ${extraHeader}`,
      fragment: { emissivemap_fragment: emissiveCode },
    });
  }

  #buildCoals(ctx) {
    const geo = makeRockGeometry(9, { detail: 1, roughness: 0.55 });
    const mat = new THREE.MeshStandardMaterial({ color: '#15100d', roughness: 0.85, metalness: 0, flatShading: true, vertexColors: false });
    this.#emberPatch(mat, 'coals', '', /* glsl */ `
      vec3 lp = vWPos - uCenter;
      float n = texture(uNoise3D, vWPos * 0.55 + vec3(0.0, uTime * 0.03, 0.0)).r;
      float n2 = texture(uNoise3D, vWPos * 1.9 + vec3(uTime * 0.02)).g;
      float glow = smoothstep(0.4, 0.78, n * 0.55 + n2 * 0.55);
      float centre = 1.0 - smoothstep(0.1, 1.15, length(lp.xz));
      float pulse = 0.7 + 0.3 * sin(uTime * 1.7 + n2 * 9.0);
      vec3 hot = mix(vec3(1.0, 0.08, 0.01), vec3(1.0, 0.42, 0.07), glow);
      totalEmissiveRadiance += hot * glow * (0.8 + 4.2 * centre) * pulse * uFlicker;
    `);
    const count = 90;
    const coals = new THREE.InstancedMesh(geo, mat, count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    const rand = mulberry32(5);
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(rand()) * 0.74;
      const a = rand() * Math.PI * 2;
      const y = PEDESTAL_TOP + 0.24 + 0.12 * (1 - (r / 0.8) ** 2) + rand() * 0.04;
      p.set(Math.sin(a) * r, y, Math.cos(a) * r);
      e.set(rand() * 6, rand() * 6, rand() * 6);
      q.setFromEuler(e);
      const sc = 0.07 + rand() * 0.08;
      s.set(sc * (0.8 + rand() * 0.5), sc * (0.6 + rand() * 0.4), sc * (0.8 + rand() * 0.5));
      m.compose(p, q, s);
      coals.setMatrixAt(i, m);
    }
    coals.castShadow = true;
    coals.receiveShadow = true;
    this.coals = coals;
    this.coalMat = mat;
    this.rig.add(coals);
  }

  #buildLogs(ctx) {
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0 });
    this.#emberPatch(mat, 'logs', '', /* glsl */ `
      vec4 n = texture(uNoise2D, vec2(vUv2.x * 2.0, vUv2.y * 0.6) + vec2(0.13, 0.71));
      vec4 m = texture(uNoise2D, vec2(vUv2.x * 5.0, vUv2.y * 1.8) + vec2(0.4, 0.2));
      float crack = smoothstep(0.8, 0.93, n.a) + smoothstep(0.84, 0.95, m.a) * 0.7;
      float heat = smoothstep(0.95, 0.05, vUv2.y);
      diffuseColor.rgb = mix(vec3(0.022, 0.015, 0.011), vec3(0.075, 0.05, 0.035), m.r) * (1.0 - crack * 0.6);
      float flick = 0.65 + 0.35 * sin(uTime * 2.3 + n.g * 11.0);
      vec3 ember = mix(vec3(1.0, 0.07, 0.005), vec3(1.0, 0.36, 0.05), heat);
      totalEmissiveRadiance += ember * crack * (0.3 + 5.5 * heat * heat) * flick * uFlicker;
      totalEmissiveRadiance += vec3(1.0, 0.12, 0.01) * smoothstep(0.3, 0.0, vUv2.y) * 1.5 * uFlicker;
    `);
    const rand = mulberry32(21);
    const up = new THREE.Vector3(0, 1, 0);
    this.logMat = mat;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rand() * 0.35;
      const baseR = 0.62 + rand() * 0.1;
      const base = new THREE.Vector3(Math.sin(a) * baseR, BED_Y - 0.06, Math.cos(a) * baseR);
      const top = new THREE.Vector3(Math.sin(a + 0.5) * 0.05, BED_Y + 0.8 + rand() * 0.25, Math.cos(a + 0.5) * 0.05);
      const dir = top.clone().sub(base);
      const len = dir.length() + 0.15;
      dir.normalize();
      const geo = new THREE.CylinderGeometry(0.07, 0.095, len, 12, 8, false);
      geo.translate(0, len / 2, 0);
      // knots and irregularity
      const pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
        const wob = 1 + Math.sin(y * 9 + i) * 0.06 + Math.sin(y * 23 + i * 3) * 0.03;
        pos.setXYZ(k, x * wob, y, z * wob);
      }
      geo.computeVertexNormals();
      const log = new THREE.Mesh(geo, mat);
      log.position.copy(base);
      log.quaternion.setFromUnitVectors(up, dir);
      log.castShadow = true;
      this.rig.add(log);
    }
  }

  #buildFlames(ctx) {
    const geo = new THREE.BoxGeometry(FLAME_HALF * 2, FLAME_H, FLAME_HALF * 2);
    geo.translate(0, FLAME_H / 2, 0);
    this.flameMat = new THREE.ShaderMaterial({
      uniforms: {
        uNoise: { value: ctx.noise3D },
        uTime: ctx.uniforms.uTime,
        uIntensity: { value: 1.0 },
        uCamLocal: { value: new THREE.Vector3() },
        uBoxMin: { value: new THREE.Vector3(-FLAME_HALF, 0, -FLAME_HALF) },
        uBoxMax: { value: new THREE.Vector3(FLAME_HALF, FLAME_H, FLAME_HALF) },
      },
      vertexShader: FLAME_VERT,
      fragmentShader: flameFrag(ctx.quality.fireSteps),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.flame = new THREE.Mesh(geo, this.flameMat);
    this.flame.position.y = BED_Y - 0.1;
    this.flame.renderOrder = 10;
    this.flame.frustumCulled = false;
    this.rig.add(this.flame);
  }

  #buildEmbers(ctx) {
    const count = ctx.quality.embers;
    const rand = mulberry32(77);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) rnd.set([rand(), rand(), rand(), rand()], i * 4);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uScale: ctx.uniforms.uPointScale, uNoise: { value: ctx.noise3D } },
      vertexShader: /* glsl */ `
        attribute vec4 aRand;
        uniform float uTime;
        uniform float uScale;
        uniform sampler3D uNoise;
        varying float vHeat;
        varying float vAlpha;
        void main() {
          float life = mix(1.6, 4.4, aRand.y);
          float age = mod(uTime * (0.85 + 0.3 * aRand.z) + aRand.x * 37.0, life);
          float k = age / life;
          float ang = aRand.x * 6.2831853 * 7.0;
          float rad = sqrt(aRand.w) * 0.75;
          vec3 p = vec3(cos(ang) * rad, 0.1, sin(ang) * rad);
          float speed = 0.8 + aRand.z * 1.7;
          p.y += age * speed - age * age * 0.05;
          vec3 np = vec3(p.x * 0.25 + aRand.x, p.y * 0.16 - uTime * 0.18, p.z * 0.25 + aRand.y);
          vec3 turb = texture(uNoise, np).rga - 0.5;
          p.xz += turb.xy * 2.6 * k + vec2(cos(ang), sin(ang)) * k * 0.45;
          p.x += sin(age * 4.0 + aRand.y * 30.0) * 0.09 * k;
          p.z += cos(age * 3.3 + aRand.z * 30.0) * 0.09 * k;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float size = mix(0.016, 0.05, aRand.w * aRand.z) * (1.0 - 0.5 * k);
          gl_PointSize = max(size * uScale / -mv.z, 1.5);
          vHeat = 1.0 - k;
          vAlpha = smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(0.6, 1.0, k));
          vAlpha *= 0.55 + 0.45 * sin(uTime * 13.0 + aRand.x * 100.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vHeat;
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float core = smoothstep(0.5, 0.0, length(c));
          core = core * core * core;
          vec3 col = mix(vec3(1.0, 0.16, 0.02), vec3(1.0, 0.68, 0.3), vHeat) * mix(2.5, 16.0, vHeat * vHeat);
          gl_FragColor = vec4(col * core * vAlpha, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.embers = new THREE.Points(geo, mat);
    this.embers.position.y = BED_Y;
    this.embers.frustumCulled = false;
    this.embers.renderOrder = 12;
    this.rig.add(this.embers);
  }

  #buildSmoke(ctx) {
    const count = 30;
    const plane = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.attributes.position);
    const rand = mulberry32(88);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) rnd.set([rand(), rand(), rand(), rand()], i * 4);
    geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rnd, 4));
    geo.instanceCount = count;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uNoise2D: { value: ctx.noise2D }, uFlicker: this.flicker },
      vertexShader: /* glsl */ `
        attribute vec4 aRand;
        uniform float uTime;
        varying vec2 vUv;
        varying float vAlpha;
        varying float vWarm;
        varying float vSeed;
        void main() {
          float life = 5.5 + aRand.y * 2.5;
          float age = mod(uTime + aRand.x * life, life);
          float k = age / life;
          vec3 c = vec3((aRand.z - 0.5) * 0.5, 1.7 + age * 0.62, (aRand.w - 0.5) * 0.5);
          c.x += sin(age * 0.6 + aRand.x * 20.0) * 0.3 * k + k * k * 1.1;
          c.z += cos(age * 0.5 + aRand.y * 17.0) * 0.3 * k - k * k * 0.4;
          float size = mix(0.6, 2.8, k);
          vec4 mv = modelViewMatrix * vec4(c, 1.0);
          float rot = aRand.x * 6.28 + age * (aRand.y - 0.5) * 0.5;
          vec2 corner = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * position.xy;
          mv.xy += corner * size;
          gl_Position = projectionMatrix * mv;
          vUv = position.xy + 0.5;
          vAlpha = smoothstep(0.0, 0.18, k) * (1.0 - smoothstep(0.5, 1.0, k));
          vWarm = 1.0 - smoothstep(0.0, 0.3, k);
          vSeed = aRand.x;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uNoise2D;
        uniform float uTime;
        uniform float uFlicker;
        varying vec2 vUv;
        varying float vAlpha;
        varying float vWarm;
        varying float vSeed;
        void main() {
          vec2 c = vUv - 0.5;
          float r = length(c);
          float n = texture(uNoise2D, vUv * 0.45 + vSeed * 3.7 + vec2(0.0, -uTime * 0.02)).r;
          float n2 = texture(uNoise2D, vUv * 0.9 + vSeed * 1.3).g;
          float puff = smoothstep(0.5, 0.08, r + (n - 0.5) * 0.4 + (n2 - 0.5) * 0.2);
          float a = puff * vAlpha * 0.22;
          vec3 col = mix(vec3(0.02, 0.019, 0.019), vec3(0.6, 0.2, 0.05) * uFlicker, vWarm * 0.6);
          gl_FragColor = vec4(col * a, a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.smoke = new THREE.Mesh(geo, mat);
    this.smoke.position.y = BED_Y;
    this.smoke.frustumCulled = false;
    this.smoke.renderOrder = 5;
    this.rig.add(this.smoke);
  }

  update(time, dt, camera) {
    const f = 0.8 + 0.12 * (noise1(time * 7.3, 1) - 0.5) * 2 + 0.08 * (noise1(time * 17.1, 2) - 0.5) * 2 + 0.05 * (noise1(time * 1.3, 5) - 0.5) * 2;
    this.flicker.value = f;
    this.flameMat.uniforms.uIntensity.value = 0.9 + 0.2 * f;
    this.light.intensity = 60 * f;
    this.light.position.x = (noise1(time * 2.1, 3) - 0.5) * 0.25;
    this.light.position.z = (noise1(time * 2.4, 4) - 0.5) * 0.25;
    this.light.position.y = BED_Y + 0.85 + (noise1(time * 3.1, 6) - 0.5) * 0.2;
    this.flame.worldToLocal(this.flameMat.uniforms.uCamLocal.value.copy(camera.position));

    this.rig.localToWorld(this.hazeBase.set(0, BED_Y + 0.35, 0));
    this.rig.localToWorld(this.hazeTop.set(0, BED_Y + 2.9, 0));
  }
}
