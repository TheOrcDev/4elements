// FIRE — a low fluttering roar, a fine sizzle, irregular crackles and pops, a faint hiss of sap.

import { chain, Follower, MID, SIDE, WET } from '../kit.js';
import { BurstVoice, EventStream } from '../voices.js';
import { mapCurve, randomCurve, unitCurve } from '../buffers.js';
import { clamp, expRand, noise1 } from '../util.js';

const LEVEL = { roar: 0.42, hiss: 0.1, sizzle: 0.7, crackle: 0.65, pop: 0.6 };
/** Balance of the roar's four bands, from the chest of the fire up to the rush of the flames. */
const ROAR = { body: 0.7, chest: 1, breath: 0.65, rush: 0.3 };

const CURVE_RATE = 100;       // control points per second
const SIZZLE_RATE = 1000;     // the sizzle curve needs millisecond detail
const CRACKLE_RATE = 9;       // average crackles per second when the fire is at rest
/** Where each crackle voice sits across the width of the fire (side-lane gain). */
const CRACKLE_SPREAD = [-0.7, 0.45, -0.2, 0.7, 0.15, -0.45];

/** Flame flutter in [0, 1]: slow breathing with quick licks riding on it. */
function flutterCurve(rng, seconds) {
  const points = Math.round(seconds * CURVE_RATE);
  const licks = randomCurve(rng, points, seconds, 2.5, 11, 0.4);
  return mapCurve(randomCurve(rng, points, seconds, 0.2, 1.4, 0.6), (v, i) => clamp(0.5 + 0.34 * v + 0.26 * licks[i], 0, 1));
}

/**
 * The fine crackle that never stops: a looping gain curve made of tiny spikes, most of them
 * faint, each dying away within a few milliseconds. They come in surges and lulls rather than
 * evenly, which is the difference between a fire and a frying pan.
 */
function sizzleCurve(rng, seconds, perSecond) {
  const points = Math.round(seconds * SIZZLE_RATE);
  const out = new Float32Array(points);
  const surge = unitCurve(rng, 256, seconds, 0.3, 2.5, 0.3);
  for (let n = Math.round(seconds * perSecond * 2); n > 0; n--) {
    const start = Math.floor(rng() * points);
    const busy = surge[Math.floor((start / points) * surge.length)];
    if (rng() > busy * busy * 2) continue; // thin the spikes out wherever the fire is resting
    const height = Math.pow(rng(), 4);
    const decay = expRand(rng, 0.0012, 0.006) * SIZZLE_RATE;
    for (let k = 0; k < decay * 6; k++) {
      const i = (start + k) % points;
      out[i] = Math.max(out[i], height * Math.exp(-k / decay));
    }
  }
  return out;
}

