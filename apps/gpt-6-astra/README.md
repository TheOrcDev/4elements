# Elemental

A local, interactive Three.js observatory for fire, air, water, and earth.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by the development server (normally http://localhost:3000).

## Explore

- Click an element or its card to focus. Click **All elements** to return.
- Drag across the scene to rotate the elements; scroll or use a trackpad to zoom.
- **Pause** freezes the simulation. **Reset view** restores the gallery and intensity.
- **Atmosphere** changes the strength and speed of the elements.
- Keyboard: **1–4** select an element, **Space** pauses/resumes, **Escape** returns.
- Reduced-motion preferences start the scene paused.

All objects are generated procedurally, without remote models or image assets. Fire uses a raymarched volume and GPU-animated embers; air uses soft helical mist, fine streamlines, and particles; water uses a transmissive physical surface with reconstructed normals, animated refracted caustics, and undeformed droplets; earth uses welded terrain geometry, procedural grain and fissures, blended moss, faceted mineral crystals, and orbiting rocks. One shared WebGL 2 renderer supplies environment lighting, multisample antialiasing, and HDR bloom. Pausing stops GPU rendering once camera and focus transitions settle, while keeping interaction available. Pixel density is capped to limit GPU cost, and the renderer releases its GPU resources on unmount.

## Validate

```sh
npm run typecheck
npm run lint
npm run build
```

The project is a standard Vite + React + TypeScript single-page app. WebGL 2 and browser hardware acceleration are required. Fonts are served locally from `public/fonts`.

## Production preview

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:4173. The production build is a static site in `dist/` and can be served by any static web host.

## Source layout

- `index.html`: document title, metadata, favicon, and font preloads.
- `src/main.tsx`: React entry point.
- `src/App.tsx`: gallery and interactive controls.
- `src/index.css`: fonts, theme, and responsive styles.
- `src/lib/elements-scene.js`: all four procedural Three.js elements.
- `vite.config.ts`: Vite, React, Tailwind, and local server settings.
