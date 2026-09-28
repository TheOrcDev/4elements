import * as THREE from 'three';
import { ELEMENT_LIST, MOON_DIR, PLAZA_RADIUS } from '../config.js';
import { createFloorTextures } from '../utils/canvasTextures.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, TAU } from '../utils/rng.js';

/**
 * The stage: lights, plaza floor, rim, distant ground and the central "nexus"
 * where all four elements meet.
 */
export function createArena(ctx) {
  const { renderer, time, softSprite } = ctx;
  const group = new THREE.Group();
  group.name = 'arena';

  // ---------------------------------------------------------------- lights
  const moon = new THREE.DirectionalLight(0xa8c2ff, 2.3);
  moon.position.copy(MOON_DIR).multiplyScalar(70);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 20, far: 150 });
  moon.shadow.bias = -0.0004;
  moon.shadow.normalBias = 0.05;
  moon.shadow.radius = 3.5;
  group.add(moon);

  const hemi = new THREE.HemisphereLight(0x6f8be0, 0x1a1030, 0.42);
  group.add(hemi);

  const fill = new THREE.DirectionalLight(0x7a5cff, 0.35);
  fill.position.set(18, 12, 26);
  group.add(fill);

  // ---------------------------------------------------------------- ground
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  const outer = new THREE.Mesh(
    new THREE.CircleGeometry(600, 96),
    new THREE.MeshStandardMaterial({ color: 0x06080f, roughness: 0.92, metalness: 0.0 }),
  );
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -0.08;
  outer.receiveShadow = true;
  group.add(outer);

  const { map, emissiveMap } = createFloorTextures({ size: 2048, worldSize: PLAZA_RADIUS * 2 });
  map.anisotropy = emissiveMap.anisotropy = anisotropy;
  // Physical material so the specular response can be dialled down: a polished floor should
  // gleam softly under the moon, not mirror it like a lake.
  const floorMat = new THREE.MeshPhysicalMaterial({
    map,
    emissiveMap,
    emissive: new THREE.Color(1, 1, 1),
    emissiveIntensity: 1.7,
    roughness: 0.44,
    metalness: 0.2,
    specularIntensity: 0.55,
    envMapIntensity: 0.9,
  });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA_RADIUS, 160), floorMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.receiveShadow = true;
  group.add(plaza);

  // Raised stone rim around the plaza
  const rimProfile = [
    [PLAZA_RADIUS - 0.05, 0],
    [PLAZA_RADIUS - 0.05, 0.3],
    [PLAZA_RADIUS + 0.12, 0.42],
    [PLAZA_RADIUS + 0.5, 0.42],
    [PLAZA_RADIUS + 0.72, 0.3],
    [PLAZA_RADIUS + 1.3, 0.12],
    [PLAZA_RADIUS + 1.7, -0.02],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const rim = new THREE.Mesh(
    new THREE.LatheGeometry(rimProfile, 160),
    new THREE.MeshStandardMaterial({ color: 0x141a2e, roughness: 0.55, metalness: 0.25 }),
  );
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);
  const rimGlow = new THREE.Mesh(
    new THREE.TorusGeometry(PLAZA_RADIUS + 0.31, 0.022, 8, 220),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.5, 1.8) }),
  );
  rimGlow.rotation.x = Math.PI / 2;
  rimGlow.position.y = 0.43;
  group.add(rimGlow);

  // Standing obelisks around the rim: tapered, capped with a pyramid, each with a glowing rune band
  {
    const rng = mulberry32(31);
    const count = 24;
    const body = new THREE.CylinderGeometry(0.62, 1.0, 1, 4, 1, true);
    body.rotateY(Math.PI / 4);
    const cap = new THREE.ConeGeometry(0.62 * Math.SQRT2 * 0.5 * Math.SQRT2, 0.3, 4, 1);
    cap.rotateY(Math.PI / 4);
    cap.translate(0, 0.65, 0);
    const bodyT = body.clone();
    bodyT.translate(0, 0, 0);
    const parts = [bodyT, cap].map((g) => {
      g.deleteAttribute('uv');
      return g.index ? g.toNonIndexed() : g;
    });
    const geo = mergeGeometries(parts);
    geo.translate(0, 0.5, 0);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x10152a, roughness: 0.5, metalness: 0.3, flatShading: true, side: THREE.DoubleSide });
    const stones = new THREE.InstancedMesh(geo, mat, count);
    const runeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.55, 1.5) });
    const runes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 1, 0.05), runeMat, count * 2);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const sc = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + (rng() - 0.5) * 0.05;
      const r = PLAZA_RADIUS + 2.4 + rng() * 0.6;
      const h = 2.0 + rng() * 3.2 + (i % 3 === 0 ? 2.2 : 0);
      const w = 1.0 + rng() * 0.5;
      const yaw = -a + (rng() - 0.5) * 0.25;
      e.set((rng() - 0.5) * 0.1, yaw, (rng() - 0.5) * 0.1);
      q.setFromEuler(e);
      pos.set(Math.cos(a) * r, -0.1, Math.sin(a) * r);
      sc.set(w * 0.62, h, w * 0.62);
      m.compose(pos, q, sc);
      stones.setMatrixAt(i, m);
      // two glowing rune slits on the plaza-facing side
      for (let k = 0; k < 2; k++) {
        const rh = h * (k === 0 ? 0.36 : 0.16);
        const inward = new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a));
        const p2 = new THREE.Vector3(Math.cos(a) * r, -0.1 + h * (k === 0 ? 0.52 : 0.3), Math.sin(a) * r).addScaledVector(inward, w * 0.31 + 0.05);
        e.set(0, -a + Math.PI / 2, 0);
        q.setFromEuler(e);
        sc.set(1, rh, 1);
        m.compose(p2, q, sc);
        runes.setMatrixAt(i * 2 + k, m);
      }
    }
    stones.castShadow = true;
    stones.receiveShadow = true;
    group.add(stones);
    group.add(runes);
  }

  // ---------------------------------------------------------------- nexus
  const nexus = new THREE.Group();
  nexus.name = 'nexus';
  group.add(nexus);

  const daisProfile = [
    [0, 0],
    [2.75, 0],
    [2.75, 0.14],
    [2.55, 0.24],
    [2.2, 0.26],
    [0, 0.26],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const dais = new THREE.Mesh(
    new THREE.LatheGeometry(daisProfile, 96),
    new THREE.MeshStandardMaterial({ color: 0x1a2038, roughness: 0.3, metalness: 0.5 }),
  );
  dais.castShadow = true;
  dais.receiveShadow = true;
  nexus.add(dais);

  // Quintessence crystal: four-colour gradient shader gem with a glass shell
  const gemMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uC0: { value: ELEMENT_LIST[0].colorLinear.clone().multiplyScalar(1.0) },
      uC1: { value: ELEMENT_LIST[1].colorLinear.clone().multiplyScalar(1.0) },
      uC2: { value: ELEMENT_LIST[2].colorLinear.clone().multiplyScalar(1.0) },
      uC3: { value: ELEMENT_LIST[3].colorLinear.clone().multiplyScalar(1.0) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vLocal;
      varying vec3 vView;
      void main() {
        vLocal = position;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
      varying vec3 vN;
      varying vec3 vLocal;
      varying vec3 vView;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(vView);
        float fres = pow(max(1.0 - abs(dot(n, v)), 0.0), 2.2);
        float a = atan(vLocal.z, vLocal.x) + uTime * 0.6;
        float k = a / 6.28318 * 4.0;
        vec3 c = mix(uC0, uC1, smoothstep(0.0, 1.0, fract(k)));
        float seg = floor(mod(k, 4.0));
        c = seg < 0.5 ? mix(uC0, uC1, fract(k)) : seg < 1.5 ? mix(uC1, uC2, fract(k)) : seg < 2.5 ? mix(uC2, uC3, fract(k)) : mix(uC3, uC0, fract(k));
        float band = 0.5 + 0.5 * sin(vLocal.y * 5.0 - uTime * 2.0);
        vec3 col = c * (0.45 + 0.9 * band) + vec3(1.0) * fres * 0.8;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const gemGeo = new THREE.OctahedronGeometry(0.8, 0);
  gemGeo.scale(1, 1.55, 1);
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.y = 3.0;
  nexus.add(gem);

  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    thickness: 0.7,
    roughness: 0.02,
    ior: 1.7,
    iridescence: 1,
    iridescenceIOR: 1.5,
    dispersion: 0.4,
    envMapIntensity: 0.9,
    transparent: false,
  });
  const shellGeo = gemGeo.clone();
  shellGeo.scale(1.35, 1.35, 1.35);
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.position.copy(gem.position);
  shell.material.depthWrite = false;
  nexus.add(shell);

  // four tiny orbiting motes, one per element
  const motes = ELEMENT_LIST.map((el, i) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 12),
      new THREE.MeshBasicMaterial({ color: el.colorLinear.clone().multiplyScalar(4.0) }),
    );
    nexus.add(m);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: softSprite, color: el.colorLinear.clone().multiplyScalar(1.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
    );
    halo.scale.setScalar(0.8);
    m.add(halo);
    return m;
  });

  // faint vertical beam
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: time, uFade: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uFade;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        float f = pow(abs(dot(normalize(vN), normalize(vView))), 1.4);
        float fade = pow(max(1.0 - vUv.y, 0.0), 1.8) * smoothstep(0.0, 0.03, vUv.y);
        float flow = 0.75 + 0.25 * sin(vUv.y * 40.0 - uTime * 3.0);
        vec3 col = vec3(0.62, 0.55, 1.0) * f * fade * flow * 0.28 * uFade;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.42, 34, 32, 1, true), beamMat);
  beam.position.y = 17 + 0.26;
  nexus.add(beam);
  const nexusLight = new THREE.PointLight(0xb9a6ff, 14, 22, 2);
  nexusLight.position.set(0, 3.2, 0);
  nexus.add(nexusLight);

  // ---------------------------------------------------------------- ambient dust
  {
    const rng = mulberry32(555);
    const N = 380;
    const p = new Float32Array(N * 3);
    const s = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const a = rng() * TAU;
      const r = Math.sqrt(rng()) * (PLAZA_RADIUS + 4);
      p[i * 3] = Math.cos(a) * r;
      p[i * 3 + 1] = 0.3 + rng() * 13;
      p[i * 3 + 2] = Math.sin(a) * r;
      s[i * 2] = 0.6 + rng() * 1.6;
      s[i * 2 + 1] = rng() * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(s, 2));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uScale: ctx.pointScale },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec2 aS;
        uniform float uTime;
        uniform float uScale;
        varying float vA;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.11 + aS.y) * 1.6;
          p.y += sin(uTime * 0.17 + aS.y * 1.7) * 0.9;
          p.z += cos(uTime * 0.13 + aS.y * 0.7) * 1.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aS.x * 0.045 * uScale / -mv.z;
          vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 0.8 + aS.y * 3.0));
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.0, d);
          gl_FragColor = vec4(vec3(0.55, 0.7, 1.0) * 1.1, a * a * vA * 0.7);
        }
      `,
    });
    const dust = new THREE.Points(g, m);
    dust.frustumCulled = false;
    group.add(dust);
  }

  // ---------------------------------------------------------------- update
  const nexusPos = new THREE.Vector3(0, 3.0, 0);
  function update(t, dt, camera) {
    // The nexus quietly steps aside when the camera is near it, so close-ups of the shrines stay clean.
    let k = 1;
    if (camera) k = THREE.MathUtils.smoothstep(camera.position.distanceTo(nexusPos), 6, 16);
    const gemScale = 0.2 + 0.8 * k;
    gem.rotation.y = t * 0.5;
    shell.rotation.y = -t * 0.35;
    gem.position.y = shell.position.y = 3.0 + Math.sin(t * 0.9) * 0.14;
    gem.scale.setScalar(gemScale);
    shell.scale.setScalar(gemScale);
    shell.visible = k > 0.06;
    beamMat.uniforms.uFade.value = k;
    motes.forEach((m, i) => {
      const a = t * 0.7 + (i / motes.length) * TAU;
      m.position.set(Math.cos(a) * 1.75 * gemScale, gem.position.y + Math.sin(t * 1.3 + i * 1.7) * 0.35, Math.sin(a) * 1.75 * gemScale);
      m.scale.setScalar(0.25 + 0.75 * k);
    });
    nexusLight.intensity = (13 + Math.sin(t * 2.1) * 2.5) * (0.3 + 0.7 * k);
  }

  return { group, update, moon, floorMat };
}
