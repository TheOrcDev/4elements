import * as THREE from 'three';
import { NOISE_GLSL } from './shaders.js';

/* ---------------------------------------------------------------- helpers */

function radialGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.38)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.10)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const glowTex = radialGlowTexture();

function makeGlow(color, scale = 4.2, opacity = 0.75) {
  const mat = new THREE.SpriteMaterial({
    map: glowTex, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(scale);
  sprite.raycast = () => {};
  return sprite;
}

function makeLabel(text, color) {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 140;
  const ctx = c.getContext('2d');
  ctx.font = '700 58px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '16px'; } catch (e) { /* older canvas */ }
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  ctx.fillText(text.toUpperCase(), 320, 72);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.95 }));
  sprite.scale.set(2.3, 0.5, 1);
  sprite.position.y = 1.78;
  sprite.raycast = () => {};
  return sprite;
}

function makePedestal(accent, label, labelColor) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x12141f, roughness: 0.35, metalness: 0.65 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.3, 0.3, 56), stone);
  base.position.y = -1.38;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  const trim = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.07, 56),
    new THREE.MeshStandardMaterial({ color: 0x1c2030, roughness: 0.25, metalness: 0.8 }));
  trim.position.y = -1.26;
  group.add(trim);

  const ringMat = new THREE.MeshBasicMaterial({ color: accent });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.022, 10, 90), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.21;
  group.add(ring);

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 48),
    new THREE.MeshBasicMaterial({ map: glowTex, color: accent, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -1.5;
  group.add(halo);

  group.add(makeLabel(label, labelColor));
  group.userData.ringMat = ringMat;
  return group;
}

/** Generic swirling GPU point cloud — particles orbit the Y axis of their group. */
function makeSwirlPoints({ count, colorA, colorB, size = 90, opacity = 0.9, place }) {
  const positions = new Float32Array(count * 3);
  const rand = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    place(v, i);
    positions.set([v.x, v.y, v.z], i * 3);
    rand.set([Math.random(), Math.random(), Math.random()], i * 3);
    scale[i] = 0.45 + Math.random() * 1.1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: size },
    uOpacity: { value: opacity },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aRand;
      attribute float aScale;
      uniform float uTime;
      uniform float uSize;
      varying vec3 vRand;
      varying float vTwinkle;
      void main() {
        vRand = aRand;
        vec3 p = position;
        float ang = uTime * (0.25 + aRand.x * 0.65) * (aRand.z > 0.5 ? 1.0 : -0.7);
        float ca = cos(ang), sa = sin(ang);
        p.xz = mat2(ca, -sa, sa, ca) * p.xz;
        p.y += sin(uTime * (0.7 + aRand.y) + aRand.z * 6.2831) * 0.07;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vTwinkle = 0.65 + 0.35 * sin(uTime * (1.5 + aRand.y * 3.0) + aRand.x * 40.0);
        gl_PointSize = uSize * aScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uOpacity;
      varying vec3 vRand;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.05, d) * uOpacity * vTwinkle;
        vec3 col = mix(uColorA, uColorB, vRand.y);
        gl_FragColor = vec4(col, alpha);
      }`
  });
  const points = new THREE.Points(geo, mat);
  points.raycast = () => {};
  points.frustumCulled = false;
  return { points, uniforms };
}

const randDir = () => new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

/* ------------------------------------------------------------------- FIRE */

export function createFire() {
  const group = new THREE.Group();
  const uniformsList = [];

  group.add(makePedestal(0xff6a00, 'Fire', '#ffb37a'));

  // Noise-displaced living flame ball
  const fireUniforms = { uTime: { value: 0 } };
  uniformsList.push(fireUniforms);
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 72, 72),
    new THREE.ShaderMaterial({
      uniforms: fireUniforms,
      vertexShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec3 vDir;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vNoise;
        void main() {
          vDir = normalize(position);
          float n = snoise(vDir * 2.4 + vec3(0.0, -uTime * 0.6, 0.0));
          float n2 = snoise(vDir * 5.5 + vec3(0.0, -uTime * 1.3, 3.7)) * 0.35;
          vNoise = n + n2;
          vec3 displaced = position + normal * (vNoise * 0.20);
          displaced.y += max(0.0, vDir.y) * 0.16 * (0.6 + 0.4 * sin(uTime * 2.2));
          vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec3 vDir;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vNoise;
        void main() {
          float f = fbm(vDir * 3.0 + vec3(0.0, -uTime * 0.9, 0.0)) * 0.5 + 0.5;
          float heat = clamp(f * 0.85 + vNoise * 0.45 + 0.25 - vDir.y * 0.22, 0.0, 1.0);
          vec3 col = mix(vec3(0.25, 0.01, 0.0), vec3(0.85, 0.08, 0.0), smoothstep(0.05, 0.45, heat));
          col = mix(col, vec3(1.0, 0.38, 0.02), smoothstep(0.42, 0.68, heat));
          col = mix(col, vec3(1.0, 0.83, 0.25), smoothstep(0.66, 0.88, heat));
          col = mix(col, vec3(1.0, 0.99, 0.85), smoothstep(0.88, 1.0, heat));
          float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
          col += vec3(1.0, 0.35, 0.05) * fres * 1.4;
          gl_FragColor = vec4(col * 1.5, 1.0);
        }`
    })
  );
  group.add(core);

  // Rising flame particles (GPU lifecycle)
  const COUNT = 900;
  const pos = new Float32Array(COUNT * 3);
  const rnd = new Float32Array(COUNT * 3);
  const scl = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.78;
    pos.set([Math.cos(a) * r, 0, Math.sin(a) * r], i * 3);
    rnd.set([Math.random(), Math.random(), Math.random()], i * 3);
    scl[i] = 0.5 + Math.random() * 1.3;
  }
  const flameGeo = new THREE.BufferGeometry();
  flameGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  flameGeo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 3));
  flameGeo.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));
  const flameUniforms = { uTime: { value: 0 } };
  uniformsList.push(flameUniforms);
  const flames = new THREE.Points(flameGeo, new THREE.ShaderMaterial({
    uniforms: flameUniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aRand;
      attribute float aScale;
      uniform float uTime;
      varying float vLife;
      varying float vRand;
      void main() {
        vRand = aRand.x;
        float life = fract(aRand.y + uTime * (0.16 + aRand.x * 0.22));
        vLife = life;
        vec3 p = position;
        p.xz *= (1.0 - life * 0.72);
        p.x += sin(uTime * 3.0 + aRand.z * 6.2831 + life * 9.0) * 0.09 * life;
        p.z += cos(uTime * 2.6 + aRand.x * 6.2831 + life * 7.0) * 0.09 * life;
        p.y = -0.85 + life * 2.9;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (120.0 * aScale * (1.0 - life * 0.55)) / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vLife;
      varying float vRand;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.04, d) * (1.0 - vLife) * 0.85;
        vec3 col = mix(vec3(1.0, 0.92, 0.55), vec3(1.0, 0.45, 0.03), smoothstep(0.0, 0.55, vLife));
        col = mix(col, vec3(0.75, 0.04, 0.0), smoothstep(0.55, 1.0, vLife));
        gl_FragColor = vec4(col * 1.6, alpha);
      }`
  }));
  flames.raycast = () => {};
  flames.frustumCulled = false;
  group.add(flames);

  // Embers orbiting outward
  const embers = makeSwirlPoints({
    count: 160, colorA: 0xffb03a, colorB: 0xff4400, size: 46, opacity: 0.95,
    place: (v) => { const d = randDir(); v.copy(d).multiplyScalar(1.15 + Math.random() * 0.85); v.y = Math.abs(v.y) * 0.8 - 0.3; }
  });
  uniformsList.push(embers.uniforms);
  group.add(embers.points);

  // Charred rocks at the base
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x1c1310, roughness: 0.95, flatShading: true, emissive: 0xff3300, emissiveIntensity: 0.12 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13 + Math.random() * 0.12, 0), rockMat);
    rock.position.set(Math.cos(a) * 0.82, -0.92 + Math.random() * 0.06, Math.sin(a) * 0.82);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rock.castShadow = true;
    group.add(rock);
  }

  const light = new THREE.PointLight(0xff7a22, 26, 9, 1.9);
  light.position.y = 0.4;
  group.add(light);
  group.add(makeGlow(0xff7a1a, 4.6, 0.8));

  return {
    group,
    update(t) {
      uniformsList.forEach((u) => { u.uTime.value = t; });
      core.rotation.y = t * 0.15;
      light.intensity = 24 + Math.sin(t * 11.0) * 4 + Math.sin(t * 23.7) * 3 + Math.sin(t * 5.3) * 2;
    }
  };
}

/* ------------------------------------------------------------------ WATER */

export function createWater() {
  const group = new THREE.Group();
  const uniformsList = [];
  group.add(makePedestal(0x0ea5e9, 'Water', '#8fd8ff'));

  // Deep inner body
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 48, 48),
    new THREE.MeshStandardMaterial({ color: 0x00497a, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.75 })
  );
  group.add(inner);

  // Animated fresnel wave shell
  const waterUniforms = { uTime: { value: 0 } };
  uniformsList.push(waterUniforms);
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.94, 80, 80),
    new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vView;
        varying vec3 vDir;
        varying float vWave;
        void main() {
          vDir = normalize(position);
          float w = snoise(vDir * 3.2 + vec3(0.0, uTime * 0.35, uTime * 0.22)) * 0.6
                  + sin(vDir.y * 9.0 - uTime * 1.8 + vDir.x * 4.0) * 0.22;
          vWave = w;
          vec3 displaced = position + normal * w * 0.075;
          vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vView;
        varying vec3 vDir;
        varying float vWave;
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vView);
          float fres = pow(1.0 - abs(dot(N, V)), 2.4);
          float sparkle = fbm(vDir * 6.0 + vec3(uTime * 0.25, -uTime * 0.4, 0.0)) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.0, 0.16, 0.38), vec3(0.02, 0.45, 0.85), smoothstep(-0.4, 0.8, vWave + vDir.y * 0.4));
          col = mix(col, vec3(0.35, 0.85, 1.0), fres * 0.9);
          col += vec3(0.7, 0.95, 1.0) * smoothstep(0.72, 0.95, sparkle) * 0.9;
          col += vec3(0.2, 0.7, 1.0) * fres * 0.8;
          float alpha = 0.5 + fres * 0.5;
          gl_FragColor = vec4(col * 1.45, alpha);
        }`
    })
  );
  group.add(shell);

  // Orbiting droplets
  const droplets = makeSwirlPoints({
    count: 340, colorA: 0x7dd3fc, colorB: 0x0369a1, size: 62, opacity: 0.9,
    place: (v) => { v.copy(randDir()).multiplyScalar(1.18 + Math.random() * 0.55); }
  });
  uniformsList.push(droplets.uniforms);
  group.add(droplets.points);

  // Rising bubbles inside
  const bubbles = makeSwirlPoints({
    count: 130, colorA: 0xe0f2fe, colorB: 0x38bdf8, size: 40, opacity: 0.75,
    place: (v) => { v.copy(randDir()).multiplyScalar(Math.random() * 0.78); }
  });
  uniformsList.push(bubbles.uniforms);
  group.add(bubbles.points);

  // Expanding ripple rings at the base
  const ripples = [];
  const rippleMat = () => new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.96, 1.0, 64), rippleMat());
    r.rotation.x = -Math.PI / 2;
    r.position.y = -1.18;
    r.raycast = () => {};
    group.add(r);
    ripples.push(r);
  }

  // Tilted water rings
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.014, 8, 120), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.01, 8, 120), ringMat.clone());
  ring2.material.opacity = 0.32;
  group.add(ring1, ring2);

  const light = new THREE.PointLight(0x38bdf8, 20, 9, 1.9);
  light.position.y = 0.4;
  group.add(light);
  group.add(makeGlow(0x0ea5e9, 4.4, 0.7));

  return {
    group,
    update(t) {
      uniformsList.forEach((u) => { u.uTime.value = t; });
      shell.rotation.y = t * 0.12;
      inner.rotation.y = -t * 0.06;
      ring1.rotation.set(Math.PI / 2.4 + Math.sin(t * 0.5) * 0.25, t * 0.4, 0);
      ring2.rotation.set(Math.PI / 1.7, -t * 0.3, Math.cos(t * 0.4) * 0.3);
      ripples.forEach((r, i) => {
        const s = (t * 0.22 + i / 3) % 1;
        r.scale.setScalar(0.75 + s * 0.9);
        r.material.opacity = (1 - s) * 0.45;
      });
      light.intensity = 19 + Math.sin(t * 2.2) * 3;
    }
  };
}

