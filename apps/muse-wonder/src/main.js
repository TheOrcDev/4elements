import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createFire, createWater, createEarth, createAir } from './elements.js';
import './style.css';

/* ------------------------------------------------------------- data */

const INFO = {
  all: {
    kicker: 'The Classical Quartet',
    title: 'Four Elements',
    sub: 'One world, four living forces',
    accent: '#e8ecff',
    desc: 'Fire, water, earth and air — each rendered as a real-time shader orb with its own GPU particle system, light and personality. Click any orb, or use the dock below, to step inside an element.',
    stats: [
      { label: 'Elements', value: 4, display: '4' },
      { label: 'Particles', value: 92, display: '4,300+' },
      { label: 'Shaders', value: 78, display: '12 GLSL' }
    ]
  },
  fire: {
    kicker: 'Element I · Combustion',
    title: 'FIRE',
    sub: 'Plasma core · Rising flame particles · Embers',
    accent: '#ff7a1a',
    desc: 'A simplex-noise plasma ball wrapped in 900 GPU flame particles that shrink, sway and cool from white-hot yellow to deep red as they rise, lit by a flickering point light over charred rocks.',
    stats: [
      { label: 'Heat', value: 96, display: '1,400°C' },
      { label: 'Energy', value: 88, display: '88%' },
      { label: 'Chaos', value: 74, display: '74%' }
    ]
  },
  water: {
    kicker: 'Element II · Flow',
    title: 'WATER',
    sub: 'Fresnel wave shell · Droplets · Bubbles · Ripples',
    accent: '#38bdf8',
    desc: 'A deep-blue body under an animated fresnel shell: noise waves roll across the surface while droplets orbit, bubbles rise inside, and ripple rings breathe outward across its pedestal.',
    stats: [
      { label: 'Depth', value: 82, display: '82%' },
      { label: 'Flow', value: 94, display: '94%' },
      { label: 'Clarity', value: 71, display: '71%' }
    ]
  },
  earth: {
    kicker: 'Element III · Ground',
    title: 'EARTH',
    sub: 'Procedural planet · Crystals · Pines · Orbiting rocks',
    accent: '#4ade80',
    desc: 'A tiny procedural world: trig-noise terrain coloured into rock, moss and grass biomes, pulsing emerald crystals, miniature pine forests, and a slow belt of floating boulders.',
    stats: [
      { label: 'Mass', value: 98, display: '98%' },
      { label: 'Growth', value: 76, display: '76%' },
      { label: 'Stability', value: 91, display: '91%' }
    ]
  },
  air: {
    kicker: 'Element IV · Motion',
    title: 'AIR',
    sub: 'Tornado shroud · 950 wind particles · Gyro rings',
    accent: '#a5f3fc',
    desc: 'A glassy fresnel core inside a spinning tornado: nearly a thousand wind particles spiral from a tight base to a wide crown, crossed by three gyroscope rings of pale light.',
    stats: [
      { label: 'Speed', value: 93, display: '93%' },
      { label: 'Freedom', value: 97, display: '97%' },
      { label: 'Weight', value: 8, display: '8%' }
    ]
  }
};
const ORDER = ['all', 'fire', 'water', 'earth', 'air'];
const KEYS = ['fire', 'water', 'earth', 'air'];

/* ------------------------------------------------------------- scene */

const container = document.getElementById('scene-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.FogExp2(0x05060a, 0.02);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 2.6, 13);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.2;
controls.maxDistance = 18;
controls.maxPolarAngle = 1.5;
controls.target.set(0, 0.4, 0);
controls.autoRotateSpeed = 0.55;

// Post-processing: bloom makes every element glow
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(devicePixelRatio, 2));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.85, 0.65, 0.18);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ------------------------------------------------------------- lights & stage */

