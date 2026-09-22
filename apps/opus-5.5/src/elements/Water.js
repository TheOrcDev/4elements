import * as THREE from 'three';
import { patchMaterial } from '../gl/patch.js';
import { simplexGLSL, causticGLSL, worldPosVaryingVertex } from '../gl/glsl.js';
import { mulberry32 } from '../gl/noise.js';
import { createPedestal } from '../world/Platform.js';
import { stationPosition } from '../config.js';

const ORB_Y = 3.05;
const ORB_R = 1.22;
const POOL_Y = 0.99;
const FLOOR_Y = 0.836;
const GRAVITY = 9.8;

function waterMaterial(extra = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: '#eafcff',
    metalness: 0,
    // not lower: mirror-sharp lobes from nearby point lights overflow half-float buffers
    roughness: 0.06,
    transmission: 1,
    thickness: 1.6,
    ior: 1.33,
    attenuationColor: new THREE.Color('#1fa3c4'),
    attenuationDistance: 1.7,
    specularIntensity: 1,
    envMapIntensity: 1.4,
    ...extra,
  });
}

// Displacement shared by the orb's position and its finite-difference normal.
const WOBBLE_GLSL = /* glsl */ `
uniform float uTime;
uniform float uWobble;
${simplexGLSL}
float wob(vec3 d) {
  float t = uTime;
  float w = snoise(d * 0.95 + vec3(0.0, t * 0.32, t * 0.15)) * 0.06;
  w += snoise(d * 1.9 - vec3(t * 0.25, 0.0, t * 0.22)) * 0.018;
  w += sin(d.y * 6.0 + t * 2.0) * 0.004;
  return w * uWobble;
}
`;

// Luminous, non-refractive water for streams and droplets that pass in front of
// the orb (transmissive objects cannot see each other, so these stay transparent).
function glowingWaterMaterial(ctx, key, { vertex = {}, vertexHeader = '', uniforms = {} } = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#0b4a60',
    metalness: 0,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.62,
    envMapIntensity: 2.2,
    depthWrite: false,
  });
  patchMaterial(mat, {
    key,
    uniforms: { uTime: ctx.uniforms.uTime, uNoise3D: { value: ctx.noise3D }, ...uniforms },
    vertexHeader: `varying vec3 vObjPos;\n${vertexHeader}`,
    vertex: {
      ...vertex,
      project_vertex: '#include <project_vertex>\nvObjPos = transformed;',
    },
    fragmentHeader: 'uniform float uTime; uniform sampler3D uNoise3D; varying vec3 vObjPos;',
    fragment: {
      emissivemap_fragment: /* glsl */ `
        {
          float ndv = abs(dot(normalize(vViewPosition), normal));
          float fres = (1.0 - ndv); fres *= fres;
          float n = texture(uNoise3D, vObjPos * 0.9 + vec3(uTime * 0.25, -uTime * 0.1, 0.0)).r;
          float streak = smoothstep(0.55, 0.8, n);
          totalEmissiveRadiance += vec3(0.25, 0.75, 1.0) * (fres * 0.9 + streak * 0.35) + vec3(0.01, 0.07, 0.1);
          diffuseColor.a = clamp(diffuseColor.a + fres * 0.35, 0.0, 1.0);
        }`,
    },
  });
  return mat;
}

