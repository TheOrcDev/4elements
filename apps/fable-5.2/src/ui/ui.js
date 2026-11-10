// Elementa — interface layer.
//
// A quiet, editorial overlay on the scene: the loading screen, the wordmark, a dock of
// the four alchemical signs, a museum-label caption for the focused element, a few view
// controls and the keyboard map. It talks to the scene only through the App's public
// surface (meta, focus(), on(), setQuality(), ...) and reads every optional part of it
// defensively, so it keeps working while the core grows.
//
// The root ignores pointer input (see ui.css); only the controls opt back in, so
// dragging and scrolling reach the canvas everywhere else.
//
// Keyboard: 1-4 focus an element, 0 / Escape overview, Left / Right cycle, T tour,
// Space pause, O auto-orbit, M sound, Q quality, F fullscreen, H hide the interface,
// ` frame-rate readout, ? the list of these keys.

import './ui.css';
import { ICONS, sign } from './icons.js';
import { createSolid } from './solids.js';

const QUALITIES = ['low', 'medium', 'high', 'ultra'];
const NUMERALS = ['I', 'II', 'III', 'IV'];
const FONTS = ['500 19px "Cormorant Garamond Variable"', 'italic 400 19px "Cormorant Garamond Variable"', '500 10px "Manrope Variable"'];

// The keyboard map as the legend lists it: key caps, then what they do.
const KEYS = [
  [['1', '–', '4'], 'Focus an element'],
  [['←', '→'], 'Previous · next'],
  [['0', 'Esc'], 'Overview'],
  [['T'], 'Tour'],
  [['Space'], 'Pause'],
  [['O'], 'Auto-orbit'],
  [['M'], 'Sound'],
  [['Q'], 'Quality'],
  [['F'], 'Fullscreen'],
  [['H'], 'Hide interface'],
  [['`'], 'Frame rate'],
];

