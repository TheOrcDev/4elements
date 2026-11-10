import * as THREE from 'three';
import { shared } from './shared.js';
import { LAYERS } from './layers.js';
import { volumeMaterials } from './materials.js';

// The frame is built in stages so that later stages can read what earlier ones drew:
//
//   mirror   everything except the ground, seen from below the water film      -> rtMirror
//   opaque   solid geometry + ground (which samples rtMirror)                    -> rtScene (colour + depth)
//   depth    a copy of that depth which later stages can sample while they
//            go on depth-testing against the original                            -> rtDepth
//            (with multisampling on, the opaque pass goes to rtOpaque instead and
//            its resolved colour and depth are copied into rtScene)
//
// then, for the core's own objects and for each element from the farthest to the nearest:
//
//   volume   its raymarched volumes at half resolution, clipped by the opaque
//            depth, joined to the frame with a depth-aware upsample              -> rtVolume -> rtScene
//   fx       its particles                                                       -> rtScene
//   refract  its refractive surfaces, which sample a copy of the frame so far    -> rtScene
//   late     whatever it draws on top of those                                   -> rtScene
//
// Working through the elements back to front is what lets a flame burn in front of a
// distant body of water and be seen, bent, through a near one.
//
//   bloom    13-tap downsample chain, tent upsample
//   output   bloom, exposure, ACES, grade, vignette, grain                      -> canvas

const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const triangle = new THREE.BufferGeometry();
triangle.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
triangle.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
const fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

class Pass {
  constructor(fragmentShader, uniforms = {}, options = {}) {
    this.uniforms = uniforms;
    this.material = new THREE.ShaderMaterial({
      vertexShader: FS_VERT,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      ...options,
    });
    this.mesh = new THREE.Mesh(triangle, this.material);
    this.mesh.frustumCulled = false;
  }
  /**
   * replace: the pass writes every pixel of the target. Clearing first tells a tile-based
   * GPU that the old contents are not needed, which saves it loading them.
   */
  render(renderer, target, replace = false) {
    renderer.setRenderTarget(target);
    if (replace) renderer.clear();
    renderer.render(this.mesh, fsCamera);
  }
}

