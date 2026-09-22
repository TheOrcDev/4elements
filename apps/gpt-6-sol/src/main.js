import * as THREE from 'three';
import { elementFactories } from './elements.js';
import './style.css';

const elements = [
  { id: 'fire', number: '01', symbol: '△', latin: 'Ignis / The spark', name: 'Fire', nature: 'The force of transformation', tag: 'Heat · Energy', summary: 'An untamed current of light and heat. Fire consumes, transforms, and makes way for everything that comes next.', essence: 'Transformation', motion: 'Rising · Restless', color: '#ff9d58', glow: '#e9692e32', speed: .14 },
  { id: 'air', number: '02', symbol: '◌', latin: 'Aer / The breath', name: 'Air', nature: 'The force of movement', tag: 'Flow · Freedom', summary: 'An invisible force given shape by motion. Air carries every breath, every sound, and the promise of open space.', essence: 'Movement', motion: 'Spiraling · Free', color: '#c5e7e9', glow: '#7dc7dd29', speed: .07 },
  { id: 'water', number: '03', symbol: '≈', latin: 'Aqua / The tide', name: 'Water', nature: 'The force of adaptation', tag: 'Depth · Life', summary: 'Always moving, always becoming. Water carves through stone, reflects the sky, and finds its own way forward.', essence: 'Adaptation', motion: 'Fluid · Eternal', color: '#65d5ed', glow: '#128fb040', speed: .09 },
  { id: 'earth', number: '04', symbol: '◇', latin: 'Terra / The foundation', name: 'Earth', nature: 'The force of creation', tag: 'Form · Growth', summary: 'Ancient matter in constant renewal. Earth holds the roots of life beneath a rough and beautiful surface.', essence: 'Creation', motion: 'Grounded · Ancient', color: '#bdc780', glow: '#82944b34', speed: .06 }
];

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const gesture = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12V6a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v3a2 2 0 0 1 3 1.7v3.1c0 3-2.3 5.2-5.1 5.2h-3.2c-1.6 0-2.5-.5-3.7-1.7l-4-4a1.8 1.8 0 0 1 2.6-2.5L9 15" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

document.querySelector('#app').innerHTML = `
  <div class="site-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Four Forces home"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span><span class="brand-name">FOUR FORCES</span></a>
      <div class="topbar-right"><span>An elemental experience</span><span class="topbar-divider"></span><span class="live"><i></i> Live 3D exhibition</span></div>
    </header>
    <main class="main-content" id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div><div class="eyebrow">An exploration of nature</div><h1 id="hero-title">Nature, <em>untamed.</em></h1></div>
        <div class="hero-intro"><p>Four primal forces. Four living forms. <strong>Step closer and explore the elements in motion.</strong></p><div class="gesture">${gesture} Drag each form to explore in 3D</div></div>
      </section>
      <div class="section-head"><span class="section-label">The collection</span><span class="line"></span><span class="section-count"><b>04</b> / 04 ELEMENTS</span></div>
      <section class="elements-grid" aria-label="Interactive three-dimensional elements">
        ${elements.map((element) => `
          <article class="element-card ${element.id}" id="card-${element.id}" aria-label="${element.name} 3D model">
            <div class="card-top"><span class="card-number"><strong>${element.number}</strong> / 04</span><span class="card-icon" aria-hidden="true">${element.symbol}</span></div>
            <div class="canvas-host" id="host-${element.id}"></div>
            <div class="card-bottom"><div class="card-latin">${element.latin}</div><div class="card-title-row"><h2 class="card-title">${element.name}</h2><button class="card-arrow" data-focus="${element.id}" aria-label="Inspect ${element.name} in detail">${arrow}</button></div><div class="card-rule"></div><div class="card-foot"><span class="nature">${element.nature}</span><span class="tag">${element.tag}</span></div></div>
          </article>`).join('')}
      </section>
      <div class="bottom-strip"><span class="coordinates"><span>Four forces, <b>one world.</b></span><span>Built with light, form and motion</span></span><button class="control-button" id="motion-button" aria-pressed="false"><span aria-hidden="true">Ⅱ</span> Pause motion</button></div>
    </main>
  </div>
  <div class="focus-overlay" id="focus-overlay" role="dialog" aria-modal="true" aria-label="Element detail" aria-hidden="true">
    <div class="focus-panel" id="focus-panel"><button class="focus-close" id="focus-close" aria-label="Close detail">×</button><div class="focus-copy"><div class="focus-kicker" id="focus-kicker"></div><h2 class="focus-title" id="focus-title"></h2><p class="focus-summary" id="focus-summary"></p><div class="focus-properties"><div><span>Essence</span><strong id="focus-essence"></strong></div><div><span>Motion</span><strong id="focus-motion"></strong></div></div></div><div class="focus-canvas" id="focus-canvas"></div><span class="focus-help">Drag to rotate · Esc to close</span></div>
  </div>
`;

