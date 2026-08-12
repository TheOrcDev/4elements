import * as THREE from 'three'
import { makeMossMap, makeRockMaps } from '../textures.js'

const crystalVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;

  void main() {
    vPos = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const crystalFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.4);
    float bands = 0.5 + 0.5 * sin(vPos.y * 22.0 + uTime * 1.4 + vPos.x * 8.0);
    vec3 core = vec3(0.12, 0.38, 0.2);
    vec3 edge = vec3(0.42, 0.78, 0.48);
    vec3 color = mix(core, edge, fresnel);
    color += edge * bands * 0.08;
    gl_FragColor = vec4(color, 0.88);
  }
`

const sporeVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  varying float vLife;

  void main() {
    float life = fract(uTime * (0.06 + aSeed * 0.07) + aSeed);
    vLife = life;
    float ang = aSeed * 70.0 + uTime * 0.12;
    float r = 0.32 + aSeed * 0.68;
    vec3 p = vec3(
      cos(ang) * r,
      0.35 + life * 1.55 + sin(uTime * 0.7 + aSeed * 12.0) * 0.06,
      sin(ang) * r
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (100.0 / -mv.z) * (0.4 + 0.6 * sin(life * 3.1415));
  }
`

const sporeFragment = /* glsl */ `
  varying float vLife;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float d = length(uv);
    if (d > 1.0) discard;
    float body = pow(1.0 - d, 2.6);
    vec3 c = mix(vec3(0.28, 0.46, 0.18), vec3(0.62, 0.78, 0.32), vLife);
    gl_FragColor = vec4(c, body * 0.45 * sin(vLife * 3.1415));
  }
`

