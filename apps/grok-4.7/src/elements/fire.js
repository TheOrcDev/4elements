import * as THREE from "three";
import { NOISE } from "../glsl.js";
import { shaderMaterial } from "../materials.js";
import { createPedestal } from "../pedestal.js";
import { createSoftTexture } from "../soft.js";

const uTime = { value: 0 };

const flameVertex = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uSeed;
uniform float uSpread;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = position;
  float h = uv.y;
  float taper = mix(1.0, 0.045, pow(h, 0.7));
  pos.x *= taper * uSpread;
  float flutter = snoise(vec3(h * 2.6, uTime * 1.35 + uSeed, uSeed));
  pos.x += flutter * 0.16 * h;
  pos.z += snoise(vec3(uSeed * 1.7, h * 3.4 - uTime * 1.8, 2.0)) * 0.2 * pow(h, 0.85);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const flameFragment = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uSeed;
uniform float uHot;
varying vec2 vUv;
void main() {
  float h = vUv.y;
  float x = vUv.x - 0.5;
  x += snoise(vec3(h * 1.8, uTime * 0.7 + uSeed, 3.0)) * 0.045 * h;
  float halfW = mix(0.46, 0.015, pow(max(h, 0.0), 0.58));
  float mask = 1.0 - smoothstep(halfW * 0.28, halfW, abs(x));
  mask *= smoothstep(0.0, 0.045, h);
  mask *= 1.0 - smoothstep(0.68, 1.0, h);

  vec3 q = vec3(vUv.x * 2.2 + uSeed, vUv.y * 3.6 - uTime * (1.15 + uHot * 0.55), uTime * 0.22 + uSeed);
  float n = fbm01(q);
  float n2 = fbm01(q * 2.05 + vec3(4.0, 1.2, 8.0));
  float flames = clamp(n * 0.52 + n2 * 0.48 + 0.18, 0.0, 1.0);
  float body = smoothstep(0.12, 0.66, flames) * mask;
  float core = (1.0 - smoothstep(0.0, halfW * 0.42, abs(x))) * (1.0 - smoothstep(0.05, 0.72, h));
  core *= mask;

  vec3 deep = vec3(0.62, 0.03, 0.0);
  vec3 red = vec3(1.55, 0.18, 0.0);
  vec3 orange = vec3(1.85, 0.52, 0.03);
  vec3 yellow = vec3(1.95, 1.15, 0.32);
  vec3 white = vec3(1.85, 1.7, 1.25);
  vec3 col = mix(deep, red, smoothstep(0.0, 0.32, flames));
  col = mix(col, orange, smoothstep(0.18, 0.55, flames));
  col = mix(col, yellow, smoothstep(0.42, 0.82, flames));
  col = mix(col, white, core * (0.45 + 0.55 * uHot));
  col *= mix(0.85, 1.45, uHot);

  float alpha = clamp(body + core * 0.9, 0.0, 1.0);
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const lavaVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const lavaFragment = /* glsl */ `
${NOISE}
varying vec2 vUv;
uniform float uTime;
void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float r = length(uv);
  float v1 = voronoi(vUv * 8.0 + vec2(0.0, uTime * 0.045));
  float v2 = voronoi(vUv * 3.4 + vec2(uTime * 0.03, 1.7));
  float crack = 1.0 - smoothstep(0.0, 0.075, v1);
  crack = max(crack, 1.0 - smoothstep(0.0, 0.05, v2));
  float pulse = 0.82 + 0.18 * sin(uTime * 2.6 + r * 9.0);
  vec3 crust = vec3(0.045, 0.018, 0.012);
  vec3 lava = vec3(1.9, 0.32, 0.02);
  vec3 hot = vec3(2.4, 1.25, 0.4);
  vec3 col = mix(crust, lava, crack);
  col = mix(col, hot, pow(crack, 1.6) * pulse);
  float pool = 1.0 - smoothstep(0.0, 0.26, r);
  col = mix(col, hot * pulse, pool * 0.72);
  col = mix(col, crust, smoothstep(0.62, 0.98, r));
  gl_FragColor = vec4(col, 1.0);
}
`;

const emberVertex = /* glsl */ `
attribute float aSeed;
attribute float aAngle;
attribute float aRadius;
attribute float aSpeed;
attribute float aSize;
attribute float aLift;
uniform float uTime;
uniform float uDpr;
varying float vLife;
varying float vSeed;
void main() {
  float life = fract(aSeed + uTime * aSpeed);
  vLife = life;
  vSeed = aSeed;
  float ang = aAngle + life * 2.2;
  float r = aRadius * mix(0.25, 1.0, life);
  r += sin(uTime * 4.0 + aSeed * 30.0) * 0.025;
  vec3 pos = vec3(cos(ang) * r, 0.2 + life * aLift, sin(ang) * r);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uDpr * 110.0 / max(-mv.z, 0.15), 1.5, 42.0);
}
`;

const emberFragment = /* glsl */ `
varying float vLife;
varying float vSeed;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float soft = exp(-d * 2.8);
  float fade = smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.45, 1.0, vLife));
  vec3 col = mix(vec3(1.8, 1.35, 0.75), vec3(1.7, 0.38, 0.03), smoothstep(0.0, 0.45, vLife));
  col = mix(col, vec3(0.7, 0.06, 0.0), smoothstep(0.4, 1.0, vLife));
  float tw = 0.7 + 0.3 * sin(vSeed * 50.0 + vLife * 40.0);
  float alpha = soft * fade * tw;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const smokeVertex = /* glsl */ `
attribute float aSeed;
attribute float aAngle;
attribute float aSpeed;
uniform float uTime;
uniform float uDpr;
varying float vLife;
void main() {
  float life = fract(aSeed + uTime * aSpeed);
  vLife = life;
  float ang = aAngle + life * 0.8;
  float r = mix(0.12, 0.55, life);
  vec3 pos = vec3(cos(ang) * r, 2.3 + life * 2.4, sin(ang) * r);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(mix(10.0, 46.0, life) * uDpr * 8.0 / max(-mv.z, 0.2), 2.0, 90.0);
}
`;

const smokeFragment = /* glsl */ `
varying float vLife;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float soft = exp(-d * 2.2);
  float fade = smoothstep(0.0, 0.15, vLife) * (1.0 - smoothstep(0.55, 1.0, vLife));
  vec3 col = vec3(0.22, 0.18, 0.16);
  float alpha = soft * fade * 0.22;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function makeEmbers(count, dpr) {
  const geometry = new THREE.BufferGeometry();
  const seeds = new Float32Array(count);
  const angles = new Float32Array(count);
  const radii = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const lifts = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    seeds[i] = Math.random();
    angles[i] = Math.random() * Math.PI * 2;
    radii[i] = Math.pow(Math.random(), 0.7) * 0.62;
    speeds[i] = 0.22 + Math.random() * 0.55;
    sizes[i] = 0.35 + Math.random() * 1.35;
    lifts[i] = 2.4 + Math.random() * 1.7;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
  geometry.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aLift", new THREE.BufferAttribute(lifts, 1));
  const material = shaderMaterial({
    uniforms: { uTime, uDpr: { value: dpr } },
    vertex: emberVertex,
    fragment: emberFragment,
    blend: "add",
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 4;
  return points;
}

export function createFire() {
  const group = new THREE.Group();
  const pedestal = createPedestal(0xff6a2a);
  group.add(pedestal);

  const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  const plane = new THREE.PlaneGeometry(2.35, 3.55, 8, 32);
  const flames = new THREE.Group();
  const layers = [
    { n: 5, spread: 1.22, hot: 0.12, sx: 1.5, sy: 1.16, y: 0.0 },
    { n: 4, spread: 0.78, hot: 0.58, sx: 1.02, sy: 1.04, y: 0.08 },
    { n: 3, spread: 0.4, hot: 1.0, sx: 0.52, sy: 0.94, y: 0.16 },
  ];
  let index = 0;
  for (const layer of layers) {
    for (let i = 0; i < layer.n; i += 1) {
      const material = shaderMaterial({
        uniforms: {
          uTime,
          uSeed: { value: index * 1.37 + 0.4 },
          uSpread: { value: layer.spread },
          uHot: { value: layer.hot },
        },
        vertex: flameVertex,
        fragment: flameFragment,
        side: THREE.DoubleSide,
        blend: "add",
      });
      const mesh = new THREE.Mesh(plane, material);
      mesh.rotation.y = (index / 12) * Math.PI + layer.hot;
      mesh.position.y = 2.52 + layer.y;
      mesh.scale.set(layer.sx, layer.sy, 1);
      mesh.renderOrder = 3;
      flames.add(mesh);
      index += 1;
    }
  }
  group.add(flames);

  const lava = new THREE.Mesh(
    new THREE.CircleGeometry(1.05, 64),
    shaderMaterial({
      uniforms: { uTime },
      vertex: lavaVertex,
      fragment: lavaFragment,
      blend: "opaque",
    }),
  );
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = 0.645;
  group.add(lava);

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x2c1812,
    roughness: 0.88,
    metalness: 0.06,
    emissive: 0x3a1204,
    emissiveIntensity: 0.25,
  });
  const rockGeo = new THREE.IcosahedronGeometry(0.26, 1);
  for (let i = 0; i < 7; i += 1) {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const angle = (i / 7) * Math.PI * 2 + 0.35;
    const radius = 0.72 + (i % 3) * 0.16;
    rock.position.set(Math.cos(angle) * radius, 0.74 + (i % 2) * 0.06, Math.sin(angle) * radius);
    rock.scale.set(0.85 + (i % 3) * 0.45, 0.55 + (i % 2) * 0.35, 0.9 + (i % 4) * 0.2);
    rock.rotation.set(i * 0.7, angle, i * 0.4);
    group.add(rock);
  }

  const logMat = new THREE.MeshStandardMaterial({
    color: 0x1a0d09,
    roughness: 0.78,
    metalness: 0.04,
    emissive: 0xff4a10,
    emissiveIntensity: 0.18,
  });
  for (let i = 0; i < 3; i += 1) {
    const log = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.62, 3, 8), logMat);
    log.rotation.set(0.2, i * 1.2, Math.PI / 2.3 + i * 0.35);
    log.position.set(Math.cos(i * 2.1) * 0.28, 0.78, Math.sin(i * 2.1) * 0.22);
    group.add(log);
  }

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createSoftTexture(),
      color: new THREE.Color(1.15, 0.34, 0.05),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.28,
    }),
  );
  glow.position.y = 1.85;
  glow.scale.set(3.1, 4.3, 1);
  glow.renderOrder = 1;
  group.add(glow);

  group.add(makeEmbers(900, dpr));

  const smokeGeo = new THREE.BufferGeometry();
  const smokeCount = 70;
  const sSeed = new Float32Array(smokeCount);
  const sAngle = new Float32Array(smokeCount);
  const sSpeed = new Float32Array(smokeCount);
  for (let i = 0; i < smokeCount; i += 1) {
    sSeed[i] = Math.random();
    sAngle[i] = Math.random() * Math.PI * 2;
    sSpeed[i] = 0.08 + Math.random() * 0.08;
  }
  smokeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(smokeCount * 3), 3));
  smokeGeo.setAttribute("aSeed", new THREE.BufferAttribute(sSeed, 1));
  smokeGeo.setAttribute("aAngle", new THREE.BufferAttribute(sAngle, 1));
  smokeGeo.setAttribute("aSpeed", new THREE.BufferAttribute(sSpeed, 1));
  const smoke = new THREE.Points(
    smokeGeo,
    shaderMaterial({
      uniforms: { uTime, uDpr: { value: dpr } },
      vertex: smokeVertex,
      fragment: smokeFragment,
      blend: "over",
    }),
  );
  smoke.renderOrder = 5;
  group.add(smoke);

  const light = new THREE.PointLight(0xff6a22, 36, 16, 2);
  light.position.set(0, 1.55, 0);
  group.add(light);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(2.15, 12, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
  );
  hit.position.y = 1.9;
  group.add(hit);

  return {
    id: "fire",
    name: "Fire",
    copy: "A white-hot core tearing upward through orange, with embers breaking off the column.",
    accent: "#ff6a2a",
    labelHeight: 4.35,
    group,
    hit,
    accentMaterial: pedestal.children[2].material,
    update(time) {
      uTime.value = time;
      light.intensity = 24 + Math.sin(time * 11.0) * 5 + Math.sin(time * 23.0) * 2.5;
      glow.material.opacity = 0.22 + Math.sin(time * 9.0) * 0.06;
    },
  };
}
