import * as THREE from 'three';
import './style.css';

import { ELEMENT_LIST, MOON_DIR } from './config.js';
import { createNoiseTexture, createNoiseTexture3D } from './utils/noiseTexture.js';
import { createSoftSprite, createFeatherTexture } from './utils/canvasTextures.js';
import { damp } from './utils/rng.js';
import { bakeSky, createSkyDome, HORIZON } from './world/sky.js';
import { createArena } from './world/arena.js';
import { createFire } from './elements/fire.js';
import { createWater } from './elements/water.js';
import { createAir } from './elements/air.js';
import { createEarth } from './elements/earth.js';
import { CameraRig } from './rig.js';
import { createPost } from './post.js';
import { createUI } from './ui.js';

const FACTORIES = {
  fire: createFire,
  water: createWater,
  air: createAir,
  earth: createEarth,
};

async function init() {
  const t0 = performance.now();
  const marks = [];
  const mark = (label) => marks.push(`${label} ${Math.round(performance.now() - t0)}ms`);
  const canvas = document.getElementById('scene');
  const loaderText = document.getElementById('loader-text');

  // ------------------------------------------------------------------ renderer
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  } catch (err) {
    loaderText.textContent = 'WebGL is not available in this browser.';
    throw err;
  }
  // Dynamic resolution: start at a comfortable level, climb toward native if there is headroom,
  // and back off (remembering levels that didn't hold) if the GPU struggles.
  const maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const LEVELS = [0.85, 1, 1.25, 1.5, 1.75, 2].filter((l) => l <= maxPixelRatio + 1e-3);
  if (LEVELS[LEVELS.length - 1] < maxPixelRatio - 1e-3) LEVELS.push(maxPixelRatio);
  let level = Math.max(0, LEVELS.findLastIndex((l) => l <= 1.5));
  let pixelRatio = LEVELS[level];
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.transmissionResolutionScale = 0.5;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 900);

  // ------------------------------------------------------------- shared inputs
  const time = { value: 0 };
  const pointScale = { value: 1 };
  const noise = createNoiseTexture();
  mark('noise2d');
  const noise3 = createNoiseTexture3D(64);
  mark('noise3d');
  const softSprite = createSoftSprite();
  const feather = createFeatherTexture();
  const skyTex = bakeSky(renderer, MOON_DIR);
  mark('sky');

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.background = skyTex;
  scene.environment = pmrem.fromEquirectangular(skyTex).texture;
  scene.environmentIntensity = 0.9;
  scene.fog = new THREE.FogExp2(HORIZON, 0.0075);
  pmrem.dispose();

  const ctx = { renderer, camera, scene, time, pointScale, noise, noise3, softSprite, feather, sky: skyTex, moonDir: MOON_DIR };

  const skyDome = createSkyDome(MOON_DIR, time);
  scene.add(skyDome.group);

  const arena = createArena(ctx);
  scene.add(arena.group);
  mark('arena');

  // ------------------------------------------------------------------ elements
  const elements = [];
  for (const def of ELEMENT_LIST) {
    const factory = FACTORIES[def.id];
    if (!factory) continue;
    const el = factory(ctx);
    el.group.position.copy(def.position);
    // face the centre of the plaza so each shrine's "front" points inward
    el.group.rotation.y = Math.atan2(-def.position.x, -def.position.z);
    scene.add(el.group);
    el.def = def;
    // let elements know their world placement (for shaders that need it)
    el.worldPosition = def.position.clone();
    elements.push(el);
    mark(def.id);
  }
  // views need `position` and `focus` + `radius`
  const viewDefs = elements.map((e) => ({ id: e.id, position: e.def.position, focus: e.focus, radius: e.radius, viewDistance: e.viewDistance }));

  // -------------------------------------------------------------- camera + post
  const rig = new CameraRig(camera, canvas, viewDefs);
  const post = createPost(renderer, scene, camera, {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio,
  });
  const ui = createUI({ rig });

  // ---------------------------------------------------------------- resizing
  function updatePointScale() {
    pointScale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    skyDome.starMat.uniforms.uPixelRatio.value = pixelRatio;
  }
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    // Portrait screens: widen the FOV a little and pull the camera back so the arena still fits.
    const portrait = THREE.MathUtils.clamp((1 - camera.aspect) / 0.5, 0, 1);
    camera.fov = THREE.MathUtils.lerp(42, 60, portrait);
    rig.setFit(camera.aspect >= 1.1 ? 1 : 1 + (1.1 / camera.aspect - 1) * 0.42);
    // On wide screens, shift the scene right so it sits clear of the caption panel.
    if (w > 980) camera.setViewOffset(w, h, -w * 0.065, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    post.setPixelRatio(pixelRatio);
    post.setSize(w, h);
    updatePointScale();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------- hover / press-and-hold
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const proxies = elements.map((e) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(e.radius, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.copy(e.def.position).add(e.focus);
    m.userData.id = e.id;
    scene.add(m);
    return m;
  });
  const state = Object.fromEntries(elements.map((e) => [e.id, { p: 0, hold: 0 }]));
  let hovered = null;
  let pressed = null;

  function pick(ev) {
    pointer.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(proxies, false)[0];
    return hit ? hit.object.userData.id : null;
  }
  canvas.addEventListener('pointermove', (ev) => {
    if (ev.buttons === 0 || pressed) {
      hovered = pick(ev);
      canvas.classList.toggle('hover', !!hovered);
    }
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = null;
    canvas.classList.remove('hover');
  });
  canvas.addEventListener('pointerdown', (ev) => {
    pressed = pick(ev);
    if (pressed) state[pressed].hold = 1;
  });
  const release = () => {
    if (pressed) state[pressed].hold = 0.65; // keep the surge alive for a beat after release
    pressed = null;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  canvas.addEventListener('dblclick', (ev) => {
    const id = pick(ev);
    if (id) ui.focus(id);
  });

  // -------------------------------------------------------------- render loop
  // Not connected to the Page Visibility API on purpose: we clamp dt ourselves and accumulate our own clock.
  const timer = new THREE.Timer();
  let elapsed = 0;

  let frames = 0;
  let acc = 0;
  let started = false;
  let warm = 0;
  let headroom = 0;
  const badUntil = {};
  function setLevel(i) {
    level = i;
    pixelRatio = LEVELS[i];
    headroom = 0;
    warm = 2; // let things settle before measuring again
    resize();
  }
  // cheap, always-on stats (read from the console via window.fe.stats)
  const stats = { frames: 0, lastMs: 0, avgMs: 0, fps: 0 };

  /** Advance the simulation by dt seconds (no rendering). */
  function tick(dt) {
    elapsed += dt;
    const t = elapsed;
    time.value = t;

    rig.update(dt);
    arena.update(t, dt, camera);

    for (const e of elements) {
      const s = state[e.id];
      let target = 0;
      if (pressed === e.id) target = 1;
      else if (s.hold > 0) {
        s.hold -= dt;
        target = 1;
      } else if (hovered === e.id) target = 0.38;
      s.p = damp(s.p, target, target > s.p ? 7 : 1.7, dt);
      e.setPower?.(s.p);
      e.update(t, dt, camera);
    }
    ui.update(camera, window.innerWidth, window.innerHeight);
    post.finish.uniforms.uTime.value = t;
    updateHeatShimmer();
  }

  // Project the flame into screen space so the finishing pass can distort the air above it.
  const _heat = new THREE.Vector3();
  const fireEl = elements.find((e) => e.id === 'fire');
  function updateHeatShimmer() {
    const u = post.finish.uniforms;
    u.uAspect.value = camera.aspect;
    if (!fireEl) return;
    fireEl.group.getWorldPosition(_heat);
    const dist = camera.position.distanceTo(_heat);
    _heat.y += 4.2;
    const pw = state.fire ? state.fire.p : 0;
    _heat.project(camera);
    const visibleH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const radius = (5.2 * (1 + 0.3 * pw)) / visibleH;
    const on = _heat.z < 1 ? 1 : 0;
    const strength = on * THREE.MathUtils.clamp(1.25 - dist / 45, 0, 1) * (0.75 + 0.6 * pw);
    u.uHeat.value.set(_heat.x * 0.5 + 0.5, _heat.y * 0.5 + 0.5, radius, strength);
  }

  function frame(ms) {
    if (stats.lastMs) {
      const d = ms - stats.lastMs;
      stats.avgMs += (d - stats.avgMs) * 0.05;
      stats.fps = 1000 / Math.max(stats.avgMs, 0.001);
    }
    stats.lastMs = ms;
    stats.frames++;
    timer.update(ms);
    const dt = Math.min(timer.getDelta(), 0.05);

    tick(dt);
    post.render(dt);

    // dynamic resolution
    if (started) {
      warm += dt;
      if (warm > 3 && dt < 0.1) {
        acc += dt;
        frames++;
        if (acc > 2) {
          const ms = (acc / frames) * 1000;
          acc = 0;
          frames = 0;
          const now = performance.now();
          if (ms > 23 && level > 0) {
            badUntil[level] = now + 45000; // this level didn't hold; don't retry for a while
            setLevel(level - 1);
          } else if (ms < 16.5 && level < LEVELS.length - 1 && now > (badUntil[level + 1] || 0)) {
            if (++headroom >= 2) setLevel(level + 1);
          } else headroom = 0;
        }
      }
    }

    if (!started) {
      mark('first frame');
      console.info('[four-elements] ' + marks.join(' · '));
      started = true;
      document.getElementById('loader').classList.add('done');
      document.body.classList.add('ready');
    }
  }

  // Optional readout: append ?fps to the URL
  if (new URLSearchParams(location.search).has('fps')) {
    const el = document.createElement('div');
    el.id = 'fps';
    document.body.appendChild(el);
    window.setInterval(() => {
      el.textContent = `${stats.fps.toFixed(0)} fps · ${pixelRatio.toFixed(2)}x · msaa ${post.samples}`;
    }, 500);
  }

  // Compile shaders off-thread where supported before showing anything.
  loaderText.textContent = 'Kindling the elements…';
  try {
    await renderer.compileAsync(scene, camera);
  } catch (e) {
    console.warn('compileAsync failed, falling back to lazy compile', e);
  }
  renderer.setAnimationLoop(frame);

  // Handy for debugging / screenshots: window.fe.rig.flyTo('fire', 0.01)
  window.fe = {
    THREE, renderer, scene, camera, rig, ui, post, elements, arena, state, stats,
    /** Fast-forward the simulation (used for screenshots when rAF is throttled). */
    advance(seconds = 1, step = 1 / 30) {
      for (let t = 0; t < seconds; t += step) tick(step);
    },
  };
}

init().catch((err) => {
  console.error(err);
  const t = document.getElementById('loader-text');
  if (t) t.textContent = 'Something went wrong — see the console.';
});
