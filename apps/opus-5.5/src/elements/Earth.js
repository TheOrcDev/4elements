import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { patchMaterial } from '../gl/patch.js';
import { bumpGLSL } from '../gl/glsl.js';
import { Noise3, mulberry32 } from '../gl/noise.js';
import { createPedestal } from '../world/Platform.js';
import { makeRockGeometry } from '../world/rocks.js';
import { makeLeafGeometry } from './Air.js';
import { PEDESTAL_TOP, stationPosition } from '../config.js';

const ISLAND_Y = 3.6;
const R = 1.72;
const LIP = 0.22;
const DEPTH = 2.0;
const noise = new Noise3(1234);

const radiusMod = (phi) =>
  1 +
  0.1 * Math.sin(2 * phi + 0.5) +
  0.07 * Math.sin(3 * phi + 1.8) +
  0.04 * Math.sin(5 * phi + 0.3) +
  0.05 * noise.noise(Math.cos(phi) * 2.2, 9.1, Math.sin(phi) * 2.2) +
  0.02 * noise.noise(Math.cos(phi) * 6.0, 3.3, Math.sin(phi) * 6.0);
function topHeight(x, z, rho) {
  return 0.12 * (1 - rho * rho) + 0.07 * noise.fbm(x * 0.9 + 3, 0.5, z * 0.9 + 7, 3) + 0.025 * noise.noise(x * 2.7, 1.3, z * 2.7);
}

/**
 * Island surface point from a profile parameter s ∈ [0,1] (0 top centre → 1 bottom tip) and angle phi.
 * Returns local position + zone info used for colouring.
 */
function islandPoint(s, phi, out) {
  const m = radiusMod(phi);
  const cx = Math.cos(phi), cz = Math.sin(phi);
  const S_TOP = 0.42, S_LIP = 0.5;
  if (s <= S_TOP) {
    const rho = s / S_TOP;
    const r = rho * R * m;
    const x = cx * r, z = cz * r;
    out.set(x, topHeight(x, z, rho), z);
    return { zone: 0, v: rho };
  }
  const ex = cx * R * m, ez = cz * R * m;
  const yEdge = topHeight(ex, ez, 1);
  if (s <= S_LIP) {
    const k = (s - S_TOP) / (S_LIP - S_TOP);
    const bulge = Math.sin(k * Math.PI) * 0.06;
    const r = R * m * (1 + bulge) - k * k * 0.05;
    out.set(cx * r, yEdge - k * LIP, cz * r);
    return { zone: 1, v: k };
  }
  const v = (s - S_LIP) / (1 - S_LIP);
  // jagged underside: vertical ridges + hanging spurs
  const ridge = noise.ridged(cx * 2.4, v * 1.3, cz * 2.4, 4);
  const lumps = noise.fbm(cx * 1.3 + 11, v * 2.2, cz * 1.3 + 5, 3);
  const spur = Math.max(0, noise.noise(cx * 1.7 + 4, 0.2, cz * 1.7 + 2)) * 0.9;
  // bulbous upper body that tapers into a point, like an uprooted mountain
  let r = R * m * Math.pow(1 - v, 0.62) * (1 - 0.18 * v * v) * 0.99;
  r *= 1 + (ridge - 0.55) * 0.42 * Math.sin(Math.PI * Math.min(1, v * 1.3)) + lumps * 0.22 * (1 - v);
  const depth = DEPTH * (1 + spur * 0.35) + lumps * 0.2;
  // converge to a single clean tip
  const y = THREE.MathUtils.lerp(yEdge - LIP - Math.pow(v, 0.95) * depth, -LIP - DEPTH * 1.12, THREE.MathUtils.smoothstep(v, 0.86, 1.0));
  out.set(cx * Math.max(r, 0), y, cz * Math.max(r, 0));
  return { zone: 2, v };
}

