import { defineConfig } from 'vite'

export default defineConfig({
  // Served from /models/gemini-4-carbon/ inside the playground, so asset URLs
  // must be relative rather than rooted at /.
  base: './',
  server: {
    host: true,
    port: 5189,
  },
  build: {
    outDir: '../playground/public/models/gemini-4-carbon',
    emptyOutDir: true,
  },
})
