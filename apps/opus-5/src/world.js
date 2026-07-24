import * as THREE from 'three';
import { NOISE } from './glsl/noise.js';

/**
 * The stage the elements stand on: an obsidian floor, a rune circle, a star
 * field and a very dark nebula so the background isn't a flat void.
 *
 * The floor's reflections are real, not a fake gradient — each fragment mirrors
 * its view ray about the ground plane and does a soft sphere intersection
 * against every element. Four ray/sphere tests per pixel buys proper
 * perspective-correct reflections without a second render pass.
 */

const STAR_COUNT = 2600;

const floorVert = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const floorFrag = /* glsl */ `
precision highp float;

#define N_ELEM 4

uniform float uTime;
uniform vec3 uPos[N_ELEM];
uniform vec3 uCol[N_ELEM];
uniform float uRad[N_ELEM];
uniform float uPower[N_ELEM];
uniform float uPulse[N_ELEM];   // live intensity, e.g. the fire's flicker
uniform float uRingRadius;
uniform float uFade;

varying vec3 vWorld;

${NOISE}

void main() {
  vec3 P = vWorld;
  vec3 Vd = normalize(P - cameraPosition);
  vec3 R = vec3(Vd.x, -Vd.y, Vd.z);   // mirror about the ground plane

  float ndv = clamp(-Vd.y, 0.0, 1.0);
  float fres = 0.035 + 0.965 * pow(1.0 - ndv, 4.5);

  // Polished-but-imperfect stone: the mottling widens the reflection blobs.
  float grain = fbm4(vec3(P.xz * 0.55, 0.0)) * 0.5 + 0.5;
  float rough = 0.35 + 0.45 * grain;

  vec3 col = vec3(0.006, 0.008, 0.014);

  // Faint concentric survey rings + radial spokes.
  float rc = length(P.xz);
  float rings = smoothstep(0.985, 1.0, abs(sin(rc * 1.15))) * 0.05;
  float spokes = smoothstep(0.995, 1.0, abs(sin(atan(P.z, P.x) * 12.0))) * 0.025;
  col += vec3(0.30, 0.45, 0.75) * (rings + spokes) * (1.0 - smoothstep(6.0, 24.0, rc));

  // The great circle the four elements sit on.
  float band = 1.0 - smoothstep(0.0, 0.10, abs(rc - uRingRadius));
  float dash = step(0.35, fract(atan(P.z, P.x) * 9.0 + uTime * 0.04));
  col += vec3(0.35, 0.55, 0.85) * band * (0.25 + 0.75 * dash) * 0.30;

  float inner = 1.0 - smoothstep(0.0, 0.06, abs(rc - uRingRadius * 0.34));
  col += vec3(0.30, 0.48, 0.80) * inner * 0.22;

  for (int i = 0; i < N_ELEM; i++) {
    vec3 C = uPos[i];
    float rr = uRad[i];
    vec3 tint = uCol[i] * uPower[i];

    // --- pooled light on the stone. Only the pool tracks the live pulse: a
    // flickering rune ring reads as a rendering glitch, but firelight that
    // doesn't dance on the floor reads as a decal.
    float d = length(P - C);
    float pool = rr * rr * 1.9 / (d * d + 0.6);
    col += tint * pool * 0.075 * uPulse[i];

    // --- rune circle directly beneath the element
    float dxz = length(P.xz - C.xz);
    float ring = 1.0 - smoothstep(0.0, 0.055, abs(dxz - rr * 1.5));
    float rdash = step(0.42, fract(atan(P.z - C.z, P.x - C.x) * 7.0 - uTime * 0.25));
    col += tint * ring * (0.3 + 0.7 * rdash) * 0.30;

    float ring2 = 1.0 - smoothstep(0.0, 0.03, abs(dxz - rr * 1.85));
    col += tint * ring2 * 0.10;

    // --- true mirror image, softened by the local roughness
    vec3 oc = C - P;
    float tca = dot(oc, R);
    if (tca > 0.0) {
      float d2 = max(dot(oc, oc) - tca * tca, 0.0);
      float edge = sqrt(d2) - rr;
      float blur = 1.0 + rough * 2.4 + tca * 0.16;
      float blob = exp(-max(edge, 0.0) * (2.6 / blur));
      col += tint * blob * fres * 0.60 * uPulse[i];
    }
  }

  // Grain in the stone itself, then fall away to black at the horizon.
  col *= 0.72 + 0.5 * grain;
  col *= (1.0 - smoothstep(9.0, 34.0, rc)) * uFade;

  gl_FragColor = vec4(col, 1.0);
}
`;

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const skyFrag = /* glsl */ `
precision highp float;
uniform float uTime;
varying vec3 vDir;

${NOISE}

void main() {
  vec3 d = normalize(vDir);

  // Two very dark nebula layers drifting against each other.
  float n1 = fbm4(d * 1.6 + vec3(0.0, uTime * 0.006, 0.0)) * 0.5 + 0.5;
  float n2 = fbm3(d * 3.4 - vec3(uTime * 0.004, 0.0, 0.0)) * 0.5 + 0.5;

  float cloud = pow(clamp(n1 * 1.15 - 0.25, 0.0, 1.0), 2.2);
  float wisp = pow(clamp(n2 - 0.35, 0.0, 1.0), 2.6);

  vec3 col = vec3(0.010, 0.012, 0.024);
  col += vec3(0.055, 0.035, 0.115) * cloud;          // violet body
  col += vec3(0.020, 0.070, 0.105) * wisp * 0.8;     // teal wisps
  col += vec3(0.09, 0.045, 0.02) * pow(clamp(d.y * -1.0, 0.0, 1.0), 2.0) * 0.35;

  // Lift toward the zenith so the dome doesn't read as a solid black lid.
  col += vec3(0.012, 0.016, 0.030) * smoothstep(-0.2, 1.0, d.y);

  gl_FragColor = vec4(col, 1.0);
}
`;

