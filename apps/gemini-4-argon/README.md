# AETHERIA — Three.js Sanctuary of the Four Elements

A real-time WebGL2 visualization of the four elements (**Ignis / Fire**, **Aqua / Water**, **Terra / Earth**, and **Ventus / Air**) arranged around a central **Aether Convergence Nexus**, built with **Three.js**, custom **GLSL 3D Simplex/FBM shaders**, **GPU particle systems** (10,200+ active particles), and **UnrealBloomPass** post-processing.

## Project Structure

```text
four-elements/
├── index.html                        # Entry HTML & interactive HUD overlay
├── package.json                      # Dependencies & scripts (Vite + Three.js)
├── package-lock.json                 # Locked dependency versions
├── src/
│   ├── main.js                       # Scene, camera transitions, bloom & HUD logic
│   ├── style.css                     # Glassmorphic HUD styling
│   ├── shaders/
│   │   └── noise.glsl.js             # 3D Simplex Noise, FBM & Ridged FBM GLSL library
│   ├── elements/
│   │   ├── FireElement.js            # Ignis: Magma core, volumetric flame shells & embers
│   │   ├── WaterElement.js           # Aqua: Gerstner wave liquid orb, caustics & hydro-vortex
│   │   ├── EarthElement.js           # Terra: Tectonic geode monolith, crystal spires & rings
│   │   └── AirElement.js             # Ventus: Tornado vortex funnels, storm eye & slipstreams
│   └── scene/
│       └── SanctuaryEnvironment.js   # Sacred obsidian floor, Aether Merkaba & starfield
└── dist/                             # Pre-built production bundle ready to upload anywhere
```

## Quick Start (Development)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local Vite development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Deploying Elsewhere

- **Zero-build option**: Upload the contents of the `dist/` folder directly to any static web host (Cloudflare Pages, Netlify Drop, Vercel, GitHub Pages, AWS S3, Firebase Hosting, etc.).
- **Git / CI option**: Connect the project root folder to your hosting provider with build command `npm run build` and output directory `dist`.
