import { defineConfig } from "vite";

export default defineConfig({
  // Served from /models/glm-5.2/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  server: {
    host: true,
    port: 5182,
    open: true,
  },
  build: {
    target: "esnext",
    outDir: "../playground/public/models/glm-5.2",
    emptyOutDir: true,
  },
});
