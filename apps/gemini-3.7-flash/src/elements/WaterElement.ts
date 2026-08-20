import * as THREE from 'three';
import gsap from 'gsap';
import {
  WATER_CORE_VERTEX,
  WATER_CORE_FRAGMENT,
  WATER_RIPPLE_STREAM_VERTEX,
  WATER_RIPPLE_STREAM_FRAGMENT,
  WATER_DROPLET_PARTICLE_VERTEX,
  WATER_DROPLET_PARTICLE_FRAGMENT
} from '../shaders/waterShaders.ts';

export class WaterElement {
  public group: THREE.Group;
  public pointLight: THREE.PointLight;
  private coreMaterial: THREE.ShaderMaterial;
  private streamMaterial1: THREE.ShaderMaterial;
  private streamMaterial2: THREE.ShaderMaterial;
  private dropletGeometry: THREE.BufferGeometry;
  private dropletMaterial: THREE.ShaderMaterial;
  private dropletParticles: THREE.Points;
  private dropletCount = 1400;
  private stream1: THREE.Mesh;
  private stream2: THREE.Mesh;
  private innerPearl: THREE.Mesh;
  public intensity = 1.0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'WaterElement';

    // 1. Water Fluid Sphere Core
    const coreGeo = new THREE.SphereGeometry(1.25, 64, 64);
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: WATER_CORE_VERTEX,
      fragmentShader: WATER_CORE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uWaveHeight: { value: 0.16 },
        uWaveSpeed: { value: 1.5 },
        uWaveFrequency: { value: 3.2 },
        uDeepColor: { value: new THREE.Color('#011b3b') },
        uShallowColor: { value: new THREE.Color('#00e1d9') },
        uFoamColor: { value: new THREE.Color('#ffffff') },
        uLightPos: { value: new THREE.Vector3(5, 8, 5) },
        uRefractionRatio: { value: 0.98 },
        uCausticIntensity: { value: 1.6 }
      },
      transparent: true,
      depthWrite: true
    });
    const coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.group.add(coreMesh);

    // 2. Inner Glowing Aquatic Pearl
    const pearlGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0x55ffff,
      emissive: 0x00a2ff,
      emissiveIntensity: 4.0,
      roughness: 0.1,
      metalness: 0.8
    });
    this.innerPearl = new THREE.Mesh(pearlGeo, pearlMat);
    this.group.add(this.innerPearl);

    // 3. Orbital Liquid Streams
    const streamGeo1 = new THREE.TorusGeometry(2.0, 0.08, 16, 120);
    this.streamMaterial1 = new THREE.ShaderMaterial({
      vertexShader: WATER_RIPPLE_STREAM_VERTEX,
      fragmentShader: WATER_RIPPLE_STREAM_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 3.0 },
        uColor: { value: new THREE.Color('#00c8ff') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.stream1 = new THREE.Mesh(streamGeo1, this.streamMaterial1);
    this.stream1.rotation.x = Math.PI / 2.8;
    this.stream1.rotation.y = Math.PI / 4;
    this.group.add(this.stream1);

    const streamGeo2 = new THREE.TorusGeometry(2.35, 0.06, 16, 120);
    this.streamMaterial2 = new THREE.ShaderMaterial({
      vertexShader: WATER_RIPPLE_STREAM_VERTEX,
      fragmentShader: WATER_RIPPLE_STREAM_FRAGMENT,
      uniforms: {
        uTime: { value: 5 },
        uSpeed: { value: -2.4 },
        uColor: { value: new THREE.Color('#55f0ff') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.stream2 = new THREE.Mesh(streamGeo2, this.streamMaterial2);
    this.stream2.rotation.x = -Math.PI / 3;
    this.stream2.rotation.z = Math.PI / 3;
    this.group.add(this.stream2);

    // 4. Floating Droplet & Bubble Particle System
    this.dropletGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.dropletCount * 3);
    const lifes = new Float32Array(this.dropletCount);
    const sizes = new Float32Array(this.dropletCount);
    const orbitRadii = new Float32Array(this.dropletCount);
    const orbitSpeeds = new Float32Array(this.dropletCount);
    const phases = new Float32Array(this.dropletCount);

    for (let i = 0; i < this.dropletCount; i++) {
      const i3 = i * 3;
      const rad = 1.35 + Math.random() * 1.5;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.2;

      positions[i3] = Math.cos(angle) * rad;
      positions[i3 + 1] = y;
      positions[i3 + 2] = Math.sin(angle) * rad;

      lifes[i] = Math.random();
      sizes[i] = Math.random() * 14.0 + 6.0;
      orbitRadii[i] = rad;
      orbitSpeeds[i] = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.8 + 0.4);
      phases[i] = Math.random() * Math.PI * 2;
    }

    this.dropletGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dropletGeometry.setAttribute('aLife', new THREE.BufferAttribute(lifes, 1));
    this.dropletGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.dropletGeometry.setAttribute('aOrbitRadius', new THREE.BufferAttribute(orbitRadii, 1));
    this.dropletGeometry.setAttribute('aOrbitSpeed', new THREE.BufferAttribute(orbitSpeeds, 1));
    this.dropletGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.dropletMaterial = new THREE.ShaderMaterial({
      vertexShader: WATER_DROPLET_PARTICLE_VERTEX,
      fragmentShader: WATER_DROPLET_PARTICLE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color('#22d3ee') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dropletParticles = new THREE.Points(this.dropletGeometry, this.dropletMaterial);
    this.group.add(this.dropletParticles);

    // 5. Azure Light Source
    this.pointLight = new THREE.PointLight(0x00e1ff, 3.8, 16);
    this.group.add(this.pointLight);
  }

  public update(delta: number, time: number) {
    this.coreMaterial.uniforms.uTime.value = time;
    this.streamMaterial1.uniforms.uTime.value = time;
    this.streamMaterial2.uniforms.uTime.value = time;
    this.dropletMaterial.uniforms.uTime.value = time;

    // Stream orbital rotations
    this.stream1.rotation.z += delta * 0.4;
    this.stream2.rotation.y -= delta * 0.35;

    // Inner pearl subtle breathe
    const pulse = 1.0 + Math.sin(time * 2.5) * 0.08;
    this.innerPearl.scale.set(pulse, pulse, pulse);

    // Oceanic light swell
    const lightSwell = Math.sin(time * 2.0) * 0.4 + Math.cos(time * 3.5) * 0.2;
    this.pointLight.intensity = (3.8 + lightSwell) * this.intensity;
  }

  public triggerSurge() {
    gsap.to(this.coreMaterial.uniforms.uWaveHeight, {
      value: 0.45,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut',
      onComplete: () => {
        this.coreMaterial.uniforms.uWaveHeight.value = 0.16;
      }
    });

    gsap.to(this.coreMaterial.uniforms.uWaveSpeed, {
      value: 4.5,
      duration: 0.6,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.coreMaterial.uniforms.uWaveSpeed.value = 1.5;
      }
    });

    gsap.to(this.stream1.scale, {
      x: 1.35,
      y: 1.35,
      z: 1.35,
      duration: 0.4,
      yoyo: true,
      repeat: 1
    });

    gsap.to(this.pointLight, {
      intensity: 10.0,
      duration: 0.4,
      yoyo: true,
      repeat: 1
    });
  }

  public dispose() {
    this.coreMaterial.dispose();
    this.streamMaterial1.dispose();
    this.streamMaterial2.dispose();
    this.dropletMaterial.dispose();
    this.dropletGeometry.dispose();
  }
}
