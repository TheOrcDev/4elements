# Four Elements — Three.js

An immersive 3D visualization of the classical four elements: **Fire**, **Air**, **Water**, and **Earth**.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Controls

- **Drag** — orbit camera
- **Scroll** — zoom
- **Click an element** (or use the nav buttons) — focus that element
- **All** — overview of all four

## What’s inside

| Element | Technique |
|---------|-----------|
| Fire | GPU particle flames, embers, additive glow, pulsing core light |
| Air | Vortex particle field, animated wind ribbons, fresnel orb |
| Water | Multi-wave surface shader, caustics, bubbles, spray |
| Earth | Displaced rock mesh, floating stones, crystal spikes, moss, dust |

Post-processing uses **Unreal Bloom** + ACES filmic tone mapping for a cinematic look.
