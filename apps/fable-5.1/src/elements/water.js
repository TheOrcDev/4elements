import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise.js';
import { createPedestal } from '../environment.js';

export const WATER_COLOR = 0x3aa6ff;

/**
 * Water: a levitating refractive orb with an undulating surface, two helical
 * water streams, a rippling pool, droplets drawn up into the orb and caustics.
 */
export function createWater({ position, envMap }) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.add(createPedestal(WATER_COLOR));

  const uTime = { value: 0 };
  const uPixelRatio = { value: Math.min(window.devicePixelRatio, 1.5) };

  // ---------------------------------------------------------------- orb
  const ORB_Y = 2.35;
  const orbGeo = new THREE.SphereGeometry(1.12, 192, 128);
  const orbMat = new THREE.MeshPhysicalMaterial({
    color: 0xd6ecff,
    roughness: 0.28,
    metalness: 0.0,
    transmission: 1.0,
    ior: 1.2,
    thickness: 1.0,
    attenuationColor: new THREE.Color(0x2a8cf0),
    attenuationDistance: 1.1,
    envMap,
    envMapIntensity: 1.5,
    specularIntensity: 1.0,
  });
  orbMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        uniform float uTime;
        ${noiseGLSL}
        vec3 displaceOrb(vec3 p) {
          vec3 n = normalize(p);
          vec3 q = n * 1.5 + vec3(0.0, uTime * 0.45, uTime * 0.3);
          float d = (snoise(q) * 0.65 + snoise(q * 2.0 + 5.0) * 0.28) * 0.16;
          return p + n * d;
        }`
      )
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        vec3 nrm0 = normalize(position);
        vec3 tA = normalize(cross(nrm0, abs(nrm0.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 tB = normalize(cross(nrm0, tA));
        float eps = 0.02;
        vec3 dp0 = displaceOrb(position);
        vec3 dpA = displaceOrb(position + tA * eps);
        vec3 dpB = displaceOrb(position + tB * eps);
        vec3 objectNormal = normalize(cross(dpA - dp0, dpB - dp0));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif`
      )
      .replace('#include <begin_vertex>', /* glsl */ `vec3 transformed = dp0;`);
  };
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.y = ORB_Y;
  orb.frustumCulled = false;
  group.add(orb);

  // inner glow: fresnel-lit core so the orb reads as luminous water, not dark glass
  const coreMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uColor: { value: new THREE.Color(0x2f9cff) } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vPos;
      void main() {
        vPos = position;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime; uniform vec3 uColor;
      varying vec3 vN; varying vec3 vV; varying vec3 vPos;
      void main() {
        float fres = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.2);
        float swirl = 0.5 + 0.5 * fbm(vPos * 2.2 + vec3(uTime * 0.4, -uTime * 0.6, 0.0));
        float a = (0.55 + fres * 1.3) * (0.5 + 0.5 * swirl);
        vec3 col = mix(uColor, vec3(0.75, 0.95, 1.0), fres * 0.6);
        gl_FragColor = vec4(col * a * 2.1, a);
      }`,
    transparent: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.9, 64, 48), coreMat);
  core.position.y = ORB_Y;
  core.renderOrder = -5;
  group.add(core);

  // ---------------------------------------------------------------- helical streams
  const streamMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfe4ff,
    roughness: 0.06,
    metalness: 0.0,
    transmission: 0.95,
    ior: 1.33,
    thickness: 0.6,
    attenuationColor: new THREE.Color(0x2a86e8),
    attenuationDistance: 0.8,
    envMap,
    envMapIntensity: 1.6,
  });
  streamMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', /* glsl */ `#include <common>
        uniform float uTime;
        ${noiseGLSL}`)
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `vec3 transformed = position + normal * (snoise(position * 4.0 + vec3(0.0, -uTime * 2.5, 0.0)) * 0.035);`
      );
  };
  const streams = new THREE.Group();
  const makeHelix = (phase) => {
    const pts = [];
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const ang = phase + t * Math.PI * 2 * 2.2;
      const r = 0.35 + 1.45 * Math.sin(Math.PI * t);
      pts.push(new THREE.Vector3(Math.cos(ang) * r, 0.72 + t * 3.15, Math.sin(ang) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 260, 0.075, 12, false);
    const mesh = new THREE.Mesh(geo, streamMat);
    mesh.frustumCulled = false;
    return mesh;
  };
  streams.add(makeHelix(0), makeHelix(Math.PI));
  group.add(streams);

  // ---------------------------------------------------------------- pool
  const poolGeo = new THREE.CircleGeometry(1.62, 160);
  poolGeo.rotateX(-Math.PI / 2);
  const poolMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a72c2,
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.55,
    thickness: 0.6,
    ior: 1.33,
    attenuationColor: new THREE.Color(0x0d3f7a),
    attenuationDistance: 0.6,
    envMap,
    envMapIntensity: 1.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });
  poolMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', /* glsl */ `#include <common>
        uniform float uTime;
        ${noiseGLSL}
        float waveH(vec2 xz) {
          float r = length(xz);
          float w = sin(r * 14.0 - uTime * 3.4) * 0.02 * exp(-r * 0.8)
                  + sin(r * 27.0 - uTime * 5.2) * 0.006
                  + fbm(vec3(xz * 2.6, uTime * 0.7)) * 0.022;
          w *= smoothstep(1.62, 1.25, r);
          return w;
        }`)
      .replace('#include <beginnormal_vertex>', /* glsl */ `
        float e = 0.03;
        float hC = waveH(position.xz);
        float hX = waveH(position.xz + vec2(e, 0.0));
        float hZ = waveH(position.xz + vec2(0.0, e));
        vec3 objectNormal = normalize(vec3(hC - hX, e, hC - hZ));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif`)
      .replace('#include <begin_vertex>', /* glsl */ `vec3 transformed = vec3(position.x, position.y + hC, position.z);`);
  };
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.position.y = 0.6;
  group.add(pool);

  // ---------------------------------------------------------------- droplets rising into the orb
  const DROPS = 500;
  const seeds = new Float32Array(DROPS * 4);
  for (let i = 0; i < DROPS; i++) {
    seeds[i * 4] = Math.random() * Math.PI * 2;
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = 0.6 + Math.random() * 0.8;
    seeds[i * 4 + 3] = Math.random();
  }
  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROPS * 3), 3));
  dropGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const dropMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uPixelRatio, uOrbY: { value: ORB_Y } },
    vertexShader: /* glsl */ `
      ${noiseGLSL}
      attribute vec4 aSeed;
      uniform float uTime, uPixelRatio, uOrbY;
      varying float vLife;
      void main() {
        float life = fract(aSeed.w + uTime * 0.14 * aSeed.z);
        float ease = life * life * (3.0 - 2.0 * life);
        float y = 0.62 + ease * (uOrbY - 0.62);
        float ang = aSeed.x + life * 3.0 + uTime * 0.5;
        float rad = mix(0.45 + aSeed.y * 1.1, 0.15, ease);
        vec3 p = vec3(cos(ang) * rad, y, sin(ang) * rad);
        p += snoise3(vec3(aSeed.x * 5.0, aSeed.y * 5.0, life * 2.0 + uTime * 0.3)) * 0.12;
        vLife = life;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = (1.2 + 2.4 * aSeed.y) * (1.0 - ease * 0.5);
        gl_PointSize = size * uPixelRatio * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vLife;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.2, d);
        float hi = smoothstep(0.22, 0.0, length(c + vec2(0.12, 0.12)));
        a *= smoothstep(0.0, 0.1, vLife) * (1.0 - smoothstep(0.85, 1.0, vLife));
        vec3 col = mix(vec3(0.35, 0.7, 1.0), vec3(0.9, 0.97, 1.0), hi);
        gl_FragColor = vec4(col * a * 1.4, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const drops = new THREE.Points(dropGeo, dropMat);
  drops.frustumCulled = false;
  drops.renderOrder = 21;
  group.add(drops);

  // ---------------------------------------------------------------- caustics on the floor
  const causticGeo = new THREE.RingGeometry(2.75, 5.2, 96, 1);
  causticGeo.rotateX(-Math.PI / 2);
  const causticMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uColor: { value: new THREE.Color(0x4fb4ff) } },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime; uniform vec3 uColor;
      varying vec3 vPos;
      void main() {
        float r = length(vPos.xz);
        float fade = smoothstep(2.75, 3.1, r) * (1.0 - smoothstep(3.6, 5.2, r));
        vec3 q = vec3(vPos.xz * 1.5, uTime * 0.4);
        float c1 = 1.0 - abs(snoise(q));
        float c2 = 1.0 - abs(snoise(q * 1.8 + vec3(7.0, 3.0, uTime * 0.25)));
        float caustic = pow(c1 * c2, 5.0) * 2.2;
        float a = caustic * fade * 0.3;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const caustics = new THREE.Mesh(causticGeo, causticMat);
  caustics.position.y = 0.012;
  group.add(caustics);

  // ---------------------------------------------------------------- light
  const light = new THREE.PointLight(WATER_COLOR, 22, 16, 2);
  light.position.set(0, ORB_Y + 1.9, 0);
  group.add(light);
  const key = new THREE.PointLight(0xfff1dc, 26, 18, 2);
  key.position.set(2.6, 4.6, 3.2);
  group.add(key);

  function update(t) {
    uTime.value = t;
    streams.rotation.y = t * 0.7;
    orb.rotation.y = t * 0.15;
    orb.position.y = ORB_Y + Math.sin(t * 0.9) * 0.08;
    core.position.y = orb.position.y;
    light.intensity = 20 + Math.sin(t * 2.3) * 3;
  }

  return {
    name: 'water',
    color: WATER_COLOR,
    group,
    update,
    focus: { target: new THREE.Vector3(position.x, 2.1, position.z) },
  };
}
