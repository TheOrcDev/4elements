// Elementa's soundscape: a quiet dusk on an endless flooded plain, with the four elements
// sounding from where they stand. Everything is synthesised with the Web Audio API; there are
// no audio files. This file owns the AudioContext and its life cycle; the sound itself is
// built in graph.js (which also runs offline) from the sources in ./sources.
//
// The life cycle has one rule: `_enabled` says what is wanted, and everything else follows it.
// Switched on, the context runs and the master is open; switched off, the master closes and
// the context is suspended once the fade is over, so a silent soundscape costs nothing. Every
// call may arrive at any moment and any number of times (a tab that is hidden and shown again
// calls stop() and start() in quick succession), so each step checks what is wanted now rather
// than what was wanted when it began.

import { buildSoundscape, soundscapeSteps } from './graph.js';
import { clamp } from './util.js';

export { buildSoundscape };

/** Time constants of the master fade. The fade-in is 98% complete after about 1.5 s... */
const FADE_IN = 0.38;
/** ...and the fade-out is inaudible well inside 0.6 s, after which the context is suspended. */
const FADE_OUT = 0.1;
const SUSPEND_AFTER = 650; // milliseconds
/** start() does not wait longer than this for a context that the browser refuses to run yet. */
const RESUME_PATIENCE = 400; // milliseconds
/** Events that count as a user gesture, in case the first resume() was refused. */
const GESTURES = ['pointerdown', 'pointerup', 'keydown', 'touchend', 'click'];

const pause = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
const ignore = () => {};

/**
 * Resolves in the idle time after the next frame has been drawn, so that work done then does
 * not come out of a frame's own budget. Without frames (a hidden tab, no window) it does not wait long.
 */
const afterFrame = () => new Promise((resolve) => {
  if (typeof requestAnimationFrame !== 'function') { setTimeout(resolve, 0); return; }
  const impatient = setTimeout(resolve, 100);
  requestAnimationFrame(() => { clearTimeout(impatient); setTimeout(resolve, 0); });
});

export class Soundscape {
  /** Creates nothing audible: the AudioContext is only made in start(), from a user gesture. */
  constructor({ seed } = {}) {
    this._seed = seed;
    this._context = null;
    this._engine = null;
    this._building = null;   // the build in progress, a promise tagged with its context
    this._enabled = false;
    this._volume = 0.8;
    this._open = false;      // where the master fader was last sent: open (true) or closed
    this._quietAt = 0;       // Date.now() by which the last fade-out is over
    this._parked = false;    // suspend() was the last thing asked of the context
    this._suspendTimer = 0;
    this._listening = false;
    this._warned = false;
    this._resume = this._resume.bind(this);
    this._park = this._park.bind(this);
    this._onStateChange = this._onStateChange.bind(this);
  }

  /** True while the soundscape is switched on (it may still be fading in). */
  get enabled() { return this._enabled; }

  /** The AudioContext, once start() has made one. */
  get context() { return this._context; }

