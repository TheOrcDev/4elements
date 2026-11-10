import * as THREE from 'three';
import { shared } from '../../core/shared.js';
import { LAYERS } from '../../core/layers.js';
import { VERT_PRELUDE } from '../../core/glsl/index.js';
import { WAVES, WAVES_GLSL, RADIUS, LEVEL, glslFloat as f } from './waves.js';

// Water that has left the column. Both systems draw on the LATE layer, after the body,
// so they sort against the depth the ray tracer wrote.
//
//   spray   stateless GPU points thrown off the lee rim in bursts, each burst timed to a
//           crest of one of the two big swell trains running into the wall
//   drips   a small CPU-fed pool of heavy drops that fall to the film (the CPU needs to
//           know where they land to start a ring there), each ending in a little crown

// Light on a droplet: sky and moon, plus the afterglow and the pyre, which a droplet throws
// forward toward the eye far more strongly than it sends them back.
const DROPLET_LIGHT = /* glsl */ `
vec3 dropletLight(vec3 world, vec3 toEye) {
  vec3 light = skyAmbient(vec3(0.0, 1.0, 0.0)) * 1.6 + uMoonColor * (0.35 + 0.9 * pow(saturate(dot(-toEye, uMoonDir)), 6.0));
  vec3 glow = normalize(vec3(uSunDir.x, 0.05, uSunDir.z));
  light += uSunColor * (0.10 + 1.6 * pow(saturate(dot(-toEye, glow)), 4.0));
  vec3 toFire = uFireLightPos - world;
  float fd2 = dot(toFire, toFire);
  light += uFireLightColor / (fd2 + 1.0) * (0.4 + 2.0 * pow(saturate(dot(-toEye, toFire) * inversesqrt(fd2)), 4.0));
  vec3 toFlash = uFlash.xyz - world;
  light += flashIntensity() / (4.0 * PI * (dot(toFlash, toFlash) + 1.0));
  return light;
}
`;

// A burst belongs to one swell train: it goes off where and when a crest of that train
// reaches the wall. Each group of points is one stretch of rim; successive crests re-use it.
const GROUPS = 16;
const SWELL = [0, 1];                     // indices into WAVES of the two trains that slap hardest
const SPAN_MAX = 1.75;                    // seconds; shorter than either train's period, so cycles never overlap
const headingOf = (w) => Math.atan2(w.dz, w.dx);

