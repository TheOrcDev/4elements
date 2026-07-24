import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/opus-5/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    host: true,
    // Honour PORT when the launcher assigns one, otherwise fall back to Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
  },
  build: {
    target: "es2020",
    outDir: "../playground/public/models/opus-5",
    emptyOutDir: true,
  },
});
