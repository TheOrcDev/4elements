import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { createAir } from "./elements/air.js";
import { createEarth } from "./elements/earth.js";
import { createFire } from "./elements/fire.js";
import { createWater } from "./elements/water.js";

// ---------- renderer / scene / camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById("app").appendChild(renderer.domElement);

const FOG_DENSITY = 0.03; // hides the neighbouring worlds (80 units apart)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a_03_02);
scene.fog = new THREE.FogExp2(0x0a_03_02, FOG_DENSITY);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  300
);

// one dim global light; each world adds its own distance-limited point lights
scene.add(new THREE.HemisphereLight(0x8f_a3_c7, 0x17_13_10, 0.5));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4;
controls.maxDistance = 45;

// ---------- the four worlds, laid out in a line ----------
const elements = [
  createFire(0),
  createWater(80),
  createEarth(160),
  createAir(240),
];
for (const el of elements) {
  scene.add(el.group);
}

// ---------- post processing ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8, // strength
  0.5, // radius
  0.35 // threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ---------- selection & camera transitions ----------
let current = 0;
let camGoal = null;
const bgGoal = new THREE.Color(elements[0].background);
const buttons = [...document.querySelectorAll(".nav button")];

function selectElement(index, instant = false) {
  current = (index + elements.length) % elements.length;
  const el = elements[current];
  bgGoal.set(el.background);
  camGoal = { pos: el.anchor.clone(), target: el.target.clone() };
  if (instant) {
    camera.position.copy(el.anchor);
    controls.target.copy(el.target);
    scene.background.copy(bgGoal);
    scene.fog.color.copy(bgGoal);
    camGoal = null;
  }
  buttons.forEach((b, i) => b.classList.toggle("active", i === current));
}

buttons.forEach((btn, i) =>
  btn.addEventListener("click", () => selectElement(i))
);

window.addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "4") {
    selectElement(Number(e.key) - 1);
  } else if (e.key === "ArrowRight") {
    selectElement(current + 1);
  } else if (e.key === "ArrowLeft") {
    selectElement(current - 1);
  }
});

// grabbing the canvas cancels the flight; controls stay live the whole time
renderer.domElement.addEventListener("pointerdown", () => {
  camGoal = null;
});
renderer.domElement.addEventListener(
  "wheel",
  () => {
    camGoal = null;
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- main loop ----------
const clock = new THREE.Clock();
const startIndex =
  { fire: 0, water: 1, earth: 2, air: 3 }[
    new URLSearchParams(location.search).get("el")
  ] ?? 0;
selectElement(startIndex, true);

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  // smooth exponential camera flight toward the active world
  if (camGoal) {
    const k = 1 - Math.exp(-2.6 * delta);
    camera.position.lerp(camGoal.pos, k);
    controls.target.lerp(camGoal.target, k);
    if (camera.position.distanceToSquared(camGoal.pos) < 0.0004) {
      camGoal = null;
    }
  }

  // background / fog colour easing
  const bk = 1 - Math.exp(-2.2 * delta);
  scene.background.lerp(bgGoal, bk);
  scene.fog.color.lerp(bgGoal, bk);

  for (const el of elements) {
    el.update(elapsed, delta);
  }

  controls.update();
  composer.render();
}
animate();
