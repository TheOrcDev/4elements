import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import './style.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { rand, makeGlowSprite } from './shared.js';
import { createFire } from './elements/fire.js';
import { createAir } from './elements/air.js';
import { createWater } from './elements/water.js';
import { createEarth } from './elements/earth.js';

const ELEMENTS = [
  { key: 'fire', name: 'FIRE', glyph: '\u{1F702}', line: 'Destruction and rebirth — the eternal flame', color: '#ff7a2a', x: -10.5, create: createFire },
  { key: 'air', name: 'AIR', glyph: '\u{1F701}', line: 'The unseen current — breath of the sky', color: '#9fd8ff', x: -3.5, create: createAir },
  { key: 'water', name: 'WATER', glyph: '\u{1F704}', line: 'The shapeless force — flow without end', color: '#3aa0ff', x: 3.5, create: createWater },
  { key: 'earth', name: 'EARTH', glyph: '\u{1F703}', line: 'The ancient foundation — stone and root', color: '#6fe08a', x: 10.5, create: createEarth },
];

const ELEMENT_Y = { fire: -0.62, air: 1.4, water: 1.35, earth: 1.35 };
const RING_Y = -1.05;

// ---------- renderer / scene ----------

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060c);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 6, 30);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.5;
controls.maxDistance = 45;
controls.maxPolarAngle = 1.62;
controls.target.set(0, 1.2, 0);
controls.autoRotateSpeed = 0.5;

// ---------- lights ----------

scene.add(new THREE.AmbientLight(0x334455, 0.7));
const dirLight = new THREE.DirectionalLight(0xdde6ff, 1.6);
dirLight.position.set(6, 10, 4);
scene.add(dirLight);

// ---------- elements ----------

const pointMaterials = [];
const elements = ELEMENTS.map((cfg) => {
  const el = cfg.create();
  el.group.position.set(cfg.x, ELEMENT_Y[cfg.key], 0);
  scene.add(el.group);
  pointMaterials.push(...el.pointMaterials);

  // base ring + light pool
  const ringColor = new THREE.Color(cfg.color).multiplyScalar(1.7);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.022, 16, 96),
    new THREE.MeshBasicMaterial({ color: ringColor })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(cfg.x, RING_Y, 0);
  scene.add(ring);

  const pool = makeGlowSprite(new THREE.Color(cfg.color), 5.2, 0.16);
  pool.position.set(cfg.x, RING_Y + 0.15, 0);
  scene.add(pool);

  return { ...cfg, ...el };
});

// ---------- starfield ----------

