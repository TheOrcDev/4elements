import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ElementType } from '../audio/ElementalAudio.ts';

export interface CameraTargetPreset {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov?: number;
}

export const ELEMENT_PRESETS: Record<ElementType, CameraTargetPreset> = {
  nexus: {
    position: new THREE.Vector3(0, 10.5, 15.5),
    target: new THREE.Vector3(0, -0.2, 0),
    fov: 50
  },
  fire: {
    position: new THREE.Vector3(0, 0.8, 10.5),
    target: new THREE.Vector3(0, 0, 6.5),
    fov: 45
  },
  water: {
    position: new THREE.Vector3(10.5, 0.8, 0),
    target: new THREE.Vector3(6.5, 0, 0),
    fov: 45
  },
  earth: {
    position: new THREE.Vector3(0, 0.8, -10.5),
    target: new THREE.Vector3(0, 0, -6.5),
    fov: 45
  },
  air: {
    position: new THREE.Vector3(-10.5, 0.8, 0),
    target: new THREE.Vector3(-6.5, 0, 0),
    fov: 45
  },
  fusion: {
    position: new THREE.Vector3(0, 1.6, 4.8),
    target: new THREE.Vector3(0, 0, 0),
    fov: 45
  }
};

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public currentElement: ElementType = 'nexus';
  public isCinematicTour = false;
  private tourAngle = 0;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 40;
    this.controls.minDistance = 2.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;

    this.applyPreset('nexus', 0);
  }

  public applyPreset(element: ElementType, duration = 1.4) {
    this.currentElement = element;
    this.isCinematicTour = false;
    const preset = ELEMENT_PRESETS[element];
    if (!preset) return;

    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    if (duration <= 0) {
      this.camera.position.copy(preset.position);
      this.controls.target.copy(preset.target);
      this.controls.update();
      return;
    }

    gsap.to(this.camera.position, {
      x: preset.position.x,
      y: preset.position.y,
      z: preset.position.z,
      duration: duration,
      ease: 'power3.inOut'
    });

    gsap.to(this.controls.target, {
      x: preset.target.x,
      y: preset.target.y,
      z: preset.target.z,
      duration: duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.controls.update();
      }
    });
  }

  public toggleCinematicTour() {
    this.isCinematicTour = !this.isCinematicTour;
    if (this.isCinematicTour) {
      gsap.to(this.controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: 'power2.inOut'
      });
    }
  }

  public update(delta: number) {
    if (this.isCinematicTour) {
      this.tourAngle += delta * 0.25;
      const radius = 14.5;
      const height = 5.0 + Math.sin(this.tourAngle * 0.8) * 3.5;
      this.camera.position.x = Math.cos(this.tourAngle) * radius;
      this.camera.position.z = Math.sin(this.tourAngle) * radius;
      this.camera.position.y = height;
      this.controls.target.set(0, 0, 0);
    }

    this.controls.update();
  }
}
