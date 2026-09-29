import * as THREE from 'three';

const noiseGLSL = /* glsl */ `
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(.1031, .1030, .0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = dot(hash33(i + vec3(0,0,0)) * 2.0 - 1.0, p - i);
    float b = dot(hash33(i + vec3(1,0,0)) * 2.0 - 1.0, p - i - vec3(1,0,0));
    float c = dot(hash33(i + vec3(0,1,0)) * 2.0 - 1.0, p - i - vec3(0,1,0));
    float d = dot(hash33(i + vec3(1,1,0)) * 2.0 - 1.0, p - i - vec3(1,1,0));
    float e = dot(hash33(i + vec3(0,0,1)) * 2.0 - 1.0, p - i - vec3(0,0,1));
    float g = dot(hash33(i + vec3(1,0,1)) * 2.0 - 1.0, p - i - vec3(1,0,1));
    float h = dot(hash33(i + vec3(0,1,1)) * 2.0 - 1.0, p - i - vec3(0,1,1));
    float j = dot(hash33(i + vec3(1,1,1)) * 2.0 - 1.0, p - i - vec3(1,1,1));
    return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y),
               mix(mix(e,g,f.x), mix(h,j,f.x), f.y), f.z) + .5;
  }

  float fbm(vec3 p) {
    float f = .55 * noise3(p);
    p = p * 2.03 + vec3(8.3, 2.8, 5.2);
    f += .27 * noise3(p);
    p = p * 2.02 + vec3(2.1, 9.2, 4.7);
    f += .13 * noise3(p);
    return f;
  }
`;

