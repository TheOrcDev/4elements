import * as THREE from 'three';
import { mulberry32, TAU } from './rng.js';
import { ELEMENTS, STATION_RADIUS } from '../config.js';

function makeCanvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Soft radial white dot / glow, used as a generic sprite map. */
export function createSoftSprite(size = 128) {
  const c = makeCanvas(size);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A single white feather, tip at the top, quill at the bottom (alpha-mapped). */
export function createFeatherTexture() {
  const W = 128;
  const H = 512;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  const rng = mulberry32(77);
  const cx = W / 2;
  const y0 = 14;
  const y1 = 392;

  const halfWidth = (t) => 55 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.68)), 0.72);

  g.lineCap = 'round';
  const N = 260;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = y0 + t * (y1 - y0);
    const w = halfWidth(t);
    if (w < 1) continue;
    for (const s of [-1, 1]) {
      const jitter = 0.86 + rng() * 0.2;
      const len = w * jitter;
      const sweep = len * (0.5 + rng() * 0.15);
      const a = 0.42 + rng() * 0.45;
      g.strokeStyle = `rgba(${226 + rng() * 29}, ${236 + rng() * 19}, 255, ${a})`;
      g.lineWidth = 1.1 + rng() * 1.1;
      g.beginPath();
      g.moveTo(cx, y);
      g.quadraticCurveTo(cx + s * len * 0.55, y - sweep * 0.25, cx + s * len, y - sweep);
      g.stroke();
    }
  }
  // Soft under-vane so the feather reads as a solid-ish surface at a distance
  g.globalCompositeOperation = 'destination-over';
  g.fillStyle = 'rgba(214, 228, 255, 0.28)';
  g.beginPath();
  g.moveTo(cx, y0);
  for (let i = 0; i <= 40; i++) g.lineTo(cx + halfWidth(i / 40) * 0.92, y0 + (i / 40) * (y1 - y0));
  for (let i = 40; i >= 0; i--) g.lineTo(cx - halfWidth(i / 40) * 0.92, y0 + (i / 40) * (y1 - y0));
  g.closePath();
  g.fill();
  g.globalCompositeOperation = 'source-over';
  // Shaft
  const shaft = g.createLinearGradient(0, y0, 0, H - 8);
  shaft.addColorStop(0, 'rgba(255,255,255,0.95)');
  shaft.addColorStop(1, 'rgba(255,255,255,0.75)');
  g.strokeStyle = shaft;
  g.lineWidth = 3.2;
  g.beginPath();
  g.moveTo(cx, y0 - 6);
  g.lineTo(cx, H - 8);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Alchemical element glyph: triangle up = fire/air, down = water/earth; bar = air/earth. */
export function drawSigil(g, kind, cx, cy, s) {
  const up = kind === 'fire' || kind === 'air';
  const h = s;
  const w = s * 1.1547;
  g.beginPath();
  if (up) {
    g.moveTo(cx, cy - h * 0.58);
    g.lineTo(cx + w / 2, cy + h * 0.42);
    g.lineTo(cx - w / 2, cy + h * 0.42);
  } else {
    g.moveTo(cx, cy + h * 0.58);
    g.lineTo(cx + w / 2, cy - h * 0.42);
    g.lineTo(cx - w / 2, cy - h * 0.42);
  }
  g.closePath();
  g.stroke();
  if (kind === 'air' || kind === 'earth') {
    const f = 0.5; // fraction from the apex
    const yy = up ? cy - h * 0.58 + h * f : cy + h * 0.58 - h * f;
    const half = (w / 2) * f;
    g.beginPath();
    g.moveTo(cx - half * 1.35, yy);
    g.lineTo(cx + half * 1.35, yy);
    g.stroke();
  }
}

const AZIMUTH = {};
for (const e of Object.values(ELEMENTS)) AZIMUTH[e.id] = Math.atan2(e.position.z, e.position.x);

/** Colour of the plaza inlay at a given azimuth: smooth blend between neighbouring shrines. */
function inlayColorAt(theta) {
  const ids = Object.keys(AZIMUTH);
  const items = ids
    .map((id) => {
      let d = Math.abs(((theta - AZIMUTH[id] + Math.PI * 3) % TAU) - Math.PI);
      return { id, d };
    })
    .sort((a, b) => a.d - b.d);
  const a = items[0];
  const b = items[1];
  const wa = 1 / (a.d + 0.06);
  const wb = 1 / (b.d + 0.06);
  const ca = ELEMENTS[a.id].colorLinear;
  const cb = ELEMENTS[b.id].colorLinear;
  const t = wb / (wa + wb);
  const c = ca.clone().lerp(cb, t * 0.85);
  return `#${c.getHexString()}`;
}

