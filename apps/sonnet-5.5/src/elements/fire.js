import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLSL_HASH, GLSL_SNOISE, GLSL_BILLBOARD } from '../shaders/glsl.js';
import { mulberry32, smoothstep, TAU } from '../utils/rng.js';
import { createInstancedQuad, randomArray, roughLathe, rockGeometry, paintVertices, fbm } from '../utils/geometry.js';

// ---------------------------------------------------------------------------------------------
// Flame billboards: every sprite is animated entirely on the GPU. A sprite lives for one
// cycle (life 0 -> 1): it is born on the lava, rises while narrowing and swirling, and cools
// from white-yellow through orange to deep red. Per-cycle randomness is derived from the cycle id.
// ---------------------------------------------------------------------------------------------
const FLAME_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uPower;
  uniform float uHeight;
  uniform float uSpread;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uSwirl;
  uniform float uBaseY;
  uniform float uCyl;
  uniform vec2 uStretch;
  varying vec2 vUv;
  varying float vLife;
  varying vec4 vRnd;
  varying float vFade;
  ${GLSL_HASH}
  ${GLSL_BILLBOARD}

  void main() {
    float spd = uSpeed * (0.75 + 0.5 * aSeed.y) * (1.0 + 0.45 * uPower);
    float cyc = uTime * spd + aSeed.x * 17.0;
    float life = fract(cyc);
    float id = floor(cyc);
    float r1 = h11(aSeed.z * 91.7 + id * 7.13 + 1.0);
    float r2 = h11(aSeed.w * 57.3 + id * 3.77 + 2.0);
    float r3 = h11(aSeed.y * 31.1 + id * 11.3 + 3.0);
    float r4 = h11(aSeed.x * 47.9 + id * 5.31 + 4.0);
    vRnd = vec4(r1, r2, r3, r4);

    float H = uHeight * (0.7 + 0.45 * r3) * (1.0 + 0.5 * uPower);
    float ang0 = r1 * 6.2831853;
    float rad0 = sqrt(r2) * uSpread * (1.0 + 0.15 * uPower);
    float rad = rad0 * pow(max(1.0 - life, 0.0), 1.05);
    float ang = ang0 + life * uSwirl * (0.6 + r4) * (1.0 + uPower) + uTime * 0.25;
    vec3 pos = vec3(cos(ang) * rad, 0.0, sin(ang) * rad);
    pos.y = H * pow(life, 0.8) + uBaseY;

    // organic sway that grows with height
    float w = life * life;
    float t = uTime;
    float amp = 1.0 + 0.6 * uPower;
    pos.x += (sin(t * 1.9 + pos.y * 1.4 + aSeed.z * 20.0) * 0.28 + sin(t * 3.3 + pos.y * 2.7 + aSeed.w * 30.0) * 0.14) * w * amp;
    pos.z += (cos(t * 1.6 + pos.y * 1.2 + aSeed.w * 20.0) * 0.28 + cos(t * 2.9 + pos.y * 2.5 + aSeed.z * 30.0) * 0.14) * w * amp;
    pos.x += sin(t * 0.63) * 0.38 * w;
    pos.z += cos(t * 0.41) * 0.22 * w;

    float grow = smoothstep(0.0, 0.16, life);
    float shrink = 1.0 - smoothstep(0.3, 1.0, life);
    float size = uSize * (0.6 + 0.8 * r3) * (0.3 + 0.7 * grow) * (0.12 + 0.88 * shrink) * (1.0 + 0.3 * uPower);

    vec4 wpos = modelMatrix * vec4(pos, 1.0);
    vec3 viewDir = normalize(cameraPosition - wpos.xyz);
    vec3 R = camRight();
    vec3 U = camUp();
    vec3 Rc = normalize(cross(vec3(0.0, 1.0, 0.0), viewDir) + vec3(1e-4, 0.0, 0.0));
    R = normalize(mix(R, Rc, uCyl));
    U = normalize(mix(U, vec3(0.0, 1.0, 0.0), uCyl));
    vec2 c = (uv - 0.5) * 2.0;
    vUv = c;
    vLife = life;
    vFade = smoothstep(0.0, 0.07, life) * (1.0 - smoothstep(0.55, 1.0, life));
    wpos.xyz += (R * c.x * uStretch.x + U * c.y * uStretch.y) * size;
    gl_Position = projectionMatrix * viewMatrix * wpos;
  }
