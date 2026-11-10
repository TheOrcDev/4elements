import * as THREE from 'three';
import { shared } from './shared.js';
import { LAYERS } from './layers.js';
import { VERT_PRELUDE } from './glsl/index.js';
import { GLSL_STARS } from './glsl/stars.glsl.js';

// The dusk sky: analytic gradient (shared skyColor), stars, the Milky Way, a moon
// and a thin deck of clouds catching the afterglow. Drawn as one full-screen triangle
// at the far plane, after all opaque geometry so only uncovered pixels are shaded.

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  gl_Position = vec4(position.xy, 1.0, 1.0);
  vec4 v = inverse(projectionMatrix) * vec4(position.xy, 1.0, 1.0);
  vDir = transpose(mat3(viewMatrix)) * (v.xyz / v.w);
}
`;

const FRAG = /* glsl */ `
${VERT_PRELUDE}
${GLSL_STARS}
uniform float uStars;
uniform float uClouds;
varying vec3 vDir;

// Every so often a meteor crosses the upper sky: a bright head with a short fading trail.
vec3 meteor(vec3 d) {
  const float slot = 19.0;
  float k = floor(uTime / slot);
  vec3 h = hash31(k * 1.37 + 5.0);
  float u = (uTime - k * slot - (2.0 + h.x * 12.0)) / 0.85;       // 0..1 over its short life
  if (u < 0.0 || u > 1.0) return vec3(0.0);
  float az = h.y * TAU, el = mix(0.38, 0.95, h.z);
  vec3 a = vec3(cos(az) * cos(el), sin(el), sin(az) * cos(el));
  vec3 dir = cross(a, normalize(vec3(sin(az * 3.0), 0.25, cos(az * 3.0))));
  dir = normalize(dir - vec3(0.0, 0.55, 0.0));
  dir = normalize(dir - a * dot(dir, a));
  vec3 head = normalize(a + dir * 0.26 * u);
  float along = dot(head - d, dir);                                 // > 0 behind the head
  vec3 nearest = normalize(head - dir * clamp(along, 0.0, 0.085));
  float dist = length(d - nearest);
  float px = length(fwidth(d));
  float core = smoothstep(px * 1.6, 0.0, dist);
  float trail = exp(-max(along, 0.0) * 34.0);
  return vec3(0.86, 0.93, 1.0) * core * trail * sin(u * PI) * 7.0;
}

// moonShine: how strongly the moon stands behind this part of the deck (0 away from it).
vec4 cloudDeck(vec3 d, float moonShine) {
  if (d.y < 0.004) return vec4(0.0);
  vec2 uv = d.xz / (d.y + 0.16);
  uv = rot2(0.6) * uv;
  // The deck drifts in real time: a bank needs many minutes to cross the frame.
  uv = uv * vec2(0.22, 0.62) + vec2(uTime * 0.0012, uTime * 0.0004);
  // Two fetches of the baked noise stand in for eight octaves of simplex noise. The slice
  // through the volume is tilted so the texture's repeat never lines up across the sky.
  vec3 q = vec3(uv * 0.21, dot(uv, vec2(0.083, 0.047)) + uTime * 0.0006);
  float n = saturate(0.5 + (noiseTex(q).r - 0.5) * 2.3);
  float n2 = saturate(0.5 + (noiseTex(q * 3.1 + 0.37).b - 0.5) * 2.0);
  float cover = smoothstep(0.60, 0.92, n + n2 * 0.18);
  float band = smoothstep(0.004, 0.05, d.y) * (1.0 - smoothstep(0.16, 0.42, d.y));
  float a = cover * band * 0.8;
  vec2 az = d.xz / max(length(d.xz), 1e-5);
  vec2 sunAz = uSunDir.xz / max(length(uSunDir.xz), 1e-5);
  float toward = dot(az, sunAz) * 0.5 + 0.5;
  float t3 = toward * toward * toward;
  // Dusk clouds are dark shapes against the glow; only their thin edges catch the light.
  vec3 lit = vec3(1.10, 0.36, 0.16) * t3 * t3 + vec3(0.20, 0.10, 0.12) * toward * toward;
  vec3 shade = vec3(0.016, 0.017, 0.032);
  float thin = 1.0 - smoothstep(0.0, 0.5, cover);
  vec3 col = shade + lit * (0.10 + 1.0 * thin) * exp(-d.y * 5.0);
  // A cloud that drifts across the moon is lit from behind: silver where it is thin.
  col += uMoonColor * moonShine * (0.10 + 0.55 * thin);
  return vec4(col, a);
}