const SPRAY_VERT = /* glsl */ `
${VERT_PRELUDE}
${WAVES_GLSL}
${DROPLET_LIGHT}
attribute vec4 aSeed;
varying vec3 vColor;
varying vec4 vShape;          // xy = unit direction of travel on screen, z = half-length of the streak (px), w = radius (px)
varying float vSoft;
varying float vSize;

const float GROUPS = ${f(GROUPS)};
const float LEAD = 0.9;       // radians of phase before the crest at which the water starts to fly

void main() {
  vec3 p0, v0;
  float age, span, kick;
  float h3 = fract(aSeed.x * 91.7 + aSeed.z * 13.3);       // each droplet catches the light a little differently
  float fold;
  float puff = step(0.84, fract(aSeed.y * 7.31));      // one point in six is a puff of the finest spray
  span = mix(1.0, ${f(SPAN_MAX)}, aSeed.z);

  if (aSeed.x > 0.16) {
    // ---- slap: a crest runs up the lee wall and a sheet of water is flung up and out over the lip
    float u = (aSeed.x - 0.16) / 0.84;
    float group = floor(aSeed.y * GROUPS);
    int train = group < GROUPS * 0.56 ? ${SWELL[0]} : ${SWELL[1]};
    vec4 K = WAVE_K[train];
    float heading = train == ${SWELL[0]} ? ${f(headingOf(WAVES[SWELL[0]]))} : ${f(headingOf(WAVES[SWELL[1]]))};
    // The stretch of rim this group owns, denser dead ahead of the train than out on its flanks.
    float slot = fract(group * 0.61803) * 2.0 - 1.0;
    float base = heading + slot * (0.45 + 0.75 * abs(slot));
    vec2 rimBase = vec2(cos(base), sin(base)) * ${f(RADIUS)};
    // Which crest: the latest one to have reached that stretch.
    float n = ceil((dot(K.xy, rimBase) + K.w - LEAD - K.z * uTime) / TAU);
    vec3 eh = hash31(n * 17.0 + group * 61.3);
    // Where exactly this crest breaks, how wide and how hard.
    float centre = base + (eh.x - 0.5) * 0.5;
    float halfWidth = 0.14 + 0.30 * eh.y;
    vec3 h = hash31(n * 7.0 + aSeed.x * 913.0 + aSeed.w * 311.0);
    float across = (h.x + h.y - 1.0);                          // -1..1, crowded toward the middle
    float ang = centre + across * halfWidth;
    vec2 rim = vec2(cos(ang), sin(ang));
    // When: as the crest reaches this droplet's own bit of rim, and for a moment after.
    float late = 0.32 * aSeed.z * aSeed.z + 0.05 * h.z;
    float born = (dot(K.xy, rim * ${f(RADIUS)}) + K.w - LEAD - TAU * n) / K.z + late;
    age = uTime - born;
    float h0 = waveHeight(rim * ${f(RADIUS)}, born, fold);
    float taper = 1.0 - 0.6 * across * across;
    kick = smoothstep(0.06, 0.28, h0) * (0.45 + 0.75 * eh.z) * taper;
    vec3 outward = vec3(rim.x, 0.0, rim.y);
    vec3 along = vec3(-rim.y, 0.0, rim.x);
    p0 = outward * (${f(RADIUS)} + 0.015) + vec3(0.0, ${f(LEVEL)} + h0 - 0.05 * aSeed.w, 0.0);
    // The sheet leaves as one thing: speed falls off toward its edges and toward its tail
    // end, and each droplet differs from its neighbours only a little. Drag sorts them later.
    float sheet = taper * (1.0 - 0.55 * late / 0.37);
    float lift = (1.5 + 2.9 * kick) * sheet * (0.82 + 0.36 * u);
    v0 = vec3(0.0, lift, 0.0)
       + outward * (0.25 + 1.1 * aSeed.w * (0.5 + kick))
       + along * (across * 0.9 + (h.z - 0.5) * 0.5);
  } else {
    // ---- spindrift: where a crest folds over out on the open surface, the top is whipped off down-wave
    float u = aSeed.x / 0.16;
    float cycle = uTime / span + aSeed.y;
    float index = floor(cycle);
    age = (cycle - index) * span;
    float born = uTime - age;
    vec3 h = hash31(index * 17.0 + aSeed.x * 613.0);
    vec2 at = ${f(RADIUS)} * 0.95 * sqrt(h.x) * vec2(cos(TAU * h.y), sin(TAU * h.y));
    float h0 = waveHeight(at, born, fold);
    kick = smoothstep(0.95, 1.4, fold);
    p0 = vec3(at.x, ${f(LEVEL)} + h0, at.y);
    v0 = vec3(0.5 + 1.4 * aSeed.w, 0.3 + 1.5 * u, (h.z - 0.5) * 0.9);
    puff = max(puff, step(0.5, fract(aSeed.y * 3.7)));         // mostly mist
  }

  // Fine droplets are stopped by the air almost at once and then sink; heavy ones fly.
  // With linear drag k the path is closed-form: p = p0 + (v0 - vt)(1 - e^(-k t)) / k + vt t.
  float size = aSeed.w * aSeed.w * aSeed.w;                          // most droplets are small
  float drag = mix(mix(3.6, 0.35, sqrt(size)), 3.2, puff);
  vec3 terminal = vec3(0.25, -7.5 / (drag + 0.8), 0.0);             // settling speed, with a breath of wind
  float e = exp(-drag * max(age, 0.0));
  vec3 p = p0 + (v0 - terminal) * (1.0 - e) / drag + terminal * age;
  vec3 vel = (v0 - terminal) * e + terminal;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vec4 view = viewMatrix * world;
  gl_Position = projectionMatrix * view;

  float life = age / span;
  float alive = sqrt(max(kick, 0.0)) * step(0.0, age) * smoothstep(0.0, 0.02, life) * (1.0 - smoothstep(0.55, 1.0, life)) * step(0.0, p.y);
  // Back inside the column the droplet has simply rejoined the sea.
  alive *= step(${f(RADIUS)}, length(p.xz)) + step(${f(LEVEL)} + 0.12, p.y) > 0.5 ? 1.0 : 0.0;

  // Diameter in pixels. Below a pixel and a bit, hold the size and dim instead.
  float pxPerMetre = projectionMatrix[1][1] * uResolution.y * 0.5 / max(-view.z, 0.1);
  float diameter = mix(mix(0.004, 0.022, size) * (1.0 - 0.4 * life), 0.05 + 0.10 * aSeed.w + 0.20 * life, puff);
  float px = diameter * pxPerMetre;
  float drawn = max(px, 1.4);
  float dim = px / drawn;
  // A droplet in flight is a streak: its path over the time the shutter is open.
  vec2 travel = (mat3(viewMatrix) * vel).xy * pxPerMetre * (1.0 / 90.0) * (1.0 - puff);
  float streak = min(length(travel), 40.0);
  vShape = vec4(streak > 1e-3 ? travel / length(travel) : vec2(0.0, 1.0), streak * 0.5, drawn * 0.5);
  vSize = min(drawn + streak, 110.0);
  gl_PointSize = vSize;
  // Brightest in the first instant, when the water is still a sheet rather than drops; the
  // light a streak carries is the droplet's own, spread along its length.
  vColor = dropletLight(world.xyz, normalize(cameraPosition - world.xyz)) * alive * dim * dim
         * mix((0.85 - 0.4 * smoothstep(0.0, 0.3, life)) * (0.45 + 0.9 * h3) * drawn / (drawn + streak * 0.8), 0.028, puff);
  vSoft = puff;
  if (alive <= 0.001) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`;

