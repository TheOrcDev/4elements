import * as THREE from "three";
import { NOISE } from "../glsl.js";
import { shaderMaterial } from "../materials.js";
import { createPedestal } from "../pedestal.js";

const uTime = { value: 0 };

const rockVertex = /* glsl */ `
${NOISE}
uniform float uSeed;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormalW;
varying float vDisp;

float n2(vec3 p) {
  return snoise(p) * 0.65 + snoise(p * 2.15 + 4.0) * 0.35;
}

float displace(vec3 p) {
  vec3 q = p * 1.3 + vec3(uSeed);
  float warp = n2(q);
  vec3 r = q + vec3(warp, warp * 0.4, -warp) * 0.42;
  float big = n2(r);
  float ridge = pow(1.0 - abs(n2(r * 1.85 + vec3(2.0, 5.0, 1.0))), 2.0);
  float d = big * 0.2 + ridge * 0.4;
  float up = smoothstep(-0.55, 0.28, p.y);
  return d * mix(0.22, 1.0, up);
}

void main() {
  vLocal = position;
  float d = displace(position);
  vDisp = d;
  float e = 0.14;
  vec3 g = vec3(
    displace(position + vec3(e, 0.0, 0.0)) - displace(position - vec3(e, 0.0, 0.0)),
    displace(position + vec3(0.0, e, 0.0)) - displace(position - vec3(0.0, e, 0.0)),
    displace(position + vec3(0.0, 0.0, e)) - displace(position - vec3(0.0, 0.0, e))
  ) / (2.0 * e);
  vNormalW = normalize(mat3(modelMatrix) * normalize(normal - g));
  vec3 pos = position + normal * d;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const rockFragment = /* glsl */ `
${NOISE}
uniform float uSeed;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormalW;
varying float vDisp;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(vec3(0.45, 1.0, 0.28));
  vec3 L2 = normalize(vec3(-0.7, 0.25, -0.35));
  float ndl = clamp(dot(N, L), 0.0, 1.0);
  float fill = clamp(dot(N, L2), 0.0, 1.0);
  float hemi = N.y * 0.5 + 0.5;
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
  float slope = clamp(N.y, 0.0, 1.0);

  float strata = fbm01(vec3(vLocal.y * 3.2, vLocal.x * 0.4 + uSeed, 0.2));
  float mineral = fbm01(vLocal * 2.6 + vec3(uSeed));
  vec3 soil = vec3(0.1, 0.07, 0.05);
  vec3 stone = vec3(0.32, 0.24, 0.17);
  vec3 pale = vec3(0.5, 0.42, 0.32);
  vec3 moss = vec3(0.1, 0.26, 0.08);
  vec3 gold = vec3(1.25, 0.68, 0.16);

  vec3 albedo = mix(soil, stone, smoothstep(-0.4, 0.55, strata));
  albedo = mix(albedo, pale, smoothstep(0.45, 0.95, slope) * 0.55);
  albedo = mix(albedo, pale * 0.85, smoothstep(0.35, 0.9, mineral) * 0.35);
  float mossAmt = smoothstep(0.42, 0.88, slope) * smoothstep(0.85, 0.15, vLocal.y);
  mossAmt *= smoothstep(0.35, 0.75, fbm01(vLocal * 3.0 + vec3(4.0)));
  albedo = mix(albedo, moss, mossAmt * 0.85);

  float vein = smoothstep(0.62, 0.78, fbm01(vLocal * 5.0 + vec3(uSeed * 0.2, 2.0, 6.0)));
  vein *= smoothstep(0.2, 0.7, 1.0 - slope);
  albedo = mix(albedo, gold, vein);

  float ao = smoothstep(-0.02, 0.42, vDisp);
  albedo *= mix(0.42, 1.0, ao);

  vec3 ambient = mix(vec3(0.22, 0.12, 0.08), vec3(0.55, 0.58, 0.62), hemi);
  vec3 col = albedo * (ambient * 0.85 + ndl * vec3(1.15, 0.95, 0.75) + fill * vec3(0.35, 0.45, 0.55) * 0.4);
  float spec = pow(clamp(dot(N, normalize(L + V)), 0.0, 1.0), 48.0) * (1.0 - mossAmt);
  col += vec3(1.0, 0.9, 0.75) * spec * 0.18;
  col += vec3(0.85, 0.7, 0.45) * fres * 0.18;
  col += gold * vein * 0.85;
  gl_FragColor = vec4(col, 1.0);
}
`;

const crystalVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;

const crystalFragment = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
uniform vec3 uColor;
uniform vec3 uGlow;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 L = normalize(vec3(0.4, 0.85, 0.3));
  float ndl = clamp(dot(N, L), 0.0, 1.0);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.2);
  float spec = pow(clamp(dot(N, normalize(L + V)), 0.0, 1.0), 60.0);
  vec3 col = uColor * (0.18 + ndl * 0.85);
  col += uGlow * (0.25 + fres * 1.15);
  col += uGlow * pow(fres, 5.0) * 0.9;
  col += vec3(1.0, 0.95, 0.85) * spec * 0.55;
  gl_FragColor = vec4(col, 1.0);
}
`;

