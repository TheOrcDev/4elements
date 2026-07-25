import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import './style.css';

const canvas = document.querySelector('#scene');
const elementButtons = [...document.querySelectorAll('.element-button')];
const card = {
  index: document.querySelector('#element-index'),
  name: document.querySelector('#element-name'),
  description: document.querySelector('#element-description'),
  state: document.querySelector('#element-state'),
  meter: document.querySelector('#meter-fill'),
  value: document.querySelector('#meter-value'),
};

const isSmallScreen = window.matchMedia('(max-width: 760px)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#050713');
scene.fog = new THREE.FogExp2('#050713', 0.021);

const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 9.4, isSmallScreen ? 26 : 21.5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.25, 0.52, 0.12);
composer.addPass(bloom);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.55, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.enablePan = false;
controls.minDistance = 13;
controls.maxDistance = 30;
controls.minPolarAngle = 0.68;
controls.maxPolarAngle = 1.44;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.24;

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const targetCamera = new THREE.Vector3();
const targetLook = new THREE.Vector3();
const tempColor = new THREE.Color();
let activeKey = 'fire';
let hoverKey = null;
let focusStrength = 0;
let hasExplored = false;

const elementInfo = {
  fire: {
    index: '01', name: 'Fire', state: 'AWAKENED', meter: 92,
    description: 'An untamed flame, forever ascending. Desire made visible.',
    accent: '#ff6a2a', position: new THREE.Vector3(-5.7, 1.15, -1.7), camera: new THREE.Vector3(-8.1, 5.2, 13.2), look: new THREE.Vector3(-5.7, 1.8, -1.7),
  },
  air: {
    index: '02', name: 'Air', state: 'UNTETHERED', meter: 76,
    description: 'A luminous current in perpetual motion. Thought without weight.',
    accent: '#c9dcff', position: new THREE.Vector3(5.55, 2.1, -1.35), camera: new THREE.Vector3(8.7, 6.7, 13.5), look: new THREE.Vector3(5.55, 2.35, -1.35),
  },
  water: {
    index: '03', name: 'Water', state: 'FLOWING', meter: 88,
    description: 'A suspended tide of sapphire light. It remembers every shore.',
    accent: '#47d9ff', position: new THREE.Vector3(4.6, 0.65, 4.85), camera: new THREE.Vector3(9.4, 4.4, 15.2), look: new THREE.Vector3(4.6, 1.25, 4.85),
  },
  earth: {
    index: '04', name: 'Earth', state: 'ROOTED', meter: 84,
    description: 'Ancient stone, crystal veins, and a quiet force that holds.',
    accent: '#a5cd67', position: new THREE.Vector3(-5.25, 0.72, 4.25), camera: new THREE.Vector3(-9.2, 4.5, 14.5), look: new THREE.Vector3(-5.25, 1.15, 4.25),
  },
};

