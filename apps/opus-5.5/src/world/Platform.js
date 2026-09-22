import * as THREE from 'three';
import { patchMaterial } from '../gl/patch.js';
import { hashGLSL, causticGLSL, bumpGLSL, worldPosVaryingVertex } from '../gl/glsl.js';
import { Noise3, mulberry32 } from '../gl/noise.js';
import { ELEMENTS, PLATFORM_RADIUS, stationPosition } from '../config.js';
import { makeRockGeometry } from './rocks.js';

const FLOOR_GLSL = /* glsl */ `
uniform float uTime;
uniform sampler2D uNoise2D;
uniform vec3 uStPos[4];
uniform vec3 uStCol[4];
uniform float uStGlow[4];
varying vec3 vWPos;
${hashGLSL}
${causticGLSL}
${bumpGLSL}

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
// unsigned distance to an equilateral triangle outline (after iq)
float udTri(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return length(p);
}
// kind: 0 fire, 1 air, 2 water, 3 earth — the alchemical triangles
float glyphDist(vec2 q, int kind, float s) {
  if (kind >= 2) q.y = -q.y;
  float d = udTri(q, s);
  if (kind == 1 || kind == 3) d = min(d, sdSeg(q, vec2(-0.95 * s, 0.16 * s), vec2(0.95 * s, 0.16 * s)));
  return d;
}
float lineMask(float d, float w) {
  float aa = max(fwidth(d) * 1.2, 1e-4);
  return 1.0 - smoothstep(w - aa, w + aa, d);
}
vec3 angleColor(vec2 p) {
  float a = atan(p.x, p.y);
  vec3 acc = vec3(0.0);
  float ws = 0.0;
  for (int i = 0; i < 4; i++) {
    float ai = atan(uStPos[i].x, uStPos[i].z);
    float da = abs(mod(a - ai + 3.14159265, 6.2831853) - 3.14159265);
    float w = exp(-da * da * 2.6);
    acc += uStCol[i] * w;
    ws += w;
  }
  return acc / max(ws, 1e-4);
}
float runeDist(vec2 q, float seed) {
  // q in metres, rune ~0.34 x 0.6
  float d = sdSeg(q, vec2(0.0, -0.3), vec2(0.0, 0.3));
  float h1 = hash11(seed * 13.1), h2 = hash11(seed * 7.7 + 1.0), h3 = hash11(seed * 3.3 + 2.0);
  float h4 = hash11(seed * 5.9 + 3.0), h5 = hash11(seed * 9.1 + 4.0), h6 = hash11(seed * 2.1 + 5.0);
  if (h1 > 0.55) d = min(d, sdSeg(q, vec2(0.0, 0.3), vec2(0.17, 0.12)));
  if (h2 > 0.55) d = min(d, sdSeg(q, vec2(0.0, 0.08), vec2(-0.17, -0.1)));
  if (h3 > 0.6) d = min(d, sdSeg(q, vec2(-0.17, 0.3), vec2(0.17, -0.05)));
  if (h4 > 0.6) d = min(d, sdSeg(q, vec2(0.0, -0.05), vec2(0.17, -0.25)));
  if (h5 > 0.65) d = min(d, sdSeg(q, vec2(-0.17, 0.15), vec2(0.0, 0.3)));
  if (h6 > 0.7) d = min(d, sdSeg(q, vec2(-0.14, -0.3), vec2(0.14, -0.3)));
  return d;
}

vec3 gAlbedo; float gRough; vec3 gEmit; float gHeight;

void floorSurface(vec2 p) {
  float r = length(p);
  float a = atan(p.x, p.y);
  vec4 nA = texture(uNoise2D, p * 0.045);
  vec4 nB = texture(uNoise2D, p * 0.19 + 0.31);
  vec4 nC = texture(uNoise2D, p * 0.83 + 0.17);
  vec3 emit = vec3(0.0);

  const float medR = 2.35;
  const float outerR = 9.9;
  const float bandR = 11.3;

  // ---------- concentric paving ----------
  float ringW = 1.1;
  float rr = r - medR;
  float ringIdx = floor(rr / ringW);
  float ringF = fract(rr / ringW);
  float circ = 6.2831853 * (medR + (ringIdx + 0.5) * ringW);
  float nT = floor(circ / 1.35);
  float ta = (a / 6.2831853 + 0.5) * nT + hash11(ringIdx + 3.0) * 7.0;
  float tIdx = floor(ta);
  if (tIdx >= nT) tIdx -= nT; // wrap seam
  float tF = fract(ta);
  float tileW = circ / nT;
  float gR = min(ringF, 1.0 - ringF) * ringW;
  float gA = min(tF, 1.0 - tF) * tileW;
  float gd = min(gR, gA);
  float aa = fwidth(gd);
  float tile = smoothstep(0.012, 0.045 + aa, gd);
  float th = hash12(vec2(ringIdx, tIdx));
  float th2 = hash12(vec2(tIdx, ringIdx) + 7.7);
  vec3 stoneA = vec3(0.062, 0.060, 0.060);
  vec3 stoneB = vec3(0.135, 0.126, 0.115);
  vec3 stone = mix(stoneA, stoneB, th) * (0.72 + 0.56 * nA.r) * (0.86 + 0.28 * nC.g);
  stone *= mix(vec3(1.0), vec3(1.06, 1.0, 0.92), th2);
  float wear = smoothstep(0.55, 0.85, nB.b);
  stone *= 1.0 - 0.3 * wear;
  vec3 albedo = mix(stone * 0.28, stone, tile);
  float rough = mix(0.96, 0.5 + 0.32 * nC.r, tile);
  float height = tile * 0.006 + nC.r * 0.0015 - wear * 0.001;

  // ---------- outer rune band (branch-free so derivatives stay valid) ----------
  float inBand = step(outerR, r) * step(r, bandR);
  {
    float mid = (outerR + bandR) * 0.5;
    float cells = 84.0;
    float ca = (a / 6.2831853 + 0.5) * cells;
    float ci = mod(floor(ca), cells);
    float cellArc = 6.2831853 * mid / cells;
    vec2 q = vec2((fract(ca) - 0.5) * cellArc, r - mid);
    float rd = runeDist(q, ci + 1.0);
    float rm = lineMask(rd, 0.022);
    float carve = lineMask(rd, 0.035);
    float wave = pow(clamp(0.5 + 0.5 * sin(a * 3.0 - uTime * 0.55), 1e-4, 1.0), 8.0);
    vec3 bandAlb = vec3(0.05, 0.048, 0.05) * (0.8 + 0.4 * nB.r);
    bandAlb = mix(bandAlb, bandAlb * 0.25, carve);
    albedo = mix(albedo, bandAlb, inBand);
    rough = mix(rough, 0.45 + 0.2 * nC.g, inBand);
    height = mix(height, nC.r * 0.001 - carve * 0.003, inBand);
    emit += vec3(1.0, 0.78, 0.48) * rm * (0.18 + 1.3 * wave) * inBand;
  }
  vec3 ac = angleColor(p);
  float edgeRing = min(abs(r - outerR), abs(r - bandR));
  emit += ac * lineMask(edgeRing, 0.02) * 0.5;
  albedo = mix(albedo, albedo * 0.3, lineMask(edgeRing, 0.04));

  // ---------- medallion ----------
  float inMed = 1.0 - step(medR, r);
  {
    vec3 medAlb = vec3(0.03, 0.031, 0.038) * (0.8 + 0.4 * nB.r);
    float md = min(min(abs(r - 2.05), abs(r - 0.95)), abs(r - 0.32));
    vec3 medEmit = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      vec2 c0 = normalize(uStPos[i].xz) * 2.05;
      vec2 c1 = normalize(uStPos[(i + 1) % 4].xz) * 2.05;
      md = min(md, sdSeg(p, c0, c1));
      vec2 dir = normalize(uStPos[i].xz);
      vec2 lp = p - dir * 1.36;
      vec2 q = vec2(dot(lp, vec2(dir.y, -dir.x)), dot(lp, dir));
      float gm = lineMask(glyphDist(q, i, 0.2), 0.02);
      medEmit += uStCol[i] * gm * (2.2 + 2.0 * uStGlow[i]);
      medAlb = mix(medAlb, medAlb * 0.3, gm);
    }
    float mm = lineMask(md, 0.018);
    float breathe = 0.75 + 0.25 * sin(uTime * 0.8);
    medEmit += ac * mm * 1.1 * breathe;
    medEmit += ac * 0.9 * smoothstep(0.2, 0.0, r) * breathe;
    medAlb = mix(medAlb, medAlb * 0.3, mm);
    albedo = mix(albedo, medAlb, inMed);
    rough = mix(rough, 0.34 + 0.18 * nC.g, inMed);
    height = mix(height, nC.r * 0.0008 - mm * 0.002, inMed);
    emit += medEmit * inMed;
  }

  // ---------- glowing channels ----------
  vec3 chan = vec3(0.0);
  float groove = 0.0;
  float dm = abs(r - medR);
  chan += ac * lineMask(dm, 0.03) * 1.5;
  groove = max(groove, lineMask(dm, 0.06));

  float nearSt = 1e9;
  for (int i = 0; i < 4; i++) nearSt = min(nearSt, length(p - uStPos[i].xz));
  float outsideSt = smoothstep(2.0, 2.2, nearSt);
  float ds6 = abs(r - 6.0);
  chan += ac * lineMask(ds6, 0.028) * outsideSt * 1.1;
  groove = max(groove, lineMask(ds6, 0.055) * outsideSt);

  for (int i = 0; i < 4; i++) {
    vec2 st = uStPos[i].xz;
    vec2 dir = normalize(st);
    vec2 side = vec2(dir.y, -dir.x);
    float along = dot(p, dir);
    float across = abs(dot(p, side));
    float seg = smoothstep(medR - 0.01, medR + 0.01, along) * (1.0 - smoothstep(3.94, 3.96, along));
    float s = clamp(0.5 + 0.5 * sin(along * 2.4 - uTime * 3.2), 0.0, 1.0);
    float s2 = s * s; float s4 = s2 * s2; float s8 = s4 * s4;
    float pulse = s8 * s4 * s2; // s^14 without pow()
    float glow = 1.0 + uStGlow[i] * 2.5;
    float spoke = lineMask(across, 0.03) * seg;
    chan += uStCol[i] * spoke * (0.8 + 4.0 * pulse) * glow;
    groove = max(groove, lineMask(across, 0.055) * seg);

    float ds = length(p - st);
    float dc = abs(ds - 2.05);
    chan += uStCol[i] * lineMask(dc, 0.035) * 1.3 * glow;
    groove = max(groove, lineMask(dc, 0.06));
    // soft light pool inside the station circle
    emit += uStCol[i] * smoothstep(2.05, 1.5, ds) * smoothstep(1.4, 1.75, ds) * 0.05 * glow;

    vec2 gc = st + dir * 2.95;
    vec2 lp = p - gc;
    vec2 q = vec2(dot(lp, side), -dot(lp, dir)); // upright when seen from outside the ring
    float gdist = glyphDist(q, i, 0.44);
    chan += uStCol[i] * lineMask(gdist, 0.03) * 1.8 * glow;
    groove = max(groove, lineMask(gdist, 0.055));
  }
  albedo = mix(albedo, albedo * 0.2, groove);
  rough = mix(rough, 0.3, groove);
  height -= groove * 0.004;
  emit += chan;

  // ---------- elemental weathering ----------
  // Fire (0): scorched stone with smouldering cracks
  float dF = length(p - uStPos[0].xz);
  float scorch = 1.0 - smoothstep(1.5, 3.4, dF + (nB.r - 0.5) * 1.8);
  albedo *= mix(1.0, 0.3, scorch);
  rough = mix(rough, 0.95, scorch * 0.5);
  float ember = smoothstep(0.78, 0.96, nC.a) * scorch * smoothstep(1.55, 1.8, dF);
  emit += vec3(1.0, 0.22, 0.03) * ember * (0.8 + 0.6 * sin(uTime * 2.3 + nB.g * 12.0));

  // Water (2): wet stone, puddles, dancing caustics
  float dW = length(p - uStPos[2].xz);
  float wet = 1.0 - smoothstep(1.6, 3.8, dW + (nA.g - 0.5) * 2.0);
  albedo *= mix(1.0, 0.45, wet);
  rough = mix(rough, 0.12, wet);
  float puddle = smoothstep(0.52, 0.6, nB.g) * wet;
  rough = mix(rough, 0.07, puddle);
  height = mix(height, height * 0.1, max(puddle, wet * 0.6));
  emit += uStCol[2] * causticPattern(p * 0.32, uTime * 0.55) * 0.05 * (1.0 - smoothstep(1.7, 3.3, dW)) * smoothstep(1.55, 1.8, dW);

  // Earth (3): moss creeping through the joints
  float dE = length(p - uStPos[3].xz);
  float moss = 1.0 - smoothstep(1.7, 4.4, dE + (nA.b - 0.5) * 2.6);
  float mossMask = moss * mix(1.0, 0.5, tile) * smoothstep(0.35, 0.62, nB.r + moss * 0.35);
  vec3 mossCol = mix(vec3(0.022, 0.05, 0.012), vec3(0.07, 0.12, 0.025), nC.g);
  albedo = mix(albedo, mossCol, mossMask);
  rough = mix(rough, 0.92, mossMask);
  height += mossMask * 0.002 * nC.r;

  // Air (1): wind-swept dust spiral
  float dA = length(p - uStPos[1].xz);
  vec2 ap = p - uStPos[1].xz;
  float sw = atan(ap.x, ap.y) + dA * 1.6 - uTime * 0.05;
  float swirl = smoothstep(0.55, 1.0, sin(sw * 3.0 + nB.r * 2.5)) * (1.0 - smoothstep(1.8, 3.6, dA)) * smoothstep(1.6, 2.0, dA);
  albedo = mix(albedo, albedo * 1.7 + 0.012, swirl * 0.55);

  gAlbedo = albedo;
  gRough = clamp(rough, 0.07, 1.0);
  gEmit = emit;
  gHeight = height;
}
`;

