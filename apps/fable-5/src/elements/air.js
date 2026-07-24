import * as THREE from 'three';
import { rand, makeGlowSprite } from '../shared.js';

const streamVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const streamFragment = /* glsl */ `
uniform float uTime;
uniform float uPhase;
uniform float uSpeed;
uniform float uReps;
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float p = fract(vUv.x * uReps - uTime * uSpeed - uPhase);
  float streak = pow(1.0 - p, 7.0);
  float base = 0.03;
  vec3 col = uColor * (0.35 + 1.55 * streak);
  float alpha = base + streak * 0.85;
  gl_FragColor = vec4(col, alpha);
}
`;

const mistVertex = /* glsl */ `
uniform float uTime;
uniform float uPointScale;
attribute float aSeed;
attribute float aSize;
varying float vTw;
float hash(float n){ return fract(sin(n) * 43758.5453123); }
void main(){
  float r = mix(0.45, 2.0, pow(hash(aSeed * 3.1), 0.7));
  float w = mix(0.7, 1.8, hash(aSeed * 7.7)) / (0.35 + r * 0.8);
  float dir = hash(aSeed * 41.3) > 0.15 ? 1.0 : -1.0;
  float a0 = hash(aSeed * 13.7) * 6.2831853;
  float y0 = (hash(aSeed * 23.3) - 0.5) * 2.9;
  float y = y0 + 0.28 * sin(uTime * 0.7 + aSeed * 50.0);
  float ang = a0 + uTime * w * dir;
  float r2 = r * (1.0 + 0.09 * sin(uTime * 0.9 + aSeed * 30.0));
  vec3 pos = vec3(cos(ang) * r2, y, sin(ang) * r2);
  float cap = sqrt(max(0.0, 1.0 - pow(abs(y) / 1.75, 2.0)));
  pos.xz *= mix(0.3, 1.0, cap);
  vTw = 0.55 + 0.45 * sin(uTime * 2.2 + aSeed * 80.0);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = min(aSize * uPointScale / max(0.1, -mv.z), 40.0);
  gl_Position = projectionMatrix * mv;
}
`;

const mistFragment = /* glsl */ `
varying float vTw;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float m = smoothstep(0.5, 0.12, d);
  vec3 col = vec3(0.62, 0.82, 1.05);
  float alpha = m * 0.3 * vTw;
  gl_FragColor = vec4(col, alpha);
}
`;

function makeLoopCurve() {
  const pts = [];
  const R = rand(1.35, 2.15);
  const tiltQ = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rand(-0.55, 0.55), rand(0, Math.PI * 2), rand(-0.35, 0.35))
  );
  const K = 9;
  for (let i = 0; i < K; i++) {
    const a = (i / K) * Math.PI * 2;
    const r = R * rand(0.8, 1.2);
    const v = new THREE.Vector3(Math.cos(a) * r, rand(-0.55, 0.55), Math.sin(a) * r);
    v.applyQuaternion(tiltQ);
    pts.push(v);
  }
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.6);
}

export function createAir() {
  const group = new THREE.Group();
  const tubeMats = [];
  const pivots = [];

  for (let i = 0; i < 11; i++) {
    const curve = makeLoopCurve();
    const geo = new THREE.TubeGeometry(curve, 200, rand(0.02, 0.05), 6, true);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: rand(0, 1) },
        uSpeed: { value: rand(0.14, 0.34) },
        uReps: { value: Math.random() > 0.5 ? 2 : 3 },
        uColor: { value: new THREE.Color(0.55, 0.82, 1.2) },
      },
      vertexShader: streamVertex,
      fragmentShader: streamFragment,
    });
    tubeMats.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    const pivot = new THREE.Object3D();
    pivot.add(mesh);
    pivot.userData = {
      wy: rand(0.06, 0.22) * (Math.random() > 0.5 ? 1 : -1),
      wobble: rand(0.04, 0.1),
      wobbleSpeed: rand(0.2, 0.5),
      phase: rand(0, Math.PI * 2),
    };
    pivots.push(pivot);
    group.add(pivot);
  }

  const mist = (() => {
    const count = 1600;
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      sizes[i] = rand(0.018, 0.06);
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPointScale: { value: 600 } },
      vertexShader: mistVertex,
      fragmentShader: mistFragment,
    });
    const points = new THREE.Points(g, m);
    points.frustumCulled = false;
    return { points, mat: m };
  })();
  group.add(mist.points);

  const eye = makeGlowSprite(0xcfe6ff, 1.7, 0.16);
  group.add(eye);

  const light = new THREE.PointLight(0xbfe3ff, 30, 20, 2);
  light.position.set(0, 0.5, 0);
  group.add(light);

  function update(t) {
    for (const m of tubeMats) m.uniforms.uTime.value = t;
    mist.mat.uniforms.uTime.value = t;
    for (const p of pivots) {
      const u = p.userData;
      p.rotation.y = t * u.wy + u.phase;
      p.rotation.x = u.wobble * Math.sin(t * u.wobbleSpeed + u.phase);
    }
    eye.material.opacity = 0.14 + 0.05 * Math.sin(t * 1.3);
  }

  return { group, update, pointMaterials: [mist.mat] };
}
