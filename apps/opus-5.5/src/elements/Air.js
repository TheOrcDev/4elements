import * as THREE from 'three';
import { patchMaterial } from '../gl/patch.js';
import { mulberry32 } from '../gl/noise.js';
import { createPedestal } from '../world/Platform.js';
import { PEDESTAL_TOP, stationPosition } from '../config.js';

const BASE_Y = PEDESTAL_TOP + 0.02;
const VORTEX_H = 5.0;
const RISE_ANG = 1.9; // base angular speed (rad/s)

// ---- shared vortex kinematics (JS and GLSL versions must agree) ----
const funnelR = (u) => 0.22 + 0.55 * u + 1.2 * u * u;
const bendX = (u, t) => Math.sin(t * 0.5 + u * 2.2) * 0.26 * u;
const bendZ = (u, t) => Math.cos(t * 0.43 + u * 1.7) * 0.22 * u;

const VORTEX_GLSL = /* glsl */ `
const float VH = ${VORTEX_H.toFixed(3)};
float funnelR(float u) { return 0.22 + 0.55 * u + 1.2 * u * u; }
vec2 bend(float u, float t) { return vec2(sin(t * 0.5 + u * 2.2) * 0.26, cos(t * 0.43 + u * 1.7) * 0.22) * u; }
// Position of a particle riding the vortex. seed: x start phase, y rise-rate, z radius factor, w start angle.
vec3 vortexPath(float t, vec4 seed, out float cyc, out float k) {
  float rate = 0.09 + seed.y * 0.09;
  float u = seed.x + t * rate;
  cyc = floor(u);
  k = u - cyc;
  float rad = funnelR(k) * (0.55 + seed.z * 0.75);
  float w = ${RISE_ANG.toFixed(3)} * (0.85 + seed.z * 0.4);
  float ang = seed.w * 6.2831853 + cyc * 2.39996 + (w / rate) * (1.6 * k - 0.45 * k * k);
  vec3 p = vec3(cos(ang) * rad, k * VH, sin(ang) * rad);
  p.xz += bend(k, t);
  return p;
}
`;

function vortexPathJS(t, seed, out) {
  const rate = 0.09 + seed[1] * 0.09;
  const u = seed[0] + t * rate;
  const cyc = Math.floor(u);
  const k = u - cyc;
  const rad = funnelR(k) * (0.55 + seed[2] * 0.75);
  const w = RISE_ANG * (0.85 + seed[2] * 0.4);
  const ang = seed[3] * Math.PI * 2 + cyc * 2.39996 + (w / rate) * (1.6 * k - 0.45 * k * k);
  out.set(Math.cos(ang) * rad + bendX(k, t), k * VORTEX_H, Math.sin(ang) * rad + bendZ(k, t));
  return k;
}

export function makeLeafGeometry() {
  // A small pointed leaf with a slight fold along the midrib.
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(0.32, -0.3, 0.34, 0.2, 0, 0.5);
  shape.bezierCurveTo(-0.34, 0.2, -0.32, -0.3, 0, -0.5);
  const geo = new THREE.ShapeGeometry(shape, 6);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.abs(x) * 0.35 - (y * y) * 0.12);
  }
  geo.computeVertexNormals();
  return geo;
}

