import * as THREE from 'three';
import { shared } from './shared.js';
import { LAYERS } from './layers.js';
import { FRAG_PRELUDE } from './glsl/index.js';
import { GLSL_STARS } from './glsl/stars.glsl.js';
import { ELEMENTS, RING_RADIUS } from './layout.js';
import { GLSL_NOISE } from './glsl/noise.glsl.js';

// The ground: a few centimetres of still water over dark stone, out to the horizon.
// At grazing angles it is a mirror (planar reflection from the pipeline's mirror pass,
// bent by the ripple simulation); looking down, the stone shows through, engraved with
// one great seal that ties the four elements to the centre.

// The salt crust on the stone is a pattern of cracked polygons (cell borders of a Voronoi
// diagram). Finding those borders takes dozens of hashes per pixel, so the whole fine pattern
// of the bed is drawn once into a tiling texture and one fetch brings all of it:
//   red    salt: the ridges along the cracks. Each border has a width and a strength of its
//          own, wanders a little, has a soft skirt and wears thin in places, so that the net
//          reads as weathered crust and not as a drawing of one;
//   green  the tone of the plate (0.5 = unchanged): plates differ, drift lighter and darker
//          in patches a dozen metres across, and some are split by hairline cracks;
//   blue   mineral specks a texel in size, most of them faint and a few bright.
// The mip chain fades all three out cleanly with distance.
const CRUST_CELLS = 20;         // cells per tile edge; the tile repeats every CRUST_CELLS / CRUST_SCALE metres
const CRUST_SCALE = 0.42;       // cells per metre

const CRUST_BAKE_FRAG = /* glsl */ `
uniform sampler3D uNoise3D;      // declared for the noise library; the hashes used here do not read it
${GLSL_NOISE}
varying vec2 vUv;
const float CELLS = ${CRUST_CELLS.toFixed(1)};
// Value noise that repeats every 'period' lattice cells, so the tile stays seamless.
float tileNoise(vec2 p, float period) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(mod(i, period)), hash12(mod(i + vec2(1.0, 0.0), period)), u.x),
             mix(hash12(mod(i + vec2(0.0, 1.0), period)), hash12(mod(i + vec2(1.0, 1.0), period)), u.x), u.y);
}
// Distance to the nearest cell border of a Voronoi diagram that repeats every 'period' cells.
float borderDistance(vec2 p, float period) {
  vec2 n = floor(p), f = fract(p);
  vec2 mg, mr; float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 r = g + hash22(mod(n + g, period)) - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  float bd = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 r = g + hash22(mod(n + g, period)) - f;
    if (dot(mr - r, mr - r) > 1e-5) bd = min(bd, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return bd;
}
void main() {
  vec2 p = vUv * CELLS;
  // Real cracks are not ruler-straight: bend the plane a little before cutting it into plates.
  vec2 q = p + (vec2(tileNoise(p * 1.5, CELLS * 1.5), tileNoise(p * 1.5 + 37.0, CELLS * 1.5)) - 0.5) * 0.16
             + (vec2(tileNoise(p * 6.0, CELLS * 6.0), tileNoise(p * 6.0 + 71.0, CELLS * 6.0)) - 0.5) * 0.035;
  vec2 n = floor(q), f = fract(q);
  vec2 mg, mr; float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 r = g + hash22(mod(n + g, CELLS)) - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  vec2 home = mod(n + mg, CELLS);
  // Every border carries its own ridge of salt; where borders meet, the stronger one shows.
  float ridge = 0.0, skirt = 0.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 c = mod(n + g, CELLS);
    vec2 r = g + hash22(c) - f;
    if (dot(mr - r, mr - r) > 1e-5) {
      float bd = dot(0.5 * (mr + r), normalize(r - mr));
      float e = fract(hash12(home) + hash12(c));               // one number per border, the same from either side
      float width = mix(0.028, 0.080, e);
      float strength = mix(0.5, 1.0, fract(e * 7.31));
      ridge = max(ridge, (1.0 - smoothstep(0.0, width, bd)) * strength);
      skirt = max(skirt, exp(-bd / (width * 1.8)) * strength);
    }
  }
  // The crust wears thin in places: whole stretches of the net fade to a trace.
  float worn = smoothstep(0.34, 0.60, 0.6 * tileNoise(p * 0.3 + 5.0, CELLS * 0.3) + 0.4 * tileNoise(p * 1.3 + 9.0, CELLS * 1.3));
  float salt = max(ridge, skirt * 0.3) * mix(0.35, 1.0, worn);

  float tone = 0.5 + (hash12(home + 17.0) - 0.5) * 0.62 + (tileNoise(p * 0.2 + 3.0, CELLS * 0.2) - 0.5) * 0.7;
  float hairline = 1.0 - smoothstep(0.0, 0.045, borderDistance(q * 3.0 + 7.0, CELLS * 3.0));
  tone -= hairline * step(0.45, hash12(home + 41.0)) * 0.2;

  vec2 texel = floor(gl_FragCoord.xy);
  float speck = step(0.982, hash12(texel)) * mix(0.12, 1.0, pow(hash12(texel + 191.0), 3.0));
  gl_FragColor = vec4(salt, clamp(tone, 0.0, 1.0), speck, 1.0);
}
`;

