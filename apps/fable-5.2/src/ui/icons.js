// Inline SVG for the interface. Everything is drawn on a 24-unit grid as hairline
// strokes; ui.css sets fill, stroke and weight (.icon), and shows the `.icon__on` /
// `.icon__off` parts according to the button's aria-pressed state.

const svg = (body, modifier = '') =>
  `<svg class="icon${modifier ? ` icon--${modifier}` : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;

// The four alchemical signs: an upward triangle for fire, a downward one for water,
// and the same two crossed by a bar for air and earth.
const SIGN_PATHS = {
  fire: 'M12 4.4 20.8 19.6H3.2Z',
  water: 'M12 19.6 3.2 4.4h17.6Z',
  earth: 'M12 19.6 3.2 4.4h17.6ZM5.1 13.2h13.8',
  air: 'M12 4.4 20.8 19.6H3.2ZM5.1 10.8h13.8',
};

/** The alchemical sign of an element, by id. */
export const sign = (id) => svg(`<path d="${SIGN_PATHS[id] || ''}"/>`, 'sign');

export const ICONS = {
  // The ring of four: every element at once.
  overview: svg(
    '<circle cx="12" cy="12" r="7.2"/>'
    + '<g class="icon__solid"><circle cx="12" cy="4.8" r="1.45"/><circle cx="19.2" cy="12" r="1.45"/>'
    + '<circle cx="12" cy="19.2" r="1.45"/><circle cx="4.8" cy="12" r="1.45"/></g>',
  ),
  // The same ring with a play mark (a pause mark while the tour runs).
  tour: svg(
    '<circle cx="12" cy="12" r="7.2"/>'
    + '<path class="icon__off" d="M10.5 8.8v6.4l5-3.2Z"/>'
    + '<path class="icon__on" d="M10.2 9.1v5.8M13.8 9.1v5.8"/>',
  ),
  sound: svg(
    '<path d="M3.4 9.4h3.5l4.7-3.9v13l-4.7-3.9H3.4Z"/>'
    + '<path class="icon__on" d="M14.9 9.1a4.2 4.2 0 0 1 0 5.8M17.5 6.5a7.8 7.8 0 0 1 0 11"/>'
    + '<path class="icon__off" d="m15.4 9.6 4.8 4.8m0-4.8-4.8 4.8"/>',
  ),
  orbit: svg(
    '<ellipse cx="12" cy="12" rx="9.2" ry="3.9" transform="rotate(-24 12 12)"/>'
    + '<circle class="icon__solid" cx="12" cy="12" r="2"/>'
    + '<circle class="icon__solid icon__on" cx="18.5" cy="6.95" r="1.35"/>',
  ),
  // Four rising bars; ui.css dims the ones above the current quality level.
  quality: svg('<path d="M6 18.6v-3.4"/><path d="M10 18.6v-6.6"/><path d="M14 18.6V8.8"/><path d="M18 18.6V5.4"/>', 'bars'),
  fullscreen: svg(
    '<path class="icon__off" d="M4.8 9.4V4.8h4.6M14.6 4.8h4.6v4.6M19.2 14.6v4.6h-4.6M9.4 19.2H4.8v-4.6"/>'
    + '<path class="icon__on" d="M9.4 4.8v4.6H4.8M19.2 9.4h-4.6V4.8M14.6 19.2v-4.6h4.6M4.8 14.6h4.6v4.6"/>',
  ),
  // A keyboard: the list of shortcuts.
  keys: svg(
    '<rect x="2.8" y="6.4" width="18.4" height="11.2" rx="1.9"/>'
    + '<path class="icon__dots" d="M6.6 10.2h.01M10.2 10.2h.01M13.8 10.2h.01M17.4 10.2h.01"/><path d="M8.4 13.9h7.2"/>',
  ),
  eye: svg(
    '<path d="M2.6 12s3.4-6.2 9.4-6.2 9.4 6.2 9.4 6.2-3.4 6.2-9.4 6.2S2.6 12 2.6 12Z"/>'
    + '<circle cx="12" cy="12" r="2.7"/>'
    + '<path class="icon__on" d="M5 4.6 19 19.4"/>',
  ),
  pause: svg('<path d="M9 6.5v11M15 6.5v11"/>'),
  left: svg('<path d="M19 12H5.4m5.2-5.4L5.2 12l5.4 5.4"/>'),
  right: svg('<path d="M5 12h13.6m-5.2-5.4 5.4 5.4-5.4 5.4"/>'),
};
