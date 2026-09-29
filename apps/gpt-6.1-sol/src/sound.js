export function createAmbience() {
  let context, master, filter, oscillators = [], enabled = false, element = 'fire';
  const settings = {fire:[420,58.27,87.31],water:[160,65.41,98],earth:[80,43.65,65.41],air:[850,73.42,110]};
  function setElement(id) {
    element = id;
    if (!context) return;
    const [cutoff, a, b] = settings[id];
    filter.frequency.setTargetAtTime(cutoff, context.currentTime, .6);
    oscillators[0].frequency.setTargetAtTime(a, context.currentTime, .6);
    oscillators[1].frequency.setTargetAtTime(b, context.currentTime, .6);
  }
  async function toggle() {
    if (!context) {
      context = new (window.AudioContext || window.webkitAudioContext)();
      master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
      const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; data[i] = last * 3.5; }
      const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
      filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = .35;
      const noiseGain = context.createGain(); noiseGain.gain.value = .16;
      source.connect(filter); filter.connect(noiseGain); noiseGain.connect(master); source.start();
      for (let i = 0; i < 2; i++) {
        const oscillator = context.createOscillator(); oscillator.type = 'sine';
        const gain = context.createGain(); gain.gain.value = i === 0 ? .07 : .025;
        oscillator.connect(gain); gain.connect(master); oscillator.start(); oscillators.push(oscillator);
      }
      setElement(element);
    }
    await context.resume();
    enabled = !enabled;
    master.gain.setTargetAtTime(enabled ? .65 : 0, context.currentTime, .4);
    return enabled;
  }
  return {toggle, setElement, dispose() { context?.close(); }};
}
