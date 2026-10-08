import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { NOISE_GLSL } from '../shared/glsl.js';
import { createRandom, range } from '../shared/random.js';

/**
 * Water: open ocean at golden hour.
 *
 * - Sky: the Preetham sky addon with its built-in clouds, baked once into a
 *   PMREM environment map (with the lower hemisphere shaded deep blue to stand
 *   in for the sea seen in reflection).
 * - Sea: one dense, radially stretched grid. The vertex shader displaces it
 *   with the long Gerstner swells; the fragment shader rebuilds the normal per
 *   pixel from the full spectrum (swells + short wind waves), so detail does not
 *   depend on mesh density. Waves too small for a pixel fade out; half of the
 *   slope variance they carried widens the specular lobe and the other half is
 *   drawn as discrete sun glints, so the far sun path sparkles without aliasing.
 * - Foam comes from where the waves fold (Jacobian of the Gerstner
 *   displacement of everything longer than ~2 m), broken up with noise. The
 *   same Jacobian evaluated a moment earlier leaves fading lace behind each cap.
 * - Body colour is skylight scattered back out of the water, plus a turquoise
 *   glow through backlit crests. Distant water fades into the sky's own horizon
 *   colour, read back from the environment map.
 */

const TAU = Math.PI * 2;
const GRAVITY = 9.81;

// --- sun and sky ------------------------------------------------------------

const SUN_ELEVATION_DEG = 4.5;
const SUN_AZIMUTH_DEG = 15; // degrees to the right of the default view axis (-Z)
const SUN_SCREEN_X = 0.42; // narrow screens turn until the sun sits here (NDC), about a third in from the right
const SUN_COLOR = new THREE.Color('#ffb36b');
const SUN_INTENSITY = 0.5;
const SKY_SCALE = 450;
// The raw Preetham sky is far brighter than the bloom threshold. Scaling it
// down leaves only the sun and its glints above the threshold.
const SKY_GAIN = 0.16;
const SKY_MAX_RADIANCE = 6.0; // hue-preserving clamp: the sun disc stays gold under ACES
const EXPOSURE = 1.0;

// --- wave spectrum -----------------------------------------------------------

const WAVE_COUNT = 44;
const SWELL_COUNT = 12; // the longest waves (down to ~8 m) also displace the geometry
const FOLD_WAVE_COUNT = 21; // waves longer than ~2 m: their sharp crests make whitecaps
const LONGEST_WAVELENGTH = 48;
const SHORTEST_WAVELENGTH = 0.06;
const CROSSWIND_WAVELENGTH = 0.5; // waves this short or shorter spread fully across the wind
const SWELL_SLOPE = 0.042; // k * amplitude of the longest wave...
const RIPPLE_SLOPE = 0.026; // ...and of the shortest: a light breeze
const WIND_ANGLE = THREE.MathUtils.degToRad(80); // waves travel toward the viewer (+Z), slightly to +X
const CHOPPINESS = 2.6; // horizontal Gerstner displacement: sharp crests, flat troughs
const RIPPLE_CHOP = 0.2; // chop of the shortest wave in the shading normal (before scaling)
const NORMAL_CHOP_LIMIT = 0.9; // crest compression in the shading normal stays below this out to 4 standard deviations
const CREST_HEIGHT = 0.5; // typical crest height, used to normalise the scattering glow
const FOAM_LAGS = [0.5, 1.0]; // seconds: how far back the foam remembers folding crests

// --- sea mesh ----------------------------------------------------------------

const SEA_SEGMENTS = 640;
const SEA_RADIUS = 700; // half-width; must stay inside the camera far plane
const SEA_CENTRE_SPACING = 0.09; // grid cell size at the centre; cells grow with distance

// --- water look --------------------------------------------------------------

const SURFACE_COLOR = new THREE.Color('#02090d'); // lit albedo: water itself reflects almost no diffuse light
const BODY_COLOR = new THREE.Color('#1a6a7c'); // skylight scattered back up out of the deep
const SCATTER_COLOR = new THREE.Color('#1b8fa6');
const FOAM_COLOR = new THREE.Color('#d9dcd6');
const REFLECTED_SEA_COLOR = new THREE.Color('#163240'); // the sea itself, as seen in the reflection of a tilted wave
const BASE_ROUGHNESS = 0.07;
const MAX_ROUGHNESS = 0.2;
const HAZE_START = 60;
const HAZE_DENSITY = 0.0035;
const MAX_RADIANCE = 16.0;
const SUN_LOBE_CEILING = 0.9; // the smooth sun reflection rolls off toward this; only glints reach MAX_RADIANCE