/**
 * Plaza floor: a dark, polished slate with engraved tile seams (albedo) plus a glowing
 * inlay of rings, spokes, the four-shrine square and alchemical glyphs (emissive).
 */
export function createFloorTextures({ size = 2048, worldSize = 36 }) {
  const S = size / worldSize;
  const P = (v) => (v / worldSize + 0.5) * size;

  // ---------- albedo ----------
  const albedo = makeCanvas(size);
  const g = albedo.getContext('2d');
  const rng = mulberry32(2024);
  g.fillStyle = '#0d1322';
  g.fillRect(0, 0, size, size);

  // soft blotches for large-scale tonal variation
  for (let i = 0; i < 420; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 30 + rng() * 170;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const light = rng() > 0.5;
    grad.addColorStop(0, light ? 'rgba(46,60,96,0.10)' : 'rgba(2,4,10,0.16)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // engraved tile seams
  const seam = (r0, r1, count, phase = 0) => {
    for (let i = 0; i < count; i++) {
      const a = phase + (i / count) * TAU;
      const x0 = P(Math.cos(a) * r0);
      const y0 = P(Math.sin(a) * r0);
      const x1 = P(Math.cos(a) * r1);
      const y1 = P(Math.sin(a) * r1);
      g.strokeStyle = 'rgba(0,0,0,0.55)';
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
      g.strokeStyle = 'rgba(120,150,220,0.10)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x0 + 1.5, y0 + 1.5);
      g.lineTo(x1 + 1.5, y1 + 1.5);
      g.stroke();
    }
  };
  const ring = (r, w, style) => {
    g.strokeStyle = style;
    g.lineWidth = w;
    g.beginPath();
    g.arc(P(0), P(0), r * S, 0, TAU);
    g.stroke();
  };
  for (const r of [3.4, 5.6, 8.0, 11.4, 13.6, 15.2, 16.4]) {
    ring(r, 3.0, 'rgba(0,0,0,0.6)');
    ring(r, 1.2, 'rgba(120,150,220,0.12)');
  }
  seam(3.4, 5.6, 16);
  seam(5.6, 8.0, 24, 0.07);
  seam(8.0, 11.4, 32);
  seam(11.4, 13.6, 48, 0.03);
  seam(13.6, 15.2, 64);
  seam(15.2, 16.4, 96, 0.02);

  // per-pixel grain
  {
    const img = g.getImageData(0, 0, size, size);
    const d = img.data;
    let s = 1;
    for (let i = 0; i < d.length; i += 4) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const n = ((s >>> 24) - 128) * 0.07;
      d[i] += n * 0.8;
      d[i + 1] += n * 0.9;
      d[i + 2] += n * 1.2;
    }
    g.putImageData(img, 0, 0);
  }

  // dark grooves under the glowing inlays
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(0,0,6,0.85)';
  g.lineWidth = 0.22 * S;
  g.beginPath();
  g.arc(P(0), P(0), 16.7 * S, 0, TAU);
  g.stroke();
  const stationPts = Object.values(ELEMENTS).map((e) => ({
    x: Math.cos(AZIMUTH[e.id]) * STATION_RADIUS,
    z: Math.sin(AZIMUTH[e.id]) * STATION_RADIUS,
  }));
  g.lineWidth = 0.16 * S;
  g.beginPath();
  stationPts.forEach((p, i) => (i ? g.lineTo(P(p.x), P(p.z)) : g.moveTo(P(p.x), P(p.z))));
  g.closePath();
  g.stroke();

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;

  // ---------- emissive ----------
  const emis = makeCanvas(size);
  const e = emis.getContext('2d');
  e.fillStyle = '#000';
  e.fillRect(0, 0, size, size);
  e.lineCap = 'round';
  e.lineJoin = 'round';

  const glow = (color, blur) => {
    e.shadowColor = color;
    e.shadowBlur = blur;
  };

  // outer inlay ring, coloured by the neighbouring shrine
  for (let deg = 0; deg < 360; deg += 0.5) {
    const a0 = (deg / 180) * Math.PI;
    const a1 = ((deg + 0.75) / 180) * Math.PI;
    const col = inlayColorAt(a0);
    e.strokeStyle = col;
    glow(col, 26);
    e.lineWidth = 0.11 * S;
    e.beginPath();
    e.arc(P(0), P(0), 16.7 * S, a0, a1);
    e.stroke();
  }
  glow('#8fa8ff', 12);
  e.strokeStyle = 'rgba(150,175,255,0.55)';
  e.lineWidth = 0.035 * S;
  e.beginPath();
  e.arc(P(0), P(0), 16.05 * S, 0, TAU);
  e.stroke();
  e.beginPath();
  e.arc(P(0), P(0), 11.4 * S, 0, TAU);
  e.stroke();

  // tick marks between the two outer rings
  glow('#7f9cff', 6);
  e.strokeStyle = 'rgba(140,165,255,0.55)';
  e.lineWidth = 0.03 * S;
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * TAU;
    const r0 = 15.35;
    const r1 = i % 5 === 0 ? 15.85 : 15.6;
    e.beginPath();
    e.moveTo(P(Math.cos(a) * r0), P(Math.sin(a) * r0));
    e.lineTo(P(Math.cos(a) * r1), P(Math.sin(a) * r1));
    e.stroke();
  }

  // the square joining the four shrines
  for (let i = 0; i < 4; i++) {
    const a = stationPts[i];
    const b = stationPts[(i + 1) % 4];
    const ids = Object.keys(AZIMUTH);
    const ca = ELEMENTS[ids[i]].color;
    const cb = ELEMENTS[ids[(i + 1) % 4]].color;
    const lg = e.createLinearGradient(P(a.x), P(a.z), P(b.x), P(b.z));
    lg.addColorStop(0, ca);
    lg.addColorStop(1, cb);
    e.strokeStyle = lg;
    glow(ca, 14);
    e.lineWidth = 0.06 * S;
    e.beginPath();
    e.moveTo(P(a.x), P(a.z));
    e.lineTo(P(b.x), P(b.z));
    e.stroke();
  }

  // dashed spokes from the nexus to each shrine
  for (const el of Object.values(ELEMENTS)) {
    const a = AZIMUTH[el.id];
    e.strokeStyle = el.color;
    glow(el.color, 16);
    e.lineWidth = 0.08 * S;
    e.setLineDash([0.55 * S, 0.32 * S]);
    e.beginPath();
    e.moveTo(P(Math.cos(a) * 3.6), P(Math.sin(a) * 3.6));
    e.lineTo(P(Math.cos(a) * (STATION_RADIUS - 4.2)), P(Math.sin(a) * (STATION_RADIUS - 4.2)));
    e.stroke();
    e.setLineDash([]);
  }

  // nexus rings
  glow('#d8c4ff', 24);
  e.strokeStyle = 'rgba(214,196,255,0.9)';
  e.lineWidth = 0.09 * S;
  e.beginPath();
  e.arc(P(0), P(0), 3.05 * S, 0, TAU);
  e.stroke();
  e.lineWidth = 0.035 * S;
  e.beginPath();
  e.arc(P(0), P(0), 2.7 * S, 0, TAU);
  e.stroke();

  // alchemical glyphs on the outer band, one per shrine
  for (const el of Object.values(ELEMENTS)) {
    const a = AZIMUTH[el.id];
    const r = 13.05;
    e.strokeStyle = el.color;
    glow(el.color, 22);
    e.lineWidth = 0.1 * S;
    e.lineJoin = 'round';
    drawSigil(e, el.id, P(Math.cos(a) * r), P(Math.sin(a) * r), 1.5 * S);
  }
  // glyphs at the four in-between points of the ring too (smaller, dim)
  glow('#8ea6ff', 10);
  e.strokeStyle = 'rgba(150,175,255,0.6)';
  e.lineWidth = 0.05 * S;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    e.beginPath();
    e.arc(P(Math.cos(a) * 13.05), P(Math.sin(a) * 13.05), 0.42 * S, 0, TAU);
    e.stroke();
  }
  e.shadowBlur = 0;

  const emissiveMap = new THREE.CanvasTexture(emis);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { map, emissiveMap };
}
