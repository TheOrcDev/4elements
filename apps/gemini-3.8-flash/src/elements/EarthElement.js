import * as THREE from 'three';
import {
  earthRockVertexShader,
  earthRockFragmentShader,
  crystalVertexShader,
  crystalFragmentShader,
  sporeVertexShader,
  sporeFragmentShader
} from '../shaders/earthShaders.js';

export class EarthElement {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'EarthElement';

    this.uniforms = {
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uVeinGlow: { value: 0.55 },
      uColorRock: { value: new THREE.Color(0x62594e) }, // Natural warm granite rock
      uColorMoss: { value: new THREE.Color(0x283d16) }, // Deep organic forest moss
      uColorVein: { value: new THREE.Color(0x059669) }, // Rich emerald vein
      uColorInner: { value: new THREE.Color(0x044e36) }, // Deep emerald tourmaline core
      uColorOuter: { value: new THREE.Color(0x059669) }  // Vibrant faceted crystal
    };

    this.createRockCore();
    this.createCrystals();
    this.createOrbitingBoulders();
    this.createGeomancyRing();
    this.createSpores();
    this.createStonePedestal();
    this.createPointLight();
  }

  createRockCore() {
    // Icosahedron with subdivisions for organic rocky geometry
    const geo = new THREE.IcosahedronGeometry(1.2, 5);
    this.rockMaterial = new THREE.ShaderMaterial({
      vertexShader: earthRockVertexShader,
      fragmentShader: earthRockFragmentShader,
      uniforms: this.uniforms
    });

    this.rockMesh = new THREE.Mesh(geo, this.rockMaterial);
    this.rockMesh.castShadow = false;
    this.rockMesh.receiveShadow = false;
    this.group.add(this.rockMesh);
  }

  createCrystals() {
    // Large emerald crystal clusters sprouting from the rock
    this.crystalGroup = new THREE.Group();
    this.group.add(this.crystalGroup);

    const crystalGeo = new THREE.CylinderGeometry(0.02, 0.18, 1.1, 6);
    crystalGeo.translate(0, 0.55, 0); // Origin at base

    this.crystalMaterial = new THREE.ShaderMaterial({
      vertexShader: crystalVertexShader,
      fragmentShader: crystalFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending
    });

    // Sprout crystals around the sphere
    const crystalPositions = [
      { pos: new THREE.Vector3(0, 1.1, 0), rot: new THREE.Vector3(0, 0, 0.2), scale: 1.3 },
      { pos: new THREE.Vector3(0.3, 1.0, 0.2), rot: new THREE.Vector3(0.3, 0.2, -0.4), scale: 1.0 },
      { pos: new THREE.Vector3(-0.4, 0.9, -0.3), rot: new THREE.Vector3(-0.4, 0.5, 0.3), scale: 1.1 },
      { pos: new THREE.Vector3(0.9, 0.3, 0.4), rot: new THREE.Vector3(0.2, 0, -1.3), scale: 1.1 },
      { pos: new THREE.Vector3(-0.8, -0.2, 0.6), rot: new THREE.Vector3(0.6, 0.4, 1.4), scale: 0.95 },
      { pos: new THREE.Vector3(0.4, -0.9, -0.4), rot: new THREE.Vector3(2.5, 0.2, 0.1), scale: 1.2 },
      { pos: new THREE.Vector3(-0.7, 0.6, 0.5), rot: new THREE.Vector3(0.4, 0.8, 0.9), scale: 0.85 },
      { pos: new THREE.Vector3(0.8, -0.5, -0.5), rot: new THREE.Vector3(-1.2, 0.3, -1.1), scale: 1.0 }
    ];

    for (let c of crystalPositions) {
      const mesh = new THREE.Mesh(crystalGeo, this.crystalMaterial);
      mesh.position.copy(c.pos);
      mesh.rotation.set(c.rot.x, c.rot.y, c.rot.z);
      mesh.scale.setScalar(c.scale);
      this.crystalGroup.add(mesh);
    }
  }

  createOrbitingBoulders() {
    this.boulders = [];
    this.boulderGroup = new THREE.Group();
    this.group.add(this.boulderGroup);

    const rockGeos = [
      new THREE.DodecahedronGeometry(0.2, 1),
      new THREE.IcosahedronGeometry(0.22, 1),
      new THREE.DodecahedronGeometry(0.16, 0)
    ];

    const boulderMat = new THREE.MeshStandardMaterial({
      color: 0x6e665a,
      roughness: 0.75,
      metalness: 0.15,
      flatShading: true
    });

    const count = 10;
    for (let i = 0; i < count; i++) {
      const geo = rockGeos[i % rockGeos.length];
      const mesh = new THREE.Mesh(geo, boulderMat);
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.0 + Math.sin(i * 2.3) * 0.4;
      const height = (Math.random() - 0.5) * 0.8;

      mesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.scale.setScalar(0.7 + Math.random() * 0.7);

      this.boulderGroup.add(mesh);
      this.boulders.push({
        mesh,
        angle,
        radius,
        baseY: height,
        speed: 0.4 + Math.random() * 0.3,
        rotSpeedX: (Math.random() - 0.5) * 1.5,
        rotSpeedY: (Math.random() - 0.5) * 1.5
      });
    }
  }

  createGeomancyRing() {
    // Glowing emerald runic geomancy circle
    const ringGeo = new THREE.TorusGeometry(2.2, 0.014, 16, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0b7348,
      transparent: true,
      opacity: 0.22,
      blending: THREE.NormalBlending
    });
    this.geomancyRing = new THREE.Mesh(ringGeo, ringMat);
    this.geomancyRing.rotation.x = Math.PI / 2.2;
    this.geomancyRing.rotation.y = 0.15;
    this.group.add(this.geomancyRing);
  }

  createSpores() {
    const sporeCount = 180;
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(sporeCount * 3);
    const sizes = new Float32Array(sporeCount);
    const speeds = new Float32Array(sporeCount);
    const randoms = new Float32Array(sporeCount * 3);

    for (let i = 0; i < sporeCount; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      sizes[i] = 0.5 + Math.random() * 0.8;
      speeds[i] = 0.4 + Math.random() * 0.6;

      randoms[i * 3 + 0] = Math.random();
      randoms[i * 3 + 1] = Math.random();
      randoms[i * 3 + 2] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

    this.sporeMaterial = new THREE.ShaderMaterial({
      vertexShader: sporeVertexShader,
      fragmentShader: sporeFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.sporeSystem = new THREE.Points(geo, this.sporeMaterial);
    this.group.add(this.sporeSystem);
  }

  createStonePedestal() {
    const discGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.35, 8); // Octagonal ancient dais
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x483e32,
      roughness: 0.7,
      metalness: 0.15,
      flatShading: false
    });
    this.pedestal = new THREE.Mesh(discGeo, discMat);
    this.pedestal.position.y = -1.8;
    this.pedestal.receiveShadow = false;
    this.group.add(this.pedestal);

    // Glowing green geomancy ground glyph - subtle altar inscription
    const runeGeo = new THREE.RingGeometry(0.9, 2.2, 8);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0x0a4a28,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.20,
      blending: THREE.NormalBlending
    });
    this.earthRune = new THREE.Mesh(runeGeo, runeMat);
    this.earthRune.rotation.x = -Math.PI / 2;
    this.earthRune.position.y = -1.61;
    this.group.add(this.earthRune);
  }

  createPointLight() {
    this.light = new THREE.PointLight(0x0fa870, 0.15, 3.5, 2.0);
    this.light.position.set(0, 0, 0);
    this.group.add(this.light);
  }

  update(delta, elapsed) {
    this.uniforms.uTime.value = elapsed;

    // Slow, powerful celestial rotation of earth core
    this.rockMesh.rotation.y = elapsed * 0.15;
    this.crystalGroup.rotation.y = elapsed * 0.15;

    // Orbiting boulders
    for (let b of this.boulders) {
      b.angle += delta * b.speed;
      b.mesh.position.x = Math.cos(b.angle) * b.radius;
      b.mesh.position.z = Math.sin(b.angle) * b.radius;
      b.mesh.position.y = b.baseY + Math.sin(elapsed * 1.5 + b.angle) * 0.12;
      b.mesh.rotation.x += delta * b.rotSpeedX;
      b.mesh.rotation.y += delta * b.rotSpeedY;
    }

    // Geomancy ring wobble
    this.geomancyRing.rotation.z = elapsed * 0.15;

    // Pulsing vein light
    const pulse = Math.sin(elapsed * 2.0) * 0.04;
    this.light.intensity = 0.15 + pulse;
    this.earthRune.material.opacity = 0.15 + Math.sin(elapsed * 1.8) * 0.03;
  }

  triggerSurge() {
    this.uniforms.uPulse.value = 1.0;
    this.uniforms.uVeinGlow.value = 1.4;
    this.light.intensity = 1.3;

    let startTime = performance.now();
    const animateBack = () => {
      const now = performance.now();
      const progress = (now - startTime) / 800;
      if (progress < 1.0) {
        this.uniforms.uPulse.value = 1.0 - progress;
        this.uniforms.uVeinGlow.value = 0.35 + (1.0 - progress) * 0.45;
        requestAnimationFrame(animateBack);
      } else {
        this.uniforms.uPulse.value = 0.0;
        this.uniforms.uVeinGlow.value = 0.35;
        this.light.intensity = 0.35;
      }
    };
    animateBack();
  }
}
