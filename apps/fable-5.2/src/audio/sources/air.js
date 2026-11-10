// AIR — wind that gusts (a low body, two howling voices and an airy top moving together),
// the low rush of the vortex wandering round the listener, and thunder: now and then a flash
// of lightning is answered, from close by or from far off, and no two answers are alike.

import { chain, LEFT, MID, RIGHT, SIDE, WET } from '../kit.js';
import { mapCurve, randomCurve, unitCurve } from '../buffers.js';
import { clamp, smoothstep } from '../util.js';

const LEVEL = { wind: 0.45, howl: 0.5, sheen: 0.12, whoosh: 0.31, thunder: 0.85, sky: 0.4 };

/** The howling voices of the wind: [resting frequency in Hz, resonance, loop length of its wander in s]. */
const HOWLS = [[430, 3, 37], [760, 4, 29]];
const GUST_SECONDS = 61;
const GUST_RATE = 20;         // control points per second
const TURN_SECONDS = 43;      // loop length of the vortex's wander
const TURN_RATE = 20;         // control points per second
const SPEED_OF_SOUND = 343;   // metres per second

const FLASH_ON = 0.15;        // lightning counts as lit above this intensity
const STRIKE_GAP = 1.5;       // seconds of darkness between two strikes; the flickers of one bolt are far closer together
const ANSWER = 0.65;          // chance that a strike is answered, once the sky has been quiet for long enough
const DROUGHT = 45;           // seconds without thunder after which the next strike is answered for certain

/**
 * Decides which flashes of lightning are answered by thunder, and how. Most flashes are small
 * discharges inside the cloud and pass in silence; after each thunder the sky keeps quiet for
 * a while, the longer the nearer it was. An answer is described by how far away it seems
 * (0 = overhead, 1 = far off): distance delays it, softens its onset, takes its crack away
 * and darkens it, and a far-off roll tends to last longer. Pure bookkeeping, no audio nodes.
 */
export class Storm {
  constructor(rng) {
    this.rng = rng;
    this.lastLit = -Infinity;      // context time of the last frame with lightning in it
    this.lastThunder = -Infinity;  // context time the last thunder was set off
    this.hush = 0;                 // seconds after it during which every strike passes in silence
    this.count = 0;                // thunders so far
    this.lastRange = -1;           // 0 near, 1 middle, 2 far
    this.sinceNear = 1;            // thunders since the last near one
    /** The answer to the current strike; one object, refilled every time. */
    this.thunder = { delay: 0, far: 0, strength: 0, length: 0 };
  }

  /**
   * Once per frame, with the lightning's intensity and how near the camera stands to it
   * (0..1). Returns the thunder to play for a strike that has just begun (valid until the
   * next call), or null.
   */
  observe(now, flash, nearness = 0.5) {
    if (!(flash > FLASH_ON)) return null;
    const fresh = now - this.lastLit > STRIKE_GAP;
    this.lastLit = now;
    if (!fresh) return null; // one more flicker of a bolt that has already had its answer, or its silence
    const { rng } = this;
    const quiet = now - this.lastThunder;
    if (quiet < this.hush) return null;
    // The storm introduces itself: its first two answers are not left to chance.
    const first = this.count === 0;
    if (this.count > 1 && quiet < DROUGHT && rng() > ANSWER) return null;

    // How far away. A close one grows likelier with every thunder since the last (sooner
    // beside the vortex than from across the plain), so it is never long in coming and never
    // comes twice running; in between, the middle distance and far off take turns. The first
    // is always a middling one.
    let range = 1;
    if (!first) {
      if (rng() < (0.07 + 0.2 * nearness) * this.sinceNear) range = 0;
      else if (this.lastRange === 1) range = 2;
      else if (this.lastRange === 0 && rng() < 0.5) range = 2;
    }
    this.sinceNear = range === 0 ? 0 : this.sinceNear + 1;
    this.lastRange = range;
    const far = range === 0 ? 0.12 * rng() : range === 1 ? 0.3 + 0.3 * rng() : 0.7 + 0.3 * rng();

    const thunder = this.thunder;
    thunder.far = far;
    thunder.delay = 2.6 * Math.pow(far, 1.6);
    thunder.strength = (0.58 - 0.31 * far) * (0.85 + 0.3 * rng());
    thunder.length = clamp(0.15 + 0.45 * far + 0.8 * (rng() - 0.3), 0, 1);
    this.lastThunder = now;
    this.hush = first ? 8 + 4 * rng() : 8 + 12 * rng() + 6 * (1 - far);
    this.count++;
    return thunder;
  }
}

/**
 * One thunderclap: a short mid-range clap and a long rumble whose loudness rolls in a few
 * uneven waves while its tone darkens. Two of these take turns, so a late roll may overlap
 * the next clap.
 */
