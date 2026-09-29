# Elemental

An interactive gallery of four procedural 3D sculptures, built with **Three.js and Vite**. No model downloads, texture downloads, backend, or API keys are needed. Google Fonts are optional; system fonts are used when offline.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The server starts on port 5173 and automatically selects the next available port when necessary.

```sh
npm run build    # Create the production build in dist/
npm run preview  # Preview the production build locally
```

## Explore

- Choose **Fire, Water, Earth, or Air** from the cards, or press **1–4**.
- Drag to orbit; scroll or pinch to zoom.
- Adjust **Intensity** and **Motion**, or switch off **Auto-rotate**.
- Pause using the toolbar or **Space** when the page background has focus.
- Focus the sculpture with Tab, then use **arrow keys** to orbit, **+/−** to zoom, and **Home** to reset.
- The toolbar also resets the camera and downloads a PNG of the sculpture.
- Sound is an optional, quiet procedural ambience. It starts only after enabling it.
- The top-right button enters or exits fullscreen.

The layout adapts to mobile. Reduced-motion preferences start the experience paused with auto-rotation disabled. Rendering pauses when the tab is hidden. WebGL 2 and hardware acceleration are required.

## The sculptures

- **Fire:** animated turbulent flame shells, curling tongues, glowing cracked coals, rising embers, and flickering light.
- **Water:** refractive sapphire liquid, animated waves and capillary normals, flowing streams, crest sheets, and suspended droplets.
- **Earth:** layered geological stone, moss islands, quartz clusters, metallic veins, and orbiting rock fragments.
- **Air:** translucent pearlescent wind ribbons, spiral streamlines, flowing mist, and motes.

Scene lighting, environment reflections, bloom, tone mapping, a shared display plinth, and fine atmospheric particles tie the collection together. Byte render targets keep postprocessing compatible with GPUs that cannot render floating-point attachments. Pixel density is capped to balance sharpness and performance. The sculptures are artistic interpretations; the property captions are illustrative reference values, not simulation measurements.

## Source

`src/main.js` handles the interface; `src/scene.js` sets up rendering and camera controls. Each sculpture lives in `src/elements/`, styling is in `src/style.css`, and ambient audio is in `src/sound.js`.
