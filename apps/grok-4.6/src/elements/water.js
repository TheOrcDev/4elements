import * as THREE from 'three'
import { noiseGLSL } from '../shaders/common.js'
import { makeCausticMap } from '../textures.js'

const waterVertex = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vec3 p = position;
    float n = fbm(vec3(p.x * 2.2, uTime * 0.32, p.z * 2.2));
    float n2 = snoise(vec3(p.x * 4.4 + uTime * 0.55, p.z * 4.0, uTime * 0.4));
    float dist = length(p.xz);
    float ripple = sin(dist * 14.0 - uTime * 3.4) * 0.028 * smoothstep(1.2, 0.08, dist);
    float chop = snoise(vec3(p.xz * 7.5, uTime * 1.1)) * 0.012;
    p.y += n * 0.07 + n2 * 0.022 + ripple + chop;

    float e = 0.06;
    float nx = fbm(vec3((p.x + e) * 2.2, uTime * 0.32, p.z * 2.2))
             - fbm(vec3((p.x - e) * 2.2, uTime * 0.32, p.z * 2.2));
    float nz = fbm(vec3(p.x * 2.2, uTime * 0.32, (p.z + e) * 2.2))
             - fbm(vec3(p.x * 2.2, uTime * 0.32, (p.z - e) * 2.2));
    vec3 displacedNormal = normalize(vec3(-nx, e * 2.8, -nz));

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(normalMatrix * displacedNormal);
    vView = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const waterFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;

  ${noiseGLSL}

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float ndv = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - ndv, 3.4);

    float caust = fbm(vec3(vWorld.x * 3.2, uTime * 0.35, vWorld.z * 3.2));
    caust = pow(0.5 + 0.5 * caust, 4.2);
    float sparkle = pow(max(snoise(vec3(vWorld.xz * 10.0, uTime * 1.4)), 0.0), 16.0);
    float foamRing = smoothstep(0.82, 0.98, length(vUv - 0.5) * 2.0);
    float foamNoise = fbm(vec3(vWorld.xz * 6.0, uTime * 0.2));

    vec3 deep = vec3(0.02, 0.12, 0.22);
    vec3 mid = vec3(0.04, 0.34, 0.46);
    vec3 shallow = vec3(0.22, 0.62, 0.68);
    vec3 foam = vec3(0.78, 0.9, 0.94);

    float depth = smoothstep(-0.06, 0.12, vWorld.y);
    vec3 color = mix(deep, mid, depth);
    color = mix(color, shallow, fresnel * 0.75);
    color += foam * caust * 0.14;
    color += vec3(0.75, 0.9, 1.0) * sparkle * 0.35;
    color = mix(color, foam, foamRing * (0.25 + foamNoise * 0.2));

    float spec = pow(ndv, 48.0) * 0.35;
    color += vec3(0.85, 0.95, 1.0) * spec;

    float alpha = 0.78 + fresnel * 0.16;
    gl_FragColor = vec4(color, alpha);
  }
`

const dropVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  varying float vLife;

  void main() {
    float life = fract(uTime * (0.2 + aSeed * 0.24) + aSeed);
    vLife = life;
    float ang = aSeed * 51.0;
    float r = 0.06 + aSeed * 0.2;
    vec3 p = vec3(cos(ang) * r, 2.05 - life * 2.2, sin(ang) * r);
    p.x += sin(uTime * 1.8 + aSeed * 10.0) * 0.03;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (110.0 / -mv.z) * (0.45 + life * 0.4);
  }
`

const dropFragment = /* glsl */ `
  varying float vLife;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    uv.y *= 1.5;
    float d = length(uv);
    if (d > 1.0) discard;
    float body = smoothstep(1.0, 0.25, d);
    vec3 c = mix(vec3(0.35, 0.62, 0.78), vec3(0.75, 0.9, 0.96), vLife);
    gl_FragColor = vec4(c, body * 0.7);
  }
`

