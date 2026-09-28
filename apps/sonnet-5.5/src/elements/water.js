import * as THREE from 'three';
import { GLSL_HASH, GLSL_SNOISE, GLSL_EQUIRECT } from '../shaders/glsl.js';
import { mulberry32, range, TAU } from '../utils/rng.js';
import { roughLathe, paintVertices, fbm, randomArray } from '../utils/geometry.js';

const WATER_Y = 0.8;
const POOL_R = 3.2;
const ORB_Y = 3.85;
const ORB_R = 1.15;

// ---------------------------------------------------------------------------------------------
// Pool surface — a custom shader: layered wave normals + expanding ripple rings from droplets,
// Fresnel reflection of the baked sky, an analytic reflection of the glowing orb, animated
// caustics on the "floor", moon glints and foam at the rim.
// ---------------------------------------------------------------------------------------------
const POOL_VERT = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const POOL_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uPower;
  uniform sampler2D uNoise;
  uniform sampler2D uSky;
  uniform vec3 uCenter;
  uniform float uRadius;
  uniform vec4 uRipples[8];
  uniform vec3 uOrbPos;
  uniform float uOrbRadius;
  uniform vec3 uOrbColor;
  uniform vec3 uMoonDir;
  varying vec3 vWorldPos;
  ${GLSL_HASH}
  ${GLSL_EQUIRECT}

  float ripples(vec2 p) {
    float h = 0.0;
    for (int i = 0; i < 8; i++) {
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if (age > 0.0 && age < 7.0) {
        float d = length(p - r.xy);
        float x = d - age * 1.7;
        float env = exp(-x * x * 3.2) * exp(-age * 0.45);
        h += r.w * cos(x * 7.0) * env / (1.0 + d * 1.4);
      }
    }
    return h;
  }

  float heightAt(vec2 p) {
    float t = uTime;
    float h = 0.0;
    h += sin(dot(p, vec2(0.83, 0.55)) * 1.7 + t * 1.1) * 0.022;
    h += sin(dot(p, vec2(-0.6, 0.8)) * 2.6 + t * 1.5) * 0.014;
    h += (texture(uNoise, p * 0.21 + vec2(t * 0.013, t * 0.008)).r - 0.5) * 0.11;
    h += (texture(uNoise, p * 0.47 - vec2(t * 0.02, -t * 0.014)).g - 0.5) * 0.06;
    // slow pulse from the orb above
    float d = length(p - uOrbPos.xz);
    h += sin(d * 3.4 - t * (1.6 + uPower * 2.0)) * exp(-d * 0.55) * (0.018 + 0.03 * uPower);
    h += ripples(p);
    return h;
  }

  vec3 waterNormal(vec2 p) {
    float e = 0.035;
    float hc = heightAt(p);
    float hx = heightAt(p + vec2(e, 0.0));
    float hz = heightAt(p + vec2(0.0, e));
    return normalize(vec3((hc - hx) / e, 1.0, (hc - hz) / e));
  }

  float worleyEdge(vec2 p, float t) {
    vec2 g = floor(p);
    vec2 f = fract(p);
    float F1 = 8.0;
    float F2 = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j));
        vec2 hh = h22(g + o);
        hh = 0.5 + 0.45 * sin(t + 6.2831 * hh);
        vec2 r = o + hh - f;
        float d = dot(r, r);
        if (d < F1) { F2 = F1; F1 = d; } else if (d < F2) { F2 = d; }
      }
    }
    return sqrt(F2) - sqrt(F1);
  }

  float caustics(vec2 p, float t) {
    // warp the domain so cell edges wander like refracted light instead of forming a tidy mosaic
    vec2 w = vec2(sin(p.y * 1.4 + t * 0.5), cos(p.x * 1.2 - t * 0.4)) * 0.3
           + vec2(sin(p.y * 3.1 - t * 0.8), cos(p.x * 2.7 + t * 0.7)) * 0.09;
    p += w;
    float a = worleyEdge(p * 1.05 + vec2(t * 0.05, 0.0), t * 0.6);
    float b = worleyEdge(p * 1.6 - vec2(0.0, t * 0.07) + 7.3, t * 0.8 + 2.0);
    float patchy = 0.55 + 0.9 * texture(uNoise, p * 0.09 + t * 0.008).r;
    return ((1.0 - smoothstep(0.0, 0.3, a)) * 0.55 + (1.0 - smoothstep(0.0, 0.25, b)) * 0.5) * patchy;
  }

  void main() {
    vec2 p = vWorldPos.xz;
    vec3 N = waterNormal(p);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float F = 0.06 + 0.94 * pow(max(1.0 - ndv, 0.0), 4.0);

    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 sky = textureLod(uSky, skyUV(R), 1.5).rgb;

    float rr = length(p - uCenter.xz) / uRadius;
    vec3 deep = vec3(0.003, 0.05, 0.15);
    vec3 shallow = vec3(0.012, 0.19, 0.34);
    vec3 body = mix(shallow, deep, smoothstep(1.0, 0.1, rr));

    // light thrown down by the orb, spreading through the pool
    vec2 od = p - uOrbPos.xz;
    float glow = exp(-dot(od, od) * 0.14);
    body += uOrbColor * glow * (0.28 + 0.4 * uPower);
    float c = caustics(p, uTime);
    body += vec3(0.22, 0.8, 1.0) * c * c * (0.16 + 0.7 * glow + 0.25 * uPower);

    // reflections: sky + an analytic mirror image of the orb
    vec3 refl = sky * 1.7;
    vec3 oc = vWorldPos - uOrbPos;
    float b = dot(oc, R);
    float cc = dot(oc, oc) - uOrbRadius * uOrbRadius;
    float disc = b * b - cc;
    if (disc > 0.0) {
      float tt = -b - sqrt(disc);
      if (tt > 0.0) {
        vec3 hit = vWorldPos + R * tt;
        vec3 sn = normalize(hit - uOrbPos);
        float f = pow(max(1.0 - abs(dot(sn, -R)), 0.0), 1.4);
        vec3 orb = uOrbColor * (0.9 + 1.6 * f) * 1.4;
        refl = mix(refl, orb, smoothstep(0.0, 0.12, disc));
      }
    }
    vec3 col = mix(body, refl, F);

    // glints: moon and the orb's own light
    float sp = pow(max(dot(R, uMoonDir), 0.0), 450.0) * 6.0;
    vec3 Lo = normalize(uOrbPos - vWorldPos);
    vec3 H = normalize(Lo + V);
    sp += pow(max(dot(N, H), 0.0), 220.0) * (0.9 + glow * 2.2);
    col += sp * vec3(0.75, 0.95, 1.0);

    // foam / wet edge at the rim
    float rim = smoothstep(0.9, 1.0, rr);
    float fn = texture(uNoise, p * 0.9 + uTime * 0.03).r;
    col = mix(col, vec3(0.55, 0.9, 1.0) * 0.9, rim * smoothstep(0.3, 0.75, fn) * 0.65);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Shared by the glass orb and its rim shell so both wobble identically.
const ORB_DISP = /* glsl */ `
  ${GLSL_SNOISE}
  float orbDisp(vec3 n) {
    float t = uTime;
    return (snoise(n * 1.5 + vec3(0.0, t * 0.55, 0.0)) * 0.075 + snoise(n * 3.4 - vec3(t * 0.8, 0.0, 0.0)) * 0.028) * uWobble;
  }
  vec3 orbSurf(vec3 n) { return n * ${ORB_R.toFixed(4)} * (1.0 + orbDisp(n)); }
`;

// ---------------------------------------------------------------------------------------------
// Interior of the orb: drifting caustic veins + fresnel glow (additive, drawn over the glass).
// ---------------------------------------------------------------------------------------------
const CORE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uPower;
  varying vec3 vN;
  varying vec3 vP;
  varying vec3 vView;
  ${GLSL_SNOISE}
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vView);
    float fres = pow(max(1.0 - abs(dot(n, v)), 0.0), 1.5);
    float w = snoise(vP * 2.7 + vec3(0.0, uTime * 0.45, 0.0)) * 0.6 + snoise(vP * 5.6 - uTime * 0.7) * 0.3;
    float veins = pow(max(1.0 - abs(w), 0.0), 5.0);
    vec3 col = mix(vec3(0.01, 0.12, 0.34), vec3(0.16, 0.62, 0.95), veins) * (0.12 + fres * 0.7 + veins * 0.4);
    col *= 1.0 + uPower * 1.2;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const BUBBLE_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uScale;
  uniform float uPower;
  varying float vA;
  void main() {
    float r = 0.85;
    float spd = 0.12 + 0.2 * aSeed.w;
    float y = mod(aSeed.y * 2.0 * r + uTime * spd * (1.0 + uPower), 2.0 * r) - r;
    float ang = aSeed.x * 6.2831 + uTime * (0.2 + aSeed.z * 0.4);
    float rad = sqrt(max(r * r - y * y, 0.0)) * (0.25 + 0.7 * aSeed.z);
    vec3 p = vec3(cos(ang) * rad, y, sin(ang) * rad);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.02 + 0.05 * aSeed.z) * uScale / -mv.z;
    vA = smoothstep(r, r * 0.6, abs(y));
  }
