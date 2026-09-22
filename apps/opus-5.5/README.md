# Elementa — the four classical elements in Three.js

A real-time 3D sanctum where **Fire, Air, Water and Earth** each stand on their own altar,
built with [Three.js](https://threejs.org) (r186, WebGL 2) and [Vite](https://vite.dev).
Everything is procedural: there are no textures, models or audio files, only code and shaders.

## Run it

You need Node.js **20.19+ or 22.12+**.

```bash
npm install
npm run dev        # opens http://localhost:5173
```

To build a production version, run `npm run build`. To serve that build locally, run `npm run preview`.

> Run `npm install` on the machine you'll run it on. Vite's bundler ships native binaries for each platform.

## Controls

| Action | Input |
| --- | --- |
| Orbit / zoom | drag / scroll (pinch on touch) |
| Visit an element | click it, or press `1` Fire · `2` Air · `3` Water · `4` Earth |
| Next / previous element | `→` / `←` |
| Back to the whole sanctum | `Esc` or `0`, or double-click empty space |
| Auto-orbit when idle | `R` (on by default) |
| Ambient sound | `S` (procedural, off by default) |
| Hide the interface | `H` |
| Fullscreen | `F` |

## What's in each element

**Fire.** The flame is a real volume: a ray-marched density field inside a box. Upward-scrolling 3D noise tears the flame into licking tongues. A black-body-style colour ramp shades it from white-yellow at the core to deep red at the tips. Around the flame:

- glowing coals and charred logs with animated ember cracks;
- about 560 GPU embers on turbulent paths;
- soft smoke puffs;
- a flickering point light that lights the whole sanctum;
- screen-space heat haze above the flames.

**Air.** A bending tornado made of several parts:

- nested funnel shells of streaked, swirling noise;
- about 110 camera-facing wind ribbons that trail each particle's recent path;
- 900 dust motes and tumbling autumn leaves;
- cloud puffs curling around a glowing spiral vent.

All the particles follow the same analytic vortex, computed statelessly on the GPU.

**Water.** A floating, wobbling sphere of water: a physically based transmissive material with refraction, IOR 1.33, dispersion and attenuation. Its vertex shader displaces the surface with noise and recomputes the normals by finite differences. Around it:

- a faint net of caustic light inside the orb;
- streams of flowing water circling it;
- orbiting droplets and bubbles rising inside it;
- drips that fall into a basin, where each impact sends out analytic ripples over animated caustics.

**Earth.** A floating island generated procedurally, with jagged, stratified rock underneath and stalactites and dangling roots. On top:

- 3,800 wind-swept grass blades and a few flowers;
- a tree with about 2,600 fluttering leaves;
- faceted, iridescent emerald crystals;
- orbiting boulders, falling dust and fireflies.

**The sanctum.** A procedural stone floor is shaded per pixel:

- paving and a rune band;
- glowing channels that pulse between the altars;
- alchemical glyphs (🜂 🜁 🜄 🜃);
- weathering from each element: scorch marks, wet stone, moss and dust swirls.

Around it:

- a night sky with a nebula band and 4,000 twinkling stars;
- a floating rocky underside and drifting islets;
- bloom, ACES tone mapping, vignette and film grain.

## Performance and quality

The renderer adjusts its pixel ratio if the frame rate drops. You can also choose a quality preset in the URL:

- `?q=high` (the default): up to 2× pixel ratio, 52 ray-march steps.
- `?q=medium`
- `?q=low`: 1× pixel ratio, fewer steps and fewer particles, for older GPUs.

### Developer URL parameters

| Param | Effect |
| --- | --- |
| `focus=fire` | start focused on an element (`fire`, `air`, `water`, `earth`) |
| `nointro` | skip the opening camera flight |
| `only=water` | build just one element (fast iteration) |
| `t=12.5` / `freeze` | start at a given time / stop the clock |
| `cam=x,y,z&tgt=x,y,z` | start from an explicit camera |
| `noadapt` | disable adaptive resolution |

## Project structure

```
src/
  main.js              boot: loader, app, UI, sound
  App.js               renderer, scene, render loop, focus logic, adaptive quality
  config.js            element definitions, colours, lore, camera framings
  elements/            Fire.js · Air.js · Water.js · Earth.js
  world/               Sky, Platform (floor, pedestals, rim, islets), Lighting, Motes, rocks
  fx/PostFX.js         heat haze + chromatic aberration → bloom → tone mapping → grain
  core/CameraRig.js    OrbitControls + cinematic fly-to transitions
  gl/                  GLSL snippets, CPU-generated tileable 2D/3D noise textures, material patching
  ui/UI.js, style.css  overlay, dock, info panel, keyboard/pointer handling
  audio/Soundscape.js  procedural WebAudio ambience, spatialised by camera
```

## Credits

- 3D simplex noise: Ashima Arts and Stefan Gustavson (MIT).
- Hash functions: "Hash without Sine" by Dave Hoskins (MIT).
- Fonts: Cinzel and Inter via Fontsource (SIL OFL).
