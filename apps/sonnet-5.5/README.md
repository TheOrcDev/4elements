# The Four Elements

Fire, Water, Air and Earth — four real-time, fully procedural 3D shrines rendered with
[Three.js](https://threejs.org) and served by [Vite](https://vitejs.dev). There are no models, no
textures and no external assets: every flame, wave, feather and blade of grass is generated in code.

```bash
npm install
npm run dev        # → http://localhost:5173
```

`npm run build` creates a static site in `dist/` (`npm run preview` serves it).
Needs Node 20.19+ / 22.12+. Append `?fps` to the URL for a live frame-rate / resolution readout.

## Controls

| Input | Action |
| --- | --- |
| Drag / scroll / right-drag | Orbit / zoom / pan |
| Dock buttons, labels, keys `1`–`5` | Fly to Overview, Fire, Water, Air, Earth (`Esc` returns to overview) |
| **Press & hold** a shrine | Unleash it (taller flames, a roaring orb, a faster cyclone, blazing crystals) |
| Double-click a shrine | Fly to it |
| `O` / `F` | Toggle auto-orbit / fullscreen |

The camera drifts slowly on its own when idle (disabled automatically for `prefers-reduced-motion`).

## What's in the scene

- **Fire** – a raymarched volumetric flame (swirling, noise-eroded cone composited front-to-back so
  it saturates like real emission), rising embers, dark smoke, an animated lava pool, glowing veins
  running through the basalt plinth, glossy obsidian spires and a flickering light that lights the plaza.
- **Water** – a wobbling refractive orb (transmission + dispersion) with drifting bubbles and caustic
  veins, three orbiting glass ribbons, falling droplets that spawn splashes, and a custom pool shader
  (layered waves, expanding ripple rings, analytic reflection of the orb, moon glints, caustics, foam).
- **Air** – 140 GPU-animated wind streaks spiralling up a widening cyclone, sphere-shaded cumulus
  lobes, tumbling procedurally drawn feathers, drifting motes and a glowing "wind heart".
- **Earth** – a floating strata island: displaced sediment layers, a wind-swept meadow of 9,000 grass
  blades, emerald and amber crystals that light the grass, trees, boulders, hanging roots, orbiting
  debris, fireflies and falling dust.
- **The stage** – a baked HDR night sky (used for the backdrop, image-based lighting *and* the
  water's reflections), twinkling stars, a moon, distant mountains, a polished plaza with glowing
  alchemical inlays, carved obelisks and a central nexus crystal that ties the four elements together.

## Rendering notes

- HDR pipeline: half-float target → `UnrealBloomPass` (half-res, NaN-guarded) → ACES tone mapping →
  a small finishing pass (vignette, grain, lens fringing, heat shimmer above the fire).
- **Dynamic resolution**: starts at 1.5× pixel ratio and climbs to native if there is headroom,
  backing off (and remembering levels that didn't hold) when the GPU struggles. MSAA is only used
  at low pixel ratios where it is cheap.
- Every animated system runs on the GPU (vertex-shader particles, instanced billboards, raymarching);
  the CPU only simulates the water droplets and orbiting debris.

## Debugging

`window.fe` exposes the renderer, scene, camera rig, composer and elements. Handy in the console:

```js
fe.rig.flyTo('fire', 0.01)   // jump to a shrine ('all' | 'fire' | 'water' | 'air' | 'earth')
fe.advance(5)                // fast-forward the simulation 5 s (no rendering)
fe.post.bloom.strength = 0.3 // poke at the post-processing
```

## Layout

```
src/
  main.js            renderer, scene assembly, loop, dynamic resolution, hover/press interaction
  rig.js             orbit camera + cinematic fly-to transitions
  ui.js, style.css   dock, caption, floating labels, keyboard shortcuts
  post.js            composer: bloom, tone mapping, finishing pass
  config.js          shrine placement, colours, copy
  world/             sky.js (baked sky, stars, moon), arena.js (plaza, obelisks, nexus, lights)
  elements/          fire.js  water.js  air.js  earth.js
  shaders/glsl.js    shared GLSL snippets (noise, hashing, billboards)
  utils/             procedural textures, geometry helpers, seeded RNG
```