function linearColor(hex) {
  return new THREE.Color(hex);
}

export function createFloorMaterial(ctx) {
  const stPos = ELEMENTS.map((d) => stationPosition(d));
  const stCol = ELEMENTS.map((d) => new THREE.Vector3().setFromColor(linearColor(d.color)));
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  const uniforms = {
    uTime: ctx.uniforms.uTime,
    uNoise2D: { value: ctx.noise2D },
    uStPos: { value: stPos },
    uStCol: { value: stCol },
    uStGlow: ctx.uniforms.uStGlow,
  };
  patchMaterial(mat, {
    key: 'floor',
    uniforms,
    vertexHeader: 'varying vec3 vWPos;',
    vertex: { begin_vertex: `#include <begin_vertex>\n${worldPosVaryingVertex}` },
    fragmentHeader: FLOOR_GLSL,
    fragment: {
      map_fragment: 'floorSurface(vWPos.xz);\ndiffuseColor.rgb = gAlbedo;',
      roughnessmap_fragment: 'float roughnessFactor = gRough;',
      normal_fragment_maps: 'normal = perturbNormalH(-vViewPosition, normal, gHeight, faceDirection);',
      emissivemap_fragment: 'totalEmissiveRadiance += gEmit;',
    },
  });
  return mat;
}