const dustVertex = /* glsl */ `
attribute float aSeed;
attribute float aAngle;
attribute float aRadius;
attribute float aSpeed;
uniform float uTime;
uniform float uDpr;
varying float vLife;
void main() {
  float life = fract(aSeed + uTime * 0.07 * aSpeed);
  vLife = life;
  float ang = aAngle + uTime * 0.12 * aSpeed;
  float r = aRadius + sin(uTime * 0.35 + aSeed * 6.0) * 0.08;
  vec3 pos = vec3(cos(ang) * r, 0.75 + life * 2.15, sin(ang) * r);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uDpr * 28.0 / max(-mv.z, 0.2), 1.0, 10.0);
}
`;

const dustFragment = /* glsl */ `
varying float vLife;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float soft = exp(-d * 2.4);
  float fade = smoothstep(0.0, 0.12, vLife) * (1.0 - smoothstep(0.7, 1.0, vLife));
  vec3 col = vec3(0.55, 0.44, 0.28);
  float alpha = soft * fade * 0.45;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function rockMaterial(seed) {
  return shaderMaterial({
    uniforms: { uSeed: { value: seed }, uTime },
    vertex: rockVertex,
    fragment: rockFragment,
    blend: "opaque",
  });
}

export function createEarth() {
  const group = new THREE.Group();
  const pedestal = createPedestal(0xd4a24a);
  group.add(pedestal);

  const boulder = new THREE.Mesh(new THREE.IcosahedronGeometry(1.02, 5), rockMaterial(0.0));
  boulder.position.y = 1.38;
  boulder.frustumCulled = false;
  group.add(boulder);

  const secondary = new THREE.Mesh(new THREE.IcosahedronGeometry(1.02, 5), rockMaterial(11.5));
  secondary.scale.setScalar(0.48);
  secondary.position.set(1.02, 0.98, 0.28);
  secondary.rotation.y = 2.4;
  secondary.frustumCulled = false;
  group.add(secondary);

  const crystalMat = (color, glow) =>
    shaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(...color) },
        uGlow: { value: new THREE.Color(...glow) },
      },
      vertex: crystalVertex,
      fragment: crystalFragment,
      blend: "opaque",
    });

  const crystalGeo = new THREE.OctahedronGeometry(0.18, 0);
  const crystals = [
    { dir: new THREE.Vector3(0.15, 1.0, 0.05), scale: 3.1, color: [0.55, 0.24, 0.05], glow: [1.8, 0.62, 0.12] },
    { dir: new THREE.Vector3(0.78, 0.55, 0.18), scale: 2.4, color: [0.28, 0.36, 0.08], glow: [0.7, 1.25, 0.22] },
    { dir: new THREE.Vector3(-0.62, 0.62, 0.32), scale: 2.7, color: [0.5, 0.22, 0.04], glow: [1.6, 0.45, 0.08] },
    { dir: new THREE.Vector3(0.05, 0.7, -0.7), scale: 2.15, color: [0.4, 0.3, 0.08], glow: [1.35, 0.85, 0.18] },
    { dir: new THREE.Vector3(-0.2, 0.92, -0.22), scale: 1.8, color: [0.2, 0.38, 0.12], glow: [0.55, 1.3, 0.32] },
  ];
  const up = new THREE.Vector3(0, 1, 0);
  for (const spec of crystals) {
    const mesh = new THREE.Mesh(crystalGeo, crystalMat(spec.color, spec.glow));
    const dir = spec.dir.clone().normalize();
    mesh.quaternion.setFromUnitVectors(up, dir);
    mesh.position.copy(dir).multiplyScalar(1.22);
    mesh.scale.set(1, spec.scale, 1);
    boulder.add(mesh);
  }

  const stoneColors = [0x7d756b, 0x6a6258, 0x5e6858, 0x8a8174, 0x6e655c];
  for (let i = 0; i < 5; i += 1) {
    const height = 1.05 + (i % 3) * 0.38;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32 + (i % 2) * 0.1, height, 0.16),
      new THREE.MeshStandardMaterial({
        color: stoneColors[i],
        roughness: 0.8,
        metalness: 0.06,
      }),
    );
    const angle = (i / 5) * Math.PI * 2 + 0.55;
    mesh.position.set(Math.cos(angle) * 1.5, 0.62 + height * 0.5, Math.sin(angle) * 1.5);
    mesh.lookAt(0, mesh.position.y, 0);
    mesh.rotateZ(i % 2 === 0 ? 0.07 : -0.09);
    group.add(mesh);
  }

  const rubbleMat = new THREE.MeshStandardMaterial({
    color: 0x4e463c,
    roughness: 0.92,
    metalness: 0.04,
  });
  const rubbleGeo = new THREE.IcosahedronGeometry(0.14, 1);
  for (let i = 0; i < 8; i += 1) {
    const mesh = new THREE.Mesh(rubbleGeo, rubbleMat);
    const angle = (i / 8) * Math.PI * 2;
    const radius = 0.72 + (i % 3) * 0.16;
    mesh.position.set(Math.cos(angle) * radius, 0.7, Math.sin(angle) * radius);
    mesh.scale.set(1 + (i % 3) * 0.4, 0.5 + (i % 2) * 0.25, 0.85);
    mesh.rotation.set(i, angle, i * 0.4);
    group.add(mesh);
  }

  const satellites = [];
  const satGeo = new THREE.IcosahedronGeometry(0.18, 2);
  for (let i = 0; i < 5; i += 1) {
    const mesh = new THREE.Mesh(satGeo, rubbleMat);
    mesh.scale.setScalar(0.65 + (i % 3) * 0.35);
    group.add(mesh);
    satellites.push({
      mesh,
      radius: 1.95 + (i % 2) * 0.28,
      speed: 0.16 + i * 0.035,
      phase: (i / 5) * Math.PI * 2,
      y: 1.55 + (i % 3) * 0.32,
    });
  }

  const dustCount = 160;
  const dustGeo = new THREE.BufferGeometry();
  const seeds = new Float32Array(dustCount);
  const angles = new Float32Array(dustCount);
  const radii = new Float32Array(dustCount);
  const speeds = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i += 1) {
    seeds[i] = Math.random();
    angles[i] = Math.random() * Math.PI * 2;
    radii[i] = 0.9 + Math.random() * 1.3;
    speeds[i] = 0.6 + Math.random() * 1.1;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dustCount * 3), 3));
  dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  dustGeo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
  dustGeo.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
  dustGeo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  const dust = new THREE.Points(
    dustGeo,
    shaderMaterial({
      uniforms: { uTime, uDpr: { value: Math.min(window.devicePixelRatio || 1, 1.6) } },
      vertex: dustVertex,
      fragment: dustFragment,
      blend: "over",
    }),
  );
  dust.renderOrder = 2;
  group.add(dust);

  const light = new THREE.PointLight(0xffb15a, 14, 8, 2);
  light.position.set(0.2, 1.9, 0.1);
  group.add(light);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 12, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
  );
  hit.position.y = 1.5;
  group.add(hit);

  return {
    id: "earth",
    name: "Earth",
    copy: "Cut standing stones around a living boulder, moss on the faces, amber crystals in the seams.",
    accent: "#d4a24a",
    labelHeight: 3.35,
    group,
    hit,
    accentMaterial: pedestal.children[2].material,
    update(time) {
      uTime.value = time;
      for (const sat of satellites) {
        const angle = time * sat.speed + sat.phase;
        sat.mesh.position.set(
          Math.cos(angle) * sat.radius,
          sat.y + Math.sin(time * 0.8 + sat.phase) * 0.12,
          Math.sin(angle) * sat.radius,
        );
        sat.mesh.rotation.y = angle;
        sat.mesh.rotation.x += 0.002;
      }
    },
  };
}
