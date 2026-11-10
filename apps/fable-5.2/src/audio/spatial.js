// Places one element in the stereo field as heard from the camera.
//
// An element's sound arrives as three lanes (see kit.js): MID is the source itself, SIDE is a
// stereo-difference signal that gives it width, WET is an extra feed for the reverb. All three
// pass through one level gain and one distance low-pass, then:
//   mid  -> level difference between the ears (bounded, never hard-panned)
//         + arrival-time difference between the ears (a fraction of a millisecond)
//   side -> added to the left, subtracted from the right, scaled with how wide the element looks
//   wet  -> reverb send, which fades more slowly with distance than the dry sound does
// Every move is a glide (Follower), so the camera can cut or fly without a click.

import { chain, Follower } from './kit.js';
import { clamp } from './util.js';

/** Distance at which an element plays at its nominal level, in metres. */
const REFERENCE_DISTANCE = 12;
/** Nothing gets louder than it is at this distance. */
const NEAREST = 5;
/**
 * Level falls as distance^-ROLLOFF. Gentler than the physical 1: the camera often stands
 * nearer to a neighbouring element than to the one it frames, and the picture should win.
 */
const ROLLOFF = 0.65;
/** Sounds behind the camera drop to this fraction; in front they are at 1. */
const REAR_LEVEL = 0.3;
/** How far a source at 90 degrees is panned, 1 being hard left or right. */
const PAN_RANGE = 0.7;
/** Largest arrival-time difference between the ears, in seconds. */
const EAR_DELAY = 0.00045;
/** Element width in metres, as far as the stereo spread is concerned... */
const SPREAD = 6;
/** ...and the share of the side lane that is mixed in when an element fills the view. */
const WIDTH = 0.85;

function monoInput(kit) {
  const node = kit.gain(1);
  node.channelCount = 1;
  node.channelCountMode = 'explicit';
  return node;
}

export class ElementChannel {
  /**
   * @param dry     stereo bus the positioned sound goes to
   * @param reverb  input of the reverb
   * @param send    how much of the mid lane also feeds the reverb
   */
  constructor(kit, dry, reverb, send) {
    const { ctx } = kit;

    // Three lanes in, kept apart as three discrete channels.
    this.input = kit.gain(1);
    this.input.channelCount = 3;
    this.input.channelCountMode = 'explicit';
    this.input.channelInterpretation = 'discrete';
    this.level = kit.gain(1);
    this.distanceFilter = kit.filter('lowpass', 16000, 0.5);
    const lanes = ctx.createChannelSplitter(3);
    chain(this.input, this.level, this.distanceFilter, lanes);

    // Mid lane: level and time difference between the ears.
    this.left = kit.gain(0);
    this.right = kit.gain(0);
    this.leftDelay = ctx.createDelay(0.01);
    this.rightDelay = ctx.createDelay(0.01);
    this.leftDelay.delayTime.value = EAR_DELAY / 2;
    this.rightDelay.delayTime.value = EAR_DELAY / 2;
    this.output = ctx.createChannelMerger(2);
    lanes.connect(this.left, 0);
    lanes.connect(this.right, 0);
    chain(this.left, this.leftDelay).connect(this.output, 0, 0);
    chain(this.right, this.rightDelay).connect(this.output, 0, 1);

    // Side lane: opposite polarity in the two ears.
    this.width = kit.gain(0);
    lanes.connect(this.width, 1);
    this.width.connect(this.output, 0, 0);
    chain(this.width, kit.gain(-1)).connect(this.output, 0, 1);
    this.output.connect(dry);

    // Reverb send: a share of the mid lane plus the whole wet lane.
    this.send = monoInput(kit);
    this.send.gain.value = 0;
    lanes.connect(kit.gain(send), 0).connect(this.send);
    lanes.connect(this.send, 2);
    this.send.connect(reverb);

    this._level = new Follower(this.level.gain, 0.3, 0.004);
    this._cutoff = new Follower(this.distanceFilter.frequency, 0.15, 40);
    this._left = new Follower(this.left.gain, 0.09);
    this._right = new Follower(this.right.gain, 0.09);
    this._leftDelay = new Follower(this.leftDelay.delayTime, 0.12, 0.000004);
    this._rightDelay = new Follower(this.rightDelay.delayTime, 0.12, 0.000004);
    this._width = new Follower(this.width.gain, 0.15);
    this._send = new Follower(this.send.gain, 0.2);

    /** Distance to the camera at the last update, in metres. */
    this.distance = REFERENCE_DISTANCE;
  }

  /**
   * @param now       context time
   * @param emphasis  overall level of the element (focus boost or duck)
   * @param dx,dy,dz  vector from the camera to the source
   * @param forward   camera forward axis {x, y, z}
   * @param right     camera right axis {x, y, z}
   */
  place(now, emphasis, dx, dy, dz, forward, right) {
    const distance = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.001);
    const pan = clamp((dx * right.x + dy * right.y + dz * right.z) / distance, -1, 1);
    const facing = clamp((dx * forward.x + dy * forward.y + dz * forward.z) / distance, -1, 1);
    this.distance = distance;

    const reach = Math.max(distance, NEAREST);
    const heard = REAR_LEVEL + (1 - REAR_LEVEL) * (0.5 + 0.5 * facing);
    const gain = Math.pow(REFERENCE_DISTANCE / reach, ROLLOFF) * heard;
    const angle = (1 + pan * PAN_RANGE) * (Math.PI / 4);

    this._level.to(emphasis, now);
    this._left.to(gain * Math.cos(angle), now);
    this._right.to(gain * Math.sin(angle), now);
    this._leftDelay.to(EAR_DELAY * 0.5 * (1 + pan), now);
    this._rightDelay.to(EAR_DELAY * 0.5 * (1 - pan), now);
    this._width.to(gain * WIDTH * Math.min(1, SPREAD / reach), now);
    this._send.to(Math.sqrt(gain), now);
    // Air and distance take the top off; what is behind the listener is duller still.
    const behind = Math.max(0, -facing);
    this._cutoff.to(clamp(16000 * Math.pow(10 / reach, 0.6) * (1 - 0.4 * behind), 2500, 16000), now);
  }
}
