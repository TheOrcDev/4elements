import { defineConfig } from 'vite'

export default defineConfig({
  // Served from /models/gemini-4-argon/ inside the playground, so asset URLs
  // must be relative rather than rooted at /.
  base: './',
  server: {
    host: true,
    port: 5188,
    open: true,
  },
  build: {
    outDir: '../playground/public/models/gemini-4-argon',
    emptyOutDir: true,
  },
})
