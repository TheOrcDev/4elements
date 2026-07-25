import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const ELEMENTS = {
  fire: {
    id: 'fire',
    index: '01',
    name: 'FIRE',
    type: 'COMBUSTION',
    symbol: '✦',
    color: '#ff6a3d',
    accent: '#ffc857',
    glow: '#ff2e1f',
    copy: 'A reaction with no fixed shape — heat, light and appetite folded into one restless form.',
    state: 'PLASMA',
    energy: '98.4%',
    range: '∞ / WILD',
    position: [-1.52, 1.02, 0.14],
    theme: 'ember',
  },
  air: {
    id: 'air',
    index: '02',
    name: 'AIR',
    type: 'MOTION',
    symbol: '◌',
    color: '#9fe5d1',
    accent: '#d8fff4',
    glow: '#48bda6',
    copy: 'Invisible architecture in perpetual motion — a current, a breath, the space between things.',
    state: 'VAPOUR',
    energy: '72.1%',
    range: '∞ / OPEN',
    position: [1.54, 1.02, -0.06],
    theme: 'mint',
  },
  water: {
    id: 'water',
    index: '03',
    name: 'WATER',
    type: 'FLUIDITY',
    symbol: '≈',
    color: '#4bc9df',
    accent: '#b2f6ff',
    glow: '#1589e8',
    copy: 'The original memory of the planet — fluid, reflective, and always finding the way through.',
    state: 'LIQUID',
    energy: '84.7%',
    range: '03 / DEEP',
    position: [1.54, -1.04, 0.04],
    theme: 'cobalt',
  },
  earth: {
    id: 'earth',
    index: '04',
    name: 'EARTH',
    type: 'FORMATION',
    symbol: '⌂',
    color: '#ca8b62',
    accent: '#98b563',
    glow: '#ce6844',
    copy: 'Weight, patience and deep time — a rough surface carrying an entire world beneath it.',
    state: 'MINERAL',
    energy: '41.9%',
    range: '01 / ROOTED',
    position: [-1.52, -1.04, -0.08],
    theme: 'terracotta',
  },
};

const elementList = document.querySelector('#element-list');
const inspectorTitle = document.querySelector('#inspector-title');
const inspectorCopy = document.querySelector('#inspector-copy');
const inspectorIndex = document.querySelector('#inspector-index');
const inspectorSymbol = document.querySelector('#inspector-symbol');
const colorRow = document.querySelector('#color-row');
const statState = document.querySelector('#stat-state');
const statEnergy = document.querySelector('#stat-energy');
const statRange = document.querySelector('#stat-range');
const sceneTag = document.querySelector('#scene-tag');
const frameNumber = document.querySelector('#frame-number');

Object.values(ELEMENTS).forEach((element) => {
  const button = document.createElement('button');
  button.className = 'element-button';
  button.type = 'button';
  button.dataset.element = element.id;
  button.setAttribute('role', 'tab');
  button.innerHTML = `
    <span class="element-orb element-orb-${element.id}" style="--element-color:${element.color};--element-accent:${element.accent}"><span>${element.symbol}</span></span>
    <span class="element-button-copy"><span class="element-button-name">${element.name}</span><span class="element-button-type">${element.type}</span></span>
    <span class="element-button-index">${element.index}</span>
    <span class="element-button-arrow">↗</span>
  `;
  button.addEventListener('click', () => selectElement(element.id));
  elementList.append(button);
});

const canvas = document.querySelector('#scene-canvas');
const sceneShell = document.querySelector('#scene-shell');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(0, 0.1, 7.15);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 5.1;
controls.maxDistance = 8.5;
controls.minPolarAngle = Math.PI * 0.31;
controls.maxPolarAngle = Math.PI * 0.69;
controls.target.set(0, 0, 0);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const elementGroups = {};
const animatedMaterials = [];
const animatedObjects = [];
let activeElement = 'fire';
let lastFrameTime = 0;

