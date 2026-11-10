import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { VERT_PRELUDE } from '../../core/glsl/index.js';
import { WAVES_GLSL, RADIUS, LEVEL, IOR, lightOmega, glslFloat as f } from './waves.js';

// Two small textures, redrawn every simulation step, that the ray tracer reads instead of
// re-evaluating the sea at every march step:
//
//   field    (RGBA16F)  r = surface height relative to LEVEL, gb = slope d/dx, d/dz, a = foam
//   caustic  (RGBA16F)  r = moonlight focused onto the bed by the surface (1 = undisturbed)
//
// The column is lit as if it were still part of an open sea: the light that reaches its
// bed has come down through waves that lie outside the cylinder, up-moon of it. The caustic
// pass works those waves out for itself, at the pace the light keeps (see waves.js), and
// takes from the field only the foam, whose shadow it throws on the bed; so the field
// covers that stretch of "virtual sea" as well as the column.
//
// Foam is the only state: it is laid down where the surface folds over and then left to
// thin out where it was made, which is what leaves trails behind travelling crests.

/** Height of the plane the caustic map is focused on (just above the sand at the wall). */
export const CAUSTIC_PLANE = 0.12;

const FIELD_SIZE = 512;
const CAUSTIC_SIZE = 512;
const CAUSTIC_GRID = 256;         // cells across the sheet of moonlight that is bent through the sea
const CAUSTIC_GRID_FAR = 128;     // ... while the column is small in the picture

const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const DEG = Math.PI / 180;
// Capillary-gravity ripples. Too small to matter as geometry (a few millimetres), so they
// only contribute slope: glitter on the surface and the fine net in the caustics.
// wavelength (m), heading (degrees), slope amplitude
const RIPPLES = [
  [0.41, 24, 0.050],
  [0.31, -41, 0.050],
  [0.24, 8, 0.045],
  [0.185, 63, 0.040],
  [0.14, -70, 0.034],
].map(([wavelength, heading, slope]) => {
  const k = (2 * Math.PI) / wavelength;
  return [k * Math.cos(heading * DEG), k * Math.sin(heading * DEG), Math.sqrt(9.81 * k) * 0.8, slope];
});

// The ripples, for the wave-field pass (the sea that is seen) and for the caustic pass (the
// sea the light is bent by, in which they run at the light's slower pace: see waves.js).
const RIPPLES_GLSL = /* glsl */ `
const int RIPPLE_COUNT = ${RIPPLES.length};
// xy = wave vector (rad/m), z = angular frequency, w = slope amplitude
const vec4 RIPPLE[RIPPLE_COUNT] = vec4[RIPPLE_COUNT](
${RIPPLES.map((r) => `  vec4(${r.map(f).join(', ')})`).join(',\n')}
);
const float RIPPLE_LIGHT[RIPPLE_COUNT] = float[RIPPLE_COUNT](${RIPPLES.map((r) => f(lightOmega(r[2], r[3], Math.hypot(r[0], r[1])))).join(', ')});

vec2 rippleSlope(vec2 x, float t, bool light) {
  // Wind does not ruffle a sea evenly: it comes in drifting patches (cat's paws).
  float gust = smoothstep(0.30, 0.72, vnoise(x * 0.6 + vec2(t * 0.13, -t * 0.08)));
  vec2 s = vec2(0.0);
  for (int i = 0; i < RIPPLE_COUNT; i++) {
    vec4 w = RIPPLE[i];
    // A slow phase warp bends the crests so the trains never read as a ruled grating.
    float warp = 1.4 * sin(dot(x, w.yx) * 0.11 + t * 0.4 + float(i) * 1.9);
    s += normalize(w.xy) * w.w * cos(dot(w.xy, x) - (light ? RIPPLE_LIGHT[i] : w.z) * t + warp + float(i) * 2.4);
  }
  return s * (0.3 + 0.7 * gust);
}
`;

