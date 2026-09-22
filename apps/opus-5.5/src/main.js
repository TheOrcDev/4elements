import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource-variable/inter';
import './style.css';
import { App } from './App.js';
import { UI } from './ui/UI.js';
import { Soundscape } from './audio/Soundscape.js';

UI.buildLoaderGlyphs();

function fail(message) {
  const status = document.getElementById('loader-status');
  if (status) {
    status.textContent = message;
    status.style.color = '#ffb4a2';
  }
}

function hasWebGL2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

if (!hasWebGL2()) {
  fail('This experience needs WebGL 2 — try a recent Chrome, Edge, Firefox or Safari.');
} else {
  const canvas = document.getElementById('scene');
  const app = new App(canvas, { onProgress: (label, value) => UI.setProgress(label, value) });
  app
    .init()
    .then(() => {
      const sound = new Soundscape(app);
      app.sound = sound;
      const ui = new UI(app, sound);
      if (app.focused) app.emit({ type: 'focus', id: app.focused });
      requestAnimationFrame(() => ui.reveal());
      window.__ready = true;
    })
    .catch((err) => {
      console.error(err);
      fail('Something went wrong while summoning the elements. See the console for details.');
    });
}
