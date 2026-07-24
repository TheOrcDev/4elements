import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  // Served from /models/sol-ultra/ inside the playground, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  build: {
    outDir: "../playground/public/models/sol-ultra",
    emptyOutDir: true,
  },
  plugins: [react()],
  server: isCodexSeatbeltSandbox
    ? {
        watch: {
          useFsEvents: false,
          usePolling: true,
        },
      }
    : undefined,
});