class ThunderVoice {
  constructor(kit, rumbleSource, clapSource, rumbleOut, clapOut) {
    // The envelope sits in front of the low-pass, which rounds off even the hardest onset.
    this.rumble = kit.gain(0);
    this.tone = kit.filter('lowpass', 200, 0.6);
    chain(rumbleSource, this.rumble, this.tone, rumbleOut);
    this.clap = kit.gain(0);
    chain(clapSource, this.clap, clapOut);
  }

  /**
   * @param thunder   what the storm decided: { far, strength (about 0.2 to 0.65), length }
   * @param nearness  0..1, how much of the sharp clap survives the way to the camera
   */
  strike(time, { far, strength, length }, nearness, rng) {
    const tone = this.tone.frequency;
    const gain = this.rumble.gain;
    const clap = this.clap.gain;
    // Whatever was still planned for this voice is dropped; each param carries on from where
    // it is, so even a roll that is cut off mid-way does not click.
    const from = time - 0.03;
    tone.cancelScheduledValues(from);
    gain.cancelScheduledValues(from);
    clap.cancelScheduledValues(from);

    tone.setTargetAtTime(1500 - 1100 * far, from, 0.006);             // open up just before the boom: the further, the duller
    tone.setTargetAtTime(420 - 180 * far, time + 0.05, 0.3 + 0.3 * far); // then darken into the roll
    tone.setTargetAtTime(110, time + 0.9 + 0.6 * far, 1.1);

    // Close by the rumble starts with a blow; far off it swells in. Then it rolls: one wave
    // for the shortest thunder, five for the longest, each a little weaker than the last.
    const attack = 0.02 + 0.28 * far * far;
    const fade = 1.3 + 2.4 * length; // seconds over which the waves die away
    gain.setTargetAtTime(strength, time, attack);
    let t = time + 0.14 + 2.5 * attack;
    let level = strength;
    for (let rolls = 1 + Math.round(4 * length); rolls > 0; rolls--) {
      gain.setTargetAtTime(level * (0.3 + 0.25 * rng()), t, 0.1 + 0.1 * rng());
      t += 0.3 + 0.5 * rng();
      level = strength * Math.exp(-(t - time) / fade) * (0.55 + 0.45 * rng());
      gain.setTargetAtTime(level, t, 0.05 + 0.08 * rng() + 0.5 * attack);
      t += 0.16 + 0.25 * rng();
    }
    gain.setTargetAtTime(0, t, 0.45 + 1.1 * length);

    // The clap: one crack and then a second, as sound from further up the bolt arrives. It
    // does not carry: from the middle distance little of it is left, from far off nothing.
    const crack = strength * nearness * (1 - far) * (1 - far);
    if (crack > 0.03) {
      const again = time + 0.12 + 0.2 * rng();
      clap.setTargetAtTime(crack, time, 0.01);
      clap.setTargetAtTime(crack * 0.25, time + 0.04, 0.09);
      clap.setTargetAtTime(crack * (0.4 + 0.4 * rng()), again, 0.015);
      clap.setTargetAtTime(0, again + 0.05, 0.1 + 0.08 * rng());
    }
  }
}

