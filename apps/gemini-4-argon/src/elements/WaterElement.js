import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';

export class WaterElement {
  constructor(position = new THREE.Vector3(-2.6, 0, -3.2)) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.name = 'water';

    this.uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uSurge: { value: 0.0 }
    };

    this.droplets = [];
    this.tidalRings = [];

    this.createPedestal();
    this.createLiquidCore();
    this.createTidalRibbons();
    this.createSatelliteDroplets();
    this.createHydroParticles();
    this.createLights();
  }

  createPedestal() {
    const baseGeo = new THREE.CylinderGeometry(2.35, 2.75, 0.45, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x05131f,
      roughness: 0.35,
      metalness: 0.55
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -2.35;
    this.group.add(baseMesh);

    const rimGeo = new THREE.TorusGeometry(2.32, 0.075, 16, 64);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.8
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -2.12;
    this.group.add(rim);

    // Animated Caustic Pool Disc on Pedestal
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
          // Swirling polar coordinates for whirlpool caustics
          vec2 swirledUv = vec2(
            cos(angle - r * 3.0 + uTime * 0.8) * r,
            sin(angle - r * 3.0 + uTime * 0.8) * r
          );

          float c1 = fbmRidged(vec3(swirledUv * 4.2, uTime * 0.55));
          float c2 = fbmRidged(vec3(swirledUv * 6.5 - 1.5, -uTime * 0.45));
          float caustic = safePow(c1 * c2 * 1.65, 1.5);

          // Concentric water ripples
          float ripples = sin(r * 22.0 - uTime * 4.2) * 0.5 + 0.5;
          ripples *= (1.0 - smoothstep(0.1, 1.0, r));

          float radialFade = 1.0 - smoothstep(0.12, 1.0, r);
          vec3 deepBlue = vec3(0.0, 0.16, 0.42);
          vec3 aqua = vec3(0.0, 0.72, 0.96);
          vec3 foamWhite = vec3(0.78, 0.98, 1.0);

          float energy = (caustic * 0.9 + ripples * 0.25) * (0.85 + 0.3 * uIntensity + 0.5 * uSurge);
          vec3 col = mix(deepBlue, aqua, smoothstep(0.1, 0.55, energy));
          col = mix(col, foamWhite, smoothstep(0.55, 1.05, energy));

          gl_FragColor = vec4(col, radialFade * 0.75);
        }
      `
    });

    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = -2.11;
    this.group.add(pool);
  }

  createLiquidCore() {
    const geo = new THREE.IcosahedronGeometry(1.16, 48);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      vertexShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;

        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;
        varying float vWaveHeight;
        varying float vCaustic;

        float waveFunc(vec3 p, float t) {
          float n1 = fbm(p * 1.85 + vec3(t * 0.55, -t * 0.4, t * 0.35));
          float g1 = sin(p.x * 4.5 + p.y * 3.2 + t * 2.6) * cos(p.z * 4.2 - t * 2.1) * 0.12;
          float g2 = sin(p.y * 6.0 - t * 3.4 + p.x * 2.5) * 0.08;
          return (n1 * 0.22 + g1 + g2) * (0.85 + 0.35 * uIntensity + 0.45 * uSurge);
        }

        void main() {
          float t = uTime * (0.85 + 0.2 * uIntensity);
          vec3 nPos = normalize(position);

          // Finite difference normal perturbation for realistic liquid specular reflections
          float eps = 0.025;
          vec3 tangent = normalize(cross(nPos, vec3(0.0, 1.0, 0.1)));
          vec3 bitangent = normalize(cross(nPos, tangent));

          float h0 = waveFunc(nPos, t);
          float hx = waveFunc(normalize(nPos + tangent * eps), t);
          float hy = waveFunc(normalize(nPos + bitangent * eps), t);

          vec3 displacedPos = position + normal * h0;
          vec3 perturbedNormal = normalize(normal - tangent * ((hx - h0) / eps) * 0.55 - bitangent * ((hy - h0) / eps) * 0.55);

          vWaveHeight = h0;
          vCaustic = fbmRidged(nPos * 3.8 + vec3(0.0, t * 0.65, -t * 0.45));
          vWorldPos = displacedPos;

          vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
          vNormal = normalize(normalMatrix * perturbedNormal);
          vViewDir = normalize(-mvPosition.xyz);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;

        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;
        varying float vWaveHeight;
        varying float vCaustic;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);

          // Fresnel reflection & subsurface scattering approximation
          float fresnel = safePow(1.0 - max(dot(N, V), 0.0), 2.6);

          vec3 lightDir1 = normalize(vec3(0.5, 1.0, 0.8));
          vec3 lightDir2 = normalize(vec3(-0.7, -0.4, 0.5));

          vec3 H1 = normalize(lightDir1 + V);
          float spec1 = safePow(max(dot(N, H1), 0.0), 64.0);

          vec3 H2 = normalize(lightDir2 + V);
          float spec2 = safePow(max(dot(N, H2), 0.0), 32.0);

          // Subsurface glow when waves crest
          float sss = clamp((vWaveHeight * 2.8 + 0.45), 0.0, 1.0);
          float causticShimmer = safePow(clamp(vCaustic, 0.0, 1.05), 3.4) * (0.75 + 0.3 * uIntensity + 0.4 * uSurge);

          vec3 abyssalBlue = vec3(0.01, 0.09, 0.28);
          vec3 oceanTeal = vec3(0.0, 0.38, 0.68);
          vec3 biolumCyan = vec3(0.06, 0.78, 0.96);
          vec3 crestWhite = vec3(0.75, 0.96, 1.0);

          vec3 color = mix(abyssalBlue, oceanTeal, sss * 0.78 + 0.15);
          color = mix(color, biolumCyan, clamp(causticShimmer * 0.58 + fresnel * 0.48, 0.0, 0.95));
          color += crestWhite * (spec1 * 0.85 + spec2 * 0.3 + safePow(fresnel, 3.2) * 0.38);

          gl_FragColor = vec4(color, 0.94);
        }
      `
    });

    this.coreMesh = new THREE.Mesh(geo, mat);
    this.coreMesh.position.y = 0.05;
    this.group.add(this.coreMesh);
  }

  createTidalRibbons() {
    // 3 swirling water vortex ribbons wrapping the core in a maelstrom
    const configs = [
      { radius: 1.68, tube: 0.11, tiltX: 0.42, tiltZ: -0.25, speed: 1.25 },
      { radius: 2.02, tube: 0.085, tiltX: -0.52, tiltZ: 0.38, speed: -0.95 },
      { radius: 1.42, tube: 0.07, tiltX: 0.18, tiltZ: 0.62, speed: 1.55 }
    ];

    configs.forEach((cfg, idx) => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 24, 120);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: this.uniforms.uTime,
          uIntensity: this.uniforms.uIntensity,
          uSurge: this.uniforms.uSurge,
          uSpeed: { value: cfg.speed },
          uSeed: { value: idx * 4.17 }
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uSpeed;
          uniform float uSeed;
          uniform float uIntensity;
          varying vec2 vUv;
          varying float vFoam;

          void main() {
            vUv = uv;
            float angle = uv.x * 6.283185;
            float wave = sin(angle * 4.0 - uTime * uSpeed * 2.5 + uSeed) * 0.12 * uIntensity;
            vec3 pos = position + normal * wave * sin(uv.y * 3.14159);
            vFoam = wave;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uSpeed;
          uniform float uSeed;
          varying vec2 vUv;
          varying float vFoam;

          void main() {
            float flow = fract(vUv.x * 3.0 - uTime * uSpeed * 0.45 + uSeed);
            float stream = sin(vUv.x * 18.8495 - uTime * uSpeed * 3.2) * 0.5 + 0.5;
            float edgeFade = sin(vUv.y * 3.14159);
            float n = fbmRidged(vec3(vUv.x * 12.0 - uTime * uSpeed, vUv.y * 4.0, uTime * 0.5));

            float alpha = safePow(edgeFade, 1.4) * (0.25 + 0.65 * stream * n);
            vec3 col = mix(vec3(0.0, 0.45, 0.85), vec3(0.35, 0.96, 1.0), n);
            col += vec3(0.85, 0.98, 1.0) * smoothstep(0.68, 0.95, n * stream);

            gl_FragColor = vec4(col, alpha * 0.52);
          }
        `
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.05;
      mesh.rotation.x = Math.PI * 0.5 + cfg.tiltX;
      mesh.rotation.z = cfg.tiltZ;
      mesh.userData = cfg;
      this.group.add(mesh);
      this.tidalRings.push(mesh);
    });
  }

  createSatelliteDroplets() {
    const dropCount = 12;
    const dropMat = new THREE.MeshPhysicalMaterial({
      color: 0x00b4ff,
      emissive: 0x004477,
      emissiveIntensity: 0.7,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.65,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 0; i < dropCount; i++) {
      const r = 0.08 + (i % 4) * 0.035;
      const geo = new THREE.SphereGeometry(r, 20, 20);
      const mesh = new THREE.Mesh(geo, dropMat);

      mesh.userData = {
        angle: (i / dropCount) * Math.PI * 2,
        radius: 1.55 + (i % 3) * 0.45,
        speed: 0.65 + (i % 4) * 0.22,
        yOffset: -0.9 + (i % 5) * 0.48,
        bobFreq: 1.8 + (i % 3) * 0.5,
        phase: i * 0.95
      };

      this.group.add(mesh);
      this.droplets.push(mesh);
    }
  }

  createHydroParticles() {
    // 1700 double-helix maelstrom + rising bubble/spray particles
    const count = 1700;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const params = new Float32Array(count * 4); // x: phase, y: speed, z: strandAngle, w: size

    for (let i = 0; i < count; i++) {
      const strand = (i % 3) * ((Math.PI * 2) / 3);
      const radius = 0.75 + Math.random() * 1.55;
      positions[i * 3] = radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.45; // radial jitter

      params[i * 4] = Math.random();
      params[i * 4 + 1] = 0.45 + Math.random() * 0.85;
      params[i * 4 + 2] = strand + (Math.random() - 0.5) * 0.75;
      params[i * 4 + 3] = 0.65 + Math.random() * 1.55;
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

        varying float vLife;
        varying float vSparkle;

        void main() {
          float phase = aParam.x;
          float speed = aParam.y * (0.85 + 0.3 * uIntensity + 0.45 * uSurge);
          float strand = aParam.z;
          float sizeMul = aParam.w;

          float life = fract(phase + uTime * speed * 0.18);
          vLife = life;

          // Maelstrom funnel profile: wide at base & top, pinched slightly around equator
          float y = -2.0 + life * 4.4;
          float baseR = position.x;
          float funnelR = baseR * (0.68 + 0.45 * abs(life - 0.45)) + position.z;

          float theta = strand + life * 8.5 - uTime * (1.4 + 0.4 * uIntensity);
          vec3 pos;
          pos.x = cos(theta) * funnelR;
          pos.z = sin(theta) * funnelR;
          pos.y = y + sin(theta * 2.0 + uTime * 2.5) * 0.14;

          vSparkle = 0.5 + 0.5 * sin(uTime * 8.0 + phase * 40.0);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float env = sin(life * 3.14159);
          gl_PointSize = (21.0 * sizeMul * env * (0.85 + 0.3 * vSparkle)) / -mvPosition.z;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vLife;
        varying float vSparkle;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;

          // Bubble / water droplet ring + specular highlight
          float softCore = 1.0 - smoothstep(0.08, 0.5, d);
          float bubbleRim = smoothstep(0.22, 0.42, d) * (1.0 - smoothstep(0.38, 0.5, d));
          float highlight = 1.0 - smoothstep(0.0, 0.18, length(uv - vec2(-0.12, -0.12)));

          vec3 deepAqua = vec3(0.0, 0.48, 0.92);
          vec3 brightCyan = vec3(0.18, 0.92, 1.0);
          vec3 foamWhite = vec3(0.92, 0.99, 1.0);

          vec3 col = mix(deepAqua, brightCyan, vLife * 0.7 + vSparkle * 0.3);
          col += foamWhite * (highlight * 0.9 + bubbleRim * 0.65);

          float alpha = (softCore * 0.75 + bubbleRim * 0.5) * sin(vLife * 3.14159);
          gl_FragColor = vec4(col, alpha);
        }
      `
    });

    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  createLights() {
    this.mainLight = new THREE.PointLight(0x00ccff, 4.8, 15, 1.5);
    this.mainLight.position.set(0, 0.2, 0);
    this.group.add(this.mainLight);
  }

  update(elapsed, delta, intensity = 1.0, surge = 0.0) {
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uIntensity.value = intensity;
    this.uniforms.uSurge.value = surge;

    if (this.coreMesh) {
      this.coreMesh.position.y = 0.05 + Math.sin(elapsed * 1.6) * 0.14;
      this.coreMesh.rotation.y = elapsed * 0.28;
    }

    for (const ring of this.tidalRings) {
      const cfg = ring.userData;
      ring.rotation.z += delta * cfg.speed * 0.45 * intensity;
      ring.rotation.y = Math.sin(elapsed * 0.7 + cfg.speed) * 0.25;
    }

    for (const drop of this.droplets) {
      const u = drop.userData;
      const a = u.angle + elapsed * u.speed * (0.85 + 0.3 * intensity);
      drop.position.x = Math.cos(a) * u.radius;
      drop.position.z = Math.sin(a) * u.radius;
      drop.position.y = u.yOffset + Math.sin(elapsed * u.bobFreq + u.phase) * 0.28;
      const scale = 0.85 + 0.2 * Math.sin(elapsed * 3.5 + u.phase);
      drop.scale.set(scale, scale * 1.18, scale);
    }

    this.mainLight.intensity = (4.6 + surge * 3.5) * intensity * (0.92 + 0.08 * Math.sin(elapsed * 4.5));
  }
}