scene.add(new THREE.AmbientLight(0x8899bb, 0.5));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.2);
sun.position.set(6, 10, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9;
sun.shadow.bias = -0.0004;
scene.add(sun);
const rim = new THREE.DirectionalLight(0x7dd3fc, 0.9);
rim.position.set(-7, 4, -6);
scene.add(rim);

// Ground disc
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(34, 72),
  new THREE.MeshStandardMaterial({ color: 0x080a12, roughness: 0.45, metalness: 0.55 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.52;
ground.receiveShadow = true;
scene.add(ground);

// Faint concentric stage rings
for (let i = 1; i <= 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(i * 2.6 - 0.015, i * 2.6 + 0.015, 96),
    new THREE.MeshBasicMaterial({ color: 0x3d4a6b, transparent: true, opacity: 0.35 - i * 0.08, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -1.51;
  scene.add(ring);
}

// Starfield / ambient dust
{
  const N = 1600;
  const p = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 22 + Math.random() * 30;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.random() * 2 - 1);
    p.set([
      r * Math.sin(ph) * Math.cos(th),
      Math.abs(r * Math.cos(ph)) * 0.7 - 4,
      r * Math.sin(ph) * Math.sin(th)
    ], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xaFC4ff, size: 0.09, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  stars.raycast = () => {};
  scene.add(stars);
}

/* ------------------------------------------------------------- elements */

const creators = { fire: createFire, water: createWater, earth: createEarth, air: createAir };
const homes = { fire: -4.65, water: -1.55, earth: 1.55, air: 4.65 };
const elements = {};

KEYS.forEach((key) => {
  const el = creators[key]();
  el.group.position.set(homes[key], 0.15, 0);
  el.group.traverse((child) => { child.userData.elementKey = key; });
  scene.add(el.group);
  elements[key] = { ...el, home: new THREE.Vector3(homes[key], 0.15, 0), focusScale: 1.5, allScale: 0.92 };
  el.group.scale.setScalar(0.92);
});

/* ------------------------------------------------------------- mode / UI */

let mode = 'all';
const panel = document.getElementById('panel');
const buttons = [...document.querySelectorAll('.orb-btn')];

function renderPanel(key) {
  const d = INFO[key];
  panel.innerHTML = `
    <p class="kicker">${d.kicker}</p>
    <h2>${d.title}</h2>
    <p class="sub">${d.sub}</p>
    <p class="desc">${d.desc}</p>
    <div class="stats">
      ${d.stats.map((s) => `
        <div class="stat-row">
          <label>${s.label}</label>
          <div class="bar"><i data-w="${s.value}"></i></div>
          <output>${s.display}</output>
        </div>`).join('')}
    </div>`;
  panel.style.animation = 'none';
  void panel.offsetWidth;
  panel.style.animation = '';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.querySelectorAll('.bar i').forEach((b) => { b.style.width = b.dataset.w + '%'; });
  }));
}

// Camera fly-to animation
let camAnim = null;
function flyTo(pos, target) {
  camAnim = {
    t: 0,
    fromPos: camera.position.clone(), toPos: pos.clone(),
    fromTg: controls.target.clone(), toTg: target.clone()
  };
  controls.enabled = false;
}
function camPosFor(m) {
  const a = innerWidth / innerHeight;
  if (m === 'all') return new THREE.Vector3(0, 2.5, a < 0.75 ? 16.5 : a < 1.15 ? 13 : 10.8);
  return new THREE.Vector3(0, 1.5, a < 0.75 ? 7.6 : 5.6);
}

function setMode(next, fly = true) {
  if (!ORDER.includes(next)) return;
  mode = next;
  const d = INFO[next];
  document.documentElement.style.setProperty('--accent', d.accent);
  buttons.forEach((b) => b.classList.toggle('active', b.dataset.mode === next));
  renderPanel(next);
  if (fly) flyTo(camPosFor(next), new THREE.Vector3(0, next === 'all' ? 0.35 : 0.25, 0));
  tourClock = 0;
}

buttons.forEach((b) => b.addEventListener('click', () => { stopTour(); setMode(b.dataset.mode); }));

/* Auto tour */
let touring = false;
let tourClock = 0;
const tourBtn = document.getElementById('tourBtn');
function stopTour() {
  touring = false;
  tourBtn.classList.remove('active');
  tourBtn.setAttribute('aria-pressed', 'false');
  tourBtn.innerHTML = '▶&nbsp; Auto Tour';
}
tourBtn.addEventListener('click', () => {
  touring = !touring;
  tourClock = 0;
  tourBtn.classList.toggle('active', touring);
  tourBtn.setAttribute('aria-pressed', String(touring));
  tourBtn.innerHTML = touring ? '❚❚&nbsp; Touring…' : '▶&nbsp; Auto Tour';
});

document.getElementById('resetBtn').addEventListener('click', () => { stopTour(); setMode('all'); });

addEventListener('keydown', (e) => {
  const idx = ['1', '2', '3', '4', '5'].indexOf(e.key);
  if (idx >= 0) { stopTour(); setMode(ORDER[idx]); }
  if (e.key === 'Escape') { stopTour(); setMode('all'); }
});

/* Click an orb to focus it (ignoring drags) */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (moved > 6) return;
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(KEYS.map((k) => elements[k].group), true);
  const key = hits[0]?.object?.userData?.elementKey;
  if (key) { stopTour(); setMode(key === mode ? 'all' : key); }
});

/* ------------------------------------------------------------- loop */

const clock = new THREE.Clock();
const CENTER = new THREE.Vector3(0, 0.25, 0);
const HIDDEN = new THREE.Vector3(0, -4.2, 0);
const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // Update every element's bespoke animation
  KEYS.forEach((key) => elements[key].update(t, dt));

  // Glide groups between "all" layout and focused layout
  KEYS.forEach((key) => {
    const el = elements[key];
    let targetPos, targetScale;
    if (mode === 'all') { targetPos = el.home; targetScale = el.allScale; }
    else if (mode === key) { targetPos = CENTER; targetScale = el.focusScale; }
    else { targetPos = HIDDEN; targetScale = 0.001; }
    el.group.position.lerp(targetPos, 1 - Math.pow(0.0018, dt));
    const s = THREE.MathUtils.lerp(el.group.scale.x, targetScale, 1 - Math.pow(0.0018, dt));
    el.group.scale.setScalar(s);
    el.group.visible = s > 0.02;
    if (mode === 'all') el.group.position.y = el.home.y + Math.sin(t * 0.9 + el.home.x) * 0.07;
  });

  // Camera fly-to
  if (camAnim) {
    camAnim.t += dt / 1.5;
    const k = easeInOut(Math.min(camAnim.t, 1));
    camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, k);
    controls.target.lerpVectors(camAnim.fromTg, camAnim.toTg, k);
    if (camAnim.t >= 1) { camAnim = null; controls.enabled = true; }
  }

  // Auto tour: advance every 5 seconds
  if (touring) {
    tourClock += dt;
    if (tourClock > 5) {
      const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
      setMode(next);
    }
  }

  controls.autoRotate = mode === 'all' && !camAnim;
  controls.update();
  composer.render();
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ------------------------------------------------------------- go */

renderPanel('all');
flyTo(camPosFor('all'), new THREE.Vector3(0, 0.35, 0));
animate();
requestAnimationFrame(() => {
  setTimeout(() => document.getElementById('loader').classList.add('done'), 350);
});
