import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/kimi-k3/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : 5174,
    strictPort: false,
  },
  build: {
    target: "es2020",
    outDir: "../playground/public/models/kimi-k3",
    emptyOutDir: true,
  },
});
