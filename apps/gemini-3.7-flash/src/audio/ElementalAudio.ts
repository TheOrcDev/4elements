/**
 * Procedural Web Audio API Synthesizer for Elemental Soundscapes
 * Generates dynamic, interactive fire crackle, water surge, earth rumble, wind howl, and surge SFX
 * completely synthesized in code with zero external audio assets!
 */

export type ElementType = 'nexus' | 'fire' | 'water' | 'earth' | 'air' | 'fusion';

export class ElementalAudio {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isMuted = true;
  private masterGain: GainNode | null = null;

  // Elemental Gain nodes
  private fireGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private earthGain: GainNode | null = null;
  private airGain: GainNode | null = null;
  private nexusGain: GainNode | null = null;

  // Active nodes
  private activeIntervals: number[] = [];

  constructor() {}

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create Element Gain Channels
      this.fireGain = this.ctx.createGain();
      this.waterGain = this.ctx.createGain();
      this.earthGain = this.ctx.createGain();
      this.airGain = this.ctx.createGain();
      this.nexusGain = this.ctx.createGain();

      this.fireGain.connect(this.masterGain);
      this.waterGain.connect(this.masterGain);
      this.earthGain.connect(this.masterGain);
      this.airGain.connect(this.masterGain);
      this.nexusGain.connect(this.masterGain);