`;

const FLAME_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform float uTime;
  uniform float uAlpha;
  uniform float uIntensity;
  uniform float uHeat;
  uniform float uPower;
  varying vec2 vUv;
  varying float vLife;
  varying vec4 vRnd;
  varying float vFade;

  // blackbody-ish ramp: 0 = white-hot, 1 = cooled ember
  vec3 fireRamp(float t) {
    vec3 c = mix(vec3(1.0, 0.95, 0.70), vec3(1.0, 0.62, 0.12), smoothstep(0.0, 0.26, t));
    c = mix(c, vec3(1.0, 0.27, 0.035), smoothstep(0.2, 0.55, t));
    c = mix(c, vec3(0.34, 0.03, 0.012), smoothstep(0.5, 1.0, t));
    return c;
  }

  void main() {
    // teardrop: narrower toward the top of the sprite
    vec2 q = vUv;
    q.x *= 1.0 + 0.6 * max(q.y, 0.0);
    float r = length(q);
    if (r > 1.0) discard;

    // rising, high-frequency noise so each sprite is a wispy tongue, not a soft blob
    float rise = uTime * (0.7 + vRnd.y * 0.6);
    vec2 nuv = vec2(vUv.x * 0.85, vUv.y * 0.85 - rise) + vRnd.xz * 6.0;
    float n1 = texture2D(uNoise, nuv).r;
    float n2 = texture2D(uNoise, nuv * 2.1 + vec2(0.37, -rise * 0.8)).g;
    float n3 = texture2D(uNoise, nuv * 4.3 + vec2(-0.21, -rise * 1.3)).b;
    float n = n1 * 0.5 + n2 * 0.33 + n3 * 0.17;

    // erosion threshold rises with age: full body at birth, thin licks near the tip
    float field = (1.0 - r) * 1.25 + (n - 0.5) * 1.5;
    float thr = 0.10 + 0.52 * vLife;
    float a = smoothstep(thr, thr + 0.26, field);

    // hotter in the interior of each wisp, cooler at its ragged edge
    float inner = clamp((field - thr) / 0.85, 0.0, 1.0);
    float t = clamp(vLife * 0.85 + (1.0 - inner) * 0.5 - uHeat, 0.0, 1.0);
    vec3 col = fireRamp(t) * uIntensity * (1.0 + 0.35 * uPower);
    gl_FragColor = vec4(col, a * vFade * uAlpha);
  }
`;

