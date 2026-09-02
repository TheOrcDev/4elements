import * as THREE from 'three';

export class SanctumEnvironment {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SanctumEnvironment';

    this.createArenaFloor();
    this.createConvergenceNexus();
    this.createElementalBeams();
    this.createPerimeterMonoliths();
  }

  createArenaFloor() {
    // Altar stone floor with balanced ancient texture
    const floorGeo = new THREE.CylinderGeometry(11.5, 12.5, 0.5, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x242c38,
      roughness: 0.65,
      metalness: 0.15,
      flatShading: false
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.position.y = -2.1;
    this.floor.receiveShadow = false;
    this.group.add(this.floor);

      // Outer concentric celestial bronze rune ring
    const ringGeo1 = new THREE.RingGeometry(8.5, 8.8, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x283b4d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      blending: THREE.NormalBlending
    });
    this.runeRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.runeRing1.rotation.x = -Math.PI / 2;
    this.runeRing1.position.y = -1.84;
    this.group.add(this.runeRing1);

    // Inner concentric ring
    const ringGeo2 = new THREE.RingGeometry(3.5, 3.65, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x223645,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.26,
      blending: THREE.NormalBlending
    });
    this.runeRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.runeRing2.rotation.x = -Math.PI / 2;
    this.runeRing2.position.y = -1.84;
    this.group.add(this.runeRing2);

    // Cross-pathway lines connecting cardinal points (Fire, Water, Earth, Air)
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x1e303d,
      transparent: true,
      opacity: 0.22,
      blending: THREE.NormalBlending
    });
    const lineXGeo = new THREE.PlaneGeometry(15.0, 0.12);
    const lineX = new THREE.Mesh(lineXGeo, lineMat);
    lineX.rotation.x = -Math.PI / 2;
    lineX.position.y = -1.83;
    this.group.add(lineX);

    const lineZGeo = new THREE.PlaneGeometry(0.12, 15.0);
    const lineZ = new THREE.Mesh(lineZGeo, lineMat);
    lineZ.rotation.x = -Math.PI / 2;
    lineZ.position.y = -1.83;
    this.group.add(lineZ);
  }

  createConvergenceNexus() {
    this.nexusGroup = new THREE.Group();
    this.nexusGroup.position.set(0, -0.2, 0);
    this.group.add(this.nexusGroup);

    // Central ancient prism / convergence crystal
    const prismGeo = new THREE.OctahedronGeometry(0.75, 0);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0x3d4a58,
      emissive: 0x050c14,
      emissiveIntensity: 0.05,
      roughness: 0.60,
      metalness: 0.30,
      wireframe: false
    });
    this.nexusPrism = new THREE.Mesh(prismGeo, prismMat);
    this.nexusGroup.add(this.nexusPrism);

    // Outer gyroscopic energy rings around the nexus
    this.nexusRings = [];
    const ringRadii = [1.1, 1.35, 1.6];
    const ringColors = [0x773311, 0x005577, 0x086040];

    for (let i = 0; i < ringRadii.length; i++) {
      const geo = new THREE.TorusGeometry(ringRadii[i], 0.010, 16, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: ringColors[i],
        transparent: true,
        opacity: 0.18,
        blending: THREE.NormalBlending
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI * 0.3 * (i + 1);
      ring.rotation.y = Math.PI * 0.2 * i;
      this.nexusGroup.add(ring);
      this.nexusRings.push({ mesh: ring, speed: (i % 2 === 0 ? 1 : -1) * (0.8 + i * 0.4) });
    }

    // Central beacon light
    this.nexusLight = new THREE.PointLight(0xddeeff, 0.0, 1.0, 2.0);
    this.nexusLight.position.set(0, 0, 0);
    this.nexusGroup.add(this.nexusLight);
  }

  createElementalBeams() {
    // Ethereal laser/plasma lines connecting cardinal elements to the central nexus
    this.beams = [];

    const beamConfigs = [
      { start: new THREE.Vector3(0, 0, 6.5), color: 0x8a2500 },  // Fire (South)
      { start: new THREE.Vector3(-6.5, 0, 0), color: 0x025078 }, // Water (West)
      { start: new THREE.Vector3(0, 0, -6.5), color: 0x0a6e4a }, // Earth (North)
      { start: new THREE.Vector3(6.5, 0, 0), color: 0x026597 }   // Air (East)
    ];

    for (let cfg of beamConfigs) {
      const curve = new THREE.LineCurve3(cfg.start, new THREE.Vector3(0, -0.2, 0));
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.012, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.22,
        blending: THREE.NormalBlending
      });
      const beam = new THREE.Mesh(tubeGeo, tubeMat);
      this.group.add(beam);
      this.beams.push({ mesh: beam, baseColor: cfg.color });
    }
  }

  createPerimeterMonoliths() {
    // 8 floating monoliths around the arena perimeter that hover and pulse
    this.monoliths = [];
    const monoGeo = new THREE.BoxGeometry(0.5, 2.6, 0.5);
    // Monolith material with softer roughness and balanced color
    const monoMat = new THREE.MeshStandardMaterial({
      color: 0x303c4c,
      roughness: 0.60,
      metalness: 0.15,
      flatShading: false
    });

    const count = 8;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(monoGeo, monoMat);
      // Offset by half-step so monoliths sit diagonally between cardinal element shrines
      const angle = ((i + 0.5) / count) * Math.PI * 2;
      const radius = 10.5;
      mesh.position.set(Math.cos(angle) * radius, 0.4, Math.sin(angle) * radius);
      mesh.rotation.y = -angle;

      this.group.add(mesh);
      this.monoliths.push({
        mesh,
        baseY: 0.4,
        phase: i * 0.78
      });
    }
  }

  update(delta, elapsed) {
    // Central nexus rotation
    this.nexusPrism.rotation.y = elapsed * 0.8;
    this.nexusPrism.rotation.x = Math.sin(elapsed * 0.6) * 0.3;
    this.nexusPrism.position.y = Math.sin(elapsed * 2.0) * 0.12;

    for (let r of this.nexusRings) {
      r.mesh.rotation.z += delta * r.speed;
      r.mesh.rotation.x += delta * (r.speed * 0.5);
    }

    // Floor rune rotation
    this.runeRing1.rotation.z = elapsed * 0.04;
    this.runeRing2.rotation.z = -elapsed * 0.07;

    // Hovering monoliths
    for (let m of this.monoliths) {
      m.mesh.position.y = m.baseY + Math.sin(elapsed * 1.5 + m.phase) * 0.15;
    }

    // Nexus light pulsing
    this.nexusLight.intensity = 0.16 + Math.sin(elapsed * 3.0) * 0.05;
  }
}
