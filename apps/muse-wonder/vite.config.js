import { defineConfig } from 'vite';

export default defineConfig({
  // Served from /models/muse-wonder/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: './',
  server: {
    port: 5194,
    host: true,
    open: true
  },
  preview: {
    port: 4194,
    host: true
  },
  build: {
    outDir: '../playground/public/models/muse-wonder',
    emptyOutDir: true,
    // three.js alone is about 535 kB minified here, so the default 500 kB warning is noise.
    chunkSizeWarningLimit: 800
  }
});
