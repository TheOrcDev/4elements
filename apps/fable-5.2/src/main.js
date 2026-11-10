import { App } from './core/App.js';

const params = new URLSearchParams(window.location.search);
const app = new App(document.getElementById('app'), params);
window.__app = app.hooks();
window.__ready = false;

async function start() {
  let ui = null;
  if (!params.has('noui')) {
    try {
      const mod = await import('./ui/ui.js');
      ui = mod.createUI(app, document.getElementById('ui'));
      window.__app.ui = ui;
    } catch (err) {
      console.warn('[elementa] UI unavailable:', err);
    }
  }
  try {
    await app.init();
  } catch (err) {
    console.error('[elementa] failed to start:', err && err.stack ? err.stack : err);
    if (ui && ui.fail) ui.fail(err);
    return;
  }
  // Two frames after the first render, everything the page shows is real.
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
}

start();
