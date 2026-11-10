import { defineConfig } from 'vite';

export default defineConfig({
  // Served from /models/fable-5.2/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: './',
  server: { port: 5195, strictPort: true, host: 'localhost' },
  preview: { port: 4195, strictPort: true },
  build: {
    outDir: '../playground/public/models/fable-5.2',
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
});