// --- sun glints --------------------------------------------------------------

const GLINT_CELL = 2.0; // facet cell size, in pixels across
const GLINT_OCCUPANCY = 0.5; // share of cells that hold a facet
const GLINT_SHARPNESS = 2000.0; // specular exponent of one facet
const GLINT_INTENSITY = 40.0;
const GLINT_BASE_VARIANCE = 0.004; // capillary slope variance always present, even where every wave is resolved

/** @param {import('./index.js').ElementContext} ctx @returns {import('./index.js').ElementScene} */
export function createWater(ctx) {
  const root = new THREE.Group();

  const sunDirection = new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - SUN_ELEVATION_DEG),
    THREE.MathUtils.degToRad(180 - SUN_AZIMUTH_DEG),
  );

  // --- sky + environment -----------------------------------------------------

  const sky = createSky();
  const skyUniforms = sky.material.uniforms;
  skyUniforms.turbidity.value = 2.5;
  skyUniforms.rayleigh.value = 2;
  skyUniforms.mieCoefficient.value = 0.0025;
  skyUniforms.mieDirectionalG.value = 0.78;
  skyUniforms.cloudCoverage.value = 0.5;
  skyUniforms.cloudDensity.value = 0.7;
  skyUniforms.cloudElevation.value = 0.6;
  skyUniforms.cloudSpeed.value = 0.00004;
  skyUniforms.sunPosition.value.copy(sunDirection);

  const environmentTarget = bakeEnvironment(ctx.pmrem, sky);
  const environment = environmentTarget.texture;
  root.add(sky);

  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
  sun.position.copy(sunDirection).multiplyScalar(100);
  root.add(sun);

  // --- sea -------------------------------------------------------------------

  const waves = buildWaveSpectrum();
  const seaUniforms = {
    uTime: { value: 0 },
    uChop: { value: CHOPPINESS },
    uWaveShape: { value: waves.map((w) => new THREE.Vector4(w.dirX, w.dirZ, w.k, w.amplitude)) },
    uWaveMotion: { value: waves.map((w) => new THREE.Vector4(w.omega, w.phase, w.normalChop, w.tailVariance)) },
    uWaveLag: {
      value: waves.slice(0, FOLD_WAVE_COUNT).map((w) => {
        const [a, b] = FOAM_LAGS.map((lag) => w.omega * lag);
        return new THREE.Vector4(Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b));
      }),
    },
    uGridSpacing: { value: new THREE.Vector2() },
    uWind: { value: new THREE.Vector2(Math.cos(WIND_ANGLE), Math.sin(WIND_ANGLE)) },
    uSunDirection: { value: sunDirection.clone() },
    uSunColor: { value: SUN_COLOR.clone() },
    uBodyColor: { value: BODY_COLOR.clone() },
    uScatterColor: { value: SCATTER_COLOR.clone() },
    uFoamColor: { value: FOAM_COLOR.clone() },
    uCrestHeight: { value: CREST_HEIGHT },
    uHaze: { value: new THREE.Vector2(HAZE_START, HAZE_DENSITY) },
  };

  const seaGeometry = createSeaGeometry(seaUniforms.uGridSpacing.value);
  const seaMaterial = new THREE.MeshPhysicalMaterial({
    color: SURFACE_COLOR,
    roughness: BASE_ROUGHNESS,
    metalness: 0,
    ior: 1.333,
    envMap: environment,
  });
  seaMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, seaUniforms);
    shader.vertexShader = injectSeaVertex(shader.vertexShader);
    shader.fragmentShader = injectSeaFragment(shader.fragmentShader);
  };

  const sea = new THREE.Mesh(seaGeometry, seaMaterial);
  sea.frustumCulled = false; // displaced in the shader; always fills the lower frame anyway
  root.add(sea);

  // --- framing ---------------------------------------------------------------

  // Wide screens see the sun about a third in from the right, clear of the nav.
  // Narrow ones turn toward it only until it reaches the same spot, and look
  // down more so dark water frames the glare.
  const aspect = ctx.camera.aspect;
  const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(ctx.camera.fov / 2));
  const sunOffset = Math.atan(SUN_SCREEN_X * tanHalfFov * aspect);
  const turn = Math.max(0, THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG) - sunOffset);
  const portrait = 1 - THREE.MathUtils.smoothstep(aspect, 0.6, 1.0);

  return {
    root,
    update(time) {
      seaUniforms.uTime.value = time;
      skyUniforms.time.value = time;
    },
    dispose() {
      seaGeometry.dispose();
      seaMaterial.dispose();
      sky.geometry.dispose();
      sky.material.dispose();
      environmentTarget.dispose();
    },
    camera: {
      position: new THREE.Vector3(0, THREE.MathUtils.lerp(2.2, 3.0, portrait), 10),
      target: new THREE.Vector3(16 * Math.tan(turn), THREE.MathUtils.lerp(0.8, 0.2, portrait), -6),
    },
    look: {
      background: null,
      environment,
      fog: null,
      exposure: EXPOSURE,
      bloom: { strength: THREE.MathUtils.lerp(0.35, 0.22, portrait), radius: 0.5, threshold: 0.9 },
    },
    controls: {
      minDistance: 8,
      maxDistance: 40,
      minPolarAngle: 0.7,
      maxPolarAngle: 1.48,
    },
  };
}