function makeGlowTexture(stops) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureCanvas.height = 128;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const softGlow = makeGlowTexture([[0, 'rgba(255,255,255,1)'], [0.16, 'rgba(255,255,255,.96)'], [0.5, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]);
const fireGlow = makeGlowTexture([[0, 'rgba(255,250,196,1)'], [0.18, 'rgba(255,186,58,.95)'], [0.48, 'rgba(255,77,12,.35)'], [1, 'rgba(255,25,0,0)']]);
const cyanGlow = makeGlowTexture([[0, 'rgba(240,255,255,1)'], [0.23, 'rgba(71,221,255,.9)'], [0.55, 'rgba(20,119,255,.28)'], [1, 'rgba(20,79,255,0)']]);

function addSprite(parent, color, scale, position, opacity = 1, map = softGlow) {
  const material = new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.setScalar(scale);
  parent.add(sprite);
  return sprite;
}

function createPointCloud({ count, color, size, texture = softGlow, sphere = false }) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count * 4);
  const colorObj = new THREE.Color(color);
  for (let i = 0; i < count; i++) {
    const r = sphere ? Math.pow(Math.random(), 0.62) * 11 : Math.random() * 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = sphere ? Math.acos(2 * Math.random() - 1) : Math.random() * Math.PI * 2;
    positions[i * 3] = sphere ? Math.sin(phi) * Math.cos(theta) * r : Math.cos(theta) * r;
    positions[i * 3 + 1] = sphere ? Math.cos(phi) * r + 4 : (Math.random() - 0.5) * 9 + 3;
    positions[i * 3 + 2] = sphere ? Math.sin(phi) * Math.sin(theta) * r : Math.sin(theta) * r;
    colorObj.offsetHSL((Math.random() - 0.5) * 0.07, 0, (Math.random() - 0.5) * 0.14);
    colors.set([colorObj.r, colorObj.g, colorObj.b], i * 3);
    colorObj.set(color);
    phases.set([Math.random() * Math.PI * 2, Math.random(), 0.35 + Math.random() * 1.2, Math.random() * 2 - 1], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.userData.basePositions = positions.slice();
  geometry.userData.phases = phases;
  const material = new THREE.PointsMaterial({ size, map: texture, vertexColors: true, transparent: true, opacity: 0.74, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  return new THREE.Points(geometry, material);
}

function createElementBase(color) {
  const base = new THREE.Group();
  const pedestalMaterial = new THREE.MeshStandardMaterial({ color: '#11162a', metalness: 0.78, roughness: 0.28, emissive: new THREE.Color(color).multiplyScalar(0.07) });
  const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.55, 0.28, 64), pedestalMaterial);
  basePlate.position.y = -0.08;
  base.add(basePlate);
  const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.028, 8, 72), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.09;
  base.add(ring);
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.016, 6, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.26 }));
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 0.12;
  base.add(outerRing);
  base.userData.ring = ring;
  base.userData.outerRing = outerRing;
  return base;
}

function createFire() {
  const root = new THREE.Group();
  const base = createElementBase('#ff5722');
  root.add(base);
  const light = new THREE.PointLight('#ff4e16', 8.5, 18, 2);
  light.position.set(0, 2.6, 0);
  root.add(light);
  const innerLight = new THREE.PointLight('#ffbe37', 3.2, 8, 1.8);
  innerLight.position.set(0, 1.2, 0);
  root.add(innerLight);

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.63, 3), new THREE.MeshStandardMaterial({ color: '#ff591a', emissive: '#ff2400', emissiveIntensity: 2, roughness: 0.25, metalness: 0.05 }));
  core.position.y = 0.87;
  root.add(core);
  const halo = addSprite(root, '#ff4d16', 5.6, new THREE.Vector3(0, 1.25, -0.18), 0.35, fireGlow);

  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const seeds = new Float32Array(particleCount * 4);
  const cA = new THREE.Color('#ff2300');
  const cB = new THREE.Color('#ffb321');
  const cC = new THREE.Color('#fff2ad');
  for (let i = 0; i < particleCount; i++) {
    const life = Math.random();
    const radius = Math.pow(Math.random(), 1.75) * (0.38 + life * 1.3);
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.35 + life * 3.6;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    const blend = life < 0.35 ? cC.clone().lerp(cB, life / 0.35) : cB.clone().lerp(cA, (life - 0.35) / 0.65);
    colors.set([blend.r, blend.g, blend.b], i * 3);
    seeds.set([Math.random() * Math.PI * 2, Math.random() * 6.28, 0.65 + Math.random() * 1.45, life], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.userData.seeds = seeds;
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.34, map: fireGlow, vertexColors: true, transparent: true, opacity: 0.93, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  root.add(particles);
  const emberCloud = createPointCloud({ count: 90, color: '#ff7b2c', size: 0.11, texture: fireGlow });
  emberCloud.position.y = 1.3;
  emberCloud.scale.set(0.45, 0.64, 0.45);
  root.add(emberCloud);

  root.userData = { base, core, halo, light, innerLight, particles, emberCloud, update(time, power) {
    const attribute = particles.geometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      const seed = seeds[i * 4];
      const flicker = seeds[i * 4 + 1];
      const speed = seeds[i * 4 + 2];
      const life = (seeds[i * 4 + 3] + time * speed * 0.19) % 1;
      const flare = (1 - life) * (0.3 + life * 0.8);
      const radius = (0.1 + life * 1.3) * (0.35 + (seed % 1) * 0.82) * flare;
      attribute.setXYZ(i,
        Math.cos(seed + time * (1.8 + (seed % 1) * 2.2)) * radius + Math.sin(time * 4.3 + seed * 6) * 0.13,
        0.35 + life * 3.9 + Math.sin(time * 5.5 + seed * 8) * 0.16,
        Math.sin(seed * 1.71 + time * 2.1) * radius + Math.cos(time * 3.8 + seed * 4) * 0.13,
      );
    }
    attribute.needsUpdate = true;
    core.rotation.y = time * 1.2;
    core.rotation.z = Math.sin(time * 2.8) * 0.16;
    core.scale.setScalar(0.92 + Math.sin(time * 5.2) * 0.07 + power * 0.1);
    halo.material.opacity = 0.26 + Math.sin(time * 4.5) * 0.07 + power * 0.18;
    halo.scale.setScalar(5.3 + Math.sin(time * 3.5) * 0.45 + power * 1.2);
    light.intensity = 7.2 + Math.sin(time * 5.4) * 1.35 + power * 6;
    innerLight.intensity = 2.5 + Math.sin(time * 4) * 0.45 + power * 2;
    emberCloud.rotation.y = time * 0.27;
  }};
  return root;
}

