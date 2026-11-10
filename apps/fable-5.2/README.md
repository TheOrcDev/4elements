# Elementa

Fire, water, earth and air in one real-time scene, built with [three.js](https://threejs.org) and [Vite](https://vite.dev).

It is dusk on an endless flooded plain. A few centimetres of still water lie over dark stone and
mirror the sky. Under the water one great seal is engraved, joining four rings to its centre, and on
each ring stands an element:

- **Fire — the pyre.** A raymarched flame over a bowl of burning timber, with embers, smoke and heat haze.
- **Water — the deep.** A column cut out of the open sea, ray-traced so you can look into it.
- **Earth — the monolith.** A levitating, stratified rock split open around a geode of crystal.
- **Air — the vortex.** A volumetric tornado under a turning cloud, with everything the wind carries.

Every element is lit by the same sky, by the fire's flicker and by the vortex's lightning; each is
reflected in the water and disturbs it with real ripples. Everything is procedural: there are no
textures, models or sound files in the project.

## Run it

```sh
npm install
npm run dev
```

Then open <http://localhost:5195/>.

```sh
npm run build     # production build in dist/, relocatable (relative asset paths)
npm run preview   # serve the build on http://localhost:4195/
```

Requires a browser with WebGL 2 (any current Chrome, Edge, Firefox or Safari).

## Controls

| Input | Action |
| --- | --- |
| Drag / one finger | Orbit |
| Wheel / pinch | Zoom |
| Click an element, or `1` `2` `3` `4` | Fly to fire, water, earth, air |
| `0` or `Esc` | Back to the overview (`Esc` first brings back a hidden interface) |
| `←` `→` | Previous / next element |
| `T` | Tour: visit each element in turn (also starts by itself after 110 s without input) |
| `Space` | Pause time |
| `O` | Idle auto-orbit on / off |
| `M` | Sound on / off (off by default) |
| `Q` | Next quality tier |
| `F` | Fullscreen |
| `H` | Hide / show the interface |
| `?` | List of keys |
| `` ` `` | Frame-rate readout |
| Move the pointer over the water | Leaves a trail of ripples; click for a splash |

## How it is built

```
src/
  main.js               entry point
  core/                 the stage every element shares
    App.js              renderer, loop, element loading, picking, tour, quality governor, dev hooks
    Pipeline.js         the multi-stage frame (below)
    Sky.js              analytic dusk sky, stars, Milky Way, moon, clouds, meteors, environment map
    Ground.js           the water film: planar reflection, ripples, the engraved seal
    Ripples.js          GPU wave-equation height field anything can disturb
    Mist.js             shallow ground mist with analytic point-light scattering
    CameraRig.js        orbit controls and eased flights between views
    Noise3D.js          bakes the shared tiling 3D noise texture on the GPU
    glsl/               shared shader library: noise, sky model, ray/shape intersections, depth helpers
    shared.js           uniforms shared by reference across every material
    layers.js           the render stages an object can belong to
    layout.js           where the elements stand
  elements/
    fire/ water/ earth/ air/     one self-contained module each
  ui/                   interface layer (DOM + CSS, no framework)
  audio/                procedural Web Audio soundscape, loaded on demand
tools/shot.mjs          headless screenshot / benchmark tool (drives Chrome over CDP)
```

### One frame

Later stages read what earlier ones drew, which is what lets a flame be seen through a wave or a
cloud stop at a rock:

1. **Mirror** — everything except the ground, from a camera reflected in the water plane, at half resolution.
2. **Opaque** — solid geometry and the ground, with the moon's shadow map. Its depth is kept for every later stage.

Then, element by element, from the farthest from the camera to the nearest:

3. **Volumes** — the element's raymarched volumes (flame, smoke, tornado) at half resolution with
   premultiplied alpha, clipped against the opaque depth, joined to the frame with a depth-aware upsample.
4. **Particles** — embers, spray, dust, ribbons at full resolution.
5. **Refraction** — surfaces that bend light (the sea, heat haze) sample a copy of the frame so far.
6. **Late** — whatever has to sit on top of those (spray in front of the water, sparks).

Working through the elements back to front means a tornado standing in front of the sea is drawn
over it, and a flame behind the sea is seen through it.

7. **Bloom** — 13-tap downsample chain with a Karis-weighted prefilter, tent-filter upsample.
8. **Output** — FXAA, exposure, ACES filmic tone mapping, a light grade, vignette, grain and dither.

The elements never talk to each other directly. They share a small set of uniforms (`shared.js`):
the fire writes its flickering light, the vortex writes its lightning, and everyone reads both.

### Quality and speed

Four tiers (`low`, `medium`, `high`, `ultra`) set raymarch step counts and buffer sizes; `ultra`
is `high` plus extras (finer raymarching, larger mirror and volume buffers, 4× multisampling). On
top of that a governor watches the frame rate: it drops ultra's extras first, then trades internal
resolution — never scene content — and on a very slow machine steps down a tier it chose itself.
Each view remembers its own level, and a level lost to another program's load is retried later.
The canvas is drawn at that internal resolution and stretched to the page by the browser, so no
pass ever touches more pixels than were rendered.

Things that turned out to matter on a tile-based GPU: multisampled HDR targets cost several
milliseconds of memory traffic on their own (hence FXAA); anything procedural that is evaluated per
pixel over half the screen should be a texture fetch instead (the cloud deck, the cracked salt
crust and the wind on the water all read baked noise); and geometry that is drawn three times a
frame (shadow map, mirror, main view) wants a light stand-in for two of them.

## URL parameters

| Parameter | Effect |
| --- | --- |
| `focus=fire\|water\|earth\|air` | Start on that element |
| `solo=<id>` | Load only that element (`solo=none`: the stage alone) |
| `quality=low\|medium\|high\|ultra` | Start in that tier |
| `scale=0.25…1` | Fix the internal render scale (disables the governor) |
| `t=<seconds>` | Simulate that long before the first frame |
| `cam=px,py,pz,tx,ty,tz` | Explicit camera position and target |
| `orbit=0` `mirror=0` `mist=0` `noui` | Switch a feature off |

## Development tools

`tools/shot.mjs` opens the page in headless Chrome with the real GPU, waits for the scene, and
writes a PNG while printing console output and shader errors. Runs take turns, so several shells
can use it at once without starving each other:

```sh
node tools/shot.mjs --url "http://localhost:5195/?focus=fire&noui&t=8" --out fire.png
node tools/shot.mjs --url "http://localhost:5195/?noui" --width 1920 --height 1080 --no-shot --bench 120
node tools/shot.mjs --url "http://localhost:5195/?noui" --no-shot --eval "JSON.stringify(window.__app.cost('air'))"
```

`window.__app` exposes `focus(id)`, `jump(id)`, `overview()`, `tour()`, `advance(seconds)`,
`setCamera(...)`, `setQuality(name)`, `bench(frames)` (milliseconds per frame, GPU-synced),
`cost(id)` (what one element adds to the frame) and `state` for automation; `window.__ready` turns
true once the first real frame is on screen.

## How it was built

Built by Claude Fable 5.2 at thinking effort `max` in one Claude Code session, working as a small
team, and finished by Claude Opus 5.5 after Fable 5.2's usage credits ran out. The session first
wrote the shared stage (renderer and frame pipeline, sky, water film, camera, the screenshot tool)
and a written contract for the element modules, then directed subagents of itself, each with one
job and its own files:

1. **Build** — one engineer per element, plus one each for the interface and the soundscape.
2. **Critique and polish** — every part reviewed with fresh eyes and reworked, then a speed round
   that took a 1080p frame from 31 ms to about 9 ms.
3. **Review** — three independent reviewers (art direction, motion, robustness) with 31 findings,
   a redesign of the vortex's storm cloud and fixes by five engineers. Fable 5.2's credits ran out
   as the fixes were being finished (all five had done most of their work).
4. **Finish (Opus 5.5)** — the session continued on Opus 5.5: one engineer checked and completed
   the camera and app work, another softened the film's glare at a lightning strike, and two
   adversarial verifiers re-checked every finding, measured every view and built the app.
5. **Final polish (Opus 5.5)** — four engineers worked through what the verifiers left open (the
   storm cloud and funnel, close-up framing, the resolution governor, the pyre seen through the
   sea, the earth island's shore), and one more adversarial check approved the result.

28 Fable 5.2 subagents and 9 Opus 5.5 subagents, and 14 h 22 m of working time from the brief to
the finished scene: Fable 5.2 led the first 10 h 33 m, Opus 5.5 the last 3 h 48 m. That leaves out
6 h 37 m overnight, when the session sat idle after its usage credits ran out the first time.

### Known limitations

- From 20–30 m the tornado's funnel still reads a little like a twisted rope; close up and from
  below it reads as vapour.
- Seen from straight above, the storm cloud is a heap of rounded lobes rather than a flat-topped
  cell, and a faint horizontal seam can be found where the funnel meets the cloud base.
- On a full-screen retina window the water close-up is the slowest view (about 15 ms a frame on
  an M4); the governor trims its resolution slightly if the machine is busy.
