import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { shared } from '../../core/shared.js';
import { FRAG_PRELUDE } from '../../core/glsl/index.js';
import { BOWL, bowlOuterY, FIRE_GLSL, SOLID_GLSL, SOLID_VERT, WORLD_VERT } from './common.js';
import { createNoise } from './noise.js';

// The vessel: a hand-forged iron bowl with a rolled rim, a riveted band and three ring
// handles, seated on three basalt blocks that stand in the water, with rubble at their feet.

// ------------------------------------------------------------------------------- bowl

// The plate is a spherical cap. Its mid-surface radius, and the angle from the bowl's axis
// (measured at the centre of the sphere) at which the rim sits.
const MID_R = BOWL.outerR - BOWL.wall / 2;
const RIM_ANGLE = Math.asin(BOWL.rimR / BOWL.outerR) - 0.012;

/**
 * Cross-section of the bowl as a closed strip of (r, y, side) points: up the outer skin,
 * around the rolled rim, down the inner skin. side is +1 outside, -1 inside and passes
 * through 0 on top of the rim. skin, cap: how many steps each skin and the rim are drawn in.
 */
function bowlProfile(skin, cap) {
  const midR = MID_R, rimAngle = RIM_ANGLE;
  const pts = [];
  // Plate thickness along the arc: constant, a raised band below the rim, a swollen bead at the rim.
  const thickness = (a) => {
    const arc = (rimAngle - a) * midR;                         // metres below the rim, along the skin
    const bead = 0.034 * (1 - THREE.MathUtils.smoothstep(arc, 0.0, 0.065));
    const band = 0.007 * THREE.MathUtils.smoothstep(arc, 0.085, 0.10) * (1 - THREE.MathUtils.smoothstep(arc, 0.155, 0.17));
    return { outer: BOWL.wall / 2 + bead / 2 + band, inner: BOWL.wall / 2 + bead / 2 };
  };
  for (let i = 0; i <= skin; i++) {
    // Denser toward the rim, where the band and the bead need resolution.
    const a = rimAngle * (1 - Math.pow(1 - i / skin, 1.7));
    const t = thickness(a).outer;
    pts.push({ r: (midR + t) * Math.sin(a), y: BOWL.centreY - (midR + t) * Math.cos(a), side: 1 });
  }
  const endT = thickness(rimAngle).outer;
  const mr = midR * Math.sin(rimAngle), my = BOWL.centreY - midR * Math.cos(rimAngle);
  const nx = Math.sin(rimAngle), ny = -Math.cos(rimAngle);     // outward normal of the skin at the rim
  const tx = Math.cos(rimAngle), ty = Math.sin(rimAngle);      // along the skin, toward the rim
  for (let i = 1; i < cap; i++) {
    const b = (i / cap) * Math.PI;
    pts.push({ r: mr + endT * (Math.cos(b) * nx + Math.sin(b) * tx), y: my + endT * (Math.cos(b) * ny + Math.sin(b) * ty), side: Math.cos(b) });
  }
  for (let i = skin; i >= 0; i--) {
    const a = rimAngle * (1 - Math.pow(1 - i / skin, 1.7));
    const t = thickness(a).inner;
    pts.push({ r: (midR - t) * Math.sin(a), y: BOWL.centreY - (midR - t) * Math.cos(a), side: -1 });
  }
  return pts;
}

/**
 * The bowl with its fittings. detail: 0 for the close view; 1 the same bowl from a third of
 * the triangles; 2 from a twelfth, for the reflection, the shadow map and the view from far
 * away (no rivets or staples: from there they are smaller than a pixel; the ring handles
 * stay, as hoops of a few facets).
 */
