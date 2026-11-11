import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createFire } from './elements/fire.js'
import { createWater } from './elements/water.js'
import { createEarth } from './elements/earth.js'
import { createAir } from './elements/air.js'

const canvas = document.querySelector('#scene')
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
})
renderer.setClearColor(0x050806, 1)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.25

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x050806, 0.028)
scene.background = new THREE.Color(0x050806)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(8.5, 5.8, 8.5)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 4
controls.maxDistance = 18
controls.maxPolarAngle = Math.PI * 0.48
controls.target.set(0, 1.1, 0)

scene.add(new THREE.AmbientLight(0x6f7f72, 0.55))
scene.add(new THREE.HemisphereLight(0xb7c9b4, 0x1a1510, 0.65))

const key = new THREE.DirectionalLight(0xfff4e5, 0.85)
key.position.set(4, 8, 2)
scene.add(key)

const fill = new THREE.DirectionalLight(0xa8d4ff, 0.35)
fill.position.set(-5, 3, -4)
scene.add(fill)

createEnvironment(scene)

const radius = 3.25
const elements = {
  fire: createFire(new THREE.Vector3(radius, 0, 0)),
  water: createWater(new THREE.Vector3(0, 0, radius)),
  earth: createEarth(new THREE.Vector3(-radius, 0, 0)),
  air: createAir(new THREE.Vector3(0, 0, -radius)),
}

Object.values(elements).forEach((el) => scene.add(el))

const nexus = createNexus(scene)
createEnergyArcs(scene)

const focusTargets = {
  fire: elements.fire.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
  water: elements.water.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
  earth: elements.earth.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
  air: elements.air.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
  all: new THREE.Vector3(0, 1.1, 0),
}

let focusKey = 'all'
let focusLerp = 1

document.querySelectorAll('[data-focus]').forEach((btn) => {
  btn.addEventListener('click', () => {
    focusKey = btn.dataset.focus
    focusLerp = 0
  })
})

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.05)
  const t = clock.elapsedTime

  Object.values(elements).forEach((el) => el.userData.update?.(t, dt))
  nexus.userData.update(t)

  if (focusLerp < 1) {
    focusLerp = Math.min(1, focusLerp + dt * 1.5)
    const ease = 1 - (1 - focusLerp) ** 3
    const target = focusTargets[focusKey]
    controls.target.lerp(target, ease * 0.15)
    if (focusKey !== 'all') {
      const desired = target.clone().add(new THREE.Vector3(2.8, 2.2, 2.8))
      camera.position.lerp(desired, ease * 0.08)
    }
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

window.addEventListener('resize', () => {
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
})

function createEnvironment(target) {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 64),
    new THREE.MeshStandardMaterial({
      color: 0x0c1210,
      roughness: 0.92,
      metalness: 0.08,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.02
  target.add(floor)

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(4.6, 4.75, 64),
    new THREE.MeshBasicMaterial({
      color: 0x6f8f78,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.01
  target.add(ring)

  const stars = new THREE.BufferGeometry()
  const starCount = 900
  const starPos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const r = 18 + Math.random() * 25
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.7 + 2
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  stars.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  target.add(
    new THREE.Points(
      stars,
      new THREE.PointsMaterial({
        color: 0xcfe6d8,
        size: 0.04,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    ),
  )
}

function createNexus(target) {
  const nexus = new THREE.Group()

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0xe8ffe8,
      emissive: 0x88aa88,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.85,
      roughness: 0.15,
      metalness: 0.2,
      transmission: 0.4,
    }),
  )
  core.position.y = 1.1
  nexus.add(core)

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.02, 12, 64),
    new THREE.MeshBasicMaterial({
      color: 0xb7d8c0,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  halo.position.y = 1.1
  halo.rotation.x = Math.PI / 2.4
  nexus.add(halo)

  const light = new THREE.PointLight(0xcfe8d4, 2.2, 8, 2)
  light.position.y = 1.2
  nexus.add(light)

  target.add(nexus)

  nexus.userData.update = (t) => {
    core.rotation.y = t * 0.6
    core.rotation.x = t * 0.35
    core.scale.setScalar(1 + Math.sin(t * 2) * 0.06)
    halo.rotation.z = t * 0.4
    light.intensity = 2 + Math.sin(t * 2.5) * 0.4
  }

  return nexus
}

function createEnergyArcs(target) {
  const colors = [0xff6a2a, 0x3db8ff, 0x8fbf4a, 0xd7f3ff]
  const positions = [
    elements.fire.position,
    elements.water.position,
    elements.earth.position,
    elements.air.position,
  ]

  for (let i = 0; i < 4; i++) {
    const start = positions[i].clone()
    start.y = 1.1
    const end = new THREE.Vector3(0, 1.1, 0)
    const mid = start.clone().lerp(end, 0.5)
    mid.y += 0.55

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    target.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.012, 8, false),
        new THREE.MeshBasicMaterial({
          color: colors[i],
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    )
  }
}
