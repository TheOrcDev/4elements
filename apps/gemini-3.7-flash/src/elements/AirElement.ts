import * as THREE from 'three';
import gsap from 'gsap';
import {
  AIR_VORTEX_VERTEX,
  AIR_VORTEX_FRAGMENT,
  AIR_CORE_VERTEX,
  AIR_CORE_FRAGMENT,
  AIR_GALE_PARTICLE_VERTEX,
  AIR_GALE_PARTICLE_FRAGMENT
} from '../shaders/airShaders.ts';

export class AirElement {
  public group: THREE.Group;
  public pointLight: THREE.PointLight;
  private vortexMaterial1: THREE.ShaderMaterial;
  private vortexMaterial2: THREE.ShaderMaterial;
  private coreMaterial: THREE.ShaderMaterial;
  private galeGeometry: THREE.BufferGeometry;
  private galeMaterial: THREE.ShaderMaterial;
  private galeParticles: THREE.Points;
  private galeCount = 1800;
  private aeroRings: THREE.Mesh[] = [];
  public intensity = 1.0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'AirElement';

    // 1. Cyclone Tornado Vortex Funnel 1 (Outer Ribbon)
    const funnelGeo1 = new THREE.CylinderGeometry(1.6, 0.4, 3.2, 48, 32, true);
    this.vortexMaterial1 = new THREE.ShaderMaterial({
      vertexShader: AIR_VORTEX_VERTEX,
      fragmentShader: AIR_VORTEX_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uTwist: { value: 3.5 },
        uSpeed: { value: 2.8 },
        uColor1: { value: new THREE.Color('#38bdf8') },
        uColor2: { value: new THREE.Color('#e0f2fe') },
        uHighlight: { value: new THREE.Color('#ffffff') }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const vortexMesh1 = new THREE.Mesh(funnelGeo1, this.vortexMaterial1);
    this.group.add(vortexMesh1);

    // 2. Counter-Twisting Inner Vortex Funnel 2
    const funnelGeo2 = new THREE.CylinderGeometry(0.5, 1.4, 2.8, 36, 24, true);
    this.vortexMaterial2 = new THREE.ShaderMaterial({
      vertexShader: AIR_VORTEX_VERTEX,
      fragmentShader: AIR_VORTEX_FRAGMENT,
      uniforms: {
        uTime: { value: 10 },
        uTwist: { value: -4.0 },
        uSpeed: { value: -2.2 },
        uColor1: { value: new THREE.Color('#818cf8') },
        uColor2: { value: new THREE.Color('#67e8f9') },
        uHighlight: { value: new THREE.Color('#ffffff') }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const vortexMesh2 = new THREE.Mesh(funnelGeo2, this.vortexMaterial2);
    this.group.add(vortexMesh2);

    // 3. Atmospheric Cloud Eye Core
    const coreGeo = new THREE.SphereGeometry(0.85, 48, 48);
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: AIR_CORE_VERTEX,
      fragmentShader: AIR_CORE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 1.5 },
        uCoreColor: { value: new THREE.Color('#7dd3fc') },
        uRimColor: { value: new THREE.Color('#ffffff') },
        uWispColor: { value: new THREE.Color('#cffafe') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.group.add(coreMesh);

    // 4. Orbiting Aero-Rings
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.025, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x38bdf8,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    ring1.rotation.y = Math.PI / 5;
    this.group.add(ring1);
    this.aeroRings.push(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.3, 0.018, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x7dd3fc,
      emissiveIntensity: 3.0,
      roughness: 0.1
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2.5;
    ring2.rotation.z = Math.PI / 4;
    this.group.add(ring2);
    this.aeroRings.push(ring2);

    // 5. Swirling Gale Particle System
    this.galeGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.galeCount * 3);
    const lifes = new Float32Array(this.galeCount);
    const sizes = new Float32Array(this.galeCount);
    const radii = new Float32Array(this.galeCount);
    const heights = new Float32Array(this.galeCount);
    const speeds = new Float32Array(this.galeCount);
    const seeds = new Float32Array(this.galeCount);

    for (let i = 0; i < this.galeCount; i++) {
      const i3 = i * 3;
      const r = 0.4 + Math.random() * 1.6;
      const h = (Math.random() - 0.5) * 3.8;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = h;
      positions[i3 + 2] = Math.sin(angle) * r;

      lifes[i] = Math.random();
      sizes[i] = Math.random() * 12.0 + 5.0;
      radii[i] = r;
      heights[i] = h;
      speeds[i] = Math.random() * 1.2 + 0.8;
      seeds[i] = Math.random();
    }

    this.galeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.galeGeometry.setAttribute('aLife', new THREE.BufferAttribute(lifes, 1));
    this.galeGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.galeGeometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    this.galeGeometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
    this.galeGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    this.galeGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    this.galeMaterial = new THREE.ShaderMaterial({
      vertexShader: AIR_GALE_PARTICLE_VERTEX,
      fragmentShader: AIR_GALE_PARTICLE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 1.0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor1: { value: new THREE.Color('#bae6fd') },
        uColor2: { value: new THREE.Color('#ffffff') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.galeParticles = new THREE.Points(this.galeGeometry, this.galeMaterial);
    this.group.add(this.galeParticles);

    // 6. Ethereal Air Point Light
    this.pointLight = new THREE.PointLight(0xbef8fd, 3.5, 16);
    this.group.add(this.pointLight);
  }

  public update(delta: number, time: number) {
    this.vortexMaterial1.uniforms.uTime.value = time;
    this.vortexMaterial2.uniforms.uTime.value = time;
    this.coreMaterial.uniforms.uTime.value = time;
    this.galeMaterial.uniforms.uTime.value = time;

    // Aero ring rotations
    if (this.aeroRings[0]) {
      this.aeroRings[0].rotation.z += delta * 1.2;
    }
    if (this.aeroRings[1]) {
      this.aeroRings[1].rotation.x -= delta * 1.0;
    }

    // Dynamic wind flicker
    const windPulse = Math.sin(time * 5.0) * 0.3 + Math.sin(time * 12.0) * 0.2;
    this.pointLight.intensity = (3.5 + windPulse) * this.intensity;
  }

  public triggerSurge() {
    gsap.to(this.vortexMaterial1.uniforms.uSpeed, {
      value: 8.0,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.vortexMaterial1.uniforms.uSpeed.value = 2.8;
      }
    });

    gsap.to(this.galeMaterial.uniforms.uSpeed, {
      value: 3.5,
      duration: 0.5,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.galeMaterial.uniforms.uSpeed.value = 1.0;
      }
    });

    gsap.to(this.pointLight, {
      intensity: 10.0,
      duration: 0.35,
      yoyo: true,
      repeat: 1
    });
  }

  public dispose() {
    this.vortexMaterial1.dispose();
    this.vortexMaterial2.dispose();
    this.coreMaterial.dispose();
    this.galeMaterial.dispose();
    this.galeGeometry.dispose();
  }
}
