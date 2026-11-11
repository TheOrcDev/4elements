import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';

export class FireElement {
  constructor(position = new THREE.Vector3(-7.2, 0, 2.4)) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.name = 'fire';

    this.uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uSurge: { value: 0.0 }
    };

    this.shards = [];
    this.createPedestal();
    this.createMagmaCore();
    this.createFlamePlumes();
    this.createSolarRings();
    this.createBasaltShards();
    this.createEmberParticles();
    this.createLights();
  }

  createPedestal() {
    // Stepped obsidian volcanic altar
    const baseGeo = new THREE.CylinderGeometry(2.35, 2.75, 0.45, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x120907,
      roughness: 0.65,
      metalness: 0.35
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -2.35;
    this.group.add(baseMesh);

    const rimGeo = new THREE.TorusGeometry(2.32, 0.08, 16, 64);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.85
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -2.12;
    this.group.add(rim);

    // Molten lava pool surface on top of pedestal
    const poolGeo = new THREE.CircleGeometry(2.25, 64);
    const poolMat = new THREE.ShaderMaterial({
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
          vec3 p = vec3(vUv * 3.0, uTime * 0.45);
          float n = fbm(p + vec3(cos(angle * 3.0), sin(angle * 3.0), uTime * 0.3));
          float cracks = fbmRidged(vec3(vUv * 4.5, uTime * 0.25));

          float radialFade = 1.0 - smoothstep(0.15, 1.0, r);
          float ringPulse = sin(r * 14.0 - uTime * 3.5) * 0.5 + 0.5;
          float heat = clamp((cracks * 0.85 + n * 0.35 + ringPulse * 0.2) * radialFade * (0.85 + 0.35 * uIntensity + uSurge * 0.6), 0.0, 1.5);

          vec3 colDark = vec3(0.18, 0.02, 0.0);
          vec3 colRed = vec3(0.95, 0.14, 0.02);
          vec3 colOrange = vec3(1.0, 0.55, 0.05);
          vec3 colYellow = vec3(1.0, 0.96, 0.65);

          vec3 color = mix(colDark, colRed, smoothstep(0.05, 0.35, heat));
          color = mix(color, colOrange, smoothstep(0.35, 0.72, heat));
          color = mix(color, colYellow, smoothstep(0.72, 1.15, heat));

          gl_FragColor = vec4(color, radialFade * 0.92);
        }
      `
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = -2.11;
    this.group.add(pool);
  }

  createMagmaCore() {
    const geo = new THREE.IcosahedronGeometry(1.08, 42);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeat;
        varying float vFresnel;

        void main() {
          vec3 pos = position;
          vec3 nPos = normalize(pos);
          float t = uTime * (0.65 + 0.25 * uIntensity);

          // Convective turbulence + upward flow
          float n1 = fbm(nPos * 2.4 + vec3(0.0, -t * 1.1, t * 0.4));
          float ridged = fbmRidged(nPos * 3.2 + vec3(t * 0.3, -t * 0.8, 0.0));

          float displacement = (n1 * 0.14 + ridged * 0.15) * (0.85 + 0.35 * uIntensity + 0.5 * uSurge);
          // Slight vertical stretch toward the top of the magma orb
          float topPull = smoothstep(0.0, 1.0, nPos.y) * 0.14 * (1.0 + 0.3 * sin(uTime * 3.0 + nPos.x * 4.0));
          vec3 displacedPos = pos + normal * displacement + vec3(0.0, topPull, 0.0);

          vHeat = clamp(safePow(ridged, 1.6) * 0.85 + n1 * 0.35 + uSurge * 0.3, 0.0, 1.3);
          vPosition = displacedPos;
          vNormal = normalize(normalMatrix * normal);

          vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
          vec3 viewDir = normalize(-mvPosition.xyz);
          vFresnel = safePow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.8);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeat;
        varying float vFresnel;

        void main() {
          float fineNoise = snoise(vPosition * 6.5 - vec3(0.0, uTime * 2.2, 0.0)) * 0.12;
          float h = clamp(vHeat + fineNoise + vFresnel * 0.25, 0.0, 1.3);

          // High-contrast volcanic crust with glowing magma rivers
          vec3 crust = vec3(0.05, 0.015, 0.01);
          vec3 crimson = vec3(0.72, 0.06, 0.01);
          vec3 orange = vec3(0.96, 0.36, 0.02);
          vec3 gold = vec3(1.0, 0.76, 0.18);
          vec3 whiteHot = vec3(1.0, 0.95, 0.72);

          vec3 col = mix(crust, crimson, smoothstep(0.26, 0.48, h));
          col = mix(col, orange, smoothstep(0.48, 0.68, h));
          col = mix(col, gold, smoothstep(0.68, 0.88, h));
          col = mix(col, whiteHot, smoothstep(0.88, 1.15, h));

          // Warm rim glow
          col += vec3(0.95, 0.32, 0.04) * vFresnel * (0.65 + 0.25 * uIntensity);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.coreMesh = new THREE.Mesh(geo, mat);
    this.coreMesh.position.y = -0.35;
    this.group.add(this.coreMesh);
  }

  createFlamePlumes() {
    // 3 nested open-ended volumetric flame shells twisting upward
    const shellConfigs = [
      { radiusBottom: 1.18, radiusTop: 0.12, height: 3.5, speed: 1.8, scale: 2.2, opacity: 0.44, twist: 2.2 },
      { radiusBottom: 1.42, radiusTop: 0.28, height: 3.9, speed: 1.45, scale: 1.75, opacity: 0.32, twist: -1.8 },
      { radiusBottom: 0.84, radiusTop: 0.06, height: 4.2, speed: 2.35, scale: 2.8, opacity: 0.52, twist: 3.0 }
    ];

    this.flameShells = [];

    shellConfigs.forEach((cfg, idx) => {
      const geo = new THREE.CylinderGeometry(cfg.radiusTop, cfg.radiusBottom, cfg.height, 48, 64, true);
      // Shift geometry so bottom is at y = 0
      geo.translate(0, cfg.height * 0.5 - 0.85, 0);

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: this.uniforms.uTime,
          uIntensity: this.uniforms.uIntensity,
          uSurge: this.uniforms.uSurge,
          uSpeed: { value: cfg.speed },
          uScale: { value: cfg.scale },
          uOpacity: { value: cfg.opacity },
          uTwist: { value: cfg.twist },
          uSeed: { value: idx * 7.31 }
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uIntensity;
          uniform float uSurge;
          uniform float uSpeed;
          uniform float uScale;
          uniform float uTwist;
          uniform float uSeed;

          varying vec2 vUv;
          varying float vNoise;
          varying float vFresnel;

          void main() {
            vUv = uv;
            float h = uv.y; // 0 at base, 1 at tip
            float t = uTime * uSpeed * (0.85 + 0.25 * uIntensity);

            // Helical twist as flame rises
            float angle = h * uTwist + sin(t * 0.8 + uSeed) * 0.4;
            float ca = cos(angle);
            float sa = sin(angle);
            vec3 pos = position;
            pos.xz = mat2(ca, -sa, sa, ca) * pos.xz;

            // Upward scrolling 3D noise displacement
            vec3 samplePos = pos * uScale + vec3(uSeed, -t * 1.85, uSeed);
            float n = fbm(samplePos);
            vNoise = n;

            // Whiplash flame tongue motion stronger near the top
            float swayX = snoise(vec3(h * 1.8, t * 1.1, uSeed)) * h * 0.55;
            float swayZ = snoise(vec3(h * 1.8, t * 1.1, uSeed + 10.0)) * h * 0.55;

            float expand = 1.0 + uSurge * 0.35 + (uIntensity - 1.0) * 0.22;
            pos.xz *= expand;
            pos += normal * n * (0.28 + h * 0.45) * expand;
            pos.x += swayX;
            pos.z += swayZ;
            pos.y *= (0.92 + 0.18 * uIntensity + 0.28 * uSurge);

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            vec3 vNorm = normalize(normalMatrix * normal);
            vec3 viewDir = normalize(-mvPosition.xyz);
            vFresnel = 1.0 - abs(dot(vNorm, viewDir));

            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: /* glsl */ `
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uSpeed;
          uniform float uScale;
          uniform float uOpacity;
          uniform float uSeed;
          uniform float uIntensity;
          uniform float uSurge;

          varying vec2 vUv;
          varying float vNoise;
          varying float vFresnel;

          void main() {
            float h = vUv.y;
            float t = uTime * uSpeed;

            // Secondary high-frequency flame licks
            vec3 p = vec3(vUv.x * 10.0, h * 4.5 - t * 2.2, t * 0.5 + uSeed);
            float flame = fbm(p) * 0.5 + 0.5;
            float combined = flame * 0.65 + (vNoise * 0.5 + 0.5) * 0.35;

            // Erode flame into tongues as height increases
            float threshold = mix(0.12, 0.78, safePow(h, 1.15));
            float alpha = smoothstep(threshold, threshold + 0.28, combined);

            // Smooth fade at bottom & top
            float bottomFade = smoothstep(0.0, 0.18, h);
            float topFade = 1.0 - smoothstep(0.35, 1.0, h);
            alpha *= bottomFade * topFade * uOpacity * (0.75 + 0.35 * (1.0 - vFresnel));

            if (alpha < 0.01) discard;

            // Color gradient from white-yellow core at base to orange-red at tips
            vec3 coreWhite = vec3(1.0, 0.97, 0.78);
            vec3 brightGold = vec3(1.0, 0.72, 0.15);
            vec3 fieryOrange = vec3(1.0, 0.32, 0.02);
            vec3 deepCrimson = vec3(0.65, 0.04, 0.01);

            float temp = clamp((1.0 - h * 0.78) * combined * (1.1 + 0.25 * uIntensity + 0.35 * uSurge), 0.0, 1.2);
            vec3 color = mix(deepCrimson, fieryOrange, smoothstep(0.1, 0.4, temp));
            color = mix(color, brightGold, smoothstep(0.4, 0.72, temp));
            color = mix(color, coreWhite, smoothstep(0.72, 1.05, temp));

            gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.95));
          }
        `
      });

      const mesh = new THREE.Mesh(geo, mat);
      this.group.add(mesh);
      this.flameShells.push(mesh);
    });
  }

  createSolarRings() {
    this.solarRings = [];
    for (let i = 0; i < 2; i++) {
      const geo = new THREE.TorusGeometry(1.62 + i * 0.35, 0.035, 16, 100);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: this.uniforms.uTime,
          uSeed: { value: i * 3.14 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uSeed;
          varying vec2 vUv;
          void main() {
            float wave = sin(vUv.x * 25.1327 - uTime * 5.0 + uSeed) * 0.5 + 0.5;
            float wave2 = sin(vUv.x * 12.566 + uTime * 3.2) * 0.5 + 0.5;
            float a = pow(max(wave * wave2, 0.0001), 1.4);
            vec3 col = mix(vec3(1.0, 0.28, 0.02), vec3(1.0, 0.88, 0.35), a);
            gl_FragColor = vec4(col, a * 0.65);
          }
        `
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.y = -0.35;
      ring.rotation.x = Math.PI * (0.35 + i * 0.28);
      ring.rotation.y = i * 1.1;
      this.group.add(ring);
      this.solarRings.push(ring);
    }
  }

  createBasaltShards() {
    // Orbiting jagged obsidian/basalt shards with glowing magma undersides
    const shardCount = 14;
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x1a0c08,
      roughness: 0.55,
      metalness: 0.4,
      emissive: 0x551200,
      emissiveIntensity: 0.75,
      flatShading: true
    });

    for (let i = 0; i < shardCount; i++) {
      const radius = 0.14 + (i % 4) * 0.045;
      const geo = new THREE.DodecahedronGeometry(radius, 0);
      // Stretch into jagged rock shard
      geo.scale(0.8, 1.65, 0.7);
      const mesh = new THREE.Mesh(geo, shardMat);

      const angle = (i / shardCount) * Math.PI * 2;
      const dist = 1.65 + (i % 3) * 0.42;
      const height = -1.35 + (i % 5) * 0.55;

      mesh.userData = {
        baseAngle: angle,
        dist,
        baseHeight: height,
        speed: 0.45 + (i % 4) * 0.18,
        bobSpeed: 1.5 + (i % 3) * 0.6,
        phase: i * 1.3
      };

      this.group.add(mesh);
      this.shards.push(mesh);
    }
  }

  createEmberParticles() {
    const count = 1600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4); // x: phase, y: speed, z: radius, w: size

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6) * 2.15;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * 4.8 - 2.0;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      randoms[i * 4] = Math.random(); // phase [0..1]
      randoms[i * 4 + 1] = 0.55 + Math.random() * 1.15; // speed
      randoms[i * 4 + 2] = angle; // initial angle
      randoms[i * 4 + 3] = 0.6 + Math.random() * 1.6; // size multiplier
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 4));

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        attribute vec4 aRandom;
        varying float vLife;
        varying float vSeed;

        void main() {
          float phase = aRandom.x;
          float speed = aRandom.y * (0.85 + 0.35 * uIntensity + 0.5 * uSurge);
          float baseAngle = aRandom.z;
          float sizeMul = aRandom.w;

          // Continuous life cycle from 0.0 (bottom) to 1.0 (top)
          float life = fract(phase + uTime * speed * 0.22);
          vLife = life;
          vSeed = phase;

          float baseR = length(position.xz);
          // Pinch inward slightly in mid-flame, then fan out at top
          float radialEnvelope = mix(baseR, baseR * 0.48, sin(life * 3.14159)) + life * 0.35;
          float swirlAngle = baseAngle + life * 4.5 + uTime * 0.85 * (0.5 + phase * 0.5);

          vec3 pos;
          pos.x = cos(swirlAngle) * radialEnvelope + sin(uTime * 2.1 + phase * 12.0) * 0.14 * life;
          pos.z = sin(swirlAngle) * radialEnvelope + cos(uTime * 1.9 + phase * 12.0) * 0.14 * life;
          pos.y = -2.05 + life * (5.2 + uSurge * 1.2);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float flicker = 0.75 + 0.25 * sin(uTime * 14.0 + phase * 50.0);
          float sizeEnvelope = sin(life * 3.14159);
          gl_PointSize = (24.0 * sizeMul * sizeEnvelope * flicker * (0.9 + 0.25 * uIntensity)) / -mvPosition.z;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vLife;
        varying float vSeed;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;

          float core = 1.0 - smoothstep(0.05, 0.5, d);
          float hotCenter = 1.0 - smoothstep(0.0, 0.22, d);

          // Color cools from white-gold at birth to deep orange-red ember near end of life
          vec3 birthCol = vec3(1.0, 0.92, 0.55);
          vec3 midCol = vec3(1.0, 0.42, 0.04);
          vec3 endCol = vec3(0.75, 0.08, 0.01);

          vec3 col = mix(birthCol, midCol, smoothstep(0.0, 0.45, vLife));
          col = mix(col, endCol, smoothstep(0.45, 0.95, vLife));
          col += vec3(1.0, 0.95, 0.8) * hotCenter * (1.0 - vLife * 0.6);

          float alpha = core * smoothstep(0.0, 0.1, vLife) * (1.0 - smoothstep(0.72, 1.0, vLife));
          gl_FragColor = vec4(col, alpha);
        }
      `
    });

    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  createLights() {
    this.mainLight = new THREE.PointLight(0xff5511, 5.5, 16, 1.5);
    this.mainLight.position.set(0, 0.2, 0);
    this.group.add(this.mainLight);

    this.baseLight = new THREE.PointLight(0xff2200, 2.8, 8, 1.8);
    this.baseLight.position.set(0, -1.7, 0);
    this.group.add(this.baseLight);
  }

  update(elapsed, delta, intensity = 1.0, surge = 0.0) {
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uIntensity.value = intensity;
    this.uniforms.uSurge.value = surge;

    if (this.coreMesh) {
      this.coreMesh.rotation.y = elapsed * 0.35;
      this.coreMesh.rotation.x = Math.sin(elapsed * 0.5) * 0.15;
    }

    if (this.solarRings) {
      this.solarRings[0].rotation.z = elapsed * 1.1;
      this.solarRings[0].rotation.y = elapsed * 0.6;
      this.solarRings[1].rotation.z = -elapsed * 0.9;
      this.solarRings[1].rotation.x = Math.PI * 0.6 + Math.sin(elapsed * 0.8) * 0.25;
    }

    // Animate orbiting basalt shards
    for (const shard of this.shards) {
      const u = shard.userData;
      const a = u.baseAngle + elapsed * u.speed * (0.85 + 0.35 * intensity);
      shard.position.x = Math.cos(a) * u.dist;
      shard.position.z = Math.sin(a) * u.dist;
      shard.position.y = u.baseHeight + Math.sin(elapsed * u.bobSpeed + u.phase) * 0.22;
      shard.rotation.x += delta * 1.1;
      shard.rotation.y += delta * 1.4;
    }

    // Dynamic fire light flicker
    const flicker = 1.0 + Math.sin(elapsed * 13.0) * 0.12 + Math.cos(elapsed * 23.0) * 0.08;
    this.mainLight.intensity = (5.2 + surge * 4.0) * intensity * flicker;
  }
}
