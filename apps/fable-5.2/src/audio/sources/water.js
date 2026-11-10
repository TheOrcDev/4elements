// WATER — the wash of small waves, slosh, a deep muffled body, trickling and single drips.

import { chain, MID, SIDE, WET } from '../kit.js';
import { BurstVoice, ChirpVoice, EventStream } from '../voices.js';
import { mapCurve, normaliseRms, randomCurve, unitCurve } from '../buffers.js';
import { clamp, expRand, noise1 } from '../util.js';

const LEVEL = { wash: 0.6, foam: 0.32, slosh: 0.5, body: 0.17, trickle: 0.23, drip: 0.17 };

const CURVE_RATE = 40; // control points per second
const TRICKLE_DRIFT = 0.09; // how far the trickle loops stray from their own pace, as a fraction
const TAU = Math.PI * 2;

/**
 * The rhythm of the waves, as two looping curves in step with each other. `swell` rises
 * quickly to each crest and drains away slowly; `foam` is the fizz left behind, which starts
 * at the crest and dies sooner. Waves arrive every four to eight seconds at uneven heights.
 */
function waveCurves(rng, seconds) {
  const points = Math.round(seconds * CURVE_RATE);
  const swell = new Float32Array(points);
  const foam = new Float32Array(points);
  const waves = [];
  for (let t = rng() * 2; t < seconds - 3.5; t += 4.2 + rng() * 3.6) {
    waves.push({ t, height: 0.5 + 0.5 * rng(), rise: 0.7 + 0.7 * rng(), fall: 1.5 + 1.5 * rng() });
  }
  let peak = 0;
  for (let i = 0; i < points; i++) {
    const time = i / CURVE_RATE;
    for (const wave of waves) {
      let x = time - wave.t;
      if (x > seconds / 2) x -= seconds; else if (x < -seconds / 2) x += seconds; // the loop wraps
      if (x < 0) {
        swell[i] += wave.height * Math.exp(-(x * x) / (wave.rise * wave.rise));
      } else {
        swell[i] += wave.height * Math.exp(-x / wave.fall);
        foam[i] += Math.pow(wave.height, 1.5) * (1 - Math.exp(-x / 0.3)) * Math.exp(-x / (wave.fall * 0.55));
      }
    }
    peak = Math.max(peak, swell[i]);
  }
  for (let i = 0; i < points; i++) { swell[i] /= peak; foam[i] = Math.min(foam[i], 1); }
  return { swell, foam };
}

/**
 * A few seconds of trickling, rendered ahead of time: hundreds of tiny bubbles, each a sine
 * that rises in pitch as it rings out, arriving in little runs the way water glugs over stone.
 * Bubbles that overrun the end wrap to the start, so the loop is seamless.
 */
function trickleLoop(rng, sampleRate, seconds) {
  const length = Math.floor(seconds * sampleRate);
  const out = new Float32Array(length);
  const attack = Math.exp(-1 / (0.0015 * sampleRate));
  for (let runs = Math.floor(seconds * 4.5); runs > 0; runs--) {
    let time = rng() * seconds;
    let pitch = expRand(rng, 1400, 4600);
    const drift = 0.86 + 0.3 * rng(); // each run climbs or falls
    const loudness = 0.4 + 0.6 * rng();
    for (let bubbles = 2 + Math.floor(rng() * 7); bubbles > 0; bubbles--) {
      const decay = (0.004 + 0.014 * Math.pow(1500 / pitch, 0.8)) * (0.6 + 0.8 * rng());
      const samples = Math.floor(decay * 5 * sampleRate);
      addBubble(out, Math.floor(time * sampleRate), samples, (TAU * pitch) / sampleRate, 0.12 + 0.3 * rng(), loudness * (0.5 + 0.5 * rng()), Math.exp(-1 / (decay * sampleRate)), attack);
      time += 0.012 + 0.05 * rng();
      pitch = clamp(pitch * drift * (0.94 + 0.12 * rng()), 1000, 6000);
    }
  }
  return normaliseRms(out, 0.1);
}

/**
 * One bubble, written without a single sin() or exp() per sample: a phasor is rotated by a
 * step that itself rotates (so the pitch climbs steadily), and both envelopes are running
 * products.
 * @param step  starting phase increment in radians per sample
 * @param rise  fraction by which the pitch has risen at the end
 * @param fall  per-sample multiplier of the decay
 * @param swell per-sample multiplier of what is left of the attack
 */
function addBubble(out, start, samples, step, rise, amplitude, fall, swell) {
  const bend = (step * rise) / samples; // how much the step grows each sample
  const cosBend = Math.cos(bend), sinBend = Math.sin(bend);
  let cosStep = Math.cos(step), sinStep = Math.sin(step);
  let re = 1, im = 0; // the phasor; im is the sine we write
  let envelope = amplitude, missing = 1;
  for (let i = 0, at = start % out.length; i < samples; i++) {
    out[at] += envelope * (1 - missing) * im;
    if (++at === out.length) at = 0;
    const nextRe = re * cosStep - im * sinStep;
    im = im * cosStep + re * sinStep;
    re = nextRe;
    const nextCos = cosStep * cosBend - sinStep * sinBend;
    sinStep = sinStep * cosBend + cosStep * sinBend;
    cosStep = nextCos;
    envelope *= fall;
    missing *= swell;
  }
}

