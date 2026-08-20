import * as THREE from "three";
import { simplexNoise3D, hashNoise2D } from "../glsl/noise.js";

// Water: a living sphere of water with internal waves, fresnel + caustic
// shading, a shallow reflective pool beneath, and falling droplets.
export class Water {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 14);
    this.group.rotation.y = Math.PI; // face the center

    this.color = new THREE.Color(0x4aa8ff);
    this.focus = new THREE.Vector3(0, 3.0, 14);

    this._buildOrb();
    this._buildPool();
    this._buildDroplets();
    this._buildLight();
  }

  _buildOrb() {
    const geo = new THREE.IcosahedronGeometry(2.2, 32);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uColorDeep: { value: new THREE.Color(0x063b6e) },
        uColorShallow: { value: new THREE.Color(0x4aa8ff) },
        uColorRim: { value: new THREE.Color(0xbfe9ff) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying vec3 vView;
        ${simplexNoise3D}
        void main(){
          // Layered noise displacement along the normal for living waves.
          float n1 = snoise(position * 1.4 + vec3(0.0, uTime * 0.6, 0.0));
          float n2 = snoise(position * 3.2 + vec3(uTime * 0.4, 0.0, uTime * 0.3)) * 0.4;
          float disp = (n1 + n2) * 0.18;
          vec3 pos = position + normal * disp;
          vPos = pos;
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColorDeep;
        uniform vec3 uColorShallow;
        uniform vec3 uColorRim;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying vec3 vView;
        ${hashNoise2D}

        void main(){
          vec3 N = normalize(vNormal);
          float fres = pow(1.0 - max(dot(N, vView), 0.0), 3.0);

          // Caustic-like pattern from animated fbm on the surface coords.
          vec2 cuv = vPos.xy * 1.6 + vec2(uTime * 0.4, uTime * 0.25);
          float caustic = fbm2(cuv + fbm2(cuv + uTime * 0.2));
          caustic = pow(clamp(caustic, 0.0, 1.0), 2.0);

          vec3 base = mix(uColorDeep, uColorShallow, clamp(vPos.y * 0.4 + 0.5, 0.0, 1.0));
          base += caustic * 0.25 * uColorShallow;
          vec3 col = mix(base, uColorRim, fres * 0.9);
          // A subtle specular highlight to read as wet.
          vec3 L = normalize(vec3(0.4, 0.8, 0.6));
          float spec = pow(max(dot(reflect(-L, N), vView), 0.0), 60.0);
          col += spec * 0.8;

          float alpha = 0.78 + fres * 0.22;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.orb = new THREE.Mesh(geo, mat);
    this.orb.position.y = 3.2;
    this.group.add(this.orb);

    // An inner glowing core to suggest depth and magic.
    const innerGeo = new THREE.IcosahedronGeometry(1.4, 4);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x2a7fd6,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.inner = new THREE.Mesh(innerGeo, innerMat);
    this.inner.position.y = 3.2;
    this.group.add(this.inner);
  }

  _buildPool() {
    const geo = new THREE.CircleGeometry(4.2, 96);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vPos;
        void main(){
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        ${hashNoise2D}
        void main(){
          vec2 p = vPos.xz;
          float r = length(p);
          // Concentric ripples emanating from the orb.
          float ripple = sin((r - uTime * 1.8) * 6.0) * 0.5 + 0.5;
          ripple *= smoothstep(4.2, 1.0, r);
          float n = fbm2(p * 1.2 + uTime * 0.15);
          vec3 deep = vec3(0.02, 0.12, 0.28);
          vec3 shallow = vec3(0.12, 0.5, 0.85);
          vec3 col = mix(deep, shallow, ripple * 0.6 + n * 0.4);
          float edge = smoothstep(4.2, 3.4, r);
          gl_FragColor = vec4(col, edge * 0.85);
        }
      `,
    });
    this.pool = new THREE.Mesh(geo, mat);
    this.pool.rotation.x = -Math.PI / 2;
    this.pool.position.y = 0.05;
    this.group.add(this.pool);
  }

  _buildDroplets() {
    const COUNT = 1200;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.6 + Math.random() * 2.6;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = Math.sin(a) * r;
      seeds[i * 2 + 0] = Math.random();
      seeds[i * 2 + 1] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 2));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec2 aSeed;
        uniform float uTime;
        varying float vLife;
        void main(){
          // Fall in a looping cycle.
          float life = fract(uTime * 0.12 + aSeed.x);
          vLife = life;
          float y = 6.0 - life * 6.0;
          float a = aSeed.y * 6.2831 + uTime * 0.4;
          float r = 1.6 + aSeed.x * 2.6;
          float x = cos(a) * r;
          float z = sin(a) * r;
          vec3 pos = vec3(x, y, z);
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.0 - life) * 9.0 * (1.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vLife;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if(d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d);
          vec3 col = vec3(0.5, 0.78, 1.0);
          gl_FragColor = vec4(col, a * (1.0 - vLife) * 0.9);
        }
      `,
    });
    this.droplets = new THREE.Points(geo, mat);
    this.droplets.frustumCulled = false;
    this.group.add(this.droplets);
  }

  _buildLight() {
    this.light = new THREE.PointLight(0x4aa8ff, 6, 22, 2.0);
    this.light.position.set(0, 3.2, 0);
    this.group.add(this.light);
  }

  update(time) {
    this.orb.material.uniforms.uTime.value = time;
    this.pool.material.uniforms.uTime.value = time;
    this.droplets.material.uniforms.uTime.value = time;
    this.inner.scale.setScalar(1 + Math.sin(time * 1.5) * 0.04);
    this.orb.rotation.y = time * 0.15;
  }
}