void main() {
  vec3 d = normalize(vDir);
  vec3 col = skyColor(d);
  vec3 du = vec3(d.x, abs(d.y), d.z);

  // Stars fade into the horizon haze and are washed out near the afterglow. The mirror
  // pass skips them: the water film reflects stars analytically (see Ground.js).
  float clear = 1.0 - saturate(luma(col) * 7.0);
  if (uStars > 0.0 && clear > 0.0 && uIsMirrorPass < 0.5) col += nightStars(du) * clear * uStars;
  if (uStars > 0.0 && d.y > 0.0) col += meteor(d) * clear * uStars;

  // Moon. The full moon stands low over the horizon opposite the afterglow (uMoonDiscDir):
  // a soft-edged disc with faint maria, paler and warmer than the light it casts because it
  // is seen through the haze, in a tight glow and a wide aureole that spreads along the
  // horizon where the haze is thickest. Nothing of it reaches further than 60 degrees from
  // the disc, so the rest of the sky skips all of this.
  float moonShine = 0.0;      // how strongly the moon back-lights a cloud in this direction
  float mu = dot(du, uMoonDiscDir);
  if (uStars > 0.0 && mu > 0.5) {
    float ang = sqrt(max(2.0 - 2.0 * mu, 0.0));        // the chord: the angle itself this close in
    float reach = smoothstep(0.5, 0.8, mu) * uStars;
    const float moonR = 0.021;
    float disc = smoothstep(moonR, moonR * 0.93, ang);
    if (disc > 0.0) {
      vec3 right = normalize(cross(uMoonDiscDir, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, uMoonDiscDir);
      vec2 q = vec2(dot(du, right), dot(du, up)) / moonR;
      float maria = vfbm(vec3(q * 2.2 + 4.0, 1.0), 4);
      float limb = sqrt(saturate(1.0 - dot(q, q)));
      // The lower limb looks through more haze than the upper one. Kept just under the level
      // where the tone curve flattens, so the maria stay readable and the bloom stays gentle.
      vec3 face = mix(vec3(1.36, 1.14, 0.90), vec3(1.26, 1.22, 1.14), smoothstep(-1.0, 0.5, q.y));
      face *= (0.44 + 0.56 * smoothstep(0.36, 0.62, maria)) * (0.84 + 0.16 * limb);
      col = mix(col, face, disc * uStars);
    }
    // Three nested glows from one exponential: the tight one is its fifth power, the one
    // that lights the clouds its third.
    float haze = exp(-du.y * 9.0);
    float aureole = exp(-ang * 5.0);
    float inner = aureole * aureole * aureole;
    col += uMoonColor * (0.10 * inner * aureole * aureole + (0.035 + 0.05 * haze) * aureole
                       + 0.030 * haze * haze / (1.0 + 4.0 * ang * ang)) * reach;
    moonShine = (inner + 0.25 * aureole) * reach;
  }

  if (uClouds > 0.0) {
    vec4 c = cloudDeck(du, moonShine);
    col = mix(col, c.rgb, c.a * uClouds);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

export class Sky {
  constructor() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.uniforms = { ...shared, uStars: { value: 1 }, uClouds: { value: 1 } };
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      depthTest: true,
      depthFunc: THREE.LessEqualDepth,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1000;
    this.mesh.layers.set(LAYERS.OPAQUE);
    this.mesh.name = 'sky';
  }

  /**
   * Renders the sky into a cube map. Returns the raw mipmapped cube (for custom shaders)
   * and a PMREM version (for scene.environment). Stars are left out: they would only add noise.
   */
  bakeEnvironment(renderer) {
    const parent = this.mesh.parent;
    const envScene = new THREE.Scene();
    envScene.add(this.mesh);
    const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
      type: THREE.HalfFloatType,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRT);
    this.uniforms.uStars.value = 0;
    cubeCamera.update(renderer, envScene);
    this.uniforms.uStars.value = 1;
    if (parent) parent.add(this.mesh);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromCubemap(cubeRT.texture).texture;
    pmrem.dispose();
    return { cube: cubeRT.texture, pmrem: env };
  }
}
