# Four Forces

An interactive Three.js exhibition of fire, air, water, and earth, built with Vite. Every sculpture is generated in code and animates in real time; no model downloads or API keys are required.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173/`).

Drag a sculpture to rotate it, select its arrow to inspect it up close, and use the motion control at the bottom to pause or play the animation. Press Escape to close the detail view.

## Production build

```bash
pnpm build
pnpm preview
```

The sculptures use WebGL, so the browser must support WebGL 2.