const starVert = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
varying float vTwinkle;
varying vec3 vColor;

void main() {
  vColor = aColor;
  vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * (1.0 + 0.35 * vTwinkle);
}
`;

const starFrag = /* glsl */ `
precision highp float;
varying float vTwinkle;
varying vec3 vColor;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = (1.0 - smoothstep(0.0, 0.5, d));
  gl_FragColor = vec4(vColor * (0.4 + 1.6 * pow(core, 2.5)), core * vTwinkle * 0.85);
}
`;

export function createWorld({ elements, ringRadius, floorY }) {
  const group = new THREE.Group();

  // ---- floor -----------------------------------------------------------
  const floorUniforms = {
    uTime: { value: 0 },
    uPos: { value: elements.map(() => new THREE.Vector3()) },
    uCol: { value: elements.map((e) => e.color.clone()) },
    // An element whose visible body is much narrower than its bounding volume
    // (the fire is a column inside a big sphere) gives a floorRadius instead.
    uRad: { value: elements.map((e) => e.floorRadius ?? e.radius) },
    uPower: { value: elements.map(() => 1) },
    uPulse: { value: elements.map(() => 1) },
    uRingRadius: { value: ringRadius },
    uFade: { value: 1 },
  };

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(40, 96),
    new THREE.ShaderMaterial({
      uniforms: floorUniforms,
      vertexShader: floorVert,
      fragmentShader: floorFrag,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  group.add(floor);

  // ---- nebula dome -----------------------------------------------------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 24),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  group.add(sky);

  // ---- stars -----------------------------------------------------------
  const sg = new THREE.BufferGeometry();
  const pos = new Float32Array(STAR_COUNT * 3);
  const size = new Float32Array(STAR_COUNT);
  const phase = new Float32Array(STAR_COUNT);
  const color = new Float32Array(STAR_COUNT * 3);

  const warm = new THREE.Color(0xffd9b0);
  const cool = new THREE.Color(0xaecbff);
  const tmp = new THREE.Color();

  for (let i = 0; i < STAR_COUNT; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 60 + Math.random() * 45;
    pos[i * 3 + 0] = s * Math.cos(th) * r;
    pos[i * 3 + 1] = u * r * 0.75 + 12;
    pos[i * 3 + 2] = s * Math.sin(th) * r;

    size[i] = 0.7 + Math.pow(Math.random(), 3) * 3.2;
    phase[i] = Math.random();

    tmp.copy(Math.random() > 0.7 ? warm : cool).lerp(new THREE.Color(0xffffff), Math.random() * 0.6);
    color[i * 3 + 0] = tmp.r;
    color[i * 3 + 1] = tmp.g;
    color[i * 3 + 2] = tmp.b;
  }

  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  sg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  sg.setAttribute('aColor', new THREE.BufferAttribute(color, 3));

  const starMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: starVert,
    fragmentShader: starFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(sg, starMat);
  stars.frustumCulled = false;
  group.add(stars);

  const worldPos = new THREE.Vector3();

  return {
    group,
    floor,

    update(t) {
      floorUniforms.uTime.value = t;
      sky.material.uniforms.uTime.value = t;
      starMat.uniforms.uTime.value = t;
      stars.rotation.y = t * 0.004;

      for (let i = 0; i < elements.length; i++) {
        elements[i].group.getWorldPosition(worldPos);
        floorUniforms.uPos.value[i].copy(worldPos);
        floorUniforms.uPulse.value[i] = elements[i].pulse ?? 1;
      }
    },

    /** Dim every element's contribution except the focused one. */
    setEmphasis(name) {
      for (let i = 0; i < elements.length; i++) {
        const on = name === 'all' || elements[i].name === name;
        floorUniforms.uPower.value[i] = on ? 1 : 0.25;
      }
    },

    setPixelRatio(pr) {
      starMat.uniforms.uPixelRatio.value = pr;
    },

    starCount: STAR_COUNT,
  };
}
