import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createEnvironment } from './environment.js';
import { createFire } from './elements/fire.js';
import { createWater } from './elements/water.js';
import { createAir } from './elements/air.js';
import { createEarth } from './elements/earth.js';

// ------------------------------------------------------------------ renderer
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04050a);
scene.fog = new THREE.FogExp2(0x04050a, 0.012);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 300);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.485;
controls.minDistance = 3;
controls.maxDistance = 45;

// ------------------------------------------------------------------ world
const env = createEnvironment(renderer, scene);

const SPACING = 6.6;
const elements = [
  createFire({ position: new THREE.Vector3(-SPACING * 1.5, 0, 0) }),
  createWater({ position: new THREE.Vector3(-SPACING * 0.5, 0, 0), envMap: env.envMap }),
  createAir({ position: new THREE.Vector3(SPACING * 0.5, 0, 0) }),
  createEarth({ position: new THREE.Vector3(SPACING * 1.5, 0, 0) }),
];
for (const el of elements) scene.add(el.group);
scene.updateMatrixWorld(true);

// ------------------------------------------------------------------ post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.5, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------ camera focus / tweening
const clock = new THREE.Clock();
const views = {
  overview: {
    position: new THREE.Vector3(0, 6.2, 23.5),
    target: new THREE.Vector3(0, 2.0, 0),
  },
};
for (const el of elements) {
  const t = el.focus.target;
  views[el.name] = {
    position: new THREE.Vector3(t.x + 2.4, 3.0, 8.4),
    target: t.clone(),
  };
}

const tween = { active: false, start: 0, duration: 1.6, fromPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), to: null };
function flyTo(name) {
  const view = views[name];
  if (!view) return;
  tween.fromPos.copy(camera.position);
  tween.fromTarget.copy(controls.target);
  tween.to = view;
  tween.start = clock.elapsedTime;
  tween.active = true;
  document.querySelectorAll('.elements button').forEach((b) => b.classList.toggle('active', b.dataset.focus === name));
}
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

camera.position.copy(views.overview.position);
controls.target.copy(views.overview.target);
controls.update();

document.querySelectorAll('.elements button').forEach((b) => b.addEventListener('click', () => flyTo(b.dataset.focus)));
canvas.addEventListener('pointerdown', () => { tween.active = false; });
window.__app = { camera, controls, tween, flyTo, renderer, scene, elements };
canvas.addEventListener('wheel', () => { tween.active = false; }, { passive: true });
window.addEventListener('keydown', (e) => {
  const map = { 0: 'overview', 1: 'fire', 2: 'water', 3: 'air', 4: 'earth' };
  if (map[e.key]) flyTo(map[e.key]);
});

// ------------------------------------------------------------------ resize
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.resolution.set(w, h);
});

// ------------------------------------------------------------------ loop
const fpsEl = document.querySelector('#fps');
let frames = 0;
let fpsTimer = 0;

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (tween.active) {
    const u = Math.min((t - tween.start) / tween.duration, 1);
    const k = easeInOut(u);
    camera.position.lerpVectors(tween.fromPos, tween.to.position, k);
    controls.target.lerpVectors(tween.fromTarget, tween.to.target, k);
    if (u >= 1) tween.active = false;
  }
  controls.update();

  env.update(t);
  for (const el of elements) el.update(t, dt, camera);

  composer.render();

  frames++;
  fpsTimer += dt;
  if (fpsTimer >= 0.5) {
    fpsEl.textContent = `${Math.round(frames / fpsTimer)} FPS`;
    frames = 0;
    fpsTimer = 0;
  }
});
