import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { createFire } from "./elements/fire.js";
import { createWater } from "./elements/water.js";
import { createEarth } from "./elements/earth.js";
import { createAir } from "./elements/air.js";

const OVERVIEW = {
  name: "All four",
  copy: "Fire, water, earth, and air, each alive in the same dark chamber.",
  accent: "#f3efe6",
};

const RADIUS = 8.4;
const canvas = document.querySelector("#scene");
const nameEl = document.querySelector("#name");
const copyEl = document.querySelector("#copy");
const hintEl = document.querySelector("#hint");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x07060b, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(21, 13, 21);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.72;
pmrem.dispose();

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(90, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        float h = normalize(vPos).y;
        vec3 col = mix(vec3(0.015, 0.012, 0.016), vec3(0.045, 0.04, 0.055), smoothstep(-0.35, 0.25, h));
        col = mix(col, vec3(0.09, 0.1, 0.14), smoothstep(0.15, 0.9, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  }),
);
sky.frustumCulled = false;
scene.add(sky);

scene.add(new THREE.HemisphereLight(0xb7c6da, 0x3a2418, 0.32));
const key = new THREE.DirectionalLight(0xfff3e2, 1.55);
key.position.set(8, 14, 6);
scene.add(key);
const fill = new THREE.DirectionalLight(0x8eb6d8, 0.45);
fill.position.set(-10, 5, -6);
scene.add(fill);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(26, 80),
  new THREE.MeshStandardMaterial({
    color: 0x08090d,
    metalness: 0.42,
    roughness: 0.68,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

const ringMat = new THREE.MeshBasicMaterial({
  color: 0xd9c7a2,
  transparent: true,
  opacity: 0.28,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
for (const radius of [5.6, 12.4]) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.018, 140), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);
}

const makers = [
  { create: createFire, angle: 0 },
  { create: createWater, angle: Math.PI / 2 },
  { create: createEarth, angle: Math.PI },
  { create: createAir, angle: -Math.PI / 2 },
];

const elements = makers.map(({ create, angle }) => {
  const element = create();
  element.group.position.set(Math.cos(angle) * RADIUS, 0, Math.sin(angle) * RADIUS);
  element.hit.userData.id = element.id;
  const labelDiv = document.createElement("div");
  labelDiv.className = "el-label";
  labelDiv.textContent = element.name;
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, element.labelHeight, 0);
  element.group.add(label);
  element.label = label;
  scene.add(element.group);
  return element;
});

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "fixed";
labelRenderer.domElement.style.inset = "0";
labelRenderer.domElement.style.pointerEvents = "none";
labelRenderer.domElement.style.zIndex = "1";
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 4.2;
controls.maxDistance = 30;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 1.35, 0);
controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
controls.autoRotateSpeed = 0.32;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.34, 0.5, 0.94);
composer.addPass(bloom);
composer.addPass(new SMAAPass());
composer.addPass(new OutputPass());

const lerp = {
  active: true,
  cam: new THREE.Vector3(17.8, 11.2, 17.8),
  target: new THREE.Vector3(0, 1.35, 0),
};
let mode = "overview";
let resumeAt = 0;

function poseFor(id) {
  if (id === "overview") {
    return {
      cam: new THREE.Vector3(17.8, 11.2, 17.8),
      target: new THREE.Vector3(0, 1.35, 0),
    };
  }
  const element = elements.find((entry) => entry.id === id);
  const center = element.group.position.clone();
  const outward = center.clone().setY(0).normalize();
  return {
    cam: center.clone().add(new THREE.Vector3(outward.x * 7.4, 3.15, outward.z * 7.4)),
    target: center.clone().add(new THREE.Vector3(0, 1.75, 0)),
  };
}

function show(id) {
  mode = id;
  const current = elements.find((entry) => entry.id === id);
  nameEl.textContent = current ? current.name : OVERVIEW.name;
  copyEl.textContent = current ? current.copy : OVERVIEW.copy;
  nameEl.style.color = current ? current.accent : OVERVIEW.accent;
  for (const element of elements) {
    const selected = id === element.id;
    element.accentMaterial.emissiveIntensity = selected ? 0.95 : 0.32;
    element.label.element.style.opacity = id === "overview" || selected ? "1" : "0.18";
  }
  document.querySelectorAll("#nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.id === id);
  });
  const pose = poseFor(id);
  lerp.cam.copy(pose.cam);
  lerp.target.copy(pose.target);
  lerp.active = true;
  controls.autoRotate = false;
}

document.querySelectorAll("#nav button").forEach((button) => {
  button.addEventListener("click", () => show(button.dataset.id));
});

window.addEventListener("keydown", (event) => {
  const keys = {
    Digit0: "overview",
    Digit1: "fire",
    Digit2: "water",
    Digit3: "earth",
    Digit4: "air",
    Escape: "overview",
  };
  const id = keys[event.code];
  if (id) show(id);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

renderer.domElement.addEventListener("pointerdown", (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
  hintEl.classList.add("hide");
});

renderer.domElement.addEventListener("pointerup", (event) => {
  if (!pointerDown) return;
  const dx = event.clientX - pointerDown.x;
  const dy = event.clientY - pointerDown.y;
  pointerDown = null;
  if (dx * dx + dy * dy > 25) return;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(elements.map((element) => element.hit));
  if (hits.length) show(hits[0].object.userData.id);
});

controls.addEventListener("start", () => {
  lerp.active = false;
  controls.autoRotate = false;
  resumeAt = performance.now() + 7000;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let elapsed = 0;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  if (lerp.active) {
    const k = 1 - Math.exp(-5.5 * dt);
    camera.position.lerp(lerp.cam, k);
    controls.target.lerp(lerp.target, k);
    if (camera.position.distanceTo(lerp.cam) < 0.06) lerp.active = false;
  }

  if (mode === "overview" && !lerp.active && performance.now() > resumeAt) {
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  controls.update();
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  for (const element of elements) element.update(elapsed, camera);
  composer.render();
  labelRenderer.render(scene, camera);
  requestAnimationFrame(tick);
}

show("overview");
requestAnimationFrame(tick);
