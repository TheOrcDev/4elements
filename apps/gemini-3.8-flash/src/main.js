import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import GUI from 'lil-gui';

import { FireElement } from './elements/FireElement.js';
import { WaterElement } from './elements/WaterElement.js';
import { EarthElement } from './elements/EarthElement.js';
import { AirElement } from './elements/AirElement.js';
import { SanctumEnvironment } from './environment/SanctumEnvironment.js';
import { Starfield } from './environment/Starfield.js';
import { ElementalAudio } from './audio/ElementalAudio.js';

class ElementalApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.tooltip = document.getElementById('element-tooltip');

    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    const initialElement = params.get('element') || hash || 'all';
    this.activeElement = ['fire', 'water', 'earth', 'air'].includes(initialElement) ? initialElement : 'all';
    this.isCinematicTour = false;
    this.tourAngle = 0;
    this.timeScale = 1.0;

    this.initAudio();
    this.initThree();
    this.initPostProcessing();
    this.initScene();
    this.initInteractivity();
    this.initGUI();
    this.initUIEvents();

    if (this.activeElement !== 'all') {
      const targetData = this.elementLookup[this.activeElement];
      if (targetData) {
        this.camera.position.copy(targetData.camOffset);
        this.currentLookAt.copy(targetData.lookAt);
        this.camTargetPos.copy(targetData.camOffset);
        this.camTargetLookAt.copy(targetData.lookAt);
        this.controls.target.copy(this.currentLookAt);
        this.controls.update();
      }
      this.selectElement(this.activeElement, true);
    } else {
      this.camera.position.set(0, 12, 17);
      this.currentLookAt.set(0, 0, 0);
      this.camTargetPos.set(0, 12, 17);
      this.camTargetLookAt.set(0, 0, 0);
      this.controls.target.copy(this.currentLookAt);
      this.controls.update();
    }

    this.lastTime = performance.now();
    this.elapsedTime = 0;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initAudio() {
    this.audio = new ElementalAudio();
  }

  initThree() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060a12);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 12, 17);

    // Camera Lerp Targets
    this.camTargetPos = new THREE.Vector3(0, 12, 17);
    this.camTargetLookAt = new THREE.Vector3(0, 0, 0);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Balanced tone mapping exposure: bright enough for all 3D textures to be clear,
    // but low enough that glowing materials and specular highlights never blow out or glare
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.80;
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02; // Don't flip below altar
    this.controls.minDistance = 3.0;
    this.controls.maxDistance = 35.0;
    this.controls.target.copy(this.currentLookAt);

    // Ambient light: gentle fill so dark sides of models remain visible without flattening
    this.ambientLight = new THREE.AmbientLight(0x405064, 0.40);
    this.scene.add(this.ambientLight);

    // Hemisphere Light: Celestial Sky Dome + Warm Stone Altar Ground
    this.hemiLight = new THREE.HemisphereLight(0xb0c4de, 0x243040, 0.45);
    this.scene.add(this.hemiLight);

    // Directional Sun / Celestial Keylight for rich 3D highlights and surface contours
    this.dirLight = new THREE.DirectionalLight(0xffeedd, 0.65);
    this.dirLight.position.set(12, 22, 10);
    this.dirLight.castShadow = false;
    this.scene.add(this.dirLight);

    // Cool fill light from opposing angle to illuminate shadowed 3D contours
    this.fillLight = new THREE.DirectionalLight(0x5a7896, 0.30);
    this.fillLight.position.set(-12, -8, -10);
    this.scene.add(this.fillLight);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  initPostProcessing() {
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Subtle atmospheric Bloom (default disabled so all 3D geometry is pin-sharp and crystal clear)
    this.bloomPass = new UnrealBloomPass(size, 0.0, 0.0, 1.0);
    this.bloomPass.enabled = false;
    this.composer.addPass(this.bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  initScene() {
    // 1. Cosmic Background Stars
    this.starfield = new Starfield(2800);
    this.scene.add(this.starfield.group);

    // 2. Central Ancient Sanctum Altar & Nexus
    this.sanctum = new SanctumEnvironment();
    this.scene.add(this.sanctum.group);

    // 3. The Four Elements positioned at Cardinal Points
    // FIRE (South: +Z)
    this.fire = new FireElement();
    this.fire.group.position.set(0, 0, 6.5);
    this.scene.add(this.fire.group);

    // WATER (West: -X)
    this.water = new WaterElement();
    this.water.group.position.set(-6.5, 0, 0);
    this.scene.add(this.water.group);

    // EARTH (North: -Z)
    this.earth = new EarthElement();
    this.earth.group.position.set(0, 0, -6.5);
    this.scene.add(this.earth.group);

    // AIR (East: +X)
    this.air = new AirElement();
    this.air.group.position.set(6.5, 0, 0);
    this.scene.add(this.air.group);

    // Element map for raycasting & focus (cinematic 3/4 hero camera angles)
    this.elementLookup = {
      fire: {
        instance: this.fire,
        name: 'Fire Element',
        pos: new THREE.Vector3(0, 0, 6.5),
        camOffset: new THREE.Vector3(0.0, 1.2, 10.4),
        lookAt: new THREE.Vector3(0, 0.0, 6.5)
      },
      water: {
        instance: this.water,
        name: 'Water Element',
        pos: new THREE.Vector3(-6.5, 0, 0),
        camOffset: new THREE.Vector3(-10.4, 1.2, 0.0),
        lookAt: new THREE.Vector3(-6.5, 0.0, 0)
      },
      earth: {
        instance: this.earth,
        name: 'Earth Element',
        pos: new THREE.Vector3(0, 0, -6.5),
        camOffset: new THREE.Vector3(0.0, 1.2, -10.4),
        lookAt: new THREE.Vector3(0, 0.0, -6.5)
      },
      air: {
        instance: this.air,
        name: 'Air Element',
        pos: new THREE.Vector3(6.5, 0, 0),
        camOffset: new THREE.Vector3(10.4, 1.2, 0.0),
        lookAt: new THREE.Vector3(6.5, 0.0, 0)
      }
    };
  }

  initInteractivity() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredElementKey = null;

    // Hit test target spheres
    this.hitSpheres = [];
    for (let key in this.elementLookup) {
      const el = this.elementLookup[key];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(2.0, 16, 16),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      mesh.position.copy(el.pos);
      mesh.userData = { elementKey: key };
      this.scene.add(mesh);
      this.hitSpheres.push(mesh);
    }

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Tooltip position
      this.tooltip.style.left = `${e.clientX}px`;
      this.tooltip.style.top = `${e.clientY - 15}px`;

      this.checkHover();
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('#ui-overlay') && !e.target.closest('#canvas-container')) {
        return;
      }
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.hitSpheres);
      if (intersects.length > 0) {
        const key = intersects[0].object.userData.elementKey;
        this.selectElement(key);
        this.triggerSurge(key);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerSurge(this.activeElement === 'all' ? 'fire' : this.activeElement);
      }
    });
  }

  checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hitSpheres);

    if (intersects.length > 0) {
      const key = intersects[0].object.userData.elementKey;
      if (this.hoveredElementKey !== key) {
        this.hoveredElementKey = key;
        this.tooltip.textContent = this.elementLookup[key].name;
        this.tooltip.classList.add('visible');
        document.body.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredElementKey !== null) {
        this.hoveredElementKey = null;
        this.tooltip.classList.remove('visible');
        document.body.style.cursor = 'default';
      }
    }
  }

  selectElement(elementKey, immediate = false) {
    this.activeElement = elementKey;
    this.isCinematicTour = false;
    document.getElementById('btn-tour').classList.remove('active-action');

    // Update URL hash without jumping
    history.replaceState(null, '', `#${elementKey}`);

    // Update Nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.element === elementKey);
    });

    // Update Camera Target
    if (elementKey === 'all') {
      this.camTargetPos.set(0, 12, 17);
      this.camTargetLookAt.set(0, 0, 0);
    } else {
      const targetData = this.elementLookup[elementKey];
      if (targetData) {
        this.camTargetPos.copy(targetData.camOffset);
        this.camTargetLookAt.copy(targetData.lookAt);
      }
    }

    if (immediate) {
      this.camera.position.copy(this.camTargetPos);
      this.currentLookAt.copy(this.camTargetLookAt);
      this.controls.target.copy(this.currentLookAt);
      this.controls.update();
    }

    this.updateInfoCard(elementKey);
  }

  triggerSurge(elementKey = null) {
    const key = elementKey || (this.activeElement === 'all' ? 'all' : this.activeElement);

    if (key === 'all') {
      this.fire.triggerSurge();
      this.water.triggerSurge();
      this.earth.triggerSurge();
      this.air.triggerSurge();
      this.audio.playSurgeSound('fire');
      this.audio.playSurgeSound('water');
      this.audio.playSurgeSound('air');
      this.audio.playSurgeSound('earth');
    } else {
      const el = this.elementLookup[key];
      if (el) {
        el.instance.triggerSurge();
        this.audio.playSurgeSound(key);
      }
    }

    // Flash surge bloom briefly
    this.bloomPass.enabled = true;
    this.bloomPass.strength = 0.25;
    setTimeout(() => {
      this.bloomPass.enabled = false;
      this.bloomPass.strength = 0.0;
    }, 450);
  }

  updateInfoCard(elementKey) {
    const badge = document.getElementById('card-badge');
    const title = document.getElementById('card-title');
    const desc = document.getElementById('card-desc');
    const stat1 = document.getElementById('stat-1');
    const stat2 = document.getElementById('stat-2');
    const stat3 = document.getElementById('stat-3');

    badge.className = `card-badge badge-${elementKey}`;

    const data = {
      all: {
        badge: 'Quad-Convergence',
        title: 'The Primal Nexus',
        desc: 'The four primordial forces of reality held in cosmic equilibrium at the sacred altar. Fire, Water, Earth, and Air channel continuous energy beams into the central catalyst matrix.',
        s1: '100% Balanced',
        s2: '432 Hz Core',
        s3: '3,800 Active'
      },
      fire: {
        badge: 'Solar Sanctuary',
        title: 'The Eternal Pyre',
        desc: 'Incandescent plasma sphere surging with upward-billowing solar prominences, orbiting volcanic meteors, and swirling turbulent sparks that cool from white-hot to smoldering ruby.',
        s1: '3,850 °K Heat',
        s2: '1.4 GW Output',
        s3: '260 Embers'
      },
      water: {
        badge: 'Oceanic Sanctuary',
        title: 'The Abyssal Maelstrom',
        desc: 'Deep liquid sphere undulating with multi-harmonic wave displacement, dynamic caustic refraction patterns, dual-flowing tidal vortex rings, and buoyant bioluminescent bubbles.',
        s1: '1.333 IOR Index',
        s2: '120 kPa Wave',
        s3: '180 Bubbles'
      },
      earth: {
        badge: 'Terra Sanctuary',
        title: 'The Monolith Geode',
        desc: 'Suspended fractured bedrock stratified with mossy cliffs and crystalline emerald fissures. Held aloft by gravitational geomancy alongside orbiting jagged megaliths.',
        s1: '8.5 Mohs Crystal',
        s2: '9.81 m/s² Grav',
        s3: '180 Spores'
      },
      air: {
        badge: 'Tempest Sanctuary',
        title: 'The Eye of the Gale',
        desc: 'Violently graceful atmospheric cyclone vortex twisting skyward with dual counter-spiraling funnels, aerogel core streamers, and high-velocity logarithmic golden wisps.',
        s1: '280 km/h Gale',
        s2: '950 hPa Eye',
        s3: '280 Wisps'
      }
    };

    const info = data[elementKey] || data.all;
    badge.textContent = info.badge;
    title.textContent = info.title;
    desc.textContent = info.desc;
    stat1.textContent = info.s1;
    stat2.textContent = info.s2;
    stat3.textContent = info.s3;
  }

  initUIEvents() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      const valid = ['fire', 'water', 'earth', 'air', 'all'].includes(hash) ? hash : 'all';
      if (valid !== this.activeElement) {
        this.selectElement(valid);
      }
    });

    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectElement(btn.dataset.element);
      });
    });

    // Surge button
    document.getElementById('btn-surge').addEventListener('click', () => {
      this.triggerSurge();
    });

    // Tour button
    const tourBtn = document.getElementById('btn-tour');
    tourBtn.addEventListener('click', () => {
      this.isCinematicTour = !this.isCinematicTour;
      tourBtn.classList.toggle('active-action', this.isCinematicTour);
      if (this.isCinematicTour) {
        this.tourAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
      }
    });

    // Audio button
    const audioBtn = document.getElementById('btn-audio');
    audioBtn.addEventListener('click', () => {
      const isUnmuted = this.audio.toggleMute();
      audioBtn.innerHTML = isUnmuted ? '<span>🔊</span> Sound: On' : '<span>🔇</span> Sound: Off';
      audioBtn.classList.toggle('active-action', isUnmuted);
    });
  }

  initGUI() {
    this.gui = new GUI({ title: '⚡ Elemental Matrix' });
    this.gui.close(); // Start closed for clean screen view

    // Scene & Post-processing
    const fPost = this.gui.addFolder('Post Processing & Bloom');
    fPost.add(this.bloomPass, 'enabled').name('Bloom Enabled');
    fPost.add(this.bloomPass, 'strength', 0.0, 3.0, 0.05).name('Bloom Strength');
    fPost.add(this.bloomPass, 'radius', 0.0, 1.5, 0.05).name('Bloom Radius');
    fPost.add(this.bloomPass, 'threshold', 0.0, 1.0, 0.05).name('Bloom Threshold');
    fPost.add(this.renderer, 'toneMappingExposure', 0.5, 2.5, 0.05).name('Exposure');
    fPost.add(this, 'timeScale', 0.1, 3.0, 0.1).name('Simulation Speed');

    // Camera Modes
    const fCam = this.gui.addFolder('Camera & Navigation');
    fCam.add(this, 'activeElement', ['all', 'fire', 'water', 'earth', 'air']).name('Focus Element').onChange(val => {
      this.selectElement(val);
    });
    fCam.add(this, 'isCinematicTour').name('Cinematic Tour').listen().onChange(val => {
      document.getElementById('btn-tour').classList.toggle('active-action', val);
    });

    // Fire Settings
    const fFire = this.gui.addFolder('🔥 Fire Element');
    fFire.add(this.fire.uniforms.uDisplacement, 'value', 0.1, 0.8, 0.02).name('Flame Displacement');
    fFire.add(this.fire.uniforms.uSpeed, 'value', 0.2, 2.5, 0.05).name('Flame Speed');
    fFire.add(this.fire.uniforms.uIntensity, 'value', 0.5, 3.0, 0.1).name('Core Intensity');
    fFire.add({ surge: () => this.triggerSurge('fire') }, 'surge').name('Cast Fire Surge');

    // Water Settings
    const fWater = this.gui.addFolder('💧 Water Element');
    fWater.add(this.water.uniforms.uWaveHeight, 'value', 0.05, 0.45, 0.01).name('Wave Height');
    fWater.add(this.water.uniforms.uWaveSpeed, 'value', 0.2, 3.0, 0.05).name('Wave Speed');
    fWater.add(this.water.uniforms.uOpacity, 'value', 0.3, 1.0, 0.05).name('Opacity');
    fWater.add({ surge: () => this.triggerSurge('water') }, 'surge').name('Cast Water Surge');

    // Earth Settings
    const fEarth = this.gui.addFolder('🌿 Earth Element');
    fEarth.add(this.earth.uniforms.uVeinGlow, 'value', 0.1, 2.0, 0.05).name('Vein Crystal Glow');
    fEarth.add({ surge: () => this.triggerSurge('earth') }, 'surge').name('Cast Earth Surge');

    // Air Settings
    const fAir = this.gui.addFolder('🌪️ Air Element');
    fAir.add(this.air.uniforms.uSpinSpeed, 'value', 0.5, 4.0, 0.1).name('Cyclone Vortex Speed');
    fAir.add(this.air.uniforms.uSpeed, 'value', 0.5, 3.5, 0.1).name('Streamer Speed');
    fAir.add(this.air.uniforms.uIntensity, 'value', 0.2, 2.0, 0.05).name('Glow Intensity');
    fAir.add({ surge: () => this.triggerSurge('air') }, 'surge').name('Cast Air Surge');
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const rawDelta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    const delta = rawDelta * this.timeScale;
    this.elapsedTime += delta;
    const elapsed = this.elapsedTime;

    // Update Environment & Elements
    this.starfield.update(delta, elapsed);
    this.sanctum.update(delta, elapsed);
    this.fire.update(delta, elapsed);
    this.water.update(delta, elapsed);
    this.earth.update(delta, elapsed);
    this.air.update(delta, elapsed);

    // Camera smoothing or cinematic tour
    if (this.isCinematicTour) {
      this.tourAngle += delta * 0.25;
      const radius = 17.5;
      const height = 9.0 + Math.sin(this.tourAngle * 1.5) * 3.5;
      this.camera.position.x = Math.cos(this.tourAngle) * radius;
      this.camera.position.z = Math.sin(this.tourAngle) * radius;
      this.camera.position.y = height;
      this.controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    } else {
      // Smooth lerp to chosen camera vantage point
      this.camera.position.lerp(this.camTargetPos, 0.08);
      this.currentLookAt.lerp(this.camTargetLookAt, 0.08);
      this.controls.target.copy(this.currentLookAt);
    }

    this.controls.update();

    // Render: use native WebGLRenderer for crisp hardware MSAA antialiasing;
    // only route through composer when bloom pass is explicitly enabled
    if (this.bloomPass.enabled && this.bloomPass.strength > 0.01) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new ElementalApp();
});
