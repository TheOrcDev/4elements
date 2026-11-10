import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { VERT_PRELUDE, FRAG_PRELUDE } from '../../core/glsl/index.js';
import { FIELD_GLSL, FISSURE_OUT, moundHeight } from './field.glsl.js';
import { earthUniforms, EARTH_UNIFORMS_GLSL } from './rockMaterial.js';
import { createRockInstances } from './looseRocks.js';

// Everything loose in the air around the monolith:
//   SandStreams    thin streams of sand pouring from the underside and from cracks
//   Dust           motes hanging in the air, the veil of fines shed by each stream, the puffs
//                  where streams land, and the droplets thrown up when a pebble hits the film
//   FallingPebbles the occasional pebble that works loose and drops into the water
// All particle motion is a closed-form function of a seed and the time (computed in the
// vertex shader), so nothing is simulated on the CPU and any moment can be shown directly.

const G = 9.81;
const MAX_SPLASHES = 4;

/** How hard a stream runs at time t (0 … 1): each waxes, wanes and stops in its own rhythm. */
export function streamFlow(seed, t) {
  const x = 0.5 + 0.5 * Math.sin(t * 0.37 + seed * 6.283) * Math.sin(t * 0.131 + seed * 17.0) + 0.12 * Math.sin(t * 1.9 + seed * 40.0);
  const k = Math.min(1, Math.max(0, (x - 0.30) / 0.26));
  return k * k * (3 - 2 * k);
}

/** Uniforms shared by the particle systems (on top of the core's and the element's). */
export const particleUniforms = {
  uRockMatrix: { value: new THREE.Matrix4() },           // the monolith's rock space -> world
  uSplash: { value: Array.from({ length: MAX_SPLASHES }, () => new THREE.Vector4(0, 0, -100, 0)) },   // x, z, start time, strength
  uSandGain: { value: 1 },                               // opacity of a grain: raised when fewer of them are drawn
};

const PARTICLE_GLSL = /* glsl */ `
${FIELD_GLSL}
${EARTH_UNIFORMS_GLSL}
uniform mat4 uRockMatrix;
uniform vec4 uSplash[${MAX_SPLASHES}];
uniform float uSandGain;
const float GRAVITY = ${G.toFixed(2)};

// The same rhythm as streamFlow() in JavaScript.
float streamFlow(float seed, float t) {
  float x = 0.5 + 0.5 * sin(t * 0.37 + seed * 6.283) * sin(t * 0.131 + seed * 17.0) + 0.12 * sin(t * 1.9 + seed * 40.0);
  return smoothstep(0.30, 0.56, x);
}

// Is a point in the air inside the monolith's moon shadow? Two spheres stand in for the mass.
float moonShade(vec3 p) {
  float vis = 1.0;
  vec3 d = uEarthHeart + vec3(0.0, 0.5, 0.0) - p;
  float along = dot(d, uMoonDir);
  if (along > 0.0) vis *= smoothstep(1.25, 1.85, length(d - uMoonDir * along));
  d = uEarthHeart + vec3(0.0, -1.3, 0.0) - p;
  along = dot(d, uMoonDir);
  if (along > 0.0) vis *= smoothstep(0.6, 1.0, length(d - uMoonDir * along));
  return vis;
}

// Light arriving at a speck at p, seen along viewDir (camera -> p): the moon, the sky, the
// fire and the pulsing light of the geode. fine: 1 for dust, which scatters the moon mostly
// forward and so glows when seen against it; 0 for a grain of sand, which is simply a small
// lit stone, brightest with the moon behind the viewer.
vec3 dustLight(vec3 p, vec3 viewDir, float fine) {
  vec3 light = skyAmbient(vec3(0.0, 1.0, 0.0)) * 0.32;
  float toward = dot(viewDir, uMoonDir);
  float moon = mix(0.3 + 0.7 * (0.5 - 0.5 * toward), 0.55 + 1.7 * spow(saturate(toward), 4.0), fine);
  light += uMoonColor * 0.5 * moonShade(p) * moon;
  vec3 toFire = uFireLightPos - p;
  light += uFireLightColor * 0.32 / (dot(toFire, toFire) + 1.0);
  vec3 fromHeart = normalize(p - uEarthHeart);
  float spill = max(smoothstep(0.05, 0.7, dot(fromHeart, uEarthMouth)), 0.25 * smoothstep(0.5, 0.95, fromHeart.y));
  for (int i = 0; i < 3; i++) {
    vec3 d = uEarthLightPos[i] - p;
    light += uEarthLightColor[i] * (0.45 + 0.85 * heartbeat(float(i) * 0.9)) * spill * 0.32 / (dot(d, d) + 1.2);
  }
  vec3 toFlash = uFlash.xyz - p;                               // lightning over the air element
  light += vec3(0.60, 0.74, 1.0) * uFlash.w * 50.0 / (dot(toFlash, toFlash) + 1.0);
  return light;
}
`;

