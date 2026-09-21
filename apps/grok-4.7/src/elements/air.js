import * as THREE from "three";
import { NOISE } from "../glsl.js";
import { shaderMaterial } from "../materials.js";
import { createPedestal } from "../pedestal.js";

const uTime = { value: 0 };

function buildStreaks(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 4 * 3);
  const uvs = new Float32Array(count * 4 * 2);
  const angles = new Float32Array(count * 4);
  const heights = new Float32Array(count * 4);
  const seeds = new Float32Array(count * 4);
  const widths = new Float32Array(count * 4);
  const indices = [];
  const corners = [
    [-0.5, 0],
    [0.5, 0],
    [0.5, 1],
    [-0.5, 1],
  ];

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const height = Math.random();
    const seed = Math.random();
    const width = 0.65 + Math.random() * 0.7;
    const base = i * 4;
    for (let k = 0; k < 4; k += 1) {
      const vi = base + k;
      positions[vi * 3] = corners[k][0];
      positions[vi * 3 + 1] = corners[k][1];
      positions[vi * 3 + 2] = 0;
      uvs[vi * 2] = corners[k][0] + 0.5;
      uvs[vi * 2 + 1] = corners[k][1];
      angles[vi] = angle;
      heights[vi] = height;
      seeds[vi] = seed;
      widths[vi] = width;
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
  geometry.setAttribute("aHeight", new THREE.BufferAttribute(heights, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aWidth", new THREE.BufferAttribute(widths, 1));
  geometry.setIndex(indices);
  return geometry;
}

const streakVertex = /* glsl */ `
attribute float aAngle;
attribute float aHeight;
attribute float aSeed;
attribute float aWidth;
uniform float uTime;
uniform float uHeight;
uniform float uRadius;
uniform float uSpin;
uniform float uRise;
uniform float uDirection;
varying vec2 vUv;
varying float vFade;
varying float vSeed;
void main() {
  vUv = uv;
  vSeed = aSeed;
  float life = fract(aHeight + uTime * uRise * (0.45 + aSeed * 0.9));
  vFade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.78, 1.0, life));
  float ang = aAngle + uDirection * uTime * uSpin * (0.4 + aSeed) + life * 5.5;
  float r = mix(0.16, uRadius, pow(life, 0.92)) * (0.72 + aSeed * 0.45);
  r += sin(ang * 2.0 + uTime * 1.6 + aSeed * 6.0) * 0.05;
  vec3 center = vec3(cos(ang) * r, 0.72 + life * uHeight, sin(ang) * r);
  vec3 tangent = normalize(vec3(-sin(ang) * uDirection, 0.42, cos(ang) * uDirection));
  vec3 side = normalize(cross(tangent, vec3(0.0, 1.0, 0.0)));
  float w = aWidth * mix(0.02, 0.07, life);
  float len = mix(0.28, 0.85, aSeed);
  vec3 pos = center + tangent * (position.y - 0.5) * len + side * position.x * w;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const streakFragment = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uBoost;
varying vec2 vUv;
varying float vFade;
varying float vSeed;
void main() {
  float across = 1.0 - smoothstep(0.15, 0.5, abs(vUv.x - 0.5));
  float along = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
  float n = 0.5 + 0.5 * snoise(vec3(vUv.x * 2.0, vUv.y * 6.0 - uTime * 1.5, vSeed * 8.0));
  float alpha = across * along * vFade * (0.35 + 0.65 * n) * uBoost;
  vec3 col = mix(vec3(0.25, 0.62, 1.0), vec3(0.82, 0.95, 1.0), n);
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const ribbonVertex = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uPhase;
uniform float uRadius;
varying vec2 vUv;
varying float vT;
void main() {
  vUv = uv;
  float t = uv.y;
  vT = t;
  float ang = t * 9.5 + uTime * uSpeed + uPhase;
  float r = mix(0.28, uRadius, pow(t, 0.85));
  r += sin(ang * 2.0 + uTime) * 0.06;
  vec3 center = vec3(cos(ang) * r, 0.75 + t * 3.5, sin(ang) * r);
  vec3 side = normalize(vec3(cos(ang), 0.15, sin(ang)));
  float w = mix(0.08, 0.48, t) * (uv.x - 0.5);
  w *= 0.75 + 0.25 * sin(t * 18.0 + uTime * 2.0);
  vec3 pos = center + side * w;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const ribbonFragment = /* glsl */ `
${NOISE}
uniform float uTime;
varying vec2 vUv;
varying float vT;
void main() {
  float across = 1.0 - smoothstep(0.05, 0.5, abs(vUv.x - 0.5));
  float along = smoothstep(0.0, 0.08, vT) * (1.0 - smoothstep(0.82, 1.0, vT));
  float n = fbm01(vec3(vUv.x * 1.5, vUv.y * 4.0 - uTime * 0.45, uTime * 0.15));
  float alpha = across * along * (0.25 + 0.75 * n) * 0.22;
  vec3 col = mix(vec3(0.45, 0.75, 1.0), vec3(0.9, 0.97, 1.0), n);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export function createAir() {
  const group = new THREE.Group();
  const pedestal = createPedestal(0xd7f3ff);
  group.add(pedestal);

  const primary = new THREE.Mesh(
    buildStreaks(320),
    shaderMaterial({
      uniforms: {
        uTime,
        uHeight: { value: 3.55 },
        uRadius: { value: 1.55 },
        uSpin: { value: 0.85 },
        uRise: { value: 0.22 },
        uDirection: { value: 1 },
        uBoost: { value: 0.55 },
      },
      vertex: streakVertex,
      fragment: streakFragment,
      side: THREE.DoubleSide,
      blend: "add",
    }),
  );
  primary.renderOrder = 3;
  group.add(primary);

  const secondary = new THREE.Mesh(
    buildStreaks(140),
    shaderMaterial({
      uniforms: {
        uTime,
        uHeight: { value: 3.1 },
        uRadius: { value: 1.85 },
        uSpin: { value: 0.45 },
        uRise: { value: 0.14 },
        uDirection: { value: -1 },
        uBoost: { value: 0.28 },
      },
      vertex: streakVertex,
      fragment: streakFragment,
      side: THREE.DoubleSide,
      blend: "add",
    }),
  );
  secondary.renderOrder = 2;
  group.add(secondary);

  const ribbonGeo = new THREE.PlaneGeometry(1, 1, 10, 80);
  for (let i = 0; i < 2; i += 1) {
    const mesh = new THREE.Mesh(
      ribbonGeo,
      shaderMaterial({
        uniforms: {
          uTime,
          uSpeed: { value: 0.55 + i * 0.12 },
          uPhase: { value: i * 2.2 },
          uRadius: { value: 1.35 + i * 0.18 },
        },
        vertex: ribbonVertex,
        fragment: ribbonFragment,
        side: THREE.DoubleSide,
        blend: "add",
      }),
    );
    mesh.renderOrder = 2;
    group.add(mesh);
  }

  const gusts = [];
  for (let i = 0; i < 3; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xe7f7ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 64), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 2;
    group.add(mesh);
    gusts.push({ mesh, material, phase: i / 3 });
  }

  const light = new THREE.PointLight(0xe7f6ff, 8, 10, 2);
  light.position.set(0, 2.2, 0);
  group.add(light);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(2.25, 12, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
  );
  hit.position.y = 2.1;
  group.add(hit);

  return {
    id: "air",
    name: "Air",
    copy: "A storm held in place: silk ribbons, a rising spiral, and gusts sliding off the stone.",
    accent: "#d7f3ff",
    labelHeight: 4.55,
    group,
    hit,
    accentMaterial: pedestal.children[2].material,
    update(time) {
      uTime.value = time;
      for (const gust of gusts) {
        const life = (time * 0.24 + gust.phase) % 1;
        const scale = 0.55 + life * 3.6;
        gust.mesh.scale.setScalar(scale);
        gust.mesh.position.y = 0.68 + life * 0.35;
        gust.material.opacity = Math.sin(life * Math.PI) * 0.1;
      }
      light.intensity = 7 + Math.sin(time * 1.4) * 1.5;
    },
  };
}
