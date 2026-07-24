import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { FXAAPass } from "three/addons/postprocessing/FXAAPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { createAir } from "./elements/air.js";
import { createEarth } from "./elements/earth.js";
import { createFire } from "./elements/fire.js";
import { createWater } from "./elements/water.js";
import { createWorld } from "./world.js";

const RING_RADIUS = 7.4;
const FLOOR_Y = -3.1;

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false, // the composer's FXAA pass handles this
  powerPreference: "high-performance",
  stencil: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// The volumetric fire dominates GPU time — it is a per-pixel raymarch, so its
// cost scales directly with this. 1.5 still resolves the flame's fine detail on
// a retina panel while costing ~25% fewer pixels than 1.75.
const maxDpr = 1.5;
let pixelRatio = Math.min(window.devicePixelRatio, maxDpr);
renderer.setPixelRatio(pixelRatio);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  46,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);
camera.position.set(0, 5.2, 19);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 3;
controls.maxDistance = 46;
controls.maxPolarAngle = Math.PI * 0.505;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.32;
controls.target.set(0, 0.4, 0);

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------

// Fire's radius is its bounding volume, not its silhouette — the flame only
// fills the middle ~70% of it — so it needs a larger number than the others to
// carry comparable weight in the ring.
const fire = createFire({ radius: 2.35 });
const water = createWater({ radius: 1.5 });
const earth = createEarth({ radius: 1.6 });
const air = createAir({ radius: 1.85 });

const elements = [fire, water, earth, air];

elements.forEach((el, i) => {
  const a = (i / elements.length) * Math.PI * 2 + Math.PI / 4;
  el.group.position.set(
    Math.cos(a) * RING_RADIUS,
    0.35,
    Math.sin(a) * RING_RADIUS
  );
  scene.add(el.group);
});

// Water's warm rim highlight should come from where the fire actually is.
water.setFireDirection(fire.group.position.clone().sub(water.group.position));

const world = createWorld({
  elements,
  ringRadius: RING_RADIUS,
  floorY: FLOOR_Y,
});
scene.add(world.group);

// There are deliberately no THREE.Light objects in this scene. Every surface is
// a custom ShaderMaterial doing its own analytic lighting from uKeyDir/uFillDir
// uniforms, so real lights would be pure overhead that shades nothing.

// ---------------------------------------------------------------------------
// Post-processing
// ---------------------------------------------------------------------------

const composer = new EffectComposer(renderer);
composer.setPixelRatio(pixelRatio);
composer.setSize(window.innerWidth, window.innerHeight);

composer.addPass(new RenderPass(scene, camera));

// Threshold sits above 1.0 on purpose: only genuinely hot things — the flame
// core, the lava, the specular glints — get to bloom. A low threshold pulls the
// whole frame into a haze.
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.62, // strength
  0.5, // radius
  0.85 // threshold
);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.addPass(new FXAAPass());

// ---------------------------------------------------------------------------
// Camera focus
// ---------------------------------------------------------------------------

const desired = {
  pos: camera.position.clone(),
  target: controls.target.clone(),
};
let flying = false;
let focus = "all";
const flightScratch = new THREE.Vector3();

const overview = {
  pos: new THREE.Vector3(0, 5.2, 19),
  target: new THREE.Vector3(0, 0.4, 0),
};

function focusOn(name) {
  focus = name;
  world.setEmphasis(name);

  for (const btn of document.querySelectorAll(".elem-btn")) {
    btn.classList.toggle("active", btn.dataset.target === name);
  }
  document.getElementById("r-focus").textContent = name;

  if (name === "all") {
    desired.pos.copy(overview.pos);
    desired.target.copy(overview.target);
    controls.autoRotate = true;
  } else {
    const el = elements.find((e) => e.name === name);
    const p = el.group.position;

    // Stand off along the outward radius, lifted slightly and swung round a
    // little so the element isn't dead centre against the ring.
    const outward = new THREE.Vector3(p.x, 0, p.z).normalize();
    outward.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.42);

    desired.pos
      .copy(p)
      .addScaledVector(outward, el.radius * 3.5)
      .add(new THREE.Vector3(0, 1.35, 0));
    desired.target.copy(p);
    controls.autoRotate = false;
  }

  flying = true;
  controls.enabled = false;
}

for (const btn of document.querySelectorAll(".elem-btn")) {
  btn.addEventListener("click", () => focusOn(btn.dataset.target));
}

// ---------------------------------------------------------------------------
// Picking — analytic ray/sphere, no proxy meshes needed
// ---------------------------------------------------------------------------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const worldPos = new THREE.Vector3();
let downAt = null;