// ====================================================================== sand streams

/**
 * Picks where the sand pours from: the lowest points of the hanging roots, and a couple of
 * overhangs higher on the flanks (never in front of the geode). yaw: the rock's heading in
 * the element's frame.
 * Returns [{ emitter (rock space), seed, strength, lip, heading, landing {x, z, y, radius} }]:
 * strength is the stream's share of the sand, lip the half-width in metres of the edge the
 * sand runs over and heading that edge's direction. The landing is in element-local
 * coordinates; radius > 0 where it falls on the island (buildRubble then heaps a cone of
 * sand there and sets y to its apex), 0 where it falls into the water.
 */
export function chooseStreams(monolith, rng, yaw) {
  const { positions, normals } = monolith;
  const count = positions.length / 3;
  const out = new THREE.Vector3(...FISSURE_OUT);
  const tips = [], ledges = [];
  for (let v = 0; v < count; v++) {
    const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    const ny = normals[v * 3 + 1];
    if (y < -1.2 && ny < -0.55) tips.push(v);
    else if (ny < -0.6 && y > -0.9 && y < 0.5 && Math.hypot(x, z) > 1.15 && Math.abs(x * out.x + z * out.z) < 0.6 * Math.hypot(x, z)) ledges.push(v);
  }
  tips.sort((a, b) => positions[a * 3 + 1] - positions[b * 3 + 1]);
  const chosen = [];
  const far = (v, least) => chosen.every((c) => Math.hypot(positions[c * 3] - positions[v * 3], positions[c * 3 + 2] - positions[v * 3 + 2]) > least);
  for (const v of tips) { if (chosen.length < 3 && far(v, 0.42)) chosen.push(v); }
  for (let attempt = 0; attempt < 400 && chosen.length < 5 && ledges.length > 0; attempt++) {
    const v = ledges[Math.floor(rng() * ledges.length)];
    if (far(v, 0.9)) chosen.push(v);
  }
  const below = new THREE.Vector3();
  return chosen.map((v, i) => {
    const emitter = new THREE.Vector3(positions[v * 3], positions[v * 3 + 1] - 0.02, positions[v * 3 + 2]);
    below.copy(emitter).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    const bed = moundHeight(below.x, below.z);
    const radius = bed > 0.04 ? 0.13 + 0.17 * rng() : 0;
    return {
      emitter,
      seed: rng(),
      // One main pour from the root, lesser ones beside it, trickles from the ledges.
      strength: i === 0 ? 1 : i < 3 ? 0.5 + 0.25 * rng() : 0.4 + 0.15 * rng(),
      lip: i === 0 ? 0.04 : 0.012 + 0.03 * rng(),
      heading: rng() * Math.PI,
      landing: { x: below.x, z: below.z, y: 0, radius },
    };
  });
}

