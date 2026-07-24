import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLSL_NOISE, rand, makeGlowSprite } from '../shared.js';

const waterVertex = /* glsl */ `
uniform float uTime;
varying vec3 vNormalW;
varying vec3 vPosW;
varying float vNoise;
${GLSL_NOISE}
float surf(vec3 p, float t){
  float n = 0.0;
  n += 0.22 * snoise(p * 1.35 + vec3(0.0, t * 0.5, 0.0));
  n += 0.10 * snoise(p * 2.8 - vec3(t * 0.7, 0.0, t * 0.4));
  n += 0.045 * snoise(p * 5.5 + vec3(0.0, -t * 1.1, 0.0));
  return n;
}
void main(){
  vec3 dir = normalize(position);
  float t = uTime;
  float n = surf(dir * 1.6, t);
  vec3 displaced = dir * (1.25 + n);
  vec3 tangent = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + vec3(0.001, 0.0, 0.0));
  vec3 bitan = normalize(cross(dir, tangent));
  float e = 0.07;
  vec3 d1 = normalize(dir + tangent * e);
  vec3 d2 = normalize(dir + bitan * e);
  vec3 p1 = d1 * (1.25 + surf(d1 * 1.6, t));
  vec3 p2 = d2 * (1.25 + surf(d2 * 1.6, t));
  vec3 N = normalize(cross(p1 - displaced, p2 - displaced));
  if (dot(N, dir) < 0.0) N = -N;
  vNoise = n;
  vec4 wp = modelMatrix * vec4(displaced, 1.0);
  vPosW = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * N);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const waterFragment = /* glsl */ `
uniform float uTime;
varying vec3 vNormalW;
varying vec3 vPosW;
varying float vNoise;
${GLSL_NOISE}
void main(){
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 deep = vec3(0.006, 0.045, 0.15);
  vec3 shallow = vec3(0.015, 0.18, 0.5);
  vec3 rim = vec3(0.25, 0.75, 1.35);
  float heightMix = smoothstep(-0.28, 0.4, vNoise);
  vec3 col = mix(deep, shallow, heightMix);
  col += rim * fres * 0.85;
  float sh = snoise(vPosW * 3.0 + vec3(0.0, -uTime * 0.8, 0.0));
  col += vec3(0.06, 0.3, 0.6) * smoothstep(0.5, 0.9, sh) * 0.3;
  vec3 L = normalize(vec3(0.55, 0.9, 0.35));
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 130.0);
  col += vec3(0.8, 1.0, 1.2) * spec;
  gl_FragColor = vec4(col, 0.94);
}
`;

const mistVertex = /* glsl */ `
uniform float uTime;
uniform float uPointScale;
attribute float aSeed;
attribute float aSize;
varying float vLife;
varying float vSeed;
float hash(float n){ return fract(sin(n) * 43758.5453123); }
void main(){
  float speed = mix(0.06, 0.13, hash(aSeed * 5.1));
  float life = fract(uTime * speed + aSeed);
  float r = mix(1.7, 2.5, hash(aSeed * 9.7)) * (1.0 - 0.25 * life);
  float w = mix(0.5, 1.1, hash(aSeed * 3.3)) * (hash(aSeed * 21.0) > 0.5 ? 1.0 : -1.0);
  float ang = hash(aSeed * 13.7) * 6.2831853 + uTime * w;
  vec3 pos;
  pos.x = cos(ang) * r;
  pos.z = sin(ang) * r;
  pos.y = -1.0 + life * 2.8;
  vLife = life;
  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = min(aSize * uPointScale / max(0.1, -mv.z), 40.0);
  gl_Position = projectionMatrix * mv;
}
`;

const mistFragment = /* glsl */ `
varying float vLife;
varying float vSeed;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float m = smoothstep(0.5, 0.1, d);
  vec3 col = vec3(0.2, 0.55, 1.1);
  float alpha = m * 0.32 * smoothstep(0.0, 0.15, vLife) * (1.0 - smoothstep(0.6, 1.0, vLife));
  gl_FragColor = vec4(col, alpha);
}
`;

export function createWater() {
  const group = new THREE.Group();

  let geo = new THREE.IcosahedronGeometry(1.25, 5);
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  geo = mergeVertices(geo);

  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 } },
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
  });

  const blob = new THREE.Mesh(geo, waterMat);
  blob.frustumCulled = false;
  group.add(blob);

  const innerGlow = makeGlowSprite(0x59c2ff, 2.4, 0.18);
  group.add(innerGlow);

  // orbiting droplets on tilted rings, sharing the blob material
  const dropletGeo = new THREE.SphereGeometry(1, 16, 12);
  const rings = [
    { r: 1.95, tilt: new THREE.Euler(0.5, 0.3, 0.15), speed: 0.55, n: 5 },
    { r: 2.25, tilt: new THREE.Euler(-0.65, 1.2, -0.2), speed: -0.42, n: 5 },
    { r: 1.75, tilt: new THREE.Euler(1.15, -0.5, 0.4), speed: 0.7, n: 4 },
  ];
  const droplets = [];
  for (const ring of rings) {
    const quat = new THREE.Quaternion().setFromEuler(ring.tilt);
    for (let i = 0; i < ring.n; i++) {
      const mesh = new THREE.Mesh(dropletGeo, waterMat);
      mesh.scale.setScalar(rand(0.045, 0.1));
      mesh.frustumCulled = false;
      droplets.push({
        mesh,
        quat,
        r: ring.r * rand(0.94, 1.06),
        speed: ring.speed * rand(0.85, 1.15),
        phase: (i / ring.n) * Math.PI * 2 + rand(-0.3, 0.3),
        bob: rand(0.08, 0.2),
      });
      group.add(mesh);
    }
  }

  const mist = (() => {
    const count = 550;
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      sizes[i] = rand(0.025, 0.075);
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

  const light = new THREE.PointLight(0x55aaff, 50, 22, 2);
  light.position.set(0, 0.4, 0);
  group.add(light);

  const tmp = new THREE.Vector3();

  function update(t) {
    waterMat.uniforms.uTime.value = t;
    mist.mat.uniforms.uTime.value = t;
    const s = 1.07 + 0.022 * Math.sin(t * 1.4);
    blob.scale.setScalar(s);
    for (const d of droplets) {
      const a = d.phase + t * d.speed;
      tmp.set(Math.cos(a) * d.r, Math.sin(t * 2 + d.phase * 3) * d.bob, Math.sin(a) * d.r);
      tmp.applyQuaternion(d.quat);
      d.mesh.position.copy(tmp);
    }
    innerGlow.material.opacity = 0.16 + 0.05 * Math.sin(t * 1.8);
  }

  return { group, update, pointMaterials: [mist.mat] };
}
