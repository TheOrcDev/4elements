import * as THREE from "three";
import { simplexNoise3D } from "../glsl/noise.js";

// Fire: a GPU ember fountain + a flickering flame core + ground glow + light.
// Particles are animated entirely on the GPU from a per-particle seed, so we
// can afford tens of thousands of them with no per-frame CPU work.
export class Fire {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(14, 0, 0);
    this.group.rotation.y = -Math.PI / 2; // face the center

    this.color = new THREE.Color(0xff7a3d);
    this.focus = new THREE.Vector3(14, 2.2, 0);

    this._buildBase();
    this._buildEmbers();
    this._buildCore();
    this._buildLight();
  }

  _buildBase() {
    // A ring of glowing "coals" the fire rises from.
    const ringGeo = new THREE.TorusGeometry(1.6, 0.34, 24, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x2a1208,
      emissive: 0xff5a1a,
      emissiveIntensity: 1.4,
      roughness: 0.85,
      metalness: 0.0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.15;
    this.group.add(ring);

    // Glowing ground disc beneath the fire.
    const discGeo = new THREE.CircleGeometry(3.4, 64);
    const discMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uTime;
        void main(){
          vec2 p = vUv - 0.5;
          float d = length(p) * 2.0;
          float pulse = 0.8 + 0.2 * sin(uTime * 7.0);
          float glow = smoothstep(1.0, 0.0, d);
          glow = pow(glow, 2.2);
          vec3 col = mix(vec3(1.0, 0.35, 0.08), vec3(1.0, 0.75, 0.25), glow);
          gl_FragColor = vec4(col * glow * pulse, glow);
        }
      `,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.02;
    this.disc = disc;
    this.group.add(disc);

    // A few blackened logs around the base for grounding.
    const logMat = new THREE.MeshStandardMaterial({
      color: 0x140d0a,
      roughness: 1.0,
      emissive: 0x3a1505,
      emissiveIntensity: 0.4,
    });
    for (let i = 0; i < 5; i++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 2.2, 10),
        logMat
      );
      const a = (i / 5) * Math.PI * 2;
      log.position.set(Math.cos(a) * 1.1, 0.18, Math.sin(a) * 1.1);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = a + 0.4;
      this.group.add(log);
    }
  }

  _buildEmbers() {
    const COUNT = 9000;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Spread the spawn disc.
      const r = Math.sqrt(Math.random()) * 1.5;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(a) * r;
      // seed.x = spawn offset in cycle, seed.y = swirl phase, seed.z = size factor
      seeds[i * 3 + 0] = Math.random();
      seeds[i * 3 + 1] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 2] = Math.random();
      sizes[i] = 0.6 + Math.random() * 1.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uHeight: { value: 6.5 },
        uSpread: { value: 1.5 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed;
        attribute float aSize;
        uniform float uTime;
        uniform float uHeight;
        uniform float uSpread;
        varying float vLife;
        varying float vSeed;
        ${simplexNoise3D}

        void main(){
          // Each particle loops through a 0..1 life cycle offset by its seed.
          float life = fract(uTime * 0.18 + aSeed.x);
          vLife = life;
          vSeed = aSeed.z;

          // Rise upward, easing out so it slows near the top.
          float y = pow(life, 0.8) * uHeight;

          // Swirl outward as it rises.
          float swirl = life * 1.7;
          float ang = aSeed.y + swirl * 2.2 + snoise(vec3(life * 2.0, aSeed.x, 0.0)) * 1.5;
          float radius = uSpread * (0.4 + life * 1.4);
          float x = cos(ang) * radius;
          float z = sin(ang) * radius;

          // Turbulent lateral wobble.
          x += snoise(vec3(position.x * 1.5, life * 3.0, aSeed.x * 4.0)) * 0.35 * life;
          z += snoise(vec3(position.z * 1.5, life * 3.0, aSeed.x * 4.0 + 5.0)) * 0.35 * life;

          vec3 pos = vec3(x, y, z);
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;

          // Size grows briefly then shrinks to smoke.
          float sizePulse = sin(life * 3.14159);
          float size = aSize * sizePulse * (1.0 - life * 0.4) * 22.0;
          gl_PointSize = size * (1.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vLife;
        varying float vSeed;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if(d > 0.5) discard;
          float core = smoothstep(0.5, 0.0, d);
          float soft = pow(core, 2.2);

          // Color ramp: white-hot -> yellow -> orange -> red -> smoke.
          vec3 whiteHot = vec3(1.0, 0.95, 0.82);
          vec3 yellow   = vec3(1.0, 0.72, 0.28);
          vec3 orange   = vec3(1.0, 0.42, 0.12);
          vec3 red      = vec3(0.78, 0.12, 0.04);
          vec3 smoke    = vec3(0.18, 0.12, 0.14);

          vec3 col;
          float t = vLife;
          if(t < 0.18)      col = mix(whiteHot, yellow, t / 0.18);
          else if(t < 0.42) col = mix(yellow, orange, (t - 0.18) / 0.24);
          else if(t < 0.72) col = mix(orange, red, (t - 0.42) / 0.30);
          else              col = mix(red, smoke, (t - 0.72) / 0.28);

          float alpha = soft * (1.0 - smoothstep(0.85, 1.0, t));
          gl_FragColor = vec4(col * (1.4 + vSeed * 0.6), alpha);
        }
      `,
    });

    this.embers = new THREE.Points(geo, mat);
    this.embers.frustumCulled = false;
    this.group.add(this.embers);
  }

  _buildCore() {
    // A turbulent flame "tongue" cone driven by noise in the vertex shader.
    const geo = new THREE.ConeGeometry(1.1, 3.4, 48, 32, true);
    // Shift so the base sits on the ground.
    geo.translate(0, 1.7, 0);

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying float vY;
        varying vec3 vNormal;
        ${simplexNoise3D}
        void main(){
          vY = position.y;
          vNormal = normal;
          float h = position.y / 3.4;
          // Flicker the cone radially with noise, stronger near the tip.
          float n = snoise(vec3(position.x * 1.6, position.y * 0.8 - uTime * 1.6, position.z * 1.6));
          float wobble = n * 0.45 * (0.4 + h);
          vec3 pos = position + normal * wobble;
          // Sway the tip back and forth.
          pos.x += sin(uTime * 3.0 + position.y * 2.0) * 0.18 * h;
          pos.z += cos(uTime * 2.3 + position.y * 1.7) * 0.16 * h;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vY;
        varying vec3 vNormal;
        uniform float uTime;
        void main(){
          float h = clamp(vY / 3.4, 0.0, 1.0);
          vec3 hot = vec3(1.0, 0.95, 0.78);
          vec3 mid = vec3(1.0, 0.5, 0.16);
          vec3 cool = vec3(0.85, 0.16, 0.05);
          vec3 col = mix(hot, mid, smoothstep(0.0, 0.5, h));
          col = mix(col, cool, smoothstep(0.4, 1.0, h));
          // Fresnel-ish rim so the edges glow brighter.
          float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 1.5);
          float pulse = 0.85 + 0.15 * sin(uTime * 9.0 + vY * 3.0);
          float alpha = (0.55 + rim * 0.5) * (1.0 - h * 0.7) * pulse;
          gl_FragColor = vec4(col * (1.2 + rim), alpha);
        }
      `,
    });

    this.core = new THREE.Mesh(geo, mat);
    this.core.frustumCulled = false;
    this.group.add(this.core);
  }

  _buildLight() {
    this.light = new THREE.PointLight(0xff5a1a, 18, 30, 2.0);
    this.light.position.set(0, 1.6, 0);
    this.group.add(this.light);
  }

  update(time) {
    this.embers.material.uniforms.uTime.value = time;
    this.core.material.uniforms.uTime.value = time;
    this.disc.material.uniforms.uTime.value = time;
    // Flicker the light intensity for living flame.
    this.light.intensity = 16 + Math.sin(time * 11.0) * 3 + Math.sin(time * 23.0) * 2;
  }
}
