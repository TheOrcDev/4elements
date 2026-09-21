import * as THREE from "three";
import { NOISE } from "../glsl.js";
import { shaderMaterial } from "../materials.js";
import { createPedestal } from "../pedestal.js";

const uTime = { value: 0 };
const POOL = 1.28;

const waveLib = /* glsl */ `
struct Gerstner {
  vec3 pos;
  vec3 normal;
};

void addWave(inout float h, inout vec3 n, inout vec2 dxz, vec2 xz, float time, float amp, float len, vec2 dirIn, float speed) {
  vec2 dir = normalize(dirIn);
  float k = 6.2831853 / len;
  float f = k * (dot(dir, xz) - speed * time);
  h += amp * sin(f);
  dxz += dir * amp * cos(f);
  n.x -= dir.x * k * amp * cos(f);
  n.z -= dir.y * k * amp * cos(f);
}

Gerstner gerstner(vec2 xz, float time) {
  float h = 0.0;
  vec3 n = vec3(0.0, 1.0, 0.0);
  vec2 dxz = vec2(0.0);
  addWave(h, n, dxz, xz, time, 0.075, 1.55, vec2(1.0, 0.28), 0.82);
  addWave(h, n, dxz, xz, time, 0.05, 0.9, vec2(-0.35, 1.0), 1.05);
  addWave(h, n, dxz, xz, time, 0.032, 0.5, vec2(0.7, -0.65), 1.35);
  addWave(h, n, dxz, xz, time, 0.02, 0.28, vec2(-0.9, -0.2), 1.7);
  float r = length(xz);
  float whirl = sin(atan(xz.y, xz.x) * 2.0 - time * 1.5 + r * 6.0) * 0.011 * (1.0 - smoothstep(0.15, 1.15, r));
  h += whirl;
  h -= 0.04 * exp(-r * r * 0.9);
  return Gerstner(vec3(xz.x + dxz.x * 0.65, h, xz.y + dxz.y * 0.65), normalize(n));
}
`;

const surfaceVertex = /* glsl */ `
${waveLib}
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vXz;
varying float vHeight;
void main() {
  vec2 xz = position.xy;
  Gerstner g = gerstner(xz, uTime);
  vXz = xz;
  vHeight = g.pos.y;
  vec4 world = modelMatrix * vec4(g.pos, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * g.normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const surfaceFragment = /* glsl */ `
${NOISE}
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vXz;
varying float vHeight;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(vec3(0.45 + sin(uTime * 0.35) * 0.35, 1.0, 0.4));
  float ndl = clamp(dot(N, L), 0.0, 1.0);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
  vec3 H = normalize(L + V);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 36.0);
  float broad = pow(clamp(dot(N, H), 0.0, 1.0), 8.0);
  float r = length(vXz);
  vec3 deep = vec3(0.0, 0.14, 0.24);
  vec3 midc = vec3(0.02, 0.45, 0.58);
  vec3 shore = vec3(0.25, 0.82, 0.84);
  vec3 col = mix(deep, midc, 0.42 + ndl * 0.35 + smoothstep(0.15, 1.15, r) * 0.4);
  col = mix(col, shore, fres * 0.42 + smoothstep(0.85, 1.22, r) * 0.22);
  float c1 = 0.5 + 0.5 * snoise(vec3(vXz * 1.5, uTime * 0.22));
  float c2 = 0.5 + 0.5 * snoise(vec3(vXz * 3.1 + 2.0, uTime * 0.16));
  col += vec3(0.08, 0.35, 0.42) * (c1 * c1 * 0.35 + c2 * 0.15);
  float foamN = fbm01(vec3(vXz * 3.1, uTime * 0.32));
  float edge = smoothstep(0.92, 1.24, r);
  float foam = clamp(edge * smoothstep(0.35, 0.8, foamN + edge), 0.0, 1.0);
  col = mix(col, vec3(0.78, 0.96, 0.98), foam * 0.4);
  col += vec3(0.75, 0.92, 1.0) * spec * 0.55;
  col += vec3(0.2, 0.5, 0.62) * broad * 0.22;
  col += vec3(0.2, 0.55, 0.62) * smoothstep(0.045, 0.09, vHeight) * 0.35;
  col += shore * fres * 0.18;
  gl_FragColor = vec4(col, 1.0);
}
`;

const causticVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const causticFragment = /* glsl */ `
${NOISE}
varying vec2 vUv;
uniform float uTime;
void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  float r = length(uv);
  float mask = 1.0 - smoothstep(0.72, 1.0, r);
  vec2 p = uv * 3.2;
  float t = uTime * 0.45;
  float n1 = snoise(vec3(p, t));
  float n2 = snoise(vec3(p * 1.8 + 4.0, t * 0.8));
  float c = pow(1.0 - abs(n1), 6.0) + pow(1.0 - abs(n2), 9.0);
  vec3 col = vec3(0.22, 0.85, 1.0) * c * 0.85;
  float alpha = mask * c * 0.55;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const orbVertex = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uSeed;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vLocal;
