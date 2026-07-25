import fs from "node:fs/promises";
import { chromium } from "playwright";

const targetUrl = process.env.FOUR_ELEMENTS_URL ?? "http://localhost:4173/";
const models = [
  "opus-5",
  "kimi-k3",
  "grok-4.5",
  "fable-5",
  "sol-ultra",
  "terra-ultra",
  "luna-extra-high",
  "gpt-5.5",
  "sonnet-5",
];
const viewports = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "mobile", width: 390, height: 844 },
];

await fs.mkdir("tests/visual", { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });

    for (const model of models) {
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(String(error)));

      const modelUrl = new URL(targetUrl);
      modelUrl.searchParams.set("model", model);
      await page.goto(modelUrl.toString(), { waitUntil: "networkidle" });

      const selectedModel = new URL(page.url()).searchParams.get("model");
      if (selectedModel !== model) {
        failures.push(
          `${viewport.name} ${model}: expected URL model=${model}, got ${selectedModel}`
        );
      }

      // The model app runs in its own document, so reach through the frame.
      const frame = page.frameLocator("[data-scene-stage] iframe");
      await frame.locator("canvas").first().waitFor({ timeout: 20_000 });
      await page.waitForTimeout(2500);

      const canvas = await page
        .frames()
        .find((candidate) => candidate.url().includes(`/models/${model}/`))
        ?.evaluate(() => {
          const element = document.querySelector("canvas");
          if (!element) {
            return null;
          }
          const context =
            element.getContext("webgl2") ?? element.getContext("webgl");
          return {
            width: element.width,
            height: element.height,
            hasContext: Boolean(context),
          };
        });

      if (!canvas) {
        failures.push(
          `${viewport.name} ${model}: no canvas in the model frame`
        );
      } else if (
        !(canvas.hasContext && canvas.width > 0 && canvas.height > 0)
      ) {
        failures.push(
          `${viewport.name} ${model}: unusable canvas ${JSON.stringify(canvas)}`
        );
      }

      if (pageErrors.length > 0) {
        failures.push(`${viewport.name} ${model}: ${pageErrors.join(" | ")}`);
      }

      await page.screenshot({
        path: `tests/visual/${viewport.name}-${model}.png`,
      });
      console.log(
        `${viewport.name} ${model}: canvas ${canvas?.width}x${canvas?.height}, errors ${pageErrors.length}`
      );
      page.removeAllListeners("pageerror");
    }

    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} failure(s):`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exitCode = 1;
}