const stars = (() => {
  const count = 2200;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.randomDirection().multiplyScalar(rand(110, 260));
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
    sizes[i] = rand(0.25, 0.85);
    phases[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPointScale: { value: 600 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPointScale;
      attribute float aSize;
      attribute float aPhase;
      varying float vTw;
      void main(){
        vTw = 0.7 + 0.3 * sin(uTime * (0.4 + fract(aPhase) * 0.8) + aPhase * 20.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(aSize * uPointScale / max(0.1, -mv.z), 8.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vTw;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float m = smoothstep(0.5, 0.08, length(p));
        gl_FragColor = vec4(vec3(0.82, 0.88, 1.0), m * 0.85 * vTw);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  pointMaterials.push(mat);
  return points;
})();

// distant nebula glows
for (const [color, x, y, z, s, o] of [
  [0x223f88, -55, 20, -80, 85, 0.07],
  [0x0f3a55, 45, 6, -90, 95, 0.07],
  [0x2a1548, 0, 34, -100, 100, 0.05],
  [0x123326, -15, -20, -85, 70, 0.04],
]) {
  const neb = makeGlowSprite(color, s, o);
  neb.position.set(x, y, z);
  scene.add(neb);
}

// ---------- post-processing ----------

const composer = new EffectComposer(
  renderer,
  new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.45, 0.35);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function updatePointScale() {
  const size = new THREE.Vector2();
  renderer.getDrawingBufferSize(size);
  const scale = size.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
  for (const m of pointMaterials) {
    if (m.uniforms.uPointScale) m.uniforms.uPointScale.value = scale;
  }
}
updatePointScale();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  updatePointScale();
});

// ---------- camera focus / UI ----------

const OVERVIEW = { pos: new THREE.Vector3(0, 2.6, 17.5), tgt: new THREE.Vector3(0, 1.2, 0) };
const camState = { dest: OVERVIEW, moving: true };
let mode = -1; // -1 overview, 0..3 element index
let lastInteraction = 0;

const capEl = document.getElementById('caption');
const capName = document.getElementById('cap-name');
const capLine = document.getElementById('cap-line');
const dock = document.getElementById('dock');

const buttons = [];
ELEMENTS.forEach((cfg, i) => {
  const btn = document.createElement('button');
  btn.style.setProperty('--c', cfg.color);
  btn.innerHTML = `<span class="glyph">${cfg.glyph}</span><span class="label">${cfg.name}</span>`;
  btn.addEventListener('click', () => focusElement(i));
  dock.appendChild(btn);
  buttons.push(btn);
});
const allBtn = document.createElement('button');
allBtn.innerHTML = `<span class="glyph">✦</span><span class="label">All</span>`;
allBtn.addEventListener('click', () => focusElement(-1));
dock.appendChild(allBtn);
buttons.push(allBtn);

function focusElement(i) {
  mode = i;
  if (i < 0) {
    camState.dest = OVERVIEW;
    capEl.classList.remove('show');
  } else {
    const cfg = ELEMENTS[i];
    camState.dest = {
      pos: new THREE.Vector3(cfg.x, 1.7, 6.6),
      tgt: new THREE.Vector3(cfg.x, 1.15, 0),
    };
    capEl.style.setProperty('--c', cfg.color);
    capName.textContent = cfg.name;
    capLine.textContent = cfg.line;
    capEl.classList.add('show');
  }
  camState.moving = true;
  controls.autoRotate = false;
  buttons.forEach((b, bi) => b.classList.toggle('active', bi === (i < 0 ? 4 : i)));
}

window.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '4') focusElement(Number(e.key) - 1);
  if (e.key === '0' || e.key === 'Escape') focusElement(-1);
});

controls.addEventListener('start', () => {
  camState.moving = false;
  controls.autoRotate = false;
  lastInteraction = clock.elapsedTime;
});

// click-to-focus via ray vs bounding spheres
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const hitPoint = new THREE.Vector3();

function pickElement(clientX, clientY) {
  ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  let best = -1;
  let bestD = Infinity;
  ELEMENTS.forEach((cfg, i) => {
    const sphere = new THREE.Sphere(new THREE.Vector3(cfg.x, 1.2, 0), 2.4);
    if (raycaster.ray.intersectSphere(sphere, hitPoint)) {
      const d = hitPoint.distanceTo(camera.position);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  });
  return best;
}

let downAt = null;
canvas.addEventListener('pointerdown', (e) => {
  downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
});
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  const dt = performance.now() - downAt.t;
  downAt = null;
  if (moved < 6 && dt < 350) {
    const i = pickElement(e.clientX, e.clientY);
    if (i >= 0) focusElement(i);
  }
});
canvas.addEventListener('pointermove', (e) => {
  lastInteraction = clock.elapsedTime;
  canvas.style.cursor = pickElement(e.clientX, e.clientY) >= 0 ? 'pointer' : 'default';
});

// ---------- loop ----------

const clock = new THREE.Clock();

function tick() {
  const dtRaw = clock.getDelta();
  const dt = Math.min(dtRaw, 0.05);
  const t = clock.elapsedTime;

  for (const el of elements) el.update(t, dt);
  stars.rotation.y = t * 0.004;
  stars.material.uniforms.uTime.value = t;

  if (camState.moving) {
    const k = 1 - Math.exp(-Math.min(dtRaw, 0.5) * 3.2);
    camera.position.lerp(camState.dest.pos, k);
    controls.target.lerp(camState.dest.tgt, k);
    if (
      camera.position.distanceTo(camState.dest.pos) < 0.02 &&
      controls.target.distanceTo(camState.dest.tgt) < 0.02
    ) {
      camState.moving = false;
    }
  }

  // gentle auto-orbit when idle in overview
  if (mode === -1 && !camState.moving && t - lastInteraction > 6) {
    controls.autoRotate = true;
  }

  controls.update();
  composer.render();
}

renderer.setAnimationLoop(tick);
focusElement(-1);

window.__DEBUG = { renderer, composer, scene, camera, tick };
