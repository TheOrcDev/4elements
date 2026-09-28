import * as THREE from 'three';
import { GLSL_BILLBOARD } from '../shaders/glsl.js';
import { mulberry32, TAU } from '../utils/rng.js';
import { roughLathe, paintVertices, fbm, randomArray, createInstancedQuad } from '../utils/geometry.js';

const VORTEX_H = 6.6;
const HEART_Y = 3.5;

// ---------------------------------------------------------------------------------------------
// Wind streaks. Every streak is a camera-facing ribbon whose head travels up a widening helix;
// the tail trails behind it and fades. All positions are computed in the vertex shader.
// ---------------------------------------------------------------------------------------------
const STREAK_VERT = /* glsl */ `
  attribute vec2 aStrip;   // x: 0..1 along the streak, y: -1 / +1 across
  attribute vec4 aA;       // radius scale, speed, phase, turns
  attribute vec4 aB;       // width, length (in path units), y offset, alpha
  uniform float uFlow;
  uniform float uSpin;
  uniform float uHeight;
  uniform float uPower;
  varying float vAlpha;
  varying vec2 vUv;
  varying float vTint;

  vec3 windPath(float s) {
    s = clamp(s, 0.0, 1.0);
    float rad = (0.46 + 2.85 * pow(s, 1.25)) * aA.x;
    rad *= 1.0 + 0.08 * sin(s * 14.0 + aA.z * 30.0 + uFlow * 0.8);
    float ang = aA.z * 6.2831853 + s * aA.w * 6.2831853 + uSpin * (0.6 + 0.8 * aA.x);
    return vec3(cos(ang) * rad, s * uHeight + aB.z, sin(ang) * rad);
  }

  void main() {
    float u = aStrip.x;
    float head = fract(uFlow * aA.y + aA.z * 3.7);
    float s = head - u * aB.y;

    vec3 p = windPath(s);
    vec3 p2 = windPath(s + 0.012);
    vec3 T = normalize(p2 - p + vec3(1e-5));
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vec3 tw = normalize(mat3(modelMatrix) * T);
    vec3 toCam = normalize(cameraPosition - wp.xyz);
    vec3 side = normalize(cross(tw, toCam) + vec3(1e-5));

    float taper = (0.12 + 0.88 * pow(max(1.0 - u, 0.0), 0.65)) * smoothstep(0.0, 0.06, u);
    wp.xyz += side * aStrip.y * aB.x * taper * (1.0 + 0.25 * uPower);
    gl_Position = projectionMatrix * viewMatrix * wp;

    float inRange = smoothstep(0.02, 0.3, s) * (1.0 - smoothstep(0.9, 1.0, s));
    vAlpha = pow(max(1.0 - u, 0.0), 1.5) * smoothstep(0.0, 0.05, u) * inRange * aB.w * (1.0 + 0.6 * uPower);
    vUv = vec2(u, aStrip.y);
    vTint = clamp(aA.x - 0.5, 0.0, 1.0);
  }
`;

const STREAK_FRAG = /* glsl */ `
  varying float vAlpha;
  varying vec2 vUv;
  varying float vTint;
  void main() {
    float across = 1.0 - abs(vUv.y);
    float soft = smoothstep(0.0, 0.9, across);
    soft *= soft;
    vec3 cool = vec3(0.62, 0.86, 1.0);
    vec3 pale = vec3(1.0, 0.98, 1.0);
    vec3 col = mix(cool, pale, (1.0 - vUv.x) * 0.8) * mix(1.0, 0.75, vTint);
    gl_FragColor = vec4(col, soft * vAlpha);
  }
`;

