import * as THREE from 'three';
import { LAYERS } from './layers.js';
import { createVolumeMaterial, VOLUME_VERT } from './materials.js';
import { FRAG_PRELUDE } from './glsl/index.js';

// A shallow layer of mist lying on the water, densest at the surface and thinning out
// within a couple of metres. It is what makes the light of the scene visible in the air:
// the afterglow scatters forward through it, the pyre warms it, lightning flashes in it.

const TOP = 2.4;
const RADIUS = 150;

const FRAG = /* glsl */ `
${FRAG_PRELUDE}
uniform float uMistDensity;
uniform float uMistHeight;
varying vec3 vWorldPos;

// Light scattered toward the eye from a point source in a uniform medium, integrated
// analytically along the ray segment [t0, t1] (the classic "airlight" integral of 1/d^2).
float airlight(vec3 ro, vec3 rd, vec3 c, float t0, float t1, float soft) {
  vec3 oc = ro - c;
  float b = dot(oc, rd);
  float s = sqrt(max(dot(oc, oc) - b * b, 0.0) + soft);
  return (atan((t1 + b) / s) - atan((t0 + b) / s)) / s;
}
// A soft shoulder: unchanged up to the knee; above it only the logarithm of the excess is added
// (same slope at the knee, so no visible edge), which keeps a flicker but never reaches white.
const float FLASH_KNEE = 0.05;
const float FLASH_SOFT = 0.03;
float shoulder(float x, float knee, float soft) {
  return min(x, knee) + soft * log(1.0 + max(x - knee, 0.0) / soft);
}

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vWorldPos - cameraPosition);
  float ry = abs(rd.y) < 1e-5 ? 1e-5 : rd.y;
  float ta = -ro.y / ry, tb = (${TOP.toFixed(1)} - ro.y) / ry;
  float t0 = max(min(ta, tb), 0.0);
  float t1 = min(min(max(ta, tb), sceneRayDistance(screenUV(), rd)), ${RADIUS.toFixed(1)});
  if (t1 <= t0) discard;

  int steps = int(mix(4.0, 8.0, saturate(uQuality)));
  float dt = (t1 - t0) / float(steps);
  // A step can be twenty metres long while the noise has detail a metre across: read at full
  // resolution, every pixel would draw its own few random values and the mist would come out
  // as a woven dither. So the noise is fetched at the mip level whose texels are one step
  // long (a step of dt metres spans dt * 0.021 * 128 texels): each tap is then already the
  // mean of the stretch of ray it stands for, and it is a cheaper fetch as well.
  const vec3 SQUASH = vec3(1.0, 2.5, 1.0);                 // the noise is flattened into layers
  float lod = log2(max(dt * length(rd * SQUASH) * (0.021 * 128.0), 1.0));
  // The thinning with height is an exponential, so each step integrates it exactly instead
  // of sampling it: nothing is left for the march to resolve but the slow banks.
  float fall = rd.y / uMistHeight;
  bool level = abs(fall * dt) < 1e-3;                      // too flat a ray for the closed form
  if (level) fall = 1.0;                                   // (never divide by zero, even unused)
  float thick = exp(-max(ro.y + rd.y * t0, 0.0) / uMistHeight);
  float jitter = ign(gl_FragCoord.xy);
  float t = t0;
  float tau = 0.0;       // optical depth
  float broad = 0.0;     // the same without the wisps: what the point lights shine through
  vec3 drift = vec3(uTime * 0.0045, 0.0, uTime * 0.0028);
  for (int i = 0; i < steps; i++) {
    vec3 p = ro + rd * (t + dt * jitter);
    // One fetch: the broad banks from the low band, the wisps inside them from the fine one.
    vec4 nz = noiseTexLod(p * SQUASH * 0.021 + drift, lod);
    t += dt;
    float thickNext = exp(-max(ro.y + rd.y * t, 0.0) / uMistHeight);
    float column = level ? thick * dt : (thick - thickNext) / fall;
    thick = thickNext;
    float banks = smoothstep(0.36, 0.70, nz.r) * column
                * smoothstep(${RADIUS.toFixed(1)}, ${(RADIUS * 0.5).toFixed(1)}, length(p.xz));
    broad += banks;
    tau += banks * (0.45 + 1.1 * nz.b);
  }
  tau *= uMistDensity;
  // Light scattered toward the eye along the way, less what the mist in front of it takes
  // back, sums to exactly this.
  float alpha = 1.0 - exp(-tau);
  if (alpha < 0.002) discard;
  float meanRho = broad * uMistDensity / max(t1 - t0, 1e-3);

  // Sky light, plus strong forward scattering when looking toward the afterglow.
  vec3 sunAz = normalize(vec3(uSunDir.x, 0.0, uSunDir.z));
  float toward = max(dot(rd, sunAz), 0.0);
  vec3 light = skyAmbient(vec3(0.0, 1.0, 0.0)) * 1.25
             + vec3(1.0, 0.44, 0.19) * (0.05 + 0.85 * toward * toward * toward * toward)
             + uMoonColor * 0.05;
  vec3 col = light * alpha;

  // Point sources: the pyre and the lightning, both scattered with the same generosity (a
  // physical haze this thin would return 1 / 4 PI of their intensity; the mist stands for
  // a deeper one). The sky is dark between strikes, so the second integral is seldom needed.
  col += uFireLightColor * airlight(ro, rd, uFireLightPos, t0, t1, 1.2) * (meanRho * 0.42);
  if (uFlash.w > 0.0) {
    // Mist the strike stands in would turn into a white wall at its peak, so what it returns
    // passes a soft shoulder (the blue channel is compressed, the colour kept): the haze
    // around the foot glows without burying what lies behind it, and mist farther from the
    // strike, which returns less than the knee, answers exactly as before.
    vec3 flash = flashIntensity() * (airlight(ro, rd, uFlash.xyz, t0, t1, 6.0) * meanRho * 0.42);
    col += flash * (shoulder(flash.b, FLASH_KNEE, FLASH_SOFT) / max(flash.b, 1e-6));
  }

  gl_FragColor = vec4(col, alpha);
}
`;

export class Mist {
  constructor() {
    this.uniforms = { uMistDensity: { value: 0.016 }, uMistHeight: { value: 0.55 } };
    const geometry = new THREE.BoxGeometry(RADIUS * 2.2, TOP, RADIUS * 2.2);
    geometry.translate(0, TOP / 2, 0);
    this.material = createVolumeMaterial({ vertexShader: VOLUME_VERT, fragmentShader: FRAG, uniforms: this.uniforms });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;          // behind every other volume
    this.mesh.layers.set(LAYERS.VOLUME);
    this.mesh.name = 'mist';
  }
}
