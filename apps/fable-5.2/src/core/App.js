import * as THREE from 'three';
import { shared } from './shared.js';
import { LAYERS, setLayer } from './layers.js';
import { createRng } from './materials.js';
import { ELEMENTS } from './layout.js';
import { bakeNoise3D } from './Noise3D.js';
import { Pipeline } from './Pipeline.js';
import { Sky } from './Sky.js';
import { Ground } from './Ground.js';
import { Ripples } from './Ripples.js';
import { CameraRig } from './CameraRig.js';
import { Mist } from './Mist.js';

const elementModules = import.meta.glob('../elements/*/index.js');
const audioModules = import.meta.glob('../audio/Soundscape.js');

// quality: raymarch step scale. mirrorScale / volumeScale: buffer sizes relative to the frame.
// Edges are smoothed in the output pass (fxaa); true multisampling costs several milliseconds
// of memory traffic per frame on its own and is kept for the top tier.
// maxScale: ceiling for the internal render scale.
// extras: what the top tier adds to the one below it for as long as the frame rate holds with
// them. The governor takes them away before it takes a single pixel, so "ultra" never draws
// a coarser picture than "high" does on the same machine.
const QUALITY = {
  low: { quality: 0.55, mirror: true, mirrorScale: 0.35, mirrorQuality: 0.5, volumeScale: 0.5, maxScale: 0.7, msaa: 0, fxaa: true },
  medium: { quality: 0.8, mirror: true, mirrorScale: 0.5, mirrorQuality: 0.55, volumeScale: 0.5, maxScale: 0.85, msaa: 0, fxaa: true },
  high: { quality: 1.0, mirror: true, mirrorScale: 0.5, mirrorQuality: 0.6, volumeScale: 0.5, maxScale: 1.0, msaa: 0, fxaa: true },
  ultra: {
    quality: 1.0, mirror: true, mirrorScale: 0.5, mirrorQuality: 0.6, volumeScale: 0.5, maxScale: 1.0, msaa: 0, fxaa: true,
    extras: { quality: 1.3, mirrorScale: 0.75, mirrorQuality: 0.8, volumeScale: 0.75, msaa: 4, fxaa: false },
  },
};
const TIERS = ['low', 'medium', 'high', 'ultra'];

// The governor (see _govern) reads the frame rate twice a second and moves along one scale
// of "levels": a level up to 1 is the share of the tier's full resolution that is drawn, and
// EXTRAS, above 1, is full resolution with the tier's extras switched on.
const EXTRAS = 1.25;
const GOVERNOR = {
  reading: 0.5,       // seconds of frames behind one frame-rate reading
  warmUp: 3,          // real seconds after the first frame before anything is judged
  target: 60,         // frames per second worth defending; lower on a display that refreshes more slowly
  slow: 0.95,         // a reading below this share of the target has dropped frames (two or more)...
  fast: 0.975,        // ...and one at or above this share has dropped none
  crawl: 1 / 3,       // below this share of the target there is no point in small steps
  floor: 0.5,         // the least share of a tier's full resolution
  down: 0.86,         // a step down when frames are badly late,
  ease: 0.93,         // when a few are,
  trim: 0.96,         // and when the average sags for seconds on end; a step up undoes one trim
  retry: 600,         // seconds before a level that proved too much is tried again in the same view
};

