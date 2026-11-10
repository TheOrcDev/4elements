// Raw material for the soundscape, synthesised once when the graph is built:
// looping noise, slow random control curves and the reverb impulse response.
// Plain arrays in, plain arrays out; only toBuffer() touches the audio context.

const TAU = Math.PI * 2;

/** Level every noise loop is normalised to, so layer gains mean the same thing everywhere. */
const NOISE_RMS = 0.25;

/** Wrap a mono Float32Array in an AudioBuffer at the context's sample rate. */
export function toBuffer(ctx, data) {
  const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
  buffer.getChannelData(0).set(data);
  return buffer;
}

/** Scale a signal to the given RMS level, in place. */
export function normaliseRms(data, rms) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  const scale = sum > 0 ? rms / Math.sqrt(sum / data.length) : 0;
  for (let i = 0; i < data.length; i++) data[i] *= scale;
  return data;
}

/**
 * Turn `length + overlap` samples into a seamless loop of `length` samples by cross-fading
 * the overshoot into the head (equal power, since the two ends are uncorrelated). Without
 * this, low-frequency noise clicks every time its loop wraps.
 */
function closeLoop(extended, length) {
  const overlap = extended.length - length;
  const out = extended.slice(0, length);
  for (let i = 0; i < overlap; i++) {
    const a = (i / overlap) * (Math.PI / 2);
    out[i] = extended[i] * Math.sin(a) + extended[length + i] * Math.cos(a);
  }
  return out;
}

/**
 * Uniform white noise in [-1, 1). Millions of samples are drawn while the graph is built, so
 * this runs a bare xorshift32 generator on a local integer (seeded from rng) instead of making
 * a call per sample.
 */
function whiteSamples(rng, length) {
  const out = new Float32Array(length);
  let s = Math.floor(rng() * 0x7fffffff) + 1;
  for (let i = 0; i < length; i++) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    out[i] = s / 2147483648;
  }
  return out;
}

/** Pink noise (equal energy per octave), Paul Kellet's filter bank. */
function pinkNoise(rng, sampleRate, seconds) {
  const length = Math.floor(seconds * sampleRate);
  const warmUp = 8192;
  const white = whiteSamples(rng, warmUp + length + Math.floor(0.25 * sampleRate));
  const ext = new Float32Array(white.length - warmUp);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < white.length; i++) {
    const w = white[i];
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    if (i >= warmUp) ext[i - warmUp] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
  }
  return normaliseRms(closeLoop(ext, length), NOISE_RMS);
}

/** Brown noise: white noise through a leaky integrator, -6 dB per octave above ~30 Hz. */
function brownNoise(rng, sampleRate, seconds) {
  const length = Math.floor(seconds * sampleRate);
  const warmUp = Math.floor(0.2 * sampleRate);
  const white = whiteSamples(rng, warmUp + length + Math.floor(0.5 * sampleRate));
  const ext = new Float32Array(white.length - warmUp);
  const leak = Math.exp(-TAU * 30 / sampleRate);
  let x = 0;
  let mean = 0;
  for (let i = 0; i < white.length; i++) {
    x = leak * x + white[i];
    if (i >= warmUp) { ext[i - warmUp] = x; mean += x; }
  }
  mean /= ext.length;
  for (let i = 0; i < ext.length; i++) ext[i] -= mean;
  return normaliseRms(closeLoop(ext, length), NOISE_RMS);
}

/**
 * The three looping noise colours every layer is carved from, as loops of unrelated lengths.
 * A generator: it fills `into` one colour at a time and yields in between, each colour being
 * a few milliseconds of work.
 */
export function* noiseBufferSteps(ctx, rng, into) {
  const sr = ctx.sampleRate;
  into.white = toBuffer(ctx, normaliseRms(whiteSamples(rng, Math.floor(sr * 4.1)), NOISE_RMS));
  yield;
  into.pink = toBuffer(ctx, pinkNoise(rng, sr, 8.9));
  yield;
  into.brown = toBuffer(ctx, brownNoise(rng, sr, 10.3));
}