function createAir() {
  const root = new THREE.Group();
  const base = createElementBase('#cddcff');
  root.add(base);
  const light = new THREE.PointLight('#b6d5ff', 5.7, 16, 2);
  light.position.set(0, 3.3, 0);
  root.add(light);
  const halo = addSprite(root, '#b3d9ff', 7, new THREE.Vector3(0, 2.2, -0.42), 0.19, softGlow);
  const ribbons = new THREE.Group();
  const ribbonMats = [
    new THREE.MeshBasicMaterial({ color: '#e3edff', transparent: true, opacity: 0.69, blending: THREE.AdditiveBlending }),
    new THREE.MeshBasicMaterial({ color: '#8ebeff', transparent: true, opacity: 0.44, blending: THREE.AdditiveBlending }),
    new THREE.MeshBasicMaterial({ color: '#d6abff', transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending }),
  ];
  for (let ring = 0; ring < 6; ring++) {
    const points = [];
    const offset = ring * (Math.PI * 2 / 6);
    for (let i = 0; i <= 72; i++) {
      const pct = i / 72;
      const angle = pct * Math.PI * 2.2 + offset;
      const radius = 0.76 + Math.sin(pct * Math.PI * 2 + offset) * 0.24 + ring * 0.06;
      points.push(new THREE.Vector3(Math.cos(angle) * radius * 1.9, 0.65 + pct * 3.25 + Math.sin(angle * 2) * 0.22, Math.sin(angle) * radius * 1.2));
    }
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.45);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.032 + (ring % 3) * 0.012, 6, false), ribbonMats[ring % ribbonMats.length]);
    tube.rotation.y = ring * 0.72;
    ribbons.add(tube);
  }
  root.add(ribbons);
  const particles = createPointCloud({ count: 240, color: '#d4e7ff', size: 0.09 });
  particles.position.y = 1.8;
  particles.scale.set(0.29, 0.55, 0.29);
  root.add(particles);
  const cloudlets = new THREE.Group();
  for (let i = 0; i < 11; i++) {
    const mote = addSprite(cloudlets, i % 2 ? '#e9f4ff' : '#b4c8ff', 0.55 + Math.random() * 0.65, new THREE.Vector3((Math.random() - 0.5) * 3.2, 0.7 + Math.random() * 3.3, (Math.random() - 0.5) * 1.8), 0.12 + Math.random() * 0.11);
    mote.userData.phase = Math.random() * Math.PI * 2;
  }
  root.add(cloudlets);
  root.userData = { base, light, halo, ribbons, particles, cloudlets, update(time, power) {
    ribbons.rotation.y = time * 0.34;
    ribbons.rotation.z = Math.sin(time * 0.42) * 0.08;
    ribbons.scale.setScalar(1 + power * 0.09);
    particles.rotation.y = -time * 0.26;
    particles.rotation.z = Math.sin(time * 0.75) * 0.12;
    cloudlets.children.forEach((mote) => {
      mote.position.y += Math.sin(time * 1.3 + mote.userData.phase) * 0.002;
      mote.material.opacity = 0.08 + (Math.sin(time * 1.9 + mote.userData.phase) + 1) * 0.06 + power * 0.06;
    });
    halo.material.opacity = 0.15 + Math.sin(time * 2.6) * 0.04 + power * 0.1;
    halo.scale.setScalar(6.7 + Math.sin(time * 1.7) * 0.35 + power);
    light.intensity = 4.8 + Math.sin(time * 2) * 0.5 + power * 3.5;
  }};
  return root;
}