void main() {
  float n = snoise(position * 2.1 + vec3(0.0, uTime * 0.55, uSeed));
  vec3 pos = position + normal * n * 0.05;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  vLocal = pos;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const orbFragment = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uSeed;
uniform vec3 uDeep;
uniform vec3 uShallow;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vLocal;
void main() {
  vec3 N = normalize(vNormal);
  float n1 = snoise(vLocal * 3.2 + vec3(uTime * 0.4, uSeed, 0.0));
  float n2 = snoise(vLocal * 3.2 + vec3(2.0, uTime * 0.35, uSeed));
  vec3 Np = normalize(N + vec3(n1, n2, n1 * 0.6) * 0.04);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(vec3(0.5, 1.0, 0.35));
  float fres = pow(1.0 - clamp(dot(Np, V), 0.0, 1.0), 2.6);
  float ndl = clamp(dot(Np, L), 0.0, 1.0);
  float wrap = pow(clamp(dot(N, -L) * 0.5 + 0.5, 0.0, 1.0), 1.6);
  float spec = pow(clamp(dot(Np, normalize(L + V)), 0.0, 1.0), 80.0);
  float caust = 0.5 + 0.5 * snoise(vLocal * 1.6 + vec3(0.0, uTime * 0.35, uSeed));
  vec3 col = mix(uDeep, uShallow, fres * 0.55 + ndl * 0.28);
  col += uShallow * wrap * 0.35;
  col += vec3(0.3, 0.75, 0.9) * caust * (1.0 - fres) * 0.12;
  col += vec3(0.9, 0.98, 1.0) * spec * 1.2;
  col += vec3(0.15, 0.5, 0.75) * fres * 0.7;
  float alpha = mix(0.62, 0.94, fres);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const spoutVertex = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec3 pos = position;
  float ang = atan(pos.z, pos.x);
  float wave = sin(ang * 3.0 + pos.y * 9.0 - uTime * 4.2) * 0.03;
  wave += sin(ang * 6.0 - uTime * 2.4 + pos.y * 5.0) * 0.016;
  vec2 radial = normalize(pos.xz + vec2(1e-4));
  pos.xz = radial * (length(pos.xz) + wave);
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const spoutFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - abs(dot(N, V)), 1.8);
  float streak = pow(0.5 + 0.5 * sin(vUv.y * 46.0 - uTime * 7.0 + vUv.x * 10.0), 8.0);
  float band = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
  vec3 deep = vec3(0.02, 0.25, 0.38);
  vec3 bright = vec3(0.55, 0.95, 1.0);
  vec3 col = mix(deep, bright, fres * 0.75 + streak * 0.55);
  float alpha = band * (0.18 + fres * 0.55 + streak * 0.35);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const dropVertex = /* glsl */ `
attribute float aSeed;
attribute float aAngle;
attribute float aRadius;
attribute float aSpeed;
uniform float uTime;
uniform float uDpr;
varying float vLife;
void main() {
  float life = fract(aSeed + uTime * aSpeed);
  vLife = life;
  float ang = aAngle + sin(life * 8.0 + aSeed) * 0.2;
  float r = aRadius * (1.0 - life * 0.25);
  vec3 pos = vec3(cos(ang) * r, mix(2.55, 1.08, life), sin(ang) * r);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((1.0 - life) * uDpr * 42.0 / max(-mv.z, 0.2), 1.0, 16.0);
}
`;

const dropFragment = /* glsl */ `
varying float vLife;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float soft = exp(-d * 3.5);
  float alpha = soft * (1.0 - smoothstep(0.75, 1.0, vLife)) * 0.85;
  vec3 col = mix(vec3(0.85, 0.97, 1.0), vec3(0.2, 0.7, 0.9), vLife);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export function createWater() {
  const group = new THREE.Group();
  const pedestal = createPedestal(0x3ec8e0);
  group.add(pedestal);

  const stone = new THREE.MeshStandardMaterial({
    color: 0x1a242c,
    roughness: 0.32,
    metalness: 0.48,
  });
  const wet = new THREE.MeshStandardMaterial({
    color: 0x0e181f,
    roughness: 0.18,
    metalness: 0.22,
    side: THREE.DoubleSide,
  });

  const floor = new THREE.Mesh(new THREE.CircleGeometry(POOL + 0.04, 64), wet);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.66;
  group.add(floor);

  const caustics = new THREE.Mesh(
    new THREE.CircleGeometry(POOL, 64),
    shaderMaterial({
      uniforms: { uTime },
      vertex: causticVertex,
      fragment: causticFragment,
      blend: "add",
    }),
  );
  caustics.rotation.x = -Math.PI / 2;
  caustics.position.y = 0.675;
  caustics.renderOrder = 1;
  group.add(caustics);

  const wall = new THREE.Mesh(new THREE.CylinderGeometry(POOL + 0.06, POOL + 0.02, 0.52, 72, 1, true), wet);
  wall.position.y = 0.92;
  group.add(wall);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(POOL + 0.13, 0.08, 16, 80), stone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.16;
  group.add(rim);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(POOL + 0.12, 0.012, 8, 80),
    new THREE.MeshStandardMaterial({
      color: 0xd5ebe8,
      metalness: 1,
      roughness: 0.18,
      emissive: 0x123840,
      emissiveIntensity: 0.4,
    }),
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 1.2;
  group.add(lip);

  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(POOL - 0.02, 160),
    shaderMaterial({
      uniforms: { uTime },
      vertex: surfaceVertex,
      fragment: surfaceFragment,
      blend: "opaque",
    }),
  );
  surface.position.y = 1.02;
  group.add(surface);

  const spout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.16, 1.35, 40, 32, true),
    shaderMaterial({
      uniforms: { uTime },
      vertex: spoutVertex,
      fragment: spoutFragment,
      side: THREE.DoubleSide,
      blend: "over",
    }),
  );
  spout.position.y = 1.7;
  spout.renderOrder = 3;
  group.add(spout);

  const orbGeo = new THREE.SphereGeometry(1, 48, 36);
  const orbs = [
    { scale: 0.52, y: 2.05, rad: 0.22, speed: 0.4, phase: 0.2, seed: 0.4, deep: [0.0, 0.14, 0.24], shallow: [0.25, 0.78, 0.88] },
    { scale: 0.3, y: 2.55, rad: 0.55, speed: 0.58, phase: 2.1, seed: 2.2, deep: [0.0, 0.18, 0.28], shallow: [0.4, 0.88, 0.95] },
    { scale: 0.2, y: 2.95, rad: 0.32, speed: -0.46, phase: 4.0, seed: 5.5, deep: [0.02, 0.2, 0.3], shallow: [0.65, 0.95, 1.0] },
  ].map((spec) => {
    const mesh = new THREE.Mesh(
      orbGeo,
      shaderMaterial({
        uniforms: {
          uTime,
          uSeed: { value: spec.seed },
          uDeep: { value: new THREE.Color(...spec.deep) },
          uShallow: { value: new THREE.Color(...spec.shallow) },
        },
        vertex: orbVertex,
        fragment: orbFragment,
        blend: "over",
      }),
    );
    mesh.scale.setScalar(spec.scale);
    mesh.renderOrder = 4;
    group.add(mesh);
    return { mesh, ...spec };
  });

  const dropCount = 160;
  const dropGeo = new THREE.BufferGeometry();
  const seeds = new Float32Array(dropCount);
  const angles = new Float32Array(dropCount);
  const radii = new Float32Array(dropCount);
  const speeds = new Float32Array(dropCount);
  for (let i = 0; i < dropCount; i += 1) {
    seeds[i] = Math.random();
    angles[i] = Math.random() * Math.PI * 2;
    radii[i] = Math.random() * 0.36;
    speeds[i] = 0.35 + Math.random() * 0.55;
  }
  dropGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dropCount * 3), 3));
  dropGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  dropGeo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
  dropGeo.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
  dropGeo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  const drops = new THREE.Points(
    dropGeo,
    shaderMaterial({
      uniforms: { uTime, uDpr: { value: Math.min(window.devicePixelRatio || 1, 1.6) } },
      vertex: dropVertex,
      fragment: dropFragment,
      blend: "add",
    }),
  );
  drops.renderOrder = 5;
  group.add(drops);

  const light = new THREE.PointLight(0x39d4ff, 26, 12, 2);
  light.position.set(0, 1.7, 0);
  group.add(light);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(2.05, 12, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
  );
  hit.position.y = 1.5;
  group.add(hit);

  return {
    id: "water",
    name: "Water",
    copy: "A basin of moving tide, caustics on the stone, and three drops suspended over the spout.",
    accent: "#3ec8e0",
    labelHeight: 3.7,
    group,
    hit,
    accentMaterial: pedestal.children[2].material,
    update(time) {
      uTime.value = time;
      for (const orb of orbs) {
        const angle = time * orb.speed + orb.phase;
        orb.mesh.position.set(
          Math.cos(angle) * orb.rad,
          orb.y + Math.sin(time * 0.9 + orb.phase) * 0.08,
          Math.sin(angle) * orb.rad * 0.82,
        );
      }
      light.intensity = 22 + Math.sin(time * 1.6) * 4;
    },
  };
}
