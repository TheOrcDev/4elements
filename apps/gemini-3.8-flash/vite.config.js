import { defineConfig } from 'vite';

export default defineConfig({
  // Served from /models/gemini-3.8-flash/ inside the playground, so asset URLs
  // must be relative rather than rooted at /.
  base: './',
  server: {
    port: 5185,
    host: true
  },
  build: {
    outDir: '../playground/public/models/gemini-3.8-flash',
    emptyOutDir: true
  }
});
