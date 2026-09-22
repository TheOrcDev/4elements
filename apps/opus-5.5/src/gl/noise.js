// CPU-side noise: seeded RNG, Perlin gradient noise (optionally periodic),
// periodic Worley noise, and the tileable 2D/3D noise textures the shaders sample.
import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePerm(seed) {
  const rnd = mulberry32(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return perm;
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

function grad(h, x, y, z) {
  const hh = h & 15;
  const u = hh < 8 ? x : y;
  const v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z;
  return ((hh & 1) === 0 ? u : -u) + ((hh & 2) === 0 ? v : -v);
}

/** Perlin noise with lattice period `p` (1..256). Returns roughly [-1, 1]. */
function pnoise(perm, x, y, z, p) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const X0 = ((xi % p) + p) % p, Y0 = ((yi % p) + p) % p, Z0 = ((zi % p) + p) % p;
  const X1 = (X0 + 1) % p, Y1 = (Y0 + 1) % p, Z1 = (Z0 + 1) % p;
  const u = fade(xf), v = fade(yf), w = fade(zf);
  const a0 = perm[X0], a1 = perm[X1];
  const b00 = perm[a0 + Y0], b01 = perm[a0 + Y1], b10 = perm[a1 + Y0], b11 = perm[a1 + Y1];
  const n000 = grad(perm[b00 + Z0], xf, yf, zf);
  const n100 = grad(perm[b10 + Z0], xf - 1, yf, zf);
  const n010 = grad(perm[b01 + Z0], xf, yf - 1, zf);
  const n110 = grad(perm[b11 + Z0], xf - 1, yf - 1, zf);
  const n001 = grad(perm[b00 + Z1], xf, yf, zf - 1);
  const n101 = grad(perm[b10 + Z1], xf - 1, yf, zf - 1);
  const n011 = grad(perm[b01 + Z1], xf, yf - 1, zf - 1);
  const n111 = grad(perm[b11 + Z1], xf - 1, yf - 1, zf - 1);
  const x00 = n000 + u * (n100 - n000);
  const x10 = n010 + u * (n110 - n010);
  const x01 = n001 + u * (n101 - n001);
  const x11 = n011 + u * (n111 - n011);
  const y0 = x00 + v * (x10 - x00);
  const y1 = x01 + v * (x11 - x01);
  return y0 + w * (y1 - y0);
}

/** Non-periodic 3D Perlin noise helper for geometry generation. */
export class Noise3 {
  constructor(seed = 1) {
    this.perm = makePerm(seed);
  }
  noise(x, y, z) {
    return pnoise(this.perm, x + 1000, y + 1000, z + 1000, 256);
  }
  fbm(x, y, z, octaves = 4, lacunarity = 2, gain = 0.5) {
    let sum = 0, amp = 1, norm = 0, f = 1;
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.noise(x * f, y * f, z * f);
      norm += amp;
      amp *= gain;
      f *= lacunarity;
    }
    return sum / norm;
  }
  ridged(x, y, z, octaves = 4) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
      const n = 1 - Math.abs(this.noise(x * f, y * f, z * f));
      sum += amp * n * n;
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum / norm;
  }
}

/** Smooth 1D value noise for flicker and wobble on the CPU. Returns [0, 1]. */
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n) => {
    const s = Math.sin((n + seed * 57.13) * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}

function periodicWorley(rand, period) {
  const pts = new Float32Array(period * period * period * 3);
  for (let i = 0; i < pts.length; i++) pts[i] = rand();
  return (x, y, z) => {
    // x,y,z in [0, 1)
    const px = x * period, py = y * period, pz = z * period;
    const cx = Math.floor(px), cy = Math.floor(py), cz = Math.floor(pz);
    let best = 1e9;
    for (let k = -1; k <= 1; k++)
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const ix = cx + i, iy = cy + j, iz = cz + k;
          const wx = ((ix % period) + period) % period;
          const wy = ((iy % period) + period) % period;
          const wz = ((iz % period) + period) % period;
          const idx = ((wz * period + wy) * period + wx) * 3;
          const dx = ix + pts[idx] - px;
          const dy = iy + pts[idx + 1] - py;
          const dz = iz + pts[idx + 2] - pz;
          const d = dx * dx + dy * dy + dz * dz;
          if (d < best) best = d;
        }
    return Math.sqrt(best);
  };
}

