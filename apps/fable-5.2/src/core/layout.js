// Where the four elements stand and how the camera frames them.
// World space: +Y up, metres, the water film is the plane y = 0.
// The elements sit on a ring of radius 10 m around the origin, opposites facing
// each other the way the classical square of opposition pairs them.
export const RING_RADIUS = 10;

export const ELEMENTS = [
  {
    id: 'fire',
    name: 'Fire',
    latin: 'Ignis',
    qualities: ['Hot', 'Dry'],
    solid: 'Tetrahedron',
    color: '#ff8a3c',
    position: [0, 0, -RING_RADIUS],
    line: 'Matter in the act of becoming light.',
  },
  {
    id: 'water',
    name: 'Water',
    latin: 'Aqua',
    qualities: ['Cold', 'Wet'],
    solid: 'Icosahedron',
    color: '#35c3e0',
    position: [0, 0, RING_RADIUS],
    line: 'A piece of the sea, held in the shape of its own weight.',
  },
  {
    id: 'earth',
    name: 'Earth',
    latin: 'Terra',
    qualities: ['Cold', 'Dry'],
    solid: 'Cube',
    color: '#c9a25a',
    position: [-RING_RADIUS, 0, 0],
    line: 'Slow time, pressed into stone and crystal.',
  },
  {
    id: 'air',
    name: 'Air',
    latin: 'Aer',
    qualities: ['Hot', 'Wet'],
    solid: 'Octahedron',
    color: '#cfe4ff',
    position: [RING_RADIUS, 0, 0],
    line: 'The invisible, made visible by what it carries.',
  },
];

export const ELEMENT_BY_ID = Object.fromEntries(ELEMENTS.map((e) => [e.id, e]));