`;

const BUBBLE_FRAG = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float ring = smoothstep(0.55, 0.92, d) * smoothstep(1.0, 0.9, d);
    float fill = (1.0 - d) * 0.16;
    float hi = smoothstep(0.35, 0.0, length(gl_PointCoord - vec2(0.32, 0.3)));
    float a = (ring * 0.9 + fill + hi * 0.7) * vA;
    gl_FragColor = vec4(vec3(0.6, 0.95, 1.2) * 1.4, a);
  }
`;

export function createWater(ctx) {
  const { time, noise, pointScale, sky, moonDir } = ctx;
  const rng = mulberry32(23);
  const group = new THREE.Group();
  group.name = 'water';
  const power = { value: 0 };

  // ---------------------------------------------------------------- basin
  const profile = [
    [0, 0],
    [4.05, 0],
    [4.05, 0.3],
    [3.9, 0.44],
    [3.9, 0.92],
    [3.66, 1.04],
    [3.36, 1.04],
    [3.22, 0.96],
    [3.22, 0.5],
    [0, 0.5],
  ];
  const basinGeo = roughLathe(profile, 144, 6, (v) => {
    const r = Math.hypot(v.x, v.z);
    if (v.y < 0.03 || (r < 3.24 && v.y < 0.55)) return;
    const n = fbm(v.x * 1.1, v.y * 1.1, v.z * 1.1, 4);
    const k = 0.05;
    const nx = v.x / (r || 1);
    const nz = v.z / (r || 1);
    v.x += nx * n * k;
    v.z += nz * n * k;
    v.y += n * k * 0.4;
  });
  paintVertices(basinGeo, (p) => {
    const g = 0.75 + 0.5 * (fbm(p.x * 1.8, p.y * 1.8, p.z * 1.8, 3) * 0.5 + 0.5);
    const streak = 0.9 + 0.1 * Math.sin(p.y * 38 + fbm(p.x, 0, p.z, 2) * 6);
    return new THREE.Color(0.115, 0.15, 0.2).multiplyScalar(g * streak);
  });
  const basin = new THREE.Mesh(basinGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.25 }));
  basin.castShadow = true;
  basin.receiveShadow = true;
  group.add(basin);

  // glowing runes: aqua ring on the rim + small slits around the outer wall
  const aqua = new THREE.Color(0.12, 0.62, 1.25);
  const rimGlow = new THREE.Mesh(new THREE.TorusGeometry(3.51, 0.028, 8, 200), new THREE.MeshBasicMaterial({ color: aqua }));
  rimGlow.rotation.x = Math.PI / 2;
  rimGlow.position.y = 1.045;
  group.add(rimGlow);

  {
    const count = 28;
    const geo = new THREE.BoxGeometry(0.09, 0.34, 0.05);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: aqua.clone().multiplyScalar(0.9) }), count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU;
      q.setFromEuler(new THREE.Euler(0, -a + Math.PI / 2, 0));
      const h = 0.34 * (i % 2 ? 0.7 : 1.0);
      m.compose(new THREE.Vector3(Math.cos(a) * 3.93, 0.62 + (i % 2 ? 0.03 : 0), Math.sin(a) * 3.93), q, new THREE.Vector3(1, h / 0.34, 1));
      mesh.setMatrixAt(i, m);
    }
    group.add(mesh);
  }

  // ---------------------------------------------------------------- pool surface
  const ripples = Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -100, 0));
  const orbWorld = new THREE.Vector3();
  const centerWorld = new THREE.Vector3();
  const baseWorld = new THREE.Vector3();
  const _v = new THREE.Vector3();
  const orbColor = new THREE.Color(0.22, 0.75, 1.05);
  const poolMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uPower: power,
      uNoise: { value: noise },
      uSky: { value: sky },
      uCenter: { value: centerWorld },
      uRadius: { value: POOL_R },
      uRipples: { value: ripples },
      uOrbPos: { value: orbWorld },
      uOrbRadius: { value: ORB_R },
      uOrbColor: { value: orbColor },
      uMoonDir: { value: moonDir },
    },
    vertexShader: POOL_VERT,
    fragmentShader: POOL_FRAG,
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(POOL_R + 0.02, 128), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = WATER_Y;
  group.add(pool);

  // ---------------------------------------------------------------- the orb
  const orbGroup = new THREE.Group();
  orbGroup.position.y = ORB_Y;
  group.add(orbGroup);

  const orbMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.02,
    transmission: 1,
    thickness: 2.4,
    ior: 1.33,
    attenuationColor: new THREE.Color(0x1aa0ff),
    attenuationDistance: 2.2,
    specularIntensity: 1,
    envMapIntensity: 5.0,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    dispersion: 0.7,
  });
  orbMat.depthWrite = false;
  const orbUniforms = { uTime: time, uWobble: { value: 1 } };
  orbMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, orbUniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        uniform float uTime;
        uniform float uWobble;
        ${ORB_DISP}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        vec3 gN0 = normalize(position);
        vec3 gRef = abs(gN0.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 gT = normalize(cross(gN0, gRef));
        vec3 gB = cross(gN0, gT);
        vec3 gS0 = orbSurf(gN0);
        vec3 gS1 = orbSurf(normalize(gN0 + gT * 0.02));
        vec3 gS2 = orbSurf(normalize(gN0 + gB * 0.02));
        vec3 objectNormal = normalize(cross(gS1 - gS0, gS2 - gS0));
        if (dot(objectNormal, gN0) < 0.0) objectNormal = -objectNormal;
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = gS0;');
    orbMat.userData.shader = shader;
  };
  const orb = new THREE.Mesh(new THREE.SphereGeometry(ORB_R, 128, 96), orbMat);
  orb.renderOrder = 1;
  orbGroup.add(orb);

  // inner caustic energy
  const coreMat = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uPower: power },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vP;
      varying vec3 vView;
      void main() {
        vP = position;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: CORE_FRAG,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(ORB_R * 0.62, 64, 48), coreMat);
  core.renderOrder = 3;
  orbGroup.add(core);

  // fresnel rim + studio highlights so the sphere reads as glass even against a dark sky
  const shellMat = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uWobble: orbUniforms.uWobble },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uWobble;
      varying vec3 vN;
      varying vec3 vView;
      ${ORB_DISP}
      void main() {
        vec3 n0 = normalize(position);
        vec3 ref = abs(n0.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 T = normalize(cross(n0, ref));
        vec3 B = cross(n0, T);
        vec3 s0 = orbSurf(n0) * 1.012;
        vec3 s1 = orbSurf(normalize(n0 + T * 0.02)) * 1.012;
        vec3 s2 = orbSurf(normalize(n0 + B * 0.02)) * 1.012;
        vec3 nn = normalize(cross(s1 - s0, s2 - s0));
        if (dot(nn, n0) < 0.0) nn = -nn;
        vN = normalize(normalMatrix * nn);
        vec4 mv = modelViewMatrix * vec4(s0, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(vView);
        float fres = pow(max(1.0 - abs(dot(n, v)), 0.0), 3.0);
        vec3 L1 = normalize(vec3(-0.5, 0.65, 0.6));
        vec3 L2 = normalize(vec3(0.7, -0.35, 0.5));
        float s1 = pow(max(dot(reflect(-L1, n), v), 0.0), 110.0);
        float s2 = pow(max(dot(reflect(-L2, n), v), 0.0), 70.0) * 0.45;
        vec3 col = vec3(0.22, 0.75, 1.15) * fres * 1.25 + vec3(1.0) * (s1 * 2.4 + s2);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(ORB_R, 128, 96), shellMat);
  shell.renderOrder = 5;
  orbGroup.add(shell);

  // bubbles inside the sphere
  {
    const N = 90;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(randomArray(rng, N, 4), 4));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uScale: pointScale, uPower: power },
      vertexShader: BUBBLE_VERT,
      fragmentShader: BUBBLE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bubbles = new THREE.Points(g, m);
    bubbles.frustumCulled = false;
    bubbles.renderOrder = 4;
    orbGroup.add(bubbles);
  }

  // soft halo behind the orb
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: ctx.softSprite, color: new THREE.Color(0.1, 0.55, 1.0), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 }),
  );
  halo.scale.setScalar(5.2);
  halo.renderOrder = 0;
  orbGroup.add(halo);

  // ---------------------------------------------------------------- water ribbons
  const ribbons = [];
  {
    const SEG_U = 260;
    const SEG_V = 16;
    const pos = new Float32Array((SEG_U + 1) * (SEG_V + 1) * 3);
    const par = new Float32Array((SEG_U + 1) * (SEG_V + 1) * 2);
    const idx = [];
    for (let i = 0; i <= SEG_U; i++) {
      for (let j = 0; j <= SEG_V; j++) {
        const k = i * (SEG_V + 1) + j;
        par[k * 2] = i / SEG_U;
        par[k * 2 + 1] = (j / SEG_V) * TAU;
      }
    }
    for (let i = 0; i < SEG_U; i++) {
      for (let j = 0; j < SEG_V; j++) {
        const a = i * (SEG_V + 1) + j;
        const b = a + SEG_V + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aParam', new THREE.BufferAttribute(par, 2));
    geo.setIndex(idx);

    const defs = [
      { phase: 0.0, radius: 1.95, speed: 0.55, span: 0.78, tilt: 0.42, thick: 0.15, y: 0.0, amp: 0.22 },
      { phase: 2.4, radius: 2.3, speed: -0.42, span: 0.66, tilt: -0.62, thick: 0.13, y: 0.1, amp: 0.3 },
      { phase: 4.3, radius: 1.75, speed: 0.72, span: 0.58, tilt: 1.02, thick: 0.115, y: -0.05, amp: 0.2 },
    ];
    for (const d of defs) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.03,
        transmission: 1,
        thickness: 0.6,
        ior: 1.33,
        attenuationColor: new THREE.Color(0x4cc4ff),
        attenuationDistance: 1.8,
        envMapIntensity: 5.0,
        clearcoat: 1,
        dispersion: 0.5,
        emissive: new THREE.Color(0x0a5f9e),
        emissiveIntensity: 0.6,
      });
      const u = {
        uTime: time,
        uPhase: { value: d.phase },
        uRibA: { value: new THREE.Vector3(d.radius, d.span, d.tilt) },
        uRibB: { value: new THREE.Vector3(d.thick, d.y, d.amp) },
      };
      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, u);
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            /* glsl */ `#include <common>
            attribute vec2 aParam;
            uniform float uTime;
            uniform float uPhase;
            uniform vec3 uRibA;   // radius, span (turns), tilt
            uniform vec3 uRibB;   // thickness, y offset, wave amplitude
            vec3 ribPath(float u) {
              float ang = uPhase + u * uRibA.y * 6.2831853;
              float r = uRibA.x * (1.0 + 0.09 * sin(u * 11.0 + uTime * 1.6));
              vec3 p = vec3(cos(ang) * r, uRibB.y + sin(ang * 2.0 + uTime * 0.9) * uRibB.z, sin(ang) * r);
              float c = cos(uRibA.z);
              float s = sin(uRibA.z);
              return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
            }`,
          )
          .replace(
            '#include <beginnormal_vertex>',
            /* glsl */ `
            float gU = aParam.x;
            float gV = aParam.y;
            vec3 gP = ribPath(gU);
            vec3 gT = normalize(ribPath(min(gU + 0.004, 1.0)) - ribPath(max(gU - 0.004, 0.0)));
            vec3 gRef = abs(gT.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
            vec3 gN1 = normalize(cross(gT, gRef));
            vec3 gB1 = cross(gN1, gT);
            vec3 gDir = gN1 * cos(gV) + gB1 * sin(gV);
            float gRad = uRibB.x * pow(max(sin(3.14159265 * gU), 0.0), 0.6) * (1.0 + 0.25 * sin(gU * 26.0 - uTime * 3.0));
            vec3 objectNormal = gDir;
            #ifdef USE_TANGENT
              vec3 objectTangent = vec3(tangent.xyz);
            #endif`,
          )
          .replace('#include <begin_vertex>', 'vec3 transformed = gP + gDir * gRad;');
      };
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = 2;
      orbGroup.add(mesh);
      ribbons.push({ mesh, u, speed: d.speed });
    }
  }

  // ---------------------------------------------------------------- droplets
  const DROPS = 46;
  const dropGeo = new THREE.SphereGeometry(1, 12, 8);
  const dropMat = new THREE.MeshStandardMaterial({
    color: 0xbfeaff,
    emissive: new THREE.Color(0x2596d6),
    emissiveIntensity: 1.5,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
    envMapIntensity: 2,
  });
  const drops = new THREE.InstancedMesh(dropGeo, dropMat, DROPS);
  drops.frustumCulled = false;
  group.add(drops);

  const dropState = Array.from({ length: DROPS }, () => ({
    p: new THREE.Vector3(),
    v: new THREE.Vector3(),
    r: 0.07,
    wait: rng() * 4,
    alive: false,
  }));
  let rippleSlot = 0;
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();

  function spawnDrop(d, t) {
    // start on the lower half of the orb, moving outward
    const a = rng() * TAU;
    const el = range(rng, -0.25, -1.2);
    const rr = ORB_R * 0.95;
    const dir = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    d.p.set(dir.x * rr, ORB_Y + dir.y * rr, dir.z * rr);
    const out = range(rng, 0.7, 2.3);
    d.v.set(dir.x * out, range(rng, 0.2, 1.6), dir.z * out);
    d.r = range(rng, 0.045, 0.11);
    d.alive = true;
  }

  function addRipple(x, z, t, amp) {
    ripples[rippleSlot].set(x, z, t, amp);
    rippleSlot = (rippleSlot + 1) % ripples.length;
  }

  // ---------------------------------------------------------------- splashes
  // Tiny droplets thrown up where a falling drop hits the pool (CPU-simulated, GPU-drawn points).
  const SPL = 200;
  const splPos = new Float32Array(SPL * 3);
  const splVel = new Float32Array(SPL * 3);
  const splAge = new Float32Array(SPL).fill(1);
  const splLife = new Float32Array(SPL).fill(1);
  const splAttr = new Float32Array(SPL * 2); // alpha, size
  const splGeo = new THREE.BufferGeometry();
  splGeo.setAttribute('position', new THREE.BufferAttribute(splPos, 3).setUsage(THREE.DynamicDrawUsage));
  splGeo.setAttribute('aAttr', new THREE.BufferAttribute(splAttr, 2).setUsage(THREE.DynamicDrawUsage));
  const splMat = new THREE.ShaderMaterial({
    uniforms: { uScale: pointScale },
    vertexShader: /* glsl */ `
      attribute vec2 aAttr;
      uniform float uScale;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aAttr.y * uScale / -mv.z;
        vA = aAttr.x;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        gl_FragColor = vec4(vec3(0.55, 0.9, 1.3) * 1.6, a * a * vA);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const splashPts = new THREE.Points(splGeo, splMat);
  splashPts.frustumCulled = false;
  splashPts.renderOrder = 6;
  group.add(splashPts);
  let splSlot = 0;
  function spawnSplash(x, z, size) {
    const n = 6 + Math.floor(rng() * 6);
    for (let k = 0; k < n; k++) {
      const i = splSlot;
      splSlot = (splSlot + 1) % SPL;
      const a = rng() * TAU;
      const sp = range(rng, 0.3, 1.1);
      splPos.set([x, WATER_Y + 0.02, z], i * 3);
      splVel.set([Math.cos(a) * sp, range(rng, 1.3, 2.7) * (0.7 + size * 4), Math.sin(a) * sp], i * 3);
      splAge[i] = 0;
      splLife[i] = range(rng, 0.5, 0.95);
      splAttr[i * 2 + 1] = range(rng, 0.03, 0.075);
    }
  }

  // ---------------------------------------------------------------- lights
  const light = new THREE.PointLight(0x40c8ff, 42, 18, 2);
  light.position.set(0, ORB_Y, 0);
  group.add(light);
  const poolLight = new THREE.PointLight(0x1fa5ff, 12, 9, 2);
  poolLight.position.set(0, 1.5, 0);
  group.add(poolLight);

  // ---------------------------------------------------------------- update
  let ribPhase = ribbons.map((r) => r.u.uPhase.value);
  function update(t, dt) {
    group.getWorldPosition(baseWorld);
    centerWorld.set(baseWorld.x, baseWorld.y + WATER_Y, baseWorld.z);
    const bob = Math.sin(t * 0.8) * 0.16 + Math.sin(t * 1.9) * 0.04;
    orbGroup.position.y = ORB_Y + bob + power.value * 0.25;
    orbWorld.set(baseWorld.x, baseWorld.y + orbGroup.position.y, baseWorld.z);
    const s = 1 + 0.1 * power.value;
    orb.scale.setScalar(s);
    core.scale.setScalar(s);
    shell.scale.setScalar(s);
    poolMat.uniforms.uOrbRadius.value = ORB_R * s;
    orbUniforms.uWobble.value = 1 + 2.4 * power.value;
    orbMat.thickness = 2.4 + power.value * 0.6;

    ribbons.forEach((r, i) => {
      ribPhase[i] += dt * r.speed * (1 + 1.4 * power.value);
      r.u.uPhase.value = ribPhase[i];
    });

    // droplets fall from the orb and stir the pool
    for (let i = 0; i < DROPS; i++) {
      const d = dropState[i];
      if (!d.alive) {
        d.wait -= dt * (1 + 2.2 * power.value);
        if (d.wait <= 0) spawnDrop(d, t);
        _s.setScalar(0.0001);
        _m.compose(d.p, _q, _s);
        drops.setMatrixAt(i, _m);
        continue;
      }
      d.v.y -= 9.0 * dt;
      d.p.addScaledVector(d.v, dt);
      const local = Math.hypot(d.p.x, d.p.z);
      if (d.p.y <= WATER_Y + 0.02) {
        if (local < POOL_R - 0.1) {
          group.localToWorld(_v.set(d.p.x, 0, d.p.z));
          addRipple(_v.x, _v.z, t, 0.010 + d.r * 0.12 + power.value * 0.012);
          spawnSplash(d.p.x, d.p.z, d.r);
        }
        d.alive = false;
        d.wait = range(rng, 0.05, 1.6);
      }
      const stretch = 1 + Math.min(Math.abs(d.v.y) * 0.12, 1.1);
      _s.set(d.r, d.r * stretch, d.r);
      _m.compose(d.p, _q, _s);
      drops.setMatrixAt(i, _m);
    }
    drops.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < SPL; i++) {
      if (splAge[i] >= 1) {
        splAttr[i * 2] = 0;
        continue;
      }
      splAge[i] += dt / splLife[i];
      splVel[i * 3 + 1] -= 9.0 * dt;
      splPos[i * 3] += splVel[i * 3] * dt;
      splPos[i * 3 + 1] += splVel[i * 3 + 1] * dt;
      splPos[i * 3 + 2] += splVel[i * 3 + 2] * dt;
      if (splPos[i * 3 + 1] < WATER_Y) splAge[i] = 1;
      splAttr[i * 2] = Math.max(0, 1 - splAge[i]) * 0.9;
    }
    splGeo.attributes.position.needsUpdate = true;
    splGeo.attributes.aAttr.needsUpdate = true;

    light.intensity = (42 + Math.sin(t * 2.3) * 5) * (1 + 0.9 * power.value);
    poolLight.intensity = 12 * (1 + 0.6 * power.value);
  }

  return {
    id: 'water',
    group,
    update,
    setPower: (p) => (power.value = p),
    focus: new THREE.Vector3(0, 2.7, 0),
    radius: 4.2,
    viewDistance: 12.5,
    debug: { orb, orbMat, pool, poolMat, ribbons, light },
  };
}
