# 4 Elements

4 Elements is a local-first benchmark for AI-generated interactive 3D scenes. Each model gets the same brief — fire, water, earth and air, rendered in real time in the browser — and ships a complete, self-contained WebGL app. The playground is a thin shell that lets you switch between those apps and compare them.

## Models

| Model | Reasoning | Time to build | App |
| --- | --- | --- | --- |
| Opus 5 | Max | 47m | [`apps/opus-5`](apps/opus-5) |
| Kimi K3 | Max | 70m | [`apps/kimi-k3`](apps/kimi-k3) |
| Grok 4.6 | High | 4m 26s | [`apps/grok-4.6`](apps/grok-4.6) |
| Grok 4.5 | High | 5m 37s | [`apps/grok-4.5`](apps/grok-4.5) |
| Fable 5 | Max | 16m | [`apps/fable-5`](apps/fable-5) |
| Sonnet 5 | Max | 17m | [`apps/sonnet-5`](apps/sonnet-5) |
| Terra Ultra | Ultra | 8m 41s | [`apps/terra-ultra`](apps/terra-ultra) |
| Luna Extra High | Extra High | 8m 46s | [`apps/luna-extra-high`](apps/luna-extra-high) |
| GLM 5.2 | Max | 8m 27s | [`apps/glm-5.2`](apps/glm-5.2) |
| GPT 5.5 | Extra High | 9m 59s | [`apps/gpt-5.5`](apps/gpt-5.5) |
| Fable 5.1 | Max | 39m 1s | [`apps/fable-5.1`](apps/fable-5.1) |
| Sol Ultra | Ultra | 25m | [`apps/sol-ultra`](apps/sol-ultra) |
| Gemini 3.8 Flash | High | 35m 56s | [`apps/gemini-3.8-flash`](apps/gemini-3.8-flash) |
| Gemini 3.7 Flash | High | 28m 20s | [`apps/gemini-3.7-flash`](apps/gemini-3.7-flash) |

Every model ran at the highest reasoning setting it offers, so the times are comparable as "best effort", not as like-for-like compute. For Opus 5, Fable 5, Fable 5.1 and Sonnet 5 that is thinking effort `max`. Kimi K3 uses [`reasoning_effort`](https://platform.kimi.ai/docs/guide/use-kimi-k2-thinking-model) at `max`, the top of its `low` / `high` / `max` range. Grok 4.5 uses [`reasoning_effort`](https://docs.x.ai/developers/grok-4-5) at `high`, the top of its `low` / `medium` / `high` range. Terra Ultra, Sol Ultra, Luna Extra High and GLM 5.2 Max name their tier in the model name itself. Both Gemini entries use [`thinking_level`](https://ai.google.dev/gemini-api/docs/gemini-3) at `high`, the top of their `low` / `high` range. Time to build is wall-clock from the brief to a working app.

**Opus 5** puts all four elements on one stage, each on its own custom GLSL shader: a volumetric raymarched flame, a refracting swell, ridged terrain with magma in the cracks, and 50k particles integrating a curl field.

**Kimi K3** builds four procedural elemental worlds you move between, each with its own shaders, GPU particles and bloom pass.

**Grok 4.6** builds a cinematic sanctum holding all four elements, with a dock for focusing each one in turn.

**Grok 4.5** holds one stage with GPU particle flames, a vortex field with wind ribbons, a multi-wave water surface with caustics, and displaced rock with crystal spikes, finished with unreal bloom and ACES tone mapping.

**Fable 5** stands the four elements on lit plinths in one scene, on custom GLSL shaders with GPU particles and bloom post-processing.

**Fable 5.1** holds all four elements in one environment, each on its own shader module over a shared noise field, with an overview you can fly back out to.

**GLM 5.2** raises the four elements on one stage, each from its own shader material and particle system, composited through an unreal bloom pass.

**Sonnet 5** sets the four elements against a starfield, each on its own shader material and particle system, composited through an unreal bloom pass.

**Terra Ultra** builds a sanctum where each element has its own procedural form — ascending embers over a pulsing core, orbiting wind ribbons, a refractive sapphire orb ringed by waves, and levitating faceted stone veined with crystal.

**Luna Extra High** lays all four specimens out as an atlas, each its own live geometry in a grid, with a side panel selecting the active force and reading out its state, energy and range.

**GPT 5.5** strings four plinths along one lit path, each holding an element built from custom shader materials and instanced point systems, composited through an unreal bloom pass.

**Gemini 3.8 Flash** rings a central catalyst with the four elements, each channelling an energy beam into it, with a convergence view, cinematic orbit and generated audio.

**Gemini 3.7 Flash** builds a nexus holding the four elements plus a fifth fusion form, each on its own TypeScript shader module, with a camera controller, post-processing chain and generated audio.

**Sol Ultra** presents the elements as a field guide, each with its own bloom-lit composition. It currently does not get past its own loading veil — see [Known issues](#known-issues).

Each app's own README documents how that model built its scenes.

## Known issues

**Sol Ultra stays on its loading veil.** It builds, mounts a correctly sized canvas and acquires a live WebGL context, but never reveals the scene. This reproduces standalone, outside the playground, so it is not an artefact of being framed.

`ElementalExperience` lifts the veil by applying `.is-ready`, which it does on the second pass through its render loop. That class is never applied, so the loop is not getting that far. An earlier, separate fault — `#root` having no height, which collapsed the canvas to zero — has been fixed upstream and is no longer the cause.

The app is left as the model wrote it rather than patched, since what it produced is the result being measured.

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

`pnpm dev` builds every model app first, then starts the playground. Open the Vite URL it prints, by default:

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
apps/playground       Vite React shell: model selector and viewport
apps/opus-5           Opus 5's Four Elements app
apps/kimi-k3          Kimi K3's Four Elements app
apps/grok-4.5         Grok 4.5's Four Elements app
apps/grok-4.6         Grok 4.6's Four Elements app
apps/fable-5          Fable 5's Four Elements app
apps/fable-5.1        Fable 5.1's Four Elements app
apps/sonnet-5         Sonnet 5's Four Elements app
apps/glm-5.2          GLM 5.2's Four Elements app
apps/gemini-3.7-flash Gemini 3.7 Flash's Four Elements app
apps/gemini-3.8-flash Gemini 3.8 Flash's Four Elements app
apps/sol-ultra        Sol Ultra's Four Elements app
apps/terra-ultra      Terra Ultra's Four Elements app
apps/luna-extra-high  Luna Extra High's Four Elements app
apps/gpt-5.5          GPT 5.5's Four Elements app
tests/visual          Playwright smoke test and generated screenshots
```

Only the playground follows this repo's lint and formatting standards. The model apps are excluded in `biome.jsonc` so their code stays byte-for-byte as generated.

## UI notes

The playground uses shadcn components and semantic Tailwind tokens — `bg-background`, `text-muted-foreground`, `border-border` and component variants. It deliberately draws nothing over the viewport except a load state, since each model app renders its own title, HUD and element navigation.

The selected model is stored in the URL with the simplest `nuqs` `useQueryState` flow.

## Resources

- [Base UI](https://base-ui.com/) — unstyled, accessible React component primitives.