const ambient = new THREE.HemisphereLight('#b7e5dd', '#16121b', 2.0);
scene.add(ambient);
const keyLight = new THREE.DirectionalLight('#fff5e6', 3.8);
keyLight.position.set(-4, 7, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#7a9cff', 2.5);
rimLight.position.set(5, 1, -4);
scene.add(rimLight);

function color(value) {
  return new THREE.Color(value);
}

function makeGlowTexture() {
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const context = glowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.16, 'rgba(255,255,255,.85)');
  gradient.addColorStop(0.38, 'rgba(255,255,255,.24)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(glowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const glowTexture = makeGlowTexture();

const field = new THREE.Group();
scene.add(field);
createFieldAtmosphere(field);

function createGlow(parent, tint, size, opacity = 0.5, position = [0, 0, 0]) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture,
    color: tint,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  sprite.scale.set(size, size, 1);
  sprite.position.set(...position);
  parent.add(sprite);
  return sprite;
}

function createParticles(parent, tint, count, spread, height, size = 0.035) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const angle = i * 2.39996;
    const radius = Math.sqrt((i * 17) % count / count) * spread;
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = ((i * 13) % count / count - 0.5) * height;
    positions[i3 + 2] = Math.sin(angle) * radius;
    seeds[i3] = (i * 0.731) % 1;
    seeds[i3 + 1] = (i * 0.397) % 1;
    seeds[i3 + 2] = (i * 0.173) % 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  const material = new THREE.PointsMaterial({
    color: tint,
    size,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.userData.basePositions = positions.slice();
  points.userData.particleType = 'particles';
  points.userData.seed = Math.random();
  parent.add(points);
  animatedObjects.push(points);
  return points;
}

function addSpecimenFrame(parent, tint, activeOffset = 0) {
  const frameMaterial = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.008, 6, 96), frameMaterial);
  ring.rotation.x = Math.PI * 0.02;
  parent.add(ring);
  const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.003, 6, 96), new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending }));
  ringTwo.rotation.x = Math.PI * 0.02;
  ringTwo.rotation.y = 0.35;
  parent.add(ringTwo);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: tint }));
  pin.position.set(0.75, 0.75, 0.05);
  parent.add(pin);
  parent.userData.frame = ring;
  parent.userData.frameTwo = ringTwo;
  parent.userData.activeOffset = activeOffset;
}

