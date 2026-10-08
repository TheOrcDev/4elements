# Four Elements

Fire, air, water and earth as real-time 3D scenes built with [Three.js](https://threejs.org) and [Vite](https://vitejs.dev).

Each element is a self-contained scene with its own geometry, shaders, lighting and camera. Switch between them with the pill navigation, or the keys `1`–`4`.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://127.0.0.1:5173/.

Other scripts:

- `npm run build` writes a production bundle to `dist/`.
- `npm run preview` serves that bundle at http://127.0.0.1:4173/.

Requires Node 20.19+ or 22.12+ and a browser with WebGL 2.

## Controls

| Input | Action |
| --- | --- |
| Drag | Orbit the camera |
| Scroll / pinch | Zoom |
| `1` `2` `3` `4` | Fire, Air, Water, Earth |
| `Space` | Pause or resume the simulation |
| `A` | Toggle auto-orbit |
| `R` | Reset the camera |

URL options: `?element=water` opens a given element, `?warm=4` fast-forwards the simulation four seconds before the first frame, and `?paused=1` starts paused.

## Performance

The scenes are GPU-heavy, so the renderer adapts. It renders at up to 2× device pixel ratio, and if frames run well over budget (about 50 fps) it steps the resolution down, to 1× on slow GPUs. Each element switch starts again at full resolution. Fire is the most demanding scene; Air is the lightest.

## Project layout

```
index.html              page shell and UI markup
src/style.css           UI styling (glass pills, title, toolbar)
src/main.js             renderer, bloom + tone mapping, camera, switching, loop
src/elements/index.js   element registry and the ElementScene contract (JSDoc typedefs)
src/elements/fire.js    volumetric raymarched flame, embers, hearth
src/elements/air.js     streamline vortex with travelling light pulses
src/elements/water.js   Gerstner ocean with sky reflections, foam and sun glitter
src/elements/earth.js   stratified butte with vertex-coloured strata and soft shadows
src/shared/             GLSL noise, particle sprite texture, seeded random numbers
```

### The element contract

Every element module exports a factory `create<Name>(ctx)` that returns:

- `root`: a `THREE.Group` holding everything the element adds.
- `update(time, delta)`: called each frame. `delta` is zero while paused.
- `dispose()`: frees everything the element created.
- `camera`: the starting camera position and orbit target.
- `look`: background, environment map, fog, exposure and bloom settings.
- `controls` (optional): orbit limits and auto-rotation.

See the JSDoc in [`src/elements/index.js`](src/elements/index.js) for the full typedefs.

## Versions

- `three@0.186.0`
- `vite@8.3.0`
