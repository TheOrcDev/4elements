import { ElementType, ElementalAudio } from '../audio/ElementalAudio.ts';
import { FusionMode } from '../elements/FusionElement.ts';

export interface HudCallbacks {
  onSelectElement: (element: ElementType) => void;
  onSelectFusionMode: (mode: FusionMode) => void;
  onTriggerSurge: () => void;
  onToggleAudio: () => boolean;
  onToggleCinematic: () => boolean;
  onBloomChange: (value: number) => void;
  onTurbulenceChange: (value: number) => void;
}

export const ELEMENT_INFOS: Record<ElementType, {
  title: string;
  latin: string;
  tagline: string;
  description: string;
  color: string;
  stats: { label: string; value: string; percent: number }[];
}> = {
  nexus: {
    title: 'THE ELEMENTAL NEXUS',
    latin: 'Ordo Primordialis',
    tagline: 'Cosmic convergence of the four sacred primal forces.',
    description: 'An ancient celestial sanctuary where Fire, Water, Earth, and Air exist in eternal harmonic equilibrium. From here, one can observe all primal crucibles simultaneously.',
    color: '#818cf8',
    stats: [
      { label: 'Harmonic Equilibrium', value: '100%', percent: 100 },
      { label: 'Ley Line Flux', value: '4.88 PW', percent: 85 },
      { label: 'Gravitational Constant', value: '1.00 G', percent: 50 },
      { label: 'Celestial Entropy', value: '0.012 J/K', percent: 12 }
    ]
  },
  fire: {
    title: 'IGNIS',
    latin: 'The Solar Conflagration',
    tagline: 'Incandescent plasma core radiating raw thermal energy.',
    description: 'Driven by multi-octave turbulent FBM noise and Voronoi cellular magma fissures, Ignis produces volcanic embers and solar coronal prominences reaching peak stellar temperatures.',
    color: '#f97316',
    stats: [
      { label: 'Core Temperature', value: '5,840 K', percent: 95 },
      { label: 'Thermal Convection', value: '1.82 Mach', percent: 78 },
      { label: 'Ember Dispersion', value: '1,800 /s', percent: 88 },
      { label: 'Plasma Luminosity', value: '4.2 × 10³ cd', percent: 92 }
    ]
  },
  water: {
    title: 'AQUA',
    latin: 'The Abyssal Surge',
    tagline: 'Dynamic Gerstner wave fluid sphere with caustic refractions.',
    description: 'Simulates non-linear multi-directional oceanic wave harmonics, internal Voronoi caustics network, iridescent subsurface scattering, and buoyant fluid droplets orbiting in tidal resonance.',
    color: '#06b6d4',
    stats: [
      { label: 'Wave Frequency', value: '3.20 Hz', percent: 64 },
      { label: 'Caustic Refraction', value: '1.68 n', percent: 82 },
      { label: 'Vorticity Velocity', value: '2.40 rad/s', percent: 70 },
      { label: 'Hydrostatic Pressure', value: '1.14 GPa', percent: 80 }
    ]
  },
  earth: {
    title: 'TERRA',
    latin: 'The Tectonic Monolith',
    tagline: 'Fractured continental plates harboring bioluminescent emerald geodes.',
    description: 'A deeply stratified rocky mantle interwoven with pulsing crystalline veins. Surrounded by an orbiting field of levitating mineral asteroids and suspended harmonic spores.',
    color: '#10b981',
    stats: [
      { label: 'Tectonic Rigidity', value: '8.40 Mohs', percent: 88 },
      { label: 'Mineral Density', value: '5.51 g/cm³', percent: 75 },
      { label: 'Geode Resonance', value: '432 Hz', percent: 65 },
      { label: 'Seismic Stability', value: '99.4%', percent: 94 }
    ]
  },
  air: {
    title: 'AER',
    latin: 'The Celestial Zephyr',
    tagline: 'Helical logarithmic cyclone funnel with supersonic wind streams.',
    description: 'A dual counter-rotating atmospheric vortex channeling high-velocity curl noise flow fields. Suspended gale particles ride logarithmic spirals around a calm storm eye.',
    color: '#38bdf8',
    stats: [
      { label: 'Gale Velocity', value: '340 km/h', percent: 90 },
      { label: 'Vortex Helicity', value: '3.50 rad', percent: 82 },
      { label: 'Barometric Gradient', value: '940 hPa', percent: 60 },
      { label: 'Kinetic Dispersion', value: '2.80 MW', percent: 76 }
    ]
  },
  fusion: {
    title: 'ELEMENTAL ALCHEMY',
    latin: 'Synthetica Universalis',
    tagline: 'Transmutational crucible fusing elemental matrixes into hybrid phenomena.',
    description: 'Select an alchemical formula below to trigger composite elemental reactions including Magma Cataclysm, Steam Tempest, Sandstorm, Blizzard, and the 4-Element Genesis Singularity.',
    color: '#ec4899',
    stats: [
      { label: 'Synthesis Matrix', value: 'Resonant', percent: 100 },
      { label: 'Alchemical Purity', value: '99.98%', percent: 98 },
      { label: 'Radiant Flux', value: '5.00 MW', percent: 95 },
      { label: 'Phase Coherence', value: '0.994', percent: 92 }
    ]
  }
};

