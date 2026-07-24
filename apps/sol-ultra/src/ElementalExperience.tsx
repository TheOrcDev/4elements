import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const ELEMENTS = {
  fire: {
    name: "Fire",
    number: "01",
    essence: "Ignition",
    description:
      "Energy without restraint — a living mantle of heat, ember and ascent.",
    color: "#ff6a1a",
  },
  air: {
    name: "Air",
    number: "02",
    essence: "Motion",
    description:
      "Pressure made visible, with luminous currents braided around a weightless core.",
    color: "#b8f3ff",
  },
  water: {
    name: "Water",
    number: "03",
    essence: "Flow",
    description:
      "A suspended tide, folding light through an unbroken, endlessly moving skin.",
    color: "#22b8ff",
  },
  earth: {
    name: "Earth",
    number: "04",
    essence: "Form",
    description:
      "Ancient matter in orbit, split by mineral light and crowned with new growth.",
    color: "#a9c85b",
  },
} as const;

type ElementKey = keyof typeof ELEMENTS;
type ActiveElement = ElementKey | null;

const ELEMENT_ORDER = Object.keys(ELEMENTS) as ElementKey[];

type ElementController = {
  key: ElementKey;
  group: THREE.Group;
  hitArea: THREE.Mesh;
  tick: (time: number, delta: number) => void;
};

const NOISE_GLSL = `
  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash31(i + vec3(0, 0, 0)), hash31(i + vec3(1, 0, 0)), f.x),
        mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x),
        f.y
      ),
      mix(
        mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x),
        mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += amplitude * noise3(p);
      p = p * 2.03 + 9.17;
      amplitude *= 0.5;
    }
    return value;
  }
`;

const PARTICLE_VERTEX = `
  uniform float uTime;
  uniform float uMode;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSize;
  varying float vLife;
  varying float vSeed;

  void main() {
    const float TAU = 6.28318530718;
    vec3 seed = position;
    vec3 p = seed;
    float life = fract(aPhase + uTime * aSpeed * 0.12);

    if (uMode < 0.5) {
      float angle = aPhase * TAU + life * 2.4 + seed.y * 3.0;
      float radius = (0.12 + abs(seed.x) * 0.72) * (1.0 - life * 0.82);
      p = vec3(
        cos(angle) * radius + sin(uTime * 2.2 + seed.z * 8.0) * 0.12 * life,
        -0.92 + life * 3.15,
        sin(angle) * radius + cos(uTime * 1.8 + seed.x * 7.0) * 0.1 * life
      );
    } else if (uMode < 1.5) {
      float angle = aPhase * TAU + uTime * (0.45 + aSpeed * 0.25);
      float radius = 0.58 + abs(seed.x) * 0.95;
      p = vec3(
        cos(angle) * radius,
        seed.y * 0.82 + sin(angle * 2.0 + seed.z * 5.0) * 0.24,
        sin(angle) * radius
      );
      life = 0.5 + 0.5 * sin(angle * 1.7 + seed.y * 5.0);
    } else if (uMode < 2.5) {
      float y = -0.88 + life * 1.76;
      float shell = sqrt(max(0.05, 1.0 - y * y));
      float radius = shell * (0.12 + abs(seed.x) * 0.7);
      float angle = seed.z * TAU + uTime * 0.34 + life * 2.2;
      p = vec3(cos(angle) * radius, y, sin(angle) * radius);
    } else {
      float angle = aPhase * TAU + uTime * (0.08 + aSpeed * 0.07);
      float radius = 1.12 + abs(seed.x) * 0.92;
      p = vec3(
        cos(angle) * radius,
        seed.y * 0.92 + sin(angle * 1.5 + seed.z) * 0.16,
        sin(angle) * radius
      );
      life = 0.35 + 0.65 * abs(sin(angle + seed.y * 4.0));
    }

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uSize * uPixelRatio * (72.0 / max(1.0, -mvPosition.z));
    vLife = life;
    vSeed = seed.z;
  }
`;

const PARTICLE_FRAGMENT = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uMode;
  varying float vLife;
  varying float vSeed;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float distanceToCenter = length(centered);
    float alpha = smoothstep(0.5, 0.04, distanceToCenter);
    alpha *= alpha;

    vec3 color = mix(uColorA, uColorB, clamp(vLife + vSeed * 0.12, 0.0, 1.0));
    if (uMode < 0.5) {
      alpha *= smoothstep(1.0, 0.72, vLife) * 0.72;
      color *= 1.02 + (1.0 - vLife) * 0.62;
    } else if (uMode > 2.5) {
      alpha *= 0.28;
    } else {
      alpha *= 0.38;
    }

    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

