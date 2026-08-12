import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createEnvironment } from './scene/environment.js'
import { createFire } from './elements/fire.js'
import { createAir } from './elements/air.js'
import { createWater } from './elements/water.js'
import { createEarth } from './elements/earth.js'

const canvas = document.querySelector('#scene')
const loader = document.querySelector('#loader')
const dock = document.querySelector('#dock')

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.92
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const scene = new THREE.Scene()
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.environmentIntensity = 0.32
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120)
camera.position.set(0, 5.4, 11.4)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 3.2
controls.maxDistance = 18
controls.maxPolarAngle = Math.PI * 0.48
controls.target.set(0, 1.15, 0)

const { pedestals, stars, ring, sigil } = createEnvironment(scene)

const placements = [
  { name: 'fire', factory: createFire, angle: -Math.PI / 4, color: 0xff6a1a },
  { name: 'air', factory: createAir, angle: (3 * Math.PI) / 4, color: 0xb7e3ff },
  { name: 'water', factory: createWater, angle: Math.PI / 4, color: 0x2ad0ff },
  { name: 'earth', factory: createEarth, angle: (-3 * Math.PI) / 4, color: 0x5dff9a },
]

const radius = 3.55
const elements = {}

placements.forEach((item, i) => {
  const x = Math.cos(item.angle) * radius
  const z = Math.sin(item.angle) * radius
  pedestals[i].position.set(x, 0.09, z)

  const el = item.factory()
  el.position.set(x, 0.18, z)
  scene.add(el)
  elements[item.name] = {
    object: el,
    position: new THREE.Vector3(x, 1.15, z),
    color: item.color,
  }
})

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.18,
  0.4,
  0.72,
)
composer.addPass(bloom)
composer.addPass(new OutputPass())
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const views = {
  overview: {
    camera: new THREE.Vector3(0, 5.4, 11.4),
    target: new THREE.Vector3(0, 1.15, 0),
    bloom: 0.18,
  },
  fire: {
    camera: new THREE.Vector3(
      elements.fire.position.x + 2.2,
      2.35,
      elements.fire.position.z + 3.1,
    ),
    target: elements.fire.position.clone().setY(1.15),
    bloom: 0.28,
  },
  air: {
    camera: new THREE.Vector3(
      elements.air.position.x + 2.35,
      2.5,
      elements.air.position.z + 2.9,
    ),
    target: elements.air.position.clone().setY(1.25),
    bloom: 0.16,
  },
  water: {
    camera: new THREE.Vector3(
      elements.water.position.x + 2.25,
      2.2,
      elements.water.position.z + 2.95,
    ),
    target: elements.water.position.clone().setY(0.95),
    bloom: 0.2,
  },
  earth: {
    camera: new THREE.Vector3(
      elements.earth.position.x + 2.25,
      2.3,
      elements.earth.position.z + 3.05,
    ),
    target: elements.earth.position.clone().setY(1.05),
    bloom: 0.12,
  },
}

let guiding = true
const goalCam = views.overview.camera.clone()
const goalTarget = views.overview.target.clone()
let goalBloom = views.overview.bloom

function focus(name) {
  const view = views[name]
  if (!view) return
  guiding = true
  goalCam.copy(view.camera)
  goalTarget.copy(view.target)
  goalBloom = view.bloom
  dock.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === name)
  })
}

controls.addEventListener('start', () => {
  guiding = false
})

dock.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-view]')
  if (btn) focus(btn.dataset.view)
})

window.addEventListener('keydown', (event) => {
  const map = { 0: 'overview', 1: 'fire', 2: 'air', 3: 'water', 4: 'earth' }
  if (map[event.key]) focus(map[event.key])
})

window.addEventListener('resize', () => {
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  composer.setSize(w, h)
  bloom.setSize(w, h)
})

const clock = new THREE.Clock()

function tick() {
  const t = clock.getElapsedTime()
  Object.values(elements).forEach(({ object }) => object.userData.update?.(t))
  stars.rotation.y = t * 0.008
  ring.rotation.z = t * 0.03
  sigil.rotation.z = -t * 0.05

  if (guiding) {
    camera.position.lerp(goalCam, 0.045)
    controls.target.lerp(goalTarget, 0.06)
    if (camera.position.distanceTo(goalCam) < 0.04) guiding = false
  }
  bloom.strength += (goalBloom - bloom.strength) * 0.04
  controls.update()
  composer.render()
  requestAnimationFrame(tick)
}

requestAnimationFrame(() => {
  loader.classList.add('is-gone')
  tick()
})
