// The whole soundscape as one audio graph. It builds on any BaseAudioContext, so the same
// code plays live and renders offline (which is how it is measured).
//
//   bed (stereo) ───────────────────────────────┐
//   fire  ─┐                                    │
//   water ─┼─ ElementChannel each: level, ──────┼─► sum ─► rumble filter ─► fader ─► volume
//   earth ─┤  distance, panning, width          │            ─► compressor ─► trim ─► soft clip ─► out
//   air   ─┘        └─ reverb sends ─► reverb ──┘

import { Follower, Kit, chain } from './kit.js';
import { impulseResponseSteps } from './buffers.js';
import { ElementChannel } from './spatial.js';
import { createBed } from './sources/bed.js';
import { createFire } from './sources/fire.js';
import { createWater } from './sources/water.js';
import { createEarth } from './sources/earth.js';
import { createAir } from './sources/air.js';
import { clamp, dbToGain } from './util.js';

/**
 * The four sources: where they stand unless the frame state says otherwise, how high above
 * the water their sound comes from, how much of each goes to the reverb, and how far each is
 * raised (as a fraction of its level) while the camera is focused on it. Earth is nearly
 * silent, so it is the one you lean in to; the vortex is so tall that its close-up is taken
 * from twice as far away as the others, and gets a little more to make up for the distance.
 */
const ELEMENTS = [
  { id: 'fire', create: createFire, position: [0, 0, -10], height: 2.2, send: 0.22, boost: 0.8 },
  { id: 'water', create: createWater, position: [0, 0, 10], height: 1.8, send: 0.3, boost: 0.7 },
  { id: 'earth', create: createEarth, position: [-10, 0, 0], height: 1.6, send: 0.4, boost: 1.6 },
  { id: 'air', create: createAir, position: [10, 0, 0], height: 4.5, send: 0.35, boost: 1.25 },
];

/** While one element is in focus, the others and the bed step back by these fractions. */
const FOCUS_DUCK = 0.5;
const BED_DUCK = 0.3;

/** Overall level of the mix ahead of the fader. Sets how loud "volume 1" is. */
const MIX_LEVEL = 1.8;
/** How much of the reverb comes back into the mix: enough for air around things, never a hall. */
const REVERB_RETURN = 0.2;

/**
 * Master dynamics: a compressor that leaves the steady sound of the elements alone (the swell
 * of the waves and the gusts of the wind are the point, not something to even out) and only
 * holds back thunder and the loudest snaps, then a soft clipper as the hard ceiling. A
 * DynamicsCompressorNode adds make-up gain on its own, fixed by its curve; makeupDb is that
 * gain as measured for these settings, and gets trimmed off again so that everything below
 * the threshold passes at unity.
 */
const MASTER = { threshold: -12, knee: 10, ratio: 4, attack: 0.012, release: 0.35, makeupDb: 3.33 };

/** Output never exceeds this, whatever happens upstream. Below CLIP_KNEE the clipper is exactly linear. */
const CLIP_CEILING = 0.85;
const CLIP_KNEE = 0.5;

function softClipCurve() {
  const size = 2049;
  const room = CLIP_CEILING - CLIP_KNEE;
  const curve = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const x = (i / (size - 1)) * 2 - 1;
    const a = Math.abs(x);
    curve[i] = Math.sign(x) * (a <= CLIP_KNEE ? a : CLIP_KNEE + room * Math.tanh((a - CLIP_KNEE) / room));
  }
  return curve;
}

/**
 * Build the graph on `ctx` and connect it to `destination`, in one go.
 * The master starts silent: call fade(1, timeConstant) on the result to bring it up.
 *
 * @param {BaseAudioContext} ctx
 * @param {{ destination?: AudioNode, seed?: number }} [options]
 */
