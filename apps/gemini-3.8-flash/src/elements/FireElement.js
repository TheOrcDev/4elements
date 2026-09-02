import * as THREE from 'three';
import {
  fireCoreVertexShader,
  fireCoreFragmentShader,
  flameTongueVertexShader,
  flameTongueFragmentShader,
  emberVertexShader,
  emberFragmentShader
} from '../shaders/fireShaders.js';

export class FireElement {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FireElement';

    this.uniforms = {
      uTime: { value: 0 },
      uDisplacement: { value: 0.38 },
      uSpeed: { value: 0.85 },
      uIntensity: { value: 0.50 },
      uColorCore: { value: new THREE.Color(0xd97706) }, // Warm molten amber
      uColorMid: { value: new THREE.Color(0xb45309) },  // Fierce molten orange
      uColorRim: { value: new THREE.Color(0x991b1b) },  // Deep crimson
      uColorDark: { value: new THREE.Color(0x150300) }, // Smoldering dark basalt
      uColorBase: { value: new THREE.Color(0xb45309) },
      uColorTip: { value: new THREE.Color(0x7f1d1d) }
    };

    this.createCore();
    this.createFlameTongues();
    this.createEmbers();
    this.createOrbitingMeteors();
    this.createLavaPedestal();
    this.createPointLight();
  }

  createCore() {
    // Highly tessellated sphere for smooth wave displacement
    const geo = new THREE.SphereGeometry(1.2, 64, 64);
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: fireCoreVertexShader,
      fragmentShader: fireCoreFragmentShader,
      uniforms: this.uniforms,
      wireframe: false,
      side: THREE.FrontSide
    });

    this.coreMesh = new THREE.Mesh(geo, this.coreMaterial);
    this.coreMesh.castShadow = false;
    this.group.add(this.coreMesh);
  }

  createFlameTongues() {
    // 3 overlapping translucent flame shells rotated at angles for deep volumetric look
    const geo = new THREE.ConeGeometry(1.4, 3.2, 32, 32, true);
    geo.translate(0, 0.4, 0);

    this.flameTongueMaterial = new THREE.ShaderMaterial({
      vertexShader: flameTongueVertexShader,
      fragmentShader: flameTongueFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });

    this.flameShells = [];
    for (let i = 0; i < 1; i++) {
      const mesh = new THREE.Mesh(geo, this.flameTongueMaterial);
      mesh.rotation.y = 0;
      mesh.scale.set(1.05, 1.0, 1.05);
      this.group.add(mesh);
      this.flameShells.push(mesh);
    }
  }

  createEmbers() {
    const emberCount = 260;
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(emberCount * 3);
    const sizes = new Float32Array(emberCount);
    const speeds = new Float32Array(emberCount);
    const randoms = new Float32Array(emberCount * 3);

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      sizes[i] = 0.5 + Math.random() * 0.9;
      speeds[i] = 0.6 + Math.random() * 0.8;

      randoms[i * 3 + 0] = Math.random();
      randoms[i * 3 + 1] = Math.random();
      randoms[i * 3 + 2] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

    this.emberMaterial = new THREE.ShaderMaterial({
      vertexShader: emberVertexShader,
      fragmentShader: emberFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.emberSystem = new THREE.Points(geo, this.emberMaterial);
    this.group.add(this.emberSystem);
  }

  createOrbitingMeteors() {
    this.meteors = [];
    this.meteorOrbit = new THREE.Group();
    this.group.add(this.meteorOrbit);

    const meteorGeo = new THREE.DodecahedronGeometry(0.18, 1);
    const meteorMat = new THREE.MeshStandardMaterial({
      color: 0x483025,
      emissive: 0x330a00,
      emissiveIntensity: 0.12,
      roughness: 0.80,
      metalness: 0.10,
      flatShading: true
    });

    const count = 7;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(meteorGeo, meteorMat);
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.1 + Math.sin(i) * 0.3;
      const height = (Math.random() - 0.5) * 0.8;
      
      mesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      mesh.scale.setScalar(0.7 + Math.random() * 0.7);

      this.meteorOrbit.add(mesh);
      this.meteors.push({
        mesh,
        angle,
        radius,
        speed: 0.7 + Math.random() * 0.5,
        rotSpeed: (Math.random() - 0.5) * 3
      });
    }

    // Fiery rune orbit ring
    const ringGeo = new THREE.TorusGeometry(2.3, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x882000,
      transparent: true,
      opacity: 0.24,
      blending: THREE.NormalBlending
    });
    this.fireRing = new THREE.Mesh(ringGeo, ringMat);
    this.fireRing.rotation.x = Math.PI / 2.3;
    this.group.add(this.fireRing);
  }

  createLavaPedestal() {
    // Pedestal disc with glowing molten fissures
    const discGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.35, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x483e32,
      roughness: 0.65,
      metalness: 0.15,
      flatShading: false
    });
    this.pedestal = new THREE.Mesh(discGeo, discMat);
    this.pedestal.position.y = -1.8;
    this.pedestal.receiveShadow = false;
    this.group.add(this.pedestal);

    // Glowing magma rune circle inside pedestal - subtle engraved altar glyph
    const runeGeo = new THREE.RingGeometry(1.0, 2.2, 32);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0x6e1600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.16,
      blending: THREE.NormalBlending
    });
    this.magmaRune = new THREE.Mesh(runeGeo, runeMat);
    this.magmaRune.rotation.x = -Math.PI / 2;
    this.magmaRune.position.y = -1.61;
    this.group.add(this.magmaRune);
  }

  createPointLight() {
    this.light = new THREE.PointLight(0xd9480f, 0.15, 3.5, 2.0);
    this.light.position.set(0, 0, 0);
    this.group.add(this.light);
  }

  update(delta, elapsed) {
    this.uniforms.uTime.value = elapsed;

    // Flickering core and flame rotation
    this.coreMesh.rotation.y = elapsed * 0.35;
    this.coreMesh.rotation.x = Math.sin(elapsed * 0.8) * 0.1;

    for (let i = 0; i < this.flameShells.length; i++) {
      this.flameShells[i].rotation.y = (i * Math.PI * 2) / 3 + elapsed * (0.6 + i * 0.2);
      this.flameShells[i].scale.y = 1.0 + Math.sin(elapsed * 4.0 + i) * 0.08;
    }

    // Dynamic light flicker
    this.light.intensity = 0.15 + Math.sin(elapsed * 12.0) * 0.03;
    this.magmaRune.material.opacity = 0.15 + Math.sin(elapsed * 3.0) * 0.03;

    // Orbiting meteors
    for (let m of this.meteors) {
      m.angle += delta * m.speed;
      m.mesh.position.x = Math.cos(m.angle) * m.radius;
      m.mesh.position.z = Math.sin(m.angle) * m.radius;
      m.mesh.rotation.x += delta * m.rotSpeed;
      m.mesh.rotation.y += delta * m.rotSpeed;
    }
    this.fireRing.rotation.z = elapsed * 0.2;
  }

  triggerSurge() {
    // Powerful burst when clicked or activated
    const origDisplacement = this.uniforms.uDisplacement.value;
    const origIntensity = this.uniforms.uIntensity.value;
    this.uniforms.uDisplacement.value = 0.5;
    this.uniforms.uIntensity.value = 1.1;
    this.light.intensity = 1.6;

    setTimeout(() => {
      this.uniforms.uDisplacement.value = origDisplacement;
      this.uniforms.uIntensity.value = origIntensity;
      this.light.intensity = 0.45;
    }, 600);
  }
}
