import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/fable-5.1/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5184,
  },
  build: {
    outDir: "../playground/public/models/fable-5.1",
    emptyOutDir: true,
  },
});
