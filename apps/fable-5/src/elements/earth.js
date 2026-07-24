import * as THREE from 'three';
import { GLSL_NOISE, rand } from '../shared.js';

const rockVertex = /* glsl */ `
${GLSL_NOISE}
varying vec3 vPosW;
varying vec3 vPosO;
void main(){
  vec3 dir = normalize(position);
  float d = 0.3 * fbm(dir * 1.9 + 3.7) + 0.09 * snoise(dir * 4.6);
  vec3 displaced = dir * (1.12 + d);
  vPosO = displaced;
  vec4 wp = modelMatrix * vec4(displaced, 1.0);
  vPosW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const rockFragment = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
varying vec3 vPosW;
varying vec3 vPosO;
void main(){
  vec3 fdx = dFdx(vPosW);
  vec3 fdy = dFdy(vPosW);
  vec3 N = normalize(cross(fdx, fdy));
  vec3 L = normalize(vec3(0.5, 0.85, 0.4));
  float diff = max(dot(N, L), 0.0);
  float hemi = 0.5 + 0.5 * N.y;
  vec3 albedo = mix(vec3(0.14, 0.105, 0.08), vec3(0.24, 0.215, 0.19), 0.5 + 0.5 * snoise(vPosO * 3.1 + 5.0));
  vec3 col = albedo * (0.18 + 0.24 * hemi + 0.72 * diff);
  float v = abs(snoise(vPosO * 2.1 + 11.0));
  float vein = smoothstep(0.065, 0.006, v);
  float mask = smoothstep(0.28, 0.72, snoise(vPosO * 1.1 + 2.0) * 0.5 + 0.5);
  float pulse = 0.65 + 0.35 * sin(uTime * 1.6 + vPosO.y * 2.0);
  col += vec3(0.22, 1.25, 0.38) * vein * mask * pulse;
  gl_FragColor = vec4(col, 1.0);
}
`;

const moteVertex = /* glsl */ `
uniform float uTime;
uniform float uPointScale;
attribute float aSeed;
attribute float aSize;
varying float vTw;
float hash(float n){ return fract(sin(n) * 43758.5453123); }
void main(){
  float r = mix(1.35, 2.6, hash(aSeed * 3.7));
  float theta = hash(aSeed * 8.9) * 6.2831853 + uTime * mix(0.04, 0.12, hash(aSeed * 15.0));
  float y0 = (hash(aSeed * 23.1) - 0.5) * 3.0;
  vec3 pos = vec3(cos(theta) * r, y0, sin(theta) * r);
  pos.x += 0.3 * sin(uTime * 0.5 + aSeed * 60.0);
  pos.y += 0.35 * sin(uTime * 0.4 + aSeed * 90.0);
  pos.z += 0.3 * cos(uTime * 0.45 + aSeed * 40.0);
  vTw = 0.5 + 0.5 * sin(uTime * 2.6 + aSeed * 110.0);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = min(aSize * uPointScale / max(0.1, -mv.z), 30.0);
  gl_Position = projectionMatrix * mv;
}
`;

const moteFragment = /* glsl */ `
varying float vTw;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float m = smoothstep(0.5, 0.1, d);
  vec3 col = vec3(0.45, 1.5, 0.6);
  float alpha = m * 0.55 * vTw;
  gl_FragColor = vec4(col, alpha);
}
`;

export function createEarth() {
  const group = new THREE.Group();

  const coreMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: rockVertex,
    fragmentShader: rockFragment,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 3), coreMat);
  core.frustumCulled = false;
  group.add(core);

  // orbiting rock shards
  const RINGS = [
    { r: 2.0, tilt: new THREE.Euler(0.32, 0.4, 0.05), speed: 0.22, n: 20 },
    { r: 2.45, tilt: new THREE.Euler(-0.5, 1.4, -0.12), speed: -0.16, n: 16 },
    { r: 1.7, tilt: new THREE.Euler(0.85, -0.6, 0.3), speed: 0.3, n: 12 },
  ];
  const shardCount = RINGS.reduce((s, r) => s + r.n, 0);
  const shardGeo = new THREE.IcosahedronGeometry(1, 0);
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0x8a7f70,
    flatShading: true,
    roughness: 0.92,
    metalness: 0.04,
  });
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
  shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shards.frustumCulled = false;
  group.add(shards);

  const shardData = [];
  for (const ring of RINGS) {
    const quat = new THREE.Quaternion().setFromEuler(ring.tilt);
    for (let i = 0; i < ring.n; i++) {
      shardData.push({
        quat,
        r: ring.r * rand(0.92, 1.1),
        speed: ring.speed * rand(0.9, 1.1),
        phase: (i / ring.n) * Math.PI * 2 + rand(-0.25, 0.25),
        y: rand(-0.16, 0.16),
        scale: new THREE.Vector3(rand(0.6, 1.4), rand(0.6, 1.4), rand(0.6, 1.4)).multiplyScalar(
          Math.random() < 0.15 ? rand(0.16, 0.24) : rand(0.05, 0.14)
        ),
        spin: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)),
        spinSpeed: rand(0.4, 1.6),
      });
    }
  }

  const motes = (() => {
    const count = 260;
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      sizes[i] = rand(0.02, 0.05);
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPointScale: { value: 600 } },
      vertexShader: moteVertex,
      fragmentShader: moteFragment,
    });
    const points = new THREE.Points(g, m);
    points.frustumCulled = false;
    return { points, mat: m };
  })();
  group.add(motes.points);

  const light = new THREE.PointLight(0x66ff88, 35, 20, 2);
  light.position.set(0, 0.6, 0);
  group.add(light);

  const dummy = new THREE.Object3D();
  const pos = new THREE.Vector3();
  const spinQ = new THREE.Quaternion();

  function update(t) {
    coreMat.uniforms.uTime.value = t;
    motes.mat.uniforms.uTime.value = t;
    core.rotation.y = t * 0.06;
    core.rotation.x = 0.08 * Math.sin(t * 0.3);

    for (let i = 0; i < shardData.length; i++) {
      const s = shardData[i];
      const a = s.phase + t * s.speed;
      pos.set(Math.cos(a) * s.r, s.y + 0.05 * Math.sin(t * 0.8 + s.phase * 4), Math.sin(a) * s.r);
      pos.applyQuaternion(s.quat);
      dummy.position.copy(pos);
      spinQ.setFromAxisAngle(s.spin, t * s.spinSpeed).normalize();
      dummy.quaternion.copy(spinQ);
      dummy.scale.copy(s.scale);
      dummy.updateMatrix();
      shards.setMatrixAt(i, dummy.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;
  }

  // normalize spin axes once
  for (const s of shardData) s.spin.normalize();

  return { group, update, pointMaterials: [motes.mat] };
}
