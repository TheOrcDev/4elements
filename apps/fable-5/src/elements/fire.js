import * as THREE from 'three';
import { rand, makeGlowSprite } from '../shared.js';

const flameVertex = /* glsl */ `
uniform float uTime;
uniform float uPointScale;
attribute float aSeed;
attribute float aSize;
varying float vLife;
varying float vSeed;
float hash(float n){ return fract(sin(n) * 43758.5453123); }
void main(){
  float speed = mix(0.6, 1.15, hash(aSeed * 17.3));
  float life = fract(uTime * 0.3 * speed + aSeed);
  float ang = hash(aSeed * 31.7) * 6.2831853;
  float r0 = 0.78 * sqrt(hash(aSeed * 57.1));
  float taper = 1.0 - 0.88 * smoothstep(0.0, 1.05, life);
  float swayAmp = (0.05 + 0.55 * life * life) * (0.3 + 0.7 * taper);
  vec3 pos;
  pos.x = cos(ang) * r0 * taper + swayAmp * sin(life * 8.0 + aSeed * 40.0 + uTime * 2.3);
  pos.z = sin(ang) * r0 * taper + swayAmp * cos(life * 6.5 + aSeed * 55.0 + uTime * 1.9);
  pos.y = pow(life, 0.82) * 3.4;
  vLife = life;
  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float sizeCurve = 0.3 + 0.75 * sin(pow(life, 0.75) * 3.14159);
  float ps = aSize * sizeCurve * uPointScale / max(0.1, -mv.z);
  gl_PointSize = min(ps, 220.0);
  gl_Position = projectionMatrix * mv;
}
`;

const flameFragment = /* glsl */ `
varying float vLife;
varying float vSeed;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float m = smoothstep(0.5, 0.06, d);
  vec3 cCore = vec3(1.7, 1.35, 0.8);
  vec3 cMid  = vec3(1.5, 0.5, 0.09);
  vec3 cEdge = vec3(0.7, 0.12, 0.02);
  vec3 col = mix(cCore, cMid, smoothstep(0.04, 0.22, vLife));
  col = mix(col, cEdge, smoothstep(0.3, 0.75, vLife));
  float alpha = m * smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.5, 0.92, vLife));
  alpha *= 0.3;
  gl_FragColor = vec4(col, alpha);
}
`;

const emberVertex = /* glsl */ `
uniform float uTime;
uniform float uPointScale;
attribute float aSeed;
attribute float aSize;
varying float vLife;
varying float vSeed;
float hash(float n){ return fract(sin(n) * 43758.5453123); }
void main(){
  float speed = mix(0.14, 0.3, hash(aSeed * 12.9));
  float life = fract(uTime * speed + aSeed);
  float ang = hash(aSeed * 31.7) * 6.2831853;
  float r0 = 0.55 * sqrt(hash(aSeed * 57.1));
  float sway = 0.15 + 0.9 * life;
  vec3 pos;
  pos.x = cos(ang) * r0 + sway * sin(life * 5.0 + aSeed * 90.0 + uTime * 1.4);
  pos.z = sin(ang) * r0 + sway * cos(life * 4.2 + aSeed * 70.0 + uTime * 1.1);
  pos.y = life * 4.6;
  vLife = life;
  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = min(aSize * uPointScale / max(0.1, -mv.z), 60.0);
  gl_Position = projectionMatrix * mv;
}
`;

const emberFragment = /* glsl */ `
uniform float uTime;
varying float vLife;
varying float vSeed;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float m = smoothstep(0.5, 0.08, d);
  float twinkle = 0.6 + 0.4 * sin(uTime * 11.0 + vSeed * 120.0);
  vec3 col = mix(vec3(2.1, 1.15, 0.35), vec3(1.4, 0.35, 0.06), vLife);
  float alpha = m * twinkle * smoothstep(0.0, 0.1, vLife) * (1.0 - smoothstep(0.6, 1.0, vLife));
  gl_FragColor = vec4(col, alpha);
}
`;

function makePointCloud(count, sizeMin, sizeMax, vertexShader, fragmentShader) {
  const geo = new THREE.BufferGeometry();
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seeds[i] = Math.random();
    sizes[i] = rand(sizeMin, sizeMax);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPointScale: { value: 600 },
    },
    vertexShader,
    fragmentShader,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, mat };
}

export function createFire() {
  const group = new THREE.Group();

  const flames = makePointCloud(2600, 0.1, 0.34, flameVertex, flameFragment);
  group.add(flames.points);

  const embers = makePointCloud(380, 0.02, 0.055, emberVertex, emberFragment);
  group.add(embers.points);

  const glow = makeGlowSprite(0xff7726, 3.6, 0.2);
  glow.position.set(0, 1.0, 0);
  group.add(glow);

  const coreGlow = makeGlowSprite(0xffc888, 1.5, 0.3);
  coreGlow.position.set(0, 0.45, 0);
  group.add(coreGlow);

  const light = new THREE.PointLight(0xff6a22, 90, 24, 2);
  light.position.set(0, 1.5, 0);
  group.add(light);

  function update(t) {
    flames.mat.uniforms.uTime.value = t;
    embers.mat.uniforms.uTime.value = t;
    light.intensity = 80 * (0.82 + 0.13 * Math.sin(t * 9.7) + 0.07 * Math.sin(t * 23.3));
    glow.material.opacity = 0.18 + 0.04 * Math.sin(t * 7.1);
  }

  return { group, update, pointMaterials: [flames.mat, embers.mat] };
}
