import * as THREE from 'three';

/** Distance from the centre of the plaza to each elemental shrine. */
export const STATION_RADIUS = 9.6;
/** Radius of the circular plaza floor. */
export const PLAZA_RADIUS = 18;

const D = STATION_RADIUS / Math.SQRT2;

/** Direction *towards* the moon — drives the sky, the key light and water glints. */
export const MOON_DIR = new THREE.Vector3(-0.66, 0.44, -0.6).normalize();

/**
 * Four shrines on the diagonals.  From the default camera (looking down -Z):
 * Fire front-left, Water front-right, Earth back-left, Air back-right.
 */
export const ELEMENTS = {
  fire: {
    id: 'fire',
    name: 'Fire',
    key: '2',
    position: new THREE.Vector3(-D, 0, D),
    color: '#ff7a2f',
    colorLinear: new THREE.Color('#ff7a2f'),
    tagline: 'Passion · Transformation · Will',
    text: 'A roaring column of flame rises from a crater of molten stone while embers spiral into the dark.',
    labelY: 8.2,
  },
  water: {
    id: 'water',
    name: 'Water',
    key: '3',
    position: new THREE.Vector3(D, 0, D),
    color: '#39c5ff',
    colorLinear: new THREE.Color('#39c5ff'),
    tagline: 'Depth · Flow · Memory',
    text: 'A living sphere of water hovers above a sacred pool, shedding droplets that ripple through the basin.',
    labelY: 7.0,
  },
  air: {
    id: 'air',
    name: 'Air',
    key: '4',
    position: new THREE.Vector3(D, 0, -D),
    color: '#c9d8ff',
    colorLinear: new THREE.Color('#c9d8ff'),
    tagline: 'Breath · Freedom · Change',
    text: 'A cyclone of streaming wind carries feathers and cloud around a glowing heart of pure breath.',
    labelY: 8.6,
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    key: '5',
    position: new THREE.Vector3(-D, 0, -D),
    color: '#74d26a',
    colorLinear: new THREE.Color('#74d26a'),
    tagline: 'Strength · Patience · Growth',
    text: 'A floating island of layered stone, crystal and living grass — ancient, slow and quietly powerful.',
    labelY: 8.4,
  },
};

export const ELEMENT_LIST = Object.values(ELEMENTS);