export class App {
  constructor(container, params = new URLSearchParams()) {
    this.container = container;
    this.params = params;
    this.listeners = new Map();
    this.elements = new Map();
    this.meta = ELEMENTS;
    this.time = 0;
    this.frameCount = 0;
    this.paused = false;
    this.held = false;            // automation drives the clock by hand (see hooks): nothing moves by itself
    this.ready = false;
    this.contextLost = false;
    this.focusId = null;
    this.focusWeights = Object.fromEntries(ELEMENTS.map((e) => [e.id, 0]));
    // A parameter that should name an element is ignored, with a word in the console, when it names none.
    const element = (key) => {
      const id = params.get(key);
      if (!id || ELEMENTS.some((e) => e.id === id)) return id || null;
      console.warn(`[elementa] ?${key}=${id}: there is no such element (${ELEMENTS.map((e) => e.id).join(', ')})`);
      return null;
    };
    this.solo = element('solo');
    this.startView = this.solo || element('focus');
    // Phones and small tablets start one tier down; the governor then manages resolution.
    const handheld = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) < 820;
    // A tier the visitor asked for (here, or later from the menu) is theirs: the governor never changes it.
    this.tierChosen = !!QUALITY[params.get('quality')];
    if (params.has('quality') && !this.tierChosen) console.warn(`[elementa] ?quality=${params.get('quality')}: expected ${TIERS.join(', ')}`);
    this.qualityName = this.tierChosen ? params.get('quality') : (handheld ? 'medium' : 'high');
    // ?scale= fixes the internal render scale and switches the governor off.
    const scale = Number.parseFloat(params.get('scale'));
    if (params.has('scale') && !Number.isFinite(scale)) console.warn(`[elementa] ?scale=${params.get('scale')}: expected a number from 0.25 to 1; the scale stays automatic`);
    this.autoScale = !Number.isFinite(scale);
    // With the governor: the share of the tier's full resolution being drawn. Fixed: the share of the backing store.
    this.renderScale = this.autoScale ? 1 : Math.min(1, Math.max(0.25, scale));
    this.extras = !!QUALITY[this.qualityName].extras;
    this.fps = 60;
    this._gov = { time: 0, target: GOVERNOR.target, views: new Map() };
    this._governReset();
    this._last = performance.now();
    this._raf = 0;
    this._fade = 1;
    this.hoverId = null;
    this.tour = { on: false, auto: false, t: 0, index: -1, dwell: 15 };
    this._idle = 0;
    this._chosen = false;         // has the visitor picked a view, or ended a tour, themselves?
    this._contexts = [];          // what each element was handed at start-up
    this._cleanups = [];          // everything dispose() has to undo
    const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.reducedMotion = !!motion && motion.matches;
    if (motion && motion.addEventListener) {
      this._listen(motion, 'change', () => {
        this.reducedMotion = motion.matches;
        for (const ctx of this._contexts) ctx.reducedMotion = motion.matches;
        if (motion.matches && this.rig) this.setAutoOrbit(false);
      });
    }
    this.audio = this._createAudio();
    this._frame = this._frame.bind(this);
    this._resize = this._resize.bind(this);
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.listeners.get(event).delete(fn);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (set) for (const fn of set) fn(payload);
  }

  /** addEventListener that dispose() takes back. */
  _listen(target, type, fn, options) {
    target.addEventListener(type, fn, options);
    this._cleanups.push(() => target.removeEventListener(type, fn, options));
  }

  async init() {
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    this.renderer = renderer;
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.autoClear = false;
    renderer.info.autoReset = false;
    this.container.appendChild(renderer.domElement);
    renderer.domElement.classList.add('scene-canvas');

    const scene = new THREE.Scene();
    this.scene = scene;
    scene.matrixWorldAutoUpdate = false;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.3, 6000);
    this.camera = camera;

    this.emit('progress', { value: 0.1, label: 'Kindling noise' });
    shared.uNoise3D.value = bakeNoise3D(renderer);

    this.sky = new Sky();
    const env = this.sky.bakeEnvironment(renderer);
    shared.uEnvCube.value = env.cube;
    scene.environment = env.pmrem;
    scene.environmentIntensity = 1.0;
    scene.add(this.sky.mesh);

    // Cool moonlight from behind the default camera, warm afterglow from the far horizon.
    const moon = new THREE.DirectionalLight(new THREE.Color(0.55, 0.68, 1.0), 1.55);
    moon.position.copy(shared.uMoonDir.value).multiplyScalar(60);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    const sc = moon.shadow.camera;
    sc.left = -19; sc.right = 19; sc.top = 19; sc.bottom = -19; sc.near = 20; sc.far = 110;
    moon.shadow.bias = -0.0004;
    moon.shadow.normalBias = 0.03;
    moon.shadow.radius = 2.5;
    const glow = new THREE.DirectionalLight(new THREE.Color(1.0, 0.5, 0.24), 1.15);
    glow.position.set(shared.uSunDir.value.x, 0.16, shared.uSunDir.value.z).multiplyScalar(60);
    for (const l of [moon, glow]) { l.layers.enableAll(); scene.add(l); scene.add(l.target); }
    this.lights = { moon, glow };

    this.ripples = new Ripples(renderer);
    this.ground = new Ground(renderer);
    scene.add(this.ground.mesh);

    if (this.params.get('mist') !== '0') {
      this.mist = new Mist();
      scene.add(this.mist.mesh);
    }

    this.pipeline = new Pipeline(renderer, scene, camera);
    this.ground.uniforms.tMirror.value = this.pipeline.mirrorTexture;
    this.rig = new CameraRig(camera, renderer.domElement);
    if (this.params.get('orbit') === '0' || this.reducedMotion) this.rig.autoOrbit = false;
    // A lost GPU context (driver reset, tab eviction) cannot be repaired in place: the frame
    // loop stops, the dead canvas is taken off the page, and the page reloads once it returns.
    this._listen(renderer.domElement, 'webglcontextlost', (ev) => {
      ev.preventDefault();
      cancelAnimationFrame(this._raf);
      this.contextLost = true;
      renderer.domElement.style.visibility = 'hidden';
      this.emit('contextlost', {});
    });
    this._listen(renderer.domElement, 'webglcontextrestored', () => window.location.reload());
    this.setQuality(this.qualityName, { chosen: this.tierChosen });
    if (this.params.get('mirror') === '0') { this.pipeline.settings.mirror = false; this.ground.uniforms.uMirrorOn.value = 0; }

    this._listen(window, 'resize', this._resize);
    if (typeof ResizeObserver !== 'undefined') {
      this._observer = new ResizeObserver(this._resize);
      this._observer.observe(this.container);
    }
    this._resize();
    this._bindPointer();
    // Any deliberate input ends an automatically started tour and restarts the idle clock.
    const wake = () => { this._idle = 0; if (this.tour.on && this.tour.auto) this.setTour(false); };
    for (const type of ['pointerdown', 'wheel', 'keydown', 'touchstart']) this._listen(window, type, wake, { passive: true });
    // So does a pointer that travels. (Browsers also report a "move" when the page changes
    // under a pointer at rest, the tour's own caption for one: those do not count.)
    let lastX = NaN, lastY = NaN;
    this._listen(window, 'pointermove', (ev) => {
      if (ev.clientX === lastX && ev.clientY === lastY) return;
      lastX = ev.clientX; lastY = ev.clientY;
      wake();
    }, { passive: true });

    this.elementsRoot = new THREE.Group();
    this.elementsRoot.name = 'elements';
    scene.add(this.elementsRoot);
    await this._loadElements();
    this.audio.state.elements = ELEMENTS.filter((e) => this.elements.has(e.id)).map((e) => ({ id: e.id, position: e.position }));

    if (this.startView && this.elements.has(this.startView)) { this.focusId = this.startView; this.rig.jump(this.startView); }
    if (this.params.has('cam')) {
      const v = this.params.get('cam').split(',').map(Number);
      if (v.length === 6 && v.every(Number.isFinite)) {
        camera.position.set(v[0], v[1], v[2]);
        this.rig.controls.target.set(v[3], v[4], v[5]);
        this.rig.controls.update();
        this.rig.autoOrbit = false;
        this.rig.userMoved = true;
      } else {
        console.warn('[elementa] ?cam= expects six numbers: px,py,pz,tx,ty,tz');
      }
    }
    this._governReset();

    this.emit('progress', { value: 0.8, label: 'Compiling shaders' });
    camera.layers.enableAll();
    scene.updateMatrixWorld(true);
    renderer.setRenderTarget(this.pipeline.opaqueTarget);
    const compiling = renderer.compileAsync(scene, camera);
    renderer.setRenderTarget(null);
    try { await compiling; } catch (err) { console.error('[elementa] shader compilation failed', err); }

    // ?t= simulates that long before the first frame (a day at most: the page has to come up).
    const t0 = Math.min(Number(this.params.get('t')) || 0, 86400);
    if (t0 > 0) this._advance(t0);

    this.emit('progress', { value: 1, label: 'Ready' });
    // With the interface present the picture fades up from black; automation gets it at once.
    this._fade = this.params.has('noui') || this.params.has('t') ? 1 : 0;
    this.pipeline.settings.fade = this._fade;
    if (this._fade === 0 && !this.focusId && !this.params.has('cam') && !this.reducedMotion) this.rig.intro();
    this.render();
    this.ready = true;
    this.emit('ready', {});
    if (this.audio.available && !this.params.has('noui')) {
      const whenIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2000));
      whenIdle(() => { this.audio.load().catch(() => {}); });
    }
    this._listen(document, 'visibilitychange', () => {
      // Frames that straddle a spell in the background say nothing about this machine.
      this._resync();
      // A hidden tab stops drawing; it should stop sounding too.
      const a = this.audio;
      if (!a.instance || !a.enabled) return;
      try {
        if (document.hidden) a.instance.stop();
        else Promise.resolve(a.instance.start()).catch(() => {});
      } catch (err) { /* the next toggle recovers */ }
    });
    this._resync();
    this._raf = requestAnimationFrame(this._frame);
    return this;
  }

  async _loadElements() {
    let done = 0;
    for (const def of ELEMENTS) {
      const id = def.id;
      if (this.solo && id !== this.solo) continue;
      const loader = elementModules[`../elements/${id}/index.js`];
      if (!loader) { console.warn(`[elementa] no module for element "${id}"`); continue; }
      try {
        const mod = await loader();
        const origin = new THREE.Vector3(...def.position);
        const ctx = {
          renderer: this.renderer,
          scene: this.scene,
          camera: this.camera,
          shared,
          LAYERS,
          setLayer,
          origin,
          layout: ELEMENTS,
          ripples: this.ripples,
          rng: createRng,
          quality: this._qualityLevel(),
          lights: this.lights,
          // The visitor asked the system for less motion: no flicker, no sudden moves. Kept current.
          reducedMotion: this.reducedMotion,
        };
        this._contexts.push(ctx);
        const element = new mod.default(ctx);
        element.group.position.copy(origin);
        element.group.name = id;
        element.group.traverse((o) => { if (o.isLight) o.layers.enableAll(); });
        this.elementsRoot.add(element.group);
        this.elements.set(id, element);
        this.pipeline.registerGroup(element.group, origin);
      } catch (err) {
        console.error(`[elementa] element "${id}" failed to start:`, err && err.stack ? err.stack : err);
      }
      done++;
      this.emit('progress', { value: 0.2 + 0.55 * (done / ELEMENTS.length), label: `Summoning ${def.name || id}` });
    }
  }

  // Sound is optional and lazy: the module loads the first time it is switched on.
  _createAudio() {
    const app = this;
    const state = {
      time: 0, focusId: null, focusWeights: this.focusWeights,
      cameraPosition: new THREE.Vector3(), cameraForward: new THREE.Vector3(0, 0, -1), cameraRight: new THREE.Vector3(1, 0, 0),
      elements: ELEMENTS.map((e) => ({ id: e.id, position: e.position })),
      fireIntensity: 0, flash: 0,
    };
    const audio = {
      enabled: false,
      available: Object.keys(audioModules).length > 0,
      instance: null,
      volume: 0.8,
      state,
      module: null,
      /** Fetch the module (once). Done ahead of time so that switching sound on stays inside the click that asked for it. */
      load() {
        if (!audio.module) {
          const load = audioModules['../audio/Soundscape.js'];
          audio.module = load ? load() : Promise.reject(new Error('no soundscape module'));
          audio.module.catch(() => { audio.module = null; });
        }
        return audio.module;
      },
      async setEnabled(on) {
        on = !!on;
        if (on === audio.enabled) return audio.enabled;
        if (on) {
          try {
            if (!audio.instance) {
              const mod = await audio.load();
              audio.instance = new mod.Soundscape();
            }
            await audio.instance.start();
            if (audio.instance.setVolume) audio.instance.setVolume(audio.volume);
            audio.enabled = true;
          } catch (err) {
            console.warn('[elementa] sound unavailable:', err);
            audio.enabled = false;
          }
        } else {
          try { if (audio.instance) audio.instance.stop(); } catch (err) { /* already silent */ }
          audio.enabled = false;
        }
        app.emit('audio', { enabled: audio.enabled });
        return audio.enabled;
      },
      setVolume(v) {
        audio.volume = Math.min(1, Math.max(0, v));
        if (audio.instance && audio.instance.setVolume) audio.instance.setVolume(audio.volume);
      },
    };
    return audio;
  }

  _updateAudio(dt) {
    const a = this.audio;
    if (!a.enabled || !a.instance) return;
    const s = a.state;
    s.time = this.time;
    s.focusId = this.focusId;
    s.cameraPosition.copy(this.camera.position);
    this.camera.getWorldDirection(s.cameraForward);
    s.cameraRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    s.fireIntensity = shared.uFireLightColor.value.x / 76;      // the pyre's lamp runs at about 76 x its burn level
    s.flash = shared.uFlash.value.w;
    try { a.instance.update(dt, s); } catch (err) {
      if (!a._reported) { a._reported = true; console.warn('[elementa] sound update failed:', err); }
    }
  }

  // Hover and click picking against each element's bounding sphere, and a trail of
  // ripples wherever the pointer crosses the water.
  _bindPointer() {
    const dom = this.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const sphere = new THREE.Sphere();
    const hit = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let downX = 0, downY = 0, downT = 0, lastX = 1e9, lastZ = 1e9;

    const pick = (ev) => {
      const r = dom.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, this.camera);
      let best = null, bestD = Infinity;
      for (const def of ELEMENTS) {
        const el = this.elements.get(def.id);
        if (!el) continue;
        const f = el.focus;
        sphere.center.set(def.position[0], def.position[1], def.position[2]);
        if (f && f.center) sphere.center.add(f.center); else sphere.center.y += 2.5;
        sphere.radius = Math.min(f && f.radius ? f.radius : 3.5, 4.5) * 0.85;
        if (raycaster.ray.intersectSphere(sphere, hit)) {
          const d = hit.distanceToSquared(this.camera.position);
          if (d < bestD) { bestD = d; best = def.id; }
        }
      }
      return best;
    };
    const onFilm = () => raycaster.ray.intersectPlane(plane, hit) && hit.distanceTo(this.camera.position) < 70;

    this._listen(dom, 'pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      const id = pick(ev);
      if (id || id !== this.hoverId) {
        this.hoverId = id;
        this.emit('hover', { id, x: ev.clientX, y: ev.clientY });
      }
      if (!id && onFilm()) {
        const dx = hit.x - lastX, dz = hit.z - lastZ;
        if (dx * dx + dz * dz > 0.16) { lastX = hit.x; lastZ = hit.z; this.ripples.drop(hit.x, hit.z, 0.4, 0.007); }
      }
    });
    this._listen(dom, 'pointerleave', () => {
      if (this.hoverId) { this.hoverId = null; this.emit('hover', { id: null, x: 0, y: 0 }); }
    });
    this._listen(dom, 'pointerdown', (ev) => { downX = ev.clientX; downY = ev.clientY; downT = performance.now(); });
    this._listen(dom, 'pointerup', (ev) => {
      if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 6 || performance.now() - downT > 450) return;
      const id = pick(ev);
      if (id) { if (id !== this.focusId) this.focus(id); }
      else if (onFilm()) this.ripples.drop(hit.x, hit.z, 0.75, 0.035);
    });
  }

  _qualityLevel() { return { low: 0, medium: 1, high: 2, ultra: 2 }[this.qualityName] ?? 2; }

  /**
   * Switch tier. `chosen` says the visitor asked for it: the tier then starts from its full
   * resolution and is never changed behind their back. The governor passes false.
   */
  setQuality(name, { chosen = true } = {}) {
    if (!QUALITY[name]) return;
    this.qualityName = name;
    if (chosen) this.tierChosen = true;
    if (chosen || !this.autoScale) {
      if (this.autoScale) this.renderScale = 1;
      this.extras = !!QUALITY[name].extras;
      this._governReset();
    } else if (!QUALITY[name].extras) {
      this.extras = false;
    }
    this._applyQuality();
    for (const el of this.elements.values()) if (el.setQuality) el.setQuality(this._qualityLevel());
    this._resize();
    this.emit('quality', { name });
  }

  /** Hand the current tier's settings, with or without its extras, to the pipeline. */
  _applyQuality() {
    const tier = QUALITY[this.qualityName];
    const q = this.extras && tier.extras ? { ...tier, ...tier.extras } : tier;
    const s = this.pipeline.settings;
    s.quality = q.quality;
    s.mirrorQuality = q.mirrorQuality;
    this.pipeline.configure({ mirrorScale: q.mirrorScale, volumeScale: q.volumeScale, msaa: q.msaa, fxaa: q.fxaa });
    if (this.params.get('mirror') !== '0') { s.mirror = q.mirror; this.ground.uniforms.uMirrorOn.value = q.mirror ? 1 : 0; }
  }

  /**
   * Focus one element by id, or pass null for the overview. The camera flies there, or cuts
   * when `immediate` is set, which is the default for visitors who asked for reduced motion.
   */
  focus(id, { immediate = this.reducedMotion, fromTour = false } = {}) {
    if (!fromTour && this.tour.on) this.setTour(false);
    this._idle = 0;
    if (!fromTour) this._chosen = true;
    const next = id && this.elements.has(id) ? id : null;
    this.focusId = next;
    let duration = 0;
    if (immediate) this.rig.jump(next || 'overview'); else duration = this.rig.flyTo(next || 'overview');
    this._governView();
    this.emit('focus', { id: next, duration });
  }

  overview(options) { this.focus(null, options); }

  /**
   * The tour visits each element in turn and returns to the overview. It can be switched on
   * by hand, and starts by itself after a long idle spell so an unattended screen shows everything.
   */
  setTour(on, auto = false) {
    on = !!on;
    if (on === this.tour.on) return;
    this.tour.on = on;
    this.tour.auto = on && auto;
    this.tour.t = 0;
    this.tour.index = -1;
    this._idle = 0;
    if (!auto) this._chosen = true;
    if (on) this._tourNext();
    this.emit('tour', { on, auto: this.tour.auto });
  }

  _tourNext() {
    const order = [...ELEMENTS.map((e) => e.id).filter((id) => this.elements.has(id)), null];
    this.tour.index = (this.tour.index + 1) % order.length;
    this.tour.t = 0;
    this.focus(order[this.tour.index], { fromTour: true });
    this.tour.dwell = this.focusId ? 15 : 11;
  }

  /** Move a running tour on by `real` seconds. */
  _updateTour(real) {
    const tour = this.tour;
    if (!tour.on) return;
    tour.t += real;
    if (tour.t > tour.dwell) this._tourNext();
  }

  /**
   * Count the seconds nobody has touched anything, and start the tour when there have been
   * enough: 80 on an untouched screen, about twice that once the visitor has picked a view
   * themselves (they may simply be looking), and never while they hold time paused.
   */
  _updateIdle(real) {
    if (this.tour.on || this.paused || this.reducedMotion || this.params.has('noui') || this.solo) return;
    this._idle += real;
    if (this._idle > (this._chosen ? 170 : 80)) this.setTour(true, true);
  }

  setPaused(paused) { this.paused = !!paused; this.emit('pause', { paused: this.paused }); }

  setAutoOrbit(on) { this.rig.autoOrbit = !!on; this.emit('orbit', { on: this.rig.autoOrbit }); }

  _resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // A tier's full resolution: all of a 1x display, 3/4 of the backing store on a retina one,
    // and never more than the tier's own ceiling. The governor works downward from there.
    const full = Math.min(dpr > 1.25 ? 0.75 : 1, QUALITY[this.qualityName].maxScale);
    const scale = this.autoScale ? full * this.renderScale : this.renderScale;
    // The canvas is drawn at the internal resolution and the browser stretches it to the page,
    // so no pass ever runs at more pixels than the scene was rendered with.
    const pw = Math.max(2, Math.round(w * dpr * scale)), ph = Math.max(2, Math.round(h * dpr * scale));
    const resized = pw !== this.renderer.domElement.width || ph !== this.renderer.domElement.height;
    if (resized) this.renderer.setSize(pw, ph, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.pipeline.setSize(pw, ph, 1);
    if (this.rig) this.rig.setAspect(w / h);
    // A window of another size is another problem: what the governor has learnt no longer holds.
    const page = `${w}x${h}@${dpr}`;
    if (page !== this._page) { this._page = page; this._governReset(); }
    // Resizing a canvas empties it: draw at once so that no blank frame is ever shown.
    if (resized && this.ready && !this.contextLost) this.render();
  }

  /** Advance the simulation by dt seconds without drawing. */
  step(dt) {
    this.time += dt;
    this.frameCount++;
    shared.uTime.value = this.time;
    shared.uDeltaTime.value = dt;
    shared.uFrame.value = this.frameCount;
    const boosts = [];
    for (const def of ELEMENTS) {
      const target = this.focusId === def.id ? 1 : 0;
      const w = this.focusWeights[def.id];
      this.focusWeights[def.id] = w + (target - w) * (1 - Math.exp(-dt * 2.2));
      boosts.push(this.focusWeights[def.id]);
    }
    this.ground.setSealBoost(boosts);
    for (const [id, el] of this.elements) {
      try { el.update(dt, this.time, { focus: this.focusWeights[id] ?? 0 }); } catch (err) {
        if (!el._reported) { el._reported = true; console.error(`[elementa] element "${id}" update failed:`, err && err.stack ? err.stack : err); }
      }
    }
    this.ripples.update(dt);
  }

  /** Run the simulation forward in 1/60 s steps; with `camera`, the camera rig and a running tour too. */
  _advance(seconds, camera = false) {
    const n = Math.max(1, Math.round(seconds * 60));
    for (let i = 0; i < n; i++) {
      this.step(1 / 60);
      if (camera) { this.rig.update(1 / 60); this._updateTour(1 / 60); }
    }
    this._resync();
  }

  /** Forget the time just spent outside the frame loop (a long synchronous job, a hidden tab). */
  _resync() {
    this._last = performance.now();
    const g = this._gov;
    g.acc = 0; g.frames = 0; g.slow = 0; g.fast = 0; g.crawl = 0;
  }

  render() {
    this.scene.updateMatrixWorld();
    this.renderer.info.reset();
    this.pipeline.render();
  }

  _frame(now) {
    this._raf = requestAnimationFrame(this._frame);
    // A frame's timestamp can lie a few milliseconds before the moment the loop was (re)started.
    const elapsed = Math.max(0, (now - this._last) / 1000);
    this._last = now;
    if (this.held) { this.render(); return; }
    const real = Math.min(elapsed, 0.25);
    const dt = Math.min(real, 1 / 20);
    if (!this.paused) this.step(dt);
    this.rig.update(real);
    if (this._fade < 1) {
      this._fade = Math.min(1, this._fade + real / 2.4);
      this.pipeline.settings.fade = this._fade * this._fade * (3 - 2 * this._fade);
    }
    this._updateAudio(real);
    this._updateTour(real);
    this._updateIdle(real);
    this.render();
    this._govern(Math.min(elapsed, 1));
  }

  // ---- governor ---------------------------------------------------------------------------
  // Keeps the frame rate up by trading internal resolution (and, in the top tier, its extras),
  // never the scene itself. A frame rate says when frames are late but not how much room is
  // left, so the level that holds is found by trying: down in coarse steps while frames drop,
  // back up in fine ones, and the first step that drops frames again is undone and remembered
  // as too much for that view. From then on the level stays where it is. Each view keeps its
  // own level, so coming back to a heavy close-up does not stutter a second time.
  // On a machine that cannot hold the target even at the floor, a tier the visitor did not
  // choose is stepped down, one way only.

  _level() { return this.extras && QUALITY[this.qualityName].extras ? EXTRAS : this.renderScale; }

  _setLevel(level) {
    const g = this._gov;
    const extras = level > 1;
    this.renderScale = Math.min(level, 1);
    if (extras !== this.extras) { this.extras = extras; this._applyQuality(); }
    this._resize();
    g.view.level = level;
    g.scale = this.renderScale;
    g.since = g.time;
    g.mean = g.target;
    g.slow = 0; g.fast = 0; g.crawl = 0; g.sag = 0; g.stuck = 0;
  }

  /** Forget what has been learnt (a new tier, a new window size): levels stay, verdicts go. */
  _governReset() {
    const g = this._gov;
    g.acc = 0; g.frames = 0;                // the reading in progress
    g.slow = 0; g.fast = 0; g.crawl = 0;    // consecutive readings of each kind
    g.sag = 0;                              // consecutive readings with the running mean below par
    g.stuck = 0;                            // consecutive slow readings at the floor
    g.mean = g.target;                      // running mean of the readings since the last change
    g.since = g.time;                       // when the level last changed
    g.trial = null;                         // a step up on trial: { from, to, readings }
    g.descent = null;                       // where the current run of steps down began: { level, fps }
    g.views.clear();
    g.view = { level: this._level(), bad: Infinity, retry: 0 };
    g.views.set(this.focusId || 'overview', g.view);
    g.scale = this.renderScale;
  }

  /** The camera is off to another view: take up the level that view was last left at. */
  _governView() {
    const g = this._gov;
    const key = this.focusId || 'overview';
    const level = this._level();
    let view = g.views.get(key);
    if (view === g.view) return;
    // A step on trial belongs to the view it was tried in: it has not proved itself, undo it.
    g.view.level = g.trial ? g.trial.from : level;
    if (!view) { view = { level: g.view.level, bad: Infinity, retry: 0 }; g.views.set(key, view); }
    g.view = view;
    g.trial = null;
    g.descent = null;
    if (this.autoScale && view.level !== level) this._setLevel(view.level);
  }

  _govern(elapsed) {
    const g = this._gov, G = GOVERNOR;
    g.time += elapsed;
    g.acc += elapsed;
    g.frames++;
    if (g.acc < G.reading) return;
    const fps = g.frames / g.acc;
    this.fps = fps;
    g.acc = 0;
    g.frames = 0;
    this.emit('fps', { fps, scale: this.renderScale });
    if (!this.autoScale || document.hidden || g.time < G.warmUp) return;
    // Someone set the scale by hand (the console, a test): start afresh from there.
    if (this.renderScale !== g.scale) this._governReset();

    // A display that turns out to refresh faster than was thought raises the target again.
    if (g.target < G.target && fps > g.target * 1.1) g.target = Math.min(G.target, fps);
    const slow = fps < G.slow * g.target, fast = fps >= G.fast * g.target;
    g.slow = slow ? g.slow + 1 : 0;
    g.fast = fast ? g.fast + 1 : 0;
    g.crawl = fps < G.crawl * g.target ? g.crawl + 1 : 0;
    // One hitch must not drag the mean down for seconds: a reading counts for 10 % under par at most.
    g.mean += (Math.max(fps, 0.9 * g.target) - g.mean) * 0.12;
    g.sag = g.mean < 0.985 * g.target ? g.sag + 1 : 0;

    const view = g.view;
    const level = this._level();
    const top = QUALITY[this.qualityName].extras ? EXTRAS : 1;

    if (g.trial) {
      // A step up is on trial for two seconds. Its first reading holds the resize itself and
      // is not judged; after that a single dropped frame sends it back, for a long time.
      const trial = g.trial;
      trial.readings++;
      if (trial.readings > 1 && !fast) {
        g.trial = null;
        view.bad = Math.min(view.bad, trial.to);
        view.retry = g.time + G.retry;
        this._setLevel(trial.from);
      } else if (trial.readings >= 4) {
        g.trial = null;
        if (trial.to >= view.bad) view.bad = Infinity;
      }
      return;
    }

    if (level > G.floor && (g.crawl >= 3 || g.slow >= 3 || g.sag >= 12)) {
      // Frames are late. Far below the target: straight to the floor. Below it: a coarse step,
      // a finer one when only a few frames are late, the finest when the mean has merely sagged.
      let next = G.floor;
      if (g.crawl < 3) next = level > 1 ? 1 : Math.max(G.floor, level * (g.slow < 3 ? G.trim : fps < 0.8 * g.target ? G.down : G.ease));
      if (!g.descent) g.descent = { level, fps: g.slow < 3 && g.crawl < 3 ? g.mean : fps };
      view.bad = Math.min(view.bad, level);
      view.retry = g.time + G.retry;
      this._setLevel(next);
      return;
    }

    // At the floor: three seconds below the target there and something else has to give.
    g.stuck = level <= G.floor && slow ? g.stuck + 1 : 0;
    if (g.stuck >= 6) {
      g.stuck = 0;
      const tier = TIERS.indexOf(this.qualityName);
      if (g.descent && fps < g.descent.fps * 1.15) {
        // A quarter of the pixels bought nothing: it is the display (or a browser saving
        // power) that holds the frame rate, not the GPU. Give the pixels back and defend
        // the rate this machine does reach.
        g.target = Math.min(g.target, fps);
        const back = g.descent.level;
        view.bad = Infinity;
        g.descent = null;
        this._setLevel(back);
      } else if (!this.tierChosen && tier > 0) {
        this.setQuality(TIERS[tier - 1], { chosen: false });
      }
      return;
    }

    if (g.fast >= 10 && level < top) {
      // Five seconds without a dropped frame: try the next level up, unless it is known to be too much here.
      g.fast = 0;
      const next = level < 1 ? Math.min(1, level / G.trim) : EXTRAS;
      if (next < view.bad || g.time >= view.retry) {
        g.descent = null;
        g.trial = { from: level, to: next, readings: 0 };
        this._setLevel(next);
      }
    }
  }

  /** Dev/automation hooks exposed on window.__app. */
  hooks() {
    const app = this;
    return {
      app,
      focus: (id) => app.focus(id, { immediate: false }),
      jump: (id) => app.focus(id, { immediate: true }),
      overview: () => app.overview({ immediate: false }),
      tour: (on = true) => app.setTour(on),
      /** Step the scene, the camera rig and a running tour forward by this many seconds, and draw. */
      advance: (seconds) => { app._fade = 1; app.pipeline.settings.fade = 1; app._advance(seconds, true); app.render(); return app.time; },
      render: () => app.render(),
      /** Hold the whole clock (scene, camera, tour, governor) so that only advance() moves anything; false lets go. */
      setPaused: (p) => { app.held = !!p; app.setPaused(p); },
      setQuality: (q) => app.setQuality(q),
      setCamera: (px, py, pz, tx, ty, tz) => {
        app.rig.flight = null; app.rig.autoOrbit = false; app.rig.userMoved = true;
        app.camera.position.set(px, py, pz); app.rig.controls.target.set(tx, ty, tz); app.rig.controls.update(); app.render();
      },
      bench: (n = 60) => {
        const gl = app.renderer.getContext();
        const px = new Uint8Array(4);
        const warm = 5;
        for (let i = 0; i < warm; i++) { app.step(1 / 60); app.render(); }
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        // Frames are queued and the GPU is waited for once, so the figure is not rounded up to display refreshes.
        const t0 = performance.now();
        for (let i = 0; i < n; i++) { app.step(1 / 60); app.render(); }
        app.renderer.setRenderTarget(null);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const ms = (performance.now() - t0) / n;
        const info = app.renderer.info;
        app._resync();
        return { msPerFrame: +ms.toFixed(2), fps: +(1000 / ms).toFixed(1), internal: `${app.pipeline.width}x${app.pipeline.height}`, calls: info.render.calls, triangles: info.render.triangles, points: info.render.points };
      },
      /**
       * What one element costs per frame, in milliseconds: frames are queued with and without
       * it in alternation (the GPU is waited for once per batch) and the best of several
       * rounds is kept, which makes the figure robust against other load on the machine.
       */
      cost: (id, rounds = 5, frames = 20) => {
        const gl = app.renderer.getContext();
        const px = new Uint8Array(4);
        const el = app.elements.get(id);
        if (!el) return null;
        const sync = () => { app.renderer.setRenderTarget(null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
        const run = () => {
          app.step(1 / 60); app.render(); sync();
          const t0 = performance.now();
          for (let i = 0; i < frames; i++) { app.step(1 / 60); app.render(); }
          sync();
          return (performance.now() - t0) / frames;
        };
        let withIt = Infinity, without = Infinity;
        for (let r = 0; r < rounds; r++) {
          el.group.visible = true; withIt = Math.min(withIt, run());
          el.group.visible = false; without = Math.min(without, run());
        }
        el.group.visible = true;
        app._resync();
        return { id, costMs: +(withIt - without).toFixed(2), frameMs: +withIt.toFixed(2), withoutMs: +without.toFixed(2), internal: `${app.pipeline.width}x${app.pipeline.height}` };
      },
      get state() { return { time: app.time, focus: app.focusId, quality: app.qualityName, scale: app.renderScale, extras: app.extras, fps: app.fps, paused: app.paused }; },
    };
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    for (const off of this._cleanups.splice(0)) off();
    if (this._observer) this._observer.disconnect();
    if (this.audio.instance && this.audio.instance.dispose) this.audio.instance.dispose();
    for (const el of this.elements.values()) if (el.dispose) el.dispose();
    this.listeners.clear();
    if (!this.renderer) return;               // never started
    this.rig.dispose();
    // Whatever is still in the scene: the sky, the ground, the mist and anything an element left behind.
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      for (const m of [].concat(o.material || [])) m.dispose();
      if (o.isLight && o.shadow && o.shadow.map) o.shadow.dispose();
    });
    // The pipeline's targets, then the full-screen passes and stand-in textures it keeps beside them.
    this.pipeline.dispose();
    for (const part of Object.values(this.pipeline)) {
      if (part && part.isTexture) part.dispose();
      else if (part && part.material && part.material.isMaterial) { part.material.dispose(); if (part.mesh) part.mesh.geometry.dispose(); }
    }
    this.ripples.dispose();
    if (this.ground.crust) this.ground.crust.dispose();
    for (const texture of [shared.uNoise3D.value, shared.uEnvCube.value, this.scene.environment]) if (texture && texture.dispose) texture.dispose();
    shared.uNoise3D.value = null;
    shared.uEnvCube.value = null;
    this.scene.environment = null;
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