export class HudOverlay {
  private container: HTMLElement;
  private callbacks: HudCallbacks;
  private activeElement: ElementType = 'nexus';
  private activeFusionMode: FusionMode = 'genesis';
  private isMuted = true;
  private isCinematic = false;
  private isHudHidden = false;

  constructor(container: HTMLElement, callbacks: HudCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.render();
    this.setupEvents();
    this.setupKeyboardShortcuts();
  }

  public setActiveElement(element: ElementType) {
    this.activeElement = element;
    this.updateInfoCard();
    this.updateNavButtons();
    this.updateFusionPills();
  }

  private render() {
    this.container.innerHTML = `
      <div id="hud-root" class="hud-container">
        <!-- TOP BRAND & QUICK CONTROLS BAR -->
        <header class="hud-header glass-panel">
          <div class="brand-group">
            <div class="brand-gem">
              <div class="gem-inner"></div>
            </div>
            <div>
              <h1 class="brand-title">ELEMENTAL NEXUS</h1>
              <span class="brand-subtitle">FOUR SACRED ELEMENTS • THREE.JS 3D ENGINE</span>
            </div>
          </div>

          <div class="header-actions">
            <button id="btn-audio" class="action-btn" title="Toggle Procedural Audio (M)">
              <svg id="icon-audio-off" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              <svg id="icon-audio-on" class="btn-icon hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <span id="label-audio">Sound: Off</span>
            </button>

            <button id="btn-cinematic" class="action-btn" title="Cinematic Orbit Tour (C)">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <span>Cinematic Tour</span>
            </button>

            <button id="btn-settings-toggle" class="action-btn" title="Visual Settings">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            <button id="btn-toggle-hud" class="action-btn" title="Toggle Clean Mode (H)">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </header>

        <!-- MAIN VIEW AREA: LEFT INFO & STATS CARD -->
        <main class="hud-body">
          <section id="element-card" class="info-card glass-panel">
            <div class="card-header">
              <span id="card-latin" class="card-tag">ORDO PRIMORDIALIS</span>
              <h2 id="card-title" class="card-title">THE ELEMENTAL NEXUS</h2>
              <p id="card-tagline" class="card-tagline">Cosmic convergence of the four sacred primal forces.</p>
            </div>

            <p id="card-desc" class="card-desc">
              An ancient celestial sanctuary where Fire, Water, Earth, and Air exist in eternal harmonic equilibrium. From here, one can observe all primal crucibles simultaneously.
            </p>

            <!-- FUSION SELECTOR (ONLY VISIBLE IN ALCHEMY MODE) -->
            <div id="fusion-selector" class="fusion-selector hidden">
              <span class="section-label">ALCHEMICAL FORMULA:</span>
              <div class="fusion-pill-group">
                <button class="fusion-pill active" data-mode="genesis">Genesis Core (All 4)</button>
                <button class="fusion-pill" data-mode="magma">Magma (Fire + Earth)</button>
                <button class="fusion-pill" data-mode="steam">Steam (Fire + Water)</button>
                <button class="fusion-pill" data-mode="sandstorm">Sandstorm (Earth + Air)</button>
                <button class="fusion-pill" data-mode="blizzard">Blizzard (Water + Air)</button>
              </div>
            </div>

            <!-- TELEMETRY STATS BARS -->
            <div class="stats-group">
              <span class="section-label">PRIMAL TELEMETRY:</span>
              <div id="stats-list" class="stats-list">
                <!-- Injected dynamically -->
              </div>
            </div>

            <!-- SURGE ACTION BUTTON -->
            <button id="btn-surge" class="surge-btn">
              <span class="surge-glow"></span>
              <span class="surge-text">⚡ UNLEASH ELEMENTAL SURGE</span>
            </button>
          </section>

          <!-- EXPANDABLE SETTINGS PANEL -->
          <aside id="settings-panel" class="settings-drawer glass-panel hidden">
            <h3 class="drawer-title">VISUAL & ENGINE TUNING</h3>
            
            <div class="setting-item">
              <div class="setting-header">
                <span>Bloom Glow Intensity</span>
                <span id="val-bloom">1.2</span>
              </div>
              <input id="slider-bloom" type="range" min="0" max="3" step="0.1" value="1.2" class="slider" />
            </div>

            <div class="setting-item">
              <div class="setting-header">
                <span>Primal Turbulence</span>
                <span id="val-turbulence">1.0</span>
              </div>
              <input id="slider-turbulence" type="range" min="0.2" max="2.5" step="0.1" value="1.0" class="slider" />
            </div>

            <div class="shortcuts-guide">
              <span class="section-label">KEYBOARD SHORTCUTS:</span>
              <ul class="shortcut-list">
                <li><kbd>1</kbd> Fire</li>
                <li><kbd>2</kbd> Water</li>
                <li><kbd>3</kbd> Earth</li>
                <li><kbd>4</kbd> Air</li>
                <li><kbd>5</kbd> Alchemy</li>
                <li><kbd>0</kbd> / <kbd>~</kbd> Nexus Overview</li>
                <li><kbd>Space</kbd> Unleash Surge</li>
                <li><kbd>M</kbd> Mute / Audio</li>
                <li><kbd>C</kbd> Cinematic Tour</li>
                <li><kbd>H</kbd> Clean Mode</li>
              </ul>
            </div>
          </aside>
        </main>

        <!-- BOTTOM ELEMENT NAVIGATION BAR -->
        <nav class="hud-nav glass-panel">
          <button class="nav-btn active" data-element="nexus">
            <span class="nav-icon">🏛️</span>
            <span class="nav-label">Nexus</span>
          </button>
          <button class="nav-btn nav-fire" data-element="fire">
            <span class="nav-icon">🔥</span>
            <span class="nav-label">Fire</span>
          </button>
          <button class="nav-btn nav-water" data-element="water">
            <span class="nav-icon">💧</span>
            <span class="nav-label">Water</span>
          </button>
          <button class="nav-btn nav-earth" data-element="earth">
            <span class="nav-icon">🌿</span>
            <span class="nav-label">Earth</span>
          </button>
          <button class="nav-btn nav-air" data-element="air">
            <span class="nav-icon">🌪️</span>
            <span class="nav-label">Air</span>
          </button>
          <button class="nav-btn nav-fusion" data-element="fusion">
            <span class="nav-icon">⚛️</span>
            <span class="nav-label">Alchemy</span>
          </button>
        </nav>
      </div>
    `;
  }