// ---------------------------------------------------------------------------------------------
// Volumetric flame: a noise-eroded, swirling cone raymarched inside a proxy mesh. Emission is
// composited front-to-back (premultiplied alpha), so overlapping density saturates naturally
// instead of blowing out like stacked additive sprites.
// ---------------------------------------------------------------------------------------------
const VOLUME_VERT = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vRo;
  void main() {
    vLocal = position;
    vRo = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const VOLUME_FRAG = /* glsl */ `
  uniform sampler3D uNoise3;
  uniform float uTime;
  uniform float uPower;
  uniform float uH;
  uniform float uBoxH;
  uniform float uRadius;
  uniform float uSwirl;
  uniform float uAbsorb;
  uniform float uIntensity;
  uniform float uFreq;
  uniform float uTaper;
  uniform float uEnv;
  uniform float uNoiseAmp;
  uniform float uNoiseTip;
  uniform float uErode;
  uniform float uHeatGain;
  uniform float uSoft;
  uniform float uRise;
  varying vec3 vLocal;
  varying vec3 vRo;
  ${GLSL_HASH}

  const int STEPS = 30;
  const float BOX = 2.3;

  vec2 rot2(vec2 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
  }

  // 0 = cool red rim, 1 = white-hot core
  vec3 fireRamp(float t) {
    vec3 c = mix(vec3(0.28, 0.018, 0.004), vec3(1.0, 0.23, 0.03), smoothstep(0.0, 0.3, t));
    c = mix(c, vec3(1.0, 0.56, 0.09), smoothstep(0.25, 0.62, t));
    c = mix(c, vec3(1.0, 0.90, 0.55), smoothstep(0.6, 1.0, t));
    return c;
  }

  float flame(vec3 p, out float heat) {
    float H = uH * (1.0 + 0.5 * uPower);
    float h = p.y / H;
    heat = 0.0;
    if (h < 0.0 || h > 1.0) return 0.0;

    float t = uTime;
    // the flame's axis sways, more so towards the tip
    vec2 sway = vec2(
      sin(t * 1.25 + h * 2.6) + 0.5 * sin(t * 2.7 + h * 5.0),
      cos(t * 1.05 + h * 2.2) + 0.5 * cos(t * 2.3 + h * 4.4)
    ) * 0.26 * h * h * (1.0 + 0.6 * uPower);
    vec2 xz = p.xz - sway;

    // twist the domain with height => a subtle fire-whirl
    float ang = h * uSwirl * (1.0 + uPower) + t * 0.5;
    vec2 sxz = rot2(xz, ang);
    vec3 q = vec3(sxz.x, p.y - t * (uRise + uPower), sxz.y) * uFreq;
    float n1 = textureLod(uNoise3, q, 0.0).r;
    float n2 = textureLod(uNoise3, q * 2.37 + vec3(0.31, -t * 0.35, 0.17), 0.0).g;
    float n3 = textureLod(uNoise3, q * 5.1 + vec3(-0.17, -t * 0.7, 0.43), 0.0).b;
    float n = n1 * 0.52 + n2 * 0.3 + n3 * 0.18;

    float r = length(xz);
    float R = uRadius * (1.0 + 0.15 * uPower) * mix(1.0, uTaper, pow(max(h, 0.0), 0.78));
    float env = 1.0 - r / R;                                   // 1 on the axis, 0 at the rim
    float field = env * uEnv + (n - 0.5) * (uNoiseAmp + uNoiseTip * h);   // noisier towards the tip
    float thr = 0.05 + uErode * h;                             // erosion rises with height
    float d = smoothstep(thr, thr + uSoft, field);
    d *= 1.0 - smoothstep(0.86, 1.0, h);
    heat = (clamp((field - thr) * 1.15, 0.0, 1.0) * (1.0 - 0.5 * h) + smoothstep(0.3, 0.0, h) * 0.22) * uHeatGain;
    return d;
  }

  void main() {
    vec3 ro = vRo;
    vec3 rd = normalize(vLocal - ro);
    vec3 bmin = vec3(-BOX, 0.0, -BOX);
    vec3 bmax = vec3(BOX, uBoxH, BOX);
    vec3 inv = 1.0 / rd;
    vec3 t0 = (bmin - ro) * inv;
    vec3 t1 = (bmax - ro) * inv;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);
    float tn = max(max(tmin.x, tmin.y), max(tmin.z, 0.0));
    float tf = min(min(tmax.x, tmax.y), tmax.z);
    if (tf <= tn) discard;

    float dt = (tf - tn) / float(STEPS);
    float jit = h21(gl_FragCoord.xy + fract(uTime * 0.37) * 113.0);
    float t = tn + dt * jit;

    vec3 acc = vec3(0.0);
    float trans = 1.0;
    for (int i = 0; i < STEPS; i++) {
      vec3 p = ro + rd * t;
      float heat;
      float d = flame(p, heat);
      if (d > 0.003) {
        float a = 1.0 - exp(-d * uAbsorb * dt);
        acc += trans * fireRamp(heat) * a * uIntensity;
        trans *= 1.0 - a;
        if (trans < 0.02) break;
      }
      t += dt;
    }
    gl_FragColor = vec4(acc, 1.0 - trans);
  }
`;

const SMOKE_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform float uTime;
  uniform float uAlpha;
  varying vec2 vUv;
  varying float vLife;
  varying vec4 vRnd;
  varying float vFade;
  void main() {
    float r = length(vUv);
    if (r > 1.0) discard;
    vec2 nuv = vUv * 0.3 + vRnd.xy * 9.0 + vec2(uTime * 0.02, -uTime * 0.05);
    float n = texture2D(uNoise, nuv).a * 0.6 + texture2D(uNoise, nuv * 2.3).b * 0.4;
    float d = (1.0 - r) + (n - 0.45) * 0.85;
    float a = smoothstep(0.05, 0.65, d);
    // charcoal; only the youngest wisps pick up a little firelight from below
    vec3 col = mix(vec3(0.016, 0.017, 0.024), vec3(0.20, 0.06, 0.02), pow(max(1.0 - vLife, 0.0), 4.0));
    gl_FragColor = vec4(col, a * vFade * uAlpha);
  }
`;

const EMBER_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uScale;
  uniform float uSize;
  uniform float uPower;
  varying vec3 vColor;
  varying float vAlpha;
  ${GLSL_HASH}
  void main() {
    float spd = (0.16 + 0.24 * aSeed.y) * (1.0 + 0.6 * uPower);
    float cyc = uTime * spd + aSeed.x * 13.0;
    float life = fract(cyc);
    float id = floor(cyc);
    float r1 = h11(aSeed.z * 13.7 + id * 5.1 + 1.0);
    float r2 = h11(aSeed.w * 71.3 + id * 2.3 + 2.0);
    float r3 = h11(aSeed.y * 19.9 + id * 9.7 + 3.0);
    float r4 = h11(aSeed.x * 41.3 + id * 4.1 + 4.0);

    float a0 = r1 * 6.2831853;
    float rad = sqrt(r2) * 1.55;
    float T = life * (3.0 + r3 * 4.0);
    float rise = 1.0 + 2.2 * r3 + 1.3 * uPower;
    float sw = a0 + T * (0.5 + r4 * 0.9);
    float spiral = rad * (1.0 - 0.3 * life) + T * 0.22 * r2;
    vec3 p = vec3(0.0);
    p.x = cos(sw) * spiral + sin(T * 2.1 + r1 * 20.0) * 0.09 * T + T * 0.25 * (r4 - 0.5) * 2.0;
    p.z = sin(sw) * spiral + cos(T * 1.7 + r2 * 20.0) * 0.09 * T;
    p.y = 0.75 + T * rise;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float flick = 0.6 + 0.4 * sin(uTime * (10.0 + r3 * 14.0) + aSeed.z * 50.0);
    vColor = mix(vec3(3.4, 1.9, 0.6), vec3(1.5, 0.22, 0.03), smoothstep(0.0, 1.0, life)) * flick;
    vAlpha = (1.0 - smoothstep(0.65, 1.0, life)) * smoothstep(0.0, 0.05, life);
    gl_PointSize = uSize * (0.5 + r3 * 1.1) * (1.0 - 0.55 * life) * uScale / -mv.z;
  }
`;

const EMBER_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    a = a * a * (1.0 + 2.5 * smoothstep(0.35, 0.0, d));
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

const LAVA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uPower;
  varying vec2 vP;
  ${GLSL_HASH}
  ${GLSL_SNOISE}

  vec3 lavaRamp(float t) {
    vec3 c = mix(vec3(0.012, 0.005, 0.004), vec3(0.34, 0.02, 0.0), smoothstep(0.0, 0.34, t));
    c = mix(c, vec3(1.8, 0.28, 0.012), smoothstep(0.3, 0.66, t));
    c = mix(c, vec3(3.4, 1.55, 0.36), smoothstep(0.62, 1.0, t));
    return c;
  }

  void main() {
    vec2 p = vP;
    float rad = length(p);
    vec3 q = vec3(p * 0.7, uTime * 0.06);
    float w = snoise(q) * 0.6 + snoise(q * 2.1 + 3.7) * 0.3;
    vec2 pp = p * 1.2 + vec2(w * 0.9) + vec2(uTime * 0.035, -uTime * 0.02);
    vec2 g = floor(pp);
    vec2 f = fract(pp);
    float F1 = 8.0;
    float F2 = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j));
        vec2 hh = h22(g + o);
        hh = 0.5 + 0.5 * sin(uTime * 0.25 + 6.2831 * hh);
        vec2 rr = o + hh - f;
        float dd = dot(rr, rr);
        if (dd < F1) { F2 = F1; F1 = dd; } else if (dd < F2) { F2 = dd; }
      }
    }
    float edge = sqrt(F2) - sqrt(F1);
    float crack = 1.0 - smoothstep(0.0, 0.2, edge);
    float pulse = 0.85 + 0.15 * sin(uTime * 1.3 + w * 6.0);
    float heat = crack * pulse + 0.22 * (w * 0.5 + 0.5);
    heat += smoothstep(1.5, 2.3, rad) * 0.5;
    heat += smoothstep(1.4, 0.0, rad) * 0.35;
    heat *= 1.0 + uPower * 0.6;
    gl_FragColor = vec4(lavaRamp(clamp(heat, 0.0, 1.0)), 1.0);
  }
