import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Served from /models/gpt-6-astra/ inside the playground, so asset URLs must
  // be relative rather than rooted at /.
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  server: {
    host: '127.0.0.1',
    port: 5186,
    strictPort: true,
    // Use polling when macOS sandboxing prevents FSEvents from watching files.
    watch:
      process.env.CODEX_SANDBOX === 'seatbelt'
        ? { useFsEvents: false, usePolling: true }
        : undefined,
  },
  preview: { host: '127.0.0.1', port: 4186, strictPort: true },
  build: {
    outDir: '../playground/public/models/gpt-6-astra',
    emptyOutDir: true,
  },
});
