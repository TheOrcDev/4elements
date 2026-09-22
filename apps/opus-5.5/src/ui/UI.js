import { ELEMENTS } from '../config.js';

/** Inline SVG of the alchemical symbol for an element (or the "all" sigil). */
export function glyphSVG(id) {
  const attrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"';
  if (id === 'all') {
    return `<svg ${attrs}><circle cx="12" cy="12" r="8.6"/><path d="M12 3.4 20.6 12 12 20.6 3.4 12Z"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>`;
  }
  const up = id === 'fire' || id === 'air';
  const tri = up ? 'M12 3.2 21.4 19.5H2.6Z' : 'M12 20.8 21.4 4.5H2.6Z';
  const bar = id === 'air' ? '<path d="M3.6 12.6h16.8"/>' : id === 'earth' ? '<path d="M3.6 11.4h16.8"/>' : '';
  return `<svg ${attrs}><path d="${tri}"/>${bar}</svg>`;
}

const ORDINALS = ['The first element', 'The second element', 'The third element', 'The fourth element'];

export class UI {
  constructor(app, soundscape) {
    this.app = app;
    this.sound = soundscape;
    this.$ = (id) => document.getElementById(id);
    this.root = this.$('ui');
    this.info = this.$('info');
    this.dock = this.$('dock');
    this.tooltip = this.$('tooltip');
    this.hint = this.$('hint');
    this.pointer = { x: 0, y: 0, down: null, dirty: false };
    // only offer elements that exist (debug URLs like ?only=fire build a single one)
    this.available = ELEMENTS.filter((d) => app.elements.some((e) => e.def.id === d.id));
    this.#buildDock();
    this.#bind();
    app.on((e) => {
      if (e.type === 'focus' && !e.same) this.#setFocus(e.id);
      if (e.type === 'frame') this.#onFrame();
    });
  }

  static buildLoaderGlyphs() {
    const ring = document.getElementById('loader-glyphs');
    if (!ring) return;
    ring.innerHTML = ELEMENTS.map((d, i) => {
      const a = (i / ELEMENTS.length) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * 36, y = Math.sin(a) * 36;
      return `<span style="transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px); color:${d.color}; animation-delay:${i * 0.3}s">${glyphSVG(d.id)}</span>`;
    }).join('');
  }

  static setProgress(label, value) {
    const s = document.getElementById('loader-status');
    const b = document.getElementById('loader-bar');
    if (s) s.textContent = `${label}…`;
    if (b) b.style.width = `${Math.round(value * 100)}%`;
  }

  reveal() {
    this.$('loader')?.classList.add('is-done');
    this.root.classList.add('is-ready');
  }

