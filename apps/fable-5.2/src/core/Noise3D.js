import * as THREE from 'three';

// Bakes the shared tiling 3D noise texture on the GPU: the slices are rendered into
// one 2D atlas, read back once and uploaded as a mipmapped Data3DTexture.
//   r: Perlin fBm (base frequency 4)    g: Worley fBm (base frequency 4)
//   b: Perlin fBm (base frequency 12)   a: Worley fBm (base frequency 12)

const SIZE = 128;
const COLS = 16;
const ROWS = SIZE / COLS;

const FRAG = /* glsl */ `
precision highp float;
uniform float uSize;
uniform vec2 uGrid;
varying vec2 vUv;

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}
float grad(vec3 cell, vec3 f, float period) {
  vec3 g = hash33(mod(cell, period)) * 2.0 - 1.0;
  return dot(normalize(g + 1e-4), f);
}
// Periodic gradient noise, roughly [-1, 1].
float perlin(vec3 p, float period) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = grad(i, f, period);
  float b = grad(i + vec3(1, 0, 0), f - vec3(1, 0, 0), period);
  float c = grad(i + vec3(0, 1, 0), f - vec3(0, 1, 0), period);
  float d = grad(i + vec3(1, 1, 0), f - vec3(1, 1, 0), period);
  float e = grad(i + vec3(0, 0, 1), f - vec3(0, 0, 1), period);
  float g = grad(i + vec3(1, 0, 1), f - vec3(1, 0, 1), period);
  float h = grad(i + vec3(0, 1, 1), f - vec3(0, 1, 1), period);
  float k = grad(i + vec3(1, 1, 1), f - vec3(1, 1, 1), period);
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z) * 1.6;
}
float perlinFbm(vec3 p, float freq, int octaves) {
  float a = 0.5, s = 0.0, n = 0.0;
  for (int i = 0; i < octaves; i++) { s += a * perlin(p * freq, freq); n += a; freq *= 2.0; a *= 0.5; }
  return s / n;
}
// Periodic cellular noise, 1 at feature points falling to 0 at cell borders.
float worley(vec3 p, float period) {
  vec3 i = floor(p), f = fract(p);
  float d = 8.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(float(x), float(y), float(z));
    vec3 r = o + hash33(mod(i + o, period)) - f;
    d = min(d, dot(r, r));
  }
  return 1.0 - clamp(sqrt(d), 0.0, 1.0);
}
float worleyFbm(vec3 p, float freq) {
  return worley(p * freq, freq) * 0.625 + worley(p * freq * 2.0, freq * 2.0) * 0.25 + worley(p * freq * 4.0, freq * 4.0) * 0.125;
}
void main() {
  vec2 cell = vUv * uGrid;
  vec2 tile = floor(cell);
  vec3 p = vec3(fract(cell), (tile.x + tile.y * uGrid.x + 0.5) / uSize);
  float pf = perlinFbm(p, 4.0, 5) * 0.5 + 0.5;
  float wf = worleyFbm(p, 4.0);
  float pf2 = perlinFbm(p + 0.37, 12.0, 3) * 0.5 + 0.5;
  float wf2 = worleyFbm(p + 0.61, 12.0);
  gl_FragColor = vec4(clamp(vec4(pf, wf, pf2, wf2), 0.0, 1.0));
}
`;

export function bakeNoise3D(renderer) {
  const atlasW = SIZE * COLS;
  const atlasH = SIZE * ROWS;
  const rt = new THREE.WebGLRenderTarget(atlasW, atlasH, {
    type: THREE.UnsignedByteType, format: THREE.RGBAFormat, depthBuffer: false,
    magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter,
  });
  const material = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: FRAG,
    uniforms: { uSize: { value: SIZE }, uGrid: { value: new THREE.Vector2(COLS, ROWS) } },
    depthTest: false, depthWrite: false,
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(mesh, camera);
  const atlas = new Uint8Array(atlasW * atlasH * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, atlasW, atlasH, atlas);
  renderer.setRenderTarget(previous);

  const data = new Uint8Array(SIZE * SIZE * SIZE * 4);
  const rowBytes = SIZE * 4;
  for (let z = 0; z < SIZE; z++) {
    const tx = z % COLS;
    const ty = Math.floor(z / COLS);
    for (let y = 0; y < SIZE; y++) {
      const src = ((ty * SIZE + y) * atlasW + tx * SIZE) * 4;
      const dst = (z * SIZE + y) * rowBytes;
      data.set(atlas.subarray(src, src + rowBytes), dst);
    }
  }

  const texture = new THREE.Data3DTexture(data, SIZE, SIZE, SIZE);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.wrapS = texture.wrapT = texture.wrapR = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  rt.dispose();
  material.dispose();
  geometry.dispose();
  return texture;
}
