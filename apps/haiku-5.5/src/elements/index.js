import { createFire } from './fire.js';
import { createAir } from './air.js';
import { createWater } from './water.js';
import { createEarth } from './earth.js';

/**
 * @typedef {Object} ElementContext
 * @property {import('three').WebGLRenderer} renderer
 * @property {import('three').PerspectiveCamera} camera
 * @property {import('three').PMREMGenerator} pmrem   Use for `look.environment`; dispose the result in `dispose()`.
 * @property {number} pixelRatio                       Already clamped to <= 2.
 */

/**
 * @typedef {Object} ElementLook
 * @property {import('three').Color | import('three').Texture | null} [background]
 * @property {import('three').Texture | null} [environment]  PMREM env map used for reflections (owned by the element).
 * @property {number} [environmentIntensity]                Scales `environment` for materials without their own envMap, default 1.
 * @property {import('three').Fog | null} [fog]
 * @property {number} [exposure]                            Tone-mapping exposure, default 1.
 * @property {{ strength: number, radius: number, threshold: number }} [bloom]
 */

/**
 * @typedef {Object} ElementCamera
 * @property {import('three').Vector3} position   Starting camera position.
 * @property {import('three').Vector3} target     Orbit target.
 */

/**
 * @typedef {Object} ElementControls
 * @property {number} [minDistance]
 * @property {number} [maxDistance]
 * @property {number} [minPolarAngle]
 * @property {number} [maxPolarAngle]
 * @property {boolean} [autoRotate]
 */

/**
 * What an element factory returns. The host adds `root` to the scene, calls
 * `update(time, delta)` every frame (time is simulation seconds, delta is 0
 * while paused) and calls `dispose()` when switching away.
 *
 * @typedef {Object} ElementScene
 * @property {import('three').Group} root
 * @property {(time: number, delta: number) => void} update
 * @property {() => void} dispose
 * @property {ElementCamera} camera
 * @property {ElementLook} [look]
 * @property {ElementControls} [controls]
 * @property {(width: number, height: number) => void} [onResize]
 */

/**
 * @typedef {Object} ElementDef
 * @property {string} id
 * @property {string} name
 * @property {string} blurb
 * @property {string} accent                       CSS colour used for the UI accent. Must read on the scene's background.
 * @property {'dark' | 'light'} tone               'light' flips the overlay to dark ink for bright scenes.
 * @property {(ctx: ElementContext) => ElementScene} create
 */

/** @type {ElementDef[]} */
export const ELEMENTS = [
  {
    id: 'fire',
    name: 'Fire',
    blurb: 'Heat, light and motion, rising from a single hearth.',
    accent: '#ff8a3d',
    tone: 'dark',
    create: createFire,
  },
  {
    id: 'air',
    name: 'Air',
    blurb: 'Currents that turn unseen, tracing the shape of the wind.',
    accent: '#1d7ea6',
    tone: 'light',
    create: createAir,
  },
  {
    id: 'water',
    name: 'Water',
    blurb: 'A living surface, catching the sky and breaking into light.',
    accent: '#4fc3d9',
    tone: 'dark',
    create: createWater,
  },
  {
    id: 'earth',
    name: 'Earth',
    blurb: 'Stone laid down in layers, shaped slowly by weather and time.',
    accent: '#d2a46b',
    tone: 'dark',
    create: createEarth,
  },
];

/** @param {string} id */
export function getElement(id) {
  return ELEMENTS.find((element) => element.id === id);
}
