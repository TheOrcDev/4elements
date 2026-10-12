# ELEMENTA — The Four Elements in 3D

A cinematic Three.js / Vite experience: **fire, water, earth and air** as four living
shader orbs on glowing pedestals, with GPU particle systems, Unreal bloom,
orbit controls, click-to-focus camera flights, an auto-tour and keyboard shortcuts.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5194 — it also opens automatically).

## Build for production

```bash
npm run build
npm run preview
```

## What to try

- **Drag** to orbit, **scroll** to zoom
- **Click any orb** to fly into that element (click it again to return)
- Use the **dock** at the bottom, keys **1–5**, or **Esc** to switch views
- Hit **Auto Tour** for a hands-free cycle through all four elements

## How each element is made

| Element | Technique |
|---|---|
| 🔥 Fire | Simplex-noise displaced plasma sphere (GLSL fbm), 900 GPU flame particles with a rise-and-cool lifecycle, orbiting embers, flickering point light, charred rocks |
| 💧 Water | Animated fresnel wave shell over a deep core, 340 orbiting droplets, rising inner bubbles, expanding ripple rings, tilted orbit rings |
| 🌍 Earth | Procedurally displaced low-poly planet with vertex-colour biomes (rock → moss → grass → peaks), pulsing emerald crystals, tiny pine trees, orbiting boulders, drifting spores |
| 🌪 Air | Additive fresnel glass core, spiralling tornado shroud shader, 950 wind particles in a widening vortex, three gyroscope rings |

Shared tech: custom GLSL (Ashima simplex noise), additive sprite glows,
canvas-generated name plates, ACES tone mapping and `UnrealBloomPass` post-processing.

## Project structure

```
index.html        UI shell (top bar, info panel, element dock)
src/main.js       Scene, camera flights, post-processing, interaction
src/elements.js   createFire / createWater / createEarth / createAir
src/shaders.js    Shared GLSL simplex-noise + fbm chunk
src/style.css     Glassmorphism UI, responsive layout
```