// ---------------------------------------------------------------------------------------------
// Cumulus puffs: billboards shaded with a cheap "density towards the light" trick so they look
// volumetric and lit from one side.
// ---------------------------------------------------------------------------------------------
const CLOUD_VERT = /* glsl */ `
  attribute vec4 aC;        // centre xyz, size
  attribute vec4 aR;        // random
  uniform float uSpin;
  uniform float uTime;
  uniform vec3 uLightDir;
  uniform vec3 uHeart;
  varying vec2 vUv;
  varying vec4 vRnd;
  varying vec2 vLight;
  varying float vGlow;
  varying float vAlpha;
  ${GLSL_BILLBOARD}
  void main() {
    vec3 c = aC.xyz;
    float rad = length(c.xz);
    float a = uSpin * (0.32 + 0.5 / (0.6 + rad * 0.25)) * (0.7 + 0.6 * aR.x);
    float cs = cos(a);
    float sn = sin(a);
    c.xz = vec2(c.x * cs - c.z * sn, c.x * sn + c.z * cs);
    c.y += sin(uTime * 0.4 + aR.y * 20.0) * 0.12;
    vec4 wc = modelMatrix * vec4(c, 1.0);
    vec2 q = (uv - 0.5) * 2.0;
    vUv = q;
    vRnd = aR;
    vLight = normalize((viewMatrix * vec4(uLightDir, 0.0)).xy + vec2(1e-4));
    vGlow = exp(-length(wc.xyz - uHeart) * 0.32);
    vAlpha = aR.w;
    wc.xyz += (camRight() * q.x + camUp() * q.y * 0.78) * aC.w;
    gl_Position = projectionMatrix * viewMatrix * wc;
  }
`;

const CLOUD_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform float uTime;
  uniform vec3 uLit;
  uniform vec3 uShade;
  uniform vec3 uGlowColor;
  varying vec2 vUv;
  varying vec4 vRnd;
  varying vec2 vLight;
  varying float vGlow;
  varying float vAlpha;

  void main() {
    float rr = length(vUv);
    if (rr > 1.0) discard;
    // lumpy silhouette: the lobe's radius wobbles with the angle
    float ang = atan(vUv.y, vUv.x);
    float lump = texture(uNoise, vRnd.xy * 8.0 + vec2(cos(ang), sin(ang)) * 0.22 + uTime * 0.0015).r;
    float R = 0.7 + 0.3 * lump;
    float d = rr / R;
    float a = smoothstep(1.0, 0.45, d);

    // sphere-shaded: fake a normal from the radial gradient, light it from the moon's screen direction
    vec3 n = normalize(vec3(vUv / R, sqrt(max(1.0 - d * d, 0.0)) + 0.15));
    float nl = dot(n, normalize(vec3(vLight, 0.55)));
    float lit = clamp(nl * 0.55 + 0.5, 0.0, 1.0);
    // interior billows
    float det = texture(uNoise, vUv * 0.55 + vRnd.zw * 7.0).a;
    lit = clamp(lit + (det - 0.5) * 0.4, 0.0, 1.0);

    vec3 col = mix(uShade, uLit, lit);
    col += uGlowColor * vGlow * (0.3 + 0.7 * lit);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

// ---------------------------------------------------------------------------------------------
// Feathers riding the wind
// ---------------------------------------------------------------------------------------------
const FEATHER_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uFlow;
  uniform float uSpin;
  uniform float uHeight;
  varying vec2 vUv;
  varying vec3 vN;
  varying float vGlow;
  varying float vFade;
  varying vec3 vView;

  mat3 rotXYZ(vec3 a) {
    vec3 c = cos(a);
    vec3 s = sin(a);
    mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, c.x, s.x, 0.0, -s.x, c.x);
    mat3 ry = mat3(c.y, 0.0, -s.y, 0.0, 1.0, 0.0, s.y, 0.0, c.y);
    mat3 rz = mat3(c.z, s.z, 0.0, -s.z, c.z, 0.0, 0.0, 0.0, 1.0);
    return rz * ry * rx;
  }

  void main() {
    float s = fract(uFlow * (0.028 + 0.035 * aSeed.y) + aSeed.x);
    float rad = (0.85 + 2.45 * pow(s, 1.15)) * (0.75 + 0.45 * aSeed.z);
    float ang = aSeed.w * 6.2831853 + s * 5.5 + uSpin * (0.55 + 0.35 * aSeed.z);
    vec3 c = vec3(cos(ang) * rad, s * uHeight * 0.94 + 0.5, sin(ang) * rad);
    c.y += sin(uTime * 1.3 + aSeed.x * 30.0) * 0.14;

    // slow tumble, biased so the quill points roughly along the flow
    vec3 rot = vec3(
      0.55 * sin(uTime * (0.7 + aSeed.y) + aSeed.x * 12.0) + 0.6,
      uTime * (0.35 + 0.4 * aSeed.z) + aSeed.y * 10.0,
      0.8 * sin(uTime * 0.9 + aSeed.w * 20.0) + ang
    );
    mat3 R = rotXYZ(rot);
    vec3 local = position;
    local.z += 0.16 * local.y * local.y - 0.06 * abs(local.x);      // gentle curl
    vec3 wp = (modelMatrix * vec4(c + R * local, 1.0)).xyz;
    vN = normalize(mat3(modelMatrix) * (R * vec3(0.0, 0.0, 1.0)));
    vUv = uv;
    vGlow = exp(-length(c - vec3(0.0, ${HEART_Y.toFixed(2)}, 0.0)) * 0.3);
    vFade = smoothstep(0.0, 0.07, s) * (1.0 - smoothstep(0.92, 1.0, s));
    vView = cameraPosition - wp;
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  }
`;

const FEATHER_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uLightDir;
  varying vec2 vUv;
  varying vec3 vN;
  varying float vGlow;
  varying float vFade;
  varying vec3 vView;
  void main() {
    vec4 tex = texture(uMap, vUv);
    if (tex.a < 0.02) discard;
    vec3 n = normalize(vN);
    float ndl = abs(dot(n, normalize(uLightDir)));
    float rim = pow(max(1.0 - abs(dot(n, normalize(vView))), 0.0), 2.0);
    vec3 col = tex.rgb * (0.35 + 0.6 * ndl) + vec3(0.55, 0.75, 1.0) * (vGlow * 0.55 + rim * 0.25);
    gl_FragColor = vec4(col * 1.25, tex.a * vFade * 0.95);
  }
`;