const SPRAY_FRAG = /* glsl */ `
varying vec3 vColor;
varying vec4 vShape;
varying float vSoft;
varying float vSize;
void main() {
  vec2 q = (gl_PointCoord - 0.5) * vSize;
  q.y = -q.y;
  float a;
  if (vSoft > 0.5) {
    float fall = 1.0 - min(length(q) / (vSize * 0.5), 1.0);
    a = fall * fall;                                                       // a soft puff
  } else {
    float along = dot(q, vShape.xy);
    float across = dot(q, vec2(-vShape.y, vShape.x));
    float d = length(vec2(across, max(abs(along) - vShape.z, 0.0)));
    a = smoothstep(vShape.w, vShape.w * 0.25, d);                          // a crisp bead drawn out along its path
  }
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vColor * a, 1.0);
}
`;

export function createSpray(ctx, count) {
  const seeds = new Float32Array(count * 4);
  const rng = ctx.rng(411);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rng();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(1.5, 2.5, 0), 7);
  const points = new THREE.Points(geometry, new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: SPRAY_VERT,
    fragmentShader: SPRAY_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
  }));
  points.layers.set(LAYERS.LATE);
  return points;
}

// ---------------------------------------------------------------- drips

const CROWN = 6;              // droplets in the little crown a drop throws up where it lands
const GRAVITY = 9.81;

const DRIP_VERT = /* glsl */ `
${VERT_PRELUDE}
${DROPLET_LIGHT}
attribute vec4 aStart;        // xyz = where the drop left the column (local), w = when
attribute vec4 aVelocity;     // xyz = velocity then, w = radius (m)
attribute vec3 aSprite;       // xy = corner of the quad, z = 0 for the drop, 1..CROWN for its crown
varying vec3 vColor;
varying vec2 vCorner;
varying float vStretch;       // length of the streak in widths

void main() {
  float age = uTime - aStart.w;
  // Time of flight of the drop: y0 + vy t - g t^2 / 2 = 0.
  float flight = (aVelocity.y + sqrt(aVelocity.y * aVelocity.y + 2.0 * ${f(GRAVITY)} * max(aStart.y, 0.0))) / ${f(GRAVITY)};
  vec3 gravity = vec3(0.0, -${f(GRAVITY)}, 0.0);
  vec3 p, v;
  float radius = aVelocity.w;
  float alive = step(0.0, age);
  if (aSprite.z < 0.5) {
    p = aStart.xyz + aVelocity.xyz * age + 0.5 * gravity * age * age;
    v = aVelocity.xyz + gravity * age;
    alive *= step(age, flight);
  } else {
    // Crown: where the drop went in, a ring of small droplets jumps up and out.
    vec3 land = aStart.xyz + aVelocity.xyz * flight + 0.5 * gravity * flight * flight;
    float since = age - flight;
    vec3 r = hash31(aSprite.z * 7.0 + aStart.w * 31.0);
    float ang = (aSprite.z + r.x) / ${f(CROWN)} * TAU;
    vec3 v0 = vec3(cos(ang), 0.0, sin(ang)) * (0.25 + 0.45 * r.y) + vec3(0.0, 0.8 + 1.1 * r.z, 0.0);
    p = vec3(land.x, 0.0, land.z) + v0 * since + 0.5 * gravity * since * since;
    v = v0 + gravity * since;
    radius *= 0.5;
    alive *= step(0.0, since) * step(0.0, p.y);
  }

  // A falling drop is a streak: stretch the quad along its motion as seen on screen.
  vec4 world = modelMatrix * vec4(p, 1.0);
  vec4 view = viewMatrix * world;
  vec3 viewVel = mat3(viewMatrix) * v;
  float shutter = 1.0 / 60.0;
  vec2 dir = viewVel.xy * shutter;
  float len = length(dir);
  dir = len > 1e-5 ? dir / len : vec2(0.0, 1.0);
  float pixel = 2.0 * max(-view.z, 0.1) / (projectionMatrix[1][1] * uResolution.y);   // metres per pixel at the drop
  float halfWidth = max(radius, pixel * 0.75);
  float halfLength = halfWidth + len * 0.5;
  view.xy += dir * aSprite.y * halfLength + vec2(-dir.y, dir.x) * aSprite.x * halfWidth;
  gl_Position = alive > 0.5 ? projectionMatrix * view : vec4(2.0, 2.0, 2.0, 1.0);
  vCorner = aSprite.xy;
  vStretch = halfLength / halfWidth;
  // Same light as the spray; a drop drawn wider than life, or drawn out into a streak, is
  // that much fainter.
  float dim = sq(radius / halfWidth) * halfWidth / halfLength;
  vColor = dropletLight(world.xyz, normalize(cameraPosition - world.xyz)) * 2.2 * dim;
}
`;