export function createWater() {
  const group = new THREE.Group()
  group.name = 'water'

  const uniforms = { uTime: { value: 0 } }
  const causticTex = makeCausticMap()
  causticTex.repeat.set(2, 2)

  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 96, 64, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshPhysicalMaterial({
      color: 0x9ec9d4,
      metalness: 0.02,
      roughness: 0.12,
      transmission: 0.78,
      thickness: 0.42,
      ior: 1.33,
      transparent: true,
      opacity: 0.72,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      side: THREE.DoubleSide,
      attenuationColor: new THREE.Color(0x1a6f86),
      attenuationDistance: 0.9,
    }),
  )
  bowl.rotation.x = Math.PI
  bowl.position.y = 0.72
  bowl.castShadow = true
  group.add(bowl)

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.16, 0.038, 16, 80),
    new THREE.MeshPhysicalMaterial({
      color: 0xd4eaf2,
      metalness: 0.15,
      roughness: 0.18,
      transparent: true,
      opacity: 0.9,
      clearcoat: 0.8,
    }),
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.74
  group.add(rim)

  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(1.04, 192),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: waterVertex,
      fragmentShader: waterFragment,
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    }),
  )
  surface.rotation.x = -Math.PI / 2
  surface.position.y = 0.78
  group.add(surface)

  const volume = new THREE.Mesh(
    new THREE.CylinderGeometry(0.94, 0.52, 0.6, 64, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0x0f6a82,
      roughness: 0.22,
      metalness: 0.0,
      transmission: 0.55,
      thickness: 1.1,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      attenuationColor: new THREE.Color(0x04485c),
      attenuationDistance: 0.65,
    }),
  )
  volume.position.y = 0.46
  group.add(volume)

  const causticPlane = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 48),
    new THREE.MeshBasicMaterial({
      map: causticTex,
      color: 0x7fd4e8,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  causticPlane.rotation.x = -Math.PI / 2
  causticPlane.position.y = 0.13
  group.add(causticPlane)

  const dropCount = 120
  const seeds = new Float32Array(dropCount)
  const sizes = new Float32Array(dropCount)
  const pos = new Float32Array(dropCount * 3)
  for (let i = 0; i < dropCount; i++) {
    seeds[i] = Math.random()
    sizes[i] = 2.4 + Math.random() * 4.2
  }
  const dropGeo = new THREE.BufferGeometry()
  dropGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  dropGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  dropGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  group.add(
    new THREE.Points(
      dropGeo,
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: dropVertex,
        fragmentShader: dropFragment,
        transparent: true,
        depthWrite: false,
      }),
    ),
  )

  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8f2f8,
    roughness: 0.08,
    transmission: 0.9,
    thickness: 0.12,
    transparent: true,
    opacity: 0.45,
    metalness: 0,
  })
  const bubbleData = []
  const bubbles = new THREE.Group()
  for (let i = 0; i < 22; i++) {
    const s = 0.02 + Math.random() * 0.038
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 14), bubbleMat)
    mesh.userData = { seed: Math.random() }
    bubbles.add(mesh)
    bubbleData.push(mesh)
  }
  group.add(bubbles)

  const light = new THREE.PointLight(0x4db8d0, 2.6, 6, 1.9)
  light.position.set(0, 1.12, 0)
  group.add(light)

  const under = new THREE.PointLight(0x14586c, 1.4, 3.2, 2)
  under.position.set(0, 0.22, 0)
  group.add(under)

  group.userData.update = (t) => {
    uniforms.uTime.value = t
    causticTex.offset.set(t * 0.03, t * 0.02)
    causticPlane.material.opacity = 0.12 + 0.04 * (0.5 + 0.5 * Math.sin(t * 1.8))
    light.intensity = 2.4 + Math.sin(t * 1.4) * 0.25
    bubbleData.forEach((b, i) => {
      const life = (t * (0.16 + b.userData.seed * 0.18) + b.userData.seed) % 1
      const ang = b.userData.seed * Math.PI * 2
      const r = 0.14 + (i % 7) * 0.075
      b.position.set(
        Math.cos(ang + t * 0.25) * r,
        0.22 + life * 0.5,
        Math.sin(ang + t * 0.25) * r,
      )
      b.scale.setScalar(0.75 + Math.sin(life * Math.PI) * 0.4)
    })
  }

  return group
}
