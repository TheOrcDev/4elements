import * as THREE from "three";
import { simplexNoise3D, hashNoise2D } from "../glsl/noise.js";

// Earth: a procedural terrain slab displaced by fbm noise, colored by
// height & slope (moss valleys, rock faces, snow caps), ringed by floating
// rocks and crowned with a glowing crystal spire.
export class Earth {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-14, 0, 0);
    this.group.rotation.y = Math.PI / 2; // face the center

    this.color = new THREE.Color(0x9bc26b);
    this.focus = new THREE.Vector3(-14, 2.4, 0);

    this._buildTerrain();
    this._buildRocks();
    this._buildCrystal();
    this._buildLight();
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(8, 8, 220, 220);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying float vHeight;
        varying vec3 vNormal;
        varying vec3 vPos;
        ${simplexNoise3D}
        void main(){
          vec3 p = position;
          // Terrain height from layered noise. Raise a central peak.
          float n = fbm(vec3(p.x * 0.35, p.z * 0.35, 0.0), 5, 2.0, 0.5);
          float ridge = 1.0 - abs(snoise(vec3(p.x * 0.4, p.z * 0.4, 0.0)));
          float h = n * 1.6 + ridge * 0.6;
          // Central mountain bulge.
          float dist = length(p.xz) * 0.32;
          h += smoothstep(1.0, 0.0, dist) * 1.8;
          p.y += h;
          vHeight = h;
          vPos = p;
          // Compute a normal via partial differences for sharp slopes.
          float e = 0.06;
          float hx = fbm(vec3((p.x + e) * 0.35, p.z * 0.35, 0.0), 5, 2.0, 0.5);
          float hz = fbm(vec3(p.x * 0.35, (p.z + e) * 0.35, 0.0), 5, 2.0, 0.5);
          vNormal = normalize(vec3(h - hx, e, h - hz));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying float vHeight;
        varying vec3 vNormal;
        varying vec3 vPos;
        ${hashNoise2D}
        void main(){
          float h = vHeight;
          float slope = 1.0 - vNormal.y; // 0 flat, ~1 vertical

          vec3 moss   = vec3(0.30, 0.50, 0.20);
          vec3 grass  = vec3(0.40, 0.62, 0.30);
          vec3 rock   = vec3(0.34, 0.27, 0.22);
          vec3 dark   = vec3(0.18, 0.15, 0.13);
          vec3 snow   = vec3(0.92, 0.95, 1.0);

          vec3 col = mix(dark, moss, smoothstep(-0.2, 0.2, h));
          col = mix(col, grass, smoothstep(0.2, 0.7, h));
          col = mix(col, rock, smoothstep(0.7, 1.4, h));
          // Steep faces show raw rock regardless of height.
          col = mix(col, rock, smoothstep(0.25, 0.6, slope));
          // Snow on high, flat-ish ground.
          col = mix(col, snow, smoothstep(1.5, 2.2, h) * (1.0 - smoothstep(0.2, 0.5, slope)));

          // Subtle texture grain.
          float grain = fbm2(vPos.xz * 3.0);
          col *= 0.85 + grain * 0.3;

          // Simple lambert with a skyish ambient.
          vec3 L = normalize(vec3(0.5, 0.9, 0.4));
          float diff = max(dot(vNormal, L), 0.0);
          vec3 amb = vec3(0.18, 0.20, 0.26);
          gl_FragColor = vec4(col * (amb + diff * 0.9), 1.0);
        }
      `,
    });

    this.terrain = new THREE.Mesh(geo, mat);
    this.terrain.position.y = -0.6;
    this.group.add(this.terrain);

    // A soft dirt base disc to blend the slab into the ground.
    const baseGeo = new THREE.CircleGeometry(4.6, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x241a12,
      roughness: 1.0,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.rotation.x = -Math.PI / 2;
    base.position.y = -0.55;
    this.group.add(base);
  }

  _buildRocks() {
    // Floating rocks orbiting the terrain — instanced for performance.
    const rockGeo = new THREE.DodecahedronGeometry(0.32, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x4a3a2c,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    const COUNT = 60;
    this.rocks = new THREE.InstancedMesh(rockGeo, rockMat, COUNT);
    this._rockData = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.2 + Math.random() * 2.4;
      const y = 1.5 + Math.random() * 3.5;
      const s = 0.4 + Math.random() * 1.3;
      this._rockData.push({ a, r, y, s, speed: 0.2 + Math.random() * 0.4, spin: Math.random() * 2 });
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.scale.setScalar(s);
      dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      dummy.updateMatrix();
      this.rocks.setMatrixAt(i, dummy.matrix);
    }
    this.rocks.instanceMatrix.needsUpdate = true;
    this.group.add(this.rocks);
  }

  _buildCrystal() {
    // A glowing crystal cluster at the peak.
    const cluster = new THREE.Group();
    cluster.position.y = 2.6;
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x6effb0,
      emissive: 0x2ec46a,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.92,
    });
    for (let i = 0; i < 7; i++) {
      const h = 0.8 + Math.random() * 1.6;
      const geo = new THREE.ConeGeometry(0.16 + Math.random() * 0.12, h, 6);
      const m = new THREE.Mesh(geo, crystalMat);
      const a = Math.random() * Math.PI * 2;
      m.position.set(Math.cos(a) * 0.3, h / 2, Math.sin(a) * 0.3);
      m.rotation.z = (Math.random() - 0.5) * 0.6;
      m.rotation.x = (Math.random() - 0.5) * 0.6;
      cluster.add(m);
    }
    this.crystal = cluster;
    this.group.add(cluster);
  }

  _buildLight() {
    this.light = new THREE.PointLight(0x6effb0, 5, 18, 2.0);
    this.light.position.set(0, 3.0, 0);
    this.group.add(this.light);
  }

  update(time) {
    this.terrain.material.uniforms.uTime.value = time;
    // Orbit the floating rocks.
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this._rockData.length; i++) {
      const d = this._rockData[i];
      const a = d.a + time * d.speed * 0.3;
      dummy.position.set(Math.cos(a) * d.r, d.y + Math.sin(time * d.speed + i) * 0.2, Math.sin(a) * d.r);
      dummy.scale.setScalar(d.s);
      dummy.rotation.set(time * d.spin * 0.3, time * d.spin * 0.5 + i, time * d.spin * 0.2);
      dummy.updateMatrix();
      this.rocks.setMatrixAt(i, dummy.matrix);
    }
    this.rocks.instanceMatrix.needsUpdate = true;
    this.crystal.rotation.y = time * 0.4;
    this.crystal.position.y = 2.6 + Math.sin(time * 1.2) * 0.08;
  }
}