const DRIP_FRAG = /* glsl */ `
varying vec3 vColor;
varying vec2 vCorner;
varying float vStretch;
void main() {
  // A round head leading a tail that narrows and fades. Everything in units of the width.
  float s = vCorner.y * vStretch;
  float headAt = vStretch - 1.0;
  float behind = max(headAt - s, 0.0);
  float core = 1.0 - smoothstep(0.3, 1.0, length(vec2(vCorner.x, s - headAt)));
  float reach = max(2.0 * vStretch - 1.0, 1e-3);
  float width = mix(1.0, 0.35, behind / reach);
  float tail = exp(-3.0 * behind / reach) * (1.0 - smoothstep(width * 0.3, width, abs(vCorner.x))) * step(s, headAt) * 0.6;
  float a = max(core, tail);
  if (a <= 0.002) discard;
  gl_FragColor = vec4(vColor * a, 1.0);
}
`;

/** A pool of heavy drops. spawn() throws one; landings are reported through onLand(x, z, radius). */
export class Drips {
  constructor(capacity) {
    this.capacity = capacity;
    this.next = 0;
    this.start = new Float32Array(capacity * 4).fill(-1000);
    this.velocity = new Float32Array(capacity * 4);
    this.landTime = new Float32Array(capacity).fill(-1);      // < 0: nothing in flight
    this.landX = new Float32Array(capacity);
    this.landZ = new Float32Array(capacity);

    // One instance per drop: a quad for the drop itself and CROWN more for its splash.
    const sprites = 1 + CROWN;
    const corners = [-1, -1, 1, -1, 1, 1, -1, 1];
    const sprite = new Float32Array(sprites * 4 * 3);
    const index = [];
    for (let s = 0; s < sprites; s++) {
      for (let c = 0; c < 4; c++) sprite.set([corners[c * 2], corners[c * 2 + 1], s], (s * 4 + c) * 3);
      index.push(s * 4, s * 4 + 1, s * 4 + 2, s * 4, s * 4 + 2, s * 4 + 3);
    }
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(sprites * 4 * 3), 3));
    geometry.setAttribute('aSprite', new THREE.Float32BufferAttribute(sprite, 3));
    geometry.setIndex(index);
    this.startAttribute = new THREE.InstancedBufferAttribute(this.start, 4).setUsage(THREE.DynamicDrawUsage);
    this.velocityAttribute = new THREE.InstancedBufferAttribute(this.velocity, 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aStart', this.startAttribute);
    geometry.setAttribute('aVelocity', this.velocityAttribute);
    geometry.instanceCount = capacity;
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 7);
    this.mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      uniforms: { ...shared },
      vertexShader: DRIP_VERT,
      fragmentShader: DRIP_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    }));
    this.mesh.layers.set(LAYERS.LATE);
  }

  /** Throw a drop from local (x, y, z) with velocity (vx, vy, vz) at time t. */
  spawn(t, x, y, z, vx, vy, vz, radius) {
    const i = this.next;
    this.next = (i + 1) % this.capacity;
    const o = i * 4;
    this.start[o] = x; this.start[o + 1] = y; this.start[o + 2] = z; this.start[o + 3] = t;
    this.velocity[o] = vx; this.velocity[o + 1] = vy; this.velocity[o + 2] = vz; this.velocity[o + 3] = radius;
    this.startAttribute.needsUpdate = true;
    this.velocityAttribute.needsUpdate = true;
    const flight = (vy + Math.sqrt(vy * vy + 2 * GRAVITY * Math.max(y, 0))) / GRAVITY;
    this.landTime[i] = t + flight;
    this.landX[i] = x + vx * flight;
    this.landZ[i] = z + vz * flight;
  }

  /** Report every drop that has reached the film since the last call. */
  update(t, onLand) {
    for (let i = 0; i < this.capacity; i++) {
      if (this.landTime[i] >= 0 && t >= this.landTime[i]) {
        this.landTime[i] = -1;
        onLand(this.landX[i], this.landZ[i], this.velocity[i * 4 + 3]);
      }
    }
  }
}
