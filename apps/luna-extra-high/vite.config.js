import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/luna-extra-high/ inside the playground, so asset URLs
  // must be relative rather than rooted at /.
  base: "./",
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5178,
  },
  build: {
    outDir: "../playground/public/models/luna-extra-high",
    emptyOutDir: true,
  },
});
