import * as THREE from 'three'

let softTexture = null

function getSoftTexture() {
  if (softTexture) return softTexture
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.7)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  softTexture = new THREE.CanvasTexture(canvas)
  softTexture.colorSpace = THREE.SRGBColorSpace
  return softTexture
}

export function createParticleField({
  count,
  size,
  color,
  opacity = 0.85,
  blending = THREE.AdditiveBlending,
  depthWrite = false,
}) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const lifetimes = new Float32Array(count)
  const seeds = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = 0
    positions[i * 3 + 2] = 0
    lifetimes[i] = Math.random()
    seeds[i] = Math.random() * Math.PI * 2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aLife', new THREE.BufferAttribute(lifetimes, 1))

  const material = new THREE.PointsMaterial({
    color,
    size,
    map: getSoftTexture(),
    transparent: true,
    opacity,
    blending,
    depthWrite,
    sizeAttenuation: true,
    alphaMap: getSoftTexture(),
  })

  const points = new THREE.Points(geometry, material)
  points.userData = { velocities, lifetimes, seeds, count }

  return points
}

export function createGlowSprite(color, scale = 2.4) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
  gradient.addColorStop(0.35, color)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.setScalar(scale)
  return sprite
}
