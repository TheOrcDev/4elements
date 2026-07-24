import * as THREE from 'three';

/* ---------- tiny deterministic value-noise util (CPU, init only) ---------- */
function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}
function fade(t) { return t * t * (3 - 2 * t); }
function valueNoise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  let res = 0;
  for (let dx = 0; dx <= 1; dx++)
    for (let dy = 0; dy <= 1; dy++)
      for (let dz = 0; dz <= 1; dz++) {
        const weight = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
        res += weight * hash3(xi + dx, yi + dy, zi + dz);
      }
  return res;
}
function fbm3(x, y, z, octaves = 4) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise3(x * freq, y * freq, z * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm; // 0..1
}

const R = 3.5;      // island radius
const ISLAND_Y = 3.2; // hover height

// Top half of the island: noise-displaced hemisphere with a flatter mossy top.
function buildDomeGeometry() {
  const geo = new THREE.SphereGeometry(R, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const col = new THREE.Color();
  const cDark = new THREE.Color(0x241a10);
  const cMid = new THREE.Color(0x5a4026);
  const cMoss = new THREE.Color(0x4e6b2e);
  const cGrass = new THREE.Color(0x6d9040);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();
    const rim = Math.min(1, dir.y * 6); // keep the equator rim exact so it meets the cone
    const plateau = 1 - 0.55 * THREE.MathUtils.smoothstep(dir.y, 0.7, 1.0);
    const n = fbm3(dir.x * 2.6 + 11.3, dir.y * 2.6 + 4.1, dir.z * 2.6 - 7.7, 4);
    v.addScaledVector(dir, (n - 0.5) * 1.2 * rim * plateau);
    pos.setXYZ(i, v.x, v.y, v.z);
    const t = THREE.MathUtils.clamp(v.y / R, 0, 1);
    if (t < 0.55) col.lerpColors(cDark, cMid, t / 0.55);
    else col.lerpColors(cMid, cMoss, (t - 0.55) / 0.45);
    if (dir.y > 0.7) col.lerp(cGrass, THREE.MathUtils.clamp((n - 0.35) * 0.9, 0, 1));
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

// Bottom half: inverted displaced cone (the torn rocky root of the island).
function buildRootGeometry() {
  const geo = new THREE.ConeGeometry(R * 0.99, 4.4, 44, 18, true);
  geo.rotateX(Math.PI);      // apex down
  geo.translate(0, -2.2, 0); // rim at y = 0
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const col = new THREE.Color();
  const cDark = new THREE.Color(0x1c120a);
  const cMid = new THREE.Color(0x48331d);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y < -0.01) {
      const radial = new THREE.Vector3(v.x, 0, v.z).normalize();
      const depth = -v.y / 4.4;
      const n = fbm3(v.x * 0.9 + 3.1, v.y * 0.9, v.z * 0.9 - 2.2, 4);
      v.addScaledVector(radial, (n - 0.5) * 1.5 * (1 - depth * 0.55));
      v.y += (fbm3(v.x * 1.7, v.y * 1.7 + 9.4, v.z * 1.7, 3) - 0.5) * 0.5 * depth;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    col.lerpColors(cDark, cMid, THREE.MathUtils.clamp(1 + v.y / 4.4, 0, 1)); // darker toward the tip
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function createEarth(originX = 0) {
  const group = new THREE.Group();
  group.position.x = originX;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  // ---------- floating island ----------
  const island = new THREE.Group();
  island.position.y = ISLAND_Y;
  const rockMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.95,
    metalness: 0.02,
  });
  island.add(new THREE.Mesh(buildDomeGeometry(), rockMaterial));
  island.add(new THREE.Mesh(buildRootGeometry(), rockMaterial));
  group.add(island);

  // ---------- crystals embedded in the top ----------
  const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
  const baseCrystalMats = [
    new THREE.MeshStandardMaterial({ color: 0x3a2408, emissive: 0xff9e1f, emissiveIntensity: 2.2, roughness: 0.15, metalness: 0.2, flatShading: true }), // amber
    new THREE.MeshStandardMaterial({ color: 0x0a2e1a, emissive: 0x2fe07a, emissiveIntensity: 2.0, roughness: 0.15, metalness: 0.2, flatShading: true }), // emerald
  ];
  const crystals = [];
  const NC = 7;
  for (let i = 0; i < NC; i++) {
    const mat = baseCrystalMats[i % 2].clone(); // clone so each pulses on its own phase
    const m = new THREE.Mesh(crystalGeo, mat);
    const ang = (i / NC) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
    const rr = 0.7 + Math.random() * 1.8;
    m.position.set(
      Math.cos(ang) * rr,
      Math.sqrt(Math.max(0.4, R * R - rr * rr)) - 0.35, // sit slightly embedded in the dome
      Math.sin(ang) * rr
    );
    m.scale.set(0.7 + Math.random() * 0.5, 1.9 + Math.random() * 1.1, 0.7 + Math.random() * 0.5);
    m.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5);
    island.add(m);
    crystals.push({ mesh: m, phase: Math.random() * Math.PI * 2 });
  }

  // warm light radiating from the crystal cluster
  const crystalLight = new THREE.PointLight(0xffb14d, 45, 28, 2);
  crystalLight.position.set(0, 1.4, 0);
  island.add(crystalLight);

  // ---------- orbiting rocks (instanced) ----------
  const ROCK_COUNT = 40;
  const rocks = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.32, 0),
    new THREE.MeshStandardMaterial({ color: 0x6d5136, flatShading: true, roughness: 1 }),
    ROCK_COUNT
  );
  const rockSpecs = [];
  for (let i = 0; i < ROCK_COUNT; i++) {
    rockSpecs.push({
      r: 4.6 + Math.random() * 3.8,
      y: ISLAND_Y - 1.2 + Math.random() * 3.6,
      phase: Math.random() * Math.PI * 2,
      speed: (0.08 + Math.random() * 0.22) * (Math.random() < 0.5 ? 1 : -1),
      scale: 0.35 + Math.random() * 1.1,
      bob: Math.random() * Math.PI * 2,
      tumble: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize().multiplyScalar(0.4 + Math.random() * 0.8),
    });
  }
  group.add(rocks);
  const dummy = new THREE.Object3D();

  // ---------- slow warm dust drifting around ----------
  const DCOUNT = 200;
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DCOUNT * 3), 3));
  const dSeeds = new Float32Array(DCOUNT);
  const dSpeeds = new Float32Array(DCOUNT);
  const dOffsets = new Float32Array(DCOUNT * 3);
  for (let i = 0; i < DCOUNT; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rr = 2.5 + Math.random() * 5.5;
    dSeeds[i] = Math.random();
    dSpeeds[i] = 0.3 + Math.random() * 0.8;
    dOffsets[i * 3] = Math.cos(ang) * rr;
    dOffsets[i * 3 + 1] = ISLAND_Y - 2 + Math.random() * 5.5;
    dOffsets[i * 3 + 2] = Math.sin(ang) * rr;
  }
  dgeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeeds, 1));
  dgeo.setAttribute('aSpeed', new THREE.BufferAttribute(dSpeeds, 1));
  dgeo.setAttribute('aOffset', new THREE.BufferAttribute(dOffsets, 3));

  const dustUniforms = { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } };
  const dustMat = new THREE.ShaderMaterial({
    uniforms: dustUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uPixelRatio;
      attribute float aSeed, aSpeed;
      attribute vec3 aOffset;
      varying float vA;
      varying float vDepth;
      void main() {
        vec3 p = aOffset + vec3(
          sin(uTime * 0.22 + aSeed * 6.2831) * 0.9,
          sin(uTime * 0.18 + aSeed * 12.0) * 0.6,
          cos(uTime * 0.26 + aSeed * 6.2831) * 0.9
        );
        vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.5 + aSpeed) + aSeed * 30.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_PointSize = (6.0 + aSeed * 10.0) * uPixelRatio * (12.0 / vDepth);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vA;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.1, d);
        float fogFade = exp(-vDepth * vDepth * 0.0009);
        gl_FragColor = vec4(vec3(0.85, 0.72, 0.5), a * vA * 0.28 * fogFade);
      }
    `,
  });
  const dust = new THREE.Points(dgeo, dustMat);
  dust.frustumCulled = false;
  group.add(dust);

  function update(elapsed) {
    island.position.y = ISLAND_Y + Math.sin(elapsed * 0.5) * 0.35;
    island.rotation.y = elapsed * 0.05;
    for (const c of crystals) {
      c.mesh.material.emissiveIntensity = 2.1 + Math.sin(elapsed * 1.7 + c.phase) * 0.9;
    }
    for (let i = 0; i < ROCK_COUNT; i++) {
      const s = rockSpecs[i];
      const a = s.phase + elapsed * s.speed;
      dummy.position.set(
        Math.cos(a) * s.r,
        s.y + Math.sin(elapsed * 0.6 + s.bob) * 0.35,
        Math.sin(a) * s.r
      );
      dummy.rotation.set(s.tumble.x * elapsed, s.tumble.y * elapsed, s.tumble.z * elapsed);
      dummy.scale.setScalar(s.scale);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.instanceMatrix.needsUpdate = true;
    dustUniforms.uTime.value = elapsed;
  }

  return {
    group,
    update,
    anchor: new THREE.Vector3(originX, 2.7, 12.5),
    target: new THREE.Vector3(originX, 3.7, 0),
    background: 0x070b06,
  };
}
