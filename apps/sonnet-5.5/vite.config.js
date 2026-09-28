import { defineConfig } from 'vite';

export default defineConfig({
  // relative asset URLs, so the built site works from any sub-path or a plain file server.
  // Served from /models/sonnet-5.5/ inside the playground.
  base: './',
  server: {
    port: 5191,
  },
  build: {
    target: 'es2022',
    // three.js alone is ~700 kB minified; that is expected for a WebGL scene
    chunkSizeWarningLimit: 1000,
    outDir: '../playground/public/models/sonnet-5.5',
    emptyOutDir: true,
  },
});