export class Water {
  constructor(ctx, def) {
    this.def = def;
    this.ctx = ctx;
    this.group = new THREE.Group();
    this.group.name = 'water';
    stationPosition(def, this.group.position);
    this.rand = mulberry32(404);

    this.pedestal = createPedestal(ctx, def, { basin: true });
    this.group.add(this.pedestal.mesh);

    this.drops = [
      { period: 2.3, offset: 0.0, x: 0.12, z: -0.05 },
      { period: 3.1, offset: 1.1, x: -0.18, z: 0.1 },
      { period: 3.9, offset: 2.3, x: 0.05, z: 0.22 },
      { period: 4.6, offset: 0.7, x: -0.08, z: -0.2 },
    ];
    this.dropUniform = { value: this.drops.map(() => new THREE.Vector4(0, 0, -100, 0)) };

    this.#buildPool(ctx);
    this.#buildOrb(ctx);
    this.#buildRings(ctx);
    this.#buildDroplets(ctx);
    this.#buildBubbles(ctx);

    this.light = new THREE.PointLight(0x39b6ff, 9, 9, 2);
    this.light.position.set(0, ORB_Y - 0.2, 0);
    this.group.add(this.light);

    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 4.8, 16), new THREE.MeshBasicMaterial());
    this.hit.position.y = 2.4;
    this.hit.visible = false;
    this.hit.userData.elementId = def.id;
    this.group.add(this.hit);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._p = new THREE.Vector3();
  }

  #buildPool(ctx) {
    // Basin floor with dancing caustics (opaque, so the transmissive pool refracts it)
    const floorMat = new THREE.MeshStandardMaterial({ color: '#0d2a33', roughness: 0.7, metalness: 0 });
    patchMaterial(floorMat, {
      key: 'basin-floor',
      uniforms: { uTime: ctx.uniforms.uTime, uNoise2D: { value: ctx.noise2D } },
      vertexHeader: 'varying vec3 vWPos; varying vec2 vUv2;',
      vertex: { begin_vertex: `#include <begin_vertex>\nvUv2 = uv;\n${worldPosVaryingVertex}` },
      fragmentHeader: `uniform float uTime; uniform sampler2D uNoise2D; varying vec3 vWPos; varying vec2 vUv2;\n${causticGLSL}`,
      fragment: {
        map_fragment: /* glsl */ `
          vec4 bn = texture(uNoise2D, vUv2 * 1.7);
          diffuseColor.rgb *= 0.7 + 0.6 * bn.r;`,
        emissivemap_fragment: /* glsl */ `
          vec2 cp = vUv2 * 1.6;
          float c1 = causticPattern(cp, uTime * 0.7);
          float c2 = causticPattern(cp * 1.37 + 0.3, uTime * 0.55 + 3.0);
          float edge = smoothstep(0.5, 0.35, length(vUv2 - 0.5));
          totalEmissiveRadiance += vec3(0.25, 0.75, 1.0) * (c1 * 0.55 + c2 * 0.35) * edge * 0.9;
          totalEmissiveRadiance += vec3(0.0, 0.05, 0.08) * edge;`,
      },
    });
    const floorGeo = new THREE.CircleGeometry(1.24, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Water surface with analytic ripples from falling drops
    const poolMat = waterMaterial({
      thickness: 0.25,
      attenuationDistance: 0.45,
      attenuationColor: new THREE.Color('#0e7f99'),
      roughness: 0.07,
      envMapIntensity: 1.2,
    });
    patchMaterial(poolMat, {
      key: 'pool',
      uniforms: { uTime: ctx.uniforms.uTime, uDrops: this.dropUniform, uCenter: { value: new THREE.Vector3() } },
      vertexHeader: 'varying vec3 vWPos;',
      vertex: { begin_vertex: `#include <begin_vertex>\n${worldPosVaryingVertex}` },
      fragmentHeader: /* glsl */ `
        uniform float uTime;
        uniform vec4 uDrops[4];
        uniform vec3 uCenter;
        varying vec3 vWPos;
        float poolHeight(vec2 p) {
          float h = 0.0;
          h += sin(dot(p, vec2(0.8, 0.6)) * 9.0 + uTime * 1.6) * 0.0035;
          h += sin(dot(p, vec2(-0.5, 0.86)) * 11.0 + uTime * 2.1) * 0.0025;
          h += sin(length(p) * 14.0 - uTime * 2.6) * 0.002;
          for (int i = 0; i < 4; i++) {
            vec4 d = uDrops[i];
            float age = uTime - d.z;
            if (age < 0.0 || age > 3.5) continue;
            float r = length(p - d.xy);
            float front = age * 0.55;
            float env = exp(-age * 1.3) * smoothstep(front + 0.04, front - 0.35, r) * exp(-r * 1.2);
            h += sin(r * 42.0 - age * 13.0) * 0.012 * env * d.w;
          }
          return h;
        }`,
      fragment: {
        normal_fragment_maps: /* glsl */ `
          {
            vec2 pp = vWPos.xz - uCenter.xz;
            float e = 0.004;
            float h0 = poolHeight(pp);
            float hx = poolHeight(pp + vec2(e, 0.0));
            float hz = poolHeight(pp + vec2(0.0, e));
            vec3 nW = normalize(vec3(-(hx - h0) / e, 1.0, -(hz - h0) / e));
            normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
          }`,
      },
    });
    this.poolMat = poolMat;
    const poolGeo = new THREE.CircleGeometry(1.27, 96);
    poolGeo.rotateX(-Math.PI / 2);
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.y = POOL_Y;
    this.group.add(pool);
    this.pool = pool;
  }

  #buildOrb(ctx) {
    this.wobble = { value: 1 };
    const mat = waterMaterial({
      dispersion: 0.25,
      attenuationDistance: 2.6,
      attenuationColor: new THREE.Color('#3fbfdc'),
      thickness: 1.9,
    });
    patchMaterial(mat, {
      key: 'water-orb',
      uniforms: { uTime: ctx.uniforms.uTime, uWobble: this.wobble, uNoise3D: { value: ctx.noise3D } },
      vertexHeader: `${WOBBLE_GLSL}\nvarying vec3 vObjPos;`,
      vertex: {
        project_vertex: '#include <project_vertex>\nvObjPos = transformed;',
        beginnormal_vertex: /* glsl */ `
          vec3 _n0 = normalize(position);
          vec3 _t = normalize(abs(_n0.y) > 0.99 ? cross(_n0, vec3(1.0, 0.0, 0.0)) : cross(_n0, vec3(0.0, 1.0, 0.0)));
          vec3 _b = normalize(cross(_n0, _t));
          float _e = 0.01;
          vec3 _p0 = _n0 * (1.0 + wob(_n0));
          vec3 _d1 = normalize(_n0 + _t * _e);
          vec3 _p1 = _d1 * (1.0 + wob(_d1));
          vec3 _d2 = normalize(_n0 + _b * _e);
          vec3 _p2 = _d2 * (1.0 + wob(_d2));
          vec3 objectNormal = normalize(cross(_p1 - _p0, _p2 - _p0));
          if (dot(objectNormal, _n0) < 0.0) objectNormal = -objectNormal;
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`,
        begin_vertex: 'vec3 transformed = _p0;',
      },
      fragmentHeader: 'uniform float uTime; uniform sampler3D uNoise3D; varying vec3 vObjPos;',
      fragment: {
        emissivemap_fragment: /* glsl */ `
          {
            float ndv = abs(dot(normalize(vViewPosition), normal));
            float rim = 1.0 - ndv; rim *= rim;
            // light net: sharp ridges of animated noise read as caustics inside the water
            vec3 q = vObjPos * 0.42;
            float n1 = texture(uNoise3D, q + vec3(0.0, uTime * 0.04, uTime * 0.018)).g;
            float n2 = texture(uNoise3D, q * 1.6 - vec3(uTime * 0.028, 0.0, uTime * 0.035)).r;
            float r1 = 1.0 - abs(n1 * 2.0 - 1.0);
            float r2 = 1.0 - abs(n2 * 2.0 - 1.0);
            r1 *= r1; r1 *= r1; r1 *= r1 * r1;   // ^12: thin bright filaments
            r2 *= r2; r2 *= r2; r2 *= r2 * r2;
            float net = r1 * 0.6 + r2 * 0.4;
            vec3 deep = vec3(0.003, 0.035, 0.06);
            totalEmissiveRadiance += deep * (0.4 + 0.8 * ndv);
            totalEmissiveRadiance += vec3(0.25, 0.75, 1.0) * net * (0.1 + 0.5 * ndv) * 0.26;
            totalEmissiveRadiance += vec3(0.3, 0.75, 1.0) * rim * 0.3;
          }`,
      },
    });
    const geo = new THREE.SphereGeometry(1, 160, 110);
    this.orb = new THREE.Mesh(geo, mat);
    this.orb.scale.setScalar(ORB_R);
    this.orb.position.y = ORB_Y;
    this.group.add(this.orb);
  }

  #buildRings(ctx) {
    this.rings = [];
    const defs = [
      { R: 1.85, tube: 0.065, tilt: new THREE.Euler(1.25, 0.2, 0.35), spin: 0.55, phase: 0 },
      { R: 2.2, tube: 0.05, tilt: new THREE.Euler(1.95, -0.5, -0.4), spin: -0.4, phase: 2.1 },
      { R: 2.6, tube: 0.034, tilt: new THREE.Euler(1.6, 0.9, 0.1), spin: 0.3, phase: 4.2 },
    ];
    for (const d of defs) {
      const mat = glowingWaterMaterial(ctx, `water-ring-${d.phase}`, {
        uniforms: { uR: { value: d.R }, uPhase: { value: d.phase } },
        vertexHeader: 'uniform float uTime; uniform float uR; uniform float uPhase;',
        vertex: {
          beginnormal_vertex: /* glsl */ `
            float _u = atan(position.y, position.x);
            vec3 _c = vec3(cos(_u), sin(_u), 0.0) * uR;
            vec3 _off = position - _c;
            float _flow = _u * 3.0 - uTime * 2.4 + uPhase;
            float _thick = 0.6 + 0.4 * sin(_flow) + 0.25 * sin(_u * 7.0 + uTime * 3.3 + uPhase);
            _thick = max(_thick, 0.0) * smoothstep(-0.9, -0.2, sin(_u * 2.0 - uTime * 0.9 + uPhase * 1.7));
            float _wob = sin(_u * 4.0 + uTime * 1.3 + uPhase) * 0.05;
            vec3 _c2 = _c * (1.0 + _wob) + vec3(0.0, 0.0, sin(_u * 3.0 + uTime * 1.7 + uPhase) * 0.09);
            vec3 objectNormal = normalize(_off);
            #ifdef USE_TANGENT
              vec3 objectTangent = vec3(tangent.xyz);
            #endif`,
          begin_vertex: 'vec3 transformed = _c2 + _off * _thick;',
        },
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(d.R, d.tube, 18, 260), mat);
      const holder = new THREE.Group();
      holder.position.y = ORB_Y;
      holder.rotation.copy(d.tilt);
      holder.add(ring);
      this.group.add(holder);
      this.rings.push({ ring, spin: d.spin });
    }
  }

  #buildDroplets(ctx) {
    const mat = glowingWaterMaterial(ctx, 'water-droplets');
    mat.opacity = 0.75;
    const count = 46;
    this.droplets = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), mat, count);
    this.droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dropletData = [];
    for (let i = 0; i < count; i++) {
      this.dropletData.push({
        a: this.rand() * Math.PI * 2,
        r: 1.75 + this.rand() * 1.0,
        y: (this.rand() - 0.5) * 1.8,
        w: (0.15 + this.rand() * 0.35) * (this.rand() > 0.3 ? 1 : -1),
        s: 0.018 + Math.pow(this.rand(), 2) * 0.06,
        ph: this.rand() * 10,
      });
    }
    this.droplets.frustumCulled = false;
    this.group.add(this.droplets);

    // Drips that fall from the orb into the pool
    this.drips = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), mat, this.drops.length);
    this.drips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.drips.frustumCulled = false;
    this.group.add(this.drips);
  }

  #buildBubbles(ctx) {
    // Opaque, so they land in the transmission buffer and are seen refracted inside the orb.
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 1,
      roughness: 0.35,
      envMapIntensity: 2.5,
      emissive: new THREE.Color('#9fe6ff'),
      emissiveIntensity: 0.9,
    });
    const count = 22;
    this.bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), mat, count);
    this.bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bubbleData = [];
    for (let i = 0; i < count; i++) {
      const a = this.rand() * Math.PI * 2;
      const r = Math.sqrt(this.rand()) * 0.55;
      this.bubbleData.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, speed: 0.12 + this.rand() * 0.22, ph: this.rand(), s: 0.012 + this.rand() * 0.028 });
    }
    this.bubbles.frustumCulled = false;
    this.group.add(this.bubbles);
  }

  update(time, dt) {
    const m = this._m, q = this._q, s = this._s, p = this._p;
    const bob = Math.sin(time * 0.9) * 0.07;
    this.orb.position.y = ORB_Y + bob;
    this.orb.rotation.y = time * 0.12;
    this.light.intensity = 9 + Math.sin(time * 1.3) * 1.2;

    for (const r of this.rings) r.ring.rotation.z = time * r.spin;

    // orbiting droplets
    q.identity();
    this.dropletData.forEach((d, i) => {
      const a = d.a + time * d.w;
      const y = ORB_Y + bob + d.y + Math.sin(time * 0.7 + d.ph) * 0.25;
      const rr = d.r + Math.sin(time * 0.5 + d.ph * 2) * 0.12;
      p.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
      const pulse = 1 + Math.sin(time * 3 + d.ph) * 0.12;
      s.set(d.s * pulse, d.s * (2 - pulse), d.s * pulse);
      m.compose(p, q, s);
      this.droplets.setMatrixAt(i, m);
    });
    this.droplets.instanceMatrix.needsUpdate = true;

    // bubbles rising inside the orb (seen through refraction)
    this.bubbleData.forEach((b, i) => {
      const k = (b.ph + time * b.speed * 0.5) % 1;
      const y = -0.75 + k * 1.5;
      const lim = Math.sqrt(Math.max(0.0, 0.82 - y * y));
      const wob = Math.sin(time * 3 + b.ph * 20) * 0.04;
      p.set(THREE.MathUtils.clamp(b.x + wob, -lim, lim) * ORB_R, ORB_Y + bob + y * ORB_R, THREE.MathUtils.clamp(b.z, -lim, lim) * ORB_R);
      const sc = b.s * Math.sin(Math.PI * 0.5 * Math.min(k * 4, 1)) * (k > 0.92 ? (1 - k) / 0.08 : 1);
      s.setScalar(Math.max(sc, 0.0001));
      m.compose(p, q, s);
      this.bubbles.setMatrixAt(i, m);
    });
    this.bubbles.instanceMatrix.needsUpdate = true;

    // drips + pool ripples
    const orbBottom = ORB_Y + bob - ORB_R * 0.97;
    const fallDist = orbBottom - POOL_Y;
    const fallT = Math.sqrt((2 * fallDist) / GRAVITY);
    this.drops.forEach((d, i) => {
      const ph = (time + d.offset) % d.period;
      const growT = 0.9; // droplet swells under the orb before letting go
      let y = orbBottom, sc = 0;
      if (ph < growT) {
        sc = 0.05 * (ph / growT);
        y = orbBottom - sc * 0.6;
      } else if (ph < growT + fallT) {
        const tf = ph - growT;
        y = orbBottom - 0.5 * GRAVITY * tf * tf;
        sc = 0.05;
      }
      const impact = time - (ph - growT - fallT);
      const u = this.dropUniform.value[i];
      if (ph >= growT + fallT) u.set(d.x, d.z, impact, 1);
      p.set(d.x, y, d.z);
      const stretch = ph > growT ? 1.6 : 1.15;
      s.set(sc, sc * stretch, sc);
      m.compose(p, q, s.x > 0 ? s : s.setScalar(0.0001));
      this.drips.setMatrixAt(i, m);
    });
    this.drips.instanceMatrix.needsUpdate = true;
    const center = this.poolMat.userData.shader?.uniforms.uCenter;
    if (center) this.pool.getWorldPosition(center.value);
  }
}