export function createWater(kit, channel) {
  const { rng, ctx } = kit;
  const waves = waveCurves(rng, 53);
  const swell = kit.control(waves.swell, CURVE_RATE);
  const foamRise = kit.control(waves.foam, CURVE_RATE);

  // ---- Wash: a wide band of noise that brightens and swells with every wave, roughened by
  // quicker turbulence so that no swell is a smooth fade.
  const wash = kit.layer('water.wash', LEVEL.wash, channel.input);
  for (const lane of [MID, SIDE]) {
    const band = kit.filter('bandpass', 620, 0.55);
    kit.modulate(band.detune, swell, 1000);
    const seconds = lane === SIDE ? 17 : 13; // the two lanes churn on loops of different lengths
    const churn = kit.control(unitCurve(rng, 1300, seconds, 1.2, 7, 0.5), 1300 / seconds);
    wash.add(lane, chain(kit.noiseLoop('pink'), band, kit.filter('lowpass', 3600, 0.6), kit.vca(swell, 0.1, 0.9), kit.vca(churn, 0.65, 0.7)), lane === SIDE ? 0.6 : 1);
  }

  // ---- Foam: the fizz a crest leaves behind.
  const foam = kit.layer('water.foam', LEVEL.foam, channel.input);
  for (const lane of [MID, SIDE]) {
    foam.add(lane, chain(kit.noiseLoop('white'), kit.filter('highpass', 2200, 0.6), kit.filter('lowpass', 6500, 0.6), kit.vca(foamRise, 0.03, 0.97)), lane === SIDE ? 0.7 : 1);
  }

  // ---- Slosh: a resonant band wobbling about, water turning over on itself.
  const slosh = kit.layer('water.slosh', LEVEL.slosh, channel.input);
  const turning = kit.control(randomCurve(rng, 1160, 29, 0.4, 2.2, 0.3), 40);
  const heave = kit.control(mapCurve(unitCurve(rng, 620, 31, 0.15, 1.1, 0.4), (v) => v * v), 20);
  const glug = kit.filter('bandpass', 270, 3);
  kit.modulate(glug.detune, turning, 900);
  slosh.add(MID, chain(kit.noiseLoop('pink'), glug, kit.vca(heave, 0.05, 0.95)));

  // ---- Body: the weight of the water, felt more than heard.
  const body = kit.layer('water.body', LEVEL.body, channel.input);
  body.add(MID, chain(kit.noiseLoop('brown'), kit.filter('highpass', 60, 0.7), kit.filter('lowpass', 170, 0.7), kit.vca(swell, 0.45, 0.55)));

  // ---- Trickle: two unrelated bubble loops, one in the middle and one for width. Each is
  // played at a pace that drifts by several percent either way, so a pass through the loop
  // never comes out at the same pitch or with the same timing as the one before.
  const trickle = kit.layer('water.trickle', LEVEL.trickle, channel.input);
  const run = kit.control(unitCurve(rng, 370, 37, 0.05, 0.5, 0.5), 10);
  const loops = [11.3, 8.9].map((seconds) => kit.loop(trickleLoop(rng, ctx.sampleRate, seconds)));
  [47, 59].forEach((seconds, i) => {
    const drift = mapCurve(randomCurve(rng, seconds * 4, seconds, 0.03, 0.25, 0.4), (v) => Math.tanh(2 * v));
    kit.modulate(loops[i].playbackRate, kit.control(drift, 4), TRICKLE_DRIFT);
  });
  trickle.add(MID, chain(loops[0], kit.vca(run, 0.4, 0.6)));
  trickle.add(SIDE, chain(loops[1], kit.vca(run, 0.4, 0.6)), 0.7);

  // ---- Drips: the tick of a drop landing, then the bubble it drags under ringing out.
  const drip = kit.layer('water.drip', LEVEL.drip, channel.input);
  const bubbles = [-0.5, 0.25, 0.55, -0.2].map((spread) => {
    const voice = new ChirpVoice(kit);
    drip.add(MID, voice.output).add(SIDE, voice.output, spread).add(WET, voice.output, 0.3);
    return voice;
  });
  const splashes = [-0.3, 0.3].map((spread) => {
    const voice = new BurstVoice(kit, 'white');
    drip.add(MID, voice.output, 0.35).add(SIDE, voice.output, spread * 0.35);
    return voice;
  });

  const dripStream = new EventStream(rng);
  let turn = 0;

  const dropAt = (time, pitch, scale) => {
    turn = (turn + 1) % bubbles.length;
    // Bigger drops ring lower, louder and longer.
    const size = clamp(Math.log(2300 / pitch) / Math.log(2300 / 650), 0, 1);
    const level = scale * (0.45 + 0.55 * size);
    const ring = 0.014 + 0.03 * size;
    splashes[turn % splashes.length].trigger(time, expRand(rng, 3500, 6500), 1.2, level, 0.0015);
    bubbles[turn].trigger(time + 0.012, pitch, pitch * (1.3 + 0.5 * rng()), ring * 1.5, level, ring);
  };

  const dripAt = (time) => {
    const pitch = expRand(rng, 650, 2300);
    dropAt(time, pitch, 1);
    // Now and then a smaller drop follows the first.
    if (rng() < 0.22) dropAt(time + 0.09 + 0.11 * rng(), pitch * (1.1 + 0.3 * rng()), 0.6);
  };

  return {
    update(now) {
      dripStream.run(now, 0.8 + 1.5 * noise1(now * 0.11, 3), dripAt, 0.18);
    },
  };
}
