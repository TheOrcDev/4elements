import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { FireElement } from './elements/FireElement.js';
import { WaterElement } from './elements/WaterElement.js';
import { EarthElement } from './elements/EarthElement.js';
import { AirElement } from './elements/AirElement.js';
import { SanctuaryEnvironment } from './scene/SanctuaryEnvironment.js';

// --- Elemental Lore & Technical Metadata for Inspector HUD ---
const VIEW_CONFIGS = {
  overview: {
    sigil: '❖',
    latin: 'QUINTA ESSENTIA • SANCTUARY',
    title: 'The Elemental Sanctuary',
    desc: 'Four primordial shrines—Ignis, Aqua, Terra, and Ventus—channel procedural 3D Simplex FBM shader energy and GPU particle streams into the central Aether Merkaba.',
    shader: 'Multi-Pass GLSL + ACES Filmic Bloom',
    particles: '10,200 Active GPU Particles',
    camPos: new THREE.Vector3(1.35, 5.0, 17.6),
    lookAt: new THREE.Vector3(1.15, -0.15, -0.4),
    accent: 'rgba(255, 255, 255, 0.22)'
  },
  fire: {
    sigil: '🜂',
    latin: 'IGNIS • SOLAR CONVECTIVE PLUME',
    title: 'Shrine of Primordial Fire',
    desc: 'A convecting molten magma core fractured by 3D Ridged FBM fissures feeds three counter-twisting volumetric flame shells, solar rings, orbiting basalt shards, and 1,600 rising thermal embers.',
    shader: 'Blackbody Thermal FBM + Curl Twist',
    particles: '1,600 Rising Incandescent Embers',
    camPos: new THREE.Vector3(-7.6, 1.4, 7.2),
    lookAt: new THREE.Vector3(-6.0, 0.15, 1.8),
    accent: 'rgba(255, 94, 26, 0.55)'
  },
  water: {
    sigil: '🜄',
    latin: 'AQUA • ABYSSAL MAELSTROM',
    title: 'Shrine of Living Water',
    desc: 'A high-resolution liquid orb morphed by Gerstner surface waves and finite-difference normal perturbation, wrapped in swirling tidal caustic ribbons, satellite droplets, and a 1,700-particle hydro-vortex.',
    shader: 'Gerstner Fluid SSS + Voronoi Caustics',
    particles: '1,700 Double-Helix Hydro & Mist Particles',
    camPos: new THREE.Vector3(-3.3, 1.3, 2.6),
    lookAt: new THREE.Vector3(-1.8, 0.05, -2.8),
    accent: 'rgba(0, 212, 255, 0.55)'
  },
  earth: {
    sigil: '🜃',
    latin: 'TERRA • TECTONIC GEODE MONOLITH',
    title: 'Shrine of Ancient Earth',
    desc: 'A levitating granite monolith split by glowing emerald and amber crystal veins, crowned with hexagonal peridot spires and encircled by tilted planetary asteroid rings and 1,450 bioluminescent spores.',
    shader: 'Tectonic Strata + Crystalline Fresnel',
    particles: '1,450 Bioluminescent Spores & Gold Dust',
    camPos: new THREE.Vector3(4.1, 1.3, 2.6),
    lookAt: new THREE.Vector3(2.8, 0.05, -2.8),
    accent: 'rgba(46, 255, 123, 0.55)'
  },
  air: {
    sigil: '🜁',
    latin: 'VENTUS • CYCLONIC TEMPEST VORTEX',
    title: 'Shrine of Celestial Air',
    desc: 'Three nested tornado funnel shells twist around a high-pressure storm eye with internal lightning filaments, high-velocity aero slipstreams, and 1,850 cyclonic vortex particles.',
    shader: 'Helical Wind Shear + Storm Arcs',
    particles: '1,850 Cyclonic Vortex & Lightning Motes',
    camPos: new THREE.Vector3(8.4, 1.4, 7.2),
    lookAt: new THREE.Vector3(7.0, 0.15, 1.8),
    accent: 'rgba(168, 197, 255, 0.55)'
  },
  nexus: {
    sigil: '✦',
    latin: 'AETHER • HARMONIC CONVERGENCE',
    title: 'The Central Aether Nexus',
    desc: 'Four curved Bezier ley-line streams draw elemental energy from Fire, Water, Earth, and Air into a counter-rotating prismatic Merkaba and golden astrolabe gyroscope.',
    shader: 'Quadratic Bezier Streams + Merkaba',
    particles: '1,400 Converging Ley-Line Particles',
    camPos: new THREE.Vector3(0.4, 1.65, 4.4),
    lookAt: new THREE.Vector3(0.4, 0.65, -0.4),
    accent: 'rgba(224, 179, 255, 0.55)'
  }
};

// --- Scene & Renderer Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x040610, 0.014);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 150);
camera.position.copy(VIEW_CONFIGS.overview.camPos);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
container.appendChild(renderer.domElement);

