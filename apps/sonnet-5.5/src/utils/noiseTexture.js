import * as THREE from 'three';
import { mulberry32 } from './rng.js';

/**
 * A 256x256 seamlessly tiling RGBA noise texture.
 *  R: soft fbm (large features)      G: finer fbm
 *  B: mid-frequency fbm              A: billowy (abs) fbm — puffy, cloud-like
 * Sampling this in shaders is far cheaper than evaluating analytic simplex noise per pixel.
 */
export function createNoiseTexture(size = 256, seed = 1337) {
  const rng = mulberry32(seed);

  const makeGrads = (n) => {
    const g = new Float32Array(n * n * 2);
    for (let i = 0; i < n * n; i++) {
      const a = rng() * Math.PI * 2;
      g[i * 2] = Math.cos(a);
      g[i * 2 + 1] = Math.sin(a);
    }
    return g;
  };

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

  // Periodic gradient noise: `freq` lattice cells across the tile.
  const perlin = (x, y, freq, grads) => {
    const fx = x * freq;
    const fy = y * freq;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const dx = fx - x0;
    const dy = fy - y0;
    const ix0 = x0 % freq;
    const iy0 = y0 % freq;
    const ix1 = (x0 + 1) % freq;
    const iy1 = (y0 + 1) % freq;
    const g00 = (iy0 * freq + ix0) * 2;
    const g10 = (iy0 * freq + ix1) * 2;
    const g01 = (iy1 * freq + ix0) * 2;
    const g11 = (iy1 * freq + ix1) * 2;
    const n00 = grads[g00] * dx + grads[g00 + 1] * dy;
    const n10 = grads[g10] * (dx - 1) + grads[g10 + 1] * dy;
    const n01 = grads[g01] * dx + grads[g01 + 1] * (dy - 1);
    const n11 = grads[g11] * (dx - 1) + grads[g11 + 1] * (dy - 1);
    const u = fade(dx);
    const v = fade(dy);
    const a = n00 + (n10 - n00) * u;
    const b = n01 + (n11 - n01) * u;
    return a + (b - a) * v; // ~[-0.7, 0.7]
  };

  const channels = [
    { base: 3, octaves: 5, billow: false },
    { base: 6, octaves: 4, billow: false },
    { base: 4, octaves: 5, billow: false },
    { base: 3, octaves: 5, billow: true },
  ].map((c) => {
    const octs = [];
    for (let o = 0; o < c.octaves; o++) {
      const freq = c.base * 2 ** o;
      octs.push({ freq, grads: makeGrads(freq), amp: 0.5 ** o });
    }
    return { ...c, octs };
  });

  const data = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = px / size;
      const y = py / size;
      const i = (py * size + px) * 4;
      for (let c = 0; c < 4; c++) {
        const ch = channels[c];
        let sum = 0;
        let norm = 0;
        for (const o of ch.octs) {
          const n = perlin(x, y, o.freq, o.grads);
          sum += (ch.billow ? 1 - Math.abs(n) * 2.4 : n * 1.4 * 0.5 + 0.5) * o.amp;
          norm += o.amp;
        }
        const v = Math.min(1, Math.max(0, sum / norm));
        data[i + c] = Math.round(v * 255);
      }
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Tileable 3D noise (RGBA8, 3 fbm channels + 1 billowy channel) for volumetric shaders.
 * Generated once on the CPU; sampling it on the GPU gives free trilinear 3D noise.
 */
export function createNoiseTexture3D(size = 64, seed = 4242) {
  const rng = mulberry32(seed);
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

  const makeGrads = (f) => {
    const g = new Float32Array(f * f * f * 3);
    for (let i = 0; i < f * f * f; i++) {
      // random unit vector
      let x, y, z, l;
      do {
        x = rng() * 2 - 1;
        y = rng() * 2 - 1;
        z = rng() * 2 - 1;
        l = x * x + y * y + z * z;
      } while (l > 1 || l < 1e-4);
      l = Math.sqrt(l);
      g[i * 3] = x / l;
      g[i * 3 + 1] = y / l;
      g[i * 3 + 2] = z / l;
    }
    return g;
  };

  const channels = [
    { base: 2, octaves: 3, billow: false },
    { base: 3, octaves: 3, billow: false },
    { base: 4, octaves: 3, billow: false },
    { base: 2, octaves: 4, billow: true },
  ].map((c) => {
    const octs = [];
    for (let o = 0; o < c.octaves; o++) {
      const freq = c.base * 2 ** o;
      octs.push({ freq, grads: makeGrads(freq), amp: 0.5 ** o });
    }
    return { ...c, octs };
  });

  const gnoise = (x, y, z, f, g) => {
    const fx = x * f;
    const fy = y * f;
    const fz = z * f;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const z0 = Math.floor(fz);
    const dx = fx - x0;
    const dy = fy - y0;
    const dz = fz - z0;
    const xa = x0 % f;
    const ya = y0 % f;
    const za = z0 % f;
    const xb = (x0 + 1) % f;
    const yb = (y0 + 1) % f;
    const zb = (z0 + 1) % f;
    const at = (a, b, c) => ((c * f + b) * f + a) * 3;
    const d = (i, ax, ay, az) => g[i] * ax + g[i + 1] * ay + g[i + 2] * az;
    const n000 = d(at(xa, ya, za), dx, dy, dz);
    const n100 = d(at(xb, ya, za), dx - 1, dy, dz);
    const n010 = d(at(xa, yb, za), dx, dy - 1, dz);
    const n110 = d(at(xb, yb, za), dx - 1, dy - 1, dz);
    const n001 = d(at(xa, ya, zb), dx, dy, dz - 1);
    const n101 = d(at(xb, ya, zb), dx - 1, dy, dz - 1);
    const n011 = d(at(xa, yb, zb), dx, dy - 1, dz - 1);
    const n111 = d(at(xb, yb, zb), dx - 1, dy - 1, dz - 1);
    const u = fade(dx);
    const v = fade(dy);
    const w = fade(dz);
    const x00 = n000 + (n100 - n000) * u;
    const x10 = n010 + (n110 - n010) * u;
    const x01 = n001 + (n101 - n001) * u;
    const x11 = n011 + (n111 - n011) * u;
    const y0v = x00 + (x10 - x00) * v;
    const y1v = x01 + (x11 - x01) * v;
    return y0v + (y1v - y0v) * w;
  };

  const data = new Uint8Array(size * size * size * 4);
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = ((z * size + y) * size + x) * 4;
        const px = x / size;
        const py = y / size;
        const pz = z / size;
        for (let c = 0; c < 4; c++) {
          const ch = channels[c];
          let sum = 0;
          let norm = 0;
          for (const o of ch.octs) {
            const n = gnoise(px, py, pz, o.freq, o.grads);
            sum += (ch.billow ? 1 - Math.abs(n) * 2.2 : n * 1.5 * 0.5 + 0.5) * o.amp;
            norm += o.amp;
          }
          data[i + c] = Math.round(Math.min(1, Math.max(0, sum / norm)) * 255);
        }
      }
    }
  }

  const tex = new THREE.Data3DTexture(data, size, size, size);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}
