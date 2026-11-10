// Graph-building helpers bound to one audio context: node factories with the defaults this
// soundscape wants, a registry of every started source (so the graph can be torn down) and of
// every named layer (so levels can be metered or mixed from outside).

import { createRng } from './util.js';
import { noiseBufferSteps, toBuffer } from './buffers.js';

const GOLDEN = 0.6180339887;

/** Lanes of an element's signal: what gets panned, the stereo difference, and the extra reverb feed. */
export const MID = 0;
export const SIDE = 1;
export const WET = 2;
/** Lanes of the bed, which is plain stereo. */
export const LEFT = 0;
export const RIGHT = 1;

/** Connect nodes in series and return the last one. */
export function chain(...nodes) {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
  return nodes[nodes.length - 1];
}

/** The very first value a Follower is given arrives this quickly: the master is still closed then. */
const FIRST_GLIDE = 0.015;

/**
 * Glides an AudioParam toward values handed to it from the frame loop. It only talks to the
 * param when the value has actually moved, and always through setTargetAtTime, so nothing it
 * drives can step or click. Values that are not finite numbers are ignored.
 */
export class Follower {
  constructor(param, timeConstant, epsilon = 0.002) {
    this.param = param;
    this.timeConstant = timeConstant;
    this.epsilon = epsilon;
    this.last = NaN;
  }

  to(value, now) {
    if (!Number.isFinite(value) || Math.abs(value - this.last) <= this.epsilon) return;
    // On first use there is nothing to glide from but the placeholder the node was built with.
    const first = Number.isNaN(this.last);
    this.param.setTargetAtTime(value, now, first ? Math.min(this.timeConstant, FIRST_GLIDE) : this.timeConstant);
    this.last = value;
  }
}

/**
 * One named voice group of the mix. Mono sources are routed into numbered lanes (see MID /
 * SIDE / WET), which travel together through a single level gain into the destination.
 */
export class Layer {
  /** @param insert optional node every lane passes through before the level gain */
  constructor(kit, name, level, destination, lanes, insert) {
    this.kit = kit;
    this.merger = kit.ctx.createChannelMerger(lanes);
    this.output = kit.gain(level);
    if (insert) chain(this.merger, insert, this.output, destination);
    else chain(this.merger, this.output, destination);
    kit.layers.set(name, this.output);
  }

  /** Route a mono node into a lane, optionally scaled (a negative gain flips its side). */
  add(lane, node, gain = 1) {
    if (gain === 1) {
      node.connect(this.merger, 0, lane);
    } else {
      const trim = this.kit.gain(gain);
      node.connect(trim);
      trim.connect(this.merger, 0, lane);
    }
    return this;
  }
}

export class Kit {
  constructor(ctx, seed) {
    this.ctx = ctx;
    this.seed = seed;
    this.rng = createRng(seed);
    /** colour -> AudioBuffer, filled by prepare(). */
    this.noise = {};
    /** name -> output GainNode of every layer. */
    this.layers = new Map();
    this._sources = [];
    this._noiseLoops = 0;
  }

  /** Synthesise the shared noise loops. A generator, to be run to its end before anything else is built. */
  prepare() {
    return noiseBufferSteps(this.ctx, this.rng, this.noise);
  }

  /**
   * Give the next source its own random stream, so that changing one source never reshuffles
   * the gusts, waves and crackles of the others.
   */
  reseed(salt) {
    this.rng = createRng(this.seed + Math.imul(salt + 1, 0x9e3779b1));
  }

  gain(value = 1) {
    const node = this.ctx.createGain();
    node.gain.value = value;
    return node;
  }

  /**
   * Biquad filter. Its parameters are switched to control rate: they only ever move slowly
   * here, and it stops a modulated filter from recomputing coefficients for every sample.
   */
  filter(type, frequency, q = 0.707, gainDb = 0) {
    const node = this.ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = q;
    node.gain.value = gainDb;
    for (const param of [node.frequency, node.detune, node.Q, node.gain]) {
      try { param.automationRate = 'k-rate'; } catch { /* audio rate works too, just costs more */ }
    }
    return node;
  }

  /**
   * A looping noise source: 'white', 'pink' or 'brown'. Every call reads the shared loop from
   * a different point, so no two layers ever carry the same signal.
   */
  noiseLoop(colour) {
    const node = this.ctx.createBufferSource();
    node.buffer = this.noise[colour];
    node.loop = true;
    const offset = ((++this._noiseLoops * GOLDEN) % 1) * node.buffer.duration;
    this._sources.push({ node, offset });
    return node;
  }

  /** A looping source for audio rendered ahead of time (samples at the context's rate). */
  loop(samples) {
    return this.control(samples, this.ctx.sampleRate);
  }

  /**
   * A slow control signal: `points` played at `pointRate` values per second, looping, with the
   * source node interpolating linearly between them. Connect it to an AudioParam (through
   * modulate or vca) for random movement that costs nothing per frame.
   */
  control(points, pointRate) {
    const node = this.ctx.createBufferSource();
    node.buffer = toBuffer(this.ctx, points);
    node.loop = true;
    node.playbackRate.value = pointRate / this.ctx.sampleRate;
    this._sources.push({ node, offset: 0 });
    return node;
  }

  oscillator(frequency, wave = 'sine') {
    const node = this.ctx.createOscillator();
    if (typeof wave === 'string') node.type = wave; else node.setPeriodicWave(wave);
    node.frequency.value = frequency;
    this._sources.push({ node });
    return node;
  }

  /** A constant signal, for values that several params share or that get gated into impulses. */
  constant(value = 1) {
    const node = this.ctx.createConstantSource();
    node.offset.value = value;
    this._sources.push({ node });
    return node;
  }

  /** Add `source * depth` to an AudioParam; the param's own value stays the resting point. */
  modulate(param, source, depth) {
    const scale = this.gain(depth);
    source.connect(scale);
    scale.connect(param);
    return scale;
  }

  /** An amplifier opened by a control signal: gain = (rest + depth * control) * level. */
  vca(control, rest, depth, level = 1) {
    const node = this.gain(rest * level);
    this.modulate(node.gain, control, depth * level);
    return node;
  }

  layer(name, level, destination, { lanes = 3, insert = null } = {}) {
    return new Layer(this, name, level, destination, lanes, insert);
  }

  /** Start every source at the same instant so paired control curves stay in step. */
  start(when) {
    for (const { node, offset } of this._sources) {
      if (offset === undefined) node.start(when); else node.start(when, offset);
    }
  }

  dispose() {
    for (const { node } of this._sources) {
      try { node.stop(); } catch { /* never started */ }
      node.disconnect();
    }
    this._sources.length = 0;
    this.layers.clear();
  }
}