/* ------------------------------------------------------------------ EARTH */

function trigNoise(x, y, z) {
  return (
    Math.sin(x * 4.2 + Math.cos(z * 3.7)) * Math.sin(y * 3.9 + Math.cos(x * 2.8)) * 0.55 +
    Math.sin(z * 5.1 + Math.cos(y * 3.3)) * 0.3 +
    Math.sin(x * 9.1) * Math.sin(y * 8.3) * Math.sin(z * 7.7) * 0.22
  );
}

export function createEarth() {
  const group = new THREE.Group();
  const uniformsList = [];
  group.add(makePedestal(0x22c55e, 'Earth', '#9be89b'));

  // Procedurally displaced low-poly planet with vertex-colour biomes
  const geo = new THREE.SphereGeometry(0.95, 56, 56);
  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const v = new THREE.Vector3();
  const cRock = new THREE.Color(0x6b4a2c);
  const cDark = new THREE.Color(0x3d2b18);
  const cMoss = new THREE.Color(0x3f9e4d);
  const cGrass = new THREE.Color(0x65c95c);
  const cPeak = new THREE.Color(0x9b968c);
  const tmp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    const dir = v.clone().normalize();
    const n = trigNoise(dir.x, dir.y, dir.z);
    const radius = 0.95 + n * 0.15 + Math.max(0, dir.y) * 0.03;
    v.copy(dir).multiplyScalar(radius);
    posAttr.setXYZ(i, v.x, v.y, v.z);

    const h = (radius - 0.8) / 0.3; // 0..~1 elevation
    if (h < 0.35) tmp.lerpColors(cDark, cRock, h / 0.35);
    else if (h < 0.62) tmp.lerpColors(cRock, dir.y > -0.15 ? cMoss : cRock, (h - 0.35) / 0.27);
    else if (h < 0.82) tmp.lerpColors(cMoss, cGrass, (h - 0.62) / 0.2);
    else tmp.lerpColors(cGrass, cPeak, (h - 0.82) / 0.18);
    if (dir.y < -0.45) tmp.lerp(cDark, 0.5);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const planet = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0.02
  }));
  planet.castShadow = true;
  planet.receiveShadow = true;
  group.add(planet);

  // Emerald crystals jutting from the surface
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.85,
    roughness: 0.15, metalness: 0.1, flatShading: true, transparent: true, opacity: 0.95
  });
  const crystals = [];
  for (let i = 0; i < 11; i++) {
    const dir = randDir();
    dir.y = Math.abs(dir.y) * 0.9 - 0.15;
    dir.normalize();
    const h = 0.28 + Math.random() * 0.3;
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.06 + Math.random() * 0.035, h, 6), crystalMat);
    crystal.position.copy(dir).multiplyScalar(0.98 + h * 0.22);
    crystal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    crystal.castShadow = true;
    group.add(crystal);
    crystals.push(crystal);
  }

  // Tiny pine trees on the upper hemisphere
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 14; i++) {
    const dir = randDir();
    dir.y = Math.abs(dir.y) * 0.95 + 0.1;
    dir.normalize();
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.09, 6), trunkMat);
    trunk.position.y = 0.045;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.22, 7), leafMat);
    leaves.position.y = 0.19;
    leaves.castShadow = true;
    tree.add(trunk, leaves);
    tree.position.copy(dir).multiplyScalar(1.0);
    tree.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const s = 0.8 + Math.random() * 0.7;
    tree.scale.setScalar(s);
    group.add(tree);
  }

  // Orbiting floating rocks
  const rocks = [];
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x77604a, roughness: 1, flatShading: true });
  for (let i = 0; i < 13; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05 + Math.random() * 0.1, 0), rockMat);
    rock.castShadow = true;
    group.add(rock);
    rocks.push({
      mesh: rock,
      angle: Math.random() * Math.PI * 2,
      radius: 1.35 + Math.random() * 0.55,
      speed: 0.12 + Math.random() * 0.25,
      y: (Math.random() - 0.5) * 1.1,
      spin: Math.random() * 2
    });
  }

  // Drifting spores / dust motes
  const dust = makeSwirlPoints({
    count: 220, colorA: 0xa7f3a0, colorB: 0x8a6d3b, size: 42, opacity: 0.8,
    place: (v) => { v.copy(randDir()).multiplyScalar(1.2 + Math.random() * 0.8); }
  });
  uniformsList.push(dust.uniforms);
  group.add(dust.points);

  const light = new THREE.PointLight(0x86efac, 15, 9, 1.9);
  light.position.set(0.5, 0.7, 0.5);
  group.add(light);
  group.add(makeGlow(0x22c55e, 4.2, 0.6));

  return {
    group,
    update(t) {
      uniformsList.forEach((u) => { u.uTime.value = t; });
      planet.rotation.y = t * 0.07;
      crystals.forEach((c, i) => {
        const s = 1 + Math.sin(t * 1.8 + i * 1.7) * 0.08;
        c.scale.set(s, 1 + Math.sin(t * 1.8 + i * 1.7) * 0.14, s);
      });
      crystalMat.emissiveIntensity = 0.75 + Math.sin(t * 2.0) * 0.3;
      rocks.forEach((r) => {
        const a = r.angle + t * r.speed;
        r.mesh.position.set(Math.cos(a) * r.radius, r.y + Math.sin(t * 0.8 + r.angle * 3.0) * 0.09, Math.sin(a) * r.radius);
        r.mesh.rotation.x = t * r.spin * 0.4;
        r.mesh.rotation.y = t * r.spin * 0.6;
      });
    }
  };
}

