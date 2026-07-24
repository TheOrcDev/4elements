import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vite emits the Primal application shell", async () => {
  const html = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /<title>Primal — The Four Elements<\/title>/i);
  assert.match(html, /<div id="root"><\/div>/i);
  assert.match(html, /type="module"/i);
  assert.match(html, /assets\/.+\.js/i);
  assert.doesNotMatch(html, /_next|vinext|codex-preview/i);
});

test("the browser entry mounts the complete Three.js experience", async () => {
  const [entry, experience, packageJson, viteConfig] = await Promise.all([
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/ElementalExperience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(entry, /createRoot\(root\)\.render\(<ElementalExperience \/>/);
  assert.match(experience, /from "three"/);
  assert.match(experience, /UnrealBloomPass/);
  assert.match(experience, /createFire/);
  assert.match(experience, /createAir/);
  assert.match(experience, /createWater/);
  assert.match(experience, /createEarth/);
  assert.match(experience, /prefers-reduced-motion/);
  assert.match(viteConfig, /@vitejs\/plugin-react/);
  assert.doesNotMatch(packageJson, /next|vinext|wrangler|drizzle|cloudflare/i);
});