const STONE_GLSL = /* glsl */ `
uniform float uTime;
uniform sampler3D uNoise3D;
uniform vec3 uColor;
uniform float uGlow;
uniform float uBandY;
uniform float uRingR;
varying vec3 vWPos;
varying vec3 vLPos;
varying vec3 vLNrm;
${bumpGLSL}
float lineMaskS(float d, float w) { float aa = max(fwidth(d) * 1.2, 1e-4); return 1.0 - smoothstep(w - aa, w + aa, d); }
vec3 sAlbedo; float sRough; vec3 sEmit; float sHeight;
void stoneSurface() {
  float rad = length(vLPos.xz);
  float wTop = smoothstep(0.5, 0.9, abs(vLNrm.y));
  // solid noise on world position: no cylindrical UV seam, and every pedestal differs
  vec3 sp = vWPos * vec3(0.45, 1.1, 0.45);
  vec4 n1 = texture(uNoise3D, sp * 0.35);
  vec4 n2 = texture(uNoise3D, sp * 1.3 + 0.3);
  vec3 base = vec3(0.105, 0.1, 0.095) * (0.7 + 0.6 * n1.r) * (0.85 + 0.3 * n2.g);
  // horizontal strata on the sides
  base *= 0.92 + 0.08 * sin(vLPos.y * 38.0 + n1.g * 6.0);
  float chip = smoothstep(0.7, 0.9, n2.b);
  base *= 1.0 - 0.35 * chip;
  sAlbedo = base;
  sRough = 0.62 + 0.3 * n2.r;
  sHeight = n2.r * 0.004 - chip * 0.003;
  sEmit = vec3(0.0);
  float glow = 1.0 + uGlow * 2.0;
  if (uBandY > -0.99) { // -1 = no band
    float band = lineMaskS(abs(vLPos.y - uBandY), 0.014) * step(0.5, rad) * (1.0 - wTop);
    sEmit += uColor * band * 2.2 * glow;
    sAlbedo = mix(sAlbedo, sAlbedo * 0.2, lineMaskS(abs(vLPos.y - uBandY), 0.025) * (1.0 - wTop));
  }
  if (uRingR > 0.0) {
    float ring = lineMaskS(abs(rad - uRingR), 0.018) * wTop * step(0.0, vLNrm.y);
    sEmit += uColor * ring * 2.0 * glow;
    sAlbedo = mix(sAlbedo, sAlbedo * 0.2, ring);
  }
}
`;