// --- sky ---------------------------------------------------------------------------

/**
 * The sky addon with its output scaled by SKY_GAIN, graded and clamped. The
 * grade keeps it clean blue overhead and warm toward the horizon (raw Preetham
 * drifts green at a low sun), and lifts the side facing away from the sun into
 * a rosy anti-twilight band under a cool blue (raw, it goes nearly black, and
 * auto-orbit faces it half the time).
 */
function createSky() {
  const sky = new Sky();
  sky.scale.setScalar(SKY_SCALE);
  const output = 'gl_FragColor = vec4( texColor, 1.0 );';
  if (!sky.material.fragmentShader.includes(output)) throw new Error('water: unexpected Sky shader');
  sky.material.fragmentShader = sky.material.fragmentShader.replace(
    output,
    /* glsl */ `
      vec3 skyColor = texColor * ${SKY_GAIN.toFixed(3)};
      skyColor *= mix( vec3( 1.08, 0.97, 0.86 ), vec3( 0.72, 0.88, 1.3 ), smoothstep( 0.0, 0.45, direction.y ) );
      float awayFromSun = 1.0 - smoothstep( -0.6, 0.3, cosTheta );
      skyColor *= 1.0 + awayFromSun * 2.2 * mix( vec3( 1.3, 0.78, 1.05 ), vec3( 0.5, 0.66, 1.1 ), smoothstep( 0.0, 0.25, direction.y ) );
      float skyLuminance = dot( skyColor, vec3( 0.2126, 0.7152, 0.0722 ) );
      skyColor *= pow( clamp( skyLuminance, 1e-4, 1.0 ), -0.25 ); // L^0.75 below 1: softer falloff away from the sun
      float skyPeak = max( max( skyColor.r, skyColor.g ), skyColor.b );
      skyColor *= min( 1.0, ${SKY_MAX_RADIANCE.toFixed(1)} / max( skyPeak, 1e-4 ) );
      gl_FragColor = vec4( max( skyColor, vec3( 0.0 ) ), 1.0 );`,
  );
  return sky;
}

// --- environment bake ----------------------------------------------------------

/**
 * Renders the sky (without its sun disc, which the directional light replaces)
 * into a PMREM map. A deep-blue lower hemisphere stands in for the sea itself,
 * so wave faces tilted away from the viewer reflect water, not more horizon.
 * It fades in gently below the horizon so those reflections read as depth.
 */
function bakeEnvironment(pmrem, sky) {
  const seaShade = new THREE.Mesh(
    new THREE.SphereGeometry(100, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: { uColor: { value: REFLECTED_SEA_COLOR.clone() } },
      vertexShader: /* glsl */ `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying vec3 vDirection;
        void main() {
          float below = 1.0 - smoothstep(-0.4, 0.02, vDirection.y);
          gl_FragColor = vec4(uColor, below * 0.75);
        }`,
    }),
  );

  const envScene = new THREE.Scene();
  envScene.add(sky, seaShade);
  sky.material.uniforms.showSunDisc.value = 0;
  const target = pmrem.fromScene(envScene, 0, 0.1, 1000);
  sky.material.uniforms.showSunDisc.value = 1;
  envScene.remove(sky);

  seaShade.geometry.dispose();
  seaShade.material.dispose();
  return target;
}

// --- wave spectrum --------------------------------------------------------------

