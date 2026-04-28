import fs from "node:fs/promises";
import { chromium } from "playwright";

const targetUrl = process.env.FOUR_ELEMENTS_URL ?? "http://localhost:5173/";
const viewports = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "mobile", width: 390, height: 844 },
];
const elements = ["Fire", "Air", "Earth", "Water"];

await fs.mkdir("tests/visual", { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("canvas");
    await page.getByRole("radio", { name: "Opus 4.7" }).click();
    const selectedModel = new URL(page.url()).searchParams.get("model");
    if (selectedModel !== "opus-4.7") {
      throw new Error(
        `${viewport.name}: expected URL model=opus-4.7, got ${selectedModel}`
      );
    }

    for (const element of elements) {
      await page.getByRole("button", { name: element }).click();
      await page.waitForTimeout(1100);
      const metrics = await page.locator("[data-metrics]").innerText();
      const pixels = await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        if (!canvas) {
          return { samples: 0, nonBlank: 0, width: 0, height: 0 };
        }

        const probe = document.createElement("canvas");
        probe.width = Math.min(canvas.width, 320);
        probe.height = Math.min(canvas.height, 240);
        const context = probe.getContext("2d");
        if (!context) {
          return {
            samples: 0,
            nonBlank: 0,
            width: canvas.width,
            height: canvas.height,
          };
        }

        context.drawImage(canvas, 0, 0, probe.width, probe.height);
        const data = context.getImageData(0, 0, probe.width, probe.height).data;
        let samples = 0;
        let nonBlank = 0;
        for (let i = 0; i < data.length; i += 4 * 17) {
          samples += 1;
          const brightness = data[i] + data[i + 1] + data[i + 2];
          if (data[i + 3] > 0 && brightness > 24) {
            nonBlank += 1;
          }
        }
        return {
          samples,
          nonBlank,
          width: canvas.width,
          height: canvas.height,
        };
      });

      if (!(metrics.includes("objects") && metrics.includes("triangles"))) {
        throw new Error(`${viewport.name} ${element}: ${metrics}`);
      }
      const currentElement = new URL(page.url()).searchParams.get("element");
      if (currentElement !== element) {
        throw new Error(
          `${viewport.name} ${element}: expected URL element=${element}, got ${currentElement}`
        );
      }
      if (pixels.nonBlank < Math.max(8, pixels.samples * 0.03)) {
        throw new Error(
          `${viewport.name} ${element}: canvas appears blank ${JSON.stringify(pixels)}`
        );
      }

      await page.screenshot({
        path: `tests/visual/${viewport.name}-${element.toLowerCase()}.png`,
        fullPage: true,
      });
      console.log(
        `${viewport.name} ${element}: ${metrics.replace(/\n/g, " | ")} canvas ${pixels.width}x${pixels.height}, nonblank ${pixels.nonBlank}/${pixels.samples}`
      );
    }

    await page.close();
  }
} finally {
  await browser.close();
}
