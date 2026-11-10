// One-shot sounds without one-shot nodes. Every voice here is a small chain that is built once
// and runs for good; an event is nothing more than a few setTargetAtTime calls on it. Because
// each envelope is an exponential glide from wherever the gain currently is, a voice can be
// re-triggered at any moment without a click, and the frame loop never allocates.

import { chain } from './kit.js';
import { waitTime } from './util.js';

/** Earliest an event may be placed after "now". Must exceed the device's output buffer. */
export const LEAD = 0.1;
/** Events falling inside this window are scheduled on the current frame. */
const HORIZON = 0.25;
/** A voice is retuned this long before it speaks, while it is still silent... */
const RETUNE = 0.006;
/** ...by a glide with this time constant, which has landed by the time the voice opens. */
const RETUNE_GLIDE = 0.001;

/**
 * A stream of random arrivals. run() is called every frame and hands each arrival inside the
 * look-ahead window to `fire(time)`; the mean interval may change freely between calls.
 */
export class EventStream {
  constructor(rng) {
    this.rng = rng;
    this.next = -Infinity;
  }

  /**
   * @param now           context time
   * @param meanInterval  average seconds between arrivals
   * @param fire          callback(time), a function that is created once, not per frame
   * @param gap           shortest allowed interval
   */
  run(now, meanInterval, fire, gap = 0) {
    // First call, or the frame loop has been away (hidden tab): start afresh, never catch up.
    if (this.next < now) this.next = now + LEAD + this.wait(meanInterval, gap);
    for (let budget = 8; this.next < now + HORIZON && budget > 0; budget--) {
      fire(Math.max(this.next, now + LEAD));
      this.next += this.wait(meanInterval, gap);
    }
  }

  wait(meanInterval, gap) {
    return gap + waitTime(this.rng, Math.max(meanInterval - gap, 0.001));
  }
}

/** Noise through a band-pass with a percussive envelope: crackles, pops, splashes. */
export class BurstVoice {
  constructor(kit, colour = 'white') {
    this.filter = kit.filter('bandpass', 2000, 2);
    this.output = kit.gain(0);
    chain(kit.noiseLoop(colour), this.filter, this.output);
  }

  /** @param decay time constant of the tail, in seconds */
  trigger(time, frequency, q, level, decay, attack = 0.0003) {
    this.filter.frequency.setTargetAtTime(frequency, time - RETUNE, RETUNE_GLIDE);
    this.filter.Q.setTargetAtTime(q, time - RETUNE, RETUNE_GLIDE);
    this.strike(time, level, decay, attack);
  }

  /** Speak again without retuning (a double crack). */
  strike(time, level, decay, attack = 0.0003) {
    const gain = this.output.gain;
    gain.setTargetAtTime(level, time, attack);
    gain.setTargetAtTime(0, time + attack * 4, decay);
  }
}

/** A sine that glides upward while it decays: one air bubble pinching off under water. */
export class ChirpVoice {
  constructor(kit) {
    this.oscillator = kit.oscillator(1000);
    this.output = kit.gain(0);
    this.oscillator.connect(this.output);
  }

  trigger(time, fromHz, toHz, glide, level, decay) {
    const frequency = this.oscillator.frequency;
    frequency.setTargetAtTime(fromHz, time - RETUNE, RETUNE_GLIDE);
    frequency.setTargetAtTime(toHz, time, glide);
    const gain = this.output.gain;
    gain.setTargetAtTime(level, time, 0.0012);
    gain.setTargetAtTime(0, time + 0.005, decay);
  }
}

/** An impulse rung through two resonators: something small and hard being struck. */
export class PingVoice {
  /** @param impulse a constant source of 1, shared by every ping voice */
  constructor(kit, impulse) {
    this.pulse = kit.gain(0);
    this.low = kit.filter('bandpass', 2400, 16);
    this.high = kit.filter('bandpass', 3900, 12);
    this.output = kit.gain(1);
    impulse.connect(this.pulse);
    chain(this.pulse, this.low, this.output);
    chain(this.pulse, this.high, kit.gain(0.6), this.output);
  }

  trigger(time, lowHz, highHz, level) {
    this.low.frequency.setTargetAtTime(lowHz, time - RETUNE, RETUNE_GLIDE);
    this.high.frequency.setTargetAtTime(highHz, time - RETUNE, RETUNE_GLIDE);
    // A blip a fraction of a millisecond long: near enough an impulse for the resonators.
    const gain = this.pulse.gain;
    gain.setTargetAtTime(level, time, 0.00004);
    gain.setTargetAtTime(0, time + 0.00012, 0.00009);
  }
}
