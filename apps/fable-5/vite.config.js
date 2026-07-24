import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/fable-5/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    port: Number(process.env.PORT) || 5176,
  },
  build: {
    outDir: "../playground/public/models/fable-5",
    emptyOutDir: true,
  },
});
