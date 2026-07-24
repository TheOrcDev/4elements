import * as THREE from 'three';

// Shared water shading: depth-tinted body, fresnel sky rim, hot sun glint, crest foam.
const waterFragment = /* glsl */`
  uniform vec3 uSunDir, uDeepColor, uShallowColor, uSkyColor, uSunColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vCrest;
  #include <fog_pars_fragment>
  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
    vec3 base = mix(uDeepColor, uShallowColor, vCrest);
    vec3 col = mix(base, uSkyColor, fres * 0.7);
    // sharp Blinn glint — bloom makes it sparkle
    vec3 hv = normalize(viewDir + normalize(uSunDir));
    float spec = pow(max(dot(n, hv), 0.0), 240.0);
    col += uSunColor * spec * 3.5;
    // subtle foam on crests, broken up by a cheap hash sparkle
    float sparkle = fract(sin(dot(floor(vWorldPos.xz * 7.0), vec2(12.9898, 78.233))) * 43758.5453);
    float foam = smoothstep(0.84, 0.98, vCrest) * (0.35 + 0.65 * sparkle);
    col = mix(col, vec3(0.82, 0.92, 0.95), foam * 0.55);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

// Ocean vertex shader: sum of 5 Gerstner waves with analytic normals (GPU Gems 1).
const oceanVertex = /* glsl */`
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vCrest;
  #include <fog_pars_vertex>

  vec3 gerstner(vec2 dir, float steep, float wavelength, float amp, float t, vec3 basePos,
                inout vec3 tang, inout vec3 binorm) {
    float k = 6.28318 / wavelength;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(dir);
    float f = k * (dot(d, basePos.xz) - c * t);
    float s = sin(f);
    float co = cos(f);
    float q = steep / (k * amp);
    tang   += vec3(-steep * d.x * d.x * s, amp * k * d.x * co, -steep * d.x * d.y * s);
    binorm += vec3(-steep * d.x * d.y * s, amp * k * d.y * co, -steep * d.y * d.y * s);
    return vec3(d.x * q * amp * co, amp * s, d.y * q * amp * co);
  }

  void main() {
    vec3 p = position;
    vec3 tang = vec3(1.0, 0.0, 0.0);
    vec3 binorm = vec3(0.0, 0.0, 1.0);
    p += gerstner(vec2( 1.0,  0.2), 0.16, 9.0, 0.42, uTime, position, tang, binorm);
    p += gerstner(vec2( 0.7,  0.7), 0.14, 5.5, 0.28, uTime, position, tang, binorm);
    p += gerstner(vec2(-0.3,  1.0), 0.12, 3.2, 0.18, uTime, position, tang, binorm);
    p += gerstner(vec2( 1.0, -0.6), 0.10, 2.1, 0.12, uTime, position, tang, binorm);
    p += gerstner(vec2(-0.8, -0.4), 0.08, 1.3, 0.08, uTime, position, tang, binorm);
    vNormal = normalize(cross(binorm, tang));
    vCrest = clamp(p.y * 0.5 + 0.5, 0.0, 1.0);
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPos = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

// Orb vertex shader: animated 3D value-noise displacement, same varyings as the ocean.
const orbVertex = /* glsl */`
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vCrest;
  #include <fog_pars_vertex>

  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), u.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
      u.z);
  }

  void main() {
    float n = vnoise(normal * 2.3 + vec3(0.0, uTime * 0.55, uTime * 0.3));
    float n2 = vnoise(normal * 5.0 - vec3(uTime * 0.4, 0.0, uTime * 0.25));
    vec3 p = position + normal * ((n - 0.5) * 0.34 + (n2 - 0.5) * 0.1);
    vCrest = clamp(n * 1.2, 0.0, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPos = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

function waterUniforms() {
  return Object.assign(
    THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.45, 0.75, 0.35).normalize() },
      uDeepColor: { value: new THREE.Color(0x032030) },
      uShallowColor: { value: new THREE.Color(0x0e5f6e) },
      uSkyColor: { value: new THREE.Color(0x9fc6d8) },
      uSunColor: { value: new THREE.Color(0xfff2cf) },
    }
  );
}

export function createWater(originX = 0) {
  const group = new THREE.Group();
  group.position.x = originX;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  // ---------- ocean ----------
  const oceanGeo = new THREE.PlaneGeometry(70, 70, 180, 180);
  oceanGeo.rotateX(-Math.PI / 2); // lie in the XZ plane, displaced along +Y in the shader
  const oceanUniforms = waterUniforms();
  const ocean = new THREE.Mesh(oceanGeo, new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    vertexShader: oceanVertex,
    fragmentShader: waterFragment,
    fog: true,
  }));
  group.add(ocean);

  // ---------- floating water orb ----------
  const orbUniforms = waterUniforms();
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: orbUniforms,
      vertexShader: orbVertex,
      fragmentShader: waterFragment,
      fog: true,
    })
  );
  orb.position.y = 3.1;
  group.add(orb);

  // ---------- mist droplets drifting above the surface ----------
  const MCOUNT = 300;
  const mgeo = new THREE.BufferGeometry();
  mgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MCOUNT * 3), 3));
  const mSeeds = new Float32Array(MCOUNT);
  const mSpeeds = new Float32Array(MCOUNT);
  const mOffsets = new Float32Array(MCOUNT * 3);
  for (let i = 0; i < MCOUNT; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * 14;
    mSeeds[i] = Math.random();
    mSpeeds[i] = 0.4 + Math.random() * 0.8;
    mOffsets[i * 3] = Math.cos(ang) * rr;
    mOffsets[i * 3 + 1] = 0.2 + Math.random() * 0.6;
    mOffsets[i * 3 + 2] = Math.sin(ang) * rr;
  }
  mgeo.setAttribute('aSeed', new THREE.BufferAttribute(mSeeds, 1));
  mgeo.setAttribute('aSpeed', new THREE.BufferAttribute(mSpeeds, 1));
  mgeo.setAttribute('aOffset', new THREE.BufferAttribute(mOffsets, 3));

  const mistUniforms = { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } };
  const mistMat = new THREE.ShaderMaterial({
    uniforms: mistUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uTime, uPixelRatio;
      attribute float aSeed, aSpeed;
      attribute vec3 aOffset;
      varying float vA;
      varying float vDepth;
      void main() {
        float life = fract(aSeed + uTime * aSpeed * 0.045);
        vec3 p = aOffset;
        p.y += life * 3.2;
        p.x += sin(uTime * 0.25 + aSeed * 6.2831) * 1.1;
        p.z += cos(uTime * 0.20 + aSeed * 6.2831) * 1.1;
        vA = (0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * (0.6 + aSpeed) + aSeed * 40.0)))
           * smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.7, 1.0, life));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_PointSize = (10.0 + aSeed * 26.0) * uPixelRatio * (12.0 / vDepth);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vA;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.15, d);
        float fogFade = exp(-vDepth * vDepth * 0.0009);
        gl_FragColor = vec4(vec3(0.62, 0.78, 0.88), a * vA * 0.16 * fogFade);
      }
    `,
  });
  const mist = new THREE.Points(mgeo, mistMat);
  mist.frustumCulled = false;
  group.add(mist);

  // ---------- cool light above the orb ----------
  const light = new THREE.PointLight(0x4d8fd1, 55, 35, 2);
  light.position.set(0, 6.5, 0);
  group.add(light);

  function update(elapsed) {
    oceanUniforms.uTime.value = elapsed;
    orbUniforms.uTime.value = elapsed;
    mistUniforms.uTime.value = elapsed;
    orb.position.y = 3.1 + Math.sin(elapsed * 0.85) * 0.28; // gentle bobbing
    orb.rotation.y = elapsed * 0.25;
  }

  return {
    group,
    update,
    anchor: new THREE.Vector3(originX, 2.8, 13),
    target: new THREE.Vector3(originX, 3.0, 0),
    background: 0x020b16,
  };
}
