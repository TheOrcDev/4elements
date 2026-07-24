import * as THREE from 'three';
import { NOISE } from '../glsl/noise.js';

/**
 * WATER — displaced sphere with genuine environment reflection + refraction.
 *
 * A CubeCamera parked at the sphere's centre re-renders the surroundings each
 * few frames, so the fire, the earth and the floor are actually mirrored in the
 * surface and bent through it. Analytic sky gradients can fake the highlights
 * but never the sense that the water belongs to the scene.
 *
 * The surface itself is a sum of travelling ripples and two fbm octaves,
 * evaluated three times per vertex so the normal comes from the real displaced
 * geometry instead of a texture.
 */

const SPRAY_COUNT = 900;

const waterVert = /* glsl */ `
uniform float uTime;
uniform float uRadius;
uniform float uAmp;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vDir;
varying float vHeight;

${NOISE}

// Signed height of the surface above the base sphere, in local units.
float wave(vec3 dir, float t) {
  float w = 0.0;
  // Long swell carries the silhouette; the travelling ripples give it motion.
  // Fine chop is kept low deliberately — push it up and the finite-difference
  // normals alias into a crumpled-foil look instead of a liquid one.
  w += 0.115 * fbm3(dir * 1.55 + vec3(0.0, t * 0.15, 0.0));
  w += 0.050 * sin(dot(dir, vec3(1.00, 0.35, 0.20)) *  7.5 - t * 2.10);
  w += 0.034 * sin(dot(dir, vec3(-0.40, 0.80, 0.50)) * 10.5 + t * 1.65);
  w += 0.020 * sin(dot(dir, vec3(0.30, -0.60, 0.90)) * 15.0 - t * 2.80);
  w += 0.016 * fbm3(dir * 4.20 + vec3(t * 0.26, 0.0, -t * 0.21));
  return w;
}

vec3 surface(vec3 dir, float t) {
  return dir * (uRadius + wave(dir, t) * uAmp);
}

void main() {
  vec3 dir = normalize(position);
  vDir = dir;

  vec3 p = surface(dir, uTime);
  vHeight = length(p) - uRadius;

  // Rebuild the normal from two neighbours on the displaced surface.
  vec3 tangent = normalize(cross(dir, abs(dir.y) > 0.94 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
  vec3 bitan = cross(dir, tangent);
  const float eps = 0.022;
  vec3 pa = surface(normalize(dir + tangent * eps), uTime);
  vec3 pb = surface(normalize(dir + bitan * eps), uTime);
  vec3 n = normalize(cross(pa - p, pb - p));
  if (dot(n, dir) < 0.0) n = -n;

  vNormal = normalize(mat3(modelMatrix) * n);

  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const waterFrag = /* glsl */ `
precision highp float;

uniform samplerCube uEnv;
uniform float uTime;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uFireDir;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vDir;
varying float vHeight;

${NOISE}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  float ndv = clamp(dot(N, V), 0.0, 1.0);

  // Schlick, water F0 = 0.02, with the grazing rim pushed hard.
  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);

  // --- reflection: sharp at grazing angles, blurred where we look straight in
  vec3 R = reflect(-V, N);
  vec3 reflCol = textureCubeLodEXT(uEnv, R, mix(2.6, 0.3, fres)).rgb;

  // --- refraction: what you see looking through the surface
  vec3 T = refract(-V, N, 1.0 / 1.333);
  vec3 refrCol = textureCubeLodEXT(uEnv, T, 1.8).rgb;

  // Beer-Lambert absorption: the flatter your view, the more water you look
  // through, the deeper the blue. Red dies first, which is what makes water
  // blue in the first place.
  float thickness = mix(2.8, 0.65, ndv);
  vec3 absorb = exp(-thickness * vec3(2.10, 0.60, 0.30));

  // What survives the crossing, plus the light scattered back out of the body.
  vec3 through = refrCol * absorb;
  vec3 scatter = uShallow * (1.0 - absorb) * 0.26 + uDeep * 0.85;
  vec3 inside = through + scatter;

  // --- subsurface: light bleeding through thin, lifted crests
  float lift = smoothstep(0.0, 0.13, vHeight);
  float back = pow(clamp(dot(V, -uKeyDir), 0.0, 1.0), 3.0);
  inside += uShallow * back * lift * 0.22;

  // --- caustic veins wandering under the surface
  float caus = fbm3(vDir * 4.2 + vec3(0.0, uTime * 0.22, 0.0));
  caus = pow(clamp(caus * 0.5 + 0.5, 0.0, 1.0), 6.0);
  inside += vec3(0.35, 0.72, 1.0) * caus * 0.14;

  vec3 col = mix(inside, reflCol, fres * 0.92);

  // --- specular: tight sun glint plus the warm bounce from the fire
  vec3 H = normalize(uKeyDir + V);
  col += uKeyColor * pow(clamp(dot(N, H), 0.0, 1.0), 420.0) * 2.0;
  vec3 Hf = normalize(uFireDir + V);
  col += vec3(1.0, 0.42, 0.14) * pow(clamp(dot(N, Hf), 0.0, 1.0), 120.0) * 0.55;

  // --- foam sparkle riding only the highest crests
  float crest = smoothstep(0.135, 0.215, vHeight);
  float sparkle = pow(clamp(fbm3(vDir * 18.0 + vec3(uTime * 0.5)), 0.0, 1.0), 6.0);
  col += vec3(0.82, 0.95, 1.0) * crest * sparkle * 0.45;

  // Rim light so the silhouette reads against the dark background.
  col += uShallow * pow(1.0 - ndv, 4.0) * 0.30;

  gl_FragColor = vec4(col, 1.0);
}
`;

const sprayVert = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uRadius;

attribute vec3 aAxis;
attribute float aPhase;
attribute float aSpeed;
attribute float aScale;

varying float vFade;

mat3 axisRot(vec3 axis, float a) {
  float s = sin(a), c = cos(a), t = 1.0 - c;
  vec3 x = axis;
  return mat3(
    t * x.x * x.x + c,       t * x.x * x.y - s * x.z, t * x.x * x.z + s * x.y,
    t * x.x * x.y + s * x.z, t * x.y * x.y + c,       t * x.y * x.z - s * x.x,
    t * x.x * x.z - s * x.y, t * x.y * x.z + s * x.x, t * x.z * x.z + c
  );
}

void main() {
  float life = fract(aPhase + uTime * aSpeed * 0.09);

  // Beads thrown off the surface, arcing out and falling back.
  float arc = sin(life * 3.14159);
  float r = uRadius * (1.02 + 0.34 * arc);

  vec3 p = normalize(position) * r;
  p = axisRot(normalize(aAxis), uTime * aSpeed * 0.35 + aPhase * 6.28) * p;

  vFade = arc;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (3.0 + 7.0 * aScale) * uPixelRatio * (12.0 / -mv.z);
}
`;

