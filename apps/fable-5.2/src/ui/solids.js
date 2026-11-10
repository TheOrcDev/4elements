// Line drawings of the Platonic solids that the Timaeus pairs with the elements
// (fire: tetrahedron, water: icosahedron, earth: cube, air: octahedron), turning slowly.
// Each is a handful of <line>s in a small SVG, redrawn about thirty times a second.

const SVG_NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const TILT = 0.36;          // radians: the solid is seen from slightly above
const SPEED = 0.26;         // radians per second around the vertical axis
const RADIUS = 10.4;        // drawing radius inside the "-12 -12 24 24" view box
const FRAME_MS = 32;

/** Vertices on the unit sphere, standing the way the solid is usually drawn. */
function vertices(name) {
  switch (name) {
    case 'tetrahedron': {
      const r = Math.sqrt(8) / 3;
      return [[0, 1, 0], ...[0, 1, 2].map((k) => [r * Math.cos((k * TAU) / 3), -1 / 3, r * Math.sin((k * TAU) / 3)])];
    }
    case 'cube': {
      const s = 1 / Math.sqrt(3);
      const out = [];
      for (const x of [-s, s]) for (const y of [-s, s]) for (const z of [-s, s]) out.push([x, y, z]);
      return out;
    }
    case 'octahedron':
      return [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
    case 'icosahedron': {
      const y = 1 / Math.sqrt(5);
      const r = 2 / Math.sqrt(5);
      const out = [[0, 1, 0], [0, -1, 0]];
      for (let k = 0; k < 5; k++) {
        out.push([r * Math.cos((k * TAU) / 5), y, r * Math.sin((k * TAU) / 5)]);
        out.push([r * Math.cos(((k + 0.5) * TAU) / 5), -y, r * Math.sin(((k + 0.5) * TAU) / 5)]);
      }
      return out;
    }
    default:
      return [];
  }
}

/** The edges of a Platonic solid are exactly the vertex pairs at the shortest distance. */
function edges(points) {
  const pairs = [];
  let shortest = Infinity;
  for (let a = 0; a < points.length; a++) {
    for (let b = a + 1; b < points.length; b++) {
      const d = Math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1], points[a][2] - points[b][2]);
      shortest = Math.min(shortest, d);
      pairs.push([a, b, d]);
    }
  }
  return pairs.filter((p) => p[2] < shortest * 1.01);
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Draws a solid into `svg` (expects viewBox="-12 -12 24 24").
 * `show(name)` picks the solid, `spin(on)` starts or stops the slow turn.
 */
export function createSolid(svg) {
  const lines = [];
  const screen = [];        // projected vertices: [x, y, depth]
  let shape = null;
  let angle = 0.5;
  let raf = 0;
  let last = 0;

  function draw() {
    if (!shape) return;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    shape.points.forEach(([x, y, z], i) => {
      const rx = x * ca + z * sa;
      const rz = z * ca - x * sa;
      const p = screen[i] || (screen[i] = [0, 0, 0]);
      p[0] = rx * RADIUS;
      p[1] = -(y * ct - rz * st) * RADIUS;
      p[2] = y * st + rz * ct;                      // toward the viewer
    });
    shape.edges.forEach(([a, b], i) => {
      const line = lines[i];
      const A = screen[a], B = screen[b];
      line.setAttribute('x1', A[0].toFixed(2));
      line.setAttribute('y1', A[1].toFixed(2));
      line.setAttribute('x2', B[0].toFixed(2));
      line.setAttribute('y2', B[1].toFixed(2));
      // Far edges recede instead of vanishing, so the solid still reads as a volume.
      line.style.opacity = (0.2 + 0.8 * smoothstep(-0.3, 0.3, (A[2] + B[2]) / 2)).toFixed(3);
    });
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < FRAME_MS) return;
    angle += SPEED * Math.min((now - last) / 1000, 0.1);
    last = now;
    draw();
  }

  return {
    show(name) {
      const points = vertices(String(name || '').toLowerCase());
      shape = points.length ? { points, edges: edges(points) } : null;
      const count = shape ? shape.edges.length : 0;
      while (lines.length < count) lines.push(svg.appendChild(document.createElementNS(SVG_NS, 'line')));
      lines.forEach((line, i) => { line.style.display = i < count ? '' : 'none'; });
      svg.style.visibility = shape ? '' : 'hidden';
      draw();
    },
    spin(on) {
      cancelAnimationFrame(raf);
      raf = 0;
      if (on && shape) { last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    dispose() {
      cancelAnimationFrame(raf);
      lines.forEach((line) => line.remove());
      lines.length = 0;
    },
  };
}
