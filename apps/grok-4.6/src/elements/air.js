import * as THREE from 'three'
import { noiseGLSL } from '../shaders/common.js'

const vortexVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vView;

  void main() {
    vUv = uv;
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const vortexFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vView;

  ${noiseGLSL}

  void main() {
    float h = vUv.y;
    float ang = atan(vPos.z, vPos.x);
    float r = length(vPos.xz);

    float ribbons = sin(ang * 9.0 - h * 22.0 + uTime * 2.1);
    float n = fbm(vec3(vPos.x * 1.8, h * 2.8 - uTime * 0.5, vPos.z * 1.8));
    float fine = snoise(vec3(ang * 3.0, h * 8.0 - uTime, r * 4.0));
    float swirl = ribbons * 0.55 + n * 0.4 + fine * 0.18;

    float veil = smoothstep(0.04, 0.28, h) * smoothstep(1.0, 0.52, h);
    veil *= smoothstep(1.12, 0.28, r);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.8);

    vec3 cool = vec3(0.42, 0.58, 0.74);
    vec3 frost = vec3(0.78, 0.88, 0.96);
    vec3 color = mix(cool, frost, 0.45 + swirl * 0.35);
    color += vec3(0.55, 0.72, 0.9) * fresnel * 0.35;

    float alpha = veil * (0.12 + max(swirl, 0.0) * 0.22 + fresnel * 0.18);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.55));
  }
`

const windVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  varying float vLife;
  varying float vSeed;

  ${noiseGLSL}

  void main() {
    vSeed = aSeed;
    float life = fract(uTime * (0.1 + aSeed * 0.16) + aSeed);
    vLife = life;

    float ang = aSeed * 40.0 + uTime * (0.95 + aSeed * 0.7) + life * 7.5;
    float height = mix(-0.1, 2.5, life) + sin(uTime * 1.2 + aSeed * 12.0) * 0.07;
    float radius = mix(0.16, 0.92, sin(life * 3.1415)) + snoise(vec3(aSeed * 8.0, uTime * 0.25, life)) * 0.1;

    vec3 p = vec3(cos(ang) * radius, height, sin(ang) * radius);
    vec3 curl = curlNoise(p * 0.8 + vec3(0.0, uTime * 0.22, 0.0));
    p += curl * 0.16;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (110.0 / -mv.z) * (0.35 + 0.65 * sin(life * 3.1415));
  }
`

const windFragment = /* glsl */ `
  varying float vLife;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float d = length(uv);
    if (d > 1.0) discard;
    float glow = pow(1.0 - d, 2.4);
    vec3 c = mix(vec3(0.62, 0.76, 0.9), vec3(0.9, 0.95, 1.0), vSeed * 0.45);
    float fade = sin(vLife * 3.1415);
    gl_FragColor = vec4(c, glow * fade * 0.55);
  }
`

export function createAir() {
  const group = new THREE.Group()
  group.name = 'air'

  const uniforms = { uTime: { value: 0 } }

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.92, 2.5, 96, 72, true),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vortexVertex,
      fragmentShader: vortexFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    }),
  )
  shell.position.y = 1.15
  group.add(shell)

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.38, 2.15, 64, 48, true),
    new THREE.ShaderMaterial({
      uniforms: { uTime: uniforms.uTime },
      vertexShader: vortexVertex,
      fragmentShader: vortexFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    }),
  )
  inner.position.y = 1.08
  inner.rotation.y = 1.2
  group.add(inner)

  const count = 900
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const dummyPos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    seeds[i] = Math.random()
    sizes[i] = 2.2 + Math.random() * 5.5
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(dummyPos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  group.add(
    new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: windVertex,
        fragmentShader: windFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    ),
  )

  const ribbonMat = new THREE.MeshPhysicalMaterial({
    color: 0xc5def0,
    roughness: 0.18,
    metalness: 0.05,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  })

  const ribbons = []
  for (let i = 0; i < 5; i++) {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: 18 }, (_, k) => {
        const t = k / 17
        const ang = t * Math.PI * 4 + i * 1.1
        const r = 0.22 + Math.sin(t * Math.PI) * 0.55
        return new THREE.Vector3(Math.cos(ang) * r, t * 2.35, Math.sin(ang) * r)
      }),
    )
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.012, 6, false), ribbonMat)
    mesh.userData.phase = i
    group.add(mesh)
    ribbons.push(mesh)
  }

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xd5e8f5,
    metalness: 0.35,
    roughness: 0.25,
    transparent: true,
    opacity: 0.45,
  })
  const rings = []
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55 + i * 0.14, 0.008, 10, 96), ringMat)
    ring.position.y = 0.45 + i * 0.62
    ring.rotation.x = Math.PI / 2
    ring.userData.phase = i
    group.add(ring)
    rings.push(ring)
  }

  const light = new THREE.PointLight(0xc8e2f5, 2.2, 6, 2)
  light.position.set(0, 1.35, 0)
  group.add(light)

  group.userData.update = (t) => {
    uniforms.uTime.value = t
    shell.rotation.y = t * 0.48
    inner.rotation.y = -t * 0.82
    ribbons.forEach((r, i) => {
      r.rotation.y = t * (0.35 + i * 0.08)
    })
    rings.forEach((ring) => {
      const p = ring.userData.phase
      ring.rotation.z = t * (0.25 + p * 0.12)
    })
    light.intensity = 2 + Math.sin(t * 1.6) * 0.25
  }

  return group
}