const FIELD_FRAG = /* glsl */ `
${VERT_PRELUDE}
${WAVES_GLSL}
${RIPPLES_GLSL}
uniform sampler2D tPrev;
uniform vec3 uFieldDomain;     // xy = centre in local xz, z = 1 / size
uniform float uNow;
uniform float uStep;
varying vec2 vUv;

void main() {
  vec2 x = uFieldDomain.xy + (vUv - 0.5) / uFieldDomain.z;
  float fold;
  vec3 sea = waveSurface(x, uNow, false, fold);
  float h = sea.x;
  vec2 slope = sea.yz + rippleSlope(x, uNow, false);

  // Foam is born in two places. Out on the open surface, where the crests of several trains
  // pile up until the water folds over: a short whitecap riding the crest line. And against
  // the wall, where a crest runs up it and collapses: a fringe that hugs the lee side. A
  // drifting noise keeps both from being drawn with a ruler.
  float r = length(x);
  float rough = vnoise(x * 3.3 + vec2(uNow * 0.31, uNow * 0.07)) * 0.55 + vnoise(x * 8.3 - vec2(uNow * 0.11, uNow * 0.43)) * 0.45;
  float breaking = smoothstep(1.24, 1.56, fold + (rough - 0.5) * 1.1) * smoothstep(0.02, 0.12, h);
  float lee = max(x.x / max(r, 1e-3), 0.0);
  float atWall = smoothstep(${f(RADIUS)} - 0.42, ${f(RADIUS)} - 0.03, r + (rough - 0.5) * 0.22);
  float slap = atWall * (0.22 + 0.78 * lee) * smoothstep(0.10, 0.30, h + (rough - 0.5) * 0.14);
  float born = max(breaking, slap * 0.92);

  vec2 px = vec2(1.0 / ${f(FIELD_SIZE)});
  float prev = texture2D(tPrev, vUv).a;
  float around = (texture2D(tPrev, vUv + vec2(px.x, 0.0)).a + texture2D(tPrev, vUv - vec2(px.x, 0.0)).a
                + texture2D(tPrev, vUv + vec2(0.0, px.y)).a + texture2D(tPrev, vUv - vec2(0.0, px.y)).a) * 0.25;
  // White water collapses in a fraction of a second; the lace it leaves behind lingers
  // and is slowly pulled apart.
  float foam = mix(prev, around, 0.22);
  foam = foam * exp(-uStep / mix(2.9, 0.30, smoothstep(0.30, 0.85, foam))) - uStep * 0.012;
  foam = clamp(max(foam, born), 0.0, 1.0);

  gl_FragColor = vec4(h, slope, foam);
}
`;

const CAUSTIC_VERT = /* glsl */ `
${VERT_PRELUDE}
${WAVES_GLSL}
${RIPPLES_GLSL}
uniform sampler2D tField;
uniform vec3 uFieldDomain;
uniform vec3 uCausticDomain;   // xy = centre in local xz, z = 1 / size
uniform vec3 uSource;          // xy = centre, z = half-size of the patch of sea that feeds the map
uniform vec3 uLightAir;        // unit direction the moonlight travels before it meets the water
uniform float uNow;
varying vec2 vFrom;
varying vec2 vTo;
varying float vGain;
void main() {
  // Each vertex is a ray of moonlight meeting the sea at s. Bend it through the local
  // surface and carry it down to the bed plane. The surface is worked out here, not read
  // from the field: it is the sea at the light's own pace (see waves.js), which the field,
  // the sea as it is seen, does not hold.
  vec2 s = uSource.xy + position.xy * uSource.z;
  float fold;
  vec3 sea = waveSurface(s, uNow, true, fold);
  vec2 slope = sea.yz + rippleSlope(s, uNow, true);
  vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
  vec3 l = refract(uLightAir, n, 1.0 / ${f(IOR)});
  float fall = (${f(LEVEL)} + sea.x - ${f(CAUSTIC_PLANE)}) / max(-l.y, 0.3);
  vec2 hit = s + l.xz * fall;
  vFrom = s;
  vTo = hit;
  // Foam lies where the eye finds it. It is opaque: it throws shadows down the column.
  float foam = textureLod(tField, (s - uFieldDomain.xy) * uFieldDomain.z + 0.5, 0.0).a;
  vGain = 1.0 - 0.85 * clamp(foam, 0.0, 1.0);
  gl_Position = vec4((hit - uCausticDomain.xy) * uCausticDomain.z * 2.0, 0.0, 1.0);
}
`;

