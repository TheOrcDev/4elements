import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ELEMENTS, getElement } from './elements/index.js';

/**
 * Shared host for the four element scenes.
 *
 * Owns: renderer, camera, orbit controls, post-processing (bloom + tone map),
 * the element switcher, the fade transition and the UI wiring. Element modules
 * own everything they put in their `root` group and the look they request.
 * See the typedefs in ./elements/index.js for the contract.
 */

const params = new URLSearchParams(window.location.search);
const WARM_UP_SECONDS = clampNumber(Number(params.get('warm')), 0, 30, 0);
const MAX_FRAME_DT = 1 / 20;
const DEFAULT_ID = ELEMENTS[0].id;

// Adaptive render scale: if a scene runs well below budget on this GPU, render at a
// lower resolution until it keeps up. Resets to the native ratio on every switch.
const FRAME_BUDGET_MS = 1000 / 50;
const GOVERN_SLOW_FRAMES = 45;
const GOVERN_COOLDOWN_FRAMES = 45;
const RENDER_SCALE_STEP = 0.25;

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('scene'));
const fade = document.getElementById('fade');
const loader = document.getElementById('loader');
const nameEl = document.getElementById('element-name');
const blurbEl = document.getElementById('element-blurb');
const pauseBtn = document.getElementById('btn-pause');
const rotateBtn = document.getElementById('btn-rotate');
const resetBtn = document.getElementById('btn-reset');
const navButtons = [...document.querySelectorAll('.element-button')];

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
} catch (error) {
  showUnsupported(error);
  throw error;
}

const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
// PCFSoftShadowMap was removed in three r186; PCF softness comes from light.shadow.radius.
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.05, 1000);
camera.position.set(0, 1.5, 6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.autoRotateSpeed = 0.6;

const pmrem = new THREE.PMREMGenerator(renderer);

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,
  0.4,
  0.9,
);
// The post chain renders into its own targets, so the renderer's `antialias` flag
// does not reach the image. At DPR 1, multisample the HDR target to keep hard edges
// clean. At DPR 2 the screen already supersamples, and MSAA would cost more than it adds.
const composerTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  type: THREE.HalfFloatType,
  samples: pixelRatio < 2 ? Math.min(4, renderer.capabilities.maxSamples) : 0,
});
const composer = new EffectComposer(renderer, composerTarget);
composer.setPixelRatio(pixelRatio);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloom);
composer.addPass(new OutputPass());

/** @type {{ def: import('./elements/index.js').ElementDef, element: import('./elements/index.js').ElementScene } | null} */
let active = null;
let simTime = 0;
let paused = false;
let switchToken = 0;
let lastFrame = performance.now();
let firstFrameRendered = false;

let renderScale = pixelRatio;
let smoothedFrameMs = FRAME_BUDGET_MS;
let slowFrames = 0;
let governCooldown = 0;

/** Sets the render resolution for the canvas and the post-processing chain. */
function setRenderScale(scale) {
  renderScale = Math.min(pixelRatio, Math.max(Math.min(1, pixelRatio), scale));
  renderer.setPixelRatio(renderScale);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(renderScale);
  composer.setSize(window.innerWidth, window.innerHeight);
}

/** Lowers the render scale while frames run over budget; called once per frame. */
function governResolution(frameMs) {
  if (governCooldown > 0) {
    governCooldown--;
    smoothedFrameMs = FRAME_BUDGET_MS;
    return;
  }
  smoothedFrameMs += (frameMs - smoothedFrameMs) * 0.05;
  slowFrames = smoothedFrameMs > FRAME_BUDGET_MS * 1.2 ? slowFrames + 1 : 0;
  if (slowFrames > GOVERN_SLOW_FRAMES && renderScale > Math.min(1, pixelRatio)) {
    setRenderScale(renderScale - RENDER_SCALE_STEP);
    slowFrames = 0;
    governCooldown = GOVERN_COOLDOWN_FRAMES;
  }
}

// --- element switching -----------------------------------------------------

/**
 * Builds the element, swaps it into the scene and applies its look and camera.
 * Runs behind the fade so the rebuild hitch is hidden.
 */
async function selectElement(id, { animate = true } = {}) {
  const def = getElement(id);
  if (!def) return;
  if (active?.def.id === id) return;

  const token = ++switchToken;
  if (animate) {
    fade.classList.add('on');
    await wait(340);
    if (token !== switchToken) return;
  }

  if (active) {
    scene.remove(active.element.root);
    active.element.dispose();
    active = null;
  }

  const element = def.create({ renderer, camera, pmrem, pixelRatio });
  scene.add(element.root);
  applyLook(element.look);
  applyCamera(element.camera);
  applyControls(element.controls);

  // A new scene has its own cost, so start again at full resolution.
  if (renderScale !== pixelRatio) setRenderScale(pixelRatio);
  governCooldown = GOVERN_COOLDOWN_FRAMES;

  simTime = 0;
  if (WARM_UP_SECONDS > 0 && !firstFrameRendered) {
    warmUp(element, WARM_UP_SECONDS);
    simTime = WARM_UP_SECONDS;
  }
  active = { def, element };
  controls.update();

  paintUi(def);
  if (animate) {
    await nextFrame();
    fade.classList.remove('on');
  }
}

