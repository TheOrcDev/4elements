import * as THREE from 'three';
import gsap from 'gsap';
import {
  FUSION_CORE_VERTEX,
  FUSION_CORE_FRAGMENT,
  RUNE_RING_VERTEX,
  RUNE_RING_FRAGMENT
} from '../shaders/fusionShaders.ts';

export type FusionMode = 'genesis' | 'magma' | 'steam' | 'sandstorm' | 'blizzard';

const FUSION_MODE_MAP: Record<FusionMode, number> = {
  genesis: 0,
  magma: 1,
  steam: 2,
  sandstorm: 3,
  blizzard: 4
};

const FUSION_COLORS: Record<FusionMode, number> = {
  genesis: 0xffffff,
  magma: 0xff4500,
  steam: 0x93c5fd,
  sandstorm: 0xd97706,
  blizzard: 0x38bdf8
};

export class FusionElement {
  public group: THREE.Group;
  public pointLight: THREE.PointLight;
  private coreMaterial: THREE.ShaderMaterial;
  private runeRings: THREE.Mesh[] = [];
  private runeMaterials: THREE.ShaderMaterial[] = [];
  private currentMode: FusionMode = 'genesis';
  public intensity = 1.0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FusionElement';

    // 1. Fusion Core Sphere
    const coreGeo = new THREE.SphereGeometry(1.4, 64, 64);
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: FUSION_CORE_VERTEX,
      fragmentShader: FUSION_CORE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 1.0 },
        uDisplacement: { value: 0.4 },
        uMode: { value: 0 },
        uIntensity: { value: 1.5 }
      }
    });
    const coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.group.add(coreMesh);

    // 2. Sacred Geometry Rune Rings (X, Y, Z Orthogonal Planes)
    const ringConfigs = [
      { radius: 2.2, color: new THREE.Color('#f59e0b'), rot: [0, 0, 0], speed: 1.5 },
      { radius: 2.5, color: new THREE.Color('#3b82f6'), rot: [Math.PI / 2, 0, 0], speed: -1.2 },
      { radius: 2.8, color: new THREE.Color('#10b981'), rot: [0, Math.PI / 2, 0], speed: 1.8 }
    ];

    ringConfigs.forEach(cfg => {
      const geo = new THREE.TorusGeometry(cfg.radius, 0.035, 16, 120);
      const mat = new THREE.ShaderMaterial({
        vertexShader: RUNE_RING_VERTEX,
        fragmentShader: RUNE_RING_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: cfg.color },
          uSpeed: { value: cfg.speed }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      this.group.add(ring);
      this.runeRings.push(ring);
      this.runeMaterials.push(mat);
    });

    // 3. Dynamic Center Light
    this.pointLight = new THREE.PointLight(0xffffff, 5.0, 20);
    this.group.add(this.pointLight);
  }

  public setMode(mode: FusionMode) {
    this.currentMode = mode;
    const modeInt = FUSION_MODE_MAP[mode] ?? 0;
    
    gsap.to(this.coreMaterial.uniforms.uIntensity, {
      value: 3.5,
      duration: 0.25,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.coreMaterial.uniforms.uMode.value = modeInt;
      }
    });

    const targetColor = new THREE.Color(FUSION_COLORS[mode]);
    gsap.to(this.pointLight.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.5
    });
  }

  public update(delta: number, time: number) {
    this.coreMaterial.uniforms.uTime.value = time;
    this.runeMaterials.forEach(m => {
      m.uniforms.uTime.value = time;
    });

    if (this.runeRings[0]) this.runeRings[0].rotation.z += delta * 0.4;
    if (this.runeRings[1]) this.runeRings[1].rotation.x += delta * 0.3;
    if (this.runeRings[2]) this.runeRings[2].rotation.y += delta * 0.5;

    const pulse = Math.sin(time * 3.0) * 0.4;
    this.pointLight.intensity = (5.0 + pulse) * this.intensity;
  }

  public triggerSurge() {
    gsap.to(this.coreMaterial.uniforms.uDisplacement, {
      value: 0.8,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.coreMaterial.uniforms.uDisplacement.value = 0.4;
      }
    });

    gsap.to(this.pointLight, {
      intensity: 14.0,
      duration: 0.4,
      yoyo: true,
      repeat: 1
    });
  }

  public dispose() {
    this.coreMaterial.dispose();
    this.runeMaterials.forEach(m => m.dispose());
  }
}
