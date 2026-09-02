// Procedural Web Audio API sound generator for the 4 Elements
export class ElementalAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.createNoiseBuffers();
      this.createAmbientDrones();
      this.initialized = true;
      this.isMuted = false;
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  toggleMute() {
    if (!this.initialized) {
      this.init();
      return !this.isMuted;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    const target = this.isMuted ? 0 : 0.2;
    this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.15);
    return !this.isMuted;
  }

  createNoiseBuffers() {
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  createAmbientDrones() {
    // Fire crackle generator
    const fireNoise = this.ctx.createBufferSource();
    fireNoise.buffer = this.noiseBuffer;
    fireNoise.loop = true;

    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'bandpass';
    fireFilter.frequency.value = 850;
    fireFilter.Q.value = 3.0;

    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.value = 0.08;

    fireNoise.connect(fireFilter);
    fireFilter.connect(this.fireGain);
    this.fireGain.connect(this.masterGain);
    fireNoise.start();

    // Water wave generator
    const waterNoise = this.ctx.createBufferSource();
    waterNoise.buffer = this.noiseBuffer;
    waterNoise.loop = true;

    const waterFilter = this.ctx.createBiquadFilter();
    waterFilter.type = 'lowpass';
    waterFilter.frequency.value = 400;

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.value = 0.07;

    waterNoise.connect(waterFilter);
    waterFilter.connect(this.waterGain);
    this.waterGain.connect(this.masterGain);
    waterNoise.start();

    // Earth deep rumble
    this.earthOsc = this.ctx.createOscillator();
    this.earthOsc.type = 'triangle';
    this.earthOsc.frequency.value = 55;

    this.earthGain = this.ctx.createGain();
    this.earthGain.gain.value = 0.1;

    this.earthOsc.connect(this.earthGain);
    this.earthGain.connect(this.masterGain);
    this.earthOsc.start();

    // Air howling wind
    const airNoise = this.ctx.createBufferSource();
    airNoise.buffer = this.noiseBuffer;
    airNoise.loop = true;

    this.airFilter = this.ctx.createBiquadFilter();
    this.airFilter.type = 'bandpass';
    this.airFilter.frequency.value = 600;
    this.airFilter.Q.value = 4.5;

    this.airGain = this.ctx.createGain();
    this.airGain.gain.value = 0.09;

    airNoise.connect(this.airFilter);
    this.airFilter.connect(this.airGain);
    this.airGain.connect(this.masterGain);
    airNoise.start();
  }

  playSurgeSound(elementType) {
    if (!this.initialized || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let baseFreq = 440;
    if (elementType === 'fire') baseFreq = 587.33; // D5
    if (elementType === 'water') baseFreq = 440.0;  // A4
    if (elementType === 'earth') baseFreq = 220.0;  // A3
    if (elementType === 'air') baseFreq = 659.25;   // E5

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.6);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.7);
  }
}
