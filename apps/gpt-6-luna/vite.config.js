import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/gpt-6-luna/ inside the playground, so asset URLs must
  // be relative rather than rooted at /.
  base: "./",
  server: {
    port: 5189,
  },
  build: {
    outDir: "../playground/public/models/gpt-6-luna",
    emptyOutDir: true,
  },
});
