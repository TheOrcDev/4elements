import * as THREE from 'three'
import { noiseGLSL } from '../shaders/common.js'

const fireVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fireFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  ${noiseGLSL}

  vec3 firePalette(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.05, 0.01, 0.0);
    vec3 c1 = vec3(0.42, 0.04, 0.0);
    vec3 c2 = vec3(0.82, 0.16, 0.02);
    vec3 c3 = vec3(0.95, 0.42, 0.05);
    vec3 c4 = vec3(0.98, 0.78, 0.28);
    if (t < 0.22) return mix(c0, c1, t / 0.22);
    if (t < 0.46) return mix(c1, c2, (t - 0.22) / 0.24);
    if (t < 0.72) return mix(c2, c3, (t - 0.46) / 0.26);
    return mix(c3, c4, (t - 0.72) / 0.28);
  }

  void main() {
    float h = clamp(vUv.y, 0.0, 1.0);
    vec3 p = vPos * vec3(2.15, 1.05, 2.15);
    p.y -= uTime * 1.35;

    float warp = fbm(p * 1.35 + vec3(0.0, uTime * 0.28, 0.0));
    vec3 q = p + vec3(warp * 0.62, warp * 0.18, -warp * 0.5);
    float n = fbm(q * 1.65);
    float n2 = snoise(q * 4.2 + vec3(0.0, -uTime * 2.4, 0.0));
    float tongues = snoise(vec3(atan(vPos.z, vPos.x) * 5.0, h * 6.0 - uTime * 1.8, n));

    float radial = length(vPos.xz);
    float shape = pow(1.0 - h, 0.62);
    shape *= smoothstep(0.92, 0.16, radial + h * 0.42);
    shape *= 0.78 + tongues * 0.28;

    float flame = shape * (0.42 + n * 0.78 + n2 * 0.28);
    flame -= h * 0.42;
    flame = smoothstep(0.12, 0.72, flame);

    float core = smoothstep(0.42, 0.05, radial) * pow(1.0 - h, 1.35);
    float heat = clamp(flame * 1.05 + core * 0.45, 0.0, 1.0);
    vec3 color = firePalette(heat);
    color += vec3(1.0, 0.72, 0.22) * core * 0.35;
    color *= uIntensity;

    float alpha = clamp(heat * 1.15, 0.0, 0.92);
    alpha *= smoothstep(0.0, 0.06, h) * smoothstep(1.0, 0.68, h);
    if (alpha < 0.03) discard;

    gl_FragColor = vec4(color, alpha);
  }
`

const emberVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  varying float vLife;
  varying float vSeed;

  void main() {
    vSeed = aSeed;
    float life = fract(uTime * (0.16 + aSeed * 0.28) + aSeed);
    vLife = life;

    vec3 p = position;
    float rise = life * 3.15;
    float spin = aSeed * 6.2831 + uTime * (0.35 + aSeed * 0.6);
    float spread = 0.1 + life * (0.48 + aSeed * 0.42);
    p.x += cos(spin) * spread + sin(uTime * 1.5 + aSeed * 12.0) * 0.06;
    p.z += sin(spin * 0.9) * spread + cos(uTime * 1.2 + aSeed * 9.0) * 0.06;
    p.y += rise + sin(uTime * 2.6 + aSeed * 20.0) * 0.04;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (130.0 / -mv.z) * (1.0 - life);
  }
`

const emberFragment = /* glsl */ `
  varying float vLife;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float d = length(uv);
    if (d > 1.0) discard;
    float glow = pow(1.0 - d, 2.8);
    vec3 hot = mix(vec3(0.95, 0.38, 0.04), vec3(1.0, 0.82, 0.35), vSeed * 0.7);
    float fade = smoothstep(0.95, 0.12, vLife);
    gl_FragColor = vec4(hot, glow * fade * 0.85);
  }
`

function flameGeometry() {
  const pts = []
  for (let i = 0; i < 36; i++) {
    const t = i / 35
    const waist = Math.sin(t * Math.PI)
    const r = waist * (0.58 - t * 0.26) + (1.0 - t) * 0.08
    const lick = Math.sin(t * 18.0) * 0.018 * (1.0 - t)
    pts.push(new THREE.Vector2(Math.max(r + lick, 0.012), t * 2.55))
  }
  return new THREE.LatheGeometry(pts, 96)
}

