import { defineConfig } from 'vite';

export default defineConfig({
  // Served from /models/gpt-6.1-sol/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: './',
  server: { port: 5192 },
  build: {
    outDir: '../playground/public/models/gpt-6.1-sol',
    emptyOutDir: true,
    // Three.js is intentionally kept together; its gzip transfer is about 127 kB.
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/examples/')) return 'three-addons';
          if (id.includes('/node_modules/three/')) return 'three-core';
        },
      },
    },
  },
});