/**
 * Directional components on a jittered geometric ladder of wavelengths, longest
 * first. Long swells stay near the wind direction; waves under a few metres
 * spread wide, so crosswind ones survive foreshortening and streak the glitter
 * vertically. Every wave has a similar slope (k * amplitude), like a real wind
 * sea, and enough of them that their sum reads as noise, not a lattice.
 *
 * Each wave also gets the chop it applies to the shading normal: most on the
 * swells, light on the ripples, all scaled so the crest compression almost
 * never tips a normal toward horizontal (the foam still uses the full CHOPPINESS).
 * And each carries the slope variance of itself plus every shorter wave, so the
 * shader can stop once the rest are too small for the pixel.
 */
function buildWaveSpectrum() {
  const random = createRandom(7);
  const waves = [];
  for (let i = 0; i < WAVE_COUNT; i++) {
    const t = THREE.MathUtils.clamp((i + range(random, -0.45, 0.45)) / (WAVE_COUNT - 1), 0, 1);
    const wavelength = LONGEST_WAVELENGTH * (SHORTEST_WAVELENGTH / LONGEST_WAVELENGTH) ** t;
    const k = TAU / wavelength;
    const shortness = THREE.MathUtils.clamp(
      Math.log(LONGEST_WAVELENGTH / wavelength) / Math.log(LONGEST_WAVELENGTH / CROSSWIND_WAVELENGTH),
      0,
      1,
    );
    const spread = THREE.MathUtils.lerp(0.7, 2.0, shortness);
    const angle = WIND_ANGLE + range(random, -spread, spread);
    const slope = THREE.MathUtils.lerp(SWELL_SLOPE, RIPPLE_SLOPE, t) * range(random, 0.75, 1.2);
    const ripple = Math.max(0, i - SWELL_COUNT + 1) / (WAVE_COUNT - SWELL_COUNT);
    waves.push({
      dirX: Math.cos(angle),
      dirZ: Math.sin(angle),
      k,
      amplitude: slope / k,
      omega: Math.sqrt(GRAVITY * k), // deep-water dispersion
      phase: random() * TAU,
      normalChop: CHOPPINESS * (RIPPLE_CHOP / CHOPPINESS) ** ripple,
    });
  }
  const variance = waves.reduce((sum, w) => sum + (w.normalChop * w.k * w.amplitude) ** 2 / 2, 0);
  const scale = Math.min(1, NORMAL_CHOP_LIMIT / (4 * Math.sqrt(variance)));
  let tail = 0;
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.normalChop *= scale;
    tail += (w.k * w.amplitude) ** 2 / 2;
    w.tailVariance = tail;
  }
  return waves;
}

// --- sea geometry ------------------------------------------------------------------

/**
 * A flat grid whose cells grow exponentially from the centre: SEA_CENTRE_SPACING
 * wide in the middle, SEA_RADIUS at the edge. Cell size at distance d is
 * spacing.x * (d + spacing.y), which the vertex shader uses to fade out waves
 * the grid can no longer resolve.
 *
 * @param {THREE.Vector2} spacingOut receives the cell-size coefficients
 */
function createSeaGeometry(spacingOut) {
  const halfSegments = SEA_SEGMENTS / 2;
  const growth = solveGrowth(SEA_RADIUS / (SEA_CENTRE_SPACING * halfSegments));
  const offset = (SEA_CENTRE_SPACING * halfSegments) / growth;
  const stretch = (u) => Math.sign(u) * offset * (Math.exp(growth * Math.abs(u)) - 1);

  const geometry = new THREE.PlaneGeometry(2, 2, SEA_SEGMENTS, SEA_SEGMENTS);
  geometry.rotateX(-Math.PI / 2);
  geometry.deleteAttribute('uv'); // the normal stays: without it three switches to flat shading
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    position.setX(i, stretch(position.getX(i)));
    position.setZ(i, stretch(position.getZ(i)));
  }
  geometry.computeBoundingSphere();

  spacingOut.set(growth / halfSegments, offset);
  return geometry;
}

