import { defineConfig } from 'vite';

export default defineConfig({
  // Served from /models/haiku-5.5/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: './',
  build: {
    outDir: '../playground/public/models/haiku-5.5',
    emptyOutDir: true,
    // three.js alone is about 650 kB minified, so the default 500 kB warning is noise here.
    chunkSizeWarningLimit: 800,
  },
});