export function buildSoundscape(ctx, options) {
  const steps = soundscapeSteps(ctx, options);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/**
 * The same build as a generator that yields between its stages (each a few milliseconds of
 * synthesis), so a live page can spread it over as many frames instead of stalling one.
 * Its return value is the finished soundscape.
 */
export function* soundscapeSteps(ctx, { destination = ctx.destination, seed = 0x5eed } = {}) {
  const kit = new Kit(ctx, seed);
  yield* kit.prepare();
  yield;

  // ---- Master chain.
  const sum = kit.gain(MIX_LEVEL);
  const fader = kit.gain(0);
  const volume = kit.gain(1);
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = MASTER.threshold;
  compressor.knee.value = MASTER.knee;
  compressor.ratio.value = MASTER.ratio;
  compressor.attack.value = MASTER.attack;
  compressor.release.value = MASTER.release;
  const clipper = ctx.createWaveShaper();
  clipper.curve = softClipCurve();
  const output = chain(
    sum,
    kit.filter('highpass', 30, 0.707), // nothing useful lives down there, and no DC gets out
    fader,
    volume,
    compressor,
    kit.gain(dbToGain(-MASTER.makeupDb)),
    clipper,
  );

  // ---- Reverb: one generated impulse response shared by every send.
  const reverb = kit.filter('highpass', 150, 0.6); // rumble in a reverb is only mud
  const convolver = ctx.createConvolver();
  convolver.normalize = false;
  convolver.buffer = yield* impulseResponseSteps(ctx, kit.rng);
  const reverbReturn = kit.gain(REVERB_RETURN);
  chain(reverb, convolver, reverbReturn, sum);
  yield;

  // ---- Sources. Each gets its own random stream.
  const bed = kit.gain(1);
  bed.connect(sum);
  kit.reseed(0);
  const bedSource = createBed(kit, bed);
  const bedFollower = new Follower(bed.gain, 0.4, 0.004);

  const channels = {};
  const sources = {};
  const positions = {};
  const weights = {};
  const present = {};
  for (let i = 0; i < ELEMENTS.length; i++) {
    const element = ELEMENTS[i];
    yield;
    kit.reseed(i + 1);
    channels[element.id] = new ElementChannel(kit, sum, reverb, element.send);
    sources[element.id] = element.create(kit, channels[element.id], bed);
    positions[element.id] = element.position.slice();
    weights[element.id] = 0;
    present[element.id] = true;
  }
  yield;

  // Everything exists: connect the output and start every source on the same sample.
  output.connect(destination);
  kit.start(ctx.currentTime + 0.05);

  // Scratch vectors for update(): nothing is allocated per frame.
  const origin = { x: 0, y: 0, z: 0 };
  const forward = { x: 0, y: 0, z: -1 };
  const right = { x: 1, y: 0, z: 0 };

  /** Copy a direction from the frame state, or use the fallback when it is missing or degenerate. */
  function readAxis(out, v, fx, fy, fz) {
    let x = v ? v.x : NaN;
    let y = v ? v.y : NaN;
    let z = v ? v.z : NaN;
    let length = Math.sqrt(x * x + y * y + z * z);
    if (!(length > 1e-6)) { x = fx; y = fy; z = fz; length = Math.sqrt(x * x + y * y + z * z) || 1; }
    out.x = x / length;
    out.y = y / length;
    out.z = z / length;
  }

  /**
   * Once per frame. Moves every source to where the camera now hears it, applies the focus
   * emphasis and lets each source schedule its coming events.
   *
   * @param {number} dt seconds since the previous call
   * @param {object} state
   *   cameraPosition, cameraForward, cameraRight: {x, y, z};
   *   focusWeights: {fire, water, earth, air} each 0..1 (or just focusId);
   *   elements: [{id, position: [x, y, z]}]; fireIntensity: number; flash: number.
   */
  function update(dt, state) {
    const now = ctx.currentTime;
    const camera = state.cameraPosition || origin;
    const cx = Number.isFinite(camera.x) ? camera.x : 0;
    const cy = Number.isFinite(camera.y) ? camera.y : 0;
    const cz = Number.isFinite(camera.z) ? camera.z : 0;
    // Without axes from the caller, assume a level camera looking at the middle of the ring.
    readAxis(forward, state.cameraForward, -cx, 0, -cz - 1e-3);
    readAxis(right, state.cameraRight, -forward.z, 0, forward.x);

    // The elements in the scene and where they stand, as [x, y, z]. A list that names only
    // some of them (a view with one element loaded) silences the rest; an unreadable position
    // leaves the last known place.
    if (Array.isArray(state.elements)) {
      let listed = 0;
      for (let i = 0; i < ELEMENTS.length; i++) present[ELEMENTS[i].id] = false;
      for (let i = 0; i < state.elements.length; i++) {
        const entry = state.elements[i];
        const position = entry && positions[entry.id];
        if (!position) continue;
        present[entry.id] = true;
        listed++;
        const given = entry.position;
        if (given) for (let axis = 0; axis < 3; axis++) if (Number.isFinite(given[axis])) position[axis] = given[axis];
      }
      if (listed === 0) for (let i = 0; i < ELEMENTS.length; i++) present[ELEMENTS[i].id] = true;
    }

    // Focus weights, and the two largest of them: each element ducks under the strongest other one.
    let first = 0;
    let second = 0;
    let leader = '';
    for (let i = 0; i < ELEMENTS.length; i++) {
      const id = ELEMENTS[i].id;
      const given = state.focusWeights ? state.focusWeights[id] : state.focusId === id ? 1 : 0;
      const weight = given > 0 ? Math.min(given, 1) : 0;
      weights[id] = weight;
      if (weight > first) { second = first; first = weight; leader = id; } else if (weight > second) second = weight;
    }

    for (let i = 0; i < ELEMENTS.length; i++) {
      const { id, height, boost } = ELEMENTS[i];
      const weight = weights[id];
      const rival = id === leader ? second : first;
      const emphasis = present[id] ? 1 + boost * weight - FOCUS_DUCK * rival * (1 - weight) : 0;
      const position = positions[id];
      channels[id].place(now, emphasis, position[0] - cx, position[1] + height - cy, position[2] - cz, forward, right);
      // An element that is not in the scene is silent: nothing needs scheduling for it.
      if (present[id]) sources[id].update(now, dt, state);
    }
    bedFollower.to(1 - BED_DUCK * first, now);
    bedSource.update(now, dt, state);
  }

  return {
    context: ctx,
    /** name -> GainNode at the output of each layer ("fire.roar", "air.thunder", ...). */
    layers: kit.layers,
    /** id -> ElementChannel; channel.output is that element's positioned stereo signal. */
    channels,
    reverbReturn,
    update,

    /** Glide the master fader toward `target` (0 = silent, 1 = open). */
    fade(target, timeConstant) {
      fader.gain.setTargetAtTime(target, ctx.currentTime, timeConstant);
    },

    /** Glide the volume toward a linear gain. */
    setVolume(gain) {
      volume.gain.setTargetAtTime(clamp(gain, 0, 1.5), ctx.currentTime, 0.06);
    },

    dispose() {
      output.disconnect();
      kit.dispose();
    },
  };
}
