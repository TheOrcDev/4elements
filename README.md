# 4 Elements

4 Elements is a local-first benchmark for AI-generated interactive 3D scenes. Each model gets the same brief — fire, water, earth and air, rendered in real time in the browser — and ships a complete, self-contained WebGL app. The playground is a thin shell that lets you switch between those apps and compare them.

## Models

| Model | Reasoning | Time to build | App |
| --- | --- | --- | --- |
| Opus 5 | Max | 47 min | [`apps/opus-5`](apps/opus-5) |
| Kimi K3 | Max | 70 min | [`apps/kimi-k3`](apps/kimi-k3) |

Both models ran at the highest reasoning setting they offer. For Opus 5 that is thinking effort `max`; for Kimi K3 it is the [`reasoning_effort`](https://platform.kimi.ai/docs/guide/use-kimi-k2-thinking-model) field set to `max`, the top of its `low` / `high` / `max` range. Time to build is wall-clock from the brief to a working app.

**Opus 5** puts all four elements on one stage, each on its own custom GLSL shader: a volumetric raymarched flame, a refracting swell, ridged terrain with magma in the cracks, and 50k particles integrating a curl field.

**Kimi K3** builds four procedural elemental worlds you move between, each with its own shaders, GPU particles and bloom pass.

Each app's own README documents how that model built its scenes.

## How it works

Model apps are kept exactly as the model wrote them — their own Three.js version, their own build, their own in-scene UI. They are not ported to a shared renderer, because the point of the benchmark is what the model actually produced.

Each app builds to `apps/playground/public/models/<model-id>/`, and the playground loads the selected one in an iframe. That isolation is what lets two apps on different Three.js versions coexist, and it keeps each model's post-processing and animation loop intact.

That output is generated, not committed, so the playground's own `dev` and `build` scripts build the model apps first. Deploying works whether the host builds from the repo root or from `apps/playground`.

## Requirements

- Node.js compatible with Vite 6 and React 19.
- pnpm 10.33.0, as declared in `packageManager`.

## Getting started

```sh
pnpm install
```

```sh
pnpm dev
```

`pnpm dev` builds both model apps first, then starts the playground. Open the Vite URL it prints, by default:

```txt
http://localhost:5173/
```

Opus 5 is the default. Deep-link to a model with the `model` search param:

```txt
http://localhost:5173/?model=kimi-k3
```

To work on a single model app with hot reload, run it on its own:

```sh
pnpm --filter @4elements/opus-5 dev
```

## Scripts

```sh
pnpm dev          # Build the model apps, then start the playground
pnpm build        # Build the model apps, then build the playground
pnpm build:models # Build only the model apps into the playground's public dir
pnpm preview      # Preview the production build
pnpm check        # Run Biome/Ultracite checks
pnpm fix          # Apply Biome/Ultracite fixes
pnpm typecheck    # Run TypeScript checks for the playground
pnpm test:visual  # Run Playwright smoke tests
```

`pnpm test:visual` expects a server to be running, and defaults to the preview port. Set `FOUR_ELEMENTS_URL` to point somewhere else:

```sh
FOUR_ELEMENTS_URL=http://localhost:5173/ pnpm test:visual
```

The smoke test loads each model on desktop and mobile viewports, confirms the URL state, checks that the model's canvas has a live WebGL context, watches for page errors, and writes screenshots to `tests/visual`.

## Workspace

```txt
apps/playground   Vite React shell: model selector and viewport
apps/opus-5       Opus 5's Four Elements app
apps/kimi-k3      Kimi K3's Four Elements app
tests/visual      Playwright smoke test and generated screenshots
```

Only the playground follows this repo's lint and formatting standards. The model apps are excluded in `biome.jsonc` so their code stays byte-for-byte as generated.

## UI notes

The playground uses shadcn components and semantic Tailwind tokens — `bg-background`, `text-muted-foreground`, `border-border` and component variants. It deliberately draws nothing over the viewport except a load state, since each model app renders its own title, HUD and element navigation.

The selected model is stored in the URL with the simplest `nuqs` `useQueryState` flow.

## Resources

- [Base UI](https://base-ui.com/) — unstyled, accessible React component primitives.