const SAND_VERT = /* glsl */ `
${VERT_PRELUDE}
${PARTICLE_GLSL}
attribute vec4 aEmit;       // emitter in rock space, height the stream lands at
attribute vec4 aSeed;
attribute vec3 aStream;     // the stream: its seed, heading of the lip it pours over, half-width of that lip
varying vec3 vColor;
varying float vAlpha;
varying vec2 vCorner;
varying float vViewZ;

void main() {
  vec3 emitter = (uRockMatrix * vec4(aEmit.xyz, 1.0)).xyz;
  float fall = max(emitter.y - aEmit.w, 0.05);
  const float v0 = 0.3;                                        // the grains are already moving as they leave
  float duration = (-v0 + sqrt(v0 * v0 + 2.0 * GRAVITY * fall)) / GRAVITY;
  float age = fract(aSeed.x + uTime / duration) * duration;    // seconds since this grain left the rock
  float born = uTime - age;
  float flow = streamFlow(aStream.x, born);                    // how hard the stream ran at that moment

  // Free fall. The sand runs over a lip a few centimetres wide, so it leaves as a thin sheet
  // and frays as it drops: a dense core of heavy grains inside a looser halo of fines.
  vec2 disc = vec2(cos(aSeed.y * TAU), sin(aSeed.y * TAU)) * sqrt(aSeed.z);
  vec2 lip = vec2(cos(aStream.y), sin(aStream.y)) * ((fract(aSeed.x * 37.1 + aSeed.y * 13.7) - 0.5) * 2.0 * aStream.z);
  float fines = smoothstep(0.7, 1.0, aSeed.w);
  float scatter = 0.085 + 0.22 * fines;
  vec3 velocity = vec3(disc.x * scatter, -(v0 + GRAVITY * age), disc.y * scatter);
  vec3 p = emitter + vec3(lip.x + disc.x * (0.004 + 0.008 * flow), 0.0, lip.y + disc.y * (0.004 + 0.008 * flow))
         + vec3(velocity.x, 0.0, velocity.z) * age;
  p.y -= v0 * age + 0.5 * GRAVITY * age * age;
  // Moving air carries the grains off as they fall, the light ones furthest, and it keeps
  // changing its mind: each stream leans its own way, sways, and carries kinks down with it
  // (the last term depends on when the grain left), instead of hanging like a plumb line.
  float heading = aStream.x * 40.0 + 0.9 * sin(uTime * 0.21 + aStream.x * 9.0);
  float gust = 0.6 + 0.4 * sin(uTime * 0.53 + aStream.x * 23.0) + 0.25 * sin(born * 3.1 + aStream.x * 51.0);
  p.xz += vec2(cos(heading), sin(heading)) * (0.10 * gust * age * age * (0.35 + aSeed.w));

  // A streak along the motion: where the grain was a fiftieth of a second ago.
  vec4 head = viewMatrix * vec4(p, 1.0);
  vec4 tail = viewMatrix * vec4(p - velocity * 0.02, 1.0);
  vec4 clipHead = projectionMatrix * head;
  vec4 clipTail = projectionMatrix * tail;
  vec2 ndcHead = clipHead.xy / clipHead.w, ndcTail = clipTail.xy / clipTail.w;
  vec2 dir = (ndcHead - ndcTail) * uResolution;
  float len = max(length(dir), 1e-3);
  dir /= len;
  float grainPx = 0.003 * projectionMatrix[1][1] * uResolution.y * 0.5 / max(-head.z, 0.3);
  float widthPx = max(0.9, grainPx);
  vec4 clip = mix(clipTail, clipHead, position.y);
  clip.xy += vec2(-dir.y, dir.x) * position.x * widthPx / uResolution * 2.0 * clip.w;
  gl_Position = clip;

  vCorner = position.xy;
  vViewZ = -head.z;
  vec3 viewDir = normalize(p - cameraPosition);
  vColor = vec3(0.56, 0.41, 0.23) * (0.75 + 0.5 * aSeed.w) * dustLight(p, viewDir, fines) * 1.35;
  // Grains thinner than a pixel are drawn a pixel wide and proportionally fainter. The sand
  // leaves in pulses and in slower surges, so the stream is beaded with denser and thinner
  // stretches that travel down it, and now and then breaks off altogether.
  float coverage = min(1.0, grainPx / 0.9 + 0.06);
  float beads = (0.25 + 0.75 * smoothstep(0.3, 0.7, vnoise(vec2(born * 9.0, aStream.x * 31.0))))
              * (0.6 + 0.4 * smoothstep(0.35, 0.65, vnoise(vec2(born * 1.7, aStream.x * 57.0))));
  vAlpha = min(1.0, flow * coverage * beads * smoothstep(0.0, 0.03, age) * mix(0.9, 0.3, fines) * uSandGain);
  if (uIsMirrorPass > 0.5 && p.y < 0.0) vAlpha = 0.0;
}
`;