export function createFire(kit, channel) {
  const { rng } = kit;

  // The flame's flicker as the renderer draws it: 1 at its average brightness. Layers that
  // should breathe with the picture pass through a gate whose gain is this signal.
  const flicker = kit.constant(1);
  const flickerFollower = new Follower(flicker.offset, 0.045, 0.01);
  const flickerGate = () => {
    const gate = kit.gain(0);
    flicker.connect(gate.gain);
    return gate;
  };

  // ---- Roar: four bands of noise, each fluttering on its own.
  const roar = kit.layer('fire.roar', LEVEL.roar, channel.input, { insert: flickerGate() });
  const flutterLow = kit.control(flutterCurve(rng, 17.3), CURVE_RATE);
  const flutterHigh = kit.control(flutterCurve(rng, 23.9), CURVE_RATE);
  roar.add(MID, chain(kit.noiseLoop('brown'), kit.filter('highpass', 55, 0.7), kit.filter('bandpass', 125, 0.8), kit.vca(flutterLow, 0.3, 0.7, ROAR.body)));
  roar.add(MID, chain(kit.noiseLoop('pink'), kit.filter('bandpass', 340, 0.7), kit.vca(flutterHigh, 0.2, 0.8, ROAR.chest)));
  roar.add(MID, chain(kit.noiseLoop('pink'), kit.filter('bandpass', 900, 0.6), kit.vca(flutterHigh, 0.1, 0.9, ROAR.breath)));
  roar.add(MID, chain(kit.noiseLoop('pink'), kit.filter('bandpass', 2200, 0.7), kit.vca(flutterLow, 0.05, 0.95, ROAR.rush)));
  // A second, unrelated band in the side lane makes the fire as wide as it looks.
  roar.add(SIDE, chain(kit.noiseLoop('pink'), kit.filter('bandpass', 420, 0.6), kit.vca(flutterLow, 0.2, 0.8, ROAR.chest * 0.7)));

  // ---- Hiss: thin high noise that comes and goes in little surges.
  const surge = kit.control(mapCurve(unitCurve(rng, 1200, 19.1, 0.15, 2.2, 0.4), (v) => v * v * v), 1200 / 19.1);
  const hiss = kit.layer('fire.hiss', LEVEL.hiss, channel.input);
  hiss.add(MID, chain(kit.noiseLoop('white'), kit.filter('highpass', 3200, 0.6), kit.filter('lowpass', 8000, 0.6), kit.vca(surge, 0.12, 0.88)));

  // ---- Sizzle: the fine crackle that is always there. Three bands, each with its own pattern.
  const sizzle = kit.layer('fire.sizzle', LEVEL.sizzle, channel.input, { insert: flickerGate() });
  const sizzleBand = (hz, q, seconds, perSecond) =>
    chain(kit.noiseLoop('white'), kit.filter('bandpass', hz, q), kit.vca(kit.control(sizzleCurve(rng, seconds, perSecond), SIZZLE_RATE), 0, 1));
  sizzle.add(MID, sizzleBand(2600, 0.9, 9.7, 30));
  sizzle.add(MID, sizzleBand(4800, 1.1, 7.9, 38), 0.8);
  sizzle.add(SIDE, sizzleBand(3600, 1, 8.3, 32), 0.8);

  // ---- Crackles: short bursts of band-passed noise, each voice at its own place in the fire.
  const crackle = kit.layer('fire.crackle', LEVEL.crackle, channel.input, { insert: kit.filter('lowpass', 9000, 0.5) });
  const crackles = CRACKLE_SPREAD.map((spread) => {
    const voice = new BurstVoice(kit, 'white');
    crackle.add(MID, voice.output).add(SIDE, voice.output, spread).add(WET, voice.output, 0.15);
    return voice;
  });

  // ---- Pops: lower, rounder thumps of steam bursting out of the wood.
  const pop = kit.layer('fire.pop', LEVEL.pop, channel.input);
  const pops = [-0.3, 0.3].map((spread) => {
    const voice = new BurstVoice(kit, 'pink');
    pop.add(MID, voice.output).add(SIDE, voice.output, spread).add(WET, voice.output, 0.2);
    return voice;
  });

  const crackleStream = new EventStream(rng);
  const popStream = new EventStream(rng);
  const snapStream = new EventStream(rng);
  let turn = 0;
  let popTurn = 0;
  let flurryUntil = 0;
  let mean = 0;

  const crackleAt = (time) => {
    const voice = crackles[(turn = (turn + 1) % crackles.length)];
    const size = Math.pow(rng(), 2.2); // most crackles are small
    if (rng() < 0.55) {
      // Tick: tiny and bright, gone in a couple of milliseconds.
      voice.trigger(time, expRand(rng, 2800, 6500), 1.5 + 3 * rng(), 0.15 + 0.6 * size, expRand(rng, 0.0008, 0.0035));
    } else {
      // Crack: lower and longer, sometimes doubled.
      const decay = expRand(rng, 0.004, 0.016);
      voice.trigger(time, expRand(rng, 900, 2800), 0.9 + 2 * rng(), 0.3 + 0.9 * size, decay);
      if (rng() < 0.3) voice.strike(time + 0.006 + 0.014 * rng(), 0.2 + 0.5 * size, decay * 0.8);
    }
  };

  const popAt = (time) => {
    const voice = pops[(popTurn = (popTurn + 1) % pops.length)];
    voice.trigger(time, expRand(rng, 240, 620), 2.5 + 1.5 * rng(), 0.45 + 0.55 * rng(), 0.01 + 0.015 * rng(), 0.001);
  };

  // The occasional loud snap: a wide crack and a thump together, then embers scatter.
  const snapAt = (time) => {
    const voice = crackles[(turn = (turn + 1) % crackles.length)];
    voice.trigger(time, expRand(rng, 1300, 2400), 0.7, 1.3 + 0.5 * rng(), 0.013 + 0.012 * rng(), 0.0002);
    pops[(popTurn = (popTurn + 1) % pops.length)].trigger(time, expRand(rng, 170, 320), 1.2, 1.1, 0.04, 0.001);
    flurryUntil = time + 0.45;
  };

  return {
    update(now, dt, state) {
      // Follow the flicker relative to its own running mean, so any scale of fireIntensity works
      // and a scene without a fire (intensity 0) still burns at an even level.
      const raw = state.fireIntensity > 0 && Number.isFinite(state.fireIntensity) ? state.fireIntensity : 0;
      mean = mean > 0.02 ? mean + (raw - mean) * (1 - Math.exp(-dt / 3)) : raw;
      const bright = mean > 0.02 ? clamp(raw / mean, 0.25, 1.9) : 1;
      flickerFollower.to(0.3 + 0.7 * bright, now);

      // Crackling comes in spells: a slow wander, sudden flurries, and more when the flame leaps.
      const wander = noise1(now * 0.27, 1);
      let activity = 0.35 + 1.7 * wander * wander;
      if (noise1(now * 0.9, 2) > 0.8 || now < flurryUntil) activity *= 2.6;
      crackleStream.run(now, 1 / (CRACKLE_RATE * activity * (0.6 + 0.4 * bright)), crackleAt);
      popStream.run(now, 3.5, popAt, 0.4);
      snapStream.run(now, 6.5, snapAt, 2);
    },
  };
}