function createWater() {
  const root = new THREE.Group();
  const base = createElementBase('#3bd8ff');
  root.add(base);
  const light = new THREE.PointLight('#27c7ff', 7.4, 18, 2);
  light.position.set(0, 2.2, 0);
  root.add(light);
  const halo = addSprite(root, '#18a8ff', 7.2, new THREE.Vector3(0, 1.65, -0.4), 0.24, cyanGlow);
  const waterMaterial = new THREE.MeshPhysicalMaterial({ color: '#2faee4', emissive: '#006fbc', emissiveIntensity: 0.65, metalness: 0.18, roughness: 0.11, transmission: 0.12, thickness: 0.8, transparent: true, opacity: 0.92, iridescence: 0.28, iridescenceIOR: 1.32 });
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 5), waterMaterial);
  orb.position.y = 1.5;
  root.add(orb);
  const rings = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25 + i * 0.19, 0.028 + (i % 2) * 0.012, 7, 90), new THREE.MeshBasicMaterial({ color: i % 2 ? '#77f6ff' : '#2097ff', transparent: true, opacity: 0.62 - i * 0.07, blending: THREE.AdditiveBlending }));
    ring.rotation.x = Math.PI / 2 + (i - 2) * 0.19;
    ring.rotation.y = i * 0.45;
    ring.position.y = 1.45 + (i - 2) * 0.16;
    rings.add(ring);
  }
  root.add(rings);
  const droplets = new THREE.Group();
  const dropMat = new THREE.MeshPhysicalMaterial({ color: '#7beeff', emissive: '#1389cb', emissiveIntensity: 1.2, roughness: 0.13, transmission: 0.18, transparent: true, opacity: 0.87 });
  for (let i = 0; i < 22; i++) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.11, 16, 16), dropMat);
    drop.userData = { angle: Math.random() * Math.PI * 2, radius: 1.45 + Math.random() * 1.4, speed: 0.3 + Math.random() * 0.45, y: 0.65 + Math.random() * 2.5, phase: Math.random() * Math.PI * 2 };
    droplets.add(drop);
  }
  root.add(droplets);
  const particles = createPointCloud({ count: 190, color: '#79ecff', size: 0.075, texture: cyanGlow });
  particles.position.y = 1.45;
  particles.scale.set(0.36, 0.6, 0.36);
  root.add(particles);
  root.userData = { base, light, halo, orb, rings, droplets, particles, update(time, power) {
    orb.rotation.y = time * 0.18;
    orb.rotation.x = Math.sin(time * 0.42) * 0.15;
    orb.position.y = 1.5 + Math.sin(time * 1.7) * 0.15;
    orb.scale.setScalar(1 + Math.sin(time * 2.5) * 0.035 + power * 0.08);
    rings.children.forEach((ring, index) => {
      ring.rotation.z = time * (index % 2 ? 0.66 : -0.44) + index;
      ring.rotation.x = Math.PI / 2 + (index - 2) * 0.19 + Math.sin(time + index) * 0.05;
    });
    droplets.children.forEach((drop) => {
      const d = drop.userData;
      const a = d.angle + time * d.speed;
      drop.position.set(Math.cos(a) * d.radius, d.y + Math.sin(time * 1.7 + d.phase) * 0.25, Math.sin(a) * d.radius * 0.68);
    });
    particles.rotation.y = time * 0.23;
    halo.material.opacity = 0.18 + Math.sin(time * 2) * 0.04 + power * 0.13;
    halo.scale.setScalar(6.8 + Math.sin(time * 1.3) * 0.38 + power);
    light.intensity = 6.5 + Math.sin(time * 3.3) * 0.7 + power * 4.3;
  }};
  return root;
}