const scenes = new Map();
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let elapsed = 0;
let lastFrame = performance.now();
let focused = null;

for (const element of elements) {
  const host = document.querySelector(`#host-${element.id}`);
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.domElement.setAttribute('aria-label', `Interactive 3D ${element.name} sculpture. Drag to rotate.`);
    renderer.domElement.setAttribute('role', 'img');
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
    camera.position.set(0, 0, 5.8);
    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const key = new THREE.PointLight(element.id === 'fire' ? 0xffaf72 : element.id === 'water' ? 0xa4eafa : 0xe5f6e0, 38, 12);
    key.position.set(-2, 3, 4);
    scene.add(key);
    const rim = new THREE.PointLight(element.id === 'earth' ? 0x94c876 : 0x8acfe8, 24, 10);
    rim.position.set(2, -1.5, -2);
    scene.add(rim);
    const sculpture = elementFactories[element.id]();
    scene.add(sculpture.group);
    const item = { element, renderer, scene, camera, sculpture, host, angleX: 0, angleY: 0, lastW: 0, lastH: 0 };
    scenes.set(element.id, item);
    let pointer = null;
    renderer.domElement.addEventListener('pointerdown', (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    });
    renderer.domElement.addEventListener('pointermove', (event) => {
      if (!pointer) return;
      item.angleY += (event.clientX - pointer.x) * .008;
      item.angleX = THREE.MathUtils.clamp(item.angleX + (event.clientY - pointer.y) * .006, -.6, .6);
      pointer = { x: event.clientX, y: event.clientY };
    });
    renderer.domElement.addEventListener('pointerup', () => { pointer = null; });
    renderer.domElement.addEventListener('pointercancel', () => { pointer = null; });
  } catch (error) {
    console.error(`Could not render ${element.name}`, error);
    host.innerHTML = '<div style="padding:40% 22px;text-align:center;color:#aeb4bf;font-size:13px">WebGL is required to view this 3D element.</div>';
  }
}

function frame(now) {
  const delta = Math.min((now - lastFrame) / 1000, .05);
  lastFrame = now;
  if (playing && !document.hidden) elapsed += delta;
  for (const item of scenes.values()) {
    const { renderer, camera, sculpture, scene, element } = item;
    const parent = renderer.domElement.parentElement;
    const w = Math.max(1, Math.floor(parent.clientWidth));
    const h = Math.max(1, Math.floor(parent.clientHeight));
    if (w !== item.lastW || h !== item.lastH) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = focused === element.id ? 4.7 : 5.8;
      camera.updateProjectionMatrix();
      item.lastW = w; item.lastH = h;
    }
    if (playing && !document.hidden) sculpture.update(elapsed, delta);
    sculpture.group.rotation.y = item.angleY + elapsed * element.speed;
    sculpture.group.rotation.x = item.angleX - .08;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const overlay = document.querySelector('#focus-overlay');
const panel = document.querySelector('#focus-panel');
const focusCanvas = document.querySelector('#focus-canvas');
const closeButton = document.querySelector('#focus-close');
let triggerButton = null;

function openFocus(id, button) {
  const element = elements.find((entry) => entry.id === id);
  const item = scenes.get(id);
  if (!element || !item) return;
  focused = id;
  triggerButton = button;
  panel.style.setProperty('--accent', element.color);
  panel.style.setProperty('--panel-glow', element.glow);
  document.querySelector('#focus-kicker').textContent = `${element.number} / 04 — ${element.latin}`;
  document.querySelector('#focus-title').textContent = element.name;
  document.querySelector('#focus-summary').textContent = element.summary;
  document.querySelector('#focus-essence').textContent = element.essence;
  document.querySelector('#focus-motion').textContent = element.motion;
  focusCanvas.appendChild(item.renderer.domElement);
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeButton.focus();
}

function closeFocus() {
  if (!focused) return;
  const item = scenes.get(focused);
  item.host.appendChild(item.renderer.domElement);
  focused = null;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  triggerButton?.focus();
}

document.querySelectorAll('[data-focus]').forEach((button) => button.addEventListener('click', () => openFocus(button.dataset.focus, button)));
closeButton.addEventListener('click', closeFocus);
overlay.addEventListener('click', (event) => { if (event.target === overlay) closeFocus(); });
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeFocus(); });

const motionButton = document.querySelector('#motion-button');
function updateMotionButton() {
  motionButton.innerHTML = playing ? '<span aria-hidden="true">Ⅱ</span> Pause motion' : '<span aria-hidden="true">▶</span> Play motion';
  motionButton.setAttribute('aria-pressed', String(!playing));
}
updateMotionButton();
motionButton.addEventListener('click', () => { playing = !playing; updateMotionButton(); });