/**
 * A smooth random curve that loops seamlessly: a random Fourier series in which every partial
 * completes a whole number of cycles over the loop. Zero mean, scaled to a peak of 1.
 * @param points   number of samples in the curve
 * @param seconds  how long one pass of the loop will last when played
 * @param fLo,fHi  frequency content in Hz
 * @param tilt     amplitude falls as f^-tilt (0 = even, 1 = slow wander dominates)
 * @param partner  optional array of `points` values that receives the same curve with every
 *                 partial a quarter cycle ahead. The pair moves like the two coordinates of a
 *                 point going round in circles at an uneven pace (both share one scale).
 */
export function randomCurve(rng, points, seconds, fLo, fHi, tilt = 0.5, partner = null) {
  const out = new Float32Array(points);
  const kLo = Math.max(1, Math.round(fLo * seconds));
  const kHi = Math.max(kLo, Math.round(fHi * seconds));
  for (let k = kLo; k <= kHi; k++) {
    const amp = Math.pow(k / kLo, -tilt) * (0.5 + rng());
    const phase = rng() * TAU;
    // Rotate a phasor rather than calling Math.sin for every point.
    const cw = Math.cos((TAU * k) / points);
    const sw = Math.sin((TAU * k) / points);
    let c = Math.cos(phase);
    let s = Math.sin(phase);
    for (let i = 0; i < points; i++) {
      out[i] += amp * s;
      if (partner) partner[i] += amp * c;
      const next = c * cw - s * sw;
      s = s * cw + c * sw;
      c = next;
    }
  }
  let peak = 0;
  for (let i = 0; i < points; i++) peak = Math.max(peak, Math.abs(out[i]), partner ? Math.abs(partner[i]) : 0);
  for (let i = 0; i < points; i++) {
    out[i] /= peak || 1;
    if (partner) partner[i] /= peak || 1;
  }
  return out;
}

/** Map a curve through fn, in place. */
export function mapCurve(curve, fn) {
  for (let i = 0; i < curve.length; i++) curve[i] = fn(curve[i], i);
  return curve;
}

/** A looping random curve in [0, 1] (see randomCurve). */
export function unitCurve(rng, points, seconds, fLo, fHi, tilt) {
  return mapCurve(randomCurve(rng, points, seconds, fLo, fHi, tilt), (v) => v * 0.5 + 0.5);
}

/**
 * Stereo impulse response for the reverb send: a short pre-delay, then decaying noise whose
 * tail darkens as it fades, with the lows rolled off so rumble does not pile up. It stands in
 * for the diffuse return of a very wide, hard, wet plain rather than for a room. A generator
 * that yields between the two channels and returns the buffer.
 */
export function* impulseResponseSteps(ctx, rng, { seconds = 2.4, rt60 = 2.1, preDelay = 0.022 } = {}) {
  const sr = ctx.sampleRate;
  const length = Math.floor(seconds * sr);
  const start = Math.floor(preDelay * sr);
  const fadeOut = Math.floor(0.08 * sr);
  const highPass = 1 - Math.exp(-TAU * 140 / sr);
  const decayStep = Math.exp(-6.908 / (rt60 * sr));
  const swellStep = Math.exp(-1 / (0.012 * sr));
  const buffer = ctx.createBuffer(2, length, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const white = whiteSamples(rng, length);
    let decay = 1;    // the tail's exponential fall
    let missing = 1;  // what is left of the 12 ms swell at the start
    let smoothing = 0;
    let low = 0;
    let rumble = 0;
    let energy = 0;
    for (let i = start; i < length; i++) {
      // The low-pass slides from 6 kHz down to 800 Hz; refreshing it every 32 samples is plenty.
      if (((i - start) & 31) === 0) {
        const cutoff = 800 + 5200 * Math.exp(-(i - start) / (0.55 * sr));
        smoothing = 1 - Math.exp(-TAU * cutoff / sr);
      }
      low += smoothing * (white[i] * (1 - missing) * decay - low);
      rumble += highPass * (low - rumble);
      let v = low - rumble;
      if (i > length - fadeOut) v *= (length - i) / fadeOut;
      data[i] = v;
      energy += v * v;
      decay *= decayStep;
      missing *= swellStep;
    }
    const scale = 1 / Math.sqrt(energy || 1);
    for (let i = start; i < length; i++) data[i] *= scale;
    if (ch === 0) yield;
  }
  return buffer;
}
