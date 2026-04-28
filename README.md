# 4 Elements

4 Elements is a local-first playground for benchmarking AI-generated interactive 3D elemental scenes. It renders structured scene specs through a deterministic React Three Fiber renderer so Fire, Air, Earth, and Water scenes can be replayed, inspected, and compared consistently.

The current app is a Vite React playground with shadcn UI, Tailwind CSS, Three.js, React Three Fiber, Drei, Zod, and URL-controlled element tabs powered by `nuqs`.

## Features

- Four built-in benchmark scenes: Fire, Air, Earth, and Water.
- Deterministic schema-driven renderer for repeatable 3D output.
- Interactive full-screen playground with shadcn UI controls.
- Search-param routing for the selected element, for example `?element=Fire`.
- Live scene stats for object count, triangle count, and FPS.
- Canvas screenshot export.
- Visual smoke tests for desktop and mobile viewports.

## Requirements

- Node.js compatible with Vite 6 and React 19.
- pnpm 10.33.0, as declared in `packageManager`.

## Getting Started

Install dependencies:

```sh
pnpm install
```

Start the playground:

```sh
pnpm dev
```

Open the Vite URL printed in the terminal. By default the app is available at:

```txt
http://localhost:5173/
```

Fire is the default scene. You can deep-link directly to another element:

```txt
http://localhost:5173/?element=Water
```

## Scripts

```sh
pnpm dev          # Start the Vite playground
pnpm build        # Type-check and create a production build
pnpm preview      # Preview the production build
pnpm check        # Run Biome/Ultracite checks
pnpm fix          # Apply Biome/Ultracite fixes
pnpm typecheck    # Run TypeScript checks for the playground
pnpm test:visual  # Run Playwright canvas smoke tests
```

`pnpm test:visual` expects the playground to be running. Set `FOUR_ELEMENTS_URL` to test a different host:

```sh
FOUR_ELEMENTS_URL=http://localhost:4173/ pnpm test:visual
```

## Workspace

```txt
apps/playground          Vite React app and shadcn UI surface
packages/scene-schema    Zod schema and TypeScript scene types
packages/renderer        React Three Fiber renderer for scene specs
packages/benchmarks      Built-in prompts and reference scene specs
examples/elements        Standalone reference JSON examples
tests/visual             Playwright smoke test and generated screenshots
```

## Scene Model

Scene specs describe cameras, environment settings, lights, and typed objects. The schema supports general primitives plus element-focused objects such as flames, smoke, curtains, wind fields, terrain, rocks, cracks, water surfaces, wave rings, droplets, foam, and particle fields.

Reference specs live in:

```txt
examples/elements/fire/reference.json
examples/elements/air/reference.json
examples/elements/earth/reference.json
examples/elements/water/reference.json
```

## UI Notes

The playground uses shadcn components and semantic Tailwind tokens for UI styling. Element colors inside scene specs are benchmark content, while app chrome should stay on shadcn tokens such as `bg-background`, `text-muted-foreground`, `border-border`, and component variants.

The selected element is stored in the URL with the simplest `nuqs` `useQueryState` flow:

```txt
?element=Fire
?element=Air
?element=Earth
?element=Water
```

## Verification

Before handing off changes, run:

```sh
pnpm check
pnpm typecheck
pnpm build
pnpm test:visual
```

The visual smoke test opens each element on desktop and mobile, confirms the URL tab state, checks that metrics render, verifies the canvas is nonblank, and writes screenshots to `tests/visual`.