const SAND_FRAG = /* glsl */ `
${FRAG_PRELUDE}
varying vec3 vColor;
varying float vAlpha;
varying vec2 vCorner;
varying float vViewZ;
void main() {
  float a = vAlpha * (1.0 - abs(vCorner.x)) * smoothstep(0.0, 0.25, vCorner.y) * softFade(vViewZ, 0.08);
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * a, a);
}
`;

export class SandStreams {
  constructor(ctx, streams, count = 7000) {
    const rng = ctx.rng(606);
    const emit = new Float32Array(count * 4);
    const seed = new Float32Array(count * 4);
    const stream = new Float32Array(count * 3);
    // Each stream gets grains in proportion to its strength. The golden-ratio sequence deals
    // them out evenly mixed, so that drawing fewer instances thins every stream alike.
    const total = streams.reduce((sum, s) => sum + s.strength, 0);
    for (let i = 0; i < count; i++) {
      let pick = ((i * 0.6180339887) % 1) * total, index = 0;
      while (index < streams.length - 1 && pick > streams[index].strength) pick -= streams[index++].strength;
      const s = streams[index];
      emit.set([s.emitter.x, s.emitter.y, s.emitter.z, s.landing.y], i * 4);
      seed.set([rng(), rng(), rng(), rng()], i * 4);
      stream.set([s.seed, s.heading, s.lip], i * 3);
    }
    const geometry = new THREE.InstancedBufferGeometry();
    // A quad: x across the streak (-1 … 1), y along it (0 tail … 1 head).
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.setAttribute('aEmit', new THREE.InstancedBufferAttribute(emit, 4));
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
    geometry.setAttribute('aStream', new THREE.InstancedBufferAttribute(stream, 3));
    geometry.instanceCount = count;
    // Everything the streams can reach, so the mesh is culled when the camera looks elsewhere.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.2, 0), 3.6);
    this.maxCount = count;
    this.mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      uniforms: { ...shared, ...earthUniforms, ...particleUniforms },
      vertexShader: SAND_VERT,
      fragmentShader: SAND_FRAG,
      side: THREE.DoubleSide,                      // the streak may face either way on screen
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,              // premultiplied alpha: sand hides what is behind it
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    }));
    this.mesh.layers.set(ctx.LAYERS.FX);
  }

  /** fraction of the grains to draw; each one drawn is made more opaque to keep the streams as dense to the eye. */
  setDensity(fraction) {
    this.mesh.geometry.instanceCount = Math.floor(this.maxCount * fraction);
    particleUniforms.uSandGain.value = 1 / Math.max(fraction, 0.2);
  }
}

// ====================================================================== dust

