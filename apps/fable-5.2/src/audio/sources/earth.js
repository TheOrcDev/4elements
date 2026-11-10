// EARTH — almost silent: a presence below hearing, stone grinding on stone now and then,
// fine sand running, a pebble ticking down the rock, and a faint ringing from the crystals.

import { chain, MID, SIDE, WET } from '../kit.js';
import { EventStream, LEAD, PingVoice } from '../voices.js';
import { mapCurve, unitCurve } from '../buffers.js';
import { expRand } from '../util.js';

const LEVEL = { sub: 0.0135, grind: 1.5, sand: 0.09, pebble: 2.0, shimmer: 0.012 };

/**
 * Crystal partials in Hz: a stack of open fifths with no third, so it never sounds like a
 * chord in a key. Each one is a pair of sines a fraction of a hertz apart, beating slowly.
 */
const PARTIALS = [1174.66, 1760, 2349.32, 2637.02, 3520, 4698.64];
/** The trace of each partial that sounds between rings, relative to a full ring. */
const SHIMMER_REST = 0.03;

/** Level of the noise rumble against the two sub tones (which are at 1 and 0.45). */
const RUMBLE = 3;
const ROUGH_RATE = 400; // control points per second for the stick-slip curve

/**
 * Stick-slip roughness in [0, 1]: stone dragged over stone does not slide, it catches and
 * lets go a couple of dozen times a second. Random sharp jolts, each ringing down quickly.
 */
function roughnessCurve(rng, seconds) {
  const points = Math.round(seconds * ROUGH_RATE);
  const jolts = new Float32Array(points);
  for (let j = Math.round(seconds * 22); j > 0; j--) jolts[Math.floor(rng() * points)] += 0.15 + 0.85 * rng() * rng();
  const out = new Float32Array(points);
  const fall = Math.exp(-1 / (ROUGH_RATE * 0.04));
  const rise = 1 - Math.exp(-1 / (ROUGH_RATE * 0.004));
  let held = 0;
  let smooth = 0;
  let peak = 0;
  // Twice round the loop: the second pass starts in the state the first one ended in, so it wraps cleanly.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < points; i++) {
      held = Math.max(held * fall, jolts[i]);
      smooth += rise * (held - smooth);
      out[i] = smooth;
      if (pass === 1) peak = Math.max(peak, smooth);
    }
  }
  for (let i = 0; i < points; i++) out[i] /= peak || 1;
  return out;
}

