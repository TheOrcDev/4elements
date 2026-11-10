import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createFire } from './elements/fire.js'
import { createWater } from './elements/water.js'
import { createEarth } from './elements/earth.js'
import { createAir } from './elements/air.js'

const canvas = document.querySelector('#scene')
const legendButtons = [...document.querySelectorAll('[data-element]')]

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x090a0c)
scene.fog = new THREE.FogExp2(0x090a0c, 0.028)

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(9.5, 6.2, 10.5)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 4
controls.maxDistance = 18
controls.maxPolarAngle = Math.PI * 0.48
controls.target.set(0, 1.2, 0)

const hemi = new THREE.HemisphereLight(0xb8c4d4, 0x1a1612, 0.55)
scene.add(hemi)

const key = new THREE.DirectionalLight(0xfff2e0, 1.15)
key.position.set(5, 10, 4)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
key.shadow.camera.near = 1
key.shadow.camera.far = 30
key.shadow.camera.left = -12
key.shadow.camera.right = 12
key.shadow.camera.top = 12
key.shadow.camera.bottom = -12
scene.add(key)

const fill = new THREE.DirectionalLight(0x8eb8ff, 0.35)
fill.position.set(-6, 4, -3)
scene.add(fill)

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(14, 96),
  new THREE.MeshStandardMaterial({
    color: 0x101218,
    metalness: 0.65,
    roughness: 0.4,
  }),
)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

const floorGlow = new THREE.Mesh(
  new THREE.RingGeometry(3.8, 6.2, 64),
  new THREE.MeshBasicMaterial({
    color: 0x2a3340,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
)
floorGlow.rotation.x = -Math.PI / 2
floorGlow.position.y = 0.015
scene.add(floorGlow)

const rune = new THREE.Mesh(
  new THREE.RingGeometry(2.55, 2.62, 80),
  new THREE.MeshBasicMaterial({
    color: 0xd8c7a0,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  }),
)
rune.rotation.x = -Math.PI / 2
rune.position.y = 0.02
scene.add(rune)

const spacing = 3.35
const elements = {
  fire: createFire(),
  water: createWater(),
  earth: createEarth(),
  air: createAir(),
}

elements.fire.position.set(-spacing, 0, -spacing)
elements.water.position.set(spacing, 0, -spacing)
elements.earth.position.set(-spacing, 0, spacing)
elements.air.position.set(spacing, 0, spacing)

Object.values(elements).forEach((el) => scene.add(el))

const labels = createLabels()
scene.add(labels)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.32,
  0.8,
  0.88,
)
composer.addPass(bloom)
composer.addPass(new OutputPass())

const timer = new THREE.Timer()
timer.connect(document)
const focusTarget = new THREE.Vector3(0, 1.2, 0)
const cameraGoal = new THREE.Vector3().copy(camera.position)
let autoOrbit = true
let focused = null

legendButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.element
    focusElement(name)
    legendButtons.forEach((b) => b.classList.toggle('is-active', b === btn))
  })
})

controls.addEventListener('start', () => {
  autoOrbit = false
})

function focusElement(name) {
  const el = elements[name]
  if (!el) return
  focused = name
  autoOrbit = false
  const worldFocus = el.position.clone().add(el.userData.focusPoint)
  focusTarget.copy(worldFocus)
  const offset = new THREE.Vector3(2.8, 2.1, 3.2)
  if (name === 'water') offset.set(-2.8, 2.1, 3.2)
  if (name === 'earth') offset.set(2.8, 2.1, -3.0)
  if (name === 'air') offset.set(-2.8, 2.1, -3.0)
  cameraGoal.copy(worldFocus).add(offset)
}

function createLabels() {
  const group = new THREE.Group()
  const entries = [
    ['FIRE', elements.fire.position, '#ff6a2b'],
    ['WATER', elements.water.position, '#3db7ff'],
    ['EARTH', elements.earth.position, '#c4a35a'],
    ['AIR', elements.air.position, '#b8d4c8'],
  ]

  entries.forEach(([text, pos, color]) => {
    const sprite = makeTextSprite(text, color)
    sprite.position.set(pos.x, 3.15, pos.z)
    group.add(sprite)
  })
  return group
}

function makeTextSprite(text, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = '700 54px Syne, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 12
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.9,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2.2, 0.55, 1)
  return sprite
}

function onResize() {
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  composer.setSize(w, h)
  bloom.setSize(w, h)
}

window.addEventListener('resize', onResize)

function animate() {
  requestAnimationFrame(animate)
  timer.update()
  const dt = Math.min(timer.getDelta(), 0.05)
  const t = timer.getElapsed()

  Object.values(elements).forEach((el) => el.userData.update?.(t, dt))

  rune.rotation.z = t * 0.08
  floorGlow.rotation.z = -t * 0.05

  if (autoOrbit) {
    const radius = 13.2
    const angle = t * 0.12
    camera.position.x = Math.cos(angle) * radius
    camera.position.z = Math.sin(angle) * radius
    camera.position.y = 6.2 + Math.sin(t * 0.35) * 0.35
    controls.target.lerp(new THREE.Vector3(0, 1.2, 0), 0.05)
  } else {
    camera.position.lerp(cameraGoal, 0.045)
    controls.target.lerp(focusTarget, 0.06)
  }

  controls.update()
  composer.render()
}

animate()