/** Solves (e^c - 1) / c = ratio for c by bisection. */
function solveGrowth(ratio) {
  let low = 1e-3;
  let high = 20;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if ((Math.exp(mid) - 1) / mid < ratio) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// --- shader injection -----------------------------------------------------------------

const SHARED_PARS = /* glsl */ `
#define WAVE_COUNT ${WAVE_COUNT}
#define SWELL_COUNT ${SWELL_COUNT}
#define FOLD_WAVE_COUNT ${FOLD_WAVE_COUNT}
#define SEA_TAU 6.28318530718
uniform float uTime;
uniform float uChop;
uniform vec4 uWaveShape[WAVE_COUNT];  // xy: direction, z: wavenumber, w: amplitude
uniform vec4 uWaveMotion[WAVE_COUNT]; // x: angular frequency, y: phase offset, z: chop in the shading normal,
                                      // w: slope variance of this wave and every shorter one
varying vec2 vSeaRest;  // undisplaced horizontal position: the label every wave is evaluated at
varying vec3 vSeaWorld; // displaced world position
`;

function injectSeaVertex(source) {
  const pars = /* glsl */ `
${SHARED_PARS}
uniform vec2 uGridSpacing;
`;

  // The sea mesh sits at the origin unrotated, so object space is world space.
  const displace = /* glsl */ `
vec3 seaOffset = vec3(0.0);
vec3 seaNormalSum = vec3(0.0, 1.0, 0.0);
float seaCell = uGridSpacing.x * (max(abs(position.x), abs(position.z)) + uGridSpacing.y);
for (int i = 0; i < SWELL_COUNT; i++) {
  vec4 wave = uWaveShape[i];
  vec4 motion = uWaveMotion[i];
  float resolved = smoothstep(4.0, 8.0, SEA_TAU / (wave.z * seaCell));
  float amplitude = wave.w * resolved;
  float theta = wave.z * dot(wave.xy, position.xz) - motion.x * uTime + motion.y;
  float s = sin(theta);
  float c = cos(theta);
  seaOffset.xz += wave.xy * (uChop * amplitude * c);
  seaOffset.y += amplitude * s;
  float slope = wave.z * amplitude;
  seaNormalSum.xz -= wave.xy * (slope * c);
  seaNormalSum.y -= motion.z * slope * s;
}
vec3 objectNormal = normalize(vec3(seaNormalSum.x, max(seaNormalSum.y, 0.3), seaNormalSum.z));
`;

  const begin = /* glsl */ `
vec3 transformed = position + seaOffset;
vSeaRest = position.xz;
vSeaWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

  return replaceChunk(
    replaceChunk(replaceChunk(source, 'common', `#include <common>\n${pars}`), 'beginnormal_vertex', displace),
    'begin_vertex',
    begin,
  );
}