  /**
   * Switch the sound on: create or resume the context, build the graph on first use, and fade
   * the master in. Call it from a click. Safe to call again at any time, including mid fade-out;
   * calling it while already on changes nothing.
   */
  async start() {
    this._enabled = true;
    clearTimeout(this._suspendTimer);
    this._suspendTimer = 0;

    if (!this._context) {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) {
        this._enabled = false;
        throw new Error('Web Audio is not available in this browser');
      }
      try {
        // Nothing here needs low latency, and a larger buffer is kinder to a busy machine.
        this._context = new Context({ latencyHint: 'playback' });
      } catch (error) {
        this._enabled = false;
        throw error;
      }
      this._context.addEventListener('statechange', this._onStateChange);
    }
    const context = this._context;
    // Ask for the context to run before anything else, while the click still counts. If the
    // browser holds it back all the same, the next gesture gets another go.
    const running = this._resume();
    this._listen(context.state !== 'running');
    if (!this._engine) {
      try {
        await this._build(context);
      } catch (error) {
        // Nothing to play: switch off again, so that the next start() is a clean retry.
        if (this._context === context && !this._engine) {
          this._enabled = false;
          this._apply();
        }
        throw error;
      }
    }
    await Promise.race([running, pause(RESUME_PATIENCE)]);
    // Disposed while waiting? Then this call has nothing left to do. Stopped while waiting?
    // Then _apply() closes down instead of opening up.
    if (this._context === context) this._apply();
  }

  /** Switch the sound off: fade out, then suspend the context so it costs nothing. */
  stop() {
    if (!this._enabled) return; // already off: the fade and the suspension are under way
    this._enabled = false;
    this._apply();
  }

  /**
   * Once per rendered frame while enabled.
   * @param {number} dt seconds since the previous call
   * @param {object} state camera, focus, fire intensity and lightning (see update() in graph.js)
   */
  update(dt, state) {
    // A suspended context's clock stands still: anything scheduled now would only pile up.
    if (!this._enabled || !this._engine || !state || this._context.state !== 'running') return;
    try {
      this._engine.update(dt > 0 ? Math.min(dt, 0.25) : 0, state);
    } catch (error) {
      if (!this._warned) {
        this._warned = true;
        console.warn('[soundscape] update failed:', error);
      }
    }
  }

  /** @param {number} v 0..1, a slider position; the gain follows its square, which feels even. */
  setVolume(v) {
    this._volume = clamp(Number.isFinite(v) ? v : 0, 0, 1);
    if (this._engine) this._engine.setVolume(this._gain());
  }

  /** Stop everything and release the context. The instance can be started again afterwards. */
  dispose() {
    this._enabled = false;
    this._listen(false);
    clearTimeout(this._suspendTimer);
    this._suspendTimer = 0;
    if (this._engine) this._engine.dispose();
    this._engine = null;
    this._building = null;
    this._open = false;
    this._parked = false;
    const context = this._context;
    this._context = null;
    if (context) {
      context.removeEventListener('statechange', this._onStateChange);
      if (context.state !== 'closed') context.close().catch(ignore);
    }
  }

  _gain() { return this._volume * this._volume; }

  /** The build for `context`, started on first use and shared by overlapping start() calls. */
  _build(context) {
    if (!this._building || this._building.context !== context) {
      const building = this._construct(context);
      building.context = context;
      this._building = building;
      const done = () => { if (this._building === building) this._building = null; };
      building.then(done, done);
    }
    return this._building;
  }

  /**
   * Build the graph one stage per frame (each stage is a few milliseconds of synthesis), so
   * that switching the sound on does not make the picture stutter. The first stage waits a
   * frame as well: creating the context has just held the main thread on its own.
   */
  async _construct(context) {
    const steps = soundscapeSteps(context, { seed: this._seed });
    let step;
    do {
      await afterFrame();
      if (this._context !== context) return; // disposed half-way: abandon it
      step = steps.next();
    } while (!step.done);
    this._engine = step.value;
    this._engine.setVolume(this._gain());
  }

  /** Bring the master fader, the gesture listeners and the suspension in line with `_enabled`. */
  _apply() {
    const context = this._context;
    const engine = this._engine;
    if (!context) return;
    if (this._enabled) {
      clearTimeout(this._suspendTimer);
      this._suspendTimer = 0;
      if (!engine) return; // start() is still building and comes back here
      if (!this._open) {
        this._open = true;
        // Scheduled on the context's own clock: if the browser is still holding the context
        // back, the fade simply plays once a gesture has released it.
        engine.fade(1, FADE_IN);
      }
      this._listen(context.state !== 'running');
    } else {
      this._listen(false);
      if (!engine && this._building) return; // stopped during the build: start() comes back here when it is done
      if (this._open) {
        this._open = false;
        engine.fade(0, FADE_OUT);
        this._quietAt = Date.now() + SUSPEND_AFTER;
      }
      // Never cut a fade short, and never put the suspension off either.
      if (!this._suspendTimer) this._suspendTimer = setTimeout(this._park, Math.max(0, this._quietAt - Date.now()));
    }
  }

  /** The fade-out is over: stop the context's clock, unless the sound came back on meanwhile. */
  _park() {
    this._suspendTimer = 0;
    const context = this._context;
    if (this._enabled || !context || context.state === 'closed') return;
    this._parked = true;
    context.suspend().catch(ignore);
  }

  /** resume() that never rejects, for use as an event handler and inside start(). */
  _resume() {
    const context = this._context;
    if (!context || !this._enabled || context.state === 'closed') return Promise.resolve();
    // `state` lags behind in some browsers: a context that was asked to suspend a moment ago
    // may still say "running", and needs the resume all the same.
    if (context.state === 'running' && !this._parked) return Promise.resolve();
    this._parked = false;
    return context.resume().catch(ignore);
  }

  /**
   * The context changed state by itself: the system interrupted the audio (a phone call, an
   * output device going away) or released it at last (the first gesture). Put it back to
   * where it is wanted.
   */
  _onStateChange() {
    const context = this._context;
    if (!context || context.state === 'closed') return;
    if (this._enabled) {
      if (context.state === 'running') this._listen(false);
      else { this._resume(); this._listen(true); }
    } else if (context.state === 'running') {
      this._apply();
    }
  }

  /** While the context is being held back, any gesture is a chance to resume it. */
  _listen(on) {
    if (on === this._listening || typeof window === 'undefined') return;
    this._listening = on;
    for (const type of GESTURES) {
      if (on) window.addEventListener(type, this._resume, { passive: true });
      else window.removeEventListener(type, this._resume);
    }
  }
}