const DUST_VERT = /* glsl */ `
${VERT_PRELUDE}
${PARTICLE_GLSL}
attribute vec4 aEmit;       // motes: home position (element-local) | veil, puff: emitter (rock space) and landing height
attribute vec4 aSeed;
attribute vec2 aKind;       // x: 0 mote, 1 veil shed by a stream, 2 puff where it lands, 3 splash droplet;
                            // y: 0 for a free mote, 1 for one that stays before the geode | stream seed | splash slot
varying vec3 vColor;
varying float vAlpha;
varying float vViewZ;
varying float vSoft;

void main() {
  vec3 p;
  float alpha = 0.0;
  float size = 0.01;          // metres
  vec3 tone = vec3(0.60, 0.52, 0.42);
  float sparkle = 1.0;
  vSoft = 1.0;

  if (aKind.x < 0.5) {
    // ---- a mote: wanders about its home on slow, unrelated cycles, and tumbles (it glints when it faces the light)
    p = uEarthOrigin + aEmit.xyz;
    float turn = uTime * 0.012 * (0.5 + aSeed.x) * (1.0 - aKind.y);
    p.xz = uEarthOrigin.xz + rot2(turn) * aEmit.xz;
    p += vec3(sin(uTime * (0.11 + aSeed.y * 0.13) + aSeed.x * 40.0),
              sin(uTime * (0.07 + aSeed.z * 0.10) + aSeed.y * 40.0) * 0.6,
              cos(uTime * (0.09 + aSeed.w * 0.12) + aSeed.z * 40.0)) * (0.18 + 0.3 * aSeed.w);
    sparkle = 0.9 + 5.0 * spow(0.5 + 0.5 * sin(uTime * (0.7 + aSeed.y * 2.3) + aSeed.w * 60.0), 6.0);
    alpha = 0.8 * smoothstep(0.02, 0.3, p.y);
    size = 0.004 + 0.007 * aSeed.z;
    vSoft = 0.0;
  } else if (aKind.x < 1.5) {
    // ---- the veil: fines leave the stream somewhere along its fall and drift off downwind
    vec3 emitter = (uRockMatrix * vec4(aEmit.xyz, 1.0)).xyz;
    float fall = max(emitter.y - aEmit.w, 0.05);
    float life = fract(aSeed.x + uTime * (0.28 + 0.12 * aSeed.y));
    float age = life / (0.28 + 0.12 * aSeed.y);
    float flow = streamFlow(aKind.y, uTime - age);
    p = emitter - vec3(0.0, fall * (0.08 + 0.85 * aSeed.z), 0.0);
    p += vec3(0.16, -0.22, 0.10) * age + vec3(sin(aSeed.w * 50.0 + age * 1.3), 0.0, cos(aSeed.w * 37.0 + age * 1.1)) * 0.07 * age;
    alpha = 0.10 * flow * smoothstep(0.0, 0.12, life) * (1.0 - life);
    size = 0.09 + 0.26 * life;
  } else if (aKind.x < 2.5) {
    // ---- a puff: thrown outward along the ground where the stream lands, slowing and lifting
    vec3 emitter = (uRockMatrix * vec4(aEmit.xyz, 1.0)).xyz;
    float rate = 0.55 + 0.35 * aSeed.y;
    float life = fract(aSeed.x + uTime * rate);
    float age = life / rate;
    float flow = streamFlow(aKind.y, uTime - age);
    float a = aSeed.z * TAU;
    float reach = (0.10 + 0.32 * aSeed.w) * (1.0 - exp(-age * 3.0));       // drag
    p = vec3(emitter.x, aEmit.w, emitter.z) + vec3(cos(a) * reach, 0.03 + 0.20 * age * (0.4 + aSeed.y), sin(a) * reach);
    alpha = 0.32 * flow * smoothstep(0.0, 0.08, life) * sq(1.0 - life);
    size = 0.05 + 0.20 * life;
    tone = aEmit.w < 0.01 ? vec3(0.55, 0.62, 0.70) : tone;                 // spray, not dust, where it lands in the film
  } else {
    // ---- a droplet thrown up by a pebble: ballistic from the splash point
    vec4 splash = uSplash[int(aKind.y)];
    float age = uTime - splash.z;
    float a = aSeed.x * TAU;
    float speed = (0.25 + 1.3 * aSeed.y * aSeed.y) * splash.w;
    float rise = (1.3 + 2.6 * aSeed.z) * splash.w;
    p = vec3(splash.x + cos(a) * speed * age, rise * age - 0.5 * GRAVITY * age * age, splash.y + sin(a) * speed * age);
    alpha = (age > 0.0 && p.y > 0.0) ? 0.9 : 0.0;
    size = 0.008 + 0.014 * aSeed.w;
    tone = vec3(0.75, 0.85, 1.0) * 7.0;                                    // droplets mirror the sky: far brighter than dust
    vSoft = 0.0;
  }

  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vViewZ = -mv.z;
  float px = size * projectionMatrix[1][1] * uResolution.y * 0.5 / max(vViewZ, 0.3);
  // Specks smaller than a pixel are drawn at one pixel and dimmed to match (not quite all
  // the way, or the air would look empty from across the ring).
  float minPx = 1.3 * uResolution.y / 720.0;
  alpha *= min(1.0, px * px / (minPx * minPx) + 0.1);
  gl_PointSize = clamp(px, minPx, 160.0);
  vColor = tone * dustLight(p, normalize(p - cameraPosition), 1.0) * sparkle;
  vAlpha = alpha * smoothstep(0.3, 1.2, vViewZ);
  // The film reflects nothing that is under it, and the motes are too faint to show in it at all.
  if (uIsMirrorPass > 0.5 && (aKind.x < 0.5 || p.y < 0.0)) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`;

