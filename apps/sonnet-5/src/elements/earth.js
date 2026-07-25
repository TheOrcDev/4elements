import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise.js';

const CORE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vElevation;
  varying vec3 vPos;

  ${noiseGLSL}

  float terrainHeight(vec3 p) {
    float n1 = fbm(p * 1.1, 5);
    float n2 = fbm(p * 4.0 + vec3(100.0), 3);
    return n1 * 0.32 + n2 * 0.05;
  }

  void main() {
    float h0 = terrainHeight(position);
    vec3 displaced = position + normal * h0;

    // Recompute a perturbed normal from the displaced surface so shading
    // actually reveals the bumps instead of staying flat like the base sphere.
    vec3 tangent1 = normalize(cross(normal, vec3(0.0, 1.0, 0.3)));
    vec3 tangent2 = normalize(cross(normal, tangent1));
    float eps = 0.015;
    vec3 p1 = position + tangent1 * eps;
    vec3 p2 = position + tangent2 * eps;
    vec3 d1 = p1 + normal * terrainHeight(p1);
    vec3 d2 = p2 + normal * terrainHeight(p2);
    vec3 perturbedNormal = normalize(cross(d1 - displaced, d2 - displaced));
    if (dot(perturbedNormal, normal) < 0.0) perturbedNormal = -perturbedNormal;

    vElevation = h0;
    vPos = position;
    vNormal = normalize(normalMatrix * perturbedNormal);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const CORE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vElevation;
  varying vec3 vPos;

  ${noiseGLSL}

  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.5);

    float h = clamp(vElevation / 0.32 * 0.5 + 0.5, 0.0, 1.0);
    vec3 rockLow = vec3(0.13, 0.09, 0.07);
    vec3 rockHigh = vec3(0.4, 0.32, 0.25);
    vec3 moss = vec3(0.2, 0.34, 0.13);

    vec3 color = mix(rockLow, rockHigh, h);
    float mossAmount = smoothstep(0.3, 0.7, n.y) * smoothstep(0.2, 0.6, h);
    color = mix(color, moss, mossAmount * 0.6);

    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.4));
    float diffuse = max(dot(n, lightDir), 0.0) * 0.75 + 0.25;
    color *= diffuse;

    float veinNoise = fbm(vPos * 9.0, 3);
    float veinMask = smoothstep(0.5, 0.6, veinNoise + sin(uTime * 0.8 + vPos.x * 3.0) * 0.03);
    vec3 crystalColor = vec3(0.4, 0.85, 1.0);
    color = mix(color, crystalColor, veinMask * 0.9);
    color += crystalColor * veinMask * 0.8;

    color += fresnel * vec3(0.3, 0.4, 0.5) * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function buildDebris(count) {
  const geometry = new THREE.DodecahedronGeometry(0.09, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x6b5a45,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);

  const params = [];
  for (let i = 0; i < count; i++) {
    params.push({
      radius: 2.0 + Math.random() * 0.9,
      speed: (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.25),
      phase: Math.random() * Math.PI * 2,
      incline: (Math.random() - 0.5) * 1.6,
      tumbleX: (Math.random() - 0.5) * 1.5,
      tumbleY: (Math.random() - 0.5) * 1.5,
      scale: 0.6 + Math.random() * 0.8,
    });
  }
  mesh.userData.params = params;
  return mesh;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();

function updateDebris(mesh, t) {
  const params = mesh.userData.params;
  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    const angle = t * p.speed + p.phase;
    _pos.set(Math.cos(angle) * p.radius, Math.sin(angle * 0.6 + p.phase) * p.incline, Math.sin(angle) * p.radius);
    _e.set(t * p.tumbleX, t * p.tumbleY, 0);
    _q.setFromEuler(_e);
    _scale.setScalar(p.scale);
    _m.compose(_pos, _q, _scale);
    mesh.setMatrixAt(i, _m);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function createEarth() {
  const group = new THREE.Group();
  group.userData.elementId = 'earth';

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 128, 128),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: CORE_VERTEX,
      fragmentShader: CORE_FRAGMENT,
    })
  );
  core.userData.elementId = 'earth';

  const debris = buildDebris(28);

  group.add(core, debris);

  return {
    group,
    focusMesh: core,
    color: 0x8a6f4e,
    name: 'Earth',
    description: 'Ancient and unhurried, its crust remembers every scar, veined with old light.',
    update(t) {
      core.material.uniforms.uTime.value = t;
      updateDebris(debris, t);
    },
  };
}
