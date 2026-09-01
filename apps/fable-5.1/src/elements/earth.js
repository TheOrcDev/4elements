import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise.js';
import { createPedestal } from '../environment.js';

export const EARTH_COLOR = 0x7dff5a;

/**
 * Rock material: PBR standard material with GPU displacement (ridged noise),
 * flat-shaded facets, procedural strata + moss, and pulsing energy cracks.
 * All rocks share one shader program; each gets its own seed / amplitude.
 */
function makeRockMaterial(uTime, seed, amp, crackStrength) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.03,
    flatShading: true,
  });
  const uniforms = {
    uSeed: { value: seed },
    uAmp: { value: amp },
    uCrack: { value: crackStrength },
    uCrackColor: { value: new THREE.Color(EARTH_COLOR) },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, { uTime });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', /* glsl */ `#include <common>
        uniform float uSeed, uAmp;
        varying vec3 vOPos;
        ${noiseGLSL}`)
      .replace('#include <begin_vertex>', /* glsl */ `
        vec3 nrm0 = normalize(position);
        vec3 sp = nrm0 + vec3(uSeed);
        float big = (ridged(sp * 1.0) - 0.5) * 0.65 + fbm(sp * 1.3 + 2.0) * 0.45;
        float mid = fbm(sp * 2.4 + 4.0) * 0.3;
        float fine = snoise(sp * 6.0) * 0.03;
        vec3 transformed = position + nrm0 * ((big + mid + fine) * uAmp);
        vOPos = transformed;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */ `#include <common>
        uniform float uTime, uSeed, uCrack;
        uniform vec3 uCrackColor;
        varying vec3 vOPos;
        float gMoss = 0.0;
        ${noiseGLSL}`)
      .replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
        {
          vec3 sp = vOPos + vec3(uSeed * 3.0);
          float strata = fbm(sp * 2.2 + vec3(0.0, sp.y * 1.5, 0.0));
          vec3 rockA = vec3(0.42, 0.37, 0.31);
          vec3 rockB = vec3(0.17, 0.155, 0.145);
          vec3 rockC = vec3(0.30, 0.24, 0.18);
          vec3 rock = mix(rockB, rockA, smoothstep(-0.45, 0.5, strata));
          rock = mix(rock, rockC, smoothstep(0.2, 0.6, fbm(sp * 5.0 + 9.0)));
          // upward-facing faces collect moss
          vec3 dx = dFdx(vOPos); vec3 dy = dFdy(vOPos);
          vec3 fn = normalize(cross(dx, dy));
          float up = smoothstep(0.45, 0.9, fn.y);
          gMoss = up * smoothstep(0.15, 0.55, fbm(sp * 2.8 + 21.0));
          vec3 moss = mix(vec3(0.12, 0.30, 0.08), vec3(0.28, 0.48, 0.12), smoothstep(-0.3, 0.5, snoise(sp * 12.0)));
          diffuseColor.rgb = mix(rock, moss, gMoss);
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
        {
          vec3 sp = vOPos + vec3(uSeed * 7.0);
          float c1 = abs(snoise(sp * 1.25));
          float c2 = abs(snoise(sp * 2.4 + 3.0));
          float crack = 1.0 - smoothstep(0.0, 0.022, c1);
          crack = max(crack, (1.0 - smoothstep(0.0, 0.014, c2)) * 0.5);
          float pulse = 0.6 + 0.4 * sin(uTime * 1.6 + sp.y * 2.5 + snoise(sp * 0.8) * 3.0);
          crack *= (1.0 - gMoss * 0.85) * uCrack * pulse;
          totalEmissiveRadiance += uCrackColor * crack * 2.8;
        }`);
  };
  return mat;
}

/**
 * Earth: a massive floating boulder with glowing cracks, orbiting shards, a hovering
 * ring of stones, drifting dust and cracks of energy on the pedestal.
 */
export function createEarth({ position }) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.add(createPedestal(EARTH_COLOR));

  const uTime = { value: 0 };
  const uPixelRatio = { value: Math.min(window.devicePixelRatio, 1.5) };

  // ---------------------------------------------------------------- boulder
  const BOULDER_Y = 2.45;
  const boulderGeo = new THREE.IcosahedronGeometry(1.05, 56);
  const boulder = new THREE.Mesh(boulderGeo, makeRockMaterial(uTime, 0.37, 0.5, 1.0));
  boulder.position.y = BOULDER_Y;
  boulder.frustumCulled = false;
  group.add(boulder);

  // ---------------------------------------------------------------- orbiting shards
  const shards = [];
  for (let i = 0; i < 9; i++) {
    const size = 0.14 + Math.random() * 0.22;
    const geo = new THREE.IcosahedronGeometry(size, 16);
    const mesh = new THREE.Mesh(geo, makeRockMaterial(uTime, Math.random() * 10, size * 0.7, 0.2));
    mesh.frustumCulled = false;
    const s = {
      mesh,
      a: Math.random() * Math.PI * 2,
      r: 1.75 + Math.random() * 0.9,
      y: BOULDER_Y + (Math.random() - 0.5) * 1.6,
      incl: (Math.random() - 0.5) * 0.9,
      speed: (0.25 + Math.random() * 0.35) * (Math.random() < 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.6),
    };
    shards.push(s);
    group.add(mesh);
  }

  // ---------------------------------------------------------------- hovering ring of stones
  const ringStones = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.95, metalness: 0.02, flatShading: true });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.07, 0), stoneMat);
    m.position.set(Math.cos(a) * 1.45, 0.95 + Math.sin(a * 3) * 0.05, Math.sin(a) * 1.45);
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    ringStones.add(m);
  }
  group.add(ringStones);

  // ---------------------------------------------------------------- energy cracks on the pedestal top
  const crackGeo = new THREE.CircleGeometry(1.7, 96);
  crackGeo.rotateX(-Math.PI / 2);
  const crackMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uColor: { value: new THREE.Color(EARTH_COLOR) } },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime; uniform vec3 uColor;
      varying vec3 vPos;
      void main() {
        float r = length(vPos.xz);
        float c1 = abs(snoise(vec3(vPos.xz * 1.7, 0.5)));
        float c2 = abs(snoise(vec3(vPos.xz * 3.4 + 5.0, 1.5)));
        float crack = 1.0 - smoothstep(0.0, 0.045, c1);
        crack = max(crack, (1.0 - smoothstep(0.0, 0.03, c2)) * 0.6);
        float pulse = 0.55 + 0.45 * sin(uTime * 2.2 - r * 3.5);
        float fade = 1.0 - smoothstep(0.7, 1.68, r);
        float a = crack * pulse * fade;
        gl_FragColor = vec4(uColor * a * 1.6, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const cracks = new THREE.Mesh(crackGeo, crackMat);
  cracks.position.y = 0.626;
  group.add(cracks);

  // ---------------------------------------------------------------- drifting dust & pebbles
  const DUST = 600;
  const seeds = new Float32Array(DUST * 4);
  for (let i = 0; i < DUST; i++) {
    seeds[i * 4] = Math.random() * Math.PI * 2;
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = 0.5 + Math.random() * 0.8;
    seeds[i * 4 + 3] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DUST * 3), 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uPixelRatio },
    vertexShader: /* glsl */ `
      ${noiseGLSL}
      attribute vec4 aSeed;
      uniform float uTime, uPixelRatio;
      varying float vLife;
      varying float vKind;
      void main() {
        float life = fract(aSeed.w + uTime * 0.07 * aSeed.z);
        float y = 0.65 + life * 3.6;
        float ang = aSeed.x + uTime * 0.18 + life * 0.6;
        float rad = 0.5 + aSeed.y * 1.6;
        vec3 p = vec3(cos(ang) * rad, y, sin(ang) * rad);
        p += snoise3(vec3(aSeed.x * 4.0, aSeed.y * 4.0, uTime * 0.25 + life)) * 0.25;
        vLife = life;
        vKind = step(0.93, aSeed.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = mix(0.9 + 1.4 * fract(aSeed.z * 5.1), 3.2, vKind);
        gl_PointSize = size * uPixelRatio * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vLife;
      varying float vKind;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.15, d);
        a *= smoothstep(0.0, 0.12, vLife) * (1.0 - smoothstep(0.7, 1.0, vLife));
        vec3 col = mix(vec3(0.55, 0.45, 0.3), vec3(0.45, 0.9, 0.35), vKind * 0.4 + 0.2);
        a *= mix(0.45, 0.9, vKind);
        gl_FragColor = vec4(col * a, a);
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

  // ---------------------------------------------------------------- light
  const light = new THREE.PointLight(EARTH_COLOR, 14, 15, 2);
  light.position.set(0, 1.1, 0);
  group.add(light);
  const key = new THREE.PointLight(0xfff1dc, 30, 20, 2);
  key.position.set(2.8, 5.0, 3.4);
  group.add(key);

  const tmpEuler = new THREE.Euler();
  function update(t, dt) {
    uTime.value = t;
    boulder.rotation.y = t * 0.18;
    boulder.rotation.x = Math.sin(t * 0.35) * 0.12;
    boulder.rotation.z = Math.cos(t * 0.28) * 0.1;
    boulder.position.y = BOULDER_Y + Math.sin(t * 0.8) * 0.1;
    ringStones.rotation.y = -t * 0.25;
    for (const s of shards) {
      s.a += dt * s.speed;
      const x = Math.cos(s.a) * s.r;
      const z = Math.sin(s.a) * s.r;
      const bob = Math.sin(t * 0.9 + s.phase) * 0.18;
      s.mesh.position.set(x, s.y + bob + z * Math.sin(s.incl), z * Math.cos(s.incl));
      s.mesh.rotation.x += dt * s.spin.x;
      s.mesh.rotation.y += dt * s.spin.y;
      s.mesh.rotation.z += dt * s.spin.z;
    }
    light.intensity = 13 + Math.sin(t * 1.6) * 3;
  }

  return {
    name: 'earth',
    color: EARTH_COLOR,
    group,
    update,
    focus: { target: new THREE.Vector3(position.x, 2.2, position.z) },
  };
}
