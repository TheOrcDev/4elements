import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { createAir } from "./elements/air.js";
import { createEarth } from "./elements/earth.js";
import { createFire } from "./elements/fire.js";
import { createWater } from "./elements/water.js";

const DESCRIPTIONS = {
  fire: "Roaring flame — heat, light, and chaos",
  air: "Swirling winds — breath, freedom, and sky",
  water: "Living tides — depth, flow, and reflection",
  earth: "Living stone — root, crystal, and growth",
  all: "The four classical elements in balance",
};

const FOCUS = {
  fire: new THREE.Vector3(-5.5, 1.2, -5.5),
  air: new THREE.Vector3(5.5, 1.2, -5.5),
  water: new THREE.Vector3(-5.5, 1.0, 5.5),
  earth: new THREE.Vector3(5.5, 1.2, 5.5),
  all: new THREE.Vector3(0, 1.5, 0),
};

const CAMERA_OFFSET = {
  fire: new THREE.Vector3(0, 2.5, 7),
  air: new THREE.Vector3(0, 2.8, 7.5),
  water: new THREE.Vector3(0, 3.2, 7.5),
  earth: new THREE.Vector3(0, 2.8, 7.5),
  all: new THREE.Vector3(12, 10, 12),
};

// --- Renderer ---
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05_05_08);
scene.fog = new THREE.FogExp2(0x05_05_08, 0.018);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(12, 10, 12);

// --- Controls ---
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3;
controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.copy(FOCUS.all);

// --- Lights ---
const ambient = new THREE.AmbientLight(0x33_44_55, 0.35);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0x88_99_bb, 0x22_18_10, 0.45);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xff_e8_d0, 0.6);
keyLight.position.set(5, 12, 8);
scene.add(keyLight);

// Soft fill
const fill = new THREE.DirectionalLight(0x66_88_aa, 0.25);
fill.position.set(-8, 4, -5);
scene.add(fill);

// --- Starfield / dust background ---
function createStarfield() {
  const count = 2500;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const r = 40 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i * 3 + 2] = r * Math.cos(phi);

    const warm = Math.random();
    colors[i * 3] = 0.7 + warm * 0.3;
    colors[i * 3 + 1] = 0.75 + warm * 0.2;
    colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}
scene.add(createStarfield());

// --- Ground platform ---
const groundGeo = new THREE.CircleGeometry(22, 64);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x0a_0a_10,
  roughness: 0.95,
  metalness: 0.05,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);

// Subtle grid ring markers under each element
function addPedestal(pos, color) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 2.05, 64),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(pos.x, 0.01, pos.z);
  scene.add(ring);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0c_0c_12,
      roughness: 0.9,
      metalness: 0.15,
    })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(pos.x, 0.005, pos.z);
  scene.add(disc);
}

addPedestal(FOCUS.fire, 0xff_55_22);
addPedestal(FOCUS.air, 0x88_bb_ff);
addPedestal(FOCUS.water, 0x22_88_ff);
addPedestal(FOCUS.earth, 0x66_aa_44);

// Connecting lines between elements (subtle magic circle)
const circleGeo = new THREE.TorusGeometry(7.8, 0.015, 8, 128);
const circleMat = new THREE.MeshBasicMaterial({
  color: 0x44_55_66,
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
});
const magicCircle = new THREE.Mesh(circleGeo, circleMat);
magicCircle.rotation.x = Math.PI / 2;
magicCircle.position.y = 0.03;
scene.add(magicCircle);

// Connectors between elements
const connectorMat = new THREE.LineBasicMaterial({
  color: 0x55_66_77,
  transparent: true,
  opacity: 0.2,
});
const connectorPts = [
  FOCUS.fire,
  FOCUS.air,
  FOCUS.earth,
  FOCUS.water,
  FOCUS.fire,
];
const connectorGeo = new THREE.BufferGeometry().setFromPoints(
  connectorPts.map((p) => new THREE.Vector3(p.x, 0.04, p.z))
);
scene.add(new THREE.Line(connectorGeo, connectorMat));

// --- Elements ---
const fire = createFire(FOCUS.fire);
const air = createAir(FOCUS.air);
const water = createWater(FOCUS.water);
const earth = createEarth(FOCUS.earth);

scene.add(fire.group, air.group, water.group, earth.group);

const elements = { fire, air, water, earth };

