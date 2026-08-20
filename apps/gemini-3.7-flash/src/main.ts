import * as THREE from 'three';
import { NexusEnvironment } from './scene/NexusEnvironment.ts';
import { FireElement } from './elements/FireElement.ts';
import { WaterElement } from './elements/WaterElement.ts';
import { EarthElement } from './elements/EarthElement.ts';
import { AirElement } from './elements/AirElement.ts';
import { FusionElement, FusionMode } from './elements/FusionElement.ts';
import { CameraController } from './scene/CameraController.ts';
import { PostProcessingManager } from './scene/PostProcessing.ts';
import { ElementalAudio, ElementType } from './audio/ElementalAudio.ts';
import { HudOverlay } from './ui/HudOverlay.ts';

class FourElementsApp {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private cameraController: CameraController;
  private postProcessing: PostProcessingManager;
  private audio: ElementalAudio;
  private hud: HudOverlay;

  // Scene Objects
  private environment: NexusEnvironment;
  private fireElement: FireElement;
  private waterElement: WaterElement;
  private earthElement: EarthElement;
  private airElement: AirElement;
  private fusionElement: FusionElement;

  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isUserInteracting = false;
  private activeElement: ElementType = 'nexus';

  constructor() {
    const container = document.getElementById('canvas-container')!;
    const uiContainer = document.getElementById('ui-overlay')!;

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      alpha: false
    });
    this.renderer.setClearColor(0x030712, 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );

    // 3. Camera Controller & Post-Processing
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.postProcessing = new PostProcessingManager(this.renderer, this.scene, this.camera);

    // 4. Audio Engine
    this.audio = new ElementalAudio();

    // 5. Build Environment & 4 Elements
    this.environment = new NexusEnvironment();
    this.scene.add(this.environment.group);

    // Fire Element (North / +Z)
    this.fireElement = new FireElement();
    this.fireElement.group.position.set(0, 0, 6.5);
    this.scene.add(this.fireElement.group);

    // Water Element (East / +X)
    this.waterElement = new WaterElement();
    this.waterElement.group.position.set(6.5, 0, 0);
    this.scene.add(this.waterElement.group);

    // Earth Element (South / -Z)
    this.earthElement = new EarthElement();
    this.earthElement.group.position.set(0, 0, -6.5);
    this.scene.add(this.earthElement.group);

    // Air Element (West / -X)
    this.airElement = new AirElement();
    this.airElement.group.position.set(-6.5, 0, 0);
    this.scene.add(this.airElement.group);

    // Central Fusion Element (Center / 0,0,0)
    this.fusionElement = new FusionElement();
    this.fusionElement.group.position.set(0, 0, 0);
    this.scene.add(this.fusionElement.group);

    // Ambient Lighting for gentle base visibility
    const ambientLight = new THREE.AmbientLight(0x0a1026, 1.5);
    this.scene.add(ambientLight);

    // 6. HUD UI Overlay
    this.hud = new HudOverlay(uiContainer, {
      onSelectElement: (elem: ElementType) => this.selectElement(elem),
      onSelectFusionMode: (mode: FusionMode) => this.fusionElement.setMode(mode),
      onTriggerSurge: () => this.triggerCurrentSurge(),
      onToggleAudio: () => this.audio.toggleMute(),
      onToggleCinematic: () => {
        this.cameraController.toggleCinematicTour();
        return this.cameraController.isCinematicTour;
      },
      onBloomChange: (val: number) => this.postProcessing.setBloomStrength(val),
      onTurbulenceChange: (val: number) => this.setTurbulence(val)
    });

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupInteractions();
    this.setupResize();
    (window as any).__app = this;
    this.animate();
  }

  private selectElement(elem: ElementType) {
    this.activeElement = elem;
    this.cameraController.applyPreset(elem);
    this.audio.setFocusElement(elem);
  }

  private triggerCurrentSurge() {
    this.audio.playSurgeSfx(this.activeElement);

    if (this.activeElement === 'fire') {
      this.fireElement.triggerSurge();
    } else if (this.activeElement === 'water') {
      this.waterElement.triggerSurge();
    } else if (this.activeElement === 'earth') {
      this.earthElement.triggerSurge();
    } else if (this.activeElement === 'air') {
      this.airElement.triggerSurge();
    } else if (this.activeElement === 'fusion') {
      this.fusionElement.triggerSurge();
    } else {
      // Nexus overview surge: trigger all!
      this.fireElement.triggerSurge();
      this.waterElement.triggerSurge();
      this.earthElement.triggerSurge();
      this.airElement.triggerSurge();
      this.fusionElement.triggerSurge();
    }
  }

  private setTurbulence(val: number) {
    this.fireElement.intensity = val;
    this.waterElement.intensity = val;
    this.earthElement.intensity = val;
    this.airElement.intensity = val;
    this.fusionElement.intensity = val;
  }

  private setupInteractions() {
    let clickStartX = 0;
    let clickStartY = 0;

    window.addEventListener('pointerdown', (e) => {
      clickStartX = e.clientX;
      clickStartY = e.clientY;
    });

    window.addEventListener('pointerup', (e) => {
      // Only trigger if click didn't drag
      const diffX = Math.abs(e.clientX - clickStartX);
      const diffY = Math.abs(e.clientY - clickStartY);
      if (diffX > 5 || diffY > 5) return;

      if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('.hud-container')) {
        return;
      }

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects([
        this.fireElement.group,
        this.waterElement.group,
        this.earthElement.group,
        this.airElement.group,
        this.fusionElement.group
      ], true);

      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && current.parent && current.parent !== this.scene) {
          if (current.name === 'FireElement') {
            this.hud.setActiveElement('fire');
            this.selectElement('fire');
            return;
          }
          if (current.name === 'WaterElement') {
            this.hud.setActiveElement('water');
            this.selectElement('water');
            return;
          }
          if (current.name === 'EarthElement') {
            this.hud.setActiveElement('earth');
            this.selectElement('earth');
            return;
          }
          if (current.name === 'AirElement') {
            this.hud.setActiveElement('air');
            this.selectElement('air');
            return;
          }
          if (current.name === 'FusionElement') {
            this.hud.setActiveElement('fusion');
            this.selectElement('fusion');
            return;
          }
          current = current.parent;
        }
      }
    });
  }

  private setupResize() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.postProcessing.setSize(width, height);
    });
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // Update scene elements
    this.environment.update(delta, time);
    this.fireElement.update(delta, time);
    this.waterElement.update(delta, time);
    this.earthElement.update(delta, time);
    this.airElement.update(delta, time);
    this.fusionElement.update(delta, time);

    // Update Camera
    this.cameraController.update(delta);

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Sync WebGL mirror for headless browser capturing if element exists
    const mirror = document.getElementById('webgl-mirror') as HTMLImageElement | null;
    if (mirror && Math.floor(time * 20) % 2 === 0) {
      mirror.src = this.renderer.domElement.toDataURL();
    }
  };
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  new FourElementsApp();
});