const COPY_DEPTH_FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform sampler2D tDepth;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(texture2D(tColor, vUv).rgb, 1.0);
  gl_FragDepth = texture2D(tDepth, vUv).r;
}
`;

const DEPTH_ONLY_FRAG = /* glsl */ `
uniform sampler2D tDepth;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(tDepth, vUv).r, 0.0, 0.0, 1.0); }
`;

const BLIT_FRAG = /* glsl */ `
uniform sampler2D tColor;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(tColor, vUv).rgb, 1.0); }
`;

// Joins the half-resolution volume buffer onto the full-resolution scene. Each output
// pixel blends the four nearest volume texels, favouring those whose opaque depth matches
// its own, so volumes do not bleed across the silhouettes of solid objects. Most of the
// frame holds no volume at all: one bilinear tap at the corner the four texels share is
// their average, and where that is zero the pixel is left alone.
const VOLUME_COMPOSITE_FRAG = /* glsl */ `
uniform sampler2D tVolume;
uniform sampler2D tDepth;
uniform vec2 uVolumeSize;
uniform float uNear;
uniform float uFar;
varying vec2 vUv;
float viewZ(float d) { float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
void main() {
  vec2 p = vUv * uVolumeSize - 0.5;
  vec2 ip = floor(p);
  vec2 f = p - ip;
  vec4 mean4 = texture2D(tVolume, (ip + 1.0) / uVolumeSize);
  if (mean4.a + mean4.r + mean4.g + mean4.b <= 0.0) discard;
  float zFull = viewZ(texture2D(tDepth, vUv).r);
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
    vec2 o = vec2(float(i), float(j));
    vec2 tuv = (ip + o + 0.5) / uVolumeSize;
    vec4 v = texture2D(tVolume, tuv);
    float z = viewZ(texture2D(tDepth, tuv).r);
    float bw = (i == 0 ? 1.0 - f.x : f.x) * (j == 0 ? 1.0 - f.y : f.y);
    float dw = 1.0 / (0.02 + abs(zFull - z) / max(min(zFull, z), 0.01) * 40.0);
    acc += v * (bw + 1e-4) * dw;
    wsum += (bw + 1e-4) * dw;
  }
  gl_FragColor = acc / wsum;
}
`;

const BLOOM_PREFILTER_FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uKnee;
varying vec2 vUv;
vec3 fetch(vec2 o) {
  vec3 c = texture2D(tColor, vUv + o * uTexel).rgb;
  // A single NaN or runaway pixel would be smeared over the whole frame by the blur chain.
  if (isnan(c.r) || isnan(c.g) || isnan(c.b)) c = vec3(0.0);
  return clamp(c, 0.0, 48.0);
}
float karis(vec3 c) { return 1.0 / (1.0 + max(c.r, max(c.g, c.b))); }
vec3 soft(vec3 c) {
  float br = max(c.r, max(c.g, c.b));
  float s = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  s = s * s / (4.0 * uKnee + 1e-4);
  return c * max(s, br - uThreshold) / max(br, 1e-4);
}
void main() {
  vec3 a = fetch(vec2(-2.0, 2.0)), b = fetch(vec2(0.0, 2.0)), c = fetch(vec2(2.0, 2.0));
  vec3 d = fetch(vec2(-2.0, 0.0)), e = fetch(vec2(0.0, 0.0)), f = fetch(vec2(2.0, 0.0));
  vec3 g = fetch(vec2(-2.0, -2.0)), h = fetch(vec2(0.0, -2.0)), i = fetch(vec2(2.0, -2.0));
  vec3 j = fetch(vec2(-1.0, 1.0)), k = fetch(vec2(1.0, 1.0)), l = fetch(vec2(-1.0, -1.0)), m = fetch(vec2(1.0, -1.0));
  // Five overlapping 2x2 boxes, each weighted by its own Karis term to suppress fireflies.
  vec3 g0 = (a + b + d + e) * 0.25, g1 = (b + c + e + f) * 0.25, g2 = (d + e + g + h) * 0.25, g3 = (e + f + h + i) * 0.25;
  vec3 g4 = (j + k + l + m) * 0.25;
  float w0 = karis(g0) * 0.125, w1 = karis(g1) * 0.125, w2 = karis(g2) * 0.125, w3 = karis(g3) * 0.125, w4 = karis(g4) * 0.5;
  vec3 col = (g0 * w0 + g1 * w1 + g2 * w2 + g3 * w3 + g4 * w4) / (w0 + w1 + w2 + w3 + w4);
  gl_FragColor = vec4(soft(col), 1.0);
}
`;

const BLOOM_DOWN_FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform vec2 uTexel;
varying vec2 vUv;
vec3 fetch(vec2 o) { return texture2D(tColor, vUv + o * uTexel).rgb; }
void main() {
  vec3 a = fetch(vec2(-2.0, 2.0)), b = fetch(vec2(0.0, 2.0)), c = fetch(vec2(2.0, 2.0));
  vec3 d = fetch(vec2(-2.0, 0.0)), e = fetch(vec2(0.0, 0.0)), f = fetch(vec2(2.0, 0.0));
  vec3 g = fetch(vec2(-2.0, -2.0)), h = fetch(vec2(0.0, -2.0)), i = fetch(vec2(2.0, -2.0));
  vec3 j = fetch(vec2(-1.0, 1.0)), k = fetch(vec2(1.0, 1.0)), l = fetch(vec2(-1.0, -1.0)), m = fetch(vec2(1.0, -1.0));
  vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  gl_FragColor = vec4(col, 1.0);
}
`;

const BLOOM_UP_FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform vec2 uTexel;
uniform float uWeight;
varying vec2 vUv;
void main() {
  vec2 r = uTexel;
  vec3 col = texture2D(tColor, vUv).rgb * 4.0;
  col += (texture2D(tColor, vUv + vec2(r.x, 0.0)).rgb + texture2D(tColor, vUv - vec2(r.x, 0.0)).rgb
        + texture2D(tColor, vUv + vec2(0.0, r.y)).rgb + texture2D(tColor, vUv - vec2(0.0, r.y)).rgb) * 2.0;
  col += texture2D(tColor, vUv + r).rgb + texture2D(tColor, vUv - r).rgb
       + texture2D(tColor, vUv + vec2(r.x, -r.y)).rgb + texture2D(tColor, vUv + vec2(-r.x, r.y)).rgb;
  gl_FragColor = vec4(col * (uWeight / 16.0), 1.0);
}
`;