function createFlameGeometry(height, width, phase) {
  const radialSegments = 12;
  const heightSegments = 18;
  const vertices = [];
  const indices = [];
  for (let y = 0; y <= heightSegments; y += 1) {
    const t = y / heightSegments;
    const taper = Math.pow(Math.sin(t * Math.PI * 0.92), 0.62);
    const wobble = Math.sin(t * 5.2 + phase) * 0.11 * t + Math.sin(t * 11.7 + phase * 1.7) * 0.03;
    for (let r = 0; r < radialSegments; r += 1) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const radius = width * taper * (1 + Math.sin(theta * 3 + phase) * 0.1) * (1 - t * 0.18);
      vertices.push(Math.cos(theta) * radius + wobble, -0.69 + t * height, Math.sin(theta) * radius + Math.cos(t * 7 + phase) * 0.04 * t);
    }
  }
  for (let y = 0; y < heightSegments; y += 1) {
    for (let r = 0; r < radialSegments; r += 1) {
      const next = (r + 1) % radialSegments;
      const current = y * radialSegments + r;
      const above = (y + 1) * radialSegments + r;
      const aboveNext = (y + 1) * radialSegments + next;
      const nextCurrent = y * radialSegments + next;
      indices.push(current, nextCurrent, above, nextCurrent, aboveNext, above);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createFlameMaterial(base, accent, intensity = 1) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: color(base) }, uAccent: { value: color(accent) }, uIntensity: { value: intensity } },
    vertexShader: `
      uniform float uTime;
      varying float vHeight;
      varying vec3 vNormal;
      void main() {
        vHeight = clamp((position.y + 0.69) / 1.72, 0.0, 1.0);
        vec3 transformed = position;
        transformed.x += sin(uTime * 3.4 + position.y * 4.4) * 0.025 * vHeight;
        transformed.z += cos(uTime * 2.7 + position.y * 6.0) * 0.018 * vHeight;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uAccent;
      uniform float uIntensity;
      varying float vHeight;
      varying vec3 vNormal;
      void main() {
        vec3 flame = mix(uColor, uAccent, smoothstep(0.06, 0.92, vHeight));
        float edge = 0.72 + 0.28 * abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
        float alpha = (0.58 + 0.42 * (1.0 - vHeight)) * edge;
        gl_FragColor = vec4(flame * uIntensity * 1.3, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  animatedMaterials.push(material);
  return material;
}

function createFire(parent, element) {
  addSpecimenFrame(parent, element.color);
  const fireCore = new THREE.Group();
  parent.add(fireCore);
  const tongues = [
    [0.86, 0.46, 0.86, 0.62],
    [1.38, 0.31, 0.33, 0.98],
    [1.08, 0.26, -0.42, 0.36],
  ];
  tongues.forEach(([height, width, x, z], index) => {
    const mesh = new THREE.Mesh(createFlameGeometry(height, width, index * 1.8 + 0.4), createFlameMaterial(index === 1 ? '#ff3b22' : '#ff5a27', index === 2 ? '#ffd26b' : '#ffae36', index === 1 ? 1.15 : 0.94));
    mesh.position.set(x * 0.26, 0, z * 0.24);
    mesh.rotation.y = index * 0.7;
    fireCore.add(mesh);
    mesh.userData.pulse = 0.7 + index * 0.17;
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff0a6', transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending }));
  core.scale.set(1, 1.22, 0.78);
  core.position.y = -0.42;
  fireCore.add(core);
  const emberBase = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.7, 0.15, 32), new THREE.MeshStandardMaterial({ color: '#3b1113', emissive: '#c52e16', emissiveIntensity: 2, roughness: 0.6 }));
  emberBase.position.y = -0.76;
  parent.add(emberBase);
  createGlow(parent, '#ff391e', 2.2, 0.25, [0, -0.1, -0.45]);
  createGlow(parent, '#ff9b2f', 0.78, 0.5, [0, -0.33, 0.2]);
  const particles = createParticles(parent, '#ffc05a', 64, 0.7, 2.3, 0.027);
  particles.position.y = 0.12;
  parent.userData.fireCore = fireCore;
}

function createAirRibbon(parent, tint, phase, scale = 1) {
  const points = [];
  for (let i = 0; i <= 80; i += 1) {
    const t = i / 80;
    const angle = phase + t * Math.PI * 2.25;
    points.push(new THREE.Vector3(Math.cos(angle) * (0.62 + t * 0.24), (t - 0.5) * 1.72, Math.sin(angle) * (0.36 + t * 0.21)));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.014 * scale, 6, false), new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending }));
  parent.add(mesh);
  mesh.userData.particleType = 'airRibbon';
  mesh.userData.rotationSpeed = (phase > 1 ? -1 : 1) * 0.16;
  animatedObjects.push(mesh);
  return mesh;
}

function createAir(parent, element) {
  addSpecimenFrame(parent, element.color);
  const vortex = new THREE.Group();
  vortex.rotation.z = -0.3;
  parent.add(vortex);
  createAirRibbon(vortex, '#d7fff1', 0.1, 1);
  createAirRibbon(vortex, '#8fe7d0', 2.2, 0.86);
  createAirRibbon(vortex, '#4ab9a5', 4.1, 0.72);
  const center = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 2), new THREE.MeshBasicMaterial({ color: '#baf8e8', wireframe: true, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending }));
  center.rotation.x = 0.4;
  parent.add(center);
  const airDisc = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.012, 8, 100), new THREE.MeshBasicMaterial({ color: '#9cebd6', transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending }));
  airDisc.rotation.x = Math.PI * 0.5;
  airDisc.rotation.z = 0.24;
  parent.add(airDisc);
  createGlow(parent, '#57c9ad', 1.9, 0.16, [0, 0, -0.32]);
  createParticles(parent, '#c8fff1', 92, 1.0, 2.1, 0.02);
  parent.userData.vortex = vortex;
}

function createWaterShader() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBase: { value: color('#1b9dcb') }, uHighlight: { value: color('#aaf5ff') } },
    vertexShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 transformed = position;
        float wave = sin(position.y * 5.0 + uTime * 1.7) * 0.035 + sin(position.x * 8.0 - uTime * 1.1) * 0.018;
        transformed += normal * wave;
        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uBase;
      uniform vec3 uHighlight;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.4);
        vec3 surface = mix(uBase, uHighlight, fresnel * 0.9);
        gl_FragColor = vec4(surface, 0.53 + fresnel * 0.35);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });
  animatedMaterials.push(material);
  return material;
}

function createWater(parent, element) {
  addSpecimenFrame(parent, element.color);
  const halo = createGlow(parent, '#159fe8', 2.35, 0.2, [0, 0, -0.6]);
  const waterOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.79, 5), createWaterShader());
  waterOrb.scale.set(1, 1.04, 1);
  parent.add(waterOrb);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.69, 32, 24), new THREE.MeshPhysicalMaterial({ color: '#42c7dd', roughness: 0.06, metalness: 0.04, transmission: 0.42, thickness: 0.9, ior: 1.33, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.74 }));
  parent.add(inner);
  const dropletGroup = new THREE.Group();
  parent.add(dropletGroup);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.065 + (i % 3) * 0.018, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#8ceffa', emissive: '#168ec2', emissiveIntensity: 0.5, roughness: 0.05, transmission: 0.2, transparent: true, opacity: 0.9 }));
    droplet.position.set(Math.cos(angle) * (0.93 + (i % 2) * 0.08), Math.sin(angle * 1.8) * 0.36, Math.sin(angle) * (0.93 + (i % 2) * 0.08));
    dropletGroup.add(droplet);
  }
  const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.014, 8, 96), new THREE.MeshBasicMaterial({ color: '#8eefff', transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending }));
  ripple.rotation.x = Math.PI * 0.5;
  ripple.scale.y = 0.34;
  parent.add(ripple);
  const rippleTwo = ripple.clone();
  rippleTwo.material = ripple.material.clone();
  rippleTwo.material.opacity = 0.22;
  rippleTwo.scale.set(1.19, 0.28, 1.19);
  rippleTwo.position.y = -0.27;
  parent.add(rippleTwo);
  createParticles(parent, '#93efff', 48, 1.06, 1.7, 0.019);
  parent.userData.waterOrb = waterOrb;
  parent.userData.dropletGroup = dropletGroup;
  parent.userData.waterHalo = halo;
}

function seededNoise(x, y, z) {
  return Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453 % 1;
}

function createEarth(parent, element) {
  addSpecimenFrame(parent, element.color);
  const planetGeometry = new THREE.IcosahedronGeometry(0.86, 4);
  const positionAttribute = planetGeometry.getAttribute('position');
  const vertexColors = [];
  for (let i = 0; i < positionAttribute.count; i += 1) {
    const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, i).normalize();
    const jitter = Math.abs(seededNoise(vertex.x * 2.1, vertex.y * 3.7, vertex.z * 4.2));
    const displacement = 1 + (jitter - 0.5) * 0.15;
    positionAttribute.setXYZ(i, vertex.x * 0.86 * displacement, vertex.y * 0.86 * displacement, vertex.z * 0.86 * displacement);
    const land = vertex.y > 0.16 && jitter > 0.38;
    const shade = land ? (0.56 + jitter * 0.3) : (0.24 + jitter * 0.24);
    const vertexColor = land ? new THREE.Color('#8da364') : new THREE.Color('#9a5c42');
    vertexColor.multiplyScalar(shade + 0.32);
    vertexColors.push(vertexColor.r, vertexColor.g, vertexColor.b);
  }
  planetGeometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
  planetGeometry.computeVertexNormals();
  const planet = new THREE.Mesh(planetGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02, flatShading: true }));
  parent.add(planet);
  const soilGlow = createGlow(parent, '#c76547', 2.0, 0.12, [0, -0.1, -0.5]);
  const moss = new THREE.MeshStandardMaterial({ color: '#819959', roughness: 1, flatShading: true });
  const mossSpots = [[0.24, 0.57, 0.58, 1.4, 0.44, 0.8], [-0.48, 0.16, 0.68, 1.1, 0.55, 0.34], [0.54, -0.21, 0.52, 0.88, 0.42, 0.28], [-0.22, -0.55, 0.55, 1.1, 0.38, 0.68]];
  mossSpots.forEach(([x, y, z, sx, sy, sz]) => {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), moss);
    spot.position.set(x, y, z);
    spot.scale.set(sx, sy, sz);
    spot.rotation.set(y * 1.3, z * 1.7, x);
    parent.add(spot);
  });
  const roots = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + 0.4;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(angle) * 0.22, -0.62, Math.sin(angle) * 0.22),
      new THREE.Vector3(Math.cos(angle) * 0.52, -0.84, Math.sin(angle) * 0.52),
      new THREE.Vector3(Math.cos(angle) * 0.85, -0.91, Math.sin(angle) * 0.85),
    ]);
    roots.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.026, 5, false), new THREE.MeshStandardMaterial({ color: '#65402f', roughness: 1 })));
  }
  parent.add(roots);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.009, 6, 100), new THREE.MeshBasicMaterial({ color: '#a7b778', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending }));
  orbit.rotation.set(0.7, -0.5, 0.2);
  parent.add(orbit);
  createParticles(parent, '#c6a06c', 42, 1.0, 1.6, 0.018);
  parent.userData.planet = planet;
  parent.userData.soilGlow = soilGlow;
}

function createElement(id, element) {
  const parent = new THREE.Group();
  parent.position.set(...element.position);
  parent.userData.elementId = id;
  parent.userData.targetScale = 0.8;
  parent.userData.targetZ = element.position[2];
  parent.traverse((object) => { object.userData.elementId = id; });
  const tint = color(element.color);
  if (id === 'fire') createFire(parent, element);
  if (id === 'air') createAir(parent, element);
  if (id === 'water') createWater(parent, element);
  if (id === 'earth') createEarth(parent, element);
  parent.traverse((object) => { object.userData.elementId = id; });
  parent.userData.light = new THREE.PointLight(tint, 2.0, 4.0, 2);
  parent.userData.light.position.set(0, 0.1, 0.8);
  parent.add(parent.userData.light);
  elementGroups[id] = parent;
  field.add(parent);
}

Object.entries(ELEMENTS).forEach(([id, element]) => createElement(id, element));

function createFieldAtmosphere(parent) {
  const gridMaterial = new THREE.LineBasicMaterial({ color: '#607177', transparent: true, opacity: 0.08 });
  const grid = new THREE.Group();
  for (let i = -4; i <= 4; i += 1) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * 0.62, -2.22, -1.2), new THREE.Vector3(i * 0.62, 2.2, -1.2)]), gridMaterial);
    grid.add(line);
    const horizontal = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.1, i * 0.55, -1.2), new THREE.Vector3(3.1, i * 0.55, -1.2)]), gridMaterial);
    grid.add(horizontal);
  }
  grid.position.z = -0.8;
  grid.rotation.z = 0.001;
  parent.add(grid);
  const axisMaterial = new THREE.LineBasicMaterial({ color: '#a8bab8', transparent: true, opacity: 0.11 });
  const horizontalAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.2, 0, -0.3), new THREE.Vector3(3.2, 0, -0.3)]), axisMaterial);
  const verticalAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2.3, -0.3), new THREE.Vector3(0, 2.25, -0.3)]), axisMaterial);
  parent.add(horizontalAxis, verticalAxis);
  createGlow(parent, '#4f8b90', 6.4, 0.055, [0, 0, -2]);
}

function updateInspector(id) {
  const element = ELEMENTS[id];
  inspectorTitle.textContent = element.name;
  inspectorCopy.textContent = element.copy;
  inspectorIndex.textContent = `${element.index} / 04`;
  inspectorSymbol.textContent = element.symbol;
  inspectorSymbol.style.color = element.color;
  statState.textContent = element.state;
  statEnergy.textContent = element.energy;
  statRange.textContent = element.range;
  sceneTag.textContent = `ACTIVE / ${element.name}`;
  frameNumber.textContent = element.index;
  colorRow.innerHTML = `<span class="color-swatch" style="background:${element.color}"></span><span class="color-swatch" style="background:${element.accent}"></span><span class="color-swatch" style="background:${element.glow}"></span><span class="color-label">SPECTRAL PALETTE / ${element.theme.toUpperCase()}</span>`;
  document.documentElement.style.setProperty('--active-color', element.color);
  document.documentElement.style.setProperty('--active-glow', element.glow);
  document.querySelectorAll('.element-button').forEach((button) => {
    const selected = button.dataset.element === id;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}

function selectElement(id) {
  if (!ELEMENTS[id]) return;
  activeElement = id;
  updateInspector(id);
  Object.entries(elementGroups).forEach(([groupId, group]) => {
    group.userData.targetScale = groupId === id ? 1.04 : 0.78;
    group.userData.targetZ = ELEMENTS[groupId].position[2] + (groupId === id ? 0.32 : -0.08);
    group.userData.light.targetIntensity = groupId === id ? 3.2 : 0.65;
  });
}

function resetView() {
  controls.reset();
  camera.position.set(0, 0.1, 7.15);
  controls.target.set(0, 0, 0);
  controls.update();
}

document.querySelector('#reset-view').addEventListener('click', resetView);
updateInspector(activeElement);
selectElement(activeElement);

function handlePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(field.children, true);
  const hit = hits.find((intersection) => intersection.object.userData.elementId);
  if (hit) selectElement(hit.object.userData.elementId);
}

canvas.addEventListener('click', handlePointer);
canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(field.children, true);
  canvas.style.cursor = hits.some((intersection) => intersection.object.userData.elementId) ? 'pointer' : 'grab';
});

function resize() {
  const width = sceneShell.clientWidth;
  const height = sceneShell.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(sceneShell);
resize();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta = Math.min(elapsed - lastFrameTime, 0.05);
  lastFrameTime = elapsed;
  animatedMaterials.forEach((material) => {
    if (material.uniforms.uTime) material.uniforms.uTime.value = elapsed;
  });
  Object.entries(elementGroups).forEach(([id, group], index) => {
    const selected = id === activeElement;
    const targetScale = group.userData.targetScale || 0.8;
    const targetZ = group.userData.targetZ ?? 0;
    group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.055);
    group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, 0.045);
    group.rotation.y += delta * (selected ? 0.075 : 0.028) * (index % 2 ? -1 : 1);
    group.userData.frame.rotation.z += delta * (selected ? 0.25 : 0.13);
    group.userData.frameTwo.rotation.z -= delta * (selected ? 0.16 : 0.08);
    const targetIntensity = group.userData.light.targetIntensity ?? 1;
    group.userData.light.intensity = THREE.MathUtils.lerp(group.userData.light.intensity, targetIntensity, 0.05);
    group.userData.light.distance = selected ? 4.8 : 3.2;
    group.traverse((object) => {
      if (object.userData.pulse) object.scale.y = 1 + Math.sin(elapsed * 4.3 + object.userData.pulse) * 0.035;
      if (object.userData.particleType === 'airRibbon') object.rotation.y += delta * object.userData.rotationSpeed;
      if (object.userData.particleType === 'particles') {
        const position = object.geometry.getAttribute('position');
        const base = object.userData.basePositions;
        for (let i = 0; i < position.count; i += 1) {
          const i3 = i * 3;
          const seed = base[i3] * 2.0 + base[i3 + 2] * 1.3 + i * 0.17;
          position.array[i3 + 1] = base[i3 + 1] + Math.sin(elapsed * (0.8 + (i % 5) * 0.12) + seed) * 0.06;
          position.array[i3] = base[i3] + Math.sin(elapsed * 0.45 + seed) * 0.018;
        }
        position.needsUpdate = true;
      }
    });
    if (group.userData.vortex) group.userData.vortex.rotation.y += delta * (selected ? 0.17 : 0.08);
    if (group.userData.dropletGroup) group.userData.dropletGroup.rotation.y += delta * (selected ? 0.38 : 0.18);
    if (group.userData.waterOrb) group.userData.waterOrb.rotation.x += delta * 0.12;
    if (group.userData.waterHalo) group.userData.waterHalo.material.opacity = 0.15 + Math.sin(elapsed * 1.4) * 0.025;
    if (group.userData.planet) group.userData.planet.rotation.y += delta * (selected ? 0.12 : 0.055);
    if (group.userData.soilGlow) group.userData.soilGlow.material.opacity = 0.1 + Math.sin(elapsed * 1.15) * 0.018;
  });
  controls.update();
  renderer.render(scene, camera);
  const orbit = controls.target;
  document.querySelector('#coordinate-x').textContent = `X ${camera.position.x.toFixed(2).padStart(5, '0')}`;
  document.querySelector('#coordinate-y').textContent = `Y ${camera.position.y.toFixed(2).padStart(5, '0')}`;
  document.querySelector('#coordinate-z').textContent = `Z ${camera.position.z.toFixed(2).padStart(5, '0')}`;
  void orbit;
}

animate();
