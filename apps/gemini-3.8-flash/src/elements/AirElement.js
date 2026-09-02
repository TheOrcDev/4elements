import * as THREE from 'three';
import {
  airCoreVertexShader,
  airCoreFragmentShader,
  cycloneVertexShader,
  cycloneFragmentShader,
  windParticleVertexShader,
  windParticleFragmentShader
} from '../shaders/airShaders.js';

export class AirElement {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'AirElement';

    this.uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 1.5 },
      uSpinSpeed: { value: 1.8 },
      uHeightScale: { value: 1.0 },
      uIntensity: { value: 0.62 },
      uColorCore: { value: new THREE.Color(0x0284c7) }, // Atmospheric vibrant azure
      uColorGlow: { value: new THREE.Color(0xd97706) }, // Warm amber streamer
      uColorLight: { value: new THREE.Color(0x0284c7) }, // Defined azure streamer body
      uColorGold: { value: new THREE.Color(0xb45309) }
    };

    this.createCore();
    this.createCycloneFunnels();
    this.createWindRibbons();
    this.createWindParticles();
    this.createWindPedestal();
    this.createPointLight();
  }

  createCore() {
  // Gyroscopic eye-of-the-storm orb with tangible volume
  const geo = new THREE.SphereGeometry(1.05, 48, 48);
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: airCoreVertexShader,
      fragmentShader: airCoreFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });

    this.coreMesh = new THREE.Mesh(geo, this.coreMaterial);
    this.coreMesh.renderOrder = 2;
    this.group.add(this.coreMesh);
  }

  createCycloneFunnels() {
    // Two layered funnel cylinders that flare out into an ethereal tornado vortex
    const funnelGeo = new THREE.CylinderGeometry(1.3, 0.35, 3.4, 48, 48, true);

    this.cycloneMaterial = new THREE.ShaderMaterial({
      vertexShader: cycloneVertexShader,
      fragmentShader: cycloneFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.funnels = [];

    // Inner cyclone
    const funnel1 = new THREE.Mesh(funnelGeo, this.cycloneMaterial);
    funnel1.position.y = 0.2;
    funnel1.renderOrder = 1;
    this.group.add(funnel1);
    this.funnels.push(funnel1);

    // Outer cyclone (counter-rotated and slightly scaled)
    const funnel2 = new THREE.Mesh(funnelGeo, this.cycloneMaterial);
    funnel2.position.y = 0.2;
    funnel2.scale.set(1.18, 1.02, 1.18);
    funnel2.rotation.y = Math.PI;
    funnel2.renderOrder = 1;
    this.group.add(funnel2);
    this.funnels.push(funnel2);
  }

  createWindRibbons() {
    this.ribbons = [];

    // Streamlined aerodynamic rings orbiting like gyroscopic wind currents
    const ringConfigs = [
      { radius: 1.9, tube: 0.018, rotX: Math.PI * 0.3, rotZ: 0.2, speed: 1.6 },
      { radius: 2.3, tube: 0.015, rotX: -Math.PI * 0.35, rotZ: 0.5, speed: -1.8 }
    ];

    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.28,
      blending: THREE.NormalBlending
    });

    for (let cfg of ringConfigs) {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 90);
      const mesh = new THREE.Mesh(geo, ribbonMat);
      mesh.rotation.x = cfg.rotX;
      mesh.rotation.z = cfg.rotZ;
      this.group.add(mesh);
      this.ribbons.push({ mesh, speed: cfg.speed });
    }
  }

  createWindParticles() {
    const particleCount = 280;
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      sizes[i] = 0.6 + Math.random() * 0.8;
      speeds[i] = 0.8 + Math.random() * 0.9;

      randoms[i * 3 + 0] = Math.random();
      randoms[i * 3 + 1] = Math.random();
      randoms[i * 3 + 2] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: windParticleVertexShader,
      fragmentShader: windParticleFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.windParticleSystem = new THREE.Points(geo, this.particleMaterial);
    this.group.add(this.windParticleSystem);
  }

  createWindPedestal() {
    const discGeo = new THREE.CylinderGeometry(2.3, 2.6, 0.35, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x40546c,
      roughness: 0.55,
      metalness: 0.2,
      flatShading: false
    });
    this.pedestal = new THREE.Mesh(discGeo, discMat);
    this.pedestal.position.y = -1.8;
    this.pedestal.receiveShadow = false;
    this.group.add(this.pedestal);

    // Glowing wind spiral glyph - subtle altar inscription
    const runeGeo = new THREE.RingGeometry(0.8, 2.1, 32);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0x025682,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.20,
      blending: THREE.NormalBlending
    });
    this.windRune = new THREE.Mesh(runeGeo, runeMat);
    this.windRune.rotation.x = -Math.PI / 2;
    this.windRune.position.y = -1.61;
    this.group.add(this.windRune);
  }

  createPointLight() {
    this.light = new THREE.PointLight(0x0ea5e9, 0.12, 3.5, 2.0);
    this.light.position.set(0, 0, 0);
    this.group.add(this.light);
  }

  update(delta, elapsed) {
    this.uniforms.uTime.value = elapsed;

    // Fast storm spin
    this.coreMesh.rotation.y = elapsed * 1.8;
    this.coreMesh.rotation.z = Math.sin(elapsed * 1.5) * 0.15;

    // Funnels dynamic scale and spin
    this.funnels[0].rotation.y = elapsed * 2.2;
    this.funnels[1].rotation.y = -elapsed * 1.8;

    // Orbiting wind ribbons
    for (let r of this.ribbons) {
      r.mesh.rotation.y += delta * r.speed;
      r.mesh.rotation.x += delta * (r.speed * 0.3);
    }

    // Dynamic gale light intensity
    this.light.intensity = 0.12 + Math.sin(elapsed * 8.0) * 0.02;
    this.windRune.material.opacity = 0.16 + Math.sin(elapsed * 3.5) * 0.03;
  }

  triggerSurge() {
    const origSpeed = this.uniforms.uSpeed.value;
    const origSpin = this.uniforms.uSpinSpeed.value;
    this.uniforms.uSpeed.value = 3.5;
    this.uniforms.uSpinSpeed.value = 3.8;
    this.light.intensity = 1.3;

    setTimeout(() => {
      this.uniforms.uSpeed.value = origSpeed;
      this.uniforms.uSpinSpeed.value = origSpin;
      this.light.intensity = 0.35;
    }, 600);
  }
}
