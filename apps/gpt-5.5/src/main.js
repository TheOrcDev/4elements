import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070c, 0.034);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 140);
camera.position.set(0, 6.2, 14);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 7.5;
controls.maxDistance = 34;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 1.5, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.48, 0.54, 0.13);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const clock = new THREE.Clock();
const mouse = new THREE.Vector2();
const targetLook = new THREE.Vector3();
const tmpVector = new THREE.Vector3();
const focusTargets = {
  fire: { position: new THREE.Vector3(-6.35, 4.4, 9.4), target: new THREE.Vector3(-5.05, 1.8, -2.15) },
  air: { position: new THREE.Vector3(4.35, 4.9, 9.4), target: new THREE.Vector3(2.9, 1.9, -2.15) },
  water: { position: new THREE.Vector3(-4.15, 4.2, 9.8), target: new THREE.Vector3(-2.9, 1.25, 2.85) },
  earth: { position: new THREE.Vector3(6.35, 4.0, 9.5), target: new THREE.Vector3(5.05, 1.3, 2.85) },
};
const overviewCamera = {
  desktop: {
    fov: 48,
    position: new THREE.Vector3(0, 7.2, 16.3),
    target: new THREE.Vector3(0, 1.55, 0.15),
  },
  mobile: {
    fov: 60,
    position: new THREE.Vector3(0, 8.8, 25.2),
    target: new THREE.Vector3(0, 1.65, 0.2),
  },
};
let desiredCamera = null;
let overviewMode = true;

function currentOverviewPreset() {
  return window.innerWidth / window.innerHeight < 0.78 ? overviewCamera.mobile : overviewCamera.desktop;
}

function applyOverviewCamera(instant = false) {
  const preset = currentOverviewPreset();
  camera.fov = preset.fov;
  camera.updateProjectionMatrix();

  if (instant) {
    camera.position.copy(preset.position);
    controls.target.copy(preset.target);
    return;
  }

  desiredCamera = {
    position: preset.position.clone(),
    target: preset.target.clone(),
  };
}

const world = new THREE.Group();
scene.add(world);

const ambient = new THREE.HemisphereLight(0x8db7ff, 0x1d1006, 1.45);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff1d0, 3.3);
sun.position.set(-7, 12, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 42;
sun.shadow.camera.left = -13;
sun.shadow.camera.right = 13;
sun.shadow.camera.top = 13;
sun.shadow.camera.bottom = -13;
scene.add(sun);

const moon = new THREE.DirectionalLight(0x6ebeff, 1.1);
moon.position.set(9, 8, -9);
scene.add(moon);

const points = [
  new THREE.Vector3(-8, -1.9, -5),
  new THREE.Vector3(-4.6, -2.2, 3.6),
  new THREE.Vector3(0, -1.75, 5.2),
  new THREE.Vector3(4.6, -2.2, 3.6),
  new THREE.Vector3(8, -1.9, -5),
];
const bridgeCurve = new THREE.CatmullRomCurve3(points);
const bridgeGeometry = new THREE.TubeGeometry(bridgeCurve, 84, 0.055, 8, false);
const bridgeMaterial = new THREE.MeshStandardMaterial({
  color: 0x9ab8c7,
  emissive: 0x2d5b62,
  emissiveIntensity: 0.65,
  roughness: 0.3,
  metalness: 0.2,
});
const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
world.add(bridge);

const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0x0d1418,
  emissive: 0x08161a,
  roughness: 0.44,
  metalness: 0.7,
});

function makePedestal(position, color, emissive) {
  const group = new THREE.Group();
  group.position.copy(position);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.58, 1.86, 0.5, 72),
    new THREE.MeshStandardMaterial({
      color: 0x171818,
      emissive,
      emissiveIntensity: 0.17,
      roughness: 0.64,
      metalness: 0.18,
    }),
  );
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(1.36, 1.48, 0.18, 72),
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0.25,
      roughness: 0.35,
      metalness: 0.38,
    }),
  );
  top.position.y = 0.34;
  top.receiveShadow = true;
  top.castShadow = true;
  group.add(top);

  const torus = new THREE.Mesh(new THREE.TorusGeometry(1.46, 0.035, 8, 96), ringMaterial.clone());
  torus.position.y = 0.48;
  torus.rotation.x = Math.PI / 2;
  group.add(torus);

  world.add(group);
  return group;
}