const OUTPUT_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2 uTexel;
uniform float uBloomStrength;
uniform float uExposure;
uniform float uTime;
uniform float uFade;
uniform float uGrain;
uniform float uVignette;
uniform float uAberration;
uniform float uFxaa;
varying vec2 vUv;

vec3 RRTAndODTFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}
// ACES filmic fit by Stephen Hill.
vec3 aces(vec3 color) {
  const mat3 inputMat = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 outputMat = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  color = inputMat * color;
  color = RRTAndODTFit(color);
  return clamp(outputMat * color, 0.0, 1.0);
}
vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

// Edges are found and blended in a compressed space (c / (1 + max(c))), where a pixel of
// flame next to a pixel of night sky can meet half-way; the result is expanded again.
vec3 squash(vec3 c) { c = max(c, vec3(0.0)); return c / (1.0 + max(c.r, max(c.g, c.b))); }
vec3 expand(vec3 c) { return c / max(1.0 - max(c.r, max(c.g, c.b)), 1e-3); }
float edgeLuma(vec3 squashed) { return sqrt(dot(squashed, vec3(0.299, 0.587, 0.114))); }
vec3 tap(vec2 uv) { return squash(texture2D(tScene, uv).rgb); }

void main() {
  vec2 c = vUv - 0.5;
  float r2 = dot(c, c);

  // ---- anti-aliasing (FXAA, after Timothy Lottes) -------------------------------------
  vec3 hdrM = max(texture2D(tScene, vUv).rgb, vec3(0.0));
  vec3 scene = hdrM;
  bool edge = false;
  if (uFxaa > 0.5) {
    vec3 rgbM = squash(hdrM);
    vec3 rgbNW = tap(vUv + vec2(-0.5, -0.5) * uTexel);
    vec3 rgbNE = tap(vUv + vec2(0.5, -0.5) * uTexel);
    vec3 rgbSW = tap(vUv + vec2(-0.5, 0.5) * uTexel);
    vec3 rgbSE = tap(vUv + vec2(0.5, 0.5) * uTexel);
    float lM = edgeLuma(rgbM), lNW = edgeLuma(rgbNW), lNE = edgeLuma(rgbNE), lSW = edgeLuma(rgbSW), lSE = edgeLuma(rgbSE);
    float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
    float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
    if (lMax - lMin > max(0.035, lMax * 0.14)) {
      edge = true;
      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
      float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
      dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + reduce), -6.0, 6.0) * uTexel;
      vec3 rgbA = 0.5 * (tap(vUv + dir * (1.0 / 3.0 - 0.5)) + tap(vUv + dir * (2.0 / 3.0 - 0.5)));
      vec3 rgbB = rgbA * 0.5 + 0.25 * (tap(vUv - dir * 0.5) + tap(vUv + dir * 0.5));
      float lB = edgeLuma(rgbB);
      scene = expand((lB < lMin || lB > lMax) ? rgbA : rgbB);
    }
  }
  // Lateral chromatic aberration grows toward the corners (left off the pixels just blended,
  // and off the middle of the frame, where it is a fraction of a pixel).
  if (!edge && r2 > 0.06) {
    vec2 shift = c * r2 * uAberration;
    scene.r = texture2D(tScene, vUv + shift).r;
    scene.b = texture2D(tScene, vUv - shift).b;
  }

  vec3 bloom = texture2D(tBloom, vUv).rgb;
  vec3 col = scene + bloom * uBloomStrength;
  col = max(col, vec3(0.0));

  // Vignette in scene-linear space so highlights roll off naturally.
  float vig = 1.0 - uVignette * smoothstep(0.10, 0.85, r2 * 1.9);
  col *= vig * uExposure;

  col = aces(col / 0.6);

  // Grade: a touch more contrast, and shadows leaning cool.
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, 1.06);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.22);
  col += vec3(-0.004, 0.000, 0.008) * (1.0 - l);

  col = toSRGB(col) * uFade;

  // Film grain, stronger in the mid-tones, plus sub-LSB dither against banding in the sky.
  float n = hash(gl_FragCoord.xy + fract(uTime) * 311.7);
  float n2 = hash(gl_FragCoord.yx * 1.37 + fract(uTime * 1.31) * 173.3);
  col += (n - 0.5) * uGrain * (0.35 + 0.65 * (1.0 - abs(l * 2.0 - 1.0)));
  col += (n2 - 0.5) / 255.0;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// Private layer used to draw one stage of one element at a time.
