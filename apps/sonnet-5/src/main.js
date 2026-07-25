import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { createFire } from './elements/fire.js';
import { createWater } from './elements/water.js';
import { createAir } from './elements/air.js';
import { createEarth } from './elements/earth.js';
import { createStarfield } from './scene/starfield.js';

const LAYOUT_RADIUS = 7.5;
const OVERVIEW_DIR = new THREE.Vector3(0, 6.5, 19).normalize();
const OVERVIEW_BASE_DISTANCE = new THREE.Vector3(0, 6.5, 19).length();
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);
const OVERVIEW_POSITION = new THREE.Vector3();

// On narrow/portrait viewports the horizontal FOV shrinks faster than the
// vertical one, so the two outermost elements can fall outside the frame.
// Pull the camera back to compensate.
function updateOverviewPosition() {
  const aspect = window.innerWidth / window.innerHeight;
  const distance = aspect < 1 ? (OVERVIEW_BASE_DISTANCE / aspect) * 1.25 : OVERVIEW_BASE_DISTANCE;
  OVERVIEW_POSITION.copy(OVERVIEW_DIR).multiplyScalar(distance);
}
updateOverviewPosition();

const sceneRoot = document.querySelector('#scene-root');
const introEl = document.querySelector('#intro');
const infoPanel = document.querySelector('#info-panel');
const infoName = document.querySelector('#info-name');
const infoDesc = document.querySelector('#info-desc');
const infoClose = document.querySelector('#info-close');

// ---------------------------------------------------------------------------
// Core renderer / scene / camera
// ---------------------------------------------------------------------------

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x04060a, 0.012);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.copy(OVERVIEW_POSITION);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x04060a, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
sceneRoot.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.className = 'label-layer';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(OVERVIEW_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.minDistance = 3.5;
controls.maxDistance = 65;
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.82;
controls.update();

// ---------------------------------------------------------------------------
// Lighting
// ---------------------------------------------------------------------------

scene.add(new THREE.AmbientLight(0x223047, 0.55));
scene.add(new THREE.HemisphereLight(0x99bbff, 0x120c08, 0.4));

// ---------------------------------------------------------------------------
// Post-processing
// ---------------------------------------------------------------------------

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.25,
  0.5,
  0.72
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------------------
// Starfield backdrop
// ---------------------------------------------------------------------------

const starfield = createStarfield();
scene.add(starfield.points);

// ---------------------------------------------------------------------------
// The four elements, arranged evenly around the origin
// ---------------------------------------------------------------------------

const elements = [createFire(), createAir(), createWater(), createEarth()];

elements.forEach((el, i) => {
  const angle = (i / elements.length) * Math.PI * 2;
  el.group.position.set(Math.cos(angle) * LAYOUT_RADIUS, 0, Math.sin(angle) * LAYOUT_RADIUS);
  scene.add(el.group);

  const light = new THREE.PointLight(el.color, 9, 11, 2);
  light.position.set(0, 0.5, 0);
  el.group.add(light);

  const labelDiv = document.createElement('div');
  labelDiv.className = 'element-label';
  labelDiv.style.setProperty('--label-color', colorToCss(el.color));
  labelDiv.textContent = el.name.toUpperCase();
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 2.3, 0);
  el.group.add(label);
});

function colorToCss(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

// ---------------------------------------------------------------------------
// Click-to-focus interaction
// ---------------------------------------------------------------------------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pickableMeshes = elements.map((el) => el.focusMesh);

let focusedElement = null;
let focusTween = null;

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function startTween(toPos, toTarget, onComplete) {
  focusTween = {
    t: 0,
    duration: 1.15,
    fromPos: camera.position.clone(),
    toPos: toPos.clone(),
    fromTarget: controls.target.clone(),
    toTarget: toTarget.clone(),
    onComplete,
  };
  controls.enabled = false;
  controls.autoRotate = false;
}

function focusOn(el) {
  focusedElement = el;
  const radialDir = el.group.position.clone().normalize();
  const camPos = el.group.position
    .clone()
    .add(radialDir.multiplyScalar(4.6))
    .add(new THREE.Vector3(0, 1.8, 0));
  startTween(camPos, el.group.position.clone(), () => {
    controls.enabled = true;
  });
  showInfo(el);
}

function resetView() {
  focusedElement = null;
  hideInfo();
  startTween(OVERVIEW_POSITION, OVERVIEW_TARGET, () => {
    controls.enabled = true;
    controls.autoRotate = true;
  });
}

function showInfo(el) {
  infoName.textContent = el.name;
  infoName.style.setProperty('--panel-color', colorToCss(el.color));
  infoPanel.style.setProperty('--panel-color', colorToCss(el.color));
  infoDesc.textContent = el.description;
  infoPanel.classList.add('visible');
}

function hideInfo() {
  infoPanel.classList.remove('visible');
}

let downPos = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  downPos = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const dx = e.clientX - downPos.x;
  const dy = e.clientY - downPos.y;
  downPos = null;
  if (Math.hypot(dx, dy) > 5) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickableMeshes, false);

  if (hits.length > 0) {
    const hit = elements.find((el) => el.focusMesh === hits[0].object);
    if (hit) focusOn(hit);
  } else if (focusedElement) {
    resetView();
  }
});

infoClose.addEventListener('click', resetView);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && focusedElement) resetView();
});

// ---------------------------------------------------------------------------
// Intro overlay
// ---------------------------------------------------------------------------

function dismissIntro() {
  introEl.classList.add('hidden');
}
introEl.addEventListener('click', dismissIntro, { once: true });
setTimeout(dismissIntro, 6000);

// ---------------------------------------------------------------------------
// Resize handling
// ---------------------------------------------------------------------------

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  labelRenderer.setSize(w, h);

  updateOverviewPosition();
  if (!focusedElement && !focusTween) {
    camera.position.copy(OVERVIEW_POSITION);
    controls.update();
  }
}
window.addEventListener('resize', onResize);

// ---------------------------------------------------------------------------
// Animate
// ---------------------------------------------------------------------------

const timer = new THREE.Timer();

function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const delta = timer.getDelta();
  const elapsed = timer.getElapsed();

  elements.forEach((el) => el.update(elapsed));
  starfield.update(elapsed);

  if (focusTween) {
    focusTween.t = Math.min(1, focusTween.t + delta / focusTween.duration);
    const k = easeInOutCubic(focusTween.t);
    camera.position.lerpVectors(focusTween.fromPos, focusTween.toPos, k);
    const curTarget = new THREE.Vector3().lerpVectors(focusTween.fromTarget, focusTween.toTarget, k);
    camera.lookAt(curTarget);

    if (focusTween.t >= 1) {
      controls.target.copy(focusTween.toTarget);
      const done = focusTween.onComplete;
      focusTween = null;
      if (done) done();
    }
  } else {
    controls.update();
  }

  composer.render();
  labelRenderer.render(scene, camera);
}

animate();
