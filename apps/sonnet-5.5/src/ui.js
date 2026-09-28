import * as THREE from 'three';
import { ELEMENT_LIST, ELEMENTS } from './config.js';

const ICONS = {
  fire: 'M12 3 21 19H3Z',
  water: 'M12 21 3 5h18Z',
  air: 'M12 3 21 19H3ZM7.2 13.2h9.6',
  earth: 'M12 21 3 5h18ZM7.2 10.8h9.6',
};

const OVERVIEW = {
  name: 'Overview',
  color: '#b9a6ff',
  tagline: 'Four Elements · One World',
  text: 'Four shrines, generated procedurally and animated live on your GPU. Pick an element below, or press and hold one in the scene to unleash it.',
};

/** DOM layer: dock, caption, floating labels and keyboard shortcuts. */
export function createUI({ rig, onToggleOrbit }) {
  const ui = document.getElementById('ui');
  const caption = document.getElementById('caption');
  const capTitle = document.getElementById('cap-title');
  const capTag = document.getElementById('cap-tag');
  const capText = document.getElementById('cap-text');
  const dockButtons = [...document.querySelectorAll('.dock-btn')];
  const labelsRoot = document.getElementById('labels');
  const orbitBtn = document.getElementById('btn-orbit');
  const fullBtn = document.getElementById('btn-full');

  let active = 'all';

  const labels = ELEMENT_LIST.map((el) => {
    const node = document.createElement('button');
    node.className = 'label';
    node.style.setProperty('--c', el.color);
    node.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ICONS[el.id]}"/></svg><span>${el.name}</span>`;
    node.addEventListener('click', () => focus(el.id));
    labelsRoot.appendChild(node);
    return { el, node, anchor: el.position.clone().setY(el.labelY), v: new THREE.Vector3() };
  });

  function setCaption(info) {
    caption.classList.add('swap');
    window.setTimeout(() => {
      capTitle.textContent = info.name;
      capTag.textContent = info.tagline;
      capText.textContent = info.text;
      ui.style.setProperty('--accent', info.color);
      caption.classList.remove('swap');
    }, 170);
  }

  function setActive(name) {
    active = name;
    dockButtons.forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    setCaption(name === 'all' ? OVERVIEW : ELEMENTS[name]);
  }

  function focus(name) {
    rig.flyTo(name);
    setActive(name);
  }

  dockButtons.forEach((b) => b.addEventListener('click', () => focus(b.dataset.view)));

  const setOrbit = (on) => {
    orbitBtn.classList.toggle('on', on);
    orbitBtn.setAttribute('aria-pressed', String(on));
    rig.setAutoOrbit(on);
    onToggleOrbit?.(on);
  };
  orbitBtn.addEventListener('click', () => setOrbit(!orbitBtn.classList.contains('on')));

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };
  fullBtn.addEventListener('click', toggleFullscreen);

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const map = { 1: 'all', 2: 'fire', 3: 'water', 4: 'air', 5: 'earth' };
    if (map[e.key]) focus(map[e.key]);
    else if (e.key === 'Escape' || e.key === 'Home') focus('all');
    else if (e.key === 'o' || e.key === 'O') setOrbit(!orbitBtn.classList.contains('on'));
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  });

  setActive('all');
  // Respect the OS-level reduced-motion preference: no automatic camera drift.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setOrbit(false);

  /** Project each label's anchor to the screen. */
  function update(camera, width, height) {
    for (const l of labels) {
      l.v.copy(l.anchor).project(camera);
      const visible = l.v.z < 1 && Math.abs(l.v.x) < 1.15 && Math.abs(l.v.y) < 1.15;
      if (!visible) {
        l.node.style.opacity = '0';
        l.node.style.pointerEvents = 'none';
        continue;
      }
      const x = (l.v.x * 0.5 + 0.5) * width;
      const y = (-l.v.y * 0.5 + 0.5) * height;
      const dist = camera.position.distanceTo(l.anchor);
      // fade labels when the camera is inside the shrine they belong to
      const near = THREE.MathUtils.smoothstep(dist, 7, 15);
      const isActive = active === l.el.id;
      const op = near * (isActive ? 0.0 : 1.0);
      l.node.style.opacity = op.toFixed(2);
      l.node.style.pointerEvents = op > 0.3 ? 'auto' : 'none';
      l.node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  }

  return { focus, update, setActive, get active() { return active; } };
}
