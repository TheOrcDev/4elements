import * as THREE from 'three';
import { ELEMENTS, stationPosition } from './config.js';
import { createNoise3DTexture, createNoise2DTexture } from './gl/noise.js';
import { Sky } from './world/Sky.js';
import { Lighting } from './world/Lighting.js';
import { Platform } from './world/Platform.js';
import { Motes } from './world/Motes.js';
import { PostFX } from './fx/PostFX.js';
import { CameraRig } from './core/CameraRig.js';
import { Fire } from './elements/Fire.js';
import { Water } from './elements/Water.js';
import { Air } from './elements/Air.js';
import { Earth } from './elements/Earth.js';

const ELEMENT_CLASSES = { fire: Fire, water: Water, air: Air, earth: Earth };
const UP = new THREE.Vector3(0, 1, 0);

const QUALITY = {
  low: { dpr: 1.0, fireSteps: 30, shadowSize: 1024, embers: 260, grass: 1800, leaves: 1200, ribbons: 60 },
  medium: { dpr: 1.5, fireSteps: 40, shadowSize: 2048, embers: 420, grass: 2800, leaves: 1900, ribbons: 80 },
  high: { dpr: 2.0, fireSteps: 52, shadowSize: 2048, embers: 560, grass: 3800, leaves: 2600, ribbons: 110 },
};

export const OVERVIEW = {
  pos: new THREE.Vector3(0, 7.4, 16.8),
  target: new THREE.Vector3(0, 2.3, 0),
};

export class App {
  constructor(canvas, { onProgress } = {}) {
    this.canvas = canvas;
    this.params = new URLSearchParams(location.search);
    const qName = this.params.get('q') ?? 'high';
    this.quality = { name: qName, ...(QUALITY[qName] ?? QUALITY.high) };
    this.onProgress = onProgress ?? (() => {});
    this.focused = null;
    this.frames = 0;
    this.time = parseFloat(this.params.get('t') ?? '0');
    this.frozen = this.params.has('freeze');
    this.listeners = new Set();
    this.autoOrbit = true;
    this.idle = 0;
    this.hovered = null;
    this.fade = 0;
    this.introActive = false;
    this.sound = null;
  }

  /** Any user activity: stop the idle auto-orbit (and let the intro be skipped). */
  poke() {
    this.idle = 0;
    if (this.rig) this.rig.controls.autoRotate = false;
    if (this.introActive) {
      this.introActive = false;
      this.rig.cancel();
    }
  }