// Floating labels (HTML-free — simple sprites via canvas)
function makeLabel(text, color) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = "600 52px Cinzel, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillText(text, 256, 64);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.8, 0.7, 1);
  return sprite;
}

const labels = {
  fire: makeLabel("FIRE", "#ff8844"),
  air: makeLabel("AIR", "#aaccff"),
  water: makeLabel("WATER", "#66bbff"),
  earth: makeLabel("EARTH", "#88cc55"),
};

labels.fire.position.copy(FOCUS.fire).add(new THREE.Vector3(0, 4.2, 0));
labels.air.position.copy(FOCUS.air).add(new THREE.Vector3(0, 4.2, 0));
labels.water.position.copy(FOCUS.water).add(new THREE.Vector3(0, 3.6, 0));
labels.earth.position.copy(FOCUS.earth).add(new THREE.Vector3(0, 4.0, 0));

Object.values(labels).forEach((l) => scene.add(l));

// --- Post-processing (bloom for fire/glow power) ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55,
  0.4,
  0.85
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// --- Focus / camera animation ---
let currentFocus = "all";
let animatingCamera = false;
const camFrom = new THREE.Vector3();
const camTo = new THREE.Vector3();
const targetFrom = new THREE.Vector3();
const targetTo = new THREE.Vector3();
let camT = 1;

function focusElement(name) {
  currentFocus = name;
  document.getElementById("element-desc").textContent =
    DESCRIPTIONS[name] || DESCRIPTIONS.all;

  document.querySelectorAll("#element-nav button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.element === name);
  });

  // Bloom intensity per element
  const bloomSettings = {
    fire: { strength: 0.85, threshold: 0.7 },
    air: { strength: 0.55, threshold: 0.8 },
    water: { strength: 0.5, threshold: 0.82 },
    earth: { strength: 0.4, threshold: 0.88 },
    all: { strength: 0.55, threshold: 0.85 },
  };
  const b = bloomSettings[name] || bloomSettings.all;
  bloomPass.strength = b.strength;
  bloomPass.threshold = b.threshold;

  camFrom.copy(camera.position);
  targetFrom.copy(controls.target);
  targetTo.copy(FOCUS[name]);
  camTo.copy(FOCUS[name]).add(CAMERA_OFFSET[name]);
  camT = 0;
  animatingCamera = true;
}

// UI buttons
document.querySelectorAll("#element-nav button").forEach((btn) => {
  btn.addEventListener("click", () => focusElement(btn.dataset.element));
});

// Click-to-focus via raycasting pedestals
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickTargets = [];

["fire", "air", "water", "earth"].forEach((name) => {
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 16, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.copy(FOCUS[name]);
  hit.position.y = 1;
  hit.userData.element = name;
  scene.add(hit);
  clickTargets.push(hit);
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickTargets);
  if (hits.length > 0) {
    focusElement(hits[0].object.userData.element);
  }
});

// --- Resize ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  const pr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pr);
  Object.values(elements).forEach((el) => el.onResize?.(pr));
}
window.addEventListener("resize", onResize);

// --- Animate ---
const clock = new THREE.Clock();
let ready = false;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (ready) {
    fire.update(dt);
    air.update(dt);
    water.update(dt);
    earth.update(dt);

    // Gentle label bob
    for (const [name, label] of Object.entries(labels)) {
      const base =
        FOCUS[name].y + (name === "water" ? 3.6 : name === "earth" ? 4.0 : 4.2);
      label.position.y = base + Math.sin(t * 1.2 + label.position.x) * 0.08;
      label.material.opacity = 0.7 + Math.sin(t * 2 + label.position.z) * 0.1;
    }

    magicCircle.rotation.z = t * 0.05;
  }

  if (animatingCamera) {
    camT = Math.min(1, camT + dt * 0.7);
    const e = easeInOutCubic(camT);
    camera.position.lerpVectors(camFrom, camTo, e);
    controls.target.lerpVectors(targetFrom, targetTo, e);
    if (camT >= 1) {
      animatingCamera = false;
    }
  }

  controls.update();
  composer.render();
}

// Boot
function boot() {
  // Initial camera framing
  camera.position.copy(FOCUS.all).add(CAMERA_OFFSET.all);
  controls.target.copy(FOCUS.all);
  controls.update();

  animate();

  // Hide loader after first frames
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ready = true;
      document.getElementById("loading").classList.add("hidden");
      // Start on "all" overview
      focusElement("all");
    });
  });
}

boot();
