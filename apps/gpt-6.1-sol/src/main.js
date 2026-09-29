import './style.css';
import { createExperience } from './scene.js';
import { createAmbience } from './sound.js';

const icons = {
  fire: '<path d="M12 3c1 5-4 6-4 10a4 4 0 0 0 8 0c0-1-.3-2-1-3 0 3-2 3-2 2 0-2 2-5-1-9Z"/><path d="M8 8c-2 2-4 4-4 7a8 8 0 0 0 16 0c0-4-3-7-5-9"/>',
  water: '<path d="M12 3S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
  earth: '<path d="m2 19 7-12 4 7 3-5 6 10H2Z"/><path d="m6.5 11.5 2.5 2 2.5-2M14 12l2 2 2-2"/>',
  air: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M5 16h5a3 3 0 1 1-3 3"/>',
  sound: '<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/>',
  rotate: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6"/>',
  capture: '<path d="M8 5 6 8H3v12h18V8h-3l-2-3H8Z"/><circle cx="12" cy="13" r="3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  arrow: '<path d="M4 12h16m-5-5 5 5-5 5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
const elements = [
  { id: 'fire', name: 'Fire', latin: 'Ignis', number: '01', color: '#ff8054', glow: '255, 92, 34', quality: 'ENERGY IN ITS PUREST FORM', description: 'A restless dance of heat and light.\nThe spark of creation, the force of change.', qualities: ['Transformative', 'Radiant', 'Untamed'], property: 'THERMAL ENERGY', value: '1,200', unit: '°C', note: 'Sculpted from light. Driven by energy.', tagline: 'The spark of creation' },
  { id: 'water', name: 'Water', latin: 'Aqua', number: '02', color: '#67c8ff', glow: '41, 132, 255', quality: 'BEAUTY IN CONSTANT MOTION', description: 'Always moving. Always becoming.\nA fluid balance of power and tranquility.', qualities: ['Fluid', 'Reflective', 'Resilient'], property: 'SURFACE TENSION', value: '72.8', unit: 'mN/m', note: 'A study in reflection and fluidity.', tagline: 'The rhythm of life' },
  { id: 'earth', name: 'Earth', latin: 'Terra', number: '03', color: '#b4ce84', glow: '134, 167, 86', quality: 'THE FOUNDATION OF EVERYTHING', description: 'Layers of time, held in stone.\nA quiet strength. A world of possibility.', qualities: ['Grounded', 'Enduring', 'Alive'], property: 'AGE OF OUR WORLD', value: '4.54', unit: 'B years', note: 'Millions of moments. One living world.', tagline: 'The strength beneath us' },
  { id: 'air', name: 'Air', latin: 'Aer', number: '04', color: '#c2cde6', glow: '164, 180, 218', quality: 'THE INVISIBLE, MADE VISIBLE', description: 'Unseen, yet everywhere.\nA weightless current connecting it all.', qualities: ['Weightless', 'Boundless', 'Free'], property: 'ATMOSPHERIC PRESSURE', value: '1,013', unit: 'hPa', note: 'Giving form to the invisible.', tagline: 'The freedom to flow' },
];
document.querySelector('#app').innerHTML = `
  <div class="ambient-glow"></div><div class="grain"></div>
  <header class="header">
    <a class="brand" href="/" aria-label="Elemental home"><span class="brand-mark">✳</span> ELEMENTAL<span class="brand-period">.</span></a>
    <nav class="header-nav" aria-label="Main navigation"><button class="nav-item active" id="experience-nav">The experience</button><button class="nav-item" id="about-button">About the elements ${icon('arrow')}</button></nav>
    <div class="header-actions"><button class="sound-button" id="sound-button" aria-label="Enable ambient sound" aria-pressed="false">${icon('muted')}<span>Sound off</span></button><span class="action-divider"></span><button class="icon-button" id="fullscreen-button" title="Enter fullscreen" aria-label="Enter fullscreen">${icon('expand')}</button></div>
  </header>
  <main class="experience">
    <section class="element-story" aria-live="polite">
      <div class="eyebrow"><span class="small-line"></span> FOUR FORCES. INFINITE POSSIBILITIES.</div>
      <div class="story-content" id="story-content">
        <div class="element-index"><span id="element-number">01</span><span class="index-divider">/</span><span id="element-latin">IGNIS</span></div>
        <h1 id="element-name">Fire<span>.</span></h1>
        <p class="element-quality" id="element-quality">ENERGY IN ITS PUREST FORM</p>
        <p class="element-description" id="element-description">A restless dance of heat and light.<br>The spark of creation, the force of change.</p>
        <div class="qualities" id="qualities">${elements[0].qualities.map(q => `<span>${q}</span>`).join('')}</div>
        <div class="element-stat"><span class="stat-label" id="stat-label">THERMAL ENERGY</span><div><span id="stat-value">1,200</span><span class="stat-unit" id="stat-unit">°C</span></div><span class="stat-note">A glimpse into its nature</span></div>
      </div>
    </section>
    <div class="stage" id="stage" role="region" aria-label="Interactive 3D fire sculpture. Drag to orbit, scroll to zoom.">
      <div class="stage-loading" id="stage-loading"><span class="loading-spinner"></span><span>Awakening the elements</span></div>
    </div>
    <div class="scene-caption"><span class="status-dot"></span> LIVE 3D EXPERIENCE <span class="caption-divider">/</span><span id="scene-caption">Sculpted from light. Driven by energy.</span></div>
    <div class="scene-toolbar"><button class="icon-button" id="pause-button" aria-label="Pause animation" title="Pause animation (Space)" aria-pressed="false">${icon('pause')}</button><button class="icon-button" id="reset-button" aria-label="Reset camera" title="Reset view">${icon('reset')}</button><button class="icon-button" id="capture-button" aria-label="Save a screenshot" title="Capture sculpture">${icon('capture')}</button></div>
    <section class="scene-controls" aria-label="Scene controls">
      <div class="controls-title"><span>MAKE IT YOURS</span><span class="controls-indicator">${icon('rotate')}</span></div>
      <label class="slider-label" for="intensity"><span>Intensity</span><output id="intensity-value" for="intensity">75%</output></label>
      <input type="range" id="intensity" min="25" max="150" value="75" aria-label="Element intensity" />
      <label class="slider-label" for="speed"><span>Motion</span><output id="speed-value" for="speed">1.0×</output></label>
      <input type="range" id="speed" min="25" max="200" value="100" aria-label="Animation speed" />
      <label class="toggle-row" for="auto-rotate"><span>Auto-rotate</span><input id="auto-rotate" type="checkbox" checked /><span class="toggle-track"></span></label>
    </section>
    <div class="interaction-hint">${icon('rotate')}<span>Drag to explore</span><span class="hint-dot">·</span><span>Scroll to zoom</span></div>
    <nav class="element-selector" aria-label="Choose an element">${elements.map((e,i) => `<button class="element-card ${i === 0 ? 'selected' : ''}" data-element="${e.id}" aria-pressed="${i === 0}" style="--card-color:${e.color}"><span class="card-top"><span class="card-symbol">${icon(e.id)}</span><span class="card-number">${e.number}</span></span><span class="card-name">${e.name}<span class="card-selection-dot"></span></span><span class="card-caption">${e.tagline}</span></button>`).join('')}</nav>
  </main>
  <footer class="footer"><span>A DIGITAL ODE TO THE NATURAL WORLD</span><span class="footer-center">EXPLORE THE EXTRAORDINARY</span><span class="render-status"><span class="status-dot"></span> REALTIME RENDERING <span id="fps">60 FPS</span></span></footer>
  <div class="toast" id="toast" role="status"></div>
  <dialog id="about-dialog" aria-labelledby="about-heading"><button class="dialog-close icon-button" aria-label="Close about dialog">${icon('close')}</button><span class="eyebrow">THE PRIMAL COLLECTION</span><h2 id="about-heading">Everything begins<br>with an element<span>.</span></h2><p>For thousands of years, fire, water, earth and air have been a way to understand the world. Elemental brings these ancient ideas into a new dimension — four living sculptures, each with a character of its own.</p><div class="about-grid">${elements.map(e => `<div style="--card-color:${e.color}">${icon(e.id)}<h3>${e.name}</h3><p>${e.description.replace('\n',' ')}</p></div>`).join('')}</div><div class="about-bottom">BUILT TO BE EXPLORED<span>Drag · Zoom · Discover</span></div></dialog>
`;

let selected = 'fire';
let experience;
const ambience = createAmbience();
let toastTimer;
function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('visible'), 3200);
}
function selectElement(id) {
  if (selected === id) return;
  const element = elements.find(e => e.id === id);
  if (!element) return;
  selected = id;
  document.documentElement.style.setProperty('--accent', element.color);
  document.documentElement.style.setProperty('--glow-rgb', element.glow);
  for (const card of document.querySelectorAll('.element-card')) {
    const isSelected = card.dataset.element === id;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', isSelected);
  }
  document.querySelector('#element-number').textContent = element.number;
  document.querySelector('#element-latin').textContent = element.latin.toUpperCase();
  document.querySelector('#element-name').innerHTML = `${element.name}<span>.</span>`;
  document.querySelector('#element-quality').textContent = element.quality;
  document.querySelector('#element-description').innerHTML = element.description.replace('\n','<br>');
  document.querySelector('#qualities').innerHTML = element.qualities.map(q => `<span>${q}</span>`).join('');
  document.querySelector('#stat-label').textContent = element.property;
  document.querySelector('#stat-value').textContent = element.value;
  document.querySelector('#stat-unit').textContent = element.unit;
  document.querySelector('#scene-caption').textContent = element.note;
  document.querySelector('#stage').setAttribute('aria-label', `Interactive 3D ${element.name.toLowerCase()} sculpture. Drag to orbit, scroll to zoom.`);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelector('#story-content').animate([{opacity:.25,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:420,easing:'ease-out'});
  experience?.selectElement(id, element.color);
  ambience.setElement(id);
}
document.querySelector('#stage').addEventListener('elemental-context-lost',()=>toast('Graphics interrupted. Reconnecting…'));
document.querySelector('#stage').addEventListener('elemental-context-restored',()=>toast('Graphics restored'));

for (const card of document.querySelectorAll('.element-card')) card.addEventListener('click', () => selectElement(card.dataset.element));
for (const [id, output, key, format] of [['intensity', 'intensity-value', 'intensity', v => `${v}%`], ['speed', 'speed-value', 'speed', v => `${(v / 100).toFixed(1)}×`]]) {
  document.querySelector(`#${id}`).addEventListener('input', event => {
    const value = Number(event.target.value);
    document.querySelector(`#${output}`).textContent = format(value);
    experience?.setParameter(key, value / (key === 'intensity' ? 75 : 100));
    event.target.style.setProperty('--range-fill', `${(value - Number(event.target.min)) / (Number(event.target.max) - Number(event.target.min)) * 100}%`);
  });
}
document.querySelector('#auto-rotate').addEventListener('change', event => experience?.setAutoRotate(event.target.checked));
document.querySelector('#reset-button').addEventListener('click', () => { experience?.resetCamera(); toast('View reset'); });
function togglePause() {
  if (!experience) return;
  const paused = experience.togglePause();
  const button = document.querySelector('#pause-button');
  button.innerHTML = icon(paused ? 'play' : 'pause');
  button.setAttribute('aria-label', paused ? 'Resume animation' : 'Pause animation');
  button.setAttribute('aria-pressed', paused);
  button.title = paused ? 'Resume animation (Space)' : 'Pause animation (Space)';
}
document.querySelector('#pause-button').addEventListener('click', togglePause);
document.querySelector('#capture-button').addEventListener('click', async () => {
  if(!experience)return;
  try {await experience.capture(selected);toast('Your sculpture capture is ready');}
  catch {toast('Capture is unavailable. Please try again.');}
});
document.querySelector('#fullscreen-button').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { toast('Fullscreen is unavailable in this browser'); }
});
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
  document.querySelector('#fullscreen-button').setAttribute('aria-label', label);
  document.querySelector('#fullscreen-button').title = label;
});
document.querySelector('#sound-button').addEventListener('click', async () => {
  try {
    const enabled = await ambience.toggle();
    document.querySelector('#sound-button').innerHTML = `${icon(enabled ? 'sound' : 'muted')}<span>Sound ${enabled ? 'on' : 'off'}</span>`;
    document.querySelector('#sound-button').setAttribute('aria-pressed', enabled);
    document.querySelector('#sound-button').setAttribute('aria-label', `${enabled ? 'Disable' : 'Enable'} ambient sound`);
  } catch { toast('Ambient audio is unavailable in this browser'); }
});
const dialog = document.querySelector('#about-dialog');
document.querySelector('#about-button').addEventListener('click', () => dialog.showModal());
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if(event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
document.querySelector('#experience-nav').addEventListener('click', () => { dialog.close(); document.querySelector('.element-selector').scrollIntoView({behavior:'smooth', block:'nearest'}); });
document.addEventListener('keydown', event => {
  if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[1-4]$/.test(event.key)) selectElement(elements[Number(event.key) - 1].id);
  if (event.code === 'Space' && event.target === document.body) { event.preventDefault(); togglePause(); }
  if (['ArrowLeft','ArrowRight'].includes(event.key) && event.target === document.body) {
    event.preventDefault();
    const index = elements.findIndex(e => e.id === selected);
    selectElement(elements[(index + (event.key === 'ArrowRight' ? 1 : 3)) % 4].id);
  }
});

try {
  experience = createExperience(document.querySelector('#stage'), { onFps: fps => { document.querySelector('#fps').textContent = `${fps} FPS`; } });
  document.querySelector('#stage-loading').remove();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    experience.setAutoRotate(false);
    document.querySelector('#auto-rotate').checked = false;
    togglePause();
  }
} catch (error) {
  console.error(error);
  document.querySelector('#stage-loading').innerHTML = '<span class="fallback-symbol">✳</span><strong>Let’s give your browser a little more power.</strong><span>This experience needs WebGL 2. Enable hardware acceleration, then reload to explore the elements.</span><button class="fallback-reload">Reload experience</button>';
  document.querySelector('.fallback-reload').addEventListener('click', () => window.location.reload());
  document.querySelector('#fps').textContent = 'UNAVAILABLE';
}

if (import.meta.hot) import.meta.hot.dispose(() => { experience?.dispose(); ambience.dispose(); });
