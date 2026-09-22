import * as THREE from 'three';

export const STATION_RADIUS = 6.0;
export const PEDESTAL_TOP = 0.95;
export const PLATFORM_RADIUS = 12.0;

const deg = THREE.MathUtils.degToRad;

// Circle order Fire → Air → Water → Earth keeps Aristotle's opposites
// (fire/water, air/earth) facing each other across the sanctum.
export const ELEMENTS = [
  {
    id: 'fire',
    key: '1',
    name: 'Fire',
    greek: 'πῦρ · pyr',
    latin: 'Ignis',
    qualities: ['Hot', 'Dry'],
    solid: 'Tetrahedron',
    color: '#ff7a2f',
    azimuth: deg(-45),
    motto: 'That which transforms',
    text: 'Restless and radiant. Fire rises, consumes and renews — turning wood to light, and one thing into another.',
    view: { distance: 8.4, height: 3.7, swing: deg(18), targetY: 2.6 },
  },
  {
    id: 'air',
    key: '2',
    name: 'Air',
    greek: 'ἀήρ · aēr',
    latin: 'Aer',
    qualities: ['Hot', 'Wet'],
    solid: 'Octahedron',
    color: '#bfe4ff',
    azimuth: deg(45),
    motto: 'That which moves',
    text: 'Invisible yet everywhere. Air carries seed, scent and song — known only by what it sets in motion.',
    view: { distance: 10.4, height: 4.3, swing: deg(-16), targetY: 3.3 },
  },
  {
    id: 'water',
    key: '3',
    name: 'Water',
    greek: 'ὕδωρ · hydōr',
    latin: 'Aqua',
    qualities: ['Cold', 'Wet'],
    solid: 'Icosahedron',
    color: '#2aa9ff',
    azimuth: deg(135),
    motto: 'That which flows',
    text: 'Yielding and unstoppable. Water takes the shape of every vessel, reflects the sky and carves the stone.',
    view: { distance: 9.0, height: 4.0, swing: deg(18), targetY: 2.95 },
  },
  {
    id: 'earth',
    key: '4',
    name: 'Earth',
    greek: 'γῆ · gē',
    latin: 'Terra',
    qualities: ['Cold', 'Dry'],
    solid: 'Cube',
    color: '#6fd66a',
    azimuth: deg(-135),
    motto: 'That which endures',
    text: 'Patient and abundant. Earth holds root and crystal alike, the slow foundation from which all things grow.',
    view: { distance: 9.8, height: 4.4, swing: deg(-18), targetY: 3.35 },
  },
];

export function stationPosition(def, target = new THREE.Vector3()) {
  return target.set(Math.sin(def.azimuth) * STATION_RADIUS, 0, Math.cos(def.azimuth) * STATION_RADIUS);
}
