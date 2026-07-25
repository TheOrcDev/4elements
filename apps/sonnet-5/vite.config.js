import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/sonnet-5/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5180,
  },
  build: {
    outDir: "../playground/public/models/sonnet-5",
    emptyOutDir: true,
  },
});
