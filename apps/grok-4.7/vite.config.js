import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/grok-4.7/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 5187,
    strictPort: true,
  },
  build: {
    outDir: "../playground/public/models/grok-4.7",
    emptyOutDir: true,
  },
});