function createEarth() {
  const root = new THREE.Group();
  const base = createElementBase('#9dcc5b');
  root.add(base);
  const light = new THREE.PointLight('#a6cb5b', 4.8, 16, 2);
  light.position.set(0, 2.4, 0);
  root.add(light);
  const halo = addSprite(root, '#8fc451', 6.3, new THREE.Vector3(0, 1.5, -0.48), 0.17, softGlow);
  const rockMat = new THREE.MeshStandardMaterial({ color: '#5d4632', roughness: 0.9, metalness: 0.03, flatShading: true, emissive: '#152411', emissiveIntensity: 0.35 });
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(1.28, 1), rockMat);
  core.position.y = 1.38;
  root.add(core);
  const veins = new THREE.Group();
  const edgeGeometry = new THREE.EdgesGeometry(core.geometry, 12);
  const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: '#a7e964', transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending }));
  edges.position.copy(core.position);
  veins.add(edges);
  root.add(veins);
  const stones = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.28, 0), rockMat.clone());
    stone.material.color.offsetHSL((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.09);
    stone.userData = { angle: Math.random() * Math.PI * 2, radius: 1.7 + Math.random() * 1.35, height: 0.65 + Math.random() * 1.9, speed: 0.12 + Math.random() * 0.18, spin: new THREE.Vector3(Math.random() * 1.4, Math.random() * 1.3, Math.random() * 1.2) };
    stones.add(stone);
  }
  root.add(stones);
  const crystals = new THREE.Group();
  const crystalMat = new THREE.MeshStandardMaterial({ color: '#b5f171', emissive: '#7cdb37', emissiveIntensity: 1.3, roughness: 0.2, metalness: 0.04, transparent: true, opacity: 0.93 });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.22;
    const radius = 1.3 + Math.random() * 0.65;
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.09 + Math.random() * 0.1, 0.45 + Math.random() * 0.65, 5), crystalMat);
    crystal.position.set(Math.cos(angle) * radius, 0.26 + Math.random() * 0.12, Math.sin(angle) * radius);
    crystal.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * Math.PI, (Math.random() - 0.5) * 0.35);
    crystals.add(crystal);
  }
  root.add(crystals);
  const motes = createPointCloud({ count: 120, color: '#d2ed94', size: 0.07 });
  motes.position.y = 1.25;
  motes.scale.set(0.38, 0.45, 0.38);
  root.add(motes);
  root.userData = { base, light, halo, core, edges, stones, crystals, motes, update(time, power) {
    core.rotation.y = time * 0.14;
    core.rotation.x = Math.sin(time * 0.48) * 0.12;
    core.position.y = 1.38 + Math.sin(time * 1.25) * 0.07;
    edges.position.copy(core.position);
    edges.rotation.copy(core.rotation);
    stones.children.forEach((stone) => {
      const data = stone.userData;
      const angle = data.angle + time * data.speed;
      stone.position.set(Math.cos(angle) * data.radius, data.height + Math.sin(time * 1.15 + data.angle) * 0.2, Math.sin(angle) * data.radius * 0.72);
      stone.rotation.x = time * data.spin.x;
      stone.rotation.y = time * data.spin.y;
      stone.rotation.z = time * data.spin.z;
    });
    crystals.rotation.y = time * 0.09;
    motes.rotation.y = -time * 0.12;
    halo.material.opacity = 0.13 + Math.sin(time * 1.7) * 0.03 + power * 0.1;
    halo.scale.setScalar(6 + Math.sin(time * 1.3) * 0.28 + power * 0.8);
    light.intensity = 4 + Math.sin(time * 1.6) * 0.45 + power * 3;
  }};
  return root;
}

