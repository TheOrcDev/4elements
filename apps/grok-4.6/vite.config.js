import { defineConfig } from 'vite'

export default defineConfig({
  // Served from /models/grok-4.6/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: './',
  server: {
    host: true,
    port: 5181,
    open: true,
  },
  build: {
    outDir: '../playground/public/models/grok-4.6',
    emptyOutDir: true,
  },
})
