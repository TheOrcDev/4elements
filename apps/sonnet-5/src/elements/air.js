import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise.js';
import { createParticlesMaterial } from '../shaders/particles.js';

const SHELL_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPos;

  ${noiseGLSL}

  void main() {
    vec3 flowPos = position * 1.5 + vec3(uTime * 0.4, uTime * 0.15, uTime * 0.25);
    float n = fbm(flowPos, 3);
    vec3 displaced = position + normal * n * 0.05;

    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPos;

  ${noiseGLSL}

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 3.0);
    float wisp = fbm(vPos * 3.0 + vec3(uTime * 0.6), 3) * 0.5 + 0.5;
    vec3 color = mix(vec3(0.55, 0.72, 0.85), vec3(0.96, 0.99, 1.0), fresnel);
    float alpha = fresnel * (0.3 + wisp * 0.35);
    gl_FragColor = vec4(color, alpha);
  }
`;

const VORTEX_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aSeed;
  attribute float aRadius;
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float loopT = fract(uTime * 0.07 + aOffset);
    float height = mix(-2.0, 2.0, loopT);
    float taper = 1.0 - pow(abs(height) / 2.0, 2.0);
    float radius = aRadius * (0.2 + 0.85 * taper);
    float angle = uTime * aSpeed * 1.6 + aSeed * 40.0 + height * 1.8;
    vec3 pos = vec3(cos(angle) * radius, height, sin(angle) * radius);

    vAlpha = smoothstep(0.0, 0.12, loopT) * smoothstep(1.0, 0.82, loopT) * (0.3 + taper * 0.7);
    vColor = mix(vec3(0.55, 0.75, 0.95), vec3(1.0, 1.0, 1.0), taper);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = aSize * 8.0 + 2.0;
    gl_PointSize = size * (12.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RING_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    float n = fbm(position * 2.0 + vec3(uTime * 0.5), 2);
    vec3 displaced = position + normal * n * 0.04;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RING_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 1.2) * 0.6 + 0.4;
    float gust = pow(sin(vUv.x * 6.2831 * 3.0 - uTime * uSpeed * 4.0) * 0.5 + 0.5, 3.0);
    vec3 color = vec3(0.75, 0.9, 1.0);
    float alpha = gust * fresnel * 0.8;
    gl_FragColor = vec4(color, alpha);
  }
`;

function buildVortex(count) {
  const geometry = new THREE.BufferGeometry();
  const dummy = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const radius = new Float32Array(count);
  const speed = new Float32Array(count);
  const offset = new Float32Array(count);
  const size = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    seed[i] = Math.random();
    radius[i] = 0.5 + Math.random() * 1.4;
    speed[i] = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.7);
    offset[i] = Math.random();
    size[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(dummy, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute('aOffset', new THREE.BufferAttribute(offset, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const material = createParticlesMaterial(VORTEX_VERTEX, { uTime: { value: 0 } });
  return new THREE.Points(geometry, material);
}

const RING_DEFS = [
  { radius: 1.85, tube: 0.045, tiltX: 0.3, tiltZ: 0.0, speed: 0.5 },
  { radius: 2.05, tube: 0.03, tiltX: -0.5, tiltZ: 0.4, speed: -0.35 },
  { radius: 1.7, tube: 0.05, tiltX: 1.1, tiltZ: -0.2, speed: 0.65 },
];

function buildRings() {
  return RING_DEFS.map((def) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(def.radius, def.tube, 16, 120),
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSpeed: { value: def.speed } },
        vertexShader: RING_VERTEX,
        fragmentShader: RING_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    mesh.rotation.x = def.tiltX;
    mesh.rotation.z = def.tiltZ;
    mesh.userData.speed = def.speed;
    return mesh;
  });
}

export function createAir() {
  const group = new THREE.Group();
  group.userData.elementId = 'air';

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 96, 96),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: SHELL_VERTEX,
      fragmentShader: SHELL_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  shell.userData.elementId = 'air';

  const vortex = buildVortex(1800);
  const rings = buildRings();

  group.add(shell, vortex, ...rings);

  return {
    group,
    focusMesh: shell,
    color: 0x9fe8ff,
    name: 'Air',
    description: 'Unseen currents spiral endlessly, never still, never quite touched.',
    update(t) {
      shell.material.uniforms.uTime.value = t;
      vortex.material.uniforms.uTime.value = t;
      rings.forEach((ring) => {
        ring.material.uniforms.uTime.value = t;
        ring.rotation.y = t * ring.userData.speed;
      });
    },
  };
}
