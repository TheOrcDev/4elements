import * as THREE from 'three';
import gsap from 'gsap';
import {
  EARTH_CORE_VERTEX,
  EARTH_CORE_FRAGMENT,
  CRYSTAL_SHARD_VERTEX,
  CRYSTAL_SHARD_FRAGMENT,
  EARTH_SPORE_PARTICLE_VERTEX,
  EARTH_SPORE_PARTICLE_FRAGMENT
} from '../shaders/earthShaders.ts';

export class EarthElement {
  public group: THREE.Group;
  public pointLight: THREE.PointLight;
  private coreMaterial: THREE.ShaderMaterial;
  private crystalMaterial: THREE.ShaderMaterial;
  private sporeGeometry: THREE.BufferGeometry;
  private sporeMaterial: THREE.ShaderMaterial;
  private sporeParticles: THREE.Points;
  private sporeCount = 1200;
  private crystalMeshes: THREE.Mesh[] = [];
  private asteroidRing: THREE.Group;
  private asteroids: THREE.Mesh[] = [];
  public intensity = 1.0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'EarthElement';

    // 1. Fractured Tectonic Core
    const coreGeo = new THREE.SphereGeometry(1.25, 64, 64);
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: EARTH_CORE_VERTEX,
      fragmentShader: EARTH_CORE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uDisplacement: { value: 0.22 },
        uPlateScale: { value: 3.5 },
        uRockColorDark: { value: new THREE.Color('#1c1815') },
        uRockColorLight: { value: new THREE.Color('#475569') },
        uMossColor: { value: new THREE.Color('#15803d') },
        uCrystalGlowColor: { value: new THREE.Color('#10b981') },
        uLightPos: { value: new THREE.Vector3(6, 6, 6) },
        uGlowPulse: { value: 1.0 }
      }
    });
    const coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.group.add(coreMesh);

    // 2. Protruding Crystal Shards & Geode Formations
    this.crystalMaterial = new THREE.ShaderMaterial({
      vertexShader: CRYSTAL_SHARD_VERTEX,
      fragmentShader: CRYSTAL_SHARD_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uCrystalColor: { value: new THREE.Color('#059669') },
        uHighlightColor: { value: new THREE.Color('#6ee7b7') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const crystalGeo = new THREE.ConeGeometry(0.18, 0.7, 6);
    crystalGeo.translate(0, 0.35, 0);

    const crystalCount = 14;
    for (let i = 0; i < crystalCount; i++) {
      const crystal = new THREE.Mesh(crystalGeo, this.crystalMaterial);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.15;

      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      crystal.position.copy(pos);
      crystal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      
      const s = 0.6 + Math.random() * 0.7;
      crystal.scale.set(s, s * (1.0 + Math.random() * 0.5), s);

      this.group.add(crystal);
      this.crystalMeshes.push(crystal);
    }

    // 3. Orbiting Asteroid / Geode Debris Field
    this.asteroidRing = new THREE.Group();
    this.asteroidRing.rotation.x = Math.PI / 3.5;
    this.asteroidRing.rotation.y = Math.PI / 8;
    this.group.add(this.asteroidRing);

    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.2
    });

    const asteroidCount = 28;
    for (let i = 0; i < asteroidCount; i++) {
      const aGeo = new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.08, 1);
      const asteroid = new THREE.Mesh(aGeo, asteroidMat);
      
      const angle = (i / asteroidCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const radius = 2.1 + (Math.random() - 0.5) * 0.6;
      const y = (Math.random() - 0.5) * 0.35;

      asteroid.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      
      this.asteroidRing.add(asteroid);
      this.asteroids.push(asteroid);
    }

    // 4. Bio-Spore Particle System
    this.sporeGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sporeCount * 3);
    const lifes = new Float32Array(this.sporeCount);
    const sizes = new Float32Array(this.sporeCount);
    const seeds = new Float32Array(this.sporeCount);

    for (let i = 0; i < this.sporeCount; i++) {
      const i3 = i * 3;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.25 + Math.random() * 1.6;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      lifes[i] = Math.random();
      sizes[i] = Math.random() * 14.0 + 6.0;
      seeds[i] = Math.random();
    }

    this.sporeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sporeGeometry.setAttribute('aLife', new THREE.BufferAttribute(lifes, 1));
    this.sporeGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.sporeGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    this.sporeMaterial = new THREE.ShaderMaterial({
      vertexShader: EARTH_SPORE_PARTICLE_VERTEX,
      fragmentShader: EARTH_SPORE_PARTICLE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color('#34d399') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sporeParticles = new THREE.Points(this.sporeGeometry, this.sporeMaterial);
    this.group.add(this.sporeParticles);

    // 5. Emerald Point Light
    this.pointLight = new THREE.PointLight(0x10b981, 3.5, 14);
    this.group.add(this.pointLight);
  }

  public update(delta: number, time: number) {
    this.coreMaterial.uniforms.uTime.value = time;
    this.crystalMaterial.uniforms.uTime.value = time;
    this.sporeMaterial.uniforms.uTime.value = time;

    // Slow planetary core rotation
    this.group.rotation.y = time * 0.08;

    // Asteroid ring rotation
    this.asteroidRing.rotation.z += delta * 0.25;
    this.asteroids.forEach((ast, idx) => {
      ast.rotation.x += delta * (0.5 + idx * 0.05);
      ast.rotation.y += delta * (0.3 + idx * 0.03);
    });

    // Crystalline pulse
    const pulse = 1.0 + Math.sin(time * 2.0) * 0.15;
    this.coreMaterial.uniforms.uGlowPulse.value = pulse;

    this.pointLight.intensity = (3.5 + Math.sin(time * 2.0) * 0.5) * this.intensity;
  }

  public triggerSurge() {
    gsap.to(this.coreMaterial.uniforms.uGlowPulse, {
      value: 3.5,
      duration: 0.35,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      onComplete: () => {
        this.coreMaterial.uniforms.uGlowPulse.value = 1.0;
      }
    });

    gsap.to(this.coreMaterial.uniforms.uDisplacement, {
      value: 0.45,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.coreMaterial.uniforms.uDisplacement.value = 0.22;
      }
    });

    // Levitate crystal shards outward
    this.crystalMeshes.forEach(crystal => {
      const origScale = crystal.scale.clone();
      gsap.to(crystal.scale, {
        x: origScale.x * 1.5,
        y: origScale.y * 1.8,
        z: origScale.z * 1.5,
        duration: 0.3,
        yoyo: true,
        repeat: 1
      });
    });

    gsap.to(this.pointLight, {
      intensity: 9.0,
      duration: 0.3,
      yoyo: true,
      repeat: 1
    });
  }

  public dispose() {
    this.coreMaterial.dispose();
    this.crystalMaterial.dispose();
    this.sporeMaterial.dispose();
    this.sporeGeometry.dispose();
  }
}