// --- Post-Processing (UnrealBloomPass) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55, // strength
  0.45, // radius
  0.42  // threshold
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(VIEW_CONFIGS.overview.lookAt);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.maxPolarAngle = Math.PI * 0.52;
controls.minDistance = 2.4;
controls.maxDistance = 30.0;

// --- Ambient & Sanctuary Lighting ---
const ambientLight = new THREE.AmbientLight(0x283252, 1.35);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x6b8cff, 0x120d1a, 1.1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.25);
dirLight.position.set(5, 14, 10);
scene.add(dirLight);

// --- Instantiate the Four Elemental Shrines & Sanctuary ---
const ELEMENT_POSITIONS = {
  fire: new THREE.Vector3(-6.5, 0.0, 1.8),
  water: new THREE.Vector3(-2.3, 0.0, -2.8),
  earth: new THREE.Vector3(2.3, 0.0, -2.8),
  air: new THREE.Vector3(6.5, 0.0, 1.8),
  nexus: new THREE.Vector3(0.0, 0.75, -0.4)
};

const fireElement = new FireElement(ELEMENT_POSITIONS.fire);
const waterElement = new WaterElement(ELEMENT_POSITIONS.water);
const earthElement = new EarthElement(ELEMENT_POSITIONS.earth);
const airElement = new AirElement(ELEMENT_POSITIONS.air);
const sanctuary = new SanctuaryEnvironment(ELEMENT_POSITIONS);

scene.add(sanctuary.group);
scene.add(fireElement.group);
scene.add(waterElement.group);
scene.add(earthElement.group);
scene.add(airElement.group);

// --- Interactive State ---
let currentView = 'overview';
let isTransitioningCamera = false;
const targetCameraPos = VIEW_CONFIGS.overview.camPos.clone();
const targetLookAt = VIEW_CONFIGS.overview.lookAt.clone();

let intensity = 1.0;
let timeScale = 1.0;
let autoOrbit = true;
let showLabels = true;
let surgeValue = 0.0;
let simulatedTime = 0.0;

// Stop camera auto-transition when user manually drags canvas
controls.addEventListener('start', () => {
  isTransitioningCamera = false;
});

// --- Camera & UI View Switching ---
function selectView(viewKey) {
  const cfg = VIEW_CONFIGS[viewKey];
  if (!cfg) return;
  currentView = viewKey;
  targetCameraPos.copy(cfg.camPos);
  targetLookAt.copy(cfg.lookAt);
  isTransitioningCamera = true;

  // Update Dock Active State
  document.querySelectorAll('.dock-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === viewKey);
  });

  // Update Inspector HUD
  document.getElementById('info-sigil').textContent = cfg.sigil;
  document.getElementById('info-latin').textContent = cfg.latin;
  document.getElementById('info-title').textContent = cfg.title;
  document.getElementById('info-desc').textContent = cfg.desc;
  document.getElementById('spec-shader').textContent = cfg.shader;
  document.getElementById('spec-particles').textContent = cfg.particles;
  document.getElementById('hud-panel').style.borderColor = cfg.accent;
}

// Dock Buttons & 3D World Label Clicks
document.querySelectorAll('.dock-btn, .world-tag').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target) selectView(target);
  });
});

// Sliders & Controls
const sliderIntensity = document.getElementById('slider-intensity');
const valIntensity = document.getElementById('val-intensity');
sliderIntensity.addEventListener('input', (e) => {
  intensity = parseFloat(e.target.value);
  valIntensity.textContent = `${intensity.toFixed(2)}x`;
});

const sliderBloom = document.getElementById('slider-bloom');
const valBloom = document.getElementById('val-bloom');
sliderBloom.addEventListener('input', (e) => {
  const b = parseFloat(e.target.value);
  bloomPass.strength = b;
  valBloom.textContent = b.toFixed(2);
});

const sliderSpeed = document.getElementById('slider-speed');
const valSpeed = document.getElementById('val-speed');
sliderSpeed.addEventListener('input', (e) => {
  timeScale = parseFloat(e.target.value);
  valSpeed.textContent = `${timeScale.toFixed(2)}x`;
});

const btnSurge = document.getElementById('btn-surge');
const statState = document.getElementById('stat-state');
function triggerElementalSurge() {
  surgeValue = 1.35;
  sanctuary.triggerShockwave(simulatedTime);
  statState.textContent = 'CONVERGENCE SURGE';
  statState.style.color = '#ffb84d';
}
btnSurge.addEventListener('click', triggerElementalSurge);

const btnOrbit = document.getElementById('btn-orbit');
btnOrbit.addEventListener('click', () => {
  autoOrbit = !autoOrbit;
  btnOrbit.classList.toggle('active', autoOrbit);
  btnOrbit.textContent = `Auto-Orbit: ${autoOrbit ? 'ON' : 'OFF'}`;
});