const CAUSTIC_FRAG = /* glsl */ `
varying vec2 vFrom;
varying vec2 vTo;
varying float vGain;
void main() {
  // Brightness = how much sea surface was squeezed into this patch of the bed: the ratio
  // of the areas a triangle of the mesh covers before and after refraction. Where the
  // sheet folds over itself the pieces simply add up (additive blending).
  vec2 ax = dFdx(vFrom), ay = dFdy(vFrom);
  vec2 bx = dFdx(vTo), by = dFdy(vTo);
  float before = abs(ax.x * ay.y - ax.y * ay.x);
  float after = abs(bx.x * by.y - bx.y * by.x);
  gl_FragColor = vec4(vec3(min(before / max(after, 1e-9), 12.0) * vGain), 1.0);
}
`;

// A tiling picture of foam, baked once: what a patch of sea foam looks like from above.
//   r  lace     the walls between bubbles, at three sizes (1 on a wall, 0 in open water)
//   g  heap     domes of bubbles, for the relief of thick foam
//   b  breakup  soft noise that decides where thin foam holds together and where it tears
//   a  specks   single bubbles adrift
const FOAM_SIZE = 512;
const FOAM_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float sq1(float x) { x = clamp(x, 0.0, 1.0); return x * x; }
// Nearest and second-nearest feature point of a jittered grid that repeats every 'period' cells.
vec2 cells(vec2 p, float period) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y));
    vec2 r = o + hash22(mod(i + o, period) + period * 1.37) - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(vec2(d1, d2));
}
float vnoise(vec2 p, float period) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(mod(i, period) + 7.1), b = hash12(mod(i + vec2(1.0, 0.0), period) + 7.1);
  float c = hash12(mod(i + vec2(0.0, 1.0), period) + 7.1), d = hash12(mod(i + vec2(1.0, 1.0), period) + 7.1);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