function bakeCrust(renderer) {
  const size = 2048;
  const target = new THREE.WebGLRenderTarget(size, size, {
    format: THREE.RGBAFormat, type: THREE.UnsignedByteType, depthBuffer: false,
    wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping,
    minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true,
  });
  target.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const material = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: CRUST_BAKE_FRAG, depthTest: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(mesh, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
  renderer.setRenderTarget(previous);
  geometry.dispose();
  material.dispose();
  return target;
}

const VERT = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */ `
${FRAG_PRELUDE}
${GLSL_STARS}
uniform sampler2D tMirror;
uniform sampler2D tCrust;
uniform float uMirrorOn;
uniform vec3 uElementPos[4];
uniform vec3 uElementColor[4];
uniform float uSealBoost[4];
uniform float uRing;
varying vec3 vWorldPos;

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
float sdRing(vec2 p, float r) { return abs(length(p) - r); }
// Equilateral triangle outline, circumradius r. dir = 1 points to -z ("up" on the floor), -1 to +z.
float sdTriangle(vec2 p, float r, float dir) {
  vec2 a = vec2(0.0, -r * dir);
  vec2 b = vec2(r * 0.8660254, r * 0.5 * dir);
  vec2 c = vec2(-r * 0.8660254, r * 0.5 * dir);
  return min(sdSegment(p, a, b), min(sdSegment(p, b, c), sdSegment(p, c, a)));
}
// The four alchemical signs. index: 0 fire, 1 water, 2 earth, 3 air.
float sdGlyph(vec2 p, int index, float r) {
  float dir = (index == 0 || index == 3) ? 1.0 : -1.0;
  float d = sdTriangle(p, r, dir);
  if (index >= 2) {
    float z = -0.18 * r * dir;
    d = min(d, sdSegment(p, vec2(-r * 0.74, z), vec2(r * 0.74, z)));
  }
  return d;
}
float line(float d, float w) {
  float aa = fwidth(d) * 1.2 + 1e-4;
  return 1.0 - smoothstep(w - aa, w + aa, d);
}

void main() {
  vec3 toCam = cameraPosition - vWorldPos;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec2 p = vWorldPos.xz;
  float rad = length(p);

  // ---- water surface normal: simulated ripples + wind ruffles in drifting patches ----
  vec2 ruv = p / uRippleDomain + 0.5;
  float e = 1.0 / 1024.0;
  float inDomain = step(abs(ruv.x - 0.5), 0.5) * step(abs(ruv.y - 0.5), 0.5);
  float hL = texture2D(uRippleTex, ruv - vec2(e, 0.0)).r, hR = texture2D(uRippleTex, ruv + vec2(e, 0.0)).r;
  float hD = texture2D(uRippleTex, ruv - vec2(0.0, e)).r, hU = texture2D(uRippleTex, ruv + vec2(0.0, e)).r;
  float hC = texture2D(uRippleTex, ruv).r;
  vec2 slope = vec2(hR - hL, hU - hD) / (2.0 * e * uRippleDomain) * inDomain * 0.6;
  // Curvature of the surface focuses light on the bed: bright where a ripple crest passes.
  float focusing = clamp(1.0 - (hL + hR + hD + hU - 4.0 * hC) * 90.0 * inDomain, 0.35, 2.6);

  // Wind ruffles come in drifting patches; each octave fades out once it is smaller than a pixel.
  float fw = length(fwidth(p));
  // (everything here comes from the baked noise volume: four fetches, no procedural noise)
  vec4 wide = noiseTexLod(vec3(p * 0.0088 + vec2(uTime * 0.0052, -uTime * 0.0033), 0.37), 0.0);
  float breeze = smoothstep(0.51, 0.70, wide.r);
  // Two decorrelated taps make a slope vector; the texture's mip chain fades the ruffles
  // out by itself once they shrink below a pixel.
  vec3 rq = vec3(p * 0.12 + vec2(uTime * 0.021, uTime * 0.012), uTime * 0.019);
  vec2 ruffle = vec2(noiseTex(rq).r, noiseTex(rq + vec3(0.31, 0.57, 0.13)).r) - 0.5;
  float swell = 0.0014 + 0.0085 * breeze;
  slope += ruffle * 7.0 * swell;
  // A slow, large undulation so the far mirror is never mathematically flat.
  vec4 und = noiseTex(vec3(p * 0.0275 + vec2(uTime * 0.010, -uTime * 0.009), uTime * 0.004 + 0.61));
  slope += (vec2(und.r, und.b) - 0.5) * 0.0055 / (1.0 + sq(fw * 0.4));
  slope /= 1.0 + length(slope) * 5.0;
  float nearFade = 1.0 / (1.0 + dist * 0.012);
  vec3 N = normalize(vec3(-slope.x, 1.0, -slope.y));

  // ---- reflection ----
  float cosT = saturate(dot(N, V));
  float fresnel = 0.05 + 0.95 * pow(1.0 - cosT, 4.2);
  vec2 suv = screenUV();
  // Tilting toward the eye moves the reflection vertically, tilting sideways moves it
  // far less at a grazing view: that is what stretches reflections into streaks.
  vec3 camRight = normalize(uCameraWorldMatrix[0].xyz);
  vec2 fwd = normalize(-V.xz + 1e-5);
  float tiltF = dot(slope, fwd);
  float tiltS = dot(slope, camRight.xz);
  vec2 bend = vec2(tiltS * (0.25 + 0.75 * V.y), tiltF) * 2.6;
  vec2 muv = vec2(1.0 - (suv.x + bend.x), suv.y + bend.y);
  muv = clamp(muv, vec2(0.001), vec2(0.999));
  float lod = breeze * 2.2 * nearFade + 0.35;
  vec3 reflection = uMirrorOn > 0.5 ? textureLod(tMirror, muv, lod).rgb : skyColor(reflect(-V, N));
  // Stars are reflected analytically: pin-sharp on calm water, shivering where it is ruffled.
  // (with a calmer normal than the mirror image uses, or every star smears into a dashed streak)
  float starry = (1.0 - saturate(luma(reflection) * 7.0)) * 0.75;
  if (fresnel * starry > 0.02) {
    vec3 R = reflect(-V, normalize(vec3(-slope.x * 0.3, 1.0, -slope.y * 0.3)));
    R.y = abs(R.y);
    reflection += nightStars(R) * starry;
  }
  // The moon's glitter path. Its disc is in the mirror image; ruffles too small to resolve at
  // that distance tip a share of its light toward the eye from above and below the mirror
  // point, far more readily than from either side: a narrow column of light standing on the
  // reflected disc, strongest where the wind is on the water.
  float towardMoon = -dot(V.xz, uMoonDiscDir.xz);
  if (towardMoon > 0.9) {
    float aside = V.x * uMoonDiscDir.z - V.z * uMoonDiscDir.x;      // of the moon's bearing, radians
    float above = V.y - uMoonDiscDir.y;                             // of the mirror point, radians
    float glade = exp(-sq(aside / 0.016) - sq(above / 0.060)) * (0.30 + 0.70 * breeze);
    reflection += vec3(1.28, 1.20, 1.06) * glade * 0.36;
  }

  // ---- the stone under the film ----
  // Refraction shifts what we see of the bed by a hair; enough to make it swim with the ripples.
  vec2 bp = p + slope * 0.9;
  float brad = length(bp);
  float plaza = 1.0 - smoothstep(uRing + 7.5, uRing + 13.0, brad);
  vec3 albedo = mix(vec3(0.052, 0.055, 0.064), vec3(0.038, 0.040, 0.049), plaza);
  // The salt-crust cells and the grain cost real time: skip them where the mirror hides
  // the bed, and let them fade out with distance before they shrink below a pixel.
  float bedDetail = (1.0 - smoothstep(0.55, 0.8, fresnel)) * (1.0 - smoothstep(45.0, 80.0, dist));
  if (bedDetail > 0.0) {
    // One fetch brings the fine pattern of the bed: r salt ridges, g plate tone, b mineral specks.
    vec3 crust = texture2D(tCrust, (bp * ${CRUST_SCALE.toFixed(2)} + 13.7) / ${CRUST_CELLS.toFixed(1)}).rgb;
    vec4 g = noiseTex(vec3(bp * 0.11, 0.21));                 // r: grain a couple of metres across, b: fine
    float grain = saturate(0.5 + (g.r - 0.5) * 1.5 + (g.b - 0.5) * 0.9);
    float open = (1.0 - plaza * 0.75) * bedDetail;            // the plaza is dressed stone: a quarter of the crust
    albedo *= mix(1.0, 0.62 + 0.76 * grain, bedDetail);
    albedo *= mix(vec3(1.0), mix(vec3(0.72, 0.75, 0.82), vec3(1.30, 1.27, 1.20), crust.g), open);
    albedo += vec3(0.085, 0.088, 0.094) * crust.r * open;
    // Near the eye the specks are glints of mineral; further out they would only be noise.
    albedo += vec3(0.13, 0.13, 0.14) * crust.b * grain * (1.0 - smoothstep(8.0, 16.0, dist));
  }
  // Concentric paving joints inside the plaza.
  float joints = line(abs(fract(brad * 0.5) - 0.5) * 2.0, 0.012) * plaza * step(1.0, brad);
  albedo *= 1.0 - joints * 0.45;

  vec3 bedLight = skyAmbient(vec3(0.0, 1.0, 0.0)) * 1.4 + uMoonColor * 0.75 * max(uMoonDir.y, 0.0);
  vec3 toFire = uFireLightPos - vec3(bp.x, 0.0, bp.y);
  float fd2 = dot(toFire, toFire);
  bedLight += uFireLightColor * max(toFire.y, 0.0) / (sqrt(fd2) * (fd2 + 1.0)) * 1.3;
  // Lightning from the vortex throws a cold flash across the stone.
  vec3 toFlash = uFlash.xyz - vec3(bp.x, 0.0, bp.y);
  bedLight += vec3(0.75, 0.85, 1.0) * uFlash.w * 260.0 * max(toFlash.y, 0.0) / (pow(dot(toFlash, toFlash), 1.5) + 40.0);
  vec3 bed = albedo * bedLight * focusing;

  // ---- the seal ----
  vec3 glow = vec3(0.0);
  if (brad < uRing + 9.0) {
    float t = uTime;
    vec3 gold = vec3(1.0, 0.80, 0.52);
    // Centre: nested rings, a diamond joining the four signs, a ring of tick marks.
    float dC = min(sdRing(bp, 2.35), sdRing(bp, 2.62));
    float ang = atan(bp.y, bp.x);
    float ticks = abs(fract(ang / TAU * 72.0) - 0.5) * (brad * TAU / 72.0);
    float tickBand = max(ticks, max(brad - 3.05, 2.75 - brad));
    dC = min(dC, tickBand + 0.012);
    float q = uRing - 5.55;
    vec2 ap = abs(bp);
    float diamond = abs(ap.x + ap.y - q) * 0.7071;
    dC = min(dC, max(diamond, brad - q - 0.01));
    // Outer boundary of the whole figure.
    float outer = min(sdRing(bp, uRing + 6.4), sdRing(bp, uRing + 6.75));
    float oticks = abs(fract(ang / TAU * 144.0) - 0.5) * (brad * TAU / 144.0);
    outer = min(outer, max(oticks, max(brad - (uRing + 7.25), (uRing + 6.9) - brad)) + 0.014);
    float base = line(dC, 0.016) + line(outer, 0.02) * 0.8;
    glow += gold * base * 0.20;
    glow += gold * exp(-min(dC, outer) * 14.0) * 0.025;

    // Each element's figure (two rings, a cartouche with its sign on the side that faces
    // the centre, and a channel from the cartouche to the central rings) lies wholly inside
    // that element's quarter of the seal, so only the nearest one is evaluated.
    int i = abs(bp.y) > abs(bp.x) ? (bp.y < 0.0 ? 0 : 1) : (bp.x < 0.0 ? 2 : 3);
    {
      vec2 c = uElementPos[i].xz;
      vec2 lp = bp - c;
      float lr = length(lp);
      vec2 inward = -normalize(c);
      float d = min(sdRing(lp, 4.25), sdRing(lp, 4.55));
      vec2 cart = c + inward * 5.55;
      vec2 cp = bp - cart;
      d = min(d, sdRing(cp, 0.95));
      d = min(d, sdGlyph(cp, i, 0.56));
      vec2 chanA = cart + inward * 0.95;
      vec2 chanB = inward * -2.62;
      float dChan = sdSegment(bp, chanA, chanB);
      float along = dot(bp - chanA, inward);
      float pulse = 0.35 + 0.65 * smoothstep(0.75, 1.0, sin(along * 2.4 - t * 1.6 + float(i) * 1.7) * 0.5 + 0.5);
      float breathe = 0.75 + 0.25 * sin(t * 0.7 + float(i) * 1.57);
      // The focused element's figure is drawn a little heavier and a little brighter: still an
      // engraving, well under the level where the bloom would turn it into a neon tube.
      float boost = 1.0 + uSealBoost[i] * 0.9;
      vec3 tint = mix(gold, uElementColor[i], 0.78);
      float l = line(d, 0.018 + 0.005 * uSealBoost[i]) * breathe + line(dChan, 0.014) * pulse;
      glow += tint * l * 0.34 * boost;
      glow += tint * (exp(-d * 11.0) * 0.045 * breathe + exp(-dChan * 12.0) * 0.03 * pulse);
      // A wash of the element's colour inside its ring, as if the stone were lit from within.
      glow += uElementColor[i] * smoothstep(4.25, 0.5, lr) * 0.006 * boost;
    }
  }

  vec3 col = mix(bed + glow, reflection, fresnel);
  // The specular glint of the fire on the water lives in the mirror image; add its warm
  // diffuse spill into the film itself so the light visibly pools around the pyre.
  gl_FragColor = vec4(col, 1.0);
}
`;

export class Ground {
  constructor(renderer) {
    this.crust = bakeCrust(renderer);
    const geometry = new THREE.CircleGeometry(5200, 96);
    geometry.rotateX(-Math.PI / 2);
    this.uniforms = {
      ...shared,
      tMirror: { value: null },
      tCrust: { value: this.crust.texture },
      uMirrorOn: { value: 1 },
      uElementPos: { value: ELEMENTS.map((e) => new THREE.Vector3(...e.position)) },
      uElementColor: { value: ELEMENTS.map((e) => new THREE.Color(e.color).convertSRGBToLinear()) },
      uSealBoost: { value: [0, 0, 0, 0] },
      uRing: { value: RING_RADIUS },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.layers.set(LAYERS.GROUND);
    this.mesh.name = 'ground';
  }

  /** boosts: one value in [0, 1] per element, in ELEMENTS order. */
  setSealBoost(boosts) {
    for (let i = 0; i < 4; i++) this.uniforms.uSealBoost.value[i] = boosts[i] || 0;
  }
}