function applyLook(look = {}) {
  scene.background = look.background ?? null;
  scene.environment = look.environment ?? null;
  scene.fog = look.fog ?? null;
  // Scales scene.environment for every material that doesn't bring its own envMap.
  scene.environmentIntensity = look.environmentIntensity ?? 1;
  renderer.toneMappingExposure = look.exposure ?? 1;
  const b = look.bloom ?? {};
  bloom.strength = b.strength ?? 0;
  bloom.radius = b.radius ?? 0.4;
  bloom.threshold = b.threshold ?? 0.9;
}

function applyCamera(pose) {
  camera.position.copy(pose.position);
  controls.target.copy(pose.target);
  camera.updateProjectionMatrix();
}

function applyControls(options = {}) {
  controls.minDistance = options.minDistance ?? 0.5;
  controls.maxDistance = options.maxDistance ?? 60;
  controls.maxPolarAngle = options.maxPolarAngle ?? Math.PI * 0.95;
  controls.minPolarAngle = options.minPolarAngle ?? 0;
  controls.autoRotate = options.autoRotate ?? rotateBtn.getAttribute('aria-pressed') === 'true';
}

function paintUi(def) {
  document.documentElement.style.setProperty('--accent', def.accent);
  document.documentElement.dataset.tone = def.tone;
  nameEl.textContent = def.name;
  blurbEl.textContent = def.blurb;
  document.title = `${def.name} · Four Elements`;
  for (const button of navButtons) {
    button.setAttribute('aria-current', String(button.dataset.element === def.id));
    button.style.setProperty('--swatch', getElement(button.dataset.element)?.accent ?? '#888');
  }
}

function warmUp(element, seconds) {
  const step = 1 / 60;
  for (let t = 0; t < seconds; t += step) element.update(t, step);
}

// --- controls --------------------------------------------------------------

function togglePause(force) {
  paused = typeof force === 'boolean' ? force : !paused;
  pauseBtn.setAttribute('aria-pressed', String(paused));
  pauseBtn.textContent = paused ? 'Play' : 'Pause';
}

function toggleRotate(force) {
  const on = typeof force === 'boolean' ? force : rotateBtn.getAttribute('aria-pressed') !== 'true';
  rotateBtn.setAttribute('aria-pressed', String(on));
  controls.autoRotate = on;
}

function resetView() {
  if (!active) return;
  applyCamera(active.element.camera);
  controls.update();
}

for (const button of navButtons) {
  button.addEventListener('click', () => selectElement(button.dataset.element));
}
pauseBtn.addEventListener('click', () => togglePause());
rotateBtn.addEventListener('click', () => toggleRotate());
resetBtn.addEventListener('click', () => resetView());

window.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  // A focused button keeps its native Space/Enter activation.
  if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;

  const index = Number.parseInt(event.key, 10) - 1;
  if (index >= 0 && index < ELEMENTS.length) {
    selectElement(ELEMENTS[index].id);
  } else if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  } else if (event.key.toLowerCase() === 'a') {
    toggleRotate();
  } else if (event.key.toLowerCase() === 'r') {
    resetView();
  }
});

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  active?.element.onResize?.(width, height);
});

// --- loop ------------------------------------------------------------------

function frame(now) {
  const frameMs = now - lastFrame;
  const dt = Math.min(frameMs / 1000, MAX_FRAME_DT);
  lastFrame = now;
  governResolution(frameMs);

  if (active) {
    const step = paused ? 0 : dt;
    simTime += step;
    active.element.update(simTime, step);
  }

  controls.update(dt);
  composer.render(dt);

  if (!firstFrameRendered) {
    firstFrameRendered = true;
    document.documentElement.dataset.ready = 'true';
    loader.classList.add('done');
  }
}

function showUnsupported(error) {
  console.error(error);
  loader.remove();
  const message = document.createElement('p');
  message.className = 'unsupported';
  message.textContent =
    'This scene needs WebGL 2. Try a recent version of Chrome, Edge, Firefox or Safari with hardware acceleration on.';
  document.body.appendChild(message);
}

// --- helpers ---------------------------------------------------------------

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

// Debug hook for scripted screenshots and manual inspection in the console.
window.fourElements = {
  renderer,
  select: (id) => selectElement(id, { animate: false }),
  pause: (force) => togglePause(force),
  get active() {
    return active?.def.id ?? null;
  },
  get time() {
    return simTime;
  },
  get renderScale() {
    return renderScale;
  },
};

renderer.setAnimationLoop(frame);
const initialId = getElement(params.get('element') ?? '') ? params.get('element') : DEFAULT_ID;
selectElement(initialId, { animate: false });
togglePause(params.get('paused') === '1');
toggleRotate(params.get('orbit') === '1');
