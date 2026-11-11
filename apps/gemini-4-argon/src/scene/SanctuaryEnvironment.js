import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';

export class SanctuaryEnvironment {
  constructor(elementPositions) {
    this.group = new THREE.Group();
    this.elementPositions = elementPositions;
    this.nexusPosition = new THREE.Vector3(0, 0.75, -0.4);

    this.uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uSurge: { value: 0.0 },
      uShockwaveTime: { value: -10.0 }
    };

    this.gyroRings = [];

    this.createSkyDomeAndStars();
    this.createSanctuaryFloor();
    this.createAetherNexus();
    this.createConvergenceStreams();
  }

  createSkyDomeAndStars() {
    // Cosmic Nebula Sky Dome
    const domeGeo = new THREE.SphereGeometry(75, 48, 32);
    const domeMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec3 vWorldPos;

        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

          vec3 abyss = vec3(0.012, 0.015, 0.032);
          vec3 horizon = vec3(0.035, 0.045, 0.095);
          vec3 zenith = vec3(0.008, 0.01, 0.024);

          vec3 sky = mix(abyss, horizon, smoothstep(0.15, 0.5, h));
          sky = mix(sky, zenith, smoothstep(0.5, 0.95, h));

          // Subtle cosmic nebula bands tinted by elemental quadrants
          float neb = fbm(dir * 2.8 + vec3(uTime * 0.015, 0.0, -uTime * 0.01));
          float nebMask = smoothstep(0.05, 0.65, neb) * smoothstep(0.1, 0.6, dir.y + 0.2);

          vec3 fireTint = vec3(0.24, 0.06, 0.02) * clamp(-dir.x, 0.0, 1.0);
          vec3 airTint = vec3(0.06, 0.14, 0.28) * clamp(dir.x, 0.0, 1.0);
          vec3 waterEarthTint = vec3(0.02, 0.18, 0.18) * clamp(-dir.z, 0.0, 1.0);

          sky += (fireTint + airTint + waterEarthTint) * nebMask * 0.55;

          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    this.group.add(dome);

    // Twinkling Starfield & Ambient Aether Motes
    const starCount = 2200;
    const starGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    const seed = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const isAmbientMote = i < 350;
      if (isAmbientMote) {
        const a = Math.random() * Math.PI * 2;
        const r = 2.0 + Math.random() * 14.5;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = -2.2 + Math.random() * 7.5;
        pos[i * 3 + 2] = Math.sin(a) * r;
        seed[i * 3] = Math.random();
        seed[i * 3 + 1] = 1.0; // ambient mote flag
        seed[i * 3 + 2] = 0.7 + Math.random() * 1.3;
      } else {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 32.0 + Math.random() * 35.0;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) - 4.0;
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        seed[i * 3] = Math.random();
        seed[i * 3 + 1] = 0.0;
        seed[i * 3 + 2] = 0.6 + Math.random() * 1.5;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));

    const starMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute vec3 aSeed;
        varying float vTwinkle;
        varying float vIsMote;
        varying float vSeed;

        void main() {
          vec3 p = position;
          vIsMote = aSeed.y;
          vSeed = aSeed.x;

          if (vIsMote > 0.5) {
            p.y += sin(uTime * 0.6 + aSeed.x * 20.0) * 0.35;
            p.x += cos(uTime * 0.4 + aSeed.x * 15.0) * 0.25;
          }

          vTwinkle = 0.55 + 0.45 * sin(uTime * (2.0 + aSeed.x * 4.0) + aSeed.x * 50.0);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float baseSize = vIsMote > 0.5 ? 16.0 : 42.0;
          gl_PointSize = (baseSize * aSeed.z * vTwinkle) / -mvPosition.z;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vTwinkle;
        varying float vIsMote;
        varying float vSeed;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float core = 1.0 - smoothstep(0.0, 0.5, d);

          vec3 starCol = mix(vec3(0.65, 0.82, 1.0), vec3(1.0, 0.92, 0.78), vSeed);
          gl_FragColor = vec4(starCol, core * vTwinkle * (vIsMote > 0.5 ? 0.55 : 0.85));
        }
      `
    });

    const stars = new THREE.Points(starGeo, starMat);
    this.group.add(stars);
  }

  createSanctuaryFloor() {
    const floorGeo = new THREE.CircleGeometry(22.0, 128);
    const floorMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vWorldXZ;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldXZ = worldPos.xz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        uniform float uShockwaveTime;
        varying vec2 vWorldXZ;

        float ringLine(float r, float target, float width) {
          return 1.0 - smoothstep(0.0, width, abs(r - target));
        }

        float segmentGlow(vec2 p, vec2 a, vec2 b, float width) {
          vec2 pa = p - a;
          vec2 ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          float d = length(pa - ba * h);
          return 1.0 - smoothstep(0.0, width, d);
        }

        void main() {
          vec2 p = vWorldXZ;
          float r = length(p);
          float outerFade = 1.0 - smoothstep(12.0, 22.0, r);

          // Dark carved obsidian stone texture
          float stoneNoise = fbm(vec3(p * 0.65, 0.0)) * 0.5 + 0.5;
          vec3 baseStone = mix(vec3(0.018, 0.022, 0.036), vec3(0.042, 0.048, 0.072), stoneNoise);

          // Sacred geometry concentric rings centered on nexus (0, -0.4)
          vec2 np = p - vec2(0.0, -0.4);
          float nr = length(np);
          float angle = atan(np.y, np.x);

          float rings = 0.0;
          rings += ringLine(nr, 2.2, 0.045);
          rings += ringLine(nr, 4.4, 0.035);
          rings += ringLine(nr, 7.6, 0.05);
          rings += ringLine(nr, 10.8, 0.04);

          // Astrological tick marks
          float ticks = smoothstep(0.95, 0.995, cos(angle * 24.0)) * (1.0 - smoothstep(0.0, 0.35, abs(nr - 7.6)));
          float runes = (rings + ticks * 0.75) * (0.45 + 0.2 * sin(uTime * 2.0 - nr * 0.8));

          vec3 runeColor = vec3(0.65, 0.52, 0.28) * runes;

          // Ley-lines connecting each shrine to the central Nexus (0, -0.4)
          vec2 posFire = vec2(-6.5, 1.8);
          vec2 posWater = vec2(-2.3, -2.8);
          vec2 posEarth = vec2(2.3, -2.8);
          vec2 posAir = vec2(6.5, 1.8);
          vec2 posNexus = vec2(0.0, -0.4);

          float lineFire = segmentGlow(p, posFire, posNexus, 0.12);
          float lineWater = segmentGlow(p, posWater, posNexus, 0.12);
          float lineEarth = segmentGlow(p, posEarth, posNexus, 0.12);
          float lineAir = segmentGlow(p, posAir, posNexus, 0.12);

          float flowPulse = 0.55 + 0.45 * sin(nr * 2.2 + uTime * 4.5);

          // Localized elemental reflection pools on the obsidian floor
          float glowFire = exp(-length(p - posFire) * 0.45);
          float glowWater = exp(-length(p - posWater) * 0.45);
          float glowEarth = exp(-length(p - posEarth) * 0.45);
          float glowAir = exp(-length(p - posAir) * 0.45);
          float glowNexus = exp(-nr * 0.52);

          vec3 colFire = vec3(0.95, 0.32, 0.05) * (glowFire * 0.36 + lineFire * flowPulse * 0.55);
          vec3 colWater = vec3(0.0, 0.58, 0.92) * (glowWater * 0.36 + lineWater * flowPulse * 0.55);
          vec3 colEarth = vec3(0.15, 0.82, 0.42) * (glowEarth * 0.35 + lineEarth * flowPulse * 0.55);
          vec3 colAir = vec3(0.45, 0.68, 0.95) * (glowAir * 0.35 + lineAir * flowPulse * 0.55);
          vec3 colNexus = vec3(0.75, 0.65, 0.95) * glowNexus * (0.32 + 0.4 * uSurge);

          // Expanding Elemental Surge shockwave ring
          float waveAge = uTime - uShockwaveTime;
          float shockwave = 0.0;
          if (waveAge > 0.0 && waveAge < 4.5) {
            float waveRadius = waveAge * 5.2;
            shockwave = (1.0 - smoothstep(0.0, 0.55, abs(nr - waveRadius))) * (1.0 - waveAge / 4.5);
          }

          vec3 totalColor = baseStone + runeColor + (colFire + colWater + colEarth + colAir + colNexus) * (0.8 + 0.2 * uIntensity + 0.35 * uSurge);
          totalColor += vec3(0.85, 0.82, 1.0) * shockwave * 0.85;
          totalColor *= outerFade;

          gl_FragColor = vec4(totalColor, 1.0);
        }
      `
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.58;
    this.group.add(floor);
  }

  createAetherNexus() {
    // Central Fifth-Element Convergence Core at (0, 0.75, -0.4)
    this.nexusGroup = new THREE.Group();
    this.nexusGroup.position.copy(this.nexusPosition);
    this.group.add(this.nexusGroup);

    // Prismatic Merkaba (two interlocking counter-rotating octahedrons)
    const octGeo = new THREE.OctahedronGeometry(0.62, 0);
    const octMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vPos;
        void main() {
          vPos = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uSurge;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vPos;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);
          float fresnel = pow(max(1.0 - max(dot(N, V), 0.0), 0.0001), 1.8);

          // Prismatic blend of all four elements
          vec3 cFire = vec3(0.95, 0.38, 0.08);
          vec3 cWater = vec3(0.05, 0.72, 0.95);
          vec3 cEarth = vec3(0.18, 0.88, 0.48);
          vec3 cAir = vec3(0.68, 0.58, 0.98);

          float t = uTime * 1.5;
          vec3 col = mix(cFire, cWater, sin(t + vPos.x * 3.0) * 0.5 + 0.5);
          col = mix(col, cEarth, cos(t * 0.8 + vPos.y * 3.0) * 0.5 + 0.5);
          col = mix(col, cAir, sin(t * 1.2 + vPos.z * 3.0) * 0.5 + 0.5);
          col = mix(col, vec3(0.95, 0.92, 1.0), 0.25 + fresnel * 0.45 + uSurge * 0.35);

          gl_FragColor = vec4(col, 0.85);
        }
      `
    });

    this.merkaba1 = new THREE.Mesh(octGeo, octMat);
    this.merkaba2 = new THREE.Mesh(octGeo, octMat);
    this.merkaba2.rotation.y = Math.PI / 4;
    this.merkaba2.rotation.x = Math.PI / 4;
    this.nexusGroup.add(this.merkaba1);
    this.nexusGroup.add(this.merkaba2);

    // 3 Astrolabe Gyroscopic Rings around the Aether Core
    const ringColors = [0xffb84d, 0x5ce1ff, 0xc499ff];
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.TorusGeometry(0.95 + i * 0.24, 0.02, 16, 96);
      const mat = new THREE.MeshBasicMaterial({
        color: ringColors[i],
        transparent: true,
        opacity: 0.78
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = i * 1.05;
      ring.rotation.y = i * 0.85;
      this.nexusGroup.add(ring);
      this.gyroRings.push(ring);
    }

    // Small pedestal under the central nexus
    const pedGeo = new THREE.CylinderGeometry(1.15, 1.55, 0.35, 16);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x15131e,
      roughness: 0.4,
      metalness: 0.65
    });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.set(0, -2.42, -0.4);
    this.group.add(ped);
  }

  createConvergenceStreams() {
    // 1400 particles streaming along curved paths from each of the 4 shrines into the central Aether Nexus
    const count = 1400;
    const geo = new THREE.BufferGeometry();
    const starts = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const params = new Float32Array(count * 3); // phase, speed, arcHeight

    const shrineConfigs = [
      { pos: this.elementPositions.fire, col: new THREE.Color(0xff5a14) },
      { pos: this.elementPositions.water, col: new THREE.Color(0x00d8ff) },
      { pos: this.elementPositions.earth, col: new THREE.Color(0x2eff78) },
      { pos: this.elementPositions.air, col: new THREE.Color(0xb8c8ff) }
    ];

    for (let i = 0; i < count; i++) {
      const s = shrineConfigs[i % 4];
      starts[i * 3] = s.pos.x + (Math.random() - 0.5) * 0.65;
      starts[i * 3 + 1] = s.pos.y + (Math.random() - 0.5) * 0.65;
      starts[i * 3 + 2] = s.pos.z + (Math.random() - 0.5) * 0.65;

      colors[i * 3] = s.col.r;
      colors[i * 3 + 1] = s.col.g;
      colors[i * 3 + 2] = s.col.b;

      params[i * 3] = Math.random(); // phase
      params[i * 3 + 1] = 0.28 + Math.random() * 0.35; // speed
      params[i * 3 + 2] = 1.4 + Math.random() * 1.6; // arc height
    }

    geo.setAttribute('position', new THREE.BufferAttribute(starts, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aParam', new THREE.BufferAttribute(params, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.uniforms.uTime,
        uIntensity: this.uniforms.uIntensity,
        uSurge: this.uniforms.uSurge,
        uTarget: { value: this.nexusPosition }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        uniform vec3 uTarget;
        attribute vec3 aColor;
        attribute vec3 aParam;

        varying vec3 vColor;
        varying float vLife;

        void main() {
          float phase = aParam.x;
          float speed = aParam.y * (0.85 + 0.3 * uIntensity + 0.6 * uSurge);
          float arcH = aParam.z;

          float t = fract(phase + uTime * speed);
          vLife = t;

          // Smooth quadratic Bezier curve from elemental core to central Aether Nexus
          vec3 p0 = position;
          vec3 p2 = uTarget;
          vec3 mid = mix(p0, p2, 0.5) + vec3(0.0, arcH, 0.0);

          float invT = 1.0 - t;
          vec3 pos = invT * invT * p0 + 2.0 * invT * t * mid + t * t * p2;

          // Subtle helical spiral along the energy stream
          float spiralAngle = t * 14.0 - uTime * 4.0 + phase * 20.0;
          float spiralR = sin(t * 3.14159) * 0.24;
          pos.x += cos(spiralAngle) * spiralR;
          pos.y += sin(spiralAngle) * spiralR;

          vColor = mix(aColor, vec3(1.0, 0.96, 0.92), smoothstep(0.7, 1.0, t));

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = (18.0 * sin(t * 3.14159) * (0.9 + 0.4 * uSurge)) / -mvPosition.z;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vLife;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float core = 1.0 - smoothstep(0.04, 0.5, d);
          gl_FragColor = vec4(vColor, core * sin(vLife * 3.14159) * 0.68);
        }
      `
    });

    const streamPoints = new THREE.Points(geo, mat);
    this.group.add(streamPoints);
  }

  triggerShockwave(elapsed) {
    this.uniforms.uShockwaveTime.value = elapsed;
  }

  update(elapsed, delta, intensity = 1.0, surge = 0.0) {
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uIntensity.value = intensity;
    this.uniforms.uSurge.value = surge;

    if (this.nexusGroup) {
      this.nexusGroup.position.y = 0.75 + Math.sin(elapsed * 1.8) * 0.14;
      const scale = 1.0 + surge * 0.35 + Math.sin(elapsed * 3.5) * 0.05;
      this.merkaba1.scale.setScalar(scale);
      this.merkaba2.scale.setScalar(scale);
      this.merkaba1.rotation.y = elapsed * (0.8 + surge);
      this.merkaba1.rotation.x = elapsed * 0.45;
      this.merkaba2.rotation.y = -elapsed * (0.95 + surge);
      this.merkaba2.rotation.z = elapsed * 0.55;
    }

    this.gyroRings.forEach((ring, i) => {
      ring.rotation.x += delta * (0.8 + i * 0.35) * (i % 2 === 0 ? 1 : -1) * (1 + surge);
      ring.rotation.y += delta * (0.65 + i * 0.25) * (1 + surge);
    });
  }
}