function createParticleSystem(
  count: number,
  mode: number,
  colorA: string,
  colorB: string,
  pixelRatio: number,
  size = 1,
) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = Math.random() * 2 - 1;
    positions[offset + 1] = Math.random() * 2 - 1;
    positions[offset + 2] = Math.random() * 2 - 1;
    phases[index] = Math.random();
    speeds[index] = 0.65 + Math.random() * 0.9;
    sizes[index] = 0.55 + Math.random() * 1.2;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMode: { value: mode },
      uPixelRatio: { value: pixelRatio },
      uSize: { value: size },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    },
    vertexShader: PARTICLE_VERTEX,
    fragmentShader: PARTICLE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, material };
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.18, "rgba(255,255,255,0.35)");
    gradient.addColorStop(0.58, "rgba(255,255,255,0.08)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPedestal(color: string) {
  const group = new THREE.Group();
  const accent = new THREE.Color(color);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.28, 1.48, 0.22, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0b0e0d,
      metalness: 0.72,
      roughness: 0.28,
    }),
  );
  base.position.y = -1.38;
  group.add(base);

  const innerBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.07, 1.2, 0.12, 48),
    new THREE.MeshStandardMaterial({
      color: 0x131817,
      metalness: 0.62,
      roughness: 0.34,
    }),
  );
  innerBase.position.y = -1.22;
  group.add(innerBase);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.018, 8, 96),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.88,
      toneMapped: false,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.145;
  group.add(ring);

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.38, 0.008, 6, 96),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.24,
      toneMapped: false,
    }),
  );
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = -1.275;
  group.add(outerRing);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.12, 64),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -1.13;
  group.add(glow);

  return group;
}

function createHitArea(key: ElementKey) {
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.55, 12, 12), material);
  mesh.userData.elementKey = key;
  mesh.position.y = 0.05;
  return mesh;
}

