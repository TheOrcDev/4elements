import * as THREE from 'three';
import gsap from 'gsap';
import {
  FIRE_CORE_VERTEX,
  FIRE_CORE_FRAGMENT,
  FIRE_CORONA_VERTEX,
  FIRE_CORONA_FRAGMENT,
  EMBER_PARTICLE_VERTEX,
  EMBER_PARTICLE_FRAGMENT
} from '../shaders/fireShaders.ts';

export class FireElement {
  public group: THREE.Group;
  public pointLight: THREE.PointLight;
  private coreMaterial: THREE.ShaderMaterial;
  private coronaMaterial1: THREE.ShaderMaterial;
  private coronaMaterial2: THREE.ShaderMaterial;
  private emberGeometry: THREE.BufferGeometry;
  private emberMaterial: THREE.ShaderMaterial;
  private emberParticles: THREE.Points;
  private emberCount = 1800;
  private emberPositions: Float32Array;
  private emberLifes: Float32Array;
  private emberVelocities: Float32Array;
  private emberSizes: Float32Array;
  private emberSeeds: Float32Array;
  private magmaRings: THREE.Mesh[] = [];
  public intensity = 1.0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FireElement';

    // 1. Core Fire Sphere
    const coreGeo = new THREE.SphereGeometry(1.25, 64, 64);
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: FIRE_CORE_VERTEX,
      fragmentShader: FIRE_CORE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uDisplacement: { value: 0.38 },
        uSpeed: { value: 1.8 },
        uTurbulence: { value: 1.5 },
        uIntensity: { value: 1.35 },
        uColorCore: { value: new THREE.Color('#fff7c2') },
        uColorMid: { value: new THREE.Color('#ff7b00') },
        uColorOuter: { value: new THREE.Color('#dc143c') },
        uColorDark: { value: new THREE.Color('#220200') }
      },
      wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.group.add(coreMesh);

    // 2. Dual Corona Halos (Volumetric Flame Shells)
    const coronaGeo1 = new THREE.SphereGeometry(1.4, 48, 48);
    this.coronaMaterial1 = new THREE.ShaderMaterial({
      vertexShader: FIRE_CORONA_VERTEX,
      fragmentShader: FIRE_CORONA_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uExpansion: { value: 0.15 },
        uColor: { value: new THREE.Color('#ff4d00') }
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    });
    const coronaMesh1 = new THREE.Mesh(coronaGeo1, this.coronaMaterial1);
    this.group.add(coronaMesh1);

    const coronaGeo2 = new THREE.SphereGeometry(1.6, 48, 48);
    this.coronaMaterial2 = new THREE.ShaderMaterial({
      vertexShader: FIRE_CORONA_VERTEX,
      fragmentShader: FIRE_CORONA_FRAGMENT,
      uniforms: {
        uTime: { value: 10 },
        uExpansion: { value: 0.25 },
        uColor: { value: new THREE.Color('#ff1a00') }
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    });
    const coronaMesh2 = new THREE.Mesh(coronaGeo2, this.coronaMaterial2);
    this.group.add(coronaMesh2);

    // 3. Orbiting Magma / Solar Plasma Rings
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.04, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xff3700,
      emissive: 0xff4400,
      emissiveIntensity: 3.0,
      roughness: 0.2
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    this.group.add(ring1);
    this.magmaRings.push(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.4, 0.025, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 4.0,
      roughness: 0.1
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 5;
    this.group.add(ring2);
    this.magmaRings.push(ring2);

    // 4. Ember Particle System
    this.emberGeometry = new THREE.BufferGeometry();
    this.emberPositions = new Float32Array(this.emberCount * 3);
    this.emberLifes = new Float32Array(this.emberCount);
    this.emberVelocities = new Float32Array(this.emberCount * 3);
    this.emberSizes = new Float32Array(this.emberCount);
    this.emberSeeds = new Float32Array(this.emberCount);

    for (let i = 0; i < this.emberCount; i++) {
      this.resetEmber(i, true);
    }

    this.emberGeometry.setAttribute('position', new THREE.BufferAttribute(this.emberPositions, 3));
    this.emberGeometry.setAttribute('aLife', new THREE.BufferAttribute(this.emberLifes, 1));
    this.emberGeometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.emberVelocities, 3));
    this.emberGeometry.setAttribute('aSize', new THREE.BufferAttribute(this.emberSizes, 1));
    this.emberGeometry.setAttribute('aSeed', new THREE.BufferAttribute(this.emberSeeds, 1));

    this.emberMaterial = new THREE.ShaderMaterial({
      vertexShader: EMBER_PARTICLE_VERTEX,
      fragmentShader: EMBER_PARTICLE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor1: { value: new THREE.Color('#ffdd55') },
        uColor2: { value: new THREE.Color('#ff2200') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.emberParticles = new THREE.Points(this.emberGeometry, this.emberMaterial);
    this.group.add(this.emberParticles);

    // 5. Dynamic Flickering Point Light
    this.pointLight = new THREE.PointLight(0xff5500, 4.0, 16);
    this.group.add(this.pointLight);
  }

  private resetEmber(i: number, randomLife = false) {
    const i3 = i * 3;
    // Spawn within or near core sphere
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * 1.25;
    const sinPhi = Math.sin(phi);

    this.emberPositions[i3] = r * sinPhi * Math.cos(theta);
    this.emberPositions[i3 + 1] = r * sinPhi * Math.sin(theta);
    this.emberPositions[i3 + 2] = r * Math.cos(phi);

    this.emberLifes[i] = randomLife ? Math.random() : 1.0;
    
    // Upward velocity with radial burst
    this.emberVelocities[i3] = (Math.random() - 0.5) * 0.8 + this.emberPositions[i3] * 0.3;
    this.emberVelocities[i3 + 1] = Math.random() * 1.8 + 0.8; // Strong upward draft
    this.emberVelocities[i3 + 2] = (Math.random() - 0.5) * 0.8 + this.emberPositions[i3 + 2] * 0.3;

    this.emberSizes[i] = Math.random() * 18.0 + 8.0;
    this.emberSeeds[i] = Math.random();
  }

  public update(delta: number, time: number) {
    // Update shader uniforms
    this.coreMaterial.uniforms.uTime.value = time;
    this.coronaMaterial1.uniforms.uTime.value = time * 1.2;
    this.coronaMaterial2.uniforms.uTime.value = time * 0.9;
    this.emberMaterial.uniforms.uTime.value = time;

    // Rotate magma rings
    if (this.magmaRings[0]) {
      this.magmaRings[0].rotation.z += delta * 0.5;
      this.magmaRings[0].rotation.y += delta * 0.3;
    }
    if (this.magmaRings[1]) {
      this.magmaRings[1].rotation.x += delta * 0.4;
      this.magmaRings[1].rotation.z -= delta * 0.6;
    }

    // Flicker light
    const flicker = Math.sin(time * 18.0) * 0.3 + Math.sin(time * 31.0) * 0.2 + Math.cos(time * 9.0) * 0.25;
    this.pointLight.intensity = (4.0 + flicker) * this.intensity;

    // Update Ember particles physics
    const posAttr = this.emberGeometry.attributes.position as THREE.BufferAttribute;
    const lifeAttr = this.emberGeometry.attributes.aLife as THREE.BufferAttribute;
    const pos = this.emberPositions;
    const life = this.emberLifes;
    const vel = this.emberVelocities;

    for (let i = 0; i < this.emberCount; i++) {
      const i3 = i * 3;
      life[i] -= delta * (0.35 + this.emberSeeds[i] * 0.4);

      if (life[i] <= 0.0) {
        this.resetEmber(i, false);
      } else {
        pos[i3] += vel[i3] * delta;
        pos[i3 + 1] += vel[i3 + 1] * delta;
        pos[i3 + 2] += vel[i3 + 2] * delta;
      }
    }

    posAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;
  }

  public triggerSurge() {
    gsap.to(this.coreMaterial.uniforms.uDisplacement, {
      value: 0.85,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      onComplete: () => {
        this.coreMaterial.uniforms.uDisplacement.value = 0.38;
      }
    });

    gsap.to(this.coreMaterial.uniforms.uIntensity, {
      value: 2.8,
      duration: 0.25,
      yoyo: true,
      repeat: 1,
      ease: 'power1.out',
      onComplete: () => {
        this.coreMaterial.uniforms.uIntensity.value = 1.35;
      }
    });

    gsap.to(this.pointLight, {
      intensity: 12.0,
      duration: 0.3,
      yoyo: true,
      repeat: 1
    });

    // Burst all embers outward
    for (let i = 0; i < this.emberCount; i++) {
      const i3 = i * 3;
      this.emberVelocities[i3] *= 2.5;
      this.emberVelocities[i3 + 1] = Math.random() * 4.0 + 2.0;
      this.emberVelocities[i3 + 2] *= 2.5;
    }
  }

  public dispose() {
    this.coreMaterial.dispose();
    this.coronaMaterial1.dispose();
    this.coronaMaterial2.dispose();
    this.emberMaterial.dispose();
    this.emberGeometry.dispose();
  }
}
