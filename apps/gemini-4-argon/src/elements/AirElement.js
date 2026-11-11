import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';

export class AirElement {
  constructor(position = new THREE.Vector3(7.2, 0, 2.4)) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.name = 'air';

    this.uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uSurge: { value: 0.0 }
    };

    this.slipstreams = [];
    this.createPedestal();
    this.createTempestCore();
    this.createTornadoFunnels();
    this.createSlipstreamRings();
    this.createVortexParticles();
    this.createLights();
  }

  createPedestal() {
    const baseGeo = new THREE.CylinderGeometry(2.35, 2.75, 0.45, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111520,
      roughness: 0.4,
      metalness: 0.6
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -2.35;
    this.group.add(baseMesh);

    const rimGeo = new THREE.TorusGeometry(2.32, 0.075, 16, 64);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0xb8dcff,
      transparent: true,
      opacity: 0.85
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -2.12;
    this.group.add(rim);

    // Cyclonic Pressure-Wave Disc on Pedestal
    const discGeo = new THREE.CircleGeometry(2.25, 64);
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

          // High-speed spiral wind arms
          float spiral = sin(angle * 5.0 + r * 12.0 - uTime * 6.5) * 0.5 + 0.5;
          float spiral2 = sin(angle * 3.0 - r * 8.0 + uTime * 4.2) * 0.5 + 0.5;
          float n = fbm(vec3(vUv * 3.5, uTime * 1.1)) * 0.5 + 0.5;

          float radialFade = 1.0 - smoothstep(0.05, 1.0, r);
          float eyeGlow = 1.0 - smoothstep(0.0, 0.42, r);
          float energy = (safePow(spiral, 2.0) * 0.65 + spiral2 * n * 0.45 + eyeGlow * 0.6) * (0.85 + 0.3 * uIntensity + 0.5 * uSurge);

          vec3 slateViolet = vec3(0.18, 0.26, 0.58);
          vec3 skySilver = vec3(0.38, 0.68, 0.96);
          vec3 electricWhite = vec3(0.78, 0.92, 1.0);

          vec3 col = mix(slateViolet, skySilver, smoothstep(0.15, 0.65, energy));
          col = mix(col, electricWhite, smoothstep(0.7, 1.2, energy));

          gl_FragColor = vec4(col, radialFade * 0.72);
        }
      `
    });

    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -2.11;
    this.group.add(disc);
  }

  createTempestCore() {
    // Eye of the storm sphere suspended inside the cyclone
    const geo = new THREE.IcosahedronGeometry(0.78, 32);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      vertexShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vPos;

        void main() {
          vec3 nPos = normalize(position);
          float stream = snoise(vec3(nPos.x * 3.0, nPos.y * 5.0 - uTime * 2.5, nPos.z * 3.0 + uTime * 2.0));
          vec3 displaced = position + normal * stream * 0.09 * uIntensity;
          vPos = displaced;

          vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
          vNormal = normalize(normalMatrix * normal);
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
        varying vec3 vPos;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);
          float fresnel = safePow(1.0 - max(dot(N, V), 0.0), 2.2);

          // High-speed zonal wind bands + internal lightning filaments
          float bands = sin(vPos.y * 14.0 - uTime * 7.0 + snoise(vPos * 4.0) * 3.0) * 0.5 + 0.5;
          float lightning = safePow(fbmRidged(vPos * 4.5 + vec3(uTime * 2.8)), 5.5);
          float flash = smoothstep(0.72, 0.99, sin(uTime * 9.5) * cos(uTime * 15.3)) * 0.8;

          vec3 deepIndigo = vec3(0.06, 0.12, 0.28);
          vec3 aetherBlue = vec3(0.24, 0.58, 0.95);
          vec3 stormViolet = vec3(0.52, 0.42, 0.96);
          vec3 pureWhite = vec3(0.88, 0.96, 1.0);

          vec3 col = mix(deepIndigo, aetherBlue, bands * 0.75);
          col = mix(col, stormViolet, fresnel * 0.65);
          col += pureWhite * clamp(fresnel * 0.42 + lightning * (0.65 + flash) + uSurge * 0.3, 0.0, 0.95);

          gl_FragColor = vec4(col, 0.9);
        }
      `
    });

    this.coreMesh = new THREE.Mesh(geo, mat);
    this.coreMesh.position.y = 0.25;
    this.group.add(this.coreMesh);
  }

  createTornadoFunnels() {
    // 3 nested open-ended tornado vortex funnel shells (narrow at base, wide at top)
    const funnelConfigs = [
      { rBottom: 0.42, rTop: 2.02, height: 4.3, speed: 3.2, twist: 5.5, opacity: 0.34 },
      { rBottom: 0.65, rTop: 2.38, height: 4.5, speed: -2.4, twist: 4.2, opacity: 0.24 },
      { rBottom: 0.26, rTop: 1.45, height: 4.1, speed: 4.1, twist: 6.8, opacity: 0.42 }
    ];

    this.funnels = [];

    funnelConfigs.forEach((cfg, idx) => {
      const geo = new THREE.CylinderGeometry(cfg.rTop, cfg.rBottom, cfg.height, 64, 64, true);
      geo.translate(0, cfg.height * 0.5 - 2.05, 0);

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: this.uniforms.uTime,
          uIntensity: this.uniforms.uIntensity,
          uSurge: this.uniforms.uSurge,
          uSpeed: { value: cfg.speed },
          uTwist: { value: cfg.twist },
          uOpacity: { value: cfg.opacity },
          uSeed: { value: idx * 5.23 }
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
          uniform float uTwist;
          uniform float uSeed;

          varying vec2 vUv;
          varying float vFresnel;

          void main() {
            vUv = uv;
            float h = uv.y; // 0 at bottom, 1 at top
            float t = uTime * (0.85 + 0.3 * uIntensity);

            // Classic sinuous tornado snake-sway motion
            float swayX = sin(h * 4.5 - t * 2.8 + uSeed) * (0.12 + h * 0.28) * uIntensity;
            float swayZ = cos(h * 4.2 - t * 2.4 + uSeed) * (0.12 + h * 0.28) * uIntensity;

            vec3 pos = position;
            float radialPulse = snoise(vec3(pos.xz * 1.5, h * 3.0 - t * 2.0)) * 0.16;
            pos += normal * radialPulse * (1.0 + 0.35 * uSurge);
            pos.x += swayX;
            pos.z += swayZ;

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
          uniform float uIntensity;
          uniform float uSurge;
          uniform float uSpeed;
          uniform float uTwist;
          uniform float uOpacity;
          uniform float uSeed;

          varying vec2 vUv;
          varying float vFresnel;

          void main() {
            float h = vUv.y;
            float angle = vUv.x * 6.283185;
            float t = uTime * uSpeed * (0.85 + 0.25 * uIntensity);

            // Helical wind slipstream ribbons wrapping up the funnel
            float helix1 = sin(angle * 4.0 + h * uTwist * 3.0 - t * 2.2 + uSeed) * 0.5 + 0.5;
            float helix2 = sin(angle * 7.0 - h * uTwist * 2.0 - t * 1.6) * 0.5 + 0.5;
            float cloudNoise = fbm(vec3(vUv.x * 8.0, h * 5.0 - uTime * 1.8, uTime * 0.6 + uSeed)) * 0.5 + 0.5;

            float windBand = safePow(helix1, 4.5) * 0.75 + safePow(helix2, 5.0) * cloudNoise * 0.65;

            // Storm lightning arcs flickering inside the funnel
            float arc = safePow(fbmRidged(vec3(angle * 2.0, h * 6.0 - uTime * 3.5, uTime * 2.0 + uSeed)), 6.0);
            float flash = smoothstep(0.75, 0.99, sin(uTime * 11.0 + uSeed * 3.0)) * 0.9;

            float bottomFade = smoothstep(0.0, 0.16, h);
            float topFade = 1.0 - smoothstep(0.68, 1.0, h);
            float alpha = windBand * bottomFade * topFade * uOpacity * (0.4 + 0.55 * vFresnel);

            if (alpha < 0.01) discard;

            vec3 silverBlue = vec3(0.22, 0.58, 0.95);
            vec3 paleViolet = vec3(0.52, 0.42, 0.95);
            vec3 whiteMist = vec3(0.85, 0.95, 1.0);

            vec3 col = mix(silverBlue, paleViolet, h * 0.7 + 0.3 * sin(uTime + h * 4.0));
            col = mix(col, whiteMist, smoothstep(0.45, 0.92, windBand + arc * (0.8 + flash) + uSurge * 0.3));

            gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.55));
          }
        `
      });

      const mesh = new THREE.Mesh(geo, mat);
      this.group.add(mesh);
      this.funnels.push(mesh);
    });
  }

  createSlipstreamRings() {
    // High-velocity tilted aero rings
    for (let i = 0; i < 4; i++) {
      const r = 1.15 + i * 0.38;
      const geo = new THREE.TorusGeometry(r, 0.025, 12, 96);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: this.uniforms.uTime,
          uSeed: { value: i * 2.1 }
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
            float streak = pow(max(sin(vUv.x * 18.8495 - uTime * 7.5 + uSeed) * 0.5 + 0.5, 0.0001), 3.0);
            vec3 col = mix(vec3(0.45, 0.75, 1.0), vec3(0.88, 0.95, 1.0), streak);
            gl_FragColor = vec4(col, streak * 0.55);
          }
        `
      });

      const ring = new THREE.Mesh(geo, mat);
      ring.position.y = -0.9 + i * 0.78;
      ring.rotation.x = Math.PI * 0.5 + (i % 2 === 0 ? 0.18 : -0.22);
      ring.rotation.y = i * 0.6;
      this.group.add(ring);
      this.slipstreams.push(ring);
    }
  }

  createVortexParticles() {
    const count = 1850;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const params = new Float32Array(count * 4); // phase, speed, radialOffset, size

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = angle;
      positions[i * 3 + 1] = Math.random();
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.55;

      params[i * 4] = Math.random();
      params[i * 4 + 1] = 0.65 + Math.random() * 1.15;
      params[i * 4 + 2] = Math.random(); // color tint
      params[i * 4 + 3] = 0.6 + Math.random() * 1.45;
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
        varying float vTint;

        void main() {
          float phase = aParam.x;
          float speed = aParam.y * (0.9 + 0.35 * uIntensity + 0.55 * uSurge);
          vTint = aParam.z;
          float sizeMul = aParam.w;

          float life = fract(phase + uTime * speed * 0.24);
          vLife = life;

          // Tornado profile: tight funnel at bottom (r ~ 0.38), wide canopy at top (r ~ 2.4)
          float funnelRadius = mix(0.35, 2.35, pow(max(life, 0.0001), 0.85)) + position.z;
          float theta = position.x + life * 14.0 + uTime * (2.6 + 0.8 * uIntensity);

          // Sinuous cyclone centerline sway
          float swayX = sin(life * 4.5 - uTime * 2.5) * 0.22 * life;
          float swayZ = cos(life * 4.2 - uTime * 2.2) * 0.22 * life;

          vec3 pos;
          pos.x = cos(theta) * funnelRadius + swayX;
          pos.z = sin(theta) * funnelRadius + swayZ;
          pos.y = -2.02 + life * 4.55;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float env = sin(life * 3.14159);
          gl_PointSize = (19.0 * sizeMul * env * (0.9 + 0.25 * uIntensity)) / -mvPosition.z;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vLife;
        varying float vTint;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;

          float core = 1.0 - smoothstep(0.04, 0.5, d);
          vec3 skyCyan = vec3(0.28, 0.68, 0.98);
          vec3 stormViolet = vec3(0.58, 0.48, 0.98);
          vec3 pureWhite = vec3(0.88, 0.96, 1.0);

          vec3 col = mix(skyCyan, stormViolet, vTint);
          col = mix(col, pureWhite, 1.0 - smoothstep(0.0, 0.22, d));

          float alpha = core * sin(vLife * 3.14159) * 0.58;
          gl_FragColor = vec4(col, alpha);
        }
      `
    });

    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  createLights() {
    this.mainLight = new THREE.PointLight(0x99ccff, 4.6, 16, 1.5);
    this.mainLight.position.set(0, 0.4, 0);
    this.group.add(this.mainLight);
  }

  update(elapsed, delta, intensity = 1.0, surge = 0.0) {
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uIntensity.value = intensity;
    this.uniforms.uSurge.value = surge;

    if (this.coreMesh) {
      this.coreMesh.rotation.y = -elapsed * 1.8 * intensity;
      this.coreMesh.position.y = 0.25 + Math.sin(elapsed * 2.8) * 0.16;
    }

    this.slipstreams.forEach((ring, idx) => {
      ring.rotation.z += delta * (idx % 2 === 0 ? 2.4 : -2.1) * intensity;
      ring.position.x = Math.sin(elapsed * 2.5 + idx) * 0.12;
      ring.position.z = Math.cos(elapsed * 2.3 + idx) * 0.12;
    });

    const stormFlash = Math.pow(Math.max(0, Math.sin(elapsed * 9.5) * Math.cos(elapsed * 15.3)), 6.0) * 3.0;
    this.mainLight.intensity = (4.5 + surge * 3.5 + stormFlash) * intensity;
  }
}
