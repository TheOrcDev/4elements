import { defineConfig } from 'vite';

export default defineConfig({
  // Served from /models/gemini-3.7-flash/ inside the playground, so asset URLs
  // must be relative rather than rooted at /.
  base: './',
  server: {
    port: 5183,
    host: true
  },
  build: {
    outDir: '../playground/public/models/gemini-3.7-flash',
    emptyOutDir: true
  }
});
