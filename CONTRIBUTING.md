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