`;

export function createFire(ctx) {
  const { time, noise, pointScale } = ctx;
  const rng = mulberry32(11);
  const group = new THREE.Group();
  group.name = 'fire';

  const power = { value: 0 };

  // ---------------------------------------------------------------- plinth
  const profile = [
    [0, 0],
    [4.0, 0],
    [4.0, 0.16],
    [3.82, 0.3],
    [3.82, 0.52],
    [3.5, 0.74],
    [2.62, 0.84],
    [2.36, 0.7],
    [2.32, 0.62],
    [0, 0.62],
  ];
  const plinthGeo = roughLathe(profile, 144, 7, (v) => {
    const r = Math.hypot(v.x, v.z);
    if (v.y < 0.03) return;
    if (r < 2.36 && v.y < 0.7) return;
    const n = fbm(v.x * 1.25, v.y * 1.25, v.z * 1.25, 4);
    const k = 0.13;
    const nx = v.x / (r || 1);
    const nz = v.z / (r || 1);
    v.x += nx * n * k;
    v.z += nz * n * k;
    v.y += n * k * 0.55;
  });
  paintVertices(plinthGeo, (p, n) => {
    const r = Math.hypot(p.x, p.z);
    const grain = 0.75 + 0.5 * (fbm(p.x * 2.2, p.y * 2.2, p.z * 2.2, 3) * 0.5 + 0.5);
    const heat = smoothstep(3.6, 2.4, r) * smoothstep(0.4, 0.8, p.y);
    const c = new THREE.Color(0.026, 0.022, 0.024).multiplyScalar(grain);
    c.r += heat * 0.05;
    c.g += heat * 0.008;
    return c;
  });
  const plinthMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.25 });
  // molten veins running through the basalt: thresholded 3D noise, brighter near the crater
  plinthMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.uniforms.uPower = power;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vObjPos;\nuniform float uTime;\nuniform float uPower;\n${GLSL_SNOISE}`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          float n = snoise(vObjPos * vec3(1.55, 1.05, 1.55) + vec3(0.0, uTime * 0.02, 0.0));
          float n2 = snoise(vObjPos * 3.9 + 11.0) * 0.3;
          float vein = 1.0 - smoothstep(0.0, 0.09, abs(n + n2 * 0.4));
          float mask = smoothstep(0.12, 0.8, vObjPos.y);
          float pulse = 0.72 + 0.28 * sin(uTime * 1.4 + vObjPos.x * 2.0 + vObjPos.z * 1.7);
          vec3 lava = mix(vec3(1.5, 0.2, 0.02), vec3(2.6, 0.85, 0.18), vein * vein);
          totalEmissiveRadiance += lava * vein * mask * pulse * (1.0 + uPower);
        }`,
      );
  };
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // glowing seam around the waist of the plinth
  const waist = new THREE.Mesh(
    new THREE.TorusGeometry(3.86, 0.03, 8, 160),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 0.5, 0.09) }),
  );
  waist.rotation.x = Math.PI / 2;
  waist.position.y = 0.4;
  group.add(waist);

  // ---------------------------------------------------------------- lava pool
  const lavaMat = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uPower: power },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: LAVA_FRAG,
  });
  const lava = new THREE.Mesh(new THREE.CircleGeometry(2.36, 96), lavaMat);
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = 0.645;
  group.add(lava);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(2.42, 0.045, 8, 128),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.6, 0.1) }),
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.72;
  group.add(lip);

  // ---------------------------------------------------------------- crown of rock
  {
    const parts = [];
    const spireParts = [];
    const dark = new THREE.Color(0.03, 0.026, 0.027);
    const addColors = (g, base, glow) => {
      paintVertices(g, (p, n) => {
        const k = 0.6 + 0.8 * (fbm(p.x * 3 + 4, p.y * 3, p.z * 3, 2) * 0.5 + 0.5);
        const c = base.clone().multiplyScalar(k);
        const under = THREE.MathUtils.clamp(-n.y * 0.5 + 0.4, 0, 1) * glow;
        c.r += under * 0.06;
        c.g += under * 0.012;
        return c;
      });
      return g;
    };
    // boulders
    const count = 17;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + (rng() - 0.5) * 0.25;
      const r = 2.72 + rng() * 0.4;
      const s = 0.36 + rng() * 0.42;
      const g = rockGeometry({ radius: 1, detail: 2, amp: 0.55, freq: 1.3, seed: i * 3.1, squash: 0.75 });
      addColors(g, dark, 1);
      g.scale(s * (0.9 + rng() * 0.5), s, s * (0.9 + rng() * 0.5));
      g.rotateY(rng() * TAU);
      g.translate(Math.cos(a) * r, 0.78 + s * 0.35, Math.sin(a) * r);
      parts.push(g);
    }
    // tall obsidian spires leaning outwards
    const spires = 8;
    for (let i = 0; i < spires; i++) {
      const a = (i / spires) * TAU + 0.2 + (rng() - 0.5) * 0.3;
      const h = 1.5 + rng() * 1.5;
      const w = 0.3 + rng() * 0.16;
      let g = new THREE.ConeGeometry(w, h, 6, 5, false);
      g.deleteAttribute('uv');
      g.translate(0, h / 2, 0);
      g = g.toNonIndexed();
      const pos = g.attributes.position;
      const v = new THREE.Vector3();
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k);
        const f = fbm(v.x * 2.1 + i * 5, v.y * 1.4, v.z * 2.1, 3) * 0.28;
        v.x += f * (1 - v.y / h);
        v.z += f * (1 - v.y / h) * 0.8;
        pos.setXYZ(k, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      g.deleteAttribute('color');
      const lean = 0.2 + rng() * 0.22;
      g.rotateZ(-lean); // lean outwards along +X before we rotate around Y
      g.rotateY(-a);
      const r = 3.05 + rng() * 0.25;
      g.translate(Math.cos(a) * r, 0.62, Math.sin(a) * r);
      spireParts.push(g);
    }
    const crown = new THREE.Mesh(
      mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p))),
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.35, flatShading: true }),
    );
    crown.castShadow = true;
    crown.receiveShadow = true;
    group.add(crown);
    // glossy black obsidian: catches sharp highlights from the flames
    const spireMesh = new THREE.Mesh(
      mergeGeometries(spireParts.map((p) => (p.index ? p.toNonIndexed() : p))),
      new THREE.MeshPhysicalMaterial({ color: 0x08070a, roughness: 0.1, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 3.0, flatShading: true }),
    );
    spireMesh.castShadow = true;
    group.add(spireMesh);
  }

  // ---------------------------------------------------------------- flames
  const flameRoot = new THREE.Group();
  flameRoot.position.y = 0.68;
  group.add(flameRoot);

  const makeSystem = (count, uniformOverrides, frag, blending, order) => {
    const geo = createInstancedQuad(count, { aSeed: { array: randomArray(rng, count, 4), size: 4 } });
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: time,
        uNoise: { value: noise },
        uPower: power,
        uHeight: { value: 4.6 },
        uSpread: { value: 1.35 },
        uSize: { value: 1.7 },
        uSpeed: { value: 0.55 },
        uSwirl: { value: 3.0 },
        uBaseY: { value: 0 },
        uCyl: { value: 0 },
        uStretch: { value: new THREE.Vector2(1, 1) },
        uAlpha: { value: 0.1 },
        uIntensity: { value: 1.6 },
        uHeat: { value: 0 },
        ...uniformOverrides,
      },
      vertexShader: FLAME_VERT,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    flameRoot.add(mesh);
    return mesh;
  };

  // smoke first (normal blending), drawn beneath the glowing layers
  const smokeSys = makeSystem(
    46,
    {
      uHeight: { value: 3.4 },
      uBaseY: { value: 3.1 },
      uSpread: { value: 0.7 },
      uSize: { value: 2.3 },
      uSpeed: { value: 0.14 },
      uSwirl: { value: 1.2 },
      uAlpha: { value: 0.2 },
    },
    SMOKE_FRAG,
    THREE.NormalBlending,
    1,
  );
  // volumetric flame body (raymarched)
  const BOX_H = 9.4;
  const volumeGeo = new THREE.CylinderGeometry(1.15, 2.15, BOX_H, 28, 1, false);
  volumeGeo.translate(0, BOX_H / 2, 0);
  const volumeMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uNoise3: { value: ctx.noise3 },
      uPower: power,
      uH: { value: 6.4 },
      uBoxH: { value: BOX_H },
      uRadius: { value: 2.0 },
      uSwirl: { value: 2.2 },
      uAbsorb: { value: 2.6 },
      uIntensity: { value: 1.8 },
      uFreq: { value: 0.5 },
      uTaper: { value: 0.2 },
      uEnv: { value: 0.95 },
      uNoiseAmp: { value: 2.0 },
      uNoiseTip: { value: 1.5 },
      uErode: { value: 0.6 },
      uHeatGain: { value: 0.88 },
      uSoft: { value: 0.14 },
      uRise: { value: 2.2 },
    },
    vertexShader: VOLUME_VERT,
    fragmentShader: VOLUME_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
  });
  const volume = new THREE.Mesh(volumeGeo, volumeMat);
  volume.frustumCulled = false;
  volume.renderOrder = 2;
  flameRoot.add(volume);

  // white-hot core
  const coreSys = makeSystem(
    22,
    {
      uHeight: { value: 1.8 },
      uSpread: { value: 0.5 },
      uSize: { value: 1.05 },
      uSpeed: { value: 0.9 },
      uSwirl: { value: 2.0 },
      uAlpha: { value: 0.016 },
      uIntensity: { value: 1.6 },
      uHeat: { value: 0.15 },
    },
    FLAME_FRAG,
    THREE.AdditiveBlending,
    4,
  );

  // ---------------------------------------------------------------- embers
  {
    const N = 340;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(randomArray(rng, N, 4), 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uScale: pointScale, uSize: { value: 0.085 }, uPower: power },
      vertexShader: EMBER_VERT,
      fragmentShader: EMBER_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const embers = new THREE.Points(g, mat);
    embers.frustumCulled = false;
    embers.renderOrder = 5;
    flameRoot.add(embers);
  }

  // ---------------------------------------------------------------- light on the floor
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uPower: power },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPower;
      varying vec2 vUv;
      void main() {
        float r = length(vUv * 2.0 - 1.0);
        float a = pow(max(1.0 - r, 0.0), 2.4);
        float flick = 0.86 + 0.09 * sin(uTime * 7.0) + 0.05 * sin(uTime * 13.3 + 1.3);
        gl_FragColor = vec4(vec3(1.0, 0.33, 0.07) * a * 0.42 * flick * (1.0 + uPower * 0.9), 1.0);
      }
    `,
  });
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), glowMat);
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = 0.035;
  floorGlow.renderOrder = 0;
  group.add(floorGlow);

  const light = new THREE.PointLight(0xff7424, 95, 0, 2);
  light.position.set(0, 3.1, 0);
  group.add(light);
  const lavaLight = new THREE.PointLight(0xff3308, 28, 9, 2);
  lavaLight.position.set(0, 1.0, 0);
  group.add(lavaLight);

  // ---------------------------------------------------------------- api
  function update(t, dt) {
    const f = 1 + 0.13 * Math.sin(t * 13.1) * Math.sin(t * 7.7 + 1.0) + 0.08 * Math.sin(t * 23.0 + 2.0);
    light.intensity = 95 * f * (1 + 1.6 * power.value);
    lavaLight.intensity = 28 * (1 + 0.15 * Math.sin(t * 5.3)) * (1 + power.value);
  }

  return {
    id: 'fire',
    group,
    update,
    setPower: (p) => (power.value = p),
    focus: new THREE.Vector3(0, 3.0, 0),
    radius: 4.2,
    viewDistance: 12.5,
    debug: { smokeSys, volume, coreSys, light, lavaLight, lip, waist },
  };
}
