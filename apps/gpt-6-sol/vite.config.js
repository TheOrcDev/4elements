import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/gpt-6-sol/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 5188,
  },
  build: {
    outDir: "../playground/public/models/gpt-6-sol",
    emptyOutDir: true,
  },
});