function makeCoalGeo() {
  const geo = new THREE.DodecahedronGeometry(0.09, 1)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = Math.sin(v.x * 18 + v.y * 14) * 0.018
    v.addScaledVector(v.clone().normalize(), n)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}

export function createFire() {
  const group = new THREE.Group()
  group.name = 'fire'

  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 0.95 },
  }

  const flameMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: fireVertex,
    fragmentShader: fireFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  })

  const outer = new THREE.Mesh(flameGeometry(), flameMat)
  outer.position.y = 0.16
  group.add(outer)

  const inner = new THREE.Mesh(
    flameGeometry(),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: uniforms.uTime,
        uIntensity: { value: 1.05 },
      },
      vertexShader: fireVertex,
      fragmentShader: fireFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    }),
  )
  inner.scale.set(0.52, 0.68, 0.52)
  inner.position.y = 0.2
  inner.rotation.y = Math.PI * 0.35
  group.add(inner)

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffc56a,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  )
  core.position.y = 0.38
  group.add(core)

  const coalCount = 22
  const coals = new THREE.InstancedMesh(
    makeCoalGeo(),
    new THREE.MeshStandardMaterial({
      color: 0x1c0c06,
      emissive: 0x8a2200,
      emissiveIntensity: 0.55,
      roughness: 0.82,
      metalness: 0.12,
    }),
    coalCount,
  )
  const dummy = new THREE.Object3D()
  for (let i = 0; i < coalCount; i++) {
    const a = (i / coalCount) * Math.PI * 2 + Math.random() * 0.25
    const r = 0.1 + Math.random() * 0.42
    dummy.position.set(Math.cos(a) * r, 0.07 + Math.random() * 0.05, Math.sin(a) * r)
    dummy.scale.setScalar(0.55 + Math.random() * 1.15)
    dummy.rotation.set(Math.random(), Math.random(), Math.random())
    dummy.updateMatrix()
    coals.setMatrixAt(i, dummy.matrix)
  }
  coals.castShadow = true
  coals.receiveShadow = true
  group.add(coals)

  const ashCount = 90
  const ash = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.025, 0.012, 0.018),
    new THREE.MeshStandardMaterial({
      color: 0x2a211c,
      roughness: 1,
      metalness: 0,
    }),
    ashCount,
  )
  for (let i = 0; i < ashCount; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 0.2 + Math.random() * 0.7
    dummy.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r)
    dummy.rotation.set(0, Math.random() * 6, Math.random())
    dummy.scale.setScalar(0.5 + Math.random())
    dummy.updateMatrix()
    ash.setMatrixAt(i, dummy.matrix)
  }
  ash.receiveShadow = true
  group.add(ash)

  const emberCount = 260
  const emberPos = new Float32Array(emberCount * 3)
  const seeds = new Float32Array(emberCount)
  const sizes = new Float32Array(emberCount)
  for (let i = 0; i < emberCount; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * 0.26
    emberPos[i * 3] = Math.cos(a) * r
    emberPos[i * 3 + 1] = Math.random() * 0.18
    emberPos[i * 3 + 2] = Math.sin(a) * r
    seeds[i] = Math.random()
    sizes[i] = 2.5 + Math.random() * 5.5
  }
  const emberGeo = new THREE.BufferGeometry()
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3))
  emberGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  emberGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  group.add(
    new THREE.Points(
      emberGeo,
      new THREE.ShaderMaterial({
        uniforms: { uTime: uniforms.uTime },
        vertexShader: emberVertex,
        fragmentShader: emberFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  )

  const light = new THREE.PointLight(0xff7a28, 5.5, 7, 1.8)
  light.position.set(0, 1.05, 0)
  group.add(light)

  const fill = new THREE.PointLight(0xffb25a, 1.4, 3.5, 2)
  fill.position.set(0.15, 0.35, 0.1)
  group.add(fill)

  group.userData.update = (t) => {
    uniforms.uTime.value = t
    inner.material.uniforms.uTime.value = t
    const flicker = 0.9 + Math.sin(t * 9.5) * 0.05 + Math.sin(t * 17.0) * 0.03
    uniforms.uIntensity.value = 0.92 * flicker
    light.intensity = 5.2 + Math.sin(t * 11.0) * 0.7
    core.scale.setScalar(0.9 + Math.sin(t * 8.0) * 0.08)
    outer.rotation.y = Math.sin(t * 0.32) * 0.07
    inner.rotation.y = t * 0.22
  }

  return group
}