const sprayFrag = /* glsl */ `
precision highp float;
varying float vFade;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = (1.0 - smoothstep(0.05, 0.5, d));
  // Offset highlight sells it as a lit bead rather than a flat dot.
  float hi = pow((1.0 - smoothstep(0.0, 0.42, length(uv - vec2(-0.12, -0.13)))), 2.0);

  vec3 col = mix(vec3(0.32, 0.72, 1.0), vec3(0.92, 0.99, 1.0), hi);
  gl_FragColor = vec4(col * (0.45 + 0.9 * hi), core * vFade * 0.35);
}
`;

export function createWater({ radius = 1.5 } = {}) {
  const group = new THREE.Group();

  const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  });
  // Deliberately left unparented: CubeCamera.update() refreshes its own world
  // matrix only when it has no parent, which is exactly what we want since we
  // drive its position by hand before the main pass runs.
  const cubeCamera = new THREE.CubeCamera(0.2, 200, cubeRT);

  const uniforms = {
    uTime: { value: 0 },
    uRadius: { value: radius },
    uAmp: { value: 1.0 },
    uEnv: { value: cubeRT.texture },
    uShallow: { value: new THREE.Color(0x39d5ff) },
    uDeep: { value: new THREE.Color(0x02132e) },
    uKeyDir: { value: new THREE.Vector3(0.45, 0.82, 0.35).normalize() },
    uKeyColor: { value: new THREE.Color(0xdfefff) },
    uFireDir: { value: new THREE.Vector3(1, 0.1, 0).normalize() },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: waterVert,
    fragmentShader: waterFrag,
  });

  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 48), mat);
  body.frustumCulled = false;
  group.add(body);

  // ---- spray beads -----------------------------------------------------
  const sg = new THREE.BufferGeometry();
  const pos = new Float32Array(SPRAY_COUNT * 3);
  const axis = new Float32Array(SPRAY_COUNT * 3);
  const phase = new Float32Array(SPRAY_COUNT);
  const speed = new Float32Array(SPRAY_COUNT);
  const scale = new Float32Array(SPRAY_COUNT);

  for (let i = 0; i < SPRAY_COUNT; i++) {
    // Even-ish distribution over the sphere.
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3 + 0] = s * Math.cos(th);
    pos[i * 3 + 1] = u;
    pos[i * 3 + 2] = s * Math.sin(th);

    const a = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    axis[i * 3 + 0] = a.x;
    axis[i * 3 + 1] = a.y;
    axis[i * 3 + 2] = a.z;

    phase[i] = Math.random();
    speed[i] = 0.5 + Math.random() * 1.1;
    scale[i] = Math.random();
  }

  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aAxis', new THREE.BufferAttribute(axis, 3));
  sg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  sg.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  sg.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));

  const sprayMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRadius: { value: radius },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: sprayVert,
    fragmentShader: sprayFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const spray = new THREE.Points(sg, sprayMat);
  spray.frustumCulled = false;
  group.add(spray);

  let frame = 0;

  return {
    name: 'water',
    group,
    radius,
    color: new THREE.Color(0x2ec8ff),
    hitRadius: radius * 1.1,

    update(t) {
      uniforms.uTime.value = t;
      sprayMat.uniforms.uTime.value = t;
      body.rotation.y = t * 0.05;
    },

    /** Called by the render loop before the main pass. */
    updateEnvironment(renderer, scene) {
      // Every third frame is plenty — reflections of moving fire still read as
      // live, and we skip two thirds of six extra scene renders.
      if (frame++ % 3 !== 0) return;

      // Point sprites size themselves in device pixels, so on a 256px cube face
      // they cover roughly ten times the frame they do on the main canvas —
      // tens of thousands of additive sprites then stack to solid white, and
      // the refraction reads that white instead of the scene. Keep every
      // particle system out of the reflection; nobody misses dust motes in a
      // mirror image, and it makes the six extra renders cheaper too.
      const hidden = [];
      scene.traverse((o) => {
        if (o.isPoints && o.visible) {
          o.visible = false;
          hidden.push(o);
        }
      });
      body.visible = false;

      group.getWorldPosition(cubeCamera.position);
      cubeCamera.update(renderer, scene);

      body.visible = true;
      for (const o of hidden) o.visible = true;
    },

    setPixelRatio(pr) {
      sprayMat.uniforms.uPixelRatio.value = pr;
    },

    setFireDirection(v) {
      uniforms.uFireDir.value.copy(v).normalize();
    },

    particleCount: SPRAY_COUNT,
  };
}