/** Carved stone material (pedestals, pillars, rim) with an optional glowing band and top ring. */
export function createStoneMaterial(ctx, { color = '#ffffff', bandY = -1, ringR = -1, key } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  const uniforms = {
    uTime: ctx.uniforms.uTime,
    uNoise3D: { value: ctx.noise3D },
    uColor: { value: new THREE.Vector3().setFromColor(linearColor(color)) },
    uGlow: { value: 0 },
    uBandY: { value: bandY },
    uRingR: { value: ringR },
  };
  patchMaterial(mat, {
    key: key ?? 'stone',
    uniforms,
    vertexHeader: 'varying vec3 vWPos; varying vec3 vLPos; varying vec3 vLNrm;',
    vertex: {
      begin_vertex: `#include <begin_vertex>\nvLPos = position; vLNrm = normal;\n${worldPosVaryingVertex}`,
    },
    fragmentHeader: STONE_GLSL,
    fragment: {
      map_fragment: 'stoneSurface();\ndiffuseColor.rgb = sAlbedo;',
      roughnessmap_fragment: 'float roughnessFactor = sRough;',
      normal_fragment_maps: 'normal = perturbNormalH(-vViewPosition, normal, sHeight, faceDirection);',
      emissivemap_fragment: 'totalEmissiveRadiance += sEmit;',
    },
  });
  mat.userData.uniforms = uniforms;
  return mat;
}