function createFire(pixelRatio: number, mobile: boolean): ElementController {
  const group = new THREE.Group();
  group.add(createPedestal(ELEMENTS.fire.color));

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.58, 4),
    new THREE.MeshStandardMaterial({
      color: 0xb8320f,
      emissive: 0xff2600,
      emissiveIntensity: 0.92,
      roughness: 0.44,
      metalness: 0.06,
    }),
  );
  core.position.y = -0.78;
  core.scale.set(0.9, 0.48, 0.9);
  group.add(core);

  const flameVertex = `
    uniform float uTime;
    uniform float uPhase;
    varying float vNoise;
    varying float vHeight;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    ${NOISE_GLSL}

    void main() {
      vec3 p = position;
      float height = clamp((p.y + 1.0) * 0.5, 0.0, 1.0);
      float n = fbm(p * 2.25 + vec3(uPhase, -uTime * 1.45, uTime * 0.16));
      float taper = mix(0.96, 0.055, pow(height, 1.32));

      p.xz *= taper;
      p.x += sin(uTime * 2.35 + p.y * 4.1 + uPhase * 5.0) * 0.115 * height;
      p.z += cos(uTime * 1.82 + p.y * 3.5 + uPhase * 3.0) * 0.085 * height;
      p += normal * (n - 0.48) * (0.17 + height * 0.19);
      p.y += (n - 0.5) * 0.18;

      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorldPosition = world.xyz;
      vWorldNormal = normalize(normalMatrix * normal);
      vNoise = n;
      vHeight = height;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;

  const flameFragment = `
    uniform float uTime;
    uniform float uOpacity;
    varying float vNoise;
    varying float vHeight;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    ${NOISE_GLSL}

    void main() {
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - abs(dot(viewDirection, normalize(vWorldNormal))), 2.0);
      float textureNoise = fbm(vWorldPosition * 3.25 + vec3(0.0, -uTime * 2.0, 0.0));
      float heat = clamp((1.0 - vHeight) * 0.94 + textureNoise * 0.26, 0.0, 1.0);

      vec3 deep = vec3(0.48, 0.018, 0.002);
      vec3 orange = vec3(1.0, 0.16, 0.008);
      vec3 gold = vec3(1.0, 0.56, 0.035);
      vec3 whiteHot = vec3(1.0, 0.8, 0.34);
      vec3 color = mix(deep, orange, smoothstep(0.04, 0.42, heat));
      color = mix(color, gold, smoothstep(0.38, 0.7, heat));
      color = mix(color, whiteHot, smoothstep(0.72, 1.0, heat));

      float raggedEdge = smoothstep(0.19, 0.72, vNoise + textureNoise * 0.42 + (1.0 - vHeight) * 0.22);
      float tipFade = 1.0 - smoothstep(0.77, 1.0, vHeight);
      float alpha = (0.16 + fresnel * 0.22 + raggedEdge * 0.34) * tipFade * uOpacity;
      if (alpha < 0.035) discard;
      gl_FragColor = vec4(color * (0.5 + heat * 0.3), alpha);
    }
  `;

  const flameGeometry = new THREE.SphereGeometry(1, mobile ? 32 : 48, mobile ? 32 : 48);
  const flames: { mesh: THREE.Mesh; material: THREE.ShaderMaterial; speed: number }[] = [];
  const flameLayers = [
    { position: [0, 0.07, 0], scale: [0.78, 1.52, 0.76], phase: 0.1, opacity: 0.7, speed: 1 },
    { position: [-0.27, 0.34, 0.02], scale: [0.4, 1.08, 0.42], phase: 1.7, opacity: 0.5, speed: 1.15 },
    { position: [0.31, 0.22, -0.08], scale: [0.36, 0.94, 0.38], phase: 3.1, opacity: 0.46, speed: 0.92 },
  ];

  flameLayers.forEach((layer) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: layer.phase },
        uOpacity: { value: layer.opacity },
      },
      vertexShader: flameVertex,
      fragmentShader: flameFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(flameGeometry, material);
    mesh.position.set(...(layer.position as [number, number, number]));
    mesh.scale.set(...(layer.scale as [number, number, number]));
    group.add(mesh);
    flames.push({ mesh, material, speed: layer.speed });
  });

  const embers = createParticleSystem(
    mobile ? 460 : 880,
    0,
    "#ffb000",
    "#ff3700",
    pixelRatio,
    mobile ? 0.4 : 0.5,
  );
  group.add(embers.points);

  const light = new THREE.PointLight(0xff5218, 6.2, 6.5, 1.6);
  light.position.set(0, 0.22, 0.45);
  group.add(light);

  const hitArea = createHitArea("fire");
  group.add(hitArea);

  return {
    key: "fire",
    group,
    hitArea,
    tick: (time) => {
      flames.forEach(({ mesh, material, speed }, index) => {
        material.uniforms.uTime.value = time * speed;
        mesh.rotation.y = Math.sin(time * 0.34 + index) * 0.1;
      });
      embers.material.uniforms.uTime.value = time;
      light.intensity = 6 + Math.sin(time * 7.2) * 0.7 + Math.sin(time * 13.1) * 0.28;
      core.rotation.y = time * 0.14;
    },
  };
}

function createAir(
  pixelRatio: number,
  mobile: boolean,
  glowTexture: THREE.Texture,
): ElementController {
  const group = new THREE.Group();
  group.add(createPedestal(ELEMENTS.air.color));

  const vortex = new THREE.Group();
  group.add(vortex);

  const ribbonMaterials: THREE.MeshBasicMaterial[] = [];
  const ribbons: THREE.Mesh[] = [];
  const ribbonCount = mobile ? 5 : 8;

  for (let ribbonIndex = 0; ribbonIndex < ribbonCount; ribbonIndex += 1) {
    const points: THREE.Vector3[] = [];
    const phase = (ribbonIndex / ribbonCount) * Math.PI * 2;
    const turns = 1.05 + (ribbonIndex % 3) * 0.18;
    for (let index = 0; index <= 96; index += 1) {
      const progress = index / 96;
      const angle = progress * Math.PI * 2 * turns + phase;
      const radius = 0.72 + 0.28 * Math.sin(progress * Math.PI * 2 + phase);
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          (progress - 0.5) * 1.72 + Math.sin(angle * 1.8) * 0.14,
          Math.sin(angle) * radius,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, mobile ? 64 : 96, 0.009 + (ribbonIndex % 2) * 0.008, 4, false);
    const material = new THREE.MeshBasicMaterial({
      color: ribbonIndex % 3 === 0 ? 0xffffff : 0x9eeaff,
      transparent: true,
      opacity: 0.18 + (ribbonIndex % 3) * 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const ribbon = new THREE.Mesh(geometry, material);
    ribbon.rotation.z = phase * 0.08;
    vortex.add(ribbon);
    ribbons.push(ribbon);
    ribbonMaterials.push(material);
  }

  const airOrbMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      uniform float uTime;
      void main() {
        vec3 p = position;
        p += normal * sin(position.y * 7.0 + uTime * 1.6) * 0.018;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorldPosition = world.xyz;
        vWorldNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, normalize(vWorldNormal))), 3.2);
        float alpha = fresnel * 0.62 + 0.025;
        vec3 color = mix(vec3(0.18, 0.54, 0.68), vec3(0.72, 0.96, 1.0), fresnel);
        gl_FragColor = vec4(color * (0.82 + fresnel * 0.42), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.58, 5), airOrbMaterial);
  group.add(orb);

  const pressureWaves = new THREE.Group();
  for (let index = 0; index < 3; index += 1) {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(1.05 + index * 0.17, 0.01, 5, 96, Math.PI * 1.45),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? 0xffffff : 0x95e9ff,
        transparent: true,
        opacity: 0.16 - index * 0.025,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    wave.rotation.set(Math.PI * (0.2 + index * 0.18), index * 0.7, index * 1.4);
    pressureWaves.add(wave);
  }
  group.add(pressureWaves);

  const motes = createParticleSystem(
    mobile ? 350 : 680,
    1,
    "#70d9ec",
    "#ffffff",
    pixelRatio,
    mobile ? 0.32 : 0.4,
  );
  group.add(motes.points);

  const clouds = new THREE.Group();
  const cloudMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xc9f5ff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  for (let index = 0; index < 11; index += 1) {
    const sprite = new THREE.Sprite(cloudMaterial);
    const angle = (index / 11) * Math.PI * 2;
    const radius = 0.65 + Math.random() * 0.7;
    sprite.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 1.45,
      Math.sin(angle) * radius,
    );
    const scale = 0.48 + Math.random() * 0.65;
    sprite.scale.set(scale, scale, scale);
    clouds.add(sprite);
  }
  group.add(clouds);

  const light = new THREE.PointLight(0x8aeaff, 1.85, 5.5, 2);
  light.position.set(0.2, 0.45, 0.8);
  group.add(light);

  const hitArea = createHitArea("air");
  group.add(hitArea);

  return {
    key: "air",
    group,
    hitArea,
    tick: (time, delta) => {
      airOrbMaterial.uniforms.uTime.value = time;
      motes.material.uniforms.uTime.value = time;
      vortex.rotation.y += delta * 0.3;
      vortex.rotation.z = Math.sin(time * 0.22) * 0.12;
      pressureWaves.rotation.y = -time * 0.18;
      pressureWaves.rotation.x = Math.sin(time * 0.3) * 0.12;
      clouds.rotation.y = time * 0.07;
      ribbons.forEach((ribbon, index) => {
        ribbon.rotation.y += delta * (0.04 + index * 0.008);
        ribbonMaterials[index].opacity = 0.16 + (index % 3) * 0.07 + Math.sin(time * 0.8 + index) * 0.025;
      });
    },
  };
}

function createWater(pixelRatio: number, mobile: boolean): ElementController {
  const group = new THREE.Group();
  group.add(createPedestal(ELEMENTS.water.color));

  const waterVertex = `
    uniform float uTime;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vLocalPosition;
    varying float vWave;
    ${NOISE_GLSL}

    void main() {
      vec3 p = position;
      float waveA = sin(p.x * 5.2 + uTime * 1.25) * 0.032;
      float waveB = sin(p.z * 6.4 - uTime * 1.05) * 0.025;
      float n = fbm(p * 3.4 + vec3(uTime * 0.08, -uTime * 0.13, uTime * 0.09)) - 0.5;
      float displacement = waveA + waveB + n * 0.075;
      p += normal * displacement;
      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorldPosition = world.xyz;
      vWorldNormal = normalize(normalMatrix * normalize(normal + displacement * 0.32));
      vLocalPosition = p;
      vWave = displacement;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;

  const waterFragment = `
    uniform float uTime;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vLocalPosition;
    varying float vWave;

    void main() {
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      vec3 normal = normalize(vWorldNormal);
      float fresnel = pow(1.0 - max(0.0, dot(viewDirection, normal)), 2.65);
      float causticA = sin(vLocalPosition.y * 18.0 + vLocalPosition.x * 9.0 - uTime * 2.0);
      float causticB = sin(vLocalPosition.z * 15.0 - vLocalPosition.y * 8.0 + uTime * 1.55);
      float caustic = pow(max(0.0, causticA * causticB), 3.0);
      float depth = clamp(vLocalPosition.y * 0.45 + 0.5, 0.0, 1.0);

      vec3 deep = vec3(0.005, 0.085, 0.24);
      vec3 mid = vec3(0.01, 0.42, 0.72);
      vec3 surface = vec3(0.35, 0.95, 1.0);
      vec3 color = mix(deep, mid, depth);
      color = mix(color, surface, fresnel * 0.86 + caustic * 0.28);
      float specular = pow(max(dot(reflect(-viewDirection, normal), normalize(vec3(0.4, 0.8, 0.25))), 0.0), 22.0);
      color += surface * specular * 0.72;
      float alpha = 0.72 + fresnel * 0.24;
      gl_FragColor = vec4(color * (0.84 + fresnel * 0.4), alpha);
    }
  `;

  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });

  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.94, mobile ? 40 : 64, mobile ? 28 : 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x005f8d,
      emissive: 0x002944,
      emissiveIntensity: 0.28,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.52,
      transmission: 0.12,
      thickness: 0.7,
    }),
  );
  inner.scale.set(0.97, 1.04, 0.97);
  inner.position.y = 0.02;
  group.add(inner);

  const water = new THREE.Mesh(
    new THREE.SphereGeometry(1.02, mobile ? 44 : 72, mobile ? 32 : 52),
    waterMaterial,
  );
  water.scale.set(0.96, 1.06, 0.96);
  water.position.y = 0.02;
  group.add(water);

  const rings = new THREE.Group();
  const ringMaterials: THREE.MeshBasicMaterial[] = [];
  for (let index = 0; index < 3; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: index === 1 ? 0x77ecff : 0x078ddd,
      transparent: true,
      opacity: 0.22 - index * 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.12 + index * 0.15, 0.018 - index * 0.003, 7, 128, Math.PI * (1.35 + index * 0.16)),
      material,
    );
    ring.rotation.set(Math.PI * (0.43 + index * 0.15), index * 0.8, index * 1.4);
    rings.add(ring);
    ringMaterials.push(material);
  }
  group.add(rings);

  const bubbles = createParticleSystem(
    mobile ? 300 : 560,
    2,
    "#0a8ac6",
    "#b8fbff",
    pixelRatio,
    mobile ? 0.3 : 0.37,
  );
  group.add(bubbles.points);

  const light = new THREE.PointLight(0x11baf4, 3.2, 5.5, 1.8);
  light.position.set(-0.45, 0.55, 1.2);
  group.add(light);

  const hitArea = createHitArea("water");
  group.add(hitArea);

  return {
    key: "water",
    group,
    hitArea,
    tick: (time, delta) => {
      waterMaterial.uniforms.uTime.value = time;
      bubbles.material.uniforms.uTime.value = time;
      water.rotation.y += delta * 0.11;
      inner.rotation.y -= delta * 0.08;
      rings.rotation.y = time * 0.19;
      rings.rotation.z = Math.sin(time * 0.32) * 0.12;
      ringMaterials.forEach((material, index) => {
        material.opacity = 0.14 + Math.sin(time * 0.9 + index * 1.7) * 0.045;
      });
      light.intensity = 3 + Math.sin(time * 1.7) * 0.45;
    },
  };
}

