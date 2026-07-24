# Four Elements

A real-time WebGL scene: fire, water, earth and air, each rendered with its own
custom GLSL shader. Built with Three.js r185 and Vite.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

`npm run build` produces a static bundle in `dist/`, `npm run preview` serves it.

## Controls

- **Drag** to orbit, **scroll** to zoom
- **Click an element**, or use the bottom nav, to fly the camera to it
- Click the focused element again (or **All**) to pull back out

## How each element works

**Fire** — `src/elements/fire.js`

A true volumetric raymarch, not layered billboards. The mesh is only a bounding
ellipsoid, fitted to the flame's silhouette; each fragment solves the
intersection analytically and walks the segment accumulating emission and
absorption. Density comes from four octaves of `|noise|` turbulence — the folds
at each octave's zero crossings are what give fire its torn, wispy structure —
squashed vertically so features stretch into tongues, with finer octaves
scrolling upward faster. Because the flame is integrated in world space it holds
up from every angle, including from inside.

Three things do most of the visual work:

- **Emission spans orders of magnitude.** Intensity goes as the cube of
  temperature, so the bulk of the volume sits in deep orange while the densest
  core reaches many times display white and tone mapping burns it out the way a
  camera would. A linear ramp gives flat orange no matter how bright you push it.
- **Temperature is gated on the flame's axis, not just its density.** That
  confines white heat to a narrow column, leaving orange flanks and deep red
  outer wisps. The spread across one silhouette is where the contrast comes from.
- **It composites with premultiplied alpha, not additive blending.** Additive can
  only brighten, so a flame built on it can never have a dark side. Premultiplied
  "over" lets cool sooty gas at the crown *occlude* the glow behind it.

**Water** — `src/elements/water.js`

A displaced sphere with genuine environment reflection and refraction. A
`CubeCamera` at the sphere's centre re-renders the surroundings every third
frame, so the fire and the earth really are mirrored in the surface and bent
through it. The surface is a long swell plus travelling ripples, sampled three
times per vertex so the normal comes from the actual displaced geometry.
Beer–Lambert absorption over a view-dependent thickness is what makes it blue:
red dies first.

**Earth** — `src/elements/earth.js`

Ridged multifractal displacement, which erodes into real crests rather than the
rolling blobs plain fbm gives you. Normals are rebuilt from the displaced
surface, and a Mikkelsen-style screen-space bump adds grit close in. Magma pools
in the low ground and glows through thin cracks where a noise field crosses
zero; that glow is what the bloom pass picks up. Gemstone shards orbit it.

**Air** — `src/elements/air.js`

50k particles, each integrating its own path in the vertex shader: ten Euler
steps through an analytic curl field, plus a vortex and a soft containment pull.
The field is the exact curl of a sinusoidal potential, so it is divergence-free
by construction and the flow folds and shears without particles ever clumping.
Particles are issued in streamers — 28 share a seed with staggered life offsets
— so they string out nose-to-tail and read as wisps rather than a fog of dots.

**The stage** — `src/world.js`

The floor's reflections are real: each fragment mirrors its view ray about the
ground plane and does a soft sphere intersection against every element. Four
ray/sphere tests per pixel buys perspective-correct reflections with no second
render pass.

## Notes

There are no `THREE.Light` objects in the scene. Every surface is a custom
`ShaderMaterial` doing its own analytic lighting from uniform directions, so
real lights would shade nothing.

Post-processing is `RenderPass → UnrealBloomPass → OutputPass → FXAAPass`, with
ACES filmic tone mapping. The bloom threshold sits high on purpose: only
genuinely hot things — the flame core, the lava, the specular glints — bloom.

The fire dominates GPU time; measured with `EXT_disjoint_timer_query_webgl2`, it
was ~70% of a frame when framed to fill the screen. Three changes cut that by
~59% at matched settings, with no visible difference: a bounding **ellipsoid**
instead of a sphere (a sphere large enough to hold a tall narrow column is mostly
empty, and every extra covered pixel still pays for a full march), a **fixed
world-space step size** so chords clipping the silhouette exit early instead of
spending a full sample budget on a sliver, and **four turbulence octaves instead
of five** — the fifth is sub-pixel at any normal viewing distance. Device pixel
ratio is capped at 1.5 for the same reason.

One trap worth knowing if you edit the shaders: they live in JS template
literals, so a stray backtick in a GLSL comment silently terminates the string
and the whole module fails to parse. `node --check src/**/*.js` catches it.

`window.__scene` is exposed for tuning from the console, including
`__scene.renderAt(t)` to render a single frame at an arbitrary time.
# 4elements-opus-5