function buildIslandGeometry() {
  const NS = 200, NR = 150;
  const pos = [], col = [];
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  const grassA = new THREE.Color('#2a611c'), grassB = new THREE.Color('#5a9a2c'), grassC = new THREE.Color('#8db43e');
  const soilA = new THREE.Color('#4a301c'), soilB = new THREE.Color('#72502f');
  const rockA = new THREE.Color('#5e5146'), rockB = new THREE.Color('#978672'), rockC = new THREE.Color('#2f2822');
  const moss = new THREE.Color('#3c6424');
  for (let i = 0; i <= NR; i++) {
    const s = i / NR;
    for (let j = 0; j <= NS; j++) {
      const phi = (j / NS) * Math.PI * 2;
      const info = islandPoint(s, phi, p);
      pos.push(p.x, p.y, p.z);
      const n1 = noise.fbm(p.x * 2.1, p.y * 2.1, p.z * 2.1, 3) * 0.5 + 0.5;
      const n2 = noise.noise(p.x * 6.3, p.y * 6.3, p.z * 6.3) * 0.5 + 0.5;
      if (info.zone === 0) {
        c.copy(grassA).lerp(grassB, n1).lerp(grassC, Math.max(0, n2 - 0.55) * 1.2);
        // bare soil peeking near the edge
        const bare = THREE.MathUtils.smoothstep(info.v, 0.9, 1.0) * 0.6;
        c.lerp(soilB, bare * n2);
      } else if (info.zone === 1) {
        c.copy(grassA).lerp(soilA, THREE.MathUtils.smoothstep(info.v, 0.15, 0.6)).lerp(soilB, n2 * 0.4);
      } else {
        const v = info.v;
        const strata = 0.5 + 0.5 * Math.sin(p.y * 11 + n1 * 4.0);
        const band = Math.pow(0.5 + 0.5 * Math.sin(p.y * 4.3 + n1 * 1.5), 6);
        c.copy(rockA).lerp(rockB, strata * 0.55 + n2 * 0.35).lerp(rockC, THREE.MathUtils.smoothstep(v, 0.45, 1.0) * 0.65);
        c.lerp(soilB, band * 0.45);
        if (v < 0.12) c.lerp(soilA, 1 - v / 0.12);
        const m = THREE.MathUtils.smoothstep(n1, 0.55, 0.75) * (1 - THREE.MathUtils.smoothstep(v, 0.1, 0.45));
        c.lerp(moss, m * 0.8);
      }
      col.push(c.r, c.g, c.b);
    }
  }
  const index = [];
  const row = NS + 1;
  for (let i = 0; i < NR; i++) {
    for (let j = 0; j < NS; j++) {
      const a = i * row + j, b = a + row;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(index);
  geo = mergeVertices(geo, 1e-5);
  geo.computeVertexNormals();
  return geo;
}

export class Earth {
  constructor(ctx, def) {
    this.def = def;
    this.ctx = ctx;
    this.group = new THREE.Group();
    this.group.name = 'earth';
    stationPosition(def, this.group.position);
    this.rand = mulberry32(2718);

    this.pedestal = createPedestal(ctx, def);
    this.group.add(this.pedestal.mesh);

    this.island = new THREE.Group();
    this.island.position.y = ISLAND_Y;
    this.group.add(this.island);

    this.#buildIsland(ctx);
    this.#buildGrass(ctx);
    this.#buildTree(ctx);
    this.#buildHangings();
    this.#buildBoulders();
    this.#buildCrystals(ctx);
    this.#buildOrbiters();
    this.#buildDust(ctx);
    this.#buildFireflies(ctx);

    this.light = new THREE.PointLight(0x7dffb8, 1.7, 5.5, 2);
    this.light.position.set(0.15, ISLAND_Y - 1.55, 0.1);
    this.group.add(this.light);

    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.6, 5.6, 16), new THREE.MeshBasicMaterial());
    this.hit.position.y = 2.9;
    this.hit.visible = false;
    this.hit.userData.elementId = def.id;
    this.group.add(this.hit);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
  }

  #buildIsland(ctx) {
    const geo = buildIslandGeometry();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
    patchMaterial(mat, {
      key: 'island',
      uniforms: { uNoise3D: { value: ctx.noise3D } },
      vertexHeader: 'varying vec3 vObj; varying vec3 vObjN;',
      vertex: { begin_vertex: '#include <begin_vertex>\nvObj = position; vObjN = normal;' },
      fragmentHeader: `uniform sampler3D uNoise3D; varying vec3 vObj; varying vec3 vObjN;\n${bumpGLSL}\nfloat gH;`,
      fragment: {
        color_fragment: /* glsl */ `
          #include <color_fragment>
          {
            vec4 n = texture(uNoise3D, vObj * 0.9);
            vec4 f = texture(uNoise3D, vObj * 3.1 + 0.37);
            float grassy = smoothstep(0.55, 0.85, vObjN.y);
            diffuseColor.rgb *= 0.72 + 0.5 * n.r * (0.7 + 0.6 * f.g);
            // tiny highlights in the grass, cracks in the rock
            diffuseColor.rgb *= mix(1.0 - 0.35 * smoothstep(0.62, 0.8, f.b), 1.0 + 0.25 * smoothstep(0.6, 0.9, f.r), grassy);
            gH = (f.g * 0.012 + n.r * 0.02) * (1.0 - grassy * 0.7) - smoothstep(0.62, 0.8, f.b) * 0.01 * (1.0 - grassy);
          }`,
        normal_fragment_maps: 'normal = perturbNormalH(-vViewPosition, normal, gH, faceDirection);',
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.island.add(mesh);
    this.islandMat = mat;
  }

  #randomTopPoint(maxRho = 0.92) {
    const phi = this.rand() * Math.PI * 2;
    const rho = Math.sqrt(this.rand()) * maxRho;
    const r = rho * R * radiusMod(phi);
    const x = Math.cos(phi) * r, z = Math.sin(phi) * r;
    return new THREE.Vector3(x, topHeight(x, z, rho), z);
  }

  #buildGrass(ctx) {
    const count = ctx.quality.grass;
    const w = 0.028;
    const geo = new THREE.BufferGeometry();
    const verts = [-w / 2, 0, 0, w / 2, 0, 0, -w * 0.42, 0.35, 0, w * 0.42, 0.35, 0, -w * 0.25, 0.7, 0, w * 0.25, 0.7, 0, 0, 1, 0];
    const uvs = [0, 0, 1, 0, 0, 0.35, 1, 0.35, 0, 0.7, 1, 0.7, 0.5, 1];
    const normals = [];
    for (let i = 0; i < 7; i++) normals.push(0, 0.55, 0.83);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6]);

    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, metalness: 0, side: THREE.DoubleSide });
    patchMaterial(mat, {
      key: 'grass',
      uniforms: { uTime: ctx.uniforms.uTime },
      vertexHeader: 'uniform float uTime; varying float vH;',
      vertex: {
        begin_vertex: /* glsl */ `
          #include <begin_vertex>
          vH = uv.y;
          {
            vec3 root = instanceMatrix[3].xyz;
            float gust = sin(uTime * 1.7 + root.x * 2.3 + root.z * 1.9) * 0.6 + sin(uTime * 2.9 + root.z * 4.1) * 0.25;
            float bendAmt = uv.y * uv.y * (0.18 + 0.1 * gust);
            transformed.z += bendAmt * (0.6 + 0.4 * gust);
            transformed.x += bendAmt * 0.3 * sin(uTime * 2.2 + root.x * 5.0);
            transformed.y -= bendAmt * 0.25;
          }`,
      },
      fragmentHeader: 'varying float vH;',
      fragment: {
        color_fragment: /* glsl */ `
          #include <color_fragment>
          diffuseColor.rgb *= mix(0.28, 1.15, vH);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.35, 1.2, 0.55), smoothstep(0.75, 1.0, vH) * 0.5);`,
      },
    });
    const grass = new THREE.InstancedMesh(geo, mat, count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
    const greens = ['#3d7a22', '#4f8f2a', '#5f9e33', '#6fae3c', '#86b545', '#9fbf52'].map((h) => new THREE.Color(h));
    let placed = 0;
    while (placed < count) {
      const p = this.#randomTopPoint(0.95);
      if (Math.hypot(p.x - 0.1, p.z + 0.05) < 0.22) continue; // keep the trunk base clear
      e.set((this.rand() - 0.5) * 0.35, this.rand() * Math.PI * 2, (this.rand() - 0.5) * 0.35);
      q.setFromEuler(e);
      const hgt = 0.12 + this.rand() * 0.2;
      s.set(0.8 + this.rand() * 0.6, hgt, 1);
      m.compose(p, q, s);
      grass.setMatrixAt(placed, m);
      grass.setColorAt(placed, greens[(this.rand() * greens.length) | 0].clone().multiplyScalar(0.75 + this.rand() * 0.4));
      placed++;
    }
    grass.receiveShadow = true;
    this.island.add(grass);

    // a sprinkle of tiny flowers
    const fcount = 70;
    const fgeo = new THREE.IcosahedronGeometry(0.018, 0);
    const fmat = new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.12 });
    const flowers = new THREE.InstancedMesh(fgeo, fmat, fcount);
    const fcols = ['#fff6e0', '#ffd6f0', '#fff27a', '#cfe3ff'].map((h) => new THREE.Color(h));
    for (let i = 0; i < fcount; i++) {
      const p = this.#randomTopPoint(0.9);
      p.y += 0.08 + this.rand() * 0.1;
      m.compose(p, q.identity(), s.setScalar(0.7 + this.rand() * 0.8));
      flowers.setMatrixAt(i, m);
      flowers.setColorAt(i, fcols[i % fcols.length]);
    }
    this.island.add(flowers);
  }

  #buildTree(ctx) {
    const tree = new THREE.Group();
    const base = new THREE.Vector3(0.1, topHeight(0.1, -0.05, 0.05) - 0.03, -0.05);
    tree.position.copy(base);
    tree.scale.setScalar(1.12);
    this.island.add(tree);
    this.tree = tree;

    const barkMat = new THREE.MeshStandardMaterial({ color: '#5a4230', roughness: 0.9, metalness: 0 });
    this.barkMat = barkMat;
    patchMaterial(barkMat, {
      key: 'bark',
      uniforms: { uNoise2D: { value: ctx.noise2D } },
      vertexHeader: 'varying vec2 vUv2;',
      vertex: { begin_vertex: '#include <begin_vertex>\nvUv2 = uv;' },
      fragmentHeader: `uniform sampler2D uNoise2D; varying vec2 vUv2;\n${bumpGLSL}\nfloat bH;`,
      fragment: {
        color_fragment: /* glsl */ `
          #include <color_fragment>
          {
            vec4 n = texture(uNoise2D, vec2(vUv2.y * 3.0, vUv2.x * 0.5));
            vec4 f = texture(uNoise2D, vec2(vUv2.y * 9.0, vUv2.x * 2.0) + 0.3);
            float furrow = smoothstep(0.55, 0.85, f.a);
            diffuseColor.rgb *= (0.75 + 0.45 * n.r) * (1.0 - furrow * 0.55);
            bH = -furrow * 0.006 + n.g * 0.004;
          }`,
        normal_fragment_maps: 'normal = perturbNormalH(-vViewPosition, normal, bH, faceDirection);',
      },
    });

    const makeLimb = (points, r0, r1, flare = 0) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubular = 36, radial = 10;
      const geo = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
      const pos = geo.attributes.position;
      const center = new THREE.Vector3();
      const v = new THREE.Vector3();
      for (let i = 0; i <= tubular; i++) {
        const u = i / tubular;
        curve.getPointAt(u, center);
        const rad = THREE.MathUtils.lerp(r0, r1, Math.pow(u, 0.7)) + flare * Math.pow(1 - u, 6);
        for (let j = 0; j <= radial; j++) {
          const idx = i * (radial + 1) + j;
          v.fromBufferAttribute(pos, idx).sub(center);
          const knot = 1 + 0.08 * Math.sin(u * 23 + j) * Math.sin(j * 1.7);
          v.multiplyScalar(rad * knot).add(center);
          pos.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, barkMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
      return curve;
    };

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const trunk = makeLimb([V(0, -0.05, 0), V(0.04, 0.35, 0.02), V(-0.05, 0.75, 0.05), V(0.03, 1.1, -0.02), V(0.08, 1.38, 0.0)], 0.15, 0.05, 0.12);
    const clusters = [{ c: V(0.08, 1.66, 0.0), r: 0.6 }];
    const branchDefs = [
      { u: 0.55, dir: V(0.62, 0.32, 0.18), len: 0.62 },
      { u: 0.66, dir: V(-0.55, 0.42, -0.25), len: 0.6 },
      { u: 0.78, dir: V(-0.1, 0.4, 0.62), len: 0.5 },
      { u: 0.86, dir: V(0.25, 0.45, -0.6), len: 0.5 },
    ];
    for (const b of branchDefs) {
      const start = trunk.getPointAt(b.u);
      const d = b.dir.clone().normalize();
      const mid = start.clone().addScaledVector(d, b.len * 0.5).add(V(0, 0.05, 0));
      const end = start.clone().addScaledVector(d, b.len).add(V(0, 0.12, 0));
      makeLimb([start, mid, end], 0.05, 0.015);
      clusters.push({ c: end.clone().add(V(0, 0.12, 0)), r: 0.36 + this.rand() * 0.12 });
    }

    // Canopy: dark filler blobs + thousands of instanced leaves
    const blobMat = new THREE.MeshStandardMaterial({ color: '#16301a', roughness: 0.9 });
    for (const cl of clusters) {
      const g = makeRockGeometry(Math.floor(this.rand() * 1000), { detail: 3, roughness: 0.25, colorA: '#ffffff', colorB: '#ffffff' });
      const blob = new THREE.Mesh(g, blobMat);
      blob.position.copy(cl.c);
      blob.scale.setScalar(cl.r * 0.78);
      blob.castShadow = true;
      tree.add(blob);
    }
    const leafCount = ctx.quality.leaves;
    const leafGeo = makeLeafGeometry();
    leafGeo.scale(0.075, 0.11, 0.075);
    const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0, side: THREE.DoubleSide });
    patchMaterial(leafMat, {
      key: 'tree-leaves',
      uniforms: { uTime: ctx.uniforms.uTime },
      vertexHeader: 'uniform float uTime;',
      vertex: {
        begin_vertex: /* glsl */ `
          #include <begin_vertex>
          {
            vec3 root = instanceMatrix[3].xyz;
            float f = sin(uTime * 3.1 + root.x * 17.0 + root.y * 11.0) * sin(uTime * 1.7 + root.z * 13.0);
            transformed.z += f * 0.35 * (position.y + 0.06);
          }`,
      },
      // a touch of light scattering through the foliage keeps the canopy readable at night
      fragment: { emissivemap_fragment: 'totalEmissiveRadiance += diffuseColor.rgb * 0.1;' },
    });
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    const greens = ['#2f6b2a', '#3a7d2e', '#4f9436', '#65a83e', '#7fbd47', '#9fcf55', '#b9c24a'].map((h) => new THREE.Color(h));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), n = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < leafCount; i++) {
      const cl = clusters[i % clusters.length];
      n.set(this.rand() * 2 - 1, this.rand() * 2 - 1, this.rand() * 2 - 1).normalize();
      const rr = cl.r * (0.72 + 0.3 * Math.sqrt(this.rand()));
      p.copy(cl.c).addScaledVector(n, rr);
      p.y -= Math.max(0, -n.y) * cl.r * 0.35; // flatter underside
      q.setFromUnitVectors(up, n.clone().add(new THREE.Vector3((this.rand() - 0.5), (this.rand() - 0.5), (this.rand() - 0.5))).normalize());
      q.multiply(new THREE.Quaternion().setFromAxisAngle(up, this.rand() * Math.PI * 2));
      s.setScalar(0.75 + this.rand() * 0.6);
      m.compose(p, q, s);
      leaves.setMatrixAt(i, m);
      const light = THREE.MathUtils.clamp(0.55 + n.y * 0.35 + this.rand() * 0.25, 0.3, 1.2);
      leaves.setColorAt(i, greens[(this.rand() * greens.length) | 0].clone().multiplyScalar(light));
    }
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    tree.add(leaves);
    this.clusters = clusters;
  }

  /** Rocky stalactites under the island and roots dangling from its lip. */
  #buildHangings() {
    const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
    const p = new THREE.Vector3();
    const cTop = new THREE.Color('#6b5d50'), cTip = new THREE.Color('#2c2621'), c = new THREE.Color();
    for (let i = 0; i < 9; i++) {
      const phi = (i / 9) * Math.PI * 2 + this.rand() * 0.5;
      const s = 0.62 + this.rand() * 0.2;
      islandPoint(s, phi, p);
      const len = 0.45 + this.rand() * 0.75;
      const rad = 0.1 + this.rand() * 0.12;
      const geo = new THREE.CylinderGeometry(rad, 0.004, len, 9, 12);
      geo.translate(0, -len / 2, 0);
      const pos = geo.attributes.position;
      const cols = new Float32Array(pos.count * 3);
      for (let k = 0; k < pos.count; k++) {
        const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
        const n = noise.fbm(x * 6 + i, y * 3, z * 6, 3);
        const f = 1 + n * 0.45;
        pos.setXYZ(k, x * f, y, z * f);
        c.copy(cTop).lerp(cTip, Math.min(1, -y / len) * 0.9 + n * 0.2);
        cols.set([c.r, c.g, c.b], k * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      geo.computeVertexNormals();
      const st = new THREE.Mesh(geo, rockMat);
      st.position.copy(p).multiplyScalar(0.9);
      st.position.y = p.y + 0.12;
      st.rotation.set((this.rand() - 0.5) * 0.25, this.rand() * 6, (this.rand() - 0.5) * 0.25);
      st.castShadow = true;
      this.island.add(st);
    }

    // dangling roots
    for (let i = 0; i < 16; i++) {
      const phi = this.rand() * Math.PI * 2;
      islandPoint(0.47 + this.rand() * 0.05, phi, p);
      const out = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi));
      const p0 = p.clone().addScaledVector(out, -0.04);
      const drop = 0.4 + this.rand() * 0.9;
      const p1 = p0.clone().addScaledVector(out, 0.1).add(new THREE.Vector3(0, -drop * 0.3, 0));
      const p2 = p1.clone().addScaledVector(out, 0.04 + this.rand() * 0.05).add(new THREE.Vector3((this.rand() - 0.5) * 0.1, -drop * 0.35, (this.rand() - 0.5) * 0.1));
      const p3 = p2.clone().add(new THREE.Vector3((this.rand() - 0.5) * 0.12, -drop * 0.35, (this.rand() - 0.5) * 0.12));
      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
      const geo = new THREE.TubeGeometry(curve, 24, 1, 5, false);
      const pos = geo.attributes.position;
      const center = new THREE.Vector3(), v = new THREE.Vector3();
      const r0 = 0.012 + this.rand() * 0.014;
      for (let a = 0; a <= 24; a++) {
        curve.getPointAt(a / 24, center);
        const rad = r0 * (1 - (a / 24) * 0.85);
        for (let b = 0; b <= 5; b++) {
          const idx = a * 6 + b;
          v.fromBufferAttribute(pos, idx).sub(center).multiplyScalar(rad).add(center);
          pos.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      geo.computeVertexNormals();
      const root = new THREE.Mesh(geo, this.barkMat);
      root.castShadow = true;
      this.island.add(root);
    }
  }

  #buildBoulders() {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    const spots = [[-0.75, 0.55, 0.22], [-0.95, 0.2, 0.14], [0.8, -0.7, 0.18], [0.55, 0.9, 0.12]];
    spots.forEach(([x, z, sc], i) => {
      const rock = new THREE.Mesh(makeRockGeometry(50 + i, { detail: 3, roughness: 0.4, colorA: '#4a433c', colorB: '#7a7064' }), mat);
      const rho = Math.hypot(x, z) / R;
      rock.position.set(x, topHeight(x, z, rho) + sc * 0.3, z);
      rock.scale.set(sc, sc * 0.75, sc);
      rock.rotation.y = i * 1.7;
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.island.add(rock);
    });
  }

  #buildCrystals(ctx) {
    const prof = [[0, -0.12], [0.1, -0.02], [0.105, 0.62], [0.0, 0.92]].map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(prof, 6);
    const mat = new THREE.MeshPhysicalMaterial({
      color: '#3cf29a',
      emissive: '#0c9a58',
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      iridescence: 0.5,
      iridescenceIOR: 1.6,
      flatShading: true,
      envMapIntensity: 1.6,
    });
    patchMaterial(mat, {
      key: 'crystal',
      uniforms: { uTime: ctx.uniforms.uTime },
      vertexHeader: 'varying float vCy; varying vec3 vCRoot;',
      vertex: { begin_vertex: '#include <begin_vertex>\nvCy = position.y / 0.92;\nvCRoot = instanceMatrix[3].xyz;' },
      fragmentHeader: 'uniform float uTime; varying float vCy; varying vec3 vCRoot;',
      fragment: {
        emissivemap_fragment: /* glsl */ `
          float pulse = 0.65 + 0.35 * sin(uTime * 1.4 + vCRoot.x * 6.0 + vCRoot.z * 4.0);
          totalEmissiveRadiance *= (0.25 + 1.5 * smoothstep(0.0, 1.0, vCy)) * pulse;`,
      },
    });

    const placements = [];
    const p = new THREE.Vector3(), p2 = new THREE.Vector3(), nrm = new THREE.Vector3();
    const addOnSurface = (s, phi, size, outward = 0.6, sink = 0.08) => {
      islandPoint(s, phi, p);
      islandPoint(Math.min(s + 0.01, 1), phi, p2);
      // outward normal ≈ radial direction blended with surface slope
      nrm.set(Math.cos(phi), 0, Math.sin(phi));
      const dir = nrm.clone().multiplyScalar(outward).add(new THREE.Vector3(0, s > 0.5 ? -1 : 1, 0)).normalize();
      placements.push({ pos: p.clone().addScaledVector(dir, -sink * size), dir, size });
    };
    // hanging cluster near the tip
    for (let i = 0; i < 7; i++) addOnSurface(0.9 + this.rand() * 0.07, this.rand() * Math.PI * 2, 0.5 + this.rand() * 0.55, 0.45 + this.rand() * 0.4);
    // shards around the underside
    for (let i = 0; i < 12; i++) addOnSurface(0.58 + this.rand() * 0.28, this.rand() * Math.PI * 2, 0.22 + this.rand() * 0.3, 0.9);
    // an upright cluster on the rim
    const rimPhi = 2.4;
    for (let i = 0; i < 5; i++) addOnSurface(0.37 + this.rand() * 0.04, rimPhi + (this.rand() - 0.5) * 0.35, 0.35 + this.rand() * 0.4, 0.35 + this.rand() * 0.5, 0.02);

    const crystals = new THREE.InstancedMesh(geo, mat, placements.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    const upY = new THREE.Vector3(0, 1, 0);
    placements.forEach((pl, i) => {
      q.setFromUnitVectors(upY, pl.dir);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(upY, this.rand() * Math.PI));
      s.set(pl.size * (0.8 + this.rand() * 0.4), pl.size, pl.size * (0.8 + this.rand() * 0.4));
      m.compose(pl.pos, q, s);
      crystals.setMatrixAt(i, m);
    });
    crystals.castShadow = true;
    this.island.add(crystals);
  }

  #buildOrbiters() {
    this.orbiters = [];
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    const geos = [0, 1, 2, 3].map((i) => makeRockGeometry(300 + i, { detail: 2, roughness: 0.5, colorA: '#3d3630', colorB: '#6a5f53' }));
    for (let i = 0; i < 14; i++) {
      const rock = new THREE.Mesh(geos[i % 4], mat);
      const sc = 0.06 + Math.pow(this.rand(), 2) * 0.2;
      rock.scale.setScalar(sc);
      rock.castShadow = true;
      this.group.add(rock);
      this.orbiters.push({
        mesh: rock,
        r: 2.0 + this.rand() * 1.1,
        a: this.rand() * Math.PI * 2,
        w: (0.08 + this.rand() * 0.18) * (this.rand() > 0.25 ? 1 : -1),
        y: ISLAND_Y - 1.9 + this.rand() * 2.1,
        bob: this.rand() * 10,
        spin: new THREE.Vector3(this.rand(), this.rand(), this.rand()).multiplyScalar(0.8),
      });
    }
  }

  #buildDust(ctx) {
    const count = 160;
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) seeds.set([this.rand(), this.rand(), this.rand(), this.rand()], i * 4);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uScale: ctx.uniforms.uPointScale },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime;
        uniform float uScale;
        varying float vA;
        void main() {
          float life = 2.2 + aSeed.x * 2.0;
          float age = mod(uTime + aSeed.y * 13.0, life);
          float k = age / life;
          float a = aSeed.z * 6.2831853;
          float r = sqrt(aSeed.w) * 0.9;
          vec3 p = vec3(cos(a) * r, ${(ISLAND_Y - 1.3).toFixed(2)} - aSeed.w * 0.6, sin(a) * r);
          p.y -= 0.5 * 0.9 * age * age;
          p.x += sin(age * 2.0 + aSeed.x * 20.0) * 0.05;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max((0.012 + aSeed.x * 0.014) * uScale / -mv.z, 1.0);
          vA = smoothstep(0.0, 0.1, k) * (1.0 - smoothstep(0.6, 1.0, k)) * step(${(PEDESTAL_TOP + 0.02).toFixed(2)}, p.y);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(vec3(0.62, 0.5, 0.36) * a * vA * 0.5, a * vA * 0.8);
        }`,
      transparent: true,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.group.add(pts);
  }

  #buildFireflies(ctx) {
    const count = 36;
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) seeds.set([this.rand(), this.rand(), this.rand(), this.rand()], i * 4);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uScale: ctx.uniforms.uPointScale },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime;
        uniform float uScale;
        varying float vA;
        void main() {
          float t = uTime * (0.25 + aSeed.x * 0.2);
          float a = aSeed.y * 6.2831853 + t;
          float r = 0.6 + aSeed.z * 1.4 + sin(t * 1.7 + aSeed.w * 9.0) * 0.2;
          vec3 p = vec3(cos(a) * r, ${(ISLAND_Y + 0.4).toFixed(2)} + aSeed.w * 1.8 + sin(t * 2.3 + aSeed.x * 7.0) * 0.25, sin(a) * r);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(0.05 * uScale / -mv.z, 1.5);
          float blink = sin(uTime * (1.3 + aSeed.z * 1.5) + aSeed.y * 40.0);
          vA = smoothstep(0.2, 0.9, blink);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float core = smoothstep(0.5, 0.0, d);
          core = core * core * core;
          gl_FragColor = vec4(vec3(0.75, 1.0, 0.35) * core * vA * 6.0, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.group.add(pts);
  }

  update(time) {
    this.island.position.y = ISLAND_Y + Math.sin(time * 0.6) * 0.07;
    this.island.rotation.y = time * 0.045;
    this.island.rotation.z = Math.sin(time * 0.37) * 0.012;
    this.tree.rotation.z = Math.sin(time * 0.8) * 0.012;
    this.tree.rotation.x = Math.sin(time * 0.63 + 1) * 0.01;
    for (const o of this.orbiters) {
      const a = o.a + time * o.w;
      o.mesh.position.set(Math.cos(a) * o.r, o.y + Math.sin(time * 0.5 + o.bob) * 0.15, Math.sin(a) * o.r);
      o.mesh.rotation.set(time * o.spin.x, time * o.spin.y, time * o.spin.z);
    }
    this.light.intensity = 1.7 + Math.sin(time * 1.4) * 0.35;
  }
}
