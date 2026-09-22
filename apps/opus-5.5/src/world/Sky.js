import * as THREE from 'three';
import { mulberry32 } from '../gl/noise.js';

// Night sky: gradient dome with a faint nebula band, plus twinkling star points.
export class Sky {
  constructor(ctx) {
    this.group = new THREE.Group();
    this.group.name = 'sky';

    const domeMat = new THREE.ShaderMaterial({
      uniforms: { uNoise: { value: ctx.noise3D }, uTime: ctx.uniforms.uTime },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler3D uNoise;
        uniform float uTime;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float y = d.y;
          vec3 zenith = vec3(0.0035, 0.0055, 0.016);
          vec3 horizon = vec3(0.020, 0.024, 0.048);
          vec3 below = vec3(0.004, 0.004, 0.008);
          vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.65, y));
          col = mix(below, col, smoothstep(-0.3, 0.03, y));

          // milky band + nebula
          vec3 bandN = normalize(vec3(0.42, 0.52, 0.74));
          float bd = dot(d, bandN);
          float band = exp(-bd * bd / 0.075);
          vec4 n = texture(uNoise, d * 0.42 + vec3(0.13, 0.27, 0.51));
          vec4 n2 = texture(uNoise, d * 1.1 + vec3(0.7, 0.1, 0.3));
          float neb = smoothstep(0.38, 0.95, n.r * 0.65 + n2.g * 0.5);
          vec3 nebA = vec3(0.075, 0.022, 0.11);
          vec3 nebB = vec3(0.010, 0.065, 0.095);
          vec3 nebCol = mix(nebA, nebB, smoothstep(0.3, 0.7, n2.a));
          col += nebCol * neb * band * 0.85;
          col += vec3(0.020, 0.018, 0.032) * band * (0.4 + 0.6 * n.b);
          // dark dust lanes inside the band
          col *= 1.0 - 0.45 * band * smoothstep(0.55, 0.8, n2.b);

          // soft warm glow low on the horizon, opposite the moon
          vec3 glowDir = normalize(vec3(0.6, 0.0, 0.8));
          float g = pow(max(dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), glowDir), 1e-4), 6.0) * exp(-abs(y) * 9.0);
          col += vec3(0.05, 0.022, 0.012) * g;
          gl_FragColor = vec4(col, 1.0);
        }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(400, 64, 32), domeMat);
    this.dome.renderOrder = -1000;
    this.dome.frustumCulled = false;
    this.group.add(this.dome);

    // Stars
    const count = 4200;
    const rand = mulberry32(2024);
    const pos = new Float32Array(count * 3);
    const data = new Float32Array(count * 4);
    const bandN = new THREE.Vector3(0.42, 0.52, 0.74).normalize();
    const v = new THREE.Vector3();
    let i = 0;
    while (i < count) {
      v.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
      const l = v.length();
      if (l > 1 || l < 0.1) continue;
      v.divideScalar(l);
      if (v.y < -0.12) continue;
      // concentrate some stars along the band
      const inBand = Math.exp(-(v.dot(bandN) ** 2) / 0.05);
      if (rand() > 0.35 + 0.65 * inBand) continue;
      pos.set([v.x * 300, v.y * 300, v.z * 300], i * 3);
      const mag = Math.pow(rand(), 7.0); // mostly faint
      const tint = rand();
      data.set([mag, tint, rand() * 100, 0.6 + rand() * 2.4], i * 4);
      i++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aData', new THREE.BufferAttribute(data, 4));
    this.starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: ctx.uniforms.uTime, uPixelRatio: ctx.uniforms.uPixelRatio },
      vertexShader: /* glsl */ `
        attribute vec4 aData;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vBright;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float mag = aData.x;
          float tw = 0.75 + 0.25 * sin(uTime * aData.w + aData.z) * sin(uTime * aData.w * 0.37 + aData.z * 1.7);
          vBright = (0.25 + mag * 5.5) * tw;
          vec3 cool = vec3(0.70, 0.80, 1.0);
          vec3 warm = vec3(1.0, 0.82, 0.62);
          vColor = aData.y < 0.7 ? mix(cool, vec3(1.0), aData.y / 0.7) : mix(vec3(1.0), warm, (aData.y - 0.7) / 0.3);
          gl_PointSize = (1.2 + mag * 3.2) * uPixelRatio;
          // fade toward the horizon haze
          vBright *= smoothstep(-0.05, 0.25, normalize(position).y);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vBright;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d);
          a *= a;
          gl_FragColor = vec4(vColor * vBright * a, 1.0);
        }`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      fog: false,
    });
    this.stars = new THREE.Points(geo, this.starMat);
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -999;
    this.group.add(this.stars);
  }

  update(camera) {
    this.group.position.copy(camera.position);
  }
}