function buildBowlGeometry(detail) {
  const profile = bowlProfile([44, 26, 12][detail], [10, 6, 4][detail]);
  const around = [160, 96, 48][detail];
  const coarse = detail === 2;
  const rows = profile.length;
  const position = new Float32Array(rows * around * 3);
  const info = new Float32Array(rows * around * 2);
  for (let j = 0; j < rows; j++) {
    const p = profile[j];
    for (let i = 0; i < around; i++) {
      const th = (i / around) * Math.PI * 2;
      // Forged by hand: not quite round, and the rim does not lie in a plane.
      const oval = 1 + 0.010 * Math.sin(2 * th + 0.6) + 0.006 * Math.sin(3 * th + 2.1) + 0.003 * Math.sin(7 * th + 4.0);
      const lift = (0.010 * Math.sin(3 * th + 1.0) + 0.006 * Math.sin(5 * th + 0.3)) * Math.pow(p.r / BOWL.rimR, 3);
      const k = (j * around + i) * 3;
      position[k] = Math.cos(th) * p.r * oval;
      position[k + 1] = p.y + lift;
      position[k + 2] = Math.sin(th) * p.r * oval;
      const m = (j * around + i) * 2;
      info[m] = p.side;
      info[m + 1] = 0;
    }
  }
  const index = [];
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < around; i++) {
      const a = j * around + i, b = j * around + ((i + 1) % around);
      const c = a + around, d = b + around;
      index.push(a, c, b, b, c, d);
    }
  }
  const plate = new THREE.BufferGeometry();
  plate.setAttribute('position', new THREE.BufferAttribute(position, 3));
  plate.setAttribute('aBowl', new THREE.BufferAttribute(info, 2));
  plate.setIndex(index);
  plate.computeVertexNormals();

  // Fittings: a ring of rivets through the band and three forged ring handles.
  const parts = [plate];
  const fitting = (geometry) => {
    // Weld by position so the recomputed normals are smooth, and tag every vertex as a fitting.
    geometry.deleteAttribute('uv');
    geometry.deleteAttribute('normal');
    const g = mergeVertices(geometry, 1e-5);
    const data = new Float32Array(g.attributes.position.count * 2);
    for (let i = 0; i < data.length; i += 2) { data[i] = 1; data[i + 1] = 1; }
    g.setAttribute('aBowl', new THREE.BufferAttribute(data, 2));
    g.computeVertexNormals();
    parts.push(g);
  };
  const midR = MID_R, rimAngle = RIM_ANGLE;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);

  // Rivets through the middle of the band.
  const rivets = coarse ? 0 : 42;
  const bandAngle = rimAngle - 0.128 / midR;
  const bandR = midR + BOWL.wall / 2 + 0.007;
  for (let i = 0; i < rivets; i++) {
    const th = ((i + 0.5) / rivets) * Math.PI * 2;
    const normal = new THREE.Vector3(Math.sin(bandAngle) * Math.cos(th), -Math.cos(bandAngle), Math.sin(bandAngle) * Math.sin(th));
    const head = new THREE.IcosahedronGeometry(0.0125, detail === 0 ? 1 : 0);
    head.scale(1, 0.55, 1);
    q.setFromUnitVectors(up, normal);
    m.compose(new THREE.Vector3(Math.cos(th) * bandR * Math.sin(bandAngle), BOWL.centreY - bandR * Math.cos(bandAngle), Math.sin(th) * bandR * Math.sin(bandAngle)), q, one);
    head.applyMatrix4(m);
    fitting(head);
  }

  // Ring handles below the band, in the gaps between the stones: a staple forged onto the
  // skin (its feet one above the other) and a ring hanging through it, door-knocker fashion.
  const stapleAngle = rimAngle - 0.215 / midR;
  const sa = Math.sin(stapleAngle), ca = Math.cos(stapleAngle);
  const ringTilt = [0.16, -0.10, 0.22];
  for (let i = 0; i < 3; i++) {
    const th = (100 + i * 120) * Math.PI / 180;
    const out = new THREE.Vector3(Math.cos(th), 0, Math.sin(th));
    const tangent = new THREE.Vector3(-Math.sin(th), 0, Math.cos(th));
    const skinNormal = new THREE.Vector3(out.x * sa, -ca, out.z * sa);
    const meridian = new THREE.Vector3(out.x * ca, sa, out.z * ca);     // along the skin, toward the rim
    const foot = new THREE.Vector3(out.x * BOWL.outerR * sa, BOWL.centreY - BOWL.outerR * ca, out.z * BOWL.outerR * sa);

    if (!coarse) {
      const staple = detail === 0 ? new THREE.TorusGeometry(0.030, 0.0105, 8, 14, Math.PI)   // half ring in xy, bulging to +y
        : new THREE.TorusGeometry(0.030, 0.0105, 5, 8, Math.PI);
      staple.applyMatrix4(new THREE.Matrix4().makeBasis(meridian, skinNormal, new THREE.Vector3().crossVectors(meridian, skinNormal)));
      staple.translate(foot.x, foot.y, foot.z);
      fitting(staple);
    }

    const ring = new THREE.TorusGeometry(0.085, 0.0115, [9, 6, 4][detail], [32, 20, 12][detail]);
    ring.translate(0, -0.085, 0);                                          // hang it from its top point
    ring.rotateX(ringTilt[i]);                                             // not quite plumb
    ring.applyMatrix4(new THREE.Matrix4().makeBasis(tangent, up, new THREE.Vector3().crossVectors(tangent, up)));
    ring.translate(foot.x + skinNormal.x * 0.019, foot.y + skinNormal.y * 0.019 + 0.0115, foot.z + skinNormal.z * 0.019);
    fitting(ring);
  }
  return mergeGeometries(parts);
}

