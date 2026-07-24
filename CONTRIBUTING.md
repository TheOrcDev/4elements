# Contributing

4 Elements is early, so the best contributions are small, visible, and reproducible.

## Development

```sh
pnpm install
pnpm dev
```

Before opening a pull request, run:

```sh
pnpm check
pnpm typecheck
pnpm build
```

## Adding a model

A model's entry is a complete, self-contained web app that renders fire, water, earth and air in real time. Give the model the brief, keep whatever it produces, and wire it in.

1. **Put the app in `apps/<model-id>/`** — a Vite app with its own `package.json`. Keep the model's code exactly as generated; do not reformat it or port it onto another model's abstractions. Its dependencies are its own, including the Three.js version.

2. **Point its build at the playground.** In `apps/<model-id>/vite.config.js`:

   ```js
   base: './',
   build: {
     outDir: '../playground/public/models/<model-id>',
     emptyOutDir: true,
   },
   ```

   The relative `base` matters — the app is served from a subdirectory, so rooted asset URLs will 404.

3. **Exclude it from linting** in `biome.jsonc`, alongside the existing entries:

   ```jsonc
   "!apps/<model-id>/**"
   ```

4. **Register it in the playground** — add an entry to `modelOptions` in `apps/playground/src/main.tsx` with a label, the `<model-id>` value, a one-line summary, and its controls.

5. **Build it with the others** — add it to `build:models` in `apps/playground/package.json`, and to `models` in `tests/visual/smoke.mjs`. That script is what the playground's `dev` and `build` run first, so the generated output exists before the shell is served.

6. **Verify:**

   ```sh
   pnpm build
   pnpm preview
   pnpm test:visual
   ```

   Then open `http://localhost:4173/?model=<model-id>`.

## What makes a good entry

- It runs at an interactive frame rate on a laptop GPU.
- All four elements are present and identifiable.
- It is the model's own work, kept intact — that is the thing being compared.
- It cleans up after itself well enough to survive being switched away from and back to.

## The playground

The shell stays deliberately thin: pick a model, render it, get out of the way. It draws nothing over the viewport except a load state, because each model app owns its title, HUD and element navigation. Changes to the shell should follow this repo's standards and use shadcn components with semantic Tailwind tokens.