/* -------------------------------------------------------------------- AIR */

export function createAir() {
  const group = new THREE.Group();
  const uniformsList = [];
  group.add(makePedestal(0xa5f3fc, 'Air', '#d9fbff'));

  // Glassy fresnel core
  const coreUniforms = { uTime: { value: 0 } };
  uniformsList.push(coreUniforms);
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 56, 56),
    new THREE.ShaderMaterial({
      uniforms: coreUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vView;
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vView;
        varying vec3 vDir;
        void main() {
          float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.6);
          float wisps = fbm(vDir * 3.5 + vec3(uTime * 0.35, -uTime * 0.55, 0.0)) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.35, 0.75, 0.9), vec3(0.95, 1.0, 1.0), wisps);
          col += vec3(0.65, 0.95, 1.0) * fres * 1.6;
          float alpha = 0.10 + fres * 0.75 + smoothstep(0.6, 0.95, wisps) * 0.18;
          gl_FragColor = vec4(col * 1.5, alpha);
        }`
    })
  );
  group.add(core);

  // Tornado shroud
  const tornadoUniforms = { uTime: { value: 0 } };
  uniformsList.push(tornadoUniforms);
  const tornado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 1.12, 2.5, 48, 1, true),
    new THREE.ShaderMaterial({
      uniforms: tornadoUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          float angle = atan(vPos.z, vPos.x);
          float bands = sin(angle * 3.0 + vUv.y * 26.0 - uTime * 3.4) * 0.5 + 0.5;
          float bands2 = sin(angle * 5.0 - vUv.y * 38.0 + uTime * 4.6) * 0.5 + 0.5;
          float fade = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
          float alpha = (bands * 0.5 + bands2 * 0.3) * fade * 0.34;
          vec3 col = mix(vec3(0.55, 0.85, 1.0), vec3(1.0), bands2 * 0.5);
          gl_FragColor = vec4(col * 1.4, alpha);
        }`
    })
  );
  tornado.position.y = 0.05;
  tornado.raycast = () => {};
  group.add(tornado);

  // Spiralling wind particles — tight at the bottom, wide at the top
  const wind = makeSwirlPoints({
    count: 950, colorA: 0xffffff, colorB: 0x67e8f9, size: 54, opacity: 0.85,
    place: (v) => {
      const y = -1.15 + Math.random() * 2.5;
      const r = 0.32 + ((y + 1.15) / 2.5) * 0.95 + Math.random() * 0.18;
      const a = Math.random() * Math.PI * 2;
      v.set(Math.cos(a) * r, y, Math.sin(a) * r);
    }
  });
  uniformsList.push(wind.uniforms);
  group.add(wind.points);

  // High drifting wisps around the core
  const wisps = makeSwirlPoints({
    count: 260, colorA: 0xe0faff, colorB: 0x7dd3fc, size: 70, opacity: 0.55,
    place: (v) => { v.copy(randDir()).multiplyScalar(1.25 + Math.random() * 0.7); v.y *= 0.62; }
  });
  uniformsList.push(wisps.uniforms);
  group.add(wisps.points);

  // Gyroscope rings
  const rings = [];
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xcffafe, transparent: true, opacity: 0.65 });
  [[1.15, 0.016], [1.38, 0.012], [1.62, 0.009]].forEach(([r, tube], i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 140), ringMat.clone());
    ring.material.opacity = 0.65 - i * 0.16;
    group.add(ring);
    rings.push(ring);
  });

  const light = new THREE.PointLight(0xa5f3fc, 17, 9, 1.9);
  light.position.y = 0.5;
  group.add(light);
  group.add(makeGlow(0x7dd3fc, 4.4, 0.65));

  return {
    group,
    update(t, dt) {
      uniformsList.forEach((u) => { u.uTime.value = t; });
      core.rotation.y = t * 0.25;
      tornado.rotation.y = -t * 0.7;
      rings[0].rotation.set(t * 0.5, t * 0.7, 0);
      rings[1].rotation.set(Math.PI / 2 + t * 0.35, 0, t * 0.55);
      rings[2].rotation.set(t * 0.22, -t * 0.4, Math.PI / 3);
      light.intensity = 16 + Math.sin(t * 3.1) * 2.5;
    }
  };
}