const BOWL_VERT = /* glsl */ `
attribute vec2 aBowl;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vBowl;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vBowl = aBowl;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const BOWL_FRAG = /* glsl */ `
${FRAG_PRELUDE}
${FIRE_GLSL}
${SOLID_GLSL}
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vBowl;

void main() {
  vec3 lp = vWorldPos - uFireOrigin;
  float r = length(lp.xz);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float side = vBowl.x;                                     // +1 outer skin, 0 top of the rim, -1 inner skin
  float fitting = vBowl.y;                                  // 1 on rivets and ring handles
  float inner = 1.0 - smoothstep(-0.3, 0.2, side);
  float bead = (1.0 - smoothstep(0.55, 1.0, abs(side))) * (1.0 - fitting);
  float px = length(fwidth(lp));                            // footprint of a pixel on the surface, metres

  // Hammer marks: every cell of a cellular field is one shallow blow of the hammer.
  float cell = worley(lp * 15.0);
  float dish = smoothstep(0.0, 0.62, cell);
  vec4 n0 = noiseTex(lp * 0.55 + 0.27);                     // patches: where rust and soot gather
  vec4 n1 = noiseTex(lp * 3.1 + 0.61);                      // streaks and scale
  vec4 n2 = noiseTex(lp * 21.0);                            // grain of the metal
  float low = n0.r, mid = n1.r, fine = n2.r;
  float height = (dish * 0.0034 * (1.0 - fitting)) / (1.0 + sq(px * 30.0)) + (mid - 0.5) * 0.0022 + (n1.b - 0.5) * 0.0010
               + (fine - 0.5) * 0.0006;
  vec3 N = bumpNormal(vWorldPos, normalize(vNormal), height);

  // Layers, bottom to top: bright worn iron, black forge scale, rust, soot, ash.
  vec3 base = vec3(0.34, 0.33, 0.32);
  float metal = 1.0;
  float rough = 0.34 + 0.22 * mid;

  // (the rolled rim is rubbed bright all the way round: it is what catches the moon)
  float worn = smoothstep(0.80, 1.0, dish) * smoothstep(0.50, 0.66, mid) * 0.7 + bead * (0.45 + 0.50 * smoothstep(0.30, 0.6, n1.b)) + fitting * 0.45;
  float scale = 1.0 - saturate(worn);
  base = mix(base, vec3(0.030, 0.028, 0.028), scale);
  metal = mix(metal, 0.25, scale);
  rough = mix(rough, 0.60 + 0.25 * fine, scale);

  // Rust gathers low on the outside, where rain and splashes sit.
  float lowDown = 1.0 - smoothstep(0.34, 0.72, lp.y);
  float rust = smoothstep(0.46, 0.64, low * 0.75 + lowDown * 0.30 + (mid - 0.5) * 0.30) * (1.0 - inner) * (1.0 - bead * 0.6);
  base = mix(base, mix(vec3(0.085, 0.030, 0.014), vec3(0.20, 0.085, 0.035), fine), rust);
  metal *= 1.0 - rust;
  rough = mix(rough, 0.92, rust);

  // Soot: the whole inside, and tongues of it licking over the rim and down the outside.
  float lick = lp.y + (mid - 0.5) * 0.20 + (low - 0.5) * 0.30;
  float soot = max(inner * 0.96, smoothstep(0.585, 0.74, lick) * 0.92);
  soot *= 1.0 - bead * (0.55 + 0.40 * smoothstep(0.4, 0.7, mid));
  base = mix(base, vec3(0.012, 0.011, 0.010), soot);
  metal *= 1.0 - soot;
  rough = mix(rough, 0.94, soot);

  // Pale wood ash on the inside: blown up the wall in streaks that run from the coals to
  // the rim, and dusted thickly just above the bed.
  vec2 spoke = lp.xz / max(r, 1e-3);
  vec4 streak = noiseTex(vec3(spoke * 0.5, r * 0.3) + 0.19);
  float above = lp.y - coalY(r);                            // height above the edge of the coal bed
  float ash = inner * saturate(smoothstep(0.52, 0.76, streak.b * 0.5 + streak.r * 0.3 + mid * 0.3) * (0.50 - 0.34 * smoothstep(0.04, 0.36, above))
                             + (1.0 - smoothstep(0.0, 0.15, above + (mid - 0.5) * 0.10)) * 0.65);
  base = mix(base, vec3(0.086, 0.078, 0.070) * (0.6 + 0.8 * fine), ash);
  rough = mix(rough, 1.0, ash);

  Surface s;
  s.P = vWorldPos; s.N = N; s.V = V;
  s.base = base; s.metal = metal; s.rough = rough;
  // Inside, the far wall shadows the near one: the ray toward the moon has to leave through the mouth.
  vec2 exitPoint = lp.xz + uMoonDir.xz * (max(RIM_Y - lp.y, 0.0) / max(uMoonDir.y, 0.05));
  float mouth = 1.0 - smoothstep(RIM_R - 0.12, RIM_R - 0.03, length(exitPoint));
  s.moonVis = mix(1.0, mouth, inner);
  s.ao = mix(1.0, 0.55 + 0.45 * smoothstep(0.45, 0.75, lp.y), inner) * (0.70 + 0.30 * dish);
  s.fireVis = 1.0;
  s.inside = inner;
  vec3 col = shadeSolid(s);

  // Where the coals lie against the plate the iron itself glows a dull cherry red, and
  // under the heart of the fire a trace of that heat shows through on the outside.
  float touch = inner * (1.0 - smoothstep(0.0, 0.26, above + (mid - 0.5) * 0.10));
  float through = (1.0 - inner) * (1.0 - fitting) * (1.0 - smoothstep(0.1, 0.75, r + (mid - 0.5) * 0.3));
  col += (blackbody(960.0 + 180.0 * touch) * (touch * touch * touch * 1.5 * (0.75 + 0.5 * fine))
        + blackbody(1000.0) * (through * through * 0.10 * (0.7 + 0.6 * fine))) * uFireState.w;

  gl_FragColor = vec4(col, 1.0);
}
`;

// ------------------------------------------------------------------------------- stones

/**
 * A piece of fractured basalt, built from a dense box in three moves:
 *  1. its vertices are pressed back onto cutting planes: the faces of a rough prism (basalt
 *     columns have five or six sides, never regular), a broken top, chips off the edges;
 *  2. the surface is split into fracture faces: each cell of a cellular noise gets its own
 *     small offset and tilt, so neighbouring cells meet in steps and ledges;
 *  3. a little roughness on top.
 * The mesh stays watertight. Returns an indexed geometry in the block's own frame.
 */
function buildRock(rng, noise, { radius, height, sides, segments, chips, facet, roughness }) {
  let g = new THREE.BoxGeometry(radius * 2.3, height, radius * 2.3, segments[0], segments[1], segments[0]);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  const pos = g.attributes.position;
  const count = pos.count;
  const pts = [];
  for (let i = 0; i < count; i++) pts.push(new THREE.Vector3().fromBufferAttribute(pos, i));

  const planes = [];
  const turn = rng() * Math.PI * 2;
  for (let i = 0; i < sides; i++) {
    const a = turn + ((i + (rng() - 0.5) * 0.6) / sides) * Math.PI * 2;
    const n = new THREE.Vector3(Math.cos(a), (rng() - 0.5) * 0.22, Math.sin(a)).normalize();
    planes.push({ n, d: radius * (0.76 + 0.24 * rng()) });
  }
  // A broken top: two planes that meet in a ridge somewhere across it.
  const ta = rng() * Math.PI * 2;
  planes.push({ n: new THREE.Vector3(Math.cos(ta) * 0.16, 1, Math.sin(ta) * 0.16).normalize(), d: height * 0.5 * 0.97 });
  planes.push({ n: new THREE.Vector3(-Math.cos(ta) * 0.5, 1, -Math.sin(ta) * 0.5 + 0.12).normalize(), d: height * 0.5 * (0.74 + 0.16 * rng()) });
  const cut = () => {
    for (const p of pts) {
      for (const pl of planes) {
        const e = p.dot(pl.n) - pl.d;
        if (e > 0) p.addScaledVector(pl.n, -e);
      }
    }
  };
  cut();
  // Chips: planes that take a slice off whatever currently sticks out furthest their way.
  // The first few are heavy blows, the rest nibble at the edges.
  for (let i = 0; i < chips; i++) {
    const a = rng() * Math.PI * 2;
    const n = new THREE.Vector3(Math.cos(a), rng() < 0.7 ? 0.25 + rng() * 1.1 : -(rng() * 0.5), Math.sin(a)).normalize();
    let reach = -Infinity;
    for (const p of pts) reach = Math.max(reach, p.dot(n));
    planes.push({ n, d: reach * (i < 3 ? 0.72 + 0.10 * rng() : 0.85 + 0.12 * rng()) });
  }
  cut();
  cut();

  const off = [rng() * 40, rng() * 40, rng() * 40];
  const radial = new THREE.Vector3();
  const c = { dx: 0, dy: 0, dz: 0, a: 0, b: 0, c: 0 };
  const f = 1 / facet;
  for (let i = 0; i < count; i++) {
    const p = pts[i];
    radial.set(p.x / radius, p.y / (height * 0.5) * 0.6, p.z / radius).normalize();
    const x = p.x + off[0], y = p.y + off[1], z = p.z + off[2];
    noise.cell(x * f, y * f, z * f, c);
    const fracture = c.a * 0.5 + (c.dx * c.b + c.dy * c.c + c.dz * c.a) * 0.9;
    const rough = noise.fbm(x * 3.1, y * 3.1, z * 3.1, 4) * 0.022 + (noise.ridged(x * 11.0, y * 11.0, z * 11.0, 3) - 0.5) * 0.012;
    p.addScaledVector(radial, (fracture * facet * 0.24 + rough) * roughness);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  return g;
}

/**
 * Un-indexes a mesh and gives every corner the area-weighted average normal of those faces
 * around its vertex that lie within the crease angle of the corner's own face: flat faces
 * stay flat, the edges between them stay hard. (Same result as three's toCreasedNormals,
 * but it walks the index instead of hashing positions, which is many times faster.)
 */
function creaseNormals(geometry, creaseAngle) {
  const pos = geometry.attributes.position.array;
  const index = geometry.index.array;
  const vertexCount = pos.length / 3;
  const faceCount = index.length / 3;
  // Unit normal and area of every face.
  const normal = new Float32Array(faceCount * 3);
  const area = new Float32Array(faceCount);
  for (let f = 0; f < faceCount; f++) {
    const a = index[f * 3] * 3, b = index[f * 3 + 1] * 3, c = index[f * 3 + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    area[f] = len;
    if (len > 1e-12) { normal[f * 3] = nx / len; normal[f * 3 + 1] = ny / len; normal[f * 3 + 2] = nz / len; }
  }
  // Faces around each vertex, as one packed list with an offset table.
  const start = new Uint32Array(vertexCount + 1);
  for (let i = 0; i < index.length; i++) start[index[i] + 1]++;
  for (let i = 0; i < vertexCount; i++) start[i + 1] += start[i];
  const cursor = start.slice(0, vertexCount);
  const around = new Uint32Array(index.length);
  for (let f = 0; f < faceCount; f++) for (let k = 0; k < 3; k++) around[cursor[index[f * 3 + k]]++] = f;

  const outPosition = new Float32Array(index.length * 3);
  const outNormal = new Float32Array(index.length * 3);
  const cosCrease = Math.cos(creaseAngle);
  for (let f = 0; f < faceCount; f++) {
    const nx = normal[f * 3], ny = normal[f * 3 + 1], nz = normal[f * 3 + 2];
    for (let k = 0; k < 3; k++) {
      const v = index[f * 3 + k];
      let sx = 0, sy = 0, sz = 0;
      for (let i = start[v]; i < start[v + 1]; i++) {
        const g = around[i];
        const gx = normal[g * 3], gy = normal[g * 3 + 1], gz = normal[g * 3 + 2];
        if (gx * nx + gy * ny + gz * nz >= cosCrease) { sx += gx * area[g]; sy += gy * area[g]; sz += gz * area[g]; }
      }
      const len = Math.hypot(sx, sy, sz);
      const o = (f * 3 + k) * 3;
      outPosition[o] = pos[v * 3]; outPosition[o + 1] = pos[v * 3 + 1]; outPosition[o + 2] = pos[v * 3 + 2];
      if (len > 1e-12) { outNormal[o] = sx / len; outNormal[o + 1] = sy / len; outNormal[o + 2] = sz / len; } else outNormal[o + 1] = 1;
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(outPosition, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(outNormal, 3));
  return out;
}

/**
 * The bearing blocks and the rubble. detail: 0 for the close view; 1 and 2 are the same
 * stones (the same random numbers) from ever coarser grids, 2 being what the reflection and
 * the shadow map are drawn from.
 */
function buildStonesGeometry(ctx, detail) {
  const rng = ctx.rng(4107);
  const noise = createNoise(77);
  const parts = [];
  const v = new THREE.Vector3();
  // Seat a rock under the bowl and in the water, then give it hard edges.
  const finish = (g) => {
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const r = Math.hypot(v.x, v.z);
      // Any vertex that would poke through the bowl's skin is pressed down onto it, as if
      // the stone had been dressed to take the bowl.
      if (r < BOWL.rimR + 0.012) v.y = Math.min(v.y, bowlOuterY(Math.min(r, BOWL.rimR)) - 0.008);
      pos.setY(i, Math.max(v.y, -0.06));
    }
    parts.push(creaseNormals(g, 0.5));
  };

  // Three bearing blocks: stout lengths of columnar basalt, each a little different.
  const blocks = [
    { angle: 38, radius: 0.44, height: 0.82, sides: 6, at: 1.03, lean: 0.06 },
    { angle: 162, radius: 0.41, height: 0.86, sides: 5, at: 1.00, lean: -0.08 },
    { angle: 281, radius: 0.47, height: 0.80, sides: 6, at: 1.05, lean: 0.05 },
  ];
  for (const b of blocks) {
    const g = buildRock(rng, noise, { radius: b.radius, height: b.height, sides: b.sides, segments: [[30, 24], [20, 16], [14, 11]][detail], chips: 14, facet: 0.19, roughness: 1 });
    const th = b.angle * Math.PI / 180;
    g.rotateZ(b.lean);
    g.rotateY(-th);
    g.translate(Math.cos(th) * b.at, b.height / 2 - 0.10, Math.sin(th) * b.at);
    finish(g);
  }

  // Rubble: spalled chips and cobbles lying in the film around the blocks.
  for (let i = 0; i < 34; i++) {
    const big = rng() < 0.3;
    const radius = big ? 0.13 + rng() * 0.10 : 0.045 + rng() * 0.06;
    const height = radius * (0.7 + rng() * 0.9);
    const g = buildRock(rng, noise, { radius, height, sides: 4 + Math.floor(rng() * 3), segments: [[9, 7], [6, 5], [4, 3]][detail], chips: 7, facet: radius * 0.8, roughness: Math.min(1, radius * 6) });
    // Most of it hugs the blocks, a few pieces have rolled further out.
    const near = blocks[i % 3];
    const a = near.angle * Math.PI / 180 + (rng() - 0.5) * 1.5;
    const r = rng() < 0.75 ? 1.30 + rng() * 0.70 : 0.30 + rng() * 2.7;
    g.rotateZ((rng() - 0.5) * 0.9);
    g.rotateX((rng() - 0.5) * 0.9);
    g.rotateY(rng() * Math.PI * 2);
    g.translate(Math.cos(a) * r, height * (0.16 - rng() * 0.2), Math.sin(a) * r);
    finish(g);
  }
  return mergeGeometries(parts);
}

const STONE_FRAG = /* glsl */ `
${FRAG_PRELUDE}
${FIRE_GLSL}
${SOLID_GLSL}
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vec3 lp = vWorldPos - uFireOrigin;
  float r = length(lp.xz);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 N0 = normalize(vNormal);

  // Three octave bands of the baked noise (mip-mapped, so distant stone does not sparkle).
  // r/b: soft noise at two scales, g/a: cellular.
  vec4 n0 = noiseTex(lp * 0.41 + 0.11);       // blotches, about half a metre
  vec4 n1 = noiseTex(lp * 2.3 + 0.43);        // lumps and grain, 10 cm and 3 cm
  vec4 n2 = noiseTex(lp * 11.0);              // crystals and pits, 2 cm and finer

  // Gas bubbles frozen into the lava: pits, gathered in drifts.
  float pit = smoothstep(0.60, 0.78, n2.a) * smoothstep(0.46, 0.60, n1.r);
  float height = (n0.b - 0.5) * 0.016 + (n1.r - 0.5) * 0.012 + (n1.b - 0.5) * 0.0045
               + (n2.r - 0.5) * 0.0016 + (n2.b - 0.5) * 0.0007 - pit * 0.0028;
  vec3 N = bumpNormal(vWorldPos, N0, height);

  // Basalt: near black where freshly broken, greyer where it has weathered, with rusty
  // stains seeping from its iron and the odd pale crystal.
  float weathered = smoothstep(0.38, 0.66, n0.r * 0.55 + n1.r * 0.5);
  vec3 base = mix(vec3(0.040, 0.041, 0.046), vec3(0.118, 0.112, 0.105), weathered);
  base *= 0.72 + 0.56 * n2.r;
  base = mix(base, base * vec3(1.45, 0.95, 0.62), smoothstep(0.56, 0.72, n0.b) * 0.45);
  base += vec3(0.06, 0.06, 0.055) * smoothstep(0.74, 0.82, n2.b) * weathered;
  base *= 1.0 - 0.65 * pit;
  float rough = 0.74 + 0.2 * n1.b;

  // Soot and heat under the bowl.
  float gap = bowlOuterY(min(r, RIM_R)) - lp.y;
  float under = 1.0 - smoothstep(RIM_R - 0.02, RIM_R + 0.22, r);
  float scorch = smoothstep(0.22, 0.60, lp.y + (n1.r - 0.5) * 0.3) * (1.0 - smoothstep(RIM_R - 0.1, RIM_R + 0.45, r));
  base = mix(base, vec3(0.016, 0.015, 0.014), scorch * 0.8);

  // The waterline: capillary wetting creeps up the stone, darkens it and makes it shine;
  // above it a green-black band of algae, and a pale tide mark where the water dries.
  float line = 0.05 + 0.16 * n0.b + 0.035 * n1.r;
  float above = lp.y - line;
  float wet = 1.0 - smoothstep(-0.01, 0.045, above);
  float damp = 1.0 - smoothstep(0.0, 0.22, above);
  base = mix(base, vec3(0.016, 0.024, 0.014), damp * 0.5 * smoothstep(0.42, 0.62, n1.r));
  base *= mix(1.0, 0.32, wet) * mix(1.0, 0.72, damp);
  base += vec3(0.050, 0.048, 0.043) * exp(-sq((above - 0.02) / 0.013)) * smoothstep(0.40, 0.60, n1.b);
  rough = mix(rough, 0.10 + 0.18 * n2.r, wet);
  // A film of water rounds the fine relief off.
  N = normalize(mix(N, N0, wet * 0.7));

  Surface s;
  s.P = vWorldPos; s.N = N; s.V = V;
  s.base = base; s.metal = 0.0; s.rough = rough;
  float crevice = 0.62 + 0.38 * smoothstep(0.34, 0.60, n1.r);
  s.ao = crevice * mix(1.0, 0.25 + 0.75 * smoothstep(0.0, 0.38, gap), under) * (0.70 + 0.30 * smoothstep(-0.02, 0.16, lp.y));
  s.moonVis = bowlMoonShadow(lp);
  s.fireVis = 1.0;
  s.inside = 0.0;
  gl_FragColor = vec4(shadeSolid(s), 1.0);
}
`;

// ------------------------------------------------------------------------------- shadow on the film

// The ground shader lights the stone bed with the fire as a bare point light and knows
// nothing of the bowl standing over it, which leaves the brightest patch of floor exactly
// where the bowl's shadow should be. This decal lies on the film and multiplies the floor
// by the fraction of its diffuse light that really arrives: the flame is hidden behind the
// rim from close in (the same horizon the stones use), and the bowl shades the moon.
// At grazing angles the film is a mirror and the decal fades out with the same Fresnel term.
// It is drawn with the opaque stage (as a blended surface, so after the ground), which keeps
// it underneath the flame, the sparks and everything else that is composited later; in the
// main view only, because the reflection never shows the floor.
const SHADOW_FRAG = /* glsl */ `
${FRAG_PRELUDE}
${FIRE_GLSL}
${SOLID_GLSL}
varying vec3 vWorldPos;
void main() {
  vec3 lp = vWorldPos - uFireOrigin;
  float top = 1.2 + 2.6 * uFireState.x;
  float seen = saturate((top - max(1.0, flameHorizon(vec3(lp.x, 0.0, lp.z)))) / (top - 1.0));
  float moonVis = bowlMoonShadow(vec3(lp.x, 0.0, lp.z));

  // The diffuse terms of the ground shader, so only the blocked share is removed.
  vec3 sky = skyAmbient(vec3(0.0, 1.0, 0.0)) * 1.4;
  vec3 moon = uMoonColor * 0.75 * max(uMoonDir.y, 0.0);
  vec3 toFire = uFireLightPos - vec3(vWorldPos.x, 0.0, vWorldPos.z);
  float fd2 = dot(toFire, toFire);
  vec3 fire = uFireLightColor * max(toFire.y, 0.0) / (sqrt(fd2) * (fd2 + 1.0)) * 1.3;
  // Under the bowl the sky is half hidden too.
  float open = mix(0.45, 1.0, smoothstep(RIM_R * 0.6, RIM_R * 1.5, length(lp.xz)));
  vec3 keep = (sky * open + moon * moonVis + fire * seen) / (sky + moon + fire);

  vec3 V = normalize(cameraPosition - vWorldPos);
  float mirror = 0.05 + 0.95 * pow(1.0 - saturate(V.y), 4.2);
  gl_FragColor = vec4(mix(keep, vec3(1.0), mirror), 1.0);
}
`;

function createFloorShadow(ctx, fireUniforms) {
  const geometry = new THREE.CircleGeometry(5.4, 48);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fireUniforms },
    vertexShader: WORLD_VERT,
    fragmentShader: SHADOW_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.SrcColorFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0.004;
  mesh.name = 'floor-shadow';
  mesh.layers.set(ctx.LAYERS.MAIN_ONLY);
  return mesh;
}

/**
 * Builds the bowl, the stones and the bowl's shadow on the floor. Returns { group,
 * floorShadow, setDetail }; setDetail(detail) chooses what the main view draws.
 */
export function createVessel(ctx, fireUniforms) {
  const group = new THREE.Group();
  group.name = 'vessel';
  const { MAIN_ONLY, MIRROR_ONLY } = ctx.LAYERS;

  // Each solid at three levels of detail. The main view draws the one whose triangles are
  // about a pixel or two across from where the eye is; the coarsest is also what the
  // reflection (half size, rippled) and the shadow map (soft) are drawn from.
  const solids = [];
  const add = (name, material, build) => {
    const geometries = [0, 1, 2].map(build);
    const mesh = (geometry, layer, suffix) => {
      const m = new THREE.Mesh(geometry, material);
      m.name = name + suffix;
      // All of them may cast: the shadow map is drawn with whatever the first pass of the
      // frame can see, which is the mirror's stand-in (or, with the reflection switched
      // off, the main view's own mesh).
      m.castShadow = true;
      m.layers.set(layer);
      group.add(m);
      return m;
    };
    solids.push(geometries.map((geometry, detail) => mesh(geometry, MAIN_ONLY, detail === 0 ? '' : `-${detail}`)));
    mesh(geometries[2], MIRROR_ONLY, '-mirror');
  };
  add('bowl', new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fireUniforms },
    vertexShader: BOWL_VERT,
    fragmentShader: BOWL_FRAG,
  }), buildBowlGeometry);
  add('stones', new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fireUniforms },
    vertexShader: SOLID_VERT,
    fragmentShader: STONE_FRAG,
  }), (detail) => buildStonesGeometry(ctx, detail));

  const floorShadow = createFloorShadow(ctx, fireUniforms);
  group.add(floorShadow);

  /** detail: 0 (the eye is close), 1 or 2 (far). */
  const setDetail = (detail) => {
    for (const levels of solids) for (let i = 0; i < levels.length; i++) levels[i].visible = i === detail;
  };
  setDetail(1);

  return { group, floorShadow, setDetail };
}
