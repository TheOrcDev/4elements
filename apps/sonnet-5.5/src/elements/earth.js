import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, smoothstep, clamp, TAU } from '../utils/rng.js';
import { roughLathe, rockGeometry, paintVertices, fbm, perlin, randomArray } from '../utils/geometry.js';

const ISLAND_Y = 4.7; // height of the island's local origin above the plinth
const DEPTH = 0.64; // vertical compression of the underside
const TOP_R = 3.05; // radius of the grassy area

/** Height of the meadow surface (island-local space). */
function topY(x, z) {
  const r = Math.hypot(x, z);
  return 0.66 - 0.21 * smoothstep(0, 3.3, r) + 0.15 * fbm(x * 0.55, 7.1, z * 0.55, 3) + 0.05 * fbm(x * 1.6, 3.3, z * 1.6, 2);
}

/** Wobble that makes the island outline irregular. */
function outlineScale(x, z) {
  const a = Math.atan2(z, x);
  return 1 + 0.13 * fbm(Math.cos(a) * 1.25, Math.sin(a) * 1.25, 4.7, 3);
}

/** A hexagonal crystal: prism + pointed tip, jittered so no two facets are alike. */
function crystalGeometry(radius, height, seed) {
  const sides = 6;
  const body = new THREE.CylinderGeometry(radius * 0.78, radius, height * 0.7, sides, 1, true);
  body.translate(0, height * 0.35, 0);
  const tip = new THREE.ConeGeometry(radius * 0.78, height * 0.3, sides, 1, true);
  tip.translate(0, height * 0.7 + height * 0.15, 0);
  const cap = new THREE.CircleGeometry(radius, sides);
  cap.rotateX(Math.PI / 2);
  const parts = [body, tip, cap].map((g) => {
    g.deleteAttribute('uv');
    return g.index ? g.toNonIndexed() : g;
  });
  const geo = mergeGeometries(parts);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const j = perlin.noise(v.x * 6 + seed, v.y * 6, v.z * 6 - seed) * 0.05 * radius * 4;
    v.x += j;
    v.z += perlin.noise(v.z * 6, v.y * 6 + seed, v.x * 6) * 0.05 * radius * 4;
    v.y += perlin.noise(v.y * 5, v.x * 5, v.z * 5 + seed) * 0.04 * height;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Tube that tapers to a point (roots, trunks). */
function taperedTube(points, radius, radial = 7, tubular = 26, end = 0.06) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  const pos = geo.attributes.position;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    curve.getPointAt(i / tubular, c);
    const k = Math.pow(1 - i / tubular, 0.85) * (1 - end) + end;
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geo.deleteAttribute('uv');
  geo.computeVertexNormals();
  return geo;
}

