# ElementBench

ElementBench is a local-first playground for testing how AI models generate structured, interactive 3D scenes. The first benchmark suite asks models to recreate the four classical elements: Fire, Air, Earth, and Water.

The project intentionally asks models for a validated JSON scene spec first. A deterministic Three.js renderer then turns that spec into an interactive scene, which makes outputs easier to compare, replay, and inspect.

## Current Scope

- Vite, React, TypeScript, Three.js, React Three Fiber, Drei, and Zod.
- pnpm workspace with separate schema, renderer, and benchmark packages.
- Four built-in elemental reference specs.
- Full-screen playground with a JSON editor and schema validation panel.
- Deterministic primitives for curtain wind, leaves, dust, flame, smoke, terrain, rocks, cracks, water, rings, and foam.
- Screenshot export from the active canvas.

## Local Setup

```sh
pnpm install
pnpm dev
```

Then open the local URL printed by Vite.

With the dev server running, visual smoke checks can be run with:

```sh
pnpm test:visual
```

## Workspace

```txt
apps/playground        Vite React playground
packages/scene-schema  Zod schema and TypeScript scene types
packages/renderer      Schema-driven React Three Fiber renderer
packages/benchmarks    Canonical prompts and reference scene specs
examples/elements      JSON examples for Fire, Air, Earth, and Water
tests/visual           Reserved for Playwright visual checks
```

## Benchmark Prompts

- Fire: a ritual flame above dark stone, with embers, warm light, rising sparks, subtle smoke, and animated flicker.
- Air: a pale curtain and loose leaves moving in visible wind beside an open window, with soft dust trails.
- Earth: layered terrain with rocks, soil, moss, and a slow fracture revealing glowing minerals.
- Water: a clear pool with ripples, reflective highlights, droplets, foam, and caustic light.

## Roadmap

- Add OpenAI-compatible and Ollama model adapters.
- Add side-by-side model comparison mode.
- Store run history locally.
- Add Playwright screenshot tests and canvas nonblank checks.
- Add import/export bundles for benchmark runs.