export class Air {
  constructor(ctx, def) {
    this.def = def;
    this.ctx = ctx;
    this.group = new THREE.Group();
    this.group.name = 'air';
    stationPosition(def, this.group.position);
    this.rand = mulberry32(808);
    this.color = new THREE.Color('#cfe9ff');

    this.pedestal = createPedestal(ctx, def);
    this.group.add(this.pedestal.mesh);

    this.vortex = new THREE.Group();
    this.vortex.position.y = BASE_Y;
    this.group.add(this.vortex);

    this.#buildVent(ctx);
    this.#buildShells(ctx);
    this.#buildRibbons(ctx);
    this.#buildDust(ctx);
    this.#buildClouds(ctx);
    this.#buildLeaves(ctx);

    this.light = new THREE.PointLight(0xcfe6ff, 4.5, 8, 2);
    this.light.position.set(0, BASE_Y + 0.55, 0);
    this.group.add(this.light);

    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.6, 5.4, 16), new THREE.MeshBasicMaterial());
    this.hit.position.y = 2.8;
    this.hit.visible = false;
    this.hit.userData.elementId = def.id;
    this.group.add(this.hit);

    this._v = new THREE.Vector3();
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._s = new THREE.Vector3();
  }

  #buildVent(ctx) {
    const geo = new THREE.CircleGeometry(1.2, 96);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: '#15181d', roughness: 0.55, metalness: 0.4 });
    patchMaterial(mat, {
      key: 'air-vent',
      uniforms: { uTime: ctx.uniforms.uTime },
      vertexHeader: 'varying vec2 vUv2;',
      vertex: { begin_vertex: '#include <begin_vertex>\nvUv2 = uv;' },
      fragmentHeader: 'uniform float uTime; varying vec2 vUv2;',
      fragment: {
        emissivemap_fragment: /* glsl */ `
          {
            vec2 c = vUv2 - 0.5;
            float r = length(c) * 2.0;
            float a = atan(c.y, c.x);
            float spiral = fract(r * 5.0 - a / 6.2831853 * 2.0 + uTime * 0.35);
            float slot = smoothstep(0.42, 0.5, spiral) * (1.0 - smoothstep(0.5, 0.58, spiral));
            float glow = slot * smoothstep(0.95, 0.2, r) * (0.6 + 0.4 * sin(uTime * 1.3));
            diffuseColor.rgb *= 1.0 - slot * 0.8;
            totalEmissiveRadiance += vec3(0.55, 0.78, 1.0) * glow * 1.4;
            totalEmissiveRadiance += vec3(0.4, 0.6, 0.9) * smoothstep(0.35, 0.0, r) * 0.7;
          }`,
      },
    });
    const vent = new THREE.Mesh(geo, mat);
    vent.position.y = PEDESTAL_TOP + 0.006;
    vent.receiveShadow = true;
    this.group.add(vent);
  }

  #buildShells(ctx) {
    const layers = [
      { scale: 0.62, opacity: 0.7, speed: 1.35, seed: 0.13 },
      { scale: 0.85, opacity: 0.55, speed: 1.0, seed: 0.51 },
      { scale: 1.08, opacity: 0.3, speed: 0.78, seed: 0.77 },
      { scale: 1.3, opacity: 0.16, speed: 0.6, seed: 0.29 },
    ];
    this.shells = [];
    for (const L of layers) {
      const pts = [];
      const N = 56;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        pts.push(new THREE.Vector2(funnelR(u) * L.scale, u * VORTEX_H));
      }
      const geo = new THREE.LatheGeometry(pts, 112);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: ctx.uniforms.uTime,
          uNoise2D: { value: ctx.noise2D },
          uOpacity: { value: L.opacity },
          uSpeed: { value: L.speed },
          uSeed: { value: L.seed },
          uColor: { value: new THREE.Vector3(0.72, 0.87, 1.0) },
        },
        vertexShader: /* glsl */ `
          ${VORTEX_GLSL}
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vUv = uv;
            vec3 p = position;
            float breathe = 1.0 + 0.05 * sin(uTime * 1.3 + uv.y * 7.0);
            p.xz *= breathe;
            p.xz += bend(uv.y, uTime);
            vec4 wp = modelMatrix * vec4(p, 1.0);
            vN = normalize(mat3(modelMatrix) * normal);
            vV = normalize(cameraPosition - wp.xyz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform sampler2D uNoise2D;
          uniform float uOpacity;
          uniform float uSpeed;
          uniform float uSeed;
          uniform vec3 uColor;
          varying vec2 vUv;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            float h = vUv.y;
            float spin = uTime * uSpeed * (1.0 - 0.45 * h) * 0.32;
            vec2 st = vec2(vUv.x * 3.0 + spin + h * 1.2 + uSeed, h * 0.9 - uTime * 0.05 + uSeed);
            float n1 = texture2D(uNoise2D, vec2(st.x, st.y * 0.45)).r;
            float n2 = texture2D(uNoise2D, vec2(st.x * 2.0 + 0.37, st.y * 1.2)).g;
            float n3 = texture2D(uNoise2D, vec2(st.x * 4.0 - 0.21, st.y * 2.3)).a;
            float n = n1 * 0.6 + n2 * 0.3 + n3 * 0.2;
            float streak = smoothstep(0.52, 0.92, n);
            float fres = 1.0 - abs(dot(normalize(vN), normalize(vV)));
            float fade = smoothstep(0.0, 0.12, h) * (1.0 - smoothstep(0.72, 1.0, h));
            float a = streak * (0.2 + 0.8 * fres * fres) * fade * uOpacity;
            vec3 col = mix(uColor, vec3(1.0), n3 * 0.7);
            gl_FragColor = vec4(col * a, 1.0);
          }`,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 20;
      mesh.frustumCulled = false;
      this.vortex.add(mesh);
      this.shells.push(mesh);
    }
  }

  #buildRibbons(ctx) {
    const count = ctx.quality.ribbons;
    const M = 26; // segments per ribbon
    const vertsPer = (M + 1) * 2;
    const seeds = new Float32Array(count * vertsPer * 4);
    const trail = new Float32Array(count * vertsPer * 2);
    const pos = new Float32Array(count * vertsPer * 3);
    const index = [];
    for (let r = 0; r < count; r++) {
      const sd = [this.rand(), this.rand(), this.rand(), this.rand()];
      for (let j = 0; j <= M; j++) {
        for (let side = 0; side < 2; side++) {
          const v = r * vertsPer + j * 2 + side;
          seeds.set(sd, v * 4);
          trail.set([j / M, side ? 1 : -1], v * 2);
        }
      }
      for (let j = 0; j < M; j++) {
        const a = r * vertsPer + j * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    geo.setAttribute('aTrail', new THREE.BufferAttribute(trail, 2));
    geo.setIndex(index);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uColor: { value: new THREE.Vector3(0.78, 0.9, 1.0) } },
      vertexShader: /* glsl */ `
        ${VORTEX_GLSL}
        attribute vec4 aSeed;
        attribute vec2 aTrail;
        uniform float uTime;
        varying float vAlpha;
        varying float vSide;
        void main() {
          float s = aTrail.x;
          float cyc, k, cycHead, kHead, cycB, kB;
          vortexPath(uTime, aSeed, cycHead, kHead);
          // shorter trails higher up where the funnel is wide and the flow is fast
          float trailT = (0.35 + aSeed.y * 0.55) * (1.0 - 0.55 * kHead);
          float t = uTime - s * trailT;
          // never reach back into the previous loop of the particle (avoids long stray triangles)
          float rate = 0.09 + aSeed.y * 0.09;
          float tStart = (cycHead - aSeed.x) / rate + 0.02;
          t = max(t, tStart);
          vec3 p = vortexPath(t, aSeed, cyc, k);
          vec3 pb = vortexPath(t - 0.03, aSeed, cycB, kB);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vec4 mvb = modelViewMatrix * vec4(pb, 1.0);
          vec3 tang = mv.xyz - mvb.xyz;
          tang = length(tang) > 1e-5 ? normalize(tang) : vec3(0.0, 1.0, 0.0);
          vec3 side = normalize(cross(tang, normalize(mv.xyz)));
          float width = (0.006 + aSeed.z * 0.016) * (1.0 - s * 0.85) * (0.6 + k);
          mv.xyz += side * aTrail.y * width;
          gl_Position = projectionMatrix * mv;
          vSide = aTrail.y;
          vAlpha = smoothstep(0.0, 0.1, k) * (1.0 - smoothstep(0.55, 0.92, k)) * (1.0 - s) * (1.0 - s) * (1.0 - 0.45 * k);
          vAlpha *= (0.25 + 0.75 * aSeed.z) * (0.6 + 0.4 * sin(uTime * (0.8 + aSeed.x) + aSeed.w * 30.0));
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        varying float vSide;
        void main() {
          float edge = 1.0 - vSide * vSide;
          gl_FragColor = vec4(uColor * edge * vAlpha * 1.05, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.ribbons = new THREE.Mesh(geo, mat);
    this.ribbons.frustumCulled = false;
    this.ribbons.renderOrder = 21;
    this.vortex.add(this.ribbons);
  }

  #buildDust(ctx) {
    const count = 900;
    const geo = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) seeds.set([this.rand(), this.rand(), this.rand(), this.rand()], i * 4);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uScale: ctx.uniforms.uPointScale },
      vertexShader: /* glsl */ `
        ${VORTEX_GLSL}
        attribute vec4 aSeed;
        uniform float uTime;
        uniform float uScale;
        varying float vA;
        void main() {
          float cyc, k;
          vec4 sd = aSeed;
          sd.z = fract(sd.z * 1.7 + 0.2);
          vec3 p = vortexPath(uTime, sd, cyc, k);
          p += (fract(aSeed.yzx * 91.7) - 0.5) * 0.25;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max((0.012 + aSeed.w * 0.018) * uScale / -mv.z, 1.0);
          vA = smoothstep(0.0, 0.1, k) * (1.0 - smoothstep(0.75, 1.0, k)) * (0.4 + 0.6 * aSeed.y);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(0.85, 0.93, 1.0) * a * a * vA * 1.3, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.dust = new THREE.Points(geo, mat);
    this.dust.frustumCulled = false;
    this.dust.renderOrder = 22;
    this.vortex.add(this.dust);
  }

  #buildClouds(ctx) {
    const count = 42;
    const plane = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.attributes.position);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) rnd.set([this.rand(), this.rand(), this.rand(), i < 26 ? 0 : 1], i * 4);
    geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rnd, 4));
    geo.instanceCount = count;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uNoise2D: { value: ctx.noise2D } },
      vertexShader: /* glsl */ `
        ${VORTEX_GLSL}
        attribute vec4 aRand;
        uniform float uTime;
        varying vec2 vUv;
        varying float vA;
        varying float vSeed;
        void main() {
          bool top = aRand.w > 0.5;
          float ang = aRand.x * 6.2831853 + uTime * (top ? 0.22 : 0.9) * (0.7 + aRand.y * 0.6);
          float rad = top ? mix(1.0, 1.9, aRand.y) : mix(0.35, 1.05, aRand.y);
          float y = top ? VH * 0.9 + aRand.z * 0.6 : 0.05 + aRand.z * 0.4;
          vec3 c = vec3(cos(ang) * rad, y, sin(ang) * rad);
          c.xz += bend(y / VH, uTime);
          vec4 mv = modelViewMatrix * vec4(c, 1.0);
          float size = top ? mix(0.7, 1.15, aRand.z) : mix(0.5, 0.9, aRand.z);
          float rot = aRand.x * 6.28 + uTime * 0.2 * (aRand.y - 0.5);
          mv.xy += mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * position.xy * size;
          gl_Position = projectionMatrix * mv;
          vUv = position.xy + 0.5;
          vSeed = aRand.x * 7.0 + aRand.y;
          vA = top ? 0.06 : 0.2;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uNoise2D;
        uniform float uTime;
        varying vec2 vUv;
        varying float vA;
        varying float vSeed;
        void main() {
          vec2 c = vUv - 0.5;
          float n = texture2D(uNoise2D, vUv * 0.5 + vSeed + vec2(uTime * 0.01, 0.0)).r;
          float n2 = texture2D(uNoise2D, vUv * 1.1 + vSeed * 1.3).b;
          float puff = smoothstep(0.5, 0.05, length(c) + (n - 0.5) * 0.45 + (n2 - 0.5) * 0.2);
          float a = puff * vA;
          vec3 col = mix(vec3(0.45, 0.55, 0.7), vec3(0.85, 0.93, 1.0), n2);
          gl_FragColor = vec4(col * a, a * 0.6);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.clouds = new THREE.Mesh(geo, mat);
    this.clouds.frustumCulled = false;
    this.clouds.renderOrder = 19;
    this.vortex.add(this.clouds);
  }

  #buildLeaves(ctx) {
    const count = 34;
    const geo = makeLeafGeometry();
    geo.scale(0.16, 0.2, 0.16);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0, side: THREE.DoubleSide });
    this.leaves = new THREE.InstancedMesh(geo, mat, count);
    this.leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const palette = ['#9dbb3a', '#d4a52c', '#c8672a', '#7aa33a', '#e2c15a', '#b5452a'].map((c) => new THREE.Color(c));
    this.leafData = [];
    for (let i = 0; i < count; i++) {
      this.leaves.setColorAt(i, palette[i % palette.length].clone().multiplyScalar(0.8 + this.rand() * 0.3));
      this.leafData.push({
        seed: [this.rand(), this.rand() * 0.8, 0.3 + this.rand() * 0.7, this.rand()],
        spin: new THREE.Vector3(this.rand() * 4 - 2, this.rand() * 4 - 2, this.rand() * 4 - 2),
      });
    }
    this.leaves.castShadow = true;
    this.leaves.frustumCulled = false;
    this.vortex.add(this.leaves);
  }

  update(time) {
    const { _v: v, _m: m, _q: q, _e: e, _s: s } = this;
    this.leafData.forEach((d, i) => {
      const k = vortexPathJS(time, d.seed, v);
      const sc = Math.min(1, k * 8) * Math.min(1, (1 - k) * 6);
      e.set(time * d.spin.x, time * d.spin.y, time * d.spin.z);
      q.setFromEuler(e);
      s.setScalar(Math.max(sc, 0.0001));
      m.compose(v, q, s);
      this.leaves.setMatrixAt(i, m);
    });
    this.leaves.instanceMatrix.needsUpdate = true;
    this.light.intensity = 4.5 + Math.sin(time * 0.9) * 1.0;
  }
}