/** Round altar every element stands on. Returns { mesh, material }. */
export function createPedestal(ctx, def, { basin = false } = {}) {
  const prof = [
    [0.0, 0.0], [1.62, 0.0], [1.62, 0.1], [1.56, 0.14], [1.44, 0.17], [1.32, 0.2], [1.24, 0.25],
    [1.2, 0.3], [1.2, 0.68], [1.26, 0.73], [1.4, 0.78], [1.5, 0.83], [1.52, 0.86], [1.52, 0.92], [1.49, 0.95],
  ];
  if (basin) {
    prof.push([1.5, 1.04], [1.44, 1.07], [1.34, 1.06], [1.27, 1.0], [1.24, 0.9], [1.18, 0.84], [0.0, 0.83]);
  } else {
    prof.push([1.4, 0.955], [0.0, 0.955]);
  }
  const pts = prof.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, 96);
  const material = createStoneMaterial(ctx, {
    color: def.color,
    bandY: 0.49,
    ringR: basin ? -1 : 1.36,
    key: `pedestal-${def.id}`,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `pedestal-${def.id}`;
  return { mesh, material };
}

export class Platform {
  constructor(ctx) {
    this.group = new THREE.Group();
    this.group.name = 'platform';

    // Floor
    const floorGeo = new THREE.CircleGeometry(PLATFORM_RADIUS, 192);
    floorGeo.rotateX(-Math.PI / 2);
    this.floorMaterial = createFloorMaterial(ctx);
    const floor = new THREE.Mesh(floorGeo, this.floorMaterial);
    floor.receiveShadow = true;
    floor.name = 'floor';
    this.group.add(floor);

    // Rim (side of the disc)
    const sideGeo = new THREE.CylinderGeometry(PLATFORM_RADIUS, PLATFORM_RADIUS - 0.35, 1.1, 192, 1, true);
    sideGeo.translate(0, -0.55, 0);
    const sideMat = createStoneMaterial(ctx, { color: '#ffd9a8', bandY: -0.22, key: 'rim' });
    sideMat.userData.uniforms.uGlow.value = -0.3;
    const side = new THREE.Mesh(sideGeo, sideMat);
    side.receiveShadow = true;
    this.group.add(side);

    // Rocky underside — the sanctum floats in the void
    this.group.add(this.#makeUnderside());

    // Distant floating islets for depth
    this.group.add(this.#makeIslets());
  }

  #makeUnderside() {
    const noise = new Noise3(77);
    const profile = [];
    const topR = PLATFORM_RADIUS - 0.35;
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = topR * Math.pow(1 - t, 0.75);
      const y = -1.1 - t * 8.5;
      profile.push(new THREE.Vector2(Math.max(r, 0.001), y));
    }
    const geo = new THREE.LatheGeometry(profile, 160);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    const colors = new Float32Array(pos.count * 3);
    const cA = new THREE.Color('#2a2521'), cB = new THREE.Color('#4a4038');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const t = THREE.MathUtils.clamp((-1.1 - v.y) / 8.5, 0, 1);
      const len = Math.hypot(v.x, v.z);
      if (len > 1e-4) {
        const ang = Math.atan2(v.z, v.x);
        const n = noise.ridged(Math.cos(ang) * 2.5, v.y * 0.35, Math.sin(ang) * 2.5, 4);
        const n2 = noise.fbm(v.x * 0.25, v.y * 0.25, v.z * 0.25, 3);
        const k = t < 0.03 ? t / 0.03 : 1; // keep the top edge flush with the rim
        const d = (n - 0.45) * 2.6 * k + n2 * 1.6 * k;
        const nr = Math.max(len + d * (0.4 + t), 0.05);
        v.x *= nr / len;
        v.z *= nr / len;
        v.y += n2 * 0.9 * k;
        pos.setXYZ(i, v.x, v.y, v.z);
        c.copy(cA).lerp(cB, THREE.MathUtils.clamp(n * 1.2 + n2 * 0.5, 0, 1)).multiplyScalar(1 - t * 0.6);
      } else c.copy(cA);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
  }

  #makeIslets() {
    const g = new THREE.Group();
    const rand = mulberry32(31337);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
    for (let i = 0; i < 11; i++) {
      const geo = makeRockGeometry(100 + i, { detail: 4, roughness: 0.45, squash: 0.8, colorA: '#2b2622', colorB: '#4d443b' });
      const m = new THREE.Mesh(geo, mat);
      const ang = (i / 11) * Math.PI * 2 + rand() * 0.4;
      const dist = 60 + rand() * 50;
      const s = 2 + rand() * 5;
      m.position.set(Math.sin(ang) * dist, -14 + rand() * 16, Math.cos(ang) * dist);
      m.scale.set(s * (1 + rand()), s * (0.6 + rand() * 0.5), s * (1 + rand()));
      m.rotation.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4);
      m.userData.bob = { base: m.position.y, phase: rand() * 10, speed: 0.1 + rand() * 0.15 };
      g.add(m);
    }
    this.islets = g;
    return g;
  }

  update(time) {
    for (const m of this.islets.children) {
      const b = m.userData.bob;
      m.position.y = b.base + Math.sin(time * b.speed + b.phase) * 0.6;
    }
  }
}