function createEarth(pixelRatio: number, mobile: boolean): ElementController {
  const group = new THREE.Group();
  group.add(createPedestal(ELEMENTS.earth.color));

  const rockGeometry = new THREE.IcosahedronGeometry(1.03, mobile ? 4 : 5);
  const positionAttribute = rockGeometry.getAttribute("position") as THREE.BufferAttribute;
  const colors = new Float32Array(positionAttribute.count * 3);
  const lowColor = new THREE.Color(0x30251c);
  const stoneColor = new THREE.Color(0x6a563d);
  const mossColor = new THREE.Color(0x66853b);
  const ridgeColor = new THREE.Color(0xb29a68);
  const vertex = new THREE.Vector3();

  for (let index = 0; index < positionAttribute.count; index += 1) {
    vertex.fromBufferAttribute(positionAttribute, index);
    const ridge =
      Math.sin(vertex.x * 7.1 + vertex.y * 2.3) * 0.055 +
      Math.sin(vertex.z * 9.4 - vertex.x * 3.2) * 0.038 +
      Math.sin((vertex.x + vertex.y + vertex.z) * 12.0) * 0.018;
    const scale = 1 + ridge + Math.sin(vertex.y * 11.0) * 0.022;
    vertex.multiplyScalar(scale);
    vertex.y *= 0.9;
    positionAttribute.setXYZ(index, vertex.x, vertex.y, vertex.z);

    let color = lowColor.clone().lerp(stoneColor, Math.max(0, vertex.y + 0.4) * 0.54);
    if (vertex.y > 0.28 && ridge > -0.02) color = color.lerp(mossColor, 0.72);
    if (ridge > 0.055) color = color.lerp(ridgeColor, 0.5);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  positionAttribute.needsUpdate = true;
  rockGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  rockGeometry.computeVertexNormals();

  const rock = new THREE.Mesh(
    rockGeometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.04,
    }),
  );
  rock.position.y = 0.02;
  group.add(rock);

  const seam = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.055, 2),
    new THREE.MeshBasicMaterial({
      color: 0xffb04a,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  seam.scale.y = 0.9;
  seam.position.y = 0.02;
  group.add(seam);

  const up = new THREE.Vector3(0, 1, 0);
  const mossGeometry = new THREE.ConeGeometry(0.032, 0.13, 5);
  const mossMaterial = new THREE.MeshStandardMaterial({
    color: 0x8bad4a,
    roughness: 0.92,
  });
  const mossCount = mobile ? 36 : 72;
  const moss = new THREE.InstancedMesh(mossGeometry, mossMaterial, mossCount);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scaleVector = new THREE.Vector3();
  const surfaceNormal = new THREE.Vector3();

  for (let index = 0; index < mossCount; index += 1) {
    const y = 0.22 + Math.random() * 0.75;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(1 - Math.min(0.98, y * y));
    surfaceNormal.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius).normalize();
    quaternion.setFromUnitVectors(up, surfaceNormal);
    const position = surfaceNormal.clone().multiplyScalar(1.04);
    position.y *= 0.9;
    const scale = 0.65 + Math.random() * 1.4;
    scaleVector.set(scale, scale, scale);
    matrix.compose(position, quaternion, scaleVector);
    moss.setMatrixAt(index, matrix);
  }
  moss.instanceMatrix.needsUpdate = true;
  group.add(moss);

  const crystals = new THREE.Group();
  const crystalGeometry = new THREE.OctahedronGeometry(0.09, 0);
  const crystalMaterials = [
    new THREE.MeshStandardMaterial({
      color: 0xffc45b,
      emissive: 0xff7b22,
      emissiveIntensity: 0.75,
      roughness: 0.25,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x7fd6a6,
      emissive: 0x1f7650,
      emissiveIntensity: 0.48,
      roughness: 0.28,
    }),
  ];
  for (let index = 0; index < (mobile ? 8 : 14); index += 1) {
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterials[index % 2]);
    const y = 0.15 + Math.random() * 0.78;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(1 - Math.min(0.98, y * y));
    surfaceNormal.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius).normalize();
    crystal.position.copy(surfaceNormal).multiplyScalar(1.08);
    crystal.position.y *= 0.9;
    crystal.quaternion.setFromUnitVectors(up, surfaceNormal);
    crystal.scale.y = 1.4 + Math.random() * 1.6;
    crystals.add(crystal);
  }
  group.add(crystals);

  const fragments = new THREE.Group();
  const fragmentGeometry = new THREE.IcosahedronGeometry(0.11, 1);
  const fragmentMaterial = new THREE.MeshStandardMaterial({
    color: 0x594a36,
    roughness: 0.9,
  });
  for (let index = 0; index < (mobile ? 14 : 26); index += 1) {
    const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
    const angle = (index / (mobile ? 14 : 26)) * Math.PI * 2;
    const radius = 1.35 + Math.random() * 0.85;
    fragment.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 1.4,
      Math.sin(angle) * radius,
    );
    const scale = 0.35 + Math.random() * 1.25;
    fragment.scale.setScalar(scale);
    fragment.userData.spin = 0.25 + Math.random() * 0.55;
    fragments.add(fragment);
  }
  group.add(fragments);

  const dust = createParticleSystem(
    mobile ? 360 : 680,
    3,
    "#76674a",
    "#d6bd79",
    pixelRatio,
    mobile ? 0.28 : 0.34,
  );
  group.add(dust.points);

  const light = new THREE.PointLight(0xd5a04f, 2.3, 4.8, 2);
  light.position.set(0.55, 0.25, 1);
  group.add(light);

  const hitArea = createHitArea("earth");
  group.add(hitArea);

  return {
    key: "earth",
    group,
    hitArea,
    tick: (time, delta) => {
      dust.material.uniforms.uTime.value = time;
      rock.rotation.y += delta * 0.08;
      seam.rotation.y -= delta * 0.055;
      moss.rotation.y = rock.rotation.y;
      crystals.rotation.y = rock.rotation.y;
      fragments.rotation.y = -time * 0.06;
      fragments.children.forEach((fragment, index) => {
        fragment.rotation.x += delta * (fragment.userData.spin as number);
        fragment.rotation.y += delta * (0.18 + index * 0.006);
      });
      light.intensity = 2.15 + Math.sin(time * 1.2) * 0.24;
    },
  };
}