const btnLabels = document.getElementById('btn-labels');
const worldLabelsContainer = document.getElementById('world-labels');
btnLabels.addEventListener('click', () => {
  showLabels = !showLabels;
  btnLabels.classList.toggle('active', showLabels);
  btnLabels.textContent = `Labels: ${showLabels ? 'ON' : 'OFF'}`;
  worldLabelsContainer.classList.toggle('hidden', !showLabels);
});

// Keyboard Shortcuts (1-6 for views, Space for Surge)
window.addEventListener('keydown', (e) => {
  const keyMap = {
    Digit1: 'overview',
    Digit2: 'fire',
    Digit3: 'water',
    Digit4: 'earth',
    Digit5: 'air',
    Digit6: 'nexus'
  };
  if (keyMap[e.code]) {
    selectView(keyMap[e.code]);
  } else if (e.code === 'Space' && document.activeElement.tagName !== 'BUTTON') {
    e.preventDefault();
    triggerElementalSurge();
  }
});

// --- 3D World Label Projection ---
const labelElements = {
  fire: document.querySelector('.tag-fire'),
  water: document.querySelector('.tag-water'),
  earth: document.querySelector('.tag-earth'),
  air: document.querySelector('.tag-air'),
  nexus: document.querySelector('.tag-nexus')
};

const labelAnchorOffsets = {
  fire: new THREE.Vector3(-6.5, -2.88, 1.8),
  water: new THREE.Vector3(-2.3, -2.88, -2.8),
  earth: new THREE.Vector3(2.3, -2.88, -2.8),
  air: new THREE.Vector3(6.5, -2.88, 1.8),
  nexus: new THREE.Vector3(0.0, -2.82, -0.4)
};

const tempProjVec = new THREE.Vector3();

function updateWorldLabels() {
  if (!showLabels) return;
  const halfW = window.innerWidth * 0.5;
  const halfH = window.innerHeight * 0.5;

  for (const [key, el] of Object.entries(labelElements)) {
    if (!el) continue;
    tempProjVec.copy(labelAnchorOffsets[key]);
    tempProjVec.project(camera);

    // Hide if behind camera
    if (tempProjVec.z > 1.0) {
      el.style.opacity = '0';
      continue;
    }

    const x = tempProjVec.x * halfW + halfW;
    const y = -tempProjVec.y * halfH + halfH;
    el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.style.opacity = currentView === key || currentView === 'overview' ? '1' : '0.45';
  }
}

// --- Resize Handler ---
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

// --- Main Animation Loop & Telemetry ---
const clock = new THREE.Clock();
let frameCount = 0;
let fpsAccum = 0;
const statFps = document.getElementById('stat-fps');

function animate() {
  requestAnimationFrame(animate);

  const rawDelta = Math.min(clock.getDelta(), 0.1);
  const scaledDelta = rawDelta * timeScale;
  simulatedTime += scaledDelta;

  // FPS Counter
  frameCount++;
  fpsAccum += rawDelta;
  if (fpsAccum >= 0.5) {
    const fps = Math.min(120, Math.round(frameCount / fpsAccum));
    statFps.textContent = String(fps);
    frameCount = 0;
    fpsAccum = 0;
  }

  // Decay Elemental Surge smoothly
  if (surgeValue > 0.001) {
    surgeValue = Math.max(0.0, surgeValue - rawDelta * 0.45);
    if (surgeValue <= 0.02) {
      statState.textContent = 'HARMONIC';
      statState.style.color = '#52ffa8';
    }
  }

  // Smooth Camera Focus Transition or Subtle Cinematic Orbit
  if (isTransitioningCamera) {
    camera.position.lerp(targetCameraPos, 0.065);
    controls.target.lerp(targetLookAt, 0.075);
    if (
      camera.position.distanceTo(targetCameraPos) < 0.06 &&
      controls.target.distanceTo(targetLookAt) < 0.04
    ) {
      isTransitioningCamera = false;
    }
  } else if (autoOrbit) {
    // Gentle orbital sway around current target
    const offset = camera.position.clone().sub(controls.target);
    const rotSpeed = currentView === 'overview' ? 0.08 * rawDelta : 0.18 * rawDelta;
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
    camera.position.copy(controls.target).add(offset);
  }

  controls.update();

  // Update All Four Elemental Shrines & Sanctuary
  fireElement.update(simulatedTime, scaledDelta, intensity, surgeValue);
  waterElement.update(simulatedTime, scaledDelta, intensity, surgeValue);
  earthElement.update(simulatedTime, scaledDelta, intensity, surgeValue);
  airElement.update(simulatedTime, scaledDelta, intensity, surgeValue);
  sanctuary.update(simulatedTime, scaledDelta, intensity, surgeValue);

  // Update 3D Projected World Labels
  updateWorldLabels();

  // Render with UnrealBloomPass Post-Processing
  composer.render();
}

animate();

// Expose state for automated browser verification
window.__SANCTUARY_APP__ = {
  scene,
  camera,
  renderer,
  selectView,
  triggerElementalSurge
};