/** @param sky stereo bus for the part of the thunder that comes from everywhere at once */
export function createAir(kit, channel, sky) {
  const { rng, ctx } = kit;

  // One gust curve drives everything: the bands rise in pitch and level together, the higher
  // ones only coming through as the gust peaks (gust squared, gust cubed).
  const shape = mapCurve(unitCurve(rng, GUST_SECONDS * GUST_RATE, GUST_SECONDS, 0.02, 0.35, 0.8), (v) => smoothstep(0.2, 0.85, v));
  const gust = kit.control(shape, GUST_RATE);
  const gustSquared = kit.control(shape.map((v) => v * v), GUST_RATE);
  const gustCubed = kit.control(shape.map((v) => v * v * v), GUST_RATE);

  // ---- Wind: the broad low body of moving air, buffeted a little faster than it gusts.
  const wind = kit.layer('air.wind', LEVEL.wind, channel.input);
  const buffet = kit.control(unitCurve(rng, 920, 23, 0.3, 2.5, 0.5), 40);
  for (const lane of [MID, SIDE]) {
    const band = kit.filter('bandpass', 230, 0.8);
    kit.modulate(band.detune, gust, 800);
    wind.add(lane, chain(kit.noiseLoop('pink'), band, kit.vca(gust, 0.15, 0.85), kit.vca(buffet, 0.7, 0.6)), lane === SIDE ? 0.7 : 1);
  }

  // ---- Howl: two narrow bands that climb with the gust and wander on their own, one to
  // each side. They slide past each other and never settle on a note.
  const howl = kit.layer('air.howl', LEVEL.howl, channel.input);
  HOWLS.forEach(([hz, q, seconds], i) => {
    const band = kit.filter('bandpass', hz, q);
    kit.modulate(band.detune, gust, 900);
    kit.modulate(band.detune, kit.control(randomCurve(rng, seconds * 20, seconds, 0.06, 0.9, 0.6), 20), 500);
    const voice = chain(kit.noiseLoop('pink'), band, kit.vca(gustSquared, 0.04, 0.96));
    howl.add(MID, voice).add(SIDE, voice, i ? 0.6 : -0.6);
  });

  // ---- Sheen: the airy top of a strong gust.
  const sheen = kit.layer('air.sheen', LEVEL.sheen, channel.input);
  for (const lane of [MID, SIDE]) {
    const band = kit.filter('bandpass', 2400, 0.7);
    kit.modulate(band.detune, gust, 700);
    sheen.add(lane, chain(kit.noiseLoop('white'), band, kit.filter('lowpass', 6000, 0.6), kit.vca(gustCubed, 0.02, 0.98)), lane === SIDE ? 0.7 : 1);
  }

  // ---- Whoosh: the low rush of the funnel. Its loudness and tone wander with no beat to
  // them, the way turbulence does, and the side lane follows the same wander a quarter turn
  // behind: the sound drifts round the listener as the vortex turns, never at a steady pace.
  const whoosh = kit.layer('air.whoosh', LEVEL.whoosh, channel.input);
  const aside = new Float32Array(TURN_SECONDS * TURN_RATE);
  const lean = (v) => Math.tanh(1.8 * v) / Math.tanh(1.8); // spend more of the time well off centre
  const turn = kit.control(mapCurve(randomCurve(rng, TURN_SECONDS * TURN_RATE, TURN_SECONDS, 0.2, 0.95, 0.35, aside), lean), TURN_RATE);
  const turnAside = kit.control(mapCurve(aside, lean), TURN_RATE);
  const funnel = kit.gain(1);
  const low = kit.filter('bandpass', 160, 1);
  const high = kit.filter('bandpass', 340, 1.2);
  kit.modulate(low.detune, turn, 180);
  kit.modulate(high.detune, turn, 180);
  chain(kit.noiseLoop('brown'), kit.filter('highpass', 55, 0.7), low, funnel);
  chain(kit.noiseLoop('pink'), high, kit.gain(0.5), funnel);
  whoosh.add(MID, chain(funnel, kit.vca(turn, 0.7, 0.3)));
  whoosh.add(SIDE, chain(funnel, kit.vca(turnAside, 0, 0.6)));

  // ---- Thunder. The rumble source is two lanes wide: deep noise with a little body in the
  // mid lane, unrelated deep noise in the side lane, so the roll fills the whole sky.
  const thunder = kit.layer('air.thunder', LEVEL.thunder, channel.input);
  const rumbleSource = ctx.createChannelMerger(2);
  kit.noiseLoop('brown').connect(rumbleSource, 0, 0);
  chain(kit.noiseLoop('pink'), kit.gain(0.6)).connect(rumbleSource, 0, 0);
  kit.noiseLoop('brown').connect(rumbleSource, 0, 1);
  const clapSource = kit.noiseLoop('pink');
  const rumbleOut = kit.filter('highpass', 40, 0.7);
  const clapOut = kit.filter('highpass', 160, 0.6);
  const voices = [0, 1].map(() => new ThunderVoice(kit, rumbleSource, clapSource, rumbleOut, clapOut));
  const rumbleLanes = ctx.createChannelSplitter(2);
  const rumbleMid = kit.gain(1);
  const rumbleSide = kit.gain(0.5);
  rumbleOut.connect(rumbleLanes);
  rumbleLanes.connect(rumbleMid, 0);
  rumbleLanes.connect(rumbleSide, 1);
  const clap = chain(clapOut, kit.filter('lowpass', 1800, 0.6));
  thunder.add(MID, rumbleMid).add(SIDE, rumbleSide).add(WET, rumbleMid, 0.5);
  thunder.add(MID, clap, 0.55).add(WET, clap, 0.3);
  // Thunder is bigger than the vortex it comes from: part of the roll skips the positioning
  // and fills both sides directly, so it is felt from anywhere on the plain.
  kit.layer('air.sky', LEVEL.sky, sky, { lanes: 2 })
    .add(LEFT, rumbleMid).add(LEFT, rumbleSide)
    .add(RIGHT, rumbleMid).add(RIGHT, rumbleSide, -1);

  const storm = new Storm(rng);
  let turnOf = 0;

  return {
    update(now, dt, state) {
      const nearness = clamp(1.5 - channel.distance / 30, 0.25, 1);
      const answer = storm.observe(now, state.flash, nearness);
      if (!answer) return;
      // Light arrives at once; the sound takes distance / 343 seconds to cross the plain,
      // on top of however far away the storm placed this one.
      const travel = channel.distance / SPEED_OF_SOUND;
      voices[(turnOf = (turnOf + 1) % voices.length)].strike(now + 0.05 + travel + answer.delay, answer, nearness, rng);
    },
  };
}