  private setupEvents() {
    // Navigation Buttons
    const navButtons = this.container.querySelectorAll<HTMLButtonElement>('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const elem = btn.getAttribute('data-element') as ElementType;
        if (elem) {
          this.setActiveElement(elem);
          this.callbacks.onSelectElement(elem);
        }
      });
    });

    // Surge Button
    const surgeBtn = this.container.querySelector('#btn-surge');
    surgeBtn?.addEventListener('click', () => {
      this.triggerSurgeAnimation();
      this.callbacks.onTriggerSurge();
    });

    // Fusion Pills
    const fusionPills = this.container.querySelectorAll<HTMLButtonElement>('.fusion-pill');
    fusionPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const mode = pill.getAttribute('data-mode') as FusionMode;
        if (mode) {
          this.activeFusionMode = mode;
          this.updateFusionPills();
          this.callbacks.onSelectFusionMode(mode);
        }
      });
    });

    // Audio Toggle
    const audioBtn = this.container.querySelector('#btn-audio');
    audioBtn?.addEventListener('click', () => {
      const isMuted = this.callbacks.onToggleAudio();
      this.isMuted = isMuted;
      this.updateAudioButton();
    });

    // Cinematic Tour
    const cinematicBtn = this.container.querySelector('#btn-cinematic');
    cinematicBtn?.addEventListener('click', () => {
      const isCinematic = this.callbacks.onToggleCinematic();
      this.isCinematic = isCinematic;
      cinematicBtn.classList.toggle('active', isCinematic);
    });

    // Settings Toggle
    const settingsBtn = this.container.querySelector('#btn-settings-toggle');
    const settingsPanel = this.container.querySelector('#settings-panel');
    settingsBtn?.addEventListener('click', () => {
      settingsPanel?.classList.toggle('hidden');
      settingsBtn.classList.toggle('active');
    });

    // Hide HUD Toggle
    const toggleHudBtn = this.container.querySelector('#btn-toggle-hud');
    toggleHudBtn?.addEventListener('click', () => {
      this.toggleHudVisibility();
    });

    // Sliders
    const bloomSlider = this.container.querySelector<HTMLInputElement>('#slider-bloom');
    const bloomVal = this.container.querySelector('#val-bloom');
    bloomSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      if (bloomVal) bloomVal.textContent = val.toFixed(1);
      this.callbacks.onBloomChange(val);
    });

    const turbSlider = this.container.querySelector<HTMLInputElement>('#slider-turbulence');
    const turbVal = this.container.querySelector('#val-turbulence');
    turbSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      if (turbVal) turbVal.textContent = val.toFixed(1);
      this.callbacks.onTurbulenceChange(val);
    });

    this.updateInfoCard();
  }

  private setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const key = e.key.toLowerCase();
      if (key === '1') {
        this.setActiveElement('fire');
        this.callbacks.onSelectElement('fire');
      } else if (key === '2') {
        this.setActiveElement('water');
        this.callbacks.onSelectElement('water');
      } else if (key === '3') {
        this.setActiveElement('earth');
        this.callbacks.onSelectElement('earth');
      } else if (key === '4') {
        this.setActiveElement('air');
        this.callbacks.onSelectElement('air');
      } else if (key === '5') {
        this.setActiveElement('fusion');
        this.callbacks.onSelectElement('fusion');
      } else if (key === '0' || key === '`') {
        this.setActiveElement('nexus');
        this.callbacks.onSelectElement('nexus');
      } else if (key === ' ') {
        e.preventDefault();
        this.triggerSurgeAnimation();
        this.callbacks.onTriggerSurge();
      } else if (key === 'm') {
        const isMuted = this.callbacks.onToggleAudio();
        this.isMuted = isMuted;
        this.updateAudioButton();
      } else if (key === 'c') {
        const isCinematic = this.callbacks.onToggleCinematic();
        this.isCinematic = isCinematic;
        const cinematicBtn = this.container.querySelector('#btn-cinematic');
        cinematicBtn?.classList.toggle('active', isCinematic);
      } else if (key === 'h') {
        this.toggleHudVisibility();
      }
    });
  }

  public triggerSurgeAnimation() {
    const surgeBtn = this.container.querySelector('#btn-surge');
    if (surgeBtn) {
      surgeBtn.classList.add('surging');
      setTimeout(() => {
        surgeBtn.classList.remove('surging');
      }, 600);
    }
  }

  private toggleHudVisibility() {
    this.isHudHidden = !this.isHudHidden;
    const header = this.container.querySelector('.hud-header');
    const body = this.container.querySelector('.hud-body');
    const nav = this.container.querySelector('.hud-nav');

    if (this.isHudHidden) {
      header?.classList.add('hud-hidden');
      body?.classList.add('hud-hidden');
      nav?.classList.add('hud-hidden');
    } else {
      header?.classList.remove('hud-hidden');
      body?.classList.remove('hud-hidden');
      nav?.classList.remove('hud-hidden');
    }
  }

  private updateAudioButton() {
    const iconOff = this.container.querySelector('#icon-audio-off');
    const iconOn = this.container.querySelector('#icon-audio-on');
    const label = this.container.querySelector('#label-audio');
    const btn = this.container.querySelector('#btn-audio');

    if (this.isMuted) {
      iconOff?.classList.remove('hidden');
      iconOn?.classList.add('hidden');
      if (label) label.textContent = 'Sound: Off';
      btn?.classList.remove('active');
    } else {
      iconOff?.classList.add('hidden');
      iconOn?.classList.remove('hidden');
      if (label) label.textContent = 'Sound: On';
      btn?.classList.add('active');
    }
  }

  private updateNavButtons() {
    const navButtons = this.container.querySelectorAll<HTMLButtonElement>('.nav-btn');
    navButtons.forEach(btn => {
      const elem = btn.getAttribute('data-element');
      btn.classList.toggle('active', elem === this.activeElement);
    });
  }

  private updateFusionPills() {
    const pills = this.container.querySelectorAll<HTMLButtonElement>('.fusion-pill');
    pills.forEach(p => {
      const mode = p.getAttribute('data-mode');
      p.classList.toggle('active', mode === this.activeFusionMode);
    });
  }

  private updateInfoCard() {
    const info = ELEMENT_INFOS[this.activeElement] || ELEMENT_INFOS.nexus;

    const latinEl = this.container.querySelector('#card-latin');
    const titleEl = this.container.querySelector('#card-title');
    const taglineEl = this.container.querySelector('#card-tagline');
    const descEl = this.container.querySelector('#card-desc');
    const fusionSelector = this.container.querySelector('#fusion-selector');
    const statsList = this.container.querySelector('#stats-list');

    if (latinEl) latinEl.textContent = info.latin;
    if (titleEl) {
      titleEl.textContent = info.title;
      (titleEl as HTMLElement).style.color = info.color;
    }
    if (taglineEl) taglineEl.textContent = info.tagline;
    if (descEl) descEl.textContent = info.description;

    if (fusionSelector) {
      fusionSelector.classList.toggle('hidden', this.activeElement !== 'fusion');
    }

    if (statsList) {
      statsList.innerHTML = info.stats.map(s => `
        <div class="stat-row">
          <div class="stat-info">
            <span class="stat-label">${s.label}</span>
            <span class="stat-value" style="color: ${info.color}">${s.value}</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width: ${s.percent}%; background-color: ${info.color}"></div>
          </div>
        </div>
      `).join('');
    }
  }
}