function createBackground(scene: THREE.Scene, mobile: boolean) {
  const starCount = mobile ? 520 : 1100;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);

  for (let index = 0; index < starCount; index += 1) {
    const offset = index * 3;
    positions[offset] = (Math.random() - 0.5) * 30;
    positions[offset + 1] = (Math.random() - 0.35) * 16;
    positions[offset + 2] = -2 - Math.random() * 18;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xa6d1ce,
    size: mobile ? 0.018 : 0.024,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(geometry, material));

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(15, 96),
    new THREE.MeshStandardMaterial({
      color: 0x050706,
      roughness: 0.74,
      metalness: 0.34,
      transparent: true,
      opacity: 0.86,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.58;
  scene.add(floor);

  const grid = new THREE.GridHelper(28, 28, 0x365452, 0x172220);
  const gridMaterial = grid.material as THREE.Material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.13;
  grid.position.y = -1.565;
  scene.add(grid);
}

export default function ElementalExperience() {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<ActiveElement>(null);
  const [active, setActive] = useState<ActiveElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      setReady(true);
      return;
    }

    const mobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pixelRatio = Math.min(window.devicePixelRatio, mobile ? 1.35 : 1.7);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.84;
    renderer.setClearColor(0x020504, 1);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "elemental-canvas";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020504);
    scene.fog = new THREE.FogExp2(0x020504, mobile ? 0.045 : 0.035);

    const camera = new THREE.PerspectiveCamera(
      mobile ? 48 : 42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      80,
    );
    camera.position.set(0, 2.15, mobile ? 13.8 : 12.7);

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(mount.clientWidth, mount.clientHeight);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      mobile ? 0.48 : 0.58,
      0.42,
      0.5,
    );
    composer.addPass(bloom);

    scene.add(new THREE.HemisphereLight(0x8cb3b2, 0x150d08, 0.72));
    const keyLight = new THREE.DirectionalLight(0xcbe7df, 2.1);
    keyLight.position.set(3.5, 6, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x4d7088, 1.35);
    rimLight.position.set(-5, 2.5, -4);
    scene.add(rimLight);

    createBackground(scene, mobile);
    const glowTexture = createGlowTexture();

    const world = new THREE.Group();
    scene.add(world);

    const controllers: ElementController[] = [
      createFire(pixelRatio, mobile),
      createAir(pixelRatio, mobile, glowTexture),
      createWater(pixelRatio, mobile),
      createEarth(pixelRatio, mobile),
    ];
    const controllerByKey = new Map(
      controllers.map((controller) => [controller.key, controller]),
    );

    const desktopPositions = [
      new THREE.Vector3(-4.35, 0.05, 0.25),
      new THREE.Vector3(-1.45, 0.05, 0),
      new THREE.Vector3(1.45, 0.05, 0),
      new THREE.Vector3(4.35, 0.05, 0.25),
    ];
    const mobilePositions = [
      new THREE.Vector3(-1.46, 1.3, 0.05),
      new THREE.Vector3(1.46, 1.3, 0),
      new THREE.Vector3(-1.46, -1.28, 0),
      new THREE.Vector3(1.46, -1.28, 0.05),
    ];
    const layoutPositions = mobile ? mobilePositions : desktopPositions;

    controllers.forEach((controller, index) => {
      controller.group.position.copy(layoutPositions[index]);
      controller.group.scale.setScalar(mobile ? 0.78 : 0.92);
      world.add(controller.group);
    });

    const connectionGeometry = new THREE.BufferGeometry().setFromPoints(
      mobile
        ? [
            new THREE.Vector3(-1.46, 1.3, 0),
            new THREE.Vector3(1.46, 1.3, 0),
            new THREE.Vector3(1.46, -1.28, 0),
            new THREE.Vector3(-1.46, -1.28, 0),
            new THREE.Vector3(-1.46, 1.3, 0),
          ]
        : desktopPositions.map((position) => new THREE.Vector3(position.x, -1.32, 0)),
    );
    const connections = new THREE.Line(
      connectionGeometry,
      new THREE.LineBasicMaterial({
        color: 0x7caaa4,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
      }),
    );
    if (mobile) connections.position.y = -0.06;
    world.add(connections);

    const timer = new THREE.Timer();
    timer.connect(document);
    const currentLook = new THREE.Vector3(0, 0.15, 0);
    const desiredLook = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const selectedPosition = new THREE.Vector3();
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const hitAreas = controllers.map((controller) => controller.hitArea);
    let animationFrame = 0;
    let frameCount = 0;
    let manualYaw = 0;
    let zoomOffset = 0;
    let pointerDown = false;
    let dragged = false;
    let pointerStartX = 0;
    let previousPointerX = 0;
    let sceneVisible = !document.hidden;

    const selectFromPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(hitAreas, false);
      if (intersections.length > 0) {
        const key = intersections[0].object.userData.elementKey as ElementKey;
        setActive(key);
        setHasInteracted(true);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      dragged = false;
      pointerStartX = event.clientX;
      previousPointerX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (pointerDown) {
        const movement = event.clientX - previousPointerX;
        if (Math.abs(event.clientX - pointerStartX) > 3) dragged = true;
        manualYaw += movement * 0.0045;
        manualYaw = THREE.MathUtils.clamp(manualYaw, -0.72, 0.72);
        previousPointerX = event.clientX;
        setHasInteracted(true);
      } else {
        raycaster.setFromCamera(pointer, camera);
        const isHovering = raycaster.intersectObjects(hitAreas, false).length > 0;
        renderer.domElement.style.cursor = isHovering ? "pointer" : "grab";
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragged) selectFromPointer(event);
      pointerDown = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grab";
    };

    const onPointerCancel = () => {
      pointerDown = false;
      dragged = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomOffset = THREE.MathUtils.clamp(
        zoomOffset + event.deltaY * 0.0017,
        -0.7,
        1.65,
      );
      setHasInteracted(true);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key >= "1" && event.key <= "4") {
        setActive(ELEMENT_ORDER[Number(event.key) - 1]);
        setHasInteracted(true);
      } else if (event.key === "Escape" || event.key.toLowerCase() === "o") {
        setActive(null);
        setHasInteracted(true);
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const currentIndex = activeRef.current
          ? ELEMENT_ORDER.indexOf(activeRef.current)
          : event.key === "ArrowRight"
            ? -1
            : 0;
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex =
          (currentIndex + direction + ELEMENT_ORDER.length) % ELEMENT_ORDER.length;
        setActive(ELEMENT_ORDER[nextIndex]);
        setHasInteracted(true);
      }
    };

    const onVisibilityChange = () => {
      sceneVisible = !document.hidden;
      if (sceneVisible) timer.reset();
    };

    const onResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerCancel);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      if (!sceneVisible) return;

      timer.update();
      const delta = Math.min(timer.getDelta(), 0.05);
      const time = timer.getElapsed();
      const motionTime = reducedMotion ? 0.001 : time;
      const selectedKey = activeRef.current;
      const ease = reducedMotion ? 1 : 1 - Math.exp(-delta * 3.2);

      world.rotation.y = THREE.MathUtils.lerp(
        world.rotation.y,
        manualYaw + (mobile ? 0 : pointer.x * 0.025),
        1 - Math.exp(-delta * 2.2),
      );

      controllers.forEach((controller) => {
        const isSelected = controller.key === selectedKey;
        const targetScale = selectedKey
          ? isSelected
            ? mobile
              ? 1.02
              : 1.16
            : mobile
              ? 0.58
              : 0.7
          : mobile
            ? 0.78
            : 0.92;
        const nextScale = THREE.MathUtils.lerp(
          controller.group.scale.x,
          targetScale,
          ease,
        );
        controller.group.scale.setScalar(nextScale);
        controller.tick(motionTime, reducedMotion ? 0 : delta);
      });

      if (selectedKey) {
        const selected = controllerByKey.get(selectedKey);
        if (selected) {
          selected.group.getWorldPosition(selectedPosition);
          desiredLook.copy(selectedPosition);
          desiredLook.y += mobile ? 0.12 : 0.05;
          desiredCamera.copy(selectedPosition);
          desiredCamera.x += mobile ? 0 : pointer.x * 0.12;
          desiredCamera.y += mobile ? 0.42 : 0.72 + pointer.y * 0.12;
          desiredCamera.z += (mobile ? 6.05 : 6.35) + zoomOffset;
        }
      } else {
        desiredLook.set(0, mobile ? 0.05 : 0.12, 0);
        desiredCamera.set(
          mobile ? 0 : pointer.x * 0.28,
          (mobile ? 2.15 : 2.05) + (mobile ? 0 : pointer.y * 0.16),
          (mobile ? 13.9 : 12.7) + zoomOffset,
        );
      }

      camera.position.lerp(desiredCamera, ease);
      currentLook.lerp(desiredLook, ease);
      camera.lookAt(currentLook);
      composer.render();

      frameCount += 1;
      if (frameCount === 2) setReady(true);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerCancel);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      glowTexture.dispose();
      timer.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const activeData = active ? ELEMENTS[active] : null;

  return (
    <main
      className={`elemental-experience ${ready ? "is-ready" : ""} ${
        active ? `has-focus focus-${active}` : "is-overview"
      }`}
    >
      <div className="scene-mount" ref={mountRef}>
        {failed && (
          <div className="webgl-fallback" role="alert">
            <span>WebGL is unavailable.</span>
            <p>This elemental field needs hardware-accelerated 3D graphics.</p>
          </div>
        )}
      </div>

      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="site-header">
        <button
          className="wordmark"
          type="button"
          onClick={() => {
            setActive(null);
            setHasInteracted(true);
          }}
          aria-label="Return to the four element overview"
        >
          <span className="wordmark-glyph" aria-hidden="true">
            ✣
          </span>
          <span>
            <strong>PRIMAL</strong>
            <small>THE FOUR ELEMENTS</small>
          </span>
        </button>

        <div className="runtime-status" aria-label="Real-time Three.js experience">
          <span className="status-dot" />
          <span>REAL-TIME</span>
          <i />
          <span>THREE.JS</span>
        </div>
      </header>

      <div className="hero-title" aria-hidden="true">
        <span>MATTER</span>
        <strong>UNBOUND</strong>
      </div>

      <div className="axis-mark axis-mark-left" aria-hidden="true">
        <span>N 41° 23&apos; 16&quot;</span>
        <i />
      </div>
      <div className="axis-mark axis-mark-right" aria-hidden="true">
        <i />
        <span>E 002° 10&apos; 36&quot;</span>
      </div>

      <section
        className={`element-caption ${activeData ? "is-visible" : ""}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="caption-index">{activeData?.number ?? "00"}</div>
        <div className="caption-copy">
          <span className="caption-essence">
            {activeData?.essence ?? "The elemental field"}
          </span>
          <h1>{activeData?.name ?? "Four forces. One world."}</h1>
          <p>
            {activeData?.description ??
              "Select a force to enter its field and inspect it in motion."}
          </p>
        </div>
      </section>

      <div className={`interaction-hint ${hasInteracted ? "is-hidden" : ""}`}>
        <span className="hint-line" />
        <span>Drag to orbit</span>
        <i>·</i>
        <span>Scroll to move</span>
        <i>·</i>
        <span>1–4 to focus</span>
      </div>

      <nav className="element-selector" aria-label="Choose an element">
        <button
          className={`overview-button ${active === null ? "is-active" : ""}`}
          type="button"
          onClick={() => {
            setActive(null);
            setHasInteracted(true);
          }}
          aria-pressed={active === null}
        >
          <span className="overview-icon" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>Overview</span>
        </button>

        <div className="selector-rule" aria-hidden="true" />

        <div className="element-buttons">
          {ELEMENT_ORDER.map((key, index) => {
            const element = ELEMENTS[key];
            return (
              <button
                key={key}
                className={`element-button element-${key} ${
                  active === key ? "is-active" : ""
                }`}
                type="button"
                onClick={() => {
                  setActive(key);
                  setHasInteracted(true);
                }}
                aria-pressed={active === key}
                aria-label={`${element.name}, ${element.essence}. Press ${index + 1} to focus.`}
              >
                <span className="button-number">0{index + 1}</span>
                <span className={`alchemy-symbol symbol-${key}`} aria-hidden="true">
                  <i />
                </span>
                <span className="button-name">{element.name}</span>
                <span className="button-essence">{element.essence}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="loading-veil" aria-hidden={ready}>
        <div className="loading-sigil">
          <span />
          <span />
          <span />
          <span />
          <i />
        </div>
        <div className="loading-copy">
          <span>CONVENING THE ELEMENTS</span>
          <small>REAL-TIME FIELD INITIALISATION</small>
        </div>
      </div>
    </main>
  );
}
