import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';

export class EarthElement {
  constructor(position = new THREE.Vector3(2.6, 0, -3.2)) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.name = 'earth';

    this.uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uSurge: { value: 0.0 }
    };

    this.orbitRocks = [];
    this.orbitCrystals = [];

    this.createPedestal();
    this.createTectonicMonolith();
    this.createCrystalCrown();
    this.createAsteroidRings();
    this.createGeomagneticRings();
    this.createSporeParticles();
    this.createLights();
  }

  createPedestal() {
    const baseGeo = new THREE.CylinderGeometry(2.35, 2.75, 0.45, 8); // Octagonal stone altar
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x16140f,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -2.35;
    this.group.add(baseMesh);

    const rimGeo = new THREE.RingGeometry(2.18, 2.34, 8);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0x38ff7a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = -2.11;
    this.group.add(rim);

    // Sacred Geomagnetic Ley-Line Disc on Pedestal
    const discGeo = new THREE.CircleGeometry(2.22, 64);
    const discMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv * 2.0 - 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        varying vec2 vUv;

        void main() {
          float r = length(vUv);
          if (r > 1.0) discard;
          float angle = atan(vUv.y, vUv.x);

          // Octagonal sacred geometry + root veins
          float oct = cos(angle * 8.0);
          float rings = 1.0 - smoothstep(0.0, 0.04, abs(fract(r * 4.0 - uTime * 0.25) - 0.5) - 0.42);
          float Spokes = smoothstep(0.92, 0.99, oct) * (1.0 - smoothstep(0.2, 1.0, r));
          float veins = safePow(fbmRidged(vec3(vUv * 3.8, uTime * 0.18)), 2.2);

          float radialFade = 1.0 - smoothstep(0.08, 1.0, r);
          float pattern = (rings * 0.55 + Spokes * 0.45 + veins * 0.75) * (0.85 + 0.3 * uIntensity + 0.5 * uSurge);

          vec3 mossGreen = vec3(0.06, 0.38, 0.16);
          vec3 emerald = vec3(0.18, 0.95, 0.48);
          vec3 amberGold = vec3(1.0, 0.82, 0.24);

          vec3 col = mix(mossGreen, emerald, smoothstep(0.15, 0.65, pattern));
          col = mix(col, amberGold, smoothstep(0.68, 1.15, pattern));

          gl_FragColor = vec4(col, radialFade * 0.85);
        }
      `
    });

    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -2.115;
    this.group.add(disc);
  }

  createTectonicMonolith() {
    this.monolithGroup = new THREE.Group();
    this.monolithGroup.position.y = 0.1;
    this.group.add(this.monolithGroup);

    const geo = new THREE.IcosahedronGeometry(1.06, 24);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;

        varying vec3 vNormal;
        varying vec3 vPos;
        varying float vVein;
        varying float vFacet;

        void main() {
          vec3 nPos = normalize(position);
          // Stepped tectonic strata + faceted rock displacement
          float strata = sin(nPos.y * 14.0 + snoise(nPos * 3.0) * 2.5) * 0.04;
          float rockNoise = fbm(nPos * 2.6);
          float fissure = fbmRidged(nPos * 3.4 + vec3(0.0, uTime * 0.12, 0.0));

          // Deep glowing geode cracks where fissure is high
          float crackDepth = smoothstep(0.62, 0.88, fissure);
          float disp = rockNoise * 0.22 + strata - crackDepth * 0.08 * (1.0 + uSurge * 0.5);

          vec3 displaced = position + normal * disp;
          // Stretch slightly vertically like an ancient monolith
          displaced.y *= 1.18;

          vPos = displaced;
          vVein = crackDepth;
          vFacet = rockNoise;
          vNormal = normalize(normalMatrix * normal);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;

        varying vec3 vNormal;
        varying vec3 vPos;
        varying float vVein;
        varying float vFacet;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 L1 = normalize(vec3(0.6, 0.9, 0.5));
          vec3 L2 = normalize(vec3(-0.6, -0.4, 0.7));

          float diff1 = max(dot(N, L1), 0.0);
          float diff2 = max(dot(N, L2), 0.0) * 0.35;

          float fineGrain = snoise(vPos * 12.0) * 0.08;
          vec3 darkGranite = vec3(0.11, 0.10, 0.08) + fineGrain;
          vec3 bronzeSlate = vec3(0.26, 0.21, 0.14);
          vec3 mossTint = vec3(0.10, 0.28, 0.14);

          vec3 rockColor = mix(darkGranite, bronzeSlate, smoothstep(-0.2, 0.4, vFacet));
          rockColor = mix(rockColor, mossTint, smoothstep(0.2, 0.85, N.y) * 0.65);
          rockColor *= (0.35 + diff1 * 0.85 + diff2);

          // Glowing emerald & golden amber crystal veins inside tectonic cracks
          float pulse = 0.75 + 0.25 * sin(uTime * 3.2 - vPos.y * 4.0);
          float veinMask = smoothstep(0.15, 0.75, vVein) * (0.9 + 0.35 * uIntensity + 0.6 * uSurge);
          vec3 emeraldGlow = vec3(0.12, 0.98, 0.48);
          vec3 goldCore = vec3(1.0, 0.86, 0.28);
          vec3 veinCol = mix(emeraldGlow, goldCore, smoothstep(0.55, 0.92, vVein * pulse));

          vec3 finalColor = mix(rockColor, veinCol * 1.35, clamp(veinMask, 0.0, 1.0));
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    const coreMesh = new THREE.Mesh(geo, mat);
    this.monolithGroup.add(coreMesh);
  }

  createCrystalCrown() {
    // Glowing emerald & golden peridot hexagonal crystal spires protruding from the monolith
    const crystalMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vLocalPos;
        void main() {
          vLocalPos = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vLocalPos;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);
          float fresnel = pow(max(1.0 - max(dot(N, V), 0.0), 0.0001), 2.0);

          vec3 L = normalize(vec3(0.4, 1.0, 0.6));
          float spec = pow(max(dot(reflect(-L, N), V), 0.0001), 32.0);

          float h = clamp(vLocalPos.y + 0.5, 0.0, 1.2);
          vec3 deepJade = vec3(0.02, 0.42, 0.22);
          vec3 brightEmerald = vec3(0.18, 1.0, 0.52);
          vec3 goldenTip = vec3(0.98, 0.92, 0.38);

          float pulse = 0.85 + 0.15 * sin(uTime * 3.8 + vLocalPos.x * 6.0);
          vec3 col = mix(deepJade, brightEmerald, smoothstep(0.1, 0.75, h));
          col = mix(col, goldenTip, smoothstep(0.75, 1.15, h + fresnel * 0.3));
          col *= pulse * (0.95 + 0.25 * uIntensity + 0.4 * uSurge);
          col += vec3(0.85, 1.0, 0.88) * (spec * 0.9 + fresnel * 0.45);

          gl_FragColor = vec4(col, 0.92);
        }
      `
    });

    const directions = [
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0.45, 0.88, 0.25),
      new THREE.Vector3(-0.42, 0.85, -0.28),
      new THREE.Vector3(0.25, 0.82, -0.48),
      new THREE.Vector3(-0.3, 0.78, 0.45),
      new THREE.Vector3(0.85, 0.35, 0.2),
      new THREE.Vector3(-0.82, 0.38, -0.25),
      new THREE.Vector3(0.2, 0.42, 0.88),
      new THREE.Vector3(-0.25, 0.32, -0.85),
      new THREE.Vector3(0.65, -0.45, 0.55),
      new THREE.Vector3(-0.68, -0.42, 0.52),
      new THREE.Vector3(0.0, -0.95, 0.15),
      new THREE.Vector3(0.35, -0.82, -0.35),
      new THREE.Vector3(-0.38, -0.8, -0.3)
    ];

    directions.forEach((dir, idx) => {
      const normDir = dir.clone().normalize();
      const length = 0.55 + (idx % 4) * 0.18;
      const radius = 0.11 + (idx % 3) * 0.035;

      // Hexagonal crystal prism + pointed tip
      const geo = new THREE.CylinderGeometry(0.01, radius, length, 6);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, crystalMat);

      mesh.position.copy(normDir).multiplyScalar(0.88 + length * 0.35);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normDir);
      this.monolithGroup.add(mesh);
    });
  }

  createAsteroidRings() {
    // Orbiting tectonic boulders + floating emerald crystal shards in tilted planetary rings
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x3b3123,
      roughness: 0.75,
      metalness: 0.2,
      flatShading: true
    });

    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x1ee86c,
      emissive: 0x0b7a38,
      emissiveIntensity: 0.9,
      roughness: 0.18,
      metalness: 0.3,
      flatShading: true
    });

    const totalCount = 26;
    for (let i = 0; i < totalCount; i++) {
      const isCrystal = i % 2 === 0;
      let mesh;
      if (isCrystal) {
        const r = 0.08 + (i % 3) * 0.03;
        const geo = new THREE.OctahedronGeometry(r, 0);
        geo.scale(0.65, 1.85, 0.65);
        mesh = new THREE.Mesh(geo, shardMat);
      } else {
        const r = 0.12 + (i % 4) * 0.04;
        const geo = new THREE.DodecahedronGeometry(r, 0);
        geo.scale(1.2, 0.85, 1.0);
        mesh = new THREE.Mesh(geo, rockMat);
      }

      const ringIndex = i % 2;
      const radius = ringIndex === 0 ? 1.72 + (i % 3) * 0.18 : 2.18 + (i % 3) * 0.16;
      const angle = (i / totalCount) * Math.PI * 2;

      mesh.userData = {
        angle,
        radius,
        speed: (ringIndex === 0 ? 0.52 : -0.36) * (0.85 + (i % 3) * 0.12),
        tiltX: ringIndex === 0 ? 0.32 : -0.38,
        tiltZ: ringIndex === 0 ? -0.22 : 0.28,
        bobOffset: i * 0.75
      };

      this.group.add(mesh);
      this.orbitRocks.push(mesh);
    }
  }

  createGeomagneticRings() {
    this.geoRings = [];
    const radii = [1.58, 2.05];
    radii.forEach((r, idx) => {
      const geo = new THREE.RingGeometry(r, r + 0.03, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x2eff7b : 0xffcf40,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.y = 0.1;
      ring.rotation.x = Math.PI / 2 + (idx === 0 ? 0.32 : -0.38);
      ring.rotation.y = idx === 0 ? -0.22 : 0.28;
      this.group.add(ring);
      this.geoRings.push(ring);
    });
  }

  createSporeParticles() {
    const count = 1450;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const params = new Float32Array(count * 4); // phase, speed, colorMix, size

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 2.1;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      params[i * 4] = Math.random();
      params[i * 4 + 1] = 0.25 + Math.random() * 0.55;
      params[i * 4 + 2] = Math.random(); // 0 = emerald spore, 1 = golden amber dust
      params[i * 4 + 3] = 0.7 + Math.random() * 1.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aParam', new THREE.BufferAttribute(params, 4));

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        attribute vec4 aParam;

        varying float vColorMix;
        varying float vAlpha;

        void main() {
          float phase = aParam.x;
          float speed = aParam.y * (0.85 + 0.25 * uIntensity + 0.4 * uSurge);
          vColorMix = aParam.z;
          float sizeMul = aParam.w;

          float life = fract(phase + uTime * speed * 0.14);
          float angle = atan(position.z, position.x) + uTime * speed * 0.45;
          float r = length(position.xz) + sin(uTime * 1.5 + phase * 20.0) * 0.15;

          vec3 pos;
          pos.x = cos(angle) * r;
          pos.z = sin(angle) * r;
          pos.y = -2.0 + life * 4.3 + cos(uTime * 2.0 + phase * 15.0) * 0.12;

          float pulse = 0.65 + 0.35 * sin(uTime * 5.0 + phase * 35.0);
          vAlpha = sin(life * 3.14159) * pulse;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = (20.0 * sizeMul * vAlpha * (0.9 + 0.25 * uIntensity)) / -mvPosition.z;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vColorMix;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          // Diamond-shaped crystalline glint + soft aura
          float diamond = abs(uv.x) + abs(uv.y);
          float d = length(uv);
          if (d > 0.5) discard;

          float crystalCore = 1.0 - smoothstep(0.02, 0.45, diamond);
          float softHalo = 1.0 - smoothstep(0.1, 0.5, d);

          vec3 emerald = vec3(0.18, 0.98, 0.52);
          vec3 gold = vec3(1.0, 0.85, 0.28);
          vec3 col = mix(emerald, gold, vColorMix);
          col += vec3(0.95, 1.0, 0.9) * (1.0 - smoothstep(0.0, 0.15, diamond));

          gl_FragColor = vec4(col, (crystalCore * 0.7 + softHalo * 0.4) * vAlpha);
        }
      `
    });

    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  createLights() {
    this.mainLight = new THREE.PointLight(0x2eff78, 4.5, 15, 1.5);
    this.mainLight.position.set(0, 0.3, 0);
    this.group.add(this.mainLight);
  }

  update(elapsed, delta, intensity = 1.0, surge = 0.0) {
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uIntensity.value = intensity;
    this.uniforms.uSurge.value = surge;

    if (this.monolithGroup) {
      this.monolithGroup.position.y = 0.15 + Math.sin(elapsed * 1.35) * 0.18;
      this.monolithGroup.rotation.y = elapsed * 0.24 * intensity;
      this.monolithGroup.rotation.z = Math.sin(elapsed * 0.7) * 0.08;
    }

    for (const item of this.orbitRocks) {
      const u = item.userData;
      const a = u.angle + elapsed * u.speed * (0.85 + 0.3 * intensity);
      const x = Math.cos(a) * u.radius;
      const z = Math.sin(a) * u.radius;
      const y = Math.sin(a + u.bobOffset) * 0.32 + Math.cos(elapsed * 2.0 + u.bobOffset) * 0.12;

      // Apply ring tilt
      item.position.set(
        x,
        0.1 + y + z * Math.sin(u.tiltX) + x * Math.sin(u.tiltZ),
        z * Math.cos(u.tiltX)
      );
      item.rotation.x += delta * 0.8;
      item.rotation.y += delta * 1.1;
    }

    if (this.geoRings) {
      this.geoRings[0].rotation.z = elapsed * 0.35;
      this.geoRings[1].rotation.z = -elapsed * 0.25;
    }

    this.mainLight.intensity = (4.4 + surge * 3.5) * intensity * (0.9 + 0.1 * Math.sin(elapsed * 3.2));
  }
}
