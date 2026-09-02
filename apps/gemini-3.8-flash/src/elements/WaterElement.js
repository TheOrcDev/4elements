import * as THREE from 'three';
import {
  waterCoreVertexShader,
  waterCoreFragmentShader,
  waterRingVertexShader,
  waterRingFragmentShader,
  bubbleVertexShader,
  bubbleFragmentShader
} from '../shaders/waterShaders.js';

export class WaterElement {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'WaterElement';

    this.uniforms = {
      uTime: { value: 0 },
      uWaveHeight: { value: 0.16 },
      uWaveSpeed: { value: 1.2 },
      uOpacity: { value: 0.88 },
      uColorDeep: { value: new THREE.Color(0x01142b) },   // Deep oceanic abyss
      uColorShallow: { value: new THREE.Color(0x0369a1) },// Rich azure
      uColorFoam: { value: new THREE.Color(0x0ea5e9) },   // Soft cyan seafoam
      uColor: { value: new THREE.Color(0x0284c7) }
    };

    this.createCore();
    this.createWaterRings();
    this.createBubbles();
    this.createFloatingDroplets();
    this.createBasinPedestal();
    this.createPointLight();
  }

  createCore() {
    // Highly tessellated sphere
    const geo = new THREE.SphereGeometry(1.25, 64, 64);
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: waterCoreVertexShader,
      fragmentShader: waterCoreFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.FrontSide
    });

    this.coreMesh = new THREE.Mesh(geo, this.coreMaterial);
    this.coreMesh.castShadow = false;
    this.group.add(this.coreMesh);
  }

  createWaterRings() {
    this.rings = [];

    // Outer swirling water ring
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.14, 24, 100);
    this.ringMat1 = new THREE.ShaderMaterial({
      vertexShader: waterRingVertexShader,
      fragmentShader: waterRingFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });

    const ring1 = new THREE.Mesh(ringGeo1, this.ringMat1);
    ring1.rotation.x = Math.PI * 0.35;
    ring1.rotation.y = 0.2;
    this.group.add(ring1);
    this.rings.push({ mesh: ring1, rotX: 0.4, rotY: 0.7, rotZ: 0.2 });

    // Secondary counter-flow ring
    const ringGeo2 = new THREE.TorusGeometry(2.5, 0.08, 16, 80);
    const ringMat2 = new THREE.ShaderMaterial({
      vertexShader: waterRingVertexShader,
      fragmentShader: waterRingFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });

    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI * 0.4;
    ring2.rotation.z = 0.5;
    this.group.add(ring2);
    this.rings.push({ mesh: ring2, rotX: -0.3, rotY: -0.5, rotZ: -0.3 });
  }

  createBubbles() {
    const bubbleCount = 180;
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(bubbleCount * 3);
    const sizes = new Float32Array(bubbleCount);
    const speeds = new Float32Array(bubbleCount);
    const randoms = new Float32Array(bubbleCount * 3);

    for (let i = 0; i < bubbleCount; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      sizes[i] = 0.6 + Math.random() * 0.9;
      speeds[i] = 0.5 + Math.random() * 0.7;

      randoms[i * 3 + 0] = Math.random();
      randoms[i * 3 + 1] = Math.random();
      randoms[i * 3 + 2] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

    this.bubbleMaterial = new THREE.ShaderMaterial({
      vertexShader: bubbleVertexShader,
      fragmentShader: bubbleFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.bubbleSystem = new THREE.Points(geo, this.bubbleMaterial);
    this.group.add(this.bubbleSystem);
  }

  createFloatingDroplets() {
    this.droplets = [];
    const dropGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const dropMat = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      transmission: 0.82,
      opacity: 0.88,
      transparent: true,
      roughness: 0.18,
      ior: 1.333, // Water refractive index
      emissive: 0x0369a1,
      emissiveIntensity: 0.12
    });

    const count = 12;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(dropGeo, dropMat);
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.7 + Math.sin(i * 1.5) * 0.4;
      const height = (Math.random() - 0.5) * 1.4;

      mesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      mesh.scale.setScalar(0.6 + Math.random() * 0.8);

      this.group.add(mesh);
      this.droplets.push({
        mesh,
        angle,
        radius,
        baseY: height,
        speed: 0.8 + Math.random() * 0.6,
        bobFreq: 2.0 + Math.random() * 2.0
      });
    }
  }

  createBasinPedestal() {
    const discGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.35, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x3d5068,
      roughness: 0.60,
      metalness: 0.2,
      flatShading: false
    });
    this.pedestal = new THREE.Mesh(discGeo, discMat);
    this.pedestal.position.y = -1.8;
    this.pedestal.receiveShadow = false;
    this.group.add(this.pedestal);

    // Glowing pool ring
    const poolGeo = new THREE.RingGeometry(0.8, 2.2, 32);
    const poolMat = new THREE.MeshBasicMaterial({
      color: 0x005588,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
      blending: THREE.NormalBlending
    });
    this.poolRune = new THREE.Mesh(poolGeo, poolMat);
    this.poolRune.rotation.x = -Math.PI / 2;
    this.poolRune.position.y = -1.61;
    this.group.add(this.poolRune);
  }

  createPointLight() {
    this.light = new THREE.PointLight(0x0284c7, 0.12, 3.5, 2.0);
    this.light.position.set(0, 0, 0);
    this.group.add(this.light);
  }

  update(delta, elapsed) {
    this.uniforms.uTime.value = elapsed;

    // Gentle liquid precession
    this.coreMesh.rotation.y = elapsed * 0.25;
    this.coreMesh.rotation.x = Math.sin(elapsed * 0.5) * 0.08;

    // Water rings rotation
    for (let r of this.rings) {
      r.mesh.rotation.z += delta * r.rotZ;
      r.mesh.rotation.y += delta * r.rotY;
    }

    // Floating droplets bobbing and orbiting
    for (let d of this.droplets) {
      d.angle += delta * d.speed;
      d.mesh.position.x = Math.cos(d.angle) * d.radius;
      d.mesh.position.z = Math.sin(d.angle) * d.radius;
      d.mesh.position.y = d.baseY + Math.sin(elapsed * d.bobFreq) * 0.22;
      // Droplet elongation along velocity
      d.mesh.scale.y = 1.0 + Math.cos(elapsed * d.bobFreq) * 0.15;
    }

    // Light pulse
    this.light.intensity = 0.12 + Math.sin(elapsed * 4.0) * 0.02;
    this.poolRune.material.opacity = 0.16 + Math.sin(elapsed * 2.5) * 0.03;
  }

  triggerSurge() {
    const origHeight = this.uniforms.uWaveHeight.value;
    const origSpeed = this.uniforms.uWaveSpeed.value;
    this.uniforms.uWaveHeight.value = 0.35;
    this.uniforms.uWaveSpeed.value = 2.4;
    this.light.intensity = 1.4;

    setTimeout(() => {
      this.uniforms.uWaveHeight.value = origHeight;
      this.uniforms.uWaveSpeed.value = origSpeed;
      this.light.intensity = 0.40;
    }, 600);
  }
}
