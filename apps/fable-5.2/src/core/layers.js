// Render stages. Every object lives on exactly one of these layers and the
// pipeline draws them in this order each frame (see Pipeline.js).
export const LAYERS = Object.freeze({
  /** Solid geometry: main view, mirror and (with castShadow) the shadow map. Its depth is readable by every later stage. */
  OPAQUE: 0,
  /** Raymarched volumes. Drawn into a half-resolution buffer with premultiplied alpha. */
  VOLUME: 1,
  /** Particles, sprites, ribbons. Full resolution, depth-tested against the opaque scene. */
  FX: 2,
  /** Refractive surfaces. May sample uSceneColor (opaque + volumes + fx behind them). */
  REFRACT: 3,
  /** Anything that has to draw after the refractive stage. */
  LATE: 4,
  /** The mirror ground. Core only. */
  GROUND: 5,
  // 6 is the pipeline's private scratch layer.
  /** Solid geometry drawn in the main view only: a detailed mesh whose reflection and shadow come from a lighter stand-in. */
  MAIN_ONLY: 7,
  /** Solid geometry drawn in the mirror pass only (and into the shadow map, with castShadow): that lighter stand-in. */
  MIRROR_ONLY: 8,
});

/** Put an object and all of its descendants on one layer. */
export function setLayer(object, layer) {
  object.traverse((o) => o.layers.set(layer));
  return object;
}
