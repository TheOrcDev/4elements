import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise.js';
import { createParticlesMaterial } from '../shaders/particles.js';

const CORE_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  ${noiseGLSL}

  void main() {
    vec3 flowPos = position * 1.6 + vec3(0.0, uTime * 0.9, 0.0);
    float n = fbm(flowPos, 4);
    float rise = 0.5 + 0.5 * normal.y;
    float displacement = n * 0.30 * (0.35 + rise);

    vec3 displaced = position + normal * displacement;
    vDisplacement = n;
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
  varying float vDisplacement;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 3.5);

    float t = clamp(vDisplacement * 0.6 + 0.5, 0.0, 1.0);
    vec3 deep = vec3(0.2, 0.015, 0.006);
    vec3 mid = vec3(0.82, 0.22, 0.02);
    vec3 hot = vec3(1.0, 0.6, 0.12);

    vec3 color = mix(deep, mid, smoothstep(0.25, 0.65, t));
    color = mix(color, hot, smoothstep(0.78, 1.0, t));
    color += fresnel * vec3(1.0, 0.45, 0.1) * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const CORONA_VERTEX = /* glsl */ `
  uniform float uTime;
  varying float vAlpha;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  ${noiseGLSL}

  void main() {
    vec3 flowPos = position * 1.1 + vec3(0.0, uTime * 1.3, 0.0);
    float n = fbm(flowPos, 3);
    float rise = 0.5 + 0.5 * normal.y;
    float bulge = 0.06 + n * 0.32 * rise;
    vec3 displaced = position * 1.02 + normal * bulge;

    vAlpha = smoothstep(0.2, 0.85, n) * rise;
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
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 1.5);
    vec3 color = mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.8, 0.3), fresnel);
    gl_FragColor = vec4(color, vAlpha * fresnel * 0.45);
  }
`;

const SPARK_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aSeed;
  attribute vec3 aBase;
  attribute float aSpeed;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;

  ${noiseGLSL}

  void main() {
    float life = fract(uTime * 0.18 * aSpeed + aSeed);
    vec3 pos = aBase;
    pos.y += life * 3.6;
    float wob = fbm(vec3(aSeed * 12.0, uTime * 0.6, life * 3.0), 2);
    pos.x += wob * 0.6 * life;
    pos.z += cos(life * 6.2831 * 2.0 + aSeed * 20.0) * 0.25 * life;

    vAlpha = smoothstep(0.0, 0.12, life) * smoothstep(1.0, 0.6, life);
    vColor = mix(vec3(1.0, 0.9, 0.5), vec3(1.0, 0.3, 0.05), life);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = (aSize * 30.0 + 6.0) * (1.0 - life * 0.4);
    gl_PointSize = size * (12.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

function buildSparks(count) {
  const geometry = new THREE.BufferGeometry();
  const dummy = new Float32Array(count * 3);
  const base = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const speed = new Float32Array(count);
  const size = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const radius = Math.sqrt(Math.random()) * 0.85;
    const angle = Math.random() * Math.PI * 2;
    base[i * 3 + 0] = Math.cos(angle) * radius;
    base[i * 3 + 1] = -1.15 - Math.random() * 0.3;
    base[i * 3 + 2] = Math.sin(angle) * radius;
    seed[i] = Math.random();
    speed[i] = 0.6 + Math.random() * 0.9;
    size[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(dummy, 3));
  geometry.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const material = createParticlesMaterial(SPARK_VERTEX, { uTime: { value: 0 } });
  return new THREE.Points(geometry, material);
}

export function createFire() {
  const group = new THREE.Group();
  group.userData.elementId = 'fire';

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 96, 96),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: CORE_VERTEX,
      fragmentShader: CORE_FRAGMENT,
    })
  );
  core.userData.elementId = 'fire';

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

  const sparks = buildSparks(650);

  group.add(core, corona, sparks);

  return {
    group,
    focusMesh: core,
    color: 0xff5a1f,
    name: 'Fire',
    description: 'Turbulent plasma churns beneath a restless, ever-splitting skin of flame.',
    update(t) {
      core.material.uniforms.uTime.value = t;
      corona.material.uniforms.uTime.value = t;
      sparks.material.uniforms.uTime.value = t;
    },
  };
}
