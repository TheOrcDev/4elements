import { defineConfig } from 'vite';

export default defineConfig({
  // Served from /models/opus-5.5/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: './',
  server: {
    port: 5190,
    open: true, // `npm run dev` opens the scene in your browser
  },
  preview: {
    open: true,
  },
  build: {
    // three.js alone is ~600 kB minified; keep the warning for anything unexpected
    chunkSizeWarningLimit: 900,
    outDir: '../playground/public/models/opus-5.5',
    emptyOutDir: true,
  },
});