function createEnvironment() {
  const world = new THREE.Group();
  scene.add(world);
  const ambient = new THREE.HemisphereLight('#8ca8da', '#02040b', 1.6);
  scene.add(ambient);
  const moon = new THREE.DirectionalLight('#dbe5ff', 2.7);
  moon.position.set(-6, 11, 6);
  scene.add(moon);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(22, 128), new THREE.MeshStandardMaterial({ color: '#080c1c', metalness: 0.62, roughness: 0.52, emissive: '#040612', emissiveIntensity: 0.42 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.28;
  world.add(floor);

  const runeMat = new THREE.MeshBasicMaterial({ color: '#667bb0', transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.8 + i * 2.2, 2.816 + i * 2.2, 128), runeMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.255 + i * 0.0006;
    world.add(ring);
  }
  const centralRing = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.024, 7, 128), new THREE.MeshBasicMaterial({ color: '#6f8bd5', transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending }));
  centralRing.rotation.x = Math.PI / 2;
  centralRing.position.y = -0.19;
  world.add(centralRing);

  const grid = new THREE.GridHelper(34, 34, '#233153', '#111b33');
  grid.material.transparent = true;
  grid.material.opacity = 0.12;
  grid.position.y = -0.24;
  world.add(grid);

  const stars = createPointCloud({ count: 1700, color: '#9cb8ff', size: 0.034, sphere: true });
  stars.material.opacity = 0.86;
  scene.add(stars);
  const warmStars = createPointCloud({ count: 230, color: '#f9d9ae', size: 0.045, sphere: true });
  warmStars.material.opacity = 0.64;
  scene.add(warmStars);
  const nebula = new THREE.Group();
  const nebulaGlow = addSprite(nebula, '#344da4', 28, new THREE.Vector3(-9, 7, -17), 0.09);
  const nebulaGlow2 = addSprite(nebula, '#602c87', 21, new THREE.Vector3(12, 3, -14), 0.08);
  scene.add(nebula);
  return { world, stars, warmStars, centralRing, nebulaGlow, nebulaGlow2 };
}

const environment = createEnvironment();
const elements = {
  fire: createFire(),
  air: createAir(),
  water: createWater(),
  earth: createEarth(),
};

Object.entries(elements).forEach(([key, group]) => {
  group.position.copy(elementInfo[key].position);
  group.userData.key = key;
  group.traverse((node) => { node.userData.elementKey = key; });
  scene.add(group);
});

const center = new THREE.Group();
scene.add(center);
const centerCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 1), new THREE.MeshBasicMaterial({ color: '#e6dfff', transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
centerCore.position.y = 0.23;
center.add(centerCore);
const centerGlow = addSprite(center, '#b1a6ff', 2.2, new THREE.Vector3(0, 0.26, -0.08), 0.27);
const centerTorus = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.018, 6, 72), new THREE.MeshBasicMaterial({ color: '#9890e8', transparent: true, opacity: 0.46, blending: THREE.AdditiveBlending }));
centerTorus.rotation.x = Math.PI / 2;
center.add(centerTorus);

