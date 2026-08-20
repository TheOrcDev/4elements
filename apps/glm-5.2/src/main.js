import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Fire } from "./elements/Fire.js";
import { Water } from "./elements/Water.js";
import { Earth } from "./elements/Earth.js";
import { Air } from "./elements/Air.js";

const canvas = document.getElementById("scene");
const loadingEl = document.getElementById("loading");

// ---- Renderer --------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---- Scene & camera -------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.FogExp2(0x05060a, 0.018);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 14, 32);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 6;
controls.maxDistance = 70;
controls.maxPolarAngle = Math.PI * 0.52;
controls.target.set(0, 2.5, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

// ---- Lighting --------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0x6a7fb0, 0x0a0a0f, 0.6);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xbfd0ff, 0.7);
key.position.set(10, 20, 8);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffd9a8, 0.35);
rim.position.set(-12, 10, -10);
scene.add(rim);

// ---- Ground ----------------------------------------------------------------
const groundGeo = new THREE.CircleGeometry(60, 96);
groundGeo.rotateX(-Math.PI / 2);
const groundMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec3 vPos;
    void main(){
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vPos;
    uniform float uTime;
    void main(){
      float r = length(vPos.xz);
      float sheen = smoothstep(40.0, 4.0, r);
      vec3 base = vec3(0.02, 0.025, 0.04);
      vec3 glow = vec3(0.06, 0.07, 0.12);
      vec3 col = mix(base, glow, sheen);
      float rings = sin(r * 1.2 - uTime * 0.4) * 0.5 + 0.5;
      col += rings * 0.01 * sheen;
      float edge = smoothstep(60.0, 50.0, r);
      gl_FragColor = vec4(col, edge);
    }
  `,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
scene.add(ground);

// ---- Central altar ---------------------------------------------------------
const altar = new THREE.Group();
const altarRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.6, 0.12, 16, 96),
  new THREE.MeshStandardMaterial({
    color: 0x20242e,
    emissive: 0x3a4a6a,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0.6,
  })
);
altarRing.rotation.x = Math.PI / 2;
altarRing.position.y = 0.1;
altar.add(altarRing);

const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.9, 4),
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPos;
      void main(){
        vNormal = normal;
        vPos = position;
        float n = sin(position.x * 4.0 + uTime * 2.0) * 0.05
                + cos(position.y * 4.0 + uTime * 1.7) * 0.05;
        vec3 pos = position + normal * n;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPos;
      void main(){
        float t = uTime * 0.4;
        vec3 fire  = vec3(1.0, 0.45, 0.15);
        vec3 water = vec3(0.29, 0.66, 1.0);
        vec3 earth = vec3(0.61, 0.76, 0.42);
        vec3 air   = vec3(0.81, 0.90, 1.0);
        float a = sin(vPos.y * 2.0 + t) * 0.5 + 0.5;
        vec3 col = mix(fire, water, a);
        col = mix(col, earth, sin(vPos.x * 2.0 + t * 1.3) * 0.5 + 0.5);
        col = mix(col, air, sin(vPos.z * 2.0 + t * 0.7) * 0.5 + 0.5);
        float fres = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0,0.0,1.0))), 2.0);
        gl_FragColor = vec4(col * (1.2 + fres), 0.9);
      }
    `,
  })
);
core.position.y = 1.6;
altar.add(core);

const halo = new THREE.Mesh(
  new THREE.CircleGeometry(2.4, 64),
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      void main(){
        float d = length(vUv - 0.5) * 2.0;
        float g = smoothstep(1.0, 0.0, d);
        g = pow(g, 2.0);
        float p = 0.7 + 0.3 * sin(uTime * 2.0);
        gl_FragColor = vec4(vec3(0.5, 0.6, 0.9) * g * p, g * 0.6);
      }
    `,
  })
);
halo.rotation.x = -Math.PI / 2;
halo.position.y = 0.12;
altar.add(halo);

const altarLight = new THREE.PointLight(0x88aaff, 3, 16, 2.0);
altarLight.position.y = 1.6;
altar.add(altarLight);
scene.add(altar);

// ---- The four elements -----------------------------------------------------
const fire = new Fire();
const water = new Water();
const earth = new Earth();
const air = new Air();
const elements = { fire, water, earth, air };
for (const el of Object.values(elements)) scene.add(el.group);

// ---- Post-processing (bloom) ----------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.95,
  0.7,
  0.2
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---- Focus / camera transitions -------------------------------------------
const FOCUS_VIEWS = {
  fire: { cam: new THREE.Vector3(23, 5, 0), target: fire.focus },
  water: { cam: new THREE.Vector3(0, 5, 23), target: water.focus },
  earth: { cam: new THREE.Vector3(-23, 5, 0), target: earth.focus },
  air: { cam: new THREE.Vector3(0, 5, -23), target: air.focus },
  all: {
    cam: new THREE.Vector3(0, 14, 32),
    target: new THREE.Vector3(0, 2.5, 0),
  },
};

let goalCam = FOCUS_VIEWS.all.cam.clone();
let goalTarget = FOCUS_VIEWS.all.target.clone();
let transitioning = false;

function focusOn(name) {
  const view = FOCUS_VIEWS[name];
  if (!view) return;
  goalCam = view.cam.clone();
  goalTarget = view.target.clone();
  transitioning = true;
  controls.autoRotate = name === "all";

  document.querySelectorAll("#elements-nav button").forEach((b) => {
    const isActive = b.dataset.element === name;
    b.classList.toggle("active", isActive);
    if (isActive) {
      const glyph = b.querySelector(".glyph");
      if (glyph) b.style.setProperty("--glow", glyph.style.getPropertyValue("--c"));
    }
  });
}

document.querySelectorAll("#elements-nav button").forEach((btn) => {
  btn.addEventListener("click", () => focusOn(btn.dataset.element));
});

window.addEventListener("keydown", (e) => {
  const map = { "1": "fire", "2": "water", "3": "earth", "4": "air", "5": "all" };
  if (map[e.key]) focusOn(map[e.key]);
});

controls.addEventListener("start", () => {
  controls.autoRotate = false;
});

// ---- Resize ----------------------------------------------------------------
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
}
window.addEventListener("resize", onResize);

// ---- Animation loop -------------------------------------------------------
const clock = new THREE.Clock();
let simTime = 0;

function step(dt) {
  simTime += dt;

  fire.update(simTime);
  water.update(simTime);
  earth.update(simTime);
  air.update(simTime);

  ground.material.uniforms.uTime.value = simTime;
  core.material.uniforms.uTime.value = simTime;
  halo.material.uniforms.uTime.value = simTime;
  altarRing.rotation.z = simTime * 0.2;
  core.rotation.y = simTime * 0.3;
  altarLight.intensity = 2.5 + Math.sin(simTime * 2.0) * 0.6;

  if (transitioning) {
    camera.position.lerp(goalCam, 0.04);
    controls.target.lerp(goalTarget, 0.04);
    if (camera.position.distanceTo(goalCam) < 0.05) {
      transitioning = false;
    }
  }

  controls.update();
  composer.render();
}

function animate() {
  requestAnimationFrame(animate);
  step(clock.getDelta());
}

requestAnimationFrame(() => {
  loadingEl.classList.add("hidden");
  setTimeout(() => loadingEl.remove(), 900);
  animate();
});