canvas.addEventListener("pointerdown", (e) => {
  downAt = { x: e.clientX, y: e.clientY };
  // Touching the canvas hands control straight back, so a drag mid-flight
  // responds immediately instead of fighting the tween.
  flying = false;
  controls.enabled = true;
});

canvas.addEventListener("pointerup", (e) => {
  // Ignore the pointerup that ends an orbit drag.
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) {
    return;
  }

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  let best = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const el of elements) {
    el.group.getWorldPosition(worldPos);
    const perp = raycaster.ray.distanceSqToPoint(worldPos);
    if (perp > el.hitRadius * el.hitRadius) {
      continue;
    }
    const along = worldPos.distanceTo(camera.position);
    if (along < bestDist) {
      bestDist = along;
      best = el;
    }
  }

  if (best) {
    focusOn(best.name === focus ? "all" : best.name);
  }
});

// Any manual orbit input cancels an in-flight camera move.
canvas.addEventListener(
  "wheel",
  () => {
    flying = false;
    controls.enabled = true;
  },
  { passive: true }
);

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  pixelRatio = Math.min(window.devicePixelRatio, maxDpr);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(w, h);
  // setSize propagates to every pass, bloom included.
  composer.setPixelRatio(pixelRatio);
  composer.setSize(w, h);

  for (const el of elements) {
    el.setPixelRatio?.(pixelRatio);
  }
  world.setPixelRatio(pixelRatio);
}
window.addEventListener("resize", onResize);

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

let elapsed = 0;
let lastTime = performance.now();

const fpsEl = document.getElementById("r-fps");
let fpsAccum = 0;
let fpsFrames = 0;

const totalParticles =
  elements.reduce((n, e) => n + (e.particleCount || 0), 0) + world.starCount;
document.getElementById("r-parts").textContent =
  totalParticles.toLocaleString();

function tick() {
  requestAnimationFrame(tick);

  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  elapsed += dt;

  if (flying) {
    // Critically-damped-ish approach; hand control back once it's close.
    const k = 1 - 0.0016 ** dt;
    camera.position.lerp(desired.pos, k);
    controls.target.lerp(desired.target, k);

    // A straight line between two points can pass closer to a third than
    // either endpoint — flying from the overview to an element's standoff
    // position dives through the element on the way. Holding the interpolated
    // position out at the final radius turns that dive into an arc.
    const standoff = desired.pos.distanceTo(desired.target);
    flightScratch.copy(camera.position).sub(desired.target);
    if (flightScratch.length() < standoff) {
      camera.position
        .copy(desired.target)
        .add(flightScratch.setLength(standoff));
    }

    // Both have to arrive: the eye can be in position while the look-at point
    // still trails, which leaves the subject visibly off-centre.
    if (
      camera.position.distanceTo(desired.pos) < 0.06 &&
      controls.target.distanceTo(desired.target) < 0.06
    ) {
      // Land exactly on the intended framing rather than wherever the
      // asymptotic lerp happened to stop.
      camera.position.copy(desired.pos);
      controls.target.copy(desired.target);
      flying = false;
      controls.enabled = true;
    }
  }

  for (const el of elements) {
    el.update(elapsed, dt, camera);
  }
  world.update(elapsed);

  controls.update();

  // Water samples the scene around it; do this before the main pass.
  water.updateEnvironment(renderer, scene);

  composer.render();

  fpsAccum += dt;
  fpsFrames++;
  if (fpsAccum >= 0.25) {
    fpsEl.textContent = Math.round(fpsFrames / fpsAccum);
    fpsAccum = 0;
    fpsFrames = 0;
  }
}

// Warm the shaders up on a first frame before revealing the scene, so the
// reveal isn't a stutter.
water.updateEnvironment(renderer, scene);
for (const el of elements) {
  el.update(0, 0, camera);
}
world.update(0);
composer.render();

// Reveal on the next frame so the warm-up frame is on screen first — but never
// leave the overlay up if that frame is slow to arrive (a backgrounded or
// throttled tab can defer rAF indefinitely).
const loader = document.getElementById("loader");
const reveal = () => loader.classList.add("done");
requestAnimationFrame(reveal);
setTimeout(reveal, 1200);

tick();

// Handy from the console when tuning.
window.__scene = {
  scene,
  camera,
  renderer,
  composer,
  bloom,
  elements,
  world,
  focusOn,

  /** Render one frame at an arbitrary time — useful for inspecting motion. */
  renderAt(t) {
    elapsed = t;
    for (const el of elements) {
      el.update(t, 1 / 60, camera);
    }
    world.update(t);
    water.updateEnvironment(renderer, scene);
    composer.render();
  },
};