const DUST_FRAG = /* glsl */ `
${FRAG_PRELUDE}
varying vec3 vColor;
varying float vAlpha;
varying float vViewZ;
varying float vSoft;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = vAlpha * smoothstep(1.0, mix(0.4, 0.0, vSoft), d);
  a *= mix(1.0, softFade(vViewZ, 0.25), vSoft);
  if (a < 0.002) discard;
  gl_FragColor = vec4(vColor * a, 0.0);              // dust only adds light: thin, forward-scattering
}
`;

export class Dust {
  /** streams: from chooseStreams. heart, mouth: the geode's heart and the direction it opens toward, element-local. */
  constructor(ctx, streams, heart, mouth, { motes = 3300, mouthMotes = 420, veilPerStream = 150, puffsPerStream = 110, dropletsPerSplash = 48 } = {}) {
    const rng = ctx.rng(31337);
    const count = motes + mouthMotes + streams.length * (veilPerStream + puffsPerStream) + MAX_SPLASHES * dropletsPerSplash;
    const emit = new Float32Array(count * 4);
    const seed = new Float32Array(count * 4);
    const kind = new Float32Array(count * 2);
    let i = 0;
    const push = (e, k, y) => {
      emit.set(e, i * 4);
      seed.set([rng(), rng(), rng(), rng()], i * 4);
      kind.set([k, y], i * 2);
      i++;
    };
    for (const s of streams) {
      for (let k = 0; k < veilPerStream; k++) push([s.emitter.x, s.emitter.y, s.emitter.z, s.landing.y], 1, s.seed);
      for (let k = 0; k < puffsPerStream; k++) push([s.emitter.x, s.emitter.y, s.emitter.z, s.landing.y], 2, s.seed);
    }
    for (let slot = 0; slot < MAX_SPLASHES; slot++) {
      for (let k = 0; k < dropletsPerSplash; k++) push([0, 0, 0, 0], 3, slot);
    }
    // Motes fill a wide column of air around the rock, thickest near it. They come last in
    // the buffer so that a lower quality level can simply draw fewer of them.
    this.fixedCount = i;
    this.moteCount = motes + mouthMotes;
    // A denser haze hangs in the cone of light before the geode's mouth, where it shows the glow.
    const dir = new THREE.Vector3();
    for (let m = 0; m < mouthMotes; m++) {
      dir.set(mouth.x + (rng() - 0.5) * 1.1, (rng() - 0.5) * 1.1, mouth.z + (rng() - 0.5) * 1.1).normalize();
      const d = 0.7 + 2.3 * rng() * rng();
      push([heart.x + dir.x * d, heart.y + dir.y * d, heart.z + dir.z * d, 0], 0, 1);
    }
    for (let m = 0; m < motes; m++) {
      const r = 0.8 + 4.6 * Math.pow(rng(), 0.8), a = rng() * Math.PI * 2;
      push([Math.cos(a) * r, 0.15 + 6.6 * rng(), Math.sin(a) * r, 0], 0, 0);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('aEmit', new THREE.Float32BufferAttribute(emit, 4));
    geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 4));
    geometry.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 2));
    // The column of air the motes wander in, plus the reach of a splash beside the island.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 3.4, 0), 8);
    this.points = new THREE.Points(geometry, new THREE.ShaderMaterial({
      uniforms: { ...shared, ...earthUniforms, ...particleUniforms },
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    }));
    this.points.layers.set(ctx.LAYERS.FX);
  }

  /** fraction of the motes to draw (quality). */
  setDensity(fraction) { this.points.geometry.setDrawRange(0, this.fixedCount + Math.floor(this.moteCount * fraction)); }
}