  intro() {
    this.introActive = true;
    this.fade = 1;
    this.rig.jumpTo(new THREE.Vector3(-21, 15, 27), new THREE.Vector3(0, 3.2, 0));
    this.rig.flyTo(OVERVIEW.pos, OVERVIEW.target, {
      duration: 6.0,
      arc: 0,
      onDone: () => (this.introActive = false),
    });
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(evt) {
    for (const fn of this.listeners) fn(evt);
  }

  async init() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality.dpr);
    renderer.setPixelRatio(this.dpr);
    // refraction through water doesn't need a full-resolution copy of the scene
    renderer.transmissionResolutionScale = 0.6;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1d2233, 0.0115);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 900);
    this.camera = camera;

    await this.#progress('Weaving noise', 0.1);
    const noise3D = createNoise3DTexture(64);
    await this.#progress('Weaving noise', 0.3);
    const noise2D = createNoise2DTexture(256);

    this.uniforms = {
      uTime: { value: this.time },
      uPixelRatio: { value: this.dpr },
      uPointScale: { value: 1000 },
      uStGlow: { value: [0, 0, 0, 0] },
    };
    this.ctx = { renderer, scene, camera, noise3D, noise2D, uniforms: this.uniforms, quality: this.quality, app: this };

    await this.#progress('Raising the sanctum', 0.4);
    const bare = this.params.has('bare'); // debug: element only, no world
    this.sky = new Sky(this.ctx);
    if (!bare) scene.add(this.sky.group);
    this.lighting = new Lighting(this.ctx);
    scene.add(this.lighting.group);
    this.platform = new Platform(this.ctx);
    if (!bare) scene.add(this.platform.group);
    this.motes = new Motes(this.ctx);
    if (!bare) scene.add(this.motes.points);

    const only = this.params.get('only');
    this.elements = [];
    let p = 0.5;
    for (const def of ELEMENTS) {
      if (only && only !== def.id) continue;
      await this.#progress(`Summoning ${def.name.toLowerCase()}`, p);
      p += 0.1;
      const el = new ELEMENT_CLASSES[def.id](this.ctx, def);
      el.def = def;
      scene.add(el.group);
      this.elements.push(el);
    }
    this.hitTargets = this.elements.map((e) => e.hit);

    this.post = new PostFX(this.ctx);
    this.rig = new CameraRig(camera, this.canvas);

    this.#resize();
    window.addEventListener('resize', () => this.#resize());

    // initial view
    const focus = this.params.get('focus');
    if (focus && this.elements.find((e) => e.def.id === focus)) {
      const v = this.focusView(focus);
      this.rig.jumpTo(v.pos, v.target);
      this.rig.setLimits('focus');
      this.focused = focus;
    } else if (this.params.has('cam')) {
      const c = this.params.get('cam').split(',').map(Number);
      const t = (this.params.get('tgt') ?? '0,1.5,0').split(',').map(Number);
      this.rig.jumpTo(new THREE.Vector3(...c), new THREE.Vector3(...t));
    } else if (this.params.has('nointro')) {
      this.rig.jumpTo(OVERVIEW.pos, OVERVIEW.target);
    } else {
      this.rig.jumpTo(OVERVIEW.pos, OVERVIEW.target);
      this.wantsIntro = true;
    }

    await this.#progress('Compiling shaders', 0.9);
    try {
      await renderer.compileAsync(scene, camera);
    } catch (e) {
      console.warn('compileAsync failed', e);
    }
    this.#adaptive = { acc: 0, n: 0, cooldown: 3 };
    this.last = performance.now();
    if (this.wantsIntro) this.intro();
    renderer.setAnimationLoop(() => this.#tick());
    await this.#progress('Ready', 1);
    window.__app = this;
  }

  async #progress(label, value) {
    this.onProgress(label, value);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  }

  #adaptive;

  #resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the composition on narrow (portrait) screens
    this.camera.fov = w / h < 1 ? 58 : 40;
    this.camera.updateProjectionMatrix();
    this.post.setSize(w, h, this.dpr);
    this.uniforms.uPixelRatio.value = this.dpr;
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    this.uniforms.uPointScale.value = (h * this.dpr) / (2 * Math.tan(fovRad / 2));
  }

  focusView(id) {
    const def = ELEMENTS.find((d) => d.id === id);
    const S = stationPosition(def);
    const v = def.view;
    // camera outside the ring looking in: the sanctum and the other elements form the backdrop
    const dir = new THREE.Vector3(S.x, 0, S.z).normalize().applyAxisAngle(UP, v.swing);
    const pos = S.clone().addScaledVector(dir, v.distance);
    pos.y = v.height;
    const target = S.clone();
    target.y = v.targetY;
    return { pos, target };
  }

  focus(id) {
    this.introActive = false; // a new flight supersedes the intro
    if (id === 'all') id = null;
    const same = id === this.focused; // re-selecting the current view resets the framing
    if (id) {
      const v = this.focusView(id);
      this.rig.setLimits('focus');
      this.rig.flyTo(v.pos, v.target, { duration: same ? 1.4 : 2.4, arc: same ? 0.3 : this.focused ? 2.2 : 1.2 });
      this.focused = id;
    } else {
      this.rig.setLimits('overview');
      this.rig.flyTo(OVERVIEW.pos, OVERVIEW.target, {
        duration: same ? 1.6 : 2.4,
        arc: same ? 0.4 : 1.5,
      });
      this.focused = null;
    }
    this.emit({ type: 'focus', id: this.focused, same });
  }

  pick(ndc) {
    this._ray ??= new THREE.Raycaster();
    this._ray.setFromCamera(ndc, this.camera);
    const hit = this._ray.intersectObjects(this.hitTargets, false)[0];
    return hit ? hit.object.userData.elementId : null;
  }

  #tick() {
    const now = performance.now();
    const rawDt = (now - this.last) / 1000;
    this.last = now;
    const dt = Math.min(rawDt, 1 / 20);
    if (!this.frozen) this.time += dt;
    this.uniforms.uTime.value = this.time;

    this.idle += dt;
    const c = this.rig.controls;
    if (this.autoOrbit && this.idle > 7 && !this.rig.busy && !c.autoRotate) c.autoRotate = true;
    if (!this.autoOrbit) c.autoRotate = false;
    c.autoRotateSpeed = this.focused ? 0.5 : 0.28;
    this.fade = Math.max(0, this.fade - dt * 0.55);
    this.post.finish.uniforms.uFade.value = this.fade * this.fade;

    this.rig.update(dt);
    this.sky.update(this.camera);
    this.platform.update(this.time);
    this.motes.update(this.time);

    // station highlight (hover + focus)
    const glow = this.uniforms.uStGlow.value;
    ELEMENTS.forEach((d, i) => {
      const target = d.id === this.focused ? 1 : d.id === this.hovered ? 0.6 : 0;
      glow[i] += (target - glow[i]) * Math.min(1, dt * 4);
    });
    for (const el of this.elements) {
      const u = el.pedestal?.material.userData.uniforms;
      if (u) u.uGlow.value = glow[ELEMENTS.indexOf(el.def)];
    }

    let fire = null;
    for (const el of this.elements) {
      el.update(this.time, dt, this.camera);
      if (el.def.id === 'fire') fire = el;
    }
    if (fire) this.post.setHazeSource(fire.hazeBase, fire.hazeTop, 1.0);
    else this.post.setHazeSource(new THREE.Vector3(), new THREE.Vector3(), 0);

    this.sound?.update(this.camera, this.elements, this.focused);
    this.post.render(this.time, dt);
    this.frames++;
    window.__frames = this.frames;
    this.#adapt(rawDt);
    this.emit({ type: 'frame', dt: rawDt });
  }

  #adapt(rawDt) {
    if (this.params.has('noadapt')) return;
    const a = this.#adaptive;
    // hitches from hidden tabs, sleep or window drags say nothing about GPU load
    if (rawDt > 0.1 || document.hidden) {
      a.acc = 0;
      a.n = 0;
      a.cooldown = Math.max(a.cooldown, 1);
      return;
    }
    if (a.cooldown > 0) {
      a.cooldown -= rawDt;
      return;
    }
    a.acc += rawDt;
    a.n++;
    if (a.n >= 90) {
      const avg = a.acc / a.n;
      a.acc = 0;
      a.n = 0;
      if (avg > 1 / 48 && this.dpr > 1.0) {
        this.dpr = Math.max(1.0, this.dpr - 0.25);
        this.#resize();
        a.cooldown = 2;
        console.info(`[elements] frame time ${(avg * 1000).toFixed(1)}ms → pixel ratio ${this.dpr}`);
      }
    }
  }
}
