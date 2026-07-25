import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/terra-ultra/ inside the playground, so asset URLs must
  // be relative rather than rooted at /.
  base: "./",
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5177,
  },
  build: {
    outDir: "../playground/public/models/terra-ultra",
    emptyOutDir: true,
  },
});