// Timings, in milliseconds.
const INTRO = 4200;          // the opening fade of the interface (see --in in ui.css)
const LOADER_FADE = 2300;    // the loading screen's cross-fade into the scene
const HINT_DELAY = 3400;     // after "ready", before the hint appears
const HINT_LIFE = 9000;      // how long the hint stays if nothing is touched
const HINT_MIN = 1500;       // and the least it stays, so a drag in progress does not swallow it
const TOAST_LIFE = 2000;
const NUDGE_DELAY = 16000;   // after "ready", before the one invitation to switch the sound on
const NUDGE_LIFE = 6500;
const CAPTION_SWAP = 330;    // the old caption leaves before the next one enters
const GHOST_LIFE = 2600;     // the "show interface" eye stays this long after pointer activity

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const safeColor = (value) => (/^#[0-9a-f]{3,8}$/i.test(value) ? value : '#f4f0e8');

const tip = (label, key) => `<span class="tip" aria-hidden="true"><span>${label}</span>${key ? `<kbd>${key}</kbd>` : ''}</span>`;
const keycap = (key) => {
  if (key === '–') return '<span>–</span>';
  if (key === '←') return `<kbd>${ICONS.left}<span class="ui__sr">Left arrow</span></kbd>`;
  if (key === '→') return `<kbd>${ICONS.right}<span class="ui__sr">Right arrow</span></kbd>`;
  if (key === '`') return '<kbd class="kbd--tick">`</kbd>';
  return `<kbd>${esc(key)}</kbd>`;
};

/** Static markup of the interface; everything that changes is filled in by createUI. */
function markup(meta, { touch, tour }) {
  const dock = meta.map((m, i) => `
      <button type="button" class="dock__btn" data-action="focus" data-id="${esc(m.id)}" style="--tint:${safeColor(m.color)}"
        aria-pressed="false" aria-keyshortcuts="${i + 1}" aria-label="${esc(m.name)}">
        ${sign(m.id)}<span class="dock__name" aria-hidden="true">${esc(m.name)}</span>
      </button>`).join('');
  const tourButton = !tour ? '' : `
      <span class="dock__rule" aria-hidden="true"></span>
      <button type="button" class="dock__btn dock__btn--tour" data-action="tour" aria-pressed="false" aria-keyshortcuts="T" aria-label="Tour: visit every element in turn">
        ${ICONS.tour}<span class="dock__name" aria-hidden="true">Tour</span>
      </button>`;
  const menu = QUALITIES.map((q) => `
          <button type="button" class="menu__item" role="menuitemradio" aria-checked="false" tabindex="-1"
            data-action="quality" data-quality="${q}">${capitalise(q)}</button>`).join('');
  const legend = KEYS.filter(([, label]) => tour || label !== 'Tour').map(([keys, label]) => `
            <div><dt>${keys.map(keycap).join('')}</dt><dd>${label}</dd></div>`).join('');
  return `
    <div class="ui__part ui__scrim ui__scrim--top"></div>
    <div class="ui__part ui__scrim ui__scrim--bottom"></div>

    <header class="top">
      <h1 class="ui__part wordmark">
        <button type="button" class="wordmark__btn" data-action="overview" aria-label="Elementa. Back to the overview">
          <span class="wordmark__name">Elementa</span>
          <span class="wordmark__sub">The four elements</span>
        </button>
      </h1>
      <div class="controls" role="group" aria-label="Scene controls">
        <button type="button" class="ui__part ctl" data-action="sound" aria-pressed="false" aria-keyshortcuts="M" aria-label="Sound">${ICONS.sound}${tip('Sound', 'M')}</button>
        <button type="button" class="ui__part ctl" data-action="orbit" aria-pressed="false" aria-keyshortcuts="O" aria-label="Auto-orbit">${ICONS.orbit}${tip('Auto-orbit', 'O')}</button>
        <div class="quality">
          <button type="button" class="ui__part ctl" data-action="menu" aria-haspopup="menu" aria-expanded="false" aria-controls="ui-quality" aria-keyshortcuts="Q" aria-label="Quality">${ICONS.quality}${tip('Quality', 'Q')}</button>
          <div class="panel menu" id="ui-quality" role="menu" aria-label="Render quality">
            <p class="panel__title" aria-hidden="true">Quality</p>${menu}
          </div>
        </div>
        <button type="button" class="ui__part ctl" data-action="fullscreen" aria-pressed="false" aria-keyshortcuts="F" aria-label="Fullscreen">${ICONS.fullscreen}${tip('Fullscreen', 'F')}</button>
        <button type="button" class="ui__part ctl ctl--keys" data-action="keys" aria-expanded="false" aria-controls="ui-keys" aria-keyshortcuts="?" aria-label="Keyboard shortcuts">${ICONS.keys}${tip('Keyboard', '?')}</button>
        <button type="button" class="ui__part ctl ctl--hide" data-action="hide" aria-pressed="false" aria-keyshortcuts="H" aria-label="Hide interface">${ICONS.eye}${tip('Hide interface', 'H')}</button>
        <div class="panel keys" id="ui-keys" role="group" aria-label="Keyboard shortcuts">
          <p class="panel__title" aria-hidden="true">Keyboard</p>
          <dl>${legend}
          </dl>
        </div>
      </div>
    </header>

    <p class="hint">
      <span>Drag to orbit</span><span>${touch ? 'Pinch' : 'Scroll'} to zoom</span><span>${touch ? 'Tap an element' : 'Click an element or press 1–4'}</span>
    </p>
    <div class="status">
      <button type="button" class="badge badge--paused" data-action="resume" aria-keyshortcuts="Space" aria-label="Paused. Resume">${ICONS.pause}<span>Paused</span></button>
      <p class="toast" role="status" aria-live="polite"></p>
    </div>
    <div class="lost" role="alertdialog" aria-labelledby="ui-lost-title" aria-describedby="ui-lost-text" aria-hidden="true">
      <p class="lost__title" id="ui-lost-title">The graphics context was lost</p>
      <p class="lost__text" id="ui-lost-text">The browser has taken back the memory this scene is drawn with. It often returns by itself; if the picture stays away, reload the page.</p>
      <button type="button" class="lost__btn" data-action="reload">Reload</button>
    </div>

    <section class="caption" aria-label="The element in view" aria-live="polite" aria-atomic="true" aria-hidden="true">
      <p class="caption__row caption__index" style="--i:0"><span data-ref="sign"></span><span data-ref="index"></span></p>
      <h2 class="caption__row caption__head" style="--i:1"><span class="caption__name" data-ref="name"></span><em class="caption__latin" lang="la" data-ref="latin"></em></h2>
      <dl class="caption__row caption__facts" style="--i:2">
        <div><dt>Qualities</dt><dd data-ref="qualities"></dd></div>
        <div><dt>Platonic solid</dt><dd><svg class="solid" viewBox="-12 -12 24 24" aria-hidden="true" focusable="false"></svg><span data-ref="solid"></span></dd></div>
      </dl>
      <p class="caption__row caption__line" style="--i:3" data-ref="line"></p>
    </section>

    <nav class="ui__part dock" aria-label="Elements">
      <button type="button" class="dock__btn" data-action="overview" aria-pressed="true" aria-keyshortcuts="0" aria-label="Overview">
        ${ICONS.overview}<span class="dock__name" aria-hidden="true">Overview</span>
      </button>
      <span class="dock__rule" aria-hidden="true"></span>${dock}${tourButton}
    </nav>

    <div class="hover-label" aria-hidden="true"></div>
    <output class="stats" aria-hidden="true"></output>`;
}

/** Normalises a key event to the names used by the keyboard map, whatever the layout. */
function keyName(event) {
  if (event.key === '?') return '?';
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(event.code);
  if (digit) return digit[1];
  if (event.code === 'Backquote') return '`';
  if (event.code === 'Space') return ' ';
  const key = String(event.key || '').toLowerCase();
  // A letter from a non-latin layout (Cyrillic, Greek, ...): fall back to the physical key.
  // Punctuation is left alone, so AZERTY's "?" on the M position is not taken for "M".
  if (key.length === 1 && (key < 'a' || key > 'z') && /\p{L}/u.test(key)) {
    const letter = /^Key([A-Z])$/.exec(event.code);
    if (letter) return letter[1].toLowerCase();
  }
  return key;
}

/**
 * Drives the static loading screen from index.html: a ring that closes with progress
 * and four signs that light as their elements arrive.
 */
function createLoader(node, meta, { still, isLoaded }) {
  if (!node) return { progress() {}, showName() {}, finish() {}, fail: () => false };
  const ring = node.querySelector('.loader__ring');
  const label = node.querySelector('.loader__label');
  const signs = new Map();
  for (const m of meta) {
    const g = node.querySelector(`.loader__sign[data-id="${m.id}"]`);
    if (g) { g.style.setProperty('--tint', safeColor(m.color)); signs.set(m, g); }
  }
  let shown = 0;
  return {
    progress(value, text) {
      shown = Math.max(shown, Math.min(1, Number(value) || 0));
      if (ring) ring.style.strokeDashoffset = String(1 - shown);
      if (label && text) label.textContent = text;
      // "Summoning Fire" lights the fire sign; by the shader stage every loaded element is lit.
      const words = String(text || '').toLowerCase().split(/\W+/);
      for (const [m, g] of signs) {
        if (words.includes(m.name.toLowerCase()) || (shown >= 0.78 && isLoaded(m.id))) g.classList.add('is-lit');
      }
    },
    /** The words wait for their typefaces rather than flashing a fallback. */
    showName() { node.classList.add('has-fonts'); },
    /** Cross-fade into the scene, then leave the document. */
    finish() {
      node.classList.add('is-done');
      node.setAttribute('aria-hidden', 'true');
      setTimeout(() => node.remove(), still ? 0 : LOADER_FADE);
    },
    /** Returns false when the screen is already gone and cannot carry the message. */
    fail(title, detail, reason) {
      if (!node.isConnected) return false;
      node.classList.add('is-failed', 'has-fonts');
      node.setAttribute('role', 'alert');
      if (label) label.textContent = title;
      for (const [name, text] of [['loader__detail', detail], ['loader__reason', reason]]) {
        const p = node.querySelector(`.${name}`) || node.appendChild(document.createElement('p'));
        p.className = name;
        p.textContent = text;
      }
      return true;
    },
  };
}

/**
 * Builds the interface inside `root` and binds it to `app`.
 * Call before app.init() so the loading screen can follow its progress.
 * @returns {{ fail(err: unknown): void, dispose(): void }}
 */
export function createUI(app, root) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const html = doc.documentElement;
  const meta = Array.isArray(app.meta) ? app.meta : [];
  const byId = new Map(meta.map((m) => [m.id, m]));
  const baseTitle = doc.title;
  const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const touch = win.matchMedia('(pointer: coarse)').matches;
  const hasTour = typeof app.setTour === 'function';
  // The screenshot tool drives a WebDriver-flagged browser: give it settled states, no transitions.
  const still = win.navigator.webdriver === true;

  // Everything registered here is undone by dispose().
  const cleanups = [];
  const timers = new Set();
  const listen = (target, type, fn, options) => {
    target.addEventListener(type, fn, options);
    cleanups.push(() => target.removeEventListener(type, fn, options));
  };
  const subscribe = (event, fn) => {
    const off = app.on?.(event, fn);
    if (typeof off === 'function') cleanups.push(off);
  };
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  };
  const cancel = (id) => { clearTimeout(id); timers.delete(id); };

  // ---------------------------------------------------------------- build
  html.classList.add('has-ui');                       // tells index.html's watchdog the loader is in hand
  root.classList.add('ui');
  root.classList.toggle('is-still', still);
  root.insertAdjacentHTML('afterbegin', markup(meta, { touch, tour: hasTour }));

  const $ = (selector) => root.querySelector(selector);
  const ref = (name) => root.querySelector(`[data-ref="${name}"]`);
  const el = {
    controls: $('.controls'),
    ctls: [...root.querySelectorAll('.ctl')],
    sound: $('[data-action="sound"]'),
    orbit: $('[data-action="orbit"]'),
    menuButton: $('[data-action="menu"]'),
    menuItems: [...root.querySelectorAll('.menu__item')],
    fullscreen: $('[data-action="fullscreen"]'),
    keysButton: $('[data-action="keys"]'),
    hide: $('[data-action="hide"]'),
    toast: $('.toast'),
    lost: $('.lost'),
    caption: $('.caption'),
    dockButtons: [...root.querySelectorAll('.dock__btn:not(.dock__btn--tour)')],
    tour: $('[data-action="tour"]'),
    hover: $('.hover-label'),
    stats: $('.stats'),
  };

  // An element can be missing (?solo=, or a module that failed to start).
  const available = (id) => !(app.elements instanceof Map) || app.elements.has(id);
  const loader = createLoader($('.loader'), meta, { still, isLoaded: available });
  const solid = createSolid($('.solid'));

  // What the interface currently shows. The show*() setters are no-ops when nothing changes,
  // so it does not matter whether a change arrives as an event or is read back after a call.
  const shown = { ready: false, focus: undefined, orbit: null, sound: null, quality: null, tour: null, paused: false, hidden: false, menu: false, keys: false, stats: false, lost: false };

  // Fonts load in parallel with the scene; the loader's words wait for their faces.
  const fontsReady = doc.fonts?.load ? Promise.all(FONTS.map((f) => doc.fonts.load(f))).catch(() => {}) : Promise.resolve();
  Promise.race([fontsReady, new Promise((resolve) => later(resolve, 1800))]).then(() => loader.showName());

  // ---------------------------------------------------------------- status line: hint and toasts
  let hintTimer = 0;
  let hintSince = 0;                                  // when it appeared; 0 while it is not showing
  let hintDone = false;                               // set once it has shown, or is no longer needed
  function showHint() {
    if (hintDone) return;
    root.classList.add('has-hint');
    hintSince = performance.now();
    hintTimer = later(() => dismissHint(true), HINT_LIFE);
  }
  /**
   * A pointer gesture dismisses the hint once it has had time to be read. `now` skips the wait:
   * a key press, a focused element or anything else that needs the line or makes the hint moot.
   */
  function dismissHint(now = false) {
    if (!hintSince) { if (now) hintDone = true; return; }
    if (!now && performance.now() - hintSince < HINT_MIN) return;
    hintSince = 0;
    hintDone = true;
    cancel(hintTimer);
    root.classList.remove('has-hint');
  }

  let toastTimer = 0;
  let toastStands = false;                            // a sticky message is up: it stays until the page goes
  /** A line of feedback at the top; silent before the scene is up and while the interface is hidden. */
  function announce(text, { sticky = false, always = false, life = TOAST_LIFE } = {}) {
    if (toastStands || (!always && (!shown.ready || shown.hidden))) return;
    toastStands = sticky;
    dismissHint(true);                                // they share the same line
    el.sound.classList.remove('is-nudged');
    el.toast.textContent = text;
    el.toast.classList.add('is-on');
    cancel(toastTimer);
    if (!sticky) toastTimer = later(() => el.toast.classList.remove('is-on'), life);
  }

  // ---------------------------------------------------------------- focus: dock and caption
  let captionTimer = 0;
  /** The solid only turns while its caption can be seen. */
  const spinSolid = () => solid.spin(!!shown.focus && !shown.hidden && !still && !reducedMotion.matches);

  /** `flight`: how long the camera takes to get there, in seconds (0 when it cuts). */
  function showCaption(m, flight) {
    cancel(captionTimer);
    const swapping = el.caption.classList.contains('is-on');
    el.caption.classList.remove('is-on');
    if (!m) {
      el.caption.setAttribute('aria-hidden', 'true');
      captionTimer = later(spinSolid, 600);
      return;
    }
    const enter = () => {
      const index = meta.indexOf(m);
      ref('sign').innerHTML = sign(m.id);
      ref('index').textContent = `${NUMERALS[index] || index + 1} / ${NUMERALS[meta.length - 1] || meta.length}`;
      ref('name').textContent = m.name;
      ref('latin').textContent = m.latin || '';
      ref('qualities').innerHTML = (m.qualities || []).map(esc).join(' <em>&amp;</em> ');
      ref('solid').textContent = m.solid || '';
      ref('line').textContent = m.line || '';
      root.style.setProperty('--accent', safeColor(m.color));
      solid.show(m.solid);
      spinSolid();
      // A flight is fastest half-way: the label resolves as the camera slows into place, a
      // third of the way in (less the time the old label took to leave). After a cut it comes
      // at once, and at start-up it follows the rest of the interface.
      const arrive = flight > 0 ? flight * 0.35 : 0.15;
      el.caption.style.setProperty('--d', `${(!shown.ready ? 2.2 : swapping ? Math.max(0.15, arrive - CAPTION_SWAP / 1000) : arrive).toFixed(2)}s`);
      el.caption.removeAttribute('aria-hidden');
      void el.caption.offsetWidth;                    // commit the hidden state so the entrance always plays
      el.caption.classList.add('is-on');
    };
    if (swapping && !still) captionTimer = later(enter, CAPTION_SWAP); else enter();
  }

  function showFocus(id, flight = 2.6) {
    const m = byId.get(id) || null;
    const next = m ? m.id : null;
    const changed = next !== shown.focus;             // focusing the same element again flies back to it, nothing more
    shown.focus = next;
    let active = null;
    for (const button of el.dockButtons) {
      const on = (button.dataset.id || null) === next;             // the overview button has no id
      button.setAttribute('aria-pressed', String(on));
      if (on) active = button;
    }
    // Keyboard users cycling with the arrows keep their place in the dock.
    if (active && el.dockButtons.includes(doc.activeElement)) active.focus();
    doc.title = m ? `${m.name} — Elementa` : baseTitle;
    if (changed) showCaption(m, flight);
    if (m) dismissHint(true);
    hideHover();
  }

  /**
   * Ask the scene to fly to an element, or back to the overview with null. (It cuts instead
   * when the visitor prefers reduced motion; that is the scene's decision, whoever asks.)
   */
  function focus(id) {
    if (!app.focus) return;
    app.focus(id);
    if ((app.focusId ?? null) !== shown.focus) showFocus(app.focusId ?? null);
  }

  function cycle(step) {
    const ids = meta.map((m) => m.id).filter(available);
    if (!ids.length) return;
    const at = ids.indexOf(shown.focus);
    focus(ids[at < 0 ? (step > 0 ? 0 : ids.length - 1) : (at + step + ids.length) % ids.length]);
  }

  // ---------------------------------------------------------------- toggles
  function showOrbit(on) {
    if (on === shown.orbit) return;
    shown.orbit = on;
    el.orbit.setAttribute('aria-pressed', String(on));
    announce(`Auto-orbit ${on ? 'on' : 'off'}`);
  }
  function toggleOrbit() {
    const next = !(app.rig?.autoOrbit ?? shown.orbit);
    app.setAutoOrbit?.(next);
    showOrbit(app.rig?.autoOrbit ?? next);
  }

  function showSound(on) {
    if (on === shown.sound) return;
    shown.sound = on;
    el.sound.setAttribute('aria-pressed', String(on));
    announce(`Sound ${on ? 'on' : 'off'}`);
  }
  let soundBusy = false;
  let soundTouched = false;                           // the visitor has found the speaker
  /** Must run inside a click or key handler: browsers only start audio on a user gesture. */
  function toggleSound() {
    const audio = app.audio;
    soundTouched = true;
    if (!audio?.setEnabled || el.sound.disabled || soundBusy) return;
    const want = !audio.enabled;
    const settle = () => {
      soundBusy = false;
      el.sound.removeAttribute('aria-busy');
      showSound(!!audio.enabled);
      if (want && !audio.enabled) announce('Sound unavailable');
    };
    soundBusy = true;                                 // the soundscape loads on first use
    el.sound.setAttribute('aria-busy', 'true');
    Promise.resolve(audio.setEnabled(want)).then(settle, settle);
  }

  /**
   * Sound starts off, as it must, and a muted speaker is easy to miss: once, when the line is
   * free, say that there is something to hear. It waits its turn and gives up rather than insist.
   */
  function nudgeSound(retry = true) {
    if (soundTouched || shown.sound !== false || el.sound.disabled) return;
    if (shown.hidden || shown.menu || shown.keys || hintSince || el.toast.classList.contains('is-on')) {
      if (retry) later(() => nudgeSound(false), 6000);
      return;
    }
    announce(touch ? 'Tap the speaker for sound' : 'This scene has sound · press M', { life: NUDGE_LIFE });
    el.sound.classList.add('is-nudged');
    later(() => el.sound.classList.remove('is-nudged'), NUDGE_LIFE);
  }

  function showQuality(name) {
    if (!QUALITIES.includes(name) || name === shown.quality) return;
    shown.quality = name;
    el.menuButton.dataset.level = String(QUALITIES.indexOf(name));
    el.menuButton.setAttribute('aria-label', `Quality: ${capitalise(name)}`);
    for (const item of el.menuItems) item.setAttribute('aria-checked', String(item.dataset.quality === name));
    announce(`Quality · ${capitalise(name)}`);
  }
  function setQuality(name) {
    app.setQuality?.(name);
    showQuality(app.qualityName ?? name);
  }

  function showPaused(paused) {
    shown.paused = !!paused;
    root.classList.toggle('is-paused', shown.paused);
    if (shown.paused) dismissHint(true);
  }
  function togglePaused() {
    app.setPaused?.(!app.paused);
    showPaused(app.paused);
  }

  // The tour walks the camera from element to element. The scene also starts one by itself on
  // an idle screen and ends it on any input; the lit dock button says why the camera is moving.
  function showTour(on) {
    on = !!on;
    if (on === shown.tour) return;
    shown.tour = on;
    el.tour?.setAttribute('aria-pressed', String(on));
    announce(`Tour ${on ? 'on' : 'off'}`);
  }
  function setTour(on) {
    if (!hasTour) return;
    app.setTour(on);
    showTour(app.tour?.on ?? on);
  }
  // The scene ends an idle-started tour on the pointer-down or key-down of the very gesture
  // that presses the Tour button, so the button acts on the state the gesture began in.
  let gesture = { tour: false, at: -Infinity };
  const noteGesture = () => { gesture = { tour: !!app.tour?.on, at: performance.now() }; };
  const tourBeforeGesture = () => (performance.now() - gesture.at < 1200 ? gesture.tour : !!app.tour?.on);

  // Fullscreen, with the WebKit-prefixed fallback older Safari still needs.
  const fullscreenElement = () => doc.fullscreenElement || doc.webkitFullscreenElement || null;
  const canFullscreen = !!(html.requestFullscreen || html.webkitRequestFullscreen) && (doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? false);
  function toggleFullscreen() {
    if (!canFullscreen) return;
    const call = fullscreenElement()
      ? (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc)
      : (html.requestFullscreen || html.webkitRequestFullscreen).call(html);
    Promise.resolve(call).catch(() => announce('Fullscreen unavailable'));
  }
  function showFullscreen() {
    const on = !!fullscreenElement();
    el.fullscreen.setAttribute('aria-pressed', String(on));
    el.fullscreen.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Fullscreen');
    el.fullscreen.querySelector('.tip span').textContent = on ? 'Exit fullscreen' : 'Fullscreen';
    fitTips();
  }

  /** Tooltips hang centred under their control; near the screen edge they slide back inside the row. */
  function fitTips() {
    const limit = el.controls.getBoundingClientRect().right - 4;
    for (const ctl of el.ctls) {
      const box = ctl.getBoundingClientRect();
      const label = ctl.querySelector('.tip');
      if (!label || !box.width) continue;
      const over = box.left + box.width / 2 + label.offsetWidth / 2 - limit;
      label.style.setProperty('--shift', `${Math.max(0, Math.ceil(over))}px`);
    }
  }
  fontsReady.then(() => { if (shown.ready) fitTips(); });

  // ---------------------------------------------------------------- panels: quality menu and key legend
  function setMenu(open, { focusItem = false, returnFocus = false } = {}) {
    if (open === shown.menu) return;
    if (open) setKeys(false);
    shown.menu = open;
    root.classList.toggle('has-menu', open);
    el.menuButton.setAttribute('aria-expanded', String(open));
    if (open && focusItem) (el.menuItems.find((item) => item.getAttribute('aria-checked') === 'true') || el.menuItems[0])?.focus();
    if (!open && returnFocus) el.menuButton.focus();
  }
  /** Arrow keys, Home / End, Escape and Tab while the menu is open. Returns true when handled. */
  function menuKey(event) {
    const at = el.menuItems.indexOf(doc.activeElement);
    const count = el.menuItems.length;
    switch (event.key) {
      case 'Escape': setMenu(false, { returnFocus: true }); break;
      case 'Tab': setMenu(false); return false;
      case 'ArrowDown': el.menuItems[(at + 1) % count].focus(); break;
      case 'ArrowUp': el.menuItems[at < 0 ? count - 1 : (at - 1 + count) % count].focus(); break;
      case 'Home': el.menuItems[0].focus(); break;
      case 'End': el.menuItems[count - 1].focus(); break;
      default: return false;
    }
    event.preventDefault();
    return true;
  }
  /** The legend stays up while its keys are tried; Escape, "?" or a click elsewhere puts it away. */
  function setKeys(open) {
    if (open === shown.keys) return;
    if (open) { setMenu(false); setHidden(false); }
    shown.keys = open;
    root.classList.toggle('has-keys', open);
    el.keysButton.setAttribute('aria-expanded', String(open));
  }

  // ---------------------------------------------------------------- hiding the interface
  let ghostTimer = 0;
  let wokeAt = 0;
  /** While hidden, pointer activity brings the eye button (and the cursor) back for a moment. */
  function wake() {
    const now = performance.now();
    if (now - wokeAt < 250) return;                   // pointermove fires far more often than this needs
    wokeAt = now;
    root.classList.add('is-awake');
    html.classList.remove('is-immersed');
    cancel(ghostTimer);
    ghostTimer = later(() => {
      root.classList.remove('is-awake');
      html.classList.toggle('is-immersed', shown.hidden);
    }, GHOST_LIFE);
  }
  function setHidden(hidden) {
    if (hidden === shown.hidden) return;
    shown.hidden = hidden;
    root.classList.toggle('is-hidden', hidden);
    el.hide.setAttribute('aria-pressed', String(hidden));
    el.hide.setAttribute('aria-label', hidden ? 'Show interface' : 'Hide interface');
    el.hide.querySelector('.tip span').textContent = hidden ? 'Show interface' : 'Hide interface';
    fitTips();
    setMenu(false);
    setKeys(false);
    hideHover();
    spinSolid();
    if (hidden) {
      const active = doc.activeElement;
      if (active && active !== el.hide && root.contains(active)) active.blur();
      announce(`Interface hidden · ${touch ? 'tap the eye' : 'press H'}`, { always: true });
      wokeAt = 0;
      wake();
    } else {
      cancel(ghostTimer);
      root.classList.remove('is-awake');
      html.classList.remove('is-immersed');
      if (!toastStands) el.toast.classList.remove('is-on');
    }
  }

  // ---------------------------------------------------------------- hover label and readout
  let hoverId = null;
  let hoverSize = [0, 0];
  let pointerDown = false;
  function hideHover() {
    hoverId = null;
    el.hover.classList.remove('is-on');
  }
  /** The scene reports the element under the pointer (or none), with the pointer's position. */
  function showHover({ id, x, y } = {}) {
    const m = byId.get(id);
    const target = !!m && m.id !== shown.focus;       // a click here would fly somewhere
    html.classList.toggle('is-pointing', target && !pointerDown);
    // No label for the element already captioned, while dragging, or with the interface hidden.
    if (!target || pointerDown || shown.hidden || !shown.ready) { hideHover(); return; }
    if (m.id !== hoverId) {
      hoverId = m.id;
      el.hover.innerHTML = `${sign(m.id)}<span>${esc(m.name)}</span>`;
      el.hover.style.setProperty('--tint', safeColor(m.color));
      hoverSize = [el.hover.offsetWidth, el.hover.offsetHeight];
    }
    // Below and to the right of the pointer, flipped or clamped at the screen edges.
    const [w, h] = hoverSize;
    const left = Math.max(8, Math.min(x + 18, win.innerWidth - w - 8));
    const top = y + 22 + h > win.innerHeight - 8 ? y - h - 14 : y + 22;
    el.hover.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    el.hover.classList.add('is-on');
  }

  function showStats(fps = app.fps, scale = app.renderScale) {
    if (!shown.stats) return;
    const parts = [`${Math.round(fps || 0)} fps`];
    if (Number.isFinite(scale)) parts.push(`scale ${Math.round(scale * 100)}%`);
    if (shown.quality) parts.push(shown.quality);
    el.stats.textContent = parts.join('  ·  ');
  }
  function toggleStats() {
    shown.stats = !shown.stats;
    root.classList.toggle('has-stats', shown.stats);
    showStats();
  }

  // ---------------------------------------------------------------- scene events
  function ready() {
    if (shown.ready) return;
    // Read the scene's state once; from here on the events keep it current.
    showQuality(app.qualityName);
    showOrbit(app.rig?.autoOrbit ?? true);
    showSound(!!app.audio?.enabled);
    showPaused(app.paused);
    showTour(app.tour?.on);
    el.sound.disabled = !app.audio?.setEnabled || app.audio.available === false;
    if (el.sound.disabled) {
      el.sound.setAttribute('aria-label', 'Sound unavailable');
      el.sound.querySelector('.tip').innerHTML = '<span>Sound unavailable</span>';
    }
    showFullscreen();                                 // also fits the tooltips, so it comes after their texts are final
    for (const button of el.dockButtons) if (button.dataset.id) button.disabled = !available(button.dataset.id);
    if (el.tour) el.tour.disabled = meta.filter((m) => available(m.id)).length < 2;
    showFocus(app.focusId ?? null);
    shown.ready = true;
    html.classList.add('is-live');                    // the canvas takes its cursors from here on

    // "?t=" asks for a given moment at once (the core skips its own fade too): no opening sequence.
    const instant = still || !!app.params?.has?.('t');
    if (instant) root.classList.add('is-still');
    void root.offsetWidth;                            // commit the resting state so the fades have a start
    loader.finish();
    root.classList.add('is-ready');
    if (instant && !still) win.requestAnimationFrame(() => win.requestAnimationFrame(() => root.classList.remove('is-still')));
    later(() => root.classList.add('is-settled'), instant ? 0 : INTRO);
    later(showHint, instant ? 0 : HINT_DELAY);
    if (!still) later(nudgeSound, NUDGE_DELAY);
  }

  subscribe('progress', ({ value, label } = {}) => loader.progress(value, label));
  subscribe('ready', ready);
  subscribe('focus', ({ id, duration } = {}) => showFocus(id ?? null, duration));
  subscribe('quality', ({ name } = {}) => showQuality(name));
  subscribe('orbit', ({ on } = {}) => showOrbit(!!on));
  subscribe('audio', ({ enabled } = {}) => showSound(!!enabled));
  subscribe('pause', ({ paused } = {}) => showPaused(paused));
  subscribe('tour', ({ on } = {}) => showTour(on));
  subscribe('hover', showHover);
  subscribe('fps', ({ fps, scale } = {}) => showStats(fps, scale));
  subscribe('contextlost', showLost);

  /**
   * The GPU context is gone and the canvas with it (the scene reloads the page if it comes
   * back). Everything steps aside for one message and one way out.
   */
  function showLost() {
    if (shown.lost) return;
    shown.lost = true;
    setMenu(false);
    setKeys(false);
    hideHover();
    dismissHint(true);
    solid.spin(false);
    loader.finish();
    html.classList.remove('is-pointing', 'is-dragging', 'is-immersed');
    root.classList.add('is-lost');
    el.lost.removeAttribute('aria-hidden');
    el.lost.querySelector('button').focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- input
  const actions = {
    focus: (button) => focus(button.dataset.id),
    overview: () => focus(null),
    tour: () => setTour(!tourBeforeGesture()),
    sound: toggleSound,
    orbit: toggleOrbit,
    menu: (button, event) => setMenu(!shown.menu, { focusItem: event.detail === 0 }),
    quality: (button, event) => { setQuality(button.dataset.quality); setMenu(false, { returnFocus: event.detail === 0 }); },
    fullscreen: toggleFullscreen,
    keys: () => setKeys(!shown.keys),
    hide: () => setHidden(!shown.hidden),
    resume: togglePaused,
  };
  listen(root, 'click', (event) => {
    const button = event.target.closest?.('[data-action]');
    if (button?.dataset.action === 'reload') { win.location.reload(); return; }
    if (!button || button.disabled || !shown.ready || shown.lost) return;
    actions[button.dataset.action]?.(button, event);
    // A mouse or touch click (detail > 0) should not leave the button holding the keyboard: Space is "pause".
    if (event.detail > 0 && doc.activeElement === button) button.blur();
  });

  listen(win, 'keydown', noteGesture, { capture: true });
  listen(win, 'keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || !shown.ready || shown.lost) return;
    const target = event.target;
    if (target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    if (shown.menu && menuKey(event)) return;
    if (shown.keys && event.key === 'Escape') { setKeys(false); event.preventDefault(); return; }

    const key = keyName(event);
    switch (key) {
      case '1': case '2': case '3': case '4':
        if (meta[Number(key) - 1]) focus(meta[Number(key) - 1].id);
        break;
      case '0': focus(null); break;
      // Escape backs out one step: a hidden interface returns before the camera goes anywhere.
      case 'escape': if (shown.hidden) setHidden(false); else focus(null); break;
      case 'arrowleft': cycle(-1); break;
      case 'arrowright': cycle(1); break;
      case ' ':
        // On a focused button, Space is that button's own key.
        if (target?.closest?.('button, a[href], [role="button"]')) return;
        if (!event.repeat) togglePaused();
        break;
      case 'h': if (!event.repeat) setHidden(!shown.hidden); break;
      case 'm': if (!event.repeat) toggleSound(); break;
      case 'o': if (!event.repeat) toggleOrbit(); break;
      case 'f': if (!event.repeat) toggleFullscreen(); break;
      case 'q': if (!event.repeat) setQuality(QUALITIES[(QUALITIES.indexOf(shown.quality) + 1) % QUALITIES.length]); break;
      case 't': if (!event.repeat) setTour(!app.tour?.on); break;
      case '?': if (!event.repeat) setKeys(!shown.keys); break;
      case '`': if (!event.repeat) toggleStats(); break;
      default: return;
    }
    event.preventDefault();
    dismissHint(true);
  });

  // Pointer bookkeeping on the window, in the capture phase so nothing can swallow it.
  listen(win, 'pointerdown', (event) => {
    noteGesture();
    pointerDown = true;
    html.classList.remove('is-pointing');
    html.classList.toggle('is-dragging', !!event.target.closest?.('.scene-canvas'));
    hideHover();
    dismissHint();
    if (shown.menu && !event.target.closest?.('.quality')) setMenu(false);
    if (shown.keys && !event.target.closest?.('.keys, .ctl--keys')) setKeys(false);
    if (shown.hidden) wake();
  }, { capture: true, passive: true });
  const release = () => { pointerDown = false; html.classList.remove('is-dragging'); };
  listen(win, 'pointerup', release, { capture: true, passive: true });
  listen(win, 'pointercancel', release, { capture: true, passive: true });
  listen(win, 'blur', release);
  listen(win, 'pointermove', () => { if (shown.hidden) wake(); }, { passive: true });
  listen(win, 'wheel', () => dismissHint(), { passive: true });
  listen(doc, 'fullscreenchange', showFullscreen);
  listen(doc, 'webkitfullscreenchange', showFullscreen);
  let fitFrame = 0;
  listen(win, 'resize', () => {
    win.cancelAnimationFrame(fitFrame);
    fitFrame = win.requestAnimationFrame(fitTips);
  });
  cleanups.push(() => win.cancelAnimationFrame(fitFrame));

  el.fullscreen.hidden = !canFullscreen;
  if (app.ready) ready();                             // created late: the scene is already up

  // ---------------------------------------------------------------- public handle
  return {
    /** The scene could not start: say so on the loading screen instead of fading it away. */
    fail(err) {
      const reason = err instanceof Error ? err.message : String(err || 'Unknown error');
      const detail = 'Elementa needs WebGL 2 and hardware acceleration. A current Chrome, Safari, Firefox or Edge should do.';
      if (!loader.fail('The scene could not start', detail, reason)) announce('The scene could not start', { sticky: true, always: true });
    },
    dispose() {
      for (const off of cleanups.splice(0)) off();
      for (const id of timers) clearTimeout(id);
      timers.clear();
      solid.dispose();
      root.replaceChildren();
      root.classList.remove('ui', 'is-still', 'is-ready', 'is-settled', 'is-hidden', 'is-awake', 'is-paused', 'is-lost', 'has-menu', 'has-keys', 'has-hint', 'has-stats');
      root.style.removeProperty('--accent');
      html.classList.remove('has-ui', 'is-live', 'is-pointing', 'is-dragging', 'is-immersed');
      doc.title = baseTitle;
    },
  };
}