// ---------------------------------------------------------------------------------------------
const MOTE_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uFlow;
  uniform float uSpin;
  uniform float uHeight;
  uniform float uScale;
  varying float vA;
  void main() {
    float s = fract(uFlow * (0.03 + 0.05 * aSeed.y) + aSeed.x);
    float rad = (0.5 + 3.0 * pow(s, 1.2)) * (0.6 + 0.9 * aSeed.z);
    float ang = aSeed.w * 6.2831853 + s * 9.0 + uSpin * (0.7 + 0.5 * aSeed.z);
    vec3 p = vec3(cos(ang) * rad, s * uHeight + sin(aSeed.x * 50.0 + uFlow * 1.3) * 0.2, sin(ang) * rad);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.025 + 0.05 * aSeed.y) * uScale / -mv.z;
    vA = smoothstep(0.0, 0.08, s) * (1.0 - smoothstep(0.88, 1.0, s)) * (0.4 + 0.6 * aSeed.z);
  }
`;

export function createAir(ctx) {
  const { time, noise, pointScale, moonDir, softSprite, feather } = ctx;
  const rng = mulberry32(37);
  const group = new THREE.Group();
  group.name = 'air';
  const power = { value: 0 };

  // shared, JS-accumulated flow clocks (so speed changes don't make things jump)
  const uFlow = { value: 0 };
  const uSpin = { value: 0 };
  const uHeight = { value: VORTEX_H };

  // ---------------------------------------------------------------- plinth
  const profile = [
    [0, 0],
    [4.0, 0],
    [4.0, 0.2],
    [3.82, 0.34],
    [3.82, 0.5],
    [3.5, 0.62],
    [3.1, 0.66],
    [0, 0.66],
  ];
  const plinthGeo = roughLathe(profile, 144, 6, (v) => {
    const r = Math.hypot(v.x, v.z);
    if (v.y < 0.03) return;
    const n = fbm(v.x * 0.9, v.y * 0.9, v.z * 0.9, 3);
    const k = 0.035;
    v.x += (v.x / (r || 1)) * n * k;
    v.z += (v.z / (r || 1)) * n * k;
    v.y += n * k * 0.5;
  });
  paintVertices(plinthGeo, (p) => {
    // pale marble with soft veins
    const vein = 0.5 + 0.5 * Math.sin((p.x + p.z * 0.6) * 3.4 + fbm(p.x * 0.8, p.y, p.z * 0.8, 4) * 7);
    const v = 0.85 + 0.15 * Math.pow(vein, 3);
    return new THREE.Color(0.34, 0.38, 0.5).multiplyScalar(v);
  });
  const plinth = new THREE.Mesh(plinthGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.26, metalness: 0.08, envMapIntensity: 1.8 }));
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.028, 8, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.72, 1.05) }));
  ringGlow.rotation.x = Math.PI / 2;
  ringGlow.position.y = 0.665;
  group.add(ringGlow);
  const ringGlow2 = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.018, 8, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.55, 0.95) }));
  ringGlow2.rotation.x = Math.PI / 2;
  ringGlow2.position.y = 0.668;
  group.add(ringGlow2);

  // spiral wind glyph inlaid in the top surface (emissive lines)
  {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const a = t * TAU * 2.6;
      const r = 0.25 + t * 2.15;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0.672, Math.sin(a) * r));
    }
    const line = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.014, 5, false),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.75, 1.3) }),
    );
    group.add(line);
  }

  // ---------------------------------------------------------------- wind streaks
  const COUNT = 140;
  const SEGS = 44;
  {
    const verts = (SEGS + 1) * 2;
    const strip = new Float32Array(verts * 2);
    for (let i = 0; i <= SEGS; i++) {
      const u = i / SEGS;
      strip.set([u, -1], i * 4);
      strip.set([u, 1], i * 4 + 2);
    }
    const idx = [];
    for (let i = 0; i < SEGS; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
    geo.setAttribute('aStrip', new THREE.BufferAttribute(strip, 2));
    geo.setIndex(idx);
    const A = new Float32Array(COUNT * 4);
    const B = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      const thin = rng() < 0.6;
      A.set([0.5 + rng() * 0.8, 0.045 + rng() * 0.1, rng(), 1.1 + rng() * 1.8], i * 4);
      B.set(
        thin ? [0.03 + rng() * 0.05, 0.14 + rng() * 0.2, -0.1 + rng() * 0.3, 0.4 + rng() * 0.4] : [0.32 + rng() * 0.45, 0.1 + rng() * 0.14, -0.1 + rng() * 0.3, 0.035 + rng() * 0.045],
        i * 4,
      );
    }
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4));
    geo.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
    geo.instanceCount = COUNT;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uFlow, uSpin, uHeight, uPower: power },
      vertexShader: STREAK_VERT,
      fragmentShader: STREAK_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const streaks = new THREE.Mesh(geo, mat);
    streaks.frustumCulled = false;
    streaks.renderOrder = 4;
    group.add(streaks);
  }

  // ---------------------------------------------------------------- clouds
  const heartWorld = new THREE.Vector3();
  const cloudUniforms = {
    uSpin,
    uTime: time,
    uNoise: { value: noise },
    uLightDir: { value: moonDir },
    uHeart: { value: heartWorld },
    uLit: { value: new THREE.Color(0.3, 0.38, 0.62) },
    uShade: { value: new THREE.Color(0.03, 0.04, 0.1) },
    uGlowColor: { value: new THREE.Color(0.16, 0.26, 0.5) },
  };
  {
    const list = [];
    const cluster = (cx, cy, cz, size, lobes, alpha) => {
      for (let k = 0; k < lobes; k++) {
        const a = rng() * TAU;
        const rr = rng() * size * 0.85;
        const ox = Math.cos(a) * rr;
        const oz = Math.sin(a) * rr;
        const oy = (rng() - 0.35) * size * 0.55;
        const s = size * (0.45 + rng() * 0.5) * (1 - 0.3 * (rr / (size * 0.85)));
        list.push([cx + ox, cy + oy, cz + oz, s, alpha * (0.75 + rng() * 0.4)]);
      }
    };
    // low bank of cloud hugging the plinth
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + rng() * 0.35;
      const r = 3.1 + rng() * 1.6;
      cluster(Math.cos(a) * r, 0.75 + rng() * 0.35, Math.sin(a) * r, 1.0 + rng() * 0.55, 9, 0.36);
    }
    // thinner clouds carried around the vortex
    for (let i = 0; i < 7; i++) {
      const a = rng() * TAU;
      const y = 1.8 + rng() * 5.0;
      const r = 3.6 + (y / 6.5) * 2.4 + rng() * 0.8;
      cluster(Math.cos(a) * r, y, Math.sin(a) * r, 0.9 + rng() * 0.6, 6, 0.2);
    }
    const n = list.length;
    const C = new Float32Array(n * 4);
    const R = new Float32Array(n * 4);
    list.forEach((c, i) => {
      C.set(c.slice(0, 4), i * 4);
      R.set([rng(), rng(), rng(), c[4]], i * 4);
    });
    const geo = createInstancedQuad(n, { aC: { array: C, size: 4 }, aR: { array: R, size: 4 } });
    const mat = new THREE.ShaderMaterial({
      uniforms: cloudUniforms,
      vertexShader: CLOUD_VERT,
      fragmentShader: CLOUD_FRAG,
      transparent: true,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(geo, mat);
    clouds.frustumCulled = false;
    clouds.renderOrder = 1;
    group.add(clouds);
  }

  // ---------------------------------------------------------------- feathers
  {
    const N = 34;
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(0.3, 1.05, 2, 8);
    geo.index = base.index;
    geo.setAttribute('position', base.getAttribute('position'));
    geo.setAttribute('uv', base.getAttribute('uv'));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(randomArray(rng, N, 4), 4));
    geo.instanceCount = N;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uFlow, uSpin, uHeight, uMap: { value: feather }, uLightDir: { value: moonDir } },
      vertexShader: FEATHER_VERT,
      fragmentShader: FEATHER_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const feathers = new THREE.Mesh(geo, mat);
    feathers.frustumCulled = false;
    feathers.renderOrder = 3;
    group.add(feathers);
  }

  // ---------------------------------------------------------------- motes
  {
    const N = 700;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(randomArray(rng, N, 4), 4));
    const m = new THREE.ShaderMaterial({
      uniforms: { uFlow, uSpin, uHeight, uScale: pointScale },
      vertexShader: MOTE_VERT,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.0, d);
          gl_FragColor = vec4(vec3(0.75, 0.9, 1.0) * 1.5, a * a * vA);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const motes = new THREE.Points(g, m);
    motes.frustumCulled = false;
    motes.renderOrder = 5;
    group.add(motes);
  }

  // ---------------------------------------------------------------- wind heart
  const heart = new THREE.Group();
  heart.position.y = HEART_Y;
  group.add(heart);
  const glowA = new THREE.Sprite(new THREE.SpriteMaterial({ map: softSprite, color: new THREE.Color(0.35, 0.6, 1.2), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.26 }));
  glowA.scale.setScalar(4.0);
  heart.add(glowA);
  const glowB = new THREE.Sprite(new THREE.SpriteMaterial({ map: softSprite, color: new THREE.Color(1.2, 1.4, 1.9), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5 }));
  glowB.scale.setScalar(1.0);
  heart.add(glowB);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3.6, 5) }));
  heart.add(core);
  // thin orbiting ring around the heart
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.008, 6, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.8, 2.6) }));
  heart.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.006, 6, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 1.4, 2.2) }));
  heart.add(ring2);

  const light = new THREE.PointLight(0xa9c8ff, 26, 20, 2);
  light.position.y = HEART_Y;
  group.add(light);
  const baseLight = new THREE.PointLight(0x9bb6ff, 3.5, 8, 2);
  baseLight.position.y = 1.4;
  group.add(baseLight);

  // ---------------------------------------------------------------- update
  const _v = new THREE.Vector3();
  function update(t, dt) {
    const p = power.value;
    uFlow.value += dt * (1 + 1.7 * p);
    uSpin.value += dt * (0.55 + 1.1 * p);
    group.getWorldPosition(heartWorld);
    heartWorld.y += HEART_Y;
    const pulse = 1 + 0.08 * Math.sin(t * 2.4) + 0.5 * p;
    glowA.scale.setScalar(4.0 * pulse);
    glowB.scale.setScalar(1.0 * (1 + 0.1 * Math.sin(t * 3.7)) * (1 + 0.6 * p));
    ring.rotation.set(t * 0.9, t * 0.5, 0);
    ring2.rotation.set(-t * 0.6, t * 0.8, t * 0.3);
    light.intensity = (26 + Math.sin(t * 1.7) * 4) * (1 + 1.1 * p);
    baseLight.intensity = 3.5 * (1 + 0.6 * p);
  }

  return {
    id: 'air',
    group,
    update,
    setPower: (p) => (power.value = p),
    focus: new THREE.Vector3(0, 3.5, 0),
    radius: 4.4,
    viewDistance: 14,
    debug: { light, cloudUniforms },
  };
}
