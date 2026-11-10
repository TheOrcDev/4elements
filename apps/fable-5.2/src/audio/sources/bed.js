// BED — the plain itself: far-off air, the faintest lapping of the water film, and the rush
// of air past the ears whenever the camera travels. Plain stereo, not positioned: it is
// everywhere. Left and right are built from unrelated noise and drift apart slowly, which is
// what makes the space feel wide.

import { chain, Follower, LEFT, RIGHT } from '../kit.js';
import { mapCurve, unitCurve } from '../buffers.js';
import { smoothstep } from '../util.js';

const LEVEL = { air: 0.06, lap: 0.18, rush: 0.2 };

/** Camera speeds in metres per second: where the rush starts, and where it is at its fullest. */
const RUSH_FROM = 1.5;
const RUSH_FULL = 28;
/** Faster than this is not a flight but a cut from one view to another, and makes no sound. */
const CUT_SPEED = 150;
/** Seconds without a frame after which the camera's last known position no longer counts. */
const STALE_AFTER = 0.3;

export function createBed(kit, destination) {
  const { rng } = kit;
  const air = kit.layer('bed.air', LEVEL.air, destination, { lanes: 2 });
  const lap = kit.layer('bed.lap', LEVEL.lap, destination, { lanes: 2 });
  const rush = kit.layer('bed.rush', LEVEL.rush, destination, { lanes: 2 });

  // How fast the camera is travelling, 0 at rest to 1 in full flight.
  const travel = kit.constant(0);
  const travelFollower = new Follower(travel.offset, 0.2, 0.005);

  [LEFT, RIGHT].forEach((lane, i) => {
    // Distant air: a soft band of noise breathing over half a minute, with a low hush under it.
    const seconds = 67 + 5 * i;
    const drift = kit.control(unitCurve(rng, seconds * 4, seconds, 0.015, 0.2, 0.6), 4);
    air.add(lane, chain(kit.noiseLoop('pink'), kit.filter('highpass', 140, 0.6), kit.filter('lowpass', 1300, 0.6), kit.vca(drift, 0.55, 0.45)));
    air.add(lane, chain(kit.noiseLoop('brown'), kit.filter('highpass', 60, 0.7), kit.filter('lowpass', 200, 0.6)), 0.5);

    // Lapping: small soft swells a few seconds apart, never in step between the two sides.
    const lapSeconds = 31 + 6 * i;
    const swell = kit.control(mapCurve(unitCurve(rng, lapSeconds * 10, lapSeconds, 0.2, 0.55, 0.2), (v) => smoothstep(0.5, 0.95, v)), 10);
    lap.add(lane, chain(kit.noiseLoop('pink'), kit.filter('bandpass', 850 + 150 * i, 0.9), kit.vca(swell, 0.05, 0.95)));

    // Rush: a band of noise that opens and rises in pitch with the camera's speed.
    const band = kit.filter('bandpass', 480 + 130 * i, 0.7);
    const gate = kit.gain(0);
    kit.modulate(band.detune, travel, 1000);
    travel.connect(gate.gain);
    rush.add(lane, chain(kit.noiseLoop('pink'), band, gate));
  });

  let lastX = NaN;
  let lastY = NaN;
  let lastZ = NaN;
  let lastNow = -Infinity;

  return {
    update(now, dt, state) {
      const camera = state.cameraPosition;
      if (!camera) return;
      const distance = Math.sqrt((camera.x - lastX) ** 2 + (camera.y - lastY) ** 2 + (camera.z - lastZ) ** 2);
      // After a break in the frame loop (sound switched off and on again) the last position is
      // stale, and wherever the camera went meanwhile is not a flight.
      const stale = now - lastNow > STALE_AFTER;
      lastX = camera.x;
      lastY = camera.y;
      lastZ = camera.z;
      lastNow = now;
      // The first frame, a paused frame and a cut all count as standing still.
      const speed = !stale && dt > 1e-4 && distance / dt < CUT_SPEED ? distance / dt : 0;
      travelFollower.to(smoothstep(RUSH_FROM, RUSH_FULL, speed), now);
    },
  };
}
