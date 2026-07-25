import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise.js';
import { createParticlesMaterial } from '../shaders/particles.js';

const CORE_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPos;
  varying float vElevation;

  ${noiseGLSL}

  void main() {
    vec3 flowPos = position * 1.3 + vec3(uTime * 0.25, uTime * 0.18, uTime * 0.3);
    float n = fbm(flowPos, 3);
    float displacement = n * 0.07;
    vec3 displaced = position + normal * displacement;

    vElevation = n;
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const CORE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPos;
  varying float vElevation;

  ${noiseGLSL}

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 n = normalize(vNormal);
    float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.2);

    vec3 deep = vec3(0.01, 0.08, 0.24);
    vec3 mid = vec3(0.0, 0.35, 0.56);
    vec3 shallow = vec3(0.4, 0.88, 0.92);

    float e = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = mix(deep, mid, e);
    color = mix(color, shallow, fresnel);

    float sparkle = pow(max(fbm(vPos * 10.0 + vec3(uTime * 0.8), 3), 0.0), 11.0);
    sparkle *= 0.25 + 0.75 * fresnel;
    color += sparkle * vec3(1.3, 1.5, 1.6) * 3.5;

    float alpha = mix(0.68, 0.97, fresnel);
    gl_FragColor = vec4(color, alpha);
  }
`;

const CORONA_VERTEX = /* glsl */ `
  uniform float uTime;
  varying float vAlpha;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  ${noiseGLSL}

  void main() {
    vec3 flowPos = position * 1.0 + vec3(0.0, uTime * 0.5, uTime * 0.2);
    float n = fbm(flowPos, 3);
    float bulge = 0.06 + n * 0.12;
    vec3 displaced = position * 1.05 + normal * bulge;

    vAlpha = clamp(n * 0.9 + 0.4, 0.0, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const CORONA_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 1.8);
    vec3 color = mix(vec3(0.05, 0.4, 0.75), vec3(0.6, 0.95, 1.0), fresnel);
    gl_FragColor = vec4(color, vAlpha * fresnel * 0.65);
  }
`;

const BUBBLE_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aSeed;
  attribute vec3 aBase;
  attribute float aSpeed;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float life = fract(uTime * 0.1 * aSpeed + aSeed);
    vec3 pos = aBase;
    pos.y += life * 3.0;
    pos.x += sin(life * 12.0 + aSeed * 30.0) * 0.16;
    pos.z += cos(life * 10.0 + aSeed * 24.0) * 0.16;

    vAlpha = smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.7, life) * 0.75;
    vColor = mix(vec3(0.35, 0.8, 0.92), vec3(0.88, 0.99, 1.0), life);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = aSize * 12.0 + 3.0;
    gl_PointSize = size * (12.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

function buildBubbles(count) {
  const geometry = new THREE.BufferGeometry();
  const dummy = new Float32Array(count * 3);
  const base = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const speed = new Float32Array(count);
  const size = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const radius = Math.sqrt(Math.random()) * 1.0;
    const angle = Math.random() * Math.PI * 2;
    base[i * 3 + 0] = Math.cos(angle) * radius;
    base[i * 3 + 1] = -1.3 - Math.random() * 0.4;
    base[i * 3 + 2] = Math.sin(angle) * radius;
    seed[i] = Math.random();
    speed[i] = 0.5 + Math.random() * 0.8;
    size[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(dummy, 3));
  geometry.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const material = createParticlesMaterial(BUBBLE_VERTEX, { uTime: { value: 0 } });
  return new THREE.Points(geometry, material);
}

export function createWater() {
  const group = new THREE.Group();
  group.userData.elementId = 'water';

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 128, 128),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: CORE_VERTEX,
      fragmentShader: CORE_FRAGMENT,
      transparent: true,
      depthWrite: false,
    })
  );
  core.userData.elementId = 'water';

  const corona = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: CORONA_VERTEX,
      fragmentShader: CORONA_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );

  const bubbles = buildBubbles(400);

  group.add(core, corona, bubbles);

  return {
    group,
    focusMesh: core,
    color: 0x2fb8e8,
    name: 'Water',
    description: 'A restless liquid skin, always folding, always finding its own level.',
    update(t) {
      core.material.uniforms.uTime.value = t;
      corona.material.uniforms.uTime.value = t;
      bubbles.material.uniforms.uTime.value = t;
    },
  };
}