export function createEarth(kit, channel) {
  const { rng } = kit;

  // ---- Sub: two very low tones a fifth apart and a bed of rumble, breathing slowly.
  const sub = kit.layer('earth.sub', LEVEL.sub, channel.input);
  const breath = kit.control(unitCurve(rng, 410, 41, 0.03, 0.25, 0.6), 10);
  const presence = kit.vca(breath, 0.55, 0.45);
  kit.oscillator(37).connect(presence);
  chain(kit.oscillator(55.7), kit.gain(0.45), presence);
  chain(kit.noiseLoop('brown'), kit.filter('highpass', 45, 0.7), kit.filter('lowpass', 150, 0.7), kit.gain(RUMBLE), presence);
  sub.add(MID, presence);

  // ---- Grind: low rumble and a band of grit, both shaken by the stick-slip curve and only
  // let through during a grinding episode.
  const episode = kit.gain(0);
  const grind = kit.layer('earth.grind', LEVEL.grind, channel.input, { insert: episode });
  const rough = kit.control(roughnessCurve(rng, 7.7), ROUGH_RATE);
  const drag = kit.vca(rough, 0.1, 0.9);
  chain(kit.noiseLoop('brown'), kit.filter('bandpass', 120, 1.4), drag);
  chain(kit.noiseLoop('pink'), kit.filter('bandpass', 480, 2), kit.gain(0.5), drag);
  grind.add(MID, drag).add(WET, drag, 0.3);
  grind.add(SIDE, chain(kit.noiseLoop('pink'), kit.filter('bandpass', 700, 1.5), kit.vca(rough, 0.1, 0.9, 0.3)));

  // ---- Sand: the thinnest hiss, in pours.
  const sand = kit.layer('earth.sand', LEVEL.sand, channel.input);
  const pour = kit.control(mapCurve(unitCurve(rng, 470, 47, 0.04, 0.6, 0.4), (v) => v * v * v), 10);
  sand.add(MID, chain(kit.noiseLoop('white'), kit.filter('bandpass', 6000, 0.8), kit.filter('lowpass', 9000, 0.6), kit.vca(pour, 0.08, 0.92)));
  sand.add(SIDE, chain(kit.noiseLoop('white'), kit.filter('bandpass', 5200, 0.8), kit.filter('lowpass', 9000, 0.6), kit.vca(pour, 0.08, 0.92)), 0.7);

  // ---- Pebbles: a hard little tick, sometimes bouncing two or three times.
  const pebble = kit.layer('earth.pebble', LEVEL.pebble, channel.input);
  const impulse = kit.constant(1);
  const pebbles = [-0.5, 0.4, -0.1].map((spread) => {
    const voice = new PingVoice(kit, impulse);
    pebble.add(MID, voice.output).add(SIDE, voice.output, spread).add(WET, voice.output, 0.6);
    return voice;
  });

  // ---- Shimmer: every partial rings like struck glass, swelling quickly and dying away over
  // seconds while its two sines beat against each other. Rings are set off at random.
  const shimmer = kit.layer('earth.shimmer', LEVEL.shimmer, channel.input);
  const crystals = PARTIALS.map((hz, i) => {
    const ring = kit.gain(SHIMMER_REST);
    kit.oscillator(hz).connect(ring);
    kit.oscillator(hz + 0.35 + 0.3 * i).connect(ring);
    const weight = Math.pow(PARTIALS[0] / hz, 0.9); // higher partials are fainter
    shimmer.add(MID, ring, 0.6 * weight).add(SIDE, ring, (i % 2 ? 0.6 : -0.6) * weight).add(WET, ring, 0.8 * weight);
    return ring;
  });

  const tickStream = new EventStream(rng);
  const ringStream = new EventStream(rng);
  let turn = 0;
  let nextGrind = -1;

  const tickAt = (time) => {
    let pitch = expRand(rng, 1700, 3900);
    const ratio = 1.45 + 0.35 * rng(); // the two resonances are not harmonically related
    let level = 0.35 + 0.65 * Math.pow(rng(), 1.5);
    let gap = 0.09 + 0.08 * rng();
    const bounces = rng() < 0.5 ? 1 : 2 + Math.floor(rng() * 3);
    for (let i = 0; i < bounces; i++) {
      pebbles[(turn = (turn + 1) % pebbles.length)].trigger(time, pitch, pitch * ratio, level);
      time += gap;
      gap *= 0.62;
      level *= 0.55;
      pitch *= 1.03;
    }
  };

  const ringAt = (time) => {
    const i = Math.floor(rng() * crystals.length);
    const gain = crystals[i].gain;
    gain.setTargetAtTime(SHIMMER_REST + 0.35 + 0.65 * rng(), time, 0.03 + 0.05 * rng());
    // Higher partials die away sooner, as they do in anything that rings.
    gain.setTargetAtTime(SHIMMER_REST, time + 0.25, (1.1 + 0.9 * rng()) * Math.sqrt(PARTIALS[0] / PARTIALS[i]));
  };

  return {
    update(now) {
      tickStream.run(now, 7, tickAt, 2.5);
      ringStream.run(now, 2.1, ringAt, 0.4);

      if (nextGrind < 0) nextGrind = now + 2.5 + 3 * rng();
      if (now >= nextGrind) {
        // One slow heave of stone: it builds, catches, lurches on and settles.
        const time = now + LEAD;
        const strength = 0.5 + 0.5 * rng();
        const length = 2.6 + 2.4 * rng();
        const gain = episode.gain;
        gain.setTargetAtTime(strength * 0.03, time, 0.08); // a creak first...
        gain.setTargetAtTime(strength * 0.2, time + 0.25, 0.12);
        gain.setTargetAtTime(strength, time + 0.6, 0.3);   // ...then the weight comes on
        gain.setTargetAtTime(strength * 0.45, time + length * 0.45, 0.25);
        gain.setTargetAtTime(strength * 0.9, time + length * 0.62, 0.18);
        gain.setTargetAtTime(0, time + length, 0.5);
        nextGrind = now + length + 5 + 9 * rng();
      }
    },
  };
}
