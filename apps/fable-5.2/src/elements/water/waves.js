// The sea state of the column: one small spectrum of wave trains, written once and used
// in three places that have to agree — the GPU wave-field pass (wavefield.js), the spray
// vertex shader (spray.js) and the CPU, which needs the height at the rim to decide where
// water spills over (index.js).

export const RADIUS = 2.5;      // m, radius of the column
export const LEVEL = 3.4;       // m, mean sea level above the film
export const MAX_SWELL = 0.6;   // m, hard bound on |surface - LEVEL|; the proxy mesh and the ray marches rely on it
export const IOR = 1.333;       // refractive index of water

// How much of a wave train bounces back off the invisible wall, and how far the echo reaches.
export const REFLECT = 0.55;
export const REFLECT_REACH = 0.9;

const GRAVITY = 9.81;
// Real deep-water waves this short move fast enough to make the column read as a bucket.
// Slowing time a little gives the swell the weight of a much larger sea.
const TIME_SCALE = 0.8;
const DEG = Math.PI / 180;

// The light on the bed keeps a clock of its own. A wave train of slope s and wavenumber k
// is a row of lenses: by the time the moonlight reaches the bed it has thrown it sideways
// by up to s LIGHT_THROW, and a strength s k LIGHT_THROW near 1 means it focuses there. The
// net of caustics is what all the trains do together, and each of them pulls that net out
// of shape at the rate strength x frequency. At their true pace the short trains (five to
// seventeen radians a second) do it twice over in a tenth of a second: a flicker in which
// no line of light can be followed, under a swell that takes two seconds to pass. So the
// sea the light comes down through is this same sea with every train held to LIGHT_RATE:
// the long swell is far below it and keeps its pace (its bands of light and shade stay in
// step with the crests overhead, and sway the net as they pass), the shorter a train the
// more it is slowed. Same waves, same heights: a still of the bed looks as it did, and
// its light now moves with the weight of the swell above it.
const LIGHT_THROW = (1 - 1 / IOR) * LEVEL;      // m per unit of slope
const LIGHT_RATE = 0.8;                         // 1/s
/** Angular frequency at which the light on the bed sees a wave train (true frequency, slope amplitude, wavenumber). */
export const lightOmega = (omega, slope, k) => Math.min(omega, LIGHT_RATE / (slope * k * LIGHT_THROW));

// wavelength (m), amplitude (m), heading (degrees: 0 = +x, 90 = +z), crest sharpness Q.
// The trains fan out around +x, so the +x side of the column is the lee wall they slap against.
const SPECTRUM = [
  [6.4, 0.100, -14, 0.25],
  [3.9, 0.082, 17, 0.38],
  [2.6, 0.066, -37, 0.45],
  [1.75, 0.048, 43, 0.50],
  [1.2, 0.034, -6, 0.50],
  [0.83, 0.024, 66, 0.45],
  [0.57, 0.016, -55, 0.40],
];

export const WAVES = SPECTRUM.map(([wavelength, amplitude, heading, sharp], i) => {
  const k = (2 * Math.PI) / wavelength;
  const dx = Math.cos(heading * DEG);
  const dz = Math.sin(heading * DEG);
  const omega = Math.sqrt(GRAVITY * k) * TIME_SCALE;   // deep-water dispersion
  return {
    kx: k * dx, kz: k * dz, dx, dz,
    omega, light: lightOmega(omega, amplitude * k, k),
    phase: i * 2.399963,                          // golden-angle offsets: no two trains start in step
    amplitude, sharp,
  };
});

// A trochoid (the profile of a Gerstner wave) written as a height function. A particle of
// a Gerstner wave sits at x = a - (Q/k) sin(theta), y = A cos(theta) with theta = k a - w t,
// so the phase seen at a fixed x obeys Kepler's equation theta = phi + Q sin(theta).
// Two rounds of fixed-point iteration are plenty for Q <= 0.5: crests narrow, troughs widen.
function trochoid(w, x, z, t) {
  const phi = w.kx * x + w.kz * z - w.omega * t + w.phase;
  const theta = phi + w.sharp * Math.sin(phi + w.sharp * Math.sin(phi));
  return w.amplitude * Math.cos(theta);
}

/** Surface height relative to LEVEL at local (x, z) and time t. Mirrors waveHeight() in WAVES_GLSL. */
export function waveHeight(x, z, t) {
  const r = Math.hypot(x, z) + 1e-5;
  const rx = x / r;
  const rz = z / r;
  // A train that runs into the wall comes back as if from its mirror image in the wall.
  const m = (2 * RADIUS - r) / r;
  const near = Math.exp(-(((RADIUS - r) / REFLECT_REACH) ** 2));
  let h = 0;
  for (const w of WAVES) {
    const into = Math.max(w.dx * rx + w.dz * rz, 0);
    h += trochoid(w, x, z, t) + REFLECT * near * into * trochoid(w, x * m, z * m, t);
  }
  return Math.max(-MAX_SWELL, Math.min(MAX_SWELL, h));
}

const f = (v) => {
  const s = Number(v).toFixed(6);
  return s.includes('.') ? s : `${s}.0`;
};