function injectSeaFragment(source) {
  const pars = /* glsl */ `
${SHARED_PARS}
uniform vec4 uWaveLag[FOLD_WAVE_COUNT]; // cos and sin of omega * lag, for both foam lags
uniform vec2 uWind;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uBodyColor;
uniform vec3 uScatterColor;
uniform vec3 uFoamColor;
uniform float uCrestHeight;
uniform vec2 uHaze; // x: distance where haze starts, y: density
${NOISE_GLSL}

#define FOAM_SCALE 0.8 // foam noise units per metre

// Foam texture: octaves of simplex noise, each fading out before its features
// shrink below a pixel. footprint is the pixel size in noise units.
float foamNoise(vec3 p, float footprint) {
  float sum = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int octave = 0; octave < 4; octave++) {
    float resolved = 1.0 - smoothstep(0.2, 0.45, footprint * frequency);
    sum += amplitude * resolved * snoise(p * frequency + float(octave) * 13.7);
    frequency *= 2.2;
    amplitude *= 0.5;
  }
  return sum;
}

// Adds one Gerstner component to the running normal. Ripples (shorter than
// ~2 m) are scaled by the gust field. Waves shorter than about eight pixels
// (measured along their own direction) fade out, and the slope variance they
// carried is returned through lostVariance.
// Returns the resolved slope times (sin, cos) of the phase, for the fold measure.
vec2 addWave(int i, vec2 p, vec2 dpdx, vec2 dpdy, float gust, inout vec3 normalSum, inout float lostVariance) {
  vec4 wave = uWaveShape[i];
  vec4 motion = uWaveMotion[i];
  float footprint = max(abs(dot(dpdx, wave.xy)), abs(dot(dpdy, wave.xy)));
  float resolved = smoothstep(4.0, 8.0, SEA_TAU / max(wave.z * footprint, 1e-5));
  float slope = wave.z * wave.w * mix(1.0, gust, smoothstep(3.0, 12.0, wave.z));
  lostVariance += (1.0 - resolved * resolved) * slope * slope * 0.5;
  slope *= resolved;
  float theta = wave.z * dot(wave.xy, p) - motion.x * uTime + motion.y;
  vec2 phase = slope * vec2(sin(theta), cos(theta));
  normalSum.xz -= wave.xy * phase.y;
  normalSum.y -= motion.z * phase.x;
  return phase;
}

// 1 - Jacobian of the horizontal displacement, from the summed crest
// compression (dx*dx, dz*dz, dx*dz): near 1 the surface folds over.
float seaFoldAmount(vec3 fold) {
  return fold.x + fold.y - fold.x * fold.y + fold.z * fold.z;
}

// Four uniform randoms per cell (hash without sine).
vec4 seaHash(vec2 p) {
  vec4 p4 = fract(p.xyxy * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

// One sun-glint facet per occupied cell of size cellSize. Its slope wobbles
// within the unresolved slope spread; it flashes when it mirrors the sun into
// the camera.
float seaGlint(vec2 p, float cellSize, vec3 normal, vec3 halfway, float spread) {
  vec2 cell = floor(p / cellSize);
  vec4 r = seaHash(cell);
  float occupied = step(seaHash(cell + 17.31).x, ${GLINT_OCCUPANCY.toFixed(2)});
  vec2 wobble = spread * sin(uTime * (1.5 + 3.0 * r.xy) + SEA_TAU * r.zw);
  vec3 facet = normalize(normal + vec3(wobble.x, 0.0, wobble.y));
  return occupied * pow(max(dot(facet, halfway), 0.0), ${GLINT_SHARPNESS.toFixed(1)});
}
`;

  // Wave field, foam and body colour. Runs before lighting so it can feed albedo.
  const surface = /* glsl */ `
#include <color_fragment>
vec2 seaPoint = vSeaRest;
vec2 seaDx = dFdx(seaPoint);
vec2 seaDy = dFdy(seaPoint);
float seaFootprint = max(length(seaDx), length(seaDy));
float seaFootprintAcross = min(length(seaDx), length(seaDy));

// Wind gusts: drifting patches (cat's paws) where the ripples, not the longer
// waves, are rougher or calmer.
float seaGust = (0.8 + 0.7 * snoise(vec3(seaPoint * 0.035 - uWind * uTime * 0.12, uTime * 0.02)))
              * (0.75 + 0.4 * snoise(vec3(seaPoint * 0.15 - uWind * uTime * 0.3, uTime * 0.05 + 7.1)));

vec3 seaNormalSum = vec3(0.0, 1.0, 0.0);
float seaLostVariance = 0.0;
// Summed crest compression (dx*dx, dz*dz, dx*dz) now and at the two foam lags.
vec3 seaFoldNow = vec3(0.0);
vec3 seaFoldRecent = vec3(0.0);
vec3 seaFoldEarlier = vec3(0.0);
for (int i = 0; i < FOLD_WAVE_COUNT; i++) {
  vec2 phase = uChop * addWave(i, seaPoint, seaDx, seaDy, seaGust, seaNormalSum, seaLostVariance);
  vec2 d = uWaveShape[i].xy;
  vec3 axes = vec3(d.x * d.x, d.y * d.y, d.x * d.y);
  vec4 lag = uWaveLag[i];
  seaFoldNow += phase.x * axes;
  seaFoldRecent += (phase.x * lag.x + phase.y * lag.y) * axes;
  seaFoldEarlier += (phase.x * lag.z + phase.y * lag.w) * axes;
}
// The rest run (almost) shortest-last. Once even the narrow side of the pixel
// is too wide for this wave and its slightly longer neighbours, every one left
// is unresolved: add their slope variance in one step and stop.
for (int i = FOLD_WAVE_COUNT; i < WAVE_COUNT; i++) {
  if (uWaveShape[i].z * seaFootprintAcross > SEA_TAU * 0.41) {
    seaLostVariance += seaGust * seaGust * uWaveMotion[i].w;
    break;
  }
  addWave(i, seaPoint, seaDx, seaDy, seaGust, seaNormalSum, seaLostVariance);
}
vec3 seaNormal = normalize(vec3(seaNormalSum.x, max(seaNormalSum.y, 0.3), seaNormalSum.z));

// Whitecaps on the sharpest ~2% of crests. Where a crest folded a moment ago
// the cap fades and breaks up, and lace lingers longer still.
float seaFoldNowAmount = seaFoldAmount(seaFoldNow);
float seaCrestRecent = smoothstep(0.5, 0.68, seaFoldAmount(seaFoldRecent));
float seaCrestEarlier = smoothstep(0.5, 0.68, seaFoldAmount(seaFoldEarlier));
float seaCrest = max(smoothstep(0.5, 0.68, seaFoldNowAmount), seaCrestRecent * 0.55);
float seaWake = max(smoothstep(0.38, 0.6, seaFoldNowAmount), max(seaCrestRecent * 0.75, seaCrestEarlier * 0.5));

float seaFoam = 0.0;
if (seaWake > 0.001) {
  vec3 foamPoint = vec3(seaPoint * FOAM_SCALE - uWind * uTime * 0.2, uTime * 0.08);
  // Pixel size in noise units: between the short and the long (foreshortened) axis.
  float foamFootprint = mix(seaFootprintAcross, seaFootprint, 0.35) * FOAM_SCALE;
  float breakup = foamNoise(foamPoint, foamFootprint) * 0.5 + 0.5;
  // Lace: a web of thin lines, stretched 3:1 along the wind.
  vec2 laceWind = vec2(dot(foamPoint.xy, uWind) / 3.0, dot(foamPoint.xy, vec2(-uWind.y, uWind.x)));
  float lace = 1.0 - abs(foamNoise(vec3(laceWind, foamPoint.z) * 2.4 + 5.3, foamFootprint * 2.4));
  float laceResolved = 1.0 - smoothstep(0.2, 0.45, foamFootprint * 2.4);
  float caps = seaCrest * smoothstep(0.38, 0.85, breakup + seaCrest * 0.25);
  float streaks = seaWake * smoothstep(0.82, 0.96, lace) * smoothstep(0.3, 0.6, breakup) * laceResolved * 0.6;
  seaFoam = min(caps + streaks, 1.0) * 0.85;
}
diffuseColor.rgb = mix(diffuseColor.rgb, uFoamColor, seaFoam);
`;

  // Half the unresolved slope variance widens the specular lobe (alpha^2 adds
  // like slope variance); the glints draw the other half as discrete sparkles.
  const roughness = /* glsl */ `
#include <roughnessmap_fragment>
float seaAlpha = roughnessFactor * roughnessFactor;
roughnessFactor = min(sqrt(sqrt(seaAlpha * seaAlpha + seaLostVariance * 0.5)), ${MAX_ROUGHNESS.toFixed(2)});
roughnessFactor = mix(roughnessFactor, 0.6, seaFoam);
`;

  // The smooth sun lobe rolls off softly below a gold ceiling, so the sun path
  // reads as a warm band and only the glints flare to white.
  const specular = /* glsl */ `
#include <aomap_fragment>
vec3 seaSun = reflectedLight.directSpecular;
reflectedLight.directSpecular /= 1.0 + max(max(seaSun.r, seaSun.g), seaSun.b) / ${SUN_LOBE_CEILING.toFixed(1)};
`;

  const normal = /* glsl */ `
#include <normal_fragment_maps>
normal = normalize((viewMatrix * vec4(seaNormal, 0.0)).xyz);
nonPerturbedNormal = normal;
`;

  // Light from inside the water, weighted by how much passes the surface (1 - Fresnel):
  // skylight scattered back up out of the deep (tinted by the water, not by the
  // warm sun, and fuller away from the sun's glare), plus a fake subsurface glow
  // where the low sun shines through the thin tops of waves facing the viewer.
  // Then the foam's own scattered light and the sun glints.
  const scatter = /* glsl */ `
#include <emissivemap_fragment>
vec3 seaView = vSeaWorld - cameraPosition;
float seaDistance = length(seaView);
vec3 seaViewDir = seaView / max(seaDistance, 1e-4);
float seaCosView = clamp(dot(seaNormal, -seaViewDir), 0.0, 1.0);
float seaTransmit = 0.98 * (1.0 - pow(1.0 - seaCosView, 5.0));
#ifdef ENVMAP_TYPE_CUBE_UV
  vec3 seaSkyAbove = textureCubeUV(envMap, envMapRotation * vec3(0.0, 1.0, 0.0), 1.0).rgb * envMapIntensity;
#else
  vec3 seaSkyAbove = vec3(0.3);
#endif
vec2 seaViewFlat = seaViewDir.xz / max(length(seaViewDir.xz), 1e-4);
vec2 seaSunFlat = uSunDirection.xz / max(length(uSunDirection.xz), 1e-4);
float seaBacklight = pow(max(dot(seaViewFlat, seaSunFlat), 0.0), 3.0);
float seaHeight = smoothstep(0.0, uCrestHeight + 0.3, vSeaWorld.y);
vec3 seaSwellNormal = inverseTransformDirection(normalize(vNormal), viewMatrix); // smooth: swells only
float seaSwellFacing = clamp(dot(seaSwellNormal, -seaViewDir) * 4.0, 0.0, 1.0);
float seaGlowFade = 1.0 - smoothstep(25.0, 90.0, seaDistance); // a thin glow on far crests reads as a neon line
vec3 seaGlow = uScatterColor * uSunColor * (seaBacklight * seaHeight * seaHeight * seaSwellFacing * seaGlowFade * 0.5);
vec3 seaSkyTint = mix(vec3(dot(seaSkyAbove, vec3(0.2126, 0.7152, 0.0722))), seaSkyAbove, 0.5); // half-desaturated: the water sets the hue
vec3 seaBody = uBodyColor * seaSkyTint * (1.0 + 0.8 * (1.0 - seaBacklight));
totalEmissiveRadiance += (seaBody + seaGlow) * seaTransmit * (1.0 - seaFoam);
// Foam is bright and translucent: lit by the open sky and the warm sun, glowing where the sun is behind it.
totalEmissiveRadiance += uFoamColor * seaFoam * (seaSkyAbove * 0.25 + uSunColor * (0.25 + 0.45 * seaBacklight));

// Sun glints on cells about a pixel across, at the two nearest power-of-two
// cell sizes, blended so the grid never pops.
vec3 seaHalfway = normalize(uSunDirection - seaViewDir);
float seaSpread = sqrt(seaLostVariance + ${GLINT_BASE_VARIANCE.toFixed(4)});
float seaCellLevel = log2(max(seaFootprintAcross * ${GLINT_CELL.toFixed(2)}, 1e-4));
float seaCellSize = exp2(floor(seaCellLevel));
float seaGlints = mix(
  seaGlint(seaPoint, seaCellSize, seaNormal, seaHalfway, seaSpread),
  seaGlint(seaPoint, seaCellSize * 2.0, seaNormal, seaHalfway, seaSpread),
  fract(seaCellLevel)
);
float seaGlintFresnel = 0.02 + 0.98 * pow(1.0 - clamp(dot(seaHalfway, -seaViewDir), 0.0, 1.0), 5.0);
totalEmissiveRadiance += uSunColor * (${GLINT_INTENSITY.toFixed(1)} * seaGlints * seaGlintFresnel * (1.0 - seaFoam));
`;

  // Aerial perspective toward the sky's own horizon colour, then a hue-preserving clamp for bloom.
  const output = /* glsl */ `
#ifdef ENVMAP_TYPE_CUBE_UV
  vec3 seaHazeDir = normalize(vec3(seaViewDir.x, 0.012, seaViewDir.z));
  vec3 seaHazeColor = textureCubeUV(envMap, envMapRotation * seaHazeDir, 0.0).rgb * envMapIntensity;
  float seaHaze = 1.0 - exp(-max(seaDistance - uHaze.x, 0.0) * uHaze.y);
  outgoingLight = mix(outgoingLight, seaHazeColor, seaHaze);
#endif
outgoingLight = max(outgoingLight, vec3(0.0));
float seaPeak = max(max(outgoingLight.r, outgoingLight.g), outgoingLight.b);
outgoingLight *= min(1.0, ${MAX_RADIANCE.toFixed(1)} / max(seaPeak, 1e-4));
#include <opaque_fragment>
`;

  let result = replaceChunk(source, 'common', `#include <common>\n${pars}`);
  result = replaceChunk(result, 'color_fragment', surface);
  result = replaceChunk(result, 'roughnessmap_fragment', roughness);
  result = replaceChunk(result, 'normal_fragment_maps', normal);
  result = replaceChunk(result, 'emissivemap_fragment', scatter);
  result = replaceChunk(result, 'aomap_fragment', specular);
  result = replaceChunk(result, 'opaque_fragment', output);
  return result;
}

function replaceChunk(source, chunk, replacement) {
  const include = `#include <${chunk}>`;
  if (!source.includes(include)) throw new Error(`water: shader chunk <${chunk}> not found`);
  return source.replace(include, replacement);
}
