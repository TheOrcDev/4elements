import * as THREE from 'three';
import {
  COSMIC_BACKGROUND_VERTEX,
  COSMIC_BACKGROUND_FRAGMENT,
  RUNE_RING_VERTEX,
  RUNE_RING_FRAGMENT
} from '../shaders/fusionShaders.ts';

export class NexusEnvironment {
  public group: THREE.Group;
  private bgMesh: THREE.Mesh;
  private bgMaterial: THREE.ShaderMaterial;
  private altarRings: THREE.Mesh[] = [];
  private altarMaterials: THREE.ShaderMaterial[] = [];
  private leyLines: THREE.LineSegments[] = [];
  private dustParticles: THREE.Points;
  private dustCount = 800;
  private starParticles: THREE.Points;
  private starCount = 2000;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'NexusEnvironment';

    // 1. Cosmic Sky Dome
    const bgGeo = new THREE.SphereGeometry(120, 32, 32);
    this.bgMaterial = new THREE.ShaderMaterial({
      vertexShader: COSMIC_BACKGROUND_VERTEX,
      fragmentShader: COSMIC_BACKGROUND_FRAGMENT,
      uniforms: {
        uTime: { value: 0 }
      },
      side: THREE.BackSide,
      depthWrite: false
    });
    this.bgMesh = new THREE.Mesh(bgGeo, this.bgMaterial);
    this.group.add(this.bgMesh);

    // Distant Starfield
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(this.starCount * 3);
    const starColors = new Float32Array(this.starCount * 3);
    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 80.0 + Math.random() * 30.0;

      starPos[i3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i3 + 2] = r * Math.cos(phi);

      // Subtle star color variations (white, soft cyan, gold, violet)
      const c = Math.random();
      if (c < 0.6) {
        starColors[i3] = 0.9; starColors[i3+1] = 0.95; starColors[i3+2] = 1.0;
      } else if (c < 0.8) {
        starColors[i3] = 0.6; starColors[i3+1] = 0.8; starColors[i3+2] = 1.0;
      } else {
        starColors[i3] = 1.0; starColors[i3+1] = 0.85; starColors[i3+2] = 0.6;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.starParticles = new THREE.Points(starGeo, starMat);
    this.group.add(this.starParticles);

    // 2. Alchemical Floor Altar with Sacred Rings
    const altarConfig = [
      { radius: 6.5, color: new THREE.Color('#38bdf8'), speed: 0.3 },
      { radius: 7.2, color: new THREE.Color('#f59e0b'), speed: -0.25 },
      { radius: 8.0, color: new THREE.Color('#10b981'), speed: 0.2 },
      { radius: 9.0, color: new THREE.Color('#ef4444'), speed: -0.15 }
    ];

    altarConfig.forEach(cfg => {
      const ringGeo = new THREE.TorusGeometry(cfg.radius, 0.02, 16, 120);
      const ringMat = new THREE.ShaderMaterial({
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
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -2.8;
      this.group.add(ring);
      this.altarRings.push(ring);
      this.altarMaterials.push(ringMat);
    });

    // 3. Sacred Alchemical Floor Geometry (Inscribed Mandala Grid)
    const floorPlateGeo = new THREE.CylinderGeometry(9.5, 9.8, 0.2, 64);
    const floorPlateMat = new THREE.MeshStandardMaterial({
      color: 0x070913,
      metalness: 0.85,
      roughness: 0.35,
      wireframe: false
    });
    const floorPlate = new THREE.Mesh(floorPlateGeo, floorPlateMat);
    floorPlate.position.y = -2.9;
    floorPlate.receiveShadow = true;
    this.group.add(floorPlate);

    // Outer Altar Edge Ring
    const edgeGeo = new THREE.TorusGeometry(9.6, 0.05, 16, 120);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4f46e5,
      emissiveIntensity: 2.0,
      metalness: 0.9,
      roughness: 0.1
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = -2.8;
    this.group.add(edge);

    // 4. Connecting Ley Lines from Pedestals to Center
    const positions = [
      new THREE.Vector3(6.5, -0.5, 0),    // East (Water)
      new THREE.Vector3(-6.5, -0.5, 0),   // West (Air)
      new THREE.Vector3(0, -0.5, 6.5),    // North (Fire)
      new THREE.Vector3(0, -0.5, -6.5)    // South (Earth)
    ];

    const lineGeo = new THREE.BufferGeometry();
    const linePoints: number[] = [];
    positions.forEach(pos => {
      linePoints.push(pos.x, pos.y, pos.z);
      linePoints.push(0, -0.5, 0); // To center
    });
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    this.group.add(lines);
    this.leyLines.push(lines);

    // 5. Floating Cosmic Dust Motes with soft circular texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(160, 200, 255, 0.8)');
      grad.addColorStop(0.6, 'rgba(100, 150, 255, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(this.dustCount * 3);
    for (let i = 0; i < this.dustCount; i++) {
      const i3 = i * 3;
      dustPos[i3] = (Math.random() - 0.5) * 50;
      dustPos[i3 + 1] = (Math.random() - 0.5) * 25;
      dustPos[i3 + 2] = (Math.random() - 0.5) * 50;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.35,
      map: particleTexture,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.dustParticles);
  }

  public update(delta: number, time: number) {
    this.bgMaterial.uniforms.uTime.value = time;
    this.altarMaterials.forEach(m => {
      m.uniforms.uTime.value = time;
    });

    this.dustParticles.rotation.y = time * 0.02;
    this.dustParticles.rotation.x = Math.sin(time * 0.01) * 0.05;
  }

  public dispose() {
    this.bgMaterial.dispose();
    this.altarMaterials.forEach(m => m.dispose());
  }
}