const flameVertex = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uHeight;
  uniform float uRadius;
  uniform float uSeed;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;
  ${noiseGLSL}

  void main() {
    vUv = uv;
    float h = position.y;
    float angle = uv.x * 6.283185;
    float t = uTime * 1.45 + uSeed;
    vec3 p = position;
    // Three independent scales of moving turbulence break up the silhouette.
    float curl = fbm(vec3(p.x * 2.8, h * 4.8 - t * 1.8, p.z * 2.8));
    float ripple = sin(angle * 5.0 + h * 13.0 - t * 4.2 + uSeed) * .06;
    float turbulence = .74 + curl * .65 + ripple;
    p.xz *= uRadius * turbulence;
    float bend = pow(h, 1.65);
    p.x += bend * (sin(t * 1.15 - h * 3.0) * .20 + sin(t * .67 + h * 5.0) * .11);
    p.z += bend * (cos(t * .85 - h * 3.4) * .17);
    p.y = h * uHeight;
    p.y += sin(angle * 3.0 + t * 3.3 + h * 5.0) * .13 * pow(h, 2.0);
    // A subtle pulse responds to the power control without changing the footprint.
    p.y *= .94 + .06 * uIntensity;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vPosition = p;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = viewMatrix * world;
    vView = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const flameFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSeed;
  uniform float uCore;
  uniform float uOpacity;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;
  ${noiseGLSL}

  void main() {
    float h = vUv.y;
    vec3 q = vec3(vPosition.x * 3.7, h * 7.0 - uTime * 3.8, vPosition.z * 3.7);
    q += uSeed;
    float n = fbm(q);
    float detail = fbm(q * vec3(1.7, 1.35, 1.7) + vec3(0.0, -uTime * 1.6, 0.0));
    float streaks = fbm(vec3(vPosition.x * 8.5, h * 3.4 - uTime * 3.0, vPosition.z * 8.5) + uSeed);
    float tongues = smoothstep(.39 + h * .13, .63 + h * .11, n * .7 + detail * .45);
    float ribs = pow(smoothstep(.47, .68, streaks), 1.7);
    float edge = pow(abs(dot(normalize(vNormal), vView)), .35);
    float base = smoothstep(0.0, .11, h);
    float top = 1.0 - smoothstep(.74, 1.0, h);
    float body = base * top * (.065 + tongues * .78 + ribs * .26);
    float hotCore = uCore * (1.0 - smoothstep(.12, .52, h));
    float heat = clamp((1.0 - h) * .43 + detail * .48 + hotCore * .25 + ribs * .18, 0.0, 1.0);
    vec3 red = vec3(.68, .025, .001);
    vec3 orange = vec3(.95, .17, .006);
    vec3 yellow = vec3(1.15, .55, .055);
    vec3 white = vec3(1.5, .95, .30);
    vec3 color = mix(red, orange, smoothstep(.16, .55, heat));
    color = mix(color, yellow, smoothstep(.63, .91, heat));
    color = mix(color, white, smoothstep(.90, 1.0, heat) * hotCore);
    // Bright filaments surrounded by transparent crimson gas.
    color *= .64 + ribs * .86 + hotCore * .10;
    float alpha = body * (.50 + edge * .50) * uOpacity;
    alpha *= .66 + .34 * uIntensity;
    gl_FragColor = vec4(color * (.68 + uIntensity * .32), alpha);
  }
`;

function makeFlameGeometry() {
  const rings = 66;
  const sides = 64;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let y = 0; y <= rings; y++) {
    const h = y / rings;
    // Rounded fire bowl -> expanding body -> long, tapering flame tip.
    const radius = Math.pow(Math.max(0, 1 - h), .78) * (.56 + Math.sin(h * Math.PI) * .26);
    for (let side = 0; side <= sides; side++) {
      const a = side / sides * Math.PI * 2;
      const lobes = 1 + Math.sin(a * 3 + h * 6) * .13 + Math.sin(a * 7 - h * 8) * .06;
      positions.push(Math.cos(a) * radius * lobes, h, Math.sin(a) * radius * lobes);
      uvs.push(side / sides, h);
      if (y < rings && side < sides) {
        const i = y * (sides + 1) + side;
        indices.push(i, i + 1, i + sides + 1, i + 1, i + sides + 2, i + sides + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const emberVertex = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uIntensity;
  varying float vLife;
  varying float vHeat;
  void main() {
    float life = fract(aSeed.x + uTime * (.15 + aSeed.y * .17));
    float a = aSeed.z * 6.283185 + life * 1.8;
    float spread = aSeed.y * .68 + life * .39;
    vec3 p = vec3(cos(a) * spread, -1.3 + life * 3.65, sin(a) * spread);
    p.x += sin(life * 11.0 + aSeed.z * 18.0 + uTime * .65) * .16 * life;
    p.z += cos(life * 9.0 + aSeed.x * 22.0 + uTime * .55) * .17 * life;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(aSeed.w * (260.0 / -mvPosition.z) * (.6 + uIntensity * .4), 1.3, 9.0);
    vLife = smoothstep(0.0, .10, life) * (1.0 - smoothstep(.55, 1.0, life));
    vHeat = aSeed.y;
  }
`;

const emberFragment = /* glsl */ `
  varying float vLife;
  varying float vHeat;
  void main() {
    vec2 p = gl_PointCoord - .5;
    float d = length(p * vec2(1.0, .85));
    float glow = exp(-d * d * 21.0);
    float core = exp(-d * d * 110.0);
    vec3 color = mix(vec3(2.5, .25, .015), vec3(3.5, 1.7, .5), core);
    gl_FragColor = vec4(color, glow * vLife * (.65 + vHeat * .35));
  }
`;

const coalVertex = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coalFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vPosition;
  varying vec3 vNormal;
  ${noiseGLSL}
  void main() {
    float n = fbm(vPosition * 9.0);
    float cracks = 1.0 - smoothstep(.016, .061, abs(n - .47));
    float grain = noise3(vPosition * 65.0);
    float shade = .4 + .6 * max(dot(vNormal, normalize(vec3(-.4, .8, 1.0))), 0.0);
    vec3 rock = vec3(.025, .018, .014) * shade + grain * .014;
    float pulse = .72 + .28 * sin(uTime * 2.0 + n * 21.0);
    vec3 molten = mix(vec3(1.8, .09, .002), vec3(3.0, .58, .025), pulse);
    gl_FragColor = vec4(rock + molten * cracks * uIntensity, 1.0);
  }
`;

export function createFire() {
  const group = new THREE.Group();
  group.name = 'Fire — living combustion';
  const flameGeometry = makeFlameGeometry();
  const flameMaterials = [];
  const flames = [];

  function addFlame({ height, radius, seed, core = 0, opacity = .9, x = 0, z = 0, y = -1.36 }) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uHeight: { value: height },
        uRadius: { value: radius },
        uSeed: { value: seed },
        uCore: { value: core },
        uOpacity: { value: opacity },
      },
      vertexShader: flameVertex,
      fragmentShader: flameFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(flameGeometry, material);
    mesh.position.set(x, y, z);
    mesh.frustumCulled = false;
    group.add(mesh);
    flameMaterials.push(material);
    flames.push(mesh);
    return mesh;
  }

  addFlame({ height: 3.02, radius: 1.04, seed: 1.1, opacity: .58 });
  addFlame({ height: 2.72, radius: .72, seed: 7.5, core: .75, opacity: .29 });
  addFlame({ height: 1.62, radius: .34, seed: 13.7, core: 1, opacity: .38 });

  // Unequal tongues detach from the body and curl in different directions.
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * Math.PI * 2 + .35;
    const flame = addFlame({
      height: 1.54 + (i % 3) * .29,
      radius: .40 + (i % 2) * .05,
      seed: 18.2 + i * 7.7,
      core: .10,
      opacity: .31,
      x: Math.cos(angle) * .39,
      z: Math.sin(angle) * .39,
      y: -1.34,
    });
    flame.rotation.z = Math.cos(angle) * -.13;
    flame.rotation.x = Math.sin(angle) * .13;
  }

  const coalMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
    vertexShader: coalVertex,
    fragmentShader: coalFragment,
    toneMapped: false,
  });
  const coalGeometry = new THREE.DodecahedronGeometry(.28, 1);
  const coals = [];
  for (let i = 0; i < 17; i++) {
    const angle = i * 2.399963;
    const radius = Math.sqrt(i / 17) * .67;
    const rock = new THREE.Mesh(coalGeometry, coalMaterial);
    rock.position.set(Math.cos(angle) * radius, -1.40 + Math.sin(i * 4.8) * .055, Math.sin(angle) * radius);
    rock.scale.set(.65 + (i % 3) * .12, .35 + (i % 4) * .08, .64 + (i % 5) * .09);
    rock.rotation.set(i * .79, i * 1.21, i * .36);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
    coals.push(rock);
  }

  // A thin molten bed illuminates the gaps between the charcoal fragments.
  const bedGeometry = new THREE.CircleGeometry(.78, 64);
  const bedMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.4, .19, .012),
    transparent: true,
    opacity: .75,
    toneMapped: false,
  });
  const bed = new THREE.Mesh(bedGeometry, bedMaterial);
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = -1.47;
  group.add(bed);

  const emberCount = 390;
  const emberGeometry = new THREE.BufferGeometry();
  const emberSeeds = new Float32Array(emberCount * 4);
  for (let i = 0; i < emberCount; i++) {
    // Deterministic seeds make resets and thumbnails reproducible.
    const n = Math.sin(i * 127.1 + 41.7) * 43758.5453;
    const n2 = Math.sin(i * 269.5 + 12.4) * 43758.5453;
    const n3 = Math.sin(i * 419.2 + 93.1) * 43758.5453;
    emberSeeds[i * 4] = n - Math.floor(n);
    emberSeeds[i * 4 + 1] = n2 - Math.floor(n2);
    emberSeeds[i * 4 + 2] = n3 - Math.floor(n3);
    emberSeeds[i * 4 + 3] = .035 + ((i * 17) % 100) / 100 * .085;
  }
  emberGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(emberCount * 3), 3));
  emberGeometry.setAttribute('aSeed', new THREE.BufferAttribute(emberSeeds, 4));
  const emberMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
    vertexShader: emberVertex,
    fragmentShader: emberFragment,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const embers = new THREE.Points(emberGeometry, emberMaterial);
  embers.frustumCulled = false;
  group.add(embers);

  const fireLight = new THREE.PointLight(0xff6c16, 13, 6, 2);
  fireLight.position.set(0, -.75, .1);
  group.add(fireLight);

  return {
    group,
    update(time, delta, { intensity = 1 } = {}) {
      const power = THREE.MathUtils.clamp(intensity, .35, 2);
      for (let i = 0; i < flameMaterials.length; i++) {
        const material = flameMaterials[i];
        material.uniforms.uTime.value = time;
        material.uniforms.uIntensity.value = power;
      }
      coalMaterial.uniforms.uTime.value = time;
      coalMaterial.uniforms.uIntensity.value = power;
      emberMaterial.uniforms.uTime.value = time;
      emberMaterial.uniforms.uIntensity.value = power;
      fireLight.intensity = (11.5 + Math.sin(time * 13.5) * .8 + Math.sin(time * 17.1) * .5) * power;
      bedMaterial.opacity = .60 + Math.sin(time * 4.1) * .06;
    },
    dispose() {
      flameGeometry.dispose();
      flameMaterials.forEach((material) => material.dispose());
      coalGeometry.dispose();
      coalMaterial.dispose();
      bedGeometry.dispose();
      bedMaterial.dispose();
      emberGeometry.dispose();
      emberMaterial.dispose();
    },
  };
}