const firePedestal = makePedestal(new THREE.Vector3(-5.05, 0, -2.15), 0x3b1710, 0xff4300);
const airPedestal = makePedestal(new THREE.Vector3(2.9, 0, -2.15), 0x15252c, 0x86e6ff);
const waterPedestal = makePedestal(new THREE.Vector3(-2.9, 0, 2.85), 0x0b1d31, 0x1aa6ff);
const earthPedestal = makePedestal(new THREE.Vector3(5.05, 0, 2.85), 0x1d2113, 0x72b153);

function createNoiseTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    const stride = i * 4;
    const value = Math.floor(Math.random() * 255);
    data[stride] = value;
    data[stride + 1] = Math.min(255, value + Math.random() * 45);
    data[stride + 2] = Math.max(0, value - Math.random() * 60);
    data[stride + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

const noiseTexture = createNoiseTexture();

function createFire(position) {
  const group = new THREE.Group();
  group.position.copy(position);

  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.24, 0.42, 64),
    new THREE.MeshStandardMaterial({
      color: 0x20110c,
      emissive: 0x7d1a00,
      emissiveIntensity: 0.7,
      roughness: 0.43,
      metalness: 0.42,
    }),
  );
  basin.position.y = 0.68;
  basin.castShadow = true;
  basin.receiveShadow = true;
  group.add(basin);

  const ember = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.48, 5),
    new THREE.MeshStandardMaterial({
      color: 0xff8b2a,
      emissive: 0xff3200,
      emissiveIntensity: 3.6,
      roughness: 0.2,
      metalness: 0,
    }),
  );
  ember.position.y = 1.03;
  group.add(ember);

  const flameUniforms = {
    time: { value: 0 },
    tintA: { value: new THREE.Color(0xff3100) },
    tintB: { value: new THREE.Color(0xffd35a) },
    tintC: { value: new THREE.Color(0xffffff) },
  };

  const flameMaterial = new THREE.ShaderMaterial({
    uniforms: flameUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vRise;

      void main() {
        vUv = uv;
        vRise = position.y;
        vec3 pos = position;
        float wave = sin(pos.y * 7.0 + time * 4.4 + pos.x * 3.0) * 0.17;
        float curl = cos(pos.y * 5.5 + time * 3.2 + pos.z * 4.0) * 0.13;
        pos.x += wave * smoothstep(-0.8, 1.5, pos.y);
        pos.z += curl * smoothstep(-0.8, 1.5, pos.y);
        pos.xz *= 1.0 - smoothstep(0.4, 2.9, pos.y) * 0.55;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 tintA;
      uniform vec3 tintB;
      uniform vec3 tintC;
      varying vec2 vUv;
      varying float vRise;

      float flameNoise(vec2 p) {
        return sin(p.x * 15.0 + time * 2.1) * 0.5 + sin((p.x + p.y) * 24.0 - time * 3.0) * 0.25;
      }

      void main() {
        float height = smoothstep(-0.65, 2.75, vRise);
        float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float lick = flameNoise(vUv + vec2(time * 0.07, -time * 0.18));
        float alpha = smoothstep(0.02, 0.82, edge + lick * 0.22) * (1.0 - height * 0.82);
        vec3 color = mix(tintA, tintB, smoothstep(0.06, 0.58, height + lick * 0.11));
        color = mix(color, tintC, pow(1.0 - height, 7.0) * 0.72);
        gl_FragColor = vec4(color, alpha * 0.76);
      }
    `,
  });

  const flames = [];
  for (let i = 0; i < 7; i += 1) {
    const geometry = new THREE.ConeGeometry(0.82 - i * 0.055, 2.8 + i * 0.18, 5, 16, true);
    geometry.translate(0, 1.35, 0);
    const mesh = new THREE.Mesh(geometry, flameMaterial);
    mesh.rotation.y = (Math.PI / 7) * i;
    mesh.scale.setScalar(1 - i * 0.038);
    group.add(mesh);
    flames.push(mesh);
  }

  const sparkCount = 650;
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkSeeds = new Float32Array(sparkCount);
  for (let i = 0; i < sparkCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() ** 0.5 * 0.95;
    sparkPositions[i * 3] = Math.cos(angle) * radius;
    sparkPositions[i * 3 + 1] = 0.85 + Math.random() * 4.2;
    sparkPositions[i * 3 + 2] = Math.sin(angle) * radius;
    sparkSeeds[i] = Math.random();
  }
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  sparkGeometry.setAttribute('seed', new THREE.BufferAttribute(sparkSeeds, 1));
  const sparkMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0xffb14a) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float time;
      attribute float seed;
      varying float vFade;

      void main() {
        vec3 pos = position;
        float cycle = fract(seed + time * (0.16 + seed * 0.2));
        float angle = seed * 40.0 + time * (1.7 + seed * 2.2);
        pos.y = 0.78 + cycle * 4.8;
        pos.x += cos(angle) * cycle * (0.28 + seed * 0.7);
        pos.z += sin(angle) * cycle * (0.28 + seed * 0.7);
        vFade = (1.0 - cycle) * smoothstep(0.0, 0.18, cycle);
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (22.0 + seed * 24.0) / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vFade;

      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = dot(p, p);
        float alpha = smoothstep(0.25, 0.0, d) * vFade;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
  group.add(sparks);

  const fireLight = new THREE.PointLight(0xff5a15, 20, 10, 2);
  fireLight.position.set(0, 1.9, 0);
  fireLight.castShadow = true;
  group.add(fireLight);

  world.add(group);
  return { group, ember, flames, flameMaterial, sparks, sparkMaterial, fireLight };
}

function createAir(position) {
  const group = new THREE.Group();
  group.position.copy(position);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 5),
    new THREE.MeshPhysicalMaterial({
      color: 0xd9fbff,
      emissive: 0x6deeff,
      emissiveIntensity: 0.78,
      transparent: true,
      opacity: 0.34,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.68,
      thickness: 1.4,
    }),
  );
  core.position.y = 2.2;
  group.add(core);

  const ribbonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xaef4ff,
    emissive: 0x76eaff,
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.2,
    metalness: 0,
  });

  const ribbons = [];
  for (let r = 0; r < 7; r += 1) {
    const curvePoints = [];
    const offset = (Math.PI * 2 * r) / 7;
    for (let i = 0; i < 150; i += 1) {
      const t = i / 149;
      const angle = offset + t * Math.PI * (2.8 + r * 0.16);
      const radius = 0.68 + Math.sin(t * Math.PI) * (1.15 + r * 0.03);
      curvePoints.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0.78 + t * 3.2,
          Math.sin(angle) * radius,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tube = new THREE.TubeGeometry(curve, 150, 0.018 + r * 0.002, 6, false);
    const ribbon = new THREE.Mesh(tube, ribbonMaterial.clone());
    ribbon.userData.spin = 0.18 + r * 0.05;
    ribbon.userData.breathe = Math.random() * Math.PI * 2;
    group.add(ribbon);
    ribbons.push(ribbon);
  }

  const vaneMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1feff,
    emissive: 0x98f7ff,
    emissiveIntensity: 0.46,
    transparent: true,
    opacity: 0.74,
    roughness: 0.27,
    side: THREE.DoubleSide,
  });
  const vanes = [];
  for (let i = 0; i < 26; i += 1) {
    const vane = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.52, 2, 8), vaneMaterial.clone());
    const angle = (i / 26) * Math.PI * 2;
    const radius = 1.05 + Math.random() * 0.7;
    vane.position.set(Math.cos(angle) * radius, 1.2 + Math.random() * 2.6, Math.sin(angle) * radius);
    vane.rotation.set(Math.random() * Math.PI, angle, Math.random() * Math.PI);
    vane.userData.angle = angle;
    vane.userData.radius = radius;
    vane.userData.speed = 0.35 + Math.random() * 0.65;
    vane.userData.height = vane.position.y;
    group.add(vane);
    vanes.push(vane);
  }

  const moteCount = 760;
  const motePositions = new Float32Array(moteCount * 3);
  const moteSeeds = new Float32Array(moteCount);
  for (let i = 0; i < moteCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 2.2;
    motePositions[i * 3] = Math.cos(angle) * radius;
    motePositions[i * 3 + 1] = 0.65 + Math.random() * 3.9;
    motePositions[i * 3 + 2] = Math.sin(angle) * radius;
    moteSeeds[i] = Math.random();
  }
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  moteGeometry.setAttribute('seed', new THREE.BufferAttribute(moteSeeds, 1));
  const moteMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0xbafaff) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float time;
      attribute float seed;
      varying float vFade;

      void main() {
        vec3 pos = position;
        float angle = atan(pos.z, pos.x) + time * (0.95 + seed * 0.8);
        float radius = length(pos.xz) + sin(time * 2.0 + seed * 20.0) * 0.14;
        pos.x = cos(angle) * radius;
        pos.z = sin(angle) * radius;
        pos.y += sin(time * 1.7 + seed * 35.0) * 0.22;
        vFade = 0.34 + seed * 0.66;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (14.0 + seed * 18.0) / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vFade;

      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = dot(p, p);
        float alpha = smoothstep(0.25, 0.0, d) * vFade * 0.45;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  group.add(motes);

  const airLight = new THREE.PointLight(0x96f8ff, 5.7, 8, 2);
  airLight.position.set(0, 2.4, 0);
  group.add(airLight);

  world.add(group);
  return { group, core, ribbons, vanes, motes, moteMaterial, airLight };
}

function createWater(position) {
  const group = new THREE.Group();
  group.position.copy(position);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(1.24, 1.38, 0.38, 80),
    new THREE.MeshStandardMaterial({
      color: 0x071423,
      emissive: 0x004a82,
      emissiveIntensity: 0.32,
      roughness: 0.28,
      metalness: 0.55,
    }),
  );
  bowl.position.y = 0.7;
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  const waterGeometry = new THREE.SphereGeometry(1.08, 96, 48, 0, Math.PI * 2, 0, Math.PI * 0.72);
  const waterUniforms = {
    time: { value: 0 },
    base: { value: new THREE.Color(0x067bff) },
    rim: { value: new THREE.Color(0xc5f7ff) },
  };
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vWorld;
      varying float vWave;

      void main() {
        vec3 pos = position;
        float wave = sin(pos.x * 7.2 + time * 2.3) * 0.06 + cos(pos.z * 8.5 - time * 2.7) * 0.05;
        pos += normal * wave;
        vWave = wave;
        vec4 world = modelMatrix * vec4(pos, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 base;
      uniform vec3 rim;
      varying vec3 vNormal;
      varying vec3 vWorld;
      varying float vWave;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.5);
        vec3 color = mix(base, rim, fresnel + vWave * 2.5);
        float alpha = 0.32 + fresnel * 0.34;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  const waterOrb = new THREE.Mesh(waterGeometry, waterMaterial);
  waterOrb.position.y = 1.48;
  waterOrb.rotation.x = Math.PI;
  group.add(waterOrb);

  const ringMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x67d7ff,
    emissive: 0x1aa5ff,
    emissiveIntensity: 0.62,
    transparent: true,
    opacity: 0.42,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.44,
  });
  const rings = [];
  for (let i = 0; i < 4; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88 + i * 0.18, 0.012, 8, 120), ringMaterial.clone());
    ring.position.y = 1.68 + i * 0.22;
    ring.rotation.x = Math.PI / 2 + i * 0.16;
    ring.rotation.z = i * 0.6;
    ring.userData.speed = 0.4 + i * 0.16;
    group.add(ring);
    rings.push(ring);
  }

  const dropletGeometry = new THREE.SphereGeometry(0.045, 16, 10);
  const dropletMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb7f3ff,
    emissive: 0x0a9dff,
    emissiveIntensity: 0.54,
    transparent: true,
    opacity: 0.58,
    roughness: 0.02,
    metalness: 0,
    transmission: 0.7,
    thickness: 0.9,
  });
  const droplets = new THREE.InstancedMesh(dropletGeometry, dropletMaterial, 110);
  droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dropletSeeds = [];
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < droplets.count; i += 1) {
    const seed = {
      angle: Math.random() * Math.PI * 2,
      radius: 0.7 + Math.random() * 1.2,
      height: Math.random() * 2.1,
      speed: 0.24 + Math.random() * 0.68,
      scale: 0.55 + Math.random() * 1.25,
    };
    dropletSeeds.push(seed);
    matrix.compose(
      new THREE.Vector3(Math.cos(seed.angle) * seed.radius, 1.0 + seed.height, Math.sin(seed.angle) * seed.radius),
      new THREE.Quaternion(),
      new THREE.Vector3(seed.scale, seed.scale, seed.scale),
    );
    droplets.setMatrixAt(i, matrix);
  }
  group.add(droplets);

  const waterLight = new THREE.PointLight(0x2ab9ff, 6, 9, 2);
  waterLight.position.set(0, 2.1, 0);
  group.add(waterLight);

  world.add(group);
  return { group, waterOrb, waterMaterial, rings, droplets, dropletSeeds, waterLight };
}

function createEarth(position) {
  const group = new THREE.Group();
  group.position.copy(position);

  const rockGeometry = new THREE.DodecahedronGeometry(1.05, 2);
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c3d2d,
    map: noiseTexture,
    roughness: 0.86,
    metalness: 0.02,
  });
  const island = new THREE.Mesh(rockGeometry, rockMaterial);
  island.position.y = 1.05;
  island.scale.set(1.28, 0.7, 1.08);
  island.rotation.set(0.18, 0.3, -0.08);
  island.castShadow = true;
  island.receiveShadow = true;
  group.add(island);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.18, 0.38, 8),
    new THREE.MeshStandardMaterial({
      color: 0x2b2619,
      roughness: 0.92,
      metalness: 0,
    }),
  );
  soil.position.y = 1.48;
  soil.scale.set(1.05, 0.9, 0.92);
  soil.castShadow = true;
  soil.receiveShadow = true;
  group.add(soil);

  const crystalMaterial = new THREE.MeshStandardMaterial({
    color: 0x8dff9a,
    emissive: 0x41d46b,
    emissiveIntensity: 0.58,
    roughness: 0.26,
    metalness: 0.08,
  });
  const crystals = [];
  for (let i = 0; i < 9; i += 1) {
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.11 + Math.random() * 0.08, 0.58 + Math.random() * 0.52, 5), crystalMaterial.clone());
    const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.35;
    const radius = 0.25 + Math.random() * 0.72;
    crystal.position.set(Math.cos(angle) * radius, 1.75 + Math.random() * 0.12, Math.sin(angle) * radius);
    crystal.rotation.set(Math.random() * 0.36, angle, Math.random() * 0.22);
    crystal.castShadow = true;
    group.add(crystal);
    crystals.push(crystal);
  }

  const rootMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f1b0e,
    roughness: 0.78,
    metalness: 0,
  });
  const roots = [];
  for (let i = 0; i < 15; i += 1) {
    const angle = (i / 15) * Math.PI * 2;
    const rootPoints = [];
    for (let j = 0; j < 4; j += 1) {
      const t = j / 3;
      rootPoints.push(
        new THREE.Vector3(
          Math.cos(angle + Math.sin(t * 2.4) * 0.18) * (0.22 + t * 1.0),
          1.36 - t * (0.24 + Math.random() * 0.28),
          Math.sin(angle + Math.sin(t * 2.4) * 0.18) * (0.22 + t * 1.0),
        ),
      );
    }
    const root = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rootPoints), 18, 0.025, 6), rootMaterial);
    root.castShadow = true;
    group.add(root);
    roots.push(root);
  }

  const leafGeometry = new THREE.ConeGeometry(0.055, 0.34, 5);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x65c74f,
    emissive: 0x1d5e21,
    emissiveIntensity: 0.17,
    roughness: 0.62,
    metalness: 0,
  });
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, 150);
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const leafSeeds = [];
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  for (let i = 0; i < leaves.count; i += 1) {
    const seed = {
      angle: Math.random() * Math.PI * 2,
      radius: 0.36 + Math.random() * 0.8,
      height: 1.73 + Math.random() * 0.38,
      tilt: 0.35 + Math.random() * 0.55,
      sway: Math.random() * Math.PI * 2,
    };
    leafSeeds.push(seed);
    euler.set(seed.tilt, seed.angle, Math.random() * 0.35);
    quat.setFromEuler(euler);
    matrix.compose(
      new THREE.Vector3(Math.cos(seed.angle) * seed.radius, seed.height, Math.sin(seed.angle) * seed.radius),
      quat,
      new THREE.Vector3(0.7, 0.7 + Math.random() * 0.7, 0.7),
    );
    leaves.setMatrixAt(i, matrix);
  }
  group.add(leaves);

  const pebbleGeometry = new THREE.DodecahedronGeometry(0.08, 0);
  const pebbleMaterial = new THREE.MeshStandardMaterial({ color: 0x75644c, roughness: 0.9 });
  const pebbles = new THREE.InstancedMesh(pebbleGeometry, pebbleMaterial, 70);
  for (let i = 0; i < pebbles.count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.24 + Math.random() * 1.02;
    matrix.compose(
      new THREE.Vector3(Math.cos(angle) * radius, 1.66 + Math.random() * 0.12, Math.sin(angle) * radius),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random(), Math.random(), Math.random())),
      new THREE.Vector3(0.6 + Math.random() * 1.2, 0.45 + Math.random() * 0.9, 0.6 + Math.random() * 1.2),
    );
    pebbles.setMatrixAt(i, matrix);
  }
  pebbles.castShadow = true;
  pebbles.receiveShadow = true;
  group.add(pebbles);

  const earthLight = new THREE.PointLight(0xa4ff82, 5, 8, 2);
  earthLight.position.set(0, 2.1, 0);
  group.add(earthLight);

  world.add(group);
  return { group, island, soil, crystals, leaves, leafSeeds, earthLight };
}

const fire = createFire(firePedestal.position);
const air = createAir(airPedestal.position);
const water = createWater(waterPedestal.position);
const earth = createEarth(earthPedestal.position);

const starGeometry = new THREE.BufferGeometry();
const starCount = 1200;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const radius = 35 + Math.random() * 80;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
  starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
  starPositions[i * 3 + 1] = Math.cos(phi) * radius * 0.6 + 10;
  starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.045,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  }),
);
scene.add(stars);

const labelSprites = [];
const labelData = [
  ['FIRE', firePedestal.position, '#ff7b28'],
  ['AIR', airPedestal.position, '#aef7ff'],
  ['WATER', waterPedestal.position, '#56c8ff'],
  ['EARTH', earthPedestal.position, '#98db72'],
];

function makeLabelTexture(text, color) {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 128;
  const context = labelCanvas.getContext('2d');
  context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
  context.font = '700 52px Inter, system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = color;
  context.shadowBlur = 18;
  context.fillStyle = color;
  context.fillText(text, labelCanvas.width / 2, labelCanvas.height / 2);
  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

for (const [name, position, color] of labelData) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeLabelTexture(name, color),
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    }),
  );
  sprite.position.set(position.x, 0.23, position.z);
  sprite.scale.set(1.25, 0.31, 1);
  world.add(sprite);
  labelSprites.push(sprite);
}

document.querySelectorAll('[data-focus]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const focus = focusTargets[link.dataset.focus];
    overviewMode = false;
    desiredCamera = {
      position: focus.position.clone(),
      target: focus.target.clone(),
    };
  });
});

window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth, window.innerHeight);
  if (overviewMode) {
    applyOverviewCamera();
  }
});

applyOverviewCamera(true);

function updateDroplets(time) {
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  for (let i = 0; i < water.droplets.count; i += 1) {
    const seed = water.dropletSeeds[i];
    const lift = (time * seed.speed + seed.height) % 2.4;
    const angle = seed.angle + time * (0.35 + seed.speed * 0.6);
    const radius = seed.radius + Math.sin(time * 2.0 + i) * 0.08;
    const scale = seed.scale * (0.7 + lift * 0.18);
    matrix.compose(
      new THREE.Vector3(Math.cos(angle) * radius, 0.92 + lift, Math.sin(angle) * radius),
      quat,
      new THREE.Vector3(scale, scale * 1.4, scale),
    );
    water.droplets.setMatrixAt(i, matrix);
  }
  water.droplets.instanceMatrix.needsUpdate = true;
}

function updateLeaves(time) {
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  for (let i = 0; i < earth.leaves.count; i += 1) {
    const seed = earth.leafSeeds[i];
    const sway = Math.sin(time * 1.7 + seed.sway) * 0.17;
    euler.set(seed.tilt + sway, seed.angle, sway * 0.8);
    quat.setFromEuler(euler);
    matrix.compose(
      new THREE.Vector3(Math.cos(seed.angle) * seed.radius, seed.height, Math.sin(seed.angle) * seed.radius),
      quat,
      new THREE.Vector3(0.7, 0.95, 0.7),
    );
    earth.leaves.setMatrixAt(i, matrix);
  }
  earth.leaves.instanceMatrix.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  world.rotation.y = Math.sin(time * 0.08) * 0.045 + mouse.x * 0.035;
  targetLook.set(mouse.x * 0.22, 1.5 - mouse.y * 0.18, 0);

  if (desiredCamera) {
    camera.position.lerp(desiredCamera.position, 0.035);
    controls.target.lerp(desiredCamera.target, 0.045);
    if (camera.position.distanceTo(desiredCamera.position) < 0.08) {
      desiredCamera = null;
    }
  } else {
    controls.target.lerp(targetLook, 0.018);
  }

  fire.flameMaterial.uniforms.time.value = time;
  fire.sparkMaterial.uniforms.time.value = time;
  fire.ember.scale.setScalar(0.92 + Math.sin(time * 6.5) * 0.08);
  fire.ember.rotation.y += 0.012;
  fire.fireLight.intensity = 16 + Math.sin(time * 7.0) * 4 + Math.sin(time * 13.0) * 1.8;

  air.group.rotation.y += 0.006;
  air.core.rotation.x += 0.006;
  air.core.rotation.y += 0.01;
  air.core.scale.setScalar(0.92 + Math.sin(time * 2.4) * 0.08);
  air.moteMaterial.uniforms.time.value = time;
  for (const ribbon of air.ribbons) {
    ribbon.rotation.y += ribbon.userData.spin * 0.01;
    const breathe = 1 + Math.sin(time * 1.4 + ribbon.userData.breathe) * 0.035;
    ribbon.scale.set(breathe, 1, breathe);
  }
  for (const vane of air.vanes) {
    const angle = vane.userData.angle + time * vane.userData.speed;
    vane.position.x = Math.cos(angle) * vane.userData.radius;
    vane.position.z = Math.sin(angle) * vane.userData.radius;
    vane.position.y = vane.userData.height + Math.sin(time * 1.8 + angle) * 0.22;
    vane.rotation.y = angle + Math.PI / 2;
    vane.rotation.x += 0.01;
  }
  air.airLight.intensity = 5.2 + Math.sin(time * 2.5) * 1.1;

  water.waterMaterial.uniforms.time.value = time;
  water.waterOrb.rotation.y += 0.005;
  water.waterOrb.scale.setScalar(1 + Math.sin(time * 1.8) * 0.035);
  for (const ring of water.rings) {
    ring.rotation.z += ring.userData.speed * 0.01;
    ring.rotation.y = Math.sin(time * ring.userData.speed) * 0.12;
  }
  updateDroplets(time);
  water.waterLight.intensity = 5.7 + Math.sin(time * 3.0) * 1.2;

  earth.group.position.y = earthPedestal.position.y + Math.sin(time * 1.0) * 0.045;
  earth.island.rotation.y += 0.003;
  earth.soil.rotation.y -= 0.002;
  for (const [i, crystal] of earth.crystals.entries()) {
    crystal.material.emissiveIntensity = 0.42 + Math.sin(time * 2.0 + i) * 0.14;
  }
  updateLeaves(time);
  earth.earthLight.intensity = 4.4 + Math.sin(time * 2.2) * 0.8;

  bridge.material.emissiveIntensity = 0.48 + Math.sin(time * 1.4) * 0.14;
  stars.rotation.y += 0.0005;
  labelSprites.forEach((sprite) => sprite.quaternion.copy(camera.quaternion));

  controls.update();
  composer.render();
}

animate();
