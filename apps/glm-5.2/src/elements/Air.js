import * as THREE from "three";
import { simplexNoise3D, hashNoise2D } from "../glsl/noise.js";

// Air: a swirling cyclone of particles spiraling upward, soft drifting
// cloud puffs, and a glowing central vortex eye. Light, translucent whites
// and pale blues with strong additive bloom.
export class Air {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, -14);
    this.group.rotation.y = 0; // already faces the center (-Z)

    this.color = new THREE.Color(0xcfe6ff);
    this.focus = new THREE.Vector3(0, 3.0, -14);

    this._buildCyclone();
    this._buildClouds();
    this._buildEye();
    this._buildLight();
  }

  _buildCyclone() {
    const COUNT = 8000;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Distribute particles in a tall funnel: wide at the top, narrow at the base.
      const t = Math.random();
      const baseR = 0.4 + t * 2.6;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(a) * baseR;
      positions[i * 3 + 1] = t * 6.0;
      positions[i * 3 + 2] = Math.sin(a) * baseR;
      seeds[i * 3 + 0] = a;
      seeds[i * 3 + 1] = Math.random();
      seeds[i * 3 + 2] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed;
        uniform float uTime;
        varying float vT;
        varying float vSeed;
        ${simplexNoise3D}
        void main(){
          // Normalized height up the funnel.
          float t = position.y / 6.0;
          vT = t;
          vSeed = aSeed.z;
          // Radius tapers as it rises, then flares at the very top.
          float r = mix(0.5, 2.8, t) + sin(t * 8.0 + uTime) * 0.15;
          // Spiral angle advances with time, faster near the base.
          float ang = aSeed.x + uTime * (2.2 - t * 1.4) + t * 6.0;
          float x = cos(ang) * r;
          float z = sin(ang) * r;
          // Add turbulent noise wobble so it reads as wind, not a rigid spiral.
          x += snoise(vec3(x * 0.5, t * 2.0 + uTime, z * 0.5)) * 0.3;
          z += snoise(vec3(x * 0.5 + 5.0, t * 2.0 + uTime, z * 0.5)) * 0.3;
          float y = position.y + sin(uTime * 1.5 + aSeed.y * 6.28) * 0.1;
          vec3 pos = vec3(x, y, z);
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.0 - t * 0.5) * 14.0 * (1.0 / -mv.z) * (0.6 + aSeed.y);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vT;
        varying float vSeed;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if(d > 0.5) discard;
          float soft = smoothstep(0.5, 0.0, d);
          vec3 pale = vec3(0.82, 0.92, 1.0);
          vec3 white = vec3(1.0);
          vec3 col = mix(pale, white, vSeed);
          float alpha = soft * (0.35 + (1.0 - vT) * 0.4);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    this.cyclone = new THREE.Points(geo, mat);
    this.cyclone.frustumCulled = false;
    this.group.add(this.cyclone);
  }

  _buildClouds() {
    const COUNT = 40;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.random() * 2.5;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = 1.5 + Math.random() * 5;
      positions[i * 3 + 2] = Math.sin(a) * r;
      seeds[i * 3 + 0] = Math.random();
      seeds[i * 3 + 1] = Math.random();
      seeds[i * 3 + 2] = Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));

    // Soft cloud puffs as large additive billboards.
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed;
        uniform float uTime;
        varying float vSeed;
        void main(){
          vSeed = aSeed.z;
          vec3 pos = position;
          pos.x += sin(uTime * 0.3 + aSeed.x * 6.28) * 1.2;
          pos.z += cos(uTime * 0.25 + aSeed.y * 6.28) * 1.2;
          pos.y += sin(uTime * 0.4 + aSeed.x * 3.14) * 0.3;
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = 220.0 * (1.0 / -mv.z) * (0.6 + aSeed.x);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vSeed;
        ${hashNoise2D}
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          // A few concentric soft blobs to read as a fluffy cloud.
          float blob = 0.0;
          for(int i = 0; i < 4; i++){
            float fi = float(i);
            vec2 o = vec2(sin(fi * 2.3), cos(fi * 1.7)) * 0.18;
            blob += smoothstep(0.5, 0.0, length(uv - o)) * 0.4;
          }
          float a = clamp(blob, 0.0, 1.0) * 0.18;
          vec3 col = vec3(0.8, 0.88, 1.0);
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    this.clouds = new THREE.Points(geo, mat);
    this.clouds.frustumCulled = false;
    this.group.add(this.clouds);
  }

  _buildEye() {
    // A glowing central vortex eye — a vertical plane with a spiral shader.
    const geo = new THREE.PlaneGeometry(2.6, 5.2);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
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
        ${hashNoise2D}
        void main(){
          vec2 p = vUv - vec2(0.5, 0.5);
          float r = length(p) * 2.0;
          float ang = atan(p.y, p.x);
          // Spiral arms.
          float spiral = sin(ang * 3.0 + r * 6.0 - uTime * 2.5);
          float arms = smoothstep(0.0, 1.0, spiral) * (1.0 - r * 0.5);
          float n = fbm2(vUv * 4.0 + uTime * 0.2);
          float glow = arms * 0.6 + n * 0.2;
          glow *= smoothstep(1.0, 0.1, r);
          vec3 col = mix(vec3(0.6, 0.8, 1.0), vec3(1.0), glow);
          gl_FragColor = vec4(col * glow, glow * 0.8);
        }
      `,
    });
    this.eye = new THREE.Mesh(geo, mat);
    this.eye.position.y = 3.0;
    this.group.add(this.eye);
  }

  _buildLight() {
    this.light = new THREE.PointLight(0xcfe6ff, 4, 20, 2.0);
    this.light.position.set(0, 3.0, 0);
    this.group.add(this.light);
  }

  update(time) {
    this.cyclone.material.uniforms.uTime.value = time;
    this.clouds.material.uniforms.uTime.value = time;
    this.eye.material.uniforms.uTime.value = time;
    this.eye.rotation.z = time * 0.3;
    // Billboard the eye toward the camera handled by caller if needed.
  }
}