function periodicFbm(perm, x, y, z, basePeriod, octaves, gain = 0.5) {
  let sum = 0, amp = 1, norm = 0, per = basePeriod;
  for (let o = 0; o < octaves; o++) {
    sum += amp * pnoise(perm, x * per, y * per, z * per, per);
    norm += amp;
    amp *= gain;
    per *= 2;
  }
  return sum / norm;
}

function normalizeChannels(src, channels, contrast = 1) {
  const n = src.length / channels;
  const out = new Uint8Array(src.length);
  for (let c = 0; c < channels; c++) {
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) {
      const v = src[i * channels + c];
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    const range = mx - mn || 1;
    for (let i = 0; i < n; i++) {
      let v = (src[i * channels + c] - mn) / range;
      v = 0.5 + (v - 0.5) * contrast;
      out[i * channels + c] = Math.max(0, Math.min(255, Math.round(v * 255)));
    }
  }
  return out;
}

/**
 * Tileable 3D noise, RGBA:
 *  R: Perlin fBm (period 4, 4 octaves)      — main turbulence
 *  G: Perlin fBm (period 8, 3 octaves)      — finer turbulence
 *  B: inverted Worley (period 5 + 10)       — billows / cells
 *  A: Perlin fBm (period 2, 3 octaves)      — very low frequency warp
 */
export function createNoise3DTexture(size = 64) {
  const permA = makePerm(11), permB = makePerm(23), permC = makePerm(37);
  const rand = mulberry32(99);
  const w1 = periodicWorley(rand, 5);
  const w2 = periodicWorley(rand, 10);
  const data = new Float32Array(size * size * size * 4);
  let o = 0;
  const inv = 1 / size;
  for (let z = 0; z < size; z++) {
    const fz = z * inv;
    for (let y = 0; y < size; y++) {
      const fy = y * inv;
      for (let x = 0; x < size; x++) {
        const fx = x * inv;
        data[o++] = periodicFbm(permA, fx, fy, fz, 4, 4);
        data[o++] = periodicFbm(permB, fx, fy, fz, 8, 3);
        data[o++] = -(w1(fx, fy, fz) * 0.7 + w2(fx, fy, fz) * 0.3);
        data[o++] = periodicFbm(permC, fx, fy, fz, 2, 3);
      }
    }
  }
  const bytes = normalizeChannels(data, 4, 1.0);
  const tex = new THREE.Data3DTexture(bytes, size, size, size);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Tileable 2D noise, RGBA:
 *  R: Perlin fBm (period 8, 5 octaves)
 *  G: Perlin fBm (period 16, 4 octaves)
 *  B: inverted Worley (period 8)
 *  A: ridged Perlin (period 6, 4 octaves)
 */
export function createNoise2DTexture(size = 256) {
  const permA = makePerm(5), permB = makePerm(17), permD = makePerm(41);
  const rand = mulberry32(7);
  const wor = periodicWorley(rand, 8);
  const data = new Float32Array(size * size * 4);
  let o = 0;
  const inv = 1 / size;
  const z = 0.37;
  for (let y = 0; y < size; y++) {
    const fy = y * inv;
    for (let x = 0; x < size; x++) {
      const fx = x * inv;
      data[o++] = periodicFbm(permA, fx, fy, z, 8, 5);
      data[o++] = periodicFbm(permB, fx, fy, z, 16, 4);
      data[o++] = -wor(fx, fy, z);
      let r = 0, amp = 0.5, per = 6;
      for (let k = 0; k < 4; k++) {
        const n = 1 - Math.abs(pnoise(permD, fx * per, fy * per, z * per, per));
        r += amp * n * n;
        amp *= 0.5;
        per *= 2;
      }
      data[o++] = r;
    }
  }
  const bytes = normalizeChannels(data, 4, 1.0);
  const tex = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