function setCard(key) {
  const info = elementInfo[key];
  card.index.textContent = info.index;
  card.name.textContent = info.name;
  card.description.textContent = info.description;
  card.state.textContent = info.state;
  card.meter.style.width = `${info.meter}%`;
  card.value.textContent = `${info.meter}%`;
  document.documentElement.style.setProperty('--element-accent', info.accent);
}

function setActive(key, shouldMoveCamera = true) {
  if (!elements[key]) return;
  activeKey = key;
  setCard(key);
  elementButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.element === key));
  if (shouldMoveCamera) {
    targetCamera.copy(elementInfo[key].camera);
    targetLook.copy(elementInfo[key].look);
    focusStrength = 1;
    controls.autoRotate = false;
    window.setTimeout(() => { controls.autoRotate = !hasExplored; }, 3600);
  }
}

function activateExploration() {
  hasExplored = true;
  document.body.classList.add('is-exploring');
  setActive('fire', true);
}

elementButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activateExploration();
    setActive(button.dataset.element);
  });
});
document.querySelector('#explore-button').addEventListener('click', activateExploration);

function interactiveElementAtEvent(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(Object.values(elements), true);
  return intersections[0]?.object?.userData?.elementKey ?? null;
}

canvas.addEventListener('pointermove', (event) => {
  const key = interactiveElementAtEvent(event);
  if (hoverKey !== key) {
    hoverKey = key;
    canvas.style.cursor = key ? 'pointer' : 'grab';
  }
});
canvas.addEventListener('pointerleave', () => { hoverKey = null; canvas.style.cursor = 'grab'; });
canvas.addEventListener('click', (event) => {
  const key = interactiveElementAtEvent(event);
  if (key) {
    activateExploration();
    setActive(key);
  }
});

window.addEventListener('keydown', (event) => {
  const keys = ['fire', 'air', 'water', 'earth'];
  if (event.key >= '1' && event.key <= '4') {
    activateExploration();
    setActive(keys[Number(event.key) - 1]);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

setCard(activeKey);
targetCamera.copy(camera.position);
targetLook.copy(controls.target);

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const dt = Math.min(clock.getDelta(), 0.05);

  Object.entries(elements).forEach(([key, group]) => {
    const isActive = key === activeKey ? 1 : 0;
    const isHovered = key === hoverKey ? 1 : 0;
    const emphasis = isActive * 0.45 + isHovered * 0.55;
    group.userData.update(elapsed, emphasis);
    const targetScale = 0.94 + emphasis * 0.12;
    group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.055);
    group.position.y = elementInfo[key].position.y + Math.sin(elapsed * 0.72 + group.position.x) * 0.055;
  });
  environment.stars.rotation.y = elapsed * 0.006;
  environment.warmStars.rotation.y = -elapsed * 0.01;
  environment.centralRing.rotation.z = elapsed * 0.06;
  environment.nebulaGlow.material.opacity = 0.07 + Math.sin(elapsed * 0.25) * 0.025;
  environment.nebulaGlow2.material.opacity = 0.06 + Math.cos(elapsed * 0.22) * 0.02;
  centerCore.rotation.y = elapsed * 0.55;
  centerCore.rotation.x = elapsed * 0.32;
  centerCore.position.y = 0.22 + Math.sin(elapsed * 1.4) * 0.08;
  centerGlow.material.opacity = 0.2 + Math.sin(elapsed * 2.1) * 0.06;
  centerTorus.rotation.z = elapsed * 0.34;

  if (focusStrength > 0.001) {
    camera.position.lerp(targetCamera, Math.min(1, dt * 2.5));
    controls.target.lerp(targetLook, Math.min(1, dt * 2.5));
    focusStrength *= 0.94;
  }
  controls.update();
  composer.render();
}

animate();