  #buildDock() {
    const all = `<button data-focus="all" class="is-active" style="--c:#e9dcc0" aria-pressed="true" title="Overview (0)">${glyphSVG('all')}<span class="dock__label">Sanctum</span></button><span class="dock__sep" aria-hidden="true"></span>`;
    const items = this.available.map(
      (d) => `<button data-focus="${d.id}" style="--c:${d.color}" aria-pressed="false" title="${d.name} (${d.key})">${glyphSVG(d.id)}<span class="dock__label">${d.name}</span><kbd>${d.key}</kbd></button>`,
    ).join('');
    this.dock.innerHTML = all + items;
  }

  #bind() {
    const app = this.app;
    document.addEventListener('click', (e) => {
      const f = e.target.closest('[data-focus]');
      if (f) {
        app.focus(f.dataset.focus);
        this.#nudge();
      }
      const step = e.target.closest('[data-step]');
      if (step) this.#step(parseInt(step.dataset.step, 10));
    });

    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const def = this.available.find((d) => d.key === k);
      if (def) app.focus(def.id);
      else if (k === 'escape' || k === '0') app.focus('all');
      else if (k === 'arrowright') this.#step(1);
      else if (k === 'arrowleft') this.#step(-1);
      else if (k === 'r') this.#toggleRotate();
      else if (k === 's') this.#toggleSound();
      else if (k === 'h') this.#toggleUI();
      else if (k === 'f') this.#toggleFullscreen();
      else return;
      this.#nudge();
    });

    this.$('btn-rotate').addEventListener('click', () => this.#toggleRotate());
    this.$('btn-sound').addEventListener('click', () => this.#toggleSound());
    this.$('btn-ui').addEventListener('click', () => this.#toggleUI());
    this.$('btn-full').addEventListener('click', () => this.#toggleFullscreen());

    const canvas = app.canvas;
    canvas.addEventListener('pointerdown', (e) => {
      this.pointer.down = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.#nudge();
    });
    canvas.addEventListener('pointerup', (e) => {
      const d = this.pointer.down;
      this.pointer.down = null;
      if (!d) return;
      const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
      if (moved < 6 && performance.now() - d.t < 450) {
        const id = app.pick(this.#ndc(e.clientX, e.clientY));
        if (id) app.focus(id);
      }
    });
    canvas.addEventListener('dblclick', (e) => {
      if (!app.pick(this.#ndc(e.clientX, e.clientY))) app.focus('all');
    });
    canvas.addEventListener('pointermove', (e) => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.dirty = true;
    });
    canvas.addEventListener('pointerleave', () => {
      app.hovered = null;
      this.tooltip.classList.remove('is-visible');
    });
    canvas.addEventListener('wheel', () => this.#nudge(), { passive: true });
    app.rig.controls.addEventListener('start', () => this.#nudge());
  }

  #toast(text) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'tooltip';
      t.style.cssText = 'left:50%;top:auto;bottom:32px;transform:translateX(-50%);font-family:var(--sans);letter-spacing:.02em;font-size:12px;color:var(--muted)';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('is-visible');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('is-visible'), 2600);
  }

  #ndc(x, y) {
    return { x: (x / window.innerWidth) * 2 - 1, y: -(y / window.innerHeight) * 2 + 1 };
  }

  #onFrame() {
    const app = this.app;
    if (!this.pointer.dirty || this.pointer.down || app.rig.busy) return;
    this.pointer.dirty = false;
    const id = app.pick(this.#ndc(this.pointer.x, this.pointer.y));
    app.hovered = id;
    app.canvas.style.cursor = id ? 'pointer' : '';
    const def = ELEMENTS.find((d) => d.id === id);
    if (def && id !== app.focused) {
      this.tooltip.textContent = def.name;
      this.tooltip.style.color = def.color;
      this.tooltip.style.left = `${this.pointer.x}px`;
      this.tooltip.style.top = `${this.pointer.y}px`;
      this.tooltip.classList.add('is-visible');
    } else {
      this.tooltip.classList.remove('is-visible');
    }
  }

  #setFocus(id) {
    for (const b of this.dock.querySelectorAll('button')) {
      const on = b.dataset.focus === (id ?? 'all');
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    }
    this.tooltip.classList.remove('is-visible');
    const def = ELEMENTS.find((d) => d.id === id);
    if (!def) {
      this.info.classList.remove('is-open');
      this.info.setAttribute('aria-hidden', 'true');
      return;
    }
    const i = ELEMENTS.indexOf(def);
    this.info.style.setProperty('--accent', def.color);
    this.$('info-glyph').innerHTML = glyphSVG(def.id);
    this.$('info-eyebrow').textContent = ORDINALS[i];
    this.$('info-name').textContent = def.name;
    this.$('info-greek').textContent = `${def.greek}  ·  ${def.latin}`;
    this.$('info-motto').textContent = def.motto;
    this.$('info-text').textContent = def.text;
    this.$('info-qualities').textContent = def.qualities.join(' & ');
    this.$('info-solid').textContent = def.solid;
    // restart the entrance transition when hopping between elements
    this.info.classList.remove('is-open');
    void this.info.offsetWidth;
    this.info.classList.add('is-open');
    this.info.setAttribute('aria-hidden', 'false');
  }

  #step(dir) {
    const ids = this.available.map((d) => d.id);
    if (!ids.length) return;
    const cur = ids.indexOf(this.app.focused);
    const next = cur < 0 ? (dir > 0 ? 0 : ids.length - 1) : (cur + dir + ids.length) % ids.length;
    this.app.focus(ids[next]);
  }

  #nudge() {
    this.app.poke();
    if (!this.hint.classList.contains('is-faded')) {
      clearTimeout(this._hintT);
      this._hintT = setTimeout(() => this.hint.classList.add('is-faded'), 2500);
    }
  }

  #toggleRotate() {
    const on = !this.app.autoOrbit;
    this.app.autoOrbit = on;
    this.$('btn-rotate').setAttribute('aria-pressed', String(on));
  }

  async #toggleSound() {
    const btn = this.$('btn-sound');
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    try {
      if (on) await this.sound.enable();
      else this.sound.disable();
    } catch (err) {
      console.warn('Audio unavailable', err);
      btn.setAttribute('aria-pressed', 'false');
    }
  }

  #toggleUI() {
    const hidden = this.root.classList.toggle('is-hidden');
    if (hidden) this.#toast('Interface hidden — press H to bring it back');
  }

  #toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
}