      // Initialize all synthesis generators
      this.startFireSynth();
      this.startWaterSynth();
      this.startEarthSynth();
      this.startAirSynth();
      this.startNexusSynth();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.isInitialized && !muted) {
      this.init();
    }

    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }

    if (this.masterGain && this.ctx) {
      const targetGain = muted ? 0.0 : 0.7;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setFocusElement(element: ElementType) {
    if (!this.ctx || !this.isInitialized) return;
    const now = this.ctx.currentTime;
    const rampTime = 0.5;

    const gains = {
      fire: 0.15,
      water: 0.15,
      earth: 0.15,
      air: 0.15,
      nexus: 0.25
    };

    if (element === 'fire') {
      gains.fire = 0.85;
      gains.water = 0.05;
      gains.earth = 0.05;
      gains.air = 0.05;
      gains.nexus = 0.1;
    } else if (element === 'water') {
      gains.fire = 0.05;
      gains.water = 0.85;
      gains.earth = 0.05;
      gains.air = 0.05;
      gains.nexus = 0.1;
    } else if (element === 'earth') {
      gains.fire = 0.05;
      gains.water = 0.05;
      gains.earth = 0.85;
      gains.air = 0.05;
      gains.nexus = 0.1;
    } else if (element === 'air') {
      gains.fire = 0.05;
      gains.water = 0.05;
      gains.earth = 0.05;
      gains.air = 0.85;
      gains.nexus = 0.1;
    } else if (element === 'fusion') {
      gains.fire = 0.35;
      gains.water = 0.35;
      gains.earth = 0.35;
      gains.air = 0.35;
      gains.nexus = 0.6;
    }

    this.fireGain?.gain.setTargetAtTime(gains.fire, now, rampTime);
    this.waterGain?.gain.setTargetAtTime(gains.water, now, rampTime);
    this.earthGain?.gain.setTargetAtTime(gains.earth, now, rampTime);
    this.airGain?.gain.setTargetAtTime(gains.air, now, rampTime);
    this.nexusGain?.gain.setTargetAtTime(gains.nexus, now, rampTime);
  }

  // --- FIRE SYNTHESIS: Roar + Crackle Pops ---
  private startFireSynth() {
    if (!this.ctx || !this.fireGain) return;

    // Fire Roar (Filtered White/Pink Noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.2;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, this.ctx.currentTime);

    const bandFilter = this.ctx.createBiquadFilter();
    bandFilter.type = 'bandpass';
    bandFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
    bandFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(bandFilter);
    bandFilter.connect(this.fireGain);
    whiteNoise.start();

    // Crackle Pops Generator
    const crackleInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.fireGain) return;
      if (Math.random() > 0.4) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filterP = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 + Math.random() * 2500, this.ctx.currentTime);
        filterP.type = 'bandpass';
        filterP.frequency.setValueAtTime(1200 + Math.random() * 3000, this.ctx.currentTime);
        filterP.Q.setValueAtTime(5.0, this.ctx.currentTime);

        const popLen = 0.02 + Math.random() * 0.04;
        gain.gain.setValueAtTime(0.3 * Math.random(), this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + popLen);

        osc.connect(filterP);
        filterP.connect(gain);
        gain.connect(this.fireGain);

        osc.start();
        osc.stop(this.ctx.currentTime + popLen);
      }
    }, 60);

    this.activeIntervals.push(crackleInterval);
  }

  // --- WATER SYNTHESIS: Fluid Swell & Droplets ---
  private startWaterSynth() {
    if (!this.ctx || !this.waterGain) return;

    // Ocean Swell (Sweeping modulated noise)
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // LFO for wave swelling
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.25, this.ctx.currentTime); // 4 sec wave period
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(filter.frequency);
    noiseSource.connect(filter);
    filter.connect(this.waterGain);

    noiseSource.start();
    lfo.start();

    // Gentle aquatic droplet pings
    const dropInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.waterGain) return;
      if (Math.random() > 0.6) {
        const osc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();

        const baseFreq = 600 + Math.random() * 800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, this.ctx.currentTime + 0.08);

        dropGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

        osc.connect(dropGain);
        dropGain.connect(this.waterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.13);
      }
    }, 180);

    this.activeIntervals.push(dropInterval);
  }

  // --- EARTH SYNTHESIS: Deep Tectonic Sub-bass Drone ---
  private startEarthSynth() {
    if (!this.ctx || !this.earthGain) return;

    // Sub Drone (55Hz / A1)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(180, this.ctx.currentTime);

    subGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    osc1.connect(lowpass);
    osc2.connect(lowpass);
    lowpass.connect(subGain);
    subGain.connect(this.earthGain);

    osc1.start();
    osc2.start();

    // Crystalline Mineral Chimes (Pentatonic Crystal Resonances)
    const chimeFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const chimeInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.earthGain) return;
      if (Math.random() > 0.75) {
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();

        const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        chimeGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.earthGain);

        chimeOsc.start();
        chimeOsc.stop(this.ctx.currentTime + 1.85);
      }
    }, 400);

    this.activeIntervals.push(chimeInterval);
  }

  // --- AIR SYNTHESIS: Howling Wind Gale ---
  private startAirSynth() {
    if (!this.ctx || !this.airGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(600, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(3.5, this.ctx.currentTime);

    // Modulate wind whistling frequency
    const windLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    windLfo.type = 'sine';
    windLfo.frequency.setValueAtTime(0.35, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);

    windLfo.connect(bandpass.frequency);
    windSource.connect(bandpass);
    bandpass.connect(this.airGain);

    windSource.start();
    windLfo.start();
  }

  // --- NEXUS SYNTHESIS: Ethereal Cosmic Choir Chord ---
  private startNexusSynth() {
    if (!this.ctx || !this.nexusGain) return;

    const chordFreqs = [220.0, 277.18, 329.63, 440.0, 554.37]; // A major ethereal chord
    chordFreqs.forEach(freq => {
      if (!this.ctx || !this.nexusGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      // Tremolo
      const tremolo = this.ctx.createOscillator();
      const tremGain = this.ctx.createGain();
      tremolo.type = 'sine';
      tremolo.frequency.setValueAtTime(0.1 + Math.random() * 0.15, this.ctx.currentTime);
      tremGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      tremolo.connect(gain.gain);
      osc.connect(gain);
      gain.connect(this.nexusGain);

      osc.start();
      tremolo.start();
    });
  }

  // --- TRIGGER ELEMENTAL SURGE SFX ---
  public playSurgeSfx(element: ElementType) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (element === 'fire') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
    } else if (element === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.6);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
    } else if (element === 'earth') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.7);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
    } else if (element === 'air') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(1800, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.5);
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(600, now);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
    }

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  public dispose() {
    this.activeIntervals.forEach(id => clearInterval(id));
    this.activeIntervals = [];
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