function displaceGeometry(geometry, amount = 0.18) {
  const pos = geometry.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n =
      Math.sin(v.x * 3.4 + v.y * 2.6) * 0.38 +
      Math.cos(v.z * 4.6 + v.x * 1.9) * 0.3 +
      Math.sin(v.x * 9.0 + v.z * 8.0 + v.y * 5.5) * 0.14 +
      Math.sin(v.x * 18.0 + v.z * 16.0) * 0.04
    v.addScaledVector(v.clone().normalize(), n * amount)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

export function createEarth() {
  const group = new THREE.Group()
  group.name = 'earth'

  const { color: rockTex, bump: rockBump } = makeRockMaps()
  const mossTex = makeMossMap()

  const boulder = new THREE.Mesh(
    displaceGeometry(new THREE.IcosahedronGeometry(0.84, 6), 0.24),
    new THREE.MeshStandardMaterial({
      map: rockTex,
      color: 0xd2b48c,
      roughness: 0.94,
      metalness: 0.04,
      bumpMap: rockBump,
      bumpScale: 0.14,
    }),
  )
  boulder.position.y = 0.8
  boulder.castShadow = true
  boulder.receiveShadow = true
  group.add(boulder)

  const moss = new THREE.Mesh(
    displaceGeometry(new THREE.IcosahedronGeometry(0.855, 4), 0.2),
    new THREE.MeshStandardMaterial({
      map: mossTex,
      color: 0x3f7a32,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.78,
    }),
  )
  moss.position.copy(boulder.position)
  moss.scale.set(1.015, 0.9, 1.015)
  moss.castShadow = true
  group.add(moss)

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x3d8f55,
    roughness: 0.18,
    metalness: 0.08,
    transmission: 0.35,
    thickness: 0.4,
    transparent: true,
    opacity: 0.92,
    ior: 1.5,
    clearcoat: 0.7,
    clearcoatRoughness: 0.15,
    attenuationColor: new THREE.Color(0x1d5a32),
    attenuationDistance: 0.4,
  })

  const glowCrystalMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: crystalVertex,
    fragmentShader: crystalFragment,
    transparent: true,
  })

  const crystals = []
  const crystalGeo = new THREE.ConeGeometry(0.085, 0.4, 6)
  for (let i = 0; i < 12; i++) {
    const mesh = new THREE.Mesh(crystalGeo, i % 3 === 0 ? glowCrystalMat : crystalMat)
    const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.18
    const r = 0.16 + (i % 5) * 0.075
    mesh.position.set(Math.cos(a) * r, 1.2 + (i % 3) * 0.07, Math.sin(a) * r)
    mesh.rotation.z = (Math.random() - 0.5) * 0.45
    mesh.rotation.x = (Math.random() - 0.5) * 0.3
    mesh.scale.set(0.75 + Math.random() * 0.7, 0.85 + Math.random() * 0.7, 0.75 + Math.random() * 0.7)
    mesh.castShadow = true
    group.add(mesh)
    crystals.push(mesh)
  }

  const cluster = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), crystalMat)
  cluster.position.set(0.04, 1.4, -0.03)
  cluster.castShadow = true
  group.add(cluster)
  crystals.push(cluster)

  const pebbles = new THREE.InstancedMesh(
    displaceGeometry(new THREE.DodecahedronGeometry(0.085, 1), 0.045),
    new THREE.MeshStandardMaterial({
      map: rockTex,
      color: 0x8d6d45,
      roughness: 0.96,
      metalness: 0.04,
      bumpMap: rockBump,
      bumpScale: 0.08,
    }),
    32,
  )
  const dummy = new THREE.Object3D()
  for (let i = 0; i < 32; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 0.52 + Math.random() * 0.58
    dummy.position.set(Math.cos(a) * r, 0.075 + Math.random() * 0.04, Math.sin(a) * r)
    dummy.rotation.set(Math.random(), Math.random(), Math.random())
    dummy.scale.setScalar(0.45 + Math.random() * 1.35)
    dummy.updateMatrix()
    pebbles.setMatrixAt(i, dummy.matrix)
  }
  pebbles.castShadow = true
  pebbles.receiveShadow = true
  group.add(pebbles)

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.16, 0.16, 40),
    new THREE.MeshStandardMaterial({
      color: 0x4a3220,
      roughness: 1,
      map: rockTex,
      bumpMap: rockBump,
      bumpScale: 0.06,
    }),
  )
  soil.position.y = 0.05
  soil.receiveShadow = true
  group.add(soil)

  const twigGeo = new THREE.CylinderGeometry(0.012, 0.018, 0.28, 5)
  const twigMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 1 })
  for (let i = 0; i < 7; i++) {
    const twig = new THREE.Mesh(twigGeo, twigMat)
    const a = Math.random() * Math.PI * 2
    const r = 0.45 + Math.random() * 0.4
    twig.position.set(Math.cos(a) * r, 0.12, Math.sin(a) * r)
    twig.rotation.set(1.1 + Math.random() * 0.5, a, Math.random() * 0.6)
    twig.castShadow = true
    group.add(twig)
  }

  const sporeCount = 140
  const seeds = new Float32Array(sporeCount)
  const sizes = new Float32Array(sporeCount)
  const pos = new Float32Array(sporeCount * 3)
  for (let i = 0; i < sporeCount; i++) {
    seeds[i] = Math.random()
    sizes[i] = 2.2 + Math.random() * 4
  }
  const sporeGeo = new THREE.BufferGeometry()
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  sporeGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  sporeGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  group.add(
    new THREE.Points(
      sporeGeo,
      new THREE.ShaderMaterial({
        uniforms: { uTime: glowCrystalMat.uniforms.uTime },
        vertexShader: sporeVertex,
        fragmentShader: sporeFragment,
        transparent: true,
        depthWrite: false,
      }),
    ),
  )

  const light = new THREE.PointLight(0x6aaa58, 1.8, 4.5, 2)
  light.position.set(0.08, 1.5, 0)
  group.add(light)

  group.userData.update = (t) => {
    glowCrystalMat.uniforms.uTime.value = t
    boulder.rotation.y = Math.sin(t * 0.1) * 0.03
    moss.rotation.y = boulder.rotation.y
    cluster.rotation.y = t * 0.28
    cluster.position.y = 1.4 + Math.sin(t * 1.4) * 0.02
    light.intensity = 1.6 + Math.sin(t * 1.6) * 0.2
  }

  return group
}