const SCRATCH_LAYER = 6;
const byDistanceDesc = (a, b) => b.distance - a.distance;

const MASK_VOLUME = 1 << LAYERS.VOLUME;
const MASK_FX = 1 << LAYERS.FX;
const MASK_REFRACT = 1 << LAYERS.REFRACT;
const MASK_LATE = 1 << LAYERS.LATE;

/** The drawable objects under one root, sorted by the stage they belong to. */
function createStageGroup(root, centre) {
  const group = { root, centre, distance: 0, volume: [], fx: [], refract: [], late: [] };
  group.collect = (o) => {
    if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
    const mask = o.layers.mask;
    if (mask === MASK_VOLUME) group.volume.push(o);
    else if (mask === MASK_FX) group.fx.push(o);
    else if (mask === MASK_REFRACT) group.refract.push(o);
    else if (mask === MASK_LATE) group.late.push(o);
  };
  group.reset = () => { group.volume.length = 0; group.fx.length = 0; group.refract.length = 0; group.late.length = 0; };
  return group;
}

const BLOOM_LEVELS = 6;
const BLOOM_WEIGHTS = [1.0, 0.9, 0.8, 0.8, 0.9, 1.1];

export class Pipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.mirrorCamera = camera.clone();
    this.mirrorCamera.layers.enableAll();

    this.settings = {
      mirror: true,
      mirrorScale: 0.5,
      mirrorQuality: 0.6,
      volumeScale: 0.5,
      quality: 1,
      msaa: 0,
      fxaa: true,
      bloomStrength: 0.55,
      bloomThreshold: 0.95,
      bloomKnee: 0.6,
      exposure: 1.0,
      grain: 0.022,
      vignette: 0.42,
      aberration: 0.006,
      fade: 1,
    };

    this.width = 1;
    this.height = 1;
    this.outputWidth = 1;
    this.outputHeight = 1;

    // 1x1 stand-ins bound when a stage has no scene colour / depth to offer.
    this.blackTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.blackTexture.needsUpdate = true;
    this.farDepthTexture = new THREE.DataTexture(new Float32Array([1, 1, 1, 1]), 1, 1, THREE.RGBAFormat, THREE.FloatType);
    this.farDepthTexture.needsUpdate = true;

    const hdr = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter };
    this.rtOpaque = new THREE.WebGLRenderTarget(1, 1, { ...hdr, samples: this.settings.msaa, depthBuffer: true });
    this.rtOpaque.depthTexture = new THREE.DepthTexture(1, 1);
    this.rtOpaque.depthTexture.type = THREE.UnsignedIntType;
    this.rtScene = new THREE.WebGLRenderTarget(1, 1, { ...hdr, depthBuffer: true });
    this.rtScene.depthTexture = new THREE.DepthTexture(1, 1);
    this.rtScene.depthTexture.type = THREE.UnsignedIntType;
    // Raw depth as a colour texture: readable by shaders that are drawing into rtScene.
    this.rtDepth = new THREE.WebGLRenderTarget(1, 1, { format: THREE.RedFormat, type: THREE.FloatType, depthBuffer: false, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter });
    this.rtRefract = new THREE.WebGLRenderTarget(1, 1, { ...hdr, depthBuffer: false });
    this.rtVolume = new THREE.WebGLRenderTarget(1, 1, { ...hdr, depthBuffer: false });
    this.rtMirror = new THREE.WebGLRenderTarget(1, 1, { ...hdr, depthBuffer: true, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    this.bloomMips = [];
    for (let i = 0; i < BLOOM_LEVELS; i++) this.bloomMips.push(new THREE.WebGLRenderTarget(1, 1, { ...hdr, depthBuffer: false }));

    this.copyDepthPass = new Pass(COPY_DEPTH_FRAG, { tColor: { value: null }, tDepth: { value: null } }, {
      depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth,
    });
    this.blitPass = new Pass(BLIT_FRAG, { tColor: { value: null } });
    this.depthOnlyPass = new Pass(DEPTH_ONLY_FRAG, { tDepth: { value: null } });
    this.volumeCompositePass = new Pass(VOLUME_COMPOSITE_FRAG, {
      tVolume: { value: null }, tDepth: { value: null }, uVolumeSize: { value: new THREE.Vector2() },
      uNear: { value: 0.3 }, uFar: { value: 6000 },
    }, {
      transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.bloomPrefilterPass = new Pass(BLOOM_PREFILTER_FRAG, {
      tColor: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1 }, uKnee: { value: 0.5 },
    });
    this.bloomDownPass = new Pass(BLOOM_DOWN_FRAG, { tColor: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.bloomUpPass = new Pass(BLOOM_UP_FRAG, { tColor: { value: null }, uTexel: { value: new THREE.Vector2() }, uWeight: { value: 1 } }, {
      transparent: true, blending: THREE.AdditiveBlending,
    });
    this.outputPass = new Pass(OUTPUT_FRAG, {
      tScene: { value: null }, tBloom: { value: null }, uTexel: { value: new THREE.Vector2() }, uFxaa: { value: 1 },
      uBloomStrength: { value: 0.5 }, uExposure: { value: 1 }, uTime: shared.uTime, uFade: { value: 1 },
      uGrain: { value: 0.03 }, uVignette: { value: 0.4 }, uAberration: { value: 0.02 },
    });

    this.frame = 0;
    this.coreGroup = createStageGroup(scene, null);     // everything that belongs to no element
    this.groups = [];                                   // one per element
    this.groupRoots = new Set();
    this._v = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._clear = new THREE.Color(0, 0, 0);
  }

  /**
   * Register an element: everything under root is drawn together, stage by stage, and the
   * elements are worked through from the farthest (by centre) to the nearest. So an
   * element's flame, particles and refractive surfaces all land in front of whatever a
   * more distant element drew, and are seen through the refractive surfaces of a nearer one.
   */
  registerGroup(root, centre) {
    if (this.groupRoots.has(root)) return;
    this.groupRoots.add(root);
    this.groups.push(createStageGroup(root, centre.clone()));
  }

  unregisterGroup(root) {
    this.groupRoots.delete(root);
    this.groups = this.groups.filter((g) => g.root !== root);
  }

  /** Sort every visible object into its element's stage lists (they may have changed since last frame). */
  _collectGroups() {
    this.coreGroup.reset();
    this._collectCore(this.scene);
    const eye = this.camera.position;
    for (let i = 0; i < this.groups.length; i++) {
      const g = this.groups[i];
      g.reset();
      g.root.traverseVisible(g.collect);
      g.distance = g.centre.distanceToSquared(eye);
    }
    this.groups.sort(byDistanceDesc);
  }

  /** Everything visible that is not inside a registered element. */
  _collectCore(o) {
    if (!o.visible || this.groupRoots.has(o)) return;
    this.coreGroup.collect(o);
    const children = o.children;
    for (let i = 0; i < children.length; i++) this._collectCore(children[i]);
  }

  /** Draw just these objects (which live on `layer`) into the current target. */
  _drawStage(objects, layer) {
    for (let i = 0; i < objects.length; i++) objects[i].layers.set(SCRATCH_LAYER);
    this.renderer.render(this.scene, this.camera);
    for (let i = 0; i < objects.length; i++) objects[i].layers.set(layer);
  }

  _drawGroup(group) {
    const { renderer, camera, width: w, height: h } = this;
    if (group.volume.length) {
      shared.uResolution.value.set(this.rtVolume.width, this.rtVolume.height);
      renderer.setRenderTarget(this.rtVolume);
      renderer.clear();
      this._drawStage(group.volume, LAYERS.VOLUME);
      this.volumeCompositePass.render(renderer, this.rtScene);
      shared.uResolution.value.set(w, h);
    }
    renderer.setRenderTarget(this.rtScene);
    if (group.fx.length) this._drawStage(group.fx, LAYERS.FX);
    if (group.refract.length) {
      this._snapshot();
      this._drawStage(group.refract, LAYERS.REFRACT);
    }
    if (group.late.length) this._drawStage(group.late, LAYERS.LATE);
  }

  _snapshot() {
    this.blitPass.uniforms.tColor.value = this.rtScene.texture;
    this.blitPass.render(this.renderer, this.rtRefract, true);
    this.renderer.setRenderTarget(this.rtScene);
  }

  /** The target the opaque pass draws into (bind it while compiling the scene's shaders). */
  get opaqueTarget() { return this.settings.msaa === 0 ? this.rtScene : this.rtOpaque; }

  /** The mirror texture, for the ground shader. */
  get mirrorTexture() { return this.rtMirror.texture; }

  /** outputW/H: canvas backing-store size. scale: internal resolution relative to it. */
  setSize(outputWidth, outputHeight, scale = 1) {
    this.outputWidth = outputWidth;
    this.outputHeight = outputHeight;
    const w = Math.max(2, Math.round(outputWidth * scale));
    const h = Math.max(2, Math.round(outputHeight * scale));
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    if (this.settings.msaa > 0) this.rtOpaque.setSize(w, h);
    this.rtScene.setSize(w, h);
    this.rtDepth.setSize(w, h);
    this.rtRefract.setSize(w, h);
    this._resizeDerived();
  }

  _resizeDerived() {
    const { width: w, height: h, settings: s } = this;
    this.rtVolume.setSize(Math.max(2, Math.round(w * s.volumeScale)), Math.max(2, Math.round(h * s.volumeScale)));
    this.rtMirror.setSize(Math.max(2, Math.round(w * s.mirrorScale)), Math.max(2, Math.round(h * s.mirrorScale)));
    let bw = w, bh = h;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      bw = Math.max(2, Math.round(bw / 2));
      bh = Math.max(2, Math.round(bh / 2));
      this.bloomMips[i].setSize(bw, bh);
    }
  }

  /** Change mirror / volume buffer scales at runtime. */
  configure(partial) {
    const msaa = this.settings.msaa;
    Object.assign(this.settings, partial);
    if (this.settings.msaa !== msaa) {
      // The sample count is baked into the target's storage: drop it and let three rebuild it
      // (it is only ever allocated while multisampling is on).
      this.rtOpaque.dispose();
      this.rtOpaque.samples = this.settings.msaa;
      if (this.settings.msaa > 0) this.rtOpaque.setSize(this.width, this.height);
    }
    this._resizeDerived();
  }

  _setPassUniforms(camera, w, h, mirror, quality) {
    shared.uResolution.value.set(w, h);
    shared.uProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
    shared.uCameraWorldMatrix.value.copy(camera.matrixWorld);
    shared.uCameraNear.value = camera.near;
    shared.uCameraFar.value = camera.far;
    shared.uIsMirrorPass.value = mirror ? 1 : 0;
    shared.uQuality.value = quality;
  }

  _updateMirrorCamera() {
    const cam = this.camera;
    const m = this.mirrorCamera;
    m.fov = cam.fov; m.aspect = cam.aspect; m.near = cam.near; m.far = cam.far;
    m.projectionMatrix.copy(cam.projectionMatrix);
    m.projectionMatrixInverse.copy(cam.projectionMatrixInverse);
    // Reflect position, look target and up vector in the plane y = 0.
    m.position.set(cam.position.x, -cam.position.y, cam.position.z);
    this._v.set(0, 0, -1).applyQuaternion(cam.quaternion).add(cam.position);
    this._target.set(this._v.x, -this._v.y, this._v.z);
    this._v.set(0, 1, 0).applyQuaternion(cam.quaternion);
    m.up.set(this._v.x, -this._v.y, this._v.z);
    m.lookAt(this._target);
    m.updateMatrixWorld(true);
  }

  render() {
    const { renderer, scene, camera, settings: s } = this;
    const { width: w, height: h } = this;
    camera.updateMatrixWorld();
    const savedMask = camera.layers.mask;

    renderer.autoClear = false;
    // The moon does not move and what casts shadows barely does: every other frame is enough.
    renderer.shadowMap.needsUpdate = (this.frame++ & 1) === 0;
    renderer.setClearColor(this._clear, 0);

    // ---- mirror ---------------------------------------------------------------
    if (s.mirror) {
      this._updateMirrorCamera();
      const mc = this.mirrorCamera;
      mc.layers.enableAll();
      mc.layers.disable(LAYERS.GROUND);
      mc.layers.disable(LAYERS.MAIN_ONLY);
      mc.layers.disable(SCRATCH_LAYER);
      shared.uSceneColor.value = this.blackTexture;
      shared.uSceneDepth.value = this.farDepthTexture;
      this._setPassUniforms(mc, this.rtMirror.width, this.rtMirror.height, true, s.quality * s.mirrorQuality);
      for (const m of volumeMaterials) m.depthTest = true;
      renderer.setRenderTarget(this.rtMirror);
      renderer.clear();
      renderer.render(scene, mc);
      for (const m of volumeMaterials) m.depthTest = false;
    }

    // ---- opaque ---------------------------------------------------------------
    camera.layers.set(LAYERS.OPAQUE);
    camera.layers.enable(LAYERS.GROUND);
    camera.layers.enable(LAYERS.MAIN_ONLY);
    shared.uSceneColor.value = this.blackTexture;
    shared.uSceneDepth.value = this.farDepthTexture;
    this._setPassUniforms(camera, w, h, false, s.quality);
    // Without multisampling the opaque pass goes straight into the scene target, and only its
    // depth has to be copied (4 bytes a pixel instead of colour and depth both).
    const direct = s.msaa === 0;
    renderer.setRenderTarget(direct ? this.rtScene : this.rtOpaque);
    renderer.clear();
    renderer.render(scene, camera);

    // ---- scene: start from the opaque frame ---------------------------------------
    let sceneDepth;
    if (direct) {
      this.depthOnlyPass.uniforms.tDepth.value = this.rtScene.depthTexture;
      this.depthOnlyPass.render(renderer, this.rtDepth, true);
      sceneDepth = this.rtDepth.texture;
    } else {
      this.copyDepthPass.uniforms.tColor.value = this.rtOpaque.texture;
      this.copyDepthPass.uniforms.tDepth.value = this.rtOpaque.depthTexture;
      this.copyDepthPass.render(renderer, this.rtScene, true);
      sceneDepth = this.rtOpaque.depthTexture;
    }

    shared.uSceneDepth.value = sceneDepth;
    shared.uSceneColor.value = this.rtRefract.texture;
    const vc = this.volumeCompositePass.uniforms;
    vc.tVolume.value = this.rtVolume.texture;
    vc.tDepth.value = sceneDepth;
    vc.uVolumeSize.value.set(this.rtVolume.width, this.rtVolume.height);
    vc.uNear.value = camera.near;
    vc.uFar.value = camera.far;

    // ---- the core's own volumes and particles, then each element, far to near ------
    this._collectGroups();
    camera.layers.set(SCRATCH_LAYER);
    this._drawGroup(this.coreGroup);
    for (let i = 0; i < this.groups.length; i++) this._drawGroup(this.groups[i]);

    // ---- bloom ----------------------------------------------------------------------
    const mips = this.bloomMips;
    const pre = this.bloomPrefilterPass.uniforms;
    pre.tColor.value = this.rtScene.texture;
    pre.uTexel.value.set(1 / w, 1 / h);
    pre.uThreshold.value = s.bloomThreshold;
    pre.uKnee.value = s.bloomKnee;
    this.bloomPrefilterPass.render(renderer, mips[0], true);
    for (let i = 1; i < BLOOM_LEVELS; i++) {
      const u = this.bloomDownPass.uniforms;
      u.tColor.value = mips[i - 1].texture;
      u.uTexel.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height);
      this.bloomDownPass.render(renderer, mips[i], true);
    }
    for (let i = BLOOM_LEVELS - 2; i >= 0; i--) {
      const u = this.bloomUpPass.uniforms;
      u.tColor.value = mips[i + 1].texture;
      u.uTexel.value.set(1 / mips[i + 1].width, 1 / mips[i + 1].height);
      u.uWeight.value = BLOOM_WEIGHTS[i + 1];
      this.bloomUpPass.render(renderer, mips[i]);
    }

    // ---- output -----------------------------------------------------------------------
    const o = this.outputPass.uniforms;
    o.tScene.value = this.rtScene.texture;
    o.tBloom.value = mips[0].texture;
    o.uTexel.value.set(1 / w, 1 / h);
    o.uFxaa.value = s.fxaa ? 1 : 0;
    o.uBloomStrength.value = s.bloomStrength / BLOOM_LEVELS * 2.0;
    o.uExposure.value = s.exposure;
    o.uFade.value = s.fade;
    o.uGrain.value = s.grain;
    o.uVignette.value = s.vignette;
    o.uAberration.value = s.aberration;
    this.outputPass.render(renderer, null, true);

    camera.layers.mask = savedMask;
    shared.uSceneColor.value = this.blackTexture;
    shared.uSceneDepth.value = this.farDepthTexture;
  }

  dispose() {
    for (const rt of [this.rtOpaque, this.rtScene, this.rtDepth, this.rtRefract, this.rtVolume, this.rtMirror, ...this.bloomMips]) rt.dispose();
  }
}