/** Approximate height of the island's underside at radius r (island-local). */
function undersideY(r) {
  const pts = [[0, -4.5], [0.35, -4.0], [0.85, -3.2], [1.4, -2.4], [1.95, -1.65], [2.5, -1.0], [2.98, -0.48], [3.3, -0.06]].map(([a, b]) => [a, b * DEPTH]);
  for (let i = 0; i < pts.length - 1; i++) {
    if (r <= pts[i + 1][0]) {
      const t = (r - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    }
  }
  return -0.06;
}

const GRASS_VERT = /* glsl */ `
  attribute vec3 aPos;
  attribute vec4 aInfo;   // rotation, height, width, colour seed
  uniform float uTime;
  uniform float uWind;
  varying float vH;
  varying float vSeed;
  varying vec3 vWorld;
  void main() {
    float h = position.y;
    vec3 local = vec3(position.x * aInfo.z, h * aInfo.y, 0.0);
    float c = cos(aInfo.x);
    float s = sin(aInfo.x);
    vec3 p = vec3(local.x * c, local.y, local.x * s);
    float w = sin(uTime * 1.6 + aPos.x * 0.8 + aPos.z * 0.6) + 0.6 * sin(uTime * 2.7 + aPos.x * 2.1 - aPos.z * 1.3);
    float bend = h * h * (0.2 + 0.16 * uWind) * w;
    p.x += bend * aInfo.y * 0.55;
    p.z += bend * aInfo.y * 0.28;
    p.y -= abs(bend) * 0.12 * aInfo.y;
    vec4 wp = modelMatrix * vec4(aPos + p, 1.0);
    vWorld = wp.xyz;
    vH = h;
    vSeed = aInfo.w;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GRASS_FRAG = /* glsl */ `
  uniform vec3 uCrystalPos;
  uniform vec3 uCrystalColor;
  uniform vec3 uAmberPos;
  uniform vec3 uAmberColor;
  uniform vec3 uLightDir;
  uniform float uPower;
  varying float vH;
  varying float vSeed;
  varying vec3 vWorld;
  void main() {
    vec3 base = mix(vec3(0.012, 0.05, 0.010), vec3(0.028, 0.08, 0.018), vSeed);
    vec3 tip = mix(vec3(0.075, 0.24, 0.045), vec3(0.17, 0.33, 0.06), vSeed);
    vec3 col = mix(base, tip, pow(max(vH, 0.0), 1.4));
    float moon = 0.42 + 0.5 * clamp(uLightDir.y + 0.35, 0.0, 1.0);
    col *= moon * (0.45 + 0.6 * vH);
    float g1 = exp(-length(vWorld - uCrystalPos) * 0.5);
    float g2 = exp(-length(vWorld - uAmberPos) * 0.7);
    col += uCrystalColor * g1 * (0.22 + 0.3 * uPower) * (0.3 + 0.7 * vH) * 0.55;
    col += uAmberColor * g2 * 0.2 * (0.3 + 0.7 * vH);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const FIREFLY_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uScale;
  varying float vA;
  void main() {
    float t = uTime * (0.25 + 0.3 * aSeed.w);
    vec3 p = vec3(
      (aSeed.x - 0.5) * 8.0 + sin(t * 1.3 + aSeed.y * 40.0) * 0.9,
      aSeed.y * 3.2 + sin(t * 1.9 + aSeed.z * 30.0) * 0.35,
      (aSeed.z - 0.5) * 8.0 + cos(t * 1.1 + aSeed.x * 40.0) * 0.9
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.05 + 0.06 * aSeed.w) * uScale / -mv.z;
    float blink = smoothstep(0.35, 1.0, 0.5 + 0.5 * sin(uTime * (0.9 + aSeed.w * 1.4) + aSeed.x * 60.0));
    vA = blink * step(length(p.xz), 4.0);
  }
`;

const DUST_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uScale;
  varying float vA;
  void main() {
    float life = fract(uTime * (0.05 + 0.07 * aSeed.y) + aSeed.x);
    float rad = sqrt(aSeed.z) * 2.2 * (1.0 - 0.35 * life);
    float a = aSeed.w * 6.2831853 + life * 1.5;
    vec3 p = vec3(cos(a) * rad, -2.4 - life * 4.4, sin(a) * rad);
    p.x += sin(uTime * 0.8 + aSeed.x * 20.0) * 0.15;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.035 + 0.05 * aSeed.y) * uScale / -mv.z;
    vA = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.55, 1.0, life));
  }
`;

export function createEarth(ctx) {
  const { time, pointScale, moonDir } = ctx;
  const rng = mulberry32(53);
  const group = new THREE.Group();
  group.name = 'earth';
  const power = { value: 0 };

  // ---------------------------------------------------------------- mossy plinth
  {
    const profile = [
      [0, 0],
      [4.05, 0],
      [4.05, 0.22],
      [3.86, 0.36],
      [3.86, 0.56],
      [3.4, 0.74],
      [3.0, 0.76],
      [0, 0.76],
    ];
    const geo = roughLathe(profile, 144, 7, (v) => {
      const r = Math.hypot(v.x, v.z);
      if (v.y < 0.03) return;
      const n = fbm(v.x * 1.1, v.y * 1.1, v.z * 1.1, 4);
      const k = 0.16;
      v.x += (v.x / (r || 1)) * n * k;
      v.z += (v.z / (r || 1)) * n * k;
      v.y += n * k * 0.45;
    });
    paintVertices(geo, (p, n) => {
      const g = 0.7 + 0.6 * (fbm(p.x * 2.4, p.y * 2.4, p.z * 2.4, 3) * 0.5 + 0.5);
      const moss = smoothstep(0.35, 0.8, n.y) * smoothstep(0.35, 0.6, p.y);
      const stone = new THREE.Color(0.075, 0.07, 0.07).multiplyScalar(g);
      const mossC = new THREE.Color(0.022, 0.065, 0.02).multiplyScalar(g);
      return stone.lerp(mossC, moss);
    });
    const plinth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.05 }));
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    // rugged boulders bedded into the plinth's edge
    {
      const geos = [];
      for (let i = 0; i < 15; i++) {
        const a = (i / 15) * TAU + (rng() - 0.5) * 0.25;
        const rr = 3.15 + rng() * 0.5;
        const sc = 0.22 + rng() * 0.42;
        const g = rockGeometry({ radius: 1, detail: 2, amp: 0.5, freq: 1.3, seed: 300 + i * 5, squash: 0.7 });
        paintVertices(g, (p, n) => new THREE.Color(0.07, 0.065, 0.068).multiplyScalar(0.8 + 0.5 * (fbm(p.x * 3, p.y * 3, p.z * 3, 2) * 0.5 + 0.5)).lerp(new THREE.Color(0.025, 0.08, 0.025), smoothstep(0.35, 0.8, n.y) * 0.8));
        g.scale(sc * (0.9 + rng() * 0.6), sc, sc * (0.9 + rng() * 0.6));
        g.rotateY(rng() * TAU);
        g.translate(Math.cos(a) * rr, 0.75 + sc * 0.28, Math.sin(a) * rr);
        geos.push(g);
      }
      const stones = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }));
      stones.castShadow = true;
      stones.receiveShadow = true;
      group.add(stones);
    }

    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.026, 8, 180), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.15, 0.4) }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.56;
    group.add(ring);
  }

  // ---------------------------------------------------------------- the floating island
  const island = new THREE.Group();
  island.position.y = ISLAND_Y;
  group.add(island);

  const islandProfile = [
    [0.0, -4.5],
    [0.35, -4.0],
    [0.85, -3.2],
    [1.4, -2.4],
    [1.95, -1.65],
    [2.5, -1.0],
    [2.98, -0.48],
    [3.3, -0.06],
    [3.42, 0.2],
    [3.22, 0.45],
    [2.6, 0.55],
    [1.6, 0.62],
    [0.0, 0.66],
  ].map(([r, y]) => [r, y < 0 ? y * DEPTH : y]);
  const islandGeo = roughLathe(islandProfile, 240, 16, (v) => {
    const s = outlineScale(v.x, v.z);
    v.x *= s;
    v.z *= s;
    if (v.y >= 0.44) {
      v.y = topY(v.x, v.z);
      return;
    }
    const r = Math.hypot(v.x, v.z);
    const depth = clamp((0.3 - v.y) / (4.6 * DEPTH), 0, 1);
    const n = fbm(v.x * 0.7, v.y * 0.5, v.z * 0.7, 4);
    const ridge = 1 - Math.abs(fbm(v.x * 1.3 + 9, v.y * 0.9, v.z * 1.3, 3));
    const fine = fbm(v.x * 2.4 + 3, v.y * 1.8, v.z * 2.4, 3);
    const ang = Math.atan2(v.z, v.x);
    const fins = fbm(Math.cos(ang) * 2.3, Math.sin(ang) * 2.3, v.y * 0.32, 3);
    // stepped sediment ledges: radius jumps at each stratum boundary
    const ph = (v.y + 0.5 * n) * 2.7;
    const ledge = Math.pow(ph - Math.floor(ph), 2.2) - 0.3;
    const k = 0.45 + 1.5 * depth;
    let d = (n * 0.8 + ridge * 0.5 + fine * 0.28 + fins * 1.25 * depth - 0.25) * k + ledge * (0.18 + 0.2 * depth);
    d *= 1 + 0.5 * smoothstep(0.3, 0.9, depth);
    if (r > 1e-3) {
      const nr = Math.max(r + d, 0.02 + r * 0.25 * (1 - depth));
      v.x *= nr / r;
      v.z *= nr / r;
    }
    v.y += (n * 0.35 + fine * 0.15) * depth;
  });

  const strata = [
    new THREE.Color(0.14, 0.09, 0.06),
    new THREE.Color(0.1, 0.085, 0.085),
    new THREE.Color(0.19, 0.125, 0.07),
    new THREE.Color(0.085, 0.075, 0.09),
    new THREE.Color(0.15, 0.11, 0.085),
  ];
  paintVertices(islandGeo, (p, n) => {
    const var1 = 0.75 + 0.5 * (fbm(p.x * 2.6, p.y * 2.6, p.z * 2.6, 3) * 0.5 + 0.5);
    if (p.y >= 0.34 && n.y > 0.45) {
      const g = fbm(p.x * 1.1, 2.2, p.z * 1.1, 3) * 0.5 + 0.5;
      return new THREE.Color(0.04, 0.13, 0.03).lerp(new THREE.Color(0.07, 0.16, 0.035), g).multiplyScalar(0.8 + 0.4 * var1);
    }
    const band = Math.floor((p.y + 0.6 * fbm(p.x * 0.6, p.y * 0.3, p.z * 0.6, 2)) * 3.6);
    const c = strata[((band % strata.length) + strata.length) % strata.length].clone();
    // soil lip right under the grass
    const lip = smoothstep(-0.4, 0.15, p.y) * smoothstep(0.2, 0.7, n.y + 0.4);
    c.lerp(new THREE.Color(0.1, 0.06, 0.035), lip * 0.7);
    const depthDark = 1 - smoothstep(-0.3, -4.3 * DEPTH, p.y) * 0.45;
    return c.multiplyScalar(var1 * depthDark);
  });
  const islandMesh = new THREE.Mesh(islandGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.04 }));
  islandMesh.castShadow = true;
  islandMesh.receiveShadow = true;
  island.add(islandMesh);

  // ---------------------------------------------------------------- grass
  const crystalWorld = new THREE.Vector3();
  const amberWorld = new THREE.Vector3();
  const grassUniforms = {
    uTime: time,
    uWind: { value: 0 },
    uCrystalPos: { value: crystalWorld },
    uCrystalColor: { value: new THREE.Color(0.2, 1.0, 0.45) },
    uAmberPos: { value: amberWorld },
    uAmberColor: { value: new THREE.Color(1.0, 0.6, 0.15) },
    uLightDir: { value: moonDir },
    uPower: { value: 0 },
  };
  {
    const N = 9000;
    const blade = new THREE.BufferGeometry();
    const w = 0.5;
    blade.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-w, 0, 0, w, 0, 0, -w * 0.62, 0.55, 0, w * 0.62, 0.55, 0, 0, 1, 0]), 3));
    blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = blade.index;
    geo.setAttribute('position', blade.getAttribute('position'));
    const P = new Float32Array(N * 3);
    const I = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const a = rng() * TAU;
      let r = Math.sqrt(rng()) * TOP_R * 1.02;
      let x = Math.cos(a) * r;
      let z = Math.sin(a) * r;
      const s = outlineScale(x, z);
      x *= s * 0.97;
      z *= s * 0.97;
      P.set([x, topY(x, z) - 0.02, z], i * 3);
      I.set([rng() * TAU, 0.22 + rng() * 0.36, 0.05 + rng() * 0.05, rng()], i * 4);
    }
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(P, 3));
    geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(I, 4));
    geo.instanceCount = N;
    const grass = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({ uniforms: grassUniforms, vertexShader: GRASS_VERT, fragmentShader: GRASS_FRAG, side: THREE.DoubleSide }),
    );
    grass.frustumCulled = false;
    island.add(grass);
  }

  // ---------------------------------------------------------------- crystals
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x1fd67c),
    emissive: new THREE.Color(0x07a552),
    emissiveIntensity: 0.95,
    roughness: 0.14,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.4,
    envMapIntensity: 3.2,
    flatShading: true,
  });
  const amberMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffa62b),
    emissive: new THREE.Color(0xd06a05),
    emissiveIntensity: 0.55,
    roughness: 0.16,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 3.0,
    flatShading: true,
  });
  const crystals = [];
  const addCrystal = (mat, x, z, radius, height, tiltX, tiltZ, seed) => {
    const geo = crystalGeometry(radius, height, seed);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, topY(x, z) - 0.08, z);
    m.rotation.set(tiltX, seed * 1.7, tiltZ);
    m.castShadow = true;
    island.add(m);
    crystals.push({ mesh: m, mat });
    return m;
  };
  // emerald cluster, slightly off-centre
  addCrystal(emeraldMat, 0.35, -0.2, 0.34, 2.9, 0.06, -0.05, 1);
  addCrystal(emeraldMat, 0.95, 0.15, 0.26, 2.1, 0.08, -0.32, 2);
  addCrystal(emeraldMat, -0.15, 0.55, 0.24, 1.8, -0.3, 0.1, 3);
  addCrystal(emeraldMat, 0.6, -0.85, 0.2, 1.4, 0.3, 0.16, 4);
  addCrystal(emeraldMat, 1.35, -0.55, 0.15, 0.95, 0.15, -0.5, 5);
  addCrystal(emeraldMat, -0.7, -0.35, 0.16, 1.1, 0.1, 0.45, 6);
  // amber cluster
  addCrystal(amberMat, -1.5, 0.95, 0.24, 1.5, -0.12, 0.2, 7);
  addCrystal(amberMat, -1.9, 1.25, 0.15, 0.85, 0.2, 0.42, 8);
  addCrystal(amberMat, -1.15, 1.35, 0.13, 0.7, -0.35, 0.05, 9);
  // scattered shards near the rim
  for (let i = 0; i < 7; i++) {
    const a = rng() * TAU;
    const r = 2.1 + rng() * 0.75;
    addCrystal(i % 3 === 0 ? amberMat : emeraldMat, Math.cos(a) * r, Math.sin(a) * r, 0.07 + rng() * 0.07, 0.35 + rng() * 0.5, (rng() - 0.5) * 0.9, (rng() - 0.5) * 0.9, 20 + i);
  }

  const crystalLight = new THREE.PointLight(0x3cff8e, 20, 11, 2);
  crystalLight.position.set(0.5, 1.6, 0);
  island.add(crystalLight);
  const amberLight = new THREE.PointLight(0xffa030, 5, 6, 2);
  amberLight.position.set(-1.5, 0.7, 1.0);
  island.add(amberLight);

  // ---------------------------------------------------------------- trees
  const makeTree = (x, z, height, seed, hueShift) => {
    const trng = mulberry32(seed);
    const y0 = topY(x, z) - 0.06;
    const lean = (trng() - 0.5) * 0.5;
    const pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 0.25, height * 0.35, lean * 0.1),
      new THREE.Vector3(lean * 0.7, height * 0.7, -lean * 0.2),
      new THREE.Vector3(lean, height, 0),
    ];
    const trunk = new THREE.Mesh(taperedTube(pts, height * 0.065, 7, 24, 0.25), new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.95 }));
    trunk.castShadow = true;
    const g = new THREE.Group();
    g.position.set(x, y0, z);
    g.add(trunk);

    const blobs = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const rad = height * (0.26 + trng() * 0.15);
      const geo = rockGeometry({ radius: rad, detail: 1, amp: 0.3, freq: 1.4, seed: seed + i * 3.3, squash: 0.85 });
      const ox = lean + (trng() - 0.5) * height * 0.55;
      const oy = height * (0.9 + trng() * 0.28);
      const oz = (trng() - 0.5) * height * 0.55;
      geo.translate(ox, oy, oz);
      paintVertices(geo, (p, n) => {
        const t = clamp((p.y - height * 0.7) / (height * 0.8), 0, 1);
        const c = new THREE.Color(0.02, 0.075, 0.03).lerp(new THREE.Color(0.1, 0.27 + hueShift * 0.06, 0.06), t * 0.9 + n.y * 0.12);
        c.offsetHSL(hueShift * 0.03, 0, (trng() - 0.5) * 0.03);
        return c;
      });
      blobs.push(geo);
    }
    const canopy = new THREE.Mesh(
      mergeGeometries(blobs),
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true, emissive: new THREE.Color(0x0a3a14), emissiveIntensity: 0.16 }),
    );
    canopy.castShadow = true;
    g.add(canopy);
    island.add(g);
    return g;
  };
  makeTree(-1.55, -0.75, 2.7, 101, 0);
  makeTree(1.8, 1.3, 1.7, 202, 1);
  makeTree(-0.4, -2.0, 1.25, 303, -1);

  // ---------------------------------------------------------------- boulders
  {
    const spots = [
      [1.9, -1.4, 0.5],
      [-0.6, 1.8, 0.42],
      [2.4, 0.2, 0.3],
      [-2.4, -0.4, 0.36],
      [0.3, 2.4, 0.28],
    ];
    const geos = spots.map(([x, z, s], i) => {
      const g = rockGeometry({ radius: 1, detail: 2, amp: 0.5, freq: 1.3, seed: 40 + i * 7, squash: 0.7 });
      paintVertices(g, (p, n) => {
        const moss = smoothstep(0.35, 0.75, n.y);
        return new THREE.Color(0.075, 0.07, 0.075).multiplyScalar(0.8 + 0.4 * (fbm(p.x * 3, p.y * 3, p.z * 3, 2) * 0.5 + 0.5)).lerp(new THREE.Color(0.04, 0.12, 0.035), moss * 0.85);
      });
      g.scale(s, s, s);
      g.rotateY(rng() * TAU);
      g.translate(x, topY(x, z) + s * 0.1, z);
      return g;
    });
    const rocks = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }));
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    island.add(rocks);
  }

  // ---------------------------------------------------------------- hanging roots
  {
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x3b2517, roughness: 0.9, emissive: 0x1a0d05, emissiveIntensity: 0.25 });
    const geos = [];
    for (let i = 0; i < 16; i++) {
      const a = rng() * TAU;
      const r = 0.4 + rng() * 2.5;
      const x0 = Math.cos(a) * r;
      const z0 = Math.sin(a) * r;
      // start just inside the underside surface, then dangle with a lazy curve
      const y0 = undersideY(r) + 0.35;
      const len = 0.6 + rng() * 1.1;
      const sway = (rng() - 0.5) * 1.2;
      const pts = [
        new THREE.Vector3(x0, y0 + 0.25, z0),
        new THREE.Vector3(x0 + sway * 0.25, y0 - len * 0.33, z0 + sway * 0.1),
        new THREE.Vector3(x0 + sway * 0.7, y0 - len * 0.7, z0 - sway * 0.2),
        new THREE.Vector3(x0 + sway, y0 - len, z0 + sway * 0.3),
      ];
      geos.push(taperedTube(pts, 0.09 + rng() * 0.09, 7, 22, 0.05));
    }
    const roots = new THREE.Mesh(mergeGeometries(geos), rootMat);
    roots.castShadow = true;
    island.add(roots);
  }

  // ---------------------------------------------------------------- orbiting debris
  const debris = [];
  {
    const variants = [0, 1, 2].map((i) => rockGeometry({ radius: 1, detail: 1, amp: 0.55, freq: 1.5, seed: 70 + i * 9, squash: 0.8 }));
    variants.forEach((g) =>
      paintVertices(g, (p, n) => new THREE.Color(0.1, 0.085, 0.08).multiplyScalar(0.8 + 0.5 * (fbm(p.x * 2, p.y * 2, p.z * 2, 2) * 0.5 + 0.5)).lerp(new THREE.Color(0.04, 0.11, 0.035), smoothstep(0.5, 0.9, n.y) * 0.6)),
    );
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
    const meshes = variants.map((g, i) => {
      const m = new THREE.InstancedMesh(g, mat, 6);
      m.castShadow = true;
      m.frustumCulled = false;
      group.add(m);
      return m;
    });
    for (let i = 0; i < 18; i++) {
      debris.push({
        mesh: meshes[i % 3],
        slot: Math.floor(i / 3),
        r: 4.9 + rng() * 2.2,
        y: 1.4 + rng() * 5.2,
        a: rng() * TAU,
        speed: (0.08 + rng() * 0.12) * (rng() > 0.35 ? 1 : -1),
        s: 0.14 + rng() * 0.34,
        spin: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).multiplyScalar(0.9),
        rot: new THREE.Vector3(rng() * 6, rng() * 6, rng() * 6),
        bob: rng() * TAU,
      });
    }
  }

  // ---------------------------------------------------------------- fireflies + dust
  {
    const N = 110;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(randomArray(rng, N, 4), 4));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uScale: pointScale },
      vertexShader: FIREFLY_VERT,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.0, d);
          gl_FragColor = vec4(vec3(1.0, 1.0, 0.35) * 2.6, a * a * vA);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const flies = new THREE.Points(g, m);
    flies.frustumCulled = false;
    flies.position.y = 0.5;
    island.add(flies);

    const D = 200;
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(D * 3), 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(randomArray(rng, D, 4), 4));
    const dm = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uScale: pointScale },
      vertexShader: DUST_VERT,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.0, d);
          gl_FragColor = vec4(vec3(0.55, 0.38, 0.22) * 1.3, a * a * vA * 0.75);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dg, dm);
    dust.frustumCulled = false;
    island.add(dust);
  }

  // soft green glow around the crystals
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: ctx.softSprite, color: new THREE.Color(0.15, 0.85, 0.35), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.3 }),
  );
  glow.scale.setScalar(5.2);
  glow.position.set(0.5, 1.4, 0);
  island.add(glow);

  // ---------------------------------------------------------------- update
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();
  const _p = new THREE.Vector3();
  const _s = new THREE.Vector3();
  let spin = 0;
  function update(t, dt) {
    const p = power.value;
    spin += dt * (0.045 + 0.25 * p);
    island.rotation.y = spin;
    const shake = p * 0.03;
    island.position.set(Math.sin(t * 47.0) * shake, ISLAND_Y + Math.sin(t * 0.7) * 0.16 + p * 0.22 + Math.sin(t * 53.0) * shake, Math.cos(t * 41.0) * shake);
    island.updateMatrixWorld(true);

    // crystal / amber positions in world space (for grass lighting)
    crystalWorld.set(0.5, 1.2, 0);
    island.localToWorld(crystalWorld);
    amberWorld.set(-1.5, 0.8, 1.0);
    island.localToWorld(amberWorld);

    grassUniforms.uWind.value = p;
    grassUniforms.uPower.value = p;
    emeraldMat.emissiveIntensity = 0.95 + 1.6 * p + 0.12 * Math.sin(t * 1.8);
    amberMat.emissiveIntensity = 0.55 + 1.0 * p + 0.08 * Math.sin(t * 2.3 + 1);
    crystalLight.intensity = (20 + Math.sin(t * 1.8) * 3) * (1 + 1.4 * p);
    amberLight.intensity = 5 * (1 + 0.6 * p);
    glow.material.opacity = 0.26 + 0.3 * p;

    for (const d of debris) {
      d.a += dt * d.speed * (1 + 1.5 * p);
      _p.set(Math.cos(d.a) * d.r, d.y + Math.sin(t * 0.6 + d.bob) * 0.25, Math.sin(d.a) * d.r);
      d.rot.addScaledVector(d.spin, dt);
      _e.set(d.rot.x, d.rot.y, d.rot.z);
      _q.setFromEuler(_e);
      _s.setScalar(d.s);
      _m.compose(_p, _q, _s);
      d.mesh.setMatrixAt(d.slot, _m);
    }
    for (const m of new Set(debris.map((d) => d.mesh))) m.instanceMatrix.needsUpdate = true;
  }

  return {
    id: 'earth',
    group,
    update,
    setPower: (v) => (power.value = v),
    focus: new THREE.Vector3(0, 4.6, 0),
    radius: 5.0,
    viewDistance: 14,
    debug: { island, crystalLight },
  };
}