// ====================================================================== falling pebbles

/**
 * Now and then a pebble works loose from the flank of the monolith, falls clear of the
 * island and hits the film: a ring of ripples (the core's simulation) and a crown of droplets.
 */
export class FallingPebbles {
  constructor(ctx, monolith, shape, material, rock) {
    this.ctx = ctx;
    this.rock = rock;
    this.rng = ctx.rng(5150);
    // Places a pebble can leave from: steep faces on the outside of the upper body.
    const { positions, normals } = monolith;
    this.sources = [];
    for (let v = 0; v < positions.length / 3; v += 37) {
      const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
      if (y > -0.4 && y < 1.7 && Math.abs(normals[v * 3 + 1]) < 0.35 && Math.hypot(x, z) > 1.25) {
        this.sources.push(new THREE.Vector3(x, y, z), new THREE.Vector3(normals[v * 3], 0, normals[v * 3 + 2]).normalize());
      }
    }
    this.pebbles = Array.from({ length: 3 }, () => ({
      active: false, start: new THREE.Vector3(), velocity: new THREE.Vector3(), t0: 0, duration: 1, size: 0.04,
      axis: new THREE.Vector3(1, 0, 0), spin: 4,
    }));
    this.mesh = createRockInstances(shape, material, this.pebbles.map((_, i) => ({ seed: 41 + i * 7.3, size: 0.05 })));
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.nextDrop = 3.5;
    this.slot = 0;
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._m = new THREE.Matrix4();
    this._hide = new THREE.Matrix4().makeScale(0, 0, 0);
  }

  update(t) {
    const rng = this.rng;
    if (t >= this.nextDrop && this.sources.length > 0) {
      this.nextDrop = t + 6 + 8 * rng();
      let pebble = null;
      for (let i = 0; i < this.pebbles.length && !pebble; i++) if (!this.pebbles[i].active) pebble = this.pebbles[i];
      if (pebble) {
        const k = Math.floor(rng() * (this.sources.length / 2)) * 2;
        // Element-local coordinates: the rock group is a direct child of the element's group.
        pebble.start.copy(this.sources[k]).applyMatrix4(this.rock.matrix);
        // Pushed off outward, fast enough to clear the island below.
        pebble.velocity.copy(this.sources[k + 1]).transformDirection(this.rock.matrix).multiplyScalar(1.1 + 0.7 * rng());
        pebble.velocity.y = 0.2 * rng();
        pebble.t0 = t;
        pebble.duration = (pebble.velocity.y + Math.sqrt(pebble.velocity.y * pebble.velocity.y + 2 * G * pebble.start.y)) / G;
        pebble.size = 0.035 + 0.03 * rng();
        pebble.axis.set(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
        pebble.spin = 3 + 6 * rng();
        pebble.active = true;
      }
    }
    for (let i = 0; i < this.pebbles.length; i++) {
      const pebble = this.pebbles[i];
      let matrix = this._hide;
      if (pebble.active) {
        const age = t - pebble.t0;
        if (age >= pebble.duration) {
          pebble.active = false;
          const x = this.ctx.origin.x + pebble.start.x + pebble.velocity.x * pebble.duration;
          const z = this.ctx.origin.z + pebble.start.z + pebble.velocity.z * pebble.duration;
          this.ctx.ripples.drop(x, z, 0.3, 0.06);
          const strength = 0.75 + 0.5 * rng();
          particleUniforms.uSplash.value[this.slot].set(x, z, t, strength);
          this.slot = (this.slot + 1) % MAX_SPLASHES;
        } else {
          this._p.copy(pebble.start).addScaledVector(pebble.velocity, age);
          this._p.y -= 0.5 * G * age * age;
          this._q.setFromAxisAngle(pebble.axis, pebble.spin * age);
          matrix = this._m.compose(this._p, this._q, this._s.setScalar(pebble.size));
        }
      }
      matrix.toArray(this.mesh.instanceMatrix.array, i * 16);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
