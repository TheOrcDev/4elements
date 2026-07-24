import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/grok-4.5/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    port: 5175,
    open: true,
  },
  build: {
    target: "esnext",
    outDir: "../playground/public/models/grok-4.5",
    emptyOutDir: true,
  },
});