vec4 foam(vec2 uv) {
  // A gentle periodic warp, so the cells are not all the same shape.
  vec2 w = uv + 0.014 * vec2(sin(6.2831853 * (uv.y * 3.0 + 0.2)), sin(6.2831853 * (uv.x * 2.0 + 0.7)))
              + 0.006 * vec2(sin(6.2831853 * (uv.y * 7.0 + 0.5)), sin(6.2831853 * (uv.x * 8.0 + 0.1)));
  float breakup = vnoise(w * 4.0, 4.0) * 0.5 + vnoise(w * 9.0, 9.0) * 0.3 + vnoise(w * 19.0, 19.0) * 0.2;
  // Lace: how close this point is to a wall between two bubbles, as a ramp that runs from
  // 1 on the wall to 0 in the middle of the cell. Thresholding it high leaves thin strands,
  // thresholding it low leaves a white sheet with holes: the same foam, older or younger.
  // Three sizes of cell; the small ones web over the holes of the large.
  vec2 c1 = cells(w * 6.0, 6.0), c2 = cells(w * 13.0 + 1.7, 13.0), c3 = cells(w * 29.0 + 4.1, 29.0);
  float l1 = 1.0 - clamp((c1.y - c1.x) / 0.62, 0.0, 1.0);
  float l2 = 1.0 - clamp((c2.y - c2.x) / 0.62, 0.0, 1.0);
  float l3 = 1.0 - clamp((c3.y - c3.x) / 0.62, 0.0, 1.0);
  float lace = max(l1, max(l2 * 0.84, l3 * 0.66));
  // The walls are froth themselves: grainy, never a clean line.
  vec2 b1 = cells(w * 37.0, 37.0), b2 = cells(w * 83.0, 83.0);
  float heap = 0.6 * sq1(1.0 - b1.x) + 0.4 * sq1(1.0 - b2.x);
  lace = clamp(lace + (heap - 0.42) * 0.22, 0.0, 1.0);
  vec2 s = cells(w * 47.0 + 3.3, 47.0);
  float specks = (1.0 - smoothstep(0.10, 0.24, s.x)) * step(0.5, hash12(floor(w * 47.0 + 3.3) + 2.0));
  return vec4(lace, heap, breakup, specks);
}
void main() {
  // Four samples per texel: the walls are thin.
  vec2 e = vec2(0.25 / ${f(FOAM_SIZE)});
  gl_FragColor = (foam(vUv + vec2(-e.x, -e.y * 0.33)) + foam(vUv + vec2(e.x, e.y * 0.33))
                + foam(vUv + vec2(-e.x * 0.33, e.y)) + foam(vUv + vec2(e.x * 0.33, -e.y))) * 0.25;
}
`;

/** Bake the foam picture. Leaves the renderer's target as it found it. */
export function createFoamTexture(renderer) {
  const target = new THREE.WebGLRenderTarget(FOAM_SIZE, FOAM_SIZE, {
    type: THREE.UnsignedByteType, format: THREE.RGBAFormat, depthBuffer: false,
    wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping,
    magFilter: THREE.LinearFilter, minFilter: THREE.LinearMipmapLinearFilter, generateMipmaps: true,
  });
  target.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const triangle = new THREE.BufferGeometry();
  triangle.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  triangle.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const material = new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: FOAM_FRAG, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(triangle, material);
  mesh.frustumCulled = false;
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(mesh, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
  renderer.setRenderTarget(previous);
  triangle.dispose();
  material.dispose();
  return target;
}

export class WaveField {
  constructor(renderer) {
    this.renderer = renderer;

    const fieldOptions = {
      type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false,
      magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
    };
    this.fieldA = new THREE.WebGLRenderTarget(FIELD_SIZE, FIELD_SIZE, fieldOptions);
    this.fieldB = new THREE.WebGLRenderTarget(FIELD_SIZE, FIELD_SIZE, fieldOptions);
    // One channel is all the caustic map holds, and it is read a dozen times per pixel of
    // the column: a quarter of the memory traffic of an RGBA target.
    this.causticTarget = new THREE.WebGLRenderTarget(CAUSTIC_SIZE, CAUSTIC_SIZE, {
      ...fieldOptions, format: THREE.RedFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter,
    });
    this.causticTarget.texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());   // see inscatter() in waterShader.js
    this.foamTarget = createFoamTexture(renderer);

    /** Uniform objects to spread into any material that reads the two maps. */
    this.uniforms = {
      tField: { value: this.fieldA.texture },
      tCaustic: { value: this.causticTarget.texture },
      tFoam: { value: this.foamTarget.texture },
      uFieldDomain: { value: new THREE.Vector3(0, 0, 1 / 8) },
      uCausticDomain: { value: new THREE.Vector3(0, 0, 1 / 8) },
      uLightDir: { value: new THREE.Vector3(0, -1, 0) },   // moonlight under water (refracted at a flat sea)
    };

    const triangle = new THREE.BufferGeometry();
    triangle.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    triangle.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.fieldUniforms = {
      ...shared,
      tPrev: { value: null },
      uFieldDomain: this.uniforms.uFieldDomain,
      uNow: { value: 0 },
      uStep: { value: 1 / 60 },
    };
    this.fieldMesh = new THREE.Mesh(triangle, new THREE.ShaderMaterial({
      vertexShader: FS_VERT, fragmentShader: FIELD_FRAG, uniforms: this.fieldUniforms,
      depthTest: false, depthWrite: false,
    }));
    this.fieldMesh.frustumCulled = false;

    this.causticUniforms = {
      ...shared,
      tField: this.uniforms.tField,
      uFieldDomain: this.uniforms.uFieldDomain,
      uCausticDomain: this.uniforms.uCausticDomain,
      uSource: { value: new THREE.Vector3(0, 0, 4) },
      uLightAir: { value: new THREE.Vector3(0, -1, 0) },
      uNow: this.fieldUniforms.uNow,
    };
    this.causticSheet = new THREE.PlaneGeometry(2, 2, CAUSTIC_GRID, CAUSTIC_GRID);
    this.causticSheetFar = new THREE.PlaneGeometry(2, 2, CAUSTIC_GRID_FAR, CAUSTIC_GRID_FAR);
    this.causticMesh = new THREE.Mesh(
      this.causticSheet,
      new THREE.ShaderMaterial({
        vertexShader: CAUSTIC_VERT, fragmentShader: CAUSTIC_FRAG, uniforms: this.causticUniforms,
        side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      }),
    );
    this.causticMesh.frustumCulled = false;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.owed = 0;            // seconds the foam has not yet been aged by
    this.turn = false;
    this.setLight(shared.uMoonDir.value);
  }

  /**
   * Lay out the two maps for a light arriving from `toward` (unit vector, world space).
   * Under water every ray leans the same way, so the patch of bed the column can see is
   * a stadium stretched down-light, and the sea that feeds it lies up-light of the column.
   */
  setLight(toward) {
    const hx = -toward.x / IOR;
    const hz = -toward.z / IOR;
    const hl = Math.max(Math.hypot(hx, hz), 1e-5);
    const ly = -Math.sqrt(Math.max(1 - hl * hl, 0.05));
    this.uniforms.uLightDir.value.set(hx, ly, hz).normalize();
    this.causticUniforms.uLightAir.value.set(-toward.x, -toward.y, -toward.z);

    const lean = hl / -ly;                       // horizontal drift per metre of depth
    const dx = hx / hl;
    const dz = hz / hl;
    const reach = (LEVEL + 0.3 - CAUSTIC_PLANE) * lean;       // drift of a ray entering at a crest
    const mean = (LEVEL - CAUSTIC_PLANE) * lean;              // drift of a ray entering at mean level
    const half = RADIUS + 0.12 + 0.5 * reach * Math.max(Math.abs(dx), Math.abs(dz));
    this.uniforms.uCausticDomain.value.set(dx * reach * 0.5, dz * reach * 0.5, 1 / (2 * half));
    const sx = dx * (reach * 0.5 - mean);
    const sz = dz * (reach * 0.5 - mean);
    const sourceHalf = half + 0.45;                           // room for rays bent sideways by steep waves
    this.causticUniforms.uSource.value.set(sx, sz, sourceHalf);
    // The field has to hold that patch of sea and the column itself.
    const minX = Math.min(sx - sourceHalf, -RADIUS - 0.15), maxX = Math.max(sx + sourceHalf, RADIUS + 0.15);
    const minZ = Math.min(sz - sourceHalf, -RADIUS - 0.15), maxZ = Math.max(sz + sourceHalf, RADIUS + 0.15);
    const size = Math.max(maxX - minX, maxZ - minZ);
    this.uniforms.uFieldDomain.value.set((minX + maxX) * 0.5, (minZ + maxZ) * 0.5, 1 / size);
  }

  /**
   * Advance the sea to `time`. Leaves the renderer's target and autoClear as it found them.
   *
   * far: the column is small in the picture. Nothing in it then moves a pixel in a thirtieth
   * of a second, so the two maps take turns, one a frame, and the caustics are cast through
   * a coarser sheet. idle: nobody can see the column or its image; nothing is drawn at all.
   */
  update(dt, time, far = false, idle = false) {
    this.owed = Math.min(this.owed + dt, 0.1);
    if (idle) return;
    this.turn = !this.turn;
    const renderer = this.renderer;
    const previousTarget = renderer.getRenderTarget();
    const previousAutoClear = renderer.autoClear;
    renderer.autoClear = false;

    this.fieldUniforms.uNow.value = time;        // both passes read it
    if (!far || this.turn) {
      this.fieldUniforms.tPrev.value = this.fieldA.texture;
      this.fieldUniforms.uStep.value = this.owed;
      this.owed = 0;
      renderer.setRenderTarget(this.fieldB);
      renderer.render(this.fieldMesh, this.camera);
      const swap = this.fieldA; this.fieldA = this.fieldB; this.fieldB = swap;
      this.uniforms.tField.value = this.fieldA.texture;
    }
    if (!far || !this.turn) {
      this.causticMesh.geometry = far ? this.causticSheetFar : this.causticSheet;
      renderer.setRenderTarget(this.causticTarget);
      renderer.clear(true, false, false);
      renderer.render(this.causticMesh, this.camera);
    }

    renderer.setRenderTarget(previousTarget);
    renderer.autoClear = previousAutoClear;
  }

  dispose() {
    this.fieldA.dispose();
    this.fieldB.dispose();
    this.causticTarget.dispose();
    this.foamTarget.dispose();
    this.fieldMesh.geometry.dispose();
    this.fieldMesh.material.dispose();
    this.causticSheet.dispose();
    this.causticSheetFar.dispose();
    this.causticMesh.material.dispose();
  }
}