/** GLSL twin of the functions above. `fold` returns the summed Q cos(theta): above ~1 the surface folds over and breaks. */
export const WAVES_GLSL = /* glsl */ `
const int WAVE_COUNT = ${WAVES.length};
// xy = wave vector (rad/m), z = angular frequency, w = phase offset
const vec4 WAVE_K[WAVE_COUNT] = vec4[WAVE_COUNT](
${WAVES.map((w) => `  vec4(${f(w.kx)}, ${f(w.kz)}, ${f(w.omega)}, ${f(w.phase)})`).join(',\n')}
);
// xy = unit heading, z = amplitude (m), w = crest sharpness Q
const vec4 WAVE_A[WAVE_COUNT] = vec4[WAVE_COUNT](
${WAVES.map((w) => `  vec4(${f(w.dx)}, ${f(w.dz)}, ${f(w.amplitude)}, ${f(w.sharp)})`).join(',\n')}
);
// Angular frequency of each train as the light on the bed sees it (lightOmega() in waves.js).
const float WAVE_LIGHT[WAVE_COUNT] = float[WAVE_COUNT](${WAVES.map((w) => f(w.light)).join(', ')});

// Trochoid profile as a height function: theta solves Kepler's equation theta = phi + Q sin(theta).
float trochoid(int i, vec2 x, float t, out float fold) {
  vec4 k = WAVE_K[i];
  vec4 a = WAVE_A[i];
  float phi = dot(k.xy, x) - k.z * t + k.w;
  float c = cos(phi + a.w * sin(phi + a.w * sin(phi)));
  fold = a.w * c;
  return a.z * c;
}

float waveHeight(vec2 x, float t, out float fold) {
  float r = length(x) + 1e-5;
  vec2 rhat = x / r;
  vec2 xm = rhat * (2.0 * ${f(RADIUS)} - r);                         // mirror image of x in the wall
  float byWall = exp(-sq((${f(RADIUS)} - r) / ${f(REFLECT_REACH)}));
  float h = 0.0;
  fold = 0.0;
  for (int i = 0; i < WAVE_COUNT; i++) {
    float f0, f1;
    float echo = ${f(REFLECT)} * byWall * max(dot(WAVE_A[i].xy, rhat), 0.0);
    h += trochoid(i, x, t, f0);
    fold += f0;
    if (echo > 0.002) {                       // out in the middle there is no echo to pay for
      h += echo * trochoid(i, xm, t, f1);
      fold += echo * f1;
    }
  }
  return clamp(h, -${f(MAX_SWELL)}, ${f(MAX_SWELL)});
}

// A trochoid and how fast it changes with phase: x = cos(theta), y = d cos(theta) / d phi,
// where theta = phi + Q sin(phi + Q sin(phi)). run = how far the train has run (its
// angular frequency times the time).
vec2 trochoidSlope(int i, vec2 x, float run) {
  vec4 k = WAVE_K[i];
  float q = WAVE_A[i].w;
  float phi = dot(k.xy, x) - run + k.w;
  float inner = phi + q * sin(phi);
  float theta = phi + q * sin(inner);
  return vec2(cos(theta), -sin(theta) * (1.0 + q * cos(inner) * (1.0 + q * cos(phi))));
}

// The same sea as waveHeight(), with its slope in closed form: x = height, yz = d/dx, d/dz.
// The wave-field pass uses it, so each texel works the waves out once instead of three
// times for a finite difference. light: the sea as the moonlight is bent by it, with the
// short trains held back (WAVE_LIGHT); the caustic pass asks for that one.
vec3 waveSurface(vec2 x, float t, bool light, out float fold) {
  float r = length(x) + 1e-5;
  vec2 rhat = x / r;
  float m = 2.0 * ${f(RADIUS)} / r - 1.0;                             // the mirror image of x in the wall is x * m
  float byWall = exp(-sq((${f(RADIUS)} - r) / ${f(REFLECT_REACH)}));
  float dByWall = byWall * 2.0 * (${f(RADIUS)} - r) / ${f(REFLECT_REACH * REFLECT_REACH)};
  vec3 sea = vec3(0.0);
  fold = 0.0;
  for (int i = 0; i < WAVE_COUNT; i++) {
    vec4 a = WAVE_A[i];
    float run = (light ? WAVE_LIGHT[i] : WAVE_K[i].z) * t;
    vec2 c = trochoidSlope(i, x, run);
    sea += a.z * vec3(c.x, c.y * WAVE_K[i].xy);
    fold += a.w * c.x;
    float into = max(dot(a.xy, rhat), 0.0);
    float echo = ${f(REFLECT)} * byWall * into;
    if (echo > 0.002) {
      vec2 e = trochoidSlope(i, x * m, run);
      // Product rule. The echo's weight changes from place to place, and so does the spot
      // its mirror image is read at: the map x -> x m has the Jacobian
      // m I - (2 R / r) rhat rhat^T, which is symmetric, so it carries the gradient back as it stands.
      vec2 dWeight = ${f(REFLECT)} * (dByWall * into * rhat + byWall * (a.xy - into * rhat) / r);
      vec2 g = e.y * WAVE_K[i].xy;
      vec2 dImage = m * g - (2.0 * ${f(RADIUS)} / r) * dot(rhat, g) * rhat;
      sea += a.z * vec3(echo * e.x, e.x * dWeight + echo * dImage);
      fold += echo * a.w * e.x;
    }
  }
  sea.x = clamp(sea.x, -${f(MAX_SWELL)}, ${f(MAX_SWELL)});       // (the amplitudes add up to less: this never bites)
  return sea;
}
`;

export const glslFloat = f;
