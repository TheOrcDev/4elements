# Contributing

ElementBench is early, so the best contributions are small, visible, and reproducible.

## Development

```sh
pnpm install
pnpm dev
```

Before opening a pull request, run:

```sh
pnpm typecheck
pnpm build
```

## Adding a New Model

1. **Generate specs** — copy the prompt from [`examples/GENERATION_PROMPT.md`](examples/GENERATION_PROMPT.md) and paste it into the model you want to benchmark. It will output four JSON blocks (Fire, Air, Earth, Water).

2. **Save the JSON files**:
   ```
   examples/elements/fire/<model-id>.json
   examples/elements/air/<model-id>.json
   examples/elements/earth/<model-id>.json
   examples/elements/water/<model-id>.json
   ```

3. **Register in `packages/benchmarks/src/index.ts`**:
   - Add `"<model-id>"` to the `ModelName` union (line 4).
   - Define four spec constants from your JSON files.
   - Add an entry to `benchmarkSpecs` that wraps each with `sceneSpecSchema.parse()`.

4. **Add to the UI in `apps/playground/src/main.tsx`**:
   - Append `{ label: "Model Name", value: "<model-id>" }` to `modelOptions`.

5. **Verify**:
   ```sh
   pnpm typecheck
   pnpm dev
   # open http://localhost:5174/?element=Fire&model=<model-id>
   ```

## Scene Specs

Scene specs should stay deterministic and validate against `packages/scene-schema`.

Good reference scenes:

- load quickly,
- keep object counts modest,
- use explicit seeds,
- show the visual vocabulary of the prompt,
- avoid custom code inside the spec.

## Renderer Changes

Prefer adding small schema-backed primitives over adding arbitrary script hooks. The benchmark is most useful when every model output can be validated, replayed, and compared.
